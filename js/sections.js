// ===== Светлые и тёмные разделы главной страницы =====
// THEME — какое оформление показывать:
//   'current' — как сейчас: Ассортимент тёмный, «О нас» и «Загляните внутрь» светлые, Контакты тёмные;
//   'dark'    — все разделы тёмные;
//   'alt'     — чередование: тёмный первый экран, светлый, тёмный, светлый, тёмный.
// Для сравнения можно открыть сайт с ?theme=current | dark | alt (см. .claude/lanterns.html).
(() => {
  const THEME = 'dark'; // ← выбранное оформление

  const THEMES = {
    current: { assortment: 'dark', about: 'paper', gallery: 'paper', visit: 'dark' },
    dark:    { assortment: 'dark', about: 'dark',  gallery: 'dark',  visit: 'dark' },
    alt:     { assortment: 'paper', about: 'dark', gallery: 'paper', visit: 'dark' },
  };
  const asked = new URLSearchParams(location.search).get('theme');
  const theme = THEMES[asked] ? asked : THEME;
  const map = THEMES[theme];

  Object.entries(map).forEach(([id, tone]) => {
    const s = document.getElementById(id);
    if (!s) return;
    s.classList.toggle('section--dark', tone === 'dark');
    s.classList.toggle('section--paper', tone === 'paper');
  });
  // «Загляните внутрь» приклеен к «О нас» без отступа сверху, только если у них один фон
  const gallery = document.getElementById('gallery');
  if (gallery) gallery.classList.toggle('section--joined', map.gallery === map.about);
  document.body.dataset.theme = theme;
})();
