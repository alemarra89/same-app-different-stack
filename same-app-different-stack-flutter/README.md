# Event Check-in · Flutter

Demo locale per **Tech Meetup 2026 · 23/10/2026**, interamente in italiano. Android e iOS sono i target principali; è incluso un target Web separato con inserimento manuale. Nessun account, backend, analytics o API remota. L’unica informazione persistita è l’insieme degli ID presenti.

## Requisiti e versioni

Ambiente usato il **23/10/2026**: Windows, **Flutter 3.35.6 stable**, **Dart 3.9.2**, Java 21 di Android Studio. È l’SDK stabile già installato, non una dichiarazione che sia l’ultima release Flutter disponibile. Null safety, Material 3, `ChangeNotifier` e `ListenableBuilder`, senza librerie di state management.

| Pacchetto diretto | Versione | Scopo |
| --- | --- | --- |
| `mobile_scanner` | 7.4.2 | QR dalla fotocamera Android/iOS |
| `shared_preferences` | 2.5.3 | `SharedPreferencesAsync`, soli ID locali |
| `flutter_lints` | 5.0.0 | Analisi, solo sviluppo |
| `shared_preferences_platform_interface` | 2.4.2 | Backend ufficiale in memoria, solo test |

Dipendenze SDK: `flutter`, `flutter_localizations`, `flutter_test`. Totale **4 pacchetti esterni diretti: 2 runtime + 2 sviluppo**; **7 dichiarazioni dirette** contando i 3 SDK. Risoluzione esatta e checksum in `pubspec.lock`: conservarlo per il confronto. Le 46 voci del lock includono SDK e dipendenze transitive, non sono 46 dipendenze applicative dirette.

La documentazione e i sorgenti pubblicati sono stati consultati prima della scelta. `mobile_scanner` 7.4.2 dichiara Dart >=3.7 / Flutter >=3.29. `shared_preferences` 2.5.6 richiede Dart >=3.11 / Flutter >=3.41, quindi è stata selezionata la stabile 2.5.3 (Dart >=3.5 / Flutter >=3.24) compatibile con l’SDK disponibile. I plugin transitivi risolti sono tra gli altri `shared_preferences_android` 2.4.23 e `shared_preferences_foundation` 2.5.6. Il loro requisito effettivo è Android 24+ / iOS 13+.

Fonti primarie:

