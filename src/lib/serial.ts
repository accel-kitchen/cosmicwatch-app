import { SerialData, SerialConfig } from "../types/serial";

export class SerialHandler {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader | null = null;
  private config: SerialConfig | null = null;
  private dataCallback: (data: SerialData) => void;

  constructor(dataCallback: (data: SerialData) => void) {
    this.dataCallback = dataCallback;
  }

  async connect() {
    try {
      console.log("シリアルポートへの接続を開始します...");
      this.port = await navigator.serial.requestPort();
      console.log("シリアルポートを選択しました:", this.port);

      await this.port.open({ baudRate: 9600 });
      console.log("シリアルポートを開きました");

      this.startReading();
    } catch (error) {
      console.error("シリアルポートへの接続に失敗しました:", error);
      throw error;
    }
  }

  private async startReading() {
    if (!this.port) {
      console.error("シリアルポートが開かれていません");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    this.reader = this.port.readable.getReader();
    console.log("シリアル通信の読み取りを開始しました");

    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) {
          console.log("シリアル通信の読み取りが完了しました");
          break;
        }

        const decoded = decoder.decode(value, { stream: true });
        console.log("受信した生データ:", decoded);

        buffer += decoded;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        console.log("バッファ内の行数:", lines.length);
        console.log("残りのバッファ:", buffer);

        for (const line of lines) {
          console.log("処理中の行:", line);

          if (line.startsWith("### Signal threshold:")) {
            console.log("設定情報を検出しました");
            this.config = {
              signalThreshold: parseInt(line.split(":")[1].trim()),
              resetThreshold: parseInt(
                lines[lines.indexOf(line) + 1].split(":")[1].trim()
              ),
            };
            console.log("設定を更新しました:", this.config);
          } else if (
            /^\d+\s+\d+\s+\d+\s+\d+\.\d+\s+\d+\s+\d+\.\d+$/.test(line)
          ) {
            console.log("データ行を検出しました");
            const [eventNumber, timeMs, adc, sipmMv, deadtimeMs, temperatureC] =
              line.split(/\s+/).map(Number);
            const data: SerialData = {
              eventNumber,
              timeMs,
              adc,
              sipmMv,
              deadtimeMs,
              temperatureC,
            };
            console.log("解析したデータ:", data);
            this.dataCallback(data);
          } else {
            console.log("未処理の行:", line);
          }
        }
      }
    } catch (error) {
      console.error("シリアル通信の読み取り中にエラーが発生しました:", error);
    } finally {
      this.reader.releaseLock();
      console.log("シリアル通信の読み取りを終了しました");
    }
  }

  async disconnect() {
    console.log("シリアル通信の切断を開始します...");
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
      console.log("リーダーを解放しました");
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
      console.log("シリアルポートを閉じました");
    }
  }
}
