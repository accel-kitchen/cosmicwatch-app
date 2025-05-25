import { useState, useEffect, useRef } from "react";
import {
  formatDateForFilename,
  formatDateTimeLocale,
} from "../utils/formatters";
import { CosmicWatchData } from "../../shared/types";
import { CosmicWatchDataService } from "../services/CosmicWatchDataService";
import { PlatformService } from "../services/PlatformService";

interface AutoSaveOptions {
  isDesktop: boolean;
  enabled: boolean;
  measurementStartTime: Date | null;
  additionalComment: string;
  filenameSuffix: string;
  latestRawData: string | null;
  parsedData: CosmicWatchData | null;
  onFileHandleChange: (path: string | null) => void;
  includeComments: boolean;
  platformService: PlatformService | null;
}

export function useAutoSave({
  isDesktop,
  enabled,
  measurementStartTime,
  additionalComment,
  filenameSuffix,
  latestRawData,
  parsedData,
  onFileHandleChange,
  includeComments,
  platformService,
}: AutoSaveOptions) {
  const [saveDirectory, setSaveDirectory] = useState<string>("");
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isFileCreated, setIsFileCreated] = useState<boolean>(false);

  // 記録開始時のコメント設定を保存（測定中は変更されない）
  const initialIncludeCommentsRef = useRef<boolean | null>(null);

  // デスクトップ環境の場合、初期保存先を設定
  useEffect(() => {
    if (isDesktop && platformService) {
      const setDefaultPath = async () => {
        try {
          const dir = await platformService.getDownloadDirectory();
          setSaveDirectory(dir);
        } catch (error) {
          console.error("Failed to get download directory:", error);
        }
      };
      setDefaultPath();
    }
  }, [isDesktop, platformService]);

  // 測定開始時にファイルを作成
  useEffect(() => {
    if (
      isDesktop &&
      measurementStartTime &&
      enabled &&
      saveDirectory &&
      !isFileCreated &&
      platformService
    ) {
      const createAndWrite = async () => {
        try {
          // 記録開始時のコメント設定を保存
          initialIncludeCommentsRef.current = includeComments;

          let content = "";

          // 記録開始時のincludeComments設定に基づいてコメントを追加
          if (includeComments) {
            const comments = [
              "# CosmicWatch Data",
              `# Measurement Start: ${formatDateTimeLocale(
                measurementStartTime
              )}`,
              ...additionalComment
                .split("\n")
                .filter((line) => line.trim())
                .map((line) => `# ${line}`),
            ].join("\n");
            content = comments + "\n";
          }

          // ファイル名を生成
          const startTimestamp = formatDateForFilename(measurementStartTime);
          const autoSaveSuffix = filenameSuffix ? `_${filenameSuffix}` : "";
          const filename = `${startTimestamp}${autoSaveSuffix}.dat`;
          const fullPath = await platformService.joinPath(
            saveDirectory,
            filename
          );

          // ファイルを作成し、ヘッダーを書き込む
          await platformService.writeFile(fullPath, content, { append: false });
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
    platformService,
    // includeCommentsは依存関係から除外（記録開始時のみ使用）
  ]);

  // 新しいデータを受信した際に追記
  useEffect(() => {
    if (
      isDesktop &&
      enabled &&
      currentFilePath &&
      latestRawData &&
      isFileCreated &&
      initialIncludeCommentsRef.current !== null &&
      platformService
    ) {
      const appendData = async () => {
        try {
          // 記録開始時のコメント設定に基づいて処理
          const shouldIncludeComments = initialIncludeCommentsRef.current;

          // コメント行の処理を記録開始時の設定に基づいて制御
          if (latestRawData.trim().startsWith("#") && !shouldIncludeComments) {
            // コメントを含めない設定の場合、コメント行はスキップ
            return;
          }

          let dataToWrite = "";

          if (parsedData) {
            // パース成功の場合：新しいサービスクラスを使用
            dataToWrite = CosmicWatchDataService.formatDataForFile(parsedData);
          } else {
            // パース失敗の場合：新しいサービスクラスを使用
            dataToWrite =
              CosmicWatchDataService.formatRawDataForFile(latestRawData);
          }

          await platformService.writeFile(currentFilePath, dataToWrite + "\n", {
            append: true,
          });
        } catch (error) {
          console.error("Failed to append data:", error);
          resetState();
        }
      };
      appendData();
    }
  }, [
    isDesktop,
    latestRawData,
    parsedData,
    enabled,
    currentFilePath,
    isFileCreated,
    platformService,
    // includeCommentsは依存関係から除外（記録開始時の設定を使用）
  ]);

  // 状態をリセットする関数
  const resetState = () => {
    setCurrentFilePath(null);
    onFileHandleChange(null);
    setIsFileCreated(false);
    initialIncludeCommentsRef.current = null; // コメント設定もリセット
  };

  // ディレクトリ選択ハンドラ
  const selectSaveDirectory = async () => {
    if (!isDesktop || !platformService) return;

    try {
      const selected = await platformService.selectDirectory();
      if (selected) {
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
