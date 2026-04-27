#!/usr/bin/env bash
set -euo pipefail

STYLE_FILE="src/style.css"
SRC_FILES=(src/index.html src/*.ts)

if [[ ! -f "$STYLE_FILE" ]]; then
  echo "ERROR: $STYLE_FILE not found"
  exit 1
fi

unused=0

while IFS= read -r cls; do
  [[ -z "$cls" ]] && continue
  found=false
  for f in "${SRC_FILES[@]}"; do
    if grep -q "$cls" "$f" 2>/dev/null; then
      found=true
      break
    fi
  done
  if [[ "$found" == "false" ]]; then
    echo "WARNING: .$cls defined in $STYLE_FILE but not referenced in source files"
    unused=$((unused + 1))
  fi
done < <(grep -oE '\.[a-z][a-z0-9-]+' "$STYLE_FILE" | sed 's/^\.//' | sort -u)

if [[ $unused -gt 0 ]]; then
  echo ""
  echo "Found $unused potentially unused CSS class(es)."
  echo "If any are used dynamically in JS, add them to the allowlist in this script."
  exit 1
fi

echo "All CSS classes are referenced in source files."
