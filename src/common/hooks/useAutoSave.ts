import { useState, useEffect } from "react";
import { path } from "@tauri-apps/api";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { downloadDir } from "@tauri-apps/api/path";
import {
  formatDateForFilename,
  formatDateTimeLocale,
} from "../utils/formatters";

interface AutoSaveOptions {
  isDesktop: boolean;
  enabled: boolean;
  measurementStartTime: Date | null;
  additionalComment: string;
  filenameSuffix: string;
  latestRawData: string | null;
  onFileHandleChange: (path: string | null) => void;
}

export function useAutoSave({
  isDesktop,
  enabled,
  measurementStartTime,
  additionalComment,
  filenameSuffix,
  latestRawData,
  onFileHandleChange,
}: AutoSaveOptions) {
  const [saveDirectory, setSaveDirectory] = useState<string>("");
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isFileCreated, setIsFileCreated] = useState<boolean>(false);

  // デスクトップ環境の場合、初期保存先を設定
  useEffect(() => {
    if (isDesktop) {
      const setDefaultPath = async () => {
        try {
          const dir = await downloadDir();
          setSaveDirectory(dir);
        } catch (error) {
          console.error("Failed to get download directory:", error);
        }
      };
      setDefaultPath();
    }
  }, [isDesktop]);

  // 測定開始時にファイルを作成
  useEffect(() => {
    if (
      isDesktop &&
      measurementStartTime &&
      enabled &&
      saveDirectory &&
      !isFileCreated
    ) {
      const createAndWrite = async () => {
        try {
          // ファイルヘッダーコメントを生成
          const comments =
            [
              "# CosmicWatch Data",
              `# Measurement Start: ${formatDateTimeLocale(
                measurementStartTime
              )}`,
              ...additionalComment
                .split("\n")
                .filter((line) => line.trim())
                .map((line) => `# ${line}`),
            ].join("\n") + "\n";

          // ファイル名を生成
          const startTimestamp = formatDateForFilename(measurementStartTime);
          const autoSaveSuffix = filenameSuffix ? `_${filenameSuffix}` : "";
          const filename = `${startTimestamp}${autoSaveSuffix}.dat`;
          const fullPath = await path.join(saveDirectory, filename);

          // ファイルを作成し、ヘッダーを書き込む
          await writeTextFile(fullPath, comments, { append: false });
          console.log("[AutoSave] File created:", fullPath);

          // 状態を更新
          setCurrentFilePath(fullPath);
          onFileHandleChange(fullPath);
          setIsFileCreated(true);
        } catch (error) {
          console.error("Failed to create auto-save file:", error);
          resetState();
        }
      };
      createAndWrite();
    } else if (isDesktop && !measurementStartTime && isFileCreated) {
      resetState();
    }
  }, [
    isDesktop,
    measurementStartTime,
    enabled,
    saveDirectory,
    isFileCreated,
    additionalComment,
    filenameSuffix,
    onFileHandleChange,
  ]);

  // 新しいデータを受信した際に追記
  useEffect(() => {
    if (
      isDesktop &&
      enabled &&
      currentFilePath &&
      latestRawData &&
      isFileCreated
    ) {
      const appendData = async () => {
        try {
          await writeTextFile(currentFilePath, latestRawData + "\n", {
            append: true,
          });
        } catch (error) {
          console.error("Failed to append data:", error);
          resetState();
        }
      };
      appendData();
    }
  }, [isDesktop, latestRawData, enabled, currentFilePath, isFileCreated]);

  // 状態をリセットする関数
  const resetState = () => {
    setCurrentFilePath(null);
    onFileHandleChange(null);
    setIsFileCreated(false);
  };

  // ディレクトリ選択ハンドラ
  const selectSaveDirectory = async () => {
    if (!isDesktop) return;

    try {
      // Tauriのダイアログを使用してディレクトリを選択
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true, multiple: false });

      if (selected && typeof selected === "string") {
        setSaveDirectory(selected);
        resetState();
      }
    } catch (error) {
      console.error("Failed to select directory:", error);
    }
  };

  return {
    saveDirectory,
    currentFilePath,
    isFileCreated,
    selectSaveDirectory,
    setEnabled: (value: boolean) => {
      if (!value) resetState();
    },
  };
}
