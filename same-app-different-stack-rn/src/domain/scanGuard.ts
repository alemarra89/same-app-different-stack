/** Rolling one-second guard, scoped to each trimmed QR payload. */
export function createScanGuard(now: () => number = Date.now) {
  const seen = new Map<string, number>();
  return (rawCode: string): boolean => {
    const time = now();
    const code = rawCode.trim();
    for (const [key, timestamp] of seen) {
      if (time - timestamp >= 1000 || time < timestamp) seen.delete(key);
    }
    if (seen.has(code)) return false;
    seen.set(code, time);
    return true;
  };
}
