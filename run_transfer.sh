#!/bin/bash
# this script runs the "transfer" script on every file inside of the resolved tickets folder
# do not delete!

for file in ./resolved-tickets/*; do
    echo "$file" >./tmp.txt
    id=$(cut -c 20-23 ./tmp.txt)
    rm ./tmp.txt

    ./transfer.sh "$id"
done

./verify_process.sh
rm -rf ./converted-resolved-tickets/key-vals
rm -rf ./converted-resolved-tickets/text
rm ./converted-resolved-tickets/pass.txt
rm ./converted-resolved-tickets/shall-not-pass.txt
