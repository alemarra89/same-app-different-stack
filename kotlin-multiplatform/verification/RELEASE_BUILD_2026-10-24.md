# Kotlin Multiplatform — Release Android senza server di sviluppo

Verifica del **24/10/2026**, fuso **Europe/Rome**. APK Release universale compilato, installato e avviato sul telefono **M2101K9G, Android 12 / API 31**. Package `it.demo.eventcheckin.kmp`, versione `1.0.0` / codice `1`. Nuovo check-in e persistenza dopo arresto completo verificati senza server di sviluppo.

## Misure

| Voce | Risultato |
| --- | --- |
| Release riuscita al primo tentativo | **Sì**, primo `assembleRelease` di questa verifica |
| Compilazione dopo pulizia degli output | **82,670 s — 1 min 22,67 s** |
| Preparazione, esclusa dalla compilazione | **21,874 s** |
| Firma locale APK, separata | **1,633 s** |
| Compilazione + firma | **84,303 s — 1 min 24,30 s** |
| Download in questa verifica | **0 s**, Gradle offline; SDK e dipendenze già presenti |
| Dimensione APK firmato universale | **10.987.109 byte = 10,99 MB = 10,48 MiB** |
| Installazione sul telefono | **0,669 s**, riuscita, installazione incrementale ADB |
| Primo avvio a freddo | **Riuscito**, comando ADB **0,868 s**; Android `TotalTime: 814 ms` |
| Funzionamento senza server di sviluppo | **PASS**, nuovo check-in e riapertura con **2 / 6 presenti** |

Preparazione: `clean :androidApp:dependencies --configuration releaseRuntimeClasspath --offline --no-daemon --max-workers=2 --console=plain`. La misura di compilazione usa `System.Diagnostics.Stopwatch` intorno al processo Gradle `:androidApp:assembleRelease --offline --no-build-cache --no-daemon --max-workers=2 --console=plain`, dalle **19:27:20 alle 19:28:43 Europe/Rome**. Include avvio del daemon, configurazione, compilazione Kotlin/Compose e Android, lint vitale Release, risorse e packaging dell'APK non firmato. Gradle riporta **BUILD SUCCESSFUL in 1m 22s**, **66 task: 63 eseguiti, 3 già aggiornati**.

La firma con `apksigner` è successiva e cronometrata separatamente. Verifica della firma, installazione, avvio, intervento umano, raccolta evidenze e video sono esclusi dalla compilazione. Gli output applicativi sono stati puliti e la build cache disabilitata; restano disponibili SDK, dipendenze e trasformazioni della toolchain. La misura riguarda lo stesso host già preparato, non una macchina vergine. Il tempo storico di installazione di SDK e dipendenze è **non disponibile**, non zero.

## Prova sul telefono senza server

1. Verificati firma e allineamento dell'APK. Il certificato locale coincide con quello della precedente Debug, quindi `adb install -r` conserva la presenza di Marco. Il file APK installato ha lo **stesso SHA-256** dell'artefatto consegnato.
2. La variante installata **non ha il flag DEBUGGABLE**, sia nei metadati APK sia nei flag del package sul telefono. L'APK contiene tre file DEX e le librerie native per quattro ABI; non richiede un caricamento del codice da un server di sviluppo.
3. `adb reverse --list` vuoto; nessun server di sviluppo avviato per la prova. Il manifest **non dichiara `android.permission.INTERNET`**. Dichiara camera, permesso interno del receiver e `ACCESS_NETWORK_STATE`, che consente di osservare lo stato della rete e non autorizza connessioni Internet.
4. Arresto completo e avvio diretto con `am start -W`: UI a **1 / 6 presenti**, presenza precedente conservata.
5. Durante la registrazione l'utente inserisce **EVT-001** e preme **Registra check-in**: la UI acquisita mostra **Check-in effettuato: Giulia Rossi** e **2 / 6 presenti**.
6. Nuovo arresto completo: processo **23326** terminato, assente dopo lo stop; riapertura nel processo **23656**, ancora **2 / 6 presenti** e Giulia **Presente**. Secondo avvio: comando **0,342 s**, Android `TotalTime: 287 ms`.

I tempi Android misurano l'avvio dell'Activity, non il tempo completo fino all'interattività. La persistenza della Release non debuggabile è verificata tramite UI dopo il cambio di processo; non si legge l'archivio con `run-as`. L'app rimane installata in Release con Giulia e Marco presenti.

## Errori, configurazione e limiti

