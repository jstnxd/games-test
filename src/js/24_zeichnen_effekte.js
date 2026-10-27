  // ---------- Zeichnen ----------
  function ell(x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); }
  // Rotlicht-Pflanzenlampen ueber den Toepfen
  function drawGrowLamp(x, y, i, p, rot) { // v89: schoeneres Vollspektrum-Licht, dreht sich mit dem Topf
    const pulse = 0.92 + 0.08 * Math.sin(gt * 2.2 + i * 1.7), on = p && p.s >= 1, grow = p && p.s === 1 && p.w > 0.12 ? 1 : on ? 0.7 : 0.35, a = pulse * grow;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    // weicher Lichtfleck auf Boden und Pflanze (rosa-violett mit warmem Kern)
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, -2, 1, 0, 2, 40); g.addColorStop(0, 'rgba(255,214,235,' + (0.30 * a).toFixed(3) + ')'); g.addColorStop(0.35, 'rgba(232,92,200,' + (0.20 * a).toFixed(3) + ')'); g.addColorStop(0.75, 'rgba(140,70,255,' + (0.07 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(120,60,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 1, 40, 34, 0, 0, TAU); ctx.fill();
    const cg = ctx.createLinearGradient(0, -26, 0, 10); cg.addColorStop(0, 'rgba(255,170,230,' + (0.34 * a).toFixed(3) + ')'); cg.addColorStop(0.6, 'rgba(210,110,255,' + (0.10 * a).toFixed(3) + ')'); cg.addColorStop(1, 'rgba(200,100,255,0)');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(-14, -24); ctx.lineTo(14, -24); ctx.lineTo(25, 10); ctx.lineTo(-25, 10); ctx.closePath(); ctx.fill();
    if (on) for (let k = 0; k < 4; k++) { const ph = (gt * 0.25 + k / 4 + i * 0.37) % 1, px = Math.sin(k * 2.3 + i + gt * 0.6) * (6 + ph * 12), py = -20 + ph * 26; ctx.fillStyle = 'rgba(255,230,250,' + (0.5 * a * Math.sin(ph * Math.PI)).toFixed(3) + ')'; ctx.fillRect(px - 0.6, py - 0.6, 1.2, 1.2); }
    ctx.restore();
    // Aufhaengung
    ctx.strokeStyle = 'rgba(20,24,30,.9)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-13, -28); ctx.lineTo(-6, -38); ctx.moveTo(13, -28); ctx.lineTo(6, -38); ctx.stroke();
    ctx.fillStyle = '#3A414B'; ctx.fillRect(-7, -39.5, 14, 2);
    // Gehaeuse mit Kuehlrippen
    ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(-16, -28, 33, 11, 4); ctx.fill();
    ctx.fillStyle = '#2E343D'; rr(-16, -30, 32, 10, 4); ctx.fill();
    ctx.fillStyle = '#3F4752'; for (let k = 0; k < 7; k++) ctx.fillRect(-13 + k * 4.2, -29.4, 2, 2.4);
    ctx.fillStyle = '#0F1216'; rr(-14, -25.6, 28, 4.6, 2); ctx.fill();
    // LEDs: rosa, weiss, blau im Wechsel
    const cols = ['255,90,170', '255,240,250', '120,140,255'];
    for (let k = 0; k < 9; k++) { const c = cols[k % 3]; ctx.fillStyle = 'rgba(' + c + ',' + (0.55 + 0.45 * a).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(-12 + k * 3, -23.3, 1.1, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const hg = ctx.createRadialGradient(0, -23, 1, 0, -23, 22); hg.addColorStop(0, 'rgba(255,150,220,' + (0.42 * a).toFixed(3) + ')'); hg.addColorStop(1, 'rgba(200,100,255,0)'); ctx.fillStyle = hg; ctx.fillRect(-24, -45, 48, 44); ctx.restore();
    // kleines Status-Licht
    ctx.fillStyle = on ? (grow === 1 ? '#5FE584' : '#FFB547') : '#4A505C'; ctx.beginPath(); ctx.arc(13, -28, 1.1, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // v61: Wasser-Hinweis schwebt ueber der Pflanzenlampe (vorher lag er darunter und war verdeckt)
  function drawDrop(x, y, p) {
    if (!p || p.s !== 1 || !(p.w < 0.3)) return;
    const by = y - 50 + Math.sin(gt * 3 + x * 0.05) * 2, k = 0.8 + 0.2 * Math.sin(gt * 5);
    ctx.save(); ctx.globalAlpha = k;
    ctx.fillStyle = 'rgba(16,21,28,.6)'; ctx.beginPath(); ctx.arc(x, by, 9.5, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(110,181,255,.7)'; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.fillStyle = '#6EB5FF'; ctx.beginPath(); ctx.arc(x, by + 2, 4.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 3.7, by + 0.6); ctx.lineTo(x, by - 6.5); ctx.lineTo(x + 3.7, by + 0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(x - 1.5, by + 1.2, 1.2, 0, TAU); ctx.fill();
    ctx.restore();
  }
  function drawPlant(i) { drawPlantAt(POTS[i].x, POTS[i].y, G.pots[i], rotAng(POTS[i], POTS[i].r)); }
  // v60: Topfschild am Rand zeigt, wie der Topf gedreht ist
  function potTag(x, y, rot, d) { const ta = (rot || 0) - 0.8, tx = x + Math.cos(ta) * d, ty = y + Math.sin(ta) * d; ctx.save(); ctx.translate(tx, ty); ctx.rotate(ta); ctx.fillStyle = '#EEF2F7'; ctx.fillRect(-1, -3, 7, 6); ctx.fillStyle = '#63C174'; ctx.fillRect(1, -1, 3, 2); ctx.restore(); }
  function drawPlantAt(x, y, p, rot) {
    rot = rot || 0;
    ctx.fillStyle = '#7A4E33'; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill();
    ctx.fillStyle = p.s && p.w > 0.3 ? '#2B1D14' : '#4A3426'; ctx.beginPath(); ctx.arc(x, y, 12.5, 0, TAU); ctx.fill();
    potTag(x, y, rot, 13);
    if (p.s === 0) return;
    const s = 4 + p.p * 11;
    for (let k = 0; k < 9; k++) {
      const a = k * TAU / 9 + 0.2 + rot, L = s * (k % 2 ? 1 : 1.2);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = k % 2 ? '#2F7A48' : '#63C174'; ell(L * 0.55, 0, L * 0.6, Math.max(1.5, L * 0.2)); ctx.fill(); ctx.restore();
    }
    if (p.s === 2) {
      ctx.fillStyle = 'rgba(255,181,71,.25)'; ctx.beginPath(); ctx.arc(x, y, 19 + Math.sin(gt * 4) * 1.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#C58BE6'; for (let k = 0; k < 5; k++) { const a = k * TAU / 5 + rot; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 6, y + Math.sin(a) * 6, 3, 0, TAU); ctx.fill(); }
    }
  }
  // ---------- Effekte (kaufbar im Handy unter Style) ----------
  function buyCos(id) {
    const c = COS.find(x => x.id === id);
    const pc = shopCost('c', c); if (!c || G.cos.owned[id] || G.money < pc || G.rep < (c.rep || 0)) return false;
    G.money -= pc; G.cos.owned[id] = true; if (c.kind === 'pet') { if (!activePets().includes(id)) togglePet(id); } else G.cos[c.kind] = id; sfx.buy(); save(); return true;
  }
  // Maximal 2 Begleiter: ein dritter ersetzt den aeltesten
  function togglePet(id) {
    let l = activePets(), dropped = null;
    if (l.includes(id)) l = l.filter(x => x !== id); else { l.push(id); if (l.length > 2) dropped = l.shift(); }
    G.cos.pet = l[0] || 'none'; G.cos.pet2 = l[1] || 'none';
    if (dropped) { const dn = COS.find(x => x.id === dropped); msg('Maximal 2 Begleiter: ' + (dn ? dn.name : '') + ' bleibt zu Hause'); }
    petSnap();
  }
  const orbitList = () => [G.cos.orbit, G.cos.orbit2].filter(x => x && x !== 'none');
  function toggleOrbit(id) {
    let l = orbitList(), dropped = null;
    if (l.includes(id)) l = l.filter(x => x !== id); else { l.push(id); if (l.length > 2) dropped = l.shift(); }
    G.cos.orbit = l[0] || 'none'; G.cos.orbit2 = l[1] || 'none';
    if (dropped) { const dn = COS.find(x => x.id === dropped); msg('Maximal 2 Flug-Effekte: ' + (dn ? dn.name : '') + ' ist wieder aus'); }
  }
  function equipCos(id) {
    const c = COS.find(x => x.id === id);
    if (!c || !G.cos.owned[id]) return;
    if (c.kind === 'pet') togglePet(id); else if (c.kind === 'orbit') toggleOrbit(id); else G.cos[c.kind] = G.cos[c.kind] === id ? 'none' : id;
    save();
  }
  function fxUpdate(dt, moved) {
    const tr = G.cos.trail, h = player.ang;
    if (moved > 0.15) {
      if (tr === 'foot') {
        stepDist += moved;
        if (stepDist >= 15) {
          stepDist = 0; stepSide = -stepSide;
          fx.push({ k: 'foot', x: player.x - Math.sin(h) * 4.5 * stepSide, y: player.y + Math.cos(h) * 4.5 * stepSide, vx: 0, vy: 0, rot: h, t: 0, max: 1.5 });
        }
      } else if (tr === 'sparks') {
        fxAcc += dt;
        while (fxAcc > 0.02) {
          fxAcc -= 0.02;
          const a = h + Math.PI + (Math.random() - 0.5) * 1.3, sp = 30 + Math.random() * 70;
          fx.push({ k: 'spark', x: player.x + (Math.random() - 0.5) * 6, y: player.y + (Math.random() - 0.5) * 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, max: 0.35 + Math.random() * 0.35, hue: 25 + Math.random() * 30 });
        }
      } else if (tr === 'smoke') {
        fxAcc += dt;
        while (fxAcc > 0.06) {
          fxAcc -= 0.06;
          fx.push({ k: 'smoke', x: player.x - Math.cos(h) * 6 + (Math.random() - 0.5) * 4, y: player.y - Math.sin(h) * 6 + (Math.random() - 0.5) * 4, vx: (Math.random() - 0.5) * 10, vy: -8 - Math.random() * 8, t: 0, max: 0.9 + Math.random() * 0.5 });
        }
      } else if (tr === 'pixel') {
        fxAcc += dt;
        while (fxAcc > 0.09) { fxAcc -= 0.09; fx.push({ k: 'pixel', x: player.x, y: player.y, vx: 0, vy: 0, t: 0, max: 1.4, hue: Math.random() * 360 }); }
      } else if (tr === 'confetti') {
        fxAcc += dt;
        while (fxAcc > 0.035) { fxAcc -= 0.035; fx.push({ k: 'confetti', x: player.x + (Math.random() - .5) * 8, y: player.y + (Math.random() - .5) * 8, vx: (Math.random() - .5) * 60, vy: -40 - Math.random() * 50, rot: Math.random() * 6, t: 0, max: 1.1 + Math.random() * 0.4, hue: Math.random() * 360 }); }
      } else if (tr === 'petals') {
        fxAcc += dt;
        while (fxAcc > 0.05) { fxAcc -= 0.05; fx.push({ k: 'petal', x: player.x + (Math.random() - .5) * 8, y: player.y + (Math.random() - .5) * 8, vx: (Math.random() - .5) * 30, vy: -10 + Math.random() * 20, rot: Math.random() * 6, t: 0, max: 1.3 + Math.random() * 0.5, hue: 330 + Math.random() * 25 }); }
      } else if (tr === 'bolt') {
        fxAcc += dt;
        while (fxAcc > 0.07) { fxAcc -= 0.07; fx.push({ k: 'bolt', x: player.x, y: player.y, vx: 0, vy: 0, rot: Math.random() * 6.28, t: 0, max: 0.35 + Math.random() * 0.2, ln: 7 + Math.random() * 8 }); }
      } else if (tr === 'gold') {
        fxAcc += dt;
        while (fxAcc > 0.05) { fxAcc -= 0.05; fx.push({ k: 'coin', x: player.x + (Math.random() - .5) * 10, y: player.y + (Math.random() - .5) * 10, vx: (Math.random() - .5) * 40, vy: -30 - Math.random() * 30, rot: Math.random() * 6, t: 0, max: 1 + Math.random() * 0.4 }); }
      } else if (tr === 'bubtrail') {
        fxAcc += dt;
        while (fxAcc > 0.07) { fxAcc -= 0.07; fx.push({ k: 'bub', x: player.x + (Math.random() - .5) * 8, y: player.y + (Math.random() - .5) * 6, vx: (Math.random() - .5) * 8, vy: -10 - Math.random() * 10, t: 0, max: 1.2 + Math.random() * 0.6, r: 2 + Math.random() * 3 }); }
      } else if (tr === 'clover') {
        fxAcc += dt;
        while (fxAcc > 0.11) { fxAcc -= 0.11; fx.push({ k: 'clover', x: player.x + (Math.random() - .5) * 6, y: player.y + (Math.random() - .5) * 6, vx: 0, vy: 0, rot: Math.random() * 6, t: 0, max: 1.8 }); }
      } else if (tr === 'fire') {
        fxAcc += dt;
        while (fxAcc > 0.025) { fxAcc -= 0.025; fx.push({ k: 'flame', x: player.x - Math.cos(h) * 5 + (Math.random() - .5) * 6, y: player.y - Math.sin(h) * 5 + (Math.random() - .5) * 6, vx: (Math.random() - .5) * 14, vy: -14 - Math.random() * 20, t: 0, max: 0.4 + Math.random() * 0.35 }); }
      } else if (tr === 'dust') {
        fxAcc += dt;
        while (fxAcc > 0.04) { fxAcc -= 0.04; fx.push({ k: 'dust', x: player.x + (Math.random() - .5) * 10, y: player.y + (Math.random() - .5) * 8, vx: (Math.random() - .5) * 16, vy: 4 + Math.random() * 12, t: 0, max: 0.9 + Math.random() * 0.6, ph: Math.random() * 6 }); }
      } else if (tr === 'rainbow') {
        hist.push({ x: player.x, y: player.y, t: gt });
      }
    }
    if (tr !== 'rainbow') hist.length = 0;
    while (hist.length && gt - hist[0].t > 0.9) hist.shift();
    for (let i = fx.length - 1; i >= 0; i--) {
      const p = fx[i]; p.t += dt;
      if (p.t >= p.max) { fx.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.k === 'spark') { p.vx *= 0.93; p.vy *= 0.93; }
      if (p.k === 'flame') { p.vx *= 0.96; }
      if (p.k === 'coin') { p.vy += 140 * dt; p.vx *= 0.98; }
      if (p.k === 'petal') { p.vx += Math.sin(p.t * 6 + p.rot) * 40 * dt; p.rot += dt * 3; }
      if (p.k === 'confetti') { p.vy += 170 * dt; p.vx *= 0.98; p.rot += dt * 8; }
    }
    { const cap = LOFX ? 50 : 160; if (fx.length > cap) fx.splice(0, fx.length - cap); } // v128: weniger Partikel
  }
  function drawTrail() {
    if (hist.length > 1) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 1; i < hist.length; i++) {
        const a = hist[i - 1], b = hist[i], k = 1 - (gt - b.t) / 0.9;
        if (k <= 0) continue;
        const off = Math.sin(gt * 9 + i * 0.55) * 2.4;
        ctx.strokeStyle = 'hsla(' + Math.round((gt * 220 + i * 9) % 360) + ',95%,62%,' + (0.9 * k).toFixed(2) + ')';
        ctx.lineWidth = 1.2 + 5.8 * k;
        ctx.beginPath(); ctx.moveTo(a.x, a.y + off); ctx.lineTo(b.x, b.y + off); ctx.stroke();
      }
      ctx.lineCap = 'butt';
    }
    for (const p of fx) {
      const k = p.t / p.max;
      if (p.k === 'foot') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = 'hsl(' + Math.round(140 + k * 50) + ',90%,66%)';
        ctx.globalAlpha = (1 - k) * 0.28; ctx.beginPath(); ctx.arc(0, 0, 8 + k * 3, 0, TAU); ctx.fill();
        ctx.globalAlpha = (1 - k) * 0.95; ctx.beginPath(); ctx.ellipse(0, 0, 3.8, 2.2, 0, 0, TAU); ctx.fill();
        ctx.restore();
      } else if (p.k === 'spark') {
        ctx.globalAlpha = 1 - k; ctx.fillStyle = 'hsl(' + Math.round(p.hue) + ',100%,' + Math.round(72 - k * 22) + '%)';
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.9 * (1 - k * 0.5), 0, TAU); ctx.fill();
      } else if (p.k === 'pixel') {
        ctx.globalAlpha = (1 - k) * 0.9; ctx.fillStyle = 'hsl(' + Math.round(p.hue) + ',90%,65%)'; ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
      } else if (p.k === 'confetti') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = 1 - k; ctx.fillStyle = 'hsl(' + Math.round(p.hue) + ',95%,65%)'; ctx.fillRect(-2.5, -1.2, 5, 2.4); ctx.restore();
      } else if (p.k === 'bub') {
        ctx.globalAlpha = (1 - k) * 0.9; ctx.strokeStyle = 'rgba(190,235,255,.9)'; ctx.fillStyle = 'rgba(190,235,255,.15)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + k * 0.3), 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(p.x - p.r * .3, p.y - p.r * .3, p.r * .25, 0, TAU); ctx.fill();
      } else if (p.k === 'clover') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = (1 - k * k) * 0.95; ctx.fillStyle = '#4FBF5E';
        for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.arc(Math.cos(q * Math.PI / 2) * 2.4, Math.sin(q * Math.PI / 2) * 2.4, 2.2, 0, TAU); ctx.fill(); }
        ctx.strokeStyle = '#2F8A3E'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1.5, 5); ctx.stroke(); ctx.restore();
      } else if (p.k === 'flame') {
        const r = 4.2 * (1 - k * 0.8); ctx.globalAlpha = (1 - k) * 0.85;
        ctx.fillStyle = k < 0.5 ? '#FFB02E' : '#FF5A1F'; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
        ctx.fillStyle = '#FFE08A'; ctx.beginPath(); ctx.arc(p.x, p.y + r * 0.2, r * 0.45, 0, TAU); ctx.fill();
      } else if (p.k === 'dust') {
        ctx.globalAlpha = (1 - k) * (0.6 + 0.4 * Math.sin(p.t * 14 + p.ph)); ctx.fillStyle = p.ph > 3 ? '#FFF6C4' : '#BFD8FF'; starPath(p.x, p.y, 2.8);
      } else if (p.k === 'petal') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = 1 - k; ctx.fillStyle = 'hsl(' + Math.round(p.hue) + ',85%,78%)'; ctx.beginPath(); ctx.ellipse(0, 0, 4, 2.2, 0, 0, TAU); ctx.fill(); ctx.restore();
      } else if (p.k === 'bolt') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = 1 - k; ctx.globalCompositeOperation = 'lighter'; const bp = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(p.ln * .4, -3); ctx.lineTo(p.ln * .6, 3); ctx.lineTo(p.ln, 0); }; ctx.lineJoin = 'round';
        ctx.strokeStyle = 'rgba(110,170,255,.45)'; ctx.lineWidth = 4.4; bp(); ctx.stroke(); ctx.strokeStyle = '#9FD8FF'; ctx.lineWidth = 1.8; bp(); ctx.stroke(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 0.7; bp(); ctx.stroke(); ctx.restore(); /* v143: leuchtender Blitz */
      } else if (p.k === 'coin') {
        const w = Math.abs(Math.cos(p.t * 9 + p.rot)) * 3 + 0.6;
        ctx.globalAlpha = 1 - k * k; ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.ellipse(p.x, p.y, w, 3.2, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#B8860B'; ctx.lineWidth = 0.8; ctx.stroke();
      } else {
        const r = 3 + k * 10, a0 = 0.5 * Math.sin(Math.min(1, k * 3 + 0.15) * Math.PI / 2) * (1 - k), g = ctx.createRadialGradient(p.x - r * 0.25, p.y - r * 0.25, 0, p.x, p.y, r); g.addColorStop(0, 'rgba(225,230,238,' + a0.toFixed(3) + ')'); g.addColorStop(0.6, 'rgba(190,198,210,' + (a0 * 0.55).toFixed(3) + ')'); g.addColorStop(1, 'rgba(170,178,190,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill(); /* v143: weicher Rauch */
      }
    }
    ctx.globalAlpha = 1;
  }
  // front = false zeichnet die Teile hinter der Figur, front = true die davor
  function drawOrbit(front) { for (const o of orbitList()) drawOrbit1(front, o); }
  function drawOrbit1(front, o) {
    if (!o || o === 'none') return;
    const cx = player.x, cy = player.y - 3;
    if (o === 'fireflies') {
      for (let i = 0; i < 6; i++) {
        const a = gt * 1.7 + i * TAU / 6, rx = 24 + Math.sin(gt * 2.1 + i * 1.7) * 5, s = Math.sin(a);
        if ((s >= 0) !== front) continue;
        const x = cx + Math.cos(a) * rx, y = cy + s * rx * 0.5 + Math.sin(gt * 3 + i) * 3, pl = 0.55 + 0.45 * Math.sin(gt * 5 + i * 2);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
        g.addColorStop(0, 'rgba(255,238,140,' + (0.9 * pl).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,238,140,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill();
        ctx.fillStyle = '#FFF6C4'; ctx.beginPath(); ctx.arc(x, y, 1.8, 0, TAU); ctx.fill();
      }
    } else if (o === 'leaves') {
      for (let i = 0; i < 7; i++) {
        const a = -gt * 1.3 + i * TAU / 7, s = Math.sin(a);
        if ((s >= 0) !== front) continue;
        ctx.save(); ctx.translate(cx + Math.cos(a) * 26, cy + s * 13); ctx.rotate(a + Math.PI / 2 + Math.sin(gt * 3 + i) * 0.4);
        ctx.fillStyle = i % 2 ? '#2F7A48' : '#63C174'; ctx.beginPath(); ctx.ellipse(0, 0, 6.5, 2.7, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(16,21,28,.45)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(6, 0); ctx.stroke();
        ctx.restore();
      }
    } else if (o === 'ring') {
      const hue = Math.round((gt * 80) % 360), rx = 22 + Math.sin(gt * 3) * 2, ry = rx * 0.5;
      ctx.lineWidth = 6; ctx.strokeStyle = 'hsla(' + hue + ',95%,65%,.18)';
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.stroke();
      ctx.lineWidth = 2.2; ctx.strokeStyle = 'hsla(' + hue + ',95%,66%,.95)';
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); ctx.stroke();
      for (let i = 0; i < 2; i++) {
        const a = gt * 3.2 + i * Math.PI, s = Math.sin(a);
        if ((s >= 0) !== front) continue;
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rx, cy + s * ry, 2.6, 0, TAU); ctx.fill();
      }
    } else if (o === 'bubbles') {
      for (let i = 0; i < 5; i++) {
        const a = gt * 1.1 + i * TAU / 5, s2 = Math.sin(a);
        if ((s2 >= 0) !== front) continue;
        const rise = (gt * 14 + i * 17) % 30, x = cx + Math.cos(a) * 24, y = cy + s2 * 10 - rise, r = 3 + (i % 2);
        ctx.strokeStyle = 'rgba(190,235,255,.85)'; ctx.lineWidth = 1.2; ctx.fillStyle = 'rgba(190,235,255,.16)';
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(x - r * .35, y - r * .35, r * .28, 0, TAU); ctx.fill();
      }
    } else if (o === 'snow') {
      for (let i = 0; i < 6; i++) {
        const a = gt * 0.8 + i * TAU / 6, s2 = Math.sin(a);
        if ((s2 >= 0) !== front) continue;
        const x = cx + Math.cos(a) * 26, y = cy + s2 * 13 + Math.sin(gt * 3 + i) * 1.5;
        ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#F4FBFF'; ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill();
      }
    } else if (o === 'hearts') {
      for (let i = 0; i < 5; i++) {
        const a = gt * 1.2 + i * TAU / 5, s = Math.sin(a); if ((s >= 0) !== front) continue;
        const x = cx + Math.cos(a) * 25, y = cy + s * 12 - 4 + Math.sin(gt * 3 + i) * 2.5, r = 3.4 + (i % 2) * 0.8;
        ctx.fillStyle = i % 2 ? '#FF7A9C' : '#FF4D78';
        ctx.beginPath(); ctx.arc(x - r * .55, y, r * .6, 0, TAU); ctx.arc(x + r * .55, y, r * .6, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x - r * 1.1, y + r * .2); ctx.lineTo(x + r * 1.1, y + r * .2); ctx.lineTo(x, y + r * 1.5); ctx.closePath(); ctx.fill();
      }
    } else if (o === 'planets') {
      const cols = ['#6EB5FF', '#FF9F5C', '#C58BE6'];
      for (let i = 0; i < 3; i++) {
        const a = gt * (1.5 - i * 0.3) + i * TAU / 3, s = Math.sin(a); if ((s >= 0) !== front) continue;
        const rr = 20 + i * 5, x = cx + Math.cos(a) * rr, y = cy + s * rr * 0.5, r = 3.2 + i * 0.6;
        ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x - r * .3, y - r * .3, r * .35, 0, TAU); ctx.fill();
        if (i === 1) { ctx.strokeStyle = 'rgba(255,230,180,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, r * 1.8, r * .6, 0.4, 0, TAU); ctx.stroke(); }
      }
    } else if (o === 'flames') {
      for (let i = 0; i < 7; i++) {
        const a = gt * 2 + i * TAU / 7, s = Math.sin(a); if ((s >= 0) !== front) continue;
        const x = cx + Math.cos(a) * 25, y = cy + s * 12.5, fl = 0.75 + 0.25 * Math.sin(gt * 14 + i * 2.3), h = 11 * fl;
        ctx.fillStyle = '#FF5A1F'; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.quadraticCurveTo(x - 3, y - h * .6, x, y - h); ctx.quadraticCurveTo(x + 3, y - h * .6, x + 4, y); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.quadraticCurveTo(x - 1.5, y - h * .4, x, y - h * .6); ctx.quadraticCurveTo(x + 1.5, y - h * .4, x + 2, y); ctx.closePath(); ctx.fill();
      }
    } else if (o === 'butterflies') {
      const cols = [['#FF8FC8', '#FFD0E8'], ['#7FC8FF', '#CFEBFF'], ['#FFD24A', '#FFF0B0']];
      for (let i = 0; i < 3; i++) {
        const a = gt * 1.0 + i * TAU / 3, s2 = Math.sin(a); if ((s2 >= 0) !== front) continue;
        const x = cx + Math.cos(a) * 26, y = cy + s2 * 12 - 6 + Math.sin(gt * 2.3 + i * 2) * 4, fl = Math.abs(Math.sin(gt * 12 + i * 1.7));
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.cos(a) * 0.3);
        ctx.fillStyle = cols[i][0]; ctx.beginPath(); ctx.ellipse(-2.6, -1.4, 3.8 * (0.25 + 0.75 * fl), 3.2, -0.3, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(2.6, -1.4, 3.8 * (0.25 + 0.75 * fl), 3.2, 0.3, 0, TAU); ctx.fill();
        ctx.fillStyle = cols[i][1]; ctx.beginPath(); ctx.ellipse(-2, 1.8, 2.4 * (0.25 + 0.75 * fl), 2, 0.3, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(2, 1.8, 2.4 * (0.25 + 0.75 * fl), 2, -0.3, 0, TAU); ctx.fill();
        ctx.fillStyle = '#3A2A33'; ctx.fillRect(-0.5, -3, 1, 6.5); ctx.restore();
      }
    } else if (o === 'notes') {
      for (let i = 0; i < 4; i++) {
        const a = gt * 1.3 + i * TAU / 4, s2 = Math.sin(a); if ((s2 >= 0) !== front) continue;
        const x = cx + Math.cos(a) * 25, y = cy + s2 * 12 - 4 + Math.sin(gt * 4 + i * 1.6) * 3;
        ctx.fillStyle = ctx.strokeStyle = 'hsl(' + Math.round((gt * 60 + i * 80) % 360) + ',85%,70%)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(x, y, 3, 2.2, -0.4, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x + 2.6, y - 0.6); ctx.lineTo(x + 2.6, y - 9); ctx.lineTo(x + 6, y - 7); ctx.stroke();
      }
    } else if (o === 'orbs') {
      const hues = [275, 190, 330];
      for (let i = 0; i < 3; i++) {
        for (let tl = 4; tl >= 0; tl--) {
          const a = gt * 2.1 + i * TAU / 3 - tl * 0.16, s2 = Math.sin(a); if ((s2 >= 0) !== front) continue;
          const x = cx + Math.cos(a) * 24, y = cy + s2 * 12, r = 4.2 - tl * 0.6;
          if (tl === 0) { const g = ctx.createRadialGradient(x, y, 0, x, y, 10); g.addColorStop(0, 'hsla(' + hues[i] + ',100%,75%,.9)'); g.addColorStop(1, 'hsla(' + hues[i] + ',100%,60%,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill(); }
          ctx.fillStyle = 'hsla(' + hues[i] + ',100%,' + (tl ? 70 : 88) + '%,' + (tl ? 0.5 - tl * 0.08 : 1) + ')'; ctx.beginPath(); ctx.arc(x, y, Math.max(1, r), 0, TAU); ctx.fill();
        }
      }
    } else if (o === 'halo') {
      if (!front) return;
      const hy = cy - 15, pulse = 0.85 + 0.15 * Math.sin(gt * 3);
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,214,90,' + (0.2 * pulse).toFixed(2) + ')'; ctx.beginPath(); ctx.ellipse(cx, hy, 10, 3.6, 0, 0, TAU); ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,230,130,' + (0.95 * pulse).toFixed(2) + ')'; ctx.beginPath(); ctx.ellipse(cx, hy, 10, 3.6, 0, 0, TAU); ctx.stroke();
      for (let i = 0; i < 4; i++) { const a = gt * 1.6 + i * TAU / 4, tw = 0.5 + 0.5 * Math.sin(gt * 6 + i * 2); ctx.fillStyle = '#FFF6C4'; ctx.globalAlpha = 0.9 * tw; starPath(cx + Math.cos(a) * 11, hy + Math.sin(a) * 4 - 2 - tw * 2, 2.6); ctx.globalAlpha = 1; }
    } else if (o === 'lanterns') {
      for (let i = 0; i < 4; i++) {
        const a = gt * 1.0 + i * TAU / 4, s2 = Math.sin(a);
        if ((s2 >= 0) !== front) continue;
        const x = cx + Math.cos(a) * 24, y = cy + s2 * 11 - 4 + Math.sin(gt * 2 + i) * 1.5, fl = 0.8 + 0.2 * Math.sin(gt * 7 + i * 2);
        const g = ctx.createRadialGradient(x, y, 0, x, y, 10); g.addColorStop(0, 'rgba(255,170,70,' + (0.55 * fl).toFixed(2) + ')'); g.addColorStop(1, 'rgba(255,170,70,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill();
        ctx.fillStyle = i % 2 ? '#E8503A' : '#F2A93B'; rr(x - 3, y - 3.4, 6, 6.8, 2.2); ctx.fill();
        ctx.fillStyle = '#5A2B1A'; ctx.fillRect(x - 2, y - 4.2, 4, 1); ctx.fillRect(x - 2, y + 3.4, 4, 1);
        ctx.fillStyle = 'rgba(255,240,170,.9)'; ctx.fillRect(x - .8, y - 1.4, 1.6, 2.8);
      }
    } else if (o === 'moons') {
      for (let i = 0; i < 3; i++) {
        const a = -gt * 1.2 + i * TAU / 3, s2 = Math.sin(a);
        if ((s2 >= 0) !== front) continue;
        const x = cx + Math.cos(a) * 26, y = cy + s2 * 12 - 2, r = 3.6 + (i === 0 ? 1.2 : 0), off = r * (i === 1 ? -0.6 : 0.6) * (i === 2 ? 0.2 : 1);
        ctx.fillStyle = 'rgba(200,215,255,.2)'; ctx.beginPath(); ctx.arc(x, y, r + 3, 0, TAU); ctx.fill();
        ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
        ctx.beginPath(); ctx.arc(x, y, r + 1, 0, TAU); ctx.arc(x + off, y - 0.5, r * 0.8, 0, TAU); ctx.fillStyle = '#EEF2FF'; ctx.fill('evenodd'); ctx.restore();
      }
    } else if (o === 'stars') {
      for (let i = 0; i < 5; i++) {
        const a = gt * 1.4 + i * TAU / 5, s = Math.sin(a);
        if ((s >= 0) !== front) continue;
        const x = cx + Math.cos(a) * 25, y = cy + s * 12.5 + Math.sin(gt * 2 + i) * 2, tw = 0.7 + 0.3 * Math.sin(gt * 6 + i * 1.9);
        ctx.fillStyle = i % 2 ? '#FFFFFF' : '#FFE08A'; ctx.globalAlpha = 0.85; starPath(x, y, 4.6 * tw); ctx.globalAlpha = 1;
      }
    }
  }

  function drawTabPlant(i) {
    const pos = POTS2[i], p = G.t.pots[i], x = pos.x, y = pos.y, rot = rotAng(pos, pos.r);
    ctx.fillStyle = '#5A4330'; ctx.fillRect(x - 17, y - 17, 34, 34);
    ctx.fillStyle = p.s && p.w > 0.3 ? '#2B1D14' : '#4A3426'; ctx.fillRect(x - 14, y - 14, 28, 28);
    potTag(x, y, rot, 14);
    if (p.s === 0) return;
    const sz = 5 + p.p * 12;
    for (let k = 0; k < 6; k++) {
      const a = k * TAU / 6 + 0.3 + (k % 2) * 0.15 + rot, Ln = sz * (k % 2 ? 1.0 : 1.25);
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.fillStyle = p.s === 2 ? (k % 2 ? '#9DB04A' : '#B8C45A') : (k % 2 ? '#3F7D3A' : '#5AA24A');
      ell(Ln * 0.6, 0, Ln * 0.7, Math.max(2, Ln * 0.34)); ctx.fill();
      ctx.strokeStyle = 'rgba(20,35,15,.5)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(Ln * 0.05, 0); ctx.lineTo(Ln * 1.25, 0); ctx.stroke();
      ctx.restore();
    }
    if (p.s === 2) {
      ctx.fillStyle = 'rgba(255,181,71,.25)'; ctx.beginPath(); ctx.arc(x, y, 21 + Math.sin(gt * 4) * 1.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F59AB8'; for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + 0.5 + rot; ctx.beginPath(); ctx.arc(x + Math.cos(a) * 5, y + Math.sin(a) * 5, 2.8, 0, TAU); ctx.fill(); }
    }
  }
  function drawHopPlant(i) { // v88: Labor-Reaktor (Fantasie): Kolben auf einer Heizplatte, Fluessigkeit steigt, fertig = leuchtende Kristalle
    const pos = POTS3[i], p = G.b.pots[i], x = pos.x, y = pos.y, rot = rotAng(pos, pos.r);
    ctx.fillStyle = '#4A5562'; ctx.fillRect(x - 17, y - 17, 34, 34); ctx.fillStyle = '#5E6A78'; ctx.fillRect(x - 17, y - 17, 34, 3);
    const hot = p.s === 1 && p.w > 0.3, low = p.s === 1 && p.w <= 0.3;
    ctx.fillStyle = '#20252C'; ctx.beginPath(); ctx.arc(x, y + 1, 13, 0, TAU); ctx.fill();
    ctx.strokeStyle = low ? 'rgba(255,92,122,' + (0.5 + 0.4 * Math.sin(gt * 6)).toFixed(2) + ')' : hot ? 'rgba(255,140,60,.85)' : '#3A414B'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y + 1, 10, 0, TAU); ctx.stroke();
    potTag(x, y, rot, 14);
    if (p.s === 0) { ctx.strokeStyle = 'rgba(210,235,250,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.stroke(); return; }
    const r = 9, lv = p.s === 2 ? 0.85 : 0.15 + p.p * 0.65, col = p.s === 2 ? '#8FD8FF' : '#4FD1C5';
    if (p.s === 2) { ctx.fillStyle = 'rgba(143,216,255,' + (0.22 + 0.1 * Math.sin(gt * 4)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(x, y, 21 + Math.sin(gt * 4) * 1.5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(210,235,250,.22)'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, r - 0.8, 0, TAU); ctx.clip(); ctx.fillStyle = col; ctx.fillRect(x - r, y + r - 2 * r * lv, 2 * r, 2 * r * lv);
    if (p.s === 1) { ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let k = 0; k < 4; k++) { const ph = (gt * (hot ? 1.2 : 0.4) + k / 4 + i * 0.13) % 1; ctx.beginPath(); ctx.arc(x - 5 + k * 3.3, y + r - ph * 2 * r * lv, 0.9, 0, TAU); ctx.fill(); } }
    else { for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + i, cx = x + Math.cos(a) * 4, cy = y + 2 + Math.sin(a) * 3; ctx.fillStyle = k % 2 ? '#DDF4FF' : '#5BC0EB'; ctx.beginPath(); ctx.moveTo(cx, cy - 3); ctx.lineTo(cx + 1.8, cy); ctx.lineTo(cx, cy + 2); ctx.lineTo(cx - 1.8, cy); ctx.closePath(); ctx.fill(); } }
    ctx.restore();
    ctx.strokeStyle = 'rgba(235,245,255,.8)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(210,235,250,.3)'; ctx.fillRect(x - 2.5, y - r - 6, 5, 7); ctx.strokeRect(x - 2.5, y - r - 6, 5, 7);
    ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.beginPath(); ctx.arc(x - 3.6, y - 3.4, 1.8, 0, TAU); ctx.fill();
    if (hot) { ctx.fillStyle = 'rgba(220,240,255,.18)'; for (let k = 0; k < 2; k++) { const ph = (gt * 0.6 + k / 2 + i * 0.2) % 1; ctx.beginPath(); ctx.arc(x + Math.sin(gt + k) * 2, y - r - 8 - ph * 10, 2.5 + ph * 3, 0, TAU); ctx.fill(); } }
    if (p.s === 2) for (let k = 0; k < 3; k++) { const a = gt * 1.5 + k * 2.1, sx = x + Math.cos(a) * 15, sy = y + Math.sin(a) * 15; ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(gt * 6 + k)).toFixed(2) + ')'; ctx.fillRect(sx - 0.8, sy - 0.8, 1.6, 1.6); }
  }

  // ---------- v117: Keller, Scheune und Labor sehen von aussen wie Gebaeude aus (wie das Casino) ----------
  const roofA = { keller: 1, tabak: 1, brau: 1 };
  const roofIn = ar => { const I = ar.IN; if (player.fl && ar.key === 'keller') return true; /* v119: Mietraum und Hinterzimmer liegen an derselben Stelle wie der Keller */ return !GH_ON && !player.fl && player.x > I.x0 - T - 4 && player.x < I.x1 + T + 4 && player.y > I.y0 - T - 4 && player.y < I.y1 + T + 4; };
  function areaHidden(ar, k) { // v154: true, wenn der Innenraum gerade nicht zu sehen ist
    const I = ar.IN, m = 140; if (I.x1 + m < viewX0 || I.x0 - m > viewX1 || I.y1 + m < viewY0 || I.y0 - m > viewY1) return true;
    return !player.fl && (state === 'play' || state === 'menu') && roofA[k] >= 0.995;
  }
  function drawAreaRoofs() {
    for (const k of ['keller', 'tabak', 'brau']) {
      const ar = AREAS[k], I = ar.IN, inside = state === 'play' && roofIn(ar); if (inside && player.fl) roofA[k] = 0;
      roofA[k] += ((inside ? 0 : 1) - roofA[k]) * fk(0.18); if (roofA[k] < 0.02) { roofA[k] = 0; continue; }
      const B = { x: I.x0 - T, y: I.y0 - T, w: I.x1 - I.x0 + 2 * T, h: I.y1 - I.y0 + 2 * T }; if (!inView(B.x + B.w / 2, B.y + B.h / 2, Math.max(B.w, B.h))) continue;
      ctx.save(); ctx.globalAlpha = roofA[k];
      if (k === 'keller') roofKeller(B, ar); else if (k === 'tabak') roofBarn(B, ar); else roofLab(B, ar);
      ctx.restore(); if (roofA[k] > 0.6) drawSideDoor(ar);
    }
  }
  function roofWin(x, y, w, h, lit, frame) { ctx.fillStyle = lit ? '#FFE3A0' : '#7FA9C4'; ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.fillRect(x, y, w, 3); ctx.strokeStyle = frame || '#E8E2D0'; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h); ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.stroke(); }
  function roofKeller(B, ar) { // Mietshaus, darunter dein Keller: Eingang mit Treppe nach unten
    const dk = lightK() > 0.25, g = bldBase(B, 1, 74, '#D8CDB8', '#8E4B3A', 'tile');
    bcDraw('rk' + (dk ? 1 : 0) + (seaSnow() ? 'w' : ''), B.x - 4, B.y - 4, B.w + 8, B.h + 8, () => { // v157: fester Teil als Bild
      ctx.fillStyle = 'rgba(0,0,0,.12)'; for (let x = B.x + 40; x < B.x + B.w; x += 110) { ctx.fillStyle = '#5A3A30'; ctx.fillRect(x, g.ry0 + 40, 22, 30); ctx.fillStyle = '#3E2A22'; ctx.fillRect(x - 2, g.ry0 + 38, 26, 5); } // Schornsteine
      ctx.fillStyle = '#C9CED6'; ctx.beginPath(); ctx.arc(B.x + B.w - 70, g.ry0 + 70, 13, 0, TAU); ctx.fill(); ctx.fillStyle = '#9AA3AD'; ctx.fillRect(B.x + B.w - 71, g.ry0 + 70, 2, 20); // Satellitenschuessel
      for (let k = 0; k < 4; k++) { const wx = B.x + 26 + k * ((B.w - 52) / 4); if (Math.abs(wx + 22 - DOOR.x) < 70) continue; roofWin(wx, g.fy0 + 16, 44, 34, dk && (k * 7 + 3) % 3 !== 0); ctx.fillStyle = '#5A8A4A'; ctx.fillRect(wx - 2, g.fy0 + 50, 48, 5); for (let q = 0; q < 5; q++) { ctx.fillStyle = ['#FF7A9A', '#FFD24A', '#B58CFF'][q % 3]; ctx.fillRect(wx + 3 + q * 9, g.fy0 + 47, 4, 4); } }
      const dx = DOOR.x, by = B.y + B.h; ctx.fillStyle = '#2A2420'; ctx.fillRect(dx - 34, g.fy0 + 8, 68, by - g.fy0 - 8); // Kellerabgang
      for (let k = 0; k < 6; k++) { ctx.fillStyle = k % 2 ? '#6B6258' : '#7E746A'; ctx.fillRect(dx - 30, g.fy0 + 12 + k * 10, 60, 6); }
      ctx.fillStyle = '#3E3832'; ctx.fillRect(dx - 36, g.fy0 + 8, 4, by - g.fy0 - 8); ctx.fillRect(dx + 32, g.fy0 + 8, 4, by - g.fy0 - 8); // Gelaender
    });
    const dx = DOOR.x, by = B.y + B.h;
    const pu = 0.85 + 0.15 * Math.sin(gt * 2.5); ctx.fillStyle = '#20262E'; rr(dx - 52, g.fy0 - 18, 104, 22, 6); ctx.fill(); ctx.strokeStyle = 'rgba(95,229,132,' + pu.toFixed(2) + ')'; ctx.lineWidth = 2; rr(dx - 52, g.fy0 - 18, 104, 22, 6); ctx.stroke();
    signTxt('▼ DEIN KELLER', dx, g.fy0 - 7, '900 11px sans-serif', 'rgba(95,229,132,' + pu.toFixed(2) + ')');
    if (dk) glow(dx, by - 6, 40, '255,220,150', 0.18);
  }
  function roofBarn(B, ar) { // rote Holzscheune mit grossem Tor
    const open = isOpen(ar), dk = lightK() > 0.25, g = bldBase(B, 1, 80, '#A63A2E', '#5E4A3A', 'tile');
    bcDraw('rb' + (open ? 1 : 0) + (dk ? 1 : 0), B.x - 4, B.y - 4, B.w + 8, B.h + 8, () => { // v157: alles außer dem Wetterhahn als Bild
      ctx.fillStyle = 'rgba(0,0,0,.14)'; for (let x = B.x + 8; x < B.x + B.w; x += 16) ctx.fillRect(x, g.fy0, 2, 80); // Bretter
      ctx.fillStyle = '#8A7A68'; ctx.fillRect(B.x + B.w / 2 - 3, g.ry0, 6, g.rh); // First
      ctx.fillStyle = 'rgba(0,0,0,.16)'; for (let y = g.ry0 + 14; y < g.ry0 + g.rh; y += 28) ctx.fillRect(B.x, y, B.w, 2); // Dachbahnen
      for (const [fx, fy] of [[0.2, 0.18], [0.8, 0.18], [0.2, 0.62], [0.8, 0.62]]) { const x = B.x + B.w * fx, y = g.ry0 + g.rh * fy; ctx.fillStyle = '#3E3228'; ctx.fillRect(x - 18, y - 12, 36, 24); ctx.fillStyle = lightK() > 0.25 && open ? '#FFE3A0' : '#7FA9C4'; ctx.fillRect(x - 15, y - 9, 30, 18); ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x - 15, y - 9, 30, 3); } // Dachfenster
      for (const vx of [B.x + B.w * 0.25, B.x + B.w * 0.75]) { ctx.fillStyle = '#4A3A2E'; ctx.fillRect(vx - 14, g.ry0 + g.rh * 0.35, 28, 22); ctx.fillStyle = '#2A2018'; for (let q = 0; q < 3; q++) ctx.fillRect(vx - 11, g.ry0 + g.rh * 0.35 + 4 + q * 6, 22, 2); } // Lueftung
      const dx = DOOR2.x, by = B.y + B.h; ctx.fillStyle = open ? '#3A2A1E' : '#6E4A32'; ctx.fillRect(dx - 44, g.fy0 + 10, 88, by - g.fy0 - 10);
      ctx.strokeStyle = '#E8E2D0'; ctx.lineWidth = 3; ctx.strokeRect(dx - 44, g.fy0 + 10, 88, by - g.fy0 - 10); if (!open) { ctx.beginPath(); ctx.moveTo(dx - 44, g.fy0 + 10); ctx.lineTo(dx + 44, by); ctx.moveTo(dx + 44, g.fy0 + 10); ctx.lineTo(dx - 44, by); ctx.stroke(); }
      for (const wx of [B.x + 40, B.x + B.w - 90]) roofWin(wx, g.fy0 + 20, 50, 30, open && dk, '#E8E2D0');
      ctx.fillStyle = '#F2E2C4'; rr(dx - 56, g.ry0 + g.rh - 40, 112, 24, 5); ctx.fill(); signTxt('TABAKSCHEUNE', dx, g.ry0 + g.rh - 28, '900 11px sans-serif', '#5E3A22');
      if (!open) roofSale(dx, g.fy0 + 40);
    });
    { const vx = B.x + B.w / 2, vy = g.ry0 + 24; ctx.fillStyle = '#3E3228'; ctx.fillRect(vx - 1, vy - 16, 2, 16); ctx.save(); ctx.translate(vx, vy - 16); ctx.rotate(Math.sin(gt * 0.6) * 0.5); ctx.fillStyle = '#C9A13A'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(8, -3); ctx.lineTo(8, 3); ctx.closePath(); ctx.fill(); ctx.restore(); } // Wetterhahn
  }
  function roofLab(B, ar) { // graues Laborgebaeude mit Flachdach, Lueftern und Warnstreifen (rein fiktiv)
    const open = isOpen(ar), dk = lightK() > 0.25, g = bldBase(B, -1, 74, '#B9C2CC', '#6E7884', 'flat');
    bcDraw('labsol' + B.x + ',' + g.ry0, B.x + 20, g.ry0 + 60, 270, 240, () => { // v157: Solarmodule als fertiges Bild
      for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) { const x = B.x + 30 + q * 62, y = g.ry0 + 70 + r * 70; ctx.fillStyle = '#2A3A5A'; ctx.fillRect(x, y, 54, 50); ctx.strokeStyle = '#8C96A3'; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, 54, 50); ctx.fillStyle = 'rgba(140,190,255,.25)'; for (let k = 1; k < 3; k++) { ctx.fillRect(x + k * 18, y, 1, 50); ctx.fillRect(x, y + k * 16.6, 54, 1); } ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x + 2, y + 2, 20, 8); } // Solarmodule
    });
    for (let k = 0; k < 3; k++) acUnit(B.x + 40 + k * 60, g.ry0 + g.rh - 40); for (let k = 0; k < 2; k++) { const vx = B.x + B.w - 120 + k * 56, vy = g.ry0 + 50; ctx.fillStyle = '#4A525C'; ctx.beginPath(); ctx.arc(vx, vy, 18, 0, TAU); ctx.fill(); ctx.strokeStyle = '#8C96A3'; ctx.lineWidth = 2; ctx.save(); ctx.translate(vx, vy); ctx.rotate(gt * (open ? 4 : 0.2)); for (let q = 0; q < 4; q++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(14, 0); ctx.stroke(); } ctx.restore(); }
    for (let x = B.x; x < B.x + B.w; x += 16) { ctx.fillStyle = (x / 16) % 2 ? '#F2C14E' : '#20232C'; ctx.fillRect(x, g.fy0 + 70, 16, 4); }
    const dx = DOOR3.x; ctx.fillStyle = open ? '#5A6874' : '#3A4048'; ctx.fillRect(dx - 26, B.y, 52, 50); ctx.fillStyle = open ? '#9FD2E8' : '#5A6068'; ctx.fillRect(dx - 22, B.y + 4, 20, 44); ctx.fillRect(dx + 2, B.y + 4, 20, 44);
    for (const wx of [B.x + 30, B.x + B.w - 130, B.x + B.w - 220]) if (Math.abs(wx + 40 - dx) > 70) roofWin(wx, B.y + 16, 80, 34, open && dk, '#E8ECF2');
    ctx.fillStyle = '#20262E'; rr(B.x + B.w / 2 - 70, g.ry0 + 18, 140, 26, 6); ctx.fill(); ctx.strokeStyle = '#5BC0EB'; ctx.lineWidth = 2; rr(B.x + B.w / 2 - 70, g.ry0 + 18, 140, 26, 6); ctx.stroke(); signTxt('CHEMIELABOR', B.x + B.w / 2, g.ry0 + 31, '900 12px sans-serif', '#BFE8FF');
    if (!open) roofSale(dx + 90, B.y + 40);
  }
  function roofSale(x, y) { ctx.save(); ctx.translate(x, y); ctx.rotate(-0.08); ctx.fillStyle = '#F4F4F8'; rr(-50, -14, 100, 28, 4); ctx.fill(); ctx.strokeStyle = '#E05555'; ctx.lineWidth = 2; rr(-50, -14, 100, 28, 4); ctx.stroke(); ctx.fillStyle = '#E05555'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('ZU VERKAUFEN', 0, -3); ctx.fillStyle = '#5A6068'; ctx.font = '700 7px sans-serif'; ctx.fillText('Handy → Laden', 0, 7); ctx.restore(); ctx.textBaseline = 'alphabetic'; }
  function drawFactory(ar) {
    if (!GH_ON && areaHidden(ar, ar.key)) return; // v154
    const I = ar.IN, tt = S(ar), brew = ar.key === 'brau', g = ar.gate, dyK = brew ? 688 : 0;
    drawFloor(ar);
    ctx.fillStyle = ar.wallCol; for (const c of ar.walls) ctx.fillRect(c.x, c.y, c.w, c.h);
    drawSideDoor(ar);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '800 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(g.title, g.titleX, g.titleY);
    if (!tt.unlocked) {
      ctx.fillStyle = '#5B4330'; ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.fillStyle = '#7A5A40'; for (let k = 0; k < 4; k++) ctx.fillRect(g.x + 2, g.y + 2 + k * 4.5, g.w - 4, 2);
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '700 11px sans-serif';
      const d2 = 14;
      if (GH_ON || !(roofA[ar.key] > 0.5)) { ctx.fillText(GH_ON ? 'Noch nicht gebaut' : 'Zu verkaufen', g.tx, g.ty); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '600 10px sans-serif'; if (!GH_ON) ctx.fillText('Handy → Laden', g.tx, g.ty + d2); } // v117: sonst steht es am Gebaeude
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(I.x0, I.y0, I.x1 - I.x0, I.y1 - I.y0);
      return;
    }
    ctx.fillStyle = '#2A3139'; ctx.fillRect(g.thr[0], g.thr[1], g.thr[2], g.thr[3]);
    drawFields(ar); drawDecorFor(ar, 0);
    for (let i = 0; i < ar.POTS.length; i++) {
      if (i >= potsOpen(ar)) { slotSq(ar.POTS[i].x, ar.POTS[i].y, i === potsOpen(ar), brew ? 'rgba(90,100,115,.35)' : 'rgba(80,58,38,.5)'); continue; } // v147
      if (brew) drawHopPlant(i); else drawTabPlant(i);
      if (!brew) drawGrowLamp(ar.POTS[i].x, ar.POTS[i].y, i + 20, tt.pots[i], rotAng(ar.POTS[i], ar.POTS[i].r)); drawDrop(ar.POTS[i].x, ar.POTS[i].y, tt.pots[i]);
    }
    drawRackFor(ar); drawTableFor(ar); // v61
    // Kisten bzw. Faesser
    if (brew) { // v88: Abzugshaube mit Lueftung und drei blaue Laborfaesser (Fantasie)
      ctx.fillStyle = '#2B3039'; rr(1958, 1104, 112, 52, 6); ctx.fill(); ctx.fillStyle = '#AEB8C4'; rr(1962, 1108, 104, 20, 4); ctx.fill();
      ctx.fillStyle = 'rgba(143,216,255,.25)'; ctx.fillRect(1966, 1130, 96, 22); ctx.strokeStyle = 'rgba(235,245,255,.5)'; ctx.lineWidth = 1; ctx.strokeRect(1966, 1130, 96, 22);
      for (let k = 0; k < 5; k++) { ctx.fillStyle = '#6B7380'; ctx.fillRect(1972 + k * 19, 1112, 12, 2); ctx.fillRect(1972 + k * 19, 1118, 12, 2); }
      const fa = gt * 4; ctx.fillStyle = '#1B1F26'; ctx.beginPath(); ctx.arc(2050, 1118, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#8C96A3'; for (let b = 0; b < 3; b++) { const a = fa + b * TAU / 3; ctx.beginPath(); ctx.ellipse(2050 + Math.cos(a) * 3, 1118 + Math.sin(a) * 3, 3, 1.3, a, 0, TAU); ctx.fill(); }
      [['#4FD1C5', 1980], ['#B983FF', 2004], ['#FFD24A', 2028]].forEach(([c, fx], k) => { ctx.fillStyle = 'rgba(210,235,250,.35)'; ctx.beginPath(); ctx.arc(fx, 1144, 5, 0, TAU); ctx.fill(); ctx.fillStyle = c; ctx.beginPath(); ctx.arc(fx, 1145.5, 3.6, 0, Math.PI); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(fx - 0.5, 1138 - ((gt * 3 + k) % 1) * 4, 1, 1); });
      for (let k = 0; k < 3; k++) { const fx = 2090 + k * 20, fy = 1140; ctx.fillStyle = '#2F6FC4'; ctx.beginPath(); ctx.arc(fx, fy, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#4A8BE0'; ctx.beginPath(); ctx.arc(fx, fy, 6.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#1F4F94'; ctx.beginPath(); ctx.arc(fx + 2.5, fy - 2, 1.5, 0, TAU); ctx.fill(); }
    }
    else { ctx.fillStyle = '#5B4330'; ctx.fillRect(1960, 420, 110, 46); ctx.fillStyle = '#7A5A40'; ctx.fillRect(1964, 424, 48, 38); ctx.fillRect(2018, 424, 48, 38); }
    drawDecorFor(ar, 1);
  }
  function drawFloor(ar) { const I = ar.IN, fl = G.build.floor[ar.key]; bcDraw('floor' + ar.key + '|' + fl.c + '|' + fl.p + '|' + I.x0 + ',' + I.y0 + ',' + I.x1 + ',' + I.y1, I.x0 - 2, I.y0 - 2, I.x1 - I.x0 + 4, I.y1 - I.y0 + 4, () => drawFloor0(ar)); } // v157: Boden als fertiges Bild
  function drawFloor0(ar) {
    const I = ar.IN, fl = G.build.floor[ar.key], w = I.x1 - I.x0, h = I.y1 - I.y0;
    ctx.fillStyle = fl.c ? FLOOR_COLORS[fl.c] : ar.floor; ctx.fillRect(I.x0, I.y0, w, h);
    ctx.lineWidth = 1;
    if (fl.p === 0) {
      ctx.beginPath();
      if (ar.key === 'brau') { ctx.strokeStyle = 'rgba(255,255,255,.08)'; for (let x = I.x0; x <= I.x1; x += 24) { ctx.moveTo(x, I.y0); ctx.lineTo(x, I.y1); } for (let y = I.y0; y <= I.y1; y += 24) { ctx.moveTo(I.x0, y); ctx.lineTo(I.x1, y); } } // v88: Laborfliesen
      else if (ar.key === 'keller') { ctx.strokeStyle = 'rgba(255,255,255,.05)'; for (let x = I.x0; x <= I.x1; x += 32) { ctx.moveTo(x, I.y0); ctx.lineTo(x, I.y1); } for (let y = I.y0; y <= I.y1; y += 32) { ctx.moveTo(I.x0, y); ctx.lineTo(I.x1, y); } }
      else { ctx.strokeStyle = 'rgba(0,0,0,.2)'; for (let x = I.x0; x <= I.x1; x += 28) { ctx.moveTo(x, I.y0); ctx.lineTo(x, I.y1); } }
      ctx.stroke();
    } else if (fl.p === 1) {
      ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.beginPath();
      for (let y = I.y0, r = 0; y <= I.y1; y += 24, r++) { ctx.moveTo(I.x0, y); ctx.lineTo(I.x1, y); for (let x = I.x0 + (r % 2 ? 40 : 100); x < I.x1; x += 120) { ctx.moveTo(x, y); ctx.lineTo(x, Math.min(I.y1, y + 24)); } }
      ctx.stroke();
    } else if (fl.p === 2) {
      ctx.fillStyle = 'rgba(255,255,255,.06)';
      for (let y = I.y0, r = 0; y < I.y1; y += 32, r++) for (let x = I.x0 + (r % 2 ? 32 : 0); x < I.x1; x += 64) ctx.fillRect(x, y, Math.min(32, I.x1 - x), Math.min(32, I.y1 - y));
    }
    roomDepth(I.x0, I.y0, I.x1, I.y1); // v147: Schatten an den Waenden, Raum wirkt tiefer
  }
  function slotSq(x, y, next, fill, label) { // v147: freier Platz (eckig) mit Plus
    ctx.fillStyle = 'rgba(0,0,0,.28)'; rr(x - 17, y - 15, 34, 34, 6); ctx.fill(); ctx.fillStyle = fill; rr(x - 15, y - 15, 30, 30, 5); ctx.fill();
    const a = next ? 0.45 + 0.2 * Math.sin(gt * 3) : 0.22; ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')'; ctx.lineWidth = 1.4; rr(x - 17, y - 17, 34, 34, 6); ctx.stroke(); ctx.setLineDash([]);
    if (label) { ctx.fillStyle = 'rgba(255,255,255,' + (a + 0.2).toFixed(2) + ')'; ctx.font = '800 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x, y); ctx.textBaseline = 'alphabetic'; return; }
    ctx.strokeStyle = 'rgba(255,255,255,' + (a + 0.1).toFixed(2) + ')'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4); ctx.stroke(); ctx.lineCap = 'butt';
  }
  function roomDepth(x0, y0, x1, y1) {
    const d = 22, sides = [[x0, y0, x1 - x0, d, 0, y0, 0, y0 + d], [x0, y1 - d * 0.6, x1 - x0, d * 0.6, 0, y1, 0, y1 - d * 0.6], [x0, y0, d, y1 - y0, x0, 0, x0 + d, 0], [x1 - d, y0, d, y1 - y0, x1, 0, x1 - d, 0]];
    for (const [x, y, w, h, gx0, gy0, gx1, gy1] of sides) { const g = ctx.createLinearGradient(gx0, gy0, gx1, gy1); g.addColorStop(0, 'rgba(0,0,0,.34)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
    ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(x0, y1 - 1.5, x1 - x0, 1.5);
  }
  function drawSideDoor(ar) {
    const s = ar.side; if (!isOpen(ar)) return;
    const own = G.build.door[ar.key], x = s.x, y0 = s.g0, h = s.g1 - s.g0;
    if (s.b.x > 0) { ctx.fillStyle = ar.wallCol; ctx.fillRect(s.b.x, s.b.y, s.b.w, s.b.h); }
    if (own) {
      ctx.fillStyle = '#2A3139'; ctx.fillRect(x, y0, T, h);
      ctx.fillStyle = '#7A5A40'; ctx.fillRect(x - 1, y0 - 3, T + 2, 4); ctx.fillRect(x - 1, y0 + h - 1, T + 2, 4);
    } else {
      ctx.fillStyle = '#5B4330'; ctx.fillRect(x, y0, T, h);
      ctx.fillStyle = '#7A5A40'; for (let k = 0; k < 4; k++) ctx.fillRect(x + 1, y0 + 4 + k * 19, T - 2, 3);
      ctx.fillStyle = '#FFB547'; ctx.beginPath(); ctx.arc(x + T / 2, y0 + h / 2, 3.2 + Math.sin(gt * 3) * 0.6, 0, TAU); ctx.fill();
    }
  }
  // Kleine Figur im Stil alter Taschenmonster-Spiele: grosser Kopf, 4 Blickrichtungen, Laufanimation
  const hexRgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const bk0 = L => hexShade(L.band, .8); // Gang-Kappe in Bandanafarbe
  const hexShade = (h, k) => { const c = hexRgb(h); return 'rgb(' + Math.min(255, Math.round(c[0] * k)) + ',' + Math.min(255, Math.round(c[1] * k)) + ',' + Math.min(255, Math.round(c[2] * k)) + ')'; };
  const COSTUME = {
    bunny: { body: '#F4F1F6', belly: '#FFD0DC', legs: '#F4F1F6', hand: '#F4F1F6', hood: '#F4F1F6' },
    bear: { body: '#8A5A36', belly: '#C99A6A', legs: '#8A5A36', hand: '#8A5A36', hood: '#8A5A36' },
    ghost: { sheet: true },
    dino: { body: '#58B368', belly: '#D9E8A0', legs: '#58B368', hand: '#58B368', hood: '#58B368', spike: '#E8833A' },
    ninja: { body: '#1A1C24', legs: '#1A1C24', hand: '#1A1C24', hood: '#1A1C24', band: '#C23B3B', shoe: '#0C0D12' },
    astro: { body: '#EEF1F6', belly: '#F7B538', legs: '#EEF1F6', hand: '#B8C0CC', hood: '#EEF1F6', shoe: '#8A93A3' },
    knight: { body: '#9AA3B2', belly: '#B6BECB', legs: '#7C8594', hand: '#7C8594', hood: '#B6BECB', shoe: '#5C6472' },
    gold: { body: '#E8B93A', belly: '#FFF0B0', legs: '#C99A22', hand: '#FFF0B0', hood: '#E8B93A', shoe: '#8A6A12' },
    neon: { body: '#FF4FB0', belly: '#4DF0C8', legs: '#2B2F6B', hand: '#4DF0C8', hood: '#FF4FB0', shoe: '#4DF0C8' },
    royal: { body: '#6B3FA0', belly: '#F2D36B', legs: '#4E2C78', hand: '#F2D36B', hood: '#6B3FA0', shoe: '#2A1740' },
    frog: { body: '#4FA85A', belly: '#D9E8A0', legs: '#4FA85A', hand: '#4FA85A', hood: '#4FA85A' },
    cat: { body: '#8A8F99', belly: '#F2D0D8', legs: '#8A8F99', hand: '#8A8F99', hood: '#8A8F99' },
    panda: { body: '#F4F4F8', belly: '#E4E6EC', legs: '#14161C', hand: '#14161C', hood: '#F4F4F8', shoe: '#14161C' },
    devil: { body: '#C23B3B', belly: '#8E2424', legs: '#8E2424', hand: '#C23B3B', hood: '#C23B3B', shoe: '#14161C' },
    robot: { body: '#9AA6B3', belly: '#5E6670', legs: '#7C8594', hand: '#C9D2DC', hood: '#B9C3CE', shoe: '#4E5762' },
    shark: { body: '#5E7FA0', belly: '#EEF2F7', legs: '#5E7FA0', hand: '#5E7FA0', hood: '#5E7FA0' },
    banana: { body: '#F2D33F', belly: '#FFF0A0', legs: '#F2D33F', hand: '#F2D33F', hood: '#F2D33F' },
    weed: { body: '#2E7D3E', belly: '#63C174', legs: '#1E5A2A', hand: '#63C174', hood: '#2E7D3E' }
  };
  function sprite(L, dir, ph, tint) {
    const Rc = (x, y, w, h, c) => { ctx.fillStyle = tint || c; ctx.fillRect(x, y, w, h); };
    const sk = SKIN_COLS[L.skin], hr = HAIR_COLS[L.hair], fem = L.sex === 'f', hs = L.hs, dk = '#10151C';
    const cs = L.cos && L.cos !== 'none' ? COSTUME[L.cos] : null;
    const up = dir === 'u', side = dir === 'l' || dir === 'r', front = !up && !side;
    const lf = Math.sin(ph) > 0 ? 1 : 0, mv = Math.abs(Math.sin(ph)) > 0.15;
    const sh = (k) => 'rgb(' + Math.round(L.r * k) + ',' + Math.round(L.g * k) + ',' + Math.round(L.b * k) + ')';
    const base = sh(1), cd = sh(.72), lt = 'rgb(' + Math.min(255, L.r + 60) + ',' + Math.min(255, L.g + 60) + ',' + Math.min(255, L.b + 60) + ')';
    ctx.save(); if (dir === 'l') ctx.scale(-1, 1);
    if (cs && cs.sheet) {
      const c = '#F2F4F8';
      Rc(-3.6, -11, 7.2, 1.6, c); Rc(side ? -4 : -5.2, -9.6, side ? 8 : 10.4, 16.2, c);
      if (!side) { Rc(-7, -1, 2, 4.4, c); Rc(5, -1, 2, 4.4, c); }
      for (let k = 0; k < (side ? 4 : 5); k++) Rc((side ? -4 : -5.2) + k * 2.1, 6.6, 2.1, k % 2 ? 1.6 : 2.6, c);
      Rc(side ? 2.2 : 3.4, -9.6, 1.8, 16, '#C9CED8');
      if (front) { Rc(-2.8, -6.2, 1.8, 2.8, dk); Rc(1, -6.2, 1.8, 2.8, dk); Rc(-.8, -2.6, 1.6, 1.8, dk); }
      else if (side) Rc(1.4, -6.2, 1.8, 2.8, dk);
      ctx.restore(); return;
    }
    // ----- Farben je nach Oberteil / Kostuem -----
    let body = base, bdk = cd, long = true, hand = sk;
    const tp = cs ? 'cs' : L.top;
    if (cs) { body = cs.body; bdk = hexShade(cs.body, .75); hand = cs.hand; }
    else if (tp === 'tshirt' || tp === 'jersey') long = false;
    else if (tp === 'xmas') { body = '#C23B3B'; bdk = '#8E2424'; }
    else if (tp === 'bomber') { body = cd; bdk = sh(.5); }
    else if (tp === 'suit') { body = '#222633'; bdk = '#12141C'; }
    else if (tp === 'tank' || tp === 'polo') long = false;
    else if (tp === 'hawaii') { long = false; body = '#2B9FA8'; bdk = '#1E7479'; }
    else if (tp === 'flannel') { body = '#B5473A'; bdk = '#8A3329'; }
    else if (tp === 'tracksuit') { body = cd; bdk = sh(.5); }
    else if (tp === 'vest') { long = false; body = '#3C4A5C'; bdk = '#2A3544'; }
    else if (tp === 'tiedye') { long = false; body = '#E85A9A'; bdk = '#B5407A'; }
    else if (tp === 'puffer') { bdk = sh(.72); }
    else if (tp === 'denim') { body = '#4C6EA0'; bdk = '#364F78'; }
    else if (tp === 'leather') { body = '#2A2A30'; bdk = '#16161A'; }
    else if (tp === 'trench') { body = '#B59A6A'; bdk = '#8A7248'; }
    const slv = tp === 'tank' ? sk : tp === 'varsity' ? '#F4F4F8' : body;
    // ----- Hose -----
    const bt = cs ? 'cs' : (L.bot === 'auto' || !L.bot ? (fem ? 'skirt' : 'plain') : L.bot); // v144: Standard ist eine schlichte Stoffhose, Jeans hat Naehte
    const lg = { col: '#35405F', pl: 4, skirt: false, bare: false, wide: false, ex: '', shoe: '#1C2030' };
    if (bt === 'skirt') { lg.skirt = true; lg.bare = true; lg.col = cd; }
    else if (bt === 'shorts') { lg.col = '#3E5A8A'; lg.pl = 2; lg.bare = true; }
    else if (bt === 'cargo') { lg.col = '#6B6A45'; lg.wide = true; lg.ex = 'cargo'; }
    else if (bt === 'baggy') { lg.col = '#2C3E66'; lg.wide = true; }
    else if (bt === 'jogger') { lg.col = '#7C8394'; lg.ex = 'jog'; }
    else if (bt === 'camo') { lg.col = '#566B3C'; lg.ex = 'camo'; }
    else if (bt === 'jeans') { lg.col = '#3F5A8C'; lg.ex = 'jeans'; }
    else if (bt === 'bermuda') { lg.col = '#9A8A5E'; lg.pl = 3; lg.bare = true; }
    else if (bt === 'sports') { lg.col = '#2B2F45'; lg.pl = 2; lg.bare = true; lg.ex = 'sport'; }
    else if (bt === 'leggings') lg.col = '#17171E';
    else if (bt === 'plaid') { lg.skirt = true; lg.bare = true; lg.col = '#9B2F3A'; lg.ex2 = 'plaid'; }
    else if (bt === 'suitpants') { lg.col = '#2A2F40'; lg.ex = 'crease'; }
    else if (bt === 'leatherp') { lg.col = '#24242A'; lg.ex = 'shine'; }
    else if (bt === 'cs') { lg.col = cs.legs; lg.shoe = cs.shoe || '#1C2030'; }
    const ly = 4, lh = lg.skirt ? 3 : 4, yo = lg.skirt ? 1 : 0;
    const plaid = (x, y, w, h) => { if (lg.ex2 === 'plaid') { Rc(x, y + .9, w, .5, '#F2C14E'); Rc(x + w * .3, y, .5, h, '#F2C14E'); Rc(x + w * .7, y, .5, h, '#1A1C24'); } };
    const sT = cs ? 'cs' : (L.shoe && L.shoe !== 'none' ? L.shoe : 'stdshoe'), tz = side ? 1.2 : 0;
    const shoeAt = (x, w, yf, isL) => {
      if (sT === 'cs' || sT === 'stdshoe' || !WEAR_BY[sT]) { Rc(x - .2, yf, w + .4, 1.5, lg.shoe); return; }
      if (sT === 'barefoot') Rc(x - .1, yf + .2, w + .2 + tz, 1.1, sk);
      else if (sT === 'slides') { Rc(x - .1, yf + .2, w + .2 + tz, 1.1, sk); Rc(x - .3, yf + 1, w + .6 + tz, .5, '#2A2D38'); Rc(x - .1, yf + .2, w + .2, .7, '#3B7BD8'); }
      else if (sT === 'sneaker') { Rc(x - .3, yf - .1, w + .6 + tz, 1, '#F4F4F8'); Rc(x - .3, yf + .9, w + .6 + tz, .6, '#C9CED8'); Rc(x + .2, yf + .2, w * .4, .4, '#E05555'); }
      else if (sT === 'runner') { Rc(x - .3, yf - .3, w + .7 + tz, 1.1, '#C6F23A'); Rc(x - .3, yf + .8, w + .7 + tz, .8, '#EDEFF5'); if (!up) Rc(x + .3, yf, w * .5, .35, '#1E2430'); }
      else if (sT === 'heels') { Rc(x - .1, yf + .1, w + .2 + tz, .9, '#C2253B'); if (side) Rc(x - .1, yf + .9, .6, 1.1, '#C2253B'); else Rc(x + w / 2 - .3, yf + .9, .6, 1.1, '#C2253B'); }
      else if (sT === 'ballet') { Rc(x - .1, yf + .3, w + .2 + tz, .9, '#F2A6B8'); if (!up && !side) Rc(x + w / 2 - .3, yf + .2, .6, .5, '#D9708C'); }
      else if (sT === 'dress') { Rc(x - .3, yf - .1, w + .6 + tz, 1.2, '#2A1C14'); Rc(x - .3, yf + 1.1, w + .6 + tz, .4, '#0E0A08'); Rc(x + .2, yf + .1, .8, .3, 'rgba(255,255,255,.4)'); }
      else if (sT === 'wellies') { Rc(x - .4, yf - 1.8, w + .8, 3.3, '#F2C14E'); Rc(x - .4, yf + 1.2, w + .8 + tz, .5, '#3A3A3A'); if (tz) Rc(x + w, yf + .2, tz, 1, '#F2C14E'); }
      else if (sT === 'boots') { Rc(x - .3, yf - 2, w + .6, 3.5, '#4A3326'); Rc(x - .3, yf + 1.2, w + .6 + tz, .5, '#1A1210'); if (tz) Rc(x + w - .3, yf + .2, tz, 1, '#4A3326'); }
      else if (sT === 'clogs') { Rc(x - .4, yf - .3, w + .8 + tz, 1.8, '#5FB86A'); Rc(x + .2, yf + .1, .5, .5, '#2E7D3E'); Rc(x + w - .7, yf + .1, .5, .5, '#2E7D3E'); Rc(x - .4, yf + 1.1, w + .8 + tz, .4, '#3E8A4A'); }
      else if (sT === 'highs') { Rc(x - .4, yf - 1.8, w + .8, 3.3, '#E05555'); Rc(x - .4, yf - 1.8, w + .8, .6, '#F4F4F8'); Rc(x - .4, yf + .9, w + .8 + tz, .7, '#F4F4F8'); if (tz) Rc(x + w, yf + .1, tz, 1, '#E05555'); if (!up) Rc(x + .3, yf - .4, w * .5, .4, '#F4F4F8'); }
      else if (sT === 'goldshoe') { Rc(x - .3, yf - .1, w + .6 + tz, 1.2, '#E8B93A'); Rc(x - .3, yf + 1.1, w + .6 + tz, .4, '#8A6A12'); const sp = ((gt * 1.4 + (isL ? 0 : .5)) % 2.2) / 2.2 * (w + 1.4) - .7; Rc(x + Math.max(-.3, Math.min(w, sp)), yf - .1, .5, 1.2, '#FFF6CC'); Rc(x + .3, yf + .1, .6, .4, '#FFF0B0'); const tw = (gt * .9 + (isL ? 0 : .45)) % 1; if (tw < .18) { const s2 = Math.sin(tw / .18 * Math.PI) * 1.4; ctx.globalAlpha = .9; Rc(x + w * .5 - .15, yf - .6 - s2, .3, s2 * 2, '#FFFFFF'); Rc(x + w * .5 - s2, yf - .75, s2 * 2, .3, '#FFFFFF'); ctx.globalAlpha = 1; } } // v143: Glanz wandert, Funkeln
      else if (sT === 'led') {
        const c = 'hsl(' + Math.floor((gt * 140 + (isL ? 0 : 90)) % 360) + ',100%,60%)';
        Rc(x - .3, yf - .1, w + .6 + tz, 1, '#1E2430');
        const pu = .55 + .45 * Math.abs(Math.sin(gt * 4 + (isL ? 0 : 1.6))); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .22 * pu; Rc(x - 1.6, yf + .4, w + 3.2 + tz, 2.4, c); ctx.globalAlpha = .4 * pu; Rc(x - .8, yf + .7, w + 1.6 + tz, 1.4, c); ctx.restore(); // v143: pulsierender Lichtschein
        Rc(x - .3, yf + .9, w + .6 + tz, .7, c); Rc(x + .2, yf + .1, w * .5, .35, c);
      } else Rc(x - .2, yf, w + .4, 1.5, lg.shoe);
    };
    const leg = (x, w, a, isL) => {
      const y0 = ly + yo + a, pl = lg.bare ? (lg.skirt ? 0 : lg.pl) : lh;
      if (pl > 0) Rc(x, y0, w, pl, lg.col);
      if (lh - pl > 0) Rc(x, y0 + pl, w, lh - pl, sk);
      if (lg.ex === 'jog') { Rc(x, y0 + lh - 1, w, 1, hexShade(lg.col, .7)); if (!up) Rc(isL ? x : x + w - .7, y0, .7, lh - 1, '#F2F2F6'); }
      else if (lg.ex === 'cargo' && !up) Rc(isL ? x - .3 : x + w - 1.1, y0 + 1.2, 1.4, 1.8, hexShade(lg.col, .72));
      else if (lg.ex === 'camo') { Rc(x + .4, y0 + .5, 1, 1, '#2F3E22'); Rc(x + 1.3, y0 + 2, 1, 1, '#8A9A5A'); Rc(x + .3, y0 + 2.6, .9, .9, '#2F3E22'); }
      if (lg.ex === 'sport') { if (!up) Rc(isL ? x : x + w - .6, y0, .6, pl, '#F4F4F8'); }
      else if (lg.ex === 'shine') Rc(x + .4, y0 + .4, .5, lh - 1, 'rgba(255,255,255,.25)');
      else if (lg.ex === 'jeans') { Rc(isL ? x + .2 : x + w - .55, y0, .35, lh - .6, '#7A95C8'); Rc(x, y0 + lh - .9, w, .6, '#5A78AE'); if (!up && !side) Rc(isL ? x + w - 1.1 : x + .3, y0 + .3, .8, .5, '#C9A13A'); }
      else if (lg.ex === 'crease') { Rc(x + w / 2 - .15, y0, .3, lh - .5, '#474E66'); Rc(x, y0 + lh - .7, w, .5, '#1A1D28'); }
      shoeAt(x, w, y0 + lh - .2, isL);
    };
    if (side) { const o = mv ? (lf ? 1.2 : -1.2) : 0; leg(-1.5 - o, 2.4, 0, true); leg(-.9 + o, 2.4, 0, false); }
    else { const a1 = mv && lf ? -1 : 0, a2 = mv && !lf ? -1 : 0; if (lg.wide) { leg(-3.4, 3, a1, true); leg(.4, 3, a2, false); } else { leg(-3, 2.6, a1, true); leg(.4, 2.6, a2, false); } }
    // ----- Koerper -----
    const sl = long ? 4.2 : 2.2;
    if (side) {
      Rc(-2.6, -2, 5.2, 6.4, body); Rc(-2.6, 2.6, 5.2, 1.2, bdk);
      if (lg.skirt) { Rc(-3.4, 2.4, 6.8, 2.6, lg.col); plaid(-3.4, 2.4, 6.8, 2.6); }
      if (tp === 'jersey') Rc(-.3, -2, .8, 6.4, '#fff');
      if (tp === 'hoodie') Rc(-3.4, -3, 2, 3.6, bdk);
      if (tp === 'xmas') Rc(-2.6, .6, 5.2, .9, '#F4F4F8');
      if (tp === 'stripe') for (const yy of [-1.4, .6, 2.6]) Rc(-2.6, yy, 5.2, .8, '#F4F4F8');
      if (tp === 'flannel') { Rc(-2.6, .2, 5.2, .7, bdk); Rc(-.2, -2, .7, 6.4, bdk); }
      if (tp === 'denim') Rc(-2.6, -2, 5.2, .8, '#6A8DBF');
      if (tp === 'leather') Rc(-2.6, -2, 5.2, .8, '#3B3B44');
      if (tp === 'trench') { Rc(-2.6, 1.6, 5.2, .8, bdk); Rc(-3, 3.8, 6, 1.6, body); }
      if (tp === 'hawaii') { Rc(-1.6, 0, 1.1, 1.1, '#F2C14E'); Rc(.4, 1.8, 1.1, 1.1, '#F4F4F8'); }
      if (tp === 'tiedye') { Rc(-2, -.8, 1.4, 1.4, '#F2C14E'); Rc(.4, 1, 1.6, 1.6, '#4BC8FF'); Rc(-1.6, 2.4, 1.2, 1.2, '#5FE584'); }
      if (tp === 'puffer') for (const yy of [-.6, 1.3, 3.1]) Rc(-2.6, yy, 5.2, .6, bdk);
      if (tp === 'varsity') Rc(-2.6, 3.4, 5.2, .6, '#F4F4F8');
      if (tp === 'polo') Rc(-1, -2, 2, .9, lt);
      if (tp === 'sweater') { Rc(-2.6, 2.4, 5.2, 1.6, bdk); Rc(-2.6, 0, 5.2, .7, lt); }
      if (tp === 'cs' && L.cos === 'astro') Rc(-4.2, -1, 2.4, 5.4, '#B8C0CC');
      if (tp === 'cs' && L.cos === 'dino') { Rc(-4.4, 2.6, 2.4, 1.6, body); Rc(-5.8, 3.4, 1.8, 1.2, cs.spike); }
      const ao = mv ? (lf ? -1.2 : 1.2) : 0;
      Rc(-1.1 + ao, -1.4, 2.4, sl, slv); if (tp === 'tracksuit') Rc(-.1 + ao, -1.4, .7, sl, '#F4F4F8'); Rc(-1.1 + ao, long ? 2.8 : 0.8, 2.4, long ? 1.6 : 3.6, hand);
      if (tp === 'sweater' || tp === 'bomber') Rc(-1.1 + ao, 2.1, 2.4, .7, bdk);
    } else {
      Rc(-3.4, -2, 6.8, 6.4, body); Rc(-3.4, 2.8, 6.8, 1.2, bdk);
      if (lg.skirt) { Rc(-4.4, 2.2, 8.8, 2.8, lg.col); plaid(-4.4, 2.2, 8.8, 2.8); Rc(-4.4, 2.2, 8.8, .8, body); }
      if (tp === 'sweater') { Rc(-3.4, 2.4, 6.8, 1.6, bdk); Rc(-3.4, 0, 6.8, .7, lt); }
      else if (tp === 'hoodie') { if (front) { Rc(-3.6, -2.4, 7.2, 1.6, bdk); Rc(-2.4, 1.2, 4.8, 2, bdk); Rc(-1.4, -1, .6, 2, '#F4F4F8'); Rc(.8, -1, .6, 2, '#F4F4F8'); } else Rc(-3.6, -3, 7.2, 3.8, bdk); }
      else if (tp === 'jersey') { Rc(-3.4, -2, .9, 6.4, '#fff'); Rc(2.5, -2, .9, 6.4, '#fff'); if (front) Rc(-1, .2, 2, 2.4, '#fff'); else { Rc(-1.6, -.6, 3.2, 3.6, '#fff'); Rc(-.6, .4, 1.2, 2, dk); } }
      else if (tp === 'xmas') { Rc(-3.4, .6, 6.8, .9, '#F4F4F8'); Rc(-2.4, 2, 1, 1, '#2E8B4A'); Rc(-.5, 2.4, 1, 1, '#F2C14E'); Rc(1.4, 2, 1, 1, '#2E8B4A'); }
      else if (tp === 'bomber') { if (front) Rc(-.3, -2, .6, 6.4, '#D5DBE8'); Rc(-3.4, -2.4, 6.8, .9, sh(.9)); }
      else if (tp === 'tank') { if (front) Rc(-1.8, -2, 3.6, 1.4, sk); }
      else if (tp === 'polo') { if (front) { Rc(-1.8, -2.2, 3.6, 1, lt); Rc(-.3, -1.2, .6, 2, lt); Rc(-.3, -.4, .6, .5, dk); } else Rc(-3.4, -2.4, 6.8, .9, lt); }
      else if (tp === 'stripe') { for (const yy of [-1.4, .6, 2.6]) Rc(-3.4, yy, 6.8, .8, '#F4F4F8'); }
      else if (tp === 'hawaii') { if (!up) { Rc(-2.4, -.6, 1.2, 1.2, '#F2C14E'); Rc(1, .4, 1.2, 1.2, '#F4F4F8'); Rc(-.6, 2.2, 1.2, 1.2, '#F28BB0'); Rc(1.8, 2.6, 1, 1, '#F2C14E'); } Rc(-3.4, -2.4, 6.8, .9, '#1E7479'); }
      else if (tp === 'flannel') { Rc(-3.4, .2, 6.8, .7, bdk); Rc(-1.2, -2, .7, 6.4, bdk); Rc(1.6, -2, .7, 6.4, bdk); }
      else if (tp === 'tracksuit') { if (front) Rc(-.3, -2, .6, 6.4, '#F4F4F8'); Rc(-3.4, -2.4, 6.8, .9, '#F4F4F8'); }
      else if (tp === 'tiedye') { if (!up) { Rc(-2.6, -1, 1.6, 1.6, '#F2C14E'); Rc(.6, .1, 1.8, 1.8, '#4BC8FF'); Rc(-1.4, 1.9, 1.6, 1.6, '#5FE584'); Rc(1.6, 2.5, 1.2, 1.2, '#B58CFF'); } else { Rc(-2, 0, 1.8, 1.8, '#F2C14E'); Rc(.8, 1.6, 1.6, 1.6, '#4BC8FF'); } Rc(-3.4, -2.4, 6.8, .9, bdk); }
      else if (tp === 'puffer') { Rc(-3.6, -2.6, 7.2, 1.2, bdk); for (const yy of [-.6, 1.3, 3.1]) Rc(-3.4, yy, 6.8, .6, bdk); if (front) Rc(-.3, -2, .6, 6.4, sh(.55)); }
      else if (tp === 'varsity') { Rc(-3.4, -2.4, 6.8, .9, '#F4F4F8'); Rc(-3.4, 3.4, 6.8, .6, '#F4F4F8'); if (front) { Rc(-.3, -2, .6, 6.4, '#F4F4F8'); Rc(-2.9, -.8, 1.8, 2, '#F4F4F8'); Rc(-2.5, -.4, 1, 1.2, cd); } else Rc(-1.6, -.6, 3.2, 2.6, '#F4F4F8'); }
      else if (tp === 'vest') { if (front) { Rc(-.3, -2, .6, 6.4, '#8FA0B8'); Rc(-2.9, 1.4, 1.6, 1.4, bdk); Rc(1.3, 1.4, 1.6, 1.4, bdk); } else Rc(-3.4, -2.4, 6.8, .9, bdk); }
      else if (tp === 'denim') { Rc(-3.4, -2.4, 6.8, .9, '#6A8DBF'); if (front) { Rc(-.2, -2, .4, 6.4, bdk); Rc(-2.8, .4, 1.8, 1.6, bdk); Rc(1, .4, 1.8, 1.6, bdk); } }
      else if (tp === 'leather') { Rc(-3.4, -2.4, 6.8, .9, '#3B3B44'); if (front) { Rc(-1.4, -2, .6, 6.4, '#8A8F99'); Rc(-3.4, -2, 1.8, 2.2, '#3B3B44'); Rc(1.6, -2, 1.8, 2.2, '#3B3B44'); } }
      else if (tp === 'trench') { Rc(-3.8, 3.6, 7.6, 1.8, body); Rc(-3.4, 1.6, 6.8, .8, bdk); if (front) { Rc(-.3, -2, .6, 7.4, bdk); Rc(-1.6, -1, .8, .8, '#E8D6A0'); Rc(.8, -1, .8, .8, '#E8D6A0'); Rc(-3.4, -2.4, 2, 1.8, bdk); Rc(1.4, -2.4, 2, 1.8, bdk); } }
      else if (tp === 'suit') { if (front) { Rc(-1.4, -2, 2.8, 3.4, '#F4F4F8'); Rc(-.4, -1.4, .8, 3.4, '#C23B3B'); Rc(-1.9, -2, .7, 2.8, bdk); Rc(1.2, -2, .7, 2.8, bdk); } }
      else if (tp === 'cs') {
        if (front && cs.belly) { if (L.cos === 'astro') { Rc(-1.8, -.4, 3.6, 2.4, cs.belly); Rc(-1, .2, .8, .8, dk); Rc(.4, .2, .8, .8, '#E05555'); } else if (L.cos === 'knight') { Rc(-.4, -2, .8, 6.4, bdk); Rc(-3.4, .6, 6.8, .6, bdk); } else Rc(-2.2, -1, 4.4, 4, cs.belly); }
        if (up && L.cos === 'astro') Rc(-3, -.5, 6, 5.6, '#B8C0CC');
        if (L.cos === 'dino') { if (up) { Rc(-1, 3.5, 2, 1.6, body); Rc(-.6, 5, 1.2, 1.2, cs.spike); } Rc(-.8, -1.6, 1.6, 1.2, cs.spike); }
        if (L.cos === 'knight') { Rc(-5.6, -2, 2.4, 2, '#B6BECB'); Rc(3.2, -2, 2.4, 2, '#B6BECB'); }
      }
      const a1 = mv && lf ? -.8 : 0, a2 = mv && !lf ? -.8 : 0;
      for (const [ax, aa] of [[-5.2, a1], [3.3, a2]]) {
        Rc(ax, -1.4 + aa, 1.9, sl, slv); if (tp === 'tracksuit') Rc(ax + .6, -1.4 + aa, .6, sl, '#F4F4F8'); Rc(ax, long ? 2.6 + aa : .8 + aa, 1.9, long ? 1.6 : 3.4, hand);
        if (tp === 'sweater' || tp === 'bomber') Rc(ax, 2 + aa, 1.9, .7, bdk);
      }
      if (!up && tp !== 'suit' && tp !== 'hoodie') Rc(-.5, -2, 1, 1, sk);
    }
    // ----- Kopf -----
    const hw = side ? 7 : 8, hx = -hw / 2, hood = cs && cs.hood, bald = hs === 9;
    const hairOn = !cs && L.hat !== 'beanie' && L.hat !== 'pompom';
    if (!cs && up && !bald && (hs === 1 || hs === 4 || hs === 7 || fem)) Rc(hx - .4, -8, hw + .8, 9.5, hr);
    Rc(hx, -9, hw, 7.4, sk);
    if (cs && L.cos === 'ninja' && !up) { /* Maske spaeter */ }
    if (front) { Rc(-2.7, -5.4, 1.4, 2, dk); Rc(1.3, -5.4, 1.4, 2, dk); Rc(-2.4, -5.2, .6, .6, '#fff'); Rc(1.6, -5.2, .6, .6, '#fff'); if (fem) { Rc(-3.1, -5.8, .8, .6, dk); Rc(2.3, -5.8, .8, .6, dk); } Rc(-.5, -2.8, 1, .6, '#B4584E'); }
    else if (side) { Rc(1.4, -5.4, 1.4, 2, dk); Rc(1.8, -5.2, .6, .6, '#fff'); Rc(1.6, -2.8, 1.2, .6, '#B4584E'); }
    // ----- Haare -----
    if (hairOn && !bald) {
      if (up) {
        if (hs === 12) Rc(-1, -11.2, 2, 10, hr); else if (hs === 14) Rc(hx, -9.4, hw, 7.6, hexShade(hr, .85)); else Rc(hx - .4, -9.8, hw + .8, 8.6, hr);
        if (hs === 1) Rc(hx - 1, -3, hw + 2, 4.6, hr);
        else if (hs === 2) { Rc(-3.4, -11.8, 1.8, 2.4, hr); Rc(-.9, -12.4, 1.8, 3, hr); Rc(1.6, -11.8, 1.8, 2.4, hr); }
        else if (hs === 3) Rc(-2, -12.2, 4, 3.2, hr);
        else if (hs === 4) Rc(-4.8, -9.8, 9.6, 8.8, hr);
        else if (hs === 5) { Rc(-1.2, -3, 2.4, 6, hr); Rc(-1.4, -3.6, 2.8, .9, '#E26FB0'); }
        else if (hs === 6) { Rc(-5.8, -6, 1.8, 7.4, hr); Rc(4, -6, 1.8, 7.4, hr); }
        else if (hs === 7) Rc(-5.4, -12.4, 10.8, 10.6, hr);
        else if (hs === 10) { Rc(-3.4, -11.2, 6.8, 1.8, hr); Rc(hx - .4, -5, hw + .8, 3.6, hexShade(hr, .55)); }
        else if (hs === 11) Rc(-3.8, -12.4, 7.6, 2.8, hr);
        else if (hs === 13) Rc(-5.8, -13.4, 11.6, 12, hr);
        else if (hs === 15) Rc(hx - 1, -3, hw + 2, 5, hr);
        else if (hs === 17) Rc(-4.8, -9.8, 9.6, 6.4, hr);
      } else if (side) {
        if (hs === 12) Rc(-1.2, -12.8, 2.6, 5, hr); else if (hs === 14) { Rc(hx, -9.4, hw, 2.4, hexShade(hr, .85)); Rc(hx, -9.4, 2.6, 5, hexShade(hr, .85)); } else { Rc(hx - .4, -9.8, hw + .6, 3.4, hr); Rc(hx - .4, -9.8, 3, 7.2, hr); }
        if (hs === 1) Rc(hx - .8, -7, 2.6, 8, hr);
        else if (hs === 2) { Rc(-1, -11.6, 1.6, 2, hr); Rc(1, -11, 1.6, 1.6, hr); Rc(-3, -11, 1.6, 1.6, hr); }
        else if (hs === 3) Rc(hx - 2.2, -10, 3.4, 3.4, hr);
        else if (hs === 4) { Rc(hx - .8, -9.8, 4, 8, hr); Rc(.5, -7.6, 3.2, 1.2, hr); }
        else if (hs === 5) { Rc(hx - 2.2, -8.2, 2.4, 2, hr); Rc(hx - 2.6, -6.4, 2, 5, hr); Rc(hx - 2.4, -8.6, 1, 2.6, '#E26FB0'); }
        else if (hs === 6) { Rc(hx - 1.6, -7, 2.4, 6.5, hr); Rc(hx - 1.6, -7.4, 2.4, .9, '#E26FB0'); }
        else if (hs === 7) { Rc(-4.6, -12.4, 8.6, 6.8, hr); Rc(hx - 1.2, -8, 3.4, 5, hr); }
        else if (hs === 8) Rc(.5, -7.6, 3.2, 1.4, hr);
        else if (hs === 10) { Rc(-3.2, -11.2, 6.4, 1.8, hr); Rc(hx - .4, -6.4, 3, 3.8, hexShade(hr, .55)); }
        else if (hs === 11) { Rc(-3, -12.6, 7.2, 3, hr); Rc(2, -13.6, 3.6, 1.8, hr); }
        else if (hs === 13) Rc(-5.6, -13.4, 10.8, 9, hr);
        else if (hs === 15) Rc(hx - .8, -7, 2.6, 8, hr);
        else if (hs === 16) Rc(hx - .4, -9.8, 4, 7, hr);
        else if (hs === 17) Rc(hx - .8, -9.8, hw + 1.2, 5.4, hr);
        else if (fem && hs === 0) Rc(hx - .8, -7, 2.4, 5, hr);
      } else {
        if (hs === 12) Rc(-1, -13.2, 2, 5.4, hr);
        else if (hs === 14) { Rc(-4, -9.4, 8, 2.6, hexShade(hr, .85)); Rc(-4, -9.4, 1.2, 4.6, hexShade(hr, .85)); Rc(2.8, -9.4, 1.2, 4.6, hexShade(hr, .85)); }
        else { Rc(-4.4, -9.8, 8.8, 3.2, hr); Rc(-4.4, -9.8, 1.8, 6.2, hr); Rc(2.6, -9.8, 1.8, 6.2, hr); Rc(-1.2, -7, 3.2, 1.2, hr); }
        if (hs === 1) { Rc(-5, -7, 2.2, 8.6, hr); Rc(2.8, -7, 2.2, 8.6, hr); }
        else if (hs === 2) { Rc(-3.4, -11.8, 1.8, 2.4, hr); Rc(-.9, -12.4, 1.8, 3, hr); Rc(1.6, -11.8, 1.8, 2.4, hr); }
        else if (hs === 3) Rc(-2, -12.2, 4, 3.2, hr);
        else if (hs === 4) { Rc(-4.8, -9.8, 2.4, 8, hr); Rc(2.4, -9.8, 2.4, 8, hr); Rc(-4, -7.4, 8, 1.6, hr); }
        else if (hs === 5) { Rc(-2.4, -7, 4.4, 1.2, hr); }
        else if (hs === 6) { Rc(-6.2, -7, 2, 6.5, hr); Rc(4.2, -7, 2, 6.5, hr); Rc(-6.2, -7.4, 2, .9, '#E26FB0'); Rc(4.2, -7.4, 2, .9, '#E26FB0'); }
        else if (hs === 7) { Rc(-5.4, -12.4, 10.8, 6.8, hr); Rc(-5.4, -8, 2, 5, hr); Rc(3.4, -8, 2, 5, hr); Rc(-3, -7, 6, 1.2, hr); }
        else if (hs === 8) { Rc(-4, -7, 5.6, 1.8, hr); Rc(1.8, -9.6, .5, 2, 'rgba(0,0,0,.25)'); }
        else if (hs === 10) { Rc(-3.6, -11.2, 7.2, 1.8, hr); Rc(-4.4, -6.6, 1.8, 3.2, hexShade(hr, .5)); Rc(2.6, -6.6, 1.8, 3.2, hexShade(hr, .5)); }
        else if (hs === 11) { Rc(-3.6, -12.6, 7.4, 3, hr); Rc(0, -13.8, 4.2, 1.6, hr); }
        else if (hs === 13) { Rc(-5.8, -13.4, 11.6, 6.6, hr); Rc(-5.8, -9, 2.2, 5.6, hr); Rc(3.6, -9, 2.2, 5.6, hr); }
        else if (hs === 15) { Rc(-4.8, -4, 1.4, 5.6, hr); Rc(3.4, -4, 1.4, 5.6, hr); }
        else if (hs === 16) { Rc(-4.6, -9.8, 4.2, 7.2, hr); Rc(.4, -9.8, 4.2, 7.2, hr); Rc(-.4, -9.4, .8, 2.4, sk); }
        else if (hs === 17) Rc(-4.8, -9.8, 9.6, 5.4, hr);
        else if (fem && hs === 0) { Rc(-4.8, -7, 2, 5, hr); Rc(2.8, -7, 2, 5, hr); }
      }
    } else if (bald && !cs && !up && L.hat === 'none') Rc(-1.5, -8.6, 2, .8, 'rgba(255,255,255,.35)');
    // ----- Kostuemkopf -----
    if (cs) {
      const c = hood;
      if (L.cos === 'astro') {
        if (front) { Rc(-5.2, -11.4, 10.4, 2, c); Rc(-5.2, -11.4, 2, 10.6, c); Rc(3.2, -11.4, 2, 10.6, c); Rc(-5.2, -2.2, 10.4, 1.4, c); Rc(-3.2, -9.4, 6.4, 7.6, 'rgba(120,190,255,.28)'); Rc(-2.4, -8.6, 1.2, 2.4, 'rgba(255,255,255,.55)'); }
        else if (up) Rc(-5.2, -11.4, 10.4, 10.8, c);
        else { Rc(-4.6, -11.4, 4.6, 10.6, c); Rc(-4.6, -11.4, 8.6, 2, c); Rc(-4.6, -2.2, 8.6, 1.4, c); Rc(0, -9.4, 4, 7.6, 'rgba(120,190,255,.28)'); Rc(3.4, -11.4, 1.2, 10.6, c); }
      } else if (L.cos === 'knight') {
        if (front) { Rc(-4.8, -11.2, 9.6, 9.8, c); Rc(-3.6, -6.4, 7.2, 1.4, dk); Rc(-.5, -6.4, 1, 4, dk); Rc(-3, -3.2, 6, .6, dk); }
        else if (up) Rc(-4.8, -11.2, 9.6, 10, c);
        else { Rc(-4.4, -11.2, 8.8, 9.8, c); Rc(.6, -6.4, 3.8, 1.4, dk); }
        Rc(-.8, -14.4, 1.6, 3.4, '#C23B3B');
      } else {
        if (front) { Rc(-4.6, -10, 9.2, 3.2, c); Rc(-4.6, -10, 1.6, 7.4, c); Rc(3, -10, 1.6, 7.4, c); }
        else if (up) Rc(-4.6, -10, 9.2, 9, c);
        else { Rc(-4.2, -10, 7.6, 3.4, c); Rc(-4.2, -10, 3.4, 7.4, c); }
        if (L.cos === 'bunny') { if (side) { Rc(-1.6, -17.4, 2, 7.6, c); Rc(-1.1, -15.6, 1, 4.4, cs.belly); } else { Rc(-3.4, -17.4, 2, 7.6, c); Rc(1.4, -17.4, 2, 7.6, c); if (front) { Rc(-2.9, -15.6, 1, 4.4, cs.belly); Rc(1.9, -15.6, 1, 4.4, cs.belly); } } }
        else if (L.cos === 'bear') { if (side) { Rc(-2.4, -12.4, 2.8, 2.8, c); Rc(-1.8, -11.8, 1.5, 1.5, cs.belly); } else { Rc(-4.8, -12.4, 2.8, 2.8, c); Rc(2, -12.4, 2.8, 2.8, c); if (front) { Rc(-4.2, -11.8, 1.5, 1.5, cs.belly); Rc(2.7, -11.8, 1.5, 1.5, cs.belly); Rc(-1.2, -3.6, 2.4, 1.6, cs.belly); Rc(-.5, -3.6, 1, .7, dk); } } }
        else if (L.cos === 'dino') { Rc(-1, -11.8, 2, 1.8, cs.spike); if (!side) { Rc(-3, -11.2, 1.6, 1.4, cs.spike); Rc(1.4, -11.2, 1.6, 1.4, cs.spike); } else Rc(-3, -11.2, 1.6, 1.4, cs.spike); }
        else if (L.cos === 'ninja') { if (!up) Rc(-3.4, -4.2, 6.8, 3, c); Rc(-4.8, -8.2, 9.6, 1.4, cs.band); if (up) Rc(-6.2, -8.2, 1.6, 3, cs.band); }
        else if (L.cos === 'frog') { for (const x of side ? [-.6] : [-3.6, 1.2]) { Rc(x, -12.2, 2.6, 2.6, c); if (!up) { Rc(x + .5, -11.7, 1.6, 1.6, '#FFFFFF'); Rc(x + 1, -11.2, .8, .8, dk); } } }
        else if (L.cos === 'cat') { if (side) Rc(-1.8, -12.2, 2.2, 2.6, c); else { Rc(-4.4, -12.2, 2.2, 2.6, c); Rc(2.2, -12.2, 2.2, 2.6, c); if (front) { Rc(-3.8, -11.4, 1, 1.4, cs.belly); Rc(2.8, -11.4, 1, 1.4, cs.belly); Rc(-5.4, -3.6, 2, .4, '#F4F4F8'); Rc(3.4, -3.6, 2, .4, '#F4F4F8'); } } }
        else if (L.cos === 'panda') { if (side) Rc(-2.4, -12.2, 2.6, 2.6, '#14161C'); else { Rc(-4.8, -12.2, 2.6, 2.6, '#14161C'); Rc(2.2, -12.2, 2.6, 2.6, '#14161C'); if (front) { Rc(-3.2, -6.2, 2.2, 2.6, '#14161C'); Rc(1, -6.2, 2.2, 2.6, '#14161C'); } } }
        else if (L.cos === 'devil') { if (side) Rc(-.4, -12.6, 1.2, 2.8, '#F2C14E'); else { Rc(-3.8, -12.6, 1.2, 2.8, '#F2C14E'); Rc(2.6, -12.6, 1.2, 2.8, '#F2C14E'); } }
        else if (L.cos === 'robot') { Rc(-.4, -14.8, .8, 4.6, '#8C96A3'); Rc(-1, -15.6, 2, 1.4, Math.floor(gt * 3) % 2 ? '#FF4B4B' : '#63FF9A'); if (front) Rc(-3, -7, 6, 1.6, '#4DF0C8'); else if (side) Rc(.4, -7, 3.4, 1.6, '#4DF0C8'); }
        else if (L.cos === 'shark') { Rc(side ? -2.6 : -1, -14.4, side ? 3.6 : 2, 4.4, c); if (front) for (let k = 0; k < 4; k++) Rc(-3 + k * 1.6, -3.4, .9, .9, '#FFFFFF'); }
        else if (L.cos === 'banana') Rc(-.8, -13.4, 1.6, 3.4, '#6B4A2A');
        else if (L.cos === 'weed' && !tint) cannaLeaf(0, -10.5, 7.5, '#63C174');
      }
    }
    // ----- Bandana (v52, nur Gangs) -----
    const bStyle = L.bs || (L.bnd === 'bandrag' ? 'rag' : L.bnd === 'bandmask' ? 'mask' : L.bnd === 'bandneck' ? 'neck' : '');
    if (!cs && bStyle) {
      const bc = L.band || lt, bk = L.band ? hexShade(L.band, .68) : cd, dot = 'rgba(255,255,255,.75)';
      if (bStyle === 'rag') { // Kopftuch mit Knoten hinten
        Rc(-4.8, -11.4, 9.6, 3.8, bc); Rc(-4.8, -8, 9.6, .7, bk);
        if (up) { Rc(-1.4, -7.4, 2.8, 1.6, bk); Rc(-.8, -5.8, 1.6, 2.4, bc); } else if (side) { Rc(-6, -9.6, 1.6, 2.4, bk); Rc(-6.8, -8.4, 1.4, 2.2, bc); }
        Rc(-2.6, -10.4, .7, .7, dot); Rc(.6, -10.6, .7, .7, dot); Rc(2.6, -9.6, .7, .7, dot); Rc(-.8, -9.2, .7, .7, dot);
      } else if (bStyle === 'mask') { // vor Mund und Nase
        if (!up) { const x0 = side ? -1 : -4, w0 = side ? 5.4 : 8; Rc(x0, -4.6, w0, 2.8, bc); Rc(x0 + (side ? .6 : 1.6), -1.8, w0 - (side ? 1.6 : 3.2), 1.2, bc); Rc(x0, -4.6, w0, .5, bk); Rc(x0 + 1.4, -3.4, .6, .6, dot); Rc(x0 + w0 - 2.2, -3, .6, .6, dot); }
        else Rc(-4, -4.4, 8, 1, bk);
      } else if (bStyle === 'neck') { // locker um den Hals
        if (!up) { Rc(-3.4, -2.4, 6.8, 1.6, bc); if (front) { Rc(-1.6, -.8, 3.2, 1.4, bc); Rc(-.8, .6, 1.6, 1, bk); } } else Rc(-3.4, -2.4, 6.8, 1.4, bk);
      }
    }
    // ----- Huete -----
    const hc = L.band ? bk0(L) : cd, H = L.hat;
    if (!cs && H && H !== 'none') {
      if (H === 'backcap') { Rc(-4.6, -10.4, 9.2, 3.4, hc); Rc(-4.6, -8, 9.2, .8, 'rgba(255,255,255,.3)'); if (side) Rc(-6.4, -8.4, 3.2, 1.3, hc); else if (up) Rc(-4, -7.6, 8, 1.5, hc); else Rc(-1.6, -10.9, 3.2, .9, 'rgba(0,0,0,.35)'); }
      else if (H === 'cap') { Rc(-4.6, -10.4, 9.2, 3.4, hc); Rc(-4.6, -8, 9.2, .8, 'rgba(255,255,255,.35)'); if (side) Rc(1.6, -7.6, 4.2, 1.2, hc); else if (front) Rc(-4.6, -7.6, 9.2, 1.2, hc); }
      else if (H === 'beanie') { Rc(-4.6, -10.8, 9.2, 4.4, hc); Rc(-4.6, -7.2, 9.2, 1.2, 'rgba(255,255,255,.4)'); Rc(-1, -12, 2, 1.4, hc); }
      else if (H === 'sportcap') { Rc(-4.6, -10.6, 9.2, 3.6, '#F4F4F8'); Rc(-4.6, -8.2, 9.2, .8, base); if (side) Rc(1.6, -7.8, 4.4, 1.3, base); else if (front) Rc(-4.6, -7.8, 9.2, 1.3, base); else Rc(-1, -8, 2, 1, hc); }
      else if (H === 'pompom') { Rc(-4.6, -10.8, 9.2, 4.4, base); Rc(-4.6, -7.2, 9.2, 1.4, '#F4F4F8'); Rc(-1.8, -14, 3.6, 3.6, '#F4F4F8'); Rc(-1, -13.4, 1, 1, '#DDE1EA'); }
      else if (H === 'santa') { Rc(-4.6, -10.8, 9.2, 3.2, '#D83A3A'); Rc(-3.4, -12.6, 6.4, 2, '#D83A3A'); Rc(side ? -5.6 : 1.6, -13.8, 3.6, 2, '#D83A3A'); Rc(side ? -7.4 : 4.4, -14.4, 2.6, 2.6, '#F4F4F8'); Rc(-4.8, -8.2, 9.6, 1.6, '#F4F4F8'); }
      else if (H === 'pumpkin') { Rc(-5.6, -13.2, 11.2, 6, '#E8761E'); Rc(-4.6, -14.2, 9.2, 1.2, '#E8761E'); Rc(-5.6, -7.6, 11.2, .9, '#B9561A'); Rc(-2.2, -13.2, .8, 6, 'rgba(120,50,10,.35)'); Rc(1.4, -13.2, .8, 6, 'rgba(120,50,10,.35)'); Rc(-.8, -16, 1.6, 2, '#4A6A2A'); Rc(.6, -15.8, 1.8, .8, '#5E8A34'); if (front) { Rc(-3.6, -11.6, 2, 1.4, '#3A1A08'); Rc(1.6, -11.6, 2, 1.4, '#3A1A08'); Rc(-3, -9.4, 6, 1, '#3A1A08'); Rc(-1, -9.4, 1, .6, '#E8761E'); } else if (side) Rc(1.8, -11.6, 2, 1.4, '#3A1A08'); } // v155
      else if (H === 'headband') Rc(-4.6, -8.4, 9.2, 1.5, '#D94F4F');
      else if (H === 'cowboy') { Rc(-6.6, -9.4, 13.2, 1.4, '#8A5A34'); Rc(-3.6, -12.8, 7.2, 3.6, '#A06A3C'); Rc(-3.6, -10.4, 7.2, .8, '#3A2A1C'); }
      else if (H === 'partyhat') { Rc(-1, -15.2, 2, 1.6, '#F6E27A'); Rc(-1.8, -13.6, 3.6, 1.6, '#E05A9A'); Rc(-2.8, -12, 5.6, 1.6, '#4B8DFF'); Rc(-3.8, -10.4, 7.6, 1.6, '#E05A9A'); Rc(-4.4, -8.8, 8.8, .8, '#F6E27A'); }
      else if (H === 'sailor') { Rc(-4.8, -10.4, 9.6, 2.8, '#F4F4F8'); Rc(-5.2, -8.2, 10.4, 1, '#2F4F8F'); if (front) Rc(-1, -9.6, 2, .8, '#2F4F8F'); }
      else if (H === 'viking') { Rc(-4.8, -10.6, 9.6, 3, '#9AA3AD'); Rc(-4.8, -8.2, 9.6, .8, '#6E7783'); if (side) Rc(-.8, -13, 1.6, 2.6, '#F4EFD8'); else { Rc(-6.4, -12.4, 1.6, 2.6, '#F4EFD8'); Rc(4.8, -12.4, 1.6, 2.6, '#F4EFD8'); Rc(-5.6, -10.6, 1, 1.2, '#F4EFD8'); Rc(4.6, -10.6, 1, 1.2, '#F4EFD8'); } if (front) Rc(-.5, -7.6, 1, 2, '#7C8590'); }
      else if (H === 'tophat') { Rc(-5.6, -9.8, 10.8 + .4, 1.2, '#14161C'); Rc(-3.4, -15.6, 6.8, 6, '#1C1F27'); Rc(-3.4, -15.6, 6.8, .7, '#3A3F4A'); Rc(-2.6, -15, .8, 4, 'rgba(255,255,255,.12)'); Rc(-3.4, -11.4, 6.8, 1.3, '#B5473A'); if (!up) Rc(1.6, -11.4, 1.2, 1.3, '#E8B93A'); }
      else if (H === 'bucket') { Rc(-4.6, -10.6, 9.2, 3.2, '#C9B98A'); Rc(-5.8, -7.8, 11.6, 1.2, '#B5A474'); }
      else if (H === 'flowercrown') { Rc(-4.6, -9.6, 9.2, 1, '#4FA36B'); [-3.6, -1.2, 1.2, 3.6].forEach((k, i) => Rc(k - .7, -10.6, 1.4, 1.4, ['#F28BB0', '#F6E27A', '#F4F4F8', '#F28BB0'][i])); }
      else if (H === 'beret') { Rc(-5, -10.2, 9.8, 2.8, '#B5473A'); Rc(-.6, -11.4, 1.2, 1.4, '#B5473A'); }
      else if (H === 'flatcap') { Rc(-4.8, -10.2, 9.6, 2.8, '#6B6F78'); if (side) Rc(1.6, -7.6, 4.4, 1, '#4A4D55'); else if (front) Rc(-4.2, -7.6, 8.4, 1, '#4A4D55'); }
      else if (H === 'snapback') { Rc(-4.6, -10.4, 9.2, 3.4, '#1E2430'); if (side) Rc(1.6, -7.6, 4.8, 1.2, '#E05555'); else if (front) Rc(-4.6, -7.6, 9.2, 1.2, '#E05555'); else Rc(-1, -8, 2, 1, '#E05555'); }
      else if (H === 'headphones') { if (side) { Rc(-3.8, -10.2, 7.6, .9, '#2A2D38'); Rc(-1.4, -7.8, 2.8, 3.6, '#2A2D38'); Rc(-.6, -7, 1.2, 1.6, '#4DF0C8'); } else { Rc(-4.6, -10.2, 9.2, .9, '#2A2D38'); Rc(-5.6, -7.8, 1.8, 3.6, '#2A2D38'); Rc(3.8, -7.8, 1.8, 3.6, '#2A2D38'); Rc(-5.2, -7, .8, 1.6, '#4DF0C8'); Rc(4.4, -7, .8, 1.6, '#4DF0C8'); } }
      else if (H === 'chef') { Rc(-4.2, -10.2, 8.4, 2, '#F4F4F8'); Rc(-5, -14.4, 10, 4.6, '#F4F4F8'); Rc(-4.6, -11.6, .8, 1.6, '#DDE1EA'); Rc(3.8, -11.6, .8, 1.6, '#DDE1EA'); }
      else if (H === 'pirate') { Rc(-6.4, -10.4, 12.8, 3, '#1A1C24'); Rc(-4, -12.4, 8, 2.2, '#1A1C24'); Rc(-6.4, -8.4, 12.8, .8, '#C9A13A'); if (front) { Rc(-1, -10.2, 2, 1.6, '#F4F4F8'); Rc(-.6, -9.6, .5, .5, '#1A1C24'); Rc(.2, -9.6, .5, .5, '#1A1C24'); } }
      else if (H === 'wizard') { Rc(-6, -9.8, 12, 1.4, '#4B3A8C'); Rc(-4, -12, 8, 2.4, '#4B3A8C'); Rc(-2.4, -14.6, 4.8, 2.8, '#4B3A8C'); Rc(-1, -17.4, 2, 3, '#4B3A8C'); Rc(-4, -10.8, 8, .9, '#F2C14E'); if (front) { Rc(1.4, -12.6, .9, .9, '#F2C14E'); Rc(-2.4, -13.6, .7, .7, '#F2C14E'); } }
      else if (H === 'catears') { Rc(-4.6, -9.4, 9.2, .8, '#2A2D38'); if (side) { Rc(-1.4, -12, 2.6, 2.6, '#2A2D38'); Rc(-.8, -11.4, 1.2, 1.4, '#F28BB0'); } else { Rc(-4.6, -12, 2.6, 2.6, '#2A2D38'); Rc(2, -12, 2.6, 2.6, '#2A2D38'); if (!up) { Rc(-4, -11.4, 1.2, 1.4, '#F28BB0'); Rc(2.8, -11.4, 1.2, 1.4, '#F28BB0'); } } }
      else if (H === 'durag') { Rc(-4.8, -10.8, 9.6, 4, hc); Rc(-4.8, -10.8, 9.6, .9, 'rgba(255,255,255,.28)'); Rc(-4.8, -7.4, 9.6, .7, sh(.6)); const sw = Math.sin(gt * 5) * .5; if (side) Rc(-6.6 + sw, -8.4, 2, 5, hc); else if (up) { Rc(-1.8 + sw, -7, 1.3, 5.4, hc); Rc(.5 + sw, -7, 1.3, 5.4, hc); } }
      else if (H === 'bucketcamo') { Rc(-4.6, -10.6, 9.2, 3.2, '#5E6B3E'); Rc(-5.8, -7.8, 11.6, 1.2, '#4A5530'); Rc(-3.2, -10, 1.8, 1, '#3E4A2A'); Rc(.8, -9.6, 2, 1, '#8A8F5A'); Rc(-1, -8.6, 1.4, .8, '#3E4A2A'); }
      else if (H === 'helmet') { Rc(-5.4, -11.8, 10.8, 7.6, '#1E2430'); Rc(-5.4, -11.8, 10.8, 1.2, 'rgba(255,255,255,.18)'); Rc(-.6, -11.8, 1.2, 3.2, '#E05555'); if (front) { Rc(-4.4, -8.4, 8.8, 3, '#3E8FCC'); Rc(-3.8, -8, 2.8, .7, 'rgba(255,255,255,.55)'); } else if (side) { Rc(.8, -8.4, 4.6, 3, '#3E8FCC'); Rc(1.4, -8, 1.8, .7, 'rgba(255,255,255,.55)'); } }
      else if (H === 'halo') { const hl = .75 + .25 * Math.sin(gt * 4); ctx.globalAlpha = hl; Rc(-3.4, -15, 6.8, 1, '#FFE27A'); Rc(-4.6, -14, 1.2, 1.4, '#FFE27A'); Rc(3.4, -14, 1.2, 1.4, '#FFE27A'); Rc(-3.4, -12.8, 6.8, 1, '#FFE27A'); ctx.globalAlpha = 1; }
      else if (H === 'crownp') { Rc(-4.4, -10.8, 8.8, 2.6, '#B9C2D6'); Rc(-4.4, -10.8, 8.8, .7, '#EEF2FA'); Rc(-4.4, -13, 1.8, 2.2, '#D4DAE8'); Rc(-.9, -14.6, 1.8, 3.8, '#D4DAE8'); Rc(2.6, -13, 1.8, 2.2, '#D4DAE8'); Rc(-3.9, -13.6, .9, .9, '#B58CFF'); Rc(-.45, -15.2, .9, .9, '#D9B8FF'); Rc(3.05, -13.6, .9, .9, '#B58CFF'); if (!up) { Rc(-.8, -10.4, 1.6, 1.6, '#8A4DFF'); Rc(-3.4, -10, 1, 1, '#B58CFF'); Rc(2.4, -10, 1, 1, '#B58CFF'); } if (Math.sin(gt * 3) > .8) Rc(1.6, -12.6, .7, .7, '#FFFFFF'); }
      else if (H === 'crownstar') { const gl = .5 + .5 * Math.sin(gt * 4); Rc(-4.4, -10.6, 8.8, 1.8, '#C9D6FF'); Rc(-4.4, -10.6, 8.8, .6, '#FFFFFF'); for (const [sx2, sy2, r] of [[-3.4, -12.6, 2], [0, -14.2, 2.6], [3.4, -12.6, 2]]) { ctx.fillStyle = tint || '#FFD84A'; starPath(sx2, sy2, r, r * .45); ctx.fill(); ctx.fillStyle = tint || '#FFF6C8'; starPath(sx2, sy2, r * .5, r * .22); ctx.fill(); } if (!up) Rc(-.7, -10.3, 1.4, 1.2, '#7FB8FF'); if (gl > .9) Rc(1.4, -15.4, .7, .7, '#FFFFFF'); }
      else if (H === 'crown') { Rc(-4.4, -10.8, 8.8, 2.6, '#E8B93A'); Rc(-4.4, -10.8, 8.8, .7, '#FFE89A'); Rc(-4.4, -13, 1.8, 2.2, '#F2C14E'); Rc(-.9, -14.2, 1.8, 3.4, '#F2C14E'); Rc(2.6, -13, 1.8, 2.2, '#F2C14E'); Rc(-3.9, -13.6, .9, .9, '#F4F4F8'); Rc(-.45, -14.8, .9, .9, '#F4F4F8'); Rc(3.05, -13.6, .9, .9, '#F4F4F8'); if (!up) { Rc(-.7, -10.3, 1.4, 1.4, '#E05555'); Rc(-3.4, -10, 1, 1, '#4B8DFF'); Rc(2.4, -10, 1, 1, '#5FE584'); } if (Math.sin(gt * 3) > .85) Rc(1.6, -12.6, .7, .7, '#FFFFFF'); }
    }
    ctx.restore();
  }
  // Aura: leuchtet um die Figur (nur Optik)
  function drawAura(px, py, id, t) {
    const cy = py + 2, R = 25 + Math.sin(t * 3) * 1.5;
    const glow = (r, col, a) => { const g = ctx.createRadialGradient(px, cy, 2, px, cy, r); g.addColorStop(0, col(a)); g.addColorStop(.55, col(a * .4)); g.addColorStop(1, col(0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, cy, r, 0, TAU); ctx.fill(); };
    const rgba = rgb => a => 'rgba(' + rgb + ',' + a.toFixed(3) + ')';
    const dots = (n, rad, sp, sz, col, tw) => { for (let i = 0; i < n; i++) { const a = t * sp + i * TAU / n, rr2 = rad * (1 + .12 * Math.sin(t * 2 + i)); ctx.globalAlpha = tw ? .5 + .5 * Math.sin(t * 5 + i * 2) : .9; ctx.fillStyle = typeof col === 'function' ? col(i) : col; ctx.fillRect(px + Math.cos(a) * rr2 - sz / 2, cy + Math.sin(a) * rr2 * .8 - sz / 2, sz, sz); } ctx.globalAlpha = 1; };
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    switch (id) {
      case 'mkaurora': { glow(R, rgba('80,255,180'), .32); ctx.lineWidth = 3; for (let k = 0; k < 3; k++) { ctx.strokeStyle = k === 1 ? 'rgba(190,120,255,.55)' : 'rgba(90,255,190,.5)'; ctx.beginPath(); for (let i = 0; i <= 16; i++) { const u = i / 16, x = px - R + u * 2 * R, y = cy - 16 - k * 5 + Math.sin(u * 6 + t * 2 + k * 1.7) * 4; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); } break; }
      case 'mkdiamond': { glow(R, rgba('200,235,255'), .35); for (let i = 0; i < 7; i++) { const a = t * 1.1 + i * TAU / 7, x = px + Math.cos(a) * R * .8, y = cy + Math.sin(a) * R * .42, s = 2.6 + Math.sin(t * 4 + i) * .6; ctx.globalAlpha = .75 + .25 * Math.sin(t * 6 + i * 2); ctx.fillStyle = i % 2 ? '#E8F6FF' : '#9FE0FF'; ctx.beginPath(); ctx.moveTo(x, y - s * 1.3); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s * 1.3); ctx.lineTo(x - s, y); ctx.closePath(); ctx.fill(); if (Math.sin(t * 3 + i * 1.3) > 0.93) { ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.moveTo(x, y - 5); ctx.lineTo(x, y + 5); ctx.stroke(); } } ctx.globalAlpha = 1; break; }
      case 'mkphoenix': { glow(R, rgba('255,120,40'), .45); const fl = Math.sin(t * 5) * .35; for (const sd of [-1, 1]) { ctx.save(); ctx.translate(px + sd * 4, cy - 6); ctx.rotate(sd * (0.5 + fl)); for (let k = 0; k < 4; k++) { ctx.fillStyle = ['rgba(255,220,90,.75)', 'rgba(255,150,40,.7)', 'rgba(255,90,30,.6)', 'rgba(200,40,30,.45)'][k]; ctx.beginPath(); ctx.ellipse(sd * (8 + k * 4), -k * 1.5, 7 - k, 2.4, sd * 0.25 * k, 0, TAU); ctx.fill(); } ctx.restore(); } for (let i = 0; i < 5; i++) { const ph = (t * .7 + i / 5) % 1; ctx.globalAlpha = 1 - ph; ctx.fillStyle = '#FFB547'; ctx.fillRect(px + Math.sin(i * 2.1 + t) * 10 - .8, cy + 6 - ph * 26, 1.6, 1.6); } ctx.globalAlpha = 1; break; }
      case 'mkcrown': { glow(R, rgba('255,215,90'), .38); const yy = cy - 31 + Math.sin(t * 2) * 1.5; ctx.strokeStyle = 'rgba(255,215,90,.95)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(px, yy, 8, 2.6, 0, 0, TAU); ctx.stroke(); ctx.fillStyle = '#FFE58A'; for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + t * .6, x = px + Math.cos(a) * 8, y = yy + Math.sin(a) * 2.6; ctx.beginPath(); ctx.ellipse(x, y - 1.2, 1.1, 2.2, a, 0, TAU); ctx.fill(); } dots(5, R * .78, .7, 1.8, '#FFF2B8', true); break; }
      case 'warm': { glow(R, rgba('255,200,80'), .5); for (let i = 0; i < 6; i++) { const a = t * .35 + i * TAU / 6; ctx.fillStyle = 'rgba(255,220,120,' + (.07 + .05 * Math.sin(t * 2 + i)).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(px, cy); ctx.arc(px, cy, R * 1.05, a - .12, a + .12); ctx.closePath(); ctx.fill(); } for (let i = 0; i < 7; i++) { const ph = (t * .5 + i / 7) % 1, x = px + Math.sin(i * 2.3 + t * .8) * R * .62, y = cy + 8 - ph * 30, s = 1 + Math.sin(ph * Math.PI) * 1.8; ctx.globalAlpha = Math.sin(ph * Math.PI); ctx.fillStyle = i % 2 ? '#FFE9A0' : '#FFD24A'; starPath(x, y, s * 1.4, s * .4, 4, 0); ctx.fill(); } ctx.globalAlpha = 1; dots(5, R * .78, .9, 1.6, '#FFF4C2', true); break; } // v142: Lichtstrahlen und funkelnde Sterne
      case 'cool': { glow(R, rgba('90,160,255'), .5); const pr = (t * .8) % 1; ctx.strokeStyle = 'rgba(150,200,255,' + (.5 * (1 - pr)).toFixed(3) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(px, cy + 8, 6 + pr * R * .8, (6 + pr * R * .8) * .32, 0, 0, TAU); ctx.stroke(); for (let k = 0; k < 2; k++) { const rot = t * (k ? -1.1 : 1.1) * .4 + (k ? 1.1 : -.3); ctx.strokeStyle = 'rgba(170,215,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(px, cy, R * .82, R * .3, rot, 0, TAU); ctx.stroke(); const a0 = t * 2.4 * (k ? -1 : 1); for (let j = 0; j < 10; j++) { const a = a0 - (k ? -1 : 1) * j * .09, ex = Math.cos(a) * R * .82, ey = Math.sin(a) * R * .3, x = px + ex * Math.cos(rot) - ey * Math.sin(rot), y = cy + ex * Math.sin(rot) + ey * Math.cos(rot); ctx.globalAlpha = 1 - j / 10; ctx.fillStyle = j ? '#9FD0FF' : '#FFFFFF'; ctx.beginPath(); ctx.arc(x, y, 1.8 - j * .14, 0, TAU); ctx.fill(); } } ctx.globalAlpha = 1; dots(6, R * .7, -.6, 1.4, '#DDEEFF', true); break; } // v142: Kometen auf den Ringen, Bodenwelle
      case 'rose': { glow(R, rgba('255,130,190'), .42); for (let i = 0; i < 6; i++) { const a = t * .3 + i * TAU / 6, r = R * (.55 + .2 * Math.sin(t * .8 + i)), x = px + Math.cos(a) * r, y = cy + Math.sin(a) * r * .55 - 2, s = 7 + 2 * Math.sin(t + i * 2); const g = ctx.createRadialGradient(x, y, 0, x, y, s); g.addColorStop(0, 'rgba(255,150,205,.22)'); g.addColorStop(1, 'rgba(255,150,205,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill(); } ctx.globalCompositeOperation = 'source-over'; for (let i = 0; i < 8; i++) { const ph = (t * .3 + i / 8) % 1, a = i * 2.1 + t * .5, x = px + Math.cos(a) * R * .7 + Math.sin(t * 2 + i) * 2, y = cy - 14 + ph * 28; ctx.globalAlpha = Math.sin(ph * Math.PI) * .95; ctx.save(); ctx.translate(x, y); ctx.rotate(a + ph * 5); ctx.fillStyle = i % 2 ? '#FF8CC0' : '#FFC6E0'; ctx.beginPath(); ctx.moveTo(0, -2.4); ctx.quadraticCurveTo(2, -1, 0, 2.4); ctx.quadraticCurveTo(-2, -1, 0, -2.4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-.3, -1.4, .6, 1.6); ctx.restore(); } ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter'; break; } // v142: weicher Nebel und Blütenblätter
      case 'ice': { glow(R, rgba('140,230,255'), .5); dots(8, R * .8, .8, 2.2, '#E6FAFF', true); ctx.strokeStyle = 'rgba(230,250,255,.85)'; ctx.lineWidth = 1; for (let i = 0; i < 5; i++) { const ph = (t * .3 + i / 5) % 1, x = px - R * .6 + ((i * 37) % 30) * R * .04, y = cy - R + ph * R * 1.8; ctx.globalAlpha = Math.sin(ph * Math.PI); for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3 + t; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * 2.4, y - Math.sin(a) * 2.4); ctx.lineTo(x + Math.cos(a) * 2.4, y + Math.sin(a) * 2.4); ctx.stroke(); } } ctx.globalAlpha = 1; break; } // Schneeflocken
      case 'leafs': { glow(R + 2, rgba('80,220,110'), .5); ctx.globalCompositeOperation = 'source-over'; for (let i = 0; i < 5; i++) { const a = t * .9 + i * TAU / 5; cannaLeaf(px + Math.cos(a) * R * .8, cy + Math.sin(a) * R * .5, 6, i % 2 ? '#63FF9A' : '#3FAE6A', a + Math.PI / 2); } ctx.globalCompositeOperation = 'lighter'; break; }
      case 'hearts': { glow(R, rgba('255,90,140'), .45); ctx.globalCompositeOperation = 'source-over'; for (let i = 0; i < 6; i++) { const ph = (t * .45 + i / 6) % 1, x = px + Math.sin(i * 1.9 + t * 1.3) * R * .7, y = cy + 6 - ph * 32, s = 1.6 + Math.sin(ph * Math.PI) * 1.2; ctx.globalAlpha = Math.sin(ph * Math.PI); ctx.fillStyle = i % 2 ? '#FF4F7A' : '#FF8FB0'; ctx.beginPath(); ctx.arc(x - s * .55, y, s * .6, 0, TAU); ctx.arc(x + s * .55, y, s * .6, 0, TAU); ctx.moveTo(x - s * 1.1, y + s * .2); ctx.lineTo(x, y + s * 1.4); ctx.lineTo(x + s * 1.1, y + s * .2); ctx.fill(); } ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter'; break; }
      case 'money': { glow(R, rgba('120,220,120'), .4); ctx.globalCompositeOperation = 'source-over'; for (let i = 0; i < 6; i++) { const ph = (t * .4 + i / 6) % 1, a = i * 1.7 + t, x = px + Math.cos(a) * R * .75, y = cy - 14 + ph * 30; ctx.globalAlpha = Math.sin(ph * Math.PI); ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 3 + i) * .6); ctx.fillStyle = '#7FD08A'; ctx.fillRect(-3.4, -1.8, 6.8, 3.6); ctx.fillStyle = '#2E7D3E'; ctx.font = '800 3px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('€', 0, .2); ctx.restore(); } ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter'; break; }
      case 'storm': { const cyc = t * .62, n = Math.floor(cyc), f = cyc - n, hit = f < .14, rnd = q => { const v = Math.sin(n * 91.7 + q * 37.3) * 43758.5453; return v - Math.floor(v); }; glow(R + 2, rgba('110,130,255'), .32 + (hit ? .4 * (1 - f / .14) : 0)); ctx.globalCompositeOperation = 'source-over'; for (let i = 0; i < 9; i++) { const ph = (t * 1.6 + i / 9) % 1, x = px - 13 + ((i * 7.3) % 26) + Math.sin(t + i) * 1.4, y = cy - 22 + ph * 30; ctx.strokeStyle = 'rgba(170,200,255,' + (.55 * (1 - ph)).toFixed(2) + ')'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 1, y + 3.4); ctx.stroke(); } const cl = (x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }; const cY = cy - 28 + Math.sin(t * 1.3) * .8, ck = hit ? '#9AA4C8' : '#5A6278', cl2 = hit ? '#C9D0EE' : '#7A8298'; cl(px - 8, cY + 2, 5, ck); cl(px + 8, cY + 2, 5.4, ck); cl(px - 3, cY - 1, 6.4, ck); cl(px + 4, cY - 2, 6, ck); cl(px, cY + 3, 6, ck); cl(px - 4, cY - 2.4, 3.4, cl2); cl(px + 3, cY - 3.6, 3.2, cl2); ctx.globalCompositeOperation = 'lighter'; if (hit) { const a = 1 - f / .14, sx = px + (rnd(1) - .5) * 14, ex = px + (rnd(2) - .5) * 22; ctx.strokeStyle = 'rgba(200,220,255,' + (.5 * a).toFixed(2) + ')'; ctx.lineWidth = 3; const pts = [[sx, cY + 4]]; for (let s = 1; s <= 5; s++) pts.push([sx + (ex - sx) * s / 5 + (rnd(s + 3) - .5) * 7, cY + 4 + (cy + 10 - cY - 4) * s / 5]); ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')'; ctx.lineWidth = 1; ctx.stroke(); const e = pts[pts.length - 1], g = ctx.createRadialGradient(e[0], e[1], 0, e[0], e[1], 8); g.addColorStop(0, 'rgba(200,220,255,' + (.6 * a).toFixed(2) + ')'); g.addColorStop(1, 'rgba(200,220,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(e[0], e[1], 8, 0, TAU); ctx.fill(); } break; } // v142: Gewitterwolke, Regen, Blitze
      case 'bubbles': { glow(R, rgba('120,220,255'), .35); ctx.lineWidth = 1; for (let i = 0; i < 7; i++) { const ph = (t * .3 + i / 7) % 1, x = px + Math.sin(i * 2.7) * R * .7 + Math.sin(t * 2 + i) * 2, y = cy + 8 - ph * 34, r = 1.6 + (i % 3); ctx.globalAlpha = Math.sin(ph * Math.PI) * .9; ctx.strokeStyle = 'hsla(' + ((i * 50 + t * 60) % 360) + ',90%,80%,.9)'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x - r * .5, y - r * .5, 1, 1); } ctx.globalAlpha = 1; break; }
      case 'smoke': { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(60,66,76,.18)'; ctx.beginPath(); ctx.ellipse(px, cy + 9, R * .7, R * .2, 0, 0, TAU); ctx.fill(); for (let i = 0; i < 9; i++) { const ph = (t * .22 + i / 9) % 1, sd = i % 2 ? 1 : -1, x = px + sd * (5 + ph * 12) + Math.sin(t * .9 + i * 1.7) * 3, y = cy + 8 - ph * 32, r = 2.6 + ph * 8; const g = ctx.createRadialGradient(x, y, 0, x, y, r); const a = .46 * Math.sin(ph * Math.PI); g.addColorStop(0, 'rgba(200,206,216,' + a.toFixed(3) + ')'); g.addColorStop(.6, 'rgba(170,178,190,' + (a * .6).toFixed(3) + ')'); g.addColorStop(1, 'rgba(150,158,170,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); } ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const ph = (t * .5 + i / 4) % 1; ctx.globalAlpha = Math.sin(ph * Math.PI) * .7; ctx.fillStyle = '#FFB070'; ctx.fillRect(px + Math.sin(i * 2.4 + t) * 9, cy + 7 - ph * 18, 1, 1); } ctx.globalAlpha = 1; break; } // v142: weicher Rauch seitlich, Glut
      case 'comet': { glow(R, rgba('255,240,200'), .3); for (let i = 0; i < 3; i++) { const a = t * 2.2 + i * TAU / 3, x = px + Math.cos(a) * R * .85, y = cy + Math.sin(a) * R * .45; for (let k = 0; k < 6; k++) { const b = a - k * .12; ctx.globalAlpha = (1 - k / 6) * .9; ctx.fillStyle = k ? '#FFD86A' : '#FFFFFF'; ctx.beginPath(); ctx.arc(px + Math.cos(b) * R * .85, cy + Math.sin(b) * R * .45, 2.2 - k * .3, 0, TAU); ctx.fill(); } } ctx.globalAlpha = 1; break; }
      case 'shadowfire': { ctx.globalCompositeOperation = 'source-over'; glow(R + 2, rgba('40,0,60'), .5); for (let i = 0; i < 7; i++) { const x = px + (i - 3) * 4.4, h = 10 + 7 * Math.sin(t * 8 + i * 1.9); ctx.fillStyle = i % 2 ? 'rgba(120,40,200,.55)' : 'rgba(20,10,30,.7)'; ctx.beginPath(); ctx.ellipse(x, cy + 9 - h * .3, 2.6, h * .42, 0, 0, TAU); ctx.fill(); } ctx.globalCompositeOperation = 'lighter'; break; }
      case 'fire': {
        glow(R, rgba('255,110,30'), .6);
        for (let i = 0; i < 7; i++) { const x = px + (i - 3) * 4.6, h = 10 + 7 * Math.sin(t * 9 + i * 1.7) + (i === 3 ? 5 : 0); ctx.fillStyle = i % 2 ? 'rgba(255,170,40,.5)' : 'rgba(255,80,30,.5)'; ctx.beginPath(); ctx.ellipse(x, cy + 9 - h * .3, 2.6, h * .42, 0, 0, TAU); ctx.fill(); }
        break;
      }
      case 'violet': {
        glow(R + 2, rgba('170,90,255'), .55 + .15 * Math.sin(t * 4)); ctx.strokeStyle = 'rgba(200,140,255,.7)'; ctx.lineWidth = 2;
        for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(px, cy, R * .78, t * 2 + k * 2.1, t * 2 + k * 2.1 + .9); ctx.stroke(); }
        break;
      }
      case 'rainbow': {
        const h = (t * 70) % 360; glow(R, a => 'hsla(' + h.toFixed(0) + ',100%,60%,' + a.toFixed(3) + ')', .5); ctx.lineWidth = 2.2;
        for (let k = 0; k < 6; k++) { ctx.strokeStyle = 'hsla(' + ((h + k * 60) % 360).toFixed(0) + ',100%,65%,.75)'; ctx.beginPath(); ctx.arc(px, cy, R * .8, t * 1.5 + k * TAU / 6, t * 1.5 + k * TAU / 6 + .85); ctx.stroke(); }
        break;
      }
      case 'sun': { glow(R + 2, rgba('255,215,80'), .6); ctx.strokeStyle = 'rgba(255,236,150,.7)'; ctx.lineWidth = 2; for (let i = 0; i < 10; i++) { const a = t * 0.8 + i * TAU / 10, r1 = R * .55, r2 = R * (.85 + .1 * Math.sin(t * 4 + i)); ctx.beginPath(); ctx.moveTo(px + Math.cos(a) * r1, cy + Math.sin(a) * r1); ctx.lineTo(px + Math.cos(a) * r2, cy + Math.sin(a) * r2); ctx.stroke(); } break; }
      case 'aqua': { glow(R, rgba('40,200,220'), .42); const band = (k, back) => { for (let s = 0; s < 22; s++) { const u = s / 22, u2 = (s + 1) / 22, A = u * TAU * 1.2 + t * 1.8 + k * 2.1, A2 = u2 * TAU * 1.2 + t * 1.8 + k * 2.1; if ((Math.sin(A) < 0) !== back) continue; const x1 = px + Math.cos(A) * R * .74, y1 = cy + 9 - u * 26 + Math.sin(A) * R * .24, x2 = px + Math.cos(A2) * R * .74, y2 = cy + 9 - u2 * 26 + Math.sin(A2) * R * .24, w = .6 + 2.2 * Math.sin(u * Math.PI); ctx.strokeStyle = 'rgba(110,225,255,' + (back ? .3 : .7).toFixed(2) + ')'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); if (!back) { ctx.strokeStyle = 'rgba(235,252,255,.75)'; ctx.lineWidth = w * .3; ctx.beginPath(); ctx.moveTo(x1, y1 - w * .3); ctx.lineTo(x2, y2 - w * .3); ctx.stroke(); } } }; ctx.lineCap = 'round'; for (let k = 0; k < 2; k++) band(k, true); for (let k = 0; k < 2; k++) band(k, false); ctx.lineCap = 'butt'; for (let i = 0; i < 6; i++) { const ph = (t * .7 + i / 6) % 1, a = i * 1.05 + t, x = px + Math.cos(a) * R * (.6 + ph * .3), y = cy - 16 + ph * ph * 26; ctx.globalAlpha = Math.sin(ph * Math.PI); ctx.fillStyle = '#BFF4FF'; ctx.beginPath(); ctx.moveTo(x, y - 1.8); ctx.quadraticCurveTo(x + 1.2, y, x, y + 1); ctx.quadraticCurveTo(x - 1.2, y, x, y - 1.8); ctx.fill(); } ctx.globalAlpha = 1; const pr = (t * .9) % 1; ctx.strokeStyle = 'rgba(160,240,255,' + (.6 * (1 - pr)).toFixed(2) + ')'; ctx.lineWidth = .8; ctx.beginPath(); ctx.ellipse(px, cy + 9, 4 + pr * 16, (4 + pr * 16) * .3, 0, 0, TAU); ctx.stroke(); break; } // v142: Wasserbaender als Spirale, Tropfen, Wellenring
      case 'plasma': { const h = 180 + 140 * (0.5 + 0.5 * Math.sin(t * 2.2)); glow(R, a => 'hsla(' + h.toFixed(0) + ',100%,60%,' + a.toFixed(3) + ')', .55); ctx.strokeStyle = 'hsla(' + ((h + 60) % 360).toFixed(0) + ',100%,75%,.8)'; ctx.lineWidth = 1.6; for (let k = 0; k < 5; k++) { const a0 = t * 3 + k * 1.26; ctx.beginPath(); ctx.moveTo(px + Math.cos(a0) * R * .35, cy + Math.sin(a0) * R * .35); ctx.lineTo(px + Math.cos(a0 + .4) * R * .6, cy + Math.sin(a0 + .4) * R * .6); ctx.lineTo(px + Math.cos(a0 - .2) * R * .85, cy + Math.sin(a0 - .2) * R * .85); ctx.stroke(); } break; }
      case 'void': { ctx.globalCompositeOperation = 'source-over'; const g0 = ctx.createRadialGradient(px, cy + 8, 0, px, cy + 8, R * .8); g0.addColorStop(0, 'rgba(8,0,18,.75)'); g0.addColorStop(.55, 'rgba(40,10,70,.45)'); g0.addColorStop(1, 'rgba(40,10,70,0)'); ctx.fillStyle = g0; ctx.beginPath(); ctx.ellipse(px, cy + 8, R * .8, R * .3, 0, 0, TAU); ctx.fill(); ctx.globalCompositeOperation = 'lighter'; glow(R + 3, rgba('120,40,200'), .38); for (let k = 0; k < 3; k++) { ctx.strokeStyle = 'rgba(190,130,255,' + (.35 + .2 * Math.sin(t * 3 + k)).toFixed(2) + ')'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(px, cy + 8, R * (.36 + k * .17), R * (.36 + k * .17) * .3, 0, -t * (1.4 + k * .4) + k, -t * (1.4 + k * .4) + k + 2.2); ctx.stroke(); } for (let i = 0; i < 14; i++) { const ph = (t * .45 + i / 14) % 1, a = i * 2.4 - ph * 5, r = R * (1 - ph) * .95, x = px + Math.cos(a) * r, y = cy + 8 + Math.sin(a) * r * .32 - (1 - ph) * 14 * (i % 3) / 2; ctx.globalAlpha = Math.min(1, ph * 3) * (1 - ph * .5); ctx.fillStyle = i % 3 ? '#C9A2FF' : '#FFFFFF'; ctx.fillRect(x - .7, y - .7, 1.4, 1.4); } ctx.globalAlpha = 1; if (Math.sin(t * 2.3) > .97) { ctx.strokeStyle = 'rgba(230,200,255,.8)'; ctx.lineWidth = .7; ctx.beginPath(); ctx.moveTo(px - 6, cy - 6); ctx.lineTo(px - 2, cy - 1); ctx.lineTo(px - 5, cy + 3); ctx.stroke(); } break; } // v142: Sog am Boden, Teilchen werden hineingezogen
      case 'sakura': { glow(R, rgba('255,150,200'), .38); ctx.globalCompositeOperation = 'source-over'; for (let i = 0; i < 9; i++) { const ph = (t * .32 + i / 9) % 1, x = px + Math.sin(i * 2.7 + t * .8) * R * .8 + ph * 6, y = cy - 18 + ph * 34; ctx.globalAlpha = Math.sin(ph * Math.PI) * .95; ctx.fillStyle = i % 3 ? '#FFC0D8' : '#FFE4EE'; ctx.beginPath(); ctx.ellipse(x, y, 2, 1.2, t * 2 + i, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter'; break; }
      case 'confetti': { ctx.globalCompositeOperation = 'source-over'; const C = ['#FF5CA8', '#FFD24A', '#4BC8FF', '#5FE584', '#B58CFF', '#FF8A3A']; for (let i = 0; i < 14; i++) { const ph = (t * .5 + i / 14) % 1, x = px + Math.cos(i * 1.9) * R * (.3 + ph * .7), y = cy - 20 + ph * ph * 40 - Math.sin(ph * Math.PI) * 10; ctx.globalAlpha = 1 - ph * .6; ctx.save(); ctx.translate(x, y); ctx.rotate(t * 4 + i); ctx.fillStyle = C[i % C.length]; ctx.fillRect(-1.4, -.7, 2.8, 1.4); ctx.restore(); } ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter'; break; }
      case 'disco': { const C = ['255,80,160', '80,200,255', '255,220,80', '120,255,140']; for (let i = 0; i < 4; i++) { const a = t * 1.6 + i * TAU / 4; ctx.fillStyle = 'rgba(' + C[i] + ',.17)'; ctx.beginPath(); ctx.moveTo(px, cy - 4); ctx.arc(px, cy - 4, R * 0.95, a - .2, a + .2); ctx.closePath(); ctx.fill(); } glow(R * .6, rgba('255,255,255'), .2 + .15 * Math.sin(t * 8)); dots(8, R * .9, 1.4, 1.8, i => 'rgb(' + C[i % 4] + ')', true); break; }
      case 'legend': { glow(R + 3, rgba('255,200,70'), .55); ctx.strokeStyle = 'rgba(255,226,122,.85)'; ctx.lineWidth = 1.4; for (let k = 0; k < 2; k++) { const f = (t * .5 + k / 2) % 1; ctx.globalAlpha = 1 - f; ctx.beginPath(); ctx.ellipse(px, cy + 8 - f * 22, R * (.5 + f * .4), R * (.16 + f * .12), 0, 0, TAU); ctx.stroke(); } ctx.globalAlpha = 1; ctx.fillStyle = '#FFF4C2'; for (let i = 0; i < 5; i++) { const a = t * 1.1 + i * TAU / 5; ctx.globalAlpha = .6 + .4 * Math.sin(t * 5 + i); starPath(px + Math.cos(a) * R * .85, cy + Math.sin(a) * R * .5, 2.6, 1.1); ctx.fill(); } ctx.globalAlpha = 1; break; }
      case 'spotlight': { ctx.fillStyle = 'rgba(255,250,220,.13)'; ctx.beginPath(); ctx.moveTo(px - 3, cy - 40); ctx.lineTo(px + 3, cy - 40); ctx.lineTo(px + R * .8, cy + 10); ctx.lineTo(px - R * .8, cy + 10); ctx.closePath(); ctx.fill(); glow(R * .8, rgba('255,245,210'), .3); for (let i = 0; i < 3; i++) { const ph = (t * .9 + i * .37) % 1; if (ph < .12) { const a = i * 2.2 + Math.floor(t * .9 + i * .37) * 1.3, x = px + Math.cos(a) * R * .9, y = cy + Math.sin(a) * R * .6; ctx.globalAlpha = 1 - ph / .12; ctx.fillStyle = '#FFFFFF'; starPath(x, y, 4, 1, 4, 0); ctx.fill(); } } ctx.globalAlpha = 1; break; }
      case 'pr1': { glow(R, rgba('200,210,235'), .4); ctx.fillStyle = '#F4F7FF'; for (let i = 0; i < 6; i++) { const a = t * .8 + i * TAU / 6; ctx.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * 3 + i)); starPath(px + Math.cos(a) * R * .8, cy + Math.sin(a) * R * .55, 2.2, .8, 4, 0); ctx.fill(); } ctx.globalAlpha = 1; break; }
      case 'pr4': { glow(R, rgba('150,120,255'), .45); ctx.fillStyle = '#FFE27A'; for (let i = 0; i < 10; i++) { const a = t * 1.4 + i * TAU / 10; ctx.globalAlpha = .7 + .3 * Math.sin(t * 4 + i); starPath(px + Math.cos(a) * R * .9, cy + Math.sin(a) * R * .38, 1.8, .7); ctx.fill(); } ctx.globalAlpha = 1; break; }
      case 'pr6': { glow(R, a => 'hsla(' + ((t * 50) % 360).toFixed(0) + ',90%,65%,' + a.toFixed(3) + ')', .4); for (let i = 0; i < 9; i++) { const a = t * .7 + i * TAU / 9, r2 = R * (.55 + .3 * ((i * 7) % 3) / 2); ctx.save(); ctx.translate(px + Math.cos(a) * r2, cy + Math.sin(a) * r2 * .7); ctx.rotate(a + t * 2); ctx.fillStyle = 'hsla(' + ((i * 40 + t * 80) % 360).toFixed(0) + ',95%,70%,.85)'; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(1.6, 0); ctx.lineTo(0, 3); ctx.lineTo(-1.6, 0); ctx.closePath(); ctx.fill(); ctx.restore(); } break; }
      case 'pr10': { glow(R + 4, rgba('90,60,200'), .55); glow(R * .7, rgba('255,200,80'), .35); ctx.strokeStyle = 'rgba(255,226,122,.8)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.ellipse(px, cy, R * .82, R * .3, Math.sin(t * .6) * .5, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(200,170,255,.7)'; ctx.beginPath(); ctx.ellipse(px, cy, R * .82, R * .3, -Math.sin(t * .6) * .5 + 1.2, 0, TAU); ctx.stroke(); for (let i = 0; i < 12; i++) { const a = t * (.5 + (i % 3) * .3) + i * 2.4, r2 = R * (.4 + (i % 4) * .17); ctx.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * 3 + i)); ctx.fillStyle = i % 3 ? '#FFFFFF' : '#FFE27A'; ctx.fillRect(px + Math.cos(a) * r2 - 1, cy + Math.sin(a) * r2 * .8 - 1, 2, 2); } ctx.globalAlpha = 1; ctx.fillStyle = '#FFF4C2'; starPath(px + Math.cos(t * 1.7) * R * .82, cy + Math.sin(t * 1.7) * R * .3, 2.6, 1.1); ctx.fill(); break; }
      case 'galaxy': {
        glow(R + 3, rgba('90,60,200'), .6); glow(R * .5, rgba('255,100,200'), .35);
        for (let i = 0; i < 12; i++) { const a = t * (.5 + (i % 3) * .3) + i * 2.4, r2 = R * (.45 + (i % 4) * .17); ctx.globalAlpha = .4 + .6 * Math.abs(Math.sin(t * 3 + i)); ctx.fillStyle = i % 2 ? '#FFFFFF' : '#FFD6F5'; ctx.fillRect(px + Math.cos(a) * r2 - 1, cy + Math.sin(a) * r2 * .8 - 1, 2, 2); }
        ctx.globalAlpha = 1; break;
      }
    }
    ctx.restore();
  }
  // v76: Ruecken-Kosmetik (Fluegel, Umhaenge, Rucksaecke, Bauchtasche). Gezeichnet im Figur-Raster: Schultern bei y -2, Ruecken-Mitte bei (0, 1).
  function cannaLeaf(x, y, s, col, rot) { // siebenfingriges Blatt
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.fillStyle = col;
    const f = [[0, 1], [-0.45, 0.82], [0.45, 0.82], [-0.95, 0.55], [0.95, 0.55], [-1.3, 0.3], [1.3, 0.3]];
    for (const [a, l] of f) { ctx.save(); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(0, -s * l * 0.55, s * 0.13, s * l * 0.55, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    ctx.fillRect(-s * 0.04, 0, s * 0.08, s * 0.35); ctx.restore();
  }
  function starPath(x, y, r1, r2, n = 5, rot = -Math.PI / 2) { if (r2 === undefined) { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4, rr = i % 2 ? r1 * 0.38 : r1; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); return; } /* v143: alte Kurzform mit 3 Werten zeichnet wieder (Sternenschwarm, Sternenstaub waren unsichtbar) */ ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1, a = rot + i * Math.PI / n; i ? ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } ctx.closePath(); }
  const BACK_FRONT = { fanny: 1 }; // wird vorne getragen
  const COS_SHIM = { gold: ['255,210,90', '#FFF2B0'], neon: ['255,80,190', '#9FFFF0'], royal: ['180,120,255', '#F2D36B'] }; // v144: Schimmer und Funkeln
  // v142: Umhang-Farben und Fuellung mit Falten und Muster
  function capeCols(id, t) { return ({ capeleaf: ['#2E7D3E', '#1E5A2A'], capered: ['#C23B3B', '#8E2424'], capegold: ['#E0A92E', '#9A6C14'], capecheck: ['#F2F2F2', '#20232C'], capestar: ['#1E2A5A', '#10183A'], capeprism: ['hsl(' + ((t * 60) % 360).toFixed(0) + ',80%,55%)', 'hsl(' + ((t * 60 + 40) % 360).toFixed(0) + ',70%,35%)'] })[id]; }
  function capeFill(id, shape, c, cd, t, sw, x0, y0, w, h) {
    ctx.fillStyle = c; shape(); ctx.fill(); ctx.save(); shape(); ctx.clip();
    if (id === 'capecheck') { ctx.fillStyle = '#20232C'; for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 8; xx++) if ((xx + yy) % 2) ctx.fillRect(x0 + xx * 1.9 + sw * yy / 8, y0 + yy * 1.9, 1.9, 1.9); }
    else if (id === 'capestar') { for (let i = 0; i < 12; i++) { const a = .4 + .6 * Math.sin(t * 3 + i * 1.7); ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')'; ctx.fillRect(x0 + ((i * 3.7) % w) + sw * .4, y0 + 1 + ((i * 2.3) % (h - 2)), .9, .9); } }
    else if (id === 'capeprism') { for (let k = 0; k < 7; k++) { ctx.fillStyle = 'hsla(' + ((t * 60 + k * 52) % 360).toFixed(0) + ',85%,60%,.75)'; ctx.fillRect(x0 + k * 2.2 + sw * .3, y0, 2.2, h); } }
    else if (id === 'capegold') { ctx.fillStyle = 'rgba(255,240,170,.55)'; ctx.fillRect(x0 + ((t * 6) % (w + 4)) - 2, y0, 1.4, h); }
    ctx.fillStyle = 'rgba(0,0,0,.16)'; for (let k = 0; k < 3; k++) { const x = x0 + w * (0.28 + k * 0.22) + sw * 0.5; ctx.beginPath(); ctx.moveTo(x - 0.3, y0 + 3); ctx.quadraticCurveTo(x + sw * 0.3, y0 + h * 0.6, x + sw * 0.6, y0 + h); ctx.lineTo(x + sw * 0.6 + 0.9, y0 + h); ctx.quadraticCurveTo(x + sw * 0.3 + 0.8, y0 + h * 0.6, x + 0.3, y0 + 3); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(x0, y0, w, 1.6);
    ctx.restore();
  }
  const strap = (x0, y0, x1, y1, c, w) => { ctx.strokeStyle = c; ctx.lineWidth = w || 1; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); };
  const capeFront = id => (phase, t, ph) => { // von vorn: Innenfutter schaut links und rechts heraus, vorn Kragen und Spange
    const [c, cd] = capeCols(id, t), sw = Math.sin(t * 3) * 0.7 + Math.sin(ph * 0.5) * 1.1;
    if (phase === 0) { const shape = () => { ctx.beginPath(); ctx.moveTo(-4.4, -2.6); ctx.lineTo(4.4, -2.6); ctx.quadraticCurveTo(7.4 + sw * 0.4, 3, 7.6 + sw, 9.8); ctx.quadraticCurveTo(0 + sw, 11.4 + Math.sin(t * 5) * 0.5, -7.6 + sw, 9.8); ctx.quadraticCurveTo(-7.4 + sw * 0.4, 3, -4.4, -2.6); ctx.closePath(); };
      capeFill(id, shape, cd, cd, t, sw, -8, -3, 16, 15); ctx.strokeStyle = c; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-4.4, -2.6); ctx.quadraticCurveTo(-7.4 + sw * 0.4, 3, -7.6 + sw, 9.8); ctx.moveTo(4.4, -2.6); ctx.quadraticCurveTo(7.4 + sw * 0.4, 3, 7.6 + sw, 9.8); ctx.stroke(); }
    else { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-4.8, -3); ctx.lineTo(-1.2, -1.4); ctx.lineTo(-4.4, -0.6); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(4.8, -3); ctx.lineTo(1.2, -1.4); ctx.lineTo(4.4, -0.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = id === 'capestar' ? '#C9B6FF' : id === 'capeleaf' ? '#7FE38F' : '#F2C14E'; ctx.beginPath(); ctx.arc(0, -1.4, 1.1, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(-0.5, -1.9, 0.5, 0.5); }
  };
  const BACK_FRONTVIEW = {
    capered: capeFront('capered'), capeleaf: capeFront('capeleaf'), capegold: capeFront('capegold'), capecheck: capeFront('capecheck'), capestar: capeFront('capestar'), capeprism: capeFront('capeprism'),
    backpack: (phase) => { if (phase === 0) { ctx.fillStyle = '#2F5288'; ctx.fillRect(-6, -1.6, 2, 7); ctx.fillRect(4, -1.6, 2, 7); ctx.fillStyle = '#3F6BA8'; ctx.fillRect(-5.6, -1.2, 1.2, 6); ctx.fillRect(4.4, -1.2, 1.2, 6); ctx.fillStyle = '#2F5288'; ctx.fillRect(-2, -4.2, 4, 1.2); }
      else { ctx.fillStyle = '#2F5288'; ctx.fillRect(-3.6, -2.6, 1.3, 6.4); ctx.fillRect(2.3, -2.6, 1.3, 6.4); ctx.fillStyle = '#F2C14E'; ctx.fillRect(-3.6, 1.4, 1.3, 0.8); ctx.fillRect(2.3, 1.4, 1.3, 0.8); } },
    cashbag: (phase, t) => { if (phase === 0) { const b = Math.sin(t * 2.4) * 0.3; ctx.fillStyle = '#B8965A'; ctx.beginPath(); ctx.ellipse(4.2, -4 + b, 3.6, 3, 0.3, 0, TAU); ctx.fill(); ctx.fillStyle = '#C9A86A'; ctx.beginPath(); ctx.ellipse(3.8, -4.4 + b, 2.8, 2.2, 0.3, 0, TAU); ctx.fill(); ctx.fillStyle = '#5A4424'; ctx.fillRect(1.4, -2.6 + b, 2.4, 0.9); ctx.fillStyle = '#2E7D3E'; ctx.font = '900 3.6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('€', 4.4, -4.2 + b); ctx.fillStyle = '#7FD08A'; ctx.fillRect(5.4, -7.4 + b, 2.4, 1.2); }
      else strap(-3.8, -2.4, 3.6, 4.4, '#8A6A3A', 1); },
    skateback: (phase) => { if (phase === 0) { ctx.save(); ctx.rotate(-0.55); ctx.fillStyle = '#2B3039'; ctx.fillRect(-2.8, -9, 5.6, 19); ctx.fillStyle = '#E05555'; ctx.fillRect(-2.4, -8.6, 4.8, 18.2); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-2.4, -6, 4.8, 0.7); for (const y of [-7.4, 8]) { ctx.fillStyle = '#E8E2D0'; ctx.fillRect(-3.4, y, 1.4, 1.4); ctx.fillRect(2, y, 1.4, 1.4); } cannaLeaf(0, -8.2, 3, '#63FF9A'); ctx.restore(); } else strap(3.8, -2.4, -3.6, 4.4, '#1D2129', 0.9); },
    guitarback: (phase) => { if (phase === 0) { ctx.save(); ctx.rotate(0.62); ctx.fillStyle = '#5A3524'; ctx.fillRect(-0.7, -14, 1.4, 12); ctx.fillStyle = '#3A2A1C'; ctx.fillRect(-1.3, -15.6, 2.6, 2.2); ctx.fillStyle = '#E8E2D0'; for (let k = 0; k < 3; k++) { ctx.fillRect(-1.9, -15.4 + k * 0.7, 0.6, 0.4); ctx.fillRect(1.3, -15.4 + k * 0.7, 0.6, 0.4); } ctx.fillStyle = '#B5652E'; ctx.beginPath(); ctx.ellipse(0, 3.6, 4.4, 5, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(0, -1.4, 3.4, 3.4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#8A4A22'; ctx.beginPath(); ctx.ellipse(0, 3.6, 4.4, 5, 0, 0, TAU); ctx.lineWidth = 0.6; ctx.strokeStyle = '#7A3A1A'; ctx.stroke(); ctx.restore(); } else strap(3.8, -2.4, -3.6, 4.4, '#3A2A1C', 0.9); },
    katana: (phase) => { if (phase === 0) { ctx.save(); ctx.rotate(-0.62); ctx.fillStyle = '#20232C'; ctx.fillRect(-0.9, -8, 1.8, 19); ctx.fillStyle = '#C9A13A'; ctx.fillRect(-0.9, 9.6, 1.8, 1.4); ctx.fillRect(-2, -8.8, 4, 1); ctx.fillStyle = '#B5473A'; ctx.fillRect(-0.9, -12.6, 1.8, 3.8); ctx.fillStyle = '#2A1A14'; for (let k = 0; k < 3; k++) ctx.fillRect(-0.9, -12.2 + k * 1.2, 1.8, 0.4); ctx.restore(); } else strap(3.8, -2.4, -3.6, 4.4, '#20232C', 0.8); },
    jetpack: (phase) => { if (phase === 0) { ctx.fillStyle = '#9AA6B3'; ctx.fillRect(-6, -1.6, 2, 7); ctx.fillRect(4, -1.6, 2, 7); ctx.fillStyle = '#D33F3F'; ctx.fillRect(-6, -1.6, 2, 1.2); ctx.fillRect(4, -1.6, 2, 1.2); for (const x of [-5, 5]) { const h = 3 + Math.random() * 3; ctx.fillStyle = 'rgba(255,170,50,.9)'; ctx.fillRect(x - 0.8, 5.4, 1.6, h); ctx.fillStyle = 'rgba(255,240,180,.95)'; ctx.fillRect(x - 0.4, 5.4, 0.8, h * 0.5); } }
      else { ctx.fillStyle = '#5A626E'; ctx.fillRect(-3.6, -2.6, 1.2, 5.6); ctx.fillRect(2.4, -2.6, 1.2, 5.6); ctx.fillStyle = '#D33F3F'; ctx.fillRect(-1, 1.6, 2, 1.2); } }
  };
  function drawBack(L, dir, ph, phase) {
    const id = L.back; if (!id || id === 'none') return;
    const up = dir === 'u', side = dir === 'l' || dir === 'r', front = !up && !side, t = gt + (L.r || 0) * 0.01, fl = Math.sin(t * 6);
    if (front && !BACK_FRONT[id] && BACK_FRONTVIEW[id]) { ctx.save(); BACK_FRONTVIEW[id](phase, t, ph); ctx.restore(); return; } // v142: von vorn sichtbar (Umhang-Saum, Riemen, Rucksack-Seiten)
    const onTop = BACK_FRONT[id] ? !up : up; // vorne getragenes sieht man von vorn, Rueckenteile von hinten
    if ((phase === 1) !== onTop) return;
    ctx.save(); if (dir === 'l') ctx.scale(-1, 1);
    const R = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    const wing = (sx, c1, c2, kind) => { // sx: -1 links, 1 rechts
      const fa = kind === 'bat' ? fl * 0.12 : fl * 0.2;
      ctx.save(); ctx.translate(sx * 2, -1); ctx.scale(sx, 1); ctx.rotate(-fa);
      ctx.fillStyle = c1; ctx.beginPath();
      if (kind === 'fairy') { ctx.ellipse(6, -5, 6, 4, -0.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(5, 2, 4.5, 3, 0.4, 0, TAU); ctx.fill(); ctx.strokeStyle = c2; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.ellipse(6, -5, 6, 4, -0.5, 0, TAU); ctx.stroke(); }
      else if (kind === 'bat') { ctx.moveTo(0, 0); ctx.lineTo(4, -7); ctx.lineTo(12, -6); ctx.lineTo(10, -2); ctx.lineTo(12, 1); ctx.lineTo(8, 0); ctx.lineTo(7, 4); ctx.lineTo(4, 1); ctx.closePath(); ctx.fill(); ctx.strokeStyle = c2; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, -2); ctx.moveTo(0, 0); ctx.lineTo(7, 4); ctx.stroke(); }
      else { ctx.moveTo(0, 1); ctx.quadraticCurveTo(5, -10, 13, -9); ctx.quadraticCurveTo(12, -3, 9, 0); ctx.quadraticCurveTo(10, 3, 6, 5); ctx.quadraticCurveTo(3, 5, 0, 3); ctx.closePath(); ctx.fill(); ctx.fillStyle = c2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(4 + k * 2.6, -3 + k * 1.6, 1.4, 3.2, 0.7, 0, TAU); ctx.fill(); } }
      ctx.restore();
    };
    const wings = (c1, c2, kind) => { if (side) { ctx.save(); ctx.translate(-2, 0); wing(-1, c1, c2, kind); ctx.restore(); } else { wing(-1, c1, c2, kind); wing(1, c1, c2, kind); } };
    switch (id) {
      case 'wangel': wings('#F4F6FA', '#D6DCE6'); break;
      case 'wbat': wings('#2A2433', '#6B5A80', 'bat'); break;
      case 'wfairy': { ctx.globalAlpha = 0.7; const h = (t * 50) % 360; wings('hsla(' + h + ',90%,75%,.8)', 'hsla(' + ((h + 60) % 360) + ',90%,85%,.9)', 'fairy'); ctx.globalAlpha = 1; break; }
      case 'wphoenix': { ctx.save(); ctx.globalCompositeOperation = 'lighter'; wings('rgba(255,120,40,.9)', 'rgba(255,220,90,.9)'); ctx.restore(); if (Math.random() < 0.3) { ctx.fillStyle = 'rgba(255,200,80,.8)'; ctx.fillRect((Math.random() - 0.5) * 22, -6 + Math.random() * 10, 1, 1); } break; }
      case 'capeleaf': case 'capered': case 'capegold': case 'capecheck': case 'capestar': case 'capeprism': { // v142: laenger, weht beim Laufen, Falten und Muster
        const [c, cd] = capeCols(id, t), sw = Math.sin(t * 3) * 0.7 + Math.sin(ph * 0.5) * 1.1;
        if (up) {
          const shape = () => { ctx.beginPath(); ctx.moveTo(-4.6, -2.6); ctx.lineTo(4.6, -2.6); ctx.quadraticCurveTo(6.6 + sw * 0.4, 3.5, 6.4 + sw, 10.4); ctx.quadraticCurveTo(3.2 + sw, 9.2 + Math.sin(t * 5) * 0.5, 0 + sw, 10.6); ctx.quadraticCurveTo(-3.2 + sw, 11.8 + Math.sin(t * 5 + 1) * 0.5, -6.4 + sw, 10.4); ctx.quadraticCurveTo(-6.6 + sw * 0.4, 3.5, -4.6, -2.6); ctx.closePath(); };
          capeFill(id, shape, c, cd, t, sw, -7, -3, 14, 15);
          R(-4.6, -2.8, 9.2, 1.2, cd);
          if (id === 'capeleaf') cannaLeaf(sw * 0.5, 5.4, 7, '#7FE38F');
          else if (id === 'capered') { ctx.fillStyle = '#F2C14E'; ctx.beginPath(); ctx.moveTo(sw * .5, 2); ctx.lineTo(2.8 + sw * .5, 4.8); ctx.lineTo(sw * .5, 7.6); ctx.lineTo(-2.8 + sw * .5, 4.8); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#C23B3B'; ctx.font = '900 3.4px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('K', sw * .5, 5); }
          else if (id === 'capegold') { ctx.fillStyle = '#FFF2C0'; ctx.beginPath(); ctx.arc(sw * .5, 4.8, 2.8, 0, TAU); ctx.fill(); ctx.fillStyle = '#9A6C14'; ctx.font = '900 4px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('€', sw * .5, 5); }
          else if (id === 'capestar') { ctx.fillStyle = '#C9B6FF'; starPath(sw * .5, 4.8, 3, 1.3); ctx.fill(); }
        }
        else if (side) { const shape = () => { ctx.beginPath(); ctx.moveTo(-0.6, -2.8); ctx.lineTo(-3.6, -2.8); ctx.quadraticCurveTo(-6.4 - sw, 3, -10.6 - sw * 1.8, 9.4); ctx.quadraticCurveTo(-8 - sw * 1.2, 10.8 + Math.sin(t * 5) * 0.6, -4.4 - sw * 0.6, 9.8); ctx.quadraticCurveTo(-2.2, 4, -0.6, -2.8); ctx.closePath(); }; capeFill(id, shape, c, cd, t, sw, -12, -3, 12, 15); R(-3.4, -3, 3.4, 1.2, cd); }
        break;
      }
      case 'wgold': { wings('#F2C14E', '#FFF0A8'); if (Math.random() < 0.25) { ctx.fillStyle = 'rgba(255,240,170,.9)'; ctx.fillRect((Math.random() - 0.5) * 24, -8 + Math.random() * 10, 1, 1); } break; }
      case 'wstar': { ctx.save(); ctx.globalCompositeOperation = 'lighter'; wings('rgba(120,200,255,.75)', 'rgba(235,250,255,.95)'); ctx.restore(); for (let i = 0; i < 4; i++) { const a = .5 + .5 * Math.sin(t * 4 + i * 2); ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')'; ctx.fillRect((i % 2 ? 1 : -1) * (5 + i * 1.6), -6 + i * 1.4, 1, 1); } break; }
      case 'wcosmos': { wings('#2A1E5C', '#7A5CFF'); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 8; i++) { const a = .4 + .6 * Math.abs(Math.sin(t * 2.5 + i * 1.3)); ctx.fillStyle = i % 3 ? 'rgba(255,255,255,' + a.toFixed(2) + ')' : 'rgba(255,140,220,' + a.toFixed(2) + ')'; ctx.fillRect((i % 2 ? 1 : -1) * (3 + (i * 1.7) % 9), -7 + (i * 2.1) % 9, 1, 1); } ctx.restore(); break; }
      case 'backpack': if (up) { R(-3.8, -1.8, 7.6, 7, '#3F6BA8'); R(-3, 1.4, 6, 3, '#2F5288'); R(-1, -1.2, 2, 1, '#F2C14E'); } else if (side) { R(-6.4, -1.6, 3, 6.6, '#3F6BA8'); R(-6.8, 1.2, 1.2, 3, '#2F5288'); } else { R(-3.6, -2.2, 1, 5, '#2F5288'); R(2.6, -2.2, 1, 5, '#2F5288'); } break;
      case 'jetpack': {
        const fire = (x) => { const h = 3 + Math.random() * 3; ctx.fillStyle = 'rgba(255,170,50,.9)'; ctx.fillRect(x - 0.8, 6.4, 1.6, h); ctx.fillStyle = 'rgba(255,240,180,.95)'; ctx.fillRect(x - 0.4, 6.4, 0.8, h * 0.5); };
        if (up) { R(-4.2, -1.8, 3.4, 8, '#9AA6B3'); R(0.8, -1.8, 3.4, 8, '#9AA6B3'); R(-4.2, -1.8, 3.4, 1.2, '#D33F3F'); R(0.8, -1.8, 3.4, 1.2, '#D33F3F'); fire(-2.5); fire(2.5); }
        else if (side) { R(-6.6, -1.8, 3, 8, '#9AA6B3'); R(-6.6, -1.8, 3, 1.2, '#D33F3F'); fire(-5.1); }
        else { R(-5.6, -1, 1.6, 6.4, '#9AA6B3'); R(4, -1, 1.6, 6.4, '#9AA6B3'); fire(-4.8); fire(4.8); }
        break;
      }
      case 'guitarback': { ctx.save(); ctx.rotate(side ? 0.5 : 0.7); if (up) { ctx.fillStyle = '#B5652E'; ctx.beginPath(); ctx.ellipse(0, 4, 3.4, 3.6, 0, 0, TAU); ctx.fill(); R(-0.7, -9, 1.4, 11, '#5A3524'); ctx.fillStyle = '#20150F'; ctx.beginPath(); ctx.arc(0, 3, 1.2, 0, TAU); ctx.fill(); } else R(-0.7, -11, 1.4, 6, '#5A3524'); R(-1.2, -12, 2.4, 1.6, '#3A2A1C'); ctx.restore(); break; }
      case 'skateback': { if (up) { R(-2.6, -4, 5.2, 12, '#2B3039'); R(-2.2, -3.6, 4.4, 11.2, '#E05555'); cannaLeaf(0, 3, 4.4, '#63FF9A'); for (const y of [-2.4, 6]) { R(-3, y, 1.2, 1.2, '#E8E2D0'); R(1.8, y, 1.2, 1.2, '#E8E2D0'); } } else if (side) R(-5.4, -5, 1.6, 12, '#E05555'); else { R(-2.6, -6.4, 5.2, 2.6, '#E05555'); } break; }
      case 'wdragon': wings('#3E8A4A', '#9AE06A', 'bat'); break;
      case 'cashbag': { if (up) { ctx.fillStyle = '#C9A86A'; ctx.beginPath(); ctx.ellipse(0, 3.4, 4.6, 5, 0, 0, TAU); ctx.fill(); R(-1.6, -2.4, 3.2, 1.8, '#8A6A3A'); R(-2.2, -1, 4.4, .8, '#5A4424'); ctx.fillStyle = '#2E7D3E'; ctx.font = '900 5px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('€', 0, 4); } else if (side) { ctx.fillStyle = '#C9A86A'; ctx.beginPath(); ctx.ellipse(-5.4, 3, 2.6, 4.4, 0, 0, TAU); ctx.fill(); } else { R(-3.8, -2.2, 1, 5, '#8A6A3A'); R(2.8, -2.2, 1, 5, '#8A6A3A'); } break; }
      case 'katana': { ctx.save(); ctx.rotate(side ? 0.35 : -0.6); if (up || side) { R(-.8, -9, 1.6, 13, '#20232C'); R(-.8, -9, 1.6, 1, '#C9A13A'); R(-1.9, -9.6, 3.8, .9, '#C9A13A'); R(-.8, -13, 1.6, 3.6, '#B5473A'); for (let k = 0; k < 3; k++) R(-.8, -12.6 + k * 1.2, 1.6, .4, '#2A1A14'); } else { R(-.8, -13, 1.6, 3.6, '#B5473A'); R(-1.9, -9.8, 3.8, .9, '#C9A13A'); } ctx.restore(); break; }
      case 'fanny': { // Bauchtasche, schraeg vorn
        if (up) R(-3.6, 2.2, 7.2, 0.8, '#1D2129');
        else if (side) { R(1.6, 2, 2.6, 2.6, '#2B3039'); R(1.6, 2, 2.6, 0.7, '#F2C14E'); }
        else { ctx.fillStyle = '#1D2129'; ctx.save(); ctx.rotate(-0.25); ctx.fillRect(-4, 1.2, 8.4, 0.8); ctx.restore(); R(-2.4, 2.2, 4.8, 2.8, '#2B3039'); R(-2.4, 2.2, 4.8, 0.7, '#F2C14E'); cannaLeaf(0, 4.3, 2, '#63C174'); }
        break;
      }
    }
    ctx.restore();
  }
  // v157: Figuren-Zwischenspeicher. Eine Figur, die mehrere Bilder lang gleich dasteht (gleiches Aussehen, Richtung, Schrittstellung),
  // wird zweimal mit Abstand gezeichnet und verglichen. Sind beide Bilder gleich, wird sie ab dann als fertiges Bild gezeigt.
  // Laufende, blinkende oder wehende Figuren (LED-Schuhe, Umhang ...) bleiben live, so sieht alles aus wie vorher.
  const FIG = new Map(), FIGSIG = new WeakMap(); let figFrame = 0, figOff = false, figSeenF = -1, figSeenP = new Set(), figSeenC = new Set();
  function figSig(L) { let e = FIGSIG.get(L); if (!e || e.f !== figFrame) { let sgn; try { sgn = JSON.stringify(L); } catch (x) { sgn = null; } e = { f: figFrame, s: sgn }; FIGSIG.set(L, e); } return e.s; }
  function figHash(c) { try { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 2166136261; for (let i = 0; i < d.length; i += 3) h = Math.imul(h ^ d[i], 16777619); return h >>> 0; } catch (e) { return -1; } }
  const FIG_T = [0.21, 0.57, 0.93, 1.33, 1.87, 2.41, 3.09, 3.77]; // Probe-Zeitpunkte (Sekunden Versatz)
  let figPC = null; // eine wiederverwendete Testfläche für den Vergleich (nicht im Bildspeicher)
  function figProbe(R, body) { // zeichnet die Figur an 9 Zeitpunkten und prüft, ob alle gleich aussehen
    const w = Math.ceil(FIGW * R), h = Math.ceil(FIGH * R);
    try { if (!figPC) figPC = document.createElement('canvas'); if (figPC.width !== w || figPC.height !== h) { figPC.width = w; figPC.height = h; } } catch (e) { figOff = true; return false; }
    const x = figPC.getContext && figPC.getContext('2d', { willReadFrequently: true }); if (!x || !x.getImageData) { figOff = true; return false; }
    const g0 = gt, s0 = ctx; let h0 = -2, same = true;
    try { for (const dt of [0].concat(FIG_T)) { gt = g0 + dt; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, w, h); x.setTransform(R, 0, 0, R, -FIGX0 * R, -FIGY0 * R); ctx = x; body(); ctx = s0; const hh = figHash(figPC); if (hh === -1) { figOff = true; same = false; break; } if (h0 === -2) h0 = hh; else if (hh !== h0) { same = false; break; } } }
    catch (e) { same = false; } finally { gt = g0; ctx = s0; }
    return same;
  }
  function figDraw(L, dir, ph, body) {
    if (figOff || bcOff || typeof document === 'undefined' || !document.createElement) { body(); return; }
    const R = curR(3), sg = figSig(L); if (!R || !sg) { body(); return; }
    const key = 'f|' + sg + '|' + dir + '|' + Math.round(ph * 1000) + '|' + R; let e = FIG.get(key);
    if (figSeenF !== figFrame) { figSeenP = figSeenC; figSeenC = new Set(); figSeenF = figFrame; } figSeenC.add(key);
    if (!e && !figSeenP.has(key)) { body(); return; } // erst merken, wenn die Figur auch im letzten Bild genau so dastand
    if (!e) { if (FIG.size > 1500) { for (const k of FIG.keys()) cacheDrop(k); FIG.clear(); } e = { n: 0, last: -9, st: 0 }; FIG.set(key, e); }
    if (e.st === 2) { body(); return; }
    if (e.st === 1) { let c = cacheGet(key); if (!c && CB.px < CB.max * 0.85) c = cacheMake(key, FIGW, FIGH, R, FIGX0, FIGY0, body); if (c && cacheBlit(c, [FIGX0, FIGY0, FIGW, FIGH])) return; body(); return; } // schon geprüft: höchstens neu zeichnen, nicht neu testen
    e.n = e.last === figFrame - 1 ? e.n + 1 : 1; e.last = figFrame;
    if (e.n === 3 && CB.px < CB.max * 0.85) { e.st = figProbe(R, body) ? 1 : 2; if (e.st === 1) { const c = cacheMake(key, FIGW, FIGH, R, FIGX0, FIGY0, body); if (c && cacheBlit(c, [FIGX0, FIGY0, FIGW, FIGH])) return; } }
    body();
  }
  const FIGX0 = -26, FIGY0 = -38, FIGW = 52, FIGH = 58;
  function drawFigure(px, py, pang, pstep, look) { figFrame = frameNo;
    const L = look || G.look, bob = Math.abs(Math.sin(pstep)) * 0.9, s1 = 1.3 * L.size;
    const cx = Math.cos(pang), sy = Math.sin(pang), dir = Math.abs(sy) > Math.abs(cx) * 1.05 ? (sy < 0 ? 'u' : 'd') : (cx < 0 ? 'l' : 'r');
    if (L.aura && L.aura !== 'none' && (!LOFX || L === G.look)) drawAura(px, py, L.aura, gt); // v128: bei Weniger Effekte nur die eigene Aura
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ell(px, py + 8.5 * s1, 7.5 * s1, 3 * s1); ctx.fill();
    ctx.save(); ctx.translate(px, py - bob - 1); ctx.scale(s1, s1);
    if (L.outline && COS_SHIM[L.cos] && (!LOFX || L === G.look)) for (const o of [[-0.9, 0], [0.9, 0], [0, -0.9], [0, 0.9]]) { ctx.save(); ctx.translate(o[0], o[1]); sprite(L, dir, pstep, '#10151C'); ctx.restore(); }
    const shim = COS_SHIM[L.cos], shOn = shim && (!LOFX || L === G.look); if (shim && (!LOFX || L === G.look)) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, -1, 1, 0, -1, 12); g.addColorStop(0, 'rgba(' + shim[0] + ',' + (0.22 + 0.1 * Math.sin(gt * 3)).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + shim[0] + ',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -1, 12, 0, TAU); ctx.fill(); ctx.restore(); } // v144: Leucht-Kostueme
    const body = () => { if (L.outline) for (const o of [[-0.9, 0], [0.9, 0], [0, -0.9], [0, 0.9]]) { ctx.save(); ctx.translate(o[0], o[1]); sprite(L, dir, pstep, '#10151C'); ctx.restore(); } drawBack(L, dir, pstep, 0); sprite(L, dir, pstep, null); drawBack(L, dir, pstep, 1); }; // v76: Ruecken-Kosmetik
    if (shOn) { drawBack(L, dir, pstep, 0); sprite(L, dir, pstep, null); drawBack(L, dir, pstep, 1); }
    else figDraw(L, dir, pstep, body); // v157: stehende, unveränderte Figuren als fertiges Bild
    if (shim && (!LOFX || L === G.look)) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { const p = (gt * 0.9 + k * 0.27 + (L.r || 0) * 0.01) % 1; if (p > 0.3) continue; const hv = Math.sin(k * 91.3 + Math.floor(gt * 0.9 + k * 0.27) * 17.1) * 43758.5; const fx2 = (hv - Math.floor(hv)) * 8 - 4, fy = ((hv * 7) - Math.floor(hv * 7)) * 14 - 9, s2 = Math.sin(p / 0.3 * Math.PI) * 1.6; ctx.fillStyle = shim[1]; ctx.fillRect(fx2 - .2, fy - s2, .4, s2 * 2); ctx.fillRect(fx2 - s2, fy - .2, s2 * 2, .4); } ctx.restore(); }
    ctx.restore();
  }
  // ---------- Fahrzeuge zeichnen (v48) ----------
  function drawVehicle(px, py, ang, id, spin, size, phase) {
    const cx = Math.cos(ang), sy = Math.sin(ang), vert = Math.abs(sy) > Math.abs(cx) * 1.05, wr = id === 'scooter' ? 3.4 : 5.4, wy = -wr, s1 = (size || 1) * 1.3;
    if (phase === 1 && !(vert && sy > 0)) return;
    ctx.save(); ctx.translate(px, py + 8.5 * s1); ctx.scale(s1 / 1.3, s1 / 1.3); ctx.lineCap = 'round';
    if (phase !== 1) { ctx.fillStyle = 'rgba(0,0,0,.28)'; ell(0, 0.5, vert ? 6 : 14, 3); ctx.fill(); }
    if (!vert) {
      if (cx < 0) ctx.scale(-1, 1);
      const wx = id === 'scooter' ? 10 : 9.5;
      const wheel = x => {
        ctx.strokeStyle = '#14161C'; ctx.lineWidth = 1.9; ctx.beginPath(); ctx.arc(x, wy, wr - 0.8, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#A4ADBA'; ctx.lineWidth = 0.7;
        for (let k = 0; k < 3; k++) { const a = spin + k * Math.PI / 3; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (wr - 1), wy + Math.sin(a) * (wr - 1)); ctx.lineTo(x - Math.cos(a) * (wr - 1), wy - Math.sin(a) * (wr - 1)); ctx.stroke(); }
      };
      wheel(-wx); wheel(wx);
      if (id === 'scooter') {
        ctx.fillStyle = '#2B2F3A'; ctx.fillRect(-wx, wy - 1.6, wx * 2, 2.4); ctx.fillStyle = '#3BB3A6'; ctx.fillRect(-wx, wy - 1.6, wx * 2, 0.9);
        ctx.strokeStyle = '#A4ADBA'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(wx - 0.5, wy - 1); ctx.lineTo(wx - 2, -12); ctx.stroke();
        ctx.fillStyle = '#14161C'; ctx.fillRect(wx - 5, -13.4, 6.5, 1.8);
      } else {
        ctx.strokeStyle = id === 'bmx' ? '#E05555' : '#EEF2F7'; ctx.lineWidth = id === 'ebike' ? 2.1 : 1.7; ctx.beginPath();
        ctx.moveTo(-wx, wy); ctx.lineTo(-3, -12); ctx.lineTo(5, -12); ctx.lineTo(wx, wy);
        ctx.moveTo(-wx, wy); ctx.lineTo(-0.5, wy + 0.4); ctx.lineTo(5, -12); ctx.moveTo(-3, -12); ctx.lineTo(-0.5, wy + 0.4); ctx.stroke();
        ctx.fillStyle = '#14161C'; ctx.fillRect(-5.2, -13.6, 4.6, 1.5); ctx.fillRect(-2, wy + 0.2, 3, 1.2);
        ctx.strokeStyle = '#14161C'; ctx.lineWidth = 1.7; ctx.beginPath(); ctx.moveTo(5, -12); ctx.lineTo(4.4, -16); ctx.lineTo(7, -16); ctx.stroke();
        if (id === 'ebike') { ctx.fillStyle = '#2A2F3A'; ctx.fillRect(-2.6, -10, 5, 4.5); ctx.fillStyle = '#4DF0C8'; ctx.fillRect(-1.6, -8.8, 3.2, 1); ctx.fillStyle = '#FFE9A0'; ctx.fillRect(7.2, -14.4, 2, 1.6); }
      }
    } else if (phase === 1) { // von vorn: Lenker liegt vor dem Fahrer
      if (id === 'scooter') { ctx.fillStyle = '#14161C'; ctx.fillRect(-5.5, -13.4, 11, 1.7); }
      else { ctx.fillStyle = '#14161C'; ctx.fillRect(-6.5, -15.6, 13, 1.7); if (id === 'ebike') { ctx.fillStyle = '#FFE9A0'; ctx.fillRect(-1.2, -14, 2.4, 1.6); } }
    } else {
      ctx.fillStyle = '#14161C'; ctx.beginPath(); ctx.ellipse(0, -wr, 1.5, wr, 0, 0, TAU); ctx.fill();
      if (id === 'scooter') { ctx.fillStyle = '#3BB3A6'; ctx.fillRect(-2.6, -3.4, 5.2, 2.4); ctx.fillStyle = '#A4ADBA'; ctx.fillRect(-0.8, -12, 1.6, 9); if (sy <= 0) { ctx.fillStyle = '#14161C'; ctx.fillRect(-5.5, -13.4, 11, 1.7); } }
      else {
        ctx.fillStyle = id === 'bmx' ? '#E05555' : '#EEF2F7'; ctx.fillRect(-1, -13, 2, 8);
        ctx.fillStyle = '#14161C'; ctx.fillRect(-2.2, -13.6, 4.4, 1.6); if (sy <= 0) ctx.fillRect(-6.5, -15.6, 13, 1.7);
        const pd = Math.sin(spin) * 2; ctx.fillRect(-4.5, -5 + pd, 2.4, 1.3); ctx.fillRect(2.1, -5 - pd, 2.4, 1.3);
      }
    }
    ctx.restore();
  }
  // v66: Autos von oben: Form je Modell, Farbe frei waehlbar, Fahrer sieht man durch die Scheibe
  // v80: Autos neu gezeichnet (jedes Modell behaelt seinen Charakter, das Musclecar bleibt wie es ist) plus Folierung, Lackeffekt,
  // Scheibentoenung, Lichtfarbe, Auspuff-Flammen, Dachaufbau und Kennzeichen. tu = Tuning-Werte in der Reihenfolge von TUNE_KEYS.
  // o.own: eigenes Auto (Kennzeichen, Ladung auf der Pritsche, Flammen beim Vollgas), o.pv: Vorschau im Handy, o.night: Nachtansicht
  const carRgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return '255,240,180'; const n = parseInt(m[1], 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); };
  const shadeHex = (h, k) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return '#1D2129'; const n = parseInt(m[1], 16), f = c => clamp(Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k), 0, 255); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; };
  const CAR_ROOF = { van: [-7, 18], mini: [-2.2, 8], muscle: [-4.5, 8], sport: [-1, 7], super: [-1, 7], pickup: [1.5, 6.5], suv: [-4, 15], lowrider: null, truck: [21, 7] };
  function fleetLogo(L, W) { // v150: erfundene Spedition PFEILFRACHT: orangefarbener Pfeil um ein Paket
    const x0 = -L / 2, x1 = L / 2 - 19;
    ctx.fillStyle = '#F7F8FA'; ctx.fillRect(x0, -W / 2, x1 - x0, W); ctx.fillStyle = 'rgba(0,0,0,.05)'; for (let x = x0 + 4; x < x1; x += 5) ctx.fillRect(x, -W / 2, 1, W);
    ctx.fillStyle = '#FF7A1A'; ctx.beginPath(); ctx.moveTo(x1 - 13, W / 2); ctx.lineTo(x1 - 5, W / 2); ctx.lineTo(x1 + 3, -W / 2); ctx.lineTo(x1 - 5, -W / 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#1E2A4A'; ctx.beginPath(); ctx.moveTo(x1 - 4, W / 2); ctx.lineTo(x1 - 1.6, W / 2); ctx.lineTo(x1 + 6, -W / 2); ctx.lineTo(x1 + 3.6, -W / 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1E2A4A'; ctx.fillRect(x0, -W / 2, x1 - x0, 1.4); ctx.fillRect(x0, W / 2 - 1.4, x1 - x0, 1.4);
    const lx = x0 + 6.5; ctx.fillStyle = '#FF7A1A'; ctx.beginPath(); ctx.arc(lx, 0, 5.4, 0, TAU); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(lx - 2, -1.8, 4, 4); ctx.fillStyle = '#1E2A4A'; ctx.fillRect(lx - 2, -1.8, 4, 0.9); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(lx, 0.2, 3.9, Math.PI * 0.85, Math.PI * 2.05); ctx.stroke(); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(lx + 4.3, 1.5); ctx.lineTo(lx + 2.2, 0.3); ctx.lineTo(lx + 5.4, -0.4); ctx.closePath(); ctx.fill();
    const tx = (x0 + 13 + x1 - 13) / 2 + 1.6; ctx.save(); ctx.fillStyle = '#1E2A4A'; ctx.font = '900 3.3px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('PFEILFRACHT', tx, -1.4); ctx.fillStyle = '#FF7A1A'; ctx.font = '800 1.9px sans-serif'; ctx.fillText('SCHNELL · SICHER', tx, 2.2); ctx.restore();
  }
  function drawCar(px, py, ang, id, ci, look, nod, tn, o) {
    o = o || {};
    const v = VEH_BY[id], L = v.len, W = v.wid, col = CAR_COLS[ci] || CAR_COLS[0], lk = look || (G && G.look) || DEF_LOOK, dk = o.night !== undefined ? o.night : lightK() > 0.3, tu = tn || [-1, -1, 0, -1, -1];
    const T = i => (tu[i] === undefined || tu[i] === null ? (i === 2 ? 0 : -1) : tu[i]);
    const glass = T(7) >= 0 ? (TUNE.tint.cols[T(7)] || '#1E2A3A') : '#1E2A3A', hi = 'rgba(255,255,255,.22)', dark = shadeHex(col, -0.45), lite = shadeHex(col, 0.18);
    const hlCol = T(8) >= 0 ? (TUNE.lights.cols[T(8)] || '#FFE9A0') : (dk ? '#FFF3B0' : '#FFE9A0');
    ctx.save(); ctx.translate(px, py + 2); ctx.rotate(ang);
    if (T(0) >= 0) { const nc = TUNE.neon.cols[T(0)] || '#39FF88', pu = 0.8 + 0.2 * Math.sin(gt * 4); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (dk ? 0.75 : 0.45) * pu; const g = ctx.createRadialGradient(0, 2, 2, 0, 2, L * 0.75); g.addColorStop(0, nc); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 2, L * 0.72, W * 0.95, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = (dk ? 0.85 : 0.55) * pu; ctx.strokeStyle = nc; ctx.lineWidth = 1.6; rr(-L / 2 - 1.5, -W / 2 - 1, L + 3, W + 2, 7); ctx.stroke(); ctx.restore(); } // Unterbodenbeleuchtung mit Lichtsaum
    const rf = T(10), RF = CAR_ROOF[id], finO = T(6), wrapO = T(5); // v157: Karosserie als fertiges Bild, wenn sich daran nichts bewegt
    const body = () => {
      ctx.fillStyle = 'rgba(0,0,0,.34)'; rr(-L / 2 + 2, -W / 2 + 3, L, W, 6); ctx.fill();
      // Reifen mit Profil, Felgen immer sichtbar (getunt farbig), Lenkeinschlag vorne
      const big = id === 'suv' || id === 'truck', tw = big ? 10 : 9, th = big ? 4.4 : 3.6, lowr = id === 'lowrider';
      const stA = clamp((nod || !o.own ? 0 : (player.steer || 0)) * 0.12, -0.35, 0.35), rimC = T(4) >= 0 ? (TUNE.rims.cols[T(4)] || '#C9CED6') : lowr ? '#E8B84A' : '#8C949E';
      const axles = id === 'truck' ? [L / 2 - 8, -L / 2 + 15, -L / 2 + 8] : [L * 0.3, -L * 0.3];
      for (const wx of axles) for (const sy of [-1, 1]) {
        ctx.save(); ctx.translate(wx, sy * (W / 2 + 0.4)); if (wx === axles[0]) ctx.rotate(stA);
        ctx.fillStyle = '#121418'; rr(-tw / 2, -th / 2, tw, th, 1.4); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.1)'; for (let k = -tw / 2 + 1.5; k <= tw / 2 - 1; k += 2) ctx.fillRect(k, -th / 2, 0.7, th);
        if (lowr) { ctx.fillStyle = '#F4F6FA'; ctx.fillRect(-3, -th / 2 + 0.6, 6, th - 1.2); } // Weisswandreifen
        ctx.fillStyle = rimC; ctx.fillRect(-1.8, -1.2, 3.6, 2.4); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(-1.2, -1.2, 1.2, 0.8); ctx.restore();
      }
      // Karosserieform je Modell
      const bodyPath = () => {
        ctx.beginPath();
        if (id === 'sport') { ctx.moveTo(-L / 2 + 2, -W / 2 + 1); ctx.lineTo(L / 2 - 6, -W / 2 + 2); ctx.quadraticCurveTo(L / 2 + 1, 0, L / 2 - 6, W / 2 - 2); ctx.lineTo(-L / 2 + 2, W / 2 - 1); ctx.quadraticCurveTo(-L / 2 - 1, 0, -L / 2 + 2, -W / 2 + 1); ctx.closePath(); }
        else if (id === 'super') { ctx.moveTo(-L / 2 + 3, -W / 2); ctx.lineTo(L / 2 - 9, -W / 2 + 1); ctx.quadraticCurveTo(L / 2 + 2, -W / 4, L / 2, 0); ctx.quadraticCurveTo(L / 2 + 2, W / 4, L / 2 - 9, W / 2 - 1); ctx.lineTo(-L / 2 + 3, W / 2); ctx.closePath(); }
        else if (id === 'truck') { const r = (x, y, w, h, q) => { ctx.moveTo(x + q, y); ctx.arcTo(x + w, y, x + w, y + h, q); ctx.arcTo(x + w, y + h, x, y + h, q); ctx.arcTo(x, y + h, x, y, q); ctx.arcTo(x, y, x + w, y, q); ctx.closePath(); }; r(L / 2 - 16, -W / 2 + 1, 16, W - 2, 3); r(-L / 2, -W / 2, L - 19, W, 1.5); }
        else { const [y0, hh, q] = id === 'mini' ? [-W / 2 + 0.5, W - 1, 7] : id === 'muscle' ? [-W / 2 + 0.5, W - 1, 4] : id === 'lowrider' ? [-W / 2 + 1, W - 2, 5] : id === 'suv' ? [-W / 2, W, 4] : id === 'pickup' ? [-W / 2, W, 3.5] : [-W / 2, W, 3]; const x = -L / 2, w = L; ctx.moveTo(x + q, y0); ctx.arcTo(x + w, y0, x + w, y0 + hh, q); ctx.arcTo(x + w, y0 + hh, x, y0 + hh, q); ctx.arcTo(x, y0 + hh, x, y0, q); ctx.arcTo(x, y0, x + w, y0, q); ctx.closePath(); }
      };
      if (id === 'muscle') { ctx.fillStyle = dark; rr(-L / 2 - 0.7, -W / 2 - 0.2, L + 1.4, W + 0.4, 6); ctx.fill(); }
      if (id === 'truck') { ctx.fillStyle = '#23272E'; ctx.fillRect(L / 2 - 20, -W / 2 + 4, 6, W - 8); } // Fahrgestell zwischen Kabine und Koffer
      bodyPath(); ctx.fillStyle = col; ctx.fill();
      if (id === 'truck') { ctx.save(); ctx.beginPath(); ctx.rect(-L / 2, -W / 2, L - 19, W); ctx.clip(); ctx.fillStyle = '#E8ECF2'; ctx.fillRect(-L / 2, -W / 2, L - 19, W); ctx.fillStyle = 'rgba(0,0,0,.07)'; for (let x = -L / 2 + 4; x < L / 2 - 20; x += 5) ctx.fillRect(x, -W / 2, 1, W); ctx.fillStyle = col; ctx.fillRect(-L / 2, -W / 2, L - 19, 2.2); ctx.fillRect(-L / 2, W / 2 - 2.2, L - 19, 2.2); if (o.fleet) fleetLogo(L, W); else cannaLeaf(-6, 0, 9, '#3FAE6A', -Math.PI / 2); ctx.restore(); } // Koffer: hell, Seitenstreifen in Wagenfarbe, Logo auf dem Dach
      // Lackeffekt und Folierung (auf die Karosserie beschnitten)
      const fin = T(6), wrap = T(5);
      if (fin >= 0 || wrap >= 0) {
        ctx.save(); bodyPath(); ctx.clip();
        if (fin === 0) { const g = ctx.createLinearGradient(-L / 2, -W / 2, L / 2, W / 2); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,255,255,.28)'); g.addColorStop(0.55, 'rgba(255,255,255,.05)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(-L / 2, -W / 2, L, W); ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let k = 0; k < 9; k++) if (Math.sin(gt * 3 + k * 2.1) > 0.6) ctx.fillRect(-L / 2 + ((k * 13.7) % L), -W / 2 + ((k * 7.3) % W), 0.8, 0.8); } // Metallic mit Glitzer
        else if (fin === 1) { ctx.fillStyle = 'rgba(20,22,26,.22)'; ctx.fillRect(-L / 2, -W / 2, L, W); } // Matt
        else if (fin === 2) { ctx.globalCompositeOperation = 'lighter'; const h0 = (gt * 40) % 360, g = ctx.createLinearGradient(-L / 2, 0, L / 2, 0); g.addColorStop(0, 'hsla(' + h0 + ',90%,60%,.22)'); g.addColorStop(0.5, 'hsla(' + ((h0 + 90) % 360) + ',90%,60%,.22)'); g.addColorStop(1, 'hsla(' + ((h0 + 180) % 360) + ',90%,60%,.22)'); ctx.fillStyle = g; ctx.fillRect(-L / 2, -W / 2, L, W); ctx.globalCompositeOperation = 'source-over'; } // Perlmutt
        else if (fin === 3) { const sh = ((gt * 0.4) % 1) * L * 1.6 - L * 0.8, g = ctx.createLinearGradient(-L / 2, -W / 2, L / 2, W / 2); g.addColorStop(0, 'rgba(235,240,246,.78)'); g.addColorStop(0.3, 'rgba(140,148,160,.7)'); g.addColorStop(0.55, 'rgba(250,252,255,.8)'); g.addColorStop(1, 'rgba(120,128,140,.7)'); ctx.fillStyle = g; ctx.fillRect(-L / 2, -W / 2, L, W); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.moveTo(sh - 2, -W / 2); ctx.lineTo(sh + 2, -W / 2); ctx.lineTo(sh - 4, W / 2); ctx.lineTo(sh - 8, W / 2); ctx.closePath(); ctx.fill(); } // Chrom
        if (wrap === 0) { for (const sy of [-1, 1]) { const g = ctx.createLinearGradient(L / 2, 0, -L * 0.1, 0); g.addColorStop(0, '#FFE14A'); g.addColorStop(0.5, '#FF8A1E'); g.addColorStop(1, '#D8261E'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(L / 2, sy * (W / 2)); for (let k = 0; k <= 6; k++) { const x = L / 2 - k * L * 0.09, a = k % 2 ? 0.15 : 0.42; ctx.lineTo(x, sy * (W / 2 - W * a)); } ctx.lineTo(L / 2 - 6 * L * 0.09 - 2, sy * (W / 2)); ctx.closePath(); ctx.fill(); } } // Flammen von vorn
        else if (wrap === 1) { ctx.fillStyle = 'rgba(16,18,22,.55)'; const s = 3; for (let x = -L / 2; x < L / 2; x += s) for (let y = -W / 2; y < W / 2; y += s) if (((x + L) / s + (y + W) / s | 0) % 2) ctx.fillRect(x, y, s, s); } // Karo
        else if (wrap === 2) { const cs = ['rgba(60,90,50,.75)', 'rgba(110,95,60,.7)', 'rgba(35,50,32,.75)']; for (let k = 0; k < 16; k++) { ctx.fillStyle = cs[k % 3]; ctx.beginPath(); ctx.ellipse(-L / 2 + ((k * 11.3) % L), -W / 2 + ((k * 6.7) % W), 3 + (k % 3), 2 + (k % 2), k, 0, TAU); ctx.fill(); } } // Tarnmuster
        else if (wrap === 3) { ctx.fillStyle = '#FFD84B'; for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(L * 0.42, sy * (W / 2 - 1)); ctx.lineTo(L * 0.1, sy * (W / 2 - 3.5)); ctx.lineTo(L * 0.06, sy * (W / 2 - 1.8)); ctx.lineTo(-L * 0.3, sy * (W / 2 - 4)); ctx.lineTo(-L * 0.02, sy * (W / 2 - 1)); ctx.lineTo(L * 0.02, sy * (W / 2 - 2.6)); ctx.closePath(); ctx.fill(); } } // Blitz an beiden Seiten
        else if (wrap === 4) { cannaLeaf(L * 0.22, W * 0.12, Math.min(W * 0.55, 10), 'rgba(63,174,106,.95)', -Math.PI / 2); cannaLeaf(-L * 0.32, -W * 0.28, 5, 'rgba(99,255,154,.8)', Math.PI / 2); cannaLeaf(-L * 0.32, W * 0.28, 5, 'rgba(99,255,154,.8)', Math.PI / 2); } // Hanfblatt
        else if (wrap === 5) { ctx.fillStyle = 'rgba(16,18,22,.85)'; for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(L * 0.4, sy * (W / 2 - 1)); ctx.quadraticCurveTo(L * 0.1, sy * (W / 2 - 6), -L * 0.15, sy * (W / 2 - 2)); ctx.quadraticCurveTo(-L * 0.25, sy * (W / 2 - 5), -L * 0.42, sy * (W / 2 - 1.5)); ctx.quadraticCurveTo(-L * 0.2, sy * (W / 2 - 3), L * 0.0, sy * (W / 2 - 0.5)); ctx.closePath(); ctx.fill(); } } // Tribal
        else if (wrap === 6) { for (let k = 0; k < 12; k++) { const x = -L / 2 + 2 + ((k * 9.7) % (L - 4)), y = -W / 2 + 2 + ((k * 5.3) % (W - 4)), r = 0.8 + (k % 3) * 0.5, tw2 = 0.6 + 0.4 * Math.sin(gt * 4 + k); ctx.fillStyle = k % 3 ? 'rgba(255,255,255,' + tw2.toFixed(2) + ')' : 'rgba(255,216,75,' + tw2.toFixed(2) + ')'; ctx.beginPath(); for (let q = 0; q < 8; q++) { const a = q * Math.PI / 4, rq = q % 2 ? r * 0.4 : r * 1.4; ctx.lineTo(x + Math.cos(a) * rq, y + Math.sin(a) * rq); } ctx.closePath(); ctx.fill(); } } // Sterne
        ctx.restore();
      }
      const stripes = () => { if (T(3) >= 0) { ctx.fillStyle = CAR_COLS[T(3)] || '#FFFFFF'; ctx.globalAlpha = 0.92; const x0 = id === 'truck' ? L / 2 - 16 : -L / 2 + 1, ln = id === 'truck' ? 15 : L - 2; ctx.fillRect(x0, -3.2, ln, 2); ctx.fillRect(x0, 1.2, ln, 2); ctx.globalAlpha = 1; } }; // Rennstreifen unter den Scheiben
      const edge = () => { bodyPath(); ctx.strokeStyle = dark; ctx.lineWidth = 1.1; ctx.stroke(); };
      const gl = (x, y, w, h, q) => { ctx.fillStyle = glass; rr(x, y, w, h, q); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.16)'; ctx.fillRect(x + w * 0.2, y + 0.6, Math.max(0.6, w * 0.25), h - 1.2); }; // Scheibe mit Lichtkante
      if (id === 'van') { // Transporter: kurze Haube, hohes Dach mit Sicken, Schiebetuer, geteilte Hecktueren
        edge(); stripes();
        ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(L / 2 - 8, -W / 2 + 1, 7, W - 2); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(L / 2 - 7.5, -1, 6, 2);
        gl(L / 2 - 13, -W / 2 + 1.8, 5.5, W - 3.6, 1.5);
        ctx.fillStyle = lite; rr(-L / 2 + 2, -W / 2 + 2.2, L - 16, W - 4.4, 2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.1)'; for (let x = -L / 2 + 5; x < L / 2 - 15; x += 5) ctx.fillRect(x, -W / 2 + 2.5, 1, W - 5);
        ctx.fillStyle = '#2A2E35'; rr(-8, -2.5, 5, 5, 1); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(-7.5, -2, 4, 1);
        ctx.fillStyle = dark; ctx.fillRect(-4, -W / 2 + 0.4, 14, 0.7); ctx.fillRect(-4, W / 2 - 1.1, 14, 0.7); ctx.fillRect(-L / 2 + 0.6, -0.35, 2.2, 0.7);
        ctx.fillStyle = '#1D2129'; ctx.fillRect(L / 2 - 1.2, -W / 2 + 1.5, 1.6, W - 3); ctx.fillRect(-L / 2 - 0.6, -W / 2 + 1.5, 1.4, W - 3);
      } else if (id === 'mini') { // Kleinwagen: rund, kontrastreiches Dach, runde Scheinwerfer, Chromgrill
        edge(); stripes();
        ctx.fillStyle = 'rgba(255,255,255,.14)'; ctx.beginPath(); ctx.ellipse(10, 0, 3.4, W / 2 - 3, 0, 0, TAU); ctx.fill(); // Motorhaube gewoelbt
        gl(2, -W / 2 + 2.5, 5, W - 5, 2); gl(-L / 2 + 2.6, -W / 2 + 3, 3.4, W - 6, 1.5);
        ctx.fillStyle = col === '#EEF2F7' ? '#1D2129' : 'rgba(255,255,255,.88)'; rr(-6.5, -W / 2 + 2.3, 8.5, W - 4.6, 3); ctx.fill(); // Dach
        ctx.fillStyle = glass; ctx.fillRect(-6, -W / 2 + 1.1, 7.5, 1); ctx.fillRect(-6, W / 2 - 2.1, 7.5, 1); // Seitenfenster
        ctx.fillStyle = '#C9D2DC'; ctx.fillRect(L / 2 - 1, -W / 2 + 4.5, 0.9, W - 9);
      } else if (id === 'muscle') {
        if (T(3) >= 0) stripes(); else { ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(-L / 2, -3, L, 2); ctx.fillRect(-L / 2, 1, L, 2); } // Rennstreifen (ab Werk weiss)
        ctx.fillStyle = glass; rr(-1, -W / 2 + 2.5, 6, W - 5, 2); ctx.fill(); rr(-L / 2 + 7, -W / 2 + 3, 4, W - 6, 2); ctx.fill();
        ctx.fillStyle = '#1D2129'; rr(9, -2.5, 6, 5, 1.5); ctx.fill(); // Lufthutze
      } else if (id === 'sport') { // Sportwagen: Keilform, zweifarbiges Dach, Haubenschlitze, seitliche Lufteinlaesse, Diffusor
        edge(); stripes();
        ctx.fillStyle = 'rgba(0,0,0,.35)'; for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-L * 0.1, sy * (W / 2 - 0.8)); ctx.lineTo(-L * 0.28, sy * (W / 2 - 3.2)); ctx.lineTo(-L * 0.3, sy * (W / 2 - 0.8)); ctx.closePath(); ctx.fill(); }
        ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(9, -3.5, 4, 0.9); ctx.fillRect(9, 2.6, 4, 0.9);
        ctx.fillStyle = glass; ctx.beginPath(); ctx.moveTo(-6, -W / 2 + 3.5); ctx.lineTo(4, -W / 2 + 4); ctx.quadraticCurveTo(8, 0, 4, W / 2 - 4); ctx.lineTo(-6, W / 2 - 3.5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#1D2129'; rr(-6, -W / 2 + 3.8, 6.5, W - 7.6, 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(1.6, -W / 2 + 5, 0.9, W - 10);
        ctx.fillStyle = '#1D2129'; ctx.fillRect(-L / 2 + 1, -W / 2 + 2, 2.5, W - 4); for (let k = -2; k <= 2; k++) ctx.fillRect(-L / 2 - 0.6, k * 2.4 - 0.3, 1.6, 0.6);
      } else if (id === 'super') { // Supersportwagen: Kanzel, Motorlamellen, Seitenkiemen, Frontsplitter, LED-Streifen
        edge(); stripes();
        ctx.fillStyle = '#1D2129'; ctx.beginPath(); ctx.moveTo(L / 2 + 0.5, -W / 4); ctx.quadraticCurveTo(L / 2 + 2.2, 0, L / 2 + 0.5, W / 4); ctx.lineTo(L / 2 - 0.8, 0); ctx.closePath(); ctx.fill(); // Splitter
        ctx.fillStyle = glass; ctx.beginPath(); ctx.ellipse(-1, 0, 8, W / 2 - 4.5, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.beginPath(); ctx.ellipse(1.5, -W / 4 + 1.5, 3.5, 1.2, -0.25, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.45)'; for (let k = 0; k < 5; k++) ctx.fillRect(-L / 2 + 6 + k * 2.2, -W / 2 + 5, 1, W - 10); // Motorlamellen
        ctx.fillStyle = '#1D2129'; ctx.fillRect(-L / 2 - 1, -W / 2 + 1, 4, W - 2); for (const sy of [-1, 1]) { ctx.beginPath(); ctx.moveTo(-L * 0.05, sy * (W / 2 - 0.5)); ctx.quadraticCurveTo(-L * 0.18, sy * (W / 2 - 4), -L * 0.3, sy * (W / 2 - 0.5)); ctx.closePath(); ctx.fill(); }
      } else if (id === 'pickup') { // Pickup: Kabine vorn, offene Pritsche mit Ladung
        edge();
        ctx.fillStyle = '#2B2F36'; rr(-L / 2 + 1.5, -W / 2 + 2, L / 2 - 4, W - 4, 1.5); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.06)'; for (let y = -W / 2 + 3.5; y < W / 2 - 2; y += 2.6) ctx.fillRect(-L / 2 + 2, y, L / 2 - 5, 0.8);
        ctx.fillStyle = '#3A3F47'; ctx.fillRect(-L * 0.3 - 3, -W / 2 + 2, 6, 2.2); ctx.fillRect(-L * 0.3 - 3, W / 2 - 4.2, 6, 2.2); // Radkaesten
        if (o.own && G) { const n = Math.min(8, totalBags()); for (let k = 0; k < n; k++) { const bx = -L / 2 + 4 + (k % 4) * 4.2, by = -3.5 + Math.floor(k / 4) * 5; ctx.fillStyle = k % 3 ? '#B98A52' : '#EEF2F7'; ctx.fillRect(bx, by, 3.4, 3.6); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(bx, by + 1.6, 3.4, 0.6); } } // Ladung
        ctx.save(); ctx.beginPath(); ctx.rect(-3, -W / 2, L / 2 + 3, W); ctx.clip(); stripes(); ctx.restore();
        ctx.fillStyle = lite; rr(-2.5, -W / 2 + 2.2, 8, W - 4.4, 2); ctx.fill(); gl(5.5, -W / 2 + 2.2, 4.5, W - 4.4, 1.5); gl(-3.4, -W / 2 + 3, 1.3, W - 6, 0.5);
        ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(12, -W / 2 + 4, 8, 0.8); ctx.fillRect(12, W / 2 - 4.8, 8, 0.8);
        ctx.fillStyle = '#1D2129'; ctx.fillRect(L / 2 - 1.2, -W / 2 + 1.5, 1.6, W - 3); ctx.fillStyle = dark; ctx.fillRect(-L / 2, -W / 2 + 1, 1.4, W - 2);
      } else if (id === 'suv') { // Gelaendewagen: kantig, Dachreling, Reserverad, Rammschutz, Kotfluegelverbreiterungen
        ctx.fillStyle = '#23272E'; for (const wx of [L * 0.3, -L * 0.3]) { ctx.fillRect(wx - 6, -W / 2 - 1.2, 12, 1.8); ctx.fillRect(wx - 6, W / 2 - 0.6, 12, 1.8); }
        edge(); stripes();
        ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(11, -W / 2 + 3, 0.8, W - 6); ctx.fillRect(15, -W / 2 + 3, 0.8, W - 6);
        gl(6, -W / 2 + 2, 4.5, W - 4, 1.5);
        ctx.fillStyle = lite; rr(-L / 2 + 4, -W / 2 + 2, L / 2 + 6 - 4, W - 4, 2); ctx.fill(); gl(-L / 2 + 1.6, -W / 2 + 3, 2.2, W - 6, 0.8);
        ctx.fillStyle = '#2A2E35'; ctx.fillRect(-L / 2 + 5, -W / 2 + 3, L / 2 + 0, 0.9); ctx.fillRect(-L / 2 + 5, W / 2 - 3.9, L / 2 + 0, 0.9); // Dachreling
        ctx.fillStyle = '#1D2129'; ctx.beginPath(); ctx.arc(-L / 2 - 1.2, 0, 3.6, 0, TAU); ctx.fill(); ctx.fillStyle = rimC; ctx.beginPath(); ctx.arc(-L / 2 - 1.2, 0, 1.6, 0, TAU); ctx.fill(); // Reserverad
        ctx.fillStyle = '#2A2E35'; ctx.fillRect(L / 2 + 0.3, -W / 2 + 2.5, 1.6, W - 5); for (let k = -1; k <= 1; k++) ctx.fillRect(L / 2 - 0.5, k * 4 - 0.4, 2.6, 0.8); // Rammschutz
      } else if (id === 'lowrider') { // Lowrider: lang, offen, Chromleisten, Ledersitze, Weisswandreifen
        edge(); stripes();
        ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(6, -0.6, L / 2 - 8, 1.2);
        ctx.fillStyle = '#5A3324'; rr(-11, -W / 2 + 2.2, 13, W - 4.4, 2); ctx.fill(); // offener Innenraum
        ctx.fillStyle = '#8A4A30'; rr(-10, -W / 2 + 2.8, 4, W - 5.6, 1.2); ctx.fill(); rr(-3.5, -W / 2 + 2.8, 4, W - 5.6, 1.2); ctx.fill();
        ctx.fillStyle = glass; ctx.fillRect(2.5, -W / 2 + 2.5, 1.4, W - 5); ctx.fillStyle = '#D6DCE6'; ctx.fillRect(2.2, -W / 2 + 2.2, 0.6, W - 4.4);
        ctx.fillStyle = '#D6DCE6'; ctx.fillRect(-L / 2 + 1, -W / 2 + 1, L - 2, 0.7); ctx.fillRect(-L / 2 + 1, W / 2 - 1.7, L - 2, 0.7); ctx.fillRect(L / 2 - 1.3, -W / 2 + 2, 1.3, W - 4); ctx.fillRect(-L / 2, -W / 2 + 2, 1.1, W - 4); // Chrom
        ctx.fillStyle = '#E8B84A'; ctx.beginPath(); ctx.arc(L / 2 - 3, 0, 0.9, 0, TAU); ctx.fill(); // Kuehlerfigur
      } else if (id === 'truck') { // Lastwagen: Kabine mit Dachspoiler und Positionslampen, Koffer hinten
        ctx.save(); bodyPath(); ctx.strokeStyle = '#9AA6B3'; ctx.lineWidth = 0.9; ctx.stroke(); ctx.restore(); stripes();
        gl(L / 2 - 5.5, -W / 2 + 2.5, 3.6, W - 5, 1.2);
        ctx.fillStyle = lite; rr(L / 2 - 15, -W / 2 + 2.5, 9, W - 5, 2); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(L / 2 - 15, -W / 2 + 2.5, 3, W - 5); // Dachspoiler
        ctx.fillStyle = '#FFB547'; for (let k = -2; k <= 2; k++) ctx.fillRect(L / 2 - 6.8, k * 2.6 - 0.5, 0.9, 1);
        ctx.fillStyle = '#C9D2DC'; ctx.fillRect(L / 2 - 18.5, -W / 2 + 1, 1.6, 2.2); ctx.fillRect(L / 2 - 18.5, W / 2 - 3.2, 1.6, 2.2); // Auspuffrohre
        ctx.fillStyle = '#1D2129'; ctx.fillRect(L / 2 - 1, -W / 2 + 2, 1.6, W - 4); ctx.fillRect(-L / 2 - 0.8, -W / 2 + 1, 1.2, W - 2);
      }
      if (id !== 'truck' && id !== 'lowrider') { ctx.fillStyle = (fin === 1) ? 'rgba(255,255,255,.06)' : hi; ctx.fillRect(-L / 2 + 4, -W / 2 + 1.2, L * 0.45, 1.5); }
      // Dachaufbau
      const rf = T(10), RF = CAR_ROOF[id];
      if (rf >= 0 && RF) {
        const [rx, rl] = RF, rw = W * 0.5;
        if (rf === 0) { ctx.fillStyle = '#1D2129'; rr(rx - rl * 0.45, -rw / 2, rl * 0.9, rw, rw / 2.2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(rx - rl * 0.35, -rw / 2 + 0.8, rl * 0.7, 0.9); } // Dachbox
        else if (rf === 1) { ctx.fillStyle = '#1D2129'; ctx.fillRect(rx + rl * 0.35, -W / 2 + 2, 1.8, W - 4); ctx.fillStyle = dk ? '#FFFFFF' : '#E8ECF2'; for (let k = 0; k < 4; k++) ctx.fillRect(rx + rl * 0.35 + 0.4, -W / 2 + 3 + k * (W - 6) / 4, 1, (W - 6) / 4 - 0.8); } // Lichtleiste
        else if (rf === 2) { ctx.fillStyle = '#2A2E35'; ctx.fillRect(rx - rl / 2, -rw / 2 - 1, rl, 0.9); ctx.fillRect(rx - rl / 2, rw / 2, rl, 0.9); for (let k = 0; k < 3; k++) ctx.fillRect(rx - rl / 2 + k * rl / 2 - 0.4, -rw / 2 - 1, 0.9, rw + 2); ctx.fillStyle = '#8A5A3A'; rr(rx - rl * 0.25, -rw / 2 + 0.5, rl * 0.5, rw - 1, 1); ctx.fill(); ctx.fillStyle = '#5A3A22'; ctx.fillRect(rx - 0.4, -rw / 2 + 0.5, 0.8, rw - 1); } // Gepaecktraeger mit Koffer
        else if (rf === 3) { ctx.fillStyle = '#F2C81E'; rr(rx - 2, -3.6, 4, 7.2, 1); ctx.fill(); ctx.fillStyle = '#1D2129'; ctx.font = '800 2.4px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.save(); ctx.translate(rx, 0); ctx.rotate(Math.PI / 2); ctx.fillText('TAXI', 0, 0.2); ctx.restore(); ctx.textBaseline = 'alphabetic'; } // Taxischild
        else if (rf === 4) { const wv = Math.sin(gt * 6 + px * 0.01); ctx.fillStyle = '#C9D2DC'; ctx.beginPath(); ctx.arc(rx - rl * 0.3, 0, 0.9, 0, TAU); ctx.fill(); ctx.fillStyle = '#2E9A4E'; ctx.beginPath(); ctx.moveTo(rx - rl * 0.3, -0.6); ctx.quadraticCurveTo(rx - rl * 0.3 - 4, -0.6 + wv * 1.5, rx - rl * 0.3 - 9, -1 + wv); ctx.lineTo(rx - rl * 0.3 - 9, 4 + wv); ctx.quadraticCurveTo(rx - rl * 0.3 - 4, 4.4 + wv * 1.5, rx - rl * 0.3, 4.4); ctx.closePath(); ctx.fill(); cannaLeaf(rx - rl * 0.3 - 4.6, 1.8 + wv * 0.8, 3.4, '#9AF2B4', -Math.PI / 2); } // Hanf-Fahne
      }
      if (T(2) > 0 && id !== 'truck') { // Heckspoiler: Stuetzen, schwarzer Fluegel, Endplatten in Wagenfarbe
        const bg = T(2) > 1, x0 = -L / 2 - (bg ? 4.5 : 2.8), wd = bg ? 4.2 : 3, hw = W / 2 + (bg ? 2 : 0.5);
        ctx.fillStyle = '#2A2E35'; ctx.fillRect(x0 + wd - 0.5, -W / 4 - 0.8, 4, 1.6); ctx.fillRect(x0 + wd - 0.5, W / 4 - 0.8, 4, 1.6);
        ctx.fillStyle = '#1D2129'; rr(x0, -hw, wd, hw * 2, 1.2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x0 + 0.4, -hw + 1, 0.9, hw * 2 - 2);
        ctx.fillStyle = col; ctx.fillRect(x0 - 0.4, -hw - 0.6, wd + 0.8, 1.8); ctx.fillRect(x0 - 0.4, hw - 1.2, wd + 0.8, 1.8);
      }
      { const mx0 = { van: L / 2 - 13, mini: 1, muscle: -2, sport: -7, super: -10, pickup: 5, suv: 5.5, lowrider: 1.5, truck: L / 2 - 5.5 }[id] ?? 0, bm = id === 'truck' || id === 'van'; ctx.fillStyle = bm ? '#1D2129' : col; ctx.fillRect(mx0, -W / 2 - (bm ? 2.6 : 1.8), bm ? 1.8 : 2.6, bm ? 2.8 : 2); ctx.fillRect(mx0, W / 2 - 0.2, bm ? 1.8 : 2.6, bm ? 2.8 : 2); if (!bm) { ctx.fillStyle = dark; ctx.fillRect(mx0, -W / 2 - 1.8, 0.8, 2); ctx.fillRect(mx0, W / 2 - 0.2, 0.8, 2); } } // Seitenspiegel
      if (id === 'muscle') { ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(1, -W / 2 + 4); ctx.lineTo(3, -W / 2 + 7); ctx.stroke(); } // Spiegelung in der Scheibe
      // Fahrer
      // v150: keine Koepfe mehr im Auto (eigenes Auto und Verkehr)
      // Lichter
      ctx.fillStyle = hlCol;
      if (id === 'mini' || id === 'suv' || id === 'lowrider') { for (const sy of [-1, 1]) { ctx.beginPath(); ctx.arc(L / 2 - 1.6, sy * (W / 2 - 3.4), 1.6, 0, TAU); ctx.fill(); } }
      else if (id === 'sport' || id === 'super') { for (const sy of [-1, 1]) { ctx.save(); ctx.translate(L / 2 - (id === 'super' ? 5 : 4), sy * (W / 2 - 3)); ctx.rotate(sy * 0.5); ctx.fillRect(-2.2, -0.6, 4.4, 1.2); ctx.restore(); } }
      else { ctx.fillRect(L / 2 - 2.5, -W / 2 + 2.5, 2.5, 3.5); ctx.fillRect(L / 2 - 2.5, W / 2 - 6, 2.5, 3.5); }
      ctx.fillStyle = '#E04848'; if (id === 'super' || id === 'sport') { ctx.fillRect(-L / 2 + (id === 'super' ? 3 : 2), -W / 2 + 2, 0.9, W - 4); } else { ctx.fillRect(-L / 2, -W / 2 + 2.5, 2, 3); ctx.fillRect(-L / 2, W / 2 - 5.5, 2, 3); }
      if (o.plate) { ctx.fillStyle = '#F4F6FA'; ctx.fillRect(-L / 2 - (id === 'suv' ? 4.9 : 0.9), -3.2, 0.9, 6.4); ctx.fillStyle = '#2F6FD6'; ctx.fillRect(-L / 2 - (id === 'suv' ? 4.9 : 0.9), -3.2, 0.9, 1); } // Kennzeichen
    };
    if ((nod || !o.own ? 0 : (player.steer || 0)) !== 0 || finO === 2 || finO === 3 || wrapO === 6 || ctx.globalAlpha < 0.999 || o.live) body();
    else { const P = 12; sprDraw('car|' + id + '|' + ci + '|' + tu.join(',') + '|' + (dk ? 1 : 0) + (o.fleet ? 'f' : ''), -L / 2 - P, -W / 2 - P, L + 2 * P, W + 2 * P, body); }
    // Auspuff-Flammen: beim Vollgas (eigenes Auto), sonst ab und zu
    const ex = T(9); if (ex >= 0 && !nod) { const on = o.own ? (aHeld && player.cs > v.spd * 0.5) || (o.pv && Math.sin(gt * 2.2) > 0.3) : Math.sin(gt * 2.6 + px * 0.05) > 0.75; if (on) { const ec = TUNE.exhaust.cols[ex] || '#FF8A3A', fl = 3 + Math.random() * 3; ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const ports = id === 'truck' ? [[L / 2 - 17.7, -W / 2 + 2.1, -1.57], [L / 2 - 17.7, W / 2 - 2.1, 1.57]] : [[-L / 2 - 0.5, -W * 0.25, Math.PI], [-L / 2 - 0.5, W * 0.25, Math.PI]];
      for (const [ex0, ey0, ea] of ports) { ctx.save(); ctx.translate(ex0, ey0); ctx.rotate(ea); ctx.fillStyle = ec; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.moveTo(0, -1.2); ctx.quadraticCurveTo(fl * 0.7, -1.6, fl, 0); ctx.quadraticCurveTo(fl * 0.7, 1.6, 0, 1.2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.ellipse(fl * 0.25, 0, fl * 0.25, 0.6, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      ctx.restore(); } }
    if (dk) { const rgb = carRgb(T(8) >= 0 ? hlCol : '#FFF0B4'); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(L / 2 + 14, 0, 2, L / 2 + 14, 0, 30); g.addColorStop(0, 'rgba(' + rgb + ',.35)'); g.addColorStop(1, 'rgba(' + rgb + ',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(L / 2 + 16, 0, 26, 14, 0, 0, TAU); ctx.fill(); if (rf === 1 && RF) { const g2 = ctx.createRadialGradient(L / 2 + 22, 0, 2, L / 2 + 22, 0, 40); g2.addColorStop(0, 'rgba(255,255,255,.3)'); g2.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g2; ctx.beginPath(); ctx.ellipse(L / 2 + 24, 0, 36, 20, 0, 0, TAU); ctx.fill(); } ctx.globalCompositeOperation = 'source-over'; }
    ctx.restore();
  }
  function drawRide(px, py, ang, id, look, spin, ci, tn) {
    if (VEH_BY[id] && VEH_BY[id].car) { const own = ci === undefined; drawCar(px, py, ang, id, own ? carColI(id) : ci, look, false, tn || (own ? tuneArr(id) : null), own ? { own: true, plate: tuneOf(id).plate, pv: pvMode } : null); return; }
    const L = look || G.look;
    drawVehicle(px, py, ang, id, spin || 0, L.size);
    drawFigure(px, py - (id === 'scooter' ? 2.6 : 4.6) * L.size, ang, 0, look);
    drawVehicle(px, py, ang, id, spin || 0, L.size, 1);
  }
  // ---------- Schlaeger ----------
  function drawStars(x, y, t) {
    ctx.fillStyle = '#FFD24A';
    for (let k = 0; k < 3; k++) { const a = t * 5 + k * 2.09, px = x + Math.cos(a) * 9, py = y + Math.sin(a) * 3.2; ctx.beginPath(); ctx.moveTo(px, py - 2.6); ctx.lineTo(px + 1.1, py - 0.8); ctx.lineTo(px + 2.6, py); ctx.lineTo(px + 1.1, py + 0.8); ctx.lineTo(px, py + 2.6); ctx.lineTo(px - 1.1, py + 0.8); ctx.lineTo(px - 2.6, py); ctx.lineTo(px - 1.1, py - 0.8); ctx.closePath(); ctx.fill(); }
  }
  // sw: -1 = in Ruhe auf der Schulter, 0..1 = Schwung. dist: wie weit Geschoss oder Ring sichtbar fliegt (sonst Reichweite der Waffe)
  // v77: Waffe schraeg auf dem Ruecken, solange sie nicht benutzt wird; nach dem Benutzen 3 s in der Hand
  const WPN_HOLD = 3;
  const figUp = a => { const cx = Math.cos(a), sy = Math.sin(a); return Math.abs(sy) > Math.abs(cx) * 1.05 && sy < 0; };
  const weaponInHand = () => !!player.sw || gt - (player.batUseT === undefined ? -99 : player.batUseT) < WPN_HOLD;
  function drawBatBack(x, y, id, ang) {
    const sd = Math.cos(ang) < -0.2 ? 1 : Math.cos(ang) > 0.2 ? -1 : 1, up = figUp(ang);
    const b = batDef(id); if (!b) return;
    if (b.shape === 'shield') { const cy = y - 3; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.arc(x + 1, cy + 1.5, 8.5, 0, TAU); ctx.fill(); ctx.fillStyle = b.c2; ctx.beginPath(); ctx.arc(x, cy, 8.5, 0, TAU); ctx.fill(); ctx.fillStyle = b.c1; ctx.beginPath(); ctx.arc(x, cy, 6.8, 0, TAU); ctx.fill(); ctx.fillStyle = '#C9D2DC'; ctx.beginPath(); ctx.arc(x, cy, 2.2, 0, TAU); ctx.fill(); return; } // Schild mittig auf dem Ruecken
    if (GADGETS.includes(b.shape)) return; // Spezialwaffen (Schocker, Pistole, Zwille, Netz, Granate) stecken weg, bis du sie benutzt
    // Griff an der Huefte, Spitze ueber der gegenueberliegenden Schulter: schraeg ueber den Ruecken
    const cx = Math.cos(ang), side = Math.abs(cx) > Math.abs(Math.sin(ang)) * 1.05, f = cx > 0 ? 1 : -1; // seitlich: Kopf der Waffe zeigt nach hinten oben
    const s = 0.72, gx = side ? x + f * 3 : x + sd * 5, gy = y + 3, a = side ? Math.atan2(-15, -f * 7) : Math.atan2(-15, -sd * 10), ux = Math.cos(a), uy = Math.sin(a);
    ctx.save(); ctx.translate(gx - ux * 6 * s, gy - uy * 6 * s); ctx.scale(s, s);
    drawBat(0, 0, a - 2.25, -1, id, 18);
    ctx.restore();
  }
  function drawBat(x, y, ang, sw, id, dist) {
    const b = batDef(id); if (!b) return;
    if (GADGETS.includes(b.shape)) { drawGadget(b, x, y, ang, sw, dist || b.reach); return; }
    const e = sw < 0 ? 0 : sw * sw * (3 - 2 * sw), a = sw < 0 ? ang + 2.25 : ang - 1.5 + 3.0 * e, L = sw < 0 ? 24 : 18 + b.reach * 0.32, sh = b.shape || 'bat';
    const ux = Math.cos(a), uy = Math.sin(a), hx = x + ux * 6, hy = y + uy * 6, tx = x + ux * (6 + L), ty = y + uy * (6 + L), mx = hx + (tx - hx) * 0.5, my = hy + (ty - hy) * 0.5;
    ctx.save(); ctx.lineCap = 'round';
    if (sw >= 0 && sw > 0.12) { // Schwung-Spur
      ctx.globalAlpha = 0.45 * (1 - sw * 0.4); ctx.strokeStyle = b.glow || '#FFFFFF'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, 6 + L, ang - 1.5 + 3.0 * Math.max(0, e - 0.4), a); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (b.glow) { ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = b.glow; ctx.globalAlpha = 0.22 + 0.08 * Math.sin(gt * 4); ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(tx, ty); ctx.stroke(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; }
    // v145: Waffen neu gezeichnet, im eigenen Raster entlang der Waffe (x = Laenge, y = Breite)
    const Lb = Math.hypot(tx - hx, ty - hy); ctx.translate(hx, hy); ctx.rotate(a);
    const cyl = (w, c, k) => { const g = ctx.createLinearGradient(0, -w, 0, w); g.addColorStop(0, hexShade(c, 1.25 * (k || 1))); g.addColorStop(0.35, c); g.addColorStop(1, hexShade(c, 0.6)); return g; };
    if (sh === 'pan') {
      const pc = Lb - 3, R = 7.6; ctx.fillStyle = cyl(1.6, b.c2); rr(0, -1.6, pc - R + 1, 3.2, 1.4); ctx.fill(); ctx.fillStyle = '#2A1C10'; ctx.beginPath(); ctx.arc(1.8, 0, 0.7, 0, TAU); ctx.fill(); ctx.fillStyle = '#9AA3AD'; rr(pc - R - 2, -1.8, 3.4, 3.6, 0.8); ctx.fill(); ctx.fillStyle = '#C9D2DC'; ctx.beginPath(); ctx.arc(pc - R - 0.6, -0.9, 0.5, 0, TAU); ctx.arc(pc - R - 0.6, 0.9, 0.5, 0, TAU); ctx.fill();
      const g = ctx.createRadialGradient(pc - 2, -2, 1, pc, 0, R + 1); g.addColorStop(0, '#9AA3AD'); g.addColorStop(1, '#4A5260'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(pc, 0, R + 1.2, 0, TAU); ctx.fill();
      const g2 = ctx.createRadialGradient(pc + 1.4, 1.4, 0.5, pc, 0, R); g2.addColorStop(0, hexShade(b.c1, 1.2)); g2.addColorStop(1, hexShade(b.c1, 0.7)); ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(pc, 0, R, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(pc, 0, R * 0.6, 0, TAU); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(pc, 0, R - 1.2, Math.PI * 1.1, Math.PI * 1.55); ctx.stroke();
    } else if (sh === 'hammer') {
      const hl = Lb - 1; ctx.fillStyle = cyl(1.5, '#8A5A32'); rr(0, -1.5, hl, 3, 1.4); ctx.fill(); ctx.fillStyle = b.c2; for (let k = 0; k < 4; k++) { ctx.fillRect(1 + k * 1.6, -1.6, 0.8, 3.2); }
      ctx.save(); ctx.translate(hl, 0); const sq = sw >= 0 && sw > 0.75 ? 0.75 : 1; ctx.scale(1, 1); const HW = 7.4 * sq;
      ctx.fillStyle = cyl(4.6, b.c1); rr(-4.6, -HW, 9.2, HW * 2, 2.4); ctx.fill(); ctx.fillStyle = hexShade(b.c1, 0.75); for (let k = -2; k <= 2; k++) ctx.fillRect(-4.6, k * HW * 0.36 - 0.4, 9.2, 0.8);
      ctx.fillStyle = cyl(4.8, b.c2); rr(-4.8, -HW - 2.2, 9.6, 2.6, 1.2); ctx.fill(); rr(-4.8, HW - 0.4, 9.6, 2.6, 1.2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.fillRect(-3.6, -HW + 0.6, 1.2, HW * 2 - 1.2); ctx.restore();
    } else if (sh === 'stick') {
      const s1 = Lb * 0.36, s2 = Lb * 0.7; ctx.fillStyle = cyl(1.9, b.c2); rr(0, -1.9, s1, 3.8, 1.6); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 0.4; for (let x2 = 1.4; x2 < s1 - 1; x2 += 1.4) { ctx.beginPath(); ctx.moveTo(x2, -1.9); ctx.lineTo(x2 + 0.8, 1.9); ctx.stroke(); }
      ctx.fillStyle = cyl(1.4, b.c1); ctx.fillRect(s1, -1.4, s2 - s1, 2.8); ctx.fillStyle = cyl(1, b.c1); ctx.fillRect(s2, -1, Lb - s2, 2); ctx.fillStyle = '#5A626E'; ctx.fillRect(s1 - 0.4, -1.7, 1.2, 3.4); ctx.fillRect(s2 - 0.4, -1.3, 1, 2.6);
      ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(s1 + 1, -1, s2 - s1 - 2, 0.4); ctx.fillRect(s2 + 1, -0.7, Lb - s2 - 2, 0.3); const g = ctx.createRadialGradient(Lb - 0.6, -0.6, 0.2, Lb, 0, 2.4); g.addColorStop(0, '#FF9A9A'); g.addColorStop(1, '#B02A2A'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(Lb, 0, 2.2, 0, TAU); ctx.fill();
    } else { // Schlaeger: duenner Griff mit Griffband, dicker werdender Kopf
      const gE = Lb * 0.36, fl = Lb * 0.72, wH = 1.15, wB = 2.9;
      const body = () => { ctx.beginPath(); ctx.moveTo(0, -wH); ctx.lineTo(gE, -wH); ctx.quadraticCurveTo(fl * 0.85, -wH, fl, -wB); ctx.lineTo(Lb - wB, -wB); ctx.arc(Lb - wB, 0, wB, -Math.PI / 2, Math.PI / 2); ctx.lineTo(fl, wB); ctx.quadraticCurveTo(fl * 0.85, wH, gE, wH); ctx.lineTo(0, wH); ctx.closePath(); };
      ctx.fillStyle = cyl(wB, b.c1); body(); ctx.fill();
      ctx.save(); body(); ctx.clip();
      if (b.id === 'holz') { ctx.strokeStyle = 'rgba(90,50,20,.35)'; ctx.lineWidth = 0.35; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(gE, k * 0.5); ctx.quadraticCurveTo(fl, k * 1.1 + 0.3, Lb, k * 1.2); ctx.stroke(); } ctx.fillStyle = '#5A3418'; ctx.font = '900 2.4px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('KG', fl + 3, 0.2); ctx.textBaseline = 'alphabetic'; }
      else if (b.id === 'alu') { ctx.fillStyle = '#2F6FD6'; ctx.fillRect(fl - 1, -wB, 1.2, wB * 2); ctx.fillRect(fl + 1, -wB, 0.6, wB * 2); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(gE, -wB * 0.55, Lb - gE, 0.6); }
      else if (b.id === 'neon') { ctx.globalCompositeOperation = 'lighter'; const p = (gt * 1.6) % 1; ctx.fillStyle = 'rgba(200,255,240,.55)'; ctx.fillRect(gE + (Lb - gE) * p - 1.5, -wB, 3, wB * 2); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(gE, -0.9, Lb - gE, 0.5); }
      else if (b.id === 'gold') { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(gE, -wB * 0.5, Lb - gE, 0.6); const p = (gt * 0.8) % 1.6; if (p < 1) { ctx.fillStyle = 'rgba(255,250,220,.75)'; ctx.beginPath(); ctx.moveTo(gE + (Lb - gE) * p, -wB); ctx.lineTo(gE + (Lb - gE) * p + 1.4, -wB); ctx.lineTo(gE + (Lb - gE) * p - 0.6, wB); ctx.lineTo(gE + (Lb - gE) * p - 2, wB); ctx.fill(); } }
      else { ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(gE, -wB * 0.55, Lb - gE, 0.6); }
      ctx.restore();
      ctx.fillStyle = b.c2; ctx.fillRect(0.6, -wH - 0.1, gE - 0.6, wH * 2 + 0.2); ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 0.35; for (let x2 = 1; x2 < gE; x2 += 1.2) { ctx.beginPath(); ctx.moveTo(x2, -wH); ctx.lineTo(x2 + 0.9, wH); ctx.stroke(); }
      if (b.id === 'gold' && Math.sin(gt * 3) > 0.85) { ctx.fillStyle = '#FFFFFF'; ctx.fillRect(Lb - 4, -wB - 1.6, 0.4, 2.4); ctx.fillRect(Lb - 5.0, -wB - 0.6, 2.4, 0.4); }
    }
    ctx.fillStyle = b.c2; ctx.beginPath(); ctx.arc(0, 0, 2.1, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(-0.5, -0.6, 0.7, 0, TAU); ctx.fill();
    ctx.restore();
  }
  // Schild, Schocker, Wasserpistole, Zwille, Netzwerfer, Blendgranate. sw -1 = in Ruhe, 0..1 = Einsatz; D = Flugweite des Effekts
  function drawGadget(b, x, y, ang, sw, D) {
    const sh = b.shape, fire = sw >= 0, e = fire ? sw : 0, ux = Math.cos(ang), uy = Math.sin(ang), px = -uy, py = ux;
    ctx.save(); ctx.lineCap = 'round';
    const loc = (ox, oy, an, fn) => { ctx.save(); ctx.translate(ox, oy); ctx.rotate(an); fn(); ctx.restore(); }, cyl = (w, c) => { const g = ctx.createLinearGradient(0, -w, 0, w); g.addColorStop(0, hexShade(c, 1.35)); g.addColorStop(0.4, c); g.addColorStop(1, hexShade(c, 0.6)); return g; }; // v146
    if (sh === 'shield') {
      const a = fire ? ang : ang + 0.75, off = 11 + (fire ? Math.sin(e * Math.PI) * 10 : 0);
      ctx.translate(x + Math.cos(a) * off, y + Math.sin(a) * off); ctx.rotate(a);
      ctx.fillStyle = '#9AA3AD'; rr(-4.8, -11.4, 9.6, 22.8, 4.2); ctx.fill(); ctx.fillStyle = b.c2; rr(-4.2, -10.8, 8.4, 21.6, 3.8); ctx.fill(); const gs = ctx.createLinearGradient(-3, 0, 3, 0); gs.addColorStop(0, hexShade(b.c1, 1.3)); gs.addColorStop(1, hexShade(b.c1, 0.75)); ctx.fillStyle = gs; rr(-3, -9.4, 6, 18.8, 3); ctx.fill(); /* v145 */
      ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-2.2, -8, 1.2, 13); ctx.fillStyle = '#C9D2DC'; for (const yy of [-9, -3, 3, 9]) { ctx.beginPath(); ctx.arc(-3.6, yy, 0.55, 0, TAU); ctx.arc(3.6, yy, 0.55, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#C9D2DC'; ctx.beginPath(); ctx.arc(0.8, 0, 2.6, 0, TAU); ctx.fill(); ctx.fillStyle = b.c2; ctx.beginPath(); ctx.arc(0.8, 0, 1.8, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(0.2, -0.6, 0.6, 0, TAU); ctx.fill();
      if (fire && e > 0.15 && e < 0.85) { ctx.strokeStyle = 'rgba(255,255,255,' + (0.7 * (1 - e)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(6, 0, 8 + e * 10, -0.9, 0.9); ctx.stroke(); }
    } else if (sh === 'zap') {
      const a = fire ? ang : ang + 0.5, cx = Math.cos(a), cy = Math.sin(a), qx = -cy, qy = cx, hx = x + cx * 6, hy = y + cy * 6, tx = x + cx * 21, ty = y + cy * 21;
      loc(hx, hy, a, () => { ctx.fillStyle = cyl(2.6, '#2A2D38'); rr(0, -2.6, 13, 5.2, 1.8); ctx.fill(); ctx.fillStyle = '#14161C'; for (let k = 0; k < 4; k++) ctx.fillRect(1 + k * 1.5, -2.6, 0.7, 5.2); ctx.fillStyle = '#F2C14E'; ctx.fillRect(7.6, -2.6, 1.2, 5.2); ctx.fillStyle = '#14161C'; ctx.fillRect(8, -2.6, 0.4, 5.2);
        ctx.fillStyle = Math.sin(gt * 4) > 0 ? '#4BC8FF' : '#1E5A8A'; ctx.beginPath(); ctx.arc(10.6, -1.2, 0.8, 0, TAU); ctx.fill(); ctx.fillStyle = cyl(3, '#7A8494'); rr(12.4, -3, 3, 6, 1); ctx.fill();
        ctx.fillStyle = cyl(0.8, '#C9D2DC'); ctx.fillRect(15, -3, 5, 1.4); ctx.fillRect(15, 1.6, 5, 1.4); ctx.fillStyle = '#E8ECF2'; ctx.fillRect(19.4, -3, 0.8, 1.4); ctx.fillRect(19.4, 1.6, 0.8, 1.4); });
      if (fire) {
        const len = Math.max(14, D - 20); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = b.glow; ctx.globalAlpha = 0.9 - e * 0.5; ctx.lineWidth = 2.2;
        ctx.beginPath(); ctx.moveTo(tx + cx * 5, ty + cy * 5); for (let k = 1; k <= 6; k++) { const j = Math.sin(gt * 60 + k * 7.3) * 4.5; ctx.lineTo(tx + cx * (5 + len * k / 6) + qx * j, ty + cy * (5 + len * k / 6) + qy * j); } ctx.stroke();
        ctx.lineWidth = 6; ctx.globalAlpha = 0.2; ctx.beginPath(); ctx.moveTo(tx + cx * 5, ty + cy * 5); ctx.lineTo(tx + cx * (5 + len), ty + cy * (5 + len)); ctx.stroke(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      } else if (Math.sin(gt * 31) > 0.6) { ctx.fillStyle = b.glow; ctx.beginPath(); ctx.arc(tx + cx * 6, ty + cy * 6, 1.8, 0, TAU); ctx.fill(); }
    } else if (sh === 'water') {
      loc(x, y, ang, () => { ctx.fillStyle = cyl(2, b.c2); rr(8, 0.6, 3.2, 6.4, 1.2); ctx.fill(); ctx.strokeStyle = '#1E3A5A'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(11.6, 2.4, 1.4, -1.2, 1.6); ctx.stroke();
        ctx.fillStyle = cyl(2.6, b.c1); rr(6, -2.4, 11, 4.8, 2); ctx.fill(); ctx.fillStyle = '#FF8A3A'; rr(16, -1.6, 2.6, 3.2, 1); ctx.fill(); ctx.fillStyle = '#FFE27A'; ctx.fillRect(9, -2.4, 0.9, 4.8); ctx.fillRect(11, -2.4, 0.9, 4.8);
        ctx.fillStyle = 'rgba(200,235,255,.6)'; ctx.beginPath(); ctx.arc(10.6, -4, 3, 0, TAU); ctx.fill(); ctx.save(); ctx.beginPath(); ctx.arc(10.6, -4, 2.7, 0, TAU); ctx.clip(); ctx.fillStyle = 'rgba(70,170,240,.85)'; ctx.fillRect(7, -4 + Math.sin(gt * 3) * 0.5, 8, 4); ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(10.6, -4, 3, 0, TAU); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(9.6, -5, 0.7, 0, TAU); ctx.fill(); });
      if (fire) {
        const reach = Math.max(10, D - 18); ctx.strokeStyle = 'rgba(120,200,255,' + (0.45 * (1 - e * 0.5)) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + ux * 18, y + uy * 18); ctx.lineTo(x + ux * (18 + reach * e), y + uy * (18 + reach * e)); ctx.stroke();
        for (let k = 0; k < 5; k++) { const f = e - k * 0.09; if (f <= 0) continue; ctx.fillStyle = 'rgba(150,215,255,' + (0.9 - f * 0.4) + ')'; ctx.beginPath(); ctx.arc(x + ux * (18 + reach * f) + px * Math.sin(k * 3 + gt * 30), y + uy * (18 + reach * f) + py * Math.sin(k * 3 + gt * 30), 2.4 - k * 0.25, 0, TAU); ctx.fill(); }
      }
    } else if (sh === 'sling') {
      const bx = x + ux * 6, by = y + uy * 6, fx = x + ux * 13, fy = y + uy * 13, l1x = x + ux * 19 + px * 4, l1y = y + uy * 19 + py * 4, l2x = x + ux * 19 - px * 4, l2y = y + uy * 19 - py * 4;
      ctx.strokeStyle = '#4A2E18'; ctx.lineWidth = 3.6; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(fx, fy); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(x + ux * 16 + px * 4.4, y + uy * 16 + py * 4.4, l1x, l1y); ctx.moveTo(fx, fy); ctx.quadraticCurveTo(x + ux * 16 - px * 4.4, y + uy * 16 - py * 4.4, l2x, l2y); ctx.stroke();
      ctx.strokeStyle = b.c1; ctx.lineWidth = 2.4; ctx.stroke(); ctx.strokeStyle = 'rgba(255,220,170,.35)'; ctx.lineWidth = 0.7; ctx.stroke(); ctx.strokeStyle = '#E8D6B0'; ctx.lineWidth = 3.8; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(x + ux * 8, y + uy * 8); ctx.lineTo(x + ux * 11, y + uy * 11); ctx.stroke(); ctx.lineCap = 'round'; /* v146: Astgabel mit Wicklung */
      const pull = fire ? (e < 0.2 ? e / 0.2 : Math.max(0, 1 - (e - 0.2) * 6)) : 0, qx2 = x + ux * (19 - 9 * pull), qy2 = y + uy * (19 - 9 * pull);
      ctx.strokeStyle = b.c2; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(l1x, l1y); ctx.lineTo(qx2, qy2); ctx.lineTo(l2x, l2y); ctx.stroke();
      if (!fire || e < 0.2) { ctx.fillStyle = '#8A93A0'; ctx.beginPath(); ctx.arc(qx2, qy2, 2.2, 0, TAU); ctx.fill(); }
      else { const f = (e - 0.2) / 0.8, s0 = 19 + (D - 19) * f; ctx.fillStyle = 'rgba(138,147,160,' + (1 - f * 0.5) + ')'; ctx.beginPath(); ctx.arc(x + ux * s0, y + uy * s0, 2.3, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + ux * Math.max(19, s0 - 12), y + uy * Math.max(19, s0 - 12)); ctx.lineTo(x + ux * s0, y + uy * s0); ctx.stroke(); }
    } else if (sh === 'net') {
      loc(x, y, ang, () => { ctx.fillStyle = cyl(2, '#2A2F38'); rr(6, 1.6, 3, 5, 1); ctx.fill(); ctx.fillStyle = cyl(3.4, '#5A626E'); rr(4, -3.4, 13, 6.8, 2.4); ctx.fill(); ctx.fillStyle = '#F2C14E'; ctx.fillRect(7, -3.4, 1, 6.8); ctx.fillRect(12.4, -3.4, 1, 6.8); ctx.fillStyle = '#14161C'; ctx.beginPath(); ctx.ellipse(17, 0, 1.4, 3.4, 0, 0, TAU); ctx.fill();
        if (!fire) { ctx.strokeStyle = b.c1; ctx.lineWidth = 0.5; ctx.beginPath(); for (let k = -1; k <= 1; k++) { ctx.moveTo(16.6, k * 1.6 - 0.8); ctx.lineTo(17.6, k * 1.6 + 0.8); } ctx.stroke(); } ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(5, -2.6, 11, 0.8); ctx.fillStyle = '#E05555'; ctx.beginPath(); ctx.arc(14.6, -3.6, 0.7, 0, TAU); ctx.fill(); });
      if (fire) {
        const s0 = 17 + (D - 17) * e, r = 4 + 12 * e, cx = x + ux * s0, cy = y + uy * s0;
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip();
        ctx.fillStyle = 'rgba(232,226,208,.14)'; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        ctx.strokeStyle = 'rgba(232,226,208,' + (0.95 - e * 0.25) + ')'; ctx.lineWidth = 1; ctx.beginPath();
        for (let k = -2; k <= 2; k++) { ctx.moveTo(cx + k * r / 2.2 - r, cy - r); ctx.lineTo(cx + k * r / 2.2 + r, cy + r); ctx.moveTo(cx + k * r / 2.2 + r, cy - r); ctx.lineTo(cx + k * r / 2.2 - r, cy + r); }
        ctx.stroke(); ctx.restore();
        ctx.strokeStyle = 'rgba(232,226,208,.95)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke();
      }
    } else if (sh === 'flash') {
      if (!fire) { const gx = x + ux * 10 + px * 3, gy = y + uy * 10 + py * 3; ctx.fillStyle = cyl(3.6, '#6B7280'); ctx.save(); ctx.translate(gx, gy); rr(-3, -3.6, 6, 8, 2.4); ctx.fill(); ctx.fillStyle = '#E8E8EE'; ctx.fillRect(-3, -0.6, 6, 1.6); ctx.fillStyle = '#9AA3AD'; rr(-1.6, -5.6, 3.2, 2.4, 0.6); ctx.fill(); ctx.strokeStyle = '#C9D2DC'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(2.4, -4.6, 1.4, 0, TAU); ctx.stroke(); ctx.fillStyle = '#E05555'; ctx.fillRect(-1.6, -5.2, 1, 3.6); ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(-2.2, -2.8, 0.8, 5); ctx.restore(); }
      else {
        const R = Math.max(14, D) * Math.min(1, e * 1.4 + 0.05);
        ctx.globalCompositeOperation = 'lighter'; const gl = ctx.createRadialGradient(x, y, 2, x, y, R); gl.addColorStop(0, 'rgba(255,255,255,' + (0.5 * (1 - e)) + ')'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.9 * (1 - e)) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
      }
    }
    ctx.restore();
  }
  function buyBat(id, viaKiosk) {
    const b = batDef(id); if (!b || !G || (b.kiosk && !viaKiosk) || G.wpn.owned[id] || G.rep < b.rep || G.money < b.cost) return false;
    G.money -= b.cost; G.wpn.owned[id] = true; if (G.wpn.eq === 'none') G.wpn.eq = id; sfx.cash(); save(); return true;
  }
  function equipBat(id) {
    if (!G) return false;
    if (id === 'none' || G.wpn.eq === id) { G.wpn.eq = 'none'; save(); return true; }
    if (!batDef(id) || !G.wpn.owned[id]) return false;
    G.wpn.eq = id; save(); return true;
  }
  // B mit Schlaeger: trifft Freunde (Mehrspieler) und Polizei in Reichweite. Liefert true, wenn geschwungen wurde.
  function batSwing() {
    const b = batDef(G && G.wpn.eq); if (!b || player.batCd > 0 || player.stun > 0) return false;
    player.batUseT = gt; // v77: Waffe ziehen (auch ohne Ziel), 3 s spaeter wieder auf den Ruecken
    const cand = [];
    for (const f of Object.values(mp.friends)) if (f.vis) cand.push({ f, o: f });
    for (const c of cops.concat(copMates)) if (c.on && c.stun <= 0) cand.push({ c, o: c }); // v97: auch Partner
    for (const z of gangTargets()) cand.push(z); // v51: feindliche Gangs
    let best = null, bd = b.reach + 10;
    for (const z of cand) { const d = Math.hypot(z.o.x - player.x, z.o.y - player.y); if (d < bd) { bd = d; best = z; } }
    if (!best) return false;
    const aim = Math.atan2(best.o.y - player.y, best.o.x - player.x), k = Math.random().toString(36).slice(2, 8), arc = b.arc || 1.2;
    player.ang = aim; player.batUseT = gt; player.sw = { t: 0, a: aim, k, d: bd }; player.swInfo = { k, a: aim, t: gt }; player.batCd = b.cd || 0.7; sfx.put();
    let hits = 0;
    for (const z of (b.n === 1 ? [best] : cand)) { // n = 1: Schocker, Netz, Zwille, Wasserpistole treffen nur das naechste Ziel
      const dx = z.o.x - player.x, dy = z.o.y - player.y, d = Math.hypot(dx, dy); if (d > b.reach + 10) continue;
      let da = Math.atan2(dy, dx) - aim; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; if (Math.abs(da) > arc) continue;
      const ux = d > 0.01 ? dx / d : 1, uy = d > 0.01 ? dy / d : 0;
      if (z.f) {
        const f = z.f; mp.pushes.push({ k: f.id + ':' + Math.random().toString(36).slice(2, 8), dx: +ux.toFixed(2), dy: +uy.toFixed(2), t: gt, b: b.id }); mp.pushes = mp.pushes.filter(q => gt - q.t < 4);
        f.x = clamp(f.x + ux * 24, XMIN, WW); f.y = clamp(f.y + uy * 24, YMIN, WH); f.tx += ux * 40; f.ty += uy * 40; f.ko = gt;
        floater(f.x, f.y - 26, 'K.O.', '#FFD24A'); msg('Treffer! ' + f.name + ' ist benommen'); hits++;
      } else if (z.gm) {
        gangHit(z.g, z.gm, 0.7 + b.stun * 0.65, Math.max(0.7, b.stun * 1.3), ux, uy, b.kp !== undefined ? b.kp : 26); hits++;
      } else {
        const c = z.c; if (c.seen) sus = Math.min(1, sus + 0.25);
        c.stun = Math.max(c.stun, b.cop); c.ko = 1; G.stat.ko++; c.seen = false; { const kp = b.kp !== undefined ? b.kp : 26; move(c, ux * kp, uy * kp, 9); } copHitSend(c, b.cop, true);
        floater(c.x, c.y - 24, 'K.O.', '#FFD24A'); msg('Streife ausgeschaltet!'); hits++;
      }
    }
    if (hits) sfx.bad();
    mp.sendT = 9; mpSend(); return true;
  }
  function pvBat(p, dt, c) {
    p.t += dt; const ph = p.t % 1.9, sw = ph < 0.4 ? ph / 0.4 : -1, ht = ph - 0.22;
    c.fillStyle = 'rgba(255,255,255,.04)'; c.fillRect(0, 50, 132, 14);
    drawFigure(34, 40, 0, 0);
    drawBat(34, 40, 0, sw, p.id, 56);
    const off = ht > 0 && ht < 1.1 ? 26 * Math.min(1, ht * 5) * (ht < 0.6 ? 1 : Math.max(0, 1 - (ht - 0.6) * 2)) : 0, dx = 92 + off, ko = ht > 0 && ht < 1.0;
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(dx + 1, 45, 9, 4, 0, 0, TAU); c.fill();
    c.fillStyle = '#1D2A4A'; c.beginPath(); c.arc(dx, 40, 9, 0, TAU); c.fill();
    c.fillStyle = ko ? '#FF5C7A' : '#4B8DFF'; c.beginPath(); c.arc(dx, 40, 4, 0, TAU); c.fill();
    if (ko) drawStars(dx, 26, p.t);
  }

