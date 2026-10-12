/* Reine Hilfsfunktionen: Antworten prüfen und erkannten Text in Vokabelpaare zerlegen.
   Läuft im Browser (globale Funktionen) und in Node (für die Tests). */
'use strict';

const ARTICLES = /^(the|a|an|der|die|das|den|dem|des|ein|eine|einen)\s+/;

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/[’‘`´]/g, "'")
    .replace(/[.!?¡¿,;:"„“”«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Alle akzeptierten Schreibweisen einer Lösung, z. B. "(to) go, walk" -> ["to go", "go", "walk", ...]
function acceptedForms(target) {
  const raw = String(target || '');
  const pieces = [raw, ...raw.split(/[,;/|]/)];
  const forms = new Set();
  for (const p of pieces) {
    const withParens = normalize(p.replace(/[()[\]]/g, ''));
    const withoutParens = normalize(p.replace(/\(.*?\)|\[.*?\]/g, ' '));
    for (const f of [withParens, withoutParens]) {
      if (!f) continue;
      forms.add(f);
      forms.add(f.replace(/^to /, ''));
      forms.add(f.replace(ARTICLES, ''));
    }
  }
  forms.delete('');
  return [...forms];
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

// Ergebnis: 'correct' | 'typo' | 'wrong'
// lenient: nachsichtiger bei Tippfehlern (Einstellung „Leichter tippen“, z. B. bei Lese-Rechtschreib-Schwäche)
function checkAnswer(input, target, { lenient = false } = {}) {
  const given = normalize(input);
  if (!given) return 'wrong';
  // Eingaben mit Klammern wie „all (the)“ oder „(to) learn“ genauso behandeln wie die Lösung
  const bases = [given, normalize(given.replace(/[()[\]]/g, '')), normalize(given.replace(/\(.*?\)|\[.*?\]/g, ' '))].filter(Boolean);
  const candidates = new Set(bases.flatMap(g => [g, g.replace(/^to /, ''), g.replace(ARTICLES, '')]));
  const forms = acceptedForms(target);
  for (const c of candidates) if (forms.includes(c)) return 'correct';
  for (const c of candidates) {
    for (const f of forms) {
      const d = levenshtein(c, f);
      if (f.length >= (lenient ? 3 : 5) && d <= 1) return 'typo';
      if (f.length >= (lenient ? 6 : 10) && d <= 2) return 'typo';
      if (lenient && f.length >= 10 && d <= 3) return 'typo';
    }
  }
  return 'wrong';
}

// Trenner zwischen Englisch und Deutsch, in dieser Reihenfolge ausprobiert.
const SEPARATORS = [/\t+/, /\s+[–—-]+\s+/, /\s*=+\s*/, /\s*;\s*/, /\s+:\s+|:\s+/, /\s{2,}/];

function cleanOcr(s) {
  return s.replace(/^[\s•·*▪►>|_]+/, '').replace(/[\s|_]+$/, '').replace(/\s+/g, ' ').trim();
}

// Zerlegt eine Zeile in {en, de}. Ohne erkennbaren Trenner landet alles in "en".
function splitLine(line) {
  // Lautschrift in eckigen Klammern wird zum Spaltentrenner.
  const text = line.replace(/ /g, ' ').replace(/\s*\[[^\]]*\]\s*/g, '   ').trim();
  for (const sep of SEPARATORS) {
    const parts = text.split(sep).map(cleanOcr).filter(Boolean);
    if (parts.length >= 2) {
      const en = cleanEnglish(parts[0]) || parts[0];
      // Bei drei Spalten ist eine davon ein englischer Beispielsatz – der enthält meist das Wort selbst.
      const head = normalize(en).replace(/^\(?to\)? /, '').split(' ')[0];
      const de = parts.slice(1).find(p => !normalize(p).includes(head)) || parts[1];
      return { en, de };
    }
  }
  return { en: cleanOcr(text), de: '' };
}

function parseVocabText(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.replace(/[^\p{L}]/gu, '').length >= 2)
    .map(splitLine)
    .filter(p => p.en || p.de);
}

/* ---------- Schulbuch-Vokabelseiten ----------
   Beispiel Lighthouse (Cornelsen): | people ['pi:pl] | Leute, Menschen | The people in Plymouth are nice. | */

const IPA_CHARS = /[ˈˌːʌəɪʊæɒɔθðŋʃʒɜɑ\]]/;

// Gehört ein Wort zur Lautschrift (oder ist es OCR-Müll davon)?
function isPhonetic(token) {
  if (/^\([a-z]+\)[.,]?$/i.test(token)) return false; // "(to)", "(the)" sind echte Wörter
  if (/^[[(|/{‘'’`´"“]/.test(token)) return true;
  if (/^[LlI1|][’'‘]/.test(token)) return true; // "[’" wird oft als "L’" gelesen
  return IPA_CHARS.test(token);
}

function cleanEnglish(text) {
  const tokens = String(text).replace(/^p\.?\s?\d+\s+/i, '').split(/\s+/).filter(Boolean);
  // Einzelne Zeichen vorne sind meist Reste vom Rand („J Look at …“) – außer „I“ und „a“
  while (tokens.length > 1 && /^[^\sIAa]$/.test(tokens[0])) tokens.shift();
  const out = [];
  for (const t of tokens) {
    if (isPhonetic(t)) break; // ab der Lautschrift ist der Rest egal
    out.push(t);
  }
  return cleanOcr(out.join(' ')).replace(/[,;:]+$/, '');
}

const letterCount = s => (String(s).match(/\p{L}/gu) || []).length;
const looksLikeText = s => letterCount(s) >= 2 && letterCount(s) / String(s).replace(/\s/g, '').length >= 0.6;
const median = arr => {
  if (!arr.length) return 0;
  const a = [...arr].sort((x, y) => x - y);
  return a[Math.floor(a.length / 2)];
};

/* ---------- Spalten getrennt erkannt: Englisch und Deutsch wieder zu Paaren zusammensetzen ----------
   Jede Spalte wird für sich (mit passender Sprache) gelesen. Zeilen tragen ihre Lage im Foto:
   {text, x0, y0, x1, y1, bl: {x0, y0, x1, y1}} – bl ist die Grundlinie. Weil Fotos fast nie ganz gerade sind,
   wird die Schräglage aus den Grundlinien geschätzt und jede Zeile auf eine gemeinsame senkrechte Linie projiziert. */

// Häufige Lesefehler in deutschen Übersetzungen ausbessern
function cleanGerman(text) {
  let s = cleanOcr(String(text).replace(/ /g, ' '));
  s = s.replace(/\s*\[[^\]]*\]?\s*/g, ' ');                       // versehentlich mitgelesene Lautschrift
  s = s.replace(/\.\s+(?=\p{Ll})/gu, ', ');                       // "anfangen. beginnen" → "anfangen, beginnen"
  if (s.includes('(') && !s.includes(')')) s = s.replace(/-[J\]|}l1](?=\p{Lu})/u, '-)'); // "(Groß-JStadt"
  s = s.replace(/\s+-\)/g, '-)');                                  // "(Groß -)Stadt"
  s = s.replace(/\ber\/(s[a-z]{1,4}\/es|sie[rt]es)\b/g, 'er/sie/es');  // "er/ste/es", "er/sieres"
  s = s.replace(/^[^\p{L}(]+/u, '').replace(/[\s,;:|_\-–—]+$/u, '');
  return s.replace(/\s+/g, ' ').trim();
}

