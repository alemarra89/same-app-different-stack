# Flutter — Release Android senza server di sviluppo

Verifica del **24/10/2026**, fuso Europe/Rome. APK Release universale compilato, installato e avviato sul telefono **M2101K9G, Android 12 / API 31**, package `it.demo.eventcheckin.flutter`, versione `1.0.0+1`. Nuovo check-in manuale e persistenza dopo arresto completo verificati senza server di sviluppo.

## Misure

| Voce | Risultato |
| --- | --- |
| Release riuscita al primo tentativo | **Sì**, primo `assembleRelease` di questa verifica |
| Compilazione dopo pulizia degli output | **184,142 s — 3 min 4,14 s** |
| Preparazione, esclusa dalla compilazione | **26,903 s — 26,90 s** |
| Download in questa verifica | **0 s**, Pub e Gradle offline; strumenti e dipendenze già presenti |
| Dimensione APK universale | **63.823.414 byte = 63,82 MB = 60,87 MiB** |
| Installazione sul telefono | **4,114 s**, riuscita |
| Primo avvio a freddo | **Riuscito**, comando ADB 0,375 s; Android `TotalTime: 315 ms` |
| Funzionamento senza server di sviluppo | **PASS**, check-in da 1 / 6 a 2 / 6 e rilettura dopo arresto completo |

Preparazione separata: `flutter clean` **1,887 s**, `flutter pub get --offline` **5,543 s**, Gradle `clean :app:dependencies --configuration releaseRuntimeClasspath --offline --no-daemon` **19,473 s**. Il tempo di installazione originario di SDK e dipendenze già presenti non è disponibile e non viene indicato come zero. Il messaggio generico di Pub `Downloading packages...` compare anche nella risoluzione offline da cache locale.

`System.Diagnostics.Stopwatch` racchiude il processo Gradle `:app:assembleRelease --offline --no-build-cache --no-daemon --max-workers=2 --console=plain`, dalle **19:13:09 alle 19:16:13 Europe/Rome**. Include avvio del daemon, configurazione, compilazione Dart AOT e Android, tre architetture native, R8, riduzione risorse, lint Release, firma e packaging. Gradle riporta `BUILD SUCCESSFUL in 3m 3s`, 134 task: 117 eseguiti, 17 già aggiornati. La differenza con 184,142 s deriva dal perimetro del processo misurato.

Flutter e Gradle hanno pulito gli output applicativi; la build cache Gradle era disabilitata. Restano le cache di SDK, dipendenze, trasformazioni e plugin della toolchain. È una misura sullo stesso host con cache disponibili, non su una macchina vergine. Installazione, prove sul telefono, intervento umano e produzione del video sono esclusi dalla compilazione. I tempi Android di avvio dell'Activity non misurano il tempo completo fino all'interattività.

## Prova reale senza server

1. Verificati nell'APK i tre file AOT `libapp.so` per **arm64-v8a, armeabi-v7a e x86_64**; assente `kernel_blob.bin` della modalità debug.
2. Verificata la firma, quindi installato con `adb install -r`, conservando la presenza di Marco dalla demo Debug. L'APK installato ha lo stesso SHA-256 dell'artefatto compilato. Il package installato **non ha il flag DEBUGGABLE**.
3. Nessun processo Flutter `run`/`attach`, nessun tunnel `adb reverse`. L'APK Release **non dichiara INTERNET né ACCESS_NETWORK_STATE**: non può dipendere da un server di sviluppo in rete. Non è stato necessario fermare servizi di altri progetti.
4. Arresto completo con `am force-stop`, avvio diretto con `am start -W`: **1 / 6 presenti**, UI nativa acquisita.
5. Durante la registrazione, l'utente ha inserito **EVT-001** e premuto **Registra check-in**: conferma **Check-in effettuato: Giulia Rossi**, contatore **2 / 6 presenti**, entrambi rilevati nella gerarchia Android.
6. Nuovo arresto completo: processo **22028** terminato, assente dopo lo stop; nuova apertura nel processo **22457**, ancora **2 / 6 presenti**. Secondo `am start`: `TotalTime: 292 ms`, comando completo **0,355 s**. Screenshot e video mostrano la riapertura con i dati conservati.

La verifica della persistenza Release usa la UI dopo un nuovo processo. Non si è usato `run-as` per leggere lo storage della Release non debuggable. I file DataStore della precedente [prova Debug](DEBUG_BUILD_2026-10-24.md) restano evidenze distinte.

## Errori, avvisi e limiti

