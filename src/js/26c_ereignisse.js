  // =====================================================================================================
  // v166: Sichtbare Stadt-Ereignisse. Jeder Spieltag hat einen eigenen Plan (aus der Tagesnummer berechnet,
  // muss nicht gespeichert werden): Baustelle, Straßenfest, Polizeikontrolle, Stromausfall, Nebel, Gewitter.
  // =====================================================================================================
  function evRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // Straßenabschnitte zwischen zwei Kreuzungen auf den drei großen waagerechten Straßen
  const EV_SEGS = (() => { const L = [], vs = RDV.slice().sort((a, b) => a.c0 - b.c0); for (const h of RDH.filter(r => r.id === 'H1' || r.id === 'H2' || r.id === 'H3')) for (let i = 0; i < vs.length - 1; i++) { const x0 = vs[i].c1 + SW + 10, x1 = vs[i + 1].c0 - SW - 10; if (x1 - x0 > 400) L.push({ r: h, x0, x1, y0: h.c0, y1: h.c1, cx: (x0 + x1) / 2, cy: (h.c0 + h.c1) / 2 }); } return L; })();
  const EV_TXT = { bau: '🚧 Baustelle', fest: '🎪 Straßenfest', kontrolle: '🚓 Polizeikontrolle', strom: '🔌 Stromausfall', fog: '🌫️ Nebel', storm: '⛈️ Gewitter' };
  const EVPC = new Map();
  function evPlanDay(d) {
    if (EVPC.has(d)) return EVPC.get(d); const L = [];
    if (d >= 2) {
      const rnd = evRng(d * 7919 + 13), segs = EV_SEGS.slice(), seg = () => segs.splice(Math.floor(rnd() * segs.length), 1)[0], day0 = (d - 1) * 1440;
      const add = (k, h0, dur, o) => L.push(Object.assign({ k, t0: Math.round(day0 + h0 * 60), t1: Math.round(day0 + (h0 + dur) * 60) }, o || {}));
      const w = rnd(); if (w < 0.2) add('fog', 4 + rnd() * 2, 4 + rnd() * 2); else if (w < 0.38) add('storm', 14 + rnd() * 5, 1.5 + rnd() * 1.5);
      const pool = ['bau', 'kontrolle', 'strom', 'fest'], n = 1 + (rnd() < 0.5 ? 1 : 0);
      for (let i = 0; i < n && pool.length; i++) { const k = pool.splice(Math.floor(rnd() * pool.length), 1)[0];
        if (k === 'bau') add('bau', 6 + rnd() * 3, 8 + rnd() * 4, { s: seg() });
        else if (k === 'fest') add('fest', 12 + rnd() * 2, 8, { s: seg() });
        else if (k === 'kontrolle') { const s = seg(), side = rnd() < 0.5 ? -1 : 1; add('kontrolle', 9 + rnd() * 10, 2 + rnd() * 1.5, { s, x: s.x0 + 90 + rnd() * (s.x1 - s.x0 - 180), y: side < 0 ? s.y0 + 15 : s.y1 - 15, side }); }
        else { const hs = RDH.filter(r => r.id === 'H1' || r.id === 'H2' || r.id === 'H3'), h = hs[Math.floor(rnd() * hs.length)], v = RDV[Math.floor(rnd() * RDV.length)], cx = (v.c0 + v.c1) / 2, cy = (h.c0 + h.c1) / 2; add('strom', 18.5 + rnd() * 2.5, 5 + rnd() * 2, { x0: cx - 560, x1: cx + 560, y0: cy - 430, y1: cy + 430, nm: h.name + ' und ' + v.name }); }
      }
    }
    EVPC.set(d, L); if (EVPC.size > 6) EVPC.delete(EVPC.keys().next().value); return L;
  }
  let EVA = [], EVC = [], evT = 0; const evSeen = new Set(), evWarn = new Set(); let evFl = { t: -9, x: 0, th: 0 }, evNext = 5;
  const evOn = () => !!G && !KR_NEUTRAL && state === 'play';
  const evK = e => { const now = absMin(); return clamp((now - e.t0) / 25, 0, 1) * clamp((e.t1 - now) / 25, 0, 1); };
  const evHH = t => String(Math.floor(((t / 60) % 24 + 24) % 24)).padStart(2, '0') + ':' + String(Math.floor(((t % 60) + 60) % 60)).padStart(2, '0');
  const evClosed = () => EVA.filter(e => e.k === 'bau' || e.k === 'fest');
  function evTick(dt) {
    if (!evOn()) { EVA = []; EVC = []; return; } evT -= dt;
    if (evT <= 0) { evT = 0.5; const now = absMin(), was = EVA; EVA = evPlanDay(G.day - 1).concat(evPlanDay(G.day)).filter(e => now >= e.t0 && now < e.t1);
      for (const e of EVA) { const id = e.k + '@' + e.t0; if (evSeen.has(id)) continue; evSeen.add(id); evStart(e); }
      for (const e of was) if (!EVA.includes(e) && (e.k === 'bau' || e.k === 'fest' || e.k === 'kontrolle')) msg(EV_TXT[e.k] + ' in der ' + e.s.r.name + ' ist vorbei', false);
      EVC = []; for (const e of evClosed()) { const s = e.s; EVC.push({ x: s.x0 - 6, y: s.y0, w: 12, h: s.y1 - s.y0 }, { x: s.x1 - 6, y: s.y0, w: 12, h: s.y1 - s.y0 }); if (e.k === 'bau') EVC.push({ x: s.cx - 40, y: s.cy - 26, w: 80, h: 44 }); else for (const st of evStalls(s)) EVC.push({ x: st.x - 18, y: st.y - 8, w: 36, h: 16 }); }
    }
    if (EVA.some(e => e.k === 'storm') && !inOwnRoom()) { evNext -= dt; if (evNext <= 0) { evNext = 5 + Math.random() * 9; evFl = { t: gt, x: Math.random(), th: 0.4 + Math.random() * 1.4 }; try { if (!LOFX) { tone(55, 1.6, 'sawtooth', 0.05, -25, evFl.th); tone(85, 1.0, 'triangle', 0.06, -40, evFl.th + 0.05); } } catch (x) {} } }
  }
  function evStart(e) {
    const until = ' bis ' + evHH(e.t1);
    if (e.k === 'bau') { msg('🚧 Baustelle in der ' + e.s.r.name + ': für Autos gesperrt' + until, false); for (let i = traffic.length - 1; i >= 0; i--) if (traffic[i].ln.r === e.s.r && !inView(traffic[i].x, traffic[i].y, 80)) traffic.splice(i, 1); }
    else if (e.k === 'fest') { msg('🎪 Straßenfest in der ' + e.s.r.name + ': Lieferungen in der Nähe bringen 30 % mehr' + until, false); for (let i = traffic.length - 1; i >= 0; i--) if (traffic[i].ln.r === e.s.r && !inView(traffic[i].x, traffic[i].y, 80)) traffic.splice(i, 1); }
    else if (e.k === 'kontrolle') msg('🚓 Polizeikontrolle in der ' + e.s.r.name + until + '. Mit Ware lieber einen Bogen machen', false);
    else if (e.k === 'strom') msg('🔌 Stromausfall rund um ' + e.nm + until + ': dunkel, die Polizei sieht dort schlechter', false);
    else if (e.k === 'fog') msg('🌫️ Dichter Nebel: Die Polizei sieht weniger weit', false);
    else if (e.k === 'storm') msg('⛈️ Gewitter! Die Polizei sieht weniger weit', false);
  }
  // ---------- Auswirkungen ----------
  const evRoadClosed = r => EVA.some(e => (e.k === 'bau' || e.k === 'fest') && e.s.r === r);
  // Abstand des Verkehrsautos c zur nächsten Absperrung vor ihm (oder Infinity)
  function evTrafBlock(c, half) {
    if (!EVA.length || !c.h) return Infinity; let best = Infinity;
    for (const e of EVA) { if ((e.k !== 'bau' && e.k !== 'fest') || e.s.r !== c.ln.r) continue; for (const bx of [e.s.x0 - 8, e.s.x1 + 8]) { const al = (bx - c.x) * c.dir - half; if (al > -4 && al < best) best = al; } }
    return best;
  }
  function evPush(e, r) {
    for (const c of EVC) { const nx = clamp(e.x, c.x, c.x + c.w), ny = clamp(e.y, c.y, c.y + c.h), dx = e.x - nx, dy = e.y - ny, d2 = dx * dx + dy * dy;
      if (d2 < r * r) { if (d2 > 1e-6) { const d = Math.sqrt(d2), k = (r - d) / d; e.x += dx * k; e.y += dy * k; } else { const l = e.x - c.x, rr2 = c.x + c.w - e.x, t = e.y - c.y, b = c.y + c.h - e.y, m = Math.min(l, rr2, t, b); if (m === l) e.x = c.x - r; else if (m === rr2) e.x = c.x + c.w + r; else if (m === t) e.y = c.y - r; else e.y = c.y + c.h + r; } } }
  }
  const evDark = (x, y) => EVA.some(e => e.k === 'strom' && x > e.x0 && x < e.x1 && y > e.y0 && y < e.y1);
  function evSightK() {
    if (!EVA.length) return 1; let k = 1;
    for (const e of EVA) { if (e.k === 'fog') k *= 1 - 0.4 * evK(e); else if (e.k === 'storm') k *= 1 - 0.25 * evK(e); else if (e.k === 'strom' && lightK() > 0.12 && evDark(player.x, player.y)) k *= 0.65; }
    return k;
  }
  function evPay(p) { for (const e of EVA) if (e.k === 'fest' && p && Math.hypot(p.x - e.s.cx, p.y - e.s.cy) < 560) return 1.3; return 1; }
  // Kontrolle: mit Ware in der Nähe wird die Polizei schnell misstrauisch
  function evCheckSus(dt, carrying) {
    let add = 0;
    for (const e of EVA) { if (e.k !== 'kontrolle') continue; const d = Math.hypot(player.x - e.x, player.y - e.y), id = e.t0;
      if (d < 260 && carrying && !evWarn.has(id)) { evWarn.add(id); msg('🚓 Vorsicht, Polizeikontrolle! Mit Ware nicht zu nah ran', true); }
      if (carrying && d < 135) add += dt * 0.9; }
    return add;
  }
  const evWeather = () => { for (const e of EVA) if (e.k === 'storm' || e.k === 'fog') return e.k; return ''; };
  // ---------- Zeichnen ----------
  const evStalls = s => { const L = [], n = Math.max(3, Math.floor((s.x1 - s.x0 - 120) / 130)); for (let i = 0; i < n; i++) { const x = s.x0 + 70 + i * (s.x1 - s.x0 - 140) / Math.max(1, n - 1); L.push({ x, y: s.y0 + 26, c: i }, { x: x + 55 > s.x1 - 50 ? x - 40 : x + 50, y: s.y1 - 30, c: i + 2 }); } return L; };
  function evBarrier(x, y0, y1, blue) {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 3, y0 + 4, 8, y1 - y0 - 4);
    const n = Math.ceil((y1 - y0) / 12); for (let i = 0; i < n; i++) { ctx.fillStyle = i % 2 ? '#F4F4F2' : (blue ? '#2F6FD6' : '#D33F3F'); ctx.fillRect(x - 3, y0 + i * 12, 6, Math.min(12, y1 - y0 - i * 12)); }
    for (const yy of [y0 + 4, (y0 + y1) / 2, y1 - 4]) { ctx.fillStyle = '#3A3F46'; ctx.fillRect(x - 6, yy - 2, 12, 4); }
    if (!blue) { const on = Math.sin(gt * 6 + x) > 0; for (const yy of [y0 + 6, y1 - 6]) { ctx.fillStyle = on ? '#FFB547' : '#7A5A2A'; ctx.beginPath(); ctx.arc(x, yy - 6, 3, 0, TAU); ctx.fill(); } }
  }
  function evCone(x, y) { ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 3, 5, 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#F07A2A'; ctx.beginPath(); ctx.moveTo(x - 4.5, y + 2); ctx.lineTo(x, y - 9); ctx.lineTo(x + 4.5, y + 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x - 2.6, y - 4, 5.2, 2); ctx.fillStyle = '#2E3440'; ctx.fillRect(x - 5.5, y + 1.5, 11, 2); }
  function evDigger(x, y) {
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x + 3, y + 14, 38, 10, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2E3238'; rr(x - 30, y + 2, 44, 12, 4); ctx.fill(); ctx.fillStyle = '#4A4F57'; for (let i = 0; i < 6; i++) ctx.fillRect(x - 27 + i * 7, y + 4, 4, 8);
    ctx.fillStyle = '#E8B23A'; rr(x - 26, y - 14, 36, 18, 3); ctx.fill(); ctx.fillStyle = '#C4901F'; ctx.fillRect(x - 26, y, 36, 4);
    ctx.fillStyle = '#E8B23A'; rr(x - 4, y - 30, 16, 18, 2); ctx.fill(); ctx.fillStyle = 'rgba(160,210,240,.85)'; ctx.fillRect(x - 1, y - 27, 10, 9);
    const a = Math.sin(gt * 0.8) * 0.15; ctx.save(); ctx.translate(x + 10, y - 10); ctx.rotate(-0.5 + a); ctx.fillStyle = '#D9A02E'; ctx.fillRect(0, -3, 30, 6); ctx.translate(30, 0); ctx.rotate(1.3 - a * 2); ctx.fillRect(0, -2.5, 22, 5); ctx.translate(22, 0); ctx.fillStyle = '#5A5F66'; ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(9, -2); ctx.lineTo(7, 6); ctx.lineTo(-1, 4); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function evDrawGround() {
    if (!EVA.length || inOwnRoom()) return;
    for (const e of EVA) {
      if (e.k === 'bau' || e.k === 'fest') { const s = e.s; if (!(s.x1 > viewX0 - 60 && s.x0 < viewX1 + 60 && s.y1 > viewY0 - 60 && s.y0 < viewY1 + 60)) continue;
        if (e.k === 'bau') {
          ctx.fillStyle = '#6E5A44'; rr(s.cx - 120, s.cy - 34, 240, 62, 14); ctx.fill(); ctx.fillStyle = '#7E6A52'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.arc(s.cx - 105 + (i * 37) % 210, s.cy - 22 + (i * 23) % 44, 3 + (i % 3), 0, TAU); ctx.fill(); }
          ctx.fillStyle = '#9A9286'; ctx.beginPath(); ctx.ellipse(s.cx + 70, s.cy + 6, 28, 14, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#B0A89C'; ctx.beginPath(); ctx.ellipse(s.cx + 66, s.cy + 2, 18, 8, 0, 0, TAU); ctx.fill();
          for (let x = s.x0 + 40; x < s.x1 - 30; x += 70) { evCone(x, s.y0 + 12); evCone(x + 35, s.y1 - 10); }
          evDigger(s.cx - 30, s.cy - 2);
          ctx.fillStyle = '#F2C14E'; rr(s.x0 + 14, s.cy - 18, 30, 26, 3); ctx.fill(); ctx.fillStyle = '#1D2129'; ctx.font = '900 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BAU', s.x0 + 29, s.cy - 8); ctx.fillText('⚠', s.x0 + 29, s.cy + 1);
        } else {
          const st = evStalls(s), cols = [['#D33F3F', '#FFFFFF'], ['#2F6FD6', '#FFFFFF'], ['#3FAE6A', '#F2E8C8'], ['#E8833A', '#FFF2D6'], ['#8A5FC9', '#F4E8FF']];
          for (let x = s.x0 + 50; x < s.x1 - 20; x += 120) { ctx.strokeStyle = 'rgba(40,40,40,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, s.y0); ctx.quadraticCurveTo(x + 10, s.cy, x, s.y1); ctx.stroke();
            for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9, yy = s.y0 + t * (s.y1 - s.y0), xx = x + 20 * t * (1 - t) * 2; ctx.fillStyle = ['#FF5C7A', '#FFD24A', '#5BC0EB', '#63C174', '#C9A2FF'][i % 5]; ctx.beginPath(); ctx.moveTo(xx, yy - 4); ctx.lineTo(xx + 7, yy); ctx.lineTo(xx, yy + 4); ctx.closePath(); ctx.fill(); } }
          for (const p of st) { const c = cols[p.c % cols.length]; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(p.x - 17, p.y + 4, 36, 8); ctx.fillStyle = '#8A5E3A'; ctx.fillRect(p.x - 16, p.y - 2, 32, 9);
            for (let i = 0; i < 6; i++) { ctx.fillStyle = c[i % 2]; ctx.fillRect(p.x - 18 + i * 6, p.y - 14, 6, 11); } ctx.fillStyle = c[0]; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(p.x - 15 + i * 6, p.y - 3, 3, 0, Math.PI); ctx.fill(); }
            ctx.fillStyle = ['#FFD24A', '#FF8FA3', '#9FE3B0', '#FFB547'][p.c % 4]; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(p.x - 9 + i * 9, p.y + 1, 2.4, 0, TAU); ctx.fill(); } }
          for (let i = 0; i < 4; i++) { const bx = s.cx - 150 + i * 100, by = s.cy - 30 + Math.sin(gt * 1.3 + i) * 4; ctx.strokeStyle = 'rgba(60,60,60,.5)'; ctx.beginPath(); ctx.moveTo(bx, by + 8); ctx.lineTo(bx + 2, by + 30); ctx.stroke(); ctx.fillStyle = ['#FF5C7A', '#5BC0EB', '#FFD24A', '#63C174'][i]; ctx.beginPath(); ctx.ellipse(bx, by, 6, 8, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(bx - 2, by - 3, 1.8, 0, TAU); ctx.fill(); }
          ctx.font = '700 11px sans-serif'; ctx.textAlign = 'center'; for (let i = 0; i < 3; i++) { const t = ((gt * 0.35 + i / 3) % 1); ctx.globalAlpha = Math.sin(t * Math.PI) * 0.8; ctx.fillStyle = '#FFE08A'; ctx.fillText(i % 2 ? '♫' : '♪', s.cx - 60 + i * 60 + Math.sin(gt + i) * 8, s.cy + 10 - t * 40); } ctx.globalAlpha = 1;
        }
        evBarrier(s.x0, s.y0, s.y1, e.k === 'fest'); evBarrier(s.x1, s.y0, s.y1, e.k === 'fest');
      } else if (e.k === 'kontrolle') { if (!inView(e.x, e.y, 120)) continue;
        const ang = e.side < 0 ? 0 : Math.PI; drawCar(e.x, e.y, ang, 'suv', 5, null, true);
        ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(ang); ctx.fillStyle = '#2F6FD6'; ctx.fillRect(-20, -11, 40, 3); ctx.fillRect(-20, 8, 40, 3); const on = Math.floor(gt * 6) % 2; ctx.fillStyle = on ? '#4FA3FF' : '#1E4FA8'; ctx.fillRect(-3, -7, 5, 6); ctx.fillStyle = on ? '#1E4FA8' : '#4FA3FF'; ctx.fillRect(-3, 1, 5, 6); ctx.restore();
        const dy = e.side < 0 ? 30 : -30; for (let i = -2; i <= 2; i++) evCone(e.x + i * 26, e.y + dy);
        ctx.fillStyle = '#FFFFFF'; rr(e.x + 34, e.y - 14, 34, 16, 3); ctx.fill(); ctx.strokeStyle = '#D33F3F'; ctx.lineWidth = 1.6; ctx.stroke(); ctx.fillStyle = '#1D2129'; ctx.font = '900 5.5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('POLIZEI', e.x + 51, e.y - 9); ctx.fillText('KONTROLLE', e.x + 51, e.y - 3);
      }
    }
  }
  // Lichter: Blaulicht, Baustellen-Blinker, Lichterketten, Dunkelheit beim Stromausfall
  function evLights(L, oK) {
    if (!EVA.length || inOwnRoom()) return;
    for (const e of EVA) {
      if (e.k === 'strom' && L > 0.05) { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(4,6,16,' + (0.32 * L).toFixed(3) + ')'; ctx.fillRect(e.x0, e.y0, e.x1 - e.x0, e.y1 - e.y0); ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 7; i++) { const x = e.x0 + 120 + ((i * 397) % (e.x1 - e.x0 - 240)), y = e.y0 + 100 + ((i * 251) % (e.y1 - e.y0 - 200)); if (inView(x, y, 60)) glow(x, y, 18, '255,170,80', (0.25 + 0.08 * Math.sin(gt * 9 + i)) * L * oK); } }
      else if (e.k === 'kontrolle' && inView(e.x, e.y, 200)) { const on = Math.floor(gt * 6) % 2; glow(e.x, e.y - 4, 70, on ? '80,150,255' : '40,90,220', (0.25 + 0.3 * L) * oK); }
      else if ((e.k === 'bau' || e.k === 'fest') && L > 0.05) { const s = e.s; if (!(s.x1 > viewX0 - 60 && s.x0 < viewX1 + 60 && s.y1 > viewY0 - 60 && s.y0 < viewY1 + 60)) continue;
        if (e.k === 'bau') { const on = Math.sin(gt * 6) > 0; if (on) for (const x of [s.x0, s.x1]) for (const y of [s.y0 + 6, s.y1 - 6]) glow(x, y - 6, 26, '255,180,60', 0.5 * L * oK); }
        else { for (let x = s.x0 + 50; x < s.x1 - 20; x += 120) for (let i = 0; i < 6; i++) { const t = (i + 0.5) / 6; glow(x + 20 * t * (1 - t) * 2, s.y0 + t * (s.y1 - s.y0), 16, ['255,92,122', '255,210,74', '120,200,255', '180,240,140'][i % 4], (0.35 + 0.1 * Math.sin(gt * 4 + i + x)) * L * oK); }
          for (const p of evStalls(s)) glow(p.x, p.y - 6, 40, '255,210,140', 0.3 * L * oK); } }
    }
  }
  // Bildschirm: Nebel und Gewitter (über der Welt, unter der Anzeige)
  function evScreen() {
    if (!EVA.length || state !== 'play' || inOwnRoom()) return; const wk = evWeather(); if (!wk) return; const e = EVA.find(x => x.k === wk), k = evK(e) * (indoorK ? 1 - 0.7 * indoorK : 1); if (k <= 0.01) return;
    ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.globalCompositeOperation = 'source-over';
    if (wk === 'fog') { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(200,208,218,' + (0.42 * k) + ')'); g.addColorStop(1, 'rgba(190,198,210,' + (0.3 * k) + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 6; i++) { const x = ((i * 0.23 + gt * 0.012 * (1 + i % 3)) % 1.4 - 0.2) * W, y = (0.15 + (i * 0.37) % 0.8) * H, r = Math.max(W, H) * (0.25 + (i % 3) * 0.08), rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(225,230,238,' + (0.22 * k) + ')'); rg.addColorStop(1, 'rgba(225,230,238,0)'); ctx.fillStyle = rg; ctx.fillRect(x - r, y - r, r * 2, r * 2); } }
    else { ctx.fillStyle = 'rgba(8,12,26,' + (0.2 * k) + ')'; ctx.fillRect(0, 0, W, H); const ft = gt - evFl.t;
      if (ft >= 0 && ft < 0.45) { const a = (ft < 0.08 ? 1 : ft < 0.14 ? 0.3 : ft < 0.22 ? 0.85 : Math.max(0, 1 - (ft - 0.22) / 0.23) * 0.6) * k * (LOFX ? 0.4 : 1); ctx.fillStyle = 'rgba(230,236,255,' + (0.5 * a).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
        if (ft < 0.22) { ctx.strokeStyle = 'rgba(255,255,255,' + a + ')'; ctx.lineWidth = 2.2; ctx.beginPath(); let x = evFl.x * W, y = 0; ctx.moveTo(x, y); const r2 = evRng(Math.floor(evFl.t * 1000)); while (y < H * 0.55) { x += (r2() - 0.5) * 40; y += 14 + r2() * 22; ctx.lineTo(x, y); } ctx.stroke(); } } }
    ctx.restore();
  }
  // Handy: Karriere → Events
  function evWelt(b) {
    if (!G || KR_NEUTRAL) return; const now = absMin(), L = evPlanDay(G.day - 1).filter(e => e.t1 > now).concat(evPlanDay(G.day)); if (!L.length) return;
    krGrp(b, 'Heute in der Stadt');
    for (const e of L) { const where = e.s ? 'in der ' + e.s.r.name : e.k === 'strom' ? 'rund um ' + e.nm : 'in der ganzen Stadt', st = now >= e.t1 ? 'vorbei' : now >= e.t0 ? 'läuft bis ' + evHH(e.t1) : 'ab ' + evHH(e.t0);
      const ds = { bau: 'Die Straße ist für Autos gesperrt. Zu Fuß geht es über den Gehweg.', fest: 'Lieferungen in der Nähe bringen 30 % mehr. Für Autos gesperrt.', kontrolle: 'Wer mit Ware nah vorbeigeht, macht die Polizei schnell misstrauisch.', strom: 'Nachts ist es dort dunkel. Die Polizei sieht schlechter.', fog: 'Die Polizei sieht weniger weit.', storm: 'Regen, Blitze, Donner. Die Polizei sieht weniger weit.' }[e.k];
      const c = krCard(b, EV_TXT[e.k] + ' ' + where, st, ds); if (now >= e.t1) c.classList.add('done'); }
  }
