/* Mit Freunden: Vokabel-Duell (gegeneinander), Lern-Buddy-Woche und Hilfe-Paket (miteinander), Sticker.
   Alles läuft über Links (share.js) – ohne Server, ohne freie Texte. Im Link stehen nur Vorname, Wörter und Ergebnisse. */
'use strict';

// Zustand ergänzen (ältere Speicherstände kennen diese Felder noch nicht)
state.deviceId = state.deviceId || uid();
state.duels = state.duels || {};
state.teams = state.teams || {};
state.helpedIds = state.helpedIds || [];
state.stickerLog = state.stickerLog || [];
save();

const myName = () => state.settings.name || 'Jemand';
const fmtTime = ms => `${Math.round(ms / 1000)} s`;

/* ---------- Startseite: Knöpfe und Team-Karten ---------- */

function socialButtonsHtml() {
  const teams = activeTeams();
  return `
    ${teams.map(teamCardHtml).join('')}
    <div class="social-grid">
      <button type="button" class="social-btn" data-action="duel-new"><span>⚔️</span>Duell</button>
      <button type="button" class="social-btn" data-action="team-new"><span>👥</span>Buddy-Woche</button>
      <button type="button" class="social-btn" data-action="help-new"><span>🆘</span>Hilfe-Paket</button>
      <button type="button" class="social-btn" data-action="sticker-new"><span>🎉</span>Sticker</button>
    </div>
    ${state.stickerLog.length ? `<p class="muted small sticker-log">Zuletzt bekommen: ${state.stickerLog.slice(-3).reverse()
      .map(e => `${(STICKERS.find(s => s.id === e.s) || {}).icon || '🎉'} ${esc(e.from)}`).join(' · ')}</p>` : ''}`;
}

function rerenderHome() {
  if (!lesson && !onboarding && currentTab === 'home') renderHome();
}

// Unit auswählen (für Duell)
function pickUnitDialog(title, onPick) {
  const units = unitList().filter(u => state.words.filter(w => w.unit === u).length >= 4);
  const dlg = ensureDialog();
  dlg.innerHTML = `
    <div class="stack">
      <h2>${title}</h2>
      ${units.length ? `<p class="muted">Mit welcher Unit?</p>
        <div class="pick-list">${units.map(u => `<button type="button" class="btn ghost" data-unit="${esc(u)}">${vibe().unitIcon} ${esc(u)}</button>`).join('')}</div>`
        : '<p class="muted">Du brauchst eine Unit mit mindestens 4 Wörtern.</p>'}
      <button type="button" class="btn ghost" data-dlg="close">Abbrechen</button>
    </div>`;
  dlg.querySelector('[data-dlg="close"]').onclick = () => dlg.close();
  dlg.querySelectorAll('[data-unit]').forEach(b => { b.onclick = () => { dlg.close(); onPick(b.dataset.unit); }; });
  if (!dlg.open) dlg.showModal();
}

/* ---------- Vokabel-Duell ---------- */

const DUEL_SIZE = 10;

function duelWinner(me, them) {
  if (me.s !== them.s) return me.s > them.s ? 'me' : 'them';
  if (Math.abs(me.ms - them.ms) > 500) return me.ms < them.ms ? 'me' : 'them';
  return 'tie';
}

function recordDuelRound(duel, r) {
  const round = duel.rounds[r];
  if (!round || !round.me || !round.them || round.counted) return null;
  round.counted = true;
  const win = duelWinner(round.me, round.them);
  state.stats.duels = (state.stats.duels || 0) + 1;
  if (win === 'me') state.stats.duelWins = (state.stats.duelWins || 0) + 1;
  duel.wins = (duel.wins || 0) + (win === 'me' ? 1 : 0);
  duel.losses = (duel.losses || 0) + (win === 'them' ? 1 : 0);
  save();
  return win;
}

