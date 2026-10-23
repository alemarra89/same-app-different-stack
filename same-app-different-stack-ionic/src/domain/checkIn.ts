import type { CheckInResult, Participant } from '../models/participant';

/** Case-sensitive IDs; the QR payload is only the ID. Does not mutate its inputs. */
export function processCheckIn(id: string, participants: readonly Participant[]): CheckInResult {
  const participant = participants.find((entry) => entry.id === id.trim());
  if (!participant) return { status: 'invalid', participants };
  if (participant.checkedIn) return { status: 'duplicate', participant, participants };
  const checkedIn = { ...participant, checkedIn: true };
  return {
    status: 'success', participant: checkedIn,
    participants: participants.map((entry) => entry.id === checkedIn.id ? checkedIn : entry),
  };
}
