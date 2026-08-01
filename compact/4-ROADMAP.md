# Operational Roadmap — TabSync AI v4.0

**Priority order**: P0 (blocker) → P1 (critical) → P2 (important) → P3 (nice-to-have)

## P0: Blocker — Must fix before store submission

### Task 0.1: Fix missing icons in manifest.json
- **Status**: NOT STARTED
- **File**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\manifest.json`
- **Action**: Add `icons` field with 16/48/128 references
- **Dependency**: None
- **Next step**: Edit manifest.json, add `"icons": { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" }` and `"default_icon"` in action
- **Verify**: `python -c "import json; d=json.load(open('manifest.json')); assert 'icons' in d; print('OK')"`

### Task 0.2: Update PRIVACY.md to match reality
- **Status**: NOT STARTED
- **File**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\PRIVACY.md`
- **Action**: Remove/mitigate OpenRouter references, qualify Stripe, fix email
- **Dependency**: Decision on D4 (OpenRouter/LLM)
- **Next step**: Decide if implementing real LLM or updating docs to say "rule-based"

## P1: Critical — Must fix before release

### Task 1.1: Manual Chrome E2E test
- **Status**: BLOCKED (Chrome 151 bug)
- **Action**: Load `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI` via `chrome://extensions` → "Load unpacked"
- **Dependency**: None
- **Next step**: User opens Chrome, enables Developer mode, loads unpacked extension
- **Verify**: Test wizard (step 1 backup, step 2 execute, step 4 result), Alt+O, Alt+X, restore round-trip

### Task 1.2: Fix version mismatch
- **Status**: NOT STARTED
- **Files**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\manifest.json`, `package.json`
- **Action**: Align versions — either change manifest to "4.0.0" or change package.json to "4.0"
- **Dependency**: None
- **Next step**: Edit manifest.json version to "4.0.0" (consistent with semver pipeline)

### Task 1.3: Fix branch config in project-config.mjs
- **Status**: NOT STARTED
- **File**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\project-config.mjs`
- **Action**: Change `branch: 'master'` to `branch: 'main'`
- **Dependency**: None
- **Next step**: Edit project-config.mjs line 4

## P2: Important — Should fix before release

### Task 2.1: Add default_icon to action
- **Status**: NOT STARTED
- **File**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\manifest.json`
- **Action**: Add `default_icon` and `default_title` in action object
- **Dependency**: Task 0.1 (same manifest edit)
- **Next step**: Add during manifest.json edit

### Task 2.2: Fix eslint/gate pipeline
- **Status**: NOT STARTED
- **Files**: `.github/workflows/main.yml`, `.eslintrc` (new)
- **Action**: Either create `.eslintrc` config or remove lint gate
- **Dependency**: None
- **Next step**: Create minimal eslint config or update project-config.mjs gates

### Task 2.3: Chrome Web Store registration
- **Status**: NOT STARTED
- **Action**: Register at `chrome.google.com/webstore/devconsole`, pay $5 one-time fee
- **Dependency**: Task 0.1, 1.2 (fixed manifest)
- **Next step**: Create developer account, upload `C:\Users\umber\Downloads\tabsync-ai-v4.zip`

### Task 2.4: Update README.md
- **Status**: NOT STARTED
- **File**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\README.md`
- **Action**: Update "Tech" section — remove or qualify OpenRouter/Stripe claims
- **Dependency**: Decision on D4 (OpenRouter)
- **Next step**: Edit README to reflect actual architecture

## P3: Nice-to-have — Post-release improvements

### Task 3.1: Stripe integration
- **Status**: NOT STARTED
- **File**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\backend\worker.js`
- **Action**: Create Stripe account, implement real checkout session creation
- **Dependency**: None (independent)
- **Next step**: Create Stripe account, get API keys, update worker.js

### Task 3.2: Real LLM integration (Decision D4)
- **Status**: PENDING DECISION
- **Files**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\backend\worker.js`, `PRIVACY.md`, `README.md`
- **Options**:
  - A) Implement real OpenRouter call in worker (cost: ~$0.001/call)
  - B) Remove all OpenRouter references from docs, keep rule-based
- **Dependency**: None
- **Next step**: Decide approach, then implement or update docs

### Task 3.3: Clean up taskgemini/ folder
- **Status**: NOT STARTED
- **Action**: Delete stale analysis files from repo
- **Dependency**: None
- **Next step**: `git rm -r taskgemini/ && git commit -m "chore: remove stale taskgemini files"`

### Task 3.4: Fix release-push.mjs `git add -A` → `git add`
- **Status**: NOT STARTED
- **File**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\scripts\release-push.mjs`
- **Action**: Change `-A` to proper file-specific add
- **Dependency**: None
- **Next step**: Edit line 49

### Task 3.5: Update EULA contact email
- **Status**: NOT STARTED
- **File**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\EULA.txt`
- **Action**: Consider using a dedicated product email
- **Dependency**: None
- **Next step**: Decide on appropriate contact address

## Critical Path
```
1. Fix manifest.json (icons + version + default_icon) → 2. Rebuild store zip → 3. Manual Chrome test → 4. Chrome Web Store upload → 5. Stripe setup → 6. LLM decision
```

## Current Session Blockers
- Chrome 151 `--load-extension` bug: requires manual "Load unpacked"
- No Stripe account: checkout URL is placeholder
- No LLM decision: OpenRouter references in docs are inaccurate