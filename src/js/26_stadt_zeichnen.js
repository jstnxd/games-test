  // ---------- Freunde-Grundstuecke (links der Karte) ----------
  // Jeder Freund bekommt links ein eigenes Grundstueck mit seinem Keller, seiner Tabakscheune und Brauerei. Sie werden aus seinem Schnappschuss gezeichnet (nur ansehen).
  function withGhost(gs, fn) {
    const sG = G, sCur = curKey, lays = AREA_KEYS.map(k => captureLayout(AREAS[k]));
    try {
      G = gs; curKey = null; GH_ON = true;
      for (const k of AREA_KEYS) { applyLayout(AREAS[k], gs.lay[k]); setSideGeom(AREAS[k], !!gs.build.door[k]); }
      fn();
    } finally {
      G = sG; curKey = sCur; GH_ON = false;
      AREA_KEYS.forEach((k, i) => { applyLayout(AREAS[k], lays[i]); setSideGeom(AREAS[k], !!sG.build.door[k]); });
    }
  }
  const lookCol = L => !L ? 'rgb(170,180,190)' : 'rgb(' + clamp(Math.round(L.r + 40), 0, 255) + ',' + clamp(Math.round(L.g + 40), 0, 255) + ',' + clamp(Math.round(L.b + 40), 0, 255) + ')';
  function pill(txt, x, y, col) {
    ctx.font = '800 10px sans-serif'; const w = ctx.measureText(txt).width + 18;
    ctx.fillStyle = 'rgba(16,21,28,.85)'; rr(x - w / 2, y - 8, w, 16, 8); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y + 0.5);
  }
  const PILL_AT = { keller: [410, 538, 0], tabak: [2190, 538, -1080], brau: [2132, 706, -1080] };
  const PILL_NAME = { keller: 'KELLER', tabak: 'TABAKSCHEUNE', brau: 'CHEMIELABOR' };
  function drawPills(ox, who, col) { for (const k of AREA_KEYS) { const q = PILL_AT[k]; pill(PILL_NAME[k] + ' · ' + who, ox + q[0] + q[2], q[1], col); } }
  function drawOwnerPills() {
    if (!mp.on || state === 'edit' || !Object.keys(mp.friends).length) return;
    for (const k of AREA_KEYS) { const q = PILL_AT[k]; pill(PILL_NAME[k] + ' · DU', q[0], q[1], '#FFB547'); }
  }
  function drawPlots() {
    if (state === 'edit' || !mp.on || !mp.slots.length) return;
    for (let j = 0; j < mp.slots.length; j++) { // zuerst die Keller
      const ox = kOx(j); if (ox + KW < viewX0 || ox > viewX1) continue;
      const f = mp.slots[j] && mp.friends[mp.slots[j]];
      if (!f || !f.gs) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.font = '700 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('frei', ox + KW / 2, 280); continue; }
      const col = lookCol(f.look);
      ctx.fillStyle = col; ctx.font = '800 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('KELLER VON ' + f.name.toUpperCase(), ox + 326, 12); ctx.textBaseline = 'alphabetic';
      try { withGhost(f.gs, () => { ctx.save(); ctx.translate(ox, 0); drawKeller(); ctx.restore(); }); } catch (e) { f.gs = null; }
      pill('KELLER · ' + f.name.toUpperCase(), ox + 410, 538, col);
    }
    (mp.farms || []).forEach((id, i) => { // danach die Farmen, nur wenn freigeschaltet
      const ox = fOx(i), f = mp.friends[id]; if (!f || !f.gs || ox + FW < viewX0 || ox > viewX1) return;
      const col = lookCol(f.look), sx = ox - FARM_X, tOn = f.gs.t && f.gs.t.unlocked, bOn = f.gs.b && f.gs.b.unlocked;
      try { withGhost(f.gs, () => { ctx.save(); ctx.translate(sx, 0); if (tOn) drawFactory(AREAS.tabak); if (bOn) drawFactory(AREAS.brau); ctx.restore(); }); } catch (e) { f.gs = null; return; }
      if (tOn) pill('TABAKSCHEUNE · ' + f.name.toUpperCase(), sx + 2190, 538, col); if (bOn) pill('CHEMIELABOR · ' + f.name.toUpperCase(), sx + 2132, 706, col);
    });
  }
  function potSlot(x, y, next) { if (next) { potSlot0(x, y, true); return; } ctx.save(); ctx.translate(x, y); sprDraw('pslot', -21, -19, 42, 40, () => potSlot0(0, 0, false)); ctx.restore(); } // v157: leerer Platz als fertiges Bild
  function potSlot0(x, y, next) { // v147: freier Platz fuer einen weiteren Topf
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 17, 15, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(70,52,38,.55)'; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x - 6 + (k * 5.3) % 12, y - 5 + (k * 3.7) % 10, 1.2, 0, TAU); ctx.fill(); }
    const a = next ? 0.45 + 0.2 * Math.sin(gt * 3) : 0.22; ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = 'rgba(255,255,255,' + (a + 0.1).toFixed(2) + ')'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke(); ctx.lineCap = 'butt';
  }
  function drawKeller() {
    if (player.fl && !GH_ON) { if (player.fl === 4) drawGangHQ(); else if (player.fl === 3) drawBizRoom(); else if (player.fl === 2) drawPremiumRoom(); else drawKellerFloor(player.fl); return; } // v54: Etage statt Erdgeschoss
    if (!GH_ON && areaHidden(AREAS.keller, 'keller')) return; // v154: Innenraum nicht zeichnen, wenn er ausserhalb des Bildes liegt oder das Dach ihn ganz verdeckt
    // Keller
    { const I = AREAS.keller.IN, fl = G.build.floor.keller; bcDraw('kfw' + fl.c + '|' + fl.p + '|' + colliders.slice(0, 5).map(c => c.x + ',' + c.y + ',' + c.w + ',' + c.h).join(';'), I.x0 - 40, I.y0 - 40, I.x1 - I.x0 + 80, I.y1 - I.y0 + 80, () => { // v157: Boden und Wände zusammen als ein fertiges Bild
      drawFloor0(AREAS.keller);
      ctx.fillStyle = '#0D1117';
      for (let i = 0; i < 5; i++) { const c = colliders[i]; ctx.fillRect(c.x, c.y, c.w, c.h); }
      for (let i = 0; i < 5; i++) { const c = colliders[i]; ctx.fillStyle = '#1A2129'; ctx.fillRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4); ctx.fillStyle = 'rgba(255,255,255,.035)'; const hor = c.w > c.h; if (hor) { for (let x = c.x + 4, r = 0; x < c.x + c.w - 4; x += 14, r++) ctx.fillRect(x, c.y + 2, 1, c.h - 4); ctx.fillRect(c.x + 2, c.y + c.h / 2, c.w - 4, 1); } else { for (let y = c.y + 4; y < c.y + c.h - 4; y += 14) ctx.fillRect(c.x + 2, y, c.w - 4, 1); ctx.fillRect(c.x + c.w / 2, c.y + 2, 1, c.h - 4); } ctx.fillStyle = 'rgba(120,140,160,.22)'; ctx.fillRect(c.x, c.y, c.w, 1.2); ctx.fillRect(c.x, c.y, 1.2, c.h); } // v147: Mauerkrone mit Fugen
      ctx.fillStyle = '#2A3139'; ctx.fillRect(370, 508, 80, T); // Türschwelle
    }); }
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '800 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('KELLER', 326, 24); // v79: wie Scheune und Brauerei
    if (!GH_ON && !(roofA.keller > 0.5)) { const pu = 0.85 + 0.15 * Math.sin(gt * 2.5); ctx.fillStyle = '#20262E'; rr(222, 509, 120, 18, 5); ctx.fill(); ctx.strokeStyle = '#5FE584'; ctx.lineWidth = 1.4; rr(222, 509, 120, 18, 5); ctx.stroke();
      ctx.fillStyle = 'rgba(95,229,132,' + pu.toFixed(2) + ')'; ctx.font = '900 10px sans-serif'; ctx.fillText('DEIN KELLER', 282, 518.5); }
    ctx.textBaseline = 'alphabetic';
    drawSideDoor(AREAS.keller);
    drawFields(AREAS.keller); drawDecorFor(AREAS.keller, 0);
    // Töpfe
    for (let i = 0; i < POTS.length; i++) {
      if (i >= potsOpen()) { potSlot(POTS[i].x, POTS[i].y, i === potsOpen()); continue; } // v147: leerer Topfplatz
      drawPlant(i); drawGrowLamp(POTS[i].x, POTS[i].y, i, G.pots[i], rotAng(POTS[i], POTS[i].r)); drawDrop(POTS[i].x, POTS[i].y, G.pots[i]);
    }
    drawRackFor(AREAS.keller); drawTableFor(AREAS.keller); // v61
    drawDecorFor(AREAS.keller, 1);
    if (!GH_ON) drawPanicBtn(); // v122
  }
  // ---------- v72: Stadt zeichnen (Boden, Strassen, Fluss) ----------
  const GROUNDS = [
    { t: 'allot', x: 792, y: 0, w: 948, h: 300 }, { t: 'garden', x: 2640, y: 0, w: 720, h: 300 }, { t: 'garden', x: 0, y: 905, w: 612, h: 222 }, { t: 'garden', x: 3540, y: 905, w: 740, h: 222 },
    { t: 'park', x: 0, y: 1652, w: WW, h: 190 }, { t: 'park', x: 0, y: 1996, w: WW, h: 84 }, { t: 'garden', x: 0, y: 2432, w: WW, h: 168 }, { t: 'park', x: 792, y: 728, w: 948, h: 572 },
    { t: 'lot', x: AH_LOT.x, y: AH_LOT.y, w: AH_LOT.w, h: AH_LOT.h }, { t: 'lot', x: 4460, y: 728, w: 740, h: 572 }, { t: 'lot', x: WS_LOT.x, y: WS_LOT.y, w: WS_LOT.w, h: WS_LOT.h },
    { t: 'skate', x: SKATE.x, y: SKATE.y, w: SKATE.w, h: SKATE.h }, { t: 'play', x: PLAY.x, y: PLAY.y, w: PLAY.w, h: PLAY.h }, { t: 'pitch', x: PITCH.x, y: PITCH.y, w: PITCH.w, h: PITCH.h }, { t: 'dog', x: DOGS.x, y: DOGS.y, w: DOGS.w, h: DOGS.h },
    ...NORTH_GROUNDS, { t: 'garden', x: 2640, y: 2440, w: 720, h: 160 } // v95, v97
  ];
  function drawGroundZone(z, x0, x1, y0, y1) {
    const a = Math.max(z.x, x0), b = Math.min(z.x + z.w, x1), c = Math.max(z.y, y0), d = Math.min(z.y + z.h, y1); if (b <= a || d <= c) return;
    if (z.t === 'park') { ctx.fillStyle = '#1F3B29'; ctx.fillRect(a, c, b - a, d - c); ctx.fillStyle = 'rgba(255,255,255,.022)'; for (let x = Math.floor(a / 80) * 80; x < b; x += 80) ctx.fillRect(Math.max(a, x), c, Math.min(40, b - Math.max(a, x)), d - c); ctx.fillStyle = 'rgba(120,190,110,.10)'; for (let x = Math.floor(a / 23) * 23; x < b; x += 23) for (let y = Math.floor(c / 31) * 31; y < d; y += 31) ctx.fillRect(x + ((y * 7) % 13), y + ((x * 3) % 9), 2, 3); }
    else if (z.t === 'garden') { ctx.fillStyle = '#1B3123'; ctx.fillRect(a, c, b - a, d - c); ctx.fillStyle = 'rgba(140,200,120,.07)'; for (let x = Math.floor(a / 29) * 29; x < b; x += 29) for (let y = Math.floor(c / 37) * 37; y < d; y += 37) ctx.fillRect(x + ((y * 5) % 11), y, 2, 3); }
    else if (z.t === 'allot') drawFloraGarden(z, a, b, c, d); // v89: Floras Blumengarten
    else if (z.t === 'lot') { ctx.fillStyle = '#2B2F36'; ctx.fillRect(a, c, b - a, d - c); ctx.fillStyle = 'rgba(255,255,255,.025)'; for (let x = Math.floor(a / 47) * 47; x < b; x += 47) for (let y = Math.floor(c / 53) * 53; y < d; y += 53) ctx.fillRect(x + ((y * 3) % 17), y + 9, 3, 2); }
    else if (z.t === 'skate') { ctx.fillStyle = '#41474F'; ctx.fillRect(a, c, b - a, d - c); ctx.fillStyle = 'rgba(0,0,0,.16)'; for (let x = Math.ceil(z.x / 70) * 70; x < z.x + z.w; x += 70) if (x > a && x < b) ctx.fillRect(x, c, 1.5, d - c); for (let y = Math.ceil(z.y / 70) * 70; y < z.y + z.h; y += 70) if (y > c && y < d) ctx.fillRect(a, y, b - a, 1.5); }
    else if (z.t === 'play') { ctx.fillStyle = '#3B2F2A'; ctx.fillRect(a, c, b - a, d - c); ctx.fillStyle = 'rgba(255,190,140,.06)'; for (let x = Math.floor(a / 17) * 17; x < b; x += 17) for (let y = Math.floor(c / 19) * 19; y < d; y += 19) ctx.fillRect(x + ((y * 3) % 7), y, 2, 2); }
    else if (z.t === 'dog') { ctx.fillStyle = '#24402C'; ctx.fillRect(a, c, b - a, d - c); ctx.fillStyle = 'rgba(90,70,40,.35)'; for (const [px, py, r] of [[70, 80, 26], [300, 200, 34], [420, 90, 20], [160, 250, 22]]) { ell(z.x + px, z.y + py, r * 1.4, r * 0.7); ctx.fill(); } }
    else if (z.t === 'pitch') {
      for (let x = z.x, k = 0; x < z.x + z.w; x += 56, k++) { const xa = Math.max(a, x), xb = Math.min(b, x + 56); if (xb <= xa) continue; ctx.fillStyle = k % 2 ? '#2C6136' : '#2F6A3A'; ctx.fillRect(xa, c, xb - xa, d - c); }
      ctx.strokeStyle = 'rgba(240,245,240,.75)'; ctx.lineWidth = 3; const m = 22, X0 = z.x + m, Y0 = z.y + m, W0 = z.w - 2 * m, H0 = z.h - 2 * m, cx = z.x + z.w / 2, cy = z.y + z.h / 2;
      ctx.strokeRect(X0, Y0, W0, H0); ctx.beginPath(); ctx.moveTo(cx, Y0); ctx.lineTo(cx, Y0 + H0); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 52, 0, TAU); ctx.stroke();
      ctx.strokeRect(X0, cy - 90, 90, 180); ctx.strokeRect(X0 + W0 - 90, cy - 90, 90, 180); ctx.fillStyle = 'rgba(240,245,240,.75)'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, TAU); ctx.fill();
    }
  }
  const segsBetween = (list, lim, lo) => { const s = []; let p = lo || 0; for (const r of list.slice().sort((a, b) => a.c0 - b.c0)) { s.push([p, r.c0 - SW]); p = r.c1 + SW; } s.push([p, lim]); return s; };
  function drawRoads(x0, x1, y0, y1) {
    const hv = r => r.h ? !(r.c1 + SW < y0 || r.c0 - SW > y1) : !(r.c1 + SW < x0 || r.c0 - SW > x1);
    // Gehwege mit Plattenfugen
    for (const r of RD) {
      if (!hv(r)) continue;
      for (const a of [r.c0 - SW, r.c1]) {
        ctx.fillStyle = '#2C333C'; if (r.h) ctx.fillRect(x0, a, x1 - x0, SW); else ctx.fillRect(a, y0, SW, y1 - y0);
        ctx.fillStyle = 'rgba(255,255,255,.05)';
        if (r.h) { for (let x = Math.floor(x0 / 30) * 30; x < x1; x += 30) ctx.fillRect(x, a, 1, SW); ctx.fillRect(x0, a + 15, x1 - x0, 1); }
        else { for (let y = Math.floor(y0 / 30) * 30; y < y1; y += 30) ctx.fillRect(a, y, SW, 1); ctx.fillRect(a + 15, y0, 1, y1 - y0); }
      }
    }
    // Bordsteine, dann Fahrbahnen (so liegen die Kreuzungen sauber uebereinander)
    ctx.fillStyle = '#4E5762'; for (const r of RD) if (hv(r)) { if (r.h) ctx.fillRect(x0, r.c0 - 3, x1 - x0, r.c1 - r.c0 + 6); else ctx.fillRect(r.c0 - 3, y0, r.c1 - r.c0 + 6, y1 - y0); }
    ctx.fillStyle = '#23272E'; for (const r of RD) if (hv(r)) { if (r.h) ctx.fillRect(x0, r.c0, x1 - x0, r.c1 - r.c0); else ctx.fillRect(r.c0, y0, r.c1 - r.c0, y1 - y0); }
    // Markierungen zwischen den Kreuzungen
    for (const r of RD) {
      if (!hv(r)) continue;
      const mid = (r.c0 + r.c1) / 2, wide = r.c1 - r.c0 > 130;
      for (const [s0, s1] of segsBetween(r.h ? RDV : RDH, r.h ? WW : WH, r.h ? 0 : YMIN)) {
        const a = Math.max(s0 + 6, r.h ? x0 : y0), b = Math.min(s1 - 6, r.h ? x1 : y1); if (b <= a) continue;
        ctx.fillStyle = 'rgba(255,255,255,.2)'; if (r.h) { ctx.fillRect(a, r.c0 + 6, b - a, 2); ctx.fillRect(a, r.c1 - 8, b - a, 2); } else { ctx.fillRect(r.c0 + 6, a, 2, b - a); ctx.fillRect(r.c1 - 8, a, 2, b - a); }
        if (wide) { ctx.fillStyle = 'rgba(230,190,80,.75)'; if (r.h) { ctx.fillRect(a, mid - 4, b - a, 2.5); ctx.fillRect(a, mid + 1.5, b - a, 2.5); } else { ctx.fillRect(mid - 4, a, 2.5, b - a); ctx.fillRect(mid + 1.5, a, 2.5, b - a); } }
        else { ctx.fillStyle = 'rgba(255,255,255,.38)'; for (let k = Math.ceil((a - 10) / 70) * 70 + 10; k < b - 30; k += 70) { if (r.h) ctx.fillRect(k, mid - 2, 36, 4); else ctx.fillRect(mid - 2, k, 4, 36); } }
        ctx.fillStyle = 'rgba(0,0,0,.35)'; for (let k = Math.ceil(a / 410) * 410 + 130; k < b; k += 410) { if (r.h) { ctx.beginPath(); ctx.arc(k, r.c0 + 26, 6, 0, TAU); ctx.fill(); } else { ctx.beginPath(); ctx.arc(r.c0 + 26, k, 6, 0, TAU); ctx.fill(); } } // Gullis
      }
    }
    // Zebrastreifen und Haltelinien an den Kreuzungen
    for (const h of RDH) for (const v of RDV) {
      if (v.c1 + SW + 20 < x0 || v.c0 - SW - 20 > x1 || h.c1 + SW + 20 < y0 || h.c0 - SW - 20 > y1) continue;
      ctx.fillStyle = 'rgba(236,240,247,.8)';
      for (const bx of [v.c0 - SW, v.c1]) for (let y = h.c0 + 5; y < h.c1 - 4; y += 13) ctx.fillRect(bx + 3, y, SW - 6, 7);
      for (const by of [h.c0 - SW, h.c1]) for (let x = v.c0 + 5; x < v.c1 - 4; x += 13) ctx.fillRect(x, by + 3, 7, SW - 6);
      ctx.fillStyle = 'rgba(236,240,247,.55)'; const hm = (h.c0 + h.c1) / 2, vm = (v.c0 + v.c1) / 2;
      ctx.fillRect(v.c0 - SW - 7, hm, 3, h.c1 - hm); ctx.fillRect(v.c1 + SW + 4, h.c0, 3, hm - h.c0); ctx.fillRect(v.c0, h.c0 - SW - 7, vm - v.c0, 3); ctx.fillRect(vm, h.c1 + SW + 4, v.c1 - vm, 3);
    }
    // Zebrastreifen, wo Wege eine Strasse kreuzen
    ctx.fillStyle = 'rgba(236,240,247,.8)';
    for (const l of NAV_VL) if (l.k === 'w' && !RDV.some(v => Math.abs(swLine(v, -1) - l.x) < 1 || Math.abs(swLine(v, 1) - l.x) < 1)) for (const h of RDH) { if (h.c0 < l.y0 || h.c1 > l.y1 || !inView(l.x, (h.c0 + h.c1) / 2, 120)) continue; for (let y = h.c0 + 5; y < h.c1 - 4; y += 13) ctx.fillRect(l.x - 20, y, 40, 7); }
    for (const y of [UFER_N, UFER_S]) for (const v of RDV) { if (!inView((v.c0 + v.c1) / 2, y, 120)) continue; for (let x = v.c0 + 5; x < v.c1 - 4; x += 13) ctx.fillRect(x, y - 15, 7, 30); }
  }
  function drawPier() { // v109: Holzsteg mit Ausflugsboot, Pollern, Rettungsring und Schild
    const P = PIER; if (!inView((P.x0 + P.x1) / 2, (P.y0 + P.y1) / 2, 200)) return; const dk = lightK() > 0.25, w = P.x1 - P.x0;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(P.x0 + 4, P.y0 + 6, w, P.y1 - P.y0); ctx.fillStyle = '#5A3B26'; for (const px of [P.x0 + 2, P.x1 - 6]) for (let y = P.y0 + 14; y < P.y1; y += 22) ctx.fillRect(px, y, 4, 8);
    ctx.fillStyle = '#9A7650'; ctx.fillRect(P.x0, P.y0, w, P.y1 - P.y0); for (let y = P.y0; y < P.y1; y += 6) { ctx.fillStyle = ((y - P.y0) / 6) % 2 ? '#8A6A45' : '#A88358'; ctx.fillRect(P.x0, y, w, 5); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(P.x0, y + 5, w, 1); }
    ctx.fillStyle = 'rgba(0,0,0,.35)'; for (let y = P.y0 + 2; y < P.y1; y += 6) { ctx.fillRect(P.x0 + 4, y, 1, 1); ctx.fillRect(P.x1 - 5, y, 1, 1); }
    for (const [bx, by] of [[P.x0 + 4, P.y1 - 6], [P.x1 - 4, P.y1 - 6], [P.x1 - 4, P.y0 + 30]]) { ctx.fillStyle = '#2A2F37'; ctx.beginPath(); ctx.arc(bx, by, 3.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#4A5260'; ctx.beginPath(); ctx.arc(bx - .8, by - .8, 1.6, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#E05555'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(P.x0 + 8, P.y0 + 22, 5, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#F4F4F8'; ctx.lineWidth = 3; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(P.x0 + 8, P.y0 + 22, 5, k * Math.PI / 2, k * Math.PI / 2 + .35); ctx.stroke(); }
    const b = P.boat, bob = Math.sin(gt * 1.4) * 1.2, rl = Math.sin(gt * 1.1) * .03; ctx.save(); ctx.translate(b.x, b.y + bob); ctx.rotate(rl);
    ctx.fillStyle = 'rgba(0,30,60,.3)'; ell(2, 4, 40, 13); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; for (let k = 0; k < 2; k++) { const ph = (gt * .6 + k / 2) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.ellipse(0, 0, 40 + ph * 10, 13 + ph * 4, 0, 0, TAU); ctx.stroke(); } ctx.globalAlpha = 1;
    ctx.fillStyle = '#F4F4F8'; ctx.beginPath(); ctx.moveTo(-36, -11); ctx.lineTo(26, -11); ctx.quadraticCurveTo(42, 0, 26, 11); ctx.lineTo(-36, 11); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#2F5FA8'; ctx.beginPath(); ctx.moveTo(-36, 7); ctx.lineTo(28, 7); ctx.quadraticCurveTo(34, 9, 26, 11); ctx.lineTo(-36, 11); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(-36, -11); ctx.lineTo(26, -11); ctx.quadraticCurveTo(34, -9, 28, -7); ctx.lineTo(-36, -7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8A6A45'; ctx.fillRect(-32, -7, 54, 14); ctx.fillStyle = '#A88358'; for (let x = -32; x < 22; x += 6) ctx.fillRect(x, -7, 5, 14);
    ctx.fillStyle = '#E9ECEF'; rr(-18, -8, 22, 16, 3); ctx.fill(); ctx.fillStyle = dk ? '#FFF2C8' : '#9FD2E8'; ctx.fillRect(-15, -6, 6, 5); ctx.fillRect(-7, -6, 6, 5); ctx.fillStyle = '#C23B3B'; ctx.fillRect(-18, -9, 22, 2.4);
    ctx.fillStyle = '#20262E'; ctx.fillRect(-40, -3, 5, 6); ctx.fillStyle = '#F2C14E'; ctx.font = '900 5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('MÖWE', 12, 9.2); ctx.restore();
    ctx.strokeStyle = 'rgba(60,40,20,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(P.x1 - 4, P.y1 - 6); ctx.quadraticCurveTo(P.x1 + 6, b.y + 10, b.x - 32, b.y + 6 + bob); ctx.moveTo(P.x1 - 4, P.y0 + 30); ctx.quadraticCurveTo(P.x1 + 8, b.y - 14, b.x - 30, b.y - 6 + bob); ctx.stroke();
    const sx = P.x0 - 70, sy = UFER_N - 14; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(sx - 1, sy + 13, 4, 3); ctx.fillStyle = '#5A3B26'; ctx.fillRect(sx, sy - 4, 2.4, 18); ctx.fillStyle = '#2F5FA8'; rr(sx - 24, sy - 18, 50, 16, 3); ctx.fill(); ctx.fillStyle = '#F4F4F8'; ctx.font = '900 6.5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('HAFEN · PIET', sx + 1, sy - 12.5); ctx.fillStyle = '#F2C14E'; ctx.font = '700 5px sans-serif'; ctx.fillText('Bootstouren', sx + 1, sy - 6); ctx.textBaseline = 'alphabetic';
    if (dk) { glow(P.x1 - 4, P.y0 + 30, 26, '255,210,140', .25); ctx.fillStyle = '#FFE9A0'; ctx.beginPath(); ctx.arc(P.x1 - 4, P.y0 + 28, 1.6, 0, TAU); ctx.fill(); }
  }
  function drawRiverBand(x0, x1, y0, y1) {
    const r = RIVER; if (y1 < r.y0 - 60 || y0 > r.y1 + 60) return;
    // Uferwege (gepflastert) mit Gelaender zum Wasser
    for (const y of [UFER_N, UFER_S]) { ctx.fillStyle = '#33393F'; ctx.fillRect(x0, y - 16, x1 - x0, 32); ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let x = Math.floor(x0 / 24) * 24; x < x1; x += 24) ctx.fillRect(x, y - 16, 1, 32); ctx.fillStyle = '#4A525C'; ctx.fillRect(x0, y - 17, x1 - x0, 2); ctx.fillRect(x0, y + 15, x1 - x0, 2); }
    ctx.fillStyle = '#1A2B22'; ctx.fillRect(x0, r.y0 - 6, x1 - x0, 6); ctx.fillRect(x0, r.y1, x1 - x0, 6);
    const g = ctx.createLinearGradient(0, r.y0, 0, r.y1); g.addColorStop(0, '#2F7FB8'); g.addColorStop(0.5, '#2670A6'); g.addColorStop(1, '#1F5C8C');
    ctx.fillStyle = g; ctx.fillRect(x0, r.y0, x1 - x0, r.y1 - r.y0);
    ctx.strokeStyle = 'rgba(255,255,255,.26)'; ctx.lineWidth = 2;
    if (gsPass === 0) for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) { const o = ((x / 90) % 3) * 12 + Math.sin(gt * 1.3 + x) * 4; for (const [dy, dx] of [[14, 0], [34, 40], [56, 18]]) { ctx.beginPath(); ctx.moveTo(x + o + dx, r.y0 + dy); ctx.quadraticCurveTo(x + o + dx + 14, r.y0 + dy - 6, x + o + dx + 28, r.y0 + dy); ctx.stroke(); } }
    drawPier(); // v109
    ctx.fillStyle = '#7C8794'; for (let x = Math.floor(x0 / 18) * 18; x < x1; x += 18) { if (ALLB.some(b => x > b.x0 - 4 && x < b.x1 + 4) || (x > PIER.x0 - 4 && x < PIER.x1 + 4)) continue; ctx.fillRect(x, UFER_N + 12, 2, 6); ctx.fillRect(x, UFER_S - 18, 2, 6); } // Gelaenderpfosten
    ctx.fillStyle = '#8C96A3'; ctx.fillRect(x0, UFER_N + 12, x1 - x0, 1.5); ctx.fillRect(x0, UFER_S - 17, x1 - x0, 1.5);
  }
  function drawParkPaths() { // Kies- und Pflasterwege der Parks (die Trampelpfade zeichnet drawPaths)
    for (const l of NAV_HL.concat(NAV_VL)) {
      if (l.k !== 'k') continue; const hor = l.y !== undefined;
      const x0 = hor ? l.x0 : l.x - 16, x1 = hor ? l.x1 : l.x + 16, y0 = hor ? l.y - 16 : l.y0, y1 = hor ? l.y + 16 : l.y1;
      if (x1 < viewX0 || x0 > viewX1 || y1 < viewY0 || y0 > viewY1) continue;
      if (inR(SKATE, (x0 + x1) / 2, (y0 + y1) / 2) || inR(PITCH, (x0 + x1) / 2, (y0 + y1) / 2)) continue;
      ctx.fillStyle = '#4C4436'; ctx.fillRect(x0 - 2, y0, x1 - x0 + 4, y1 - y0); if (hor) ctx.fillRect(x0, y0 - 2, x1 - x0, y1 - y0 + 4);
      ctx.fillStyle = '#6A5E4B'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.fillStyle = 'rgba(255,240,210,.10)'; const n = Math.floor((hor ? x1 - x0 : y1 - y0) / 9); for (let k = 0; k < n; k++) { const t = k * 9 + ((k * 7) % 5); if (hor) ctx.fillRect(x0 + t, y0 + 4 + ((k * 11) % 24), 2, 2); else ctx.fillRect(x0 + 4 + ((k * 11) % 24), y0 + t, 2, 2); }
    }
    // Brunnenplatz
    if (inView(FOUNTAIN.x, FOUNTAIN.y, 160)) {
      ctx.fillStyle = '#4C5560'; ctx.beginPath(); ctx.arc(FOUNTAIN.x, FOUNTAIN.y, 128, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5E6873'; ctx.beginPath(); ctx.arc(FOUNTAIN.x, FOUNTAIN.y, 124, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.14)'; ctx.lineWidth = 1; for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.arc(FOUNTAIN.x, FOUNTAIN.y, 40 + k * 20, 0, TAU); ctx.stroke(); }
      for (let k = 0; k < 16; k++) { const a = k * TAU / 16; ctx.beginPath(); ctx.moveTo(FOUNTAIN.x + Math.cos(a) * 50, FOUNTAIN.y + Math.sin(a) * 50); ctx.lineTo(FOUNTAIN.x + Math.cos(a) * 124, FOUNTAIN.y + Math.sin(a) * 124); ctx.stroke(); }
    }
  }
  function drawBrooks() { // v73: Baeche mit Steinufer, Schilf und fliessendem Wasser
    for (const b of BROOKS) {
      if (b.x + 30 < viewX0 || b.x - 30 > viewX1 || b.y1 < viewY0 - 20 || b.y0 > viewY1 + 20) continue;
      const a = Math.max(b.y0, viewY0 - 20), e = Math.min(b.y1, viewY1 + 20);
      ctx.fillStyle = '#4A5A4E'; ctx.fillRect(b.x - 16, a, 32, e - a); ctx.fillStyle = '#6E7A70'; for (let y = Math.floor(a / 14) * 14; y < e; y += 14) { ctx.beginPath(); ctx.arc(b.x - 14, y + 4, 3, 0, TAU); ctx.arc(b.x + 14, y + 11, 3, 0, TAU); ctx.fill(); }
      const g = ctx.createLinearGradient(b.x - 11, 0, b.x + 11, 0); g.addColorStop(0, '#2A6E9E'); g.addColorStop(0.5, '#3A8CC4'); g.addColorStop(1, '#2A6E9E'); ctx.fillStyle = g; ctx.fillRect(b.x - 11, a, 22, e - a);
      ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.4; const ph = (gt * 26) % 28; if (gsPass === 0) for (let y = Math.floor(a / 28) * 28 + ph; y < e; y += 28) { ctx.beginPath(); ctx.moveTo(b.x - 6, y); ctx.quadraticCurveTo(b.x, y + 5, b.x + 6, y); ctx.stroke(); }
      ctx.strokeStyle = '#5E7A3A'; ctx.lineWidth = 2; if (gsPass !== 1) for (let y = Math.floor(a / 46) * 46 + 10; y < e; y += 46) { const sx = (y / 46) % 2 ? b.x - 15 : b.x + 15; ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + Math.sin(gt + y) * 1.5, y - 13); ctx.moveTo(sx + 3, y); ctx.lineTo(sx + 4, y - 10); ctx.stroke(); }
      if (b.y0 > RIVER.y1 || b.y1 < RIVER.y0) { const sy = b.y0 < RIVER.y0 ? b.y0 : b.y1; if (b.y1 !== RIVER.y0 && b.y0 !== RIVER.y1) { ctx.fillStyle = '#8A929C'; ell(b.x, sy, 18, 9); ctx.fill(); ctx.fillStyle = '#5E7FA0'; ell(b.x, sy, 11, 5); ctx.fill(); } else { ctx.fillStyle = '#3E4650'; ctx.fillRect(b.x - 16, b.y0 > RIVER.y1 ? b.y1 - 6 : b.y0 - 2, 32, 8); } } // Quelle oder Rohr
    }
  }
  function drawCityGround() {
    const x0 = Math.max(0, viewX0), x1 = Math.min(WW, viewX1), y0 = Math.max(YMIN, viewY0), y1 = Math.min(WH, viewY1); if (x1 <= x0 || y1 <= y0) return;
    for (const z of GROUNDS) drawGroundZone(z, x0, x1, y0, y1);
    drawRiverBand(x0, x1, y0, y1); drawBrooks();
    drawRoads(x0, x1, y0, y1);
    drawParkPaths();
  }
  function drawBench(b) { // v147: Parkbank mit Lehne, Latten und Metallfuessen
    const hor = b.w > b.h, L = hor ? b.w : b.h, D = hor ? b.h : b.w;
    ctx.save(); ctx.translate(b.x, b.y); if (!hor) ctx.rotate(Math.PI / 2);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-L / 2 + 2, -D / 2 + 3, L, D + 1);
    ctx.fillStyle = '#2A2F38'; for (const fx of [-L / 2 + 3, L / 2 - 6]) { ctx.fillRect(fx, -D / 2 - 1, 3, D + 3); ctx.fillStyle = '#4A5260'; ctx.fillRect(fx, -D / 2 - 1, 1, D + 3); ctx.fillStyle = '#2A2F38'; }
    const n = 3, sh = (D - 4) / (n + 1);
    for (let k = 0; k < n; k++) { const yy = -D / 2 + 3 + sh * (k + 1) - 0.5; const g = ctx.createLinearGradient(0, yy, 0, yy + sh - 1); g.addColorStop(0, '#C08850'); g.addColorStop(1, '#8A5A30'); ctx.fillStyle = g; ctx.fillRect(-L / 2 + 1, yy, L - 2, sh - 1); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-L / 2 + 1, yy, L - 2, 0.8); ctx.fillStyle = 'rgba(70,40,20,.35)'; ctx.fillRect(-L / 2 + 6 + k * 5, yy + sh * 0.45, 4, 0.5); }
    const g2 = ctx.createLinearGradient(0, -D / 2 - 1, 0, -D / 2 + sh); g2.addColorStop(0, '#9A6A3A'); g2.addColorStop(1, '#6A4422'); ctx.fillStyle = g2; ctx.fillRect(-L / 2, -D / 2 - 1, L, sh + 0.5); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-L / 2, -D / 2 - 1, L, 0.8);
    ctx.fillStyle = '#3A404A'; for (const fx of [-L / 2 - 0.5, L / 2 - 2.5]) { ctx.fillRect(fx, -D / 2 - 1.5, 3, D + 2); } ctx.fillStyle = '#6A7380'; for (const fx of [-L / 2 - 0.5, L / 2 - 2.5]) ctx.fillRect(fx, -D / 2 - 1.5, 3, 1);
    ctx.restore();
  }
  function drawFences() {
    for (const f of FENCES) {
      if (f.x + f.w < viewX0 || f.x > viewX1 || f.y + f.h < viewY0 || f.y > viewY1) continue;
      const hor = f.w > f.h; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(f.x + 2, f.y + 3, f.w, f.h);
      ctx.fillStyle = 'rgba(170,182,196,.55)'; ctx.fillRect(f.x, f.y + (hor ? 1 : 0), f.w, hor ? 2 : f.h); if (!hor) ctx.fillRect(f.x + 1, f.y, 2, f.h);
      ctx.fillStyle = '#8C96A3'; if (hor) for (let x = f.x; x <= f.x + f.w; x += 24) ctx.fillRect(x - 1.5, f.y - 2, 3, 7); else for (let y = f.y; y <= f.y + f.h; y += 24) ctx.fillRect(f.x - 1, y - 1.5, 6, 3);
    }
  }
  function drawGraffiti(g) { // freie Tags, keine echten Namen
    const tags = [['KELLER', '#FF5CA8', '#5CF2FF'], ['GRÜN', '#63FF9A', '#B36BFF'], ['SKATE', '#FFD84B', '#FF5C5C'], ['LOOP', '#5CB8FF', '#FFB547']];
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(g.x + 3, g.y + 4, g.w, g.h + 18);
    ctx.fillStyle = '#8A8F96'; ctx.fillRect(g.x, g.y - 18, g.w, g.h + 18); ctx.fillStyle = '#6E737A'; ctx.fillRect(g.x, g.y + g.h - 4, g.w, 4);
    ctx.save(); ctx.beginPath(); ctx.rect(g.x, g.y - 18, g.w, g.h + 18); ctx.clip();
    for (let k = 0; k < 2; k++) {
      const t = tags[(g.s * 2 + k) % tags.length], cx = g.x + g.w * (0.27 + k * 0.48), cy = g.y - 3;
      ctx.fillStyle = t[2]; ctx.globalAlpha = 0.5; ell(cx, cy, 52, 14); ctx.fill(); ctx.globalAlpha = 1;
      ctx.font = '900 italic 17px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#14161C'; ctx.strokeText(t[0], cx, cy); ctx.fillStyle = t[1]; ctx.fillText(t[0], cx, cy);
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.strokeText(t[0], cx - 1, cy - 1);
      for (let d = 0; d < 4; d++) { ctx.fillStyle = t[1]; ctx.fillRect(cx - 30 + d * 19, cy + 6, 2, 4 + (d * 5) % 7); } // Farbnasen
    }
    ctx.fillStyle = '#FF5C5C'; ctx.beginPath(); ctx.arc(g.x + g.w - 16, g.y - 10, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#14161C'; ctx.fillRect(g.x + g.w - 18, g.y - 12, 1.5, 1.5); ctx.fillRect(g.x + g.w - 15, g.y - 12, 1.5, 1.5);
    ctx.restore(); ctx.lineJoin = 'miter'; ctx.textBaseline = 'alphabetic';
  }
  // Ein paar Skater drehen schon ihre Runden (nur Deko, spaeter kommen hier Kunden dazu)
  const SKATERS = [{ k: 0, look: Object.assign({}, DEF_LOOK, { r: 224, g: 84, b: 84, hat: 'backcap', top: 'hoodie' }) }, { k: 1, look: Object.assign({}, DEF_LOOK, { r: 80, g: 200, b: 194, hat: 'beanie', sex: 'f', hs: 1 }) }, { k: 2, look: Object.assign({}, DEF_LOOK, { r: 240, g: 194, b: 78, top: 'tshirt', hs: 12 }) }];
  function skaterPos(s) {
    const t = gt + s.k * 2.1;
    if (s.k === 0) { const u = Math.sin(t * 1.3); return { x: HALFPIPE.x + HALFPIPE.w / 2 + u * (HALFPIPE.w / 2 - 22), y: HALFPIPE.y + HALFPIPE.h / 2, a: Math.cos(t * 1.3) > 0 ? 0 : Math.PI, up: Math.abs(u) }; }
    if (s.k === 1) { const a = t * 0.9, cx = BOWL.x + BOWL.w / 2, cy = BOWL.y + BOWL.h / 2; return { x: cx + Math.cos(a) * (BOWL.w / 2 - 26), y: cy + Math.sin(a) * (BOWL.h / 2 - 24), a: a + Math.PI / 2, up: 0.3 + 0.3 * Math.sin(a * 2) }; }
    const u = (t * 0.22) % 1, x0 = FUNBOX.x - 60, x1 = FUNBOX.x + FUNBOX.w + 60, fw = u < 0.5; return { x: fw ? x0 + (x1 - x0) * u * 2 : x1 - (x1 - x0) * (u - 0.5) * 2, y: FUNBOX.y + FUNBOX.h / 2 + 46, a: fw ? 0 : Math.PI, up: 0 };
  }
  function drawSkatepark() {
    const S0 = SKATE; if (!inView(S0.x + S0.w / 2, S0.y + S0.h / 2, 420)) return;
    // Halfpipe: zwei Rampen mit Kante und Flat dazwischen
    const H0 = HALFPIPE; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(H0.x + 5, H0.y + 7, H0.w, H0.h);
    const g = ctx.createLinearGradient(H0.x, 0, H0.x + H0.w, 0); g.addColorStop(0, '#9AA3AD'); g.addColorStop(0.22, '#C9CED6'); g.addColorStop(0.5, '#D9DEE5'); g.addColorStop(0.78, '#C9CED6'); g.addColorStop(1, '#9AA3AD');
    ctx.fillStyle = g; ctx.fillRect(H0.x, H0.y, H0.w, H0.h); ctx.fillStyle = '#5E6670'; ctx.fillRect(H0.x, H0.y, 14, H0.h); ctx.fillRect(H0.x + H0.w - 14, H0.y, 14, H0.h);
    ctx.fillStyle = '#E8B84A'; ctx.fillRect(H0.x + 13, H0.y, 3, H0.h); ctx.fillRect(H0.x + H0.w - 16, H0.y, 3, H0.h); // Coping
    ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let x = H0.x + 30; x < H0.x + H0.w - 20; x += 22) ctx.fillRect(x, H0.y, 1, H0.h);
    // Bowl
    const B0 = BOWL; ctx.fillStyle = '#5E6670'; rr(B0.x - 4, B0.y - 4, B0.w + 8, B0.h + 8, 60); ctx.fill();
    const gb = ctx.createRadialGradient(B0.x + B0.w / 2, B0.y + B0.h / 2, 10, B0.x + B0.w / 2, B0.y + B0.h / 2, B0.w / 2); gb.addColorStop(0, '#9AA3AD'); gb.addColorStop(1, '#C9CED6');
    ctx.fillStyle = gb; rr(B0.x, B0.y, B0.w, B0.h, 56); ctx.fill(); ctx.strokeStyle = '#E8B84A'; ctx.lineWidth = 3; rr(B0.x, B0.y, B0.w, B0.h, 56); ctx.stroke();
    // Funbox mit Rail und zwei Quarterpipes an der Seite
    const F0 = FUNBOX; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(F0.x + 4, F0.y + 5, F0.w, F0.h);
    ctx.fillStyle = '#8A929C'; ctx.fillRect(F0.x, F0.y, F0.w, F0.h); ctx.fillStyle = '#B5BCC5'; ctx.fillRect(F0.x + 22, F0.y + 6, F0.w - 44, F0.h - 12);
    ctx.fillStyle = '#E8ECF2'; ctx.fillRect(F0.x + 10, F0.y + F0.h / 2 - 1.5, F0.w - 20, 3); ctx.fillStyle = '#3A3F47'; for (const x of [F0.x + 16, F0.x + F0.w - 18]) ctx.fillRect(x, F0.y + F0.h / 2 - 4, 2, 8);
    for (const [x, y, w] of [[S0.x + 470, S0.y + 470, 120], [S0.x + 24, S0.y + 300, 90]]) { ctx.fillStyle = '#7E8690'; ctx.fillRect(x, y, w, 22); ctx.fillStyle = '#B5BCC5'; ctx.fillRect(x, y + 4, w, 18); ctx.fillStyle = '#E8B84A'; ctx.fillRect(x, y, w, 3); }
    ctx.fillStyle = '#E8ECF2'; ctx.fillRect(S0.x + 160, S0.y + 470, 140, 3); ctx.fillStyle = '#3A3F47'; for (const x of [S0.x + 170, S0.x + 230, S0.x + 290]) ctx.fillRect(x, S0.y + 468, 2, 8); // Flatrail
    GRAFF.forEach(drawGraffiti);
    // Schild am Eingang
    ctx.fillStyle = '#20262E'; rr(3005 - 52, S0.y + 12, 104, 20, 5); ctx.fill(); ctx.fillStyle = '#FF5CA8'; ctx.font = '900 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SKATERPARK', 3005, S0.y + 22.5); ctx.textBaseline = 'alphabetic';
    if (state !== 'edit') for (const s of SKATERS) { const p = skaterPos(s); if (!inView(p.x, p.y, 30)) continue; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-12, -3, 26, 9); ctx.fillStyle = '#3A2A20'; rr(-13, -4.5, 26, 9, 4); ctx.fill(); ctx.fillStyle = '#E8E2D0'; for (const wx of [-8, 8]) { ctx.fillRect(wx - 1.5, -6, 3, 2.5); ctx.fillRect(wx - 1.5, 3.5, 3, 2.5); } ctx.restore(); const sc = 1 + p.up * 0.12; ctx.save(); ctx.translate(p.x, p.y); ctx.scale(sc, sc); drawFigure(0, 0, p.a, gt * 2, s.look); ctx.restore(); }
  }
  function drawPlayground() {
    const P0 = PLAY; if (!inView(P0.x + P0.w / 2, P0.y + P0.h / 2, 360)) return;
    ctx.fillStyle = '#C9A866'; rr(2000, 1620, 120, 60, 10); ctx.fill(); ctx.fillStyle = '#8A6A3A'; ctx.lineWidth = 4; ctx.strokeStyle = '#8A6A3A'; rr(2000, 1620, 120, 60, 10); ctx.stroke(); // Sandkasten
    ctx.fillStyle = '#E05555'; ctx.beginPath(); ctx.arc(2030, 1645, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#4B8DFF'; ctx.fillRect(2080, 1650, 10, 8);
    for (const p of PLAYEQ) {
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(p.x + 4, p.y + 5, p.w, p.h);
      if (p.t === 'swing') { ctx.fillStyle = '#E05555'; ctx.fillRect(p.x, p.y + 9, p.w, 6); ctx.fillStyle = '#9A2F2F'; ctx.fillRect(p.x, p.y, 6, p.h); ctx.fillRect(p.x + p.w - 6, p.y, 6, p.h); for (let k = 0; k < 2; k++) { const sx = p.x + 30 + k * 46 + Math.sin(gt * 2 + k) * 4; ctx.strokeStyle = '#3A3F47'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x + 30 + k * 46, p.y + 12); ctx.lineTo(sx, p.y + 30); ctx.stroke(); ctx.fillStyle = '#F2C14E'; ctx.fillRect(sx - 7, p.y + 28, 14, 5); } }
      else if (p.t === 'slide') { ctx.fillStyle = '#3F8A58'; ctx.fillRect(p.x, p.y, p.w, 26); ctx.fillStyle = '#F2C14E'; ctx.fillRect(p.x + 8, p.y + 26, p.w - 16, p.h - 26); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(p.x + 12, p.y + 26, 4, p.h - 26); ctx.fillStyle = '#9AA6B3'; for (let y = p.y + 4; y < p.y + 24; y += 6) ctx.fillRect(p.x + 4, y, p.w - 8, 2); }
      else if (p.t === 'climb') { ctx.fillStyle = '#8A5A32'; ctx.fillRect(p.x, p.y, p.w, p.h); ctx.fillStyle = '#B57A45'; ctx.fillRect(p.x + 6, p.y + 6, p.w - 12, p.h - 12); ctx.fillStyle = '#4B8DFF'; ctx.beginPath(); ctx.moveTo(p.x - 4, p.y + 8); ctx.lineTo(p.x + p.w / 2, p.y - 12); ctx.lineTo(p.x + p.w + 4, p.y + 8); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#E8E2D0'; ctx.lineWidth = 1.5; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(p.x + 6, p.y + k * p.h / 4); ctx.lineTo(p.x + p.w - 6, p.y + k * p.h / 4); ctx.stroke(); } }
      else { const tl = Math.sin(gt * 1.6) * 4; ctx.fillStyle = '#5E6670'; ctx.fillRect(p.x + p.w / 2 - 5, p.y - 2, 10, p.h + 4); ctx.save(); ctx.translate(p.x + p.w / 2, p.y + p.h / 2); ctx.rotate(tl * 0.02); ctx.fillStyle = '#B36BFF'; ctx.fillRect(-p.w / 2, -4, p.w, 8); ctx.fillStyle = '#F2C14E'; ctx.fillRect(-p.w / 2 + 2, -6, 8, 12); ctx.fillRect(p.w / 2 - 10, -6, 8, 12); ctx.restore(); }
    }
    ctx.fillStyle = '#20262E'; rr(2041 - 46, P0.y + 10, 92, 18, 5); ctx.fill(); ctx.fillStyle = '#F2C14E'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('SPIELPLATZ', 2041, P0.y + 19.5); ctx.textBaseline = 'alphabetic';
  }
  function drawPitchProps() {
    const P0 = PITCH; if (!inView(P0.x + P0.w / 2, P0.y + P0.h / 2, 420)) return;
    for (const g of PGOALS) { const left = g.x < P0.x + P0.w / 2; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(g.x + 3, g.y + 4, g.w, g.h); ctx.fillStyle = 'rgba(235,240,245,.35)'; ctx.fillRect(g.x, g.y, g.w, g.h); ctx.strokeStyle = 'rgba(235,240,245,.5)'; ctx.lineWidth = 1; for (let y = g.y + 6; y < g.y + g.h; y += 6) { ctx.beginPath(); ctx.moveTo(g.x, y); ctx.lineTo(g.x + g.w, y); ctx.stroke(); } ctx.fillStyle = '#F4F6F8'; ctx.fillRect(left ? g.x + g.w - 3 : g.x, g.y - 2, 3, g.h + 4); ctx.fillRect(g.x, g.y - 2, g.w, 3); ctx.fillRect(g.x, g.y + g.h - 1, g.w, 3); }
    const bx = P0.x + P0.w / 2 + Math.sin(gt * 0.7) * 120, by = P0.y + P0.h / 2 + Math.sin(gt * 1.1) * 60; ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(bx + 2, by + 4, 5, 2); ctx.fill(); ctx.fillStyle = '#F4F6F8'; ctx.beginPath(); ctx.arc(bx, by, 4.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#14161C'; ctx.beginPath(); ctx.arc(bx + 1, by - 1, 1.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#20262E'; rr(3910 - 44, P0.y + P0.h - 30, 88, 18, 5); ctx.fill(); ctx.fillStyle = '#7FD08A'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BOLZPLATZ', 3910, P0.y + P0.h - 20.5); ctx.textBaseline = 'alphabetic';
  }
  function drawDogPark() {
    const D0 = DOGS; if (!inView(D0.x + D0.w / 2, D0.y + D0.h / 2, 360)) return;
    for (const [x, y] of [[2000, 2340], [2090, 2350], [2300, 2360]]) { ctx.fillStyle = '#E8833A'; ctx.fillRect(x - 2, y - 10, 4, 14); ctx.fillRect(x + 34, y - 10, 4, 14); ctx.fillStyle = '#F4F4F8'; ctx.fillRect(x - 2, y - 8, 40, 3); }
    ctx.fillStyle = '#3F6BA8'; rr(2310, 2470, 90, 26, 13); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.35)'; ell(2312, 2483, 6, 11); ctx.fill(); // Tunnel
    ctx.fillStyle = '#8A5A32'; ctx.fillRect(1980, 2440, 36, 30); ctx.fillStyle = '#B5473A'; ctx.beginPath(); ctx.moveTo(1976, 2442); ctx.lineTo(1998, 2426); ctx.lineTo(2020, 2442); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#20150F'; ctx.beginPath(); ctx.arc(1998, 2462, 7, Math.PI, TAU); ctx.fill(); ctx.fillRect(1991, 2462, 14, 8); // Hundehuette
    const t = gt * 0.8, hx = 2190 + Math.cos(t) * 150, hy = 2420 + Math.sin(t * 1.4) * 70; ctx.save(); ctx.translate(hx, hy); ctx.scale(Math.cos(t) < 0 ? 1 : -1, 1); ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 5, 9, 3); ctx.fill(); ctx.fillStyle = '#B07A45'; ell(0, 0, 9, 5); ctx.fill(); ctx.beginPath(); ctx.arc(8, -3, 4.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#6A4626'; ell(10, -6, 2, 3); ctx.fill(); ctx.strokeStyle = '#B07A45'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-8, -1); ctx.lineTo(-12, -5 + Math.sin(gt * 14) * 2); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#20262E'; rr(2190 - 48, D0.y + 10, 96, 18, 5); ctx.fill(); ctx.fillStyle = '#C9A064'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('HUNDEWIESE', 2190, D0.y + 19.5); ctx.textBaseline = 'alphabetic';
  }
  function drawTreff() { // Kellertreff: Treppe hinunter zu den Kellern deiner Freunde
    const T0 = TREFF; if (!inView(T0.x + T0.w / 2, T0.y, 90)) return;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(T0.x + 3, T0.y + 4, T0.w, T0.h);
    ctx.fillStyle = '#4E5762'; ctx.fillRect(T0.x - 3, T0.y - 3, T0.w + 6, T0.h + 6);
    for (let k = 0; k < 6; k++) { const c = 70 - k * 11; ctx.fillStyle = 'rgb(' + c + ',' + (c + 6) + ',' + (c + 14) + ')'; ctx.fillRect(T0.x, T0.y + k * T0.h / 6, T0.w, T0.h / 6 + 0.5); }
    ctx.fillStyle = '#9AA6B3'; ctx.fillRect(T0.x - 3, T0.y - 3, 3, T0.h + 6); ctx.fillRect(T0.x + T0.w, T0.y - 3, 3, T0.h + 6);
    const on = mp.on && mp.slots.some(Boolean), pulse = 0.6 + 0.4 * Math.sin(gt * 3);
    ctx.fillStyle = '#20262E'; ctx.fillRect(T0.x + T0.w + 10, T0.y - 30, 3, 44); rr(T0.x - 18, T0.y - 46, T0.w + 36, 18, 5); ctx.fill();
    ctx.fillStyle = on ? 'rgba(255,181,71,' + pulse.toFixed(2) + ')' : '#8A93A3'; ctx.font = '900 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('KELLERTREFF', T0.x + T0.w / 2, T0.y - 36.5); ctx.textBaseline = 'alphabetic';
    { const aw = mp.on ? friendsAway() : []; if (aw.length) pill(aw.slice(0, 3).map(f => f.name).join(', ') + (aw.length > 3 ? ' +' + (aw.length - 3) : '') + ' im Keller', T0.x + T0.w / 2, T0.y - 60, '#FFB547'); }
  }
  function drawPark() {
    // Brunnen mit drei Becken
    if (gsPass !== 1 && inView(FOUNTAIN.x, FOUNTAIN.y, 80)) {
      const f = FOUNTAIN;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.arc(f.x + 4, f.y + 6, f.r + 2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8B97A5'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r + 2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#5E6A78'; ctx.beginPath(); ctx.arc(f.x, f.y, f.r - 4, 0, TAU); ctx.fill();
      const wg = ctx.createRadialGradient(f.x, f.y, 4, f.x, f.y, f.r - 8); wg.addColorStop(0, '#7FC8F0'); wg.addColorStop(1, '#3E8FC8'); ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(f.x, f.y, f.r - 8, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 3; i++) { const k = ((gt * 0.5 + i / 3) % 1); ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(f.x, f.y, 12 + k * (f.r - 20), 0, TAU); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.fillStyle = '#9AA6B3'; ctx.beginPath(); ctx.arc(f.x, f.y, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#B9C3CE'; ctx.beginPath(); ctx.arc(f.x, f.y, 6, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(190,230,255,.85)'; for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + gt * 0.4, rr2 = 8 + ((gt * 1.5 + k / 6) % 1) * 9; ctx.beginPath(); ctx.arc(f.x + Math.cos(a) * rr2, f.y + Math.sin(a) * rr2 - 2, 1.6, 0, TAU); ctx.fill(); }
      const h = 4 + Math.sin(gt * 3) * 1.2; ctx.beginPath(); ctx.arc(f.x, f.y - 3, h, 0, TAU); ctx.fill();
    }
    // Teich mit Seerosen und Schilf
    if (gsPass !== 1 && inView(POND.x + POND.w / 2, POND.y + POND.h / 2, 180)) {
      const p = POND, cx = p.x + p.w / 2, cy = p.y + p.h / 2;
      ctx.fillStyle = seaSnow() ? '#7D8E9C' : '#3B4A3A'; ell(cx, cy, p.w / 2 + 6, p.h / 2 + 6); ctx.fill();
      if (seaSnow()) { // v154: Teich im Winter zugefroren
        const ig = ctx.createRadialGradient(cx - 30, cy - 14, 10, cx, cy, p.w / 2); ig.addColorStop(0, '#D8EEF8'); ig.addColorStop(1, '#8DB6CF'); ctx.fillStyle = ig; ell(cx, cy, p.w / 2, p.h / 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (const [a1, a2, l] of [[-0.4, 0.3, 60], [2.2, 1.7, 48], [3.6, 4.1, 40], [5.2, 4.8, 52]]) { const sx = cx + Math.cos(a1) * 18, sy = cy + Math.sin(a1) * 10; ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a1) * l * 0.5, sy + Math.sin(a1) * l * 0.3); ctx.lineTo(sx + Math.cos(a2) * l, sy + Math.sin(a2) * l * 0.55); } ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(cx - 40, cy - 12, 34, 7); ctx.fill(); ell(cx + 36, cy + 16, 26, 5); ctx.fill();
        ctx.fillStyle = '#20262E'; rr(cx - 26, p.y - 18, 52, 14, 4); ctx.fill(); ctx.fillStyle = '#BFE6FF'; ctx.font = '800 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TEICH', cx, p.y - 10.5); ctx.textBaseline = 'alphabetic';
      } else {
      const pg = ctx.createRadialGradient(cx - 20, cy - 10, 10, cx, cy, p.w / 2); pg.addColorStop(0, '#3E8FC8'); pg.addColorStop(1, '#245E8A'); ctx.fillStyle = pg; ell(cx, cy, p.w / 2, p.h / 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1.5; for (let k = 0; k < 4; k++) { const ox = cx - 70 + k * 45, oy = cy - 20 + (k % 2) * 30 + Math.sin(gt + k) * 2; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.quadraticCurveTo(ox + 8, oy - 4, ox + 16, oy); ctx.stroke(); }
      for (const [dx, dy] of [[-80, 20], [-30, -30], [40, 26], [70, -16]]) { ctx.fillStyle = '#3F8A4A'; ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 7, 0.3, TAU - 0.3); ctx.lineTo(cx + dx, cy + dy); ctx.fill(); ctx.fillStyle = '#F28BB0'; ctx.beginPath(); ctx.arc(cx + dx + 2, cy + dy - 1, 2.2, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#5E7A3A'; ctx.lineWidth = 2; for (let k = 0; k < 9; k++) { const a = 2.4 + k * 0.12, x = cx + Math.cos(a) * (p.w / 2 - 2), y = cy + Math.sin(a) * (p.h / 2 - 2); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2 + Math.sin(gt + k) * 1.5, y - 14); ctx.stroke(); }
      ctx.fillStyle = '#20262E'; rr(cx - 26, p.y - 18, 52, 14, 4); ctx.fill(); ctx.fillStyle = '#7FC8F0'; ctx.font = '800 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TEICH', cx, p.y - 10.5); ctx.textBaseline = 'alphabetic';
    } }
    // Blumenbeete am Park
    const bed = (x, y) => { ctx.fillStyle = '#2B1F18'; ell(x, y, 22, 8); ctx.fill(); for (let k = 0; k < 7; k++) { ctx.fillStyle = ['#F28BB0', '#F6E27A', '#F4F4F8', '#B9A0FF'][k % 4]; ctx.beginPath(); ctx.arc(x - 16 + k * 5.4, y - 2 + Math.sin(k * 2.1) * 3, 2, 0, TAU); ctx.fill(); } };
    if (gsPass !== 2) { [[1186, 760], [1346, 760], [1186, 1268], [1346, 1268], [826, 980], [826, 1050], [1706, 980], [1706, 1050]].forEach(([x, y]) => { if (inView(x, y, 40)) bed(x, y); });
    for (const b of BENCHES) if (inView(b.x, b.y, 40)) drawBench(b); }
    if (gsPass !== 2) for (const s of SHEDS) { if (!inView(s.x + s.w / 2, s.y + s.h / 2, 60)) continue; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(s.x + 4, s.y + 5, s.w, s.h); ctx.fillStyle = s.c; ctx.fillRect(s.x, s.y, s.w, s.h); ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(s.x, s.y, s.w, s.h * 0.5); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(s.x, s.y, s.w, 2); ctx.fillStyle = '#20150F'; ctx.fillRect(s.x + s.w / 2 - 6, s.y + s.h - 14, 12, 14); }
    if (gsPass !== 1) { drawFences(); drawSkatepark(); drawPlayground(); drawPitchProps(); drawDogPark(); }
  }
  // Haeuser: Fassade mit Tuer zur Strasse, Satteldach, Walmdach oder Flachdach
  function houseWins(h) { const up = h.face === -1, fh = h.h * 0.36, wy = up ? h.y + fh * 0.52 : h.y + h.h - fh * 0.48; return [[h.x + 30, wy], [h.x + h.w - 30, wy]]; }
  // v135: fertig gezeichnete Häuser und Gebäude als Bild zwischenspeichern (spart tausende Zeichenbefehle pro Bild)
  // v138: ein gemeinsamer, abgesicherter Bildspeicher für Häuser, Bäume und Bodenkacheln.
  // Feste Obergrenze an Bildpunkten, freigegebene Bilder werden sofort auf 0 x 0 gesetzt (Safari gibt Speicher sonst zu spät frei),
  // und bei jedem Fehler schaltet sich der Speicher ab und es wird wie früher live gezeichnet. So kann nie wieder ein Bild leer bleiben.
  const CACHE = new Map(), CB = { px: 0, max: 16e6, fail: false };
  let gsPass = 0; // v136: 0 = alles zeichnen, 1 = nur Unbewegliches (für die Bodenkacheln), 2 = nur Bewegtes (live über den Kacheln)
  const curR = (mx) => { const tr = ctx.getTransform ? ctx.getTransform() : null; return tr && tr.a > 0 ? clamp(Math.round(Math.hypot(tr.a, tr.b) * 100) / 100, 1, mx) : 0; }; // v157: genau die Bildschirmauflösung, dann wird 1:1 gezeichnet (statt verkleinert)
  function cvFree(c) { try { c.width = 0; c.height = 0; } catch (e) {} }
  function cacheDrop(k) { const e = CACHE.get(k); if (!e) return; CACHE.delete(k); CB.px -= e.px; cvFree(e.c); }
  function cacheClear(pre) { for (const k of Array.from(CACHE.keys())) if (!pre || k.startsWith(pre)) cacheDrop(k); if (!pre) CB.px = 0; }
  function cacheFail() { CB.fail = true; bcOff = true; cacheClear(); }
  function cacheGet(k) { const e = CACHE.get(k); if (!e) return null; CACHE.delete(k); CACHE.set(k, e); return e.c; }
  function cacheMake(k, w, h, R, x0, y0, fn) { // zeichnet fn in ein neues Bild; null, wenn das nicht geht
    if (CB.fail) return null; const pw = Math.max(1, Math.ceil(w * R)), ph = Math.max(1, Math.ceil(h * R)), px = pw * ph; if (px > CB.max / 3) return null;
    while (CB.px + px > CB.max && CACHE.size) cacheDrop(CACHE.keys().next().value);
    let c; try { c = document.createElement('canvas'); c.width = pw; c.height = ph; } catch (e) { return null; }
    const x = c.getContext && c.getContext('2d'); if (!x || !x.setTransform || c.width !== pw || c.height !== ph) { cvFree(c); return null; }
    x.setTransform(R, 0, 0, R, -x0 * R, -y0 * R); const s0 = ctx; ctx = x; try { fn(); } catch (e) { ctx = s0; cvFree(c); return null; } ctx = s0;
    CACHE.set(k, { c, px }); CB.px += px; return c;
  }
  function cacheBlit(c, a) { try { ctx.drawImage.apply(ctx, [c].concat(a)); return true; } catch (e) { cacheFail(); return false; } }
  let sprR = 0, bcR = 0;
  function sprDraw(key, x0, y0, w, h, fn) { // v136: kleine Einzelbilder (Baumkronen)
    if (bcOff || !document.createElement) { fn(); return; } const R = curR(2.5); if (!R) { fn(); return; } sprR = R;
    const k = 's|' + key + '@' + R; let c = cacheGet(k) || cacheMake(k, w, h, R, x0, y0, fn); if (!c) { fn(); return; } if (!cacheBlit(c, [x0, y0, w, h])) fn(); // v157: jeder Maßstab hat eigene Bilder, nichts wird mehr verworfen
  }
  // v136: Bodenkacheln: Boden, Straßen, Wege, Büsche, Grasbüschel, Blumen, Beete, Bänke, Hydranten als fertige Bilder (256 x 256 Welt-Einheiten)
  const GTS = 256, GTP = 6; let gtlR = 0;
  const gtlKey = () => (KR_NEUTRAL || !G ? 'n' : seasonI()) + (state === 'edit' ? 'e' : '');
  function gtlDraw(x0, y0, S) { // zeichnet den unbeweglichen Boden für eine Kachel
    const v = [viewX0, viewX1, viewY0, viewY1]; viewX0 = x0 - 2; viewX1 = x0 + S + 2; viewY0 = y0 - 2; viewY1 = y0 + S + 2; gsPass = 1;
    try { ctx.fillStyle = '#17261F'; ctx.fillRect(x0, y0, S, S); if (viewX1 > 0) drawCityGround(); if (viewX1 > 0 && (viewY0 < YMIN || viewY1 > WH)) drawOutside(); drawPaths(); drawMapGround(); drawBushes(); drawAmbientGround(); drawDetailsGround(); drawExtrasGround(); vqDrawFlat(); drawPark(); }
    finally { gsPass = 0; [viewX0, viewX1, viewY0, viewY1] = v; }
  }
  function gtlClear() { cacheClear('g|'); }
  // v154: Jahreszeiten deutlich auf der Karte: jede fertige Bodenkachel wird einmal umgefärbt (Winter: Schnee, Herbst: Laub, Frühling: frisch, Sommer: sattgelb).
  // Läuft nur beim Erzeugen einer Kachel, danach kostet es nichts mehr. Geht etwas schief, bleibt die Kachel einfach wie sie ist.
  const seaSnow = () => !KR_NEUTRAL && !!G && seasonI() === 3 && state !== 'edit';
  function seasonPx(c, si) {
    if (typeof si !== 'number') return; let x, d; try { x = c.getContext('2d'); d = x.getImageData(0, 0, c.width, c.height); } catch (e) { return; }
    const p = d.data, W = c.width, n = p.length, Q = Math.max(1, Math.round(W / 268)); // Q: Bildpunkte je Welt-Einheit (Muster bleibt bei jeder Auflösung gleich groß)
    const hsh = (u, v) => ((u * 73856093) ^ (v * 19349663)) >>> 0;
    for (let i = 0, px = 0, py = 0; i < n; i += 4, ++px === W && (px = 0, py++)) { const r = p[i], g = p[i + 1], b = p[i + 2], gr = g - (r > b ? r : b), L = r * 0.3 + g * 0.59 + b * 0.11;
      if (si === 3) { // Winter: Schneelandschaft
        if (gr > 3) { const h = hsh(px, py), t = L < 12 ? 0.12 : L > 50 ? 1 : 0.12 + (L - 12) / 38 * 0.88, j = (h & 7) - 3;
          if ((h & 2047) < 3) { p[i] = 246; p[i + 1] = 250; p[i + 2] = 255; } else { p[i] = 132 + t * 80 + j; p[i + 1] = 148 + t * 74 + j; p[i + 2] = 176 + t * 58 + j; } }
        else if (b > r + 25 && b > g) { p[i] = r + (176 - r) * 0.3; p[i + 1] = g + (208 - g) * 0.3; p[i + 2] = b + (230 - b) * 0.3; }
        else if (r > b + 6 && r >= g && r - b < 70 && L < 120) { p[i] = r + (182 - r) * 0.55; p[i + 1] = g + (190 - g) * 0.55; p[i + 2] = b + (204 - b) * 0.55; }
        else if (Math.abs(r - g) < 22 && Math.abs(g - b) < 26) { const k = L > 70 ? 0.6 : L > 44 ? 0.45 : 0.1; p[i] = r + (206 - r) * k; p[i + 1] = g + (216 - g) * k; p[i + 2] = b + (230 - b) * k; }
        continue; }
      if (gr <= 3) continue;
      if (si === 2) { // Herbst: welkes Gras mit Laubflecken
        const S = 11 * Q, bx = px / S | 0, by = py / S | 0, h = hsh(bx, by);
        if ((h & 255) < 46) { const cx = bx * S + 2 * Q + (h >> 8) % (7 * Q), cy = by * S + 2 * Q + (h >> 12) % (7 * Q), dx = px - cx, dy = (py - cy) * 1.6, rr2 = 2.3 * Q;
          if (dx * dx + dy * dy < rr2 * rr2) { const lc = [[206, 108, 40], [178, 66, 34], [222, 164, 50], [150, 86, 40]][h % 4], f = 0.62 + L / 150; p[i] = lc[0] * f; p[i + 1] = lc[1] * f; p[i + 2] = lc[2] * f; continue; } }
        p[i] = r + gr * 0.8; p[i + 1] = g - gr * 0.08; p[i + 2] = b - gr * 0.3; }
      else if (si === 0) { // Frühling: frisches Grün mit Blütenpunkten
        const S = 9 * Q, bx = px / S | 0, by = py / S | 0, h = hsh(bx, by);
        if ((h & 255) < 22) { const cx = bx * S + 2 * Q + (h >> 8) % (5 * Q), cy = by * S + 2 * Q + (h >> 12) % (5 * Q), dx = px - cx, dy = py - cy;
          if (dx * dx + dy * dy < 1.4 * Q * 1.4 * Q) { const lc = [[250, 250, 252], [255, 176, 206], [255, 226, 110]][h % 3]; p[i] = lc[0]; p[i + 1] = lc[1]; p[i + 2] = lc[2]; continue; } }
        p[i] = r - gr * 0.2; p[i + 1] = g + gr * 0.7; p[i + 2] = b + gr * 0.1; }
      else { p[i] = r + gr * 0.35; p[i + 1] = g + gr * 0.15; p[i + 2] = b - gr * 0.15; } // Sommer: warm und sonnig
    }
    try { x.putImageData(d, 0, 0); } catch (e) {}
  }
  function snowCap(x, y, w, h, up, sd) { // v154: Schneedecke auf einem Dach, Eiszapfen an der Traufe zur Straße
    if (!seaSnow() || w < 8 || h < 8) return; const e = up ? y : y + h, s = sd || 1;
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#F4F8FC'); g.addColorStop(0.5, '#E6EEF6'); g.addColorStop(0.52, '#D2DEEA'); g.addColorStop(1, '#C6D4E4'); ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - 1, up ? y + h : y); ctx.lineTo(x + w + 1, up ? y + h : y);
    for (let q = x + w + 1; q >= x - 1; q -= 7) { const o = 2 + ((q * 13 + s * 7) % 5) * 0.8; ctx.lineTo(q, up ? y - o + 4 : e + o - 4); }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(150,170,195,.35)'; ctx.fillRect(x, y + h / 2 - 1, w, 2);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < Math.max(2, w / 40); k++) { ctx.beginPath(); ctx.ellipse(x + 10 + ((k * 47 + s * 13) % Math.max(1, w - 20)), y + h * (0.22 + ((k * 3 + s) % 3) * 0.08), 8, 2, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(205,235,255,.9)'; for (let q = x + 5 + (s % 4); q < x + w - 4; q += 9 + ((q + s) % 4)) { const l = 3 + ((q * 7 + s) % 5); ctx.beginPath(); if (up) { ctx.moveTo(q - 1.6, e); ctx.lineTo(q + 1.6, e); ctx.lineTo(q, e - l); } else { ctx.moveTo(q - 1.6, e); ctx.lineTo(q + 1.6, e); ctx.lineTo(q, e + l); } ctx.fill(); }
  }
  function drawGroundTiles() { // gibt false zurück, wenn diesmal live gezeichnet werden soll
    if (bcOff || state === 'admin' || !document.createElement) return false; const R = curR(2); if (!R) return false; gtlR = R; // v154: auch am linken Kartenrand (Keller), die Grundstücke der Freunde kommen danach live darüber
    const sb = gtlKey(), sk = sb + '@' + R, ix0 = Math.floor(viewX0 / GTS), ix1 = Math.floor(viewX1 / GTS), iy0 = Math.floor(viewY0 / GTS), iy1 = Math.floor(viewY1 / GTS), list = [], need = [];
    for (let iy = iy0; iy <= iy1; iy++) for (let ix = ix0; ix <= ix1; ix++) { const k = 'g|' + ix + ',' + iy + ',' + sk; if (!cacheGet(k)) need.push([ix, iy, k]); } // sichtbare zuerst als benutzt markieren
    let built = 0; const lim = sb.length > 1 || sb === 'n' ? 3 : 1; for (const [ix, iy, k] of need) { if (built >= lim) break; const x0 = ix * GTS - GTP, y0 = iy * GTS - GTP, S = GTS + 2 * GTP; const c = cacheMake(k, S, S, R, x0, y0, () => gtlDraw(x0, y0, S)); if (!c) return false; if (sb.length === 1 && sb !== 'n') seasonPx(c, +sb); built++; }
    // v174: fehlt eine Kachel, nur diese eine Stelle live zeichnen (nicht den ganzen Boden), sonst springt das Bild (Flackern)
    const miss = []; for (let iy = iy0; iy <= iy1; iy++) for (let ix = ix0; ix <= ix1; ix++) { const c = cacheGet('g|' + ix + ',' + iy + ',' + sk); if (!c || !c.width) miss.push([ix, iy]); else list.push([c, ix, iy]); }
    if (!list.length) return false;
    const sp = GTP * R, sw = GTS * R;
    for (const [c, ix, iy] of list) if (!cacheBlit(c, [sp, sp, sw + R, sw + R, ix * GTS, iy * GTS, GTS + 1, GTS + 1])) miss.push([ix, iy]); // v154: 1 Einheit Überlappung, damit keine Fugen entstehen
    for (const [ix, iy] of miss) { const x0 = ix * GTS, y0 = iy * GTS; ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, GTS + 1, GTS + 1); ctx.clip(); try { gtlDraw(x0 - GTP, y0 - GTP, GTS + 2 * GTP); } catch (e) {} ctx.restore(); }
    if (miss.length) return true;
    if (!built) gtlPrefetch(ix0, ix1, iy0, iy1, sk, R, sb); // v154: in ruhigen Bildern schon die Kacheln am Rand vorbereiten, damit beim Laufen nichts ruckelt
    return true;
  }
  function gtlPrefetch(ix0, ix1, iy0, iy1, sk, R, sb) {
    if (CB.px > CB.max * 0.8) return; // Speicher fast voll: lieber nichts vorbereiten
    let dx = 0, dy = 0; if (player && Number.isFinite(player.ang)) { const v = Math.cos(player.ang), w = Math.sin(player.ang); dx = v > 0.4 ? 1 : v < -0.4 ? -1 : 0; dy = w > 0.4 ? 1 : w < -0.4 ? -1 : 0; } // Blickrichtung zuerst
    const cand = []; for (let iy = iy0 - 1; iy <= iy1 + 1; iy++) for (let ix = ix0 - 1; ix <= ix1 + 1; ix++) { if (ix >= ix0 && ix <= ix1 && iy >= iy0 && iy <= iy1) continue; const pr = (dx && Math.sign(ix - (ix0 + ix1) / 2) === dx ? -2 : 0) + (dy && Math.sign(iy - (iy0 + iy1) / 2) === dy ? -2 : 0); cand.push([pr, ix, iy]); }
    cand.sort((a, b) => a[0] - b[0]);
    for (const [, ix, iy] of cand) { const k = 'g|' + ix + ',' + iy + ',' + sk; if (CACHE.has(k)) continue; const x0 = ix * GTS - GTP, y0 = iy * GTS - GTP, S = GTS + 2 * GTP; const c = cacheMake(k, S, S, R, x0, y0, () => gtlDraw(x0, y0, S)); if (c && sb.length === 1 && sb !== 'n') seasonPx(c, +sb); return; }
  }
  function drawGroundLive() { // was sich auf dem Boden bewegt: Wellen im Fluss und Wasser in den Bächen
    const r = RIVER; if (!(viewY1 < r.y0 - 60 || viewY0 > r.y1 + 60)) { const x0 = Math.max(0, viewX0), x1 = Math.min(WW, viewX1); ctx.strokeStyle = 'rgba(255,255,255,.26)'; ctx.lineWidth = 2;
      for (let x = Math.floor(x0 / 90) * 90; x < x1; x += 90) { const o = ((x / 90) % 3) * 12 + Math.sin(gt * 1.3 + x) * 4; for (const [dy, dx] of [[14, 0], [34, 40], [56, 18]]) { const sx = x + o + dx; if (ALLB.some(b => sx + 28 > b.x0 && sx < b.x1) || (sx + 28 > PIER.x0 - 2 && sx < PIER.x1 + 2 && dy < 40)) continue; ctx.beginPath(); ctx.moveTo(sx, r.y0 + dy); ctx.quadraticCurveTo(sx + 14, r.y0 + dy - 6, sx + 28, r.y0 + dy); ctx.stroke(); } } }
    for (const b of BROOKS) { if (b.x + 30 < viewX0 || b.x - 30 > viewX1 || b.y1 < viewY0 - 20 || b.y0 > viewY1 + 20) continue; const a = Math.max(b.y0, viewY0 - 20), e = Math.min(b.y1, viewY1 + 20);
      ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1.4; const ph = (gt * 26) % 28; for (let y = Math.floor(a / 28) * 28 + ph; y < e; y += 28) { if (onRoadway(b.x, y) || onRoadway(b.x, y + 5)) continue; ctx.beginPath(); ctx.moveTo(b.x - 6, y); ctx.quadraticCurveTo(b.x, y + 5, b.x + 6, y); ctx.stroke(); }
      ctx.strokeStyle = '#5E7A3A'; ctx.lineWidth = 2; for (let y = Math.floor(a / 46) * 46 + 10; y < e; y += 46) { const sx = (y / 46) % 2 ? b.x - 15 : b.x + 15; if (onRoadway(sx, y) || onRoadway(sx, y - 13)) continue; ctx.beginPath(); ctx.moveTo(sx, y); ctx.lineTo(sx + Math.sin(gt + y) * 1.5, y - 13); ctx.moveTo(sx + 3, y); ctx.lineTo(sx + 4, y - 10); ctx.stroke(); } } // v137: Schilf wiegt sich live
    if (state !== 'edit') { if (!DET) detInit(); const si = seasonI(), win = si === 3 && !KR_NEUTRAL, aut = si === 2 && !KR_NEUTRAL, GC = aut ? ['#8A7A3A', '#A0882E'] : win ? ['#9AA8A0', '#B8C4BE'] : ['#3E7A3A', '#5A9A48']; // v137: Grashalme live
      for (const t of DET.tufts) { if (!(t.k === 0 || (win && t.k === 1)) || !inView(t.x, t.y, 12)) continue; if (BENCHES.some(bb => Math.abs(bb.x - t.x) < 34 && Math.abs(bb.y - t.y) < 24)) continue; const s = t.s;
        ctx.strokeStyle = GC[t.c % 2]; ctx.lineWidth = 1.3; ctx.beginPath(); for (const o of [-2.5, 0, 2.5]) { ctx.moveTo(t.x + o * s, t.y + 2); ctx.lineTo(t.x + o * s * 1.6 + Math.sin(gt * 1.3 + t.x) * 0.6, t.y - 4.5 * s); } ctx.stroke(); } }
  }
  function drawBushes() { for (const b of bushes) { if (!inView(b.x, b.y, 20)) continue; drawBush1(b); } }
  function drawBush1(b) { ctx.fillStyle = '#12201A'; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.fillStyle = '#1D3A2B'; ctx.beginPath(); ctx.arc(b.x - b.r * .2, b.y - b.r * .2, b.r * .7, 0, TAU); ctx.fill(); }
  let bcMode = (() => { try { const v = localStorage.getItem('kellergruen.bc'); return v === '0' || v === '1' ? v : 'a'; } catch (e) { return 'a'; } })(); // a = automatisch, 1 = an, 0 = aus
  let bcAuto = (() => { try { const v = localStorage.getItem('kellergruen.bcA3'); return v === '0' || v === '1' ? v : ''; } catch (e) { return ''; } })(); // Ergebnis der Messung auf diesem Gerät
  let bcOff = bcMode === '0' || (bcMode === 'a' && bcAuto === '0');
  function setBc(m) { bcMode = m; cacheClear(); if (m !== '0') CB.fail = false; try { localStorage.setItem('kellergruen.bc', m); } catch (e) {} if (m === 'a') { bcAuto = ''; try { localStorage.removeItem('kellergruen.bcA3'); } catch (e) {} bcT.i = 0; bcT.r = [0, 0]; bcT.n = [0, 0]; } bcOff = CB.fail || m === '0' || (m === 'a' && bcAuto === '0'); }
  // Selbsttest: draußen abwechselnd 2 Sekunden mit und ohne Zwischenspeicher, dann das Schnellere behalten
  const bcT = { i: 0, s: 0, c: 0, r: [0, 0], n: [0, 0] };
  function bcTick(int) {
    if (bcMode === 'a' && !bcAuto) { bcAuto = '1'; bcOff = !!CB.fail; } // v174: kein abwechselndes Messen mehr (das Bild sprang alle 2 Sekunden)
    if (bcMode !== 'a' || bcAuto || state !== 'play' || player.fl || phoneOpen || !(int > 0 && int < 0.2)) return;
    if (AREA_KEYS.some(k => { const I = AREAS[k].IN; return player.x > I.x0 && player.x < I.x1 && player.y > I.y0 && player.y < I.y1; })) return;
    const ph = bcT.i % 2; bcOff = ph === 1; bcT.s += int; bcT.c++; if (bcT.s < 2) return;
    if (bcT.i > 0) { bcT.r[ph] += bcT.s / bcT.c; bcT.n[ph]++; } bcT.s = 0; bcT.c = 0; bcT.i++; // das allererste Fenster nicht werten (Bilder werden erst erzeugt)
    if (bcT.n[0] >= 3 && bcT.n[1] >= 3) { const on = bcT.r[0] / bcT.n[0], off = bcT.r[1] / bcT.n[1]; bcAuto = on <= off * 1.03 ? '1' : '0'; bcOff = bcAuto === '0'; if (bcOff) cacheClear(); try { localStorage.setItem('kellergruen.bcA3', bcAuto); } catch (e) {} }
  }
  function bcDraw(key, x0, y0, w, h, fn) {
    if (bcOff || typeof document === 'undefined' || !document.createElement) { fn(); return; }
    const R = curR(2.5); if (!R) { fn(); return; } bcR = R;
    const k = 'b|' + key + '@' + R; let c = cacheGet(k) || cacheMake(k, w, h, R, x0, y0, fn); if (!c) { fn(); return; } if (!cacheBlit(c, [x0, y0, w, h])) fn();
  }
  function roofExtras(h, hi, x, ry0, w, rh, up, dk) { // v147: Firstziegel, Schattenkante, Moos, Dachfenster, Satellitenschuessel, Antenne, Klimageraet
    const F = c => { ctx.fillStyle = c; }, mid = ry0 + rh / 2;
    if (h.st !== 2) {
      const sh = ctx.createLinearGradient(x, 0, x + w, 0); sh.addColorStop(0, 'rgba(255,255,255,.06)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.1)'); F(sh); ctx.fillRect(x, ry0, w, rh);
      F('rgba(0,0,0,.22)'); ctx.fillRect(x, up ? ry0 + rh - 3 : ry0, w, 3);
      const i0 = h.st === 1 ? Math.min(rh * 0.45, 34) : 0; F('rgba(0,0,0,.25)'); for (let q = x + i0 + 3; q < x + w - i0 - 2; q += 6) { ctx.beginPath(); ctx.arc(q, mid + 0.8, 2.6, 0, TAU); ctx.fill(); } F(hexShade(h.roof, 1.25)); for (let q = x + i0 + 3; q < x + w - i0 - 2; q += 6) { ctx.beginPath(); ctx.arc(q, mid, 2.4, Math.PI, 0); ctx.fill(); }
      if (hi % 3 === 0) { F('rgba(80,120,60,.35)'); for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + 10 + ((k * 37 + hi * 11) % (w - 20)), ry0 + rh * (0.6 + (k % 2) * 0.25) - (up ? rh * 0.45 : 0), 4 + (k % 3), 2, 0, 0, TAU); ctx.fill(); } }
      if (hi % 4 === 2 && w > 90) { const sx = x + w * 0.46, sy = up ? mid + rh * 0.12 : ry0 + rh * 0.14; F('#3A3F47'); ctx.fillRect(sx - 1, sy - 1, 18, 14); const g = ctx.createLinearGradient(sx, sy, sx + 16, sy + 12); g.addColorStop(0, dk ? '#FFE08A' : '#9FD0EA'); g.addColorStop(1, dk ? '#C9A040' : '#4A7A9A'); F(g); ctx.fillRect(sx, sy, 16, 12); F('rgba(255,255,255,.35)'); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 7, sy); ctx.lineTo(sx, sy + 6); ctx.fill(); F('#3A3F47'); ctx.fillRect(sx + 7.5, sy, 1, 12); }
    } else {
      F('rgba(255,255,255,.12)'); ctx.fillRect(x, ry0, w, 2); ctx.fillRect(x, ry0, 2, rh); F('rgba(0,0,0,.18)'); ctx.fillRect(x + w - 2, ry0, 2, rh); ctx.fillRect(x, ry0 + rh - 2, w, 2);
      const ax = x + 12, ay = ry0 + rh - 26; F('rgba(0,0,0,.3)'); ctx.fillRect(ax + 2, ay + 2, 18, 14); F('#B9C2CC'); ctx.fillRect(ax, ay, 18, 14); F('#8A94A2'); ctx.beginPath(); ctx.arc(ax + 9, ay + 7, 5, 0, TAU); ctx.fill(); F('#3A404A'); for (let k = 0; k < 4; k++) { ctx.save(); ctx.translate(ax + 9, ay + 7); ctx.rotate(k * Math.PI / 2 + 0.4); ctx.fillRect(-0.6, -4.4, 1.2, 4.4); ctx.restore(); }
      F('#6E7884'); for (const [vx, vy] of [[x + w * 0.5, ry0 + 8], [x + w * 0.58, ry0 + rh - 12]]) { ctx.beginPath(); ctx.arc(vx, vy, 2.6, 0, TAU); ctx.fill(); F('#3A404A'); ctx.beginPath(); ctx.arc(vx, vy, 1.4, 0, TAU); ctx.fill(); F('#6E7884'); }
    }
    if (hi % 5 === 1 && w > 90) { const dx = x + w - 16, dy = up ? ry0 + rh - 14 : ry0 + 10; F('rgba(0,0,0,.25)'); ctx.beginPath(); ctx.ellipse(dx + 2, dy + 3, 6, 4, -0.5, 0, TAU); ctx.fill(); F('#E8ECF2'); ctx.beginPath(); ctx.ellipse(dx, dy, 6, 4.4, -0.5, 0, TAU); ctx.fill(); F('#B9C2CC'); ctx.beginPath(); ctx.ellipse(dx + 0.8, dy + 0.6, 4, 2.8, -0.5, 0, TAU); ctx.fill(); ctx.strokeStyle = '#5A626E'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx - 4, dy - 3); ctx.stroke(); F('#3A404A'); ctx.beginPath(); ctx.arc(dx - 4, dy - 3, 1, 0, TAU); ctx.fill(); }
    if (hi % 7 === 3 && h.st !== 2) { const tx = x + w * 0.6, ty = mid; ctx.strokeStyle = '#3A404A'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx, ty - 16); for (let k = 0; k < 3; k++) { ctx.moveTo(tx - 6 + k, ty - 14 + k * 4); ctx.lineTo(tx + 6 - k, ty - 14 + k * 4); } ctx.stroke(); }
  }
  function drawHouse(h, hi) { const dk = lightK() > 0.25, sk = KR_NEUTRAL ? 'n' : seasonI(); bcDraw('h' + hi + (dk ? 'd' : 'l') + sk + (h.office ? 'o' : ''), h.x - 12, h.y - 28, h.w + 32, h.h + 58, () => drawHouse0(h, hi)); }
  function drawHouse0(h, hi) {
    const x = h.x, y = h.y, w = h.w, hh = h.h, up = h.face === -1, dk = lightK() > 0.25, fh = hh * 0.36, fy0 = up ? y : y + hh - fh, ry0 = up ? y + fh : y, rh = hh - fh;
    // Vorgarten: Plattenweg zur Tuer und Hecken
    const gy = up ? y - 18 : y + hh;
    ctx.fillStyle = '#6A6E75'; ctx.fillRect(h.dx - 9, gy, 18, 18); ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 0; k < 3; k++) ctx.fillRect(h.dx - 9, gy + 5 + k * 6, 18, 1);
    const snw = seaSnow(); ctx.fillStyle = snw ? '#9FB0BE' : '#1E3F28'; rr(x + 4, gy + 4, h.dx - 14 - x - 4, 10, 4); ctx.fill(); rr(h.dx + 14, gy + 4, x + w - 4 - h.dx - 14, 10, 4); ctx.fill();
    ctx.fillStyle = snw ? '#DCE5EE' : '#2C5A3A'; for (let k = x + 8; k < x + w - 8; k += 11) { if (Math.abs(k - h.dx) < 16) continue; ctx.beginPath(); ctx.arc(k, gy + 8, 3, 0, TAU); ctx.fill(); }
    if (!snw && hi % 3 !== 2 && !KR_NEUTRAL) { const si = G ? seasonI() : 1, HC = [['#FF8FBF', '#FFFFFF'], ['#FF5C7A', '#FFD24A'], ['#E8833A', '#C9A2FF']][si === 2 ? 2 : si === 0 ? 0 : 1]; for (let k = x + 10, q = 0; k < x + w - 8; k += 7, q++) { if (Math.abs(k - h.dx) < 18 || (q * 5 + hi) % 3) continue; ctx.fillStyle = HC[q % 2]; ctx.beginPath(); ctx.arc(k + ((q * 3) % 4) - 2, gy + 5 + ((q * 7) % 5), 1.3, 0, TAU); ctx.fill(); } } // v161: Blüten in der Hecke
    // Schatten und Fassade
    ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.fillRect(x + 7, y + 9, w, hh);
    ctx.fillStyle = h.c; ctx.fillRect(x, fy0, w, fh);
    { const mat = hi % 4; // v97: Material der Fassade: Putz, Klinker, Holzverschalung, Naturstein-Sockel
      if (mat === 1) { ctx.fillStyle = 'rgba(0,0,0,.09)'; for (let r = 0, k = fy0 + 3; k < fy0 + fh; k += 6, r++) { ctx.fillRect(x, k, w, 1); for (let q = x + (r % 2) * 7; q < x + w; q += 14) ctx.fillRect(q, k, 1, 6); } }
      else if (mat === 2) { for (let k = fy0 + 2; k < fy0 + fh; k += 5) { ctx.fillStyle = 'rgba(0,0,0,.10)'; ctx.fillRect(x, k + 4, w, 1); ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(x, k, w, 1); } }
      else { ctx.fillStyle = 'rgba(255,255,255,.07)'; for (let k = fy0 + 6; k < fy0 + fh; k += 7) ctx.fillRect(x, k, w, 1); }
      const sb = up ? fy0 + fh - 9 : fy0 + fh - 9; ctx.fillStyle = mat === 3 ? '#8A8478' : 'rgba(0,0,0,.18)'; ctx.fillRect(x, up ? fy0 : sb, w, 9); // Sockel
      if (mat === 3) { ctx.fillStyle = 'rgba(255,255,255,.12)'; for (let q = x + 3; q < x + w - 6; q += 11) ctx.fillRect(q, (up ? fy0 : sb) + 2 + (q % 3), 8, 4); }
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + w - 5, fy0, 3, fh); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x + w - 5, fy0, 1, fh); } // Fallrohr
    ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x, up ? fy0 + fh - 3 : fy0, w, 3); // Dachkante
    // Dach
    const rc = h.roof;
    if (h.st === 2) { // Flachdach mit Kies und Solarpaneelen
      ctx.fillStyle = '#4E545C'; ctx.fillRect(x, ry0, w, rh); ctx.fillStyle = '#5E656E'; ctx.fillRect(x + 4, ry0 + 4, w - 8, rh - 8);
      ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let k = 0; k < 40; k++) ctx.fillRect(x + 6 + ((k * 37) % (w - 12)), ry0 + 6 + ((k * 23) % (rh - 12)), 2, 2);
      ctx.fillStyle = '#1F3554'; for (let k = 0; k < 3; k++) { ctx.fillRect(x + 14 + k * 34, ry0 + 12, 28, rh - 34); } ctx.fillStyle = 'rgba(160,200,255,.25)'; for (let k = 0; k < 3; k++) ctx.fillRect(x + 14 + k * 34, ry0 + 12, 28, 3);
      ctx.fillStyle = '#8C96A3'; ctx.fillRect(x + w - 34, ry0 + rh - 26, 20, 14);
    } else if (h.st === 1) { // Walmdach: vier Flaechen
      const i = Math.min(rh * 0.45, 34);
      ctx.fillStyle = rc; ctx.fillRect(x, ry0, w, rh);
      ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.moveTo(x, ry0); ctx.lineTo(x + w, ry0); ctx.lineTo(x + w - i, ry0 + rh / 2); ctx.lineTo(x + i, ry0 + rh / 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.beginPath(); ctx.moveTo(x, ry0 + rh); ctx.lineTo(x + w, ry0 + rh); ctx.lineTo(x + w - i, ry0 + rh / 2); ctx.lineTo(x + i, ry0 + rh / 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.beginPath(); ctx.moveTo(x + w, ry0); ctx.lineTo(x + w, ry0 + rh); ctx.lineTo(x + w - i, ry0 + rh / 2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, ry0); ctx.lineTo(x + i, ry0 + rh / 2); ctx.lineTo(x + w - i, ry0 + rh / 2); ctx.lineTo(x + w, ry0); ctx.moveTo(x, ry0 + rh); ctx.lineTo(x + i, ry0 + rh / 2); ctx.moveTo(x + w, ry0 + rh); ctx.lineTo(x + w - i, ry0 + rh / 2); ctx.stroke();
    } else { // Satteldach: First parallel zur Strasse, Ziegelreihen
      ctx.fillStyle = rc; ctx.fillRect(x, ry0, w, rh);
      ctx.fillStyle = 'rgba(255,255,255,.13)'; ctx.fillRect(x, ry0, w, rh / 2);
      ctx.fillStyle = 'rgba(0,0,0,.14)'; for (let k = ry0 + 5; k < ry0 + rh; k += 7) ctx.fillRect(x, k, w, 1.2);
      ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let r = 0, k = ry0; k < ry0 + rh; k += 7, r++) for (let q = x + (r % 2) * 6; q < x + w; q += 12) ctx.fillRect(q, k, 1, 7);
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x, ry0 + rh / 2 - 1.5, w, 3); // First
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x, ry0, 3, rh); ctx.fillRect(x + w - 3, ry0, 3, rh); // Ortgang
      ctx.fillStyle = h.c; ctx.fillRect(x + w * 0.22, ry0 + (up ? rh * 0.08 : rh * 0.56), 22, rh * 0.36); ctx.fillStyle = dk && winLit(hi, 2) ? '#FFE08A' : '#7FA9C4'; ctx.fillRect(x + w * 0.22 + 4, ry0 + (up ? rh * 0.13 : rh * 0.61), 14, rh * 0.22); // Gaube
    }
    roofExtras(h, hi, x, ry0, w, rh, up, dk); // v147: Dachdetails
    snowCap(x, ry0, w, rh, up, hi + 1); // v154
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x, y, w, 3);
    // Fenster mit Rahmen und Fensterbank, Tuer mit Stufe und Lampe
    houseWins(h).forEach(([wx, wy], j) => {
      ctx.fillStyle = '#EDE6D6'; ctx.fillRect(wx - 14, wy - 9, 28, 18);
      ctx.fillStyle = dk ? (winLit(hi, j) ? '#FFE08A' : '#2B3442') : '#A9CDE0'; ctx.fillRect(wx - 12, wy - 7, 24, 14);
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(wx - 12, wy - 7, 24, 3); ctx.fillStyle = '#EDE6D6'; ctx.fillRect(wx - 1, wy - 7, 2, 14); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(wx - 15, wy + 9, 30, 2);
      if (hi % 3 === 0) { const sc = ['#3E6A4A', '#7A3B36', '#2F4B5E', '#5A4A6E'][hi % 4]; ctx.fillStyle = sc; ctx.fillRect(wx - 21, wy - 9, 6, 18); ctx.fillRect(wx + 15, wy - 9, 6, 18); ctx.fillStyle = 'rgba(0,0,0,.2)'; for (let q = 0; q < 4; q++) { ctx.fillRect(wx - 21, wy - 7 + q * 4.5, 6, 1); ctx.fillRect(wx + 15, wy - 7 + q * 4.5, 6, 1); } } // v97: Fensterlaeden
      if (!dk) { ctx.fillStyle = ['rgba(255,255,255,.55)', 'rgba(255,220,220,.5)', 'rgba(230,240,255,.55)'][hi % 3]; ctx.fillRect(wx - 12, wy - 7, 5, 14); ctx.fillRect(wx + 7, wy - 7, 5, 14); } // Gardinen
      if ((hi + j) % 3 !== 1) { const win2 = seasonI() === 3 && !KR_NEUTRAL; ctx.fillStyle = '#7A4A2E'; ctx.fillRect(wx - 12, wy + 8, 24, 4); ctx.fillStyle = win2 ? '#3E6A4A' : '#3E8A44'; for (let q = 0; q < 6; q++) { ctx.beginPath(); ctx.arc(wx - 10 + q * 4, wy + 8, 2, 0, TAU); ctx.fill(); } if (!win2) { ctx.fillStyle = ['#FF5C7A', '#FFD24A', '#FFFFFF', '#B58CFF'][(hi + j) % 4]; for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.arc(wx - 8 + q * 5.4, wy + 7 - (q % 2), 1.6, 0, TAU); ctx.fill(); } } } // v94: Blumenkaesten
    });
    const dx0 = h.dx - 13, dy0 = up ? y : y + hh - 20;
    ctx.fillStyle = '#20150F'; ctx.fillRect(dx0 - 2, dy0 - (up ? 0 : 2), 30, 22); ctx.fillStyle = ['#7A3B36', '#2F4B5E', '#4E5A34', '#5A4A6E'][hi % 4]; ctx.fillRect(dx0, dy0, 26, 20);
    ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(dx0 + 3, dy0 + 3, 9, 6); ctx.fillRect(dx0 + 14, dy0 + 3, 9, 6); ctx.fillStyle = '#E8B84A'; ctx.beginPath(); ctx.arc(dx0 + 20, dy0 + 11, 1.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#8C96A3'; ctx.fillRect(dx0 - 4, up ? dy0 - 3 : dy0 + 20, 34, 3); // Stufe
    ctx.fillStyle = dk ? '#FFE9A8' : '#C9D2DC'; ctx.fillRect(dx0 + 30, dy0 + 4, 4, 5); // Lampe
    ctx.fillStyle = '#20262E'; ctx.fillRect(h.dx + 18, gy + (up ? 2 : 6), 7, 6); ctx.fillStyle = '#F2C14E'; ctx.fillRect(h.dx + 19, gy + (up ? 3 : 7), 5, 1.5); // Briefkasten
    if (h.office) { const sy = up ? fy0 + fh - 22 : fy0 + 4; ctx.fillStyle = '#1E3A5F'; rr(x + 18, sy, w - 36, 16, 4); ctx.fill(); signTxt('IMMOBILIEN KRÄMER', x + w / 2, sy + 8.5, '900 9px sans-serif', '#F2C14E'); } // v100: Maklerbuero
    // v97: Vordach, Hausnummer, Fussmatte, Lichtschein, kleine Gartendeko je nach Haus
    { const cy = up ? dy0 - 4 : dy0 - 4; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(dx0 - 5, cy + 2, 36, 5); ctx.fillStyle = h.roof; ctx.fillRect(dx0 - 6, cy, 38, 5); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(dx0 - 6, cy, 38, 1.5);
      ctx.fillStyle = '#F4F1EA'; rr(dx0 - 13, dy0 + 6, 9, 7, 2); ctx.fill(); ctx.fillStyle = '#20262E'; ctx.font = '800 5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(hi + 1), dx0 - 8.5, dy0 + 9.8); ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#6A4A32'; ctx.fillRect(h.dx - 8, up ? dy0 - 9 : dy0 + 22, 16, 5);
      if (dk) { const g2 = ctx.createRadialGradient(dx0 + 32, dy0 + 6, 1, dx0 + 32, dy0 + 6, 22); g2.addColorStop(0, 'rgba(255,220,150,.35)'); g2.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(dx0 + 32, dy0 + 6, 22, 0, TAU); ctx.fill(); }
      const v = hi % 5, gx = up ? gy + 9 : gy + 9;
      if (v === 0) { ctx.fillStyle = '#E05555'; ctx.beginPath(); ctx.moveTo(x + 18, gx - 6); ctx.lineTo(x + 15, gx); ctx.lineTo(x + 21, gx); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#F1C9A5'; ctx.beginPath(); ctx.arc(x + 18, gx + 1, 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#4B8DFF'; ctx.fillRect(x + 16, gx + 3, 4, 3); } // Gartenzwerg
      else if (v === 1) { ctx.strokeStyle = '#20262E'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x + w - 30, gx + 2, 3.4, 0, TAU); ctx.moveTo(x + w - 15.6, gx + 2); ctx.arc(x + w - 19, gx + 2, 3.4, 0, TAU); ctx.stroke(); ctx.strokeStyle = ['#E05555', '#4B8DFF', '#5FE584'][hi % 3]; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(x + w - 30, gx + 2); ctx.lineTo(x + w - 25, gx - 2); ctx.lineTo(x + w - 19, gx + 2); ctx.stroke(); } // Fahrrad
      else if (v === 2) { ctx.fillStyle = '#5A6470'; ctx.fillRect(x + w - 26, gx - 4, 9, 11); ctx.fillStyle = '#3E8A5E'; ctx.fillRect(x + w - 15, gx - 4, 9, 11); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + w - 26, gx - 4, 20, 2); } // Muelltonnen
      else if (v === 3 && !KR_NEUTRAL && seasonI() < 3) { for (let q = 0; q < 6; q++) { ctx.fillStyle = ['#FF8FB8', '#FFD24A', '#FFFFFF', '#B58CFF'][(q + hi) % 4]; ctx.beginPath(); ctx.arc(x + 12 + q * 5, gx + 1 + (q % 2) * 2, 2, 0, TAU); ctx.fill(); } } // Blumenbeet
    }
    // Satellitenschuessel oder Dachfenster auf manchen Daechern
    if (h.st !== 2 && hi % 4 === 1) { const sx = x + w * 0.3, sy = up ? ry0 + rh * 0.3 : ry0 + rh * 0.25; ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(sx + 2, sy + 2, 6, 5); ctx.fill(); ctx.fillStyle = '#E8ECF2'; ell(sx, sy, 6, 5); ctx.fill(); ctx.fillStyle = '#B5BDC7'; ell(sx + 1, sy + 1, 3, 2.4); ctx.fill(); ctx.fillStyle = '#5E6670'; ctx.fillRect(sx + 3, sy - 1, 5, 1.5); }
    if (h.st === 1 && hi % 3 === 2) { const sx = x + w * 0.62, sy = ry0 + (up ? rh * 0.55 : rh * 0.2); ctx.fillStyle = '#3A3F47'; ctx.fillRect(sx, sy, 16, 12); ctx.fillStyle = dk && winLit(hi, 5) ? '#FFE08A' : '#7FA9C4'; ctx.fillRect(sx + 2, sy + 2, 12, 8); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(sx + 2, sy + 2, 12, 2); }
    chimney(h); // v157
  }
  function leftFence() { // v122: Zaun an der linken Stadtkante, Luecke nur auf der Hauptstrasse
    for (const [y0, y1] of [[YMIN, LEFT_GAP[0]], [LEFT_GAP[1], WH]]) { if (y1 < viewY0 - 20 || y0 > viewY1 + 20) continue;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-2, y0, 8, y1 - y0); ctx.fillStyle = '#6B5A44'; ctx.fillRect(-4, y0, 5, y1 - y0);
      ctx.fillStyle = '#8A7558'; for (let y = Math.ceil(Math.max(y0, viewY0 - 40) / 26) * 26; y < Math.min(y1, viewY1 + 40); y += 26) ctx.fillRect(-6, y, 9, 6); }
    ctx.fillStyle = '#C0392B'; for (const y of [LEFT_GAP[0], LEFT_GAP[1]]) { ctx.fillRect(-7, y - 6, 12, 12); ctx.fillStyle = '#F4F4F8'; ctx.fillRect(-5, y - 2, 8, 4); ctx.fillStyle = '#C0392B'; }
  }
  function drawPlotGround() { // v86: Grundstuecke der Freunde links neben dem Keller, die Hauptstrasse laeuft durch
    const nK = mp.slots.length, nF = (mp.farms || []).length, x0 = XMIN, x1 = 0; if (x0 >= 0) return;
    const sn = seaSnow(), gc = sn ? '#B9C6D4' : '#1A2C22'; // v154: im Winter verschneit
    ctx.fillStyle = gc; ctx.fillRect(x0, 0, x1 - x0, WH);
    ctx.fillStyle = sn ? '#8E9AA8' : '#2C333C'; ctx.fillRect(x0, 520, x1 - x0, 208); ctx.fillStyle = sn ? '#C9D3DE' : '#4E5762'; ctx.fillRect(x0, 547, x1 - x0, 154); ctx.fillStyle = sn ? '#2E333B' : '#23272E'; ctx.fillRect(x0, 550, x1 - x0, 148);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let x = Math.ceil(x0 / 70) * 70; x < x1 - 20; x += 70) ctx.fillRect(x, 622, 36, 4);
    ctx.fillStyle = sn ? '#9AAAB8' : '#16301F'; const hedge = x => { ctx.fillRect(x - 5, 0, 10, 520); ctx.fillRect(x - 5, 728, 10, WH - 728); };
    for (let j = 0; j <= nK; j++) hedge(-KW * j); ctx.fillRect(x0, 0, 10, WH);
    ctx.fillStyle = gc; ctx.fillRect(x0, LEFT_GAP[1], x1 - x0, WH - LEFT_GAP[1]); // v122: unterhalb der Strasse kein Gelaende mehr
    leftFence();
    for (let i = 0; i < nF; i++) { const ox = fOx(i); if (ox > viewX1 || ox + FW < viewX0) continue; hedge(ox); }
    if (nF) { const bx = -KW * nK; ctx.fillStyle = 'rgba(32,38,46,.9)'; rr(bx - 150, 735, 140, 24, 6); ctx.fill(); ctx.fillStyle = '#E8C84A'; ctx.font = '800 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('← FARMEN DER FREUNDE', bx - 80, 747.5); ctx.textBaseline = 'alphabetic'; }
  }
  // v49: Kiosk und Marktstand auf dem Platz
  function drawKiosk() {
    const k = KIOSK, L = lightK(); if (!inView(k.x + 33, k.y + 20, 90)) return;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(k.x + 4, k.y + 6, k.w, k.h);
    ctx.fillStyle = '#7A5A3E'; ctx.fillRect(k.x, k.y, k.w, k.h);
    ctx.fillStyle = '#9A7650'; ctx.fillRect(k.x, k.y, k.w, 6);
    ctx.fillStyle = L > 0.25 ? '#FFE08A' : '#BFD8E6'; ctx.fillRect(k.x + 8, k.y + 18, k.w - 16, 11);
    ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(k.x + 8, k.y + 18, k.w - 16, 2);
    ctx.fillStyle = '#3B2A1C'; ctx.fillRect(k.x + 6, k.y + 29, k.w - 12, 4);
    ctx.fillStyle = '#E8C94A'; ctx.fillRect(k.x + 12, k.y + 27, 5, 2); ctx.fillStyle = '#D33F3F'; ctx.fillRect(k.x + 20, k.y + 26, 4, 3); ctx.fillStyle = '#6FBF5E'; ctx.fillRect(k.x + 44, k.y + 26, 5, 3);
    const sw = (k.w + 4) / 6;
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#F4F4F8' : '#D33F3F'; ctx.fillRect(k.x - 2 + i * sw, k.y + 8, sw + 0.5, 8); ctx.beginPath(); ctx.arc(k.x - 2 + i * sw + sw / 2, k.y + 16, sw / 2, 0, Math.PI); ctx.fill(); }
    ctx.fillStyle = '#20262E'; ctx.fillRect(k.x + 14, k.y + 1, 38, 8); ctx.fillStyle = '#F2C14E'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('KIOSK', k.x + 33, k.y + 7.6); ctx.textAlign = 'left';
  }
  function drawStall() { const s0 = STALL; if (!inView(s0.x + 38, s0.y, 100)) return; bcDraw('stall' + (lightK() > 0.25 ? 1 : 0), s0.x - 8, s0.y - 14, s0.w + 16, s0.h + 22, drawStall0); } // v157: als fertiges Bild
  function drawStall0() {
    const s0 = STALL, L = lightK(); if (!inView(s0.x + 38, s0.y, 100)) return;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(s0.x + 4, s0.y + 5, s0.w, s0.h);
    ctx.fillStyle = '#8A6A45'; ctx.fillRect(s0.x, s0.y + 6, s0.w, s0.h - 6);
    ctx.fillStyle = '#6F5139'; ctx.fillRect(s0.x, s0.y + s0.h - 4, s0.w, 4);
    const cols = ['#D33F3F', '#F2A93B', '#6FBF5E', '#E8C94A'];
    for (let i = 0; i < 4; i++) { const cx = s0.x + 4 + i * 18; ctx.fillStyle = '#B98A52'; ctx.fillRect(cx, s0.y + 12, 15, 11); ctx.fillStyle = '#8F6A38'; ctx.fillRect(cx, s0.y + 15, 15, 1.2); for (let q = 0; q < 4; q++) { ctx.fillStyle = cols[(i + q) % 4]; ctx.beginPath(); ctx.arc(cx + 3 + q * 3.2, s0.y + 11.5 - (q % 2), 2.4, 0, TAU); ctx.fill(); } }
    ctx.fillStyle = '#6F5139'; ctx.fillRect(s0.x - 2, s0.y - 10, 3, 34); ctx.fillRect(s0.x + s0.w - 1, s0.y - 10, 3, 34);
    const n = 8, sw = (s0.w + 8) / n;
    for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? '#F4F4F8' : '#3F8F55'; ctx.fillRect(s0.x - 4 + i * sw, s0.y - 12, sw + 0.5, 12); ctx.beginPath(); ctx.arc(s0.x - 4 + i * sw + sw / 2, s0.y, sw / 2, 0, Math.PI); ctx.fill(); }
    for (let i = 0; i < 5; i++) { const bx = s0.x - 4 + i * (s0.w + 8) / 4; ctx.fillStyle = L > 0.25 ? '#FFF3C0' : '#8A8F98'; ctx.beginPath(); ctx.arc(bx, s0.y + 5.5, 1.8, 0, TAU); ctx.fill(); }
  }

  // ---------- v94: neue Gebaeude zeichnen (Dach von oben, Fassade zur Eingangsseite wie bei den Haeusern) ----------
  function bldBase(B, face, fh, wall, roof, roofSt) { const up = face === -1, fy0 = up ? B.y : B.y + B.h - fh, ry0 = up ? B.y + fh : B.y, rh = B.h - fh;
    bcDraw('b' + B.x + ',' + B.y + ',' + B.w + ',' + B.h + ',' + face + ',' + fh + ',' + wall + ',' + roof + ',' + roofSt + (seaSnow() ? 'w' : ''), B.x - 2, B.y - 2, B.w + 14, B.h + 16, () => bldBase0(B, face, fh, wall, roof, roofSt)); return { fy0, ry0, rh, up }; }
  function bldBase0(B, face, fh, wall, roof, roofSt) {
    const up = face === -1, fy0 = up ? B.y : B.y + B.h - fh, ry0 = up ? B.y + fh : B.y, rh = B.h - fh;
    ctx.fillStyle = 'rgba(0,0,0,.30)'; ctx.fillRect(B.x + 8, B.y + 10, B.w, B.h);
    ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(B.x + 3, B.y + 4, B.w + 4, B.h + 4);
    ctx.fillStyle = roof; ctx.fillRect(B.x, ry0, B.w, rh);
    if (roofSt === 'flat') { ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.fillRect(B.x + 5, ry0 + 5, B.w - 10, rh - 10); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(B.x, ry0, B.w, 3); ctx.fillRect(B.x, ry0 + rh - 3, B.w, 3); ctx.fillRect(B.x, ry0, 3, rh); ctx.fillRect(B.x + B.w - 3, ry0, 3, rh);
      ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let k = 0; k < 60; k++) ctx.fillRect(B.x + 8 + ((k * 37) % (B.w - 16)), ry0 + 8 + ((k * 23) % Math.max(1, rh - 16)), 2, 2); }
    else { ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(B.x, ry0, B.w, rh / 2); ctx.fillStyle = 'rgba(0,0,0,.13)'; for (let k = ry0 + 5; k < ry0 + rh; k += 7) ctx.fillRect(B.x, k, B.w, 1.2);
      ctx.fillStyle = 'rgba(0,0,0,.07)'; for (let r = 0, k = ry0; k < ry0 + rh; k += 7, r++) for (let q = B.x + (r % 2) * 6; q < B.x + B.w; q += 12) ctx.fillRect(q, k, 1, 7); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(B.x, ry0 + rh / 2 - 1.5, B.w, 3); }
    snowCap(B.x, ry0, B.w, rh, up, (B.x + B.y) % 17); // v154
    ctx.fillStyle = wall; ctx.fillRect(B.x, fy0, B.w, fh); ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.fillRect(B.x, up ? fy0 + fh - 3 : fy0, B.w, 3);
    return { fy0, ry0, rh, up };
  }
  function acUnit(x, y) { ctx.fillStyle = '#8C96A3'; ctx.fillRect(x, y, 22, 16); ctx.fillStyle = '#6A7380'; ctx.beginPath(); ctx.arc(x + 11, y + 8, 6, 0, TAU); ctx.fill(); ctx.strokeStyle = '#B5BDC7'; ctx.lineWidth = 1; ctx.beginPath(); const a = gt * 6; for (let k = 0; k < 3; k++) { ctx.moveTo(x + 11, y + 8); ctx.lineTo(x + 11 + Math.cos(a + k * 2.1) * 5, y + 8 + Math.sin(a + k * 2.1) * 5); } ctx.stroke(); }
  function signTxt(t, x, y, font, col) { ctx.font = font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(t, x, y); ctx.textBaseline = 'alphabetic'; }
  function drawMarkt() { // v109: groesserer Marktplatz, offen zur Nordallee, mit Brunnen, sechs Staenden, Baeumen und Lichterketten
    const M = MARKT; if (!inView(M.x + M.w / 2, M.y + M.h / 2, 260)) return; const dk = lightK() > 0.25;
    bcDraw('markt', M.x - 4, M.y - 4, M.w + 40, 309 - M.y + 8, () => { // v157: Pflaster als fertiges Bild
      ctx.fillStyle = '#CFC6B4'; ctx.fillRect(M.x, M.y, M.w, M.h);
      for (let y = M.y, r = 0; y < M.y + M.h; y += 9, r++) for (let x = M.x + (r % 2) * 9; x < M.x + M.w; x += 18) { ctx.fillStyle = (x * 7 + y * 3) % 5 === 0 ? '#BDB3A0' : '#C6BDAA'; ctx.fillRect(x + 1, y + 1, 16, 7); }
      ctx.strokeStyle = '#A89F8E'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(M.x + 1.5, M.y + 14); ctx.lineTo(M.x + 1.5, M.y + M.h - 1.5); ctx.lineTo(M.x + M.w - 1.5, M.y + M.h - 1.5); ctx.lineTo(M.x + M.w - 1.5, M.y + 14); ctx.stroke();
      ctx.fillStyle = '#B9A98A'; ctx.fillRect(M.x + M.w / 2 - 16, M.y + M.h, 32, 309 - (M.y + M.h)); // Weg zum Hinterhofweg
    });
    const cx = 2763, cy = 137; ctx.fillStyle = '#B4AA96'; ctx.beginPath(); ctx.arc(cx, cy, 34, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; ctx.fillRect(cx + Math.cos(a) * 26 - 1, cy + Math.sin(a) * 26 - 1, 2, 2); }
    ctx.fillStyle = '#8C96A3'; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, TAU); ctx.fill(); const wg = ctx.createRadialGradient(cx - 4, cy - 4, 2, cx, cy, 18); wg.addColorStop(0, '#9FE3FF'); wg.addColorStop(1, '#3E9ACF'); ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(cx, cy, 17, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; for (let k = 0; k < 2; k++) { const ph = (gt * .5 + k / 2) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(cx, cy, 5 + ph * 11, 0, TAU); ctx.stroke(); } ctx.globalAlpha = 1;
    ctx.fillStyle = '#C9D2DC'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(200,235,255,.8)'; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + gt, r = 4 + ((gt * 2 + k) % 1) * 9; ctx.fillRect(cx + Math.cos(a) * r - .8, cy + Math.sin(a) * r - .8, 1.6, 1.6); }
    const goods = [['#D33F3F', ['#D33F3F', '#E85A5A', '#F2A93B']], ['#2E9B4F', ['#6FBF5E', '#3E9A4E', '#B5D96A']], ['#F2A93B', ['#F2D27A', '#E8B84A', '#FFF0B0']], ['#4B8DFF', ['#9FD2E8', '#5FA0D8', '#E9ECEF']], ['#B36BFF', ['#B58CFF', '#FF8FB8', '#FFD24A']], ['#E8833A', ['#8A5A34', '#C98A4A', '#E9D5A8']]];
    const sw = Math.sin(gt * 1.5) * .6;
    MARKT_ST.forEach(([x, y], i) => { const [col, gc] = goods[i];
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x + 4, y + 5, 56, 26); ctx.fillStyle = '#7A5A3E'; ctx.fillRect(x, y + 8, 56, 18); ctx.fillStyle = '#8A6A45'; ctx.fillRect(x, y + 8, 56, 3);
      for (let k = 0; k < 7; k++) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.arc(x + 5 + k * 7.6, y + 18, 3.6, 0, TAU); ctx.fill(); ctx.fillStyle = gc[(k + i) % 3]; ctx.beginPath(); ctx.arc(x + 5 + k * 7.6, y + 17, 3.2, 0, TAU); ctx.fill(); }
      for (let k = 0; k < 7; k++) { ctx.fillStyle = k % 2 ? '#F4F4F8' : col; ctx.beginPath(); ctx.moveTo(x - 3 + k * 8.86, y - 4); ctx.lineTo(x - 3 + (k + 1) * 8.86, y - 4); ctx.lineTo(x - 3 + (k + 1) * 8.86, y + 7 + sw); ctx.quadraticCurveTo(x - 3 + (k + .5) * 8.86, y + 10 + sw, x - 3 + k * 8.86, y + 7 + sw); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(x - 3, y - 4, 62, 2); });
    for (const [x, y] of [[2668, 252], [2858, 252], [2700, 20], [2826, 20]]) { ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(x + 2, y + 6, 12, 4); ctx.fill(); ctx.fillStyle = '#7A5A3E'; ctx.fillRect(x - 9, y - 2, 18, 8); ctx.fillStyle = '#3E8A4A'; ctx.beginPath(); ctx.arc(x, y - 6, 11, 0, TAU); ctx.fill(); ctx.fillStyle = '#5FB86A'; ctx.beginPath(); ctx.arc(x - 3, y - 9, 6, 0, TAU); ctx.fill(); for (let k = 0; k < 4; k++) { ctx.fillStyle = ['#FF8FB8', '#FFD24A', '#F4F4F8', '#B58CFF'][k]; ctx.beginPath(); ctx.arc(x - 6 + k * 4, y - 3 + (k % 2) * 2, 1.6, 0, TAU); ctx.fill(); } }
    for (const [x, y] of [[2740, 236], [2786, 236]]) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(x - 15, y + 3, 32, 8); ctx.fillStyle = '#8A5A34'; ctx.fillRect(x - 16, y - 2, 32, 4); ctx.fillRect(x - 16, y + 4, 32, 3); ctx.fillStyle = '#3A3F47'; ctx.fillRect(x - 14, y + 7, 2, 4); ctx.fillRect(x + 12, y + 7, 2, 4); }
    { const ux = 2763, uy = 196; ctx.fillStyle = '#3A3F47'; ctx.fillRect(ux - 1.5, uy - 26, 3, 26); ctx.fillStyle = '#20262E'; ctx.beginPath(); ctx.arc(ux, uy - 30, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#F4F4F8'; ctx.beginPath(); ctx.arc(ux, uy - 30, 5.6, 0, TAU); ctx.fill(); const tm = ((G && G.time) || 0) / 60; ctx.strokeStyle = '#20262E'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(ux, uy - 30); ctx.lineTo(ux + Math.sin(tm / 12 * TAU) * 3, uy - 30 - Math.cos(tm / 12 * TAU) * 3); ctx.moveTo(ux, uy - 30); ctx.lineTo(ux + Math.sin(tm * TAU) * 4.4, uy - 30 - Math.cos(tm * TAU) * 4.4); ctx.stroke(); }
    ctx.fillStyle = '#20262E'; rr(cx - 44, M.y + 4, 88, 16, 5); ctx.fill(); signTxt('MARKTPLATZ', cx, M.y + 12.5, '900 10px sans-serif', '#F2C14E');
    ctx.strokeStyle = 'rgba(60,50,40,.6)'; ctx.lineWidth = .8; for (const [ax, bx] of [[2668, 2858]]) for (const yy of [40, 112, 184]) { ctx.beginPath(); ctx.moveTo(ax, yy); ctx.quadraticCurveTo((ax + bx) / 2, yy + 12, bx, yy); ctx.stroke(); }
    for (const yy of [40, 112, 184]) for (let k = 0; k < 9; k++) { const t = (k + .5) / 9, x = 2668 + t * 190, y = yy + 4 * (1 - Math.pow(2 * t - 1, 2)) * 3, on = dk ? .6 + .4 * Math.sin(gt * 3 + k) : .55; ctx.fillStyle = ['#FFD24A', '#FF8FB8', '#7FD0C8'][k % 3]; ctx.globalAlpha = on; ctx.beginPath(); ctx.arc(x, y + 1.5, 1.8, 0, TAU); ctx.fill(); if (dk) { ctx.globalAlpha = .18 * on; ctx.beginPath(); ctx.arc(x, y + 1.5, 6, 0, TAU); ctx.fill(); } } ctx.globalAlpha = 1;
    if (dk) glow(cx, cy, 110, '255,210,140', 0.14);
  }
  function drawGym2() { // v112: Iron Gym Express im Stadtpark, Eingang oben zur Hauptstrasse
    const B = GYM2; if (!inView(B.x + B.w / 2, B.y + B.h / 2, 220)) return; const dk = lightK() > 0.25;
    const g = bldBase(B, -1, 46, '#4A5260', '#5E656E', 'flat');
    acUnit(B.x + B.w - 30, g.ry0 + g.rh - 26);
    ctx.fillStyle = '#E05555'; ctx.fillRect(B.x, B.y + 40, B.w, 4);
    for (const wx of [B.x + 6, B.x + B.w - 46]) { ctx.fillStyle = dk ? '#FFE9B0' : '#9FC9DE'; ctx.fillRect(wx, B.y + 10, 40, 24); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(wx, B.y + 10, 40, 3);
      const bob = Math.abs(Math.sin(gt * 8 + wx)) * 2; ctx.fillStyle = '#2B3039'; ctx.fillRect(wx + 10, B.y + 29, 20, 3); ctx.fillStyle = wx < B.x + 40 ? '#4B8DFF' : '#5FE584'; ctx.fillRect(wx + 17, B.y + 19 - bob, 6, 9); ctx.fillStyle = '#20262E'; ctx.fillRect(wx + 12, B.y + 18 - bob, 16, 1.6);
      ctx.strokeStyle = '#2B3039'; ctx.lineWidth = 2; ctx.strokeRect(wx, B.y + 10, 40, 24); }
    ctx.fillStyle = '#20262E'; ctx.fillRect(GYM2_AT.x - 12, B.y, 24, 26); ctx.fillStyle = dk ? '#FFE9B0' : '#9FC9DE'; ctx.fillRect(GYM2_AT.x - 9, B.y + 3, 8, 23); ctx.fillRect(GYM2_AT.x + 1, B.y + 3, 8, 23);
    ctx.fillStyle = '#B9B4AA'; ctx.fillRect(GYM2_AT.x - 16, B.y - 12, 32, 12);
    ctx.fillStyle = '#20262E'; rr(B.x + B.w / 2 - 50, g.ry0 + 7, 100, 20, 5); ctx.fill(); ctx.strokeStyle = '#E05555'; ctx.lineWidth = 2; rr(B.x + B.w / 2 - 50, g.ry0 + 7, 100, 20, 5); ctx.stroke();
    signTxt('IRON GYM', B.x + B.w / 2 + 6, g.ry0 + 14, '900 9.5px sans-serif', '#F4F4F8'); signTxt('EXPRESS', B.x + B.w / 2 + 6, g.ry0 + 22.5, '800 6.5px sans-serif', '#FF8A8A');
    const hx = B.x + B.w / 2 - 38, hy = g.ry0 + 17; ctx.fillStyle = '#E05555'; ctx.fillRect(hx - 5, hy - 1.2, 11, 2.4); ctx.fillRect(hx - 7, hy - 4, 2.6, 8); ctx.fillRect(hx + 4.4, hy - 4, 2.6, 8);
  }
  function drawGym() { // v97: am Stadtpark, Eingang oben zur Hauptstrasse
    const B = GYM; if (!inView(B.x + B.w / 2, B.y + B.h / 2, 240)) return; const dk = lightK() > 0.25;
    const g = bldBase(B, -1, 60, '#4A5260', '#5E656E', 'flat');
    acUnit(B.x + 14, g.ry0 + g.rh - 30); acUnit(B.x + 44, g.ry0 + g.rh - 30); ctx.fillStyle = '#3E454F'; ctx.fillRect(B.x + B.w - 46, g.ry0 + 14, 32, 22); ctx.fillStyle = '#2B3039'; ctx.fillRect(B.x + B.w - 42, g.ry0 + 18, 24, 14);
    ctx.fillStyle = '#E05555'; ctx.fillRect(B.x, B.y + 55, B.w, 5); // rote Zierleiste
    for (const wx of [B.x + 8, B.x + B.w - 70]) { ctx.fillStyle = dk ? '#FFE9B0' : '#9FC9DE'; ctx.fillRect(wx, B.y + 14, 62, 32); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(wx, B.y + 14, 62, 4);
      for (let k = 0; k < 3; k++) { const tx = wx + 5 + k * 20, bob = Math.abs(Math.sin(gt * 9 + k * 1.7 + wx)) * 2; ctx.fillStyle = '#2B3039'; ctx.fillRect(tx, B.y + 40, 14, 4); ctx.fillStyle = ['#E05555', '#4B8DFF', '#5FE584'][(k + (wx > B.x + 50 ? 1 : 0)) % 3]; ctx.fillRect(tx + 4, B.y + 28 - bob, 6, 9); ctx.fillStyle = '#F1C9A5'; ctx.beginPath(); ctx.arc(tx + 7, B.y + 25 - bob, 3, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#2B3039'; ctx.lineWidth = 2; ctx.strokeRect(wx, B.y + 14, 62, 32); ctx.fillStyle = '#2B3039'; ctx.fillRect(wx + 30, B.y + 14, 2, 32); }
    ctx.fillStyle = '#20262E'; ctx.fillRect(GYM_AT.x - 14, B.y, 28, 30); ctx.fillStyle = dk ? '#FFE9B0' : '#9FC9DE'; ctx.fillRect(GYM_AT.x - 11, B.y + 3, 10, 27); ctx.fillRect(GYM_AT.x + 1, B.y + 3, 10, 27);
    ctx.fillStyle = '#B9B4AA'; ctx.fillRect(GYM_AT.x - 18, B.y - 16, 36, 16); // Stufe zum Gehweg
    ctx.fillStyle = '#20262E'; rr(B.x + B.w / 2 - 48, g.ry0 + 10, 96, 22, 5); ctx.fill(); ctx.strokeStyle = '#E05555'; ctx.lineWidth = 2; rr(B.x + B.w / 2 - 48, g.ry0 + 10, 96, 22, 5); ctx.stroke();
    signTxt('IRON GYM', B.x + B.w / 2 + 8, g.ry0 + 21, '900 13px sans-serif', '#F4F4F8');
    const hx = B.x + B.w / 2 - 34, hy = g.ry0 + 21; ctx.fillStyle = '#E05555'; ctx.fillRect(hx - 6, hy - 1.5, 14, 3); ctx.fillRect(hx - 8, hy - 5, 3, 10); ctx.fillRect(hx + 5, hy - 5, 3, 10);
    if (gymAnim) { gymAnim.t += 1 / 60; if (gymAnim.t > 1.5) gymAnim = null; }
  }
  function drawBank() { // v109: Eingang oben zur Nordallee
    const B = BANK; if (!inView(B.x + B.w / 2, B.y + B.h / 2, 240)) return; const dk = lightK() > 0.25;
    ctx.fillStyle = '#D8D0BE'; ctx.fillRect(B.x - 10, 0, B.w + 20, B.y); for (let k = 0; k < 3; k++) { ctx.fillStyle = k % 2 ? '#CFC6B2' : '#E2DACA'; ctx.fillRect(BANK_AT.x - 30 + k * 3, B.y - 4 - k * 4, 60 - k * 6, 4); } // Treppe
    const g = bldBase(B, -1, 66, '#E8DFC8', '#4E5866', 'gable');
    ctx.fillStyle = '#D6CCB2'; ctx.fillRect(B.x, B.y + 58, B.w, 8); ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let k = B.y + 6; k < B.y + 58; k += 8) ctx.fillRect(B.x, k, B.w, 1);
    for (let k = 0; k < 6; k++) { const cx = B.x + 16 + k * ((B.w - 32) / 5); if (Math.abs(cx - BANK_AT.x) < 22) continue; ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(cx - 4, B.y + 2, 10, 54); ctx.fillStyle = '#F4EEDF'; ctx.fillRect(cx - 5, B.y, 10, 54); ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(cx - 1, B.y, 2, 54); ctx.fillStyle = '#E2D8C2'; ctx.fillRect(cx - 7, B.y + 50, 14, 5); }
    ctx.fillStyle = '#5A3A22'; ctx.fillRect(BANK_AT.x - 15, B.y, 30, 38); ctx.fillStyle = '#E8B84A'; ctx.fillRect(BANK_AT.x - 1, B.y + 2, 2, 34); ctx.beginPath(); ctx.arc(BANK_AT.x - 5, B.y + 20, 1.6, 0, TAU); ctx.arc(BANK_AT.x + 5, B.y + 20, 1.6, 0, TAU); ctx.fill();
    const ax = B.x + B.w - 24, ay = B.y + 4; ctx.fillStyle = '#3A3F47'; ctx.fillRect(ax - 9, ay, 18, 26); ctx.fillStyle = 'rgba(95,229,132,' + (0.6 + 0.3 * Math.sin(gt * 3)) + ')'; ctx.fillRect(ax - 6, ay + 15, 12, 8); ctx.fillStyle = '#8C96A3'; ctx.fillRect(ax - 6, ay + 4, 12, 2); ctx.fillRect(ax - 6, ay + 8, 12, 2);
    ctx.fillStyle = '#C0282E'; rr(B.x + B.w / 2 - 66, g.ry0 + 14, 132, 22, 5); ctx.fill(); signTxt('STADTSPARKASSE', B.x + B.w / 2 + 6, g.ry0 + 25, '900 10.5px sans-serif', '#FFFFFF');
    const cx = B.x + B.w / 2 - 56, cy = g.ry0 + 25; ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, TAU); ctx.fill(); signTxt('€', cx, cy + 0.5, '900 9px sans-serif', '#8A6A10');
    if (dk) glow(BANK_AT.x, B.y - 6, 40, '255,220,150', 0.18);
  }

  function drawPizza() {
    const B = PIZZA; if (!inView(B.x + B.w / 2, B.y + B.h / 2, 240)) return; const dk = lightK() > 0.25;
    const g = { fy0: B.y, ry0: B.y + 50, rh: B.h - 50 }; // gleiche Werte wie bldBase(B, -1, 50, ...)
    bcDraw('pizA' + (seaSnow() ? 'w' : ''), B.x - 8, B.y - 50, B.w + 24, B.h + 68, () => { // v157: fester Teil als Bild
    // Terrasse mit Tischen und Schirmen vor dem Eingang (Norden)
    ctx.fillStyle = '#A39E94'; ctx.fillRect(PIZZA_AT.x - 18, B.y - 48, 36, 19); ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let k = B.y - 48; k < B.y - 30; k += 6) ctx.fillRect(PIZZA_AT.x - 18, k, 36, 1); // v99: Pflasterweg vom Gehweg zur Terrasse
    ctx.fillStyle = '#B98A62'; ctx.fillRect(B.x - 6, B.y - 30, B.w + 12, 30); ctx.fillStyle = 'rgba(0,0,0,.1)'; for (let x = B.x - 6; x < B.x + B.w + 6; x += 12) ctx.fillRect(x, B.y - 30, 1, 30);
    bldBase(B, -1, 50, '#B5523A', '#C9703F', 'gable');
    ctx.fillStyle = 'rgba(0,0,0,.1)'; for (let r = 0; r < 6; r++) for (let q = B.x + (r % 2) * 7; q < B.x + B.w; q += 14) ctx.fillRect(q, g.fy0 + 4 + r * 7, 13, 1); // Klinker
    });
    // Steinofen-Kamin mit Glut und Rauch
    const kx = B.x + B.w - 30, ky = g.ry0 + 18; ctx.fillStyle = '#6A4A3A'; ctx.beginPath(); ctx.arc(kx, ky, 10, 0, TAU); ctx.fill(); ctx.fillStyle = '#2A1A12'; ctx.beginPath(); ctx.arc(kx, ky, 6, 0, TAU); ctx.fill(); glow(kx, ky, 12, '255,140,60', 0.35 + 0.15 * Math.sin(gt * 5));
    for (let k = 0; k < 3; k++) { const ph = (gt * 0.3 + k / 3) % 1; ctx.fillStyle = 'rgba(210,210,215,' + (0.25 * (1 - ph)) + ')'; ctx.beginPath(); ctx.arc(kx + Math.sin(gt + k) * 5 * ph, ky - 6 - ph * 34, 3 + ph * 6, 0, TAU); ctx.fill(); }
    bcDraw('pizB' + (dk ? 'd' : 'l'), B.x - 8, B.y - 50, B.w + 24, B.h + 68, () => {
    // Markise gruen-weiss-rot, Fenster, Tuer
    const cols = ['#2E9B4F', '#F4F4F8', '#D33F3F']; for (let k = 0; k < 9; k++) { ctx.fillStyle = cols[k % 3]; ctx.fillRect(B.x + 4 + k * ((B.w - 8) / 9), g.fy0 + g.rh * 0 + 50 - 50 + 2, (B.w - 8) / 9, 10); } ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(B.x + 4, B.y + 12, B.w - 8, 2);
    for (const wx of [B.x + 12, B.x + B.w - 44]) { ctx.fillStyle = dk ? '#FFD890' : '#F2E2C4'; ctx.fillRect(wx, B.y + 18, 32, 22); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(wx, B.y + 18, 32, 3); ctx.strokeStyle = '#5A3A22'; ctx.lineWidth = 2; ctx.strokeRect(wx, B.y + 18, 32, 22); ctx.fillStyle = '#D33F3F'; ctx.fillRect(wx + 2, B.y + 34, 28, 4); }
    ctx.fillStyle = '#4A2E1E'; ctx.fillRect(PIZZA_AT.x - 13, B.y, 26, 30); ctx.fillStyle = dk ? '#FFD890' : '#C9A87A'; ctx.fillRect(PIZZA_AT.x - 9, B.y + 4, 18, 12);
    ctx.fillStyle = '#20262E'; rr(B.x + B.w / 2 - 46, B.y + 52, 92, 18, 9); ctx.fill(); signTxt('Bella Notte', B.x + B.w / 2, B.y + 61.5, 'italic 900 12px Georgia, serif', dk ? '#FFD24A' : '#F4E6C8');
    for (const [tx, ty, uc] of [[B.x + 12, B.y - 18, '#D33F3F'], [B.x + B.w - 16, B.y - 18, '#2E9B4F']]) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.arc(tx + 2, ty + 2, 11, 0, TAU); ctx.fill(); ctx.fillStyle = uc; ctx.beginPath(); ctx.arc(tx, ty, 11, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(tx, ty); ctx.arc(tx, ty, 11, k * Math.PI / 2, k * Math.PI / 2 + Math.PI / 4); ctx.closePath(); ctx.fill(); } ctx.fillStyle = '#20262E'; ctx.beginPath(); ctx.arc(tx, ty, 1.6, 0, TAU); ctx.fill(); }
    });
  }
  function drawBoulevard() { const y0 = 1262, y1 = 1300, x0 = 4466, x1 = 5196; if (!inView((x0 + x1) / 2, y0, 500)) return; bcDraw('blvd' + (clubOpen() ? 1 : 0) + (lightK() > 0.25 ? 1 : 0), x0 - 6, y0 - 10, x1 - x0 + 12, y1 - y0 + 16, drawBoulevard0); } // v157
  function drawBoulevard0() { // v97: Neon-Boulevard vor Casino und Club
    const y0 = 1262, y1 = 1300, x0 = 4466, x1 = 5196; if (!inView((x0 + x1) / 2, y0, 500)) return; const op = clubOpen();
    ctx.fillStyle = '#3A2E3E'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let x = x0; x < x1; x += 24) ctx.fillRect(x, y0, 12, y1 - y0);
    ctx.fillStyle = 'rgba(255,92,168,.55)'; ctx.fillRect(x0, y0, x1 - x0, 2); ctx.fillStyle = 'rgba(91,232,255,.45)'; ctx.fillRect(x0, y1 - 2, x1 - x0, 2);
    for (let x = x0 + 40; x < x1; x += 120) { const on = op || lightK() > 0.25, c = ['#FF5CA8', '#5BE8FF', '#FFD24A'][Math.floor((x - x0) / 120) % 3]; ctx.fillStyle = '#20262E'; ctx.fillRect(x - 2, y0 - 2, 4, 6); ctx.fillStyle = on ? c : '#5A4A5E'; ctx.beginPath(); ctx.arc(x, y0 - 4, 3.2, 0, TAU); ctx.fill(); }
    signTxt('NEON-BOULEVARD', x0 + 120, y0 + 20, '900 10px sans-serif', op ? '#FF9AD0' : '#8A6A80');
  }
  function drawClub() {
    const B = CLUB; if (!inView(B.x + B.w / 2, B.y + B.h / 2, 260)) return; const op = clubOpen(), beat = op ? Math.max(0, Math.sin(gt * 8.4)) : 0, by = B.y + B.h;
    const g = bldBase(B, 1, 56, '#1E1A2A', '#2A2534', 'flat');
    acUnit(B.x + 14, g.ry0 + 12); ctx.fillStyle = '#3A3348'; ctx.fillRect(B.x + B.w - 60, g.ry0 + 14, 44, 30); ctx.fillStyle = op ? 'rgba(255,92,168,' + (0.25 + beat * 0.35) + ')' : '#2A2534'; ctx.fillRect(B.x + B.w - 56, g.ry0 + 18, 36, 22);
    const pink = op ? 'rgba(255,92,168,' + (0.75 + beat * 0.25) + ')' : '#7A4A62', cyan = op ? 'rgba(91,232,255,' + (0.7 + beat * 0.3) + ')' : '#3A6A72';
    ctx.save(); if (op) { ctx.shadowColor = '#FF5CA8'; ctx.shadowBlur = 10 + beat * 8; } ctx.fillStyle = pink; ctx.fillRect(B.x + 4, g.fy0 + 3, B.w - 8, 2); ctx.fillRect(B.x + 4, by - 5, B.w - 8, 2);
    signTxt('NEON', B.x + 50, g.fy0 + 24, '900 20px sans-serif', pink); if (op) ctx.shadowColor = '#5BE8FF'; signTxt('CLUB', B.x + 50, g.fy0 + 42, '900 10px sans-serif', cyan); signTxt('♪', B.x + B.w - 34, g.fy0 + 30, '900 22px sans-serif', cyan); ctx.restore();
    ctx.fillStyle = '#10151C'; ctx.fillRect(CLUB_AT.x - 13, by - 38, 26, 38); ctx.fillStyle = '#B3122E'; ctx.fillRect(CLUB_AT.x - 11, by, 22, 22);
    for (const sx of [-1, 1]) { for (let k = 0; k < 2; k++) { const px = CLUB_AT.x + sx * 19, py = by + 4 + k * 14; ctx.fillStyle = '#E8B84A'; ctx.beginPath(); ctx.arc(px, py, 2.4, 0, TAU); ctx.fill(); } ctx.strokeStyle = '#B3122E'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(CLUB_AT.x + sx * 19, by + 4); ctx.quadraticCurveTo(CLUB_AT.x + sx * 22, by + 11, CLUB_AT.x + sx * 19, by + 18); ctx.stroke(); }
    if (op) { drawFigure(CLUB_AT.x + 32, by + 10, -Math.PI / 2, 0, CLUB_BOUNCER);
      for (let k = 0; k < 4; k++) { const L = CLUB_QUEUE[k], qx = CLUB_AT.x - 36 - k * 15, qy = by + 12 + (k % 2) * 4, bob = Math.max(0, Math.sin(gt * 8.4 + k)) * 1.6; drawFigure(qx, qy - bob, 0, 0, L); } }
  }
  const CLUB_BOUNCER = Object.assign({}, DEF_LOOK, { r: 20, g: 20, b: 26, top: 'leather', bot: 'suitpants', hair: 0, hs: 10, skin: 3, size: 1.15 });
  const CLUB_QUEUE = [[255, 92, 168, 'f', 4], [91, 232, 255, 'm', 1], [255, 210, 74, 'f', 7], [180, 120, 255, 'm', 2]].map(([r, g, b, sex, hs], i) => Object.assign({}, DEF_LOOK, { r, g, b, sex, hs, hair: i % 3, skin: i % 4, top: i % 2 ? 'bomber' : 'tshirt', bot: sex === 'f' ? 'skirt' : 'jeans' }));


  // ---------- v94: mehr Details in der Welt: Grasbueschel und Blumen, Gullydeckel, Strassenschilder, Bushaltestellen, Fahrradstaender, Katzen, Schmetterlinge, Wolkenschatten ----------
  let DET = null;
  function detInit() {
    let s = 9001; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const blocked = (x, y, m) => colliders.some(c => !c.fl && x > c.x - m && x < c.x + c.w + m && y > c.y - m && y < c.y + c.h + m) || onPath(x, y) || onStreet(x, y, 4);
    const tufts = [];
    for (const z of GROUNDS) { if (!['park', 'garden', 'allot', 'dog'].includes(z.t)) continue; const n = Math.min(260, Math.round(z.w * z.h / 2600));
      for (let i = 0; i < n; i++) { const x = z.x + 8 + rnd() * (z.w - 16), y = z.y + 8 + rnd() * (z.h - 16); if (blocked(x, y, 6)) continue; const r = rnd(); tufts.push({ x, y, k: r < 0.62 ? 0 : r < 0.84 ? 1 : r < 0.93 ? 2 : 3, c: Math.floor(rnd() * 5), s: 0.8 + rnd() * 0.5 }); } }
    const holes = [], cracks = [];
    for (const r of RD) { const len = r.h ? WW : WH;
      for (let t = (r.h ? 0 : YMIN) + 90; t < len; t += 230 + Math.floor(rnd() * 120)) { const x = r.h ? t : r.c0 + (r.c1 - r.c0) * (rnd() < 0.5 ? 0.28 : 0.72), y = r.h ? r.c0 + (r.c1 - r.c0) * (rnd() < 0.5 ? 0.28 : 0.72) : t; if ((r.h ? RDV : RDH).some(o => (r.h ? x : y) > o.c0 - 20 && (r.h ? x : y) < o.c1 + 20)) continue; holes.push({ x, y }); }
      for (let t = (r.h ? 0 : YMIN) + 40; t < len; t += 160 + Math.floor(rnd() * 200)) { const x = r.h ? t : r.c0 + 10 + rnd() * (r.c1 - r.c0 - 20), y = r.h ? r.c0 + 10 + rnd() * (r.c1 - r.c0 - 20) : t; cracks.push({ x, y, a: rnd() * TAU, l: 10 + rnd() * 18, p: rnd() < 0.35 }); } }
    const signs = []; let ni = 0; for (const hr of RDH) for (const v of RDV) { signs.push({ x: v.c1 + SW - 8, y: hr.c0 - SW + 8, a: hr.name, b: v.name }); } /* v109: echte Strassennamen */
    const stops = busStops(); // v104: Buslinie mit Haltestelle in jedem Stadtteil
    const racks = [{ x: GYM.x + 18, y: GYM.y + GYM.h + 26, n: 3 }, { x: 3070, y: RDH[0].c1 + 12, n: 4 }, { x: PIZZA.x + PIZZA.w + 14, y: PIZZA.y - 14, n: 2, v: true }];
    const cats = [];
    const freeNear = (x, y) => { for (const [dx, dy] of [[0, 0], [0, 26], [0, -26], [26, 0], [-26, 0], [30, 30], [-30, 30], [0, 44], [44, 0], [-44, 0], [0, -44]]) if (!blockedPt(x + dx, y + dy, 8)) return { x: x + dx, y: y + dy }; return { x, y }; }; // v148: keine Katzen mehr auf Daechern
    const homes = SHEDS.slice(0, 3).map(sh => freeNear(sh.x + sh.w / 2, sh.y + sh.h + 16)).concat([{ x: 1300, y: 1600 }, { x: 4100, y: 1120 }, { x: 420, y: 1150 }]);
    homes.map(hm => freeNear(hm.x, hm.y)).forEach((hm, i) => cats.push({ hx: hm.x, hy: hm.y, x: hm.x, y: hm.y, tx: hm.x, ty: hm.y, roof: false, c: ['#E8913A', '#8A8F99', '#2A2A30', '#F2EDE4', '#B07A4A', '#E8913A'][i % 6], st: 'sit', t: 2 + i, a: rnd() * TAU, run: 0 }));
    DET = { tufts, holes, cracks, signs, stops, racks, cats };
  }
  function drawDetailsGround() {
    if (!DET) detInit(); const si = seasonI(), win = si === 3 && !KR_NEUTRAL, aut = si === 2 && !KR_NEUTRAL;
    for (const b of DET.stops) drawBusBay(b); // v104
    for (const c of DET.cracks) { if (!inView(c.x, c.y, 30)) continue; if (c.p) { ctx.fillStyle = 'rgba(0,0,0,.10)'; ctx.fillRect(c.x - c.l * 0.6, c.y - c.l * 0.35, c.l * 1.2, c.l * 0.7); ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fillRect(c.x - c.l * 0.6, c.y - c.l * 0.35, c.l * 1.2, 1.5); continue; }
      ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c.x, c.y); const dx = Math.cos(c.a), dy = Math.sin(c.a); ctx.lineTo(c.x + dx * c.l * 0.5 + dy * 3, c.y + dy * c.l * 0.5 - dx * 3); ctx.lineTo(c.x + dx * c.l, c.y + dy * c.l); ctx.moveTo(c.x + dx * c.l * 0.5 + dy * 3, c.y + dy * c.l * 0.5 - dx * 3); ctx.lineTo(c.x + dx * c.l * 0.6 + dy * 9, c.y + dy * c.l * 0.6 - dx * 9); ctx.stroke(); }
    for (const m of DET.holes) { if (!inView(m.x, m.y, 20)) continue; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(m.x + 1, m.y + 1.5, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#4A4F57'; ctx.beginPath(); ctx.arc(m.x, m.y, 8, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2E3238'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(m.x, m.y, 6.2, 0, TAU); ctx.stroke(); for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(m.x - 5, m.y + k * 2.6); ctx.lineTo(m.x + 5, m.y + k * 2.6); ctx.stroke(); } }
    const FC = ['#FF8FB8', '#FFD24A', '#FFFFFF', '#B58CFF', '#FF7A5A'], GC = aut ? ['#8A7A3A', '#A0882E'] : win ? ['#9AA8A0', '#B8C4BE'] : ['#3E7A3A', '#5A9A48'];
    for (const t of DET.tufts) { if (!inView(t.x, t.y, 12)) continue; const s = t.s;
      if (t.k === 0 || (win && t.k === 1)) { if (gsPass === 1) continue; /* v137: Grashalme wiegen sich live */ ctx.strokeStyle = GC[t.c % 2]; ctx.lineWidth = 1.3; ctx.beginPath(); for (const o of [-2.5, 0, 2.5]) { ctx.moveTo(t.x + o * s, t.y + 2); ctx.lineTo(t.x + o * s * 1.6 + Math.sin(gt * 1.3 + t.x) * 0.6, t.y - 4.5 * s); } ctx.stroke(); }
      else if (t.k === 1) { ctx.strokeStyle = '#3E7A3A'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(t.x, t.y + 2); ctx.lineTo(t.x, t.y - 3); ctx.stroke(); ctx.fillStyle = FC[t.c]; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(t.x + Math.cos(k * 1.256) * 1.8 * s, t.y - 4 + Math.sin(k * 1.256) * 1.8 * s, 1.3 * s, 0, TAU); ctx.fill(); } ctx.fillStyle = '#FFE27A'; ctx.beginPath(); ctx.arc(t.x, t.y - 4, 1 * s, 0, TAU); ctx.fill(); }
      else if (t.k === 2) { ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(t.x + 1, t.y + 1.5, 4 * s, 2.6 * s); ctx.fill(); ctx.fillStyle = '#8A8F96'; ell(t.x, t.y, 4 * s, 2.8 * s); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.18)'; ell(t.x - 1, t.y - 1, 2 * s, 1.2 * s); ctx.fill(); }
      else if (!win) { ctx.fillStyle = aut ? '#9A6A2A' : '#4E9A4A'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(t.x + Math.cos(k * 2.1) * 2.2, t.y + Math.sin(k * 2.1) * 2.2, 2 * s, 0, TAU); ctx.fill(); } } }
  }
  // ---------- v104: Buslinie. In jedem Stadtteil eine Haltestelle; mit dem Bus faehrt man nur zwischen Haltestellen in freigeschalteten Stadtteilen ----------
  const BUS_FARE = 5, BUS_CD = 120; // v126: nach einer Fahrt 120 Spielminuten warten (etwa 1 bis 1,5 Minuten echte Zeit)
  const busWait = () => Math.max(0, Math.ceil(((G && G.busCd) || 0) - absMin()));
  const BUS_DEF = [
    { id: 'start', name: 'Kellerweg', x: 1000, r: 'H1', s: -1 }, { id: 'ufer', name: 'Uferpark', x: 1100, r: 'H2', s: 1 },
    { id: 'markt', name: 'Skaterpark', x: 2900, r: 'H1', s: 1 }, { id: 'sued', name: 'Südstraße', x: 3000, r: 'H3', s: -1 },
    { id: 'gew', name: 'Gewerbehof', x: 3980, r: 'H1', s: -1 }, { id: 'neon', name: 'Neon-Boulevard', x: 4700, r: 'H1', s: 1 },
    { id: 'gang', name: 'Gangviertel', x: 4800, r: 'H3', s: 1 }, { id: 'nord', name: 'Nordring', x: 2200, r: 'HN', s: 1 }
  ];
  let BUS_ST = null;
  function busStops() { // Platz auf dem Gehweg suchen: nicht an Kreuzungen, Haustueren, Eingaengen, Laternen, Tonnen oder Pfaden
    if (BUS_ST) return BUS_ST;
    const ents = [GYM_AT, GYM2_AT, PIZZA_AT, CLUB_AT, BANK_AT, MAKLER_AT, APO_AT, LAGER_AT, WS_AT, KIOSK_AT, TREFF_AT, GV_AT, AH_AT, { x: 3070, y: RDH[0].c1 + 12 }, { x: DOOR.x, y: DOOR.y + 50 }, { x: DOOR2.x, y: DOOR2.y + 50 }, { x: DOOR3.x, y: DOOR3.y - 50 }].filter(Boolean);
    const bad = (x, y, rd) => NAV_VL.some(l => l.k === 'w' && Math.abs(l.x - x) < 110 && l.y0 <= rd.c0 && l.y1 >= rd.c1) || x < 80 || x > WW - 80 || RDV.some(v => x > v.c0 - SW - 70 && x < v.c1 + SW + 70) || HOUSES.some(q => Math.abs(q.dx - x) < 56 && Math.abs(q.dy - y) < 50)
      || ents.some(q => Math.abs(q.x - x) < 96 && Math.abs(q.y - y) < 56) || LAMPS.some(l => Math.abs(l.x - x) < 56 && Math.abs(l.y - y) < 30) || BINS.some(q => Math.abs(q.x - x) < 60 && Math.abs(q.y - y) < 30)
      || [-40, -20, 0, 20, 40, 58].some(k => inKeep(x + k, y, 4) || inKeep(x + k, y + (rd.c0 > y ? -16 : 16), 4)) || [-50, -30, -10, 10, 30, 50].some(k => onPath(x + k, y)) || colliders.some(c => !c.fl && c.x < x + 52 && c.x + c.w > x - 44 && c.y < y + 12 && c.y + c.h > y - 12);
    BUS_ST = BUS_DEF.map(d => { const rd = RD.find(r => r.id === d.r), up = d.s < 0, y = up ? rd.c0 - 13 : rd.c1 + 13; let x = d.x;
      for (let k = 0; k <= 700; k += 10) { if (!bad(d.x + k, y, rd)) { x = d.x + k; break; } if (!bad(d.x - k, y, rd)) { x = d.x - k; break; } }
      return Object.assign({}, d, { x, y, up, rd, dir: up ? -1 : 1, lane: up ? rd.c0 + 23 : rd.c1 - 23 }); });
    return BUS_ST;
  }
  const busZone = s => (ZONE_DEF.find(z => z.r.some(([x0, y0, x1, y1]) => s.x >= x0 && s.x < x1 && s.y >= y0 && s.y < y1)) || { name: 'Stadt', rep: 0 });
  const busOpen = s => !!G && !GH_ON && G.rep >= busZone(s).rep;
  const busStand = s => ({ x: s.x - 6, y: s.y + (s.up ? 9 : -9) });
  function busNear() { if (!G || player.fl || player.x < 0 || GH_ON || busRide) return -1; const st = busStops(); let bi = -1, bd = 50; st.forEach((s, i) => { const d = Math.hypot(player.x - s.x, player.y - s.y); if (d < bd && busOpen(s)) { bd = d; bi = i; } }); return bi; }
  let busRide = null, busFx = null, busAt = -1;
  const busChased = () => cops.concat(copMates).some(c => c.on !== false && c.st === 'alert');
  function busGo(j) {
    const i = busNear(), st = busStops(), s = st[j];
    if (i < 0 || !s || i === j) return false;
    if (!busOpen(s)) { sfx.bad(); msg('Dorthin fährt der Bus erst ab Ruf ' + busZone(s).rep, true); return false; }
    if (busChased()) { sfx.bad(); msg('Die Polizei ist hinter dir her. Der Bus wartet nicht.', true); return false; }
    if (busWait() > 0) { sfx.bad(); msg('🚌 Der nächste Bus kommt in ' + busWait() + ' Spielminuten', true); return false; }
    if (G.money < BUS_FARE) { sfx.bad(); msg('Kein Geld für die Fahrkarte (' + fmt(BUS_FARE) + ')', true); return false; }
    G.money -= BUS_FARE; G.busCd = absMin() + BUS_CD; if (riding()) toggleRide(false); if (phoneOpen) closePhone();
    busRide = { from: i, to: j, ph: 0, t: 0 }; busFx = null; G.stat.bus = (G.stat.bus || 0) + 1; joy.id = null; joy.dx = joy.dy = 0; sfx.buy(); return true;
  }
  function busTick(dt) {
    const r = busRide; if (!r) return; r.t += dt;
    if (r.ph === 0 && r.t >= 1.6) { r.ph = 1; r.t = 0; sfx.put(); }
    else if (r.ph === 1 && r.t >= 0.55) { const s = busStops()[r.to], p = busStand(s); player.x = p.x; player.y = p.y; player.fl = 0; player.ang = s.up ? Math.PI / 2 : -Math.PI / 2; cam.x = player.x; cam.y = player.y; petSnap(); r.ph = 2; r.t = 0; busFx = { i: r.to, t0: gt + 0.7 }; }
    else if (r.ph === 2 && r.t >= 0.55) { const s = busStops()[r.to]; busRide = null; sfx.ping(); msg('🚌 Haltestelle ' + s.name + ' · ' + busZone(s).name); save(); }
  }
  function renderBus(b) {
    const i = busNear(), st = busStops();
    if (i < 0 || i !== busAt) { uiInfo(b, 'Stell dich an eine Haltestelle (gelbes Schild mit grünem H), dann kannst du hier mit dem Bus fahren.'); return; }
    uiInfo(b, '🚌 <b>Linie K</b> · Haltestelle <b>' + st[i].name + '</b><br>Der Bus bringt dich zu jeder Haltestelle in Stadtteilen, die du schon freigeschaltet hast. Fahrkarte ' + fmt(BUS_FARE) + '. Nach jeder Fahrt dauert es ' + BUS_CD / 60 + ' Spielstunden bis zum nächsten Bus.' + (busWait() > 0 ? '<br><b style="color:var(--amber)">Nächster Bus in ' + busWait() + ' Spielminuten.</b>' : ''));
    const wrap = uiEl('div', 'busline');
    st.forEach((s, j) => { const z = busZone(s), op = busOpen(s), here = j === i, row = uiEl('div', 'card bst' + (here ? ' here' : op ? '' : ' lock'));
      const dot = uiEl('span', 'bdot', here ? '●' : op ? '' : '🔒'); row.appendChild(dot);
      const tx = uiEl('div', 'btx'); tx.appendChild(uiEl('div', 'bnm', s.name)); tx.appendChild(uiEl('div', 'bzn', z.name + (op ? '' : ' · ab Ruf ' + z.rep))); row.appendChild(tx);
      if (here) row.appendChild(uiEl('span', 'bhere', 'Du bist hier'));
      else { const bt = uiEl('button', 'buy', !op ? 'Gesperrt' : busWait() > 0 ? busWait() + ' Min.' : 'Fahren'); bt.disabled = !op || G.money < BUS_FARE || busWait() > 0; bt.addEventListener('click', () => busGo(j)); row.appendChild(bt); }
      wrap.appendChild(row); });
    b.appendChild(wrap);
  }
  function drawBusStop(b) { // v157: Haltestelle als zwei fertige Bilder, Licht und Blinken live
    if (!inView(b.x, b.y, 80)) return; const sg = b.up ? 1 : -1, nt = lightK(), op = busOpen(b), Y = v => b.y + v * sg; // sg: Rueckseite liegt bei -16 (oben) bzw. +16 (unten)
    const rr = (x, y0, w, y1, r) => { const t = Math.min(y0, y1), hh = Math.abs(y1 - y0); ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, t, w, hh, r); else ctx.rect(x, t, w, hh); };
    bcDraw('busA' + (b.x + ',' + b.y + (b.up ? 'u' : 'd')), b.x - 44, b.y - 36, 108, 72, () => {
      ctx.fillStyle = 'rgba(0,0,0,.26)'; rr(b.x - 33, Y(-15), 72, Y(7), 4); ctx.fill(); // Schatten
      ctx.fillStyle = '#A6AEB8'; rr(b.x - 38, Y(-17), 76, Y(10), 3); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1; for (let k = -30; k <= 30; k += 12) { ctx.beginPath(); ctx.moveTo(b.x + k, Y(-17)); ctx.lineTo(b.x + k, Y(10)); ctx.stroke(); } // Plattenbelag
      ctx.fillStyle = '#E9ECEF'; ctx.fillRect(b.x - 38, Math.min(Y(8), Y(10)), 76, 2); // Bordstein-Kante
      ctx.fillStyle = '#8A5A3A'; rr(b.x - 24, Y(-12), 48, Y(-6), 2); ctx.fill(); ctx.fillStyle = '#B07A4A'; for (let k = 0; k < 3; k++) ctx.fillRect(b.x - 23, Math.min(Y(-11.5 + k * 2), Y(-10.5 + k * 2)), 46, 1); // Bank
      ctx.fillStyle = '#26313F'; rr(b.x - 34, Y(-17), 68, Y(-14), 1); ctx.fill(); // Rueckwand
      const ad = ctx.createLinearGradient(b.x + 8, 0, b.x + 32, 0); ad.addColorStop(0, '#FF5CA8'); ad.addColorStop(1, '#FFB547'); ctx.fillStyle = ad; ctx.fillRect(b.x + 8, Math.min(Y(-17), Y(-14)), 24, 3); // Werbung
    });
    if (nt > 0.25) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gl = ctx.createRadialGradient(b.x, Y(-4), 4, b.x, Y(-4), 46); gl.addColorStop(0, 'rgba(255,220,150,' + (0.32 * nt).toFixed(3) + ')'); gl.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = gl; ctx.fillRect(b.x - 50, b.y - 50, 100, 100); ctx.restore(); }
    bcDraw('busB' + (b.x + ',' + b.y + (b.up ? 'u' : 'd')) + b.name, b.x - 44, b.y - 36, 108, 72, () => {
      ctx.fillStyle = 'rgba(175,220,245,.36)'; rr(b.x - 35, Y(-18), 70, Y(3), 4); ctx.fill(); // Glasdach
      ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(b.x - 33, Math.min(Y(-16), Y(-15)), 66, 1.2); ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1; for (let k = -22; k <= 22; k += 11) { ctx.beginPath(); ctx.moveTo(b.x + k, Y(-17)); ctx.lineTo(b.x + k, Y(2)); ctx.stroke(); }
      ctx.strokeStyle = '#1E7A52'; ctx.lineWidth = 2; rr(b.x - 35, Y(-18), 70, Y(3), 4); ctx.stroke();
      ctx.fillStyle = '#1E7A52'; for (const px of [b.x - 34, b.x + 31]) for (const py of [Y(-17), Y(0)]) ctx.fillRect(px, Math.min(py, py + 3 * sg), 3, 3); // Stuetzen
      ctx.fillStyle = '#1E9E55'; rr(b.x - 35, Y(-1), 70, Y(4), 2); ctx.fill(); // Namensband vorne
      ctx.fillStyle = '#F4F7F2'; ctx.font = '800 5.6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(b.name.toUpperCase(), b.x, Y(1.5) + 0.3);
      const hx = b.x + 46, hy = Y(4); // Haltestellenschild an der Bordsteinkante
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(hx + 1, hy + 1, 3, 4); ctx.fillStyle = '#6C7580'; ctx.fillRect(hx - 1, hy - 18, 2.4, 20);
      ctx.fillStyle = '#F2F4F7'; ctx.fillRect(hx + 3, hy - 12, 8, 10); ctx.fillStyle = '#26313F'; for (let k = 0; k < 4; k++) ctx.fillRect(hx + 4, hy - 10.6 + k * 2.2, 6, 0.9); // Fahrplan
    });
    const hx = b.x + 46, hy = Y(4);
    const pulse = op ? 0.5 + 0.5 * Math.sin(gt * 3 + b.x) : 0;
    if (op && Math.hypot(player.x - b.x, player.y - b.y) < 140) { ctx.strokeStyle = 'rgba(242,193,78,' + (0.25 + 0.4 * pulse).toFixed(2) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(hx, hy - 22, 10 + pulse * 3, 0, TAU); ctx.stroke(); }
    ctx.fillStyle = '#1E9E55'; ctx.beginPath(); ctx.arc(hx, hy - 22, 8, 0, TAU); ctx.fill(); ctx.fillStyle = '#F2C14E'; ctx.beginPath(); ctx.arc(hx, hy - 22, 6.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1E9E55'; ctx.font = '900 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('H', hx, hy - 21.5); ctx.textBaseline = 'alphabetic';
  }
  function drawBusBay(b) { // Haltestellenbucht auf der Fahrbahn: gelbe Zickzacklinie am Bordstein, Haltelinien und BUS
    if (!inView(b.x, b.lane, 100)) return; const cy = b.up ? b.rd.c0 : b.rd.c1, sg = b.up ? 1 : -1;
    ctx.strokeStyle = 'rgba(242,193,78,.75)'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(b.x - 70, cy + 3 * sg);
    for (let k = -70, f = 1; k <= 70; k += 10, f ^= 1) ctx.lineTo(b.x + k, cy + (f ? 11 : 3) * sg); ctx.stroke(); ctx.lineJoin = 'miter';
    ctx.fillStyle = 'rgba(242,193,78,.6)'; ctx.fillRect(b.x - 72, Math.min(cy, cy + 44 * sg), 2, 44); ctx.fillRect(b.x + 70, Math.min(cy, cy + 44 * sg), 2, 44);
    ctx.fillStyle = 'rgba(242,193,78,.55)'; ctx.font = '900 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BUS', b.x, cy + 28 * sg); ctx.textBaseline = 'alphabetic';
  }
  function drawBus(x, y, dir, open) { // Linienbus von oben, Front in Fahrtrichtung
    ctx.save(); ctx.translate(x, y); if (dir < 0) ctx.scale(-1, 1); const L = 118, Wd = 34;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-L / 2 + 5, -Wd / 2 + 6, L, Wd);
    ctx.fillStyle = '#20262E'; for (const wx of [-36, 30]) for (const wy of [-Wd / 2 - 2, Wd / 2 - 2]) ctx.fillRect(wx, wy, 14, 4);
    ctx.fillStyle = '#1E9E55'; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-L / 2, -Wd / 2, L, Wd, [4, 9, 9, 4]); else ctx.rect(-L / 2, -Wd / 2, L, Wd); ctx.fill();
    ctx.fillStyle = '#1B2530'; ctx.fillRect(-L / 2 + 6, -Wd / 2, L - 22, 4); ctx.fillRect(-L / 2 + 6, Wd / 2 - 4, L - 22, 4); // Fensterbaender
    ctx.fillStyle = 'rgba(160,220,255,.35)'; for (let k = 0; k < 6; k++) { ctx.fillRect(-L / 2 + 8 + k * 16, -Wd / 2 + 0.6, 12, 2.4); ctx.fillRect(-L / 2 + 8 + k * 16, Wd / 2 - 3, 12, 2.4); }
    ctx.fillStyle = '#26C26A'; ctx.fillRect(-L / 2 + 4, -Wd / 2 + 6, L - 18, Wd - 12); // Dach
    ctx.fillStyle = '#E9EEF2'; ctx.fillRect(-26, -8, 22, 16); ctx.fillRect(8, -6, 14, 12); ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let k = 0; k < 4; k++) ctx.fillRect(-24 + k * 5, -6, 2, 12); // Klimaanlage
    ctx.fillStyle = '#F2C14E'; ctx.fillRect(-L / 2 + 4, -2, L - 18, 4); // Zierstreifen
    ctx.fillStyle = '#1B2530'; ctx.fillRect(L / 2 - 12, -Wd / 2 + 3, 9, Wd - 6); ctx.fillStyle = 'rgba(160,220,255,.4)'; ctx.fillRect(L / 2 - 11, -Wd / 2 + 4, 3, Wd - 8); // Frontscheibe
    ctx.fillStyle = '#FF9A3A'; ctx.fillRect(L / 2 - 4, -8, 2, 16); // Zielanzeige
    const nt = lightK(); ctx.fillStyle = nt > 0.25 ? '#FFF4C8' : '#E9EEF2'; ctx.fillRect(L / 2 - 2, -Wd / 2 + 2, 2, 5); ctx.fillRect(L / 2 - 2, Wd / 2 - 7, 2, 5);
    ctx.fillStyle = '#E04848'; ctx.fillRect(-L / 2, -Wd / 2 + 2, 2, 5); ctx.fillRect(-L / 2, Wd / 2 - 7, 2, 5);
    if (open) { ctx.fillStyle = '#F2C14E'; ctx.fillRect(-10, Wd / 2 - 1, 16, 2); ctx.fillRect(28, Wd / 2 - 1, 12, 2); }
    if (nt > 0.25) { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(L / 2 + 30, 0, 4, L / 2 + 30, 0, 60); g.addColorStop(0, 'rgba(255,240,190,' + (0.28 * nt).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = g; ctx.fillRect(L / 2, -50, 100, 100); }
    ctx.restore();
  }
  function drawBusVeh() {
    const st = BUS_ST; if (!st) return; const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
    if (busRide && busRide.ph < 2) { const s = st[busRide.from], k = busRide.ph === 0 ? ease(busRide.t / 1.6) : 1, x = s.x + 4 - s.dir * (1 - k) * 760; if (inView(x, s.lane, 120)) drawBus(x, s.lane, s.dir, k > 0.97); }
    const f = busFx || (busRide && busRide.ph === 2 ? { i: busRide.to, t0: gt + 9 } : null);
    if (f) { const s = st[f.i], a = Math.max(0, gt - f.t0), x = s.x + 4 + s.dir * a * a * 120; if (a > 4.5) { busFx = null; return; } if (inView(x, s.lane, 120)) drawBus(x, s.lane, s.dir, a === 0); }
  }
  function drawBusFade() {
    const r = busRide; if (!r || r.ph === 0) return; const a = r.ph === 1 ? clamp(r.t / 0.55, 0, 1) : 1 - clamp(r.t / 0.55, 0, 1);
    ctx.fillStyle = 'rgba(8,12,18,' + a.toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
    if (a > 0.35) { const s = busStops()[r.to]; ctx.globalAlpha = Math.min(1, (a - 0.35) / 0.4); ctx.fillStyle = '#F2C14E'; ctx.font = '800 20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🚌  ' + s.name, W / 2, H / 2 - 10); ctx.fillStyle = '#93A1B3'; ctx.font = '600 13px sans-serif'; ctx.fillText(busZone(s).name, W / 2, H / 2 + 16); ctx.globalAlpha = 1; ctx.textBaseline = 'alphabetic'; }
  }
  function drawRack(r) {
    if (!inView(r.x, r.y, 50)) return; const BC = ['#E05555', '#4B8DFF', '#F2C14E', '#5FE584'];
    for (let k = 0; k < r.n; k++) { const x = r.v ? r.x : r.x + k * 12, y = r.v ? r.y + k * 12 : r.y; ctx.strokeStyle = '#8C96A3'; ctx.lineWidth = 1.5; ctx.beginPath(); if (r.v) { ctx.moveTo(x - 6, y); ctx.lineTo(x + 6, y); } else { ctx.moveTo(x, y - 6); ctx.lineTo(x, y + 6); } ctx.stroke();
      ctx.strokeStyle = '#20262E'; ctx.lineWidth = 1.6; ctx.beginPath(); if (r.v) { ctx.arc(x - 9, y + 2, 3.2, 0, TAU); ctx.moveTo(x + 12.2, y + 2); ctx.arc(x + 9, y + 2, 3.2, 0, TAU); } else { ctx.arc(x + 2, y - 9, 3.2, 0, TAU); ctx.moveTo(x + 5.2, y + 9); ctx.arc(x + 2, y + 9, 3.2, 0, TAU); } ctx.stroke();
      ctx.strokeStyle = BC[k % 4]; ctx.lineWidth = 2; ctx.beginPath(); if (r.v) { ctx.moveTo(x - 9, y + 2); ctx.lineTo(x - 1, y - 1); ctx.lineTo(x + 9, y + 2); } else { ctx.moveTo(x + 2, y - 9); ctx.lineTo(x - 1, y - 1); ctx.lineTo(x + 2, y + 9); } ctx.stroke(); }
  }
  function drawSign(sg) {
    if (!inView(sg.x, sg.y, 40)) return; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(sg.x + 1, sg.y + 1, 3, 4); ctx.fillStyle = '#8C96A3'; ctx.fillRect(sg.x - 1, sg.y - 16, 2, 18);
    for (const [k, t] of [[0, sg.a], [1, sg.b]]) { ctx.font = '800 5.5px sans-serif'; const w = ctx.measureText(t).width + 6, yy = sg.y - 22 + k * 8; ctx.fillStyle = '#2459A8'; ctx.fillRect(k ? sg.x - w + 3 : sg.x - 3, yy, w, 7); ctx.strokeStyle = '#F4F4F8'; ctx.lineWidth = 0.7; ctx.strokeRect(k ? sg.x - w + 3.5 : sg.x - 2.5, yy + 0.5, w - 1, 6); ctx.fillStyle = '#F4F4F8'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(t, (k ? sg.x - w + 3 : sg.x - 3) + 3, yy + 3.8); }
    ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'center';
  }
  function catUpdate(dt) {
    if (!DET) return;
    for (const c of DET.cats) { const dp = Math.hypot(player.x - c.x, player.y - c.y);
      if (!c.roof && dp < 46 && c.st !== 'flee') { c.st = 'flee'; const a = Math.atan2(c.y - player.y, c.x - player.x); let ok = false; for (const da of [0, 0.6, -0.6, 1.2, -1.2, 1.9, -1.9]) { const tx = c.x + Math.cos(a + da) * 70, ty = c.y + Math.sin(a + da) * 70; if (!blockedPt(tx, ty, 8) && !blockedPt((c.x + tx) / 2, (c.y + ty) / 2, 6)) { c.tx = tx; c.ty = ty; ok = true; break; } } if (!ok) { c.tx = c.hx; c.ty = c.hy; } }
      c.t -= dt;
      if (c.st === 'sit' && c.t <= 0) { if (c.roof) { c.t = 4 + Math.random() * 6; c.a += (Math.random() - 0.5) * 1.5; } else { c.st = 'walk'; const a = Math.random() * TAU, r = 18 + Math.random() * 44; c.tx = c.hx + Math.cos(a) * r; c.ty = c.hy + Math.sin(a) * r; if (blockedPt(c.tx, c.ty, 8) || blockedPt((c.hx + c.tx) / 2, (c.hy + c.ty) / 2, 6)) { c.tx = c.hx; c.ty = c.hy; } } }
      if (c.st === 'walk' || c.st === 'flee') { const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy), sp = (c.st === 'flee' ? 110 : 26) * dt; if (d < 2) { c.st = 'sit'; c.t = 3 + Math.random() * 7; } else { const nx = c.x + dx / d * Math.min(sp, d), ny = c.y + dy / d * Math.min(sp, d); if (blockedPt(nx, ny, 4)) { c.st = 'sit'; c.t = 1 + Math.random() * 3; continue; } c.x = nx; c.y = ny; c.a = Math.atan2(dy, dx); c.ph = (c.ph || 0) + dt * (c.st === 'flee' ? 18 : 8); } } }
  }
  function drawCat(c) {
    if (!inView(c.x, c.y, 30)) return; const mv = c.st !== 'sit', sw = Math.sin(gt * (mv ? 6 : 2) + c.hx) * (mv ? 0.5 : 0.9), lg = mv ? Math.sin(c.ph || 0) * 2 : 0;
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a);
    ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(1, 2, 8, 4.5); ctx.fill();
    ctx.strokeStyle = c.c; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.quadraticCurveTo(-11, sw * 6, -14, sw * 9 + (mv ? 0 : 3)); ctx.stroke(); ctx.lineCap = 'butt';
    if (mv) { ctx.fillStyle = c.c; for (const [lx, ly] of [[3 + lg, -3.4], [3 - lg, 3.4], [-4 - lg, -3.4], [-4 + lg, 3.4]]) { ctx.beginPath(); ctx.arc(lx, ly, 1.4, 0, TAU); ctx.fill(); } }
    ctx.fillStyle = c.c; ell(0, 0, mv ? 7 : 5.6, mv ? 3.6 : 4.6); ctx.fill();
    ctx.beginPath(); ctx.arc(mv ? 7 : 4.6, 0, 3.4, 0, TAU); ctx.fill(); const hx = mv ? 7 : 4.6;
    ctx.beginPath(); ctx.moveTo(hx + 1, -2.4); ctx.lineTo(hx + 3.6, -4.2); ctx.lineTo(hx + 2.6, -1); ctx.moveTo(hx + 1, 2.4); ctx.lineTo(hx + 3.6, 4.2); ctx.lineTo(hx + 2.6, 1); ctx.fill();
    ctx.fillStyle = c.c === '#2A2A30' ? '#C8E86A' : '#20262E'; ctx.fillRect(hx + 1.6, -1.6, 1, 1); ctx.fillRect(hx + 1.6, 0.8, 1, 1);
    if (c.c === '#F2EDE4' || c.c === '#E8913A') { ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let k = -1; k <= 1; k++) ctx.fillRect(-3 + k * 2.4, -3.6, 1.2, 7.2); }
    ctx.restore();
    if (c.st === 'sit' && !c.roof && Math.sin(gt * 0.5 + c.hx) > 0.97) { ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '700 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('z', c.x + 6, c.y - 9 - (gt % 1) * 4); }
  }
  function drawButterflies() {
    if (KR_NEUTRAL) return; const si = seasonI(); if (si > 1 || lightK() > 0.15 || amb.rain > 0.2) return;
    const spots = [[FG.x + 160, 120], [FG.x + 480, 90], [FG.x + 800, 140], [1000, 980], [1500, 1060], [1300, 1240], [600, 1700], [2200, 1750], [3900, 1720]];
    spots.forEach(([cx, cy], i) => { for (let k = 0; k < 2; k++) { const t = gt * (0.35 + k * 0.1) + i * 3.1 + k * 1.7, x = cx + Math.sin(t) * 46 + Math.sin(t * 2.3) * 14, y = cy + Math.cos(t * 0.8) * 30 + Math.sin(t * 3.1) * 8; if (!inView(x, y, 20)) continue;
      const fl = Math.abs(Math.sin(gt * 14 + i + k)), col = ['#FFD24A', '#FF8FB8', '#8FD8FF', '#FFFFFF', '#FFA24A'][(i + k) % 5], a = Math.cos(t) * 0.6;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.beginPath(); ctx.arc(3, 8, 2, 0, TAU); ctx.fill(); ctx.fillStyle = col; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sd * 2.6 * (0.3 + fl * 0.7), -1, 2.8 * (0.3 + fl * 0.7), 2.2, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(sd * 2 * (0.3 + fl * 0.7), 2, 2 * (0.3 + fl * 0.7), 1.6, 0, 0, TAU); ctx.fill(); } ctx.fillStyle = '#20262E'; ctx.fillRect(-0.5, -2.5, 1, 5.5); ctx.restore(); } });
  }
  const CLOUDS = Array.from({ length: 9 }, (_, i) => ({ x0: i * 760 + ((i * 331) % 400), y: 140 + ((i * 577) % 2300), s: 0.8 + ((i * 37) % 10) / 14 }));
  function drawCloudShadows() {
    if (KR_NEUTRAL || state === 'edit' || player.fl || (indoorK || 0) > 0.5) return; const day = 1 - Math.min(1, lightK() * 3); if (day < 0.05) return; const a = 0.085 * day * (1 + amb.rain * 0.6);
    for (const c of CLOUDS) { const span = WW + 1600, x = ((c.x0 + gt * 16) % span) - 800, y = c.y + Math.sin(gt * 0.03 + c.x0) * 40; if (!inView(x, y, 380 * c.s)) continue;
      for (const [ox, oy, r] of [[0, 0, 170], [140, 30, 130], [-130, 24, 120], [60, -50, 110]]) { const R = r * c.s, g = ctx.createRadialGradient(x + ox * c.s, y + oy * c.s, R * 0.2, x + ox * c.s, y + oy * c.s, R); g.addColorStop(0, 'rgba(20,30,50,' + a.toFixed(3) + ')'); g.addColorStop(1, 'rgba(20,30,50,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + ox * c.s, y + oy * c.s, R, 0, TAU); ctx.fill(); } }
  }
  function drawDetailsObjects() {
    if (!DET) detInit();
    for (const sg of DET.signs) drawSign(sg); for (const b of DET.stops) drawBusStop(b); for (const r of DET.racks) drawRack(r); for (const c of DET.cats) drawCat(c);
    drawButterflies();
  }
  let vigC = null;
  function drawVignette() { if (!vigC || vigC.w !== W || vigC.h !== H) { const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.hypot(W, H) * 0.62); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(8,12,20,.30)'); vigC = { w: W, h: H, g }; } ctx.fillStyle = vigC.g; ctx.fillRect(0, 0, W, H); }

  function drawOutside() { // v110: hinter dem Kartenrand dichter Wald mit Hecke, damit es dort nicht leer aussieht
    for (const [a, b, edge, dir] of [[viewY0 - 20, YMIN, YMIN, -1], [WH, viewY1 + 20, WH, 1]]) { if (b <= a) continue;
      ctx.fillStyle = '#1A3324'; ctx.fillRect(viewX0 - 20, a, viewX1 - viewX0 + 40, b - a);
      ctx.fillStyle = '#2E5A36'; ctx.fillRect(viewX0 - 20, dir < 0 ? edge - 14 : edge, viewX1 - viewX0 + 40, 14);
      for (let x = Math.floor((viewX0 - 40) / 26) * 26; x < viewX1 + 40; x += 26) { ctx.fillStyle = '#3A6E40'; ctx.beginPath(); ctx.arc(x + 13, edge + dir * 7, 10, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.beginPath(); ctx.arc(x + 9, edge + dir * 7 - 3, 4, 0, TAU); ctx.fill(); }
      const y0 = dir < 0 ? Math.max(a, edge - 600) : edge + 20, y1 = dir < 0 ? edge - 20 : Math.min(b, edge + 600);
      for (let gy = Math.floor(y0 / 46) * 46; gy < y1; gy += 46) for (let gx = Math.floor((viewX0 - 60) / 52) * 52; gx < viewX1 + 60; gx += 52) {
        const hsh = Math.abs(Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453) % 1, x = gx + hsh * 30, y = gy + ((hsh * 7) % 1) * 22, r = 18 + hsh * 10;
        if (dir < 0 ? y > edge - 22 : y < edge + 22) continue;
        ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 8, r, r * .55, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = hsh < .33 ? '#244A30' : hsh < .66 ? '#2B5636' : '#1F4229'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(120,190,110,.14)'; ctx.beginPath(); ctx.arc(x - r * .3, y - r * .3, r * .45, 0, TAU); ctx.fill(); }
    }
  }
  const inOwnRoom = () => !GH_ON && state === 'play' && player.fl >= 2; // v160: Raeume, die woanders liegen als der Keller
  function drawWorld() {
    // Boden
    const tiles = drawGroundTiles(); // v136: Boden aus fertigen Kacheln, Bewegtes darüber
    if (!tiles) { ctx.fillStyle = '#17261F'; ctx.fillRect(viewX0 - 20, viewY0 - 20, viewX1 - viewX0 + 40, viewY1 - viewY0 + 40); } // v154: die Kacheln decken alles ab, die Grundfarbe braucht es nur beim Live-Zeichnen
    if (tiles) { drawGroundLive(); gsPass = 2; if (state !== 'edit') drawAmbientGround(); gsPass = 0; } else {
    if (viewX1 > 0) drawCityGround(); // v72: neue Stadt
    if (viewX1 > 0 && (viewY0 < YMIN || viewY1 > WH)) drawOutside(); // v110: Waldrand ausserhalb der Karte
    if (viewX0 < 0) drawPlotGround(); // Keller der Freunde (abseits)
    drawPaths(); drawMapGround();
    drawBushes();
    if (state !== 'edit') drawAmbientGround();
    if (state !== 'edit') drawDetailsGround(); // v94
    if (state !== 'edit') { drawExtrasGround(); vqDrawFlat(); } // v161, v168
    }
    if (state !== 'edit') { lifeShadows(); vqDrawObj(); lifeDraw(); evDrawGround(); } // v169, v168, v166: Stadt-Ereignisse, nie im Boden-Zwischenspeicher
    if (viewX0 < 0 && tiles) drawPlotGround();
    if (tiles) gsPass = 2; drawPark(); gsPass = 0; drawGym2(); drawKiosk(); drawStall(); drawAutohof(); drawLager(); drawPrPad(); drawWerk(); drawContainers(); drawCasino(); drawApotheke(); drawGangHof(); drawGangHof2(); drawBoulevard(); drawMarkt(); drawGym(); drawBank(); drawPizza(); drawClub(); drawMapTop();
    drawBridges();
    if (state !== 'edit') drawDucks();
    // Häuser
    for (let hi = 0; hi < HOUSES.length; hi++) {
      const h = HOUSES[hi]; if (h.x > viewX1 + 20 || h.x + h.w < viewX0 - 20 || h.y > viewY1 + 40 || h.y + h.h < viewY0 - 40) continue;
      if (h.gang) drawGangHouse(h, hi); else drawHouse(h, hi);
    }
    if (!inOwnRoom()) calDrawWorld(); // v155: Kürbisse, Lichterketten, Baum, Laternen, Ostereier
    drawGangSign(); drawGhqSign(); // v121
    drawRaid(); // v100
    drawKeller();
    drawFactory(AREAS.tabak); drawFactory(AREAS.brau);
    drawPlots(); drawOwnerPills();
    // Kunden
    for (const o of G.orders) {
      const h = HOUSES[o.house], fx = o.mob ? o.x : h.dx, fy = o.mob ? o.y : (h.face === 1 ? h.dy + 16 : h.dy - 16);
      const tabC = o.prod === 'tabak', brC = o.prod === 'brau';
      ctx.fillStyle = h.roof; ctx.beginPath(); ctx.arc(fx, fy, 8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F1C9A5'; ctx.beginPath(); ctx.arc(fx, fy - 1, 5, 0, TAU); ctx.fill();
      if (o.vip) { // Spezialkunde: goldene Krone und Glanz
        const gl = ctx.createRadialGradient(fx, fy, 4, fx, fy, 22); gl.addColorStop(0, 'rgba(255,210,74,.45)'); gl.addColorStop(1, 'rgba(255,210,74,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(fx, fy, 22, 0, TAU); ctx.fill();
        ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.moveTo(fx - 6, fy - 6); ctx.lineTo(fx - 6, fy - 13); ctx.lineTo(fx - 3, fy - 9); ctx.lineTo(fx, fy - 14); ctx.lineTo(fx + 3, fy - 9); ctx.lineTo(fx + 6, fy - 13); ctx.lineTo(fx + 6, fy - 6); ctx.closePath(); ctx.fill();
      }
      if (tabC) { // Tabak-Kunden tragen einen braunen Hut
        ctx.fillStyle = '#5A3A22'; ctx.fillRect(fx - 9, fy - 5, 18, 3); ctx.fillRect(fx - 5, fy - 11, 10, 7);
        ctx.fillStyle = '#7FD0C8'; ctx.fillRect(fx - 5, fy - 7, 10, 2);
      }
      if (brC) { // v88: Labor-Kunden: Schutzbrille auf der Stirn
        ctx.fillStyle = '#2B3039'; ctx.fillRect(fx - 8, fy - 5, 16, 2); ctx.fillStyle = 'rgba(143,216,255,.85)'; rr(fx - 7, fy - 8, 6, 4, 1.5); ctx.fill(); rr(fx + 1, fy - 8, 6, 4, 1.5); ctx.fill();
        ctx.fillStyle = '#FFFFFF'; ctx.fillRect(fx - 6, fy - 7.5, 1.4, 1); ctx.fillRect(fx + 2, fy - 7.5, 1.4, 1);
      }
      const by = (!o.mob && h.face === 1) ? fy + 21 : fy - 22, pulse = (1 + Math.sin(gt * 5) * 0.05) * 0.68;
      ctx.save(); ctx.translate(fx, by); ctx.scale(pulse, pulse); ctx.globalAlpha = 0.9;
      ctx.fillStyle = AREAS[o.prod || 'keller'].cust || AREAS[o.prod || 'keller'].bub;
      if (tabC) { ctx.rotate(Math.PI / 4); ctx.fillRect(-9, -9, 18, 18); ctx.strokeStyle = '#1F5E59'; ctx.lineWidth = 2; ctx.strokeRect(-9, -9, 18, 18); ctx.rotate(-Math.PI / 4); }
      else if (brC) { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-10, -10, 20, 20, 5); else ctx.rect(-10, -10, 20, 20); ctx.fill(); ctx.strokeStyle = '#1F5F80'; ctx.lineWidth = 2; ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#10151C'; ctx.font = '800 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(o.qty), 0, 1);
      ctx.globalAlpha = 0.7; ctx.font = '700 9px sans-serif'; ctx.fillStyle = tabC ? '#7FD0C8' : brC ? '#8FD8FF' : '#8FE3A0'; ctx.fillText((o.vip ? '★ ' : '') + (o.prod === 'pr' ? 'DOSEN' : tabC ? 'PÄCKCHEN' : brC ? 'BOXEN' : 'BEUTEL'), 0, -20);
      ctx.globalAlpha = 0.9; if (o.vip) { ctx.strokeStyle = '#FFD24A'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, 19, 0, TAU); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(16,21,28,.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 16, -Math.PI / 2, -Math.PI / 2 + TAU * (o.t / o.tmax)); ctx.stroke();
      ctx.restore();
    }
    if (!inOwnRoom()) { // v160: in Hinterzimmer, HQ und Mietraum keine Strasse drumherum
    if (state !== 'edit') drawAmbientObjects();
    if (state !== 'edit') drawDetailsObjects(); // v94
    drawTraffic(); drawBridgeTraffic(); drawCars(); drawBusVeh(); // v104
    }
    drawZoneLocks();
    drawWorkers();
    // Streifen
    cops.concat(copMates.filter(m => m.on)).forEach(c => { // v97: mit Partnern
      if (!c.on) return;
      if (c.stun <= 0) {
        const g = ctx.createRadialGradient(c.x, c.y, 10, c.x, c.y, copRange());
        g.addColorStop(0, c.seen ? 'rgba(255,92,122,.4)' : 'rgba(75,141,255,.28)'); g.addColorStop(1, 'rgba(75,141,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.arc(c.x, c.y, copRange(), c.ang - COP_CONE, c.ang + COP_CONE); ctx.closePath(); ctx.fill();
      }
      if (c.ko && c.stun > 0) {
        ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(c.x + 1, c.y + 5, 12, 4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#1D2A4A'; ctx.beginPath(); ctx.ellipse(c.x, c.y + 1, 12, 6.5, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2B3C66'; ctx.beginPath(); ctx.arc(c.x + 8, c.y, 4.2, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#EAF2FF'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(c.x + 6.5, c.y - 1.5); ctx.lineTo(c.x + 8, c.y); ctx.moveTo(c.x + 8, c.y - 1.5); ctx.lineTo(c.x + 6.5, c.y); ctx.stroke();
        drawStars(c.x + 4, c.y - 6, gt + c.x);
        return;
      }
      drawFigure(c.x, c.y, c.ang, c.step, COP_LOOK);
      ctx.fillStyle = Math.floor(gt * 4) % 2 ? '#FF5C7A' : '#4B8DFF'; ctx.beginPath(); ctx.arc(c.x, c.y - 17, 2.6, 0, TAU); ctx.fill();
      if (c.st === 'alert') { ctx.fillStyle = '#FF5C7A'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', c.x, c.y - 24); }
    });
    if (state === 'play' || state === 'menu') drawAreaRoofs(); // v117: Gebaeude von aussen, Innenraum erst beim Reingehen
    if (state !== 'edit') drawGangs();
    if (state !== 'edit') drawKrChars(); // v81
    drawSmoke();
    if (!inCar()) { drawTrail(); drawOrbit(false); } // v69: im Auto nur die Begleiter
    drawPetsWorld(false);
    // Spieler
    const wBack = G.wpn.eq !== 'none' && !inCar() && !weaponInHand(); // v77: ungenutzte Waffe auf dem Ruecken
    if (wBack && !figUp(player.ang)) drawBatBack(player.x, player.y, G.wpn.eq, player.ang);
    if (riding()) drawRide(player.x, player.y, player.ang, G.veh.eq, G.look, player.step * 0.7); else drawFigure(player.x, player.y, player.ang, player.step);
    if (wBack && figUp(player.ang)) drawBatBack(player.x, player.y, G.wpn.eq, player.ang);
    if (G.wpn.eq !== 'none' && !inCar()) {
      if (!wBack) drawBat(player.x, player.y, player.sw ? player.sw.a : player.ang, player.sw ? clamp(player.sw.t / 0.3, 0, 1) : -1, G.wpn.eq, player.sw ? player.sw.d : undefined);
      const wd = batDef(G.wpn.eq); // lange Abklingzeit: kleiner Ladering unter den Fuessen
      if (wd && wd.cd >= 1.5 && player.batCd > 0.02) { ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(player.x, player.y + 15, 5, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - player.batCd / wd.cd)); ctx.stroke(); }
    }
    if (player.stun > 0) drawStars(player.x, player.y - 12, gt);
    if (masterOn && state !== 'edit') drawMaster(player.x, player.y - 27);
    drawDriftCombo();
    lifeDrawPond(); lifeMist(); vqDrawSky(); drawCompass(); drawWayPt(); kurDraw();
    // v79: keine Tuetchen mehr ueber dem Kopf (die Ware steht oben links im HUD)
    if (!inCar()) drawOrbit(true);
    drawPetsWorld(true);
    mpDraw();
    drawCloudShadows(); // v94
    drawSeasonFx(); // v81
    if (inOwnRoom()) { const I = AREAS.keller.IN, m = T + 2; ctx.fillStyle = '#07090D'; ctx.beginPath(); ctx.rect(viewX0 - 60, viewY0 - 60, viewX1 - viewX0 + 120, viewY1 - viewY0 + 120); ctx.rect(I.x0 - m, I.y0 - m, I.x1 - I.x0 + 2 * m, I.y1 - I.y0 + 2 * m); ctx.fill('evenodd'); } // v160: Hinterzimmer, Gang-HQ und Mietraum: draussen ist nichts zu sehen
    if (myEm.id) drawEmoteBubble(player.x, player.y - 8, myEm.id, myEm.t);
    if (myEm.tx) drawSayBubble(player.x, player.y - 8, myEm.tx, myEm.t);
    // Schwebetexte
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '800 13px sans-serif';
    for (const f of floaters) { ctx.globalAlpha = 1 - f.t / 1.3; ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y - f.t * 22); }
    ctx.globalAlpha = 1;
    if (state !== 'edit') drawSkyFx();
  }

  function drawJoystick() { if (shotOn()) return;
    if (joy.id === null) return;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 56, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.arc(joy.ox + joy.dx * 56, joy.oy + joy.dy * 56, 24, 0, TAU); ctx.fill();
  }

