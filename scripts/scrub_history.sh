#!/bin/bash
# Script to scrub sensitive files from git history
# Usage: ./scripts/scrub_history.sh

set -e

echo "WARNING: This script will rewrite the git history of this repository."
echo "This is a destructive operation. Ensure you have a backup."
echo "Files to be removed:"
echo " - server/.env"
echo " - src/gemini.js"
echo " - src/services/smartRouter.js"
echo " - src/storage.js"
echo " - VERCEL_COMPLETE_ENV.md"
echo " - server/service-account.json"
echo ""
read -p "Do you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

# Check for git-filter-repo (preferred)
if command -v git-filter-repo &> /dev/null
then
    echo "Using git-filter-repo..."
    git filter-repo \
        --invert-paths \
        --path server/.env \
        --path src/gemini.js \
        --path src/services/smartRouter.js \
        --path src/storage.js \
        --path VERCEL_COMPLETE_ENV.md \
        --path server/service-account.json \
        --force
else
    echo "git-filter-repo not found. Using git filter-branch (slower)..."
    git filter-branch --force --index-filter \
    "git rm --cached --ignore-unmatch server/.env src/gemini.js src/services/smartRouter.js src/storage.js VERCEL_COMPLETE_ENV.md server/service-account.json" \
    --prune-empty --tag-name-filter cat -- --all
fi

# Garbage collection to remove loose objects
echo "Running garbage collection..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "History scrub complete."
echo "You will need to 'git push --force' to update the remote repository."
