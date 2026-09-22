import React, { useEffect, useState } from 'react';
import { api } from '../utils/api';
import MessageThread from './MessageThread';

const STATUS_OPTIONS = ['submitted', 'investigating', 'resolved'];

export default function CaseChatModal({ token, adminName, onClose, onChanged }) {
  const [caseData, setCaseData] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { case: found } = await api.getCase(token, 'admin');
      setCaseData(found);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
    api.markEvidenceViewed(token, adminName).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const sendMessage = async (text) => {
    setSending(true);
    try {
      await api.sendMessage(token, { sender: 'investigator', text, adminName });
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (status) => {
    try {
      await api.setStatus(token, { status, adminName });
      await load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Case {token}</h2>
            {caseData && (
              <span className={`badge priority-${caseData.priority.toLowerCase()}`}>{caseData.priority}</span>
            )}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Close</button>
        </div>

        {error && <p className="form-error">{error}</p>}

        {caseData && (
          <>
            <div className="modal-meta">
              <p><strong>Category:</strong> {caseData.category}</p>
              <p><strong>Zone:</strong> {caseData.zone}</p>
              {(caseData.state || caseData.incidentLocation) && (
                <p>
                  <strong>Location:</strong> {[caseData.incidentLocation, caseData.state].filter(Boolean).join(', ')}
                </p>
              )}
              {caseData.incidentDate && (
                <p><strong>Incident date/time:</strong> {caseData.incidentDate} {caseData.incidentTime || ''}</p>
              )}
              <p><strong>Description:</strong> {caseData.description}</p>
              {caseData.polishedDescription && (
                <details>
                  <summary>AI-polished summary</summary>
                  <pre>{caseData.polishedDescription}</pre>
                </details>
              )}
              {(caseData.suspectIdentifiers?.handles || caseData.suspectIdentifiers?.urls || caseData.suspectIdentifiers?.phone) && (
                <p>
                  <strong>Suspect identifiers:</strong>{' '}
                  {[caseData.suspectIdentifiers.handles, caseData.suspectIdentifiers.urls, caseData.suspectIdentifiers.phone]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
              {caseData.evidence?.length > 0 && (
                <div>
                  <strong>Evidence ({caseData.evidence.length}):</strong>
                  <ul className="evidence-list">
                    {caseData.evidence.map((ev) => (
                      <li key={ev.hash} className="evidence-item">
                        <span className="evidence-name">📄 {ev.filename}</span>
                        <code className="evidence-hash">{ev.hash.slice(0, 24)}…</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="status-control">
                <strong>Status:</strong>
                <select value={caseData.status} onChange={(e) => changeStatus(e.target.value)}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <h3 className="thread-title">🔐 Encrypted Communication</h3>
            <MessageThread
              messages={caseData.messages}
              onSend={sendMessage}
              selfRole="investigator"
              sending={sending}
            />
          </>
        )}
      </div>
    </div>
  );
}
