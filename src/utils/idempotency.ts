/**
 * In-process idempotency cache for write endpoints.
 * NOTE: not shared across instances — acceptable for the demo fixture only.
 */
const seenKeys = new Map<string, string>();

export function rememberIdempotencyKey(key: string, resourceId: string): void {
  seenKeys.set(key, resourceId);
}

export function findByIdempotencyKey(key: string): string | undefined {
  return seenKeys.get(key);
}

/** Test helper */
export function clearIdempotencyCache(): void {
  seenKeys.clear();
}
