# Resoconto standard dell’esperimento

Questo resoconto conserva la verifica del **23/10/2026**. Per la nuova misura offline e le prove su telefono Android reale del **24/10/2026**, vedere [build debug, scanner e persistenza](DEBUG_BUILD_2026-10-24.md). I limiti sul dispositivo fisico riportati sotto descrivono la sessione originaria.

Disponibile anche la [verifica Release del 24/10/2026](RELEASE_BUILD_2026-10-24.md), con misura della compilazione, APK firmato localmente, prova senza server di sviluppo e breve video del telefono.

Data: **23/10/2026**. Workspace inizialmente vuoto; tutti i file di consegna sono nuovi. Implementazione **Kotlin Multiplatform + Compose Multiplatform**, priorità Android/iOS.

## Framework, versioni e dipendenze

* Kotlin e compiler Compose **2.4.21**; Compose Multiplatform/Material 2 **1.12.1**.
* AGP **9.2.1**, Gradle **9.4.1**, Java **17**; compileSdk/targetSdk **37**, minSdk **24**.
* Android: Activity Compose **1.13.0**, CameraX **1.6.2**, ZXing core **3.5.4**, SharedPreferences.
* iOS: UIKit/AVFoundation e NSUserDefaults di sistema; target iOS **15.0**, arm64 reale e simulatore arm64. Toolchain prevista: Xcode **26.4**.
* Test: kotlin-test **2.4.21**, AndroidX Test runner **1.7.0**, ext JUnit **1.3.0**.

Struttura derivata dal template ufficiale Kotlin/KMP-App-Template aggiornato, con modulo Android separato e plugin Android KMP dedicato; versioni stabili verificate in documentazione e su Maven. Si usa Material 2 stabile per evitare Material 3 preliminare. Non si usano librerie scanner KMP non verificate: i due adattatori sono nativi e concreti.

**58 file consegnati**, elencati in [FILES.txt](FILES.txt), esclusi cache, build e prove locali. **13 coordinate di libreria dirette uniche**, di cui **10 di produzione** e **3 solo test**. Activity Compose è dichiarata nei due moduli e contata una sola volta; kotlin-test è incluso. Sono esclusi i 5 plugin Gradle, il riferimento a `:shared`, le librerie di sistema, la stdlib implicita e le dipendenze transitive. Nessuna dipendenza JavaScript/CocoaPods/SPM.

Coordinate di produzione: `org.jetbrains.compose.runtime:runtime`, `org.jetbrains.compose.foundation:foundation`, `org.jetbrains.compose.material:material`, `org.jetbrains.compose.ui:ui`, `androidx.activity:activity-compose`, `androidx.camera:camera-core`, `camera-camera2`, `camera-lifecycle`, `camera-view`, `com.google.zxing:core`. Test: `org.jetbrains.kotlin:kotlin-test`, `androidx.test:runner`, `androidx.test.ext:junit`.

## Comandi e risultati reali

| Verifica | Esito osservato |
|---|---|
| `gradlew.bat :shared:jvmTest :androidApp:assembleDebug` | BUILD SUCCESSFUL; prima build 3m24s; 12 test commonTest, zero errori/fallimenti |
| `gradlew.bat :androidApp:connectedDebugAndroidTest :androidApp:assembleRelease :androidApp:lintDebug` | BUILD SUCCESSFUL; test strumentale reale 1/1 passato; prima release compilata |
| `gradlew.bat :shared:jvmTest :androidApp:assembleDebug :androidApp:assembleRelease :androidApp:bundleRelease :androidApp:lintDebug` | BUILD SUCCESSFUL; 12 test comuni nuovamente passati dopo adattamento layout |
| Build finale `:androidApp:assembleDebug :androidApp:assembleRelease :androidApp:bundleRelease :androidApp:lintDebug` | BUILD SUCCESSFUL in 15s; lint finale: **No issues found.** |
| `javac` + `java GenerateDemoQrs` | 7 QR generati, tutti i payload verificati con ZXing su frame in memoria |
| `java GenerateAppIcon` | Icona iOS 1024px generata con Java2D |
| `python tools/verify_android.py --serial emulator-5554` | Smoke test sull’app installata; dettagli sotto |

