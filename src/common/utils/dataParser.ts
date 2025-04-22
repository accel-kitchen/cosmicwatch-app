import { CosmicWatchData } from "../../shared/types";

export const parseCosmicWatchData = (line: string): CosmicWatchData | null => {
  // コメント行はnullを返す
  if (line.startsWith("#")) {
    console.log("Skipping comment line:", line);
    return null;
  }

  try {
    const parts = line.trim().split(/\s+/); // タブまたはスペースで分割
    console.log("Split parts:", parts);

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
        };
      case 7: // event date totaltime adc sipm deadtime temp
        return {
          event: parseInt(parts[0], 10),
          date: parts[1],
          totaltime: parseInt(parts[2], 10),
          adc: parseInt(parts[3], 10),
          sipm: parseFloat(parts[4]),
          deadtime: parseInt(parts[5], 10),
          temp: parseFloat(parts[6]),
        };
      case 9: // event date totaltime adc sipm deadtime temp hum press
        return {
          event: parseInt(parts[0], 10),
          date: parts[1],
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
