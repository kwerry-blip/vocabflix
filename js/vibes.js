/* Vibes: Jedes Kind wählt seine Welt. Ein Vibe bündelt Musik, Look, Figur, Ränge, Belohnungen und Sprüche.
   Neue Vibes lassen sich hier als weiterer Eintrag ergänzen. */
'use strict';

const VIBES = {
  club: {
    id: 'club', name: 'Club', icon: '🎧', desc: 'Techno, House und Neon-Lichter',
    styles: ['techhouse', 'hardtekk', 'schranz'], defaultStyle: 'techhouse',
    mascot: 'zemi', themeColor: '#0d0b1e', dropLabel: 'DROP',
    homeIcon: '🎧', unitIcon: '💿',
    round: 'Track', rounds: 'Tracks', start: '▶ Track starten',
    done: 'Track fertig!', perfect: 'Fehlerfreier Mix!',
    rankLabel: 'Dein DJ-Rang',
    reward: 'Schallplatte', rewards: 'Schallplatten', rewardIcon: '💿',
    praise: ['Fett! 🔥', 'Banger! 💥', 'Voll im Takt! 🎶', 'Sauber! ✨', 'Stark! 💪', 'Nice! 😎', 'Läuft! 🚀'],
    wrong: ['Knapp daneben! 🎧', 'Aus dem Takt 😅', 'Nicht ganz – weiter geht’s!'],
    combo: ['Die Crowd tobt! 🙌', 'Unaufhaltsam! ⚡', 'Voll im Flow! 🌊'],
    ranks: [
      { xp: 0, name: 'Bedroom-DJ', icon: '🎧' },
      { xp: 100, name: 'Party-DJ', icon: '🪩' },
      { xp: 300, name: 'Schuldisco-DJ', icon: '🏫' },
      { xp: 600, name: 'Warm-up-DJ', icon: '🎚️' },
      { xp: 1000, name: 'Club-DJ', icon: '🎛️' },
      { xp: 1600, name: 'Resident-DJ', icon: '💿' },
      { xp: 2500, name: 'Radio-DJ', icon: '📻' },
      { xp: 4000, name: 'Club-Headliner', icon: '🌃' },
      { xp: 6000, name: 'Festival-DJ', icon: '🎪' },
      { xp: 9000, name: 'Festival-Headliner', icon: '🎆' },
      { xp: 13000, name: 'Welttournee', icon: '🌍' },
      { xp: 18000, name: 'DJ-Legende', icon: '👑' },
    ],
  },

  gaming: {
    id: 'gaming', name: 'Gaming', icon: '🎮', desc: 'Retro-Games und 8-Bit-Musik',
    styles: ['chiptune'], defaultStyle: 'chiptune',
    mascot: 'pixel', themeColor: '#0f1430', dropLabel: 'BOOST',
    homeIcon: '🎮', unitIcon: '🕹️',
    round: 'Level', rounds: 'Level', start: '▶ Level starten',
    done: 'Level geschafft!', perfect: 'Perfekter Run!',
    rankLabel: 'Dein Spieler-Rang',
    reward: 'Pokal', rewards: 'Pokale', rewardIcon: '🏆',
    praise: ['GG! 🎮', 'Treffer! 🎯', 'Power-Up! ⭐', 'Extraleben! 💚', 'Krasser Move! 😎', 'Combo! ⚡'],
    wrong: ['Daneben! 👾', 'Respawn! 🔄', 'Kein Game Over – weiter!'],
    combo: ['Unbesiegbar! ⭐', 'Highscore-Jagd! 🏁', 'Turbo-Modus! ⚡'],
    ranks: [
      { xp: 0, name: 'Noob', icon: '🥚' },
      { xp: 100, name: 'Rookie', icon: '🐣' },
      { xp: 300, name: 'Spieler', icon: '🎮' },
      { xp: 600, name: 'Zocker', icon: '🕹️' },
      { xp: 1000, name: 'Profi', icon: '🎯' },
      { xp: 1600, name: 'Speedrunner', icon: '⏱️' },
      { xp: 2500, name: 'Champion', icon: '🏅' },
      { xp: 4000, name: 'Highscore-Jäger', icon: '📈' },
      { xp: 6000, name: 'Boss-Bezwinger', icon: '⚔️' },
      { xp: 9000, name: 'Endboss', icon: '👾' },
      { xp: 13000, name: 'Weltrekord', icon: '🌍' },
      { xp: 18000, name: 'Gaming-Legende', icon: '👑' },
    ],
  },

  horse: {
    id: 'horse', name: 'Pferde', icon: '🐴', desc: 'Reiterhof, Galopp und Natur',
    styles: ['acoustic'], defaultStyle: 'acoustic',
    mascot: 'horse', themeColor: '#fff8ee', dropLabel: 'GALOPP',
    homeIcon: '🐴', unitIcon: '🏇',
    round: 'Ausritt', rounds: 'Ausritte', start: '▶ Ausritt starten',
    done: 'Ausritt geschafft!', perfect: 'Fehlerfreier Ritt!',
    rankLabel: 'Dein Reiter-Rang',
    reward: 'Schleife', rewards: 'Schleifen', rewardIcon: '🎀',
    praise: ['Super geritten! 🐎', 'Volltreffer! 🎯', 'Klasse! 🌟', 'Wie im Galopp! 💨', 'Spitze! 🏆', 'Toll! 🥕'],
    wrong: ['Kleiner Stolperer! 🐴', 'Nicht ganz – Kopf hoch!', 'Gleich nochmal! 🌱'],
    combo: ['Volle Galopp-Power! 💨', 'Wie auf dem Turnier! 🏆', 'Dein Pferd strahlt! 🌟'],
    ranks: [
      { xp: 0, name: 'Stallhilfe', icon: '🧹' },
      { xp: 100, name: 'Pony-Pflege', icon: '🥕' },
      { xp: 300, name: 'Erster Ausritt', icon: '🐴' },
      { xp: 600, name: 'Trab-Talent', icon: '🌾' },
      { xp: 1000, name: 'Galopp-Ass', icon: '💨' },
      { xp: 1600, name: 'Spring-Star', icon: '⭐' },
      { xp: 2500, name: 'Turnier-Start', icon: '🎀' },
      { xp: 4000, name: 'Turnier-Sieg', icon: '🏆' },
      { xp: 6000, name: 'Hof-Champion', icon: '🥇' },
      { xp: 9000, name: 'Meisterschaft', icon: '🏅' },
      { xp: 13000, name: 'Pferdeflüster-Profi', icon: '🌟' },
      { xp: 18000, name: 'Legende des Reiterhofs', icon: '👑' },
    ],
  },
};