// Zahlenkästen, Seitenzahlen und Bildreste („ME Un SO A nl“) aussortieren
function isJunkLine(raw, text, conf = 100) {
  if (!text || !looksLikeText(text) || /^\d+\s/.test(raw.trim())) return true;
  const tokens = text.split(/\s+/);
  const avgLetters = letterCount(text) / tokens.length;
  return conf < 40 && tokens.length >= 2 && avgLetters <= 2.5;
}

// Steigung der Zeilen (dy/dx) aus den Grundlinien: Median, damit einzelne Ausreißer nicht stören
function lineSlope(lines) {
  const slopes = lines
    .filter(l => l.bl && l.bl.x1 - l.bl.x0 > 2 * (l.y1 - l.y0))
    .map(l => (l.bl.y1 - l.bl.y0) / (l.bl.x1 - l.bl.x0));
  return slopes.length ? median(slopes) : 0;
}

// Jede Zeile an großen Lücken in Stücke teilen; xd ist die linke Kante, gerade gerückt (Schräglage herausgerechnet)
function lineSegments(lines, slope) {
  const wordH = median(lines.flatMap(l => (l.words || []).map(w => w.y1 - w.y0))) || 20;
  const segments = [];
  lines.forEach((l, li) => {
    let seg = null;
    for (const w of [...(l.words || [])].sort((a, b) => a.x0 - b.x0)) {
      if (!w.text || !w.text.trim()) continue;
      if (seg && w.x0 - seg.x1 <= 1.2 * wordH) {
        seg.words.push(w);
        seg.x1 = w.x1;
      } else {
        seg = { li, words: [w], x0: w.x0, x1: w.x1, xd: w.x0 + slope * (w.y0 + w.y1) / 2 };
        segments.push(seg);
      }
    }
  });
  return { segments, wordH };
}

