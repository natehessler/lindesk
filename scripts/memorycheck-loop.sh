#!/bin/bash

# check memory usage of gitserver every 5 min until the process is killed.

while true;
do
    echo "Time Now: `date +%H:%M:%S`"
    kubectl top pods | grep gitserver
    sleep 3600 #every 5 minute
done
