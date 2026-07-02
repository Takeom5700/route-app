// DOM操作・カード描画

/** ローディング表示切り替え */
export function setLoading(show) {
  document.getElementById("spinner").hidden = !show;
  const btn = document.getElementById("search-btn");
  btn.disabled = show;
  btn.textContent = show ? "検索中..." : "今すぐ調べる";
}

/** エラー表示 */
export function showError() {
  document.getElementById("error-msg").hidden = false;
}

/** エラー非表示 */
export function hideError() {
  document.getElementById("error-msg").hidden = true;
}

/** 結果エリアをクリア */
export function clearResults() {
  document.getElementById("results").innerHTML = "";
}

/**
 * 経路リストを描画
 * @param {Array} routes - APIレスポンスの routes 配列
 */
export function renderResults(routes) {
  const container = document.getElementById("results");
  container.innerHTML = "";

  if (!routes || routes.length === 0) {
    container.textContent = "候補が見つかりませんでした。";
    return;
  }

  routes.forEach((route, i) => {
    const card = i === 0 ? buildFirstCard(route) : buildCollapsedCard(route, i + 1);
    container.appendChild(card);
  });
}

// ── カード構築 ─────────────────────────────────────────

function buildFirstCard(route) {
  const card = document.createElement("div");
  card.className = "route-card" + (route.has_delay ? " has-delay" : "");

  // ヘッダー
  const header = document.createElement("div");
  header.className = "card-top-header";
  header.innerHTML = `<span aria-hidden="true">★</span> いちばんおすすめ`;
  card.appendChild(header);

  // 本文
  const body = document.createElement("div");
  body.className = "card-body";
  body.innerHTML = buildBodyHTML(route);
  card.appendChild(body);

  return card;
}

function buildCollapsedCard(route, rank) {
  const card = document.createElement("div");
  card.className = "route-card" + (route.has_delay ? " has-delay" : "");

  // 折りたたみヘッダー
  const header = document.createElement("button");
  header.className = "collapsed-header";
  header.setAttribute("aria-expanded", "false");
  header.innerHTML = `
    <span class="rank-label">第${rank}候補</span>
    <span class="card-summary">${esc(route.summary)}</span>
    <span class="toggle-icon" aria-hidden="true">▼</span>
  `;

  // 本文（初期非表示）
  const body = document.createElement("div");
  body.className = "collapsed-body";
  body.hidden = true;
  body.innerHTML = buildBodyHTML(route);

  header.addEventListener("click", () => {
    const open = !body.hidden;
    body.hidden = open;
    header.setAttribute("aria-expanded", String(!open));
    header.querySelector(".toggle-icon").textContent = open ? "▼" : "▲";
  });

  card.appendChild(header);
  card.appendChild(body);
  return card;
}

function buildBodyHTML(route) {
  const delayHTML = route.has_delay && route.delay_info
    ? `<div class="delay-banner">⚠ ${esc(route.delay_info)}</div>`
    : "";

  const segHTML = buildSegmentsHTML(route.segments ?? []);

  return `
    <p class="route-time">${esc(route.departure)}発 → ${esc(route.arrival)}着　${esc(route.duration)}</p>
    <p class="route-meta">乗換${route.transfers}回　${route.fare.toLocaleString()}円</p>
    ${delayHTML}
    ${segHTML}
  `;
}

function buildSegmentsHTML(segments) {
  if (!segments || segments.length === 0) return "";

  // 駅ノード → 路線 → 駅ノード の縦列形式
  // 出発駅（seg[0].board）→ 路線 → 乗換駅（seg[0].alight） → 路線 → ... → 到着駅（seg[last].alight）
  const parts = [];

  segments.forEach((seg, i) => {
    const isLast = i === segments.length - 1;

    // 出発駅（最初のセグメントのみ）
    if (i === 0) {
      parts.push(`
        <div class="seg-node seg-node--depart">
          <span class="seg-time">${esc(seg.board_time)}</span>
          <span class="seg-station-name">${esc(seg.board_station)}</span>
          <span class="seg-badge seg-badge--depart">出発</span>
        </div>
      `);
    }

    // 路線（縦棒 + 路線名・行き先）
    parts.push(`
      <div class="seg-line-block">
        <div class="seg-line-bar"></div>
        <div class="seg-line-info">
          <span class="seg-line-name">${esc(seg.line)}</span>
          <span class="seg-direction">（${esc(seg.direction)}）</span>
        </div>
      </div>
    `);

    // 降車駅
    if (isLast) {
      parts.push(`
        <div class="seg-node seg-node--arrive">
          <span class="seg-time">${esc(seg.alight_time)}</span>
          <span class="seg-station-name">${esc(seg.alight_station)}</span>
          <span class="seg-badge seg-badge--arrive">到着</span>
        </div>
      `);
    } else {
      const waitText = seg.transfer_wait_min > 0
        ? `乗換　約${seg.transfer_wait_min}分待ち`
        : `乗換`;
      parts.push(`
        <div class="seg-node seg-node--transfer">
          <span class="seg-time">${esc(seg.alight_time)}</span>
          <span class="seg-station-name">${esc(seg.alight_station)}</span>
          <span class="seg-badge seg-badge--transfer">${waitText}</span>
        </div>
      `);
    }
  });

  return `<div class="segments">${parts.join("")}</div>`;
}

function esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
