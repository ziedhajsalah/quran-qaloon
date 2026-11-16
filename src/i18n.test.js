import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { arabicMessages, translate, languageDirection, localizeNumber, normalizeDigits, ayahCount } from './i18n.js';
import { normalizeSearch } from './data.js';

test('every interface message has Arabic text and preserves its interpolation fields', () => {
  const source = readFileSync(new URL('./main.js', import.meta.url), 'utf8');
  const messages = [...source.matchAll(/\bt\(("([^"\\]|\\.)*"|'([^'\\]|\\.)*')/g)]
    .map(match => match[1].startsWith('"') ? JSON.parse(match[1]) : match[1].slice(1, -1));
  const fields = message => [...message.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
  for (const message of messages) assert.ok(arabicMessages[message], `Missing Arabic: ${message}`);
  for (const [english, arabic] of Object.entries(arabicMessages)) {
    assert.match(arabic, /[\u0600-\u06ff]/);
    assert.deepEqual(fields(arabic), fields(english), english);
  }
});

test('localized references preserve their surah, ayah and page values', () => {
  assert.equal(translate('ar', 'Page {number} of {count}', { number: localizeNumber('ar', 106), count: localizeNumber('ar', 604) }), 'الصفحة ١٠٦ من ٦٠٤');
  assert.equal(translate('en', 'Page {number} of {count}', { number: 106, count: 604 }), 'Page 106 of 604');
  assert.equal(languageDirection('ar'), 'rtl');
  assert.equal(languageDirection('en'), 'ltr');
  assert.equal(translate('ar', 'Publisher credit'), 'Publisher credit');
});

test('search and page entry accept both Arabic numeral sets without changing references', () => {
  for (const value of ['112:2', '١١٢:٢', '۱۱۲:۲']) assert.equal(normalizeDigits(value), '112:2');
  assert.equal(normalizeSearch('سورة ١١٢'), normalizeSearch('سورة 112'));
  assert.equal(normalizeDigits(localizeNumber('ar', 604)), '604');
  assert.equal(localizeNumber('en', '01'), '01');
});

test('Arabic ayah counts use the appropriate singular, dual and plural forms', () => {
  assert.equal(ayahCount('ar', 1), 'آية واحدة');
  assert.equal(ayahCount('ar', 2), 'آيتان');
  assert.equal(ayahCount('ar', 7), '٧ آيات');
  assert.equal(ayahCount('ar', 285), '٢٨٥ آية');
  assert.equal(ayahCount('en', 285), '285 ayahs');
});
