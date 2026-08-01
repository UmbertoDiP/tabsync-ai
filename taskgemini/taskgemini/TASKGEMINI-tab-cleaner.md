# TaskGemini: Tab Cleaner non rimuove i gruppi di schede Chrome

## Contesto

Ho creato un'estensione Chrome (Tab Cleaner) che deve azzerare completamente tutte le
tab e tutti i gruppi di schede. Le tab vengono chiuse correttamente, ma i gruppi di
schede (tab groups) persistono come "zombie" anche dopo la chiusura di tutte le tab.

L'agente AI (opencode) non puo testare l'estensione direttamente perche non ha accesso
alla UI di Chrome. Abbiamo provato 4 iterazioni diverse senza successo.

## Problema Specifico

1. `chrome.tabs.remove(ids)` chiude le tab, ma i gruppi restano visibili nella tab strip
2. L'utente vede ancora le etichette dei gruppi (es: "01_LAVORO", "AI", etc.) anche se
   non ci sono tab dentro
3. `chrome.tabGroups.query({})` dopo la pulizia mostra ancora gruppi presenti
4. Provato: ungroup prima di close, close diretto, zombie-killer (creo tab fittizia,
   la metto nel gruppo, la sgruppo, la chiudo), doppio pass di cleanup
5. NIENTE funziona: i gruppi persistono sempre

## Root Cause Sospetta

L'API `chrome.tabGroups` NON ha un metodo `remove()`. I gruppi dovrebbero auto-cancellarsi
quando diventano vuoti (tutte le tab nel gruppo vengono chiuse). Ma questo meccanismo
sembra non scattare in alcune condizioni.

## File da Analizzare

### Estensione da fixare (Tab Cleaner)
- `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\taskgemini\background-tab-cleaner.js`
- `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\taskgemini\manifest-tab-cleaner.json`

### Estensione che crea i gruppi (Tab Exporter - contesto)
- `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\taskgemini\background-tab-exporter.js`
- `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\taskgemini\manifest-tab-exporter.json`

### Estensione originale di riferimento (tab_organizer_extension)
- `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\taskgemini\background-tab-organizer.js`
- `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\taskgemini\manifest-tab-organizer.json`

## Snippet Codice Chiave

### Tab Cleaner (versione attuale - NON funziona)

```javascript
// Chiude tab dirette (Chrome auto-cancella gruppi quando ultima tab chiusa)
const closeIds = allTabs.map(t => t.id);
for (let i = 0; i < closeIds.length; i += 10) {
  const batch = closeIds.slice(i, i + 10);
  try { await chrome.tabs.remove(batch); } catch (e) {
    for (const id of batch) { try { await chrome.tabs.remove(id); } catch {} }
  }
  await new Promise(r => setTimeout(r, 200));
}

// Zombie group cleanup
const zombieGroups = await chrome.tabGroups.query({});
for (const g of zombieGroups) {
  const tempTab = await chrome.tabs.create({ url: "about:blank", windowId: g.windowId, active: false });
  await chrome.tabs.group({ tabIds: tempTab.id, groupId: g.id });
  await chrome.tabs.ungroup(tempTab.id);
  await chrome.tabs.remove(tempTab.id);
}
```

### Tab Exporter (crea gruppi cosi)

```javascript
const groupId = await chrome.tabs.group({ tabIds });
await chrome.tabGroups.update(groupId, { title: group.name, color: color, collapsed: false });
```

## Log/Errori

Nessun errore JS. Le operazioni API vanno a buon fine. Il problema e che
dopo `chrome.tabs.remove()`, `chrome.tabGroups.query({})` restituisce ancora
i gruppi, oppure i gruppi sono visibili nella UI ma non nell'API (zombie visuali).

## Richiesta a Gemini

1. Qual e il modo CORRETTO per rimuovere completamente un tab group in Chrome MV3?
2. Esiste un workaround usando `chrome.debugger` API o `chrome.windows` API per
   forzare la rimozione dei gruppi zombie?
3. C'e un bug noto di Chrome (segnalato su crbug.com) sulla persistenza dei gruppi
   vuoti dopo `chrome.tabs.remove`?
4. Fornisci il codice completo di `background.js` che RIESCE a pulire tutto
   (tab + gruppi) in modo affidabile, con gestione degli edge case.