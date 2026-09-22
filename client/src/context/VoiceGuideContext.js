import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

const VoiceGuideContext = createContext(null);

const WELCOME =
  "Hello, I'm the SafeTrace Guide. I can walk you through filing a report or checking a case — " +
  'just tap the microphone and talk to me, type a question below, or follow the on-screen steps.';

/**
 * Global guide/assistant state: a running conversation log, text-to-speech
 * output, and a stack of command handlers that portal/wizard-step components
 * register so voice or typed commands ("next", "file a report", "check my
 * case") can drive navigation from anywhere in the app.
 */
export function VoiceGuideProvider({ children }) {
  const [messages, setMessages] = useState([{ id: 'welcome', from: 'assistant', text: WELCOME }]);
  const [muted, setMuted] = useState(false);
  const handlersRef = useRef([]);
  const lastSpokenRef = useRef(WELCOME);

  const speak = useCallback(
    (text, { asUser = false } = {}) => {
      setMessages((m) => [...m, { id: `${Date.now()}-${Math.random()}`, from: asUser ? 'user' : 'assistant', text }]);
      if (!asUser) {
        lastSpokenRef.current = text;
        if (!muted && window.speechSynthesis) {
          // Chrome can silently drop an utterance queued in the same tick as
          // cancel(); yielding a beat first makes speech reliable.
          window.speechSynthesis.cancel();
          setTimeout(() => {
            try {
              const utter = new SpeechSynthesisUtterance(text);
              utter.rate = 1.02;
              window.speechSynthesis.speak(utter);
            } catch {
              // Speech synthesis is unavailable/unstable in this environment —
              // the guide still works via the text log, so fail silently.
            }
          }, 60);
        }
      }
    },
    [muted]
  );

  // Handlers registered later (more specific — e.g. a wizard step) are tried
  // first; a handler returns true once it has consumed the command.
  const registerCommandHandler = useCallback((fn) => {
    handlersRef.current = [fn, ...handlersRef.current];
    return () => {
      handlersRef.current = handlersRef.current.filter((h) => h !== fn);
    };
  }, []);

  const dispatchCommand = useCallback(
    (text) => {
      if (!text.trim()) return;
      setMessages((m) => [...m, { id: `${Date.now()}-${Math.random()}`, from: 'user', text }]);
      const lower = text.toLowerCase();
      const handled = handlersRef.current.some((h) => h(lower));
      if (!handled) {
        speak(
          "I didn't quite catch that. You can say things like \"file a report\", \"check my case\", \"next\", or \"help\"."
        );
      }
    },
    [speak]
  );

  const repeatLast = useCallback(() => speak(lastSpokenRef.current), [speak]);

  return (
    <VoiceGuideContext.Provider
      value={{ messages, speak, muted, setMuted, registerCommandHandler, dispatchCommand, repeatLast }}
    >
      {children}
    </VoiceGuideContext.Provider>
  );
}

export function useVoiceGuide() {
  const ctx = useContext(VoiceGuideContext);
  if (!ctx) throw new Error('useVoiceGuide must be used within VoiceGuideProvider');
  return ctx;
}
