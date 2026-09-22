import React from 'react';

const CARDS = [
  { key: 'total', label: 'Total Cases', icon: '📊' },
  { key: 'newToday', label: 'New Today', icon: '🆕' },
  { key: 'pending', label: 'Pending', icon: '⏳' },
  { key: 'resolved', label: 'Resolved', icon: '✅' },
  { key: 'emergency', label: 'Emergency Cases', icon: '🚨', critical: true },
];

export default function StatsCards({ stats }) {
  if (!stats) return null;
  return (
    <div className="stats-grid">
      {CARDS.map((c) => (
        <div key={c.key} className={`stat-card ${c.critical ? 'stat-critical' : ''}`}>
          <div className="stat-icon">{c.icon}</div>
          <div className="stat-value">{(stats[c.key] ?? 0).toLocaleString()}</div>
          <div className="stat-label">{c.label}</div>
          {c.critical && <span className="badge priority-critical">IMMEDIATE PRIORITY</span>}
        </div>
      ))}
    </div>
  );
}
