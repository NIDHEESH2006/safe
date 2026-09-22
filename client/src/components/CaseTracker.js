import React, { useState } from 'react';
import { api } from '../utils/api';
import MessageThread from './MessageThread';
import { useVoiceGuide } from '../context/VoiceGuideContext';

const MILESTONES = [
  { key: 'submitted', label: 'Submitted & Secured' },
  { key: 'investigating', label: 'Investigation Underway (ICC Reviewing)' },
  { key: 'resolved', label: 'Formal Resolution' },
];

function ProgressTracker({ status }) {
  const activeIndex = MILESTONES.findIndex((m) => m.key === status);
  const isResolved = status === 'resolved';
  return (
    <div className="progress-tracker">
      {MILESTONES.map((m, i) => {
        const isComplete = i < activeIndex || (i === activeIndex && isResolved);
        return (
          <div key={m.key} className={`progress-step ${i <= activeIndex ? 'done' : ''} ${i === activeIndex && !isResolved ? 'current' : ''}`}>
            <span className="progress-dot">{isComplete ? '✓' : i + 1}</span>
            <span className="progress-label">{m.label}</span>
            {i < MILESTONES.length - 1 && <span className="progress-line" />}
          </div>
        );
      })}
    </div>
  );
}

export default function CaseTracker() {
  const [tokenInput, setTokenInput] = useState('');
  const [activeCase, setActiveCase] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { speak } = useVoiceGuide();

  const lookup = async (e) => {
    e.preventDefault();
    setError('');
    if (!tokenInput.trim()) return;
    setLoading(true);
    try {
      const { case: found } = await api.getCase(tokenInput.trim().toUpperCase());
      setActiveCase(found);
      speak(`Case ${found.token} found. Current status: ${found.status}. You can read messages from the investigator and reply below.`);
    } catch (err) {
      setError(err.message);
      setActiveCase(null);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async (text) => {
    setSending(true);
    try {
      await api.sendMessage(activeCase.token, { sender: 'reporter', text });
      const { case: refreshed } = await api.getCase(activeCase.token);
      setActiveCase(refreshed);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (!activeCase) {
    return (
      <form className="card token-login" onSubmit={lookup}>
        <h2>Check Your Case Status</h2>
        <p className="muted">Enter the tracking token you received when you submitted your report.</p>
        <input
          placeholder="ST-8921-XRT9"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          className="token-input"
        />
        {error && <p className="form-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Looking up…' : 'View Case Status'}
        </button>
      </form>
    );
  }

  return (
    <div className="card case-tracker">
      <div className="case-tracker-header">
        <div>
          <h2>Case {activeCase.token}</h2>
          <span className={`badge priority-${activeCase.priority.toLowerCase()}`}>{activeCase.priority}</span>
          <span className="muted"> · {activeCase.category}</span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setActiveCase(null)}>Log out</button>
      </div>

      <ProgressTracker status={activeCase.status} />

      <h3 className="thread-title">🔐 Encrypted Communication with ICC</h3>
      <MessageThread
        messages={activeCase.messages}
        onSend={sendReply}
        selfRole="reporter"
        sending={sending}
      />
    </div>
  );
}
