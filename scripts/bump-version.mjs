#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

let versionFiles = ['package.json'];
let projectName = 'project';
try {
  const cfg = (await import(join(projectRoot, 'project-config.mjs'))).default;
  versionFiles = cfg.versionFiles || versionFiles;
  projectName = cfg.name || projectName;
} catch {}

function parseSemver(v) {
  const m = String(v).replace(/^v/, '').match(/^(\d+)\.(\d+)\.(\d+)$/);
  return m ? { major: +m[0], minor: +m[1], patch: +m[2], raw: `${m[0]}.${m[1]}.${m[2]}` } : null;
}

function compare(a, b) {
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  return a.patch - b.patch;
}

function bumpPatch(s) { return `${s.major}.${s.minor}.${s.patch + 1}`; }

function getGitTags() {
  try {
    return execSync('git tag -l "v*"', { cwd: projectRoot, encoding: 'utf-8' })
      .split(/\r?\n/).map(t => t.trim()).filter(Boolean);
  } catch { return []; }
}

const pkg = JSON.parse(readFileSync(join(projectRoot, versionFiles[0]), 'utf-8'));
const current = parseSemver(pkg.version);
if (!current) { console.error(`Invalid version: ${pkg.version}`); process.exit(1); }

let maxFromTags = null;
for (const tag of getGitTags()) {
  const m = tag.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!m) continue;
  const s = parseSemver(m[0]);
  if (!s) continue;
  if (!maxFromTags || compare(s, maxFromTags) > 0) maxFromTags = s;
}

let baseline = current;
if (maxFromTags && compare(maxFromTags, baseline) > 0) baseline = maxFromTags;

const tagForCurrent = `v${current.raw}`;
const hasCurrentTag = getGitTags().includes(tagForCurrent);
const NEXT_RAW = hasCurrentTag ? bumpPatch(baseline) : current.raw;

for (const f of versionFiles) {
  const fp = join(projectRoot, f);
  if (!existsSync(fp)) continue;
  const p = JSON.parse(readFileSync(fp, 'utf-8'));
  if (p.version !== NEXT_RAW) {
    p.version = NEXT_RAW;
    writeFileSync(fp, JSON.stringify(p, null, 2) + '\n');
    console.log(`Synced ${f} version -> ${NEXT_RAW}`);
  }
}

console.log(`NEXT_VERSION=v${NEXT_RAW}`);
process.stdout.write(NEXT_RAW);