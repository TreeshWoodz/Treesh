#!/usr/bin/env bash
# Builds Hoop as a fully static site served under https://treesh.app/hoop
# Works locally and in GitHub Actions (paths are relative to the repo root).
#   Output: <repo>/hoop-dist/hoop   (override with HOOP_OUT_DIR=/some/dir)
# In static mode Hoop talks to OpenStreetMap (Nominatim + Overpass) directly from the browser: no server needed.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${HOOP_OUT_DIR:-$ROOT/hoop-dist/hoop}"

cd "$ROOT/frontend"
# CI=false: CRA would otherwise fail the build on harmless lint warnings when run in GitHub Actions
CI=false REACT_APP_STATIC=1 REACT_APP_BACKEND_URL= PUBLIC_URL=/hoop GENERATE_SOURCEMAP=false yarn build

rm -rf "$OUT" && mkdir -p "$OUT"
cp -r build/. "$OUT/"
cd "$OUT"

python3 - <<'EOF'
import re
p = 'index.html'
s = open(p).read()
# strip preview-only platform scripts
s = re.sub(r'<script src="https://assets\.emergent\.sh[^"]*"></script>', '', s)
s = re.sub(r'<script>(?:(?!</script>).)*posthog(?:(?!</script>).)*</script>', '', s, flags=re.S)
open(p, 'w').write(s)
EOF

# Deep links (refresh on /hoop/drills etc.) work on any static host, Netlify included:
# every route gets its own index.html, so no redirect rules are required.
for r in courts drills plan dictionary position games favorites form profile; do
  mkdir -p "$r" && cp index.html "$r/index.html"
done
for g in $(grep -o 'g("[a-z0-9-]*"' "$ROOT/frontend/src/data/games.js" | sed 's/g("//;s/"//'); do
  mkdir -p "games/$g" && cp index.html "games/$g/index.html"
done
cp index.html 404.html

echo "Static Hoop build ready at $OUT"
