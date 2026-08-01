const GROUPS = [
  { name: "01_LAVORO", color: "blue",   domains: ["indeed.com", "allibo", "joblink", "linkedin.com", "infojobs", "glassdoor.com", "cv.it", "monster.it", "talent.io", "egovaleo"] },
  { name: "02_FINANZA", color: "green", domains: ["stripe.com", "stripecdn.com", "mullvad.net", "paypal.com", "wise.com", "revolut.com"] },
  { name: "03_SOCIAL_SHOP", color: "orange", domains: ["whatsapp.com", "telegram.org", "messenger.com", "amazon", "ebay", "subito"] },
  { name: "04_GMAIL", color: "cyan",   domains: ["mail.google.com"] },
  { name: "05_OUTLOOK", color: "yellow", domains: ["outlook.live.com"] },
  { name: "06_GOOGLE", color: "pink",  domains: ["one.google.com", "workspace.google.com", "accounts.google.com", "studio.workspace.google.com"] },
  { name: "07_DRIVE", color: "cyan",   domains: ["drive.google.com"] },
  { name: "08_YOUTUBE", color: "red",  domains: ["youtube.com", "youtu.be"] },
  { name: "09_TOOLS", color: "grey",   domains: ["speedtest.net"] },
  { name: "10_SEARCH", color: "grey",  domains: ["google.com/search", "google.com/?"] },
  { name: "AI",     color: "purple", domains: ["chatgpt.com", "chat.openai.com", "gemini.google.com", "claude.ai", "perplexity.ai"] },
  { name: "VARIE",  color: "grey",   domains: ["contacts.google.com", "localhost", "127.0.0.1"] }
];
const COLORS = { blue:"blue", green:"green", orange:"orange", cyan:"cyan", yellow:"yellow", pink:"pink", red:"red", grey:"grey", purple:"purple" };

let organizing = false;
let startupDone = false;

async function dumpState() {
  const tabs = await chrome.tabs.query({});
  const windows = await chrome.windows.getAll({ populate: true });
  const groups = await chrome.tabGroups.query({});

  const groupMap = {};
  for (const g of groups) {
    groupMap[g.id] = { title: g.title, color: g.color, collapsed: g.collapsed, windowId: g.windowId };
  }

  const output = { windows: [], groups: groupMap, tabCount: tabs.length, groupCount: groups.length };

  for (const w of windows) {
    const winTabs = [];
    for (const t of (w.tabs || [])) {
      winTabs.push({
        id: t.id,
        title: t.title,
        url: t.url,
        groupId: t.groupId,
        windowId: t.windowId,
        pinned: t.pinned,
        active: t.active
      });
    }
    output.windows.push({
      id: w.id,
      type: w.type,
      state: w.state,
      tabs: winTabs
    });
  }

  return output;
}

async function saveDump() {
  const state = await dumpState();
  await chrome.storage.local.set({ dumpState: state, lastDump: Date.now() });
  console.log('[TabOrg] Dump saved to storage');
}

function findGroupForTab(url, title) {
  const s = (url || "").toLowerCase();
  for (const g of GROUPS) {
    for (const d of g.domains) {
      if (s.includes(d)) return g;
    }
  }
  return null;
}

async function organize() {
  if (organizing) return;
  organizing = true;
  chrome.storage.local.set({ lastOrganized: Date.now() });
  try {
    console.log("[TabOrg] Starting organization...");
    const tabs = await chrome.tabs.query({});
    const map = new Map();

    const existing = await chrome.tabGroups.query({});
    for (const eg of existing) {
      try { await chrome.tabGroups.remove(eg.id); } catch (e) {}
    }
    await new Promise(r => setTimeout(r, 500));

    for (const tab of tabs) {
      if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("about:") || tab.url.startsWith("chrome-extension://")) continue;
      const g = findGroupForTab(tab.url, tab.title);
      if (!g) continue;
      if (!map.has(g.name)) map.set(g.name, { tabs: [], color: g.color });
      map.get(g.name).tabs.push(tab.id);
    }

    for (const [name, info] of map) {
      const ids = info.tabs;
      if (ids.length === 0) continue;
      ids.sort((a, b) => a - b);
      try {
        const groupId = ids.length === 1
          ? await chrome.tabs.group({ tabIds: ids[0] })
          : await chrome.tabs.group({ tabIds: ids });
        await chrome.tabGroups.update(groupId, { title: name, color: COLORS[info.color] || "grey", collapsed: false });
        console.log(`[TabOrg] Group "${name}" (${ids.length} tabs) OK`);
      } catch (e) {
        console.error(`[TabOrg] Group "${name}" failed: ${e.message}`);
      }
    }
    chrome.storage.local.set({ lastOrganized: Date.now() });
    await saveDump();
    console.log("[TabOrg] DONE");
  } finally {
    organizing = false;
  }
}

chrome.action.onClicked.addListener(async () => { await saveDump(); });
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.set({ lastOrganized: 0 });
  setTimeout(() => { organize(); }, 5000);
});
chrome.tabs.onCreated.addListener(() => {
  if (startupDone) {
    chrome.storage.local.get("lastOrganized", (d) => {
      const last = d.lastOrganized || 0;
      if (Date.now() - last > 60000) setTimeout(organize, 2000);
    });
  }
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete" && startupDone) {
    chrome.storage.local.get("lastOrganized", (d) => {
      const last = d.lastOrganized || 0;
      if (Date.now() - last > 45000) setTimeout(organize, 2000);
    });
  }
});
chrome.windows.onCreated.addListener(() => {
  if (startupDone) {
    chrome.storage.local.get("lastOrganized", (d) => {
      const last = d.lastOrganized || 0;
      if (Date.now() - last > 30000) setTimeout(organize, 2000);
    });
  }
});

setTimeout(() => { startupDone = true; organize(); }, 8000);