import { runDeepEradication } from "./modules/cleaner.js";
import { organizeTabs } from "./modules/organizer.js";
import { exportAllTabs, importOrganizedTabs } from "./modules/exporter.js";
import { getUserId } from "./modules/cloud.js";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "open_tabsync_wizard",
    title: "TabSync AI: Open Wizard",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "open_tabsync_wizard") {
    chrome.action.openPopup();
  }
});

async function runFullWorkflow() {
  const result = await runDeepEradication();
  await new Promise(r => setTimeout(r, 600));
  await organizeTabs();
  return result;
}

chrome.commands.onCommand.addListener((command) => {
  if (command === "organize-all") runFullWorkflow();
  if (command === "clean-all") runDeepEradication();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "get_full_audit") {
    (async () => {
      try {
        const tabs = await chrome.tabs.query({});
        const groups = await chrome.tabGroups.query({});
        const tree = await chrome.bookmarks.getTree();
        sendResponse({ success: true, tabsCount: tabs.length, groupsCount: groups.length, hasBookmarks: tree.length > 0 });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
    })();
    return true;
  }

  if (msg.action === "execute_deep_eradication") {
    runDeepEradication().then(r => sendResponse(r)).catch(e => sendResponse({ success: false, error: e.message }));
    return true;
  }

  if (msg.action === "run_full_sync") {
    runFullWorkflow().then(() => sendResponse({ success: true }));
    return true;
  }

  if (msg.action === "get_stats") {
    (async () => {
      const tabs = await chrome.tabs.query({});
      const groups = await chrome.tabGroups.query({});
      console.log("[TabSync] stats: tabs=" + tabs.length + " groups=" + groups.length);
      sendResponse({ tabs: tabs.length, groups: groups.length });
    })();
    return true;
  }

  if (msg.action === "get_user_info") {
    (async () => {
      const userId = await getUserId();
      sendResponse({ userId });
    })();
    return true;
  }

  if (msg.action === "export") {
    exportAllTabs().then(r => sendResponse(r));
    return true;
  }

  if (msg.action === "import") {
    importOrganizedTabs(msg.data).then(r => sendResponse(r));
    return true;
  }
});