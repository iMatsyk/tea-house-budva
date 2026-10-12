// ===== Анимации перехода из отсеков «лунных ворот» (Чай, Травы, Кофе, Посуда) в магазин =====
// Подключается на главной и на странице ассортимента.
//   Главная: js/moongate.js вызывает TeaFX.cover(вариант, данные) — экран закрывается, потом переход.
//   Ассортимент: js/arrive.js в <head> узнаёт вариант (window.__teaFx), этот файл строит то же
//   «полотно» в закрытом виде и, когда каталог готов (класс is-ready на <html>), раскрывает его.
// Варианты:
//   1 — веер: снизу раскрывается китайский веер из красной лаковой бумаги;
//   2 — ширма: разворачиваются створки лаковой ширмы с золотой росписью;
//   3 — пар: поднимается тёплый пар и затягивает экран;
//   4 — зонт: из места нажатия раскрывается и закручивается красный зонт из промасленной бумаги;
//   5 — облака: с боков наплывают благоприятные облака сянъюнь.
// Все картинки здесь — наши постоянные строки; данные со страницы проверены в js/arrive.js.
const TeaFX = (() => {
  const EASE = 'cubic-bezier(.65, 0, .25, 1)';
  const OUT = 'cubic-bezier(.45, 0, .2, 1)';
  // одинаковые «случайные» числа на обеих страницах (одно зерно — одна и та же раскладка)
  const seeded = s => () => {
    s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const el = (tag, cls, parent) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  };
  const play = (node, frames, opts) => node.animate(frames, { easing: EASE, fill: 'both', ...opts });
  const finished = anims => Promise.all(anims.map(a => a.finished.catch(() => {})));

  // Облако сянъюнь: красное, с золотым контуром и завитками (рисунок 160×60)
  const CLOUD = '<svg viewBox="0 0 160 60" aria-hidden="true">' +
    '<path d="M8 50C8 36 24 30 36 36C38 20 60 14 72 26C80 12 104 12 110 28C124 22 142 30 140 44C150 46 152 54 146 56H14C8 56 6 54 8 50Z" fill="#b81d14" stroke="#e0b45c" stroke-width="2.2"/>' +
    '<g fill="none" stroke="#e0b45c" stroke-width="2" stroke-linecap="round">' +
    '<path d="M40 48c0-8 12-8 12 0 0 4-6 5-7 1"/><path d="M78 42c0-10 15-10 15 0 0 5-8 6-9 1"/><path d="M114 48c0-7 10-7 10 0 0 3-5 4-6 1"/></g></svg>';

  const VARIANTS = {
    // ---------- 1. Веер ----------
    1: {
      build(o) {
        const w = innerWidth, h = innerHeight;
        const R = Math.hypot(w / 2, h) + 40, N = w < 700 ? 12 : 16, step = 180 / N;
        const pw = 2 * R * Math.tan(step / 2 * Math.PI / 180) + 3;   // ширина бумажной доли у края
        const fan = el('div', 'fx-fan', o), slats = [];
        fan.style.setProperty('--b', Math.round(Math.min(pw * .5, R * .07)) + 'px'); // размер цветков сливы на долях
        for (let i = 0; i < N; i++) {
          const p = el('i', 'fx-fan__p' + (i % 2 ? ' fx-fan__p--alt' : ''), fan);
          p.style.cssText = `width:${pw}px;height:${R}px;margin-left:${-pw / 2}px`;
          slats.push({ p, a: -90 + step / 2 + i * step, i });
        }
        for (let i = 0; i <= N; i++) {
          const b = el('b', 'fx-fan__rib', fan);
          b.style.height = R + 'px';
          slats.push({ p: b, a: -90 + i * step, i });
        }
        return { fan, slats };
      },
      cover(st) {
        return st.slats.map(({ p, a, i }) => play(p, [{ transform: 'rotate(-90deg)' }, { transform: `rotate(${a}deg)` }],
          { duration: 950, delay: i * 18 }));
      },
      covered(st) { st.slats.forEach(({ p, a }) => { p.style.transform = `rotate(${a}deg)`; }); },
      uncover(st) {
        const anims = st.slats.map(({ p, a, i }) => play(p, [{ transform: `rotate(${a}deg)` }, { transform: 'rotate(90deg)' }],
          { duration: 1100, delay: i * 14, easing: OUT }));
        anims.push(play(st.fan, [{ opacity: 1 }, { opacity: 1, offset: .75 }, { opacity: 0 }], { duration: 1350, easing: 'linear' }));
        return anims;
      },
    },

    // ---------- 2. Ширма ----------
    2: {
      build(o, ctx) {
        // ширина — без полосы прокрутки, как у заливки на странице ассортимента (css: html.fx-2 body::after),
        // чтобы при подмене заливки настоящими створками ничего не сдвинулось
        const w = document.documentElement.clientWidth, N = innerWidth < 700 ? 4 : 6, pw = w / N, panels = [];
        const art = typeof FX_ART !== 'undefined' ? FX_ART.url(FX_ART.pick(ctx.seed)) : 'none'; // одна из 10 росписей
        for (let i = 0; i < N; i++) {
          const p = el('i', 'fx-screen', o);
          p.style.cssText = `left:${i * pw}px;width:${pw + 1}px;background-image:${art},linear-gradient(#1c0d08,#0c0504);` +
            `background-position:${-i * pw}px 0,0 0;background-size:${w}px 100%,auto;transform-origin:${i % 2 ? 'right' : 'left'} center`;
          panels.push({ p, i, side: i % 2 ? -1 : 1 });
        }
        // на компьютере створки двигаются быстрее (вся ширма ≈ 0,75 с), на телефоне — как раньше (≈ 1,3 с)
        const fast = matchMedia('(min-width: 1100px)').matches;
        return { panels, N, dur: fast ? 460 : 750, step: fast ? 55 : 110 };
      },
      cover(st) {
        return st.panels.map(({ p, i, side }) => play(p, [
          { transform: `perspective(1600px) rotateY(${92 * side}deg)`, filter: 'brightness(.4)' },
          { transform: 'perspective(1600px) rotateY(0deg)', filter: 'brightness(1)' },
        ], { duration: st.dur, delay: i * st.step }));
      },
      covered(st) { st.panels.forEach(({ p }) => { p.style.transform = 'perspective(1600px) rotateY(0deg)'; }); },
      uncover(st) {
        return st.panels.map(({ p, i, side }) => play(p, [
          { transform: 'perspective(1600px) rotateY(0deg)', filter: 'brightness(1)' },
          { transform: `perspective(1600px) rotateY(${-92 * side}deg)`, filter: 'brightness(.4)' },
        ], { duration: st.dur, delay: (st.N - 1 - i) * st.step, easing: OUT }));
      },
    },

    // ---------- 3. Пар ----------
    3: {
      build(o, ctx) {
        const bg = el('div', 'fx-bg fx-bg--steam', o), rnd = seeded(ctx.seed);
        const w = innerWidth, h = innerHeight, V = Math.max(w, h), puffs = [];
        for (let i = 0; i < 26; i++) {
          const s = V * (.35 + rnd() * .3);
          const b = el('span', 'fx-steam', o);
          b.style.width = b.style.height = s + 'px';
          puffs.push({ b, s, x: rnd() * w, y: rnd() * h, t: rnd() });
        }
        return { bg, puffs };
      },
      cover(st, ctx) {
        const r = ctx.rect;
        const anims = [play(st.bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 750 })];
        st.puffs.forEach(({ b, s, x, y, t }) => {
          // пар поднимается из отсека и расползается по экрану
          const ox = r.left + r.width * Math.random(), oy = r.top + r.height * Math.random();
          anims.push(play(b, [
            { transform: `translate(${ox - s / 2}px, ${oy - s / 2}px) scale(.15)`, opacity: 0 },
            { opacity: .95, offset: .4 },
            { transform: `translate(${x - s / 2}px, ${y - s / 2}px) scale(1)`, opacity: .95 },
          ], { duration: 1250, delay: t * 350, easing: 'cubic-bezier(.25, .6, .3, 1)' }));
        });
        return anims;
      },
      covered(st) { st.puffs.forEach(({ b, s, x, y }) => { b.style.transform = `translate(${x - s / 2}px, ${y - s / 2}px)`; b.style.opacity = .95; }); },
      uncover(st) {
        const h = innerHeight;
        const anims = [play(st.bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 900, delay: 100, easing: OUT })];
        st.puffs.forEach(({ b, s, x, y, t }) => anims.push(play(b, [
          { transform: `translate(${x - s / 2}px, ${y - s / 2}px) scale(1)`, opacity: .95 },
          { transform: `translate(${x - s / 2}px, ${y - s / 2 - h * .45}px) scale(1.35)`, opacity: 0 },
        ], { duration: 1500, delay: t * 300, easing: OUT })));
        return anims;
      },
    },

    // ---------- 4. Зонт из промасленной бумаги (вид сверху) ----------
    // Один круглый элемент: красные доли, бамбуковые спицы, золотые кольца и навершие — всё в css (.fx-umbrella)
    4: {
      build(o, ctx) {
        const w = innerWidth, h = innerHeight;
        const R = Math.hypot(Math.max(ctx.x, w - ctx.x), Math.max(ctx.y, h - ctx.y)) + 40; // зонт закрывает и дальний угол
        const u = el('div', 'fx-umbrella', o);
        Object.assign(u.style, { left: ctx.x - R + 'px', top: ctx.y - R + 'px', width: 2 * R + 'px', height: 2 * R + 'px' });
        // роспись по бумаге: кольцо цветков сливы и золотые точки у края (координаты от центра, радиус зонта = 100)
        let art = '';
        for (let k = 0; k < 8; k++) {
          const a = (k * 45 + 22.5) * Math.PI / 180, cx = Math.cos(a) * 50, cy = Math.sin(a) * 50;
          for (let p = 0; p < 5; p++) {
            const b = a + p * 72 * Math.PI / 180;
            art += `<circle cx="${(cx + Math.cos(b) * 3.6).toFixed(2)}" cy="${(cy + Math.sin(b) * 3.6).toFixed(2)}" r="3.4" fill="#f7d9d4"/>`;
          }
          art += `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="1.8" fill="#e0b45c"/>`;
        }
        for (let k = 0; k < 48; k++) {
          const a = k * 7.5 * Math.PI / 180;
          art += `<circle cx="${(Math.cos(a) * 80).toFixed(2)}" cy="${(Math.sin(a) * 80).toFixed(2)}" r=".9" fill="#e0b45c"/>`;
        }
        u.innerHTML = `<svg viewBox="-100 -100 200 200" aria-hidden="true">${art}</svg>`;
        return { u };
      },
      cover(st) {
        return [play(st.u, [
          { transform: 'rotate(-220deg) scale(.03)', opacity: 0 },
          { opacity: 1, offset: .12 },
          { transform: 'rotate(0deg) scale(1)', opacity: 1 },
        ], { duration: 1150, easing: 'cubic-bezier(.55, 0, .2, 1)' })];
      },
      covered(st) { st.u.style.transform = 'none'; },
      uncover(st) {
        return [play(st.u, [
          { transform: 'rotate(0deg) scale(1)', opacity: 1 },
          { opacity: 1, offset: .85 },
          { transform: 'rotate(220deg) scale(.03)', opacity: 0 },
        ], { duration: 1300, easing: 'cubic-bezier(.6, 0, .35, 1)' })];
      },
    },

    // ---------- 5. Облака сянъюнь ----------
    5: {
      build(o, ctx) {
        const bg = el('div', 'fx-bg fx-bg--clouds', o), rnd = seeded(ctx.seed);
        const w = innerWidth, h = innerHeight, cw = Math.max(w * .55, 320), clouds = [];
        const rows = Math.ceil(h / (cw * .3)) + 1;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < 3; c++) {           // по три облака в ряд, ряды со сдвигом
            const s = cw * (.8 + rnd() * .5);
            const x = (c - .5 + (r % 2) * .5 + rnd() * .3) * w / 2, y = (r - .3 + rnd() * .4) * cw * .3;
            const fromLeft = x + s / 2 < w / 2;
            const k = el('span', 'fx-cloud', o);
            k.style.width = s + 'px';
            k.innerHTML = CLOUD;
            clouds.push({ k, x, y, s, side: fromLeft ? -1 : 1, flip: rnd() < .5, t: rnd() });
          }
        }
        return { bg, clouds };
      },
      cover(st) {
        const w = innerWidth;
        const anims = [play(st.bg, [{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 350 })];
        st.clouds.forEach(({ k, x, y, s, side, flip, t }) => anims.push(play(k, [
          { transform: `translate(${x + side * (w * .7)}px, ${y}px) scaleX(${flip ? -1 : 1})`, opacity: 0 },
          { opacity: 1, offset: .3 },
          { transform: `translate(${x}px, ${y}px) scaleX(${flip ? -1 : 1})`, opacity: 1 },
        ], { duration: 1050, delay: t * 300, easing: 'cubic-bezier(.25, .6, .25, 1)' })));
        return anims;
      },
      covered(st) { st.clouds.forEach(({ k, x, y, flip }) => { k.style.transform = `translate(${x}px, ${y}px) scaleX(${flip ? -1 : 1})`; }); },
      uncover(st) {
        const w = innerWidth;
        const anims = [play(st.bg, [{ opacity: 1 }, { opacity: 0 }], { duration: 800, delay: 150, easing: OUT })];
        st.clouds.forEach(({ k, x, y, side, flip, t }) => anims.push(play(k, [
          { transform: `translate(${x}px, ${y}px) scaleX(${flip ? -1 : 1})`, opacity: 1 },
          { opacity: 1, offset: .6 },
          { transform: `translate(${x + side * (w * .75)}px, ${y}px) scaleX(${flip ? -1 : 1})`, opacity: 0 },
        ], { duration: 1300, delay: t * 250, easing: OUT })));
        return anims;
      },
    },
  };

  function overlay(v) {
    const o = el('div', 'fx-overlay fx-overlay--' + v, document.body);
    o.setAttribute('aria-hidden', 'true');
    return o;
  }

  // Главная: закрыть экран. Возвращает обещание, которое выполнится, когда экран закрыт.
  function cover(v, ctx) {
    const fx = VARIANTS[v] || VARIANTS[1];
    const o = overlay(v), st = fx.build(o, ctx);
    return finished(fx.cover(st, ctx));
  }

  // Ассортимент: экран уже закрыт (js/arrive.js) — строим то же полотно и раскрываем, когда каталог готов
  (function arrive() {
    const root = document.documentElement, info = window.__teaFx;
    if (!info || !root.classList.contains('fx-in') || !VARIANTS[info.v]) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const fx = VARIANTS[info.v];
    const ctx = { ...info, x: info.x / 100 * innerWidth, y: info.y / 100 * innerHeight };
    const o = overlay(info.v), st = fx.build(o, ctx);
    fx.covered(st, ctx);
    root.classList.add('fx-built'); // теперь закрывают настоящие элементы — временную заливку можно убрать
    const open = () => finished(fx.uncover(st, ctx)).then(() => o.remove());
    if (root.classList.contains('is-ready')) { open(); return; }
    new MutationObserver((m, obs) => {
      if (!root.classList.contains('is-ready')) return;
      obs.disconnect();
      open();
    }).observe(root, { attributes: true, attributeFilter: ['class'] });
  })();

  return { cover, count: Object.keys(VARIANTS).length };
})();
