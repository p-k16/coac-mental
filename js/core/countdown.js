// Minuteur unique basé sur des horodatages : le temps restant est recalculé à
// partir de endAt, donc il reste exact même si iOS gèle le JS écran verrouillé
// ou tue l'app (l'état est conservé dans localStorage).
import { state } from '../state.js';
import * as wakelock from './wakelock.js';
import { beep } from './sound.js';

const KEY = 'cb_timer';
const WARN_SEC = 10;
const AUTO_CLEAR_MS = 5 * 60 * 1000;

let t = null; // { label, durationMs, endAt, warned, ended }
let interval = null;
const listeners = new Set();

function persist() {
  try {
    if (t) localStorage.setItem(KEY, JSON.stringify(t));
    else localStorage.removeItem(KEY);
  } catch (e) {}
}

function flash() {
  document.body.classList.remove('flash');
  void document.body.offsetWidth;
  document.body.classList.add('flash');
  setTimeout(() => document.body.classList.remove('flash'), 1600);
}

function tick() {
  if (!t) return;
  const now = Date.now();
  const remainingMs = t.endAt - now;
  if (!t.warned && remainingMs <= WARN_SEC * 1000 && remainingMs > 0) {
    t.warned = true;
    persist();
    if (state.settings.sound) beep({ freq: 660, ms: 120 });
  }
  if (!t.ended && remainingMs <= 0) {
    t.ended = true;
    persist();
    // Pas de bip si la fin date de plus de 3 s (retour de verrouillage).
    if (state.settings.sound && remainingMs > -3000) beep({ freq: 988, ms: 220, count: 3 });
    flash();
    wakelock.release('timer');
  }
  if (t.ended && now - t.endAt > AUTO_CLEAR_MS) { stop(); return; }
  listeners.forEach((f) => f(snapshot()));
}

function loop() {
  clearInterval(interval);
  interval = setInterval(tick, 200);
  tick();
}

export function start(label, sec) {
  t = { label, durationMs: sec * 1000, endAt: Date.now() + sec * 1000, warned: false, ended: false };
  persist();
  wakelock.acquire('timer');
  loop();
}

export function stop() {
  t = null;
  persist();
  clearInterval(interval);
  interval = null;
  wakelock.release('timer');
  listeners.forEach((f) => f(null));
}

export function snapshot() {
  if (!t) return null;
  const remainingMs = t.endAt - Date.now();
  return {
    label: t.label,
    durationMs: t.durationMs,
    remainingSec: Math.max(0, Math.ceil(remainingMs / 1000)),
    overtimeSec: remainingMs < 0 ? Math.floor(-remainingMs / 1000) : 0,
    progress: Math.min(1, Math.max(0, 1 - remainingMs / t.durationMs)),
    ended: t.ended
  };
}

export function subscribe(f) {
  listeners.add(f);
  f(snapshot());
  return () => listeners.delete(f);
}

// Restauration après fermeture de l'app.
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
  if (saved && typeof saved.endAt === 'number') {
    t = saved;
    if (!t.ended) wakelock.acquire('timer');
    loop();
  }
} catch (e) {}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') tick();
});