function duelCompareHtml(duel, r) {
  const { me, them } = duel.rounds[r];
  const win = duelWinner(me, them);
  const head = win === 'me' ? '🏆 Du gewinnst!' : win === 'them' ? `💪 ${esc(duel.opponent)} gewinnt diesmal` : '🤝 Unentschieden!';
  return `
    <div class="card duel-card">
      <div class="duel-head">${head}</div>
      <div class="duel-vs">
        <div class="${win === 'me' ? 'win' : ''}"><small>Du</small><b>${me.s}/${me.n}</b><span>${fmtTime(me.ms)}</span></div>
        <i>VS</i>
        <div class="${win === 'them' ? 'win' : ''}"><small>${esc(duel.opponent)}</small><b>${them.s}/${them.n}</b><span>${fmtTime(them.ms)}</span></div>
      </div>
      <small class="muted">Gesamt: ${duel.wins || 0} Siege · ${duel.losses || 0} Niederlagen</small>
    </div>`;
}

async function shareDuel(duel, r) {
  const round = duel.rounds[r];
  const url = await shareLink({ t: 'duel', id: duel.id, r, from: myName(), unit: duel.unit, w: round.w, ty: round.ty, res: round.me });
  const challenge = !round.them;
  openShareDialog({
    title: challenge ? '⚔️ Freund herausfordern' : '📤 Ergebnis zurückschicken',
    intro: `Dein Ergebnis: <b>${round.me.s}/${round.me.n}</b> in ${fmtTime(round.me.ms)}`,
    text: challenge
      ? `⚔️ ${myName()} fordert dich zum Vokabel-Duell heraus: ${round.me.s}/${round.me.n} in ${fmtTime(round.me.ms)} (${duel.unit})! Schaffst du mehr? Tippe auf den Link oder kopiere ihn in VocabFlix:`
      : `⚔️ Duell-Ergebnis von ${myName()}: ${round.me.s}/${round.me.n} in ${fmtTime(round.me.ms)}. Öffne den Link in VocabFlix für den Vergleich:`,
    url,
  });
}

function playDuelRound(duel, r) {
  const round = duel.rounds[r];
  startCustomRound(round.w, {
    mode: 'duel', unit: duel.unit, types: round.ty, noRequeue: true,
    onFinish: res => {
      round.me = { s: res.score, n: round.w.length, ms: res.ms };
      save();
      const win = recordDuelRound(duel, r);
      unlockBadges();
      if (win) {
        return {
          title: win === 'me' ? 'Duell gewonnen!' : win === 'tie' ? 'Unentschieden!' : 'Knapp verloren!',
          html: duelCompareHtml(duel, r) + duelButtonsHtml(duel, r, true),
          mascot: win === 'me' ? ['SIEG! 🏆', `gegen ${duel.opponent}`] : ['Revanche?', 'Nächstes Mal!'],
        };
      }
      return {
        title: 'Duell-Runde fertig!',
        html: `<div class="card duel-card"><div class="duel-head">${round.me.s}/${round.me.n} in ${fmtTime(round.me.ms)}</div>
          <p class="muted">Jetzt einen Freund herausfordern – er bekommt genau dieselben Wörter.</p></div>` + duelButtonsHtml(duel, r, false),
        mascot: ['DUELL!', 'Fordere jemanden heraus'],
      };
    },
  });
}

function duelButtonsHtml(duel, r, finished) {
  return `<div class="stack duel-actions">
    ${finished ? '' : `<button type="button" class="btn big" data-action="duel-share" data-id="${duel.id}" data-r="${r}">⚔️ Freund herausfordern</button>`}
    ${finished && duel.rounds[r].replyNeeded ? `<button type="button" class="btn big" data-action="duel-share" data-id="${duel.id}" data-r="${r}">📤 Ergebnis an ${esc(duel.opponent)} schicken</button>` : ''}
    ${finished ? `<button type="button" class="btn ghost" data-action="duel-revenge" data-id="${duel.id}">🔁 Neue Runde</button>` : ''}
    ${duel.foreignUnit ? `<button type="button" class="btn ghost" data-action="duel-keep" data-id="${duel.id}" data-r="${r}">📚 Diese Wörter speichern</button>` : ''}
  </div>`;
}

