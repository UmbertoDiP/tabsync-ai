# TabSync AI

Chrome extension MV3 for tab workspace management. Nuclear clean, smart organize, JSON export/import. One extension, zero zombies.

## Features

- **Nuclear Clean** (`Alt+X`): destroys all tabs and groups by ungrouping everything, replacing windows. No zombie groups survive.
- **Smart Organize** (`Alt+O`): categorizes tabs into 14 groups by domain rules (Lavoro, Finanza, AI, YouTube, Dev, etc.)
- **Export JSON**: saves all tabs and groups to a downloadable JSON file
- **Import JSON**: restores tabs and groups from JSON, skipping duplicates
- **Context Menu**: right-click anywhere → "Clean & Organize Workspace"
- **Backup + Rollback**: auto-saves state before clean, restores on failure

## Architecture

```
workspace-manager/
  manifest.json          ← MV3, ES modules, 7 permissions
  background.js          ← central message router + commands + context menu
  popup.html + popup.js  ← 4-button UI (Organize, Clean, Export, Import)
  modules/
    cleaner.js           ← nuclear window replacement + force ungroup + rollback
    organizer.js         ← 14-category domain matching + batch grouping
    exporter.js          ← JSON export/import with URL dedup
```

## Categories

| Group | Color | Domains |
|-------|-------|---------|
| 01_LAVORO | blue | linkedin, indeed, allibo, joblink, egovaleo |
| 02_FINANZA | green | stripe, paypal, mullvad, wise, revolut |
| 03_SOCIAL_SHOP | orange | whatsapp, telegram, amazon, ebay, keepa |
| 04_GMAIL | cyan | mail.google.com |
| 05_OUTLOOK | yellow | outlook.live.com |
| 06_GOOGLE | pink | one.google, workspace, contacts, accounts |
| 07_DRIVE | cyan | drive.google.com, docs.google.com |
| 08_YOUTUBE | red | youtube.com, youtu.be |
| 09_TOOLS | grey | speedtest.net |
| 10_SEARCH | grey | google.com/search |
| AI | purple | chatgpt, gemini, claude, perplexity |
| DEV | grey | github, gitlab, vercel, lovable, cursor, localhost |
| MEDIA | red | 192.168.x.x (Jellyfin) |
| VARIE | grey | ilfattoquotidiano, saveai.net |

## Install

1. Clone or download this repo
2. Open `chrome://extensions`, enable Developer mode
3. Click **Load unpacked** → select the `workspace-manager` folder
4. Click the extension icon in the toolbar

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+X` | Nuclear Clean |
| `Alt+O` | Clean & Organize |

Customize at `chrome://extensions/shortcuts`.

## How Nuclear Clean Works

1. Save backup (JSON + chrome.storage)
2. Force ungroup ALL tabs from ALL groups in old window
3. Create new identical window (same position, size, state)
4. Move pinned/audible tabs to new window
5. Destroy old window → all groups already at 0 tabs → gone
6. Rollback on failure: restores tabs from backup

## Tech

- Chrome Extension Manifest V3
- ES Modules (`type: "module"`)
- Chrome APIs: `tabs`, `tabGroups`, `windows`, `storage`, `downloads`, `notifications`, `contextMenus`, `commands`
- Zero dependencies. No build step. Vanilla JS.

## License

MIT