// Stücke mit ähnlicher linker Kante bilden eine Spalte; sortiert von links nach rechts
function segmentClusters(segments, wordH) {
  const clusters = [];
  for (const s of [...segments].sort((a, b) => a.xd - b.xd)) {
    const c = clusters[clusters.length - 1];
    if (c && s.xd - c.last <= 2 * wordH) { c.segs.push(s); c.last = s.xd; } else clusters.push({ segs: [s], last: s.xd });
  }
  clusters.forEach(c => { c.lines = new Set(c.segs.map(s => s.li)).size; });
  return clusters;
}

/* Ist der Rahmen etwas zu groß, landen Teile der Nachbarspalte mit im Bild (Beispielsätze, angeschnittene Wörter).
   Behalten wird die linke Spalte mit den meisten Zeilen. */
function mainColumn(lines, slope = lineSlope(lines)) {
  const withWords = lines.filter(l => l.words && l.words.length);
  if (withWords.length < 3) return lines;
  const { segments, wordH } = lineSegments(withWords, slope);
  const clusters = segmentClusters(segments, wordH);
  const max = Math.max(...clusters.map(c => c.lines));
  const main = clusters.find(c => c.lines >= Math.max(2, 0.5 * max));
  if (!main) return lines;
  const keep = new Set(main.segs);
  return withWords.map((l, li) => {
    const words = segments.filter(s => s.li === li && keep.has(s)).flatMap(s => s.words);
    if (!words.length) return null;
    return {
      ...l, words, text: words.map(w => w.text).join(' '),
      conf: Math.min(...words.map(w => w.conf ?? 100)),
      x0: Math.min(...words.map(w => w.x0)), x1: Math.max(...words.map(w => w.x1)),
    };
  }).filter(Boolean);
}

/* Spalten für die Rahmen vorschlagen – aus einem schnellen ersten Lesedurchgang über die ganze Liste.
   Die zwei linken „großen“ Spalten (viel Text) sind Englisch und Deutsch; kleine Reste wie Seitenverweise
   am Rand und Zahlenkästen zählen nicht. Ergebnis: { en, de: {x0, y0, x1, y1}, wordH } in Bildpunkten oder null. */
function suggestColumns(lines) {
  const withWords = lines.filter(l => l.words && l.words.some(w => looksLikeText(w.text || '')));
  if (withWords.length < 3) return null;
  const slope = lineSlope(withWords);
  const { segments, wordH } = lineSegments(withWords, slope);
  const textSegs = segments.filter(sg => !/^\d+$/.test(sg.words[0].text) && sg.words.some(w => looksLikeText(w.text || '')));
  // Nah beieinander liegende Kanten gehören zur selben Spalte (eingerückte Zeilen, Lautschrift)
  const clusters = [];
  for (const sg of [...textSegs].sort((a, b) => a.xd - b.xd)) {
    const c = clusters[clusters.length - 1];
    if (c && sg.xd - c.last <= 4 * wordH) { c.segs.push(sg); c.last = sg.xd; } else clusters.push({ segs: [sg], last: sg.xd });
  }
  clusters.forEach(c => {
    c.letters = c.segs.reduce((n, sg) => n + sg.words.reduce((m, w) => m + letterCount(w.text || ''), 0), 0);
    c.lines = new Set(c.segs.map(sg => sg.li)).size;
  });
  const maxLetters = Math.max(0, ...clusters.map(c => c.letters));
  const major = clusters.filter(c => c.lines >= 3 && c.letters >= 0.2 * maxLetters);
  if (major.length < 2) return null;
  const [cEn, cDe, cNext] = major;
  // Eine Spalte endet spätestens dort, wo in derselben Zeile die nächste beginnt
  const extent = (c, next) => {
    let x1 = Math.max(...c.segs.map(sg => sg.x1));
    if (next) {
      for (const sg of c.segs) {
        const right = next.segs.filter(n => n.li === sg.li && n.x0 > sg.x0);
        if (right.length) x1 = Math.min(x1, Math.min(...right.map(n => n.x0)) - wordH * 0.4);
      }
    }
    // Linke Kante robust: einzelne Ausreißer (Lautschrift-Reste der Nachbarspalte) zählen nicht
    const lefts = c.segs.map(sg => sg.x0).sort((a, b) => a - b);
    return { x0: lefts[Math.floor(lefts.length * 0.1)], x1 };
  };
  const both = [...cEn.segs, ...cDe.segs].flatMap(sg => sg.words);
  const y0 = Math.min(...both.map(w => w.y0)), y1 = Math.max(...both.map(w => w.y1));
  return { en: { ...extent(cEn, cDe), y0, y1 }, de: { ...extent(cDe, cNext), y0, y1 }, wordH };
}

