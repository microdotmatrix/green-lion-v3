/**
 * Shared contact-form spam helpers (honeypot + plain-language checks).
 * Used by the Astro action, API route, and client-side form validation.
 */

/** Honeypot field names — look like real fields to bots, never shown to users. */
export const HONEYPOT_FIELDS = ["website", "companyUrl"] as const;

export type HoneypotField = (typeof HONEYPOT_FIELDS)[number];

export const PLAIN_LANGUAGE_ERROR =
  "Please write this field in plain language (words separated by spaces).";

/**
 * Returns true when any honeypot field has a non-empty value.
 * Bots that autofill every input will trip this; humans never see the fields.
 */
export function isHoneypotTriggered(
  values: Partial<Record<HoneypotField, string | undefined | null>>,
): boolean {
  return HONEYPOT_FIELDS.some((name) => {
    const value = values[name];
    return typeof value === "string" && value.trim().length > 0;
  });
}

/**
 * Heuristic detection for bot gibberish like "EPNEPjdJsWCQAAgXfbH".
 * Flags long tokens with random mixed case, low vowel density,
 * long consonant runs, or repeated character streaks — not normal prose.
 */
export function isLikelyGibberish(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 10) return false;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;

  // A single long space-free blob is the classic spam pattern.
  if (words.length === 1 && trimmed.replace(/\s/g, "").length >= 12) {
    return isGibberishToken(trimmed);
  }

  // Multi-word: reject when any long token looks like gibberish,
  // or most of the text is made of suspicious tokens.
  let gibberishChars = 0;
  let totalChars = 0;

  for (const word of words) {
    const letters = word.replace(/[^a-zA-Z0-9]/g, "");
    totalChars += letters.length;
    if (isGibberishToken(word)) {
      gibberishChars += letters.length;
      // One clear gibberish token (e.g. pasted random subject word) is enough.
      if (letters.length >= 12) return true;
    }
  }

  if (totalChars >= 20 && gibberishChars / totalChars >= 0.6) {
    return true;
  }

  return false;
}

function isGibberishToken(token: string): boolean {
  const alnum = token.replace(/[^a-zA-Z0-9]/g, "");
  if (alnum.length < 10) return false;

  // Repeated character runs: zzzz, xxx, 1111
  if (/(.)\1{2,}/i.test(alnum)) return true;

  const letters = alnum.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 10) return false;

  const vowels = (letters.match(/[aeiouy]/gi) ?? []).length;
  const vowelRatio = vowels / letters.length;

  // English prose usually sits ~35–45% vowels; random strings are often lower.
  if (vowelRatio < 0.22 && letters.length >= 12) return true;

  // Random mixed case produces frequent case flips mid-string.
  let caseSwitches = 0;
  let comparablePairs = 0;
  for (let i = 1; i < letters.length; i++) {
    const prev = letters[i - 1];
    const curr = letters[i];
    if (!prev || !curr) continue;
    const prevUpper =
      prev === prev.toUpperCase() && prev !== prev.toLowerCase();
    const currUpper =
      curr === curr.toUpperCase() && curr !== curr.toLowerCase();
    const prevLower =
      prev === prev.toLowerCase() && prev !== prev.toUpperCase();
    const currLower =
      curr === curr.toLowerCase() && curr !== curr.toUpperCase();
    if ((prevUpper || prevLower) && (currUpper || currLower)) {
      comparablePairs += 1;
      if (prevUpper !== currUpper) caseSwitches += 1;
    }
  }
  if (comparablePairs >= 8 && caseSwitches / comparablePairs > 0.4) {
    return true;
  }

  // Long consonant clusters are rare in real words.
  if (/[bcdfghjklmnpqrstvwxz]{5,}/i.test(letters) && letters.length >= 12) {
    return true;
  }

  // Long unbroken alphanumeric with almost no vowels.
  if (vowelRatio < 0.28 && letters.length >= 16 && !/\s/.test(token)) {
    return true;
  }

  return false;
}
