import { useState, useEffect } from "react";
import { path } from "@tauri-apps/api";
import { open } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { downloadDir } from "@tauri-apps/api/path";
import {
  formatDateForFilename,
  formatDateTimeLocale,
} from "../utils/formatters";
// import { writeFile } from "@tauri-apps/api/fs";

// ログを簡略化 - 重要なエラーや状態変化のみ残す
// const logDebug = (...args: any[]) => console.log("[FileControlsDesktop]", ...args);

interface FileControlsDesktopProps {
  measurementStartTime: Date | null;
  setFileHandle: (path: string | null) => void;
  latestRawData: string | null;
  additionalComment: string;
  filenameSuffix: string;
}

export const FileControlsDesktop = ({
  measurementStartTime,
  setFileHandle,
  latestRawData,
  additionalComment,
  filenameSuffix,
}: FileControlsDesktopProps) => {
  const [saveDirectory, setSaveDirectory] = useState<string>("");
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isFileCreated, setIsFileCreated] = useState<boolean>(false);

  useEffect(() => {
    const setDefaultPath = async () => {
      try {
        // logDebug("Attempting to get download directory..."); // 削除
        const dir = await downloadDir();
        // logDebug("Default save directory set to:", dir); // 削除
        setSaveDirectory(dir);
      } catch (error) {
        console.error("Failed to get download directory:", error);
      }
    };
    setDefaultPath();
  }, []);

  // ファイル作成/上書き
  useEffect(() => {
    if (
      measurementStartTime &&
      autoSaveEnabled &&
      saveDirectory &&
      !isFileCreated
    ) {
      // logDebug("Conditions met: Starting file creation logic..."); // 削除

      const createAndWrite = async () => {
        try {
          const currentAdditionalComment = additionalComment;
          const currentFilenameSuffix = filenameSuffix;

          const comments =
            [
              "# CosmicWatch Data",
              `# Measurement Start: ${formatDateTimeLocale(
                measurementStartTime
              )}`,
              ...currentAdditionalComment
                .split("\n")
                .filter((line) => line.trim())
                .map((line) => `# ${line}`),
            ].join("\n") + "\n";

          const startTimestamp = formatDateForFilename(measurementStartTime);
          // ★ ファイル名を変更: {測定開始時間}_{ユーザー指定の詳細}.dat
          const autoSaveSuffix = currentFilenameSuffix
            ? `_${currentFilenameSuffix}`
            : "";
          // const filename = `${startTimestamp}${autoSaveSuffix}_autosave.dat`; // 古い形式
          const filename = `${startTimestamp}${autoSaveSuffix}.dat`; // 新しい形式

          const fullPath = await path.join(saveDirectory, filename);

          // logDebug("Attempting to write/overwrite file:", fullPath); // 削除
          await writeTextFile(fullPath, comments, { append: false });
          console.log(
            "[FileControlsDesktop] Auto-save file created/overwritten:",
            fullPath
          ); // INFOレベルのログに変更

          setCurrentFilePath(fullPath);
          setFileHandle(fullPath);
          setIsFileCreated(true);
        } catch (error) {
          console.error("Failed to create/overwrite auto-save file:", error);
          setCurrentFilePath(null);
          setFileHandle(null);
          setIsFileCreated(false);
        }
      };
      createAndWrite();
    } else if (!measurementStartTime && isFileCreated) {
      // logDebug("Measurement stopped/cleared..."); // 削除
      setCurrentFilePath(null);
      setFileHandle(null);
      setIsFileCreated(false);
    }
  }, [
    measurementStartTime,
    autoSaveEnabled,
    saveDirectory,
    isFileCreated,
    setFileHandle,
  ]);

  // データ追記
  useEffect(() => {
    const appendData = async () => {
      if (
        autoSaveEnabled &&
        currentFilePath &&
        latestRawData &&
        isFileCreated
      ) {
        // logDebug("Attempting to append data to:", currentFilePath); // 削除
        try {
          await writeTextFile(currentFilePath, latestRawData + "\n", {
            append: true,
          });
          // logDebug("Successfully appended data."); // 削除 (頻繁すぎるため)
        } catch (error) {
          console.error("Failed to append data:", error);
          // logDebug("Error during append..."); // 削除
          setCurrentFilePath(null);
          setFileHandle(null);
          setIsFileCreated(false);
        }
      }
    };
    appendData();
  }, [
    latestRawData,
    autoSaveEnabled,
    currentFilePath,
    setFileHandle,
    isFileCreated,
  ]);

  // ディレクトリ選択
  const handleSelectCustomPath = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === "string") {
        // logDebug("Custom auto-save directory selected:", selected); // 削除
        setSaveDirectory(selected);
        setCurrentFilePath(null);
        setFileHandle(null);
        setIsFileCreated(false);
      }
    } catch (error) {
      console.error("Failed to select directory:", error);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-5">
      <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">
        自動保存設定 (デスクトップ)
      </h2>
      {/* 追加コメントとファイル名追加情報の入力欄は削除 (FileControls側で表示) */}

      <div>
        {" "}
        {/* 自動保存フォルダ設定 */}
        <label
          htmlFor="saveDirectory"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          自動保存先フォルダ
        </label>
        <div className="flex items-center gap-2">
          <input
            id="saveDirectory"
            type="text"
            className="flex-grow block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm" // bg-gray-100 で編集不可感を出す
            value={saveDirectory}
            readOnly
            placeholder="フォルダを選択..."
          />
          <button
            onClick={handleSelectCustomPath}
            className="flex-shrink-0 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
          >
            変更
          </button>
        </div>
      </div>

      <div>
        {" "}
        {/* 自動保存有効/無効 */}
        <div className="flex items-center mt-2">
          <input
            id="autoSave"
            type="checkbox"
            checked={autoSaveEnabled}
            onChange={(e) => {
              const isChecked = e.target.checked;
              setAutoSaveEnabled(isChecked);
              if (!isChecked) {
                setCurrentFilePath(null);
                setFileHandle(null);
                setIsFileCreated(false);
              }
            }}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2 cursor-pointer"
          />
          <label
            htmlFor="autoSave"
            className="text-sm font-medium text-gray-700 select-none cursor-pointer"
          >
            接続時に自動でファイルを作成し追記する
          </label>
        </div>
        {currentFilePath && autoSaveEnabled && (
          <p className="text-xs text-green-700 mt-1 font-medium">
            自動保存中:{" "}
            <span className="font-normal text-gray-600 break-all">
              {currentFilePath}
            </span>
          </p>
        )}
        {!autoSaveEnabled && (
          <p className="text-xs text-gray-500 mt-1">自動保存は無効です。</p>
        )}
        {autoSaveEnabled && !currentFilePath && measurementStartTime && (
          <p className="text-xs text-yellow-600 mt-1">ファイル作成待機中...</p>
        )}
        {autoSaveEnabled && !measurementStartTime && (
          <p className="text-xs text-gray-500 mt-1">
            接続後に自動保存が開始されます。
          </p>
        )}
      </div>
    </div>
  );
};