function newDuelRound(duel) {
  const r = Object.keys(duel.rounds).length + 1;
  const pool = shuffle(state.words.filter(w => w.unit === duel.unit)).slice(0, DUEL_SIZE);
  const source = pool.length >= 4 ? pool : null;
  const w = source ? source.map(x => [x.en, x.de]) : shuffle(duel.rounds[r - 1].w);
  const ty = mixDirections((source || w.map(([en, de]) => ({ box: 1, en, de }))).map(x => chooseType(x).replace('listen_type', 'type_de_en')));
  duel.rounds[r] = { w, ty };
  return r;
}

ACTIONS['duel-new'] = () => pickUnitDialog('⚔️ Vokabel-Duell', unit => {
  const duel = { id: uid(), unit, opponent: null, rounds: {}, created: Date.now() };
  state.duels[duel.id] = duel;
  const r = newDuelRound(duel);
  save();
  playDuelRound(duel, r);
});
ACTIONS['duel-share'] = el => shareDuel(state.duels[el.dataset.id], el.dataset.r);
ACTIONS['duel-revenge'] = el => {
  const duel = state.duels[el.dataset.id];
  const r = newDuelRound(duel);
  save();
  playDuelRound(duel, r);
};
ACTIONS['duel-keep'] = el => {
  const duel = state.duels[el.dataset.id];
  let n = 0;
  for (const [en, de] of duel.rounds[el.dataset.r].w) {
    if (!state.words.some(w => w.unit === duel.unit && normalize(w.en) === normalize(en))) {
      state.words.push(newWord(en, de, duel.unit));
      n++;
    }
  }
  save();
  toast(`📚 ${n} Wörter in „${duel.unit}“ gespeichert`);
};

SHARE_HANDLERS.duel = (p, info) => {
  const id = cleanText(p.id, 40), r = String(parseInt(p.r, 10) || 1);
  const from = cleanName(p.from) || 'Jemand';
  const words = cleanWords(p.w, 20);
  const res = p.res && { s: Math.max(0, Math.min(words.length, parseInt(p.res.s, 10) || 0)), n: words.length, ms: Math.max(0, parseInt(p.res.ms, 10) || 0) };
  if (!id || words.length < 3 || !res) { toast('Dieser Duell-Link ist unvollständig.'); return; }
  const unit = cleanText(p.unit, 30) || 'Duell';
  let duel = state.duels[id];
  if (!duel) {
    duel = state.duels[id] = { id, unit, opponent: from, rounds: {}, created: Date.now(), foreignUnit: !unitList().includes(unit) };
  }
  duel.opponent = duel.opponent || from;
  const okType = t => ['mc_en_de', 'mc_de_en', 'listen_mc', 'type_de_en', 'type_en_de', 'listen_type'].includes(t);
  const ty = (Array.isArray(p.ty) ? p.ty : []).slice(0, words.length).map(t => (okType(t) ? t : 'mc_de_en'));
  const round = duel.rounds[r] = duel.rounds[r] || { w: words, ty };
  round.them = res;
  save();
  const dlg = ensureDialog();
  if (round.me) {
    // Antwort auf meine Herausforderung: Vergleich zeigen
    const win = recordDuelRound(duel, r);
    unlockBadges();
    dlg.innerHTML = `
      <div class="stack">
        <h2>⚔️ Duell mit ${esc(from)}</h2>
        ${duelCompareHtml(duel, r)}
        ${safariHint(info.code)}
        <div class="row">
          <button type="button" class="btn ghost" data-dlg="close">Schließen</button>
          <button type="button" class="btn" data-dlg="revenge">🔁 Neue Runde</button>
        </div>
      </div>`;
    dlg.querySelector('[data-dlg="revenge"]').onclick = () => { dlg.close(); ACTIONS['duel-revenge']({ dataset: { id } }); };
    if (win === 'me') setTimeout(() => showMascot('SIEG! 🏆', `gegen ${from}`), 400);
  } else {
    round.replyNeeded = true;
    dlg.innerHTML = `
      <div class="stack">
        <h2>⚔️ ${esc(from)} fordert dich heraus!</h2>
        <div class="card duel-card"><div class="duel-head">${res.s}/${res.n} in ${fmtTime(res.ms)}</div>
          <p class="muted">${esc(unit)} · ${words.length} Wörter – du bekommst genau dieselben. Schaffst du mehr?</p></div>
        ${safariHint(info.code)}
        <div class="row">
          <button type="button" class="btn ghost" data-dlg="close">Später</button>
          <button type="button" class="btn" data-dlg="play">⚔️ Annehmen</button>
        </div>
      </div>`;
    dlg.querySelector('[data-dlg="play"]').onclick = () => { dlg.close(); playDuelRound(duel, r); };
  }
  dlg.querySelector('[data-dlg="close"]').onclick = () => dlg.close();
  if (!dlg.open) dlg.showModal();
};

