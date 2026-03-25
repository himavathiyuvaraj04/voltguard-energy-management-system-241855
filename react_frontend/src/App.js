import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { getAlerts, getAnalytics, uploadCsv } from "./services/api";

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState("light");

  const [selectedFile, setSelectedFile] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState(null);

  const [loading, setLoading] = useState({
    upload: false,
    analytics: false,
    alerts: false,
  });

  const [message, setMessage] = useState(null); // { type: 'success'|'error'|'info', text: string }

  // Effect to apply theme to document element
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const apiBaseUrl = useMemo(() => {
    // Display the base URL so users can quickly verify they’re pointing to the backend.
    return process.env.REACT_APP_API_BASE_URL || "http://localhost:3001";
  }, []);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    /** Toggle between light and dark theme. */
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  function showMessage(type, text) {
    setMessage({ type, text });
  }

  async function handleUpload() {
    if (!selectedFile) {
      showMessage("error", "Please choose a CSV file before uploading.");
      return;
    }

    setLoading((s) => ({ ...s, upload: true }));
    setMessage(null);

    try {
      const res = await uploadCsv(selectedFile);
      showMessage("success", res?.message || "CSV uploaded successfully.");

      // Optional: refresh analytics/alerts after upload for a simple end-to-end feel.
      await Promise.all([handleRefreshAnalytics(true), handleRefreshAlerts(true)]);
    } catch (e) {
      showMessage("error", e.message || "Upload failed.");
    } finally {
      setLoading((s) => ({ ...s, upload: false }));
    }
  }

  async function handleRefreshAnalytics(silent = false) {
    setLoading((s) => ({ ...s, analytics: true }));
    if (!silent) setMessage(null);

    try {
      const res = await getAnalytics();
      setAnalytics(res);
      if (!silent) showMessage("success", "Analytics loaded.");
    } catch (e) {
      if (!silent) showMessage("error", e.message || "Failed to load analytics.");
    } finally {
      setLoading((s) => ({ ...s, analytics: false }));
    }
  }

  async function handleRefreshAlerts(silent = false) {
    setLoading((s) => ({ ...s, alerts: true }));
    if (!silent) setMessage(null);

    try {
      const res = await getAlerts();
      setAlerts(res);
      if (!silent) showMessage("success", "Alerts loaded.");
    } catch (e) {
      if (!silent) showMessage("error", e.message || "Failed to load alerts.");
    } finally {
      setLoading((s) => ({ ...s, alerts: false }));
    }
  }

  return (
    <div className="App">
      <header className="App-header" style={{ padding: 24, gap: 16 }}>
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>

        <div style={{ maxWidth: 900, width: "100%", textAlign: "left" }}>
          <h1 style={{ margin: 0, fontSize: 28 }}>VoltGuard Dashboard (API Wired)</h1>
          <p style={{ marginTop: 8, opacity: 0.85 }}>
            Backend: <code>{apiBaseUrl}</code>
          </p>

          {message && (
            <div
              role="status"
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 10,
                border: "1px solid var(--border-color)",
                background:
                  message.type === "success"
                    ? "rgba(6, 182, 212, 0.12)"
                    : message.type === "error"
                      ? "rgba(239, 68, 68, 0.12)"
                      : "rgba(100, 116, 139, 0.12)",
              }}
            >
              <strong style={{ textTransform: "capitalize" }}>{message.type}:</strong>{" "}
              <span>{message.text}</span>
            </div>
          )}

          <section style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: 18 }}>1) Upload CSV</h2>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                aria-label="Choose CSV file"
              />
              <button
                className="theme-toggle"
                style={{ position: "static" }}
                onClick={handleUpload}
                disabled={loading.upload}
              >
                {loading.upload ? "Uploading..." : "Upload CSV"}
              </button>
            </div>
          </section>

          <section style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: 18 }}>2) Analytics</h2>
            <button
              className="theme-toggle"
              style={{ position: "static", marginBottom: 12 }}
              onClick={() => handleRefreshAnalytics(false)}
              disabled={loading.analytics}
            >
              {loading.analytics ? "Loading..." : "Load Analytics"}
            </button>

            <pre
              style={{
                margin: 0,
                padding: 12,
                borderRadius: 10,
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-secondary)",
                overflowX: "auto",
                fontSize: 13,
              }}
            >
              {analytics ? JSON.stringify(analytics, null, 2) : "No analytics loaded yet."}
            </pre>
          </section>

          <section style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border-color)" }}>
            <h2 style={{ margin: "0 0 8px 0", fontSize: 18 }}>3) Alerts</h2>
            <button
              className="theme-toggle"
              style={{ position: "static", marginBottom: 12 }}
              onClick={() => handleRefreshAlerts(false)}
              disabled={loading.alerts}
            >
              {loading.alerts ? "Loading..." : "Load Alerts"}
            </button>

            <pre
              style={{
                margin: 0,
                padding: 12,
                borderRadius: 10,
                border: "1px solid var(--border-color)",
                backgroundColor: "var(--bg-secondary)",
                overflowX: "auto",
                fontSize: 13,
              }}
            >
              {alerts ? JSON.stringify(alerts, null, 2) : "No alerts loaded yet."}
            </pre>
          </section>
        </div>
      </header>
    </div>
  );
}

export default App;
