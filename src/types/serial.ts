export interface SerialData {
  eventNumber: number;
  timeMs: number;
  adc: number;
  sipmMv: number;
  deadtimeMs: number;
  temperatureC: number;
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
