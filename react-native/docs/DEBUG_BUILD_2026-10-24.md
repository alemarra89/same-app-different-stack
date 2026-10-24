# React Native — build debug e prova Android

Verifica eseguita il **24/10/2026**, fuso Europe/Rome, sui sorgenti correnti. APK ARM64 compilato, installato e avviato sul telefono **M2101K9G, Android 12 / API 31**. Package verificato con `aapt`: `it.demo.eventcheckin.reactnative`.

## Misure

| Voce richiesta | Risultato |
| --- | --- |
| Build riuscita al primo tentativo | **No** |
| Tempo di compilazione iniziale dopo `clean` | **106,85 s — 1 min 46,85 s**, tentativo fallito |
| Secondo tentativo, incrementale | **127,89 s — 2 min 7,89 s**, riuscito |
| Somma dei due tentativi di compilazione | **234,74 s — 3 min 54,74 s** |
| Preparazione e `clean`, esclusi dai tempi sopra | **63,98 s**, riusciti |
| Download SDK e dipendenze durante questa verifica | **0 s**: strumenti e pacchetti già installati; Gradle eseguito con `--offline` |
| Primo bundle Metro al lancio, separato dalla build APK | **13,444 s**, 747 moduli |

I tempi sono misurati con `System.Diagnostics.Stopwatch` intorno al processo Gradle e includono avvio del daemon e configurazione. Installazione, avvio, interazione umana e verifiche sono esclusi. Non è stata cronometrata l'installazione originaria della toolchain già presente: il relativo tempo storico è **non disponibile**, non zero.

Il primo tentativo segue `clean`, con build cache disabilitata; rimangono disponibili cache delle dipendenze, trasformazioni e plugin della toolchain già compilati. Il secondo riusa gli output parziali del primo: **127,89 s non è il tempo di una compilazione pulita completa**. Non è stato misurato un nuovo tentativo pulito riuscito. Gradle riporta rispettivamente `BUILD FAILED in 1m 46s` e `BUILD SUCCESSFUL in 2m 7s`.

## Errori e interventi

1. Primo `assembleDebug`: fallimento di `:expo-modules-core:buildCMakeDebug[arm64-v8a]`, nel comando Clang per `SharedClassDecoder.cpp.o`; Ninja termina con `subcommand failed`. Il log non contiene una diagnosi specifica del compilatore. Nel secondo tentativo sono stati limitati i worker Gradle a 2 e impostato `CMAKE_BUILD_PARALLEL_LEVEL=2`; build completata. La causa del primo errore resta non determinata: non si attribuisce con certezza a memoria o parallelismo. **Nessuna modifica ai sorgenti applicativi o a node_modules**.
2. Primo avvio Metro: `--offline --localhost` è rifiutato dal CLI Expo, che accetta una sola modalità host. Corretto usando soltanto `--offline`. Errore di avvio dello strumento, separato dai tentativi Gradle.
3. ADB nel sandbox non avviava il server. Eseguiti installazione e controlli del telefono fuori dall'isolamento, senza modificare l'app.
4. Il telefono rifiuta tocchi e digitazione automatici con `SecurityException: ... INJECT_EVENTS permission`. Non sono state cambiate le impostazioni di sicurezza del dispositivo. La scansione è stata effettuata dall'utente; arresto, riavvio, lettura della UI e controllo del database sono stati eseguiti tramite ADB. La prova manuale automatizzata di `EVT-001` non è quindi riuscita a inviare l'input e non viene conteggiata come test nativo passato.

Restano warning di deprecazione delle API Gradle/Android e delle librerie native. Non impediscono la produzione dell'APK. Il precedente problema storico dei percorsi Windows è documentato nel [resoconto del 23/10](VERIFICATION.md); in questa verifica non è ricomparso.

## Scanner, check-in e persistenza

