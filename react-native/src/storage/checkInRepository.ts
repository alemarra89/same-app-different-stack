import { initialParticipants, SEED_PARTICIPANTS } from '../data/event';
import type { Participant } from '../models/participant';

export interface LocalStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}
export const CHECK_IN_STORAGE_KEY = '@event-check-in/tech-meetup-2026/check-ins/v1';

export class CheckInRepository {
  constructor(private readonly storage: LocalStorage) {}

  async load(): Promise<readonly Participant[]> {
    const raw = await this.storage.getItem(CHECK_IN_STORAGE_KEY);
    if (raw === null) return initialParticipants();
    const value: unknown = JSON.parse(raw);
    const validIds = new Set(SEED_PARTICIPANTS.map(({ id }) => id));
    if (!Array.isArray(value) || !value.every((id: unknown) => typeof id === 'string' && validIds.has(id))) {
      throw new Error('Stato locale non valido');
    }
    const checkedIds = new Set<string>(value as string[]);
    return initialParticipants().map((entry) => ({ ...entry, checkedIn: checkedIds.has(entry.id) }));
  }
  async save(participants: readonly Participant[]): Promise<void> {
    // Persist only check-in IDs; names, camera data and feedback stay in memory.
    await this.storage.setItem(CHECK_IN_STORAGE_KEY,
      JSON.stringify(participants.filter(({ checkedIn }) => checkedIn).map(({ id }) => id)));
  }
  async reset(): Promise<void> {
    await this.storage.removeItem(CHECK_IN_STORAGE_KEY);
  }
}
