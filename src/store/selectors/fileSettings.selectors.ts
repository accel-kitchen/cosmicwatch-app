import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../index";
import { FileSettingsState } from "../slices/fileSettingsSlice";

// =============================================================================
// 基本セレクター
// =============================================================================

export const selectFileSettings = (state: RootState): FileSettingsState =>
  state.fileSettings;

// =============================================================================
// 計算セレクター
// =============================================================================

export const selectAutoSaveSettings = createSelector(
  [selectFileSettings],
  (fileSettings) => ({
    enabled: fileSettings.autoSaveEnabled,
    path: fileSettings.autoSavePath,
    directory: fileSettings.saveDirectory,
  })
);

// AutoSave用（簡略化）
export const selectAutoSaveData = createSelector(
  [selectFileSettings],
  (fileSettings) => ({ fileSettings })
);
