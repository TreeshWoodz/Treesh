#!/bin/bash
set -e
D=/app/nects-src
OUT=/app/frontend/public/nects.html
{
  cat $D/00-head.html
  echo "<style>"
  cat $D/10-styles.css
  echo "</style>"
  cat $D/20-body.html
  echo "<script>"
  for f in $D/30-data.js $D/40-store.js $D/50-ui.js $D/55-screens.js $D/60-engine.js $D/65-modes.js $D/67-bingo.js $D/99-boot.js; do cat "$f"; echo; done
  echo "</script>"
  echo "</body>"
  echo "</html>"
} > $OUT
mkdir -p /app/deliverables
cp $OUT /app/deliverables/nects.html
cp /app/frontend/public/treesh-nects-snippet.txt /app/deliverables/treesh-nects-snippet.txt
echo "built $(wc -c < $OUT) bytes"
