# Event Check-in

App mobile per **Tech Meetup 2026 · 23/10/2026**, realizzata con React Native, Expo SDK 58 e TypeScript rigoroso. Una schermata in italiano, sei partecipanti invarianti, scanner QR e inserimento manuale indipendente dalla fotocamera. Nessun backend, account, analytics o chiamata API applicativa.

Il [resoconto del confronto](docs/VERIFICATION.md) distingue test eseguiti, bundle prodotti, compilazioni native e prove ancora da fare. L’[inventario iniziale](docs/FILES.md) elenca i file della consegna del 23/10/2026.

**Verifica Android del 24/10/2026:** [build debug cronometrata e prova su telefono](docs/DEBUG_BUILD_2026-10-24.md). Primo tentativo fallito in 106,85 s; secondo incrementale riuscito in 127,89 s, senza download. Scanner QR, check-in e persistenza dopo arresto completo verificati su Android fisico, con scansione effettuata dall'utente.

**Release Android del 24/10/2026:** [build, misure e video senza Metro](docs/RELEASE_BUILD_2026-10-24.md). APK ARM64 da 29,65 MB, compilato al terzo tentativo in 328,93 s; download e preparazione separati. Installazione, nuovo check-in e persistenza dopo arresto completo verificati sul telefono senza server di sviluppo. Release per test locale firmata con la chiave debug del template.

## Requisiti verificati al 23/10/2026

- Node **22.13.x o successivo della linea 22**, oppure 24.3+ della linea 24, oppure 26+; rispettare `engines` in `package.json`. Ambiente usato: Node 22.13.1, npm 11.6.2, Windows.
- Dipendenze esatte riproducibili in `package-lock.json`: Expo 58.0.17, React Native 0.88.0, React 19.3.0, TypeScript 6.0.3. Nessun Expo Router: non serve navigazione per una schermata.
- Android: JDK 17, Android Studio/SDK con `ANDROID_HOME`, platform-tools e dispositivo USB con debug attivo oppure AVD. La configurazione generata richiede compile SDK **37**, Build Tools **37.0.0**, target SDK **36**, min SDK **24** (Android 7), NDK **27.1.12297006**, Gradle **9.4.1**. Gradle può scaricare gli SDK mancanti se le licenze sono già accettate.
- iOS: **macOS**, Xcode compatibile con SDK 58 (preferire Xcode 27), strumenti CLI e CocoaPods. Il podspec Expo richiede iOS **16.4+**. Compilazione e versione minima effettiva di Xcode non verificate in questo ambiente Windows. Dispositivo fisico per la camera e firma Apple valida per l’installazione.
- Per la camera sono necessari dispositivo reale e permesso. I simulatori restano utilizzabili con l’inserimento manuale.

