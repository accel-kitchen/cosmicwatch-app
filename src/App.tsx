import { useState, useCallback, useEffect } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Layout } from "./common/components/Layout";
import { SerialConnection } from "./common/components/SerialConnection";
import { DataTable } from "./common/components/DataTable";
import { parseCosmicWatchData } from "./common/utils/dataParser";
import { CosmicWatchData } from "./shared/types";

function App() {
  const [rawData, setRawData] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<CosmicWatchData[]>([]);

  const handleDataReceived = useCallback((newData: string) => {
    console.log("Received raw data:", newData);

    setRawData((prev) => {
      const updated = [...prev, newData];
      return updated.slice(-1000);
    });

    const parsed = parseCosmicWatchData(newData);
    console.log("Parsed data:", parsed); // パース結果をログ出力

    if (parsed) {
      setParsedData((prev) => {
        const updated = [...prev, parsed];
        console.log("Updated parsed data array:", updated); // 更新後のデータ配列をログ出力
        return updated.slice(-100);
      });
    }
  }, []);

  // デバッグ用：parsedDataの変更を監視
  useEffect(() => {
    console.log("Current parsedData:", parsedData);
  }, [parsedData]);

  return (
    <Layout>
      <SerialConnection onDataReceived={handleDataReceived} />

      <div className="mt-4 space-y-4">
        <div>
          <h2 className="text-xl font-bold mb-2">測定データ</h2>
          <div className="bg-white rounded-lg shadow">
            {parsedData.length > 0 ? (
              <DataTable data={parsedData} />
            ) : (
              <div className="p-4 text-gray-500 text-center">
                データを受信待ち...
              </div>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">生データ</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-48 text-sm">
            {rawData.join("\n")}
          </pre>
        </div>
      </div>
    </Layout>
  );
}

export default App;
