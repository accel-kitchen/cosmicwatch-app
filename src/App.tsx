import { useState, useCallback, useEffect } from "react";
import { Layout } from "./common/components/Layout";
import { SerialConnection } from "./common/components/SerialConnection";
import { DataTable } from "./common/components/DataTable";
import { parseCosmicWatchData } from "./common/utils/dataParser";
import { CosmicWatchData } from "./shared/types";
import { FileControls } from "./common/components/FileControls";
import { checkIsDesktop } from "./common/utils/platform";

function App() {
  const [rawData, setRawData] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<CosmicWatchData[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [measurementStartTime, setMeasurementStartTime] = useState<Date | null>(
    null
  );
  const [measurementEndTime, setMeasurementEndTime] = useState<Date | null>(
    null
  );

  // Desktop版自動保存用State
  const [autoSaveFileHandle, setAutoSaveFileHandle] = useState<string | null>(
    null
  );

  // ★ コメントとサフィックスのStateをAppに追加
  const [additionalComment, setAdditionalComment] = useState<string>("");
  const [filenameSuffix, setFilenameSuffix] = useState<string>("");

  // Tauriアプリケーションの判定
  useEffect(() => {
    checkIsDesktop().then((desktop) => {
      setIsDesktop(desktop);
      console.log(
        "実行環境:",
        desktop ? "デスクトップアプリ (Tauri)" : "Webブラウザ"
      );
    });
  }, []);

  const handleDataReceived = useCallback(
    (newData: string) => {
      // 最初のデータ受信時に開始時刻を設定
      if (!measurementStartTime) {
        setMeasurementStartTime(new Date());
      }
      setMeasurementEndTime(null); // データ受信中は終了時刻をリセット

      setRawData((prev) => {
        const updatedRaw = [...prev, newData];
        // Desktop版で自動保存が有効なら追記
        if (isDesktop && autoSaveFileHandle) {
          // FileControlsDesktop に追記処理を依頼 (後述)
          // ここで直接ファイル追記はせず、FileControlsDesktopにデータを渡す
        }
        return updatedRaw;
      });

      const parsed = parseCosmicWatchData(newData);
      if (parsed) {
        setParsedData((prev) => {
          const updated = [...prev, parsed];
          return updated.slice(-100);
        });
      }
    },
    [measurementStartTime, isDesktop, autoSaveFileHandle]
  ); // 依存関係追加

  const handleClearData = useCallback(() => {
    setRawData([]);
    setParsedData([]);
    setMeasurementStartTime(null);
    setMeasurementEndTime(null);
    setAutoSaveFileHandle(null); // ファイルハンドルもクリア
  }, []);

  // 接続成功時に自動保存開始トリガーをオン
  const handleConnectSuccess = useCallback(() => {
    // FileControlsDesktop側でmeasurementStartTimeを監視するため、
    // ここでのトリガー設定は不要
    console.log("Connect success (App.tsx)");
  }, []);

  // 切断時に終了時刻設定と自動保存トリガーをオフ
  const handleDisconnect = useCallback(() => {
    if (measurementStartTime) {
      setMeasurementEndTime(new Date());
    }
    setAutoSaveFileHandle(null);
    console.log("Disconnect (App.tsx)");
  }, [measurementStartTime]);

  // デバッグ用：parsedDataの変更を監視
  useEffect(() => {
    // console.log("Current parsedData:", parsedData); // 必要なら残す
  }, [parsedData]);

  return (
    <Layout>
      {/* 1. ファイル設定 */}
      <div className="gap-6 mb-6">
        <div>
          <FileControls
            rawData={rawData}
            measurementStartTime={measurementStartTime}
            measurementEndTime={measurementEndTime}
            additionalComment={additionalComment}
            setAdditionalComment={setAdditionalComment}
            filenameSuffix={filenameSuffix}
            setFilenameSuffix={setFilenameSuffix}
            isDesktop={isDesktop}
            setFileHandle={setAutoSaveFileHandle}
            latestRawData={
              rawData.length > 0 ? rawData[rawData.length - 1] : null
            }
          />
        </div>
      </div>

      {/* 2. CosmicWatch接続 */}
      <div className="mb-6">
        <SerialConnection
          onDataReceived={handleDataReceived}
          onClearData={handleClearData}
          onConnectSuccess={handleConnectSuccess}
          onDisconnect={handleDisconnect}
        />
      </div>

      {/* 3. データ表示 (横並び) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {" "}
        {/* lg以上で横並び */}
        <div className="mb-6 lg:mb-0">
          {" "}
          {/* 測定データ */}
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">
            測定データ
          </h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {parsedData.length > 0 ? (
              <DataTable data={parsedData} />
            ) : (
              <div className="p-6 text-gray-500 text-center">
                データを受信待ち...
              </div>
            )}
          </div>
        </div>
        <div>
          {" "}
          {/* 生データ */}
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">
            生データ (最新100件)
          </h2>
          <pre className="bg-gray-800 text-gray-200 p-4 rounded-lg shadow overflow-auto max-h-96 text-sm font-mono">
            {" "}
            {/* max-hを調整 */}
            {rawData.slice(-100).join("\n")}
          </pre>
        </div>
      </div>
    </Layout>
  );
}

export default App;
