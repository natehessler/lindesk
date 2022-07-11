#! /bin/bash

mkdir ./resolved-tickets/converted
touch ./resolved-tickets/converted/keyval.txt
KEYVALS=./resolved-tickets/converted/keyval.txt

ORIG=./resolved-tickets
CONV=./resolved-tickets/converted

# delete empty lines
# grep "\S" "$ORIG/2935.md"

pandoc -o "$CONV/2935.txt" "$ORIG/2935.md" --strip-comments --wrap=none

# FORMAT ticket number key:value
awk 'NR==3' "$CONV/2935.txt" >"$CONV/ticketnumber.txt"
TICKET_NUMBER=$(cut -c 21-24 "$CONV/ticketnumber.txt")
rm "$CONV/ticketnumber.txt"
echo "\"zendeskTicketNumber\": $TICKET_NUMBER," >>$KEYVALS

#FORMAT ticket link key:value
awk 'NR==3' "$CONV/2935.txt" >"$CONV/ticketlink.txt"
TICKET_LINK=$(cut -c 26- "$CONV/ticketlink.txt")
rm "$CONV/ticketlink.txt"
echo "\"zendeskLink\": \"$TICKET_LINK\"," >>$KEYVALS

# FORMAT title key:value
awk 'NR==1' "$CONV/2935.txt" >"$CONV/title.txt"
TITLE=$(cut -c 3- "$CONV/title.txt")
rm "$CONV/title.txt"
echo "\"title\": \"$TITLE\"," >>$KEYVALS

# remove lines '#'
# grep -o '^[^#]*' "$ORIG/2935.md" >"$CONV/2935.md"
# pandoc -o "$CONV/2935.txt" "$CONV/2935.md" --strip-comments --wrap=none
# rm "$CONV/2935.md"

# pandoc -o "$CONV/2935.txt" "$CONV/2935.md" --strip-comments --wrap=none

# echo | awk '/:/ {print}' "$ORIG/2935.md" >"$CONV/2935.txt"
# gsed -i "1s/.*/$firstline/" "$CONV/2935.txt"
# sed -n 's/- Zendesk Link/&"zendeskLink"/' "$CONV/2935.txt"
# sed -n 's/- Application engineer/"AER"/' "$CONV/2935.txt"
# sed 's/- Customer/"customer"/' "$CONV/2935.txt"
# sed 's/- Date/"dateClosed"/' "$CONV/2935.txt"
# sed 's/- Version/"version"/' "$CONV/2935.txt"
# sed 's/- Deployment/"deployment"/' "$CONV/2935.txt"
# sed 's/- External Services/"externalServices"/' "$CONV/2935.txt"
# sed 's/- Auth Providers/"authProviders"/' "$CONV/2935.txt"
# sed 's/- Slack Links/"slackLinks"/' "$CONV/2935.txt"
# sed 's/- GitHub Issue Link/"githubIssueLink"/' "$CONV/2935.txt"
# sed 's/- Doc Update Link/"docUpdateLink"/' "$CONV/2935.txt"

# extract ticket number and create zendeskTicketNumberField
# echo '"zendeskTicketNumber": 2935,' "$CONV/2935.txt"

# CLEAN UP
# echo "====================================="
# cat "$CONV/2935.txt"
# rm -rf $CONV
# cat "$CONV/2935.txt"
