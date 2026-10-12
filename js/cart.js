// ===== Каталог и корзина =====
// Товары читаются из data/products.json (позже этот файл будет обновлять бот).
// Корзина хранится в браузере покупателя; на сервер ничего не отправляется —
// заказ уходит сообщением из WhatsApp самого покупателя.

const Catalog = (() => {
  let promise = null;
  return {
    load() {
      if (!promise) {
        promise = fetch('data/products.json', { cache: 'no-cache' })
          .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
      }
      return promise;
    },
  };
})();

// ---------- помощники ----------
const LOCALES = { me: 'sr-Latn-ME', en: 'en-GB', ru: 'ru-RU' };
const lang = () => (window.getLang ? window.getLang() : 'me');
const t = key => (UI_TEXT[lang()] || UI_TEXT.me)[key];
const tr = obj => (obj ? obj[lang()] || obj.me || '' : '');
const money = v => new Intl.NumberFormat(LOCALES[lang()], { style: 'currency', currency: 'EUR' }).format(v);
const gramLabel = w => w + (lang() === 'ru' ? ' г' : ' g');
// Цена позиции: для развесного чая price — за 100 г
const unitPrice = (p, w) => (p.unit === 'g' ? Math.round(p.price * w) / 100 : p.price);
const variantText = (p, w) => (p.unit === 'g' ? gramLabel(w) : '');

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text; // только текст, никогда HTML
  return e;
}
const LEAF = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c0-8 6-14 15-14 0 9-6 15-14 15M5 19l7-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
function productImage(p, cls) {
  if (p.img) {
    const img = el('img', cls); img.src = p.img; img.alt = ''; img.loading = 'lazy';
    return img;
  }
  const ph = el('div', cls + ' ph ph--' + p.cat); ph.innerHTML = LEAF;
  return ph;
}

