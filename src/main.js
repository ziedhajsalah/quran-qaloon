import './style.css';
import dataUrl from '../quran-qalun-rasm_uthmani.json?url';
import { makeSurahs, displayText, normalizeSearch, parseReference } from './data.js';

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
const icon = (name, cls = '') => `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.book}</svg>`;
const ornament = (cls = '') => `<svg class="ornament ${cls}" viewBox="0 0 200 200" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width=".65"><path d="M100 8 127 34 165 35 166 73 192 100 166 127 165 165 127 166 100 192 73 166 35 165 34 127 8 100 34 73 35 35 73 34Z"/><path d="M100 23 122 47 155 45 153 78 177 100 153 122 155 155 122 153 100 177 78 153 45 155 47 122 23 100 47 78 45 45 78 47Z"/><rect x="48" y="48" width="104" height="104"/><rect x="48" y="48" width="104" height="104" transform="rotate(45 100 100)"/><circle cx="100" cy="100" r="40"/><circle cx="100" cy="100" r="34"/><path d="m100 48 15 37 37 15-37 15-15 37-15-37-37-15 37-15Z"/><path d="M100 8v40m0 104v40M8 100h40m104 0h40M35 35l37 37m56 56 37 37M35 165l37-37m56-56 37-37"/></g><circle cx="100" cy="100" r="4" fill="currentColor"/></svg>`;
const escape = str => String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const arabicNumber = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
function ayahMarkup(ayah) {
  const words = displayText(ayah.text).split(' ');
  const lastWord = words.pop();
  return `${escape(words.join(' '))}${words.length ? ' ' : ''}<span class="ayah-ending">${escape(lastWord)} <span class="ayah-marker" aria-hidden="true">${arabicNumber(ayah.ayah)}</span></span>`;
}
const storageKey = 'qaloon-reader-v1';
let stored = {};
try { stored = JSON.parse(localStorage.getItem(storageKey)) || {}; } catch { /* A fresh session is always available. */ }
const state = {
  surah: 1, ayah: 1, view: stored.view === 'verses' ? 'verses' : 'reading',
  fontSize: [28, 32, 36, 40, 44, 48, 52].includes(stored.fontSize) ? stored.fontSize : 36,
  theme: stored.theme === 'dark' ? 'dark' : 'light',
  bookmarks: Array.isArray(stored.bookmarks) ? stored.bookmarks.filter(b => b && Number.isInteger(b.surah) && Number.isInteger(b.ayah)) : [],
  lastRead: stored.lastRead || { surah: 1, ayah: 1 },
  tab: 'surahs', query: '', selected: null,
};
document.documentElement.dataset.theme = state.theme;
document.documentElement.style.setProperty('--quran-size', `${state.fontSize}px`);
let surahs = [], data, searchIndex = [], observer, toastTimeout;
const $ = selector => document.querySelector(selector);
const persist = () => {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ view: state.view, fontSize: state.fontSize, theme: state.theme, bookmarks: state.bookmarks, lastRead: state.lastRead }));
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
    state.bookmarks = state.bookmarks.filter(b => surahs[b.surah - 1]?.ayahs.some(a => a.ayah === b.ayah));
    if (!surahs[state.lastRead.surah - 1]?.ayahs.some(a => a.ayah === state.lastRead.ayah)) state.lastRead = { surah: 1, ayah: 1 };
    const reference = parseReference(location.hash, surahs) || state.lastRead;
    state.surah = reference.surah;
    state.ayah = reference.ayah;
    searchIndex = data.ayahs.filter(a => a.ayah > 0).map(a => ({ ...a, normalized: normalizeSearch(displayText(a.text)) }));
    renderApp();
    renderSidebar();
    renderReader();
    bindEvents();
    if (reference.ayah > 1) requestAnimationFrame(() => jumpToAyah(reference.ayah, false));
  } catch (error) {
    $('#app').innerHTML = `<main class="error-state">${icon('book')}<h1>A moment, please.</h1><p>We couldn’t open the Quran data. Please try again.</p><button class="primary-button" id="retry">Try again ${icon('arrow')}</button></main>`;
    $('#retry').addEventListener('click', init);
    console.error(error);
  }
}

