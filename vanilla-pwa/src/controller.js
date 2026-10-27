import { initialParticipants } from './data.js';
import { processCheckIn, createScanGuard } from './check-in.js';

export function createController(repository, onChange, guard = createScanGuard()) {
  let state = { participants: initialParticipants(), ready: false, feedback: null };
  const update = (patch) => { state = { ...state, ...patch }; onChange(state); };
  return {
    get state() { return state; },
    load() {
      try { update({ participants: repository.load(), ready: true, feedback: null }); }
      catch {
        update({ ready: false, feedback: { tone: 'error', message: 'Impossibile leggere i check-in salvati. Riprova o reimposta la demo.' } });
      }
    },
    checkIn(code, source = 'manual') {
      if (!state.ready || (source === 'scanner' && !guard.accept(code))) return;
      const result = processCheckIn(code, state.participants);
      try {
        if (result.status === 'success') repository.save(result.participants);
        update({ participants: result.participants, feedback: {
          tone: result.status === 'invalid' ? 'error' : result.status === 'duplicate' ? 'warning' : 'success',
          message: result.message,
        } });
        return result.status;
      } catch {
        guard.clear();
        update({ feedback: { tone: 'error', message: 'Salvataggio non riuscito. Check-in non registrato: riprova.' } });
        return 'error';
      }
    },
    reset() {
      try {
        repository.reset();
        guard.clear();
        update({ participants: initialParticipants(), ready: true, feedback: {
          tone: 'success', message: 'Demo reimpostata. Tutti i partecipanti sono in attesa.',
        } });
        return true;
      } catch {
        update({ feedback: { tone: 'error', message: 'Impossibile reimpostare la demo. Lo stato precedente è conservato.' } });
        return false;
      }
    },
  };
}
