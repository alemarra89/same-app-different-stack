# Kotlin Multiplatform — build debug e verifica Android

Verifica del **24/10/2026**, fuso **Europe/Rome**, sui sorgenti correnti. APK debug prodotto, installato e avviato sul telefono **M2101K9G, Android 12 / API 31**. Identificativo verificato nell'APK: `it.demo.eventcheckin.kmp`, versione `1.0.0` / codice `1`.

## Misure richieste

| Voce | Risultato |
| --- | --- |
| Build riuscita al primo tentativo | **Sì**, primo `assembleDebug` di questa verifica |
| Tempo di compilazione iniziale dopo pulizia | **57,567 s** |
| Preparazione separata, esclusa dalla compilazione | **29,991 s** |
| Download SDK e dipendenze durante la verifica | **0 s**, strumenti e dipendenze già presenti; Gradle offline |
| Errori di compilazione / correzioni ai sorgenti dell'app | **Nessuno / nessuna** |
| Scanner QR, check-in e persistenza | **PASS su telefono Android reale**, dettagli sotto |

La preparazione esegue `clean :androidApp:dependencies --configuration debugRuntimeClasspath --offline --no-daemon --max-workers=2 --console=plain`. La compilazione esegue `:androidApp:assembleDebug --offline --no-build-cache --no-daemon --max-workers=2 --console=plain`.

Il cronometro `System.Diagnostics.Stopwatch` racchiude il processo Gradle completo, dalle **17:59:03 alle 18:00:00 Europe/Rome**: comprende avvio del daemon, configurazione, compilazione Kotlin/Compose e Android, creazione e firma debug dell'APK. Gradle riporta **BUILD SUCCESSFUL in 56s**, **46 task eseguiti**. Il tempo di processo misurato è 57,567 s.

Gli output del progetto sono stati puliti e la build cache disabilitata. Restano disponibili SDK, dipendenze e cache di trasformazione della toolchain. La misura riguarda una build pulita dell'app su un ambiente già preparato; non è un benchmark di prima installazione su macchina isolata. I tempi storici di download/installazione sono **non disponibili**, non zero. Il precedente valore di 3m24s nel [resoconto del 23/10](REPORT.md) non viene riutilizzato come tempo di sola compilazione. Installazione, prove sul telefono, test e lint sono esclusi dai 57,567 s.

## Ambiente, errori e interventi

- Windows; JDK **17 (17+35-LTS-2724)**, Gradle **9.4.1**, AGP **9.2.1**, Kotlin/compiler Compose **2.4.21**, Compose Multiplatform **1.12.1**; compileSdk/targetSdk **37**, minSdk **24**. Versioni rilevate dai file locali e dall'esecuzione, senza aggiornamenti.
- Il server ADB non partiva nell'ambiente isolato: accesso agli strumenti locali eseguito con autorizzazione. Errore di preparazione del collegamento, distinto dalla compilazione.
- Warning non bloccante durante la build: tre librerie native non ridotte da `strip`, incluse integralmente nell'APK. Nessuna correzione necessaria.
- La prima acquisizione dopo scansione ha rilevato Marco presente e il file corretto, ma lo script cercava anche il contatore fuori schermo. Adeguato il solo script di raccolta per accettare il messaggio di conferma quando l'elenco è scrollato; acquisizione ripetuta con successo. Dopo il riavvio il contatore è visibile e verificato automaticamente.
- Nessun errore applicativo osservato nelle prove richieste.

## Scanner, check-in e persistenza

