# Ionic — build debug e verifica Android

Verifica del **24/10/2026**, fuso **Europe/Rome**, sui sorgenti correnti. APK debug compilato, installato e avviato sul telefono **M2101K9G, Android 12 / API 31**. Package verificato: `it.demo.eventcheckin.ionic`, versione `1.0` / codice `1`.

## Misure richieste

| Voce | Risultato |
| --- | --- |
| Build riuscita al primo tentativo | **Sì**, sia Web sia primo `assembleDebug` della sessione |
| Pipeline iniziale Web → sincronizzazione → APK | **115,165 s — 1 min 55,17 s** |
| Compilazione Web, TypeScript e bundle legacy inclusi | **38,879 s** |
| Sincronizzazione Capacitor Android | **8,365 s** |
| Compilazione Android e confezionamento APK debug | **67,921 s** |
| Somma delle sole compilazioni Web + Android | **106,800 s — 1 min 46,80 s** |
| Preparazione esclusa dalla pipeline | **41,815 s**: verifica dipendenze 17,236 s + pulizia e risoluzione Gradle offline 24,579 s |
| Download SDK e dipendenze durante la verifica | **0 s**, tutto già installato; Gradle e verifica npm offline |
| Errori di compilazione / correzioni applicative | **Nessuno / nessuna** |
| Scanner QR, check-in e persistenza | **PASS sul telefono Android reale**, dettagli sotto |

Ogni fase è misurata con `System.Diagnostics.Stopwatch` intorno all'intero processo. La pipeline va dalle **18:19:04 alle 18:20:59 Europe/Rome**; il totale somma le tre fasi, escludendo le brevi pause di scrittura dei log. Android include avvio del daemon, configurazione, compilazione, creazione e firma debug. Gradle riporta **BUILD SUCCESSFUL in 1m 7s**, **133 task eseguiti**.

Eseguito `clean` prima della misura, poi `assembleDebug --offline --no-build-cache --no-daemon --max-workers=2`. Vite rigenera `dist/`. Restano disponibili SDK, `node_modules`, cache delle dipendenze e trasformazioni della toolchain. È una build con output puliti su un ambiente già preparato, non una misura di prima installazione. I tempi storici di download/installazione sono **non disponibili**, non zero. Nessun `npm ci`, installazione SDK o download di browser eseguito in questa sessione. Installazione APK, test e interazione con il telefono sono esclusi dalla compilazione.

## Ambiente, errori e interventi

- Windows, Node **22.13.1**, npm **11.6.2**, JDK **21.0.8** di Android Studio, Gradle **8.14.3**, AGP **8.13.0**; compileSdk/targetSdk **36**, minSdk **26**. Ionic **9.0.9**, React **19.0.0**, Capacitor **8.5.3**, scanner **3.1.3**, Camera **8.2.6**, Preferences **8.0.1**, Vite **8.3.5**. Nessuna dipendenza aggiornata.
- `JAVA_HOME` predefinito puntava a JDK 17: impostato JDK 21 per la misura **prima** di compilare. Non è un tentativo di build fallito.
- Il controllo ADB iniziale nella sandbox non avviava il server. Installazione e prove sono state eseguite con accesso autorizzato agli strumenti locali: problema di preparazione del collegamento, distinto dalla build.
- Warning non bloccanti: bundle Vite oltre 500 kB e diagnostica dei tempi dei plugin; repository Gradle `flatDir`; operazioni Java unchecked nel codice Capacitor. Nessuna correzione necessaria.
- **Nessuna modifica ai sorgenti applicativi o alla configurazione nativa**. Aggiunti script di misura e raccolta delle evidenze. Le prove WebView usano il vero APK e Preferences native, senza mock; nessun tocco Android inviato tramite `adb input`.

## Scanner, check-in e persistenza

| Prova | Esito ed evidenza |
| --- | --- |
| Installazione e stato iniziale | **PASS**: installazione `Success`, WebView nativa, demo a 0/6 dopo reset confermato |
| Check-in manuale e trim | **PASS**: ` EVT-001 ` registra Giulia e porta a 1/6 |
| Duplicato | **PASS**: `Check-in già effettuato`, contatore fermo a 1/6 |
| Codice sconosciuto | **PASS**: `ERR-999` → `QR non valido`, contatore fermo a 1/6 |
| Reset annullato / confermato | **PASS**: annullamento conserva il check-in; conferma riporta a 0/6 |
| Persistenza manuale | **PASS**: arresto completo, nuovo processo 16864 → 17113, Giulia ancora presente a 1/6 e `EVT-001` nelle Preferences native |
| Scanner QR reale | **PASS con intervento umano**: aperto lo scanner del vero APK; l'utente inquadra [EVT-002](verification/2026-10-24/EVT-002.png) e conferma Marco registrato |
| Check-in da scanner | **PASS**: WebView acquisita con `Check-in effettuato: Marco Bianchi`, Marco `Presente`, contatore 1/6; file nativo contenente soltanto `EVT-002` |
| Persistenza del QR | **PASS**: processo 17113, assente dopo `am force-stop`, nuovo processo 17516; UI ancora a 1/6, Marco presente e Preferences identiche |
| Test dominio, storage e adapter scanner | **PASS, 30/30**, 3 file; scanner mockato in questi soli test |
| Test browser | **PASS, 10/10**, Edge/Chromium headless, viewport Pixel 7 e desktop; 23,5 s |
| Lint | **PASS**, exit code 0 |

