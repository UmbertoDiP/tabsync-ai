let currentStep = 1;
let backupDownloaded = false;
let auditData = null;

const $ = (id) => document.getElementById(id);

function setStep(n) {
  currentStep = n;
  document.querySelectorAll(".step-panel").forEach(p => p.classList.remove("active"));
  const panel = $("step" + n);
  panel.classList.add("active");
  $("currentStepNum").textContent = n;
  $("progressBar").style.width = (n / 4) * 100 + "%";
}

function showStatus(id, msg, type) {
  const el = $(id);
  el.textContent = msg;
  el.className = "status-msg " + type;
}

$("btnDownloadBackup").addEventListener("click", async () => {
  $("btnDownloadBackup").disabled = true;
  showStatus("backupStatus", "Saving backup...", "info");
  chrome.runtime.sendMessage({ action: "export" }, (r) => {
    $("btnDownloadBackup").disabled = false;
    if (r && r.success) {
      backupDownloaded = true;
      showStatus("backupStatus", "Backup saved! You can proceed.", "success");
      setTimeout(() => setStep(2), 500);
      loadAudit();
    } else {
      showStatus("backupStatus", "Failed to save. Try again.", "error");
    }
  });
});

async function loadAudit() {
  chrome.runtime.sendMessage({ action: "get_full_audit" }, (r) => {
    if (r && r.success) {
      auditData = r;
      const rows = [
        { label: "Open tabs", value: r.tabsCount },
        { label: "Active groups", value: r.groupsCount },
        { label: "Saved in bookmarks", value: r.savedGroupsCount },
      ];
      $("auditBox").innerHTML = rows.map(row => `
        <div class="audit-row">
          <span class="audit-label">${row.label}</span>
          <span class="audit-value">${row.value}</span>
        </div>
      `).join("");
    } else {
      $("auditBox").innerHTML = "<div class='audit-row'><span class='audit-label'>Failed to load audit.</span></div>";
    }
  });
}

$("chkConfirm").addEventListener("change", () => {
  $("btnExecute").disabled = !$("chkConfirm").checked;
});

$("btnExecute").addEventListener("click", async () => {
  setStep(3);
  chrome.runtime.sendMessage({ action: "execute_deep_eradication" }, (r) => {
    setStep(4);
    const el = $("resultText");
    if (r && r.success) {
      el.textContent = `${r.tabs_remaining || 0} tabs, ${r.groups_remaining || 0} groups remaining. All clean!`;
      el.className = "result-text";
    } else {
      el.textContent = "Clean failed: " + (r?.error || "unknown");
      el.className = "result-text error";
    }
  });
});

$("btnClose").addEventListener("click", () => window.close());

$("btnRestore").addEventListener("click", () => {
  $("fileRestore").click();
});

$("fileRestore").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    $("btnRestore").textContent = "Restoring...";
    $("btnRestore").disabled = true;
    chrome.runtime.sendMessage({ action: "import", data }, (r) => {
      $("btnRestore").textContent = "Restore from Backup JSON";
      $("btnRestore").disabled = false;
      if (r && r.message) showStatus("backupStatus", r.message, "success");
      else showStatus("backupStatus", "Restore failed", "error");
    });
  } catch (err) {
    showStatus("backupStatus", "Invalid JSON file", "error");
  }
});

if (!backupDownloaded) setStep(1);

chrome.runtime.sendMessage({ action: "get_user_info" }, (r) => {
  if (r) {
    $("userIdDisplay").textContent = "ID: " + r.userId;
    if (r.error) {
      $("billingDisplay").textContent = "Offline. Check worker.";
      return;
    }
    const freeLeft = r.freeUses !== undefined ? Math.max(0, 5 - r.freeUses) : 5;
    const credits = r.credits || 0;
    const bd = $("billingDisplay");
    bd.textContent = `Free ops: ${freeLeft}/5 | Credits: $${credits.toFixed(2)}`;
    bd.className = "billing-display";
    if (freeLeft <= 0 && credits <= 0) {
      bd.textContent += " (exhausted)";
      bd.classList.add("exhausted");
      $("btnBuyCredits").style.display = "inline-block";
    }
  }
});

$("btnBuyCredits").addEventListener("click", () => {
  $("btnBuyCredits").disabled = true;
  $("btnBuyCredits").textContent = "Opening checkout...";
  chrome.runtime.sendMessage({ action: "buy_credits" }, (r) => {
    $("btnBuyCredits").disabled = false;
    $("btnBuyCredits").textContent = "Buy Credits";
    if (!r || !r.success) {
      showStatus("backupStatus", "Payment failed. Try again.", "error");
    }
  });
});

document.getElementById("linkEula").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL("EULA.txt") });
});