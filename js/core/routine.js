// Découpe la routine de 30 s en phases chronométrées.
export function buildPhases(r) {
  const phases = [];
  for (let i = 1; i <= r.breath.cycles; i++) {
    phases.push({ kind: 'inhale', title: `Souffle ${i}/${r.breath.cycles}`, text: 'Inspire par le nez', sec: r.breath.inhale });
    phases.push({ kind: 'exhale', title: `Souffle ${i}/${r.breath.cycles}`, text: 'Expire lentement, bouche entrouverte', sec: r.breath.exhale });
  }
  phases.push({ kind: 'release', title: 'Relâchement', text: r.release.text, sec: r.release.sec });
  phases.push({ kind: 'focus', title: 'Cible', text: r.focusCue.text, sec: r.focusCue.sec });
  phases.push({ kind: 'phrase', title: 'Phrase-clé', text: r.keyPhrase.text, sec: r.keyPhrase.sec });
  let acc = 0;
  for (const p of phases) { p.start = acc; acc += p.sec; p.end = acc; }
  return { phases, total: acc };
}

export function phaseAt(built, elapsed) {
  for (let i = 0; i < built.phases.length; i++) {
    if (elapsed < built.phases[i].end) return { index: i, phase: built.phases[i] };
  }
  return null;
}

const MIN = 0.5, MAX = 1;
const ease = (x) => 0.5 - Math.cos(Math.PI * x) / 2;

// Échelle du cercle de respiration à l'instant `elapsed`.
export function circleScale(phase, elapsed) {
  const x = Math.min(1, Math.max(0, (elapsed - phase.start) / phase.sec));
  if (phase.kind === 'inhale') return MIN + (MAX - MIN) * ease(x);
  if (phase.kind === 'exhale') return MAX - (MAX - MIN) * ease(x);
  return MIN;
}