File realmente letto: `shared_prefs/CapacitorStorage.xml`, chiave `event-check-in.tech-meetup-2026.v1`, valore JSON `["EVT-002"]`. SHA-256 delle copie prima e dopo il riavvio: `36A50D3E18232D0A1A0C7DF47989EEFD3EA161509C3DEDBA39AE81F7AC951622`.

Screenshot acquisiti con `adb screencap`, incluse le barre Android; quello dopo riavvio è stato ispezionato. La lettura dello storage è distinta dai test con adapter in memoria. Reboot, reinstallazione e aggiornamento non provati. Permesso negato, annullamento scanner e camera assente non riprovati sul telefono in questa sessione; copertura mock e precedente prova su emulatore nel [resoconto del 23/10](VERIFICA.md). **iOS non compilato o provato**, host Windows. L'app resta installata con Marco presente e un solo check-in conservato.

## Artefatto ed evidenze

- [APK debug](../artifacts/android/event-check-in-ionic-debug.apk): **39.754.506 byte**, circa **37,91 MiB**, autonomo con bundle Web incluso; non richiede Vite.
- SHA-256: `1517E756A6FCB14EAB9F8AE836CFBFE8111C68474F754AAF530504A478F0B7D3`.
- [Risultati JSON](verification/2026-10-24/results.json), [tempi per fase](verification/2026-10-24/build-results.json), [preparazione](verification/2026-10-24/prepare-offline.txt).
- [Build Web](verification/2026-10-24/build-web-attempt-1.txt), [sync Android](verification/2026-10-24/sync-android.txt), [primo tentativo APK](verification/2026-10-24/build-debug-attempt-1.txt).
- [30 test](verification/2026-10-24/tests.txt), [lint](verification/2026-10-24/lint.txt), [10 test browser](verification/2026-10-24/e2e.txt), [prove native manuali](verification/2026-10-24/native-manual.txt).
- Stato WebView: [iniziale](verification/2026-10-24/initial-state.json), [dopo scansione](verification/2026-10-24/scanned-state.json), [dopo riavvio](verification/2026-10-24/restored-state.json).
- Screenshot: [dopo scansione](verification/2026-10-24/scanned.png), [dopo riavvio](verification/2026-10-24/restored.png).
- Preferences [dopo scansione](verification/2026-10-24/scanned-preferences.xml) e [dopo riavvio](verification/2026-10-24/restored-preferences.xml); [PID](verification/2026-10-24/process-restart.json); [metadati APK](verification/2026-10-24/apk-badging.txt).

APK e output di build sono ignorati da Git. Report, log ed evidenze sotto `docs/` sono conservabili nel repository. Le modifiche preesistenti degli altri progetti non sono state alterate.

## Riproduzione

Da `ionic/`, con SDK, JDK 21 e dipendenze già presenti:

```powershell
.\docs\verification\2026-10-24\measure-build.ps1
npm.cmd test
npm.cmd run lint
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm.cmd run test:e2e
$env:ANDROID_SERIAL = 'SERIALE_DEL_DISPOSITIVO_DEMO'
# Installare il nuovo APK prima dei test, su un dispositivo dedicato alla demo:
node docs/verification/2026-10-24/verify-device.mjs manual
node docs/verification/2026-10-24/verify-device.mjs open-scanner
# L'utente concede il permesso e inquadra EVT-002; soltanto dopo:
node docs/verification/2026-10-24/verify-device.mjs scanned
node docs/verification/2026-10-24/verify-device.mjs restored
```

Lo script di misura accetta `-JavaHome` e `-AndroidHome`; sovrascrive i propri log e `build-results.json`: salvarli prima per conservare questa misura. Se mancano SDK o dipendenze, prepararli prima del cronometro e registrarne separatamente la durata; mantenere offline il tentativo misurato. `manual` azzera i check-in e lascia 0/6 per la prova QR; `scanned` e `restored` non cancellano dati.
