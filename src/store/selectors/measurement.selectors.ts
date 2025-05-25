import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../index";
import { MeasurementState } from "../slices/measurementSlice";
import {
  getStableCurrentTime,
  safeAverage,
  calculateDurationInSeconds,
} from "./utils";

// =============================================================================
// 基本セレクター
// =============================================================================

export const selectMeasurementData = (state: RootState): MeasurementState =>
  state.measurement;

export const selectRawData = (state: RootState): string[] =>
  state.measurement.rawData;

export const selectParsedData = (state: RootState) =>
  state.measurement.parsedData;

// =============================================================================
// 計算セレクター
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
  ({ startTime, endTime }) => calculateDurationInSeconds(startTime, endTime)
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
      const durationSeconds = calculateDurationInSeconds(startTime, endTime);
      if (durationSeconds > 0) {
        eventRate = statistics.totalEvents / durationSeconds;
      }
    }

    return {
      totalEvents: statistics.totalEvents,
      averageADC: safeAverage(statistics.totalADC, statistics.totalEvents),
      averageSiPM: safeAverage(statistics.totalSiPM, statistics.totalEvents),
      eventRate,
      lastUpdated: statistics.lastCalculatedAt,
    };
  }
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
