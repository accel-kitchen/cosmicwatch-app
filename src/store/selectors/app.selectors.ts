import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../index";

// =============================================================================
// 基本セレクター
// =============================================================================

export const selectAppState = (state: RootState) => state.app;

// =============================================================================
// 計算セレクター
// =============================================================================

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

// 非同期処理状態（アプリ関連のみ）
export const selectAppAsyncStates = createSelector(
  [selectAppState],
  (appState) => ({
    isAppLoading: appState.isLoading,
  })
);
