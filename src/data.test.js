import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makeSurahs, normalizeSearch, displayText, parseReference } from './data.js';

const data = JSON.parse(readFileSync(new URL('../quran-qalun-rasm_uthmani.json', import.meta.url), 'utf8'));
const surahs = makeSurahs(data.ayahs);

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
