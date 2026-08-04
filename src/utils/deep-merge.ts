/**
 * Recursively merges the enumerable properties of `source` into `target`,
 * descending into nested objects so a partial update (for example a webhook
 * that only sends the fields that changed) does not clobber sibling keys that
 * were not included in the payload. Mutates and returns `target`.
 */
export function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  for (const key of Object.keys(source)) {
    const incoming = source[key];
    const existing = target[key];

    if (isPlainObject(incoming) && isPlainObject(existing)) {
      deepMerge(existing, incoming);
    } else {
      target[key] = incoming;
    }
  }

  return target;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
