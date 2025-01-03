#!/usr/bin/env bash

cd "$(dirname "$0")"

REPO_URL="git@github.com:ubes-exped/routes.ubes.co.uk.git"

(echo "Clearing the old version"; mkdir -p dist && find ./dist/ -mindepth 1 -delete) &&
(echo "Unzipping"; tar -xzf dist.tar.gz) &&
(echo "Clearing cache"; rm walks.json 2> /dev/null; true) &&
(echo "Setting permissions"; chmod 755 dist && find ./dist/ -type d -exec chmod 755 {} \; && find ./dist/ -type f -exec chmod 644 {} \;) &&
(echo "Cloning repo"; cd dist && GIT_SSH_COMMAND="ssh -i ../github_deploy" git clone "$REPO_URL")