function renderApp() {
  $('#app').innerHTML = `
    <a class="skip-link" href="#reader">Skip to Quran</a>
    <header class="site-header">
      <a class="brand" href="#1:1" aria-label="Qaloon home"><span class="brand-symbol">${ornament()}${icon('book')}</span><span class="brand-name">qaloon<span>A SPACE FOR THE QURAN</span></span></a>
      <nav class="main-nav" aria-label="Main navigation"><button class="nav-link active" data-action="read">${icon('book')}<span>Read Quran</span></button><button class="nav-link" data-action="bookmarks">${icon('bookmark')}<span>Bookmarks</span><span id="bookmark-count" class="nav-count" ${state.bookmarks.length ? '' : 'hidden'}>${state.bookmarks.length}</span></button><button class="nav-link" data-action="about">About</button></nav>
      <div class="header-tools"><button class="icon-button global-search" data-action="search" aria-label="Search the Quran">${icon('search')}</button><span class="header-divider"></span><button class="icon-button" id="theme-toggle" data-action="theme" aria-label="Switch to ${state.theme === 'light' ? 'dark' : 'light'} theme">${icon(state.theme === 'light' ? 'moon' : 'sun')}</button><button class="icon-button mobile-menu" data-action="menu" aria-label="Open surah navigation" aria-expanded="false" aria-controls="sidebar">${icon('menu')}</button></div>
    </header>
    <div class="workspace">
      <button class="sidebar-overlay" data-action="close-menu" aria-label="Close surah navigation" hidden></button>
      <aside class="sidebar" id="sidebar" aria-label="Surah navigation">
        <div class="sidebar-top"><div class="sidebar-heading"><h2>Your Quran</h2><span>114 SURAHS</span><button class="icon-button mobile-menu" data-action="close-menu" aria-label="Close surah navigation">${icon('close')}</button></div>
          <label class="surah-search">${icon('search')}<input id="surah-search" type="search" placeholder="Find a surah…" aria-label="Find a surah" autocomplete="off"/><kbd>/</kbd></label>
          <div class="sidebar-tabs" role="group" aria-label="Navigation filter"><button data-tab="surahs" class="active" aria-pressed="true">All surahs</button><button data-tab="saved" aria-pressed="false">${icon('bookmark')} Saved</button></div>
        </div>
        <div class="surah-list" id="surah-list"></div>
        <div class="sidebar-bottom"><span class="small-rosette">✧</span><div>One ayah at a time.<span>Let your heart find its way.</span></div></div>
      </aside>
      <main class="main-content" id="main-content">
        <section class="welcome" aria-labelledby="welcome-title"><div class="welcome-copy"><div class="eyebrow"><span class="tiny-star">✦</span> IN THE NAME OF ALLAH, THE MOST MERCIFUL</div><h1 id="welcome-title">Read. Reflect. <em>Return.</em></h1><p>A little stillness. A deeper connection.</p><span class="edition-label"><span></span> Qālūn ʿan Nāfiʿ <i>·</i> Uthmani script</span></div><div class="welcome-art">${ornament()}<span lang="ar" dir="rtl">القرآن الكريم</span></div></section>
        <div class="reading-context"><div class="context-label">${icon('book')}<span>THE HOLY QURAN</span><span class="context-line"></span><span id="chapter-context"></span></div><button class="resume-button" data-action="resume">${icon('bookmark')}<span id="resume-label"></span>${icon('arrow')}</button></div>
        <section class="reader" id="reader" aria-label="Quran reader" tabindex="-1">
          <div class="reader-toolbar"><div class="view-switch" role="group" aria-label="Reading layout"><button data-view="reading" aria-label="Continuous reading" title="Continuous reading">${icon('book')}<span>Reading</span></button><button data-view="verses" aria-label="Ayah by ayah" title="Ayah by ayah">${icon('list')}<span>Ayah by ayah</span></button></div><div class="reader-controls"><label class="jump-label" for="ayah-select">Go to ayah <select id="ayah-select" aria-label="Go to ayah"></select>${icon('down')}</label><span class="toolbar-divider"></span><div class="font-controls"><button class="icon-button" data-action="smaller" aria-label="Decrease Arabic text size">A<span>−</span></button><span class="font-size" id="font-size"></span><button class="icon-button" data-action="larger" aria-label="Increase Arabic text size">A<span>+</span></button></div></div></div>
          <div id="surah-header" class="surah-header"></div>
          <div id="quran-content" class="quran-content" lang="ar" dir="rtl"></div>
          <div class="reader-colophon"><span></span>${ornament()}<span></span></div>
          <div class="reader-bottom"><span>${icon('info')} Select an ayah to bookmark or copy</span><span id="page-context"></span></div>
        </section>
        <nav class="chapter-pagination" id="chapter-pagination" aria-label="Chapter navigation"></nav>
        <footer class="main-footer"><span>Made for a more mindful reading.</span><button data-action="about">Qālūn narration <span>·</span> About this text ${icon('arrow')}</button></footer>
      </main>
    </div>
    <dialog id="search-dialog" class="search-dialog" aria-labelledby="search-title"><div class="dialog-header"><div><span class="eyebrow">EXPLORE THE QURAN</span><h2 id="search-title">Seek, and find.</h2></div><button class="icon-button" data-close="search-dialog" aria-label="Close search">${icon('close')}</button></div><label class="dialog-search">${icon('search')}<input id="quran-search" type="search" placeholder="Search a surah, Arabic text, or 2:255" aria-label="Search Quran" autocomplete="off"/></label><div id="search-results" class="search-results"></div></dialog>
    <dialog id="bookmarks-dialog" aria-labelledby="bookmarks-title"><div class="dialog-header"><div><span class="eyebrow">KEEP WHAT MOVES YOU</span><h2 id="bookmarks-title">Your bookmarks</h2></div><button class="icon-button" data-close="bookmarks-dialog" aria-label="Close bookmarks">${icon('close')}</button></div><div id="bookmarks-content"></div></dialog>
    <dialog id="about-dialog" class="about-dialog" aria-labelledby="about-title"><div class="dialog-header"><div><span class="eyebrow">A SPACE FOR THE QURAN</span><h2 id="about-title">Welcome to Qaloon.</h2></div><button class="icon-button" data-close="about-dialog" aria-label="Close about">${icon('close')}</button></div><p>A quiet companion for reading, reflecting, and returning to the Holy Quran.</p><div class="about-stats"><div><strong>114</strong><span>Surahs</span></div><div><strong>${data.meta.edition.ayah_count.toLocaleString()}</strong><span>Numbered ayahs</span></div><div><strong>604</strong><span>Source pages</span></div></div><h3>The text you’re reading</h3><p>Qālūn ʿan Nāfiʿ al-Madanī, in Uthmani script, with the Last Madani ayah numbering. Ayah references in this app belong to this narration and numbering system.</p><p>The Quran text is loaded from the supplied <code>quran-qalun-rasm_uthmani.json</code>, sourced from <a href="https://text.quran.ws/" target="_blank" rel="noreferrer">Quran.ws</a> and the King Fahd Glorious Quran Printing Complex’s Uthmanic Qaloun v3.0 release. It uses the matching Qālūn font.</p><h3>Make yourself at home</h3><p>Switch between continuous reading and individual ayahs. Select any ayah to save it, copy it, or share a link. Your place, bookmarks, text size, and theme are saved in this browser.</p><p class="license-note">${escape(data.meta.license)} Font and text rights remain with their respective owners. <a href="https://fonts.qurancomplex.gov.sa/qaloun-reading/" target="_blank" rel="noreferrer">Original publisher ${icon('arrow')}</a></p></dialog>
    <div class="ayah-actions" id="ayah-actions" role="region" aria-label="Selected ayah actions" hidden><span id="selected-reference"></span><button data-action="save-ayah" id="save-ayah"></button><button data-action="copy-ayah">${icon('copy')}<span>Copy</span></button><button data-action="share-ayah">${icon('link')}<span>Link</span></button><button class="icon-button" data-action="deselect" aria-label="Close ayah actions">${icon('close')}</button></div>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`;
  updateResumeLabel();
}

