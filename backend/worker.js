export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-User-Id",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const userId = request.headers.get("X-User-Id");

    if (!userId) {
      return Response.json({ error: "Missing X-User-Id header" }, { status: 400, headers: corsHeaders });
    }

    if (url.pathname === "/api/user-status") {
      const data = await getUserData(env, userId);
      return Response.json(data, { headers: corsHeaders });
    }

    if (url.pathname === "/api/create-checkout" && request.method === "POST") {
      return Response.json({ url: `https://buy.stripe.com/tabsync?user=${userId}` }, { headers: corsHeaders });
    }

    if (url.pathname === "/api/organize-ai" && request.method === "POST") {
      return handleAIRequest(request, env, userId, corsHeaders);
    }

    return new Response("Not found", { status: 404 });
  }
};

async function getUserData(env, userId) {
  if (!env.TABSYNC_KV) return { freeUses: 0, credits: 0 };
  const raw = await env.TABSYNC_KV.get(`user:${userId}`);
  return raw ? JSON.parse(raw) : { freeUses: 0, credits: 0 };
}

async function handleAIRequest(request, env, userId, corsHeaders) {
  const userData = await getUserData(env, userId);
  const FREE_LIMIT = 5;

  if (userData.freeUses >= FREE_LIMIT && userData.credits <= 0) {
    return Response.json({ error: "Credits exhausted", needsPayment: true }, { status: 402, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const tabsRaw = body.messages?.[1]?.content;
    const tabs = typeof tabsRaw === "string" ? JSON.parse(tabsRaw) : (Array.isArray(tabsRaw) ? tabsRaw : []);

    const categories = categorizeTabs(tabs);
    const result = {
      categories: Object.entries(categories).map(([name, ids]) => ({
        name, color: getColor(name), tabIds: ids
      }))
    };

    const isFree = userData.freeUses < FREE_LIMIT;
    if (isFree) {
      userData.freeUses += 1;
    } else {
      userData.credits = Math.max(0, userData.credits - 0.003);
    }

    if (env.TABSYNC_KV) {
      await env.TABSYNC_KV.put(`user:${userId}`, JSON.stringify(userData));
    }

    return Response.json({
      result,
      usageInfo: {
        isFreeCall: isFree,
        remainingFree: FREE_LIMIT - userData.freeUses,
        remainingCredits: userData.credits
      }
    }, { headers: corsHeaders });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500, headers: corsHeaders });
  }
}

function categorizeTabs(tabs) {
  const rules = [
    { name: "Dev", domains: ["github", "gitlab", "stackoverflow", "npm", "vercel", "netlify", "localhost"] },
    { name: "AI", domains: ["chatgpt", "openai", "claude", "gemini", "perplexity", "huggingface"] },
    { name: "Media", domains: ["youtube", "twitch", "netflix", "spotify", "vimeo"] },
    { name: "Work", domains: ["linkedin", "indeed", "jira", "slack", "notion", "docs.google", "gmail", "outlook"] },
    { name: "Social", domains: ["twitter", "x.com", "reddit", "facebook", "instagram", "whatsapp", "telegram"] },
    { name: "Shopping", domains: ["amazon", "ebay", "keepa"] },
  ];

  const result = {};
  for (const tab of tabs) {
    const s = (tab.domain || tab.url || "").toLowerCase();
    let matched = false;
    for (const rule of rules) {
      if (rule.domains.some(d => s.includes(d))) {
        (result[rule.name] ||= []).push(tab.id);
        matched = true;
        break;
      }
    }
    if (!matched) (result["Other"] ||= []).push(tab.id);
  }
  return result;
}

function getColor(name) {
  const map = { Dev: "blue", AI: "purple", Media: "red", Work: "cyan", Social: "orange", Shopping: "yellow", Other: "grey" };
  return map[name] || "grey";
}