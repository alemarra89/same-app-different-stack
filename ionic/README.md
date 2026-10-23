# Event Check-in — Ionic React

Demo locale del meetup **Tech Meetup 2026**, **23/10/2026**, interamente in italiano. I sei partecipanti e gli ID sono definiti in `src/data/event.ts`. Alla prima apertura: **0 / 6 presenti**. Il QR contiene esclusivamente un ID come `EVT-001`: nessun URL, token o JSON. Vengono rimossi solo gli spazi esterni; gli ID sono sensibili alle maiuscole.

## Origine e versioni

Base realmente scaricata dal template ufficiale **Ionic React blank** con Ionic CLI 7.2.1 il 23/10/2026:

```sh
npx --yes @ionic/cli@7.2.1 start event-check-in blank --type=react --capacitor --no-deps --no-git --no-interactive --project-id=event-check-in
```

Il contenuto è stato portato nella radice di questo repository. L'installazione implicita del CLI è stata interrotta e sostituita da `npm install` con il manifest definitivo. Il template React 19/Vite 8 è stato conservato come base; router e Cypress sono stati eliminati perché la demo ha una sola pagina. Sono stati generati realmente `android/` e `ios/` tramite `npx cap add android` e `npx cap add ios`.

| Componente | Versione installata |
| --- | --- |
| Ionic React | 9.0.9 |
| React / React DOM | 19.0.0, come nel template |
| TypeScript | 5.9.3 |
| Capacitor core / CLI / Android / iOS | 8.5.3 |
| Scanner ufficiale | `@capacitor/barcode-scanner` 3.1.3 |
| Permessi camera espliciti | `@capacitor/camera` 8.2.6 |
| Storage | `@capacitor/preferences` 8.0.1 |
| Vite / plugin React / plugin legacy | 8.3.5 / 6.1.2 / 8.2.3 |
| Vitest / Playwright | 5.0.5 / 1.64.1 |

Versioni e peer dependencies sono state interrogate sul registro npm prima dell'installazione. `package-lock.json` blocca le risoluzioni esatte. Nessuna dipendenza del CLI Ionic globale è necessaria per usare il progetto.

## Requisiti

- Node **22.12+** (eseguito qui con 22.13.1), npm (qui 11.6.2). Capacitor 8 richiede Node 22; Vite 8 richiede almeno 22.12 nel ramo Node 22.
- Android: Android Studio **2025.2.1+**, **JDK 21**, Android SDK **36**, Build Tools installati e licenze SDK accettate. Il plugin impone **minSdk 26**: Android 8.0+. `compileSdkVersion` e `targetSdkVersion` sono 36. Il JDK 17 non basta per questo progetto.
- iOS: **macOS**, **Xcode 26+**, Command Line Tools, iOS **15+**, account/team per firmare su dispositivo. Progetto generato con Swift Package Manager, incluso SceneDelegate di Capacitor 8.5. Con Xcode 27 è necessario il lifecycle UIScene già presente nel template generato. CocoaPods non è richiesto.
- Al primo build servono Internet per npm, Maven/Gradle e Swift Package Manager. L'app non usa servizi remoti durante il funzionamento.

## Installazione e Web

```sh
npm ci
npm run dev
# Aprire l'URL locale stampato da Vite (normalmente http://127.0.0.1:5173).
npm run build
npm run preview
```

`dist/` è il target Web realmente compilato. Il Web offre **inserimento manuale**, ricerca, persistenza e reset. **La fotocamera Web non è implementata**: l'adapter browser dichiara il limite, mostra un messaggio e porta il focus al codice manuale. Non chiama il plugin nativo né richiede getUserMedia. Questa scelta è esplicitamente ammessa dalla specifica e mantiene minime le dipendenze. L'estensione futura consiste nel sostituire `browserScanner.ts` con un adapter getUserMedia + decoder QR verificato, su HTTPS/localhost.

Nessun service worker/PWA offline installabile è stato aggiunto. Su Web, Preferences usa localStorage: la persistenza dipende dall'origine e dalle impostazioni del browser; cancellazione dati, modalità privata o quote esaurite possono impedirla. Non aprire `dist/index.html` via `file://`: usare il server di preview o hosting statico.

## Android

I progetti nativi sono già presenti: **non ripetere cap add** sul checkout normale.

