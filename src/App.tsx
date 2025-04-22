import { useState, useCallback, useEffect } from "react";
import "./App.css";
import { Layout } from "./common/components/Layout";
import { SerialConnection } from "./common/components/SerialConnection";
import { DataTable } from "./common/components/DataTable";
import { parseCosmicWatchData } from "./common/utils/dataParser";
import { CosmicWatchData } from "./shared/types";
import { FileControls } from "./common/components/FileControls";
import { FileControlsDesktop } from "./common/components/FileControlsDesktop";
import { checkIsDesktop } from "./common/utils/platform";

function App() {
  const [rawData, setRawData] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<CosmicWatchData[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);

  // Tauriアプリケーションの判定
  useEffect(() => {
    checkIsDesktop().then(setIsDesktop);
  }, []);

  const handleDataReceived = useCallback((newData: string) => {
    console.log("Received raw data:", newData);
    setRawData((prev) => [...prev, newData]);

    const parsed = parseCosmicWatchData(newData);
    if (parsed) {
      setParsedData((prev) => {
        const updated = [...prev, parsed];
        return updated.slice(-100);
      });
    }
  }, []);

  const handleClearData = useCallback(() => {
    setRawData([]);
    setParsedData([]);
  }, []);

  // デバッグ用：parsedDataの変更を監視
  useEffect(() => {
    console.log("Current parsedData:", parsedData);
  }, [parsedData]);

  return (
    <Layout>
      <div className="bg-yellow-100 p-2 mb-4 rounded">
        実行環境: {isDesktop ? "デスクトップアプリ" : "Webブラウザ"}
        {isDesktop && <span className="ml-2">（Tauriアプリ）</span>}
      </div>

      <SerialConnection
        onDataReceived={handleDataReceived}
        onClearData={handleClearData}
      />

      <div className="mt-4 space-y-4">
        {isDesktop ? (
          <FileControlsDesktop rawData={rawData} />
        ) : (
          <FileControls rawData={rawData} />
        )}

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
