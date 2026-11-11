// Installazione sul dispositivo e aggiornamento automatico (le variabili updatePending e installEvt sono in app.js)
const hadController = 'serviceWorker' in navigator && !!navigator.serviceWorker.controller;
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update(); });
    }).catch(() => {});
  });
  // nuova versione: ricarica subito se sei nel menu, altrimenti appena ci torni
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return;
    updatePending = true;
    if (mode === null && DB.length) location.reload();
  });
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (mode === null && DB.length) home(); });
window.addEventListener('appinstalled', () => { installEvt = null; if (mode === null && DB.length) home(); });
function installApp() { if (installEvt) { installEvt.prompt(); installEvt = null; } }
