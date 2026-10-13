// ===== Струя зелёного чая по ходу прокрутки (только главная страница) =====
// В первом экране чайник (рядом с надписью TEA HOUSE) наклоняется, и струя «стекает» вниз вслед за прокруткой.
// Сцены по порядку страницы:
//   первый экран, внизу         — наполняет фарфоровую пиалу (в стиле чайника) и переливается; дальше каплями;
//   «Ассортимент», ниже середины — поливает статуэтку Будды;
//   «Ассортимент», в самом низу  — пишет иероглиф 茶 («чай»);
//   «О нас»                     — наполняет сисиодоси; трубка опрокидывается и дальше качается сама;
//   «Загляните внутрь», вверху  — бежит по бамбуковому каскаду;
//   «Контакты», вверху          — обтекает горячий камень с паром и темнеет до цвета улуна;
//   «Контакты», внизу           — пруд с карпом кои.
// Компьютер: струя идёт по правому полю. Телефон и планшет: тонкая струя у края,
// сцены — в паузах между блоками (.flow-stage); Будда — в правом верхнем углу «Ассортимента».
//
// Как струя на телефоне и планшете переходит от одной сцены к другой — 6 вариантов
// (на компьютере струя одна, как была). Для сравнения: ?flow=1 … ?flow=6 (см. .claude/flow.html).
//   Бамбук переводит русло (если следующая сцена не ровно под предыдущей):
//   1 — жёлоб: длинный расколотый ствол бамбука, чай бежит по нему и срывается с края;
//   2 — лесенка: короткие колена ступеньками, чай перескакивает с одного на другое;
//   3 — труба: чай уходит в бамбуковую чашку и выливается из носика трубы;
//   4 — отбойники: тонкие палочки, струя скользит по ним и летит дальше дугой;
//   Перспектива — чай льётся ровной вертикалью, сцены стоят прямо на ней:
//   5 — «сквозь»: струя уходит за фото, карточки и кнопки и проходит перед текстом, за Буддой;
//   6 — «глубина»: струя идёт перед фото (на них падает тень) и за строками текста.
(() => {
  const hero = document.querySelector('.hero');
  if (!hero) return;

  const FLOW = 1; // ← выбранный вариант для телефона
  const askedFlow = +new URLSearchParams(location.search).get('flow');
  const VAR = [1, 2, 3, 4, 5, 6].includes(askedFlow) ? askedFlow : FLOW;
  const PERSP = VAR >= 5;

  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = t => t * t * (3 - 2 * t);
  const r1 = v => Math.round(v * 10) / 10;
  const TILT = 30;   // наклон чайника, градусы
  const FILL = 240;   // сколько «прокрутки» уходит на наполнение пиалы
  const SHISHI = 170; // ...и на наполнение трубки сисиодоси

  function mk(tag, attrs, parent) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  const layer = mk('svg', { id: 'flow', 'aria-hidden': 'true', focusable: 'false' });
  document.body.appendChild(layer);

  // Места-паузы для сцен. Видны только на телефоне и планшете (см. .flow-stage в style.css),
  // высоту каждой задаёт скрипт — ровно под сцену и бамбук, без лишней пустоты.
  // Пиале и Будде паузы не нужны: пиала стоит внизу первого экрана, Будда — в углу над заголовком.
  [['cha', '#assortment', 'end'],                      // «Ассортимент», внизу — знак 茶
   ['shishi', '#about', 'end'],                        // «О нас»
   ['stone', '#visit', 'start'],                       // «Контакты», вверху
   ['pond', '#visit', 'end']                           // «Контакты», внизу
  ].forEach(([id, sel, where]) => {
    const st = document.createElement('div');
    st.className = 'flow-stage';
    st.dataset.scene = id;
    st.setAttribute('aria-hidden', 'true');
    const target = document.querySelector(sel);
    if (where === 'after') target.after(st);
    else if (where === 'start') target.prepend(st);
    else target.appendChild(st);
  });

  let S = null;        // всё, что нужно для анимации при текущих размерах страницы
  let vCur = 0;        // текущая (сглаженная) длина струи
  let running = false;

  // ---------- построение картинки под текущий размер экрана ----------
  function build() {
    const W = document.documentElement.clientWidth;
    // Раскладку определяем тем же правилом, что и стили (ширина окна вместе с полосой прокрутки),
    // иначе на экранах 1100–1115 px скрипт и стили «видели» бы разные раскладки
    const desktop = matchMedia('(min-width: 1100px)').matches;
    // Телефон: сначала даём паузам-сценам нужную высоту, потом всё меряем
    const M = desktop ? null : plan(W);
    if (M) for (const id in M.h) {
      const st = document.querySelector(`.flow-stage[data-scene="${id}"]`);
      if (st) st.style.height = Math.round(M.h[id]) + 'px';
    }
    layer.style.height = '0px';
    const H = document.documentElement.scrollHeight;
    layer.setAttribute('viewBox', `0 0 ${W} ${H}`);
    layer.setAttribute('width', W);
    layer.setAttribute('height', H);
    layer.style.width = W + 'px';
    layer.style.height = H + 'px';
    layer.replaceChildren();

    const box = sel => {
      const r = document.querySelector(sel).getBoundingClientRect();
      return { top: r.top + scrollY, bottom: r.bottom + scrollY, h: r.height };
    };
    const heroTop = box('.hero').top;
    const about = box('#about'), assort = box('#assortment'), gallery = box('#gallery'), visit = box('#visit');
    const contRight = document.querySelector('#about .container').getBoundingClientRect().right;
    const X = desktop ? Math.round(contRight + (W - contRight) / 2) : W - 8;
    const sw = desktop ? 7 : 3.5;

    // --- общие заготовки: цвет чая, «шторка» проявления струи ---
    const defs = mk('defs', {}, layer);
    const tea = mk('linearGradient', { id: 'teaGrad', gradientUnits: 'userSpaceOnUse', x1: 0, y1: 0, x2: 0, y2: 90 }, defs);
    mk('stop', { offset: 0, 'stop-color': '#93bb3b' }, tea);   // зелёный чай
    mk('stop', { offset: 1, 'stop-color': '#d0902a' }, tea);   // после горячего камня — цвет улуна
    const revealClip = mk('clipPath', { id: 'flowReveal' }, defs);
    const revealRect = mk('rect', { x: 0, y: 0, width: W, height: 0 }, revealClip);
    gradients(defs);

    const back = mk('g', {}, layer);                                         // сцены под струёй
    const liquid = mk('g', { 'clip-path': 'url(#flowReveal)' }, layer);     // всё жидкое
    const shadows = mk('g', {}, liquid);                                     // тени струи на фото (вариант 6)
    const front = mk('g', {}, layer);                                        // то, что поверх струи

    const mains = [];  // участки основной струи — по ним ставим каплю на конце
    const hidden = []; // высоты, где струя спрятана (внутри бамбуковой трубы) — капли там не видно
    function stream(d, kind = 'smooth', width = sw, parent = liquid, main = true) {
      const g = mk('g', {}, parent);
      let p;
      if (kind === 'drops') {
        // Падающие капли: вытянутые, с контуром и бликом, плюс мелкие брызги в другом ритме
        mk('path', { d, class: 'flow-drops-edge', 'stroke-width': width + 2 }, g);
        p = mk('path', { d, class: 'flow-drops', 'stroke-width': width }, g);
        mk('path', { d, class: 'flow-drops-hl', 'stroke-width': Math.max(1, width * 0.3) }, g);
        mk('path', { d, class: 'flow-spray', 'stroke-width': Math.max(1.4, width * 0.42) }, g);
      } else {
        mk('path', { d, class: 'flow-edge', 'stroke-width': width + 2 }, g);
        p = mk('path', { d, class: 'flow-body', 'stroke-width': width }, g);
        mk('path', { d, class: 'flow-hl', 'stroke-width': Math.max(1, width * 0.32) }, g);
      }
      if (main) mains.push(p);
      return g;
    }

    // --- чайник: рядом с неоновой надписью TEA HOUSE ---
    // Компьютер: справа от надписи, на одной высоте с ней. Телефон: над надписью, у правого края
    // (в вариантах с перспективой — прямо над пиалой).
    const fallX = desktop ? X : M.fallX; // куда падает струя из носика
    const th = TILT * Math.PI / 180, lx = 86, ly = -25; // кончик носика в координатах чайника
    const rx = lx * Math.cos(th) - ly * Math.sin(th);
    const ry = lx * Math.sin(th) + ly * Math.cos(th);
    const tipX = desktop ? X - 14 : fallX - 6;
    const neonBox = box('.hero .neon');
    const neonRight = document.querySelector('.hero .neon').getBoundingClientRect().right;
    const eyebrowBox = box('.hero__eyebrow');
    // Размер подбираем так, чтобы между надписью и ручкой чайника оставалось 14 px
    const fit = (tipX - neonRight - 14) / (rx + 102);
    const beside = desktop && fit >= 0.6;
    const sc = beside ? Math.min(0.85, fit) : (desktop ? 0.7 : 0.5);
    const navBottom = heroTop + Math.max(80, document.getElementById('nav').offsetHeight); // шапка закреплена сверху
    const potY = beside
      ? Math.round(neonBox.top + neonBox.h / 2)                  // справа от надписи, на её высоте
      : Math.round(Math.max(eyebrowBox.top - (desktop ? 46 : 34), // над строкой «Будва · Черногория»,
          navBottom + 8 + 60 * sc));                              // но не выше нижнего края шапки
    const spoutY = Math.round(potY + ry * sc);
    const tp = { cx: tipX - rx * sc, cy: spoutY - ry * sc, sc };

    const scenes = {};
    const dwells = []; // места, где струя ждёт, пока что-то наполнится
    let bowl = null, shishi = null, pond = null, end = 0, stoneTop = 0;

    // 0. Из носика чайника
    const fall = desktop ? 64 : 40;
    stream(`M ${tipX} ${spoutY} C ${tipX + (desktop ? 6 : 3)} ${spoutY + 4} ${fallX} ${spoutY + fall * 0.4} ${fallX} ${spoutY + fall}`);

    if (desktop) {
      // ===== Компьютер: сцены по центру правого поля, на нужной высоте раздела =====
      const SX = X;
      const gTop = Math.round(box('.hero').bottom - 130);         // пиала — внизу первого экрана
      const by = Math.round(assort.top + assort.h * 0.4);         // Будда — «Ассортимент», рядом с окном
      const cTop = Math.round(assort.bottom - 230);               // 茶 — «Ассортимент», в самом низу
      const sY = Math.round(about.top + about.h * 0.5);           // сисиодоси — «О нас»
      const y0 = Math.round(gallery.top + 40);                    // бамбук — «Загляните внутрь», вверху
      const stoneC = Math.round(visit.top + visit.h * 0.22);      // камень — «Контакты», вверху
      const pY = Math.round(visit.bottom - 70);                   // пруд — «Контакты», внизу
      stoneTop = stoneC;

      const link = (x1, y1, x2, y2, kind = 'smooth') => {
        const m = (y1 + y2) / 2;
        stream(x1 === x2 ? `M ${x1} ${y1} L ${x2} ${y2}` : `M ${x1} ${y1} C ${x1} ${m} ${x2} ${m} ${x2} ${y2}`, kind);
      };

      // 1. Пиала (внизу первого экрана): наполняется, потом переливается через край
      link(X, spoutY + fall, SX, gTop);
      stream(`M ${SX} ${gTop} L ${SX} ${gTop + 17}`);
      dwells.push({ y: gTop + 17, span: FILL, t: 0 });
      bowl = drawBowl(back, front, SX - 55, gTop, defs, stream);

      // 2. Падающие капли — из пиалы на Будду
      const BX = SX, headY = by + 9;
      link(SX, gTop + 70, SX, headY, 'drops');

      // 3. Будда («Ассортимент»)
      drawBuddha(back, BX - 60, by);
      buddhaRills(BX - 60, by, 1, 2.4);
      scenes.buddha = { el: drawSplash(front, BX, headY), y: headY };

      // 4. Иероглиф 茶 («Ассортимент», внизу)
      link(BX, by + 128, SX, cTop + 22);
      drawCha(liquid, SX - 55, cTop);

      // 5. Сисиодоси («О нас»): трубка наполняется, опрокидывается и дальше качается сама
      const mouthY = sY - 11;
      link(SX + 1, cTop + 112, SX - 32, mouthY);
      dwells.push({ y: mouthY, span: SHISHI, t: 0 });
      shishi = drawShishi(back, SX, sY);

      // 6. Бамбуковый каскад («Загляните внутрь», вверху) — чай падает порциями из трубки
      link(SX - 30, sY + 16, SX + 10, y0, 'drops');
      drawBamboo(back, SX, y0);
      stream(`M ${SX + 10} ${y0} L ${SX - 45} ${y0 + 24} L ${SX - 45} ${y0 + 60} L ${SX + 45} ${y0 + 84} L ${SX + 45} ${y0 + 120} L ${SX} ${y0 + 140}`, 'smooth', 4.5);

      // 7. Горячий камень с паром («Контакты», вверху) — дальше чай темнеет до цвета улуна
      const sTop = stoneC - 17;
      link(SX, y0 + 140, SX, sTop);
      drawStone(back, SX, stoneC);
      stoneRills(SX, stoneC, 1, 3);
      scenes.stone = { el: drawSteam(front, SX, sTop), y: sTop };

      // 8. Пруд с карпом кои («Контакты», внизу)
      link(SX, stoneC + 23, SX, pY - 4);
      pond = drawPond(back, front, SX, pY);
      end = pY - 3;
    } else {
      // ===== Телефон и планшет =====
      const P = PERSP, s = M.s, x = M.x, L = M.L;
      const stTop = id => box(`.flow-stage[data-scene="${id}"]`).top;
      const by = Math.round(box('.hero').bottom - 112);     // пиала — внизу первого экрана (верх края)
      const budTop = Math.round(assort.top + 8);             // Будда — в правом верхнем углу «Ассортимента»
      const chaS = stTop('cha'), shiS = stTop('shishi'), stoS = stTop('stone'), ponS = stTop('pond');
      const C = { back, front, liquid, hidden, W };

      // Отвесная струя. В перспективе — с «уходами» за предметы и тенью на фото
      const behind = VAR === 5 ? [CARDS, false] : VAR === 6 ? [TEXT, true] : null;
      const near = VAR === 6 ? CARDS.filter(c => c !== '.hero .neon') : null;
      const inAny = (list, y) => list.some(([a, b]) => y > a && y < b);
      function vline(xx, y1, y2, kind = 'smooth') {
        if (y2 - y1 < 1) return;
        if (!P) { stream(`M ${xx} ${r1(y1)} L ${xx} ${r1(y2)}`, kind); return; }
        const gaps = spans(xx, behind[0], behind[1]);
        const close = near ? spans(xx, near) : [];
        const cuts = [y1, y2];
        [...gaps, ...close].forEach(([a, b]) => { if (a > y1 && a < y2) cuts.push(a); if (b > y1 && b < y2) cuts.push(b); });
        cuts.sort((a, b) => a - b);
        for (let i = 0; i < cuts.length - 1; i++) {
          const a = cuts[i], b = cuts[i + 1], m = (a + b) / 2;
          if (b - a < 0.5 || inAny(gaps, m)) continue;     // здесь струя за предметом — не рисуем
          const isNear = inAny(close, m);
          if (isNear) mk('path', { d: `M ${xx + 4} ${r1(a)} L ${xx + 4} ${r1(b)}`, class: 'flow-shadow', 'stroke-width': sw + 3 }, shadows);
          stream(`M ${xx} ${r1(a)} L ${xx} ${r1(b)}`, kind, isNear ? sw * 1.55 : sw);
        }
      }
      // Струя от одной сцены к другой: отвесно вниз из x1; если следующая сцена не ровно под ней —
      // на высоте devY бамбук переводит чай в x2, и дальше он снова падает отвесно
      function connect(x1, y1, x2, y2, devY, kind = 'smooth') {
        if (!M.dev || Math.abs(x2 - x1) < 2) return vline(x2, y1, y2, kind);
        devY = Math.max(y1, devY);
        const d = M.dev(x1, devY, x2, C);
        stream(`M ${x1} ${r1(y1)} L ${x1} ${r1(devY)} ${d.cmds} L ${x2} ${r1(Math.max(y2, d.y))}`, kind);
      }

      // 1. Пиала: чай из носика наполняет её, она наклоняется вправо и выливает чай через правый край
      const sb = s.bowl, surf = by + 17 * sb;
      if (P) vline(M.xin, spoutY + fall, surf);
      else connect(X, spoutY + fall, M.xin, surf, by - 8 - M.dh(X, M.xin));
      dwells.push({ y: surf, span: FILL, t: 0 });
      bowl = drawBowl(back, front, M.bowlX, by, defs, stream, sb);
      const rimX = M.bowlX + M.rim.x * sb, rimY = by + M.rim.y * sb, pourY = rimY + 16;
      stream(`M ${r1(rimX)} ${r1(rimY)} C ${r1(rimX + 3)} ${r1(rimY + 0.5)} ${x.col} ${r1(rimY + 5)} ${x.col} ${r1(pourY)}`);

      // 2. Будда — небольшой, в правом верхнем углу «Ассортимента»
      const sB = s.bud, bX = x.bud - 60 * sB, headY = budTop + 9 * sB, baseY = budTop + 128 * sB;
      const onHead = VAR !== 5; // в варианте 5 струя проходит за статуэткой
      if (onHead) {
        connect(x.col, pourY, x.bud, headY, budTop - 6 - M.dh(x.col, x.bud));
        drawBuddha(back, bX, budTop, sB);
        buddhaRills(bX, budTop, sB, 3.4);
        scenes.buddha = { el: drawSplash(front, x.bud, headY), y: headY };
      } else {
        drawBuddha(front, bX, budTop, sB);
      }

      // 3. Знак 茶 внизу «Ассортимента» — под окном, перед «О нас»
      const sC = s.cha, cTop = chaS + L.cha.cTop, chaIn = cTop + 22 * sC, chaOut = cTop + 112 * sC;
      if (P) vline(x.cha, onHead ? baseY : pourY, chaIn);
      else {
        connect(x.bud, baseY, X, chaS + L.cha.dev, baseY + 4);
        connect(X, chaS + L.cha.dev, x.cha, chaIn, chaS + L.cha.dev);
      }
      CHA.forEach(d => mk('path', { d, class: 'flow-brush-ghost', transform: `translate(${r1(x.cha - 55 * sC)} ${r1(cTop)}) scale(${sC})` }, back));
      drawCha(liquid, x.cha - 55 * sC, cTop, sC);

      // 4. Сисиодоси в конце «О нас» (открытым концом вправо, к струе)
      const sS = s.shi, sY = shiS + L.shi.sY, mouthY = sY - 11 * sS, outX = x.mouth - 2 * sS, outY = sY + 16 * sS;
      if (P) vline(x.mouth, chaIn, mouthY);
      else {
        connect(x.cha, chaOut, X, shiS + L.shi.dev, chaOut + 6);
        connect(X, shiS + L.shi.dev, x.mouth, mouthY, shiS + L.shi.dev);
      }
      dwells.push({ y: mouthY, span: SHISHI, t: 0 });
      shishi = drawShishi(back, x.mouth - 32 * sS, sY, sS, true);

      // 5. Горячий камень с паром вверху «Контактов» — дальше чай темнеет до цвета улуна
      const sT = s.stone, stoneC = stoS + L.stone.c, sTop = stoneC - 17 * sT, sBot = stoneC + 23 * sT;
      stoneTop = stoneC;
      if (P) vline(x.stone, outY, sTop, 'drops');
      else {
        const dropEnd = shiS + L.shi.dropEnd;
        stream(`M ${r1(outX)} ${r1(outY)} L ${r1(outX)} ${r1(dropEnd)}`, 'drops');
        connect(outX, dropEnd, X, stoS + L.stone.dev, dropEnd);
        connect(X, stoS + L.stone.dev, x.stone, sTop, stoS + L.stone.dev);
      }
      drawStone(mk('g', { transform: `translate(${x.stone} ${r1(stoneC)}) scale(${sT})` }, back), 0, 0);
      stoneRills(x.stone, stoneC, sT, 3);
      scenes.stone = { el: drawSteam(mk('g', { transform: `translate(${x.stone} ${r1(sTop)}) scale(${sT})` }, front), 0, 0), y: sTop };

      // 6. Пруд с карпом кои внизу «Контактов»
      const sP = s.pond, pY = ponS + L.pond.c, pEnd = pY - 4 * sP;
      if (P) vline(x.pond, sBot, pEnd);
      else {
        connect(x.stone, sBot, X, ponS + L.pond.dev, sBot + 4);
        connect(X, ponS + L.pond.dev, x.pond, pEnd, ponS + L.pond.dev);
      }
      const at = `translate(${x.pond} ${r1(pY)}) scale(${sP})`;
      pond = drawPond(mk('g', { transform: at }, back), mk('g', { transform: at }, front), 0, 0);
      end = pY - 3 * sP;
    }

    tea.setAttribute('y1', r1(stoneTop));
    tea.setAttribute('y2', r1(stoneTop + 90));

    // Струя Будды и камня: два ручейка вокруг, в координатах сцены (s — масштаб, w — толщина)
    function buddhaRills(bx, by, s, w) {
      const bl = mk('g', { transform: `translate(${r1(bx)} ${r1(by)})` + (s !== 1 ? ` scale(${s})` : '') }, liquid);
      stream('M 60 9 C 54 10 51 14 50 18 C 47 24 45 30 46 38 C 44 46 34 48 28 58 C 22 70 22 86 26 100 C 28 108 22 112 20 118', 'smooth', w, bl, false);
      stream('M 60 9 C 66 10 69 14 70 18 C 73 24 75 30 74 38 C 76 46 86 48 92 58 C 98 70 98 86 94 100 C 92 108 98 112 100 118', 'smooth', w, bl, false);
      mk('ellipse', { cx: 60, cy: 119, rx: 36, ry: 3, class: 'flow-pool' }, bl);
    }
    function stoneRills(cx, cy, s, w) {
      const g = mk('g', { transform: `translate(${cx} ${r1(cy)})` + (s !== 1 ? ` scale(${s})` : '') }, liquid);
      stream('M 0 -17 C -24 -17 -40 -6 -36 6 C -30 18 -10 21 0 23', 'smooth', w, g, false);
      stream('M 0 -17 C 24 -17 40 -6 36 6 C 30 18 10 21 0 23', 'smooth', w, g, false);
    }

    const D = dwells.reduce((s, d) => s + d.span, 0);
    const vMax = end + D;

    const teapot = drawTeapot(layer);
    const drop = mk('circle', { r: desktop ? 4.2 : 2.4, class: 'flow-drop', cx: -20, cy: -20 }, layer);

    // Точки основной струи: по высоте узнаём, где по горизонтали конец струи
    const samples = mains.map(p => {
      const L = p.getTotalLength(), pts = [];
      for (let l = 0; l <= L; l += 6) { const pt = p.getPointAtLength(l); pts.push([pt.x, pt.y]); }
      const last = p.getPointAtLength(L);
      pts.push([last.x, last.y]);
      return { y0: pts[0][1], y1: last.y, pts };
    });

    // Куски рисунка с бесконечной анимацией (блики струи, капли, пар, рябь): вдали от экрана
    // их анимацию ставим на паузу — телефону (особенно iPhone) не приходится перерисовывать всю длинную картинку
    const cull = [...back.children, ...liquid.children, ...front.children, teapot.g].map(el => {
      const r = el.getBoundingClientRect();
      return { el, y0: r.top + scrollY, y1: r.bottom + scrollY, off: false };
    });

    S = { W, H, desktop, spoutY, tp, teapot, drop, revealRect, samples, hidden, cull, scenes, dwells, bowl, shishi, pond, vMax, end, D };
    if (!vCur) vCur = spoutY;
    vCur = Math.min(vCur, vMax);
    lastW = W;
    lastH = document.documentElement.scrollHeight;
  }

  // ---------- раскладка для телефона и планшета ----------
  // Где по горизонтали стоят сцены, их размеры и высота пауз под них (считается до замеров страницы)
  function plan(W) {
    const P = PERSP, k = W >= 600 ? 1.2 : 1, X = W - 8, V = W - Math.round(46 * k);
    const s = { bowl: 0.8 * k, bud: 0.55 * k, cha: 0.72 * k, shi: 0.8 * k, stone: 0.8 * k, pond: (P ? 0.55 : 0.7) * k };
    // P: всё на одной вертикали V. Иначе — у правого края, но не ровно друг под другом:
    // между сценами струя уходит к самому краю (мимо текста и фото), бамбук переводит её туда и обратно
    const x = P ? { col: V, bud: V, cha: V, mouth: V, stone: V, pond: V }
      : { col: W - 14, bud: W - Math.round(40 * k), cha: W - Math.round(84 * k), mouth: W - Math.round(70 * k),
          stone: W - Math.round(60 * k), pond: W - Math.round(84 * k) };
    const dev = P ? null : DEVICES[VAR];
    const dh = (a, b) => (!dev || Math.abs(a - b) < 2) ? 0 : dev(a, 0, b, null).y; // высота бамбука
    // Правый край пиалы после наклона (в её собственных координатах): чай льётся отсюда
    const a = BOWL_TIP * Math.PI / 180, vx = 107 - 70, vy = 12 - 66;
    const rim = { x: 70 + vx * Math.cos(a) - vy * Math.sin(a), y: 66 + vx * Math.sin(a) + vy * Math.cos(a) };
    const bowlX = x.col - 7 - rim.x * s.bowl, xin = bowlX + 55 * s.bowl;

    // Раскладка внутри пауз (по высоте от верха паузы) и сами высоты пауз
    const L = {}, h = {};
    let sc = s.cha, din = dh(X, x.cha);
    L.cha = { dev: 6, cTop: P ? 10 : 6 + din + 4 - 8 * sc };
    h.cha = P ? L.cha.cTop + 118 * sc + 10 : L.cha.cTop + 112 * sc + 6 + dh(x.cha, X) + 8;

    sc = s.shi; din = dh(X, x.mouth);
    L.shi = { dev: 6, sY: P ? 12 + 12 * sc : 6 + din + 4 + 12 * sc };
    L.shi.dropEnd = L.shi.sY + 52 * sc + 2;
    h.shishi = P ? L.shi.sY + 50 * sc + 8 : L.shi.dropEnd + dh(x.mouth - 2 * sc, X) + 8;

    sc = s.stone; din = dh(X, x.stone);
    L.stone = { dev: 6, c: P ? 44 + 17 * sc : 6 + din + 6 + 17 * sc };
    h.stone = P ? L.stone.c + 23 * sc + 10 : L.stone.c + 23 * sc + 4 + dh(x.stone, X) + 8;

    sc = s.pond; din = dh(X, x.pond);
    L.pond = { dev: 6, c: P ? 12 + 26 * sc : 6 + din + 6 + 26 * sc };
    h.pond = L.pond.c + 30 * sc + 10;

    return { s, x, X, V, dev, dh, rim, bowlX, xin, fallX: P ? xin : X, L, h };
  }

  // Участки по высоте, где вертикаль x проходит через элементы sels (для вариантов с перспективой).
  // lines = true — по отдельным строкам текста, а не по всему блоку
  function spans(x, sels, lines) {
    const out = [];
    document.querySelectorAll(sels.join(',')).forEach(el => {
      const dy = scrollY - shiftY(el);
      let rects, rad = 0;
      if (lines) {
        const rg = document.createRange();
        rg.selectNodeContents(el);
        rects = [...rg.getClientRects()];
      } else {
        rects = [el.getBoundingClientRect()];
        rad = parseFloat(getComputedStyle(el).borderTopRightRadius) || 0;
      }
      rects.forEach(r => {
        if (x < r.left + 1 || x > r.right - 1 || r.height < 2) return;
        // скруглённые углы: у самого края карточка ниже, чем посередине
        const d = Math.min(x - r.left, r.right - x), rr = Math.min(rad, r.width / 2, r.height / 2);
        const inset = d < rr ? rr - Math.sqrt(rr * rr - (rr - d) ** 2) : 0;
        out.push([r.top + dy + inset, r.bottom + dy - inset]);
      });
    });
    out.sort((a, b) => a[0] - b[0]);
    const merged = [];
    for (const s of out) {
      const last = merged[merged.length - 1];
      if (last && s[0] <= last[1] + 2) last[1] = Math.max(last[1], s[1]);
      else merged.push([s[0], s[1]]);
    }
    return merged;
  }
  // Насколько элемент сейчас сдвинут анимацией появления (.reveal) — меряем его «настоящее» место
  function shiftY(el) {
    let dy = 0;
    for (let a = el; a && a !== document.body; a = a.parentElement) {
      const t = getComputedStyle(a).transform;
      if (t && t !== 'none') dy += new DOMMatrixReadOnly(t).m42;
    }
    return dy;
  }
  // Что струя «обходит» в вариантах с перспективой
  const CARDS = ['.hero .neon', '#status', '.hero__actions .btn', '.moongate', '.about__media img', '.facts li', '.teaser', '.visit__map', '.visit__info .btn'];
  const TEXT = ['.hero__eyebrow', '.hero .neon span', '.hero__lead', '.section__head .kicker', '.section__head h2',
    '.about__text .kicker', '.about__text h2', '.about__text > p', '.visit__info .kicker', '.visit__info h2', '.info dt', '.info dd'];

  // ---------- бамбук, переводящий струю вбок (телефон, варианты 1–4) ----------
  // Чай падает сверху отвесно в точку (x1, y), бамбук уводит его вбок, и дальше он снова падает отвесно в x2.
  // Возвращает продолжение пути чая (cmds) и высоту, откуда чай снова падает отвесно (y).
  // Без c — только считает высоту (для раскладки пауз).
  const deg = (dx, dy) => Math.atan2(dy, dx) * 180 / Math.PI;
  const tailRoom = (c, x, dir, want) => Math.max(2, Math.min(want, dir < 0 ? c.W - x - 6 : x - 6));
  function bPole(g, x1, y1, x2, y2, w, groove = true) {
    mk('line', { x1: r1(x1), y1: r1(y1), x2: r1(x2), y2: r1(y2), class: 'bd-pole', 'stroke-width': w }, g);
    if (groove) mk('line', { x1: r1(x1), y1: r1(y1), x2: r1(x2), y2: r1(y2), class: 'bd-groove', 'stroke-width': r1(w * 0.42) }, g);
    const len = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / len * w * 0.62, ny = (x2 - x1) / len * w * 0.62;
    const n = Math.max(1, Math.round(len / 36));
    for (let i = 1; i <= n; i++) {
      const t = i / (n + 1), cx = x1 + (x2 - x1) * t, cy = y1 + (y2 - y1) * t;
      mk('line', { x1: r1(cx - nx), y1: r1(cy - ny), x2: r1(cx + nx), y2: r1(cy + ny), class: 'bd-node' }, g);
    }
  }
  function bCut(g, x, y, ang, w) { // открытый срез ствола — тёмный овал поперёк
    mk('ellipse', { cx: r1(x), cy: r1(y), rx: r1(w * 0.24), ry: r1(w * 0.5), class: 'bd-cut', transform: `rotate(${r1(ang)} ${r1(x)} ${r1(y)})` }, g);
  }
  function bLeaf(g, x, y, r, s = 0.7) {
    mk('path', { d: 'M 0 0 c 8 -6 20 -6 26 -2 c -8 4 -18 6 -26 2 Z', class: 'bb-leaf', transform: `translate(${r1(x)} ${r1(y)}) rotate(${r}) scale(${s})` }, g);
  }
  const DEVICES = {
    // 1. Жёлоб: один расколотый ствол на скрещённых палочках; чай бежит по нему и срывается дугой с нижнего края
    1(x1, y, x2, c) {
      const dir = Math.sign(x2 - x1), k = 0.3;
      const tail = c ? tailRoom(c, x1, dir, 12) : 12;
      const ax = x1 - dir * tail, ay = y + 4;
      const bx = x2 - dir * 6, by = ay + k * Math.abs(bx - ax);
      const cmds = `L ${x1} ${r1(ay + k * tail)} L ${r1(bx)} ${r1(by)} C ${r1(bx + dir * 4)} ${r1(by + 1)} ${x2} ${r1(by + 6)} ${x2} ${r1(by + 16)}`;
      if (c) {
        const g = mk('g', {}, c.back);
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        mk('line', { x1: r1(mx - 10), y1: r1(my + 22), x2: r1(mx + 5), y2: r1(my - 2), class: 'bd-stick' }, g);
        mk('line', { x1: r1(mx + 10), y1: r1(my + 22), x2: r1(mx - 5), y2: r1(my - 2), class: 'bd-stick' }, g);
        bPole(g, ax, ay, bx, by, 10);
        bCut(g, bx, by, deg(bx - ax, by - ay), 10);
        mk('line', { x1: r1(mx - 4), y1: r1(my + 3), x2: r1(mx + 4), y2: r1(my + 5), class: 'bd-tie' }, g);
        bLeaf(g, ax + dir * 4, ay - 3, dir < 0 ? -115 : -65);
      }
      return { cmds, y: by + 16 };
    },
    // 2. Лесенка: короткие колена ступеньками, чай перескакивает с одного на следующее
    2(x1, y, x2, c) {
      const dir = Math.sign(x2 - x1), dx = Math.abs(x2 - x1), n = Math.max(dx < 40 ? 1 : 2, Math.round(dx / 36)), L = dx / n, k = 0.26;
      let cx = x1, cy = y + 4, cmds = `L ${cx} ${r1(cy)}`;
      const g = c && mk('g', {}, c.back);
      for (let i = 0; i < n; i++) {
        const run = L * 0.68, ex = cx + dir * run, ey = cy + k * run;
        const nx = cx + dir * L, ny = ey + 12;
        cmds += ` L ${r1(ex)} ${r1(ey)} C ${r1(ex + dir * (L - run) * 0.8)} ${r1(ey + 1.5)} ${r1(nx)} ${r1(ny - 7)} ${r1(nx)} ${r1(ny)}`;
        if (g) {
          const tail = tailRoom(c, cx, dir, 8), sx = cx - dir * tail, sy = cy - k * tail;
          bPole(g, sx, sy, ex + dir * 2, ey + k * 2, 8);
          bCut(g, ex + dir * 2, ey + k * 2, deg(dir, k), 8);
          mk('line', { x1: r1(sx + dir * 3), y1: r1(sy - 4), x2: r1(sx + dir * 3), y2: r1(sy + 5), class: 'bd-tie' }, g);
          if (i % 2 === 0) bLeaf(g, sx, sy - 2, dir < 0 ? -110 : -70, 0.55);
        }
        cx = nx; cy = ny;
      }
      return { cmds, y: cy };
    },
    // 3. Труба (какэи): чай уходит в бамбуковую чашку, бежит внутри закрытой трубы и льётся из среза
    3(x1, y, x2, c) {
      const dir = Math.sign(x2 - x1), k = 0.34, cw = 15;
      const cupT = y + 3, cupB = y + 24, ay = cupB - 6;
      const bx = x2 - dir * 7, by = ay + k * Math.abs(bx - x1);
      const cmds = `L ${x1} ${r1(ay)} L ${r1(bx)} ${r1(by)} C ${r1(bx + dir * 4)} ${r1(by + 1)} ${x2} ${r1(by + 6)} ${x2} ${r1(by + 16)}`;
      if (c) {
        c.hidden.push([cupT + 2, by + 1]);
        const g = mk('g', {}, c.front);
        const mx = (x1 + bx) / 2, my = (ay + by) / 2;
        mk('line', { x1: r1(mx), y1: r1(my), x2: r1(mx), y2: r1(my + 22), class: 'bd-stick' }, g);
        bPole(g, x1, ay, bx, by, 9, false);
        bCut(g, bx, by, deg(bx - x1, by - ay), 9);
        mk('rect', { x: r1(x1 - cw / 2), y: r1(cupT), width: cw, height: r1(cupB - cupT + 3), rx: 3, class: 'bd-cup' }, g);
        mk('line', { x1: r1(x1 - cw / 2), y1: r1(cupT + 13), x2: r1(x1 + cw / 2), y2: r1(cupT + 13), class: 'bd-node' }, g);
        mk('ellipse', { cx: x1, cy: r1(cupT), rx: cw / 2, ry: 2.4, class: 'bd-cut' }, g);
        mk('ellipse', { cx: x1, cy: r1(cupT + 0.6), rx: cw / 2 - 2, ry: 1.4, class: 'bd-tea', 'clip-path': 'url(#flowReveal)' }, g);
        bLeaf(g, x1 + dir * cw / 2, cupT + 8, dir < 0 ? -80 : -100, 0.55);
      }
      return { cmds, y: by + 16 };
    },
    // 4. Отбойники: тонкие палочки на колышках; струя бьёт в палочку, скользит по ней и летит дальше дугой
    4(x1, y, x2, c) {
      const dir = Math.sign(x2 - x1), dx = Math.abs(x2 - x1), m = dx > 80 ? 2 : 1, part = dx / m, k = 0.42;
      let cx = x1, cy = y + 4, cmds = `L ${cx} ${r1(cy)}`;
      const g = c && mk('g', {}, c.back);
      for (let i = 0; i < m; i++) {
        const slide = part * 0.4, ex = cx + dir * slide, ey = cy + k * slide;
        const tx = cx + dir * part, qy = ey + k * (part - slide), ty = qy + 14;
        // дуга полёта: вылетает вдоль палочки, к концу падает отвесно
        cmds += ` L ${r1(ex)} ${r1(ey)} Q ${r1(tx)} ${r1(qy)} ${r1(tx)} ${r1(ty)}`;
        if (g) {
          const tail = tailRoom(c, cx, dir, 10), o = 4; // палочка чуть ниже струи: чай скользит по ней сверху
          const ax = cx - dir * tail, ay = cy - k * tail + o, bx = ex + dir * 5, by = ey + k * 5 + o;
          mk('line', { x1: r1((ax + bx) / 2), y1: r1((ay + by) / 2), x2: r1((ax + bx) / 2), y2: r1((ay + by) / 2 + 16), class: 'bd-stick' }, g);
          mk('line', { x1: r1(ax), y1: r1(ay), x2: r1(bx), y2: r1(by), class: 'bd-rod-edge' }, g); // тёмный край — чтобы палочка не сливалась с чаем
          bPole(g, ax, ay, bx, by, 6, false);
          mk('circle', { cx: r1((ax + bx) / 2), cy: r1((ay + by) / 2), r: 1.8, class: 'bd-peg' }, g);
          // брызги в месте удара
          [[-5, -3], [5, -6], [-1, -8]].forEach(([ddx, ddy]) =>
            mk('circle', { cx: r1(cx - dir * ddx), cy: r1(cy + ddy), r: 1.2, class: 'flow-drop' }, c.liquid));
        }
        cx = tx; cy = ty;
        if (i < m - 1) { cy += 6; cmds += ` L ${r1(cx)} ${r1(cy)}`; }
      }
      return { cmds, y: cy };
    },
  };

  function xAt(h) {
    for (const [a, b] of S.hidden) if (h >= a && h <= b) return null;
    for (const s of S.samples) {
      if (h < s.y0 || h > s.y1) continue;
      for (const [x, y] of s.pts) if (y >= h) return x;
    }
    return null;
  }

  // ---------- кадр анимации ----------
  function frame() {
    running = false;
    if (!S) return;
    const s = scrollY, vh = innerHeight;
    const smax = Math.max(1, document.documentElement.scrollHeight - vh);
    const p = clamp(s / smax);

    // Наклон чайника в первые ~110 px прокрутки
    const tilt = reduce ? 1 : ease(clamp(s / 110));
    S.teapot.g.setAttribute('transform', `translate(${S.tp.cx.toFixed(1)} ${S.tp.cy.toFixed(1)}) rotate(${(tilt * TILT).toFixed(2)}) scale(${S.tp.sc})`);
    S.teapot.steam.setAttribute('opacity', (1 - tilt).toFixed(2));

    // Куда должна дотянуться струя: конец держится в пределах экрана и доходит до низа к концу страницы
    const t2 = reduce ? 1 : clamp((s - 90) / 90);
    let base = s + vh * (0.35 + 0.5 * p) + S.D * p;
    // В самом низу страницы струя обязана долиться в пруд при любой высоте экрана:
    // если без поправки она не дотягивается, в последних 20% прокрутки плавно добавляем недостающее
    const shortfall = S.vMax - (smax + vh * 0.85 + S.D);
    if (shortfall > 0) base += shortfall * ease(clamp((p - 0.8) / 0.2));
    let target = S.spoutY + t2 * (base - S.spoutY);
    target = reduce ? S.vMax : clamp(target, S.spoutY, S.vMax);

    vCur += (target - vCur) * 0.14;          // плавное «догоняние» — ощущение текучести
    if (Math.abs(target - vCur) < 0.4) vCur = target;

    // Пока что-то наполняется (пиала, трубка сисиодоси), конец струи стоит на месте.
    // Каждая остановка «съедает» свою часть прокрутки; d.t — насколько она наполнена (0…1).
    let h = null, inDwell = false, shift = 0;
    for (const d of S.dwells) {
      const v = vCur - shift;
      if (h !== null) { d.t = 0; continue; }
      if (v <= d.y) { h = v; d.t = 0; }
      else if (v < d.y + d.span) { h = d.y; d.t = (v - d.y) / d.span; inDwell = true; }
      else { d.t = 1; shift += d.span; }
    }
    if (h === null) h = vCur - shift;
    // Пока чайник не наклонился, струи нет совсем (без «первой капли» у носика)
    const pouring = t2 > 0 && h > S.spoutY + 1;
    S.revealRect.setAttribute('height', pouring ? (h + 1).toFixed(1) : 0);

    const [dBowl, dShishi] = S.dwells;
    S.bowl.level(ease(dBowl.t));
    S.bowl.spill(Math.max(0, h - dBowl.y));
    S.shishi.update(dShishi.t, h > dShishi.y);
    if (S.scenes.buddha) S.scenes.buddha.el.classList.toggle('is-wet', h > S.scenes.buddha.y + 2);
    if (S.scenes.stone) S.scenes.stone.el.classList.toggle('is-wet', h > S.scenes.stone.y + 2);
    if (S.pond) S.pond.fill(clamp((h - (S.end - 34)) / 32));

    // Капля на конце струи
    const x = (!reduce && !inDwell && t2 > 0 && h < S.end - 1) ? xAt(h) : null;
    if (x === null) S.drop.setAttribute('opacity', 0);
    else { S.drop.setAttribute('cx', x.toFixed(1)); S.drop.setAttribute('cy', h.toFixed(1)); S.drop.setAttribute('opacity', 1); }

    // Анимации вдали от экрана — на паузу
    const lo = s - 400, hi = s + vh + 400;
    for (const c of S.cull) {
      const off = c.y1 < lo || c.y0 > hi;
      if (off !== c.off) { c.off = off; c.el.classList.toggle('flow-off', off); }
    }

    if (vCur !== target) kick();
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(frame); } }

  // ---------- рисунки ----------
  function gradients(defs) {
    const lin = (id, stops, attrs = { x1: 0, y1: 0, x2: 0, y2: 1 }) => {
      const g = mk('linearGradient', { id, ...attrs }, defs);
      stops.forEach(([o, c, op = 1]) => mk('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }, g));
    };
    const rad = (id, stops, attrs = {}) => {
      const g = mk('radialGradient', { id, ...attrs }, defs);
      stops.forEach(([o, c, op = 1]) => mk('stop', { offset: o, 'stop-color': c, 'stop-opacity': op }, g));
    };
    rad('porc', [[0, '#ffffff'], [0.6, '#eef2f8'], [1, '#c3cedc']], { cx: 0.4, cy: 0.35, r: 0.75 });
    lin('gold', [[0, '#f3d27a'], [1, '#b8862e']]);
    lin('bronze', [[0, '#dcb56a'], [0.55, '#a77a3b'], [1, '#6a4720']]);
    rad('halo', [[0, '#f3d27a', 0.55], [1, '#f3d27a', 0]]);
    rad('stone', [[0, '#7a6d63'], [1, '#2a2420']], { cx: 0.35, cy: 0.3, r: 0.8 });
    rad('ember', [[0, '#ff5a2a', 0.45], [1, '#ff5a2a', 0]]);
    rad('pondTea', [[0, '#e0a640'], [1, '#9a6014']]);
    rad('bowlInner', [[0, '#c4cfdd'], [0.7, '#e6ecf4'], [1, '#ffffff']], { cy: 0.35 });
    rad('bowlTea', [[0, '#c3dc68'], [1, '#86a82e']]);
  }

  // Фарфоровый чайник: белый, кобальтовый узор, золото. Центр корпуса — (0, 0)
  function drawTeapot(parent) {
    const g = mk('g', { class: 'teapot' }, parent);
    mk('path', { d: 'M -50 -18 C -98 -30 -102 32 -50 24', class: 'tp-handle-out' }, g);
    mk('path', { d: 'M -50 -18 C -98 -30 -102 32 -50 24', class: 'tp-handle-in' }, g);
    mk('path', { d: 'M 50 -4 C 64 -6 70 -12 80 -26 C 82 -29 87 -28 86 -23 C 80 -8 72 8 54 14 Z', fill: 'url(#porc)', stroke: '#aebccd', 'stroke-width': 1 }, g);
    mk('path', { d: 'M -58 0 C -58 -30 -32 -40 0 -40 C 32 -40 58 -30 58 0 C 58 32 34 50 0 50 C -34 50 -58 32 -58 0 Z', fill: 'url(#porc)', stroke: '#aebccd', 'stroke-width': 1.2 }, g);
    mk('ellipse', { cx: 0, cy: 49, rx: 26, ry: 4, fill: '#c3cfdd' }, g);
    mk('path', { d: 'M -50 -20 C -30 -32 30 -32 50 -20', class: 'tp-cobalt', 'stroke-width': 3 }, g);
    mk('path', { d: 'M -53 -14 C -30 -27 30 -27 53 -14', stroke: 'url(#gold)', 'stroke-width': 1.3, fill: 'none' }, g);
    mk('path', { d: 'M -54 18 C -30 34 30 34 54 18', class: 'tp-cobalt', 'stroke-width': 2 }, g);
    mk('circle', { cx: 0, cy: 3, r: 15, class: 'tp-cobalt', 'stroke-width': 1.8 }, g);
    for (let i = 0; i < 5; i++) mk('ellipse', { cx: 0, cy: -4, rx: 3.6, ry: 7, fill: '#2453a6', opacity: 0.88, transform: `rotate(${i * 72} 0 3)` }, g);
    mk('circle', { cx: 0, cy: 3, r: 2.6, fill: 'url(#gold)' }, g);
    mk('path', { d: 'M -40 6 c 4 -7 13 -5 11 1 c -2 5 -9 4 -7 -1', class: 'tp-cobalt', 'stroke-width': 1.6 }, g);
    mk('path', { d: 'M 29 6 c 4 -7 13 -5 11 1 c -2 5 -9 4 -7 -1', class: 'tp-cobalt', 'stroke-width': 1.6 }, g);
    mk('path', { d: 'M -20 -40 C -18 -53 18 -53 20 -40 Z', fill: 'url(#porc)', stroke: '#aebccd', 'stroke-width': 1 }, g);
    mk('ellipse', { cx: 0, cy: -39, rx: 26, ry: 6, fill: 'url(#porc)', stroke: 'url(#gold)', 'stroke-width': 1.6 }, g);
    mk('circle', { cx: 0, cy: -54, r: 5, fill: 'url(#gold)' }, g);
    mk('ellipse', { cx: -24, cy: -14, rx: 9, ry: 17, fill: '#fff', opacity: 0.55, transform: 'rotate(-22 -24 -14)' }, g);
    const steam = mk('g', { class: 'tp-steam' }, g);
    mk('path', { d: 'M -6 -64 c -6 -8 5 -13 0 -21 c -4 -6 3 -10 1 -15' }, steam);
    mk('path', { d: 'M 7 -62 c 6 -8 -5 -13 0 -20' }, steam);
    return { g, steam };
  }

  // Статуэтка сидящего Будды (бронза). Размер 120×132, верх головы — (60, 9); s — масштаб
  function drawBuddha(parent, x, y, s = 1) {
    const g = mk('g', { transform: `translate(${r1(x)} ${r1(y)})` + (s !== 1 ? ` scale(${s})` : ''), class: 'buddha' }, parent);
    mk('circle', { cx: 60, cy: 30, r: 30, fill: 'url(#halo)' }, g);
    mk('path', { d: 'M 8 116 Q 14 104 24 114 Q 32 102 42 114 Q 51 102 60 114 Q 69 102 78 114 Q 88 102 96 114 Q 106 104 112 116 L 108 126 L 12 126 Z', fill: 'url(#bronze)', stroke: '#5a3c1a', 'stroke-width': 0.8 }, g);
    mk('rect', { x: 18, y: 124, width: 84, height: 8, rx: 2, fill: '#6a4720' }, g);
    // скрещённые ноги и ступни
    mk('ellipse', { cx: 60, cy: 104, rx: 46, ry: 12, fill: 'url(#bronze)' }, g);
    mk('ellipse', { cx: 41, cy: 103, rx: 7, ry: 3, fill: '#e2c07a', opacity: 0.8 }, g);
    mk('ellipse', { cx: 79, cy: 103, rx: 7, ry: 3, fill: '#e2c07a', opacity: 0.8 }, g);
    // туловище
    mk('path', { d: 'M 60 43 C 50 43 41 45 35 50 C 28 56 26 66 27 78 C 28 90 33 98 40 102 L 80 102 C 87 98 92 90 93 78 C 94 66 92 56 85 50 C 79 45 70 43 60 43 Z', fill: 'url(#bronze)' }, g);
    // руки, опущенные на колени
    mk('path', { d: 'M 35 50 C 24 58 20 76 26 90 C 30 98 40 100 48 98 L 46 92 C 38 92 33 86 33 78 C 33 68 36 60 40 54 Z', fill: 'url(#bronze)', stroke: '#6a4720', 'stroke-width': 0.6 }, g);
    mk('path', { d: 'M 85 50 C 96 58 100 76 94 90 C 90 98 80 100 72 98 L 74 92 C 82 92 87 86 87 78 C 87 68 84 60 80 54 Z', fill: 'url(#bronze)', stroke: '#6a4720', 'stroke-width': 0.6 }, g);
    // складки одежды
    mk('path', { d: 'M 42 52 C 54 62 66 78 74 100 M 52 46 q 8 4 16 0', stroke: '#6a4720', 'stroke-width': 1.3, fill: 'none', opacity: 0.6 }, g);
    // ладони
    mk('ellipse', { cx: 60, cy: 95, rx: 14, ry: 5.5, fill: '#e2c07a' }, g);
    // голова, уши, ушниша (выпуклость на макушке)
    mk('ellipse', { cx: 45.5, cy: 32, rx: 3, ry: 8, fill: '#b98a45' }, g);
    mk('ellipse', { cx: 74.5, cy: 32, rx: 3, ry: 8, fill: '#b98a45' }, g);
    mk('circle', { cx: 60, cy: 29, r: 13.5, fill: 'url(#bronze)' }, g);
    mk('circle', { cx: 60, cy: 14, r: 6, fill: '#a77a3b' }, g);
    mk('path', { d: 'M 52.5 30 q 3 2 6 0 M 61.5 30 q 3 2 6 0 M 57 37 q 3 1.6 6 0', stroke: '#4a3216', 'stroke-width': 1.1, fill: 'none', 'stroke-linecap': 'round' }, g);
    mk('circle', { cx: 60, cy: 24, r: 1, fill: '#4a3216' }, g);
    return g;
  }

  function drawSplash(parent, x, y) {
    const g = mk('g', { class: 'splash' }, parent);
    [[-14, -10], [14, -12], [-20, -2], [20, -4], [-8, -16], [8, -18]].forEach(([dx, dy], i) => {
      mk('circle', { cx: x, cy: y, r: 1.9, fill: '#b9d65a', style: `--dx:${dx}px;--dy:${dy}px;animation-delay:${i * 0.12}s` }, g);
    });
    return g;
  }

  // Фарфоровая пиала в стиле чайника (110×68): белая, кобальтовая роспись, золотой ободок.
  // Верх края — y 0, центр края — y 12, низ ножки — y 68. Чай поднимается к краю, потом:
  //   компьютер — переливается по передней стенке;
  //   телефон (s — масштаб) — пиала наклоняется вправо на ножке и выливает чай через правый край.
  function drawBowl(back, front, bx, by, defs, stream, s = 0) {
    const tilt = s > 0;
    const pos = `translate(${r1(bx)} ${r1(by)})` + (tilt ? ` scale(${s})` : '');
    // Внутренняя стенка (видна в чаше над поверхностью чая)
    const bi = mk('g', {}, mk('g', { transform: pos }, back));
    mk('ellipse', { cx: 55, cy: 12, rx: 52, ry: 11, fill: 'url(#bowlInner)' }, bi);

    const g = mk('g', {}, mk('g', { transform: pos }, front));
    // Поверхность чая — только внутри края
    const clip = mk('clipPath', { id: 'bowlIn' }, defs);
    mk('ellipse', { cx: 55, cy: 12, rx: 50, ry: 10 }, clip);
    const inside = mk('g', { 'clip-path': 'url(#bowlIn)' }, g);
    const tea = mk('ellipse', { cx: 55, cy: 21, rx: 26, ry: 4.5, fill: 'url(#bowlTea)', opacity: 0 }, inside);
    const shine = mk('ellipse', { cx: 45, cy: 19, rx: 9, ry: 1.6, fill: '#f4ffd0', opacity: 0 }, inside);
    const leaves = mk('g', { opacity: 0 }, inside);
    [[44, 0, 25], [64, 1.5, -35], [55, -1.5, 70]].forEach(([x, y, r]) =>
      mk('ellipse', { cx: x, cy: y, rx: 4.6, ry: 1.7, transform: `rotate(${r} ${x} ${y})`, fill: '#5d7d22' }, leaves));

    // Корпус: нижняя половина края + изгиб чаши
    mk('path', { d: 'M 3 12 C 6 40 28 58 55 58 C 82 58 104 40 107 12 A 52 11 0 0 1 3 12 Z', fill: 'url(#porc)', stroke: '#aebccd', 'stroke-width': 1 }, g);
    mk('path', { d: 'M 38 57 L 40 66 L 70 66 L 72 57 Z', fill: 'url(#porc)', stroke: '#aebccd', 'stroke-width': 1 }, g);
    mk('ellipse', { cx: 55, cy: 66, rx: 15, ry: 2.2, fill: '#c3cfdd' }, g);
    // Роспись: поясок под краем, медальон с цветком, завитки облаков, линия у ножки
    mk('path', { d: 'M 7 22 C 22 34 88 34 103 22', class: 'tp-cobalt', 'stroke-width': 2.4 }, g);
    mk('path', { d: 'M 9 27 C 24 38 86 38 101 27', stroke: 'url(#gold)', 'stroke-width': 1, fill: 'none' }, g);
    mk('circle', { cx: 55, cy: 44, r: 8.5, class: 'tp-cobalt', 'stroke-width': 1.5 }, g);
    for (let i = 0; i < 5; i++) mk('ellipse', { cx: 55, cy: 40, rx: 2.2, ry: 4.2, fill: '#2453a6', opacity: 0.88, transform: `rotate(${i * 72} 55 44)` }, g);
    mk('circle', { cx: 55, cy: 44, r: 1.6, fill: 'url(#gold)' }, g);
    mk('path', { d: 'M 24 40 c 3 -5 9 -4 8 1 c -1 4 -6 3 -5 -1', class: 'tp-cobalt', 'stroke-width': 1.3 }, g);
    mk('path', { d: 'M 78 40 c 3 -5 9 -4 8 1 c -1 4 -6 3 -5 -1', class: 'tp-cobalt', 'stroke-width': 1.3 }, g);
    mk('path', { d: 'M 40 61 L 70 61', class: 'tp-cobalt', 'stroke-width': 1.2 }, g);
    mk('ellipse', { cx: 24, cy: 34, rx: 6, ry: 12, fill: '#fff', opacity: 0.5, transform: 'rotate(-35 24 34)' }, g);
    // Золотой ободок
    mk('ellipse', { cx: 55, cy: 12, rx: 52, ry: 11, fill: 'none', stroke: 'url(#gold)', 'stroke-width': 1.8 }, g);

    // Перелив (компьютер): ручейки с переднего края по стенке к ножке
    let spillRect = null;
    if (!tilt) {
      const spillClip = mk('clipPath', { id: 'spillReveal' }, defs);
      spillRect = mk('rect', { x: -10, y: 0, width: 130, height: 0 }, spillClip);
      const sg = mk('g', { 'clip-path': 'url(#spillReveal)' }, g);
      stream('M 38 22 C 36 34 40 48 47 57 C 49 61 52 66 55 70', 'smooth', 2.4, sg, false);
      stream('M 72 22 C 74 34 70 48 63 57 C 61 61 58 66 55 70', 'smooth', 2.4, sg, false);
    }

    let lvl = 0, ang = 0;
    function paint() {
      const l = lvl, cy = 12 + (1 - l) * 9;
      // поверхность чая остаётся горизонтальной, даже когда пиала наклонена
      const flat = ang ? `rotate(${(-ang).toFixed(2)} 55 ${cy.toFixed(1)}) ` : '';
      tea.setAttribute('cy', cy.toFixed(1));
      tea.setAttribute('rx', (26 + 24 * l).toFixed(1));
      tea.setAttribute('ry', (4.5 + 5.5 * l).toFixed(1));
      tea.setAttribute('opacity', l > 0.02 ? 1 : 0);
      tea.setAttribute('transform', flat);
      shine.setAttribute('cy', (cy - 2 * l).toFixed(1));
      shine.setAttribute('opacity', (l * 0.6).toFixed(2));
      shine.setAttribute('transform', flat);
      leaves.setAttribute('transform', `${flat}translate(0 ${cy.toFixed(1)})`);
      leaves.setAttribute('opacity', clamp((l - 0.3) / 0.4).toFixed(2));
    }
    return {
      level(l) { if (l !== lvl) { lvl = l; paint(); } },
      // px — насколько струя ушла ниже поверхности чая (после наполнения)
      spill(px) {
        if (!tilt) { spillRect.setAttribute('height', (clamp(px / 30) * 72).toFixed(1)); return; }
        const a = BOWL_TIP * ease(clamp(px / 14));
        if (a === ang) return;
        ang = a;
        const t = a ? `rotate(${a.toFixed(2)} 70 66)` : ''; // поворот вокруг правого края ножки
        bi.setAttribute('transform', t);
        g.setAttribute('transform', t);
        paint();
      },
    };
  }
  const BOWL_TIP = 32; // на сколько градусов наклоняется пиала на телефоне

  // Иероглиф 茶, написанный чаем; s — масштаб
  function drawCha(parent, gx, top, s = 1) {
    const cg = mk('g', { transform: `translate(${r1(gx)} ${r1(top)})` + (s !== 1 ? ` scale(${s})` : '') }, parent);
    CHA.forEach(d => {
      mk('path', { d, class: 'flow-brush-edge' }, cg);
      mk('path', { d, class: 'flow-brush' }, cg);
    });
  }

  // Иероглиф 茶 («чай»), 110×120: струя попадает в середину верхней черты
  const CHA = [
    'M 14 22 L 96 22',
    'M 36 8 C 37 16 38 24 40 34',
    'M 74 8 C 73 16 72 24 70 34',
    'M 55 38 C 47 51 32 62 10 70',
    'M 55 38 C 64 51 79 62 102 70',
    'M 28 80 L 84 80',
    'M 56 66 L 56 110 C 56 115 51 116 46 112',
    'M 42 90 C 38 98 31 104 22 109',
    'M 70 90 C 74 98 81 104 90 109',
  ];

  // Сисиодоси — бамбуковая трубка на оси (японский садовый «отпугиватель оленей»).
  // Ось — в точке (px, py). Открытый срезанный конец слева: в покое он поднят (поворот +18°)
  // и принимает струю; наполнившись, трубка опрокидывается (−28°), выливает чай,
  // возвращается и стучит закрытым концом о камень справа.
  // s — масштаб; mirror — зеркально (открытый конец справа), так стоит на телефоне.
  function drawShishi(parent, px, py, s = 1, mirror = false) {
    const g = mk('g', { transform: `translate(${r1(px)} ${r1(py)})` + (s !== 1 || mirror ? ` scale(${mirror ? -s : s} ${s})` : ''), class: 'shishi' }, parent);
    mk('ellipse', { cx: 2, cy: 49, rx: 46, ry: 5, fill: 'rgba(60, 45, 30, .22)' }, g);       // тень на земле
    mk('ellipse', { cx: 30, cy: 23.5, rx: 13, ry: 6.5, fill: 'url(#stone)' }, g);            // камень для стука (под закрытым концом)
    mk('ellipse', { cx: -22, cy: 46, rx: 7, ry: 3.5, fill: '#7a6d63' }, g);                  // галька
    mk('ellipse', { cx: 18, cy: 47, rx: 5, ry: 2.6, fill: '#8a7d72' }, g);
    // две стойки
    [-6, 6].forEach(x => {
      mk('line', { x1: x, y1: -12, x2: x, y2: 48, stroke: '#9fb456', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
      mk('line', { x1: x - 3.5, y1: 22, x2: x + 3.5, y2: 22, stroke: '#7f9638', 'stroke-width': 2 }, g);
    });
    // трубка
    const tube = mk('g', { transform: 'rotate(18)' }, g);
    mk('path', { d: 'M -37 -7 L 32 -7 Q 39 0 32 7 L -30 7 Z', fill: '#b6c868', stroke: '#6f8a2c', 'stroke-width': 1.2, 'stroke-linejoin': 'round' }, tube);
    mk('line', { x1: -26, y1: -3.5, x2: 28, y2: -3.5, stroke: '#eef3c4', 'stroke-width': 1.6, opacity: 0.6, 'stroke-linecap': 'round' }, tube);
    [-8, 16].forEach(x => mk('line', { x1: x, y1: -7, x2: x, y2: 7, stroke: '#7f9638', 'stroke-width': 2.2 }, tube));
    mk('ellipse', { cx: -33.5, cy: 0, rx: 3, ry: 7, fill: '#3f5418', transform: 'rotate(-28 -33.5 0)' }, tube); // открытый срез
    const water = mk('ellipse', { cx: -33, cy: -0.5, rx: 2, ry: 5.4, fill: '#9cc23f', opacity: 0, transform: 'rotate(-28 -33 -0.5)' }, tube);
    mk('circle', { cx: 0, cy: 0, r: 2.8, fill: '#5a4630' }, g); // ось
    // Бесконечный цикл после того, как трубка впервые наполнилась
    const anim = reduce ? null : mk('animateTransform', {
      attributeName: 'transform', type: 'rotate',
      values: '-28;-28;18;18;-28', keyTimes: '0;0.12;0.24;0.86;1',
      calcMode: 'spline', keySplines: '0 0 1 1;.4 0 .2 1;0 0 1 1;.7 0 1 1',
      dur: '3.6s', begin: 'indefinite', repeatCount: 'indefinite',
    }, tube);
    let cycling = false;
    return {
      update(t, passed) {
        water.setAttribute('opacity', passed ? 1 : clamp(t * 3).toFixed(2));
        if (passed) {
          if (anim && !cycling) { anim.beginElement(); cycling = true; }
          if (!anim) tube.setAttribute('transform', 'rotate(-28)');
          return;
        }
        if (cycling) { anim.endElement(); cycling = false; }
        // Наполняется в покое и опрокидывается в самом конце наполнения
        tube.setAttribute('transform', `rotate(${(18 - 46 * ease(clamp((t - 0.8) / 0.2))).toFixed(1)})`);
      },
    };
  }

  // Три бамбуковых жёлоба зигзагом
  function drawBamboo(parent, X, y0) {
    const g = mk('g', { class: 'bamboo' }, parent);
    const trough = (x1, y1, x2, y2) => {
      mk('line', { x1, y1, x2, y2, class: 'bb-outer' }, g);
      mk('line', { x1, y1, x2, y2, class: 'bb-inner' }, g);
      [0.33, 0.66].forEach(t => {
        const cx = x1 + (x2 - x1) * t, cy = y1 + (y2 - y1) * t;
        const len = Math.hypot(x2 - x1, y2 - y1), nx = -(y2 - y1) / len * 7, ny = (x2 - x1) / len * 7;
        mk('line', { x1: cx - nx, y1: cy - ny, x2: cx + nx, y2: cy + ny, class: 'bb-node' }, g);
      });
    };
    trough(X + 18, y0 - 3, X - 52, y0 + 27);
    trough(X - 52, y0 + 57, X + 52, y0 + 87);
    trough(X + 52, y0 + 117, X - 2, y0 + 141);
    const leaf = (x, y, r) => mk('path', { d: `M ${x} ${y} c 8 -6 20 -6 26 -2 c -8 4 -18 6 -26 2 Z`, class: 'bb-leaf', transform: `rotate(${r} ${x} ${y})` }, g);
    leaf(X + 20, y0 - 6, -25); leaf(X - 56, y0 + 54, 200); leaf(X + 54, y0 + 112, -30);
  }

  function drawStone(parent, X, y) {
    const g = mk('g', {}, parent);
    mk('ellipse', { cx: X, cy: y + 10, rx: 56, ry: 18, fill: 'url(#ember)' }, g);
    mk('ellipse', { cx: X, cy: y, rx: 36, ry: 17, fill: 'url(#stone)' }, g);
    mk('ellipse', { cx: X - 10, cy: y - 7, rx: 14, ry: 4, fill: '#fff', opacity: 0.13 }, g);
  }

  function drawSteam(parent, X, top) {
    const g = mk('g', { class: 'steam' }, parent);
    [[X - 16, 0], [X, 0.8], [X + 15, 1.6]].forEach(([x, delay]) =>
      mk('path', { d: `M ${x} ${top - 4} c -6 -8 5 -13 0 -21 c -5 -7 4 -12 1 -18`, style: `animation-delay:${delay}s` }, g));
    return g;
  }

  function drawPond(back, front, X, y) {
    const b = mk('g', {}, back);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      mk('ellipse', { cx: X + Math.cos(a) * 68, cy: y + Math.sin(a) * 24, rx: 9, ry: 5.5, class: 'pond-stone' }, b);
    }
    mk('ellipse', { cx: X, cy: y, rx: 62, ry: 20, class: 'pond-basin' }, b);
    const f = mk('g', { class: 'pond' }, front);
    const teaPool = mk('ellipse', { cx: X, cy: y, rx: 60, ry: 18, fill: 'url(#pondTea)', opacity: 0 }, f);
    [0, 0.9, 1.8].forEach(d => mk('ellipse', { cx: X, cy: y, rx: 46, ry: 13, class: 'ripple', style: `animation-delay:${d}s` }, f));
    mk('ellipse', { cx: X + 32, cy: y + 6, rx: 11, ry: 4, class: 'lily' }, f);
    const koi = mk('g', { opacity: 0 }, f);
    const fish = mk('g', {}, koi);
    mk('path', { d: 'M -9 0 L -15 -4.5 L -13.5 0 L -15 4.5 Z', fill: '#e2531f' }, fish);
    mk('ellipse', { cx: 0, cy: 0, rx: 9, ry: 3.6, fill: '#f4f0e8' }, fish);
    mk('ellipse', { cx: 2.5, cy: -0.5, rx: 4, ry: 2.4, fill: '#e2531f' }, fish);
    mk('circle', { cx: 6.4, cy: -1, r: 0.8, fill: '#222' }, fish);
    if (reduce) fish.setAttribute('transform', `translate(${X + 8} ${y})`);
    else mk('animateMotion', { dur: '10s', repeatCount: 'indefinite', rotate: 'auto', path: `M ${X - 36} ${y} a 36 9 0 1 0 72 0 a 36 9 0 1 0 -72 0` }, fish);
    return {
      fill(t) {
        teaPool.setAttribute('opacity', t.toFixed(2));
        koi.setAttribute('opacity', clamp((t - 0.4) / 0.6).toFixed(2));
        f.classList.toggle('is-full', t > 0.5);
      },
    };
  }

  // ---------- запуск и пересчёт при изменении размеров ----------
  // Если рисунок почему-то не построился — прячем слой, но сайт продолжает работать как обычно
  function safeBuild() {
    try { build(); layer.style.display = ''; }
    catch (e) { S = null; layer.style.display = 'none'; console.warn('Струя чая отключена:', e); }
  }
  let timer, lastW = 0, lastH = 0;
  // После построения сразу рисуем первый кадр — чайник встаёт на место, не дожидаясь анимации
  const rebuild = () => { clearTimeout(timer); timer = setTimeout(() => { safeBuild(); frame(); }, 150); };
  safeBuild();
  frame();
  addEventListener('scroll', kick, { passive: true });
  // На iPhone при прокрутке прячется и снова появляется адресная строка — браузер считает это
  // изменением размера окна. Ширина и длина страницы при этом те же, перестраивать рисунок незачем
  // (иначе струя на миг пропадает и дёргается) — достаточно пересчитать кадр.
  addEventListener('resize', () => {
    const de = document.documentElement;
    if (de.clientWidth === lastW && de.scrollHeight === lastH) kick();
    else rebuild();
  });
  addEventListener('load', rebuild);
  if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(document.body); // фото догрузились, сменился язык
})();
