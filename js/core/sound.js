// Bips courts via Web Audio. iOS impose un premier geste de l'utilisateur pour
// débloquer le son, et coupe le son si l'iPhone est en mode silencieux.
let ctx = null;

export function unlock() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) {
    console.warn('Audio indisponible', e);
  }
}

export function beep({ freq = 880, ms = 180, count = 1, gap = 120, volume = 0.25 } = {}) {
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') ctx.resume();
    let t = ctx.currentTime + 0.02;
    for (let i = 0; i < count; i++) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(volume, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      osc.connect(g).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + ms / 1000 + 0.02);
      t += (ms + gap) / 1000;
    }
  } catch (e) {
    console.warn('Bip impossible', e);
  }
}

export function audioState() { return ctx ? ctx.state : 'non initialisé'; }

// Débloque l'audio au premier contact avec l'écran.
['touchend', 'click'].forEach((ev) =>
  document.addEventListener(ev, unlock, { capture: true, passive: true }));
