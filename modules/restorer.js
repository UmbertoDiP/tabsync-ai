export async function restoreWorkspace(backupData) {
  if (!backupData || !backupData.tabs || backupData.tabs.length === 0) {
    throw new Error("Invalid backup file: no tabs found");
  }

  console.log("[Restorer] Starting restore...");

  const windowMap = {};
  for (const tab of backupData.tabs) {
    const key = tab.windowId || "default";
    if (!windowMap[key]) windowMap[key] = [];
    windowMap[key].push(tab);
  }

  let restoredTabs = 0;
  let restoredGroups = 0;

  for (const winKey of Object.keys(windowMap)) {
    const tabsToRestore = windowMap[winKey];
    const newWin = await chrome.windows.create({ focused: true, state: "maximized" });
    const groupMapping = {};

    for (const t of tabsToRestore) {
      if (!t.url || t.url === "about:blank" || t.url.startsWith("chrome://newtab")) continue;

      try {
        const newTab = await chrome.tabs.create({
          windowId: newWin.id,
          url: t.url,
          active: !!t.active,
          pinned: !!t.pinned
        });
        restoredTabs++;

        if (t.groupId && t.groupId !== -1 && backupData.groups) {
          const originalGroup = backupData.groups.find(g => g.id === t.groupId);
          if (originalGroup) {
            if (!groupMapping[originalGroup.id]) {
              const newGroupId = await chrome.tabs.group({
                tabIds: [newTab.id],
                createProperties: { windowId: newWin.id }
              });
              await chrome.tabGroups.update(newGroupId, {
                title: originalGroup.title || "",
                color: originalGroup.color || "grey"
              });
              groupMapping[originalGroup.id] = newGroupId;
              restoredGroups++;
            } else {
              await chrome.tabs.group({
                tabIds: [newTab.id],
                groupId: groupMapping[originalGroup.id]
              });
            }
          }
        }

        await new Promise(r => setTimeout(r, 50));
      } catch (e) {
        console.warn("[Restorer] Failed tab:", t.url, e);
      }
    }

    const winTabs = await chrome.tabs.query({ windowId: newWin.id });
    const empty = winTabs.find(t => t.url === "about:blank" || t.url.startsWith("chrome://newtab"));
    if (empty && winTabs.length > 1) {
      try { await chrome.tabs.remove(empty.id); } catch {}
    }
  }

  return { success: true, restoredTabs, restoredGroups };
}