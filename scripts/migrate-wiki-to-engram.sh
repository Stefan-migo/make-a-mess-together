#!/bin/bash
# Cortex 2.5 — One-time migration: seed Engram from wiki/log.md entries.
# Usage: bash scripts/migrate-wiki-to-engram.sh

set -e

LOG_FILE="wiki/log.md"
PROJECT="cortex-plugin"

if [ ! -f "$LOG_FILE" ]; then
    echo "Error: $LOG_FILE not found. Run from project root."
    exit 1
fi

echo "Migrating wiki/log.md entries to Engram..."

# Parse entries: ## [date] tag | Title \n Body
current_date=""
current_tag=""
current_title=""
current_body=""

while IFS= read -r line; do
    if [[ "$line" =~ ^##\ \[([0-9-]+)\]\ ([^\ ]+)\ \|\ (.+)$ ]]; then
        # Save previous entry if exists
        if [ -n "$current_title" ]; then
            echo "  → Saving: $current_title"
            engram save "$current_title" "$current_body" \
                --type architecture \
                --project "$PROJECT" \
                --scope project > /dev/null 2>&1
        fi

        # Start new entry
        current_date="${BASH_REMATCH[1]}"
        current_tag="${BASH_REMATCH[2]}"
        current_title="${BASH_REMATCH[3]}"
        current_body="$current_tag | $current_date"
    elif [ -n "$current_title" ] && [ -n "$line" ]; then
        current_body="$current_body
$line"
    fi
done < "$LOG_FILE"

# Save last entry
if [ -n "$current_title" ]; then
    echo "  → Saving: $current_title"
    engram save "$current_title" "$current_body" \
        --type architecture \
        --project "$PROJECT" \
        --scope project > /dev/null 2>&1
fi

echo ""
echo "Migration complete. Verifying..."
engram stats --project "$PROJECT" 2>/dev/null || engram stats

# Mark wiki/log.md as archived
echo ""
echo "---"
echo "wiki/log.md entries have been seeded into Engram."
echo "The next session will load context from Engram automatically."
