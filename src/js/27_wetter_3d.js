  // ---------- Tag und Nacht, Wetter, Leben auf der Karte (v48) ----------
  const SKY = [[0, .64, 6, 10, 40], [4.5, .64, 6, 10, 40], [5.8, .34, 70, 40, 80], [7, .10, 255, 160, 90], [8.5, 0, 255, 255, 255], [16.5, 0, 255, 255, 255], [17.8, .10, 255, 140, 60], [19.2, .36, 70, 30, 90], [20.8, .62, 6, 10, 40], [24, .64, 6, 10, 40]];
  function skyNow() {
    const h = G ? G.time / 60 : 12;
    for (let i = 1; i < SKY.length; i++) {
      const a = SKY[i - 1], b = SKY[i];
      if (h <= b[0]) { const k = (h - a[0]) / (b[0] - a[0]), m = j => a[j] + (b[j] - a[j]) * k; return { a: m(1), r: Math.round(m(2)), g: Math.round(m(3)), b: Math.round(m(4)) }; }
    }
    return { a: .64, r: 6, g: 10, b: 40 };
  }
  let skyC = { a: 0, r: 255, g: 255, b: 255 }, indoorK = 0, lastRoom = null;
  const night = () => G ? skyNow().a : 0;
  const lightK = () => clamp(skyC.a * 1.8 - 0.06, 0, 1);
  const rainTarget = () => { if (STU.on && STU.rain !== null) return STU.rain; if (G && state === 'play' && evWeather() === 'storm') return 1; if (!G || state !== 'play' || ((G.day * 37) % 11) >= 2) return 0; const st = 7 + (G.day * 5) % 6, h = G.time / 60; return h >= st && h < st + 5 ? 1 : 0; };
  const amb = { pig: [], flock: null, flockT: 30, rain: 0 };
  for (let i = 0; i < 6; i++) amb.pig.push({ x: FOUNTAIN.x + Math.cos(i * 1.05) * 90, y: FOUNTAIN.y + Math.sin(i * 1.05) * 90, tx: 0, ty: 0, fl: 0, f: 1, wt: i * 0.6, mv: 0 });
  const traffic = []; let trafT = 3;
  const TCOL = ['#C94B4B', '#4B7FC9', '#E0B13A', '#3F9A6A', '#8A5FC9', '#E8E8EE', '#2E3440'];
  // v72: Verkehr auf allen Strassen (rechts fahren). An Kreuzungen hat die waagerechte Strasse Vorfahrt, die senkrechte wartet.
  const LANES = [];
  for (const r of RD) { const w = r.c1 - r.c0, a = r.c0 + w * 0.3, b = r.c1 - w * 0.3; if (r.h) LANES.push({ r, h: 1, dir: -1, c: a }, { r, h: 1, dir: 1, c: b }); else LANES.push({ r, h: 0, dir: 1, c: a }, { r, h: 0, dir: -1, c: b }); }
  const btraf = []; function updateBridgeTraffic() {} function drawBridgeTraffic() {} // v72: alles in traffic
  const crossBoxes = []; for (const h of RDH) for (const v of RDV) crossBoxes.push({ x0: v.c0, x1: v.c1, y0: h.c0, y1: h.c1 });
  const inBox = (b, x, y, m) => x > b.x0 - m && x < b.x1 + m && y > b.y0 - m && y < b.y1 + m;
  function committed(o, b) { // ueber die Haltelinie, aber noch nicht aus der Kreuzung heraus
    const half = o.truck ? 31 : 22, d = o.dir;
    if (o.h) { if (o.y < b.y0 || o.y > b.y1) return false; const f = o.x + d * half, r = o.x - d * half; return (f - (d > 0 ? b.x0 - SW - 6 : b.x1 + SW + 6)) * d > 0 && (d > 0 ? r < b.x1 + 4 : r > b.x0 - 4); }
    if (o.x < b.x0 || o.x > b.x1) return false; const f = o.y + d * half, r = o.y - d * half; return (f - (d > 0 ? b.y0 - SW - 6 : b.y1 + SW + 6)) * d > 0 && (d > 0 ? r < b.y1 + 4 : r > b.y0 - 4);
  }
  function spawnTraffic() {
    const ln = LANES[Math.random() < 0.3 ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * LANES.length)], lim = ln.h ? WW : WH, p = ln.dir > 0 ? (ln.h ? 0 : YMIN) - 90 : lim + 90;
    const c = { ln, h: ln.h, dir: ln.dir, p, v: 0, vt: 70 + Math.random() * 45, col: TCOL[Math.floor(Math.random() * TCOL.length)], truck: Math.random() < 0.18 };
    c.x = ln.h ? p : ln.c; c.y = ln.h ? ln.c : p;
    if (traffic.some(o => o.ln === ln && Math.abs(o.p - p) < 140) || evRoadClosed(ln.r)) return null;
    traffic.push(c); return c;
  }
  // v86: fahrende Autos: kurz K.O., ein bis zwei Beutel gehen verloren (ohne Ware ein bisschen Geld). Das Verlorene liegt am Boden und kann wieder aufgesammelt werden.
  function trafficHit(c) {
    if (!G || state !== 'play' || player.x < 0 || player.trCd > 0 || c.v < 14 || inBuilding(player.x, player.y) || inCar()) return;
    const hl = c.truck ? 31 : 22, hw = 11, pr = 8;
    const ax = c.h ? Math.abs(player.x - c.x) < hl + pr : Math.abs(player.x - c.x) < hw + pr, ay = c.h ? Math.abs(player.y - c.y) < hw + pr : Math.abs(player.y - c.y) < hl + pr;
    if (!(ax && ay)) return;
    player.trCd = 8; player.stun = Math.max(player.stun, 1.1);
    const side = c.h ? (player.y < c.y ? -1 : 1) : (player.x < c.x ? -1 : 1), kx = c.h ? c.dir * 70 : side * 190, ky = c.h ? side * 190 : c.dir * 70;
    mp.kb = { x: kx, y: ky, t: 0.35 };
    const kl = Math.hypot(kx, ky) || 1, bx = player.x - kx / kl * 46, by = player.y - ky / kl * 46, taken = {}; let lost = 0, cashLost = 0, di = 0;
    for (let q = 0, nLoss = 1 + (Math.random() < 0.5 ? 1 : 0); q < nLoss; q++) {
      const ks = AREA_KEYS.filter(k => isOpen(AREAS[k]) && S(AREAS[k]).inv.bags > 0);
      if (!ks.length) break;
      const k = ks[Math.floor(Math.random() * ks.length)]; S(AREAS[k]).inv.bags--; taken[k] = (taken[k] || 0) + 1; lost++;
    }
    for (const k of Object.keys(taken)) drops.push({ id: mp.id + '.d' + (++dropN), x: bx + 14 * di++, y: by, prod: k, n: taken[k], cash: 0, t: 45, mc: 0 });
    if (!lost && G.money >= 1) { cashLost = Math.min(Math.floor(G.money), Math.max(5, Math.min(60, Math.round(5 + G.money * 0.01)))); G.money -= cashLost; drops.push({ id: mp.id + '.d' + (++dropN), x: bx, y: by, prod: null, n: 0, cash: cashLost, t: 45, mc: 0 }); }
    floater(player.x, player.y - 24, 'K.O.', '#FFD24A'); sfx.bad(); vibrate([60, 40, 90]);
    msg('Vom Auto erwischt!' + (lost ? ' ' + lost + ' Ware verloren, sie liegt in der Nähe' : cashLost ? ' ' + fmt(cashLost) + ' verloren, sie liegen in der Nähe' : ''), true);
  }
  function updateTraffic(dt) {
    if (player.trCd > 0) player.trCd -= dt;
    trafT -= dt;
    if (trafT <= 0) { trafT = 3 + Math.random() * 6; if (traffic.length < 9 && state === 'play') spawnTraffic(); }
    for (let i = traffic.length - 1; i >= 0; i--) {
      const c = traffic[i]; let tv = c.vt, half = c.truck ? 31 : 22;
      const ahead = (ox, oy, d) => { const al = c.h ? (ox - c.x) * c.dir : (oy - c.y) * c.dir, cr = c.h ? Math.abs(oy - c.y) : Math.abs(ox - c.x); return al > 0 && al < d && cr < 24; };
      if (ahead(player.x, player.y, 90) || cops.some(q => q.on && ahead(q.x, q.y, 90)) || cars.some(q => ahead(q.x, q.y, 90))) tv = 0;
      for (const o of traffic) if (o !== c && o.ln === c.ln && ahead(o.x, o.y, 92)) tv = Math.min(tv, o.v * 0.8);
      const fx = c.x + (c.h ? c.dir * half : 0), fy = c.y + (c.h ? 0 : c.dir * half);
      for (const b of crossBoxes) { // vor der Kreuzung (samt Zebrastreifen) halten, wenn sie belegt ist
        const ent = c.h ? (c.dir > 0 ? b.x0 - SW - 6 - fx : fx - (b.x1 + SW + 6)) : (c.dir > 0 ? b.y0 - SW - 6 - fy : fy - (b.y1 + SW + 6));
        if (ent < 0 || ent > 46 || (c.h ? (c.y < b.y0 || c.y > b.y1) : (c.x < b.x0 || c.x > b.x1))) continue;
        const busy = traffic.some(o => o !== c && o.h !== c.h && committed(o, b)) || (!c.h && (traffic.some(o => o.h && Math.abs(o.y - (b.y0 + b.y1) / 2) < 80 && (b.x0 - o.x) * o.dir > -30 && (b.x0 - o.x) * o.dir < 150) || cars.some(o => Math.abs(o.x - (b.x0 + b.x1) / 2) < 170)));
        if (busy) tv = 0;
      }
      if (EVA.length && evTrafBlock(c, half) < 50) { tv = 0; if (c.v < 1 && !inView(c.x, c.y, 60)) { traffic.splice(i, 1); continue; } } // v166: Absperrung
      c.v += clamp(tv - c.v, -170 * dt, 60 * dt); c.p += c.dir * c.v * dt;
      if (c.h) c.x = c.p; else c.y = c.p;
      trafficHit(c);
      if ((c.dir > 0 && c.p > (c.h ? WW : WH) + 120) || (c.dir < 0 && c.p < (c.h ? 0 : YMIN) - 120)) traffic.splice(i, 1);
    }
  }
  const TMODELS = ['mini', 'mini', 'suv', 'van', 'pickup', 'muscle', 'suv', 'mini', 'sport', 'lowrider'];
  function trafficTune(m, r, ci) { // v150: jedes Verkehrsauto bekommt eigenes Tuning (ohne Hanf-Motive)
    let sd = Math.floor(r * 2147483646) + 1; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647, pick = n => Math.floor(rnd() * n), sporty = m === 'sport' || m === 'muscle' || m === 'lowrider';
    const t = [-1, -1, 0, -1, -1, -1, -1, -1, -1, -1, -1]; if (m === 'truck') { if (rnd() < 0.4) t[4] = pick(TUNE.rims.cols.length); return t; }
    if (rnd() < 0.12) t[0] = pick(TUNE.neon.cols.length);
    if (rnd() < (sporty ? 0.45 : 0.08)) t[2] = 1 + pick(2);
    if (rnd() < (sporty ? 0.45 : 0.18)) { let k = pick(CAR_COLS.length); if (k === ci) k = (k + 4) % CAR_COLS.length; t[3] = k; }
    if (rnd() < 0.35) t[4] = pick(TUNE.rims.cols.length);
    if (rnd() < 0.1) { const w = [0, 1, 2, 3, 5, 6]; t[5] = w[pick(w.length)]; }
    if (rnd() < 0.3) t[6] = pick(3); else if (rnd() < 0.03) t[6] = 3;
    if (rnd() < 0.3) t[7] = pick(TUNE.tint.cols.length);
    if (rnd() < 0.12) t[8] = pick(TUNE.lights.cols.length);
    if (sporty && rnd() < 0.3) t[9] = pick(TUNE.exhaust.cols.length);
    if (rnd() < 0.14) { const rf = [0, 1, 2, 3]; t[10] = rf[pick(rf.length)]; }
    return t;
  }
  function drawTraffic() { // v148: Verkehr nutzt dieselben Automodelle wie die Spielerautos
    for (const c of traffic) {
      if (!inView(c.x, c.y, 70)) continue;
      if (!c.m) { const r = (Math.abs(Math.sin((c.p || 0) * 12.9898 + c.vt * 78.233)) * 43758.5453) % 1; c.m = c.truck ? 'truck' : TMODELS[Math.floor(r * TMODELS.length)]; c.ci = Math.floor(((r * 7.31) % 1) * CAR_COLS.length); c.lk = Object.assign({}, DEF_LOOK, { skin: Math.floor(r * 97) % SKIN_COLS.length, hair: Math.floor(r * 53) % HAIR_COLS.length, r: 60 + Math.floor(r * 150), g: 60 + Math.floor(r * 911) % 150, b: 60 + Math.floor(r * 353) % 150 }); c.tn = trafficTune(c.m, r, c.ci); }
      const ang = c.h ? (c.dir > 0 ? 0 : Math.PI) : (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      if (!VEH_BY[c.m]) { c.m = 'mini'; } if (c.m === 'truck') c.ci = 7; drawCar(c.x, c.y - 2, ang, c.m, c.ci, c.lk, false, c.tn || null, c.m === 'truck' ? { fleet: true } : null);
      if (c.v < 8) { const L = VEH_BY[c.m].len, bx = c.x - Math.cos(ang) * (L / 2 + 1), by = c.y - Math.sin(ang) * (L / 2 + 1); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(bx, by, 0, bx, by, 10); g.addColorStop(0, 'rgba(255,60,60,.45)'); g.addColorStop(1, 'rgba(255,60,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, 10, 0, TAU); ctx.fill(); ctx.restore(); }
    }
  }
  function ambUpdate(dt) {
    duckUpdate(dt); lifeUpdate(dt); // v169
    for (const p of amb.pig) {
      let fear = null; for (const e of [player].concat(cops.filter(c => c.on))) if (Math.hypot(e.x - p.x, e.y - p.y) < 52) { fear = e; break; }
      if (fear && p.fl <= 0) { p.fl = 1.4; const a = Math.atan2(p.y - fear.y, p.x - fear.x) + (Math.random() - 0.5) * 0.8; p.tx = clamp(p.x + Math.cos(a) * 110, ZP.x0, ZP.x1); p.ty = clamp(p.y + Math.sin(a) * 80, ZP.y0, ZP.y1); p.f = p.tx >= p.x ? 1 : -1; }
      if (p.fl > 0) { p.fl -= dt; const k = Math.min(1, dt * 3); p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; continue; }
      p.wt -= dt;
      if (p.wt <= 0) { p.wt = 1 + Math.random() * 3; if (Math.random() < 0.5) { p.tx = clamp(p.x + (Math.random() - 0.5) * 60, ZP.x0, ZP.x1); p.ty = clamp(p.y + (Math.random() - 0.5) * 40, ZP.y0, ZP.y1); p.f = p.tx >= p.x ? 1 : -1; p.mv = 0.8; } else p.mv = 0; }
      if (p.mv > 0) { p.mv -= dt; const d = Math.hypot(p.tx - p.x, p.ty - p.y); if (d > 1) { p.x += (p.tx - p.x) / d * 24 * dt; p.y += (p.ty - p.y) / d * 24 * dt; } }
      { const fd = Math.hypot(p.x - FOUNTAIN.x, p.y - FOUNTAIN.y); if (fd < 52) { const k = 52 / Math.max(1, fd); p.x = FOUNTAIN.x + (p.x - FOUNTAIN.x) * k; p.y = FOUNTAIN.y + (p.y - FOUNTAIN.y) * k; } } // v72: nicht in den Brunnen
    }
    amb.flockT -= dt;
    if (amb.flockT <= 0 && !amb.flock) { if (skyNow().a < 0.1 && amb.rain < 0.3) amb.flock = { x: -80, y: 150 + Math.random() * 2200, vx: 55 + Math.random() * 25, vy: (Math.random() - 0.5) * 10, n: 3 + Math.floor(Math.random() * 3) }; amb.flockT = 45 + Math.random() * 60; }
    if (amb.flock) { const f = amb.flock; f.x += f.vx * dt; f.y += f.vy * dt; if (f.x > WW + 100) amb.flock = null; }
    amb.rain += (rainTarget() - amb.rain) * Math.min(1, dt * 0.3);
    updateTraffic(dt); updateBridgeTraffic(dt);
  }
  const winLit = (hi, j) => ((hi * 7 + j * 5 + 3) % 5) !== 0;
  // v157: Lichtschein als einmal gezeichnetes Bild je Farbe (statt jedes Mal einen neuen Farbverlauf zu berechnen)
  const GLOWC = new Map(); let glowOff = false;
  function glowImg(rgb) { let c = GLOWC.get(rgb); if (c !== undefined) return c; if (GLOWC.size >= 64) return null; c = null; // höchstens 64 Farben merken
    try { if (!glowOff && typeof document !== 'undefined' && document.createElement ) { const cv0 = document.createElement('canvas'); cv0.width = cv0.height = 128; const x = cv0.getContext && cv0.getContext('2d'); if (x && x.createRadialGradient) { const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, 'rgba(' + rgb + ',1)'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); c = cv0; } } } catch (e) { c = null; }
    GLOWC.set(rgb, c); return c; }
  function glow(x, y, r, rgb, a) {
    if (!(r > 0) || !(a > 0)) return; const im = glowImg(rgb);
    if (im) { const ga = ctx.globalAlpha; try { ctx.globalAlpha = ga * Math.min(1, a); ctx.drawImage(im, x - r, y - r, 2 * r, 2 * r); ctx.globalAlpha = ga; return; } catch (e) { ctx.globalAlpha = ga; glowOff = true; GLOWC.clear(); } }
    const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  const inView = (x, y, m) => x > viewX0 - m && x < viewX1 + m && y > viewY0 - m && y < viewY1 + m;
  // v60: Suedstrasse, Uferweg, Wege von den Bruecken und Ostpark
  // v66: Brueckenstrasse: Fahrbahn mit Mittellinie und Gehwegen, von der Hauptstrasse bis zur Suedstrasse
  function drawBridges() { // v157: jede Brücke als fertiges Bild
    for (let bi = 0; bi < HBR.length; bi++) { const b = HBR[bi]; // v73: Holzbruecken quer ueber die Baeche
      if (!inView(b.x, b.y, 60)) continue;
      bcDraw('hbr' + bi, b.x0 - 8, b.y0 - 8, b.x1 - b.x0 + 16, b.y1 - b.y0 + 16, () => { const w = b.x1 - b.x0, h = b.y1 - b.y0;
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(b.x0 + 4, b.y0 + 6, w, h);
        ctx.fillStyle = '#6E5238'; ctx.fillRect(b.x0, b.y0, w, h);
        ctx.fillStyle = '#9A7650'; for (let x = b.x0 + 2; x < b.x1 - 2; x += 7) ctx.fillRect(x, b.y0 + 3, 5, h - 6);
        ctx.fillStyle = '#4A3826'; ctx.fillRect(b.x0, b.y0 - 3, w, 4); ctx.fillRect(b.x0, b.y1 - 1, w, 4);
        ctx.fillStyle = '#5B4330'; for (let x = b.x0; x <= b.x1; x += 15) { ctx.fillRect(x - 2, b.y0 - 4, 5, 6); ctx.fillRect(x - 2, b.y1 - 2, 5, 6); }
      });
    }
    for (let bi = 0; bi < ALLB.length; bi++) { const b = ALLB[bi];
      if (!inView(b.x, (b.y0 + b.y1) / 2, 140)) continue;
      bcDraw('allb' + bi, b.x0 - 8, b.y0 - 8, b.x1 - b.x0 + 16, b.y1 - b.y0 + 16, () => {
        const w = b.x1 - b.x0, h = b.y1 - b.y0;
        if (b.road) { // Strassenbruecke: Fahrbahn, Gehwege, Gelaender
          ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(b.x0 + 5, b.y0 + 7, w, h);
          ctx.fillStyle = '#59626D'; ctx.fillRect(b.x0, b.y0, w, h); ctx.fillStyle = '#3A4048'; ctx.fillRect(b.x0 + SW + 5, b.y0, w - 2 * SW - 10, h); ctx.fillStyle = '#23272E'; ctx.fillRect(b.x0 + SW + 8, b.y0, w - 2 * SW - 16, h);
          ctx.fillStyle = 'rgba(255,255,255,.38)'; for (let y = b.y0 + 8; y < b.y1 - 20; y += 34) ctx.fillRect(b.x - 2, y, 4, 18);
          ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let y = b.y0; y < b.y1; y += 30) { ctx.fillRect(b.x0, y, SW + 5, 1); ctx.fillRect(b.x1 - SW - 5, y, SW + 5, 1); }
          ctx.fillStyle = '#9AA6B3'; ctx.fillRect(b.x0 - 3, b.y0, 4, h); ctx.fillRect(b.x1 - 1, b.y0, 4, h); ctx.fillStyle = '#5C6672'; for (let y = b.y0; y <= b.y1; y += 12) { ctx.fillRect(b.x0 - 4, y - 1, 6, 3); ctx.fillRect(b.x1 - 2, y - 1, 6, 3); }
          return;
        }
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(b.x0 + 4, b.y0 + 6, w, h);
        ctx.fillStyle = '#6E5238'; ctx.fillRect(b.x0, b.y0, w, h);
        ctx.fillStyle = '#8E6C48'; for (let y = b.y0 + 2; y < b.y1 - 2; y += 7) ctx.fillRect(b.x0 + 3, y, w - 6, 5);
        ctx.fillStyle = '#4A3826'; ctx.fillRect(b.x0 - 3, b.y0, 4, h); ctx.fillRect(b.x1 - 1, b.y0, 4, h);
        ctx.fillStyle = '#5B4330'; for (let y = b.y0; y <= b.y1; y += 16) { ctx.fillRect(b.x0 - 4, y - 2, 6, 5); ctx.fillRect(b.x1 - 2, y - 2, 6, 5); }
      });
    }
  }
  function drawPaths() { // v56: ausgetretene Erdwege mit Grasrand und Fussspuren
    for (const p of PATHS) {
      if (p.x1 < viewX0 || p.x0 > viewX1 || p.y1 < viewY0 || p.y0 > viewY1) continue;
      const w = p.x1 - p.x0, h = p.y1 - p.y0;
      ctx.fillStyle = 'rgba(20,34,26,.9)'; rr(p.x0 - 3, p.y0 - 3, w + 6, h + 6, 10); ctx.fill();
      ctx.fillStyle = '#4A3D2A'; rr(p.x0, p.y0, w, h, 8); ctx.fill();
      ctx.fillStyle = '#5A4A33'; rr(p.x0 + 4, p.y0 + 4, w - 8, h - 8, 6); ctx.fill();
      ctx.fillStyle = 'rgba(30,22,14,.45)'; const hor = w > h;
      for (let k = 0, n = Math.floor((hor ? w : h) / 26); k < n; k++) { const a = 10 + k * 26 + (k % 2) * 6, b = (k % 2 ? 0.36 : 0.62) * (hor ? h : w); if (hor) ell(p.x0 + a, p.y0 + b, 3.2, 1.8); else ell(p.x0 + b, p.y0 + a, 1.8, 3.2); ctx.fill(); }
      ctx.fillStyle = 'rgba(80,140,80,.35)'; for (let k = 0, n = Math.floor((hor ? w : h) / 40); k < n; k++) { const a = 18 + k * 40; if (hor) { ctx.fillRect(p.x0 + a, p.y0 + 1, 3, 4); ctx.fillRect(p.x0 + a + 14, p.y1 - 5, 3, 4); } else { ctx.fillRect(p.x0 + 1, p.y0 + a, 4, 3); ctx.fillRect(p.x1 - 5, p.y0 + a + 14, 4, 3); } }
    }
  }
  function drawBins() {
    const ni = state === 'play' ? binTgI : -1;
    BINS.forEach((b, i) => {
      const x = b.x, y = b.y; if (!inView(x, y, 30)) return;
      ctx.fillStyle = 'rgba(0,0,0,.32)'; ell(x + 2, y + 5, 9, 3.2); ctx.fill(); // v147: Muelltonne mit Rillen, Deckel und Raedern
      { const g = ctx.createLinearGradient(x - 7, 0, x + 7, 0); g.addColorStop(0, '#3E8A5E'); g.addColorStop(0.45, '#2F6A48'); g.addColorStop(1, '#1E4A32'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 7, y - 9); ctx.lineTo(x + 7, y - 9); ctx.lineTo(x + 6, y + 4); ctx.lineTo(x - 6, y + 4); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,.16)'; for (const rx of [-3.6, 0, 3.6]) ctx.fillRect(x + rx - 0.4, y - 7, 0.8, 9); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.fillRect(x - 6, y - 8, 1.2, 11);
      ctx.fillStyle = '#F4F4F8'; ctx.beginPath(); for (let k = 0; k < 3; k++) { const a0 = -Math.PI / 2 + k * TAU / 3; ctx.moveTo(x + Math.cos(a0) * 2.4, y - 2 + Math.sin(a0) * 2.4); ctx.lineTo(x + Math.cos(a0 + 1.6) * 2.4, y - 2 + Math.sin(a0 + 1.6) * 2.4); } ctx.lineWidth = 0.9; ctx.strokeStyle = 'rgba(244,244,248,.8)'; ctx.stroke();
      ctx.fillStyle = '#14161C'; ctx.beginPath(); ctx.arc(x - 4.5, y + 4.4, 1.5, 0, TAU); ctx.arc(x + 4.5, y + 4.4, 1.5, 0, TAU); ctx.fill();
      { const g = ctx.createLinearGradient(0, y - 13, 0, y - 8); g.addColorStop(0, '#6FC08E'); g.addColorStop(1, '#3E8A5E'); ctx.fillStyle = g; rr(x - 8.4, y - 13, 16.8, 5, 1.8); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x - 7, y - 12.6, 14, 0.8);
      ctx.fillStyle = '#1E3A2A'; rr(x - 3, y - 15, 6, 2.4, 1); ctx.fill();
      if (G && G.stash && stashSum(G.stash[i]) > 0) { ctx.fillStyle = '#FFB547'; ctx.beginPath(); ctx.arc(x + 6, y - 13, 2.4, 0, TAU); ctx.fill(); } // eigenes Versteck
      if (i === ni) { ctx.strokeStyle = 'rgba(255,181,71,' + (0.45 + 0.25 * Math.sin(gt * 5)).toFixed(2) + ')'; ctx.lineWidth = 1.6; rr(x - 11, y - 18, 22, 27, 6); ctx.stroke(); }
    });
  }
  const PUDDLES = [], HYDRANTS = [];
  { let s = 9; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 70; i++) { const r = RD[Math.floor(rnd() * RD.length)], side = rnd() < 0.5 ? -1 : 1, along = (r.h ? 0 : YMIN) + 40 + rnd() * ((r.h ? WW : WH - YMIN) - 80), c = swLine(r, side) + (rnd() - 0.5) * 12; PUDDLES.push(r.h ? [along, c] : [c, along]); }
    for (const r of RDH) for (const v of RDV) for (const q of [[v.c0 - SW - 12, r.c0 - SW + 6, 'h'], [v.c1 + SW + 12, r.c1 + SW - 6, rnd() < 0.5 ? 'm' : 'h']]) if (!doorZone(q[0], q[1], 8) && !inKeep(q[0], q[1], 8)) { const o = { x: q[0], y: q[1] }; wallFix(o, 16); q[1] = o.y; HYDRANTS.push(q); } // v161: auch nicht vor Eingängen, v162: nicht an Hauswänden
  }
  function drawAmbientGround() {
    const L = lightK();
    if (gsPass !== 1) drawBins(); // v136: Tonnen live (Inhalt ändert sich), Hydranten und Fahrradständer in den Bodenkacheln
    if (gsPass !== 2) for (const [x, y, k] of HYDRANTS) {
      if (!inView(x, y, 30)) continue;
      if (k === 'm') { // v147: Briefkasten
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ell(x + 1, y + 3.5, 6, 2.2); ctx.fill(); ctx.fillStyle = '#3A3F47'; ctx.fillRect(x - 1.2, y - 3, 2.4, 6.4);
        { const g = ctx.createLinearGradient(x - 6, 0, x + 6, 0); g.addColorStop(0, '#FFE070'); g.addColorStop(0.5, '#F2C94C'); g.addColorStop(1, '#C49A20'); ctx.fillStyle = g; rr(x - 6, y - 15, 12, 13, 3); ctx.fill(); }
        ctx.fillStyle = '#14161C'; rr(x - 3.6, y - 12.4, 7.2, 1.6, 0.6); ctx.fill(); ctx.strokeStyle = '#14161C'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, y - 6.4, 2, Math.PI * 0.15, Math.PI * 1.1); ctx.stroke(); ctx.fillStyle = '#14161C'; ctx.beginPath(); ctx.arc(x + 1.4, y - 5.6, 0.7, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x - 5, y - 14, 1, 10); ctx.fillStyle = '#B08A1A'; ctx.fillRect(x - 6, y - 4, 12, 1); }
      else { // v147: Hydrant
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ell(x + 1, y + 3, 6.4, 2.6); ctx.fill(); ctx.fillStyle = '#8E2A2A'; rr(x - 4.4, y + 0.6, 8.8, 2.4, 1); ctx.fill();
        { const g = ctx.createLinearGradient(x - 3.4, 0, x + 3.4, 0); g.addColorStop(0, '#E86A6A'); g.addColorStop(0.5, '#C94B4B'); g.addColorStop(1, '#8E2A2A'); ctx.fillStyle = g; rr(x - 3.2, y - 8, 6.4, 9.4, 1.2); ctx.fill(); }
        ctx.fillStyle = '#B03A3A'; rr(x - 5.6, y - 4.6, 11.2, 3, 1.2); ctx.fill(); ctx.fillStyle = '#C9D2DC'; ctx.beginPath(); ctx.arc(x - 5.6, y - 3.1, 1.2, 0, TAU); ctx.arc(x + 5.6, y - 3.1, 1.2, 0, TAU); ctx.fill();
        ctx.fillStyle = '#E8E8EE'; ctx.beginPath(); ctx.ellipse(x, y - 8.4, 3.6, 1.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#C9D2DC'; rr(x - 1.2, y - 10.6, 2.4, 2, 0.6); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x - 2.4, y - 7, 0.9, 7); }
    }
    // Fahrradstaender am Park und vor dem Kiosk
    if (gsPass !== 2) [[960, 760], [1560, 1268], [2360, 1520]].forEach(([x, y]) => {
      if (!inView(x, y, 50)) return;
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 25, y + 1, 50, 2.4); // v147: Fahrradstaender mit Rad
      ctx.lineCap = 'round'; for (let k = 0; k < 4; k++) { ctx.strokeStyle = '#5A626E'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x - 18 + k * 12, y, 5, Math.PI, 0); ctx.stroke(); ctx.strokeStyle = '#C9D2DC'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x - 18 + k * 12, y - 0.4, 5, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke(); }
      ctx.fillStyle = '#7A8494'; ctx.fillRect(x - 24, y - 0.4, 48, 1.8); ctx.lineCap = 'butt';
      const bx = x - 7; ctx.strokeStyle = '#1D2129'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(bx - 5, y - 1, 4.2, 0, TAU); ctx.moveTo(bx + 9.2, y - 1); ctx.arc(bx + 5, y - 1, 4.2, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(200,210,220,.6)'; ctx.lineWidth = 0.4; for (const wx of [bx - 5, bx + 5]) for (let q = 0; q < 4; q++) { const a = q * Math.PI / 4; ctx.beginPath(); ctx.moveTo(wx + Math.cos(a) * 3.8, y - 1 + Math.sin(a) * 3.8); ctx.lineTo(wx - Math.cos(a) * 3.8, y - 1 - Math.sin(a) * 3.8); ctx.stroke(); }
      ctx.strokeStyle = '#E05555'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(bx - 5, y - 1); ctx.lineTo(bx - 1, y - 6); ctx.lineTo(bx + 3.6, y - 6); ctx.lineTo(bx + 5, y - 1); ctx.moveTo(bx - 1, y - 6); ctx.lineTo(bx + 0.6, y - 1); ctx.lineTo(bx + 3.6, y - 6); ctx.moveTo(bx + 3.6, y - 6); ctx.lineTo(bx + 4.4, y - 8.4); ctx.stroke();
      ctx.fillStyle = '#1D2129'; ctx.fillRect(bx - 2.6, y - 7.4, 3.2, 1.2); ctx.fillRect(bx + 3.4, y - 9, 2.8, 0.9);
    });
    if (gsPass !== 1 && amb.rain > 0.12) { // Pfuetzen bei Regen
      const pa = Math.min(1, amb.rain * 1.3);
      PUDDLES.forEach(([x, y], i) => {
        if (!inView(x, y, 40)) return;
        ctx.fillStyle = 'rgba(110,140,180,' + 0.34 * pa + ')'; ell(x, y, 17 + (i % 3) * 5, 5 + (i % 2) * 2); ctx.fill();
        const ph = (gt * 0.8 + i * 0.37) % 1; ctx.strokeStyle = 'rgba(210,225,245,' + 0.5 * pa * (1 - ph) + ')'; ctx.lineWidth = 1; ell(x + Math.sin(i * 3) * 6, y, 2 + ph * 9, 1 + ph * 3); ctx.stroke();
      });
    }
    if (gsPass !== 1 && L < 0.2) { ctx.fillStyle = 'rgba(10,20,40,.07)'; const span = WW + 900; for (let i = 0; i < 4; i++) { const cx = -450 + ((gt * 9 + i * 1400) % span), cy = 260 + i * 560; if (cx > viewX0 - 260 && cx < viewX1 + 260) { ell(cx, cy, 240, 110); ctx.fill(); ell(cx + 140, cy + 40, 150, 70); ctx.fill(); } } } // Wolkenschatten
  }
  function treeCrown(t, sw, TC) {
      ctx.fillStyle = TC[0]; ctx.beginPath(); ctx.arc(t[0] + sw, t[1] - 14, 26, 0, TAU); ctx.fill();
      ctx.fillStyle = TC[1]; ctx.beginPath(); ctx.arc(t[0] - 8 + sw, t[1] - 20, 16, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(t[0] + 11 + sw, t[1] - 10, 13, 0, TAU); ctx.fill();
      ctx.fillStyle = TC[2]; ctx.beginPath(); ctx.arc(t[0] - 5 + sw, t[1] - 24, 8, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.13)'; ctx.beginPath(); ctx.arc(t[0] + sw, t[1] - 14, 26, 0.15, Math.PI * 0.95); ctx.arc(t[0] + sw - 4, t[1] - 18, 22, Math.PI * 0.95, 0.15, true); ctx.fill(); // v94: Schattenseite
      ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.beginPath(); ctx.arc(t[0] - 9 + sw, t[1] - 22, 9, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.10)'; for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.arc(t[0] + sw + Math.cos(q * 2.5 + t[1]) * 15, t[1] - 14 + Math.sin(q * 1.7 + t[0]) * 12, 2.6, 0, TAU); ctx.fill(); }
      if (TC === SEA_TREE[0] && !KR_NEUTRAL) { ctx.fillStyle = '#FFC2DC'; for (let q = 0; q < 6; q++) { ctx.beginPath(); ctx.arc(t[0] + sw + Math.cos(q * 1.9 + t[0]) * 16, t[1] - 16 + Math.sin(q * 2.3 + t[1]) * 12, 2.2, 0, TAU); ctx.fill(); } }
      else if (TC === SEA_TREE[3]) { ctx.fillStyle = 'rgba(244,248,255,.9)'; ctx.beginPath(); ctx.arc(t[0] + sw - 4, t[1] - 26, 12, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); ctx.beginPath(); ctx.arc(t[0] + sw + 10, t[1] - 16, 8, Math.PI * 1.05, Math.PI * 1.95); ctx.fill(); }
  }
  function lampDraw(LX, LY, on) { const L = on ? 1 : 0; // v157: einmal gezeichnet, danach als Bild
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(LX + 2, LY + 1.5, 6, 2.2); ctx.fill(); // v147: Laterne mit Sockel, Ring und Glaskopf
      ctx.fillStyle = '#20262E'; ctx.fillRect(LX - 1.5, LY - 30, 3, 32); ctx.fillStyle = '#4A5260'; ctx.fillRect(LX - 1.5, LY - 30, 1, 32);
      ctx.fillStyle = '#2A2F38'; ctx.fillRect(LX - 4, LY - 4, 8, 6); ctx.fillStyle = '#3A404A'; ctx.fillRect(LX - 5, LY - 1, 10, 3); ctx.fillStyle = '#4A5260'; ctx.fillRect(LX - 4, LY - 4, 8, 1); ctx.fillRect(LX - 2.4, LY - 20, 4.8, 1.6);
      ctx.fillStyle = '#2A2F38'; ctx.beginPath(); ctx.moveTo(LX - 3, LY - 29); ctx.lineTo(LX + 3, LY - 29); ctx.lineTo(LX + 4.6, LY - 36); ctx.lineTo(LX - 4.6, LY - 36); ctx.closePath(); ctx.fill();
      ctx.fillStyle = L > 0.2 ? '#FFE9A8' : '#8A94A2'; ctx.beginPath(); ctx.moveTo(LX - 2.2, LY - 30); ctx.lineTo(LX + 2.2, LY - 30); ctx.lineTo(LX + 3.4, LY - 35); ctx.lineTo(LX - 3.4, LY - 35); ctx.closePath(); ctx.fill(); if (L <= 0.2) { ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(LX - 2.6, LY - 34.6, 0.9, 4); }
      ctx.fillStyle = '#20262E'; ctx.beginPath(); ctx.moveTo(LX - 5.6, LY - 36); ctx.lineTo(LX + 5.6, LY - 36); ctx.lineTo(LX + 2, LY - 39.4); ctx.lineTo(LX - 2, LY - 39.4); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#4A5260'; ctx.beginPath(); ctx.arc(LX, LY - 40, 1.2, 0, TAU); ctx.fill();
  }
  function chimney(h) { if (h.st === 2) return; const cx = h.x + h.w * 0.72, cy = h.face === -1 ? h.y + h.h * 0.36 + 6 : h.y + 6; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(cx + 3, cy + 3, 12, 14); ctx.fillStyle = '#6A4A3A'; ctx.fillRect(cx, cy, 12, 14); ctx.fillStyle = '#3A2A22'; ctx.fillRect(cx - 1, cy - 2, 14, 4); }
  function lampSprite(x, y, on) { ctx.save(); ctx.translate(x, y); sprDraw('lamp' + (on ? 1 : 0), -8, -42, 18, 48, () => lampDraw(0, 0, on)); ctx.restore(); }
  function drawAmbientObjects() {
    const L = lightK();
    // Laternen
    for (const l of LAMPS) {
      if (!inView(l.x, l.y, 40)) continue;
      lampSprite(l.x, l.y, L > 0.2); // v157: Laterne als fertiges Bild
    }
    for (const f of FLOODS) { // v73: Flutlichtmasten
      if (!inView(f.x, f.y, 80)) continue; const a = Math.atan2(f.cy - f.y, f.cx - f.x);
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ell(f.x + 3, f.y + 3, 7, 3); ctx.fill(); ctx.fillStyle = '#5E6670'; ctx.fillRect(f.x - 2.5, f.y - 64, 5, 66);
      ctx.save(); ctx.translate(f.x, f.y - 66); ctx.rotate(a); ctx.fillStyle = '#20262E'; ctx.fillRect(-6, -11, 12, 22); ctx.fillStyle = L > 0.2 ? '#FFF6D0' : '#8A93A3'; for (let k = 0; k < 3; k++) ctx.fillRect(1, -9 + k * 7, 4, 5); ctx.restore();
    }
    // Schornsteine mit Rauch
    HOUSES.forEach((h, i) => {
      if (h.st === 2 || !inView(h.x + h.w / 2, h.y, 120)) return; // v72: Schornstein auf dem Dach (Flachdaecher ohne)
      const cx = h.x + h.w * 0.72, cy = h.face === -1 ? h.y + h.h * 0.36 + 6 : h.y + 6;
      // v157: der Schornstein selbst ist im fertigen Hausbild (chimney), hier nur noch der Rauch
      if (i % 2 === 0 && (skyC.a > 0.08 || amb.rain > 0.3)) for (let k = 0; k < 3; k++) { const ph = (gt * 0.22 + k / 3 + i * 0.37) % 1; ctx.fillStyle = 'rgba(200,205,215,' + (0.22 * (1 - ph)) + ')'; ctx.beginPath(); ctx.arc(cx + 6 + Math.sin(gt + i + k) * 4 * ph, cy - 4 - ph * 36, 3 + ph * 6, 0, TAU); ctx.fill(); }
    });
    // Bäume
    { const TC = treeCols(), tk = SEA_TREE.indexOf(TC) + (KR_NEUTRAL ? 'n' : ''); // v136: Baumkrone als fertiges Bild, wiegt sich als Ganzes
    for (let ti = 0; ti < TREES.length; ti++) { const t = TREES[ti];
      if (!inView(t[0], t[1], 60)) continue;
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(t[0] + 6, t[1] + 16, 24, 9); ctx.fill();
      ctx.fillStyle = '#5A3B26'; ctx.fillRect(t[0] - 5, t[1] - 4, 10, 24);
      const sw = Math.sin(gt * 0.9 + t[0]) * 1.2;
      if (bcOff) { treeCrown(t, sw, TC); continue; }
      ctx.save(); ctx.translate(sw, 0); sprDraw('t' + ti + ':' + tk, t[0] - 36, t[1] - 52, 72, 66, () => treeCrown(t, 0, TC)); ctx.restore();
    } }
    // v49: Fahnenmasten am Platz und fallende Blätter
    [1206, 1308].forEach((fx, i) => { // v72: am Eingang zum Stadtpark
      const o = 520; if (!inView(fx, 252 + o, 60)) return;
      ctx.fillStyle = '#9AA6B3'; ctx.fillRect(fx - 1, 214 + o, 2, 40); ctx.fillStyle = '#C9D2DC'; ctx.beginPath(); ctx.arc(fx, 213 + o, 2.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#3B424C'; ctx.fillRect(fx - 4, 252 + o, 8, 3);
      const cl = i ? ['#2E9B4F', '#F4F4F8', '#2E9B4F'] : ['#D33F3F', '#F4F4F8', '#3B82D6'];
      for (let r = 0; r < 3; r++) { ctx.fillStyle = cl[r]; ctx.beginPath(); ctx.moveTo(fx + 1, 217 + o + r * 5); for (let q = 0; q <= 18; q += 3) ctx.lineTo(fx + 1 + q, 217 + o + r * 5 + Math.sin(gt * 3.2 + q * 0.5 + i) * (1 + q * 0.07)); for (let q = 18; q >= 0; q -= 3) ctx.lineTo(fx + 1 + q, 222 + o + r * 5 + Math.sin(gt * 3.2 + q * 0.5 + i) * (1 + q * 0.07)); ctx.closePath(); ctx.fill(); }
    });
    if (L < 0.2 && amb.rain < 0.3) for (const t of TREES) {
      if (!inView(t[0], t[1], 80)) continue;
      for (let k = 0; k < 3; k++) {
        const ph = (gt * 0.11 + k / 3 + t[0] * 0.013) % 1, lx = t[0] - 20 + Math.sin(ph * 9 + k * 2) * 14 + ph * 34, ly = t[1] - 10 + ph * 62;
        ctx.save(); ctx.translate(lx, ly); ctx.rotate(gt * 2 + k); ctx.globalAlpha = 1 - ph * ph; ctx.fillStyle = k % 2 ? '#6FBF5E' : '#D9A441'; ctx.fillRect(-2, -1, 4, 2); ctx.restore();
      }
    }
    // Tauben
    for (const p of amb.pig) {
      if (!inView(p.x, p.y, 30)) continue;
      const fly = p.fl > 0, wob = fly ? Math.sin(gt * 24) * 3 : 0, y = p.y - (fly ? 8 + Math.sin(p.fl * 3) * 3 : 0);
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(p.x, p.y + 3, 5, 2); ctx.fill();
      ctx.save(); ctx.translate(p.x, y); ctx.scale(p.f, 1);
      ctx.fillStyle = '#8A93A3'; ell(0, 0, 5, 3); ctx.fill(); ctx.fillStyle = '#5E6A80'; ctx.beginPath(); ctx.arc(4.5, -2 + (p.mv > 0 ? Math.sin(gt * 12) : 0), 2.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#E0A860'; ctx.fillRect(6.4, -2, 2, 1);
      if (fly) { ctx.fillStyle = '#A9B1BF'; ell(-1, -3 + wob, 4, 2 + Math.abs(wob)); ctx.fill(); }
      ctx.restore();
    }
    // Schmetterlinge tagsüber
    if (L < 0.2 && amb.rain < 0.3) for (let i = 0; i < 6; i++) {
      const b = bushes[(i * 11) % Math.max(1, bushes.length)]; if (!b) continue;
      const x = b.x + Math.sin(gt * 0.5 + i) * 26 + Math.cos(gt * 1.3 + i * 2) * 8, y = b.y - 12 + Math.cos(gt * 0.7 + i * 1.7) * 14;
      if (!inView(x, y, 20)) continue;
      const w = 1 + Math.abs(Math.sin(gt * 14 + i)) * 3; ctx.fillStyle = ['#F6C74A', '#F28BB0', '#9DB8FF'][i % 3]; ell(x - 1.5, y, w, 2.4); ctx.fill(); ell(x + 1.5, y, w, 2.4); ctx.fill();
    }
  }
  function drawSkyFx() {
    if (amb.flock) {
      const f = amb.flock;
      for (let k = 0; k < f.n; k++) {
        const x = f.x - k * 22 + (k % 2) * 8, y = f.y + k * 9 - (k % 2) * 14, fl = Math.sin(gt * 10 + k) * 3;
        ctx.fillStyle = 'rgba(0,0,0,.14)'; ell(x + 18, y + 40, 6, 2); ctx.fill();
        ctx.strokeStyle = 'rgba(20,24,34,.7)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x - 7, y - fl); ctx.lineTo(x, y + 2); ctx.lineTo(x + 7, y - fl); ctx.stroke();
      }
    }
  }
  function newbLights(L, oK) { // v94: Licht der neuen Gebaeude bei Nacht
    if (inView(GYM.x + GYM.w / 2, GYM.y, 200)) { for (const wx of [GYM.x + 39, GYM.x + GYM.w - 39]) glow(wx, GYM.y + 30, 64, '255,233,176', 0.3 * L * oK); glow(GYM_AT.x, GYM.y - 8, 40, '255,220,170', 0.25 * L * oK); }
    if (inView(BANK.x + BANK.w / 2, BANK.y + BANK.h, 200)) { glow(BANK_AT.x, BANK.y + BANK.h + 4, 70, '255,220,150', 0.3 * L * oK); glow(BANK.x + BANK.w - 24, BANK.y + BANK.h - 22, 26, '95,229,132', 0.4 * L * oK); }
    if (inView(PIZZA.x + PIZZA.w / 2, PIZZA.y, 200)) { glow(PIZZA.x + PIZZA.w / 2, PIZZA.y + 61, 60, '255,200,90', 0.4 * L * oK); for (const wx of [PIZZA.x + 28, PIZZA.x + PIZZA.w - 28]) glow(wx, PIZZA.y + 28, 44, '255,190,110', 0.3 * L * oK); glow(PIZZA.x + PIZZA.w - 30, PIZZA.y + 68, 26, '255,120,40', 0.4 * L * oK); }
    if (inView(CLUB.x + CLUB.w / 2, CLUB.y + CLUB.h, 300) && clubOpen()) { const beat = Math.max(0, Math.sin(gt * 8.4)), by = CLUB.y + CLUB.h;
      glow(CLUB.x + 50, by - 30, 80, '255,92,168', (0.45 + 0.25 * beat) * L * oK); glow(CLUB.x + CLUB.w - 34, by - 26, 44, '91,232,255', (0.35 + 0.2 * beat) * L * oK); glow(CLUB_AT.x, by + 12, 50, '255,60,90', 0.3 * L * oK);
      const lx = CLUB.x + CLUB.w / 2, ly = by + 6; for (let k = 0; k < 3; k++) { const a = gt * 0.9 + k * 2.1, col = ['255,92,168', '91,232,255', '255,210,74'][k], an = Math.PI / 2 + Math.cos(a) * 0.9; const gg = ctx.createRadialGradient(lx, ly, 4, lx, ly, 150); gg.addColorStop(0, 'rgba(' + col + ',' + (0.26 * L) + ')'); gg.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(lx, ly); ctx.arc(lx, ly, 150, an - 0.16, an + 0.16); ctx.closePath(); ctx.fill(); } }
    if (inView(4830, 1280, 500)) for (let x = 4506; x < 5196; x += 120) glow(x, 1258, 26, ['255,92,168', '91,232,255', '255,210,74'][Math.floor((x - 4466) / 120) % 3], 0.35 * L * oK);
  }
  function drawLights() {
    const L = lightK(); if (L <= 0.02) return; const oK = 1 - 0.4 * indoorK; // v56: sanfter, drinnen noch zurueckhaltender
    ctx.globalCompositeOperation = 'lighter';
    for (const l of LAMPS) if (inView(l.x, l.y, 140) && !evDark(l.x, l.y) && !vqFlicker(l.x, l.y)) glow(l.x, l.y - 30, 100, '255,206,130', 0.26 * L * oK);
    calLights(L, oK); // v155
    evLights(L, oK); // v166
    vqLights(L, oK); // v168
    gvLights(L, oK); // v79
    if (inView(GV2_P.barrel.x, GV2_P.barrel.y, 200)) glow(GV2_P.barrel.x, GV2_P.barrel.y - 4, 90 + 8 * Math.sin(gt * 9), '255,140,60', (0.42 + 0.08 * Math.sin(gt * 13)) * L * oK); // v109: Westhof
    if (inView(3910, 2490, 460)) for (let k = 0; k < 8; k++) { const t = (k + .5) / 8; glow(GV2.x + 10 + t * (GV2.w - 20), 2486 + 7 * 4 * t * (1 - t) * .5, 24, ['255,92,122', '255,210,74', '120,200,255', '180,120,255'][k % 4], .3 * L * oK); }
    newbLights(L, oK); // v94
    for (const f of FLOODS) if (inView(f.cx, f.cy, 400)) { glow(f.x + (f.cx - f.x) * 0.3, f.y + (f.cy - f.y) * 0.3, 210, '235,245,255', 0.2 * L * oK); glow(f.x, f.y - 66, 30, '255,255,240', 0.4 * L * oK); } // Flutlicht
    for (const it of WORLD.items) if (it.t === 'lamp' && inView(it.x, it.y, 140)) glow(it.x, it.y - 30, 100, '255,206,130', 0.26 * L * oK);
    HOUSES.forEach((h, hi) => {
      if (!inView(h.x + h.w / 2, h.y + h.h / 2, 160)) return;
      houseWins(h).forEach(([wx, wy], j) => {
        if (!winLit(hi, j) || evDark(wx, wy)) return;
        const tv = (hi + j) % 4 === 0, fl = tv ? 0.7 + Math.sin(gt * 7 + hi) * 0.15 : 1;
        glow(wx, wy, 40, tv ? '120,170,255' : '255,200,110', 0.3 * L * fl * oK);
      });
    });
    glow(FOUNTAIN.x, FOUNTAIN.y, 76, '110,190,255', 0.17 * L * oK);
    if (inView(KIOSK.x + 33, KIOSK.y + 24, 140)) glow(KIOSK.x + 33, KIOSK.y + 26, 64, '255,206,120', 0.28 * L * oK);
    if (inView(AH_LOT.x + AH_LOT.w / 2, AH_LOT.y + AH_LOT.h / 2, 420)) { glow(AH_LOT.x + AH_LOT.w - 40, AH_LOT.y + AH_LOT.h - 110, 70, '255,170,80', 0.3 * L * oK); glow(AH_LOT.x + 470, AH_LOT.y + 90, 90, '255,240,200', 0.2 * L * oK); glow(AUTOHOF.x + AUTOHOF.w / 2, AUTOHOF.y + AUTOHOF.h - 20, 130, '255,226,160', 0.22 * L * oK); }
    if (inView(STALL.x + 38, STALL.y, 140)) for (let i = 0; i < 5; i++) glow(STALL.x - 4 + i * (STALL.w + 8) / 4, STALL.y + 5, 24, '255,226,150', (0.24 + 0.07 * Math.sin(gt * 3 + i)) * L * oK);
    if (state === 'play' && indoorK < 0.5) glow(player.x, player.y, 80, '255,236,200', 0.08 * L);
    const beam = (x, y, a) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a); const g = ctx.createRadialGradient(8, 0, 2, 8, 0, 120); g.addColorStop(0, 'rgba(255,240,190,' + 0.34 * L + ')'); g.addColorStop(0.6, 'rgba(255,240,190,' + 0.12 * L + ')'); g.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(8, 0); ctx.arc(8, 0, 120, -0.38, 0.38); ctx.closePath(); ctx.fill(); ctx.restore(); };
    if (riding() && G.veh.eq === 'ebike') beam(player.x, player.y - 2, player.ang);
    for (const f of Object.values(mp.friends)) if (f.vis && f.vh === 'ebike') beam(f.x, f.y - 2, f.ang);
    for (const c of traffic.concat(cars)) if (inView(c.x, c.y, 120)) glow(c.h === 0 ? c.x : c.x + c.dir * 44, c.h === 0 ? c.y + c.dir * 44 : c.y, 56, '255,240,200', 0.2 * L * oK);
    if (L > 0.25) for (let i = 0; i < 16; i++) {
      const b = bushes[(i * 5) % Math.max(1, bushes.length)]; if (!b) continue;
      const x = b.x + Math.sin(gt * 0.6 + i * 1.7) * 22, y = b.y + Math.cos(gt * 0.8 + i * 2.3) * 15;
      if (inView(x, y, 20)) glow(x, y, 7, '210,255,120', (0.35 + 0.35 * Math.sin(gt * 2 + i)) * L);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  function drawRain() {
    const r = amb.rain; if (r < 0.02) return;
    ctx.fillStyle = 'rgba(28,40,62,' + 0.16 * r + ')'; ctx.fillRect(0, 0, W, H); if (LOFX) return; // v128: nur etwas dunkler, keine Tropfen
    ctx.strokeStyle = 'rgba(190,210,235,' + 0.35 * r + ')'; ctx.lineWidth = 1.1; ctx.beginPath();
    for (let i = 0; i < 90; i++) { const x = (i * 97.3 + gt * 70) % (W + 40) - 20, y = (i * 53.9 + gt * 520 + (i % 7) * 40) % (H + 40) - 20; ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 12); }
    ctx.stroke();
  }
  // v70: Enten schwimmen, fliegen ueber Bruecken und watscheln ab und zu auf den Uferweg und wieder zurueck
  const ducks = [0, 1, 2].map(i => ({ x: 300 + i * 1500, lane: i, dir: i % 2 ? -1 : 1, mode: 'swim', t: 0, h: 0, oy: 0, cd: 6 + i * 9, fb: null }));
  const brAt = x => ALLB.find(b => x > b.x0 - 14 && x < b.x1 + 14);
  function duckUpdate(dt) {
    const r = RIVER;
    for (const d of ducks) {
      const baseY = r.y0 + 14 + d.lane * 9;
      if (d.mode === 'swim') {
        d.x += d.dir * 9 * dt; d.cd -= dt; d.oy = 0; d.h = 0;
        const ahead = brAt(d.x + d.dir * 14);
        if (ahead) { d.mode = 'fly'; d.t = 0; d.fb = ahead; }
        else if (d.cd <= 0 && !brAt(d.x + d.dir * 90)) { d.cd = 20 + Math.random() * 25; d.mode = 'out'; d.t = 0; }
      } else if (d.mode === 'fly') {
        d.t += dt; d.x += d.dir * 55 * dt; const b = d.fb, span = (b.x1 - b.x0) + 60, pr = clamp((d.dir > 0 ? d.x - (b.x0 - 30) : (b.x1 + 30) - d.x) / span, 0, 1);
        d.h = Math.sin(pr * Math.PI) * 26 + 3; if (pr >= 1 || d.t > 5) { d.mode = 'swim'; d.h = 0; }
      } else { // an Land
        d.t += dt; const tgt = (r.y1 - baseY) + 14;
        if (d.t < 1.2) d.oy = tgt * d.t / 1.2;
        else if (d.t < 6) { d.oy = tgt; d.x += d.dir * 11 * dt; if (brAt(d.x + d.dir * 24)) d.t = 6; }
        else if (d.t < 7.2) d.oy = tgt * (1 - (d.t - 6) / 1.2);
        else { d.mode = 'swim'; d.oy = 0; }
      }
      if (d.x > r.x1 + 40) d.x = -40; if (d.x < -40) d.x = r.x1 + 40;
    }
  }
  function drawDucks() {
    const r = RIVER; if (viewY1 < r.y0 - 40) return;
    for (const d of ducks) {
      const fly = d.mode === 'fly', land = d.mode === 'out' && d.oy > 12, y0 = r.y0 + 14 + d.lane * 9 + (d.mode === 'swim' ? Math.sin(gt * 1.1 + d.lane) * 2 : 0) + d.oy, x = d.x;
      if (!inView(x, y0, 40)) continue;
      if (fly) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(x, y0 + 3, 7, 2); ctx.fill(); }
      ctx.save(); ctx.translate(x, y0 - d.h); ctx.scale(d.dir, 1);
      if (!fly && !land) { ctx.fillStyle = 'rgba(255,255,255,.2)'; ell(0, 3, 9, 2); ctx.fill(); }
      if (land) { const w = Math.sin(gt * 12) * 1.5; ctx.fillStyle = '#E8A83C'; ctx.fillRect(-2 + w, 3, 1.6, 3); ctx.fillRect(1 - w, 3, 1.6, 3); ctx.rotate(Math.sin(gt * 12) * 0.08); }
      ctx.fillStyle = '#E8DCC0'; ell(0, 0, 7, 4); ctx.fill();
      if (fly) { const f = Math.sin(gt * 20) * 6; ctx.fillStyle = '#6B5A3E'; ctx.beginPath(); ctx.moveTo(-3, -1); ctx.lineTo(2, -1); ctx.lineTo(-1, -2 - f); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-3, 1); ctx.lineTo(2, 1); ctx.lineTo(-1, 2 + f); ctx.closePath(); ctx.fill(); }
      else { ctx.fillStyle = '#6B5A3E'; ell(-2, -1, 4, 2.4); ctx.fill(); }
      ctx.fillStyle = '#2F6B4A'; ctx.beginPath(); ctx.arc(6, -4, 3, 0, TAU); ctx.fill(); ctx.fillStyle = '#E8A83C'; ctx.fillRect(8.4, -4.4, 3, 1.6);
      ctx.restore();
    }
    ctx.fillStyle = '#3F8A58'; for (let x = Math.ceil(Math.max(r.x0, viewX0) / 70) * 70; x < Math.min(r.x1, viewX1); x += 70) { if (ALLB.some(b => x + 14 > b.x0 - 9 && x + 14 < b.x1 + 9) || (x + 14 > PIER.x0 - 24 && x + 14 < PIER.boat.x + 56)) continue; ell(x + 14, r.y0 + 24 + (x % 3) * 3, 7, 3); ctx.fill(); }
  }

  // v127: Verdacht als Polizeilicht am Bildschirmrand: blau und rot im Wechsel, mit steigendem Verdacht heller, schneller und dichter
  let copLt = 0, copPh = 0, copBust = -99;
  function drawCopLights() {
    const bt = gt - copBust; if (bt >= 0 && bt < 1.8) { // erwischt: der ganze Bildschirm blinkt blau-rot (die Anzeigen bleiben darueber)
      const on = LOFX ? 1 : Math.floor(bt * 8) % 2, f = bt < 1.2 ? 1 : 1 - (bt - 1.2) / 0.6; ctx.save(); if (LOFX) { ctx.fillStyle = 'rgba(120,60,200,' + (0.35 * f).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); ctx.restore(); return; } ctx.fillStyle = on ? 'rgba(255,30,50,' + (0.55 * f).toFixed(3) + ')' : 'rgba(30,90,255,' + (0.55 * f).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); ctx.restore(); return; }
    const k = clamp(sus, 0, 1); copLt += ((k > 0.02 ? 1 : 0) - copLt) * fk(0.1); if (copLt < 0.01 && k < 0.02) return;
    if (LOFX) { // v128: ruhige Variante ohne Blinken: links blau, rechts rot, wird mit dem Verdacht breiter
      const a0 = (0.12 + 0.3 * k) * copLt, th0 = Math.min(W, H) * (0.08 + 0.4 * Math.pow(k, 1.6)); ctx.save();
      for (const [x0, nx, col] of [[0, 1, '40,110,255'], [W, -1, '255,40,60']]) { const g = ctx.createLinearGradient(x0, 0, x0 + nx * th0, 0); g.addColorStop(0, 'rgba(' + col + ',' + a0.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g; ctx.fillRect(nx > 0 ? 0 : W - th0, 0, th0, H); }
      ctx.restore(); return; }
    copPh += (0.05 + k * 0.35) * fdt * 60 / 6; // Blinktempo
    const side = Math.floor(copPh * (2 + k * 6)) % 2, a = (0.14 + 0.36 * k) * copLt, n = 2 + Math.round(k * 10), th = Math.min(W, H) * (0.08 + 0.5 * Math.pow(k, 1.6)); // wird mit dem Verdacht breiter, bis es fast den ganzen Bildschirm fuellt
    const cols = side ? ['255,40,60', '40,110,255'] : ['40,110,255', '255,40,60'];
    ctx.save(); // normal ueberblenden, damit nichts weiss ausbrennt
    const edge = (x0, y0, x1, y1, nx, ny, col, al) => { const g = ctx.createLinearGradient(x0, y0, x0 + nx * th, y0 + ny * th); g.addColorStop(0, 'rgba(' + col + ',' + al.toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g; ctx.fillRect(Math.min(x0, x1, x0 + nx * th), Math.min(y0, y1, y0 + ny * th), Math.abs(x1 - x0) + Math.abs(nx * th), Math.abs(y1 - y0) + Math.abs(ny * th)); };
    edge(0, 0, 0, H, 1, 0, cols[0], a); edge(W, 0, W, H, -1, 0, cols[1], a); // links und rechts
    edge(0, 0, W, 0, 0, 1, cols[0], a * 0.6); edge(0, H, W, H, 0, -1, cols[1], a * 0.6); // oben und unten schwaecher
    for (let i = 0; i < n; i++) { // einzelne Lichtkegel, die mit dem Verdacht mehr werden
      const t = (i + 0.5) / n, on = (Math.floor(copPh * (3 + k * 8)) + i) % 2, c = on ? '255,40,60' : '40,110,255', r = th * (0.7 + 0.4 * k), al = a * 0.55 * (0.5 + 0.5 * Math.sin(copPh * 9 + i * 1.7));
      for (const [x, y] of [[0, H * t], [W, H * (1 - t)], [W * t, 0], [W * (1 - t), H]]) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + c + ',' + Math.max(0, al).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + c + ',0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
    }
    ctx.restore();
  }
  function render() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    skyC = skyNow();
    const clr = () => { ctx.fillStyle = '#10151C'; ctx.fillRect(0, 0, W, H); }; // v154: im Spiel deckt die Welt den ganzen Bildschirm ab, dort entfällt das Löschen
    if (!G) { clr(); return; }
    if (state === 'admin') { // v59: Karten-Editor
      clr();
      const pt = isPort(), left = pt ? W : Math.max(200, W - EDW), top = pt ? Math.round(H * 0.6) : H, fit = Math.min(left / WW, top / WH);
      if (!adm.sc) adm.sc = top / 420; adm.sc = clamp(adm.sc, fit, top / 110);
      const hw = left / 2 / adm.sc, hh = top / 2 / adm.sc;
      adm.cx = WW <= hw * 2 ? WW / 2 : clamp(adm.cx, hw, WW - hw); adm.cy = WH <= hh * 2 ? WH / 2 : clamp(adm.cy, hh, WH - hh);
      adm.ox = left / 2; adm.oy = top / 2;
      viewX0 = adm.cx - hw - 80; viewX1 = adm.cx + hw + 80; viewY0 = adm.cy - hh - 80; viewY1 = adm.cy + hh + 80;
      ctx.setTransform(DPR * adm.sc, 0, 0, DPR * adm.sc, DPR * (adm.ox - adm.cx * adm.sc), DPR * (adm.oy - adm.cy * adm.sc));
      drawWorld(); drawAdmOverlay();
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      return;
    }
    if (state === 'edit') { clr();
      const I = edAr().IN, pt = isPort(), left = pt ? W : Math.max(200, W - EDW), top = pt ? Math.round(H * 0.6) : H, es = Math.min(left / (I.x1 - I.x0 + 28), (top - 8) / (I.y1 - I.y0 + 28)) * ed.zoom; // v59: Zoom
      viewX0 = I.x0 - 300; viewX1 = I.x1 + 300; viewY0 = I.y0 - 300; viewY1 = I.y1 + 300; // v72
      ev.sc = es; ev.cx = (I.x0 + I.x1) / 2 + ed.px; ev.cy = (I.y0 + I.y1) / 2 + ed.py; ev.ox = left / 2; ev.oy = top / 2;
      ctx.setTransform(DPR * es, 0, 0, DPR * es, DPR * (ev.ox - ev.cx * es), DPR * (ev.oy - ev.cy * es));
      drawWorld(); drawEditOverlay();
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      return;
    }
    const port = isPort(), sc = (port ? W / 340 : H / 330) * (state === 'menu' ? 0.62 : 1) * (STU.on ? STU.zoom : 1); // v173: Studio-Zoom
    const vw = W / sc, vh = H / sc;
    const mfa = gt * 0.016, menuFly = state === 'menu'; // v112: im Startmenue fliegt die Kamera langsam ueber die Stadt
    const tx = STU.on && STU.cam && state === 'play' ? STU.cam.x : state === 'play' ? player.x : menuFly ? 2550 + Math.cos(mfa) * 1500 : DOOR.x, ty = (STU.on && STU.cam && state === 'play' ? STU.cam.y : state === 'play' ? player.y : menuFly ? 780 + Math.sin(mfa) * 1150 : DOOR.y) + (port ? vh * 0.1 : 0);
    viewX0 = cam.x - vw / 2 - 80; viewX1 = cam.x + vw / 2 + 80; viewY0 = cam.y - vh / 2 - 80; viewY1 = cam.y + vh / 2 + 80;
    { const cx = clamp(tx, XMIN + vw / 2, WW - vw / 2); if (Math.abs(cx - cam.x) > 900) cam.x = cx; else cam.x += (cx - cam.x) * fk(0.15); } // v72: Freundes-Keller getrennt von der Stadt
    { const pad = state === 'play' ? vh * (port ? 0.3 : 0.2) : 0; cam.y += (clamp(ty, YMIN + vh / 2 - pad, WH - vh / 2 + pad) - cam.y) * fk(0.15); } // v110: am Kartenrand etwas weiter schauen, damit die Figur nicht unter der Anzeige verschwindet
    if (troll.shake > gt && !LOFX) { cam.x += (Math.random() - 0.5) * 14; cam.y += (Math.random() - 0.5) * 14; }
    if (r3On()) { clr(); r3Frame(); return; } // v90: 3D-Ansicht
    if (state !== 'play') clr(); // v158: im Startmenü wie früher vorher löschen
    ctx.setTransform(DPR * sc, 0, 0, DPR * sc, DPR * (W / 2 - cam.x * sc), DPR * (H / 2 - cam.y * sc));
    drawWorld();
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    // v56: Nacht draussen dunkel, der Raum, in dem du stehst, bleibt warm beleuchtet
    { const rk = state === 'play' ? AREA_KEYS.find(k => { const I = AREAS[k].IN; return player.x > I.x0 && player.x < I.x1 && player.y > I.y0 && player.y < I.y1; }) : null; if (rk) lastRoom = AREAS[rk].IN; indoorK += ((rk ? 1 : 0) - indoorK) * fk(0.08); }
    const room = lastRoom && indoorK > 0.01 ? { x: (lastRoom.x0 - cam.x) * sc + W / 2, y: (lastRoom.y0 - cam.y) * sc + H / 2, w: (lastRoom.x1 - lastRoom.x0) * sc, h: (lastRoom.y1 - lastRoom.y0) * sc } : null;
    if (skyC.a > 0.004) {
      const sky = 'rgba(' + skyC.r + ',' + skyC.g + ',' + skyC.b + ',';
      if (room) { ctx.fillStyle = sky + skyC.a + ')'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(room.x, room.y, room.w, room.h); ctx.fill('evenodd'); ctx.fillStyle = sky + (skyC.a * (1 - 0.85 * indoorK)) + ')'; ctx.fillRect(room.x, room.y, room.w, room.h); }
      else if (seaTint) { const T0 = seaTint, t = T0[3], s0 = skyC.a, A = 1 - (1 - t) * (1 - s0), mix = (c, d) => Math.round((c * t * (1 - s0) + d * s0) / A); ctx.fillStyle = 'rgba(' + mix(T0[0], skyC.r) + ',' + mix(T0[1], skyC.g) + ',' + mix(T0[2], skyC.b) + ',' + A.toFixed(4) + ')'; ctx.fillRect(0, 0, W, H); } // v157: Jahreszeiten-Färbung und Abdunklung in einem Durchgang
      else { ctx.fillStyle = sky + skyC.a + ')'; ctx.fillRect(0, 0, W, H); }
    }
    if (GFX_FX && state !== 'edit') { // v98: Farbgrading: goldene Stunde, blaue Stunde, kuehle Nacht, sanfter Lichtschein von oben
      const tm = G ? G.time / 60 : 12, gold = Math.max(0, 1 - Math.abs(tm - 7.2) / 1.6) + Math.max(0, 1 - Math.abs(tm - 18.6) / 1.8), blue = Math.max(0, 1 - Math.abs(tm - 20.3) / 1.2) + Math.max(0, 1 - Math.abs(tm - 5.6) / 0.9), out = 1 - 0.7 * (indoorK || 0);
      ctx.save(); ctx.globalCompositeOperation = 'soft-light';
      if (gold > 0.01) { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(255,170,80,' + (0.38 * Math.min(1, gold) * out).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,110,90,' + (0.22 * Math.min(1, gold) * out).toFixed(3) + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
      if (blue > 0.01) { ctx.fillStyle = 'rgba(90,120,255,' + (0.4 * Math.min(1, blue) * out).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
      if (0.28 * (1 - lightK()) >= 0.0005) { const g = ctx.createRadialGradient(W * 0.3, -H * 0.2, 0, W * 0.3, -H * 0.2, Math.hypot(W, H)); g.addColorStop(0, 'rgba(255,248,225,' + (0.28 * (1 - lightK())).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,248,225,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); } // v157: nachts unsichtbar, dann gar nicht zeichnen
      ctx.restore();
    }
    if (lightK() > 0.02) {
      ctx.save(); if (room) { ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(room.x, room.y, room.w, room.h); ctx.clip('evenodd'); }
      ctx.setTransform(DPR * sc, 0, 0, DPR * sc, DPR * (W / 2 - cam.x * sc), DPR * (H / 2 - cam.y * sc)); if (!inOwnRoom()) drawLights(); ctx.restore(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); // v160: keine Strassenlichter um Hinterzimmer und HQ
      if (room) { // warme Deckenlampen im Raum
        ctx.setTransform(DPR * sc, 0, 0, DPR * sc, DPR * (W / 2 - cam.x * sc), DPR * (H / 2 - cam.y * sc)); ctx.globalCompositeOperation = 'lighter';
        const I = lastRoom, w = I.x1 - I.x0, h = I.y1 - I.y0, a = 0.1 * lightK() * indoorK;
        for (let k = 0; k < 3; k++) glow(I.x0 + w * (k + 0.5) / 3, I.y0 + h * 0.45, Math.max(w, h) * 0.38, '255,214,160', a);
        ctx.globalCompositeOperation = 'source-over'; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      }
    }
    { ctx.save(); if (room) { ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(room.x, room.y, room.w, room.h); ctx.clip('evenodd'); } if (!inOwnRoom()) drawRain(); ctx.restore(); } evScreen(); // v59: kein Regen in Raeumen
    if (state === 'play' || state === 'menu') calDrawSky(); // v155: Feuerwerk, Herzen, Konfetti
    if (state === 'play') drawVignette(); // v94
    if (state === 'play') drawCopLights(); // v127: Polizeilicht statt Balken
    if (busRide) drawBusFade(); // v104
    drawJoystick();
  }

  // ---------- v90: 3D-Darstellung (Beta). Die Spiellogik bleibt hier, kg3d.js zeichnet nur. 2D bleibt das Sicherheitsnetz. ----------
  let r3 = null, r3Want = store.get('kellergruen.r3', '0') === '1', r3Q = store.get('kellergruen.r3q', 'mid'), r3Load = false, r3Err = '', r3Cv = null, r3Last = 0;
  const hexRgb3 = h => { const n = parseInt(String(h || '#50a060').slice(1), 16); return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }; };
  const KG3D_API = {
    get G() { return G; }, player, cops, cars, traffic, WW, WH, YMIN, SW, RD, GROUNDS, RIVER, UFER_N, UFER_S, ALLB, HOUSES, TREES, bushes, LAMPS, colliders, APO, CAS, SKIN_COLS, HAIR_COLS, COP_LOOK, FG, FG_BEDS, FOUNTAIN, POND, inputEl: cv,
    COSTUME, BATS, dHalf, KIOSK, STALL, BENCHES, SKATE, HALFPIPE, BOWL, FUNBOX, GRAFF,
    skaters: () => player.fl ? [] : SKATERS.map((s, i) => { const p = skaterPos(s); return { id: 'sk' + i, k: s.k, x: p.x, y: p.y, ang: p.a, up: p.up || 0, look: s.look }; }), rain: () => amb.rain, season: () => KR_NEUTRAL || !G ? -1 : seasonI(), // v92
    view() { const port = isPort(), sc = port ? W / 340 : H / 330; return { x: cam.x, y: cam.y, vw: W / sc, vh: H / sc }; }, // v91: feste Kamera wie 2D
    decItems: k => (G && G.dec && G.dec.items[k]) || [],
    extras() { // v91: Spieler-Extras fuer 3D (Waffe, Fahrzeug, Orbits, Spur, Haustiere)
      const L = KG3D_API._lp || (KG3D_API._lp = { x: player.x, y: player.y, t: gt, m: false });
      if (gt !== L.t) { L.m = Math.hypot(player.x - L.x, player.y - L.y) > 0.25; L.x = player.x; L.y = player.y; L.t = gt; }
      const sw = player.sw ? player.sw.t / 0.3 : -1;
      return { moving: L.m, wpn: G.wpn && G.wpn.eq && G.wpn.eq !== 'none' && !inCar() ? G.wpn.eq : null, inHand: weaponInHand(), swing: sw,
        bike: riding() && !inCar() && !VEH_BY[G.veh.eq].car ? G.veh.eq : null, orbits: inCar() ? [] : orbitList(), trail: G.cos.trail && G.cos.trail !== 'none' && !inCar() ? G.cos.trail : null,
        pets: player.fl === 2 && prVisit ? [] : activePets().map((id, n) => ({ id, n, x: pets[n].x, y: pets[n].y, face: pets[n].face, moving: pets[n].moving })) };
    },
    gt: () => gt, joyId: () => joy.id, inBuilding, inCasino, inCar: () => inCar(), sky: () => skyNow(),
    myCarCol: () => { const id = selCar(); return CAR_COLS[id ? carColI(id) : 0]; },
    interiorRects: () => AREA_KEYS.map(k => AREAS[k].IN).concat([CAS_IN]),
    CAS_IN, CAS_BJ, CAS_SLOTS, CAS_WHEEL, ownColliders() { const s = new Set(); for (const ar of Object.values(AREAS)) { const c = ar.cols || {}; for (const x of [].concat(c.pots || [], c.rack || [], c.table || [], c.stairs || [], c.crate || [], c.desk || [])) if (x) s.add(x); } [DESK_COL, CRATE_COL].forEach(x => x && s.add(x)); return s; },
    areasNow() {
      const list = player.fl === 2 ? [AREAS.pr] : player.fl ? [AREAS[player.fl < 0 ? 'ku' : 'ko']] : AREA_KEYS.map(k => AREAS[k]);
      return list.map(ar => ({ key: ar.key, IN: ar.IN, floor: ar.floor, open: ar.key === 'pr' ? isOpen(ar) && !prVisit : isOpen(ar), RACK: ar.RACK, TABLE: ar.TABLE, POTS: ar.POTS, nOpen: isOpen(ar) ? potsOpen(ar) : 0 }));
    },
    areaSig() { return (player.fl || 0) + '|' + (prVisit || '') + '|' + KG3D_API.areasNow().map(a => a.key + a.open + a.nOpen + JSON.stringify(KG3D_API.decItems(a.key)) + ':' + a.POTS.map(p => (p.x | 0) + ',' + (p.y | 0)).join(';') + (a.RACK ? a.RACK.x + ',' + a.RACK.y : '') + (a.TABLE ? a.TABLE.x + ',' + a.TABLE.y : '')).join('/'); },
    potState(k, i) { const ar = AREAS[k]; if (!ar || !isOpen(ar)) return null; const st = S(ar); return st && st.pots ? st.pots[i] : null; },
    chars() { if (KR_NEUTRAL || !G || player.fl) return []; return CHARS.filter(c => charHere(c)).map(c => { const near = Math.hypot(player.x - c.x, player.y - c.y) < 120; return { id: c.id, x: c.x, y: c.y, ang: near ? Math.atan2(player.y - c.y, player.x - c.x) : Math.PI / 2, step: 0, look: c.look }; }); },
    workers() { return workers.filter(w => (w.ar.isFloor ? w.ar.f : 0) === (player.fl || 0) && player.fl !== 2).map(w => { const c = hexRgb3((ROLES[w.role] || {}).col); return { id: w.id, x: w.x, y: w.y, ang: w.ang, step: w.step, look: Object.assign({}, DEF_LOOK, c, { hair: 1, hs: 0, skin: 1 }) }; }); },
    friends() { return Object.values(mp.friends).filter(f => f.vis && f.look && (player.fl === 4 ? f.rg === myGid().slice(0, 20) + ':h' : player.fl === 2 ? f.rg === (prVisit || mp.id) + ':r' : !(f.rg && f.rg.slice(-2) === ':r'))).map(f => ({ id: f.id, x: f.x, y: f.y, ang: f.ang || 0, step: f.step || 0, look: f.look })); },
    gangMembers() { if (player.fl) return []; const out = []; for (const g of gangs) { if (g.dead) continue; g.ms.forEach((m, i) => { if (!m.gone && m.look) out.push({ id: g.id + '_' + i, x: m.x, y: m.y, ang: m.ang || 0, step: m.step || 0, look: m.look }); }); } gvLooks(); GV_NPC.forEach((n, i) => out.push({ id: 'gv' + i, x: n.x, y: n.y, ang: n.a || Math.PI / 2, step: 0, look: n.look })); return out; },
    customers() { if (player.fl) return []; return G.orders.map(o => { const h = HOUSES[o.house], p = o.mob ? { x: o.x, y: o.y } : { x: h.dx, y: h.face === 1 ? h.dy + 16 : h.dy - 16 }; return { id: 'o' + o.id, x: p.x, y: p.y, ang: o.mob ? 0 : (h.face === 1 ? Math.PI / 2 : -Math.PI / 2), step: 0, look: Object.assign({}, DEF_LOOK, hexRgb3(h.roof), { hair: o.id % 6, hs: o.id % 9, skin: o.id % 5, sex: o.id % 2 ? 'f' : 'm' }) }; }); },
    orderPins() { if (player.fl) return []; return G.orders.map(o => { const p = o.mob ? { x: o.x, y: o.y } : { x: HOUSES[o.house].dx, y: HOUSES[o.house].face === 1 ? HOUSES[o.house].dy + 16 : HOUSES[o.house].dy - 16 }; return { id: o.id, x: p.x, y: p.y, col: o.vip ? '#FFD24A' : (AREAS[o.prod || 'keller'].cust || AREAS[o.prod || 'keller'].bub || '#5FE584') }; }); }
  };
  const r3On = () => !!(r3 && r3Want && state === 'play');
  function r3Start() {
    if (r3 || r3Load) return; r3Load = true; r3Err = '';
    try {
      import('./kg3d.js').then(m => {
        if (!r3Cv) { r3Cv = document.createElement('canvas'); r3Cv.id = 'c3'; r3Cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block'; cv.parentNode.insertBefore(r3Cv, cv); }
        r3 = m.create(KG3D_API, r3Cv, { quality: r3Q }); r3.setActive(r3Want); r3Load = false; if (r3Want) msg('3D-Ansicht aktiv (Beta). Steuerung wie gewohnt');
      }).catch(e => { r3Load = false; r3Err = String((e && e.message) || e); r3Check(); r3Want = false; store.set('kellergruen.r3', '0'); try { msg('3D konnte nicht geladen werden, 2D bleibt aktiv', true); } catch (x) {} if (phoneOpen) renderPhone(); });
    } catch (e) { r3Load = false; r3Err = String(e); r3Want = false; }
  }
  // v91: bei einem Ladefehler pruefen, welche 3D-Datei fehlt, und das in den Einstellungen anzeigen
  function r3Check() {
    if (location.protocol === 'file:') { r3Err = 'Die Datei wurde direkt geöffnet. 3D geht nur über eine Webadresse (z. B. GitHub Pages).'; return; }
    const files = ['kg3d.js', 'kg3d_fig.js', 'kg3d_deco.js', 'kg3d_plants.js', 'three.module.min.js'];
    Promise.all(files.map(f => fetch('./' + f, { cache: 'no-store' }).then(r => r.ok ? null : f).catch(() => f))).then(miss => { miss = miss.filter(Boolean); if (miss.length) r3Err = 'Es fehlt im selben Ordner wie kellergruen.html: ' + miss.join(', '); if (phoneOpen) renderPhone(); });
  }
  function r3Set(on) { r3Want = !!on; store.set('kellergruen.r3', on ? '1' : '0'); if (on) { if (r3) r3.setActive(true); else r3Start(); } else if (r3) r3.setActive(false); }
  function r3SetQ(q) { r3Q = q; store.set('kellergruen.r3q', q); if (r3) { r3.dispose(); r3 = null; if (r3Cv) { r3Cv.remove(); r3Cv = null; } if (r3Want) r3Start(); } }
  function r3Frame() {
    const now = performance.now(), dt = r3Last ? (now - r3Last) / 1000 : 0.016; r3Last = now;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
    r3.render(dt);
    // 2D-Hinweise ueber der 3D-Welt: Namen, Auftraege, Schwebetexte
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lab = (x, y, h, txt, col, bg) => { const p = r3.project(x, y, h); if (!p) return; ctx.font = '800 12px sans-serif'; const w = ctx.measureText(txt).width + 12; ctx.fillStyle = bg || 'rgba(16,21,28,.72)'; rr(p.x - w / 2, p.y - 9, w, 18, 9); ctx.fill(); ctx.fillStyle = col || '#EEF2F7'; ctx.fillText(txt, p.x, p.y + 0.5); };
    if (!player.fl) {
      for (const c of CHARS) { if (KR_NEUTRAL || !charHere(c) || Math.hypot(player.x - c.x, player.y - c.y) > 520) continue; lab(c.x, c.y, 62, (charReady(c) ? '! ' : '') + c.name, charReady(c) ? '#FFD24A' : '#EEF2F7'); }
      for (const o of G.orders) { const p = orderPos(o), h = HOUSES[o.house]; const y = o.mob ? p.y : (h.face === 1 ? p.y + 16 : p.y - 16); if (Math.hypot(player.x - p.x, player.y - y) > 700) continue; lab(p.x, y, 80, (o.vip ? '★ ' : '') + o.qty + ' ' + AREAS[o.prod || 'keller'].lbl.unit, o.vip ? '#FFD24A' : '#8FE3A0'); }
      for (const f of Object.values(mp.friends)) if (f.vis && !(f.rg && f.rg.slice(-2) === ':r')) lab(f.x, f.y, 58, f.name, '#9FD8FF');
    }
    ctx.font = '800 14px sans-serif';
    for (const f of floaters) { const p = r3.project(f.x, f.y, 40 + f.t * 30); if (!p) continue; ctx.globalAlpha = 1 - f.t / 1.3; ctx.fillStyle = f.color; ctx.fillText(f.text, p.x, p.y); }
    ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic';
    drawJoystick();
  }
