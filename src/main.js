import './style.css';
import { translate, languageDirection, localizeNumber, normalizeDigits, ayahCount } from './i18n.js';
import dataUrl from '../quran-qalun-rasm_uthmani.json?url';
import { makeSurahs, makePages, pageAyahs, displayText, normalizeSearch, parseReference, parsePageReference } from './data.js';

const paths = {
  book: '<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z"/><path d="M12 5v15"/>',
  search: '<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 4.5 4.5"/>',
  bookmark: '<path d="M6 4h12v17l-6-4-6 4Z"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  moon: '<path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  list: '<path d="M9 6h12M9 12h12M9 18h12M3 6h.01M3 12h.01M3 18h.01"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  link: '<path d="m10 13 4-4m-6 6-2 2a4 4 0 0 0 6 6l3-3a4 4 0 0 0 0-6M9 9l3-3a4 4 0 0 1 6 6l-2 2" transform="translate(0 -3)"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${['arrow', 'chevron'].includes(name) ? 'directional' : ''} ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`;
const ornament = (cls = '') => `<svg class="ornament ${cls}" viewBox="0 0 200 200" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width=".65"><path d="M100 8 127 34 165 35 166 73 192 100 166 127 165 165 127 166 100 192 73 166 35 165 34 127 8 100 34 73 35 35 73 34Z"/><path d="M100 23 122 47 155 45 153 78 177 100 153 122 155 155 122 153 100 177 78 153 45 155 47 122 23 100 47 78 45 45 78 47Z"/><rect x="48" y="48" width="104" height="104"/><rect x="48" y="48" width="104" height="104" transform="rotate(45 100 100)"/><circle cx="100" cy="100" r="40"/><circle cx="100" cy="100" r="34"/><path d="m100 48 15 37 37 15-37 15-15 37-15-37-37-15 37-15Z"/><path d="M100 8v40m0 104v40M8 100h40m104 0h40M35 35l37 37m56 56 37 37M35 165l37-37m56-56 37-37"/></g><circle cx="100" cy="100" r="4" fill="currentColor"/></svg>`;
const escape = str => String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arabicNumber = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
function ayahMarkup(ayah, end = true) {
  if (!end) return escape(displayText(ayah.text));
  const words = displayText(ayah.text).split(' ');
  const lastWord = words.pop();
  return `${escape(words.join(' '))}${words.length ? ' ' : ''}<span class="ayah-ending">${escape(lastWord)} <span class="ayah-marker" aria-hidden="true">${arabicNumber(ayah.ayah)}</span></span>`;
}
const storageKey = 'qaloon-reader-v1';
let stored = {};
try { stored = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { /* A fresh session is always available. */ }
const state = {
  surah: 1, ayah: 1, view: stored.view === 'verses' ? 'verses' : 'reading',
  mode: stored.mode === 'page' ? 'page' : 'surah', page: 1,
  fontSize: [28, 32, 36, 40, 44, 48, 52].includes(stored.fontSize) ? stored.fontSize : 36,
  language: stored.language === 'ar' ? 'ar' : 'en',
  theme: stored.theme === 'dark' ? 'dark' : 'light',
  bookmarks: Array.isArray(stored.bookmarks) ? stored.bookmarks.filter(b => b && Number.isInteger(b.surah) && Number.isInteger(b.ayah)) : [],
  lastRead: stored.lastRead || { surah: 1, ayah: 1 },
  tab: 'surahs', query: '', selected: null,
};
const t = (message, values) => translate(state.language, message, values);
const n = value => localizeNumber(state.language, value);
const surahName = surah => state.language === 'ar' ? surah.arabic : surah.name;
const countAyahs = count => ayahCount(state.language, count);
const themeLabel = () => t(state.theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
function applyLanguage() {
  document.documentElement.lang = state.language;
  document.documentElement.dir = languageDirection(state.language);
  document.querySelector('meta[name="description"]').content = state.language === 'ar'
    ? 'رحاب هادئة لقراءة القرآن الكريم برواية قالون. تصفّح السور والصفحات وابحث في الآيات واحفظ موضع قراءتك.'
    : 'A quiet space to read the Holy Quran in the Qālūn narration. Explore all 114 surahs, search ayahs, and save your place.';
}
applyLanguage();
if (document.querySelector('.initial-loading')) document.querySelector('.initial-loading').textContent = t("Opening your Quran…");
document.documentElement.dataset.theme = state.theme;
document.documentElement.style.setProperty('--quran-size', `${state.fontSize}px`);
let surahs = [], pages = [], data, searchIndex = [], observer, toastTimeout, eventController;
let trackingReading = false;
const $ = selector => document.querySelector(selector);
const persist = () => {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ language: state.language, mode: state.mode, view: state.view, fontSize: state.fontSize, theme: state.theme, bookmarks: state.bookmarks, lastRead: state.lastRead }));
  } catch { /* Reading still works if browser storage is unavailable. */ }
};
const isBookmarked = (surah, ayah) => state.bookmarks.some(b => b.surah === surah && b.ayah === ayah);

function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('#toast').classList.remove('visible'), 2800);
}

async function init() {
  try {
    const response = await fetch(dataUrl);
    if (!response.ok) throw new Error('The Quran file could not be loaded.');
    data = await response.json();
    surahs = makeSurahs(data.ayahs);
    pages = makePages(data.ayahs);
    state.bookmarks = state.bookmarks.filter(b => surahs[b.surah - 1]?.ayahs.some(a => a.ayah === b.ayah));
    if (!surahs[state.lastRead.surah - 1]?.ayahs.some(a => a.ayah === state.lastRead.ayah)) state.lastRead = { surah: 1, ayah: 1 };
    const pageReference = parsePageReference(location.hash, pages);
    const surahReference = parseReference(location.hash, surahs);
    if (pageReference) state.mode = 'page';
    else if (surahReference) state.mode = 'surah';
    const reference = pageReference || surahReference || state.lastRead;
    state.surah = reference.surah;
    state.ayah = reference.ayah;
    state.page = surahs[state.surah - 1].ayahs.find(a => a.ayah === state.ayah).page;
    if (pages[reference.page - 1] && pageAyahs(pages[reference.page - 1]).some(a => a.surah === state.surah && a.ayah === state.ayah)) state.page = reference.page;
    searchIndex = data.ayahs.filter(a => a.ayah > 0).map(a => ({ ...a, normalized: normalizeSearch(displayText(a.text)) }));
    renderApp();
    renderSidebar();
    renderReader();
    bindEvents();
    const firstOnPage = pageAyahs(pages[state.page - 1])[0];
    if ((state.mode === 'surah' && reference.ayah > 1) || (state.mode === 'page' && (reference.surah !== firstOnPage.surah || reference.ayah !== firstOnPage.ayah))) requestAnimationFrame(() => jumpToAyah(reference.ayah, false, reference.surah));
  } catch (error) {
    $('#app').innerHTML = `<main class="error-state">${icon('book')}<h1>${t("A moment, please.")}</h1><p>${t("We couldn’t open the Quran data. Please try again.")}</p><button class="primary-button" id="retry">${t("Try again")} ${icon('arrow')}</button></main>`;
    $('#retry').addEventListener('click', init);
    console.error(error);
  }
}

function renderApp() {
  $('#app').innerHTML = `
    <a class="skip-link" href="#reader">${t("Skip to Quran")}</a>
    <header class="site-header">
      <a class="brand" href="#1:1" aria-label="${t("Qaloon home")}"><span class="brand-symbol">${ornament()}${icon('book')}</span><span class="brand-name">${t("qaloon")}<span>${t("A SPACE FOR THE QURAN")}</span></span></a>
      <nav class="main-nav" aria-label="${t("Main navigation")}"><button class="nav-link active" data-action="read">${icon('book')}<span>${t("Read Quran")}</span></button><button class="nav-link" data-action="bookmarks">${icon('bookmark')}<span>${t("Bookmarks")}</span><span id="bookmark-count" class="nav-count" ${state.bookmarks.length ? '' : 'hidden'}>${n(state.bookmarks.length)}</span></button><button class="nav-link" data-action="about">${t("About")}</button></nav>
      <div class="header-tools"><button class="language-toggle" data-action="language" lang="${state.language === 'ar' ? 'en' : 'ar'}" dir="${state.language === 'ar' ? 'ltr' : 'rtl'}" aria-label="${state.language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}">${state.language === 'ar' ? 'English' : 'العربية'}</button><button class="icon-button global-search" data-action="search" aria-label="${t("Search the Quran")}">${icon('search')}</button><span class="header-divider"></span><button class="icon-button" id="theme-toggle" data-action="theme" aria-label="${themeLabel()}">${icon(state.theme === 'light' ? 'moon' : 'sun')}</button><button class="icon-button mobile-menu" data-action="menu" aria-label="${t("Open surah navigation")}" aria-expanded="false" aria-controls="sidebar">${icon('menu')}</button></div>
    </header>
    <div class="workspace">
      <button class="sidebar-overlay" data-action="close-menu" aria-label="${t("Close surah navigation")}" hidden></button>
      <aside class="sidebar" id="sidebar" aria-label="${t("Surah navigation")}">
        <div class="sidebar-top"><div class="sidebar-heading"><h2>${t("Your Quran")}</h2><span>${t("114 SURAHS")}</span><button class="icon-button mobile-menu" data-action="close-menu" aria-label="${t("Close surah navigation")}">${icon('close')}</button></div>
          <label class="surah-search">${icon('search')}<input id="surah-search" type="search" dir="auto" placeholder="${t("Find a surah…")}" aria-label="${t("Find a surah")}" autocomplete="off"/><kbd>/</kbd></label>
          <div class="sidebar-tabs" role="group" aria-label="${t("Navigation filter")}"><button data-tab="surahs" class="active" aria-pressed="true">${t("All surahs")}</button><button data-tab="saved" aria-pressed="false">${icon('bookmark')} ${t("Saved")}</button></div>
        </div>
        <div class="surah-list" id="surah-list"></div>
        <div class="sidebar-bottom"><span class="small-rosette">✧</span><div>${t("One ayah at a time.")}<span>${t("Let your heart find its way.")}</span></div></div>
      </aside>
      <main class="main-content" id="main-content">
        <section class="welcome" aria-labelledby="welcome-title"><div class="welcome-copy"><div class="eyebrow"><span class="tiny-star">✦</span> ${t("IN THE NAME OF ALLAH, THE MOST MERCIFUL")}</div><h1 id="welcome-title">${t("Read. Reflect.")} <em>${t("Return.")}</em></h1><p>${t("A little stillness. A deeper connection.")}</p><span class="edition-label"><span></span> ${t("Qālūn ʿan Nāfiʿ")} <i>·</i> ${t("Uthmani script")}</span></div><div class="welcome-art">${ornament()}<span lang="ar" dir="rtl">القرآن الكريم</span></div></section>
        <div class="reading-context"><div class="context-label">${icon('book')}<span>${t("THE HOLY QURAN")}</span><span class="context-line"></span><span id="chapter-context"></span></div><button class="resume-button" data-action="resume">${icon('bookmark')}<span id="resume-label"></span>${icon('arrow')}</button></div>
        <section class="reader" id="reader" aria-label="${t("Quran reader")}" tabindex="-1">
          <div class="reader-navigation"><div class="display-mode-switch" role="group" aria-label="${t("Display Quran by")}"><button data-mode="surah">${icon('book')} ${t("By surah")}</button><button data-mode="page">${icon('list')} ${t("By page")}</button></div><div class="page-navigation" id="page-navigation" hidden><button class="icon-button page-back" data-action="previous-page" aria-label="${t("Previous page")}">${icon('chevron')}</button><form id="page-form" novalidate><label for="page-number">${t("Page")}</label><input id="page-number" type="text" inputmode="numeric" autocomplete="off" dir="ltr" required aria-label="${t("Page number")}"/><span>${t("of {count}", { count: n(pages.length) })}</span><button type="submit" class="page-go">${t("Go")} ${icon('arrow')}</button></form><button class="icon-button" data-action="next-page" aria-label="${t("Next page")}">${icon('chevron')}</button></div><span class="surah-mode-caption" id="surah-mode-caption">${t("114 surahs. One place to return.")}</span></div>
          <div class="reader-toolbar"><div class="view-switch" id="surah-layout" role="group" aria-label="${t("Reading layout")}"><button data-view="reading" aria-label="${t("Continuous reading")}" title="${t("Continuous reading")}">${icon('book')}<span>${t("Reading")}</span></button><button data-view="verses" aria-label="${t("Ayah by ayah")}" title="${t("Ayah by ayah")}">${icon('list')}<span>${t("Ayah by ayah")}</span></button></div><span id="page-layout-label" class="page-layout-label" hidden></span><div class="reader-controls"><label class="jump-label" id="ayah-jump" for="ayah-select">${t("Go to ayah")} <select id="ayah-select" aria-label="${t("Go to ayah")}"></select>${icon('down')}</label><span class="toolbar-divider" id="ayah-jump-divider"></span><div class="font-controls"><button class="icon-button" data-action="smaller" aria-label="${t("Decrease Arabic text size")}">${state.language === 'ar' ? 'ع' : 'A'}<span>−</span></button><span class="font-size" id="font-size"></span><button class="icon-button" data-action="larger" aria-label="${t("Increase Arabic text size")}">${state.language === 'ar' ? 'ع' : 'A'}<span>+</span></button></div></div></div>
          <div id="surah-header" class="surah-header"></div>
          <div id="quran-content" class="quran-content" lang="ar" dir="rtl"></div>
          <div class="reader-colophon"><span></span>${ornament()}<span></span></div>
          <div class="reader-bottom"><span>${icon('info')} ${t("Select an ayah to bookmark or copy")}</span><span id="page-context"></span></div>
        </section>
        <nav class="chapter-pagination" id="chapter-pagination" aria-label="${t("Chapter navigation")}"></nav>
        <footer class="main-footer"><span>${t("Made for a more mindful reading.")}</span><button data-action="about">${t("Qālūn narration")} <span>·</span> ${t("About this text")} ${icon('arrow')}</button></footer>
      </main>
    </div>
    <dialog id="search-dialog" class="search-dialog" aria-labelledby="search-title"><div class="dialog-header"><div><span class="eyebrow">${t("EXPLORE THE QURAN")}</span><h2 id="search-title">${t("Seek, and find.")}</h2></div><button class="icon-button" data-close="search-dialog" aria-label="${t("Close search")}">${icon('close')}</button></div><label class="dialog-search">${icon('search')}<input id="quran-search" type="search" dir="auto" placeholder="${t("Search a surah, Arabic text, or 2:255")}" aria-label="${t("Search Quran")}" autocomplete="off"/></label><div id="search-results" class="search-results"></div></dialog>
    <dialog id="bookmarks-dialog" aria-labelledby="bookmarks-title"><div class="dialog-header"><div><span class="eyebrow">${t("KEEP WHAT MOVES YOU")}</span><h2 id="bookmarks-title">${t("Your bookmarks")}</h2></div><button class="icon-button" data-close="bookmarks-dialog" aria-label="${t("Close bookmarks")}">${icon('close')}</button></div><div id="bookmarks-content"></div></dialog>
    <dialog id="about-dialog" class="about-dialog" aria-labelledby="about-title"><div class="dialog-header"><div><span class="eyebrow">${t("A SPACE FOR THE QURAN")}</span><h2 id="about-title">${t("Welcome to Qaloon.")}</h2></div><button class="icon-button" data-close="about-dialog" aria-label="${t("Close about")}">${icon('close')}</button></div><p>${t("A quiet companion for reading, reflecting, and returning to the Holy Quran.")}</p><div class="about-stats"><div><strong>${n(114)}</strong><span>${t("Surahs")}</span></div><div><strong>${data.meta.edition.ayah_count.toLocaleString(state.language === 'ar' ? 'ar-TN-u-nu-arab' : 'en')}</strong><span>${t("Numbered ayahs")}</span></div><div><strong>${n(604)}</strong><span>${t("Source pages")}</span></div></div><h3>${t("The text you’re reading")}</h3><p>${t("Qālūn ʿan Nāfiʿ al-Madanī, in Uthmani script, with the Last Madani ayah numbering. Ayah references in this app belong to this narration and numbering system.")}</p><p>${t("The Quran text is loaded from the supplied")} <code dir="ltr" lang="en">quran-qalun-rasm_uthmani.json</code>${t(", sourced from")} <a href="https://text.quran.ws/" target="_blank" rel="noreferrer">Quran.ws</a> ${t("and the King Fahd Glorious Quran Printing Complex’s Uthmanic Qaloun v3.0 release. It uses the matching Qālūn font.")}</p><h3>${t("Make yourself at home")}</h3><p>${t("Read by surah or by page. In page view, follow the original lines and use the arrows or enter a page number to turn pages. Surah headers appear at each chapter opening. In surah view, choose continuous reading or individual ayahs. Select any ayah to save it, copy it, or share a link. Your place, bookmarks, language, text size, and theme are saved in this browser.")}</p><p class="license-note">${escape(t(data.meta.license))} ${t("Font and text rights remain with their respective owners.")} <a href="https://fonts.qurancomplex.gov.sa/qaloun-reading/" target="_blank" rel="noreferrer">${t("Original publisher")} ${icon('arrow')}</a></p></dialog>
    <div class="ayah-actions" id="ayah-actions" role="region" aria-label="${t("Selected ayah actions")}" hidden><span id="selected-reference"></span><button data-action="save-ayah" id="save-ayah"></button><button data-action="copy-ayah">${icon('copy')}<span>${t("Copy")}</span></button><button data-action="share-ayah">${icon('link')}<span>${t("Link")}</span></button><button class="icon-button" data-action="deselect" aria-label="${t("Close ayah actions")}">${icon('close')}</button></div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
  updateResumeLabel();
}

