import { h, header, toast, setText } from '../ui.js';
import { state, saveSettings, saveRoutine } from '../state.js';
import { DEFAULT_ROUTINE, DEFAULT_SETTINGS, LIMITS } from '../db/defaults.js';

function num(id, label, value, [min, max], unit = 's') {
  return h('label', { class: 'field', for: id },
    h('span', null, label),
    h('span', { class: 'inline' },
      h('input', { id, type: 'number', inputmode: 'numeric', min, max, step: 1, value }),
      h('span', { class: 'muted' }, unit)));
}

function txt(id, label, value) {
  return h('label', { class: 'field', for: id },
    h('span', null, label),
    h('textarea', { id, rows: 2, maxlength: LIMITS.textMax }, value));
}

function readNum(root, id, [min, max]) {
  const v = Math.round(Number(root.querySelector('#' + id).value));
  if (!Number.isFinite(v) || v < min || v > max) throw new Error(`Valeur hors limites (${min}-${max})`);
  return v;
}

function readTxt(root, id) {
  const v = root.querySelector('#' + id).value.trim();
  if (!v) throw new Error('Texte vide');
  return v.slice(0, LIMITS.textMax);
}

export function render(root) {
  const r = state.routine;
  const s = state.settings;
  const total = h('strong');

  const form = h('form', { class: 'form', onsubmit: (e) => e.preventDefault() },
    h('h2', null, 'Routine de 30 s'),
    h('p', { class: 'muted small' }, 'Durée totale : ', total, ' (visée : 30 s)'),
    h('fieldset', null,
      h('legend', null, 'Souffle (expiration plus longue que l’inspiration)'),
      num('inhale', 'Inspiration', r.breath.inhale, LIMITS.inhale),
      num('exhale', 'Expiration', r.breath.exhale, LIMITS.exhale),
      num('cycles', 'Nombre de cycles', r.breath.cycles, LIMITS.cycles, '×')),
    h('fieldset', null,
      h('legend', null, 'Relâchement'),
      txt('releaseText', 'Consigne', r.release.text),
      num('releaseSec', 'Durée', r.release.sec, LIMITS.release)),
    h('fieldset', null,
      h('legend', null, 'Cible attentionnelle'),
      txt('focusText', 'Consigne', r.focusCue.text),
      num('focusSec', 'Durée', r.focusCue.sec, LIMITS.focusCue)),
    h('fieldset', null,
      h('legend', null, 'Phrase-clé'),
      txt('phraseText', 'Phrase', r.keyPhrase.text),
      num('phraseSec', 'Durée', r.keyPhrase.sec, LIMITS.keyPhrase)),

    h('h2', null, 'Minuteurs'),
    h('fieldset', null,
      num('intervalSec', 'Pause à 11 points', s.intervalSec, LIMITS.intervalSec),
      num('betweenSetsSec', 'Entre les sets', s.betweenSetsSec, LIMITS.betweenSetsSec),
      h('label', { class: 'switch', for: 'sound' },
        h('input', { id: 'sound', type: 'checkbox', checked: s.sound }),
        h('span', null, 'Bip à 10 s de la fin et à la fin')),
      h('label', { class: 'switch', for: 'keepAwake' },
        h('input', { id: 'keepAwake', type: 'checkbox', checked: s.keepAwakeInMatch }),
        h('span', null, 'Écran allumé pendant tout le mode match'))),
    h('p', { class: 'muted small' },
      'Le bip ne sonne pas si l’iPhone est en mode silencieux. L’écran est de toute façon maintenu allumé pendant un minuteur ou une routine.'),

    h('button', { class: 'btn btn-primary', type: 'button', onclick: save }, 'Enregistrer'),
    h('button', { class: 'btn btn-ghost', type: 'button', onclick: reset }, 'Revenir aux valeurs par défaut'));

  function updateTotal() {
    const v = (id) => Number(form.querySelector('#' + id).value) || 0;
    const t = v('cycles') * (v('inhale') + v('exhale')) + v('releaseSec') + v('focusSec') + v('phraseSec');
    setText(total, `${t} s`);
    total.classList.toggle('warn', Math.abs(t - 30) > 5);
  }
  form.addEventListener('input', updateTotal);

  async function save() {
    try {
      const routine = {
        breath: {
          inhale: readNum(form, 'inhale', LIMITS.inhale),
          exhale: readNum(form, 'exhale', LIMITS.exhale),
          cycles: readNum(form, 'cycles', LIMITS.cycles)
        },
        release: { text: readTxt(form, 'releaseText'), sec: readNum(form, 'releaseSec', LIMITS.release) },
        focusCue: { text: readTxt(form, 'focusText'), sec: readNum(form, 'focusSec', LIMITS.focusCue) },
        keyPhrase: { text: readTxt(form, 'phraseText'), sec: readNum(form, 'phraseSec', LIMITS.keyPhrase) }
      };
      const settings = {
        ...s,
        intervalSec: readNum(form, 'intervalSec', LIMITS.intervalSec),
        betweenSetsSec: readNum(form, 'betweenSetsSec', LIMITS.betweenSetsSec),
        sound: form.querySelector('#sound').checked,
        keepAwakeInMatch: form.querySelector('#keepAwake').checked
      };
      await saveRoutine(routine);
      await saveSettings(settings);
      toast('Enregistré');
    } catch (e) {
      console.warn('Réglages', e);
      toast(e.message || 'Erreur d’enregistrement');
    }
  }

  async function reset() {
    await saveRoutine(structuredClone(DEFAULT_ROUTINE));
    await saveSettings({ ...structuredClone(DEFAULT_SETTINGS) });
    root.textContent = '';
    render(root);
    toast('Valeurs par défaut rétablies');
  }

  root.append(h('main', { class: 'screen settings' }, header('Réglages'), form));
  updateTotal();
}
