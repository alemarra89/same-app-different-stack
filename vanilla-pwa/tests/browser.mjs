// Optional development tests. Set PLAYWRIGHT_MODULE to an installed Playwright ESM
// entry point, or install Playwright locally with no package/lockfile changes.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)).href : 'playwright');
const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'docs/verification');
await mkdir(output, { recursive: true });
const results = { date: new Date().toISOString(), environment: '', passed: [], failures: [], consoleErrors: [] };
let updatedWorker = false;
let rejectUpdate = false;
const requests = [];
const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  requests.push(url.pathname);
  let pathname = url.pathname;
  if (pathname.startsWith('/demo/events/')) pathname = pathname.slice('/demo/events'.length);
  if (pathname === '/unrelated.txt') { response.end('unrelated app'); return; }
  const path = resolve(root, `.${pathname.endsWith('/') ? `${pathname}index.html` : pathname}`);
  if (!path.startsWith(root.endsWith(sep) ? root : `${root}${sep}`)) { response.writeHead(403).end(); return; }
  if (rejectUpdate && pathname === '/styles.css') { response.writeHead(503).end(); return; }
  try {
    let body = await readFile(path);
    if (updatedWorker && pathname === '/sw.js') body = Buffer.from(body.toString().replace("const VERSION = 'v1'", "const VERSION = 'v2-test'"));
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(body);
  } catch { response.writeHead(404).end(); }
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;

async function check(name, run) {
  try { await run(); results.passed.push(name); process.stdout.write(`PASS ${name}\n`); }
  catch (error) { results.failures.push({ name, error: error.stack }); process.stdout.write(`FAIL ${name}: ${error.message}\n`); throw error; }
}
async function waitFor(page, text) { await page.getByText(text, { exact: true }).waitFor({ state: 'visible' }); }
async function entry(page, code) {
  await page.getByLabel('Codice partecipante', { exact: true }).fill(code);
  await page.getByRole('button', { name: 'Conferma check-in', exact: true }).click();
}
async function reset(page) {
  await page.getByRole('button', { name: 'Reimposta demo', exact: true }).click();
  await page.getByRole('button', { name: 'Sì, reimposta demo', exact: true }).click();
  await waitFor(page, '0 / 6 presenti');
}
async function ready(page, path = '/') {
  await page.goto(`${base}${path}`);
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => {}));
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.getByRole('button', { name: 'Scansiona QR', exact: true }).waitFor();
}
function observe(page) {
  page.on('pageerror', (error) => results.consoleErrors.push(error.message));
}

