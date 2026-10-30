# Same App, Different Stack

Un unico repository con cinque implementazioni indipendenti della stessa app **Event Check-in**, per confrontare cinque tecnologie sullo stesso caso d'uso.

La demo gestisce il check-in locale dei sei partecipanti al **Tech Meetup 2026 · 23/10/2026**: ricerca, scansione QR, inserimento manuale, contatore presenze, persistenza locale e reset. L'interfaccia è in italiano; non serve un backend.

## Demo Web e presentazione online

| Contenuto | Link su GitHub Pages |
| --- | --- |
| **Demo Event Check-in** — implementazione Vanilla PWA | [Apri la demo](https://alemarra89.github.io/same-app-different-stack/) |
| **Presentazione Same App, Different Stack** | [Apri la presentazione](https://alemarra89.github.io/same-app-different-stack/talk/) |

La demo funziona nel browser ed è installabile su Android e desktop. Per provare lo scanner, consentire l'accesso alla fotocamera e inquadrare uno dei QR qui sotto da un altro schermo o da una stampa. Le presenze restano locali al dispositivo e al profilo browser. Per installazione e uso offline consultare il [README della PWA](vanilla-pwa/README.md#github-pages).

### QR scansionabili dei partecipanti

Cliccare un'anteprima per aprire il PNG a dimensione originale. Ogni QR contiene **solo l'ID del partecipante**, ad esempio `EVT-001`.

| Giulia Rossi · `EVT-001` | Marco Bianchi · `EVT-002` | Sara De Luca · `EVT-003` |
| --- | --- | --- |
| [![QR EVT-001](docs/qr/EVT-001.png)](docs/qr/EVT-001.png) | [![QR EVT-002](docs/qr/EVT-002.png)](docs/qr/EVT-002.png) | [![QR EVT-003](docs/qr/EVT-003.png)](docs/qr/EVT-003.png) |
| Davide Greco · `EVT-004` | Fabio Conti · `EVT-005` | Ivan Moretti · `EVT-006` |
| [![QR EVT-004](docs/qr/EVT-004.png)](docs/qr/EVT-004.png) | [![QR EVT-005](docs/qr/EVT-005.png)](docs/qr/EVT-005.png) | [![QR EVT-006](docs/qr/EVT-006.png)](docs/qr/EVT-006.png) |

I PNG sono pubblicati anche su Pages: [EVT-001](https://alemarra89.github.io/same-app-different-stack/qr/EVT-001.png), [EVT-002](https://alemarra89.github.io/same-app-different-stack/qr/EVT-002.png), [EVT-003](https://alemarra89.github.io/same-app-different-stack/qr/EVT-003.png), [EVT-004](https://alemarra89.github.io/same-app-different-stack/qr/EVT-004.png), [EVT-005](https://alemarra89.github.io/same-app-different-stack/qr/EVT-005.png), [EVT-006](https://alemarra89.github.io/same-app-different-stack/qr/EVT-006.png).

### Pubblicazione e percorsi

Il workflow [Publish demo and presentation](.github/workflows/deploy-vanilla-pwa.yml) pubblica insieme la demo, la presentazione e i QR in un unico sito. In [Settings → Pages](https://github.com/alemarra89/same-app-different-stack/settings/pages), **Build and deployment → Source** deve essere **GitHub Actions**. Dopo il push su `main`, il workflow parte automaticamente quando cambiano `vanilla-pwa/`, l'HTML della presentazione, `docs/qr/` o il workflow stesso; è disponibile anche **Run workflow** nella [pagina Actions](https://github.com/alemarra89/same-app-different-stack/actions/workflows/deploy-vanilla-pwa.yml). I nuovi percorsi diventano disponibili dopo la prima pubblicazione riuscita che include questa configurazione.

GitHub Pages consente [un sito per repository](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), con [più pagine e sottocartelle](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site). Il percorso si configura con la struttura dei file pubblicati:

```text
_site/
├── index.html                 ← demo Web: /same-app-different-stack/
├── talk/index.html            ← slide: /same-app-different-stack/talk/
└── qr/EVT-001.png … EVT-006.png
```

Il workflow copia `docs/Same_App_Different_Stack.html` in `_site/talk/index.html`, senza modificarlo: si continua ad aggiornare solo il file originale. L'HTML incorpora già stili, script, immagini e video. Per scegliere un altro percorso, ad esempio `/slides/`, cambiare la cartella di destinazione nei comandi `mkdir` e `cp` del workflow e aggiornare i link nei README. Non occorre creare un secondo workflow di pubblicazione. Un dominio personalizzato si configura invece nelle impostazioni Pages e nel DNS; il dominio e la parte `/same-app-different-stack/` dell'URL predefinito dipendono rispettivamente dall'account e dal nome del repository.

## Documentazione generale

La cartella [docs/](docs/README.md) raccoglie la presentazione in [HTML](docs/Same_App_Different_Stack.html) e [PDF](docs/Same_App_Different_Stack.pdf), i prompt originali e i [sei QR dei partecipanti](docs/README.md#qr-dei-partecipanti).

## Progetti

| Cartella | Tecnologia | Documentazione |
| --- | --- | --- |
| `flutter/` | Flutter e Dart | [Requisiti, avvio e verifiche](flutter/README.md) |
| `ionic/` | Ionic React, TypeScript e Capacitor | [Requisiti, avvio e verifiche](ionic/README.md) |
| `kotlin-multiplatform/` | Kotlin Multiplatform e Compose Multiplatform | [Requisiti, avvio e verifiche](kotlin-multiplatform/README.md) |
| `react-native/` | React Native, Expo e TypeScript | [Requisiti, avvio e verifiche](react-native/README.md) |
| `vanilla-pwa/` | HTML, CSS e JavaScript: Web, Android e desktop installabili | [Avvio, installazione e verifiche](vanilla-pwa/README.md) |

Ogni cartella è un progetto autonomo, con configurazioni, test e istruzioni proprie. Eseguire i comandi dalla cartella dell'app scelta: le quattro app native hanno dipendenze e toolchain dedicate; `vanilla-pwa` non richiede installazione o build. Non esiste un'installazione delle dipendenze comune alla radice.

## Installazione simultanea

Ogni app ha un identificativo distinto, uguale su Android (`applicationId`) e iOS (`bundle identifier`):

| Progetto | Identificativo Android e iOS |
| --- | --- |
| Flutter | `it.demo.eventcheckin.flutter` |
| Ionic | `it.demo.eventcheckin.ionic` |
| Kotlin Multiplatform | `it.demo.eventcheckin.kmp` |
| React Native | `it.demo.eventcheckin.reactnative` |

Le quattro build native possono quindi essere installate sullo stesso dispositivo come app separate, ognuna con i propri dati locali. Ricompilare dai sorgenti aggiornati: gli APK precedenti conservano i vecchi identificativi e i dati delle vecchie installazioni non vengono migrati automaticamente. Su iOS configurare il proprio team e il provisioning per ciascun nuovo bundle ID.

Per React Native, se `android/` o `ios/` erano già stati generati, rigenerarli con `npx expo prebuild --clean --platform android` oppure, su macOS, `npx expo prebuild --clean --platform ios` prima della build. Queste cartelle sono output locali: conservare eventuali modifiche manuali prima di rigenerarle. I report e i manifest in `react-native/docs/verification/` documentano le build iniziali con il vecchio identificativo.

Verifica del cambio identificativi su Windows (23/10/2026): compilati i quattro APK Android debug, controllati con `aapt` i package e le attività di avvio, e verificata l'assenza di autorità dei provider e permessi dichiarati duplicati fra le app. Passati typecheck/lint React Native e i 12 test JVM KMP; compilato anche l'APK dei test Android KMP. Questi ultimi non sono stati eseguiti su dispositivo. L'installazione simultanea su dispositivo e le build iOS non sono state eseguite in questa verifica.

## Avvio rapido

I comandi seguenti partono dalla radice del repository, ciascuno in un terminale separato. Consultare i README delle app per versioni SDK/JDK, permessi e istruzioni complete Android/iOS.

### Flutter

```sh
cd flutter
flutter pub get
flutter run
```

### Ionic

```sh
cd ionic
npm ci
npm run android
```

`npm run android` compila il Web, sincronizza Capacitor e apre Android Studio. Per l'anteprima Web usare `npm run dev`.

### Kotlin Multiplatform

```sh
cd kotlin-multiplatform
./gradlew :shared:jvmTest :androidApp:assembleDebug
```

Su Windows usare `.\gradlew.bat`. Aprire questa cartella in Android Studio per eseguire l'app; per iOS aprire `iosApp/iosApp.xcodeproj` su macOS.

### React Native / Expo

```sh
cd react-native
npm ci
npm run android
```

Per iOS usare `npm run ios` su macOS. I progetti nativi Expo vengono generati dalla configurazione e non sono versionati.

## Verifica e confronto

La quinta implementazione si avvia senza installazione o build: `cd vanilla-pwa` e `node scripts/serve.mjs`, poi aprire `http://localhost:4174/`. Lo stesso contenuto si pubblica su un server statico HTTPS e si installa su Android e desktop dal browser. Include scanner camera Web e uso offline; le presenze restano locali a dispositivo, origine e profilo browser. Vedere il [README dedicato](vanilla-pwa/README.md) per la demo nelle tre modalità e i test effettivamente eseguiti.

I README delle singole app e i relativi report riportano test eseguiti e limiti delle verifiche. La compilazione iOS richiede macOS/Xcode; la prova effettiva della fotocamera richiede un dispositivo adatto. Le anteprime Web disponibili in Flutter, Ionic e React Native usano il modulo manuale per il check-in.

I lockfile sono conservati per rendere riproducibili le dipendenze. Cache, dipendenze installate, configurazioni locali, credenziali e output di build sono esclusi da Git. La cronologia iniziale del progetto React Native è conservata nella cronologia di questo repository.
