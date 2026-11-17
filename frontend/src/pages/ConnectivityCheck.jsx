import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

// Temporary smoke-test page: confirms the browser can reach the API,
// and the API can reach Postgres. Replaced once real pages exist.
function ConnectivityCheck() {
  const [apiStatus, setApiStatus] = useState("checking...");
  const [dbStatus, setDbStatus] = useState("checking...");

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((res) => res.json())
      .then((data) => setApiStatus(`ok (${data.status})`))
      .catch((err) => setApiStatus(`failed: ${err.message}`));

    fetch(`${API_URL}/health/db`)
      .then((res) => res.json())
      .then((data) =>
        setDbStatus(
          data.status === "ok" ? `ok (${data.db_time})` : `failed: ${data.message}`
        )
      )
      .catch((err) => setDbStatus(`failed: ${err.message}`));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-8 font-sans">
      <h1 className="text-xl font-semibold text-slate-900">
        TailorTrack — connectivity check
      </h1>
      <ul className="mt-4 space-y-1 text-slate-700">
        <li>Frontend → API: {apiStatus}</li>
        <li>API → Postgres: {dbStatus}</li>
      </ul>
    </main>
  );
}

export default ConnectivityCheck;
