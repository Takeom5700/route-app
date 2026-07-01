// DOM操作・カード描画

/** ローディング表示切り替え */
export function setLoading(show) {
  document.getElementById("loading").hidden = !show;
  const btn = document.getElementById("refresh-btn");
  if (btn) btn.disabled = show;
}

/** エラー表示 */
export function showError(msg) {
  const el = document.getElementById("error-message");
  el.textContent = msg;
  el.hidden = false;
}

/** エラー非表示 */
export function clearError() {
  const el = document.getElementById("error-message");
  el.textContent = "";
  el.hidden = true;
}

/**
 * ランキング済み候補を結果エリアに描画
 * @param {Array} rankedCandidates - rankCandidates()の返り値
 */
export function renderResults(rankedCandidates) {
  const container = document.getElementById("results");
  container.innerHTML = "";
  container.hidden = false;

  if (!rankedCandidates || rankedCandidates.length === 0) {
    container.textContent = "候補が見つかりませんでした。";
    return;
  }

  rankedCandidates.forEach((c, i) => {
    const card = i === 0 ? buildFirstCard(c) : buildCollapsedCard(c);
    container.appendChild(card);
  });
}

/** 結果エリアをクリア */
export function clearResults() {
  const container = document.getElementById("results");
  container.innerHTML = "";
  container.hidden = true;
}

/**
 * 最終確認時刻を表示
 * @param {string} fetchedAt - ISO文字列 or "HH:MM" 形式
 */
export function setFetchedAt(fetchedAt) {
  const el = document.getElementById("fetched-at");
  if (!el) return;
  if (!fetchedAt) {
    el.textContent = "";
    return;
  }
  // ISO文字列なら変換、そうでなければそのまま
  let label = fetchedAt;
  try {
    const d = new Date(fetchedAt);
    if (!isNaN(d)) {
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      label = `${h}:${m}`;
    }
  } catch { /* 変換失敗はそのまま */ }
  el.textContent = `${label} 現在`;
}

// ── カード構築 ─────────────────────────────────────────

function buildFirstCard(c) {
  const card = document.createElement("div");
  card.className = `route-card alert-${c.alertLevel}`;

  const header = document.createElement("div");
  header.className = "card-first-header";
  header.innerHTML = `<span aria-hidden="true">★</span><span class="rank-label-first">おすすめ</span>`;
  card.appendChild(header);

  const body = document.createElement("div");
  body.className = "card-body";
  body.innerHTML = buildBodyHTML(c);
  card.appendChild(body);

  return card;
}

function buildCollapsedCard(c) {
  const card = document.createElement("div");
  card.className = `route-card alert-${c.alertLevel}`;

  const header = document.createElement("button");
  header.className = "collapsed-header";
  header.setAttribute("aria-expanded", "false");
  header.innerHTML = `
    <span class="rank-label">第${c.rank}候補</span>
    <span class="card-summary">${esc(c.name)}</span>
    <span class="toggle-icon" aria-hidden="true">▶</span>
  `;

  const body = document.createElement("div");
  body.className = "collapsed-body";
  body.hidden = true;
  body.innerHTML = buildBodyHTML(c);

  header.addEventListener("click", () => {
    const open = !body.hidden;
    body.hidden = open;
    header.setAttribute("aria-expanded", String(!open));
    header.querySelector(".toggle-icon").textContent = open ? "▶" : "▼";
  });

  card.appendChild(header);
  card.appendChild(body);
  return card;
}

function buildBodyHTML(c) {
  const delayHTML = buildDelayHTML(c);
  const lineListHTML = buildLineListHTML(c);

  return `
    <p class="route-name">${esc(c.name)}</p>
    <p class="route-duration">約${c.adjustedMinutes}分</p>
    <p class="route-meta">乗換${c.transfers}回・${c.fare.toLocaleString()}円</p>
    ${delayHTML}
    <p class="section-label">各路線の状況:</p>
    <ul class="line-status-list">${lineListHTML}</ul>
  `;
}

function buildDelayHTML(c) {
  if (c.alertLevel === "ok") return "";

  // 遅延のある路線を列挙
  const delayedLines = c.delayDetail.filter(d => d.delay_min > 0);
  if (delayedLines.length === 0) return "";

  const icon = c.alertLevel === "danger" ? "✕" : "⚠";
  const mainText = delayedLines.map(d => `${icon} ${esc(d.line)} 約${d.delay_min}分遅延`).join("<br>");
  const note = c.adjustedMinutes !== c.duration_min
    ? `<span class="delay-alert-note">実際は約${c.adjustedMinutes}分かかる見込み</span>`
    : "";

  return `<div class="delay-alert ${c.alertLevel}">
    <span class="delay-alert-main">${mainText}</span>
    ${note}
  </div>`;
}

function buildLineListHTML(c) {
  return c.delayDetail.map(d => {
    let cls = "";
    if (d.delay_min >= 15) cls = "danger";
    else if (d.delay_min > 0) cls = "warn";

    const statusText = d.delay_min > 0
      ? `約${d.delay_min}分遅延`
      : "平常運転";

    return `<li class="${cls}">${esc(d.line)} ▶ ${statusText}</li>`;
  }).join("");
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
