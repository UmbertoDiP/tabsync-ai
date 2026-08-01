let cleaning = false;

async function saveState() {
  const allTabs = await chrome.tabs.query({});
  const allGroups = await chrome.tabGroups.query({});

  const stored = {
    tabs: allTabs.map(t => ({ url: t.url, title: t.title, pinned: t.pinned, audible: t.audible, active: t.active, windowId: t.windowId, groupId: t.groupId })),
    groups: allGroups.map(g => ({ id: g.id, title: g.title, color: g.color, windowId: g.windowId })),
    timestamp: Date.now()
  };

  await chrome.storage.local.set({ lastCleanDump: stored });

  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const json = JSON.stringify(stored, null, 2);
  await chrome.downloads.download({
    url: "data:application/json;base64," + btoa(unescape(encodeURIComponent(json))),
    filename: `tabsync-backup-${ts}.json`,
    saveAs: false
  });

  return stored;
}

async function purgeSavedGroups(tree) {
  for (const node of tree) {
    if (node.title && /(tab|tabsync).*(group|gruppo)|(group|gruppo).*(tab|tabsync)/i.test(node.title)) {
      try { await chrome.bookmarks.removeTree(node.id); } catch {}
    }
    if (node.children) await purgeSavedGroups(node.children);
  }
}

export async function runDeepEradication() {
  if (cleaning) return { status: "locked" };
  cleaning = true;

  try {
    const backupData = await saveState();

    // Purge saved tab groups from bookmarks
    try {
      const tree = await chrome.bookmarks.getTree();
      await purgeSavedGroups(tree);
    } catch (e) {
      console.warn("[Cleaner] Bookmark purge error:", e);
    }

    const oldWindows = await chrome.windows.getAll({ populate: true });

    for (const oldWin of oldWindows) {
      if (oldWin.type !== "normal") continue;

      const tabs = oldWin.tabs || [];
      const allIds = tabs.map(t => t.id);

      // Force ungroup ALL tabs
      if (allIds.length > 0) {
        try {
          await chrome.tabs.ungroup(allIds);
          await new Promise(r => setTimeout(r, 150));
        } catch (e) {
          console.warn("[Cleaner] Ungroup error:", e);
        }
      }

      const toPreserve = tabs.filter(t => t.pinned || t.audible);
      const activeTab = tabs.find(t => t.active);

      const newWin = await chrome.windows.create({
        incognito: !!oldWin.incognito,
        focused: oldWin.focused,
        state: oldWin.state === "fullscreen" ? "maximized" : (
          ["minimized", "maximized"].includes(oldWin.state) ? oldWin.state : "normal"
        ),
        left: oldWin.left, top: oldWin.top, width: oldWin.width, height: oldWin.height
      });

      if (toPreserve.length > 0) {
        const preserveIds = toPreserve.map(t => t.id);
        await chrome.tabs.move(preserveIds, { windowId: newWin.id, index: -1 });
        for (const t of toPreserve) {
          await chrome.tabs.update(t.id, { pinned: t.pinned });
        }
        if (activeTab && preserveIds.includes(activeTab.id)) {
          await chrome.tabs.update(activeTab.id, { active: true });
        }
        const newWinTabs = await chrome.tabs.query({ windowId: newWin.id });
        for (const b of newWinTabs.filter(t => !t.pinned && !t.audible && (t.url === "about:blank" || t.url === "" || t.url.startsWith("chrome://newtab")))) {
          try { await chrome.tabs.remove(b.id); } catch {}
        }
      }

      await chrome.windows.remove(oldWin.id);

      if (oldWin.state === "fullscreen") {
        await chrome.windows.update(newWin.id, { state: "fullscreen" });
      }
    }

    await new Promise(r => setTimeout(r, 500));

    const finalGroups = await chrome.tabGroups.query({});
    const finalTabs = await chrome.tabs.query({});

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "TabSync AI",
      message: `Deep clean done: ${finalTabs.length} tabs, ${finalGroups.length} groups remaining`
    });

    cleaning = false;
    return { success: true, tabs_remaining: finalTabs.length, groups_remaining: finalGroups.length, backupData };
  } catch (e) {
    console.error("[Cleaner] Error:", e);
    cleaning = false;
    return { success: false, error: e.message };
  }
}