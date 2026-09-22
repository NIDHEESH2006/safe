import React, { useState } from 'react';

/**
 * Two-way encrypted-style message thread — the platform's core
 * differentiator. Both sides authenticate purely via the case token, so an
 * investigator can follow up and the survivor can reply without either side
 * learning the other's identity beyond what's said in the thread.
 */
export default function MessageThread({ messages, onSend, selfRole, sending }) {
  const [draft, setDraft] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onSend(draft);
    setDraft('');
  };

  return (
    <div className="message-thread">
      <div className="thread-scroll">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`thread-msg ${m.sender === selfRole ? 'from-self' : m.sender === 'system' ? 'from-system' : 'from-other'}`}
          >
            <span className="thread-msg-sender">
              {m.sender === 'system' ? '🔒 System' : m.sender === 'investigator' ? '🧑‍💼 ICC Investigator' : '🕶️ Anonymous Reporter'}
            </span>
            <p>{m.text}</p>
            <span className="thread-msg-time">{new Date(m.timestamp).toLocaleString()}</span>
          </div>
        ))}
        {messages.length === 0 && <p className="muted">No messages yet.</p>}
      </div>
      <form className="thread-composer" onSubmit={submit}>
        <input
          placeholder={selfRole === 'investigator' ? 'Message the reporter…' : 'Reply anonymously…'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className="btn btn-primary btn-sm" disabled={sending}>Send</button>
      </form>
    </div>
  );
}
