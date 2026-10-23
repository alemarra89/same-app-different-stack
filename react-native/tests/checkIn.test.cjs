const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, readFile, writeFile, unlink, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { initialParticipants } = require('../.test-build/data/event');
const { processCheckIn } = require('../.test-build/domain/processCheckIn');
const { createScanGuard } = require('../.test-build/domain/scanGuard');
const { CheckInService } = require('../.test-build/domain/CheckInService');
const { CheckInRepository, CHECK_IN_STORAGE_KEY } = require('../.test-build/storage/checkInRepository');

function memoryStorage(initial = null) {
  let value = initial;
  return {
    getItem: async () => value,
    setItem: async (_key, next) => { value = next; },
    removeItem: async () => { value = null; },
  };
}
const count = (participants) => participants.filter((p) => p.checkedIn).length;

test('prima apertura: i sei partecipanti invarianti sono tutti in attesa', () => {
  assert.deepEqual(initialParticipants().map(({ id, name }) => ({ id, name })), [
    { id: 'EVT-001', name: 'Giulia Rossi' }, { id: 'EVT-002', name: 'Marco Bianchi' },
    { id: 'EVT-003', name: 'Sara De Luca' }, { id: 'EVT-004', name: 'Davide Greco' },
    { id: 'EVT-005', name: 'Fabio Conti' }, { id: 'EVT-006', name: 'Ivan Moretti' },
  ]);
  assert.equal(count(initialParticipants()), 0);
});
test('valido: registra Giulia e non modifica l’input', () => {
  const seed = Object.freeze(initialParticipants().map(Object.freeze));
  const result = processCheckIn('EVT-001', seed);
  assert.equal(result.status, 'success');
  assert.equal(result.participant.name, 'Giulia Rossi');
  assert.equal(result.participant.checkedIn, true);
  assert.equal(count(result.participants), 1);
  assert.equal(count(seed), 0);
});
test('duplicato: nessun incremento, stesso stato', () => {
  const first = processCheckIn('EVT-001', initialParticipants());
  const result = processCheckIn('EVT-001', first.participants);
  assert.equal(result.status, 'duplicate');
  assert.equal(count(result.participants), 1);
  assert.equal(result.participants, first.participants);
});
test('sconosciuto: ERR-999 non altera le presenze', () => {
  const seed = initialParticipants();
  const result = processCheckIn('ERR-999', seed);
  assert.equal(result.status, 'invalid');
  assert.equal(result.participants, seed);
});
test('trim: accetta spazi, tab e newline ai bordi', () => {
  assert.equal(processCheckIn(' \tEVT-001\r\n ', initialParticipants()).status, 'success');
});
test('schema esatto: URL, JSON, lowercase e spazi interni non sono ID validi', () => {
  for (const code of ['', '   ', 'evt-001', 'EVT- 001', 'https://example.com/EVT-001', '{"id":"EVT-001"}']) {
    assert.equal(processCheckIn(code, initialParticipants()).status, 'invalid', code);
  }
});
test('sei check-in distinti: contatore massimo 6', () => {
  let participants = initialParticipants();
  for (const { id } of participants) participants = processCheckIn(id, participants).participants;
  assert.equal(count(participants), 6);
});
test('scanner: blocco duplicati in finestra mobile di 1000 ms, anche tra secondi diversi', () => {
  let now = 1999;
  const accept = createScanGuard(() => now);
  assert.equal(accept(' EVT-001 '), true);
  now = 2001;
  assert.equal(accept('EVT-001'), false);
  assert.equal(accept('EVT-002'), true);
  now = 2998;
  assert.equal(accept('EVT-001'), false);
  now = 2999;
  assert.equal(accept('EVT-001'), true);
});
test('storage: persiste solo gli ID e ripristina nomi dal seed', async () => {
  const storage = memoryStorage();
  const repository = new CheckInRepository(storage);
  await repository.save(processCheckIn('EVT-002', initialParticipants()).participants);
  assert.equal(await storage.getItem(CHECK_IN_STORAGE_KEY), '["EVT-002"]');
  const restored = await new CheckInRepository(storage).load();
  assert.equal(restored[1].name, 'Marco Bianchi');
  assert.equal(restored[1].checkedIn, true);
  assert.equal(count(restored), 1);
});
test('persistenza su file: nuova istanza rilegge il check-in, reset elimina la chiave', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'event-check-in-'));
  const createDiskStorage = () => ({
    getItem: async (key) => {
      try { return await readFile(path.join(directory, encodeURIComponent(key)), 'utf8'); }
      catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    },
    setItem: (key, value) => writeFile(path.join(directory, encodeURIComponent(key)), value),
    removeItem: async (key) => {
      try { await unlink(path.join(directory, encodeURIComponent(key))); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    },
  });
  try {
    const first = new CheckInService(new CheckInRepository(createDiskStorage()));
    await first.load();
    await first.checkIn('EVT-001');
    const reopened = new CheckInService(new CheckInRepository(createDiskStorage()));
    await reopened.load();
    assert.equal(count(reopened.getSnapshot().participants), 1);
    await reopened.reset();
    const afterReset = new CheckInService(new CheckInRepository(createDiskStorage()));
    await afterReset.load();
    assert.equal(count(afterReset.getSnapshot().participants), 0);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('storage corrotto o ID estranei: errore esplicito, nessuna sovrascrittura', async () => {
  for (const raw of ['{', '{}', '["ERR-999"]', '[1]', 'null']) {
    const storage = memoryStorage(raw);
    const service = new CheckInService(new CheckInRepository(storage));
    await service.load();
    assert.equal(service.getSnapshot().ready, false);
    await service.checkIn('EVT-001');
    assert.equal(await storage.getItem(CHECK_IN_STORAGE_KEY), raw);
    await service.reset();
    assert.equal(service.getSnapshot().ready, true);
  }
});
test('criteri 1–6: apertura, valido, duplicato, sconosciuto, riapertura, reset', async () => {
  const storage = memoryStorage();
  const service = new CheckInService(new CheckInRepository(storage));
  await service.load();
  assert.equal(count(service.getSnapshot().participants), 0);
  await service.checkIn('EVT-001');
  assert.equal(count(service.getSnapshot().participants), 1);
  assert.equal(service.getSnapshot().feedback.message, 'Check-in effettuato: Giulia Rossi');
  await service.checkIn('EVT-001');
  assert.equal(count(service.getSnapshot().participants), 1);
  assert.equal(service.getSnapshot().feedback.message, 'Check-in già effettuato');
  await service.checkIn('ERR-999');
  assert.equal(count(service.getSnapshot().participants), 1);
  assert.equal(service.getSnapshot().feedback.message, 'QR non valido');
  const reopened = new CheckInService(new CheckInRepository(storage));
  await reopened.load();
  assert.equal(count(reopened.getSnapshot().participants), 1);
  await reopened.reset();
  assert.equal(count(reopened.getSnapshot().participants), 0);
});
test('errore scrittura: non conferma e non incrementa, consente di riprovare', async () => {
  const storage = memoryStorage();
  const save = storage.setItem;
  storage.setItem = async () => { throw new Error('disco pieno'); };
  const service = new CheckInService(new CheckInRepository(storage));
  await service.load();
  await service.checkIn('EVT-001');
  assert.equal(count(service.getSnapshot().participants), 0);
  assert.equal(service.getSnapshot().feedback.tone, 'error');
  assert.equal(service.getSnapshot().busy, false);
  storage.setItem = save;
  await service.checkIn('EVT-001');
  assert.equal(count(service.getSnapshot().participants), 1);
});
test('concorrenza: durante il salvataggio non si perdono aggiornamenti e non si avvia reset', async () => {
  const storage = memoryStorage();
  let finish;
  storage.setItem = () => new Promise((resolve) => { finish = resolve; });
  const service = new CheckInService(new CheckInRepository(storage));
  await service.load();
  const pending = service.checkIn('EVT-001');
  assert.equal(service.getSnapshot().busy, true);
  await service.checkIn('EVT-002');
  await service.reset();
  finish();
  await pending;
  assert.equal(count(service.getSnapshot().participants), 1);
  assert.equal(service.getSnapshot().participants[0].checkedIn, true);
});
test('errore reset: conserva lo stato precedente', async () => {
  const storage = memoryStorage('["EVT-001"]');
  storage.removeItem = async () => { throw new Error('storage non disponibile'); };
  const service = new CheckInService(new CheckInRepository(storage));
  await service.load();
  await service.reset();
  assert.equal(count(service.getSnapshot().participants), 1);
  assert.equal(service.getSnapshot().feedback.tone, 'error');
});
test('scanner e manuale condividono il processo; manuale non viene limitato dal debounce', async () => {
  const service = new CheckInService(new CheckInRepository(memoryStorage()));
  await service.load();
  await service.checkIn('EVT-002', 'scanner');
  const feedback = service.getSnapshot().feedback;
  await service.checkIn(' EVT-002 ', 'scanner');
  assert.equal(service.getSnapshot().feedback, feedback);
  await service.checkIn('EVT-002', 'manual');
  assert.equal(service.getSnapshot().feedback.message, 'Check-in già effettuato');
});
