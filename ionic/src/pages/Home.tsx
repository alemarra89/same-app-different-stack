import { useEffect, useRef, useState } from 'react';
import {
  IonAlert, IonButton, IonCard, IonCardContent, IonContent, IonHeader,
  IonIcon, IonInput, IonItem, IonLabel, IonList, IonPage, IonSearchbar,
  IonSpinner, IonTitle, IonToast, IonToolbar,
} from '@ionic/react';
import { calendarOutline, checkmarkOutline, peopleOutline, qrCodeOutline, refreshOutline, shieldCheckmarkOutline } from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { EVENT } from '../data/event';
import { createScanGuard } from '../domain/scanGuard';
import { useCheckIn } from '../hooks/useCheckIn';
import { qrScanner } from '../scanner';
import { SCANNER_MESSAGES } from '../scanner/types';
import './Home.css';

export default function Home() {
  const { participants, ready, busy, storageError, notice, notify, submit, reset } = useCheckIn();
  const [search, setSearch] = useState('');
  const [code, setCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [dismissedNotice, setDismissedNotice] = useState(0);
  const scanningLock = useRef(false);
  const acceptScan = useRef(createScanGuard());
  const manualInput = useRef<HTMLIonInputElement>(null);
  const searchbar = useRef<HTMLIonSearchbarElement>(null);
  useEffect(() => {
    // Ionic 9 labels the inner input "search text"; use its public DOM accessor
    // to provide the Italian accessible label, as host aria-label labels the region.
    void searchbar.current?.getInputElement().then((input) => {
      input.setAttribute('aria-label', 'Cerca per nome o ID');
      searchbar.current?.querySelector('.searchbar-clear-button')?.setAttribute('aria-label', 'Cancella ricerca');
    });
  }, []);
  const present = participants.filter((p) => p.checkedIn).length;
  const query = search.trim().toLocaleLowerCase('it');
  const filtered = participants.filter((p) => `${p.name} ${p.id}`.toLocaleLowerCase('it').includes(query));

  const scan = async () => {
    if (scanningLock.current) return;
    scanningLock.current = true;
    setScanning(true);
    try {
      const result = await qrScanner.scan();
      if (result.status === 'scanned' && acceptScan.current(result.id)) await submit(result.id);
      else if (result.status === 'unavailable') {
        notify(SCANNER_MESSAGES[result.reason], 'warning');
        await manualInput.current?.setFocus();
      } else if (result.status === 'cancelled') notify('Scansione annullata. Puoi inserire il codice manualmente.', 'info');
    } finally {
      scanningLock.current = false;
      setScanning(false);
    }
  };

  return (
    <IonPage>
      <IonHeader className="ion-no-border">
        <IonToolbar>
          <div className="brand-mark" slot="start" aria-hidden="true"><IonIcon icon={qrCodeOutline} /></div>
          <IonTitle>Event Check-in</IonTitle>
          <span className="local-indicator" slot="end"><span />Solo locale</span>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="page-shell">
          <section className="event-heading" aria-labelledby="event-title">
            <p className="eyebrow">CONTROLLO ACCESSI</p>
            <h1 id="event-title">{EVENT.name}</h1>
            <p className="event-date"><IonIcon icon={calendarOutline} aria-hidden="true" /><time dateTime="2026-10-23">{EVENT.date}</time><span className="date-dot">·</span>Meetup</p>
          </section>

          <IonCard className="attendance-card">
            <IonCardContent>
              <div className="attendance-top"><span className="card-label">PARTECIPAZIONE</span><IonIcon icon={peopleOutline} aria-hidden="true" /></div>
              <p className="attendance-count" role="status" aria-live="polite" data-testid="attendance">{present} <span>/ 6 presenti</span></p>
              <div className="attendance-track" role="progressbar" aria-label="Partecipanti presenti" aria-valuenow={present} aria-valuemin={0} aria-valuemax={6}><span style={{ width: `${present / 6 * 100}%` }} /></div>
              <p className="attendance-caption">{6 - present} {6 - present === 1 ? 'partecipante in attesa' : 'partecipanti in attesa'}</p>
            </IonCardContent>
          </IonCard>

          <div className="work-area">
            <section className="checkin-section" aria-labelledby="checkin-title">
              <div className="section-heading"><h2 id="checkin-title">Registra un ingresso</h2><span className="step-label">CHECK-IN</span></div>
              <IonCard className="entry-card"><IonCardContent>
                <div className="scan-symbol" aria-hidden="true"><IonIcon icon={qrCodeOutline} /></div>
                <h3>Un QR, e ci sei.</h3>
                <p>Inquadra il codice del partecipante<br />per confermare la sua presenza.</p>
                <IonButton expand="block" onClick={() => void scan()} disabled={!ready || busy || scanning} aria-label="Scansiona QR">
                  {scanning ? <IonSpinner name="crescent" slot="start" /> : <IonIcon icon={qrCodeOutline} slot="start" aria-hidden="true" />}
                  {scanning ? 'Scansione in corso…' : 'Scansiona QR'}
                </IonButton>
                {!Capacitor.isNativePlatform() && <p className="web-note">Sul Web usa l’inserimento manuale qui sotto.</p>}
                <div className="divider"><span>oppure inserisci il codice</span></div>
                <form onSubmit={(event) => { event.preventDefault(); void submit(code); }}>
                  <IonInput ref={manualInput} label="Codice partecipante" labelPlacement="stacked" fill="outline" placeholder="Es. EVT-001" value={code}
                    onIonInput={(event) => setCode(event.detail.value ?? '')} autocapitalize="off" autocorrect={false} spellcheck={false}
                    enterkeyhint="done" maxlength={100} disabled={!ready || busy} aria-describedby="code-help" />
                  <p id="code-help" className="input-help">Il codice è riportato sotto il QR del biglietto.</p>
                  <IonButton type="submit" expand="block" fill="outline" disabled={!ready || busy || !code.trim()}>
                    <IonIcon icon={checkmarkOutline} slot="start" aria-hidden="true" />Conferma check-in
                  </IonButton>
                </form>
              </IonCardContent></IonCard>
              {!ready && !storageError && <p className="loading-state" role="status"><IonSpinner name="dots" />Caricamento check-in…</p>}
              <div className={`notice ${notice ? `notice-${notice.kind}` : ''}`} role="status" aria-live="polite" aria-atomic="true" data-testid="notice">
                {notice && <><strong>{notice.kind === 'success' ? 'Ingresso registrato' : notice.kind === 'danger' ? 'Attenzione' : 'Informazione'}</strong><span>{notice.message}</span></>}
              </div>
            </section>

            <section className="participants-section" aria-labelledby="participants-title">
              <div className="section-heading"><h2 id="participants-title">Partecipanti</h2><span className="count-pill">6 iscritti</span></div>
              <IonSearchbar ref={searchbar} value={search} onIonInput={(event) => setSearch(event.detail.value ?? '')} debounce={0} cancelButtonText="Annulla" placeholder="Cerca per nome o ID" aria-label="Ricerca partecipanti" />
              <IonList className="participant-list" aria-label="Elenco partecipanti">
                {filtered.map((participant) => <IonItem key={participant.id} lines="none" className={`participant-row ${participant.checkedIn ? 'is-present' : ''}`} data-testid={participant.id}>
                  <span className="avatar" slot="start" aria-hidden="true">{participant.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                  <IonLabel><h3>{participant.name}</h3><p>{participant.id}</p></IonLabel>
                  <span slot="end" className={`status-badge ${participant.checkedIn ? 'present' : 'waiting'}`}>
                    {participant.checkedIn ? <IonIcon icon={checkmarkOutline} aria-hidden="true" /> : <span className="status-dot" />}
                    {participant.checkedIn ? 'Presente' : 'In attesa'}
                  </span>
                </IonItem>)}
                {filtered.length === 0 && <div className="empty-state">Nessun partecipante trovato.<br /><span>Prova con un altro nome o codice.</span></div>}
              </IonList>
              <p className="list-caption">{search.trim() ? `${filtered.length} risultati su 6 partecipanti` : 'Tutti i partecipanti del meetup'}</p>
            </section>
          </div>

          <footer className="page-footer"><p><IonIcon icon={shieldCheckmarkOutline} aria-hidden="true" />I check-in restano su questo dispositivo.</p>
            <IonButton fill="clear" color="medium" onClick={() => setResetOpen(true)} disabled={resetOpen || busy || scanning || (!ready && !storageError)}>
              <IonIcon icon={refreshOutline} slot="start" aria-hidden="true" />Reimposta demo
            </IonButton>
          </footer>
        </div>
        <IonAlert isOpen={resetOpen} onDidDismiss={() => setResetOpen(false)} header="Reimposta demo?" message="Tutti i check-in salvati su questo dispositivo verranno azzerati."
          buttons={[{ text: 'Annulla', role: 'cancel' }, { text: 'Reimposta', role: 'destructive', handler: () => { void reset(); } }]} />
        <IonToast key={notice?.sequence ?? 0} isOpen={!!notice && notice.sequence !== dismissedNotice} onDidDismiss={() => setDismissedNotice(notice?.sequence ?? 0)} message={notice?.message} duration={2500} position="bottom" buttons={[{ text: 'Chiudi', role: 'cancel' }]} />
      </IonContent>
    </IonPage>
  );
}
