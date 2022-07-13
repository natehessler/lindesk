#! /bin/bash
set -e

if [ ! -d ./converted-resolved-tickets ]; then
    mkdir ./converted-resolved-tickets
fi

if [ ! -d ./converted-resolved-tickets/json ]; then
    mkdir ./converted-resolved-tickets/json
fi

if [ -f "./converted-resolved-tickets/$1.txt" ]; then
    echo "File already exists at ./converted-resolved-tickets/$1.txt"
    exit 1
fi

ORIG=./resolved-tickets
CONV=./converted-resolved-tickets
TICKET="$1"
KEYS=()
VALS=()

echo "============== TICKET $1 ==============="
# ANCHOR create KEYS
# function: create_key()
# description: Creates correctly formatted JSON keys out of plain text
# params: current format, new format, line number, char range, alt char range, alt current format
create_key() {
    if [ -n "$6" ]; then
        CSE_OR_AER=$(awk "NR==$3" "$CONV/$TICKET.txt")
        echo "$CSE_OR_AER" >"$CONV/$2-test.txt"

        if [ "$(awk "NR==1" "$CONV/$2-test.txt")" = "A" ]; then
            gsed -i "s/-   $1/$2/" "$CONV/$TICKET.txt"
        elif [ "$(awk "NR==1" "$CONV/$2-test.txt")" = "*" ]; then
            gsed -i "s/-   $6/$2/" "$CONV/$TICKET.txt"
        fi
        rm "$CONV/$2-test.txt"
    fi

    KEY_NEW=$(awk "NR==$3" "$CONV/$TICKET.txt")
    echo "$KEY_NEW" >"$CONV/$2.txt"

    if [ "$(cut -c 5 "$CONV/$2.txt")" = "*" ]; then
        KEY=$(cut -c "$5" "$CONV/$2.txt")
    else
        KEY=$(cut -c "$4" "$CONV/$2.txt")
    fi

    echo "$KEY" >>keys.txt
    KEYS+=("\"$KEY\"")
}

# ANCHOR create values
# function create_value()
# description: uses previously created files generate valid JSON values
# params: filename, char range, type, append line, alt char range
create_value() {
    # VALUE=$(cut -c "$2" "$CONV/$1.txt")
    # echo "$VALUE"
    # AST_FLAG=false

    if [ "$3" = "string" ]; then
        if [ "$VALUE" = "" ]; then
            VALS+=("\"N/A\"")
        else
            VALS+=("\"$VALUE\"")
        fi
    elif [ "$3" = "number" ]; then
        VALS+=("$VALUE")
    elif [ "$3" = "array" ]; then
        gsed -i 's/,/ /' "$CONV/$1.txt"
        ARRAY_VAL=$(cut -c "$2" "$CONV/$1.txt")
        IFS=' '
        read -r -a arr <<<"$ARRAY_VAL"

        VALUE=$(printf '%s\n' "${arr[@]}" | jq -R . | jq -s .)
        VALS+=("$VALUE")
    fi

    rm -rf "$CONV/$1.txt"
}

pandoc -o "$CONV/$TICKET.txt" "$ORIG/$TICKET.md" --strip-comments --wrap=none

# ANCHOR Prepare key-value pairs that need special treatment
# format ticket number key:value
awk 'NR==3' "$CONV/$TICKET.txt" >"$CONV/ticketnumber.txt"
TICKET_NUMBER=$(cut -c 21-24 "$CONV/ticketnumber.txt")
KEYS+=("\"zendeskTicketNumber\"")
VALS+=("$TICKET_NUMBER")
rm "$CONV/ticketnumber.txt"

# format ticket link key:value
awk 'NR==3' "$CONV/$TICKET.txt" >"$CONV/ticketlink.txt"
TICKET_LINK=$(cut -c 27-76 "$CONV/ticketlink.txt")
KEYS+=("\"zendeskLink\"")
VALS+=("\"$TICKET_LINK\"")
rm "$CONV/ticketlink.txt"

# format title key:value
awk 'NR==1' "$CONV/$TICKET.txt" >"$CONV/title.txt"
TITLE=$(cut -c 3- "$CONV/title.txt")
TITLE_EDIT=${TITLE%??????????}
KEYS+=("\"title\"")
VALS+=("\"$TITLE_EDIT\"")
rm "$CONV/title.txt"

# ANCHOR Prepare the rest of the document for conversion to json key-value pairs
# remove lines starting with '#'
grep -o '^[^#]*' "$ORIG/$TICKET.md" >"$CONV/$TICKET.md"
# remove comments
pandoc -o "$CONV/$TICKET-e.txt" "$CONV/$TICKET.md" --strip-comments --wrap=none
# remove pandoc html artifacts
grep -o '^[^`|^<]*' "$CONV/$TICKET-e.txt" >"$CONV/$TICKET-m.txt"
# echo "-   Zendesk Link: \\["
# remove white space
grep "\S" "$CONV/$TICKET-m.txt" >"$CONV/$TICKET.txt"
# remove tmp txt files
rm "$CONV/$TICKET.md" "$CONV/$TICKET-e.txt" "$CONV/$TICKET-m.txt"
# remove zendesk link first line in ticket.txt
awk 'NR>1' "$CONV/$TICKET.txt" >tmp.txt && mv tmp.txt "$CONV/$TICKET.txt"