**Nessun errore di compilazione o installazione, nessun secondo tentativo, nessuna modifica ai sorgenti applicativi o alle dipendenze.** Lint vitale Release completato. Rimane il warning non bloccante per tre librerie native incluse senza stripping.

Ambiente invariato: Windows, JDK **17 (17+35-LTS-2724)**, Gradle **9.4.1**, AGP **9.2.1**, Kotlin/compiler Compose **2.4.21**, Compose Multiplatform **1.12.1**, compileSdk/targetSdk **37**, minSdk **24**. La configurazione originale mantiene `isMinifyEnabled = false`: **R8/minificazione del codice non attivi**. Nessuna ottimizzazione aggiunta per modificare il confronto.

La **variante Release non debuggabile è firmata con il certificato Android Debug locale per il test sul telefono**. Non è stata configurata una chiave per lo store né eseguita una pubblicazione. Gli schemi di firma v2/v3 e l'allineamento sono verificati.

I **12 test JVM e 1 test strumentale** passati nella [verifica Debug](DEBUG_BUILD_2026-10-24.md) non sono stati ripetuti, poiché i sorgenti applicativi sono invariati. Qui sono verificati build Release, avvio autonomo, inserimento manuale, nuovo check-in e persistenza dopo arresto completo. Scanner QR reale verificato nella Debug, non riprovato nella Release. Reset, codici invalidi, permessi negati, reboot, reinstallazione, aggiornamento di versione e iOS non provati in questa sessione.

## APK, video e screenshot

- [APK Release universale](../artifacts/android/event-check-in-kmp-release.apk), ABI **arm64-v8a, armeabi-v7a, x86, x86_64**.
- SHA-256: `FE0B09DDEF9D3F04B124D38C35A14814EA39F1DDFA962BE8FDA85F3B869A0B24`.
- [Video della Release](event-check-in-kmp-release-demo.mp4): **23,77 secondi**, H.264, **720 × 1600**, 30 fps, senza audio, **1.183.005 byte**. Registrazione reale del telefono con inserimento, conferma e riapertura; eliminate soltanto attese fra le azioni. [Intervalli selezionati](release-2026-10-24/video-edit.json).
- Screenshot: [prima del nuovo check-in](release-2026-10-24/release-initial.png), [conferma del check-in](release-2026-10-24/release-checked-in.png), [dopo riavvio](release-2026-10-24/release-restored.png).
- [Risultati JSON](release-2026-10-24/results.json), [misure delle fasi](release-2026-10-24/build-results.json), [installazione e primo avvio](release-2026-10-24/device-measures.json), [riavvio dei processi](release-2026-10-24/process-restart.json).
- [Log del primo tentativo](release-2026-10-24/build-release-attempt-1.txt), [preparazione offline](release-2026-10-24/prepare-offline.txt), [firma](release-2026-10-24/apk-signature.txt), [metadati e dimensione](release-2026-10-24/apk.json), [permessi](release-2026-10-24/apk-permissions.txt).
- [Condizioni senza server](release-2026-10-24/no-dev-server.json), [package installato](release-2026-10-24/installed-package.txt), [hash sul telefono](release-2026-10-24/installed-apk-sha256.txt).
- Gerarchie UI: [iniziale](release-2026-10-24/release-initial.xml), [nuovo check-in](release-2026-10-24/release-checked-in.xml), [dopo riavvio](release-2026-10-24/release-restored.xml).

APK in `artifacts/` e registrazione originale in `build/release-recordings/` sono output locali ignorati da Git. Video finale, report ed evidenze sotto `verification/` sono conservabili nel repository. Le modifiche preesistenti degli altri progetti non sono state alterate.

## Riproduzione

Da `kotlin-multiplatform/`, con JDK, SDK, certificato Android Debug locale e dipendenze già presenti:

```powershell
.\verification\release-2026-10-24\measure-release.ps1
python verification/release-2026-10-24/verify-release-device.py install --serial ID_DEVICE
```

Il primo script accetta `-JavaHome` e `-AndroidHome`. Misura preparazione, compilazione e firma separatamente. Le nuove esecuzioni sovrascrivono i rispettivi log e risultati: salvarli prima per conservare questa misura. Se mancano dipendenze, prepararle prima del cronometro e registrarne separatamente la durata. Lo script dispositivo raccoglie lo stato senza cancellare dati; la fase `restored` arresta e riapre l'app e verifica il contatore atteso della prova Giulia/Marco.