/* ---------- Lern-Buddy-Woche ---------- */

const TEAM_GOALS = [
  { id: 'days5', text: 'Jeder lernt an 5 Tagen', goal: 5, value: w => w.days.length },
  { id: 'xp500', text: 'Jeder sammelt 500 XP', goal: 500, value: w => w.xp },
  { id: 'rounds7', text: 'Jeder spielt 7 Runden', goal: 7, value: w => w.tracks },
];
const TEAM_MAX = 6;

function activeTeams() {
  const key = currentWeek().key;
  return Object.values(state.teams).filter(t => t.week === key);
}

// Eigenen Stand im Team aktualisieren
function refreshMyTeamValue(team) {
  const g = TEAM_GOALS.find(x => x.id === team.goal) || TEAM_GOALS[0];
  const me = team.members[state.deviceId] = team.members[state.deviceId] || { name: myName() };
  me.name = myName();
  me.value = g.value(currentWeek());
  me.at = Date.now();
  return g;
}

function checkTeamDone(team) {
  const g = refreshMyTeamValue(team);
  const members = Object.values(team.members);
  if (team.done || members.length < 2 || !members.every(m => m.value >= g.goal)) return false;
  team.done = true;
  state.stats.teams = (state.stats.teams || 0) + 1;
  state.stats.xp += 50;
  save();
  unlockBadges();
  confetti();
  showMascot('TEAM-SIEG! 👥', `${g.text} – geschafft!`);
  return true;
}

function teamCardHtml(team) {
  const g = refreshMyTeamValue(team);
  const ago = at => {
    const d = Math.round((startOfToday() - new Date(at).setHours(0, 0, 0, 0)) / DAY);
    return d <= 0 ? 'heute' : d === 1 ? 'gestern' : `vor ${d} Tagen`;
  };
  return `
    <div class="team-card ${team.done ? 'done' : ''}">
      <div class="goal-head"><span>👥 ${esc(g.text)}</span><span>${team.done ? '✅ geschafft' : `noch ${weeklyStatus().daysLeft} T.`}</span></div>
      ${Object.entries(team.members).map(([id, m]) => `
        <div class="team-member">
          <span>${id === state.deviceId ? '⭐ Du' : esc(m.name)} <small class="muted">${id === state.deviceId ? '' : `· Stand ${ago(m.at)}`}</small></span>
          <div class="progress small"><div class="progress-fill ${m.value >= g.goal ? 'gold' : ''}" style="width:${Math.min(100, m.value / g.goal * 100)}%"></div></div>
          <small>${Math.min(m.value, g.goal)} / ${g.goal}</small>
        </div>`).join('')}
      <button type="button" class="btn ghost" data-action="team-share" data-id="${team.id}">📤 ${Object.keys(team.members).length < 2 ? 'Freunde einladen' : 'Meinen Stand teilen'}</button>
    </div>`;
}