| Prova | Esito e riscontro |
| --- | --- |
| Prima apertura nativa | **PASS**: `0 / 6 presenti`, rilevato nella gerarchia UI Android |
| Scanner QR reale | **PASS con intervento umano**: l'utente apre la camera, concede il permesso e inquadra il [QR EVT-002](qr/EVT-002.png), confermando Marco registrato |
| Check-in tramite QR | **PASS**: UI Android acquisita a `1 / 6 presenti`; database locale contenente soltanto `EVT-002` |
| Lettura ripetuta | **PASS**: UI acquisita con `Check-in già effettuato` e contatore ancora `1 / 6 presenti` |
| Persistenza Android reale | **PASS**: `am force-stop`, nuovo `am start`, contatore ancora `1 / 6 presenti`; lettura del database nativo AsyncStorage conferma `["EVT-002"]` |
| Typecheck e lint | **PASS**, entrambi exit code 0 |
| Test di dominio, scanner e repository | **PASS**, 16/16, zero fallimenti |
| Inserimento manuale, sconosciuto e reset nella UI Android | **Non verificati in questa sessione**; la relativa logica è coperta dai test, la precedente verifica UI Web è distinta |

Chiave effettivamente letta dal database Android `RKStorage`, tabella `catalystLocalStorage`:

```json
{
  "key": "@event-check-in/tech-meetup-2026/check-ins/v1",
  "value": "[\"EVT-002\"]"
}
```

La persistenza è verificata dopo terminazione completa del processo, non dopo reboot, reinstallazione o aggiornamento. La prova camera riguarda questo telefono Android; iOS non è stato compilato o provato in questo ambiente Windows. L'app resta installata con un check-in di demo conservato.

## Artefatto ed evidenze

- [APK debug ARM64](../artifacts/android/event-check-in-debug-arm64-v8a.apk), **61.356.687 byte**, richiede Metro.
- SHA-256: `AF91C5D59A7EB52ABEEBAA516652AC72AE331CE9045094168D8A53A465E23525`.
- [Misure ed esiti JSON](verification/2026-10-24/results.json).
- [Log primo tentativo](verification/2026-10-24/build-arm64-attempt-1.txt) e [secondo tentativo](verification/2026-10-24/build-arm64-attempt-2.txt).
- [Output dei 16 test](verification/2026-10-24/tests.txt).
- UI Android: [prima apertura](verification/2026-10-24/initial.xml), [dopo scansione](verification/2026-10-24/qr-scanned.xml), [dopo riavvio](verification/2026-10-24/restored.xml).
- [Screenshot dopo riavvio](verification/2026-10-24/android-restored.png).

Gli APK e i log operativi aggiuntivi in `artifacts/` sono output locali ignorati da Git. Misure, log Gradle sopra collegati ed evidenze in `docs/verification/2026-10-24/` sono conservati con la documentazione. L'APK x86_64 preesistente non è stato ricompilato in questa sessione.

## Riproduzione

Da `react-native/`, PowerShell, con Node, JDK e Android SDK già installati e dipendenze Gradle già disponibili localmente:

```powershell
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
Set-Location android
.\gradlew.bat clean app:dependencies --configuration debugRuntimeClasspath --offline --no-daemon --console=plain
# Cronometrare separatamente il solo assembleDebug:
$env:CMAKE_BUILD_PARALLEL_LEVEL = '2'
$clock = [Diagnostics.Stopwatch]::StartNew()
.\gradlew.bat app:assembleDebug --offline --no-build-cache --no-daemon --max-workers=2 --console=plain -PreactNativeArchitectures=arm64-v8a
$buildExit = $LASTEXITCODE
$clock.Stop()
Write-Output "Exit code: $buildExit; secondi: $($clock.Elapsed.TotalSeconds)"
Set-Location ..
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb reverse tcp:8081 tcp:8081
npx.cmd expo start --offline --port 8081
```

Il comando di riproduzione usa direttamente i worker ridotti. Se mancano SDK o pacchetti, prepararli e scaricarli **prima** del cronometro e registrarne separatamente la durata; non sostituire silenziosamente la build offline con una build che scarica dipendenze. Se il progetto nativo manca, generarlo con Expo prebuild dalla configurazione CNG prima della misura, senza modificare a mano i file nativi.
