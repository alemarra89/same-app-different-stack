# jsQR 1.4.0

`jsQR.js` è il file originale `package/dist/jsQR.js`, senza trasformazioni, tratto da
`https://registry.npmjs.org/jsqr/-/jsqr-1.4.0.tgz`.

- Progetto: https://github.com/cozmo/jsQR
- Licenza Apache-2.0: `jsQR.LICENSE` (conservata integralmente).
- SHA-256 di `jsQR.js`: `bc40c8a15196236b2314db0856f72ca0b49980cd5413b8c852a7349f5fee0859`.
- Dimensione circa 251 KiB non compressi; nessuna dipendenza runtime.

Il modulo scanner importa il file UMD come effetto collaterale e chiama
`globalThis.jsQR` sui pixel del canvas. Non usa CDN né BarcodeDetector.
Non occorrono npm install, build o generazione di codice per distribuire l’app.
