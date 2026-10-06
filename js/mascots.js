/* Figuren, die mit einer Punktetafel über den Bildschirm laufen: Zemi (Club), Pixel-Held (Gaming), Pferd (Pferde). */
'use strict';

/* ---------- Zemi: Manga-DJ-Girl ---------- */

const ZEMI_SVG = `
<svg class="mascot-figure" viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="zemi-hair" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8b4dff"/><stop offset="1" stop-color="#ff2bd6"/>
    </linearGradient>
    <linearGradient id="zemi-iris" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a1466"/><stop offset=".6" stop-color="#b43cff"/><stop offset="1" stop-color="#ff7ae6"/>
    </linearGradient>
  </defs>
  <g stroke="#23123a" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <!-- lange Zöpfe mit Farbverlauf -->
    <path class="mascot-tail mascot-tail-l" d="M38 44 Q20 62 24 96 Q27 124 18 146 Q34 132 36 104 Q38 78 44 58 Z" fill="url(#zemi-hair)"/>
    <path class="mascot-tail mascot-tail-r" d="M82 44 Q100 62 96 96 Q93 124 102 146 Q86 132 84 104 Q82 78 76 58 Z" fill="url(#zemi-hair)"/>
    <!-- Beine: Leggings und Plateau-Sneaker -->
    <g class="mascot-leg mascot-leg-l">
      <rect x="48" y="150" width="9" height="30" fill="#2a2150"/>
      <path d="M43 178 h16 v9 h-18 Z" fill="#ffffff"/>
      <rect x="41" y="186" width="19" height="6" rx="2" fill="#b6ff3b"/>
    </g>
    <g class="mascot-leg mascot-leg-r">
      <rect x="63" y="150" width="9" height="30" fill="#2a2150"/>
      <path d="M61 178 h16 v9 h-18 Z" fill="#ffffff"/>
      <rect x="60" y="186" width="19" height="6" rx="2" fill="#b6ff3b"/>
    </g>
    <!-- Arme in Jackenärmeln halten die Tafel -->
    <path d="M46 100 L30 62 L25 9" fill="none" stroke-width="12"/>
    <path d="M74 100 L90 62 L95 9" fill="none" stroke-width="12"/>
    <path d="M46 100 L30 62 L25 9" fill="none" stroke="#00d9ff" stroke-width="7"/>
    <path d="M74 100 L90 62 L95 9" fill="none" stroke="#00d9ff" stroke-width="7"/>
    <circle cx="25" cy="8" r="5.5" fill="#ffe0cc"/>
    <circle cx="95" cy="8" r="5.5" fill="#ffe0cc"/>
    <!-- Faltenrock (knielang) -->
    <path d="M44 128 L76 128 L86 156 L34 156 Z" fill="#3b2a7a"/>
    <path d="M45 140 L42 156 M52 131 L50 156 M60 131 L60 156 M68 131 L70 156 M75 140 L78 156" fill="none" stroke-width="1.4" stroke="#6b56c9"/>
    <path d="M34 156 L86 156" fill="none" stroke="#ff2bd6" stroke-width="3"/>
    <!-- Bomberjacke über T-Shirt -->
    <path d="M44 92 L76 92 L79 130 L41 130 Z" fill="#00d9ff"/>
    <path d="M52 92 L68 92 L66 130 L54 130 Z" fill="#ff2bd6"/>
    <path d="M60 104 l2.4 5 5.4.6 -4 3.7 1.1 5.3 -4.9-2.7 -4.9 2.7 1.1-5.3 -4-3.7 5.4-.6 Z" fill="#ffd400" stroke-width="1.2"/>
    <rect x="41" y="126" width="38" height="5" rx="2" fill="#0092b3"/>
    <!-- Kopfhörer um den Hals -->
    <path d="M47 90 Q60 100 73 90" fill="none" stroke="#ff2bd6" stroke-width="4"/>
    <ellipse cx="46" cy="91" rx="5" ry="6.5" fill="#ff2bd6"/>
    <ellipse cx="74" cy="91" rx="5" ry="6.5" fill="#ff2bd6"/>
    <!-- Kopf (Manga-Proportionen) -->
    <rect x="55" y="78" width="10" height="10" fill="#ffe0cc" stroke="none"/>
    <path d="M38 52 Q38 28 60 28 Q82 28 82 52 Q82 72 60 84 Q38 72 38 52 Z" fill="#ffe0cc"/>
    <!-- Pony mit Strähnen -->
    <path d="M36 52 Q34 24 60 22 Q86 24 84 52 L80 43 L75 46 L69 37 L63 44 L57 37 L51 44 L45 42 L40 50 Z" fill="url(#zemi-hair)"/>
    <path d="M48 30 Q56 26 64 28" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>
    <!-- Haarspange (Stern) -->
    <path d="M78 30 l2 4.2 4.6.5 -3.4 3.1 1 4.5 -4.2-2.3 -4.2 2.3 1-4.5 -3.4-3.1 4.6-.5 Z" fill="#b6ff3b" stroke-width="1.2"/>
    <!-- Manga-Augen: links offen, rechts zwinkert -->
    <g stroke="none">
      <ellipse cx="50" cy="59" rx="6" ry="8" fill="url(#zemi-iris)"/>
      <ellipse cx="50" cy="61" rx="2.8" ry="3.8" fill="#23123a"/>
      <circle cx="52.5" cy="55.5" r="2.4" fill="#fff"/>
      <circle cx="47.6" cy="63.5" r="1.2" fill="#fff"/>
    </g>
    <path d="M42 54 Q49 48.5 57 51.5" fill="none" stroke-width="2.8"/>
    <g class="mascot-wink">
      <g stroke="none">
        <ellipse cx="70" cy="59" rx="6" ry="8" fill="url(#zemi-iris)"/>
        <ellipse cx="70" cy="61" rx="2.8" ry="3.8" fill="#23123a"/>
        <circle cx="72.5" cy="55.5" r="2.4" fill="#fff"/>
        <circle cx="67.6" cy="63.5" r="1.2" fill="#fff"/>
      </g>
      <path d="M63 51.5 Q71 48.5 78 54" fill="none" stroke-width="2.8"/>
    </g>
    <!-- Wangen, Nase, Lächeln -->
    <g stroke="none">
      <ellipse cx="44" cy="69" rx="4" ry="2" fill="#ff8fc8" opacity=".75"/>
      <ellipse cx="76" cy="69" rx="4" ry="2" fill="#ff8fc8" opacity=".75"/>
    </g>
    <path d="M60 66 l-1 2.4" fill="none" stroke-width="1.4"/>
    <path d="M55 72 Q60 77.5 65 72 Z" fill="#e0245e" stroke-width="1.8"/>
  </g>
</svg>`;

