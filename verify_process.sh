#!/bin/bash

# This script tests whether tickets have been pre-processed for db transfer correctly.
# Do not delete!

if [ -f ./converted-resolved-tickets/shall-not-pass.txt ]; then
    rm ./converted-resolved-tickets/shall-not-pass.txt
fi

if [ -f ./converted-resolved-tickets/pass.txt ]; then
    rm ./converted-resolved-tickets/pass.txt
fi

if [ -f ./converted-resolved-tickets/error-log.txt ]; then
    rm ./converted-resolved-tickets/error-log.txt
fi

PASS=0
FAIL=0
FAILURES=false
log=./converted-resolved-tickets/error-log.txt

get_failure_rate() {
    not_passed="$1"
    total="$2"

    x=$((not_passed * 100))
    y=$((x / total))

    echo "DONE: tests finished with $y% failure rate"
}

is_equal_to() {
    expected=$1
    actual=$2
    file=$3
    line_num=$4
    log=./converted-resolved-tickets/error-log.txt

    if [ ! -f ./converted-resolved-tickets/shall-not-pass.txt ]; then
        touch ./converted-resolved-tickets/shall-not-pass.txt
    fi

    if [ ! -f ./converted-resolved-tickets/pass.txt ]; then
        touch ./converted-resolved-tickets/pass.txt
    fi

    if [ ! "$actual" = "$expected" ]; then
        {
            echo "ERROR:  ${file:38:42}"
            printf "\n\tLine: %s\n\tExpected: \"%s\"\n\tActual: \"%s\"\n\n" "$line_num" "$expected" "$actual"
        } >>$log

        if ! grep -q "${file:38:42}" ./converted-resolved-tickets/shall-not-pass.txt; then
            echo "${file:38:42}" >>./converted-resolved-tickets/shall-not-pass.txt
            echo "FAILED: ${file:38:42}"
        fi
        FAILURES=true
    else
        printf "PASSED: %s\n" "${file:38:42}" >>$log
        if [ "$FAILURES" = "false" ]; then
            if ! grep -q "${file:38:42}" ./converted-resolved-tickets/pass.txt; then
                echo "${file:38:42}" >>./converted-resolved-tickets/pass.txt
            fi
        fi
    fi
}

for file in ./converted-resolved-tickets/key-vals/*; do
    FAILURES=false

    L1=$(head -1 "$file" | tail -1)
    L2=$(head -2 "$file" | tail -1)
    L3=$(head -3 "$file" | tail -1)
    L4=$(head -4 "$file" | tail -1)
    L5=$(head -5 "$file" | tail -1)
    L6=$(head -6 "$file" | tail -1)
    L7=$(head -7 "$file" | tail -1)
    L8=$(head -8 "$file" | tail -1)
    L9=$(head -9 "$file" | tail -1)
    L10=$(head -10 "$file" | tail -1)
    L11=$(head -11 "$file" | tail -1)
    L12=$(head -12 "$file" | tail -1)
    L13=$(head -13 "$file" | tail -1)
    L14=$(head -14 "$file" | tail -1)

    is_equal_to "zendeskTicketNumber:" "${L1:0:20}" "$file" "1"
    is_equal_to "zendeskLink:" "${L2:0:12}" "$file" "2"
    is_equal_to "title:" "${L3:0:6}" "$file" "3"
    is_equal_to "Application engineer:" "${L4:0:21}" "$file" "4"
    is_equal_to "Customer:" "${L5:0:9}" "$file" "5"
    is_equal_to "Date:" "${L6:0:5}" "$file" "6"
    is_equal_to "Version:" "${L7:0:8}" "$file" "7"
    is_equal_to "Deployment:" "${L8:0:11}" "$file" "8"
    is_equal_to "External Services:" "${L9:0:18}" "$file" "9"
    is_equal_to "Auth Providers:" "${L10:0:15}" "$file" "10"
    is_equal_to "Slack Links:" "${L11:0:12}" "$file" "11"
    is_equal_to "GitHub Issue Link:" "${L12:0:18}" "$file" "12"
    is_equal_to "Doc Update Link:" "${L13:0:16}" "$file" "13"
    is_equal_to "Summary:" "${L14:0:8}" "$file" "14"

    if [ "$FAILURES" = "true" ]; then
        ((FAIL++))
    elif [ "$FAILURES" = "false" ]; then
        ((PASS++))
    fi
done

{
    printf "Pass: %s\nFailed: %s\n" "$PASS" "$FAIL"
    get_failure_rate FAIL $((PASS + FAIL))
    printf "\n***************** ERROR LOG *****************\n"
    cat <$log
} >./converted-resolved-tickets/results.txt

rm ./converted-resolved-tickets/error-log.txt
