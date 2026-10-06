/* Beat-Studio: einen eigenen Beat aus 16 Schritten bauen. Neue Spuren und Sound-Kits werden mit XP freigeschaltet.
   Der Beat kann als Lernmusik laufen und per Link geteilt werden (nur Zahlen, keine Texte). */
'use strict';

const STUDIO_ROWS = [
  { id: 'kick', icon: '🥁', name: 'Kick', xp: 0 },
  { id: 'hat', icon: '🎩', name: 'Hi-Hat', xp: 0 },
  { id: 'clap', icon: '👏', name: 'Clap', xp: 0 },
  { id: 'perc', icon: '🪇', name: 'Perkussion', xp: 300 },
  { id: 'bass', icon: '🎸', name: 'Bass', xp: 600, notes: true },
  { id: 'lead', icon: '🎹', name: 'Melodie', xp: 1000, notes: true },
];
const STUDIO_KITS = [
  { id: 'club', icon: '🎧', name: 'Club', xp: 0 },
  { id: 'chip', icon: '👾', name: 'Retro', xp: 300 },
  { id: 'rock', icon: '🤘', name: 'Rock', xp: 1600 },
];
const STUDIO_STEPS = 16;

function defaultStudio() {
  const row = fn => Array.from({ length: STUDIO_STEPS }, (_, i) => fn(i));
  return {
    kit: 'club', bpm: 120,
    kick: row(i => (i % 4 === 0 ? 1 : 0)),
    hat: row(i => (i % 4 === 2 ? 1 : 0)),
    clap: row(i => (i % 8 === 4 ? 1 : 0)),
    perc: row(() => 0),
    bass: row(i => (i % 4 === 2 ? 1 : 0)),
    lead: row(() => 0),
  };
}

// Prüft ein Pattern (auch aus einem Link) und bringt es in eine sichere Form
function cleanStudio(p) {
  if (!p || typeof p !== 'object') return null;
  const out = defaultStudio();
  out.kit = STUDIO_KITS.some(k => k.id === p.kit) ? p.kit : 'club';
  out.bpm = Math.max(70, Math.min(170, Math.round(Number(p.bpm) || 120)));
  for (const r of STUDIO_ROWS) {
    const src = Array.isArray(p[r.id]) ? p[r.id] : [];
    out[r.id] = Array.from({ length: STUDIO_STEPS }, (_, i) => {
      const v = Math.round(Number(src[i]) || 0);
      return r.notes ? Math.max(0, Math.min(5, v)) : (v ? 1 : 0);
    });
  }
  return out;
}

const rowUnlocked = r => state.stats.xp >= r.xp;
let studioHalf = 0;
let studioPlaying = false;

function studioPattern() {
  if (!state.studio) state.studio = defaultStudio();
  return state.studio;
}

function studioCellHtml(r, i, val) {
  const beat = i % 4 === 0 ? 'downbeat' : '';
  if (r.notes) return `<button type="button" class="step note ${val ? 'on' : ''} ${beat}" data-action="studio-step" data-row="${r.id}" data-step="${i}" style="--n:${val}">${val || ''}</button>`;
  return `<button type="button" class="step ${val ? 'on' : ''} ${beat}" data-action="studio-step" data-row="${r.id}" data-step="${i}" aria-label="${r.name} Schritt ${i + 1}"></button>`;
}

