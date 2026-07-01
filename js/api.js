// Workers APIへのfetch

const WORKERS_URL = "https://route-api.takechan5700.workers.dev";

/**
 * 経路検索
 * @param {string} from - 出発駅名
 * @param {string} to   - 目的駅名
 * @returns {Promise<{routes: Array, fetched_at: string}>}
 */
export async function fetchRoutes(from, to) {
  const params = new URLSearchParams({ from, to });
  const res = await fetch(`${WORKERS_URL}/route?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
