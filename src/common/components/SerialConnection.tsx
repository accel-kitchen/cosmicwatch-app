import { useCallback } from "react";
import { useSerialPort } from "../hooks/useSerialPort";
import { SectionTitle } from "./Layout";

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

  // 接続ステータステキストを決定
  const getStatusText = () => {
    if (isConnecting) return "接続中...";
    if (isDisconnecting) return "切断中...";
    return isConnected ? "接続済み" : "未接続";
  };

  // ステータス表示の色を決定
  const getStatusColor = () => {
    if (isConnecting || isDisconnecting) return "bg-yellow-500 animate-pulse";
    return isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400";
  };

  // ボタンの状態を決定
  const getButtonProps = () => {
    if (isConnected) {
      return {
        onClick: handleDisconnect,
        disabled: isDisconnecting,
        className: `px-4 py-2 rounded-md font-medium text-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isDisconnecting
            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
            : "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500"
        }`,
        text: isDisconnecting ? "切断中..." : "切断",
      };
    } else {
      const isDisabled = isConnecting || isDemoMode;
      return {
        onClick: handleConnect,
        disabled: isDisabled,
        className: `px-4 py-2 rounded-md font-medium text-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          isDisabled
            ? "bg-gray-400 text-gray-200 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-600"
        }`,
        text: isConnecting ? "接続中..." : "接続",
        title: isDemoMode ? "デモモード中は接続できません" : "",
      };
    }
  };

  const buttonProps = getButtonProps();

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <SectionTitle>CosmicWatchと接続</SectionTitle>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center text-sm">
          <span
            className={`mr-2 h-3 w-3 rounded-full ${getStatusColor()}`}
          ></span>
          <span className="font-medium text-gray-600">状態:</span>
          <span
            className={`ml-1.5 font-semibold ${
              isConnected ? "text-green-700" : "text-gray-600"
            }`}
          >
            {getStatusText()}
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
