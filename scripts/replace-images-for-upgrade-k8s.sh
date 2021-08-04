#Script used by SAP and some other customers for replacing image-paths to a newer version in their current deployment

#!/bin/bash
# Define variables to use
releaseVersion="v3.29.0"
repoName="deploy-sourcegraph"
remoteURL="https://github.com/sourcegraph/$repoName.git"
dockerHubImagesFile="docker-hub-images.csv"
# Redirect output to console and log file
logFile="./$0.log"
exec > >(tee -ia $logFile)
exec 2>&1
# Overload echo function to prepend a date time stamp
function echo () {
    builtin echo -e "\033[92m $(date '+%F %T %z %Z') --- $1 \033[0m"
}
# Print variable values for verification and logging
echo "Release version: $releaseVersion"
echo "Repo name:       $repoName"
echo "Remote URL:      $remoteURL"
echo "Log file:        $logFile"
# Check first if we already have the repo pulled and at the correct release
gitStatus="$(git -C $repoName status)"
# If the release version is not in the git status output, then go through the setup process
if [[ ${gitStatus} == *"$releaseVersion"* ]]
then
    echo "Repo already pulled and checked out at this release"
else
    # If the repo directory doesn't already exist, then create it, and initialize the repo
    if [ -d ./$repoName ]
    then
        echo "$repoName directory already exists"
    else
        echo "$repoName directory doesn't exist, creating it"
        mkdir -p ./$repoName
        echo "Initializing $repoName"
        git -C $repoName init
        echo "Adding git remote $remoteURL"
        git -C $repoName remote add origin $remoteURL
        echo "Git remotes configured on $repoName:"
        git -C $repoName remote -v
    fi
    #### TODO: Clean up the output of git pull, especially on the first pull
    # Pull
    echo "Git pull --quiet"
    git -C $repoName pull --quiet
    # Checkout release version
    echo "Git checkout $releaseVersion"
    git -C $repoName checkout $releaseVersion
fi
# Run grep through the repo, and write the results to $dockerHubImagesFile
echo "Running grep to find Docker images in $repoName"
grep \
    --recursive \
    --no-filename \
    --exclude-dir overlays \
    --exclude-dir configure \
    -e "image:" \
    ./$repoName/* \
    > $dockerHubImagesFile
# Run sed through $dockerHubImagesFile to clean up the output
# Remove:
    # Spaces
    # Lines that start with #, so we don't submit 3PP requests for images that are commented out
    # "image:"
    # "index.docker.io/"
    # Leading - characters, from inconsistent yaml formatting, but not all - characters
echo "Running sed to clean up output file"
sed \
    -i "" \
    -e 's/[[:space:]]*//g ; /^#/d ; s/image://g ; s/index\.docker\.io\///g ; s/^-//g' \
    $dockerHubImagesFile
# Sort and uniq
echo "Sorting output file"
sort \
    --unique \
    --output=$dockerHubImagesFile \
    $dockerHubImagesFile
# Awk, to generate the output needed for the spreadsheet
# Input
    # 1 - sourcegraph/cadvisor
    # 2 - 3.28.0
    # 3 - sha256
    # 4 - 42ffede30b55aa6ca1525a13440ac0780bd1ea74b9baa4765046b73a9c703e83
# Output
    # Third Party Property Name
        # sourcegraph/frontend:3.28.0
    # Version
        # 3.28.0
    # Source Code Path or URL / Download URL
        # Download URLs that work for 3PP:
            # docker pull sourcegraph/frontend:3.28.0
                # '{print $1 ":" $2 "," $2 "," "docker pull " $1 ":" $2 }' \
            # docker pull sourcegraph/frontend@sha256:3cf4f8380659c0f27544e836ac88b57a46b8dfb0cd85429edcd85dbe25104c32
                # '{print $1 ":" $2 "," $2 "," "docker pull " $1 "@" $3 ":" $4 }' \
        # Download URL that doesn't work for 3PP, but should
            # docker pull sourcegraph/frontend:3.28.0@sha256:3cf4f8380659c0f27544e836ac88b57a46b8dfb0cd85429edcd85dbe25104c32
                # '{print $1 ":" $2 "," $2 "," "docker pull " $1 ":" $2 "@" $3 ":" $4 }' \
        # Download URL that works best for docker-pull-tag-push.sh script
                # '{print $1 "," $2 "," $3 ":" $4 }' \
echo "Generating needed output format"
awk \
    -F'[:@]' \
    '{print $1 ":" $2 "\@" $3 ":" $4 }' \
    $dockerHubImagesFile #\
#    | tee $dockerHubImagesFile
#echo "Done. See ./$dockerHubImagesFile"
