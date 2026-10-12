// ===== Бумажные фонарики на первом экране =====
// Пять вариантов. Какой показывать — задаёт VARIANT ниже.
// Для сравнения можно открыть сайт с ?lanterns=1 … ?lanterns=5 (см. .claude/lanterns.html).
(() => {
  const VARIANT = 4; // ← выбранный вариант

  const box = document.querySelector('.hero .lanterns');
  if (!box) return;
  const asked = +new URLSearchParams(location.search).get('lanterns');
  const variant = [1, 2, 3, 4, 5].includes(asked) ? asked : VARIANT;

  // ---------- общие цвета (градиенты) ----------
  const DEFS = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <radialGradient id="lt-red" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#ffe08a"/><stop offset=".25" stop-color="#ff8a3a"/><stop offset=".58" stop-color="#e8281a"/><stop offset="1" stop-color="#7a0707"/></radialGradient>
    <radialGradient id="lt-orange" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#fff0b0"/><stop offset=".3" stop-color="#ffb04a"/><stop offset=".65" stop-color="#ef741c"/><stop offset="1" stop-color="#8a3a06"/></radialGradient>
    <radialGradient id="lt-goldr" cx=".5" cy=".45" r=".6"><stop offset="0" stop-color="#fff7cf"/><stop offset=".3" stop-color="#ffd86a"/><stop offset=".65" stop-color="#d9a020"/><stop offset="1" stop-color="#7a5006"/></radialGradient>
    <linearGradient id="lt-redcyl" x1="0" x2="1"><stop offset="0" stop-color="#6e0606"/><stop offset=".22" stop-color="#c0170d"/><stop offset=".5" stop-color="#ff6a3a"/><stop offset=".78" stop-color="#c0170d"/><stop offset="1" stop-color="#6e0606"/></linearGradient>
    <linearGradient id="lt-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7d77f"/><stop offset="1" stop-color="#b3812a"/></linearGradient>
    <radialGradient id="lt-glow"><stop offset="0" stop-color="#ff5a2a" stop-opacity=".5"/><stop offset="1" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient>
    <radialGradient id="lt-glow-warm"><stop offset="0" stop-color="#ffc56a" stop-opacity=".55"/><stop offset="1" stop-color="#ffc56a" stop-opacity="0"/></radialGradient>
    <radialGradient id="lt-sky" cx=".5" cy=".78" r=".85"><stop offset="0" stop-color="#fff4c8"/><stop offset=".35" stop-color="#ffc060"/><stop offset=".8" stop-color="#f07a2a"/><stop offset="1" stop-color="#bf4418"/></radialGradient>
    <linearGradient id="lt-silk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f0402a"/><stop offset=".5" stop-color="#d31e12"/><stop offset="1" stop-color="#8e0c08"/></linearGradient>
    <linearGradient id="lt-silk-side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8140c"/><stop offset="1" stop-color="#5a0705"/></linearGradient>
  </defs></svg>`;

  // ---------- рисунки фонарей ----------
  // Круглый фонарь (100×150). fill — id градиента бумаги; char — иероглиф на боку (необязательно)
  const round = (fill = 'lt-red', char = '') => `
  <svg viewBox="0 0 100 150" aria-hidden="true">
    <circle class="lt-flicker" cx="50" cy="62" r="70" fill="url(#lt-glow)"/>
    <rect x="36" y="16" width="28" height="9" rx="2" fill="url(#lt-gold)"/>
    <ellipse cx="50" cy="62" rx="44" ry="37" fill="url(#${fill})"/>
    <g fill="none" stroke="rgba(90,0,0,.33)" stroke-width="1.3">
      <ellipse cx="50" cy="62" rx="31" ry="37"/><ellipse cx="50" cy="62" rx="15" ry="37"/><line x1="50" y1="25" x2="50" y2="99"/>
    </g>
    <path d="M14 42 Q50 31 86 42 M14 82 Q50 93 86 82" fill="none" stroke="url(#lt-gold)" stroke-width="1.5"/>
    ${char ? `<text x="50" y="74" text-anchor="middle" font-size="34" class="lt-char" fill="#ffd774">${char}</text>` : ''}
    <ellipse cx="36" cy="50" rx="9" ry="16" fill="#fff" opacity=".18" transform="rotate(-20 36 50)"/>
    <rect x="36" y="97" width="28" height="9" rx="2" fill="url(#lt-gold)"/>
    <circle cx="50" cy="110" r="3.2" fill="url(#lt-gold)"/>
    <g class="lt-tassel"><path d="M50 112 V146 M47 113 L44.5 145 M53 113 L55.5 145 M48.5 113 L47 146 M51.5 113 L53 146" stroke="#c4140c" stroke-width="1.6" stroke-linecap="round"/></g>
  </svg>`;

  // Цилиндрический фонарь с иероглифом (80×178)
  const cylinder = char => {
    let ribs = '';
    for (let y = 34; y <= 134; y += 8) ribs += `<line x1="10" y1="${y}" x2="70" y2="${y}"/>`;
    return `
  <svg viewBox="0 0 80 178" aria-hidden="true">
    <circle class="lt-flicker" cx="40" cy="84" r="74" fill="url(#lt-glow)"/>
    <rect x="18" y="8" width="44" height="6" rx="2" fill="url(#lt-gold)"/>
    <rect x="13" y="13" width="54" height="13" rx="3" fill="#1d1310"/>
    <rect x="8" y="24" width="64" height="118" rx="22" fill="url(#lt-redcyl)"/>
    <g stroke="rgba(60,0,0,.28)" stroke-width="1">${ribs}</g>
    <text x="40" y="99" text-anchor="middle" font-size="42" class="lt-char" fill="#1b0905">${char}</text>
    <rect x="13" y="140" width="54" height="13" rx="3" fill="#1d1310"/>
    <rect x="18" y="152" width="44" height="5" rx="2" fill="url(#lt-gold)"/>
    <circle cx="40" cy="161" r="3" fill="url(#lt-gold)"/>
    <g class="lt-tassel"><path d="M40 163 V178 M38 163 L36.5 177 M42 163 L43.5 177" stroke="#1d1310" stroke-width="1.6" stroke-linecap="round"/></g>
  </svg>`;
  };

  // Небесный фонарик (60×90) с огоньком внутри
  const sky = () => `
  <svg viewBox="0 0 60 90" aria-hidden="true">
    <circle class="lt-flicker" cx="30" cy="42" r="44" fill="url(#lt-glow-warm)"/>
    <path d="M8 10 Q30 2 52 10 L45 66 Q30 72 15 66 Z" fill="url(#lt-sky)"/>
    <path d="M22 7 L20 69 M38 7 L40 69" stroke="rgba(150,60,10,.25)" stroke-width="1"/>
    <path d="M15 66 Q30 72 45 66" stroke="#7a3410" stroke-width="1.6" fill="none"/>
    <ellipse class="lt-flame" cx="30" cy="69" rx="3.6" ry="4.8" fill="#fff6c8"/>
  </svg>`;

  // Дворцовый шестигранный фонарь (120×215): золотая рама, шёлк, ветка сливы, кисти
  const palace = () => {
    const tassel = (x, len) => `
      <g class="lt-tassel" style="animation-delay:${(x % 7) * -0.4}s">
        <circle cx="${x}" cy="156" r="3.2" fill="url(#lt-gold)"/>
        <path d="M${x} 159 V${159 + len} M${x - 2.5} 160 L${x - 3.5} ${157 + len} M${x + 2.5} 160 L${x + 3.5} ${157 + len}" stroke="#d0180e" stroke-width="1.7" stroke-linecap="round"/>
      </g>`;
    return `
  <svg viewBox="0 0 120 215" aria-hidden="true">
    <circle class="lt-flicker" cx="60" cy="82" r="84" fill="url(#lt-glow)"/>
    <circle cx="60" cy="6" r="4" fill="url(#lt-gold)"/>
    <path d="M38 14 L82 14 L92 30 L28 30 Z" fill="url(#lt-gold)"/>
    <path d="M24 35 c -9 -1 -12 -10 -5 -13 M96 35 c 9 -1 12 -10 5 -13" stroke="url(#lt-gold)" stroke-width="2" fill="none" stroke-linecap="round"/>
    <rect x="22" y="30" width="76" height="6" fill="#8a5a1a"/>
    <path d="M24 36 H40 V128 H24 Z" fill="url(#lt-silk-side)"/>
    <path d="M80 36 H96 V128 H80 Z" fill="url(#lt-silk-side)"/>
    <rect x="40" y="36" width="40" height="92" fill="url(#lt-silk)"/>
    <path d="M24 36 V128 M40 36 V128 M80 36 V128 M96 36 V128" stroke="url(#lt-gold)" stroke-width="2.4"/>
    <path d="M46 116 C52 100 50 84 60 72 C66 64 70 56 75 46" stroke="#3d1408" stroke-width="2" fill="none" stroke-linecap="round"/>
    ${[[60, 72], [70, 55], [52, 94], [66, 63], [49, 106]].map(([x, y]) =>
      `<g fill="#ffe6d6">${[0, 72, 144, 216, 288].map(a => `<circle cx="${(x + 2.6 * Math.cos(a * Math.PI / 180)).toFixed(1)}" cy="${(y + 2.6 * Math.sin(a * Math.PI / 180)).toFixed(1)}" r="1.9"/>`).join('')}<circle cx="${x}" cy="${y}" r="1.1" fill="#f3c24a"/></g>`).join('')}
    <rect x="22" y="128" width="76" height="6" fill="#8a5a1a"/>
    <path d="M28 134 L92 134 L82 149 L38 149 Z" fill="url(#lt-gold)"/>
    ${tassel(24, 52)}${tassel(60, 58)}${tassel(96, 52)}${tassel(42, 40)}${tassel(78, 40)}
  </svg>`;
  };

  // ---------- размещение ----------
  // left — от левого края первого экрана; cord — длина шнура (px); w — ширина фонаря (px);
  // dur/delay — скорость и сдвиг покачивания; m — на телефоне: false = скрыть
  function hang(svg, o) {
    const el = document.createElement('div');
    el.className = 'lt' + (o.cls ? ' ' + o.cls : '');
    el.style.cssText = `left:${o.left};--cord:${o.cord}px;--w:${o.w}px;--dur:${o.dur || 6}s;--delay:${o.delay || 0}s;--amp:${o.amp || 2.5}deg`;
    if (o.m === false) el.dataset.hideM = '';
    el.innerHTML = svg;
    box.appendChild(el);
  }

  const variants = {
    // 1. Классика с огоньком
    1() {
      hang(round('lt-red', '福'), { left: '4%', cord: 120, w: 130, dur: 6.5 });
      hang(round('lt-red'), { left: '15%', cord: 100, w: 80, dur: 5.2, delay: -1.3 });
      hang(round('lt-red'), { left: '23%', cord: 95, w: 85, dur: 7.1, delay: -2.6, m: false });
    },
    // 2. Гирлянда через весь верх
    2() {
      const draw = () => {
        box.querySelectorAll('.lt, .lt-string').forEach(e => e.remove());
        const W = box.clientWidth, mobile = matchMedia('(max-width: 760px)').matches;
        const y0 = mobile ? 86 : 96, sag = mobile ? 34 : 54;
        const swags = mobile ? 1 : 2, perSwag = mobile ? 6 : 7;
        const string = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        string.setAttribute('class', 'lt-string');
        string.setAttribute('viewBox', `0 0 ${W} ${y0 + sag + 10}`);
        let d = '';
        const fills = ['lt-red', 'lt-orange', 'lt-goldr'];
        let n = 0;
        for (let s = 0; s < swags; s++) {
          const x1 = (W / swags) * s, x2 = (W / swags) * (s + 1);
          d += `M ${x1} ${y0} Q ${(x1 + x2) / 2} ${y0 + sag * 2} ${x2} ${y0} `;
          for (let i = 1; i <= perSwag; i++) {
            const t = i / (perSwag + 1);
            const x = x1 + (x2 - x1) * t;
            const y = y0 + sag * 2 * 2 * t * (1 - t) * 0.5 * 2; // точка на дуге
            const size = mobile ? 30 : 38 + (i % 2) * 6;
            const cord = 12 + (i % 3) * 7;
            const el = document.createElement('div');
            el.className = 'lt lt--small';
            el.style.cssText = `left:${x - size / 2}px;top:${y + cord}px;--cord:${cord}px;--w:${size}px;--dur:3.4s;--delay:${-n * 0.35}s;--amp:5deg`;
            el.innerHTML = round(fills[n % 3]);
            box.appendChild(el);
            n++;
          }
        }
        string.innerHTML = `<path d="${d}" fill="none" stroke="#2a1a12" stroke-width="2"/>`;
        box.prepend(string);
      };
      draw();
      let t; addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 150); });
    },
    // 3. Свитки-цилиндры с иероглифами
    3() {
      loadCalligraphy('茶福和');
      hang(cylinder('茶'), { left: '5%', cord: 130, w: 74, dur: 7 });
      hang(cylinder('福'), { left: '14%', cord: 95, w: 58, dur: 6, delay: -2 });
      hang(cylinder('和'), { left: '23%', cord: 85, w: 64, dur: 8, delay: -4, m: false });
    },
    // 4. Небесные фонарики поднимаются вверх
    4() {
      const items = [
        [6, 46, 26, -4], [14, 30, 34, -15], [22, 38, 22, -9], [31, 26, 38, -27], [40, 34, 30, -2],
        [60, 28, 36, -20], [69, 42, 24, -12], [79, 30, 32, -6], [90, 36, 28, -22],
      ];
      items.forEach(([x, w, dur, delay], i) => {
        const el = document.createElement('div');
        el.className = 'lt-sky';
        el.style.cssText = `left:${x}%;--w:${w}px;--dur:${dur}s;--delay:${delay}s;--drift:${i % 2 ? 36 : -30}px;--o:${(0.45 + w / 90).toFixed(2)}`;
        if (i % 2) el.dataset.hideM = '';
        el.innerHTML = sky();
        box.appendChild(el);
      });
      skyPage();
    },
    // 5. Дворцовые шестигранные с кистями
    5() {
      hang(palace(), { left: '4%', cord: 105, w: 140, dur: 8.5, amp: 1.8 });
      hang(palace(), { left: '19%', cord: 85, w: 80, dur: 7.4, delay: -3, amp: 1.8, m: false });
    },
  };

  // Небесные фонарики по всей странице: взлетают из-под подвала и без остановки поднимаются
  // до самого верха, через первый экран (слой начинается от верха первого экрана, а не от его низа —
  // иначе на стыке фонарик обрезался и пропадал). Количество зависит от длины страницы;
  // скорость у каждого своя (55–100 px/с).
  function skyPage() {
    const layer = document.createElement('div');
    layer.id = 'skyLayer';
    layer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(layer);
    document.body.classList.add('has-sky');
    const build = () => {
      const hero = document.querySelector('.hero');
      const top = hero.offsetTop;
      layer.style.height = '0px';
      const h = Math.max(0, document.documentElement.scrollHeight - top);
      layer.style.top = top + 'px';
      layer.style.height = h + 'px';
      layer.replaceChildren();
      const mobile = matchMedia('(max-width: 760px)').matches;
      const n = Math.round(h / (mobile ? 480 : 320));
      let seed = 7; // одинаковая «случайная» расстановка при каждой загрузке
      const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
      for (let i = 0; i < n; i++) {
        const w = Math.round((mobile ? 20 : 24) + rnd() * (mobile ? 18 : 26));
        const dur = (h + 240) / (55 + rnd() * 45);
        const el = document.createElement('div');
        el.className = 'lt-sky';
        el.style.cssText = `left:${(3 + rnd() * 92).toFixed(1)}%;--w:${w}px;--dur:${dur.toFixed(1)}s;` +
          `--delay:${(-rnd() * dur).toFixed(1)}s;--drift:${Math.round((rnd() - 0.5) * 80)}px;` +
          `--rise:${-(h + 240)}px;--o:${(0.4 + w / 100).toFixed(2)}`;
        el.innerHTML = sky();
        layer.appendChild(el);
      }
    };
    build();
    let t;
    const rebuild = () => { clearTimeout(t); t = setTimeout(build, 200); };
    addEventListener('resize', rebuild);
    addEventListener('load', rebuild);
    if ('ResizeObserver' in window) new ResizeObserver(rebuild).observe(document.body);
  }

  // Каллиграфический шрифт — грузим только нужные иероглифы (несколько килобайт)
  function loadCalligraphy(chars) {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap&text=' + encodeURIComponent(chars);
    document.head.appendChild(l);
  }

  box.dataset.variant = variant;
  box.innerHTML = DEFS;
  variants[variant]();
})();
