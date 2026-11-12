#!/usr/bin/env bash
# Re-copy Tandfokus design system + app CSS into Vivaci content-admin (no CRM code).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TF="${TANDFOKUS_ROOT:-$HOME/Tandfokus}"
CA="$ROOT/content-admin"

if [[ ! -d "$TF/components/ds" ]]; then
  echo "Tandfokus not found at $TF — set TANDFOKUS_ROOT" >&2
  exit 1
fi

mkdir -p "$CA/components" "$CA/lib" "$CA/app"
cp -R "$TF/components/ds" "$CA/components/ds"
cp "$TF/lib/utils.ts" "$TF/lib/icons.tsx" "$TF/lib/menu-portal.ts" \
  "$TF/lib/use-portal-menu-position.ts" "$TF/lib/use-mobile-menu-sheet.ts" \
  "$TF/lib/avatar-utils.ts" "$TF/lib/date-utils.ts" "$TF/lib/media-kind.ts" "$CA/lib/"
mkdir -p "$CA/lib/i18n"
cp "$TF/lib/i18n/greeting.ts" "$CA/lib/i18n/"
cp -R "$TF/i18n" "$CA/"
cp -R "$TF/messages" "$CA/"
mkdir -p "$CA/types"
cp "$TF/types/index.ts" "$CA/types/"
cp "$TF/app/globals.css" "$TF/app/design-system.css" "$TF/app/design-system-motion.css" \
  "$TF/app/design-system-utilities.css" "$CA/app/"
cp "$ROOT/admin/ds/vivaci-semantic-colors.css" "$CA/app/vivaci-semantic-colors.css"
cp "$TF/postcss.config.mjs" "$CA/"
cp "$TF/components/RouteTransition.tsx" "$CA/components/" 2>/dev/null || true

echo "Synced Tandfokus DS → $CA"
