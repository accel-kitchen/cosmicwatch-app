export interface SerialData {
  event: number;
  totaltime: number;
  adc: number;
  sipm: number;
  deadtime: number;
  temperature: number;
}

export interface SerialConfig {
  signalThreshold: number;
  resetThreshold: number;
}

export interface RecordingConfig {
  timeInterval?: number; // 分単位
  eventCount?: number;
  manualTrigger?: boolean;
}
