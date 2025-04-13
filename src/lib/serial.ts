import { SerialData, SerialConfig } from "../types/serial";

export class SerialHandler {
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private config: SerialConfig | null = null;
  private dataCallback: (data: SerialData) => void;

  constructor(dataCallback: (data: SerialData) => void) {
    this.dataCallback = dataCallback;
  }

  async connect() {
    try {
      if (!("serial" in navigator)) {
        throw new Error("Web Serial APIがサポートされていません");
      }
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 9600 });
      this.startReading();
    } catch (error) {
      console.error("シリアル通信の接続に失敗しました:", error);
      throw error;
    }
  }

  private async startReading() {
    if (!this.port) return;
    if (!this.port.readable) return;

    const decoder = new TextDecoder();
    let buffer = "";
    const reader = this.port.readable.getReader();
    this.reader = reader;

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("### Signal threshold:")) {
            this.config = {
              signalThreshold: parseInt(line.split(":")[1].trim()),
              resetThreshold: parseInt(
                lines[lines.indexOf(line) + 1].split(":")[1].trim()
              ),
            };
          } else if (
            /^\d+\s+\d+\s+\d+\s+\d+\.\d+\s+\d+\s+\d+\.\d+$/.test(line.trim())
          ) {
            const [eventNumber, timeMs, adc, sipmMv, deadtimeMs, temperatureC] =
              line.trim().split(/\s+/).map(Number);
            this.dataCallback({
              event: eventNumber,
              totaltime: timeMs,
              adc,
              sipm: sipmMv,
              deadtime: deadtimeMs,
              temperature: temperatureC,
            });
          }
        }
      }
    } catch (error) {
      console.error("シリアル通信の読み取り中にエラーが発生しました:", error);
    } finally {
      reader.releaseLock();
      this.reader = null;
    }
  }

  async disconnect() {
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }
    if (this.port) {
      await this.port.close();
      this.port = null;
    }
  }
}