function renderSidebar() {
  const query = normalizeSearch(state.query);
  const filtered = surahs.filter(s => (!query || normalizeSearch(`${s.id} ${s.name} ${s.arabic} ${s.meaning}`).includes(query)) && (state.tab !== 'saved' || state.bookmarks.some(b => b.surah === s.id)));
  $('#surah-list').innerHTML = filtered.length ? filtered.map(s => `<button class="surah-item ${s.id === state.surah ? 'active' : ''}" data-surah="${s.id}" ${s.id === state.surah ? 'aria-current="true"' : ''}><span class="surah-number">${n(String(s.id).padStart(2, '0'))}</span><span class="surah-details"><strong>${escape(surahName(s))}</strong><small>${countAyahs(s.count)}${state.language === 'en' ? ` <span>·</span> ${escape(s.meaning)}` : ''}</small></span><span class="surah-arabic secondary-name" lang="${state.language === 'ar' ? 'en' : 'ar'}" dir="${state.language === 'ar' ? 'ltr' : 'rtl'}">${escape(state.language === 'ar' ? s.name : s.arabic)}</span></button>`).join('') : `<div class="sidebar-empty">${icon(state.tab === 'saved' ? 'bookmark' : 'search')}<p>${state.tab === 'saved' && !query ? t("Your saved surahs will appear here.") : t("No surahs found.")}</p><span>${state.tab === 'saved' && !query ? t("Select an ayah to add a bookmark.") : t("Try a name or surah number.")}</span></div>`;
}

