#! /bin/bash
set -e

if [ ! -d ./converted-resolved-tickets ]; then
    mkdir ./converted-resolved-tickets
fi

if [ ! -d ./converted-resolved-tickets/key-vals ]; then
    mkdir ./converted-resolved-tickets/key-vals
fi

if [ ! -d ./converted-resolved-tickets/text ]; then
    mkdir ./converted-resolved-tickets/text
fi

if [ -f "./converted-resolved-tickets/text/$1.txt" ]; then
    echo "File already exists at ./converted-resolved-tickets/text/$1.txt"
    exit 1
fi

ORIG=./resolved-tickets
CONV=./converted-resolved-tickets
TICKET="$1"
KV="kv-$1"
# KEYS=()
# VALS=()

echo "============== TICKET $1 ==============="
# # ANCHOR create KEYS
# # function: create_key()
# # description: Creates correctly formatted JSON keys out of plain text
# # params: current format, new format, line number, char range, alt char range, alt current format
# create_key() {
#     echo "create key function"
# }

# # ANCHOR create values
# # function create_value()
# # description: uses previously created files generate valid JSON values
# # params: filename, char range, type, append line, alt char range
# create_value() {
#     echo "create value function"
# }

pandoc -o "$CONV/text/$TICKET.txt" "$ORIG/$TICKET.md" --strip-comments --wrap=none

# ANCHOR Prepare key-value pairs that need special treatment
# format ticket number key:value
awk 'NR==3' "$CONV/text/$TICKET.txt" >"$CONV/ticketnumber.txt"
CHECK="$(cut -c 5 "$CONV/ticketnumber.txt")"

if [ ! "$CHECK" = "*" ]; then
    TICKET_NUMBER=$(cut -c 21-24 "$CONV/ticketnumber.txt")
    echo "zendeskTicketNumber: $TICKET_NUMBER" >>"$CONV/key-vals/$KV.txt"
else
    TICKET_NUMBER=$(cut -c 25-28 "$CONV/ticketnumber.txt")
    echo "zendeskTicketNumber: $TICKET_NUMBER" >>"$CONV/key-vals/$KV.txt"
fi

rm "$CONV/ticketnumber.txt"

# format ticket link key:value
awk 'NR==3' "$CONV/text/$TICKET.txt" >"$CONV/ticketlink.txt"

if [ ! "$CHECK" = "*" ]; then
    TICKET_LINK=$(cut -c 27-76 "$CONV/ticketlink.txt")
    echo "zendeskLink: $TICKET_LINK" >>"$CONV/key-vals/$KV.txt"
else
    TICKET_LINK=$(cut -c 31-80 "$CONV/ticketlink.txt")
    echo "zendeskLink: $TICKET_LINK" >>"$CONV/key-vals/$KV.txt"
fi

rm "$CONV/ticketlink.txt"

# format title key:value
awk 'NR==1' "$CONV/text/$TICKET.txt" >"$CONV/title.txt"
TITLE=$(cut -c 3- "$CONV/title.txt")

if [ "${TITLE: -10}" = " \`\`{=html}" ]; then
    TITLE_EDIT=${TITLE%??????????}
    echo "title: $TITLE_EDIT" >>"$CONV/key-vals/$KV.txt"
else
    echo "title: $TITLE" >>"$CONV/key-vals/$KV.txt"
fi

rm "$CONV/title.txt"

# ANCHOR Prepare the rest of the document for conversion to key-value pairs
grep -o '^[^#]*' "$ORIG/$TICKET.md" >"$CONV/$TICKET.md"
pandoc -o "$CONV/$TICKET-e.txt" "$CONV/$TICKET.md" --strip-comments --wrap=none
grep -o '^[^`|^<]*' "$CONV/$TICKET-e.txt" >"$CONV/$TICKET-m.txt"
grep "\S" "$CONV/$TICKET-m.txt" >"$CONV/text/$TICKET.txt"
rm "$CONV/$TICKET.md" "$CONV/$TICKET-e.txt" "$CONV/$TICKET-m.txt"
awk 'NR>1' "$CONV/text/$TICKET.txt" >tmp.txt && mv tmp.txt "$CONV/text/$TICKET.txt"

# check line 3 for date
awk 'NR==3' "$CONV/text/$TICKET.txt" >"$CONV/line_3_check.txt"
NO_AST_CHARS=$(cut -c 5-8 "$CONV/line_3_check.txt")
AST_CHARS=$(cut -c 7-10 "$CONV/line_3_check.txt")

