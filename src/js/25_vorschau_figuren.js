  // ---------- Vorschau der Effekte im Handy ----------
  let pvList = [], pvTimer = 0, pvLast = 0;
  function startPreviews(root) {
    pvList = Array.from(root.querySelectorAll('canvas.pv')).map(el => ({ el, id: el.dataset.cos || el.dataset.dec || el.dataset.bat || el.dataset.wear || el.dataset.veh, veh: !!el.dataset.veh, dec: !!el.dataset.dec, bat: !!el.dataset.bat, wear: !!el.dataset.wear, fx: [], hist: [], sd: 0, sa: 0, t: 0, x: 66, y: 42, ang: Math.PI / 2, step: 0 }));
    clearTimeout(pvTimer); pvLast = 0;
    if (pvList.length) pvTimer = setTimeout(pvTick, 33);
  }
  function pvTick() {
    if (!phoneOpen || !['style', 'deko', 'wpn', 'kiosk', 'wear', 'kopf', 'figur', 'pets', 'kleid', 'shoes', 'kost', 'ruecken', 'aura', 'veh', 'dshop', 'autohof', 'werk', 'gang', 'g_deko'].includes(tab)) return;
    const now = Date.now(), dt = Math.min(0.06, (now - (pvLast || now - 33)) / 1000); pvLast = now;
    for (const p of pvList) { const cd = p.el.closest && p.el.closest('.card'); if (cd && cd.style.display === 'none') continue; pvDraw(p, dt); } // v128: ausgefilterte Karten nicht zeichnen
    pvTimer = setTimeout(pvTick, 33);
  }
  let pvMode = false, pvNight = false, pvLiveT = 0;
  function pvDraw(p, dt) {
    if (p.el.dataset.live) { pvLive(p, dt); return; }
    const c = p.el.getContext && p.el.getContext('2d'); if (!c) return;
    const cs = p.veh ? { kind: 'veh', id: p.id } : p.wear ? { kind: 'wear', id: p.id } : p.bat ? { kind: 'bat', id: p.id } : p.dec ? { kind: 'dec', id: p.id } : COS.find(x => x.id === p.id); if (!cs) return;
    const sv = { ctx, fx, hist, sd: stepDist, sa: fxAcc, px: player.x, py: player.y, pa: player.ang, orb: G.cos.orbit, orb2: G.cos.orbit2, trl: G.cos.trail };
    try {
      ctx = c; c.setTransform(2, 0, 0, 2, 0, 0);
      c.fillStyle = '#161C24'; c.fillRect(0, 0, 132, 64);
      if (cs.kind === 'wear') {
        p.t += dt; const w = WEAR_BY[cs.id], pl = Object.assign({}, G.look, { outline: false }); pl[WEAR_KEY[w.slot]] = cs.id;
        const ang = [Math.PI / 2, 0, -Math.PI / 2, Math.PI][Math.floor(p.t / 1.8) % 4];
        c.fillStyle = 'rgba(255,255,255,.04)'; c.fillRect(0, 48, 132, 16);
        if (w.slot === 'shoe') { c.save(); c.translate(66, 7); c.scale(4.5, 4.5); drawFigure(0, 0, ang, p.t * 7, pl); c.restore(); } else { c.save(); c.translate(66, 36); c.scale(1.45, 1.45); drawFigure(0, 0, ang, p.t * 7, pl); c.restore(); }
      } else if (cs.kind === 'veh') {
        p.t += dt; c.fillStyle = 'rgba(255,255,255,.04)'; c.fillRect(0, 48, 132, 16);
        const ang = [0, Math.PI / 2, Math.PI, -Math.PI / 2][Math.floor(p.t / 1.6) % 4];
        const isCar = VEH_BY[cs.id] && VEH_BY[cs.id].car; c.save(); c.translate(66, isCar ? 32 : 30); c.scale(isCar ? 1.45 : 1.9, isCar ? 1.45 : 1.9); drawRide(0, 0, ang, cs.id, Object.assign({}, G.look, { outline: false }), p.t * 9); c.restore();
      } else if (cs.kind === 'bat') pvBat(p, dt, c);
      else if (cs.kind === 'dec') {
        c.fillStyle = 'rgba(255,255,255,.04)'; c.fillRect(0, 48, 132, 16);
        const hh = dHalf(cs.id)[1]; drawDecorItem(cs.id, 66, 38, hh > 20 ? Math.min(1.25, 25 / hh) : 1.25);
      } else if (cs.kind === 'pet') {
        p.t += dt; const a = p.t * 1.1;
        drawPet(cs.id, 66 + Math.sin(a) * 34, 46, Math.cos(a) >= 0 ? 1 : -1, gt, true, 1.7);
      } else {
        fx = p.fx; hist = p.hist; stepDist = p.sd; fxAcc = p.sa;
        G.cos.orbit = cs.kind === 'orbit' ? cs.id : 'none'; G.cos.orbit2 = 'none'; G.cos.trail = cs.kind === 'trail' ? cs.id : 'none';
        let moved = 0;
        if (cs.kind === 'trail') {
          p.t += dt; const a = p.t * 1.5, nx = 66 + Math.cos(a) * 44, ny = 34 + Math.sin(a * 2) * 12;
          moved = Math.hypot(nx - p.x, ny - p.y); if (moved > 0.01) p.ang = Math.atan2(ny - p.y, nx - p.x); p.x = nx; p.y = ny; p.step += dt * 9;
        } else { p.x = 66; p.y = 42; p.ang = Math.PI / 2; }
        player.x = p.x; player.y = p.y; player.ang = p.ang;
        fxUpdate(dt, moved);
        drawTrail(); drawOrbit(false);
        drawFigure(p.x, p.y, p.ang, p.step);
        drawOrbit(true);
        p.sd = stepDist; p.sa = fxAcc;
      }
    } catch (e) { /* Vorschau darf das Spiel nie stören */ }
    ctx = sv.ctx; fx = sv.fx; hist = sv.hist; stepDist = sv.sd; fxAcc = sv.sa; player.x = sv.px; player.y = sv.py; player.ang = sv.pa; G.cos.orbit = sv.orb; G.cos.orbit2 = sv.orb2; G.cos.trail = sv.trl;
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function drawFields(ar) {
    for (const nm of ['rack', 'table']) {
      const f = ar.fields[nm], inside = !GH_ON && inField(f, player.x, player.y), pu = 0.5 + 0.5 * Math.sin(gt * 4), w = f.x1 - f.x0, h = f.y1 - f.y0;
      ctx.fillStyle = inside ? 'rgba(255,181,71,' + (0.2 + 0.1 * pu).toFixed(2) + ')' : 'rgba(255,255,255,.06)';
      rr(f.x0, f.y0, w, h, 7); ctx.fill();
      ctx.setLineDash(inside ? [] : [6, 5]); ctx.strokeStyle = inside ? ar.dry : 'rgba(255,255,255,.32)'; ctx.lineWidth = inside ? 2.2 : 1.6;
      rr(f.x0, f.y0, w, h, 7); ctx.stroke(); ctx.setLineDash([]);
      // zwei Fußabdrücke
      ctx.fillStyle = inside ? ar.dry : 'rgba(255,255,255,.28)';
      ctx.beginPath(); ell((f.x0 + f.x1) / 2 - 6, f.y0 + h * 0.4, 3.2, 5); ctx.fill(); ctx.beginPath(); ell((f.x0 + f.x1) / 2 + 6, f.y0 + h * 0.4, 3.2, 5); ctx.fill();
      ctx.fillStyle = inside ? ar.dry : 'rgba(255,255,255,.5)'; ctx.font = (w < 60 ? '700 6.5px' : '700 8.5px') + ' sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(f.label.toUpperCase(), (f.x0 + f.x1) / 2, f.y1 - 7);
    }
  }
  // pass 0 = Teppiche (unter den Stationen), pass 1 = alles andere (nach Hoehe sortiert)
  // v54: Anbau-Deko (Cartoon, keine Anleitung). Zeichnet in lokalen Koordinaten, gibt false zurueck, wenn die ID nicht dazugehoert.
  function hempLeaf(x, y, s, rot, col, col2) { // stilisiertes Blatt mit sieben Fingern
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.fillStyle = col;
    [[-78, .45], [-52, .7], [-26, .9], [0, 1], [26, .9], [52, .7], [78, .45]].forEach(([d, l]) => { ctx.save(); ctx.rotate(d * Math.PI / 180); ell(0, -s * l * .55, s * (.09 + l * .05), s * l * .55); ctx.fill(); ctx.restore(); });
    ctx.strokeStyle = col2 || col; ctx.lineWidth = Math.max(.8, s * .06); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, s * .35); ctx.stroke(); ctx.restore();
  }
  function drawGrowDec(id, t) {
    if (id === 'growtent') {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-20, 22, 44, 6);
      ctx.fillStyle = '#2A2D33'; rr(-22, -26, 44, 50, 3); ctx.fill();
      ctx.fillStyle = '#C9CED6'; rr(-20, -24, 40, 46, 2); ctx.fill();
      ctx.fillStyle = '#1C1F25'; ctx.fillRect(-15, -18, 30, 38);
      const g = ctx.createLinearGradient(0, -18, 0, 20); g.addColorStop(0, 'rgba(214,120,255,.55)'); g.addColorStop(1, 'rgba(214,120,255,.12)'); ctx.fillStyle = g; ctx.fillRect(-15, -18, 30, 38);
      ctx.fillStyle = '#E8B3FF'; ctx.fillRect(-12, -17, 24, 3);
      ctx.fillStyle = '#7A4E33'; ctx.fillRect(-6, 12, 12, 7);
      hempLeaf(0, 10, 16, Math.sin(t) * .04, '#4FB35E', '#2F7A48'); hempLeaf(-6, 4, 9, -.6, '#63C174'); hempLeaf(6, 4, 9, .6, '#63C174');
      ctx.fillStyle = '#9AA0AA'; ctx.fillRect(-16, -18, 2, 38); ctx.fillRect(14, -18, 2, 38);
      ctx.fillStyle = '#2A2D33'; ctx.fillRect(-3, -31, 6, 6);
    } else if (id === 'ledpanel') {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(0, 22, 12, 3); ctx.fill();
      ctx.fillStyle = '#3A3F4A'; ctx.fillRect(-1.5, -12, 3, 33); ctx.fillRect(-10, 19, 20, 3);
      const a = .75 + .25 * Math.sin(t * 2);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, -8, 2, 0, -8, 26); g.addColorStop(0, 'rgba(230,80,255,' + (.5 * a).toFixed(2) + ')'); g.addColorStop(1, 'rgba(230,80,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -8, 26, 0, TAU); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#20232B'; rr(-17, -22, 34, 12, 2); ctx.fill();
      for (let r = 0; r < 2; r++) for (let k = 0; k < 7; k++) { ctx.fillStyle = (k + r) % 3 ? '#FF4FA8' : '#7F7BFF'; ctx.fillRect(-14 + k * 4.4, -20 + r * 4.6, 2.4, 2.4); }
    } else if (id === 'carbonfilter') {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(0, 20, 11, 3); ctx.fill();
      ctx.fillStyle = '#23262D'; rr(-10, -6, 20, 26, 3); ctx.fill(); ctx.fillStyle = '#353A44'; for (let k = 0; k < 5; k++) ctx.fillRect(-10, -3 + k * 5, 20, 1.4);
      ctx.fillStyle = '#B9BEC6'; ctx.fillRect(-4, -22, 8, 16); ctx.strokeStyle = '#8A9099'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-4, -20 + k * 3.8); ctx.lineTo(4, -20 + k * 3.8); ctx.stroke(); }
      ctx.fillStyle = '#4A505B'; ctx.fillRect(-6, -8, 12, 3);
    } else if (id === 'clipfan') {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(0, 12, 8, 2.5); ctx.fill();
      ctx.fillStyle = '#2B2F38'; ctx.fillRect(-1.5, 2, 3, 9); ctx.fillRect(-6, 10, 12, 3);
      ctx.fillStyle = '#E8ECF2'; ctx.beginPath(); ctx.arc(0, -3, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#AAB6C6';
      for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(0, -3); ctx.rotate(t * 12 + k * TAU / 3); ell(4, 0, 4, 1.8); ctx.fill(); ctx.restore(); }
      ctx.strokeStyle = '#5A6270'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(0, -3, 9, 0, TAU); ctx.stroke(); ctx.fillStyle = '#5A6270'; ctx.beginPath(); ctx.arc(0, -3, 1.6, 0, TAU); ctx.fill();
    } else if (id === 'watercan') {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(0, 8, 9, 2.5); ctx.fill();
      ctx.fillStyle = '#3FAE6A'; rr(-7, -4, 12, 11, 2); ctx.fill(); ctx.strokeStyle = '#3FAE6A'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(5, 2); ctx.lineTo(11, -5); ctx.stroke();
      ctx.beginPath(); ctx.arc(-1, -5, 4, Math.PI, 0); ctx.stroke(); ctx.fillStyle = '#2F8F4A'; ctx.fillRect(10, -7, 3, 3);
    } else if (id === 'seedrack') {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-15, 16, 32, 4);
      ctx.fillStyle = '#7A5A40'; ctx.fillRect(-16, -18, 32, 34); ctx.fillStyle = '#5B4330'; ctx.fillRect(-14, -16, 28, 30);
      const cl = ['#E05555', '#F2C14E', '#63C174', '#6EB5FF', '#C58BE6', '#FF9A5A'];
      for (let r = 0; r < 3; r++) { ctx.fillStyle = '#9A7650'; ctx.fillRect(-14, -6 + r * 10, 28, 2); for (let k = 0; k < 5; k++) { ctx.fillStyle = cl[(k + r * 2) % 6]; ctx.fillRect(-12 + k * 5.4, -14 + r * 10, 4, 8); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-11.4 + k * 5.4, -11 + r * 10, 2.8, 1.2); } }
    } else if (id === 'leafposter') {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-13, -15, 30, 38);
      ctx.fillStyle = '#F2EBD9'; ctx.fillRect(-15, -19, 30, 38); ctx.fillStyle = '#1F3A2A'; ctx.fillRect(-12, -16, 24, 32);
      hempLeaf(0, 6, 17, 0, '#63C174', '#3FAE6A');
      ctx.fillStyle = '#F2C14E'; ctx.font = '800 5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText('GRÜN', 0, -10);
    } else if (id === 'jars') {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-15, 13, 32, 4);
      ctx.fillStyle = '#8A6A4A'; ctx.fillRect(-16, 10, 32, 4);
      for (let k = 0; k < 4; k++) { const x = -13 + k * 7.4; ctx.fillStyle = 'rgba(200,230,255,.35)'; rr(x, -6, 6, 16, 1.5); ctx.fill(); ctx.fillStyle = k % 2 ? '#63C174' : '#7FCF6A'; ctx.beginPath(); ctx.arc(x + 3, 5, 2.4, 0, TAU); ctx.arc(x + 3, 1, 2.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#C9A064'; ctx.fillRect(x - .4, -8, 6.8, 2.6); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x + .8, -4, 1, 10); }
    } else if (id === 'hygro') {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(0, 9, 7, 2); ctx.fill();
      ctx.fillStyle = '#E8ECF2'; rr(-7, -9, 14, 17, 2); ctx.fill(); ctx.fillStyle = '#9FD8A0'; ctx.fillRect(-5, -7, 10, 7);
      ctx.fillStyle = '#1C2A1E'; ctx.font = '800 5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(Math.floor(t) % 4 < 2 ? '24°' : '55%', 0, -2);
      ctx.fillStyle = '#AAB6C6'; ctx.fillRect(-5, 2, 10, 1.5); ctx.fillRect(-5, 5, 6, 1.5);
    } else if (id === 'mother') {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(1, 20, 15, 4); ctx.fill();
      ctx.fillStyle = '#3B3F48'; ctx.beginPath(); ctx.moveTo(-11, 8); ctx.lineTo(11, 8); ctx.lineTo(9, 21); ctx.lineTo(-9, 21); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#2B1D14'; ell(0, 8, 11, 3); ctx.fill();
      const sw = Math.sin(t * 1.3) * .05;
      hempLeaf(0, 6, 20, sw, '#2F7A48'); hempLeaf(-8, 0, 13, -.7 + sw, '#4FB35E'); hempLeaf(8, 0, 13, .7 + sw, '#4FB35E'); hempLeaf(0, -8, 12, sw, '#63C174');
    } else if (id === 'drynet') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 20, 14, 3); ctx.fill();
      ctx.strokeStyle = '#3A3F4A'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(0, -16); ctx.stroke();
      for (let k = 0; k < 4; k++) { const y = -16 + k * 10, sw = Math.sin(t * 1.5 + k) * .6; ctx.fillStyle = 'rgba(40,44,52,.85)'; ell(sw, y, 16, 3.4); ctx.fill(); ctx.strokeStyle = '#6B7280'; ctx.lineWidth = .7; ell(sw, y, 16, 3.4); ctx.stroke(); ctx.fillStyle = '#A8C46A'; for (let j = 0; j < 4; j++) { ctx.beginPath(); ctx.arc(sw - 9 + j * 6, y - .8, 1.8, 0, TAU); ctx.fill(); } }
      ctx.strokeStyle = 'rgba(160,166,176,.6)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(-15, -16); ctx.lineTo(-15, 14); ctx.moveTo(15, -16); ctx.lineTo(15, 14); ctx.stroke();
    } else if (id === 'hemprug') {
      ctx.fillStyle = '#2E5A3A'; rr(-32, -24, 64, 48, 8); ctx.fill(); ctx.strokeStyle = '#F2C14E'; ctx.lineWidth = 2; rr(-28, -20, 56, 40, 6); ctx.stroke();
      hempLeaf(0, 10, 30, 0, '#7FCF6A', '#4FB35E');
    } else return false;
    return true;
  }
  // v88: Labor-Deko (rein fiktiv, nur Spielgrafik). Gleiche IDs wie die alte Brauerei-Deko, damit gekaufte Teile erhalten bleiben.
  function drawBrewDec(id, t) {
    const sh = (w, y) => { ctx.fillStyle = 'rgba(0,0,0,.25)'; ell(1, y, w, 3.2); ctx.fill(); };
    const flask = (x, y, r, col, lv) => { // runder Kolben mit Hals, Fluessigkeit bis lv (0..1)
      ctx.fillStyle = 'rgba(210,235,250,.28)'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.fillRect(x - r * 0.3, y - r * 1.9, r * 0.6, r * 1.2);
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 0.6, 0, TAU); ctx.clip(); ctx.fillStyle = col; ctx.fillRect(x - r, y + r - 2 * r * lv, 2 * r, 2 * r * lv); ctx.restore();
      ctx.strokeStyle = 'rgba(235,245,255,.75)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.strokeRect(x - r * 0.3, y - r * 1.9, r * 0.6, r * 1.1);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.arc(x - r * 0.4, y - r * 0.35, r * 0.22, 0, TAU); ctx.fill();
    };
    if (id === 'kettle') { // Glaskolben-Aufbau
      sh(18, 22);
      ctx.fillStyle = '#3A4350'; rr(-19, 12, 38, 10, 3); ctx.fill(); ctx.fillStyle = '#56616F'; ctx.fillRect(-19, 12, 38, 2);
      ctx.fillStyle = '#8C96A3'; ctx.fillRect(-14, -20, 2, 32); ctx.fillRect(-14, -20, 12, 2);
      const glow = 0.5 + 0.5 * Math.sin(t * 3);
      ctx.fillStyle = 'rgba(255,120,60,' + (0.35 + 0.3 * glow).toFixed(2) + ')'; ell(-6, 11, 8, 2.4); ctx.fill();
      flask(-6, 2, 8, '#4FD1C5', 0.55);
      ctx.strokeStyle = 'rgba(210,235,250,.7)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-6, -12); ctx.quadraticCurveTo(4, -18, 8, -8); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 0; k < 4; k++) { ctx.moveTo(4, -6 + k * 4); ctx.quadraticCurveTo(13, -4 + k * 4, 4, -2 + k * 4); } ctx.stroke();
      flask(10, 8, 4.5, '#8FD8FF', 0.4 + 0.1 * Math.sin(t));
      for (let k = 0; k < 3; k++) { const ph = (t * 0.9 + k / 3) % 1; ctx.fillStyle = 'rgba(255,255,255,' + (0.7 * (1 - ph)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(-8 + k * 3, 4 - ph * 6, 1, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(200,240,255,' + (0.2 + 0.1 * glow).toFixed(2) + ')'; for (let k = 0; k < 2; k++) { const y = -20 - ((t * 9 + k * 8) % 14); ctx.beginPath(); ctx.arc(-6 + Math.sin(t + k) * 2, y, 3 + k, 0, TAU); ctx.fill(); }
    } else if (id === 'casks') { // Gasflaschen
      sh(22, 16);
      const cyl = (x, col) => { ctx.fillStyle = col; rr(x - 5, -14, 10, 30, 4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fillRect(x - 3.5, -12, 2, 26); ctx.fillStyle = '#8C96A3'; ctx.fillRect(x - 2, -19, 4, 6); ctx.fillStyle = '#2B3039'; ctx.fillRect(x - 3.5, -20, 7, 2); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(x - 5, 2, 10, 2); };
      cyl(-12, '#3E7CC9'); cyl(0, '#5FA86A'); cyl(12, '#C9C2B4');
      ctx.strokeStyle = '#6B7380'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-18, -4); ctx.lineTo(18, -4); ctx.stroke();
    } else if (id === 'tap') { // Laborspuele
      sh(18, 14);
      ctx.fillStyle = '#4A5562'; ctx.fillRect(-18, -2, 36, 14); ctx.fillStyle = '#C9D2DC'; ctx.fillRect(-18, -5, 36, 4);
      ctx.fillStyle = '#7F8B98'; rr(-9, -4.5, 18, 3, 1.5); ctx.fill();
      ctx.fillStyle = '#AEB8C4'; ctx.fillRect(-1.2, -16, 2.4, 11); ctx.fillRect(-1.2, -16, 7, 2.4); ctx.fillRect(4.6, -16, 2.4, 4);
      ctx.fillStyle = '#E05555'; ctx.fillRect(-6, -11, 3, 2); ctx.fillStyle = '#4F9BFF'; ctx.fillRect(3, -11, 3, 2);
      const d = (t * 1.4) % 1; ctx.fillStyle = 'rgba(140,200,255,.8)'; ctx.fillRect(5.3, -12 + d * 8, 1, 2);
      ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.moveTo(-15, 2); ctx.lineTo(-10, 2); ctx.lineTo(-12.5, -2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#E8ECF2'; ctx.fillRect(11, 1, 5, 7); ctx.fillStyle = '#4FD1C5'; ctx.fillRect(11, 5, 5, 3);
    } else if (id === 'hopsack') { // Chemikalienfass (Fantasie)
      sh(12, 14);
      ctx.fillStyle = '#2F6FC4'; rr(-10, -10, 20, 24, 3); ctx.fill();
      ctx.fillStyle = '#4A8BE0'; ell(0, -10, 10, 3.2); ctx.fill(); ctx.fillStyle = '#1F4F94'; ctx.beginPath(); ctx.arc(4, -10, 1.6, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(-10, -2, 20, 1.5); ctx.fillRect(-10, 7, 20, 1.5);
      ctx.fillStyle = '#F4F4F8'; ctx.fillRect(-6, -1, 12, 7); ctx.fillStyle = '#2F6FC4'; ctx.font = '800 4.5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText('LAB', 0, 4.5);
    } else if (id === 'mugshelf') { // Kolbenregal
      sh(17, 16);
      ctx.fillStyle = '#3A4350'; ctx.fillRect(-18, -14, 36, 28); ctx.fillStyle = '#56616F'; ctx.fillRect(-16, -12, 32, 24);
      const cols = ['#4FD1C5', '#8FD8FF', '#B983FF', '#FFD24A', '#FF8FA3', '#5FE584', '#8FD8FF', '#4FD1C5'];
      for (let r = 0; r < 2; r++) { ctx.fillStyle = '#8C96A3'; ctx.fillRect(-16, -1 + r * 11, 32, 1.6); for (let k = 0; k < 4; k++) { const x = -12 + k * 8, y = -5 + r * 11, c = cols[r * 4 + k]; if ((r + k) % 2) flask(x, y, 3, c, 0.6); else { ctx.fillStyle = 'rgba(210,235,250,.35)'; ctx.fillRect(x - 1.6, y - 5, 3.2, 8); ctx.fillStyle = c; ctx.fillRect(x - 1.6, y - 1, 3.2, 4); } } }
    } else if (id === 'fermenter') { // Grossreaktor
      sh(12, 26);
      const g = ctx.createLinearGradient(-12, 0, 12, 0); g.addColorStop(0, '#8A939F'); g.addColorStop(.5, '#E8ECF2'); g.addColorStop(1, '#7C8591');
      ctx.fillStyle = '#5A6270'; ctx.fillRect(-10, 14, 3, 10); ctx.fillRect(7, 14, 3, 10);
      ctx.fillStyle = g; rr(-12, -22, 24, 38, 8); ctx.fill();
      const p = 0.5 + 0.5 * Math.sin(t * 2.2);
      ctx.fillStyle = '#1B1F26'; rr(-6, -12, 12, 16, 4); ctx.fill(); ctx.fillStyle = 'rgba(79,209,197,' + (0.55 + 0.35 * p).toFixed(2) + ')'; rr(-5, -6 + p * 2, 10, 9 - p * 2, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(-2, -2 + Math.sin(t * 5) * 2, 0.9, 0, TAU); ctx.arc(2, 0 - Math.sin(t * 4) * 2, 0.7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2B3039'; ctx.beginPath(); ctx.arc(0, 9, 3, 0, TAU); ctx.fill(); ctx.strokeStyle = '#FF5C7A'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 9); ctx.lineTo(Math.cos(t) * 2.4, 9 + Math.sin(t) * 2.4); ctx.stroke();
      ctx.fillStyle = '#AEB8C4'; ctx.fillRect(-2, -27, 4, 6);
    } else if (id === 'maltsacks') { // Kanister
      sh(17, 12);
      const can = (x, y, cap) => { ctx.fillStyle = '#E8ECF2'; rr(x - 7, y - 8, 14, 16, 3); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(x - 7, y + 2, 14, 2); ctx.fillStyle = cap; ctx.fillRect(x + 1, y - 11, 4, 3); ctx.strokeStyle = '#B5BDC7'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x - 5, y - 8); ctx.lineTo(x - 5, y - 11); ctx.lineTo(x - 1, y - 11); ctx.lineTo(x - 1, y - 8); ctx.stroke(); };
      can(-9, 4, '#E05555'); can(9, 5, '#4F9BFF'); can(0, -4, '#FFD24A');
    } else if (id === 'crates') { // Kisten mit Glaswaren
      sh(15, 16);
      for (let r = 0; r < 2; r++) { const y = 4 - r * 12; ctx.fillStyle = r ? '#5B6B7C' : '#4A5866'; ctx.fillRect(-14, y - 6, 28, 12); ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(-14, y - 6, 28, 2); ctx.fillStyle = '#F4F4F8'; ctx.fillRect(-4, y - 2, 8, 4); }
      for (let k = 0; k < 4; k++) { const x = -10 + k * 6.5; ctx.fillStyle = 'rgba(210,235,250,.45)'; ctx.fillRect(x - 1.2, -22, 2.4, 6); ctx.fillStyle = ['#4FD1C5', '#B983FF', '#8FD8FF', '#FFD24A'][k]; ctx.fillRect(x - 1.2, -19, 2.4, 3); }
    } else if (id === 'prostsign') { // Leuchtschild LABOR
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-20, -10, 42, 24);
      ctx.fillStyle = '#1B1F26'; rr(-22, -12, 44, 24, 5); ctx.fill();
      const on = Math.sin(t * 3) > -0.85;
      ctx.save(); if (on) { ctx.shadowColor = '#4FD1C5'; ctx.shadowBlur = 8; } ctx.fillStyle = on ? '#7FF0E4' : '#2E5A58'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('LABOR', 0, 1); ctx.restore();
      ctx.strokeStyle = on ? 'rgba(127,240,228,.6)' : 'rgba(46,90,88,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(-17, 0, 2.5, 0, TAU); ctx.arc(17, 0, 2.5, 0, TAU); ctx.stroke();
    } else if (id === 'bartable') { // Mikroskop-Tisch
      sh(13, 14);
      ctx.fillStyle = '#3B3F48'; ctx.fillRect(-1.5, 0, 3, 12); ctx.fillRect(-7, 11, 14, 3);
      ctx.fillStyle = '#AEB8C4'; ctx.beginPath(); ctx.arc(0, -2, 13, 0, TAU); ctx.fill(); ctx.fillStyle = '#C9D2DC'; ctx.beginPath(); ctx.arc(0, -3, 11.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2B3039'; ctx.fillRect(-6, 0, 10, 3); ctx.fillRect(-3, -13, 3, 14); ctx.save(); ctx.translate(-1, -13); ctx.rotate(-0.5); ctx.fillRect(-1.5, -6, 3.5, 8); ctx.restore();
      ctx.fillStyle = '#F4F4F8'; ctx.fillRect(-4, -3, 7, 1.6); ctx.fillStyle = '#B983FF'; ctx.fillRect(-1, -3, 1.6, 1.6);
      ctx.fillStyle = 'rgba(210,235,250,.5)'; ctx.fillRect(5, -9, 2.4, 7); ctx.fillStyle = '#5FE584'; ctx.fillRect(5, -5, 2.4, 3);
    } else return false;
    return true;
  }
  function drawDecorFor(ar, pass) {
    const arr = G.dec.items[ar.key];
    const dr = it => { // v60: Teppiche drehen flach, stehende Deko dreht sich weich zur Seite (Schrift bleibt lesbar)
      if (RUGS.includes(it.id)) { const a = rotAng(it, it.r || 0); if (!a) drawDecorItem(it.id, it.x, it.y, 1); else { rotBegin(it.x, it.y, a); drawDecorItem(it.id, it.x, it.y, 1); rotEnd(); } return; }
      const qa = rotAng(it, it.q || 0), m = (it.r || 0) % 2 ? -1 : 1; // v85: Drehung (q, weich animiert) und alte Spiegelung (r)
      if (!qa && m > 0.999) { drawDecorItem(it.id, it.x, it.y, 1); return; }
      rotBegin(it.x, it.y, qa, m > 0.999 ? undefined : m); drawDecorItem(it.id, it.x, it.y, 1); rotEnd();
    };
    if (pass === 0) { for (const it of arr) if (RUGS.includes(it.id)) dr(it); return; }
    arr.filter(it => !RUGS.includes(it.id)).sort((a, b) => a.y - b.y).forEach(dr);
  }
  // v75: weitere Deko zum Kaufen (Betten, Wohnen, Freizeit)
  function drawMoreDec(id, t) {
    const sh = (w, y) => { ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(0, y, w, 3.6); ctx.fill(); };
    const pillow = (x, y, w, h, c) => { ctx.fillStyle = c; rr(x, y, w, h, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(x + 2, y + 1.5, w - 4, 1.5); };
    const quilt = (x, y, w, h, c1, c2) => { ctx.fillStyle = c1; rr(x, y, w, h, 3); ctx.fill(); ctx.fillStyle = c2; for (let k = 0; k < 3; k++) ctx.fillRect(x + 2, y + 4 + k * (h - 6) / 3, w - 4, 2); ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(x, y, w, 3); };
    switch (id) {
      case 'bed': { sh(17, 27); ctx.fillStyle = '#6B4A2E'; rr(-16, -26, 32, 52, 4); ctx.fill(); ctx.fillStyle = '#8A6240'; ctx.fillRect(-16, -26, 32, 7); ctx.fillStyle = '#EEF2F7'; rr(-13, -18, 26, 41, 3); ctx.fill(); pillow(-10, -17, 20, 9, '#FFFFFF'); quilt(-14, -5, 28, 29, '#4B8DFF', '#3A6FCF'); return true; }
      case 'dbed': { sh(27, 29); ctx.fillStyle = '#4E3624'; rr(-26, -28, 52, 56, 5); ctx.fill(); ctx.fillStyle = '#6E4C30'; rr(-26, -28, 52, 9, 4); ctx.fill(); ctx.fillStyle = '#F4F1EA'; rr(-23, -19, 46, 44, 3); ctx.fill(); pillow(-20, -18, 18, 9, '#FFFFFF'); pillow(2, -18, 18, 9, '#FFFFFF'); quilt(-24, -6, 48, 31, '#C0496A', '#9C3554'); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-24, 14, 48, 3); for (const sx of [-31, 31]) { ctx.fillStyle = '#6E4C30'; ctx.fillRect(sx - 4, -24, 8, 9); ctx.fillStyle = '#FFE9A8'; ctx.beginPath(); ctx.arc(sx, -22, 2.4, 0, TAU); ctx.fill(); } return true; }
      case 'bunkbed': { sh(17, 27); ctx.fillStyle = '#B57A45'; ctx.fillRect(-17, -27, 4, 53); ctx.fillRect(13, -27, 4, 53); ctx.fillStyle = '#EEF2F7'; rr(-13, -24, 26, 46, 3); ctx.fill(); quilt(-13, -8, 26, 30, '#3FAE6A', '#2E8B4F'); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-15, -26, 30, 6); ctx.fillStyle = '#E8833A'; rr(-14, -27, 28, 22, 3); ctx.fill(); pillow(-9, -25, 18, 6, '#FFFFFF'); ctx.fillStyle = '#8A5A32'; for (let k = 0; k < 4; k++) ctx.fillRect(13, -20 + k * 10, 8, 2); ctx.fillRect(19, -22, 2, 40); return true; }
      case 'futon': { sh(22, 16); ctx.fillStyle = '#3A2A1C'; rr(-22, -15, 44, 30, 3); ctx.fill(); ctx.fillStyle = '#D9CFB8'; rr(-20, -13, 40, 26, 3); ctx.fill(); pillow(-17, -11, 12, 8, '#F4F1EA'); quilt(-4, -12, 22, 24, '#5A4A6E', '#7A6A9A'); return true; }
      case 'catbed': { sh(14, 12); ctx.fillStyle = '#B5473A'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.fill(); ctx.fillStyle = '#E8DCC0'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill(); const br = 1 + Math.sin(t * 2.2) * 0.05; ctx.save(); ctx.scale(br, br); ctx.fillStyle = '#E8963A'; ell(1, 1, 8, 6); ctx.fill(); ctx.beginPath(); ctx.arc(-5, -2, 4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-8, -5); ctx.lineTo(-7, -9); ctx.lineTo(-5, -5); ctx.moveTo(-4, -5); ctx.lineTo(-2, -8); ctx.lineTo(-2, -4); ctx.fill(); ctx.strokeStyle = '#B86E28'; ctx.lineWidth = 1; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-1 + k * 3, -4); ctx.lineTo(0 + k * 3, 3); ctx.stroke(); } ctx.restore(); ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '700 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('z', 6 + Math.sin(t) * 2, -10 - ((t * 6) % 6)); return true; }
      case 'bookstack': { sh(10, 9); [['#D33F3F', 18], ['#2F6FD6', 16], ['#3FAE6A', 19], ['#F2C14E', 15]].forEach(([c, w], k) => { ctx.fillStyle = c; ctx.fillRect(-w / 2 + (k % 2) * 1.5, 4 - k * 4, w, 4); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-w / 2 + 2 + (k % 2) * 1.5, 5 - k * 4, w - 4, 1); }); return true; }
      case 'plantwall': { sh(20, 18); ctx.fillStyle = '#5A3B26'; ctx.fillRect(-20, -18, 40, 34); for (let k = 0; k < 18; k++) { const px = -16 + (k % 6) * 6.4, py = -14 + Math.floor(k / 6) * 10; ctx.fillStyle = ['#2E8B4F', '#3FAE6A', '#6FBF5E'][k % 3]; ctx.beginPath(); ctx.arc(px + Math.sin(t + k) * 0.6, py, 4.2, 0, TAU); ctx.fill(); if (k % 5 === 0) { ctx.fillStyle = '#F28BB0'; ctx.beginPath(); ctx.arc(px + 1, py - 1, 1.6, 0, TAU); ctx.fill(); } } return true; }
      case 'hottub': { sh(30, 24); ctx.fillStyle = '#6B4A2E'; rr(-30, -22, 60, 46, 10); ctx.fill(); ctx.fillStyle = '#8A6240'; for (let k = -26; k < 28; k += 7) ctx.fillRect(k, -22, 2, 46); const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 26); g.addColorStop(0, '#9FE3FF'); g.addColorStop(1, '#3E9ACF'); ctx.fillStyle = g; rr(-24, -16, 48, 34, 8); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 9; k++) { const ph = (t * 0.8 + k * 0.37) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(-18 + (k * 13) % 36, 12 - ph * 24, 1.5 + ph * 1.5, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(230,240,255,.2)'; for (let k = 0; k < 3; k++) { const ph = (t * 0.3 + k / 3) % 1; ctx.beginPath(); ctx.arc(-10 + k * 10, -18 - ph * 16, 5 + ph * 5, 0, TAU); ctx.fill(); } return true; }
      case 'gamingpc': { sh(26, 16); ctx.fillStyle = '#20262E'; rr(-26, -10, 52, 24, 3); ctx.fill(); ctx.fillStyle = '#14161C'; ctx.fillRect(-20, -16, 18, 11); ctx.fillRect(2, -16, 18, 11); const hue = (t * 60) % 360; ctx.fillStyle = 'hsl(' + hue + ',90%,60%)'; ctx.fillRect(-19, -15, 16, 9); ctx.fillStyle = 'hsl(' + ((hue + 120) % 360) + ',90%,60%)'; ctx.fillRect(3, -15, 16, 9); ctx.fillStyle = '#3A3F47'; rr(-14, 0, 26, 7, 2); ctx.fill(); ctx.fillStyle = '#14161C'; rr(18, -6, 7, 18, 2); ctx.fill(); ctx.fillStyle = 'hsl(' + ((hue + 240) % 360) + ',90%,60%)'; ctx.fillRect(19, -4, 5, 2); ctx.fillRect(19, 8, 5, 2); return true; }
      case 'vending': { sh(14, 22); ctx.fillStyle = '#C93B3B'; rr(-14, -24, 28, 46, 3); ctx.fill(); ctx.fillStyle = '#20262E'; ctx.fillRect(-11, -20, 16, 30); for (let k = 0; k < 12; k++) { ctx.fillStyle = ['#F2C14E', '#3FAE6A', '#4B8DFF', '#F4F4F8'][k % 4]; ctx.fillRect(-10 + (k % 3) * 5, -18 + Math.floor(k / 3) * 7, 3, 5); } ctx.fillStyle = 'rgba(160,220,255,' + (0.18 + 0.08 * Math.sin(t * 3)).toFixed(2) + ')'; ctx.fillRect(-11, -20, 16, 30); ctx.fillStyle = '#E8E8EE'; ctx.fillRect(7, -14, 5, 8); ctx.fillStyle = '#14161C'; ctx.fillRect(-11, 13, 16, 5); return true; }
      case 'fishbowl': { sh(9, 9); ctx.fillStyle = 'rgba(160,220,255,.45)'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1; ctx.stroke(); const fx = Math.sin(t * 1.2) * 4; ctx.fillStyle = '#F28B30'; ell(fx, 1, 3, 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(fx - (Math.cos(t * 1.2) > 0 ? 3 : -3), 1); ctx.lineTo(fx - (Math.cos(t * 1.2) > 0 ? 6 : -6), -1); ctx.lineTo(fx - (Math.cos(t * 1.2) > 0 ? 6 : -6), 3); ctx.fill(); ctx.fillStyle = '#3FAE6A'; ctx.fillRect(-4, 4, 1.5, 4); return true; }
      case 'pingpong': { sh(32, 18); ctx.fillStyle = '#2E5E9A'; rr(-32, -17, 64, 34, 2); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-32, -1, 64, 1.5); ctx.fillRect(-1, -17, 2, 34); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.5; ctx.strokeRect(-31, -16, 62, 32); const bx = Math.sin(t * 3) * 24, by = Math.cos(t * 4.1) * 8; ctx.fillStyle = '#F4F4F8'; ctx.beginPath(); ctx.arc(bx, by, 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#D33F3F'; ctx.beginPath(); ctx.arc(-26, 8, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#20262E'; ctx.beginPath(); ctx.arc(26, -8, 4, 0, TAU); ctx.fill(); return true; }
      case 'clock': { sh(10, 24); ctx.fillStyle = '#5A3524'; rr(-10, -26, 20, 50, 4); ctx.fill(); ctx.fillStyle = '#EDE6D6'; ctx.beginPath(); ctx.arc(0, -16, 7, 0, TAU); ctx.fill(); ctx.strokeStyle = '#20150F'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(Math.cos(t * 0.5) * 5, -16 + Math.sin(t * 0.5) * 5); ctx.moveTo(0, -16); ctx.lineTo(Math.cos(t * 0.04) * 3.5, -16 + Math.sin(t * 0.04) * 3.5); ctx.stroke(); ctx.fillStyle = '#20150F'; ctx.fillRect(-6, -6, 12, 26); const sw = Math.sin(t * 3.1) * 0.35; ctx.save(); ctx.translate(0, -5); ctx.rotate(sw); ctx.fillStyle = '#E8B84A'; ctx.fillRect(-0.7, 0, 1.4, 16); ctx.beginPath(); ctx.arc(0, 17, 3, 0, TAU); ctx.fill(); ctx.restore(); return true; }
      case 'fairy': { const n = 9; ctx.strokeStyle = '#3A3F47'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-30, -4); ctx.quadraticCurveTo(0, 8, 30, -4); ctx.stroke(); for (let k = 0; k < n; k++) { const u = k / (n - 1), x = -30 + 60 * u, y = -4 + 12 * 2 * u * (1 - u) * 1.0; const on = (Math.floor(t * 3) + k) % 3; ctx.fillStyle = ['#FFD84B', '#FF8FD0', '#5CB8FF'][k % 3]; ctx.globalAlpha = on ? 1 : 0.4; ctx.beginPath(); ctx.arc(x, y + 2, 2.4, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; return true; }
      case 'statue': { sh(12, 20); ctx.fillStyle = '#5E6670'; ctx.fillRect(-11, 10, 22, 10); ctx.fillStyle = '#8C96A3'; ctx.fillRect(-11, 10, 22, 2); const g = ctx.createLinearGradient(-8, 0, 8, 0); g.addColorStop(0, '#B8892A'); g.addColorStop(0.5, '#FFE08A'); g.addColorStop(1, '#B8892A'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-6, 10); ctx.quadraticCurveTo(-10, -6, 0, -14); ctx.quadraticCurveTo(10, -6, 6, 10); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.arc(0, -17, 5, 0, TAU); ctx.fill(); const sp = (t * 0.7) % 1; ctx.fillStyle = 'rgba(255,255,255,' + (0.8 * (1 - sp)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(-3 + sp * 6, -12 + sp * 14, 1.3, 0, TAU); ctx.fill(); return true; }
      case 'bbq': { sh(16, 16); ctx.fillStyle = '#3A3F47'; ctx.fillRect(-10, 6, 2, 10); ctx.fillRect(8, 6, 2, 10); ctx.fillStyle = '#20262E'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill(); ctx.fillStyle = '#8C96A3'; for (let k = -9; k <= 9; k += 4) ctx.fillRect(k, -9, 1.2, 18); const gl = 0.6 + 0.4 * Math.sin(t * 7); ctx.fillStyle = 'rgba(255,120,40,' + (0.5 * gl).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#8A4B2E'; ell(-4, -2, 4, 2); ctx.fill(); ell(4, 3, 4, 2); ctx.fill(); ctx.fillStyle = 'rgba(200,205,215,.3)'; for (let k = 0; k < 3; k++) { const ph = (t * 0.4 + k / 3) % 1; ctx.beginPath(); ctx.arc(Math.sin(t + k) * 3, -10 - ph * 20, 3 + ph * 5, 0, TAU); ctx.fill(); } return true; }
      case 'safe': { sh(14, 16); ctx.fillStyle = '#4E5762'; rr(-14, -16, 28, 32, 3); ctx.fill(); ctx.fillStyle = '#6E7B8A'; rr(-11, -13, 22, 26, 2); ctx.fill(); ctx.fillStyle = '#20262E'; ctx.beginPath(); ctx.arc(0, -2, 6, 0, TAU); ctx.fill(); ctx.strokeStyle = '#C9D2DC'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(Math.cos(t) * 5, -2 + Math.sin(t) * 5); ctx.stroke(); ctx.fillStyle = '#E8B84A'; ctx.fillRect(6, 6, 4, 2); return true; }
      case 'miniramp': { sh(30, 16); const g = ctx.createLinearGradient(-30, 0, 30, 0); g.addColorStop(0, '#9AA3AD'); g.addColorStop(0.3, '#D9DEE5'); g.addColorStop(0.7, '#D9DEE5'); g.addColorStop(1, '#9AA3AD'); ctx.fillStyle = g; ctx.fillRect(-30, -14, 60, 28); ctx.fillStyle = '#E8B84A'; ctx.fillRect(-30, -14, 3, 28); ctx.fillRect(27, -14, 3, 28); const sx = Math.sin(t * 1.6) * 20; ctx.fillStyle = '#3A2A20'; rr(sx - 7, -2.5, 14, 5, 2); ctx.fill(); ctx.fillStyle = '#F4F4F8'; ctx.fillRect(sx - 5, -4, 2, 1.5); ctx.fillRect(sx + 3, -4, 2, 1.5); ctx.fillRect(sx - 5, 2.5, 2, 1.5); ctx.fillRect(sx + 3, 2.5, 2, 1.5); return true; }
      case 'graffcanvas': { sh(22, 10); ctx.fillStyle = '#5A3B26'; ctx.fillRect(-20, 6, 3, 6); ctx.fillRect(17, 6, 3, 6); ctx.fillStyle = '#EDE6D6'; ctx.fillRect(-22, -14, 44, 22); ctx.fillStyle = '#B36BFF'; ell(-6, -4, 12, 6); ctx.fill(); ctx.font = '900 italic 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = '#14161C'; ctx.strokeText('KG', 0, -3); ctx.fillStyle = '#63FF9A'; ctx.fillText('KG', 0, -3); ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#FF5CA8'; ctx.fillRect(10, -2, 2, 6); return true; }
      case 'robot': { const a = t * 0.6, x = Math.cos(a) * 6, y = Math.sin(a) * 4; ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(x, y + 3, 9, 3); ctx.fill(); ctx.fillStyle = '#2B3039'; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#6E7B8A'; ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill(); ctx.fillStyle = Math.floor(t * 2) % 2 ? '#63FF9A' : '#2E8B4F'; ctx.beginPath(); ctx.arc(x + Math.cos(a + 1.57) * 4, y + Math.sin(a + 1.57) * 4, 1.4, 0, TAU); ctx.fill(); return true; }
    }
    return false;
  }
  // v86: neue Dekoration
  function drawDec107(id, t) { // v107: ueberarbeitete aeltere Deko
    const sh = (w, y) => { ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(0, y, w, 3.6); ctx.fill(); }, F = c => { ctx.fillStyle = c; };
    switch (id) {
      case 'robot': { const a = t * .9, ox = Math.cos(a) * 3, oy = Math.sin(a) * 1.5; ctx.translate(ox, oy); sh(15, 6); F('#2A2F37'); ell(0, 1.5, 15, 11); ctx.fill(); const g = ctx.createRadialGradient(-4, -4, 2, 0, 0, 15); g.addColorStop(0, '#5A6474'); g.addColorStop(1, '#3A424D'); F(g); ell(0, 0, 14.5, 10.5); ctx.fill(); F('#20262E'); ell(0, 0, 9, 6.4); ctx.fill(); F('#4A5260'); ell(0, -.6, 8, 5.6); ctx.fill(); F(Math.sin(t * 4) > 0 ? '#5FE584' : '#2E7D3E'); ctx.beginPath(); ctx.arc(0, -2, 1.4, 0, TAU); ctx.fill(); F('#8C96A3'); ctx.fillRect(-12, -1, 3, 2); ctx.save(); ctx.translate(11, 6); ctx.rotate(t * 12); F('#B4BCC8'); for (let k = 0; k < 3; k++) { ctx.rotate(TAU / 3); ctx.fillRect(0, -.5, 5, 1); } ctx.restore(); F('rgba(255,255,255,.18)'); ell(-5, -5, 5, 2); ctx.fill(); return true; }
      case 'miniramp': { sh(30, 13); F('#6B4A2E'); ctx.fillRect(-30, 6, 60, 6); const g = ctx.createLinearGradient(0, -14, 0, 8); g.addColorStop(0, '#B07A4A'); g.addColorStop(1, '#D9A066'); F(g); ctx.beginPath(); ctx.moveTo(-30, -14); ctx.quadraticCurveTo(-24, 6, 0, 6); ctx.quadraticCurveTo(24, 6, 30, -14); ctx.lineTo(30, 6); ctx.lineTo(-30, 6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#B4BCC8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-31, -14); ctx.lineTo(-27, -14); ctx.moveTo(27, -14); ctx.lineTo(31, -14); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1; for (let k = -24; k <= 24; k += 8) { ctx.beginPath(); ctx.moveTo(k, -8); ctx.lineTo(k, 6); ctx.stroke(); } const ph = Math.sin(t * 1.8), bx = ph * 22, by = 4 - Math.pow(Math.abs(ph), 2.2) * 15; ctx.save(); ctx.translate(bx, by); ctx.rotate(-ph * .9); F('#20262E'); rr(-6, -1.6, 12, 3.2, 1.6); ctx.fill(); F('#FF5CA8'); rr(-5.6, -1.4, 11.2, 2.4, 1.2); ctx.fill(); F('#E9E2D0'); ctx.fillRect(-4.6, 1.2, 1.6, 1.4); ctx.fillRect(3, 1.2, 1.6, 1.4); ctx.restore(); return true; }
      case 'safe': { sh(14, 15); F('#2A2F37'); rr(-14, -16, 28, 30, 3); ctx.fill(); const g = ctx.createLinearGradient(-14, 0, 14, 0); g.addColorStop(0, '#5A6474'); g.addColorStop(1, '#3E4652'); F(g); rr(-12.5, -14.5, 25, 27, 2.5); ctx.fill(); F('#2A2F37'); rr(-10, -12, 20, 22, 2); ctx.fill(); F('#4A5260'); rr(-9, -11, 18, 20, 2); ctx.fill(); ctx.save(); ctx.translate(-1, -1); F('#20262E'); ctx.beginPath(); ctx.arc(0, 0, 5.4, 0, TAU); ctx.fill(); F('#B4BCC8'); ctx.beginPath(); ctx.arc(0, 0, 4.4, 0, TAU); ctx.fill(); ctx.rotate(t * 1.5); F('#20262E'); for (let k = 0; k < 8; k++) { ctx.rotate(TAU / 8); ctx.fillRect(-.3, -4.2, .6, 1.2); } ctx.fillRect(-.6, -3.4, 1.2, 3.4); ctx.restore(); F('#C9A13A'); ctx.fillRect(6, -6, 2, 9); F(Math.sin(t * 3) > .6 ? '#5FE584' : '#3A4350'); ctx.fillRect(5, -10, 3, 2); F('rgba(255,255,255,.12)'); ctx.fillRect(-12.5, -14.5, 25, 2); F('#20262E'); ctx.fillRect(-12, 13, 4, 2); ctx.fillRect(8, 13, 4, 2); return true; }
      case 'statue': { sh(12, 19); F('#5A6474'); rr(-11, 8, 22, 11, 2); ctx.fill(); F('#7A8494'); ctx.fillRect(-11, 8, 22, 2.5); F('#C9A13A'); ctx.fillRect(-6, 13, 12, 2); const g = ctx.createLinearGradient(-9, 0, 9, 0); g.addColorStop(0, '#B8891E'); g.addColorStop(.45, '#FFE27A'); g.addColorStop(1, '#B8891E'); F(g); ctx.beginPath(); ctx.moveTo(-9, 8); ctx.quadraticCurveTo(-9, -1, 0, -2); ctx.quadraticCurveTo(9, -1, 9, 8); ctx.closePath(); ctx.fill(); ctx.fillRect(-2, -5, 4, 4); ctx.beginPath(); ctx.arc(0, -9.5, 5, 0, TAU); ctx.fill(); F('#8A6A12'); ctx.fillRect(-2, -10, 1, 1); ctx.fillRect(1, -10, 1, 1); ctx.strokeStyle = '#5FB86A'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -9.5, 5.6, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); F('#5FB86A'); for (let k = 0; k < 5; k++) { const a = Math.PI * (1.1 + k * .2); ell(Math.cos(a) * 5.8, -9.5 + Math.sin(a) * 5.8, 1.4, .8, a); ctx.fill(); } const sp = (t * .7) % 1; ctx.globalAlpha = Math.sin(sp * Math.PI); F('#FFFFFF'); const sx = -5 + sp * 10, sy = -12 + sp * 16; ctx.fillRect(sx - .4, sy - 2.2, .8, 4.4); ctx.fillRect(sx - 2.2, sy - .4, 4.4, .8); ctx.globalAlpha = 1; return true; }
      case 'beanbag': { sh(19, 14); const g = ctx.createRadialGradient(-5, -6, 2, 0, 0, 22); g.addColorStop(0, '#F08A6A'); g.addColorStop(1, '#B4482E'); F(g); ctx.beginPath(); ctx.moveTo(-18, 10); ctx.quadraticCurveTo(-21, -8, -6, -15); ctx.quadraticCurveTo(8, -18, 16, -6); ctx.quadraticCurveTo(21, 6, 15, 12); ctx.quadraticCurveTo(0, 16, -18, 10); ctx.fill(); F('rgba(0,0,0,.18)'); ell(1, 1, 10, 6); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-12, -9); ctx.quadraticCurveTo(-2, -2, 2, 12); ctx.moveTo(8, -12); ctx.quadraticCurveTo(4, -2, 12, 10); ctx.stroke(); F('rgba(255,255,255,.25)'); ell(-8, -9, 4, 2); ctx.fill(); return true; }
      case 'fishbowl': { sh(10, 8); F('#6B4A2E'); rr(-9, 5, 18, 4, 1.5); ctx.fill(); const g = ctx.createRadialGradient(-2, -3, 1, 0, 0, 10); g.addColorStop(0, 'rgba(190,235,255,.85)'); g.addColorStop(1, 'rgba(90,180,230,.75)'); F(g); ctx.beginPath(); ctx.arc(0, -1, 9, 0, TAU); ctx.fill(); F('#E8D6A0'); ell(0, 6, 6, 1.6); ctx.fill(); F('#3E9A4E'); ctx.fillRect(-4, 0, 1.2, 6); ctx.fillRect(3, 2, 1, 4); const a = t * 1.3, fx = Math.cos(a) * 4, fd = -Math.sin(a) > 0 ? 1 : -1; ctx.save(); ctx.translate(fx, -1 + Math.sin(t * 2) * .8); ctx.scale(fd, 1); F('#FF8A3A'); ell(0, 0, 2.6, 1.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(-2.2, 0); ctx.lineTo(-4.2, -1.4); ctx.lineTo(-4.2, 1.4); ctx.closePath(); ctx.fill(); F('#14161C'); ctx.fillRect(1.2, -.5, .6, .6); ctx.restore(); F('rgba(255,255,255,.55)'); ell(-4, -5, 2, 1); ctx.fill(); ctx.strokeStyle = 'rgba(220,245,255,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ell(0, -9.4, 5, 1.2); ctx.stroke(); return true; }
      case 'fairy': { ctx.strokeStyle = '#2E4A2E'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-30, -4); for (let k = -30; k <= 30; k += 10) ctx.quadraticCurveTo(k + 5, 3, k + 10, -4); ctx.stroke(); const C = ['#FFD24A', '#FF5CA8', '#4BC8FF', '#5FE584', '#FF8A3A', '#B58CFF']; for (let k = 0; k < 13; k++) { const x = -30 + k * 5, y = -4 + Math.sin(((x + 30) % 10) / 10 * Math.PI) * 3.4 + 1, on = true, br = .55 + .45 * Math.sin(t * 3 + k * 1.3), c = C[k % C.length]; ctx.globalAlpha = br; if (on) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y + 1, 0, x, y + 1, 7); g.addColorStop(0, c + '99'); g.addColorStop(1, c + '00'); F(g); ctx.beginPath(); ctx.arc(x, y + 1, 7, 0, TAU); ctx.fill(); ctx.restore(); } ctx.globalAlpha = 1; F(c); ell(x, y + 1.6, 1.6, 2.2); ctx.fill(); F('#2E4A2E'); ctx.fillRect(x - .8, y - .8, 1.6, 1.2); } return true; }
      case 'prostsign': { F('#14161C'); rr(-23, -12, 46, 22, 5); ctx.fill(); ctx.strokeStyle = '#2A2F37'; ctx.lineWidth = 2; rr(-23, -12, 46, 22, 5); ctx.stroke(); const pu = .7 + .3 * Math.sin(t * 2.6), fl = Math.sin(t * 17) > .93 ? .4 : 1; ctx.save(); ctx.globalAlpha = fl; ctx.shadowColor = '#4FD1C5'; ctx.shadowBlur = 8 * pu; ctx.fillStyle = '#9FF5EC'; ctx.font = '900 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('LABOR', 0, -1); ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(79,209,197,' + (.6 * pu).toFixed(2) + ')'; ctx.lineWidth = 1; rr(-19.5, -8.5, 39, 15, 3); ctx.stroke(); ctx.restore(); F('#2A2F37'); ctx.fillRect(-14, 10, 2, 3); ctx.fillRect(12, 10, 2, 3); return true; }
      case 'watercan': { sh(12, 8); const g = ctx.createLinearGradient(0, -8, 0, 8); g.addColorStop(0, '#6BCB7E'); g.addColorStop(1, '#3E9A4E'); F(g); rr(-8, -6, 14, 13, 3); ctx.fill(); ctx.strokeStyle = '#2E7D3E'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(-1, -6, 5, Math.PI, 0); ctx.stroke(); F('#3E9A4E'); ctx.beginPath(); ctx.moveTo(5, 2); ctx.lineTo(12, -5); ctx.lineTo(13, -3.6); ctx.lineTo(6, 4); ctx.closePath(); ctx.fill(); F('#2E7D3E'); rr(11, -7, 3.4, 3.4, 1); ctx.fill(); F('rgba(255,255,255,.3)'); ctx.fillRect(-6.5, -4, 2, 9); if (Math.sin(t * 1.6) > .5) { F('rgba(140,210,255,.8)'); for (let k = 0; k < 3; k++) { const ph = (t * 2 + k / 3) % 1; ctx.fillRect(13 + ph * 2, -3 + ph * 8, 1, 1.4); } } return true; }
      case 'maltsacks': { sh(18, 11); const sack = (x, y, c, c2) => { F(c); ctx.beginPath(); ctx.moveTo(x - 7, y + 7); ctx.quadraticCurveTo(x - 9, y - 4, x - 4, y - 7); ctx.lineTo(x + 4, y - 7); ctx.quadraticCurveTo(x + 9, y - 4, x + 7, y + 7); ctx.closePath(); ctx.fill(); F(c2); ctx.fillRect(x - 4, y - 8.4, 8, 2); F('rgba(0,0,0,.12)'); ctx.fillRect(x - 6, y + 3, 12, 1); F('#E05555'); ctx.fillRect(x - 3, y - 2, 6, 3.6); F('#F4F4F8'); ctx.fillRect(x - 2, y - 1, 4, 1.4); }; sack(-8, 3, '#E9E2D0', '#B5A474'); sack(8, 3, '#DDD3BC', '#A8956A'); sack(0, -5, '#F2ECDD', '#B5A474'); return true; }
    }
    return false;
  }
  function drawDec112(id, t) { // v112: exklusive Deko
    const sh = (w, y) => { ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(0, y, w, 3.6); ctx.fill(); }, F = c => { ctx.fillStyle = c; };
    switch (id) {
      case 'masterpiece': { // Staffelei mit Gemaelde im Goldrahmen
        sh(16, 17); F('#6B4A2E'); ctx.fillRect(-12, -2, 2, 19); ctx.fillRect(10, -2, 2, 19); ctx.fillRect(-1, 2, 2, 15); F('#8A6040'); ctx.fillRect(-14, 6, 28, 2);
        F('#B8862A'); rr(-20, -18, 40, 26, 2); ctx.fill(); F('#F2C14E'); rr(-19, -17, 38, 24, 1.5); ctx.fill(); F('#8A6420'); ctx.fillRect(-16, -14, 32, 18);
        const g = ctx.createLinearGradient(0, -14, 0, 4); g.addColorStop(0, '#F6B470'); g.addColorStop(.55, '#E77A5A'); g.addColorStop(1, '#3A5A8A'); F(g); ctx.fillRect(-15, -13, 30, 16);
        F('#FFE9A0'); ctx.beginPath(); ctx.arc(6, -6, 3.2, 0, TAU); ctx.fill(); F('#2B3D5E'); ctx.beginPath(); ctx.moveTo(-15, 3); ctx.lineTo(-7, -5); ctx.lineTo(-1, 0); ctx.lineTo(5, -3); ctx.lineTo(15, 3); ctx.closePath(); ctx.fill();
        F('#1E2A40'); ctx.fillRect(-15, 1, 30, 2); F('rgba(255,255,255,.18)'); ctx.fillRect(-15, -13, 30, 1.5);
        for (const [x, y] of [[-19, -17], [17, -17], [-19, 5], [17, 5]]) { F('#FFE89A'); ctx.fillRect(x, y, 2, 2); }
        if (Math.sin(t * 2) > .9) { F('#FFFFFF'); ctx.fillRect(14, -15, 1, 1); }
        return true;
      }
      case 'citykey': { // Sockel mit Glashaube, Samtkissen und goldenem Schluessel
        sh(13, 13); F('#3A2A22'); rr(-12, 4, 24, 9, 2); ctx.fill(); F('#5A4232'); ctx.fillRect(-12, 4, 24, 2); F('#F2C14E'); ctx.fillRect(-4, 8, 8, 2);
        F('#8E2440'); rr(-9, -1, 18, 6, 3); ctx.fill(); F('#B8355A'); rr(-8, -1, 16, 3, 2); ctx.fill();
        ctx.save(); ctx.translate(0, -2); ctx.rotate(-.25); F('#E8B93A'); ctx.beginPath(); ctx.arc(-6, 0, 3, 0, TAU); ctx.fill(); F('#8E2440'); ctx.beginPath(); ctx.arc(-6, 0, 1.3, 0, TAU); ctx.fill(); F('#E8B93A'); ctx.fillRect(-3, -.8, 11, 1.6); ctx.fillRect(5, .8, 1.4, 2.2); ctx.fillRect(7, .8, 1.2, 1.6); F('#FFF0A8'); ctx.fillRect(-3, -.8, 11, .5); ctx.restore();
        F('rgba(200,230,255,.18)'); ctx.beginPath(); ctx.moveTo(-10, 4); ctx.lineTo(-10, -9); ctx.quadraticCurveTo(0, -17, 10, -9); ctx.lineTo(10, 4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(220,240,255,.5)'; ctx.lineWidth = .8; ctx.stroke();
        F('rgba(255,255,255,.45)'); ctx.fillRect(-8, -9, 1.2, 9); if (Math.sin(t * 2.4) > .85) { F('#FFFFFF'); ctx.fillRect(3, -4, 1, 1); }
        return true;
      }
      case 'prtrophy': { // Pokal mit violettem Stern, zeigt die Prestige-Stufe
        sh(10, 14); F('#2B2F3A'); rr(-8, 8, 16, 6, 1.5); ctx.fill(); F('#C9A13A'); ctx.fillRect(-5, 9.5, 10, 2);
        F('#B9C2D6'); ctx.fillRect(-1.5, 2, 3, 6); rr(-5, 6, 10, 2.5, 1); ctx.fill();
        F('#D4DAE8'); ctx.beginPath(); ctx.moveTo(-8, -12); ctx.lineTo(8, -12); ctx.quadraticCurveTo(8, 2, 0, 3); ctx.quadraticCurveTo(-8, 2, -8, -12); ctx.fill();
        ctx.strokeStyle = '#B9C2D6'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(-8, -7, 3.2, Math.PI * .5, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.arc(8, -7, 3.2, -Math.PI * .5, Math.PI * .5); ctx.stroke();
        F('rgba(255,255,255,.5)'); ctx.fillRect(-6, -11, 1.4, 8);
        const gl = .8 + .2 * Math.sin(t * 3); ctx.globalAlpha = gl; F('#8A4DFF'); starPath(0, -5.5, 4.2, 1.8); ctx.fill(); F('#D9B8FF'); starPath(0, -5.5, 2, .9); ctx.fill(); ctx.globalAlpha = 1;
        return true;
      }
    }
    return false;
  }
  // ---------- v132: Chill-Zone: Deko zum Abhängen mit der Gang ----------
  function drawDec132(id, t) {
    const F = c => { ctx.fillStyle = c; }, C = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }, sh = (w, y) => { F('rgba(0,0,0,.24)'); ell(0, y, w, 3.8); ctx.fill(); }, nt = typeof lightK === 'function' ? lightK() : 0;
    const glow = (x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + Math.max(0, a).toFixed(2) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); F(g); C(x, y, r); };
    const cush = (x, y, w, h, c, c2) => { F(c); rr(x, y, w, h, 3); ctx.fill(); F(c2); ctx.fillRect(x + 2, y + 1, w - 4, 1.4); };
    switch (id) {
      case 'discoball': { // v139: neu gezeichnet: Spiegelkugel mit drehenden Facetten, Glanzblitzen, Lichtstrahlen und wandernden Lichtpunkten
        const ang = t * 0.9, night = 0.35 + 0.65 * nt, R = 12.5, cy = -4, cols = ['255,92,168', '75,200,255', '255,210,74', '95,229,132', '181,140,255', '255,138,58'];
        // Lichtpunkte auf dem Boden, die im Kreis wandern
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 10; k++) { const a = -ang * 1.3 + k * TAU / 10, rr2 = 18 + (k % 3) * 7, sx = Math.cos(a) * rr2, sy = 24 + Math.sin(a) * rr2 * 0.38, al = (0.22 + 0.25 * night) * (0.6 + 0.4 * Math.sin(t * 5 + k * 1.7));
          if (night > 0.45) { const gb = ctx.createLinearGradient(0, cy, sx, sy); gb.addColorStop(0, 'rgba(' + cols[k % 6] + ',' + (al * 0.55).toFixed(3) + ')'); gb.addColorStop(1, 'rgba(' + cols[k % 6] + ',0)'); F(gb); ctx.beginPath(); ctx.moveTo(-1.2, cy); ctx.lineTo(sx - 2.6, sy); ctx.lineTo(sx + 2.6, sy); ctx.lineTo(1.2, cy); ctx.fill(); }
          F('rgba(' + cols[k % 6] + ',' + al.toFixed(3) + ')'); ell(sx, sy, 3.4, 1.4); ctx.fill(); F('rgba(255,255,255,' + (al * 0.8).toFixed(3) + ')'); ell(sx, sy, 1.2, 0.5); ctx.fill(); }
        glow(0, cy, 30, '200,220,255', 0.12 + 0.22 * night); ctx.restore();
        F('rgba(0,0,0,.22)'); ell(0, 25, 9, 2.6); ctx.fill();
        // Aufhängung: Deckenplatte, Kette, Motor
        F('#3A3F47'); rr(-5, -36, 10, 3, 1.5); ctx.fill(); ctx.strokeStyle = '#9AA3AD'; ctx.lineWidth = 0.9; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(0, -31.5 + k * 2.6, 0.9, 1.4, 0, 0, TAU); ctx.stroke(); }
        F('#5A626E'); rr(-2.4, -22 + 2.6, 4.8, 3.6, 1); ctx.fill(); F('#C9D2DC'); ctx.fillRect(-0.6, cy - R - 1.6, 1.2, 2.2);
        // Kugel: Grundton und Facetten auf Breitenringen, die sich mitdrehen
        const g = ctx.createRadialGradient(-4, cy - 5, 1, 0, cy, R); g.addColorStop(0, '#E9EEF4'); g.addColorStop(0.55, '#9AA6B6'); g.addColorStop(1, '#4A5464'); F(g); C(0, cy, R);
        ctx.save(); ctx.beginPath(); ctx.arc(0, cy, R, 0, TAU); ctx.clip();
        const rows = 8;
        for (let i = 0; i < rows; i++) { const la0 = -Math.PI / 2 + (i + 0.5) * Math.PI / rows, cl = Math.cos(la0), y = cy + R * Math.sin(la0), n = Math.max(4, Math.round(16 * cl)), fh = R * Math.PI / rows * 0.82;
          for (let j = 0; j < n; j++) { const lo = (j / n) * TAU + ang + i * 0.37, cz = Math.cos(lo); if (cz <= 0.05) continue; const x = R * cl * Math.sin(lo), fw = Math.max(0.5, (TAU * R * cl / n) * cz * 0.8);
            const hsh = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453, hv = hsh - Math.floor(hsh), lit = cz * (0.45 + 0.55 * (0.5 - 0.5 * Math.sin(la0))) + (hv - 0.5) * 0.25, tw = Math.sin(t * 6 + hv * 30) > 0.92;
            const v = Math.round(clamp(110 + 140 * lit, 70, 250)); F(tw ? '#FFFFFF' : 'rgb(' + (v - 8) + ',' + v + ',' + Math.min(255, v + 14) + ')'); ctx.fillRect(x - fw / 2, y - fh / 2, fw, fh);
            if (!tw && hv > 0.86) { F('rgba(' + cols[(i + j) % 6] + ',.45)'); ctx.fillRect(x - fw / 2, y - fh / 2, fw, fh); } } }
        ctx.strokeStyle = 'rgba(30,36,46,.35)'; ctx.lineWidth = 0.35; for (let i = 1; i < rows; i++) { const y = cy + R * Math.sin(-Math.PI / 2 + i * Math.PI / rows); ctx.beginPath(); ctx.moveTo(-R, y); ctx.lineTo(R, y); ctx.stroke(); }
        const sh = ctx.createRadialGradient(4, cy + 5, 2, 0, cy, R + 1); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(0.7, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(10,14,22,.45)'); F(sh); ctx.fillRect(-R, cy - R, R * 2, R * 2);
        ctx.restore();
        F('rgba(255,255,255,.55)'); ell(-4.5, cy - 5.5, 3.2, 2, -0.6); ctx.fill();
        ctx.strokeStyle = 'rgba(40,46,56,.6)'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.arc(0, cy, R, 0, TAU); ctx.stroke();
        // Glanzblitze
        for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k * 0.33) % 1; if (ph > 0.25) continue; const a = k * 2.3 + Math.floor(t * 0.8 + k * 0.33) * 1.7, rx = Math.cos(a) * R * 0.6, ry = cy + Math.sin(a) * R * 0.6, s = Math.sin(ph / 0.25 * Math.PI) * 5;
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(rx - s, ry); ctx.lineTo(rx + s, ry); ctx.moveTo(rx, ry - s); ctx.lineTo(rx, ry + s); ctx.stroke(); glow(rx, ry, s * 1.4, '255,255,255', 0.6); ctx.restore(); }
        return true; }
      case 'lounge': { sh(34, 21); F('#2B2F38'); rr(-34, -18, 68, 12, 5); ctx.fill(); rr(-34, -18, 14, 38, 5); ctx.fill(); F('#3E4350'); rr(-31, -14, 62, 14, 4); ctx.fill(); rr(-31, -14, 14, 32, 4); ctx.fill();
        cush(-29, -4, 20, 9, '#4A5060', 'rgba(255,255,255,.12)'); cush(-8, -4, 18, 9, '#4A5060', 'rgba(255,255,255,.12)'); cush(11, -4, 18, 9, '#4A5060', 'rgba(255,255,255,.12)'); cush(-29, 6, 11, 10, '#4A5060', 'rgba(255,255,255,.12)');
        cush(-27, -12, 9, 7, '#FF5CA8', 'rgba(255,255,255,.3)'); cush(18, -12, 9, 7, '#4BC8FF', 'rgba(255,255,255,.3)'); cush(-6, -12, 8, 6, '#FFD24A', 'rgba(255,255,255,.3)');
        F('#6B4A2E'); rr(-4, 8, 26, 10, 2); ctx.fill(); F('#8A5E3A'); ctx.fillRect(-4, 8, 26, 2.4); F('#E9ECEF'); ctx.fillRect(2, 10, 3, 4); F('#C23B3B'); ctx.fillRect(12, 10, 3, 4); F('#F2C14E'); ell(8, 12, 3, 1.4); ctx.fill();
        F('rgba(255,255,255,.5)'); for (let k = 0; k < 2; k++) { const p = (t * 0.6 + k * 0.5) % 1; ctx.globalAlpha = 1 - p; C(3.5 + Math.sin(t * 2 + k) * 1.2, 8 - p * 9, 0.8 + p); } ctx.globalAlpha = 1; return true; }
      case 'firepit': { const fl = 0.75 + 0.25 * Math.sin(t * 9) * Math.sin(t * 5.7); glow(0, -4, 34, '255,150,60', (0.25 + 0.35 * nt) * fl); sh(18, 13); F('#3A3F47'); ell(0, 6, 17, 7); ctx.fill(); F('#5A626E'); ell(0, 4, 16, 6); ctx.fill(); F('#20262E'); ell(0, 3, 12, 4); ctx.fill();
        F('#6B4A2E'); ctx.save(); ctx.translate(0, 2); for (const a of [-0.5, 0.5, 1.6]) { ctx.save(); ctx.rotate(a); ctx.fillRect(-9, -1.5, 18, 3); ctx.restore(); } ctx.restore();
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { const x = -7 + k * 2.8, h = 8 + 5 * Math.sin(t * 7 + k * 1.9) + (k % 2) * 3; ctx.fillStyle = k % 2 ? 'rgba(255,120,40,.85)' : 'rgba(255,200,70,.85)'; ctx.beginPath(); ctx.moveTo(x - 3, 2); ctx.quadraticCurveTo(x - 2.4, -h * 0.5, x + Math.sin(t * 6 + k) * 1.4, -h); ctx.quadraticCurveTo(x + 2.4, -h * 0.5, x + 3, 2); ctx.fill(); }
        for (let k = 0; k < 5; k++) { const p = (t * 0.8 + k / 5) % 1; ctx.fillStyle = 'rgba(255,190,90,' + (1 - p).toFixed(2) + ')'; C(Math.sin(k * 3 + t) * 6 * p, -6 - p * 22, 0.8); } ctx.restore(); return true; }
      case 'console': { sh(32, 19); F('#14161C'); rr(-26, -22, 52, 26, 3); ctx.fill(); F('#20262E'); ctx.fillRect(-4, 4, 8, 3); ctx.fillRect(-10, 6, 20, 2);
        ctx.save(); ctx.beginPath(); ctx.rect(-23, -19, 46, 20); ctx.clip(); F('#3A7AC0'); ctx.fillRect(-23, -19, 46, 20); F('#5FB86A'); ctx.fillRect(-23, -8, 46, 9); F('#4A505C'); ctx.beginPath(); ctx.moveTo(-6, 1); ctx.lineTo(-2, -8); ctx.lineTo(2, -8); ctx.lineTo(6, 1); ctx.fill();
        F('#FFE45C'); for (let k = 0; k < 4; k++) { const y = -8 + ((t * 12 + k * 2.5) % 9); ctx.fillRect(-0.4, y, 0.8, 1.2 + (y + 8) * 0.12); } const cx = Math.sin(t * 1.8) * 3; F('#D84A4A'); ctx.fillRect(cx - 2, -3, 4, 2.6); F('#4BC8FF'); ctx.fillRect(-cx * 0.6 - 1.6 + 1.5, -6, 3.2, 2); F('rgba(255,255,255,.85)'); ctx.font = '900 3.4px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('LAP ' + (1 + Math.floor(t / 6) % 3) + '/3', -22, -15); ctx.restore();
        F('#2B2F38'); rr(-8, 9, 16, 5, 2); ctx.fill(); F('#5FE584'); C(5, 11.5, 0.8); for (const [x, c] of [[-24, '#C23B3B'], [24, '#4B8DFF']]) { F(c); ell(x, 14, 9, 7); ctx.fill(); F('rgba(255,255,255,.18)'); ell(x - 2, 12, 5, 3); ctx.fill(); }
        F('#20262E'); for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 16, 6 + Math.sin(t * 8 + s) * 0.6); rr(-3, -1.4, 6, 2.8, 1.2); ctx.fill(); ctx.restore(); } return true; }
      case 'djbooth': { const beat = Math.pow(Math.max(0, Math.sin(t * 8.4)), 4); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { const a = Math.sin(t * 0.9 + k * 2.1) * 0.7 - Math.PI / 2, col = ['255,92,168', '75,200,255', '95,229,132'][k]; const g = ctx.createLinearGradient(0, -12, Math.cos(a) * 40, -12 + Math.sin(a) * 40); g.addColorStop(0, 'rgba(' + col + ',' + (0.25 + 0.2 * nt).toFixed(2) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); F(g); ctx.beginPath(); ctx.moveTo(-1, -12); ctx.lineTo(Math.cos(a - 0.12) * 40, -12 + Math.sin(a - 0.12) * 40); ctx.lineTo(Math.cos(a + 0.12) * 40, -12 + Math.sin(a + 0.12) * 40); ctx.fill(); } ctx.restore();
        sh(26, 17); F('#14161C'); rr(-26, -10, 52, 26, 3); ctx.fill(); F('#2B2F38'); rr(-24, -14, 48, 10, 2); ctx.fill();
        for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 13, -9); F('#0A0C10'); C(0, 0, 6.4); ctx.rotate(t * 5 * s); F('#20262E'); C(0, 0, 5.4); ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 0.4; for (const r of [2.4, 3.6, 4.6]) { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke(); } F(s < 0 ? '#FF5CA8' : '#4BC8FF'); C(0, 0, 1.6); F('#FFFFFF'); ctx.fillRect(3.4, -0.4, 1.6, 0.8); ctx.restore(); }
        F('#3A3F47'); rr(-4, -13, 8, 8, 1); ctx.fill(); F('#C9D2DC'); ctx.fillRect(-2.6 + Math.sin(t * 0.7) * 1.6, -11, 1.2, 4);
        for (let k = 0; k < 10; k++) { const h = 1 + Math.abs(Math.sin(t * 6 + k * 1.3)) * 7 * (0.5 + beat * 0.5); F('hsl(' + (120 - h * 12) + ',85%,58%)'); ctx.fillRect(-20 + k * 4.1, 12 - h, 2.8, h); }
        F('rgba(255,255,255,' + (0.15 + 0.5 * beat).toFixed(2) + ')'); rr(-26, 14, 52, 2, 1); ctx.fill(); return true; }
      case 'neonsign': { const pu = 0.75 + 0.25 * Math.sin(t * 3), fl = Math.sin(t * 23) > 0.96 ? 0.4 : 1; F('#14161C'); rr(-24, -14, 48, 26, 4); ctx.fill(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(0, -1, 26, '255,92,168', 0.3 * pu * fl); ctx.restore();
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.font = '900 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,92,168,' + (0.45 * fl).toFixed(2) + ')'; ctx.strokeText('CHILL', 0, -3); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,220,240,' + (0.95 * fl).toFixed(2) + ')'; ctx.strokeText('CHILL', 0, -3);
        ctx.font = '800 5.5px sans-serif'; F('rgba(120,230,255,' + (0.6 + 0.4 * pu).toFixed(2) + ')'); ctx.fillText('ZONE', 0, 7); ctx.textBaseline = 'alphabetic'; F('#3A3F47'); ctx.fillRect(-14, -18, 1, 4); ctx.fillRect(13, -18, 1, 4); return true; }
      case 'pokertable': { sh(28, 19); F('#5A3A24'); ell(0, 0, 28, 18); ctx.fill(); F('#1E7A4A'); ell(0, -1, 24, 15); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(0, -1, 16, 9, 0, 0, TAU); ctx.stroke();
        const chip = (x, y, n, c) => { for (let k = 0; k < n; k++) { F('#10151C'); ell(x, y - k * 1.2 + 0.4, 2.6, 1.3); ctx.fill(); F(c); ell(x, y - k * 1.2, 2.6, 1.3); ctx.fill(); } }; chip(-14, 4, 4, '#C23B3B'); chip(14, 3, 3, '#4B8DFF'); chip(-10, -8, 5, '#F4F4F8'); chip(11, -8, 2, '#1F2430'); chip(2, 2, 3 + Math.floor(t * 1.2) % 3, '#F2C14E');
        const fl = Math.floor(t * 0.8) % 5; for (let k = 0; k < 5; k++) { const up = k < fl || (k === fl && (t * 0.8) % 1 > 0.5); F(up ? '#FAFAFA' : '#B33A3A'); rr(-10 + k * 4.4, -4, 3.6, 5, 0.6); ctx.fill(); if (up) { F(k % 2 ? '#C23B3B' : '#20262E'); ctx.font = '900 3px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(['A', 'K', '7', 'Q', '10'][k], -8.2 + k * 4.4, -0.6); } }
        F('#2B2F38'); for (const [x, y] of [[-26, -10], [26, -10], [-26, 10], [26, 10]]) { ell(x, y, 5, 4); ctx.fill(); } return true; }
      case 'tagwall': { F('#8A8F96'); ctx.fillRect(-30, -18, 60, 30); F('#7A7F86'); for (let y = -18; y < 12; y += 6) for (let x = -30 + ((y / 6) % 2 ? 6 : 0); x < 30; x += 12) ctx.fillRect(x, y, Math.min(11, 30 - x), 5);
        const cyc = (t * 0.25) % 1, cols = ['#FF5CA8', '#4BC8FF', '#5FE584', '#FFD24A']; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; const pts = [[-24, 2], [-18, -10], [-12, 2], [-6, -10], [0, 4], [6, -12], [12, 2], [18, -8], [24, 0]], n = Math.floor(cyc * 1.25 * (pts.length - 1));
        ctx.strokeStyle = '#1F2430'; ctx.lineWidth = 5.4; ctx.beginPath(); pts.slice(0, n + 2).forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); const g = ctx.createLinearGradient(-24, 0, 24, 0); cols.forEach((c, i) => g.addColorStop(i / 3, c)); ctx.strokeStyle = g; ctx.lineWidth = 3.4; ctx.beginPath(); pts.slice(0, n + 2).forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
        F('rgba(255,92,168,.7)'); for (let k = 0; k < Math.min(n, 4); k++) ctx.fillRect(-23 + k * 12, 3, 1.2, 3 + (t * 2 + k) % 4);
        const [cx, cy] = pts[Math.min(n + 1, pts.length - 1)]; ctx.save(); ctx.translate(cx + 4, cy - 8); ctx.rotate(0.5); F('#C23B3B'); rr(-2, -5, 4, 10, 1.5); ctx.fill(); F('#E9ECEF'); ctx.fillRect(-1, -6.6, 2, 1.6); ctx.restore(); F('rgba(255,180,220,.5)'); for (let k = 0; k < 4; k++) C(cx + 2 + Math.sin(t * 20 + k) * 2, cy - 3 + Math.cos(t * 17 + k) * 2, 0.6);
        F('#5A626E'); ctx.fillRect(-30, 12, 60, 2); return true; }
      case 'sneakerwall': { F('#20262E'); rr(-26, -22, 52, 40, 3); ctx.fill(); const pu = 0.6 + 0.4 * Math.sin(t * 2);
        for (let r = 0; r < 3; r++) { const y = -10 + r * 12; ctx.save(); ctx.globalCompositeOperation = 'lighter'; F('rgba(75,200,255,' + (0.35 * pu).toFixed(2) + ')'); ctx.fillRect(-24, y + 3, 48, 1.4); ctx.restore(); F('#3A404B'); ctx.fillRect(-24, y + 2, 48, 1.6);
          for (let k = 0; k < 3; k++) { const x = -15 + k * 15, c = ['#FF5C7A', '#F4F4F8', '#FFD24A', '#5FE584', '#4BC8FF', '#B58CFF', '#FF8A3A', '#1F2430', '#E05555'][r * 3 + k], hov = (r * 3 + k) === Math.floor(t * 0.6) % 9 ? -1.4 - Math.sin(t * 6) * 0.6 : 0; ctx.save(); ctx.translate(x, y + hov);
            F(c); ctx.beginPath(); ctx.moveTo(-6, 1); ctx.lineTo(-6, -3); ctx.quadraticCurveTo(-3, -6, 0, -4); ctx.lineTo(5, -2); ctx.quadraticCurveTo(7, -1, 7, 1); ctx.closePath(); ctx.fill(); F('#F4F4F8'); ctx.fillRect(-6, 0, 13, 1.6); F('rgba(0,0,0,.25)'); ctx.fillRect(-3, -3, 4, 0.8); ctx.restore(); } }
        sh(24, 18); return true; }
      case 'hoops': { sh(14, 21); F('#2B2F38'); rr(-14, 8, 28, 13, 2); ctx.fill(); F('#14161C'); rr(-12, -24, 24, 16, 2); ctx.fill(); F('#F4F4F8'); ctx.fillRect(-11, -23, 22, 14); ctx.strokeStyle = '#D84A4A'; ctx.lineWidth = 0.8; ctx.strokeRect(-5, -19, 10, 8); F('#3A3F47'); ctx.fillRect(-12, -8, 2, 16); ctx.fillRect(10, -8, 2, 16);
        ctx.strokeStyle = '#FF8A3A'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(0, -10, 5, 1.6, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 0.4; for (let k = -4; k <= 4; k += 2) { ctx.beginPath(); ctx.moveTo(k, -10); ctx.lineTo(k * 0.6, -5); ctx.stroke(); }
        const p = (t * 0.7) % 1, bx = -8 + p * 8, by = p < 0.7 ? 6 - Math.sin(p / 0.7 * Math.PI) * 24 - (p / 0.7) * 8 : -10 + (p - 0.7) / 0.3 * 16; ctx.save(); ctx.translate(p < 0.7 ? bx : 0, by); ctx.rotate(t * 8); F('#E8833A'); C(0, 0, 2.6); ctx.strokeStyle = '#7A3A10'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.moveTo(-2.6, 0); ctx.lineTo(2.6, 0); ctx.moveTo(0, -2.6); ctx.lineTo(0, 2.6); ctx.stroke(); ctx.restore();
        F('#14161C'); rr(-8, 10, 16, 6, 1); ctx.fill(); F('#FF5C7A'); ctx.font = '900 4.6px monospace'; ctx.textAlign = 'center'; ctx.fillText(String(Math.floor(t * 0.7) % 100).padStart(2, '0'), 0, 14.6); return true; }
      case 'moneycount': { sh(12, 11); F('#3A3F47'); rr(-11, -6, 22, 16, 3); ctx.fill(); F('#5A626E'); rr(-11, -6, 22, 4, 2); ctx.fill(); F('#14161C'); rr(-7, 1, 14, 5, 1); ctx.fill(); F('#5FE584'); ctx.font = '700 4px monospace'; ctx.textAlign = 'center'; ctx.fillText(String(Math.floor(t * 37) % 10000).padStart(4, '0'), 0, 5.2);
        for (let k = 0; k < 4; k++) { const p = (t * 2.2 + k / 4) % 1; ctx.save(); ctx.translate(-2 + p * 4, -6 - Math.sin(p * Math.PI) * 6); ctx.rotate(-0.6 + p * 1.2); F('#7FBF6A'); ctx.fillRect(-4, -1.6, 8, 3.2); F('#5A9A4A'); ctx.fillRect(-1, -1, 2, 2); ctx.restore(); }
        F('#7FBF6A'); for (let k = 0; k < 3; k++) ctx.fillRect(13 - k * 0.3, 2 - k * 1.4, 8, 1.2); F('#C9A13A'); ctx.fillRect(16, -2, 1, 5.6); return true; }
      case 'speakerwall': { const beat = Math.pow(Math.max(0, Math.sin(t * 8.4)), 3); sh(18, 21); F('#14161C'); rr(-18, -24, 36, 44, 3); ctx.fill();
        for (const [x, y, r] of [[-9, -14, 6], [9, -14, 6], [-9, 6, 7.5], [9, 6, 7.5], [0, -3, 3]]) { F('#20262E'); C(x, y, r + 1); F('#2B2F38'); C(x, y, r * (1 + 0.08 * beat)); F('#0A0C10'); C(x, y, r * 0.45 * (1 + 0.15 * beat)); F('rgba(255,255,255,.12)'); C(x - r * 0.3, y - r * 0.3, r * 0.2); }
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; F('rgba(75,200,255,' + (0.2 + 0.5 * beat).toFixed(2) + ')'); ctx.fillRect(-18, 17, 36, 2); ctx.restore(); if (beat > 0.5) { ctx.strokeStyle = 'rgba(255,255,255,' + ((beat - 0.5) * 0.8).toFixed(2) + ')'; ctx.lineWidth = 0.6; for (const x of [-9, 9]) { ctx.beginPath(); ctx.arc(x, 6, 10 + beat * 4, 0, TAU); ctx.stroke(); } } return true; }
      case 'cooler': { sh(13, 11); F('#2A7FB8'); rr(-13, -4, 26, 14, 3); ctx.fill(); F('#F4F4F8'); rr(-13, -8, 26, 6, 2); ctx.fill(); F('#C9D2DC'); ctx.fillRect(-6, -10, 12, 2);
        const lid = Math.max(0, Math.sin(t * 0.8)) * 0.4; ctx.save(); ctx.translate(-13, -8); ctx.rotate(-lid); F('#F4F4F8'); rr(0, -2, 26, 3, 1.5); ctx.fill(); ctx.restore();
        if (lid > 0.1) { for (const [x, c] of [[-7, '#C23B3B'], [-2, '#5FE584'], [3, '#FFD24A'], [8, '#4BC8FF']]) { F(c); rr(x - 1.6, -12 + Math.sin(x) * 1, 3.2, 6, 1); ctx.fill(); F('#C9D2DC'); ctx.fillRect(x - 1, -12.6 + Math.sin(x), 2, 0.8); } F('rgba(220,240,255,.6)'); for (let k = 0; k < 3; k++) { const p = (t * 0.7 + k / 3) % 1; ctx.globalAlpha = 1 - p; C(-6 + k * 6, -10 - p * 8, 1 + p); } ctx.globalAlpha = 1; }
        F('rgba(255,255,255,.3)'); ctx.fillRect(-11, -1, 1.4, 8); return true; }
    }
    return false;
  }
  // ---------- v130: neue Begleiter (Blick nach rechts, Ursprung = Boden unter der Mitte) ----------
  function drawPet130(id, tm, moving, bob, lg) {
    const F = c => { ctx.fillStyle = c; }, C = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }, sh = (w, y) => { F('rgba(0,0,0,.26)'); ell(0, y, w, 3); ctx.fill(); };
    const eye = (x, y, r) => { F('#FFFFFF'); C(x, y, r); F('#161A20'); C(x + r * 0.25, y, r * 0.55); F('#FFFFFF'); C(x + r * 0.45, y - r * 0.3, r * 0.2); };
    const blink = (tm * 0.7) % 4 > 3.85;
    switch (id) {
      case 'turtle': {
        sh(10, 6.5); const pd = moving ? Math.sin(tm * 7) : Math.sin(tm * 1.2) * 0.3;
        F('#7BA84A'); for (const [x, s] of [[-6, 1], [5, -1]]) { ctx.save(); ctx.translate(x, 4); ctx.rotate(pd * 0.5 * s); ell(0, 0, 3, 1.8); ctx.fill(); ctx.restore(); }
        const hx = 10 + (moving ? 1.5 : Math.sin(tm * 0.8) * 1.5); F('#8BBE57'); ell(hx - 2, -1.5, 3.4, 2.2); ctx.fill(); C(hx, -3, 3.2); eye(hx + 1.2, -3.8, 1.1);
        F('#3E7A3A'); ctx.beginPath(); ctx.ellipse(0, -1 - bob * 0.3, 9.5, 7, 0, Math.PI, 0); ctx.fill(); F('#2F6130'); ctx.fillRect(-9.5, -1.4 - bob * 0.3, 19, 2);
        F('#5E9E4A'); for (const [x, y] of [[-4.5, -4], [0, -5.8], [4.5, -4], [-2, -2.2], [2.5, -2.2]]) { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; ctx.lineTo(x + Math.cos(a) * 1.9, y - bob * 0.3 + Math.sin(a) * 1.5); } ctx.fill(); }
        F('#8BBE57'); ctx.beginPath(); ctx.moveTo(-9, -0.5); ctx.lineTo(-12, 0.5); ctx.lineTo(-9, 1.2); ctx.fill(); return true; }
      case 'fox': {
        sh(10, 7.5); const wag = Math.sin(tm * (moving ? 11 : 3)) * 0.35;
        ctx.save(); ctx.translate(-8, -3 - bob); ctx.rotate(-0.5 + wag); F('#E0702A'); ell(-5, -1, 6.5, 3.4); ctx.fill(); F('#FFF4E6'); ell(-10, -1, 2.6, 2.2); ctx.fill(); ctx.restore();
        F('#B85A20'); [[-5, lg], [-1.5, -lg], [3, lg], [6, -lg]].forEach(([x, l]) => { ctx.fillRect(x - 1 + l, 2, 2, 4.5 - Math.max(0, l)); }); F('#2A2220'); [[-5, lg], [-1.5, -lg], [3, lg], [6, -lg]].forEach(([x, l]) => ctx.fillRect(x - 1 + l, 5.5 - Math.max(0, l), 2, 1.2));
        F('#E8792E'); ell(0, -1.5 - bob * 0.4, 8.6, 5.2); ctx.fill(); F('#FFF4E6'); ell(2, 0.8 - bob * 0.4, 5, 2.2); ctx.fill();
        const hy = -7.5 - bob; F('#E8792E'); for (const x of [4, 9]) { ctx.beginPath(); ctx.moveTo(x - 2.4, hy - 3); ctx.lineTo(x, hy - 9); ctx.lineTo(x + 2.4, hy - 3); ctx.fill(); } F('#2A2220'); for (const x of [4, 9]) { ctx.beginPath(); ctx.moveTo(x - 1, hy - 6.5); ctx.lineTo(x, hy - 9); ctx.lineTo(x + 1, hy - 6.5); ctx.fill(); }
        F('#E8792E'); C(6.5, hy, 5.4); F('#FFF4E6'); ctx.beginPath(); ctx.moveTo(6, hy + 1); ctx.lineTo(14, hy + 1.8); ctx.lineTo(7, hy + 5); ctx.fill(); F('#2A2220'); C(13.8, hy + 1.6, 1.1);
        if (blink) { ctx.strokeStyle = '#2A2220'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(7.3, hy - 1); ctx.lineTo(9.5, hy - 1); ctx.stroke(); } else { F('#2A2220'); C(8.6, hy - 1, 1); } return true; }
      case 'penguin': {
        sh(8, 7); const sw = moving ? Math.sin(tm * 12) * 0.16 : Math.sin(tm * 1.5) * 0.04; ctx.save(); ctx.rotate(sw);
        F('#F2A33A'); ell(-3 + (moving ? lg : 0), 6, 3, 1.4); ctx.fill(); ell(3 - (moving ? lg : 0), 6, 3, 1.4); ctx.fill();
        F('#1F2430'); ell(0, -4 - bob * 0.3, 7, 10); ctx.fill(); F('#F4F6FA'); ell(1.6, -2.5 - bob * 0.3, 4.6, 7.6); ctx.fill();
        const fl = moving ? Math.sin(tm * 16) * 0.5 : Math.sin(tm * 2) * 0.1; ctx.save(); ctx.translate(-3, -7 - bob * 0.3); ctx.rotate(0.35 + fl); F('#151922'); ell(0, 4, 2, 5.4); ctx.fill(); ctx.restore();
        F('#1F2430'); C(1.5, -14 - bob * 0.3, 5.2); F('#F4F6FA'); ell(3.2, -13.6 - bob * 0.3, 2.6, 3); ctx.fill(); if (blink) { F('#161A20'); ctx.fillRect(2.8, -15 - bob * 0.3, 2, 0.7); } else eye(3.6, -14.6 - bob * 0.3, 1.1);
        F('#F2A33A'); ctx.beginPath(); ctx.moveTo(6, -13.4 - bob * 0.3); ctx.lineTo(9.6, -12.6 - bob * 0.3); ctx.lineTo(6, -11.6 - bob * 0.3); ctx.fill(); F('rgba(255,130,150,.5)'); C(4, -11.5 - bob * 0.3, 1.1); ctx.restore(); return true; }
      case 'owl': {
        F('rgba(0,0,0,.2)'); ell(0, 8, 6, 2.2); ctx.fill(); ctx.translate(0, -13 + Math.sin(tm * 3) * 1.8 - (moving ? 1.5 : 0));
        const fl = Math.sin(tm * (moving ? 18 : 6)); for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 6, -1); ctx.rotate(s * (0.5 + fl * 0.5)); F('#7A5434'); ell(s * 3, 1, 4.5, 2.6); ctx.fill(); ctx.restore(); }
        F('#9A6A42'); ell(0, 0, 7.5, 8); ctx.fill(); F('#E9D2A8'); ell(0, 2, 4.8, 5); ctx.fill(); ctx.strokeStyle = '#B08A5E'; ctx.lineWidth = 0.7; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(-1.5 + k * 1.5, 1 + k * 1.6, 1, 0.2, Math.PI - 0.2); ctx.stroke(); }
        const tilt = Math.sin(tm * 0.6) * 0.25; ctx.save(); ctx.translate(0, -8); ctx.rotate(tilt); F('#9A6A42'); C(0, 0, 6.3); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 2.4, -4.6); ctx.lineTo(s * 5, -8.4); ctx.lineTo(s * 5.4, -3.6); ctx.fill(); }
        F('#F4E6C8'); C(-2.4, 0, 2.6); C(2.4, 0, 2.6); if (blink) { F('#3A2A1A'); ctx.fillRect(-4.4, -0.3, 4, 0.8); ctx.fillRect(0.4, -0.3, 4, 0.8); } else { F('#F2B23A'); C(-2.2, 0, 1.6); C(2.6, 0, 1.6); F('#161A20'); C(-2, 0, 0.9); C(2.8, 0, 0.9); }
        F('#E8A33A'); ctx.beginPath(); ctx.moveTo(-0.9, 2); ctx.lineTo(0.9, 2); ctx.lineTo(0, 4.2); ctx.fill(); ctx.restore(); F('#E8A33A'); ctx.fillRect(-3, 7.5, 2, 1.2); ctx.fillRect(1, 7.5, 2, 1.2); return true; }
      case 'axolotl': {
        F('rgba(0,0,0,.18)'); ell(0, 8, 7, 2.4); ctx.fill(); ctx.translate(0, -12 + Math.sin(tm * 2.2) * 2);
        const g = ctx.createRadialGradient(-3, -4, 1, 0, 0, 11); g.addColorStop(0, 'rgba(200,240,255,.55)'); g.addColorStop(1, 'rgba(120,200,240,.25)'); F(g); C(0, 0, 11); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.stroke();
        const sw = Math.sin(tm * 4); F('#F49AB8'); ctx.save(); ctx.translate(-5, 1); ctx.rotate(sw * 0.3); ell(-2, 0, 3.6, 1.6); ctx.fill(); ctx.restore(); ell(0, 1, 5.5, 3); ctx.fill(); [[-2.5, 1], [2, -1]].forEach(([x, s]) => { ctx.fillRect(x - 0.6, 3, 1.2, 2.2 + Math.sin(tm * 5 + s) * 0.5); });
        C(4, -1.5, 3.6); for (const s of [-1, 0, 1]) { ctx.save(); ctx.translate(2.4, -3.2 + s * 1.5); ctx.rotate(-2.6 + s * 0.45 + Math.sin(tm * 6 + s) * 0.18); F('#E0567E'); ell(2.4, 0, 2.6, 0.9); ctx.fill(); ctx.restore(); }
        F('#2A1A22'); C(5.6, -2.2, 0.75); ctx.strokeStyle = '#B04A6A'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(6.3, -0.6, 1.2, 0.3, 1.8); ctx.stroke();
        F('rgba(255,255,255,.7)'); for (let k = 0; k < 2; k++) C(6 + k, -5 - ((tm * 5 + k * 4) % 7), 0.6 + k * 0.2); F('rgba(255,255,255,.5)'); ell(-4, -6, 2.6, 1.4, -0.6); ctx.fill(); return true; }
      case 'ghost': {
        const al = 0.72 + 0.25 * Math.sin(tm * 1.3); F('rgba(0,0,0,' + (0.14 * al).toFixed(2) + ')'); ell(0, 8, 6.5, 2.2); ctx.fill();
        ctx.translate(0, -13 + Math.sin(tm * 2.4) * 2.2); ctx.globalAlpha = al; F('#F4F6FF');
        ctx.beginPath(); ctx.arc(0, -3, 7.5, Math.PI, 0); ctx.lineTo(7.5, 6); for (let k = 0; k <= 4; k++) { const x = 7.5 - k * 3.75, y = 6 + (k % 2 ? -2 : 1.5) * (1 + 0.3 * Math.sin(tm * 6 + k)); ctx.lineTo(x, y); } ctx.closePath(); ctx.fill();
        for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 7, 0); ctx.rotate(s * (0.4 + Math.sin(tm * 3 + s) * 0.3)); ell(s * 1.5, 0, 2.6, 1.6); ctx.fill(); ctx.restore(); }
        ctx.globalAlpha = 1; F('#20263A'); if (blink) { ctx.fillRect(-1, -4, 2.4, 0.8); ctx.fillRect(3.4, -4, 2.4, 0.8); } else { ell(0.4, -3.6, 1.2, 1.7); ctx.fill(); ell(4.6, -3.6, 1.2, 1.7); ctx.fill(); }
        F('#3A2440'); ell(2.5, 0.2, 1.8, 1.4); ctx.fill(); if (Math.sin(tm * 0.9) > 0.6) { F('#FF7A9A'); ell(2.5, 1.6, 1.1, 1.3); ctx.fill(); } F('rgba(255,140,170,.4)'); C(-1.6, -1, 1.2); C(6.6, -1, 1.2); return true; }
      case 'unicorn': {
        sh(10, 7.5); const hy = -9 - bob;
        F('#E8E4F0'); [[-6, lg], [-2.5, -lg], [3, lg], [6.5, -lg]].forEach(([x, l]) => { ctx.fillRect(x - 1.1 + l, 1, 2.2, 5.5 - Math.max(0, l)); }); F('#C9A0E8'); [[-6, lg], [-2.5, -lg], [3, lg], [6.5, -lg]].forEach(([x, l]) => ctx.fillRect(x - 1.1 + l, 5.5 - Math.max(0, l), 2.2, 1.2));
        const R = ['#FF6A86', '#FFB547', '#FFE45C', '#5FE584', '#4BC8FF', '#B58CFF']; R.forEach((c, k) => { ctx.strokeStyle = c; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-8, -3 - bob + k * 0.6); ctx.quadraticCurveTo(-13, -2 + Math.sin(tm * 6 + k * 0.4) * 2, -12 + Math.sin(tm * 5 + k) * 1.2, 4 + k * 0.4); ctx.stroke(); });
        F('#FBF9FF'); ell(0, -1.5 - bob * 0.4, 9, 5.4); ctx.fill(); ctx.save(); ctx.translate(6, hy + 3); ctx.rotate(-0.5); F('#FBF9FF'); ell(0, 0, 3, 4.6); ctx.fill(); ctx.restore();
        F('#FBF9FF'); ell(9, hy, 4.4, 3.8, 0.2); ctx.fill(); F('#F2C9DC'); ell(12.4, hy + 1.2, 2, 1.6); ctx.fill(); F('#FBF9FF'); ctx.beginPath(); ctx.moveTo(6.5, hy - 2.5); ctx.lineTo(7.4, hy - 6); ctx.lineTo(8.6, hy - 2.8); ctx.fill();
        F('#F2C14E'); ctx.beginPath(); ctx.moveTo(9.2, hy - 3.2); ctx.lineTo(11.6, hy - 10); ctx.lineTo(11.4, hy - 2.8); ctx.fill(); ctx.strokeStyle = '#C9962A'; ctx.lineWidth = 0.5; for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(9.6 + k * 0.5, hy - 3.2 - k * 1.6); ctx.lineTo(11.3, hy - 3.6 - k * 1.6); ctx.stroke(); }
        R.forEach((c, k) => { F(c); ell(5.5 - k * 0.9, hy - 2 + k * 1.3 + Math.sin(tm * 4 + k) * 0.3, 1.6, 2, -0.5); ctx.fill(); });
        if (blink) { F('#2A2240'); ctx.fillRect(9, hy - 0.6, 2.2, 0.7); } else { F('#2A2240'); C(10, hy - 0.4, 1); F('#FFFFFF'); C(10.4, hy - 0.8, 0.35); } F('rgba(255,120,170,.5)'); C(10.4, hy + 1.8, 1);
        for (let k = 0; k < 3; k++) { const p = (tm * 0.9 + k / 3) % 1, a = 1 - p; ctx.globalAlpha = a; F(R[(k * 2) % 6]); const x = -8 - p * 10, y = -4 - p * 6 + Math.sin(tm * 3 + k) * 2; ctx.beginPath(); for (let j = 0; j < 8; j++) { const r = j % 2 ? 0.5 : 1.6; ctx.lineTo(x + Math.cos(j * Math.PI / 4) * r, y + Math.sin(j * Math.PI / 4) * r); } ctx.fill(); } ctx.globalAlpha = 1; return true; }
    }
    return false;
  }
  // ---------- v130: Deko, die sich bewegt ----------
  function drawDec130(id, t) {
    const F = c => { ctx.fillStyle = c; }, C = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }, sh = (w, y) => { F('rgba(0,0,0,.22)'); ell(0, y, w, 3.4); ctx.fill(); }, nt = typeof lightK === 'function' ? lightK() : 0;
    const glow = (x, y, r, rgb, a) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + rgb + ',' + a.toFixed(2) + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); F(g); C(x, y, r); };
    switch (id) {
      case 'firefly': { glow(0, -3, 22, '220,255,120', 0.12 + 0.35 * nt); sh(8, 13); F('#7A5434'); rr(-5, -14, 10, 3, 1); ctx.fill(); F('rgba(200,230,255,.28)'); rr(-7, -11, 14, 23, 4); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 0.8; rr(-7, -11, 14, 23, 4); ctx.stroke();
        for (let k = 0; k < 6; k++) { const x = Math.sin(t * (0.9 + k * 0.17) + k * 2) * 4.5, y = 1 + Math.cos(t * (0.7 + k * 0.13) + k) * 8, b = 0.5 + 0.5 * Math.sin(t * 3 + k * 1.7); glow(x, y, 3.5, '230,255,120', 0.6 * b); F('rgba(240,255,170,' + (0.5 + 0.5 * b).toFixed(2) + ')'); C(x, y, 0.9); } return true; }
      case 'mobile': { ctx.strokeStyle = '#9AA3AD'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(0, -12); ctx.stroke(); F('#C9A06A'); ctx.fillRect(-12, -12.5, 24, 1.4);
        for (let k = 0; k < 4; k++) { const a = t * 0.8 + k * Math.PI / 2, x = Math.cos(a) * 11, d = Math.sin(a), y = 2 + k % 2 * 4, s = 0.75 + 0.25 * d; ctx.beginPath(); ctx.moveTo(x * 0.9, -12); ctx.lineTo(x, y - 3); ctx.stroke(); ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * 2 + k) * 0.3);
          if (k === 0) { F('#F2D36B'); C(0, 0, 4); F('#14161C'); C(1.8, -0.8, 3.4); } else { F(['#FFE45C', '#FF8FD0', '#8FD8FF'][k - 1]); ctx.beginPath(); for (let j = 0; j < 10; j++) { const r = j % 2 ? 1.6 : 4; ctx.lineTo(Math.cos(j * Math.PI / 5 - Math.PI / 2) * r, Math.sin(j * Math.PI / 5 - Math.PI / 2) * r); } ctx.fill(); } ctx.restore(); } return true; }
      case 'rocker': { sh(16, 16); const a = Math.sin(t * 1.6) * 0.14; ctx.save(); ctx.translate(0, 12); ctx.rotate(a); ctx.translate(0, -12);
        ctx.strokeStyle = '#6B4A2E'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, -16, 30, Math.PI * 0.36, Math.PI * 0.64); ctx.stroke(); F('#8A5E3A'); ctx.fillRect(-10, -2, 2.2, 13); ctx.fillRect(8, -2, 2.2, 13); F('#9A6A42'); rr(-11, -4, 22, 6, 2); ctx.fill();
        F('#8A5E3A'); rr(-10, -20, 20, 17, 3); ctx.fill(); F('#C24A54'); rr(-8, -18, 16, 14, 3); ctx.fill(); F('#D86A72'); rr(-9, -5, 18, 5, 2); ctx.fill(); F('rgba(255,255,255,.18)'); ctx.fillRect(-7, -16, 14, 1.6); ctx.restore(); return true; }
      case 'newton': { sh(14, 9); F('#2B2F38'); rr(-14, 5, 28, 4, 1.5); ctx.fill(); ctx.strokeStyle = '#B9C2CC'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-12, 5); ctx.lineTo(-12, -12); ctx.lineTo(12, -12); ctx.lineTo(12, 5); ctx.stroke();
        const ph = Math.sin(t * 4.2), aL = ph < 0 ? ph * 0.7 : 0, aR = ph > 0 ? ph * 0.7 : 0; ctx.lineWidth = 0.5; ctx.strokeStyle = '#D8DEE4';
        for (let k = 0; k < 5; k++) { const a = k === 0 ? aL : k === 4 ? aR : 0, px = -6 + k * 3, bx = px + Math.sin(a) * 11, by = -12 + Math.cos(a) * 11; ctx.beginPath(); ctx.moveTo(px, -12); ctx.lineTo(bx, by); ctx.stroke(); F('#C9D2DC'); C(bx, by, 1.6); F('#FFFFFF'); C(bx - 0.5, by - 0.5, 0.5); } return true; }
      case 'cuckoo': { F('#6B4A2E'); ctx.beginPath(); ctx.moveTo(-12, -10); ctx.lineTo(0, -20); ctx.lineTo(12, -10); ctx.closePath(); ctx.fill(); F('#8A5E3A'); rr(-10, -11, 20, 18, 2); ctx.fill(); F('#F4ECD8'); C(0, -1, 6); ctx.strokeStyle = '#2B2F38'; ctx.lineWidth = 0.9;
        const hm = t * 0.4, mm = t * 4; ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(Math.sin(hm) * 3, -1 - Math.cos(hm) * 3); ctx.moveTo(0, -1); ctx.lineTo(Math.sin(mm) * 4.6, -1 - Math.cos(mm) * 4.6); ctx.stroke();
        const op = Math.max(0, Math.sin(t * 0.7) * 3 - 2); F('#2B2F38'); rr(-2.6, -11, 5.2, 4, 1); ctx.fill(); if (op > 0) { F('#5E9EDA'); C(0, -9 - op * 0.3, 1.8 + op * 0.4); F('#F2A33A'); ctx.beginPath(); ctx.moveTo(1.6, -9.4 - op * 0.3); ctx.lineTo(3.6 + op, -9 - op * 0.3); ctx.lineTo(1.6, -8.4 - op * 0.3); ctx.fill(); }
        const pa = Math.sin(t * 3) * 0.35; ctx.save(); ctx.translate(0, 7); ctx.rotate(pa); ctx.strokeStyle = '#C9A13A'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 9); ctx.stroke(); F('#E8C04A'); C(0, 10, 2); ctx.restore();
        F('#4A3322'); ctx.fillRect(-4, 7, 1, 7 + Math.sin(t * 0.5) * 2); ctx.fillRect(3, 7, 1, 9 - Math.sin(t * 0.5) * 2); F('#3E2A1A'); ell(-3.5, 15 + Math.sin(t * 0.5) * 2, 1.4, 2.4); ctx.fill(); ell(3.5, 17 - Math.sin(t * 0.5) * 2, 1.4, 2.4); ctx.fill(); return true; }
      case 'plasma': { glow(0, -4, 20, '200,120,255', 0.15 + 0.3 * nt); sh(9, 13); F('#20262E'); rr(-6, 4, 12, 9, 2); ctx.fill(); F('#14161C'); C(0, -4, 9); ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 5; k++) { const a = t * 0.9 + k * 1.3 + Math.sin(t * 2.3 + k) * 0.6, ex = Math.cos(a) * 8.4, ey = -4 + Math.sin(a) * 8.4; ctx.strokeStyle = 'rgba(210,140,255,.75)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -4); for (let j = 1; j <= 4; j++) { const f = j / 4; ctx.lineTo(ex * f + Math.sin(t * 13 + k * 3 + j) * 1.3, -4 + (ey + 4) * f + Math.cos(t * 11 + k + j) * 1.3); } ctx.stroke(); glow(ex, ey, 2.6, '230,180,255', 0.7); }
        glow(0, -4, 3.4, '255,220,255', 0.9); ctx.restore(); F('rgba(200,220,255,.18)'); C(0, -4, 9); F('rgba(255,255,255,.35)'); ell(-3.5, -8, 2.4, 1.3, -0.6); ctx.fill(); return true; }
      case 'fountain': { sh(16, 13); F('#8A8F96'); ell(0, 6, 16, 7); ctx.fill(); F('#3A8FC0'); ell(0, 5, 13, 5); ctx.fill(); F('rgba(255,255,255,.25)'); ell(Math.sin(t * 2) * 3, 5, 6, 1.6); ctx.fill(); F('#9AA3AD'); rr(-3, -10, 6, 15, 2); ctx.fill(); F('#B9C2CC'); ell(0, -10, 6, 2.4); ctx.fill();
        ctx.strokeStyle = 'rgba(150,215,255,.85)'; ctx.lineWidth = 1.1; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 2, -11); ctx.quadraticCurveTo(s * 8, -17, s * 11, 4); ctx.stroke(); }
        F('rgba(200,235,255,.9)'); for (let k = 0; k < 6; k++) { const p = (t * 1.4 + k / 6) % 1, s = k % 2 ? 1 : -1, x = s * (2 + p * 9), y = -11 - Math.sin(p * Math.PI) * 6 + p * 15 * p; C(x, y, 0.8); } for (let k = 0; k < 3; k++) { const p = (t * 0.8 + k / 3) % 1; ctx.strokeStyle = 'rgba(255,255,255,' + (0.5 * (1 - p)).toFixed(2) + ')'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse((k - 1) * 9, 4.5, 1 + p * 3, 0.5 + p, 0, 0, TAU); ctx.stroke(); } return true; }
      case 'robovac': { const a = t * 0.7, x = Math.cos(a) * 6, y = Math.sin(a) * 4, dir = a + Math.PI / 2; F('rgba(0,0,0,.08)'); ell(0, 2, 14, 9); ctx.fill(); ctx.save(); ctx.translate(x, y);
        F('rgba(0,0,0,.25)'); ell(0, 3, 9, 3.4); ctx.fill(); F('#9AA3AD'); C(0, 0.6, 8.4); F('#E8ECF2'); C(0, -0.6, 8); F('#C9D2DC'); C(0, -0.6, 5.6); F('#2B2F38'); C(0, -0.6, 2.4); const bl = Math.sin(t * 5) > 0; F(bl ? '#5FE584' : '#2E7D3E'); C(Math.cos(dir) * 5, -0.6 + Math.sin(dir) * 3.6, 1);
        ctx.strokeStyle = '#9AA3AD'; ctx.lineWidth = 0.6; ctx.save(); ctx.translate(Math.cos(dir) * 6.4 - 4, 3); ctx.rotate(t * 12); for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(k * 2.1) * 2.4, Math.sin(k * 2.1) * 2.4); ctx.stroke(); } ctx.restore(); ctx.restore(); return true; }
      case 'bubbles': { sh(10, 13); F('#4BC8FF'); rr(-8, -2, 16, 14, 3); ctx.fill(); F('#2A8FC0'); ctx.fillRect(-8, 8, 16, 4); F('#FFE45C'); C(0, 3, 4); F('#2B2F38'); C(0, 3, 2.4); ctx.save(); ctx.translate(0, 3); ctx.rotate(t * 4); F('#FFE45C'); for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-0.4, -3.6, 0.8, 1.4); } ctx.restore();
        for (let k = 0; k < 7; k++) { const p = (t * 0.35 + k / 7) % 1, x = Math.sin(t * 1.3 + k * 2.1) * 4 + (k % 3 - 1) * p * 14, y = -4 - p * 34, r = 1.4 + (k % 3) * 0.9 + p * 1.2; ctx.globalAlpha = Math.min(1, (1 - p) * 2.2); ctx.strokeStyle = 'hsl(' + ((t * 60 + k * 50) % 360) + ',80%,75%)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); F('rgba(255,255,255,.55)'); C(x - r * 0.35, y - r * 0.35, r * 0.25); } ctx.globalAlpha = 1; return true; }
      case 'trainset': { sh(28, 16); F('#4A7A3E'); rr(-28, -16, 56, 32, 6); ctx.fill(); ctx.strokeStyle = '#6B4A2E'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 22, 11, 0, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#B9C2CC'; ctx.lineWidth = 0.6; for (const r of [-1, 1]) { ctx.beginPath(); ctx.ellipse(0, 0, 22 + r, 11 + r, 0, 0, TAU); ctx.stroke(); }
        F('#2E6B3A'); C(-4, -2, 3); C(5, 3, 2.4); F('#7A5434'); ctx.fillRect(-4.6, 0, 1.2, 3);
        const car = (k, col) => { const a = t * 0.9 - k * 0.42, x = Math.cos(a) * 22, y = Math.sin(a) * 11, d = Math.atan2(Math.cos(a) * 11, -Math.sin(a) * 22); ctx.save(); ctx.translate(x, y - 2); ctx.rotate(d); F(col); rr(-3.6, -2.4, 7.2, 4.8, 1); ctx.fill(); if (k === 0) { F('#2B2F38'); ctx.fillRect(1, -1.4, 2.4, 2.8); F('#FFE45C'); C(3.8, 0, 0.8); } ctx.restore(); };
        car(2, '#4B8DFF'); car(1, '#F2C14E'); car(0, '#D84A4A'); const sa = t * 0.9, sx = Math.cos(sa) * 22, sy = Math.sin(sa) * 11 - 6; F('rgba(240,240,240,.6)'); for (let k = 0; k < 3; k++) { const p = (t * 1.5 + k / 3) % 1; C(sx - Math.cos(sa + 1.6) * p * 3, sy - p * 6, 1 + p * 1.6); } return true; }
      case 'carousel': { sh(18, 18); F('#8A5E3A'); ell(0, 12, 17, 5); ctx.fill(); F('#C9A06A'); ell(0, 10, 16, 4.4); ctx.fill(); F('#E8C04A'); ctx.fillRect(-1, -16, 2, 26);
        const hs = [0, 1, 2].map(k => { const a = t * 1.1 + k * TAU / 3; return { k, x: Math.cos(a) * 12, z: Math.sin(a), y: 2 + Math.sin(t * 3 + k * 2) * 2.2 }; }).sort((p, q) => p.z - q.z);
        for (const h of hs) { const s = 0.8 + 0.2 * h.z; ctx.strokeStyle = '#E8C04A'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(h.x, -12); ctx.lineTo(h.x, 9 + h.z * 1.5); ctx.stroke(); ctx.save(); ctx.translate(h.x, h.y + h.z * 1.5); ctx.scale(s * (Math.sin(t * 1.1 + h.k * TAU / 3) > 0 ? -1 : 1), s); F(['#FFFFFF', '#FFC9DC', '#C9E6FF'][h.k]); ell(0, 0, 4.4, 2.4); ctx.fill(); ell(4, -2.6, 1.8, 2.2); ctx.fill(); ctx.fillRect(-3, 1, 1, 3); ctx.fillRect(2, 1, 1, 3); F(['#FF6A86', '#B58CFF', '#4BC8FF'][h.k]); ctx.fillRect(-1, -2.6, 2.6, 1.2); ctx.restore(); }
        F('#D84A4A'); ctx.beginPath(); ctx.moveTo(-17, -12); ctx.lineTo(0, -21); ctx.lineTo(17, -12); ctx.closePath(); ctx.fill(); F('#F4F4F8'); for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-17 + k * 8.5, -12); ctx.lineTo(0, -21); ctx.lineTo(-12.8 + k * 8.5, -12); ctx.closePath(); ctx.fill(); }
        for (let k = 0; k < 8; k++) { const on = (Math.floor(t * 4) + k) % 2; F(on ? '#FFE45C' : '#8A6A2A'); C(-15 + k * 4.3, -11.5, 0.9); if (on && nt > 0.2) glow(-15 + k * 4.3, -11.5, 4, '255,230,120', 0.4 * nt); } return true; }
      case 'jellytank': { const hue = (t * 12) % 360; glow(0, -4, 24, '120,200,255', 0.1 + 0.25 * nt); sh(14, 21); F('#20262E'); rr(-14, 14, 28, 7, 2); ctx.fill(); rr(-14, -22, 28, 4, 2); ctx.fill(); const g = ctx.createLinearGradient(0, -18, 0, 14); g.addColorStop(0, '#0E2A4A'); g.addColorStop(1, '#081626'); F(g); ctx.fillRect(-12, -18, 24, 32);
        ctx.save(); ctx.beginPath(); ctx.rect(-12, -18, 24, 32); ctx.clip(); ctx.globalCompositeOperation = 'lighter';
        for (let k = 0; k < 3; k++) { const pu = 0.5 + 0.5 * Math.sin(t * 2.4 + k * 2), x = -5 + k * 5 + Math.sin(t * 0.5 + k) * 2, y = 8 - ((t * 3 + k * 11) % 34), col = 'hsl(' + ((hue + k * 60) % 360) + ',90%,70%)'; glow(x, y, 7, '160,200,255', 0.25);
          F(col); ctx.globalAlpha = 0.75; ctx.beginPath(); ctx.ellipse(x, y, 3.4 + pu * 0.8, 2.6 - pu * 0.5, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 0.5; for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.moveTo(x + j * 1.6, y); ctx.quadraticCurveTo(x + j * 1.6 + Math.sin(t * 4 + j + k) * 1.4, y + 3, x + j * 1.4, y + 5.5 + pu); ctx.stroke(); } ctx.globalAlpha = 1; }
        ctx.restore(); F('rgba(255,255,255,.12)'); ctx.fillRect(-11, -17, 3, 30); F('rgba(255,255,255,.5)'); for (let k = 0; k < 3; k++) C(8, 12 - ((t * 9 + k * 10) % 30), 0.6); return true; }
    }
    return false;
  }
  function drawDec106(id, t) { // v106: neue Deko
    const sh = (w, y) => { ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(0, y, w, 3.6); ctx.fill(); }, F = c => { ctx.fillStyle = c; };
    switch (id) {
      case 'cactusrow': { sh(18, 9); [['#E05A5A', -11, 9], ['#4B8DFF', 0, 12], ['#F2C14E', 11, 8]].forEach(([pc, x, hh]) => { F('#3E8A4A'); rr(x - 3, -hh + 2, 6, hh, 3); ctx.fill(); F('#5FB86A'); ctx.fillRect(x - 1, -hh + 3, 1.2, hh - 3); if (hh > 9) { F('#3E8A4A'); rr(x + 2, -6, 4, 3, 1.5); ctx.fill(); } F(pc); rr(x - 5, 1, 10, 8, 2); ctx.fill(); F('rgba(255,255,255,.25)'); ctx.fillRect(x - 5, 1, 10, 2); }); F('#FF8FB8'); ctx.beginPath(); ctx.arc(0, -10.5, 1.8, 0, TAU); ctx.fill(); return true; }
      case 'gumball': { sh(8, 14); F('#C23B3B'); rr(-6, 2, 12, 12, 2); ctx.fill(); F('#8E2424'); ctx.fillRect(-2, 6, 4, 3); F('rgba(200,230,255,.45)'); ctx.beginPath(); ctx.arc(0, -6, 8, 0, TAU); ctx.fill(); const C = ['#FF5CA8', '#FFD24A', '#4BC8FF', '#5FE584', '#F4F4F8', '#FF8A3A']; for (let k = 0; k < 14; k++) { F(C[k % 6]); ctx.beginPath(); ctx.arc(-5 + (k * 3.7) % 10, -2 - Math.floor(k / 4) * 2.6 - (k % 2), 1.4, 0, TAU); ctx.fill(); } F('rgba(255,255,255,.6)'); ctx.beginPath(); ctx.arc(-3, -10, 1.6, 0, TAU); ctx.fill(); F('#C23B3B'); ctx.fillRect(-3, -15, 6, 2); return true; }
      case 'monstera': { sh(14, 17); const sw = Math.sin(t * 1.2) * .05; [[-8, -6, -0.7], [8, -8, 0.6], [0, -14, 0], [-5, -16, -0.3], [6, -2, 1]].forEach(([x, y, a]) => { ctx.save(); ctx.translate(x * .6, y * .4 + 4); ctx.rotate(a + sw); F('#2F7A3E'); ell(0, -7, 6.5, 8); ctx.fill(); F('#3E9A4E'); ell(-1, -8, 4.5, 6); ctx.fill(); F('#20262E'); ell(-3, -6, 1, 1.6); ctx.fill(); ell(2.6, -9, 1, 1.6); ctx.fill(); ctx.strokeStyle = '#2F7A3E'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -13); ctx.stroke(); ctx.restore(); }); F('#E9E2D2'); rr(-8, 8, 16, 10, 3); ctx.fill(); F('#C9C1AE'); ctx.fillRect(-8, 8, 16, 2); return true; }
      case 'hamster': { sh(14, 10); F('#E9DFC6'); rr(-14, 2, 28, 8, 2); ctx.fill(); ctx.strokeStyle = '#9AA3AD'; ctx.lineWidth = .8; for (let k = -12; k <= 12; k += 3) { ctx.beginPath(); ctx.moveTo(k, -11); ctx.lineTo(k, 2); ctx.stroke(); } ctx.strokeRect(-13, -11, 26, 13); ctx.save(); ctx.translate(5, -3); ctx.strokeStyle = '#4B8DFF'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, 6, 0, TAU); ctx.stroke(); ctx.rotate(t * 7); ctx.lineWidth = .7; for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.stroke(); } ctx.restore(); const hb = Math.abs(Math.sin(t * 14)) * .8; F('#C98A4A'); ell(5, 2 - hb, 3.2, 2.2); ctx.fill(); F('#F4E2C6'); ell(6.6, 2.2 - hb, 1.4, 1); ctx.fill(); F('#20262E'); ctx.fillRect(7, 1 - hb, .8, .8); F('#F2C14E'); ctx.fillRect(-10, -1, 5, 3); return true; }
      case 'arclamp': { const nt = typeof lightK === 'function' ? lightK() : 0; if (nt > 0.2) { const g = ctx.createRadialGradient(12, -8, 2, 12, -8, 30); g.addColorStop(0, 'rgba(255,220,150,' + (0.45 * nt).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,220,150,0)'); F(g); ctx.beginPath(); ctx.arc(12, -8, 30, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(-12, 20, 9, 3.4); ctx.fill(); F('#3A3F47'); ell(-14, 18, 6, 3.2); ctx.fill(); ctx.strokeStyle = '#B4BCC8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-14, 17); ctx.quadraticCurveTo(-14, -26, 12, -18); ctx.stroke(); F('#20262E'); ctx.beginPath(); ctx.arc(12, -15, 6, Math.PI, 0); ctx.fill(); F(nt > 0.2 ? '#FFF2C8' : '#E9ECEF'); ctx.fillRect(7, -15.5, 10, 1.6); return true; }
      case 'skatewall': { F('#3A3F47'); rr(-22, -16, 44, 26, 3); ctx.fill(); F('#4A5260'); ctx.fillRect(-22, -16, 44, 2); [['#FF5CA8', -13, -.15], ['#5FE584', 0, .05], ['#4BC8FF', 13, .2]].forEach(([c, x, a]) => { ctx.save(); ctx.translate(x, -3); ctx.rotate(a); F('#20262E'); rr(-4, -11, 8, 22, 4); ctx.fill(); F(c); rr(-3.4, -10.4, 6.8, 20.8, 3.4); ctx.fill(); F('rgba(255,255,255,.35)'); ctx.fillRect(-1, -6, 2, 12); F('#E9E2D0'); for (const y of [-7, 7]) { ctx.fillRect(-3.6, y - .6, 1.4, 1.2); ctx.fillRect(2.2, y - .6, 1.4, 1.2); } ctx.restore(); }); return true; }
      case 'neonleaf': { F('#14161C'); rr(-18, -18, 36, 32, 5); ctx.fill(); const pu = .6 + .4 * Math.sin(t * 2.2); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, -3, 2, 0, -3, 20); g.addColorStop(0, 'rgba(90,255,140,' + (.35 * pu).toFixed(2) + ')'); g.addColorStop(1, 'rgba(90,255,140,0)'); F(g); ctx.fillRect(-18, -18, 36, 32); ctx.restore(); ctx.globalAlpha = .55 + .45 * pu; cannaLeaf(0, -2, 13, '#7DFFA8'); ctx.globalAlpha = 1; F('#2A2F37'); ctx.fillRect(-1, 14, 2, 4); return true; }
      case 'aquarium': { sh(26, 15); F('#2A2F37'); rr(-26, 4, 52, 11, 2); ctx.fill(); const g = ctx.createLinearGradient(0, -16, 0, 6); g.addColorStop(0, '#5FC8F0'); g.addColorStop(1, '#2A7FB8'); F(g); rr(-24, -16, 48, 21, 2); ctx.fill(); F('#E8D6A0'); ctx.fillRect(-24, 2, 48, 3); F('#3E9A4E'); for (const x of [-18, -14, 15, 19]) { ctx.save(); ctx.translate(x, 2); ctx.rotate(Math.sin(t * 1.5 + x) * .15); ctx.fillRect(-1, -9, 2, 9); ctx.restore(); } [['#FF8A3A', 0], ['#FFD24A', 1], ['#FF5CA8', 2]].forEach(([c, k]) => { const ph = (t * (0.12 + k * .03) + k * .33) % 1, dir = Math.floor(ph * 2) ? -1 : 1, xx = dir > 0 ? -18 + (ph % .5) * 72 : 18 - (ph % .5) * 72, yy = -10 + k * 4 + Math.sin(t * 2 + k) * 1.2; ctx.save(); ctx.translate(xx, yy); ctx.scale(dir, 1); F(c); ell(0, 0, 3.2, 1.8); ctx.fill(); ctx.beginPath(); ctx.moveTo(-2.8, 0); ctx.lineTo(-5, -1.6); ctx.lineTo(-5, 1.6); ctx.closePath(); ctx.fill(); F('#14161C'); ctx.fillRect(1.6, -.6, .7, .7); ctx.restore(); }); F('rgba(255,255,255,.6)'); for (let k = 0; k < 4; k++) { const ph = (t * .7 + k / 4) % 1; ctx.beginPath(); ctx.arc(10 + Math.sin(ph * 9) * 1, 2 - ph * 17, .9, 0, TAU); ctx.fill(); } F('rgba(255,255,255,.18)'); ctx.fillRect(-24, -16, 48, 2); ctx.strokeStyle = '#20262E'; ctx.lineWidth = 1.4; ctx.strokeRect(-24, -16, 48, 21); return true; }
      case 'homebar': { sh(30, 15); F('#2A2F37'); ctx.fillRect(-28, -16, 56, 6); const C = ['#5FB86A', '#C23B3B', '#F2C14E', '#4BC8FF', '#B58CFF', '#E9ECEF', '#8A5A34']; for (let k = 0; k < 7; k++) { F(C[k]); ctx.fillRect(-25 + k * 7.6, -21, 3.4, 6); ctx.fillRect(-24.2 + k * 7.6, -23, 1.8, 2); } F('#6B4A2E'); rr(-30, -8, 60, 12, 3); ctx.fill(); F('#8A6240'); ctx.fillRect(-30, -8, 60, 3); F('rgba(220,240,255,.6)'); for (const x of [-16, -8, 10]) ctx.fillRect(x, -10.5, 2.6, 3); for (const x of [-12, 12]) { F('#20262E'); ctx.fillRect(x - .8, 6, 1.6, 8); F('#C23B3B'); ell(x, 6, 5, 2.6); ctx.fill(); } return true; }
      case 'massage': { const v = Math.sin(t * 38) * .35; ctx.translate(v, 0); sh(16, 16); F('#6B1E26'); rr(-14, -6, 28, 22, 6); ctx.fill(); F('#A8323C'); rr(-11, -18, 22, 18, 6); ctx.fill(); F('#C24A54'); rr(-9, -4, 18, 14, 4); ctx.fill(); F('#8E2830'); for (const y of [-14, -10, -6]) ctx.fillRect(-8, y, 16, 1.2); F('#20262E'); rr(10, 0, 6, 4, 1.5); ctx.fill(); F(Math.sin(t * 6) > 0 ? '#5FE584' : '#2E7D3E'); ctx.fillRect(12, 1, 2, 2); return true; }
      case 'koipond': { sh(26, 17); F('#8A8F96'); ell(0, 0, 26, 19); ctx.fill(); F('#6C727A'); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; ell(Math.cos(a) * 23, Math.sin(a) * 16.5, 4, 3); ctx.fill(); } const g = ctx.createRadialGradient(0, -2, 2, 0, 0, 22); g.addColorStop(0, '#5FC0E0'); g.addColorStop(1, '#2A6F98'); F(g); ell(0, 0, 20, 14); ctx.fill(); [['#FF8A3A', 0], ['#F4F4F8', Math.PI]].forEach(([c, o]) => { const a = t * .7 + o, x = Math.cos(a) * 11, y = Math.sin(a) * 7; ctx.save(); ctx.translate(x, y); ctx.rotate(a + Math.PI / 2); F(c); ell(0, 0, 3.6, 1.6); ctx.fill(); ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(-5.4, -1.6); ctx.lineTo(-5.4, 1.6); ctx.closePath(); ctx.fill(); if (c === '#F4F4F8') { F('#E05555'); ell(1, 0, 1.2, .8); ctx.fill(); } ctx.restore(); }); F('#3E9A4E'); ctx.beginPath(); ctx.arc(9, -6, 4, .3, TAU - .3); ctx.lineTo(9, -6); ctx.fill(); F('#FF9CC8'); ctx.beginPath(); ctx.arc(9.5, -6.5, 1.6, 0, TAU); ctx.fill(); F('rgba(255,255,255,.25)'); ell(-6, -5, 6, 1.4); ctx.fill(); return true; }
      case 'bigtv': { sh(32, 17); F('#14161C'); rr(-32, -18, 64, 28, 3); ctx.fill(); const hue = (t * 25) % 360, g = ctx.createLinearGradient(-29, 0, 29, 0); g.addColorStop(0, 'hsl(' + hue + ',70%,45%)'); g.addColorStop(1, 'hsl(' + ((hue + 80) % 360) + ',70%,55%)'); F(g); ctx.fillRect(-29, -15, 58, 22); F('rgba(255,255,255,.18)'); ell(-6 + Math.sin(t * .8) * 12, -6, 7, 5); ctx.fill(); F('rgba(0,0,0,.35)'); ctx.fillRect(-29, 4, 58, 3); F('#2A2F37'); for (const x of [-36, 32]) { rr(x, -10, 5, 22, 1.5); ctx.fill(); } F('#4A5260'); for (const x of [-33.5, 34.5]) { ctx.beginPath(); ctx.arc(x, -4, 1.6, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x, 4, 2.2, 0, TAU); ctx.fill(); } F('#20262E'); rr(-14, 12, 28, 5, 1.5); ctx.fill(); return true; }
      case 'goldbars': { sh(14, 8); const bar = (x, y) => { F('#B8891E'); ctx.beginPath(); ctx.moveTo(x - 6, y + 3); ctx.lineTo(x + 6, y + 3); ctx.lineTo(x + 4.6, y - 1.6); ctx.lineTo(x - 4.6, y - 1.6); ctx.closePath(); ctx.fill(); F('#F2C14E'); ctx.fillRect(x - 4.2, y - 1.6, 8.4, 2.2); F('#FFE89A'); ctx.fillRect(x - 3, y - 1.2, 3, .6); }; for (const [x, y] of [[-12, 4], [0, 4], [12, 4], [-6, -1], [6, -1], [0, -6]]) bar(x, y); const sp = (t * .9) % 1; ctx.globalAlpha = Math.sin(sp * Math.PI); F('#FFFFFF'); const sx = -10 + sp * 20, sy = -6 + (sp * 13 % 8); ctx.fillRect(sx - .4, sy - 2, .8, 4); ctx.fillRect(sx - 2, sy - .4, 4, .8); ctx.globalAlpha = 1; return true; }
    }
    return false;
  }
  function drawNewDec(id, t) {
    const sh = (w, y) => { ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(0, y, w, 3.6); ctx.fill(); };
    switch (id) {
      case 'rugstripe': { ctx.fillStyle = '#2E5E9A'; rr(-30, -22, 60, 44, 3); ctx.fill(); for (let k = 0; k < 5; k++) { ctx.fillStyle = k % 2 ? '#E9D5A8' : '#C0583A'; ctx.fillRect(-27, -19 + k * 8, 54, 5); } ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < 7; k++) ctx.fillRect(-30, -20 + k * 6.4, 2.5, 2); for (let k = 0; k < 7; k++) ctx.fillRect(27.5, -20 + k * 6.4, 2.5, 2); return true; }
      case 'lantern': { sh(8, 13); const fl = 0.75 + 0.25 * Math.sin(t * 9) * Math.sin(t * 5.3); const g = ctx.createRadialGradient(0, -2, 0, 0, -2, 18); g.addColorStop(0, 'rgba(255,190,90,' + (0.5 * fl).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,190,90,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -2, 18, 0, TAU); ctx.fill(); ctx.fillStyle = '#3A3F47'; ctx.fillRect(-6, 8, 12, 3); ctx.fillRect(-6, -10, 12, 2); ctx.fillRect(-1, -14, 2, 4); ctx.fillStyle = 'rgba(255,225,150,.35)'; rr(-5, -8, 10, 16, 2); ctx.fill(); ctx.fillStyle = '#3A3F47'; ctx.fillRect(-6, -8, 1.5, 16); ctx.fillRect(4.5, -8, 1.5, 16); ctx.fillStyle = '#FFD36A'; ctx.beginPath(); ctx.ellipse(0, 1, 2 * fl + 0.6, 4 * fl + 0.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#FFF6C4'; ctx.fillRect(-.7, 0, 1.4, 3); return true; }
      case 'radio': { sh(14, 11); ctx.fillStyle = '#B5773A'; rr(-14, -9, 28, 18, 3); ctx.fill(); ctx.fillStyle = '#8A5628'; ctx.fillRect(-14, 6, 28, 3); ctx.fillStyle = '#2B2F38'; rr(-11, -6, 12, 11, 2); ctx.fill(); ctx.fillStyle = '#4A505C'; for (let k = 0; k < 4; k++) ctx.fillRect(-9.5, -4.5 + k * 2.6, 9, 1); ctx.fillStyle = '#EDE6D6'; ctx.beginPath(); ctx.arc(7, -2, 4.4, 0, TAU); ctx.fill(); ctx.strokeStyle = '#C0583A'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(7, -2); ctx.lineTo(7 + Math.cos(t * 0.8) * 3.4, -2 + Math.sin(t * 0.8) * 3.4); ctx.stroke(); ctx.strokeStyle = '#9AA3AD'; ctx.beginPath(); ctx.moveTo(10, -9); ctx.lineTo(17, -20); ctx.stroke(); for (let k = 0; k < 2; k++) { const ph = (t * 0.7 + k * 0.5) % 1; ctx.strokeStyle = 'rgba(255,255,255,' + (0.6 * (1 - ph)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(-5, -12 - ph * 6, 3 + ph * 4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); } return true; }
      case 'vinyl': { sh(17, 12); ctx.fillStyle = '#2B2F38'; rr(-17, -12, 34, 24, 3); ctx.fill(); ctx.fillStyle = '#3A404B'; ctx.fillRect(-17, 8, 34, 4); ctx.fillStyle = '#14161C'; ctx.beginPath(); ctx.arc(-3, 0, 10, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 0.6; for (let r = 4; r < 10; r += 2) { ctx.beginPath(); ctx.arc(-3, 0, r, 0, TAU); ctx.stroke(); } ctx.save(); ctx.translate(-3, 0); ctx.rotate(t * 3.5); ctx.fillStyle = '#C0583A'; ctx.beginPath(); ctx.arc(0, 0, 3.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#F6E27A'; ctx.fillRect(1.2, -.5, 1.6, 1); ctx.restore(); ctx.strokeStyle = '#C9D4DE'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(13, -9); ctx.lineTo(4 + Math.sin(t * 1.5) * .6, -3); ctx.stroke(); ctx.fillStyle = '#C9D4DE'; ctx.beginPath(); ctx.arc(13, -9, 2, 0, TAU); ctx.fill(); return true; }
      case 'armchair': { sh(18, 15); ctx.fillStyle = '#7A3340'; rr(-16, -16, 32, 20, 7); ctx.fill(); ctx.fillStyle = '#A8505E'; rr(-12, -6, 24, 18, 5); ctx.fill(); ctx.fillStyle = '#8C3D4A'; rr(-19, -8, 7, 21, 3); ctx.fill(); rr(12, -8, 7, 21, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(-9, -3, 18, 2); ctx.fillStyle = '#4E3624'; ctx.fillRect(-17, 13, 3, 3); ctx.fillRect(14, 13, 3, 3); return true; }
      case 'snowglobe': { sh(9, 11); ctx.fillStyle = '#6B4A2E'; rr(-7, 5, 14, 6, 2); ctx.fill(); ctx.fillStyle = 'rgba(190,225,255,.35)'; ctx.beginPath(); ctx.arc(0, -3, 9, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = '#F4F4F8'; ctx.beginPath(); ctx.ellipse(0, 4, 7, 2.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#B5473A'; ctx.fillRect(-2.6, -1, 5.2, 4.4); ctx.beginPath(); ctx.moveTo(-3.6, -1); ctx.lineTo(0, -4.6); ctx.lineTo(3.6, -1); ctx.fill(); for (let k = 0; k < 7; k++) { const ph = (t * 0.35 + k / 7) % 1; ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(Math.sin(k * 2.3 + t) * 6, -10 + ph * 15, 1.2, 1.2); } return true; }
      case 'windchime': { ctx.fillStyle = '#6B4A2E'; ctx.fillRect(-12, -19, 24, 2.4); ctx.strokeStyle = '#9AA3AD'; ctx.lineWidth = 0.8; for (let k = 0; k < 5; k++) { const x0 = -10 + k * 5, sw = Math.sin(t * 1.8 + k * 0.9) * 1.6, len = 10 + (k % 3) * 4; ctx.beginPath(); ctx.moveTo(x0, -17); ctx.lineTo(x0 + sw * 0.4, -12); ctx.stroke(); ctx.fillStyle = k % 2 ? '#C9D4DE' : '#E8C46A'; ctx.fillRect(x0 - 1.4 + sw * 0.5, -12, 2.8, len); } ctx.fillStyle = '#B5473A'; ctx.beginPath(); ctx.arc(0 + Math.sin(t * 1.8) * 1.2, 8, 3, 0, TAU); ctx.fill(); return true; }
      case 'planter': { sh(20, 12); ctx.fillStyle = '#7A5230'; rr(-20, -6, 40, 17, 2); ctx.fill(); ctx.fillStyle = '#4A3322'; ctx.fillRect(-18, -5, 36, 5); ctx.fillStyle = '#5E3F26'; for (let k = -16; k < 18; k += 8) ctx.fillRect(k, -6, 1.6, 17); for (let k = 0; k < 6; k++) { const x = -15 + k * 6, sw = Math.sin(t * 1.5 + k) * 0.8; ctx.fillStyle = k % 2 ? '#2E8B4F' : '#63C174'; ctx.beginPath(); ctx.arc(x + sw, -6, 4.4, 0, TAU); ctx.fill(); if (k % 3 === 1) { ctx.fillStyle = '#E05A4A'; ctx.beginPath(); ctx.arc(x + 2, -4.4, 1.6, 0, TAU); ctx.fill(); } } return true; }
      case 'piggy': { sh(12, 10); ctx.fillStyle = '#F2A0B5'; ell(0, 0, 11, 8); ctx.fill(); ctx.fillStyle = '#E38AA2'; ctx.beginPath(); ctx.moveTo(-6, -6); ctx.lineTo(-3, -11); ctx.lineTo(-1, -6); ctx.fill(); ctx.fillStyle = '#F7B6C6'; ell(10, 1, 3.4, 3); ctx.fill(); ctx.fillStyle = '#B25A74'; ctx.fillRect(9, 0, 1, 2); ctx.fillRect(11.2, 0, 1, 2); ctx.fillStyle = '#20262E'; ctx.fillRect(5, -3, 1.6, 1.6); ctx.fillStyle = '#B25A74'; ctx.fillRect(-4, -7.6, 7, 1.4); ctx.fillStyle = '#E38AA2'; ctx.fillRect(-7, 6, 3, 4); ctx.fillRect(4, 6, 3, 4); ctx.strokeStyle = '#E38AA2'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(-12, -1, 2.4, -1.2, 2.2); ctx.stroke(); const ph = (t * 0.6) % 1; if (ph < 0.5) { ctx.fillStyle = '#F2C14E'; ctx.beginPath(); ctx.arc(-.5, -20 + ph * 24, 2.6, 0, TAU); ctx.fill(); } return true; }
    }
    return false;
  }
  function drawDecorItem(id, x, y, sc) {
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    const t = gt;
    if (drawDec132(id, t) || drawDec130(id, t) || drawDec112(id, t) || drawDec107(id, t) || drawGrowDec(id, t) || drawBrewDec(id, t) || drawMoreDec(id, t) || drawNewDec(id, t) || drawDec106(id, t)) { ctx.restore(); return; }
    if (id === 'roundrug') {
      ctx.fillStyle = '#7F5FA3'; ctx.beginPath(); ctx.arc(0, 0, 31, 0, TAU); ctx.fill();
      ctx.fillStyle = '#E9D5F2'; ctx.beginPath(); ctx.arc(0, 0, 25, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F2A6B8'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, TAU); ctx.fill();
      ctx.fillStyle = '#7F5FA3'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F6D87A'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU); ctx.fill();
    } else if (id === 'leafrug') {
      ctx.fillStyle = '#244B34'; rr(-34, -28, 68, 56, 10); ctx.fill();
      ctx.strokeStyle = '#B9D9A0'; ctx.lineWidth = 2; rr(-30, -24, 60, 48, 7); ctx.stroke();
      ctx.fillStyle = '#6FBF5E'; ctx.strokeStyle = '#6FBF5E';
      [[-80, 11], [-52, 15], [-26, 18], [0, 21], [26, 18], [52, 15], [80, 11]].forEach(([deg, len]) => {
        ctx.save(); ctx.translate(0, 12); ctx.rotate(deg * Math.PI / 180); ell(0, -len * 0.55, 2.7 + len * 0.07, len * 0.55); ctx.fill(); ctx.restore();
      });
      ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, 22); ctx.stroke();
      ctx.strokeStyle = '#2F6B3F'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -8); ctx.stroke();
    } else if (id === 'turntable') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 16, 24, 4); ctx.fill();
      ctx.fillStyle = '#6F5139'; ctx.fillRect(-16, 4, 4, 12); ctx.fillRect(12, 4, 4, 12); ctx.fillRect(-2, 5, 4, 11);
      ctx.fillStyle = '#8B6B4C'; ell(0, 3, 25, 9); ctx.fill(); ctx.fillStyle = '#A07F5C'; ell(0, 1.5, 25, 8.4); ctx.fill();
      ctx.fillStyle = '#E9DFC9'; ell(0, 0, 17, 6.6); ctx.fill(); ctx.strokeStyle = '#B9AD92'; ctx.lineWidth = 1; ell(0, 0, 17, 6.6); ctx.stroke();
      const cl = ['#E0675B', '#F2C75C', '#6FBF73', '#6EA6E0'], pts = [];
      for (let k = 0; k < 4; k++) { const a = t * 0.9 + k * TAU / 4; pts.push({ x: Math.cos(a) * 11.5, y: Math.sin(a) * 4.4 - 1, k }); }
      pts.sort((a, b) => a.y - b.y).forEach(q => {
        ctx.fillStyle = cl[q.k]; ctx.beginPath(); ctx.arc(q.x, q.y - 3, 3.2, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(q.x - 1.6, q.y - 4.6, 1.8, 1.4);
      });
      ctx.fillStyle = '#C9B896'; ctx.beginPath(); ctx.arc(0, -1, 2, 0, TAU); ctx.fill();
    } else if (id === 'starrug') {
      ctx.fillStyle = '#1F2A55'; rr(-34, -24, 68, 48, 9); ctx.fill();
      ctx.strokeStyle = '#F2C14E'; ctx.lineWidth = 1.6; rr(-30, -20, 60, 40, 6); ctx.stroke();
      ctx.fillStyle = '#F6D87A';
      [[-18, -8, 5], [0, 4, 7], [17, -9, 5], [-8, 13, 3.5], [20, 11, 4], [-24, 7, 3]].forEach(([sx, sy, r]) => {
        ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? r * 0.45 : r; ctx[k ? 'lineTo' : 'moveTo'](sx + Math.cos(a) * rad, sy + Math.sin(a) * rad); } ctx.closePath(); ctx.fill();
      });
    } else if (id === 'candles') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 10, 14, 3); ctx.fill();
      ctx.fillStyle = '#C9D2DC'; ell(0, 8, 13, 3.4); ctx.fill();
      [[-7, 6, '#F4E6C8'], [0, 4, '#E8A0A8'], [7, 7, '#F4E6C8']].forEach(([cx, h, col], k) => {
        ctx.fillStyle = col; ctx.fillRect(cx - 2, 7 - h * 1.2 - 3, 4, h * 1.2 + 3);
        const fl = Math.sin(t * 9 + k * 2) * 0.8, top = 7 - h * 1.2 - 3;
        ctx.fillStyle = 'rgba(255,200,90,.25)'; ctx.beginPath(); ctx.arc(cx, top - 3, 6, 0, TAU); ctx.fill();
        ctx.fillStyle = '#FFB547'; ell(cx + fl * 0.5, top - 3, 1.6, 3); ctx.fill(); ctx.fillStyle = '#FFE9A0'; ell(cx + fl * 0.3, top - 2.4, 0.8, 1.6); ctx.fill();
      });
    } else if (id === 'bonsai') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 16, 14, 3.4); ctx.fill();
      ctx.fillStyle = '#7A4F3A'; rr(-9, 6, 18, 10, 2); ctx.fill(); ctx.fillStyle = '#5A3A2A'; ctx.fillRect(-9, 6, 18, 2);
      ctx.strokeStyle = '#6B4A32'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 7); ctx.quadraticCurveTo(-4, 0, 2, -6); ctx.stroke();
      ctx.fillStyle = '#4FA36B'; [[-7, -5, 7, 4.5], [6, -9, 7, 4.5], [0, -13, 8, 5]].forEach(([cx, cy, rx, ry]) => { ell(cx, cy, rx, ry); ctx.fill(); });
      ctx.fillStyle = '#6FBF73'; ell(-1, -14, 4, 2); ctx.fill(); ell(7, -10, 3, 1.6); ctx.fill();
    } else if (id === 'globe') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 20, 12, 3); ctx.fill();
      ctx.fillStyle = '#6F5139'; ctx.fillRect(-1.5, 8, 3, 11); rr(-8, 17, 16, 3, 1.5); ctx.fill();
      ctx.fillStyle = '#4A86C9'; ctx.beginPath(); ctx.arc(0, -2, 12, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(0, -2, 12, 0, TAU); ctx.clip();
      const off = (t * 6) % 40; ctx.fillStyle = '#6FBF73';
      for (let k = -1; k <= 1; k++) { const bx = k * 40 - off; ell(bx - 4, -6, 7, 4); ctx.fill(); ell(bx + 8, 3, 5, 6); ctx.fill(); ell(bx + 18, -4, 6, 3); ctx.fill(); }
      ctx.restore();
      const sh = ctx.createRadialGradient(-4, -6, 2, 0, -2, 13); sh.addColorStop(0, 'rgba(255,255,255,.3)'); sh.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = sh; ctx.beginPath(); ctx.arc(0, -2, 12, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#B8893A'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -2, 13.5, -2.2, 0.9); ctx.stroke();
    } else if (id === 'fan') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 22, 12, 3); ctx.fill();
      ctx.fillStyle = '#8A93A0'; ell(0, 21, 9, 2.6); ctx.fill(); ctx.fillRect(-1.2, -2, 2.4, 22);
      ctx.fillStyle = '#B9C4CF'; ctx.beginPath(); ctx.arc(0, -10, 11, 0, TAU); ctx.fill();
      ctx.fillStyle = '#E6EEF5'; ctx.beginPath(); ctx.arc(0, -10, 9.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#7FB6D8';
      for (let k = 0; k < 3; k++) { const a = t * 14 + k * TAU / 3; ctx.save(); ctx.translate(0, -10); ctx.rotate(a); ell(0, -4.4, 2.2, 4.6); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = '#5E6A78'; ctx.beginPath(); ctx.arc(0, -10, 2, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#8A93A0'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, -10, 10, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -10, 5.5, 0, TAU); ctx.stroke();
    } else if (id === 'lavalamp') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 20, 9, 2.6); ctx.fill();
      ctx.fillStyle = '#5C3A6E'; ctx.beginPath(); ctx.moveTo(-6, 20); ctx.lineTo(6, 20); ctx.lineTo(4, 11); ctx.lineTo(-4, 11); ctx.closePath(); ctx.fill();
      const gl = ctx.createLinearGradient(0, -20, 0, 11); gl.addColorStop(0, '#FF8FB8'); gl.addColorStop(1, '#8A4FD0');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.moveTo(-3.6, 11); ctx.lineTo(3.6, 11); ctx.lineTo(5, -14); ctx.quadraticCurveTo(0, -20, -5, -14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,230,150,.9)';
      for (let k = 0; k < 3; k++) { const ph = (t * 0.35 + k / 3) % 1, by = 8 - ph * 22, rr0 = 2.6 + Math.sin(ph * Math.PI) * 1.6; ell(Math.sin(t + k * 2) * 1.4, by, rr0, rr0 * 1.2); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(-2.6, -12, 1.2, 18);
      ctx.fillStyle = '#5C3A6E'; ctx.beginPath(); ctx.moveTo(-5, -14); ctx.quadraticCurveTo(0, -22, 5, -14); ctx.lineTo(3, -15); ctx.quadraticCurveTo(0, -19, -3, -15); ctx.closePath(); ctx.fill();
    } else if (id === 'easel') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 22, 15, 3); ctx.fill();
      ctx.strokeStyle = '#8B6B4C'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(-13, 22); ctx.lineTo(-4, -12); ctx.moveTo(13, 22); ctx.lineTo(4, -12); ctx.moveTo(0, 22); ctx.lineTo(0, -6); ctx.stroke();
      ctx.fillStyle = '#F4EFE2'; rr(-15, -17, 30, 24, 1.5); ctx.fill();
      ctx.fillStyle = '#9FD3F2'; ctx.fillRect(-13, -15, 26, 14); ctx.fillStyle = '#6FBF73'; ctx.beginPath(); ctx.moveTo(-13, -1); ctx.quadraticCurveTo(-5, -9, 2, -3); ctx.quadraticCurveTo(8, -8, 13, -2); ctx.lineTo(13, 3); ctx.lineTo(-13, 3); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.arc(7, -10, 3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8B6B4C'; ctx.fillRect(-15, 7, 30, 2);
    } else if (id === 'speaker') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 22, 11, 3); ctx.fill();
      ctx.fillStyle = '#2A2D38'; rr(-10, -22, 20, 44, 3); ctx.fill(); ctx.fillStyle = '#3B3F4D'; rr(-8.6, -20.6, 17.2, 41.2, 2.4); ctx.fill();
      const bt = Math.max(0, Math.sin(t * 8)), bt2 = Math.max(0, Math.sin(t * 4));
      ctx.fillStyle = '#14161C'; ctx.beginPath(); ctx.arc(0, -10, 5 + bt2 * 0.8, 0, TAU); ctx.fill(); ctx.fillStyle = '#4DF0C8'; ctx.beginPath(); ctx.arc(0, -10, 1.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#14161C'; ctx.beginPath(); ctx.arc(0, 8, 7.4 + bt * 1.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#4A4F60'; ctx.beginPath(); ctx.arc(0, 8, 5 + bt * 1.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#14161C'; ctx.beginPath(); ctx.arc(0, 8, 2, 0, TAU); ctx.fill();
    } else if (id === 'fridge') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 22, 13, 3); ctx.fill();
      ctx.fillStyle = '#D9E3EA'; rr(-12, -21, 24, 43, 3); ctx.fill(); ctx.fillStyle = '#EEF3F7'; rr(-10.6, -19.6, 21.2, 40.2, 2.4); ctx.fill();
      ctx.fillStyle = '#B4C2CC'; ctx.fillRect(-10.6, -6, 21.2, 1.2); ctx.fillStyle = '#8A97A3'; ctx.fillRect(6, -17, 2, 8); ctx.fillRect(6, -3, 2, 12);
      ctx.fillStyle = '#E05555'; ctx.fillRect(-7, -15, 4, 4); ctx.fillStyle = '#F2C14E'; ctx.fillRect(-7, 0, 5, 3); ctx.fillStyle = '#4DA3E0'; ctx.fillRect(-4, 8, 4, 4);
    } else if (id === 'neon') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 14, 18, 3.5); ctx.fill();
      ctx.fillStyle = '#2A2F3A'; rr(-20, -14, 40, 26, 4); ctx.fill(); ctx.fillStyle = '#1B1F28'; ctx.fillRect(-12, 12, 4, 3); ctx.fillRect(8, 12, 4, 3);
      const fl = Math.sin(t * 19) > 0.93 ? 0.4 : 1;
      ctx.globalAlpha = 0.22 * fl; ctx.strokeStyle = '#FF4FB0'; ctx.lineWidth = 7; rr(-16, -10, 32, 18, 4); ctx.stroke();
      ctx.globalAlpha = fl; ctx.strokeStyle = '#FF7AC8'; ctx.lineWidth = 2; rr(-16, -10, 32, 18, 4); ctx.stroke();
      ctx.fillStyle = '#4DF0E0'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('CHILL', 0, 3); ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    } else if (id === 'trophy') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 22, 14, 3); ctx.fill();
      ctx.fillStyle = '#6F5139'; rr(-14, 12, 28, 10, 2); ctx.fill();
      ctx.fillStyle = 'rgba(170,215,235,.35)'; rr(-13, -22, 26, 36, 3); ctx.fill(); ctx.strokeStyle = '#8B6B4C'; ctx.lineWidth = 1.6; rr(-13, -22, 26, 36, 3); ctx.stroke();
      ctx.fillStyle = '#F2C14E'; ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(6, -12); ctx.lineTo(4, -2); ctx.lineTo(-4, -2); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#F2C14E'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(-7, -9, 3, 1.6, 4.7); ctx.stroke(); ctx.beginPath(); ctx.arc(7, -9, 3, -1.6, 1.5); ctx.stroke();
      ctx.fillStyle = '#F2C14E'; ctx.fillRect(-1, -2, 2, 6); ctx.fillRect(-4, 4, 8, 3);
      const sw = ((t * 0.5) % 1) * 44 - 22; ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.save(); ctx.beginPath(); rr(-13, -22, 26, 36, 3); ctx.clip(); ctx.beginPath(); ctx.moveTo(sw, -22); ctx.lineTo(sw + 6, -22); ctx.lineTo(sw - 10, 14); ctx.lineTo(sw - 16, 14); ctx.closePath(); ctx.fill(); ctx.restore();
    } else if (id === 'fireplace') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 20, 28, 4); ctx.fill();
      ctx.fillStyle = '#8A6A58'; rr(-26, -20, 52, 40, 3); ctx.fill();
      ctx.fillStyle = '#6F5444'; for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) ctx.fillRect(-25 + c * 8.5 + (r % 2) * 4, -19 + r * 10, 7, 0.8);
      ctx.fillStyle = '#B09A86'; rr(-28, -24, 56, 6, 2); ctx.fill();
      ctx.fillStyle = '#1B1412'; rr(-16, -6, 32, 26, 3); ctx.fill();
      ctx.fillStyle = '#6F5139'; ctx.fillRect(-11, 15, 22, 3);
      ctx.fillStyle = 'rgba(255,150,60,.2)'; ctx.beginPath(); ctx.arc(0, 8, 20, 0, TAU); ctx.fill();
      [[-7, 9, '#E8622A'], [0, 12, '#F2862E'], [7, 9, '#E8622A']].forEach(([fx0, h, col], k) => {
        const w = Math.sin(t * 10 + k * 2) * 1.6; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(fx0 - 4, 16); ctx.quadraticCurveTo(fx0 - 3 + w, 16 - h * 0.6, fx0 + w, 16 - h); ctx.quadraticCurveTo(fx0 + 3 + w, 16 - h * 0.6, fx0 + 4, 16); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FFE08A'; ctx.beginPath(); ctx.moveTo(fx0 - 2, 16); ctx.quadraticCurveTo(fx0 + w * 0.6, 16 - h * 0.45, fx0 + 2, 16); ctx.closePath(); ctx.fill();
      });
    } else if (id === 'piano') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 18, 30, 4); ctx.fill();
      ctx.fillStyle = '#14161C'; rr(-28, -14, 56, 22, 4); ctx.fill(); ctx.fillStyle = '#242832'; rr(-26, -12, 52, 6, 2); ctx.fill();
      ctx.fillStyle = '#F4F4F8'; ctx.fillRect(-24, -4, 48, 8);
      ctx.fillStyle = '#B8BEC8'; for (let k = 0; k < 11; k++) ctx.fillRect(-24 + k * 4.36, -4, 0.6, 8);
      ctx.fillStyle = '#14161C'; [0, 1, 3, 4, 5, 7, 8].forEach(k => ctx.fillRect(-21 + k * 4.36, -4, 2.6, 4.8));
      ctx.fillRect(-24, 8, 3, 9); ctx.fillRect(21, 8, 3, 9);
      ctx.fillStyle = '#8B3A3A'; rr(-8, 11, 16, 6, 2); ctx.fill();
      const pk = Math.floor(t * 3) % 11; ctx.fillStyle = 'rgba(255,255,255,.0)';
    } else if (id === 'arcade') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 22, 14, 3); ctx.fill();
      ctx.fillStyle = '#4B3A8C'; rr(-13, -24, 26, 46, 3); ctx.fill(); ctx.fillStyle = '#2E2358'; ctx.fillRect(-13, 2, 26, 2);
      ctx.fillStyle = '#E05555'; ctx.fillRect(-11, -23, 22, 4); ctx.fillStyle = '#F2C14E'; ctx.font = 'bold 4px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ARCADE', 0, -20); ctx.textAlign = 'left';
      ctx.fillStyle = '#0E1018'; rr(-10, -17, 20, 17, 2); ctx.fill();
      const f = Math.floor(t * 4) % 4, cols = ['#4DF0C8', '#FF4FB0', '#F2C14E', '#7FB0FF'];
      for (let k = 0; k < 6; k++) { ctx.fillStyle = cols[(k + f) % 4]; ctx.fillRect(-8 + (k % 3) * 6, -15 + Math.floor(k / 3) * 5 + ((k + f) % 2), 4, 3); }
      ctx.fillStyle = '#F2C14E'; ctx.fillRect(-1, -4, 2, 3);
      ctx.fillStyle = '#2E2358'; ctx.fillRect(-9, 6, 18, 6);
      ctx.fillStyle = '#E05555'; ctx.beginPath(); ctx.arc(-5, 9, 2, 0, TAU); ctx.fill(); ctx.fillStyle = '#4DA3E0'; ctx.beginPath(); ctx.arc(1, 9, 1.4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(5, 9, 1.4, 0, TAU); ctx.fill();
    } else if (id === 'gnome') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 13, 8, 2.4); ctx.fill();
      ctx.fillStyle = '#3F7FCF'; rr(-5, 1, 10, 12, 2); ctx.fill();
      ctx.fillStyle = '#6B4524'; ctx.fillRect(-5, 7, 10, 2); ctx.fillStyle = '#F2C14E'; ctx.fillRect(-1, 7, 2, 2);
      ctx.fillStyle = '#F1C9A5'; ctx.beginPath(); ctx.arc(0, -3, 4.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#E8908F'; ctx.beginPath(); ctx.arc(0.4, -2.4, 1.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F4F4F8'; ctx.beginPath(); ctx.moveTo(-4.4, -1.4); ctx.quadraticCurveTo(0, 10, 4.4, -1.4); ctx.quadraticCurveTo(0, 1.8, -4.4, -1.4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#E64B4B'; ctx.beginPath(); ctx.moveTo(-5.2, -5); ctx.lineTo(1, -17.5); ctx.lineTo(5.2, -5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#14161C'; ctx.fillRect(-2.6, -4.2, 1.2, 1.2); ctx.fillRect(1.4, -4.2, 1.2, 1.2);
    } else if (id === 'dartboard') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 18, 14, 3); ctx.fill();
      ctx.fillStyle = '#5A3F2A'; rr(-14, -16, 28, 32, 3); ctx.fill(); ctx.fillStyle = '#6F5139'; rr(-12.6, -14.6, 25.2, 29.2, 2.4); ctx.fill();
      ctx.fillStyle = '#14161C'; ctx.beginPath(); ctx.arc(0, -1, 11.4, 0, TAU); ctx.fill();
      for (let k = 0; k < 10; k++) { ctx.fillStyle = k % 2 ? '#E8E2D0' : '#2A2D38'; ctx.beginPath(); ctx.moveTo(0, -1); ctx.arc(0, -1, 10.2, k * TAU / 10, (k + 1) * TAU / 10); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = '#D33F3F'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -1, 8.6, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -1, 4.8, 0, TAU); ctx.stroke();
      ctx.strokeStyle = '#2E9B4F'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(0, -1, 6.7, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#2E9B4F'; ctx.beginPath(); ctx.arc(0, -1, 2.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#D33F3F'; ctx.beginPath(); ctx.arc(0, -1, 1, 0, TAU); ctx.fill();
      [[3, -4, 0.6], [-4.5, 2, 2.5], [0.5, 4.5, 1.2]].forEach(([dx, dy, a]) => { const ex = dx + Math.cos(a) * 5, ey = dy + Math.sin(a) * 5 - 2; ctx.strokeStyle = '#B8BEC8'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.fillStyle = '#E05555'; ctx.fillRect(ex - 1.2, ey - 1.2, 2.4, 2.4); });
    } else if (id === 'mirror') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 26, 12, 2.8); ctx.fill();
      ctx.fillStyle = '#8A6A3A'; ctx.fillRect(-9, 21, 3, 6); ctx.fillRect(6, 21, 3, 6);
      ctx.fillStyle = '#B8893A'; rr(-12, -26, 24, 48, 12); ctx.fill();
      const mg = ctx.createLinearGradient(-10, -24, 10, 20); mg.addColorStop(0, '#CFE8F2'); mg.addColorStop(1, '#8FB8CC');
      ctx.fillStyle = mg; rr(-10, -24, 20, 44, 10); ctx.fill();
      ctx.save(); rr(-10, -24, 20, 44, 10); ctx.clip();
      ctx.fillStyle = 'rgba(40,70,60,.45)'; ell(2, 8, 4, 8); ctx.fill(); ctx.beginPath(); ctx.arc(2, -6, 3.2, 0, TAU); ctx.fill();
      const sw = ((t * 0.35) % 1) * 70 - 35; ctx.fillStyle = 'rgba(255,255,255,.38)'; ctx.beginPath(); ctx.moveTo(sw, -24); ctx.lineTo(sw + 6, -24); ctx.lineTo(sw - 14, 20); ctx.lineTo(sw - 20, 20); ctx.closePath(); ctx.fill();
      ctx.restore();
    } else if (id === 'guitar') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 22, 10, 2.6); ctx.fill();
      ctx.strokeStyle = '#3B3F4D'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-9, 22); ctx.lineTo(0, 13); ctx.lineTo(9, 22); ctx.moveTo(0, 13); ctx.lineTo(0, 22); ctx.stroke();
      ctx.fillStyle = '#6B4A2E'; ctx.fillRect(-1.6, -17, 3.2, 20);
      ctx.fillStyle = '#3B2A1C'; rr(-3.2, -22, 6.4, 6.4, 1.2); ctx.fill();
      ctx.fillStyle = '#D9D9E0'; ctx.fillRect(-4.2, -21, 1.2, 1.4); ctx.fillRect(3, -21, 1.2, 1.4); ctx.fillRect(-4.2, -18, 1.2, 1.4); ctx.fillRect(3, -18, 1.2, 1.4);
      ctx.fillStyle = '#C97B3A'; ell(0, 8, 8, 6.4); ctx.fill(); ell(0, 1, 6, 5); ctx.fill();
      ctx.fillStyle = '#E09A55'; ell(0, 8, 6.6, 5.2); ctx.fill(); ell(0, 1, 4.8, 3.8); ctx.fill();
      ctx.fillStyle = '#2A1B12'; ctx.beginPath(); ctx.arc(0, 5, 2.4, 0, TAU); ctx.fill(); ctx.fillRect(-3, 11, 6, 1.4);
      ctx.strokeStyle = 'rgba(240,235,220,.7)'; ctx.lineWidth = 0.5; ctx.beginPath(); for (let k = -1; k <= 1; k++) { ctx.moveTo(k * 0.8, -16); ctx.lineTo(k * 0.8, 11); } ctx.stroke();
    } else if (id === 'punchbag') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 25, 10, 2.6); ctx.fill();
      ctx.save(); ctx.translate(0, -26); ctx.rotate(Math.sin(t * 1.5) * 0.05);
      ctx.strokeStyle = '#8A93A0'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-5, 8); ctx.lineTo(0, 0); ctx.lineTo(5, 8); ctx.stroke();
      ctx.fillStyle = '#C0392B'; rr(-8, 8, 16, 40, 6); ctx.fill();
      ctx.fillStyle = '#D9574A'; rr(-6.4, 9.5, 5, 37, 3); ctx.fill();
      ctx.fillStyle = '#14161C'; ctx.fillRect(-8, 20, 16, 2.4); ctx.fillRect(-8, 36, 16, 2.4);
      ctx.fillStyle = '#F2C14E'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BOX', 0, 31); ctx.textAlign = 'left';
      ctx.restore();
    } else if (id === 'tree') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 27, 15, 3); ctx.fill();
      ctx.fillStyle = '#6B4524'; ctx.fillRect(-3, 19, 6, 8);
      [['#2F7A4A', -2, 22, 16], ['#3C9059', -12, 11, 13], ['#4BA567', -22, 1, 10]].forEach(([c, ay, by, hw]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, ay); ctx.lineTo(hw, by); ctx.lineTo(-hw, by); ctx.closePath(); ctx.fill(); });
      const lc = ['#FF5C5C', '#FFD24A', '#6FD0FF', '#B58CFF'];
      [[-6, 17], [7, 15], [0, 9], [-8, 8], [6, 4], [-3, -4], [3, -10], [0, -16]].forEach(([lx, ly], k) => { const on = Math.sin(t * 4 + k * 1.9) > -0.2; ctx.fillStyle = on ? lc[k % 4] : '#3A3F4D'; ctx.beginPath(); ctx.arc(lx, ly, 1.6, 0, TAU); ctx.fill(); if (on) { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(lx - 0.5, ly - 1, 1, 1); } });
      ctx.fillStyle = '#FFD24A'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rad = k % 2 ? 1.8 : 4; ctx[k ? 'lineTo' : 'moveTo'](Math.cos(a) * rad, -24 + Math.sin(a) * rad); } ctx.closePath(); ctx.fill();
    } else if (id === 'coffee') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 18, 14, 3); ctx.fill();
      ctx.fillStyle = '#6F5139'; rr(-13, 7, 26, 11, 2); ctx.fill(); ctx.fillStyle = '#8B6B4C'; ctx.fillRect(-13, 7, 26, 2.4);
      ctx.fillStyle = '#3A3F4A'; rr(-10, -15, 20, 22, 3); ctx.fill(); ctx.fillStyle = '#555B68'; ctx.fillRect(-10, -15, 20, 5);
      ctx.fillStyle = '#14161C'; ctx.fillRect(-7, -8, 14, 8); ctx.fillStyle = '#4DF0C8'; ctx.fillRect(-5, -13.4, 3, 1.6); ctx.fillStyle = '#E05555'; ctx.beginPath(); ctx.arc(5, -12.6, 1.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8A93A0'; ctx.fillRect(-1.4, -1, 2.8, 4);
      ctx.fillStyle = '#F4F4F8'; rr(-4, 2, 8, 5.4, 1.4); ctx.fill(); ctx.fillStyle = '#5A3A22'; ctx.fillRect(-3, 2.6, 6, 1.4);
      for (let k = 0; k < 3; k++) { const ph = (t * 0.7 + k / 3) % 1; ctx.fillStyle = 'rgba(235,240,247,' + (0.5 * (1 - ph)) + ')'; ctx.beginPath(); ctx.arc(Math.sin(t * 3 + k * 2) * 2, 1 - ph * 14, 1.6 + ph * 2.4, 0, TAU); ctx.fill(); }
    } else if (id === 'hammock') {
      const sg = Math.sin(t * 1.1) * 1.6;
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 14, 30, 3); ctx.fill();
      ctx.fillStyle = '#6F5139'; rr(-32, -12, 4, 26, 1.5); ctx.fill(); rr(28, -12, 4, 26, 1.5); ctx.fill();
      ctx.fillStyle = '#E8A24A'; ctx.beginPath(); ctx.moveTo(-29, -8); ctx.quadraticCurveTo(0, 13 + sg, 29, -8); ctx.lineTo(29, -3); ctx.quadraticCurveTo(0, 20 + sg, -29, -3); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#C9772A'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-29, -8); ctx.quadraticCurveTo(0, 13 + sg, 29, -8); ctx.stroke();
      ctx.fillStyle = '#F4F4F8'; ell(-14, 2.5 + sg * 0.4, 5, 2.6); ctx.fill();
    } else if (id === 'terrarium') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 12, 18, 3); ctx.fill();
      ctx.fillStyle = '#3B2A1C'; rr(-17, 4, 34, 8, 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,170,60,.18)'; ctx.fillRect(-16, -11, 32, 16);
      ctx.fillStyle = '#D9BF8A'; ctx.fillRect(-16, 0, 32, 5);
      ctx.fillStyle = '#8A8F98'; ell(9, 0, 5, 3); ctx.fill();
      ctx.fillStyle = '#4FA36B'; for (let k = 0; k < 4; k++) { ctx.save(); ctx.translate(-10, 1); ctx.rotate((k - 1.5) * 0.5); ell(0, -5, 1.8, 5.5); ctx.fill(); ctx.restore(); }
      const lx = Math.sin(t * 0.6) * 7 + 1, dir = Math.cos(t * 0.6) >= 0 ? 1 : -1;
      ctx.save(); ctx.translate(lx, -1.4); ctx.scale(dir, 1);
      ctx.fillStyle = '#6FBF5E'; ell(0, 0, 4, 1.7); ctx.fill(); ctx.beginPath(); ctx.arc(4.2, -0.3, 1.6, 0, TAU); ctx.fill(); ctx.fillRect(-2, 1, 1, 2); ctx.fillRect(2, 1, 1, 2);
      ctx.strokeStyle = '#6FBF5E'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-4, 0); ctx.quadraticCurveTo(-8, 1, -9, -1.5); ctx.stroke();
      ctx.restore();
      ctx.strokeStyle = '#8FB8CC'; ctx.lineWidth = 1.4; rr(-16, -11, 32, 16, 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-14, -9, 3, 12);
      ctx.fillStyle = '#C9D2DC'; ctx.fillRect(-4, -12, 8, 2); ctx.fillStyle = 'rgba(255,200,90,.9)'; ctx.fillRect(-2, -10.4, 4, 1.4);
    } else if (id === 'popcorn') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 22, 12, 3); ctx.fill();
      ctx.fillStyle = '#B83A3A'; rr(-11, 8, 22, 13, 2); ctx.fill(); ctx.fillStyle = '#E8E2D0'; ctx.fillRect(-11, 12, 22, 2);
      ctx.fillStyle = '#14161C'; ctx.beginPath(); ctx.arc(-7, 22, 2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(7, 22, 2, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,245,200,.55)'; rr(-10, -14, 20, 23, 2); ctx.fill();
      for (let k = 0; k < 12; k++) { const px = ((k * 37) % 15) - 7, bounce = k % 3 === 0 ? Math.abs(Math.sin(t * 5 + k * 1.7)) * 11 : 0, py = 5 - (k % 4) * 0.6 - bounce; ctx.fillStyle = k % 2 ? '#FFF3C4' : '#F7E08A'; ctx.beginPath(); ctx.arc(px, py, 2.1, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#E0B040'; ctx.lineWidth = 1.6; rr(-10, -14, 20, 23, 2); ctx.stroke();
      ctx.fillStyle = '#D33F3F'; rr(-13, -22, 26, 8, 2); ctx.fill(); ctx.fillStyle = '#F2C14E'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('POP', 0, -16); ctx.textAlign = 'left';
    } else if (id === 'telescope') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 24, 14, 3); ctx.fill();
      ctx.strokeStyle = '#3B3F4D'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(-13, 24); ctx.moveTo(0, 2); ctx.lineTo(13, 24); ctx.moveTo(0, 2); ctx.lineTo(1, 24); ctx.stroke();
      ctx.save(); ctx.rotate(0.75);
      ctx.fillStyle = '#C9D2DC'; rr(-4, -22, 8, 30, 2); ctx.fill();
      ctx.fillStyle = '#4A86C9'; ctx.fillRect(-4, -14, 8, 2); ctx.fillRect(-4, -4, 8, 2);
      ctx.fillStyle = '#8A93A0'; rr(-5.4, -25, 10.8, 5, 1.5); ctx.fill();
      ctx.fillStyle = 'rgba(140,200,255,.85)'; ctx.fillRect(-4, -25, 8, 1.4);
      ctx.fillStyle = '#3B3F4D'; rr(-2, 8, 4, 6, 1); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#4A86C9'; ctx.beginPath(); ctx.arc(0, 2, 2.6, 0, TAU); ctx.fill();
    } else if (id === 'drumset') {
      const hit = Math.max(0, Math.sin(t * 8)), hit2 = Math.max(0, Math.sin(t * 8 + 2.4));
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 19, 24, 3.6); ctx.fill();
      ctx.strokeStyle = '#8A93A0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-17, -9); ctx.lineTo(-17, 8); ctx.moveTo(17, -11); ctx.lineTo(17, 6); ctx.stroke();
      ctx.fillStyle = '#F2C14E'; ell(-17, -10 + hit * 1.2, 8.5, 2.6); ctx.fill(); ell(17, -12 + hit2 * 1.2, 9, 2.8); ctx.fill();
      ctx.fillStyle = '#FFE08A'; ell(-17, -10.6 + hit * 1.2, 5, 1); ctx.fill();
      [[-7, -5, 6.4], [7.5, -5, 6.4]].forEach(([tx, ty, r], k) => { ctx.fillStyle = '#B83A3A'; ctx.beginPath(); ctx.arc(tx, ty, r, 0, TAU); ctx.fill(); ctx.fillStyle = (k ? hit2 : hit) > 0.8 ? '#FFFFFF' : '#E8E2D0'; ctx.beginPath(); ctx.arc(tx, ty, r - 1.6, 0, TAU); ctx.fill(); });
      ctx.fillStyle = '#C9D2DC'; ell(-18, 7, 7.6, 4.4); ctx.fill(); ctx.fillStyle = '#F4F4F8'; ell(-18, 6.4, 6.4, 3.4); ctx.fill();
      ctx.fillStyle = '#7A2828'; ctx.beginPath(); ctx.arc(1, 8, 12, 0, TAU); ctx.fill(); ctx.fillStyle = '#F4F4F8'; ctx.beginPath(); ctx.arc(1, 8, 10, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#B83A3A'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(1, 8, 6, 0, TAU); ctx.stroke(); ctx.fillStyle = '#B83A3A'; ctx.beginPath(); ctx.arc(1, 8, 2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2A2D38'; ell(18, 14, 5, 2.6); ctx.fill();
      ctx.strokeStyle = '#E8D2A0'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-10, -14); ctx.lineTo(-7 + hit * 2, -6 - hit); ctx.moveTo(10, -14); ctx.lineTo(7.5 - hit2 * 2, -6 - hit2); ctx.stroke();
    } else if (id === 'chandelier') {
      const gl = ctx.createRadialGradient(0, 0, 3, 0, 0, 30); gl.addColorStop(0, 'rgba(255,214,130,.38)'); gl.addColorStop(1, 'rgba(255,214,130,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 30, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#B8893A'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(0, 0, 14, 0, TAU); ctx.stroke(); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, 7, 0, TAU); ctx.stroke();
      ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * TAU / 6; ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7); ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); } ctx.stroke();
      for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + 0.2, bx = Math.cos(a) * 14, by = Math.sin(a) * 14, fl = 0.75 + Math.sin(t * 7 + k * 1.3) * 0.25; ctx.fillStyle = 'rgba(255,233,160,' + fl + ')'; ctx.beginPath(); ctx.arc(bx, by, 2.8, 0, TAU); ctx.fill(); ctx.fillStyle = '#FFF6D0'; ctx.beginPath(); ctx.arc(bx, by, 1.2, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(200,230,255,.85)'; for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + 0.5, cx = Math.cos(a) * 10.5, cy = Math.sin(a) * 10.5 + 3; ctx.beginPath(); ctx.moveTo(cx, cy - 2.6); ctx.lineTo(cx + 1.6, cy); ctx.lineTo(cx, cy + 3); ctx.lineTo(cx - 1.6, cy); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = '#B8893A'; ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill();
    } else if (id === 'jukebox') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 24, 15, 3); ctx.fill();
      ctx.fillStyle = '#7B2D3A'; ctx.beginPath(); ctx.moveTo(-14, 23); ctx.lineTo(-14, -6); ctx.quadraticCurveTo(-14, -25, 0, -25); ctx.quadraticCurveTo(14, -25, 14, -6); ctx.lineTo(14, 23); ctx.closePath(); ctx.fill();
      const jc = ['#FF5C8A', '#FFD24A', '#4DF0C8', '#7FB0FF'], jf = Math.floor(t * 4);
      ctx.lineWidth = 2.2; for (let k = 0; k < 4; k++) { ctx.strokeStyle = jc[(k + jf) % 4]; ctx.beginPath(); ctx.arc(0, -7, 10 + k * 1.1, Math.PI * 1.03, Math.PI * 1.97); ctx.stroke(); }
      ctx.fillStyle = '#1A1218'; rr(-9, -11, 18, 13, 3); ctx.fill();
      ctx.fillStyle = '#2A2630'; ctx.beginPath(); ctx.arc(0, -4.5, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#F2C14E'; ctx.beginPath(); ctx.arc(0, -4.5, 1.8, 0, TAU); ctx.fill();
      const ra = t * 5; ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, -4.5, 3.4, ra, ra + 1.4); ctx.stroke();
      ctx.fillStyle = '#3A1A22'; rr(-9, 5, 18, 12, 2); ctx.fill(); ctx.strokeStyle = '#F2C14E'; ctx.lineWidth = 0.7; ctx.beginPath(); for (let k = -3; k <= 3; k++) { ctx.moveTo(k * 2.5, 6); ctx.lineTo(k * 2.5, 16); } ctx.stroke();
      ctx.fillStyle = '#F2C14E'; ctx.fillRect(-4, 19, 8, 2);
    } else if (id === 'kicker') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 16, 30, 3); ctx.fill();
      ctx.fillStyle = '#3B2A1C'; ctx.fillRect(-28, 10, 4, 6); ctx.fillRect(24, 10, 4, 6);
      ctx.fillStyle = '#5A3F2A'; rr(-30, -14, 60, 26, 3); ctx.fill();
      ctx.fillStyle = '#2E8B4F'; rr(-27, -11, 54, 20, 2); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(0, -11); ctx.lineTo(0, 9); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -1, 5, 0, TAU); ctx.stroke(); ctx.strokeRect(-27, -6, 7, 10); ctx.strokeRect(20, -6, 7, 10);
      for (let k = 0; k < 4; k++) { const rx = -18 + k * 12, off = Math.sin(t * 2.6 + k * 1.5) * 3; ctx.strokeStyle = '#C9D2DC'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(rx, -14); ctx.lineTo(rx, 12); ctx.stroke(); ctx.fillStyle = '#14161C'; ctx.fillRect(rx - 1.6, -16, 3.2, 3); ctx.fillStyle = k % 2 ? '#3B82D6' : '#D33F3F'; for (let q = -1; q <= 1; q++) ctx.fillRect(rx - 2, -1 + q * 6 + off - 2, 4, 4); }
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(Math.sin(t * 1.3) * 18, -1 + Math.sin(t * 2.1) * 5, 1.8, 0, TAU); ctx.fill();
    } else if (id === 'pooltable') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 20, 34, 3.6); ctx.fill();
      ctx.fillStyle = '#3B2A1C'; ctx.fillRect(-32, 12, 5, 8); ctx.fillRect(27, 12, 5, 8);
      ctx.fillStyle = '#5A3524'; rr(-34, -17, 68, 32, 5); ctx.fill();
      ctx.fillStyle = '#1B6B3C'; rr(-30, -13, 60, 24, 3); ctx.fill();
      ctx.fillStyle = '#2E8B4F'; rr(-28, -11, 56, 20, 2); ctx.fill();
      ctx.fillStyle = '#0E0E10'; [[-28, -11], [28, -11], [-28, 9], [28, 9], [0, -11.5], [0, 9.5]].forEach(([px, py]) => { ctx.beginPath(); ctx.arc(px, py, 3.2, 0, TAU); ctx.fill(); });
      const bc = ['#F2C14E', '#3B82D6', '#D33F3F', '#7A3FA0', '#E8833A', '#2E9B4F'];
      [[12, -1], [16, -3.6], [16, 1.6], [20, -6.2], [20, -1], [20, 4.2]].forEach(([bx, by], k) => { ctx.fillStyle = bc[k]; ctx.beginPath(); ctx.arc(bx, by, 2.3, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(bx - 1, by - 1.4, 1, 1); });
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(-14, -1, 2.3, 0, TAU); ctx.fill();
      const cu = Math.sin(t * 2) * 2;
      ctx.strokeStyle = '#E8D2A0'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-31 + cu, 4); ctx.lineTo(-17 + cu, 0); ctx.stroke(); ctx.strokeStyle = '#5A3A22'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-36 + cu, 5.2); ctx.lineTo(-31 + cu, 4); ctx.stroke();
    } else if (id === 'flowers') {
      const sw = Math.sin(t * 1.3) * 1.2;
      [[-5, -12, '#F08FB0'], [0, -16, '#FFD76A'], [5, -11, '#FFFFFF'], [-1, -9, '#B79AD0']].forEach(([fx, fy, col], k) => {
        ctx.strokeStyle = '#4E9A5A'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(fx * 0.4, 4); ctx.quadraticCurveTo(fx * 0.7 + sw, -4, fx + sw * (k % 2 ? 1 : -1), fy); ctx.stroke();
        const px = fx + sw * (k % 2 ? 1 : -1);
        ctx.fillStyle = col; for (let q = 0; q < 5; q++) { const a = q * TAU / 5; ctx.beginPath(); ctx.arc(px + Math.cos(a) * 2.6, fy + Math.sin(a) * 2.6, 1.9, 0, TAU); ctx.fill(); }
        ctx.fillStyle = '#F6A93B'; ctx.beginPath(); ctx.arc(px, fy, 1.5, 0, TAU); ctx.fill();
      });
      ctx.fillStyle = '#4E9A5A'; ell(-5, -1, 3, 1.5, -0.5); ctx.fill(); ell(5, -2, 3, 1.5, 0.5); ctx.fill();
      ctx.fillStyle = '#C97B54'; ctx.beginPath(); ctx.moveTo(-8, 3); ctx.lineTo(8, 3); ctx.lineTo(6, 15); ctx.lineTo(-6, 15); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#E39A72'; ctx.fillRect(-9, 1.5, 18, 3.2);
    } else if (id === 'beanbag') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 14, 20, 4); ctx.fill();
      ctx.fillStyle = '#D9705B'; ctx.beginPath(); ctx.moveTo(-18, 13); ctx.quadraticCurveTo(-21, -2, -9, -9); ctx.quadraticCurveTo(0, -14, 9, -9); ctx.quadraticCurveTo(21, -2, 18, 13); ctx.quadraticCurveTo(0, 17, -18, 13); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#EE8B72'; ell(-5, -2, 8, 5, -0.4); ctx.fill();
      ctx.strokeStyle = 'rgba(120,45,35,.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-9, -8); ctx.quadraticCurveTo(0, -3, 9, -8); ctx.stroke();
    } else if (id === 'discoball') {
      const ang = t * 1.4, cols = ['#FF8FA3', '#FFD76A', '#7FD0C8', '#9DB8FF'];
      for (let k = 0; k < 4; k++) { const a = ang + k * TAU / 4; ctx.fillStyle = cols[k]; ctx.globalAlpha = 0.45; ell(Math.cos(a) * 11, 22 + Math.sin(a) * 3.5, 3.2, 1.7); ctx.fill(); }
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#8A93A0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(0, -12); ctx.stroke();
      const gl = ctx.createRadialGradient(0, 0, 3, 0, 0, 22); gl.addColorStop(0, 'rgba(200,220,255,.28)'); gl.addColorStop(1, 'rgba(200,220,255,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 22, 0, TAU); ctx.fill();
      ctx.fillStyle = '#C9D2DC'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.fill();
      for (let r = -1; r <= 1; r++) for (let c = -2; c <= 2; c++) {
        const px = c * 4.1 + (((Math.floor(t * 3) + r + c) % 2) ? 0.6 : 0), py = r * 4.4;
        if (Math.hypot(px, py) > 9.5) continue;
        ctx.fillStyle = ((c + r + Math.floor(t * 4)) & 1) ? '#FFFFFF' : '#9FB0C4'; ctx.fillRect(px - 1.7, py - 1.8, 3.4, 3.6);
      }
      ctx.strokeStyle = 'rgba(90,100,115,.7)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.arc(0, 0, 11, 0, TAU); ctx.stroke();
    } else if (id === 'rug') {
      ctx.fillStyle = '#C96F5E'; rr(-24, -15, 48, 30, 8); ctx.fill();
      ctx.fillStyle = '#EBC4A4'; rr(-20, -11, 40, 22, 6); ctx.fill();
      ctx.strokeStyle = '#C96F5E'; ctx.lineWidth = 1.6; rr(-14, -6, 28, 12, 4); ctx.stroke();
      ctx.fillStyle = '#F3E3C7'; for (let k = -3; k <= 3; k++) { ctx.fillRect(k * 6 - 1, -18, 2, 3); ctx.fillRect(k * 6 - 1, 15, 2, 3); }
    } else if (id === 'cactus') {
      ctx.fillStyle = '#C97B54'; ctx.beginPath(); ctx.moveTo(-7, 4); ctx.lineTo(7, 4); ctx.lineTo(5.5, 14); ctx.lineTo(-5.5, 14); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#E39A72'; ctx.fillRect(-8, 2, 16, 3);
      ctx.fillStyle = '#5FA86A'; rr(-4.5, -14, 9, 18, 4.5); ctx.fill(); rr(-10, -7, 4.4, 9, 2.2); ctx.fill(); rr(5.6, -11, 4.4, 8, 2.2); ctx.fill(); ctx.fillRect(-9, -2, 6, 3); ctx.fillRect(3, -4, 6, 3);
      ctx.fillStyle = '#4C8D58'; ctx.fillRect(-0.7, -13, 1.4, 16);
      ctx.fillStyle = '#F08FB0'; ctx.beginPath(); ctx.arc(0, -15, 2.7, 0, TAU); ctx.fill();
    } else if (id === 'plant') {
      for (let k = 0; k < 7; k++) { ctx.save(); ctx.translate(0, 4); ctx.rotate((k - 3) * 0.46); ctx.fillStyle = k % 2 ? '#4E9A5A' : '#6FBF73'; ell(0, -8.5, 3.7, 8.5); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = '#F1E4CF'; rr(-8, 3, 16, 12, 3); ctx.fill(); ctx.fillStyle = '#D8C6A8'; ctx.fillRect(-8, 6, 16, 2);
    } else if (id === 'palm') {
      ctx.strokeStyle = '#8A6A45'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 4); ctx.quadraticCurveTo(2, -4, 0, -11); ctx.stroke(); ctx.lineCap = 'butt';
      for (let k = 0; k < 7; k++) { ctx.save(); ctx.translate(0, -11); ctx.rotate((k - 3) * 0.62 + Math.sin(t * 1.2 + k) * 0.05); ctx.fillStyle = k % 2 ? '#3F8E54' : '#5BAE69'; ell(0, -7, 2.8, 8); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = '#8C6A4F'; rr(-8, 3, 16, 12, 3); ctx.fill(); ctx.fillStyle = '#6F5139'; ctx.fillRect(-8, 6, 16, 2);
    } else if (id === 'lamp') {
      const gl = ctx.createRadialGradient(0, -12, 2, 0, -12, 30); gl.addColorStop(0, 'rgba(255,214,130,.4)'); gl.addColorStop(1, 'rgba(255,214,130,0)');
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, -12, 30, 0, TAU); ctx.fill();
      ctx.fillStyle = '#6B5646'; ell(0, 14, 7, 3); ctx.fill(); ctx.fillRect(-1, -8, 2, 22);
      ctx.fillStyle = '#F6D58E'; ctx.beginPath(); ctx.moveTo(-9, -6); ctx.lineTo(9, -6); ctx.lineTo(5.5, -19); ctx.lineTo(-5.5, -19); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(-4, -17, 2.5, 10);
    } else if (id === 'shelf') {
      ctx.fillStyle = '#8B6B4C'; rr(-19, -16, 38, 33, 3); ctx.fill();
      ctx.fillStyle = '#5E4733'; ctx.fillRect(-17, -14, 34, 14); ctx.fillRect(-17, 2, 34, 13);
      const cl = ['#D9675C', '#5C8FD9', '#E6C25A', '#6BB38A', '#B27BC9'];
      for (let k = 0; k < 5; k++) { ctx.fillStyle = cl[k]; ctx.fillRect(-16 + k * 6.4, -1 - (9 + (k % 2) * 2), 5, 9 + (k % 2) * 2); }
      for (let k = 0; k < 3; k++) { ctx.fillStyle = cl[(k + 2) % 5]; ctx.fillRect(-16 + k * 6.4, 14 - 10, 5, 10); }
      ctx.fillStyle = '#F1E4CF'; ctx.fillRect(5, 9, 8, 6); ctx.fillStyle = '#6FBF73'; ctx.beginPath(); ctx.arc(9, 7, 3.4, 0, TAU); ctx.fill();
    } else if (id === 'couch') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 14, 26, 4); ctx.fill();
      ctx.fillStyle = '#5E8F94'; rr(-26, -14, 52, 16, 6); ctx.fill();
      ctx.fillStyle = '#78AEB3'; rr(-22, -4, 44, 16, 5); ctx.fill();
      ctx.fillStyle = '#5E8F94'; rr(-28, -8, 9, 22, 4); ctx.fill(); rr(19, -8, 9, 22, 4); ctx.fill();
      ctx.fillStyle = '#F0C879'; rr(-16, -7, 12, 11, 3); ctx.fill(); ctx.fillStyle = '#E88F7E'; rr(5, -7, 11, 11, 3); ctx.fill();
    } else if (id === 'tv') {
      ctx.fillStyle = '#8B6B4C'; rr(-21, 6, 42, 10, 2); ctx.fill(); ctx.fillStyle = '#6F5139'; ctx.fillRect(-21, 11, 42, 1.5);
      ctx.fillStyle = '#1F252C'; rr(-17, -15, 34, 23, 3); ctx.fill();
      const hue = (t * 30) % 360, g = ctx.createLinearGradient(-15, -13, 15, 5); g.addColorStop(0, 'hsl(' + hue + ',70%,58%)'); g.addColorStop(1, 'hsl(' + ((hue + 70) % 360) + ',70%,46%)');
      ctx.fillStyle = g; rr(-15, -13, 30, 19, 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-13, -11, 9, 2.5);
    } else if (id === 'tank') {
      ctx.fillStyle = '#6D8BA0'; rr(-21, -13, 42, 30, 4); ctx.fill();
      ctx.fillStyle = '#5CC0D8'; rr(-19, -11, 38, 24, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.2)'; rr(-19, -11, 38, 6, 3); ctx.fill();
      ctx.fillStyle = '#E6D2A0'; ctx.fillRect(-19, 9, 38, 4);
      ctx.strokeStyle = '#4FA36B'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-11, 9); ctx.quadraticCurveTo(-13 + Math.sin(t * 2) * 2, 2, -11, -3); ctx.stroke();
      const fxp = Math.sin(t * 0.9) * 10, dir = Math.cos(t * 0.9) >= 0 ? 1 : -1;
      ctx.fillStyle = '#FF9A5C'; ell(fxp, -1, 4, 2.7); ctx.fill(); ctx.beginPath(); ctx.moveTo(fxp - dir * 3.5, -1); ctx.lineTo(fxp - dir * 7, -3.6); ctx.lineTo(fxp - dir * 7, 1.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1C2A33'; ctx.beginPath(); ctx.arc(fxp + dir * 2, -1.6, 0.8, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(12 + (k % 2) * 2, 6 - ((t * 8 + k * 7) % 16), 1 + (k % 2) * 0.4, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  }
  // after=false: hinter dem Spieler (vor ihm gezeichnet), after=true: davor
  function drawPetsWorld(after) { activePets().forEach((id, n) => { const p = pets[n]; if ((FLY.includes(id) || p.y >= player.y) === after) drawPet(id, p.x, p.y, p.face, gt, p.moving, 0.85); }); }
  function drawPet(id, x, y, face, tm, moving, sc) {
    ctx.save(); ctx.translate(x, y); ctx.scale(face * sc, sc); ctx.lineCap = 'round';
    const bob = moving ? Math.abs(Math.sin(tm * 13)) * 1.5 : Math.sin(tm * 2) * 0.4, lg = moving ? Math.sin(tm * 13) : 0;
    if (drawPet130(id, tm, moving, bob, lg)) { ctx.restore(); return; } // v130
    if (id === 'bird') { // Welli (Wellensittich)
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(0, 8, 6, 2.3); ctx.fill();
      ctx.translate(0, -12 + Math.sin(tm * 3) * 1.6 - (moving ? 1.5 : 0));
      ctx.fillStyle = '#3F7FD6'; ell(-9, 1.5, 4.2, 1.5, -0.3); ctx.fill();            // blauer Schwanz
      ctx.fillStyle = '#5FCB4A'; ell(0, 0, 7.2, 6); ctx.fill();                        // gruener Koerper
      ctx.fillStyle = '#A5E87A'; ell(1.2, 2.2, 4.6, 3.4); ctx.fill();                  // hellerer Bauch
      ctx.save(); ctx.translate(-2, -0.5); ctx.rotate(Math.sin(tm * (moving ? 24 : 9)) * 0.7 - 0.3);
      ctx.fillStyle = '#4DB83D'; ell(-3, -1, 5.2, 2.7); ctx.fill();
      ctx.strokeStyle = '#1F2A1C'; ctx.lineWidth = 0.9; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(-5 + k * 2.4, -2.2); ctx.lineTo(-4 + k * 2.4, 0.2); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = '#FFE45C'; ctx.beginPath(); ctx.arc(5, -4, 4.6, 0, TAU); ctx.fill();   // gelber Kopf
      ctx.strokeStyle = '#2B2A1A'; ctx.lineWidth = 0.8; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(2.2 + k * 1.6, -7.8 + k * 0.2); ctx.lineTo(2.6 + k * 1.6, -6.2 + k * 0.2); ctx.stroke(); }
      ctx.fillStyle = '#4B8DFF'; ctx.beginPath(); ctx.arc(4.3, -2.7, 1.5, 0, TAU); ctx.fill();   // blauer Wangenfleck
      ctx.fillStyle = '#F2A94B'; ctx.beginPath(); ctx.moveTo(8.8, -5.1); ctx.lineTo(11.6, -4); ctx.lineTo(8.8, -2.9); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(6.3, -5, 1.25, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1B1B1B'; ctx.beginPath(); ctx.arc(6.5, -5, 0.65, 0, TAU); ctx.fill();
    } else if (id === 'dog') {
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(0, 7, 9.5, 3.2); ctx.fill();
      ctx.strokeStyle = '#C99B6B'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, -4 - bob); ctx.quadraticCurveTo(-13, -8 + Math.sin(tm * 14) * 3, -12, -12 + Math.sin(tm * 14) * 2); ctx.stroke();
      ctx.fillStyle = '#D9B184'; [[-5, lg], [-1.5, -lg], [3, lg], [6.5, -lg]].forEach(([lx, l]) => { ctx.beginPath(); ctx.arc(lx + l * 1.2, 4.6 - Math.max(0, l) * 1.2, 2.1, 0, TAU); ctx.fill(); });
      ctx.fillStyle = '#E9C69C'; ell(0, -1.5 - bob * 0.4, 9, 6.3); ctx.fill();
      ctx.fillStyle = '#CFA270'; ell(-2.5, -4.2 - bob * 0.4, 4.2, 2.6); ctx.fill();
      const hy = -8.5 - bob;
      ctx.fillStyle = '#ECCBA3'; ctx.beginPath(); ctx.arc(8, hy, 5.8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#B07A4C'; ell(4.6, hy - 0.5, 2.4, 4.2, 0.25); ctx.fill();
      ctx.fillStyle = '#F7E6D0'; ell(11.8, hy + 1.6, 3, 2.3); ctx.fill();
      ctx.fillStyle = '#3A2A22'; ctx.beginPath(); ctx.arc(13.7, hy + 0.9, 1.1, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2B1D18'; ctx.beginPath(); ctx.arc(9.3, hy - 1.2, 1.15, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,130,150,.5)'; ctx.beginPath(); ctx.arc(7.6, hy + 2, 1.5, 0, TAU); ctx.fill();
    } else if (id === 'cat') {
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(0, 7, 9, 3.1); ctx.fill();
      ctx.strokeStyle = '#E7924A'; ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(-8, -3 - bob); ctx.quadraticCurveTo(-14, -6 + Math.sin(tm * 3) * 3, -11, -14 + Math.sin(tm * 3) * 2); ctx.stroke();
      ctx.fillStyle = '#F2B070'; [[-5, lg], [-1.5, -lg], [3, lg], [6, -lg]].forEach(([lx, l]) => { ctx.beginPath(); ctx.arc(lx + l * 1.2, 4.6 - Math.max(0, l) * 1.2, 2, 0, TAU); ctx.fill(); });
      ctx.fillStyle = '#F5A95C'; ell(0, -1.5 - bob * 0.4, 8.6, 6); ctx.fill();
      ctx.fillStyle = '#E58F45'; for (let k = 0; k < 3; k++) ctx.fillRect(-5 + k * 3.4, -6.8 - bob * 0.4, 1.5, 4);
      const hy = -8.3 - bob;
      ctx.fillStyle = '#F5A95C'; ctx.beginPath(); ctx.moveTo(4, hy - 3); ctx.lineTo(4.8, hy - 9.5); ctx.lineTo(8, hy - 4.5); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(9, hy - 4.5); ctx.lineTo(11.6, hy - 9.5); ctx.lineTo(12.2, hy - 2.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#F8B777'; ctx.beginPath(); ctx.arc(8.2, hy, 5.7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFE6D2'; ell(10.4, hy + 2.2, 3.2, 2.3); ctx.fill();
      ctx.fillStyle = '#F08EA0'; ctx.beginPath(); ctx.arc(11.7, hy + 0.9, 0.9, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2B1D18'; ctx.beginPath(); ctx.arc(9.6, hy - 1.3, 1.1, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,130,150,.5)'; ctx.beginPath(); ctx.arc(6.9, hy + 1.8, 1.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(60,40,30,.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(11.5, hy + 2); ctx.lineTo(15, hy + 1); ctx.moveTo(11.5, hy + 2.8); ctx.lineTo(15, hy + 3.4); ctx.stroke();
    } else if (id === 'bunny') {
      ctx.fillStyle = 'rgba(0,0,0,.26)'; ell(0, 7, 8.5, 3); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(-9, -3 - bob, 2.8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F4EEF0'; [[-4, lg], [5, -lg]].forEach(([lx, l]) => { ell(lx + l, 4.6 - Math.max(0, l), 3.2, 2); ctx.fill(); });
      ctx.fillStyle = '#FBF7F8'; ell(0, -1.8 - bob * 0.5, 8.4, 6.2); ctx.fill();
      const hy = -8 - bob;
      ctx.fillStyle = '#FBF7F8'; ell(5.2, hy - 8, 2.3, 6.2, -0.1); ctx.fill(); ell(8.6, hy - 8, 2.3, 6.2, 0.15); ctx.fill();
      ctx.fillStyle = '#F6B8C6'; ell(5.2, hy - 8, 1, 4.4, -0.1); ctx.fill(); ell(8.6, hy - 8, 1, 4.4, 0.15); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(7.6, hy, 5.3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2B1D18'; ctx.beginPath(); ctx.arc(9.3, hy - 0.9, 1.05, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F08EA0'; ctx.beginPath(); ctx.arc(12.2, hy + 1, 1, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,130,150,.55)'; ctx.beginPath(); ctx.arc(7.2, hy + 1.8, 1.5, 0, TAU); ctx.fill();
    } else if (id === 'teddy') {
      const sw = moving ? Math.sin(tm * 11) : Math.sin(tm * 1.6) * 0.15, bb = moving ? Math.abs(Math.sin(tm * 11)) * 1.2 : 0;
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(0, 8, 8.5, 3); ctx.fill();
      ctx.fillStyle = '#C98F55'; [[-3.6, sw], [3.6, -sw]].forEach(([lx, l]) => { ell(lx + l * 1.4, 6.4 - Math.max(0, l) * 1.2, 3.3, 2.3); ctx.fill(); });
      ctx.fillStyle = '#E3AC70'; ell(0, -2.5 - bb, 7.6, 8.3); ctx.fill();
      ctx.fillStyle = '#F4DDB8'; ell(1, -1.8 - bb, 4.7, 5.6); ctx.fill();
      ctx.fillStyle = '#E3AC70'; [[-8, sw], [8, -sw]].forEach(([ax, a]) => { ell(ax * 0.95, -3.5 - bb + a * 1.1, 2.5, 3.8, ax < 0 ? 0.35 : -0.35); ctx.fill(); });
      const hy = -13.5 - bb;
      ctx.fillStyle = '#E3AC70'; ctx.beginPath(); ctx.arc(-3.8, hy - 5, 2.8, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(5.6, hy - 5, 2.8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F2A9B8'; ctx.beginPath(); ctx.arc(-3.8, hy - 5, 1.4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(5.6, hy - 5, 1.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#E3AC70'; ctx.beginPath(); ctx.arc(0.8, hy, 6.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F4DDB8'; ell(3.2, hy + 2.2, 3.6, 2.8); ctx.fill();
      ctx.fillStyle = '#3A2A22'; ell(4.3, hy + 0.9, 1.3, 0.95); ctx.fill();
      ctx.strokeStyle = '#3A2A22'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(4.3, hy + 1.8); ctx.lineTo(4.3, hy + 3); ctx.moveTo(2.6, hy + 3.4); ctx.quadraticCurveTo(4.3, hy + 4.6, 6, hy + 3.4); ctx.stroke();
      ctx.fillStyle = '#2B1D18'; ctx.beginPath(); ctx.arc(1.4, hy - 1.6, 1, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(6.2, hy - 1.7, 1, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,130,150,.45)'; ctx.beginPath(); ctx.arc(-0.6, hy + 2, 1.3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#6DBE9A'; rr(-5.4, hy + 5.2, 12.4, 3.4, 1.6); ctx.fill(); ctx.fillStyle = '#4C9B7A'; ctx.fillRect(-3.4, hy + 5.4, 1.5, 3); ctx.fillRect(0.4, hy + 5.4, 1.5, 3); ctx.fillRect(4.2, hy + 5.4, 1.5, 3);
      ctx.fillStyle = '#6DBE9A'; rr(-6.2, hy + 6.4, 3.4, 7.5, 1.4); ctx.fill();
    } else if (id === 'monkey') {
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(0, 7.5, 9, 3); ctx.fill();
      ctx.strokeStyle = '#7A4B2A'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(-7, -3 - bob); ctx.quadraticCurveTo(-15, -4 + Math.sin(tm * 9) * 2, -13, -12); ctx.quadraticCurveTo(-11.5, -15, -9, -12.5); ctx.stroke();
      ctx.fillStyle = '#6B4023'; [[-4, lg], [4.5, -lg]].forEach(([lx, l]) => { ctx.beginPath(); ctx.arc(lx + l * 1.3, 5 - Math.max(0, l) * 1.3, 2.6, 0, TAU); ctx.fill(); });
      ctx.fillStyle = '#8B5A33'; ell(0, -2 - bob * 0.4, 7.6, 6.4); ctx.fill();
      ctx.fillStyle = '#E3BE94'; ell(2, -0.5 - bob * 0.4, 4.6, 4.2); ctx.fill();
      ctx.fillStyle = '#7A4B2A'; ctx.beginPath(); ctx.arc(4.5, 0.5 - bob * 0.4 + lg * 0.8, 2.3, 0, TAU); ctx.fill();
      const hy = -9.5 - bob;
      ctx.fillStyle = '#8B5A33'; ctx.beginPath(); ctx.arc(0.6, hy + 0.5, 3.3, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(12.4, hy + 0.4, 3.3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#E3BE94'; ctx.beginPath(); ctx.arc(0.7, hy + 0.5, 1.7, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(12.3, hy + 0.4, 1.7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#8B5A33'; ctx.beginPath(); ctx.arc(6.5, hy, 6.1, 0, TAU); ctx.fill();
      ctx.fillStyle = '#EACBA2'; ell(6.6, hy + 1.4, 4.6, 3.9); ctx.fill(); ctx.beginPath(); ctx.arc(4.4, hy - 1, 2.1, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(8.8, hy - 1, 2.1, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1C1410'; ctx.beginPath(); ctx.arc(4.7, hy - 0.9, 0.95, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(9, hy - 0.9, 0.95, 0, TAU); ctx.fill();
      ctx.fillStyle = '#7A4B2A'; ctx.beginPath(); ctx.arc(6.3, hy + 1.4, 0.55, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(7.6, hy + 1.4, 0.55, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#7A4B2A'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(6.9, hy + 2.2, 1.7, 0.15, Math.PI - 0.15); ctx.stroke();
    } else if (id === 'dolphin') {
      ctx.fillStyle = 'rgba(0,0,0,.2)'; ell(0, 9, 8, 2.4); ctx.fill();
      ctx.translate(0, -11 + Math.sin(tm * 2.6) * 2 - (moving ? 1.5 : 0));
      ctx.fillStyle = 'rgba(150,220,255,.18)'; ctx.beginPath(); ctx.arc(1, 0, 15.5, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(190,235,255,.75)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(1, 0, 15.5, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(-6.5, -9.5, 2, 0, TAU); ctx.fill();
      const wag = Math.sin(tm * (moving ? 12 : 5)) * 0.35;
      ctx.save(); ctx.translate(-8.5, 1.5); ctx.rotate(wag);
      ctx.fillStyle = '#5A8FBF'; ctx.beginPath(); ctx.moveTo(1, 0); ctx.lineTo(-5.5, -4.2); ctx.quadraticCurveTo(-3.5, 0, -5.5, 4.2); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.fillStyle = '#6FA8D6'; ell(0, 0, 9.8, 5.2, -0.2); ctx.fill();
      ctx.fillStyle = '#EAF5FC'; ell(1.2, 2.2, 7.8, 2.8, -0.2); ctx.fill();
      ctx.fillStyle = '#5A8FBF'; ctx.beginPath(); ctx.moveTo(-1.5, -4.2); ctx.lineTo(1.8, -9.2); ctx.lineTo(4, -3.8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#6FA8D6'; ell(10.8, 0.9, 3.8, 1.7, 0.1); ctx.fill();
      ctx.fillStyle = '#5A8FBF'; ell(2, 3.8, 3.3, 1.4, 0.7); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(7.1, -1.1, 1.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1B2A38'; ctx.beginPath(); ctx.arc(7.4, -1.1, 0.8, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,130,150,.5)'; ctx.beginPath(); ctx.arc(6.2, 1.2, 1.2, 0, TAU); ctx.fill();
    } else if (id === 'dragon') {
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ell(0, 9, 7, 2.4); ctx.fill();
      ctx.translate(0, -12 + Math.sin(tm * 3) * 1.8 - (moving ? 1.5 : 0));
      const fl = Math.sin(tm * (moving ? 22 : 9));
      // Schwanz mit Flammenspitze
      ctx.strokeStyle = '#5CC79A'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-6, 2); ctx.quadraticCurveTo(-12, 5 + Math.sin(tm * 5) * 2, -14, -1 + Math.sin(tm * 5) * 2); ctx.stroke();
      ctx.fillStyle = '#FF8A3D'; ctx.beginPath(); ctx.moveTo(-14.6, -3.2 + Math.sin(tm * 5) * 2); ctx.lineTo(-17.2, 0.8 + Math.sin(tm * 5) * 2); ctx.lineTo(-12.2, 1.4 + Math.sin(tm * 5) * 2); ctx.closePath(); ctx.fill();
      // hinterer Fluegel
      ctx.fillStyle = '#9A7BE0'; ctx.beginPath(); ctx.moveTo(-1, -3); ctx.quadraticCurveTo(-8, -10 - fl * 4, -11, -4 - fl * 5); ctx.quadraticCurveTo(-7, -4, -4, 0); ctx.closePath(); ctx.fill();
      // Koerper
      ctx.fillStyle = '#6FD3A6'; ell(0, 1, 7.6, 6); ctx.fill();
      ctx.fillStyle = '#FFF0C8'; ell(1.6, 3, 4.8, 3.4); ctx.fill();
      ctx.fillStyle = '#F2A33C'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-5 + k * 2.6, -4.2 + k * 0.3); ctx.lineTo(-4 + k * 2.6, -7.2 + k * 0.3); ctx.lineTo(-2.6 + k * 2.6, -4.2 + k * 0.3); ctx.closePath(); ctx.fill(); }
      // vorderer Fluegel
      ctx.fillStyle = '#B79BF0'; ctx.beginPath(); ctx.moveTo(1, -2); ctx.quadraticCurveTo(-3, -11 - fl * 5, -8, -6 - fl * 5); ctx.quadraticCurveTo(-4, -4, -1, 1); ctx.closePath(); ctx.fill();
      // Kopf
      ctx.fillStyle = '#6FD3A6'; ctx.beginPath(); ctx.arc(6, -3.6, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F2A33C'; ctx.beginPath(); ctx.moveTo(3.2, -7.4); ctx.lineTo(2.4, -11.4); ctx.lineTo(5.2, -8.4); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(7, -8.2); ctx.lineTo(7.8, -12); ctx.lineTo(9.6, -7.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#8AE0BC'; ell(9.4, -2.6, 3.2, 2.3); ctx.fill();
      ctx.fillStyle = '#3B8F6E'; ctx.beginPath(); ctx.arc(10.2, -3.4, 0.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(11.4, -3.2, 0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(6.4, -4.8, 1.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#3A1F4A'; ctx.beginPath(); ctx.arc(6.7, -4.8, 0.85, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,130,150,.5)'; ctx.beginPath(); ctx.arc(5.2, -1.8, 1.2, 0, TAU); ctx.fill();
      // Funken-Puster
      const puff = (tm * 0.9) % 4; if (puff < 0.6) { const q = puff / 0.6; ctx.globalAlpha = 1 - q; ctx.fillStyle = q < 0.5 ? '#FFD24A' : '#FF7A2E'; ctx.beginPath(); ctx.arc(13.5 + q * 6, -2.4 - q * 2, 1.6 + q * 1.4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(15 + q * 8, -3 - q * 3, 1 + q, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    } else if (id === 'elephant') {
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(0, 8, 11, 3.4); ctx.fill();
      ctx.fillStyle = '#7E8894'; [[-6, lg], [-2, -lg], [3, lg], [7, -lg]].forEach(([lx, l]) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(lx - 2.1 + l * 1.1, 1.5, 4.2, 5.8 - Math.max(0, l) * 1.1, 1.6) : ctx.rect(lx - 2.1 + l * 1.1, 1.5, 4.2, 5.8); ctx.fill(); });
      ctx.strokeStyle = '#8D97A3'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-9.3, -4); ctx.quadraticCurveTo(-12, -2 + Math.sin(tm * 6) * 1.5, -11, 1.5); ctx.stroke();
      ctx.fillStyle = '#A3ACB7'; ell(0, -2 - bob * 0.4, 10, 7); ctx.fill();
      ctx.fillStyle = '#B6BEC8'; ell(-0.5, -4.6 - bob * 0.4, 7.5, 2.6); ctx.fill();
      const hy = -9 - bob;
      ctx.fillStyle = '#A3ACB7'; ctx.beginPath(); ctx.arc(8, hy + 0.5, 6.2, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#A3ACB7'; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(12.6, hy + 2.6); ctx.quadraticCurveTo(15.5 + Math.sin(tm * 3) * 1, hy + 8, 13 + Math.sin(tm * 3) * 1.5, hy + 12); ctx.stroke();
      ctx.fillStyle = '#8D97A3'; ell(3.6, hy + 1.8, 4.7, 5.6, 0.15 + Math.sin(tm * (moving ? 10 : 2)) * 0.08); ctx.fill();
      ctx.fillStyle = '#E8B7C0'; ell(3.9, hy + 2, 2.7, 3.7, 0.15); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(10.2, hy - 0.8, 1.35, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1B2229'; ctx.beginPath(); ctx.arc(10.5, hy - 0.8, 0.8, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,130,150,.45)'; ctx.beginPath(); ctx.arc(9.4, hy + 2.2, 1.4, 0, TAU); ctx.fill();
    } else if (id === 'leopard') {
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(0, 7.5, 10, 3.2); ctx.fill();
      ctx.strokeStyle = '#E3AC45'; ctx.lineWidth = 2.8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-8, -3 - bob); ctx.quadraticCurveTo(-15, -4, -13.5, -12 + Math.sin(tm * 5) * 1.6); ctx.stroke();
      ctx.strokeStyle = '#3A2A1A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-13.7, -10 + Math.sin(tm * 5) * 1.4); ctx.lineTo(-13.5, -12.4 + Math.sin(tm * 5) * 1.6); ctx.stroke();
      ctx.fillStyle = '#D9A040'; [[-5.5, lg], [-1.5, -lg], [3, lg], [6.5, -lg]].forEach(([lx, l]) => { ctx.beginPath(); ctx.arc(lx + l * 1.2, 4.6 - Math.max(0, l) * 1.2, 2.2, 0, TAU); ctx.fill(); });
      ctx.fillStyle = '#EDBB55'; ell(0, -1.5 - bob * 0.4, 9.2, 6.2); ctx.fill();
      ctx.fillStyle = '#FFF0CC'; ell(1, 1.2 - bob * 0.4, 6.5, 2.4); ctx.fill();
      ctx.fillStyle = '#6B3F17'; [[-5, -3.5], [-1.5, -5], [2.5, -4], [-3.5, 0], [0.5, -1.6], [5, -2.2], [-6.5, -0.8]].forEach(([sx, sy]) => { ctx.beginPath(); ctx.arc(sx, sy - bob * 0.4, 1.35, 0, TAU); ctx.fill(); });
      const hy = -8.6 - bob;
      ctx.fillStyle = '#EDBB55'; ctx.beginPath(); ctx.arc(3, hy - 5, 2.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(10.4, hy - 5.2, 2.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#E8A0A8'; ctx.beginPath(); ctx.arc(3, hy - 4.8, 1.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(10.4, hy - 5, 1.2, 0, TAU); ctx.fill();
      ctx.fillStyle = '#EDBB55'; ctx.beginPath(); ctx.arc(6.8, hy, 6.1, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFF4D8'; ell(8.2, hy + 2.3, 3.4, 2.5); ctx.fill();
      ctx.fillStyle = '#6B3F17'; for (const [sx, sy] of [[3.2, hy - 2.6], [5.1, hy - 3.8], [8.4, hy - 3.9], [10.2, hy - 2.7]]) { ctx.beginPath(); ctx.arc(sx, sy, 0.7, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#8BCF5E'; ctx.beginPath(); ctx.arc(5.5, hy - 0.8, 1.45, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(9.5, hy - 0.9, 1.45, 0, TAU); ctx.fill();
      ctx.fillStyle = '#1B1410'; ctx.beginPath(); ctx.arc(5.8, hy - 0.8, 0.75, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(9.8, hy - 0.9, 0.75, 0, TAU); ctx.fill();
      ctx.fillStyle = '#D96F7A'; ctx.beginPath(); ctx.moveTo(7.3, hy + 1.1); ctx.lineTo(9.3, hy + 1.1); ctx.lineTo(8.3, hy + 2.3); ctx.closePath(); ctx.fill();
    } else if (id === 'panda') {
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(0, 7.5, 10, 3.4); ctx.fill();
      ctx.fillStyle = '#2B2B31'; [[-5, lg], [5, -lg]].forEach(([lx, l]) => { ctx.beginPath(); ctx.arc(lx + l * 1.2, 5 - Math.max(0, l), 3, 0, TAU); ctx.fill(); });
      ctx.fillStyle = '#FFFFFF'; ell(0, -2 - bob * 0.4, 9, 7.2); ctx.fill();
      ctx.fillStyle = '#2B2B31'; ell(0, -2.6 - bob * 0.4, 9.2, 2.6); ctx.fill();
      ctx.beginPath(); ctx.arc(3.5, 1.6 - Math.max(0, -lg), 2.6, 0, TAU); ctx.fill();
      const hy = -9.5 - bob;
      ctx.fillStyle = '#2B2B31'; ctx.beginPath(); ctx.arc(2.6, hy - 5.6, 2.4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(10.2, hy - 5.8, 2.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(6.6, hy, 6.4, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2B2B31'; ell(3.9, hy - 0.4, 1.9, 2.5, 0.4); ctx.fill(); ell(9.3, hy - 0.5, 1.9, 2.5, -0.4); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(4.1, hy - 0.8, 0.7, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(9.5, hy - 0.9, 0.7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#2B2B31'; ell(6.8, hy + 2.3, 1.5, 1.1); ctx.fill();
      ctx.fillStyle = 'rgba(255,130,150,.55)'; ctx.beginPath(); ctx.arc(2.8, hy + 2.8, 1.4, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(10.6, hy + 2.8, 1.4, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }
  function bestOrder(prod, have) {
    let best = null, bs = 1e12;
    for (const o of G.orders) {
      if (o.prod !== prod || o.qty > have) continue;
      const p = orderPos(o), sc = (have - o.qty) * 100000 + Math.hypot(p.x - player.x, p.y - player.y);
      if (sc < bs) { bs = sc; best = o; }
    }
    return best;
  }
  function drawCompass() {
    if (!G.up.compass || player.fl === 4) return; // v131: im Gang-HQ kein Lieferkompass
    let slot = 0;
    for (const ar of openAreas()) {
      const have = S(ar).inv.bags; if (have <= 0) continue;
      const o = bestOrder(ar.key, have); if (!o) continue;
      const p = orderPos(o), d = Math.hypot(p.x - player.x, p.y - player.y); if (d < 40) continue;
      const a = Math.atan2(p.y - player.y, p.x - player.x), r0 = 28 + slot * 24, pu = 1 + Math.sin(gt * 6) * 0.07;
      ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(a); ctx.scale(pu, pu);
      ctx.fillStyle = ar.bub; ctx.strokeStyle = 'rgba(16,21,28,.8)'; ctx.lineWidth = 2; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(r0 + 24, 0); ctx.lineTo(r0 + 6, -10); ctx.lineTo(r0 + 11, 0); ctx.lineTo(r0 + 6, 10); ctx.closePath(); ctx.stroke(); ctx.fill();
      ctx.restore();
      const lx = player.x + Math.cos(a) * (r0 + 1), ly = player.y + Math.sin(a) * (r0 + 1);
      ctx.fillStyle = '#10151C'; ctx.beginPath(); ctx.arc(lx, ly, 8.5, 0, TAU); ctx.fill();
      ctx.fillStyle = ar.bub; ctx.font = '800 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(o.qty), lx, ly + 0.5); // v126: so viele will der Kunde
      { const m = Math.round(d / 10), t = m < 1000 ? m + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km'; ctx.font = '800 7px sans-serif'; const w = ctx.measureText(t).width + 7 || 24; // v79: Entfernung
        ctx.fillStyle = 'rgba(16,21,28,.85)'; rr(lx - w / 2, ly - 20, w, 9, 4.5); ctx.fill(); ctx.fillStyle = '#EEF2F7'; ctx.fillText(t, lx, ly - 15.3); }
      ctx.textBaseline = 'alphabetic'; slot++;
    }
  }