function renderSidebar() {
  const query = normalizeSearch(state.query);
  const filtered = surahs.filter(s => (!query || normalizeSearch(`${s.id} ${s.name} ${s.arabic} ${s.meaning}`).includes(query)) && (state.tab !== 'saved' || state.bookmarks.some(b => b.surah === s.id)));
  $('#surah-list').innerHTML = filtered.length ? filtered.map(s => `<button class="surah-item ${s.id === state.surah ? 'active' : ''}" data-surah="${s.id}" ${s.id === state.surah ? 'aria-current="true"' : ''}><span class="surah-number">${s.id.toString().padStart(2, '0')}</span><span class="surah-details"><strong>${escape(s.name)}</strong><small>${s.count} ayahs <span>·</span> ${escape(s.meaning)}</small></span><span class="surah-arabic" lang="ar" dir="rtl">${s.arabic}</span></button>`).join('') : `<div class="sidebar-empty">${icon(state.tab === 'saved' ? 'bookmark' : 'search')}<p>${state.tab === 'saved' && !query ? 'Your saved surahs will appear here.' : 'No surahs found.'}</p><span>${state.tab === 'saved' && !query ? 'Select an ayah to add a bookmark.' : 'Try a name or surah number.'}</span></div>`;
}

function renderReader() {
  observer?.disconnect();
  const s = surahs[state.surah - 1];
  document.title = `${s.name} — Qaloon`;
  $('#chapter-context').textContent = s.name;
  $('#surah-header').innerHTML = `<div class="surah-heading"><div class="surah-title-number">${String(s.id).padStart(2, '0')}</div><div><span class="eyebrow">SURAH ${String(s.id).padStart(2, '0')}</span><h2>${escape(s.name)}</h2><p>${escape(s.meaning)} <span>·</span> ${s.count} ayahs</p></div><div class="surah-title-arabic" lang="ar" dir="rtl"><span>سُورَةُ</span>${s.arabic}</div></div>${s.id !== 9 ? `<div class="bismillah" lang="ar" dir="rtl">${escape(displayText(data.ayahs.find(a => a.surah === 1 && a.ayah === 0).text))}</div>` : '<div class="no-bismillah"></div>'}`;
  $('#quran-content').className = `quran-content ${state.view} ${s.count < 12 ? 'short-surah' : ''}`;
  $('#quran-content').innerHTML = s.ayahs.map(a => `<${state.view === 'reading' ? 'span' : 'div'} class="ayah ${isBookmarked(s.id, a.ayah) ? 'bookmarked' : ''}" id="ayah-${a.ayah}" data-ayah="${a.ayah}" role="button" tabindex="0" aria-label="${escape(s.name)}, ayah ${a.ayah}: ${escape(displayText(a.text))}${isBookmarked(s.id, a.ayah) ? ', bookmarked' : ''}" aria-pressed="false">${state.view === 'verses' ? `<span class="verse-reference" dir="ltr">${s.id}:${a.ayah}${isBookmarked(s.id, a.ayah) ? icon('bookmark') : ''}</span><span class="verse-text">` : ''}${ayahMarkup(a)}${state.view === 'verses' ? '</span>' : ''}</${state.view === 'reading' ? 'span' : 'div'}> `).join('');
  $('#ayah-select').innerHTML = s.ayahs.map(a => `<option value="${a.ayah}" ${a.ayah === state.ayah ? 'selected' : ''}>${a.ayah}</option>`).join('');
  $('#page-context').textContent = `Surah ${s.id} of 114`;
  document.querySelectorAll('[data-view]').forEach(button => { button.classList.toggle('active', button.dataset.view === state.view); button.setAttribute('aria-pressed', String(button.dataset.view === state.view)); });
  updateFontControls();
  $('#chapter-pagination').innerHTML = `<button class="chapter-link previous" data-go="${s.id - 1}" ${s.id === 1 ? 'disabled' : ''}>${icon('arrow')}<span><small>PREVIOUS SURAH</small><strong>${s.id > 1 ? escape(surahs[s.id - 2].name) : 'Beginning of the Quran'}</strong></span></button><span class="pagination-ornament">✧</span><button class="chapter-link next" data-go="${s.id + 1}" ${s.id === 114 ? 'disabled' : ''}><span><small>NEXT SURAH</small><strong>${s.id < 114 ? escape(surahs[s.id].name) : 'End of the Quran'}</strong></span>${icon('arrow')}</button>`;
  deselectAyah();
  requestAnimationFrame(observeReading);
}

