// The QR contains only the ID: trim whitespace, preserve case, never parse URLs/JSON.
export function processCheckIn(raw, participants) {
  const id = typeof raw === 'string' ? raw.trim() : '';
  const participant = participants.find((person) => person.id === id);
  if (!participant) return { status: 'invalid', participants, message: 'QR non valido' };
  if (participant.checkedIn) {
    return { status: 'duplicate', participants, message: 'Check-in già effettuato' };
  }
  return {
    status: 'success',
    participants: participants.map((person) => person.id === id ? { ...person, checkedIn: true } : person),
    message: `Check-in effettuato: ${participant.name}`,
  };
}

export function createScanGuard(now = () => performance.now()) {
  const recent = new Map();
  return {
    accept(raw) {
      const time = now();
      const code = raw.trim();
      for (const [key, timestamp] of recent) {
        if (time - timestamp >= 1000 || time < timestamp) recent.delete(key);
      }
      if (recent.has(code)) return false;
      recent.set(code, time);
      return true;
    },
    clear() { recent.clear(); },
  };
}
