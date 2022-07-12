#!/bin/bash
get_ticket_number() {
    echo "$1"
}

for file in ./resolved-tickets/*; do
    echo "$file" >./tmp.txt
    id=$(cut -c 20-23 ./tmp.txt)
    rm ./tmp.txt

    ./transfer.sh "$id"

done
