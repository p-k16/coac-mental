// Valeurs par défaut. La routine sera personnalisée par l'onboarding (session 3).
export const DEFAULT_ROUTINE = {
  breath: { inhale: 4, exhale: 6, cycles: 2 },            // 2 × 10 s = 20 s
  release: { text: 'Relâche les épaules. Main souple sur le grip, 3 sur 10.', sec: 5 },
  focusCue: { text: 'Yeux sur le bouchon au départ de sa raquette.', sec: 3 },
  keyPhrase: { text: 'Ce point. Rien d’autre.', sec: 2 }
};

export const DEFAULT_SETTINGS = {
  intervalSec: 60,          // pause à 11 points
  betweenSetsSec: 120,      // entre les sets
  sound: true,              // bip à 10 s de la fin et à la fin
  keepAwakeInMatch: false,  // écran allumé pendant tout le mode match (batterie)
  closePointMin: 17,        // seuil de point serré (utilisé à l'étape 2)
  closePointGap: 2
};

export const LIMITS = {
  inhale: [2, 8], exhale: [3, 12], cycles: [1, 5],
  release: [1, 15], focusCue: [1, 15], keyPhrase: [1, 15],
  intervalSec: [20, 180], betweenSetsSec: [30, 300],
  textMax: 120
};
