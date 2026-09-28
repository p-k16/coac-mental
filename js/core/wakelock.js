// Garde l'écran allumé tant qu'au moins une raison est active
// ('timer', 'routine', 'match'). iOS relâche le verrou quand l'app passe en
// arrière-plan : on le redemande au retour.
const reasons = new Set();
let sentinel = null;
let lastError = null;
const listeners = new Set();

export const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

function notify() { listeners.forEach((f) => f(status())); }

async function ensure() {
  if (!supported) return;
  if (reasons.size > 0 && !sentinel && document.visibilityState === 'visible') {
    try {
      const s = await navigator.wakeLock.request('screen');
      if (reasons.size === 0) { await s.release(); return; }
      sentinel = s;
      lastError = null;
      s.addEventListener('release', () => { if (sentinel === s) sentinel = null; notify(); });
    } catch (e) {
      lastError = `${e.name}: ${e.message}`;
      console.warn('Wake Lock refusé', lastError);
    }
  } else if (reasons.size === 0 && sentinel) {
    const s = sentinel;
    sentinel = null;
    try { await s.release(); } catch (e) { /* déjà relâché */ }
  }
  notify();
}

export function acquire(reason) { reasons.add(reason); return ensure(); }
export function release(reason) { reasons.delete(reason); return ensure(); }
export function status() {
  return { supported, active: !!sentinel, reasons: [...reasons], lastError };
}
export function subscribe(f) { listeners.add(f); return () => listeners.delete(f); }

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') ensure();
});
