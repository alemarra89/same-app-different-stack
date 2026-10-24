# Verifica e resoconto standard

**Nuova verifica Release del 24/10/2026:** [misura separata della build e prova senza server sul telefono, con video e screenshot](RELEASE_BUILD_2026-10-24.md). Primo tentativo riuscito, APK universale 63,82 MB, check-in e persistenza dopo arresto completo verificati.

**Report storico del 23/10/2026.** Per la nuova misura della build debug del 24/10, con preparazione/download separati e verifica reale di scanner, check-in e persistenza Android dopo arresto del processo, consultare [DEBUG_BUILD_2026-10-24.md](DEBUG_BUILD_2026-10-24.md). Le indicazioni «non verificato» sotto si riferiscono alla sessione originaria.

Data: 23/10/2026. Host Windows. Progetto creato da zero con template ufficiali Flutter.

## Framework, librerie e dipendenze

Flutter **3.35.6 stable**, Dart **3.9.2**, null safety, Material 3. Scanner `mobile_scanner` **7.4.2**, storage `shared_preferences` **2.5.3** con API async. Versioni e compromesso SDK documentati nel README. Nessun framework di state management esterno.

**4 dipendenze esterne dirette** (2 runtime + 2 sviluppo), **3 dipendenze SDK**, **46 voci nel lock**. `cupertino_icons` del template è stato rimosso. Conteggio file e inventario completo in [FILES.md](FILES.md); nessun sorgente applicativo preesistente.

## Comandi realmente eseguiti

| Comando equivalente pubblico | Risultato reale |
| --- | --- |
| `flutter --version` | Flutter 3.35.6 stable, Dart 3.9.2 |
| `flutter doctor -v` | Android SDK presente; avviso su alcune licenze; nessun dispositivo Android/iOS collegato; Visual Studio C++ assente |
| `flutter create --platforms=android,ios,web --org it.demo --project-name event_check_in --no-pub .` | 81 file generati dai template |
| `flutter pub get` | Risoluzione riuscita, lock con 46 pacchetti/SDK |
| `dart format lib test` | Formattazione completata |
| `flutter analyze --no-pub` | **No issues found!** |
| `flutter test --no-pub` | **+17: All tests passed!**, circa 3 s di test escluso avvio |
| `flutter build apk --debug` | **Built build/app/outputs/flutter-apk/app-debug.apk**, 466,2 s |
| `flutter build apk --release --no-pub` | Build release riuscita prima del controllo permessi; verifica finale dopo rimozione rete riportata sotto |
| `flutter build web --no-web-resources-cdn --no-pub` | **Built build/web**, circa 42 s; successiva rigenerazione include i metadati finali |
| `flutter emulators` | AVD Medium_Phone_API_36.1 disponibile; non avviato |

Il sandbox non consentiva al wrapper `flutter.bat` di aprire il lock nella cache SDK. Dopo verifica del problema, i comandi Flutter sono stati eseguiti con accesso autorizzato alla cache tramite il tool già installato: `C:/Users/utente/flutter-sdk/flutter/bin/cache/dart-sdk/bin/dart.exe C:/Users/utente/flutter-sdk/flutter/bin/cache/flutter_tools.snapshot <argomenti>`. È lo stesso tool dell’SDK; i comandi normali sopra sono quelli da riprodurre in un terminale con accesso all’SDK. Non è stato modificato l’SDK globale. I tentativi iniziali rimasti in attesa sono stati chiusi.

## Copertura automatica: 17 test

- **6 logica pura**: seed esatto; valido e immutabilità; duplicato; sconosciuto; trim; rifiuto URL/JSON/case errato/codice vuoto.
- **2 cooldown**: soglia 999/1000 ms e trim; alternanza codici e reset del filtro.
- **6 storage/controller**: backend async ufficiale in memoria; ricreazione store/controller e reset persistito; scrittura fallita; caricamento fallito e riprova; ID sconosciuti nello storage; operazioni sovrapposte.
- **3 widget**: percorso manuale con ricerca e conferma/annullamento reset; schermo 320×700 con font 200%; scanner non supportato e ritorno al manuale.

I test di persistenza automatici usano memoria al confine con la piattaforma: **non provano la durabilità su disco Android/iOS**. Il test Web descritto sotto usa invece il plugin e localStorage reali del browser.

## Prova nel browser realmente eseguita

Build release Web servita soltanto su `127.0.0.1:8766`; controllo nel browser integrato:

