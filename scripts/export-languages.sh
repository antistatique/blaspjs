#!/usr/bin/env bash
# Regenerate src/languages/*.json from Blaspsoft/blasp (requires PHP CLI + curl).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
for lang in english spanish german french; do
  curl -sL "https://raw.githubusercontent.com/Blaspsoft/blasp/main/config/languages/${lang}.php" -o "$TMP/${lang}.php"
done
curl -sL "https://raw.githubusercontent.com/Blaspsoft/blasp/main/config/blasp.php" -o "$TMP/blasp.php"
for lang in english spanish german french; do
  php -r "function env(\$k,\$d=null){return \$d;} \$c = require '$TMP/${lang}.php'; echo json_encode(\$c, JSON_UNESCAPED_UNICODE);" > "$ROOT/src/languages/${lang}.json"
done
php -r "function env(\$k,\$d=null){return \$d;} \$c = require '$TMP/blasp.php'; echo json_encode(['separators'=>\$c['separators'],'substitutions'=>\$c['substitutions'],'false_positives'=>\$c['false_positives'],'allow'=>\$c['allow'],'block'=>\$c['block']], JSON_UNESCAPED_UNICODE);" > "$ROOT/src/config/blasp-defaults.json"
echo "Updated src/languages/*.json and src/config/blasp-defaults.json"
