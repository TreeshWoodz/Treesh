#!/usr/bin/env bash
# Builds Hoop as a fully static site for https://treesh.app/hoop (repo "Treesh", branch "main").
# Output: /app/hoop-dist/hoop  -> copy the `hoop/` folder into the root of the Treesh repo.
# In static mode Hoop talks to OpenStreetMap (Nominatim + Overpass) directly from the browser: no server needed.
set -euo pipefail
cd /app/frontend
REACT_APP_STATIC=1 REACT_APP_BACKEND_URL= PUBLIC_URL=/hoop GENERATE_SOURCEMAP=false yarn build
rm -rf /app/hoop-dist && mkdir -p /app/hoop-dist/hoop
cp -r build/* /app/hoop-dist/hoop/
cd /app/hoop-dist/hoop
python3 - <<'EOF'
import re
p = 'index.html'
s = open(p).read()
# strip preview-only platform scripts
s = re.sub(r'<script src="https://assets\.emergent\.sh[^"]*"></script>', '', s)
s = re.sub(r'<script>(?:(?!</script>).)*posthog(?:(?!</script>).)*</script>', '', s, flags=re.S)
open(p, 'w').write(s)
EOF
# Deep links (refresh on /hoop/drills etc.) work on any static host: each route gets its own index.html
for r in courts drills plan dictionary position games favorites form profile; do mkdir -p "$r" && cp index.html "$r/index.html"; done
for g in $(grep -o 'g("[a-z0-9-]*"' /app/frontend/src/data/games.js | sed 's/g("//;s/"//'); do mkdir -p "games/$g" && cp index.html "games/$g/index.html"; done
cp index.html 404.html
echo "Static Hoop build ready at /app/hoop-dist/hoop"
