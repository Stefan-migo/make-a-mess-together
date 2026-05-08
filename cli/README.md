# cortex-brain

Cortex brain manager CLI — scaffold and manage Cortex projects.

## Installation

```bash
npm install -g cortex-brain
```

Or run from source:

```bash
git clone https://github.com/Stefan-migo/CortexPlugin
cd CortexPlugin/cli
npm install
npm run build
```

## Usage

```bash
cortex init my-project
cortex init my-project --no-git
cortex init my-project --force
cortex install
cortex install --check
```

## Commands

| Command | Description |
|---------|-------------|
| `cortex init <name>` | Scaffold new Cortex project |
| `cortex install` | Check and install dependencies |
| `cortex start` | Load context and launch (Phase 2) |
| `cortex close` | Summarize and export (Phase 2) |
| `cortex update` | Evolve brain template (Phase 4) |
| `cortex analyze` | Session intelligence (Phase 4) |
| `cortex status` | Brain health (Phase 3) |

## Build

```bash
npm run build    # esbuild bundle
npm run typecheck  # tsc --noEmit
npm test         # vitest
```