# Make sure date exists. If not, add it.
if [ "$AST_CHARS" = "Vers" ]; then
    t=$(mktemp)
    gsed '3i-   **Date:** 28 October 2021' "$CONV/text/$TICKET.txt" >"$t" && mv "$t" "$CONV/text/$TICKET.txt"
elif [ "$NO_AST_CHARS" = "Vers" ]; then
    t=$(mktemp)
    gsed '3i-   Date: 28 October 2021' "$CONV/text/$TICKET.txt" >"$t" && mv "$t" "$CONV/text/$TICKET.txt"
fi

HAS_AST="$(cut -c 5 "$CONV/line_3_check.txt")"
rm "$CONV/line_3_check.txt"

if [ "$HAS_AST" = '*' ]; then
    head -10 "$CONV/text/$TICKET.txt" >>"$CONV/text/first-keys.txt"
    echo "$CONV/text/first-keys.txt" | tr -d "*"

    for ((i = 1; i < 11; i++)); do
        awk "NR==$i" "$CONV/text/first-keys.txt" >"$CONV/text/$i.txt"
        cat <"$CONV/text/$i.txt" | tr -d "*" >"$CONV/text/no-ast-keys.txt"
        sed 's/^.\{4\}//g' "$CONV/text/no-ast-keys.txt" >>"$CONV/key-vals/$KV.txt"
        rm "$CONV/text/$i.txt"
    done
    rm "$CONV/text/no-ast-keys.txt"
else
    head -10 "$CONV/text/$TICKET.txt" >>"$CONV/text/first-keys.txt"
    # cat <"$CONV/text/first-keys.txt" | tr -d "*"

    for ((i = 1; i < 11; i++)); do
        awk "NR==$i" "$CONV/text/first-keys.txt" >"$CONV/text/$i.txt"
        cat <"$CONV/text/$i.txt" | tr -d "*" >"$CONV/text/ast-keys.txt"
        sed 's/^.\{4\}//g' "$CONV/text/ast-keys.txt" >>"$CONV/key-vals/$KV.txt"
        rm "$CONV/text/$i.txt"
    done
    rm "$CONV/text/ast-keys.txt"
fi

rm "$CONV/text/first-keys.txt"

echo "Summary: $(tail +11 "$CONV/text/$TICKET.txt")" >>"$CONV/key-vals/$KV.txt"
mv "$CONV/key-vals/$KV.txt" "$CONV/key-vals/$TICKET.txt"

# # ANCHOR create rest of keys
# create_key "Application engineer" "AER" 1 "5-24" "7-9" "CSE"
# create_key "Customer" "customer" 2 "5-12" "7-14"
# create_key "Date" "dateClosed" 3 "5-8" "7-10"
# create_key "Version" "version" 4 "5-11" "7-13"
# create_key "Deployment" "deployment" 5 "5-14" "7-16"
# create_key "External Services" "externalServices" 6 "5-21" "7-23"
# create_key "Auth Providers" "authProviders" 7 "5-18" "7-20"
# create_key "Slack Links" "slackLinks" 8 "5-15" "7-17"
# create_key "GitHub Issue Link" "githubIssueLink" 9 "5-21" "7-23"
# create_key "Doc Update Link" "docUpdateLink" 10 "5-19" "7-21"
# KEYS+=("\"summary\"")

# # ANCHOR create rest of vals
# create_value "AER" "6-" "string"
# create_value "customer" "11-" "string"
# create_value "dateClosed" "13-" "string"
# create_value "version" "10-" "string"
# create_value "deployment" "13-" "string"
# create_value "externalServices" "19-" "array"
# create_value "authProviders" "16-" "array"
# create_value "slackLinks" "13-" "array"
# create_value "githubIssueLink" "18-" "string"
# create_value "docUpdateLink" "16-" "string"
# VALS+=("\"$(tail +11 "$CONV/$TICKET.txt")\"")

# # Create key value pairs and push them to json file
# length=${#KEYS[@]}
# touch "$CONV/json/$TICKET.json"

# for ((i = 0; i < length; i++)); do
#     PAIR="${KEYS[$i]}: ${VALS[$i]},"

#     if [ "$i" -eq 0 ]; then
#         echo "{" >>"$CONV/json/$TICKET.json"
#     fi

#     if [ "$i" -ne 13 ]; then
#         echo "$PAIR" >>"$CONV/json/$TICKET.json"
#     else
#         {
#             echo "$PAIR"
#             echo "\"importedTicket\": true"
#         } >>"$CONV/json/$TICKET.json"

#         echo "}" >>"$CONV/json/$TICKET.json"
#     fi
# done

exit 0
