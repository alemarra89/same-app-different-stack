import { expect, test } from '@playwright/test';

test('acceptance 1–6: manual, duplicate, invalid, persistence and reset', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByTestId('attendance')).toHaveText('0 / 6 presenti');
  const code = page.getByLabel('Codice partecipante', { exact: true });
  await expect(code).toBeEnabled();
  await code.fill(' EVT-001 ');
  await page.getByRole('button', { name: 'Conferma check-in' }).click();
  await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
  await expect(page.getByTestId('EVT-001')).toContainText('Presente');
  await expect(page.getByTestId('notice')).toContainText('Check-in effettuato: Giulia Rossi');
  await page.getByRole('button', { name: 'Conferma check-in' }).click();
  await expect(page.getByTestId('notice')).toContainText('Check-in già effettuato');
  await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
  await code.fill('ERR-999');
  await page.getByRole('button', { name: 'Conferma check-in' }).click();
  await expect(page.getByTestId('notice')).toContainText('QR non valido');
  await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
  await page.reload();
  await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
  await expect(page.getByTestId('EVT-001')).toContainText('Presente');
  await page.getByRole('button', { name: 'Reimposta demo' }).click();
  await page.getByRole('button', { name: 'Annulla', exact: true }).click();
  await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
  await page.getByRole('button', { name: 'Reimposta demo' }).click();
  await page.getByRole('button', { name: 'Reimposta', exact: true }).click();
  await expect(page.getByTestId('attendance')).toHaveText('0 / 6 presenti');
  await page.reload();
  await expect(page.getByTestId('attendance')).toHaveText('0 / 6 presenti');
  expect(errors).toEqual([]);
});
test('search and Web scanner fallback keep manual entry available', async ({ page }) => {
  await page.goto('/');
  const search = page.getByRole('searchbox', { name: 'Cerca per nome o ID' });
  await search.fill('sara');
  await expect(page.getByTestId('EVT-003')).toBeVisible();
  await expect(page.getByTestId('EVT-001')).toHaveCount(0);
  await search.fill('EVT-002');
  await expect(page.getByTestId('EVT-002')).toBeVisible();
  await search.fill('nessuno');
  await expect(page.getByText('Nessun partecipante trovato.')).toBeVisible();
  await search.fill('');
  await page.getByRole('button', { name: 'Scansiona QR', exact: true }).click();
  await expect(page.getByTestId('notice')).toContainText('Scanner non disponibile');
  // Ionic temporarily clones the input while scrolling it above a mobile keyboard.
  await expect(page.locator('input.cloned-input')).toHaveCount(0);
  await page.getByLabel('Codice partecipante', { exact: true }).fill('EVT-002');
  await page.getByRole('button', { name: 'Conferma check-in' }).click();
  await expect(page.getByTestId('EVT-002')).toContainText('Presente');
  await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
});
test('storage failure does not acknowledge a check-in', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('Storage unavailable'); }; });
  await page.goto('/');
  await page.getByLabel('Codice partecipante', { exact: true }).fill('EVT-001');
  await page.getByRole('button', { name: 'Conferma check-in' }).click();
  await expect(page.getByTestId('notice')).toContainText('Salvataggio non riuscito');
  await expect(page.getByTestId('attendance')).toHaveText('0 / 6 presenti');
  await expect(page.getByTestId('EVT-001')).toContainText('In attesa');
});
test('layout fits screen and captures initial appearance', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByLabel('Codice partecipante', { exact: true })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('event-check-in.png'), fullPage: true });
  await page.getByTestId('EVT-006').scrollIntoViewIfNeeded();
  await page.screenshot({ path: testInfo.outputPath('participants.png') });
});

test('keyboard submission and recovery from corrupted local state', async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('corrupt-once')) {
      localStorage.setItem('CapacitorStorage.event-check-in.tech-meetup-2026.v1', '{}');
      sessionStorage.setItem('corrupt-once', 'yes');
    }
  });
  await page.goto('/');
  await expect(page.getByTestId('notice')).toContainText('Impossibile leggere');
  await expect(page.getByLabel('Codice partecipante', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Reimposta demo' }).click();
  await page.getByRole('button', { name: 'Reimposta', exact: true }).click();
  const code = page.getByLabel('Codice partecipante', { exact: true });
  await expect(code).toBeEnabled();
  await code.fill('EVT-006');
  await expect(page.locator('input.cloned-input')).toHaveCount(0);
  await code.press('Enter');
  await expect(page.getByTestId('attendance')).toHaveText('1 / 6 presenti');
});
