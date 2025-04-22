import { useState, useCallback } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { Layout } from "./common/components/Layout";
import { SerialConnection } from "./common/components/SerialConnection";
import { CosmicWatchData } from "./shared/types";

function App() {
  const [data, setData] = useState<string[]>([]);

  const handleDataReceived = useCallback((newData: string) => {
    console.log("Received data:", newData);
    setData((prev) => {
      // 最大1000行までを保持
      const updated = [...prev, newData];
      if (updated.length > 1000) {
        return updated.slice(-1000);
      }
      return updated;
    });
  }, []);

  return (
    <Layout>
      <SerialConnection onDataReceived={handleDataReceived} />
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-2">受信データ</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
          {data.join("\n")}
        </pre>
      </div>
    </Layout>
  );
}

export default App;
