# React Native — Release Android senza server di sviluppo

**Controllo successivo del 26/10/2026:** in questa Release il lettore QR non si inizializza a causa dei costruttori ML Kit rimossi da R8. Il check-in manuale documentato qui rimane valido. La [correzione e la nuova prova ottica su telefono](QR_RELEASE_FIX_2026-10-26.md) sono documentate separatamente; per installare la versione corretta usare l'APK con suffisso `-qr-fix`.

Verifica del **24/10/2026**, fuso Europe/Rome. APK **Release ARM64** compilato, installato e avviato sul telefono **M2101K9G, Android 12 / API 31**, package `it.demo.eventcheckin.reactnative`. Il nuovo check-in manuale e la persistenza dopo arresto completo funzionano con Metro fermo e senza tunnel ADB.

## Risultati e tempi

| Misura | Esito |
| --- | --- |
| Build Release riuscita al primo tentativo | **No** |
| Tentativo 1 | **27,93 s**, fallito nella risoluzione delle dipendenze lint, prima di compilare i sorgenti |
| Tentativo 2 | **105,77 s — 1 min 45,77 s**, fallito per percorso C++ troppo lungo su Windows |
| Tentativo 3 | **328,93 s — 5 min 28,93 s**, riuscito dopo la correzione del plugin CNG |
| Somma dei tre tentativi `assembleRelease` | **462,63 s — 7 min 42,63 s** |
| Download e preparazione, esclusi dai tempi di build | **601,84 s — 10 min 1,84 s** complessivi |
| Di cui fasi con download e risoluzione | **491,62 s — 8 min 11,62 s**, inclusi tentativi interrotti e configurazione Gradle |
| Dimensione APK | **29.652.801 byte = 29,65 MB = 28,28 MiB** |
| Esecuzione senza server di sviluppo | **PASS** |

Cronometro `System.Diagnostics.Stopwatch` intorno al processo Gradle: comprende avvio del daemon, configurazione, compilazione nativa, bundle JavaScript/Hermes, R8, lint Release e packaging. Ogni `assembleRelease` usa `--offline --no-build-cache --no-daemon --max-workers=2 -PreactNativeArchitectures=arm64-v8a`; Expo opera con `EXPO_OFFLINE=1` e `NODE_ENV=production`. **Nessun download è incluso nei tentativi di compilazione**. Installazione sul telefono, test, registrazione e intervento umano sono esclusi.

La preparazione comprende `clean`, controlli della cache, scaricamento delle librerie Release mancanti, tentativi interrotti e prebuild. La durata di rete pura non è isolata dal tempo di configurazione e risoluzione: per questo viene indicata l'intera fase con download. SDK, NDK, JDK e dipendenze npm erano già installati; il loro tempo di installazione storico non è disponibile.

Il terzo tentativo rigenera il progetto Android e usa un nuovo staging CMake per l'app; riusa gli output delle librerie già prodotti dal secondo tentativo, oltre alle cache di dipendenze e toolchain. **Non è una misura di build completamente pulita su macchina vergine**. Gradle riporta `BUILD SUCCESSFUL in 5m 28s`, 350 task, 322 eseguiti e 28 up-to-date.

## Errori e correzioni

1. La preparazione iniziale tentava di risolvere configurazioni appartenenti ad altri progetti Gradle, causando l'errore di lock esclusivo. Corretto lo script temporaneo registrando un task nel progetto proprietario di ogni configurazione.
2. React Native Release e Hermes Release mancavano in cache. Un trasferimento Gradle restava fermo con file temporaneo a zero byte per oltre cinque minuti: interrotto il solo daemon di quella preparazione, poi download completato con un worker e timeout di rete espliciti. Queste interruzioni sono intenzionali e non crash spontanei della compilazione.
3. Il primo vero `assembleRelease` offline ha rilevato la dipendenza lint `androidx.graphics:graphics-shapes-desktop:1.0.1` mancante. Scaricata in una fase separata. Il prefetch esteso selezionava anche artefatti DebugOptimized non necessari: interrotto e limitato alle configurazioni Release e lint condivise. La verifica finale della preparazione passa offline. Non è stato disabilitato il lint Release.
4. Il secondo `assembleRelease` falliva in `:app:buildCMakeRelWithDebInfo[arm64-v8a]`, con `Filename longer than 260 characters` per `RNCSafeAreaViewShadowNode.cpp.o`. La cartella `RelWithDebInfo` superava il margine disponibile nella precedente configurazione Debug. Aggiornato [withShortAndroidPaths.cjs](../plugins/withShortAndroidPaths.cjs): su Windows lo staging CMake dell'app è in `%TEMP%/rn-cxx/<hash del percorso del progetto>`, distinto per checkout; sugli altri sistemi resta nella cartella locale `.cxx/`. Mantenuto `expo.android.cmakeObjectPathMax=240` e resa aggiornabile la configurazione già inserita dal plugin. Rigenerato Android con Expo prebuild, senza modificare manualmente i file nativi o node_modules.

