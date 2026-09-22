import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../utils/api';
import StatsCards from './StatsCards';
import GeoHeatmap from './GeoHeatmap';
import EmergencyTriage from './EmergencyTriage';
import Analytics from './Analytics';
import AuditTrail from './AuditTrail';
import CaseChatModal from './CaseChatModal';

const ADMIN_NAME = 'Inspector Rao';
const POLL_MS = 15000;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState([]);
  const [zones, setZones] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [audit, setAudit] = useState([]);
  const [activeChatToken, setActiveChatToken] = useState(null);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [s, c, h, a, t] = await Promise.all([
        api.getStats(),
        api.getCases(),
        api.getHeatmap(),
        api.getAnalytics(),
        api.getAuditTrail(),
      ]);
      setStats(s.stats);
      setCases(c.cases);
      setZones(h.zones);
      setAnalytics(a);
      setAudit(t.entries);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard-header">
        <h1>ICC Command Center</h1>
        <span className="muted">Signed in as {ADMIN_NAME}</span>
      </div>

      {error && <p className="form-error">{error}</p>}

      <StatsCards stats={stats} />

      <GeoHeatmap zones={zones} />

      <EmergencyTriage cases={cases} onOpenChat={setActiveChatToken} />

      <Analytics analytics={analytics} />
      <AuditTrail entries={audit} />

      {activeChatToken && (
        <CaseChatModal
          token={activeChatToken}
          adminName={ADMIN_NAME}
          onClose={() => setActiveChatToken(null)}
          onChanged={refresh}
        />
      )}
    </div>
  );
}
