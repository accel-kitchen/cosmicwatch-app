import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { CosmicWatchData } from "../../shared/types";

// 非同期アクション: データ処理
export const processSerialData = createAsyncThunk(
  "measurement/processData",
  async (
    params: {
      rawData: string;
      parseFunction: (data: string) => CosmicWatchData | null;
    },
    { rejectWithValue }
  ) => {
    try {
      const { rawData, parseFunction } = params;
      const parsedData = parseFunction(rawData);

      return {
        rawData,
        parsedData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : String(error)
      );
    }
  }
);

// 非同期アクション: 測定開始
export const startMeasurement = createAsyncThunk(
  "measurement/start",
  async (_, { rejectWithValue }) => {
    try {
      const startTime = new Date().toISOString();
      return { startTime };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : String(error)
      );
    }
  }
);

// 非同期アクション: 測定終了
export const stopMeasurement = createAsyncThunk(
  "measurement/stop",
  async (_, { rejectWithValue }) => {
    try {
      const endTime = new Date().toISOString();
      return { endTime };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : String(error)
      );
    }
  }
);

export interface MeasurementState {
  rawData: string[];
  parsedData: CosmicWatchData[]; // 全データを保持（allParsedDataを統合）
  startTime: string | null; // ISO文字列に変更
  endTime: string | null; // ISO文字列に変更
  latestRawData: string | null;
  latestParsedData: CosmicWatchData | null;
  // 統計情報をキャッシュ
  statistics: {
    totalEvents: number;
    totalADC: number;
    totalSiPM: number;
    lastCalculatedAt: number; // タイムスタンプ
  };
}

const initialState: MeasurementState = {
  rawData: [],
  parsedData: [],
  startTime: null,
  endTime: null,
  latestRawData: null,
  latestParsedData: null,
  statistics: {
    totalEvents: 0,
    totalADC: 0,
    totalSiPM: 0,
    lastCalculatedAt: 0,
  },
};

const measurementSlice = createSlice({
  name: "measurement",
  initialState,
  reducers: {
    // 【統一アーキテクチャ】データ処理は processSerialData createAsyncThunk を使用してください

    clearData: (state) => {
      state.rawData = [];
      state.parsedData = [];
      state.startTime = null;
      state.endTime = null;
      state.latestRawData = null;
      state.latestParsedData = null;
      state.statistics = {
        totalEvents: 0,
        totalADC: 0,
        totalSiPM: 0,
        lastCalculatedAt: 0,
      };
    },

    // 統計情報の再計算（必要に応じて）
    recalculateStatistics: (state) => {
      const totalEvents = state.parsedData.length;
      const totalADC = state.parsedData.reduce(
        (sum, data) => sum + data.adc,
        0
      );
      const totalSiPM = state.parsedData.reduce(
        (sum, data) => sum + data.sipm,
        0
      );

      state.statistics = {
        totalEvents,
        totalADC,
        totalSiPM,
        lastCalculatedAt: Date.now(),
      };
    },
  },
  extraReducers: (builder) => {
    // processSerialData
    builder.addCase(processSerialData.fulfilled, (state, action) => {
      const { rawData, parsedData, timestamp } = action.payload;

      // 生データを追加
      state.rawData.push(rawData);
      state.latestRawData = rawData;

      // パース済みデータがある場合は追加
      if (parsedData) {
        state.parsedData.push(parsedData);
        state.latestParsedData = parsedData;

        // 統計情報を更新
        state.statistics.totalEvents += 1;
        state.statistics.totalADC += parsedData.adc;
        state.statistics.totalSiPM += parsedData.sipm;
        state.statistics.lastCalculatedAt = Date.now();
      }

      // 開始時刻を設定（初回データ受信時）
      if (!state.startTime) {
        state.startTime = timestamp;
      }

      // 終了時刻をリセット（データ受信中）
      state.endTime = null;
    });

    // startMeasurement
    builder.addCase(startMeasurement.fulfilled, (state, action) => {
      state.startTime = action.payload.startTime;
      state.endTime = null;
    });

    // stopMeasurement
    builder.addCase(stopMeasurement.fulfilled, (state, action) => {
      state.endTime = action.payload.endTime;
    });
  },
});

export const { clearData, recalculateStatistics } = measurementSlice.actions;

export default measurementSlice.reducer;
