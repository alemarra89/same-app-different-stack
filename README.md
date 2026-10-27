# Same App, Different Stack

Un unico repository con cinque implementazioni indipendenti della stessa app **Event Check-in**, per confrontare cinque tecnologie sullo stesso caso d'uso.

La demo gestisce il check-in locale dei sei partecipanti al **Tech Meetup 2026 · 23/10/2026**: ricerca, scansione QR, inserimento manuale, contatore presenze, persistenza locale e reset. L'interfaccia è in italiano; non serve un backend.

## Documentazione generale

La cartella [docs/](docs/README.md) raccoglie i prompt originali e i [sei QR dei partecipanti](docs/README.md#qr-dei-partecipanti).

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
