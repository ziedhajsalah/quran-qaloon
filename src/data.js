// Names are navigation labels. Quran text and Qālūn ayah counts come only from the supplied JSON.
const names = `Al-Fatihah|الفاتحة|The Opening
Al-Baqarah|البقرة|The Cow
Ali 'Imran|آل عمران|Family of Imran
An-Nisa|النساء|The Women
Al-Ma'idah|المائدة|The Table Spread
Al-An'am|الأنعام|The Cattle
Al-A'raf|الأعراف|The Heights
Al-Anfal|الأنفال|The Spoils of War
At-Tawbah|التوبة|The Repentance
Yunus|يونس|Jonah
Hud|هود|Hud
Yusuf|يوسف|Joseph
Ar-Ra'd|الرعد|The Thunder
Ibrahim|إبراهيم|Abraham
Al-Hijr|الحجر|The Rocky Tract
An-Nahl|النحل|The Bee
Al-Isra|الإسراء|The Night Journey
Al-Kahf|الكهف|The Cave
Maryam|مريم|Mary
Ta-Ha|طه|Ta-Ha
Al-Anbya|الأنبياء|The Prophets
Al-Hajj|الحج|The Pilgrimage
Al-Mu'minun|المؤمنون|The Believers
An-Nur|النور|The Light
Al-Furqan|الفرقان|The Criterion
Ash-Shu'ara|الشعراء|The Poets
An-Naml|النمل|The Ant
Al-Qasas|القصص|The Stories
Al-'Ankabut|العنكبوت|The Spider
Ar-Rum|الروم|The Romans
Luqman|لقمان|Luqman
As-Sajdah|السجدة|The Prostration
Al-Ahzab|الأحزاب|The Combined Forces
Saba|سبأ|Sheba
Fatir|فاطر|The Originator
Ya-Sin|يس|Ya-Sin
As-Saffat|الصافات|Those Ranged in Ranks
Sad|ص|Sad
Az-Zumar|الزمر|The Groups
Ghafir|غافر|The Forgiver
Fussilat|فصلت|Explained in Detail
Ash-Shuraa|الشورى|The Consultation
Az-Zukhruf|الزخرف|The Ornaments of Gold
Ad-Dukhan|الدخان|The Smoke
Al-Jathiyah|الجاثية|The Kneeling
Al-Ahqaf|الأحقاف|The Wind-Curved Sandhills
Muhammad|محمد|Muhammad
Al-Fath|الفتح|The Victory
Al-Hujurat|الحجرات|The Rooms
Qaf|ق|Qaf
Adh-Dhariyat|الذاريات|The Winnowing Winds
At-Tur|الطور|The Mount
An-Najm|النجم|The Star
Al-Qamar|القمر|The Moon
Ar-Rahman|الرحمن|The Most Merciful
Al-Waqi'ah|الواقعة|The Inevitable
Al-Hadid|الحديد|The Iron
Al-Mujadilah|المجادلة|The Pleading Woman
Al-Hashr|الحشر|The Exile
Al-Mumtahanah|الممتحنة|She Who Is Examined
As-Saf|الصف|The Ranks
Al-Jumu'ah|الجمعة|The Congregation
Al-Munafiqun|المنافقون|The Hypocrites
At-Taghabun|التغابن|The Mutual Disillusion
At-Talaq|الطلاق|The Divorce
At-Tahrim|التحريم|The Prohibition
Al-Mulk|الملك|The Sovereignty
Al-Qalam|القلم|The Pen
Al-Haqqah|الحاقة|The Reality
Al-Ma'arij|المعارج|The Ascending Stairways
Nuh|نوح|Noah
Al-Jinn|الجن|The Jinn
Al-Muzzammil|المزمل|The Enshrouded One
Al-Muddaththir|المدثر|The Cloaked One
Al-Qiyamah|القيامة|The Resurrection
Al-Insan|الإنسان|The Human
Al-Mursalat|المرسلات|The Emissaries
An-Naba|النبأ|The Tidings
An-Nazi'at|النازعات|Those Who Pull Out
'Abasa|عبس|He Frowned
At-Takwir|التكوير|The Overthrowing
Al-Infitar|الانفطار|The Cleaving
Al-Mutaffifin|المطففين|The Defrauding
Al-Inshiqaq|الانشقاق|The Splitting Open
Al-Buruj|البروج|The Constellations
At-Tariq|الطارق|The Nightcomer
Al-A'la|الأعلى|The Most High
Al-Ghashiyah|الغاشية|The Overwhelming
Al-Fajr|الفجر|The Dawn
Al-Balad|البلد|The City
Ash-Shams|الشمس|The Sun
Al-Layl|الليل|The Night
Ad-Duhaa|الضحى|The Morning Hours
Ash-Sharh|الشرح|The Relief
At-Tin|التين|The Fig
Al-'Alaq|العلق|The Clot
Al-Qadr|القدر|The Power
Al-Bayyinah|البينة|The Clear Proof
Az-Zalzalah|الزلزلة|The Earthquake
Al-'Adiyat|العاديات|The Courser
Al-Qari'ah|القارعة|The Calamity
At-Takathur|التكاثر|The Rivalry in Increase
Al-'Asr|العصر|The Declining Day
Al-Humazah|الهمزة|The Slanderer
Al-Fil|الفيل|The Elephant
Quraysh|قريش|Quraysh
Al-Ma'un|الماعون|The Small Kindnesses
Al-Kawthar|الكوثر|The Abundance
Al-Kafirun|الكافرون|The Disbelievers
An-Nasr|النصر|The Divine Support
Al-Masad|المسد|The Palm Fiber
Al-Ikhlas|الإخلاص|The Sincerity
Al-Falaq|الفلق|The Daybreak
An-Nas|الناس|Mankind`;