/* ---------- Pixel-Held: 12×16-Sprite, Farbe wählbar ---------- */

const HERO_SPRITE = [
  'K..........K',
  'T..........T',
  'T..CCCCCC..T',
  'T.CCCCCCCCCT',
  'T.BBKKKKKB.T',
  'T.BKEKKEKK.T',
  '.TKKKKKKKKT.',
  '.TKKKMMKKKT.',
  '..TKKKKKKT..',
  '..TTTTTTTT..',
  '..TTTLLTTT..',
  '..TTTTTTTT..',
  '..PPPPPPPP..',
  '..PPP..PPP..',
  '..PPP..PPP..',
  '.WWWW..WWWW.',
];

function heroSvg() {
  const shirt = (HERO_COLORS.find(c => c.id === state.settings.heroColor) || HERO_COLORS[1]).color;
  const pal = { K: '#ffd2b0', T: shirt, C: '#2b2b2b', B: '#6b3e1f', E: '#1b1b1b', M: '#c2185b', L: '#ffd32a', P: '#2f4a9e', W: '#ffffff' };
  const px = (rows, from, to) => rows.slice(from, to).flatMap((row, y) => [...row].map((ch, x) =>
    pal[ch] ? `<rect x="${x}" y="${y + from}" width="1.02" height="1.02" fill="${pal[ch]}"/>` : '')).join('');
  // Beine getrennt, damit sie abwechselnd hüpfen
  const legs = side => HERO_SPRITE.slice(13).map((row, i) => [...row].map((ch, x) =>
    pal[ch] && (side === 'l' ? x < 6 : x >= 6) ? `<rect x="${x}" y="${i + 13}" width="1.02" height="1.02" fill="${pal[ch]}"/>` : '').join('')).join('');
  return `
<svg class="mascot-figure pixel" viewBox="-1 -1 14 18" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">
  ${px(HERO_SPRITE, 0, 13)}
  <g class="mascot-hop mascot-hop-l">${legs('l')}</g>
  <g class="mascot-hop mascot-hop-r">${legs('r')}</g>
</svg>`;
}

/* ---------- Pferd: läuft im Trab, trägt die Tafel auf dem Sattel ---------- */

