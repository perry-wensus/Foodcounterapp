#!/usr/bin/env bash
# Acceptatiecriterium: geen API-sleutel in de app-bundel.
# Bouwt een productie-bundel en zoekt naar sleutelpatronen.
set -euo pipefail
OUT=$(mktemp -d)
EXPO_PUBLIC_SUPABASE_URL=${EXPO_PUBLIC_SUPABASE_URL:-https://example.supabase.co} \
EXPO_PUBLIC_SUPABASE_ANON_KEY=${EXPO_PUBLIC_SUPABASE_ANON_KEY:-dummy} \
  npx expo export --platform android --output-dir "$OUT" >/dev/null
if grep -r -a -E -i "sk-ant-|ANTHROPIC_API_KEY|service_role|SUPABASE_SERVICE_ROLE_KEY" "$OUT" ; then
  echo "FOUT: mogelijke geheime sleutel gevonden in de bundel" >&2
  exit 1
fi
echo "OK: geen API-sleutels in de bundel"
rm -rf "$OUT"
