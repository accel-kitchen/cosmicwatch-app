import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FileSettingsState {
  comment: string;
  suffix: string;
  includeComments: boolean;
  autoSavePath: string | null;
  autoSaveEnabled: boolean;
  saveDirectory: string;
}

const initialState: FileSettingsState = {
  comment: "",
  suffix: "",
  includeComments: false,
  autoSavePath: null,
  autoSaveEnabled: true,
  saveDirectory: "",
};

const fileSettingsSlice = createSlice({
  name: "fileSettings",
  initialState,
  reducers: {
    setComment: (state, action: PayloadAction<string>) => {
      state.comment = action.payload;
    },

    setSuffix: (state, action: PayloadAction<string>) => {
      state.suffix = action.payload;
    },

    setIncludeComments: (state, action: PayloadAction<boolean>) => {
      state.includeComments = action.payload;
    },

    setAutoSavePath: (state, action: PayloadAction<string | null>) => {
      state.autoSavePath = action.payload;
    },

    setAutoSaveEnabled: (state, action: PayloadAction<boolean>) => {
      state.autoSaveEnabled = action.payload;
      // 無効にした場合はパスもクリア
      if (!action.payload) {
        state.autoSavePath = null;
      }
    },

    setSaveDirectory: (state, action: PayloadAction<string>) => {
      state.saveDirectory = action.payload;
    },

    resetFileSettings: (state) => {
      state.comment = "";
      state.suffix = "";
      state.includeComments = false;
      state.autoSavePath = null;
      // autoSaveEnabled と saveDirectory は保持
    },
  },
});

export const {
  setComment,
  setSuffix,
  setIncludeComments,
  setAutoSavePath,
  setAutoSaveEnabled,
  setSaveDirectory,
  resetFileSettings,
} = fileSettingsSlice.actions;

export default fileSettingsSlice.reducer;
