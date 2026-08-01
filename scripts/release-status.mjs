#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const stateFile = join(projectRoot, '.release-state.json');
const logFile = join(projectRoot, '.release-log.txt');
const watchLogFile = join(projectRoot, '.release-watch.log');

if (!existsSync(stateFile)) {
  console.log('[status] Nessuna release in corso.');
  process.exit(2);
}

let state;
try { state = JSON.parse(readFileSync(stateFile, 'utf-8')); } catch (e) { console.log(`[status] State file corrotto: ${e.message}`); process.exit(1); }

console.log('=== DEPLOY STATUS ===');
console.log(`Phase   : ${state.phase}`);
console.log(`Status  : ${state.status}`);
console.log(`Updated : ${state.updatedAt}`);
if (state.version) console.log(`Version : ${state.version}`);
if (state.tag) console.log(`Tag     : ${state.tag}`);
if (state.headSha) console.log(`Commit  : ${String(state.headSha).slice(0, 8)}`);
if (state.error) console.log(`Error   : ${state.error}`);

if (state.headSha) {
  const res = spawnSync('gh', ['run', 'list', '--commit', String(state.headSha), '--limit', '10', '--json', 'databaseId,name,status,conclusion'], { encoding: 'utf8', cwd: projectRoot });
  if (res.status === 0) {
    try {
      const runs = JSON.parse(res.stdout);
      if (runs.length) { console.log('\nCI runs:'); for (const r of runs) console.log(`  #${r.databaseId} ${r.name}: ${r.status === 'completed' ? r.conclusion : r.status}`); }
    } catch {}
  }
}

for (const [label, file] of [['Watch log', watchLogFile], ['Release log', logFile]]) {
  if (existsSync(file)) {
    const lines = readFileSync(file, 'utf-8').split(/\r?\n/).filter(Boolean);
    if (lines.length) { console.log(`\n${label} (ultime 6):`); for (const l of lines.slice(-6)) console.log('  ' + l); }
  }
}

process.exit(state.status === 'failed' ? 1 : state.status === 'success' ? 0 : 2);