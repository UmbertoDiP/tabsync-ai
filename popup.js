const statusDiv = document.getElementById("status");
const statsDiv = document.getElementById("stats");
const btnOrganize = document.getElementById("btn-organize");
const btnClean = document.getElementById("btn-clean");
const btnExport = document.getElementById("btn-export");
const btnImport = document.getElementById("btn-import");
const fileInput = document.getElementById("file-input");

function showStatus(msg, type) {
  statusDiv.textContent = msg;
  statusDiv.className = `status ${type}`;
  if (type !== "loading") setTimeout(() => { statusDiv.className = "status"; statusDiv.style.display = "none"; }, 3000);
}

async function loadStats() {
  chrome.runtime.sendMessage({ action: "get_stats" }, (r) => {
    if (r) statsDiv.textContent = `${r.tabs} tabs  ·  ${r.groups} groups`;
  });
}

async function doAction(action, label) {
  showStatus(`Running ${label}...`, "loading");
  const allBtns = [btnOrganize, btnClean, btnExport, btnImport];
  allBtns.forEach(b => b.disabled = true);
  chrome.runtime.sendMessage({ action }, (r) => {
    allBtns.forEach(b => b.disabled = false);
    if (chrome.runtime.lastError) { showStatus("Connection error", "error"); return; }
    if (r?.success === false) { showStatus(r.error || "Failed", "error"); return; }
    showStatus(r?.message || `${label} done`, "success");
    loadStats();
  });
}

btnOrganize.addEventListener("click", () => doAction("clean_and_organize", "Organize"));
btnClean.addEventListener("click", () => doAction("clean_all", "Clean"));
btnExport.addEventListener("click", () => doAction("export", "Export"));

btnImport.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.groups || !Array.isArray(data.groups)) { showStatus("Invalid format: missing groups", "error"); return; }
    const total = data.groups.reduce((s, g) => s + (g.tabs ? g.tabs.length : 0), 0);
    showStatus(`Importing ${total} tabs...`, "loading");
    chrome.runtime.sendMessage({ action: "import", data }, (r) => {
      if (r?.error) { showStatus(r.error, "error"); return; }
      showStatus(r?.message || "Import done", "success");
      loadStats();
    });
  } catch (e) { showStatus("Parse error: " + e.message, "error"); }
});

loadStats();