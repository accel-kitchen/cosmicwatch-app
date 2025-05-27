import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../index";

// 他のselectorファイルからimport
import {
  selectMeasurementData,
  selectLatestData,
  selectParsedData,
  selectDisplayData,
  selectHistogramData,
  selectMeasurementTimes,
  selectStatistics,
  selectCanDownload,
  selectIsRecording,
} from "./measurement.selectors";
import { selectConnectionStatus } from "./serialPort.selectors";
import {
  selectFileSettings,
  selectAutoSaveSettings,
} from "./fileSettings.selectors";
import { selectPlatformInfo, selectAppState } from "./app.selectors";
import { selectSerialPortState } from "./serialPort.selectors";

// =============================================================================
// エラー状態統合
// =============================================================================

export const selectErrorStates = createSelector(
  [selectAppState, selectSerialPortState],
  (appState, serialPortState) => ({
    initializationError: appState.initializationError,
    serialPortError: serialPortState.error,
    hasAnyError: !!(appState.initializationError || serialPortState.error),
  })
);

// 全非同期処理状態統合
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
// コンポーネント用統合セレクター
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
