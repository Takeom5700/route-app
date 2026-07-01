// メイン画面のエントリポイント
import { fetchRoutes } from "./api.js";
import { setLoading, showError, hideError, clearResults, renderResults } from "./ui.js";
import { loadSavedRoutes, saveRoute } from "./storage.js";

// ── DOM参照 ─────────────────────────────────────────────
const inputFrom     = document.getElementById("input-from");
const inputTo       = document.getElementById("input-to");
const savedRoutesEl = document.getElementById("saved-routes");
const searchBtn     = document.getElementById("search-btn");
const saveBtn       = document.getElementById("save-btn");

// 直前の検索結果を保持（保存ボタン用）
let lastFrom = "";
let lastTo   = "";

// ── 初期化 ───────────────────────────────────────────────
renderSavedRoutes();

// ── よく使うルート描画 ───────────────────────────────────
function renderSavedRoutes() {
  const routes = loadSavedRoutes();
  savedRoutesEl.innerHTML = "";

  if (routes.length === 0) return;

  const label = document.createElement("span");
  label.className = "saved-route-label";
  label.textContent = "よく使うルート";
  savedRoutesEl.appendChild(label);

  routes.forEach(r => {
    const btn = document.createElement("button");
    btn.className = "saved-route-btn";
    btn.textContent = r.label;
    btn.addEventListener("click", () => {
      inputFrom.value = r.from;
      inputTo.value   = r.to;
    });
    savedRoutesEl.appendChild(btn);
  });
}

// ── 検索ボタン ───────────────────────────────────────────
searchBtn.addEventListener("click", async () => {
  const from = inputFrom.value.trim();
  const to   = inputTo.value.trim();

  if (!from || !to) {
    inputFrom.focus();
    return;
  }

  hideError();
  clearResults();
  saveBtn.hidden = true;
  setLoading(true);

  try {
    const data = await fetchRoutes(from, to);
    renderResults(data.routes);
    lastFrom = from;
    lastTo   = to;
    saveBtn.hidden = false;
  } catch (err) {
    console.error(err);
    showError();
  } finally {
    setLoading(false);
  }
});

// ── Enterキーで検索 ──────────────────────────────────────
[inputFrom, inputTo].forEach(input => {
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") searchBtn.click();
  });
});

// ── ルート保存 ───────────────────────────────────────────
saveBtn.addEventListener("click", () => {
  if (!lastFrom || !lastTo) return;
  saveRoute(lastFrom, lastTo);
  renderSavedRoutes();
  saveBtn.textContent = "保存しました";
  saveBtn.disabled = true;
  setTimeout(() => {
    saveBtn.textContent = "このルートを保存";
    saveBtn.disabled = false;
  }, 1500);
});
