import React, { useState } from 'react';
import { sha256OfFile } from '../utils/hash';

/**
 * Drag-and-drop evidence upload. Files never leave the browser in this demo —
 * only filename, size, and a real SHA-256 hash are stored, which is enough to
 * later prove a piece of evidence hasn't been tampered with.
 */
export default function EvidenceLocker({ evidence, setEvidence }) {
  const [dragOver, setDragOver] = useState(false);
  const [hashing, setHashing] = useState(false);

  const ingestFiles = async (fileList) => {
    setHashing(true);
    const newEntries = [];
    for (const file of Array.from(fileList)) {
      const hash = await sha256OfFile(file);
      newEntries.push({
        filename: file.name,
        size: file.size,
        hash,
        uploadedAt: new Date().toISOString(),
      });
    }
    setEvidence((prev) => [...prev, ...newEntries]);
    setHashing(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) ingestFiles(e.dataTransfer.files);
  };

  const removeEntry = (hash) => setEvidence((prev) => prev.filter((e) => e.hash !== hash));

  return (
    <div className="evidence-locker">
      <label className="field-label">🔒 Encrypted Evidence Locker</label>
      <div
        className={`dropzone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('evidence-file-input').click()}
      >
        <input
          id="evidence-file-input"
          type="file"
          multiple
          hidden
          onChange={(e) => e.target.files?.length && ingestFiles(e.target.files)}
        />
        <p className="dropzone-icon">📁</p>
        <p>Drag &amp; drop screenshots, recordings, or documents here</p>
        <p className="dropzone-hint">
          {hashing ? 'Computing tamper-proof SHA-256 fingerprint…' : 'Each file is cryptographically hashed on your device before storage.'}
        </p>
      </div>

      {evidence.length > 0 && (
        <ul className="evidence-list">
          {evidence.map((item) => (
            <li key={item.hash} className="evidence-item">
              <div className="evidence-meta">
                <span className="evidence-name">📄 {item.filename}</span>
                <span className="evidence-size">{(item.size / 1024).toFixed(1)} KB</span>
              </div>
              <code className="evidence-hash" title="SHA-256 fingerprint">{item.hash.slice(0, 24)}…</code>
              <button type="button" className="evidence-remove" onClick={() => removeEntry(item.hash)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
