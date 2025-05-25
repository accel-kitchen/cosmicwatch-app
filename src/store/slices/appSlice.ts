import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import {
  PlatformService,
  createPlatformService,
} from "../../common/services/PlatformService";

interface AppState {
  isDesktop: boolean;
  platformService: PlatformService | null;
  isDemoMode: boolean;
  isInitialized: boolean;
  initializationError: string | null;
  isLoading: boolean;
}

const initialState: AppState = {
  isDesktop: false,
  platformService: null,
  isDemoMode: false,
  isInitialized: false,
  initializationError: null,
  isLoading: false,
};

// 非同期アクション: プラットフォームサービス初期化
export const initializePlatformService = createAsyncThunk(
  "app/initializePlatformService",
  async (_, { rejectWithValue }) => {
    try {
      const service = await createPlatformService();
      const isDesktop = service.isDesktop();

      console.log(
        "実行環境:",
        isDesktop ? "デスクトップアプリ (Tauri)" : "Webブラウザ"
      );

      return { service, isDesktop };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : String(error)
      );
    }
  }
);

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    // 手動設定用（後方互換性のため保持）
    setPlatformService: (state, action: PayloadAction<PlatformService>) => {
      state.platformService = action.payload;
      state.isDesktop = action.payload.isDesktop();
      state.isInitialized = true;
      state.initializationError = null;
    },

    setDemoMode: (state, action: PayloadAction<boolean>) => {
      state.isDemoMode = action.payload;
    },

    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.isInitialized = action.payload;
    },

    clearInitializationError: (state) => {
      state.initializationError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializePlatformService.pending, (state) => {
        state.isLoading = true;
        state.isInitialized = false;
        state.initializationError = null;
      })
      .addCase(initializePlatformService.fulfilled, (state, action) => {
        state.isLoading = false;
        state.platformService = action.payload.service;
        state.isDesktop = action.payload.isDesktop;
        state.isInitialized = true;
        state.initializationError = null;
      })
      .addCase(initializePlatformService.rejected, (state, action) => {
        state.isLoading = false;
        state.isInitialized = false;
        state.initializationError = action.payload as string;
      });
  },
});

export const {
  setPlatformService,
  setDemoMode,
  setInitialized,
  clearInitializationError,
} = appSlice.actions;

export default appSlice.reducer;
