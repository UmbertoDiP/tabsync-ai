const WORKER_URL = "https://tabsync-backend.umbertodipuorto.workers.dev";

export async function getUserId() {
  let { tabsync_user_id } = await chrome.storage.local.get("tabsync_user_id");
  if (!tabsync_user_id) {
    tabsync_user_id = "usr_" + crypto.randomUUID();
    await chrome.storage.local.set({ tabsync_user_id });
  }
  return tabsync_user_id;
}

export async function getUserStatus() {
  const userId = await getUserId();
  try {
    const res = await fetch(`${WORKER_URL}/api/user-status`, {
      headers: { "X-User-Id": userId }
    });
    return await res.json();
  } catch (e) {
    console.error("[Cloud] Status error:", e);
    return { freeUses: 0, credits: 0, error: true };
  }
}

export async function buyCredits(amountDollars = 5) {
  const userId = await getUserId();
  try {
    const res = await fetch(`${WORKER_URL}/api/create-checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-User-Id": userId },
      body: JSON.stringify({ amount: amountDollars * 100 })
    });
    const data = await res.json();
    if (data.url) {
      chrome.tabs.create({ url: data.url });
    }
  } catch (e) {
    alert("Payment error. Try again.");
  }
}

export async function requestAICategorization(tabs) {
  const userId = await getUserId();

  const tabData = tabs.map(t => ({ id: t.id, title: t.title, url: t.url }));

  const messages = [
    { role: "system", content: "You are a browser tab organizer. Group tabs into max 5 semantic categories. Respond ONLY with valid JSON: {\"categories\":[{\"name\":\"CategoryName\",\"color\":\"blue|red|yellow|green|pink|purple|cyan|grey\",\"tabIds\":[1,2]}]}" },
    { role: "user", content: JSON.stringify(tabData) }
  ];

  const res = await fetch(`${WORKER_URL}/api/organize-ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-User-Id": userId },
    body: JSON.stringify({ messages })
  });

  if (res.status === 402) {
    throw new Error("CREDITS_EXHAUSTED");
  }

  return await res.json();
}