async function shareTeam(team) {
  const g = refreshMyTeamValue(team);
  save();
  const m = Object.entries(team.members).slice(0, TEAM_MAX).map(([id, x]) => [id, x.name, x.value, x.at]);
  const url = await shareLink({ t: 'team', id: team.id, week: team.week, g: team.goal, m });
  const invite = Object.keys(team.members).length < 2;
  openShareDialog({
    title: invite ? '👥 Freunde einladen' : '📤 Stand teilen',
    intro: `Ziel: <b>${esc(g.text)}</b>${invite ? ' – bis zu 6 Leute können mitmachen.' : ''}`,
    text: invite
      ? `👥 ${myName()} lädt dich zur Lern-Buddy-Woche ein: „${g.text}“. Machst du mit? Tippe auf den Link oder kopiere ihn in VocabFlix:`
      : `👥 Lern-Buddy-Woche: ${myName()} steht bei ${Math.min(team.members[state.deviceId].value, g.goal)}/${g.goal}. Hier ist der Team-Stand:`,
    url,
  });
}

ACTIONS['team-new'] = () => {
  const dlg = ensureDialog();
  dlg.innerHTML = `
    <div class="stack">
      <h2>👥 Lern-Buddy-Woche</h2>
      <p class="muted">Ihr setzt euch ein gemeinsames Ziel für diese Woche. Geschafft ist es erst, wenn <b>alle</b> es erreichen – dann gibt es für jeden 50 Bonus-XP.</p>
      <div class="pick-list">${TEAM_GOALS.map(g => `<button type="button" class="btn ghost" data-goal="${g.id}">${esc(g.text)}</button>`).join('')}</div>
      <button type="button" class="btn ghost" data-dlg="close">Abbrechen</button>
    </div>`;
  dlg.querySelector('[data-dlg="close"]').onclick = () => dlg.close();
  dlg.querySelectorAll('[data-goal]').forEach(b => {
    b.onclick = () => {
      const team = { id: uid(), week: currentWeek().key, goal: b.dataset.goal, members: {}, done: false };
      state.teams[team.id] = team;
      refreshMyTeamValue(team);
      save();
      dlg.close();
      rerenderHome();
      shareTeam(team);
    };
  });
  if (!dlg.open) dlg.showModal();
};
ACTIONS['team-share'] = el => shareTeam(state.teams[el.dataset.id]);

SHARE_HANDLERS.team = (p, info) => {
  const id = cleanText(p.id, 40);
  const g = TEAM_GOALS.find(x => x.id === p.g);
  if (!id || !g) { toast('Dieser Team-Link ist unvollständig.'); return; }
  const incoming = (Array.isArray(p.m) ? p.m : []).slice(0, TEAM_MAX)
    .map(x => Array.isArray(x) ? { id: cleanText(x[0], 40), name: cleanName(x[1]) || 'Jemand', value: Math.max(0, parseInt(x[2], 10) || 0), at: parseInt(x[3], 10) || 0 } : null)
    .filter(x => x && x.id && x.id !== state.deviceId);
  const week = cleanText(p.week, 12);
  const dlg = ensureDialog();
  if (week !== currentWeek().key) {
    dlg.innerHTML = `<div class="stack"><h2>👥 Lern-Buddy-Woche</h2><p class="muted">Diese Team-Woche ist schon vorbei. Startet doch gleich eine neue!</p>
      <button type="button" class="btn" data-dlg="close">OK</button></div>`;
    dlg.querySelector('[data-dlg="close"]').onclick = () => dlg.close();
    if (!dlg.open) dlg.showModal();
    return;
  }
  const merge = team => {
    for (const m of incoming) {
      const known = team.members[m.id];
      if (!known || (known.at || 0) <= m.at) team.members[m.id] = { name: m.name, value: m.value, at: m.at };
    }
  };
  const existing = state.teams[id];
  if (existing) {
    merge(existing);
    save();
    checkTeamDone(existing);
    rerenderHome();
    toast('👥 Team-Stand aktualisiert');
    return;
  }
  const inviter = incoming[0] ? incoming[0].name : 'Jemand';
  dlg.innerHTML = `
    <div class="stack">
      <h2>👥 ${esc(inviter)} lädt dich ein!</h2>
      <div class="card"><b>Lern-Buddy-Woche</b><p class="muted">Ziel: <b>${esc(g.text)}</b><br>Dabei: ${incoming.map(m => esc(m.name)).join(', ')}</p></div>
      ${safariHint(info.code)}
      <div class="row">
        <button type="button" class="btn ghost" data-dlg="close">Nein danke</button>
        <button type="button" class="btn" data-dlg="join">✅ Mitmachen</button>
      </div>
    </div>`;
  dlg.querySelector('[data-dlg="close"]').onclick = () => dlg.close();
  dlg.querySelector('[data-dlg="join"]').onclick = () => {
    const team = { id, week, goal: g.id, members: {}, done: false };
    merge(team);
    state.teams[id] = team;
    refreshMyTeamValue(team);
    save();
    dlg.close();
    rerenderHome();
    shareTeam(team); // gleich zurückmelden, dass man dabei ist
  };
  if (!dlg.open) dlg.showModal();
};

