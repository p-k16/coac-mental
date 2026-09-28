import { h, header, toast, setText } from '../ui.js';
import { slider, textField, numField, dateField, val, intVal } from '../forms.js';
import * as repo from '../db/repo.js';
import { today, fmtFr } from '../core/dates.js';
import { tagText, TAGS, TAG_LABELS } from '../engine/tags.js';

export function render(root, params) {
  const main = h('main', { class: 'screen checkin' }, header('Check-in'));
  root.append(main);
  load(main, params.get('date') || today());
}

async function load(main, date) {
  const existing = await repo.checkinByDate(date).catch(() => null);
  const c = existing || { stress: 5, energy: 5, mood: 5, tension: 5, sleepH: '', keyEvent: '', note: '', tags: [] };
  let tags = new Set(c.tags || []);
  let manualTags = !!existing;

  const tagBox = h('div', { class: 'choice' });
  function drawTags() {
    tagBox.textContent = '';
    for (const t of TAGS) {
      tagBox.appendChild(h('button', {
        type: 'button', class: 'chip-btn' + (tags.has(t) ? ' on' : ''),
        onclick: (e) => {
          manualTags = true;
          tags.has(t) ? tags.delete(t) : tags.add(t);
          e.currentTarget.classList.toggle('on', tags.has(t));
        }
      }, TAG_LABELS[t]));
    }
  }

  const status = h('p', { class: 'muted small' });
  const form = h('form', { class: 'form', onsubmit: (e) => e.preventDefault() },
    dateField('date', 'Jour', date),
    status,
    slider('stress', 'Stress', c.stress, ['calme', 'très stressé']),
    slider('energy', 'Énergie', c.energy, ['vidé', 'pleine forme']),
    slider('mood', 'Humeur', c.mood, ['très basse', 'excellente']),
    slider('tension', 'Tension corporelle', c.tension, ['relâché', 'très tendu']),
    numField('sleepH', 'Sommeil la nuit dernière', c.sleepH, { min: 0, max: 14, step: 0.5, unit: 'h' }),
    textField('keyEvent', 'Événement clé du jour', c.keyEvent, { max: 120, placeholder: 'Une phrase' }),
    textField('note', 'Note libre', c.note, { rows: 3, max: 1000, placeholder: 'Ce qui te trotte dans la tête, sensations, pensées…' }),
    h('div', { class: 'field' }, h('span', null, 'Étiquettes (détectées automatiquement, modifiables)'), tagBox),
    h('button', { class: 'btn btn-primary', type: 'button', onclick: save }, existing ? 'Mettre à jour' : 'Enregistrer'));

  setText(status, existing ? `Déjà rempli pour ${fmtFr(date)} : tu modifies ce check-in.` : fmtFr(date));
  drawTags();

  // Détection automatique tant que l'utilisateur n'a pas touché aux étiquettes.
  form.addEventListener('input', (e) => {
    if (manualTags || !['note', 'keyEvent'].includes(e.target.id)) return;
    tags = new Set(tagText(`${val(form, 'keyEvent')} ${val(form, 'note')}`));
    drawTags();
  });
  form.querySelector('#date').addEventListener('change', (e) => {
    if (e.target.value) location.hash = `#/checkin?date=${e.target.value}`;
  });

  async function save() {
    const sleep = intVal(form, 'sleepH');
    if (sleep !== null && (sleep < 0 || sleep > 14)) { toast('Sommeil : entre 0 et 14 h'); return; }
    try {
      await repo.saveCheckin({
        date,
        stress: Number(val(form, 'stress')),
        energy: Number(val(form, 'energy')),
        mood: Number(val(form, 'mood')),
        tension: Number(val(form, 'tension')),
        sleepH: sleep,
        keyEvent: val(form, 'keyEvent').trim(),
        note: val(form, 'note').trim(),
        tags: [...tags],
        extractedBy: 'rules'
      });
      toast('Check-in enregistré');
      location.hash = '#/';
    } catch (e) {
      console.error('Check-in', e);
      toast('Erreur d’enregistrement');
    }
  }

  main.append(form);
}
