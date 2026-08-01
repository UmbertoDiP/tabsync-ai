# Architecture — TabSync AI v4.0

## Extension Structure

```
tabsync-ai/
  manifest.json          ← MV3, version 4.0, 9 permissions
  background.js          ← Service worker, imports all modules, message handlers
  popup.html             ← Wizard UI (4 steps), billing display, restore button
  popup.js               ← Step logic, billing UI, restore handler, EULA link
  modules/
    cleaner.js           ← runDeepEradication(): save state, purge bookmarks, ungroup, window recreate, notify
    organizer.js         ← organizeTabs(): 14 local groups (domain-based), no AI call
    exporter.js          ← exportAllTabs() + importOrganizedTabs() with D1 round-trip fix
    restorer.js          ← restoreWorkspace(): full backup restore (new window, groups, pinned)
    cloud.js             ← getUserId(), getUserStatus(), buyCredits(), requestAICategorization() (dead code)
  icons/
    icon16.png, icon48.png, icon128.png
  backend/
    worker.js            ← Cloudflare Worker (3 endpoints)
    wrangler.toml        ← KV binding, worker config
  scripts/
    bump-version.mjs     ← Semver bump with git tag detection
    gate-pre-release.mjs ← Run pre-release gates
    release-push.mjs     ← Automated release pipeline
    release-watch.mjs    ← CI monitoring after push
    release-status.mjs   ← Check release progress
  compact/               ← THIS folder (session handoff)
  EULA.txt               ← End User License Agreement
  PRIVACY.md             ← Privacy Policy (needs updates)
  README.md              ← Project readme (needs updates)
  package.json           ← npm scripts, version 4.0.0
  project-config.mjs     ← Release pipeline config
  taskgemini/            ← Stale analysis files (excluded from zip)
```

## Data Flow

### Wizard Flow (popup → background)
1. Step 1: `export` → `exportAllTabs()` → JSON file download
2. Step 2: `get_full_audit` → tab/group/bookmark count
3. Step 3: `execute_deep_eradication` → `runDeepEradication()` → save state + purge + ungroup + window recreate + notify
4. Step 4: Result display

### Keyboard Shortcuts
- `Alt+O`: `organize-all` → `runFullWorkflow()` → clean + organize (local, 14 groups)
- `Alt+X`: `clean-all` → `runDeepEradication()` → nuclear clean

### Restore Flow
- `import` message → background.js detects format:
  - If groups have numeric `.id` → routes to `restoreWorkspace()` (cleaner backup format)
  - Otherwise → routes to `importOrganizedTabs()` (export format with D1 flat→groups patch)

### Billing Flow
- `get_user_info` → `getUserId()` + `getUserStatus()` → displays free ops/credits
- `buy_credits` → `buyCredits(5)` → worker `/api/create-checkout` → opens Stripe placeholder URL

## Worker Endpoints

| Endpoint | Method | Auth | Behavior |
|----------|--------|------|----------|
| `/api/user-status` | GET | X-User-Id | Returns `{freeUses, credits}` from KV |
| `/api/organize-ai` | POST | X-User-Id | Rule-based categorization (6 fixed rules), increments KV counter |
| `/api/create-checkout` | POST | X-User-Id | Returns placeholder Stripe URL |

## KV Schema
- Key: `user:{userId}`
- Value: `{ freeUses: number, credits: number }`
- FREE_LIMIT: 5 (hardcoded in worker.js)