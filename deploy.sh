#!/usr/bin/env bash

cd "$(dirname "$0")"
(echo "Clearing the old version"; find ./dist/ -mindepth 1 -delete) &&
(echo "Unzipping"; unzip ./dist > /dev/null) &&

(echo "Setting permissions"; find ./dist/ -type d -exec chmod 755 {} \; && find ./dist/ -type f -exec chmod 644 {} \;)
