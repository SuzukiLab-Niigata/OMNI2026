/* OMNI 2026 — certificates of presentation (participants only).
   One certificate per oral presentation, published encrypted at certificates/<code>.pdf.enc (tools/encrypt.mjs).
   The visitor enters the seminar password, picks their presentation and saves the decrypted PDF.
   Each download is reported to NOTIFY_URL (a Google Apps Script web app, tools/notify-apps-script.gs),
   which emails the organizer. Leave it empty to turn the notice off. */
(function () {
  var NOTIFY_URL = 'https://script.google.com/macros/s/AKfycbxPKq8nwcgWs70SJn09n0KrdzUSFtE_rlFUaRULYFxRGH_6UdMREkR09XIHDEBr_SLahg/exec';
  var CODES = ['KA', 'KB', 'A-1', 'A-2', 'A-3', 'A-4', 'A-5', 'A-6', 'A-7', 'B-1', 'B-2', 'B-3', 'B-4', 'B-5', 'B-6', 'B-7'];
  var GROUPS = [['keynote', 'sr.kn', 'Keynote Lectures'], ['A', 'sr.sa', 'Session A'], ['B', 'sr.sb', 'Session B']];

  var S = window.OMNISecure;
  var lock = document.getElementById('cert-lock'), ok = document.getElementById('cert-ok');
  var pick = document.getElementById('cert-pick'), who = document.getElementById('cert-who');
  var dl = document.getElementById('cert-dl'), open = document.getElementById('cert-open'), err = document.getElementById('cert-err');
  if (!S || !pick) return;

  var papers = {};
  (window.OMNI_PAPERS || []).forEach(function (p) { papers[p.code] = p; });
  function presenter(p) {
    var a = (p.authors || []).filter(function (x) { return x.presenter; })[0] || (p.authors || [])[0];
    return a ? a.name : '';
  }
  function t(k, en) {
    var lang = document.documentElement.lang, d = (window.I18N && window.I18N[lang]) || {};
    return (lang !== 'en' && d[k]) || en;
  }
  function fileName(code) {
    var name = presenter(papers[code] || {}).replace(/ı/g, 'i').normalize('NFD').replace(/[̀-ͯ]/g, '');
    return 'OMNI2026_Certificate_' + code + '_' + name.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') + '.pdf';
  }

  function build() {
    var keep = pick.value;
    while (pick.options.length > 1) pick.remove(1);
    [].slice.call(pick.querySelectorAll('optgroup')).forEach(function (g) { g.remove(); });
    GROUPS.forEach(function (g) {
      var og = document.createElement('optgroup');
      og.label = t(g[1], g[2]);
      CODES.forEach(function (code) {
        var p = papers[code];
        if (!p || p.group !== g[0]) return;
        var o = document.createElement('option');
        o.value = code;
        o.textContent = (p.group === 'keynote' ? p.id : code) + ' — ' + presenter(p);
        og.appendChild(o);
      });
      pick.appendChild(og);
    });
    pick.value = keep;
  }

  function state() {
    var unlocked = S.isUnlocked();
    lock.innerHTML = unlocked ? '' : S.lockNotice();
    ok.hidden = !unlocked;
    pick.disabled = !unlocked;
    var p = papers[pick.value];
    dl.disabled = !(unlocked && p);
    who.textContent = p ? p.title : '';
    open.hidden = true;
    err.hidden = true;
  }

  function fetchPdf() {
    return S.blobURL('certificates/' + pick.value + '.pdf', 'application/pdf');
  }
  function notify(code) {
    if (!NOTIFY_URL) return;
    var body = JSON.stringify({ code: code, name: presenter(papers[code] || {}), lang: document.documentElement.lang });
    // text/plain keeps this a "simple" request (no CORS preflight, which Apps Script does not answer)
    fetch(NOTIFY_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: body }).catch(function () {});
  }
  dl.addEventListener('click', function () {
    if (!pick.value) return;
    var code = pick.value;
    dl.disabled = true; err.hidden = true;
    fetchPdf().then(function (url) {
      var a = document.createElement('a');
      a.href = url; a.download = fileName(code);
      document.body.appendChild(a); a.click(); a.remove();
      open.href = url; open.hidden = false;
      notify(code);
    }).catch(function () { err.hidden = false; })
      .then(function () { dl.disabled = false; });
  });
  pick.addEventListener('change', state);

  build();
  state();
  S.ready.then(state);
  document.addEventListener('omni:unlocked', state);
  document.addEventListener('omni:locked', state);
  document.addEventListener('omni:lang', function () { build(); state(); });
})();
