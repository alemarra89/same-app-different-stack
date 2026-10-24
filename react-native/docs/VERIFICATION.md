# Resoconto standard — Event Check-in

**Aggiornamento 24/10/2026:** è disponibile il [resoconto della nuova build debug cronometrata e dei test su telefono Android](DEBUG_BUILD_2026-10-24.md), con scanner reale, check-in e persistenza verificati. Le tabelle sotto conservano gli esiti storici del 23/10/2026.

È disponibile anche la [verifica Release Android senza server di sviluppo](RELEASE_BUILD_2026-10-24.md), con tempi separati dai download, APK, video, screenshot e prova del nuovo check-in sul telefono.

Data di verifica: **23/10/2026**. Stack richiesto: **React Native + Expo, TypeScript rigoroso**. Gli esiti nella tabella derivano dai comandi realmente eseguiti nell’ambiente Windows del progetto; la sezione di riproduzione contiene anche istruzioni per target non eseguiti qui.

## Framework, versioni e dipendenze

| Voce | Versione installata |
| --- | --- |
| create-expo-app | 5.0.0, template blank-typescript 58.0.26 |
| Expo | 58.0.17 |
| React Native | 0.88.0 |
| React / React DOM | 19.3.0 |
| TypeScript | 6.0.3, strict e noUncheckedIndexedAccess |
| expo-camera | 58.0.12 |
| AsyncStorage | 2.2.0 |
| react-native-safe-area-context | 5.10.1 |
| expo-status-bar | 58.0.4 |
| expo-system-ui | 58.0.6 |
| React Native Web | 0.21.4 |
| @expo/metro-runtime | 58.0.15 |

Totale dipendenze dirette: **11 runtime + 4 sviluppo = 15**. Rispetto al template (4 runtime + 2 sviluppo): **7 runtime e 2 sviluppo aggiunte**, nessuna rimossa. ESLint e la configurazione Expo sono stati aggiunti per eseguire il lint richiesto da `AGENTS.md`, generato dal template. Nessuna dipendenza di test aggiunta. `expo-doctor` e `qrcode` sono strumenti temporanei via npx, non dipendenze dell’app. Conteggio file e inventario: [FILES.md](FILES.md), esclusi node_modules e output generati.

## Verifiche eseguite e limiti

| Verifica | Esito realmente osservato |
| --- | --- |
| `npm run typecheck` | PASS, nessun errore dopo correzione dei tipi RN 0.88 |
| `npm test` | PASS, 16 test, 0 fallimenti |
| `npx expo install --check` | PASS, Dependencies are up to date |
| `npx expo-doctor` | PASS, 20/20 check, anche dopo la configurazione finale |
| `npm run lint` | PASS, nessun errore o warning nel codice del progetto |
| `expo config --type introspect` | PASS, camera italiana iOS e rimozione audio Android; snapshot allegato |
| Prebuild Android | PASS, progetto e AndroidManifest.xml realmente generati |
| Bundle Web di produzione | PASS, `dist/`, 244 moduli, circa 493 KB JavaScript |
| Bundle Hermes Android | PASS, 644 moduli, circa 1,6 MB |
| Bundle Hermes iOS | PASS, 651 moduli, circa 1,6 MB |
| APK Android debug x86_64 | PASS, `BUILD SUCCESSFUL in 2m 43s`, 218 task, APK 61.932.843 byte |
| APK Android debug arm64-v8a | PASS, `BUILD SUCCESSFUL in 1m 10s`, 218 task; destinato a telefoni ARM64 |
| Avvio o test su Android fisico/emulatore | NON VERIFICATO, nessun dispositivo collegato al controllo ADB iniziale |
| Generazione progetto iOS | NON ESEGUITA: Expo la rifiuta su Windows |
| Compilazione/avvio iOS | NON VERIFICATO, macOS/Xcode assenti |
| Release APK/AAB/IPA e firma | NON VERIFICATO |
| QR `EVT-002` letto da camera reale | NON VERIFICATO |
| Desktop nativo Windows/macOS | NON CONFIGURATO / NON VERIFICATO |

