# Resoconto standard — Event Check-in / Ionic React

**Release 24/10/2026:** primo tentativo riuscito; pipeline Web + sync + Android **197,227 s**, firma di test separata **2,038 s**; APK universale **35.753.922 byte**. Installato sul telefono come Release non debuggabile, nuovo check-in e riapertura a 2/6 senza server di sviluppo. [Report Release, video e screenshot](RELEASE_BUILD_2026-10-24.md).

**Aggiornamento 24/10/2026:** APK debug ricompilato al primo tentativo, pipeline Web + sync + Android **115,165 s**, download esclusi (nessun download richiesto). Scanner QR reale, check-in e persistenza dopo arresto completo verificati su telefono Android. Passati 30 test unitari, 10 test browser e lint. Vedi il [report aggiornato con misure ed evidenze](DEBUG_BUILD_2026-10-24.md). Le sezioni sotto conservano la verifica storica del 23/10, compresi i limiti allora presenti.

Data: **23/10/2026**, ambiente **Windows**, fuso Europe/Rome. La directory iniziale era vuota e non era un repository Git: nessun file preesistente dell'utente modificato e nessun commit/PR creato.

## Framework/versioni e librerie principali

Ionic React **9.0.9**, React/React DOM **19.0.0**, TypeScript **5.9.3**, Vite **8.3.5**, Capacitor core/CLI/Android/iOS **8.5.3**, barcode-scanner **3.1.3**, Camera **8.2.6** per permessi espliciti, Preferences **8.0.1**, Ionicons **8.1.0**, Vitest **5.0.5**, Playwright **1.64.1**. Partenza reale dal template ufficiale Ionic React blank con CLI **7.2.1**; Vite, componenti Ionic e struttura principale mantenuti, pagina sostituita con l'implementazione richiesta.

**26 dipendenze dirette**: **10 runtime + 16 sviluppo**. Confronto con il manifest blank scaricato, prima dell'integrazione Capacitor: **9 aggiunte**, **10 rimosse**, saldo −1. Aggiunte: sei pacchetti Capacitor runtime, Capacitor CLI, @eslint/js e Playwright. Rimosse: tre router, quattro Testing Library, Cypress, jsdom ed eslint-plugin-react. Le versioni dei pacchetti già esistenti non contano come nuove dipendenze. Numero e lista dei file: **[FILES.md](FILES.md)**, generato da `node scripts/inventory.mjs`; comprende sorgenti, configurazioni, documentazione e asset/template nativi, esclude dipendenze/cache e build.

## Comandi build e verifica eseguiti

| Comando | Risultato reale |
| --- | --- |
| `npm install` | Installate le dipendenze reali, generato lockfile |
| `npm run build` | PASS: controllo TypeScript e produzione `dist/`, inclusi bundle legacy |
| `npm test` | **PASS: 30 test, 3 file** |
| `npm run lint` | **PASS: nessun errore o warning ESLint** |
| `npx cap add android` | PASS: progetto Android generato |
| `npx cap add ios` | PASS: progetto Xcode/SPM generato |
| `npx cap sync` | PASS per Android/iOS/Web; rilevati scanner, Camera e Preferences |
| `PLAYWRIGHT_CHANNEL=msedge npm run test:e2e` (sintassi PowerShell nel README) | **PASS: 10 test in 32,9 s** nell'ultima esecuzione, Edge/Chromium headless, Pixel 7 emulato e desktop 1280×900 |
| `android/gradlew.bat assembleDebug --console=plain`, JAVA_HOME JDK 21 | **BUILD SUCCESSFUL**; prima compilazione 3m26s, build finale con Camera e controllo hardware 40s |
| `adb devices -l` | Inizialmente nessuno; avviato AVD esistente Medium Phone, seriale emulator-5554, Android 16/API 36 |
| `npm run test:android`, ANDROID_SERIAL esplicito e ANDROID_TEST_NO_CAMERA=1 | **PASS su APK nativo**: check-in, duplicato, invalido, trim, force-stop/riapertura con stato persistente, reset; **permesso negato e hardware camera assente, entrambi seguiti da check-in manuale riuscito** |
| `npm audit --omit=dev --json` | **0 vulnerabilità segnalate nelle dipendenze runtime** |
| `npm audit --json` | **3 segnalazioni moderate** nella catena di sviluppo Capacitor CLI → xcode → uuid |

