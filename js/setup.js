// 設定画面のロジック
import { loadRouteSets, upsertRouteSet, deleteRouteSet, generateId } from "./storage.js";

// 関東主要路線リスト
const KANTO_LINES = [
  // 相鉄
  { group: "相鉄", lines: ["相鉄本線", "相鉄いずみ野線", "相鉄・JR直通線", "相鉄・東急直通線"] },
  // 東急
  { group: "東急", lines: ["東急東横線", "東急田園都市線", "東急目黒線", "東急大井町線", "東急池上線", "東急多摩川線"] },
  // 小田急
  { group: "小田急", lines: ["小田急小田原線", "小田急江ノ島線", "小田急多摩線"] },
  // 京急
  { group: "京急", lines: ["京急本線", "京急空港線", "京急逗子線"] },
  // 京王
  { group: "京王", lines: ["京王線", "京王新線", "京王井の頭線"] },
  // 西武
  { group: "西武", lines: ["西武池袋線", "西武新宿線"] },
  // 東武
  { group: "東武", lines: ["東武東上線", "東武スカイツリーライン"] },
  // JR
  { group: "JR", lines: ["JR山手線", "JR中央線", "JR総武線", "JR京浜東北線", "JR横須賀線", "JR東海道線", "JR湘南新宿ライン", "JR上野東京ライン", "JR埼京線", "JR南武線", "JR横浜線", "JR根岸線"] },
  // 東京メトロ
  { group: "東京メトロ", lines: ["東京メトロ千代田線", "東京メトロ副都心線", "東京メトロ有楽町線", "東京メトロ銀座線", "東京メトロ丸ノ内線", "東京メトロ日比谷線", "東京メトロ東西線", "東京メトロ半蔵門線", "東京メトロ南北線"] },
  // 都営
  { group: "都営", lines: ["都営浅草線", "都営三田線", "都営新宿線", "都営大江戸線"] },
  // その他
  { group: "その他", lines: ["横浜高速鉄道みなとみらい線", "ゆりかもめ", "りんかい線"] },
];

// ── DOM参照 ────────────────────────────────────────────
const routesetList    = document.getElementById("routeset-list");
const addBtn          = document.getElementById("add-routeset-btn");
const editContainer   = document.getElementById("edit-form-container");
const editFormTitle   = document.getElementById("edit-form-title");
const labelInput      = document.getElementById("routeset-label");
const candidatesEl    = document.getElementById("candidates-container");
const saveBtn         = document.getElementById("save-routeset-btn");
const cancelBtn       = document.getElementById("cancel-edit-btn");

// 編集中のルートセットid（新規追加はnull）
let editingId = null;

// ── 初期描画 ───────────────────────────────────────────
renderList();

// ── 「新しいルートセットを追加」ボタン ────────────────
addBtn.addEventListener("click", () => {
  openForm(null);
});

// ── キャンセル ─────────────────────────────────────────
cancelBtn.addEventListener("click", () => {
  editContainer.hidden = true;
  editingId = null;
});

// ── 保存 ──────────────────────────────────────────────
saveBtn.addEventListener("click", () => {
  const label = labelInput.value.trim();
  if (!label) {
    alert("ルートセット名を入力してください。");
    labelInput.focus();
    return;
  }

  const candidates = collectCandidates();
  const valid = candidates.filter(c => c.name.trim());
  if (valid.length === 0) {
    alert("少なくとも1つの候補に名前を入力してください。");
    return;
  }

  const routeSet = {
    id:         editingId ?? generateId(),
    label,
    candidates: valid,
  };

  upsertRouteSet(routeSet);
  editContainer.hidden = true;
  editingId = null;
  renderList();
});

// ── 一覧再描画 ─────────────────────────────────────────
function renderList() {
  const list = loadRouteSets();
  routesetList.innerHTML = "";

  if (list.length === 0) {
    const msg = document.createElement("p");
    msg.style.cssText = "color:#666;padding:12px 0;";
    msg.textContent = "まだルートセットが登録されていません。";
    routesetList.appendChild(msg);
    return;
  }

  list.forEach(rs => {
    const item = document.createElement("div");
    item.className = "routeset-item";

    const lbl = document.createElement("span");
    lbl.className = "routeset-item-label";
    lbl.textContent = rs.label;

    const actions = document.createElement("div");
    actions.className = "routeset-item-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "btn-edit";
    editBtn.textContent = "編集";
    editBtn.addEventListener("click", () => openForm(rs));

    const delBtn = document.createElement("button");
    delBtn.className = "btn-delete";
    delBtn.textContent = "削除";
    delBtn.addEventListener("click", () => {
      if (!confirm(`「${rs.label}」を削除しますか？`)) return;
      deleteRouteSet(rs.id);
      // 編集中だった場合はフォームを閉じる
      if (editingId === rs.id) {
        editContainer.hidden = true;
        editingId = null;
      }
      renderList();
    });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    item.appendChild(lbl);
    item.appendChild(actions);
    routesetList.appendChild(item);
  });
}