function horseSvg() {
  const c = HORSE_COLORS.find(h => h.id === state.settings.horseColor) || HORSE_COLORS[0];
  const leg = (x, cls) => `
    <g class="mascot-leg ${cls}">
      <rect x="${x}" y="82" width="9" height="34" rx="3" fill="${c.color}"/>
      <rect x="${x - 1}" y="112" width="11" height="7" rx="2" fill="#3b2a20"/>
    </g>`;
  return `
<svg class="mascot-figure horse" viewBox="0 0 160 124" xmlns="http://www.w3.org/2000/svg">
  <g stroke="#3b2a20" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">
    <!-- Stangen für die Tafel -->
    <path d="M66 52 L66 0 M94 52 L94 0" stroke="#8a5a2b" stroke-width="4"/>
    <!-- Schweif -->
    <path class="mascot-tail" d="M34 60 Q14 64 12 92 Q22 82 30 84 Q24 96 26 104 Q38 86 40 68 Z" fill="${c.mane}"/>
    ${leg(38, 'mascot-leg-l')}${leg(104, 'mascot-leg-r')}
    ${leg(50, 'mascot-leg-r')}${leg(116, 'mascot-leg-l')}
    <!-- Körper -->
    <ellipse cx="80" cy="72" rx="46" ry="23" fill="${c.color}"/>
    <!-- Hals und Kopf -->
    <path d="M106 66 Q112 40 126 24 L142 30 Q132 50 124 78 Z" fill="${c.color}"/>
    <path d="M124 22 Q138 12 152 26 Q160 38 154 46 Q148 50 138 44 Q128 36 124 22 Z" fill="${c.color}"/>
    <ellipse cx="153" cy="42" rx="6" ry="5" fill="#f3c9b0"/>
    <path d="M127 22 L128 8 L136 18 Z" fill="${c.color}"/>
    <!-- Mähne -->
    <path d="M124 20 Q114 30 108 44 Q104 54 104 62 Q110 54 112 48 Q116 40 120 36 Q122 30 128 26 Z" fill="${c.mane}"/>
    <path d="M126 20 Q132 14 140 18 Q132 18 130 24 Z" fill="${c.mane}"/>
    <!-- Auge mit Wimpern -->
    <g stroke="none">
      <ellipse cx="141" cy="30" rx="3.6" ry="4.2" fill="#2a1a12"/>
      <circle cx="142.4" cy="28.4" r="1.4" fill="#fff"/>
      <ellipse cx="147" cy="40" rx="3" ry="1.6" fill="#ff9db5" opacity=".7"/>
    </g>
    <path d="M137 25 l-2 -3 M140 24 l-.5 -3.4 M143 24.5 l1 -3" fill="none" stroke-width="1.4"/>
    <path d="M151 46 Q154 49 157 46" fill="none" stroke-width="1.6"/>
    <circle cx="156" cy="40" r=".9" fill="#3b2a20" stroke="none"/>
    <!-- Satteldecke und Sattel -->
    <path d="M60 50 Q80 46 100 50 L102 72 Q80 76 58 72 Z" fill="var(--primary, #e07a2f)"/>
    <path d="M64 50 Q80 44 96 50 Q90 58 80 58 Q70 58 64 50 Z" fill="#7a4a24"/>
  </g>
</svg>`;
}

/* ---------- Comic-Figuren-Baukasten (Hip-Hop, Pop, Metal, K-Pop) ---------- */

const KIDS = {
  hiphop: { name: 'MC Flo', skin: '#8d5524', hair: '#1d130c', hairStyle: 'cap', cap: '#ffb400', top: '#ff6b35', bottom: '#3a5a98', shoes: '#ffffff', sole: '#ffb400', accessory: 'chain' },
  pop: { name: 'Stella', skin: '#ffe0cc', hair: '#f5c542', hairStyle: 'ponytail', top: '#ff4fa3', bottom: '#8a5cff', shoes: '#ffffff', sole: '#ff4fa3', accessory: 'headset', skirt: true },
  metal: { name: 'Rita Riff', skin: '#e0ac69', hair: '#2a1a1a', hairStyle: 'long', top: '#1e1e1e', bottom: '#2f3b52', shoes: '#3a2a2a', sole: '#ff3b30', accessory: 'guitar' },
  kpop: { name: 'Jun', skin: '#f6d3b3', hair: '#a5d8ff', hairStyle: 'swoop', top: '#ffffff', bottom: '#b197fc', shoes: '#ffffff', sole: '#ff6ec7', accessory: 'earpiece', jacket: '#ffc9e3' },
};

