#!/bin/bash
set -e

SCRIPT_PATH="$(dirname "$(readlink -f -- "$0")")"
REPO_PATH="$SCRIPT_PATH/routes.ubes.co.uk"

ID="$(date -Ins)@$(basename -- "$0")"

err_report() {
  echo "$ID: err on line upload.sh:$(caller), aborting" >&2
  exit 1
}
trap err_report ERR

echo "$ID: Will add new file at $(date)"

bash "$SCRIPT_PATH/git-setup.sh"

cd $REPO_PATH

while ! mkdir lock_dir
do
    sleep 1
done

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