function renderReader() {
  observer?.disconnect();
  trackingReading = false;
  const s = surahs[state.surah - 1];
  const byPage = state.mode === 'page';
  $('#reader').dataset.mode = state.mode;
  document.querySelectorAll('button[data-mode]').forEach(button => {
    button.classList.toggle('active', button.dataset.mode === state.mode);
    button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
  });
  $('#page-navigation').hidden = !byPage;
  $('#surah-mode-caption').hidden = byPage;
  $('#surah-layout').hidden = byPage;
  $('#page-layout-label').hidden = !byPage;
  $('#ayah-jump').hidden = byPage;
  $('#ayah-jump-divider').hidden = byPage;
  if (byPage) renderPage();
  else {
    document.title = `${surahName(s)} — ${state.language === 'ar' ? 'قالون' : 'Qaloon'}`;
    $('#chapter-context').textContent = surahName(s);
    $('#surah-header').className = 'surah-header';
    $('#surah-header').innerHTML = surahHeader(s);
    $('#quran-content').className = `quran-content ${state.view} ${s.count < 12 ? 'short-surah' : ''}`;
    $('#quran-content').innerHTML = s.ayahs.map(a => ayahElement(a, { verse: state.view === 'verses' })).join(' ');
    $('#page-context').textContent = t("Surah {number} of {count}", { number: n(s.id), count: n(114) });
    $('#chapter-pagination').setAttribute('aria-label', t("Chapter navigation"));
    $('#chapter-pagination').innerHTML = `<button class="chapter-link previous" data-go="${s.id - 1}" ${s.id === 1 ? 'disabled' : ''}>${icon('arrow')}<span><small>${t("PREVIOUS SURAH")}</small><strong>${s.id > 1 ? escape(surahName(surahs[s.id - 2])) : t("Beginning of the Quran")}</strong></span></button><span class="pagination-ornament">✧</span><button class="chapter-link next" data-go="${s.id + 1}" ${s.id === 114 ? 'disabled' : ''}><span><small>${t("NEXT SURAH")}</small><strong>${s.id < 114 ? escape(surahName(surahs[s.id])) : t("End of the Quran")}</strong></span>${icon('arrow')}</button>`;
  }
  $('#ayah-select').innerHTML = s.ayahs.map(a => `<option value="${a.ayah}" ${a.ayah === state.ayah ? 'selected' : ''}>${n(a.ayah)}</option>`).join('');
  document.querySelectorAll('[data-view]').forEach(button => { button.classList.toggle('active', button.dataset.view === state.view); button.setAttribute('aria-pressed', String(button.dataset.view === state.view)); });
  updateFontControls();
  deselectAyah();
  requestAnimationFrame(observeReading);
}

