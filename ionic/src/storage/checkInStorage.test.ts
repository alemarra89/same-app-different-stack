import { beforeEach, describe, expect, it } from 'vitest';
import { PARTICIPANTS } from '../data/event';
import { processCheckIn } from '../domain/checkIn';
import { createCheckInStorage, STORAGE_KEY, type KeyValueStorage } from './checkInStorage';

describe('local persistence adapter', () => {
  const values = new Map<string, string>();
  const driver: KeyValueStorage = {
    async get({ key }) { return { value: values.get(key) ?? null }; },
    async set({ key, value }) { values.set(key, value); },
    async remove({ key }) { values.delete(key); },
  };
  beforeEach(() => values.clear());
  it('loads empty storage as 0/6', async () => {
    expect(await createCheckInStorage(driver).load(PARTICIPANTS)).toEqual(PARTICIPANTS);
  });
  it('persists only IDs and restores across adapter instances', async () => {
    await createCheckInStorage(driver).save(processCheckIn('EVT-001', PARTICIPANTS).participants);
    expect(values.get(STORAGE_KEY)).toBe('["EVT-001"]');
    const restored = await createCheckInStorage(driver).load(PARTICIPANTS);
    expect(restored.filter((p) => p.checkedIn).map((p) => p.id)).toEqual(['EVT-001']);
  });
  it('reset only clears this event and survives reopening', async () => {
    values.set('other-app', 'untouched');
    const store = createCheckInStorage(driver);
    await store.save(processCheckIn('EVT-001', PARTICIPANTS).participants);
    await store.reset();
    expect(await createCheckInStorage(driver).load(PARTICIPANTS)).toEqual(PARTICIPANTS);
    expect(values.get('other-app')).toBe('untouched');
  });
  it('ignores obsolete IDs', async () => {
    values.set(STORAGE_KEY, '["EVT-002","UNKNOWN"]');
    const restored = await createCheckInStorage(driver).load(PARTICIPANTS);
    expect(restored).toHaveLength(6);
    expect(restored.filter((p) => p.checkedIn).map((p) => p.id)).toEqual(['EVT-002']);
  });
  it.each(['broken', '{}', '[123]'])('reports corrupted data %s', async (value) => {
    values.set(STORAGE_KEY, value);
    await expect(createCheckInStorage(driver).load(PARTICIPANTS)).rejects.toThrow();
    expect(values.get(STORAGE_KEY)).toBe(value);
  });
  it('propagates write failures', async () => {
    const store = createCheckInStorage({ ...driver, async set() { throw new Error('Disk full'); } });
    await expect(store.save(processCheckIn('EVT-001', PARTICIPANTS).participants)).rejects.toThrow('Disk full');
  });
});
