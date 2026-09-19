/* OMNI 2026 — paper archive list: every contribution with its own PDF and web version. */
(function () {
  var papers = window.OMNI_PAPERS || [];
  var q = document.getElementById('ar-q');
  if (!q) return;
  var list = document.getElementById('ar-list'), meta = document.getElementById('ar-meta');

  var EN = {
    'ar.count': '{n} contribution(s)', 'ar.none': 'Nothing matches that search',
    'ar.html': 'HTML', 'ar.pdf': 'PDF', 'ar.prog': 'Programme',
    'ar.gk': 'Keynote Lectures', 'ar.gA': 'Session A — NDT & Material / Structural Evaluation',
    'ar.gB': 'Session B — Integrated Infrastructure Management', 'ar.gS': 'Short Communications',
    'ar.pages': 'pp. {a}–{b}', 'sr.presenter': 'presenter'
  };
  function lang() { return document.documentElement.lang; }
  function t(k, n) {
    var d = (window.I18N && window.I18N[lang()]) || {};
    var s = (lang() !== 'en' && d[k]) || EN[k];
    return n == null ? s : s.replace('{n}', n);
  }
  function norm(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i').toLowerCase(); }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function shown(a) { return lang() === 'ja' && a.ja ? a.ja : a.name; }

  papers.forEach(function (p) {
    p._hay = norm([p.id, p.title].concat(p.authors.map(function (a) {
      return a.name + ' ' + (a.ja || '') + ' ' + (a.ja ? a.ja.replace(/\s+/g, '') : '') + ' ' + a.aff;
    })).join(' | '));
  });

  var GROUPS = [['keynote', 'ar.gk'], ['A', 'ar.gA'], ['B', 'ar.gB'], ['S', 'ar.gS']];

  function card(p) {
    var authors = p.authors.map(function (a) {
      return '<span class="' + (a.presenter ? 'pr' : '') + '">' + esc(shown(a)) + '</span>';
    }).join(', ');
    return '<div class="ar-item g-' + p.group + '">' +
      '<div class="ar-id">' + esc(p.id) + (p.time ? ' · ' + p.time : '') + '</div>' +
      '<div class="ar-body">' +
        '<div class="sr-title">' + esc(p.title) + '</div>' +
        '<div class="sr-authors">' + authors + '</div>' +
        '<div class="ar-links">' +
          '<a class="btn small" href="paper.html?id=' + encodeURIComponent(p.code || p.id) + '">' + t('ar.html') + '</a>' +
          '<a class="btn line small" href="paper.html?id=' + encodeURIComponent(p.code || p.id) + '&pdf=1">' + t('ar.pdf') + ' <small>' + t('ar.pages').replace('{a}', p.pages[0]).replace('{b}', p.pages[1]) + '</small></a>' +
          '<a class="ar-prog" href="../index.html#' + p.anchor + '">' + t('ar.prog') + ' →</a>' +
        '</div>' +
      '</div></div>';
  }

  function render() {
    var tokens = norm(q.value.trim()).split(/\s+/).filter(Boolean);
    var hits = papers.filter(function (p) {
      return tokens.every(function (tk) { return p._hay.indexOf(tk) >= 0; });
    });
    meta.textContent = hits.length ? t('ar.count', hits.length) : t('ar.none');
    list.innerHTML = GROUPS.map(function (g) {
      var inGroup = hits.filter(function (p) { return p.group === g[0]; });
      if (!inGroup.length) return '';
      return '<h3 class="sub">' + t(g[1]) + '</h3>' + inGroup.map(card).join('');
    }).join('');
  }

  q.addEventListener('input', render);
  document.addEventListener('omni:lang', render);
  render();
})();
