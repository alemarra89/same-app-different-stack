# Inventario della consegna

44 file nel progetto sorgente, inclusi configurazioni, lockfile, asset del template, documentazione, test e immagini di verifica. Il repository era vuoto: sono tutti file creati in questa sessione.

Esclusi: `node_modules/`, `android/`, `ios/`, `dist/`, `artifacts/`, `.test-build/`, `.git/`, `.expo/`. I progetti nativi e i bundle sono output generati, non inclusi nel conteggio comparativo.

Dipendenze dirette: **11 runtime + 4 sviluppo = 15**; rispetto al template, **7 runtime e 2 sviluppo aggiunte**.

Rigenerare l’inventario con `node scripts/inventory.cjs`.

- [.gitignore](../.gitignore)
- [AGENTS.md](../AGENTS.md)
- [App.tsx](../App.tsx)
- [LICENSE](../LICENSE)
- [README.md](../README.md)
- [app.json](../app.json)
- [assets/android-icon-background.png](../assets/android-icon-background.png)
- [assets/android-icon-foreground.png](../assets/android-icon-foreground.png)
- [assets/android-icon-monochrome.png](../assets/android-icon-monochrome.png)
- [assets/favicon.png](../assets/favicon.png)
- [assets/icon.png](../assets/icon.png)
- [assets/splash-icon.png](../assets/splash-icon.png)
- [docs/FILES.md](FILES.md)
- [docs/VERIFICATION.md](VERIFICATION.md)
- [docs/qr/EVT-002.png](qr/EVT-002.png)
- [docs/qr/EVT-002.svg](qr/EVT-002.svg)
- [docs/verification/android-debug-manifest.xml](verification/android-debug-manifest.xml)
- [docs/verification/native-config.json](verification/native-config.json)
- [docs/verification/npm-audit.json](verification/npm-audit.json)
- [docs/verification/web-mobile.png](verification/web-mobile.png)
- [eslint.config.js](../eslint.config.js)
- [index.ts](../index.ts)
- [package-lock.json](../package-lock.json)
- [package.json](../package.json)
- [plugins/withShortAndroidPaths.cjs](../plugins/withShortAndroidPaths.cjs)
- [scripts/inventory.cjs](../scripts/inventory.cjs)
- [scripts/serve-web.cjs](../scripts/serve-web.cjs)
- [src/data/event.ts](../src/data/event.ts)
- [src/domain/CheckInService.ts](../src/domain/CheckInService.ts)
- [src/domain/processCheckIn.ts](../src/domain/processCheckIn.ts)
- [src/domain/scanGuard.ts](../src/domain/scanGuard.ts)
- [src/hooks/useCheckIn.ts](../src/hooks/useCheckIn.ts)
- [src/models/participant.ts](../src/models/participant.ts)
- [src/scanner/QrScanner.tsx](../src/scanner/QrScanner.tsx)
- [src/scanner/QrScanner.web.tsx](../src/scanner/QrScanner.web.tsx)
- [src/scanner/types.ts](../src/scanner/types.ts)
- [src/screens/CheckInScreen.tsx](../src/screens/CheckInScreen.tsx)
- [src/storage/checkInRepository.ts](../src/storage/checkInRepository.ts)
- [src/storage/localRepository.ts](../src/storage/localRepository.ts)
- [src/ui/ActionButton.tsx](../src/ui/ActionButton.tsx)
- [src/ui/theme.ts](../src/ui/theme.ts)
- [tests/checkIn.test.cjs](../tests/checkIn.test.cjs)
- [tsconfig.json](../tsconfig.json)
- [tsconfig.test.json](../tsconfig.test.json)
