#!/usr/bin/env bash
# ==============================================================================
# chuanban-antigravity-theme-patch: macOS Service Uninstaller
# ==============================================================================

LAUNCH_AGENTS_DIR="${HOME}/Library/LaunchAgents"
PLIST_NAME="com.antigravity.theme-patch.plist"
TARGET_PLIST="${LAUNCH_AGENTS_DIR}/${PLIST_NAME}"

echo ">>> Unloading LaunchAgent..."
if [ -f "$TARGET_PLIST" ]; then
    launchctl unload "$TARGET_PLIST" 2>/dev/null || true
    rm -f "$TARGET_PLIST"
    echo "Removed LaunchAgent plist: $TARGET_PLIST"
else
    echo "LaunchAgent plist not found, skipping unload."
fi

echo ">>> Stopping any remaining daemon processes..."
pkill -f "chuanban-antigravity-theme-patch/src/daemon.js" 2>/dev/null || true

echo "================================================================="
echo "  LaunchAgent service uninstalled successfully."
echo "  To completely reset Antigravity:"
echo "  1. Open Antigravity Settings -> Appearance -> Select 'Default Light'."
echo "  2. Restart Antigravity."
echo "  3. Delete this patch directory if no longer needed."
echo "================================================================="
