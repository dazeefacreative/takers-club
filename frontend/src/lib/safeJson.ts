// localStorage.getItem() can return the literal string "undefined" (e.g. if
// something once did localStorage.setItem(key, JSON.stringify(undefinedValue))
// — JSON.stringify(undefined) is itself undefined, which setItem coerces to
// the string "undefined"). That string is truthy, so a plain `if (raw)` guard
// doesn't catch it, and JSON.parse("undefined") throws. This treats any
// unparseable value as absent and clears the bad entry so it doesn't keep
// failing on every future load.
export function safeJsonParse<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}
