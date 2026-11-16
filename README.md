# Qaloon

A responsive Quran reader built from the supplied `quran-qalun-rasm_uthmani.json`. Vanilla JavaScript and CSS, with Vite for local development and production builds.

## Run locally

Requires Node.js 20.19+ or 22.12+.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. To create and preview a production build:

```sh
npm run build
npm run preview
```

Deploy the generated `dist/` directory to any static web host. The JSON and fonts are bundled locally; reading does not require a Quran API or Google Fonts.

## Reading

- **English / العربية:** switch interface language from the header. Arabic uses a full RTL layout, translated controls and dialogs, and Arabic surah names. Your language choice is saved in this browser.
- All 114 surahs and 6,214 numbered ayahs, using the supplied Qālūn narration and Last Madani numbering.
- **By surah / By page:** switch between full chapters and the edition's 604 pages. Page view follows source line breaks, with a header and basmalah at each surah opening (except At-Tawbah, which has no opening basmalah).
- Turn pages with the previous/next buttons above or below the text, or enter a page number (1–604) and press Enter or Go. Page numbers and search references accept Western, Arabic-Indic, and Eastern Arabic-Indic digits. Page links such as `#page/604` open directly in page view.
- Continuous reading and ayah-by-ayah layouts, adjustable Arabic text size, and light/dark themes.
- Filter surahs by English or Arabic name, meaning, or number. The header search (keyboard shortcut `/`) also searches Arabic Quran text and references such as `112:2`.
- Select an ayah to bookmark it, copy its text, or copy a direct link.
- Bookmarks, reading position, layout, font size, theme, and language persist in this browser's local storage. They do not sync across browsers or devices.
- Mobile surah navigation is available from the menu button.

## Text integrity and sources

The original JSON is unchanged. Surah ayah counts are derived from its records, rather than from another narration. Its unnumbered opening basmalah is treated separately; an opening basmalah is displayed before every surah except At-Tawbah. Surah view renders embedded line breaks as spaces. Page view groups text using each ayah's starting `page` and `line`, then its embedded line breaks. Four ayahs cross a 15-line page boundary; their remaining lines continue on the next page, with the ayah ornament only at the end. Pages containing several surahs retain all of their chapter headers. On narrow screens, source lines may wrap for legibility.

Trailing Latin number markers are rendered as separate Arabic-Indic ayah ornaments. Quran letters and recitation marks are preserved. Search normalization affects a separate index only. Bookmarks and copied text always refer to the full ayah, including when selecting a fragment in page view.

The data identifies its source as the King Fahd Glorious Quran Printing Complex's `UthmanicQaloun-v-3.0.zip`, via [Quran.ws](https://text.quran.ws/). The matching `UthmanicQaloun-v-3.0.ttf` is bundled from the [source repository](https://github.com/quran-ws/quran-text/tree/main/data/fonts). See the [Qālūn font publisher](https://fonts.qurancomplex.gov.sa/qaloun-reading/) for original terms. The JSON states: “The text is the King Fahd Glorious Qur'an Printing Complex's (KFGQPC); redistribution is subject to their terms.” Text and font rights remain with their owners.

Navigation labels include conventional surah transliterations and English title meanings. There is no verse translation or audio in the supplied data.

Interface fonts: Cormorant Garamond and DM Sans, under the SIL Open Font License. License files are in `public/fonts/`.

## Verification

```sh
npm test
npm run build
```

Tests check completeness, Qālūn numbering, basmalah handling, Arabic search normalization, and font coverage for every Quran character in the source. Page tests reconstruct all 6,214 ayahs to verify text preservation, chapter openings, cross-page continuations, and page-link validation. Browser checks cover both display options, page navigation, search, bookmarks and persistence, reading settings, deep links, mobile navigation, language switching and persistence, RTL layout and arrows, Arabic-digit navigation, and responsive overflow.