1. Prima apertura: 0 / 6.
2. Inserimento ` EVT-001 `: 1 / 6 e Giulia Presente.
3. Ripetizione `EVT-001`: Check-in già effettuato, sempre 1 / 6.
4. Inserimento `ERR-999`: QR non valido, sempre 1 / 6.
5. Ricaricamento completo della pagina: 1 / 6 e Giulia Presente, con nuovo stato Dart inizializzato da localStorage reale.
6. Reimposta demo → conferma: 0 / 6; ulteriore ricaricamento: 0 / 6.
7. Ispezione visiva a 1280×720 e 390×844. Anteprima in [previews/mobile-web.jpg](previews/mobile-web.jpg).

Un reload Web prova ricostruzione applicazione e rilettura dello storage sulla stessa origine; non equivale a un test di force-stop/riapertura nativa. Il fallback scanner Web è verificato automaticamente come ramo piattaforma non supportata; nessuna camera Web è stata avviata.

## Errori incontrati e correzioni

- Incompatibilità SDK della release più recente di shared_preferences: scelta e pin della stabile 2.5.3 compatibile; niente override forzati.
- Primo analyze avviato prima della sostituzione del test template: riferimento a `MyApp` eliminato con il test reale.
- Primo fake SharedPreferencesAsync senza backend: configurato backend ufficiale in memoria, aggiungendo una sola dipendenza di sviluppo; corretta anche l’immutabilità del fake.
- Test UI iniziale cercava contatore fuori dalla porzione costruita della lista; reso il test di flusso indipendente dal viewport e aggiunto test separato realmente stretto.
- Overflow della data e del testo stato al 200%: aggiunti vincoli flessibili ai testi; test stretto ora passa.
- Retry scanner: mantenuto MobileScanner montato sotto l’overlay errore, così il controller resta collegato durante Riprova.
- Preparazione Gradle iniziale lenta: circa 466 s fino all’APK debug, nessun errore di compilazione nativa.
- Ispezione dell’APK release: le librerie native aggiungevano INTERNET/ACCESS_NETWORK_STATE. Un manifest dedicato release li rimuove; il debug mantiene la rete per gli strumenti Flutter. L’app non integra SDK analytics; il modello ML Kit Android è bundled.
- Build Web: avviso non bloccante su famiglia `CupertinoIcons` non inclusa, dopo rimozione dell’asset template; nessuna icona mancante osservata nelle viste Material verificate. Wasm dry run riuscito; **nessuna build Wasm distribuita o provata**.

## Parti specifiche di piattaforma

**Android**: CAMERA, camera opzionale, backup disabilitato, manifest release che rimuove rete, SDK minimo 24 / compile 36, Java/Kotlin target 17. Toolchain del template AGP 8.9.1 / Kotlin 2.1.0 / Gradle 8.12. Firma release con chiave debug per demo, non per Play Store.

**iOS**: Runner/Info.plist con descrizione camera italiana; deployment target 13 nel progetto Xcode e nel Podfile; registrazione plugin e file Runner generati dai template. Nessun permesso foto. CocoaPods, Xcode, build e firma iOS **NON VERIFICATI** (host Windows).

**Web**: runner incluso, titolo/lingua/manifest italiani, risorse renderer locali, stessa logica e localStorage. Scanner disattivato con fallback; futuro adattatore richiede decoder locale, HTTPS/localhost e verifica browser.

**Desktop**: nessun runner generato o compilato. Plugin scanner: macOS dichiarato dal produttore; Windows/Linux non supportati. L’adattatore attuale abilita solo Android/iOS. Serve un backend esplicito e manual input come fallback; compilazione e disponibilità camera sono verifiche diverse.

## Non verificato

Dispositivo reale, scansione fisica `EVT-002`, permesso negato/riabilitato e lifecycle su hardware Android/iOS; riavvio nativo e durabilità disco nativa; esecuzione emulatori; iOS; AAB/IPA e firma distribuzione; TalkBack/VoiceOver hardware; scanner Web; Desktop. Nessuno di questi è dichiarato funzionante sulla sola base della build.

## Esito finale artefatti

- **APK release finale riuscito**, 55,1 s dopo la modifica manifest; 60,3 MiB circa, firma debug della demo. `aapt dump permissions` conferma CAMERA e il permesso interno DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION; **INTERNET e ACCESS_NETWORK_STATE assenti**. Il controllo dell’APK è reale, non dedotto dal solo manifest sorgente.
- **Web finale riuscito**, 14,6 s nell’ultima rigenerazione, includendo titolo e metadati italiani. Test e screenshot a larghezza mobile si riferiscono al renderer Web, non a un dispositivo Android/iOS.
- **90 file consegnabili**, di cui 9 sorgenti Dart applicativi e 5 file Dart di test/supporto; inventario in FILES.md. Gli altri comprendono template nativi, configurazioni, asset e documentazione. 4 dipendenze esterne dirette, 7 contando SDK.
- Sintassi XML verificata con parser per i 4 manifest Android; Info.plist iOS letto con plistlib. Questo controllo non costituisce compilazione iOS.