La produzione di bundle JavaScript/Hermes non equivale alla compilazione o all’esecuzione dei rispettivi target.

## Flussi verificati nel browser

Build statica realmente aperta nel browser integrato su `http://localhost:4173`, con adattatore AsyncStorage reale:

1. Prima apertura: 0/6, tutti in attesa.
2. Inserimento ` EVT-001 `: 1/6 e Giulia Rossi Presente, conferma visibile.
3. Duplicato: messaggio esatto `Check-in già effettuato`, resta 1/6.
4. `ERR-999`: messaggio esatto `QR non valido`, resta 1/6.
5. Ricaricamento completo: 1/6 conservato, Giulia Presente.
6. Reset aperto e annullato: stato conservato; reset confermato: 0/6.
7. Ricerca `marco`: solo Marco; `evt-003`: solo Sara; `nessuno`: stato vuoto.
8. Scanner Web: fallback esplicito; inserimento `EVT-002` tramite Invio funziona con fallback aperto e registra Marco.
9. Controllo responsive a 320 e 390 px: nessun overflow orizzontale; controllo visivo del layout.
10. Conferma check-in nella versione finale: banner fuori dall’elenco, sempre visibile durante lo scroll, verificato a 390 px. [Screenshot dell’export Web](verification/web-mobile.png).

Questi sono smoke test UI condotti tramite browser, non una suite UI nativa. Gli snapshot allegati sono dell’export Web, anche quando la larghezza corrisponde a un telefono.

## Errori incontrati e correzioni

- Gli shim PowerShell npm hanno perso alcuni argomenti `--template` e `--max-workers`. Ripetuti i comandi con `npx.cmd`; creazione ed export riusciti. Non è un errore del codice applicativo.
- Le API strict di React Native 0.88 non accettano `useRef<TextInput>` come istanza né `focused` nel callback di stile Pressable. Corretto con `ComponentRef<typeof TextInput>` e `onFocus`/`onBlur`.
- Verificato nel sorgente SDK 58 che `CameraView.isAvailableAsync` è Web-only: il componente nativo usa mount error, evento ready e timeout, evitando di disabilitare sempre lo scanner sui telefoni.
- Prebuild ha richiesto `expo-system-ui` per il tema chiaro Android: aggiunto tramite `expo install`, poi rigenerato il progetto.
- Nel browser `keyboardDismissMode="on-drag"` faceva perdere il focus durante gli scroll automatici degli input. Impostato `none` sul Web, conservato `on-drag` sul mobile; verificata nuovamente la digitazione e la ricerca con focus conservato.
- Il primo accesso al server di preview su 127.0.0.1 è andato in timeout; l’anteprima è stata verificata su localhost con il server locale raggiungibile.
- Prebuild iOS su Windows produce `Skipping generating the iOS native project files`: nessuna modifica manuale del template iOS, limite dichiarato.
- Prima compilazione APK: `Filename longer than 260 characters` in Ninja durante il codegen safe-area. Una prima soglia CMake di 180 non lasciava spazio sufficiente all’hash e non risolveva il problema; uno dei comandi Gradle è stato inoltre suddiviso da PowerShell per i punti nel nome della proprietà. Il plugin CNG locale imposta infine `expo.android.cmakeObjectPathMax=240`, rigenerando la configurazione senza modifiche manuali al progetto nativo. Esito finale della build nella tabella.
- Durante un export Hermes nel sandbox il compilatore non poteva scrivere il file temporaneo `.hbc` (`permission denied`). Rieseguito fuori dall’isolamento: export Android e iOS completati.
- Il CLI Expo seleziona ESLint 9.39.5, che npm segnala deprecato. È stata mantenuta la versione compatibile proposta da Expo: il plugin React installato non dichiara compatibilità con ESLint 10. Nessun override o forzatura dei peer dependency.
- Dopo il plugin per i percorsi, la build debug x86_64 è completata. Restano warning di deprecazione nella toolchain/librerie native; non sono stati modificati file in node_modules per nasconderli.
- [npm audit](verification/npm-audit.json) segnala **4 voci high**, derivanti da `node-forge@1.4.0` nella catena Expo CLI/code-signing. Il registry consultato espone 1.4.0 come latest; la correzione automatica proposta include un downgrade incompatibile di Expo. Non eseguito `audit fix --force`. L’app non usa queste API di firma; l’avviso della toolchain resta aperto, non è stato dichiarato risolto.

