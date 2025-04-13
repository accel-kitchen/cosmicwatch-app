import { useState, useEffect, useRef } from "react";
import { SerialHandler } from "./lib/serial";
import { SerialData } from "./types/serial";

// 日付フォーマットユーティリティ
const formatDateTime = (date: Date): string => {
  return date
    .toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
    .replace(/[/]/g, "")
    .replace(/[:]/g, "")
    .replace(/[ ]/g, "");
};

// データフォーマットユーティリティ
const formatDataRow = (data: SerialData): string => {
  return `${data.event} ${data.totaltime} ${data.adc} ${data.sipm.toFixed(2)} ${
    data.deadtime
  } ${data.temperature.toFixed(2)}`;
};

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [measurementData, setMeasurementData] = useState<SerialData[]>([]);
  const [filenamePrefix, setFilenamePrefix] = useState("cw");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const serialHandlerRef = useRef<SerialHandler | null>(null);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (serialHandlerRef.current) {
        serialHandlerRef.current.disconnect();
      }
    };
  }, []);

  // データハンドリング
  const handleData = (newData: SerialData) => {
    setMeasurementData((prev) => [...prev, newData]);
  };

  // ダウンロード処理
  const downloadData = () => {
    if (measurementData.length === 0) {
      console.warn("No data to download");
      return;
    }

    try {
      const formattedData = measurementData.map(formatDataRow).join("\n");
      const endTime = new Date();
      const startTimeStr = startTime ? formatDateTime(startTime) : "unknown";
      const endTimeStr = formatDateTime(endTime);
      const filename = `${startTimeStr}-${endTimeStr}_${filenamePrefix}.dat`;

      const blob = new Blob([formattedData], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download data:", error);
    }
  };

  // シリアル接続処理
  const connectSerial = async () => {
    try {
      serialHandlerRef.current = new SerialHandler(handleData);
      await serialHandlerRef.current.connect();
      setIsConnected(true);
      setStartTime(new Date());
    } catch (error) {
      console.error("Failed to connect to serial port:", error);
      setIsConnected(false);
    }
  };

  // シリアル切断処理
  const disconnectSerial = async () => {
    try {
      if (serialHandlerRef.current) {
        await serialHandlerRef.current.disconnect();
      }
    } catch (error) {
      console.error("Failed to disconnect from serial port:", error);
    } finally {
      setIsConnected(false);
    }
  };

  // 接続ボタンクリック処理
  const handleConnectClick = () => {
    if (isConnected) {
      disconnectSerial();
    } else {
      setMeasurementData([]);
      connectSerial();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 transform transition-all duration-300 hover:shadow-xl">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Cosmic Watch Data Recorder
          </h1>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handleConnectClick}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                  isConnected
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-500 hover:bg-blue-600"
                } text-white shadow-md`}
              >
                {isConnected ? "Disconnect" : "Connect"}
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={filenamePrefix}
                  onChange={(e) => setFilenamePrefix(e.target.value)}
                  className="border-2 border-gray-200 rounded-lg px-3 py-2 w-24 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="cw"
                />
                <button
                  onClick={downloadData}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isConnected || measurementData.length === 0}
                >
                  Download
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isConnected
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all duration-300 hover:shadow-xl">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Data History
          </h2>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time(ms)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ADC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SiPM(mV)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deadtime(ms)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Temperature(°C)
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...measurementData].reverse().map((row, index) => (
                  <tr
                    key={measurementData.length - index - 1}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.event}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.totaltime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.adc}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.sipm.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.deadtime}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.temperature.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