function pairColumns(enLines, deLines) {
  const slope0 = lineSlope([...enLines, ...deLines]);
  const prep = (lines, clean) => mainColumn(lines, slope0)
    .map(l => ({ ...l, raw: l.text || '', text: clean(l.text || '') }))
    .filter(l => !isJunkLine(l.raw, l.text, l.conf ?? 100));
  const en = prep(enLines, cleanEnglish);
  const de = prep(deLines, cleanGerman);
  if (!en.length && !de.length) return [];

  const slope = slope0;
  const xRef = (median(en.map(l => l.x1)) + median(de.map(l => l.x0))) / 2 || 0;
  const yAt = l => {
    const b = l.bl || { x0: l.x0, y0: l.y1, x1: l.x1, y1: l.y1 };
    return b.y0 + slope * (xRef - b.x0);
  };
  const lineH = median([...en, ...de].map(l => l.y1 - l.y0)) || 20;
  en.forEach(l => { l.y = yAt(l); });
  en.sort((a, b) => a.y - b.y);

  const entries = en.map(l => ({ y: l.y, en: l.text, de: [], conf: l.conf ?? 100 }));
  for (const d of de.map(l => ({ ...l, y: yAt(l) })).sort((a, b) => a.y - b.y)) {
    let best = null;
    for (const e of entries) {
      if (!e.en) continue;
      if (!best || Math.abs(e.y - d.y) < Math.abs(best.y - d.y)) best = e;
    }
    const target = best && Math.abs(best.y - d.y) <= 1.8 * lineH ? best : null;
    if (target) {
      target.de.push(d);
      target.conf = Math.min(target.conf, d.conf ?? 100);
    } else if ((d.conf ?? 100) >= 60) {
      entries.push({ y: d.y, en: '', de: [d], conf: d.conf ?? 100 }); // Übersetzung ohne passendes englisches Wort
    }
  }
  // Zweizeilige Übersetzungen zusammenfügen: nach „;“ mit Semikolon, Trennstrich am Zeilenende wieder schließen
  const join = parts => parts.reduce((acc, part, i) => {
    if (!i) return part.text;
    if (/[;:]\s*$/.test(parts[i - 1].raw)) return `${acc}; ${part.text}`;
    if (/\p{L}-$/u.test(acc) && /^\p{Ll}/u.test(part.text)) return acc.slice(0, -1) + part.text;
    return `${acc} ${part.text}`;
  }, '');
  return entries
    .sort((a, b) => a.y - b.y)
    .map(e => ({ en: e.en, de: join(e.de), unsure: e.conf < 60 || !e.en || !e.de.length }));
}

// Nur eine Spalte fotografiert („Nur Englisch“ / „Nur Deutsch“): bereinigte Zeilen von oben nach unten
function singleColumn(lines, clean) {
  return mainColumn(lines)
    .map(l => ({ y: l.y0, raw: l.text || '', conf: l.conf ?? 100, text: clean(l.text || '') }))
    .filter(l => !isJunkLine(l.raw, l.text, l.conf))
    .sort((a, b) => a.y - b.y)
    .map(l => l.text);
}

if (typeof module !== 'undefined') {
  module.exports = {
    normalize, acceptedForms, levenshtein, checkAnswer, splitLine, parseVocabText,
    isPhonetic, cleanEnglish, cleanGerman, pairColumns, mainColumn, singleColumn, suggestColumns,
  };
}
