// ===== Плавное появление страницы ассортимента после перехода с главной =====
// Подключается в <head> assortment.html и выполняется ещё до отрисовки страницы.
// Главная (js/moongate.js) перед переходом оставляет в sessionStorage метку:
//   th-moon — нажали «Заказать»: луна раскрылась на весь экран;
//   th-fx   — нажали отсек Чай / Травы / Кофе / Посуда: { v: вариант 1–5, cat, img, seed, x, y }.
// По метке ставим классы на <html>: экран сразу закрыт заливкой (css: html.moon-in, html.fx-in),
// а для отсеков js/fx.js затем строит то же «полотно», что было на главной (данные — window.__teaFx).
// Когда каталог готов, js/shop.js добавляет класс is-ready — и закрытие плавно уходит.
(() => {
  const root = document.documentElement;
  let came = false;
  try {
    const s = sessionStorage;
    if (s.getItem('th-moon')) {
      s.removeItem('th-moon');
      root.classList.add('moon-in');
      came = true;
    }
    const raw = s.getItem('th-fx');
    if (raw) {
      s.removeItem('th-fx');
      const fx = JSON.parse(raw);
      const v = Math.round(Number(fx.v));
      if (!came && v >= 1 && v <= 5) {
        root.classList.add('fx-in', 'fx-' + v);
        came = true;
        // всё, что пришло из sessionStorage, проверяем: числа — числа, категория и фото — только наши
        const pct = n => (Number.isFinite(Number(n)) ? Math.max(0, Math.min(100, Number(n))) : 50);
        window.__teaFx = {
          v,
          cat: ['tea', 'herbs', 'coffee', 'teaware'].includes(fx.cat) ? fx.cat : 'tea',
          img: /^img\/[\w-]+\.(jpe?g|png|webp)$/.test(fx.img || '') ? fx.img : 'img/tea-loose.jpg',
          seed: Number.isFinite(Number(fx.seed)) ? Math.abs(Math.floor(Number(fx.seed))) % 1e9 : 1,
          x: pct(fx.x), // место нажатия, % ширины экрана
          y: pct(fx.y), // … и % высоты
        };
        // Ширма: пока js/fx.js не построил створки, заливка уже выглядит как закрытая ширма —
        // та же роспись (js/fx-art.js) и те же золотые рамки, поэтому подмена не видна
        if (v === 2 && typeof FX_ART !== 'undefined') {
          root.style.setProperty('--fx-art', FX_ART.url(FX_ART.pick(window.__teaFx.seed)));
          root.style.setProperty('--fx-n', innerWidth < 700 ? 4 : 6);
        }
      }
    }
  } catch (e) { /* без sessionStorage страница просто откроется как обычно */ }
  // на всякий случай: даже если каталог не загрузится, закрытие уйдёт не позже чем через 3 секунды
  if (came) setTimeout(() => root.classList.add('is-ready'), 3000);
})();
