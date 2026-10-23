# Same App, Different Stack

Un unico repository con quattro implementazioni indipendenti della stessa app mobile **Event Check-in**, per confrontare quattro tecnologie sullo stesso caso d'uso.

La demo gestisce il check-in locale dei sei partecipanti al **Tech Meetup 2026 · 23/10/2026**: ricerca, scansione QR su mobile, inserimento manuale, contatore presenze, persistenza locale e reset. L'interfaccia è in italiano; non serve un backend.

## Progetti

| Cartella | Tecnologia | Documentazione |
| --- | --- | --- |
| `flutter/` | Flutter e Dart | [Requisiti, avvio e verifiche](flutter/README.md) |
| `ionic/` | Ionic React, TypeScript e Capacitor | [Requisiti, avvio e verifiche](ionic/README.md) |
| `kotlin-multiplatform/` | Kotlin Multiplatform e Compose Multiplatform | [Requisiti, avvio e verifiche](kotlin-multiplatform/README.md) |
| `react-native/` | React Native, Expo e TypeScript | [Requisiti, avvio e verifiche](react-native/README.md) |

Ogni cartella è un progetto autonomo, con dipendenze, toolchain, test e configurazione nativa propri. Eseguire installazione, avvio e build dalla cartella dell'app scelta. Non esiste un'installazione delle dipendenze comune alla radice.

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

I README delle singole app e i relativi report riportano test eseguiti e limiti delle verifiche. La compilazione iOS richiede macOS/Xcode; la prova effettiva della fotocamera richiede un dispositivo adatto. Le anteprime Web disponibili in Flutter, Ionic e React Native usano il modulo manuale per il check-in.

I lockfile sono conservati per rendere riproducibili le dipendenze. Cache, dipendenze installate, configurazioni locali, credenziali e output di build sono esclusi da Git. La cronologia iniziale del progetto React Native è conservata nella cronologia di questo repository.
