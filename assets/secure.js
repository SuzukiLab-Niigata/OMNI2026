/* OMNI 2026 — participants-only content.
   Abstracts, papers, page images and the proceedings PDF are published encrypted (tools/encrypt.py).
   The visitor enters the seminar password once; the key is derived here with PBKDF2 and the files are
   decrypted in the browser with AES-GCM. Nothing is sent to a server. */
(function () {
  var script = document.currentScript;
  var BASE = script ? script.src.replace(/assets\/secure\.js.*$/, '') : '';
  var STORE = 'omni-key';
  var meta = null, key = null;

  function b64(s) { var bin = atob(s), a = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
  function toB64(buf) { var s = '', a = new Uint8Array(buf); for (var i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); }

  var ready = fetch(BASE + 'assets/secure/meta.json', { cache: 'no-store' })
    .then(function (r) { return r.json(); })
    .then(function (m) {
      meta = m;
      try {
        var saved = JSON.parse(localStorage.getItem(STORE) || sessionStorage.getItem(STORE) || 'null');
        if (saved && saved.salt === m.salt) {
          return crypto.subtle.importKey('raw', b64(saved.key), 'AES-GCM', false, ['decrypt']).then(function (k) {
            return check(k).then(function (ok) { if (ok) key = k; });
          });
        }
      } catch (e) {}
    })
    .catch(function () {});

  function check(k) {
    var blob = b64(meta.check);
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv: blob.slice(0, 12) }, k, blob.slice(12))
      .then(function () { return true; }, function () { return false; });
  }

  function unlock(password, remember) {
    return ready.then(function () {
      if (!meta) return false;
      return crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
        .then(function (base) {
          return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: b64(meta.salt), iterations: meta.iter }, base, 256);
        })
        .then(function (bits) {
          return crypto.subtle.importKey('raw', bits, 'AES-GCM', false, ['decrypt']).then(function (k) {
            return check(k).then(function (ok) {
              if (!ok) return false;
              key = k;
              try {
                var store = remember ? localStorage : sessionStorage;
                store.setItem(STORE, JSON.stringify({ salt: meta.salt, key: toB64(bits) }));
              } catch (e) {}
              document.dispatchEvent(new CustomEvent('omni:unlocked'));
              return true;
            });
          });
        });
    });
  }

  function decrypt(path) {
    if (!key) return Promise.reject(new Error('locked'));
    return fetch(BASE + path + '.enc')
      .then(function (r) { if (!r.ok) throw new Error('missing'); return r.arrayBuffer(); })
      .then(function (buf) {
        var a = new Uint8Array(buf);
        return crypto.subtle.decrypt({ name: 'AES-GCM', iv: a.slice(0, 12) }, key, a.slice(12));
      });
  }
  var urls = {};
  function blobURL(path, mime) {
    if (urls[path]) return Promise.resolve(urls[path]);
    return decrypt(path).then(function (buf) {
      urls[path] = URL.createObjectURL(new Blob([buf], { type: mime }));
      return urls[path];
    });
  }
  function json(path) {
    return decrypt(path).then(function (buf) { return JSON.parse(new TextDecoder().decode(buf)); });
  }
  function forget() {
    key = null;
    try { localStorage.removeItem(STORE); sessionStorage.removeItem(STORE); } catch (e) {}
    document.dispatchEvent(new CustomEvent('omni:locked'));
  }

  /* ---------- password dialog ---------- */
  var EN = {
    'sec.title': 'Participants only', 'sec.lead': 'Enter the seminar password to read the abstracts and papers.',
    'sec.ph': 'Seminar password', 'sec.btn': 'Unlock', 'sec.cancel': 'Cancel', 'sec.err': 'That password is not correct.',
    'sec.remember': 'Remember on this device', 'sec.working': 'Checking…',
    'sec.locked': 'Participants only — enter the password to read', 'sec.open': 'Enter password'
  };
  function t(k) {
    var lang = document.documentElement.lang;
    var d = (window.I18N && window.I18N[lang]) || {};
    return (lang !== 'en' && d[k]) || EN[k];
  }
  var waiting = null;
  function ask() {
    if (key) return Promise.resolve(true);
    if (waiting) return waiting;
    waiting = new Promise(function (resolve) {
      var wrap = document.createElement('div');
      wrap.className = 'sec-modal';
      wrap.innerHTML =
        '<form class="sec-box" autocomplete="on">' +
          '<div class="sec-icon" aria-hidden="true">🔒</div>' +
          '<h3>' + t('sec.title') + '</h3><p>' + t('sec.lead') + '</p>' +
          '<input type="password" name="password" autocomplete="current-password" placeholder="' + t('sec.ph') + '" required>' +
          '<label class="sec-rem"><input type="checkbox" checked> ' + t('sec.remember') + '</label>' +
          '<p class="sec-err" hidden>' + t('sec.err') + '</p>' +
          '<div class="sec-actions"><button class="btn" type="submit">' + t('sec.btn') + '</button>' +
          '<button class="btn line sec-cancel" type="button">' + t('sec.cancel') + '</button></div>' +
        '</form>';
      document.body.appendChild(wrap);
      var form = wrap.querySelector('form'), input = form.querySelector('input[type=password]');
      var err = form.querySelector('.sec-err'), submit = form.querySelector('button[type=submit]');
      setTimeout(function () { input.focus(); }, 30);
      function done(ok) { wrap.remove(); waiting = null; resolve(ok); }
      form.querySelector('.sec-cancel').addEventListener('click', function () { done(false); });
      wrap.addEventListener('click', function (e) { if (e.target === wrap) done(false); });
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        err.hidden = true; submit.disabled = true; submit.textContent = t('sec.working');
        unlock(input.value, form.querySelector('.sec-rem input').checked).then(function (ok) {
          submit.disabled = false; submit.textContent = t('sec.btn');
          if (ok) done(true); else { err.hidden = false; input.select(); }
        });
      });
    });
    return waiting;
  }

  /* inline "locked" notice used by pages */
  function lockNotice() {
    return '<div class="sec-lock"><span>🔒 ' + t('sec.locked') + '</span>' +
      '<button type="button" class="btn small sec-open">' + t('sec.open') + '</button></div>';
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.sec-open')) ask();
  });

  /* keynote abstracts on the home page */
  function fillMain() {
    var slots = document.querySelectorAll('[data-secure]');
    if (!slots.length) return;
    if (!key) { [].forEach.call(slots, function (s) { s.innerHTML = lockNotice(); }); return; }
    json('assets/secure/main.json').then(function (d) {
      var lang = document.documentElement.lang;
      [].forEach.call(slots, function (s) {
        var k = s.getAttribute('data-secure');
        s.textContent = (d[lang] && d[lang][k]) || d.en[k] || '';
      });
    }).catch(function () {});
  }
  ready.then(fillMain);
  document.addEventListener('omni:unlocked', fillMain);
  document.addEventListener('omni:lang', fillMain);

  window.OMNISecure = {
    ready: ready, ask: ask, unlock: unlock, forget: forget,
    isUnlocked: function () { return !!key; },
    decrypt: decrypt, blobURL: blobURL, json: json, lockNotice: lockNotice, base: BASE
  };
})();
