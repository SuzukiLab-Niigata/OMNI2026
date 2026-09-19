/* OMNI 2026 — Author Search: find presentations by presenter, co-author, title, affiliation or ID. Data: assets/papers.js */
(function () {
  var papers = window.OMNI_PAPERS || [];
  var input = document.getElementById('sr-q');
  if (!input) return;
  var list = document.getElementById('sr-list');
  var meta = document.getElementById('sr-meta');
  var chips = document.getElementById('sr-chips');

  var EN = {
    'sr.all': 'All authors — click a name to search',
    'sr.count': '{n} presentation(s) found',
    'sr.none': 'No matching presentations',
    'sr.view': 'View in programme →',
    'sr.presenter': 'presenter',
    'sr.kn': 'Keynote Lecture',
    'sr.sa': 'Session A',
    'sr.sb': 'Session B',
    'sr.sc': 'Short Communication'
  };
  function lang() { return document.documentElement.lang; }
  function t(key, n) {
    var dict = (window.I18N && window.I18N[lang()]) || {};
    var s = (lang() !== 'en' && dict[key]) || EN[key];
    return n == null ? s : s.replace('{n}', n);
  }
  // accent-insensitive: Özgür → ozgur, Önelçin → onelcin, İlknur → ilknur, Odabaşı → odabasi
  function norm(s) {
    return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').toLowerCase();
  }
  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
  }
  // Japanese display name (e.g. 鈴木 哲也) when the page is in Japanese
  function shown(a) { return lang() === 'ja' && a.ja ? a.ja : a.name; }
  function nameKeys(a) { return norm(a.name) + ' ' + (a.ja ? a.ja + ' ' + a.ja.replace(/\s+/g, '') : ''); }
  function groupLabel(p) {
    return { keynote: t('sr.kn'), A: t('sr.sa'), B: t('sr.sb'), SC: t('sr.sc') }[p.group];
  }

  papers.forEach(function (p) {
    p._hay = norm([p.id, p.title].concat(p.authors.map(function (a) { return nameKeys(a) + ' ' + a.aff; })).join(' | '));
  });
  var byName = {};
  papers.forEach(function (p) { p.authors.forEach(function (a) { byName[a.name] = byName[a.name] || a; }); });
  var people = Object.keys(byName).sort(function (a, b) {
    var fa = norm(a.split(' ').pop()), fb = norm(b.split(' ').pop());
    return fa < fb ? -1 : fa > fb ? 1 : a < b ? -1 : 1;
  }).map(function (n) { return byName[n]; });

  function renderChips() {
    chips.innerHTML = people.map(function (a) {
      return '<button type="button" class="sr-chip">' + esc(shown(a)) + '</button>';
    }).join('');
  }

  function render() {
    var tokens = norm(input.value.trim()).split(/\s+/).filter(Boolean);
    if (!tokens.length) {
      list.innerHTML = '';
      meta.textContent = t('sr.all');
      chips.hidden = false;
      renderChips();
      return;
    }
    chips.hidden = true;
    var hits = papers.filter(function (p) {
      return tokens.every(function (tk) { return p._hay.indexOf(tk) >= 0; });
    });
    meta.textContent = hits.length ? t('sr.count', hits.length) : t('sr.none');
    list.innerHTML = hits.map(function (p) {
      var authors = p.authors.map(function (a) {
        var keys = nameKeys(a);
        var hit = tokens.some(function (tk) { return keys.indexOf(tk) >= 0; });
        var label = esc(shown(a));
        return '<span class="' + (a.presenter ? 'pr' : '') + '">' + (hit ? '<mark>' + label + '</mark>' : label) + '</span>' +
          (a.presenter ? ' <small>(' + t('sr.presenter') + ')</small>' : '');
      }).join(', ');
      var affs = [];
      p.authors.forEach(function (a) { if (affs.indexOf(a.aff) < 0) affs.push(a.aff); });
      var head = (p.group === 'keynote' ? groupLabel(p) + ' ' + esc(p.id.slice(-1)) : esc(p.id) + ' · ' + groupLabel(p)) +
        (p.time ? ' · ' + p.time : '');
      return '<li class="sr-item g-' + p.group + '">' +
        '<div class="sr-head">' + head + '</div>' +
        '<div class="sr-title">' + esc(p.title) + '</div>' +
        '<div class="sr-authors">' + authors + '</div>' +
        '<div class="sr-aff">' + affs.map(esc).join(' · ') + '</div>' +
        '<a class="sr-go" href="#' + p.anchor + '">' + t('sr.view') + '</a>' +
        (p.pdf ? '<a class="sr-pdf" href="archive/paper.html?id=' + encodeURIComponent(p.code || p.id) + '&pdf=1">' + t('sr.pdf') + '</a>' : '') +
        '</li>';
    }).join('');
  }

  input.addEventListener('input', render);
  chips.addEventListener('click', function (e) {
    if (e.target.className !== 'sr-chip') return;
    input.value = e.target.textContent;
    render();
    input.focus();
  });
  // briefly highlight the entry we jump to
  list.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('.sr-go');
    if (!a) return;
    var el = document.getElementById(a.getAttribute('href').slice(1));
    if (!el) return;
    el.classList.remove('flash');
    setTimeout(function () { el.classList.add('flash'); }, 350);
  });
  document.addEventListener('omni:lang', render);
  render();
})();