Ambiente effettivo: **Windows, JDK 17.0.0, emulatore Medium_Phone_API_36.1, Android 16 / API 36, x86_64, 1080×2400**. Compilazione contro SDK 37 installato come `android-37.0`; esecuzione su API 36. Nessun dispositivo mobile fisico disponibile.

Il test strumentale crea uno storage separato, esegue un check-in con trim, ricrea il repository, legge anche il file SharedPreferences su disco, verifica che contenga solo ID e conferma il reset. Non confondere questo test con il repository in-memory di commonTest. Le suite JVM contengono rispettivamente **6 + 4 + 2** test.

### Criteri di accettazione e smoke test Android

1. Prima apertura **0 / 6**: **PASS**.
2. Inserimento `EVT-001`: **1 / 6**, Giulia Rossi **Presente**: **PASS**.
3. Ripetizione `EVT-001`: **Check-in già effettuato**, sempre **1 / 6**: **PASS**.
4. `ERR-999`: **QR non valido**, sempre **1 / 6**: **PASS**.
5. `am force-stop` e rilancio: **1 / 6**: **PASS**.
6. Reset: Annulla mantiene lo stato, conferma porta a **0 / 6**, un nuovo riavvio mantiene zero: **PASS**.
7. Fotocamera su dispositivo reale che legge `EVT-002`: **NON VERIFICATO**, né Android né iOS.

Verificato inoltre nell’emulatore: rifiuto del permesso, banner italiano di errore e check-in manuale `EVT-002` funzionante; permesso concesso, apertura anteprima nativa e annullamento senza incremento. Queste prove non attestano una scansione ottica reale. Il test termina reimpostando la demo a zero.

Dopo la sola correzione cromatica del pulsante scanner è stato installato anche l’APK definitivo: anteprima e annullamento nuovamente verificati, contatore persistente **0 / 6**, screenshot scanner aggiornato. Plist, schema XML Xcode, XML Android e JSON degli asset sono stati letti con parser standard senza errori; ciò non equivale alla compilazione iOS.

L’emulatore avviato senza finestra per queste prove è stato chiuso al termine; l’APK resta installato nell’AVD con stato della demo a zero.

Screenshot dell’esecuzione, nella directory locale esclusa dal conteggio/Git:

* `verification/local/01-first-open.png`
* `verification/local/02-check-in.png`
* `verification/local/03-scanner.png`
* `verification/local/04-reset.png`

Report automatici ricreabili: `shared/build/reports/tests/jvmTest/index.html`, `androidApp/build/reports/androidTests/connected/debug/index.html`, `androidApp/build/reports/lint-results-debug.html`. Gli XML riportano 12 test JVM e 1 test Android, zero fallimenti.

## Errori incontrati e correzioni effettuate

* Download iniziale bloccato dal DNS della sandbox: usato accesso di rete autorizzato per fonti e dipendenze. Nessuna dipendenza sostituita a causa di API/versioni incompatibili; la prima compilazione Kotlin/Android è riuscita.
* Il comando `java` presente nel PATH passa da uno shim Oracle che non ha risposto; Gradle e generatori sono stati eseguiti con il JDK 17 di `JAVA_HOME`.
* Avviso KMP sui test Android host non abilitati: aggiunto `withHostTest {}`. I test comuni effettivamente eseguiti sono quelli JVM, non si dichiara un’esecuzione dell’host test Android.
* Lint ha segnalato icona assente e regole backup da esplicitare: aggiunti vettore launcher e regole separate per Android vecchio/nuovo. Lint finale senza rilievi.
* Il generatore leggeva un frame di 29 pixel troppo piccolo per il decoder: mantenuta matrice SVG compatta e usato frame 290px per la verifica, con margine bianco. Tutti e sette i payload sono poi passati.
* Il source launcher della prima versione Oracle Java 17 ha prodotto un errore interno durante una rigenerazione: i comandi documentati usano `javac` e classi compilate, verificati con successo.
* Primo tentativo smoke test: l’app era stata disinstallata al termine del test strumentale; installata esplicitamente prima della prova. Tentativo successivo interrotto dal dialogo **Pixel Launcher isn't responding** dell’emulatore: chiuso il launcher bloccato e rieseguita la prova. Nessun crash di Event Check-in osservato.
* Corretti durante l’ispezione: ordine dei modifier per il limite di larghezza a 680dp, stato che va a capo con font grandi, listener scanner espresso come protocollo per semplificare Swift, annullamento dei callback Swift pendenti dopo lo smontaggio e colore del pulsante di annullamento scanner uniformato al verde petrolio.

