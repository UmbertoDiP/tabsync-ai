import { cleanAll } from "./modules/cleaner.js";
import { organizeTabs } from "./modules/organizer.js";
import { exportAllTabs, importOrganizedTabs } from "./modules/exporter.js";

// ─── Context Menu ───
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "clean_organize",
    title: "Clean & Organize Workspace",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === "clean_organize") {
    runCleanAndOrganize();
  }
});

// ─── Keyboard Shortcuts ───
chrome.commands.onCommand.addListener((command) => {
  if (command === "organize-all") {
    runCleanAndOrganize();
  }
  if (command === "clean-all") {
    cleanAll();
  }
});

// ─── Centralized logic ───
async function runCleanAndOrganize() {
  await cleanAll();
  await new Promise(r => setTimeout(r, 800));
  await organizeTabs();
}

// ─── Popup messages ───
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.action) {
    case "clean_all":
      cleanAll().then(sendResponse);
      return true;

    case "organize":
      (async () => {
        await cleanAll();
        await new Promise(r => setTimeout(r, 500));
        sendResponse(await organizeTabs());
      })();
      return true;

    case "clean_and_organize":
      runCleanAndOrganize().then(() => sendResponse({ success: true }));
      return true;

    case "export":
      exportAllTabs().then(r => sendResponse(r));
      return true;

    case "import":
      importOrganizedTabs(msg.data).then(r => sendResponse(r));
      return true;

    case "get_stats":
      (async () => {
        const tabs = await chrome.tabs.query({});
        const groups = await chrome.tabGroups.query({});
        const { lifetimeStats } = await chrome.storage.local.get("lifetimeStats");
        sendResponse({ tabs: tabs.length, groups: groups.length, lifetime: lifetimeStats || null });
      })();
      return true;
  }
});