- [Scanner 7.4.2: SDK e API](https://github.com/juliansteenbakker/mobile_scanner/tree/v7.4.2), [documentazione scanner](https://pub.dev/packages/mobile_scanner/versions/7.4.2).
- [Storage 2.5.3: requisiti](https://github.com/flutter/packages/blob/shared_preferences-v2.5.3/packages/shared_preferences/shared_preferences/pubspec.yaml), [requisiti della 2.5.6](https://github.com/flutter/packages/blob/shared_preferences-v2.5.6/packages/shared_preferences/shared_preferences/pubspec.yaml).
- [Storage: API async e limiti di durabilità](https://pub.dev/packages/shared_preferences).

## Installazione e avvio Android

Installare Flutter nel PATH, Android Studio, SDK Android Platform 36, build tools e un JDK compatibile con Gradle (qui usato Java 21). `compileSdk=36`, `minSdk=24`, bytecode Java/Kotlin 17; AGP 8.9.1, Kotlin 2.1.0 e Gradle 8.12 derivano dai template dell’SDK e hanno prodotto l’APK debug. ML Kit è **bundled**: nessun modello da scaricare al primo avvio.

```sh
flutter --version
flutter doctor -v
flutter doctor --android-licenses
flutter pub get
flutter analyze
flutter test
flutter devices
flutter run -d android
```

`android` funziona come selettore solo se identifica un dispositivo connesso. In alternativa usare l’ID effettivo restituito da `flutter devices`, per esempio `flutter run -d emulator-5554`. Per avviare un AVD: `flutter emulators`, poi `flutter emulators --launch <id-avd>`.

Toccare **Scansiona QR** per richiedere il permesso fotocamera. In caso di rifiuto: Impostazioni Android → App → Event Check-in → Autorizzazioni → Fotocamera; rientrare e usare Riprova oppure riaprire lo scanner. Senza camera o con permesso negato, tornare al modulo manuale. Il manifest dichiara CAMERA e camera/autofocus **opzionali**. Il backup Android è disabilitato.

## Avvio iOS (richiede macOS)

Servono macOS, Xcode con command line tools e SDK iOS, CocoaPods e simulatore/dispositivo. Deployment target **iOS 13.0** sia nel progetto Xcode sia nel Podfile. Le dipendenze includono i rispettivi privacy manifest. `NSCameraUsageDescription` è già configurato in italiano; non viene richiesto accesso alla libreria foto.

```sh
flutter pub get
cd ios
pod install
cd ..
flutter devices
flutter run -d ios
```

Se `ios` non individua un dispositivo, usare l’UDID mostrato da `flutter devices`. Aprire `ios/Runner.xcworkspace` in Xcode per selezionare Team e firma su dispositivo. Il simulatore può non avere una camera utilizzabile: usare il codice manuale. Per riabilitare il permesso, Impostazioni iOS → Event Check-in → Fotocamera, poi tornare all’app. **Compilazione e avvio iOS NON VERIFICATI su questo host Windows.**

## Build e release

```sh
flutter build apk --debug
flutter build apk --release
flutter build appbundle --release
# Su macOS, compilazione senza firma per controllo:
flutter build ios --release --no-codesign
# Per distribuzione, con Team/provisioning/certificati configurati:
flutter build ipa --release
```

Per il confronto richiesto il comando breve è `flutter build ios`; richiede comunque macOS e la configurazione di firma. L’APK è in `build/app/outputs/flutter-apk/`, l’AAB in `build/app/outputs/bundle/release/`.

**La configurazione Android release usa intenzionalmente la chiave debug per la demo.** Un APK release così prodotto non è pronto per Play Store. Per distribuzione sostituire `signingConfigs.getByName("debug")` con una signing config privata; keystore e `key.properties` sono esclusi dal versionamento. Bundle ID demo: `it.demo.event_check_in`. Nessun certificato o segreto è incluso. AAB, IPA e firma di distribuzione: NON VERIFICATI.

## Target Web separato

```sh
flutter run -d chrome --web-port 8766
flutter build web --no-web-resources-cdn
# Per provare l’output release (Python è solo un server di sviluppo):
python -m http.server 8766 --bind 127.0.0.1 --directory build/web
```

Aprire `http://127.0.0.1:8766`. Il flag di build usa risorse del renderer locali. Il target usa la stessa logica, seed, ricerca, conferme e storage (localStorage del browser). Mantenere la stessa origine/porta tra riaperture; modalità privata, cancellazione dati o browser diversi non condividono lo stato. Non è stata implementata una strategia PWA offline.

**Lo scanner Web è volutamente disattivato nell’adattatore**, con messaggio e ritorno al codice manuale. La documentazione del plugin prevede backend Web anche con librerie scaricate da CDN: per rispettare il requisito senza servizi remoti occorre un futuro adattatore con decoder servito localmente, HTTPS/localhost e gestione permessi browser. Il plugin non viene avviato sul Web e non carica decoder remoti. La build Web verificata non certifica uno scanner Web.

## Architettura e comportamento

```text
lib/
  main.dart                       tema Material 3, localizzazione, ownership controller
  models/participant.dart         modello immutabile
  data/event_seed.dart            evento e sei partecipanti invarianti
  logic/check_in.dart             processCheckIn(id, participants), esito tipizzato
  logic/check_in_controller.dart  caricamento, salvataggio, reset e notifiche
  logic/scan_gate.dart            cooldown per codice, tempo monotono
  storage/check_in_store.dart     interfaccia + adattatore SharedPreferencesAsync
  screens/event_screen.dart       elenco, ricerca, modulo, feedback e reset
  scanner/qr_scanner.dart         adattatore mobile, permessi, lifecycle e fallback
```

`processCheckIn` è pura: non modifica la lista ricevuta, restituisce lista non modificabile e `success`, `alreadyPresent` o `invalid`. Il trim rimuove solo spazi iniziali/finali; case e schema restano esatti. I messaggi per duplicato e sconosciuto sono **Check-in già effettuato** e **QR non valido**.

Le scritture sono attese prima di aggiornare UI/contatore. Un errore di lettura blocca le modifiche con pulsante Riprova; un errore di scrittura mostra errore e conserva lo stato precedente. Operazioni sovrapposte sono bloccate. Non vengono salvati nomi, ricerche, timestamp o dati della camera. Lo storage ha un’unica chiave, `event_check_in.tech_meetup_2026.present_ids`; il reset scrive un insieme vuoto soltanto su quella chiave. ID sconosciuti eventualmente presenti nello storage vengono ignorati.

Lo scanner accetta solo QR. Ogni apertura restituisce un solo risultato e chiude la camera; un latch scarta callback ravvicinati. Un ulteriore filtro per ID blocca ripetizioni entro 1000 ms anche tra aperture diverse; il manuale lo bypassa per mostrare subito il messaggio di duplicato. Start/stop sono serializzati, la camera viene fermata quando l’app diventa inattiva e riavviata al ritorno; il dispose attende eventuali richieste permesso pendenti. Errori, camera assente e piattaforme non supportate hanno messaggi italiani e ritorno esplicito al modulo.

Tutti i dati sono locali: **shared_preferences non garantisce durabilità da database transazionale** in caso di arresto anomalo immediato/errore del sistema operativo. Le normali riaperture rileggono gli stati salvati; non è adatto a un controllo accessi di produzione con garanzia di audit o sincronizzazione multi-dispositivo.

## Demo riproducibile e QR

| ID (contenuto esatto del QR) | Nominativo |
| --- | --- |
| EVT-001 | Giulia Rossi |
| EVT-002 | Marco Bianchi |
| EVT-003 | Sara De Luca |
| EVT-004 | Davide Greco |
| EVT-005 | Fabio Conti |
| EVT-006 | Ivan Moretti |

Usare QR contenenti il solo ID, senza URL, JSON o token. Per il test su telefono mostrare un QR `EVT-002` su un altro schermo o su carta. Non occorre alcun servizio QR dentro l’app.

1. Prima apertura (o Reimposta demo → Reimposta): **0 / 6 presenti**.
2. Inserire `EVT-001`: **1 / 6 presenti**, Giulia **Presente**, conferma visibile.
3. Ripetere `EVT-001`: **Check-in già effettuato**, resta 1 / 6.
4. Inserire `ERR-999`: **QR non valido**, resta 1 / 6.
5. Chiudere normalmente e riaprire: resta 1 / 6 sullo stesso dispositivo/origine.
6. Reimposta demo → Annulla conserva gli stati; Reimposta li azzera a 0 / 6.
7. Su dispositivo reale, Scansiona QR → concedere camera → leggere `EVT-002`: Marco **Presente**. Questo passaggio è **NON VERIFICATO** qui e non impedisce gli altri.

Ricerca per nome/ID senza distinzione maiuscole, contatore globale anche quando l’elenco è filtrato. Layout a scorrimento, larghezza massima 760, righe adattive e font di sistema scalabile; pulsanti almeno 48 logical pixel, stati testuali e live region per feedback e contatore. Test del layout a 320 px con testo 200%. TalkBack/VoiceOver reali: NON VERIFICATI.

## Verifiche e resoconto standard

Consultare [docs/VERIFICA.md](docs/VERIFICA.md) per comandi, risultati realmente ottenuti, errori e correzioni. [docs/FILES.md](docs/FILES.md) elenca i file consegnabili e il conteggio, escludendo cache e output di build. Tutto è creato da zero; nessun file applicativo preesistente è stato sovrascritto.

**Desktop:** non sono stati generati runner Windows/macOS/Linux. `mobile_scanner` dichiara macOS ma non Windows/Linux; qui l’adattatore abilita soltanto Android/iOS. Una futura build desktop richiede runner, toolchain e un adattatore scanner esplicito. Su macOS occorrono entitlement camera, descrizione privacy e verifiche hardware; su Windows/Linux occorre un altro backend. Il modulo manuale resta il fallback. Un target compilabile non prova che la camera funzioni. Visual Studio C++ non è installato su questo host. Desktop: NON VERIFICATO.

Esito finale: **17 test passati**, analisi pulita, **APK Android debug e release compilati**, Web compilato e provato nel browser. **90 file consegnabili** ([inventario](docs/FILES.md)). Release Android senza permessi di rete, verificata sull’APK; firma debug per demo. iOS e scansione QR fisica restano NON VERIFICATI. Vedere il report per dettagli e avvisi residui.
