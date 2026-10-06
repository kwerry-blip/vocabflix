/* Lern-Hilfen für den Vokabeltest: Testdatum mit Countdown und Testmodus wie in der Schule
   (Deutsch → Englisch tippen, Schreibweise zählt). Je nach Vibe als Bosskampf, Springparcours oder Live-Auftritt. */
'use strict';

const EXAM_MAX = 20;
const EXAM_PASS = 80; // Prozent

function daysUntil(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return Math.round((new Date(y, m - 1, d) - startOfToday()) / DAY);
}

function whenText(days) {
  return days === 0 ? 'heute' : days === 1 ? 'morgen' : `in ${days} Tagen`;
}

function upcomingTests() {
  return Object.entries(state.unitMeta || {})
    .filter(([unit, m]) => m && m.testDate && unitList().includes(unit))
    .map(([unit, m]) => ({ unit, date: m.testDate, days: daysUntil(m.testDate) }))
    .filter(t => t.days >= 0 && t.days <= 30)
    .sort((a, b) => a.days - b.days);
}

/* ---------- Startseite: Countdown ---------- */

function testCardsHtml() {
  return upcomingTests().slice(0, 2).map(t => {
    const words = state.words.filter(w => w.unit === t.unit);
    const shaky = words.filter(w => w.box < SAFE_BOX).length;
    const best = (state.unitMeta[t.unit] || {}).bestExam;
    return `
      <div class="card test-card ${t.days <= 1 ? 'soon' : ''}">
        <div class="goal-head"><span>📅 Vokabeltest ${whenText(t.days)}</span><span>${esc(t.unit)}</span></div>
        <p class="test-text">${shaky ? `<b>${shaky}</b> von ${words.length} Wörtern wackeln noch` : '🎉 Alle Wörter sitzen sicher!'}${best != null ? ` · Bester Test: <b>${best} %</b>` : ''}</p>
        <div class="row">
          <button type="button" class="btn" data-action="start" data-unit="${esc(t.unit)}">▶ Üben</button>
          <button type="button" class="btn ghost" data-action="exam-start" data-unit="${esc(t.unit)}">📝 Probetest</button>
        </div>
      </div>`;
  }).join('');
}

/* ---------- Testdatum festlegen ---------- */

ACTIONS['unit-test-date'] = el => {
  const unit = el.dataset.unit;
  const cur = (state.unitMeta[unit] || {}).testDate || '';
  const dlg = ensureDialog();
  dlg.innerHTML = `
    <form class="stack" id="test-date-form">
      <h2>📅 Vokabeltest</h2>
      <p class="muted">Wann schreibst du den Test zu <b>${esc(unit)}</b>? Die App zählt dann herunter und erinnert dich an die Wackel-Wörter.</p>
      <label>Datum<input type="date" id="test-date" value="${esc(cur)}" min="${todayKey()}" required></label>
      <div class="row">
        ${cur ? '<button type="button" class="btn ghost" data-dlg="remove">Entfernen</button>' : ''}
        <button type="button" class="btn ghost" data-dlg="close">Abbrechen</button>
        <button type="submit" class="btn">Speichern</button>
      </div>
    </form>`;
  dlg.querySelector('[data-dlg="close"]').onclick = () => dlg.close();
  dlg.querySelector('[data-dlg="remove"]')?.addEventListener('click', () => {
    state.unitMeta[unit] = { ...state.unitMeta[unit], testDate: null };
    save();
    dlg.close();
    show(currentTab);
  });
  dlg.querySelector('#test-date-form').onsubmit = ev => {
    ev.preventDefault();
    const date = $('#test-date').value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    state.unitMeta[unit] = { ...state.unitMeta[unit], testDate: date };
    save();
    dlg.close();
    toast(`📅 Test ${whenText(daysUntil(date))} – los geht’s mit dem Üben!`);
    show(currentTab);
  };
  if (!dlg.open) dlg.showModal();
};

/* ---------- Testmodus mit Vibe-Skin ---------- */

const EXAM_SKINS = {
  gaming: {
    title: 'Bosskampf', intro: 'Jede richtige Antwort trifft den Vokabel-Boss!',
    pass: ['BOSS BESIEGT! 👾💥', 'Der Vokabel-Boss ist erledigt'], fail: ['Der Boss hat noch Energie!', 'Nochmal angreifen'],
    arena: L => {
      const hp = L.total - L.hits;
      return `
        <div class="boss ${L.lastHit === true ? 'hit' : L.lastHit === false ? 'block' : ''}">
          <div class="boss-sprite">${bossSvg()}</div>
          <div class="boss-info"><b>Vokabel-Boss</b>
            <div class="progress small boss-hp"><div class="progress-fill" style="width:${hp / L.total * 100}%"></div></div>
            <small>❤️ ${hp} / ${L.total}</small></div>
        </div>`;
    },
  },
  horse: {
    title: 'Springturnier', intro: 'Jede richtige Antwort ist ein sauberer Sprung!',
    pass: ['TURNIER GEWONNEN! 🎀', 'Fehlerarm durch den Parcours'], fail: ['Ein paar Stangen gefallen!', 'Nochmal reiten'],
    arena: L => `
      <div class="parcours">${L.marks.map((m, i) => `<span class="hurdle ${m}">${m === 'ok' ? '✅' : m === 'miss' ? '❌' : i === L.pos ? '🐎' : '🚧'}</span>`).join('')}</div>`,
  },
  default: {
    title: 'Live-Auftritt', intro: 'Jede richtige Antwort bringt die Crowd in Stimmung!',
    pass: ['STANDING OVATIONS! 🙌', 'Was für ein Auftritt'], fail: ['Die Crowd will eine Zugabe!', 'Nochmal auf die Bühne'],
    arena: L => {
      const mood = L.total ? L.hits / L.total : 0;
      const face = mood > 0.8 ? '🤩' : mood > 0.5 ? '😃' : mood > 0.25 ? '🙂' : '😐';
      return `<div class="crowd"><span class="crowd-face">${face}</span><div class="crowd-meter"><small>Stimmung</small>
        <div class="progress small"><div class="progress-fill gold" style="width:${mood * 100}%"></div></div></div></div>`;
    },
  },
};

