// ===== «Лунные ворота» в разделе «Ассортимент»: варианты оформления =====
// GATE — какой вариант показывать (1–5). Для сравнения можно открыть index.html?gate=N
// (см. .claude/gate.html). Основа окна — в index.html, здесь только классы оформления
// и дополнительные картинки, которые нужны отдельным вариантам.
//   1 — традиционный Китай: красный лак и золото, крыша-пагода, золотая луна в облаках;
//   2 — бамбук и неон: тёмная бамбуковая рама, неоновая трубка вокруг фото, неоновая луна;
//   3 — лак и неон: красный лак, золотые линии рамы и табличек светятся неоном;
//   4 — пагода в неоне: чёрный лак, неоновые контуры окна и крыши, неоновые фонарики и облака;
//   5 — каллиграфия в неоне: тёмное дерево с золотой резьбой, неоновые иероглифы на табличках.
// Во всех вариантах фото в отсеках не затемняются, а названия стоят на табличках.
(() => {
  const GATE = 2; // ← выбранный вариант: бамбук и неон

  // Из каких «деталей» собран каждый вариант (оформление деталей — в css/style.css)
  const LOOKS = {
    1: ['trad', 'lacquer', 'roofed', 'clouds'],
    2: ['bneon', 'bamboo', 'neontext', 'neonmoon'],
    3: ['lneon', 'lacquer', 'clouds'],
    4: ['pneon', 'roofed', 'neontext', 'neonmoon', 'clouds'],
    5: ['cneon', 'glyphs'],
  };

  const gate = document.querySelector('.moongate');
  if (!gate) return;
  const asked = +new URLSearchParams(location.search).get('gate');
  const v = LOOKS[asked] ? asked : GATE;
  const has = part => LOOKS[v].includes(part);
  gate.classList.add('mg--clean', ...LOOKS[v].map(p => 'mg--' + p));

  // Как выглядят надписи-таблички на отсеках (для сравнения: index.html?label=N, см. .claude/labels.html):
  //   1 — дымчатое стекло;  2 — только неон;  3 — полоса у края;  4 — печать;
  //   5 — золотые уголки;   6 — бумажная лента.
  const LABEL = 2; // ← выбранный вид: только неон
  const askedLabel = +new URLSearchParams(location.search).get('label');
  gate.classList.add('mg--lbl-' + (askedLabel >= 1 && askedLabel <= 6 ? askedLabel : LABEL));

  // Все картинки ниже — наши постоянные строки, а не данные извне
  const svg = (cls, view, body, extra = '') =>
    `<svg class="${cls}" viewBox="${view}" aria-hidden="true" ${extra}>${body}</svg>`;

  const moon = gate.querySelector('.mg__moon');
  const order = moon.querySelector('.mg__order');
  const addToMoon = html => order.insertAdjacentHTML('beforebegin', html);

  // Бамбуковая рама: 4 жерди по краям, 2 перекладины крестом и 8 верёвочных обвязок на стыках,
  // а в круге — стебли и листья бамбука на фоне луны
  if (has('bamboo')) {
    const e = 'calc(var(--bar) * .7)', f = 'calc(100% - var(--bar) * .7)';
    let html = ['top', 'bottom', 'midh'].map(p => `<span class="mg__pole mg__pole--h mg__pole--${p}"></span>`).join('') +
               ['left', 'right', 'midv'].map(p => `<span class="mg__pole mg__pole--v mg__pole--${p}"></span>`).join('');
    [[e, e], [f, e], [e, f], [f, f], ['50%', e], ['50%', f], [e, '50%'], [f, '50%']].forEach(([x, y]) => {
      html += `<span class="mg__tie" style="left:${x};top:${y}"></span>`;
    });
    gate.insertAdjacentHTML('beforeend', html);

    // Роща из двух половин (по три стебля слева и справа), листья тянутся к луне.
    // Половины — отдельные группы: при нажатии «Заказать» они расходятся в стороны.
    const leaf = (x, y, a, s = 1) => `<path transform="translate(${x} ${y}) rotate(${a}) scale(${s})" d="M0 0Q20-7 46 0Q20 5 0 0Z"/>`;
    const stalk = (x, w, top, lean) => {
      const mid = (205 + top) / 2;
      let d = `<path d="M${x - w / 2} 205Q${x + lean / 2 - w / 2} ${mid} ${x + lean - w / 2} ${top}H${x + lean + w / 2}Q${x + lean / 2 + w / 2} ${mid} ${x + w / 2} 205Z"/>`;
      for (let y = 180; y > top + 12; y -= 38) { // узлы стебля
        const nx = x + lean * (205 - y) / (205 - top);
        d += `<rect x="${(nx - w / 2 - 1.2).toFixed(1)}" y="${y}" width="${w + 2.4}" height="3" rx="1.2"/>`;
      }
      return d;
    };
    const STALKS = [[12, 10, -6, 6], [34, 7, 18, 4], [55, 5, 58, 3]];                 // x, толщина, верх, наклон
    const LEAVES = [[18, 30, -38, .85], [17, 36, 12, .9], [37, 76, -18, 1], [37, 80, 24, .85],
                    [57, 108, -22, .8], [57, 112, 18, .75], [15, 128, -8, .9], [36, 150, 16, .8],
                    [56, 164, -6, .7], [14, 186, 20, .7]];                             // x, y, угол, размер
    const half = (side, mirror) => `<g class="bb bb--${side}">` +
      STALKS.map(([x, w, t, l]) => stalk(mirror ? 200 - x : x, w, t, mirror ? -l : l)).join('') +
      LEAVES.map(([x, y, a, s]) => leaf(mirror ? 200 - x : x, y, mirror ? 180 - a : a, s)).join('') + '</g>';
    addToMoon(svg('mg__bamboo', '0 0 200 200',
      `<g fill="currentColor">${half('l', false)}${half('r', true)}</g>`, 'preserveAspectRatio="xMidYMid slice"'));
  }

  // Крыша-пагода над окном. Фонарики на её углах видны только в неоновом варианте (4).
  if (has('roofed')) {
    const lamp = x => `<g class="r-lamp"><path d="M${x} 44V52" stroke="#ffd27a" stroke-width="1.4"/>` +
      `<rect x="${x - 5}" y="51" width="10" height="3" rx="1" fill="none" stroke="#ffd27a" stroke-width="1.3"/>` +
      `<ellipse cx="${x}" cy="62" rx="9" ry="8.5" fill="rgba(40,8,6,.7)" stroke="#ff8a3d" stroke-width="1.8"/>` +
      `<path d="M${x} 54V70M${x - 5} 55.5Q${x - 8} 62 ${x - 5} 68.5M${x + 5} 55.5Q${x + 8} 62 ${x + 5} 68.5" fill="none" stroke="#ff8a3d" stroke-width="1"/>` +
      `<rect x="${x - 5}" y="70" width="10" height="3" rx="1" fill="none" stroke="#ffd27a" stroke-width="1.3"/>` +
      `<path d="M${x} 73V80" stroke="#ff5a4c" stroke-width="1.4"/></g>`;
    gate.insertAdjacentHTML('afterbegin', svg('mg__roof', '0 0 440 46',
      '<defs><pattern id="mgTiles" width="9" height="10" patternUnits="userSpaceOnUse">' +
      '<rect width="9" height="10" fill="#3a120c"/><path d="M4.5 0V10" stroke="#5e2216" stroke-width="3.4"/></pattern></defs>' +
      '<path class="r-body" d="M4 42Q30 40 54 29L150 9H290L386 29Q410 40 436 42L432 46Q404 45 378 36L290 17H150L62 36Q36 45 8 46Z" fill="url(#mgTiles)" stroke="#e0b45c" stroke-width="1.6"/>' +
      '<path class="r-eave" d="M8 46Q36 45 62 36L150 17H290L378 36Q404 45 432 46" fill="none" stroke="#e0b45c" stroke-width="2.4"/>' +
      '<rect class="r-ridge" x="140" y="2" width="160" height="8" rx="3" fill="#2a0c08" stroke="#e0b45c" stroke-width="1.4"/>' +
      '<path class="r-curl" d="M140 6Q130 5 126 -2M300 6Q310 5 314 -2" fill="none" stroke="#e0b45c" stroke-width="2.2" stroke-linecap="round"/>' +
      '<circle class="r-knob" cx="220" cy="6" r="4" fill="#e0b45c"/>' +
      `<g class="r-lant">${lamp(14)}${lamp(426)}</g>`));
  }

  // Благоприятные облака сянъюнь в круге: красные с золотым контуром и завитками
  if (has('clouds')) {
    const cloud = cls => svg('mg__xy ' + cls, '0 0 160 60',
      '<path d="M8 50C8 36 24 30 36 36C38 20 60 14 72 26C80 12 104 12 110 28C124 22 142 30 140 44C150 46 152 54 146 56H14C8 56 6 54 8 50Z" fill="#b81d14" stroke="#e0b45c" stroke-width="2.5"/>' +
      '<g fill="none" stroke="#e0b45c" stroke-width="2.2" stroke-linecap="round">' +
      '<path d="M40 48c0-8 12-8 12 0 0 4-6 5-7 1"/><path d="M78 42c0-10 15-10 15 0 0 5-8 6-9 1"/><path d="M114 48c0-7 10-7 10 0 0 3-5 4-6 1"/></g>');
    addToMoon(cloud('mg__xy--a') + cloud('mg__xy--b'));
  }

  // Переход по «Заказать»: бамбук расходится в стороны, луна плавно раскрывается из центра
  // на весь экран, затем открывается ассортимент. Там этот «лунный свет» мягко гаснет
  // (метка в sessionStorage, см. начало assortment.html и html.moon-in в css/style.css).
  order.addEventListener('click', e => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // открыть в новой вкладке — как обычно
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;              // без анимаций — просто переход
    e.preventDefault();
    if (gate.classList.contains('is-opening')) return;
    const href = order.href;
    // Бамбук уже разошёлся от наведения мыши? Тогда луна начинает расти почти сразу;
    // иначе (касание на телефоне) — когда он заметно раздвинется
    // На телефонах и планшетах бамбук не расходится вовсе (см. css) — ждать нечего
    const parted = order.matches(':hover') || order.matches(':focus-visible') ||
      matchMedia('(max-width: 1099px), (hover: none)').matches;
    gate.classList.add('is-opening');

    const r = moon.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const far = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
    const box = d => ({ left: cx - d / 2 + 'px', top: cy - d / 2 + 'px', width: d + 'px', height: d + 'px' });
    const veil = document.createElement('div');
    veil.className = 'moon-zoom';
    veil.setAttribute('aria-hidden', 'true');
    Object.assign(veil.style, box(r.width), { opacity: 0 });
    document.body.appendChild(veil);

    const go = () => {
      try { sessionStorage.setItem('th-moon', '1'); } catch (_) { /* без метки страница просто откроется без затухания */ }
      location.href = href;
    };
    setTimeout(() => {
      const grow = veil.animate(
        [{ ...box(r.width), opacity: 0 }, { offset: .18, opacity: 1 }, { ...box(far * 2 + 40), opacity: 1 }],
        { duration: 1100, easing: 'cubic-bezier(.6, 0, .2, 1)', fill: 'forwards' });
      grow.onfinish = go;
    }, has('bamboo') && !parted ? 750 : 150);
  });

  // ----- Переходы из отсеков (Чай, Травы, Кофе, Посуда) на страницу ассортимента -----
  // Сами анимации — в js/fx.js. CARD_FX — какой из 5 вариантов показывать
  // (для сравнения: index.html?fx=N, см. .claude/fx.html):
  //   1 — веер;  2 — ширма;  3 — пар;  4 — зонт;  5 — облака.
  // На странице ассортимента анимация продолжается в обратную сторону (js/arrive.js + js/fx.js).
  const CARD_FX = 2; // ← выбранный вариант: ширма
  const askedFx = +new URLSearchParams(location.search).get('fx');
  const fx = askedFx >= 1 && askedFx <= 5 ? askedFx : CARD_FX;

  gate.querySelectorAll('.mg__q').forEach(q => q.addEventListener('click', e => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // новая вкладка — как обычно
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof TeaFX === 'undefined') return;                                        // нет анимаций — обычный переход
    e.preventDefault();
    if (document.querySelector('.fx-overlay')) return;

    const r = q.getBoundingClientRect();
    // место нажатия; если отсек выбран с клавиатуры — его середина
    const x = e.clientX || r.left + r.width / 2, y = e.clientY || r.top + r.height / 2;
    const cat = new URL(q.href, location.href).searchParams.get('cat');
    const img = q.querySelector('img').getAttribute('src');
    const seed = Math.floor(Math.random() * 1e9);
    TeaFX.cover(fx, { cat, img, seed, rect: r, x, y }).then(() => {
      try {
        sessionStorage.setItem('th-fx', JSON.stringify({ v: fx, cat, img, seed, x: x / innerWidth * 100, y: y / innerHeight * 100 }));
      } catch (_) { /* без метки страница просто откроется без продолжения анимации */ }
      location.href = q.href;
    });
  }));

  // Кнопка «Назад» из ассортимента: браузер может показать страницу такой, какой её оставили, —
  // убираем раскрытую луну и закрытие экрана, возвращаем бамбук на место
  addEventListener('pageshow', e => {
    if (!e.persisted) return;
    gate.classList.remove('is-opening');
    document.querySelectorAll('.moon-zoom, .fx-overlay').forEach(v => v.remove());
  });

  // Неоновые иероглифы на табличках: 茶 — чай, 草 — травы, 咖啡 — кофе, 器 — посуда.
  // Каллиграфический шрифт грузим только для этих знаков (несколько килобайт).
  if (has('glyphs')) {
    const GLYPHS = ['茶', '草', '咖啡', '器'];
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap&text=' + encodeURIComponent(GLYPHS.join(''));
    document.head.appendChild(l);
    gate.querySelectorAll('.mg__q .mg__txt').forEach((t, i) => {
      const g = document.createElement('span');
      g.className = 'mg__glyph';
      g.setAttribute('aria-hidden', 'true');
      g.textContent = GLYPHS[i];
      t.prepend(g);
    });
  }
})();
