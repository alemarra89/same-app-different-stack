/** Suppresses the same camera payload for 1000 ms; manual entry is independent. */
export function createScanGuard() {
  const seen = new Map<string, number>();
  return (rawId: string, now = Date.now()): boolean => {
    for (const [id, timestamp] of seen) {
      if (now - timestamp >= 1000) seen.delete(id);
    }
    const id = rawId.trim();
    if (seen.has(id)) return false;
    seen.set(id, now);
    return true;
  };
}
