#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const config = (await import(join(projectRoot, 'project-config.mjs'))).default;

const gates = config.gates || {};
let allPassed = true;
const results = [];

for (const [name, cmd] of Object.entries(gates)) {
  process.stdout.write(`${name}: `);
  try {
    execSync(cmd, { stdio: 'pipe', cwd: gates.cwd || projectRoot, timeout: 120_000 });
    process.stdout.write('OK\n');
    results.push({ name, status: 'passed' });
  } catch (e) {
    process.stdout.write(`FAILED (exit ${e.status})\n`);
    results.push({ name, status: 'failed', error: e.message });
    allPassed = false;
  }
}

writeFileSync(join(projectRoot, '.gate-results.json'), JSON.stringify(results, null, 2));
process.exit(allPassed ? 0 : 1);