function updateFontControls() {
  $('#font-size').textContent = state.fontSize;
  $('[data-action="smaller"]').disabled = state.fontSize <= 28;
  $('[data-action="larger"]').disabled = state.fontSize >= 52;
}

function updateResumeLabel() {
  const s = surahs[state.lastRead.surah - 1];
  $('#resume-label').textContent = `Your place: ${s.name} ${state.lastRead.ayah}`;
}

function recordProgress(ayah) {
  state.ayah = ayah;
  state.lastRead = { surah: state.surah, ayah };
  const hash = `#${state.surah}:${ayah}`;
  if (location.hash !== hash) history.replaceState(null, '', hash);
  $('#ayah-select').value = String(ayah);
  updateResumeLabel();
  persist();
}

function observeReading() {
  // Only update while scrolling: opening a short surah should preserve ayah 1.
  observer = new IntersectionObserver(entries => {
    const candidates = entries.filter(e => e.isIntersecting);
    if (!candidates.length || window.scrollY < 300 || state.selected) return;
    const nearest = candidates.sort((a, b) => Math.abs(a.boundingClientRect.top - 180) - Math.abs(b.boundingClientRect.top - 180))[0];
    recordProgress(Number(nearest.target.dataset.ayah));
  }, { rootMargin: '-100px 0px -55% 0px', threshold: 0 });
  document.querySelectorAll('.ayah').forEach(a => observer.observe(a));
}

