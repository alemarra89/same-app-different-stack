import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { initialParticipants, PARTICIPANTS } from '../src/data.js';
import { processCheckIn, createScanGuard } from '../src/check-in.js';
import { createRepository, STORAGE_KEY } from '../src/storage.js';
import { createController } from '../src/controller.js';

function memoryStore() {
  const data = new Map();
  return { data, getItem: (key) => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: (key) => data.delete(key) };
}

test('six original IDs/names match all four implementations', async () => {
  const originals = ['react-native/src/data/event.ts', 'ionic/src/data/event.ts', 'flutter/lib/data/event_seed.dart', 'kotlin-multiplatform/shared/src/commonMain/kotlin/it/eventcheckin/data/EventSeed.kt'];
  for (const file of originals) {
    const source = await readFile(new URL(`../../${file}`, import.meta.url), 'utf8');
    for (const person of PARTICIPANTS) {
      assert.ok(source.includes(person.id));
      assert.ok(source.includes(person.name));
    }
    assert.equal((source.match(/EVT-00[1-6]/g) || []).length, 6);
  }
  assert.equal(PARTICIPANTS.length, 6);
  assert.equal(PARTICIPANTS.filter((p) => p.checkedIn).length, 0);
});

test('valid QR, outer whitespace, immutable input and duplicate', () => {
  const before = initialParticipants();
  const result = processCheckIn(' \nEVT-002\t ', before);
  assert.equal(result.status, 'success');
  assert.equal(result.message, 'Check-in effettuato: Marco Bianchi');
  assert.equal(result.participants.filter((p) => p.checkedIn).length, 1);
  assert.equal(before[1].checkedIn, false);
  const duplicate = processCheckIn('EVT-002', result.participants);
  assert.equal(duplicate.status, 'duplicate');
  assert.equal(duplicate.message, 'Check-in già effettuato');
  assert.equal(duplicate.participants, result.participants);
});

test('unknown, empty, lowercase, URLs and JSON are invalid', () => {
  for (const code of ['EVT-999', 'ERR-999', '', '   ', 'evt-001', 'https://example.com/EVT-001', '{"id":"EVT-001"}', null]) {
    const result = processCheckIn(code, initialParticipants());
    assert.equal(result.status, 'invalid');
    assert.equal(result.message, 'QR non valido');
    assert.equal(result.participants.filter((p) => p.checkedIn).length, 0);
  }
});

test('all six check-ins reach 6/6', () => {
  let participants = initialParticipants();
  for (const person of participants) participants = processCheckIn(person.id, participants).participants;
  assert.equal(participants.filter((p) => p.checkedIn).length, 6);
});

test('guard: one second per trimmed payload, interleaving, expiry and clear', () => {
  let time = 0;
  const gate = createScanGuard(() => time);
  assert.equal(gate.accept('EVT-001'), true);
  time = 999;
  assert.equal(gate.accept(' EVT-001 '), false);
  assert.equal(gate.accept('EVT-002'), true);
  assert.equal(gate.accept('EVT-001'), false);
  time = 1000;
  assert.equal(gate.accept('EVT-001'), true);
  gate.clear();
  assert.equal(gate.accept('EVT-001'), true);
});

test('storage persists only IDs, restores on new repository, reset preserves other keys', () => {
  const driver = memoryStore();
  driver.setItem('other-app', 'keep');
  const repository = createRepository(() => driver);
  repository.save(processCheckIn('EVT-003', initialParticipants()).participants);
  assert.equal(driver.getItem(STORAGE_KEY), '["EVT-003"]');
  const reopened = createRepository(() => driver);
  assert.equal(reopened.load()[2].checkedIn, true);
  reopened.reset();
  assert.equal(createRepository(() => driver).load().filter((p) => p.checkedIn).length, 0);
  assert.equal(driver.getItem('other-app'), 'keep');
});

test('storage ignores unknown IDs, rejects malformed data without overwriting it', () => {
  const driver = memoryStore();
  const repository = createRepository(() => driver);
  driver.setItem(STORAGE_KEY, '["EVT-002","UNKNOWN","EVT-002"]');
  assert.equal(repository.load().filter((p) => p.checkedIn).length, 1);
  for (const raw of ['broken', '{}', 'null', '[1]', '[true]']) {
    driver.setItem(STORAGE_KEY, raw);
    assert.throws(() => repository.load());
    assert.equal(driver.getItem(STORAGE_KEY), raw);
  }
});

test('controller commits before success; read/write/reset failures preserve state', () => {
  const driver = memoryStore();
  const controller = createController(createRepository(() => driver), () => {});
  controller.load();
  assert.equal(controller.checkIn('EVT-001'), 'success');
  driver.setItem = () => { throw new Error('Disk full'); };
  assert.equal(controller.checkIn('EVT-002'), 'error');
  assert.equal(controller.state.participants.filter((p) => p.checkedIn).length, 1);
  assert.match(controller.state.feedback.message, /non registrato/);
  driver.removeItem = () => { throw new Error('Access denied'); };
  assert.equal(controller.reset(), false);
  assert.equal(controller.state.participants[0].checkedIn, true);
  const inaccessible = createController(createRepository(() => { throw new Error('SecurityError'); }), () => {});
  inaccessible.load();
  assert.equal(inaccessible.state.ready, false);
  assert.equal(inaccessible.checkIn('EVT-001'), undefined);
});

test('controller suppresses consecutive scans, allows manual duplicate, reset clears guard', () => {
  const controller = createController(createRepository(() => memory), () => {}, createScanGuard(() => 0));
  const memory = memoryStore();
  controller.load();
  assert.equal(controller.checkIn('EVT-001', 'scanner'), 'success');
  assert.equal(controller.checkIn('EVT-001', 'scanner'), undefined);
  assert.equal(controller.checkIn('EVT-001'), 'duplicate');
  controller.reset();
  assert.equal(controller.state.participants.filter((p) => p.checkedIn).length, 0);
  assert.equal(controller.checkIn('EVT-001', 'scanner'), 'success');
});

test('corrupt storage blocks check-ins until successful reset', () => {
  const driver = memoryStore();
  driver.setItem(STORAGE_KEY, 'broken');
  const controller = createController(createRepository(() => driver), () => {});
  controller.load();
  assert.equal(controller.state.ready, false);
  assert.equal(controller.checkIn('EVT-001'), undefined);
  assert.equal(driver.getItem(STORAGE_KEY), 'broken');
  assert.equal(controller.reset(), true);
  assert.equal(controller.state.ready, true);
});

test('local decoder is the pinned unmodified jsQR 1.4.0 distribution', async () => {
  const bytes = await readFile(new URL('../vendor/jsQR.js', import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), 'bc40c8a15196236b2314db0856f72ca0b49980cd5413b8c852a7349f5fee0859');
});
