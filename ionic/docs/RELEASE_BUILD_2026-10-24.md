# Ionic — Release Android senza server di sviluppo

Verifica del **24/10/2026**, fuso **Europe/Rome**. APK Release universale compilato, installato e avviato sul telefono **M2101K9G, Android 12 / API 31**. Package `it.demo.eventcheckin.ionic`, versione `1.0` / codice `1`. Nuovo check-in e persistenza dopo arresto completo verificati senza server di sviluppo.

## Misure

| Voce | Risultato |
| --- | --- |
| Release riuscita al primo tentativo | **Sì**, Web e primo `assembleRelease` della sessione |
| Pipeline Web + sync + Android dopo pulizia | **197,227 s — 3 min 17,23 s** |
| Compilazione Web, TypeScript e bundle legacy inclusi | **41,691 s** |
| Sincronizzazione Capacitor Android | **8,234 s** |
| Compilazione Android e packaging Release | **147,302 s — 2 min 27,30 s** |
| Somma delle sole compilazioni Web + Android | **188,993 s — 3 min 8,99 s** |
| Firma locale APK, separata | **2,038 s** |
| Pipeline + firma | **199,265 s — 3 min 19,27 s** |
| Preparazione esclusa dalla pipeline | **47,770 s**: verifica npm 18,874 s + pulizia e risoluzione Gradle 28,896 s |
| Verifica firma, separata | **1,563 s**, riuscita |
| Download durante la verifica | **0 s**, strumenti e dipendenze già presenti; Gradle e verifica npm offline |
| Dimensione APK firmato universale | **35.753.922 byte = 35,75 MB = 34,10 MiB** |
| Installazione sul telefono | **0,993 s**, riuscita tramite ADB incrementale |
| Primo avvio a freddo | **Riuscito**, comando ADB **0,711 s**; Android `TotalTime: 656 ms` |
| Funzionamento senza server di sviluppo | **PASS**, nuovo check-in e riapertura con **2 / 6 presenti** |

Ogni fase è misurata con `System.Diagnostics.Stopwatch` intorno al processo completo. La pipeline va dalle **19:41:28 alle 19:44:46 Europe/Rome**; il totale somma le fasi escludendo le brevi pause di scrittura dei log. Gradle riporta **BUILD SUCCESSFUL in 2m 26s**, **229 task: 224 eseguiti, 5 già aggiornati**. Android include avvio del daemon, configurazione, compilazione, lint vitale Release, risorse e packaging dell'APK non firmato. La firma locale è successiva e separata.

Preparazione: `clean app:dependencies --configuration releaseRuntimeClasspath --offline --no-daemon --max-workers=2 --console=plain`. Build: `app:assembleRelease --offline --no-build-cache --no-daemon --max-workers=2 --console=plain`. Vite rigenera `dist/`. Gli output applicativi sono puliti e la build cache disabilitata; restano disponibili SDK, `node_modules`, dipendenze e trasformazioni della toolchain. Non è una misura su macchina vergine. Il tempo storico di download/installazione è **non disponibile**, non zero. Installazione, avvio, intervento umano, raccolta evidenze e video sono esclusi dalla compilazione.

## Prova sul telefono senza server

1. Verificati firma e allineamento dell'APK. La firma locale coincide con quella della Debug precedente: `adb install -r` conserva Marco presente. Lo SHA-256 dell'APK installato coincide con quello dell'artefatto consegnato.
2. La variante installata **non ha il flag DEBUGGABLE**; i flag letti dal package sono `HAS_CODE ALLOW_CLEAR_USER_DATA`. Il controllo APK non riporta `application-debuggable`. Non è stato abilitato il debug della WebView per eseguire i test.
3. L'APK contiene **26 asset Web**, compreso `assets/public/index.html`, i bundle JavaScript e la configurazione Capacitor **senza `server.url`**. Sono inclusi tre file DEX e le librerie native per quattro ABI. Il contenuto Web viene caricato dal bundle locale di Capacitor.
4. `adb reverse --list` vuoto; nessun server di sviluppo avviato per la prova. Al controllo, nessun listener sulle porte **5173, 4173, 42831, 8100, 8080, 8081**. Non serve Vite, Ionic CLI o un server sul computer per aprire e utilizzare l'APK.
5. Arresto completo e avvio diretto dell'Activity: interfaccia caricata con **1 / 6 presenti**, Marco conservato dalla Debug.
6. Durante la registrazione l'utente inserisce **EVT-001** e preme **Conferma check-in**. Conferma umana e gerarchia UI acquisita: **Check-in effettuato: Giulia Rossi**, **2 / 6 presenti**, Giulia e Marco **Presente**.
7. Nuovo arresto completo: processo **24437**, assente dopo lo stop, nuovo processo **24882**. Riapertura ancora a **2 / 6 presenti**, Giulia e Marco presenti. Secondo avvio: comando **0,500 s**, Android `TotalTime: 439 ms`.

