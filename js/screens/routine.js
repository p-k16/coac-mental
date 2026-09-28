import { h, setText, fmtClock, goBack } from '../ui.js';
import { state, logRoutine } from '../state.js';
import { buildPhases, phaseAt, circleScale } from '../core/routine.js';
import * as countdown from '../core/countdown.js';
import * as wakelock from '../core/wakelock.js';
import * as metrics from '../core/metrics.js';

export function render(root) {
  const tapAt = metrics.takeTap();
  const built = buildPhases(state.routine);
  const source = tapAt ? 'urgence' : 'direct';

  const circle = h('div', { class: 'breath-circle' });
  const title = h('div', { class: 'r-title' });
  const text = h('div', { class: 'r-text' });
  const count = h('div', { class: 'r-count' });
  const barFill = h('div', { class: 'bar-fill' });
  const chip = h('div', { class: 'chip hidden' });

  const running = h('div', { class: 'r-running' },
    h('div', { class: 'breath-wrap' }, circle, count),
    title, text,
    h('div', { class: 'bar' }, barFill));

  const endView = h('div', { class: 'r-end hidden' },
    h('div', { class: 'r-title' }, 'Routine terminée'),
    h('div', { class: 'r-text' }, state.routine.keyPhrase.text),
    h('button', { class: 'btn btn-primary', onclick: restart }, 'Encore une fois'),
    h('button', { class: 'btn btn-ghost', onclick: goBack }, 'Retour'));

  const screen = h('main', { class: 'screen routine' },
    chip, running, endView,
    h('button', { class: 'btn btn-ghost r-stop', onclick: goBack }, 'Arrêter'));
  root.append(screen);

  let startAt, raf = null, lastIndex = -1, finished = false;
  wakelock.acquire('routine');

  function frame() {
    const elapsed = (Date.now() - startAt) / 1000;
    if (elapsed >= built.total) { finish(); return; }
    const cur = phaseAt(built, elapsed);
    if (cur.index !== lastIndex) {
      lastIndex = cur.index;
      setText(title, cur.phase.title);
      setText(text, cur.phase.text);
      screen.dataset.kind = cur.phase.kind;
    }
    setText(count, String(Math.ceil(cur.phase.end - elapsed)));
    circle.style.transform = `scale(${circleScale(cur.phase, elapsed).toFixed(3)})`;
    barFill.style.transform = `scaleX(${(elapsed / built.total).toFixed(4)})`;
    raf = requestAnimationFrame(frame);
  }

  function begin() {
    startAt = Date.now();
    lastIndex = -1;
    finished = false;
    running.classList.remove('hidden');
    endView.classList.add('hidden');
    frame();
  }

  function finish() {
    finished = true;
    cancelAnimationFrame(raf);
    running.classList.add('hidden');
    endView.classList.remove('hidden');
    wakelock.release('routine');
    logRoutine({ source, completed: true, durationSec: built.total });
  }

  function restart() {
    wakelock.acquire('routine');
    begin();
  }

  const offTimer = countdown.subscribe((snap) => {
    chip.classList.toggle('hidden', !snap);
    if (!snap) return;
    chip.classList.toggle('ended', snap.ended);
    setText(chip, snap.ended
      ? `${snap.label} : temps écoulé +${fmtClock(snap.overtimeSec)}`
      : `${snap.label} : ${fmtClock(snap.remainingSec)}`);
  });

  begin();

  // Latence tap → première image affichée.
  if (tapAt) requestAnimationFrame(() => requestAnimationFrame(() =>
    metrics.record('urgence', performance.now() - tapAt)));

  const onVis = () => { if (document.visibilityState === 'visible' && !finished) frame(); };
  document.addEventListener('visibilitychange', onVis);

  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', onVis);
    offTimer();
    wakelock.release('routine');
    if (!finished) {
      const done = Math.min(built.total, Math.round((Date.now() - startAt) / 1000));
      logRoutine({ source, completed: false, durationSec: done });
    }
  };
}
