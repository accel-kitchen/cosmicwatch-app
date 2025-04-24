import { useCallback } from "react";
import { useSerialPort } from "../hooks/useSerialPort";

interface SerialConnectionProps {
  onDataReceived: (data: string) => void;
  onClearData: () => void;
  onConnectSuccess: () => void;
  onDisconnect: () => void;
}

export const SerialConnection = ({
  onDataReceived,
  onClearData,
  onConnectSuccess,
  onDisconnect,
}: SerialConnectionProps) => {
  const { isConnected, error, portInfo, connect, disconnect } =
    useSerialPort(onDataReceived);

  const handleConnect = useCallback(async () => {
    onClearData();
    try {
      await connect();
      onConnectSuccess();
    } catch (error) {
      console.error("Connection failed in component:", error);
    }
  }, [connect, onClearData, onConnectSuccess]);

  const handleDisconnectInternal = useCallback(async () => {
    await disconnect();
    onDisconnect();
  }, [disconnect, onDisconnect]);

  return (
    <div className="p-5 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        CosmicWatchと接続
      </h2>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center text-sm">
          <span
            className={`mr-2 h-3 w-3 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : "bg-gray-400"
            }`}
          ></span>
          <span className="font-medium text-gray-600">状態:</span>
          <span
            className={`ml-1.5 font-semibold ${
              isConnected ? "text-green-700" : "text-gray-600"
            }`}
          >
            {isConnected ? "接続中" : "未接続"}
          </span>
          {isConnected && portInfo && (
            <span className="ml-3 text-xs text-gray-500">
              (VID: {portInfo.usbVendorId ?? "N/A"}, PID:{" "}
              {portInfo.usbProductId ?? "N/A"})
            </span>
          )}
        </div>

        <button
          onClick={isConnected ? handleDisconnectInternal : handleConnect}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isConnected
              ? "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500"
              : "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-600"
          }`}
        >
          {isConnected ? "切断" : "接続"}
        </button>
      </div>

      {error && (
        <div className="mt-3 pt-3 border-t border-gray-200 text-sm">
          <p className="text-red-600 font-medium">エラー: {error}</p>
        </div>
      )}
    </div>
  );
};
