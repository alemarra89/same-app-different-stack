# Correzione dello scanner QR nella Release Android

Verifica del **26/10/2026** su Xiaomi **M2101K9G**, Android **12**, package `it.demo.eventcheckin.reactnative`. Il QR di Fabio Conti contiene esattamente `EVT-005`, decodificato correttamente anche fuori dall'app.

## Errore riprodotto

Nella Release del 24/10 la fotocamera si apriva, ma il lettore QR non si inizializzava. I log del processo riportavano `Failed to initialize BarcodeAnalyzer`, preceduto da `NoSuchMethodException` per il costruttore pubblico senza argomenti di tre registrar ML Kit:

- `com.google.mlkit.common.internal.CommonComponentRegistrar`
- `com.google.mlkit.vision.common.internal.VisionCommonRegistrar`
- `com.google.mlkit.vision.barcode.internal.BarcodeRegistrar`

Firebase ComponentDiscovery crea questi componenti tramite reflection. Nella build ottimizzata R8 aveva conservato le classi ma rimosso i costruttori. L'ispezione DEX del vecchio APK e gli output R8 confermano l'assenza. La camera poteva quindi mostrare l'anteprima anche se il lettore non era operativo. Le [prove Release del 24/10](RELEASE_BUILD_2026-10-24.md) avevano verificato il check-in manuale; la lettura ottica era stata provata soltanto sulla Debug.

## Correzione

Il file sorgente [proguard-rules.pro](../proguard-rules.pro) conserva i nomi delle classi ML Kit che implementano `ComponentRegistrar` e i relativi costruttori pubblici senza argomenti. La regola non conserva indiscriminatamente tutti i metodi e tutte le classi ML Kit.

Il plugin [withMlKitRegistrars.cjs](../plugins/withMlKitRegistrars.cjs), registrato in `app.json`, collega questo file alla configurazione ProGuard della Release durante Expo prebuild. La correzione sopravvive quindi alla rigenerazione di `android/`. R8 e il lint Release restano abilitati. Nessuna modifica alla logica dei check-in, ai dati salvati o a `node_modules`.

Riferimenti: [regole R8 per la reflection](https://developer.android.com/topic/performance/app-optimization/keep-rule-examples), [config plugin Expo](https://docs.expo.dev/config-plugins/plugins/).

## Verifica effettuata

- Expo prebuild Android completato, configurazione aggiunta una sola volta.
- Typecheck e lint del progetto superati.
- `app:assembleRelease --offline --no-daemon --max-workers=2 -PreactNativeArchitectures=arm64-v8a` riuscito con R8 attivo; Gradle riporta **4 min 30 s**. È una ricompilazione di verifica con cache disponibili, non un benchmark pulito confrontabile con quelli del 24/10.
- APK ARM64 non debuggable, identificativo invariato; ispezione DEX con `apkanalyzer` conferma i tre costruttori pubblici `<init>()V`.
- Aggiornamento sul telefono con `adb install -r`, senza disinstallazione o cancellazione dati. Avvio a freddo riuscito.
- Stato iniziale osservato: **0 / 6 presenti**. L'utente ha aperto lo scanner e letto lo stesso QR `EVT-005`, confermando la registrazione di Fabio. Dopo la lettura, la gerarchia UI Android mostra **1 / 6 presenti**.
- Nei log del nuovo processo: **zero** errori di istanziazione dei registrar, `NoSuchMethodException` o `Failed to initialize BarcodeAnalyzer`.

La lettura continua dello stesso QR può mostrare il feedback già previsto **Check-in già effettuato**: il contatore resta a 1 / 6. Non è stata effettuata una nuova verifica iOS o una nuova prova di persistenza dopo riavvio in questa sessione.

## Artefatto e riscontri

- [APK Release corretto ARM64](../artifacts/android/event-check-in-release-arm64-v8a-qr-fix.apk), **29.652.817 byte**.
- SHA-256: `B3F2A3D91D28F7637E31E37F5F487FF1F7CAFA71AD724BE06A3DF634C5819383`.
- [Errori della Release precedente](verification/qr-release-2026-10-26/before-errors.txt).
- [Risultati della verifica](verification/qr-release-2026-10-26/results.json).

Il precedente APK in `artifacts/android/event-check-in-release-arm64-v8a.apk` è conservato come artefatto storico del report del 24/10 e contiene ancora il difetto. Per una nuova installazione usare l'APK con suffisso `-qr-fix`. Gli APK e i log completi in `artifacts/` sono output locali ignorati da Git.
