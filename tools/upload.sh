#!/bin/bash

set -e

REPO_PATH="routes.ubes.co.uk"

cd $REPO_PATH

git config user.name "Goaty Bot"
git config user.email "goaty@ubes.co.uk"
git config --local core.sshCommand "/usr/bin/ssh -i ../github_deploy"
git fetch origin
git checkout origin/master
git add gpx/*
git commit -m "Automatically upload"
git push origin HEAD:master
