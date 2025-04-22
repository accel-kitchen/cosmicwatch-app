import { ChangeEvent, useState, useEffect, useCallback } from "react";
import { path } from "@tauri-apps/api";
import { open } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { downloadDir } from "@tauri-apps/api/path";
import {
  formatDateForFilename,
  formatDateTimeLocale,
} from "../utils/formatters";
// import { writeFile } from "@tauri-apps/api/fs";

// デバッグ用ログ関数
const logDebug = (...args: any[]) =>
  console.log("[FileControlsDesktop]", ...args);

interface FileControlsDesktopProps {
  measurementStartTime: Date | null;
  setFileHandle: (path: string | null) => void;
  latestRawData: string | null;
}

export const FileControlsDesktop = ({
  measurementStartTime,
  setFileHandle,
  latestRawData,
}: FileControlsDesktopProps) => {
  const [additionalComment, setAdditionalComment] = useState<string>("");
  const [filenameSuffix, setFilenameSuffix] = useState<string>("");
  const [saveDirectory, setSaveDirectory] = useState<string>("");
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isFileCreated, setIsFileCreated] = useState<boolean>(false);

  useEffect(() => {
    const setDefaultPath = async () => {
      try {
        logDebug(
          "Attempting to get download directory for auto-save default..."
        );
        const dir = await downloadDir();
        logDebug("Default save directory set to:", dir);
        setSaveDirectory(dir);
      } catch (error) {
        console.error("Failed to get download directory:", error);
      }
    };
    setDefaultPath();
  }, []);

  useEffect(() => {
    if (
      measurementStartTime &&
      autoSaveEnabled &&
      saveDirectory &&
      !isFileCreated
    ) {
      logDebug("Conditions met: Starting file creation logic...");

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
          const autoSaveSuffix = currentFilenameSuffix
            ? `_${currentFilenameSuffix}`
            : "";
          const filename = `${startTimestamp}${autoSaveSuffix}_autosave.dat`;
          const fullPath = await path.join(saveDirectory, filename);

          logDebug("Attempting to write/overwrite file:", fullPath);
          await writeTextFile(fullPath, comments, { append: false });
          logDebug("File created/overwritten successfully:", fullPath);

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
      logDebug(
        "Measurement stopped/cleared, resetting file path and created flag."
      );
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
    additionalComment,
    filenameSuffix,
  ]);

  useEffect(() => {
    const appendData = async () => {
      if (
        autoSaveEnabled &&
        currentFilePath &&
        latestRawData &&
        isFileCreated
      ) {
        logDebug("Attempting to append data to:", currentFilePath);
        try {
          await writeTextFile(currentFilePath, latestRawData + "\n", {
            append: true,
          });
          logDebug("Successfully appended data.");
        } catch (error) {
          console.error("Failed to append data:", error);
          logDebug("Error during append, clearing file path and created flag.");
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

  const handleSelectCustomPath = async () => {
    try {
      const selected = await open({ directory: true, multiple: false });
      if (selected && typeof selected === "string") {
        logDebug("Custom auto-save directory selected:", selected);
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
                logDebug(
                  "Auto save disabled by user, clearing file path and created flag."
                );
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
