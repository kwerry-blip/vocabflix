// Ausführen mit: node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const { checkAnswer, parseVocabText, splitLine } = require('../js/answers.js');

test('exakte und alternative Antworten', () => {
  assert.equal(checkAnswer('school', 'school'), 'correct');
  assert.equal(checkAnswer('  School ', 'school'), 'correct');
  assert.equal(checkAnswer('Lehrerin', 'der Lehrer, die Lehrerin'), 'correct');
  assert.equal(checkAnswer('der Lehrer', 'der Lehrer, die Lehrerin'), 'correct');
  assert.equal(checkAnswer('Ferien', 'die Ferien'), 'correct');
  assert.equal(checkAnswer('Wie spät ist es', 'Wie spät ist es?'), 'correct');
});

test('"(to)" und "to" bei Verben', () => {
  assert.equal(checkAnswer('learn', '(to) learn'), 'correct');
  assert.equal(checkAnswer('to learn', '(to) learn'), 'correct');
  assert.equal(checkAnswer('to play', 'play'), 'correct');
  assert.equal(checkAnswer('be hungry', '(to) be hungry'), 'correct');
});

test('Tippfehler werden erkannt, falsche Wörter nicht', () => {
  assert.equal(checkAnswer('beautifull', 'beautiful'), 'typo');
  assert.equal(checkAnswer('breakfest', 'breakfast'), 'typo');
  assert.equal(checkAnswer('cat', 'car'), 'wrong');
  assert.equal(checkAnswer('dog', 'school'), 'wrong');
  assert.equal(checkAnswer('', 'school'), 'wrong');
});

test('Zeilen mit Trennern', () => {
  assert.deepEqual(splitLine('school - die Schule'), { en: 'school', de: 'die Schule' });
  assert.deepEqual(splitLine('school = die Schule'), { en: 'school', de: 'die Schule' });
  assert.deepEqual(splitLine('school\tdie Schule'), { en: 'school', de: 'die Schule' });
  assert.deepEqual(splitLine('(to) go    gehen'), { en: '(to) go', de: 'gehen' });
  assert.deepEqual(splitLine('T-shirt - das T-Shirt'), { en: 'T-shirt', de: 'das T-Shirt' });
});

test('Schulbuch-Layout mit Lautschrift und Beispielsatz', () => {
  assert.deepEqual(splitLine('holiday [ˈhɒlədeɪ] Urlaub, Ferien'), { en: 'holiday', de: 'Urlaub, Ferien' });
  assert.deepEqual(splitLine('always    I always walk to school.    immer'), { en: 'always', de: 'immer' });
});

test('ganzer OCR-Text', () => {
  const text = 'Unit 3\n\nfriend   Freund\n• teacher - Lehrer\n|\n123\nbrother';
  assert.deepEqual(parseVocabText(text), [
    { en: 'Unit 3', de: '' },
    { en: 'friend', de: 'Freund' },
    { en: 'teacher', de: 'Lehrer' },
    { en: 'brother', de: '' },
  ]);
});

test('Lautschrift wird aus dem englischen Wort entfernt', () => {
  const { cleanEnglish } = require('../js/answers.js');
  assert.equal(cleanEnglish("people ['pi:pl]"), 'people');
  assert.equal(cleanEnglish('people L’pipll'), 'people');
  assert.equal(cleanEnglish('but [bʌt], [bət]'), 'but');
  assert.equal(cleanEnglish('all (the) [ɔːl]'), 'all (the)');
  assert.equal(cleanEnglish('(to) start [stɑːt]'), '(to) start');
  assert.equal(cleanEnglish('p.22 city [ˈsɪti]'), 'city');
});

test('Lighthouse-Zeile mit Lautschrift und Beispielsatz', () => {
  assert.deepEqual(splitLine("people ['pi:pl]   Leute, Menschen   The people in Plymouth are nice."),
    { en: 'people', de: 'Leute, Menschen' });
});

