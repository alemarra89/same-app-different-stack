import { createController } from './controller.js';
import { createRepository } from './storage.js';
import { createScanner } from './scanner.js';
import { createUI } from './ui.js';
import { registerOfflineSupport } from './pwa.js';

const ui = createUI();
const el = ui.elements;
const controller = createController(createRepository(), ui.render);
const scanner = createScanner({
  video: el.video,
  onCode: (code) => controller.checkIn(code, 'scanner'),
  onStatus: (message, error = false) => {
    el['scanner-status'].textContent = message;
    el['scanner-status'].classList.toggle('error-text', error);
    el['retry-camera'].hidden = !error;
  },
});

function closeScanner() {
  scanner.stop();
  el.scanner.hidden = true;
  el['open-scanner'].setAttribute('aria-expanded', 'false');
  el['open-scanner'].textContent = 'Scansiona QR';
}

el['open-scanner'].addEventListener('click', () => {
  if (!el.scanner.hidden) { closeScanner(); return; }
  el.scanner.hidden = false;
  el['open-scanner'].setAttribute('aria-expanded', 'true');
  el['open-scanner'].textContent = 'Chiudi scanner';
  void scanner.start();
});
el['retry-camera'].addEventListener('click', () => { void scanner.start(); });
el['check-in-form'].addEventListener('submit', (event) => {
  event.preventDefault();
  controller.checkIn(el.code.value);
});
el.code.addEventListener('input', () => { el.submit.disabled = !controller.state.ready || !el.code.value.trim(); });
el.search.addEventListener('input', () => ui.renderParticipants(controller.state.participants));
el.retry.addEventListener('click', () => controller.load());
el['open-reset'].addEventListener('click', () => { closeScanner(); el['reset-dialog'].showModal(); });
el['cancel-reset'].addEventListener('click', () => el['reset-dialog'].close());
el['confirm-reset'].addEventListener('click', () => {
  if (controller.reset()) {
    el.search.value = '';
    el.code.value = '';
    ui.render(controller.state);
    el['reset-dialog'].close();
  } else el['reset-error'].textContent = controller.state.feedback.message;
});
el['reset-dialog'].addEventListener('close', () => { el['reset-error'].textContent = ''; });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !el.scanner.hidden) closeScanner();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) closeScanner(); });
window.addEventListener('pagehide', closeScanner);
// Re-read local state after history restoration or a second tab changed this origin's data.
window.addEventListener('pageshow', () => controller.load());
window.addEventListener('storage', () => controller.load());
controller.load();
void registerOfflineSupport({ status: el['offline-status'], updateButton: el['update-app'], beforeReload: closeScanner });