function openSurah(id, ayah = 1, scroll = true) {
  if (!surahs[id - 1]?.ayahs.some(a => a.ayah === ayah)) return;
  state.surah = id;
  state.ayah = ayah;
  history.replaceState(null, '', `#${id}:${ayah}`);
  renderSidebar();
  renderReader();
  recordProgress(ayah);
  closeMenu();
  if (scroll) requestAnimationFrame(() => ayah > 1 ? jumpToAyah(ayah) : $('#reader').scrollIntoView({ behavior: 'smooth', block: 'start' }));
}

function jumpToAyah(ayah, select = true) {
  const element = $(`#ayah-${ayah}`);
  if (!element) return;
  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  recordProgress(ayah);
  history.replaceState(null, '', `#${state.surah}:${ayah}`);
  if (select) selectAyah(ayah);
}

function selectAyah(ayah) {
  document.querySelectorAll('.ayah.selected').forEach(a => { a.classList.remove('selected'); a.setAttribute('aria-pressed', 'false'); });
  state.selected = ayah;
  const element = $(`#ayah-${ayah}`);
  element.classList.add('selected');
  element.setAttribute('aria-pressed', 'true');
  recordProgress(ayah);
  $('#ayah-actions').hidden = false;
  $('#selected-reference').textContent = `${surahs[state.surah - 1].name} ${state.surah}:${ayah}`;
  updateSaveButton();
}

function deselectAyah() {
  state.selected = null;
  document.querySelectorAll('.ayah.selected').forEach(a => { a.classList.remove('selected'); a.setAttribute('aria-pressed', 'false'); });
  $('#ayah-actions').hidden = true;
}

