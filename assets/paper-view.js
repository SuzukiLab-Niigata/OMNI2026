/* OMNI 2026 — HTML version of a single paper (archive/paper.html?id=A-1, add &pdf=1 to show its PDF).
   Title and authors are public (assets/papers.js). The text, page images and PDF are participants-only:
   they are published encrypted and decrypted in the browser after the password (assets/secure.js).
   Text: assets/papers-html/<code>.json(.enc) = { en: {...}, ja: {...}, tr: {...} } — ja/tr are optional. */
(function () {
  var host = document.getElementById('paper');
  if (!host) return;
  var papers = window.OMNI_PAPERS || [];
  var S = window.OMNISecure;
  var params = new URLSearchParams(location.search);
  var id = params.get('id') || '';
  var wantPdf = params.has('pdf');
  /* links may carry either the printed id ("Keynote A") or the short code ("KA") */
  var paper = papers.filter(function (p) { return p.id === id || p.code === id; })[0];
  var key = paper ? (paper.code || paper.id) : '';
  var data = null, pdfURL = null;

  var EN = {
    'pv.back': '← Back to the archive', 'pv.abstract': 'Abstract', 'pv.keywords': 'Keywords',
    'pv.refs': 'References', 'pv.ack': 'Acknowledgements', 'pv.pdf': 'This paper (PDF)',
    'pv.full': 'Full proceedings (PDF)', 'pv.prog': 'View in programme',
    'pv.machine': 'The Turkish and Japanese texts are machine translations. The PDF (English) is the record of reference.',
    'pv.partial': 'Title, abstract and keywords are translated; the body is shown in the original English. Translations are machine-assisted.',
    'pv.missing': 'A translation of this paper is being prepared; the English text is shown.',
    'pv.notfound': 'That paper could not be found.', 'pv.pages': 'pp. {a}–{b}', 'sr.presenter': 'presenter',
    'pv.pages_t': 'Printed pages (equations and figures)',
    'pv.pages_h': 'Equations, figures and tables are shown here exactly as printed. Click an image to enlarge.',
    'pv.page_n': 'Page {n}', 'pv.seepage': 'see printed page ↓',
    'pv.eqnote': 'Equations are extracted from the PDF, so superscripts and subscripts may not survive. See the printed pages below, or the PDF, for the exact notation.',
    'pv.dl': 'Download PDF', 'pv.loading': 'Loading…',
    'ar.gk': 'Keynote Lecture', 'ar.gA': 'Session A', 'ar.gB': 'Session B', 'ar.gS': 'Short Communication'
  };
  function lang() { return document.documentElement.lang; }
  function t(k) {
    var d = (window.I18N && window.I18N[lang()]) || {};
    return (lang() !== 'en' && d[k]) || EN[k];
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function shown(a) { return lang() === 'ja' && a.ja ? a.ja : a.name; }
  function groupLabel(p) { return { keynote: t('ar.gk'), A: t('ar.gA'), B: t('ar.gB'), S: t('ar.gS') }[p.group]; }
  function unlocked() { return !S || S.isUnlocked(); }

  function sectionHtml(s) {
    var out = '<h3 class="pv-sec">' + esc(s.n) + '. ' + esc(s.h) + '</h3>';
    if (s.blocks && s.blocks.length) {
      s.blocks.forEach(function (b) {
        if (b.t === 'eq') out += '<span class="pv-eq">' + esc(b.text) + '<a class="pv-eqlink" href="#printed">' + t('pv.seepage') + '</a></span>';
        else if (b.t === 'cap') out += '<p class="pv-cap">' + esc(b.text) + '</p>';
        else out += '<p>' + esc(b.text) + '</p>';
      });
    } else if (s.text) {
      out += '<p>' + esc(s.text) + '</p>';
    }
    return out;
  }

  function header(title) {
    var affs = [];
    paper.authors.forEach(function (a) { if (affs.indexOf(a.aff) < 0) affs.push(a.aff); });
    var authors = paper.authors.map(function (a) {
      return '<span class="' + (a.presenter ? 'pr' : '') + '">' + esc(shown(a)) + '</span>' +
        (a.presenter ? ' <small>(' + t('sr.presenter') + ')</small>' : '');
    }).join(', ');
    var pages = t('pv.pages').replace('{a}', paper.pages[0]).replace('{b}', paper.pages[1]);
    return '<a class="pv-back" href="./">' + t('pv.back') + '</a>' +
      '<div class="pv-head">' + esc(paper.id) + ' · ' + groupLabel(paper) + (paper.time ? ' · ' + paper.time : '') + '</div>' +
      '<h1 class="pv-title">' + esc(title) + '</h1>' +
      '<div class="pv-authors">' + authors + '</div>' +
      '<div class="pv-aff">' + affs.map(esc).join(' · ') + '</div>' +
      '<div class="pv-actions">' +
        (unlocked()
          ? '<a class="btn pv-pdfbtn" href="?id=' + encodeURIComponent(key) + '&pdf=1">' + t('pv.pdf') + ' <small>' + pages + '</small></a>' +
            '<a class="btn line pv-dl" hidden download="OMNI2026_' + esc(key) + '.pdf">' + t('pv.dl') + '</a>'
          : '<button type="button" class="btn sec-open">🔒 ' + t('pv.pdf') + ' <small>' + pages + '</small></button>') +
        '<a class="btn line" href="../proceedings/">' + t('pv.full') + '</a>' +
        '<a class="btn line" href="../index.html#' + paper.anchor + '">' + t('pv.prog') + '</a>' +
      '</div>';
  }

  function renderLocked() {
    host.innerHTML = header(paper.title) + (S ? S.lockNotice() : '');
    document.title = paper.title + ' — OMNI 2026';
  }

  function render() {
    if (!paper) { host.innerHTML = '<p class="pv-note">' + t('pv.notfound') + '</p>'; return; }
    if (!unlocked()) { renderLocked(); return; }
    if (!data) { host.innerHTML = header(paper.title) + '<p class="pv-loading">' + t('pv.loading') + '</p>'; return; }
    var L = lang();
    var tr = (L !== 'en' && data[L]) || null;
    var body = {};
    ['title', 'abstract', 'keywords', 'ack'].forEach(function (k) { body[k] = (tr && tr[k]) || data.en[k]; });
    body.sections = (tr && tr.sections && tr.sections.length) ? tr.sections : data.en.sections;
    body.refs = data.en.refs;
    var translated = !!tr, partial = !!tr && !(tr.sections && tr.sections.length);
    var hasEq = (data.en.sections || []).some(function (s) {
      return (s.blocks || []).some(function (b) { return b.t === 'eq'; });
    });

    var html = header(body.title || paper.title);
    if (wantPdf) html += '<section class="pv-pdfview"><iframe title="PDF" class="viewer"></iframe></section>';
    html += '<p class="pv-note">' + (partial ? t('pv.partial') : translated ? t('pv.machine') : (L === 'en' ? '' : t('pv.missing'))) + '</p>';
    if (body.abstract) html += '<h2 class="sub">' + t('pv.abstract') + '</h2><p>' + esc(body.abstract) + '</p>';
    if (body.keywords) html += '<p class="pv-kw"><b>' + t('pv.keywords') + ':</b> ' + esc(body.keywords) + '</p>';
    if (hasEq) html += '<p class="pv-note">' + t('pv.eqnote') + '</p>';
    (body.sections || []).forEach(function (s) { html += sectionHtml(s); });
    if (body.ack) html += '<h2 class="sub">' + t('pv.ack') + '</h2><p>' + esc(body.ack) + '</p>';
    if (body.refs && body.refs.length) {
      html += '<h2 class="sub">' + t('pv.refs') + '</h2><ol class="pv-refs">' +
        body.refs.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ol>';
    }
    var n = data.en.imgs || 0;
    if (n) {
      var imgs = '';
      for (var i = 1; i <= n; i++) {
        imgs += '<figure><img alt="" data-enc="assets/pages/' + key + '-' + i + '.jpg">' +
          '<figcaption>' + t('pv.page_n').replace('{n}', paper.pages[0] + i - 1) + '</figcaption></figure>';
      }
      html += '<section class="pv-pages" id="printed"><h2 class="sub">' + t('pv.pages_t') + '</h2>' +
        '<p class="note">' + t('pv.pages_h') + '</p><div class="grid">' + imgs + '</div></section>';
    }
    host.innerHTML = html;
    document.title = (body.title || paper.title) + ' — OMNI 2026';
    loadMedia();
  }

  /* decrypt page images and this paper's PDF into blob URLs */
  function loadMedia() {
    if (!S) return;
    [].forEach.call(host.querySelectorAll('img[data-enc]'), function (img) {
      S.blobURL(img.getAttribute('data-enc'), 'image/jpeg').then(function (u) { img.src = u; }).catch(function () {});
    });
    var pdfPath = 'proceedings/papers/' + paper.pdf;
    var needPdf = wantPdf || host.querySelector('.pv-dl');
    if (!needPdf) return;
    S.blobURL(pdfPath, 'application/pdf').then(function (u) {
      pdfURL = u;
      var dl = host.querySelector('.pv-dl');
      if (dl) { dl.href = u; dl.hidden = false; }
      var frame = host.querySelector('.pv-pdfview iframe');
      if (frame) frame.src = u + '#view=FitH';
    }).catch(function () {});
  }

  function load() {
    if (!paper) { render(); return; }
    if (!unlocked()) { render(); return; }
    render();
    S.json('assets/papers-html/' + key + '.json')
      .then(function (j) { data = j; render(); })
      .catch(function () { data = { en: { title: paper.title, abstract: '', sections: [], refs: [] } }; render(); });
  }

  /* click a page image to see it full screen */
  host.addEventListener('click', function (e) {
    var img = e.target.closest && e.target.closest('.pv-pages img');
    if (!img || !img.src) return;
    var box = document.createElement('div');
    box.className = 'pv-zoom';
    box.innerHTML = '<img src="' + img.src + '" alt="">';
    box.addEventListener('click', function () { box.remove(); });
    document.body.appendChild(box);
  });

  if (S) {
    S.ready.then(load);
    document.addEventListener('omni:unlocked', load);
    document.addEventListener('omni:locked', function () { data = null; render(); });
  } else {
    load();
  }
  document.addEventListener('omni:lang', render);
})();