/* ---------- Hilfe-Paket ---------- */

function shakyWords() {
  return [...state.words]
    .filter(w => w.wrong > 0 || (w.right > 0 && w.box <= 1))
    .sort((a, b) => (b.wrong - b.right * 0.3) - (a.wrong - a.right * 0.3) || a.box - b.box)
    .slice(0, 8);
}

ACTIONS['help-new'] = async () => {
  const words = shakyWords();
  if (words.length < 3) {
    toast('Super – gerade hast du kaum Wackel-Wörter. Lern erst ein paar Runden!');
    return;
  }
  const url = await shareLink({ t: 'help', id: uid(), from: myName(), w: words.map(w => [w.en, w.de]) });
  state.stats.helpAsked = (state.stats.helpAsked || 0) + 1;
  save();
  openShareDialog({
    title: '🆘 Hilfe-Paket',
    intro: `Diese ${words.length} Wörter wackeln bei dir noch: ${words.map(w => `<b>${esc(w.en)}</b>`).join(', ')}. Ein Freund übt sie mit dir – zusammen lernt es sich leichter!`,
    text: `🆘 ${myName()} braucht Hilfe bei ${words.length} Vokabeln – übst du mit? Tippe auf den Link oder kopiere ihn in VocabFlix:`,
    url,
  });
};

SHARE_HANDLERS.help = (p, info) => {
  const id = cleanText(p.id, 40);
  const from = cleanName(p.from) || 'Jemand';
  const words = cleanWords(p.w, 12);
  if (!id || words.length < 3) { toast('Dieses Hilfe-Paket ist unvollständig.'); return; }
  const dlg = ensureDialog();
  dlg.innerHTML = `
    <div class="stack">
      <h2>🆘 ${esc(from)} braucht Hilfe!</h2>
      <p class="muted">Diese ${words.length} Wörter fallen ${esc(from)} schwer. Übst du mit? Danach kannst du ${esc(from)} einen Mutmach-Sticker schicken.</p>
      <ul class="import-list">${words.map(([en, de]) => `<li><b>${esc(en)}</b><span>${esc(de)}</span></li>`).join('')}</ul>
      ${safariHint(info.code)}
      <div class="row">
        <button type="button" class="btn ghost" data-dlg="close">Später</button>
        <button type="button" class="btn" data-dlg="play">💪 Mitüben</button>
      </div>
    </div>`;
  dlg.querySelector('[data-dlg="close"]').onclick = () => dlg.close();
  dlg.querySelector('[data-dlg="play"]').onclick = () => {
    dlg.close();
    const types = words.map((_, i) => ['mc_en_de', 'mc_de_en', 'type_de_en'][i % 3]);
    startCustomRound(words, {
      mode: 'help', unit: `Hilfe für ${from}`, types,
      onFinish: () => {
        const first = !state.helpedIds.includes(id);
        if (first) {
          state.helpedIds = [...state.helpedIds, id].slice(-100);
          state.stats.helped = (state.stats.helped || 0) + 1;
          state.stats.xp += 20;
          save();
          unlockBadges();
        }
        return {
          title: `Danke fürs Mitüben!`,
          html: `<div class="card duel-card"><div class="duel-head">🤝 Du hast ${esc(from)} geholfen${first ? ' · +20 XP' : ''}</div>
            <p class="muted">Schick ${esc(from)} einen Mutmach-Sticker!</p>
            <button type="button" class="btn" data-action="sticker-send" data-sticker="helped">💪 „Ich hab mit dir geübt!“ schicken</button></div>`,
          mascot: ['HELD*IN! 🤝', `für ${from}`],
        };
      },
    });
  };
  if (!dlg.open) dlg.showModal();
};

