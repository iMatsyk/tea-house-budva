// ===== Навигация: фон при прокрутке и мобильное меню =====
const nav = document.getElementById('nav');
const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');

const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

toggle.addEventListener('click', () => {
  const open = links.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', open);
});
links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  links.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', false);
}));

// ===== Языки =====
// me — черногорский (основной, тексты в index.html), en — английский, ru — русский (переводы в js/i18n.js)
const LANGS = ['me', 'en', 'ru'];
const HTML_LANG = { me: 'cnr', en: 'en', ru: 'ru' };
let currentLang = 'me';

// Запоминаем исходные черногорские тексты, чтобы возвращаться к ним
const originalText = new Map();
document.querySelectorAll('[data-i18n]').forEach(el => originalText.set(el, el.textContent));
const originalAttrs = [];
document.querySelectorAll('[data-i18n-attr]').forEach(el => {
  el.dataset.i18nAttr.split(';').forEach(pair => {
    const [attr, key] = pair.split(':');
    originalAttrs.push({ el, attr, key, value: el.getAttribute(attr) });
  });
});
const metaDesc = document.getElementById('metaDesc');
const META = document.body.dataset.meta || 'meta'; // у каждой страницы свои заголовок и описание для Google
const originalTitle = document.title;
const originalDesc = metaDesc.content;

// Неразрывный пробел после коротких слов («и», «в», «na», «u»), чтобы они не висели в конце строки
const typo = (text, lang) => lang === 'en'
  ? text
  : text.replace(/(^|\s)([A-Za-zČčĆćŠšŽžĐđА-Яа-яЁё]{1,2}) /g, '$1$2 ');

function setLang(lang, remember) {
  if (!LANGS.includes(lang)) lang = 'me';
  currentLang = lang;
  const dict = lang === 'me' ? {} : (I18N[lang] || {});
  const pick = (key, fallback) => dict[key] !== undefined ? dict[key] : fallback;

  originalText.forEach((orig, el) => { el.textContent = typo(pick(el.dataset.i18n, orig), lang); });
  originalAttrs.forEach(({ el, attr, key, value }) => el.setAttribute(attr, pick(key, value)));
  document.title = pick(META + '.title', originalTitle);
  metaDesc.content = pick(META + '.desc', originalDesc);
  document.documentElement.lang = HTML_LANG[lang];

  document.querySelectorAll('.lang button').forEach(b =>
    b.setAttribute('aria-pressed', b.dataset.lang === lang));
  updateStatus();
  // Сообщаем остальным скриптам (корзина, каталог), что язык сменился
  document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));

  if (remember) {
    try { localStorage.setItem('lang', lang); } catch (e) {}
    // Язык в адресе: ссылкой с ?lang=en можно поделиться сразу на нужном языке
    const url = new URL(location.href);
    if (lang === 'me') url.searchParams.delete('lang'); else url.searchParams.set('lang', lang);
    history.replaceState(null, '', url);
  }
}

document.querySelectorAll('.lang button').forEach(b =>
  b.addEventListener('click', () => setLang(b.dataset.lang, true)));
window.getLang = () => currentLang;

// ===== Открыто / закрыто (время Черногории) =====
const OPEN_HOUR = 10;
const CLOSE_HOUR = 20;

function updateStatus() {
  const el = document.getElementById('status');
  const text = document.getElementById('statusText');
  if (!el) return; // на странице магазина статуса нет
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Podgorica', hour: 'numeric', minute: 'numeric', hour12: false
  }).formatToParts(new Date());
  const h = +parts.find(p => p.type === 'hour').value;
  const m = +parts.find(p => p.type === 'minute').value;
  const now = h + m / 60;
  const open = now >= OPEN_HOUR && now < CLOSE_HOUR;
  const t = STATUS_TEXT[currentLang] || STATUS_TEXT.me;

  el.classList.toggle('is-open', open);
  el.classList.toggle('is-closed', !open);
  text.textContent = open ? t.open(CLOSE_HOUR) : t.closed(OPEN_HOUR);
}
setInterval(updateStatus, 60 * 1000);

// Стартовый язык: из адреса (?lang=en), затем из прошлого выбора посетителя, иначе черногорский
let startLang = new URLSearchParams(location.search).get('lang');
if (!LANGS.includes(startLang)) {
  try { startLang = localStorage.getItem('lang'); } catch (e) { startLang = null; }
}
setLang(LANGS.includes(startLang) ? startLang : 'me', false);

// ===== Плавное появление блоков =====
const revealItems = document.querySelectorAll('.about__media, .about__text, .section__head, .moongate, .gallery img, .visit__info, .visit__map');
revealItems.forEach(el => el.classList.add('reveal'));
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.12 });
revealItems.forEach(el => io.observe(el));

// ===== Галерея: просмотр фото =====
const lb = document.getElementById('lightbox');
if (lb) { // галерея есть только на главной
  const photos = [...document.querySelectorAll('#galleryGrid img')];
  const lbImg = document.getElementById('lbImg');
  let current = 0;

  const show = i => {
    current = (i + photos.length) % photos.length;
    lbImg.src = photos[current].src;
    lbImg.alt = photos[current].alt;
  };
  photos.forEach((img, i) => img.addEventListener('click', () => { show(i); lb.showModal(); }));
  document.getElementById('lbClose').addEventListener('click', () => lb.close());
  document.getElementById('lbPrev').addEventListener('click', () => show(current - 1));
  document.getElementById('lbNext').addEventListener('click', () => show(current + 1));
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });
  document.addEventListener('keydown', e => {
    if (!lb.open) return;
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
}

document.getElementById('year').textContent = new Date().getFullYear();
