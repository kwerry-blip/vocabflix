/* Stall für den Pferde-Vibe: Karotten verdienen (1 pro richtige Antwort), füttern, bürsten, Tricks und Ausrüstung.
   Das Pferd ist nie traurig – es freut sich nur mal mehr und mal weniger. */
'use strict';

function ensureHorse() {
  if (!state.horse) state.horse = { spent: 0, fed: 0, brushed: 0, owned: [], on: {} };
  return state.horse;
}
ensureHorse();

const PAD_COLORS = { rosa: '#ff8fc7', tuerkis: '#3ddbd9', lila: '#9b6dff', gold: '#ffc83d' };

const HORSE_ITEMS = [
  { id: 'pad-rosa', slot: 'pad', value: 'rosa', icon: '🩷', name: 'Rosa Decke', cost: 20 },
  { id: 'pad-tuerkis', slot: 'pad', value: 'tuerkis', icon: '🩵', name: 'Türkise Decke', cost: 20 },
  { id: 'pad-lila', slot: 'pad', value: 'lila', icon: '💜', name: 'Lila Decke', cost: 30 },
  { id: 'bow', slot: 'bow', value: true, icon: '🎀', name: 'Mähnen-Schleife', cost: 50 },
  { id: 'crown', slot: 'crown', value: true, icon: '🌸', name: 'Blumenkranz', cost: 80 },
  { id: 'stars', slot: 'stars', value: true, icon: '⭐', name: 'Sternen-Decke', cost: 120 },
  { id: 'pad-gold', slot: 'pad', value: 'gold', icon: '💛', name: 'Gold-Decke', cost: 150 },
  { id: 'hooves', slot: 'hooves', value: true, icon: '✨', name: 'Glitzer-Hufe', cost: 200 },
];

// Tricks werden mit dem Reiter-Rang freigeschaltet
const HORSE_TRICKS = [
  { id: 'bow', icon: '🙇', name: 'Verbeugen', rank: 1 },
  { id: 'rear', icon: '🌟', name: 'Steigen', rank: 3 },
  { id: 'spanish', icon: '💃', name: 'Spanischer Schritt', rank: 5 },
  { id: 'spin', icon: '🌀', name: 'Pirouette', rank: 7 },
];

const FEED_COST = 5;
const horseName = () => state.settings.horseName || 'dein Pferd';
const cap = t => t.charAt(0).toUpperCase() + t.slice(1); // Satzanfang groß, auch bei „dein Pferd“

function carrots() {
  const earned = state.words.reduce((sum, w) => sum + (w.right || 0), 0);
  return Math.max(0, earned - ensureHorse().spent);
}

function stableSay(text) {
  const b = $('#stable-bubble');
  if (b) {
    b.textContent = text;
    b.classList.remove('pop');
    void b.offsetWidth;
    b.classList.add('pop');
  }
}

function stableAnimate(cls, ms = 1600) {
  const h = $('#stable-horse');
  if (!h) return;
  h.className = 'stable-horse';
  void h.offsetWidth;
  h.classList.add(cls);
  setTimeout(() => h.classList.remove(cls), ms);
}

function stableGreeting() {
  const n = horseName();
  const c = carrots();
  if (c >= FEED_COST) return `${cap(n)} schnuppert – du hast ${c} Karotten dabei! 🥕`;
  return pick([`${cap(n)} freut sich, dass du da bist! 💕`, `${cap(n)} wiehert fröhlich zur Begrüßung.`, `${cap(n)} stupst dich mit der Nase an. 🐴`]);
}

