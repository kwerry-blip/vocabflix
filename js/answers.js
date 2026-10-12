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
// Kleine Wörter, die in Vokabeln wirklich in Klammern stehen: "(to) live", "all (the)", "(a) lot"
const BRACKET_WORDS = /^\((to|the|a|an|sb|sth|s|es|of|at|on|in|up|out|off|for|with|about|be|one)\)[.,*]?$/i;

function isPhonetic(token) {
  if (BRACKET_WORDS.test(token)) return false;
  if (/^[[(|/{‘'’`´"“]/.test(token)) return true;
  if (/^I[’'‘](m|ll|ve|d|s)\b/i.test(token)) return false; // "I'm", "I'll" sind echte Wörter
  if (/^[LlI1|][’'‘]/.test(token)) return true; // "[’" wird oft als "L’" gelesen
  return IPA_CHARS.test(token);
}

function cleanEnglish(text) {
  const tokens = String(text).replace(/^[\s>▶►•*]*p[.\-‑]?\s?\d+\s+/i, '').split(/\s+/).filter(Boolean)
    .map(t => t.replace(/^(\([a-z]+\))[*”"'’`]+$/i, '$1')); // „(to)*“ – das Sternchen wird oft als Anführungszeichen gelesen
  // Reste vom Rand vorne: Zeichen ohne Buchstaben („-9“, „•“) und einzelne Buchstaben („J Look at …“) – außer „I“ und „a“
  // und falsch gelesene Seitenverweise („n22“, „P-9“)
  while (tokens.length > 1 && (!/\p{L}/u.test(tokens[0]) || /^[^\sIAa]$/.test(tokens[0]) || /^\p{L}?[.\-]?\d+$/u.test(tokens[0]))) tokens.shift();
  const out = [];
  for (const t of tokens) {
    if (isPhonetic(t)) break; // ab der Lautschrift ist der Rest egal
    // Lautschrift, deren öffnende Klammer nicht erkannt wurde: „big big)“
    if (out.length && /[)\]]$/.test(t) && !out.join(' ').includes('(') && !t.includes('(')) break;
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
  return conf < 40 && tokens.length >= 3 && avgLetters <= 2.2;
}

// Steigung der Zeilen (dy/dx) aus den Grundlinien: Median, damit einzelne Ausreißer nicht stören
function lineSlope(lines) {
  const slopes = lines
    .filter(l => l.bl && l.bl.x1 - l.bl.x0 > 2 * (l.y1 - l.y0))
    .map(l => (l.bl.y1 - l.bl.y0) / (l.bl.x1 - l.bl.x0));
  return slopes.length ? median(slopes) : 0;
}

/* Neigung der Spalten (dx/dy): Ist das Handy nicht genau über dem Buch, laufen Spalten schräg – auch wenn die
   Zeilen waagerecht sind (Trapez). Geschätzt aus den linken Kanten der Zeilen: Median der Steigungen aller Paare
   (Theil-Sen), das verkraftet Ausreißer wie Zeilen, die erst in der zweiten Spalte beginnen. */
function columnLean(lines, wordH) {
  const starts = lines
    .map(l => (l.words || []).filter(w => w.text && w.text.trim()))
    .filter(ws => ws.length)
    .map(ws => ws.reduce((a, b) => (b.x0 < a.x0 ? b : a)))
    .map(w => ({ x: w.x0, y: (w.y0 + w.y1) / 2 }));
  const pts = starts.length > 80 ? starts.filter((_, i) => i % Math.ceil(starts.length / 80) === 0) : starts;
  const slopes = [];
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dy = pts[j].y - pts[i].y, dx = pts[j].x - pts[i].x;
      if (Math.abs(dy) > 3 * wordH && Math.abs(dx) < 0.25 * Math.abs(dy)) slopes.push(dx / dy);
    }
  }
  return slopes.length >= 3 ? median(slopes) : 0;
}

// Jede Zeile an großen Lücken in Stücke teilen; xd ist die linke Kante, gerade gerückt (Neigung herausgerechnet)
function lineSegments(lines) {
  const wordH = median(lines.flatMap(l => (l.words || []).map(w => w.y1 - w.y0))) || 20;
  const lean = columnLean(lines, wordH);
  const segments = [];
  lines.forEach((l, li) => {
    let seg = null;
    for (const w of [...(l.words || [])].sort((a, b) => a.x0 - b.x0)) {
      if (!w.text || !w.text.trim()) continue;
      if (seg && w.x0 - seg.x1 <= 1.2 * wordH) {
        seg.words.push(w);
        seg.x1 = w.x1;
      } else {
        seg = { li, words: [w], x0: w.x0, x1: w.x1, xd: w.x0 - lean * (w.y0 + w.y1) / 2 };
        segments.push(seg);
      }
    }
  });
  return { segments, wordH, lean };
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
function mainColumn(lines) {
  const withWords = lines.filter(l => l.words && l.words.length);
  if (withWords.length < 3) return lines;
  const { segments, wordH } = lineSegments(withWords);
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
      conf: median(words.map(w => w.conf ?? 100)),
      x0: Math.min(...words.map(w => w.x0)), x1: Math.max(...words.map(w => w.x1)),
    };
  }).filter(Boolean);
}

/* Spalten für die Rahmen vorschlagen – aus einem schnellen ersten Lesedurchgang über die ganze Liste.
   Spalten erkennt man an vielen Zeilen, die an (fast) derselben Stelle beginnen. Die zwei linken großen Spalten
   (viel Text) sind Englisch und Deutsch; kleine Reste wie Seitenverweise, Lautschrift-Fetzen und Zahlenkästen
   zählen nicht. Ergebnis: { en, de: {x0, y0, x1, y1}, wordH } in Bildpunkten oder null. */
function suggestColumns(lines) {
  const withWords = lines.filter(l => l.words && l.words.some(w => looksLikeText(w.text || '')));
  if (withWords.length < 3) return null;
  const { segments, wordH } = lineSegments(withWords);
  const textSegs = segments.filter(sg => !/^\d+$/.test(sg.words[0].text) && sg.words.some(w => looksLikeText(w.text || '')));
  if (!textSegs.length) return null;
  // Häufungen linker Kanten: für jedes Stück zählen, wie viele andere fast an derselben Stelle beginnen
  const density = sg => textSegs.filter(o => Math.abs(o.xd - sg.xd) <= wordH).length;
  const peaks = [];
  for (const sg of [...textSegs].sort((a, b) => density(b) - density(a))) {
    if (density(sg) < 3) break;
    if (!peaks.some(pk => Math.abs(pk.xd - sg.xd) < 3 * wordH)) peaks.push({ xd: sg.xd, segs: [] });
  }
  peaks.sort((a, b) => a.xd - b.xd);
  // Jedes Stück gehört zur nächsten Spaltenkante links davon (Einrückungen bis ca. 3 Zeichenhöhen erlaubt)
  for (const sg of textSegs) {
    const pk = [...peaks].reverse().find(p => sg.xd >= p.xd - 1.5 * wordH);
    if (pk && sg.xd <= pk.xd + 3 * wordH) pk.segs.push(sg);
  }
  // Kanten, die dicht beieinanderliegen, gehören zu einer Spalte (Einrückungen, Bruchstücke) –
  // echte Nachbarspalten liegen deutlich weiter auseinander
  const merged = [];
  for (const pk of peaks) {
    const prev = merged[merged.length - 1];
    if (prev && pk.xd - prev.xd < 6 * wordH) prev.segs.push(...pk.segs);
    else merged.push(pk);
  }
  merged.forEach(pk => {
    pk.letters = pk.segs.reduce((n, sg) => n + sg.words.reduce((m, w) => m + letterCount(w.text || ''), 0), 0);
    pk.lines = new Set(pk.segs.map(sg => sg.li)).size;
  });
  const maxLetters = Math.max(0, ...merged.map(pk => pk.letters));
  const major = merged.filter(pk => pk.lines >= 3 && pk.letters >= 0.2 * maxLetters);
  if (major.length < 2) return null;
  const [cEn, cDe, cNext] = major;
  // Rahmen am äußersten Wort ausrichten: schräg laufende Spalten sollen oben und unten ganz drin sein.
  // Englisch: alles links der deutschen Spalte (Seitenverweise am Rand entfernt später cleanEnglish).
  // Deutsch: bis zum längsten Eintrag – begrenzt nur dort, wo in derselben Zeile die nächste Spalte beginnt.
  const deLeft = Math.min(...cDe.segs.map(sg => sg.x0));
  const en = {
    x0: Math.min(...textSegs.filter(sg => sg.x1 <= deLeft + wordH).map(sg => sg.x0)),
    x1: Math.min(Math.max(...cEn.segs.map(sg => sg.x1)), deLeft + 2 * wordH),
  };
  // Rechter Rand: der längste Eintrag, der nicht schon in die nächste Spalte hineinragt (zusammengewachsene Stücke);
  // in Zeilen, in denen rechts daneben die nächste Spalte steht, endet der Rahmen kurz davor.
  const nextLeft = cNext ? Math.min(...cNext.segs.map(sg => sg.x0)) : Infinity;
  const deEndsAll = cDe.segs.map(sg => sg.x1).sort((a, b) => a - b);
  const ends = deEndsAll.filter(x => x <= nextLeft + wordH);
  let deRight = (ends.length ? Math.max(...ends) : Math.max(...cDe.segs.map(sg => sg.x1))) + wordH;
  if (cNext) {
    // Wo in derselben Zeile rechts die nächste Spalte beginnt, endet der Rahmen kurz davor – maßgeblich ist
    // aber nicht die engste Zeile (Ausreißer), und die meisten deutschen Einträge müssen ganz hineinpassen.
    const limits = [];
    for (const sg of cDe.segs) {
      const nextOnRow = cNext.segs.filter(n => n.li === sg.li && n.x0 > sg.x1);
      if (nextOnRow.length) limits.push(Math.min(...nextOnRow.map(n => n.x0)) - 0.2 * wordH);
    }
    if (limits.length) {
      limits.sort((a, b) => a - b);
      const most = deEndsAll[Math.floor(deEndsAll.length * 0.75)] + 0.5 * wordH;
      deRight = Math.min(deRight, Math.max(limits[Math.floor(limits.length * 0.25)], most));
    }
  }
  const de = { x0: deLeft, x1: Math.max(deRight, deLeft + 4 * wordH) };
  const words = [...cEn.segs, ...cDe.segs].flatMap(sg => sg.words);
  const y0 = Math.min(...words.map(w => w.y0)), y1 = Math.max(...words.map(w => w.y1));
  return { en: { ...en, y0, y1 }, de: { ...de, y0, y1 }, wordH };
}

/* ---------- Trennlinien der Vokabeltabelle ----------
   Viele Schulbücher ziehen zwischen den Einträgen dünne Linien. Die Texterkennung verschluckt daneben gern ganze
   Zeilen – deshalb werden sie vorher aus dem Bild entfernt (removeRules in app.js). */

// Kurze waagerechte Strecken {y, x0, x1} zu durchgehenden Linien verbinden (auch schräge: Treppenstufen)
function traceRules(runs) {
  const parent = runs.map((_, i) => i);
  const find = i => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  const sorted = runs.map((r, i) => ({ ...r, i })).sort((a, b) => a.y - b.y);
  for (let a = 0; a < sorted.length; a++) {
    for (let b = a + 1; b < sorted.length && sorted[b].y - sorted[a].y <= 2.5; b++) {
      const r1 = sorted[a], r2 = sorted[b];
      if (r2.x0 <= r1.x1 + 12 && r1.x0 <= r2.x1 + 12) parent[find(r1.i)] = find(r2.i);
    }
  }
  const groups = new Map();
  runs.forEach((r, i) => {
    const g = find(i);
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(r);
  });
  return [...groups.values()].map((rs, id) => {
    rs.sort((a, b) => a.x0 - b.x0);
    const x0 = Math.min(...rs.map(r => r.x0)), x1 = Math.max(...rs.map(r => r.x1));
    // Höhe der Linie an der Stelle x (Mittel der Strecken dort, sonst zwischen den Nachbarn verbunden)
    const yAt = x => {
      const here = rs.filter(r => r.x0 <= x && x <= r.x1);
      if (here.length) return here.reduce((a, r) => a + r.y, 0) / here.length;
      const left = rs.filter(r => r.x1 < x).pop(), right = rs.find(r => r.x0 > x);
      if (left && right) return left.y + (right.y - left.y) * (x - left.x1) / Math.max(1, right.x0 - left.x1);
      return (left || right).y;
    };
    return { id, x0, x1, yAt, runs: rs };
  });
}

function pairColumns(enLines, deLines) {
  const slope0 = lineSlope([...enLines, ...deLines]);
  const prep = (lines, clean) => mainColumn(lines)
    .map(l => ({ ...l, raw: l.text || '', text: clean(l.text || '') }))
    .filter(l => !isJunkLine(l.raw, l.text, l.conf ?? 100));
  const en = prep(enLines, cleanEnglish);
  const de = prep(deLines, cleanGerman);
  if (!en.length && !de.length) return [];

  const xRef = (median(en.map(l => l.x1)) + median(de.map(l => l.x0))) / 2 || 0;
  // Gewölbte Seiten sind oben anders schief als unten: Steigung aus den Nachbarzeilen schätzen
  const all = [...en, ...de];
  const lineH0 = median(all.map(l => l.y1 - l.y0)) || 20;
  const slopeNear = y => {
    const near = all.filter(l => Math.abs(l.y0 - y) < 8 * lineH0);
    return near.length >= 4 ? lineSlope(near) : slope0;
  };
  const yAt = l => {
    const b = l.bl || { x0: l.x0, y0: l.y1, x1: l.x1, y1: l.y1 };
    return b.y0 + slopeNear(l.y0) * (xRef - b.x0);
  };
  const lineH = median([...en, ...de].map(l => l.y1 - l.y0)) || 20;
  en.forEach(l => { l.y = yAt(l); });
  en.sort((a, b) => a.y - b.y);
  // Perspektive und gewölbte Seiten: die deutsche Spalte kann oben und unten unterschiedlich weit verrutscht sein.
  // Gesucht ist der Verlauf des Versatzes von oben nach unten, bei dem möglichst viele englische Zeilen eine
  // deutsche Zeile genau gegenüber haben und der Versatz sich nur sanft ändert (Viterbi über mögliche Versätze).
  const deY = de.map(yAt).sort((a, b) => a - b);
  const steps = [];
  for (let o = -3 * lineH; o <= 3 * lineH + 1e-6; o += lineH / 5) steps.push(o);
  // Treffer zählen; dazu eine leichte Vorliebe für kleine Versätze: Krümmung und Perspektive verschieben selten um
  // mehr als eine halbe Zeile – eine um eine ganze Zeile verrutschte Zuordnung passt sonst genauso gut.
  const fit = (e, o) => {
    let best = 0;
    for (const y of deY) {
      const d = (y - e.y - o) / (0.4 * lineH);
      best = Math.max(best, 1 - d * d);
    }
    return best - 0.15 * Math.abs(o) / lineH;
  };
  let score = steps.map(o => (en[0] ? fit(en[0], o) : 0));
  const back = [];
  for (let i = 1; i < en.length; i++) {
    const prev = score;
    const from = [];
    score = steps.map((o, k) => {
      let bestK = 0, bestV = -Infinity;
      for (let j = 0; j < steps.length; j++) {
        const v = prev[j] - Math.abs(steps[j] - o) / lineH; // Versatzänderung kostet
        if (v > bestV) { bestV = v; bestK = j; }
      }
      from[k] = bestK;
      return bestV + fit(en[i], o);
    });
    back.push(from);
  }
  if (en.length) {
    let k = score.indexOf(Math.max(...score));
    for (let i = en.length - 1; i >= 0; i--) {
      en[i].offset = steps[k];
      if (i > 0) k = back[i - 1][k];
    }
  }
  if (typeof process !== 'undefined' && process.env.DEBUG_OCR) console.error('Versatz', en.map(e => Math.round(e.offset)).join(' '));
  const entries = en.map(l => ({ y: l.y, offset: l.offset, en: l.text, de: [], conf: l.conf ?? 100 }));
  for (const d of de.map(l => ({ ...l, y: yAt(l) })).sort((a, b) => a.y - b.y)) {
    let best = null;
    for (const e of entries) {
      if (!e.en) continue;
      if (!best || Math.abs(e.y + e.offset - d.y) < Math.abs(best.y + best.offset - d.y)) best = e;
    }
    const target = best && Math.abs(best.y + best.offset - d.y) <= 1.8 * lineH ? best : null;
    if (target) {
      target.de.push(d);
      target.conf = Math.min(target.conf, d.conf ?? 100);
    } else if ((d.conf ?? 100) >= 60) {
      entries.push({ y: d.y, en: '', de: [d], conf: d.conf ?? 100 }); // Übersetzung ohne passendes englisches Wort
    }
  }
  // Liegen deutsche Zeilen eines Eintrags so weit auseinander wie zwei Tabellenzeilen, fehlt dazwischen meist ein
  // englisches Wort (z. B. zu blass gedruckt). Dann bleibt nur die passende Gruppe beim Wort, die anderen werden eigene
  // Zeilen mit leerem Englisch – zum Ergänzen statt falsch zusammengeklebt.
  const extra = [];
  // Maßstab ist der Leerraum zwischen den Zeilen (echte Bildhöhen): Fortsetzungszeilen stehen dicht darunter,
  // eine neue Tabellenzeile hat deutlich mehr Abstand
  const newRow = (prev, next) => next.y0 - prev.y1 > 0.45 * (prev.y1 - prev.y0);
  for (const e of entries) {
    if (!e.en || e.de.length < 2) continue;
    const groups = [[e.de[0]]];
    for (const d of e.de.slice(1)) {
      const last = groups[groups.length - 1];
      if (newRow(last[last.length - 1], d)) groups.push([d]); else last.push(d);
    }
    if (groups.length < 2) continue;
    const target = e.y + (e.offset || 0);
    const dist = g => Math.min(...g.map(d => Math.abs(d.y - target)));
    const keep = groups.reduce((a, g) => (dist(g) < dist(a) ? g : a));
    e.de = keep;
    for (const g of groups) if (g !== keep) extra.push({ y: g[0].y, en: '', de: g, conf: 0 });
  }
  return finishEntries([...entries, ...extra]);
}

// Zweizeilige Übersetzungen zusammenfügen: nach „;“ mit Semikolon, Trennstrich am Zeilenende wieder schließen
function finishEntries(entries) {
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
    isPhonetic, cleanEnglish, cleanGerman, pairColumns, mainColumn, singleColumn, suggestColumns, lineSlope, traceRules,
  };
}
