  // =====================================================================================================
  // v161: Mehr Farbe und kleine Details auf der Karte: Blumenkübel und Kreidemalereien auf den Gehwegen,
  // bunte Wildblumen in Parks und Gärten. Alles liegt in den Bodenkacheln (kostet beim Spielen nichts)
  // und hält Abstand zu Eingängen, Laternen, Tonnen, Hydranten, Haltestellen, Kreuzungen und Pfaden.
  // =====================================================================================================
  let XTR = null;
  function extrasInit() {
    let s = 4242; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const planters = [], chalk = [], patches = [], lines = [], taken = [];
    const near = (x, y, d) => taken.some(q => Math.abs(q.x - x) < d && Math.abs(q.y - y) < d);
    const free = (x, y) => !(x < 40 || x > WW - 40 || y < YMIN + 40 || y > WH - 40) && !inKeep(x, y, 12) && !LAMPS.some(l => Math.hypot(l.x - x, l.y - y) < 30) && !BINS.some(b => Math.hypot(b.x - x, b.y - y) < 30)
      && !HYDRANTS.some(q => Math.hypot(q[0] - x, q[1] - y) < 26) && !busStops().some(b => Math.abs(b.x + 10 - x) < 70 && Math.abs(b.y - y) < 34) && !BROOKS.some(b => Math.abs(b.x - x) < 34 && y > b.y0 - 20 && y < b.y1 + 20)
      && !onPath(x, y) && !(y > UFER_N - 40 && y < UFER_S + 40) && !colliders.some(c => !c.fl && x > c.x - 8 && x < c.x + c.w + 8 && y > c.y - 8 && y < c.y + c.h + 8) && !(DET && DET.racks.some(r => Math.abs(r.x - x) < 50 && Math.abs(r.y - y) < 40));
    for (const r of RDH) for (const side of [-1, 1]) {
      const cross = x => RDV.some(v => x > v.c0 - SW - 34 && x < v.c1 + SW + 34);
      for (let x = 80 + rnd() * 120; x < WW - 80; x += 150 + rnd() * 220) {
        if (cross(x)) continue; const kind = rnd();
        if (kind < 0.5) { const y = side < 0 ? r.c0 - SW + 7 : r.c1 + SW - 7; if (free(x, y) && !near(x, y, 60)) { planters.push({ x, y, t: Math.floor(rnd() * 3), c: Math.floor(rnd() * 5), w: rnd() < 0.4 }); taken.push({ x, y }); } }
        else if (kind < 0.9) { const y = swLine(r, side); if (free(x, y) && !near(x, y, 70)) { chalk.push({ x, y, t: Math.floor(rnd() * 5), c: Math.floor(rnd() * 4), a: (rnd() - 0.5) * 0.5 }); taken.push({ x, y }); } }
      }
    }
    for (const r of RDV) for (const side of [-1, 1]) {
      for (let y = YMIN + 80 + rnd() * 120; y < WH - 80; y += 180 + rnd() * 240) {
        if (RDH.some(h => y > h.c0 - SW - 34 && y < h.c1 + SW + 34)) continue; const x = side < 0 ? r.c0 - SW + 7 : r.c1 + SW - 7;
        if (rnd() < 0.6 && free(x, y) && !near(x, y, 60)) { planters.push({ x, y, t: Math.floor(rnd() * 3), c: Math.floor(rnd() * 5), w: rnd() < 0.4 }); taken.push({ x, y }); }
      }
    }
    for (const z of GROUNDS) { if (!['park', 'garden', 'dog'].includes(z.t)) continue; const n = Math.round(z.w * z.h / 26000);
      for (let i = 0; i < n; i++) { const x = z.x + 20 + rnd() * (z.w - 40), y = z.y + 20 + rnd() * (z.h - 40);
        if (onPath(x, y) || onStreet(x, y, 6) || inKeep(x, y, 6) || colliders.some(c => !c.fl && x > c.x - 14 && x < c.x + c.w + 14 && y > c.y - 14 && y < c.y + c.h + 14) || TREES.some(t => Math.hypot(t[0] - x, t[1] - y) < 26)) continue;
        const pts = [], m = 6 + Math.floor(rnd() * 7); for (let k = 0; k < m; k++) { const a = rnd() * TAU, d = rnd() * 16; pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.7, Math.floor(rnd() * 6), 0.8 + rnd() * 0.5]); }
        if (z.t === 'garden' && rnd() < 0.22 && ![-24, 24].some(dx => colliders.some(c => !c.fl && x + dx > c.x - 6 && x + dx < c.x + c.w + 6 && y > c.y - 20 && y < c.y + c.h + 6) || TREES.some(t => Math.hypot(t[0] - x - dx, t[1] - y) < 24) || onPath(x + dx, y))) { lines.push({ x, y, c: Math.floor(rnd() * 99) }); continue; }
        patches.push({ x, y, pts }); } }
    XTR = { planters, chalk, patches, lines };
  }
  const XFL = [['#FF7AAE', '#FFFFFF', '#FFC2DA', '#F7E06A', '#C9A2FF'], ['#FF4D4D', '#FFD23F', '#3FA9FF', '#FF8A2A', '#E85AD8'], ['#E8742A', '#D24A2A', '#F2B33A', '#9A4A8A', '#C77A2A']]; // Frühling, Sommer, Herbst
  const XCH = ['rgba(255,170,210,.6)', 'rgba(255,236,140,.6)', 'rgba(150,230,255,.6)', 'rgba(255,255,255,.55)'];
  function drawExtrasGround() {
    if (state === 'edit') return; if (!XTR) extrasInit(); const si = KR_NEUTRAL || !G ? 1 : seasonI(), win = si === 3;
    for (const p of XTR.patches) { if (win || !inView(p.x, p.y, 30)) continue; const F = XFL[si === 2 ? 2 : si === 0 ? 0 : 1];
      for (const [x, y, c, sc] of p.pts) { ctx.strokeStyle = '#3E7A3A'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(x, y + 2.5); ctx.lineTo(x, y - 1); ctx.stroke(); ctx.fillStyle = F[c % 5]; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + Math.cos(k * 1.256) * 1.6 * sc, y - 2 + Math.sin(k * 1.256) * 1.6 * sc, 1.15 * sc, 0, TAU); ctx.fill(); } ctx.fillStyle = '#FFE36A'; ctx.beginPath(); ctx.arc(x, y - 2, 0.7 * sc, 0, TAU); ctx.fill(); } }
    for (const c of XTR.chalk) { if (win || !inView(c.x, c.y, 30)) continue; drawChalk(c); }
    for (const p of XTR.planters) { if (!inView(p.x, p.y, 30)) continue; ctx.save(); ctx.translate(p.x, p.y); ctx.scale(1.2, 1.2); ctx.translate(-p.x, -p.y); drawPlanter(p, si); ctx.restore(); }
    for (const l of XTR.lines) { if (!inView(l.x, l.y, 40)) continue; drawLine(l, true); } // v169: Wäsche selbst flattert in lfLaundry
  }
  function drawChalk(c) {
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.a); ctx.strokeStyle = XCH[c.c]; ctx.fillStyle = XCH[c.c]; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (c.t === 0) { // Hüpfkästchen
      ctx.beginPath(); for (const [x, y] of [[-20, -5], [-10, -5], [0, -10], [0, 0], [10, -5], [20, -5]]) ctx.rect(x - 5, y, 10, 10 - (y === -5 ? 0 : 0)); ctx.stroke();
      ctx.font = '700 5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ['1', '2', '3', '4', '5', '6'].forEach((t, i) => { const P = [[-20, 0], [-10, 0], [0, -5], [0, 5], [10, 0], [20, 0]][i]; ctx.fillText(t, P[0], P[1]); }); ctx.textBaseline = 'alphabetic'; }
    else if (c.t === 1) { ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, TAU); ctx.stroke(); ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k * TAU / 8; ctx.moveTo(Math.cos(a) * 6.5, Math.sin(a) * 6.5); ctx.lineTo(Math.cos(a) * 9.5, Math.sin(a) * 9.5); } ctx.stroke(); } // Sonne
    else if (c.t === 2) { ctx.beginPath(); ctx.moveTo(0, 5); ctx.bezierCurveTo(-9, -1, -5, -8, 0, -3); ctx.bezierCurveTo(5, -8, 9, -1, 0, 5); ctx.stroke(); } // Herz
    else if (c.t === 3) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 3 : 7.5, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.stroke(); } // Stern
    else { ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(-2.2, -1.6, 0.6, 0, TAU); ctx.arc(2.2, -1.6, 0.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(0, 0.8, 3, 0.2, Math.PI - 0.2); ctx.stroke(); } // Smiley
    ctx.restore();
  }
  function drawPlanter(p, si) {
    const x = p.x, y = p.y;
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x + 1.5, y + 5, p.w ? 13 : 9, 3, 0, 0, TAU); ctx.fill();
    if (p.w) { ctx.fillStyle = '#7A5232'; rr(x - 12, y - 4, 24, 9, 2); ctx.fill(); ctx.fillStyle = '#946642'; ctx.fillRect(x - 12, y - 4, 24, 2); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x - 4.5, y - 2, 1, 7); ctx.fillRect(x + 3.5, y - 2, 1, 7); } // Holzkasten
    else { const g = ctx.createLinearGradient(x - 8, 0, x + 8, 0); g.addColorStop(0, '#C8693E'); g.addColorStop(0.5, '#E08350'); g.addColorStop(1, '#A4512C'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 8, y - 4); ctx.lineTo(x + 8, y - 4); ctx.lineTo(x + 6, y + 5); ctx.lineTo(x - 6, y + 5); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#B85E36'; rr(x - 9, y - 6, 18, 3, 1); ctx.fill(); } // Terrakotta
    const n = p.w ? 6 : 4, sp = p.w ? 4 : 3.6;
    ctx.fillStyle = '#2F6A38'; for (let k = 0; k < n; k++) { ctx.beginPath(); ctx.arc(x - (n - 1) * sp / 2 + k * sp, y - 6 - (k % 2), 3.2, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#3F8A48'; for (let k = 0; k < n; k++) { ctx.beginPath(); ctx.arc(x - (n - 1) * sp / 2 + k * sp - 0.8, y - 7 - (k % 2), 1.8, 0, TAU); ctx.fill(); }
    if (si === 3) return; // im Winter nur das Grün (wird zu Schnee)
    const F = XFL[si === 2 ? 2 : si === 0 ? 0 : 1];
    for (let k = 0; k < n; k++) { const fx = x - (n - 1) * sp / 2 + k * sp + ((k * 7) % 3 - 1), fy = y - 9 - ((k * 5) % 3); ctx.fillStyle = F[(p.c + k) % 5];
      if (p.t === 0) { for (let q = 0; q < 5; q++) { ctx.beginPath(); ctx.arc(fx + Math.cos(q * 1.256) * 1.5, fy + Math.sin(q * 1.256) * 1.5, 1.1, 0, TAU); ctx.fill(); } ctx.fillStyle = '#FFE36A'; ctx.beginPath(); ctx.arc(fx, fy, 0.7, 0, TAU); ctx.fill(); }
      else if (p.t === 1) { ctx.beginPath(); ctx.ellipse(fx, fy, 1.5, 2.2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(fx - 0.5, fy - 1.5, 0.8, 1.6); } // Tulpe
      else { ctx.beginPath(); ctx.arc(fx, fy, 1.9, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.arc(fx + 0.5, fy + 0.5, 0.8, 0, TAU); ctx.fill(); } } // Pompon
  }
  function drawLine(l, win) { // Wäscheleine mit bunter Wäsche zwischen zwei Pfosten
    const x = l.x, y = l.y, C = ['#FF6B8A', '#4FA8FF', '#FFD24A', '#7BE07B', '#FFFFFF', '#B58CFF', '#FF9A3D'];
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 25, y + 2, 3, 2); ctx.fillRect(x + 23, y + 2, 3, 2);
    ctx.fillStyle = '#7A5A3E'; ctx.fillRect(x - 25, y - 16, 2.4, 19); ctx.fillRect(x + 23, y - 16, 2.4, 19); ctx.fillStyle = '#9A7650'; ctx.fillRect(x - 25, y - 16, 2.4, 1.4); ctx.fillRect(x + 23, y - 16, 2.4, 1.4);
    ctx.strokeStyle = 'rgba(230,230,235,.8)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x - 24, y - 14); ctx.quadraticCurveTo(x, y - 10, x + 24, y - 14); ctx.stroke();
    if (win) return; const n = 5;
    for (let k = 0; k < n; k++) { const t = (k + 0.5) / n, px = x - 20 + t * 40, py = y - 14 + 4 * 4 * t * (1 - t) * 0.5 + 0.6, c = C[(l.c + k * 3) % C.length], kind = (l.c + k) % 3;
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(px - 3 + 1, py + 1, 6, kind === 1 ? 9 : 6);
      ctx.fillStyle = c; if (kind === 0) { ctx.fillRect(px - 3.5, py, 7, 6); ctx.fillRect(px - 5, py, 1.8, 3); ctx.fillRect(px + 3.2, py, 1.8, 3); } // T-Shirt
      else if (kind === 1) { ctx.fillRect(px - 3, py, 2.6, 9); ctx.fillRect(px + 0.4, py, 2.6, 9); ctx.fillRect(px - 3, py, 6, 2.5); } // Hose
      else { ctx.fillRect(px - 2.5, py, 5, 5); } // Socke/Tuch
      ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(px - 3, py, 6, 1); ctx.fillStyle = '#C9A06A'; ctx.fillRect(px - 0.5, py - 1, 1, 1.6); }
  }
