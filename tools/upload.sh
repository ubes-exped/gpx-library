#!/bin/bash

set -e

REPO_PATH="routes.ubes.co.uk"

cd $REPO_PATH

git pull
git add gpx/*
git commit -m "Automatic upload"
git push origin HEAD:master
