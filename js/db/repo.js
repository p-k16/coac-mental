// Accès métier aux données (check-ins, matchs, tournois).
import * as db from './store.js';
import { today, addDays, diffDays } from '../core/dates.js';

const now = () => new Date().toISOString();

function stamp(rec) {
  const t = now();
  return { isDemo: false, createdAt: t, ...rec, id: rec.id || db.uuid(), updatedAt: t };
}

/* ---------- Check-ins ---------- */
export async function checkinByDate(date) {
  const all = await db.getAll('checkins');
  return all.find((c) => c.date === date) || null;
}
export async function saveCheckin(rec) {
  const existing = await checkinByDate(rec.date);
  const out = stamp({ ...(existing || {}), ...rec, id: existing ? existing.id : rec.id });
  await db.put('checkins', out);
  return out;
}
export async function allCheckins() {
  return (await db.getAll('checkins')).sort((a, b) => a.date.localeCompare(b.date));
}

// Série : jours consécutifs avec check-in, en remontant depuis aujourd'hui
// (ou hier si le check-in du jour n'est pas encore fait). Un jour manqué est
// toléré par fenêtre de 7 jours.
export function streak(dates) {
  const set = new Set(dates);
  let d = set.has(today()) ? today() : addDays(today(), -1);
  let count = 0;
  let lastMiss = null;
  for (let i = 0; i < 3650; i++) {
    if (set.has(d)) count++;
    else {
      if (lastMiss && diffDays(lastMiss, d) < 7) break;
      if (!set.has(addDays(d, -1))) break; // deux jours manqués d'affilée
      lastMiss = d;
    }
    d = addDays(d, -1);
  }
  return count;
}

/* ---------- Tournois ---------- */
export async function allTournaments() {
  return (await db.getAll('tournaments')).sort((a, b) => a.start.localeCompare(b.start));
}
export async function saveTournament(rec) {
  const out = stamp(rec);
  await db.put('tournaments', out);
  return out;
}
export const deleteTournament = (id) => db.del('tournaments', id);
export async function nextTournament() {
  const t = today();
  return (await allTournaments()).find((x) => (x.end || x.start) >= t) || null;
}

/* ---------- Matchs ---------- */
export async function allMatches() {
  return (await db.getAll('matches')).sort((a, b) =>
    b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || ''));
}
export const getMatch = (id) => db.get('matches', id);
export async function saveMatch(rec) {
  const out = stamp(rec);
  await db.put('matches', out);
  return out;
}
export const deleteMatch = (id) => db.del('matches', id);

/* ---------- Règles du badminton ---------- */
// Set valide : 21 points avec 2 d'écart, prolongation jusqu'à 30.
export function validSet(a, b) {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) return false;
  const w = Math.max(a, b), l = Math.min(a, b);
  if (w < 21 || w > 30) return false;
  if (w === 21) return l <= 19;
  if (w < 30) return l === w - 2;
  return l === 28 || l === 29;
}

export function matchResult(sets) {
  let me = 0, opp = 0;
  for (const s of sets) { if (s.me > s.opp) me++; else if (s.opp > s.me) opp++; }
  if (me === 2) return 'W';
  if (opp === 2) return 'L';
  return null;
}

// Point serré : les deux joueurs à ≥ min points et écart ≤ gap (réglages).
export function isClose(me, opp, { closePointMin = 17, closePointGap = 2 } = {}) {
  return me >= closePointMin && opp >= closePointMin && Math.abs(me - opp) <= closePointGap;
}