function renderStudio() {
  const p = studioPattern();
  const xp = state.stats.xp;
  const from = studioHalf * 8;
  const isMusic = state.settings.beatStyle === 'custom';
  view.innerHTML = `
    <div class="studio-head">
      <button type="button" class="icon-btn" data-action="goto" data-tab="home" aria-label="Zurück">←</button>
      <h1>🎛️ Beat-Studio</h1>
    </div>
    <div class="card stack studio">
      <div class="studio-play-row">
        <button type="button" class="btn ${studioPlaying ? 'red' : ''}" data-action="studio-play" id="studio-play">${studioPlaying ? '⏹ Stopp' : '▶ Abspielen'}</button>
        <label class="studio-bpm">Tempo <b id="studio-bpm-val">${p.bpm}</b> BPM
          <input type="range" id="studio-bpm" min="70" max="170" step="2" value="${p.bpm}"></label>
      </div>
      <div class="studio-dots" id="studio-dots">${Array.from({ length: STUDIO_STEPS }, (_, i) => `<i class="${Math.floor(i / 8) === studioHalf ? 'shown' : ''}"></i>`).join('')}</div>
      <div class="seg">
        <button type="button" class="${studioHalf === 0 ? 'on' : ''}" data-action="studio-half" data-half="0">Takt 1</button>
        <button type="button" class="${studioHalf === 1 ? 'on' : ''}" data-action="studio-half" data-half="1">Takt 2</button>
      </div>
      <div class="studio-grid" id="studio-grid">
        ${STUDIO_ROWS.map(r => rowUnlocked(r) ? `
          <div class="studio-row">
            <span class="studio-label" title="${r.name}">${r.icon}<small>${r.name}</small></span>
            <div class="steps">${p[r.id].slice(from, from + 8).map((v, k) => studioCellHtml(r, from + k, v)).join('')}</div>
          </div>` : `
          <div class="studio-row locked">
            <span class="studio-label">${r.icon}<small>${r.name}</small></span>
            <div class="steps-locked">🔒 ab ${r.xp} XP <small>(noch ${r.xp - xp})</small></div>
          </div>`).join('')}
      </div>
      <p class="hint">Tippe auf die Felder. Bei Bass und Melodie wählst du mit mehrmals Tippen die Tonhöhe 1–5.</p>
      <div class="row wrap">
        <button type="button" class="btn ghost small" data-action="studio-copy">📋 Takt 1 → Takt 2</button>
        <button type="button" class="btn ghost small" data-action="studio-idea">🎲 Idee</button>
        <button type="button" class="btn ghost small" data-action="studio-clear">🧹 Leeren</button>
      </div>
    </div>
    <div class="card stack">
      <h2>Sound-Kit</h2>
      <div class="kit-picker">${STUDIO_KITS.map(k => xp >= k.xp ? `
        <button type="button" class="vibe-card ${p.kit === k.id ? 'on' : ''}" data-action="studio-kit" data-kit="${k.id}"><span class="vibe-icon">${k.icon}</span><b>${k.name}</b></button>` : `
        <div class="vibe-card locked"><span class="vibe-icon">🔒</span><b>${k.name}</b><small>ab ${k.xp} XP</small></div>`).join('')}
      </div>
    </div>
    <div class="card stack">
      <button type="button" class="btn ${isMusic ? 'ghost' : ''}" data-action="studio-use">${isMusic ? '✅ Läuft als deine Lernmusik' : '🎵 Als Lernmusik verwenden'}</button>
      <button type="button" class="btn ghost" data-action="studio-share">📤 Beat an Freunde schicken</button>
      <p class="hint">Die Musik baut sich beim Lernen mit deiner Combo auf: erst Kick, dann Hi-Hat, Bass, Clap und zum Schluss die Melodie.</p>
    </div>`;
  $('#studio-bpm').addEventListener('input', e => {
    p.bpm = Number(e.target.value);
    $('#studio-bpm-val').textContent = p.bpm;
    Beat.setCustom(p);
    document.documentElement.style.setProperty('--beat', `${(60 / p.bpm).toFixed(3)}s`);
  });
  $('#studio-bpm').addEventListener('change', save);
}

// Lauflicht: zeigt, welcher Schritt gerade spielt
Beat.onStep(s => {
  const grid = document.getElementById('studio-grid');
  if (!grid || !studioPlaying) return;
  document.querySelectorAll('#studio-dots i').forEach((d, i) => d.classList.toggle('now', i === s));
  grid.querySelectorAll('.step.now').forEach(el => el.classList.remove('now'));
  grid.querySelectorAll(`.step[data-step="${s}"]`).forEach(el => el.classList.add('now'));
});

function studioStop() {
  studioPlaying = false;
  stopBeat();
}

ACTIONS['studio-play'] = () => {
  if (studioPlaying) {
    studioStop();
  } else {
    Beat.stop();
    Beat.setCustom(studioPattern());
    applyBeatStyle('custom');
    Beat.setVolume(state.settings.beatVolume);
    Beat.setLevel(Beat.MAX_LEVEL);
    Beat.start();
    document.body.classList.add('beat-on');
    studioPlaying = true;
  }
  const btn = $('#studio-play');
  btn.textContent = studioPlaying ? '⏹ Stopp' : '▶ Abspielen';
  btn.classList.toggle('red', studioPlaying);
};

ACTIONS['studio-step'] = el => {
  const p = studioPattern();
  const r = STUDIO_ROWS.find(x => x.id === el.dataset.row);
  const i = Number(el.dataset.step);
  if (!r || !rowUnlocked(r)) return;
  p[r.id][i] = r.notes ? (p[r.id][i] + 1) % 6 : (p[r.id][i] ? 0 : 1);
  const v = p[r.id][i];
  el.classList.toggle('on', !!v);
  if (r.notes) { el.textContent = v || ''; el.style.setProperty('--n', v); }
  save();
};

ACTIONS['studio-half'] = el => {
  studioHalf = Number(el.dataset.half) ? 1 : 0;
  renderStudio();
};

ACTIONS['studio-copy'] = () => {
  const p = studioPattern();
  STUDIO_ROWS.forEach(r => { for (let i = 0; i < 8; i++) p[r.id][i + 8] = p[r.id][i]; });
  save();
  renderStudio();
  toast('📋 Takt 2 ist jetzt wie Takt 1');
};

ACTIONS['studio-clear'] = () => {
  const p = studioPattern();
  STUDIO_ROWS.forEach(r => p[r.id].fill(0));
  save();
  renderStudio();
};