function surahHeader(s) {
  const basmalah = data.ayahs.find(a => a.surah === 1 && a.ayah === 0);
  return `<div class="surah-heading" data-surah-header="${s.id}" dir="${languageDirection(state.language)}" lang="${state.language}"><div class="surah-title-number">${n(String(s.id).padStart(2, '0'))}</div><div><span class="eyebrow">${t("SURAH {number}", { number: n(String(s.id).padStart(2, '0')) })}</span><h2>${escape(surahName(s))}</h2><p>${state.language === 'en' ? `${escape(s.meaning)} <span>·</span> ` : ''}${countAyahs(s.count)}</p></div><div class="surah-title-arabic secondary-name" lang="${state.language === 'ar' ? 'en' : 'ar'}" dir="${state.language === 'ar' ? 'ltr' : 'rtl'}">${state.language === 'en' ? '<span>سُورَةُ</span>' : ''}${escape(state.language === 'ar' ? s.name : s.arabic)}</div></div>${s.id !== 9 ? `<div class="bismillah" lang="ar" dir="rtl">${escape(displayText(basmalah.text))}</div>` : '<div class="no-bismillah"></div>'}`;
}

function ayahElement(a, { verse = false, end = true, id = true } = {}) {
  const s = surahs[a.surah - 1], saved = isBookmarked(a.surah, a.ayah);
  const tag = verse ? 'div' : 'span';
  return `<${tag} class="ayah ${saved ? 'bookmarked' : ''}" ${id ? `id="ayah-${a.surah}-${a.ayah}"` : ''} data-surah="${a.surah}" data-ayah="${a.ayah}" role="button" tabindex="0" aria-label="${escape(t("{name}, ayah {ayah}: {text}", { name: surahName(s), ayah: n(a.ayah), text: displayText(a.text) }))}${saved ? t(", bookmarked") : ''}" aria-pressed="false">${verse ? `<span class="verse-reference" dir="ltr">${a.surah}:${a.ayah}${saved ? icon('bookmark') : ''}</span><span class="verse-text">` : ''}${ayahMarkup(a, end)}${verse ? '</span>' : ''}</${tag}>`;
}

