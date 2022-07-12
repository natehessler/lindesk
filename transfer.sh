#! /bin/bash

mkdir ./resolved-tickets/converted
touch ./resolved-tickets/converted/keyval.txt
KEYVALS=./resolved-tickets/converted/keyval.txt

ORIG=./resolved-tickets
CONV=./resolved-tickets/converted
TICKET="2935"

# delete empty lines
# grep "\S" "$ORIG/$TICKET.md"

pandoc -o "$CONV/$TICKET.txt" "$ORIG/$TICKET.md" --strip-comments --wrap=none

# ANCHOR Prepare key-value pairs that need special treatment
# FORMAT ticket number key:value
awk 'NR==3' "$CONV/$TICKET.txt" >"$CONV/ticketnumber.txt"
TICKET_NUMBER=$(cut -c 21-24 "$CONV/ticketnumber.txt")
rm "$CONV/ticketnumber.txt"
echo "\"zendeskTicketNumber\": $TICKET_NUMBER," >>$KEYVALS

#FORMAT ticket link key:value
awk 'NR==3' "$CONV/$TICKET.txt" >"$CONV/ticketlink.txt"
TICKET_LINK=$(cut -c 27-76 "$CONV/ticketlink.txt")
rm "$CONV/ticketlink.txt"
echo "\"zendeskLink\": \"$TICKET_LINK\"," >>$KEYVALS

# FORMAT title key:value
# FIXME need to remove the pandoc artifact at the end of the title
awk 'NR==1' "$CONV/$TICKET.txt" >"$CONV/title.txt"
TITLE=$(cut -c 3- "$CONV/title.txt")
rm "$CONV/title.txt"
echo "\"title\": \"$TITLE\"," >>$KEYVALS

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

# replace doc values with key values corresponding to db
# keeping this line for now but probably not needed
gsed -i 's/-   Zendesk Link/"zendeskLink"/' "$CONV/$TICKET.txt"

# function create_key()
# params: (current format, new format, line number, file name)

create_key() {
    gsed -i "s/-   $1/$2/" "$CONV/$TICKET.txt"
    awk "NR==$3" "$CONV/$TICKET.txt" >"$CONV/$2.txt"
    KEY=$(cut -c "$4" "$CONV/$2.txt")
    rm "$CONV/$2.txt"
    echo "$KEY"
}

# key_args=( ("Application engineer" "AER" 2) ("Customer" "customer" 3) ("Date" "date" 4) )
# echo "${key_args[$1]}"
# ANCHOR create KEYS
# "aer"
create_key "Application engineer" "AER" 2 "1-"
create_key "Customer" "customer" 3 "1-"
create_key "Date" "dateClosed" 4 "1-"
create_key "Version" "version" 5 "1-"
create_key "Deployment" "deployment" 6 "1-"
create_key "External Services" "externalServices" 7 "1-"
create_key "Auth Providers" "authProviders" 8 "1-"
create_key "Slack Links" "slackLinks" 9 "1-"
create_key "GitHub Issue Link" "githubIssueLink" 10 "1-"
create_key "Doc Update Link" "docUpdateLink" 11 "1-"

# gsed -i 's/-   Application engineer/"AER"/' "$CONV/$TICKET.txt"
# awk 'NR==2' "$CONV/$TICKET.txt" >"$CONV/aer.txt"
# AER=$(cut -c 1-5 "$CONV/aer.txt")
# rm "$CONV/aer.txt"
# echo "$AER"

# "customer"
# gsed -i 's/-   Customer/"customer"/' "$CONV/$TICKET.txt"
# awk 'NR==3' "$CONV/$TICKET.txt" >"$CONV/customer.txt"
# customer=$(cut -c 1-10 "$CONV/customer.txt")
# rm "$CONV/customer.txt"
# echo "$customer"

# # "dateClosed"
# gsed -i 's/-   Date/"dateClosed"/' "$CONV/$TICKET.txt"
# awk 'NR==4' "$CONV/$TICKET.txt" >"$CONV/date-closed.txt"
# dateClosed=$(cut -c 1-12 "$CONV/date-closed.txt")
# rm "$CONV/date-closed.txt"
# echo "$dateClosed"

# Auth Providers Slack Links Github Issue Link Doc Update Link

# "version"
# gsed -i 's/-   Version/"version"/' "$CONV/$TICKET.txt"
# awk 'NR==5' "$CONV/$TICKET.txt" >"$CONV/version.txt"
# version=$(cut -c 1-9 "$CONV/version.txt")
# rm "$CONV/version.txt"
# echo "$version"

# # "deployment"
# gsed -i 's/-   Deployment/"deployment"/' "$CONV/$TICKET.txt"
# awk 'NR==6' "$CONV/$TICKET.txt" >"$CONV/deployment.txt"
# deployment=$(cut -c 1-12 "$CONV/deployment.txt")
# rm "$CONV/deployment.txt"
# echo "$deployment"

# # "externalServices"
# gsed -i 's/-   External Services/"externalServices"/' "$CONV/$TICKET.txt"
# awk 'NR==7' "$CONV/$TICKET.txt" >"$CONV/external-services.txt"
# externalServices=$(cut -c 1-18 "$CONV/external-services.txt")
# rm "$CONV/external-services.txt"
# echo "$externalServices"

# # "authProviders"
# gsed -i 's/-   Auth Providers/"authProviders"/' "$CONV/$TICKET.txt"
# awk 'NR==8' "$CONV/$TICKET.txt" >"$CONV/auth-providers.txt"
# authProviders=$(cut -c 1-15 "$CONV/auth-providers.txt")
# rm "$CONV/auth-providers.txt"
# echo "$authProviders"

# # "slackLinks"
# gsed -i 's/-   Slack Links/"slackLinks"/' "$CONV/$TICKET.txt"
# awk 'NR==9' "$CONV/$TICKET.txt" >"$CONV/slack-links.txt"
# slackLinks=$(cut -c 1-12 "$CONV/slack-links.txt")
# rm "$CONV/slack-links.txt"
# echo "$slackLinks"

# # "githubIssueLink"
# gsed -i 's/-   GitHub Issue Link/"githubIssueLink"/' "$CONV/$TICKET.txt"
# awk 'NR==10' "$CONV/$TICKET.txt" >"$CONV/github-issue-link.txt"
# githubIssueLink=$(cut -c 1-17 "$CONV/github-issue-link.txt")
# rm "$CONV/github-issue-link.txt"
# echo "$githubIssueLink"

# # "docUpdateLink"
# gsed -i 's/-   Doc Update Link/"docUpdateLink"/' "$CONV/$TICKET.txt"
# awk 'NR==11' "$CONV/$TICKET.txt" >"$CONV/doc-update-link.txt"
# docUpdateLink=$(cut -c 1-15 "$CONV/doc-update-link.txt")
# rm "$CONV/doc-update-link.txt"
# echo "$docUpdateLink"

# "summary"
summary="\"summary\""
echo "$summary"

# rm -rf "$CONV"

# extract ticket number and create zendeskTicketNumberField
# echo '"zendeskTicketNumber": $TICKET,' "$CONV/$TICKET.txt"

# CLEAN UP
# echo "====================================="
# cat "$CONV/$TICKET.txt"
# rm -rf $CONV
# cat "$CONV/$TICKET.txt"
