import { configureStore } from "@reduxjs/toolkit";
import measurementReducer from "./slices/measurementSlice";
import fileSettingsReducer from "./slices/fileSettingsSlice";
import appReducer from "./slices/appSlice";
import serialPortReducer from "./slices/serialPortSlice";

export const store = configureStore({
  reducer: {
    measurement: measurementReducer,
    fileSettings: fileSettingsReducer,
    app: appReducer,
    serialPort: serialPortReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // PlatformService などの非シリアライズ可能な値を許可
        ignoredActions: [
          "app/setPlatformService",
          "app/initializePlatformService/fulfilled",
        ],
        ignoredPaths: [
          "app.platformService",
          // 時刻フィールドは現在ISO文字列なので除外不要
        ],
      },
      // パフォーマンス最適化: 大量データ処理時の最適化
      immutableCheck: {
        // 大量データ配列の不変性チェックを軽量化（メモリ効率向上）
        ignoredPaths: ["measurement.rawData", "measurement.parsedData"],
        // 大量データ時のチェック頻度を制限
        warnAfter: 128, // デフォルト32から増加
      },
    }),
  // 開発環境でのみRedux DevToolsを有効化
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
