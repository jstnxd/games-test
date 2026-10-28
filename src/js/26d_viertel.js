  // =====================================================================================================
  // v168: Jedes Viertel mit eigenem Charakter.
  // Gewerbegebiet: Container-Stapel, Kräne, Paletten, Ölflecken, Gitterzäune. Vergnügungsmeile: Neonschilder,
  // Litfaßsäulen mit Plakaten, Lichterketten. Nordviertel: Pools, Liegen, Formschnitt-Büsche, Rosen, Gartenlaternen,
  // Gartenzwerge. Gangviertel: Graffiti, kaputte Zäune, Müllsäcke, Reifen, Schlaglöcher, brennende Tonnen, flackernde Laternen.
  // Platzierung wie bei den Blumenkübeln: Wege, Türen, Pfade, Straßen und andere Objekte bleiben frei.
  // =====================================================================================================
  let VQ = null;
  const vqZone = (x, y) => { for (const z of ZONES) if (x >= z.x0 && x < z.x1 && y >= z.y0 && y < z.y1) return z.name; return ''; };
  const VQK = { 'Gewerbegebiet': 'gew', 'Vergnügungsmeile': 'verg', 'Nordviertel': 'nord', 'Gangviertel': 'gang' };
  const vqK = (x, y) => VQK[vqZone(x, y)] || '';
  function vqInit() {
    let s = 9137; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, ri = n => Math.floor(rnd() * n);
    const V = { flat: [], obj: [], cranes: [], neon: [], fire: [], col: [] }, taken = [];
    const near = (x, y, d) => taken.some(q => Math.abs(q.x - x) < d + q.r && Math.abs(q.y - y) < d + q.r);
    const blocked = (x, y, mx, my) => colliders.some(c => !c.fl && x + mx > c.x - 6 && x - mx < c.x + c.w + 6 && y + my > c.y - 6 && y - my < c.y + c.h + 6);
    const freeAt = (x, y, mx, my, street) => !(x < 40 || x > WW - 40 || y < YMIN + 40 || y > WH - 40) && !inKeep(x, y, Math.max(mx, my) + 6) && !onPath(x, y) && !blocked(x, y, mx, my)
      && (street || !onStreet(x, y, Math.max(mx, my))) && !LAMPS.some(l => Math.hypot(l.x - x, l.y - y) < 26 + mx) && !BINS.some(b => Math.hypot(b.x - x, b.y - y) < 26 + mx) && !HYDRANTS.some(q => Math.hypot(q[0] - x, q[1] - y) < 24 + mx)
      && !busStops().some(b => Math.abs(b.x + 10 - x) < 70 && Math.abs(b.y - y) < 40) && !TREES.some(t => Math.hypot(t[0] - x, t[1] - y) < 24 + mx) && !(y > UFER_N - 40 && y < UFER_S + 40)
      && !(XTR && (XTR.planters.some(p => Math.hypot(p.x - x, p.y - y) < 30 + mx) || XTR.chalk.some(p => Math.hypot(p.x - x, p.y - y) < 26 + mx)));
    const put = (L, o, r, colR) => { L.push(o); taken.push({ x: o.x, y: o.y, r }); if (colR) V.col.push(colR); };
    // Gehweg-Streifen in einem Viertel (x, y auf der Gehweg-Mitte bzw. am Bordstein)
    const walks = (k, step, fn) => { for (const r of RD) for (const side of [-1, 1]) { const lim = r.h ? [0, WW] : [YMIN, WH];
      for (let t = lim[0] + 60 + rnd() * step; t < lim[1] - 60; t += step * (0.7 + rnd() * 0.6)) { const x = r.h ? t : swLine(r, side), y = r.h ? swLine(r, side) : t; if (vqK(x, y) !== k) continue;
        if (r.h ? RDV.some(v => x > v.c0 - SW - 40 && x < v.c1 + SW + 40) : RDH.some(h => y > h.c0 - SW - 40 && y < h.c1 + SW + 40)) continue; fn(x, y, r, side); } } };
    // --- Gewerbegebiet ---
    walks('gew', 150, (x, y, r, side) => { const q = rnd(), cx = r.h ? x : x + side * 9, cy = r.h ? y + side * 9 : y;
      if (q < 0.45 && freeAt(cx, cy, 10, 8, true) && !near(cx, cy, 30)) put(V.obj, { t: 'pallet', x: cx, y: cy, n: 1 + ri(3) }, 14);
      else if (q < 0.8 && !near(x, y, 24)) put(V.flat, { t: 'oil', x, y: y + (rnd() - 0.5) * 10, s: 0.7 + rnd() * 0.7 }, 8); });
    for (const g of GROUNDS) { if (g.t !== 'lot' || vqK(g.x + g.w / 2, g.y + g.h / 2) !== 'gew') continue;
      for (let x = g.x + 20; x < g.x + g.w - 20; x += 46) if (rnd() < 0.5) { const y = g.y + 6; if (!onStreet(x, y, 0) && !inKeep(x, y, 16) && !near(x, y, 20)) V.flat.push({ t: 'hz', x, y }); } }
    const inGr = (x, y, m) => GROUNDS.some(g => x > g.x - m && x < g.x + g.w + m && y > g.y - m && y < g.y + g.h + m) || [AH_LOT, WS_LOT].some(g => x > g.x - m && x < g.x + g.w + m && y > g.y - m && y < g.y + g.h + m);
    const zoneRects = k => ZONES.filter(z => VQK[z.name] === k);
    const scatter = (k, n, fn) => { const R = zoneRects(k), A = R.reduce((a, z) => a + (z.x1 - z.x0) * (z.y1 - z.y0), 0); for (let i = 0; i < n; i++) { let t = rnd() * A, z = R[0]; for (const q of R) { const a = (q.x1 - q.x0) * (q.y1 - q.y0); if (t < a) { z = q; break; } t -= a; } fn(z.x0 + rnd() * (z.x1 - z.x0), Math.max(YMIN + 50, z.y0) + rnd() * (Math.min(WH - 50, z.y1) - Math.max(YMIN + 50, z.y0))); } };
    const cnt = t => V.obj.filter(o => o.t === t).length + V.flat.filter(o => o.t === t).length;
    scatter('gew', 1400, (x, y) => { if (cnt('cont') >= 10 || onRoadway(x, y) || inGr(x, y, 30)) return; const hor = rnd() < 0.6, mx = hor ? 38 : 16, my = hor ? 16 : 38; if (freeAt(x, y, mx, my) && !near(x, y, 50)) put(V.obj, { t: 'cont', x, y, hor, st: 1 + (rnd() < 0.5 ? 1 : 0), c: ri(5) }, 44, { x: x - mx + 2, y: y - my + 2, w: mx * 2 - 4, h: my * 2 - 4 }); });
    for (let i = 0; i < 600 && V.cranes.length < 2; i++) { const x = 3500 + rnd() * 1650, y = -120 + rnd() * 780; if (vqK(x, y) === 'gew' && !inGr(x, y, 20) && !onRoadway(x, y) && freeAt(x, y, 16, 16) && !near(x, y, 60) && !V.cranes.some(c => Math.abs(c.x - x) < 700)) put(V.cranes, { x, y, a0: rnd() * 6, sp: 0.04 + rnd() * 0.04, L: 200 + rnd() * 60 }, 30, { x: x - 13, y: y - 13, w: 26, h: 26 }); }
    // --- Vergnügungsmeile ---
    const NEON = [['BAR', '#FF4FA3'], ['24/7', '#4FE3FF'], ['KARAOKE', '#C77DFF'], ['PIZZA', '#FFB13B'], ['TATTOO', '#FF5C5C'], ['DISCO', '#5CFF9D'], ['KEBAB', '#FFE14F'], ['HOTEL', '#7DB3FF']];
    walks('verg', 120, (x, y, r, side) => { const q = rnd(), cx = r.h ? x : x + side * 10, cy = r.h ? y + side * 10 : y;
      if (q < 0.4 && freeAt(cx, cy, 9, 9, true) && !near(cx, cy, 40)) put(V.obj, { t: 'litfass', x: cx, y: cy, p: ri(6) }, 16, { x: cx - 8, y: cy - 6, w: 16, h: 12 });
      else if (q < 0.85 && freeAt(cx, cy, 14, 6, true) && !near(cx, cy, 40)) { const n = NEON[ri(NEON.length)]; put(V.neon, { x: cx, y: cy, txt: n[0], c: n[1], ph: rnd() * 6 }, 18); }
      else if (!near(x, y, 30)) put(V.flat, { t: 'poster', x, y, c: ri(6), a: (rnd() - 0.5) * 0.3 }, 10); });
    for (const r of RD) { if (r.h) { for (let x = 4480; x < WW - 60; x += 130) { const cy = (r.c0 + r.c1) / 2; if (vqK(x, cy) === 'verg' && !RDV.some(v => x > v.c0 - SW - 20 && x < v.c1 + SW + 20)) V.flat.push({ t: 'string', x, y0: r.c0 - SW + 2, y1: r.c1 + SW - 2, h: 1 }); } } else { for (let y = 720; y < 1300; y += 130) { const cx = (r.c0 + r.c1) / 2; if (vqK(cx, y) === 'verg' && !RDH.some(h => y > h.c0 - SW - 20 && y < h.c1 + SW + 20)) V.flat.push({ t: 'string', y, x0: r.c0 - SW + 2, x1: r.c1 + SW - 2, h: 0 }); } } }
    // --- Nordviertel ---
    for (const g of GROUNDS) { if (g.t !== 'garden' || vqK(g.x + g.w / 2, g.y + g.h / 2) !== 'nord') continue; const n = Math.round(g.w / 130);
      for (let i = 0; i < n * 6; i++) { const x = g.x + 40 + rnd() * (g.w - 80), y = g.y + 30 + rnd() * (g.h - 60), q = rnd();
        if (q < 0.18) { if (freeAt(x, y, 34, 20) && !near(x, y, 50)) put(V.obj, { t: 'pool', x, y, w: 56 + ri(16), h: 30 + ri(8) }, 52, { x: x - 34, y: y - 20, w: 68, h: 40 }); }
        else if (q < 0.42) { if (freeAt(x, y, 9, 9) && !near(x, y, 26)) put(V.obj, { t: 'topi', x, y, s: 0.8 + rnd() * 0.5, k: ri(2) }, 14, { x: x - 7, y: y - 4, w: 14, h: 8 }); }
        else if (q < 0.62) { if (freeAt(x, y, 14, 6) && !near(x, y, 24)) put(V.flat, { t: 'rose', x, y, c: ri(3) }, 16); }
        else if (q < 0.78) { if (freeAt(x, y, 5, 5) && !near(x, y, 30)) put(V.obj, { t: 'lantern', x, y }, 10); }
        else if (q < 0.88) { if (freeAt(x, y, 4, 4) && !near(x, y, 30)) put(V.obj, { t: 'gnome', x, y, c: ri(3) }, 8); }
        else if (freeAt(x, y, 12, 6) && !near(x, y, 30)) put(V.obj, { t: 'lounger', x, y, c: ri(3) }, 14); } }
    // --- Gangviertel ---
    const GTAG = ['#FF4FA3', '#4FE3FF', '#FFE14F', '#5CFF9D', '#FF7A3B', '#C77DFF', '#FFFFFF'];
    walks('gang', 90, (x, y, r, side) => { const q = rnd(), ox = r.h ? x : x + side * 10, oy = r.h ? y + side * 10 : y;
      if (q < 0.34 && !near(x, y, 30)) put(V.flat, { t: 'tag', x: x + (rnd() - 0.5) * 20, y: y + (rnd() - 0.5) * 10, c: GTAG[ri(GTAG.length)], c2: GTAG[ri(GTAG.length)], k: ri(4), a: (rnd() - 0.5) * 0.6, s: 0.8 + rnd() * 0.6 }, 16);
      else if (q < 0.5 && !near(x, y, 30)) put(V.flat, { t: 'crack', x, y, a: rnd() * 6, s: 0.8 + rnd() * 0.6 }, 12);
      else if (q < 0.68 && freeAt(ox, oy, 8, 6, true) && !near(ox, oy, 30)) put(V.obj, { t: 'trash', x: ox, y: oy, n: 1 + ri(3) }, 12);
      else if (q < 0.8 && freeAt(ox, oy, 9, 9, true) && !near(ox, oy, 36)) put(V.obj, { t: 'tires', x: ox, y: oy, n: 2 + ri(3) }, 14, { x: ox - 8, y: oy - 5, w: 16, h: 10 });
      else if (q < 0.88 && freeAt(ox, oy, 10, 10, true) && !near(ox, oy, 120) && V.fire.length < 4) put(V.fire, { x: ox, y: oy, ph: rnd() * 6 }, 24, { x: ox - 7, y: oy - 5, w: 14, h: 10 }); });
    for (const r of RD) { const lim = r.h ? [0, WW] : [YMIN, WH]; for (let t = lim[0] + 100; t < lim[1] - 100; t += 260 + rnd() * 200) { const x = r.h ? t : (r.c0 + r.c1) / 2 + (rnd() - 0.5) * 60, y = r.h ? (r.c0 + r.c1) / 2 + (rnd() - 0.5) * 60 : t; if (vqK(x, y) === 'gang' && !near(x, y, 40) && !RD.some(o => o !== r && (o.h ? y > o.c0 - SW && y < o.c1 + SW : x > o.c0 - SW && x < o.c1 + SW))) put(V.flat, { t: 'hole', x, y, s: 0.8 + rnd() * 0.6 }, 20); } }
    for (const h of HOUSES) { if (vqK(h.dx, h.dy) !== 'gang') continue; for (const fx of [h.x + 8, h.x + h.w - 34]) { const y = h.face === 1 ? h.y + h.h + 6 : h.y - 6; if (!inKeep(fx + 13, y, 6) && !onPath(fx + 13, y) && !near(fx + 13, y, 20)) put(V.flat, { t: 'wtag', x: fx, y, c: GTAG[ri(GTAG.length)], c2: GTAG[ri(GTAG.length)], k: ri(4) }, 14); } }
    for (const g of GROUNDS) { if (vqK(g.x + g.w / 2, g.y + g.h / 2) !== 'gang') continue; for (let x = g.x + 10; x < g.x + g.w - 30; x += 34) { const y = g.y + 4; if (rnd() < 0.6 && !inKeep(x + 15, y, 14) && !onPath(x + 15, y) && !onStreet(x + 15, y, 0)) V.flat.push({ t: 'fence', x, y, br: rnd() < 0.35 ? 1 + ri(3) : 0 }); } }
    scatter('gang', 1600, (x, y) => { const road = onRoadway(x, y), q = rnd();
      if (q < 0.3) { if (cnt('tag') < 34 && !inKeep(x, y, 10) && !onPath(x, y) && !blocked(x, y, 12, 6) && !near(x, y, 26)) put(V.flat, { t: 'tag', x, y, c: GTAG[ri(GTAG.length)], c2: GTAG[ri(GTAG.length)], k: ri(4), a: (rnd() - 0.5) * 0.6, s: 0.8 + rnd() * 0.6 }, 16); }
      else if (q < 0.45) { if (cnt('crack') < 16 && !inKeep(x, y, 10) && !near(x, y, 24)) put(V.flat, { t: 'crack', x, y, a: rnd() * 6, s: 0.8 + rnd() * 0.6 }, 12); }
      else if (road) return;
      else if (q < 0.65) { if (cnt('trash') < 16 && freeAt(x, y, 8, 6, true) && !inGr(x, y, -10) && !near(x, y, 30)) put(V.obj, { t: 'trash', x, y, n: 1 + ri(3) }, 12); }
      else if (q < 0.8) { if (cnt('tires') < 9 && freeAt(x, y, 9, 9, true) && !inGr(x, y, -10) && !near(x, y, 36)) put(V.obj, { t: 'tires', x, y, n: 2 + ri(3) }, 14, { x: x - 8, y: y - 5, w: 16, h: 10 }); }
      else if (q < 0.86) { if (V.fire.length < 4 && freeAt(x, y, 10, 10, true) && !inGr(x, y, -10) && !V.fire.some(f => Math.hypot(f.x - x, f.y - y) < 260)) put(V.fire, { x, y, ph: rnd() * 6 }, 24, { x: x - 7, y: y - 5, w: 14, h: 10 }); } });
    scatter('verg', 900, (x, y) => { if (onRoadway(x, y)) return; const q = rnd();
      if (q < 0.45) { if (V.neon.length < 12 && freeAt(x, y, 14, 6, true) && !near(x, y, 50)) { const n = NEON[ri(NEON.length)]; put(V.neon, { x, y, txt: n[0], c: n[1], ph: rnd() * 6 }, 18); } }
      else if (q < 0.7) { if (cnt('litfass') < 7 && freeAt(x, y, 9, 9, true) && !inGr(x, y, -10) && !near(x, y, 60)) put(V.obj, { t: 'litfass', x, y, p: ri(6) }, 16, { x: x - 8, y: y - 6, w: 16, h: 12 }); }
      else if (cnt('poster') < 22 && !inKeep(x, y, 8) && !onPath(x, y) && !near(x, y, 30)) put(V.flat, { t: 'poster', x, y, c: ri(6), a: (rnd() - 0.5) * 0.3 }, 10); });
    for (const c of V.col) colliders.push(c);
    VQ = V;
  }
  // ---------- Zeichnen: flach (Bodenkacheln) ----------
  function vqDrawFlat() {
    if (!XTR) extrasInit(); if (!VQ) vqInit(); if (!VQ) return;
    for (const o of VQ.flat) { const x = o.x !== undefined ? o.x : (o.x0 + o.x1) / 2, y = o.y !== undefined ? o.y : (o.y0 + o.y1) / 2; if (!inView(x, y, 90)) continue;
      if (o.t === 'oil') { ctx.fillStyle = 'rgba(20,18,26,.32)'; ctx.beginPath(); ctx.ellipse(o.x, o.y, 11 * o.s, 6 * o.s, 0.3, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(120,90,200,.12)'; ctx.beginPath(); ctx.ellipse(o.x - 2, o.y - 1, 5 * o.s, 2.6 * o.s, 0.3, 0, TAU); ctx.fill(); }
      else if (o.t === 'hz') { for (let i = 0; i < 4; i++) { ctx.fillStyle = i % 2 ? '#1D2129' : '#E8B23A'; ctx.save(); ctx.translate(o.x + i * 8, o.y); ctx.transform(1, 0, -0.5, 1, 0, 0); ctx.fillRect(0, -2, 8, 4); ctx.restore(); } }
      else if (o.t === 'poster') { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-6, -7, 13, 15); ctx.fillStyle = ['#FF4FA3', '#4FE3FF', '#FFE14F', '#C77DFF', '#FF7A3B', '#5CFF9D'][o.c]; ctx.fillRect(-7, -8, 13, 15); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(-5, -6, 9, 2); ctx.fillRect(-5, -2, 6, 1.4); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(-1, 3, 2.4, 0, TAU); ctx.fill(); ctx.restore(); }
      else if (o.t === 'string') { ctx.strokeStyle = 'rgba(30,30,40,.55)'; ctx.lineWidth = 0.8; ctx.beginPath(); if (o.h) { ctx.moveTo(o.x, o.y0); ctx.quadraticCurveTo(o.x + 12, (o.y0 + o.y1) / 2, o.x, o.y1); } else { ctx.moveTo(o.x0, o.y); ctx.quadraticCurveTo((o.x0 + o.x1) / 2, o.y + 12, o.x1, o.y); } ctx.stroke(); }
      else if (o.t === 'rose') { ctx.fillStyle = '#3E7A3A'; rr(o.x - 14, o.y - 4, 28, 9, 4); ctx.fill(); const C = [['#E8364F', '#FF7A8A'], ['#FFFFFF', '#FFD6E0'], ['#FFB13B', '#FFE08A']][o.c]; for (let i = 0; i < 7; i++) { ctx.fillStyle = C[i % 2]; ctx.beginPath(); ctx.arc(o.x - 11 + i * 3.7, o.y - 1 + (i % 2) * 2.5, 2.1, 0, TAU); ctx.fill(); } }
      else if (o.t === 'tag' || o.t === 'wtag') { ctx.save(); ctx.translate(o.x + (o.t === 'wtag' ? 13 : 0), o.y); if (o.a) ctx.rotate(o.a); ctx.scale(o.s || 1, o.s || 1); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = o.c2; ctx.lineWidth = 3.4; ctx.globalAlpha = 0.55; vqTagPath(o.k); ctx.stroke(); ctx.globalAlpha = 0.9; ctx.strokeStyle = o.c; ctx.lineWidth = 1.8; vqTagPath(o.k); ctx.stroke(); ctx.globalAlpha = 1; ctx.restore(); }
      else if (o.t === 'crack') { ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a); ctx.scale(o.s, o.s); ctx.strokeStyle = 'rgba(10,10,14,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(-6, 2); ctx.lineTo(0, -1); ctx.lineTo(7, 3); ctx.lineTo(14, 1); ctx.moveTo(0, -1); ctx.lineTo(3, -7); ctx.moveTo(-6, 2); ctx.lineTo(-8, 7); ctx.stroke(); ctx.restore(); }
      else if (o.t === 'hole') { ctx.fillStyle = 'rgba(12,12,16,.5)'; ctx.beginPath(); ctx.ellipse(o.x, o.y, 9 * o.s, 5 * o.s, 0.2, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(90,120,150,.28)'; ctx.beginPath(); ctx.ellipse(o.x + 1, o.y + 1, 5 * o.s, 2.5 * o.s, 0.2, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.4)'; ctx.lineWidth = 0.8; ctx.stroke(); }
      else if (o.t === 'fence') { ctx.strokeStyle = '#8A949E'; ctx.lineWidth = 1.4; for (const px of [o.x, o.x + 30]) { ctx.beginPath(); ctx.moveTo(px, o.y + 2); ctx.lineTo(px, o.y - 13); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(160,170,180,.7)'; ctx.lineWidth = 0.6; ctx.beginPath(); for (let k = 0; k < 6; k++) { if (o.br && k >= o.br && k < o.br + 2) continue; ctx.moveTo(o.x + k * 5, o.y - 12); ctx.lineTo(o.x + k * 5 + 5, o.y + 1); ctx.moveTo(o.x + k * 5 + 5, o.y - 12); ctx.lineTo(o.x + k * 5, o.y + 1); } ctx.stroke();
        if (o.br) { ctx.strokeStyle = '#8A949E'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(o.x + o.br * 5, o.y - 12); ctx.quadraticCurveTo(o.x + o.br * 5 + 3, o.y - 4, o.x + o.br * 5 - 2, o.y + 1); ctx.stroke(); } }
    }
  }
  function vqTagPath(k) { ctx.beginPath(); if (k === 0) { ctx.moveTo(-12, 3); ctx.bezierCurveTo(-10, -8, -4, -8, -5, 2); ctx.bezierCurveTo(-4, 6, 2, -9, 3, 1); ctx.lineTo(8, -6); ctx.lineTo(9, 4); ctx.lineTo(13, -3); }
    else if (k === 1) { ctx.moveTo(-11, -5); ctx.lineTo(-11, 5); ctx.moveTo(-11, 0); ctx.bezierCurveTo(-6, -6, -3, 4, 0, -3); ctx.moveTo(2, 4); ctx.bezierCurveTo(4, -8, 9, -8, 10, 0); ctx.bezierCurveTo(11, 6, 5, 6, 6, 0); }
    else if (k === 2) { ctx.moveTo(-12, 0); ctx.bezierCurveTo(-8, -9, -2, 9, 2, 0); ctx.bezierCurveTo(6, -9, 10, 7, 13, -2); ctx.moveTo(-6, 6); ctx.lineTo(8, 6); }
    else { ctx.arc(-4, 0, 5, 0.4, TAU - 0.4); ctx.moveTo(4, -5); ctx.lineTo(4, 5); ctx.lineTo(11, 5); ctx.moveTo(4, 0); ctx.lineTo(9, 0); } }
  // ---------- Zeichnen: Objekte (jedes Bild, unter den Figuren) ----------
  function vqDrawObj() {
    if (!VQ || inOwnRoom()) return; const L = lightK();
    for (const o of VQ.obj) { if (!inView(o.x, o.y, 80)) continue;
      if (o.t === 'cont') vqCont(o);
      else if (o.t === 'pallet') { for (let i = 0; i < o.n; i++) { const y = o.y - i * 3.2; ctx.fillStyle = 'rgba(0,0,0,.2)'; if (!i) ctx.fillRect(o.x - 10, o.y + 3, 22, 3); ctx.fillStyle = '#B98A55'; ctx.fillRect(o.x - 10, y - 4, 20, 6); ctx.fillStyle = '#8E6537'; for (let k = 0; k < 3; k++) ctx.fillRect(o.x - 10 + k * 8.5, y + 1, 3, 2); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(o.x - 10, y - 4, 20, 1); } }
      else if (o.t === 'litfass') { ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(o.x + 2, o.y + 4, 10, 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#2E5A3E'; ctx.fillRect(o.x - 8, o.y - 30, 16, 32);
        const P = ['#FF4FA3', '#4FE3FF', '#FFE14F', '#C77DFF', '#FF7A3B', '#5CFF9D']; for (let i = 0; i < 3; i++) { ctx.fillStyle = P[(o.p + i) % 6]; ctx.fillRect(o.x - 7 + i * 5, o.y - 26, 5, 22); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(o.x - 6 + i * 5, o.y - 23, 3, 1.5); }
        ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(o.x + 3, o.y - 30, 5, 32); ctx.fillStyle = '#244A32'; ctx.beginPath(); ctx.ellipse(o.x, o.y - 30, 9.5, 3.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#3A7A52'; ctx.beginPath(); ctx.ellipse(o.x, o.y - 32, 6, 2.5, 0, 0, TAU); ctx.fill(); }
      else if (o.t === 'pool') { const w = o.w, h = o.h; ctx.fillStyle = '#E8E2D6'; rr(o.x - w / 2 - 4, o.y - h / 2 - 4, w + 8, h + 8, 5); ctx.fill(); const g = ctx.createLinearGradient(0, o.y - h / 2, 0, o.y + h / 2); g.addColorStop(0, '#3FB8E8'); g.addColorStop(1, '#1E7FC4'); ctx.fillStyle = g; rr(o.x - w / 2, o.y - h / 2, w, h, 3); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 0.8; for (let i = 0; i < 3; i++) { ctx.beginPath(); const yy = o.y - h / 4 + i * h / 4; for (let x = o.x - w / 2 + 4; x < o.x + w / 2 - 4; x += 4) ctx.lineTo(x, yy + Math.sin(x * 0.3 + gt * 2 + i) * 1.1); ctx.stroke(); }
        ctx.strokeStyle = '#C9D2DC'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(o.x + w / 2 - 6, o.y - h / 2 - 3); ctx.lineTo(o.x + w / 2 - 6, o.y - h / 2 + 6); ctx.moveTo(o.x + w / 2 - 11, o.y - h / 2 - 3); ctx.lineTo(o.x + w / 2 - 11, o.y - h / 2 + 6); ctx.stroke(); }
      else if (o.t === 'topi') { const s = o.s; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(o.x + 2, o.y + 3, 8 * s, 3 * s, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#8A5E3A'; ctx.fillRect(o.x - 5 * s, o.y - 4 * s, 10 * s, 6 * s);
        if (o.k) { ctx.fillStyle = '#3E8E41'; ctx.beginPath(); ctx.arc(o.x, o.y - 10 * s, 7 * s, 0, TAU); ctx.fill(); ctx.fillStyle = '#5CB050'; ctx.beginPath(); ctx.arc(o.x - 2 * s, o.y - 12 * s, 3.5 * s, 0, TAU); ctx.fill(); }
        else { ctx.fillStyle = '#3E8E41'; ctx.beginPath(); ctx.moveTo(o.x - 6 * s, o.y - 4 * s); ctx.lineTo(o.x, o.y - 24 * s); ctx.lineTo(o.x + 6 * s, o.y - 4 * s); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(o.x - 2 * s, o.y - 6 * s); ctx.lineTo(o.x, o.y - 20 * s); ctx.lineTo(o.x + 1 * s, o.y - 6 * s); ctx.fill(); } }
      else if (o.t === 'lantern') { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(o.x + 1, o.y + 1, 4, 1.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#2E3238'; ctx.fillRect(o.x - 0.8, o.y - 14, 1.6, 14); ctx.fillStyle = L > 0.2 ? '#FFE3A0' : '#D8D2C4'; ctx.fillRect(o.x - 2.5, o.y - 18, 5, 5); ctx.fillStyle = '#2E3238'; ctx.fillRect(o.x - 3, o.y - 19, 6, 1.4); }
      else if (o.t === 'gnome') { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(o.x + 1, o.y + 1, 4, 1.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = ['#3F6FD6', '#3FAE6A', '#8A5FC9'][o.c]; ctx.fillRect(o.x - 2.5, o.y - 6, 5, 6); ctx.fillStyle = '#F2D2B0'; ctx.beginPath(); ctx.arc(o.x, o.y - 7.5, 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(o.x - 2, o.y - 7); ctx.lineTo(o.x, o.y - 3.5); ctx.lineTo(o.x + 2, o.y - 7); ctx.fill(); ctx.fillStyle = '#D33F3F'; ctx.beginPath(); ctx.moveTo(o.x - 2.6, o.y - 8.5); ctx.lineTo(o.x, o.y - 14); ctx.lineTo(o.x + 2.6, o.y - 8.5); ctx.closePath(); ctx.fill(); }
      else if (o.t === 'lounger') { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(o.x - 11, o.y + 2, 24, 3); ctx.fillStyle = '#E8E2D6'; ctx.fillRect(o.x - 12, o.y - 3, 24, 5); ctx.fillStyle = ['#3FB8E8', '#FF7A8A', '#FFD24A'][o.c]; ctx.fillRect(o.x - 10, o.y - 4, 14, 4); ctx.save(); ctx.translate(o.x + 4, o.y - 3); ctx.rotate(-0.5); ctx.fillRect(0, -1, 9, 4); ctx.restore(); }
      else if (o.t === 'trash') { for (let i = 0; i < o.n; i++) { const x = o.x - 5 + i * 5, y = o.y - (i % 2) * 2; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 3, 5, 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = i % 2 ? '#2A2E36' : '#1E2228'; ctx.beginPath(); ctx.ellipse(x, y - 2, 4.6, 5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.arc(x - 1.5, y - 4, 1.4, 0, TAU); ctx.fill(); ctx.strokeStyle = '#E8B23A'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x - 1.5, y - 6.5); ctx.lineTo(x + 1.5, y - 7.5); ctx.stroke(); } }
      else if (o.t === 'tires') { for (let i = 0; i < o.n; i++) { const y = o.y - i * 3; ctx.fillStyle = i ? '#24272C' : 'rgba(0,0,0,.3)'; if (!i) { ctx.beginPath(); ctx.ellipse(o.x + 1, o.y + 3, 9, 3.5, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = '#1C1E22'; ctx.beginPath(); ctx.ellipse(o.x, y, 8, 3.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#3A3E46'; ctx.beginPath(); ctx.ellipse(o.x, y - 0.6, 4, 1.6, 0, 0, TAU); ctx.fill(); } }
    }
    for (const f of VQ.fire) { if (!inView(f.x, f.y, 60)) continue; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(f.x + 1, f.y + 3, 8, 3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#5A4A3E'; ctx.fillRect(f.x - 6, f.y - 12, 12, 14); ctx.fillStyle = '#3E332A'; ctx.fillRect(f.x - 6, f.y - 8, 12, 1.5); ctx.fillRect(f.x - 6, f.y - 3, 12, 1.5); ctx.fillStyle = '#2A231E'; ctx.beginPath(); ctx.ellipse(f.x, f.y - 12, 6, 2.2, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 4; i++) { const t = (gt * 1.6 + i * 0.25 + f.ph) % 1, h = 8 + 6 * Math.sin(gt * 9 + i * 2 + f.ph); ctx.fillStyle = ['#FFB13B', '#FF7A3B', '#FFE14F', '#FF5C3B'][i]; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.moveTo(f.x - 4 + i * 2.6, f.y - 12); ctx.quadraticCurveTo(f.x - 5 + i * 2.6 + Math.sin(gt * 7 + i) * 2, f.y - 12 - h * (1 - t * 0.3), f.x - 1 + i * 2.6, f.y - 12); ctx.fill(); } ctx.globalAlpha = 1; }
    for (const n of VQ.neon) { if (!inView(n.x, n.y, 80)) continue; const on = !(Math.sin(gt * 3 + n.ph) > 0.96); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(n.x - 1, n.y - 1, 4, 3); ctx.fillStyle = '#2E3238'; ctx.fillRect(n.x - 0.8, n.y - 20, 1.6, 20);
      ctx.font = '900 7px sans-serif'; const w = ctx.measureText(n.txt).width + 8; ctx.fillStyle = '#16181E'; rr(n.x - w / 2, n.y - 31, w, 12, 3); ctx.fill(); ctx.strokeStyle = on ? n.c : 'rgba(120,120,130,.6)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = on ? n.c : '#555A63'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(n.txt, n.x, n.y - 24.5); }
  }
  function vqCont(o) {
    const C = [['#B5473A', '#8E3328'], ['#2F6FD6', '#2152A8'], ['#3FAE6A', '#2E8450'], ['#E8B44A', '#B88A2E'], ['#8A5FC9', '#6A44A0']], w = o.hor ? 72 : 28, d = o.hor ? 28 : 72, H = 14;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(o.x - w / 2 + 6, o.y - d / 2 + 6, w, d);
    for (let s = 0; s < o.st; s++) { const [a, b] = C[(o.c + s * 2) % 5], y0 = o.y - d / 2 - s * H; ctx.fillStyle = b; ctx.fillRect(o.x - w / 2, y0 + d - 2, w, H - (s ? 0 : 0)); ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let k = o.x - w / 2 + 3; k < o.x + w / 2 - 2; k += 4) ctx.fillRect(k, y0 + d - 1, 1.4, H - 2);
      ctx.fillStyle = a; ctx.fillRect(o.x - w / 2, y0 - H + 2 + (s ? 0 : H - 2), w, d); ctx.fillStyle = 'rgba(0,0,0,.14)'; if (o.hor) for (let k = o.x - w / 2 + 4; k < o.x + w / 2 - 2; k += 6) ctx.fillRect(k, y0 + 2 + (s ? -H + 2 : 0), 2, d - 4); else for (let k = y0 + 4 + (s ? -H + 2 : 0); k < y0 + d - 2 + (s ? -H + 2 : 0); k += 6) ctx.fillRect(o.x - w / 2 + 2, k, w - 4, 2);
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(o.x - w / 2, y0 + (s ? -H + 2 : 0), w, 1.5); }
  }
  // ---------- Kräne (über allem) ----------
  function vqDrawSky() {
    if (!VQ || inOwnRoom()) return;
    for (const c of VQ.cranes) { if (!inView(c.x, c.y - 120, c.L + 80)) continue; const top = c.y - 150, a = c.a0 + gt * c.sp, ex = Math.cos(a), ey = Math.sin(a) * 0.5;
      ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(c.x - ex * 60 + 40, c.y - ey * 60 + 10); ctx.lineTo(c.x + ex * c.L + 40, c.y + ey * c.L + 10); ctx.stroke();
      ctx.fillStyle = '#8A8F96'; ctx.fillRect(c.x - 13, c.y - 6, 26, 12); ctx.fillStyle = '#E8B23A'; ctx.fillRect(c.x - 5, top, 10, c.y - top); ctx.strokeStyle = '#B5861F'; ctx.lineWidth = 0.9; ctx.beginPath(); for (let y = top; y < c.y - 6; y += 10) { ctx.moveTo(c.x - 5, y); ctx.lineTo(c.x + 5, y + 10); ctx.moveTo(c.x + 5, y); ctx.lineTo(c.x - 5, y + 10); } ctx.stroke();
      const jx = c.x + ex * c.L, jy = top + ey * c.L, bx = c.x - ex * 64, by = top - ey * 64; ctx.strokeStyle = '#E8B23A'; ctx.lineWidth = 6; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(jx, jy); ctx.stroke(); ctx.strokeStyle = '#B5861F'; ctx.lineWidth = 0.8; ctx.beginPath(); for (let t = 0; t < 1; t += 0.04) { const x0 = bx + (jx - bx) * t, y0 = by + (jy - by) * t; ctx.moveTo(x0, y0 - 3); ctx.lineTo(x0 + (jx - bx) * 0.04, y0 + 3); } ctx.stroke();
      ctx.fillStyle = '#6A6F76'; ctx.fillRect(bx - 8, by - 6, 16, 12); ctx.fillStyle = '#E8B23A'; ctx.fillRect(c.x - 7, top - 10, 14, 10); ctx.fillStyle = 'rgba(160,210,240,.9)'; ctx.fillRect(c.x - 5, top - 8, 10, 5);
      const ht = 0.62 + 0.08 * Math.sin(gt * 0.3 + c.a0), hx = c.x + ex * c.L * ht, hy = top + ey * c.L * ht, hl = 70 + 20 * Math.sin(gt * 0.25 + c.a0); ctx.strokeStyle = 'rgba(40,40,40,.7)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx, hy + hl); ctx.stroke(); ctx.fillStyle = '#D33F3F'; ctx.fillRect(hx - 3, hy + hl, 6, 4);
      if (lightK() > 0.2) { ctx.fillStyle = Math.sin(gt * 3) > 0 ? '#FF4040' : '#801010'; ctx.beginPath(); ctx.arc(jx, jy - 3, 1.8, 0, TAU); ctx.fill(); }
    }
  }
  // ---------- Lichter ----------
  function vqLights(L, oK) {
    if (!VQ || L <= 0.05) return;
    for (const n of VQ.neon) { if (!inView(n.x, n.y, 80)) continue; const on = !(Math.sin(gt * 3 + n.ph) > 0.96); if (!on) continue; const m = /^#(..)(..)(..)$/.exec(n.c); glow(n.x, n.y - 25, 34, parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + parseInt(m[3], 16), 0.5 * L * oK); }
    for (const o of VQ.flat) if (o.t === 'string' && inView(o.x !== undefined ? o.x : (o.x0 + o.x1) / 2, o.y !== undefined ? o.y : (o.y0 + o.y1) / 2, 120)) for (let i = 0; i < 7; i++) { const t = (i + 0.5) / 7, x = o.h ? o.x + 24 * t * (1 - t) : o.x0 + t * (o.x1 - o.x0), y = o.h ? o.y0 + t * (o.y1 - o.y0) : o.y + 24 * t * (1 - t); glow(x, y, 12, ['255,92,163', '79,227,255', '255,225,79', '199,125,255'][i % 4], (0.4 + 0.12 * Math.sin(gt * 3 + i)) * L * oK); }
    for (const f of VQ.fire) if (inView(f.x, f.y, 100)) glow(f.x, f.y - 16, 70 + 8 * Math.sin(gt * 11 + f.ph), '255,140,50', (0.45 + 0.1 * Math.sin(gt * 13 + f.ph)) * L * oK);
    for (const o of VQ.obj) { if (o.t === 'lantern' && inView(o.x, o.y, 60)) glow(o.x, o.y - 16, 26, '255,214,140', 0.4 * L * oK); else if (o.t === 'pool' && inView(o.x, o.y, 80)) glow(o.x, o.y, 44, '80,200,255', 0.3 * L * oK); }
  }
  // Laternen im Gangviertel flackern
  const vqFlicker = (x, y) => vqK(x, y) === 'gang' && ((Math.floor(x * 7 + y * 3) % 3) === 0) && Math.sin(gt * 23 + x) * Math.sin(gt * 7.3 + y) > 0.55;
