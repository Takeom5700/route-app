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

  const parts = [];
  segments.forEach((seg, i) => {
    const isLast = i === segments.length - 1;
    const transferLabel = isLast ? "到着" : "乗換";
    parts.push(`
      <div class="seg-row">
        <div class="seg-board">
          <span class="seg-time">${esc(seg.board_time)}</span>
          <span class="seg-station">${esc(seg.board_station)}</span>
        </div>
        <div class="seg-line">
          <span class="seg-line-name">${esc(seg.line)}</span>
          <span class="seg-direction">（${esc(seg.direction)}）</span>
        </div>
        <div class="seg-alight">
          <span class="seg-time">${esc(seg.alight_time)}</span>
          <span class="seg-station">${esc(seg.alight_station)}</span>
          <span class="seg-transfer-label">${transferLabel}</span>
        </div>
      </div>
    `);

    // 乗換待ち時間（最終区間は不要）
    if (!isLast) {
      if (!seg.is_direct && seg.transfer_wait_min > 0) {
        parts.push(`<div class="seg-wait">⏱ 乗換 約${seg.transfer_wait_min}分待ち</div>`);
      } else if (!seg.is_direct) {
        parts.push(`<div class="seg-wait seg-wait--direct">↔ 乗換</div>`);
      }
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
