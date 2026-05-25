#!/usr/bin/env bash
# Serve the p5 sketch locally
set -e
cd "$(dirname "$0")/../p5-sketch"
echo "=== Serving p5 sketch at http://localhost:3000 ==="
npx http-server -p 3000 -c-1
