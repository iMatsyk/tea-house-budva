// ===== Страница ассортимента: категории, подкатегории и карточки товаров =====
// Категории верхнего уровня (Всё / Чай / Травы / Кофе / Посуда) и их подкатегории описаны
// в data/products.json, раздел "groups". У товара в поле "cat" указана подкатегория.
// VARIANT — как выглядит выбор категорий (1–5). Для сравнения можно открыть
// assortment.html?cats=N (см. .claude/catalog.html).
//   1 — вкладки и «таблетки»;  2 — тёмный переключатель-капсула и ссылки;
//   3 — плитки с фото;         4 — боковое меню-дерево;
//   5 — липкая тёмная панель и товары с заголовками разделов.
(() => {
  const VARIANT = 2; // ← выбранное оформление: капсула

  const grid = document.getElementById('grid');
  const filters = document.getElementById('filters');
  const demoNote = document.getElementById('demoNote');
  if (!grid) return;

  const params = new URLSearchParams(location.search);
  const asked = +params.get('cats');
  const startCat = params.get('cat'); // категория из ссылки, например с «лунных ворот» на главной: ?cat=tea
  const V = asked >= 1 && asked <= 5 ? asked : VARIANT;
  const shop = grid.closest('.shop');
  shop.classList.add('cv' + V);

  // Пришли с главной с анимацией перехода (js/arrive.js): экран закрыт, пока каталог не встанет на место
  const root = document.documentElement;
  const moonIn = root.classList.contains('moon-in') || root.classList.contains('fx-in');
  const moonReady = () => { if (moonIn) requestAnimationFrame(() => root.classList.add('is-ready')); };

  let data = null;
  let group = 'all', sub = null; // выбранная категория и подкатегория (null — все)
  const chosenWeight = {}; // выбранная фасовка для каждого товара

  // Значки категорий (свои, без внешних картинок)
  const svg = d => '<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + d + '</g></svg>';
  const ICONS = {
    all: svg('<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>'),
    tea: svg('<path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15M5 19l7-7"/>'),
    herbs: svg('<path d="M12 21V9"/><path d="M12 14c-3.5 0-6-2.2-6-5.5 3.5 0 6 2.2 6 5.5Z"/><path d="M12 11c3.5 0 6-2.2 6-5.5-3.5 0-6 2.2-6 5.5Z"/><path d="M12 18c2.6 0 4.5-1.6 4.5-4-2.6 0-4.5 1.6-4.5 4Z"/>'),
    coffee: svg('<ellipse cx="12" cy="12" rx="5.5" ry="8.5" transform="rotate(40 12 12)"/><path d="M7.4 16.6c3-1.4 2.4-4.4 4.6-4.6s1.6-3.2 4.6-4.6"/>'),
    teaware: svg('<path d="M5.5 10h12v3.5a5.5 5.5 0 0 1-5.5 5.5h-1a5.5 5.5 0 0 1-5.5-5.5V10Z"/><path d="M17.5 11.5h1.2a2.3 2.3 0 0 1 0 4.6h-1.9"/><path d="M5.5 11.5 2.8 8.8"/><path d="M9.5 10V8h4v2M11.5 8V6.5"/>'),
  };
  const ALL_IMG = 'img/g-shelf.jpg';

  // ---------- выборка ----------
  const groupKeys = () => Object.keys(data.groups);
  const groupOf = cat => groupKeys().find(g => data.groups[g].subs.includes(cat));
  const fits = (p, g, s) => (s ? p.cat === s : g === 'all' || groupOf(p.cat) === g);
  const count = (g, s) => data.products.filter(p => fits(p, g, s)).length;
  const subsOf = g => data.groups[g].subs.filter(s => data.categories[s] && count(g, s) > 0);
  const groupName = g => (g === 'all' ? t('all') : tr(data.groups[g]));
  const subAllName = g => tr(data.groups[g].all) || t('all');

  function select(g, s) {
    group = g; sub = s;
    render();
    // запоминаем категорию в адресе: после «Назад» или обновления страницы она останется выбранной
    const q = new URLSearchParams(location.search);
    if (g === 'all') q.delete('cat'); else q.set('cat', g);
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
    // если покупатель уже пролистал каталог вниз — вернуть его к началу списка
    const top = shop.getBoundingClientRect().top + scrollY - 40;
    if (scrollY > top + 8) scrollTo({ top, behavior: 'smooth' });
  }

  // Кнопка фильтра: подпись, необязательные значок и количество товаров
  function btn(cls, text, pressed, onClick, opts = {}) {
    const b = el('button', cls); b.type = 'button';
    b.setAttribute('aria-pressed', pressed);
    if (opts.icon) b.insertAdjacentHTML('beforeend', ICONS[opts.icon]); // значки — наши константы, не данные
    b.appendChild(el('span', 'c-label', text));
    if (opts.count != null) b.appendChild(el('span', 'c-count', String(opts.count)));
    b.addEventListener('click', onClick);
    return b;
  }

  // ---------- 5 вариантов оформления ----------
  // 1. Вкладки с красной чертой и «таблетки» подкатегорий
  function tabsAndChips() {
    const box = el('div', 'cnav-tabs');
    const tabs = el('div', 'ctabs');
    ['all', ...groupKeys()].forEach(g =>
      tabs.appendChild(btn('ctab', groupName(g), group === g, () => select(g, null), { count: count(g) })));
    box.appendChild(tabs);
    if (group !== 'all') {
      const chips = el('div', 'chips csubs');
      chips.appendChild(btn('chip', subAllName(group), !sub, () => select(group, null)));
      subsOf(group).forEach(s => chips.appendChild(btn('chip', tr(data.categories[s]), sub === s, () => select(group, s))));
      box.appendChild(chips);
    }
    return [box];
  }

  // 2. Тёмная капсула со значками и подкатегории-ссылки с числом товаров
  function segmented() {
    const seg = el('div', 'cseg');
    ['all', ...groupKeys()].forEach(g =>
      seg.appendChild(btn('cseg__b', groupName(g), group === g, () => select(g, null), { icon: g })));
    const out = [seg];
    if (group !== 'all') {
      const links = el('div', 'clinks');
      links.appendChild(btn('clink', subAllName(group), !sub, () => select(group, null), { count: count(group) }));
      subsOf(group).forEach(s => links.appendChild(btn('clink', tr(data.categories[s]), sub === s, () => select(group, s), { count: count(group, s) })));
      out.push(links);
    }
    return out;
  }

  // 3. Большие плитки с фотографиями
  function tiles() {
    const box = el('div', 'ctiles');
    ['all', ...groupKeys()].forEach(g => {
      const b = el('button', 'ctile'); b.type = 'button';
      b.setAttribute('aria-pressed', group === g);
      const img = el('img'); img.src = g === 'all' ? ALL_IMG : data.groups[g].img || ALL_IMG; img.alt = ''; img.loading = 'lazy';
      const txt = el('span', 'ctile__txt');
      txt.append(el('span', 'ctile__name', groupName(g)), el('span', 'ctile__count', String(count(g))));
      b.append(img, txt);
      b.addEventListener('click', () => select(g, null));
      box.appendChild(b);
    });
    const out = [box];
    if (group !== 'all') {
      const chips = el('div', 'chips csubs');
      chips.appendChild(btn('chip', subAllName(group), !sub, () => select(group, null), { count: count(group) }));
      subsOf(group).forEach(s => chips.appendChild(btn('chip', tr(data.categories[s]), sub === s, () => select(group, s), { count: count(group, s) })));
      out.push(chips);
    }
    return out;
  }

  // 4. Боковое меню-дерево (на телефоне вместо него вкладки из варианта 1)
  function tree() {
    const box = el('nav', 'ctree');
    box.setAttribute('aria-label', t('cats'));
    box.appendChild(el('p', 'ctree__title', t('cats')));
    const ul = el('ul');
    ['all', ...groupKeys()].forEach(g => {
      const li = el('li', group === g && g !== 'all' ? 'is-open' : null);
      li.appendChild(btn('ctree__g', groupName(g), group === g && !sub, () => select(g, null), { icon: g, count: count(g) }));
      if (g !== 'all' && group === g) {
        const subs = el('ul', 'ctree__subs');
        subsOf(g).forEach(s => {
          const sli = el('li');
          sli.appendChild(btn('ctree__s', tr(data.categories[s]), sub === s, () => select(g, s), { count: count(g, s) }));
          subs.appendChild(sli);
        });
        li.appendChild(subs);
      }
      ul.appendChild(li);
    });
    box.appendChild(ul);
    const mobile = el('div', 'cv4-mobile');
    mobile.append(...tabsAndChips());
    return [box, mobile];
  }

  // 5. Липкая тёмная панель: категории со значками, под ними — прокручиваемая строка подкатегорий
  function stickyBar() {
    const bar = el('div', 'cbar');
    const gs = el('div', 'cbar__groups');
    ['all', ...groupKeys()].forEach(g =>
      gs.appendChild(btn('cbar__g', groupName(g), group === g, () => select(g, null), { icon: g })));
    bar.appendChild(gs);
    if (group !== 'all') {
      const subs = el('div', 'cbar__subs');
      subs.appendChild(btn('cbar__s', subAllName(group), !sub, () => select(group, null)));
      subsOf(group).forEach(s => subs.appendChild(btn('cbar__s', tr(data.categories[s]), sub === s, () => select(group, s))));
      bar.appendChild(subs);
    }
    return [bar];
  }

  const NAVS = { 1: tabsAndChips, 2: segmented, 3: tiles, 4: tree, 5: stickyBar };

  // ---------- отрисовка ----------
  function render() {
    if (!data) return;
    demoNote.hidden = !data.demo;
    demoNote.textContent = t('demo');

    filters.replaceChildren(...NAVS[V]());

    grid.replaceChildren();
    const items = data.products.filter(p => fits(p, group, sub));
    if (!items.length) { grid.appendChild(el('p', 'shop-error', t('nothing'))); return; }

    if (V !== 5) { items.forEach(p => grid.appendChild(card(p))); return; }

    // Вариант 5: товары разложены по разделам с заголовками
    const shownGroups = group === 'all' ? groupKeys() : [group];
    shownGroups.forEach(g => {
      const inGroup = items.filter(p => groupOf(p.cat) === g);
      if (!inGroup.length) return;
      if (group === 'all') grid.appendChild(sectionTitle('csec csec--group', groupName(g), inGroup.length));
      data.groups[g].subs.forEach(s => {
        const inSub = inGroup.filter(p => p.cat === s);
        if (!inSub.length) return;
        grid.appendChild(sectionTitle('csec csec--sub', tr(data.categories[s]), inSub.length));
        inSub.forEach(p => grid.appendChild(card(p)));
      });
    });
  }

  function sectionTitle(cls, text, n) {
    const h = el(cls.includes('group') ? 'h2' : 'h3', cls);
    h.append(el('span', null, text), el('span', 'c-count', String(n)));
    return h;
  }

  function card(p) {
    const art = el('article', 'product');
    const media = el('div', 'product__media');
    media.appendChild(productImage(p, 'product__img'));
    art.appendChild(media);

    const bodyEl = el('div', 'product__body');
    bodyEl.appendChild(el('span', 'product__cat', tr(data.categories[p.cat])));
    bodyEl.appendChild(el('h3', 'product__name', tr(p.name)));
    bodyEl.appendChild(el('p', 'product__desc', tr(p.desc)));

    const priceEl = el('strong', 'price');
    let w = null;
    if (p.unit === 'g' && Array.isArray(p.weights) && p.weights.length) {
      w = chosenWeight[p.id] || (p.weights.includes(100) ? 100 : p.weights[0]);
      const ws = el('div', 'weights');
      ws.setAttribute('role', 'group');
      ws.setAttribute('aria-label', t('weight'));
      p.weights.forEach(g => {
        const b = el('button', null, gramLabel(g)); b.type = 'button';
        b.setAttribute('aria-pressed', g === w);
        b.addEventListener('click', () => {
          chosenWeight[p.id] = g; w = g;
          ws.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', x === b));
          priceEl.textContent = money(unitPrice(p, g));
        });
        ws.appendChild(b);
      });
      bodyEl.appendChild(ws);
    }
    priceEl.textContent = money(unitPrice(p, w));

    const footEl = el('div', 'product__foot');
    const priceBox = el('div', 'product__price');
    priceBox.appendChild(priceEl);
    priceBox.appendChild(el('span', 'price__unit', p.unit === 'g' ? money(p.price) + ' ' + t('per100') : t('pcs')));
    const addBtn = el('button', 'btn btn--red btn--small', t('add')); addBtn.type = 'button';
    addBtn.addEventListener('click', () => Cart.add(p.id, w));
    footEl.append(priceBox, addBtn);
    bodyEl.appendChild(footEl);

    art.appendChild(bodyEl);
    return art;
  }

  Catalog.load()
    .then(d => {
      data = d;
      if (startCat && Object.prototype.hasOwnProperty.call(data.groups, startCat)) group = startCat;
      render();
      // Пришли по ссылке …#catalog: пока товары грузились, страница была короткой и браузер
      // не смог до него прокрутить — докручиваем сами, когда товары уже на месте.
      // Если пришли с анимацией перехода, прокручиваем мгновенно: экран пока закрыт.
      if (location.hash === '#catalog') shop.scrollIntoView({ block: 'start', behavior: moonIn ? 'instant' : 'auto' });
      moonReady();
    })
    .catch(() => { grid.replaceChildren(el('p', 'shop-error', t('loadError'))); moonReady(); });
  document.addEventListener('langchange', () => {
    if (data) render();
    else if (grid.querySelector('.shop-error')) grid.querySelector('.shop-error').textContent = t('loadError');
  });
})();
