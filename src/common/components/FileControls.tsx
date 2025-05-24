import { ChangeEvent, useState } from "react";
import {
  formatDateForFilename,
  formatDateTimeLocale,
} from "../utils/formatters";
import { SectionTitle, SectionHeader } from "./Layout";
import { useAutoSave } from "../hooks/useAutoSave";
import {
  DocumentTextIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  XCircleIcon,
  FolderOpenIcon,
} from "@heroicons/react/24/outline";
import { Switch } from "@headlessui/react";
import { CosmicWatchData } from "../../shared/types";
import { parseCosmicWatchData } from "../utils/dataParser";

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
  parsedData?: CosmicWatchData | null;
}

const CommentSection = ({
  includeComments,
  setIncludeComments,
  comment,
  setComment,
}: {
  includeComments: boolean;
  setIncludeComments: (value: boolean) => void;
  comment: string;
  setComment: (comment: string) => void;
}) => (
  <div>
    <SectionHeader>
      <div className="flex items-center">
        <Switch
          id="includeComments"
          checked={includeComments}
          onChange={() => setIncludeComments(!includeComments)}
          className="group inline-flex h-6 w-11 items-center rounded-full bg-gray-200 transition data-checked:bg-blue-600 cursor-pointer"
        >
          <span className="size-4 translate-x-1 rounded-full bg-white transition group-data-checked:translate-x-6" />
        </Switch>
        <label
          htmlFor="includeComments"
          className="select-none cursor-pointer ml-2"
        >
          コメントを含める
        </label>
      </div>
    </SectionHeader>

    <div>
      <textarea
        id="additionalComment"
        className={`block w-full px-3 py-2 border ${
          includeComments
            ? "border-gray-300 bg-white"
            : "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
        } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out`}
        rows={3}
        value={comment}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
          setComment(e.target.value)
        }
        placeholder="測定条件などのコメント（ファイル先頭に#付きで挿入されます）"
        disabled={!includeComments}
      />
    </div>
  </div>
);

const FilenameSection = ({
  suffix,
  setSuffix,
}: {
  suffix: string;
  setSuffix: (suffix: string) => void;
}) => (
  <div className="pt-4 border-t border-gray-200">
    <SectionHeader>
      <div className="flex items-center">
        <Cog6ToothIcon className="h-5 w-5 mr-1 text-gray-500" />
        ファイル名設定
      </div>
    </SectionHeader>
    <div>
      <label
        htmlFor="filenameSuffix"
        className="block text-sm text-gray-600 mb-1"
      >
        ファイル名末尾に追加するテキスト
      </label>
      <input
        id="filenameSuffix"
        type="text"
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
        value={suffix}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setSuffix(e.target.value)
        }
        placeholder="例: test1 (ファイル名の末尾に追加)"
      />
    </div>
  </div>
);

