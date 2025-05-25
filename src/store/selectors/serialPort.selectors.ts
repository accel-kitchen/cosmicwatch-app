import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../index";
import { SerialPortState } from "../slices/serialPortSlice";

// =============================================================================
// 基本セレクター
// =============================================================================

export const selectSerialPortState = (state: RootState): SerialPortState =>
  state.serialPort;

// =============================================================================
// 計算セレクター
// =============================================================================

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

// 非同期処理状態（シリアルポート関連のみ）
export const selectSerialAsyncStates = createSelector(
  [selectSerialPortState],
  (serialPort) => ({
    isSerialConnecting: serialPort.isConnecting,
    isSerialDisconnecting: serialPort.isDisconnecting,
    isSerialBusy: serialPort.isConnecting || serialPort.isDisconnecting,
  })
);
