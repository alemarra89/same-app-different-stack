import { Capacitor } from '@capacitor/core';
import { browserScanner } from './browserScanner';
import type { QrScanner } from './types';

export const qrScanner: QrScanner = {
  async scan() {
    if (!Capacitor.isNativePlatform()) return browserScanner.scan();
    const { nativeScanner } = await import('./nativeScanner');
    return nativeScanner.scan();
  },
};
