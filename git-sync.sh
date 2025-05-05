#!/bin/bash

# This script automates the GitHub upload process
# Execute with your GitHub username and token/password:
# ./git-sync.sh username your_token

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <github_username> <github_token_or_password>"
    exit 1
fi

USERNAME=$1
TOKEN=$2

# Set the remote URL with credentials embedded
git remote set-url origin https://${USERNAME}:${TOKEN}@github.com/counter440/Laserkongen2.git

# Push to GitHub
git push -u origin master

# Reset the URL to remove credentials (security best practice)
git remote set-url origin https://github.com/counter440/Laserkongen2.git

echo "Push completed successfully!"