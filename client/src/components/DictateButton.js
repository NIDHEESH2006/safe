import React from 'react';
import { useDictation } from '../utils/useDictation';

/**
 * Mic icon that sits next to a text field. Click to dictate — speech is
 * transcribed live into the field as you talk, the same as phone-keyboard
 * dictation.
 */
export default function DictateButton({ value, onChange, label = 'Dictate' }) {
  const { listening, supported, toggle } = useDictation(onChange);

  if (!supported) return null;

  return (
    <button
      type="button"
      className={`dictate-btn ${listening ? 'listening' : ''}`}
      onClick={() => toggle(value)}
      title={listening ? 'Stop dictation' : `${label} — click and speak`}
      aria-pressed={listening}
    >
      <span className="dictate-icon" aria-hidden="true">🎤</span>
      {listening ? 'Listening…' : 'Speak'}
    </button>
  );
}