function examSkin() {
  return EXAM_SKINS[vibe().id] || EXAM_SKINS.default;
}

function bossSvg() {
  const rows = [
    '..PP....PP..',
    '..PPPPPPPP..',
    '.PPWWPPWWPP.',
    '.PPWKPPWKPP.',
    'PPPPPPPPPPPP',
    'PP.PPPPPP.PP',
    'PP.TTTTTT.PP',
    'PPPPPPPPPPPP',
    '.PP.PP.PP.PP',
  ];
  const pal = { P: '#a55eea', W: '#fff', K: '#1b1b1b', T: '#ffd32a' };
  return `<svg viewBox="0 0 12 9" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">${rows.flatMap((r, y) =>
    [...r].map((c, x) => (pal[c] ? `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${pal[c]}"/>` : ''))).join('')}</svg>`;
}

function startExam(unit) {
  const words = shuffle(state.words.filter(w => w.unit === unit)).slice(0, EXAM_MAX);
  if (words.length < 4) { toast('Für einen Test brauchst du mindestens 4 Wörter.'); return; }
  const skin = examSkin();
  const pairs = words.map(w => [w.en, w.de]);
  const stats = { total: pairs.length, hits: 0, pos: 0, marks: pairs.map(() => ''), lastHit: null };
  startCustomRound(pairs, {
    mode: 'exam', unit, strict: true, noRequeue: true,
    types: pairs.map(() => 'type_de_en'),
    arenaHtml: () => skin.arena(stats),
    onAnswer: ok => {
      stats.marks[stats.pos] = ok ? 'ok' : 'miss';
      stats.pos++;
      if (ok) stats.hits++;
      stats.lastHit = ok;
      const arena = $('#arena');
      if (arena) arena.innerHTML = skin.arena(stats);
    },
    onFinish: res => {
      const pct = Math.round(res.score / Math.max(1, res.total) * 100);
      const passed = pct >= EXAM_PASS;
      const meta = state.unitMeta[unit] = { ...state.unitMeta[unit] };
      meta.bestExam = Math.max(meta.bestExam || 0, pct);
      state.stats.exams = (state.stats.exams || 0) + 1;
      if (passed) state.stats.examsPassed = (state.stats.examsPassed || 0) + 1;
      save();
      unlockBadges();
      const missed = pairs.filter((_, i) => stats.marks[i] === 'miss');
      examMissed = missed;
      return {
        title: passed ? skin.pass[0] : skin.fail[0],
        html: `
          <div class="card exam-result ${passed ? 'passed' : ''}">
            <div class="exam-pct">${pct} %</div>
            <p class="muted">${res.score} von ${res.total} Wörtern richtig geschrieben${passed ? ' – bereit für den Test! 💪' : ` – ab ${EXAM_PASS} % ist ${skin.title === 'Bosskampf' ? 'der Boss besiegt' : 'die Runde geschafft'}.`}</p>
            ${missed.length ? `<ul class="missed">${missed.map(([en, de]) => `<li>${esc(de)} → <b>${esc(en)}</b></li>`).join('')}</ul>
              <button type="button" class="btn" data-action="exam-practice">🔁 Diese ${missed.length} Wörter üben</button>` : ''}
            <button type="button" class="btn ghost" data-action="exam-start" data-unit="${esc(unit)}">📝 Nochmal testen</button>
          </div>`,
        mascot: passed ? [skin.pass[0], skin.pass[1]] : [`${pct} %`, skin.fail[1]],
      };
    },
  });
  setTimeout(() => showMascot(skin.title.toUpperCase(), skin.intro), 300);
}

let examMissed = [];
ACTIONS['exam-start'] = el => {
  if (!lesson) startExam(el.dataset.unit);
};
ACTIONS['exam-practice'] = () => {
  if (examMissed.length) startCustomRound(examMissed, { mode: 'practice', types: examMissed.map((_, i) => (i % 2 ? 'type_de_en' : 'mc_de_en')) });
};

// Startseite neu zeichnen, damit der Countdown erscheint
if (!lesson && !onboarding && currentTab === 'home') renderHome();
