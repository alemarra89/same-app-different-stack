import { registerPlugin } from '@capacitor/core';

interface CameraAvailability {
  check(): Promise<{ available: boolean }>;
}

export const androidCameraAvailability = registerPlugin<CameraAvailability>('CheckInCameraAvailability');
