#!/bin/bash
# scripts/engram-export-wiki.sh
# Occipital Lobe: Export Engram memory to Obsidian wiki/.
# Run at session end. Auto-detects project.

set -e
WIKI_DIR="wiki"
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")
DATE_TAG=$(date "+%Y-%m-%d")

echo "=== Cortex 2.5 — Engram → Wiki Export ==="
engram obsidian-export --vault "$WIKI_DIR" 2>&1

echo "" >> "$WIKI_DIR/log.md"
echo "## [$DATE_TAG] export | Engram snapshot exported to wiki/engram/" >> "$WIKI_DIR/log.md"
echo "Session memory synced at $TIMESTAMP" >> "$WIKI_DIR/log.md"

echo "Done. wiki/engram/ updated."
