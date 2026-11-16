import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeSurahs, makePages, pageAyahs, normalizeSearch, displayText, parseReference, parsePageReference } from './data.js';

const data = JSON.parse(readFileSync(new URL('../quran-qalun-rasm_uthmani.json', import.meta.url), 'utf8'));
const surahs = makeSurahs(data.ayahs);
const pages = makePages(data.ayahs);

test('page layout preserves every ayah, letter, and mark across all 604 pages', () => {
  assert.deepEqual(pages.map(p => p.number), Array.from({ length: 604 }, (_, i) => i + 1));
  const reconstructed = new Map();
  let markers = 0;
  for (const page of pages) {
    for (const section of page.sections) {
      for (const line of section.lines) {
        assert.ok(line.number >= 1 && line.number <= 15);
        for (const fragment of line.fragments) {
          const key = `${fragment.surah}:${fragment.ayah}`;
          reconstructed.set(key, [...(reconstructed.get(key) || []), fragment.text]);
          if (fragment.end) markers++;
        }
      }
    }
  }
  assert.equal(reconstructed.size, 6214);
  assert.equal(markers, 6214);
  for (const a of data.ayahs.filter(a => a.ayah > 0)) {
    assert.equal(reconstructed.get(`${a.surah}:${a.ayah}`).join(' ').replace(/\s+/g, ' '), displayText(a.text).replace(/\s+/g, ' '), `Text preserved for ${a.surah}:${a.ayah}`);
  }
});

test('page sections include each surah opening once, including multiple surahs on one page', () => {
  const openings = pages.flatMap(p => p.sections.filter(s => s.startsSurah).map(s => s.surah));
  assert.deepEqual(openings, Array.from({ length: 114 }, (_, i) => i + 1));
  assert.deepEqual(pages[603].sections.map(s => s.surah), [112, 113, 114]);
  assert.deepEqual(pages[105].sections.map(s => [s.surah, s.startsSurah]), [[4, false], [5, true]]);
  assert.deepEqual(pages[0].sections[0].lines.map(l => l.number), [2, 3, 4, 5, 6, 7]);
});

test('ayahs spanning pages continue on the next page, with the marker only at their end', () => {
  for (const [surah, ayah, page] of [[4, 44, 85], [20, 86, 317], [24, 36, 354], [24, 42, 355]]) {
    const fragments = number => pages[number - 1].sections.flatMap(s => s.lines.flatMap(l => l.fragments)).filter(f => f.surah === surah && f.ayah === ayah);
    assert.ok(fragments(page).length > 0);
    assert.ok(fragments(page).every(f => !f.end));
    assert.ok(fragments(page + 1).at(-1).end);
    assert.ok(pageAyahs(pages[page]).some(a => a.surah === surah && a.ayah === ayah));
  }
});

test('page deep links validate page numbers and references, including continued ayahs', () => {
  assert.deepEqual(parsePageReference('#page/604', pages), { page: 604, surah: 112, ayah: 1 });
  assert.deepEqual(parsePageReference('#page/604/114:6', pages), { page: 604, surah: 114, ayah: 6 });
  assert.deepEqual(parsePageReference('#page/86/4:44', pages), { page: 86, surah: 4, ayah: 44 });
  for (const ref of ['#page/0', '#page/605', '#page/1.5', '#page/604/1:1', '#page/604/114:7', '#page/85/4:45', '#page/1/1:0']) assert.equal(parsePageReference(ref, pages), null);
});

test('the full supplied Qālūn Quran is available with its own numbering', () => {
  assert.equal(surahs.length, 114);
  assert.equal(surahs.reduce((count, s) => count + s.count, 0), data.meta.edition.ayah_count);
  assert.equal(data.meta.edition.ayah_count, 6214);
  assert.equal(surahs[1].count, 285);
  for (const s of surahs) {
    assert.ok(s.arabic && s.name && s.count);
    assert.deepEqual(s.ayahs.map(a => a.ayah), Array.from({ length: s.count }, (_, i) => i + 1));
  }
});

