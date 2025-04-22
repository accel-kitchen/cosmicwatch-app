export interface CosmicWatchData {
  event: number;
  date?: string;
  time?: number;
  totaltime?: number;
  adc: number;
  sipm: number;
  deadtime: number;
  temp: number;
  hum?: number;
  press?: number;
}

export interface SerialPortConfig {
  isMaster: boolean;
  portNumber: string;
}

export interface SerialOptions {
  baudRate: number;
  dataBits: 8;
  stopBits: 1;
  parity: "none";
  bufferSize: number;
}

export interface SerialPortState {
  port: SerialPort | null;
  reader: ReadableStreamDefaultReader | null;
  writer: WritableStreamDefaultWriter | null;
  isConnected: boolean;
  error: string | null;
}

export type SerialDataCallback = (data: string) => void;
