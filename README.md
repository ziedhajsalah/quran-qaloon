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

- All 114 surahs and 6,214 numbered ayahs, using the supplied Qālūn narration and Last Madani numbering.
- Continuous reading and ayah-by-ayah layouts, adjustable Arabic text size, and light/dark themes.
- Filter surahs by English or Arabic name, meaning, or number. The header search (keyboard shortcut `/`) also searches Arabic Quran text and references such as `112:2`.
- Select an ayah to bookmark it, copy its text, or copy a direct link.
- Bookmarks, reading position, layout, font size, and theme persist in this browser's local storage. They do not sync across browsers or devices.
- Mobile surah navigation is available from the menu button.

## Text integrity and sources

The original JSON is unchanged. Surah ayah counts are derived from its records, rather than from another narration. Its unnumbered opening basmalah is treated separately; an opening basmalah is displayed before every surah except At-Tawbah. Rendering replaces literal `\n` layout hints with spaces and replaces trailing Latin number markers with separate Arabic-Indic ayah ornaments. Quran letters and recitation marks are preserved. Search normalization affects a separate index only.

The data identifies its source as the King Fahd Glorious Quran Printing Complex's `UthmanicQaloun-v-3.0.zip`, via [Quran.ws](https://text.quran.ws/). The matching `UthmanicQaloun-v-3.0.ttf` is bundled from the [source repository](https://github.com/quran-ws/quran-text/tree/main/data/fonts). See the [Qālūn font publisher](https://fonts.qurancomplex.gov.sa/qaloun-reading/) for original terms. The JSON states: “The text is the King Fahd Glorious Qur'an Printing Complex's (KFGQPC); redistribution is subject to their terms.” Text and font rights remain with their owners.

Navigation labels include conventional surah transliterations and English title meanings. There is no verse translation or audio in the supplied data.

Interface fonts: Cormorant Garamond and DM Sans, under the SIL Open Font License. License files are in `public/fonts/`.

## Verification

```sh
npm test
npm run build
```

Tests check completeness, Qālūn numbering, basmalah handling, Arabic search normalization, and font coverage for every Quran character in the source. Browser checks cover navigation, search, bookmarks and persistence, reading settings, deep links, mobile navigation, and responsive overflow.
