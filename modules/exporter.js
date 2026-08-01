const VALID_COLORS = ["blue", "green", "orange", "cyan", "yellow", "pink", "red", "grey", "purple"];

export async function exportAllTabs() {
  const allTabs = await chrome.tabs.query({});
  const allGroups = await chrome.tabGroups.query({});
  const windows = await chrome.windows.getAll({ populate: false });

  const groupMap = {};
  for (const g of allGroups) {
    groupMap[g.id] = { title: g.title, color: g.color, collapsed: g.collapsed, windowId: g.windowId };
  }

  const tabs = allTabs.map(t => {
    let domain = "";
    try { domain = new URL(t.url || "").hostname; } catch {}
    return {
      id: t.id, title: t.title, url: t.url, domain,
      active: t.active, pinned: t.pinned, audible: t.audible,
      windowId: t.windowId, groupId: t.groupId,
      groupTitle: t.groupId !== -1 && groupMap[t.groupId] ? groupMap[t.groupId].title : null
    };
  });

  const report = {
    exported_at: new Date().toISOString(),
    total_tabs: tabs.length,
    total_groups: allGroups.length,
    total_windows: windows.length,
    groups: allGroups.map(g => ({
      name: g.title, color: g.color, collapsed: g.collapsed,
      windowId: g.windowId,
      tab_count: tabs.filter(t => t.groupId === g.id).length
    })),
    tabs
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const json = JSON.stringify(report, null, 2);

  await chrome.downloads.download({
    url: "data:application/json;base64," + btoa(unescape(encodeURIComponent(json))),
    filename: `workspace-export-${timestamp}.json`,
    saveAs: false
  });

  return { success: true, count: report.total_tabs, message: `Exported ${report.total_tabs} tabs` };
}

export async function importOrganizedTabs(data) {
  const results = { groups_created: 0, tabs_opened: 0, skipped: 0, errors: [] };

  if (!data.groups || !Array.isArray(data.groups)) {
    return { error: "Invalid JSON: missing groups array" };
  }

  // D1: Handle export format (flat tabs + groups without .tabs[] array)
  if (data.tabs && Array.isArray(data.tabs) && data.groups.length > 0 && !data.groups[0].tabs) {
    for (const g of data.groups) {
      g.tabs = data.tabs
        .filter(t => t.groupTitle === g.name)
        .map(t => ({ url: t.url, title: t.title }));
    }
  }

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
    if (!group.tabs || !Array.isArray(group.tabs)) {
      // Check if group has tabs array at top level
      if (!group.tab_count) continue;
      // Might be from a raw export - extract URLs from tabs array elsewhere
      continue;
    }

    if (group.tabs.length === 0) continue;

    const tabIds = [];

    for (const tabInfo of group.tabs) {
      const url = typeof tabInfo === "string" ? tabInfo : tabInfo.url;
      if (!url) continue;

      let normalized;
      try {
        const u = new URL(url);
        normalized = u.origin + u.pathname + u.search;
      } catch { normalized = url; }

      if (existingUrls.has(normalized)) {
        results.skipped++;
        continue;
      }

      try {
        const tab = await chrome.tabs.create({ url, active: false });
        tabIds.push(tab.id);
        existingUrls.add(normalized);
        results.tabs_opened++;
        if (tabIds.length % 5 === 0) await new Promise(r => setTimeout(r, 300));
      } catch (e) {
        results.errors.push(`Failed to open ${url}: ${e.message}`);
      }
    }

    if (tabIds.length > 0) {
      try {
        await new Promise(r => setTimeout(r, 500));
        const groupId = await chrome.tabs.group({ tabIds });
        const color = VALID_COLORS.includes(group.color) ? group.color : "grey";
        await chrome.tabGroups.update(groupId, {
          title: group.name,
          color,
          collapsed: group.collapsed || false
        });
        results.groups_created++;
        console.log(`[Exporter] Group "${group.name}": ${tabIds.length} tabs`);
      } catch (e) {
        results.errors.push(`Failed to group "${group.name}": ${e.message}`);
      }
    }

    if (results.groups_created > 0) await new Promise(r => setTimeout(r, 1000));
  }

  results.message = `Imported ${results.tabs_opened} tabs in ${results.groups_created} groups (${results.skipped} skipped)`;
  return results;
}