// Farben für Figuren
const HERO_COLORS = [
  { id: 'red', name: 'Rot', color: '#ff4757' },
  { id: 'blue', name: 'Blau', color: '#1e90ff' },
  { id: 'green', name: 'Grün', color: '#2ed573' },
  { id: 'purple', name: 'Lila', color: '#a55eea' },
];
const HORSE_COLORS = [
  { id: 'fuchs', name: 'Fuchs', color: '#c0662b', mane: '#8a3f12' },
  { id: 'rappe', name: 'Rappe', color: '#3b3236', mane: '#1d1719' },
  { id: 'schimmel', name: 'Schimmel', color: '#f1ede6', mane: '#c9c2b8' },
  { id: 'falbe', name: 'Falbe', color: '#e2b867', mane: '#6b4a22' },
];

function vibe() {
  return VIBES[state.settings.vibe] || VIBES.club;
}

// Vibe auf Oberfläche anwenden (Farben, Statusleiste, Tab-Symbol)
function applyVibeTheme() {
  const v = vibe();
  document.body.dataset.vibe = v.id;
  document.body.classList.toggle('easy', !!state.settings.easyTyping);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', v.themeColor);
  const homeIcon = document.querySelector('#tabbar [data-tab="home"] .ti');
  if (homeIcon) homeIcon.textContent = v.homeIcon;
}

function setVibe(id) {
  const v = VIBES[id] || VIBES.club;
  state.settings.vibe = v.id;
  if (!v.styles.includes(state.settings.beatStyle) && state.settings.beatStyle !== 'mix') state.settings.beatStyle = v.defaultStyle;
  save();
  applyVibeTheme();
}
