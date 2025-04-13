import { useState, useEffect, useRef } from "react";
import { SerialHandler } from "./lib/serial";
import { SerialData, RecordingConfig } from "./types/serial";

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<SerialData[]>([]);
  const [config, setConfig] = useState<RecordingConfig>({});
  const [currentData, setCurrentData] = useState<SerialData | null>(null);
  const serialHandlerRef = useRef<SerialHandler | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const eventCountRef = useRef<number>(0);

  useEffect(() => {
    console.log("アプリケーションが初期化されました");
    return () => {
      console.log("アプリケーションが終了します");
      serialHandlerRef.current?.disconnect();
    };
  }, []);

  const handleData = (newData: SerialData) => {
    console.log("新しいデータを受信しました:", newData);
    setCurrentData(newData);
    setData((prev) => {
      const updatedData = [...prev, newData];
      console.log(
        "データ配列を更新しました。現在のデータ数:",
        updatedData.length
      );
      return updatedData;
    });
    eventCountRef.current++;

    // イベント数ベースの保存
    if (config.eventCount && eventCountRef.current >= config.eventCount) {
      console.log("イベント数ベースの自動保存を開始します");
      saveData();
      eventCountRef.current = 0;
    }

    // 時間ベースの保存
    if (config.timeInterval) {
      const now = Date.now();
      if (now - lastSaveTimeRef.current >= config.timeInterval * 60 * 1000) {
        console.log("時間ベースの自動保存を開始します");
        saveData();
        lastSaveTimeRef.current = now;
      }
    }
  };

  const saveData = () => {
    if (data.length === 0) {
      console.log("保存するデータがありません");
      return;
    }

    console.log("データの保存を開始します");
    const formattedData = data
      .map(
        (item) =>
          `${item.eventNumber} ${item.timeMs} ${item.adc} ${item.sipmMv.toFixed(
            2
          )} ${item.deadtimeMs} ${item.temperatureC.toFixed(2)}`
      )
      .join("\n");

    const header = `##########################################################################################
### Accel Kitchen
### https://accel-kitchen.com/
### info@accel-kitchen.com
### Signal threshold: ${data[0].adc}
### Reset threshold: ${data[0].adc - 5}
### Event Time[ms] ADC[0-1023] SiPM[mV] Deadtime[ms] Temp[C]
##########################################################################################`;

    const blob = new Blob([header + "\n" + formattedData], {
      type: "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cosmic_data_${new Date().toISOString()}.dat`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("データの保存が完了しました");
  };

  const connectSerial = async () => {
    console.log("シリアル通信の接続を開始します");
    try {
      serialHandlerRef.current = new SerialHandler(handleData);
      await serialHandlerRef.current.connect();
      setIsConnected(true);
      console.log("シリアル通信の接続が成功しました");
    } catch (error) {
      console.error("シリアル通信の接続に失敗しました:", error);
    }
  };

  const disconnectSerial = async () => {
    console.log("シリアル通信の切断を開始します");
    await serialHandlerRef.current?.disconnect();
    setIsConnected(false);
    console.log("シリアル通信の切断が完了しました");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Cosmic Watch Data Recorder</h1>

        <div className="bg-white p-4 rounded-lg shadow mb-4">
          <div className="flex gap-4 mb-4">
            <button
              onClick={isConnected ? disconnectSerial : connectSerial}
              className={`px-4 py-2 rounded ${
                isConnected
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white`}
            >
              {isConnected ? "切断" : "接続"}
            </button>

            <button
              onClick={saveData}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
              disabled={!isConnected || data.length === 0}
            >
              手動保存
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-2">時間間隔（分）</label>
              <input
                type="number"
                value={config.timeInterval || ""}
                onChange={(e) =>
                  setConfig({ ...config, timeInterval: Number(e.target.value) })
                }
                className="w-full p-2 border rounded"
                placeholder="自動保存間隔（分）"
              />
            </div>
            <div>
              <label className="block mb-2">イベント数</label>
              <input
                type="number"
                value={config.eventCount || ""}
                onChange={(e) =>
                  setConfig({ ...config, eventCount: Number(e.target.value) })
                }
                className="w-full p-2 border rounded"
                placeholder="自動保存イベント数"
              />
            </div>
          </div>
        </div>

        {currentData && (
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <h2 className="text-xl font-semibold mb-2">最新のデータ</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p>イベント番号: {currentData.eventNumber}</p>
                <p>時間: {currentData.timeMs} ms</p>
                <p>ADC: {currentData.adc}</p>
              </div>
              <div>
                <p>SiPM: {currentData.sipmMv.toFixed(2)} mV</p>
                <p>デッドタイム: {currentData.deadtimeMs} ms</p>
                <p>温度: {currentData.temperatureC.toFixed(2)} °C</p>
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
                    <td className="px-4 py-2">{row.eventNumber}</td>
                    <td className="px-4 py-2">{row.timeMs}</td>
                    <td className="px-4 py-2">{row.adc}</td>
                    <td className="px-4 py-2">{row.sipmMv.toFixed(2)}</td>
                    <td className="px-4 py-2">{row.deadtimeMs}</td>
                    <td className="px-4 py-2">{row.temperatureC.toFixed(2)}</td>
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
