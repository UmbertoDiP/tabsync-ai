# TaskGemini: Nuclear Clean non azzera i gruppi di schede

## Contesto

Ho un'estensione Chrome MV3 (Workspace Manager) che deve azzerare TUTTE le tab e TUTTI
i gruppi di schede. L'approccio "nuclear clean" ricrea le finestre invece di chiudere
le tab individualmente (teoricamente i gruppi muoiono con la finestra). MA NON FUNZIONA:
dopo l'esecuzione, alcuni gruppi restano visibili nella tab strip.

## Problema Specifico

1. `chrome.windows.remove(oldWin.id)` chiude la finestra, Chrome la ricrea identica
2. Ma i gruppi di schede persistono ANCORA dopo la ricreazione
3. `chrome.tabGroups.query({})` dopo la pulizia mostra gruppi presenti
4. L'API `chrome.tabGroups` NON ha un metodo `remove()` in MV3
5. Nemmeno l'approccio di creare una finestra identica e distruggere la vecchia funziona

## File da Analizzare

- `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\workspace-manager\modules\cleaner.js`
- `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\workspace-manager\manifest.json`

## Snippet Codice Chiave (NON funziona)

```javascript
for (const oldWin of oldWindows) {
  if (oldWin.type !== "normal") continue;
  
  const newWin = await chrome.windows.create({
    incognito: !!oldWin.incognito,
    focused: oldWin.focused,
    state: oldWin.state,
    left: oldWin.left, top: oldWin.top, width: oldWin.width, height: oldWin.height
  });
  
  // Sposta tab pinned/audible nella nuova finestra
  // ...
  
  await chrome.windows.remove(oldWin.id);
}
```

## Log

Nessun errore JS. `chrome.windows.remove` va a buon fine. `chrome.windows.create`
crea la nuova finestra. Ma dopo la pulizia, `chrome.tabGroups.query({})` restituisce
ancora gruppi, oppure i gruppi sono visibili nella tab strip.

## Richiesta a Gemini

1. Perche `chrome.windows.remove` NON distrugge i gruppi associati alla finestra?
2. Esiste un modo per forzare Chrome a garbage-collect i gruppi dopo la distruzione
   della finestra?
3. C'e un workaround usando `chrome.debugger` API (Chrome DevTools Protocol) per
   inviare comandi di basso livello alla tab strip?
4. In alternativa: e possibile disabilitare completamente i Tab Groups in Chrome
   via `chrome://flags` o policy registry, cosi da non doverli mai gestire?
5. Fornisci codice completo di `cleaner.js` che RIESCE a rimuovere TUTTI i gruppi
   in modo affidabile al 100%.