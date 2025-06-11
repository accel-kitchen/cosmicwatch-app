# CosmicWatch Redux統一アーキテクチャ

## 🎯 アーキテクチャ原則

### **createAsyncThunk中心の統一設計**
全ての非同期処理とRedux状態管理は`createAsyncThunk`で統一されています。

## 📋 実装パターン

### **1. 非同期処理の定義**
```typescript
export const someAsyncAction = createAsyncThunk(
  "slice/actionName",
  async (params, { rejectWithValue }) => {
    try {
      // 非同期処理
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

### **2. 状態管理（extraReducers）**
```typescript
extraReducers: (builder) => {
  builder
    .addCase(someAsyncAction.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    })
    .addCase(someAsyncAction.fulfilled, (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
    })
    .addCase(someAsyncAction.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });
}
```

### **3. フックでの使用**
```typescript
const dispatch = useAppDispatch();

const handleAction = async () => {
  try {
    const result = await dispatch(someAsyncAction(params)).unwrap();
    // 成功処理
  } catch (error) {
    // エラーハンドリング
  }
};
```

## 🔧 実装済みcreateAsyncThunk

### **appSlice**
- `initializePlatformService`: プラットフォーム初期化

### **serialPortSlice**
- `connectSerialPort`: シリアルポート接続
- `reconnectSerialPort`: シリアルポート再接続
- `disconnectSerialPort`: シリアルポート切断

### **measurementSlice**
- `processSerialData`: データ処理
- `startMeasurement`: 測定開始
- `stopMeasurement`: 測定終了

## ⚠️ 使い分けルール

### **createAsyncThunk使用（データ処理・非同期処理）**
```typescript
// ✅ データ処理 - createAsyncThunkを使用
await dispatch(processSerialData({ rawData, parseFunction })).unwrap();
await dispatch(connectSerialPort(options)).unwrap();
await dispatch(startMeasurement()).unwrap();
```

### **手動Redux操作許可（同期的な設定変更）**
```typescript
// ✅ 設定変更 - 手動操作を許可
dispatch(setComment(value));
dispatch(setAutoSaveEnabled(enabled));
dispatch(setDemoMode(true));
```

### **非推奨パターン**
```typescript
// ❌ データ処理で手動操作 - 使用禁止
dispatch(addRawData(data));        // → processSerialData を使用
dispatch(addParsedData(parsed));   // → processSerialData を使用
dispatch(addDataBatch(...));       // → processSerialData を使用
dispatch(setStartTime(time));      // → startMeasurement を使用
dispatch(setEndTime(time));        // → stopMeasurement を使用
```

## 🔍 **重複処理の回避**

### **データフロー統一**
```
シリアルデータ受信
    ↓
useSerialPort (生データ転送のみ)
    ↓
SerialConnection.handleDataReceived
    ↓
processSerialData createAsyncThunk
    ↓
Redux状態更新
```

### **責任分離**
- **useSerialPort**: シリアル通信とデータ転送のみ
- **SerialConnection**: データ処理の制御
- **processSerialData**: 統一されたデータ処理ロジック

## 🎯 メリット

1. **一貫性**: 全ての非同期処理が同じパターン
2. **型安全性**: TypeScript完全対応
3. **エラーハンドリング**: 統一されたエラー処理
4. **デバッグ性**: Redux DevToolsで完全追跡
5. **保守性**: 予測可能な状態変化

## 📊 状態管理フロー

```
ユーザー操作
    ↓
createAsyncThunk dispatch
    ↓
pending → Redux状態更新
    ↓
非同期処理実行
    ↓
fulfilled/rejected → Redux状態更新
    ↓
UI自動更新
```

## 🔍 デバッグ

Redux DevToolsで以下を確認できます：
- 全ての非同期アクションの実行状況
- pending/fulfilled/rejectedの状態変化
- エラーの詳細情報
- 状態変化のタイムライン