import { useCallback, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  connectSerialPort,
  reconnectSerialPort,
  disconnectSerialPort,
  clearError,
} from "../../store/slices/serialPortSlice";
import { selectConnectionStatus } from "../../store/selectors";

// デバッグログ用フラグ
const DEBUG = false;

const log = (...args: any[]) => {
  if (DEBUG) {
    console.log("[useSerialPort]", ...args);
  }
};

/**
 * シリアルポート通信を管理するフック（createAsyncThunk統一版）
 */
export const useSerialPort = (onDataReceived: (data: string) => void) => {
  // Redux hooks
  const dispatch = useAppDispatch();
  const connectionStatus = useAppSelector(selectConnectionStatus);

  // ローカル状態（非シリアライズ可能オブジェクト）
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const writerRef = useRef<WritableStreamDefaultWriter | null>(null);
  const lastConnectedPortRef = useRef<SerialPort | null>(null);
  const cleanupRef = useRef(false);

  /**
   * シリアルポートを開いて接続する
   */
  const connect = useCallback(async () => {
    log("connect関数が呼び出されました");
    log("現在の接続状態:", {
      isConnected: connectionStatus.isConnected,
      isConnecting: connectionStatus.isConnecting,
    });

    if (connectionStatus.isConnected || connectionStatus.isConnecting) {
      log("既に接続中または接続済みのため、処理をスキップします");
      return;
    }

    cleanupRef.current = false;

    // Web Serial APIサポートチェック
    if (!navigator.serial) {
      throw new Error("このブラウザはWebSerial APIに対応していません");
    }

    let port: SerialPort;
    let portInfo: SerialPortInfo;

    try {
      // ユーザージェスチャーが必要なAPIを即座に呼び出す（他の処理を挟まない）
      // Bluetoothデバイスを除外してUSBシリアルポートのみを表示
      log("navigator.serial.requestPort()を呼び出します...");
      const requestOptions = {
        filters: [
          // USBシリアルデバイスのみを対象とする
          { usbVendorId: 0x2341 }, // Arduino
          { usbVendorId: 0x1a86 }, // CH340/CH341 (よく使われるUSB-シリアル変換チップ)
          { usbVendorId: 0x0403 }, // FTDI
          { usbVendorId: 0x10c4 }, // Silicon Labs CP210x
          { usbVendorId: 0x067b }, // Prolific
        ],
      };

      try {
        // まずフィルター付きで試行
        port = await navigator.serial.requestPort(requestOptions);
        log("ポート選択完了（フィルター付き）:", port);
      } catch (filteredError) {
        // ユーザーキャンセルの場合は再試行しない
        if (
          filteredError instanceof Error &&
          filteredError.name === "NotFoundError"
        ) {
          log("ユーザーがポート選択をキャンセル（フィルター付き）");
          throw filteredError;
        }

        log(
          "フィルター付きポート選択失敗、フィルターなしで再試行:",
          filteredError
        );
        // フィルター付きで失敗した場合、フィルターなしで再試行
        port = await navigator.serial.requestPort();
        log("ポート選択完了（フィルターなし）:", port);
      }

      portInfo = port.getInfo();
      log("ポート情報:", portInfo);
    } catch (error) {
      log("ポート選択エラー:", error);
      // ポート選択のエラーは即座に再スロー
      throw error;
    }

    try {
      // ポート選択後の処理（ユーザージェスチャー不要）
      const serialOptions = {
        baudRate: 9600,
        dataBits: 8 as const,
        stopBits: 1 as const,
        parity: "none" as const,
        bufferSize: 255,
      };

      log("ポートを開きます...", serialOptions);
      await port.open(serialOptions);
      log("ポートが開かれました");

      await new Promise((resolve) => setTimeout(resolve, 100));
      log("100ms待機完了");

      if (!port.readable || !port.writable) {
        throw new Error("ポートの読み取り/書き込みストリームが利用できません");
      }

      log("ストリームを取得します...");
      const reader = port.readable.getReader();
      const writer = port.writable.getWriter();
      log("ストリーム取得完了");

      // ローカル参照を更新
      portRef.current = port;
      readerRef.current = reader;
      writerRef.current = writer;
      lastConnectedPortRef.current = port;
      log("ローカル参照を更新しました");

      // createAsyncThunkで状態のみ更新
      log("createAsyncThunkで状態を更新します...");
      await dispatch(
        connectSerialPort({
          portInfo: portInfo,
        })
      ).unwrap();

      log("接続完了 - createAsyncThunkで状態管理済み");
      log("データ読み取りループを開始...");
      readLoop(reader, new TextDecoder());
    } catch (error) {
      log("接続処理エラー:", error);
      // ポートが開かれている場合はクローズ
      if (port) {
        try {
          await port.close();
        } catch (closeError) {
          log("ポートクローズエラー:", closeError);
        }
      }
      // エラーの詳細情報も出力
      if (error instanceof Error) {
        log("エラー名:", error.name);
        log("エラーメッセージ:", error.message);
        log("エラースタック:", error.stack);
      }
      // エラーを上位に再スロー
      throw error;
    }
  }, [connectionStatus.isConnected, connectionStatus.isConnecting, dispatch]);

  /**
   * 最後に接続したポートに再接続する
   */
  const reconnect = useCallback(async () => {
    if (
      connectionStatus.isConnected ||
      connectionStatus.isConnecting ||
      !connectionStatus.hasLastConnectedPort ||
      !lastConnectedPortRef.current
    ) {
      log("再接続できません");
      return;
    }

    cleanupRef.current = false;

    try {
      const port = lastConnectedPortRef.current;
      if (!port) {
        throw new Error("前回の接続ポートが見つかりません");
      }

      // デフォルト設定でポートを再開
      const serialOptions = {
        baudRate: 9600,
        dataBits: 8 as const,
        stopBits: 1 as const,
        parity: "none" as const,
        bufferSize: 255,
      };

      // ポートが閉じている場合のみ開く
      if (!port.readable || !port.writable) {
        await port.open(serialOptions);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!port.readable || !port.writable) {
        throw new Error("ポートの読み取り/書き込みストリームが利用できません");
      }

      const reader = port.readable.getReader();
      const writer = port.writable.getWriter();

      // ローカル参照を更新
      portRef.current = port;
      readerRef.current = reader;
      writerRef.current = writer;

      // createAsyncThunkで状態のみ更新
      await dispatch(
        reconnectSerialPort({
          portInfo: port.getInfo(),
        })
      ).unwrap();

      log("再接続完了 - createAsyncThunkで状態管理済み");
      log("データ読み取りループを開始...");
      readLoop(reader, new TextDecoder());
    } catch (error) {
      log("再接続エラー:", error);
      // エラーを上位に再スロー
      throw error;
    }
  }, [
    connectionStatus.isConnected,
    connectionStatus.isConnecting,
    connectionStatus.hasLastConnectedPort,
    dispatch,
  ]);

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
          const chunk = decoder.decode(value, { stream: true });
          log("データ受信:", chunk);
          buffer += chunk;

          const lines = buffer.split(/\r?\n/);
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim()) {
              try {
                // コールバックでデータ処理を委譲（重複処理を回避）
                onDataReceived(line);
              } catch (err) {
                log("行の処理中にエラーが発生:", err);
              }
            }
          }
        }
      }
    } catch (error) {
      if (!cleanupRef.current) {
        log("データ読み取り中にエラー:", error);
        // 読み取りエラーが発生した場合は切断処理を実行
        disconnect();
      }
    } finally {
      log("読み取りループを終了しました");
    }
  };

  /**
   * シリアルポートを切断する
   */
  const disconnect = useCallback(async () => {
    if (!connectionStatus.isConnected) {
      log("既に切断されています");
      return;
    }

    cleanupRef.current = true;

    try {
      // createAsyncThunkで切断処理を実行
      await dispatch(
        disconnectSerialPort({
          port: portRef.current || undefined,
          reader: readerRef.current || undefined,
          writer: writerRef.current || undefined,
        })
      ).unwrap();

      // ローカル参照をクリア
      portRef.current = null;
      readerRef.current = null;
      writerRef.current = null;

      log("切断が完了しました - ローカル参照もクリアしました");
    } catch (error) {
      log("切断エラー:", error);
    }
  }, [connectionStatus.isConnected, dispatch]);

  /**
   * エラーをクリアする
   */
  const clearConnectionError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      cleanupRef.current = true;
    };
  }, []);

  return {
    isConnected: connectionStatus.isConnected,
    isConnecting: connectionStatus.isConnecting,
    isDisconnecting: connectionStatus.isDisconnecting,
    error: connectionStatus.error,
    portInfo: connectionStatus.portInfo,
    hasLastConnectedPort: connectionStatus.hasLastConnectedPort,
    connect,
    disconnect,
    reconnect,
    clearError: clearConnectionError,
  };
};
