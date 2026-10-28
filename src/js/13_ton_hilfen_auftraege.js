  // ---------- Ton ----------
  // Lautstärken: Gesamt, Effekte, Musik (0..1) + Vibration; alles in kellergruen.audio gespeichert. 'muted' schaltet alles stumm.
  const AUD_KEY = 'kellergruen.audio';
  const aud = { m: 0.5, s: 1, u: 0.6, v: true };
  (function () { try { const o = JSON.parse(store.get(AUD_KEY, 'null')); if (o && typeof o === 'object') { for (const k of ['m', 's', 'u']) if (Number.isFinite(+o[k])) aud[k] = Math.min(1, Math.max(0, +o[k])); aud.v = o.v !== false; } } catch (e) {} })();
  const audSave = () => { try { store.set(AUD_KEY, JSON.stringify(aud)); } catch (e) {} };
  let ac = null, master = null, sfxBus = null, musBus = null, musIn = null;
  function audApply() {
    if (!ac || !master) return;
    const t = ac.currentTime;
    master.gain.setTargetAtTime(muted ? 0 : aud.m, t, .03); sfxBus.gain.setTargetAtTime(aud.s, t, .03); musBus.gain.setTargetAtTime(aud.u * 0.55, t, .05);
  }
  function unlock() {
    if (!ac) {
      try {
        ac = new (window.AudioContext || window.webkitAudioContext)();
        master = ac.createGain(); master.gain.value = muted ? 0 : aud.m; master.connect(ac.destination);
        sfxBus = ac.createGain(); sfxBus.gain.value = aud.s; sfxBus.connect(master);
        musBus = ac.createGain(); musBus.gain.value = aud.u * 0.55; musBus.connect(master);
        musIn = ac.createGain(); musIn.connect(musBus);
        const dl = ac.createDelay(1.5), fb = ac.createGain(), lp = ac.createBiquadFilter(); dl.delayTime.value = 0.42; fb.gain.value = 0.38; lp.type = 'lowpass'; lp.frequency.value = 1800;
        musIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(musBus);
      } catch (e) { ac = null; }
    }
    if (ac && ac.state === 'suspended') ac.resume();
  }
  function tone(f, d, type, v, slide, delay) {
    if (muted || !ac || aud.s <= 0) return;
    const t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, f + slide), t + d);
    g.gain.setValueAtTime(v || .1, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(sfxBus); o.start(t); o.stop(t + d + .02);
  }
  // Entspannte Hintergrundmusik: weiche Akkorde (C - Am - F - G) mit sanften Pentatonik-Tönen, wird fortlaufend ein paar Sekunden vorausgeplant
  const MUS_CH = [[48, 52, 55], [45, 48, 52], [41, 45, 48], [43, 47, 50]], MUS_SC = [0, 2, 4, 7, 9];
  let musT = 0, musI = 0, musOn = false;
  const mtof = n => 440 * Math.pow(2, (n - 69) / 12);
  function musVoice(t, f, dur, type, v, att) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(musIn); o.start(t); o.stop(t + dur + 0.05);
  }
  function musBar(t, i) {
    const ch = MUS_CH[i % 4];
    for (const n of ch) { musVoice(t, mtof(n + 12), 9, 'sine', 0.05, 2.5); musVoice(t, mtof(n + 12) * 1.003, 9, 'triangle', 0.018, 3); }
    musVoice(t, mtof(ch[0] - 12), 8.5, 'sine', 0.07, 1.2);
    for (let k = 0; k < 8; k++) {
      if (Math.random() < 0.5) continue;
      const n = ch[0] + 24 + MUS_SC[Math.floor(Math.random() * MUS_SC.length)] + (Math.random() < 0.3 ? 12 : 0), tt = t + k * 1.0 + (Math.random() < 0.3 ? 0.5 : 0);
      musVoice(tt, mtof(n), 2.6, 'sine', 0.045, 0.03); musVoice(tt, mtof(n) * 2, 1.4, 'sine', 0.01, 0.03);
    }
  }
  function musicTick() {
    const want = !!ac && !muted && aud.u > 0 && state === 'play';
    if (!want) { musOn = false; return; }
    const now = ac.currentTime;
    if (!musOn || musT < now) { musT = now + 0.3; musOn = true; }
    let guard = 0; while (musT < now + 3 && guard++ < 4) { musBar(musT, musI++); musT += 8; }
  }
  function vibrate(p) { try { if (aud.v && typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  const sfx = {
    plant() { tone(300, .1, 'triangle', .12); tone(420, .12, 'triangle', .1, 0, .08); },
    water() { tone(700 + Math.random() * 120, .05, 'sine', .035); },
    harvest() { tone(520, .1, 'triangle', .13); tone(780, .16, 'triangle', .12, 0, .08); },
    put() { tone(380, .08, 'square', .06); },
    pack() { tone(900, .06, 'square', .05); },
    cash() { tone(880, .1, 'triangle', .14); tone(1320, .2, 'triangle', .12, 0, .09); },
    buy() { tone(600, .1, 'triangle', .12); tone(900, .14, 'triangle', .12, 0, .09); },
    bad() { tone(200, .3, 'sawtooth', .12, -90); },
    ping() { tone(1000, .08, 'sine', .08); tone(1500, .12, 'sine', .08, 0, .1); },
    siren() { tone(700, .18, 'square', .08); tone(520, .18, 'square', .08, 0, .18); }
  };
  function setMuted(m) {
    muted = m; store.set('kellergruen.muted', m ? '1' : '0'); audApply();
    $('mute').innerHTML = m ? '<i>🔇</i><span>Ton aus</span>' : '<i>🔊</i><span>Ton an</span>';
    if (phoneOpen && tab === 'sound') renderPhone();
  }

  // ---------- Hilfen ----------
  let lastMsg = '';
  // v111: Meldungen links als kleiner Stapel (hoechstens 2), jede verschwindet fuer sich. Gleiche Meldung wird nicht doppelt gezeigt.
  function msg(t, bad, kind) {
    lastMsg = t; const box = $('msg'); if (!box) return;
    const ty = bad ? 'bad' : kind || (/^(Neuer Auftrag|Neuer Kunde)/.test(t) ? 'ord' : /(geliefert|bezahlt|\+ ?€|€ ?[0-9.]+ (Trinkgeld|bekommen))/.test(t) ? 'ok' : '');
    for (const c of Array.from(box.children)) if (c._t === t && !c.classList.contains('out')) { clearTimeout(c._h); c._h = setTimeout(() => msgOut(c), 2600); return; }
    if (box.children.length >= 2) { if (!msgQ.some(q => q[0] === t)) msgQ.push([t, bad, kind]); if (msgQ.length > 6) msgQ.shift(); const f = box.firstChild; if (!f.classList.contains('out')) { clearTimeout(f._h); f._h = setTimeout(() => msgOut(f), 700); } return; }
    const e = document.createElement('div'); e.className = 'mi' + (ty ? ' ' + ty : ''); e._t = t; e.textContent = t; box.appendChild(e); box.classList.add('on');
    e._h = setTimeout(() => msgOut(e), bad ? 3200 : 2600);
  }
  const msgQ = [];
  function msgOut(e) { if (!e.parentNode) return; e.classList.add('out'); setTimeout(() => { const box = e.parentNode; e.remove(); if (box && !box.children.length && !msgQ.length) box.classList.remove('on'); if (msgQ.length) { const [t, b, k] = msgQ.shift(); msg(t, b, k); } }, 260); }
  function floater(x, y, text, color) { floaters.push({ x, y, text, color: color || '#EEF2F7', t: 0 }); }
  function inBuilding(x, y) { return AREA_KEYS.some(k => { const I = AREAS[k].IN; return x > I.x0 && x < I.x1 && y > I.y0 && y < I.y1; }); }
  function areaAt(x, y) { return AREA_KEYS.find(k => { const I = AREAS[k].IN; return isOpen(AREAS[k]) && x > I.x0 && x < I.x1 && y > I.y0 && y < I.y1; }); }
  // ---------- v86: Karte waechst mit dem Ruf ----------
  // Am Anfang ist nur das Viertel um den Keller offen. Weitere Stadtteile oeffnen sich mit dem Ruf (rep = noetiger Ruf, hier anpassbar).
  // v97: neue Stadtteile mit Thema. Jeder Stadtteil kann aus mehreren Rechtecken bestehen, sortiert nach Ruf.
  const ZONE_DEF = [
    { rep: 0, name: 'Startviertel', r: [[0, 0, 1740, 1390]] }, // v115: Grenze zum Uferpark in der Mitte der Parkstrasse
    { rep: 10, name: 'Uferpark und Südufer', r: [[0, 1390, 1740, WH]] },
    { rep: 20, name: 'Marktviertel', r: [[1740, 0, 3450, 1310], [3450, 700, 4440, 1310], [1740, -160, 3450, 0]] },
    { rep: 20, name: 'Südost', r: [[1740, 1310, WW, 2240], [1740, 2240, 3540, WH], [3540, 2240, 4440, 2420]] },
    { rep: 25, name: 'Gewerbegebiet', r: [[3450, 0, WW, 700], [3450, -160, WW, 0]] },
    { rep: 30, name: 'Vergnügungsmeile', r: [[4440, 700, WW, 1310]] },
    { rep: 35, name: 'Gangviertel', r: [[4440, 2240, WW, WH], [3540, 2420, 4440, WH]] }, // v109: plus Westhof
    { rep: 40, name: 'Nordviertel', r: [[0, YMIN, WW, -160]] }
  ];
  const ZONES = ZONE_DEF.flatMap(z => z.r.map(([x0, y0, x1, y1]) => ({ rep: z.rep, name: z.name, x0, y0, x1, y1 })));
  const zoneRepAt = (x, y) => { for (const z of ZONES) if (x >= z.x0 && x < z.x1 && y >= z.y0 && y < z.y1) return z.rep; return 0; };
  const zoneOpenAt = (x, y) => !G || x < 0 || G.rep >= zoneRepAt(x, y);
  const zoneLocked = (x, y) => !!G && !GH_ON && x >= 0 && !inBuilding(x, y) && G.rep < zoneRepAt(x, y);
  let zoneMsgT = -99;
  function zoneBump(need) { if (typeof gt === 'number' && gt - zoneMsgT < 3) return; zoneMsgT = typeof gt === 'number' ? gt : 0; msg('Dieser Stadtteil ist noch gesperrt · ab Ruf ' + need, true); }
  function zoneTick() {
    if (!G) return;
    const lv = ZONE_DEF.filter(z => G.rep >= z.rep).length;
    if (G.zt === undefined) G.zt = lv;
    else if (lv > G.zt) { const nm = ZONE_DEF.slice(G.zt, lv).map(z => z.name).join(' und '); G.zt = lv; msg('Neuer Stadtteil freigeschaltet: ' + nm + '!'); sfx.ping(); }
  }
  // v104: Gebietsgrenzen neu: dunkler Schleier mit Schraffur, an der Grenze ein Bauzaun mit rot-weissen Baken und Warnleuchten, dazu ein Schild mit Name und Ruf
  let zoneHatch = null;
  function zonePat() {
    if (zoneHatch !== null) return zoneHatch;
    try { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.strokeStyle = 'rgba(255,190,90,.06)'; x.lineWidth = 12; x.beginPath(); for (let k = -64; k <= 128; k += 32) { x.moveTo(k, 64); x.lineTo(k + 64, 0); } x.stroke(); zoneHatch = ctx.createPattern(c, 'repeat') || false; } catch (e) { zoneHatch = false; }
    return zoneHatch;
  }
  const zoneOut = (x, y) => x >= 0 && x <= WW && y >= YMIN && y <= WH && G.rep >= zoneRepAt(x, y);
  function zoneFence(z, side) { // side: 0 oben, 1 rechts, 2 unten, 3 links
    const hz = side === 0 || side === 2, a0 = hz ? Math.max(z.x0, viewX0 - 40) : Math.max(z.y0, viewY0 - 40), a1 = hz ? Math.min(z.x1, viewX1 + 40) : Math.min(z.y1, viewY1 + 40); if (a1 <= a0) return;
    const e = side === 0 ? z.y0 : side === 1 ? z.x1 : side === 2 ? z.y1 : z.x0, out = side === 0 || side === 3 ? -1 : 1, inn = e - out * 9; // Zaun liegt 9 px im gesperrten Gebiet
    if (hz ? (inn < viewY0 - 40 || inn > viewY1 + 40) : (inn < viewX0 - 40 || inn > viewX1 + 40)) return;
    const S = 40, t0 = Math.floor(a0 / S) * S, nt = lightK();
    for (let t = t0; t < a1; t += S) {
      const tm = t + S / 2, ox = hz ? tm : e + out * 24, oy = hz ? e + out * 24 : tm; if (tm < (hz ? z.x0 : z.y0) || tm > (hz ? z.x1 : z.y1) || !zoneOut(ox, oy)) continue;
      const len = S - 6, bx = hz ? t + 3 : inn - 3, by = hz ? inn - 3 : t + 3, bw = hz ? len : 6, bh = hz ? 6 : len;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(bx + 2, by + 3, bw, bh);
      ctx.fillStyle = '#F4F4F2'; ctx.fillRect(bx, by, bw, bh);
      ctx.fillStyle = '#E0393E'; for (let k = 0; k < len; k += 10) { if (hz) ctx.fillRect(bx + k, by, 5, bh); else ctx.fillRect(bx, by + k, bw, 5); }
      ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
      for (const q of [t + 1, t + S - 1]) { const px = hz ? q : inn, py = hz ? inn : q; ctx.fillStyle = '#2A2F37'; ctx.fillRect(px - 3, py - 3, 6, 6); ctx.fillStyle = '#F2C14E'; ctx.fillRect(px - 2, py - 2, 4, 1.5); } // Fuesse
      if (Math.round(t / S) % 4 === 0) { const px = hz ? tm : inn, py = hz ? inn : tm, bl = Math.sin(gt * 5 + t * 0.05) > 0.2;
        ctx.fillStyle = bl ? '#FFB547' : '#7A5520'; ctx.beginPath(); ctx.arc(px, py, 3.4, 0, TAU); ctx.fill();
        if (bl) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(px, py, 1, px, py, 18 + 16 * nt); g.addColorStop(0, 'rgba(255,181,71,' + (0.35 + 0.35 * nt).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,181,71,0)'); ctx.fillStyle = g; ctx.fillRect(px - 36, py - 36, 72, 72); ctx.restore(); } }
    }
  }
  function zoneSign(x, y, z) { // Schild auf zwei Beinen
    const t1 = z.name, t2 = 'ab Ruf ' + z.rep; ctx.font = '800 12px sans-serif'; const w = Math.max(ctx.measureText(t1).width, 70) + 34, hh = 38, bx = x - w / 2, by = y - hh - 12;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(bx + 4, by + 5, w, hh); ctx.fillStyle = '#4A5260'; ctx.fillRect(x - w / 2 + 10, by + hh, 3, 14); ctx.fillRect(x + w / 2 - 13, by + hh, 3, 14);
    ctx.fillStyle = '#F2C14E'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, w, hh, 6); else ctx.rect(bx, by, w, hh); ctx.fill();
    ctx.fillStyle = '#1A2029'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx + 3, by + 3, w - 6, hh - 6, 4); else ctx.rect(bx + 3, by + 3, w - 6, hh - 6); ctx.fill();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#EEF2F7'; ctx.fillText(t1, x + 8, by + 13); ctx.font = '800 10px sans-serif'; ctx.fillStyle = '#FFB547'; ctx.fillText(t2, x + 8, by + 27);
    ctx.font = '13px sans-serif'; ctx.fillText('🔒', bx + 15, by + hh / 2 + 1); ctx.textBaseline = 'alphabetic';
  }
  function drawZoneLocks() {
    if (!G || state !== 'play' || GH_ON || player.x < 0 || inBuilding(player.x, player.y)) return;
    const pat = zonePat(), lock = ZONES.filter(z => G.rep < z.rep);
    for (const z of lock) {
      const x0 = Math.max(z.x0, viewX0), x1 = Math.min(z.x1, viewX1), y0 = Math.max(z.y0, viewY0), y1 = Math.min(z.y1, viewY1);
      if (x1 <= x0 || y1 <= y0) continue;
      ctx.fillStyle = 'rgba(9,13,20,.6)'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); if (pat) { ctx.fillStyle = pat; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); }
      const F = 110; // Nebelkante: zur Grenze hin heller
      for (const [sd, ex, ey, dx, dy] of [[0, 0, z.y0, 0, 1], [2, 0, z.y1, 0, -1], [3, z.x0, 0, 1, 0], [1, z.x1, 0, -1, 0]]) {
        const hz = dy !== 0, mx = hz ? (x0 + x1) / 2 : ex + dx * 20, my = hz ? ey + dy * -20 : (y0 + y1) / 2; if (!zoneOut(hz ? mx : ex - dx * 20, hz ? ey - dy * 20 : my)) continue;
        const g = hz ? ctx.createLinearGradient(0, ey, 0, ey + dy * F) : ctx.createLinearGradient(ex, 0, ex + dx * F, 0); g.addColorStop(0, 'rgba(150,165,190,.16)'); g.addColorStop(1, 'rgba(150,165,190,0)'); ctx.fillStyle = g;
        if (hz) ctx.fillRect(x0, Math.min(ey, ey + dy * F), x1 - x0, F); else ctx.fillRect(Math.min(ex, ex + dx * F), y0, F, y1 - y0);
      }
    }
    for (const z of lock) for (let sd = 0; sd < 4; sd++) zoneFence(z, sd);
    let shown = 0;
    for (const z of lock) {
      const px = clamp(player.x, z.x0, z.x1), py = clamp(player.y, z.y0, z.y1);
      if (shown >= 2 || Math.hypot(player.x - px, player.y - py) > 520) continue;
      let lx = px, ly = py; if (Math.abs(px - z.x0) < 1) lx += 80; if (Math.abs(px - z.x1) < 1) lx -= 80; if (Math.abs(py - z.y0) < 1) ly += 70; if (Math.abs(py - z.y1) < 1) ly -= 30;
      const zd = ZONE_DEF.find(d => d.name === z.name) || z; zoneSign(lx, ly, { name: zd.name, rep: z.rep }); shown++;
    }
  }
  const LEFT_GAP = [524, 724]; // Hauptstrasse an der linken Kante
  function move(e, dx, dy, r) {
    const px = e.x, py = e.y;
    e.x += dx; e.y += dy; const ef = e.fl || 0;
    for (const c of colliders) {
      if (c.fl !== undefined && c.fl !== ef) continue;
      if ((c.river || c.water) && onBridge(e.x, e.y)) continue; // v59: Bruecken
      const nx = clamp(e.x, c.x, c.x + c.w), ny = clamp(e.y, c.y, c.y + c.h);
      const ddx = e.x - nx, ddy = e.y - ny, d2 = ddx * ddx + ddy * ddy;
      if (d2 < r * r) {
        if (d2 > 1e-6) { const d = Math.sqrt(d2), k = (r - d) / d; e.x += ddx * k; e.y += ddy * k; }
        else {
          const l = e.x - c.x, rr = c.x + c.w - e.x, t = e.y - c.y, b = c.y + c.h - e.y, m = Math.min(l, rr, t, b);
          if (m === l) e.x = c.x - r; else if (m === rr) e.x = c.x + c.w + r; else if (m === t) e.y = c.y - r; else e.y = c.y + c.h + r;
        }
      }
    }
    if (e === player && EVC.length && !ef) evPush(e, r); // v166: Absperrungen
    if (e.x < 0 && e === player) ghostWalls(e, r); // v86: Freundes-Gebaeude links neben dem Keller, zu Fuss erreichbar
    e.x = clamp(e.x, (e === player ? XMIN : 0) + r, WW - r);
    e.y = clamp(e.y, YMIN + r, WH - r);
    if (e === player && XMIN < 0 && !ef && !GH_ON) { // v122: linke Kartengrenze, nur ueber die Hauptstrasse geht es zu den Besucher-Kellern
      const road = y => y > LEFT_GAP[0] + r && y < LEFT_GAP[1] - r;
      if ((px >= 0) !== (e.x >= 0) && !road(e.y)) e.x = px >= 0 ? Math.max(0, px) : Math.min(-0.5, px);
      if (e.x < 0) e.y = clamp(e.y, 4 + r, LEFT_GAP[1] - r);
    }
    if (e === player && zoneLocked(e.x, e.y)) { // v86: gesperrte Stadtteile
      const need = zoneRepAt(e.x, e.y);
      if (!zoneLocked(e.x, py)) e.y = py; else if (!zoneLocked(px, e.y)) e.x = px; else { e.x = px; e.y = py; }
      zoneBump(need);
    }
  }

  // ---------- Aufträge ----------
  const orderPos = o => (o.mob ? { x: o.x, y: o.y } : { x: HOUSES[o.house].dx, y: HOUSES[o.house].dy });
  // Ruf waechst in Bruchteilen: pünktlich (innerhalb der ersten 40 % der Zeit) mehr als spät
  const REP_FAST = 0.33, REP_SLOW = 0.13;
  function addRep(x) { x = krRepCap(x); const cur = Math.max(G.repP || 0, G.rep); x *= 40 / (40 + cur * 1.3); if (x > 0) x *= presRep() * projRep(); if (x > 0 && cur + x > REP_MAX) mstAdd(cur + x - REP_MAX); G.repP = Math.min(REP_MAX, cur + x); G.rep = Math.floor(G.repP + 1e-9); }
  function houseCount() { return Math.min(HOUSE_N0, 4 + Math.floor(G.rep / 2.5)); }
  const houseRep = i => i < HOUSE_N0 ? Math.max(0, Math.ceil(2.5 * (i - 3))) : HOUSES[i] && HOUSES[i].ext ? 22 + 3 * (i - HOUSE_N1) : 40 + 2 * Math.max(0, i - HOUSE_N0 - 5); // v95: Nordviertel ab Ruf 40, dann je 2 Ruf ein Haus mehr
  const houseOpen = i => !!G && (i < HOUSE_N0 ? i < houseCount() : G.rep >= houseRep(i)); // v60: mehr Haeuser, schnellere Freischaltung
  const VIP_REP = 25;
  function addPrOrder(house) { // v103: nur wenn der Premium-Anbau eingerichtet ist
    const ar = AREAS.pr, qty = 2 + Math.floor(Math.random() * 3), per = apoUnit() * (1.3 + Math.random() * 0.3) * krPrice('pr', true);
    const hs = HOUSES[house], o = { id: G.oid++, house, prod: 'pr', qty, price: Math.round(per * qty), mob: false, vip: true, t: 260, tmax: 260, x: hs.dx, y: hs.face === 1 ? hs.dy + 16 : hs.dy - 16, pause: 0, ang: 0 };
    G.orders.push(o); sfx.ping(); msg('★ Spezialkunde! ' + hs.name + ' will ' + qty + ' ' + ar.lbl.unit); return o;
  }
  function addOrder() {
    const maxOpen = Math.min(12, 3 + Math.floor(G.rep / 3.5) + (G.t.unlocked ? 1 : 0) + (G.b.unlocked ? 1 : 0)) + projOrders();
    if (G.orders.filter(o => !o.remote).length >= maxOpen) return;
    const free = []; for (let i = 0; i < HOUSES.length; i++) if (houseOpen(i) && !HOUSES[i].gang && !HOUSES[i].office && zoneOpenAt(HOUSES[i].dx, HOUSES[i].dy) && !G.orders.some(o => o.house === i)) free.push(i);
    if (!free.length) return;
    const house = free[Math.floor(Math.random() * free.length)];
    const rp = Math.random(), prod = G.t.unlocked && G.b.unlocked ? (rp < 0.6 ? 'keller' : rp < 0.82 ? 'tabak' : 'brau') : G.t.unlocked ? (rp < 0.72 ? 'keller' : 'tabak') : G.b.unlocked ? (rp < 0.72 ? 'keller' : 'brau') : 'keller', ar = AREAS[prod];
    const qty0 = 1 + Math.floor(Math.random() * Math.min(6, 1 + Math.floor(G.rep / 2.5)));
    const vip = G.rep >= VIP_REP && Math.random() < 0.14;   // Spezialkunde: ab Ruf 25, zahlt mehr, wartet kürzer
    if (vip && isOpen(AREAS.pr) && Math.random() < 0.3) return addPrOrder(house); // v103: Spezialkunde will Apotheken-Dosen
    const qty = vip ? 3 + Math.floor(Math.random() * 4) : qty0;
    const mob = house < 20 && (qty >= 5 || (G.rep >= 15 && qty >= 2 && Math.random() < 0.4)), per = (ar.price + repEff(G.rep) * 2.2) * seedMult(S(ar).up.seed) * (0.85 + Math.random() * 0.35) * (mob ? 1.1 : 1) * (vip ? 2.2 : 1) * krPrice(prod, vip);
    const hs = HOUSES[house], o = { id: G.oid++, house, prod, qty, price: Math.round(per * qty), mob, vip, t: Math.round((vip ? 220 : mob ? 300 : 260) * projWait()), tmax: Math.round((vip ? 220 : mob ? 300 : 260) * projWait()), x: hs.dx, y: hs.face === 1 ? hs.dy + 16 : hs.dy - 16, pause: 0, ang: 0 };
    if (mob) roamPick(o);
    G.orders.push(o);
    sfx.ping(); msg((vip ? '★ Spezialkunde! ' : 'Neuer Auftrag: ') + HOUSES[house].name + ' will ' + qty + ' ' + ar.lbl.unit + (mob ? ' (läuft herum)' : ''));
  }

  // ---------- Keller-Etagen (v54) ----------
  // Das Erdgeschoss hat eine Treppe nach unten (Untergeschoss) und eine nach oben (1. Etage). Beide Etagen liegen "ueber" dem
  // Kellerraum: gleiche Grundflaeche, eigener Boden mit bis zu 15 Toepfen. Wer auf einer Etage steht, hat player.fl = -1 oder 1;
  // Hindernisse mit .fl gelten nur auf ihrer Etage. Etagen-Toepfe nutzen Saatgut, Wachstum und Ertrag des Kellers.
  const FLOORS = { u: { f: -1, name: 'Untergeschoss', cost: 8000, rep: 12, col: '#24272D' }, o: { f: 1, name: '1. Etage', cost: 20000, rep: 25, col: '#3B3A42' } };
  const FL_START = 4, FL_MAX = 15;
  const flKey = f => f < 0 ? 'u' : 'o';
  const flName = f => FLOORS[flKey(f)].name;
  // Etagen-Zustand: eigene Toepfe, Gestell und Packtisch; Ware (inv) und Verbesserungen (up) sind die des Kellers
  const floorState = o => Object.defineProperties(o, { inv: { get: () => G.inv }, up: { get: () => G.up } });
  const mkFloor = () => floorState({ own: false, n: FL_START, pots: FLPOTS.map(() => ({ s: 0, p: 0, w: 1 })), rack: { wet: 0, dry: 0 }, tab: { dry: 0, bags: 0 } });
  const floorAreas = () => ['ku', 'ko'].map(k => AREAS[k]).filter(isOpen);
  const flPotCost = n => Math.round(450 * Math.pow(1.32, n - FL_START) / 10) * 10;
  const potOf = tg => S(tg.ar).pots[tg.idx];
  const potPos = tg => tg.ar.POTS[tg.idx];
  function floorObjective() {
    if (player.fl === 3 || player.fl === 4) return null;
    if (player.fl === 2) { if (prVisit || !isOpen(AREAS.pr)) return null; const r = objectiveFor(AREAS.pr); return r ? 'Mietraum: ' + r : null; }
    if (player.fl) { const ar = AREAS[player.fl < 0 ? 'ku' : 'ko'], r = objectiveFor(ar); return r ? ar.name + ': ' + r : null; }
    return null;
  }
  // v54: Ausbau gibt es nur an der Treppe (A, wenn noch nicht gebaut, sonst B)
  const STAIR_STYLES = [['Beton', '#4A4F5A', '#6B7180', '#7C8391'], ['Holz', '#5B4330', '#8A6A4A', '#A8865F'], ['Metall', '#2E333C', '#8A939F', '#B4BCC8'], ['Marmor', '#7E7B76', '#D2CEC6', '#EEEBE5']];
  function buyPotAt(ar, i) { // Topf genau an diesem Platz freischalten
    const u = UPS.find(x => x.id === 'pots' && x.area === ar.key), st = S(ar), j = potsOpen(ar); if (!u || i < j || i >= ar.POTS.length || st.up.pots >= u.max) return false;
    const c = u.cost(st.up.pots); if (G.money < c) return false;
    if (i !== j) { const a = [ar.POTS[i].x, ar.POTS[i].y], b2 = [ar.POTS[j].x, ar.POTS[j].y]; setPot(ar, j, a[0], a[1]); setPot(ar, i, b2[0], b2[1]); const t = st.pots[i]; st.pots[i] = st.pots[j]; st.pots[j] = t; commitLayout(ar); rebuildNav(ar); }
    G.money -= c; st.up.pots++; sfx.buy(); floater(ar.POTS[j].x, ar.POTS[j].y - 22, '−' + fmt(c), '#FF8FA3'); save(); return true;
  }
  function potBuyCost(tg) { if (tg.ar.key === 'pr') return prPotCost(G.pr.n); if (tg.ar.isFloor) return flPotCost(G.fl[tg.ar.fk].n); const u = UPS.find(x => x.id === 'pots' && x.area === tg.ar.key); return u ? u.cost(S(tg.ar).up.pots) : 0; }
  const CRATE_MAX = 400;
  // ---------- v89: Mengen-Regler (Entnahme an Packtisch, Gestell, Sammelkiste, Lager und Verkauf beim Hehler) ----------
  function qtyRow(max, init, onChange) { // Regler mit - und +, ruft onChange(n) bei jeder Aenderung
    const w = document.createElement('div'); w.className = 'qty'; let v = clamp(Math.round(init || max), max > 0 ? 1 : 0, Math.max(0, max));
    const mn = document.createElement('button'); mn.type = 'button'; mn.className = 'qb'; mn.textContent = '−';
    const rg = document.createElement('input'); rg.type = 'range'; rg.min = max > 0 ? 1 : 0; rg.max = Math.max(0, max); rg.step = 1; rg.value = v; rg.disabled = max <= 1;
    const pl = document.createElement('button'); pl.type = 'button'; pl.className = 'qb'; pl.textContent = '+';
    const out = document.createElement('b'); out.className = 'qv';
    const set = n => { v = clamp(Math.round(+n || 0), max > 0 ? 1 : 0, Math.max(0, max)); rg.value = v; out.textContent = v + (max > 0 ? ' / ' + max : ''); mn.disabled = v <= 1; pl.disabled = v >= max; if (onChange) onChange(v); };
    mn.addEventListener('click', e => { e.stopPropagation(); set(v - 1); }); pl.addEventListener('click', e => { e.stopPropagation(); set(v + 1); });
    rg.addEventListener('input', () => set(rg.value)); rg.addEventListener('pointerdown', e => e.stopPropagation());
    w.appendChild(mn); w.appendChild(rg); w.appendChild(pl); w.appendChild(out); set(v); w.get = () => v; return w;
  }
  let qtyOpen = false, qtyEl = null, qtyCb = null, qtyMax = 0;
  function qtyAsk(title, max, cb, unit, okTxt) { // kleines Fenster mit Regler; das Spiel steht so lange still
    if (max <= 0) return false; if (max === 1) { cb(1); return true; }
    qtyCb = cb; qtyMax = max;
    if (!qtyEl) { qtyEl = document.createElement('div'); qtyEl.className = 'qpop'; qtyEl.hidden = true; if (document.body && document.body.appendChild) document.body.appendChild(qtyEl); }
    qtyEl.innerHTML = ''; const card = document.createElement('div'); card.className = 'qcard';
    const h = document.createElement('div'); h.className = 'qt'; h.textContent = title; card.appendChild(h);
    let n = max; const lab = document.createElement('div'); lab.className = 'qs';
    const row = qtyRow(max, max, v => { n = v; lab.textContent = v + ' ' + (unit || 'Stück'); }); card.appendChild(row); card.appendChild(lab);
    const bt = document.createElement('div'); bt.className = 'qbtns';
    const all = document.createElement('button'); all.className = 'qall'; all.textContent = 'Alle'; all.addEventListener('click', () => qtyDo(max));
    const ok = document.createElement('button'); ok.className = 'qok'; ok.textContent = okTxt || 'Nehmen'; ok.addEventListener('click', () => qtyDo(n));
    const no = document.createElement('button'); no.className = 'qno'; no.textContent = 'Abbrechen'; no.addEventListener('click', () => qtyClose());
    bt.appendChild(no); bt.appendChild(all); bt.appendChild(ok); card.appendChild(bt); qtyEl.appendChild(card);
    qtyEl.addEventListener('pointerdown', e => { if (e.target === qtyEl) qtyClose(); });
    qtyEl.hidden = false; qtyOpen = true; joy.id = null; joy.dx = joy.dy = 0; aHeld = false; bHeld = false; return true;
  }
  function qtyClose() { qtyOpen = false; qtyCb = null; if (qtyEl) qtyEl.hidden = true; }
  function qtyDo(n) { const cb = qtyCb, m = qtyMax; qtyClose(); if (cb) cb(clamp(Math.round(+n || m), 1, m)); }
  // ---------- v104: Etagen (Untergeschoss, 1. Etage), Sammelkiste und Laeufer sind abgeschafft ----------
  // Alte Spielstaende: Ausbau, Toepfe und Helfer werden erstattet, Ware kommt ins Erdgeschoss, Deko zurueck ins Lager.
  const OLD_FLOOR_ROLES = { ugardener: { cost: [350, 650, 1000], kind: 'gardener' }, urack: { cost: [550, 950], kind: 'rack' }, upacker: { cost: [750, 1300], kind: 'packer' }, ogardener: { cost: [450, 800, 1250], kind: 'gardener' }, orack: { cost: [700, 1200], kind: 'rack' }, opacker: { cost: [950, 1600], kind: 'packer' }, runner: { cost: [900, 1600], kind: 'runner' } };
  let retireNote = '', retireCash = 0;
  function retireFloorStaff(s) {
    retireCash = 0; retireNote = ''; const st = s.staff && typeof s.staff === 'object' ? s.staff : {}, crew = s.kr && Array.isArray(s.kr.crew) ? s.kr.crew : [];
    let moved = 0;
    for (const r of Object.keys(OLD_FLOOR_ROLES)) {
      const d = OLD_FLOOR_ROLES[r], n = clamp(Math.floor(+st[r] || 0), 0, d.cost.length), mine = crew.filter(m => m && m.r === r).sort((a, b) => (+b.lv || 0) - (+a.lv || 0));
      for (let i = 0; i < n; i++) {
        const to = d.kind === 'runner' ? null : d.kind, m = mine[i];
        if (to && ROLES[to] && G.staff[to] < ROLES[to].max) { G.staff[to]++; moved++; if (m) m.r = to; }
        else { retireCash += d.cost[i]; if (m) m.r = '-'; }
      }
    }
    if (moved) retireNote = moved + (moved === 1 ? ' Helfer arbeitet' : ' Helfer arbeiten') + ' jetzt im Erdgeschoss';
  }
  function retireFloors(s) {
    G.fl = { u: mkFloor(), o: mkFloor() };
    const fl = s.fl && typeof s.fl === 'object' ? s.fl : {}; let bags = Math.max(0, Math.floor(+s.crate) || 0), plants = 0, any = false;
    for (const k of ['u', 'o']) {
      const q = fl[k]; if (!q || typeof q !== 'object' || q.own !== true) continue; any = true;
      retireCash += FLOORS[k].cost; const n = clamp(Math.floor(+q.n) || FL_START, FL_START, FL_MAX); for (let j = FL_START; j < n; j++) retireCash += flPotCost(j);
      if (Array.isArray(q.pots)) plants += q.pots.slice(0, n).filter(p => p && +p.s >= 1).length;
      if (q.rack && typeof q.rack === 'object') { G.rack.wet = clamp(G.rack.wet + (+q.rack.wet || 0), 0, 999); G.rack.dry = clamp(G.rack.dry + (+q.rack.dry || 0), 0, 999); }
      if (q.tab && typeof q.tab === 'object') { G.rack.dry = clamp(G.rack.dry + (+q.tab.dry || 0), 0, 999); bags += Math.max(0, Math.floor(+q.tab.bags || 0)); }
    }
    bags = Math.min(bags, 2000); const fit = Math.max(0, Math.min(bags, bagsMax() - G.tab.bags)); G.tab.bags += fit; bags -= fit;
    const bp = basePrice('keller'); retireCash += Math.round(bags * bp + plants * bp * 2);
    for (const k of ['ku', 'ko']) if (G.dec && G.dec.items && G.dec.items[k]) G.dec.items[k].length = 0; // Deko geht zurueck ins Lager
    if (retireCash > 0) { G.money += retireCash; retireNote = 'Etagen abgeschafft: ' + fmt(retireCash) + ' erstattet' + (retireNote ? ' · ' + retireNote : ''); }
    else if (retireNote) retireNote = 'Etagen abgeschafft · ' + retireNote;
    if (!any && !retireCash && !retireNote) retireNote = '';
  }
  function loadFloors(s) {
    G.fl = { u: mkFloor(), o: mkFloor() };
    if (!s || typeof s !== 'object') return;
    for (const k of ['u', 'o']) {
      const q = s[k]; if (!q || typeof q !== 'object') continue;
      G.fl[k].own = q.own === true; G.fl[k].n = clamp(Math.floor(+q.n) || FL_START, FL_START, FL_MAX);
      if (Array.isArray(q.pots)) q.pots.slice(0, FL_MAX).forEach((p, i) => { if (!p || typeof p !== 'object') return; const t = G.fl[k].pots[i]; t.s = clamp(Math.floor(+p.s) || 0, 0, 2); t.p = clamp(+p.p || 0, 0, 1); t.w = clamp(Number.isFinite(+p.w) ? +p.w : 1, 0, 1); });
      if (q.rack && typeof q.rack === 'object') { G.fl[k].rack.wet = clamp(+q.rack.wet || 0, 0, 999); G.fl[k].rack.dry = clamp(+q.rack.dry || 0, 0, 999); }
      if (q.tab && typeof q.tab === 'object') { G.fl[k].tab.dry = clamp(+q.tab.dry || 0, 0, 30); G.fl[k].tab.bags = clamp(Math.floor(+q.tab.bags || 0), 0, bagsMax()); }
    }
  }
  function drawStairs(x, y, up, lab, open, sty, ang) {
    const S2 = STAIR_STYLES[sty | 0] || STAIR_STYLES[0];
    rotBegin(x, y, ang || 0);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x - 15, y - 20, 34, 44);
    ctx.fillStyle = S2[1]; ctx.fillRect(x - 17, y - 22, 34, 44);
    for (let k = 0; k < 5; k++) { const yy = up ? y + 17 - k * 8.4 : y - 18 + k * 8.4; ctx.fillStyle = k % 2 ? S2[2] : S2[3]; ctx.fillRect(x - 15 + (up ? 0 : k * 1.2), yy - 3, 30 - (up ? 0 : k * 2.4), 6); }
    ctx.fillStyle = open ? '#FFB547' : 'rgba(255,255,255,.45)'; ctx.font = '800 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(up ? '▲' : '▼', x, y);
    rotEnd();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 7px sans-serif'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText(lab, x, y + (Math.abs(Math.sin(ang || 0)) > 0.5 ? 24 : 29)); ctx.textBaseline = 'alphabetic';
  }
  // v61: neues Trockengestell und neuer Packtisch: etwas kleiner (120 x 56 bzw. 120 x 48), mit Animation. Um die Mitte gezeichnet, die Drehung kommt von rotBegin.
  function drawRackFor(ar) {
    const R0 = ar.RACK, x = R0.x, y = R0.y, st = S(ar), cap = Math.max(1, rackCap(ar)), wet = st.rack.wet, dry = st.rack.dry;
    const hw = RACK_W / 2, hh = RACK_H / 2, brew = ar.key === 'brau', tab = ar.key === 'tabak', kel = !brew && !tab, dcol = kel ? '#8B6BC9' : ar.dry;
    rotBegin(x, y, rotAng(R0, R0.r));
    ctx.fillStyle = 'rgba(0,0,0,.3)'; rr(x - hw + 4, y - hh + 6, RACK_W, RACK_H, 6); ctx.fill();
    { const g = ctx.createLinearGradient(0, y - hh, 0, y + hh); if (brew) { g.addColorStop(0, '#34404F'); g.addColorStop(1, '#222A34'); } else if (tab) { g.addColorStop(0, '#3E3426'); g.addColorStop(1, '#2A2218'); } else { g.addColorStop(0, '#323A45'); g.addColorStop(1, '#1E242C'); } ctx.fillStyle = g; rr(x - hw, y - hh, RACK_W, RACK_H, 6); ctx.fill(); } // v147
    ctx.fillStyle = 'rgba(255,255,255,.05)'; rr(x - hw + 3, y - hh + 3, RACK_W - 6, RACK_H - 6, 4); ctx.fill(); ctx.strokeStyle = 'rgba(200,210,222,.22)'; ctx.lineWidth = 1; rr(x - hw + 0.5, y - hh + 0.5, RACK_W - 1, RACK_H - 1, 6); ctx.stroke();
    ctx.fillStyle = '#C9D2DC'; for (const [px, py] of [[-hw + 5.5, -hh + 6], [hw - 5.5, -hh + 6], [-hw + 5.5, hh - 6], [hw - 5.5, hh - 6]]) { ctx.beginPath(); ctx.arc(x + px, y + py, 1, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#8C96A3'; ctx.fillRect(x - hw + 4, y - hh + 2, 3, RACK_H - 4); ctx.fillRect(x + hw - 7, y - hh + 2, 3, RACK_H - 4);
    ctx.fillStyle = '#B5BDC7'; ctx.fillRect(x - hw + 4, y - hh + 2, 3, 2); ctx.fillRect(x + hw - 7, y - hh + 2, 3, 2);
    // drei Leinen, daran haengt die Ernte: frisch in der Blattfarbe und leicht schwingend, getrocknet in der Trockenfarbe
    const lines = [y - hh + 8, y - hh + 22, y - hh + 35], per = 8, slots = lines.length * per;
    const nAll = Math.min(slots, Math.ceil(slots * Math.min(1, (wet + dry) / cap) - 0.001)), nDry = Math.min(nAll, Math.round(slots * Math.min(1, dry / cap)));
    let idx = 0;
    for (const ly of lines) {
      if (brew) { ctx.fillStyle = 'rgba(174,184,196,.55)'; ctx.fillRect(x - hw + 7, ly + 11, RACK_W - 14, 1.4); } // v88: Ablage im Kristallisierer
      else { ctx.strokeStyle = 'rgba(220,226,235,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - hw + 7, ly); ctx.quadraticCurveTo(x, ly + 2, x + hw - 7, ly); ctx.stroke(); }
      for (let k = 0; k < per; k++, idx++) {
        if (brew) { // Glasschale: leer, mit Loesung (schimmert) oder mit Kristallen (funkeln)
          const hx = x - hw + 14 + k * ((RACK_W - 28) / (per - 1)), cy = ly + 6, isDry = idx < nDry;
          ctx.fillStyle = 'rgba(210,235,250,.18)'; ell(hx, cy, 5, 3.4); ctx.fill(); ctx.strokeStyle = 'rgba(235,245,255,.45)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.ellipse(hx, cy, 5, 3.4, 0, 0, TAU); ctx.stroke();
          if (idx >= nAll) continue;
          if (isDry) { for (let q = 0; q < 3; q++) { const qx = hx - 2.6 + q * 2.6, qy = cy + (q % 2 ? 0.6 : -0.4); ctx.fillStyle = q % 2 ? '#DDF4FF' : ar.dry; ctx.beginPath(); ctx.moveTo(qx, qy - 2.6); ctx.lineTo(qx + 1.3, qy); ctx.lineTo(qx, qy + 1.4); ctx.lineTo(qx - 1.3, qy); ctx.closePath(); ctx.fill(); } ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(gt * 4 + idx * 2.3)); ctx.fillRect(hx + 1.5, cy - 2.5, 1, 1); ctx.globalAlpha = 1; }
          else { ctx.fillStyle = ar.leaf; ell(hx, cy + 0.3, 3.8, 2.4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(hx - 2 + Math.sin(gt * 2 + idx) * 1.2, cy - 0.6, 2, 0.8); }
          continue;
        }
        if (idx >= nAll) continue;
        const hx = x - hw + 14 + k * ((RACK_W - 28) / (per - 1)), isDry = idx < nDry, sw = Math.sin(gt * (isDry ? 1.3 : 2.1) + idx * 1.7) * (isDry ? (kel ? 0.02 : 0.07) : 0.17), col = isDry ? ar.dry : ar.leaf;
        ctx.save(); ctx.translate(hx, ly + 1); ctx.rotate(sw);
        ctx.fillStyle = '#C9CED6'; ctx.fillRect(-1.2, -1.6, 2.4, 3); // Klammer
        ctx.strokeStyle = 'rgba(160,150,120,.9)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, 1); ctx.lineTo(0, 3.5); ctx.stroke();
        if (tab) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 3); ctx.quadraticCurveTo(5.2, 7, 0, isDry ? 11.5 : 13.5); ctx.quadraticCurveTo(-5.2, 7, 0, 3); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(0, isDry ? 10.5 : 12.5); ctx.stroke(); }
        else if (isDry) { // v63: getrocknet bleibt das Gras gruen (teils lila): kompakt, ohne Blaetter, mit glitzerndem Harz, haengt still
          ctx.fillStyle = '#356B35'; ell(0, 7.6, 3.3, 4.5); ctx.fill();
          ctx.fillStyle = idx % 3 === 0 ? '#7E57B0' : '#5FA255'; ell(-1.3, 6.4, 2, 2.6); ctx.fill(); ell(1.5, 8.8, 1.8, 2.3); ctx.fill();
          ctx.fillStyle = idx % 3 === 0 ? '#5FA255' : '#7E57B0'; ctx.beginPath(); ctx.arc(1.2, 5.6, 0.9, 0, TAU); ctx.fill();
          ctx.fillStyle = '#FFFFFF'; for (let q = 0; q < 3; q++) { ctx.globalAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(gt * 4 + idx * 2.3 + q * 2.1)); ctx.fillRect(-2.2 + q * 1.9, 5.2 + (q % 2) * 3.2, 1, 1); } ctx.globalAlpha = 1;
        } else { // frisch: hellgruen mit zwei Blaettern, schwingt staerker
          ctx.fillStyle = '#2F7A42'; for (const sg of [-1, 1]) { ctx.save(); ctx.translate(0, 5); ctx.rotate(sg * 0.95); ell(0, 3.4, 1.3, 4); ctx.fill(); ctx.restore(); }
          ctx.fillStyle = ar.leaf; ell(0, 7.8, 3.1, 4.8); ctx.fill(); ctx.fillStyle = '#7FD68A'; ell(-0.8, 6.6, 1.5, 2.2); ctx.fill();
          ctx.fillStyle = 'rgba(160,220,255,.7)'; ctx.fillRect(1.6, 9.5 + Math.sin(gt * 3 + idx) * 0.5, 1, 1.4); // noch feucht
        }
        ctx.restore();
      }
    }
    // kleiner Luefter oben rechts: dreht, solange noch etwas feucht ist, und blaest sichtbar ueber die Leinen
    { const fx = x + hw - 14, fy = y - hh - 1, on = wet > 0.05, a0 = on ? gt * 13 : 0.4;
      ctx.fillStyle = '#1B1F26'; ctx.beginPath(); ctx.arc(fx, fy, 6.5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#5C6672'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#AEB8C4'; for (let b = 0; b < 3; b++) { const a = a0 + b * TAU / 3; ctx.beginPath(); ctx.ellipse(fx + Math.cos(a) * 2.8, fy + Math.sin(a) * 2.8, 2.9, 1.3, a, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#5C6672'; ctx.beginPath(); ctx.arc(fx, fy, 1.3, 0, TAU); ctx.fill();
      if (on) { ctx.strokeStyle = 'rgba(200,220,255,.22)'; ctx.lineWidth = 1; for (let q = 0; q < 3; q++) { const ph = (gt * 0.7 + q / 3) % 1, lx = fx - 10 - ph * 70, yy = lines[q] + 6; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.moveTo(lx, yy); ctx.quadraticCurveTo(lx - 5, yy - 2, lx - 10, yy); ctx.stroke(); } ctx.globalAlpha = 1; } }
    // Fuellstand: getrocknet (links) und frisch (dahinter)
    { const mx = x - hw + 10, mw = RACK_W - 20, my = y + hh - 7, fd = Math.min(1, dry / cap), fw = Math.min(1 - fd, wet / cap);
      ctx.fillStyle = 'rgba(0,0,0,.4)'; rr(mx, my, mw, 4, 2); ctx.fill();
      if (fd > 0) { ctx.fillStyle = dcol; rr(mx, my, Math.max(3, mw * fd), 4, 2); ctx.fill(); }
      if (fw > 0) { ctx.fillStyle = ar.leaf; ctx.fillRect(mx + mw * fd, my, Math.max(2, mw * fw), 4); } }
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '700 9px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(ar.lbl.rack, x - hw + 2, y - hh - 4);
    rotEnd();
  }
  function drawTableFor(ar) {
    const T0 = ar.TABLE, x = T0.x, y = T0.y, st = S(ar), hw = TAB_W / 2, hh = TAB_H / 2, brew = ar.key === 'brau', tab = ar.key === 'tabak', gcol = !brew && !tab ? '#4F9A48' : ar.dry;
    const here = !GH_ON && !prOver && (ar.key === 'pr' ? player.fl === 2 : ar.isFloor ? player.fl === ar.f : !player.fl) && inField(ar.fields.table, player.x, player.y), pk = here ? packPr : 0, prm = ar.key === 'pr';
    rotBegin(x, y, rotAng(T0, T0.r));
    ctx.fillStyle = 'rgba(0,0,0,.3)'; rr(x - hw + 4, y - hh + 6, TAB_W, TAB_H, 6); ctx.fill();
    ctx.fillStyle = '#2B2F36'; for (const [lx, ly] of [[-hw + 3, -hh + 3], [hw - 9, -hh + 3], [-hw + 3, hh - 9], [hw - 9, hh - 9]]) ctx.fillRect(x + lx, y + ly, 6, 6); // Beine
    ctx.fillStyle = brew ? '#4A5562' : tab ? '#7A6448' : '#5A3E28'; rr(x - hw, y - hh, TAB_W, TAB_H, 6); ctx.fill(); // v147: im Keller eine Holz-Werkbank
    if (!brew && !tab) { const g = ctx.createLinearGradient(0, y - hh, 0, y + hh); g.addColorStop(0, '#A87A50'); g.addColorStop(1, '#8A6040'); ctx.fillStyle = g; rr(x - hw + 3, y - hh + 3, TAB_W - 6, TAB_H - 8, 4); ctx.fill(); ctx.save(); rr(x - hw + 3, y - hh + 3, TAB_W - 6, TAB_H - 8, 4); ctx.clip(); ctx.strokeStyle = 'rgba(90,56,30,.28)'; ctx.lineWidth = 0.7; for (let k = 0; k < 6; k++) { const yy = y - hh + 7 + k * ((TAB_H - 12) / 6); ctx.beginPath(); ctx.moveTo(x - hw, yy); ctx.bezierCurveTo(x - 20, yy + 1.5, x + 10, yy - 1.5, x + hw, yy + 0.5); ctx.stroke(); } ctx.fillStyle = 'rgba(60,36,20,.35)'; for (let q = 1; q < 4; q++) ctx.fillRect(x - hw + 3 + q * (TAB_W - 6) / 4, y - hh + 3, 0.8, TAB_H - 8); ctx.restore(); }
    else { ctx.fillStyle = brew ? '#AEB8C4' : '#957A55'; rr(x - hw + 3, y - hh + 3, TAB_W - 6, TAB_H - 8, 4); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x - hw + 6, y - hh + 4, TAB_W - 12, 2);
    // Waage links: der Haufen zeigt, wie viel Getrocknetes bereitliegt, die Anzeige die Menge
    const sx = x - hw + 19, sy = y - 3, f = Math.min(1, st.tab.dry / 30);
    ctx.fillStyle = '#3A3F47'; rr(sx - 13, sy - 11, 26, 24, 4); ctx.fill();
    ctx.fillStyle = '#B9C2CC'; ctx.beginPath(); ctx.arc(sx, sy - 2, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#8E98A4'; ctx.beginPath(); ctx.arc(sx, sy - 2, 7, 0, TAU); ctx.fill();
    if (st.tab.dry > 0.05) { ctx.fillStyle = gcol; ell(sx, sy - 2.5, 2.5 + 4.5 * f, 1.8 + 3.2 * f); ctx.fill(); if (gcol !== ar.dry) { ctx.fillStyle = '#7E57B0'; ctx.beginPath(); ctx.arc(sx + 1.5, sy - 3, 1 + f, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,.25)'; ell(sx - 1.5, sy - 4, 1 + f, 0.8 + f * 0.6); ctx.fill(); }
    ctx.fillStyle = '#16301F'; ctx.fillRect(sx - 8, sy + 8, 16, 4.5); ctx.fillStyle = '#7CFF9E'; ctx.font = '700 4.5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(Math.floor(st.tab.dry)) + ' g', sx, sy + 10.4);
    // Packplatz in der Mitte: Beutel (bzw. Kiste) fuellt sich beim Packen, Kruemel fliegen von der Waage hinein
    const bx = x - 6, by = y - 1, bob = pk > 0 ? Math.sin(gt * 18) * 0.7 : 0;
    if (brew) {
      ctx.fillStyle = '#E8ECF2'; rr(bx - 10, by - 8 + bob, 20, 15, 2); ctx.fill(); ctx.fillStyle = '#5BC0EB'; ctx.fillRect(bx - 10, by - 8 + bob, 20, 3); // v88: Box mit sechs Phiolen
      const nb = Math.floor(pk * 6 + 0.001); for (let q = 0; q < 6; q++) { const cx2 = bx - 6 + (q % 3) * 6, cy2 = by - 1 + Math.floor(q / 3) * 5 + bob; ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.arc(cx2, cy2, 2.2, 0, TAU); ctx.fill(); if (q < nb) { ctx.fillStyle = '#8FD8FF'; ctx.beginPath(); ctx.arc(cx2, cy2, 1.8, 0, TAU); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(cx2 - 0.9, cy2 - 1.2, 0.9, 0.9); } }
    } else {
      ctx.fillStyle = tab ? '#E8DFC8' : 'rgba(238,242,247,.92)'; rr(bx - 8, by - 10 + bob, 16, 20, 3); ctx.fill();
      if (pk > 0) { const fh = 17 * pk; ctx.fillStyle = gcol; rr(bx - 6.5, by + 8.5 - fh + bob, 13, fh, 2); ctx.fill(); }
      ctx.fillStyle = tab ? '#B5473A' : '#4FAE63'; ctx.fillRect(bx - 8, by - 8 + bob, 16, 2); // Verschluss
      if (!pk) { ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(bx - 1, by - 4, 2, 9); }
    }
    if (pk > 0) for (let q = 0; q < 3; q++) { const ph = (gt * 2.4 + q / 3) % 1, px2 = sx + (bx - sx) * ph, py2 = sy - 6 - Math.sin(ph * Math.PI) * 10; ctx.fillStyle = gcol; ctx.beginPath(); ctx.arc(px2, py2, 1.4, 0, TAU); ctx.fill(); }
    // fertige Ware rechts: zwei Reihen zu je fuenf
    const n = Math.min(PILE, st.tab.bags);
    for (let k = 0; k < n; k++) {
      const ix = x + 12 + (k % 5) * 9.5, iy = y - 13 + Math.floor(k / 5) * 13;
      if (prm) { ctx.fillStyle = '#F4F4F8'; rr(ix - 3.5, iy - 4, 8, 10, 2); ctx.fill(); ctx.fillStyle = '#2E9E5B'; ctx.fillRect(ix - 3.5, iy - 4, 8, 2.5); ctx.fillRect(ix - 0.2, iy, 1.4, 4); ctx.fillRect(ix - 1.8, iy + 1.3, 4.6, 1.4); } // v89: Apotheken-Dose
      else if (brew) { ctx.fillStyle = '#E8ECF2'; ctx.fillRect(ix - 3.5, iy - 4, 8, 10); ctx.fillStyle = '#5BC0EB'; ctx.fillRect(ix - 3.5, iy - 4, 8, 2); ctx.fillStyle = '#8FD8FF'; ctx.beginPath(); ctx.moveTo(ix + 0.5, iy - 0.5); ctx.lineTo(ix + 2.3, iy + 2); ctx.lineTo(ix + 0.5, iy + 4); ctx.lineTo(ix - 1.3, iy + 2); ctx.closePath(); ctx.fill(); }
      else if (tab) { ctx.fillStyle = '#E8DFC8'; ctx.fillRect(ix - 3.5, iy - 4, 8, 10); ctx.fillStyle = '#B5473A'; ctx.fillRect(ix - 3.5, iy, 8, 2.4); }
      else { ctx.fillStyle = '#EEF2F7'; rr(ix - 3.5, iy - 4, 8, 10, 1.5); ctx.fill(); ctx.fillStyle = '#4FAE63'; ctx.fillRect(ix - 3.5, iy - 4, 8, 1.5); ctx.fillStyle = gcol; ctx.beginPath(); ctx.arc(ix + 0.5, iy + 2, 1.8, 0, TAU); ctx.fill(); ctx.fillStyle = '#7E57B0'; ctx.fillRect(ix + 1, iy + 2.5, 1.2, 1.2); }
    }
    if (pk > 0) { ctx.fillStyle = 'rgba(0,0,0,.5)'; rr(x - 40, y + hh + 4, 80, 6, 3); ctx.fill(); ctx.fillStyle = ar.dry; rr(x - 40, y + hh + 4, 80 * pk, 6, 3); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '700 9px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillText(ar.lbl.table || 'Packtisch', x - hw + 2, y - hh - 4);
    if (st.tab.bags > PILE) { ctx.fillStyle = st.tab.bags >= bagsMax() ? '#FF8FA3' : '#FFB547'; ctx.textAlign = 'right'; ctx.fillText(st.tab.bags >= bagsMax() ? 'Lager voll ' + st.tab.bags : 'Lager ' + st.tab.bags, x + hw - 2, y - hh - 4); ctx.textAlign = 'left'; }
    rotEnd();
  }
  function drawKellerFloor(f) {
    const I = IN, F = G.fl[flKey(f)], ar = AREAS[f < 0 ? 'ku' : 'ko'];
    drawFloor(ar);
    ctx.fillStyle = '#0D1117'; for (let i = 0; i < 5; i++) { const c = colliders[i]; ctx.fillRect(c.x, c.y, c.w, c.h); }
    ctx.fillRect(370, 508, 80, T); ctx.fillRect(600, 40, T, 480);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '800 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(flName(f).toUpperCase(), (I.x0 + I.x1) / 2, I.y0 + 16);
    drawFields(ar); drawDecorFor(ar, 0);
    drawRackFor(ar); drawTableFor(ar);
    for (let i = 0; i < ar.POTS.length; i++) {
      const q = ar.POTS[i];
      if (i >= F.n) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(q.x, q.y, 16, 0, TAU); ctx.fill(); continue; }
      drawPlantAt(q.x, q.y, F.pots[i], rotAng(q, q.r)); drawGrowLamp(q.x, q.y, i + 20, F.pots[i], rotAng(q, q.r)); drawDrop(q.x, q.y, F.pots[i]);
    }
    drawStairs(FLS[f].x, FLS[f].y, f < 0, 'ERDGESCHOSS', true, G.build.stair[ar.key], rotAng(FLS[f], FLS[f].r));
    drawDecorFor(ar, 1);
  }
  // ---------- Kiosk-Laden (v54) ----------
  // Gang-Look (Bandanas, Cap verkehrt, Baggy-Jeans) und Spezialwaffen gibt es nur hier: hingehen und A druecken.
  const KIOSK_AT = { x: KIOSK.x + KIOSK.w / 2, y: KIOSK.y + KIOSK.h + 14 };
  const atKiosk = () => !!G && !player.fl && Math.hypot(player.x - KIOSK_AT.x, player.y - KIOSK_AT.y) < 70;
  function openKiosk() { if (!atKiosk()) return false; tab = 'kiosk'; openPhone(); sfx.ping(); return true; }
  function renderKiosk(b) {
    const info = document.createElement('div'); info.className = 'empty'; info.style.cssText = 'padding:6px 4px;font-size:13px;text-align:left';
    const here = atKiosk();
    info.textContent = here ? 'Willkommen am Kiosk! Hier gibt es, was keine App verkauft: Gang-Look und Spezialwaffen. Bandanas und die Cap nehmen deine Kleidungsfarbe an (Farbe unter Kosmetik → Figur).' : 'Der Kiosk verkauft nur vor Ort. Geh zum Kiosk im Stadtpark (Ecke Hauptstraße und Scheunengasse) und drück dort A.';
    b.appendChild(info); if (!here) return;
    const hd = t => { const e = document.createElement('div'); e.className = 'grp'; e.textContent = t; b.appendChild(e); };
    hd('Gang-Look');
    WEAR.filter(w => w.kiosk).sort((x, y) => x.rep - y.rep).forEach(w => {
      const owned = wearOwned(w.id), on = G.look[WEAR_KEY[w.slot]] === w.id, locked = !owned && G.rep < w.rep;
      const c = document.createElement('div'); c.className = 'card cos';
      c.innerHTML = '<canvas class="pv" data-wear="' + w.id + '" width="264" height="128"></canvas><div class="nm">' + w.name + (on ? ' <span style="color:var(--green);font-weight:700">angelegt</span>' : '') + '</div><div class="pr">' + (owned ? 'gekauft' : fmt(w.cost)) + '</div><div class="ds">' + w.desc + '</div>';
      const btn = document.createElement('button'); btn.className = 'buy';
      if (!owned) { btn.textContent = locked ? 'Ab Ruf ' + w.rep : 'Kaufen'; btn.disabled = locked || G.money < w.cost; btn.addEventListener('click', () => { if (buyWear(w.id, true)) renderPhone(); }); }
      else { btn.textContent = on ? 'Ablegen' : 'Anlegen'; if (on) btn.classList.add('alt'); btn.addEventListener('click', () => { equipWear(w.id); renderPhone(); }); }
      c.appendChild(btn); b.appendChild(c);
    });
    hd('Spezialwaffen');
    BATS.filter(x => x.kiosk).sort((p, q) => p.rep - q.rep).forEach(bt => {
      const owned = !!G.wpn.owned[bt.id], on = G.wpn.eq === bt.id, locked = !owned && G.rep < bt.rep;
      const c = document.createElement('div'); c.className = 'card cos';
      c.innerHTML = '<canvas class="pv" data-bat="' + bt.id + '" width="264" height="128"></canvas><div class="nm">' + bt.name + (on ? ' <span style="color:var(--green);font-weight:700">in der Hand</span>' : '') + '</div><div class="pr">' + (owned ? 'gekauft' : fmt(bt.cost)) + '</div><div class="ds">' + bt.desc + '</div>';
      const btn = document.createElement('button'); btn.className = 'buy';
      if (!owned) { btn.textContent = locked ? 'Ab Ruf ' + bt.rep : 'Kaufen'; btn.disabled = locked || G.money < bt.cost; btn.addEventListener('click', () => { if (buyBat(bt.id, true)) renderPhone(); }); }
      else { btn.textContent = on ? 'Weglegen' : 'In die Hand'; if (on) btn.classList.add('alt'); btn.addEventListener('click', () => { equipBat(bt.id); renderPhone(); }); }
      c.appendChild(btn); b.appendChild(c);
    });
    startPreviews(b);
  }
