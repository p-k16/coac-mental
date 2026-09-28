import { h, header, toast, setText } from '../ui.js';
import { slider, textField, numField, dateField, choice, choiceValue, val, intVal } from '../forms.js';
import * as repo from '../db/repo.js';
import { state } from '../state.js';
import { today, fmtFr } from '../core/dates.js';

export const TYPES = [['tournoi', 'Tournoi'], ['interclub', 'Interclub'], ['entrainement', 'Entraînement']];
export const DISCIPLINES = [['SH', 'Simple'], ['DH', 'Double'], ['DM', 'Mixte']];
export const LOST_TYPES = [
  ['filet', 'Faute filet'], ['dehors', 'Faute dehors'], ['service', 'Service'],
  ['tactique', 'Choix tactique'], ['provoquee', 'Provoquée par l’adv.'], ['gagnant_adv', 'Gagnant adverse']
];
export const WON_TYPES = [['gagnant', 'Mon gagnant'], ['faute_adv', 'Faute adverse'], ['faute_provoquee', 'Faute provoquée']];
const GOAL = [['oui', 'Oui'], ['partiel', 'En partie'], ['non', 'Non']];

export function render(root, params) {
  const main = h('main', { class: 'screen' }, header('Journal de match'));
  root.append(main);
  const id = params.get('id');
  if (id !== null) editView(main, id).catch((e) => console.error('Journal', e));
  else listView(main).catch((e) => console.error('Journal', e));
}

function scoreLine(m) {
  return (m.sets || []).map((s) => `${s.me}-${s.opp}`).join(' / ') || 'score à saisir';
}

async function listView(main) {
  const list = await repo.allMatches();
  main.append(
    h('a', { class: 'btn btn-primary', href: '#/journal?id=' }, '+ Nouveau match'),
    h('p', { class: 'muted small' }, 'Astuce : crée le match avant de jouer pour noter ton stress et ton objectif, puis complète-le après.'),
    list.length
      ? h('div', { class: 'list' }, list.map((m) => h('a', { class: 'list-item', href: `#/journal?id=${m.id}` },
        h('div', null,
          h('strong', null, `${m.opponent || '?'} · ${(DISCIPLINES.find((d) => d[0] === m.discipline) || ['', '—'])[1]}`),
          h('div', { class: 'muted small' }, `${fmtFr(m.date)} · ${scoreLine(m)}`)),
        h('span', { class: 'badge ' + (m.result === 'W' ? 'win' : m.result === 'L' ? 'loss' : '') },
          m.result === 'W' ? 'V' : m.result === 'L' ? 'D' : '…'))))
      : h('p', { class: 'muted' }, 'Aucun match enregistré.'));
}

