# Audit Findings — TabSync AI v4.0

## CRITICAL: Missing icons in manifest.json

**Severity**: BLOCKER (store submission)
**File**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\manifest.json`
**Detail**: The `icons` field is entirely absent. Icon files (16/48/128) exist in `icons/` directory but are not declared in manifest. This causes:
- Default puzzle piece icon shown instead of TabSync icon
- `chrome.notifications.create({iconUrl: "icons/icon128.png"})` in cleaner.js:78 may fail (icon not declared)
- Chrome Web Store requires icons declared in manifest

**Fix**: Add to manifest.json:
```json
"icons": {
  "16": "icons/icon16.png",
  "48": "icons/icon48.png",
  "128": "icons/icon128.png"
}
```

## HIGH: Version mismatch

**Severity**: HIGH
**Files**: `manifest.json` vs `package.json`
**Detail**: manifest.json has `"version": "4.0"` while package.json has `"version": "4.0.0"`. The release pipeline uses package.json as source of truth. Manifest V3 requires a string of 1-4 dot-separated integers. Both are valid MV3 format but inconsistency creates confusion.

**Fix**: Align formats. Either make both "4.0" or both "4.0.0". The bump-version.mjs uses semver (3-part) format.

## HIGH: Privacy policy inaccuracies

**Severity**: HIGH
**File**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\PRIVACY.md`
**Detail**: 
- Mentions "OpenRouter API" for AI processing — but worker uses rule-based categorization, no LLM
- Mentions "Payments (Stripe)" — Stripe not configured, checkout URL is placeholder
- Email is `support@tabsync.ai` — domain not owned/resolvable

**Fix**: Update PRIVACY.md to reflect actual architecture:
- Replace "OpenRouter API" with "rule-based categorization" or implement real LLM
- Remove or qualify Stripe mention
- Use real contact email (umberto.dipuorto2@consultant.aruba.it or the EULA email)

## MEDIUM: CI pipeline references non-existent eslint config

**Severity**: MEDIUM
**Files**: `.github/workflows/main.yml` (line 23), `project-config.mjs` (gate: lint)
**Detail**: `npx eslint . --max-warnings 0` runs but no `.eslintrc*` exists. The workflow has `continue-on-error: true` so it doesn't block, but the lint check is meaningless.

**Fix**: Either create an eslint config or remove the lint step from the pipeline.

## MEDIUM: Release pipeline branch mismatch

**Severity**: MEDIUM
**File**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\project-config.mjs` (line 4)
**Detail**: `branch: 'master'` but actual repo branch is `main`. The release-push.mjs script will push to `master` which doesn't exist, causing `git push origin master` to fail.

**Fix**: Change `branch: 'master'` to `branch: 'main'` in project-config.mjs.

## MEDIUM: default_icon missing in action

**Severity**: MEDIUM
**File**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\manifest.json` (line 11-13)
**Detail**: The `action` object has `default_popup` but no `default_icon` and no `default_title`. The extension tab will show a default puzzle piece.

**Fix**: Add `"default_icon": { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" }` to the action.

## LOW: requestAICategorization never called

**Severity**: LOW (dead code)
**File**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\modules\cloud.js` (lines 41-62)
**Detail**: `requestAICategorization()` is defined and exported but never imported or called anywhere. The organizer uses local `organizer.js` (domain-based) exclusively. `Alt+O` never calls the worker.

**Fix**: Either remove the function or wire it up as an alternative to local organizer.

## LOW: EULA contact email uses personal consultant address

**Severity**: LOW
**File**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\EULA.txt` (line 63)
**Detail**: Uses `umberto.dipuorto2@consultant.aruba.it` — personal Aruba consultant email. For a published product, a dedicated product email would be more appropriate.

**Fix**: Create a dedicated support email or use a more appropriate address.

## LOW: taskgemini/ folder contains stale working files

**Severity**: LOW
**Files**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\taskgemini/*`
**Detail**: Old Gemini analysis files (background-workspace.js, cleaner-module.js, etc.) from previous AI-assisted development sessions. Not harmful but should be excluded from store zip.

**Status**: Already excluded from zip (not in store package).

## LOW: release-push.mjs uses `git add -A` per file

**Severity**: LOW
**File**: `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI\scripts\release-push.mjs` (line 49)
**Detail**: `run(`git add -A "${f}"`)` — the `-A` flag stages ALL changes, not just the specified file. This is misleading and could commit unintended changes.

**Fix**: Use `--` instead of `-A` or use `git add` without `-A`.