import { useState, useEffect } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { checkIsDesktop } from "../utils/platform";
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface UpdateState {
  isChecking: boolean;
  isUpdating: boolean;
  updateAvailable: boolean;
  updateInstalled: boolean;
  currentVersion: string;
  latestVersion: string;
  error: string | null;
  errorDetails: string | null;
  isVisible: boolean;
  debugInfo: string[];
}

export const UpdateChecker = () => {
  const [isDesktop, setIsDesktop] = useState(false);
  const [updateState, setUpdateState] = useState<UpdateState>({
    isChecking: false,
    isUpdating: false,
    updateAvailable: false,
    updateInstalled: false,
    currentVersion: "",
    latestVersion: "",
    error: null,
    errorDetails: null,
    isVisible: false,
    debugInfo: [],
  });

  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkIsDesktop().then(setIsDesktop);
  }, []);

  const addDebugInfo = (info: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setUpdateState((prev) => ({
      ...prev,
      debugInfo: [...prev.debugInfo, `[${timestamp}] ${info}`].slice(-10), // 最新10件のみ保持
    }));
  };

  const checkForUpdates = async () => {
    if (!isDesktop) return;

    addDebugInfo("アップデートチェック開始");
    addDebugInfo("エンドポイント: GitHub Releases API");
    addDebugInfo("公開鍵設定: あり");

    setUpdateState((prev) => ({
      ...prev,
      isChecking: true,
      error: null,
      errorDetails: null,
      isVisible: true,
    }));

    try {
      addDebugInfo("Tauri updater check() を呼び出し中...");
      addDebugInfo("ネットワーク接続を確認中...");

      const update = await check();
      addDebugInfo(
        `check() 結果: ${update ? "アップデートあり" : "アップデートなし"}`
      );

      if (update) {
        addDebugInfo(
          `現在のバージョン: ${update.currentVersion}, 最新バージョン: ${update.version}`
        );
        addDebugInfo(`アップデートが利用可能です`);
        setUpdateState((prev) => ({
          ...prev,
          isChecking: false,
          updateAvailable: true,
          currentVersion: update.currentVersion,
          latestVersion: update.version,
          isVisible: true,
        }));
      } else {
        addDebugInfo("最新バージョンです");
        setUpdateState((prev) => ({
          ...prev,
          isChecking: false,
          updateAvailable: false,
          isVisible: true,
        }));

        // 最新版の場合は3秒後に自動非表示
        setTimeout(() => {
          setUpdateState((prev) => ({ ...prev, isVisible: false }));
        }, 3000);
      }
    } catch (error) {
      console.error("Update check failed:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "アップデート確認に失敗しました";
      const errorDetails =
        error instanceof Error
          ? `${error.name}: ${error.message}\n${error.stack}`
          : JSON.stringify(error);

      addDebugInfo(`エラー発生: ${errorMessage}`);
      addDebugInfo(`エラー詳細: ${errorDetails}`);

      // よくある原因の調査
      if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        addDebugInfo("🔍 ネットワーク接続を確認してください");
      }
      if (
        errorMessage.includes("signature") ||
        errorMessage.includes("verify")
      ) {
        addDebugInfo("🔍 署名検証エラー - 公開鍵の設定を確認");
      }
      if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        addDebugInfo("🔍 GitHub ReleasesにlatestReleasesが存在しません");
      }
      if (
        errorMessage.includes("permission") ||
        errorMessage.includes("access")
      ) {
        addDebugInfo("🔍 権限エラー - 管理者権限で実行してください");
      }

      setUpdateState((prev) => ({
        ...prev,
        isChecking: false,
        error: errorMessage,
        errorDetails: errorDetails,
        isVisible: true,
      }));

      // エラーの場合は10秒後に自動非表示（デバッグ情報確認時間を確保）
      setTimeout(() => {
        setUpdateState((prev) => ({ ...prev, isVisible: false }));
      }, 10000);
    }
  };

  const installUpdate = async () => {
    if (!isDesktop) return;

    addDebugInfo("アップデートインストール開始");

    setUpdateState((prev) => ({
      ...prev,
      isUpdating: true,
      error: null,
      errorDetails: null,
    }));

    try {
      addDebugInfo("アップデート情報を再取得中...");
      const update = await check();

      if (update) {
        addDebugInfo(
          `アップデートをダウンロード・インストール中... (v${update.version})`
        );
        // アップデートをダウンロード・インストール
        await update.downloadAndInstall();

        addDebugInfo("アップデートインストール完了");
        // インストール完了状態に設定
        setUpdateState((prev) => ({
          ...prev,
          isUpdating: false,
          updateInstalled: true,
        }));
      } else {
        addDebugInfo("アップデート情報が見つかりません");
        setUpdateState((prev) => ({
          ...prev,
          isUpdating: false,
          error: "アップデート情報が見つかりませんでした",
          errorDetails: null,
        }));
      }
    } catch (error) {
      console.error("Update installation failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "アップデートに失敗しました";
      const errorDetails =
        error instanceof Error
          ? `${error.name}: ${error.message}\n${error.stack}`
          : JSON.stringify(error);

      addDebugInfo(`インストールエラー: ${errorMessage}`);
      addDebugInfo(`エラー詳細: ${errorDetails}`);

      setUpdateState((prev) => ({
        ...prev,
        isUpdating: false,
        error: errorMessage,
        errorDetails: errorDetails,
      }));
    }
  };

  const hideSnackbar = () => {
    setUpdateState((prev) => ({ ...prev, isVisible: false }));
  };

  // 自動チェック（アプリ起動時・リロード時）
  useEffect(() => {
    if (isDesktop) {
      // アプリ起動・リロード時により早くチェック実行
      const timer = setTimeout(checkForUpdates, 1000);
      return () => clearTimeout(timer);
    }
  }, [isDesktop]);

  // リロード検知とアップデートチェック
  useEffect(() => {
    if (!isDesktop) return;

    const handleVisibilityChange = () => {
      // ページが再表示された時（タブ切り替えやリロード後）
      if (document.visibilityState === "visible" && !updateState.isChecking) {
        // 少し遅延してアップデートチェック実行
        setTimeout(checkForUpdates, 500);
      }
    };

    const handleFocus = () => {
      // ウィンドウがフォーカスされた時（リロード後含む）
      if (!updateState.isChecking) {
        setTimeout(checkForUpdates, 500);
      }
    };

    // リロード検知のためのイベントリスナー
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
    };
  }, [isDesktop, updateState.isChecking]);

  if (!isDesktop || !updateState.isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 flex-1">
            {updateState.isChecking && (
              <>
                <ArrowDownTrayIcon className="h-4 w-4 text-blue-500 animate-spin" />
                <span className="text-sm text-gray-700">更新確認中...</span>
              </>
            )}

            {updateState.isUpdating && (
              <>
                <ArrowDownTrayIcon className="h-4 w-4 text-green-500 animate-spin" />
                <span className="text-sm text-gray-700">インストール中...</span>
              </>
            )}

            {updateState.updateInstalled && (
              <>
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-700">更新完了</div>
                  <div className="text-xs text-gray-500">
                    アプリを再起動してください
                  </div>
                </div>
              </>
            )}

            {updateState.updateAvailable &&
              !updateState.isUpdating &&
              !updateState.updateInstalled && (
                <>
                  <ArrowDownTrayIcon className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-700">
                      v{updateState.latestVersion} 利用可能
                    </div>
                    <button
                      onClick={installUpdate}
                      className="text-xs text-blue-600 hover:text-blue-800 underline hover:no-underline mt-1"
                    >
                      今すぐ更新
                    </button>
                  </div>
                </>
              )}

            {!updateState.updateAvailable &&
              !updateState.isChecking &&
              !updateState.error &&
              !updateState.updateInstalled && (
                <>
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">
                    最新バージョンです
                  </span>
                </>
              )}

            {updateState.error && (
              <>
                <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                <div className="flex-1">
                  <div className="text-sm text-gray-700">
                    {updateState.error}
                  </div>
                  {updateState.errorDetails && (
                    <button
                      onClick={() => setShowDetails(!showDetails)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline hover:no-underline mt-1"
                    >
                      {showDetails ? "詳細を隠す" : "詳細を表示"}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={hideSnackbar}
            className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* エラー詳細・デバッグ情報パネル */}
        {(showDetails || updateState.debugInfo.length > 0) && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md max-h-40 overflow-y-auto">
            {showDetails && updateState.errorDetails && (
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-600 mb-1">
                  エラー詳細:
                </div>
                <pre className="text-xs text-gray-800 bg-white p-2 rounded border whitespace-pre-wrap">
                  {updateState.errorDetails}
                </pre>
              </div>
            )}

            {updateState.debugInfo.length > 0 && (
              <div>
                <div className="text-xs font-medium text-gray-600 mb-1">
                  デバッグログ:
                </div>
                <div className="text-xs text-gray-700 space-y-1">
                  {updateState.debugInfo.map((log, index) => (
                    <div
                      key={index}
                      className="font-mono bg-white p-1 rounded border"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
