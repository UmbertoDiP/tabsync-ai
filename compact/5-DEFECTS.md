# Defects Log — TabSync AI v4.0

## Original Defects (from code review, session 2026-08-01)

| ID | Severity | Status | Description | Fix |
|----|----------|--------|-------------|-----|
| D1 | CRITICAL | FIXED (43a0824) | Export→import round-trip broken: exporter.js produces groups without internal `tabs` array; importOrganizedTabs expects `group.tabs` | `exporter.js:57-63` — patches flat tabs into groups using `groupTitle` mapping |
| D2 | CRITICAL | FIXED (43a0824) | Billing UI never displayed: getUserStatus, requestAICategorization, buyCredits defined in cloud.js but never called | `popup.js:101-129` — billing display + buy button; `background.js:68-92` — wired handlers |
| D3 | IMPORTANT | FIXED (43a0824) | restorer.js dead code: never imported in background.js | `background.js:5` — import; `background.js:102-107` — route detection for restorer format |
| D4 | NOTE | OPEN (decision pending) | /api/organize-ai uses 6 fixed rules, not AI. README and PRIVACY.md cite OpenRouter inaccurately | Decision: implement real LLM or update docs |
| D5 | NOTE | OPEN (blocked) | /api/create-checkout returns placeholder URL. Stripe not configured | Create Stripe account, update worker.js |
| D6 | COSMETIC | FIXED (43a0824) | "Step X of 3" but 4 panels; progress bar 133% at step 4 | `popup.html:43` — "of 4"; `popup.js:12` — `n/4` |
| D7 | RISK | FIXED (43a0824) | purgeSavedGroups deletes bookmarks with "group|gruppo" in title — could delete user bookmarks | `cleaner.js:28` — regex now requires BOTH `tab|tabsync` AND `group|gruppo` combined |

## New Defects Found (this audit, 2026-08-02)

| ID | Severity | Status | Description | Fix |
|----|----------|--------|-------------|-----|
| D8 | BLOCKER | OPEN | manifest.json missing `icons` field entirely | Add `"icons": { "16": "...", "48": "...", "128": "..." }` |
| D9 | HIGH | OPEN | Version mismatch: manifest "4.0" vs package.json "4.0.0" | Align both to same format |
| D10 | HIGH | OPEN | PRIVACY.md inaccuracies: OpenRouter, Stripe, fake email | Update to reflect actual architecture |
| D11 | MEDIUM | OPEN | No eslint config, but CI pipeline runs eslint | Create eslint config or remove gate |
| D12 | MEDIUM | OPEN | project-config.mjs branch "master" should be "main" | Edit config file |
| D13 | MEDIUM | OPEN | action missing `default_icon` in manifest | Add during D8 fix |
| D14 | LOW | OPEN | requestAICategorization in cloud.js is dead code | Remove or wire up |
| D15 | LOW | OPEN | EULA contact uses personal consultant email | Consider dedicated email |
| D16 | LOW | OPEN | release-push.mjs uses `git add -A` per file | Change to `git add --` |