APK debug: **`android/app/build/outputs/apk/debug/app-debug.apk`**. È firmato con la chiave debug dell'ambiente, non con una chiave di release. **Compilato, installato ed eseguito nell'emulatore Android 16/API 36**. Il manifest finale unito è stato ispezionato: minSdk 26, targetSdk 36, CAMERA, hardware camera opzionale, backup disabilitato.

APK finale: **41.318.479 byte**, SHA-256 `2A5AE3E6D6D79814167B7C47A99F32C1743BB53881693F9ACF619F5FC2ABB62A`. L'AVD è stato avviato in background senza camera né salvataggio snapshot, poi arrestato al termine. Il test lascia la demo azzerata e ripristina i flag di blocco del permesso.

Le tre segnalazioni dell'audit completo sono la propagazione della stessa advisory uuid **GHSA-w5hq-g745-h8pq** attraverso xcode e Capacitor CLI. Nessuna correzione forzata né override di major version: npm propone un downgrade del CLI a 8.4.3, che eliminerebbe l'allineamento col template UIScene 8.5. Queste dipendenze di sviluppo non fanno parte del runtime distribuito. Il messaggio “0 vulnerabilità” stampato da un'operazione offline di aggiornamento lockfile non è stato usato come risultato dell'audit completo.

## Test e criteri di accettazione

- Funzione pura: seed esatto, 0/6, valido, immutabilità, duplicato, sconosciuto, stringa vuota, ID case-sensitive, rifiuto URL/JSON, trim.
- Scanner: blocco payload ripetuti entro 1000ms anche se intercalati; adapter nativo **mockato** per successo, annullamento, camera, permesso, assenza plugin, errore generico. Adapter Web senza fotocamera.
- Android nativo, senza mock: permesso camera bloccato via adb, verifica del messaggio di rifiuto e check-in manuale di Marco; poi permesso concesso ma AVD senza camera, verifica del messaggio hardware assente e check-in manuale di Sara. Entrambi passati dopo il preflight.
- Persistenza: salvataggio dei soli ID, istanza nuova/ripristino, reset mirato, ID obsoleti, dati corrotti, errore scrittura.
- Browser: criteri **1–6 superati nel browser**, reload con stato mantenuto, reset confermato e annullato; ricerca nome/ID/zero risultati; fallback Web seguito da check-in manuale; scrittura fallita senza conferma; lettura corrotta e recupero tramite reset; invio da tastiera; layout senza overflow orizzontale e screenshot.
- Screenshot iniziali e della lista mobile/desktop ispezionati visivamente. Copie in **[screenshots/](screenshots/)**.
- **Criterio 7: NON VERIFICATO**. Serve telefono Android/iPhone reale e QR testuale `EVT-002`. Nessuna simulazione o mock è presentata come scansione reale.
- **Riavvio del processo e storage nativo verificati nell'emulatore Android**: force-stop, riapertura, Giulia ancora Presente e contatore 1/6. La persistenza Web è verificata con reload; quella dell'adapter anche con istanze nuove. Non è una prova su telefono fisico né su iOS.

## Errori incontrati e correzioni manuali

