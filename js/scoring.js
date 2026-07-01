// 候補をスコアリングして順位付きで返す

/**
 * @param {Array} candidates - ルートセットのcandidates[]
 * @param {Object} delayMap  - { "路線名": { delay_min, status, text }, ... }
 * @returns {Array} 順位付き候補（rank, delayScore, totalScore, alertLevel, delayDetail, adjustedMinutes）
 */
export function rankCandidates(candidates, delayMap) {
  return candidates
    .map(c => {
      // 遅延スコア = 各路線の遅延分 + 乗換ペナルティ
      const delayScore = c.lines.reduce((sum, line) => {
        return sum + (delayMap[line]?.delay_min ?? 0);
      }, 0) + c.transfers * 3;

      const totalScore = c.duration_min * 1.0 + delayScore * 2.0 + c.transfers * 5.0;

      const alertLevel =
        delayScore === 0 ? "ok"
        : delayScore < 5  ? "ok"
        : delayScore < 15 ? "warn"
        : "danger";

      const delayDetail = c.lines.map(line => ({
        line,
        delay_min: delayMap[line]?.delay_min ?? 0,
        status:    delayMap[line]?.status    ?? "不明",
        text:      delayMap[line]?.text      ?? ""
      }));

      const adjustedMinutes = c.duration_min + delayScore;

      return { ...c, delayScore, totalScore, alertLevel, delayDetail, adjustedMinutes };
    })
    .sort((a, b) => a.totalScore - b.totalScore)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}
