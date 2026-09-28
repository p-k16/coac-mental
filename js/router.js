// Routeur par hash. Chaque écran exporte render(root) et peut renvoyer une
// fonction de nettoyage appelée en quittant l'écran.
import * as home from './screens/home.js';
import * as match from './screens/match.js';
import * as routine from './screens/routine.js';
import * as settings from './screens/settings.js';
import * as diag from './screens/diag.js';

const routes = {
  '': home,
  match,
  routine,
  reglages: settings,
  diag
};

let cleanup = null;

function current() {
  return location.hash.replace(/^#\/?/, '').split('?')[0];
}

function render(root) {
  if (typeof cleanup === 'function') {
    try { cleanup(); } catch (e) { console.error('Nettoyage écran', e); }
  }
  cleanup = null;
  const screen = routes[current()] || home;
  root.textContent = '';
  try {
    cleanup = screen.render(root);
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
