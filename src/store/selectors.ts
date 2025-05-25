import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "./index";
import { MeasurementState } from "./slices/measurementSlice";
import { FileSettingsState } from "./slices/fileSettingsSlice";
import { SerialPortState } from "./slices/serialPortSlice";

// 基本selectors
export const selectMeasurementData = (state: RootState): MeasurementState =>
  state.measurement;
export const selectRawData = (state: RootState): string[] =>
  state.measurement.rawData;
export const selectParsedData = (state: RootState) =>
  state.measurement.parsedData;

// 時刻関連のselector（ISO文字列からDateオブジェクトに変換）
export const selectMeasurementTimes = createSelector(
  [selectMeasurementData],
  (measurement) => ({
    startTime: measurement.startTime ? new Date(measurement.startTime) : null,
    endTime: measurement.endTime ? new Date(measurement.endTime) : null,
    startTimeISO: measurement.startTime,
    endTimeISO: measurement.endTime,
  })
);

export const selectLatestData = (state: RootState) => ({
  rawData: state.measurement.latestRawData,
  parsedData: state.measurement.latestParsedData,
});

// 表示用データ（最新100件）- メモ化で最適化
export const selectDisplayData = createSelector(
  [selectParsedData],
  (parsedData) => parsedData.slice(-100)
);

// ファイル設定関連のselectors
export const selectFileSettings = (state: RootState): FileSettingsState =>
  state.fileSettings;
export const selectAutoSaveSettings = createSelector(
  [selectFileSettings],
  (fileSettings) => ({
    enabled: fileSettings.autoSaveEnabled,
    path: fileSettings.autoSavePath,
    directory: fileSettings.saveDirectory,
  })
);

// アプリケーション設定関連のselectors
export const selectAppState = (state: RootState) => state.app;
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

// シリアルポート関連のselectors - 新しい構造に対応
export const selectSerialPortState = (state: RootState): SerialPortState =>
  state.serialPort;
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

// 統計情報selectors（キャッシュされた値を使用）- 最適化済み
export const selectStatistics = createSelector(
  [selectMeasurementData, selectMeasurementTimes],
  (measurement, times) => {
    const { statistics } = measurement;
    const { startTime, endTime } = times;

    // イベントレートを計算
    let eventRate = 0;
    if (startTime && statistics.totalEvents > 0) {
      const endTimeForCalc = endTime || new Date();
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

// 便利なselectors
export const selectCanDownload = createSelector(
  [selectRawData],
  (rawData) => rawData.length > 0
);

export const selectIsRecording = createSelector(
  [selectMeasurementTimes],
  ({ startTime, endTime }) => startTime !== null && endTime === null
);

export const selectMeasurementDuration = createSelector(
  [selectMeasurementTimes],
  ({ startTime, endTime }) => {
    if (!startTime) return 0;
    const end = endTime || new Date();
    return Math.floor((end.getTime() - startTime.getTime()) / 1000);
  }
);

// App.tsx用の統合selector（再レンダリング最適化）
export const selectAppData = createSelector(
  [selectMeasurementData, selectPlatformInfo, selectLatestData],
  (measurementData, platformInfo, latestData) => ({
    measurementData,
    platformInfo,
    latestData,
  })
);

// SerialConnection用の統合selector（最適化）
export const selectSerialConnectionData = createSelector(
  [selectConnectionStatus, selectStatistics, selectIsRecording],
  (connectionStatus, statistics, isRecording) => ({
    connectionStatus,
    statistics,
    isRecording,
  })
);

// FileControls用の統合selector（最適化）
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

// ヒストグラム用データ - 最適化
export const selectHistogramData = createSelector(
  [selectParsedData],
  (parsedData) => ({
    adcValues: parsedData.map((d) => d.adc),
    sipmValues: parsedData.map((d) => d.sipm),
    timestamps: parsedData.map((d) => d.pcTimestamp).filter(Boolean),
  })
);

// DataHistograms用の統合selector（最適化）
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

// エラー状態の統合selector
export const selectErrorStates = createSelector(
  [selectAppState, selectSerialPortState],
  (appState, serialPortState) => ({
    initializationError: appState.initializationError,
    serialPortError: serialPortState.error,
    hasAnyError: !!(appState.initializationError || serialPortState.error),
  })
);

// メモリ効率化：大量データ用のページネーション対応selector
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

// useAutoSave用の統合selector
export const selectAutoSaveData = createSelector(
  [selectFileSettings],
  (fileSettings) => ({
    fileSettings,
  })
);

// DataTable用の統合selector（パフォーマンス最適化）
export const selectDataTableData = createSelector(
  [selectDisplayData],
  (displayData) => ({
    displayData,
    hasData: displayData.length > 0,
    sampleData: displayData[0] || null,
  })
);

// 非同期処理状態用統合selector（createAsyncThunk統一アーキテクチャ対応）
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
