// État en mémoire, chargé une fois au démarrage pour que la routine s'affiche
// sans attendre IndexedDB.
import * as db from './db/store.js';
import { DEFAULT_SETTINGS, DEFAULT_ROUTINE } from './db/defaults.js';

export const state = {
  settings: structuredClone(DEFAULT_SETTINGS),
  routine: structuredClone(DEFAULT_ROUTINE),
  dbOk: false
};

function mergeRoutine(r) {
  const d = structuredClone(DEFAULT_ROUTINE);
  return {
    breath: { ...d.breath, ...(r.breath || {}) },
    release: { ...d.release, ...(r.release || {}) },
    focusCue: { ...d.focusCue, ...(r.focusCue || {}) },
    keyPhrase: { ...d.keyPhrase, ...(r.keyPhrase || {}) }
  };
}

export async function initState() {
  const load = (async () => {
    const s = await db.get('meta', 'settings');
    const p = await db.get('profile', 'main');
    if (s && s.value) state.settings = { ...DEFAULT_SETTINGS, ...s.value };
    if (p && p.routine30s) state.routine = mergeRoutine(p.routine30s);
    state.dbOk = true;
  })().catch((e) => console.error('Lecture IndexedDB', e));

  // iOS bloque parfois l'ouverture d'IndexedDB : on ne fait jamais attendre l'app.
  await Promise.race([
    load,
    new Promise((r) => setTimeout(() => {
      if (!state.dbOk) console.warn('IndexedDB lente : valeurs par défaut utilisées');
      r();
    }, 1500))
  ]);
}

export async function saveSettings(s) {
  state.settings = s;
  await db.put('meta', { key: 'settings', value: s });
}

export async function saveRoutine(r) {
  state.routine = r;
  const now = new Date().toISOString();
  const p = (await db.get('profile', 'main')) || { id: 'main', createdAt: now, isDemo: false, history: [] };
  p.routine30s = r;
  p.updatedAt = now;
  await db.put('profile', p);
}

export function logRoutine(entry) {
  return db.put('routineLog', {
    id: db.uuid(),
    at: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    isDemo: false,
    ...entry
  }).catch((e) => console.error('Journal routine', e));
}
