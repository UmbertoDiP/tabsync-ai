#!/usr/bin/env node
import { spawnSync, execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

let actionsUrl = 'https://github.com/UmbertoDiP/project/actions?query=branch%3Amaster';
let defaultMaxWaitMin = 60;
let branch = 'master';
try {
  const cfg = (await import(join(projectRoot, 'project-config.mjs'))).default;
  actionsUrl = cfg.actionsUrl || actionsUrl;
  defaultMaxWaitMin = cfg.release?.maxWaitMin || defaultMaxWaitMin;
  branch = cfg.branch || branch;
} catch {}

const BASE_POLL_MS = 20000;
const MAX_BACKOFF_MS = 120000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ghAvailable() {
  try { execSync('gh --version', { stdio: 'ignore' }); return true; } catch { return false; }
}

export function classifyGhResult(res) {
  if (!res || res.status !== 0) {
    const err = (res?.stderr || '').toLowerCase();
    if (err.includes('auth') || err.includes('login') || err.includes('credentials')) return { error: 'auth', msg: res?.stderr };
    if (err.includes('rate limit')) return { error: 'ratelimit', msg: res?.stderr };
    return { error: 'network', msg: res?.stderr || 'Network/DNS unreachable' };
  }
  return null;
}

export function runsForHead(targetHead) {
  const res = spawnSync('gh', ['run', 'list', '--branch', branch, '--limit', '12', '--json', 'databaseId,headSha,name,status,conclusion,startedAt'], { encoding: 'utf8', cwd: projectRoot });
  const classified = classifyGhResult(res);
  if (classified) return classified;
  try {
    const sha = String(targetHead);
    return JSON.parse(res.stdout).filter((r) => r.headSha === sha || r.headSha.startsWith(sha));
  } catch { return { error: 'network', msg: 'JSON parse failed' }; }
}

export function runById(id) {
  const res = spawnSync('gh', ['run', 'view', String(id), '--json', 'databaseId,name,status,conclusion,startedAt,event'], { encoding: 'utf8', cwd: projectRoot });
  const classified = classifyGhResult(res);
  if (classified) return classified;
  try { return JSON.parse(res.stdout); } catch { return { error: 'network', msg: 'JSON parse failed' }; }
}

export function computeAdaptiveMaxWaitMin(durationsMs) {
  const valid = (durationsMs || []).filter((d) => Number.isFinite(d) && d > 0);
  if (!valid.length) return defaultMaxWaitMin;
  return Math.min(150, Math.max(30, Math.round((Math.max(...valid) * 1.5) / 60000)));
}

function fetchRecentSuccessDurations() {
  const res = spawnSync('gh', ['run', 'list', '--branch', branch, '--limit', '12', '--status', 'success', '--json', 'startedAt,updatedAt'], { encoding: 'utf8', cwd: projectRoot });
  if (res.status !== 0) return [];
  try {
    return JSON.parse(res.stdout).map((r) => Date.parse(r.updatedAt) - Date.parse(r.startedAt)).filter((d) => d > 0);
  } catch { return []; }
}

function argValue(name) {
  const i = process.argv.indexOf(name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

if (!ghAvailable()) {
  console.log(`[watch] gh non disponibile. Segui la CI qui:\n  ${actionsUrl}`);
  process.exit(3);
}

const head = argValue('--sha') || execSync('git rev-parse HEAD', { encoding: 'utf8', cwd: projectRoot }).trim();
const shortHead = head.slice(0, 8);
const runId = argValue('--run-id');
const maxWaitMin = Number.parseInt(argValue('--max-wait-min') || '', 10) || computeAdaptiveMaxWaitMin(fetchRecentSuccessDurations());
const MAX_WAIT_MS = maxWaitMin * 60 * 1000;
const deadline = Date.now() + MAX_WAIT_MS;
let consecutiveErrors = 0;

console.log(`[watch] Avvio monitoraggio CI${runId ? ` run #${runId}` : ` commit ${shortHead}`}... (deadline: ${maxWaitMin}m)`);

if (runId) {
  let run = null;
  while (Date.now() < deadline) {
    const res = runById(runId);
    if (res && res.error) {
      consecutiveErrors++;
      if (res.error === 'auth') { console.log(`[watch] FATAL (auth): credenziali gh scadute.\n${res.msg.trim()}`); process.exit(3); }
      let waitMs = res.error === 'ratelimit' ? 60000 + Math.random() * 10000 : Math.min(MAX_BACKOFF_MS, BASE_POLL_MS * Math.pow(1.5, consecutiveErrors - 1)) + Math.random() * 5000;
      await sleep(waitMs); continue;
    }
    consecutiveErrors = 0;
    run = res;
    if (run.status !== 'completed') { console.log(`[watch] run #${runId} ${run.name}: ${run.status}...`); await sleep(BASE_POLL_MS); continue; }
    break;
  }
  if (!run) { console.log(`[watch] attesa scaduta (${maxWaitMin}m). Controlla: ${actionsUrl}`); process.exit(4); }
  console.log(`[watch] ${run.name}: ${run.conclusion || 'timeout'}`);
  if (run.conclusion === 'success') { console.log('[watch] VERDE.'); process.exit(0); }
  console.log(`[watch] ROSSO: ${run.name} = ${run.conclusion}`); process.exit(2);
}

let current = [];
let runsDiscovered = false;
while (Date.now() < deadline) {
  const res = runsForHead(head);
  if (res && res.error) {
    consecutiveErrors++;
    if (res.error === 'auth') { console.log(`[watch] FATAL (auth).\n${res.msg.trim()}`); process.exit(3); }
    let waitMs = res.error === 'ratelimit' ? 60000 + Math.random() * 10000 : Math.min(MAX_BACKOFF_MS, BASE_POLL_MS * Math.pow(1.5, consecutiveErrors - 1)) + Math.random() * 5000;
    await sleep(waitMs); continue;
  }
  consecutiveErrors = 0;
  current = res;
  if (current.length === 0) { if (!runsDiscovered) { await sleep(BASE_POLL_MS); continue; } console.log(`[watch] run sparite per ${shortHead}.`); process.exit(3); }
  if (!runsDiscovered) { runsDiscovered = true; console.log(`[watch] ${current.length} run rilevate: ${current.map(r => r.name).join(', ')}`); }
  const running = current.filter(r => r.status !== 'completed');
  if (running.length === 0) break;
  console.log(`[watch] in corso: ${running.map(r => r.name).join(', ')}`);
  await sleep(BASE_POLL_MS);
}

const failed = current.filter(r => r.conclusion && r.conclusion !== 'success');
for (const r of current) console.log(`[watch] ${r.name}: ${r.conclusion || 'timeout'}`);
if (failed.length) { console.log(`[watch] ROSSO: ${failed.map(r => r.name).join(', ')}`); process.exit(2); }
if (current.length > 0 && current.every(r => r.conclusion === 'success')) { console.log('[watch] VERDE.'); process.exit(0); }
console.log(`[watch] attesa scaduta (${maxWaitMin}m). Controlla: ${actionsUrl}`); process.exit(4);