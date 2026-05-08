#!/usr/bin/env bash
# ================================================================
# Cortex — Project Setup
# ================================================================
# Initializes the Cortex template for a new project.
# The agent will handle AGENTS.md via the bootstrap skill.
#
# Usage:
#   ./scripts/setup.sh     # interactive
#   ./scripts/setup.sh --auto "Name" "Desc" "Stack"  # non-interactive
# ================================================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     Multi-Agent Dev System — Project Setup              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

if [ "$1" = "--auto" ]; then
  PROJECT_NAME="$2"
  PROJECT_DESC="$3"
  TECH_STACK="$4"
  PROJECT_TYPE="${5:-web}"
else
  read -p "Project name: " PROJECT_NAME
  read -p "Description: " PROJECT_DESC
  read -p "Tech stack: " TECH_STACK
  read -p "Type (web/cli/api/lib/mobile): " PROJECT_TYPE
fi

echo ""
echo "  Writing project files..."

cat > .planning/PROJECT.md << PROJECTEOF
# $PROJECT_NAME

## Vision
$PROJECT_DESC

## Tech Stack
$TECH_STACK

## Type
$PROJECT_TYPE
PROJECTEOF

cat > .planning/ROADMAP.md << ROADMAPEOF
# Roadmap

## Phase 1: Project Setup [active]
| Step | Task | Status |
|------|------|--------|
| 1.1 | Environment setup | [ ] |
| 1.2 | Build tooling | [ ] |
| 1.3 | CI/CD | [ ] |

## Phase 2: Core Features [planned]
| Step | Task | Status |
|------|------|--------|
| 2.1 | Feature 1 | [ ] |
| 2.2 | Tests | [ ] |
ROADMAPEOF

cat > .planning/STATE.md << STATEEOF
# State

## Current Position
- **Project**: $PROJECT_NAME
- **Phase**: 1 — Project Setup
- **Status**: Active
- **Updated**: $(date +%Y-%m-%d)

## Next Actions
1. Open OpenCode and let the agent read AGENTS.md
2. The agent will detect this is a new project setup
STATEEOF

echo "  ✓ .planning/PROJECT.md"
echo "  ✓ .planning/ROADMAP.md"
echo "  ✓ .planning/STATE.md"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Done. Open OpenCode and run:                           ║"
echo "║                                                          ║"
echo "║     /new-project                                        ║"
echo "║                                                          ║"
echo "║  The agent will ask questions, research online,          ║"
echo "║  and propose a project plan.                             ║"
echo "╚══════════════════════════════════════════════════════════╝"