La personalizzazione rimane nel plugin sorgente, secondo il [meccanismo di config plugin Expo](https://docs.expo.dev/config-plugins/plugins/). Lo [script temporaneo di prefetch](verification/release-2026-10-24/prefetch-release.gradle) usa task Gradle nei rispettivi progetti; gli [init script Gradle](https://docs.gradle.org/current/userguide/init_scripts.html) consentono di applicare questa preparazione senza cambiare i sorgenti Android generati.

## Prova sul telefono

1. `adb install -r` ha aggiornato la demo senza disinstallarla, conservando il check-in precedente di Marco.
2. Metro terminato, porta TCP 8081 senza listener e `adb reverse --list` vuoto. Queste condizioni sono registrate in [no-dev-server.json](verification/release-2026-10-24/no-dev-server.json).
3. `am force-stop` seguito da `am start -W`: avvio a freddo riuscito e UI a **1 / 6 presenti**. L'APK contiene `assets/index.android.bundle`; `aapt` e il package installato confermano l'assenza del flag `DEBUGGABLE`.
4. L'utente ha inserito manualmente **EVT-001** e confermato il check-in: Giulia registrata, UI a **2 / 6 presenti**, conferma visibile. La digitazione via ADB resta bloccata dal telefono con `INJECT_EVENTS`, già rilevato nella verifica Debug; nessuna impostazione di sicurezza è stata cambiata.
5. Nuovo `am force-stop` e nuovo avvio: **2 / 6 presenti** conservato, con Metro ancora fermo. Riscontro nella gerarchia UI e nello screenshot.

Il primo `am start -W` riporta `TotalTime: 225 ms` e il successivo `198 ms`: sono tempi Android di avvio dell'Activity, **non misure del tempo completo di caricamento JavaScript o di interattività**. Il funzionamento dell'app è verificato separatamente tramite UI, check-in e riapertura.

Passati anche **16/16 test**, typecheck e lint del progetto, questi ultimi rieseguiti dopo la modifica del plugin. La scansione QR reale era stata verificata nella [build Debug](DEBUG_BUILD_2026-10-24.md); non è stata ripetuta sulla Release. Non sono stati verificati in questa sessione reset, reboot del telefono, iOS o pubblicazione su store. L'app rimane installata in Release con due presenze di demo.

## APK, video e screenshot

- [APK Release ARM64](../artifacts/android/event-check-in-release-arm64-v8a.apk).
- SHA-256: `88CE48CF59863502A458CA3A89025151325D7C9F839762DA4221D2E6D6691708`.
- [Video del check-in senza Metro](event-check-in-rn-release-demo.mp4): **29,79 secondi**, H.264, **720 × 1600**, **2.077.901 byte**. Registrazione reale del telefono; clip accorciata dalla registrazione originale, senza modifiche al contenuto dell'app.
- [Screenshot del check-in](verification/release-2026-10-24/release-checked-in.png) e [dopo riavvio](verification/release-2026-10-24/release-restored.png).
- [Misure ed esiti JSON](verification/release-2026-10-24/results.json).
- Log dei tentativi [1](verification/release-2026-10-24/build-release-attempt-1.txt), [2](verification/release-2026-10-24/build-release-attempt-2.txt) e [3](verification/release-2026-10-24/build-release-attempt-3.txt), [test](verification/release-2026-10-24/tests.txt), [contenuto APK](verification/release-2026-10-24/apk-badging.txt) e [firma](verification/release-2026-10-24/apk-signature.txt).
- Stato nativo: [prima del nuovo check-in](verification/release-2026-10-24/release-initial.xml), [check-in](verification/release-2026-10-24/release-checked-in.xml), [dopo riavvio](verification/release-2026-10-24/release-restored.xml), [package installato](verification/release-2026-10-24/installed-package.txt).

La variante è **Release non debuggable**, con minificazione R8 attiva, firmata con la **chiave debug del template per il test locale**. La verifica della firma è riuscita. Non è stata configurata una chiave di distribuzione Play Store. APK e log operativi aggiuntivi rimangono in `artifacts/`, ignorato da Git; il video finale in `docs/` e le evidenze in `docs/verification/release-2026-10-24/` sono conservati con la documentazione.

## Riproduzione con dipendenze già preparate

Da `react-native/`, PowerShell:

```powershell
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:CMAKE_BUILD_PARALLEL_LEVEL = '2'
$env:NODE_ENV = 'production'
$env:EXPO_OFFLINE = '1'
npx.cmd expo prebuild --platform android --no-install
Set-Location android
# Cronometrare soltanto questa invocazione; preparare i download prima:
.\gradlew.bat app:assembleRelease --offline --no-build-cache --no-daemon --max-workers=2 --console=plain -PreactNativeArchitectures=arm64-v8a
Set-Location ..
adb install -r android/app/build/outputs/apk/release/app-release.apk
# Terminare Metro e rimuovere l'eventuale tunnel 8081 prima della prova.
adb reverse --list
adb shell am force-stop it.demo.eventcheckin.reactnative
adb shell am start -W -n it.demo.eventcheckin.reactnative/.MainActivity
```

Per una nuova cache, usare lo script di prefetch allegato con `--init-script`, misurando download e risoluzione separatamente. La cancellazione della cartella temporanea CMake è consentita dal sistema e comporta una nuova compilazione nativa. Queste istruzioni producono una Release ARM64 per il test locale sul telefono.
