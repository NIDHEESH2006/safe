/**
 * Thin fetch wrapper for the SafeTrace API. Centralizing this keeps every
 * component free of raw fetch/error-handling boilerplate.
 */

// In local dev, CRA's "proxy" field in package.json forwards /api to the
// backend. In production there is no proxy, so a deployed frontend needs to
// be told the backend's real URL via REACT_APP_API_URL (set in Vercel's
// project settings) — falling back to the relative path for same-origin
// deployments.
const BASE = `${process.env.REACT_APP_API_URL || ''}/api`;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  getCases: () => request('/cases'),
  createCase: (payload) => request('/cases', { method: 'POST', body: JSON.stringify(payload) }),
  getCase: (token, actor) => request(`/cases/${token}${actor ? `?actor=${actor}` : ''}`),
  sendMessage: (token, payload) => request(`/cases/${token}/messages`, { method: 'POST', body: JSON.stringify(payload) }),
  setStatus: (token, payload) => request(`/cases/${token}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  markEvidenceViewed: (token, adminName) => request(`/cases/${token}/evidence-viewed`, { method: 'POST', body: JSON.stringify({ adminName }) }),
  getStats: () => request('/stats'),
  getHeatmap: () => request('/heatmap'),
  getAnalytics: () => request('/analytics'),
  getAuditTrail: () => request('/audit-trail'),
};