export const surahNames = names.split('\n').map((row, i) => {
  const [name, arabic, meaning] = row.split('|');
  return { id: i + 1, name, arabic, meaning };
});

// Only normalize the search index; never normalize the displayed Quran text.
export function normalizeSearch(text) {
  return text.normalize('NFKD').replace(/[\u0870-\u0882]/g, 'ا')
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0887-\u0888\u08d3-\u08ff]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .replace(/ـ/g, '').replace(/[’'ʿʾ-]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function displayText(text) {
  return text.replace(/\\n|\r?\n/g, ' ').replace(/\s*\(\d+\)\s*$/, '').trim();
}

export function makePages(records) {
  const pages = [];
  // This edition has 15 text lines per full page. The record's page/line
  // identify its start; embedded newlines can carry an ayah onto the next page.
  for (const ayah of records) {
    if (ayah.ayah === 0) continue; // The basmalah belongs in the surah header.
    const parts = ayah.text.replace(/\s*\(\d+\)\s*$/, '').split(/\\n|\r?\n/);
    parts.forEach((text, part) => {
      const offset = ayah.line - 1 + part;
      const number = ayah.page + Math.floor(offset / 15);
      const lineNumber = offset % 15 + 1;
      const page = pages[number - 1] ??= { number, sections: [] };
      let section = page.sections.at(-1);
      if (section?.surah !== ayah.surah) {
        section = { surah: ayah.surah, startsSurah: ayah.ayah === 1 && part === 0, lines: [] };
        page.sections.push(section);
      }
      let line = section.lines.at(-1);
      if (line?.number !== lineNumber) {
        line = { number: lineNumber, fragments: [] };
        section.lines.push(line);
      }
      line.fragments.push({ surah: ayah.surah, ayah: ayah.ayah, text: text.trim(), part, end: part === parts.length - 1 });
    });
  }
  return pages;
}

export function pageAyahs(page) {
  const seen = new Set();
  return page.sections.flatMap(section => section.lines.flatMap(line => line.fragments)).filter(fragment => {
    const key = `${fragment.surah}:${fragment.ayah}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function parsePageReference(hash, pages) {
  const match = /^#page\/(\d+)(?:\/(\d+):(\d+))?$/.exec(hash);
  if (!match) return null;
  const page = pages[Number(match[1]) - 1];
  if (!page) return null;
  const ayahs = pageAyahs(page);
  const reference = match[2] ? ayahs.find(a => a.surah === Number(match[2]) && a.ayah === Number(match[3])) : ayahs[0];
  return reference ? { page: page.number, surah: reference.surah, ayah: reference.ayah } : null;
}

export function makeSurahs(records) {
  return surahNames.map(surah => {
    const ayahs = records.filter(a => a.surah === surah.id && a.ayah > 0);
    return { ...surah, ayahs, count: ayahs.length, page: ayahs[0].page };
  });
}

export function parseReference(hash, surahs) {
  const match = /^#(\d+)(?::(\d+))?$/.exec(hash);
  if (!match) return null;
  const surah = surahs[Number(match[1]) - 1];
  const ayah = Number(match[2] || 1);
  return surah && surah.ayahs.some(a => a.ayah === ayah) ? { surah: surah.id, ayah } : null;
}
