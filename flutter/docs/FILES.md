# File creati e modificati

Inventario iniziale del **23/10/2026**: **90 file consegnabili** creati da zero. Il conteggio comprende sorgenti, test, documentazione, configurazioni e asset dei template; esclude build, cache, file IDE e file locali rigenerabili ignorati dai .gitignore.

Integrazione del **24/10/2026**: [report build debug e prove Android](DEBUG_BUILD_2026-10-24.md), QR in `docs/qr/`, script di misura, risultati, log e riscontri Android in `docs/verification/2026-10-24/`. Queste aggiunte documentali non sono incluse nel conteggio iniziale di 90 file. L'APK locale è in `artifacts/android/event-check-in-flutter-debug.apk`, ignorato da Git; nessun sorgente applicativo modificato in questa verifica.

Sorgenti Dart applicativi: **9**. File Dart di test/supporto: **5**.

Integrazione Release del **24/10/2026**: [report](RELEASE_BUILD_2026-10-24.md), [video della demo](event-check-in-flutter-release-demo.mp4), script di misura/installazione/cattura e riscontri in `docs/verification/release-2026-10-24/`. APK locale `artifacts/android/event-check-in-flutter-release.apk` e registrazione originale in `build/release-recordings/`, ignorati da Git. Nessuna modifica ai sorgenti applicativi.

## Inventario

- `.gitignore`
- `.metadata`
- `analysis_options.yaml`
- `android/.gitignore`
- `android/app/build.gradle.kts`
- `android/app/src/debug/AndroidManifest.xml`
- `android/app/src/main/AndroidManifest.xml`
- `android/app/src/main/kotlin/it/demo/eventcheckin/flutter/MainActivity.kt`
- `android/app/src/main/res/drawable-v21/launch_background.xml`
- `android/app/src/main/res/drawable/launch_background.xml`
- `android/app/src/main/res/mipmap-hdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-mdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png`
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png`
- `android/app/src/main/res/values-night/styles.xml`
- `android/app/src/main/res/values/styles.xml`
- `android/app/src/profile/AndroidManifest.xml`
- `android/app/src/release/AndroidManifest.xml`
- `android/build.gradle.kts`
- `android/gradle.properties`
- `android/gradle/wrapper/gradle-wrapper.properties`
- `android/settings.gradle.kts`
- `docs/FILES.md`
- `docs/previews/mobile-web.jpg`
- `docs/VERIFICA.md`
- `ios/.gitignore`
- `ios/Flutter/AppFrameworkInfo.plist`
- `ios/Flutter/Debug.xcconfig`
- `ios/Flutter/Release.xcconfig`
- `ios/Podfile`
- `ios/Runner.xcodeproj/project.pbxproj`
- `ios/Runner.xcodeproj/project.xcworkspace/contents.xcworkspacedata`
- `ios/Runner.xcodeproj/project.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist`
- `ios/Runner.xcodeproj/project.xcworkspace/xcshareddata/WorkspaceSettings.xcsettings`
- `ios/Runner.xcodeproj/xcshareddata/xcschemes/Runner.xcscheme`
- `ios/Runner.xcworkspace/contents.xcworkspacedata`
- `ios/Runner.xcworkspace/xcshareddata/IDEWorkspaceChecks.plist`
- `ios/Runner.xcworkspace/xcshareddata/WorkspaceSettings.xcsettings`
- `ios/Runner/AppDelegate.swift`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Contents.json`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-1024x1024@1x.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@1x.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@2x.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-20x20@3x.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@1x.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@2x.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-29x29@3x.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@1x.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@2x.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-40x40@3x.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@2x.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-60x60@3x.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-76x76@1x.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-76x76@2x.png`
- `ios/Runner/Assets.xcassets/AppIcon.appiconset/Icon-App-83.5x83.5@2x.png`
- `ios/Runner/Assets.xcassets/LaunchImage.imageset/Contents.json`
- `ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage.png`
- `ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage@2x.png`
- `ios/Runner/Assets.xcassets/LaunchImage.imageset/LaunchImage@3x.png`
- `ios/Runner/Assets.xcassets/LaunchImage.imageset/README.md`
- `ios/Runner/Base.lproj/LaunchScreen.storyboard`
- `ios/Runner/Base.lproj/Main.storyboard`
- `ios/Runner/Info.plist`
- `ios/Runner/Runner-Bridging-Header.h`
- `ios/RunnerTests/RunnerTests.swift`
- `lib/data/event_seed.dart`
- `lib/logic/check_in_controller.dart`
- `lib/logic/check_in.dart`
- `lib/logic/scan_gate.dart`
- `lib/main.dart`
- `lib/models/participant.dart`
- `lib/scanner/qr_scanner.dart`
- `lib/screens/event_screen.dart`
- `lib/storage/check_in_store.dart`
- `pubspec.lock`
- `pubspec.yaml`
- `README.md`
- `test/check_in_test.dart`
- `test/event_screen_test.dart`
- `test/persistence_test.dart`
- `test/scan_gate_test.dart`
- `test/support/fake_preferences.dart`
- `web/favicon.png`
- `web/icons/Icon-192.png`
- `web/icons/Icon-512.png`
- `web/icons/Icon-maskable-192.png`
- `web/icons/Icon-maskable-512.png`
- `web/index.html`
- `web/manifest.json`

## Generati localmente, non conteggiati

Flutter genera inoltre wrapper Gradle, registranti plugin, configurazioni con percorsi SDK locali e file IDE. Sono presenti dove richiesto dagli strumenti e ignorati dai template; flutter pub get / build li rigenerano. Nessuna cache o APK è conteggiata come sorgente.

## Output realmente compilati

- `build/app/outputs/flutter-apk/app-debug.apk`
- `build/app/outputs/flutter-apk/app-release.apk` (demo, firma debug)
- `build/web/`

Nessun output iOS o Desktop prodotto.