## Sezioni specifiche di piattaforma

- Android: `app.json` → package, CAMERA, blocco permessi non necessari, backup disabilitato, icona adattiva; progetto Gradle prodotto da prebuild. Compile SDK 37, target 36, min SDK 24, Build Tools 37.0.0, NDK 27.1.12297006.
- Il [manifest Android debug effettivamente unito](verification/android-debug-manifest.xml) esclude microfono e storage condiviso, ma il manifest debug di Expo reintroduce `SYSTEM_ALERT_WINDOW` per gli strumenti di sviluppo e include permessi di rete locale. L’app richiede a runtime solo la camera. Il manifest release non è stato prodotto/verificato; non si attribuiscono alla release i risultati osservati sulla variante debug.
- Configurazione build Android: `plugins/withShortAndroidPaths.cjs` mantiene i percorsi oggetto C++ entro 240 caratteri attraverso la proprietà esposta dal plugin Gradle Expo.
- iOS: bundle identifier, descrizione camera italiana, nessun microfono, esclusione backup AsyncStorage, interfaccia chiara e supporto tablet. Configurazione ispezionata; codice nativo non generato o compilato su Windows.
- Mobile condiviso: `QrScanner.tsx` con CameraView; camera smontata in background, gestione permesso negato e fallback manuale.
- Web: unico adattatore `QrScanner.web.tsx` con messaggio esplicito. Storage, UI e logica comuni; gestione tastiera differenziata per evitare perdita di focus.

## Comandi build riproducibili

```sh
npm ci
npm run typecheck
npm run lint
npm test
npx expo-doctor
npx expo install --check
npx expo run:android --device
# macOS:
npx expo run:ios --device
# Produzione locale di prova, firma store da configurare:
npx expo run:android --variant release --device
npx expo run:ios --configuration Release --device
# Solo bundle:
npm run export:native
npm run export:web
```

Per gli APK senza dispositivo è stato usato `gradlew.bat app:assembleDebug --no-daemon --console=plain -PreactNativeArchitectures=x86_64` e poi la stessa invocazione con `-PreactNativeArchitectures=arm64-v8a` nel progetto Android generato. Le copie separate sono in `artifacts/android/event-check-in-debug-x86_64.apk` e `artifacts/android/event-check-in-debug-arm64-v8a.apk`. Le istruzioni complete di firma e distribuzione sono nel README.

`aapt dump badging` confermava package `it.demo.eventcheckin`, nome Event Check-in, min SDK 24, target SDK 36 e i rispettivi ABI nelle build iniziali. Questo controlla il contenuto degli APK, non il loro avvio su un dispositivo. Dopo la separazione degli identificativi, il package corrente è `it.demo.eventcheckin.reactnative`: ricompilare per ottenere il nuovo APK. I manifest e l'introspezione allegati in `docs/verification/` sono evidenze storiche delle build iniziali.

## Web e criticità Desktop

Export e manuale Web verificati. Scanner Web intenzionalmente non abilitato: un’eventuale estensione deve verificare HTTPS/localhost, permessi, policy iframe, supporto video e decoder del browser, mantenendo invariato il payload ID. Nessuna build Desktop nativa; niente promessa di compatibilità dei moduli scanner su Windows/macOS. SDK 58 documenta un limite corrente al supporto macOS.
