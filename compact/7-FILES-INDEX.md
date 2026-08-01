# File Index — TabSync AI v4.0

## Extension Files

| File | Path | Purpose | Last Modified |
|------|------|---------|---------------|
| manifest.json | Root | Extension manifest v3, version 4.0 | 2026-08-01 |
| background.js | Root | Service worker, message handlers, command listeners | 2026-08-01 (D2/D3 fix) |
| popup.html | Root | Wizard UI 4-step, billing, restore, EULA link | 2026-08-01 (D6 fix) |
| popup.js | Root | Step logic, billing display, restore handler | 2026-08-01 (D2/D6 fix) |
| cleaner.js | modules/ | Deep clean, bookmark purge, state save | 2026-08-01 (D7 fix) |
| organizer.js | modules/ | Domain-based 14-group categorization | 2026-08-01 (original) |
| exporter.js | modules/ | Export/import with round-trip fix | 2026-08-01 (D1 fix) |
| restorer.js | modules/ | Full workspace restore from backup | 2026-08-01 (original) |
| cloud.js | modules/ | User ID, billing, AI proxy (dead code) | 2026-08-01 (D2 fix) |
| icon16.png | icons/ | Extension icon 16x16 | 2026-08-01 |
| icon48.png | icons/ | Extension icon 48x48 | 2026-08-01 |
| icon128.png | icons/ | Extension icon 128x128 | 2026-08-01 |

## Backend Files

| File | Path | Purpose | Last Modified |
|------|------|---------|---------------|
| worker.js | backend/ | Cloudflare Worker (3 endpoints) | 2026-08-01 |
| wrangler.toml | backend/ | Worker config, KV binding | 2026-08-01 |

## Pipeline Files

| File | Path | Purpose | Last Modified |
|------|------|---------|---------------|
| package.json | Root | npm scripts, version 4.0.0 | 2026-08-01 |
| project-config.mjs | Root | Release pipeline config (branch: master — BUG) | 2026-08-01 |
| bump-version.mjs | scripts/ | Semver bump with git tag detection | 2026-08-01 |
| gate-pre-release.mjs | scripts/ | Pre-release gate checks | 2026-08-01 |
| release-push.mjs | scripts/ | Automated release pipeline | 2026-08-01 |
| release-watch.mjs | scripts/ | CI monitoring after push | 2026-08-01 |
| release-status.mjs | scripts/ | Release progress check | 2026-08-01 |
| main.yml | .github/workflows/ | CI pipeline (self-hosted runner) | 2026-08-01 |

## Documentation

| File | Path | Purpose | Last Modified |
|------|------|---------|---------------|
| README.md | Root | Project readme (needs arch update) | 2026-08-01 |
| PRIVACY.md | Root | Privacy policy (needs accuracy fixes) | 2026-08-01 |
| EULA.txt | Root | End User License Agreement | 2026-08-01 |

## Compact Files (this folder)

| File | Purpose |
|------|---------|
| 1-SUMMARY.md | Session summary, completed work, blockers |
| 2-AUDIT-FINDINGS.md | All defects found (D8-D16 new) |
| 3-ARCHITECTURE.md | Full project structure, data flow, endpoints |
| 4-ROADMAP.md | Prioritized task list with dependencies |
| 5-DEFECTS.md | Complete defect log (D1-D16) |
| 6-HANDOFF.md | Next session immediate start instructions |
| 7-FILES-INDEX.md | This file |

## Stale/Ignored Files

| File | Reason |
|------|--------|
| taskgemini/* | Old Gemini analysis files, not in zip |
| .gitignore | Git ignore rules |
| compact/ | This folder (not in zip, development only) |