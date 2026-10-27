# Event Check-in — HTML, CSS e JavaScript

Quinta implementazione indipendente di **Event Check-in**: stessa app, unica codebase
per browser, Android installato e desktop installato. Nessun framework, bundler,
wrapper nativo, backend o servizio remoto. Non è richiesta alcuna compilazione.
Interfaccia italiana senza riferimenti alla tecnologia impiegata.

## Avvio immediato

Dalla radice del monorepo, con Node 18+:

```sh
cd vanilla-pwa
node scripts/serve.mjs
```

Aprire **http://localhost:4174/**. Anche `npm start` esegue lo stesso server,
senza `npm install`. Il server serve esclusivamente file statici su loopback.
`PORT` permette di cambiare porta; cambiando origine cambia anche lo storage locale.

Alternativa con Python 3, dalla cartella `vanilla-pwa`:

```sh
python -m http.server 4174 --bind 127.0.0.1
```

Non aprire `index.html` con `file://`: moduli ES, camera e service worker richiedono
un server; camera e service worker richiedono HTTPS oppure localhost.

## Equivalenza con le quattro app

Evento: **Tech Meetup 2026 · 23/10/2026**. Stato iniziale: **0 / 6 presenti**.

| ID | Partecipante |
| --- | --- |
| EVT-001 | Giulia Rossi |
| EVT-002 | Marco Bianchi |
| EVT-003 | Sara De Luca |
| EVT-004 | Davide Greco |
| EVT-005 | Fabio Conti |
| EVT-006 | Ivan Moretti |

- Il QR contiene **solo l’ID**, ad esempio `EVT-002`: niente URL, JSON o token.
  Si eliminano gli spazi esterni; `evt-002` rimane invalido.
- Check-in valido: `Check-in effettuato: Marco Bianchi`, stato Presente e contatore aggiornato.
- Già presente: `Check-in già effettuato`, nessun incremento.
- Sconosciuto o payload invalido: `QR non valido`, nessuna modifica.
- Guardia per scansioni ripetute: un secondo per ciascun payload ripulito;
  anche la sequenza A/B/A è protetta. Inserimento manuale senza attesa.
- Ricerca per nome o ID, senza distinzione di maiuscole; contatore sempre globale.
- Il reset richiede conferma, azzera le presenze e riporta i sei partecipanti
  allo stato iniziale. Non cancella dati di altre applicazioni, cache o permessi.
- Scrittura locale prima del successo: se fallisce, la UI non mostra un ingresso salvato.
  Dati illeggibili bloccano i check-in; si può riprovare o confermare il reset.

L’analisi delle fonti e le differenze tra piattaforme sono in [docs/ANALYSIS.md](docs/ANALYSIS.md).
Non è stata trovata una specifica originale separata nel repository: README, seed,
dominio, persistenza, scanner e test delle quattro implementazioni sono il riferimento.

## Scanner reale

`getUserMedia()` richiede il video senza audio e preferisce la camera posteriore.
L’anteprima passa a un canvas; **jsQR 1.4.0**, incluso in `vendor/`, decodifica i pixel
anche offline. Nessuna dipendenza da `BarcodeDetector` o da una CDN.
La licenza e il checksum sono in [vendor/README.md](vendor/README.md).

Consentire la fotocamera, inquadrare un QR e attendere il messaggio. Lo scanner
rimane aperto per gli ingressi successivi. È possibile usare sempre il modulo manuale.
Gli errori di permesso, camera assente o occupata sono spiegati con possibilità di riprovare.
La chiusura, Escape, il reset, l’uscita dalla pagina o il passaggio in background
arrestano le tracce video e rimuovono lo stream. Un permesso concesso dopo la chiusura
non riaccende lo scanner. Alla riapertura occorre premere nuovamente Scansiona QR.
Fotogrammi e immagini non vengono salvati né inviati.

In [docs/qr/](docs/qr/) sono inclusi QR stampabili dei sei partecipanti,
un codice sconosciuto `EVT-999` e il testo invalido `invalid`.
Mostrarli su un secondo schermo o stamparli, con il bordo bianco visibile.

## Hosting statico HTTPS e sottocartelle

### GitHub Pages

Il workflow [Publish Event Check-in](../.github/workflows/deploy-vanilla-pwa.yml)
pubblica solo i file necessari all’app, senza compilazione. Si avvia per modifiche
a `vanilla-pwa/` su `main`, per modifiche al workflow oppure manualmente da Actions.
Prima della pubblicazione esegue i test Node; non installa dipendenze dell’app.
Documentazione, video di test, profili browser e altre quattro implementazioni
non sono inclusi nel sito pubblicato.

