import { ChangeEvent, useState, useEffect } from "react";
import { path } from "@tauri-apps/api";
import { open } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import { downloadDir } from "@tauri-apps/api/path";
import {
  formatDateForFilename,
  formatDateTimeLocale,
} from "../utils/formatters";

interface FileControlsProps {
  rawData: string[];
  measurementStartTime: Date | null;
  measurementEndTime: Date | null;
  additionalComment: string;
  setAdditionalComment: (comment: string) => void;
  filenameSuffix: string;
  setFilenameSuffix: (suffix: string) => void;
  isDesktop: boolean;
  setFileHandle: (path: string | null) => void;
  latestRawData: string | null;
}

export const FileControls = ({
  rawData,
  measurementStartTime,
  measurementEndTime,
  additionalComment,
  setAdditionalComment,
  filenameSuffix,
  setFilenameSuffix,
  isDesktop,
  setFileHandle,
  latestRawData,
}: FileControlsProps) => {
  const [saveDirectory, setSaveDirectory] = useState<string>("");
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [isFileCreated, setIsFileCreated] = useState<boolean>(false);
  const [includeComments, setIncludeComments] = useState(false);

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

  useEffect(() => {
    if (
      isDesktop &&
      measurementStartTime &&
      autoSaveEnabled &&
      saveDirectory &&
      !isFileCreated
    ) {
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
          const filename = `${startTimestamp}${autoSaveSuffix}.dat`;

          const fullPath = await path.join(saveDirectory, filename);

          await writeTextFile(fullPath, comments, { append: false });
          console.log(
            "[FileControls] Auto-save file created/overwritten:",
            fullPath
          );

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
    } else if (isDesktop && !measurementStartTime && isFileCreated) {
      setCurrentFilePath(null);
      setFileHandle(null);
      setIsFileCreated(false);
    }
  }, [
    isDesktop,
    measurementStartTime,
    autoSaveEnabled,
    saveDirectory,
    isFileCreated,
    setFileHandle,
    additionalComment,
    filenameSuffix,
  ]);

  useEffect(() => {
    if (
      isDesktop &&
      autoSaveEnabled &&
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
          setCurrentFilePath(null);
          setFileHandle(null);
          setIsFileCreated(false);
        }
      };
      appendData();
    }
  }, [
    isDesktop,
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
        setSaveDirectory(selected);
        setCurrentFilePath(null);
        setFileHandle(null);
        setIsFileCreated(false);
      }
    } catch (error) {
      console.error("Failed to select directory:", error);
    }
  };

  const handleDownload = () => {
    if (!measurementStartTime) return;
    const endTime = measurementEndTime ?? new Date();

    let content = "";

    if (includeComments) {
      const comments = [
        "# CosmicWatch Data",
        `# Measurement Start: ${formatDateTimeLocale(measurementStartTime)}`,
        `# Measurement End: ${formatDateTimeLocale(endTime)}`,
        ...additionalComment
          .split("\n")
          .filter((line) => line.trim())
          .map((line) => `# ${line}`),
      ].join("\n");
      content = comments + "\n";
    }

    const filteredData = rawData.filter(
      (line) => includeComments || !line.trim().startsWith("#")
    );

    content += filteredData.join("\n");

    const startTimestamp = formatDateForFilename(measurementStartTime);
    const endTimestamp = formatDateForFilename(endTime);
    const suffix = filenameSuffix ? `_${filenameSuffix}` : "";
    const filename = `${startTimestamp}-${endTimestamp}${suffix}.dat`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-5">
      <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">
        ファイル設定・保存
      </h2>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="includeComments"
          checked={includeComments}
          onChange={(e) => setIncludeComments(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2 cursor-pointer"
        />
        <label
          htmlFor="includeComments"
          className="text-sm font-medium text-gray-700 select-none cursor-pointer"
        >
          コメントを含める
        </label>
      </div>
      <div>
        <label
          htmlFor="additionalComment"
          className={`block text-sm font-medium ${
            includeComments ? "text-gray-700" : "text-gray-400"
          } mb-1`}
        >
          追加コメント
        </label>
        <textarea
          id="additionalComment"
          className={`block w-full px-3 py-2 border ${
            includeComments
              ? "border-gray-300 bg-white"
              : "border-gray-200 bg-gray-100"
          } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out`}
          rows={3}
          value={additionalComment}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
            setAdditionalComment(e.target.value)
          }
          placeholder="測定条件などのコメント（ファイル先頭に#付きで挿入されます）"
          disabled={!includeComments}
        />
      </div>

      <div>
        <label
          htmlFor="filenameSuffix"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          ファイル名に追加する情報
        </label>
        <input
          id="filenameSuffix"
          type="text"
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
          value={filenameSuffix}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setFilenameSuffix(e.target.value)
          }
          placeholder="例: test1 (ファイル名の末尾に追加)"
        />
      </div>

      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleDownload}
          disabled={rawData.length === 0 || !measurementStartTime}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
        >
          データをダウンロード
        </button>
        <p className="text-xs text-gray-500 mt-1 text-center">
          現在の全測定データをファイルとして保存します。
        </p>
      </div>

      {isDesktop && (
        <div className="border-t pt-4 mt-4 space-y-3">
          <h3 className="text-lg font-medium text-gray-800 mb-3">
            自動保存設定 (デスクトップ)
          </h3>
          <div className="flex items-center">
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
              接続時に自動でファイルを作成し追記する (有効/無効)
            </label>
          </div>
          <div>
            <label
              htmlFor="saveDirectory"
              className={`block text-sm font-medium mb-1 ${
                autoSaveEnabled ? "text-gray-700" : "text-gray-400"
              }`}
            >
              自動保存先フォルダ
            </label>
            <div className="flex items-center gap-2">
              <input
                id="saveDirectory"
                type="text"
                value={saveDirectory}
                readOnly
                className={`flex-grow block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm ${
                  autoSaveEnabled
                    ? "bg-gray-100"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
                placeholder={
                  autoSaveEnabled ? "フォルダを選択..." : "自動保存が無効です"
                }
                disabled={!autoSaveEnabled}
              />
              <button
                onClick={handleSelectCustomPath}
                className={`flex-shrink-0 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out ${
                  autoSaveEnabled
                    ? "text-gray-700"
                    : "text-gray-400 cursor-not-allowed"
                }`}
                disabled={!autoSaveEnabled}
              >
                変更
              </button>
            </div>
          </div>
          <div className="mt-2">
            {currentFilePath && autoSaveEnabled && (
              <p className="text-xs text-green-700 font-medium">
                自動保存中:{" "}
                <span className="font-normal text-gray-600 break-all">
                  {currentFilePath}
                </span>
              </p>
            )}
            {!autoSaveEnabled && (
              <p className="text-xs text-gray-500 font-medium">
                自動保存は無効です。
              </p>
            )}
            {autoSaveEnabled && !currentFilePath && measurementStartTime && (
              <p className="text-xs text-yellow-600 font-medium">
                ファイル作成待機中...
              </p>
            )}
            {autoSaveEnabled && !measurementStartTime && (
              <p className="text-xs text-gray-500 font-medium">
                接続後に自動保存が開始されます。
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
