import { useEffect, useSyncExternalStore } from 'react';
import { CheckInService } from '../domain/CheckInService';
import { localRepository } from '../storage/localRepository';

const service = new CheckInService(localRepository);
export function useCheckIn() {
  const snapshot = useSyncExternalStore(service.subscribe, service.getSnapshot);
  useEffect(() => { void service.load(); }, []);
  return { ...snapshot, service };
}
