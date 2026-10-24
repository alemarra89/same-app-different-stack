// Tests the installed debug APK through its actual WebView and native Preferences.
// No scanner or storage mocks; real QR capture requires the user and camera.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

const output = path.dirname(fileURLToPath(import.meta.url));
const serial = process.env.ANDROID_SERIAL;
if (!serial || !process.env.ANDROID_HOME) throw new Error('Set ANDROID_SERIAL and ANDROID_HOME.');
const run = promisify(execFile);
const adbPath = path.join(process.env.ANDROID_HOME, 'platform-tools', 'adb.exe');
const appId = 'it.demo.eventcheckin.ionic';
const port = '19223';
const mode = process.argv[2] || 'manual';
if (!['manual', 'open-scanner', 'scanned', 'restored'].includes(mode)) throw new Error('Unknown mode');
const adb = async (...args) => (await run(adbPath, ['-s', serial, ...args])).stdout.trim();
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const save = (name, value) => writeFile(path.join(output, name), typeof value === 'string' || Buffer.isBuffer(value) ? value : JSON.stringify(value, null, 2));
async function connect() {
  await adb('shell', 'am', 'start', '-W', '-n', `${appId}/.MainActivity`);
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const pid = (await adb('shell', 'pidof', appId)).split(' ')[0];
      await adb('forward', `tcp:${port}`, `localabstract:webview_devtools_remote_${pid}`);
      const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 2000 });
      const page = browser.contexts()[0]?.pages()[0];
      if (page) {
        await expect(page.getByRole('button', { name: 'Reimposta demo' })).toBeEnabled();
        return { browser, page };
      }
      await browser.close();
    } catch (error) { if (attempt === 29) throw error; }
    await sleep(1000);
  }
  throw new Error('WebView unavailable');
}
async function capture(stage, page) {
  const state = {
    stage,
    pid: await adb('shell', 'pidof', appId),
    attendance: await page.getByTestId('attendance').innerText(),
    notice: await page.getByTestId('notice').innerText(),
    participants: await page.locator('.participant-row').allTextContents(),
    native: await page.evaluate(() => window.Capacitor.isNativePlatform()),
  };
  const prefs = await adb('shell', 'run-as', appId, 'cat', 'shared_prefs/CapacitorStorage.xml').catch(() => '');
  await save(`${stage}-preferences.xml`, prefs);
  await save(`${stage}-state.json`, state);
  const screenshot = await run(adbPath, ['-s', serial, 'exec-out', 'screencap', '-p'], { encoding: 'buffer', maxBuffer: 12 * 1024 * 1024 });
  await save(`${stage}.png`, screenshot.stdout);
  console.log(JSON.stringify(state));
  return state;
}
let connection;
try {
  let restart;
  if (mode === 'restored') {
    const before = await adb('shell', 'pidof', appId);
    await adb('shell', 'am', 'force-stop', appId);
    const absent = await adb('shell', 'pidof', appId).catch(() => '');
    expect(absent).toBe('');
    restart = { before_pid: before, pid_after_stop: null };
  }
  connection = await connect();
  let page = connection.page;
  if (mode === 'manual') {
    const reset = async () => {
      await page.getByRole('button', { name: 'Reimposta demo' }).click();
      await page.getByRole('button', { name: 'Reimposta', exact: true }).click();
      await expect(page.getByTestId('attendance')).toHaveText('0 / 6 presenti');
    };
    await reset();
    await capture('initial', page);
    const code = page.getByLabel('Codice partecipante', { exact: true }).and(page.locator('input:not(.cloned-input)'));
    await code.fill(' EVT-001 ');
    await page.getByRole('button', { name: 'Conferma check-in' }).click();
    await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
    await expect(page.getByTestId('EVT-001')).toContainText('Presente');
    await capture('manual-valid', page);
    await page.getByRole('button', { name: 'Conferma check-in' }).click();
    await expect(page.getByTestId('notice')).toContainText('Check-in già effettuato');
    await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
    await capture('manual-duplicate', page);
    await code.fill('ERR-999');
    await page.getByRole('button', { name: 'Conferma check-in' }).click();
    await expect(page.getByTestId('notice')).toContainText('QR non valido');
    await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
    await capture('manual-invalid', page);
    await page.getByRole('button', { name: 'Reimposta demo' }).click();
    await page.getByRole('button', { name: 'Annulla', exact: true }).click();
    await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
    await connection.browser.close();
    connection = undefined;
    await adb('shell', 'am', 'force-stop', appId);
    connection = await connect();
    page = connection.page;
    await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
    await expect(page.getByTestId('EVT-001')).toContainText('Presente');
    await capture('manual-restored', page);
    await reset();
    await save('native-manual-results.json', { passed: true, cases: ['trim', 'valid', 'duplicate', 'invalid', 'cancel reset', 'force-stop persistence', 'confirmed reset'], mocks: false });
    console.log('PASS: native manual checks and process restart persistence; reset to 0/6 for real QR.');
  } else if (mode === 'open-scanner') {
    await page.getByRole('button', { name: 'Scansiona QR', exact: true }).click();
    console.log('Scanner requested. User must grant camera permission and scan the real QR.');
  } else {
    await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
    await expect(page.getByTestId('EVT-002')).toContainText('Presente');
    const state = await capture(mode, page);
    const prefs = await readFile(path.join(output, `${mode}-preferences.xml`), 'utf8');
    expect(prefs).toContain('EVT-002');
    expect(prefs).not.toContain('EVT-001');
    if (restart) {
      restart.after_pid = state.pid;
      await save('process-restart.json', restart);
      const previous = await readFile(path.join(output, 'scanned-preferences.xml'), 'utf8');
      expect(prefs).toBe(previous);
    }
    console.log(`PASS: ${mode}, actual native Preferences contains EVT-002.`);
  }
} finally {
  await connection?.browser.close();
  await adb('forward', '--remove', `tcp:${port}`).catch(() => {});
}
