// Enregistrement du service worker et bannière de mise à jour.
let waitingWorker = null;
const listeners = new Set();

export function updateAvailable() { return !!waitingWorker; }
export function onUpdate(f) { listeners.add(f); return () => listeners.delete(f); }
function notify() { listeners.forEach((f) => f(!!waitingWorker)); }

export function applyUpdate() {
  if (waitingWorker) waitingWorker.postMessage('skipWaiting');
}

export async function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service worker non supporté : pas de mode hors ligne');
    return;
  }
  try {
    const reg = await navigator.serviceWorker.register('sw.js');
    const track = (w) => {
      if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) {
          waitingWorker = w;
          notify();
        }
      });
    };
    if (reg.waiting && navigator.serviceWorker.controller) { waitingWorker = reg.waiting; notify(); }
    reg.addEventListener('updatefound', () => track(reg.installing));

    // Recharger seulement lors d'une mise à jour, pas à la toute première installation.
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded || !hadController) return;
      reloaded = true;
      location.reload();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) reg.update().catch(() => {});
    });
  } catch (e) {
    console.error('Enregistrement du service worker', e);
  }
}
