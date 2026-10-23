import { describe, expect, it } from 'vitest';
import { PARTICIPANTS } from '../data/event';
import { processCheckIn } from './checkIn';
import { createScanGuard } from './scanGuard';

describe('processCheckIn', () => {
  it('starts with six participants and no check-ins', () => {
    expect(PARTICIPANTS.map((p) => p.id)).toEqual(['EVT-001', 'EVT-002', 'EVT-003', 'EVT-004', 'EVT-005', 'EVT-006']);
    expect(PARTICIPANTS.map((p) => p.name)).toEqual(['Giulia Rossi', 'Marco Bianchi', 'Sara De Luca', 'Davide Greco', 'Fabio Conti', 'Ivan Moretti']);
    expect(PARTICIPANTS.every((p) => !p.checkedIn)).toBe(true);
  });
  it('checks in a valid ID without mutating the input', () => {
    const result = processCheckIn('EVT-001', PARTICIPANTS);
    expect(result.status).toBe('success');
    expect(result.participants.filter((p) => p.checkedIn).map((p) => p.name)).toEqual(['Giulia Rossi']);
    expect(PARTICIPANTS[0].checkedIn).toBe(false);
  });
  it('does not increment a duplicate', () => {
    const first = processCheckIn('EVT-001', PARTICIPANTS);
    const duplicate = processCheckIn('EVT-001', first.participants);
    expect(duplicate.status).toBe('duplicate');
    expect(duplicate.participants).toBe(first.participants);
    expect(duplicate.participants.filter((p) => p.checkedIn)).toHaveLength(1);
  });
  it.each(['ERR-999', '', 'evt-001', 'https://example.com/EVT-001', '{"id":"EVT-001"}'])('rejects invalid payload %s', (id) => {
    expect(processCheckIn(id, PARTICIPANTS)).toEqual({ status: 'invalid', participants: PARTICIPANTS });
  });
  it('trims whitespace', () => {
    expect(processCheckIn(' \n EVT-001 \t ', PARTICIPANTS).status).toBe('success');
  });
});
describe('camera duplicate guard', () => {
  it('ignores repeated trimmed payloads inside one second', () => {
    const accept = createScanGuard();
    expect(accept('EVT-001', 0)).toBe(true);
    expect(accept(' EVT-001 ', 999)).toBe(false);
    expect(accept('EVT-002', 999)).toBe(true);
    expect(accept('EVT-001', 1000)).toBe(true);
  });
  it('remembers interleaved payloads in the same second', () => {
    const accept = createScanGuard();
    expect(accept('EVT-001', 0)).toBe(true);
    expect(accept('EVT-002', 10)).toBe(true);
    expect(accept('EVT-001', 20)).toBe(false);
  });
});
