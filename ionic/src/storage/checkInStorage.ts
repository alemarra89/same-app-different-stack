import type { Participant } from '../models/participant';

export const STORAGE_KEY = 'event-check-in.tech-meetup-2026.v1';
export interface KeyValueStorage {
  get(options: { key: string }): Promise<{ value: string | null }>;
  set(options: { key: string; value: string }): Promise<void>;
  remove(options: { key: string }): Promise<void>;
}
/** Stores only checked-in IDs; names, event data and searches are never persisted. */
export function createCheckInStorage(storage: KeyValueStorage) {
  return {
    async load(seed: readonly Participant[]): Promise<readonly Participant[]> {
      const { value } = await storage.get({ key: STORAGE_KEY });
      if (value === null) return seed;
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed) || !parsed.every((id) => typeof id === 'string')) {
        throw new Error('Invalid local check-in data');
      }
      const ids = new Set<string>(parsed);
      return seed.map((participant) => ({ ...participant, checkedIn: ids.has(participant.id) }));
    },
    async save(participants: readonly Participant[]): Promise<void> {
      await storage.set({ key: STORAGE_KEY,
        value: JSON.stringify(participants.filter((p) => p.checkedIn).map((p) => p.id)) });
    },
    async reset(): Promise<void> { await storage.remove({ key: STORAGE_KEY }); },
  };
}
