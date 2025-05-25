/**
 * Redux Selector共通ユーティリティ
 */

/**
 * 現在時刻を秒単位で取得（Redux selector安定化のため）
 * ミリ秒を切り捨てることで、同一秒内での不要な再計算を防ぐ
 */
export const getStableCurrentTime = (): Date => {
  const nowInSeconds = Math.floor(Date.now() / 1000) * 1000;
  return new Date(nowInSeconds);
};

/**
 * 平均値を安全に計算
 */
export const safeAverage = (total: number, count: number): number => {
  return count > 0 ? total / count : 0;
};

/**
 * 時間差を秒単位で計算
 */
export const calculateDurationInSeconds = (
  startTime: Date | null,
  endTime?: Date | null
): number => {
  if (!startTime) return 0;
  const end = endTime || getStableCurrentTime();
  return Math.floor((end.getTime() - startTime.getTime()) / 1000);
};
