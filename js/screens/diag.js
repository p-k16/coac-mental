// Diagnostic : remplace l'inspecteur Safari (pas de Mac).
import { h, header, toast } from '../ui.js';
import { VERSION } from '../version.js';
import { state } from '../state.js';
import * as db from '../db/store.js';
import * as wakelock from '../core/wakelock.js';
import * as metrics from '../core/metrics.js';
import { audioState } from '../core/sound.js';

function row(k, v) {
  return h('div', { class: 'kv' }, h('span', null, k), h('strong', null, v));
}

async function collect() {
  const out = [];
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  out.push(['Version', VERSION]);
  out.push(['Lancée depuis l’écran d’accueil', standalone ? 'oui' : 'non (onglet Safari)']);
  out.push(['En ligne', navigator.onLine ? 'oui' : 'non']);
  out.push(['Service worker actif', navigator.serviceWorker && navigator.serviceWorker.controller ? 'oui' : 'non']);
  try {
    const keys = await caches.keys();
    out.push(['Caches', keys.join(', ') || '(aucun)']);
  } catch (e) { out.push(['Caches', 'erreur']); }
  try {
    const persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : null;
    out.push(['Stockage persistant', persisted === null ? 'API absente' : persisted ? 'oui' : 'non']);
    if (navigator.storage && navigator.storage.estimate) {
      const est = await navigator.storage.estimate();
      out.push(['Espace utilisé', `${(est.usage / 1024).toFixed(0)} Ko`]);
    }
  } catch (e) { out.push(['Stockage persistant', 'erreur']); }
  try {
    const t0 = performance.now();
    await db.put('meta', { key: 'diagTest', value: Date.now() });
    const back = await db.get('meta', 'diagTest');
    const n = await db.count('routineLog');
    out.push(['IndexedDB', back ? `OK (${Math.round(performance.now() - t0)} ms)` : 'lecture vide']);
    out.push(['Routines enregistrées', String(n)]);
  } catch (e) { out.push(['IndexedDB', `ERREUR ${e.name}`]); }
  out.push(['Réglages chargés depuis la base', state.dbOk ? 'oui' : 'non (valeurs par défaut)']);
  const wl = wakelock.status();
  out.push(['Wake Lock', !wl.supported ? 'non supporté' : wl.active ? 'actif' : wl.lastError ? `refusé : ${wl.lastError}` : 'supporté, inactif']);
  out.push(['Audio', audioState()]);
  out.push(['Écran', `${screen.width}×${screen.height} @${devicePixelRatio}x`]);
  out.push(['Navigateur', navigator.userAgent]);
  return out;
}

function fmtMetric(list) {
  if (!list || !list.length) return '—';
  const ms = list.map((x) => x.ms);
  return `dernier ${ms[ms.length - 1]} ms · max ${Math.max(...ms)} ms · n=${ms.length}`;
}

export function render(root) {
  const info = h('section', { class: 'card' }, h('p', { class: 'muted' }, 'Analyse…'));
  const m = metrics.all();
  const logs = (window.CB_LOG ? window.CB_LOG.get() : []).slice().reverse();
  const logText = logs.map((x) => `${x.t} [${x.l}] ${x.m}`).join('\n');

  root.append(h('main', { class: 'screen diag' },
    header('Diagnostic'),
    info,
    h('section', { class: 'card' },
      h('h2', null, 'Mesures'),
      row('Démarrage de l’app', fmtMetric(m.startup)),
      row('Tap urgence → routine affichée', fmtMetric(m.urgence)),
      h('button', { class: 'btn btn-ghost btn-small', onclick: () => { metrics.clearAll(); toast('Mesures effacées'); } }, 'Effacer les mesures')),
    h('section', { class: 'card' },
      h('h2', null, `Journal (${logs.length})`),
      h('pre', { class: 'log' }, logText || '(vide)'),
      h('div', { class: 'row2' },
        h('button', {
          class: 'btn btn-small',
          onclick: async () => {
            const lines = (await collect()).map(([k, v]) => `${k}: ${v}`).join('\n');
            try { await navigator.clipboard.writeText(`${lines}\n\n${logText}`); toast('Copié'); }
            catch (e) { toast('Copie impossible'); }
          }
        }, 'Copier tout'),
        h('button', {
          class: 'btn btn-ghost btn-small',
          onclick: () => { window.CB_LOG && window.CB_LOG.clear(); toast('Journal effacé'); location.reload(); }
        }, 'Effacer le journal')))
  ));

  collect().then((rows) => {
    info.textContent = '';
    info.append(h('h2', null, 'État'), ...rows.map(([k, v]) => row(k, v)));
  });
}