// ---------- корзина ----------
const Cart = (() => {
  const KEY = 'teahouse-cart';
  let items = [];
  try { items = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { items = []; }
  if (!Array.isArray(items)) items = [];

  let catalog = null, products = {};
  let root, body, foot, totalEl, nameInput, noteInput, orderBtn, lastFocus;

  const keyOf = (id, w) => id + '|' + (w || '');
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} };
  const count = () => items.reduce((s, i) => s + i.qty, 0);

  function add(id, w) {
    const k = keyOf(id, w);
    const found = items.find(i => keyOf(i.id, i.w) === k);
    if (found) found.qty += 1; else items.push({ id, w: w || null, qty: 1 });
    persist(); render(); toast(t('added'));
    bump();
  }
  function setQty(k, qty) {
    const it = items.find(i => keyOf(i.id, i.w) === k);
    if (!it) return;
    it.qty = Math.max(0, Math.min(99, qty));
    if (it.qty === 0) items = items.filter(i => i !== it);
    persist(); render();
  }
  function clear() { items = []; persist(); render(); }

  // --- панель корзины (создаётся один раз) ---
  function build() {
    root = el('div', 'cart'); root.id = 'cart'; root.setAttribute('aria-hidden', 'true');
    const backdrop = el('div', 'cart__backdrop'); backdrop.addEventListener('click', close);
    const panel = el('aside', 'cart__panel');
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-labelledby', 'cartTitle');

    const head = el('header', 'cart__head');
    const title = el('h2'); title.id = 'cartTitle';
    const closeBtn = el('button', 'cart__close', '×'); closeBtn.type = 'button'; closeBtn.id = 'cartClose';
    closeBtn.addEventListener('click', close);
    head.append(title, closeBtn);

    body = el('div', 'cart__body');

    foot = el('div', 'cart__foot');
    const totalRow = el('div', 'cart__total');
    totalRow.append(el('span', 'cart__total-label'), totalEl = el('strong'));
    const nameLabel = el('label', 'field'); nameLabel.htmlFor = 'cartName';
    nameInput = el('input'); nameInput.id = 'cartName'; nameInput.type = 'text'; nameInput.maxLength = 60; nameInput.autocomplete = 'given-name';
    nameLabel.append(el('span', 'field__label'), nameInput);
    const noteLabel = el('label', 'field'); noteLabel.htmlFor = 'cartNote';
    noteInput = el('textarea'); noteInput.id = 'cartNote'; noteInput.rows = 2; noteInput.maxLength = 300;
    noteLabel.append(el('span', 'field__label'), noteInput);
    orderBtn = el('button', 'btn btn--wa'); orderBtn.type = 'button';
    orderBtn.addEventListener('click', sendOrder);
    const hint = el('p', 'cart__hint');
    const clearBtn = el('button', 'cart__clear'); clearBtn.type = 'button'; clearBtn.addEventListener('click', clear);
    foot.append(totalRow, nameLabel, noteLabel, orderBtn, hint, clearBtn);

    panel.append(head, body, foot);
    root.append(backdrop, panel);
    document.body.appendChild(root);

    const toastEl = el('div', 'toast'); toastEl.id = 'toast'; toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastEl);

    document.addEventListener('keydown', e => { if (e.key === 'Escape' && root.classList.contains('is-open')) close(); });
    document.querySelectorAll('[data-cart-open]').forEach(b => b.addEventListener('click', open));
  }

  function open() {
    lastFocus = document.activeElement;
    root.classList.add('is-open'); root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    document.getElementById('cartClose').focus();
  }
  function close() {
    root.classList.remove('is-open'); root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    if (lastFocus) lastFocus.focus();
  }

  // --- отрисовка содержимого ---
  function render() {
    // Подписи, которые зависят от языка
    root.querySelector('#cartTitle').textContent = t('cart');
    document.getElementById('cartClose').setAttribute('aria-label', t('close'));
    foot.querySelector('.cart__total-label').textContent = t('total');
    foot.querySelectorAll('.field__label')[0].textContent = t('name');
    foot.querySelectorAll('.field__label')[1].textContent = t('note');
    noteInput.placeholder = t('notePh');
    orderBtn.textContent = t('order');
    foot.querySelector('.cart__hint').textContent = t('orderHint');
    foot.querySelector('.cart__clear').textContent = t('clear');

    // Счётчик на значке корзины
    const n = count();
    document.querySelectorAll('.cart-btn__count').forEach(c => { c.textContent = n; c.hidden = n === 0; });

    if (!catalog) return; // ждём загрузки товаров

    // Убираем из корзины то, чего больше нет в ассортименте
    const before = items.length;
    items = items.filter(i => products[i.id]);
    if (items.length !== before) persist();

    body.replaceChildren();
    if (!items.length) {
      const empty = el('div', 'cart__empty');
      empty.append(el('p', 'cart__empty-title', t('empty')), el('p', null, t('emptyHint')));
      const go = el('a', 'btn btn--ghost-dark btn--small', t('toShop')); go.href = 'assortment.html';
      if (document.body.dataset.meta === 'shopmeta') go.addEventListener('click', e => { e.preventDefault(); close(); });
      empty.appendChild(go);
      body.appendChild(empty);
      foot.hidden = true;
      return;
    }
    foot.hidden = false;

    const list = el('ul', 'cart__list');
    let total = 0;
    items.forEach(it => {
      const p = products[it.id];
      const k = keyOf(it.id, it.w);
      const price = unitPrice(p, it.w);
      const line = price * it.qty;
      total += line;

      const li = el('li', 'cart-item');
      li.appendChild(productImage(p, 'cart-item__img'));
      const info = el('div', 'cart-item__info');
      info.appendChild(el('span', 'cart-item__name', tr(p.name)));
      info.appendChild(el('span', 'cart-item__meta', [variantText(p, it.w), money(price)].filter(Boolean).join(' · ')));

      const qty = el('div', 'qty');
      const minus = el('button', null, '−'); minus.type = 'button'; minus.setAttribute('aria-label', t('less'));
      const val = el('span', 'qty__val', String(it.qty));
      const plus = el('button', null, '+'); plus.type = 'button'; plus.setAttribute('aria-label', t('more'));
      minus.addEventListener('click', () => setQty(k, it.qty - 1));
      plus.addEventListener('click', () => setQty(k, it.qty + 1));
      qty.append(minus, val, plus);
      info.appendChild(qty);

      const side = el('div', 'cart-item__side');
      side.appendChild(el('strong', null, money(line)));
      const rm = el('button', 'cart-item__remove', t('remove')); rm.type = 'button';
      rm.addEventListener('click', () => setQty(k, 0));
      side.appendChild(rm);

      li.append(info, side);
      list.appendChild(li);
    });
    body.appendChild(list);
    totalEl.textContent = money(total);
  }

  // --- сообщение в WhatsApp ---
  function sendOrder() {
    if (!catalog || !items.length) return;
    const lines = [t('msgHello'), ''];
    let total = 0;
    items.forEach((it, i) => {
      const p = products[it.id];
      const price = unitPrice(p, it.w);
      total += price * it.qty;
      const variant = variantText(p, it.w);
      lines.push(`${i + 1}. ${tr(p.name)}${variant ? ', ' + variant : ''} × ${it.qty} = ${money(price * it.qty)}`);
    });
    lines.push('', `${t('msgTotal')}: ${money(total)}`);
    const name = nameInput.value.trim();
    const note = noteInput.value.trim();
    if (name) lines.push(`${t('msgName')}: ${name}`);
    if (note) lines.push(`${t('msgNote')}: ${note}`);
    lines.push('', `(${t('msgFrom')})`);

    const url = 'https://wa.me/' + catalog.whatsapp + '?text=' + encodeURIComponent(lines.join('\n'));
    const win = window.open(url, '_blank', 'noopener');
    if (!win) location.href = url;
  }

  // --- всплывающее уведомление и «подпрыгивание» значка ---
  let toastTimer;
  function toast(text) {
    const tEl = document.getElementById('toast');
    tEl.textContent = text; tEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => tEl.classList.remove('is-visible'), 1800);
  }
  function bump() {
    document.querySelectorAll('.cart-btn').forEach(b => {
      b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump');
    });
  }

  // --- запуск ---
  build();
  render();
  Catalog.load().then(data => {
    catalog = data;
    products = Object.fromEntries((data.products || []).map(p => [p.id, p]));
    render();
  }).catch(() => { /* без каталога корзина просто показывает счётчик */ });
  document.addEventListener('langchange', render);

  return { add, open };
})();
