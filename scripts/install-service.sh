#!/usr/bin/env bash
# ==============================================================================
# chuanban-antigravity-theme-patch: macOS LaunchAgent Service Installer
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
LAUNCH_AGENTS_DIR="${HOME}/Library/LaunchAgents"
PLIST_NAME="com.antigravity.theme-patch.plist"
TARGET_PLIST="${LAUNCH_AGENTS_DIR}/${PLIST_NAME}"

echo ">>> [1/4] Checking Node.js environment..."
NODE_PATH="$(which node || true)"
if [ -z "$NODE_PATH" ]; then
    echo "Error: node command not found in PATH. Please install Node.js (18+ recommended)."
    exit 1
fi
echo "Using Node.js at: $NODE_PATH"

echo ">>> [2/4] Installing dependencies..."
cd "$ROOT_DIR"
if [ ! -d "node_modules" ]; then
    npm install --production
fi

echo ">>> [3/4] Generating LaunchAgent plist..."
mkdir -p "$LAUNCH_AGENTS_DIR"
sed -e "s|/usr/local/bin/node|${NODE_PATH}|g" \
    -e "s|__PATCH_DIR__|${ROOT_DIR}|g" \
    "${ROOT_DIR}/launchd/${PLIST_NAME}" > "$TARGET_PLIST"

echo ">>> [4/4] Loading LaunchAgent into launchd..."
launchctl unload "$TARGET_PLIST" 2>/dev/null || true
launchctl load -w "$TARGET_PLIST"

echo "================================================================="
echo "  chuanban-antigravity-theme-patch Service Successfully Installed!"
echo "  Plist: $TARGET_PLIST"
echo "  Logs:  $ROOT_DIR/daemon.log"
echo "================================================================="
