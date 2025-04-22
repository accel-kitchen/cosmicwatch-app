import { useState, useCallback } from "react";
import { useSerialPort } from "../hooks/useSerialPort";
import { SerialPortConfig } from "../../shared/types";

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
  const [config, setConfig] = useState<SerialPortConfig>({
    isMaster: true,
    portNumber: "",
  });

  const { isConnected, error, connectWithDelay, disconnect } =
    useSerialPort(onDataReceived);

  const handleConnect = useCallback(async () => {
    onClearData();
    try {
      await connectWithDelay(config.isMaster);
      onConnectSuccess();
    } catch (error) {
      console.error("Connection failed in component:", error);
    }
  }, [connectWithDelay, config.isMaster, onClearData, onConnectSuccess]);

  const handleDisconnectInternal = useCallback(async () => {
    await disconnect();
    onDisconnect();
  }, [disconnect, onDisconnect]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={config.isMaster}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, isMaster: e.target.checked }))
            }
            className="mr-2"
          />
          Master機として接続
        </label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={isConnected ? handleDisconnectInternal : handleConnect}
          className={`px-4 py-2 rounded ${
            isConnected
              ? "bg-red-500 hover:bg-red-600"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white`}
        >
          {isConnected ? "切断" : "接続"}
        </button>
      </div>

      {error && <div className="mt-2 text-red-500">エラー: {error}</div>}

      {/* デバッグ情報 */}
      <div className="mt-4 p-2 bg-gray-100 rounded text-sm">
        <h3 className="font-bold">デバッグ情報:</h3>
        <div>接続状態: {isConnected ? "接続中" : "未接続"}</div>
        <div>Master/Slave: {config.isMaster ? "Master" : "Slave"}</div>
      </div>
    </div>
  );
};
