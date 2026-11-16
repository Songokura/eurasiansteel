(function () {
  'use strict';

  /* Телефон и WhatsApp - менять только здесь */
  var PHONE = '77713457499';
  var PHONE_TEXT = '+7 771 345 74 99';
  var EMAIL = 'info.eurasiansteel@gmail.com';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = !!window.gsap; /* библиотеки движения грузятся после первой отрисовки, см. loadVendor */
  /* cubic-bezier(.2,.7,.2,1) для GSAP */
  function bez(x) {
    var x1 = 0.2, y1 = 0.7, x2 = 0.2, y2 = 1, t = x, i, cx, d;
    for (i = 0; i < 6; i++) {
      cx = 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t - x;
      d = 3 * (1 - t) * (1 - t) * x1 + 6 * (1 - t) * t * (x2 - x1) + 3 * t * t * (1 - x2);
      if (Math.abs(d) < 1e-6) break; t -= cx / d;
    }
    return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  }

  /* ---------- контакты ---------- */
  var dict = null;
  function waUrl(text) { return 'https://wa.me/' + PHONE + (text ? '?text=' + encodeURIComponent(text) : ''); }
  function waText(el) {
    var k = el.getAttribute('data-wa-key');
    return (dict && k && dict[k]) || el.getAttribute('data-wa-text') || '';
  }
  function applyContacts() {
    $$('[data-tel]').forEach(function (a) { a.href = 'tel:+' + PHONE; });
    $$('[data-phone]').forEach(function (n) { n.textContent = PHONE_TEXT; });
    $$('a[data-wa]').forEach(function (a) { a.href = waUrl(waText(a)); });
  }

  /* ---------- языки ---------- */
  var LANGS = { ru: null, kk: 'SITE_KK', en: 'SITE_EN' };
  var ruStore = null;
  var ver = (function () { var s = document.currentScript; var m = s && s.src.match(/[?&]v=([^&]+)/); return m ? m[1] : ''; })();
  function snapshot() {
    ruStore = { t: {}, ph: {}, alt: {} };
    $$('[data-i18n]').forEach(function (n) { var k = n.getAttribute('data-i18n'); if (!(k in ruStore.t)) ruStore.t[k] = n.innerHTML; });
    $$('[data-i18n-ph]').forEach(function (n) { ruStore.ph[n.getAttribute('data-i18n-ph')] = n.placeholder; });
    $$('[data-i18n-alt]').forEach(function (n) { ruStore.alt[n.getAttribute('data-i18n-alt')] = n.alt; });
    ruStore.title = document.title;
  }
  function paint(lang) {
    var d = dict;
    $$('[data-i18n]').forEach(function (n) {
      var k = n.getAttribute('data-i18n');
      var v = d && d[k] != null ? d[k] : ruStore.t[k];
      if (v != null && n.innerHTML !== v) n.innerHTML = v;
    });
    $$('[data-i18n-ph]').forEach(function (n) { var k = n.getAttribute('data-i18n-ph'); n.placeholder = (d && d[k]) || ruStore.ph[k]; });
    $$('[data-i18n-alt]').forEach(function (n) { var k = n.getAttribute('data-i18n-alt'); n.alt = (d && d[k]) || ruStore.alt[k] || ruStore.t[k] || n.alt; });
    document.title = (d && d['meta.title']) || ruStore.title;
    html.lang = lang;
    $$('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang)); });
    applyContacts();
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }
  function setLang(lang, save) {
    if (!(lang in LANGS)) lang = 'ru';
    if (save) { try { localStorage.setItem('lang', lang); } catch (e) {} }
    var g = LANGS[lang];
    if (!g) { dict = null; paint('ru'); return; }
    if (window[g]) { dict = window[g]; paint(lang); return; }
    var s = document.createElement('script');
    s.src = 'assets/lang/' + lang + '.js' + (ver ? '?v=' + ver : '');
    s.onload = function () { dict = window[g] || null; paint(dict ? lang : 'ru'); };
    document.head.appendChild(s);
  }
  function initLang() {
    snapshot();
    $$('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); }); });
    var q = (location.search.match(/[?&]lang=(ru|kk|en)/) || [])[1], saved = null;
    try { saved = localStorage.getItem('lang'); } catch (e) {}
    var start = q || saved || 'ru';
    if (start !== 'ru') setLang(start, false); else applyContacts();
  }

  /* ---------- шапка и меню ---------- */
  function initHeader() {
    var hdr = $('#hdr'), burger = $('#burger');
    var onScroll = function () { hdr.classList.toggle('is-stuck', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    function close() { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); if (window.__lenis) window.__lenis.start(); }
    burger.addEventListener('click', function () {
      var open = !document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', String(open));
      if (window.__lenis) { open ? window.__lenis.stop() : window.__lenis.start(); }
    });
    $$('#nav a').forEach(function (a) { a.addEventListener('click', close); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    var links = $$('.nav > a');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          links.forEach(function (l) { l.classList.toggle('is-on', l.getAttribute('href') === '#' + e.target.id); });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      links.forEach(function (l) { var t = $(l.getAttribute('href')); if (t) io.observe(t); });
    }
  }

  /* ---------- плавная прокрутка ---------- */
  function initSmooth() {
    if (reduce || !window.Lenis || !hasGsap) return;
    var lenis = new Lenis({ duration: 1.05, smoothWheel: true, anchors: { offset: -84 } });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- сцена склада ---------- */
  /* Сцена (150 КБ) лежит файлом assets/scene.svg: html первого экрана лёгкий, на телефоне сцена
     ниже первого экрана и подгружается следом. Место под неё держит .scene-slot той же пропорции. */
  var RU_EXTRA = { 'hero.stop': 'Остановить показ' };
  var MOBILE_VB = '172 76 1060 860';
  function fitScene(svg) {
    var m = window.matchMedia('(max-width:760px)').matches;
    svg.setAttribute('viewBox', m ? MOBILE_VB : '0 0 1276 990');
    var slot = $('.scene-wrap');
    if (slot) slot.classList.toggle('is-mobile', m);
  }
  function loadScene() {
    var slot = $('#scene-slot');
    if (!slot || !window.fetch) return;
    var url = slot.getAttribute('data-src') + (ver ? '?v=' + ver : '');
    fetch(url).then(function (r) { return r.ok ? r.text() : Promise.reject(r.status); }).then(function (txt) {
      slot.insertAdjacentHTML('afterend', txt);
      slot.parentNode.removeChild(slot);
      var svg = $('#scene');
      if (!svg) return;
      /* подписи сцены - в словарь русской версии и в текущий язык */
      $$('[data-i18n]', svg).forEach(function (n) {
        var k = n.getAttribute('data-i18n');
        if (ruStore && !(k in ruStore.t)) ruStore.t[k] = n.innerHTML;
        if (dict && dict[k] != null) n.innerHTML = dict[k];
      });
      fitScene(svg);
      var w0 = window.innerWidth;
      window.addEventListener('resize', function () { if (window.innerWidth === w0) return; w0 = window.innerWidth; fitScene(svg); });
      initScene(svg);
    }).catch(function () {});
  }
  function initScene(svg) {
    if (!svg || !hasGsap) return;
    var G = JSON.parse(svg.getAttribute('data-geo'));
    var S = G.S, C = G.C, va = [C * S, -0.5 * S], vb = [C * S, 0.5 * S];
    var crane = $('#crane'), trolley = $('#trolley'), hoist = $('#hoist'), hook = $('#hook'), rope = $('#rope');
    var ropeY2 = +rope.getAttribute('y2'), px = +rope.getAttribute('x1'), py = +rope.getAttribute('y1');
    var st = { A: G.A0, B: G.B0, h: G.H0, sw: 0 };
    var idle = { a: G.A0 - 2, b: 0 }, scrollP = 0, playing = false, visible = true;
    function apply() {
      var dA = st.A - G.A0, dB = st.B - G.B0, dh = st.h - G.H0;
      crane.setAttribute('transform', 'translate(' + (dA * va[0]).toFixed(2) + ' ' + (dA * va[1]).toFixed(2) + ')');
      var tb = 'translate(' + (dB * vb[0]).toFixed(2) + ' ' + (dB * vb[1]).toFixed(2) + ')';
      trolley.setAttribute('transform', tb);
      hoist.setAttribute('transform', tb + ' rotate(' + st.sw.toFixed(2) + ' ' + px + ' ' + py + ')');
      hook.setAttribute('transform', 'translate(0 ' + (-dh * S).toFixed(2) + ')');
      rope.setAttribute('y2', (ropeY2 - dh * S).toFixed(2));
    }
    if (!reduce) {
      var IE = function (t) { return bez(t); };
      gsap.from('.scene-wrap', { y: 40, opacity: 0, duration: 1.1, ease: IE });
      gsap.from('#crane', { opacity: 0, duration: 0.6, delay: 0.5 });
      gsap.from('.sc-tag', { y: '-=14', opacity: 0, duration: 0.4, stagger: 0.07, ease: IE, delay: 0.7 });
    }
    var life = gsap.timeline({ paused: reduce });
    if (!reduce) {
      life.to(st, { sw: 1.4, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);
      gsap.set(st, { sw: -1.4 });
      life.to(idle, { a: G.A0 + 3, duration: 11, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);
      life.to(idle, { b: 1, duration: 7, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0);
      life.to('#fork', { x: 11.5 * va[0], y: 11.5 * va[1], duration: 10, ease: 'sine.inOut', yoyo: true, repeat: -1, repeatDelay: 1.4 }, 0);
    }
    gsap.ticker.add(function () {
      if (!visible) return;
      if (!playing) { st.A += ((idle.a + scrollP * 7) - st.A) * 0.08; st.B += ((G.B0 + (idle.b || 0) * 2.5 - 1.2) - st.B) * 0.05; }
      apply();
    });
    ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onUpdate: function (s) { scrollP = s.progress; } });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        svg.classList.toggle('scene-paused', !visible);
        if (!reduce) { visible ? life.play() : life.pause(); }
      }).observe(svg);
    }

    /* розыгрыш «Как комплектуется заказ» */
    var btn = $('#play'), btnLabel = $('#play [data-i18n]'), phases = $('#phases'), items = $$('#phases li:not(.ph-done)'), board = $('#sc-board');
    var run = null;
    function label(k) {
      btnLabel.setAttribute('data-i18n', k);
      btnLabel.textContent = ((dict && dict[k]) || ruStore.t[k] || RU_EXTRA[k] || '').replace(/&nbsp;/g, ' ');
    }
    var carry = function (n) { return svg.querySelector('.carry[data-c="' + n + '"]'); };
    var HC = 4.6;
    function phase(i) {
      items.forEach(function (li, k) { li.classList.toggle('is-on', k === i); li.classList.toggle('is-done', k < i); });
      phases.classList.toggle('is-complete', i >= items.length);
    }
    function boardKey(k) {
      board.setAttribute('data-i18n', k);
      board.textContent = ((dict && dict[k]) || ruStore.t[k] || '').replace(/&nbsp;/g, ' ');
    }
    var at = { A: G.A0, B: G.B0 };
    function go(tl, A, B) {
      tl.to(st, { A: A, B: B, duration: Math.max(0.6, Math.hypot(A - at.A, B - at.B) * 0.105), ease: 'power2.inOut' });
      at.A = A; at.B = B;
    }
    function grab(tl, name, base, off, on) {
      tl.to(st, { h: base + G.cargo[name][1] + 0.9, duration: 0.5, ease: 'power2.inOut' });
      tl.call(function () { gsap.set(off, { opacity: 0 }); gsap.set(carry(name), { opacity: 1 }); if (on) on(); });
      tl.to(st, { h: HC, duration: 0.55, ease: 'power2.inOut' }, '+=0.12');
    }
    function drop(tl, name, base, show) {
      tl.to(st, { h: base + G.cargo[name][1] + 0.9, duration: 0.55, ease: 'power2.inOut' });
      tl.call(function () { gsap.set(carry(name), { opacity: 0 }); gsap.set(show, { opacity: 1 }); });
      tl.to(st, { h: HC, duration: 0.5, ease: 'power2.inOut' }, '+=0.12');
    }
    function finish() {
      boardKey('scene.board.idle'); phase(-1); playing = false; run = null;
      btn.classList.remove('is-playing'); label('hero.play');
    }
    function play() {
      if (playing) return;
      playing = true; btn.classList.add('is-playing'); label('hero.stop');
      var tl = run = gsap.timeline({ defaults: { overwrite: false } });
      at.A = st.A; at.B = st.B;
      tl.call(phase, [0]);
      tl.to(st, { h: HC, duration: 0.3 });
      go(tl, 5.0, 7.0);
      grab(tl, 'rebar', 0.7, '#st-rebar');
      tl.call(phase, [1]);
      go(tl, 4.4, 13.5);
      drop(tl, 'rebar', 1.0, '#saw-whole');
      tl.addLabel('feed');
      tl.to('#saw-load', { x: '+=' + 3.1 * va[0], y: '+=' + 3.1 * va[1], duration: 1.0, ease: 'power2.inOut' }, 'feed');
      tl.to(st, { A: 10.0, B: 13.5, duration: 1.0, ease: 'power2.inOut' }, 'feed');
      at.A = 10.0; at.B = 13.5;
      tl.to('#saw-head', { y: 0.68 * S, duration: 0.35, ease: 'power2.in' });
      tl.set('#saw-sparks', { opacity: 1 });
      tl.to('#saw-sparks', { rotation: 24, scale: 1.25, transformOrigin: '0 0', duration: 0.09, yoyo: true, repeat: 9, ease: 'none' });
      tl.to('#saw-head', { y: 1.16 * S, duration: 0.9, ease: 'none' }, '<');
      tl.set('#saw-sparks', { opacity: 0 });
      tl.set('#saw-whole', { opacity: 0 }).set(['#saw-near', '#saw-far'], { opacity: 1 });
      tl.to('#saw-head', { y: 0, duration: 0.4, ease: 'power2.out' });
      tl.to('#saw-far', { x: 1.2 * va[0], y: 1.2 * va[1], duration: 0.5, ease: 'power2.out' }, '<');
      tl.call(phase, [2]);
      grab(tl, 'half', 1.0, '#saw-far');
      go(tl, 21.4, 12.3);
      drop(tl, 'half', 1.53, '#tr-half');
      go(tl, 13.0, 8.1);
      grab(tl, 'pipes', 0.2, '#st-pipes');
      go(tl, 22.3, 13.25);
      drop(tl, 'pipes', 1.53, '#tr-pipes');
      tl.call(phase, [3]);
      tl.addLabel('ship');
      tl.to(st, { A: 15, B: 8.5, h: G.H0, duration: 1.4, ease: 'power2.inOut' }, 'ship');
      tl.to('#truck', { x: 17 * va[0], y: 17 * va[1], duration: 2.6, ease: 'power2.in' }, 'ship');
      tl.call(function () { boardKey('scene.board.done'); phase(4); gsap.fromTo(board, { opacity: 0 }, { opacity: 1, duration: 0.25, repeat: 4, yoyo: true }); }, null, 'ship+=1.5');
      /* возврат в исходное */
      tl.to({}, { duration: 3.2 });
      tl.set(['#tr-half', '#tr-pipes'], { opacity: 0 });
      tl.to('#saw-near', { opacity: 0, duration: 0.4 });
      tl.set('#saw-load', { x: '-=' + 3.1 * va[0], y: '-=' + 3.1 * va[1] }).set('#saw-far', { x: 0, y: 0, opacity: 0 });
      tl.to(['#st-rebar', '#st-pipes'], { opacity: 1, duration: 0.5 }, '<');
      tl.to('#truck', { x: 0, y: 0, duration: 2.4, ease: 'power2.out' }, '<');
      tl.call(finish);
    }
    /* прервать: сразу в конечное (исходное) состояние сцены */
    function stop() {
      if (!run) return;
      var tl = run;
      tl.progress(1);
      tl.kill();
      gsap.set(['#tr-half', '#tr-pipes', '#saw-near', '#saw-sparks', '#saw-whole'], { opacity: 0 });
      gsap.set(['#saw-far', '#truck'], { x: 0, y: 0 });
      gsap.set('#saw-far', { opacity: 0 });
      gsap.set('#saw-head', { y: 0 });
      gsap.set(['#st-rebar', '#st-pipes'], { opacity: 1 });
      $$('.carry', svg).forEach(function (c) { gsap.set(c, { opacity: 0 }); });
      st.h = G.H0;
      finish();
    }
    btn.addEventListener('click', function () {
      if (playing) { stop(); return; }
      var r = svg.getBoundingClientRect();
      if (r.top < 40 || r.bottom > window.innerHeight + 80) {
        var y = r.top + window.scrollY - Math.max(0, (window.innerHeight - r.height) / 2);
        if (window.__lenis) window.__lenis.scrollTo(y); else window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
      }
      play();
    });
    btn.disabled = false;
    document.addEventListener('langchange', function () { boardKey(board.getAttribute('data-i18n')); label(btnLabel.getAttribute('data-i18n')); });
  }

  /* ---------- появление и скролл-анимации ---------- */
  function initMotion() {
    if (!hasGsap) return;
    gsap.registerPlugin(ScrollTrigger);
    /* одна кривая на весь сайт: cubic-bezier(.2,.7,.2,1) */
    var E = function (t) { return bez(t); };
    if (reduce) return;

    /* герой: вступление текста и кнопок - CSS-анимация .hero-copy (идёт с первой отрисовки, без ожидания библиотек) */
    gsap.from('.phases li:not(.ph-done)', { y: 10, opacity: 0, duration: 0.4, stagger: 0.06, ease: E, delay: 0.3 });

    /* головы секций: тележка выезжает, бирка опускается на тросе */
    $$('.shead').forEach(function (sh) {
      var tr = $('.trolley', sh), rp = $('.rope', sh), tag = $('.ytag', sh), h2 = $('h2', sh), lead = $('.lead', sh);
      var tl = gsap.timeline({ scrollTrigger: { trigger: sh, start: 'top 82%' } });
      tl.from(tr, { x: -140, opacity: 0, duration: 0.8, ease: E });
      tl.from(rp, { scaleY: 0, duration: 0.5, ease: E }, 0.25);
      tl.from(tag, { y: -30, opacity: 0, duration: 0.5, ease: E }, 0.25);
      tl.fromTo(tag, { rotation: 7 }, { rotation: 0, duration: 1.2, ease: 'elastic.out(1,0.35)' }, 0.5);
      if (h2) tl.from(h2, { y: 44, opacity: 0, duration: 0.9, ease: E }, 0.15);
      if (lead) tl.from(lead, { y: 20, opacity: 0, duration: 0.6, ease: E }, 0.35);
    });

    /* каталог: пачка опускается на стропах и встаёт на подкладки */
    $$('.bay').forEach(function (bay) {
      var lift = $('.lift', bay), slings = $$('.sling', bay), body = $('.bay-body', bay);
      var tl = gsap.timeline({ scrollTrigger: { trigger: bay, start: 'top 72%' } });
      tl.from(lift, { yPercent: -70, duration: 1.1, ease: 'power2.out' });
      tl.fromTo(lift, { rotation: -1.6 }, { rotation: 0, duration: 1.5, ease: 'elastic.out(1,0.4)', transformOrigin: '50% -40%' }, 0.2);
      tl.to(slings, { opacity: 0, scaleY: 0.2, duration: 0.5, ease: 'power2.in' }, 1.25);
      tl.from(body.children, { y: 26, opacity: 0, duration: 0.6, stagger: 0.07, ease: E }, 0.25);
      tl.from($$('.sg-s', bay), { strokeDashoffset: 1, fillOpacity: 0, duration: 1.0, stagger: 0.08, ease: 'power2.inOut' }, 0.5);
      tl.from($$('.sg-d,.sg-t,.sg-h,.sg-dot', bay), { opacity: 0, duration: 0.4, stagger: 0.02 }, 1.1);
      gsap.to($('.bay-art', bay), { backgroundPosition: '0 40px', ease: 'none', scrollTrigger: { trigger: bay, scrub: true } });
    });

    /* сортовой */
    gsap.from('.scard', { y: 50, opacity: 0, duration: 0.7, stagger: 0.08, ease: E, scrollTrigger: { trigger: '.sort-grid', start: 'top 80%' } });
    gsap.from('.scard .sg-s', { strokeDashoffset: 1, fillOpacity: 0, duration: 0.9, stagger: 0.06, ease: 'power2.inOut', scrollTrigger: { trigger: '.sort-grid', start: 'top 70%' } });

    /* услуги: карточки висят на балке, тележка идёт по рельсу */
    gsap.fromTo('.serv-crab', { x: 0 }, { x: function () { return $('.serv-rail').offsetWidth - 96; }, ease: 'none', scrollTrigger: { trigger: '.serv', start: 'top 70%', end: 'bottom 40%', scrub: 0.6, invalidateOnRefresh: true } });
    $$('.hang').forEach(function (c, i) {
      var tl = gsap.timeline({ scrollTrigger: { trigger: '.serv-grid', start: 'top 82%' }, delay: i * 0.12 });
      tl.from(c, { y: -90, opacity: 0, duration: 0.8, ease: 'power2.out' });
      tl.fromTo(c, { rotation: i % 2 ? 2.4 : -2.4 }, { rotation: 0, duration: 1.8, ease: 'elastic.out(1,0.3)' }, 0.25);
    });

    /* условия, клиенты, контакты */
    gsap.from('.who li', { yPercent: 60, opacity: 0, duration: 0.7, stagger: 0.07, ease: E, scrollTrigger: { trigger: '.who', start: 'top 82%' } });
    gsap.from('.logos li', { y: 30, opacity: 0, duration: 0.6, stagger: 0.07, ease: E, scrollTrigger: { trigger: '.logos', start: 'top 88%' } });
    gsap.from('.term', { y: 36, opacity: 0, duration: 0.7, stagger: 0.1, ease: E, scrollTrigger: { trigger: '.terms-grid', start: 'top 82%' } });
    gsap.from('.meet', { y: 40, opacity: 0, duration: 0.8, ease: E, scrollTrigger: { trigger: '.meet', start: 'top 88%' } });
    gsap.from(['.about-p', '.about-year'], { y: 20, opacity: 0, duration: 0.6, stagger: 0.08, ease: E, scrollTrigger: { trigger: '.about-p', start: 'top 85%' } });
    gsap.fromTo('.num-big', { '--fill': '0%' }, { '--fill': '100%', ease: 'none', scrollTrigger: { trigger: '.about-num', start: 'top 85%', end: 'top 35%', scrub: 0.5 } });
    gsap.from('.form', { y: 60, opacity: 0, duration: 0.9, ease: E, scrollTrigger: { trigger: '.form', start: 'top 85%' } });
    gsap.from('.rlink', { x: -30, opacity: 0, duration: 0.6, stagger: 0.08, ease: E, scrollTrigger: { trigger: '.req-links', start: 'top 88%' } });
    gsap.from('.cont-item', { y: 26, opacity: 0, duration: 0.6, stagger: 0.07, ease: E, scrollTrigger: { trigger: '.cont-grid', start: 'top 85%' } });
    gsap.from('.facts a', { y: 16, opacity: 0, duration: 0.5, stagger: 0.06, ease: E, scrollTrigger: { trigger: '.facts', start: 'top 95%' } });
  }

  /* шаги сделки: документ заполняется по мере чтения */
  function initSteps() {
    var steps = $$('#steps .step'), doc = $('#doc');
    if (!steps.length) return;
    function set(i) { steps.forEach(function (s, k) { s.classList.toggle('is-on', k <= i); }); if (doc) doc.setAttribute('data-step', String(i + 1)); }
    if (!('IntersectionObserver' in window)) { set(steps.length - 1); return; }
    var cur = -1;
    function check() {
      var line = window.innerHeight * 0.62, i = -1;
      steps.forEach(function (s, k) { if (s.getBoundingClientRect().top < line) i = k; });
      if (i !== cur) { cur = i; set(i); }
    }
    window.addEventListener('scroll', check, { passive: true }); window.addEventListener('resize', check); check();
  }

  /* бегущая строка: шаг цикла - ровно одна копия набора */
  function initMarquee() {
    var track = $('.marq-track'), set = $('.marq-set');
    if (!track || !set) return;
    var copies = 0, x = 0, w = 0, vel = 0, last = window.scrollY;
    function build() {
      w = set.getBoundingClientRect().width;
      if (!w) return;
      var need = Math.ceil(window.innerWidth / w) + 1;
      while (copies < need) { var c = set.cloneNode(true); c.setAttribute('aria-hidden', 'true'); $$('[data-i18n]', c).forEach(function (n) { n.setAttribute('data-i18n', n.getAttribute('data-i18n')); }); track.appendChild(c); copies++; }
    }
    build();
    window.addEventListener('resize', build);
    document.addEventListener('langchange', function () { requestAnimationFrame(build); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
    if (reduce) return;
    var on = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { on = e[0].isIntersecting; }).observe(track.parentNode);
    (function tick() {
      requestAnimationFrame(tick);
      if (!on || !w) return;
      var sy = window.scrollY; vel += (Math.abs(sy - last) * 0.25 - vel) * 0.1; last = sy;
      x -= 0.9 + vel; if (x <= -w) x += w;
      track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
    })();
  }

  /* ---------- форма ---------- */
  function initForm() {
    var form = $('#form'), ok = $('#form-ok');
    if (!form) return;
    var T = function (k, ru) { return (dict && dict[k]) || ru; };
    var phone = form.elements.phone;
    phone.addEventListener('focus', function () { if (!phone.value) phone.value = '+7 '; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements, bad = false;
      [f.item, f.phone].forEach(function (i) {
        var empty = !i.value.trim() || (i === f.phone && i.value.replace(/\D/g, '').length < 10);
        i.classList.toggle('is-err', empty); i.setAttribute('aria-invalid', String(empty)); if (empty && !bad) { bad = true; i.focus(); }
      });
      if (bad) return;
      var cut = f.cut.value === 'yes' ? T('f.yes', 'Да').toLowerCase() : T('f.no', 'Нет').toLowerCase();
      var text = [
        T('wa.form.head', 'Здравствуйте! Заявка на металлопрокат.'),
        T('wa.form.item', 'Позиция') + ': ' + f.item.value.trim(),
        T('wa.form.vol', 'Объём') + ': ' + (f.volume.value.trim() || '-'),
        T('wa.form.cut', 'Резка') + ': ' + cut,
        T('wa.form.city', 'Доставка') + ': ' + (f.city.value.trim() || '-'),
        T('wa.form.phone', 'Телефон') + ': ' + f.phone.value.trim()
      ].join('\n');
      window.open(waUrl(text), '_blank', 'noopener');
      ok.hidden = false;
      if (hasGsap && !reduce) gsap.from(ok, { y: 10, opacity: 0, duration: 0.4 });
    });
    $$('input', form).forEach(function (i) { i.addEventListener('input', function () { i.classList.remove('is-err'); i.removeAttribute('aria-invalid'); }); });
  }

  /* GSAP, ScrollTrigger и Lenis (130 КБ) - после первой отрисовки: первый экран не ждёт их загрузки */
  function loadVendor(done) {
    if (window.gsap && window.ScrollTrigger) return done();
    var list = ['assets/vendor/gsap.min.js', 'assets/vendor/ScrollTrigger.min.js', 'assets/vendor/lenis.min.js'], left = list.length;
    list.forEach(function (src) {
      var sc = document.createElement('script');
      sc.src = src; sc.async = false;
      sc.onload = sc.onerror = function () { if (--left === 0) done(); };
      document.head.appendChild(sc);
    });
  }
  function initMoving() {
    hasGsap = !!(window.gsap && window.ScrollTrigger);
    if (hasGsap) gsap.registerPlugin(ScrollTrigger);
    initSmooth();
    loadScene();
    initMotion();
    if (hasGsap) {
      ScrollTrigger.refresh();
      window.addEventListener('load', function () { ScrollTrigger.refresh(); });
      document.addEventListener('langchange', function () { ScrollTrigger.refresh(); });
    }
  }
  function init() {
    initLang();
    initHeader();
    initSteps();
    initMarquee();
    initForm();
    requestAnimationFrame(function () { setTimeout(function () { loadVendor(initMoving); }, 0); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
