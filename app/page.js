"use client";

import { useState, useEffect } from "react";

export default function Dashboard() {
  const [data, setData] = useState({
    temperature: null,
    humidity: null,
    timestamp: null,
    online: false,
    relay1: "UNKNOWN",
    relay2: "UNKNOWN",
  });


  useEffect(() => {
    async function fetchData() {
      try {
        const [tRes, sRes, r1Res, r2Res] = await Promise.all([
          fetch("/api/telemetry"),
          fetch("/api/status"),
          fetch("/api/relay/relay1"),
          fetch("/api/relay/relay2"),
        ]);

        const telemetry = await tRes.json().catch(() => ({}));
        const status = await sRes.json().catch(() => ({}));
        const r1 = await r1Res.json().catch(() => ({}));
        const r2 = await r2Res.json().catch(() => ({}));

        setData({
          temperature: telemetry.temperature ?? null,
          humidity: telemetry.humidity ?? null,
          timestamp: telemetry.timestamp ?? null,
          online: status.online ?? false,
          relay1: r1.state ?? "UNKNOWN",
          relay2: r2.state ?? "UNKNOWN",
        });
      } catch {
        setData((prev) => ({ ...prev, online: false }));
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  async function controlRelay(id, state) {
    try {
      await fetch(`/api/relay/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
    } catch (err) {
      console.error("Failed to control relay:", err);
    }
  }


  function formatTime(iso) {
    if (!iso) return "--:--:--";
    return new Date(iso).toLocaleTimeString();
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: 20, fontFamily: "Arial" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>ESP32 Dashboard</h1>
        <span style={{ color: data.online ? "green" : "red", fontWeight: "bold" }}>
          {data.online ? "● ONLINE" : "● OFFLINE"}
        </span>
      </div>

      {/* Sensor Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 15, marginBottom: 20 }}>
        <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>TEMPERATURE</div>
          <div style={{ fontSize: 28, fontWeight: "bold" }}>
            {data.online && data.temperature !== null ? `${data.temperature}°C` : "--"}
          </div>
        </div>

        <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>HUMIDITY</div>
          <div style={{ fontSize: 28, fontWeight: "bold" }}>
            {data.online && data.humidity !== null ? `${data.humidity}%` : "--"}
          </div>
        </div>

        <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>LAST UPDATE</div>
          <div style={{ fontSize: 20, fontWeight: "bold" }}>
            {data.online ? formatTime(data.timestamp) : "--:--:--"}
          </div>
        </div>
      </div>

      {/* Relay Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 15, marginBottom: 20 }}>
        <RelayControl
          title="Relay 1"
          state={data.relay1}
          online={data.online}
          onOn={() => controlRelay("relay1", "ON")}
          onOff={() => controlRelay("relay1", "OFF")}
        />
        <RelayControl
          title="Relay 2"
          state={data.relay2}
          online={data.online}
          onOn={() => controlRelay("relay2", "ON")}
          onOff={() => controlRelay("relay2", "OFF")}
        />
      </div>

      {/* Offline Warning */}
      {!data.online && (
        <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 8, padding: 15 }}>
          <strong>ESP32 is offline.</strong> Waiting for connection...
        </div>
      )}
    </main>
  );
}


function RelayControl({ title, state, online, onOn, onOff }) {
  const color = state === "ON" ? "green" : state === "OFF" ? "red" : "orange";

  return (
    <div style={{ border: "2px solid #951047", borderRadius: 8, padding: 20 }}>
      <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: 15 }}>{title}</div>
      <div style={{ textAlign: "center", marginBottom: 15 }}>
        State: <span style={{ color, fontWeight: "bold" }}>{state}</span>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <button
          onClick={onOn}
          disabled={!online}
          style={{
            padding: "10px 20px",
            border: "2px solid green",
            background: online ? "white" : "#eee",
            color: online ? "green" : "#999",
            borderRadius: 6,
            cursor: online ? "pointer" : "not-allowed",
            fontWeight: "bold",
          }}
        >
          ON
        </button>
        <button
          onClick={onOff}
          disabled={!online}
          style={{
            padding: "10px 20px",
            border: "2px solid red",
            background: online ? "white" : "#eee",
            color: online ? "red" : "#999",
            borderRadius: 6,
            cursor: online ? "pointer" : "not-allowed",
            fontWeight: "bold",
          }}
        >
          OFF
        </button>
      </div>
    </div>
  );
}
