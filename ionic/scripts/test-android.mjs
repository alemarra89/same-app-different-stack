import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, expect } from '@playwright/test';

// Run only against a development emulator/device selected explicitly by serial.
// Uses the actual debug WebView and native Preferences plugin, not storage mocks.
const serial = process.env.ANDROID_SERIAL;
if (!serial) throw new Error('Set ANDROID_SERIAL to the development emulator/device to test.');
const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
if (!sdk) throw new Error('Set ANDROID_HOME to the installed Android SDK.');
const adbPath = path.join(sdk, 'platform-tools', process.platform === 'win32' ? 'adb.exe' : 'adb');
const run = promisify(execFile);
const adb = async (...args) => (await run(adbPath, ['-s', serial, ...args])).stdout.trim();
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const appId = 'it.demo.eventcheckin.ionic';
const port = '19223';
await mkdir('docs/screenshots', { recursive: true });
const screenshot = async (name) => {
  const { stdout } = await run(adbPath, ['-s', serial, 'exec-out', 'screencap', '-p'], { encoding: 'buffer', maxBuffer: 10 * 1024 * 1024 });
  await writeFile(`docs/screenshots/${name}.png`, stdout);
};

for (let attempt = 0; attempt < 60; attempt++) {
  if (await adb('shell', 'getprop', 'sys.boot_completed') === '1') break;
  if (attempt === 59) throw new Error('Emulator did not boot.');
  await pause(1000);
}
console.log(await adb('install', '-r', path.resolve('android/app/build/outputs/apk/debug/app-debug.apk')));
await adb('shell', 'input', 'keyevent', 'KEYCODE_WAKEUP');
await adb('shell', 'wm', 'dismiss-keyguard');

async function openApp() {
  await adb('shell', 'am', 'start', '-n', `${appId}/.MainActivity`);
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const pid = (await adb('shell', 'pidof', appId)).split(' ')[0];
      await adb('forward', `tcp:${port}`, `localabstract:webview_devtools_remote_${pid}`);
      const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 2000 });
      const page = browser.contexts()[0]?.pages()[0];
      if (!page) { await browser.close(); throw new Error('WebView not ready'); }
      await expect(page.getByRole('button', { name: 'Reimposta demo' })).toBeEnabled();
      return { browser, page };
    } catch (error) {
      if (attempt === 29) throw error;
      await pause(1000);
    }
  }
  throw new Error('No debug WebView');
}

let connection;
try {
  connection = await openApp();
  let page = connection.page;
  const reset = async () => {
    await page.getByRole('button', { name: 'Reimposta demo' }).click();
    await page.getByRole('button', { name: 'Reimposta', exact: true }).click();
    await expect(page.getByTestId('attendance')).toHaveText('0 / 6 presenti');
  };
  await reset();
  await page.getByRole('button', { name: 'Chiudi', exact: true }).click();
  await page.locator('ion-content').evaluate((el) => el.scrollToTop(0));
  await screenshot('android-initial');
  const code = page.getByLabel('Codice partecipante', { exact: true }).and(page.locator('input:not(.cloned-input)'));
  await code.fill(' EVT-001 ');
  await page.getByRole('button', { name: 'Conferma check-in' }).click();
  await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
  await expect(page.getByTestId('EVT-001')).toContainText('Presente');
  await page.getByRole('button', { name: 'Conferma check-in' }).click();
  await expect(page.getByTestId('notice')).toContainText('Check-in già effettuato');
  await code.fill('ERR-999');
  await page.getByRole('button', { name: 'Conferma check-in' }).click();
  await expect(page.getByTestId('notice')).toContainText('QR non valido');
  await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
  await connection.browser.close();
  connection = undefined;
  await adb('shell', 'am', 'force-stop', appId);
  connection = await openApp();
  page = connection.page;
  await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
  await expect(page.getByTestId('EVT-001')).toContainText('Presente');
  await page.getByTestId('EVT-001').scrollIntoViewIfNeeded();
  await screenshot('android-restored');
  await reset();
  await adb('shell', 'pm', 'revoke', appId, 'android.permission.CAMERA');
  await adb('shell', 'pm', 'set-permission-flags', appId, 'android.permission.CAMERA', 'user-set', 'user-fixed');
  await page.getByRole('button', { name: 'Scansiona QR', exact: true }).click();
  await expect(page.getByTestId('notice')).toContainText('Permesso fotocamera negato', { timeout: 15000 });
  const manualAfterDenial = page.getByLabel('Codice partecipante', { exact: true }).and(page.locator('input:not(.cloned-input)'));
  await manualAfterDenial.fill('EVT-002');
  await page.getByRole('button', { name: 'Conferma check-in' }).click();
  await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
  await expect(page.getByTestId('EVT-002')).toContainText('Presente');
  await reset();
  if (process.env.ANDROID_TEST_NO_CAMERA === '1') {
    await adb('shell', 'pm', 'clear-permission-flags', appId, 'android.permission.CAMERA', 'user-set', 'user-fixed');
    await adb('shell', 'pm', 'grant', appId, 'android.permission.CAMERA');
    await page.getByRole('button', { name: 'Scansiona QR', exact: true }).click();
    await expect(page.getByTestId('notice')).toContainText('Fotocamera non disponibile');
    await manualAfterDenial.fill('EVT-003');
    await page.getByRole('button', { name: 'Conferma check-in' }).click();
    await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
    await reset();
    console.log('PASS Android missing camera hardware + manual fallback.');
  }
  console.log('PASS Android native: manual valid/duplicate/unknown/trim, force-stop + reopen persistence, confirmed reset, camera permission denied + manual fallback.');
  console.log('Device: ' + await adb('shell', 'getprop', 'ro.build.version.release') + ', API ' + await adb('shell', 'getprop', 'ro.build.version.sdk'));
} finally {
  await connection?.browser.close();
  await adb('shell', 'pm', 'clear-permission-flags', appId, 'android.permission.CAMERA', 'user-set', 'user-fixed').catch(() => {});
  await adb('forward', '--remove', `tcp:${port}`).catch(() => {});
  await adb('shell', 'am', 'force-stop', appId);
}