// ── フォームを開く ─────────────────────────────────────
function openForm(rs) {
  editingId = rs?.id ?? null;
  editFormTitle.textContent = rs ? "ルートセットを編集" : "ルートセットを追加";
  labelInput.value = rs?.label ?? "";

  // 候補フォーム3件分を構築
  const defaultCandidates = rs?.candidates ?? [];
  candidatesEl.innerHTML = "";

  for (let i = 0; i < 3; i++) {
    const c = defaultCandidates[i] ?? null;
    candidatesEl.appendChild(buildCandidateBlock(i + 1, c));
  }

  editContainer.hidden = false;
  editContainer.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ── 候補フォームブロック構築 ──────────────────────────
function buildCandidateBlock(num, candidate) {
  const block = document.createElement("div");
  block.className = "candidate-block";
  block.dataset.num = num;

  block.innerHTML = `<h3>候補${num}</h3>`;

  // 名前
  const nameGroup = document.createElement("div");
  nameGroup.className = "form-group";
  nameGroup.innerHTML = `<label>名前</label>`;
  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "candidate-name";
  nameInput.placeholder = "例：相鉄→東横線直通";
  nameInput.value = candidate?.name ?? "";
  nameGroup.appendChild(nameInput);
  block.appendChild(nameGroup);

  // 所要時間・料金
  const metaRow = document.createElement("div");
  metaRow.className = "candidate-meta-row";

  const durGroup = document.createElement("div");
  durGroup.className = "form-group";
  durGroup.innerHTML = `<label>所要時間(分)</label>`;
  const durInput = document.createElement("input");
  durInput.type = "number";
  durInput.className = "candidate-duration";
  durInput.min = "1";
  durInput.placeholder = "例：68";
  durInput.value = candidate?.duration_min ?? "";
  durGroup.appendChild(durInput);

  const fareGroup = document.createElement("div");
  fareGroup.className = "form-group";
  fareGroup.innerHTML = `<label>料金(円)</label>`;
  const fareInput = document.createElement("input");
  fareInput.type = "number";
  fareInput.className = "candidate-fare";
  fareInput.min = "0";
  fareInput.placeholder = "例：640";
  fareInput.value = candidate?.fare ?? "";
  fareGroup.appendChild(fareInput);

  const transGroup = document.createElement("div");
  transGroup.className = "form-group";
  transGroup.innerHTML = `<label>乗換(回)</label>`;
  const transInput = document.createElement("input");
  transInput.type = "number";
  transInput.className = "candidate-transfers";
  transInput.min = "0";
  transInput.placeholder = "0";
  transInput.value = candidate?.transfers ?? "0";
  transGroup.appendChild(transInput);

  metaRow.appendChild(durGroup);
  metaRow.appendChild(fareGroup);
  metaRow.appendChild(transGroup);
  block.appendChild(metaRow);

  // 路線選択
  const lineSection = document.createElement("div");
  const linesLabel = document.createElement("span");
  linesLabel.className = "line-select-label";
  linesLabel.textContent = "使う路線を選択";
  lineSection.appendChild(linesLabel);

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.className = "line-select-toggle";
  toggleBtn.innerHTML = `<span class="toggle-text">路線を選ぶ（タップで展開）</span><span>▼</span>`;

  const checkboxPanel = document.createElement("div");
  checkboxPanel.className = "line-checkbox-list";
  checkboxPanel.hidden = true;

  // 選択中路線の更新
  const selectedLines = candidate?.lines ?? [];
  const updateToggleText = () => {
    const checked = [...checkboxPanel.querySelectorAll("input[type=checkbox]:checked")].map(cb => cb.value);
    toggleBtn.querySelector(".toggle-text").textContent =
      checked.length > 0 ? checked.join("、") : "路線を選ぶ（タップで展開）";
  };

  // チェックボックスリスト構築
  KANTO_LINES.forEach(({ group, lines }) => {
    const groupEl = document.createElement("div");
    groupEl.className = "line-checkbox-group";

    const groupLabel = document.createElement("span");
    groupLabel.className = "line-checkbox-group-label";
    groupLabel.textContent = group;
    groupEl.appendChild(groupLabel);

    lines.forEach(line => {
      const itemLabel = document.createElement("label");
      itemLabel.className = "line-checkbox-item";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = line;
      cb.className = "candidate-line";
      cb.checked = selectedLines.includes(line);
      cb.addEventListener("change", updateToggleText);

      itemLabel.appendChild(cb);
      itemLabel.appendChild(document.createTextNode(line));
      groupEl.appendChild(itemLabel);
    });

    checkboxPanel.appendChild(groupEl);
  });

  toggleBtn.addEventListener("click", () => {
    checkboxPanel.hidden = !checkboxPanel.hidden;
    toggleBtn.querySelector("span:last-child").textContent = checkboxPanel.hidden ? "▼" : "▲";
  });

  updateToggleText();
  lineSection.appendChild(toggleBtn);
  lineSection.appendChild(checkboxPanel);
  block.appendChild(lineSection);

  return block;
}

// ── 候補データを収集 ──────────────────────────────────
function collectCandidates() {
  const blocks = candidatesEl.querySelectorAll(".candidate-block");
  const result = [];

  blocks.forEach((block, i) => {
    const name      = block.querySelector(".candidate-name").value.trim();
    const duration  = parseInt(block.querySelector(".candidate-duration").value, 10);
    const fare      = parseInt(block.querySelector(".candidate-fare").value, 10);
    const transfers = parseInt(block.querySelector(".candidate-transfers").value, 10);
    const lines     = [...block.querySelectorAll(".candidate-line:checked")].map(cb => cb.value);

    result.push({
      id:           `c${i + 1}`,
      name,
      lines,
      duration_min: isNaN(duration) ? 0 : duration,
      transfers:    isNaN(transfers) ? 0 : transfers,
      fare:         isNaN(fare) ? 0 : fare,
    });
  });

  return result;
}