I tempi Android misurano l'avvio dell'Activity, non il tempo completo fino all'interattività. Gli screenshot e le gerarchie UI confermano il caricamento effettivo dell'app dopo l'avvio. La persistenza di questa Release non debuggabile è verificata dalla UI dopo il cambio di processo; non si legge lo storage con `run-as`. L'app resta installata in Release con Giulia e Marco presenti.

## Configurazione, errori e limiti

**Nessun errore di compilazione, firma o installazione; nessun secondo tentativo. Nessuna modifica ai sorgenti applicativi, dipendenze o configurazione nativa.** Lint vitale Release completato. Warning non bloccanti: bundle Vite oltre 500 kB e diagnostica dei tempi dei plugin, repository Gradle `flatDir`, operazioni Java unchecked nel codice Capacitor.

Ambiente: Windows, Node **22.13.1**, npm **11.6.2**, JDK **21.0.8** di Android Studio, Gradle **8.14.3**, AGP **8.13.0**; compileSdk/targetSdk **36**, minSdk **26**. Ionic **9.0.9**, React **19.0.0**, Capacitor **8.5.3**, scanner **3.1.3**, Camera **8.2.6**, Preferences **8.0.1**, Vite **8.3.5**. La configurazione originale mantiene `minifyEnabled false`: R8/minificazione del codice Android non attivi; Vite produce il bundle Web di produzione.

La **variante Release non debuggabile è firmata con il certificato Android Debug locale per il test sul telefono**. Firma v2/v3 e allineamento verificati. Non è stata configurata una chiave per lo store né eseguita una pubblicazione.

I **30 test unitari e 10 test browser**, insieme al lint, passati nella [verifica Debug](DEBUG_BUILD_2026-10-24.md) non sono stati ripetuti: i sorgenti dell'app sono invariati. Qui sono verificati Release, avvio autonomo, nuovo check-in manuale, conservazione dei dati nell'aggiornamento Debug → Release con la stessa firma, e persistenza dopo arresto completo. Scanner QR reale verificato nella Debug, non riprovato nella Release. Reset, codici invalidi, permessi negati, reboot, reinstallazione e iOS non provati in questa sessione.

## APK, video e screenshot

- [APK Release universale](../artifacts/android/event-check-in-ionic-release.apk), ABI **arm64-v8a, armeabi-v7a, x86, x86_64**.
- SHA-256: `58FA371739B43C2BE43E8B588C8566BDEB2B894B69DE84FB7E47E94FE31EB671`.
- [Video della Release](event-check-in-ionic-release-demo.mp4): **25,67 secondi**, H.264, **720 × 1600**, 30 fps, senza audio, **1.014.946 byte**. Registrazione reale del telefono: inserimento, conferma, elenco presenze e stato dopo riapertura. Eliminate soltanto attese; [intervalli selezionati](verification/release-2026-10-24/video-edit.json). Fotogrammi del risultato ispezionati.
- Screenshot: [prima del nuovo check-in](verification/release-2026-10-24/release-initial.png), [dopo check-in](verification/release-2026-10-24/release-checked-in.png), [dopo riavvio](verification/release-2026-10-24/release-restored.png).
- [Risultati JSON](verification/release-2026-10-24/results.json), [misure delle fasi](verification/release-2026-10-24/build-results.json), [installazione e primo avvio](verification/release-2026-10-24/device-measures.json), [riavvio dei processi](verification/release-2026-10-24/process-restart.json).
- [Log primo tentativo Android](verification/release-2026-10-24/build-release-attempt-1.txt), [build Web](verification/release-2026-10-24/build-web-attempt-1.txt), [firma](verification/release-2026-10-24/verify-signature.txt), [metadati APK](verification/release-2026-10-24/apk.json).
- [Condizioni senza server](verification/release-2026-10-24/no-dev-server.json), [porte sul computer](verification/release-2026-10-24/host-dev-ports.json), [package installato](verification/release-2026-10-24/installed-package.txt), [hash sul telefono](verification/release-2026-10-24/installed-apk-sha256.txt).
- Gerarchie UI: [iniziale](verification/release-2026-10-24/release-initial.xml), [nuovo check-in](verification/release-2026-10-24/release-checked-in.xml), [dopo riavvio](verification/release-2026-10-24/release-restored.xml).

APK e registrazione originale in `build/release-recordings/` sono output locali ignorati da Git. Video finale, report ed evidenze sotto `docs/` sono conservabili nel repository. Le modifiche preesistenti degli altri progetti non sono state alterate.

## Riproduzione

Da `ionic/`, con JDK 21, SDK, dipendenze e certificato Android Debug locale già presenti:

```powershell
.\docs\verification\release-2026-10-24\measure-release.ps1
python docs/verification/release-2026-10-24/inspect-apk.py
python docs/verification/release-2026-10-24/verify-release-device.py install --serial ID_DEVICE
```

La misura accetta `-JavaHome` e `-AndroidHome` e sovrascrive i propri log e risultati: salvarli prima per conservare questa verifica. Se mancano dipendenze, prepararle prima del cronometro e registrarne separatamente la durata. Lo script dispositivo non cancella dati; le fasi `checked-in` e `restored` verificano il contatore atteso della prova Giulia/Marco.