```sh
npm run android
# Compila Web, sincronizza Android e apre Android Studio.
npm run android:run
# Alternativa: selezione dispositivo/emulatore e installazione tramite Capacitor CLI.
```

Per il build da PowerShell, usando il JDK 21 distribuito con Android Studio (adattare il percorso all'installazione):

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
npm run sync:android
Push-Location android
.\gradlew.bat assembleDebug --console=plain
Pop-Location
```

Su macOS/Linux, impostare `JAVA_HOME` al JDK 21 e usare `cd android` e `./gradlew assembleDebug`. APK: `android/app/build/outputs/apk/debug/app-debug.apk`.

Per installarlo direttamente, con USB debugging autorizzato:

```sh
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Permessi e scanner Android

Il manifest dichiara CAMERA e camera opzionale (`required=false`), permettendo l'uso manuale senza hardware camera. Prima dello scanner, `@capacitor/camera` verifica e, se necessario, richiede **solo** il permesso `camera`. È una dipendenza intenzionale: lo scanner 3.1.3 non espone API permessi e nel test Android poteva lasciare la scansione pendente con permesso bloccato. Un permesso negato ora restituisce immediatamente il fallback manuale. Un piccolo plugin locale Android (`CheckInCameraAvailabilityPlugin.java`, registrato in MainActivity) usa CameraManager per verificare anche la presenza dell'hardware prima di aprire lo scanner. Il decoder selezionato è ZXing e il filtro è solo QR_CODE. I messaggi di istruzione e le etichette accessibili dei controlli scanner sono in italiano.

Se il permesso è rifiutato, usare il modulo manuale oppure Impostazioni Android → App → Event Check-in → Autorizzazioni → Fotocamera. L'annullamento non registra ingressi. Errori di permesso, camera assente e plugin assente producono fallback; gli errori non classificati indicano comunque di controllare il permesso o inserire il codice. I codici documentati nel sorgente installato del plugin per annullamento e permesso sono mappati esplicitamente. Gli errori reali dei diversi produttori vanno confermati sul dispositivo.

Il manifest originale conserva INTERNET per il runtime Capacitor, ma il codice applicativo non contiene chiamate API, server, login, analytics, AI o font remoti. Il backup Android dell'app è disabilitato. I check-in risiedono nelle SharedPreferences locali.

### Release Android

```sh
npm run sync:android
cd android
# Windows: .\gradlew.bat bundleRelease
./gradlew bundleRelease
```

Per una release distribuibile usare Android Studio → Build → Generate Signed Bundle / APK, selezionare/creare il proprio keystore, incrementare `versionCode`/`versionName` in `android/app/build.gradle` e firmare l'AAB. Il repository non contiene chiavi o credenziali. **Build release e firma NON VERIFICATI**; `bundleRelease` da solo non configura una chiave di produzione.

## iOS

Su Mac:

```sh
npm ci
xcode-select --install
npm run ios
# Compila Web, sincronizza iOS e apre il progetto Xcode.
npm run ios:run
# Alternativa per esecuzione su destinazione selezionata.
```

In Xcode scegliere il target App, configurare Signing & Capabilities con il proprio Team e selezionare iPhone/simulatore. Il simulatore può usare sempre il codice manuale. `ios/App/App/Info.plist` include realmente **NSCameraUsageDescription** in italiano e le due descrizioni libreria foto previste dalla documentazione del plugin Camera. L'app chiama esclusivamente le API permessi con `permissions: ['camera']`: non richiede l'accesso alle foto e non acquisisce/salva immagini. Il privacy manifest **PrivacyInfo.xcprivacy** dichiara UserDefaults con motivo **CA92.1** ed è registrato nelle risorse del target Xcode. Preferences usa UserDefaults locali.

Il permesso camera viene chiesto tramite Camera prima della prima scansione. Dopo un rifiuto: Impostazioni iOS → App → Event Check-in → Fotocamera; oppure continuare con il codice manuale. L'app non richiede che una camera sia presente per gestire l'elenco.

Per release: `npm run sync:ios`, aprire Xcode, scegliere dispositivo generico iOS, configurare firma e bundle ID, Product → Archive → Distribute App. **Compilazione iOS, risoluzione SPM su Mac, simulatore, dispositivo, firma e archivio NON VERIFICATI**: questo ambiente è Windows. `cap sync ios` riuscito è una generazione/sincronizzazione, non una compilazione Swift.

## Architettura e comportamento

```text
src/models/participant.ts          modello ed esiti discriminati
src/data/event.ts                  evento e sei partecipanti immutabili
src/domain/checkIn.ts              processCheckIn(id, participants), funzione pura
src/domain/scanGuard.ts            deduplicazione camera per ID, finestra 1000 ms
src/storage/checkInStorage.ts      storage adapter iniettabile e validazione JSON
src/storage/preferencesStorage.ts  binding a Capacitor Preferences
src/scanner/types.ts               contratto scanner tipizzato e messaggi
src/scanner/nativeScanner.ts       plugin nativo, permessi/errori/annullamento
src/scanner/cameraAvailability.ts  binding al controllo hardware Android locale
src/scanner/browserScanner.ts      fallback manuale Web dichiarato
src/scanner/index.ts               scelta piattaforma e import nativo differito
src/hooks/useCheckIn.ts            ripristino e transazioni salvataggio/reset
src/pages/Home.tsx                 schermata Ionic unica
```

Sono realmente utilizzati IonPage, IonHeader, IonContent, IonButton, IonList, IonItem, IonSearchbar, IonAlert, IonToast e altri componenti Ionic. Il layout usa card chiare e accento **#25785B**, singola colonna mobile e due colonne su schermi larghi; le aree di sistema sono considerate tramite safe-area. La schermata scorre verticalmente sui telefoni. Pulsanti principali di almeno 48px, etichette, stato testuale, focus, ricerca e invio del modulo da tastiera. Non è stata eseguita una certificazione di accessibilità o una prova VoiceOver/TalkBack.

`processCheckIn` non muta i partecipanti e distingue `success`, `duplicate`, `invalid`. Duplicato: **Check-in già effettuato**; sconosciuto: **QR non valido**. Il contatore deriva dallo stato, non viene incrementato separatamente. Un lock sincrono impedisce scritture concorrenti; un secondo lock impedisce scanner sovrapposti. Lo stesso payload camera è ignorato per 1000 ms (anche se intercalato ad altri ID). Il modulo manuale passa sempre dalla stessa funzione pura e non dipende da permessi o lock della camera.

Viene salvato esclusivamente l'array di ID presenti sotto la chiave `event-check-in.tech-meetup-2026.v1`. L'app conferma il check-in solo dopo il completamento della scrittura. Errore di lettura/dati corrotti: messaggio visibile e check-in disabilitato per evitare sovrascritture; riapertura o reset confermato consentono il recupero. Errore di scrittura/reset: nessuna falsa conferma e nessuna modifica del contatore. Reset rimuove solo la chiave di questo evento, non l'intero storage.

## Test riproducibili

```sh
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

I test browser avviano e chiudono autonomamente Vite preview sulla porta **42831**, che deve essere libera. Usano Chromium headless in emulazione Pixel 7 e viewport desktop 1280×900: questo **non equivale a eseguire l'app nativa**. Per usare Edge installato su Windows:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e
```

È incluso anche un test dell'APK **nativo Android**, via adb e CDP della WebView debug, senza mock Preferences. Su un emulatore di sviluppo già avviato, dopo il build debug:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SERIAL = 'emulator-5554' # usare il seriale mostrato da adb devices
npm run test:android
```

Il test installa l'APK, usa il reset confermato, verifica valido/duplicato/invalido, termina il processo e riapre l'app per controllare la persistenza nativa. Verifica inoltre il permesso camera bloccato e il successivo uso manuale, ripristinando i flag di permesso al termine. Va usato su un emulatore/dispositivo dedicato alla demo: azzera i check-in. Per includere il caso hardware assente, avviare un AVD con `-camera-back none -camera-front none` e impostare `$env:ANDROID_TEST_NO_CAMERA = '1'`. Questo è il caso usato nella verifica di consegna. Non scansiona QR reali. Gli screenshot Android vengono acquisiti con adb screencap, per includere anche le barre di sistema.

Vitest verifica ID valido/duplicato/sconosciuto/trim, immutabilità, schema QR, seed, finestra duplicati, persistenza/ripristino/reset, dati corrotti, errori di scrittura e adapter scanner con plugin mock. I mock non provano la fotocamera reale. Playwright verifica il percorso 0→1→duplicato→invalido→reload→reset, annullamento del reset, ricerca, fallback Web/manuale, errore storage, recupero dati corrotti, invio da tastiera, screenshot e assenza di overflow orizzontale.

### Verifica manuale richiesta su dispositivo

1. Reimposta demo: 0/6.
2. Inserisci `EVT-001`: Giulia Presente, 1/6.
3. Ripeti `EVT-001`: messaggio duplicato, 1/6.
4. Inserisci `ERR-999`: QR non valido, 1/6.
5. Termina e riapri l'app nativa: 1/6.
6. Reimposta e conferma: 0/6; annullare deve preservare lo stato.
7. Su un altro schermo/cartoncino prepara un QR **testuale** con contenuto esatto `EVT-002`. Scansiona su telefono reale: Marco Presente, 1/6. Prova rifiuto permesso, annullamento e ripetizione, poi verifica che il modulo manuale resti utilizzabile.

Il criterio 7 resta **NON VERIFICATO** su telefono reale. La persistenza è verificata sia con reload Web sia dopo force-stop e riapertura dell'app Android nell'emulatore API 36.

## Web e Desktop

Il Web è compilato e verificato nel browser Chromium nelle condizioni descritte nel resoconto. Safari/iOS Web, Firefox, installazione PWA e prove di tastiera mobile reale **NON VERIFICATI**. Il bundle include il runtime Ionic e presenta un avviso Vite per chunk oltre 500 kB; il plugin scanner è caricato tramite import differito, ma il suo decoder Web transitivo viene comunque prodotto come chunk dal bundler. L'app usa il fallback manuale anche se quel codice è nel pacchetto.

**Windows e macOS non sono target desktop automatici di Capacitor.** Qui non sono prodotti EXE, MSIX, DMG o app macOS. Electron o Tauri sono possibili wrapper futuri, non implementati. Occorrerebbero packaging/firma, adapter storage desktop, permessi camera propri e decoder browser (eventualmente getUserMedia solo in contesto sicuro), oltre a verifiche di focus, tastiera, ridimensionamento e lifecycle. Il plugin scanner Android/iOS non è automaticamente uno scanner desktop; il modulo manuale resta il percorso previsto sul browser desktop.

## Consegna e verifiche effettive

Vedi **[docs/VERIFICA.md](docs/VERIFICA.md)** per il resoconto standard, risultati eseguiti, avvisi, correzioni e target non verificati. **[docs/FILES.md](docs/FILES.md)** elenca tutti i file consegnati con conteggio riproducibile. Dipendenze dirette: **26 totali, 10 runtime e 16 di sviluppo**. Rispetto al manifest blank scaricato prima dell'integrazione Capacitor: **9 pacchetti aggiunti** (sei Capacitor runtime, Capacitor CLI, @eslint/js e Playwright) e **10 rimossi** (tre router, quattro Testing Library, Cypress, jsdom ed eslint-plugin-react). Aggiornare una versione di un pacchetto già presente non conta come nuova dipendenza.

## Fonti ufficiali consultate

- [Template Ionic React blank](https://github.com/ionic-team/starters/tree/main/react/official/blank) e [documentazione Ionic React](https://ionicframework.com/docs/react).
- [Ambiente Capacitor 8](https://capacitorjs.com/docs/getting-started/environment-setup), [migrazione 8](https://capacitorjs.com/docs/updating/8-0) e [UIScene 8.5](https://capacitorjs.com/docs/updating/8-5).
- [Scanner: API e requisiti SDK](https://capacitorjs.com/docs/apis/barcode-scanner); tipi, codici errore e configurazione nativa verificati anche nei file installati di `@capacitor/barcode-scanner` 3.1.3.
- [Preferences e privacy manifest Apple](https://capacitorjs.com/docs/apis/preferences).
- [Camera: controllo e richiesta permessi](https://capacitorjs.com/docs/apis/camera) e [plugin Android locale](https://capacitorjs.com/docs/android/custom-code).

Le fonti possono evolvere: per riprodurre questa implementazione usare il lockfile incluso e i valori nei progetti nativi, non aggiornare indiscriminatamente i pacchetti.