function renderStable() {
  const h = ensureHorse();
  const c = carrots();
  const rank = rankFor(state.stats.xp);
  view.innerHTML = `
    <div class="studio-head">
      <button type="button" class="icon-btn" data-action="goto" data-tab="home" aria-label="Zurück">←</button>
      <h1>🏡 ${state.settings.horseName ? `Stall von ${esc(horseName())}` : 'Dein Stall'}</h1>
    </div>
    <div class="card stable-stage">
      <div class="stable-bubble" id="stable-bubble">${esc(stableGreeting())}</div>
      <div class="stable-horse" id="stable-horse">${horseSvg({ poles: false })}</div>
      <div class="stable-ground"></div>
    </div>
    <div class="stat-row">
      <div class="stat"><span class="stat-icon">🥕</span><b id="carrot-count">${c}</b><small>Karotten</small></div>
      <div class="stat"><span class="stat-icon">😋</span><b>${h.fed}</b><small>gefüttert</small></div>
      <div class="stat"><span class="stat-icon">✨</span><b>${h.brushed}</b><small>gebürstet</small></div>
    </div>
    <div class="social-grid stable-actions">
      <button type="button" class="social-btn" data-action="horse-feed"><span>🥕</span>Füttern (${FEED_COST})</button>
      <button type="button" class="social-btn" data-action="horse-brush"><span>🧽</span>Bürsten</button>
      <button type="button" class="social-btn" data-action="horse-pet"><span>💕</span>Streicheln</button>
      <button type="button" class="social-btn" data-action="start" data-unit=""><span>🏇</span>Ausreiten</button>
    </div>
    <p class="hint center">Für jede richtige Antwort beim Lernen bekommst du eine Karotte. 🥕</p>

    <div class="card stack">
      <h2>🎪 Tricks</h2>
      <div class="trick-grid">${HORSE_TRICKS.map(t => rank.index >= t.rank ? `
        <button type="button" class="social-btn" data-action="horse-trick" data-trick="${t.id}"><span>${t.icon}</span>${t.name}</button>` : `
        <div class="social-btn locked"><span>🔒</span>${t.name}<small>ab ${esc(vibe().ranks[t.rank].name)}</small></div>`).join('')}
      </div>
    </div>

    <div class="card stack">
      <h2>🧺 Sattelkammer</h2>
      <div class="item-grid">${HORSE_ITEMS.map(it => {
        const owned = h.owned.includes(it.id);
        const worn = h.on[it.slot] === it.value;
        return `
        <button type="button" class="item ${worn ? 'on' : ''} ${!owned && c < it.cost ? 'poor' : ''}" data-action="horse-item" data-item="${it.id}">
          <span class="item-icon">${it.icon}</span><b>${it.name}</b>
          <small>${worn ? '✅ angelegt' : owned ? 'Anlegen' : `🥕 ${it.cost}`}</small>
        </button>`;
      }).join('')}</div>
    </div>`;
}

ACTIONS['horse-feed'] = () => {
  if (carrots() < FEED_COST) {
    stableSay(`${cap(horseName())} wartet geduldig auf die nächsten Karotten. Lern eine Runde, dann gibt’s Nachschub! 🥕`);
    stableAnimate('nod', 900);
    return;
  }
  ensureHorse().spent += FEED_COST;
  state.horse.fed++;
  save();
  $('#carrot-count').textContent = carrots();
  stableAnimate('eat', 1400);
  stableSay(pick([`Mmmh! ${horseName()} mampft glücklich. 😋`, `${cap(horseName())} liebt Karotten! 🥕💕`, 'Knusper, knusper – lecker!']));
  beep(true);
};

ACTIONS['horse-brush'] = () => {
  ensureHorse().brushed++;
  save();
  stableAnimate('shine', 1500);
  stableSay(pick([`${cap(horseName())} glänzt wie neu! ✨`, 'Das Fell ist jetzt superweich. ✨', `${cap(horseName())} genießt das Bürsten. 😌`]));
};

ACTIONS['horse-pet'] = () => {
  stableAnimate('love', 1500);
  stableSay(pick([`${cap(horseName())} kuschelt sich an dich. 💕`, 'Ein zufriedenes Schnauben! 🐴', `${cap(horseName())} hat dich lieb!`]));
};

ACTIONS['horse-trick'] = el => {
  const t = HORSE_TRICKS.find(x => x.id === el.dataset.trick);
  if (!t || rankFor(state.stats.xp).index < t.rank) return;
  stableAnimate(`trick-${t.id}`, 1800);
  stableSay(`${t.icon} ${t.name}! Bravo, ${horseName()}! 👏`);
};

ACTIONS['horse-item'] = el => {
  const it = HORSE_ITEMS.find(x => x.id === el.dataset.item);
  if (!it) return;
  const h = ensureHorse();
  if (!h.owned.includes(it.id)) {
    if (carrots() < it.cost) {
      stableSay(`Dafür brauchst du ${it.cost} Karotten – noch ${it.cost - carrots()} sammeln! 🥕`);
      return;
    }
    if (!confirm(`${it.name} für ${it.cost} Karotten kaufen?`)) return;
    h.spent += it.cost;
    h.owned = [...h.owned, it.id];
  }
  h.on = { ...h.on };
  if (h.on[it.slot] === it.value) delete h.on[it.slot];
  else h.on[it.slot] = it.value;
  save();
  renderStable();
  stableAnimate('love', 1500);
  stableSay(h.on[it.slot] === it.value ? `${it.icon} Steht ${horseName()} super!` : `${it.name} hängt wieder in der Sattelkammer.`);
};

VIEWS.stable = renderStable;

/* ---------- Startseite: Extras ---------- */

function extrasHtml() {
  const isHorse = vibe().id === 'horse';
  return `
    <div class="card extras">
      <div class="social-grid">
        ${isHorse ? `<button type="button" class="social-btn stable-btn" data-action="goto" data-tab="stable"><span>🏡</span>${state.settings.horseName ? `Stall von ${esc(horseName())}` : 'Dein Stall'}<small>🥕 ${carrots()}</small></button>` : ''}
        <button type="button" class="social-btn" data-action="goto" data-tab="studio"><span>🎛️</span>Beat-Studio<small>${state.studio ? 'Dein Beat' : 'Neu!'}</small></button>
      </div>
    </div>`;
}

if (!lesson && !onboarding && currentTab === 'home') renderHome();
