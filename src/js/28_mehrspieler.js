  // ---------- Hauptschleife ----------
  let last = 0, saveT = 0;
  // ---------- Emotes ----------
  const EMOTES = [{ id: 'wave', e: '\u{1F44B}', n: 'winken' }, { id: 'heart', e: '\u2764\uFE0F', n: 'herz' }, { id: 'laugh', e: '\u{1F602}', n: 'lachen' }, { id: 'up', e: '\u{1F44D}', n: 'daumen' }, { id: 'angry', e: '\u{1F620}', n: 'wut' }, { id: 'zzz', e: '\u{1F4A4}', n: 'schlafen' }, { id: 'party', e: '\u{1F389}', n: 'party' }, { id: 'what', e: '\u2753', n: 'frage' }];
  let myEm = { id: null, k: '', t: -99 };
  function doEmote(id) {
    const em = EMOTES.find(x => x.id === id || x.n === id); if (!em || !G || gt - myEm.t < 1.2) return false;
    myEm = { id: em.id, k: Math.random().toString(36).slice(2, 8), t: gt };
    if (mp.on) { mp.sendT = 9; mpSend(); }
    return true;
  }
  const sayClean = v => String(v || '').replace(/[\u0000-\u001F\u007F<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
  function doSay(text) {
    const tx = sayClean(text); if (!tx || !G || gt - myEm.t < 1.2) return false;
    myEm = { id: null, tx, k: Math.random().toString(36).slice(2, 8), t: gt };
    if (mp.on) { mp.sendT = 9; mpSend(); }
    return true;
  }
  // Sprechblase mit Text: bis zu 2 Zeilen, 5 Sekunden
  function drawSayBubble(x, y, text, t) {
    const age = gt - t; if (!text || age < 0 || age > 5) return;
    ctx.save(); ctx.font = '700 11px sans-serif';
    const words = text.split(' '), lines = []; let cur = '';
    for (const w of words) { const nx = cur ? cur + ' ' + w : w; if (cur && ctx.measureText(nx).width > 118) { lines.push(cur); cur = w; } else cur = nx; }
    if (cur) lines.push(cur); if (lines.length > 3) lines.length = 3;
    const bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 14, bh = lines.length * 13 + 8, y0 = y - 40 - bh, pop = Math.min(1, 0.7 + age * 5 * 0.3);
    ctx.globalAlpha = age > 4.5 ? (5 - age) * 2 : 1; ctx.translate(x, y0 + bh); ctx.scale(pop, pop); ctx.translate(0, -bh);
    ctx.fillStyle = 'rgba(255,255,255,.96)'; rr(-bw / 2, 0, bw, bh, 8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-4, bh - 1); ctx.lineTo(0, bh + 6); ctx.lineTo(4, bh - 1); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#10151C'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, 0, 4 + 6.5 + i * 13));
    ctx.restore();
  }
  function drawEmoteBubble(x, y, id, t) {
    const em = EMOTES.find(q => q.id === id), age = gt - t; if (!em || age < 0 || age > 3) return;
    const rise = Math.min(1, age * 5), y0 = y - 36 - rise * 8, pop = 0.7 + 0.3 * Math.min(1, age * 8);
    ctx.save(); ctx.globalAlpha = age > 2.5 ? (3 - age) * 2 : 1; ctx.translate(x, y0); ctx.scale(pop, pop);
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-4, 11); ctx.lineTo(0, 19); ctx.lineTo(4, 11); ctx.closePath(); ctx.fill();
    ctx.font = '19px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#10151C'; ctx.fillText(em.e, 0, 1);
    ctx.restore();
  }
  function buildEmoteBar() {
    const bar = $('emoteBar'); if (!bar || bar.dataset.built) return; bar.dataset.built = '1';
    for (const em of EMOTES) { const b = document.createElement('button'); b.textContent = em.e; b.setAttribute('aria-label', em.n); b.addEventListener('click', () => { doEmote(em.id); bar.hidden = true; }); bar.appendChild(b); }
    const row = document.createElement('div'); row.className = 'say';
    const inp = document.createElement('input'); inp.type = 'text'; inp.id = 'sayIn'; inp.maxLength = 40; inp.placeholder = 'Text schreiben …'; inp.autocomplete = 'off'; inp.setAttribute('enterkeyhint', 'send');
    const go = document.createElement('button'); go.textContent = 'Senden'; go.id = 'saySend';
    const send = () => { if (doSay(inp.value)) { inp.value = ''; bar.hidden = true; try { inp.blur(); } catch (e) {} } };
    go.addEventListener('click', send); inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); send(); } e.stopPropagation(); }); inp.addEventListener('keyup', e => e.stopPropagation());
    row.appendChild(inp); row.appendChild(go); bar.appendChild(row);
  }

  // ---------- Freunde (Mehrspieler) ----------
  // Es werden nur Name, Position und Aussehen geteilt. Geld, Ruf und Spielstand bleiben bei jedem selbst.
  // Verbindung über einen öffentlichen MQTT-Server (WebSocket); wer denselben Raumcode eingibt, sieht sich gegenseitig.
  const MP_KEY = 'kellergruen.mp', MP_BROKERS = ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt', 'wss://test.mosquitto.org:8081'];
  const MP_LIB = 'https://cdn.jsdelivr.net/npm/mqtt@5.10.1/dist/mqtt.min.js', MP_MAX = 20, MP_TIMEOUT = 9; // v61: bis zu 21 Spieler im Raum (vorher 13)
  const mp = { bw: [], bl: [], ba: [], rumK: {}, rumDone: {}, rumGot: 0, seenB: {}, rum: null, on: false, room: '', name: '', status: 'Aus', client: null, id: Math.random().toString(36).slice(2, 10), friends: {}, steals: [], pushes: [], kills: [], killReq: null, seenPush: {}, pushCd: 0, kb: { x: 0, y: 0, t: 0 }, pushOk: true, sendT: 0, bi: 0, fails: 0, listT: 0, gen: 0, slots: [], snT: -99, snChk: -99, snSig: '', copHits: [], seenHit: {}, gEv: [], gHit: [], gSeen: {} };
  const mpClean = (v, n) => String(v || '').replace(/[^A-Za-z0-9ÄÖÜäöüß _.\-]/g, '').trim().slice(0, n);
  const mpRoom = v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16);
  const mpBase = () => 'kellergruen-v1/' + mp.room;
  function mpSaveCfg(auto) { const c = mpLoadCfg(); store.set(MP_KEY, JSON.stringify({ name: mp.name || c.name, room: MP_DEF_ROOM, auto: !!auto, push: mp.pushOk, g72: 1 })); }
  function mpLoadCfg() { try { const c = JSON.parse(store.get(MP_KEY, 'null')); if (c && typeof c === 'object') return { name: mpClean(c.name, 12), room: mpRoom(c.room), auto: !!c.auto, push: c.push !== false, g72: !!c.g72 }; } catch (e) {} return { name: '', room: '', auto: false, push: true, g72: false }; }
  function mpLoadLib(cb) {
    if (window.__KG_MQTT || window.mqtt) { cb(window.__KG_MQTT || window.mqtt); return; }
    try {
      const sc = document.createElement('script'); sc.src = MP_LIB; sc.async = true;
      sc.onload = () => cb(window.mqtt || null); sc.onerror = () => cb(null);
      document.head.appendChild(sc);
    } catch (e) { cb(null); }
  }
  function mpSetStatus(t) { mp.status = t; mpRefreshList(true); }
  function mpConnect(room, name) {
    room = mpRoom(room); name = mpClean(name, 12);
    if (room.length < 3) { mpSetStatus('Raumcode: mindestens 3 Zeichen (a-z, 0-9)'); return false; }
    if (!name) { mpSetStatus('Bitte gib einen Namen ein'); return false; }
    mpDisconnect(true);
    mp.room = room; mp.name = name; mp.on = true; mp.fails = 0; mp.friends = {}; mp.snT = -99; mpDropOrders(null); mpSlots(); const gen = ++mp.gen;
    mpSaveCfg(true); mpSetStatus('Verbinde …');
    mpLoadLib(lib => {
      if (gen !== mp.gen || !mp.on) return;
      if (!lib) { mpSetStatus('Konnte die Verbindungsbibliothek nicht laden (kein Internet?)'); return; }
      mpOpen(lib, gen);
    });
    return true;
  }
  function mpOpen(lib, gen) {
    const url = MP_BROKERS[mp.bi % MP_BROKERS.length];
    let c;
    try {
      c = lib.connect(url, { clientId: 'kg_' + mp.id + '_' + gen, reconnectPeriod: 3000, connectTimeout: 7000, clean: true, keepalive: 30, will: { topic: mpBase() + '/' + mp.id, payload: JSON.stringify({ i: mp.id, bye: 1 }), qos: 0, retain: false } });
    } catch (e) { mpSetStatus('Verbindung fehlgeschlagen'); return; }
    mp.client = c;
    c.on('connect', () => { if (gen !== mp.gen) return; mp.fails = 0; try { c.subscribe(mpBase() + '/+'); } catch (e) {} mpSetStatus('Online' + (mp.bi % MP_BROKERS.length ? ' · Ersatzserver ' + (mp.bi % MP_BROKERS.length) + ' (ggf. neu laden)' : '')); mp.sendT = 9; });
    c.on('message', (t, pl) => { if (gen !== mp.gen) return; try { mpHandle(typeof pl === 'string' ? pl : new TextDecoder().decode(pl)); } catch (e) {} });
    const bad = () => {
      if (gen !== mp.gen || !mp.on) return;
      mp.fails++; mpSetStatus('Keine Verbindung, versuche es weiter …');
      if (mp.fails >= 2) { mp.fails = 0; mp.bi++; try { c.end(true); } catch (e) {} mp.client = null; mpOpen(lib, gen); }
    };
    c.on('error', bad); c.on('offline', () => { if (gen === mp.gen) mpSetStatus('Offline'); });
  }
  function mpDisconnect(keepCfg) {
    mp.gen++;
    const c = mp.client; mp.client = null;
    if (c) { try { if (c.connected) c.publish(mpBase() + '/' + mp.id, JSON.stringify({ i: mp.id, bye: 1 })); c.end(true); } catch (e) {} }
    mp.on = false; mp.friends = {}; mp.steals = []; mp.bw = []; mp.bl = []; mp.ba = []; mp.rum = null; mpDropOrders(null); mpSlots();
    if (!keepCfg) { mpSaveCfg(false); mp.status = 'Aus'; mpRefreshList(true); }
  }
  function mpHandle(txt) {
    const o = JSON.parse(txt); if (!o || typeof o !== 'object' || typeof o.i !== 'string' || o.i === mp.id || o.i.length > 24) return;
    if (o.bye) { const f = mp.friends[o.i]; if (f) { delete mp.friends[o.i]; mpDropOrders(o.i); mpSlots(); msg(f.name + ' hat das Spiel verlassen'); } return; }
    const x = +o.x, y = +o.y; if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    let f = mp.friends[o.i];
    if (!f) {
      if (Object.keys(mp.friends).length >= MP_MAX) { if (gt - (mp.fullT || -99) > 20) { mp.fullT = gt; msg('Der Raum ist voll (höchstens ' + (MP_MAX + 1) + ' Spieler)', true); } return; }
      f = mp.friends[o.i] = { id: o.i, name: 'Freund', x: 0, y: 0, tx: 0, ty: 0, vis: false, rg: '', lx: 0, ly: 0, gs: null, ang: 0, step: 0, look: Object.assign({}, DEF_LOOK), pets: [], seen: gt, moving: false };
      f.name = mpClean(o.n, 12) || 'Freund'; msg(f.name + ' ist jetzt dabei');
    }
    f.name = mpClean(o.n, 12) || f.name; f.rg = typeof o.rg === 'string' && o.rg.length <= 24 ? o.rg : ''; f.lx = clamp(x, 0, WW + 120); f.ly = clamp(y, YMIN, WH); f.ang = Number.isFinite(+o.a) ? +o.a : f.ang; f.seen = gt;
    const l = o.l && typeof o.l === 'object' ? o.l : {};
    f.look = cleanLook(l);
    f.pets = (Array.isArray(o.p) ? o.p : []).filter(id => COS.some(c => c.id === id && c.kind === 'pet')).slice(0, 2);
    f.bat = typeof o.bt === 'string' && batDef(o.bt) ? o.bt : '';
    f.vh = typeof o.vh === 'string' && VEH_BY[o.vh] ? o.vh : ''; f.vc = Number.isInteger(o.vc) && o.vc >= 0 && o.vc < CAR_COLS.length ? o.vc : undefined; f.vt = parseTune(o.vt); // v66: Autofarbe, v69: Tuning
    f.cy = o.cy ? 1 : 0; f.ma = o.ma ? 1 : 0; f.u = typeof o.u === 'string' ? o.u.slice(0, 40) : ''; f.gt = typeof o.gt === 'string' ? o.gt.replace(/[^A-Z0-9]/g, '').slice(0, 4) : ''; f.gc = clamp(Math.floor(+o.gc) || 0, 0, 7); if (Array.isArray(o.pk) && o.pk.includes(mp.id)) cmdPoll(true); f.ps = clamp(Math.floor(+o.ps) || 0, 0, PRES_MAX);
    f.vr = +o.vr || 0; if (f.vr !== GAME_VER && !f.vrWarn) { f.vrWarn = 1; msg(f.name + (f.vr > GAME_VER ? ' hat schon eine neuere Version. Lade das Spiel neu (Speichern & neu starten).' : ' spielt noch eine ältere Version. Sag ihm, er soll das Spiel neu laden.'), true); } // v74: Versionen vergleichen
    if (Array.isArray(o.ch)) mpApplyCopHits(o.i, o.ch.slice(0, 8));
    if (o.i === copLeaderId()) mpApplyCops(o.cp, o.cr);
    if (o.i === copLeaderId()) mpApplyGangs(o.gg, o.gd); // v52: alle sehen dieselben Gangs
    if (Array.isArray(o.ge)) mpGangEvents(o.i, o.ge.slice(0, 12));
    if (Array.isArray(o.gh)) mpGangHits(o.i, o.gh.slice(0, 12));
    const sw = o.sw; if (sw && typeof sw === 'object' && typeof sw.k === 'string' && sw.k.length <= 8 && Number.isFinite(+sw.a) && f.swK !== sw.k) { f.swK = sw.k; f.swT = gt; f.swA = +sw.a; }
    if (o.sn) { const gs = mpParseSn(o.sn); if (gs) f.gs = gs; }
    mpSlots();
    if (Array.isArray(o.st)) mpApplySteals(o.st.slice(0, 12));
    if (Array.isArray(o.od)) mpApplyOrders(o.i, o.od);
    if (Array.isArray(o.pu)) mpApplyPushes(o.i, o.pu.slice(0, 3));
    // v115: -kill ueber den Mehrspieler ist abgeschaltet (jeder haette es faelschen koennen), das geht jetzt sicher ueber die Admin-App
    f.bins = binsParse(o.bn); // v61: Muelleimer
    if (Array.isArray(o.bw)) mpBinWants(o.i, f, o.bw.slice(0, 6));
    if (Array.isArray(o.bl)) mpBinLoot(o.i, f, o.bl.slice(0, 6));
    if (Array.isArray(o.ba)) mpBinAcks(o.i, o.ba.slice(0, 8)); // v123
    const em = o.em;
    if (em && typeof em === 'object' && typeof em.k === 'string' && em.k.length <= 8 && f.emK !== em.k) {
      if (EMOTES.some(q => q.id === em.i)) { f.emK = em.k; if (!f.emote || gt - f.emote.t > 0.6) f.emote = { id: em.i, t: gt }; }
      else if (typeof em.tx === 'string') { const tx = sayClean(em.tx); f.emK = em.k; if (tx && (!f.say || gt - f.say.t > 0.6)) f.say = { tx, t: gt }; }
    }
  }
  // Gemeinsame Kunden: jeder meldet seine offenen Aufträge, jeder darf jeden Kunden beliefern. Wer zuerst liefert, nimmt ihn den anderen weg.
  // Schubsen: B neben einem Freund. Wirkt nur, wenn er wirklich nah ist, kurz und schwach ist, und lässt sich in den Freunde-Einstellungen abschalten.
  function mpTryPush() {
    if (!mp.on || mp.pushCd > 0 || !G) return false;
    let best = null, bd = 40; for (const f of Object.values(mp.friends)) { if (!f.vis) continue; const d = Math.hypot(f.x - player.x, f.y - player.y); if (d < bd) { bd = d; best = f; } }
    if (!best) return false;
    const dx = best.x - player.x, dy = best.y - player.y, l = Math.hypot(dx, dy) || 1, ux = +(dx / l).toFixed(2), uy = +(dy / l).toFixed(2);
    mp.pushes.push({ k: best.id + ':' + Math.random().toString(36).slice(2, 8), dx: ux, dy: uy, t: gt }); mp.pushes = mp.pushes.filter(z => gt - z.t < 4);
    mp.pushCd = 1; best.tx += ux * 45; best.ty += uy * 45; best.x += ux * 30; best.y += uy * 30; best.x = clamp(best.x, XMIN, WW); best.y = clamp(best.y, YMIN, WH);
    floater(best.x, best.y - 26, '!', '#FFB547'); sfx.put(); msg('Du schubst ' + best.name + '!'); mp.sendT = 9; mpSend(); return true;
  }
  function mpApplyPushes(peer, list) {
    const f = mp.friends[peer]; if (!f || !G) return;
    for (const z of list) {
      if (!z || typeof z.k !== 'string' || z.k.length > 40) continue;
      const cut = z.k.indexOf(':'); if (cut < 1 || z.k.slice(0, cut) !== mp.id) continue;
      if (mp.seenPush[z.k]) continue; mp.seenPush[z.k] = gt;
      for (const k of Object.keys(mp.seenPush)) if (gt - mp.seenPush[k] > 8) delete mp.seenPush[k];
      const bd = typeof z.b === 'string' ? batDef(z.b) : null;
      if (!mp.pushOk || !f.vis || Math.hypot(f.x - player.x, f.y - player.y) > (bd ? bd.reach + 40 : 75)) continue;
      let ux = +z.dx, uy = +z.dy; if (!Number.isFinite(ux) || !Number.isFinite(uy)) continue; const l = Math.hypot(ux, uy); if (l < 0.01) continue; ux /= l; uy /= l;
      if (bd) {
        const block = G.wpn.eq !== 'none' && player.stun <= 0;
        const bm = block ? 0.45 - Math.min(0.25, guardOf(G.wpn.eq) / 80) : 1; // v50: je mehr Abwehr, desto weniger Rueckstoss
        mp.kb = { x: ux * bd.kb * bm, y: uy * bd.kb * bm, t: 0.3 };
        if (block) { floater(player.x, player.y - 24, 'Block', '#9FD3FF'); msg(f.name + ' schlägt zu, du hältst dagegen!', true); }
        else { player.stun = Math.max(player.stun, bd.stun); floater(player.x, player.y - 24, 'K.O.', '#FFD24A'); msg(f.name + ' haut dich um!', true); }
        sfx.bad(); continue;
      }
      mp.kb = { x: ux * 240, y: uy * 240, t: 0.3 }; floater(player.x, player.y - 24, '!', '#FF8FA3'); sfx.bad(); msg(f.name + ' schubst dich!', true);
    }
  }
  // -kill: setzt den Spielstand zurueck (nur Cosmetics bleiben). Bei einem Freund wirkt es sofort (ausser er hat Schubsen/Schlaeger aus). -undo stellt den alten Stand wieder her.
  let undoRaw = null;
  function doKill(by) {
    if (!G) return false;
    save(); backupSave(); undoRaw = store.get(SAVE_KEY, null);
    const keepCos = G.cos, keepLook = G.look, keepWear = G.wear, keepAch = G.ach, keepStat = G.stat;
    newGame(); G.cos = keepCos; G.look = keepLook; G.wear = keepWear; G.ach = keepAch; G.stat = keepStat;
    mp.killReq = null; mpDropOrders(null);
    begin(false); msg(by ? by + ' hat dich gekillt: selber schuld! Mit -undo holst du alles zurück.' : 'Alles zurückgesetzt, nur die Cosmetics bleiben. Mit -undo holst du den alten Stand zurück.', !!by);
    return true;
  }
  function undoKill() {
    if (!undoRaw) return false;
    store.set(SAVE_KEY, undoRaw);
    if (!load()) return false;
    undoRaw = null; mpDropOrders(null); begin(false); msg('Alter Stand wiederhergestellt'); return true;
  }
  function mpApplyKills(peer, list) {
    const f = mp.friends[peer]; if (!f || !G) return;
    for (const k of list) {
      if (typeof k !== 'string' || k.length > 40) continue;
      const cut = k.indexOf(':'); if (cut < 1 || k.slice(0, cut) !== mp.id) continue;
      if (mp.seenPush[k]) continue; mp.seenPush[k] = gt;
      if (!mp.pushOk) continue; // wer Schubsen/Schläger von Freunden ausgeschaltet hat, bleibt verschont
      doKill(f.name); chatSay(f.name + ' hat dich gekillt: selber schuld!', true);
    }
  }
  function mpDropOrders(peer) { if (!G) return; for (let i = G.orders.length - 1; i >= 0; i--) if (peer === null ? G.orders[i].remote : G.orders[i].remote === peer) G.orders.splice(i, 1); }
  function mpSteal(o) { mp.steals.push({ k: o.remote + ':' + o.rid, t: gt }); mp.steals = mp.steals.filter(z => gt - z.t < 6); mp.sendT = 9; mpSend(); }
  function mpApplySteals(list) {
    if (!G) return;
    for (const k of list) {
      if (typeof k !== 'string' || k.length > 40) continue;
      const cut = k.lastIndexOf(':'); if (cut < 1) continue; const owner = k.slice(0, cut), oid = k.slice(cut + 1);
      for (let i = G.orders.length - 1; i >= 0; i--) {
        const x = G.orders[i];
        if (owner === mp.id && !x.remote && String(x.id) === oid) { msg('Ein Freund hat dir ' + HOUSES[x.house].name + ' weggeschnappt!', true); G.orders.splice(i, 1); }
        else if (x.remote === owner && x.rid === oid) G.orders.splice(i, 1);
      }
    }
  }
  function mpApplyOrders(peer, arr) {
    if (!G) return;
    const keep = new Set();
    for (const d of arr.slice(0, 7)) {
      if (!d || typeof d !== 'object') continue;
      if (d.p === 'pr') continue; // v103: Apotheken-Kunden bleiben beim Freund
      const rid = String(d.i), house = Math.floor(+d.h), qty = Math.floor(+d.q), prod = d.p === 'tabak' ? 'tabak' : d.p === 'brau' ? 'brau' : 'keller';
      if (!isOpen(AREAS[prod])) continue; // v118: Kunden anderer Spieler nur fuer Produktionen, die du selbst schon hast
      if (!/^\d{1,9}$/.test(rid) || !(house >= 0 && house < HOUSES.length) || !(qty >= 1 && qty <= 6)) continue;
      const id = 'r' + peer + ':' + rid; let ex = G.orders.find(x => x.id === id);
      if (!ex) {
        const clash = G.orders.find(x => x.house === house);
        if (clash) { const ca = clash.remote || mp.id; if (ca < peer) continue; if (!clash.remote) msg(HOUSES[house].name + ' hat sich für einen Freund entschieden', true); G.orders.splice(G.orders.indexOf(clash), 1); }
        ex = { id, rid, remote: peer, house, prod, qty, price: 0, mob: false, vip: false, t: 1, tmax: 1, x: HOUSES[house].dx, y: HOUSES[house].dy, pause: 0, ang: 0 }; G.orders.push(ex);
      }
      keep.add(id);
      const num = (v, a, b, dflt) => Number.isFinite(+v) ? clamp(+v, a, b) : dflt;
      ex.prod = prod; ex.qty = qty; ex.price = Math.round(num(d.r, 0, 20000, ex.price)); ex.mob = !!d.m; ex.vip = !!d.v; ex.tmax = num(d.tm, 1, 400, ex.tmax); ex.t = num(d.t, 0, ex.tmax, ex.t);
      ex.x = num(d.x, 0, WW, ex.x); ex.y = num(d.y, YMIN, WH, ex.y);
    }
    for (let i = G.orders.length - 1; i >= 0; i--) if (G.orders[i].remote === peer && !keep.has(G.orders[i].id)) G.orders.splice(i, 1);
  }

  // ---------- Grundstuecke: Schnappschuss senden, pruefen, Plaetze verteilen ----------
  const SN_KEYS = { keller: 'k', tabak: 't', brau: 'b' };
  function mpSnap() {
    const o = { v: 1 }, rd = Math.round;
    for (const k of AREA_KEYS) {
      const ar = AREAS[k], t = S(ar), L = captureLayout(ar);
      o[SN_KEYS[k]] = {
        u: k === 'keller' || t.unlocked ? 1 : 0, f: [G.build.floor[k].c | 0, G.build.floor[k].p | 0], d: G.build.door[k] ? 1 : 0,
        L: [].concat(...L.pots.map(p => p.slice(0, 2)), L.rack.slice(0, 2), L.table.slice(0, 2)).map(rd), R: L.pots.map(p => p[2] | 0).join('') + (L.rack[2] | 0) + (L.table[2] | 0), o: potsOpen(ar), r: t.up.rack | 0,
        w: [rd(t.rack.wet * 10) / 10, rd(t.rack.dry * 10) / 10], b: [Math.min(99, t.tab.bags | 0), rd(t.tab.dry)],
        pl: t.pots.map(q => '' + clamp(q.s | 0, 0, 2) + clamp(rd(q.p * 9), 0, 9) + clamp(rd(q.w * 9), 0, 9)).join(''),
        dc: G.dec.items[k].slice(0, MAXDEC).map(it => it.q ? [it.id, rd(it.x), rd(it.y), it.r | 0, it.q | 0] : it.r ? [it.id, rd(it.x), rd(it.y), it.r | 0] : [it.id, rd(it.x), rd(it.y)])
      };
    }
    if (G.pr && G.pr.own && G.lager.own) { const P = G.pr; o.pr = { n: P.n, r: P.up.rack | 0, pl: P.pots.map(q => '' + clamp(q.s | 0, 0, 2) + clamp(rd(q.p * 9), 0, 9) + clamp(rd(q.w * 9), 0, 9)).join(''), w: [rd(P.rack.wet * 10) / 10, rd(P.rack.dry * 10) / 10], b: [Math.min(99, P.tab.bags | 0), rd(P.tab.dry)] }; } // v89: Mietraum
    return o;
  }
  // Fremde Schnappschuesse werden vollstaendig geprueft und begrenzt; Fehler -> null (dann gibt es einfach kein Grundstueck)
  function mpParseSn(sn) {
    if (!sn || typeof sn !== 'object') return null;
    const n = (v, a, b, d) => Number.isFinite(+v) ? clamp(+v, a, b) : d;
    const gs = { up: { pots: 0, rack: 0, bag: 0 }, build: { door: {}, floor: {} }, dec: { items: {} }, lay: {} };
    for (const k of AREA_KEYS) {
      const ar = AREAS[k], a = sn[SN_KEYS[k]]; if (!a || typeof a !== 'object') return null;
      const np = ar.POTS.length, fl = Array.isArray(a.f) ? a.f : [0, 0], I = ar.IN, base = BASE[k];
      gs.build.floor[k] = { c: Math.round(n(fl[0], 0, FLOOR_COLORS.length - 1, 0)), p: Math.round(n(fl[1], 0, 3, 0)) };
      gs.build.door[k] = !!a.d;
      const up = { pots: Math.round(n(a.o, 2, np, 2)) - 2, rack: Math.round(n(a.r, 0, 30, 0)), bag: 0 };
      const pl = typeof a.pl === 'string' ? a.pl.slice(0, np * 3) : '';
      const pots = ar.POTS.map((_, i) => { const s2 = +pl[i * 3], p2 = +pl[i * 3 + 1], w2 = +pl[i * 3 + 2]; return { s: s2 >= 0 && s2 <= 2 ? s2 : 0, p: p2 >= 0 && p2 <= 9 ? p2 / 9 : 0, w: w2 >= 0 && w2 <= 9 ? w2 / 9 : 1 }; });
      const w = Array.isArray(a.w) ? a.w : [0, 0], b = Array.isArray(a.b) ? a.b : [0, 0];
      const part = { unlocked: k === 'keller' ? true : !!a.u, pots, rack: { wet: n(w[0], 0, 999, 0), dry: n(w[1], 0, 999, 0) }, tab: { bags: Math.round(n(b[0], 0, 99, 0)), dry: n(b[1], 0, 999, 0) }, up };
      if (k === 'keller') { gs.pots = pots; gs.rack = part.rack; gs.tab = part.tab; gs.up = up; } else gs[k === 'tabak' ? 't' : 'b'] = part;
      const Lr = Array.isArray(a.L) ? a.L : [], px = (i, d, lo, hi) => Math.round(n(Lr[i], lo, hi, d)), Rs = typeof a.R === 'string' ? a.R : '', rq = i => { const v = +Rs[i]; return v >= 1 && v <= 3 ? v : 0; };
      gs.lay[k] = {
        pots: ar.POTS.map((_, i) => [px(i * 2, base.pots[i][0], I.x0 + 17, I.x1 - 17), px(i * 2 + 1, base.pots[i][1], I.y0 + 17, I.y1 - 17), rq(i)]),
        rack: [px(np * 2, base.rack[0], I.x0 + 28, I.x1 - 28), px(np * 2 + 1, base.rack[1], I.y0 + 28, I.y1 - 28), rq(np)],
        table: [px(np * 2 + 2, base.table[0], I.x0 + 24, I.x1 - 24), px(np * 2 + 3, base.table[1], I.y0 + 24, I.y1 - 24), rq(np + 1)]
      };
      const items = [];
      for (const d of (Array.isArray(a.dc) ? a.dc.slice(0, MAXDEC) : [])) {
        if (!Array.isArray(d) || typeof d[0] !== 'string' || !DECOR.some(q => q.id === d[0]) || !Number.isFinite(+d[1]) || !Number.isFinite(+d[2])) continue;
        const it2 = { id: d[0], x: clamp(+d[1], I.x0, I.x1), y: clamp(+d[2], I.y0, I.y1) }, r2 = clamp(Math.floor(+d[3]) || 0, 0, 3); if (r2) it2.r = r2; const q2 = clamp(Math.floor(+d[4]) || 0, 0, 3); if (q2 && !RUGS.includes(d[0])) it2.q = q2; items.push(it2);
      }
      gs.dec.items[k] = items;
    }
    gs.pr = null; // v89: Mietraum mit Premium-Anbau (nur ansehen)
    if (sn.pr && typeof sn.pr === 'object') { const a = sn.pr, pl = typeof a.pl === 'string' ? a.pl.slice(0, PR_MAX * 3) : '', w = Array.isArray(a.w) ? a.w : [0, 0], b = Array.isArray(a.b) ? a.b : [0, 0];
      gs.pr = Object.assign(prDef(), { own: true, n: Math.round(n(a.n, 2, PR_MAX, 2)), rack: { wet: n(w[0], 0, 999, 0), dry: n(w[1], 0, 999, 0) }, tab: { bags: Math.round(n(b[0], 0, 99, 0)), dry: n(b[1], 0, 999, 0) } }); gs.pr.up.rack = Math.round(n(a.r, 0, 5, 0));
      gs.pr.pots = PR_POTS.map((_, i) => { const s2 = +pl[i * 3], p2 = +pl[i * 3 + 1], w2 = +pl[i * 3 + 2]; return { s: s2 >= 0 && s2 <= 2 ? s2 : 0, p: p2 >= 0 && p2 <= 9 ? p2 / 9 : 0, w: w2 >= 0 && w2 <= 9 ? w2 / 9 : 1 }; }); }
    return gs;
  }
  // Wo bin ich? Im eigenen Zuhause, in einem Freundes-Grundstueck oder auf der gemeinsamen Strasse.
  function plotAt(x) { return x < 0 ? Math.ceil(-x / PLOT_W) - 1 : -1; } // alt, nur noch fuer Kompatibilitaet
  // v86: Freunde liegen wieder direkt links neben dem eigenen Keller und sind zu Fuss erreichbar.
  // Erst kommen alle Keller (je KW breit), weiter links die Farmen (Tabakscheune und Brauerei, je FW breit), aber nur fuer Freunde, die sie gekauft haben.
  const KW = 640, FW = 600, FARM_X = 1890;
  const kOx = j => -KW * (j + 1);
  const fOx = i => -KW * mp.slots.length - FW * (i + 1);
  function farmIds() { return mp.slots.filter(id => { const f = id && mp.friends[id]; return !!(f && f.gs && ((f.gs.t && f.gs.t.unlocked) || (f.gs.b && f.gs.b.unlocked))); }); }
  function slotAt(x) { // { k: 'k', j } fuer Keller, { k: 'f', i, id } fuer Farm, null in der Stadt
    if (x >= 0) return null; const nK = mp.slots.length;
    if (x >= -KW * nK) return { k: 'k', j: Math.ceil(-x / KW) - 1 };
    const i = Math.ceil((-x - KW * nK) / FW) - 1, ids = mp.farms || []; return i < ids.length ? { k: 'f', i, id: ids[i] } : null;
  }
  function ghostWalls(e, r) { // Waende der Freundes-Gebaeude als Hindernisse
    const sl = slotAt(e.x); if (!sl) return; let list = [], ox = 0;
    if (sl.k === 'k') { if (!mp.slots[sl.j]) return; ox = kOx(sl.j); for (let i = 0; i < 5; i++) list.push(colliders[i]); }
    else { const f = mp.friends[sl.id]; if (!f || !f.gs) return; ox = fOx(sl.i) - FARM_X; if (f.gs.t && f.gs.t.unlocked) list = list.concat(BARN_WALLS); if (f.gs.b && f.gs.b.unlocked) list = list.concat(BREW_WALLS); }
    for (const c of list) {
      const cx = c.x + ox, nx = clamp(e.x, cx, cx + c.w), ny = clamp(e.y, c.y, c.y + c.h), ddx = e.x - nx, ddy = e.y - ny, d2 = ddx * ddx + ddy * ddy;
      if (d2 < r * r) { if (d2 > 1e-6) { const d = Math.sqrt(d2), k = (r - d) / d; e.x += ddx * k; e.y += ddy * k; } else { const l = e.x - cx, rt = cx + c.w - e.x, t = e.y - c.y, b = c.y + c.h - e.y, m = Math.min(l, rt, t, b); if (m === l) e.x = cx - r; else if (m === rt) e.x = cx + c.w + r; else if (m === t) e.y = c.y - r; else e.y = c.y + c.h + r; } }
    }
  }
  function mpWhere() {
    const x = player.x, y = player.y;
    if (x < 0) {
      const sl = slotAt(x); if (!sl) return { rg: '-', x: 0, y };
      if (sl.k === 'k') { const id = mp.slots[sl.j]; if (!id) return { rg: '-', x: 0, y }; const xl = x - kOx(sl.j); return xl > 30 && xl < 620 && y < 560 ? { rg: id, x: xl, y } : { rg: '', x: Math.max(0, x), y }; }
      const xl = x - fOx(sl.i) + FARM_X; return inBuilding(xl, y) ? { rg: sl.id, x: xl, y } : { rg: '', x: Math.max(0, x), y };
    }
    if (player.fl === 4) return { rg: myGid().slice(0, 20) + ':h', x, y }; // v121: Gang-HQ (nur fuer Mitglieder sichtbar)
    if (player.fl === 3) return { rg: mp.id + ':b', x, y }; // v100: Hinterzimmer (fuer andere unsichtbar)
    if (player.fl === 2) return { rg: (prVisit || mp.id) + ':r', x, y }; // v89: im Mietraum (eigener oder Besuch)
    if (inBuilding(x, y)) return { rg: mp.id, x, y }; // v72: nur in den eigenen Raeumen, sonst gemeinsame Stadt
    return { rg: '', x, y };
  }
  function mpMapPos(rg, lx, ly) {
    if (rg && rg.slice(-2) === ':h') return player.fl === 4 && myGid() && rg === myGid().slice(0, 20) + ':h' ? [lx, ly] : null; // v121
    if (rg && rg.slice(-2) === ':r') return player.fl === 2 && rg === (prVisit || mp.id) + ':r' ? [lx, ly] : null; // v89: Mietraum
    if (!rg || rg === mp.id) return [lx, ly];
    const j = mp.slots.indexOf(rg); if (j < 0) return null;
    if (lx < 800) return [lx + kOx(j), ly];
    const i = (mp.farms || []).indexOf(rg); return i < 0 ? null : [lx - FARM_X + fOx(i), ly];
  }
  function mpPlace(f) {
    const q = mpMapPos(f.rg, f.lx, f.ly), was = f.vis;
    if (!q) { f.vis = false; return; }
    f.vis = true; f.tx = clamp(q[0], XMIN, WW); f.ty = clamp(q[1], YMIN, WH); if (!was) { f.x = f.tx; f.y = f.ty; }
  }
  function mpSlots() {
    const sl = mp.slots;
    for (let i = 0; i < sl.length; i++) if (sl[i] && !(mp.friends[sl[i]] && mp.friends[sl[i]].gs)) sl[i] = null;
    for (const f of Object.values(mp.friends)) if (f.gs && !sl.includes(f.id)) { const e = sl.indexOf(null); if (e >= 0) sl[e] = f.id; else if (sl.length < MAX_PLOTS) sl.push(f.id); }
    while (sl.length && !sl[sl.length - 1]) sl.pop();
    mp.farms = farmIds(); XMIN = -KW * sl.length - FW * mp.farms.length;
    if (G && player.x < XMIN) { player.x = DOOR.x; player.y = DOOR.y; cam.x = player.x; cam.y = player.y; msg('Das Grundstück ist weg, du bist wieder zu Hause'); }
    for (const f of Object.values(mp.friends)) mpPlace(f);
  }
  function mpVisit(id) {
    const j = mp.slots.indexOf(id); if (j < 0 || !G) return false;
    player.x = kOx(j) + 410; player.y = 548; player.fl = 0; cam.x = player.x; cam.y = player.y;
    const f = mp.friends[id]; closePhone(); msg('Du besuchst ' + (f ? f.name : 'einen Freund') + '. Die Stadt ist rechts die Straße entlang.'); return true;
  }
  // v72: Kellertreff in der Stadt: Treppe hinunter zu den Kellern der Freunde, zurueck ueber den Ausgang am Ende ihrer Strasse
  const atTreff = () => !!G && !player.fl && player.x >= 0 && Math.hypot(player.x - TREFF_AT.x, player.y - TREFF_AT.y) < 44;
  function openTreff() { if (!atTreff()) return false; tab = 'friends'; openPhone(); sfx.ping(); return true; }
  function treffReturn() { if (!G) return false; player.x = TREFF_AT.x; player.y = TREFF_AT.y; player.fl = 0; cam.x = player.x; cam.y = player.y; msg('Zurück in der Stadt am Kellertreff'); return true; }
  // v75: Gruppe neu laden: frische Verbindung zum Hauptserver (alle landen auf demselben Server), Freundesliste wird neu aufgebaut
  function mpReload() {
    const c = mpLoadCfg(), name = mp.name || c.name, room = MP_DEF_ROOM;
    if (!name) { closePhone(); nameGateShow(); return false; }
    mp.bi = 0; mpConnect(room, name); msg('Verbindung wird neu geladen …'); return true;
  }
  function mpHome() { if (!G) return false; player.x = DOOR.x; player.y = DOOR.y; player.fl = 0; cam.x = player.x; cam.y = player.y; closePhone(); msg('Wieder zu Hause'); return true; }
  function mpSend() {
    const c = mp.client; if (!c || !c.connected || !G) return;
    let sn; if (gt - mp.snT > 4 || gt - mp.snChk > 0.6) { mp.snChk = gt; const q = mpSnap(), sg = JSON.stringify(AREA_KEYS.map(k => { const a = q[SN_KEYS[k]]; return [a.u, a.f, a.d, a.L, a.o, a.r, a.dc]; })); if (gt - mp.snT > 4 || sg !== mp.snSig) { sn = q; mp.snSig = sg; mp.snT = gt; } }
    const wh = mpWhere(); mp.copHits = mp.copHits.filter(z => gt - z.t < 3); const lead = copLead(); mp.gEv = mp.gEv.filter(z => gClock - z.t < 3); mp.gHit = mp.gHit.filter(z => gClock - z.t < 3);
    try { c.publish(mpBase() + '/' + mp.id, JSON.stringify({ i: mp.id, n: mp.name, vr: GAME_VER, ma: masterOn ? 1 : undefined, ps: presLv() || undefined, gt: gTag() || undefined, gc: gTag() ? (G.gang.col || 0) : undefined, u: accOn() ? acc.uid : undefined, pk: admPokes(), cy: carryTotal() > 0 ? 1 : 0, ch: mp.copHits.map(z => ({ k: z.k, i: z.i, s: z.s, o: z.o })), cp: lead ? copSync() : undefined, cr: lead ? carSync() : undefined, gg: lead && gangs.length ? gangSync() : lead ? [] : undefined, gd: lead && drops.length ? dropSync() : lead ? [] : undefined, ge: lead && mp.gEv.length ? mp.gEv : undefined, gh: !lead && mp.gHit.length ? mp.gHit : undefined, x: Math.round(wh.x), y: Math.round(wh.y), rg: wh.rg, sn, a: Math.round(player.ang * 100) / 100, l: G.look, p: activePets(), od: G.orders.filter(o => !o.remote).map(o => ({ i: o.id, h: o.house, p: o.prod, q: o.qty, r: o.price, m: o.mob ? 1 : 0, v: o.vip ? 1 : 0, t: Math.round(o.t), tm: o.tmax, x: Math.round(o.x), y: Math.round(o.y) })), st: mp.steals.filter(z => gt - z.t < 4).map(z => z.k), pu: mp.pushes.filter(z => gt - z.t < 3).map(z => ({ k: z.k, dx: z.dx, dy: z.dy, b: z.b })), kl: mp.kills.filter(z => gt - z.t < 3).map(z => z.k), bn: binList(), bw: (mp.bw = mp.bw.filter(z => gt - z.t < 3)).length ? mp.bw.map(z => ({ k: z.k, to: z.to, b: z.b })) : undefined, bl: (mp.bl = mp.bl.filter(z => gt - z.t < 3)).length ? mp.bl.map(z => ({ k: z.k, to: z.to, s: z.s })) : undefined, ba: (mp.ba = mp.ba.filter(z => gt - z.t < 5)).length ? mp.ba.map(z => ({ k: z.k, to: z.to })) : undefined, bt: G.wpn.eq !== 'none' ? G.wpn.eq : '', vh: riding() ? G.veh.eq : '', vc: riding() && VEH_BY[G.veh.eq].car ? carColI(G.veh.eq) : undefined, vt: riding() && VEH_BY[G.veh.eq].car ? tuneArr(G.veh.eq) : undefined, sw: player.swInfo && gt - player.swInfo.t < 1 ? { k: player.swInfo.k, a: Math.round(player.swInfo.a * 100) / 100 } : 0, em: (myEm.id && gt - myEm.t < 3) || (myEm.tx && gt - myEm.t < 5) ? { i: myEm.id || undefined, tx: myEm.tx || undefined, k: myEm.k } : 0 }), { qos: 0 }); } catch (e) {}
  }
  function mpTick(dt) {
    if (!mp.on) return;
    if (G && (state === 'play' || state === 'edit')) { mp.sendT += dt; if (mp.sendT >= 0.2 + Math.max(0, Object.keys(mp.friends).length - 8) * 0.015) { mp.sendT = 0; mpSend(); } } // v61: bei vielen Spielern etwas seltener senden
    for (const id of Object.keys(mp.friends)) {
      const f = mp.friends[id];
      if (gt - f.seen > MP_TIMEOUT) { delete mp.friends[id]; mpDropOrders(id); msg(f.name + ' ist nicht mehr da'); continue; }
      if (!f.vis) continue;
      const dx = f.tx - f.x, dy = f.ty - f.y, d = Math.hypot(dx, dy), k = d > 400 ? 1 : Math.min(1, dt * 9);
      f.x += dx * k; f.y += dy * k; f.moving = d > 1.5; if (f.moving) f.step += Math.min(d, 12) * 0.12 * 0.5;
    }
    mpSlots();
    if (mp.pushCd > 0) mp.pushCd -= dt;
    mp.listT += dt; if (mp.listT > 1) { mp.listT = 0; mpRefreshList(false); }
  }
  function mpDraw(only) {
    const fl = Object.values(mp.friends).filter(f => f.vis && (only ? only(f) : !(f.rg && f.rg.slice(-2) === ':r'))); if (!fl.length) return;
    fl.sort((a, b) => a.y - b.y);
    for (const f of fl) {
      ctx.save(); ctx.globalAlpha = 0.9;
      if (f.pets[0]) drawPet(f.pets[0], f.x - 20, f.y + 2, Math.cos(f.ang) >= 0 ? 1 : -1, gt, f.moving, 0.85);
      const fBack = f.bat && !(f.swT !== undefined && gt - f.swT < WPN_HOLD) && !(f.vh && VEH_BY[f.vh] && VEH_BY[f.vh].car); // v77: Waffe auf dem Ruecken, nach Benutzung 3 s in der Hand
      if (fBack && !figUp(f.ang)) drawBatBack(f.x, f.y, f.bat, f.ang);
      if (f.vh) drawRide(f.x, f.y, f.ang, f.vh, f.look, f.step * 0.7, f.vc, f.vt); else drawFigure(f.x, f.y, f.ang, f.step, f.look);
      if (fBack && figUp(f.ang)) drawBatBack(f.x, f.y, f.bat, f.ang);
      if (f.bat && !fBack) { const sp = f.swT !== undefined && gt - f.swT < 0.3 ? (gt - f.swT) / 0.3 : -1; drawBat(f.x, f.y, sp >= 0 ? f.swA : f.ang, sp, f.bat); }
      if (f.ko !== undefined && gt - f.ko < 1) drawStars(f.x, f.y - 12, gt);
      ctx.restore();
      ctx.font = '700 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(16,21,28,.85)'; const fnm = (f.ps ? '✦' + f.ps + ' ' : '') + f.name; ctx.strokeText(fnm, f.x, f.y - 22); ctx.lineJoin = 'miter'; ctx.fillStyle = f.ps ? '#E2CCFF' : '#EAF2FF'; ctx.fillText(fnm, f.x, f.y - 22);
      if (f.gt) { ctx.font = '900 8px sans-serif'; ctx.lineWidth = 2.5; ctx.strokeText('[' + f.gt + ']', f.x, f.y - 33); ctx.fillStyle = GCOL[f.gc] || '#FFB547'; ctx.fillText('[' + f.gt + ']', f.x, f.y - 33); }
      if (f.ma) drawMaster(f.x, f.y - 34);
      if (f.emote && f.emote.id) drawEmoteBubble(f.x, f.y - 8, f.emote.id, f.emote.t);
      if (f.say) drawSayBubble(f.x, f.y - 8, f.say.tx, f.say.t);
    }
  }
  function mpRefreshList(force) {
    const st = document.getElementById('mpStatus'), ls = document.getElementById('mpList');
    if (!phoneOpen || (tab !== 'friends' && tab !== 'group') || !st) return;
    st.textContent = mp.status; if (!ls) return;
    const fl = Object.values(mp.friends), sig = fl.map(f => f.name + mp.slots.indexOf(f.id) + f.rg + f.vr).join('|') + '#' + mp.on + XMIN;
    if (!force && ls.dataset.sig === sig) return; ls.dataset.sig = sig;
    ls.innerHTML = '';
    if (!mp.on) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = 'Nicht verbunden.'; ls.appendChild(e); return; }
    if (!fl.length) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = mp.on ? 'Gerade ist niemand sonst online. Sobald jemand spielt, siehst du ihn hier.' : 'Du bist offline. Geh unter „Online“ online, dann siehst du alle anderen Spieler.'; ls.appendChild(e); return; }
    for (const f of fl) { const c = document.createElement('div'); c.className = 'card'; const n = document.createElement('div'); n.className = 'nm'; n.textContent = f.name; const d = document.createElement('div'); d.className = 'pr'; d.textContent = 'online · ' + friendWhere(f) + (f.vr && f.vr !== GAME_VER ? ' · andere Version!' : !f.vr ? ' · alte Version!' : ''); c.appendChild(n); c.appendChild(d);
      const j = mp.slots.indexOf(f.id);
      if (j >= 0) { const vb = document.createElement('button'); vb.className = 'buy alt'; vb.textContent = 'Besuchen'; vb.addEventListener('click', () => mpVisit(f.id)); c.appendChild(vb); }
      ls.appendChild(c); }
    if (mp.slots.length) { const hb = document.createElement('button'); hb.className = 'buy alt'; hb.textContent = player.x < 0 ? 'Zurück zu meinem Keller' : 'Zu meinem Keller'; hb.addEventListener('click', () => mpHome()); ls.appendChild(hb); }
  }
  function renderGroup(b) { // v116: keine Gruppen mehr, alle Spieler sind zusammen online
    const cfg = mpLoadCfg(), card = document.createElement('div'); card.className = 'card'; card.style.display = 'block';
    const mk = (tag, txt) => { const e = document.createElement(tag); if (txt) e.textContent = txt; return e; };
    const hd = mk('div', mp.on ? '🟢 Online · ' + Object.keys(mp.friends).length + ' andere Spieler' : '⚪ Offline'); hd.className = 'nm'; hd.style.marginBottom = '4px'; card.appendChild(hd);
    card.appendChild(mk('div', 'Wenn du online bist, siehst du alle anderen Spieler herumlaufen und sie dich. Jeder behält sein eigenes Spiel, Geld und Ruf. Die Kunden sind aber gemeinsam: Wer zuerst liefert, schnappt sie den anderen weg.')).className = 'ds';
    const nm = mk('div', 'Dein Name: ' + (mp.name || cfg.name || '–')); nm.className = 'ds'; nm.id = 'mpName'; nm.style.marginTop = '6px'; card.appendChild(nm);
    const row = mk('div'); row.style.cssText = 'display:flex;gap:8px;margin-top:8px;flex-wrap:wrap';
    const go = mk('button', mp.on ? 'Offline gehen' : 'Online gehen'); go.className = 'buy' + (mp.on ? ' alt' : '');
    go.addEventListener('click', () => { if (mp.on) mpDisconnect(false); else if (!(mp.name || cfg.name)) { closePhone(); nameGateShow(); } else mpGoOnline(); renderPhone(); });
    const rl = mk('button', '⟳ Verbindung neu laden'); rl.className = 'buy alt'; rl.addEventListener('click', () => { mpReload(); renderPhone(); });
    row.appendChild(go); row.appendChild(rl); card.appendChild(row);
    const pb = mk('button', 'Schubsen und Schläger von anderen: ' + (mp.pushOk ? 'erlaubt' : 'aus')); pb.className = 'buy alt'; pb.style.cssText = 'margin-top:8px;padding:8px 14px;width:100%';
    pb.addEventListener('click', () => { mp.pushOk = !mp.pushOk; mpSaveCfg(mp.on); renderPhone(); }); card.appendChild(pb);
    const hint = mk('div', 'Neben jemandem B drücken: du schubst ihn ein Stück weg (mit Schläger aus dem Reiter Waffen: du haust ihn um).'); hint.className = 'ds'; hint.style.marginTop = '6px'; card.appendChild(hint);
    const st = mk('div', mp.status); st.id = 'mpStatus'; st.className = 'ds'; st.style.marginTop = '8px'; card.appendChild(st);
    const note = mk('div', 'Online sehen alle anderen Spieler deinen Namen und wo du gerade bist.'); note.className = 'ds'; note.style.cssText = 'margin-top:6px;opacity:.7;font-size:12px'; card.appendChild(note);
    b.appendChild(card);
  }
  function mpGoOnline() { const c = mpLoadCfg(); if (!(mp.name || c.name)) return false; mp.room = MP_DEF_ROOM; const ok = mpConnect(MP_DEF_ROOM, mp.name || c.name); mpSaveCfg(true); return ok; }
  function renderFriendsTab(b) {
    const mk = (tag, txt) => { const e = document.createElement(tag); if (txt) e.textContent = txt; return e; };
    const top = mk('div'); top.className = 'card'; top.style.gridTemplateColumns = '1fr auto';
    const st = mk('div', mp.status); st.id = 'mpStatus'; st.className = 'ds'; st.style.gridColumn = '1';
    const gb = mk('button', mp.on ? 'Online-Einstellungen' : 'Online gehen'); gb.className = 'buy alt'; gb.addEventListener('click', () => { tab = 'group'; renderPhone(); });
    const rl = mk('button', '⟳ Neu laden'); rl.className = 'buy alt'; rl.addEventListener('click', () => { mpReload(); renderPhone(); });
    const brow = mk('div'); brow.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;grid-column:1 / -1;margin-top:6px'; brow.appendChild(gb); brow.appendChild(rl); // v87: Knoepfe lagen am Handy uebereinander
    st.style.gridColumn = '1 / -1'; top.style.gridTemplateColumns = '1fr'; top.appendChild(st); top.appendChild(brow); b.appendChild(top);
    const ls = mk('div'); ls.id = 'mpList'; ls.style.cssText = 'display:grid;gap:8px'; b.appendChild(ls); mpRefreshList(true);
  }
  // v72: Standardgruppe 111026. Wer noch keinen Namen hat, legt beim Start einen fest; er ist danach fest und unter Einstellungen → Profil aenderbar.
  const MP_DEF_ROOM = '111026', GAME_VER = 138; try { window.__KG_VER = GAME_VER; } catch (e) {}
  // v74: Wo ist ein Freund? Im eigenen Keller sieht man ihn nicht in der Stadt, darum Anzeige am Kellertreff und in der Liste
  const friendWhere = f => !f.rg ? 'in der Stadt' : f.rg === mp.id ? 'bei dir zu Besuch' : f.rg === f.id ? 'in seinem Keller' : 'bei ' + ((mp.friends[f.rg] || {}).name || 'einem Freund') + ' zu Besuch';
  const friendsAway = () => Object.values(mp.friends).filter(f => f.rg && f.rg !== mp.id);
  let nameGateOpen = false;
  function mpAuto() {
    const c = mpLoadCfg(); mp.pushOk = c.push; if (!mp.name && c.name) mp.name = c.name;
    if (!c.g72) { c.room = MP_DEF_ROOM; c.auto = true; c.g72 = true; store.set(MP_KEY, JSON.stringify({ name: c.name, room: c.room, auto: true, push: c.push, g72: 1 })); } // einmalig: alle in die Standardgruppe
    if (store.get('kellergruen.g116', '') !== '1') { store.set('kellergruen.g116', '1'); c.auto = true; c.room = MP_DEF_ROOM; store.set(MP_KEY, JSON.stringify({ name: c.name, room: MP_DEF_ROOM, auto: true, push: c.push, g72: 1 })); } // v116: keine Gruppen mehr, einmalig alle online
    c.room = MP_DEF_ROOM; if (mp.on && mp.room !== MP_DEF_ROOM) mpDisconnect(true);
    if (!c.name) { nameGateShow(); return; }
    if (c.auto && c.room && !mp.on) mpConnect(c.room, c.name);
  }
  function setPlayerName(v) {
    const n = mpClean(v, 12); if (n.length < 2) return false;
    const c = mpLoadCfg(); mp.name = n; store.set(MP_KEY, JSON.stringify({ name: n, room: c.room, auto: c.auto, push: c.push, g72: c.g72 ? 1 : 0 }));
    if (mp.on) mp.sendT = 9; return true;
  }
  function nameGateShow() {
    nameGateOpen = true; joy.id = null; joy.dx = joy.dy = 0; aHeld = false;
    try { const g = $('nameGate'), i = $('ngName'); g.hidden = false; i.value = mp.name || ''; $('ngErr').textContent = ''; setTimeout(() => { try { i.focus(); } catch (e) {} }, 80); } catch (e) {}
  }
  function nameGateOk() {
    const i = $('ngName');
    if (!setPlayerName(i ? i.value : '')) { try { $('ngErr').textContent = 'Bitte mindestens 2 Zeichen: Buchstaben, Zahlen oder Leerzeichen.'; } catch (e) {} sfx.bad(); return false; }
    nameGateOpen = false; try { $('nameGate').hidden = true; i.blur(); } catch (e) {}
    const c = mpLoadCfg(); msg('Hallo ' + mp.name + '!' + (c.auto ? ' Du bist online und siehst alle anderen Spieler.' : '')); mpAuto(); return true;
  }
  $('ngOk').addEventListener('click', nameGateOk);
  $('ngName').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); nameGateOk(); } e.stopPropagation(); });
  $('ngName').addEventListener('keyup', e => e.stopPropagation());
  function renderProfile(b) {
    const mk = (tag, txt, cls) => { const e = document.createElement(tag); if (txt) e.textContent = txt; if (cls) e.className = cls; return e; };
    if (fbOk()) { // v113: Konto
      const ac = mk('div', '', 'card'); ac.style.gridTemplateColumns = '1fr';
      ac.appendChild(mk('div', accOn() ? '👤 Konto: ' + acc.name : '☁️ Kein Konto', 'nm'));
      ac.appendChild(mk('div', accOn() ? 'Dein Spielstand wird online gesichert' + (accLast ? ' (zuletzt ' + agoTxt(accLast) + ')' : '') + '. Melde dich auf einem anderen Gerät mit Name und Passwort an, um dort weiterzuspielen.' + (accState ? ' ' + accState + '.' : '') : 'Du spielst ohne Konto, dein Spielstand liegt nur auf diesem Gerät. Mit einem Konto (Name und Passwort) bleibt er sicher und du kannst überall weiterspielen.', 'ds'));
      const row = mk('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px';
      const bt = (t, cls, fn) => { const x = mk('button', t, 'buy' + (cls ? ' ' + cls : '')); x.style.flex = '1 1 120px'; x.addEventListener('click', fn); row.appendChild(x); return x; };
      if (accOn()) {
        const st = mk('div', '', 'ds'); st.style.marginTop = '6px';
        bt('Jetzt sichern', '', () => { save(); st.textContent = 'Sichere …'; cloudPut(false).then(ok => { st.textContent = ok ? 'Online gesichert.' : 'Gerade nicht erreichbar, es wird später nochmal versucht.'; }); });
        let sure = ''; const ask = (k, t, fn) => () => { if (sure !== k) { sure = k; st.innerHTML = '<b style="color:var(--amber)">' + t + '</b>'; return; } st.textContent = 'Einen Moment …'; fn(); };
        bt('Konto wechseln', 'alt', ask('sw', 'Nochmal tippen: Dein Spielstand wird gesichert, dann kannst du dich mit einem anderen Namen anmelden.', () => accLogout(true)));
        bt('Abmelden', 'alt', ask('out', 'Nochmal tippen zum Abmelden. Dein Spielstand wird vorher online gesichert.', () => accLogout(false)));
        ac.appendChild(row); ac.appendChild(st);
        b.appendChild(ac); renderPwCard(b, mk); return renderProfileRest(b, mk);
      } else { bt('Anmelden oder Konto anlegen', '', () => { try { save(); sessionStorage.removeItem('kellergruen.guest'); } catch (e) {} try { location.reload(); } catch (e) {} }); ac.appendChild(row); }
      b.appendChild(ac);
    }
    renderProfileRest(b, mk);
  }
  // v121: Passwort aendern und Wiederherstellungs-Code
  let pwMode = '', pwCode = '', pwMsg = '';
  function renderPwCard(b, mk) {
    if (recKnown === null && !renderPwCard.busy) { renderPwCard.busy = 1; recHas().then(() => { renderPwCard.busy = 0; if (phoneOpen && tab === 'profil') renderPhone(); }); }
    const c = mk('div', '', 'card'); c.style.gridTemplateColumns = '1fr';
    c.appendChild(mk('div', '🔑 Passwort & Wiederherstellung', 'nm'));
    c.appendChild(mk('div', recKnown === false ? '⚠️ Du hast noch keinen Wiederherstellungs-Code. Ohne Code kommst du nicht mehr an dein Konto, wenn du dein Passwort vergisst. Erstell dir jetzt einen.' : recKnown ? 'Du hast einen Wiederherstellungs-Code. Damit kannst du beim Anmelden unter „Passwort vergessen?“ ein neues Passwort festlegen. Verloren? Erstell einen neuen, der alte wird dann ungültig.' : 'Prüfe, ob du einen Wiederherstellungs-Code hast …', 'ds' + (recKnown === false ? ' adm-f' : '')));
    if (pwCode) {
      const box = mk('div', pwCode, 'lg-codebox'); box.style.margin = '10px 0 4px'; c.appendChild(box);
      c.appendChild(mk('div', 'Schreib dir den Code auf oder mach ein Bildschirmfoto. Er wird dir nur jetzt angezeigt.', 'ds'));
      const r = mk('div'); r.style.cssText = 'display:flex;gap:6px;margin-top:8px';
      const cp = mk('button', 'Kopieren', 'buy alt'); cp.style.flex = '1'; cp.addEventListener('click', () => { try { navigator.clipboard.writeText(pwCode).then(() => { cp.textContent = 'Kopiert ✓'; }, () => {}); } catch (e) {} });
      const ok = mk('button', 'Notiert', 'buy'); ok.style.flex = '1'; ok.addEventListener('click', () => { pwCode = ''; pwMsg = ''; renderPhone(); });
      r.appendChild(cp); r.appendChild(ok); c.appendChild(r); b.appendChild(c); return;
    }
    const inp = (ph, id) => { const i = mk('input', '', 'lg-in'); i.type = 'password'; i.placeholder = ph; i.id = id; i.autocomplete = id === 'pwOld' ? 'current-password' : 'new-password'; i.style.marginTop = '6px'; i.addEventListener('keydown', e => e.stopPropagation()); i.addEventListener('keyup', e => e.stopPropagation()); c.appendChild(i); return i; };
    const st = mk('div', pwMsg, 'ds'); st.style.marginTop = '6px';
    if (pwMode) {
      const o = inp('Aktuelles Passwort', 'pwOld'), n1 = pwMode === 'chg' ? inp('Neues Passwort (mind. 6 Zeichen)', 'pwNew') : null, n2 = pwMode === 'chg' ? inp('Neues Passwort wiederholen', 'pwNew2') : null;
      const r = mk('div'); r.style.cssText = 'display:flex;gap:6px;margin-top:8px';
      const go = mk('button', pwMode === 'chg' ? 'Passwort ändern' : 'Code erstellen', 'buy'); go.style.flex = '1';
      const no = mk('button', 'Abbrechen', 'buy alt'); no.style.flex = '1'; no.addEventListener('click', () => { pwMode = ''; pwMsg = ''; renderPhone(); });
      go.addEventListener('click', async () => {
        if (o.value.length < 6) { st.textContent = 'Bitte dein aktuelles Passwort eingeben.'; return; }
        if (n1 && n1.value.length < 6) { st.textContent = 'Das neue Passwort braucht mindestens 6 Zeichen.'; return; }
        if (n1 && n1.value !== n2.value) { st.textContent = 'Die beiden neuen Passwörter sind nicht gleich.'; return; }
        go.disabled = true; st.textContent = 'Einen Moment …';
        try { pwCode = n1 ? await accNewPw(o.value, n1.value) : (await accVerify(o.value), await recStore(o.value)); pwMode = ''; pwMsg = n1 ? 'Passwort geändert. Auf anderen Geräten musst du dich neu anmelden.' : ''; sfx.buy(); renderPhone(); }
        catch (e) { go.disabled = false; st.textContent = /stimmt nicht/.test(e.message) ? 'Das aktuelle Passwort stimmt nicht.' : e.message; }
      });
      r.appendChild(go); r.appendChild(no); c.appendChild(r);
    } else {
      const r = mk('div'); r.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px';
      const a1 = mk('button', recKnown ? 'Neuen Code erstellen' : 'Code erstellen', 'buy' + (recKnown ? ' alt' : '')); a1.style.flex = '1 1 120px'; a1.addEventListener('click', () => { pwMode = 'code'; pwMsg = ''; renderPhone(); });
      const a2 = mk('button', 'Passwort ändern', 'buy alt'); a2.style.flex = '1 1 120px'; a2.addEventListener('click', () => { pwMode = 'chg'; pwMsg = ''; renderPhone(); });
      r.appendChild(a1); r.appendChild(a2); c.appendChild(r);
    }
    c.appendChild(st); b.appendChild(c);
  }
  let bkSure = '';
  function renderBackups(b, mk) { // v122: Sicherungen anzeigen und zurueckholen
    const L = [['.auto', 'Automatische Sicherung (alle 5 Minuten)'], ['.vorRazzia', 'Vor der letzten Razzia'], ['.prest', 'Vor dem letzten Prestige'], ['.vorReset', 'Vor einer Admin-Änderung'], ['.vorWiederherstellen', 'Vor dem letzten Zurückholen'], ['.bak', 'Ältere Sicherung']].map(([k, n]) => { let o = null; try { o = JSON.parse(store.get(SAVE_KEY + k, 'null')); } catch (e) {} return o && Number.isFinite(+o.money) ? { k, n, o } : null; }).filter(Boolean);
    if (!L.length) return;
    const c = mk('div', '', 'card'); c.style.gridTemplateColumns = '1fr'; c.appendChild(mk('div', '🛟 Sicherungen', 'nm'));
    c.appendChild(mk('div', 'Falls etwas schiefgeht, kannst du hier einen früheren Stand zurückholen. Dein jetziger Stand wird vorher selbst gesichert.', 'ds'));
    const st = mk('div', '', 'ds');
    for (const x of L) { const o = x.o, r = mk('div'); r.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:8px';
      const t = mk('div', '', 'ds'); t.style.flex = '1'; t.innerHTML = '<b>' + x.n + '</b><br>Tag ' + (o.day || 1) + ' · Ruf ' + Math.floor(+o.rep || 0) + ' · ' + fmt(Math.round(+o.money || 0)) + (o.sts ? ' · ' + new Date(+o.sts).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''); r.appendChild(t);
      const bt = mk('button', 'Laden', 'buy alt'); bt.addEventListener('click', () => { if (bkSure !== x.k) { bkSure = x.k; st.innerHTML = '<b style="color:var(--amber)">Nochmal auf „Laden“ tippen: ' + x.n + ' zurückholen.</b>'; return; } bkSure = ''; save(); const cur = store.get(SAVE_KEY, null); const raw = store.get(SAVE_KEY + x.k, null); if (cur) store.set(SAVE_KEY + '.vorWiederherstellen', cur); store.set(SAVE_KEY, raw); if (load()) { closePhone(); begin(false); msg('Sicherung geladen: ' + x.n); save(); } else { if (cur) store.set(SAVE_KEY, cur); load(); st.textContent = 'Diese Sicherung ist nicht lesbar.'; } }); r.appendChild(bt); c.appendChild(r); }
    c.appendChild(st); b.appendChild(c);
  }
  function renderProfileRest(b, mk) {
    const card = mk('div', '', 'card'); card.style.gridTemplateColumns = '1fr';
    if (fbOk() && accOn()) card.style.display = 'none'; // mit Konto ist der Name fest
    card.appendChild(mk('div', 'Dein Name', 'nm')); card.appendChild(mk('div', 'So sehen dich alle anderen Spieler, über deiner Figur und in der Spielerliste. 2 bis 12 Zeichen.', 'ds'));
    const nm = mk('input'); nm.type = 'text'; nm.maxLength = 12; nm.value = mp.name || mpLoadCfg().name; nm.id = 'pfName'; nm.autocomplete = 'off'; nm.spellcheck = false;
    nm.style.cssText = 'font:inherit;font-size:15px;padding:9px 12px;border-radius:10px;border:0;background:rgba(255,255,255,.08);color:inherit;margin-top:6px;width:100%;box-sizing:border-box';
    const go = mk('button', 'Name speichern', 'buy'), st = mk('div', '', 'ds'); st.id = 'pfStatus'; st.style.marginTop = '6px';
    go.addEventListener('click', () => { if (setPlayerName(nm.value)) { st.textContent = 'Gespeichert. Du heißt jetzt ' + mp.name + '.'; sfx.buy(); } else { st.textContent = 'Bitte mindestens 2 Zeichen.'; sfx.bad(); } });
    nm.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); go.click(); } e.stopPropagation(); }); nm.addEventListener('keyup', e => e.stopPropagation());
    card.appendChild(nm); card.appendChild(go); card.appendChild(st); b.appendChild(card);
    renderBackups(b, mk); // v122
    { const tc = mk('div', '', 'card'); tc.appendChild(mk('div', 'Einführung', 'nm')); tc.appendChild(mk('div', G.tut === 'skip' ? 'Übersprungen. Du kannst sie jederzeit ansehen.' : G.tut === 'done' ? 'Abgeschlossen. Du kannst sie jederzeit noch einmal ansehen.' : 'Noch nicht gesehen.', 'ds')); const tb = mk('button', 'Ansehen', 'buy'); tb.addEventListener('click', () => { closePhone(); tutStart(0); }); tc.appendChild(tb); b.appendChild(tc); } // v84
    const c = mpLoadCfg(), g2 = mk('div', '', 'card'); g2.style.gridTemplateColumns = '1fr auto';
    const t = mk('div', mp.on ? '🟢 Online · ' + Object.keys(mp.friends).length + ' andere Spieler' : c.auto ? 'Verbindet …' : '⚪ Offline', 'ds');
    const gb = mk('button', 'Online', 'buy alt'); gb.addEventListener('click', () => { tab = 'group'; renderPhone(); });
    g2.appendChild(t); g2.appendChild(gb); b.appendChild(g2);
  }

  function frame(ts) { // v123: ein Fehler in einem Bild haelt das Spiel nicht mehr an
    try { frameBody(ts); } catch (e) { if (typeof window.__kgErr !== 'function') throw e; try { window.__kgErr(e && e.message, 'frame', e && e.stack); } catch (x) {} }
    requestAnimationFrame(frame);
  }
  function frameBody(ts) {
    const int = (ts - (last || ts)) / 1000, dt = Math.min(0.05, int); last = ts; gt += dt; fdt = dt || 1 / 60; perfTick(int); fpsTick(ts); bcTick(int); // v129, v134, v135
    mpTick(dt); musicTick(); if (state === 'play') { try { pgTick(dt); } catch (e) {} } // v121
    if (window.__kgErrNew) { try { errUpload(); } catch (e) {} } // v123
    if (G && (W >= H || portOk) && state === 'play' && !phoneOpen && !chatOpen && !nameGateOpen && !tutOpen && !G.tut && !tierShow && !window.__KG_NOTUT) tutStart(0); // v84: Einführung einmal je Spielstand
    if (G && (W >= H || portOk) && state === 'play' && !phoneOpen && !chatOpen && !nameGateOpen && !tutOpen && !qtyOpen && !casKind) { if (sleepS) sleepTick(); else if (busRide) busTick(dt); else update(dt); saveT += dt; if (saveT > 5) { saveT = 0; save(); } }
    render();
  }

