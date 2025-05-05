import { useCallback } from "react";
import { useSerialPort } from "../hooks/useSerialPort";
import { SectionTitle } from "./Layout";
import {
  CpuChipIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  BoltIcon,
  BoltSlashIcon,
} from "@heroicons/react/24/solid";

interface SerialConnectionProps {
  onDataReceived: (data: string) => void;
  onClearData: () => void;
  onConnectSuccess: () => void;
  onDisconnect: () => void;
  isDemoMode: boolean;
}

export const SerialConnection = ({
  onDataReceived,
  onClearData,
  onConnectSuccess,
  onDisconnect,
  isDemoMode,
}: SerialConnectionProps) => {
  const {
    isConnected,
    isConnecting,
    isDisconnecting,
    error,
    portInfo,
    connect,
    disconnect,
  } = useSerialPort(onDataReceived);

  const handleConnect = useCallback(async () => {
    if (isDemoMode) return;
    onClearData();
    try {
      await connect();
      onConnectSuccess();
    } catch (error) {
      console.error("Connection failed in component:", error);
    }
  }, [connect, onClearData, onConnectSuccess, isDemoMode]);

  const handleDisconnect = useCallback(async () => {
    await disconnect();
    onDisconnect();
  }, [disconnect, onDisconnect]);

  // 接続ステータステキストとアイコンを決定
  const getStatusDisplay = () => {
    if (isConnecting)
      return {
        text: "接続中...",
        icon: ArrowPathIcon,
        color: "text-yellow-600",
        spin: true,
      };
    if (isDisconnecting)
      return {
        text: "切断中...",
        icon: ArrowPathIcon,
        color: "text-yellow-600",
        spin: true,
      };
    if (isConnected)
      return {
        text: "接続済み",
        icon: CheckCircleIcon,
        color: "text-green-600",
        spin: false,
      };
    return {
      text: "未接続",
      icon: XCircleIcon,
      color: "text-gray-500",
      spin: false,
    };
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  // ボタンの状態とアイコンを決定
  const getButtonProps = () => {
    if (isConnected) {
      return {
        onClick: handleDisconnect,
        disabled: isDisconnecting,
        className: `flex items-center px-4 py-2 rounded-md font-medium text-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isDisconnecting
            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
            : "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500"
        }`,
        text: isDisconnecting ? "切断中..." : "切断",
        icon: BoltSlashIcon,
        title: "",
      };
    } else {
      const isDisabled = isConnecting || isDemoMode;
      return {
        onClick: handleConnect,
        disabled: isDisabled,
        className: `flex items-center px-4 py-2 rounded-md font-medium text-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isDisabled
            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-600"
        }`,
        text: isConnecting ? "接続中..." : "接続",
        icon: BoltIcon,
        title: isDemoMode
          ? "デモモード中は接続できません"
          : "CosmicWatchに接続",
      };
    }
  };

  const buttonProps = getButtonProps();
  const ButtonIcon = buttonProps.icon;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <SectionTitle>
        <div className="flex items-center">
          <CpuChipIcon className="h-6 w-6 mr-2 text-gray-600" />
          CosmicWatchと接続
        </div>
      </SectionTitle>
      <div className="flex items-center justify-between gap-4 mt-4">
        <div className="flex items-center text-sm">
          <StatusIcon
            className={`h-5 w-5 mr-1 ${statusDisplay.color} ${
              statusDisplay.spin ? "animate-spin" : ""
            }`}
          />
          <span className={`font-semibold ${statusDisplay.color}`}>
            {statusDisplay.text}
          </span>
          {isConnected && portInfo && (
            <span className="ml-3 text-xs text-gray-500">
              (VID: {portInfo.usbVendorId ?? "N/A"}, PID:{" "}
              {portInfo.usbProductId ?? "N/A"})
            </span>
          )}
        </div>

        <button
          onClick={buttonProps.onClick}
          disabled={buttonProps.disabled}
          className={buttonProps.className}
          title={buttonProps.title}
        >
          <ButtonIcon className="h-5 w-5 mr-1" />
          {buttonProps.text}
        </button>
      </div>

      {error && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">接続エラー</p>
                <p className="text-xs text-red-600 mt-1">{error}</p>
                <p className="text-xs text-gray-500 mt-2">
                  デバイスが正しく接続されているか確認してください。
                  ブラウザによっては、シリアル通信に対応していない場合があります。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
