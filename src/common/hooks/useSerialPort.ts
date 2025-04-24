import { useState, useCallback, useEffect, useRef } from "react";
import { SerialPortState, PortInfo } from "../../shared/types";

const DEFAULT_OPTIONS = {
  baudRate: 9600,
  dataBits: 8 as const,
  stopBits: 1 as const,
  parity: "none" as const,
  bufferSize: 255,
};

const DEBUG = true; // デバッグモードフラグ

const log = (...args: any[]) => {
  if (DEBUG) {
    console.log("[SerialPort]", ...args);
  }
};

// SerialPortStateにportInfoを追加
interface ExtendedSerialPortState extends SerialPortState {
  portInfo: PortInfo | null;
}

export const useSerialPort = (onDataReceived: (data: string) => void) => {
  // Stateの型を拡張したものに変更
  const [state, setState] = useState<ExtendedSerialPortState>({
    port: null,
    reader: null,
    writer: null,
    isConnected: false,
    error: null,
    portInfo: null, // 初期値 null
  });

  // クリーンアップフラグを追加
  const cleanupRef = useRef(false);

  const connect = useCallback(async () => {
    try {
      log("Connecting to serial port...");
      if (!navigator.serial) {
        throw new Error("WebSerial API is not supported in this browser");
      }

      const port = await navigator.serial.requestPort();
      log("Port selected:", port);
      // ★ ポート情報を取得
      const portInfo = port.getInfo();
      log("Port info:", portInfo);

      log("Opening port with options:", DEFAULT_OPTIONS);
      await port.open(DEFAULT_OPTIONS);
      log("Port opened successfully");

      // シリアルポートの設定を待機
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (!port.readable || !port.writable) {
        throw new Error("Port readable or writable stream is null.");
      }
      const textDecoder = new TextDecoder();
      const reader = port.readable.getReader();
      const writer = port.writable.getWriter();
      log("Reader and writer created");

      setState({
        port,
        reader,
        writer,
        isConnected: true,
        error: null,
        portInfo: portInfo, // 設定
      });

      // クリーンアップフラグをリセット
      cleanupRef.current = false;

      // データ読み取りループを開始
      log("Starting read loop");
      readLoop(reader, textDecoder);
    } catch (error) {
      log("Connection error:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      }));
    }
  }, []);

  const readLoop = async (
    reader: ReadableStreamDefaultReader,
    decoder: TextDecoder
  ) => {
    try {
      let buffer = "";
      log("Read loop started");

      while (!cleanupRef.current) {
        // クリーンアップフラグをチェック
        const { value, done } = await reader.read();
        if (done) {
          log("Read loop done signal received");
          break;
        }

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          log("Received chunk:", chunk);
          buffer += chunk;

          // 改行で分割してデータを処理
          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || ""; // 最後の不完全な行を保持

          for (const line of lines) {
            if (line.trim()) {
              // コメント行（#で始まる）も含めて処理
              log("Processing line:", line);
              onDataReceived(line);
            }
          }
        }
      }
    } catch (error) {
      if (!cleanupRef.current) {
        // クリーンアップ中のエラーは無視
        log("Read loop error:", error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Error reading data",
        }));
      }
    } finally {
      log("Read loop finished.");
      // Ensure reader lock is released if loop terminates unexpectedly or normally
      // Note: reader.releaseLock() should ideally be called after reader.cancel() in disconnect
      // but placing it here handles cases where disconnect might not be called properly.
      // Consider if this placement is truly needed based on application flow.
    }
  };

  const disconnect = useCallback(async () => {
    try {
      log("Disconnecting...");
      // クリーンアップフラグを設定
      cleanupRef.current = true;

      if (state.reader) {
        log("Canceling reader");
        await state.reader
          .cancel()
          .catch((err) => log("Reader cancel error:", err));
      }
      if (state.writer) {
        log("Closing writer");
        await state.writer
          .close()
          .catch((err) => log("Writer close error:", err));
      }
      if (state.port) {
        log("Closing port");
        await state.port.close().catch((err) => log("Port close error:", err));
      }

      setState({
        port: null,
        reader: null,
        writer: null,
        isConnected: false,
        error: null,
        portInfo: null, // リセット
      });
      log("Disconnected successfully");
    } catch (error) {
      log("Disconnect error:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Error disconnecting",
      }));
    }
  }, [state.port, state.reader, state.writer]);

  // コンポーネントのアンマウント時にクリーンアップを実行
  useEffect(() => {
    return () => {
      // アンマウント時に接続されていれば切断処理を呼ぶ
      if (state.isConnected) {
        // cleanupRefの設定はdisconnect関数内で行われるため不要
        // cleanupRef.current = true;
        disconnect();
      }
    };
    // ★ disconnect と state.isConnected を依存配列に追加
  }, [disconnect, state.isConnected]);

  return {
    isConnected: state.isConnected,
    error: state.error,
    portInfo: state.portInfo,
    connect,
    disconnect,
  };
};