test('the source basmalah is unnumbered and not counted as Al-Fatihah ayah 1', () => {
  assert.equal(data.ayahs.filter(a => a.ayah === 0).length, 1);
  assert.equal(surahs[0].count, 7);
  assert.match(normalizeSearch(surahs[0].ayahs[0].text), /^الحمد/);
});

test('Arabic search matches Qālūn letters and marks without mutating the source', () => {
  const source = surahs[0].ayahs[0].text;
  assert.ok(normalizeSearch(source).includes(normalizeSearch('الحمد لله')));
  const formatted = displayText(surahs[0].ayahs[1].text);
  assert.ok(!formatted.includes('\\n'));
  assert.ok(!formatted.includes('\n'));
  assert.ok(!formatted.includes('(2)'));
  assert.equal(displayText('نَصٌّ (داخل) (٢) (123)'), 'نَصٌّ (داخل) (٢)');
  assert.equal(surahs[0].ayahs[0].text, source);
});

test('deep links respect Qālūn surah and ayah boundaries', () => {
  assert.deepEqual(parseReference('#2:285', surahs), { surah: 2, ayah: 285 });
  assert.deepEqual(parseReference('#114:6', surahs), { surah: 114, ayah: 6 });
  for (const ref of ['#2:286', '#1:0', '#115:1', '#0:1', '#1:8', '#foo', '#1:1:2']) assert.equal(parseReference(ref, surahs), null);
});

test('the bundled Qālūn font covers every Quran letter and mark in the supplied text', () => {
  const font = readFileSync(new URL('../public/fonts/UthmanicQaloun-v-3.0.ttf', import.meta.url));
  let cmap;
  for (let i = 0; i < font.readUInt16BE(4); i++) {
    const offset = 12 + i * 16;
    if (font.toString('ascii', offset, offset + 4) === 'cmap') cmap = font.readUInt32BE(offset + 8);
  }
  assert.ok(cmap, 'Font has a character map');
  const maps = [];
  for (let i = 0; i < font.readUInt16BE(cmap + 2); i++) {
    const record = cmap + 4 + i * 8;
    const platform = font.readUInt16BE(record);
    if (platform === 0 || platform === 3) maps.push(cmap + font.readUInt32BE(record + 4));
  }
  function hasGlyph(code) {
    return maps.some(base => {
      const format = font.readUInt16BE(base);
      if (format === 4 && code <= 0xffff) {
        const n = font.readUInt16BE(base + 6) / 2;
        for (let i = 0; i < n; i++) {
          if (code > font.readUInt16BE(base + 14 + i * 2)) continue;
          if (code < font.readUInt16BE(base + 16 + n * 2 + i * 2)) return false;
          const delta = font.readInt16BE(base + 16 + n * 4 + i * 2);
          const rangeAddress = base + 16 + n * 6 + i * 2;
          const range = font.readUInt16BE(rangeAddress);
          if (!range) return ((code + delta) & 0xffff) !== 0;
          const start = font.readUInt16BE(base + 16 + n * 2 + i * 2);
          const glyph = font.readUInt16BE(rangeAddress + range + (code - start) * 2);
          return glyph !== 0 && ((glyph + delta) & 0xffff) !== 0;
        }
      } else if (format === 12) {
        for (let i = 0; i < font.readUInt32BE(base + 12); i++) {
          const group = base + 16 + i * 12;
          const start = font.readUInt32BE(group);
          if (code >= start && code <= font.readUInt32BE(group + 4)) return font.readUInt32BE(group + 8) + code - start !== 0;
        }
      }
      return false;
    });
  }
  const chars = new Set(data.ayahs.map(a => displayText(a.text)).join(''));
  const missing = [...chars].filter(c => !/\s/.test(c) && !hasGlyph(c.codePointAt(0)));
  assert.deepEqual(missing.map(c => `U+${c.codePointAt(0).toString(16).toUpperCase()}`), []);
});