async function editView(main, id) {
  const m = id ? await repo.getMatch(id) : null;
  const tournaments = await repo.allTournaments();
  const d = m || {
    date: today(), type: 'tournoi', discipline: null, opponent: '', tournamentId: null,
    pre: { stress: 5, activation: 5, processGoal: '' }, sets: [], decisive: [],
    post: { processScore: null, goalMet: null, facts: '', worked: '', adjust: '' }, routineUses: null
  };
  main.querySelector('.back').setAttribute('href', '#/journal');

  // Tournoi : ceux dont les dates entourent le jour du match, sinon tous.
  const tSelect = h('select', { id: 'tournamentId' },
    h('option', { value: '' }, '— aucun —'),
    tournaments.map((t) => h('option', { value: t.id, selected: t.id === d.tournamentId }, `${t.name} (${fmtFr(t.start)})`)));
  if (!m) {
    const hit = tournaments.find((t) => t.start <= d.date && (t.end || t.start) >= d.date);
    if (hit) tSelect.value = hit.id;
  }

  /* Score */
  const resultEl = h('strong', { class: 'result' });
  const setRows = [0, 1, 2].map((i) => {
    const s = d.sets[i] || {};
    return h('div', { class: 'set-row' },
      h('span', { class: 'muted' }, `Set ${i + 1}`),
      h('input', { type: 'number', inputmode: 'numeric', min: 0, max: 30, class: 'sc me', value: s.me ?? '', 'aria-label': `Set ${i + 1} moi` }),
      h('span', null, '–'),
      h('input', { type: 'number', inputmode: 'numeric', min: 0, max: 30, class: 'sc opp', value: s.opp ?? '', 'aria-label': `Set ${i + 1} adversaire` }));
  });
  const abandon = h('input', { type: 'checkbox', id: 'abandon', checked: !!d.abandon });
  const scoreBox = h('div', { class: 'field' },
    h('span', null, 'Score (moi – adversaire)'),
    h('div', { class: 'sets' }, setRows),
    h('div', { class: 'muted small' }, 'Résultat : ', resultEl),
    h('label', { class: 'switch', for: 'abandon' }, abandon, h('span', null, 'Match interrompu (abandon, blessure)')));

  function readSets() {
    const sets = [];
    for (const row of setRows) {
      const a = row.querySelector('.me').value, b = row.querySelector('.opp').value;
      if (a === '' && b === '') continue;
      sets.push({ me: Number(a), opp: Number(b) });
    }
    return sets;
  }
  function refreshResult() {
    const sets = readSets();
    const bad = sets.findIndex((s) => !repo.validSet(s.me, s.opp));
    const r = repo.matchResult(sets);
    if (bad >= 0 && !abandon.checked) setText(resultEl, `set ${bad + 1} impossible (21 pts, 2 d’écart, max 30)`);
    else setText(resultEl, r === 'W' ? 'victoire' : r === 'L' ? 'défaite' : sets.length ? 'incomplet' : '—');
    resultEl.classList.toggle('warn', bad >= 0 && !abandon.checked);
  }

  /* Points décisifs */
  const decList = h('div', { class: 'dec-list' });
  function decRow(p = {}) {
    const typeBox = h('div', { class: 'choice small-chips' });
    typeBox.dataset.name = 'etype';
    const drawTypes = (won, cur) => {
      typeBox.textContent = '';
      (won ? WON_TYPES : LOST_TYPES).forEach(([v, label]) => typeBox.appendChild(h('button', {
        type: 'button', class: 'chip-btn' + (v === cur ? ' on' : ''), 'data-val': v,
        onclick: (e) => { typeBox.querySelectorAll('.chip-btn').forEach((b) => b.classList.toggle('on', b === e.currentTarget)); }
      }, label)));
    };
    const wonBox = h('div', { class: 'choice' },
      [['1', 'Gagné'], ['0', 'Perdu']].map(([v, label]) => h('button', {
        type: 'button', class: 'chip-btn' + ((p.won === true && v === '1') || (p.won === false && v === '0') ? ' on' : ''), 'data-val': v,
        onclick: (e) => {
          wonBox.querySelectorAll('.chip-btn').forEach((b) => b.classList.toggle('on', b === e.currentTarget));
          drawTypes(v === '1', null);
        }
      }, label)));
    if (p.won === true || p.won === false) drawTypes(p.won, p.errorType);
    const row = h('div', { class: 'dec-row' },
      h('div', { class: 'dec-head' },
        h('select', { class: 'dset', 'aria-label': 'Set' }, [1, 2, 3].map((n) => h('option', { value: n, selected: p.set === n }, `Set ${n}`))),
        h('input', { type: 'number', inputmode: 'numeric', min: 0, max: 30, class: 'sc dme', value: p.me ?? '', 'aria-label': 'Mon score avant le point' }),
        h('span', null, '–'),
        h('input', { type: 'number', inputmode: 'numeric', min: 0, max: 30, class: 'sc dopp', value: p.opp ?? '', 'aria-label': 'Score adverse avant le point' }),
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Retirer', onclick: () => row.remove() }, '×')),
      wonBox, typeBox);
    decList.appendChild(row);
  }
  (d.decisive || []).forEach(decRow);

  function readDecisive() {
    const out = [];
    for (const row of decList.querySelectorAll('.dec-row')) {
      const me = row.querySelector('.dme').value, opp = row.querySelector('.dopp').value;
      const wonOn = row.querySelector('.choice:not([data-name]) .chip-btn.on');
      const typeOn = row.querySelector('[data-name="etype"] .chip-btn.on');
      if (me === '' || opp === '' || !wonOn) throw new Error('Point décisif incomplet : score et gagné/perdu requis');
      out.push({
        set: Number(row.querySelector('.dset').value), me: Number(me), opp: Number(opp),
        won: wonOn.dataset.val === '1', errorType: typeOn ? typeOn.dataset.val : null,
        close: repo.isClose(Number(me), Number(opp), state.settings), loggedAt: 'post'
      });
    }
    return out;
  }

  let armed = false;
  const form = h('form', { class: 'form', onsubmit: (e) => e.preventDefault() },
    h('h2', null, 'Contexte'),
    dateField('date', 'Date', d.date),
    choice('type', 'Type', TYPES, d.type),
    h('label', { class: 'field', for: 'tournamentId' }, h('span', null, 'Tournoi'), tSelect),
    choice('discipline', 'Discipline', DISCIPLINES, d.discipline),
    textField('opponent', 'Adversaire(s) : initiales seulement', d.opponent, { max: 12, placeholder: 'Ex. J.D.' }),

    h('h2', null, 'Avant le match'),
    slider('preStress', 'Stress', d.pre.stress, ['calme', 'très stressé']),
    slider('preActivation', 'Activation', d.pre.activation, ['éteint', 'survolté']),
    textField('processGoal', 'Objectif de processus', d.pre.processGoal, { max: 140, placeholder: 'Ex. routine complète avant chaque service' }),

    h('h2', null, 'Score'),
    scoreBox,

    h('h2', null, 'Points décisifs'),
    h('p', { class: 'muted small' }, 'Les 2 ou 3 points qui ont compté. Score avant le point.'),
    decList,
    h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => decRow() }, '+ Ajouter un point'),

    h('h2', null, 'Débrief'),
    numField('processScore', 'Note de processus (ce que tu contrôlais)', d.post.processScore, { min: 0, max: 10, unit: '/ 10' }),
    choice('goalMet', 'Objectif de processus atteint ?', GOAL, d.post.goalMet),
    textField('facts', '1. Faits (sans jugement)', d.post.facts, { rows: 2, max: 500 }),
    textField('worked', '2. Ce qui a marché', d.post.worked, { rows: 2, max: 500 }),
    textField('adjust', '3. Un ajustement pour le prochain match', d.post.adjust, { rows: 2, max: 300 }),
    numField('routineUses', 'Routines d’urgence utilisées', d.routineUses, { min: 0, max: 50 }),

    h('button', { class: 'btn btn-primary', type: 'button', onclick: save }, 'Enregistrer'),
    m ? h('button', {
      class: 'btn btn-ghost danger', type: 'button',
      onclick: async (e) => {
        if (!armed) { armed = true; e.currentTarget.textContent = 'Toucher encore pour confirmer'; return; }
        await repo.deleteMatch(m.id); toast('Match supprimé'); location.hash = '#/journal';
      }
    }, 'Supprimer') : null);

  scoreBox.addEventListener('input', refreshResult);
  abandon.addEventListener('change', refreshResult);
  refreshResult();

  async function save() {
    try {
      const sets = readSets();
      if (!abandon.checked) {
        const bad = sets.findIndex((s) => !repo.validSet(s.me, s.opp));
        if (bad >= 0) throw new Error(`Set ${bad + 1} : score impossible`);
      }
      const ps = intVal(form, 'processScore');
      if (ps !== null && (ps < 0 || ps > 10)) throw new Error('Note de processus : 0 à 10');
      const ru = intVal(form, 'routineUses');
      await repo.saveMatch({
        ...(m || {}),
        date: val(form, 'date') || today(),
        type: choiceValue(form, 'type') || 'tournoi',
        tournamentId: tSelect.value || null,
        discipline: choiceValue(form, 'discipline'),
        opponent: val(form, 'opponent').trim(),
        pre: { stress: Number(val(form, 'preStress')), activation: Number(val(form, 'preActivation')), processGoal: val(form, 'processGoal').trim() },
        sets,
        abandon: abandon.checked,
        result: repo.matchResult(sets),
        decisive: readDecisive(),
        post: {
          processScore: ps,
          goalMet: choiceValue(form, 'goalMet'),
          facts: val(form, 'facts').trim(), worked: val(form, 'worked').trim(), adjust: val(form, 'adjust').trim()
        },
        routineUses: ru
      });
      toast('Match enregistré');
      location.hash = '#/journal';
    } catch (e) {
      toast(e.message || 'Erreur d’enregistrement');
      if (!(e instanceof Error) || !/incomplet|impossible|processus/.test(e.message)) console.error('Match', e);
    }
  }

  main.append(form);
}
