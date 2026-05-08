import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { step, info, success, warn, error, heading } from '../utils/logger';
import { generateSessionId, openSession, getSessionInfo } from '../engine/session';
import { buildPrelude } from '../engine/context';

interface StartOptions {
  prelude?: boolean;
  dryRun?: boolean;
  open?: boolean;
}

function findProjectRoot(dir: string): string | null {
  const manifestPath = join(dir, '.cortex', 'manifest.json');
  const sessionPath = join(dir, '.cortex', 'session.json');
  if (existsSync(manifestPath) || existsSync(sessionPath)) {
    return dir;
  }

  const parent = join(dir, '..');
  if (parent === dir) return null;
  return findProjectRoot(parent);
}

interface OpenCodeConfig {
  instructions?: string[];
  [key: string]: any;
}

function readOpenCodeConfig(projectDir: string): OpenCodeConfig | null {
  const configPath = join(projectDir, 'opencode.json');
  if (!existsSync(configPath)) return null;
  try {
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }
}

function writeOpenCodeConfig(projectDir: string, config: OpenCodeConfig): void {
  const configPath = join(projectDir, 'opencode.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

function readProjectName(projectDir: string): string {
  const manifestPath = join(projectDir, '.cortex', 'manifest.json');
  if (existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
      return manifest.projectName || 'unknown';
    } catch {
    }
  }
  return 'unknown';
}

export async function startCommand(options: StartOptions): Promise<void> {
  heading('Cortex Session Start');

  const projectDir = findProjectRoot(process.cwd());
  if (!projectDir) {
    error('Not inside a Cortex project. Run `cortex init <name>` first.');
    process.exit(1);
  }

  const projectName = readProjectName(projectDir);
  info(`Project: ${projectName}`);
  info(`Directory: ${projectDir}`);

  const existingSession = getSessionInfo(projectDir);
  if (existingSession) {
    warn(`Active session found: ${existingSession.sessionId}`);
    info('Run `cortex close` to finalize it before starting a new one.');
    const proceed = await new Promise<boolean>((resolve) => {
      process.stdout.write('Start a new session anyway? (y/N): ');
      process.stdin.once('data', (data) => {
        const answer = data.toString().trim().toLowerCase();
        resolve(answer === 'y' || answer === 'yes');
      });
    });
    if (!proceed) {
      info('Aborted.');
      process.exit(0);
    }
  }

  const sessionId = generateSessionId();
  info(`Session ID: ${sessionId}`);

  if (options.dryRun) {
    heading('Dry Run — No Actions Taken');
    info('The following would happen:');
    info('  1. Generate session ID');
    info('  2. Open Engram session via MCP (mem_session_start)');
    info('  3. Write .cortex/session.json');
    if (options.prelude !== false) {
      info('  4. Build context prelude (.cortex/prelude.md):');
      info('     - Engram recent context');
      info('     - Graphify codebase report');
      info('     - Spec-Kit current tasks/plans');
      info('     - Project manifest info');
      info('  5. Update opencode.json instructions with .cortex/prelude.md');
    } else {
      info('  4. Skip context prelude (--no-prelude)');
    }
    info('  6. Launch opencode in project directory');
    info('  7. After opencode exits, print finalization instructions');
    return;
  }

  await openSession(projectDir, sessionId);

  if (options.prelude !== false) {
    await buildPrelude(projectDir, projectName);

    step('Updating opencode.json');
    const config = readOpenCodeConfig(projectDir);
    if (config) {
      if (!config.instructions) {
        config.instructions = [];
      }
      const preludePath = '.cortex/prelude.md';
      if (!config.instructions.includes(preludePath)) {
        config.instructions.push(preludePath);
      }
      writeOpenCodeConfig(projectDir, config);
      success('opencode.json updated with prelude reference');
    } else {
      warn('opencode.json not found — skipping instruction update');
    }
  }

  if (options.open === false) {
    heading('Session Prepared (--no-open)');
    success('Session started without launching OpenCode');
    info(`Session ID: ${sessionId}`);
    info('Run `opencode` manually, then `cortex close` when done.');
    return;
  }

  if (!process.stdout.isTTY) {
    warn('Not a TTY terminal — OpenCode may not display correctly.');
    warn('Use --no-open to prepare the session without launching.');
  }

  heading('Launching OpenCode');
  info(`Session: ${sessionId}`);
  info('OpenCode will open in the project directory.');
  info('');

  const child = spawn('opencode', [], {
    cwd: projectDir,
    stdio: 'inherit',
    env: { ...process.env },
  });

  child.on('error', (err: Error) => {
    error(`Failed to launch OpenCode: ${err.message}`);
    info('Make sure OpenCode is installed and available on PATH.');
    process.exit(1);
  });

  child.on('exit', (code: number | null) => {
    if (code !== 0) {
      warn(`OpenCode exited with code ${code}`);
    }
    heading('Session End');
    success('OpenCode session completed');
    info('Run `cortex close` to finalize the session.');
    process.exit(code || 0);
  });
}
