import React from 'react';

export default function EmergencyTriage({ cases, onOpenChat }) {
  const urgent = cases
    .filter((c) => (c.priority === 'CRITICAL' || c.priority === 'HIGH') && c.status !== 'resolved')
    .sort((a, b) => (a.priority === b.priority ? 0 : a.priority === 'CRITICAL' ? -1 : 1))
    .slice(0, 8);

  return (
    <div className="card triage-card">
      <h2>🚨 Emergency Triage Panel</h2>
      {urgent.length === 0 && <p className="muted">No urgent cases right now.</p>}
      <ul className="triage-list">
        {urgent.map((c) => (
          <li key={c.token} className={`triage-item priority-${c.priority.toLowerCase()}`}>
            <div className="triage-item-main">
              <span className={`badge priority-${c.priority.toLowerCase()}`}>{c.priority}</span>
              <span className="triage-token">{c.token}</span>
              <span className="triage-category">{c.category}</span>
            </div>
            <span className="triage-time">{new Date(c.createdAt).toLocaleString()}</span>
            <button className="btn btn-primary btn-sm" onClick={() => onOpenChat(c.token)}>Open Chat</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
