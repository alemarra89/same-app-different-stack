import { initialParticipants } from './data.js';

// Include the deployment path: two demos hosted on one origin remain independent.
export const STORAGE_KEY = `event-check-in:${new URL('../', import.meta.url).pathname}:tech-meetup-2026:v1`;

export function createRepository(getStorage = () => globalThis.localStorage, key = STORAGE_KEY) {
  return {
    load() {
      const raw = getStorage().getItem(key);
      const ids = raw === null ? [] : JSON.parse(raw);
      if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'string')) {
        throw new Error('Formato dei dati locali non valido');
      }
      return initialParticipants().map((person) => ({ ...person, checkedIn: ids.includes(person.id) }));
    },
    save(participants) {
      getStorage().setItem(key, JSON.stringify(participants.filter((person) => person.checkedIn).map((person) => person.id)));
    },
    reset() { getStorage().removeItem(key); },
  };
}
