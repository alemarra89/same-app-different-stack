# Event Check-in · Kotlin Multiplatform

Demo locale per **Tech Meetup 2026 · 23/10/2026**, interfaccia italiana, sei partecipanti invarianti. UI Compose condivisa in `shared/src/commonMain`; scanner e storage specifici per Android/iOS. Nessun server, login, analytics, chiamata remota o modello AI nell’app.

## Requisiti e versioni fissate

Verifica delle fonti e degli artefatti Maven: **23 ottobre 2026**. Si parte dalla struttura del [template ufficiale Kotlin/KMP-App-Template](https://github.com/Kotlin/KMP-App-Template): modulo Android separato, libreria KMP, Gradle Kotlin DSL, version catalog e framework statico richiamato da Xcode. Sono rimossi rete, DI, navigazione e altre dipendenze del template non necessarie alla demo.

| Componente | Versione/scelta |
|---|---|
| Kotlin / compiler Compose | 2.4.21, stessa versione |
| Compose Multiplatform | 1.12.1, **Material 2 stabile** |
| Android Gradle Plugin | 9.2.1, plugin `com.android.kotlin.multiplatform.library` per shared |
| Gradle Wrapper | 9.4.1, JAR ufficiale e SHA-256 della distribuzione |
| Java | JDK 17 |
| Android | minSdk 24, compileSdk/targetSdk 37; Build Tools 37.0.0 |
| Activity Compose | 1.13.0 |
| CameraX | 1.6.2: core, camera2, lifecycle, view |
| Decoder Android | ZXing core 3.5.4, solo QR, interamente locale |
| iOS | deployment target 15.0; `iosArm64`, `iosSimulatorArm64` |
| Xcode per la toolchain fissata | 26.4 su macOS compatibile; simulatore su Apple Silicon |
| Storage | SharedPreferences Android; NSUserDefaults iOS |
| Test | kotlin-test 2.4.21; AndroidX runner 1.7.0 / ext JUnit 1.3.0 |

Non vengono usate versioni alpha/beta. La scelta Material 2 evita le versioni preliminari Material 3 del template. Gradle 9.4.1 soddisfa AGP 9.2 e rientra nella matrice Kotlin scelta. Non è necessario installare Gradle globalmente.

Fonti primarie: [matrice Kotlin/Gradle/AGP/Xcode](https://kotlinlang.org/docs/multiplatform/multiplatform-compatibility-guide.html), [compatibilità Compose](https://kotlinlang.org/docs/multiplatform/compose-compatibility-and-versioning.html), [requisiti AGP](https://developer.android.com/build/releases/about-agp), [CameraX stabile](https://developer.android.com/jetpack/androidx/releases/camera), [gestione frame CameraX](https://developer.android.com/media/camera/camerax/analyze), [release ZXing](https://github.com/zxing/zxing/releases), [AVFoundation barcode](https://developer.apple.com/documentation/avfoundation/avcambarcode-detecting-barcodes-and-faces), [interoperabilità Kotlin/Swift](https://kotlinlang.org/docs/native-objc-interop.html).

## Avvio Android

Installare Android Studio/SDK, JDK 17 e i pacchetti SDK. Su Windows PowerShell:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
& "$env:ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat" 'platform-tools' 'platforms;android-37' 'build-tools;37.0.0'
.\gradlew.bat :shared:jvmTest :androidApp:assembleDebug
.\gradlew.bat :androidApp:installDebug
& "$env:ANDROID_HOME\platform-tools\adb.exe" shell am start -n it.demo.eventcheckin.kmp/.MainActivity
```

Su macOS/Linux, impostare `JAVA_HOME` e `ANDROID_HOME` per le proprie installazioni, usare `./gradlew` al posto di `.\gradlew.bat`. Se lo checkout non conserva i permessi Unix, eseguire `chmod +x gradlew`. In alternativa indicare `sdk.dir` in un `local.properties` locale, escluso dal repository. Il primo download Gradle richiede Internet; l’app installata funziona offline.

Alcune installazioni SDK recenti espongono il pacchetto API 37 come `platforms;android-37.0`: usare l’identificatore mostrato da `sdkmanager --list` se `android-37` non è disponibile. La build qui verificata ha usato la piattaforma installata `android-37.0`.

Aprire il progetto radice in Android Studio e lanciare `androidApp` su AVD o dispositivo USB. Scegliere JDK 17 anche come Gradle JDK dell’IDE.

### Fotocamera Android

Premere **Scansiona QR** e concedere il permesso. La camera non è una funzionalità hardware obbligatoria nel manifest. Al rifiuto, a camera assente/occupata o ad avvio non supportato, si torna alla schermata con un errore e il modulo manuale attivo. Per ripristinare un permesso negato: Impostazioni Android → App → Event Check-in → Autorizzazioni → Fotocamera. In un AVD di prova si può anche usare `adb shell pm grant it.demo.eventcheckin.kmp android.permission.CAMERA`.

Lo scanner usa una Activity interna, anteprima CameraX e analisi in un executor dedicato, solo formato QR con ZXing. Rispetta il lifecycle, chiude sempre gli ImageProxy, scarta i frame in eccesso e rilascia i casi d’uso alla chiusura. Preferisce la camera posteriore e ripiega sull’anteriore. Non salva immagini o video.

## Avvio iOS su Mac

**La compilazione iOS non è stata eseguita su questa macchina Windows.** Non servono CocoaPods, SPM o un generatore di progetti Xcode: il progetto `.xcodeproj` e lo schema condiviso sono inclusi.

1. Installare JDK 17, Xcode 26.4 e un runtime simulatore iOS compatibile; eseguire `xcode-select --install`, selezionare Xcode con `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` e accettarne la licenza.
2. Dal repository eseguire `chmod +x gradlew`. Configurare `JAVA_HOME` per JDK 17. Se Xcode avviato dal Finder non vede Java, aggiungere `export JAVA_HOME=$(/usr/libexec/java_home -v 17)` prima della chiamata Gradle nella fase **Compile Kotlin Framework**.
3. Aprire `iosApp/iosApp.xcodeproj`; selezionare schema **iosApp**, simulatore iPhone **arm64**, quindi Run. La fase Gradle produce e integra `Shared.framework` tramite `:shared:embedAndSignAppleFrameworkForXcode`.
4. Su iPhone reale, scegliere il proprio Team in Signing & Capabilities, collegare il dispositivo e autorizzare lo sviluppatore. Il bundle ID predefinito è `it.demo.eventcheckin.kmp`; personalizzarlo se già occupato.

Configurazione locale opzionale non versionata: `iosApp/Configuration/Local.xcconfig`:

```xcconfig
DEVELOPMENT_TEAM = IL_PROPRIO_TEAM_ID
PRODUCT_BUNDLE_IDENTIFIER = it.miaorganizzazione.eventcheckin
```

Comandi equivalenti, da Mac:

```sh
./gradlew :shared:linkDebugFrameworkIosSimulatorArm64
./gradlew :shared:iosSimulatorArm64Test
xcodebuild -project iosApp/iosApp.xcodeproj -scheme iosApp \
  -configuration Debug -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' -derivedDataPath build/ios \
  CODE_SIGNING_ALLOWED=NO build
```

`iosSimulatorArm64Test` richiede un simulatore disponibile/avviabile; se necessario selezionarlo nell’IDE. Il link Gradle da solo verifica il framework Kotlin, **non** compila il launcher Swift.

### Fotocamera iOS

Il bridge Swift `IosScanner` implementa il protocollo `Scanner` esportato da Kotlin. Usa **AVCaptureSession + AVCaptureMetadataOutput** per leggere esclusivamente `.qr`: AVFoundation offre già il decoder necessario, quindi Vision non serve. Non è uno stub e non usa CameraX.

La richiesta avviene al primo avvio scanner; la motivazione italiana è in `Info.plist/NSCameraUsageDescription`. Un simulatore senza camera, un rifiuto/restrizione e gli errori della sessione producono messaggi recuperabili. Si può sempre inserire manualmente `EVT-001`. Per riabilitare la camera: Impostazioni iOS → Event Check-in → Fotocamera.

Configurazione, avvio e stop della sessione avvengono su una coda seriale; i callback arrivano sul main thread. Annullamento, risultato, errore, background e smontaggio della UI fermano la cattura; delegate, input e output vengono rimossi. La demo dichiara orientamento **portrait** su iPhone/iPad per una preview coerente. La camera e il bridge Swift richiedono ancora verifica con Xcode e dispositivo reale.

## Uso e comportamento invarianti

| ID | Nominativo |
|---|---|
| EVT-001 | Giulia Rossi |
| EVT-002 | Marco Bianchi |
| EVT-003 | Sara De Luca |
| EVT-004 | Davide Greco |
| EVT-005 | Fabio Conti |
| EVT-006 | Ivan Moretti |

Prima apertura: **0 / 6 presenti**, tutti **In attesa**. Inserire l’ID in **Codice partecipante**, quindi **Registra check-in**, oppure usare lo scanner. Il QR contiene **esattamente** `EVT-001`, senza URL/JSON/token. Sono ignorati gli spazi esterni; il confronto dell’ID è case-sensitive. Un codice vuoto o in altro formato è **QR non valido**.

Un nuovo ingresso mostra `Check-in effettuato: Giulia Rossi`, aggiorna stato e contatore. Il duplicato mostra **Check-in già effettuato**, lo sconosciuto **QR non valido**, senza incremento. La ricerca nome/ID ignora maiuscole e spazi esterni, e non modifica il contatore globale.

`ScanGate` applica una finestra mobile di 1.000 ms per ID normalizzato usando un orologio monotono. La soppressione riguarda solo gli eventi dello scanner; due inserimenti manuali mostrano regolarmente l’esito duplicato. Gli scanner completano al massimo una volta per apertura. Il tasto **Reimposta demo** richiede conferma; Annulla conserva lo stato.

Lo storage contiene solo l’insieme degli ID presenti, non nomi, ricerche, immagini o cronologia. Android usa commit sincrono su sei stringhe prima di confermare; iOS usa NSUserDefaults locale con la normale scrittura gestita dal sistema (senza suite iCloud). Un errore di caricamento impedisce di sovrascrivere uno stato illeggibile e consente di riprovare; un errore di salvataggio non pubblica una conferma falsa. Android esclude esplicitamente backup cloud e trasferimento dello stato; su iOS valgono le normali politiche di backup del dispositivo.

## QR di prova

In `demo-qr/` sono inclusi sette SVG stampabili, da aprire su un secondo schermo o stampare. `EVT-002.svg` contiene esattamente `EVT-002`; `ERR-999.svg` è il caso sconosciuto. Il generatore Java usa ZXing e verifica i sette payload decodificando un frame in memoria prima di scrivere gli SVG. Questo controllo non equivale a una scansione da camera reale.

Rigenerazione su PowerShell dopo la prima build (su Unix usare `:` come separatore del classpath):

```powershell
$qrJar = Get-ChildItem "$env:USERPROFILE\.gradle\caches\modules-2\files-2.1\com.google.zxing\core\3.5.4" -Recurse -Filter '*.jar' | Select-Object -First 1 -ExpandProperty FullName
New-Item -ItemType Directory -Force build/tools | Out-Null
& "$env:JAVA_HOME\bin\javac.exe" -cp $qrJar -d build/tools tools/GenerateDemoQrs.java tools/GenerateAppIcon.java
& "$env:JAVA_HOME\bin\java.exe" -cp "$qrJar;build/tools" GenerateDemoQrs
& "$env:JAVA_HOME\bin\java.exe" -cp build/tools GenerateAppIcon
```

Se `GRADLE_USER_HOME` è personalizzato, adeguare il percorso alla cache. L’icona iOS 1024px e il vettore Android rappresentano lo stesso segno di spunta su verde petrolio.

## Test riproducibili

```powershell
.\gradlew.bat :shared:jvmTest
.\gradlew.bat :androidApp:connectedDebugAndroidTest
.\gradlew.bat :androidApp:lintDebug
```

`commonTest`: 6 test sulla funzione pura/dataset, 4 su repository/persistenza simulata/errori, 2 sulla finestra anti-duplicato. Il target `jvm()` serve a eseguirli sul computer, senza finestra desktop o adattatori fittizi. È abilitato anche l’host test Android. Il test strumentale usa SharedPreferences **reali**, verifica contenuto su disco, nuovo repository e reset; usa uno storage di test separato. `iosTest` include il roundtrip NSUserDefaults reale, eseguibile su Mac con i test iOS.

Test end-to-end esterno con Python 3, solo libreria standard e adb:

```powershell
.\gradlew.bat :androidApp:installDebug
python tools/verify_android.py --serial emulator-5554
```

**Il comando azzera i dati della sola app demo**, poi verifica criteri 1–6, stato Giulia, annullamento del reset, persistenza dopo force-stop, permesso negato con modulo manuale utilizzabile, apertura/annullamento scanner. Richiede device sbloccato, portrait, Android recente con `input keycombination`, lingua di sistema compatibile con il dialogo standard dei permessi. Non passa dal decoder per simulare una scansione reale. Screenshot in `verification/local/` (esclusi da Git).

Per il criterio 7, su **entrambi i dispositivi reali**: azzerare → aprire scanner → concedere permesso → inquadrare `demo-qr/EVT-002.svg` → verificare Marco Bianchi Presente e **1 / 6** → ripetere (nessun incremento) → riaprire l’app. Provare anche rifiuto permesso e camera occupata. Il criterio 7 rimane **NON VERIFICATO** finché questi passaggi non vengono eseguiti realmente.

## Build release

Android:

```powershell
.\gradlew.bat :androidApp:assembleRelease :androidApp:bundleRelease
```

Output: `androidApp/build/outputs/apk/release/androidApp-release-unsigned.apk` e `androidApp/build/outputs/bundle/release/androidApp-release.aab`. **Non firmati**, nessuna chiave nel repository. Per un APK distribuibile creare la propria chiave e firmare l’APK già allineato da AGP, ad esempio:

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -keystore "$env:USERPROFILE\event-checkin-release.jks" -alias event-checkin -keyalg RSA -keysize 2048 -validity 10000
& "$env:ANDROID_HOME\build-tools\37.0.0\apksigner.bat" sign --ks "$env:USERPROFILE\event-checkin-release.jks" --out build/EventCheckIn-release.apk androidApp/build/outputs/apk/release/androidApp-release-unsigned.apk
& "$env:ANDROID_HOME\build-tools\37.0.0\apksigner.bat" verify build/EventCheckIn-release.apk
```

Per AAB firmare con `jarsigner` oppure configurare la propria signing configuration in Android Studio. Generazione chiavi, firma e pubblicazione **non eseguite**.

iOS su Mac, dopo aver configurato Team e provisioning:

```sh
xcodebuild -project iosApp/iosApp.xcodeproj -scheme iosApp \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath build/EventCheckIn.xcarchive archive
```

Esportare dall’Organizer di Xcode con il proprio profilo/distribuzione. Build, archive, firma e pubblicazione iOS **NON VERIFICATI**.

## Architettura e file

```text
gradle/libs.versions.toml                versioni e dipendenze
gradle/wrapper/, gradlew, gradlew.bat      wrapper ufficiale
shared/build.gradle.kts                   target Android/iOS e JVM per test
shared/src/commonMain/kotlin/it/eventcheckin/
  model/Participant.kt                    modello immutabile
  data/EventSeed.kt                       dataset e evento
  domain/CheckIn.kt                       processCheckIn ed esito tipizzato
  domain/ScanGate.kt                      deduplica temporale scanner
  storage/CheckInStore.kt                 interfaccia persistenza
  data/CheckInRepository.kt               caricamento, commit e reset
  scanner/Scanner.kt                     protocolli scanner/listener
  ui/EventCheckInApp.kt                   UI Compose italiana condivisa
shared/src/androidMain/                   manifest, storage e scanner CameraX
shared/src/iosMain/                       NSUserDefaults e ComposeUIViewController
shared/src/commonTest/                    test funzione, repository e ScanGate
shared/src/iosTest/                       test NSUserDefaults
androidApp/                              launcher, risorse, build e test strumentale
iosApp/                                  launcher Swift, AVFoundation, plist, Xcode
demo-qr/                                 sette QR SVG con payload invarianti
tools/                                   generazione asset e smoke test adb
verification/REPORT.md                   risultati reali e resoconto standard
```

L’elenco completo dei file consegnati è in `verification/FILES.txt`. Il colore accento è `#25785B`. Il layout chiaro usa card, target touch di almeno 48dp per le azioni, testi di stato espliciti, annunci accessibili dei risultati, campi etichettati e azioni da tastiera. Il contenuto scorre con tastiera/font ingranditi e si limita a 680dp su schermi ampi. Verifica VoiceOver/TalkBack su dispositivi reali ancora da fare.

## Possibile estensione Web e Desktop

Non sono prodotti target/app Web o Desktop. I modelli, il seed, la funzione pura, `ScanGate`, il repository e l’interfaccia scanner/storage sono in commonMain senza dipendenze dalle API mobili. Anche la UI Compose è condivisa; gli entry point iniettano gli adattatori.

* **Kotlin/JS** può ospitare la logica; una UI DOM richiede un’implementazione dedicata. Compose Multiplatform attuale offre anche un percorso UI JS di compatibilità, ma aggiungerlo richiede configurazione e verifica specifica: non è implicito nel solo modello KMP.
* **Compose Web Kotlin/Wasm** può riusare la UI Compose; richiede target `wasmJs`, browser/runtime compatibile (WasmGC), entry point e storage browser. Maturità e supporto vanno valutati per la versione e i browser scelti. Camera tramite `getUserMedia` in contesto sicuro, permessi e decoder QR verificato, con fallback manuale. Nessun adattatore Web è incluso o dichiarato funzionante.
* **Desktop Compose JVM Windows/macOS** può condividere UI e logica, ma servono entry point desktop, storage locale dedicato e un adattatore camera/decoder (CameraX non è un’API webcam desktop, AVFoundation Swift qui è integrato solo nell’app iOS). Packaging, permessi macOS, webcam/driver, lifecycle e accessibilità richiedono prove distinte. Il target JVM presente serve ai test e **non è un’app desktop**.

La base dà priorità alla demo mobile e non inserisce dipendenze o scanner vuoti per piattaforme future.
