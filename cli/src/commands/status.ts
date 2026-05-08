import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { info, success, warn, error, heading } from '../utils/logger';

interface StatusOptions {
  json?: boolean;
}

interface StatusReport {
  project: {
    name: string;
    templateVersion: string;
    fileCount: number;
  };
  session: {
    active: boolean;
    sessionId?: string;
    startedAt?: string;
    duration?: string;
  };
  engram: {
    connected: boolean;
    version?: string;
    observationCount?: number;
  };
  graphify: {
    exists: boolean;
    stale?: boolean;
  };
  speckit: {
    taskCount: number;
    planCount: number;
  };
  wiki: {
    lastExport?: string;
  };
  tools: {
    opencode: { installed: boolean; version?: string };
    node: { installed: boolean; version?: string };
  };
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

function calculateDuration(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  const diff = Date.now() - start;
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function runTool(name: string, args: string[], timeout = 5000): string | null {
  try {
    return execSync(`${name} ${args.join(' ')}`, {
      encoding: 'utf-8',
      timeout,
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

export async function statusCommand(options: StatusOptions): Promise<void> {
  const projectDir = findProjectRoot(process.cwd());
  const report: StatusReport = {
    project: { name: 'unknown', templateVersion: '—', fileCount: 0 },
    session: { active: false },
    engram: { connected: false },
    graphify: { exists: false },
    speckit: { taskCount: 0, planCount: 0 },
    wiki: {},
    tools: {
      opencode: { installed: false },
      node: { installed: false },
    },
  };

  if (projectDir) {
    const manifestPath = join(projectDir, '.cortex', 'manifest.json');
    if (existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
        report.project.name = manifest.projectName || 'unknown';
        report.project.templateVersion = manifest.templateVersion || '—';
        report.project.fileCount = manifest.files?.length || 0;
      } catch {}
    }

    const sessionPath = join(projectDir, '.cortex', 'session.json');
    if (existsSync(sessionPath)) {
      try {
        const session = JSON.parse(readFileSync(sessionPath, 'utf-8'));
        report.session.active = true;
        report.session.sessionId = session.sessionId;
        report.session.startedAt = session.startedAt;
        report.session.duration = calculateDuration(session.startedAt);
      } catch {}
    }

    const speckitTasks = join(projectDir, '.specify', 'tasks');
    if (existsSync(speckitTasks)) {
      try {
        report.speckit.taskCount = readdirSync(speckitTasks).length;
      } catch {}
    }
    const speckitPlans = join(projectDir, '.specify', 'plans');
    if (existsSync(speckitPlans)) {
      try {
        report.speckit.planCount = readdirSync(speckitPlans).length;
      } catch {}
    }

    const graphJson = join(projectDir, 'wiki', 'graph', 'graph.json');
    if (existsSync(graphJson)) {
      report.graphify.exists = true;
      const graphMtime = statSync(graphJson).mtime;
      const manifestPath2 = join(projectDir, '.cortex', 'manifest.json');
      if (existsSync(manifestPath2)) {
        const manifestMtime = statSync(manifestPath2).mtime;
        report.graphify.stale = graphMtime < manifestMtime;
      }
    }

    const wikiDir = join(projectDir, 'wiki');
    if (existsSync(wikiDir)) {
      try {
        const wikiStat = statSync(wikiDir);
        report.wiki.lastExport = wikiStat.mtime.toISOString().split('T')[0] + ' ' +
          wikiStat.mtime.toTimeString().split(' ')[0].substring(0, 5);
      } catch {}
    }

    const engramStats = runTool('engram', ['stats', '--project', report.project.name]);
    if (engramStats) {
      report.engram.connected = true;
      const verMatch = runTool('engram', ['--version']);
      if (verMatch) report.engram.version = verMatch;
      const obsMatch = engramStats.match(/observations:\s*(\d+)/i);
      if (obsMatch) report.engram.observationCount = parseInt(obsMatch[1], 10);
    }
  }

  const ocVersion = runTool('opencode', ['--version']);
  if (ocVersion) {
    report.tools.opencode.installed = true;
    report.tools.opencode.version = ocVersion;
  }

  const nodeVersion = runTool('node', ['--version']);
  if (nodeVersion) {
    report.tools.node.installed = true;
    report.tools.node.version = nodeVersion;
  }

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  heading('Cortex Status');

  console.log(`Project:     ${report.project.name}`);
  console.log(`Template:    ${report.project.templateVersion} (${report.project.fileCount} files tracked)`);
  console.log('');

  if (report.session.active) {
    console.log(`Session:     ${report.session.sessionId} (active, started ${report.session.duration} ago)`);
    console.log(`  └ Run \`cortex close\` to finalize`);
  } else {
    console.log(`Session:     — (none active)`);
  }
  console.log('');

  const engramIcon = report.engram.connected ? '✅' : '⚠️';
  const engramExtra = report.engram.connected
    ? ` (v${report.engram.version}, ${report.engram.observationCount} observations in project)`
    : ' (not connected)';
  console.log(`Engram:      ${engramIcon} Connected${engramExtra}`);

  const graphIcon = report.graphify.exists ? (report.graphify.stale ? '⚠️' : '✅') : '⚠️';
  const graphMsg = report.graphify.exists
    ? (report.graphify.stale ? 'Graph stale — run `graphify update`' : 'Up to date')
    : 'No graph found — run `graphify .`';
  console.log(`Graphify:    ${graphIcon} ${graphMsg}`);

  const speckitStr = [];
  if (report.speckit.taskCount > 0) speckitStr.push(`${report.speckit.taskCount} task(s)`);
  if (report.speckit.planCount > 0) speckitStr.push(`${report.speckit.planCount} plan(s)`);
  console.log(`Spec-Kit:    ${speckitStr.length > 0 ? `✅ ${speckitStr.join(', ')}` : '— (none active)'}`);

  const wikiStr = report.wiki.lastExport ? `✅ Last export: ${report.wiki.lastExport}` : '⚠️ No wiki directory';
  console.log(`Wiki:        ${wikiStr}`);
  console.log('');

  const ocStr = report.tools.opencode.installed ? `✅ v${report.tools.opencode.version}` : '⚠️ Not installed';
  console.log(`OpenCode:    ${ocStr}`);

  const nodeStr = report.tools.node.installed ? `✅ ${report.tools.node.version}` : '⚠️ Not installed';
  console.log(`Node:        ${nodeStr}`);

  console.log('');
}
