import { ChangeEvent } from "react";
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
}

export const FileControls = ({
  rawData,
  measurementStartTime,
  measurementEndTime,
  additionalComment,
  setAdditionalComment,
  filenameSuffix,
  setFilenameSuffix,
}: FileControlsProps) => {
  const handleDownload = () => {
    if (!measurementStartTime) return;

    const endTime = measurementEndTime ?? new Date();

    const comments = [
      "# CosmicWatch Data",
      `# Measurement Start: ${formatDateTimeLocale(measurementStartTime)}`,
      `# Measurement End: ${formatDateTimeLocale(endTime)}`,
      ...additionalComment
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => `# ${line}`),
    ].join("\n");

    const content = [comments, ...rawData].join("\n");

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
    <div className="space-y-4 bg-white rounded-lg shadow p-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          追加コメント
        </label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filenameSuffix}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setFilenameSuffix(e.target.value)
          }
          placeholder="例: test1"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          disabled={rawData.length === 0 || !measurementStartTime}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          データをダウンロード
        </button>
      </div>
    </div>
  );
};
