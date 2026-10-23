import { Preferences } from '@capacitor/preferences';
import { createCheckInStorage } from './checkInStorage';

// UserDefaults/SharedPreferences on native platforms; localStorage on Web.
export const checkInStorage = createCheckInStorage(Preferences);
