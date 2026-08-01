# Handoff — TabSync AI v4.0

## Session Summary
- **Date**: 2026-08-02
- **Duration**: 2 sessions (2026-08-01 audit + fix, 2026-08-02 final audit + compact)
- **Commits pushed**: 2 (`43a0824` fixes, `7ebc684` release pipeline)
- **Commits on main**: 8 total

## Current State
- **Git**: Clean, up to date with `origin/main`
- **Worker**: LIVE at `https://tabsync-backend.dipuortoumberto.workers.dev`
- **KV**: `e516e95cc11b4b928b2d92f4f6ea7bac` (verified working)
- **Store zip**: `C:\Users\umber\Downloads\tabsync-ai-v4.zip` (14 entries, NEEDS REBUILD after manifest fixes)
- **All 3 worker endpoints**: Verified (user-status, organize-ai, create-checkout)
- **KV counter**: Tested (freeUses 0→5, 6th returns 402)

## Pending User Actions
1. **Load unpacked extension**: `chrome://extensions` → Developer mode → Load unpacked → select `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI`
2. **Test wizard**: Step 1 backup → Step 2 audit → Step 3 execute → Step 4 verify
3. **Test shortcuts**: Alt+O (organize), Alt+X (nuclear clean)
4. **Test restore**: Download backup → restore from JSON
5. **Chrome Web Store**: Register at devconsole, pay $5, upload zip

## Pending Code Changes
1. **Fix manifest.json**: Add icons, fix version, add default_icon
2. **Update PRIVACY.md**: Remove/mitigate false OpenRouter/Stripe claims
3. **Fix project-config.mjs**: Change branch to "main"
4. **Rebuild store zip** after manifest fixes
5. **Optionally**: Create eslint config, remove taskgemini/, fix release-push.mjs

## Key Technical Details
- **Windows NTFS quirk**: `tabsync-ai` and `TabSyncAI` are same directory (case-insensitive)
- **Chrome 151 bug**: `--load-extension` flag ignored on Windows (confirmed with minimal test extension)
- **Worker KV**: Free tier, 5 ops limit hardcoded, credits decrement by 0.003 per call
- **Organizer**: 14 local domains groups, worker has 6 rules — different sets

## Risks
- Store rejection if manifest lacks icons
- Privacy policy inaccuracies could cause legal issues
- No Stripe = no monetization
- Rule-based "AI" may disappoint users expecting real AI
- EULA contact email is personal consultant address

## Next Session Immediate Start
```
1. python "C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\RMY_GENOME\sync_system_manifest.py"
2. Read C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\RMY_GENOME\GENOME_MASTER_CONTEXT.md
3. cd C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\TabSyncAI
4. Read compact/1-SUMMARY.md through compact/6-HANDOFF.md
5. Priority: Fix manifest.json (D8, D9, D13) → rebuild zip → test
```