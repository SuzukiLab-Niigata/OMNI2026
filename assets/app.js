/* OMNI 2026 — language switch (EN / TR / JA), mobile menu, proceedings PDF detection */
(function () {
  var LANGS = ['en', 'tr', 'ja'];
  var nodes = [].slice.call(document.querySelectorAll('[data-i18n]'));
  var original = new Map();
  nodes.forEach(function (n) { original.set(n, n.innerHTML); });
  var baseTitle = document.title;

  function loadJaFont() {
    if (document.getElementById('font-ja')) return;
    var l = document.createElement('link');
    l.id = 'font-ja'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap';
    document.head.appendChild(l);
  }

  function setLang(lang, save) {
    if (LANGS.indexOf(lang) < 0) lang = 'en';
    var dict = (window.I18N && window.I18N[lang]) || {};
    nodes.forEach(function (n) {
      var k = n.getAttribute('data-i18n');
      n.innerHTML = (lang !== 'en' && dict[k] != null) ? dict[k] : original.get(n);
    });
    document.documentElement.lang = lang;
    var tkey = document.body.getAttribute('data-title');
    document.title = (lang !== 'en' && tkey && dict[tkey]) ? dict[tkey] : baseTitle;
    if (lang === 'ja') loadJaFont();
    [].forEach.call(document.querySelectorAll('.lang button'), function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false');
    });
    if (save) {
      try { localStorage.setItem('omni-lang', lang); } catch (e) {}
      try {
        var u = new URL(location.href);
        if (lang === 'en') u.searchParams.delete('lang'); else u.searchParams.set('lang', lang);
        history.replaceState(null, '', u);
      } catch (e) {}
    }
  }

  function initialLang() {
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q && LANGS.indexOf(q) >= 0) return q;
    } catch (e) {}
    try {
      var s = localStorage.getItem('omni-lang');
      if (s && LANGS.indexOf(s) >= 0) return s;
    } catch (e) {}
    var nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return LANGS.indexOf(nav) >= 0 ? nav : 'en';
  }

  [].forEach.call(document.querySelectorAll('.lang button'), function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); });
  });
  setLang(initialLang(), false);

  /* mobile menu */
  var burger = document.querySelector('.burger'), menu = document.getElementById('menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { menu.classList.remove('open'); burger.setAttribute('aria-expanded', false); }
    });
  }

  /* 3D models: download only when the viewer taps the button (the file is large) */
  [].forEach.call(document.querySelectorAll('model-viewer[data-src]'), function (mv) {
    var btn = mv.querySelector('.mv-load'), bar = mv.querySelector('.mv-progress span');
    if (btn) btn.addEventListener('click', function () { btn.disabled = true; mv.setAttribute('src', mv.getAttribute('data-src')); });
    mv.addEventListener('progress', function (e) { if (bar) bar.style.width = Math.round(e.detail.totalProgress * 100) + '%'; });
    mv.addEventListener('load', function () { var p = mv.querySelector('.mv-progress'); if (p) p.hidden = true; });
  });

  /* Proceedings PDF: the file always lives at a fixed path.
     If it exists, "ready" elements are shown; otherwise "soon" elements stay visible. */
  var pdf = document.body.getAttribute('data-pdf');
  if (!pdf) return;
  function show(state) {
    [].forEach.call(document.querySelectorAll('[data-when]'), function (el) {
      el.hidden = el.getAttribute('data-when') !== state;
    });
    [].forEach.call(document.querySelectorAll('.pbox'), function (el) {
      el.classList.toggle('soon', state === 'soon');
    });
  }
  show('soon');
  fetch(pdf, { method: 'HEAD', cache: 'no-store' }).then(function (r) {
    if (!r.ok) throw new Error('missing');
    var v = '?v=' + (r.headers.get('ETag') || r.headers.get('Last-Modified') || Date.now()).toString().replace(/\W/g, '');
    [].forEach.call(document.querySelectorAll('[data-pdf-href]'), function (a) { a.href = a.getAttribute('data-pdf-href') + v; });
    var viewer = document.getElementById('viewer');
    if (viewer) viewer.src = pdf + v + '#view=FitH';
    var info = document.getElementById('pdf-info');
    if (info) {
      var parts = [], lm = r.headers.get('Last-Modified'), len = r.headers.get('Content-Length');
      if (lm) parts.push(new Date(lm).toISOString().slice(0, 10));
      if (len) parts.push((len / 1048576).toFixed(1) + ' MB');
      info.textContent = parts.join(' · ');
    }
    show('ready');
  }).catch(function () { show('soon'); });
})();
