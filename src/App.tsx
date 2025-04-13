import { useState, useEffect, useRef } from "react";
import { SerialHandler } from "./lib/serial";
import { SerialData } from "./types/serial";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<SerialData[]>([]);
  const [currentData, setCurrentData] = useState<SerialData | null>(null);
  const [filenamePrefix, setFilenamePrefix] = useState("cw");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const serialHandlerRef = useRef<SerialHandler | null>(null);

  useEffect(() => {
    return () => {
      serialHandlerRef.current?.disconnect();
    };
  }, []);

  const handleData = (newData: SerialData) => {
    console.log(newData);
    setCurrentData(newData);
    setData((prev) => [...prev, newData]);
  };

  const downloadData = () => {
    if (data.length === 0) return;

    const formattedData = data
      .map(
        (item) =>
          `${item.event} ${item.totaltime} ${item.adc} ${item.sipm.toFixed(
            2
          )} ${item.deadtime} ${item.temperature.toFixed(2)}`
      )
      .join("\n");

    const endTime = new Date();
    const startTimeStr = startTime
      ?.toLocaleString("ja-JP", {
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
    const endTimeStr = endTime
      .toLocaleString("ja-JP", {
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
    const filename = `${startTimeStr}-${endTimeStr}_${filenamePrefix}.dat`;

    const blob = new Blob([formattedData], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const connectSerial = async () => {
    console.log("Connecting...");
    try {
      serialHandlerRef.current = new SerialHandler(handleData);
      await serialHandlerRef.current.connect();
      setIsConnected(true);
      setStartTime(new Date());
      console.log("Connected!");
    } catch (error) {
      console.error("シリアル通信の接続に失敗しました:", error);
    }
  };

  const disconnectSerial = async () => {
    await serialHandlerRef.current?.disconnect();
    setIsConnected(false);
  };

  const connectButtonClick = () => {
    if (isConnected) {
      disconnectSerial();
    } else {
      setData([]);
      connectSerial();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Cosmic Watch Data Recorder</h1>

        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex gap-4 mb-4">
            <button
              onClick={connectButtonClick}
              className={`px-4 py-2 rounded ${
                isConnected
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white`}
            >
              {isConnected ? "切断" : "接続"}
            </button>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={filenamePrefix}
                onChange={(e) => setFilenamePrefix(e.target.value)}
                className="border rounded px-2 py-1 w-20"
                placeholder="cw"
              />
              <button
                onClick={downloadData}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
                disabled={!isConnected || data.length === 0}
              >
                ダウンロード
              </button>
            </div>
          </div>
        </div>

        {currentData && (
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="text-xl font-semibold mb-2">最新のデータ</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>イベント番号: {currentData.event}</p>
                <p>時間: {currentData.totaltime} ms</p>
                <p>ADC: {currentData.adc}</p>
              </div>
              <div>
                <p>SiPM: {currentData.sipm.toFixed(2)} mV</p>
                <p>デッドタイム: {currentData.deadtime} ms</p>
                <p>温度: {currentData.temperature.toFixed(2)} °C</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2">イベント</th>
                  <th className="px-4 py-2">時間(ms)</th>
                  <th className="px-4 py-2">ADC</th>
                  <th className="px-4 py-2">SiPM(mV)</th>
                  <th className="px-4 py-2">デッドタイム(ms)</th>
                  <th className="px-4 py-2">温度(°C)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-2">{row.event}</td>
                    <td className="px-4 py-2">{row.totaltime}</td>
                    <td className="px-4 py-2">{row.adc}</td>
                    <td className="px-4 py-2">{row.sipm.toFixed(2)}</td>
                    <td className="px-4 py-2">{row.deadtime}</td>
                    <td className="px-4 py-2">{row.temperature.toFixed(2)}</td>
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
