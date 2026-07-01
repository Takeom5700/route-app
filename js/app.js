// メイン画面のエントリポイント
import { fetchDelays } from "./api.js";
import { setLoading, showError, clearError, renderResults, clearResults, setFetchedAt } from "./ui.js";
import { loadRouteSets } from "./storage.js";
import { rankCandidates } from "./scoring.js";

// ── DOM参照 ────────────────────────────────────────────
const noRouteset    = document.getElementById("no-routeset");
const tabNav        = document.getElementById("tab-nav");
const tabList       = document.getElementById("tab-list");
const actionSection = document.getElementById("action-section");
const refreshBtn    = document.getElementById("refresh-btn");

// 選択中のルートセット
let currentRouteSet = null;

// ── 初期化 ─────────────────────────────────────────────
init();

function init() {
  const routeSets = loadRouteSets();

  if (routeSets.length === 0) {
    noRouteset.hidden = false;
    return;
  }

  noRouteset.hidden = true;
  tabNav.hidden = false;
  actionSection.hidden = false;

  renderTabs(routeSets);

  // 最初のタブを選択して自動取得
  selectRouteSet(routeSets[0]);
}

// ── タブ描画 ───────────────────────────────────────────
function renderTabs(routeSets) {
  tabList.innerHTML = "";

  routeSets.forEach(rs => {
    const btn = document.createElement("button");
    btn.className = "tab-btn";
    btn.textContent = rs.label;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", "false");
    btn.dataset.id = rs.id;

    btn.addEventListener("click", () => {
      clearError();
      clearResults();
      setFetchedAt("");
      selectRouteSet(rs);
    });

    tabList.appendChild(btn);
  });
}

function selectRouteSet(rs) {
  currentRouteSet = rs;

  // タブのaria-selectedを更新
  tabList.querySelectorAll(".tab-btn").forEach(btn => {
    btn.setAttribute("aria-selected", btn.dataset.id === rs.id ? "true" : "false");
  });

  // 自動取得
  fetchAndRender();
}

// ── 更新ボタン ─────────────────────────────────────────
refreshBtn.addEventListener("click", () => {
  clearError();
  fetchAndRender();
});

// ── /delays取得 → スコアリング → 描画 ─────────────────
async function fetchAndRender() {
  if (!currentRouteSet) return;

  setLoading(true);
  clearResults();

  try {
    const data = await fetchDelays();
    const delayMap = data.delays ?? {};
    const ranked = rankCandidates(currentRouteSet.candidates, delayMap);
    renderResults(ranked);
    setFetchedAt(data.fetched_at ?? "");
  } catch (err) {
    console.error(err);
    showError("情報の取得に失敗しました。もう一度ボタンを押してください。");
  } finally {
    setLoading(false);
  }
}
