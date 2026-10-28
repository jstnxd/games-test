  // ---------- Karten-Editor und gemeinsame Karte (v59) ----------
  // Mit dem Befehl -admin oeffnet sich der Editor. Gebaute Strassen, Wege, Bruecken, Laternen usw. landen als gespeicherte
  // Nachricht (retained) beim Online-Dienst des Mehrspielers: jedes Spiel holt sie beim Start und bekommt Aenderungen live.
  // Lokal liegt immer eine Kopie (offline). Alles wird beim Empfang geprueft, kaputte Daten werden verworfen.
  const MAP_KEY = 'kellergruen.map72', MAP_TOPIC = 'kellergruen-v1/welt/karte72', // v72: neue Stadt, alte Kartenteile passen nicht mehr
    MAP_MAX = 400;
  const MTOOLS = [
    { id: 'hand', name: '✋ Verschieben', kind: 'hand' },
    { id: 'road', name: '🛣 Straße', kind: 'rect' },
    { id: 'walk', name: '🧱 Gehweg', kind: 'rect' },
    { id: 'path', name: '🥾 Trampelpfad (ohne Polizei)', kind: 'rect' },
    { id: 'plaza', name: '⬛ Pflaster', kind: 'rect' },
    { id: 'grass', name: '🌱 Rasen', kind: 'rect' },
    { id: 'water', name: '💧 Teich', kind: 'rect', solid: 1 },
    { id: 'bridge', name: '🌉 Brücke (über Wasser)', kind: 'rect' },
    { id: 'fence', name: '🚧 Zaun', kind: 'rect', solid: 1 },
    { id: 'lamp', name: '💡 Laterne', kind: 'pt', box: [-3, -3, 6, 6] },
    { id: 'tree', name: '🌳 Baum', kind: 'pt', box: [-7, 6, 14, 12] },
    { id: 'bush', name: '🌿 Busch', kind: 'pt' },
    { id: 'bench', name: '🪑 Bank', kind: 'pt', box: [-26, -7, 52, 14] },
    { id: 'bed', name: '🌷 Blumenbeet', kind: 'pt', box: [-20, -11, 40, 22] },
    { id: 'hydrant', name: '🚒 Hydrant', kind: 'pt', box: [-4, -4, 8, 8] },
    { id: 'sign', name: '🪧 Schild', kind: 'pt', box: [-2, -2, 4, 4] },
    { id: 'house', name: '🏠 Haus', kind: 'pt', box: [-80, -70, 160, 140] }, // v60: Deko-Haus (fest), Tuer unten oder mit ⟳ oben
    { id: 'erase', name: '🧽 Radierer', kind: 'erase' }
  ];
  const MT = Object.fromEntries(MTOOLS.map(t => [t.id, t]));
  const GROUND = ['grass', 'plaza', 'walk', 'road', 'path', 'water'];
  let WORLD = { ts: 0, items: [] };
  function cleanMap(o) {
    if (!o || typeof o !== 'object' || !Array.isArray(o.items)) return null;
    const n = v => Number.isFinite(+v) ? Math.round(+v) : null, items = [];
    for (const q of o.items.slice(0, MAP_MAX)) {
      if (!q || typeof q !== 'object' || !MT[q.t] || MT[q.t].kind === 'erase' || MT[q.t].kind === 'hand') continue;
      const x = n(q.x), y = n(q.y); if (x === null || y === null) continue;
      const it = { t: q.t, x: clamp(x, -6000, WW + 200), y: clamp(y, YMIN - 50, WH + 50) };
      if (MT[q.t].kind === 'rect') { const w = n(q.w), h = n(q.h); if (!w || !h) continue; it.w = clamp(w, 8, 3000); it.h = clamp(h, 8, 1400); }
      else it.r = clamp(n(q.r) || 0, 0, 3);
      items.push(it);
    }
    return { ts: Number.isFinite(+o.ts) ? +o.ts : 0, items };
  }
  // feste Flaeche eines Teils (fuer Hindernisse und Polizei), null = begehbar
  function itemBox(it) {
    const tl = MT[it.t]; if (!tl) return null;
    if (tl.kind === 'rect') return tl.solid ? { x: it.x, y: it.y, w: it.w, h: it.h } : null;
    if (!tl.box) return null; const b = tl.box, rot = (it.r || 0) % 2 === 1 && it.t === 'bench';
    return rot ? { x: it.x + b[1], y: it.y + b[0], w: b[3], h: b[2] } : { x: it.x + b[0], y: it.y + b[1], w: b[2], h: b[3] };
  }
  const mapCols = [], mapObs = [];
  function applyWorld() {
    try { gtlClear(); } catch (e) {} // v136: Bodenkacheln neu zeichnen
    for (const c of mapCols) { const i = colliders.indexOf(c); if (i >= 0) colliders.splice(i, 1); } mapCols.length = 0;
    for (const o of mapObs) { const i = OBST.indexOf(o); if (i >= 0) OBST.splice(i, 1); } mapObs.length = 0;
    for (const it of WORLD.items) {
      const b = itemBox(it); if (!b) continue;
      const c = { x: b.x, y: b.y, w: b.w, h: b.h, map: 1 }; if (it.t === 'water') c.water = 1; colliders.push(c); mapCols.push(c);
      const o = obRect(b.x, b.y, b.w, b.h, 14); OBST.push(o); mapObs.push(o);
    }
  }
  const inRect = (it, x, y) => x > it.x && x < it.x + it.w && y > it.y && y < it.y + it.h;
  const onBridge = (x, y) => WORLD.items.some(it => it.t === 'bridge' && inRect(it, x, y));
  const onMapPath = (x, y) => WORLD.items.some(it => it.t === 'path' && inRect(it, x, y));
  function storeWorld() { try { store.set(MAP_KEY, JSON.stringify(WORLD)); } catch (e) {} }
  function loadWorldLocal() { try { const o = cleanMap(JSON.parse(store.get(MAP_KEY, 'null'))); if (o) WORLD = o; } catch (e) {} applyWorld(); }
  // ---- Online: gemeinsame Karte
  const world = { client: null, bi: 0, fails: 0, lib: null, pubT: null };
  function worldIncoming(pl) {
    try { const o = cleanMap(JSON.parse(typeof pl === 'string' ? pl : new TextDecoder().decode(pl))); if (o && o.ts > WORLD.ts) { WORLD = o; storeWorld(); applyWorld(); if (G && state === 'play') msg('Die Karte wurde aktualisiert'); } } catch (e) {}
  }
  function worldOpen(lib) {
    let c; try { c = lib.connect(MP_BROKERS[world.bi % MP_BROKERS.length], { clientId: 'kgw_' + mp.id + '_' + world.bi, reconnectPeriod: 5000, connectTimeout: 7000, clean: true, keepalive: 60 }); } catch (e) { return; }
    world.client = c;
    c.on('connect', () => { world.fails = 0; try { c.subscribe(MAP_TOPIC); c.subscribe(INFO_TOPIC); } catch (e) {} });
    c.on('message', (t, pl) => { if (t === MAP_TOPIC) worldIncoming(pl); else if (t === INFO_TOPIC) newsIncoming(pl); });
    c.on('error', () => { if (++world.fails >= 2) { world.fails = 0; world.bi++; try { c.end(true); } catch (e) {} if (world.client === c) worldOpen(lib); } });
  }
  // ---- v68: Nachricht an alle Spieler (Befehl -update oder -info). Bleibt beim Online-Dienst liegen, wer spaeter startet, sieht sie auch (3 Tage lang, je Nachricht nur einmal).
  const INFO_TOPIC = 'kellergruen-v1/welt/info', NEWS_KEY = 'kellergruen.news', NEWS_MAX_AGE = 3 * 864e5, NEWS_TEXT_AGE = 864e5;
  const NEWS_BLOCK = [/ich\s*liebe\s*dich/i]; let newsCleared = false; // v122: private Nachricht, wird nie mehr angezeigt und vom Server geloescht
  const NEWS_UPDATE = 'Es gibt ein neues Update! Bitte speichere und starte das Spiel neu, damit du die neue Version hast.';
  function cleanNews(o) { if (!o || typeof o !== 'object' || !Number.isFinite(+o.ts) || typeof o.tx !== 'string') return null; const tx = o.tx.replace(/[\u0000-\u0009\u000B-\u001F<>]/g, '').trim().slice(0, 240); return tx ? { ts: +o.ts, tx, up: o.up ? 1 : 0 } : null; }
  function newsIncoming(pl) {
    try { const raw = typeof pl === 'string' ? pl : new TextDecoder().decode(pl); if (!raw) return; const o = cleanNews(JSON.parse(raw)); if (!o) return;
      if (NEWS_BLOCK.some(re => re.test(o.tx))) { if (!newsCleared) { newsCleared = true; setTimeout(() => { try { publishNews(null, true); } catch (e) {} }, 4000); } return; }
      const seen = +store.get(NEWS_KEY, '0') || 0; if (o.ts <= seen || Date.now() - o.ts > (o.up ? NEWS_MAX_AGE : NEWS_TEXT_AGE) || o.ts > Date.now() + 864e5) return;
      showNews(o); } catch (e) {}
  }
  function showNews(o) {
    try { store.set(NEWS_KEY, String(o.ts)); } catch (e) {}
    $('newsTitle').textContent = o.up ? 'Neues Update' : 'Nachricht an alle'; $('newsText').textContent = o.tx;
    $('newsReload').hidden = !o.up; $('newsLater').textContent = o.up ? 'Später' : 'OK';
    $('news').hidden = false; lastMsg = o.tx; try { sfx.ping(); } catch (e) {}
    clearTimeout(newsT); newsT = setTimeout(hideNews, 10000); // v69: verschwindet nach 10 Sekunden von selbst
    try { const bar = $('newsBar'); bar.style.transition = 'none'; bar.style.width = '100%'; void bar.offsetWidth; bar.style.transition = 'width 10s linear'; bar.style.width = '0%'; } catch (e) {}
  }
  let newsT = null;
  function hideNews() { clearTimeout(newsT); $('news').hidden = true; }
  function newsReload() { try { if (G) save(); } catch (e) {} hideNews(); try { location.reload(); } catch (e) {} }
  function publishNews(o, quiet) { // an alle Dienste, als liegen bleibende Nachricht; o = null loescht sie
    const payload = o ? JSON.stringify(o) : '';
    try { if (world.client && world.client.connected) world.client.publish(INFO_TOPIC, payload, { qos: 1, retain: true }); } catch (e) {}
    mpLoadLib(lib => {
      if (!lib) { if (!quiet) msg('Kein Internet: Die Nachricht konnte nicht verschickt werden', true); return; }
      MP_BROKERS.forEach((url, i) => { try { const c = lib.connect(url, { clientId: 'kgn_' + mp.id + '_' + i + '_' + (Date.now() % 1e6), connectTimeout: 7000, reconnectPeriod: 0, clean: true }); c.on('connect', () => { try { c.publish(INFO_TOPIC, payload, { qos: 1, retain: true }, () => { try { c.end(); } catch (e) {} }); } catch (e) {} }); c.on('error', () => { try { c.end(true); } catch (e) {} }); } catch (e) {} });
    });
    return true;
  }
  function worldStart() { if (world.client) return; mpLoadLib(lib => { if (lib && !world.client) { world.lib = lib; worldOpen(lib); } }); }
  // Veroeffentlichen: sofort ueber die bestehende Verbindung, beim Beenden zusaetzlich an alle Dienste (falls jemand einen anderen nutzt)
  function publishWorld(all) {
    const payload = JSON.stringify(WORLD);
    try { if (world.client && world.client.connected) world.client.publish(MAP_TOPIC, payload, { qos: 1, retain: true }); } catch (e) {}
    if (!all) return;
    mpLoadLib(lib => {
      if (!lib) { msg('Kein Internet: Die Karte ist erst einmal nur bei dir gespeichert', true); return; }
      MP_BROKERS.forEach((url, i) => {
        try {
          const c = lib.connect(url, { clientId: 'kgp_' + mp.id + '_' + i + '_' + (Date.now() % 1e6), connectTimeout: 7000, reconnectPeriod: 0, clean: true });
          c.on('connect', () => { try { c.publish(MAP_TOPIC, payload, { qos: 1, retain: true }, () => { try { c.end(); } catch (e) {} }); } catch (e) {} });
          c.on('error', () => { try { c.end(true); } catch (e) {} });
        } catch (e) {}
      });
    });
  }
  function worldChanged() { WORLD.ts = Date.now(); storeWorld(); applyWorld(); clearTimeout(world.pubT); world.pubT = setTimeout(() => publishWorld(false), 600); }
  // ---- Zeichnen
  function drawMapGround() {
    for (const lay of GROUND) for (const it of WORLD.items) {
      if (it.t !== lay || it.x + it.w < viewX0 || it.x > viewX1 || it.y + it.h < viewY0 || it.y > viewY1) continue;
      const { x, y, w, h } = it, hor = w >= h;
      if (lay === 'grass') { ctx.fillStyle = '#1E3A2A'; ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(99,193,116,.18)'; for (let k = 0; k < (w * h) / 900; k++) { const px = x + ((k * 37) % w), py = y + ((k * 53) % h); ctx.fillRect(px, py, 2, 4); } }
      else if (lay === 'plaza') { ctx.fillStyle = '#2A3139'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = x; k < x + w; k += 24) { ctx.moveTo(k, y); ctx.lineTo(k, y + h); } for (let k = y; k < y + h; k += 24) { ctx.moveTo(x, k); ctx.lineTo(x + w, k); } ctx.stroke(); }
      else if (lay === 'walk') { ctx.fillStyle = '#39414B'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#2A3139'; ctx.fillRect(x + 3, y + 3, w - 6, h - 6); }
      else if (lay === 'road') { ctx.fillStyle = '#242830'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#39414B'; if (hor) { ctx.fillRect(x, y, w, 3); ctx.fillRect(x, y + h - 3, w, 3); } else { ctx.fillRect(x, y, 3, h); ctx.fillRect(x + w - 3, y, 3, h); } ctx.fillStyle = 'rgba(255,255,255,.35)'; if (hor) { for (let k = x + 10; k < x + w - 30; k += 70) ctx.fillRect(k, y + h / 2 - 2, 36, 4); } else { for (let k = y + 10; k < y + h - 30; k += 70) ctx.fillRect(x + w / 2 - 2, k, 4, 36); } }
      else if (lay === 'path') { ctx.fillStyle = '#4A3D2A'; rr(x, y, w, h, 8); ctx.fill(); ctx.fillStyle = '#5A4A33'; rr(x + 4, y + 4, Math.max(1, w - 8), Math.max(1, h - 8), 6); ctx.fill(); ctx.fillStyle = 'rgba(30,22,14,.45)'; for (let k = 0, n = Math.floor((hor ? w : h) / 26); k < n; k++) { const a = 10 + k * 26, b = (k % 2 ? .36 : .62) * (hor ? h : w); if (hor) ell(x + a, y + b, 3.2, 1.8); else ell(x + b, y + a, 1.8, 3.2); ctx.fill(); } }
      else if (lay === 'water') { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#2F7FB8'); g.addColorStop(1, '#1F5C8C'); ctx.fillStyle = '#1A2B22'; rr(x - 4, y - 4, w + 8, h + 8, 12); ctx.fill(); ctx.fillStyle = g; rr(x, y, w, h, 10); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.5; for (let k = 0; k < Math.max(1, (w * h) / 6000); k++) { const px = x + 14 + ((k * 61) % Math.max(1, w - 28)), py = y + 10 + ((k * 37) % Math.max(1, h - 20)) + Math.sin(gt * 1.4 + k) * 2; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + 7, py - 4, px + 14, py); ctx.stroke(); } }
    }
  }
  function drawMapTop() {
    const L = lightK();
    for (const it of WORLD.items) {
      const tl = MT[it.t]; if (!tl) continue;
      if (tl.kind === 'rect') {
        if (it.x + it.w < viewX0 || it.x > viewX1 || it.y + it.h < viewY0 || it.y > viewY1) continue;
        const { x, y, w, h } = it, hor = w >= h;
        if (it.t === 'bridge') { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + 4, y + 5, w, h); ctx.fillStyle = '#7A5A3E'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#9A7650'; if (hor) { for (let k = x + 2; k < x + w - 2; k += 9) ctx.fillRect(k, y + 3, 6, h - 6); ctx.fillStyle = '#5B4330'; ctx.fillRect(x, y, w, 3); ctx.fillRect(x, y + h - 3, w, 3); } else { for (let k = y + 2; k < y + h - 2; k += 9) ctx.fillRect(x + 3, k, w - 6, 6); ctx.fillStyle = '#5B4330'; ctx.fillRect(x, y, 3, h); ctx.fillRect(x + w - 3, y, 3, h); } }
        else if (it.t === 'fence') { ctx.fillStyle = '#6B4E34'; if (hor) { ctx.fillRect(x, y + h / 2 - 2, w, 3); ctx.fillRect(x, y + h / 2 + 3, w, 2); for (let k = x; k <= x + w; k += 16) ctx.fillRect(k - 2, y, 4, h); } else { ctx.fillRect(x + w / 2 - 2, y, 3, h); ctx.fillRect(x + w / 2 + 3, y, 2, h); for (let k = y; k <= y + h; k += 16) ctx.fillRect(x, k - 2, w, 4); } }
        continue;
      }
      const x = it.x, y = it.y; if (!inView(x, y, 60)) continue;
      if (it.t === 'lamp') { ctx.fillStyle = '#20262E'; ctx.fillRect(x - 1.5, y - 30, 3, 32); ctx.fillRect(x - 5, y - 2, 10, 3); ctx.fillStyle = L > 0.2 ? '#FFE9A8' : '#7C8591'; ctx.fillRect(x - 4, y - 36, 8, 7); ctx.fillStyle = '#20262E'; ctx.fillRect(x - 5, y - 38, 10, 3); }
      else if (it.t === 'tree') { ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(x + 6, y + 16, 24, 9); ctx.fill(); ctx.fillStyle = '#5A3B26'; ctx.fillRect(x - 5, y - 4, 10, 24); const sw = Math.sin(gt * 0.9 + x) * 1.2; ctx.fillStyle = '#1F4A32'; ctx.beginPath(); ctx.arc(x + sw, y - 14, 26, 0, TAU); ctx.fill(); ctx.fillStyle = '#2C6844'; ctx.beginPath(); ctx.arc(x - 8 + sw, y - 20, 16, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x + 11 + sw, y - 10, 13, 0, TAU); ctx.fill(); }
      else if (it.t === 'bush') { ctx.fillStyle = '#12201A'; ctx.beginPath(); ctx.arc(x, y, 12, 0, TAU); ctx.fill(); ctx.fillStyle = '#1D3A2B'; ctx.beginPath(); ctx.arc(x - 3, y - 3, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#2C5A3E'; ctx.beginPath(); ctx.arc(x + 3, y - 5, 5, 0, TAU); ctx.fill(); }
      else if (it.t === 'bench') { const b = itemBox(it); ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(b.x + 2, b.y + 3, b.w, b.h); ctx.fillStyle = '#6B4524'; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.fillStyle = '#9A6A3C'; if (b.w > b.h) { for (let i = 0; i < 3; i++) ctx.fillRect(b.x + 1, b.y + 1 + i * (b.h - 2) / 3, b.w - 2, (b.h - 2) / 3 - 1); } else { for (let i = 0; i < 3; i++) ctx.fillRect(b.x + 1 + i * (b.w - 2) / 3, b.y + 1, (b.w - 2) / 3 - 1, b.h - 2); } }
      else if (it.t === 'bed') { ctx.fillStyle = '#5B4330'; rr(x - 20, y - 11, 40, 22, 5); ctx.fill(); ctx.fillStyle = '#3A2A1C'; rr(x - 17, y - 8, 34, 16, 4); ctx.fill(); const cl = ['#E05555', '#F2C14E', '#C58BE6', '#6EB5FF', '#FF8FD0']; for (let k = 0; k < 9; k++) { ctx.fillStyle = '#2F7A48'; ctx.fillRect(x - 14 + (k % 5) * 7, y - 5 + Math.floor(k / 5) * 8, 2, 4); ctx.fillStyle = cl[k % 5]; ctx.beginPath(); ctx.arc(x - 13 + (k % 5) * 7, y - 6 + Math.floor(k / 5) * 8, 2.4, 0, TAU); ctx.fill(); } }
      else if (it.t === 'hydrant') { ctx.fillStyle = 'rgba(0,0,0,.3)'; ell(x + 1, y + 5, 6, 2.5); ctx.fill(); ctx.fillStyle = '#C23B3B'; rr(x - 4, y - 9, 8, 13, 2); ctx.fill(); ctx.fillStyle = '#E05555'; ctx.fillRect(x - 6, y - 5, 12, 3); ctx.beginPath(); ctx.arc(x, y - 9, 4, Math.PI, TAU); ctx.fill(); }
      else if (it.t === 'house') drawMapHouse(it);
      else if (it.t === 'sign') { ctx.fillStyle = '#5B4330'; ctx.fillRect(x - 1.5, y - 22, 3, 24); ctx.fillStyle = '#EDE3CC'; rr(x - 16, y - 32, 32, 14, 3); ctx.fill(); ctx.strokeStyle = '#8A6A4A'; ctx.lineWidth = 1.2; rr(x - 16, y - 32, 32, 14, 3); ctx.stroke(); ctx.fillStyle = '#3A2A1C'; ctx.font = '800 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('KELLERGRÜN', x, y - 25); ctx.textBaseline = 'alphabetic'; }
    }
  }
  function drawMapHouse(it) {
    const x = it.x - 80, y = it.y - 70, w = 160, h = 140, hs = Math.abs((it.x * 7 + it.y * 13) | 0), C = [['#8A6E5A', '#5E4A3C'], ['#5E7A8E', '#3E5466'], ['#7E8A5E', '#56603E'], ['#8E6A80', '#62485A'], ['#9A825E', '#6E5A3E']][hs % 5], dk = lightK() > 0.25;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + 6, y + 8, w, h); ctx.fillStyle = C[0]; ctx.fillRect(x, y, w, h); ctx.fillStyle = C[1]; ctx.fillRect(x, y, w, h * 0.55); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = '#20150F'; ctx.fillRect(it.x - 16, (it.r || 0) % 2 ? y : y + h - 18, 32, 18);
    for (const wx of [x + 14, x + w - 36]) { ctx.fillStyle = dk ? ((hs + wx) % 3 ? '#FFE08A' : '#2B3442') : '#A9CDE0'; ctx.fillRect(wx, y + h * 0.62, 22, 16); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(wx, y + h * 0.62, 22, 3); }
  }
  // ---- Editor
  const adm = { tool: 'hand', sc: 0, cx: 0, cy: 0, ox: 0, oy: 0, drag: null, ptrs: {}, pinch: null, undo: [], clr: 0 };
  const admWorld = e => ({ x: (e.clientX - adm.ox) / adm.sc + adm.cx, y: (e.clientY - adm.oy) / adm.sc + adm.cy });
  function admMsg(t, bad) { const h = $('admHint'); if (h) { h.textContent = t; h.classList.toggle('bad', !!bad); } lastMsg = t; }
  function startAdmin() {
    if (!G || state !== 'play') return false;
    closePhone(); closeChat(); $('emoteBar').hidden = true;
    state = 'admin'; adm.cx = player.x; adm.cy = player.y; adm.sc = 0; adm.drag = null; adm.pinch = null; adm.ptrs = {}; adm.tool = 'hand';
    $('hud').classList.remove('on'); $('pads').classList.remove('on'); $('adm').hidden = false; joy.id = null; joy.dx = joy.dy = 0; aHeld = false;
    renderAdmPanel(); admMsg('Wähle ein Werkzeug. Flächen ziehst du mit dem Finger auf, Teile setzt du per Tippen. Zwei Finger zoomen.');
    worldStart(); return true;
  }
  function finishAdmin() {
    if (state !== 'admin') return;
    state = 'play'; $('adm').hidden = true; $('hud').classList.add('on'); $('pads').classList.add('on');
    move(player, 0, 0, player.r); Object.keys(cache).forEach(k => delete cache[k]);
    publishWorld(true); msg('Karte gespeichert und an alle verteilt');
  }
  function renderAdmPanel() {
    const l = $('admList'); if (!l) return; l.innerHTML = '';
    const hd = document.createElement('div'); hd.className = 'grp'; hd.textContent = 'Werkzeuge · ' + WORLD.items.length + '/' + MAP_MAX + ' Teile'; l.appendChild(hd);
    for (const t of MTOOLS) { const c = document.createElement('button'); c.className = 'chip' + (adm.tool === t.id ? ' on' : ''); c.textContent = t.name; c.addEventListener('click', () => { adm.tool = t.id; renderAdmPanel(); admMsg(t.kind === 'rect' ? t.name + ': Fläche mit dem Finger aufziehen' : t.kind === 'pt' ? t.name + ': an die gewünschte Stelle tippen' : t.kind === 'erase' ? 'Radierer: auf ein Teil tippen, um es zu entfernen' : 'Karte mit dem Finger verschieben'); }); l.appendChild(c); }
  }
  const snap = v => Math.round(v / 6) * 6;
  // Verbotene Stellen: in Gebaeuden (Keller, Scheune, Brauerei) und, fuer feste Teile, auf Haeusern
  function admAllowed(it) {
    const tl = MT[it.t], r = tl.kind === 'rect' ? { x: it.x, y: it.y, w: it.w, h: it.h } : (itemBox(it) || { x: it.x - 2, y: it.y - 2, w: 4, h: 4 });
    for (const k of AREA_KEYS) { const I = AREAS[k].IN; if (rectsOverlap(r, { x: I.x0 - 14, y: I.y0 - 14, w: I.x1 - I.x0 + 28, h: I.y1 - I.y0 + 28 })) return 'Nicht in Gebäuden'; }
    if ((tl.solid || tl.box) && HOUSES.some(h => rectsOverlap(r, { x: h.x - 4, y: h.y - 4, w: h.w + 8, h: h.h + 30 }))) return 'Nicht auf oder vor Häusern';
    return null;
  }
  function admAdd(it) {
    if (WORLD.items.length >= MAP_MAX) { admMsg('Maximal ' + MAP_MAX + ' Teile', true); sfx.bad(); return false; }
    const bad = admAllowed(it); if (bad) { admMsg(bad, true); sfx.bad(); return false; }
    adm.undo.push(JSON.stringify(WORLD.items)); if (adm.undo.length > 40) adm.undo.shift();
    WORLD.items.push(it); worldChanged(); sfx.put(); renderAdmPanel(); admMsg(MT[it.t].name + ' gebaut'); return true;
  }
  function admErase(p) {
    for (let i = WORLD.items.length - 1; i >= 0; i--) {
      const it = WORLD.items[i], tl = MT[it.t], hit = tl.kind === 'rect' ? inRect({ x: it.x - 4, y: it.y - 4, w: it.w + 8, h: it.h + 8 }, p.x, p.y) : Math.hypot(p.x - it.x, p.y - it.y) < 22;
      if (hit) { adm.undo.push(JSON.stringify(WORLD.items)); WORLD.items.splice(i, 1); worldChanged(); sfx.put(); renderAdmPanel(); admMsg(tl.name + ' entfernt'); return true; }
    }
    admMsg('Hier ist nichts Gebautes', true); return false;
  }
  function admUndo() { const s = adm.undo.pop(); if (!s) { admMsg('Nichts zum Zurücknehmen', true); return; } try { WORLD.items = JSON.parse(s); } catch (e) { return; } worldChanged(); renderAdmPanel(); admMsg('Zurückgenommen'); }
  function admZoom(f) { adm.sc = adm.sc * f; }
  function admDown(e) {
    adm.ptrs[e.pointerId] = { x: e.clientX, y: e.clientY }; try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    const ids = Object.keys(adm.ptrs);
    if (ids.length === 2) { const a = adm.ptrs[ids[0]], b = adm.ptrs[ids[1]]; adm.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, sc0: adm.sc }; adm.drag = null; return; }
    const p = admWorld(e), tl = MT[adm.tool];
    adm.drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, cx: adm.cx, cy: adm.cy, p0: p, p1: p, moved: false, kind: tl.kind };
  }
  function admMove(e) {
    if (adm.ptrs[e.pointerId]) adm.ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (adm.pinch) { const ids = Object.keys(adm.ptrs); if (ids.length >= 2) { const a = adm.ptrs[ids[0]], b = adm.ptrs[ids[1]]; adm.sc = adm.pinch.sc0 * Math.hypot(a.x - b.x, a.y - b.y) / adm.pinch.d0; } return; }
    const d = adm.drag; if (!d || d.id !== e.pointerId) return;
    if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true;
    if (d.kind === 'hand') { adm.cx = d.cx - (e.clientX - d.sx) / adm.sc; adm.cy = d.cy - (e.clientY - d.sy) / adm.sc; }
    else d.p1 = admWorld(e);
  }
  function admUp(e) {
    delete adm.ptrs[e.pointerId]; if (adm.pinch) { if (Object.keys(adm.ptrs).length < 2) adm.pinch = null; return; }
    const d = adm.drag; if (!d || d.id !== e.pointerId) return; adm.drag = null;
    if (d.kind === 'rect') {
      if (!d.moved) { admMsg(MT[adm.tool].name + ': mit dem Finger eine Fläche aufziehen', true); return; }
      const x0 = snap(Math.min(d.p0.x, d.p1.x)), y0 = snap(Math.min(d.p0.y, d.p1.y)), x1 = snap(Math.max(d.p0.x, d.p1.x)), y1 = snap(Math.max(d.p0.y, d.p1.y));
      if (x1 - x0 < 12 || y1 - y0 < 12) { admMsg('Zu klein, größer aufziehen', true); return; }
      admAdd({ t: adm.tool, x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    } else if (d.kind === 'pt') { const p = d.p1; admAdd({ t: adm.tool, x: snap(p.x), y: snap(p.y), r: adm.rot || 0 }); }
    else if (d.kind === 'erase' && !d.moved) admErase(d.p0);
  }
  function drawAdmOverlay() {
    for (const it of WORLD.items) { if (MT[it.t].kind !== 'rect') continue; ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5 / Math.max(.5, adm.sc); ctx.strokeStyle = 'rgba(255,181,71,.5)'; ctx.strokeRect(it.x, it.y, it.w, it.h); ctx.setLineDash([]); }
    const d = adm.drag; if (d && d.kind === 'rect' && d.moved) { const x0 = snap(Math.min(d.p0.x, d.p1.x)), y0 = snap(Math.min(d.p0.y, d.p1.y)), x1 = snap(Math.max(d.p0.x, d.p1.x)), y1 = snap(Math.max(d.p0.y, d.p1.y)), ok = !admAllowed({ t: adm.tool, x: x0, y: y0, w: x1 - x0, h: y1 - y0 }); ctx.fillStyle = ok ? 'rgba(255,181,71,.25)' : 'rgba(255,92,122,.3)'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.strokeStyle = ok ? '#FFB547' : '#FF5C7A'; ctx.lineWidth = 2 / Math.max(.5, adm.sc); ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); }
  }
  // ---------- Interaktion ----------
  function findTarget() {
    let best = null, bd = 1e9;
    const px = player.x, py = player.y;
    const cons = (type, idx, d, lim, ar) => { if (d <= lim && d < bd) { bd = d; best = { type, idx, ar }; } };
    if (player.fl === 4) return ghqTarget(px, py); // v121: Gang-HQ
    if (player.fl === 3) return bizTarget(px, py); // v100: Hinterzimmer
    if (player.fl === 2) return roomTarget(px, py); // v89: Mietraum
    if (player.fl) { // v54: auf einer Etage: Toepfe, Gestell, Packtisch und die Treppe
      const ar = AREAS[player.fl < 0 ? 'ku' : 'ko'], fr = ar.fields.rack, ft = ar.fields.table;
      for (let i = 0; i < potsOpen(ar); i++) cons('pot', i, Math.hypot(px - ar.POTS[i].x, py - ar.POTS[i].y), 40, ar);
      for (let i = potsOpen(ar); i < ar.POTS.length; i++) cons('potbuy', i, Math.hypot(px - ar.POTS[i].x, py - ar.POTS[i].y), 30, ar);
      if (inField(fr, px, py)) cons('rack', 0, Math.hypot(px - (fr.x0 + fr.x1) / 2, py - (fr.y0 + fr.y1) / 2), 999, ar);
      if (inField(ft, px, py)) cons('table', 0, Math.hypot(px - (ft.x0 + ft.x1) / 2, py - (ft.y0 + ft.y1) / 2), 999, ar);
      if (!best) for (const nm of ['rack', 'table']) { const f = ar.fields[nm]; if (Math.hypot(px - (f.x0 + f.x1) / 2, py - (f.y0 + f.y1) / 2) < 95) best = { type: 'field', idx: 0, ar, what: nm }; }
      return best;
    }
    if (px >= 0 && Math.hypot(px - PANIC_AT.x, py - PANIC_AT.y) < 40) cons('panic', 0, Math.hypot(px - PANIC_AT.x, py - PANIC_AT.y) * 0.6, 40, AREAS.keller); // v122
    for (const ar of openAreas()) {
      for (let i = 0; i < potsOpen(ar); i++) cons('pot', i, Math.hypot(px - ar.POTS[i].x, py - ar.POTS[i].y), 40, ar);
      for (let i = potsOpen(ar); i < ar.POTS.length; i++) cons('potbuy', i, Math.hypot(px - ar.POTS[i].x, py - ar.POTS[i].y), 30, ar); // v54: schwarzer Platz = Topf kaufen
      if (!G.build.door[ar.key]) { const sd = ar.side, iy = (sd.g0 + sd.g1) / 2, ix = sd.dir > 0 ? sd.x - 14 : sd.x + T + 14, ox = sd.dir > 0 ? sd.x + T + 14 : sd.x - 14; cons('sidedoor', 0, Math.min(Math.hypot(px - ix, py - iy), Math.hypot(px - ox, py - iy)), 26, ar); } // v54: Seitentuer an Ort und Stelle
      const fr = ar.fields.rack, ft = ar.fields.table;
      if (inField(fr, px, py)) cons('rack', 0, Math.hypot(px - (fr.x0 + fr.x1) / 2, py - (fr.y0 + fr.y1) / 2), 999, ar);
      if (inField(ft, px, py)) cons('table', 0, Math.hypot(px - (ft.x0 + ft.x1) / 2, py - (ft.y0 + ft.y1) / 2), 999, ar);
    }
    for (const k of ['tabak', 'brau']) { const ar = AREAS[k], g = ar.gate; if (!g || isOpen(ar)) continue; const d = Math.hypot(px - (g.x + g.w / 2), py - (g.y + g.h / 2)); cons('areabuy', 0, d, 52, ar); } // v147: Scheune und Labor direkt an der Tuer kaufen
    // Kunden: wen du beliefern kannst, hat Vorrang (egal wer am naechsten steht). Der Kompass ist nur ein Hinweis und legt nichts fest.
    {
      let db = null, dd = 1e9, df = null, dfd = 1e9;
      for (const o of G.orders) {
        const p = orderPos(o), d = Math.hypot(px - p.x, py - p.y); if (d > 46) continue;
        const ar = AREAS[o.prod || 'keller'];
        if (S(ar).inv.bags >= o.qty) { if (d < dfd) { dfd = d; df = { type: 'door', idx: o.id, ar }; } }
        else if (d < dd) { dd = d; db = { type: 'door', idx: o.id, ar }; }
      }
      if (df) best = df; else if (db && dd < bd && dd <= 42) best = db;
    }
    { const kc = krNear(); if (kc && !(best && best.type === 'door' && S(best.ar).inv.bags >= ((G.orders.find(o => o.id === best.idx) || {}).qty || 1e9))) return { type: 'npc', idx: kc.id, ar: AREAS.keller }; } // v82: Quest-Charaktere zuerst
    { const gg = gangAt(); if (gg) { const ga = AREAS[gg.want.prod]; if (S(ga).inv.bags > 0 || !best) best = { type: 'gang', idx: gg.id, ar: ga }; } } // v51: wartende Gang
    if (!best && atKiosk() && Math.hypot(px - KIOSK_AT.x, py - KIOSK_AT.y) < 46) best = { type: 'kiosk', idx: 0, ar: AREAS.keller };
    if (!sleepS) { const bd = bedNear(); if (bd && (!best || (['potbuy', 'field', 'flpotbuy'].includes(best.type) && Math.hypot(px - bd.x, py - bd.y) < 34))) best = { type: 'bed', idx: 0, ar: AREAS.keller }; } // v98: Schlafen
    if (!best && atLager()) best = { type: 'lager', idx: 0, ar: AREAS.keller }; // v66
    if (!best && atPad()) best = { type: 'prpad', idx: 0, ar: AREAS.keller }; // v89
    if (!best && atApo()) best = { type: 'apo', idx: 0, ar: AREAS.keller };
    if (!best && inCasino()) { let bd2 = 46; const c2 = (type, idx, q) => { const d = Math.hypot(px - q.x, py - q.y); if (d < bd2) { bd2 = d; best = { type, idx, ar: AREAS.keller }; } }; c2('wheel', 0, CAS_WHEEL.at); CAS_SLOTS.forEach((s, i) => c2('slot', i, s.at)); CAS_BJ.forEach((t, i) => c2('bj', i, t.at)); }
    if (!best && atAutohof()) best = { type: 'autohof', idx: 0, ar: AREAS.keller };
    if (!best && atWerk()) best = { type: 'werk', idx: 0, ar: AREAS.keller };
    if (!best) { const nb = [['gym', atGym], ['bank', atBank], ['pizza', atPizza], ['club', atClub], ['makler', atMakler]].find(q => q[1]()); if (nb) best = { type: nb[0], idx: 0, ar: AREAS.keller }; } // v94, v100
    if (!best && atGhq()) best = { type: 'ghq', idx: 0, ar: AREAS.keller }; // v121
    if (!best && atGV()) best = { type: 'gv', idx: 0, ar: AREAS.keller }; // v79
    if (!best) { const bi = busNear(); if (bi >= 0) best = { type: 'bus', idx: bi, ar: AREAS.keller }; } // v104: Haltestelle
    if (!best && !inBuilding(px, py)) best = calTarget(px, py); // v155: Halloween-Türen (vor den Mülltonnen)
    if (!best && !player.fl && !inBuilding(px, py)) { const bi = binNear(px, py); if (bi >= 0) best = { type: 'bin', idx: bi, ar: AREAS.keller }; } // v61
    if (!best) for (const ar of openAreas()) for (const nm of ['rack', 'table']) { const f = ar.fields[nm]; if (Math.hypot(px - (f.x0 + f.x1) / 2, py - (f.y0 + f.y1) / 2) < 95) best = { type: 'field', idx: 0, ar, what: nm }; }
    return best;
  }
  function hintFor(tg) {
    if (!tg) return '';
    const ar = tg.ar || AREAS.keller, st = S(ar), L = ar.lbl;
    if (tg.type === 'field') return 'Stell dich auf das markierte Feld (' + ar.fields[tg.what].label + ')';
    if (tg.type === 'kiosk') return 'A  Kiosk: Gang-Look und Spezialwaffen';
    if (tg.type === 'treff') return !mp.on ? 'Kellertreff: erst online gehen (App Freunde)' : mp.slots.some(Boolean) ? 'A  Kellertreff: Freunde besuchen' : 'A  Kellertreff: noch kein Keller zum Besuchen';
    if (tg.type === 'bin') return binHint(tg.idx);
    if (tg.type === 'cal') return calHint(tg); // v155
    if (tg.type === 'areabuy') return G.rep < ar.needRep ? ar.name + ': zu kaufen ab Ruf ' + ar.needRep : 'A  ' + ar.name + ' kaufen (' + fmt(ar.cost) + ')';
    if (tg.type === 'lager') return !G.lager.own ? 'A  Mietraum mieten (' + fmt(LAGER_COST) + ')' : 'A  Mietraum betreten';
    if (tg.type === 'prpad') return 'A  Mieträume von Freunden besuchen';
    if (tg.type === 'apo' && !prReady()) return 'Apotheke: wegen Umbau geschlossen. Dr. Weber sitzt im Stadtpark';
    if (tg.type === 'apo') return apoOpen() ? 'A  Apotheke: Dosen an Dr. Weber verkaufen (' + G.pr.inv.bags + ' dabei)' : 'Apotheke: erst nach Dr. Webers Qualitätsprüfung';
    if (tg.type === 'wheel') return wheelReady() ? 'A  Glücksrad: heute gratis drehen!' : 'Glücksrad: morgen wieder';
    if (tg.type === 'slot') return 'A  Slotmaschine spielen';
    if (tg.type === 'bj') return 'A  Blackjack (Tisch ' + (tg.idx + 1) + ', ab ' + fmt(CAS_BJ[tg.idx].min) + ')';
    if (tg.type === 'shelf') return 'A  Regal: Lager und Ausstattung';
    if (tg.type === 'exit') return 'A  Raus zum Lager-Tor';
    if (tg.type === 'autohof') return 'A  Autohof: Autos kaufen und lackieren';
    if (tg.type === 'werk') return 'A  Autowerkstatt: Tuning für dein Auto';
    if (tg.type === 'bed') return 'A  Schlafen (Tag oder Nacht überspringen)';
    if (tg.type === 'makler') return 'A  Immobilien Krämer: Läden kaufen';
    if (tg.type === 'bus') return 'A  Haltestelle ' + busStops()[tg.idx].name + ': Bus fahren';
    if (tg.type === 'safe') return 'A  Tresor: Bargeld waschen';
    if (tg.type === 'bshelf') return 'A  Regal: Ware einlagern oder mitnehmen';
    if (tg.type === 'bexit' || tg.type === 'gexit') return 'A  Raus auf die Straße';
    if (tg.type === 'ghq') return myGid() && !(G.gang && G.gang.req) ? 'A  Ins Hauptquartier deiner Gang' + (gTag() ? ' [' + gTag() + ']' : '') : 'Gang-Hauptquartier: nur für Mitglieder';
    if (tg.type === 'gsafe') return 'A  Gang-Kasse';
    if (tg.type === 'gbeet') { const bb = gbOf(tg.idx); return !bb ? 'A  Gang-Beet bepflanzen' : gbLeft(bb) > 0 ? (bb.w ? 'Wächst noch ' + Math.ceil(gbLeft(bb) / 60000) + ' Min.' : 'A  Gießen (wächst schneller)') : 'A  Ernten: +' + gbYield() + ' frisch ins Gang-Lager'; }
    if (tg.type === 'gdry') { const d = gdOf(); return !d ? 'A  Frische Ware aus dem Gang-Lager zum Trocknen aufhängen' : gdLeft(d) > 0 ? 'Trocknet noch ' + Math.ceil(gdLeft(d) / 60000) + ' Min.' : 'A  Getrocknete Ware abnehmen (' + d.n + ')'; } // v132
    if (tg.type === 'gpack') return 'A  Verpacken (aus dem Gang-Lager)';
    if (tg.type === 'panic') { const P = PN(); return P.tr ? 'Helfer sind unterwegs …' : P.on ? 'A  Entwarnung: Helfer zurückholen' : 'A  NOTKNOPF: Helfer raus' + (P.lv >= 2 ? ', Ware ins Mietlager' : ''); }
    if (tg.type === 'gitem') { const d = DECOR.find(x => x.id === tg.it.id); return pgCanDeco() ? 'A  ' + (d ? d.name : 'Deko') + ' verschieben' : (d ? d.name : 'Deko'); }
    if (tg.type === 'gdrop') return 'A  Hier abstellen · B  Abbrechen';
    if (tg.type === 'glager') return 'A  Gang-Lager: Ware teilen';
    if (tg.type === 'gboard') return pgCanDeco() ? 'A  Planungstafel: HQ einrichten (wie im Keller)' : 'A  Planungstafel: Deko ansehen';
    if (tg.type === 'gym') return atGym2() ? 'A  Iron Gym Express: trainieren' : 'A  Iron Gym' + (bizOwn('gym') ? ' (dein Laden)' : ': trainieren');
    if (tg.type === 'bank') return 'A  Stadtsparkasse: Sparkonto';
    if (tg.type === 'pizza') return 'A  Pizzeria Bella Notte' + (bizOwn('pizza') ? ' (dein Laden)' : '');
    if (tg.type === 'club') return clubOpen() ? 'A  Neon Club: Gästeliste beliefern' : 'Neon Club: öffnet um 21 Uhr';
    if (tg.type === 'npc') { const c = CHAR_BY[tg.idx]; return 'A  Mit ' + c.name + ' reden' + (charReady(c) ? ' (!)' : ''); }
    if (tg.type === 'gv') return gvOpen() ? 'A  Hehler: Ware an die Gangs verkaufen (' + gvPct() + ' %)' : 'Hehler: erst ab Ruf ' + GV_REP + ' (du hast ' + G.rep + ')';
    if (tg.type === 'potbuy') { const c = potBuyCost(tg); return G.money >= c ? 'A  Topf hier kaufen (−' + fmt(c) + ')' : 'Topf hier: ' + fmt(c) + ' (zu wenig Geld)'; }
    if (tg.type === 'sidedoor') return G.money >= ar.sideCost ? 'A  Seitentür einbauen (−' + fmt(ar.sideCost) + ')' : 'Seitentür: ' + fmt(ar.sideCost) + ' (zu wenig Geld)';
    if (tg.type === 'pot') {
      const p = potOf(tg), sc = seedCost(ar);
      const PL = ar.lbl || {}; // v88: eigene Woerter fuers Labor
      if (p.s === 0) return G.money >= sc ? 'A  ' + (PL.sow || 'Samen pflanzen') + ' (−' + fmt(sc) + ')' : 'Zu wenig Geld für ' + (PL.seed || 'Samen');
      if (p.s === 1) return 'A halten  ' + (PL.water || 'Gießen');
      return 'A  ' + (PL.harvest || 'Ernten');
    }
    if (tg.type === 'rack') {
      const dry = Math.floor(st.rack.dry), full = rackCap(ar) - Math.floor(st.rack.wet + st.rack.dry) <= 0, parts = [];
      if (st.inv.fresh > 0) parts.push(full ? L.rack + ' voll' : 'A  ' + L.fresh + ' rein');
      if (dry >= 1) parts.push('B  ' + (L.dried || 'Trockene') + ' raus (' + dry + ')');
      return parts.length ? parts.join('  ·  ') : L.rack + ': ' + Math.floor(st.rack.wet) + (L.dried ? ' kristallisieren noch' : ' trocknen noch');
    }
    if (tg.type === 'table') {
      const parts = [];
      if (st.tab.bags > 0) parts.push('B  ' + L.unit + ' nehmen (' + st.tab.bags + ')');
      parts.push(st.inv.dried >= ar.packN ? 'A halten  ' + L.unit + ' packen' : st.tab.dry >= ar.packN - 1e-6 ? 'A halten  ' + (L.dried || 'Trockene') + ' vom Tisch packen (' + Math.floor(st.tab.dry) + ')' : (L.table || 'Packtisch') + ': ' + ar.packN + ' ' + (L.dried || 'Trockene') + ' pro ' + L.unit);
      return parts.join('  ·  ');
    }
    if (tg.type === 'door') { const o = G.orders.find(x => x.id === tg.idx); if (!o) return ''; return st.inv.bags >= o.qty ? 'A  Liefern an ' + HOUSES[o.house].name + ' (+' + fmt(o.price) + ')' : HOUSES[o.house].name + ' will ' + o.qty + ' ' + L.unit + ' (du hast ' + st.inv.bags + ')'; }
    if (tg.type === 'gang') { const g = gangs.find(x => x.id === tg.idx); if (!g || !g.want) return ''; const have = st.inv.bags, n = Math.min(have, g.want.left); return have > 0 ? 'A  ' + n + ' ' + L.unit + ' an ' + g.def.name + ' (+' + fmt(n * gangUnitOf(g)) + ')' : g.def.name + ' will noch ' + g.want.left + ' ' + L.unit + ' (du hast keine)'; }
    return '';
  }
  function act(tg, dt) {
    if (!tg) return;
    const ar = tg.ar || AREAS.keller, st = S(ar), inv = st.inv, L = ar.lbl;
    if (aEdge && (tg.type === 'pot' || tg.type === 'rack' || tg.type === 'table') && workTry(tg)) { aEdge = false; return; } // v163: 3D-Arbeitsfenster
    if (tg.type === 'pot') {
      const p = potOf(tg), pos = potPos(tg), sc = seedCost(ar), hy = harvestYield(ar);
      if (p.s === 0 && aEdge) {
        if (G.money >= sc) { G.money -= sc; p.s = 1; p.p = 0; p.w = 1; sfx.plant(); floater(pos.x, pos.y - 20, '−' + fmt(sc), '#FF8FA3'); }
        else { sfx.bad(); msg('Zu wenig Geld', true); }
      } else if (p.s === 1 && aHeld) {
        const before = p.w; p.w = Math.min(1, p.w + dt * 1.4); if (before < 1 && p.w >= 1) G.stat.wt = (G.stat.wt || 0) + 1;
        if (p.w > before && Math.random() < dt * 14) sfx.water();
      } else if (p.s === 2 && aEdge) {
        if (inv.fresh + hy > unitCap() + 6) { msg('Du trägst schon zu viel', true); sfx.bad(); }
        else { inv.fresh += hy; p.s = 0; p.p = 0; if (G.kr) G.kr.cnt.hv++; sfx.harvest(); floater(pos.x, pos.y - 20, '+' + hy + ' ' + L.fresh, ar.leaf); }
      }
    } else if (tg.type === 'rack') {
      if (aEdge) {
        const space = rackCap(ar) - Math.floor(st.rack.wet + st.rack.dry);
        if (inv.fresh <= 0) { msg(Math.floor(st.rack.dry) >= 1 ? 'Mit B nimmst du Trockene heraus' : 'Du hast keine ' + L.fresh + ' dabei', true); sfx.bad(); }
        else if (space <= 0) { msg(L.rack + ' voll. Nimm mit B Trockene heraus', true); sfx.bad(); }
        else { const n = Math.min(inv.fresh, space); inv.fresh -= n; st.rack.wet += n; sfx.put(); floater(ar.RACK.x, ar.RACK.y + 50, '+' + n + ' ' + L.fresh, ar.leaf); }
      }
      if (bEdge) {
        const n = Math.floor(st.rack.dry);
        if (n >= 1) { st.rack.dry -= n; inv.dried += n; sfx.put(); floater(ar.RACK.x, ar.RACK.y + 50, '+' + n + ' ' + (L.dried || 'trocken'), ar.dry); } // v126: immer alles auf einmal
        else { msg('Noch nichts trocken', true); sfx.bad(); }
      }
    } else if (tg.type === 'table') {
      if (bEdge) {
        if (st.tab.bags <= 0) { msg('Noch keine fertigen ' + L.unit, true); sfx.bad(); }
        else if (unitRoom(ar) <= 0) { msg('Rucksack voll', true); sfx.bad(); }
        else qtyAsk(L.unit + ' vom ' + (L.table || 'Packtisch') + ' nehmen', Math.min(st.tab.bags, unitRoom(ar)), n => { n = Math.min(n, st.tab.bags, unitRoom(ar)); if (n <= 0) return; st.tab.bags -= n; inv.bags += n; sfx.put(); floater(ar.TABLE.x, ar.TABLE.y + 10, '+' + n + ' ' + L.unit, ar.dry); }, L.unit); // v89: Menge waehlen
      }
      // v62: ohne Packer kann man auch das Getrocknete abpacken, das der Gestell-Helfer auf den Tisch gelegt hat
      const fromInv = inv.dried >= ar.packN, fromTab = !fromInv && st.tab.dry >= ar.packN - 1e-6, toBag = unitRoom(ar) > 0, toTab = fromTab && !toBag && st.tab.bags < bagsMax();
      if (aHeld && (fromInv || fromTab) && (toBag || toTab)) {
        packPr += dt / 1.3;
        if (packPr >= 1) { packPr = 0; if (fromInv) inv.dried -= ar.packN; else st.tab.dry = Math.max(0, st.tab.dry - ar.packN); if (toBag) inv.bags += 1; else st.tab.bags += 1; G.stat.pk = (G.stat.pk || 0) + 1; sfx.pack(); floater(ar.TABLE.x, ar.TABLE.y + 10, '+1 ' + L.unit, ar.dry); }
      } else if (aEdge && (fromInv || fromTab)) { msg(fromTab ? 'Rucksack und Tisch sind voll' : 'Rucksack voll', true); sfx.bad(); }
      else if (aEdge) { msg('Zu wenig Trockene: ' + ar.packN + ' pro ' + L.unit, true); sfx.bad(); }
    } else if (tg.type === 'potbuy' && aEdge) {
      if (ar.key === 'pr' ? buyPrPotAt(tg.idx) : buyPotAt(ar, tg.idx)) msg(ar.key === 'pr' ? 'Neue Hydro-Station aufgestellt' : 'Neuer Topf aufgestellt'); else { sfx.bad(); msg('Zu wenig Geld für den Topf', true); }
    } else if (tg.type === 'sidedoor' && aEdge) {
      if (buySide(ar)) msg('Seitentür eingebaut'); else { sfx.bad(); msg('Zu wenig Geld für die Seitentür', true); }
    } else if (tg.type === 'cal' && aEdge) { calAct(tg); // v155
    } else if (tg.type === 'areabuy' && aEdge) { openPhone(); G.area = ar.key; tmSel = ''; tab = 'shop'; renderPhone(); sfx.ping(); // v147: Kaufen-Karte, danach direkt der Laden fuer das Gebaeude
    } else if (tg.type === 'lager' && aEdge) {
      if (G.lager.own) roomEnter(); else openLager(); // v89: Mietraum
    } else if (tg.type === 'prpad' && aEdge) { tab = 'prvisit'; openPhone(); sfx.ping();
    } else if (tg.type === 'apo' && aEdge) { tab = 'apo'; openPhone(); sfx.ping();
    } else if ((tg.type === 'wheel' || tg.type === 'slot' || tg.type === 'bj') && aEdge) { if (riding()) toggleRide(false); casShow(tg.type, tg.idx); sfx.ping();
    } else if (tg.type === 'shelf' && aEdge) { tab = 'lager'; openPhone(); sfx.ping();
    } else if (tg.type === 'exit' && aEdge) { roomLeave();
    } else if (tg.type === 'autohof' && aEdge) {
      openAutohof();
    } else if (tg.type === 'werk' && aEdge) {
      openWerk();
    } else if (tg.type === 'bed' && aEdge) { sleepAsk();
    } else if (tg.type === 'bus' && aEdge) { busAt = tg.idx; openB('bus')();
    } else if (tg.type === 'makler' && aEdge) { openB('makler')();
    } else if (tg.type === 'safe' && aEdge) { openB('biz')();
    } else if (tg.type === 'bshelf' && aEdge) { openB('bshelf')();
    } else if (tg.type === 'bexit' && aEdge) { bizLeave();
    } else if (tg.type === 'gexit' && aEdge) { ghqLeave();
    } else if (tg.type === 'bin' && aEdge) { if (carryTotal() >= 1) binUse(tg.idx, true); else binUse(tg.idx);
    } else if (tg.type === 'panic' && aEdge) { panicPress(false);
    } else if (tg.type === 'ghq' && aEdge) { ghqEnter();
    } else if (tg.type === 'gsafe' && aEdge) { openPg('info');
    } else if (tg.type === 'gboard' && aEdge) { if (pgCanDeco()) startGhqEdit(); else openPg('deko'); // v132: Einrichten wie im Keller
    } else if ((tg.type === 'gdry' || tg.type === 'gpack') && aEdge) { if (!gbBusy) { gbBusy = true; (tg.type === 'gdry' ? gdUse() : gpUse()).then(t => { if (t) msg(t); }, e => msg(e.message || 'Ging nicht', true)).finally(() => { gbBusy = false; }); } // v132
    } else if (tg.type === 'gbeet' && aEdge) { if (!gbBusy) { gbBusy = true; gbUse(tg.idx).then(t => { if (t) msg(t); }, e => msg(e.message || 'Ging nicht', true)).finally(() => { gbBusy = false; }); }
    } else if (tg.type === 'gitem' && aEdge) { hqPick(tg.it);
    } else if (tg.type === 'gdrop' && aEdge) { hqDrop();
    } else if (tg.type === 'glager' && aEdge) { openPg('hq');
    } else if (tg.type === 'gym' && aEdge) { openGym();
    } else if (tg.type === 'bank' && aEdge) { openBank();
    } else if (tg.type === 'pizza' && aEdge) { openPizza();
    } else if (tg.type === 'club' && aEdge) { openClub();
    } else if (tg.type === 'gv' && aEdge) {
      openGV();
    } else if (tg.type === 'npc' && aEdge) {
      krTalk(tg.idx);
    } else if (tg.type === 'kiosk' && aEdge) {
      openKiosk();
    } else if (tg.type === 'treff' && aEdge) {
      openTreff();
    } else if (tg.type === 'gang' && aEdge) {
      gangDeliver(tg);
    } else if (tg.type === 'door' && aEdge) {
      const i = G.orders.findIndex(x => x.id === tg.idx); if (i < 0) return;
      const o = G.orders[i], h = HOUSES[o.house];
      if (inv.bags >= o.qty) {
        const pay = Math.round(o.price * (petPerk().tip || 1) * krTip() * rkMul(orderPos(o)) * evPay(orderPos(o))), bonus = o.t > o.tmax * (KR_NEUTRAL ? 0.6 : 0.6 - Math.min(0.2, 0.04 * specSum('kunde'))) ? Math.round(pay * 0.15) : 0;
        G.stat.del++; if (o.vip) G.stat.vip++; if (!KR_NEUTRAL && KR().ev && KR().ev.id === 'stamm' && KR().ev.n > 0) KR().ev.n--;
        rkPoint(orderPos(o), o.qty); // v128: Revierkampf
        inv.bags -= o.qty; G.money += pay + bonus; G.earned += pay + bonus; G.orders.splice(i, 1); G.nextOrder = Math.max(G.nextOrder || 0, mpPeers() ? 14 + Math.random() * 10 : 5 + Math.random() * 5); if (o.remote) { mpSteal(o); msg('Kunde von ' + ((mp.friends[o.remote] || {}).name || 'Freund') + ' weggeschnappt!'); } addRep((bonus ? REP_FAST : REP_SLOW) * (o.vip ? 2 : 1));
        sfx.cash(); { const pp = orderPos(o); floater(pp.x, pp.y - 10, '+' + fmt(pay + bonus), '#FFB547'); }
        if (bonus) msg('Pünktlich geliefert: +' + fmt(bonus) + ' Trinkgeld, Ruf +' + String(REP_FAST).replace('.', ','));
        [2000000, 10000000, 50000000].forEach(g => { if (G.earned - (pay + bonus) < g && G.earned >= g) msg('Meilenstein: ' + fmt(g) + ' Umsatz!'); });
        if (!G.won && G.earned >= 500000) { G.won = true; msg('Ziel erreicht: 500.000 € Umsatz! Spiele weiter, so lange du willst.'); }
      } else { sfx.bad(); msg(h.name + ' will ' + o.qty + ' ' + L.unit + ' – du hast ' + inv.bags + ' ' + L.unit, true); }
    }
  }

