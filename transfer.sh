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

# ANCHOR create KEYS
# function: create_key()
# description: Creates correctly formatted JSON keys out of plain text
# params: current format, new format, line number, char range
create_key() {
    gsed -i "s/-   $1/$2/" "$CONV/$TICKET.txt"
    awk "NR==$3" "$CONV/$TICKET.txt" >"$CONV/$2.txt"
    KEY=$(cut -c "$4" "$CONV/$2.txt")
    KEYS+=("\"$KEY\"")
}

# ANCHOR create values
# function create_value()
# description: uses previously created files generate valid JSON values
# params: filename, char range, type, append line
create_value() {
    VALUE=$(cut -c "$2" "$CONV/$1.txt")

    if [ "$VALUE" = "" ]; then
        VALS+=("\"N/A\"")
    elif [ "$3" = "string" ]; then
        VALS+=("\"$VALUE\"")
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
# remove lines '#'
grep -o '^[^#]*' "$ORIG/$TICKET.md" >"$CONV/$TICKET.md"
# remove comments
pandoc -o "$CONV/$TICKET-e.txt" "$CONV/$TICKET.md" --strip-comments --wrap=none
# remove pandoc html artifacts
grep -o '^[^`|^<]*' "$CONV/$TICKET-e.txt" >"$CONV/$TICKET-m.txt"
# remove white space
grep "\S" "$CONV/$TICKET-m.txt" >"$CONV/$TICKET.txt"
# remove tmp txt files
rm "$CONV/$TICKET.md" "$CONV/$TICKET-e.txt" "$CONV/$TICKET-m.txt"

# ANCHOR create rest of keys
create_key "Application engineer" "AER" 2 "1-3"
create_key "Customer" "customer" 3 "1-8"
create_key "Date" "dateClosed" 4 "1-10"
create_key "Version" "version" 5 "1-7"
create_key "Deployment" "deployment" 6 "1-10"
create_key "External Services" "externalServices" 7 "1-16"
create_key "Auth Providers" "authProviders" 8 "1-13"
create_key "Slack Links" "slackLinks" 9 "1-10"
create_key "GitHub Issue Link" "githubIssueLink" 10 "1-15"
create_key "Doc Update Link" "docUpdateLink" 11 "1-13"
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
VALS+=("\"Sample summary for now\"")

# Create key value pairs and push them to json file
length=${#KEYS[@]}
touch "$CONV/json/$TICKET.json"

echo "Length of the KEYS array: ${#KEYS[@]}"
echo "Length of the VALS array: ${#VALS[@]}"

for ((i = 0; i < length; i++)); do
    if [ "$i" -eq 0 ]; then
        echo "{" >>"$CONV/json/$TICKET.json"
    fi

    if [ "$i" -ne 13 ]; then
        echo "${KEYS[$i]}: ${VALS[$i]}," >>"$CONV/json/$TICKET.json"
    else
        echo "${KEYS[$i]}: ${VALS[$i]}" >>"$CONV/json/$TICKET.json"
        echo "}" >>"$CONV/json/$TICKET.json"
    fi
done

exit 0
