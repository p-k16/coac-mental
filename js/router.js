// Routeur par hash. Chaque écran exporte render(root) et peut renvoyer une
// fonction de nettoyage appelée en quittant l'écran.
import * as home from './screens/home.js';
import * as match from './screens/match.js';
import * as routine from './screens/routine.js';
import * as settings from './screens/settings.js';
import * as diag from './screens/diag.js';
import * as checkin from './screens/checkin.js';
import * as journal from './screens/journal.js';
import * as tournaments from './screens/tournaments.js';
import * as data from './screens/data.js';

const routes = {
  '': home,
  match,
  routine,
  reglages: settings,
  diag,
  checkin,
  journal,
  tournois: tournaments,
  sauvegarde: data
};

let cleanup = null;

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const i = raw.indexOf('?');
  return {
    path: i < 0 ? raw : raw.slice(0, i),
    params: new URLSearchParams(i < 0 ? '' : raw.slice(i + 1))
  };
}

function render(root) {
  if (typeof cleanup === 'function') {
    try { cleanup(); } catch (e) { console.error('Nettoyage écran', e); }
  }
  cleanup = null;
  const { path, params } = parseHash();
  const screen = routes[path] || home;
  root.textContent = '';
  try {
    cleanup = screen.render(root, params);
  } catch (e) {
    console.error('Rendu écran', e);
    root.textContent = 'Erreur d’affichage. Voir Diagnostic.';
  }
  window.scrollTo(0, 0);
}

export function startRouter(root) {
  window.addEventListener('hashchange', () => render(root));
  render(root);
}
