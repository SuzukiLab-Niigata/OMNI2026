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

  /* In Japanese, show the Japanese members' names in kanji everywhere on the page
     (e.g. "Prof. Dr. Tetsuya Suzuki" → "鈴木 哲也 教授"). Names come from window.OMNI_NAMES_JA in i18n.js. */
  var textOriginal = new WeakMap();
  function applyNames(lang) {
    var map = window.OMNI_NAMES_JA || {};
    var keys = Object.keys(map);
    if (!keys.length) return;
    var re = new RegExp('((?:Assist\\.|Assoc\\.)\\s+Prof\\.\\s+(?:Dr\\.\\s+)?|Prof\\.\\s+(?:Dr\\.\\s+)?|Dr\\.\\s+)?(' +
      keys.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'g');
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        return n.parentNode && n.parentNode.closest('script,style,svg,model-viewer,.sr-list,.sr-chips')
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var todo = [], node;
    while ((node = walker.nextNode())) todo.push(node);
    todo.forEach(function (n) {
      var orig = textOriginal.has(n) ? textOriginal.get(n) : n.nodeValue;
      if (lang === 'ja') {
        var v = orig.replace(re, function (m, title, name) {
          var suffix = !title ? '' : /Assist/.test(title) ? ' 助教' : /Assoc/.test(title) ? ' 准教授' : /Prof/.test(title) ? ' 教授' : '';
          return map[name] + suffix;
        });
        if (v !== orig) { textOriginal.set(n, orig); n.nodeValue = v; }
      } else if (textOriginal.has(n)) {
        n.nodeValue = textOriginal.get(n);
      }
    });
  }

  /* Header fit: first drop the subtitle, then fold the menu into ☰ if the bar is still too wide */
  var header = document.querySelector('.runhead');
  function fitHeader() {
    if (!header) return;
    var bar = header.querySelector('.in');
    var menu = document.getElementById('menu');
    var wasOpen = menu && menu.classList.contains('open');
    header.classList.remove('nosub', 'compact');
    if (bar.scrollWidth > bar.clientWidth + 1) header.classList.add('nosub');
    if (bar.scrollWidth > bar.clientWidth + 1) header.classList.add('compact');
    if (menu && !header.classList.contains('compact') && getComputedStyle(document.querySelector('.burger')).display === 'none') menu.classList.remove('open');
    else if (menu && wasOpen) menu.classList.add('open');
  }
  var fitQueued = false;
  window.addEventListener('resize', function () {
    if (fitQueued) return;
    fitQueued = true;
    requestAnimationFrame(function () { fitQueued = false; fitHeader(); });
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeader);

  function setLang(lang, save) {
    if (LANGS.indexOf(lang) < 0) lang = 'en';
    var dict = (window.I18N && window.I18N[lang]) || {};
    nodes.forEach(function (n) {
      var k = n.getAttribute('data-i18n');
      n.innerHTML = (lang !== 'en' && dict[k] != null) ? dict[k] : original.get(n);
    });
    [].forEach.call(document.querySelectorAll('[data-i18n-ph]'), function (n) {
      if (!n.hasAttribute('data-ph-en')) n.setAttribute('data-ph-en', n.placeholder);
      var k = n.getAttribute('data-i18n-ph');
      n.placeholder = (lang !== 'en' && dict[k] != null) ? dict[k] : n.getAttribute('data-ph-en');
    });
    document.documentElement.lang = lang;
    document.dispatchEvent(new CustomEvent('omni:lang', { detail: lang }));
    applyNames(lang);
    fitHeader();
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

  /* Logo SVGs: inline them so the embedded fonts render in every browser and stay sharp when zoomed.
     The <img> inside each slot stays as the fallback if the fetch fails (e.g. opened from file://). */
  [].forEach.call(document.querySelectorAll('[data-inline-svg]'), function (box) {
    fetch(box.getAttribute('data-inline-svg')).then(function (r) {
      if (!r.ok) throw new Error('svg');
      return r.text();
    }).then(function (markup) {
      var img = box.querySelector('img'), alt = img ? img.alt : '';
      box.innerHTML = markup;
      var svg = box.querySelector('svg');
      if (!svg) return;
      svg.removeAttribute('width'); svg.removeAttribute('height');
      svg.setAttribute('role', 'img');
      if (alt) svg.setAttribute('aria-label', alt);
    }).catch(function () {});
  });

  /* Skyline hotspots: hover shows the note on desktop; on touch screens the first tap shows it, the second opens the link */
  var spots = [].slice.call(document.querySelectorAll('.spot'));
  spots.forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (window.matchMedia('(hover: none)').matches && !a.classList.contains('show')) {
        e.preventDefault();
        spots.forEach(function (x) { x.classList.toggle('show', x === a); });
      }
    });
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest || !e.target.closest('.spot')) spots.forEach(function (x) { x.classList.remove('show'); });
  });
  if (window.matchMedia('(hover: hover)').matches) {
    spots.forEach(function (a) {
      var tip = a.querySelector('.tip');
      a.addEventListener('mousemove', function (e) {
        var r = a.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
        var x = e.clientX - r.left, y = e.clientY - r.top;
        var cx = Math.max(tw / 2 + 6 - r.left, Math.min(window.innerWidth - r.left - tw / 2 - 6, x));
        tip.style.left = cx + 'px';
        tip.style.top = (y - th - 18) + 'px';
        tip.style.setProperty('--ax', (tw / 2 + (x - cx)) + 'px');
        a.classList.add('follow');
      });
      a.addEventListener('mouseleave', function () {
        a.classList.remove('follow');
        tip.style.left = tip.style.top = '';
      });
    });
  }

  /* 3D models: download only when the viewer taps the button (the file is large) */
  [].forEach.call(document.querySelectorAll('model-viewer[data-src]'), function (mv) {
    var btn = mv.querySelector('.mv-load'), bar = mv.querySelector('.mv-progress span');
    if (btn) btn.addEventListener('click', function () { btn.disabled = true; mv.setAttribute('src', mv.getAttribute('data-src')); });
    mv.addEventListener('progress', function (e) { if (bar) bar.style.width = Math.round(e.detail.totalProgress * 100) + '%'; });
    mv.addEventListener('load', function () { var p = mv.querySelector('.mv-progress'); if (p) p.hidden = true; });
  });

  /* Proceedings PDF (participants only): the encrypted book lives at a fixed path, <pdf>.enc.
     If it exists, "ready" elements are shown; the PDF itself is decrypted after the password (assets/secure.js). */
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
  fetch(pdf + '.enc', { method: 'HEAD', cache: 'no-store' }).then(function (r) {
    if (!r.ok) throw new Error('missing');
    var info = document.getElementById('pdf-info');
    if (info) {
      var parts = [], lm = r.headers.get('Last-Modified'), len = r.headers.get('Content-Length');
      if (lm) parts.push(new Date(lm).toISOString().slice(0, 10));
      if (len) parts.push((len / 1048576).toFixed(1) + ' MB');
      info.textContent = parts.join(' · ');
    }
    show('ready');
    var S = window.OMNISecure, lock = document.getElementById('pdf-lock');
    if (!S || !lock) return;   // home page: the cover box just links to the proceedings page
    var path = 'proceedings/' + pdf.split('/').pop();
    function open() {
      if (!S.isUnlocked()) { lock.innerHTML = S.lockNotice(); return; }
      lock.innerHTML = '';
      S.blobURL(path, 'application/pdf').then(function (url) {
        ['pdf-open', 'pdf-dl'].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) { el.href = url; el.hidden = false; }
        });
        var viewer = document.getElementById('viewer');
        if (viewer) { viewer.src = url + '#view=FitH'; viewer.hidden = false; }
      });
    }
    S.ready.then(open);
    document.addEventListener('omni:unlocked', open);
    document.addEventListener('omni:lang', function () { if (!S.isUnlocked()) lock.innerHTML = S.lockNotice(); });
  }).catch(function () { show('soon'); });
})();