I messaggi su librerie native Android non ridotte da `strip` non hanno impedito la build: AGP le ha incluse senza stripping. Nessuna firma di release, chiave o pubblicazione effettuata.

## Parti specifiche di piattaforma

**Condiviso commonMain:** modello, seed immutabile, funzione pura `processCheckIn`, esito sealed, gate monotono, interfaccia store, repository, protocolli scanner/listener e intera schermata Compose.

**Android:** `androidApp` contiene launcher, tema/icona, backup e build; `shared/androidMain` contiene permission CAMERA, camera opzionale, scanner Activity, CameraX/ZXing e SharedPreferences. Camera legata al lifecycle; executor e frame liberati. Il manifest finale non ha permesso INTERNET; una dipendenza transitiva Media3 aggiunge ACCESS_NETWORK_STATE, che non abilita richieste di rete.

**iOS:** `shared/iosMain` contiene NSUserDefaults e ComposeUIViewController; `iosApp` contiene il bridge Swift reale AVFoundation, launcher SwiftUI, Info.plist con usage description, icona, progetto Xcode e schema. Coda sessione seriale e callback main thread, stop a risultato/annullamento/errore/background. Orientamento portrait. Il progetto non include un simulatore Intel x86_64.

## Stato dei target e limiti

| Target | Stato |
|---|---|
| Android debug | Compilato, installato ed eseguito su emulatore; criteri 1–6 verificati |
| Android release APK + AAB | Prodotti, **non firmati**; non installati come release |
| JVM | Test eseguiti; nessuna applicazione desktop prodotta |
| iOS Kotlin/Swift/NSUserDefaults/AVFoundation | Implementazione e progetto presenti; compilazione, test iOS, simulatore, firma e device **NON VERIFICATI**, host Windows privo di Xcode |
| Web JS/Wasm | Nessun target configurato o prodotto |
| Desktop Windows/macOS | Nessun launcher, pacchetto o adattatore camera prodotto |

Lettura camera reale, VoiceOver/TalkBack, dispositivi di dimensioni diverse e accessibilità con font estremi richiedono prove fisiche. La verifica visiva fatta qui riguarda gli screenshot dell’emulatore portrait; non è una certificazione di accessibilità. La ricerca è implementata ma non ha un test UI dedicato. Su iOS NSUserDefaults usa la normale persistenza asincrona del sistema; non è un journal transazionale.

## Possibilità Web e criticità Desktop

Logica, seed, interfacce e UI sono riusabili. Kotlin/JS permette una destinazione per la logica e una UI DOM dedicata; il percorso Compose JS attuale richiede anch’esso setup e verifica. Per UI Compose Web con Kotlin/Wasm servono `wasmJs`, WasmGC nei browser supportati e adattatori browser per storage/permessi/camera/decoder. Supporto e maturità vanno verificati sulla versione fissata e sui browser di destinazione; non sono stati provati qui.

Desktop Compose JVM richiede launcher, persistenza, distribuzione e adattatore webcam specifici; CameraX non fornisce una webcam Windows/macOS. Si possono condividere UI e logica e usare un decoder JVM, ma servono acquisizione frame e gestione risorse/permessi/driver. Nessun supporto desktop è dedotto dal solo passaggio di `jvmTest`.

I comandi completi per installazione, permessi, avvio, test, firma e release sono nel [README](../README.md).
