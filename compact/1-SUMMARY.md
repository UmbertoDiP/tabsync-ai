# TabSync AI v4.0 — Compact Summary

## Project Identity
- **Name**: TabSync AI
- **Version**: 4.0 (manifest) / 4.0.0 (package.json — MISMATCH)
- **Type**: Chrome Extension Manifest V3 + Cloudflare Worker backend
- **Repo**: `https://github.com/UmbertoDiP/tabsync-ai.git` (branch `main`)
- **Worker**: `https://tabsync-backend.dipuortoumberto.workers.dev` (KV `e516e95cc11b4b928b2d92f4f6ea7bac`)
- **Extension dir**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI`
- **Store zip**: `C:\Users\umber\Downloads\tabsync-ai-v4.zip` (14 entries, manifest OK)

## Session Scope
Pre-publish audit of TabSync AI v4.0: verify endpoints, fix defects, prepare for Chrome Web Store submission.

## Completed Work
1. **Worker endpoints verified** (3/3):
   - `GET /api/user-status` — returns `{freeUses, credits}` JSON
   - `POST /api/organize-ai` — rule-based categorization, KV counter
   - `POST /api/create-checkout` — returns placeholder Stripe URL

2. **KV counter tested**: freeUses 0->5, 6th call returns 402 "Credits exhausted"

3. **7 defects fixed** (commit `43a0824`, pushed to `main`):
   - D1: Export→import round-trip (exporter.js patches flat tabs into groups)
   - D2: Billing UI display in popup (free ops, credits, buy button)
   - D3: restorer.js wired in background.js import handler
   - D6: step indicator corrected to "of 4", progress bar correct
   - D7: bookmark purge regex requires BOTH `tab|tabsync` AND `group|gruppo`
   - Plus: cloud.js buyCredits return data, background.js imports + handlers

4. **Release pipeline** created (commit `7ebc684`):
   - `scripts/bump-version.mjs` — semver bump with git tag detection
   - `scripts/gate-pre-release.mjs` — run pre-release checks
   - `scripts/release-push.mjs` — automated version bump + commit + gate + push + tag
   - `scripts/release-watch.mjs` — monitor CI after push
   - `scripts/release-status.mjs` — check release progress
   - `.github/workflows/main.yml` — CI pipeline (self-hosted)
   - `project-config.mjs` — config for release pipeline
   - `package.json` — npm scripts for release commands

5. **Chrome Web Store zip** updated at `C:\Users\umber\Downloads\tabsync-ai-v4.zip`

## Blockers
- **Chrome E2E blocked**: Chrome 151 on Windows ignores `--load-extension` for any extension. Manual "Load unpacked" required.
- **Stripe**: Not configured. `/api/create-checkout` returns placeholder URL.
- **OpenRouter/LLM**: Not implemented. Worker uses 6 rule-based rules, not AI.