/* OMNI 2026 — live "Now!!" bar during the seminar.
   Shows the item running right now (and the next one) in İzmir time, links to it, and marks it in the programme.
   Test any moment with ?now=2026-09-29T10:05 (İzmir local time). */
(function () {
  var bar = document.getElementById('now-bar');
  var slots = window.OMNI_SCHEDULE || [];
  if (!bar || !slots.length) return;
  var papers = {};
  (window.OMNI_PAPERS || []).forEach(function (p) { papers[p.id] = p; });

  var EN = { 'now.now': 'Now!!', 'now.next': 'Next', 'now.ended': "Today's programme has ended", 'now.soon': 'Starting soon' };
  function t(k) {
    var lang = document.documentElement.lang;
    var dict = (window.I18N && window.I18N[lang]) || {};
    return (lang !== 'en' && dict[k]) || EN[k];
  }
  function label(slot) {
    if (slot.id) {
      var p = papers[slot.id];
      return { code: slot.id, text: p ? p.title : '', anchor: p ? p.anchor : slot.anchor };
    }
    var lang = document.documentElement.lang;
    var dict = (window.I18N && window.I18N[lang]) || {};
    var name = (lang !== 'en' && dict[slot.key]) || null;
    return { code: '', text: name || defaultLabel(slot.key), anchor: slot.anchor || 'glance' };
  }
  var FALLBACK = {
    'it.opening': 'Opening', 'it.coffee': 'Coffee Break', 'it.photo': 'Group Photo', 'it.lunch': 'Lunch',
    'it.closing': 'Closing Remarks', 'it.banquet': 'Banquet', 'it.dep': 'Departure', 'it.tour': 'Technical Tour', 'it.return': 'Return'
  };
  function defaultLabel(key) { return FALLBACK[key] || ''; }

  /* İzmir is UTC+3 all year, so a local time maps to a fixed UTC instant */
  function stamp(day, hhmm) {
    var p = hhmm.split(':');
    return Date.UTC(2026, 8, day, +p[0] - 3, +p[1]);
  }
  function testTime() {
    try {
      var q = new URLSearchParams(location.search).get('now');
      if (!q) return null;
      var m = q.match(/^2026-09-(\d\d)T(\d\d):(\d\d)$/);
      return m ? Date.UTC(2026, 8, +m[1], +m[2] - 3, +m[3]) : null;
    } catch (e) { return null; }
  }

  var marked = null;
  function render() {
    var now = testTime() || Date.now();
    var dayStart = Math.min(stamp(29, '08:00'), stamp(30, '08:00'));
    var dayEnd = stamp(30, '13:00');
    if (now < dayStart - 0 || now > dayEnd) { bar.hidden = true; unmark(); return; }
    /* outside the two seminar days (e.g. the evening between them) keep it quiet */
    var d29 = now >= stamp(29, '08:00') && now <= stamp(29, '21:30');
    var d30 = now >= stamp(30, '08:00') && now <= stamp(30, '13:00');
    if (!d29 && !d30) { bar.hidden = true; unmark(); return; }

    var current = null, next = null;
    for (var i = 0; i < slots.length; i++) {
      var s = stamp(slots[i].d, slots[i].s), e = stamp(slots[i].d, slots[i].e);
      if (now >= s && now < e) { current = slots[i]; next = slots[i + 1] || null; break; }
      if (now < s) { next = slots[i]; break; }
    }
    var html = '';
    if (current) {
      var c = label(current);
      html = '<span class="now-tag">' + t('now.now') + '</span>' +
        (c.code ? '<b>' + c.code + '</b>' : '') +
        '<span class="now-time">' + current.s + '–' + current.e + '</span>' +
        '<span class="now-title">' + c.text + '</span>';
      bar.setAttribute('href', '#' + (c.anchor || 'glance'));
      mark(c.anchor);
    } else if (next) {
      var n0 = label(next);
      html = '<span class="now-tag soon">' + t('now.soon') + '</span>' +
        (n0.code ? '<b>' + n0.code + '</b>' : '') +
        '<span class="now-time">' + next.s + '</span>' +
        '<span class="now-title">' + n0.text + '</span>';
      bar.setAttribute('href', '#' + (n0.anchor || 'glance'));
      unmark();
    } else {
      html = '<span class="now-tag done">' + t('now.ended') + '</span>';
      bar.setAttribute('href', '#glance');
      unmark();
    }
    if (current && next) {
      var n = label(next);
      var nName = n.code || (n.text.length > 28 ? n.text.slice(0, 28) + '…' : n.text);
      html += '<span class="now-next">' + t('now.next') + ': ' + next.s + ' ' + nName + '</span>';
    }
    bar.innerHTML = html;
    bar.hidden = false;
  }
  function mark(anchor) {
    if (marked && marked !== anchor) unmark();
    var el = anchor && document.getElementById(anchor);
    if (el) { el.classList.add('is-now'); marked = anchor; }
  }
  function unmark() {
    if (!marked) return;
    var el = document.getElementById(marked);
    if (el) el.classList.remove('is-now');
    marked = null;
  }

  render();
  setInterval(render, 20000);
  document.addEventListener('omni:lang', render);
})();
