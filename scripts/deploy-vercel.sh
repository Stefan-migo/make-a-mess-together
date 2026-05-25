#!/usr/bin/env bash
# Deploy phone client + p5 sketch to Vercel
set -e
cd "$(dirname "$0")/.."
echo "=== Deploying to Vercel ==="
echo "Phone client at root URL"
echo "p5 sketch at /p5"
vercel --prod
