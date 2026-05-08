#!/usr/bin/env bash
# ================================================================
# Cortex — Install Dependencies
# ================================================================
# Run this after cloning Cortex on a new machine.
# Installs everything needed that can't live in the repo.
#
# Usage:
#   ./scripts/install-deps.sh
# ================================================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║        Cortex — Installing Dependencies                ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Helper ──────────────────────────────────────────────────────
check() {
  if [ $? -eq 0 ]; then echo "  ✓ $1"; else echo "  ✗ $1 — skipped (already installed)"; fi
}

NEEDS_NPM=false

# ── 1. GSD — already in repo, just ensure Node ─────────────────
echo "--- GSD ---"
if command -v node &>/dev/null; then
  echo "  ✓ Node.js found ($(node --version))"
  echo "  ✓ GSD files already in .opencode/ (245 runtime files, 66 commands, 33 agents)"
  mkdir -p ~/.gsd
  if [ ! -f ~/.gsd/defaults.json ]; then
    echo '{"resolve_model_ids":"omit"}' > ~/.gsd/defaults.json
    echo "  ✓ Created ~/.gsd/defaults.json"
  fi
  NEEDS_NPM=true
else
  echo "  ⚠ Node.js not found. GSD needs Node.js >= 18."
  echo "    Install: https://nodejs.org"
fi

# ── 2. Graphify ─────────────────────────────────────────────────
echo ""
echo "--- Graphify ---"
if python3 -c "import graphify" 2>/dev/null; then
  echo "  ✓ graphify already installed ($(python3 -c "import graphify; print('OK')"))"
else
  echo "  Installing graphify..."
  pip install graphifyy 2>&1 | tail -1
  if python3 -c "import graphify" 2>/dev/null; then
    echo "  ✓ graphify installed"
  else
    echo "  ⚠ Could not install graphify. You'll need to install it manually:"
    echo "    pip install graphifyy"
  fi
fi

# Install graphify OpenCode hooks (if not already)
if [ -f ~/.config/opencode/skills/graphify/SKILL.md ]; then
  echo "  ✓ graphify OpenCode hooks already installed"
else
  if command -v graphify &>/dev/null; then
    graphify install --platform opencode 2>&1 | tail -1
    echo "  ✓ graphify OpenCode hooks installed"
  fi
fi

# ── 3. Planning with Files (global agent install) ────────────────
echo ""
echo "--- Planning with Files ---"
if [ -f ~/.agents/skills/planning-with-files/SKILL.md ]; then
  echo "  ✓ planning-with-files already installed globally"
else
  echo "  Installing globally..."
  mkdir -p ~/.agents/skills/planning-with-files
  if [ -d .opencode/skills/planning-with-files ]; then
    cp -r .opencode/skills/planning-with-files/* ~/.agents/skills/planning-with-files/
    echo "  ✓ planning-with-files installed globally (from repo copy)"
  else
    echo "  ⚠ Local skill not found. Try: npx skills add OthmanAdi/planning-with-files --skill planning-with-files -g"
  fi
fi

# ── 4. OpenCode Custom Tools ────────────────────────────────────
echo ""
echo "--- OpenCode Custom Tools ---"
if [ -d .opencode/tools ]; then
  if [ -f .opencode/tools/node_modules/.package-lock.json ]; then
    echo "  ✓ tools dependencies already installed"
  else
    echo "  Installing tools dependencies..."
    cd .opencode/tools && npm install --silent 2>&1 | tail -1 && cd ../..
    echo "  ✓ tools dependencies installed"
  fi
fi

# ── Summary ──────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Summary                                                ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Already in repo (works after clone):                   ║"
echo "║    • GSD commands, agents, runtime (245 files)          ║"
echo "║    • GSD hooks (11 files)                               ║"
echo "║    • 8 core agents + 33 GSD agents                     ║"
echo "║    • 8 skills + Planning with Files skill               ║"
echo "║    • Graphify skill + plugin                            ║"
echo "║    • 3 custom TypeScript tools                          ║"
echo "║                                                          ║"
echo "║  Installed now:                                          ║"
if [ -f ~/.gsd/defaults.json ]; then echo "║    • GSD global config"; fi
if python3 -c "import graphify" 2>/dev/null; then echo "║    • Graphify Python package"; fi
if [ -f ~/.agents/skills/planning-with-files/SKILL.md ]; then echo "║    • Planning with Files (global)"; fi
echo "║                                                          ║"
echo "║  Next step: opencode                                    ║"
echo "║  Then: /new-project                                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
