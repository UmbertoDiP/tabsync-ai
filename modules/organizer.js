const GROUPS = [
  { name: "01_LAVORO", color: "blue", domains: ["indeed.com", "allibo", "joblink", "linkedin.com", "infojobs", "glassdoor.com", "cv.it", "monster.it", "talent.io", "egovaleo"] },
  { name: "02_FINANZA", color: "green", domains: ["stripe.com", "mullvad.net", "paypal.com", "wise.com", "revolut.com"] },
  { name: "03_SOCIAL_SHOP", color: "orange", domains: ["whatsapp.com", "telegram.org", "messenger.com", "amazon", "ebay", "subito", "keepa.com"] },
  { name: "04_GMAIL", color: "cyan", domains: ["mail.google.com"] },
  { name: "05_OUTLOOK", color: "yellow", domains: ["outlook.live.com"] },
  { name: "06_GOOGLE", color: "pink", domains: ["one.google.com", "workspace.google.com", "accounts.google.com", "studio.workspace.google.com", "contacts.google.com", "payments.google.com"] },
  { name: "07_DRIVE", color: "cyan", domains: ["drive.google.com", "docs.google.com"] },
  { name: "08_YOUTUBE", color: "red", domains: ["youtube.com", "youtu.be"] },
  { name: "09_TOOLS", color: "grey", domains: ["speedtest.net"] },
  { name: "10_SEARCH", color: "grey", domains: ["google.com/search"] },
  { name: "AI", color: "purple", domains: ["chatgpt.com", "chat.openai.com", "gemini.google.com", "claude.ai", "perplexity.ai"] },
  { name: "DEV", color: "grey", domains: ["github.com", "gitlab.com", "stackoverflow.com", "npmjs.com", "vercel.com", "netlify.com", "cloudflare.com", "lovable.dev", "cursor.com", "bolt.new", "v0.dev", "localhost", "127.0.0.1", "render.com", "manus.im", "browsermcp.io"] },
  { name: "MEDIA", color: "red", domains: ["192.168"] },
  { name: "VARIE", color: "grey", domains: ["ilfattoquotidiano.it", "saveai.net"] },
];

const COLORS = { blue: "blue", green: "green", orange: "orange", cyan: "cyan", yellow: "yellow", pink: "pink", red: "red", grey: "grey", purple: "purple" };

let organizing = false;

function findGroup(url) {
  const s = (url || "").toLowerCase();
  for (const g of GROUPS) {
    for (const d of g.domains) {
      if (s.includes(d)) return g;
    }
  }
  return null;
}

export async function organizeTabs() {
  if (organizing) return { status: "locked" };
  organizing = true;

  try {
    const tabs = await chrome.tabs.query({});
    const windows = await chrome.windows.getAll({ windowTypes: ["normal"] });
    const normalIds = new Set(windows.map(w => w.id));
    const normalTabs = tabs.filter(t => normalIds.has(t.windowId) && t.url && !t.url.startsWith("chrome://") && !t.url.startsWith("chrome-extension://"));

    // Remove existing managed groups
    const existingGroups = await chrome.tabGroups.query({});
    const managedNames = new Set(GROUPS.map(g => g.name));
    for (const eg of existingGroups) {
      if (managedNames.has(eg.title)) {
        const groupedTabs = normalTabs.filter(t => t.groupId === eg.id);
        for (const t of groupedTabs) {
          try { await chrome.tabs.ungroup(t.id); } catch {}
        }
      }
    }

    // Build category -> tabIds
    const map = new Map();
    for (const tab of normalTabs) {
      const g = findGroup(tab.url);
      if (!g) continue;
      if (!map.has(g.name)) map.set(g.name, []);
      map.get(g.name).push(tab.id);
    }

    let grouped = 0;

    for (const [name, tabIds] of map) {
      if (tabIds.length === 0) continue;

      const groupDef = GROUPS.find(g => g.name === name);
      const color = COLORS[groupDef?.color] || "grey";

      try {
        const groupId = await chrome.tabs.group({ tabIds });
        await chrome.tabGroups.update(groupId, { title: name, color, collapsed: false });
        grouped += tabIds.length;
        console.log(`[Organizer] Group "${name}": ${tabIds.length} tabs`);
      } catch (e) {
        console.error(`[Organizer] Group "${name}" failed: ${e.message}`);
      }
    }

    organizing = false;
    return { success: true, tabs_grouped: grouped, groups: map.size };
  } catch (e) {
    organizing = false;
    return { success: false, error: e.message };
  }
}