# TaskGemini: Debug Chrome Extension - tabGroups.query restituisce 0

## Contesto

Estensione TabSync AI (MV3) installata e funzionante. Il popup mostra stats
con `chrome.tabs.query({})` e `chrome.tabGroups.query({})`. Le tab vengono
contate correttamente, ma i gruppi mostrano sempre 0, anche se nella tab strip
di Chrome ci sono ~200 gruppi visibili.

## Problema

```javascript
// popup.js chiama:
chrome.runtime.sendMessage({ action: "get_stats" }, (r) => {
  statsDiv.textContent = `${r.tabs} tabs  ·  ${r.groups} groups`;
});

// background.js risponde:
const tabs = await chrome.tabs.query({});
const groups = await chrome.tabGroups.query({});
sendResponse({ tabs: tabs.length, groups: groups.length });
```

Risultato: `6 tabs · 0 groups` ma dovrebbe essere `~200 tabs · ~200 groups`

## IPOTESI

1. `chrome.tabGroups.query({})` ha bisogno di un parametro `windowId`?
2. Il service worker non ha il permesso `tabGroups` attivo?
3. La query restituisce array vuoto per qualche ragione di scope?

## File

- Manifest: include `"tabGroups"` nei permissions
- `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\tabsync-ai\background.js`
- `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\tabsync-ai\manifest.json`

## Ambiente

- Wrangler 4.35.0 connesso (Cloudflare)
- Account: dipuortoumberto@gmail.com
- Account ID: 3b6245b263d581a0eddebc30df4797d6
- Permessi Workers+KV+AI attivi

## Richiesta

1. Come si debugga il service worker di un'estensione Chrome per vedere
   il valore reale restituito da `chrome.tabGroups.query({})`?
2. Come si usa Chrome DevTools Protocol (CDP) o `chrome.debugger` API
   per ispezionare i gruppi di schede dall'esterno?
3. Possiamo usare il Browser MCP (bjfgambnhccakkhmkepdoekmckoijdlc) per
   connetterci a Chrome e leggere i gruppi?
4. Fornisci comandi esatti per connettere CDP/Wrangler/MCP a questa
   estensione e debuggare il problema.