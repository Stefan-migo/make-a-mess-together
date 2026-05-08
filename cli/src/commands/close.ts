import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';
import { step, info, success, warn, error, heading } from '../utils/logger';
import { getSessionInfo, closeSession, generateRetrospective, saveRetrospective } from '../engine/session';

interface CloseOptions {
  message?: string;
  export?: boolean;
  retrospective?: boolean;
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

function promptForSummary(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log(''); 
    rl.question('Session summary (Ctrl+D to skip): ', (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function closeCommand(options: CloseOptions): Promise<void> {
  heading('Cortex Session Close');

  const projectDir = process.cwd();

  if (!existsSync(join(projectDir, '.cortex', 'session.json'))) {
    error('No active session found in this directory.');
    info('Run `cortex start` to begin a session.');
    process.exit(1);
  }

  const sessionInfo = getSessionInfo(projectDir);
  if (!sessionInfo) {
    error('Could not read session info. Session file may be corrupted.');
    process.exit(1);
  }

  info(`Session: ${sessionInfo.sessionId}`);
  info(`Started: ${sessionInfo.startedAt}`);
  info(`Project: ${sessionInfo.projectName}`);
  info('');

  let summary = options.message;
  if (!summary) {
    summary = await promptForSummary();
  }

  if (summary) {
    info(`Summary: ${summary}`);
  } else {
    info('No summary provided.');
  }

  await closeSession(projectDir, sessionInfo.sessionId, summary || undefined);

  if (options.export !== false) {
    step('Exporting wiki (if export script available)');
  }

  step('Restoring opencode.json');
  const config = readOpenCodeConfig(projectDir);
  if (config && config.instructions) {
    const preludePath = '.cortex/prelude.md';
    const idx = config.instructions.indexOf(preludePath);
    if (idx !== -1) {
      config.instructions.splice(idx, 1);
      writeOpenCodeConfig(projectDir, config);
      success('opencode.json restored (prelude reference removed)');
    } else {
      info('No prelude reference found in opencode.json');
    }
  } else {
    warn('opencode.json not found — skipping restore');
  }

  step('Cleaning up prelude file');
  const preludePath = join(projectDir, '.cortex', 'prelude.md');
  if (existsSync(preludePath)) {
    try {
      unlinkSync(preludePath);
      success('Prelude file removed');
    } catch (e: any) {
      warn(`Failed to remove prelude: ${e.message}`);
    }
  } else {
    info('No prelude file to clean up');
  }

  if (options.retrospective) {
    step('Generating session retrospective');
    const warnings: string[] = [];
    if (!existsSync(join(projectDir, 'wiki', 'graph', 'graph.json'))) {
      warnings.push('Graphify report not found at session start');
    }
    if (!existsSync(join(projectDir, '.specify'))) {
      warnings.push('Spec-Kit tasks or plans not found');
    }
    const retroContent = generateRetrospective(projectDir, sessionInfo, summary || '', warnings);
    const retroPath = saveRetrospective(projectDir, retroContent);
    success(`Retrospective saved: ${retroPath}`);
  }

  heading('Session Finalized');
  success(`Session ${sessionInfo.sessionId} closed`);
  if (summary) {
    info(`Summary: ${summary}`);
  }
}