Il [changelog SDK 58](https://expo.dev/changelog/sdk-58) segnala che Expo Go per SDK 58 negli store è in distribuzione successiva al rilascio: **non basare la demo sulla disponibilità di Expo Go**. Il percorso riproducibile consigliato è la build debug locale con `expo run:*`.

## Installazione e avvio

La base è stata realmente creata nella cartella vuota con `npx create-expo-app@5.0.0 . --template blank-typescript --yes --no-install`, risolvendo il template 58.0.26. Dopo `npm install`, sono stati aggiunti i pacchetti con il resolver Expo:

```sh
npx expo install expo-camera @react-native-async-storage/async-storage react-native-safe-area-context react-dom react-native-web @expo/metro-runtime expo-system-ui
npx expo lint
```

Questi comandi descrivono la costruzione della base; per usare i file completi consegnati, partire direttamente da `npm ci` come segue.

Dalla cartella di questo progetto:

```sh
npm ci
npm run typecheck
npm run lint
npm test
npx expo-doctor
npx expo install --check
```

Prima build Android, con emulatore già avviato oppure telefono collegato:

```sh
npx expo run:android --device
```

Prima build iOS, **su Mac**:

```sh
npx expo run:ios --device
```

I comandi generano il progetto nativo, compilano, installano e avviano Metro. Per le successive modifiche TypeScript:

```sh
npx expo start
```

Per una development build con launcher Expo personalizzato è possibile aggiungere facoltativamente `npx expo install expo-dev-client` e ricompilare con `expo run:*`; non è una dipendenza di questa consegna. Per provare Expo Go occorre una versione che supporti davvero SDK 58; la presenza di camera e AsyncStorage in Expo Go non implica compatibilità tra SDK diversi. Le descrizioni dei permessi configurate qui si applicano alla propria build, non al contenitore Expo Go.

Su PowerShell, se `npm`/`npx` richiamano gli shim `.ps1` e perdono gli argomenti dopo `--`, usare `npm.cmd` e `npx.cmd` (esempio: `npx.cmd expo export --platform web --max-workers 2`).

## Permessi e scanner

1. Premere **Scansiona QR**, poi **Consenti fotocamera**. Si richiede soltanto la camera, mai il microfono.
2. Android: se il permesso è stato negato definitivamente, usare **Apri impostazioni**, abilitare Fotocamera e riaprire lo scanner. iOS: fare lo stesso nelle impostazioni di Event Check-in. È presente anche **Ricontrolla permesso**.
3. Fotocamera assente, occupata, mount fallito o mancata inizializzazione entro 12 secondi producono un messaggio e lasciano disponibile il modulo manuale. Chiudere e riaprire lo scanner per riprovare.
4. Lo scanner si smonta quando l’app passa in background, quando viene chiuso o quando si apre la conferma di reset. La fotocamera non è attiva all’apertura dell’app.

L’implementazione nativa usa `CameraView`, `useCameraPermissions`, `barcodeScannerSettings={{ barcodeTypes: ['qr'] }}`, `onBarcodeScanned`, `onCameraReady` e `onMountError`. Non usa il modern scanner: i suoi requisiti aggiuntivi non vanno confusi con la preview `CameraView`. `CameraView.isAvailableAsync()` è **solo Web** nella versione installata e non viene usato sul mobile.

In `app.json`, il plugin `expo-camera` imposta `NSCameraUsageDescription` in italiano e disabilita audio; Android blocca inoltre microfono, storage condiviso, vibrazione e overlay. Il backup Android è disabilitato e AsyncStorage iOS è escluso dal backup. Dopo modifiche ai plugin occorre rigenerare e ricompilare la build nativa. La verifica della configurazione è in [native-config.json](docs/verification/native-config.json); è un’introspezione Expo, non un’app iOS compilata.

La variante **debug** di Expo reintroduce il permesso overlay per i suoi strumenti di sviluppo e permessi di rete per Metro; vedere il [manifest debug unito](docs/verification/android-debug-manifest.xml). Il blocco in `app.json` non annulla le dichiarazioni del manifest debug, che ha priorità maggiore. L’app non richiede overlay a runtime e non usa microfono o storage condiviso.

## Prova riproducibile

| Passo | Azione | Risultato atteso |
| --- | --- | --- |
| 1 | Prima apertura o reset confermato | `0 / 6 presenti`, tutti In attesa |
| 2 | Codice `EVT-001`, Conferma check-in | `1 / 6 presenti`, Giulia Rossi Presente e conferma visibile |
| 3 | Ripetere `EVT-001` | `Check-in già effettuato`, resta 1/6 |
| 4 | Inserire `ERR-999` | `QR non valido`, resta 1/6 |
| 5 | Chiudere e riaprire | Resta 1/6 |
| 6 | Reimposta demo → Annulla | Stato conservato |
| 6b | Reimposta demo → Sì, reimposta demo | Torna a 0/6 |
| 7 | Su telefono, inquadrare il QR allegato | Marco Bianchi Presente, contatore incrementato una volta |

![QR contenente esattamente EVT-002](docs/qr/EVT-002.png)

Aprire il [PNG](docs/qr/EVT-002.png) su un secondo schermo oppure stampare l’[SVG](docs/qr/EVT-002.svg). Il payload è **esattamente `EVT-002`**, senza URL, token, JSON o newline. Generato localmente con il CLI temporaneo `qrcode@1.5.4`, senza dipendenze aggiunte all’app:

```sh
npx --yes --package=qrcode@1.5.4 qrcode --type png --width 512 --output docs/qr/EVT-002.png EVT-002
```

Il passo 7 su dispositivo reale è stato **verificato il 24/10/2026** su Android, con scansione effettuata dall'utente e riscontro tramite ADB; verificata anche la persistenza dopo arresto completo. Vedere il [resoconto aggiornato](docs/DEBUG_BUILD_2026-10-24.md). La precedente verifica Web dei passi 1–6 non sostituisce quella mobile. Il contatore conta sempre tutti i sei partecipanti, anche quando la ricerca filtra l’elenco.

## Architettura e persistenza

```text
App.tsx                          provider safe area e status bar
src/models/participant.ts        modello readonly ed esito discriminato
src/data/event.ts                evento e sei partecipanti iniziali
src/domain/processCheckIn.ts     funzione pura processCheckIn(id, participants)
src/domain/scanGuard.ts          blocco QR duplicati per 1000 ms
src/domain/CheckInService.ts     caricamento, salvataggio, reset e feedback
src/storage/checkInRepository.ts repository con porta storage testabile
src/storage/localRepository.ts   adattatore AsyncStorage
src/hooks/useCheckIn.ts          sottoscrizione React allo stato
src/screens/CheckInScreen.tsx     schermata con FlatList e form nativi
src/scanner/QrScanner.tsx        scanner Android/iOS
src/scanner/QrScanner.web.tsx    fallback Web esplicito
src/ui/                         tema e pulsante accessibile
tests/checkIn.test.cjs           test con runner Node integrato
```

`processCheckIn` accetta solo un ID esatto dopo `trim()`. Non cambia mai l’input e restituisce `success`, `duplicate` o `invalid`. Le minuscole non vengono convertite per il check-in; la ricerca invece ignora maiuscole/minuscole. La finestra anti-duplicato è mobile di 1000 ms per ciascun payload normalizzato; due codici diversi non si bloccano a vicenda. Il modulo manuale non è sottoposto al debounce dello scanner.

AsyncStorage contiene una sola chiave, `@event-check-in/tech-meetup-2026/check-ins/v1`, con un array dei soli ID presenti, ad esempio `["EVT-001"]`. Nomi e seed non vengono persistiti, immagini e fotogrammi non vengono salvati. Una scrittura deve riuscire prima di mostrare un check-in come effettuato. Durante una scrittura sono bloccate altre operazioni per evitare aggiornamenti concorrenti; in caso di errore si può riprovare. Uno stato corrotto viene segnalato e non sovrascritto automaticamente: usare Riprova o il reset confermato. Il reset elimina soltanto questa chiave.

Lo storage è locale e non cifrato. La disinstallazione o la cancellazione dei dati dell’app elimina le presenze. Non c’è sincronizzazione tra dispositivi. Nel Web AsyncStorage usa lo storage del browser, separato per origine; modalità privata, blocco storage o cancellazione dei dati possono impedirne la conservazione. Non è gestita la scrittura simultanea da più schede browser.

## Test e verifiche

```sh
npm test
npm run typecheck
npm run lint
npx expo-doctor
npx expo install --check
```

Il runner Node non richiede Jest o un’altra libreria di test. TypeScript compila solo modelli, seed, dominio e repository in `.test-build/`; i test eseguono quel codice. Coprono valido, duplicato, sconosciuto, trim, input immutabile, schema QR, sei ingressi, finestra anti-duplicato, persistenza, dati corrotti, errori, concorrenza e reset. Il test su filesystem usa una directory temporanea e riapre il repository; non equivale a un test nativo end-to-end di AsyncStorage. La persistenza dell’adattatore reale è stata inoltre verificata ricaricando la build Web.

## Build e release locali

Il progetto usa **Continuous Native Generation**: `app.json` e i plugin sono la sorgente della configurazione. `android/` e `ios/` sono output generati e sono ignorati da Git. Il progetto Android è stato realmente generato qui; Expo non consente di generare iOS su Windows. Su Mac/Linux si può generare senza installare i pod con `npx expo prebuild --platform ios --no-install`; la compilazione iOS richiede poi macOS/Xcode. Non modificare a mano i manifest generati.

Il plugin locale `plugins/withShortAndroidPaths.cjs` imposta la proprietà Expo `expo.android.cmakeObjectPathMax=240` durante prebuild. Su Windows lo staging CMake è in `%TEMP%/rn-cxx/<hash del percorso del progetto>`, così anche il nome più lungo della variante Release `RelWithDebInfo` lascia spazio all'hash dei percorsi C++. Ogni checkout usa una cartella distinta; la pulizia dei file temporanei comporta soltanto una ricompilazione. Sugli altri sistemi lo staging resta in `.cxx/` nella cartella dell'app, esclusa da Git. Il plugin aggiorna la propria configurazione durante prebuild, senza modificare dipendenze o file nativi a mano.

Build debug Android senza installare su un dispositivo, PowerShell:

```powershell
npx.cmd expo prebuild --platform android --no-install
Set-Location android
.\gradlew.bat app:assembleDebug --no-daemon --console=plain -PreactNativeArchitectures=x86_64
Set-Location ..
```

`x86_64` è per l’emulatore e limita il tempo di verifica. Per un telefono ARM usare `-PreactNativeArchitectures=arm64-v8a` oppure omettere l’opzione per gli ABI configurati. Output debug: `android/app/build/outputs/apk/debug/app-debug.apk`; richiede Metro. Una build debug non dimostra che la release funzioni.

Sono stati prodotti entrambi gli APK debug: [ARM64 per telefoni](artifacts/android/event-check-in-debug-arm64-v8a.apk) e [x86_64 per emulatore](artifacts/android/event-check-in-debug-x86_64.apk). Il 24/10/2026 la copia ARM64 è stata ricompilata con il package corrente, installata e provata su telefono Android; la copia x86_64 conserva la build storica. Per installare la copia ARM64 via USB: `adb install -r artifacts/android/event-check-in-debug-arm64-v8a.apk`, poi `adb reverse tcp:8081 tcp:8081` e `npx.cmd expo start --offline --port 8081`. Aprire Event Check-in dal telefono. Installazione, avvio e verifiche eseguiti sono documentati nel [resoconto aggiornato](docs/DEBUG_BUILD_2026-10-24.md).

Build release locale di prova:

```sh
npx expo run:android --variant release --device
# Solo macOS:
npx expo run:ios --configuration Release --device
```

Queste build includono il bundle JavaScript. La firma di debug del template Android non è adatta allo store. Per distribuire: configurare la propria upload key e signing config con le [istruzioni Android ufficiali Expo](https://docs.expo.dev/guides/local-app-production/), poi eseguire `gradlew.bat app:bundleRelease` in `android/` (su macOS/Linux: `./gradlew app:bundleRelease`). AAB in `android/app/build/outputs/bundle/release/`. Per iOS aprire il workspace generato in Xcode, scegliere il proprio team e fare Product → Archive → Distribute App. Usare identificativi di bundle di cui si dispone prima della pubblicazione. Nessuna firma di distribuzione o pubblicazione è stata eseguita qui.

Per verificare soltanto i bundle, senza compilare APK/IPA:

```sh
npm run export:native
```

Output in `artifacts/native/`. L’export Hermes **non** verifica Gradle, Xcode, collegamento dei moduli o permessi su dispositivo.

## Web e Desktop

```sh
npm run web
npm run export:web
npm run preview:web
```

L’export è in `dist/`; l’anteprima statica è su `http://localhost:4173`. Lo script di anteprima è soltanto uno strumento locale di sviluppo, non un backend dell’app. La build usa React Native Web, React DOM e Metro senza HTML nella UI mobile. Ricerca, manuale, contatore, conferma reset e persistenza condividono la stessa logica.

**In questa consegna lo scanner Web è esplicitamente non abilitato** e mostra il fallback manuale. Non è un’affermazione che Expo Camera sia solo mobile: SDK 58 implementa anche il rilevamento Web, con `BarcodeDetector` nativo o il suo fallback. La camera browser richiede un contesto sicuro (HTTPS o localhost), un permesso valido, supporto delle API video e policy camera adeguate negli iframe; preview e decoder non hanno le stesse garanzie su tutti i browser. Per estenderla: sostituire soltanto `QrScanner.web.tsx`, verificare i browser desiderati e il funzionamento offline del decoder, mantenendo invariato `onCode` e la logica di dominio.

Nessun target Desktop nativo è stato configurato o prodotto. L’uso su computer verificato è quello via browser; non prova compatibilità React Native Windows/macOS. SDK 58 segnala inoltre un limite corrente per React Native macOS nel suo changelog. Portare lo scanner a un target Desktop nativo richiede un adattatore e una verifica specifici.

## Fonti consultate

- [Template create-expo-app](https://docs.expo.dev/more/create-expo/)
- [SDK 58 e cambiamenti](https://expo.dev/changelog/sdk-58)
- [Camera, documentazione versionata SDK 58](https://docs.expo.dev/versions/v58.0.0/sdk/camera/)
- [AsyncStorage](https://docs.expo.dev/versions/latest/sdk/async-storage/)
- [Web con Expo](https://docs.expo.dev/workflow/web/)
- [Build debug locali](https://docs.expo.dev/guides/local-app-development/)
- [Build release e firma](https://docs.expo.dev/guides/local-app-production/)

Versioni e requisiti sono stati incrociati con registry npm, `expo/bundledNativeModules.json`, plugin camera, podspec Expo e configurazione Gradle installati. La documentazione generica `latest` mostrava ancora tabelle di SDK precedenti; per questo non è stata usata per inventare i requisiti di SDK 58.
