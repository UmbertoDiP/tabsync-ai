let currentStep = 1;
let backupDownloaded = false;
let auditData = null;

const $ = (id) => document.getElementById(id);

function setStep(n) {
  currentStep = n;
  document.querySelectorAll(".step-panel").forEach(p => p.classList.remove("active"));
  $("step" + n).classList.add("active");
  $("currentStepNum").textContent = n;
  $("progressBar").style.width = (n / 3) * 100 + "%";
}

function showStatus(id, msg, type) {
  const el = $(id);
  el.textContent = msg;
  el.className = "status-msg " + type;
}

// Step 1: Download backup
$("btnDownloadBackup").addEventListener("click", async () => {
  $("btnDownloadBackup").disabled = true;
  showStatus("backupStatus", "Saving backup...", "info");
  chrome.runtime.sendMessage({ action: "export" }, (r) => {
    $("btnDownloadBackup").disabled = false;
    if (r && r.success) {
      backupDownloaded = true;
      showStatus("backupStatus", "Backup saved! You can proceed.", "success");
      // Auto-advance to step 2 after short delay
      setTimeout(() => setStep(2), 500);
      loadAudit();
    } else {
      showStatus("backupStatus", "Failed to save. Try again.", "error");
    }
  });
});

// Step 2: Load audit
async function loadAudit() {
  chrome.runtime.sendMessage({ action: "get_full_audit" }, (r) => {
    if (r && r.success) {
      auditData = r;
      $("auditBox").innerHTML = `
        <span>${r.tabsCount}</span> open tabs<br>
        <span>${r.groupsCount}</span> active groups<br>
        <span>${r.hasBookmarks ? "Yes" : "No"}</span> saved groups in bookmarks
      `;
    } else {
      $("auditBox").innerHTML = "Failed to load audit.";
    }
  });
}

$("chkConfirm").addEventListener("change", () => {
  $("btnExecute").disabled = !$("chkConfirm").checked;
});

// Step 3: Execute
$("btnExecute").addEventListener("click", async () => {
  setStep(3);
  chrome.runtime.sendMessage({ action: "execute_deep_eradication" }, (r) => {
    setStep(4);
    if (r && r.success) {
      $("resultText").textContent = `${r.tabs_remaining || 0} tabs, ${r.groups_remaining || 0} groups remaining. All clean!`;
    } else {
      $("resultText").textContent = "Clean failed: " + (r?.error || "unknown");
    }
  });
});

$("btnClose").addEventListener("click", () => window.close());

// Restore from backup
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

// Prevent advancing without backup
if (!backupDownloaded) setStep(1);

// Show user ID
chrome.runtime.sendMessage({ action: "get_user_info" }, (r) => {
  if (r && r.userId) {
    $("userIdDisplay").textContent = "ID: " + r.userId;
  }
});