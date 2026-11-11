// Installazione sul dispositivo e aggiornamento automatico
let updatePending = false, installEvt = null;
const hadController = 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      // controlla se ci sono novità ogni volta che l'app torna in primo piano
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update(); });
    }).catch(() => {});
  });
  // quando arriva una nuova versione: ricarica subito se sei nel menu, altrimenti appena ci torni
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return; // prima installazione: niente da ricaricare
    updatePending = true;
    if (mode === null) location.reload();
  });
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (mode === null) home(); });
window.addEventListener('appinstalled', () => { installEvt = null; if (mode === null) home(); });
function installApp() { if (installEvt) { installEvt.prompt(); installEvt = null; } }
