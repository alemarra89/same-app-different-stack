export interface Participant {
  readonly id: string;
  readonly name: string;
  readonly checkedIn: boolean;
}
export type CheckInResult =
  | { readonly status: 'success'; readonly participant: Participant; readonly participants: readonly Participant[] }
  | { readonly status: 'duplicate'; readonly participant: Participant; readonly participants: readonly Participant[] }
  | { readonly status: 'invalid'; readonly participants: readonly Participant[] };
