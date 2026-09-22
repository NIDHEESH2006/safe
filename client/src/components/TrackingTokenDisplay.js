import React, { useState } from 'react';

export default function TrackingTokenDisplay({ token, onDone }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="card token-card">
      <span className="token-success-icon" aria-hidden="true">✅</span>
      <h2>Your report is secured</h2>
      <p className="muted">
        Save this tracking token somewhere safe. It is the <strong>only</strong> way to check your
        case status or talk with an investigator — SafeTrace stores no other way to identify you.
      </p>
      <div className="token-display">
        <code>{token}</code>
        <button className="btn btn-ghost btn-sm" onClick={copy}>{copied ? '✓ Copied' : 'Copy'}</button>
      </div>
      <button className="btn btn-primary" onClick={onDone}>Continue</button>
    </div>
  );
}
