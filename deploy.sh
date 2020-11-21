#!/usr/bin/env bash

cd "$(dirname "$0")"

(echo "Clearing the old version"; mkdir -p dist && find ./dist/ -mindepth 1 -delete) &&
(echo "Unzipping"; tar -xzf dist.tar.gz) &&

(echo "Setting permissions"; chmod 755 dist && find ./dist/ -type d -exec chmod 755 {} \; && find ./dist/ -type f -exec chmod 644 {} \;)