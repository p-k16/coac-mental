// Sauvegarde / restauration JSON de toute la base.
import * as db from './store.js';
import { DB_VERSION } from './migrations.js';
import { VERSION } from '../version.js';

export const STORES = ['meta', 'profile', 'checkins', 'tournaments', 'matches', 'experiments',
  'hypotheses', 'conversations', 'reviews', 'nameDict', 'llmUsage', 'routineLog'];

// Jamais exportées : les clés API restent sur l'appareil.
const SECRET_KEYS = ['apiKeys'];

export async function buildExport() {
  const stores = {};
  for (const s of STORES) stores[s] = await db.getAll(s);
  stores.meta = stores.meta
    .filter((m) => m.key !== 'diagTest')
    .map((m) => {
      if (m.key !== 'settings' || !m.value) return m;
      const v = { ...m.value };
      SECRET_KEYS.forEach((k) => delete v[k]);
      return { ...m, value: v };
    });
  const data = { app: 'coachbad', appVersion: VERSION, schemaVersion: DB_VERSION, exportedAt: new Date().toISOString(), stores };
  const json = JSON.stringify(data);
  const d = new Date();
  const name = `coach-sauvegarde-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
  return { json, name, counts: Object.fromEntries(STORES.map((s) => [s, stores[s].length])) };
}

export async function markExported() {
  await db.put('meta', { key: 'lastExportAt', value: new Date().toISOString() });
}

export async function lastExportAt() {
  const r = await db.get('meta', 'lastExportAt');
  return r ? r.value : null;
}

// Vérifie le fichier sans rien écrire. Renvoie les comptes par store.
export function parseImport(text) {
  let data;
  try { data = JSON.parse(text); } catch (e) { throw new Error('Fichier illisible (JSON invalide)'); }
  if (!data || data.app !== 'coachbad' || typeof data.stores !== 'object') throw new Error('Ce fichier n’est pas une sauvegarde Coach');
  if (data.schemaVersion > DB_VERSION) throw new Error('Sauvegarde créée par une version plus récente : mets l’app à jour');
  for (const s of Object.keys(data.stores)) {
    if (!STORES.includes(s)) throw new Error(`Contenu inconnu : ${s}`);
    if (!Array.isArray(data.stores[s])) throw new Error(`Contenu invalide : ${s}`);
  }
  return { data, counts: Object.fromEntries(STORES.map((s) => [s, (data.stores[s] || []).length])) };
}

// Remplace tout le contenu par celui de la sauvegarde (les clés API locales sont conservées).
export async function applyImport(data) {
  const current = await db.get('meta', 'settings');
  const keep = {};
  if (current && current.value) SECRET_KEYS.forEach((k) => { if (current.value[k]) keep[k] = current.value[k]; });
  // Une seule transaction sur tous les stores : tout ou rien.
  const idb = await db.openDB();
  await new Promise((resolve, reject) => {
    const tx = idb.transaction(STORES, 'readwrite');
    for (const s of STORES) {
      const st = tx.objectStore(s);
      st.clear();
      for (const rec of data.stores[s] || []) {
        st.put(s === 'meta' && rec.key === 'settings' ? { ...rec, value: { ...(rec.value || {}), ...keep } } : rec);
      }
    }
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Import annulé'));
  });
}
