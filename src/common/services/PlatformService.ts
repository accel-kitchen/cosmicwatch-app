/**
 * プラットフォーム固有の操作を抽象化するインターフェース
 */
export interface PlatformService {
  /**
   * プラットフォームがデスクトップアプリかどうかを判定（同期的）
   */
  isDesktop(): boolean;

  /**
   * ファイルを保存する
   */
  saveFile(content: string, filename: string): Promise<void>;

  /**
   * ディレクトリを選択する
   */
  selectDirectory(): Promise<string | null>;

  /**
   * 指定されたパスにファイルを書き込む（デスクトップ版のみ）
   */
  writeFile(
    path: string,
    content: string,
    options?: { append?: boolean }
  ): Promise<void>;

  /**
   * パスを結合する（デスクトップ版のみ）
   */
  joinPath(...paths: string[]): Promise<string>;

  /**
   * デフォルトのダウンロードディレクトリを取得（デスクトップ版のみ）
   */
  getDownloadDirectory(): Promise<string>;
}

/**
 * Web版のプラットフォームサービス実装
 */
export class WebPlatformService implements PlatformService {
  isDesktop(): boolean {
    return false;
  }

  async saveFile(content: string, filename: string): Promise<void> {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async selectDirectory(): Promise<string | null> {
    // Web版では実装不可
    throw new Error("Directory selection is not supported in web version");
  }

  async writeFile(
    _path: string,
    _content: string,
    _options?: { append?: boolean }
  ): Promise<void> {
    // Web版では実装不可
    throw new Error("File writing is not supported in web version");
  }

  async joinPath(..._paths: string[]): Promise<string> {
    // Web版では実装不可
    throw new Error("Path joining is not supported in web version");
  }

  async getDownloadDirectory(): Promise<string> {
    // Web版では実装不可
    throw new Error(
      "Download directory access is not supported in web version"
    );
  }
}

/**
 * Tauri（デスクトップ）版のプラットフォームサービス実装
 */
export class TauriPlatformService implements PlatformService {
  isDesktop(): boolean {
    return true;
  }

  async saveFile(content: string, filename: string): Promise<void> {
    // デスクトップ版では通常のファイル保存ダイアログを使用
    console.log("TauriPlatformService.saveFile called:", {
      filename,
      contentLength: content.length,
    });

    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");

    console.log("Opening save dialog...");
    const filePath = await save({
      defaultPath: filename,
      filters: [
        {
          name: "Data files",
          extensions: ["dat"],
        },
        {
          name: "All files",
          extensions: ["*"],
        },
      ],
    });

    console.log("Save dialog result:", filePath);

    if (filePath) {
      console.log("Writing file to:", filePath);
      await writeTextFile(filePath, content);
      console.log("File write completed successfully");
    } else {
      console.log("User cancelled save dialog");
    }
  }

  async selectDirectory(): Promise<string | null> {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({ directory: true, multiple: false });
    return typeof selected === "string" ? selected : null;
  }

  async writeFile(
    path: string,
    content: string,
    options?: { append?: boolean }
  ): Promise<void> {
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    await writeTextFile(path, content, { append: options?.append || false });
  }

  async joinPath(...paths: string[]): Promise<string> {
    const { path } = await import("@tauri-apps/api");
    return await path.join(...paths);
  }

  async getDownloadDirectory(): Promise<string> {
    const { downloadDir } = await import("@tauri-apps/api/path");
    return await downloadDir();
  }
}

/**
 * プラットフォームサービスのファクトリー関数
 */
export async function createPlatformService(): Promise<PlatformService> {
  try {
    // Tauriが利用可能かチェック（元の実装に戻す）
    const { getVersion } = await import("@tauri-apps/api/app");
    await getVersion();
    console.log("Running as Tauri desktop app");
    return new TauriPlatformService();
  } catch (error) {
    // Tauriが利用できない場合はWeb版を使用
    console.log("Running as web app");
  }

  return new WebPlatformService();
}
