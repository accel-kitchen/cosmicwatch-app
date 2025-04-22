import { ChangeEvent, useState } from "react";

interface FileControlsProps {
  rawData: string[];
}

export const FileControls = ({ rawData }: FileControlsProps) => {
  const [additionalComment, setAdditionalComment] = useState<string>("");
  const [filenameSuffix, setFilenameSuffix] = useState<string>("");
  const [startTime] = useState<Date>(new Date()); // コンポーネントマウント時の時刻を保持

  const formatDateForFilename = (date: Date) => {
    return date
      .toLocaleString("ja-JP", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Tokyo",
      })
      .replace(/[\s/:]|年|月|日/g, "-")
      .replace(/時|分|秒/g, "");
  };

  const handleDownload = () => {
    // コメント行の作成
    const comments = [
      "# CosmicWatch Data",
      `# Measurement Start: ${startTime.toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
      })}`,
      ...additionalComment
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => `# ${line}`),
    ].join("\n");

    // ファイルの内容を作成
    const content = [comments, ...rawData].join("\n");

    // ファイル名の生成
    const timestamp = formatDateForFilename(startTime);
    const suffix = filenameSuffix ? `_${filenameSuffix}` : "";
    const filename = `${timestamp}${suffix}.dat`;

    // ダウンロード処理
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
          disabled={rawData.length === 0}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          データをダウンロード
        </button>
      </div>
    </div>
  );
};
