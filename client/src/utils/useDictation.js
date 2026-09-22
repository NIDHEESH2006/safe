import { useEffect, useRef, useState } from 'react';

/**
 * Speech-to-text for a single field. Call `toggle()` from a mic button; while
 * listening, `onUpdate(fullText)` fires continuously as speech is recognized
 * so the caller can type it straight into an input/textarea live, the same
 * way dictation works on a phone keyboard.
 */
export function useDictation(onUpdate) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recognitionRef = useRef(null);
  const baseTextRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return undefined;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalChunk = '';
      let interimChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalChunk += chunk;
        else interimChunk += chunk;
      }
      if (finalChunk) {
        baseTextRef.current = `${baseTextRef.current} ${finalChunk}`.trim();
      }
      const preview = `${baseTextRef.current} ${interimChunk}`.trim();
      onUpdate(preview);
    };

    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    return () => recognition.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = (currentText = '') => {
    if (!supported) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
    } else {
      baseTextRef.current = currentText;
      try {
        recognitionRef.current?.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  };

  return { listening, supported, toggle };
}
