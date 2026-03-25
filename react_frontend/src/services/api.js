const DEFAULT_BASE_URL = "http://localhost:3001";

/**
 * Resolve API base URL.
 * - In dev, you can set REACT_APP_API_BASE_URL=http://localhost:3001
 * - In production, it can be set to the deployed backend URL
 */
function getApiBaseUrl() {
  const envUrl = process.env.REACT_APP_API_BASE_URL;
  return (envUrl && envUrl.trim()) ? envUrl.trim().replace(/\/+$/, "") : DEFAULT_BASE_URL;
}

async function parseJsonSafely(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function request(path, { method = "GET", headers = {}, body } = {}) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  const res = await fetch(url, {
    method,
    headers,
    body,
  });

  const data = await parseJsonSafely(res);

  if (!res.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// PUBLIC_INTERFACE
export async function uploadCsv(file) {
  /** Upload a CSV file to the backend for ingestion/processing. */
  const fd = new FormData();
  fd.append("file", file);
  return request("/api/upload-csv", { method: "POST", body: fd });
}

// PUBLIC_INTERFACE
export async function getAnalytics() {
  /** Retrieve analytics data (summary stats, chart-ready series, etc.). */
  return request("/api/analytics", { method: "GET" });
}

// PUBLIC_INTERFACE
export async function getAlerts() {
  /** Retrieve current alerts/anomalies. */
  return request("/api/alerts", { method: "GET" });
}
