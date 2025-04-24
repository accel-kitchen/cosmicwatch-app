/**
 * DateオブジェクトをYYYYMMDDHHmmss形式の文字列に変換します。
 * nullの場合は 'nodate' を返します。
 * @param date - 変換するDateオブジェクトまたはnull
 * @returns フォーマットされた文字列または 'nodate'
 */
export const formatDateForFilename = (date: Date | null): string => {
  if (!date) return "nodate";

  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");

  return `${y}${mo}${d}${h}${mi}${s}`;
};

/**
 * Dateオブジェクトをロケール文字列（表示用）に変換します。
 * @param date - 変換するDateオブジェクトまたはnull
 * @returns フォーマットされた文字列または空文字列
 */
export const formatDateTimeLocale = (date: Date | null): string => {
  if (!date) return "";
  return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
};