function renderPage() {
  const page = pages[state.page - 1];
  const names = page.sections.map(section => surahName(surahs[section.surah - 1])).join(' · ');
  document.title = `${t("Page {number}", { number: n(page.number) })} — ${state.language === 'ar' ? 'قالون' : 'Qaloon'}`;
  $('#chapter-context').textContent = t("Page {number}", { number: n(page.number) });
  $('#surah-header').className = 'page-heading';
  $('#surah-header').innerHTML = `<div><span class="eyebrow">${t("THE HOLY QURAN")}</span><h2>${t("Page {number}", { number: n(page.number) })}</h2><p>${escape(names)}</p></div><span class="page-heading-number" aria-hidden="true">${arabicNumber(page.number)}</span>`;
  $('#quran-content').className = 'page-content';
  const seen = new Set();
  $('#quran-content').innerHTML = page.sections.map(section => {
    const s = surahs[section.surah - 1];
    const heading = section.startsSurah ? `<div class="surah-header page-surah-header">${surahHeader(s)}</div>` : `<div class="page-continuation" dir="${languageDirection(state.language)}" lang="${state.language}"><span>${escape(surahName(s))} <small>${t("continued")}</small></span><span class="surah-arabic secondary-name" lang="${state.language === 'ar' ? 'en' : 'ar'}" dir="${state.language === 'ar' ? 'ltr' : 'rtl'}">${escape(state.language === 'ar' ? s.name : s.arabic)}</span></div>`;
    return `<section class="page-section" aria-label="${escape(surahName(s))}">${heading}<div class="page-lines" lang="ar" dir="rtl">${section.lines.map(line => `<div class="mushaf-line" data-line="${line.number}">${line.fragments.map(fragment => {
      const key = `${fragment.surah}:${fragment.ayah}`, id = !seen.has(key);
      seen.add(key);
      return ayahElement(fragment, { end: fragment.end, id });
    }).join(' ')}</div>`).join('')}</div></section>`;
  }).join('');
  $('#page-number').value = n(page.number);
  $('[data-action="previous-page"]').disabled = page.number === 1;
  $('[data-action="next-page"]').disabled = page.number === pages.length;
  $('#page-layout-label').textContent = t("Uthmani script · Line-by-line reading");
  $('#page-context').textContent = t("Page {number} of {count}", { number: n(page.number), count: n(pages.length) });
  $('#chapter-pagination').setAttribute('aria-label', t("Page navigation"));
  $('#chapter-pagination').innerHTML = `<button class="chapter-link previous" data-page="${page.number - 1}" ${page.number === 1 ? 'disabled' : ''}>${icon('arrow')}<span><small>${t("PREVIOUS PAGE")}</small><strong>${page.number > 1 ? t("Page {number}", { number: n(page.number - 1) }) : t("Beginning of the Quran")}</strong></span></button><span class="pagination-page-number">${n(page.number)} <span>/ ${n(pages.length)}</span></span><button class="chapter-link next" data-page="${page.number + 1}" ${page.number === pages.length ? 'disabled' : ''}><span><small>${t("NEXT PAGE")}</small><strong>${page.number < pages.length ? t("Page {number}", { number: n(page.number + 1) }) : t("End of the Quran")}</strong></span>${icon('arrow')}</button>`;
}

function updateFontControls() {
  $('#font-size').textContent = n(state.fontSize);
  $('[data-action="smaller"]').disabled = state.fontSize <= 28;
  $('[data-action="larger"]').disabled = state.fontSize >= 52;
}

function updateResumeLabel() {
  const s = surahs[state.lastRead.surah - 1];
  $('#resume-label').textContent = t("Your place: {name} {ayah}", { name: surahName(s), ayah: n(state.lastRead.ayah) });
}