// Hilfsfunktion: eine OCR-Zeile aus [text, x] Paaren bauen
function line(y, parts, { conf = 95, h = 20, tilt = 0 } = {}) {
  const words = [];
  for (const [text, x] of parts) {
    let cx = x;
    for (const t of text.split(' ')) {
      const w = t.length * 10;
      const dy = cx * tilt;
      words.push({ text: t, conf, x0: cx, y0: y + dy, x1: cx + w, y1: y + dy + h });
      cx += w + 6;
    }
  }
  return { words, baseline: { x0: words[0].x0, y0: words[0].y1, x1: words[words.length - 1].x1, y1: words[words.length - 1].y1 } };
}

test('Deutsche Übersetzung: typische Lesefehler', () => {
  const { cleanGerman } = require('../js/answers.js');
  assert.equal(cleanGerman('(Groß-JStadt'), '(Groß-)Stadt');
  assert.equal(cleanGerman('(Groß -)Stadt'), '(Groß-)Stadt');
  assert.equal(cleanGerman('anfangen. beginnen'), 'anfangen, beginnen');
  assert.equal(cleanGerman('er/sieres fängt an'), 'er/sie/es fängt an');
  assert.equal(cleanGerman('Bücher an, |'), 'Bücher an');
  assert.equal(cleanGerman('Erde'), 'Erde');
});

// Zeile wie aus der Texterkennung: Wörter mit Lage im Foto, optional schräg
function ocrLine(y, x, text, { tilt = 0, conf = 90 } = {}) {
  const words = [];
  let cx = x;
  for (const t of text.split(' ')) {
    const w = t.length * 9;
    words.push({ text: t, conf, x0: cx, y0: y + cx * tilt, x1: cx + w, y1: y + cx * tilt + 14 });
    cx += w + 5;
  }
  const last = words[words.length - 1];
  return { text, conf, x0: x, y0: words[0].y0, x1: last.x1, y1: last.y1,
    bl: { x0: x, y0: words[0].y1, x1: last.x1, y1: last.y1 }, words };
}

test('Spalten zusammensetzen: Lautschrift, zweizeilige Übersetzung, Schräglage', () => {
  const { pairColumns } = require('../js/answers.js');
  const tilt = -0.05; // rechts deutlich höher als links
  const en = [
    ocrLine(40, 50, "city ['sɪti]", { tilt }),
    ocrLine(80, 50, 'it starts', { tilt }),
    ocrLine(120, 50, 'start [stɑːt]', { tilt }),
    ocrLine(160, 50, "people ['pi:pl]", { tilt }),
  ];
  const de = [
    ocrLine(40, 300, '(Groß-)Stadt', { tilt }),
    ocrLine(72, 300, 'er/sie/es beginnt;', { tilt }),
    ocrLine(88, 300, 'er/sie/es fängt an', { tilt }),
    ocrLine(120, 300, 'anfangen, beginnen', { tilt }),
    ocrLine(160, 300, 'Leute, Menschen', { tilt }),
  ];
  assert.deepEqual(pairColumns(en, de).map(({ en, de }) => ({ en, de })), [
    { en: 'city', de: '(Groß-)Stadt' },
    { en: 'it starts', de: 'er/sie/es beginnt; er/sie/es fängt an' },
    { en: 'start', de: 'anfangen, beginnen' },
    { en: 'people', de: 'Leute, Menschen' },
  ]);
});

