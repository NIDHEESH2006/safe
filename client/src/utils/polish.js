/**
 * "AI Auto-Polish" — client-side heuristic rewrite that turns a raw, emotional
 * account into an objective, chronological, law-enforcement-style summary.
 * No external API call is made (keeps the demo offline-safe); the transform
 * is a deterministic simulation of what an LLM triage pass would produce.
 */
export function polishDescription(raw, { category, suspectIdentifiers } = {}) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';

  // Split into sentence-ish fragments, drop filler words, normalize tone.
  const fragments = trimmed
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const fillerPattern = /\b(um+|uh+|like|you know|i guess|i think|honestly|literally|basically)\b/gi;
  const firstPersonToThird = (s) =>
    s
      // Contractions must be rewritten before the bare pronouns they contain.
      .replace(/\bI'm\b/gi, 'the reporter is')
      .replace(/\bI've\b/gi, 'the reporter has')
      .replace(/\bI\b/g, 'The reporter')
      .replace(/\bmy\b/gi, "the reporter's")
      .replace(/\bme\b/gi, 'the reporter');

  const cleaned = fragments
    .map((s) =>
      s
        .replace(fillerPattern, '')
        .replace(/\s+([,.!?])/g, '$1') // drop space left behind before punctuation
        .replace(/\s{2,}/g, ' ')
        .replace(/^[,\s]+/, '')
        .trim()
    )
    .filter((s) => s.length > 0);

  // Swap pronouns to third person first, then capitalize the resulting
  // sentence start — capitalizing before the swap would leave sentences
  // that begin with "I" lowercase once "I" becomes "the reporter…".
  const chronological = cleaned
    .map(firstPersonToThird)
    .map((s) => (s[0] || '').toUpperCase() + s.slice(1));

  const header = `INCIDENT SUMMARY${category ? ` — Category: ${category}` : ''}`;
  const idLine =
    suspectIdentifiers && (suspectIdentifiers.handles || suspectIdentifiers.urls || suspectIdentifiers.phone)
      ? `Known identifiers on record: ${[suspectIdentifiers.handles, suspectIdentifiers.urls, suspectIdentifiers.phone]
          .filter(Boolean)
          .join('; ')}.`
      : null;

  const body = chronological.map((s, i) => `${i + 1}. ${s}`).join('\n');

  return [header, idLine, '', body].filter((l) => l !== null).join('\n');
}