function recordProgress(ayah, surah = state.surah) {
  const changedSurah = surah !== state.surah;
  state.surah = surah;
  state.ayah = ayah;
  if (state.mode === 'surah') state.page = surahs[surah - 1].ayahs.find(a => a.ayah === ayah).page;
  state.lastRead = { surah, ayah, page: state.page };
  const hash = state.mode === 'page' ? `#page/${state.page}/${surah}:${ayah}` : `#${surah}:${ayah}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
  $('#ayah-select').value = String(ayah);
  if (changedSurah) renderSidebar();
  updateResumeLabel();
  persist();
}

function observeReading() {
  // Programmatic navigation must preserve its target, even when several ayahs
  // share a line. Track viewport progress only after the reader scrolls.
  observer = new IntersectionObserver(entries => {
    const candidates = entries.filter(e => e.isIntersecting);
    if (!trackingReading || !candidates.length || window.scrollY < 300 || state.selected) return;
    const nearest = candidates.sort((a, b) => Math.abs(a.boundingClientRect.top - 180) - Math.abs(b.boundingClientRect.top - 180))[0];
    recordProgress(Number(nearest.target.dataset.ayah), Number(nearest.target.dataset.surah));
  }, { rootMargin: '-100px 0px -55% 0px', threshold: 0 });
  document.querySelectorAll('.ayah').forEach(a => observer.observe(a));
}

function openSurah(id, ayah = 1, scroll = true) {
  const target = surahs[id - 1]?.ayahs.find(a => a.ayah === ayah);
  if (!target) return;
  state.surah = id;
  state.ayah = ayah;
  state.page = target.page;
  renderSidebar();
  renderReader();
  recordProgress(ayah);
  closeMenu();
  if (scroll) requestAnimationFrame(() => {
    if (state.mode === 'page' && ayah === 1) $(`[data-surah-header="${id}"]`).scrollIntoView({ behavior: 'smooth', block: 'start' });
    else if (ayah > 1) jumpToAyah(ayah, true, id);
    else $('#reader').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function openPage(number, scroll = true, reference = null) {
  const page = pages[number - 1];
  if (!page) return;
  const target = reference || pageAyahs(page)[0];
  state.mode = 'page';
  state.page = number;
  state.surah = target.surah;
  state.ayah = target.ayah;
  renderSidebar();
  renderReader();
  recordProgress(target.ayah, target.surah);
  closeMenu();
  if (scroll) requestAnimationFrame(() => reference ? jumpToAyah(target.ayah, true, target.surah) : $('#reader').scrollIntoView({ block: 'start' }));
}

function switchMode(mode) {
  if (mode === state.mode) return;
  const { surah, ayah } = state;
  state.mode = mode;
  renderReader();
  recordProgress(ayah, surah);
  requestAnimationFrame(() => jumpToAyah(ayah, false, surah));
}

function jumpToAyah(ayah, select = true, surah = state.surah) {
  const element = $(`#ayah-${surah}-${ayah}`);
  if (!element) return;
  trackingReading = false;
  element.scrollIntoView({ behavior: select ? 'smooth' : 'instant', block: 'center' });
  recordProgress(ayah, surah);
  if (select) selectAyah(ayah, surah);
}

function selectAyah(ayah, surah = state.surah) {
  document.querySelectorAll('.ayah.selected').forEach(a => { a.classList.remove('selected'); a.setAttribute('aria-pressed', 'false'); });
  state.selected = { surah, ayah };
  document.querySelectorAll(`.ayah[data-surah="${surah}"][data-ayah="${ayah}"]`).forEach(element => {
    element.classList.add('selected');
    element.setAttribute('aria-pressed', 'true');
  });
  recordProgress(ayah, surah);
  $('#ayah-actions').hidden = false;
  $('#selected-reference').innerHTML = `${escape(surahName(surahs[surah - 1]))} <bdi dir="ltr">${surah}:${ayah}</bdi>`;
  updateSaveButton();
}

function deselectAyah() {
  state.selected = null;
  document.querySelectorAll('.ayah.selected').forEach(a => { a.classList.remove('selected'); a.setAttribute('aria-pressed', 'false'); });
  $('#ayah-actions').hidden = true;
}

function updateSaveButton() {
  const saved = isBookmarked(state.selected.surah, state.selected.ayah);
  $('#save-ayah').innerHTML = `${icon(saved ? 'check' : 'bookmark')}<span>${saved ? t("Bookmarked") : t("Bookmark")}</span>`;
  $('#save-ayah').setAttribute('aria-label', saved ? t("Remove bookmark") : t("Bookmark ayah"));
  $('#save-ayah').setAttribute('aria-pressed', String(saved));
}

function toggleBookmark(surah, ayah) {
  const saved = isBookmarked(surah, ayah);
  state.bookmarks = saved ? state.bookmarks.filter(b => b.surah !== surah || b.ayah !== ayah) : [{ surah, ayah }, ...state.bookmarks];
  persist();
  $('#bookmark-count').textContent = n(state.bookmarks.length);
  $('#bookmark-count').hidden = !state.bookmarks.length;
  document.querySelectorAll(`.ayah[data-surah="${surah}"][data-ayah="${ayah}"]`).forEach(element => element.classList.toggle('bookmarked', !saved));
  if (state.selected) updateSaveButton();
  renderSidebar();
  renderBookmarks();
  toast(saved ? t("Bookmark removed") : t("Ayah saved to your bookmarks"));
}

function renderBookmarks() {
  $('#bookmarks-content').innerHTML = state.bookmarks.length ? `<p class="dialog-description">${t("A few words to come back to. Saved in this browser.")}</p><div class="bookmark-list">${state.bookmarks.map(b => {
    const s = surahs[b.surah - 1], a = s.ayahs.find(a => a.ayah === b.ayah);
    return `<div class="bookmark-card"><button class="bookmark-open" data-reference="${b.surah}:${b.ayah}"><span class="result-label">${escape(surahName(s))} <span><bdi dir="ltr">${b.surah}:${b.ayah}</bdi></span></span><span class="result-arabic" lang="ar" dir="rtl">${escape(displayText(a.text))}</span></button><button class="icon-button remove-bookmark" data-remove="${b.surah}:${b.ayah}" aria-label="${t("Remove bookmark {reference}", { reference: `${b.surah}:${b.ayah}` })}">${icon('close')}</button></div>`;
  }).join('')}</div>` : `<div class="empty-state">${icon('bookmark')}<h3>${t("A place for what stays with you.")}</h3><p>${t("Select an ayah while reading, then choose Bookmark.")}<br>${t("Your saved ayahs will be waiting here.")}</p><button class="primary-button" data-close="bookmarks-dialog">${t("Return to reading")} ${icon('arrow')}</button></div>`;
}

