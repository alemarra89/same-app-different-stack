# Analisi di equivalenza — 27/10/2026

Non risulta una specifica originale separata tra i file tracciati del repository.
Il riferimento è il comportamento concorde delle quattro implementazioni,
confrontando i loro README e il codice effettivo. Nessuna di esse è stata modificata.
Le modifiche preesistenti a React Native sono state lasciate intatte.

## Fonti confrontate

| Implementazione | Fonti principali nella relativa cartella |
| --- | --- |
| React Native | `src/data/event.ts`, `src/domain/processCheckIn.ts`, `src/domain/scanGuard.ts`, `src/domain/CheckInService.ts`, `src/storage/checkInRepository.ts`, `src/screens/CheckInScreen.tsx`, `README.md` |
| Flutter | `lib/data/event_seed.dart`, `lib/logic/check_in.dart`, `lib/logic/check_in_controller.dart`, `lib/logic/scan_gate.dart`, `lib/screens/event_screen.dart`, `lib/scanner/qr_scanner.dart`, `README.md` |
| Kotlin Multiplatform | `shared/src/commonMain/kotlin/it/eventcheckin/data/EventSeed.kt`, `data/CheckInRepository.kt`, `domain/CheckIn.kt`, `domain/ScanGate.kt`, `ui/EventCheckInApp.kt`, `README.md` |
| Ionic | `src/data/event.ts`, `src/domain/checkIn.test.ts`, `src/hooks/useCheckIn.ts`, `src/storage/checkInStorage.ts`, `src/pages/Home.tsx`, `src/scanner/`, `tests/e2e/check-in.spec.ts`, `README.md` |

I percorsi KMP abbreviati dopo la prima voce sono relativi allo stesso package
`shared/src/commonMain/kotlin/it/eventcheckin/`.

## Contratto comune conservato

- Tech Meetup 2026, data 23/10/2026, interfaccia italiana.
- Esattamente sei ID da EVT-001 a EVT-006; stessi nomi e stesso ordine.
- Una sola schermata: evento, presenze, ingresso via QR/manuale, ricerca, elenco, reset.
- QR testuale con ID esatto: solo trim, nessuna conversione di maiuscole o parsing URL/JSON.
- Stesso risultato per sconosciuto e invalido (`QR non valido`).
- Successo cambia un solo partecipante e incrementa il conteggio una volta.
- Duplicato segnala `Check-in già effettuato` e mantiene il totale.
- Finestra di un secondo per payload dello scanner; manuale non limitato.
- Ricerca per nome/ID; il conteggio globale non dipende dal filtro.
- Stato persistente locale, pubblicato alla UI soltanto dopo salvataggio riuscito.
- Reset confermato, tutti in attesa; gli altri dati locali non vengono eliminati.

Il test `tests/check-in.test.mjs` confronta direttamente i sei nomi/ID con i quattro
seed e verifica logica pura, guardia, persistenza ed errori.

## Scelte per il Web

Le app originali usano scanner/plugin nativi; le loro anteprime Web affidano il
check-in al modulo manuale. Questa implementazione estende il canale Web con
camera reale via getUserMedia e decoder locale jsQR, senza cambiare il contratto QR.
Non esiste un selettore che simuli Mobile/Web/Desktop: le tre modalità sono lo stesso
HTML servito al browser o avviato dall’installazione del manifest.

localStorage conserva solo gli ID presenti, come i repository originali.
Il namespace incorpora il percorso per isolare distribuzioni affiancate.
Gli ID sconosciuti nello storage vengono ignorati, mentre JSON/schema illeggibili
richiedono riprova o reset: non si sovrascrive silenziosamente uno stato corrotto.

Il colore verde, la testata di accoglienza, la scheda evento, le iniziali dei nomi
e i badge riprendono la versione React Native, con due colonne su desktop e una su mobile.
La data è quella dell’evento originale, non la data corrente del dispositivo.

Fotocamera e cache operano interamente sul dispositivo. Il worker è confinato
alla cartella pubblicata, mantiene cache versionate e aspetta un aggiornamento
esplicito prima di sostituire la versione aperta. Nessuna sincronizzazione remota.
