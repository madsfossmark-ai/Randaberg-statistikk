/* Animasjoner for demoversjonen av statistikksiden (profil «Balansert», valgt 04.11.2026).
 * Legges oppå den vanlige siden uten å endre den: etter hver tegning av #app sammenlignes tallene, stolpene og grafene
 * med forrige tegning, og det som har endret seg glir over til ny verdi. Ny visning tones inn.
 * Sluttverdiene er alltid de siden selv har skrevet. Animasjonen endrer aldri et tall, bare veien dit.
 * prefers-reduced-motion: ingen animasjon. */
(function () {
  'use strict';
  var PROFIL = { dur: 350, stagger: 30, makStagger: 300 };
  var ease = function (p) { return 1 - Math.pow(1 - p, 4); };
  var EASE_CSS = 'cubic-bezier(.25,1,.5,1)';
  var mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var rolig = function () { return !!(mq && mq.matches); };
  var forrige = { vis: null, tall: {}, stolper: {}, svg: {} };
  var app = null, aktive = [], raf = 0;

  // ---------- rAF-motor for tall og SVG-attributter ----------
  function tick(now) {
    aktive = aktive.filter(function (a) {
      var p = Math.max(0, Math.min(1, (now - a.t0) / a.dur));
      a.on(ease(p));
      return p < 1;
    });
    raf = aktive.length ? requestAnimationFrame(tick) : 0;
  }
  function tween(on, delay, dur) {
    aktive.push({ t0: performance.now() + (delay || 0), dur: dur || PROFIL.dur, on: on });
    on(0);
    if (!raf) raf = requestAnimationFrame(tick);
  }

  // ---------- Hjelpere ----------
  function sti(el) {   // stabil nøkkel for samme element i neste tegning
    var deler = [];
    while (el && el !== app) {
      var i = 0, s = el;
      while ((s = s.previousElementSibling)) if (s.tagName === el.tagName) i++;
      deler.push(el.tagName + (el.classList.length ? '.' + Array.prototype.slice.call(el.classList).filter(function (c) { return !/^(lo|mid|hi|w|l|on|aktiv)$/.test(c); }).join('.') : '') + ':' + i);
      el = el.parentElement;
    }
    return deler.reverse().join('>');
  }
  var TALL_RE = /^(\+?)(−|-)?(\d+(?:[.,]\d+)?)(\s?%)?$/;
  function lesTall(t) {
    var m = TALL_RE.exec(t.trim()); if (!m) return null;
    var tekst = m[3], des = (tekst.split(/[.,]/)[1] || '').length;
    return { v: (m[2] ? -1 : 1) * parseFloat(tekst.replace(',', '.')), des: des, komma: tekst.indexOf(',') >= 0, pre: m[1] || '', neg: m[2] || '-', suf: m[4] || '' };
  }
  function skriv(t, v) {
    var s = Math.abs(v).toFixed(t.des); if (t.komma) s = s.replace('.', ',');
    return t.pre + (v < 0 && Math.abs(v) >= Math.pow(10, -t.des) / 2 ? t.neg : '') + s + t.suf;
  }
  function visNokkel() {
    var fane = app.querySelector('.navtab[aria-current="page"]');
    var tittel = app.querySelector('.bar .title, h1, .hero h2');
    return (fane ? fane.textContent : '') + '|' + (tittel ? tittel.textContent.trim().slice(0, 80) : '');
  }

  // ---------- Animer etter hver tegning ----------
  var TALL_STORE = '.kpi .display, .tile .big, .kpi2 b';   // store nøkkeltall: teller opp når visningen åpnes
  function animer() {
    var vis = visNokkel(), ny = vis !== forrige.vis, ut = { vis: vis, tall: {}, stolper: {}, svg: {} };
    var r = rolig();

    // 1) Ny visning: innholdet tones inn panel for panel
    if (ny && !r && forrige.vis !== null) {
      var deler = Array.prototype.filter.call(app.children, function (e) { return e.offsetParent !== null; });
      deler.forEach(function (e, i) {
        if (e.animate) e.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
          { duration: PROFIL.dur, delay: Math.min(i * PROFIL.stagger, PROFIL.makStagger), easing: EASE_CSS, fill: 'backwards' });
      });
    }

    // 2) Tall: store nøkkeltall teller opp ved ny visning; alle tall glir fra forrige verdi i samme visning
    var store = Array.prototype.slice.call(app.querySelectorAll(TALL_STORE));
    var alle = Array.prototype.slice.call(app.querySelectorAll('td, .display, .big, .kpi2 b, .res-pill, .tall, .num'));
    var sett = new Set();
    alle.concat(store).forEach(function (el) {
      if (sett.has(el) || el.children.length) return; sett.add(el);
      var t = lesTall(el.textContent); if (!t) return;
      var k = sti(el); ut.tall[k] = t.v;
      if (r) return;
      var fra = ny ? (store.indexOf(el) >= 0 ? 0 : null) : forrige.tall[k];
      if (fra == null || fra === t.v) return;
      var slutt = el.textContent, i = store.indexOf(el);
      tween(function (e) { el.textContent = e >= 1 ? slutt : skriv(t, fra + (t.v - fra) * e); }, ny ? Math.min(Math.max(i, 0) * PROFIL.stagger, PROFIL.makStagger) : 0);
    });

    // 3) Stolper (.avgbar > i): vokser fra 0 ved ny visning, ellers fra forrige bredde
    Array.prototype.forEach.call(app.querySelectorAll('.avgbar > i, [class*="bar"] > i[style*="width"]'), function (el, i) {
      var w = parseFloat(el.style.width); if (!isFinite(w)) return;
      var k = sti(el); ut.stolper[k] = w;
      if (r || !el.animate) return;
      var fra = ny ? 0 : forrige.stolper[k];
      if (fra == null || Math.abs(fra - w) < 0.1) return;
      var skala = w > 0 ? Math.max(0, fra / w) : 1;
      el.style.transformOrigin = 'left center';
      el.animate([{ transform: 'scaleX(' + skala + ')' }, { transform: 'none' }],
        { duration: PROFIL.dur, delay: ny ? Math.min(i * PROFIL.stagger / 2, PROFIL.makStagger) : 0, easing: EASE_CSS, fill: 'backwards' });
    });

    // 4) Grafer (SVG): samme graf med samme form glir over (tallene i koordinatene tweenes); ny graf tegnes inn
    Array.prototype.forEach.call(app.querySelectorAll('svg'), function (svg) {
      var ks = sti(svg), elementer = svg.querySelectorAll('path, polyline, line, circle, rect, text');
      Array.prototype.forEach.call(elementer, function (el, i) {
        var k = ks + '#' + i + el.tagName, attr = attrFor(el), verdi = {};
        attr.forEach(function (a) { verdi[a] = el.getAttribute(a); });
        ut.svg[k] = verdi;
        if (r) return;
        var gml = forrige.svg[k];
        if (!ny && gml) { morph(el, attr, gml, verdi); return; }
        if (ny || !gml) tegnInn(el, i);
      });
    });
    forrige = ut;
  }
  function attrFor(el) {
    switch (el.tagName.toLowerCase()) {
      case 'path': return ['d']; case 'polyline': return ['points']; case 'line': return ['x1', 'y1', 'x2', 'y2'];
      case 'circle': return ['cx', 'cy', 'r']; case 'rect': return ['x', 'y', 'width', 'height']; default: return ['x', 'y'];
    }
  }
  var NUM = /-?\d*\.?\d+(?:e-?\d+)?/g;
  function morph(el, attr, gml, ny) {
    attr.forEach(function (a) {
      var g = gml[a], n = ny[a]; if (g == null || n == null || g === n) return;
      var gt = g.match(NUM) || [], nt = n.match(NUM) || [];
      if (gt.length !== nt.length || g.replace(NUM, '#') !== n.replace(NUM, '#')) return;   // ulik form: vis ny direkte
      var skjelett = n.split(NUM), fra = gt.map(Number), til = nt.map(Number);
      tween(function (e) {
        if (e >= 1) { el.setAttribute(a, n); return; }
        var s = skjelett[0]; for (var i = 0; i < til.length; i++) s += (fra[i] + (til[i] - fra[i]) * e).toFixed(2) + skjelett[i + 1];
        el.setAttribute(a, s);
      });
    });
  }
  function tegnInn(el, i) {
    if (!el.animate) return;
    var tag = el.tagName.toLowerCase(), fill = el.getAttribute('fill'), stroke = el.getAttribute('stroke') || getComputedStyle(el).stroke;
    var linje = (tag === 'path' || tag === 'polyline') && (fill === 'none' || getComputedStyle(el).fill === 'none') && stroke && stroke !== 'none';
    if (linje && el.getTotalLength) {
      var L = el.getTotalLength(); if (!(L > 0)) return;
      var gammel = el.getAttribute('stroke-dasharray');
      if (gammel) { el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: PROFIL.dur * 1.5, easing: EASE_CSS, fill: 'backwards' }); return; }
      el.style.strokeDasharray = L; el.style.strokeDashoffset = L;
      var a = el.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: PROFIL.dur * 2, easing: EASE_CSS, fill: 'forwards' });
      a.onfinish = function () { el.style.strokeDasharray = ''; el.style.strokeDashoffset = ''; a.cancel(); };
    } else if (tag === 'circle') {
      el.style.transformBox = 'fill-box'; el.style.transformOrigin = 'center';
      el.animate([{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'none' }], { duration: PROFIL.dur, delay: Math.min(120 + i * PROFIL.stagger / 2, 600), easing: EASE_CSS, fill: 'backwards' });
    }
  }

  // ---------- Start ----------
  function start() {
    app = document.getElementById('app'); if (!app) return;
    var venter = false;
    new MutationObserver(function (poster) {
      // Bare når siden har tegnet nye elementer. Våre egne tall-oppdateringer legger bare til tekst og hoppes over.
      var nyTegning = poster.some(function (p) { return Array.prototype.some.call(p.addedNodes, function (n) { return n.nodeType === 1; }); });
      if (!nyTegning || venter) return; venter = true;
      // Kjøres som mikrooppgave rett etter at siden har tegnet, før skjermen oppdateres: ingen blink med sluttverdien
      Promise.resolve().then(function () { venter = false; try { animer(); } catch (e) { console.error('Animasjon', e); } });
    }).observe(app, { childList: true, subtree: true });
    animer();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