// Zufällige, aber gut klingende Idee – nur für freigeschaltete Spuren
ACTIONS['studio-idea'] = () => {
  const p = studioPattern();
  const ideas = {
    kick: [[0, 4, 8, 12], [0, 6, 8, 14], [0, 3, 8, 10], [0, 8, 11]],
    hat: [[2, 6, 10, 14], [0, 2, 4, 6, 8, 10, 12, 14], [2, 3, 6, 10, 11, 14]],
    clap: [[4, 12], [4, 12, 15], [12]],
    perc: [[3, 7, 11, 15], [5, 13], [1, 9, 10]],
  };
  const keep = r => rowUnlocked(r);
  STUDIO_ROWS.forEach(r => {
    if (!keep(r)) return;
    p[r.id].fill(0);
    if (ideas[r.id]) pick(ideas[r.id]).forEach(i => { p[r.id][i] = 1; });
  });
  const bassRow = STUDIO_ROWS.find(r => r.id === 'bass');
  if (keep(bassRow)) [2, 6, 10, 14].forEach((i, k) => { p.bass[i] = pick([[1, 1, 3, 4], [1, 3, 1, 5], [4, 4, 3, 1]])[k]; });
  const leadRow = STUDIO_ROWS.find(r => r.id === 'lead');
  if (keep(leadRow)) [0, 3, 6, 8, 11, 14].forEach(i => { if (Math.random() < 0.7) p.lead[i] = 1 + Math.floor(Math.random() * 5); });
  save();
  renderStudio();
};

ACTIONS['studio-kit'] = el => {
  const k = STUDIO_KITS.find(x => x.id === el.dataset.kit);
  if (!k || state.stats.xp < k.xp) return;
  studioPattern().kit = k.id;
  save();
  renderStudio();
};

ACTIONS['studio-use'] = () => {
  state.settings.beatStyle = 'custom';
  state.settings.beat = true;
  save();
  renderStudio();
  showMascot('🎛️ DEIN BEAT', 'Läuft jetzt beim Lernen');
};

/* ---------- Beat teilen ---------- */

const packRow = arr => arr.join('');
const unpackRow = str => (/^[0-5]{16}$/.test(String(str)) ? [...str].map(Number) : null);

ACTIONS['studio-share'] = async () => {
  const p = studioPattern();
  const rows = {};
  STUDIO_ROWS.forEach(r => { rows[r.id] = packRow(p[r.id]); });
  const url = await shareLink({ t: 'beat', from: myName(), k: p.kit, b: p.bpm, r: rows });
  state.stats.beatsShared = (state.stats.beatsShared || 0) + 1;
  save();
  openShareDialog({
    title: '📤 Beat teilen',
    intro: 'Deine Freunde können sich den Beat anhören und als eigene Lernmusik übernehmen.',
    text: `🎛️ ${myName()} hat einen eigenen Beat gebaut – hör mal rein! Tippe auf den Link oder kopiere ihn in VocabFlix:`,
    url,
  });
};

SHARE_HANDLERS.beat = (p, info) => {
  const rows = {};
  for (const r of STUDIO_ROWS) {
    const row = unpackRow(p.r && p.r[r.id]);
    if (!row) { toast('🤔 Dieser Beat-Link ist unvollständig.'); return; }
    rows[r.id] = row;
  }
  const pattern = cleanStudio({ kit: p.k, bpm: p.b, ...rows });
  const from = cleanName(p.from) || 'Jemand';
  const dlg = ensureDialog();
  dlg.innerHTML = `
    <div class="stack">
      <h2>🎛️ Beat von ${esc(from)}</h2>
      <p class="muted">${pattern.bpm} BPM · Sound-Kit ${esc((STUDIO_KITS.find(k => k.id === pattern.kit) || {}).name)}</p>
      <button type="button" class="btn ghost" data-dlg="listen">▶ Anhören</button>
      ${safariHint(info.code)}
      <div class="row">
        <button type="button" class="btn ghost" data-dlg="close">Schließen</button>
        <button type="button" class="btn" data-dlg="keep">💾 Übernehmen</button>
      </div>
      <p class="hint">Übernehmen ersetzt den Beat in deinem Studio.</p>
    </div>`;
  let playing = false;
  const listen = dlg.querySelector('[data-dlg="listen"]');
  const stopListen = () => { if (playing) { stopBeat(); playing = false; listen.textContent = '▶ Anhören'; } };
  listen.onclick = () => {
    if (playing) return stopListen();
    Beat.stop();
    Beat.setCustom(pattern);
    Beat.setStyle('custom');
    Beat.setVolume(state.settings.beatVolume);
    Beat.setLevel(Beat.MAX_LEVEL);
    Beat.start();
    playing = true;
    listen.textContent = '⏹ Stopp';
  };
  dlg.querySelector('[data-dlg="close"]').onclick = () => { stopListen(); dlg.close(); };
  dlg.querySelector('[data-dlg="keep"]').onclick = () => {
    stopListen();
    if (state.studio && !confirm('Deinen bisherigen Studio-Beat ersetzen?')) return;
    state.studio = pattern;
    state.stats.beatsReceived = (state.stats.beatsReceived || 0) + 1;
    save();
    dlg.close();
    toast(`🎛️ Beat von ${from} ist jetzt in deinem Studio`);
    if (!lesson && !onboarding) show('studio');
  };
  dlg.addEventListener('close', stopListen, { once: true });
  if (!dlg.open) dlg.showModal();
};

VIEWS.studio = () => {
  studioPlaying = false;
  renderStudio();
};