function kidSvg(k) {
  const outline = 'stroke="#23123a" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
  // Haare hinter dem Kopf (lange Haare, Pferdeschwanz)
  const hairBack = {
    long: '',
    ponytail: `<path class="mascot-tail mascot-tail-r" d="M76 26 Q100 18 98 48 Q96 66 86 76 Q92 56 86 42 Q82 34 74 32 Z" fill="${k.hair}"/>`,
  }[k.hairStyle] || '';
  // Haare vorne bzw. Kappe
  const hairFront = {
    cap: `<path d="M38 50 Q38 30 60 28 Q82 30 82 50 Z" fill="${k.hair}"/>
          <path d="M36 46 Q38 22 60 22 Q82 22 84 46 Q60 40 36 46 Z" fill="${k.cap}"/>
          <path d="M36 44 Q24 44 22 50 Q30 52 40 48 Z" fill="${k.cap}"/>
          <circle cx="60" cy="23" r="2.5" fill="${k.cap}"/>`,
    ponytail: `<path d="M37 54 Q34 26 60 24 Q86 26 83 54 Q76 38 62 36 Q50 42 37 54 Z" fill="${k.hair}"/>
               <path d="M74 26 l2.5 -6 l2.5 6 l-5 0 Z" fill="#ffd400" stroke-width="1.2"/>`,
    long: `<path d="M36 56 Q34 24 60 24 Q86 24 84 56 Q80 40 70 36 Q62 42 60 36 Q58 42 50 36 Q40 40 36 56 Z" fill="${k.hair}"/>`,
    swoop: `<path d="M36 52 Q32 24 58 22 Q88 22 85 50 Q80 36 68 34 Q56 44 40 44 Q38 48 36 52 Z" fill="${k.hair}"/>
            <path d="M46 30 Q58 24 70 28" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>`,
  }[k.hairStyle] || '';
  const legs = k.skirt
    ? `<rect x="48" y="150" width="9" height="30" fill="${k.skin}"/><rect x="63" y="150" width="9" height="30" fill="${k.skin}"/>`
    : `<rect x="46" y="128" width="12" height="52" fill="${k.bottom}"/><rect x="62" y="128" width="12" height="52" fill="${k.bottom}"/>`;
  const shoes = side => `<g class="mascot-leg mascot-leg-${side}">
      <path d="M${side === 'l' ? 42 : 61} 178 h18 v8 h-20 Z" fill="${k.shoes}"/>
      <rect x="${side === 'l' ? 40 : 59}" y="185" width="21" height="6" rx="2" fill="${k.sole}"/></g>`;
  const bottomPiece = k.skirt ? `<path d="M44 128 L76 128 L86 154 L34 154 Z" fill="${k.bottom}"/>` : '';
  const top = k.jacket
    ? `<path d="M42 92 L78 92 L81 132 L39 132 Z" fill="${k.jacket}"/><path d="M53 92 L67 92 L65 132 L55 132 Z" fill="${k.top}"/>
       <path d="M60 104 c-3 -4 -8 0 0 6 c8 -6 3 -10 0 -6 Z" fill="#ff6ec7" stroke-width="1"/>`
    : `<path d="M42 92 L78 92 L82 134 L38 134 Z" fill="${k.top}"/>`;
  const sleeve = k.jacket || k.top;
  const extra = {
    chain: `<path d="M50 94 Q60 112 70 94" fill="none" stroke="#ffd400" stroke-width="2.5"/><circle cx="60" cy="108" r="4" fill="#ffd400" stroke-width="1.4"/>
            <path d="M54 94 l0 10 M66 94 l0 10" fill="none" stroke="#fff" stroke-width="1.6"/>`,
    headset: `<path d="M38 62 Q40 76 52 76" fill="none" stroke="#333" stroke-width="2"/><circle cx="53" cy="76" r="2.4" fill="#333" stroke="none"/>
              <path d="M58 112 l3 6 6 .8 -4.5 4 1.2 6 -5.7-3 -5.7 3 1.2-6 -4.5-4 6-.8 Z" fill="#ffd400" stroke-width="1.2"/>`,
    guitar: `<path d="M30 150 L80 104" stroke="#8a5a2b" stroke-width="5"/>
             <path d="M24 140 Q16 150 22 160 Q30 170 40 162 Q48 156 42 146 Q36 134 24 140 Z" fill="#ff3b30"/>
             <circle cx="32" cy="152" r="3.5" fill="#1e1e1e" stroke="none"/>
             <path d="M58 104 l-6 12 h7 l-4 12 12 -16 h-7 l4 -8 Z" fill="#ffd400" stroke-width="1.2"/>`,
    earpiece: `<path d="M82 62 Q82 72 72 74" fill="none" stroke="#bbb" stroke-width="1.8"/><circle cx="71" cy="74" r="1.8" fill="#bbb" stroke="none"/>`,
  }[k.accessory] || '';
  return `
<svg class="mascot-figure kid" viewBox="0 0 120 200" xmlns="http://www.w3.org/2000/svg">
  <g ${outline}>
    ${hairBack}
    ${legs}
    ${shoes('l')}${shoes('r')}
    <path d="M46 100 L30 62 L25 9" fill="none" stroke-width="12"/>
    <path d="M74 100 L90 62 L95 9" fill="none" stroke-width="12"/>
    <path d="M46 100 L30 62 L25 9" fill="none" stroke="${sleeve}" stroke-width="7"/>
    <path d="M74 100 L90 62 L95 9" fill="none" stroke="${sleeve}" stroke-width="7"/>
    <circle cx="25" cy="8" r="5.5" fill="${k.skin}"/><circle cx="95" cy="8" r="5.5" fill="${k.skin}"/>
    ${k.hairStyle === 'long' ? `<path class="mascot-tail mascot-tail-l" d="M38 44 Q26 80 30 116 L46 110 Q42 80 46 56 Z" fill="${k.hair}"/>
      <path class="mascot-tail mascot-tail-r" d="M82 44 Q94 80 90 116 L74 110 Q78 80 74 56 Z" fill="${k.hair}"/>` : ''}
    ${bottomPiece}
    ${top}
    <rect x="55" y="78" width="10" height="12" fill="${k.skin}" stroke="none"/>
    <path d="M38 52 Q38 28 60 28 Q82 28 82 52 Q82 72 60 84 Q38 72 38 52 Z" fill="${k.skin}"/>
    ${hairFront}
    <g stroke="none">
      <ellipse cx="51" cy="60" rx="4.2" ry="5.5" fill="#23123a"/><ellipse cx="69" cy="60" rx="4.2" ry="5.5" fill="#23123a"/>
      <circle cx="52.6" cy="57.8" r="1.7" fill="#fff"/><circle cx="70.6" cy="57.8" r="1.7" fill="#fff"/>
      <ellipse cx="45" cy="69" rx="3.6" ry="2" fill="#ff8fb5" opacity=".6"/><ellipse cx="75" cy="69" rx="3.6" ry="2" fill="#ff8fb5" opacity=".6"/>
    </g>
    <path d="M54 71 Q60 78 66 71 Z" fill="#e0245e" stroke-width="1.8"/>
    ${extra}
  </g>
</svg>`;
}