function updateSaveButton() {
  const saved = isBookmarked(state.surah, state.selected);
  $('#save-ayah').innerHTML = `${icon(saved ? 'check' : 'bookmark')}<span>${saved ? 'Saved' : 'Bookmark'}</span>`;
  $('#save-ayah').setAttribute('aria-label', saved ? 'Remove bookmark' : 'Bookmark ayah');
  $('#save-ayah').setAttribute('aria-pressed', String(saved));
}

function toggleBookmark(surah, ayah) {
  const saved = isBookmarked(surah, ayah);
  state.bookmarks = saved ? state.bookmarks.filter(b => b.surah !== surah || b.ayah !== ayah) : [{ surah, ayah }, ...state.bookmarks];
  persist();
  $('#bookmark-count').textContent = state.bookmarks.length;
  $('#bookmark-count').hidden = !state.bookmarks.length;
  if (surah === state.surah) $(`#ayah-${ayah}`)?.classList.toggle('bookmarked', !saved);
  if (state.selected) updateSaveButton();
  renderSidebar();
  renderBookmarks();
  toast(saved ? 'Bookmark removed' : 'Ayah saved to your bookmarks');
}

function renderBookmarks() {
  $('#bookmarks-content').innerHTML = state.bookmarks.length ? `<p class="dialog-description">A few words to come back to. Saved in this browser.</p><div class="bookmark-list">${state.bookmarks.map(b => {
    const s = surahs[b.surah - 1], a = s.ayahs.find(a => a.ayah === b.ayah);
    return `<div class="bookmark-card"><button class="bookmark-open" data-reference="${b.surah}:${b.ayah}"><span class="result-label">${escape(s.name)} <span>${b.surah}:${b.ayah}</span></span><span class="result-arabic" lang="ar" dir="rtl">${escape(displayText(a.text))}</span></button><button class="icon-button remove-bookmark" data-remove="${b.surah}:${b.ayah}" aria-label="Remove bookmark ${b.surah}:${b.ayah}">${icon('close')}</button></div>`;
  }).join('')}</div>` : `<div class="empty-state">${icon('bookmark')}<h3>A place for what stays with you.</h3><p>Select an ayah while reading, then choose Bookmark.<br>Your saved ayahs will be waiting here.</p><button class="primary-button" data-close="bookmarks-dialog">Return to reading ${icon('arrow')}</button></div>`;
}

function showSearchResults() {
  const raw = $('#quran-search').value.trim();
  const query = normalizeSearch(raw);
  if (!query) {
    $('#search-results').innerHTML = `<p class="search-hint">Search by name, number, or a few words in Arabic.</p><span class="eyebrow popular-label">A PLACE TO BEGIN</span><div class="popular-surahs">${[1, 18, 36, 55, 67, 112].map(id => `<button data-reference="${id}:1">${surahs[id - 1].name}${icon('arrow')}</button>`).join('')}</div><p class="numbering-note">References use Qālūn’s Last Madani numbering.</p>`;
    return;
  }
  const reference = /^(\d+)\s*:\s*(\d+)$/.exec(raw);
  const matchingSurahs = surahs.filter(s => normalizeSearch(`${s.name} ${s.arabic} ${s.meaning}`).includes(query) || String(s.id) === raw);
  const allMatches = reference ? searchIndex.filter(a => a.surah === +reference[1] && a.ayah === +reference[2]) : /[\u0600-\u08ff]/.test(query) && query.length >= 2 ? searchIndex.filter(a => a.normalized.includes(query)) : [];
  const matches = allMatches.slice(0, 50);
  $('#search-results').innerHTML = `${matchingSurahs.length ? `<div class="result-section-title">SURAHS <span>${matchingSurahs.length}</span></div>${matchingSurahs.map(s => `<button class="surah-result" data-reference="${s.id}:1"><span class="surah-number">${String(s.id).padStart(2, '0')}</span><span><strong>${escape(s.name)}</strong><small>${escape(s.meaning)} · ${s.count} ayahs</small></span><span class="surah-arabic" lang="ar" dir="rtl">${s.arabic}</span>${icon('arrow')}</button>`).join('')}` : ''}${matches.length ? `<div class="result-section-title">AYAHS <span>${allMatches.length}${allMatches.length > 50 ? ' · showing first 50' : ''}</span></div>${matches.map(a => `<button class="ayah-result" data-reference="${a.surah}:${a.ayah}"><span class="result-label">${escape(surahs[a.surah - 1].name)}<span>${a.surah}:${a.ayah}</span></span><span class="result-arabic" dir="rtl" lang="ar">${escape(displayText(a.text))}</span></button>`).join('')}` : ''}${!matches.length && !matchingSurahs.length ? `<div class="empty-state">${icon('search')}<h3>No results just yet.</h3><p>Try a surah name, Arabic words, or a reference like 1:2.<br>Ayah numbers follow the Qālūn narration.</p></div>` : ''}`;
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
  catch { toast('Copy is unavailable in this browser. Please select and copy the text.'); }
}

