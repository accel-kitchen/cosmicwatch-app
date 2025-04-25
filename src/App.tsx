import { useState, useCallback, useEffect, useMemo } from "react";
import { Layout, SectionTitle } from "./common/components/Layout";
import { SerialConnection } from "./common/components/SerialConnection";
import { DataTable } from "./common/components/DataTable";
import { parseCosmicWatchData } from "./common/utils/dataParser";
import { CosmicWatchData } from "./shared/types";
import { FileControls } from "./common/components/FileControls";
import { checkIsDesktop } from "./common/utils/platform";
import { ADCHistogram } from "./common/components/PlotlyADCHistogram";

// データ関連の状態をグループ化する型
interface MeasurementData {
  raw: string[];
  parsed: CosmicWatchData[];
  allParsed: CosmicWatchData[];
  startTime: Date | null;
  endTime: Date | null;
}

// ファイル関連の状態をグループ化する型
interface FileSettings {
  comment: string;
  suffix: string;
  autoSavePath: string | null;
}

function App() {
  // 測定データの状態管理（グループ化）
  const [data, setData] = useState<MeasurementData>({
    raw: [],
    parsed: [],
    allParsed: [],
    startTime: null,
    endTime: null,
  });

  // ファイル関連の設定（グループ化）
  const [fileSettings, setFileSettings] = useState<FileSettings>({
    comment: "",
    suffix: "",
    autoSavePath: null,
  });

  // プラットフォーム検出
  const [isDesktop, setIsDesktop] = useState(false);

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

  // データ受信時のハンドラー（修正）
  const handleDataReceived = useCallback((newData: string) => {
    setData((prevData) => {
      const isFirstData = !prevData.startTime;

      // 生データの追加
      const updatedRaw = [...prevData.raw, newData];

      // 解析データの処理
      const parsed = parseCosmicWatchData(newData);

      // 全データとテーブル表示用データ（最新100件）を別々に管理
      const updatedAllParsed = parsed
        ? [...prevData.allParsed, parsed]
        : prevData.allParsed;

      const updatedParsed = parsed
        ? [...prevData.parsed, parsed].slice(-100)
        : prevData.parsed;

      return {
        raw: updatedRaw,
        parsed: updatedParsed,
        allParsed: updatedAllParsed,
        startTime: isFirstData ? new Date() : prevData.startTime,
        endTime: null, // データ受信中は終了時刻をリセット
      };
    });
  }, []);

  // データクリア処理（更新）
  const handleClearData = useCallback(() => {
    setData({
      raw: [],
      parsed: [],
      allParsed: [],
      startTime: null,
      endTime: null,
    });

    setFileSettings((prev) => ({
      ...prev,
      autoSavePath: null,
    }));
  }, []);

  // 接続成功時の処理
  const handleConnectSuccess = useCallback(() => {
    console.log("接続成功");
  }, []);

  // 切断時の処理
  const handleDisconnect = useCallback(() => {
    setData((prev) => ({
      ...prev,
      endTime: prev.startTime ? new Date() : null,
    }));

    setFileSettings((prev) => ({
      ...prev,
      autoSavePath: null,
    }));
  }, []);

  // ファイルコメント更新ハンドラー
  const handleCommentChange = useCallback((comment: string) => {
    setFileSettings((prev) => ({ ...prev, comment }));
  }, []);

  // ファイル名サフィックス更新ハンドラー
  const handleSuffixChange = useCallback((suffix: string) => {
    setFileSettings((prev) => ({ ...prev, suffix }));
  }, []);

  // 自動保存パス更新ハンドラー
  const handleAutoSavePathChange = useCallback((path: string | null) => {
    setFileSettings((prev) => ({ ...prev, autoSavePath: path }));
  }, []);

  // 最新のrawDataを取得（メモ化）
  const latestRawData = useMemo(() => {
    return data.raw.length > 0 ? data.raw[data.raw.length - 1] : null;
  }, [data.raw]);

  return (
    <Layout>
      {/* レスポンシブレイアウト - 大画面では2カラム、小画面では縦並び */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左カラム */}
        <div className="space-y-6">
          {/* 1. ファイル設定 */}
          <FileControls
            rawData={data.raw}
            measurementStartTime={data.startTime}
            measurementEndTime={data.endTime}
            additionalComment={fileSettings.comment}
            setAdditionalComment={handleCommentChange}
            filenameSuffix={fileSettings.suffix}
            setFilenameSuffix={handleSuffixChange}
            isDesktop={isDesktop}
            setFileHandle={handleAutoSavePathChange}
            latestRawData={latestRawData}
          />
        </div>

        {/* 右カラム */}
        <div className="space-y-6">
          {/* 3. データ解析（ヒストグラム） */}
          <ADCHistogram data={data.allParsed} startTime={data.startTime} />
        </div>
      </div>

      {/* 下部セクション（全幅） */}
      <div className="mt-6 space-y-6">
        {/* 2. CosmicWatch接続 */}
        <SerialConnection
          onDataReceived={handleDataReceived}
          onClearData={handleClearData}
          onConnectSuccess={handleConnectSuccess}
          onDisconnect={handleDisconnect}
        />
        {/* 4. 測定データテーブル */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <SectionTitle>測定データ</SectionTitle>
          <div className="bg-white rounded-lg overflow-hidden max-h-80 overflow-y-auto">
            {data.parsed.length > 0 ? (
              <DataTable data={data.parsed} />
            ) : (
              <div className="p-6 text-gray-500 text-center flex items-center justify-center h-full">
                データを受信待ち...
              </div>
            )}
          </div>
        </div>

        {/* 5. 生データ表示 */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <SectionTitle>生データ</SectionTitle>
          <pre className="bg-gray-800 text-gray-200 p-4 rounded-lg overflow-auto max-h-80 text-sm font-mono">
            {data.raw.slice(-100).join("\n")}
          </pre>
        </div>
      </div>
    </Layout>
  );
}

export default App;
