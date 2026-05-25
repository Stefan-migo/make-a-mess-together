#!/usr/bin/env bash
# Run the bridge server
set -e
cd "$(dirname "$0")/../server-bridge"
echo "=== Starting Bridge Server ==="
if [ ! -d node_modules ]; then
  echo "Installing dependencies..."
  npm install
fi
node index.js
