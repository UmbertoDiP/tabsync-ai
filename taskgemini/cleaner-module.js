let cleaning = false;

async function saveAndExportState() {
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
    filename: `cleaner-backup-${ts}.json`,
    saveAs: false
  });

  console.log("[Cleaner] Backup: " + stored.tabs.length + " tabs, " + stored.groups.length + " groups");
}

function isEmptyNewTab(tab) {
  return !tab.pinned && !tab.audible && (
    tab.url === "about:blank" || tab.url === "" || tab.url.startsWith("chrome://newtab")
  );
}

export async function cleanAll() {
  if (cleaning) return { status: "locked" };
  cleaning = true;

  try {
    await saveAndExportState();

    const oldWindows = await chrome.windows.getAll({ populate: true });
    if (oldWindows.length === 0) { cleaning = false; return { status: "no_windows" }; }

    let replaced = 0;
    let preserved = 0;

    for (const oldWin of oldWindows) {
      if (oldWin.type !== "normal") continue;

      const tabs = oldWin.tabs || [];
      const toPreserve = tabs.filter(t => t.pinned || t.audible);
      const activeTab = tabs.find(t => t.active);

      const newWin = await chrome.windows.create({
        incognito: !!oldWin.incognito,
        focused: oldWin.focused,
        state: oldWin.state === "fullscreen" ? "maximized" : (
          ["minimized", "maximized"].includes(oldWin.state) ? oldWin.state : "normal"
        ),
        left: oldWin.left,
        top: oldWin.top,
        width: oldWin.width,
        height: oldWin.height
      });

      if (toPreserve.length > 0) {
        const preserveIds = toPreserve.map(t => t.id);
        await chrome.tabs.move(preserveIds, { windowId: newWin.id, index: -1 });
        for (const t of toPreserve) {
          await chrome.tabs.update(t.id, { pinned: t.pinned });
        }
        preserved += toPreserve.length;

        if (activeTab && preserveIds.includes(activeTab.id)) {
          await chrome.tabs.update(activeTab.id, { active: true });
        }

        const newWinTabs = await chrome.tabs.query({ windowId: newWin.id });
        for (const b of newWinTabs.filter(t => isEmptyNewTab(t))) {
          try { await chrome.tabs.remove(b.id); } catch {}
        }
      }

      await chrome.windows.remove(oldWin.id);

      if (oldWin.state === "fullscreen") {
        await chrome.windows.update(newWin.id, { state: "fullscreen" });
      }

      replaced++;
    }

    const finalGroups = await chrome.tabGroups.query({});
    const finalTabs = await chrome.tabs.query({});

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Workspace Manager",
      message: `${replaced} windows cleaned, ${preserved} tabs preserved, ${finalGroups.length} groups removed`
    });

    cleaning = false;
    return { success: true, windows_replaced: replaced, tabs_preserved: preserved, remaining_groups: finalGroups.length };
  } catch (e) {
    console.error("[Cleaner] Error:", e);
    await rollback();
    cleaning = false;
    return { success: false, error: e.message };
  }
}

async function rollback() {
  const { lastCleanDump } = await chrome.storage.local.get("lastCleanDump");
  if (!lastCleanDump || !lastCleanDump.tabs) return;

  const rescueWin = await chrome.windows.create({ focused: true, state: "maximized" });
  let restored = 0;

  for (const t of lastCleanDump.tabs) {
    if (!t.url || t.url === "about:blank" || t.url.startsWith("chrome://newtab")) continue;
    try {
      await chrome.tabs.create({ windowId: rescueWin.id, url: t.url, active: false, pinned: t.pinned });
      restored++;
      if (restored % 5 === 0) await new Promise(r => setTimeout(r, 300));
    } catch {}
  }

  const rescueTabs = await chrome.tabs.query({ windowId: rescueWin.id });
  const blank = rescueTabs.find(t => t.url === "about:blank" || t.url.startsWith("chrome://newtab"));
  if (blank) try { await chrome.tabs.remove(blank.id); } catch {}

  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "Workspace Manager: Rollback",
    message: `Recovered ${restored} tabs in rescue window`
  });
}