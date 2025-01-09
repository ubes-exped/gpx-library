#!/bin/bash
set -e

SCRIPT_PATH="$(dirname "$(readlink -f -- "$0")")"
REPO_PATH="$SCRIPT_PATH/routes.ubes.co.uk"

err_report() {
  echo "$ID: err on line git-setup.sh:$(caller), aborting" >&2
  exit 1
}

trap err_report ERR

cd "$REPO_PATH"

while ! mkdir lock_dir
do
    sleep 1
done


ID="$(date -Ins)@$(basename -- "$0")"

echo "$ID: Setting git config at $(date)"
git config user.name "Goaty Bot"
git config user.email "goaty@ubes.co.uk"
git config --local core.sshCommand '/usr/bin/ssh -i "'"$SCRIPT_PATH/../github_deploy"'"'
echo "$ID: Fetching git repo at $(date)"
git fetch origin
git -c advice.detachedHead=false checkout origin/master

rm -r lock_dir
