#!/usr/bin/env node
import { execSync, spawn } from 'node:child_process';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const config = (await import(join(projectRoot, 'project-config.mjs'))).default;

const stateFile = join(projectRoot, '.release-state.json');
const logFile = join(projectRoot, '.release-log.txt');

function updateState(phase, status, extra = {}) {
  let headSha = '';
  try { headSha = execSync('git rev-parse HEAD', { encoding:'utf-8', cwd: projectRoot }).trim(); } catch {}
  const state = { phase, status, version: config.version, tag: `v${config.version}`, headSha, ...extra, updatedAt: new Date().toISOString() };
  writeFileSync(stateFile, JSON.stringify(state, null, 2) + '\n');
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  appendFileSync(logFile, line + '\n');
  console.log(msg);
}

function run(cmd, cwd = projectRoot) {
  log(`RUN: ${cmd}`);
  const start = Date.now();
  try {
    execSync(cmd, { stdio: 'inherit', cwd, shell: true });
    log(`OK (${Date.now() - start}ms)`);
  } catch (e) {
    log(`ERR (${Date.now() - start}ms): exit ${e.status}`);
    updateState('error', 'failed', { error: e.message });
    process.exit(1);
  }
}

log('=== RELEASE PUSH START ===');
updateState('init', 'running');

const version = config.version || '0.0.0';
updateState('bump', 'running');
run('node scripts/bump-version.mjs', projectRoot);

const newVer = JSON.parse(readFileSync(join(projectRoot, config.versionFiles?.[0] || 'package.json'), 'utf-8')).version;
updateState('commit', 'running', { version: newVer });
for (const f of config.versionFiles || ['package.json']) { run(`git add -A "${f}"`); }
run(`git commit -m "chore(release): v${newVer}"`);

updateState('gate', 'running', { version: newVer });
const gates = config.gates || {};
if (gates.lint) { log('Lint...'); run(gates.lint, gates.cwd || projectRoot); }
if (gates.typecheck) { log('Typecheck...'); run(gates.typecheck, gates.cwd || projectRoot); }
if (gates.test) { log('Test...'); run(gates.test, gates.cwd || projectRoot); }
if (gates.build) { log('Build...'); run(gates.build, gates.cwd || projectRoot); }

const deploy = config.deploy || {};
updateState('deploy', 'running', { version: newVer, tag: `v${newVer}` });
if (deploy.type === 'cloudflare-pages') {
  const dir = deploy.pagesOutputDir || 'dist';
  const project = deploy.pagesProject || config.name;
  run(`npx wrangler pages deploy ${dir} --project-name=${project} --branch=${config.branch || 'main'} --commit-dirty=true`, projectRoot);
}
if (deploy.type === 'cloudflare-worker' && deploy.workerDir) {
  run(`npm run deploy`, join(projectRoot, deploy.workerDir));
}

updateState('push', 'running', { version: newVer, tag: `v${newVer}` });
run(`git push origin ${config.branch || 'master'}`);
run(`git tag v${newVer}`);
run(`git push origin v${newVer}`);

updateState('watch', 'running', { version: newVer, tag: `v${newVer}` });
const child = spawn('node', ['scripts/release-watch.mjs'], { cwd: projectRoot, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
child.unref();
log(`Watch CI detached (pid ${child.pid})`);

updateState('done', 'success', { version: newVer, tag: `v${newVer}` });
log(`=== RELEASE v${newVer} COMPLETE ===`);