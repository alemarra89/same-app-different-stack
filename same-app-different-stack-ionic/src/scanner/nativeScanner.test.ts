import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ available: vi.fn(), scan: vi.fn(), check: vi.fn(), request: vi.fn(), hardware: vi.fn(), platform: vi.fn() }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isPluginAvailable: mocks.available, getPlatform: mocks.platform } }));
vi.mock('./cameraAvailability', () => ({ androidCameraAvailability: { check: mocks.hardware } }));
vi.mock('@capacitor/camera', () => ({ Camera: { checkPermissions: mocks.check, requestPermissions: mocks.request } }));
vi.mock('@capacitor/barcode-scanner', () => ({
  CapacitorBarcodeScanner: { scanBarcode: mocks.scan },
  CapacitorBarcodeScannerAndroidScanningLibrary: { ZXING: 'zxing' },
  CapacitorBarcodeScannerCameraDirection: { BACK: 1 },
  CapacitorBarcodeScannerTypeHint: { QR_CODE: 0 },
}));
import { classifyScannerError, nativeScanner } from './nativeScanner';
import { browserScanner } from './browserScanner';

describe('scanner adapters (native plugin mocked)', () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.available.mockReturnValue(true); mocks.platform.mockReturnValue('ios'); mocks.check.mockResolvedValue({ camera: 'granted' }); });
  it('does not open scanner UI when Android has no camera hardware', async () => {
    mocks.platform.mockReturnValue('android');
    mocks.hardware.mockResolvedValue({ available: false });
    expect(await nativeScanner.scan()).toEqual({ status: 'unavailable', reason: 'camera' });
    expect(mocks.scan).not.toHaveBeenCalled();
  });
  it('does not open scanner UI when camera permission is already denied', async () => {
    mocks.check.mockResolvedValue({ camera: 'denied' });
    expect(await nativeScanner.scan()).toEqual({ status: 'unavailable', reason: 'permission' });
    expect(mocks.scan).not.toHaveBeenCalled();
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it('requests only camera permission when needed', async () => {
    mocks.check.mockResolvedValue({ camera: 'prompt' });
    mocks.request.mockResolvedValue({ camera: 'granted' });
    mocks.scan.mockResolvedValue({ ScanResult: 'EVT-002' });
    expect(await nativeScanner.scan()).toEqual({ status: 'scanned', id: 'EVT-002' });
    expect(mocks.request).toHaveBeenCalledWith({ permissions: ['camera'] });
  });
  it('handles denial of the camera permission prompt', async () => {
    mocks.check.mockResolvedValue({ camera: 'prompt-with-rationale' });
    mocks.request.mockResolvedValue({ camera: 'denied' });
    expect(await nativeScanner.scan()).toEqual({ status: 'unavailable', reason: 'permission' });
    expect(mocks.scan).not.toHaveBeenCalled();
  });
  it('uses QR-only scanning and returns the unmodified payload', async () => {
    mocks.scan.mockResolvedValue({ ScanResult: ' EVT-002 ', format: 0 });
    expect(await nativeScanner.scan()).toEqual({ status: 'scanned', id: ' EVT-002 ' });
    expect(mocks.scan).toHaveBeenCalledWith(expect.objectContaining({ hint: 0, cameraDirection: 1 }));
  });
  it('handles a missing native plugin', async () => {
    mocks.available.mockReturnValue(false);
    expect(await nativeScanner.scan()).toEqual({ status: 'unavailable', reason: 'unsupported' });
    expect(mocks.scan).not.toHaveBeenCalled();
  });
  it('handles cancellation and empty results', async () => {
    mocks.scan.mockResolvedValue({ ScanResult: '' });
    expect(await nativeScanner.scan()).toEqual({ status: 'cancelled' });
    expect(classifyScannerError({ code: 'OS-PLUG-BARC-0006', message: '' })).toEqual({ status: 'cancelled' });
  });
  it('handles documented permission error code', async () => {
    mocks.scan.mockRejectedValue({ code: 'OS-PLUG-BARC-0007', message: '' });
    expect(await nativeScanner.scan()).toEqual({ status: 'unavailable', reason: 'permission' });
  });
  it('handles missing camera', () => {
    expect(classifyScannerError(new Error('No camera available'))).toEqual({ status: 'unavailable', reason: 'camera' });
  });
  it('offers a generic manual fallback for unclassified failures', () => {
    expect(classifyScannerError(new Error('Unexpected scanner failure'))).toEqual({ status: 'unavailable', reason: 'unknown' });
  });
  it('Web explicitly falls back to manual without invoking the native plugin', async () => {
    expect(await browserScanner.scan()).toEqual({ status: 'unavailable', reason: 'unsupported' });
    expect(mocks.scan).not.toHaveBeenCalled();
  });
});
