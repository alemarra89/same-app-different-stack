# Flutter — build debug e verifica Android

Verifica del **24/10/2026**, fuso Europe/Rome, sui sorgenti correnti. APK debug compilato, installato e avviato sul telefono **M2101K9G, Android 12 / API 31**. Package controllato nell'APK: `it.demo.eventcheckin.flutter`, versione `1.0.0+1`. Scanner, check-in e persistenza dopo arresto completo del processo verificati su Android.

## Misure richieste

| Voce | Risultato |
| --- | --- |
| Build riuscita al primo tentativo | **Sì**, primo tentativo di compilazione di questa verifica |
| Compilazione iniziale dopo pulizia degli output | **138,368 s — 2 min 18,37 s** |
| Preparazione separata, esclusa dalla compilazione | **39,120 s** |
| Download SDK e dipendenze durante questa verifica | **0 s**, strumenti e pacchetti già presenti; Pub e Gradle offline |
| Errori di compilazione / correzioni ai sorgenti | **Nessuno / nessuna** |

Preparazione: `flutter clean` **7,074 s**; `flutter pub get --offline` **6,032 s**; Gradle `clean :app:dependencies --configuration debugRuntimeClasspath --offline --no-daemon` **26,014 s**. Il messaggio generico `Downloading packages...` di Pub compare anche nella risoluzione offline; il comando ha usato la cache locale.

Il cronometro `System.Diagnostics.Stopwatch` racchiude il processo Gradle `:app:assembleDebug --offline --no-build-cache --no-daemon --max-workers=2 --console=plain`, dalle **17:47:27 Europe/Rome**. Include avvio del daemon, configurazione, compilazione Dart e Android, creazione e firma dell'APK. Gradle riporta `BUILD SUCCESSFUL in 2m 18s`, 91 task: 86 eseguiti e 5 già aggiornati.

Output applicativi puliti con Flutter e Gradle; build cache Gradle disabilitata. Restano disponibili SDK, dipendenze, trasformazioni e plugin della toolchain già compilati. La misura riguarda un APK universale **armeabi-v7a, arm64-v8a, x86_64** e non è direttamente equivalente a una build con una sola architettura. Non è una prima installazione della toolchain né un benchmark su macchina isolata: un controllo preliminare bloccato nel sandbox è stato chiuso durante la compilazione.

Il tempo storico di download/installazione degli strumenti già presenti è **non disponibile**, non zero. Il precedente tempo di 466,2 s nel [report del 23/10](VERIFICA.md) comprendeva preparazione Gradle non separata: non viene riutilizzato come misura della sola compilazione. Installazione APK, avvio e test sono esclusi dai 138,368 s.

## Ambiente, problemi e interventi

- Flutter **3.35.6 stable**, Dart **3.9.2**, JDK Android Studio **21.0.8**, Gradle **8.12**, AGP **8.9.1**, Kotlin plugin **2.1.0**. Versioni locali rilevate, senza aggiornamenti della toolchain.
- Il primo controllo del wrapper Flutter nel sandbox non riusciva ad accedere al lock della cache SDK e rimaneva in attesa; l'invocazione diretta del tool ha confermato l'errore di accesso. Cache e build sono state poi usate con accesso autorizzato, avviando il tool SDK con `dart.exe .../flutter_tools.snapshot`. Il controllo bloccato è stato chiuso. Si tratta di preparazione dell'ambiente, precedente e distinta dal primo `assembleDebug`.
- Anche il server ADB non partiva nel sandbox; installazione e letture sul telefono sono state eseguite con accesso autorizzato agli strumenti già presenti. Nessuna modifica alla sicurezza del telefono.
- Warning non bloccanti: attributo `package` ignorato nel manifest di `shared_preferences_android`, disallineamento delle versioni XML SDK lette dagli strumenti CMake, API Gradle deprecate. Nessuna correzione alle dipendenze installate o ai sorgenti applicativi.
- La cattura UI su MIUI emette un avviso per `theme_compatibility.xml` assente, ma produce correttamente i file XML con lo stato Flutter. Non è un errore dell'app.

## Scanner, check-in e persistenza

