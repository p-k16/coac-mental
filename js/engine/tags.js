// Étiquetage des notes par mots-clés (0 token). Sera doublé par le LLM léger
// à l'étape 5 ; reste le mode de secours hors ligne.
// Début de mot compatible avec les accents (\b de JS ignore « é », « à »…).
const W = (alts) => new RegExp('(?:^|[^a-z0-9à-ÿœæ])(?:' + alts + ')', 'i');

const RULES = {
  sommeil: W('dormi|dormir|sommeil|nuit|réveill|insomn|couch[ée]'),
  travail: W('travail|boulot|taf|réunion|bureau|chef|client|partiel|exam|cours|deadline'),
  conflit: W('dispute|conflit|engueul|tension avec|énerv|clash'),
  fatigue: W('fatigu|crevé|épuis|vidé|lourd|sans énergie|claqué'),
  blessure: W('bless|douleur|mal (au|à la|aux)|genou|épaule|cheville|dos|mollet|poignet|tendin|kiné'),
  entrainement: W('entra[iî]nement|entraîne|séance|muscu|physique|club|jeu libre'),
  confiance: W('confian|doute|pas au niveau|nul|sûr de moi|légitim'),
  peur_erreur: W('peur de (rater|perdre|faire)|faute|erreur|rater|trembl'),
  enjeu: W('tournoi|finale|demi|classement|montée|points|interclub|enjeu|qualif'),
  adversaire: W('adversaire|contre (lui|elle)|mieux classé|moins bien classé'),
  partenaire: W('partenaire|binôme|double|mixte')
};

export const TAGS = Object.keys(RULES).concat('autre');

export const TAG_LABELS = {
  sommeil: 'Sommeil', travail: 'Travail / études', conflit: 'Conflit', fatigue: 'Fatigue',
  blessure: 'Blessure', entrainement: 'Entraînement', confiance: 'Confiance',
  peur_erreur: 'Peur de l’erreur', enjeu: 'Enjeu', adversaire: 'Adversaire',
  partenaire: 'Partenaire', autre: 'Autre'
};

export function tagText(text) {
  if (!text || !text.trim()) return [];
  const t = text.normalize('NFC');
  return Object.entries(RULES).filter(([, re]) => re.test(t)).map(([k]) => k).slice(0, 5);
}
