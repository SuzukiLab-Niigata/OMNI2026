/* OMNI 2026 — adds "this paper only" links to every entry in the programme.
   Each presentation has its own PDF cut out of the proceedings (proceedings/papers/<id>.pdf). */
(function () {
  var papers = window.OMNI_PAPERS || [];
  if (!papers.length) return;
  var EN = { 'pl.pdf': 'Paper (PDF)', 'pl.pages': 'pp. {a}–{b}', 'pl.html': 'HTML' };
  function t(k) {
    var lang = document.documentElement.lang;
    var dict = (window.I18N && window.I18N[lang]) || {};
    return (lang !== 'en' && dict[k]) || EN[k];
  }
  function render() {
    papers.forEach(function (p) {
      if (!p.pdf) return;
      var host = document.getElementById(p.anchor);
      if (!host) return;
      var slot = host.classList.contains('ktab') ? host : (host.querySelector('.ti') ? host.querySelector('.ti').parentNode : host);
      var box = host.querySelector('.paper-link');
      if (!box) {
        box = document.createElement('a');
        box.className = 'paper-link';
        box.href = 'archive/paper.html?id=' + encodeURIComponent(p.code || p.id) + '&pdf=1';
        slot.appendChild(box);
      }
      box.innerHTML = '<span>' + t('pl.pdf') + '</span> <small>' + t('pl.pages').replace('{a}', p.pages[0]).replace('{b}', p.pages[1]) + '</small>';
      var web = host.querySelector('.paper-web');
      if (!web) {
        web = document.createElement('a');
        web.className = 'paper-link paper-web';
        web.href = 'archive/paper.html?id=' + encodeURIComponent(p.code || p.id);
        slot.appendChild(web);
      }
      web.textContent = t('pl.html');
    });
  }
  render();
  document.addEventListener('omni:lang', render);
})();
