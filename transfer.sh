#! /bin/bash
# this script pre-processes one ticket.md file to a text file
# do not delete!

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

gsed -i 's/CSE/Application engineer/' "$CONV/text/$TICKET.txt"

# conditional to check if md file uses * in it's formating
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

exit 0
