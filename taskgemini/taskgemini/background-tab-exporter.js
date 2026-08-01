async function exportAllTabs() {
  const allTabs = await chrome.tabs.query({});
  const allGroups = await chrome.tabGroups.query({});

  const groupMap = {};
  for (const g of allGroups) {
    groupMap[g.id] = { title: g.title, color: g.color, collapsed: g.collapsed, windowId: g.windowId };
  }

  const windows = await chrome.windows.getAll({ populate: false });
  const windowMap = {};
  for (const w of windows) {
    windowMap[w.id] = { type: w.type, focused: w.focused };
  }

  const tabs = allTabs.map(t => {
    let domain = "";
    try { domain = new URL(t.url || "").hostname; } catch {}
    return {
      id: t.id,
      title: t.title,
      url: t.url,
      domain: domain,
      active: t.active,
      pinned: t.pinned,
      audible: t.audible,
      mutedInfo: t.mutedInfo,
      windowId: t.windowId,
      groupId: t.groupId,
      groupTitle: t.groupId !== -1 && groupMap[t.groupId] ? groupMap[t.groupId].title : null
    };
  });

  const report = {
    exported_at: new Date().toISOString(),
    total_tabs: tabs.length,
    total_groups: allGroups.length,
    total_windows: windows.length,
    groups: allGroups.map(g => ({
      id: g.id,
      title: g.title,
      color: g.color,
      collapsed: g.collapsed,
      windowId: g.windowId,
      tab_count: tabs.filter(t => t.groupId === g.id).length
    })),
    windows: Object.entries(windowMap).map(([id, w]) => ({
      id: parseInt(id),
      type: w.type,
      focused: w.focused,
      tab_count: tabs.filter(t => t.windowId === parseInt(id)).length
    })),
    tabs: tabs
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const json = JSON.stringify(report, null, 2);

  await chrome.downloads.download({
    url: "data:application/json;base64," + btoa(unescape(encodeURIComponent(json))),
    filename: `chrome-tabs-${timestamp}.json`,
    saveAs: false
  });
  
  return report;
}

importScripts("import_data.js");

// ─── IMPORT ───

const VALID_COLORS = ["blue", "green", "orange", "cyan", "yellow", "pink", "red", "grey", "purple"];

async function importOrganizedTabs(data) {
  const results = { groups_created: 0, tabs_opened: 0, skipped: 0, errors: [] };
  
  if (!data.groups || !Array.isArray(data.groups)) {
    return { error: "Invalid JSON: missing groups array" };
  }

  // Build set of existing URLs to skip duplicates
  const allTabs = await chrome.tabs.query({});
  const existingUrls = new Set();
  for (const t of allTabs) {
    if (t.url) {
      try {
        const u = new URL(t.url);
        existingUrls.add(u.origin + u.pathname + u.search);
      } catch { existingUrls.add(t.url); }
    }
  }

  for (const group of data.groups) {
    if (!group.tabs || group.tabs.length === 0) continue;

    const tabIds = [];
    
    for (const tabInfo of group.tabs) {
      // Normalize URL to compare
      let normalized;
      try {
        const u = new URL(tabInfo.url);
        normalized = u.origin + u.pathname + u.search;
      } catch { normalized = tabInfo.url; }

      if (existingUrls.has(normalized)) {
        results.skipped++;
        continue;
      }

      try {
        const tab = await chrome.tabs.create({ url: tabInfo.url, active: false });
        tabIds.push(tab.id);
        existingUrls.add(normalized);
        results.tabs_opened++;
        if (tabIds.length % 5 === 0) {
          await new Promise(r => setTimeout(r, 300));
        }
      } catch (e) {
        results.errors.push(`Failed to open ${tabInfo.url}: ${e.message}`);
      }
    }

    if (tabIds.length > 0) {
      try {
        await new Promise(r => setTimeout(r, 500));
        const groupId = await chrome.tabs.group({ tabIds });
        const color = VALID_COLORS.includes(group.color) ? group.color : "grey";
        await chrome.tabGroups.update(groupId, { 
          title: group.name, 
          color: color, 
          collapsed: group.collapsed || false 
        });
        results.groups_created++;
        console.log(`[TabExporter] Group "${group.name}": ${tabIds.length} tabs OK`);
      } catch (e) {
        results.errors.push(`Failed to group "${group.name}": ${e.message}`);
      }
    }

    if (results.groups_created > 0) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  results.message = `Imported ${results.tabs_opened} tabs in ${results.groups_created} groups (${results.skipped} duplicates skipped)`;
  return results;
}

// ─── Auto-import on install/reload ───

chrome.runtime.onInstalled.addListener(async () => {
  await tryAutoImport();
});

chrome.runtime.onStartup.addListener(async () => {
  await tryAutoImport();
});

// Also run on service worker start (reload from chrome://extensions)
(async () => {
  // Small delay to ensure service worker is fully initialized
  await new Promise(r => setTimeout(r, 200));
  await tryAutoImport();
})();

async function tryAutoImport() {
  if (typeof self.__IMPORT_DATA__ !== "undefined" && self.__IMPORT_DATA__ && self.__IMPORT_DATA__.groups) {
    console.log("[TabExporter] Auto-import: " + self.__IMPORT_DATA__.total_tabs + " tabs in " + self.__IMPORT_DATA__.total_groups + " groups");
    const result = await importOrganizedTabs(self.__IMPORT_DATA__);
    console.log("[TabExporter] Auto-import result:", result.message);
    await chrome.storage.local.set({ lastImportResult: result });
    self.__IMPORT_DATA__ = null;
  }
}

// ─── Messaging ───

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "export") {
    exportAllTabs().then(r => sendResponse({ success: true, count: r.total_tabs }));
    return true;
  }
  if (msg.action === "import") {
    importOrganizedTabs(msg.data).then(sendResponse);
    return true;
  }
  if (msg.action === "getStatus") {
    chrome.storage.local.get(["lastImportResult"], (data) => {
      sendResponse(data.lastImportResult || null);
    });
    return true;
  }
});

chrome.action.onClicked.addListener(() => {
  exportAllTabs();
});