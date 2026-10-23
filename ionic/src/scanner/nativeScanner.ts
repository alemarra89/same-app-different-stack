import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import {
  CapacitorBarcodeScanner,
  CapacitorBarcodeScannerAndroidScanningLibrary,
  CapacitorBarcodeScannerCameraDirection,
  CapacitorBarcodeScannerTypeHint,
} from '@capacitor/barcode-scanner';
import type { QrScanner, ScanResult } from './types';
import { androidCameraAvailability } from './cameraAvailability';

export function classifyScannerError(error: unknown): ScanResult {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  const message = error instanceof Error ? error.message :
    typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : String(error);
  if (code === 'OS-PLUG-BARC-0006' || /cancel|dismiss/i.test(message)) return { status: 'cancelled' };
  if (code === 'OS-PLUG-BARC-0007' || /permission|denied|authorized/i.test(message)) return { status: 'unavailable', reason: 'permission' };
  if (/camera.*(unavailable|not found|not available)|no camera/i.test(message)) return { status: 'unavailable', reason: 'camera' };
  return { status: 'unavailable', reason: 'unknown' };
}
export const nativeScanner: QrScanner = {
  async scan() {
    if (!Capacitor.isPluginAvailable('CapacitorBarcodeScanner') || !Capacitor.isPluginAvailable('Camera')) {
      return { status: 'unavailable', reason: 'unsupported' };
    }
    try {
      // Explicit preflight prevents opening scanner UI with a blocked permission.
      // barcode-scanner has no permission API and can leave its promise pending
      // when permission is fixed as denied (observed on the Android emulator).
      let permission = await Camera.checkPermissions();
      if (permission.camera === 'prompt' || permission.camera === 'prompt-with-rationale') {
        permission = await Camera.requestPermissions({ permissions: ['camera'] });
      }
      if (permission.camera !== 'granted') return { status: 'unavailable', reason: 'permission' };
      if (Capacitor.getPlatform() === 'android') {
        const { available } = await androidCameraAvailability.check();
        if (!available) return { status: 'unavailable', reason: 'camera' };
      }
      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        cameraDirection: CapacitorBarcodeScannerCameraDirection.BACK,
        scanInstructions: 'Inquadra il QR del partecipante',
        scanText: 'Scansiona QR', scanButton: false,
        cancelButtonAccessibilityLabel: 'Annulla scansione',
        torchButtonOnAccessibilityLabel: 'Spegni torcia',
        torchButtonOffAccessibilityLabel: 'Accendi torcia',
        android: { scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.ZXING },
      });
      return result.ScanResult.trim() ? { status: 'scanned', id: result.ScanResult } : { status: 'cancelled' };
    } catch (error) { return classifyScannerError(error); }
  },
};