function bindEvents() {
  document.addEventListener('click', event => {
    const button = event.target.closest('button');
    const ayah = event.target.closest('[data-ayah]');
    if (ayah) { selectAyah(Number(ayah.dataset.ayah)); return; }
    if (!button) return;
    if (button.dataset.close) { $(`#${button.dataset.close}`).close(); return; }
    if (button.dataset.surah) { openSurah(Number(button.dataset.surah)); return; }
    if (button.dataset.go) { openSurah(Number(button.dataset.go)); return; }
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
      case 'read': $('#reader').scrollIntoView({ behavior: 'smooth' }); break;
      case 'bookmarks': showDialog('bookmarks-dialog'); break;
      case 'about': showDialog('about-dialog'); break;
      case 'search': showDialog('search-dialog'); break;
      case 'theme':
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.dataset.theme = state.theme;
        button.innerHTML = icon(state.theme === 'light' ? 'moon' : 'sun');
        button.setAttribute('aria-label', `Switch to ${state.theme === 'light' ? 'dark' : 'light'} theme`);
        persist(); break;
      case 'menu':
        $('#sidebar').classList.add('open'); $('.sidebar-overlay').hidden = false;
        button.setAttribute('aria-expanded', 'true'); document.body.classList.add('menu-open');
        $('#surah-search').focus(); break;
      case 'close-menu': closeMenu(); break;
      case 'resume': openSurah(state.lastRead.surah, state.lastRead.ayah); break;
      case 'smaller': case 'larger':
        state.fontSize = Math.max(28, Math.min(52, state.fontSize + (button.dataset.action === 'larger' ? 4 : -4)));
        document.documentElement.style.setProperty('--quran-size', `${state.fontSize}px`);
        updateFontControls(); persist(); break;
      case 'save-ayah': if (state.selected) toggleBookmark(state.surah, state.selected); break;
      case 'copy-ayah': {
        if (!state.selected) break;
        const a = surahs[state.surah - 1].ayahs.find(a => a.ayah === state.selected);
        copyText(`${displayText(a.text)}\n[${surahs[state.surah - 1].name} ${state.surah}:${state.selected} · Qālūn ʿan Nāfiʿ]`, 'Ayah copied');
        break;
      }
      case 'share-ayah': if (state.selected) copyText(`${location.href.split('#')[0]}#${state.surah}:${state.selected}`, 'Ayah link copied'); break;
      case 'deselect': deselectAyah(); break;
    }
  });
  $('#surah-search').addEventListener('input', event => { state.query = event.target.value; renderSidebar(); });
  $('#quran-search').addEventListener('input', showSearchResults);
  $('#ayah-select').addEventListener('change', event => jumpToAyah(Number(event.target.value)));
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { event.preventDefault(); showDialog('search-dialog'); }
    if (event.key === 'Escape') { deselectAyah(); closeMenu(); }
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('[data-ayah]')) { event.preventDefault(); selectAyah(Number(event.target.dataset.ayah)); }
  });
  window.addEventListener('hashchange', () => {
    const ref = parseReference(location.hash, surahs);
    if (ref) openSurah(ref.surah, ref.ayah);
  });
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  }));
}

init();
