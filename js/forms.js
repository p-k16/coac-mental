// Composants de formulaire communs.
import { h, setText } from './ui.js';

// Curseur 0-10 avec valeur affichée et libellés des extrémités.
export function slider(id, label, value, [lo, hi] = ['0', '10']) {
  const out = h('output', { for: id, class: 'slider-val' }, String(value));
  const input = h('input', {
    id, type: 'range', min: 0, max: 10, step: 1, value,
    oninput: (e) => setText(out, e.target.value)
  });
  return h('div', { class: 'field slider' },
    h('label', { for: id, class: 'slider-head' }, h('span', null, label), out),
    input,
    h('div', { class: 'slider-ends muted' }, h('span', null, lo), h('span', null, hi)));
}

export function textField(id, label, value = '', { rows = 0, max = 300, placeholder = '' } = {}) {
  const input = rows
    ? h('textarea', { id, rows, maxlength: max, placeholder }, value)
    : h('input', { id, type: 'text', maxlength: max, value, placeholder, autocomplete: 'off' });
  return h('label', { class: 'field', for: id }, h('span', null, label), input);
}

export function numField(id, label, value, { min, max, step = 1, unit = '' } = {}) {
  return h('label', { class: 'field', for: id },
    h('span', null, label),
    h('span', { class: 'inline' },
      h('input', { id, type: 'number', inputmode: step < 1 ? 'decimal' : 'numeric', min, max, step, value: value ?? '' }),
      unit ? h('span', { class: 'muted' }, unit) : null));
}

export function dateField(id, label, value) {
  return h('label', { class: 'field', for: id }, h('span', null, label),
    h('input', { id, type: 'date', value }));
}

// Groupe de boutons à choix unique (plus rapide qu'un <select> au pouce).
export function choice(name, label, options, value) {
  const wrap = h('div', { class: 'choice', role: 'radiogroup', 'data-name': name });
  for (const [val, text] of options) {
    const b = h('button', {
      type: 'button', class: 'chip-btn' + (val === value ? ' on' : ''), 'data-val': val,
      role: 'radio', 'aria-checked': val === value ? 'true' : 'false',
      onclick: () => {
        wrap.querySelectorAll('.chip-btn').forEach((x) => {
          x.classList.toggle('on', x === b);
          x.setAttribute('aria-checked', x === b ? 'true' : 'false');
        });
        wrap.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, text);
    wrap.appendChild(b);
  }
  return h('div', { class: 'field' }, h('span', null, label), wrap);
}

export function choiceValue(root, name) {
  const on = root.querySelector(`.choice[data-name="${name}"] .chip-btn.on`);
  return on ? on.dataset.val : null;
}

export const val = (root, id) => root.querySelector('#' + id).value;
export const intVal = (root, id) => {
  const v = root.querySelector('#' + id).value;
  return v === '' ? null : Number(v);
};
