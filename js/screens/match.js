import { h, header, setText, fmtClock } from '../ui.js';
import { state } from '../state.js';
import * as countdown from '../core/countdown.js';
import * as wakelock from '../core/wakelock.js';
import { urgenceButton } from './home.js';

export function render(root) {
  const s = state.settings;

  const label = h('div', { class: 'timer-label' });
  const clock = h('div', { class: 'timer-clock', 'aria-live': 'off' });
  const sub = h('div', { class: 'timer-sub' });
  const bar = h('div', { class: 'bar-fill' });
  const timerBox = h('section', { class: 'timer-box hidden' },
    label, clock, h('div', { class: 'bar' }, bar), sub,
    h('button', { class: 'btn btn-ghost', onclick: () => countdown.stop() }, 'Arrêter le minuteur'));

  const lockState = h('span', { class: 'muted' });
  const awake = h('input', {
    type: 'checkbox', id: 'awake', checked: s.keepAwakeInMatch,
    onchange: (e) => (e.target.checked ? wakelock.acquire('match') : wakelock.release('match'))
  });

  root.append(h('main', { class: 'screen match' },
    header('Mode match'),
    urgenceButton(),
    h('div', { class: 'row2' },
      h('button', { class: 'btn btn-timer', onclick: () => countdown.start('Pause à 11 points', s.intervalSec) },
        h('strong', null, `${s.intervalSec} s`), h('span', null, 'Pause 11 pts')),
      h('button', { class: 'btn btn-timer', onclick: () => countdown.start('Entre les sets', s.betweenSetsSec) },
        h('strong', null, `${s.betweenSetsSec} s`), h('span', null, 'Entre sets'))),
    timerBox,
    h('label', { class: 'switch', for: 'awake' }, awake, h('span', null, 'Garder l’écran allumé'), lockState),
    h('a', { class: 'btn', href: '#/journal?id=' }, 'Match terminé : ouvrir le journal')
  ));

  if (s.keepAwakeInMatch) wakelock.acquire('match');

  const offTimer = countdown.subscribe((snap) => {
    timerBox.classList.toggle('hidden', !snap);
    if (!snap) return;
    timerBox.classList.toggle('ended', snap.ended);
    setText(label, snap.label);
    setText(clock, snap.ended ? '0:00' : fmtClock(snap.remainingSec));
    setText(sub, snap.ended ? `Temps écoulé  +${fmtClock(snap.overtimeSec)}` : '');
    bar.style.transform = `scaleX(${snap.progress})`;
  });

  const showLock = (st) => setText(lockState,
    !st.supported ? '(non supporté)' : st.active ? '(actif)' : st.lastError ? '(refusé)' : '');
  showLock(wakelock.status());
  const offLock = wakelock.subscribe(showLock);

  return () => { offTimer(); offLock(); wakelock.release('match'); };
}
