import { h } from '../ui.js';
import * as metrics from '../core/metrics.js';
import * as sw from '../sw-client.js';
import * as repo from '../db/repo.js';
import { lastExportAt } from '../db/export.js';
import { today, addDays, diffDays, fmtFr, toISODate } from '../core/dates.js';

export function urgenceButton() {
  return h('button', {
    class: 'btn btn-urgence',
    onclick: () => { metrics.markTap(); location.hash = '#/routine'; }
  }, h('strong', null, 'URGENCE'), h('span', null, 'routine 30 s'));
}

const METRICS = [['stress', 'Stress', true], ['energy', 'Énergie', false], ['tension', 'Tension', true], ['mood', 'Humeur', false]];

export function render(root) {
  const updateBanner = h('div', { class: 'banner hidden' },
    h('span', null, 'Nouvelle version disponible.'),
    h('button', { class: 'btn btn-small', onclick: () => sw.applyUpdate() }, 'Mettre à jour'));
  const showUpdate = (on) => updateBanner.classList.toggle('hidden', !on);
  showUpdate(sw.updateAvailable());
  const off = sw.onUpdate(showUpdate);

  const backupBanner = h('a', { class: 'banner hidden', href: '#/sauvegarde' },
    h('span', null, 'Sauvegarde hebdomadaire à faire.'), h('strong', null, 'Sauvegarder ›'));
  const today_ = h('section', { class: 'card today' }, h('p', { class: 'muted' }, '…'));
  const next = h('a', { class: 'card next hidden', href: '#/tournois' });

  root.append(h('main', { class: 'screen home' },
    updateBanner, backupBanner,
    h('h1', { class: 'title' }, 'Coach mental'),
    urgenceButton(),
    today_,
    next,
    h('div', { class: 'row2' },
      h('a', { class: 'btn btn-primary', href: '#/match' }, 'Mode match'),
      h('a', { class: 'btn', href: '#/journal' }, 'Journal')),
    h('nav', { class: 'grid' },
      h('a', { class: 'tile', href: '#/tournois' }, 'Tournois'),
      h('a', { class: 'tile', href: '#/sauvegarde' }, 'Sauvegarde'),
      h('span', { class: 'tile disabled' }, 'Dashboard', h('small', null, 'étape 3')),
      h('span', { class: 'tile disabled' }, 'Coach', h('small', null, 'étape 5')),
      h('a', { class: 'tile', href: '#/reglages' }, 'Réglages'),
      h('a', { class: 'tile', href: '#/diag' }, 'Diagnostic'))
  ));

  fill(today_, next, backupBanner).catch((e) => console.error('Accueil', e));
  return off;
}

async function fill(todayEl, nextEl, backupBanner) {
  const [checkins, nextT, lastExp, matches] = await Promise.all([
    repo.allCheckins(), repo.nextTournament(), lastExportAt(), repo.allMatches()
  ]);
  const t = today();
  const cur = checkins.find((c) => c.date === t);
  const s = repo.streak(checkins.map((c) => c.date));

  todayEl.textContent = '';
  if (!cur) {
    todayEl.append(
      h('div', { class: 'today-head' }, h('strong', null, 'Check-in du jour'), h('span', { class: 'muted small' }, `Série : ${s} j`)),
      h('a', { class: 'btn btn-primary', href: '#/checkin' }, 'Faire mon check-in (2 min)'));
  } else {
    // Écart à la moyenne des 28 jours précédents (hors aujourd'hui), si ≥ 7 points.
    const from = addDays(t, -28);
    const past = checkins.filter((c) => c.date >= from && c.date < t);
    const rows = METRICS.map(([k, label, highIsBad]) => {
      const vals = past.map((c) => c[k]).filter((v) => typeof v === 'number');
      let delta = null;
      if (vals.length >= 7) delta = cur[k] - vals.reduce((a, b) => a + b, 0) / vals.length;
      const cls = delta === null || Math.abs(delta) < 1.5 ? '' : (delta > 0) === highIsBad ? 'bad' : 'good';
      return h('div', { class: 'metric ' + cls },
        h('span', { class: 'muted small' }, label),
        h('strong', null, String(cur[k])),
        h('span', { class: 'small' }, delta === null ? '' : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`));
    });
    todayEl.append(
      h('div', { class: 'today-head' }, h('strong', null, 'Aujourd’hui'),
        h('span', { class: 'muted small' }, `Série : ${s} j`)),
      h('div', { class: 'metrics' }, rows),
      h('p', { class: 'muted small' }, past.length >= 7
        ? 'Écart à ta moyenne des 28 derniers jours.'
        : `Comparaison à ta moyenne disponible après 7 check-ins (${past.length}/7).`),
      h('a', { class: 'link small', href: '#/checkin' }, 'Modifier le check-in ›'));
  }

  if (nextT) {
    const d = diffDays(nextT.start, t);
    nextEl.classList.remove('hidden');
    nextEl.append(
      h('div', null, h('strong', null, nextT.name), h('div', { class: 'muted small' }, fmtFr(nextT.start))),
      h('span', { class: 'countdown' }, d > 0 ? `J-${d}` : 'En cours'));
  }

  const hasData = checkins.length + matches.length > 0;
  const stale = !lastExp || diffDays(t, toISODate(new Date(lastExp))) >= 7;
  backupBanner.classList.toggle('hidden', !(hasData && stale));
}
