// よく使うルートのlocalStorage読み書き

const KEY = "savedRoutes";
const MAX = 5;

/** 保存済みルート一覧を取得 */
export function loadSavedRoutes() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * ルートを保存（同じfrom+toは上書き、最大5件）
 * @param {string} from
 * @param {string} to
 */
export function saveRoute(from, to) {
  const label = `${from}→${to}`;
  const list = loadSavedRoutes().filter(r => r.label !== label);
  list.unshift({ label, from, to });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
}
