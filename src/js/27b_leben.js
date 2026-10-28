  // =====================================================================================================
  // v169: Mehr Leben ohne Fußgänger. Hunde im Hundepark (rennen dem Ball nach, bellen), Spatzen in Parks und Gärten
  // (fliegen auf, wenn man kommt), Entenfamilie auf dem Teich, Wäsche flattert im Wind (bei Gewitter stärker).
  // Wetter-Stimmung: Morgennebel am Fluss, lange Schatten bei Sonnenauf- und -untergang.
  // Klang je Viertel: Vögel, Verkehr, Maschinen, Bass aus den Clubs, Windspiele, Hunde, knisterndes Feuer.
  // =====================================================================================================
  const LF = { dogs: [], ball: null, birds: [], fam: [], sndT: 0, noise: null, bed: null, bedG: null, bedF: null };
  (() => { const D = DOGS; const col = [['#C98A4A', '#8E5A2A'], ['#2E2A28', '#F2EEE6'], ['#E8D2A8', '#B8956A']];
    for (let i = 0; i < 3; i++) LF.dogs.push({ x: D.x + 80 + i * 140, y: D.y + 120 + (i % 2) * 80, tx: 0, ty: 0, vx: 0, vy: 0, f: 1, st: 'idle', t: 1 + i, c: col[i], s: i === 2 ? 0.8 : 1, ph: i * 2 });
    LF.ball = { x: D.x + D.w / 2, y: D.y + D.h / 2, vx: 0, vy: 0, h: 0, vh: 0, owner: -1, cd: 2 };
    const P = POND; for (let i = 0; i < 5; i++) LF.fam.push({ i, x: P.x + P.w * 0.3 - i * 12, y: P.y + P.h * 0.5, a: 0 });
  })();
  function lfBirdsInit() {
    let s = 5521; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (const z of GROUNDS) { if (!['park', 'garden'].includes(z.t)) continue; const n = Math.min(4, Math.round(z.w * z.h / 90000));
      for (let g = 0; g < n; g++) { const cx = z.x + 40 + rnd() * (z.w - 80), cy = z.y + 30 + rnd() * (z.h - 60); if (onPath(cx, cy) || blockedPt(cx, cy, 14)) continue;
        for (let i = 0; i < 3 + Math.floor(rnd() * 3); i++) LF.birds.push({ hx: cx, hy: cy, x: cx + (rnd() - 0.5) * 30, y: cy + (rnd() - 0.5) * 20, z: 0, vx: 0, vy: 0, vz: 0, st: 'peck', t: rnd() * 2, f: rnd() < 0.5 ? -1 : 1, c: Math.floor(rnd() * 3) }); } }
  }
  const lfIndoor = (x, y) => AREA_KEYS.some(q => { const I = AREAS[q].IN; return x > I.x0 - 10 && x < I.x1 + 10 && y > I.y0 - 10 && y < I.y1 + 10; }) || blockedPt(x, y, 4);
  function lifeUpdate(dt) {
    if (!G) return; if (!LF.birds.length) lfBirdsInit();
    const D = DOGS, B = LF.ball, nearP = (x, y, r) => Math.abs(player.x - x) < r && Math.abs(player.y - y) < r;
    // Hunde: einer holt den Ball, die anderen trotten oder schnüffeln
    const dogView = inView(D.x + D.w / 2, D.y + D.h / 2, D.w);
    if (dogView || nearP(D.x + D.w / 2, D.y + D.h / 2, 900)) {
      B.cd -= dt; if (B.owner < 0 && B.cd <= 0 && B.h <= 0 && Math.hypot(B.vx, B.vy) < 5) { const a = Math.random() * TAU, sp = 160 + Math.random() * 90; B.vx = Math.cos(a) * sp; B.vy = Math.sin(a) * sp * 0.7; B.vh = 120; B.h = 1; B.cd = 4 + Math.random() * 4; const d = LF.dogs[Math.floor(Math.random() * LF.dogs.length)]; d.st = 'chase'; if (dogView && Math.random() < 0.6) lfBark(d); }
      B.x += B.vx * dt; B.y += B.vy * dt; if (B.h > 0) { B.vh -= 380 * dt; B.h += B.vh * dt; if (B.h <= 0) { B.h = 0; B.vh = Math.abs(B.vh) > 60 ? -B.vh * 0.45 : 0; if (B.vh > 0) B.h = 0.1; } } B.vx *= Math.pow(0.35, dt); B.vy *= Math.pow(0.35, dt);
      if (B.x < D.x + 14 || B.x > D.x + D.w - 14) { B.vx *= -0.6; B.x = clamp(B.x, D.x + 14, D.x + D.w - 14); } if (B.y < D.y + 14 || B.y > D.y + D.h - 14) { B.vy *= -0.6; B.y = clamp(B.y, D.y + 14, D.y + D.h - 14); }
      for (const d of LF.dogs) { d.t -= dt; let sp = 0;
        if (d.st === 'chase') { if (B.owner < 0) { d.tx = B.x; d.ty = B.y; sp = 150 * d.s; if (Math.hypot(d.x - B.x, d.y - B.y) < 10 && B.h < 4) { B.owner = LF.dogs.indexOf(d); d.st = 'back'; } } else d.st = 'idle'; }
        else if (d.st === 'back') { d.tx = D.x + D.w * 0.5; d.ty = D.y + D.h * 0.5; sp = 90; B.x = d.x + d.f * 7; B.y = d.y - 2; B.vx = B.vy = 0; if (Math.hypot(d.x - d.tx, d.y - d.ty) < 30) { B.owner = -1; d.st = 'idle'; d.t = 2; B.cd = 1 + Math.random() * 2; } }
        else { if (d.t <= 0) { d.t = 2 + Math.random() * 4; d.st = Math.random() < 0.4 ? 'sniff' : 'idle'; d.tx = clamp(d.x + (Math.random() - 0.5) * 160, D.x + 20, D.x + D.w - 20); d.ty = clamp(d.y + (Math.random() - 0.5) * 100, D.y + 20, D.y + D.h - 20); } sp = d.st === 'sniff' ? 0 : 35; }
        const dx = d.tx - d.x, dy = d.ty - d.y, dd = Math.hypot(dx, dy); if (dd > 3 && sp) { d.x += dx / dd * Math.min(sp * dt, dd); d.y += dy / dd * Math.min(sp * dt, dd); if (Math.abs(dx) > 1) d.f = dx > 0 ? 1 : -1; d.mv = sp; } else d.mv = 0;
        d.x = clamp(d.x, D.x + 12, D.x + D.w - 12); d.y = clamp(d.y, D.y + 12, D.y + D.h - 12);
        if (nearP(d.x, d.y, 60) && Math.random() < dt * 0.4 && !LOFX) lfBark(d); }
    }
    // Spatzen: picken, hüpfen, fliegen bei Annäherung auf und kommen später zurück
    for (const b of LF.birds) { b.t -= dt;
      if (b.st === 'fly') { b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.vz -= 8 * dt; if (b.t <= 0 || lfIndoor(b.x, b.y)) { b.st = 'back'; } continue; } // v174: nicht in Gebäude fliegen
      if (b.st === 'back') { const dx = b.hx - b.x, dy = b.hy - b.y, d = Math.hypot(dx, dy); b.x += dx / Math.max(1, d) * 90 * dt; b.y += dy / Math.max(1, d) * 90 * dt; b.z = Math.max(0, Math.min(40, d * 0.3)); b.f = dx > 0 ? 1 : -1; if (d < 14 && !nearP(b.hx, b.hy, 90)) { b.st = 'peck'; b.z = 0; b.t = 1; } continue; }
      if (nearP(b.x, b.y, 55) || cops.some(c => c.on && Math.abs(c.x - b.x) < 50 && Math.abs(c.y - b.y) < 50)) { const a = Math.atan2(b.y - player.y, b.x - player.x) + (Math.random() - 0.5); b.st = 'fly'; b.vx = Math.cos(a) * (110 + Math.random() * 60); b.vy = Math.sin(a) * 80; b.vz = 70; b.z = 2; b.t = 4 + Math.random() * 5; b.f = b.vx > 0 ? 1 : -1; continue; }
      if (b.t <= 0) { b.t = 0.4 + Math.random() * 1.6; if (Math.random() < 0.5) { b.x = clamp(b.x + (Math.random() - 0.5) * 16, b.hx - 26, b.hx + 26); b.y = clamp(b.y + (Math.random() - 0.5) * 10, b.hy - 18, b.hy + 18); b.f = Math.random() < 0.5 ? -1 : 1; b.hop = 0.18; } } if (b.hop > 0) b.hop -= dt; }
    // Entenfamilie: Mutter zieht Kreise, die Küken folgen
    { const P = POND, m = LF.fam[0]; m.a += dt * 0.12; const tx = P.x + P.w / 2 + Math.cos(m.a) * (P.w * 0.32), ty = P.y + P.h / 2 + Math.sin(m.a * 1.3) * (P.h * 0.25); m.f = tx > m.x ? 1 : -1; m.x += (tx - m.x) * Math.min(1, dt * 0.8); m.y += (ty - m.y) * Math.min(1, dt * 0.8);
      for (let i = 1; i < LF.fam.length; i++) { const p = LF.fam[i - 1], c = LF.fam[i], dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy); if (d > 9) { c.x += dx / d * (d - 9) * Math.min(1, dt * 4); c.y += dy / d * (d - 9) * Math.min(1, dt * 4); } c.f = dx > 0 ? 1 : -1; } }
    lifeSound(dt);
  }
  // ---------- Zeichnen ----------
  function lfDog(d) {
    const x = d.x, y = d.y, s = d.s, run = d.mv > 60, ph = gt * (run ? 18 : 9) + d.ph, b = run ? Math.abs(Math.sin(ph)) * 2 : 0, f = d.f;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x, y + 2, 9 * s, 2.6 * s, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.translate(x, y - b); ctx.scale(f * s, s); const [c1, c2] = d.c;
    ctx.fillStyle = c1; for (const [lx, o] of [[-5, 0], [4, Math.PI]]) { const sw = d.mv ? Math.sin(ph + o) * 2.5 : 0; ctx.fillRect(lx + sw - 1, -4, 2.2, 5); ctx.fillRect(lx - sw - 1 + 1.5, -4, 2.2, 5); }
    ctx.fillStyle = c1; rr(-8, -10, 15, 7, 3.4); ctx.fill(); ctx.fillStyle = c2; ctx.fillRect(-6, -5, 9, 2);
    ctx.save(); ctx.translate(-8, -9); ctx.rotate(-0.6 + Math.sin(gt * (run ? 20 : 8) + d.ph) * 0.5); ctx.fillStyle = c1; ctx.fillRect(-5, -1, 5, 2); ctx.restore();
    ctx.fillStyle = c1; rr(4, -15, 8, 7, 3); ctx.fill(); ctx.fillStyle = c2; rr(9, -12, 4.5, 3.6, 1.5); ctx.fill(); ctx.fillStyle = '#1D2129'; ctx.fillRect(12.5, -12, 1.4, 1.4); ctx.fillRect(7.5, -13, 1.3, 1.3);
    ctx.fillStyle = shadeHex(c1, -0.3); ctx.beginPath(); ctx.ellipse(5.5, -13.5, 2, 3.6, 0.4 + (d.st === 'sniff' ? 0.4 : 0), 0, TAU); ctx.fill();
    if (d.st === 'sniff') { ctx.fillStyle = 'rgba(255,255,255,.5)'; const k = (gt * 2) % 1; ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(15 + k * 4, -10 - k * 3, 1 + k, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    ctx.restore();
  }
  function lifeDraw() {
    if (!G || inOwnRoom()) return; const D = DOGS;
    if (inView(D.x + D.w / 2, D.y + D.h / 2, D.w)) { const B = LF.ball; ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(B.x, B.y + 1, 2.6, 1.2, 0, 0, TAU); ctx.fill(); if (B.owner < 0) { ctx.fillStyle = '#C9F24A'; ctx.beginPath(); ctx.arc(B.x, B.y - 2 - B.h * 0.35, 2.4, 0, TAU); ctx.fill(); }
      for (const d of LF.dogs.slice().sort((a, b) => a.y - b.y)) { lfDog(d); if (d.st === 'back' && LF.ball.owner === LF.dogs.indexOf(d)) { ctx.fillStyle = '#C9F24A'; ctx.beginPath(); ctx.arc(d.x + d.f * 12 * d.s, d.y - 11 * d.s, 2.2, 0, TAU); ctx.fill(); } } }
    for (const b of LF.birds) { if (!inView(b.x, b.y, 40)) continue; const y = b.y - b.z - (b.hop > 0 ? Math.sin(b.hop / 0.18 * Math.PI) * 2 : 0), fly = b.st !== 'peck';
      if (b.z < 30) { ctx.fillStyle = 'rgba(0,0,0,' + (0.22 * (1 - b.z / 30)) + ')'; ctx.beginPath(); ctx.ellipse(b.x, b.y + 1, 2.6, 1, 0, 0, TAU); ctx.fill(); }
      ctx.save(); ctx.translate(b.x, y); ctx.scale(b.f, 1); ctx.fillStyle = ['#8A6A4A', '#6E5A48', '#9A8060'][b.c]; ctx.beginPath(); ctx.ellipse(0, -2.5, 3, 2.2, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(2.4, -4, 1.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#E8B23A'; ctx.fillRect(3.6, -4.2, 1.4, 0.8); ctx.fillStyle = '#1D2129'; ctx.fillRect(2.7, -4.6, 0.7, 0.7);
      if (fly) { const w = Math.sin(gt * 30 + b.x) * 3; ctx.fillStyle = '#5E4A38'; ctx.beginPath(); ctx.moveTo(-1, -3); ctx.lineTo(-3, -3 - w); ctx.lineTo(1.5, -3); ctx.fill(); } else if (b.st === 'peck' && Math.sin(gt * 5 + b.hx) > 0.7) { ctx.fillStyle = 'rgba(0,0,0,0)'; } ctx.restore(); }
    lfLaundry();
  }
  // Entenfamilie (nach dem Teich gezeichnet)
  function lifeDrawPond() {
    if (!G || inOwnRoom()) return;
    { const P = POND; if (inView(P.x + P.w / 2, P.y + P.h / 2, P.w)) for (const d of LF.fam) { const k = d.i ? 0.55 : 1; ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(d.x - d.f * 4 * k, d.y + 1, 6 * k, 1.6 * k, 0, 0, TAU); ctx.fill();
        ctx.save(); ctx.translate(d.x, d.y + Math.sin(gt * 3 + d.i) * 0.5); ctx.scale(d.f * k, k); ctx.fillStyle = d.i ? '#F2D86A' : '#8A6A48'; ctx.beginPath(); ctx.ellipse(0, -2, 5, 3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = d.i ? '#F2D86A' : '#5E7A4A'; ctx.beginPath(); ctx.arc(4, -5, 2.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#E8862A'; ctx.fillRect(5.8, -5, 2.4, 1.2); ctx.fillStyle = '#1D2129'; ctx.fillRect(4.6, -5.8, 0.8, 0.8); ctx.restore(); } }
  }
  // Wäsche im Wind (Leinen und Pfosten liegen im Boden-Zwischenspeicher, die Wäsche selbst bewegt sich)
  function lfLaundry() {
    if (!XTR || (!KR_NEUTRAL && seasonI() === 3)) return; const wind = 0.6 + (amb.rain > 0.3 ? 1.2 : 0) + (EVA.some(e => e.k === 'storm') ? 1.5 : 0), C = ['#FF6B8A', '#4FA8FF', '#FFD24A', '#7BE07B', '#FFFFFF', '#B58CFF', '#FF9A3D'];
    for (const l of XTR.lines) { if (!inView(l.x, l.y, 40)) continue; const x = l.x, y = l.y;
      for (let k = 0; k < 5; k++) { const t = (k + 0.5) / 5, px = x - 20 + t * 40, py = y - 14 + 4 * 4 * t * (1 - t) * 0.5 + 0.6, c = C[(l.c + k * 3) % C.length], kind = (l.c + k) % 3, sw = Math.sin(gt * (2.2 + wind) + k * 1.3 + l.x * 0.01) * wind * 1.6, sk = sw * 0.12;
        ctx.save(); ctx.translate(px, py); ctx.transform(1, 0, sk, 1, 0, 0); ctx.fillStyle = 'rgba(0,0,0,.16)'; ctx.fillRect(-2, 1, 6, kind === 1 ? 9 : 6); ctx.fillStyle = c;
        if (kind === 0) { ctx.fillRect(-3.5, 0, 7, 6); ctx.fillRect(-5, 0, 1.8, 3); ctx.fillRect(3.2, 0, 1.8, 3); } else if (kind === 1) { ctx.fillRect(-3, 0, 2.6, 9); ctx.fillRect(0.4, 0, 2.6, 9); ctx.fillRect(-3, 0, 6, 2.4); } else { ctx.fillRect(-4, 0, 8, 5.5); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-4, 4, 8, 1); }
        ctx.fillStyle = '#C9A06A'; ctx.fillRect(-0.6, -1.2, 1.2, 1.6); ctx.restore(); } }
  }
  // Lange Schatten am Morgen (Sonne im Osten) und am Abend (Sonne im Westen)
  function lifeShadows() {
    if (!G || inOwnRoom() || amb.rain > 0.4 || evWeather()) return; const h = G.time / 60; let dir = 0, k = 0;
    if (h > 6 && h < 9) { dir = -1; k = 1 - (h - 6) / 3; } else if (h > 16.5 && h < 20) { dir = 1; k = (h - 16.5) / 3.5; k = k > 0.85 ? (1 - k) / 0.15 * 0.85 : k; } if (k <= 0.05) return;
    const len = 30 + 130 * k, a = 0.24 * Math.min(1, k * 2);
    ctx.fillStyle = 'rgba(20,16,40,' + a.toFixed(3) + ')';
    for (const hs of HOUSES) { if (!inView(hs.x + hs.w / 2, hs.y + hs.h / 2, hs.w + len)) continue; const x0 = dir > 0 ? hs.x + hs.w : hs.x, y0 = hs.y + 6, y1 = hs.y + hs.h; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + dir * len, y0 + len * 0.18); ctx.lineTo(x0 + dir * len, y1 + len * 0.18); ctx.lineTo(x0, y1); ctx.closePath(); ctx.fill(); }
    for (const t of TREES) { if (!inView(t[0], t[1], 60 + len)) continue; ctx.beginPath(); ctx.ellipse(t[0] + dir * len * 0.45, t[1] + 6 + len * 0.06, 10 + len * 0.3, 7, 0, 0, TAU); ctx.fill(); }
    for (const l of LAMPS) { if (!inView(l.x, l.y, len)) continue; ctx.beginPath(); ctx.moveTo(l.x - 1, l.y); ctx.lineTo(l.x + dir * len * 0.7 - 1, l.y + 4); ctx.lineTo(l.x + dir * len * 0.7 + 1, l.y + 6); ctx.lineTo(l.x + 1, l.y + 1); ctx.fill(); }
  }
  // Morgennebel über dem Fluss (5 bis 10 Uhr), im Herbst auch abends
  function lifeMist() {
    if (!G || inOwnRoom()) return; const h = G.time / 60, R = RIVER; let k = h >= 4.5 && h < 10 ? (h < 6 ? (h - 4.5) / 1.5 : 1 - (h - 6) / 4) : 0; if (!KR_NEUTRAL && seasonI() === 2 && h >= 18 && h < 23) k = Math.max(k, 0.6 * Math.min(1, (h - 18) / 1.5));
    if (k <= 0.03 || !(R.y1 + 80 > viewY0 && R.y0 - 80 < viewY1)) return;
    for (let i = 0; i < 44; i++) { const x = ((i * 137 + gt * (8 + (i % 3) * 4)) % (WW + 600)) - 300, y = R.y0 - 40 + ((i * 53) % 160); if (!inView(x, y, 260)) continue; const r = 160 + (i % 4) * 50, g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(225,232,240,' + (0.42 * k) + ')'); g.addColorStop(1, 'rgba(225,232,240,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.35, 0, 0, TAU); ctx.fill(); }
  }
  // ---------- Klang je Viertel ----------
  function lfBark(d) { if (!ac || muted || aud.s <= 0 || !inView(d.x, d.y, 200)) return; const v = 0.05 * lfVol(d.x, d.y); if (v < 0.005) return; tone(300 + Math.random() * 60, 0.09, 'square', v, -140); tone(280 + Math.random() * 40, 0.08, 'square', v * 0.8, -120, 0.16); }
  const lfVol = (x, y) => clamp(1 - Math.hypot(player.x - x, player.y - y) / 520, 0, 1);
  function lfNoise() { if (LF.noise || !ac) return LF.noise; try { const n = ac.sampleRate * 2, b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < n; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.5; } LF.noise = b; } catch (e) { LF.noise = null; } return LF.noise; }
  // Grundrauschen (Verkehr, Wind, Regen) als leiser, gefilterter Dauerklang
  function lfBed(target, freq) {
    try { if (!LF.bed) { const b = lfNoise(); if (!b) return; const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; s.loop = true; f.type = 'lowpass'; f.frequency.value = 400; g.gain.value = 0; s.connect(f); f.connect(g); g.connect(sfxBus); s.start(); LF.bed = s; LF.bedG = g; LF.bedF = f; }
      const t = ac.currentTime; LF.bedG.gain.setTargetAtTime(target, t, 0.8); LF.bedF.frequency.setTargetAtTime(freq, t, 0.8); } catch (e) {}
  }
  function lifeSound(dt) {
    if (!ac || muted || aud.s <= 0 || state !== 'play') { if (LF.bedG) try { LF.bedG.gain.setTargetAtTime(0, ac.currentTime, 0.3); } catch (e) {} return; }
    const room = player.fl >= 1 || inBuilding(player.x, player.y), z = room ? '' : vqK(player.x, player.y), night = lightK() > 0.4, rain = amb.rain, h = G.time / 60;
    lfBed(room ? 0 : 0.012 + rain * 0.03 + (z === 'gew' ? 0.012 : 0) + (EVA.some(e => e.k === 'storm') ? 0.03 : 0), rain > 0.3 ? 1400 : z === 'gew' ? 220 : 500);
    if (room || LOFX) return; LF.sndT -= dt; if (LF.sndT > 0) return; LF.sndT = 0.25;
    const r = Math.random();
    if (z === 'verg') { if (night || h > 18) { const ph = Math.floor(gt / 0.5); if (ph !== LF.kick) { LF.kick = ph; tone(58, 0.22, 'sine', 0.035, -18); if (ph % 2) tone(7000, 0.03, 'square', 0.004); } LF.sndT = 0.05; } }
    else if (z === 'gew') { if (!night && r < 0.06) { tone(160 + Math.random() * 60, 0.08, 'square', 0.02, -50); tone(900, 0.05, 'triangle', 0.012, 0, 0.03); } else if (!night && r < 0.08) { for (let i = 0; i < 3; i++) tone(1050, 0.12, 'square', 0.008, 0, i * 0.5); } }
    else if (z === 'gang') { if (r < 0.02) { tone(300, 0.09, 'square', 0.012, -140, 0.1); tone(280, 0.08, 'square', 0.01, -120, 0.28); } for (const f of (VQ ? VQ.fire : [])) { const v = lfVol(f.x, f.y) * (Math.hypot(player.x - f.x, player.y - f.y) < 260 ? 1 : 0); if (v > 0 && Math.random() < 0.6) tone(2000 + Math.random() * 3000, 0.012, 'square', 0.006 * v); } }
    else if (z === 'nord') { if (!night && rain < 0.3 && r < 0.12) lfChirp(0.012); if (r > 0.96) { const P = [72, 74, 76, 79, 81]; tone(mtof(P[Math.floor(Math.random() * 5)] + 12), 1.6, 'sine', 0.008); } }
    else { if (!night && rain < 0.3 && r < 0.08) lfChirp(0.009); }
    if (!night && Math.abs(player.y - (RIVER.y0 + RIVER.y1) / 2) < 260 && Math.random() < 0.03) { tone(480, 0.1, 'sawtooth', 0.01, -180); tone(470, 0.1, 'sawtooth', 0.008, -170, 0.15); }
  }
  function lfChirp(v) { const f = 2600 + Math.random() * 1600, n = 2 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) tone(f + i * 60, 0.05, 'sine', v, 900, i * 0.09); }