const AutoSaveSection = ({
  isEnabled,
  setIsEnabled,
  saveDirectory,
  currentFilePath,
  measurementStartTime,
  onSelectDirectory,
}: {
  isEnabled: boolean;
  setIsEnabled: (value: boolean) => void;
  saveDirectory: string;
  currentFilePath: string | null;
  measurementStartTime: Date | null;
  onSelectDirectory: () => void;
}) => (
  <div className="pt-4 border-t border-gray-200">
    <SectionHeader>
      <div className="flex items-center">
        {isEnabled ? (
          <CheckCircleIcon className="h-5 w-5 mr-1 text-green-500" />
        ) : (
          <XCircleIcon className="h-5 w-5 mr-1 text-gray-400" />
        )}
        <input
          id="autoSave"
          type="checkbox"
          checked={isEnabled}
          onChange={(e) => setIsEnabled(e.target.checked)}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2 cursor-pointer"
        />
        <label htmlFor="autoSave" className="select-none cursor-pointer">
          自動保存設定
        </label>
      </div>
    </SectionHeader>

    <div>
      <label
        htmlFor="saveDirectory"
        className={`block text-sm mb-1 ${
          isEnabled ? "text-gray-600" : "text-gray-400"
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
            isEnabled
              ? "bg-gray-100"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          placeholder={isEnabled ? "フォルダを選択..." : "自動保存が無効です"}
          disabled={!isEnabled}
        />
        <button
          onClick={onSelectDirectory}
          className={`flex-shrink-0 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out ${
            isEnabled ? "text-gray-700" : "text-gray-400 cursor-not-allowed"
          }`}
          disabled={!isEnabled}
        >
          <div className="flex items-center">
            <FolderOpenIcon className="h-4 w-4 mr-1" />
            変更
          </div>
        </button>
      </div>
    </div>
    <div className="mt-2">
      {currentFilePath && isEnabled && (
        <p className="text-xs text-green-700 font-medium">
          自動保存中:{" "}
          <span className="font-normal text-gray-600 break-all">
            {currentFilePath}
          </span>
        </p>
      )}
      {!isEnabled && (
        <p className="text-xs text-gray-500 font-medium">
          自動保存は無効です。
        </p>
      )}
      {isEnabled && !currentFilePath && measurementStartTime && (
        <p className="text-xs text-yellow-600 font-medium">
          ファイル作成待機中...
        </p>
      )}
      {isEnabled && !measurementStartTime && (
        <p className="text-xs text-gray-500 font-medium">
          接続後に自動保存が開始されます。
        </p>
      )}
    </div>
  </div>
);

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
  parsedData,
}: FileControlsProps) => {
  const [includeComments, setIncludeComments] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);

  const { saveDirectory, currentFilePath, selectSaveDirectory, setEnabled } =
    useAutoSave({
      isDesktop,
      enabled: autoSaveEnabled,
      measurementStartTime,
      additionalComment,
      filenameSuffix,
      latestRawData,
      parsedData: parsedData ?? null,
      onFileHandleChange: setFileHandle,
    });

  const handleAutoSaveToggle = (isChecked: boolean) => {
    setAutoSaveEnabled(isChecked);
    setEnabled(isChecked);
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

    const processedData = filteredData.map((line) => {
      if (line.trim().startsWith("#")) {
        return line;
      }

      const parsedLineData = parseCosmicWatchData(line);

      if (parsedLineData) {
        const fields: (string | number)[] = [];

        fields.push(parsedLineData.event);

        if (parsedLineData.date) {
          fields.push(parsedLineData.date);
        }

        if (parsedLineData.time !== undefined) {
          fields.push(parsedLineData.time);
        }

        fields.push(parsedLineData.adc);
        fields.push(parsedLineData.sipm);
        fields.push(parsedLineData.deadtime);
        fields.push(parsedLineData.temp);

        if (parsedLineData.hum !== undefined) {
          fields.push(parsedLineData.hum);
        }
        if (parsedLineData.press !== undefined) {
          fields.push(parsedLineData.press);
        }

        return fields.join("\t");
      } else {
        if (line.includes("\t")) {
          return line;
        }
        return line.replace(/\s+/g, "\t");
      }
    });

    content += processedData.join("\n");

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
    <div>
      <SectionTitle>
        <div className="flex items-center">
          <DocumentTextIcon className="h-6 w-6 mr-2 text-gray-600" />
          ファイル設定
        </div>
      </SectionTitle>

      <div className="space-y-6">
        <CommentSection
          includeComments={includeComments}
          setIncludeComments={setIncludeComments}
          comment={additionalComment}
          setComment={setAdditionalComment}
        />

        <FilenameSection
          suffix={filenameSuffix}
          setSuffix={setFilenameSuffix}
        />

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleDownload}
            disabled={rawData.length === 0 || !measurementStartTime}
            className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-[2px_2px_8px_rgba(0,0,0,0.15)] text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-1" />
            データをダウンロード (.dat)
          </button>
          <p className="text-xs text-gray-500 mt-1 text-center">
            現在の全測定データをファイルとして保存します。
          </p>
        </div>

        {isDesktop && (
          <AutoSaveSection
            isEnabled={autoSaveEnabled}
            setIsEnabled={handleAutoSaveToggle}
            saveDirectory={saveDirectory}
            currentFilePath={currentFilePath}
            measurementStartTime={measurementStartTime}
            onSelectDirectory={selectSaveDirectory}
          />
        )}
      </div>
    </div>
  );
};
