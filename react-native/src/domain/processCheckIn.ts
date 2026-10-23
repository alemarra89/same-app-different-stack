import type { CheckInResult, Participant } from '../models/participant';

export function processCheckIn(id: string, participants: readonly Participant[]): CheckInResult {
  const participant = participants.find((entry) => entry.id === id.trim());
  if (!participant) return { status: 'invalid', participants };
  if (participant.checkedIn) return { status: 'duplicate', participant, participants };
  const checkedInParticipant = { ...participant, checkedIn: true };
  return {
    status: 'success', participant: checkedInParticipant,
    participants: participants.map((entry) => entry.id === participant.id ? checkedInParticipant : entry),
  };
}
