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
    checkIsDesktop().then(setIsDesktop);
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
        onConnectSuccess={handleConnectSuccess}
        onDisconnect={handleDisconnect}
      />

      <div className="mt-4 space-y-4">
        <FileControls
          rawData={rawData}
          measurementStartTime={measurementStartTime}
          measurementEndTime={measurementEndTime}
          additionalComment={additionalComment}
          setAdditionalComment={setAdditionalComment}
          filenameSuffix={filenameSuffix}
          setFilenameSuffix={setFilenameSuffix}
        />

        {isDesktop && (
          <FileControlsDesktop
            measurementStartTime={measurementStartTime}
            setFileHandle={setAutoSaveFileHandle}
            latestRawData={
              rawData.length > 0 ? rawData[rawData.length - 1] : null
            }
            additionalComment={additionalComment}
            filenameSuffix={filenameSuffix}
          />
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
