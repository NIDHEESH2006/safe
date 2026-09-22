import React, { useEffect, useRef, useState } from 'react';
import { useVoiceGuide } from '../context/VoiceGuideContext';

/**
 * Floating customer-service-style guide. Distinct from the per-field mic
 * (DictateButton, which dictates long text into a form field) — this widget
 * listens for short spoken *commands* ("file a report", "next", "help") or
 * accepts typed questions, and answers back in the chat log and out loud.
 */
export default function VoiceAssistant() {
  const { messages, muted, setMuted, dispatchCommand } = useVoiceGuide();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [typed, setTyped] = useState('');
  const [supported] = useState(() => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recognitionRef = useRef(null);
  const logRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return undefined;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const said = event.results[0][0].transcript;
      dispatchCommand(said);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    return () => recognition.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatchCommand]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, open]);

  const toggleListening = () => {
    if (!supported) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  };

  const submitTyped = (e) => {
    e.preventDefault();
    if (!typed.trim()) return;
    dispatchCommand(typed);
    setTyped('');
  };

  return (
    <div className="voice-assistant">
      {open && (
        <div className="assistant-panel" role="dialog" aria-label="SafeTrace voice and text guide">
          <div className="assistant-panel-header">
            <div className="assistant-identity">
              <span className="assistant-avatar" aria-hidden="true">🎧</span>
              <div>
                <strong>SafeTrace Guide</strong>
                <span className="assistant-status">{listening ? 'Listening…' : 'Ready to help'}</span>
              </div>
            </div>
            <div className="assistant-panel-actions">
              <button
                type="button"
                className="assistant-icon-btn"
                onClick={() => setMuted((m) => !m)}
                title={muted ? 'Unmute voice responses' : 'Mute voice responses'}
                aria-pressed={muted}
              >
                {muted ? '🔇' : '🔊'}
              </button>
              <button type="button" className="assistant-icon-btn" onClick={() => setOpen(false)} aria-label="Close guide">
                ✕
              </button>
            </div>
          </div>

          <div className="assistant-log" ref={logRef}>
            {messages.map((m) => (
              <div key={m.id} className={`assistant-msg ${m.from}`}>
                {m.from === 'assistant' && <span className="assistant-msg-icon" aria-hidden="true">🎧</span>}
                <p>{m.text}</p>
              </div>
            ))}
          </div>

          <form className="assistant-input-row" onSubmit={submitTyped}>
            <button
              type="button"
              className={`assistant-mic-btn ${listening ? 'listening' : ''}`}
              onClick={toggleListening}
              disabled={!supported}
              title={supported ? 'Speak a command' : 'Voice input not supported in this browser'}
            >
              🎤
            </button>
            <input
              placeholder="Type a question, e.g. “How do I file a report?”"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm">Ask</button>
          </form>
        </div>
      )}

      <button
        type="button"
        className={`assistant-launcher ${open ? 'open' : ''}`}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden="true">{open ? '✕' : '🎧'}</span>
        {!open && <span className="assistant-launcher-label">SafeTrace Guide</span>}
      </button>
    </div>
  );
}