function showSearchResults() {
  const raw = normalizeDigits($('#quran-search').value.trim());
  const query = normalizeSearch(raw);
  if (!query) {
    $('#search-results').innerHTML = `<p class="search-hint">${t("Search by name, number, or a few words in Arabic.")}</p><span class="eyebrow popular-label">${t("A PLACE TO BEGIN")}</span><div class="popular-surahs">${[1, 18, 36, 55, 67, 112].map(id => `<button data-reference="${id}:1">${escape(surahName(surahs[id - 1]))}${icon('arrow')}</button>`).join('')}</div><p class="numbering-note">${t("References use Qālūn’s Last Madani numbering.")}</p>`;
    return;
  }
  const reference = /^(\d+)\s*:\s*(\d+)$/.exec(raw);
  const matchingSurahs = surahs.filter(s => normalizeSearch(`${s.name} ${s.arabic} ${s.meaning}`).includes(query) || String(s.id) === raw);
  const allMatches = reference ? searchIndex.filter(a => a.surah === +reference[1] && a.ayah === +reference[2]) : /[\u0600-\u08ff]/.test(query) && query.length >= 2 ? searchIndex.filter(a => a.normalized.includes(query)) : [];
  const matches = allMatches.slice(0, 50);
  $('#search-results').innerHTML = `${matchingSurahs.length ? `<div class="result-section-title">${t("SURAHS")} <span>${n(matchingSurahs.length)}</span></div>${matchingSurahs.map(s => `<button class="surah-result" data-reference="${s.id}:1"><span class="surah-number">${n(String(s.id).padStart(2, '0'))}</span><span><strong>${escape(surahName(s))}</strong><small>${state.language === 'en' ? `${escape(s.meaning)} · ` : ''}${countAyahs(s.count)}</small></span><span class="surah-arabic secondary-name" lang="${state.language === 'ar' ? 'en' : 'ar'}" dir="${state.language === 'ar' ? 'ltr' : 'rtl'}">${escape(state.language === 'ar' ? s.name : s.arabic)}</span>${icon('arrow')}</button>`).join('')}` : ''}${matches.length ? `<div class="result-section-title">${t("AYAHS")} <span>${n(allMatches.length)}${allMatches.length > 50 ? t(" · showing first 50") : ''}</span></div>${matches.map(a => `<button class="ayah-result" data-reference="${a.surah}:${a.ayah}"><span class="result-label">${escape(surahName(surahs[a.surah - 1]))}<span><bdi dir="ltr">${a.surah}:${a.ayah}</bdi></span></span><span class="result-arabic" dir="rtl" lang="ar">${escape(displayText(a.text))}</span></button>`).join('')}` : ''}${!matches.length && !matchingSurahs.length ? `<div class="empty-state">${icon('search')}<h3>${t("No results just yet.")}</h3><p>${t("Try a surah name, Arabic words, or a reference like 1:2.")}<br>${t("Ayah numbers follow the Qālūn narration.")}</p></div>` : ''}`;
}

function showDialog(id) {
  closeMenu();
  if (id === 'bookmarks-dialog') renderBookmarks();
  if (id === 'search-dialog') showSearchResults();
  $(`#${id}`).showModal();
  if (id === 'search-dialog') $('#quran-search').focus();
}

function closeMenu() {
  $('#sidebar').classList.remove('open');
  $('.sidebar-overlay').hidden = true;
  $('[data-action="menu"]').setAttribute('aria-expanded', 'false');
  document.body.classList.remove('menu-open');
}

async function copyText(text, message) {
  try { await navigator.clipboard.writeText(text); toast(message); }
  catch { toast(t("Copy is unavailable in this browser. Please select and copy the text.")); }
}

function switchLanguage() {
  const anchor = state.selected || { surah: state.surah, ayah: state.ayah };
  const element = $(`#ayah-${anchor.surah}-${anchor.ayah}`);
  const top = element?.getBoundingClientRect().top;
  const scrollY = window.scrollY;
  const selected = state.selected;
  closeMenu();
  state.language = state.language === 'ar' ? 'en' : 'ar';
  applyLanguage();
  persist();
  renderApp();
  $('#surah-search').value = state.query;
  document.querySelectorAll('[data-tab]').forEach(button => {
    button.classList.toggle('active', button.dataset.tab === state.tab);
    button.setAttribute('aria-pressed', String(button.dataset.tab === state.tab));
  });
  renderSidebar();
  renderReader();
  bindEvents();
  if (selected) selectAyah(selected.ayah, selected.surah);
  $('[data-action="language"]').focus({ preventScroll: true });
  requestAnimationFrame(() => {
    const target = $(`#ayah-${anchor.surah}-${anchor.ayah}`);
    window.scrollTo({ top: scrollY > 300 && target && top != null ? window.scrollY + target.getBoundingClientRect().top - top : scrollY, behavior: 'instant' });
  });
}

