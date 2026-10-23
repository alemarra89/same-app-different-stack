import { initialParticipants } from '../data/event';
import type { Participant } from '../models/participant';
import type { CheckInRepository } from '../storage/checkInRepository';
import { processCheckIn } from './processCheckIn';
import { createScanGuard } from './scanGuard';

export type Feedback = Readonly<{ tone: 'success' | 'info' | 'error'; message: string }>;
export type CheckInSnapshot = Readonly<{
  participants: readonly Participant[]; ready: boolean; busy: boolean; feedback: Feedback | null;
}>;

export class CheckInService {
  private snapshot: CheckInSnapshot = {
    participants: initialParticipants(), ready: false, busy: false, feedback: null,
  };
  private readonly listeners = new Set<() => void>();
  private readonly acceptScan = createScanGuard();
  constructor(private readonly repository: CheckInRepository) {}
  getSnapshot = (): CheckInSnapshot => this.snapshot;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private update(patch: Partial<CheckInSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }
  async load(): Promise<void> {
    if (this.snapshot.busy || this.snapshot.ready) return;
    this.update({ busy: true });
    try {
      const participants = await this.repository.load();
      this.update({ participants, ready: true, feedback: null });
    } catch {
      this.update({ feedback: { tone: 'error', message:
        'Impossibile leggere lo stato locale. Riprova oppure reimposta la demo.' } });
    } finally { this.update({ busy: false }); }
  }
  async checkIn(code: string, source: 'manual' | 'scanner' = 'manual'): Promise<void> {
    if (!this.snapshot.ready || this.snapshot.busy) return;
    if (source === 'scanner' && !this.acceptScan(code)) return;
    const result = processCheckIn(code, this.snapshot.participants);
    if (result.status !== 'success') {
      this.update({ feedback: result.status === 'duplicate'
        ? { tone: 'info', message: 'Check-in già effettuato' }
        : { tone: 'error', message: 'QR non valido' } });
      return;
    }
    this.update({ busy: true });
    try {
      await this.repository.save(result.participants);
      this.update({ participants: result.participants, feedback: {
        tone: 'success', message: `Check-in effettuato: ${result.participant.name}`,
      } });
    } catch {
      this.update({ feedback: { tone: 'error', message:
        'Salvataggio non riuscito. Check-in non registrato: riprova.' } });
    } finally { this.update({ busy: false }); }
  }
  async reset(): Promise<void> {
    if (this.snapshot.busy) return;
    this.update({ busy: true });
    try {
      await this.repository.reset();
      this.update({ participants: initialParticipants(), ready: true,
        feedback: { tone: 'success', message: 'Demo reimpostata. Tutti i partecipanti sono in attesa.' } });
    } catch {
      this.update({ feedback: { tone: 'error', message:
        'Impossibile reimpostare la demo. Lo stato precedente è conservato.' } });
    } finally { this.update({ busy: false }); }
  }
}