/* ---------- Sticker (feste Texte, keine freien Nachrichten) ---------- */

const STICKERS = [
  { id: 'fire', icon: '🔥', text: 'Weiter so!' },
  { id: 'strong', icon: '💪', text: 'Du schaffst das!' },
  { id: 'star', icon: '⭐', text: 'Stark gelernt!' },
  { id: 'party', icon: '🎉', text: 'Glückwunsch!' },
  { id: 'team', icon: '🤝', text: 'Wir schaffen das zusammen!' },
  { id: 'gg', icon: '🎮', text: 'GG!' },
  { id: 'horse', icon: '🐴', text: 'Hufe hoch!' },
  { id: 'beat', icon: '🎧', text: 'Voll im Takt!' },
  { id: 'brain', icon: '🧠', text: 'Vokabel-Profi!' },
  { id: 'helped', icon: '💪', text: 'Ich hab mit dir geübt!', hidden: true },
];

async function sendSticker(id) {
  const st = STICKERS.find(s => s.id === id);
  if (!st) return;
  const url = await shareLink({ t: 'sticker', from: myName(), s: id });
  state.stats.stickersSent = (state.stats.stickersSent || 0) + 1;
  save();
  unlockBadges();
  openShareDialog({
    title: `${st.icon} Sticker schicken`,
    intro: `„${esc(st.text)}“`,
    text: `${st.icon} ${myName()} schickt dir einen Sticker: „${st.text}“ – öffne ihn in VocabFlix:`,
    url,
  });
}

ACTIONS['sticker-new'] = () => {
  const dlg = ensureDialog();
  dlg.innerHTML = `
    <div class="stack">
      <h2>🎉 Sticker schicken</h2>
      <p class="muted">Feuer deine Freunde an!</p>
      <div class="sticker-grid">${STICKERS.filter(s => !s.hidden).map(s => `
        <button type="button" class="sticker" data-sticker="${s.id}"><span>${s.icon}</span><small>${esc(s.text)}</small></button>`).join('')}</div>
      <button type="button" class="btn ghost" data-dlg="close">Abbrechen</button>
    </div>`;
  dlg.querySelector('[data-dlg="close"]').onclick = () => dlg.close();
  dlg.querySelectorAll('[data-sticker]').forEach(b => { b.onclick = () => sendSticker(b.dataset.sticker); });
  if (!dlg.open) dlg.showModal();
};
ACTIONS['sticker-send'] = el => sendSticker(el.dataset.sticker);

SHARE_HANDLERS.sticker = p => {
  const st = STICKERS.find(s => s.id === p.s);
  if (!st) return;
  const from = cleanName(p.from) || 'Jemand';
  state.stickerLog = [...state.stickerLog, { from, s: st.id, at: Date.now() }].slice(-20);
  state.stats.stickersReceived = (state.stats.stickersReceived || 0) + 1;
  save();
  unlockBadges();
  const big = document.createElement('div');
  big.className = 'sticker-pop';
  big.innerHTML = `<span>${st.icon}</span><b>${esc(st.text)}</b><small>von ${esc(from)}</small>`;
  document.body.appendChild(big);
  setTimeout(() => big.remove(), 3200);
  beep(true);
  setTimeout(() => showMascot(`${st.icon} ${st.text}`, `von ${from}`), 900);
  rerenderHome();
};

// Team-Ziele nach jeder Runde prüfen
const finishBefore = ACTIONS.finish;
ACTIONS.finish = () => {
  activeTeams().forEach(checkTeamDone);
  save();
  finishBefore();
};
rerenderHome();