# check line 3 for date
awk 'NR==3' "$CONV/$TICKET.txt" >"$CONV/line_3_check.txt"
NO_AST_CHARS=$(cut -c 5-8 "$CONV/line_3_check.txt") # reads "Vers" or "**Ve"
AST_CHARS=$(cut -c 7-10 "$CONV/line_3_check.txt")   # reads "Vers" or "**Ve"

# if line 3 isn't "Date", insert a date in line 3
# this is absolutely necessary. Script will break otherwise.
if [ "$AST_CHARS" = "Vers" ]; then
    t=$(mktemp)
    gsed '3i-   **Date:** 28 October 2021' "$CONV/$TICKET.txt" >"$t" && mv "$t" "$CONV/$TICKET.txt"
elif [ "$NO_AST_CHARS" = "Vers" ]; then
    t=$(mktemp)
    gsed '3i-   Date: 28 October 2021' "$CONV/$TICKET.txt" >"$t" && mv "$t" "$CONV/$TICKET.txt"
fi

HAS_AST="$(cut -c 5 "$CONV/line_3_check.txt")"
rm "$CONV/line_3_check.txt"

# this condition should be changed. Create a flag for ast or no_ast
if [ "$HAS_AST" = '*' ]; then
    head -10 "$CONV/$TICKET.txt" >>"$CONV/first-keys.txt"
    echo "$CONV/first-keys.txt" | tr -d "*"

    for ((i = 1; i < 11; i++)); do
        awk "NR==$i" "$CONV/first-keys.txt" >"$CONV/$i.txt"
        cat <"$CONV/$i.txt" | tr -d "*" >>"$CONV/no-ast-keys.txt"
        sed 's/^.\{4\}//g' "$CONV/no-ast-keys.txt" >"$CONV/kv-$TICKET.txt"
        rm "$CONV/$i.txt"
    done

    rm "$CONV/first-keys.txt" "$CONV/no-ast-keys.txt"
else
    head -10 "$CONV/$TICKET.txt" >>"$CONV/first-keys.txt"
    echo "$CONV/first-keys.txt" | tr -d "*"

    for ((i = 1; i < 11; i++)); do
        awk "NR==$i" "$CONV/first-keys.txt" >"$CONV/$i.txt"
        cat <"$CONV/$i.txt" | tr -d "*" >>"$CONV/ast-keys.txt"
        sed 's/^.\{4\}//g' "$CONV/ast-keys.txt" >"$CONV/kv-$TICKET.txt"
        rm "$CONV/$i.txt"
    done
    rm "$CONV/first-keys.txt" "$CONV/ast-keys.txt"
fi

# ANCHOR create rest of keys
create_key "Application engineer" "AER" 1 "5-24" "7-9" "CSE"
create_key "Customer" "customer" 2 "5-12" "7-14"
create_key "Date" "dateClosed" 3 "5-8" "7-10"
create_key "Version" "version" 4 "5-11" "7-13"
create_key "Deployment" "deployment" 5 "5-14" "7-16"
create_key "External Services" "externalServices" 6 "5-21" "7-23"
create_key "Auth Providers" "authProviders" 7 "5-18" "7-20"
create_key "Slack Links" "slackLinks" 8 "5-15" "7-17"
create_key "GitHub Issue Link" "githubIssueLink" 9 "5-21" "7-23"
create_key "Doc Update Link" "docUpdateLink" 10 "5-19" "7-21"
KEYS+=("\"summary\"")

# ANCHOR create rest of vals
create_value "AER" "6-" "string"
create_value "customer" "11-" "string"
create_value "dateClosed" "13-" "string"
create_value "version" "10-" "string"
create_value "deployment" "13-" "string"
create_value "externalServices" "19-" "array"
create_value "authProviders" "16-" "array"
create_value "slackLinks" "13-" "array"
create_value "githubIssueLink" "18-" "string"
create_value "docUpdateLink" "16-" "string"
VALS+=("\"$(tail +11 "$CONV/$TICKET.txt")\"")

# Create key value pairs and push them to json file
length=${#KEYS[@]}
touch "$CONV/json/$TICKET.json"

for ((i = 0; i < length; i++)); do
    PAIR="${KEYS[$i]}: ${VALS[$i]},"

    if [ "$i" -eq 0 ]; then
        echo "{" >>"$CONV/json/$TICKET.json"
    fi

    if [ "$i" -ne 13 ]; then
        echo "$PAIR" >>"$CONV/json/$TICKET.json"
    else
        {
            echo "$PAIR"
            echo "\"importedTicket\": true"
        } >>"$CONV/json/$TICKET.json"

        echo "}" >>"$CONV/json/$TICKET.json"
    fi
done

exit 0
