import React from 'react';

export default function AuditTrail({ entries }) {
  return (
    <div className="card audit-card">
      <h2>🧾 Security Audit Trail</h2>
      <p className="muted">Every case access, evidence view, status change, and communication is logged for institutional compliance.</p>
      <div className="audit-list">
        {entries.length === 0 && <p className="muted">No activity recorded yet.</p>}
        {entries.map((e) => (
          <div className="audit-row" key={e.id}>
            <span className="audit-time">{new Date(e.timestamp).toLocaleString()}</span>
            <span className="audit-action">{e.action}</span>
            <span className="audit-actor">{e.actor}</span>
            {e.caseToken && <span className="audit-token">{e.caseToken}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
