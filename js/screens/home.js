import { h } from '../ui.js';
import * as metrics from '../core/metrics.js';
import * as sw from '../sw-client.js';

export function urgenceButton() {
  return h('button', {
    class: 'btn btn-urgence',
    onclick: () => { metrics.markTap(); location.hash = '#/routine'; }
  }, h('strong', null, 'URGENCE'), h('span', null, 'routine 30\u00a0s'));
}

export function render(root) {
  const banner = h('div', { class: 'banner hidden' },
    h('span', null, 'Nouvelle version disponible.'),
    h('button', { class: 'btn btn-small', onclick: () => sw.applyUpdate() }, 'Mettre à jour'));

  const showBanner = (on) => banner.classList.toggle('hidden', !on);
  showBanner(sw.updateAvailable());
  const off = sw.onUpdate(showBanner);

  root.append(h('main', { class: 'screen home' },
    banner,
    h('h1', { class: 'title' }, 'Coach mental'),
    urgenceButton(),
    h('a', { class: 'btn btn-primary', href: '#/match' }, 'Mode match'),
    h('nav', { class: 'grid' },
      h('span', { class: 'tile disabled' }, 'Check-in', h('small', null, 'étape 2')),
      h('span', { class: 'tile disabled' }, 'Journal', h('small', null, 'étape 2')),
      h('span', { class: 'tile disabled' }, 'Dashboard', h('small', null, 'étape 3')),
      h('span', { class: 'tile disabled' }, 'Coach', h('small', null, 'étape 5')),
      h('a', { class: 'tile', href: '#/reglages' }, 'Réglages'),
      h('a', { class: 'tile', href: '#/diag' }, 'Diagnostic'))
  ));
  return off;
}
