import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./index";
import { MeasurementState } from "./slices/measurementSlice";
import { FileSettingsState } from "./slices/fileSettingsSlice";
import { SerialPortState } from "./slices/serialPortSlice";

// =============================================================================
// ユーティリティ関数
// =============================================================================

/**
 * 現在時刻を秒単位で取得（Redux selector安定化のため）
 * ミリ秒を切り捨てることで、同一秒内での不要な再計算を防ぐ
 */
const getStableCurrentTime = (): Date => {
  const nowInSeconds = Math.floor(Date.now() / 1000) * 1000;
  return new Date(nowInSeconds);
};

// =============================================================================
// 基本セレクター（直接state参照）
// =============================================================================

export const selectMeasurementData = (state: RootState): MeasurementState =>
  state.measurement;

export const selectRawData = (state: RootState): string[] =>
  state.measurement.rawData;

export const selectParsedData = (state: RootState) =>
  state.measurement.parsedData;

export const selectFileSettings = (state: RootState): FileSettingsState =>
  state.fileSettings;

export const selectAppState = (state: RootState) => state.app;

export const selectSerialPortState = (state: RootState): SerialPortState =>
  state.serialPort;

// =============================================================================
// 計算セレクター（createSelectorでメモ化）
// =============================================================================

// 時刻関連
export const selectMeasurementTimes = createSelector(
  [selectMeasurementData],
  (measurement) => ({
    startTime: measurement.startTime ? new Date(measurement.startTime) : null,
    endTime: measurement.endTime ? new Date(measurement.endTime) : null,
    startTimeISO: measurement.startTime,
    endTimeISO: measurement.endTime,
  })
);

export const selectLatestData = createSelector(
  [selectMeasurementData],
  (measurement) => ({
    rawData: measurement.latestRawData,
    parsedData: measurement.latestParsedData,
  })
);

// データ関連
export const selectDisplayData = createSelector(
  [selectParsedData],
  (parsedData) => parsedData.slice(-100)
);

export const selectCanDownload = createSelector(
  [selectRawData],
  (rawData) => rawData.length > 0
);

// 測定状態関連
export const selectIsRecording = createSelector(
  [selectMeasurementTimes],
  ({ startTime, endTime }) => startTime !== null && endTime === null
);

export const selectMeasurementDuration = createSelector(
  [selectMeasurementTimes],
  ({ startTime, endTime }) => {
    if (!startTime) return 0;
    const end = endTime || getStableCurrentTime();
    return Math.floor((end.getTime() - startTime.getTime()) / 1000);
  }
);

// 統計情報
export const selectStatistics = createSelector(
  [selectMeasurementData, selectMeasurementTimes],
  (measurement, times) => {
    const { statistics } = measurement;
    const { startTime, endTime } = times;

    // イベントレート計算
    let eventRate = 0;
    if (startTime && statistics.totalEvents > 0) {
      const endTimeForCalc = endTime || getStableCurrentTime();
      const durationSeconds =
        (endTimeForCalc.getTime() - startTime.getTime()) / 1000;
      if (durationSeconds > 0) {
        eventRate = statistics.totalEvents / durationSeconds;
      }
    }

    return {
      totalEvents: statistics.totalEvents,
      averageADC:
        statistics.totalEvents > 0
          ? statistics.totalADC / statistics.totalEvents
          : 0,
      averageSiPM:
        statistics.totalEvents > 0
          ? statistics.totalSiPM / statistics.totalEvents
          : 0,
      eventRate,
      lastUpdated: statistics.lastCalculatedAt,
    };
  }
);

// 設定関連
export const selectAutoSaveSettings = createSelector(
  [selectFileSettings],
  (fileSettings) => ({
    enabled: fileSettings.autoSaveEnabled,
    path: fileSettings.autoSavePath,
    directory: fileSettings.saveDirectory,
  })
);

