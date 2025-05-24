import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Layout, SectionTitle } from "./common/components/Layout";
import { SerialConnection } from "./common/components/SerialConnection";
import { DataTable } from "./common/components/DataTable";
import { parseCosmicWatchData } from "./common/utils/dataParser";
import { CosmicWatchData } from "./shared/types";
import { FileControls } from "./common/components/FileControls";
import { checkIsDesktop } from "./common/utils/platform";
import { ADCHistogram } from "./common/components/PlotlyADCHistogram";
import { generateDemoData, resetDemoDataState } from "./common/utils/demoData";
import { UpdateChecker } from "./common/components/UpdateChecker";
import {
  ExclamationTriangleIcon,
  PlayIcon,
  StopIcon,
  LightBulbIcon,
} from "@heroicons/react/24/solid";
import { TableCellsIcon, CodeBracketIcon } from "@heroicons/react/24/outline";
import { MarkGithubIcon } from "@primer/octicons-react";

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

  // デモモード状態と制御
  const [isDemoMode, setIsDemoMode] = useState(false);
  const demoIntervalRef = useRef<number | null>(null);

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

  // 最新のパース済みデータを取得（メモ化）
  const latestParsedData = useMemo(() => {
    return data.parsed.length > 0 ? data.parsed[data.parsed.length - 1] : null;
  }, [data.parsed]);

  // デモモード開始
  const startDemoMode = () => {
    handleClearData(); // アプリの状態をクリア
    resetDemoDataState(); // デモデータのカウンターと時間をリセット
    setIsDemoMode(true);
  };

  // デモモード終了
  const stopDemoMode = () => {
    setIsDemoMode(false);
    // デモ終了時にもデータをクリアする場合 (任意)
    // handleClearData();
  };

  // デモデータ自動生成
  useEffect(() => {
    if (isDemoMode) {
      demoIntervalRef.current = setInterval(() => {
        const demoData = generateDemoData();
        handleDataReceived(demoData);
      }, 1000) as unknown as number; // 型アサーションを追加
    } else if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current);
      demoIntervalRef.current = null;
    }
    return () => {
      if (demoIntervalRef.current) {
        clearInterval(demoIntervalRef.current);
        demoIntervalRef.current = null;
      }
    };
  }, [isDemoMode, handleDataReceived]);

  return (
    <Layout>
      {/* アプリ右上へのデモモードボタン */}
      <div className="absolute top-4 right-4 flex items-center space-x-3 z-10">
        {isDemoMode && (
          <span className="text-red-600 font-bold text-sm bg-white px-2 py-1 rounded shadow">
            デモモード中
          </span>
        )}
        <button
          className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm ${
            isDemoMode
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          } text-white shadow`}
          onClick={isDemoMode ? stopDemoMode : startDemoMode}
          title={isDemoMode ? "デモモードを停止" : "デモモードを開始"}
        >
          {isDemoMode ? (
            <StopIcon className="h-4 w-4" />
          ) : (
            <PlayIcon className="h-4 w-4" />
          )}
          <span>{isDemoMode ? "停止" : "デモ"}</span>
        </button>
        <a
          href="https://github.com/accel-kitchen/cosmicwatch-app"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHubリポジトリを開く"
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <MarkGithubIcon size={20} />
        </a>
      </div>

      {/* ブラウザ版専用の注意事項カード */}
      {!isDesktop && (
        <div className="mb-6 border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-md shadow">
          <div className="space-y-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon
                  className="h-5 w-5 text-yellow-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Google Chrome, Microsoft Edge等に対応、Safariは非対応です。
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon
                  className="h-5 w-5 text-yellow-400"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  測定データをダウンロードせずにブラウザを閉じると、データは保存されません。
                </p>
              </div>
            </div>

            <div className="flex">
              <div className="flex-shrink-0">
                <LightBulbIcon
                  className="h-5 w-5 text-blue-500"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  ブラウザのタブを複数開くと、複数のCosmicWatchと接続/データの記録ができます。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* デスクトップ版のヒント */}
      {isDesktop && (
        <div className="mb-6 border-l-4 border-blue-400 bg-blue-50 p-4 rounded-r-md shadow">
          <div className="space-y-3">
            <div className="flex">
              <div className="flex-shrink-0">
                <LightBulbIcon
                  className="h-5 w-5 text-blue-500"
                  aria-hidden="true"
                />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  アプリを複数開くと、複数のCosmicWatchと接続/データの記録ができます。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* レスポンシブレイアウト - 大画面では2カラム、小画面では縦並び */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* 左カラム */}
        <div className="space-y-6 flex flex-col h-full">
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
            parsedData={latestParsedData}
          />
          {/* 2. CosmicWatch接続 */}
          <SerialConnection
            onDataReceived={handleDataReceived}
            onClearData={handleClearData}
            onConnectSuccess={handleConnectSuccess}
            onDisconnect={handleDisconnect}
            isDemoMode={isDemoMode}
          />
        </div>

        {/* 右カラム */}
        <div className="space-y-6 flex flex-col">
          {/* 3. データ解析（ヒストグラム） */}
          <div className="flex-1">
          <ADCHistogram data={data.allParsed} />
          </div>
        </div>
      </div>

      {/* 下部セクション（全幅） */}
      <div className="mt-6 space-y-6">
        {/* 4. 測定データテーブル */}
        <div className="p-6 bg-white rounded-lg shadow-md">
          <SectionTitle>
            <div className="flex items-center">
              <TableCellsIcon className="h-6 w-6 mr-2 text-gray-600" />
              測定データ
            </div>
          </SectionTitle>
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
          <SectionTitle>
            <div className="flex items-center">
              <CodeBracketIcon className="h-6 w-6 mr-2 text-gray-600" />
              生データ
            </div>
          </SectionTitle>
          <pre className="bg-gray-800 text-gray-200 p-4 rounded-lg overflow-auto max-h-80 text-sm font-mono">
            {data.raw.slice(-100).join("\n")}
          </pre>
        </div>
      </div>

      {/* アップデートチェッカー（固定位置スナックバー） */}
      <UpdateChecker />
    </Layout>
  );
}

export default App;
