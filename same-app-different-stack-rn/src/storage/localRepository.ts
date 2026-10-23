import AsyncStorage from '@react-native-async-storage/async-storage';
import { CheckInRepository } from './checkInRepository';

export const localRepository = new CheckInRepository(AsyncStorage);
