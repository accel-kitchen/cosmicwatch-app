import { CosmicWatchData } from "../../shared/types";

/**
 * 現在時刻を「YYYY-MM-DD-HH-MM-SS.MS」形式の文字列に変換する
 */
const getCurrentTimestampString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

  return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}.${milliseconds}`;
};

export const parseCosmicWatchData = (line: string): CosmicWatchData | null => {
  // コメント行はnullを返す
  if (line.startsWith("#")) {
    console.log("Skipping comment line:", line);
    return null;
  }

  try {
    const parts = line.trim().split(/\s+/); // タブまたはスペースで分割
    console.log("Split parts:", parts);

    // 現在のPC時刻を取得
    const pcTimestamp = getCurrentTimestampString();

    // データ形式に応じてパース
    switch (parts.length) {
      case 6: // event time adc sipm deadtime temp
        return {
          event: parseInt(parts[0], 10),
          time: parseInt(parts[1], 10),
          adc: parseInt(parts[2], 10),
          sipm: parseFloat(parts[3]),
          deadtime: parseInt(parts[4], 10),
          temp: parseFloat(parts[5]),
          date: pcTimestamp, // PC時刻をdate項目として追加
        };
      case 7: // event date totaltime adc sipm deadtime temp
        return {
          event: parseInt(parts[0], 10),
          date: pcTimestamp, // 元のdateを上書き
          totaltime: parseInt(parts[2], 10),
          adc: parseInt(parts[3], 10),
          sipm: parseFloat(parts[4]),
          deadtime: parseInt(parts[5], 10),
          temp: parseFloat(parts[6]),
        };
      case 9: // event date totaltime adc sipm deadtime temp hum press
        return {
          event: parseInt(parts[0], 10),
          date: pcTimestamp, // 元のdateを上書き
          totaltime: parseInt(parts[2], 10),
          adc: parseInt(parts[3], 10),
          sipm: parseFloat(parts[4]),
          deadtime: parseInt(parts[5], 10),
          temp: parseFloat(parts[6]),
          hum: parseFloat(parts[7]),
          press: parseFloat(parts[8]),
        };
      default:
        console.log("Invalid number of parts:", parts.length);
        return null;
    }
  } catch (error) {
    console.error("Data parse error:", error, "for line:", line);
    return null;
  }
};
