import type { QrScanner } from './types';

/** Explicit Web fallback: never invokes the native plugin or requests a camera. */
export const browserScanner: QrScanner = {
  async scan() { return { status: 'unavailable', reason: 'unsupported' }; },
};
