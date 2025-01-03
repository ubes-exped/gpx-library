#!/bin/bash
set -e

REPO_PATH="routes.ubes.co.uk"

err_report() {
  echo "$ID: err on line upload.sh:$(caller), aborting" >&2
  exit 1
}

trap err_report ERR

cd $REPO_PATH

while ! mkdir lock_dir
do
    sleep 1
done


ID="$(date -Ins)"

echo "$ID: Will add new file at $(date)"
echo "$ID: Setting git config at $(date)"
git config user.name "Goaty Bot"
git config user.email "goaty@ubes.co.uk"
git config --local core.sshCommand "/usr/bin/ssh -i ../../github_deploy"
echo "$ID: Fetching git repo at $(date)"
git fetch origin
git checkout origin/master
echo "$ID: Adding file at $(date)"
git add gpx/*
if ! git diff-index --quiet HEAD; then
  git commit -m "Automatically upload"
  echo "$ID: Pushing changes at $(date)"
  git push origin HEAD:master
else
  echo "$ID: Nothing to commit at $(date)"
fi
echo "$ID: Added new file at $(date)"

rm -r lock_dir
