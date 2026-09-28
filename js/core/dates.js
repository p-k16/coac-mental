// Dates locales au format AAAA-MM-JJ (jamais d'UTC : un check-in à 0 h 30
// doit compter pour le bon jour).
export function toISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function today() { return toISODate(new Date()); }
export function parse(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12); // midi : évite les pièges du changement d'heure
}
export function addDays(s, n) {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}
export function diffDays(a, b) { return Math.round((parse(a) - parse(b)) / 86400000); }

const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export function fmtFr(s) {
  const d = parse(s);
  return `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
}
