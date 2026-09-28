import { h, header, toast, setText } from '../ui.js';
import * as exp from '../db/export.js';
import { initState } from '../state.js';

const LABELS = { checkins: 'check-ins', matches: 'matchs', tournaments: 'tournois', routineLog: 'routines' };

function summary(counts) {
  return Object.entries(LABELS).map(([k, l]) => `${counts[k] || 0} ${l}`).join(' · ');
}

export function render(root) {
  const last = h('p', { class: 'muted small' });
  exp.lastExportAt().then((d) => setText(last, d
    ? `Dernière sauvegarde : ${new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}`
    : 'Aucune sauvegarde pour l’instant.')).catch(() => {});

  /* Export en deux temps : Safari exige que le partage parte directement d'un tap. */
  let file = null;
  const exportInfo = h('p', { class: 'muted small' });
  const shareBtn = h('button', { class: 'btn btn-primary hidden', type: 'button', onclick: share }, 'Enregistrer le fichier');
  const prepBtn = h('button', {
    class: 'btn btn-primary', type: 'button',
    onclick: async () => {
      try {
        const { json, name, counts } = await exp.buildExport();
        file = new File([json], name, { type: 'application/json' });
        setText(exportInfo, `${name} — ${summary(counts)}`);
        prepBtn.classList.add('hidden');
        shareBtn.classList.remove('hidden');
      } catch (e) { console.error('Export', e); toast('Export impossible'); }
    }
  }, '1. Préparer la sauvegarde');

  async function share() {
    if (!file) return;
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: file.name });
      } else {
        const url = URL.createObjectURL(file);
        const a = h('a', { href: url, download: file.name });
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
      await exp.markExported();
      toast('Sauvegarde faite');
      location.hash = '#/';
    } catch (e) {
      if (e && e.name === 'AbortError') { toast('Sauvegarde annulée'); return; }
      console.error('Partage', e);
      toast('Échec de l’enregistrement');
    }
  }

  /* Import */
  let pending = null, armed = false;
  const importInfo = h('p', { class: 'muted small' });
  const applyBtn = h('button', {
    class: 'btn btn-ghost danger hidden', type: 'button',
    onclick: async (e) => {
      if (!pending) return;
      if (!armed) { armed = true; setText(e.currentTarget, 'Toucher encore : tes données actuelles seront remplacées'); return; }
      try {
        await exp.applyImport(pending);
        await initState();
        toast('Sauvegarde restaurée');
        location.hash = '#/';
      } catch (err) { console.error('Import', err); toast('Import échoué : rien n’a été modifié'); }
    }
  }, '2. Remplacer mes données par cette sauvegarde');
  const fileInput = h('input', {
    type: 'file', accept: 'application/json,.json', class: 'file-input', id: 'importFile',
    onchange: async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try {
        const { data, counts } = exp.parseImport(await f.text());
        pending = data; armed = false;
        setText(importInfo, `Sauvegarde du ${new Date(data.exportedAt).toLocaleDateString('fr-FR')} : ${summary(counts)}`);
        applyBtn.classList.remove('hidden');
      } catch (err) {
        pending = null;
        applyBtn.classList.add('hidden');
        setText(importInfo, err.message);
      }
    }
  });

  root.append(h('main', { class: 'screen' },
    header('Sauvegarde'),
    h('section', { class: 'card' },
      h('h2', null, 'Sauvegarder'),
      h('p', { class: 'small' }, 'Tes données n’existent que sur cet iPhone. Si tu supprimes l’app, elles disparaissent. Sauvegarde chaque semaine, puis choisis « Enregistrer dans Fichiers » (iCloud Drive).'),
      last, prepBtn, shareBtn, exportInfo),
    h('section', { class: 'card' },
      h('h2', null, 'Restaurer'),
      h('label', { class: 'btn', for: 'importFile' }, '1. Choisir un fichier de sauvegarde'),
      fileInput, importInfo, applyBtn)));
}