**Nessun errore bloccante, nessun secondo tentativo e nessuna modifica ai sorgenti applicativi o alle dipendenze installate.** Build completata con R8, riduzione delle risorse e lint Release attivi. Ambiente: Flutter **3.35.6**, Dart **3.9.2**, JDK Android Studio **21.0.8**, Gradle **8.12**, AGP **8.9.1**, Kotlin plugin **2.1.0**.

Avvisi conservati nel log:

- Strumenti CMake/Android leggono una versione XML SDK più recente di quella prevista.
- Attributo `package` ignorato nel manifest di `shared_preferences_android`.
- File opzionale `android/app/proguard-rules.pro` assente, richiamato dal fallback del plugin Flutter; il task R8 è comunque completato.
- R8 segnala problemi di parsing dei metadati Kotlin delle librerie risolte. Sono warning non bloccanti; non sono stati disabilitati gli ottimizzatori per ottenere la build.
- API Gradle deprecate. Durante la cattura UI, MIUI segnala inoltre un file di compatibilità tema assente, ma produce correttamente gli XML.

La **variante Release non debuggable è firmata con la chiave debug del progetto per il test locale**. Non è stata configurata una chiave Play Store. La scansione QR reale è stata verificata nella precedente Debug e non ripetuta in questa Release; qui sono verificati inserimento manuale, check-in, avvio autonomo e riapertura con persistenza. Reset, codici invalidi, reboot del telefono, iOS e pubblicazione su store non riprovati. I 17 test automatici passati nella sessione Debug non sono stati rieseguiti: sorgenti applicativi e lockfile invariati.

## APK, video e screenshot

- [APK Release universale](../artifacts/android/event-check-in-flutter-release.apk).
- SHA-256: `20205ECC0F6ED88F24422AF6A613FB901D4078246BA831DC875FCBE7ECA6642A`.
- [Video della demo Release](event-check-in-flutter-release-demo.mp4): **22,43 secondi**, H.264, **720 × 1600**, 30 fps, senza audio, **1.058.524 byte**. Registrazione reale del telefono con inserimento del codice, successo e riapertura. Sono state tagliate attese fra le azioni, senza modificare il contenuto dell'app. [Dettagli dei tagli](verification/release-2026-10-24/video-edit.json).
- Screenshot: [apertura](verification/release-2026-10-24/release-initial.png), [check-in di Giulia](verification/release-2026-10-24/release-checked-in.png), [2 / 6 dopo riapertura](verification/release-2026-10-24/release-restored.png).
- [Risultati JSON](verification/release-2026-10-24/results.json), [tempi delle fasi](verification/release-2026-10-24/build-results.json), [installazione e avvio](verification/release-2026-10-24/device-measures.json).
- [Log del primo tentativo](verification/release-2026-10-24/build-release-attempt-1.txt), [firma APK](verification/release-2026-10-24/apk-signature.txt), [contenuto AOT e dimensione](verification/release-2026-10-24/apk.json), [permessi](verification/release-2026-10-24/apk-permissions.txt).
- [Condizioni senza server](verification/release-2026-10-24/no-dev-server.json), [package installato](verification/release-2026-10-24/installed-package.txt), [hash APK sul telefono](verification/release-2026-10-24/installed-apk-sha256.txt), [riavvio dei processi](verification/release-2026-10-24/process-restart.json).
- Gerarchie Android: [iniziale](verification/release-2026-10-24/release-initial.xml), [conferma check-in](verification/release-2026-10-24/release-checked-in.xml), [dopo riavvio](verification/release-2026-10-24/release-restored.xml).

L'app rimane installata in Release con due presenze. APK in `artifacts/` e registrazione originale in `build/release-recordings/` sono output locali ignorati da Git; il breve video finale, il report e le evidenze in `docs/` sono conservabili nel repository. Le modifiche degli altri progetti già presenti nel workspace non sono state alterate.

## Riproduzione

Da `flutter/`, PowerShell, con SDK, JDK e dipendenze già preparati:

```powershell
.\docs\verification\release-2026-10-24\measure-release.ps1
.\docs\verification\release-2026-10-24\inspect-install-release.ps1
```

Il primo script accetta `-FlutterRoot` e `-JavaHome`; il secondo `-DeviceSerial`, `-AndroidSdk` e `-JavaHome`. Le nuove esecuzioni sovrascrivono i rispettivi log: conservarli prima per non perdere questa misura. Se mancano dipendenze, scaricarle in una fase distinta e registrarne la durata, mantenendo offline la compilazione misurata. Installare su un dispositivo diverso richiede il suo ID ADB.
