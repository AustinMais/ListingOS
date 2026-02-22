/** Detect if text contains a US-style phone number. */
export function hasPhoneNumber(text: string): boolean {
  return (
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(text) ||
    /\(\d{3}\)\s*\d{3}[-.\s]?\d{4}\b/.test(text)
  );
}

/** Check if conversation shows lead intent: user expressed interest in viewing, then provided a phone number. */
export function isQualifiedLead(
  messages: Array<{ role?: string; content?: string; parts?: unknown[] }>
): boolean {
  const interestRegex =
    /see (the )?house|view (the )?property|schedule a showing|tour|visit|look at (the )?house/i;
  let sawInterest = false;
  let sawPhone = false;
  for (const m of messages) {
    const text = typeof m.content === 'string' ? m.content : '';
    if (m.role === 'user' && text) {
      if (interestRegex.test(text)) sawInterest = true;
      if (hasPhoneNumber(text)) sawPhone = true;
    }
  }
  return sawInterest && sawPhone;
}
