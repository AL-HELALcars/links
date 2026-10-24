(function () {
  'use strict';
  var C = window.ALHELAL_CONFIG || {};
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ICONS = {
    phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M3 21l1.6-4.8A8.5 8.5 0 1 1 8 19.6L3 21z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2z"/></svg>',
    fb: '<svg class="f" viewBox="0 0 24 24"><path d="M14 8V6.5c0-.7.3-1 1-1h2V2h-3c-3 0-4 2-4 4v2H8v3.5h2V22h4v-10.5h2.7L17 8h-3z"/></svg>',
    ig: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/></svg>',
    tt: '<svg viewBox="0 0 24 24"><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.3 2.5 2 4.2 5 4.5"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 21s7-6 7-11.5a7 7 0 0 0-14 0C5 15 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    go: '<svg class="go" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>'
  };

  function digits(v) { return String(v || '').replace(/\D/g, ''); }
  function validPhone(v) {
    var d = digits(v);
    return /^\+?[\d\s\-()]+$/.test(v) && d.length >= 8 && d.length <= 15;
  }
  function validUrl(v, hosts) {
    try {
      var u = new URL(v);
      return u.protocol === 'https:' && hosts.split(',').some(function (h) {
        return u.hostname === h || u.hostname.slice(-h.length - 1) === '.' + h;
      });
    } catch (e) { return false; }
  }
  function pretty(v) { // +201014696980 -> +20 101 469 6980
    var d = digits(v);
    return (d.length === 12 && d.slice(0, 2) === '20')
      ? '+20 ' + d.slice(2, 5) + ' ' + d.slice(5, 8) + ' ' + d.slice(8)
      : (v.trim()[0] === '+' ? '+' : '') + d;
  }

  document.querySelectorAll('.ic').forEach(function (e) { e.innerHTML = ICONS[e.dataset.i] || ''; });

  document.querySelectorAll('.card[data-key]').forEach(function (a) {
    var v = String(C[a.dataset.key] || '').trim(), t = a.dataset.type, href = '';
    var val = a.querySelector('.val');
    if (v) {
      if (t === 'tel' && validPhone(v)) href = 'tel:' + (v[0] === '+' ? '+' : '') + digits(v);
      else if (t === 'wa' && validPhone(v)) href = 'https://wa.me/' + digits(v) + '?text=' + encodeURIComponent(C.WHATSAPP_GREETING || '');
      else if (t === 'url' && validUrl(v, a.dataset.host)) href = v;
      if (!href) console.warn('ALHELAL config: invalid value for ' + a.dataset.key);
    }
    var name = a.querySelector('b').textContent, sub = a.querySelector('.sub');
    if (!href) { a.setAttribute('role', 'link'); a.setAttribute('aria-disabled', 'true'); return; }
    a.href = href;
    if (t !== 'tel') { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    if (val && t !== 'url') val.textContent = pretty(v);
    if (!a.classList.contains('mini')) a.insertAdjacentHTML('beforeend', ICONS.go);
    a.setAttribute('aria-label', name + (sub ? ' - ' + sub.textContent : '') + (t !== 'url' ? ' ' + pretty(v) : ''));
    // light that follows the pointer (mouse only; touch uses the pressed state)
    a.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = a.getBoundingClientRect();
      a.style.setProperty('--x', (e.clientX - r.left) + 'px');
      a.style.setProperty('--y', (e.clientY - r.top) + 'px');
    });
  });

  /* Light trails (canvas): few thin streaks drifting past, like cars at night. Skipped on reduced motion / weak devices. */
  (function () {
    var c = document.getElementById('fx');
    if (!c || reduce || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)) { if (c) c.style.display = 'none'; return; }
    var g = c.getContext('2d'), W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.5), S = [], last = 0, run = true;
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function make(first) {
      var dir = Math.random() < .5 ? 1 : -1, len = rnd(90, 280);
      return { d: dir, len: len, y: H * rnd(.52, .97), x: first ? rnd(-len, W + len) : (dir > 0 ? -len : W + len),
               v: rnd(40, 150), a: rnd(.12, .36), w: rnd(.8, 1.8), b: Math.random() < .35 };
    }
    function size() {
      W = c.clientWidth; H = c.clientHeight; c.width = W * dpr; c.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      S = []; for (var i = 0; i < (W < 600 ? 7 : 14); i++) S.push(make(true));
    }
    function frame(t) {
      if (!run) return; requestAnimationFrame(frame);
      if (t - last < 32) return; var dt = Math.min((t - last) / 1000, .1); last = t;
      g.clearRect(0, 0, W, H); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      S.forEach(function (s, i) {
        s.x += s.d * s.v * dt;
        if ((s.d > 0 && s.x - s.len > W) || (s.d < 0 && s.x + s.len < 0)) { S[i] = make(false); return; }
        var x2 = s.x - s.d * s.len, gr = g.createLinearGradient(s.x, 0, x2, 0), col = s.b ? '120,170,255' : '225,232,242';
        gr.addColorStop(0, 'rgba(' + col + ',' + s.a + ')'); gr.addColorStop(1, 'rgba(' + col + ',0)');
        g.strokeStyle = gr; g.lineWidth = s.w; g.beginPath(); g.moveTo(s.x, s.y); g.lineTo(x2, s.y); g.stroke();
      });
    }
    size(); addEventListener('resize', size);
    document.addEventListener('visibilitychange', function () { run = !document.hidden; if (run) requestAnimationFrame(frame); });
    requestAnimationFrame(frame);
  })();

  /* 3D tilt of the logo that follows the mouse (desktop only) */
  (function () {
    var l = document.getElementById('logo'), pend = false, ex = 0, ey = 0;
    if (!l || reduce || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    addEventListener('pointermove', function (e) {
      ex = e.clientX; ey = e.clientY; if (pend || doc.classList.contains('hold')) return; pend = true;
      requestAnimationFrame(function () {
        pend = false;
        l.style.setProperty('--ry', ((ex / innerWidth - .5) * 9).toFixed(2) + 'deg');
        l.style.setProperty('--rx', (-(ey / innerHeight - .5) * 6).toFixed(2) + 'deg');
      });
    });
  })();

  /* Intro: beam -> logo opens -> logo flies into its real position. Never blocks the page. */
  var intro = document.getElementById('intro'), logo = document.getElementById('logo');
  if (!intro || !logo) return;
  var seen = false;
  try { seen = !!sessionStorage.getItem('ah-seen'); sessionStorage.setItem('ah-seen', '1'); } catch (e) {}
  if (reduce) { intro.remove(); return; }
  if (seen) { doc.style.setProperty('--t', '.15s'); intro.remove(); return; }

  var finished = false;
  function finish(fast) {
    if (finished) return; finished = true;
    doc.classList.remove('hold');
    if (fast) { intro.classList.add('skip'); setTimeout(function () { intro.remove(); }, 350); }
    else intro.remove();
  }
  doc.classList.add('hold');
  addEventListener('pointerdown', function () { finish(true); }, { once: true });
  addEventListener('keydown', function () { finish(true); }, { once: true });
  setTimeout(function () { finish(true); }, 4200); // hard safety net

  var img = logo.querySelector('img');
  (img.decode ? img.decode() : Promise.resolve()).catch(function () {}).then(function () {
    if (finished) return;
    var il = intro.querySelector('.il'), veil = intro.querySelector('.veil');
    if (!il.animate) { setTimeout(function () { finish(false); }, 2200); return; }
    var a = il.getBoundingClientRect(), b = logo.getBoundingClientRect();
    var dx = (b.left + b.width / 2) - (a.left + a.width / 2);
    var dy = (b.top + b.height / 2) - (a.top + a.height / 2);
    var s = b.width / a.width;
    var fly = il.animate(
      [{ transform: 'none' }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')' }],
      { duration: 850, delay: 1550, easing: 'cubic-bezier(.65,0,.2,1)', fill: 'forwards' });
    veil.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 750, delay: 1650, fill: 'forwards' });
    fly.onfinish = function () { finish(false); };
  });
})();
