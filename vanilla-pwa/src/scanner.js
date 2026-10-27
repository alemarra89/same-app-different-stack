import '../vendor/jsQR.js';

export const decodeQR = (image) => globalThis.jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' });

export function cameraErrorMessage(error) {
  switch (error.name) {
    case 'NotAllowedError': case 'SecurityError':
      return 'Accesso alla fotocamera negato. Abilitalo nelle impostazioni del browser e riprova, oppure inserisci il codice.';
    case 'NotFoundError': case 'DevicesNotFoundError':
      return 'Nessuna fotocamera disponibile. Puoi inserire il codice del partecipante.';
    case 'NotReadableError': case 'TrackStartError':
      return 'Fotocamera occupata o non disponibile. Chiudi le altre app che la usano e riprova.';
    default: return 'Impossibile avviare lo scanner. Riprova oppure inserisci il codice del partecipante.';
  }
}

export function createScanner({ video, onCode, onStatus }) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  let stream = null;
  let timer = null;
  let generation = 0;

  function stop() {
    generation += 1;
    clearTimeout(timer);
    timer = null;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    stream = null;
    video.pause();
    video.srcObject = null;
  }

  async function start() {
    stop();
    const run = generation;
    if (!globalThis.isSecureContext) {
      onStatus('La fotocamera richiede HTTPS oppure localhost. Usa un indirizzo sicuro o inserisci il codice.', true);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !context) {
      onStatus('Fotocamera non supportata da questo browser. Inserisci il codice del partecipante.', true);
      return;
    }
    onStatus('Consenti l’accesso alla fotocamera per scansionare il QR.');
    let acquired = null;
    try {
      acquired = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      // A permission prompt may resolve after the user closed or reopened the scanner.
      if (run !== generation) { acquired.getTracks().forEach((track) => track.stop()); return; }
      stream = acquired;
      video.srcObject = stream;
      await video.play();
      if (run !== generation) return;
      for (const track of stream.getVideoTracks()) {
        track.addEventListener('ended', () => {
          if (run !== generation) return;
          stop();
          onStatus('La fotocamera è stata disconnessa. Riprova oppure inserisci il codice.', true);
        }, { once: true });
      }
      onStatus('Inquadra il QR del partecipante. La lettura è automatica.');
      function readFrame() {
        if (run !== generation) return;
        try {
          if (video.readyState >= 2 && video.videoWidth) {
            const scale = Math.min(1, 800 / video.videoWidth);
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const result = decodeQR(context.getImageData(0, 0, canvas.width, canvas.height));
            if (result) onCode(result.data);
          }
          if (run === generation) timer = setTimeout(readFrame, 140);
        } catch {
          stop();
          onStatus('Lettura della fotocamera interrotta. Riprova oppure inserisci il codice.', true);
        }
      }
      readFrame();
    } catch (error) {
      acquired?.getTracks().forEach((track) => track.stop());
      if (run !== generation) return;
      stop();
      onStatus(cameraErrorMessage(error), true);
    }
  }
  return { start, stop };
}
