// Mesures de performance affichées dans Diagnostic (tests sans Mac).
const KEY = 'cb_metrics';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
}
function save(m) { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {} }

export function record(name, ms) {
  const m = load();
  const arr = m[name] || [];
  arr.push({ at: new Date().toISOString(), ms: Math.round(ms) });
  m[name] = arr.slice(-10);
  save(m);
}

export function all() { return load(); }
export function clearAll() { save({}); }

// Heure du tap sur un bouton d'urgence, lue par l'écran routine.
let pendingTap = null;
export function markTap() { pendingTap = performance.now(); }
export function takeTap() { const t = pendingTap; pendingTap = null; return t; }
