#!/usr/bin/env bash
# Rebuilds the two files that go into the Treesh repo (branch main):
#   treesh-site/games/chainz.html  -> games/chainz.html   (https://treesh.app/games/chainz)
#   treesh-site/index.html         -> index.html          (https://treesh.app)
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"
yarn build
python3 "$ROOT/tools/inline_build.py"
cp "$ROOT/treesh-site/games/chainz.html" "$ROOT/frontend/public/chainz.html"
python3 "$ROOT/tools/patch_treesh.py"
echo "Ready: treesh-site/games/chainz.html and treesh-site/index.html"