export const selectPlatformInfo = createSelector(
  [selectAppState],
  (appState) => ({
    isDesktop: appState.isDesktop,
    platformService: appState.platformService,
    isInitialized: appState.isInitialized,
    isDemoMode: appState.isDemoMode,
    initializationError: appState.initializationError,
  })
);

export const selectConnectionStatus = createSelector(
  [selectSerialPortState],
  (serialPort) => ({
    isConnected: serialPort.isConnected,
    isConnecting: serialPort.isConnecting,
    isDisconnecting: serialPort.isDisconnecting,
    error: serialPort.error,
    portInfo: serialPort.portInfo,
    hasLastConnectedPort: serialPort.hasLastConnectedPort,
    connectionId: serialPort.connectionId,
  })
);

// ヒストグラム用データ
export const selectHistogramData = createSelector(
  [selectParsedData],
  (parsedData) => ({
    adcValues: parsedData.map((d) => d.adc),
    sipmValues: parsedData.map((d) => d.sipm),
    timestamps: parsedData.map((d) => d.pcTimestamp).filter(Boolean),
  })
);

// エラー状態
export const selectErrorStates = createSelector(
  [selectAppState, selectSerialPortState],
  (appState, serialPortState) => ({
    initializationError: appState.initializationError,
    serialPortError: serialPortState.error,
    hasAnyError: !!(appState.initializationError || serialPortState.error),
  })
);

// 非同期処理状態
export const selectAsyncStates = createSelector(
  [
    (state: RootState) => state.app.isLoading,
    (state: RootState) => state.serialPort.isConnecting,
    (state: RootState) => state.serialPort.isDisconnecting,
  ],
  (appLoading, serialConnecting, serialDisconnecting) => ({
    isAppLoading: appLoading,
    isSerialConnecting: serialConnecting,
    isSerialDisconnecting: serialDisconnecting,
    isAnyLoading: appLoading || serialConnecting || serialDisconnecting,
  })
);

// =============================================================================
// 統合セレクター（コンポーネント用最適化）
// =============================================================================

// App.tsx用
export const selectAppData = createSelector(
  [selectMeasurementData, selectPlatformInfo, selectLatestData],
  (measurementData, platformInfo, latestData) => ({
    measurementData,
    platformInfo,
    latestData,
  })
);

// SerialConnection用
export const selectSerialConnectionData = createSelector(
  [selectConnectionStatus, selectStatistics, selectIsRecording],
  (connectionStatus, statistics, isRecording) => ({
    connectionStatus,
    statistics,
    isRecording,
  })
);

// FileControls用
export const selectFileControlsData = createSelector(
  [
    selectFileSettings,
    selectAutoSaveSettings,
    selectCanDownload,
    selectMeasurementTimes,
  ],
  (fileSettings, autoSaveSettings, canDownload, measurementTimes) => ({
    fileSettings,
    autoSaveSettings,
    canDownload,
    measurementTimes,
  })
);

// DataHistograms用
export const selectDataHistogramsData = createSelector(
  [
    selectParsedData,
    selectHistogramData,
    selectMeasurementTimes,
    selectStatistics,
  ],
  (parsedData, histogramData, measurementTimes, statistics) => ({
    parsedData,
    histogramData,
    measurementTimes,
    statistics,
  })
);

// DataTable用
export const selectDataTableData = createSelector(
  [selectDisplayData],
  (displayData) => ({
    displayData,
    hasData: displayData.length > 0,
    sampleData: displayData[0] || null,
  })
);

// =============================================================================
// 特殊用途セレクター
// =============================================================================

// ページネーション対応
export const selectPaginatedData = createSelector(
  [
    selectParsedData,
    (_state: RootState, page: number, pageSize: number) => ({ page, pageSize }),
  ],
  (parsedData, { page, pageSize }) => {
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    return {
      data: parsedData.slice(startIndex, endIndex),
      totalCount: parsedData.length,
      hasMore: endIndex < parsedData.length,
    };
  }
);

// AutoSave用（簡略化）
export const selectAutoSaveData = createSelector(
  [selectFileSettings],
  (fileSettings) => ({ fileSettings })
);
