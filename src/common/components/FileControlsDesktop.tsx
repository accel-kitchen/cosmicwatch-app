import { ChangeEvent, useState } from "react";
import { path } from "@tauri-apps/api";
import { open } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
// import { downloadDir } from "@tauri-apps/plugin-path";
// import { writeFile } from "@tauri-apps/api/fs";

interface FileControlsDesktopProps {
  rawData: string[];
}

export const FileControlsDesktop = ({ rawData }: FileControlsDesktopProps) => {
  const [additionalComment, setAdditionalComment] = useState<string>("");
  const [filenameSuffix, setFilenameSuffix] = useState<string>("");
  const [customSavePath, setCustomSavePath] = useState<string>("");
  const [startTime] = useState<Date>(new Date());

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

  // 通常のダウンロード（ダウンロードフォルダへ）
  const handleDownload = async () => {
    try {
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

      const content = [comments, ...rawData].join("\n");
      const timestamp = formatDateForFilename(startTime);
      const suffix = filenameSuffix ? `_${filenameSuffix}` : "";
      const filename = `${timestamp}${suffix}.dat`;

      // ダウンロードディレクトリを取得
      const downloadPath = await path.downloadDir();
      if (!downloadPath) {
        console.error("Could not determine download directory.");
        return; // ダウンロードディレクトリが取得できなければ処理中断
      }
      // 完全なパスを作成
      const fullPath = await path.join(downloadPath, filename);

      // ファイルに書き込み
      await writeTextFile(fullPath, content);
      console.log("File saved to downloads:", fullPath);
    } catch (error) {
      console.error("Failed to save to downloads:", error);
    }
  };

  // フォルダ選択ダイアログを開く
  const handleSelectCustomPath = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
      });

      if (selected && typeof selected === "string") {
        setCustomSavePath(selected);
        console.log("Selected directory:", selected);
      }
    } catch (error) {
      console.error("Failed to select directory:", error);
    }
  };

  // ファイル保存処理
  const handleSaveToCustomPath = async () => {
    if (!customSavePath) return;

    try {
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

      const content = [comments, ...rawData].join("\n");
      const timestamp = formatDateForFilename(startTime);
      const suffix = filenameSuffix ? `_${filenameSuffix}` : "";
      const filename = `${timestamp}${suffix}.dat`;

      // パスを結合してファイルを保存
      const fullPath = await path.join(customSavePath, filename);
      await writeTextFile(fullPath, content);
      console.log("File saved:", fullPath);
    } catch (error) {
      console.error("Failed to save file:", error);
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

      <div className="flex flex-col gap-4">
        {/* ダウンロードフォルダへの保存 */}
        <div>
          <button
            onClick={handleDownload}
            disabled={rawData.length === 0}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            ダウンロードフォルダに保存
          </button>
        </div>

        {/* カスタム保存先への保存 */}
        <div className="border-t pt-4">
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              value={customSavePath}
              readOnly
              placeholder="保存先フォルダを選択..."
            />
            <button
              onClick={handleSelectCustomPath}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              フォルダ選択
            </button>
          </div>
          <button
            onClick={handleSaveToCustomPath}
            disabled={!customSavePath || rawData.length === 0}
            className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            選択したフォルダに保存
          </button>
        </div>
      </div>
    </div>
  );
};
