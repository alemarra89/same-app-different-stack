export type Participant = Readonly<{ id: string; name: string; checkedIn: boolean }>;

export type CheckInResult =
  | { status: 'success'; participant: Participant; participants: readonly Participant[] }
  | { status: 'duplicate'; participant: Participant; participants: readonly Participant[] }
  | { status: 'invalid'; participants: readonly Participant[] };
