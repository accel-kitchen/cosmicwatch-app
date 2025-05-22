import { useState, useCallback, useEffect, useRef } from "react";
import { SerialPortState, PortInfo } from "../../shared/types";

// シリアルポートの設定
const DEFAULT_SERIAL_OPTIONS = {
  baudRate: 9600,
  dataBits: 8 as const,
  stopBits: 1 as const,
  parity: "none" as const,
  bufferSize: 255,
};

// デバッグモード設定
const DEBUG = true;

/**
 * デバッグログ出力関数
 */
const log = (...args: any[]) => {
  if (DEBUG) {
    console.log("[SerialPort]", ...args);
  }
};

/**
 * 拡張されたシリアルポート状態の型
 */
interface SerialPortStatus extends SerialPortState {
  portInfo: PortInfo | null;
  connecting: boolean;
  disconnecting: boolean;
  lastConnectedPort: SerialPort | null; // 最後に接続したポートを追跡
}

/**
 * シリアルポート通信を管理するフック
 */
export const useSerialPort = (onDataReceived: (data: string) => void) => {
  // 状態管理
  const [status, setStatus] = useState<SerialPortStatus>({
    port: null,
    reader: null,
    writer: null,
    isConnected: false,
    error: null,
    portInfo: null,
    connecting: false,
    disconnecting: false,
    lastConnectedPort: null,
  });

  // クリーンアップフラグ参照
  const cleanupRef = useRef(false);

  /**
   * シリアルポートを開いて接続する
   */
  const connect = useCallback(async () => {
    // 既に接続中または接続処理中なら何もしない
    if (status.isConnected || status.connecting) {
      return;
    }

    setStatus((prev) => ({ ...prev, connecting: true, error: null }));
    cleanupRef.current = false;

    try {
      log("WebSerial APIの確認中...");
      if (!navigator.serial) {
        throw new Error("このブラウザはWebSerial APIに対応していません");
      }

      log("ポート選択ダイアログを表示...");
      const port = await navigator.serial.requestPort();
      const portInfo = port.getInfo();
      log("選択されたポート情報:", portInfo);

      log("ポートを開いています...", DEFAULT_SERIAL_OPTIONS);
      await port.open(DEFAULT_SERIAL_OPTIONS);
      log("ポートが正常に開かれました");

      // シリアルポートの初期化待機
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!port.readable || !port.writable) {
        throw new Error("ポートの読み取り/書き込みストリームが利用できません");
      }

      const textDecoder = new TextDecoder();
      const reader = port.readable.getReader();
      const writer = port.writable.getWriter();
      log("リーダーとライターを作成しました");

      setStatus({
        port,
        reader,
        writer,
        isConnected: true,
        error: null,
        portInfo,
        connecting: false,
        disconnecting: false,
        lastConnectedPort: port, // 最後に接続したポートを保存
      });

      log("データ読み取りループを開始...");
      readLoop(reader, textDecoder);
    } catch (error) {
      log("接続エラー:", error);
      setStatus((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "不明なエラーが発生しました",
        connecting: false,
      }));
    }
  }, [status.isConnected, status.connecting]);

  /**
   * 最後に接続したポートに再接続する
   */
  const reconnect = useCallback(async () => {
    // 既に接続中、接続処理中、または最後に接続したポートがない場合は何もしない
    if (status.isConnected || status.connecting || !status.lastConnectedPort) {
      log("再接続できません: 既に接続中か、前回の接続情報がありません");
      return;
    }

    setStatus((prev) => ({ ...prev, connecting: true, error: null }));
    cleanupRef.current = false;

    try {
      log("前回接続したポートに再接続しています...");
      const port = status.lastConnectedPort;
      const portInfo = port.getInfo();

      // ポートが閉じている場合のみ開く
      if (!port.readable || !port.writable) {
        log("ポートを開いています...", DEFAULT_SERIAL_OPTIONS);
        await port.open(DEFAULT_SERIAL_OPTIONS);
        log("ポートが正常に開かれました");

        // シリアルポートの初期化待機
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!port.readable || !port.writable) {
        throw new Error("ポートの読み取り/書き込みストリームが利用できません");
      }

      const textDecoder = new TextDecoder();
      const reader = port.readable.getReader();
      const writer = port.writable.getWriter();
      log("リーダーとライターを作成しました");

      setStatus({
        port,
        reader,
        writer,
        isConnected: true,
        error: null,
        portInfo,
        connecting: false,
        disconnecting: false,
        lastConnectedPort: port,
      });

      log("データ読み取りループを開始...");
      readLoop(reader, textDecoder);
    } catch (error) {
      log("再接続エラー:", error);
      setStatus((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "再接続中に不明なエラーが発生しました",
        connecting: false,
      }));
    }
  }, [status.isConnected, status.connecting, status.lastConnectedPort]);

  /**
   * データ読み取りループ
   */
  const readLoop = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    decoder: TextDecoder
  ) => {
    let buffer = "";
    log("読み取りループを開始しました");

    try {
      while (!cleanupRef.current) {
        const { value, done } = await reader.read();

        if (done) {
          log("読み取り完了信号を受信");
          break;
        }

        if (value) {
          // データチャンクをデコード
          const chunk = decoder.decode(value, { stream: true });
          log("データ受信:", chunk);
          buffer += chunk;

          // データを行ごとに処理
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || ""; // 最後の不完全な行を次の読み取りのために保持

          for (const line of lines) {
            if (line.trim()) {
              // 行が空でなければ処理
              try {
                // データ形式を検証し、必要に応じてコメント化
                validateAndProcessLine(line, onDataReceived);
              } catch (err) {
                log("行の処理中にエラーが発生:", err);
              }
            }
          }
        }
      }
    } catch (error) {
      if (!cleanupRef.current) {
        log("読み取りループエラー:", error);
        setStatus((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "データ読み取り中にエラーが発生しました",
        }));
      }
    } finally {
      log("読み取りループを終了しました");
      // ここではリーダーをクローズしない。disconnect内で適切に処理される
    }
  };

  /**
   * データ行の検証と処理
   */
  const validateAndProcessLine = (
    line: string,
    callback: (data: string) => void
  ) => {
    // すでにコメント行ならそのまま渡す
    if (line.startsWith("#")) {
      log("コメント行:", line);
      callback(line);
      return;
    }

    // データ形式を検証
    try {
      const parts = line.trim().split(/\s+/);
      const validFormats = [6, 7, 9]; // 有効なカラム数 (dataParser.tsに基づく)
      const isFirstColumnNumber = !isNaN(parseInt(parts[0], 10));

      if (!validFormats.includes(parts.length) || !isFirstColumnNumber) {
        // 無効なデータ形式の場合、コメント化して送信
        const commentedLine = `# Invalid format: ${line}`;
        log("無効なデータ形式、コメント化:", commentedLine);
        callback(commentedLine);
      } else {
        // 有効なデータ行はそのまま送信
        log("有効なデータ行:", line);
        callback(line);
      }
    } catch (error) {
      // パースエラーが発生した場合もコメント化
      const commentedLine = `# Parse error: ${line}`;
      log("パースエラー、コメント化:", error, commentedLine);
      callback(commentedLine);
    }
  };

  /**
   * シリアルポート接続を切断
   */
  const disconnect = useCallback(async () => {
    if (!status.isConnected || status.disconnecting) {
      return;
    }

    setStatus((prev) => ({ ...prev, disconnecting: true }));
    cleanupRef.current = true;

    try {
      log("切断処理を開始...");

      if (status.reader) {
        log("リーダーをキャンセル中");
        try {
          await status.reader.cancel();
        } catch (err) {
          log("リーダーのキャンセル中にエラー:", err);
        }
      }

      if (status.writer) {
        log("ライターをクローズ中");
        try {
          await status.writer.close();
        } catch (err) {
          log("ライターのクローズ中にエラー:", err);
        }
      }

      if (status.port) {
        log("ポートをクローズ中");
        try {
          await status.port.close();
        } catch (err) {
          log("ポートのクローズ中にエラー:", err);
        }
      }

      log("切断処理完了");
    } catch (error) {
      log("切断中にエラーが発生:", error);
    } finally {
      // 接続状態をリセット（ただし最後に接続したポートの情報は保持）
      setStatus((prev) => ({
        port: null,
        reader: null,
        writer: null,
        isConnected: false,
        error: null,
        portInfo: prev.portInfo, // ポート情報は保持
        connecting: false,
        disconnecting: false,
        lastConnectedPort: prev.lastConnectedPort, // 最後に接続したポートを保持
      }));
    }
  }, [
    status.isConnected,
    status.disconnecting,
    status.port,
    status.reader,
    status.writer,
  ]);

  // コンポーネントのアンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      if (status.isConnected) {
        log("コンポーネントのアンマウントによるクリーンアップ");
        cleanupRef.current = true;
        disconnect();
      }
    };
  }, [status.isConnected, disconnect]);

  return {
    isConnected: status.isConnected,
    isConnecting: status.connecting,
    isDisconnecting: status.disconnecting,
    error: status.error,
    portInfo: status.portInfo,
    hasLastConnectedPort: !!status.lastConnectedPort,
    connect,
    disconnect,
    reconnect,
  };
};