test('Zu groß gezogener Rahmen: Beispielsätze und Bildreste fliegen raus', () => {
  const { pairColumns } = require('../js/answers.js');
  const en = [ocrLine(40, 50, 'but [bʌt]'), ocrLine(80, 50, 'place [pleɪs]'), ocrLine(120, 50, 'make [meɪk]')];
  const de = [
    ocrLine(40, 300, 'aber Luca is ten, but Jack is fourteen.'),
    ocrLine(80, 300, 'Ort, Platz, Stelle Plymouth is a great place.'),
    ocrLine(120, 300, 'machen, herstellen'),
    ocrLine(150, 300, 'ME Un SO A nl', { conf: 20 }),
  ];
  // Beispielsätze stehen weiter rechts: Lücke zwischen den Spalten
  for (const l of de) {
    let shift = 0;
    for (const w of l.words) {
      if (/^(Luca|Plymouth)$/.test(w.text)) shift = 250;
      w.x0 += shift;
      w.x1 += shift;
    }
  }
  assert.deepEqual(pairColumns(en, de).map(({ en, de }) => ({ en, de })), [
    { en: 'but', de: 'aber' },
    { en: 'place', de: 'Ort, Platz, Stelle' },
    { en: 'make', de: 'machen, herstellen' },
  ]);
});

test('Echte Daten: Spalten eines Handyfotos (Lighthouse 1, S. 186, Rahmen ungenau)', () => {
  const { pairColumns } = require('../js/answers.js');
  const { en, de } = require('./fixtures/lighthouse1-s186-spalten.json');
  const pairs = pairColumns(en, de);
  const has = (e, d) => pairs.some(p => p.en === e && p.de === d);
  for (const [e, d] of [['with', 'mit'], ['classroom', 'Klassenzimmer'], ['yes', 'ja'], ['but', 'aber'], ['all (the)', 'alle'],
    ['people', 'Leute, Menschen'], ['place', 'Ort, Platz, Stelle'], ['make', 'machen, herstellen'], ['for', 'für']]) {
    assert.ok(has(e, d), `${e} → ${d} fehlt: ${JSON.stringify(pairs)}`);
  }
  assert.ok(!pairs.some(p => /Plymouth|friends|fourteen/.test(p.de)), 'Beispielsätze dürfen nicht als Übersetzung landen');
});

test('Echte Daten: Spaltenvorschlag aus dem ersten Lesedurchgang', () => {
  const { suggestColumns } = require('../js/answers.js');
  const cols = suggestColumns(require('./fixtures/lighthouse1-s186-uebersicht.json'));
  // Englisch beginnt bei x≈117, Deutsch bei x≈386, Beispielsätze bei x≈687 – nicht in den Rahmen
  assert.ok(cols.en.x0 < 130 && cols.en.x1 > 240 && cols.en.x1 < 386, JSON.stringify(cols.en));
  assert.ok(cols.de.x0 > 370 && cols.de.x0 < 395 && cols.de.x1 > 540 && cols.de.x1 < 687, JSON.stringify(cols.de));
});

test('„Leichter tippen“ ist nachsichtiger, normal bleibt streng', () => {
  assert.equal(checkAnswer('frend', 'friend'), 'typo');
  assert.equal(checkAnswer('sistr', 'sister'), 'typo');
  assert.equal(checkAnswer('dg', 'dog'), 'wrong');
  assert.equal(checkAnswer('dg', 'dog', { lenient: true }), 'typo');
  assert.equal(checkAnswer('becaus', 'because', { lenient: true }), 'typo');
  assert.equal(checkAnswer('bicause', 'because'), 'typo');
  assert.equal(checkAnswer('bekos', 'because'), 'wrong');
  assert.equal(checkAnswer('bekos', 'because', { lenient: true }), 'wrong');
  assert.equal(checkAnswer('cat', 'dog', { lenient: true }), 'wrong');
});

test('Lösung mit Klammern exakt abgetippt zählt als richtig', () => {
  assert.equal(checkAnswer('all (the)', 'all (the)'), 'correct');
  assert.equal(checkAnswer('(to) learn', '(to) learn'), 'correct');
  assert.equal(checkAnswer('Welche(r)', 'Welche(r)'), 'correct');
  assert.equal(checkAnswer('(Groß-)Stadt', '(Groß-)Stadt'), 'correct');
  assert.equal(checkAnswer('Stadt', '(Groß-)Stadt'), 'correct');
  assert.equal(checkAnswer('(the) dog', 'cat'), 'wrong');
});
