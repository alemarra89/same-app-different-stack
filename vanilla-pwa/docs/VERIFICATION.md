# Verifica eseguita — 27/10/2026

Ambiente: Windows, Node 22.13.1, Playwright 1.64.1 già presente nel progetto Ionic,
Microsoft Edge 156.0.4314.42 in modalità headless. Nessun file delle quattro app
è stato modificato. Decoder jsQR 1.4.0 locale, checksum verificato.

## Test realmente eseguiti

**11 test Node passati** con `node --test tests/check-in.test.mjs`:

- Confronto diretto dei sei ID/nomi con tutti e quattro i seed originali.
- Check-in con trim, duplicato, sconosciuto, payload invalido, maiuscole,
  immutabilità e totale 6/6.
- Guardia di un secondo, A/B/A, scadenza e azzeramento.
- Salvataggio dei soli ID, riapertura repository, reset limitato alla propria chiave.
- Dati corrotti, ID sconosciuti e storage non accessibile.
- Errori di scrittura/reset senza successo apparente e recupero tramite reset.
- Integrità SHA-256 del decoder vendorizzato.

**16 gruppi browser passati**, risultati completi in
[verification/browser-results.json](verification/browser-results.json):

| Gruppo | Verifica |
| --- | --- |
| Desktop | Sei partecipanti, nome/data evento, layout 1280×900 senza overflow |
| Flussi | Valido, duplicato, sconosciuto, JSON/URL/minuscole invalidi; ricerca e nessun risultato |
| Refresh/riapertura | localStorage reale conservato dopo refresh e chiusura/nuova scheda |
| Reset | Focus iniziale su Annulla, annullamento, conferma, lista/contatore/filtro e chiavi estranee |
| Decoder | Otto PNG con QR effettivi e QR EVT-002 originale del repository, letti da canvas dal decoder di produzione |
| Pipeline camera | getUserMedia → video → canvas → jsQR → Marco presente; duplicato senza incremento; tracce terminate alla chiusura |
| Lifecycle | Reset rilascia le tracce; evento background simulato rilascia tutte le tracce |
| Errori camera | Permesso negato, camera assente/occupata simulati; riprova con riavvio effettivo dello stream; permesso tardivo dopo chiusura senza stream residui |
| Errori storage | Lettura bloccata con recupero tramite Riprova, JSON corrotto e fallimenti di scrittura/reset iniettati; nessun ingresso falsamente registrato |
| Mobile | Larghezze 390 e 320, sei righe e nessun overflow orizzontale |
| Manifest | Parsing senza errori, URL relativi, display standalone, dimensioni PNG, controllo installabilità Chromium |
| Offline | Rete disabilitata nel browser: reload, nuova scheda, check-in persistiti, camera e reset |
| Sottocartella | `/demo/events/`: worker confinato, cache e dati distinti dalla radice, avvio e camera offline |
| Aggiornamento | v1 → v2 di test, pulsante esplicito, ricaricamento, dati conservati, vecchia cache rimossa e cache estranee preservate |
| Installazione cache fallita | Risorsa CSS con risposta 503: worker nuovo non attivato e versione precedente ancora disponibile offline |
| Riavvio completo | Chiusura del processo browser e apertura dello stesso profilo persistente: presenza conservata; installabilità senza errori |

**0 errori JavaScript di pagina** rilevati. Il controllo installabilità nel contesto
privato di Playwright riporta esclusivamente `in-incognito`, atteso per quel contesto.
Lo stesso controllo in un profilo persistente normale restituisce zero errori.
Questo verifica i criteri del browser, non dimostra un’installazione dal menu del sistema.

Verificato anche il comando documentato `node scripts/serve.mjs`: la pagina iniziale
ha restituito HTTP 200 su `http://127.0.0.1:4174/`. Il server di anteprima è stato
arrestato al termine; il comando nel README lo riavvia senza installazione o build.

La sorgente camera è un video Y4M locale con QR EVT-002, passato al dispositivo
video di test di Chromium. Il codice applicativo chiama davvero getUserMedia e
decodifica fotogrammi video; i risultati di check-in non sono simulati.
Le condizioni di errore e l’evento background sono invece iniettati nei test,
come indicato nella tabella. Nessun percorso di simulazione è presente nella UI o nel runtime.

Gli screenshot [desktop](verification/desktop.png), [mobile](verification/mobile.png),
[scanner](verification/scanner.png) e [offline](verification/offline.png) sono acquisizioni
reali del browser. Desktop e mobile sono stati anche ispezionati visivamente.

## Riproduzione

Dalla radice del monorepo:

```powershell
node --test vanilla-pwa/tests/check-in.test.mjs
# Generare prima il video con scripts/generate-assets.py: vedi README.
$env:PLAYWRIGHT_MODULE = "$PWD/ionic/node_modules/playwright/index.mjs"
node vanilla-pwa/tests/browser.mjs
```

Il runner usa Edge su Windows come impostazione predefinita; per Chromium impostare
`PLAYWRIGHT_CHANNEL=chromium`. Il video/profilo in `.test-build/` sono locali e ignorati.
Sono necessari permessi di esecuzione del browser e di ascolto locale per il server di test.
Gli strumenti opzionali non servono per avviare o pubblicare l’app.

## Verifica manuale ancora richiesta

- Android reale, Chrome, origine HTTPS con certificato attendibile.
- Installazione dal menu e avvio dall’icona su Android, Windows e macOS.
- Finestra standalone, riapertura offline dall’icona dopo chiusura completa e reboot OS.
- Camera fisica posteriore/frontale/webcam, luce, messa a fuoco, QR stampati e distanze reali.
- Prompt/negazione/riattivazione dei permessi reali di browser e sistema operativo.
- Passaggio in background, blocco schermo, chiamata e ritorno sull’Android target.
- Safari/macOS, autorizzazioni camera e modalità Aggiungi al Dock.

Queste prove non sono dichiarate passate. Le larghezze mobile nel browser desktop
non equivalgono a un test sul sistema Android. Non è stato pubblicato alcun sito
esterno né effettuata un’installazione OS durante questa verifica.
