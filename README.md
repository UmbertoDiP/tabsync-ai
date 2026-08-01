# TabSync AI

> Organize tabs with AI, nuclear clean your workspace, backup securely in 1-click.

## Chrome Web Store Listing

**Short Description (132 chars):**
> Organize tabs with AI, nuclear clean your workspace, and back up your browser securely in 1-click.

## Features

- **AI Auto-Organization** — Groups tabs into semantic categories (Dev, Research, Media, Work) with proper colors and titles.
- **Nuclear Deep Clean** — Force ungroup + bookmark purge + window replacement. No zombie groups survive.
- **Guided Wizard** — 4-step flow: mandatory backup → audit → clean → verify. Zero data loss risk.
- **Backup & Restore** — Download workspace as JSON, restore anytime with full fidelity.
- **Protected Loop** — Idle detection auto-cleans while you're away, never interrupts active work.
- **5 Free AI Ops** — Start instantly with 5 free AI organizations.

## Install

1. Clone this repo
2. Open `chrome://extensions`, enable Developer mode
3. Click **Load unpacked** → select this folder

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+X` | Nuclear Clean |
| `Alt+O` | Clean & Organize |

## Architecture

```
tabsync-ai/
  manifest.json
  background.js
  popup.html + popup.js
  modules/
    cleaner.js      ← deep clean + force ungroup + bookmark purge
    organizer.js    ← domain-based batch grouping
    exporter.js     ← JSON export/import with dedup
    restorer.js    ← full workspace restoration
    cloud.js        ← billing, auth, AI proxy
```

## Tech

- Chrome Extension Manifest V3
- ES Modules
- Zero dependencies
- Cloudflare Workers + Stripe (backend, credit purchase pending)
- Chrome Web Store ready

## License

MIT