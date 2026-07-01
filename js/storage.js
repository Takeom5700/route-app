// localStorageのルートセット読み書き

const KEY = "routeSets";

/** ルートセット一覧を取得 */
export function loadRouteSets() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

/** ルートセット一覧を保存 */
export function saveRouteSets(routeSets) {
  localStorage.setItem(KEY, JSON.stringify(routeSets));
}

/** 単一ルートセットを追加または更新（idで判定） */
export function upsertRouteSet(routeSet) {
  const list = loadRouteSets();
  const idx = list.findIndex(r => r.id === routeSet.id);
  if (idx >= 0) {
    list[idx] = routeSet;
  } else {
    list.push(routeSet);
  }
  saveRouteSets(list);
}

/** 指定idのルートセットを削除 */
export function deleteRouteSet(id) {
  const list = loadRouteSets().filter(r => r.id !== id);
  saveRouteSets(list);
}

/** シンプルなUUID生成 */
export function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}
