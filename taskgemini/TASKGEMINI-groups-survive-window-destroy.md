# TaskGemini: Gruppi sopravvivono a chrome.windows.remove()

## Contesto

Estensione Workspace Manager (Chrome MV3). Il Nuclear Clean crea nuove finestre identiche
e distrugge le vecchie con `chrome.windows.remove()`. Le tab vengono chiuse correttamente,
ma i GRUPPI DI SCHEDE restano visibili nella tab strip anche dopo la distruzione della finestra.

## Problema Specifico

1. `chrome.windows.remove(oldWin.id)` distrugge la finestra
2. `chrome.windows.create(...)` crea nuova finestra vuota identica
3. Dopo l'operazione, i gruppi della vecchia finestra sono ANCORA visibili
4. `chrome.tabGroups.query({})` mostra ancora i gruppi
5. NON ci sono tab pinned o audible da preservare (toPreserve e' vuoto)
6. L'API `chrome.tabGroups` NON ha metodo `remove()` in MV3
7. Il fix `chrome.tabs.ungroup()` prima del move non viene nemmeno eseguito
   perche' non ci sono tab da preservare

## Ipotesi

- Chrome non fa garbage collection dei gruppi quando la finestra viene distrutta via API
- I gruppi potrebbero essere "salvati" (Saved Tab Groups feature) e Chrome li
  mantiene in uno stato persistente anche dopo la chiusura delle tab
- Chrome potrebbe star ripristinando la sessione automaticamente dopo la
  distruzione della finestra

## File

- `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\workspace-manager\modules\cleaner.js`
- `C:\Users\umber\Documents\MyProjects\02-ai-dev-tools\workspace-manager\manifest.json`

## Snippet

```javascript
// Il blocco che dovrebbe distruggere i gruppi
await chrome.windows.remove(oldWin.id);
// Ma i gruppi della vecchia finestra sopravvivono
```

## Richiesta

1. Perche i gruppi sopravvivono a `chrome.windows.remove()`?
2. Come forzare Chrome a eliminare TUTTI i gruppi, incluso quelli salvati/sincronizzati?
3. Esiste un flag o policy (`chrome://flags`, registro Windows) per disabilitare
   completamente i Tab Groups o i Saved Tab Groups?
4. Fornisci codice che elimina TUTTI i gruppi in modo affidabile, anche ricorrendo
   a workaround non convenzionali (chrome.debugger, registry, flags, etc.)