Lo stato e l’indirizzo di ogni pubblicazione sono disponibili nella pagina
[Actions — Publish Event Check-in](https://github.com/alemarra89/same-app-different-stack/actions/workflows/deploy-vanilla-pwa.yml).
Se un’esecuzione fallisce perché Pages non era ancora attivo, selezionare
**GitHub Actions** nelle impostazioni Pages e avviare **Run workflow** dalla
pagina Actions, oppure pubblicare un nuovo aggiornamento di questa cartella.

In **Settings → Pages → Build and deployment**, la sorgente deve essere
**GitHub Actions**. Il workflow espone l’indirizzo effettivo nel risultato del
deployment; con il repository attuale l’indirizzo previsto è
`https://alemarra89.github.io/same-app-different-stack/`.

Aprire l’URL HTTPS in Chrome su Android o Edge/Chrome su desktop, attendere
`Pronta anche senza connessione` e installare dal browser. Non serve il server locale,
il collegamento USB o mantenere acceso il computer. Le presenze di localhost
non vengono trasferite al sito pubblicato, perché l’origine è diversa.

### Altri server statici

Caricare direttamente questi file e cartelle su un server statico HTTPS:

```text
index.html
styles.css
manifest.webmanifest
sw.js
src/
vendor/jsQR.js
vendor/jsQR.LICENSE
icons/
```

`docs/`, `tests/`, `scripts/` e `package.json` servono solo a documentazione e sviluppo;
non sono necessari al runtime. Nessun `node_modules`, Python o Node sul server di produzione.
Usare MIME corretti per moduli `.js` (`text/javascript`) e manifest
(`application/manifest+json`); evitare riscritture SPA che restituiscano HTML per file mancanti.
Conservare il contenuto completo della licenza del decoder nella distribuzione.

L’app può essere servita, ad esempio, da `https://host.example/demo/check-in/`.
Tutti i percorsi sono relativi. Aprire la directory con slash finale; il server deve
reindirizzare `/demo/check-in` a `/demo/check-in/`, come i comuni server statici.
Manifest, identità, `start_url`, scope del worker e cache seguono quella directory.
Non è richiesto `Service-Worker-Allowed` perché `sw.js` è nella radice dell’app.

Per una prova locale della sottocartella, dalla radice del monorepo:

```sh
python -m http.server 4175 --bind 127.0.0.1
```

Aprire `http://localhost:4175/vanilla-pwa/`.

## Test su Android tramite HTTPS

1. Pubblicare i file su un hosting statico HTTPS raggiungibile dal telefono,
   oppure configurare un server statico HTTPS nella rete locale con un certificato
   la cui autorità sia attendibile anche su Android. Per questa implementazione
   non è stato creato alcun hosting né introdotto alcun servizio esterno.
2. Aprire quell’indirizzo in Chrome per Android. L’HTTP sull’IP LAN del computer
   (`http://192.168...`) **non** è localhost sul telefono e non basta per la camera.
   Non ignorare errori del certificato: il contesto deve risultare sicuro.
3. Attendere `Pronta anche senza connessione`, consentire la fotocamera e leggere
   `EVT-002`. Provare poi duplicato, sconosciuto e riapertura dell’app.
4. Dopo la prima apertura completa, attivare la modalità aereo: riaprire e verificare
   lettura, inserimento, ricerca, persistenza e reset. La fotocamera non richiede Internet.

## Installazione Android, Windows e macOS

Usare un profilo browser normale: la modalità privata può impedire installazione
e persistenza. Disponibilità e nome del comando dipendono dal browser e dalle sue policy.

- **Android / Chrome:** aprire l’URL HTTPS, attendere la disponibilità offline,
  menu ⋮ → **Aggiungi a schermata Home / Installa app**, quindi confermare.
  Avviare Event Check-in dall’icona; consentire la camera anche in questa modalità.
- **Windows / Edge o Chrome:** aprire lo stesso URL HTTPS (localhost va bene per
  una prova sul computer), usare l’icona Installa nella barra degli indirizzi
  oppure il menu **App → Installa questo sito come app** in Edge.
  Avviare dal menu Start e verificare la finestra autonoma senza barra indirizzi.
- **macOS / Chrome o Edge:** usare il comando Installa del browser e avviare
  l’app creata. Con Safari che supporta le web app: **File → Aggiungi al Dock**;
  controllare separatamente permessi camera e comportamento offline.

Il manifest usa `display: standalone`, icone PNG 192/512, icona maskable e icona Apple.
L’app non aggiunge istruzioni di installazione o riferimenti tecnologici nell’interfaccia.

## Demo nelle tre modalità

| Modalità | Preparazione | Sequenza suggerita |
| --- | --- | --- |
| Mobile | Android, URL HTTPS installato, camera autorizzata | Scansionare EVT-002; ripetere per il duplicato; mostrare lista e ricerca. |
| Web | URL in una scheda del browser | Inserire EVT-001; provare EVT-999; ricaricare e mostrare persistenza. |
| Desktop | App installata dal browser, avviata come finestra autonoma | Camera o codice EVT-003; chiudere e riaprire; provare offline e reset. |

Prima del talk, caricare completamente ogni ambiente con connessione e verificare
il messaggio offline. Preparare i QR su carta o su un altro dispositivo.
Reimpostare ciascun ambiente per partire da 0 / 6.

**Non c’è sincronizzazione tra dispositivi.** Le presenze sono locali all’origine,
al percorso dell’app e al profilo browser. Browser e app installata nello stesso
profilo desktop possono condividere lo stesso localStorage; questo non implica
condivisione con Android, altri browser, altri profili o altri computer.
Cancellazione dei dati del sito, modalità privata o rimozione dei dati da parte
del browser possono perdere le presenze. Non usare questa demo come registro centralizzato.

## Offline e aggiornamenti

Il worker precachea HTML, CSS, tutti i moduli, decoder, manifest e icone.
La prima installazione riesce solo se tutte le risorse sono disponibili.
In seguito la shell è servita dalla cache: check-in e scanner continuano offline.
L’indicatore di connettività usa lo stato del browser, non prova la raggiungibilità del server.

Per rilasciare una modifica:

1. Incrementare `VERSION` in `sw.js` **a ogni modifica di una risorsa precacheata**.
2. Pubblicare insieme tutti i file della nuova versione, preferibilmente con
   distribuzione atomica. Servire `sw.js` con `Cache-Control: no-cache`.
3. Riaprire l’app con rete: la nuova versione viene scaricata in una cache distinta.
   Compare **Aggiorna app** soltanto quando è completa. Il pulsante attiva il nuovo
   worker e ricarica le finestre aperte di quello scope, fermando prima la camera.

Una versione incompleta non sostituisce quella attiva. L’attivazione elimina solo
le cache precedenti di questa installazione/percorso, senza toccare localStorage
o altre app. Per un rilascio futuro con nuovo schema dati occorrerà prevedere
un’esplicita migrazione; lo schema attuale resta `v1`.

## Codice e persistenza

| File | Responsabilità |
| --- | --- |
| `src/data.js` | Evento e sei partecipanti immutabili |
| `src/check-in.js` | Dominio puro e guardia anti-duplicati |
| `src/controller.js` | Flussi, salvataggio prima della UI ed errori |
| `src/storage.js` | Adattatore localStorage, solo ID presenti |
| `src/scanner.js` | Camera, ciclo video/canvas, decoder e rilascio risorse |
| `src/ui.js` | Rendering DOM, contatori e ricerca |
| `src/app.js` | Collegamento degli eventi e lifecycle della pagina |
| `src/pwa.js` / `sw.js` | Registrazione, disponibilità offline e aggiornamenti |

La chiave è `event-check-in:<percorso>:tech-meetup-2026:v1`, per esempio
`event-check-in:/vanilla-pwa/:tech-meetup-2026:v1`.
Il valore è un array JSON dei soli ID presenti. Gli ID sconosciuti salvati vengono
ignorati, i dati corrotti segnalati e preservati fino al reset confermato.
localStorage è sufficiente per sei partecipanti e mantiene semplice il codice.

## Test e limiti

Test di dominio e persistenza, senza dipendenze da installare:

```sh
cd vanilla-pwa
npm test
```

Il test di equivalenza legge i seed delle altre quattro app dal monorepo, senza modificarli.

Test browser opzionali: occorrono Node, Playwright e un browser Chromium.
La versione verificata è Playwright 1.64.1 con Edge 156 su Windows.
Se non è già disponibile, installare gli strumenti di sviluppo separatamente:

```sh
npm install --no-save --package-lock=false playwright@1.64.1
npx playwright install chromium
```

Generare il video di test (solo sviluppo, richiede Python con Pillow e reportlab):

```sh
python -m pip install Pillow reportlab
python scripts/generate-assets.py
```

Su Windows con Edge installato:

```sh
npm run test:browser
```

Per Chromium di Playwright, in PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'chromium'
npm run test:browser
```

Su macOS/Linux: `PLAYWRIGHT_CHANNEL=chromium npm run test:browser`.
Se Playwright è già installato altrove, `PLAYWRIGHT_MODULE` può indicare il percorso
assoluto del suo `index.mjs`, senza installare dipendenze in questa app.
Il runner crea e chiude il proprio server statico, legge il video Y4M come camera
e scrive risultati/screenshot in `docs/verification/`; i profili e il video sono
in `.test-build/`, esclusa da Git. Nessun test browser è necessario per distribuire i file.

**Eseguiti il 27/10/2026:** 11 test Node e 16 gruppi di verifiche browser passati,
inclusi QR realmente decodificati da immagini e video, persistenza dopo riavvio del
processo browser, offline e aggiornamenti. Nessun errore JavaScript di pagina rilevato.
Dettagli, prove e limiti in [docs/VERIFICATION.md](docs/VERIFICATION.md).

**Da eseguire manualmente:** fotocamere fisiche, Android reale via HTTPS,
installazione e avvio dalle icone di sistema Android/Windows/macOS, Safari/macOS,
permessi effettivi del sistema e lifecycle sui dispositivi target.
L’emulazione delle larghezze mobile non equivale a un test Android.

Fonti tecniche: [jsQR](https://github.com/cozmo/jsQR),
[getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia),
[service worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers),
[installabilità](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).
