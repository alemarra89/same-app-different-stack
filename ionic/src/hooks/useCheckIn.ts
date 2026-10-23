import { useCallback, useEffect, useRef, useState } from 'react';
import { PARTICIPANTS } from '../data/event';
import { processCheckIn } from '../domain/checkIn';
import type { Participant } from '../models/participant';
import { checkInStorage } from '../storage/preferencesStorage';

export interface Notice { message: string; kind: 'success' | 'warning' | 'danger' | 'info'; sequence: number }

export function useCheckIn() {
  const [participants, setParticipants] = useState<readonly Participant[]>(PARTICIPANTS);
  const current = useRef<readonly Participant[]>(PARTICIPANTS);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const lock = useRef(false);
  const sequence = useRef(0);
  const notify = useCallback((message: string, kind: Notice['kind']) => {
    setNotice({ message, kind, sequence: ++sequence.current });
  }, []);

  useEffect(() => {
    let active = true;
    checkInStorage.load(PARTICIPANTS).then((restored) => {
      if (!active) return;
      current.current = restored;
      setParticipants(restored);
      setReady(true);
    }).catch(() => {
      if (!active) return;
      setStorageError(true);
      notify('Impossibile leggere i check-in salvati. Riapri l’app o reimposta la demo per riprovare.', 'danger');
    });
    return () => { active = false; };
  }, [notify]);

  const submit = async (id: string) => {
    if (lock.current || !ready) return;
    lock.current = true;
    setBusy(true);
    try {
      const result = processCheckIn(id, current.current);
      if (result.status === 'invalid') notify('QR non valido', 'danger');
      else if (result.status === 'duplicate') notify('Check-in già effettuato', 'warning');
      else {
        // Commit storage first: a failed write must never look like a saved check-in.
        await checkInStorage.save(result.participants);
        current.current = result.participants;
        setParticipants(result.participants);
        notify(`Check-in effettuato: ${result.participant.name}`, 'success');
      }
    } catch {
      notify('Salvataggio non riuscito. Il check-in non è stato registrato. Riprova.', 'danger');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const reset = async () => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      await checkInStorage.reset();
      current.current = PARTICIPANTS;
      setParticipants(PARTICIPANTS);
      setReady(true);
      setStorageError(false);
      notify('Demo reimpostata. Tutti i partecipanti sono in attesa.', 'info');
    } catch {
      notify('Impossibile reimpostare la demo. I check-in non sono stati modificati.', 'danger');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  return { participants, ready, busy, storageError, notice, notify, submit, reset };
}
