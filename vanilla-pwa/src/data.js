export const EVENT = Object.freeze({ name: 'Tech Meetup 2026', date: '23/10/2026' });

export const PARTICIPANTS = Object.freeze([
  { id: 'EVT-001', name: 'Giulia Rossi', checkedIn: false },
  { id: 'EVT-002', name: 'Marco Bianchi', checkedIn: false },
  { id: 'EVT-003', name: 'Sara De Luca', checkedIn: false },
  { id: 'EVT-004', name: 'Davide Greco', checkedIn: false },
  { id: 'EVT-005', name: 'Fabio Conti', checkedIn: false },
  { id: 'EVT-006', name: 'Ivan Moretti', checkedIn: false },
].map(Object.freeze));

export const initialParticipants = () => PARTICIPANTS.map((person) => ({ ...person }));