| Prova | Esito ed evidenza |
| --- | --- |
| Installazione / avvio | **PASS**: `Success`, `Status: ok`, `LaunchState: COLD` |
| Prima apertura | **PASS**: `0 / 6 presenti`, archivio senza check-in |
| Fotocamera e lettura QR reale | **PASS con intervento umano**: l'utente inquadra [EVT-002](2026-10-24/EVT-002.png) nell'app KMP e conferma Marco registrato, contatore 1 / 6 |
| Check-in tramite scanner | **PASS**: UI acquisita con `Check-in effettuato: Marco Bianchi`, `EVT-002`, `Presente`; SharedPreferences con il solo `EVT-002` |
| Persistenza dopo arresto completo | **PASS**: processo **14647**, assente dopo `am force-stop`, nuovo processo **15201**; UI riaperta a `1 / 6 presenti`, stesso ID su disco |
| Test condivisi JVM | **PASS, 12/12**: check-in, duplicati, invalidi, dataset, repository, errori di scrittura e finestra anti-duplicato scanner |
| Test strumentale sul telefono | **PASS, 1/1**: SharedPreferences reali, nuovo repository, contenuto su disco e reset; archivio `persistence_test` separato dai dati dell'app |
| Lint Android | **PASS**, `No issues found.` |

File effettivamente letto: `shared_prefs/event_check_in.xml`, chiave `present_ids`, insieme con una sola stringa `EVT-002`. Le copie prima e dopo l'arresto hanno SHA-256 identico: `D25255FBBD3DA715B3A1245BDF1E859E14F4754A6C7A10D68F7F8BCBF4F6A9AE`.

La verifica riguarda la persistenza dopo terminazione completa del processo. Reboot, reinstallazione e aggiornamento non provati. Duplicati, invalidi, reset e cooldown sono coperti dai test automatici; non riprovati nella UI del telefono in questa sessione. Permesso negato, camera occupata e lifecycle esteso non riprovati. **iOS non compilato o provato**, host Windows privo di Xcode. L'app Android resta installata con il check-in di Marco conservato.

## Artefatto ed evidenze

- [APK debug](../artifacts/android/event-check-in-kmp-debug.apk): **14.956.843 byte**, circa **14,26 MiB**, autonomo; ABI `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`.
- SHA-256 APK: `719794F4D18E042243C42D741461A4E5267C6322D5367CE0DB0D812E5F6AD3C6`.
- [Risultati JSON](2026-10-24/results.json), [misure delle fasi](2026-10-24/build-results.json), [log della prima compilazione](2026-10-24/build-debug-attempt-1.txt), [preparazione](2026-10-24/prepare-offline.txt).
- [Log test e lint](2026-10-24/tests-and-lint.txt), [XML dei test JVM](2026-10-24/jvm-test-results/), [test sul telefono](2026-10-24/instrumentation.txt), [esito lint](2026-10-24/lint-results-debug.txt).
- UI Android: [iniziale](2026-10-24/initial.xml), [dopo scansione](2026-10-24/scanned.xml), [dopo riavvio](2026-10-24/restored.xml); [screenshot dopo scansione](2026-10-24/scanned.png) e [dopo riavvio](2026-10-24/restored.png).
- SharedPreferences [dopo scansione](2026-10-24/scanned-preferences.xml) e [dopo riavvio](2026-10-24/restored-preferences.xml); [PID dei processi](2026-10-24/process-restart.json); [metadati APK](2026-10-24/apk-badging.txt).

APK e output di compilazione sono ignorati da Git. I report e le evidenze sotto `verification/2026-10-24/` sono conservabili nel repository. Le modifiche preesistenti degli altri progetti non sono state alterate.

## Riproduzione

Da `kotlin-multiplatform/`, con SDK/JDK e dipendenze già presenti:

```powershell
.\verification\2026-10-24\measure-build.ps1
.\gradlew.bat :shared:jvmTest :androidApp:assembleDebugAndroidTest :androidApp:lintDebug --offline --no-daemon --max-workers=2 --console=plain
```

Lo script di misura pulisce gli output, registra preparazione e compilazione separatamente e sovrascrive i propri log e `build-results.json`: salvarli prima per conservare questa misura. Se mancano SDK o dipendenze, prepararli prima del cronometro e registrarne separatamente la durata, mantenendo offline il tentativo misurato. `capture-device.py` raccoglie UI e archivio senza cancellare dati; la fase `restored` arresta e riapre l'app e confronta lo stato con la precedente fase `scanned`.
