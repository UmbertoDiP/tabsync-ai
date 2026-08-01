async function cleanAll() {
  const allTabs = await chrome.tabs.query({});
  const groups = await chrome.tabGroups.query({});
  console.log(`[TabCleaner] ${allTabs.length} tabs, ${groups.length} groups`);

  if (allTabs.length === 0 && groups.length === 0) {
    console.log("[TabCleaner] Nothing to clean");
    return { closed: 0, groups_removed: 0 };
  }

  // Expand collapsed groups so Chrome can see all tabs
  for (const g of groups) {
    try { await chrome.tabGroups.update(g.id, { collapsed: false }); } catch {}
  }
  await new Promise(r => setTimeout(r, 200));

  // Close all tabs directly (no ungroup first)
  // Chrome auto-deletes groups when their last tab is closed
  const closeIds = allTabs.map(t => t.id);
  const BATCH = 10;
  for (let i = 0; i < closeIds.length; i += BATCH) {
    const batch = closeIds.slice(i, i + BATCH);
    try {
      await chrome.tabs.remove(batch);
    } catch (e) {
      for (const id of batch) {
        try { await chrome.tabs.remove(id); } catch {}
        await new Promise(r => setTimeout(r, 50));
      }
    }
    await new Promise(r => setTimeout(r, 200));
  }

  await new Promise(r => setTimeout(r, 500));

  // Zombie group cleanup: for any group that still exists,
  // create temp tab, add to group, ungroup it, close it
  const zombieGroups = await chrome.tabGroups.query({});
  console.log(`[TabCleaner] Zombie groups: ${zombieGroups.length}`);

  for (const g of zombieGroups) {
    try {
      // Create temp tab inside this group's window
      const tempTab = await chrome.tabs.create({
        url: "about:blank",
        windowId: g.windowId,
        active: false
      });
      // Explicitly add it to the zombie group to trigger Chrome's logic
      await chrome.tabs.group({ tabIds: tempTab.id, groupId: g.id });
      // Ungroup immediately (group becomes empty -> auto-delete)
      await chrome.tabs.ungroup(tempTab.id);
      // Close the temp tab
      await chrome.tabs.remove(tempTab.id);
    } catch (e) {
      console.log(`[TabCleaner] Zombie group ${g.id} cleanup failed: ${e.message}`);
    }
  }

  // Final pass: check for any remaining tabs
  const remaining = await chrome.tabs.query({});
  if (remaining.length > 0) {
    for (const t of remaining) {
      if (t.groupId !== -1) {
        try { await chrome.tabs.ungroup(t.id); } catch {}
      }
      try { await chrome.tabs.remove(t.id); } catch {}
      await new Promise(r => setTimeout(r, 100));
    }
  }

  const finalGroups = await chrome.tabGroups.query({});
  const finalTabs = await chrome.tabs.query({});
  console.log(`[TabCleaner] Done: ${finalTabs.length} tabs, ${finalGroups.length} groups`);

  return { closed: closeIds.length, remaining_tabs: finalTabs.length, remaining_groups: finalGroups.length };
}

(async () => {
  await new Promise(r => setTimeout(r, 500));
  const result = await cleanAll();
  console.log("[TabCleaner] Result:", JSON.stringify(result));
})();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "clean") {
    cleanAll().then(sendResponse);
    return true;
  }
});