try {
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-video-capture=${resolve(root, '.test-build/EVT-002.y4m')}`],
  });
  results.environment = `Headless Chromium/Edge ${browser.version()} on ${process.platform}; camera: Y4M fixture, not physical hardware`;
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['camera'] });
  await context.addInitScript(() => {
    window.__streams = [];
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (...args) => {
      const stream = await original(...args);
      window.__streams.push(stream);
      return stream;
    };
  });
  let page = await context.newPage();
  observe(page);
  await check('desktop: six originals, event title/date and no overflow', async () => {
    await ready(page);
    await waitFor(page, '0 / 6 presenti');
    assert.equal(await page.locator('#participants > li').count(), 6);
    assert.equal(await page.locator('#event-name').textContent(), 'Tech Meetup 2026');
    assert.equal(await page.locator('#event-date').textContent(), '23/10/2026');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: resolve(output, 'desktop.png'), fullPage: true });
  });
  await check('manual: valid, duplicate, unknown, invalid, trim, case-sensitive; search', async () => {
    await entry(page, ' EVT-001 ');
    await waitFor(page, 'Check-in effettuato: Giulia Rossi');
    await waitFor(page, '1 / 6 presenti');
    assert.equal(await page.locator('[data-id="EVT-001"] .badge').textContent(), '✓ Presente');
    assert.equal(await page.locator('#code').inputValue(), ' EVT-001 ');
    await page.getByRole('button', { name: 'Conferma check-in', exact: true }).click();
    await waitFor(page, 'Check-in già effettuato');
    for (const code of ['EVT-999', 'evt-002', '{"id":"EVT-002"}', 'https://example.com/EVT-002']) {
      await entry(page, code);
      await waitFor(page, 'QR non valido');
      await waitFor(page, '1 / 6 presenti');
    }
    await page.getByLabel('Cerca per nome o ID', { exact: true }).fill('de luca');
    assert.equal(await page.locator('#participants > li').count(), 1);
    await waitFor(page, 'Sara De Luca');
    await page.locator('#search').fill('evt-004');
    await waitFor(page, 'Davide Greco');
    await page.locator('#search').fill('nessuno');
    await waitFor(page, 'Nessun partecipante trovato.');
    await page.locator('#search').fill('');
  });
  await check('persistence: refresh and closed/reopened tab with real localStorage', async () => {
    await page.reload();
    await waitFor(page, '1 / 6 presenti');
    await page.close();
    page = await context.newPage(); observe(page);
    await ready(page);
    await waitFor(page, '1 / 6 presenti');
  });
  await check('reset: cancel, confirm, list/count/search update and unrelated key preserved', async () => {
    await page.evaluate(() => localStorage.setItem('other-app', 'keep'));
    await page.getByRole('button', { name: 'Reimposta demo', exact: true }).click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'cancel-reset');
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();
    await waitFor(page, '1 / 6 presenti');
    await page.locator('#search').fill('Marco');
    await reset(page);
    assert.equal(await page.locator('#search').inputValue(), '');
    assert.equal(await page.locator('.is-present').count(), 0);
    assert.equal(await page.evaluate(() => localStorage.getItem('other-app')), 'keep');
    await page.reload();
    await waitFor(page, '0 / 6 presenti');
  });
  await check('decoder: all six real PNG QR images plus unknown and invalid', async () => {
    const codes = ['EVT-001', 'EVT-002', 'EVT-003', 'EVT-004', 'EVT-005', 'EVT-006', 'EVT-999', 'invalid'];
    const decoded = await page.evaluate(async (codes) => {
      const { decodeQR } = await import('./src/scanner.js');
      const values = [];
      for (const code of codes) {
        const image = new Image();
        image.src = `./docs/qr/${code}.png`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);
        values.push(decodeQR(ctx.getImageData(0, 0, canvas.width, canvas.height))?.data);
      }
      return values;
    }, codes);
    assert.deepEqual(decoded, codes);
    const original = await readFile(new URL('../../react-native/docs/qr/EVT-002.png', import.meta.url));
    const originalCode = await page.evaluate(async (src) => {
      const { decodeQR } = await import('./src/scanner.js');
      const image = new Image(); image.src = src; await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
      return decodeQR(context.getImageData(0, 0, canvas.width, canvas.height))?.data;
    }, `data:image/png;base64,${original.toString('base64')}`);
    assert.equal(originalCode, 'EVT-002');
  });
  await check('camera: actual getUserMedia video → canvas → jsQR → check-in; duplicate; close stops tracks', async () => {
    await page.getByRole('button', { name: 'Scansiona QR', exact: true }).click();
    await waitFor(page, 'Check-in effettuato: Marco Bianchi');
    await waitFor(page, '1 / 6 presenti');
    assert.ok(await page.evaluate(() => document.querySelector('video').videoWidth > 0));
    await page.screenshot({ path: resolve(output, 'scanner.png'), fullPage: true });
    await waitFor(page, 'Check-in già effettuato');
    await waitFor(page, '1 / 6 presenti');
    await page.getByRole('button', { name: 'Chiudi scanner', exact: true }).click();
    assert.ok(await page.evaluate(() => window.__streams.flatMap((s) => s.getTracks()).every((t) => t.readyState === 'ended')));
    assert.equal(await page.evaluate(() => document.querySelector('video').srcObject), null);
  });
  await check('camera: reset and simulated background event release all tracks', async () => {
    await page.getByRole('button', { name: 'Scansiona QR', exact: true }).click();
    await page.waitForFunction(() => window.__streams.at(-1)?.active);
    await page.getByRole('button', { name: 'Reimposta demo', exact: true }).click();
    assert.ok(await page.evaluate(() => window.__streams.flatMap((s) => s.getTracks()).every((t) => t.readyState === 'ended')));
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();
    await page.getByRole('button', { name: 'Scansiona QR', exact: true }).click();
    await page.waitForFunction(() => window.__streams.at(-1)?.active);
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
      delete document.hidden;
    });
    assert.ok(await page.evaluate(() => window.__streams.flatMap((s) => s.getTracks()).every((t) => t.readyState === 'ended')));
    assert.equal(await page.locator('#scanner').isVisible(), false);
  });
  await check('camera: denied/missing/busy errors, retry, delayed permission after close', async () => {
    await page.evaluate(() => { window.__originalCamera = navigator.mediaDevices.getUserMedia; });
    for (const name of ['NotAllowedError', 'NotFoundError', 'NotReadableError']) {
      await page.evaluate((name) => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('test', name); }; }, name);
      await page.getByRole('button', { name: 'Scansiona QR', exact: true }).click();
      await page.locator('#retry-camera').waitFor({ state: 'visible' });
      assert.ok((await page.locator('#scanner-status').textContent()).length > 30);
      if (name === 'NotReadableError') {
        await page.evaluate(() => { navigator.mediaDevices.getUserMedia = window.__originalCamera; });
        await page.getByRole('button', { name: 'Riprova fotocamera', exact: true }).click();
        await page.waitForFunction(() => document.querySelector('video').srcObject?.active);
        await page.locator('#retry-camera').waitFor({ state: 'hidden' });
      }
      await page.getByRole('button', { name: 'Chiudi scanner', exact: true }).click();
    }
    await page.reload();
    await page.evaluate(() => {
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (...args) => {
        const stream = await original(...args);
        await new Promise((resolve) => { window.__releaseCamera = resolve; });
        return stream;
      };
    });
    await page.getByRole('button', { name: 'Scansiona QR', exact: true }).click();
    await page.waitForFunction(() => typeof window.__releaseCamera === 'function');
    await page.getByRole('button', { name: 'Chiudi scanner', exact: true }).click();
    await page.evaluate(() => window.__releaseCamera());
    await page.waitForFunction(() => window.__streams.flatMap((s) => s.getTracks()).every((t) => t.readyState === 'ended'));
    await page.reload();
  });
  await check('storage: corrupt/blocked reads and quota/reset failures do not report saved success', async () => {
    await page.evaluate(() => {
      window.__originalRead = Storage.prototype.getItem;
      Storage.prototype.getItem = () => { throw new DOMException('Blocked', 'SecurityError'); };
      window.dispatchEvent(new StorageEvent('storage'));
    });
    await waitFor(page, 'Impossibile leggere i check-in salvati. Riprova o reimposta la demo.');
    assert.equal(await page.locator('#open-scanner').isDisabled(), true);
    await page.evaluate(() => { Storage.prototype.getItem = window.__originalRead; });
    await page.getByRole('button', { name: 'Riprova caricamento', exact: true }).click();
    await waitFor(page, '1 / 6 presenti');
    await page.evaluate(async () => {
      const { STORAGE_KEY } = await import('./src/storage.js');
      localStorage.setItem(STORAGE_KEY, 'broken');
    });
    await page.reload();
    await waitFor(page, 'Impossibile leggere i check-in salvati. Riprova o reimposta la demo.');
    assert.equal(await page.locator('#submit').isDisabled(), true);
    await reset(page);
    await page.evaluate(() => { Storage.prototype.setItem = () => { throw new DOMException('Quota full', 'QuotaExceededError'); }; });
    await entry(page, 'EVT-001');
    await waitFor(page, 'Salvataggio non riuscito. Check-in non registrato: riprova.');
    await waitFor(page, '0 / 6 presenti');
    await page.reload();
    await entry(page, 'EVT-001');
    await page.evaluate(() => { Storage.prototype.removeItem = () => { throw new Error('Denied'); }; });
    await page.getByRole('button', { name: 'Reimposta demo', exact: true }).click();
    await page.getByRole('button', { name: 'Sì, reimposta demo', exact: true }).click();
    assert.equal(await page.locator('#reset-dialog').isVisible(), true);
    assert.match(await page.locator('#reset-error').textContent(), /stato precedente/);
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();
    await waitFor(page, '1 / 6 presenti');
    await page.reload();
  });
  await check('mobile: 390px and 320px, readable list and no horizontal overflow', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => document.activeElement?.blur());
    await page.screenshot({ path: resolve(output, 'mobile.png'), fullPage: true });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.setViewportSize({ width: 320, height: 720 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert.equal(await page.locator('#participants > li').count(), 6);
    await page.setViewportSize({ width: 1280, height: 900 });
  });
  await check('manifest: parse, relative start/scope/icons, PNG dimensions and Chromium installability', async () => {
    const manifest = await page.evaluate(async () => (await fetch('./manifest.webmanifest')).json());
    assert.equal(manifest.display, 'standalone');
    assert.equal(manifest.start_url, './'); assert.equal(manifest.scope, './');
    for (const icon of manifest.icons) {
      const dimensions = await page.evaluate(async (src) => { const i = new Image(); i.src = src; await i.decode(); return `${i.naturalWidth}x${i.naturalHeight}`; }, icon.src);
      assert.equal(dimensions, icon.sizes);
    }
    const session = await context.newCDPSession(page);
    const manifestData = await session.send('Page.getAppManifest');
    assert.deepEqual(manifestData.errors, []);
    const installability = await session.send('Page.getInstallabilityErrors');
    results.installability = installability;
    // Playwright's newContext is incognito. Verify the app-related errors here;
    // the persistent-profile test below verifies installation outside incognito.
    assert.deepEqual(installability.installabilityErrors.map((e) => e.errorId), ['in-incognito']);
    await session.detach();
  });
  await check('offline: reload, closed/new tab, persisted check-in, camera and reset without network', async () => {
    await context.setOffline(true);
    await page.reload();
    await waitFor(page, '1 / 6 presenti');
    await entry(page, 'EVT-006');
    await waitFor(page, '2 / 6 presenti');
    await page.close();
    page = await context.newPage(); observe(page);
    await page.goto(`${base}/?offline=1`);
    await waitFor(page, '2 / 6 presenti');
    await page.getByRole('button', { name: 'Scansiona QR', exact: true }).click();
    await waitFor(page, 'Check-in effettuato: Marco Bianchi');
    await waitFor(page, '3 / 6 presenti');
    await page.getByRole('button', { name: 'Chiudi scanner', exact: true }).click();
    await reset(page);
    await page.reload();
    await waitFor(page, '0 / 6 presenti');
    await page.screenshot({ path: resolve(output, 'offline.png'), fullPage: true });
    await context.setOffline(false);
  });
  await check('subdirectory: scoped worker/cache/storage, offline launch and camera', async () => {
    await entry(page, 'EVT-001');
    const nested = await context.newPage(); observe(nested);
    await ready(nested, '/demo/events/');
    await waitFor(nested, '0 / 6 presenti');
    const scope = await nested.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.scope));
    assert.equal(scope, `${base}/demo/events/`);
    await entry(nested, 'EVT-006');
    await context.setOffline(true);
    await nested.reload();
    await waitFor(nested, '1 / 6 presenti');
    await nested.getByRole('button', { name: 'Scansiona QR', exact: true }).click();
    await waitFor(nested, 'Check-in effettuato: Marco Bianchi');
    await nested.getByRole('button', { name: 'Chiudi scanner', exact: true }).click();
    await waitFor(nested, '2 / 6 presenti');
    await context.setOffline(false);
    await page.reload();
    await waitFor(page, '1 / 6 presenti');
    await nested.close();
  });
  await check('cache update: wait for user action, activate v2, preserve local data and unrelated caches', async () => {
    await page.evaluate(async () => {
      const cache = await caches.open('unrelated-app-cache');
      await cache.put('./unrelated.txt', new Response('keep'));
    });
    updatedWorker = true;
    await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));
    await page.locator('#update-app').waitFor({ state: 'visible' });
    assert.ok(await page.evaluate(() => caches.has('event-check-in:/:v1')));
    await page.getByRole('button', { name: 'Aggiorna app', exact: true }).click();
    await page.waitForFunction(async () => (await caches.keys()).includes('event-check-in:/:v2-test'));
    await waitFor(page, '1 / 6 presenti');
    const keys = await page.evaluate(() => caches.keys());
    assert.ok(!keys.includes('event-check-in:/:v1'));
    assert.ok(keys.includes('unrelated-app-cache'));
    assert.ok(keys.includes('event-check-in:/demo/events/:v1'));
    await context.setOffline(true);
    await page.reload();
    await waitFor(page, '1 / 6 presenti');
    await context.setOffline(false);
  });
  await check('failed cache installation: missing resource keeps previous version active/offline usable', async () => {
    // Reverse the test worker version, but fail one precache response.
    updatedWorker = false; rejectUpdate = true;
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration.update();
      const worker = registration.installing;
      if (worker) await new Promise((resolve) => worker.addEventListener('statechange', () => { if (worker.state === 'redundant') resolve(); }));
    });
    assert.ok(await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => !r.waiting)));
    await context.setOffline(true);
    await page.reload();
    await waitFor(page, '1 / 6 presenti');
    await context.setOffline(false);
    rejectUpdate = false;
  });
  assert.deepEqual(results.consoleErrors, []);
  results.requests = [...new Set(requests)];
  await context.close();
  await check('persistence: complete browser process restart with retained profile', async () => {
    const profile = resolve(root, '.test-build/browser-profile');
    const options = { channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true };
    let persistent = await chromium.launchPersistentContext(profile, options);
    let p = await persistent.newPage();
    await ready(p);
    const cdp = await persistent.newCDPSession(p);
    const installability = await cdp.send('Page.getInstallabilityErrors');
    results.persistentProfileInstallability = installability;
    assert.deepEqual(installability.installabilityErrors, []);
    await cdp.detach();
    await reset(p);
    await entry(p, 'EVT-004');
    await waitFor(p, '1 / 6 presenti');
    await persistent.close();
    persistent = await chromium.launchPersistentContext(profile, options);
    p = await persistent.newPage();
    await ready(p);
    await waitFor(p, '1 / 6 presenti');
    assert.equal(await p.locator('[data-id="EVT-004"] .badge').textContent(), '✓ Presente');
    await persistent.close();
  });
} catch (error) {
  process.exitCode = 1;
  if (!results.failures.length) results.failures.push({ name: 'setup or ungrouped assertion', error: error.stack });
  process.stderr.write(`${error.stack}\n`);
} finally {
  await browser?.close();
  await new Promise((done) => server.close(done));
  await writeFile(resolve(output, 'browser-results.json'), `${JSON.stringify(results, null, 2)}\n`);
}
