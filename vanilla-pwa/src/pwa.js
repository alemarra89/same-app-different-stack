export async function registerOfflineSupport({ status, updateButton, beforeReload }) {
  if (!('serviceWorker' in navigator) || !globalThis.isSecureContext) {
    status.textContent = 'Per l’uso offline apri l’app tramite HTTPS o localhost.';
    return;
  }
  let controlled = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (controlled) { beforeReload(); location.reload(); }
    controlled = true;
  });
  try {
    const registration = await navigator.serviceWorker.register(new URL('../sw.js', import.meta.url), { updateViaCache: 'none' });
    function offerUpdate() {
      if (registration.waiting && navigator.serviceWorker.controller) updateButton.hidden = false;
    }
    offerUpdate();
    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      installing?.addEventListener('statechange', () => {
        if (installing.state === 'installed') offerUpdate();
      });
    });
    updateButton.addEventListener('click', () => {
      updateButton.disabled = true;
      registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    });
    await navigator.serviceWorker.ready;
    const showStatus = () => {
      status.textContent = navigator.onLine ? 'Pronta anche senza connessione' : 'Sei offline · Puoi continuare a registrare ingressi';
    };
    showStatus();
    window.addEventListener('online', showStatus);
    window.addEventListener('offline', showStatus);
  } catch {
    status.textContent = 'Disponibilità offline non confermata. Riapri l’app con connessione e riprova.';
  }
}
