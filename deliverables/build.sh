#!/usr/bin/env bash
# Builds ONE self-contained file: /app/deliverables/chainz.html
# Upload it to the treesh repo (branch main) as games/chainz.html, replacing the old file.
# It is served at https://treesh.app/games/chainz
set -e
cd /app/frontend
yarn build
python3 /app/tools/inline_build.py
cp /app/deliverables/chainz.html /app/frontend/public/chainz.html
cd /app/tools && python3 patch_treesh.py
echo "Ready: /app/deliverables/chainz.html and /app/deliverables/index.html"
