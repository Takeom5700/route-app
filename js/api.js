// Workers APIへのfetch

const WORKERS_URL = "https://route-api.takechan5700.workers.dev";

/**
 * 遅延情報を取得
 * @returns {Promise<{delays: Object, fetched_at: string}>}
 */
export async function fetchDelays() {
  const res = await fetch(`${WORKERS_URL}/delays`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
