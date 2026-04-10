#!/usr/bin/env bash
set -euo pipefail

SCHEMA_PATH="${1:-samples/schemas/schema.v2.json}"
CONFIG_PATH="${2:-samples/configs/config.v2.good.json}"

echo "Validating config JSON against schema..."
node scripts/validate-config.js --schema "$SCHEMA_PATH" --config "$CONFIG_PATH"

echo "Basic checks..."

# Check file is valid JSON (redundant but explicit)
node -e "JSON.parse(require('fs').readFileSync('$CONFIG_PATH','utf8')); console.log('OK: JSON parses')"

echo "OK: all checks passed"

