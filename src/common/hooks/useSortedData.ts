import { useMemo } from "react";
import { CosmicWatchData } from "../../shared/types";

/**
 * データのソートと制限を行うカスタムフック
 */
export function useSortedData(data: CosmicWatchData[], limit = 100) {
  return useMemo(() => {
    // データをeventフィールドで降順ソート（最新のイベントを先頭に）
    return [...data].sort((a, b) => b.event - a.event).slice(0, limit); // 指定した件数に制限
  }, [data, limit]);
}
