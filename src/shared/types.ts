export interface CosmicWatchData {
  event: number;
  date?: string;
  time?: number;
  adc: number;
  sipm: number;
  deadtime: number;
  temp: number;
  hum?: number;
  press?: number;
  pcTimestamp?: string;
}

export interface SerialPortConfig {
  isMaster: boolean;
  portNumber: string;
}

export interface SerialOptions {
  baudRate: number;
  dataBits: number;
  stopBits: number;
  parity: ParityType;
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

export interface PortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}