/* ---------- Gemeinsam ---------- */

// Stehende Figur mit Tafel (für Ersteinstieg und Einstellungen)
function mascotPreviewHtml() {
  const label = vibe().mascot === 'horse' ? (state.settings.horseName || 'Hallo!') : `Hi${state.settings.name ? ` ${state.settings.name}` : ''}!`;
  return `<div class="mascot-still"><div class="mascot-sign"><b>${esc(label)}</b></div>${mascotSvg()}</div>`;
}

function mascotSvg() {
  const type = vibe().mascot;
  if (type === 'pixel') return heroSvg();
  if (type === 'horse') return horseSvg();
  if (KIDS[type]) return kidSvg(KIDS[type]);
  return ZEMI_SVG;
}

function mascotLabel() {
  const type = vibe().mascot;
  if (type === 'pixel') return '👾 Dein Pixel-Held';
  if (type === 'horse') return `🐴 ${state.settings.horseName || 'Dein Pferd'}`;
  if (KIDS[type]) return `${vibe().icon} ${KIDS[type].name}`;
  return '💃 Zemi';
}

// Figur läuft einmal quer über den Bildschirm; big = große Zahl/Text, small = Zeile darunter
function showMascot(big, small = '') {
  if (!state.settings.mascot) return;
  document.querySelector('.mascot')?.remove();
  const el = document.createElement('div');
  el.className = `mascot mascot-${vibe().mascot}`;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <div class="mascot-bounce">
      <div class="mascot-sign ${String(big).length > 11 ? 'long' : ''}"><b>${esc(big)}</b>${small ? `<small>${esc(small)}</small>` : ''}</div>
      ${mascotSvg()}
      <span class="mascot-spark s1">✦</span><span class="mascot-spark s2">✦</span><span class="mascot-spark s3">✦</span>
    </div>`;
  el.addEventListener('animationend', e => { if (e.target === el) el.remove(); });
  document.body.appendChild(el);
}