function bindEvents() {
  eventController?.abort();
  eventController = new AbortController();
  const listen = (target, type, callback, options = {}) =>
    target.addEventListener(type, callback, { ...options, signal: eventController.signal });
  for (const type of ['wheel', 'touchmove']) listen(window, type, () => { trackingReading = true; }, { passive: true });
  listen(document, 'pointerdown', event => { if (event.target === document.documentElement) trackingReading = true; });
  listen(document, 'click', event => {
    const button = event.target.closest('button');
    const ayah = event.target.closest('[data-ayah]');
    if (ayah) { selectAyah(Number(ayah.dataset.ayah), Number(ayah.dataset.surah)); return; }
    if (!button) return;
    if (button.dataset.close) { $(`#${button.dataset.close}`).close(); return; }
    if (button.dataset.surah) { openSurah(Number(button.dataset.surah)); return; }
    if (button.dataset.go) { openSurah(Number(button.dataset.go)); return; }
    if (button.dataset.page) { openPage(Number(button.dataset.page)); return; }
    if (button.dataset.mode) { switchMode(button.dataset.mode); return; }
    if (button.dataset.reference) {
      const [s, a] = button.dataset.reference.split(':').map(Number);
      document.querySelectorAll('dialog[open]').forEach(d => d.close());
      openSurah(s, a);
      return;
    }
    if (button.dataset.remove) { toggleBookmark(...button.dataset.remove.split(':').map(Number)); return; }
    if (button.dataset.tab) {
      state.tab = button.dataset.tab;
      document.querySelectorAll('[data-tab]').forEach(b => { b.classList.toggle('active', b.dataset.tab === state.tab); b.setAttribute('aria-pressed', String(b.dataset.tab === state.tab)); });
      renderSidebar();
      return;
    }
    if (button.dataset.view) {
      state.view = button.dataset.view;
      persist(); renderReader();
      return;
    }
    switch (button.dataset.action) {
      case 'language': switchLanguage(); break;
      case 'read': $('#reader').scrollIntoView({ behavior: 'smooth' }); break;
      case 'bookmarks': showDialog('bookmarks-dialog'); break;
      case 'about': showDialog('about-dialog'); break;
      case 'search': showDialog('search-dialog'); break;
      case 'theme':
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = state.theme;
        button.innerHTML = icon(state.theme === 'light' ? 'moon' : 'sun');
        button.setAttribute('aria-label', themeLabel());
        persist(); break;
      case 'menu':
        $('#sidebar').classList.add('open'); $('.sidebar-overlay').hidden = false;
        button.setAttribute('aria-expanded', 'true'); document.body.classList.add('menu-open');
        $('#surah-search').focus(); break;
      case 'close-menu': closeMenu(); break;
      case 'resume':
        if (state.mode === 'page') openPage(state.lastRead.page || surahs[state.lastRead.surah - 1].ayahs.find(a => a.ayah === state.lastRead.ayah).page, true, state.lastRead);
        else openSurah(state.lastRead.surah, state.lastRead.ayah);
        break;
      case 'previous-page': openPage(state.page - 1); break;
      case 'next-page': openPage(state.page + 1); break;
      case 'smaller': case 'larger':
        state.fontSize = Math.max(28, Math.min(52, state.fontSize + (button.dataset.action === 'larger' ? 4 : -4)));
        document.documentElement.style.setProperty('--quran-size', `${state.fontSize}px`);
        updateFontControls(); persist(); break;
      case 'save-ayah': if (state.selected) toggleBookmark(state.selected.surah, state.selected.ayah); break;
      case 'copy-ayah': {
        if (!state.selected) break;
        const { surah, ayah } = state.selected;
        const a = surahs[surah - 1].ayahs.find(a => a.ayah === ayah);
        copyText(`${displayText(a.text)}\n[${surahName(surahs[surah - 1])} ${surah}:${ayah} · ${t("Qālūn ʿan Nāfiʿ")}]`, t("Ayah copied"));
        break;
      }
      case 'share-ayah': if (state.selected) {
        const { surah, ayah } = state.selected;
        const hash = state.mode === 'page' ? `#page/${state.page}/${surah}:${ayah}` : `#${surah}:${ayah}`;
        copyText(`${location.href.split('#')[0]}${hash}`, t("Ayah link copied"));
      } break;
      case 'deselect': deselectAyah(); break;
    }
  });
  listen($('#surah-search'), 'input', event => { state.query = event.target.value; renderSidebar(); });
  listen($('#quran-search'), 'input', showSearchResults);
  listen($('#ayah-select'), 'change', event => jumpToAyah(Number(event.target.value)));
  listen($('#page-number'), 'input', event => event.target.setCustomValidity(''));
  listen($('#page-form'), 'submit', event => {
    event.preventDefault();
    const input = $('#page-number');
    const value = normalizeDigits(input.value.trim());
    const number = Number(value);
    const valid = /^\d+$/.test(value) && Number.isInteger(number) && number >= 1 && number <= pages.length;
    input.setCustomValidity(valid ? '' : t("Enter a page number from {first} to {last}.", { first: n(1), last: n(pages.length) }));
    if ($('#page-form').reportValidity()) openPage(number);
  });
  listen(document, 'keydown', event => {
    if (['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End', ' '].includes(event.key) && !['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(document.activeElement.tagName)) trackingReading = true;
    if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { event.preventDefault(); showDialog('search-dialog'); }
    if (event.key === 'Escape') { deselectAyah(); closeMenu(); }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-ayah]')) { event.preventDefault(); selectAyah(Number(event.target.dataset.ayah), Number(event.target.dataset.surah)); }
  });
  listen(window, 'hashchange', () => {
    const pageRef = parsePageReference(location.hash, pages);
    if (pageRef) { openPage(pageRef.page, true, pageRef); return; }
    const ref = parseReference(location.hash, surahs);
    if (ref) { state.mode = 'surah'; openSurah(ref.surah, ref.ayah); }
  });
  document.querySelectorAll('dialog').forEach(dialog => listen(dialog, 'click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  }));
}

init();
