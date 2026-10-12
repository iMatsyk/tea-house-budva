// ===== 10 росписей для ширмы (переход из отсеков в магазин, вариант 2 в js/fx.js) =====
// Золотые, медные и красные линии по чёрному лаку; одна роспись идёт через все створки.
// При каждом переходе роспись выбирается случайно; на странице ассортимента — та же самая
// (номер выводится из «зерна», которое главная передаёт вместе с переходом).
// Подключается на главной (перед js/fx.js) и в <head> страницы ассортимента (перед js/arrive.js).
const FX_ART = (() => {
  const G = '#e0b45c', C = '#c9955a', R = '#d4504a', J = '#7fae84', P = '#f2b8b0', W = '#f4efe6';
  const svg = body => `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'>${body}</svg>`;
  // линии: принимает либо готовые элементы (<path …/>), либо просто данные пути (M… C…)
  const line = (body, color = G, width = 3, op = .8) =>
    `<g fill='none' stroke='${color}' stroke-width='${width}' stroke-opacity='${op}' stroke-linecap='round' stroke-linejoin='round'>` +
    `${body.trim().startsWith('<') ? body : `<path d='${body}'/>`}</g>`;
  const moon = (x, y, r, color = G) => `<circle cx='${x}' cy='${y}' r='${r}' fill='${color}' fill-opacity='.16' stroke='${color}' stroke-opacity='.75' stroke-width='3'/>`;
  const sun = (x, y, r) => `<circle cx='${x}' cy='${y}' r='${r}' fill='${R}' fill-opacity='.45' stroke='${R}' stroke-opacity='.85' stroke-width='3'/>`;
  const cloud = (x, y, s) => `<g transform='translate(${x} ${y}) scale(${s})'>` +
    `<path d='M8 50C8 36 24 30 36 36C38 20 60 14 72 26C80 12 104 12 110 28C124 22 142 30 140 44C150 46 152 54 146 56H14C8 56 6 54 8 50Z'/>` +
    `<path d='M40 48c0-8 12-8 12 0 0 4-6 5-7 1M78 42c0-10 15-10 15 0 0 5-8 6-9 1M114 48c0-7 10-7 10 0 0 3-5 4-6 1'/></g>`;
  const leaf = (x, y, a, s, color = G, op = .55) =>
    `<path transform='translate(${x} ${y}) rotate(${a}) scale(${s})' d='M0 0Q40-14 92 0Q40 10 0 0Z' fill='${color}' fill-opacity='${op}'/>`;
  const birds = list => line(list.map(([x, y, s]) => `M${x - 16 * s} ${y - 6 * s}q${8 * s} ${6 * s} ${16 * s} ${6 * s}q${8 * s} 0 ${16 * s}-${6 * s}`).join(''), G, 3, .7);
  // волны-«чешуйки»: ряды полукругов
  const scallops = (y0, rows, r, color = G, op = .6) => {
    let d = '';
    for (let row = 0; row < rows; row++) {
      const y = y0 + row * r, off = row % 2 ? r : 0;
      for (let x = -2 * r + off; x < 1600 + 2 * r; x += 2 * r) d += `M${x} ${y}a${r} ${r} 0 0 1 ${2 * r} 0`;
    }
    return line(d, color, 3, op);
  };
  const blossom = (x, y, s = 1) => {
    let d = '';
    for (let i = 0; i < 5; i++) {
      const a = (i * 72 - 90) * Math.PI / 180;
      d += `<circle cx='${(x + Math.cos(a) * 9 * s).toFixed(1)}' cy='${(y + Math.sin(a) * 9 * s).toFixed(1)}' r='${8 * s}' fill='${P}' fill-opacity='.8'/>`;
    }
    return d + `<circle cx='${x}' cy='${y}' r='${4 * s}' fill='${G}'/>`;
  };
  const crane = (x, y, s) => `<g transform='translate(${x} ${y}) scale(${s})'>` +
    `<path d='M-60 0C-20-10 20-10 60 0C20 10-20 10-60 0Z' fill='${W}' fill-opacity='.85'/>` +
    `<path d='M-10-6C-40-80-110-110-170-100C-110-70-60-40-20-4Z' fill='${W}' fill-opacity='.7'/>` +
    `<path d='M10-6C30-90 80-130 140-140C100-90 60-50 24-4Z' fill='${W}' fill-opacity='.55'/>` +
    `<path d='M50-3C80-20 100-40 110-60M-55 2L-110 30M-50 4L-100 40' fill='none' stroke='${W}' stroke-opacity='.85' stroke-width='3' stroke-linecap='round'/>` +
    `<circle cx='112' cy='-62' r='7' fill='${R}'/></g>`;

  const ARTS = [
    // 1. Луна, горы, ветка сливы и журавли
    () => moon(1180, 300, 150) +
      line(`M0 760C180 640 300 600 420 680C520 560 640 520 760 640C860 600 960 610 1060 690C1180 600 1320 590 1600 700`, G, 3, .6) +
      line(`M0 860C220 790 380 770 560 830C760 760 980 770 1200 840C1360 800 1480 810 1600 830`, G, 3, .35) +
      line(`M60 120C260 160 420 220 560 330M300 175C330 120 380 90 440 80M420 250C470 230 520 240 560 260`, C, 7, .85) +
      blossom(440, 80) + blossom(560, 260, .9) + blossom(330, 150, .8) + blossom(520, 300) +
      birds([[990, 200, 2], [1060, 245, 1.5], [1010, 300, 1.2]]),

    // 2. Бамбуковая роща под луной
    () => {
      let b = moon(800, 250, 120);
      [[170, 12], [300, 9], [460, 11], [1150, 10], [1320, 12], [1470, 9]].forEach(([x, w], i) => {
        b += line(`M${x} 1010C${x + 12} 700 ${x - 10} 300 ${x + 6} -20`, C, w, .8);
        for (let y = 900; y > 0; y -= 120) b += line(`M${x - w - 4} ${y}h${2 * w + 8}`, G, 3, .8);
        for (let k = 0; k < 4; k++) {
          const y = 140 + k * 210 + i * 25, dir = x < 800 ? 1 : -1;
          b += leaf(x, y, dir > 0 ? -25 + k * 8 : 205 - k * 8, 1.1) + leaf(x, y + 12, dir > 0 ? 10 : 170, .9);
        }
      });
      return b;
    },

    // 3. Пагода на холме, солнце и облака
    () => {
      let b = sun(420, 260, 110) + line(`M700 1000C820 760 980 700 1100 700C1240 700 1380 780 1500 1000`, G, 3, .6);
      const cx = 1100;
      let tiers = '';
      for (let i = 0; i < 5; i++) {
        const w = 260 - i * 42, y = 700 - i * 78;
        tiers += `M${cx - w / 2 - 34} ${y}Q${cx - w / 2} ${y - 12} ${cx - w / 2 + 10} ${y - 26}H${cx + w / 2 - 10}Q${cx + w / 2} ${y - 12} ${cx + w / 2 + 34} ${y}`;
        tiers += `M${cx - w / 2 + 18} ${y - 26}V${y - 78}M${cx + w / 2 - 18} ${y - 26}V${y - 78}`;
      }
      tiers += `M${cx} 310V230M${cx - 14} 270h28M${cx - 10} 250h20`;
      b += line(tiers, G, 4, .85) + `<circle cx='${cx}' cy='224' r='8' fill='${G}'/>`;
      b += line(cloud(120, 520, 2.2) + cloud(560, 640, 1.6) + cloud(1250, 180, 1.8), G, 2.5, .6);
      return b + birds([[700, 220, 1.8], [760, 260, 1.3]]);
    },

    // 4. Два карпа кои по кругу и листья лотоса
    () => {
      let b = line(`<circle cx='800' cy='500' r='130'/><circle cx='800' cy='500' r='240'/><circle cx='800' cy='500' r='360'/>`, G, 2.5, .25);
      const koi = (x, y, a, color) => `<g transform='translate(${x} ${y}) rotate(${a})'>` +
        `<path d='M0 0C60-58 180-52 240-8L300-44L286 0L300 44L240 8C180 52 60 58 0 0Z' fill='${color}' fill-opacity='.6' stroke='${G}' stroke-width='3'/>` +
        `<path d='M110-40l30-34 20 30M110 40l30 34 20-30' fill='${color}' fill-opacity='.45' stroke='${G}' stroke-width='2'/>` +
        `<path d='M90-20q20 20 0 40M140-26q22 26 0 52M190-20q18 20 0 40' fill='none' stroke='${G}' stroke-opacity='.6' stroke-width='2'/>` +
        `<circle cx='34' cy='-10' r='6' fill='${G}'/></g>`;
      b += koi(520, 360, 25, R) + koi(1080, 640, 205, '#e8a33c');
      const pad = (x, y, r) => `<circle cx='${x}' cy='${y}' r='${r}' fill='${J}' fill-opacity='.22' stroke='${J}' stroke-opacity='.75' stroke-width='3'/>` +
        line(`M${x} ${y}L${x + r} ${y}M${x} ${y}L${x - r * .7} ${y - r * .7}M${x} ${y}L${x - r * .2} ${y + r}M${x} ${y}L${x + r * .7} ${y - r * .7}`, J, 2, .6);
      return b + pad(260, 820, 120) + pad(1380, 210, 95) + pad(1460, 860, 70);
    },

    // 5. Журавли над волнами и красное солнце
    () => sun(1150, 330, 170) + scallops(780, 5, 55) + crane(430, 330, 1.1) + crane(680, 220, .8) + crane(860, 430, .65),

    // 6. Лотосовый пруд и стрекоза
    () => {
      let b = line(`M0 720C200 700 400 740 600 720S1000 700 1200 720 1500 740 1600 720M0 820C250 800 500 840 750 820S1250 800 1600 820M0 920C300 900 600 940 900 920S1400 900 1600 920`, G, 2.5, .35);
      const lotus = (x, y, s) => `<g transform='translate(${x} ${y}) scale(${s})'>` +
        [-56, -28, 0, 28, 56].map(a => `<path transform='rotate(${a})' d='M0 0C-32-40-22-112 0-142C22-112 32-40 0 0Z' fill='${P}' fill-opacity='.55' stroke='${G}' stroke-width='3'/>`).join('') +
        `<path d='M0 0V180' stroke='${J}' stroke-width='5' stroke-opacity='.8'/></g>`;
      b += lotus(520, 640, 1) + lotus(1180, 560, .8) + lotus(860, 690, .55);
      b += `<ellipse cx='300' cy='760' rx='170' ry='48' fill='${J}' fill-opacity='.25' stroke='${J}' stroke-opacity='.7' stroke-width='3'/>` +
        `<ellipse cx='1400' cy='700' rx='150' ry='42' fill='${J}' fill-opacity='.25' stroke='${J}' stroke-opacity='.7' stroke-width='3'/>`;
      b += line(`M1500 1000C1490 800 1480 600 1500 420M1540 1000C1545 820 1560 640 1580 480M120 1000C130 820 110 660 90 520`, J, 4, .7);
      return b + line(`M880 300h120M940 300c-20-30-60-40-80-20M940 300c20-30 60-40 80-20M940 300c-20 30-60 40-80 20M940 300c20 30 60 40 80 20`, G, 3, .8);
    },

    // 7. Горы Гуйлиня, река и лодка рыбака
    () => {
      let b = moon(1350, 180, 80);
      [[60, 340, .75], [260, 220, .9], [470, 300, .7], [980, 260, .85], [1180, 180, .95], [1420, 320, .7]].forEach(([x, top, op]) => {
        b += line(`M${x - 150} 860C${x - 120} 640 ${x - 70} ${top + 40} ${x} ${top}C${x + 70} ${top + 40} ${x + 120} 640 ${x + 150} 860`, G, 3, op);
      });
      b += line(`M0 860C300 840 600 880 900 860S1400 840 1600 860M100 910C400 895 700 925 1000 910S1450 895 1600 905`, G, 2.5, .45);
      b += line(`M700 840Q800 880 900 840M800 838V800M780 800L800 775 820 800Z`, C, 4, .9);
      return b + birds([[620, 260, 1.6], [690, 300, 1.2], [560, 320, 1]]);
    },

    // 8. Чайник, пиалы и пар
    () => {
      let b = line(`M330 600C330 470 710 470 710 600C710 760 600 820 520 820C440 820 330 760 330 600Z` +
        `M710 610C780 600 820 560 860 500M330 600C270 590 250 680 330 710M450 485C450 430 590 430 590 485M520 430V405`, G, 4, .85);
      b += `<circle cx='520' cy='398' r='10' fill='${G}'/>`;
      const cup = (x, y) => line(`M${x - 90} ${y}H${x + 90}C${x + 90} ${y + 80} ${x + 50} ${y + 110} ${x} ${y + 110}C${x - 50} ${y + 110} ${x - 90} ${y + 80} ${x - 90} ${y}Z`, G, 4, .85) +
        line(`M${x - 30} ${y - 20}C${x - 60} ${y - 80} ${x} ${y - 110} ${x - 20} ${y - 170}M${x + 20} ${y - 25}C${x - 10} ${y - 90} ${x + 50} ${y - 120} ${x + 30} ${y - 190}`, W, 3, .45);
      b += cup(980, 690) + cup(1240, 720);
      b += leaf(1300, 180, 150, 1.2) + leaf(1310, 190, 200, 1.1) + leaf(1240, 240, 170, 1) + line(`M1600 120C1480 150 1380 170 1300 190`, C, 5, .8);
      return b + leaf(160, 880, -20, .7) + leaf(240, 920, 30, .6) + leaf(1480, 920, 200, .7);
    },

    // 9. «Море и скалы»: волны, скала посередине, солнце и облака
    () => {
      let b = sun(800, 210, 100);
      let stripes = '';
      for (let x = -200; x < 1800; x += 26) stripes += `M${x} 1000L${x + 90} 880`;
      b += line(stripes, G, 3, .35) + scallops(760, 3, 45, G, .65);
      b += line(`M640 760C660 640 700 520 760 470C790 440 820 450 840 480C880 540 930 650 960 760`, C, 5, .9);
      b += line(`M720 620C760 600 800 610 830 640M700 700C750 680 820 690 880 720`, C, 3, .7);
      return b + line(cloud(120, 260, 2.3) + cloud(1180, 300, 2.3), G, 2.5, .6);
    },

    // 10. Сосна на скале и луна в тумане
    () => {
      let b = moon(1250, 230, 130);
      b += line(`M0 1000V640C80 620 140 660 210 600C280 560 330 620 400 580C450 560 500 600 520 640V1000`, C, 4, .8);
      b += line(`M470 600C520 470 640 420 760 440C860 455 920 400 1000 340M640 430C660 360 720 320 800 300M820 445C880 480 960 470 1040 500`, C, 9, .85);
      const needles = (x, y) => {
        let d = '';
        for (let k = -4; k <= 4; k++) {
          const a = (k * 14 - 90) * Math.PI / 180;
          d += `M${x} ${y}l${(Math.cos(a) * 46).toFixed(1)} ${(Math.sin(a) * 46).toFixed(1)}`;
        }
        return line(d, J, 3, .75);
      };
      [[760, 440], [1000, 340], [800, 300], [1040, 500], [640, 430], [900, 420]].forEach(([x, y]) => { b += needles(x, y); });
      return b + line(`M0 760C300 740 600 770 900 750S1400 740 1600 760M300 860C600 840 900 870 1200 850S1500 840 1600 850`, G, 2.5, .3);
    },
  ];

  const urls = ARTS.map(make => `url("data:image/svg+xml,${encodeURIComponent(svg(make()))}")`);
  return {
    count: urls.length,
    // номер росписи по «зерну» перехода — одинаковый на обеих страницах
    pick: seed => Math.abs(Math.floor(Number(seed) || 0)) % urls.length,
    url: i => urls[i] || urls[0],
  };
})();