1. Accesso npm nella sandbox: errore DNS ENOTFOUND. Installazione e verifiche di rete eseguite con accesso approvato; nessun pacchetto inventato o stub sostitutivo.
2. La generazione Ionic scaricava correttamente il template ma avviava un'installazione implicita; interrotta e rimpiazzata con l'installazione esplicita del manifest finale. Rimossi test/demo del template non pertinenti.
3. Primo controllo TypeScript: `autocorrect="off"` non valido in Ionic 9; corretto a `autocorrect={false}`. Build successiva riuscita.
4. La porta 4173 era occupata; i test sono stati spostati sulla 42831, senza terminare processi estranei. I test browser richiedono accesso al server locale fuori dalle restrizioni della sandbox di questo ambiente.
5. Test reset rapido: la chiusura animata di IonAlert poteva interferire con una nuova apertura. Pulsante reset disabilitato fino a `onDidDismiss`; annullamento e riapertura ora verificati.
6. IonSearchbar 9 etichetta il suo input interno “search text” anche se il contenitore ha aria-label. Impostata etichetta italiana tramite metodo pubblico `getInputElement`; etichettato anche il controllo cancella ricerca.
7. Ionic clona temporaneamente l'input durante lo scroll per la tastiera mobile. I test attendevano il campo durante quella transizione e incontravano due locator: attesa esplicita della scomparsa del clone prima dell'interazione, senza sleep fisso e senza disattivare l'assistenza alla tastiera.
8. Scanner importato in modo differito sul solo percorso nativo; tolto il suo caricamento dal percorso iniziale Web. Restano i chunk generati dal decoder transitivo del pacchetto ufficiale.
9. Applicati realmente minSdk 26, CAMERA e hardware opzionale, NSCameraUsageDescription e privacy manifest registrato nel progetto Xcode; usato JDK 21 di Android Studio al posto del JAVA_HOME predefinito JDK 17.
10. Il test nativo ha rilevato che lo scanner poteva restare pendente con permesso camera fissato come negato. Aggiunto il preflight tramite Camera 8.2.6 (`checkPermissions`, `requestPermissions` solo camera), evitando l'apertura dello scanner in quel caso. Aggiunto controllo hardware CameraManager su Android, senza una dipendenza esterna aggiuntiva per rilevare camera assente. Nessuna acquisizione foto o accesso alla galleria nell'app.
11. Nel primo avvio dell'emulatore Capacitor ha emesso messaggi transitori “Error injecting safe area CSS” prima della disponibilità del documento. L'interfaccia e le barre di sistema sono state ispezionate negli screenshot adb e i test nativi sono proseguiti; il comportamento su altri device resta da verificare. Gli screenshot CDP della WebView potevano deformare il compositing dell'header: per Android sono stati sostituiti da acquisizioni native adb.

## Sezioni specifiche di piattaforma

**Android:** `variables.gradle`, manifest, MainActivity, plugin locale per disponibilità camera e risorse/app Gradle ufficiali. Scanner nativo ZXing con QR-only e permesso Camera prima dello scanner. minSdk 26/compileSdk 36/targetSdk 36, JDK 21, Gradle 8.14.3 e AGP 8.13.0. APK debug prodotto ed eseguito nell'emulatore. Avvisi Gradle flatDir e unchecked nel codice Capacitor upstream, non errori di compilazione.

**iOS:** progetto Xcode/SPM, AppDelegate e SceneDelegate generati dal CLI 8.5.3; target iOS 15; uso fotocamera descritto in italiano; PrivacyInfo.xcprivacy UserDefaults/CA92.1 incluso nelle Resources. **Xcode build, SPM resolve su Mac, archivio, firma e scanner iOS NON VERIFICATI**.

**Web:** `dist/` prodotto, browser Edge/Chromium verificato nei due viewport. Scanner deliberatamente manuale, storage Preferences/localStorage. Safari/WebKit, Firefox, PWA e tastiera mobile hardware **NON VERIFICATI**. Vite segnala chunk oltre 500 kB: runtime Ionic e scanner ufficiale comportano un costo di bundle documentato, accettato per questa demo.

**Desktop:** verificata soltanto l'interfaccia Web in un viewport desktop. Nessun target desktop nativo prodotto. Windows/macOS non sono output automatici di Capacitor: possibile futura integrazione Electron/Tauri con packaging, firma e adapter camera/storage dedicati; limiti e istruzioni nel README.

**Release:** nessun AAB firmato, archivio iOS o distribuzione store eseguiti. I comandi riproducibili e i passaggi per la firma sono nel README. Nessun server, account applicativo, analytics o database cloud aggiunto.
