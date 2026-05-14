#!/usr/bin/env bash
set -euo pipefail

STYLE_FILE="src/style.css"

if [[ ! -f "$STYLE_FILE" ]]; then
  echo "ERROR: $STYLE_FILE not found"
  exit 1
fi

# Recursively scan all source files. The project now uses src/app, src/sticker,
# src/export, src/utils subdirectories so the prior `src/*.ts` glob is not
# enough. Using `grep -r` here keeps us compatible with macOS's bash 3.2 (no
# `mapfile`, no `**` globstar).
unused=0

while IFS= read -r cls; do
  [[ -z "$cls" ]] && continue
  found=false
  if grep -rq --include="*.ts" --include="*.html" -- "$cls" src 2>/dev/null; then
    found=true
  fi
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
