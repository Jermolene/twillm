#!/bin/bash
set -euo pipefail

# Downloads vendored TiddlyWiki plugins from their upstream repos.
# Run this whenever you want to pull in the latest versions.

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PLUGIN_DIR="$PROJECT_ROOT/plugins"

TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

# --- wikilabs/tw-mcp ---
echo "Updating wikilabs/tw-mcp..."
git clone --depth 1 --filter=blob:none --sparse \
    https://github.com/wikilabs/plugins.git "$TEMP_DIR/wikilabs-plugins" 2>&1
(cd "$TEMP_DIR/wikilabs-plugins" && git sparse-checkout set wikilabs/tw-mcp)

mkdir -p "$PLUGIN_DIR/wikilabs"
rm -rf "$PLUGIN_DIR/wikilabs/tw-mcp"
cp -R "$TEMP_DIR/wikilabs-plugins/wikilabs/tw-mcp" "$PLUGIN_DIR/wikilabs/tw-mcp"

echo "Done. Updated plugins:"
echo "  wikilabs/tw-mcp -> plugins/wikilabs/tw-mcp/"
