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
    <div className="space-y-4 bg-white rounded-lg shadow p-4">
      {/* 追加コメント */}
      {/*
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          追加コメント
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          rows={4}
          value={additionalComment}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setAdditionalComment(e.target.value)
          }
          placeholder="測定条件などのコメントを入力..."
        />
      </div>
       */}

      {/* ファイル名の追加情報 */}
      {/*
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          ファイル名の追加情報
        </label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          value={filenameSuffix}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setFilenameSuffix(e.target.value)
          }
          placeholder="例: test1"
        />
      </div>
       */}

      {/* 自動保存設定 */}
      <div className="border-t pt-4 mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          自動保存先フォルダ
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
            value={saveDirectory}
            readOnly
            placeholder="保存先フォルダ..."
          />
          <button
            onClick={handleSelectCustomPath}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            フォルダ変更
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="autoSave"
            checked={autoSaveEnabled}
            onChange={(e) => {
              const isChecked = e.target.checked;
              setAutoSaveEnabled(isChecked);
              if (!isChecked) {
                // logDebug("Auto save disabled..."); // 削除
                setCurrentFilePath(null);
                setFileHandle(null);
                setIsFileCreated(false);
              }
            }}
            className="rounded border-gray-300"
          />
          <label htmlFor="autoSave" className="text-sm text-gray-700">
            接続時に自動でファイルを作成し追記する
          </label>
        </div>
        {currentFilePath && autoSaveEnabled && (
          <p className="text-xs text-gray-500 mt-1">
            自動保存中: {currentFilePath}
          </p>
        )}
      </div>
    </div>
  );
};
