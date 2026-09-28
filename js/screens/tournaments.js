import { h, header, toast } from '../ui.js';
import { textField, dateField, choice, choiceValue, val } from '../forms.js';
import * as repo from '../db/repo.js';
import { today, fmtFr, diffDays } from '../core/dates.js';

const IMPORTANCE = [['1', 'Faible'], ['2', 'Moyenne'], ['3', 'Haute']];
const DISC = { SH: 'Simple', DH: 'Double', DM: 'Mixte' };

export function render(root, params) {
  const main = h('main', { class: 'screen' }, header('Tournois'));
  root.append(main);
  const id = params.get('id');
  if (id !== null) editView(main, id);
  else listView(main);
}

async function listView(main) {
  const list = await repo.allTournaments();
  const t = today();
  const upcoming = list.filter((x) => (x.end || x.start) >= t);
  const past = list.filter((x) => (x.end || x.start) < t).reverse();

  const item = (x) => h('a', { class: 'list-item', href: `#/tournois?id=${x.id}` },
    h('div', null, h('strong', null, x.name),
      h('div', { class: 'muted small' },
        `${fmtFr(x.start)}${x.end && x.end !== x.start ? ' → ' + fmtFr(x.end) : ''} · ${(x.disciplines || []).map((d) => DISC[d]).join(', ') || '—'}`)),
    h('span', { class: 'badge imp' + x.importance }, x.start >= t ? `J-${diffDays(x.start, t)}` : ''));

  main.append(
    h('a', { class: 'btn btn-primary', href: '#/tournois?id=' }, '+ Ajouter un tournoi'),
    h('h2', { class: 'section' }, 'À venir'),
    upcoming.length ? h('div', { class: 'list' }, upcoming.map(item)) : h('p', { class: 'muted' }, 'Aucun tournoi prévu.'),
    past.length ? h('h2', { class: 'section' }, 'Passés') : null,
    past.length ? h('div', { class: 'list' }, past.map(item)) : null);
}

async function editView(main, id) {
  const x = id ? (await repo.allTournaments()).find((t) => t.id === id) : null;
  const d = x || { name: '', start: today(), end: '', importance: 2, disciplines: [] };
  const discs = new Set(d.disciplines || []);

  const discBox = h('div', { class: 'choice' }, Object.entries(DISC).map(([k, label]) =>
    h('button', {
      type: 'button', class: 'chip-btn' + (discs.has(k) ? ' on' : ''),
      onclick: (e) => { discs.has(k) ? discs.delete(k) : discs.add(k); e.currentTarget.classList.toggle('on', discs.has(k)); }
    }, label)));

  let armed = false;
  const delBtn = x ? h('button', {
    class: 'btn btn-ghost danger', type: 'button',
    onclick: async (e) => {
      if (!armed) { armed = true; e.currentTarget.textContent = 'Toucher encore pour confirmer'; return; }
      await repo.deleteTournament(x.id);
      toast('Tournoi supprimé');
      location.hash = '#/tournois';
    }
  }, 'Supprimer') : null;

  const form = h('form', { class: 'form', onsubmit: (e) => e.preventDefault() },
    textField('name', 'Nom', d.name, { max: 80, placeholder: 'Ex. Tournoi de Rennes' }),
    dateField('start', 'Début', d.start),
    dateField('end', 'Fin (si plusieurs jours)', d.end || ''),
    choice('importance', 'Importance', IMPORTANCE, String(d.importance)),
    h('div', { class: 'field' }, h('span', null, 'Disciplines'), discBox),
    h('button', { class: 'btn btn-primary', type: 'button', onclick: save }, 'Enregistrer'),
    delBtn);

  async function save() {
    const name = val(form, 'name').trim();
    const start = val(form, 'start');
    const end = val(form, 'end');
    if (!name) { toast('Nom manquant'); return; }
    if (!start) { toast('Date de début manquante'); return; }
    if (end && end < start) { toast('La fin est avant le début'); return; }
    await repo.saveTournament({
      ...(x || {}), name, start, end: end || null,
      importance: Number(choiceValue(form, 'importance') || 2),
      disciplines: [...discs]
    });
    toast('Tournoi enregistré');
    location.hash = '#/tournois';
  }

  main.querySelector('.back').setAttribute('href', '#/tournois');
  main.append(form);
}
