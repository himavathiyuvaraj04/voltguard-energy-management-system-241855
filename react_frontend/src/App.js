import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { getAlerts, getAnalytics, markAlertRead, uploadCsv } from "./services/api";

function formatDeviationPct(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  const n = Number(value);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function isUnread(alert) {
  return (alert?.status || "").toLowerCase() !== "read";
}

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState("light");

  const [selectedFile, setSelectedFile] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  // Normalized: { alerts: Alert[] }
  const [alerts, setAlerts] = useState({ alerts: [] });

  const [loading, setLoading] = useState({
    upload: false,
    analytics: false,
    alerts: false,
    markRead: false,
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

  const unreadCount = useMemo(() => {
    return (alerts?.alerts || []).reduce((acc, a) => acc + (isUnread(a) ? 1 : 0), 0);
  }, [alerts]);

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
      setAlerts(res || { alerts: [] });
      if (!silent) showMessage("success", "Alerts loaded.");
    } catch (e) {
      if (!silent) showMessage("error", e.message || "Failed to load alerts.");
    } finally {
      setLoading((s) => ({ ...s, alerts: false }));
    }
  }

  async function handleMarkRead(alertId) {
    setLoading((s) => ({ ...s, markRead: true }));
    setMessage(null);

    try {
      await markAlertRead(alertId);

      // Optimistic local update (keeps UI responsive even if backend adds more fields later).
      setAlerts((prev) => ({
        alerts: (prev?.alerts || []).map((a) => (a.id === alertId ? { ...a, status: "read" } : a)),
      }));
    } catch (e) {
      showMessage("error", e.message || "Failed to mark alert as read.");
    } finally {
      setLoading((s) => ({ ...s, markRead: false }));
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
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: 28 }}>VoltGuard Dashboard</h1>
              <p style={{ marginTop: 8, opacity: 0.85 }}>
                Backend: <code>{apiBaseUrl}</code>
              </p>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }} aria-label="Notifications">
              <span style={{ fontWeight: 700 }}>Alerts</span>
              <span
                aria-label={`${unreadCount} unread alerts`}
                style={{
                  minWidth: 26,
                  height: 22,
                  padding: "0 8px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 800,
                  border: "1px solid var(--border-color)",
                  background: unreadCount > 0 ? "rgba(239, 68, 68, 0.14)" : "var(--bg-secondary)",
                  color: unreadCount > 0 ? "var(--text-primary)" : "rgba(100, 116, 139, 1)",
                }}
              >
                {unreadCount}
              </span>
            </div>
          </div>

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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h2 style={{ margin: "0 0 8px 0", fontSize: 18 }}>3) Alerts</h2>
              <button
                className="theme-toggle"
                style={{ position: "static", marginBottom: 12 }}
                onClick={() => handleRefreshAlerts(false)}
                disabled={loading.alerts}
              >
                {loading.alerts ? "Loading..." : "Refresh Alerts"}
              </button>
            </div>

            <div
              style={{
                border: "1px solid var(--border-color)",
                borderRadius: 12,
                overflow: "hidden",
                background: "var(--bg-secondary)",
              }}
            >
              {(alerts?.alerts || []).length === 0 ? (
                <div style={{ padding: 14, opacity: 0.85 }}>No alerts found.</div>
              ) : (
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {(alerts?.alerts || []).map((a) => {
                    const unread = isUnread(a);

                    return (
                      <li
                        key={a.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          padding: 14,
                          borderTop: "1px solid var(--border-color)",
                          background: unread ? "rgba(59, 130, 246, 0.10)" : "transparent",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                            <span style={{ fontWeight: unread ? 800 : 700 }}>
                              {a.site || "Unknown site"}
                            </span>
                            <span style={{ opacity: 0.85 }}>{a.date || "—"}</span>
                            {unread && (
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 800,
                                  padding: "2px 8px",
                                  borderRadius: 999,
                                  border: "1px solid var(--border-color)",
                                  background: "rgba(59, 130, 246, 0.16)",
                                }}
                              >
                                Unread
                              </span>
                            )}
                          </div>

                          <div style={{ marginTop: 6, opacity: 0.9, display: "flex", gap: 10, flexWrap: "wrap" }}>
                            <span>
                              Deviation:{" "}
                              <strong style={{ fontWeight: 900 }}>{formatDeviationPct(a.deviationPct)}</strong>
                            </span>
                            <span style={{ opacity: 0.7 }}>
                              Customer: {a.customer || "—"}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                          <button
                            className="theme-toggle"
                            style={{
                              position: "static",
                              padding: "8px 12px",
                              fontSize: 12,
                              opacity: unread ? 1 : 0.6,
                              cursor: unread ? "pointer" : "not-allowed",
                            }}
                            onClick={() => handleMarkRead(a.id)}
                            disabled={!unread || loading.markRead}
                            aria-label={`Mark alert ${a.id} as read`}
                          >
                            {loading.markRead ? "Working..." : "Mark read"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </header>
    </div>
  );
}

export default App;
