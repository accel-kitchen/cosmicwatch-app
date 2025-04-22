import { useState, useCallback, useEffect, useRef } from "react";
import { SerialOptions, SerialPortState } from "../../shared/types";

const DEFAULT_OPTIONS: SerialOptions = {
  baudRate: 9600, // Arduinoのボーレートに合わせて修正
  dataBits: 8,
  stopBits: 1,
  parity: "none",
  bufferSize: 255,
};

const DEBUG = true; // デバッグモードフラグ

const log = (...args: any[]) => {
  if (DEBUG) {
    console.log("[SerialPort]", ...args);
  }
};

export const useSerialPort = (onDataReceived: (data: string) => void) => {
  const [state, setState] = useState<SerialPortState>({
    port: null,
    reader: null,
    writer: null,
    isConnected: false,
    error: null,
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

      log("Opening port with options:", DEFAULT_OPTIONS);
      await port.open(DEFAULT_OPTIONS);
      log("Port opened successfully");

      // シリアルポートの設定を待機
      await new Promise((resolve) => setTimeout(resolve, 100));

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
    }
  };

  const disconnect = useCallback(async () => {
    try {
      log("Disconnecting...");
      // クリーンアップフラグを設定
      cleanupRef.current = true;

      if (state.reader) {
        log("Canceling reader");
        await state.reader.cancel();
        await state.reader.releaseLock();
      }
      if (state.writer) {
        log("Closing writer");
        await state.writer.close();
        await state.writer.releaseLock();
      }
      if (state.port) {
        log("Closing port");
        await state.port.close();
      }

      setState({
        port: null,
        reader: null,
        writer: null,
        isConnected: false,
        error: null,
      });
      log("Disconnected successfully");
    } catch (error) {
      log("Disconnect error:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Error disconnecting",
      }));
    }
  }, [state.reader, state.writer, state.port]);

  // Master/Slave機能のための遅延開始
  const connectWithDelay = useCallback(
    async (isMaster: boolean) => {
      if (!isMaster) {
        await new Promise((resolve) => setTimeout(resolve, 100)); // 0.1秒の遅延
      }
      await connect();
    },
    [connect]
  );

  // コンポーネントのアンマウント時のみクリーンアップを実行
  useEffect(() => {
    return () => {
      cleanupRef.current = true;
      disconnect();
    };
  }, []); // 依存配列を空にして、アンマウント時のみ実行

  return {
    isConnected: state.isConnected,
    error: state.error,
    connect,
    connectWithDelay,
    disconnect,
  };
};
