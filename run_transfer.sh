#!/bin/bash
get_ticket_number() {
    echo "$1"
}

for file in ./resolved-tickets/*; do
    echo "$file"
done
