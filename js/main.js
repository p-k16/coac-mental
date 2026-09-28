import { initState } from './state.js';
import { startRouter } from './router.js';
import { registerSW } from './sw-client.js';
import * as metrics from './core/metrics.js';
import './core/sound.js';

async function requestPersist() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const already = await navigator.storage.persisted();
      if (!already) {
        const ok = await navigator.storage.persist();
        console.info('Stockage persistant ' + (ok ? 'accordé' : 'refusé'));
      }
    }
  } catch (e) {
    console.warn('storage.persist', e);
  }
}

(async () => {
  try { await initState(); } catch (e) { console.error('Initialisation', e); }
  startRouter(document.getElementById('app'));
  window.CB_READY = true;
  metrics.record('startup', performance.now());
  registerSW();
  requestPersist();
})();
