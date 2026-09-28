/* Chargé avant tout le reste (script classique) : capture les erreurs pour le
   panneau Diagnostic, puisqu'on n'a pas d'inspecteur Safari. */
(function () {
  var KEY = 'cb_logs', MAX = 200, buf = [];
  try { buf = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { buf = []; }

  function save() { try { localStorage.setItem(KEY, JSON.stringify(buf.slice(-MAX))); } catch (e) {} }
  function fmt(a) {
    if (a instanceof Error) return a.name + ': ' + a.message + (a.stack ? '\n' + a.stack : '');
    if (a && typeof a === 'object') { try { return JSON.stringify(a); } catch (e) { return String(a); } }
    return String(a);
  }
  function add(level, args) {
    var msg = Array.prototype.map.call(args, fmt).join(' ');
    buf.push({ t: new Date().toISOString(), l: level, m: msg.slice(0, 2000) });
    if (buf.length > MAX) buf = buf.slice(-MAX);
    save();
  }

  ['error', 'warn', 'info'].forEach(function (l) {
    var orig = console[l];
    console[l] = function () { add(l, arguments); orig.apply(console, arguments); };
  });
  window.addEventListener('error', function (e) {
    add('error', [(e.message || 'Erreur') + ' @ ' + (e.filename || '?') + ':' + (e.lineno || '?')]);
  });
  window.addEventListener('unhandledrejection', function (e) { add('error', ['Promesse rejetée :', e.reason]); });

  window.CB_LOG = {
    get: function () { return buf.slice(); },
    clear: function () { buf = []; save(); },
    add: function (l, m) { add(l, [m]); }
  };

  /* Si l'app n'a pas démarré après 6 s, on affiche les erreurs à l'écran. */
  setTimeout(function () {
    if (window.CB_READY) return;
    var app = document.getElementById('app');
    if (!app) return;
    app.textContent = '';
    var p = document.createElement('p');
    p.className = 'boot';
    p.textContent = "L'app n'a pas démarré. Erreurs enregistrées :";
    var pre = document.createElement('pre');
    pre.className = 'log';
    pre.textContent = buf.slice(-20).map(function (x) { return x.t + ' [' + x.l + '] ' + x.m; }).join('\n') || '(aucune)';
    app.appendChild(p); app.appendChild(pre);
  }, 6000);
})();