| Prova | Esito ed evidenza |
| --- | --- |
| Installazione e avvio APK | **PASS**, installazione `Success`, avvio nativo `Status: ok`, `LaunchState: COLD` |
| Stato iniziale | **PASS**, `0 / 6 presenti` nella gerarchia UI Android |
| Scanner QR con fotocamera reale | **PASS con intervento umano**: l'utente scansiona il [QR EVT-002](qr/EVT-002.png) e conferma Marco presente, contatore 1 / 6 |
| Check-in nativo | **PASS**, gerarchia Android acquisita con `Marco Bianchi`, `EVT-002`, `Presente`; DataStore contenente soltanto `EVT-002` |
| Persistenza su Android reale | **PASS**, `am force-stop` e nuovo `am start`: contatore ancora `1 / 6 presenti`; processo precedente 12961, assente dopo lo stop, nuovo processo 13824 |
| Controllo del file persistito | **PASS**, DataStore letto prima e dopo il riavvio, stesso SHA-256 e stesso ID |
| Analisi statica | **PASS**, `No issues found!` |
| Test automatici | **PASS**, **17/17**: check-in, duplicati, codici invalidi, cooldown, storage/controller, flusso manuale, reset, layout e fallback scanner |

Il plugin salva in `files/datastore/FlutterSharedPreferences.preferences_pb`. Il file acquisito contiene la chiave e il valore lista JSON con prefisso previsto dal plugin `shared_preferences_android` installato:

```json
{
  "key": "event_check_in.tech_meetup_2026.present_ids",
  "ids": ["EVT-002"]
}
```

SHA-256 del DataStore prima e dopo il riavvio: `A30159C321A9A41C783FD4FC565C35CAC3436D3A09449F45859F242B1780DB28`.

La prova su disco Android è distinta dai test di storage automatici, che usano un backend in memoria. Persistenza verificata dopo terminazione completa del processo; reboot, reinstallazione e aggiornamento non provati. Duplicato, codice sconosciuto, inserimento manuale e reset sono coperti dai test automatici, ma non riprovati nella UI del telefono in questa sessione. Permesso negato/riabilitato, lifecycle della camera e iOS restano non verificati. L'app rimane installata con il check-in di Marco conservato.

## Artefatto ed evidenze

- [APK debug universale](../artifacts/android/event-check-in-flutter-debug.apk): **163.196.081 byte**, circa **155,64 MiB**, installabile e avviabile autonomamente.
- SHA-256: `E7897A92B822110D20C23133EB6907A6EFAAC2878A87F3D1CC8C72D090DDFDDB`.
- [Risultati riepilogativi JSON](verification/2026-10-24/results.json), [misure delle singole fasi](verification/2026-10-24/build-results.json).
- [Log del primo tentativo](verification/2026-10-24/build-debug-attempt-1.txt), [analisi](verification/2026-10-24/analyze.txt), [17 test](verification/2026-10-24/tests.txt).
- Gerarchie Android: [stato iniziale](verification/2026-10-24/initial.xml), [Marco presente](verification/2026-10-24/qr-scanned.xml), [dopo riavvio](verification/2026-10-24/restored.xml).
- [Screenshot dopo riavvio](verification/2026-10-24/android-restored.png), [PID dei processi](verification/2026-10-24/process-restart.json).
- DataStore: [dopo scansione](verification/2026-10-24/datastore-after-scan.pb), [dopo riavvio](verification/2026-10-24/datastore-after-restart.pb).
- [Metadati e permessi dell'APK](verification/2026-10-24/apk-badging.txt): camera, permesso interno e rete degli strumenti/debug e delle librerie native; questa è la build debug. Il manifest release separato non è coinvolto.

APK e output in `build/` sono ignorati da Git. Report, log ed evidenze sotto `docs/` sono conservabili nel repository. Le modifiche React Native già presenti nel workspace non sono state alterate.

## Riproduzione della misura

Da `flutter/`, PowerShell, con SDK/JDK e dipendenze già presenti:

```powershell
.\docs\verification\2026-10-24\measure-build.ps1
```

Lo script accetta `-FlutterRoot` e `-JavaHome`, pulisce gli output, risolve Pub e Gradle offline, quindi cronometra la compilazione separatamente. Una nuova esecuzione sovrascrive i suoi log e `build-results.json`: salvarli prima se si vuole conservare questa misura. Se mancano pacchetti, prepararli prima della misura e registrare separatamente i download, senza rimuovere silenziosamente `--offline`.
