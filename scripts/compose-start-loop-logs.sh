
#!/usr/bin/env bash

# This script loops bringing a docker compose SG instance up and down until failure, 
# in which case it logs info from the failure. 
# Create and run this script from inside your docker-compose Sourcegraph root directory

cd "$(dirname "${BASH_SOURCE[0]}")"
set -euxo pipefail

finish() {
    echo "exiting..."
    exit 0 
}
trap finish SIGINT

catch_failure() {
    docker ps
    docker-compose logs
    finish 
}

cd docker-compose

while true
do
    docker-compose up -d || catch_failure
    docker-compose down
done
