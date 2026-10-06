/* Teilen ohne Server: Alle Daten stecken im Link hinter dem „#“. Diesen Teil schickt der Browser nie an einen
   Server – auch nicht an GitHub oder für die WhatsApp-Vorschau. Empfangen geht per Link, Einfügen oder QR-Code. */
'use strict';

const SHARE_VERSION = 1;
const SHARE_HANDLERS = {}; // Typ -> Funktion(payload, info), wird von den Funktionen (Unit, Duell, …) befüllt
let pendingShare = null;

/* ---------- Kodierung ---------- */

function b64urlEncode(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(s + '='.repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));
}

async function pipeBytes(bytes, transform) {
  const stream = new Blob([bytes]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// "z…" = komprimiert, "j…" = unkomprimiert (für ältere Browser ohne CompressionStream)
async function encodePayload(obj) {
  const json = new TextEncoder().encode(JSON.stringify({ v: SHARE_VERSION, ...obj }));
  if (typeof CompressionStream !== 'undefined') {
    try { return 'z' + b64urlEncode(await pipeBytes(json, new CompressionStream('deflate-raw'))); } catch (e) { /* weiter unten */ }
  }
  return 'j' + b64urlEncode(json);
}

async function decodePayload(code) {
  let bytes = b64urlDecode(code.slice(1));
  if (code[0] === 'z') bytes = await pipeBytes(bytes, new DecompressionStream('deflate-raw'));
  else if (code[0] !== 'j') throw new Error('Unbekanntes Format');
  const obj = JSON.parse(new TextDecoder().decode(bytes));
  if (!obj || typeof obj !== 'object' || obj.v !== SHARE_VERSION || typeof obj.t !== 'string') throw new Error('Ungültiger Inhalt');
  return obj;
}

function appBaseUrl() {
  return location.origin + location.pathname.replace(/index\.html$/, '');
}

async function shareLink(obj) {
  return `${appBaseUrl()}#vf=${await encodePayload(obj)}`;
}

// Findet den Code in einem Link oder Text (z. B. aus WhatsApp kopiert)
function extractCode(text) {
  const m = String(text || '').match(/[#&?]vf=([A-Za-z0-9_-]{8,})/);
  if (m) return m[1];
  const t = String(text || '').trim();
  return /^[zj][A-Za-z0-9_-]{16,}$/.test(t) ? t : null;
}

/* ---------- Eingehende Inhalte absichern ---------- */

const cleanText = (s, max) => String(s ?? '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const cleanName = s => cleanText(s, 20);

function cleanWords(list, max = 200) {
  return (Array.isArray(list) ? list : []).slice(0, max)
    .map(p => Array.isArray(p) ? [cleanText(p[0], 80), cleanText(p[1], 80)] : null)
    .filter(p => p && p[0] && p[1]);
}

/* ---------- Senden ---------- */

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isStandalone = () => navigator.standalone || matchMedia('(display-mode: standalone)').matches;

async function ensureQrLib() {
  if (!window.qrcode) await loadScript('vendor/qr/qrcode.js');
}

function qrSvg(text) {
  try {
    const qr = qrcode(0, 'L');
    qr.addData(text, 'Byte');
    qr.make();
    return qr.createSvgTag({ cellSize: 4, margin: 3, scalable: true });
  } catch (e) {
    return ''; // zu lang für einen QR-Code
  }
}

// Teilen-Dialog: WhatsApp / Teilen-Menü, Link kopieren, QR-Code
async function openShareDialog({ title, intro, text, url }) {
  await ensureQrLib().catch(() => {});
  const full = `${text}\n${url}`;
  const svg = window.qrcode ? qrSvg(url) : '';
  const dlg = ensureDialog();
  dlg.innerHTML = `
    <div class="stack share-dlg">
      <h2>${esc(title)}</h2>
      ${intro ? `<p class="muted">${intro}</p>` : ''}
      <button type="button" class="btn big" data-dlg="share">📲 Per WhatsApp & Co. teilen</button>
      <div class="row">
        <a class="btn ghost" href="https://wa.me/?text=${encodeURIComponent(full)}" target="_blank" rel="noopener">💬 WhatsApp</a>
        <button type="button" class="btn ghost" data-dlg="copy">📋 Link kopieren</button>
      </div>
      ${svg ? `<div class="qr-box"><div class="qr">${svg}</div><small class="muted">Oder Handy an Handy: In VocabFlix auf „QR-Code scannen“ tippen.</small></div>` : ''}
      <p class="hint">🔒 Nur mit Freunden teilen. Die Daten stecken im Link selbst und werden nirgends gespeichert.</p>
      <button type="button" class="btn ghost" data-dlg="close">Schließen</button>
    </div>`;
  dlg.querySelector('[data-dlg="close"]').onclick = () => dlg.close();
  dlg.querySelector('[data-dlg="copy"]').onclick = async () => {
    try { await navigator.clipboard.writeText(full); toast('📋 Link kopiert – jetzt in WhatsApp einfügen'); } catch (e) { prompt('Link kopieren:', url); }
  };
  dlg.querySelector('[data-dlg="share"]').onclick = async () => {
    try {
      if (navigator.share) await navigator.share({ text: full });
      else { await navigator.clipboard.writeText(full); toast('📋 Link kopiert – jetzt in WhatsApp einfügen'); }
    } catch (e) { /* abgebrochen */ }
  };
  if (!dlg.open) dlg.showModal();
}

function ensureDialog() {
  let dlg = $('#dlg');
  if (!dlg) {
    dlg = document.createElement('dialog');
    dlg.id = 'dlg';
    document.body.appendChild(dlg);
  }
  return dlg;
}

/* ---------- Empfangen ---------- */

async function receiveCode(code, source = 'link') {
  let payload;
  try {
    payload = await decodePayload(code);
  } catch (e) {
    toast('🤔 Dieser Link ist leider kaputt oder unvollständig.');
    return;
  }
  const handler = SHARE_HANDLERS[payload.t];
  if (!handler) {
    toast('Dieser Link braucht eine neuere VocabFlix-Version.');
    return;
  }
  if (lesson || onboarding) { // erst nach der Runde bzw. dem Ersteinstieg anzeigen
    pendingShare = { code, source };
    return;
  }
  handler(payload, { code, source });
}

function processPendingShare() {
  if (!pendingShare || lesson || onboarding) return;
  const p = pendingShare;
  pendingShare = null;
  receiveCode(p.code, p.source);
}

// Hinweis, wenn ein Link in Safari statt in der installierten App geöffnet wurde
function safariHint(code) {
  if (!isIOS || isStandalone()) return '';
  return `
    <div class="safari-hint">
      <b>📲 Du nutzt VocabFlix als App auf dem Home-Bildschirm?</b>
      <p>Dann tippe auf „Link kopieren“, öffne die App und tippe dort auf <b>„📋 Link einfügen“</b>.</p>
      <button type="button" class="btn ghost" data-copy-code="${esc(code)}">📋 Link kopieren</button>
    </div>`;
}

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-copy-code]');
  if (!b) return;
  try {
    await navigator.clipboard.writeText(`${appBaseUrl()}#vf=${b.dataset.copyCode}`);
    toast('📋 Kopiert – jetzt VocabFlix öffnen und einfügen');
  } catch (err) { /* ignorieren */ }
});

function checkLocationHash() {
  const code = extractCode(location.hash);
  if (!code) return;
  history.replaceState(null, '', appBaseUrl());
  receiveCode(code, 'link');
}
window.addEventListener('hashchange', checkLocationHash);

// „Link einfügen“: aus der Zwischenablage oder per Hand
ACTIONS['paste-link'] = async () => {
  try {
    const text = await navigator.clipboard.readText();
    const code = extractCode(text);
    if (code) return receiveCode(code, 'paste');
  } catch (e) { /* kein Zugriff – Eingabefeld zeigen */ }
  const dlg = ensureDialog();
  dlg.innerHTML = `
    <form class="stack" id="paste-form">
      <h2>📋 Link einfügen</h2>
      <p class="muted">Tippe in WhatsApp lange auf den Link → „Kopieren“. Dann hier ins Feld tippen → „Einfügen“.</p>
      <textarea id="paste-text" rows="4" placeholder="https://…#vf=…" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>
      <div class="row">
        <button type="button" class="btn ghost" data-dlg="close">Abbrechen</button>
        <button type="submit" class="btn">Übernehmen</button>
      </div>
    </form>`;
  dlg.querySelector('[data-dlg="close"]').onclick = () => dlg.close();
  dlg.querySelector('#paste-form').onsubmit = ev => {
    ev.preventDefault();
    const code = extractCode($('#paste-text').value);
    if (!code) { toast('In diesem Text steckt kein VocabFlix-Link.'); return; }
    dlg.close();
    receiveCode(code, 'paste');
  };
  if (!dlg.open) dlg.showModal();
};

/* ---------- QR-Scanner ---------- */

let scanStream = null;
function stopScanner() {
  if (scanStream) scanStream.getTracks().forEach(t => t.stop());
  scanStream = null;
}

ACTIONS['scan-qr'] = async () => {
  const dlg = ensureDialog();
  dlg.innerHTML = `
    <div class="stack">
      <h2>📷 QR-Code scannen</h2>
      <div class="scan-view"><video id="scan-video" playsinline muted autoplay></video><i class="scan-frame"></i></div>
      <p class="muted small" id="scan-msg">Halte die Kamera auf den QR-Code auf dem anderen Handy.</p>
      <button type="button" class="btn ghost" data-dlg="close">Abbrechen</button>
    </div>`;
  dlg.querySelector('[data-dlg="close"]').onclick = () => { stopScanner(); dlg.close(); };
  dlg.addEventListener('close', stopScanner, { once: true });
  if (!dlg.open) dlg.showModal();
  try {
    if (!window.jsQR) await loadScript('vendor/qr/jsQR.js');
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
  } catch (e) {
    $('#scan-msg').textContent = '❌ Die Kamera ist nicht verfügbar. Erlaube den Kamerazugriff oder nutze „Link einfügen“.';
    return;
  }
  const video = $('#scan-video');
  video.srcObject = scanStream;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const tick = () => {
    if (!scanStream) return;
    if (video.readyState >= 2) {
      const scale = Math.min(1, 640 / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const found = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      const code = found && extractCode(found.data);
      if (code) {
        stopScanner();
        dlg.close();
        beep(true);
        receiveCode(code, 'qr');
        return;
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

/* ---------- Units teilen ---------- */

async function shareUnit(unit) {
  const words = state.words.filter(w => w.unit === unit).slice(0, 150).map(w => [w.en, w.de]);
  if (!words.length) return;
  const from = state.settings.name || '';
  const url = await shareLink({ t: 'unit', from, name: unit.slice(0, 30), w: words, test: (state.unitMeta[unit] || {}).testDate || null });
  state.stats.unitsShared = (state.stats.unitsShared || 0) + 1;
  save();
  unlockBadges();
  openShareDialog({
    title: '📤 Unit teilen',
    intro: `<b>${esc(unit)}</b> mit ${words.length} Wörtern`,
    text: `📚 ${from || 'Jemand'} teilt die Vokabeln „${unit}“ (${words.length} Wörter) mit dir! Tippe auf den Link oder kopiere ihn in VocabFlix:`,
    url,
  });
}

ACTIONS['unit-share'] = el => shareUnit(el.dataset.unit);

SHARE_HANDLERS.unit = (p, info) => {
  const words = cleanWords(p.w);
  const name = cleanText(p.name, 30) || 'Geteilte Unit';
  if (!words.length) { toast('In diesem Link sind keine Vokabeln.'); return; }
  const from = cleanName(p.from);
  const dlg = ensureDialog();
  dlg.innerHTML = `
    <form class="stack" id="unit-import">
      <h2>📚 Vokabeln von ${from ? esc(from) : 'einem Freund'}</h2>
      <p class="muted"><b>${esc(name)}</b> · ${words.length} Wörter</p>
      <ul class="import-list">
        ${words.slice(0, 8).map(([en, de]) => `<li><b>${esc(en)}</b><span>${esc(de)}</span></li>`).join('')}
        ${words.length > 8 ? `<li class="muted">… und ${words.length - 8} weitere</li>` : ''}
      </ul>
      <label>Speichern als Unit<input id="import-unit" value="${esc(name)}" maxlength="30" list="unit-list-import"></label>
      ${unitDatalist('unit-list-import')}
      ${safariHint(info.code)}
      <div class="row">
        <button type="button" class="btn ghost" data-dlg="close">Abbrechen</button>
        <button type="submit" class="btn">✅ Übernehmen</button>
      </div>
    </form>`;
  dlg.querySelector('[data-dlg="close"]').onclick = () => dlg.close();
  dlg.querySelector('#unit-import').onsubmit = ev => {
    ev.preventDefault();
    const unit = cleanText($('#import-unit').value, 30) || name;
    let added = 0, updated = 0;
    for (const [en, de] of words) {
      const existing = state.words.find(w => w.unit === unit && normalize(w.en) === normalize(en));
      if (!existing) {
        state.words.push(newWord(en, de, unit));
        added++;
      } else if (normalize(existing.de) !== normalize(de)) {
        existing.de = de; // Korrektur übernehmen, Lernstand bleibt
        updated++;
      }
    }
    if (p.test && /^\d{4}-\d{2}-\d{2}$/.test(p.test)) {
      state.unitMeta[unit] = { ...state.unitMeta[unit], testDate: p.test };
    }
    state.stats.unitsReceived = (state.stats.unitsReceived || 0) + 1;
    save();
    unlockBadges();
    dlg.close();
    toast(`✅ ${added} neue Wörter${updated ? `, ${updated} korrigiert` : ''} in „${unit}“`);
    show(currentTab === 'words' ? 'words' : 'home');
  };
  if (!dlg.open) dlg.showModal();
};

// Beim Start: wurde die App über einen geteilten Link geöffnet?
checkLocationHash();
