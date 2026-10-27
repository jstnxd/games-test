  // ---------- Autohof (v66) ----------
  function renderAutohof(b) {
    const here = atAutohof(), info = document.createElement('div'); info.className = 'empty'; info.style.cssText = 'padding:6px 4px;font-size:13px;text-align:left';
    info.textContent = here ? 'Willkommen am Autohof! Autos gibt es nur hier. Das ausgewählte Auto gibt dir Laderaum für Ware dazu. Einsteigen mit dem Auto-Knopf (am Computer Taste C). Die Farbe kannst du jederzeit ändern.' : 'Der Autohof steht im Gewerbegebiet ganz im Osten an der Hauptstraße. Hinfahren und dort A drücken.';
    b.appendChild(info); if (!here) return;
    VEHS.filter(v => v.car).forEach(v => {
      const owned = !!G.veh.owned[v.id], on = selCar() === v.id, locked = !owned && G.rep < v.rep;
      const c = document.createElement('div'); c.className = 'card cos';
      c.innerHTML = '<canvas class="pv" data-veh="' + v.id + '" width="264" height="128"></canvas><div class="nm"></div><div class="pr"></div><div class="ds"></div>';
      c.querySelector('.nm').innerHTML = v.name + (on ? ' <span style="color:var(--green);font-weight:700">ausgewählt</span>' : '');
      c.querySelector('.pr').textContent = owned ? 'gekauft' : fmt(v.cost); c.querySelector('.ds').textContent = v.desc + ' Laderaum +' + v.cap + '.';
      if (owned) {
        const sw = document.createElement('div'); sw.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 2px';
        CAR_COLS.forEach((col, ci) => { const bt = document.createElement('button'); bt.className = 'sw'; bt.title = CAR_COL_NAMES[ci]; bt.setAttribute('aria-label', 'Farbe ' + CAR_COL_NAMES[ci]); bt.style.background = col; if (carColI(v.id) === ci) bt.style.borderColor = '#FFFFFF'; bt.addEventListener('click', () => { paintCar(v.id, ci); renderPhone(); }); sw.appendChild(bt); });
        c.appendChild(sw);
      }
      const btn = document.createElement('button'); btn.className = 'buy';
      if (!owned) { btn.textContent = locked ? 'Ab Ruf ' + v.rep : 'Kaufen'; btn.disabled = locked || !canPay(v.cost); btn.addEventListener('click', () => { if (buyCar(v.id)) renderPhone(); }); }
      else { btn.textContent = on ? 'Ausgewählt' : 'Auswählen'; if (on) { btn.classList.add('alt'); btn.disabled = true; } btn.addEventListener('click', () => { equipVeh(v.id); renderPhone(); }); }
      c.appendChild(btn); b.appendChild(c);
    });
    startPreviews(b);
  }
  // ---------- v89: Zeichnen: Casino (Las Vegas), Apotheke, Besucher-Feld, Mietraum ----------
  let casLooks = null;
  // ---------- v144: Spielautomat (Casino und Deko) ----------
  const SLOT_DRAW = ['cherry', 'seven', 'bell', 'diamond', 'bar', 'star'];
  function slotSym(k, x, y, s) { // s = Hoehe des Symbols
    const F = c => { ctx.fillStyle = c; };
    switch (SLOT_DRAW[((k % 6) + 6) % 6]) {
      case 'cherry': ctx.strokeStyle = '#2E8B3E'; ctx.lineWidth = s * 0.09; ctx.beginPath(); ctx.moveTo(x - s * 0.18, y + s * 0.05); ctx.quadraticCurveTo(x, y - s * 0.4, x + s * 0.2, y - s * 0.38); ctx.moveTo(x + s * 0.2, y + s * 0.08); ctx.quadraticCurveTo(x + s * 0.18, y - s * 0.2, x + s * 0.2, y - s * 0.38); ctx.stroke(); F('#D8203A'); ctx.beginPath(); ctx.arc(x - s * 0.18, y + s * 0.16, s * 0.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(x + s * 0.2, y + s * 0.2, s * 0.2, 0, TAU); ctx.fill(); F('rgba(255,255,255,.6)'); ctx.beginPath(); ctx.arc(x - s * 0.24, y + s * 0.1, s * 0.06, 0, TAU); ctx.fill(); break;
      case 'seven': ctx.font = '900 ' + (s * 0.95).toFixed(2) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = s * 0.12; ctx.strokeStyle = '#7A0A14'; ctx.strokeText('7', x, y + s * 0.04); F('#E8203A'); ctx.fillText('7', x, y + s * 0.04); break;
      case 'bell': F('#E8B22A'); ctx.beginPath(); ctx.moveTo(x - s * 0.32, y + s * 0.26); ctx.quadraticCurveTo(x - s * 0.28, y - s * 0.38, x, y - s * 0.38); ctx.quadraticCurveTo(x + s * 0.28, y - s * 0.38, x + s * 0.32, y + s * 0.26); ctx.closePath(); ctx.fill(); F('#A8781A'); ctx.fillRect(x - s * 0.36, y + s * 0.22, s * 0.72, s * 0.09); ctx.beginPath(); ctx.arc(x, y + s * 0.36, s * 0.08, 0, TAU); ctx.fill(); F('rgba(255,255,255,.5)'); ctx.fillRect(x - s * 0.16, y - s * 0.24, s * 0.06, s * 0.36); break;
      case 'diamond': F('#3ABCE8'); ctx.beginPath(); ctx.moveTo(x, y - s * 0.4); ctx.lineTo(x + s * 0.34, y - s * 0.06); ctx.lineTo(x, y + s * 0.4); ctx.lineTo(x - s * 0.34, y - s * 0.06); ctx.closePath(); ctx.fill(); F('#A6E8FF'); ctx.beginPath(); ctx.moveTo(x, y - s * 0.4); ctx.lineTo(x + s * 0.12, y - s * 0.06); ctx.lineTo(x, y + s * 0.4); ctx.lineTo(x - s * 0.12, y - s * 0.06); ctx.closePath(); ctx.fill(); break;
      case 'bar': F('#14161C'); ctx.fillRect(x - s * 0.4, y - s * 0.2, s * 0.8, s * 0.4); F('#F4F4F8'); ctx.font = '900 ' + (s * 0.3).toFixed(2) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BAR', x, y + s * 0.02); break;
      case 'star': F('#FFC82A'); starPath(x, y, s * 0.4, s * 0.17); ctx.fill(); F('#FFF0A0'); starPath(x - s * 0.04, y - s * 0.04, s * 0.16, s * 0.07); ctx.fill(); break;
    }
    ctx.textBaseline = 'alphabetic';
  }
  // o: { theme: 'red'|'neon', label, spin (true = dreht gerade), seed, auto (Deko: dreht von selbst), dark (0..1 Nacht) }
  function drawSlotMachine(x, y, o) {
    const F = c => { ctx.fillStyle = c; }, t = gt, neon = o.theme === 'neon', seed = o.seed || 0;
    let spin = !!o.spin, stopAt = [0, 0, 0], win = false, wp = 0, res = [0, 0, 0];
    const hh = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7 + seed * 74.7) * 43758.5453; return Math.floor((v - Math.floor(v)) * 6); };
    let rp = [0, 0, 0];
    if (o.auto) { const T = 7, cy = Math.floor((t + seed * 2.3) / T), ph = (t + seed * 2.3) - cy * T; win = cy % 3 === 1; res = win ? [hh(cy, 9), hh(cy, 9), hh(cy, 9)] : [hh(cy, 0), hh(cy, 1), hh(cy, 2)]; if (!win && res[0] === res[1] && res[1] === res[2]) res[2] = (res[2] + 1) % 6;
      for (let r = 0; r < 3; r++) { const stop = 0.9 + r * 0.32; rp[r] = ph < stop ? res[r] + 6 * 4 - (stop - ph) * 22 : res[r]; } spin = ph < 1.6; wp = win && ph > 1.6 && ph < 4.2 ? (ph - 1.6) / 2.6 : 0; win = wp > 0; }
    else { const cy = Math.floor(t / 5 + seed); for (let r = 0; r < 3; r++) { res[r] = hh(cy, r); rp[r] = spin ? t * (18 + r * 3) : res[r]; } }
    ctx.save(); ctx.translate(x, y);
    const glowC = neon ? '180,90,255' : '255,80,90';
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const ga = 0.12 + 0.08 * Math.sin(t * 2) + (win ? 0.25 * Math.sin(wp * Math.PI) : 0) + 0.1 * (o.dark || 0); const g0 = ctx.createRadialGradient(0, -4, 2, 0, -4, 34); g0.addColorStop(0, 'rgba(' + glowC + ',' + ga.toFixed(3) + ')'); g0.addColorStop(1, 'rgba(' + glowC + ',0)'); F(g0); ctx.beginPath(); ctx.arc(0, -4, 34, 0, TAU); ctx.fill(); ctx.restore();
    F('rgba(0,0,0,.35)'); ctx.beginPath(); ctx.ellipse(1, 23, 15, 3.6, 0, 0, TAU); ctx.fill();
    // Seitliche Lichtleisten
    for (const sx of [-15.6, 13.6]) { F('#14161C'); rr(sx, -21, 2, 42, 1); ctx.fill(); for (let k = 0; k < 7; k++) { const on = (Math.floor(t * 8) + k + (sx > 0 ? 3 : 0)) % 4 === 0; F(on ? (neon ? '#E6B8FF' : '#FFE27A') : (neon ? '#6A3AA8' : '#8A5A20')); ctx.fillRect(sx + 0.4, -19 + k * 5.8, 1.2, 3); } }
    // Gehaeuse
    const gb = ctx.createLinearGradient(-14, 0, 14, 0); if (neon) { gb.addColorStop(0, '#22123E'); gb.addColorStop(0.5, '#4A2490'); gb.addColorStop(1, '#22123E'); } else { gb.addColorStop(0, '#6A0C18'); gb.addColorStop(0.5, '#D8223A'); gb.addColorStop(1, '#6A0C18'); }
    F(gb); rr(-14, -22, 28, 44, 4); ctx.fill(); ctx.strokeStyle = '#C9D2DC'; ctx.lineWidth = 0.9; rr(-14, -22, 28, 44, 4); ctx.stroke(); F('rgba(255,255,255,.14)'); ctx.fillRect(-12, -21, 3, 41);
    // Aufsatz mit Lauflichtern
    F('#14161C'); rr(-13.4, -33, 26.8, 12, 5); ctx.fill(); F(neon ? '#2A1650' : '#3A0A12'); rr(-12.4, -32, 24.8, 10, 4); ctx.fill();
    for (let k = 0; k < 14; k++) { const u = k / 14, px = -11.6 + (k < 7 ? u * 2 * 23.2 : (1 - (u - 0.5) * 2) * 23.2), py = k < 7 ? -31.4 : -22.6; const on = (Math.floor(t * 10) + k) % 3 === 0 || win; F(on ? '#FFF2B0' : '#7A5A20'); ctx.beginPath(); ctx.arc(px, py, 0.7, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.font = '900 5.2px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const lab = o.label || (neon ? 'JACKPOT' : 'LUCKY 7'), pu = 0.75 + 0.25 * Math.sin(t * 3); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round'; ctx.strokeStyle = neon ? 'rgba(220,120,255,' + (0.5 * pu).toFixed(2) + ')' : 'rgba(255,200,60,' + (0.5 * pu).toFixed(2) + ')'; ctx.lineWidth = 2; ctx.strokeText(lab, 0, -27); F(neon ? '#F4D8FF' : '#FFE27A'); ctx.fillText(lab, 0, -27); ctx.restore();
    // Walzenfenster
    F('#C9D2DC'); rr(-12, -17.4, 24, 15.4, 2.4); ctx.fill(); F('#14161C'); rr(-11.2, -16.6, 22.4, 13.8, 2); ctx.fill();
    for (let r = 0; r < 3; r++) { const rx = -10.4 + r * 7.2, rw = 6.6; ctx.save(); ctx.beginPath(); ctx.rect(rx, -16, rw, 12.6); ctx.clip(); const gr = ctx.createLinearGradient(0, -16, 0, -3.4); gr.addColorStop(0, '#9AA3AD'); gr.addColorStop(0.3, '#FFFFFF'); gr.addColorStop(0.7, '#FFFFFF'); gr.addColorStop(1, '#9AA3AD'); F(gr); ctx.fillRect(rx, -16, rw, 12.6);
      const p = rp[r], base = Math.floor(p), fr = p - base, cyR = -9.7, sp = 6.2; for (let q = -1; q <= 1; q++) { const sym = base - q, yy = cyR + (q + fr) * sp - 0; if (spin && Math.abs(p - Math.round(p)) > 0.01) { ctx.globalAlpha = 0.85; } slotSym(sym, rx + rw / 2, yy, 5); ctx.globalAlpha = 1; }
      if (spin && (o.auto ? Math.abs(p - Math.round(p)) > 0.01 : true)) { F('rgba(255,255,255,.35)'); ctx.fillRect(rx, -16, rw, 12.6); }
      F('rgba(0,0,0,.25)'); ctx.fillRect(rx, -16, rw, 1.6); ctx.fillRect(rx, -5, rw, 1.6); ctx.restore(); }
    ctx.strokeStyle = win ? 'rgba(255,240,120,' + (0.6 + 0.4 * Math.sin(t * 20)).toFixed(2) + ')' : 'rgba(255,60,80,.8)'; ctx.lineWidth = win ? 1 : 0.5; ctx.beginPath(); ctx.moveTo(-11, -9.7); ctx.lineTo(11, -9.7); ctx.stroke(); F('#FF3C50'); for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(s * 12.6, -9.7); ctx.lineTo(s * 11.4, -11); ctx.lineTo(s * 11.4, -8.4); ctx.closePath(); ctx.fill(); }
    // Anzeige, Knoepfe, Muenzschale
    F('#0E1014'); rr(-11, -1, 22, 4.4, 1); ctx.fill(); ctx.save(); ctx.font = '700 3px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; F(win ? '#FFE27A' : '#FF5A3A'); ctx.fillText(win ? 'GEWINN!' : 'CREDIT ' + String(420 + Math.floor(t * 3) % 80).padStart(4, '0'), 0, 1.2); ctx.restore();
    [['#E0243A', -7], ['#F2C14E', 0], ['#3FD06A', 7]].forEach(([c, bx], k) => { F('#2A2F38'); ctx.beginPath(); ctx.ellipse(bx, 7, 2.8, 1.8, 0, 0, TAU); ctx.fill(); const lit = 0.6 + 0.4 * Math.sin(t * 5 + k * 2); ctx.save(); ctx.globalAlpha = lit; F(c); ctx.beginPath(); ctx.ellipse(bx, 6.6, 2.2, 1.3, 0, 0, TAU); ctx.fill(); ctx.restore(); F('rgba(255,255,255,.5)'); ctx.fillRect(bx - 1, 6, 1, 0.5); });
    F('#5A626E'); rr(-11, 11.4, 22, 8, 2); ctx.fill(); F('#14161C'); rr(-9.6, 12.6, 19.2, 5.6, 1.6); ctx.fill(); F('#E8B22A'); for (let k = 0; k < (win ? 7 : 3); k++) { ctx.beginPath(); ctx.ellipse(-6 + (k * 2.3) % 12 + (k > 4 ? 1 : 0), 16.4 - (k % 2) * 0.8, 1.5, 0.8, 0, 0, TAU); ctx.fill(); }
    F('#2A2F38'); ctx.fillRect(-4, 20.6, 8, 1.6);
    // Hebel
    const pull = o.auto ? (spin && (t + seed * 2.3) % 7 < 0.4 ? 1 : 0) : (spin ? 0.6 + 0.4 * Math.sin(t * 10) : 0); ctx.save(); ctx.translate(15, -2); ctx.rotate(0.22 + pull * 1.3); F('#9AA3AD'); rr(-0.9, -12, 1.8, 12, 0.9); ctx.fill(); F('rgba(255,255,255,.6)'); ctx.fillRect(-0.4, -11.4, 0.5, 10); const gk = ctx.createRadialGradient(-0.8, -13.4, 0.3, 0, -12.6, 2.8); gk.addColorStop(0, '#FF8A9A'); gk.addColorStop(1, neon ? '#7A2AD0' : '#B0122A'); F(gk); ctx.beginPath(); ctx.arc(0, -12.8, 2.6, 0, TAU); ctx.fill(); ctx.restore(); F('#5A626E'); rr(13.6, -4, 2.8, 4, 1); ctx.fill();
    // Gewinn: Muenzen springen heraus
    if (win) { for (let k = 0; k < 8; k++) { const p = (wp * 2.2 + k / 8) % 1, ax = (k % 2 ? 1 : -1) * (2 + (k * 3.7) % 10), cx = ax * p, cy0 = 14 - 30 * p + 34 * p * p; ctx.globalAlpha = 1 - p * 0.6; const w2 = Math.abs(Math.cos(t * 9 + k)) * 1.6 + 0.3; F('#FFD24A'); ctx.beginPath(); ctx.ellipse(cx, cy0, w2, 1.6, 0, 0, TAU); ctx.fill(); F('#C9962A'); ctx.beginPath(); ctx.ellipse(cx, cy0, w2 * 0.5, 0.8, 0, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
      ctx.save(); ctx.font = '900 6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = Math.sin(wp * Math.PI); ctx.lineWidth = 2; ctx.strokeStyle = '#7A0A14'; ctx.strokeText('WIN!', 0, -38 - wp * 4); F('#FFE27A'); ctx.fillText('WIN!', 0, -38 - wp * 4); ctx.restore(); }
    ctx.restore();
  }
  // ---------- v144: Blackjack-Tisch ----------
  function drawBJTable(x, y, i, min) {
    const F = c => { ctx.fillStyle = c; }, t = gt;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gl = ctx.createRadialGradient(x, y - 2, 4, x, y - 2, 46); gl.addColorStop(0, 'rgba(255,225,160,.16)'); gl.addColorStop(1, 'rgba(255,225,160,0)'); F(gl); ctx.beginPath(); ctx.arc(x, y - 2, 46, 0, TAU); ctx.fill(); ctx.restore();
    F('rgba(0,0,0,.35)'); ctx.beginPath(); ctx.ellipse(x + 2, y + 6, 34, 18, 0, 0, Math.PI); ctx.fill(); ctx.fillRect(x - 32, y - 10, 68, 16);
    const shape = (rx, ry, top) => { ctx.beginPath(); ctx.moveTo(x - rx, top); ctx.lineTo(x + rx, top); ctx.lineTo(x + rx, y); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI); ctx.closePath(); };
    F('#2A140A'); shape(33.4, 19.4, y - 15); ctx.fill(); const gr = ctx.createLinearGradient(x, y - 14, x, y + 18); gr.addColorStop(0, '#7A4424'); gr.addColorStop(1, '#4A2412'); F(gr); shape(32.4, 18.4, y - 14.4); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,170,.35)'; ctx.lineWidth = 0.4; ctx.setLineDash([1, 1]); ctx.beginPath(); ctx.ellipse(x, y, 30.6, 16.6, 0, 0, Math.PI); ctx.stroke(); ctx.setLineDash([]);
    const gf = ctx.createRadialGradient(x, y - 6, 2, x, y - 2, 32); gf.addColorStop(0, '#22A058'); gf.addColorStop(1, '#0C5A2C'); F(gf); shape(28, 14, y - 11.6); ctx.fill();
    ctx.strokeStyle = 'rgba(255,215,110,.7)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.ellipse(x, y - 2, 21, 9, 0, 0.12, Math.PI - 0.12); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y - 2, 15, 5.6, 0, 0.18, Math.PI - 0.18); ctx.stroke();
    ctx.save(); ctx.font = '800 2.6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; F('rgba(255,215,110,.85)'); ctx.fillText('BLACKJACK ZAHLT 3 : 2', x, y + 1.6); F('rgba(255,255,255,.45)'); ctx.font = '700 2px sans-serif'; ctx.fillText('DEALER ZIEHT BIS 16', x, y + 4.4); ctx.restore();
    for (let k = 0; k < 5; k++) { const a = Math.PI * (0.16 + k * 0.17), cx = x + Math.cos(a) * 23.5, cy = y + Math.sin(a) * 11.4; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.ellipse(cx, cy, 2.8, 1.6, 0, 0, TAU); ctx.stroke();
      if ((k + i) % 2 === 0) { const cols = [['#E0243A', '#FFFFFF'], ['#2F6FD6', '#FFFFFF'], ['#14161C', '#F2C14E']][(k + i) % 3]; for (let q = 0; q < 2 + (k % 3); q++) { F(cols[0]); ctx.beginPath(); ctx.ellipse(cx, cy - q * 1.1, 2.3, 1.3, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = cols[1]; ctx.setLineDash([0.6, 0.8]); ctx.lineWidth = 0.4; ctx.beginPath(); ctx.ellipse(cx, cy - q * 1.1, 1.9, 1, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]); } }
      if (k === 1 || k === 3) { for (let c = 0; c < 2; c++) { ctx.save(); ctx.translate(cx - 1.6 + c * 2.4, cy - 4.6); ctx.rotate(-0.2 + c * 0.35); F('#FFFFFF'); rr(-1.6, -2.2, 3.2, 4.4, 0.5); ctx.fill(); F(c ? '#E0243A' : '#14161C'); ctx.font = '800 2.2px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(['A', 'K', '7', 'Q', '9', '10'][(k + c + i) % 6], 0, -0.5); ctx.restore(); } } }
    F('#14161C'); rr(x - 11, y - 13.6, 22, 4.4, 1); ctx.fill(); const chipC = ['#E0243A', '#2F6FD6', '#3FAE6A', '#14161C', '#B58CFF', '#F2C14E']; for (let k = 0; k < 6; k++) { F(chipC[k]); ctx.fillRect(x - 10.2 + k * 3.5, y - 13, 2.8, 3.2); F('rgba(255,255,255,.35)'); for (let q = 0; q < 3; q++) ctx.fillRect(x - 10.2 + k * 3.5, y - 12.6 + q, 2.8, 0.25); }
    const flip = (t * 0.5 + i * 0.7) % 4; for (let c = 0; c < 2; c++) { ctx.save(); ctx.translate(x - 2 + c * 4, y - 6.4); ctx.rotate(-0.1 + c * 0.2); const down = c === 1 && flip < 3; F('#FFFFFF'); rr(-1.8, -2.4, 3.6, 4.8, 0.5); ctx.fill(); if (down) { F('#B0122A'); rr(-1.4, -2, 2.8, 4, 0.4); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 0.3; for (let q = -2; q < 3; q++) { ctx.beginPath(); ctx.moveTo(-1.4, q); ctx.lineTo(1.4, q + 1.4); ctx.stroke(); } } else { F(c ? '#E0243A' : '#14161C'); ctx.font = '800 2.4px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c ? '♥' : 'A', 0, -0.4); } ctx.restore(); }
    F('#8A1020'); ctx.save(); ctx.translate(x + 19, y - 9); ctx.rotate(0.2); rr(-3.4, -2.4, 6.8, 4.8, 1); ctx.fill(); F('#FFFFFF'); ctx.fillRect(-2.6, -1.8, 4, 3.4); F('#6A0C18'); ctx.fillRect(1.4, -2.4, 2, 4.8); ctx.restore();
    F('#14161C'); rr(x - 26, y - 11, 4, 4, 0.8); ctx.fill(); F('#E8ECF2'); ctx.fillRect(x - 25.4, y - 10.4, 2.8, 2);
    F('#2A140A'); rr(x - 12, y + 18.6, 24, 6.4, 2); ctx.fill(); F(ctx.createLinearGradient(x - 11, 0, x + 11, 0)); { const gp = ctx.createLinearGradient(x - 11, 0, x + 11, 0); gp.addColorStop(0, '#9A6C14'); gp.addColorStop(0.5, '#FFE27A'); gp.addColorStop(1, '#9A6C14'); F(gp); } rr(x - 11.2, y + 19.2, 22.4, 5.2, 1.6); ctx.fill();
    ctx.save(); ctx.font = '900 3.6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; F('#3A2408'); ctx.fillText('MIN ' + fmt(min), x, y + 21.9); ctx.restore(); ctx.textBaseline = 'alphabetic';
  }
  function drawCasino() {
    const C = CAS; if (!inView(C.x + C.w / 2, C.y + C.h / 2, 420)) return;
    const inside = inCasino(), I = CAS_IN;
    // Vorplatz: roter Teppich, Palmen, Scheinwerfer
    ctx.fillStyle = '#3A1E24'; ctx.fillRect(CAS_DOOR.x0 - 6, C.y + C.h - 2, CAS_DOOR.x1 - CAS_DOOR.x0 + 12, 52);
    ctx.fillStyle = '#B3122E'; ctx.fillRect(CAS_DOOR.x0, C.y + C.h - 2, CAS_DOOR.x1 - CAS_DOOR.x0, 52);
    ctx.fillStyle = '#FFD24A'; ctx.fillRect(CAS_DOOR.x0, C.y + C.h - 2, 2, 52); ctx.fillRect(CAS_DOOR.x1 - 2, C.y + C.h - 2, 2, 52);
    for (const px of [CAS_DOOR.x0 - 26, CAS_DOOR.x1 + 26]) { // Messing-Pfosten mit Kordel
      ctx.fillStyle = '#C9A040'; for (const py of [C.y + C.h + 10, C.y + C.h + 40]) { ctx.beginPath(); ctx.arc(px, py, 3.2, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = '#B3122E'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, C.y + C.h + 10); ctx.quadraticCurveTo(px + 4, C.y + C.h + 25, px, C.y + C.h + 40); ctx.stroke(); }
    for (const [px, py] of [[C.x - 18, C.y + C.h - 30], [C.x + C.w + 18, C.y + C.h - 30], [C.x - 18, C.y + 60], [C.x + C.w + 18, C.y + 60]]) { if (px > 5196) continue; casPalm(px, py); }
    if (!inside) for (let k = 0; k < 2; k++) { const a = Math.sin(gt * 0.8 + k * 2.4) * 0.55 - Math.PI / 2, bx = C.x + (k ? C.w - 30 : 30), by = C.y + C.h + 6; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(bx, by, bx + Math.cos(a) * 260, by + Math.sin(a) * 260); g.addColorStop(0, 'rgba(255,240,200,.16)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(a - 0.12) * 260, by + Math.sin(a - 0.12) * 260); ctx.lineTo(bx + Math.cos(a + 0.12) * 260, by + Math.sin(a + 0.12) * 260); ctx.closePath(); ctx.fill(); ctx.restore(); }
    if (inside) { // v157: von draußen deckt das Dach den Innenraum ganz ab, dann wird er nicht gezeichnet
    // Innenraum: roter Teppich mit goldenem Muster
    ctx.fillStyle = '#5A0E1E'; ctx.fillRect(I.x0, I.y0, I.x1 - I.x0, I.y1 - I.y0);
    ctx.fillStyle = 'rgba(255,200,80,.10)'; for (let x = I.x0 + 12; x < I.x1; x += 28) for (let y = I.y0 + 12; y < I.y1; y += 28) { ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 5); ctx.lineTo(x - 5, y); ctx.closePath(); ctx.fill(); }
    ctx.strokeStyle = 'rgba(255,210,74,.35)'; ctx.lineWidth = 2; ctx.strokeRect(I.x0 + 8, I.y0 + 8, I.x1 - I.x0 - 16, I.y1 - I.y0 - 16);
    // Waende mit goldener Kante
    ctx.fillStyle = '#1B1220'; ctx.fillRect(C.x, C.y, C.w, CAS_W); ctx.fillRect(C.x, C.y, CAS_W, C.h); ctx.fillRect(C.x + C.w - CAS_W, C.y, CAS_W, C.h); ctx.fillRect(C.x, C.y + C.h - CAS_W, CAS_DOOR.x0 - C.x, CAS_W); ctx.fillRect(CAS_DOOR.x1, C.y + C.h - CAS_W, C.x + C.w - CAS_DOOR.x1, CAS_W);
    ctx.fillStyle = '#C9A040'; ctx.fillRect(C.x, C.y + CAS_W - 2, C.w, 2); ctx.fillRect(C.x + CAS_W - 2, C.y, 2, C.h); ctx.fillRect(C.x + C.w - CAS_W, C.y, 2, C.h);
    // Neonband innen
    const hue = (gt * 40) % 360; ctx.strokeStyle = 'hsla(' + hue + ',90%,62%,.7)'; ctx.lineWidth = 2; ctx.strokeRect(I.x0 + 3, I.y0 + 3, I.x1 - I.x0 - 6, I.y1 - I.y0 - 6);
    // Gluecksrad an der Nordwand
    { const W0 = CAS_WHEEL, a = casSpin ? (casSpin.a0 + (casSpin.a1 - casSpin.a0) * (1 - Math.pow(1 - Math.min(1, casSpin.t / casSpin.dur), 3))) : gt * 0.15, seg = TAU / WHEEL.length;
      ctx.fillStyle = '#2B1A10'; ctx.fillRect(W0.x - 6, W0.y + 20, 12, 20); ctx.fillStyle = '#3A2414'; rr(W0.x - 36, W0.y + 34, 72, 10, 3); ctx.fill();
      ctx.fillStyle = '#2B1A10'; ctx.beginPath(); ctx.arc(W0.x, W0.y, 33, 0, TAU); ctx.fill();
      WHEEL.forEach((s, i) => { ctx.fillStyle = s.c; ctx.beginPath(); ctx.moveTo(W0.x, W0.y); ctx.arc(W0.x, W0.y, 29, a + i * seg - Math.PI / 2, a + (i + 1) * seg - Math.PI / 2); ctx.closePath(); ctx.fill(); });
      for (let i = 0; i < 16; i++) { const an = i * TAU / 16; ctx.fillStyle = (Math.floor(gt * 6) + i) % 2 ? '#FFE27A' : '#7A5A20'; ctx.beginPath(); ctx.arc(W0.x + Math.cos(an) * 31, W0.y + Math.sin(an) * 31, 1.6, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.arc(W0.x, W0.y, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#FF5C7A'; ctx.beginPath(); ctx.moveTo(W0.x - 5, W0.y - 36); ctx.lineTo(W0.x + 5, W0.y - 36); ctx.lineTo(W0.x, W0.y - 26); ctx.closePath(); ctx.fill();
      if (wheelReady()) { ctx.fillStyle = 'rgba(255,210,74,' + (0.5 + 0.5 * Math.sin(gt * 4)).toFixed(2) + ')'; ctx.font = '900 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('HEUTE GRATIS!', W0.x, W0.y + 52); ctx.textBaseline = 'alphabetic'; } }
    // Slotmaschinen
    CAS_SLOTS.forEach((s, i) => drawSlotMachine(s.x, s.y, { theme: i % 2 ? 'neon' : 'red', label: 'LUCKY ' + (i + 1), spin: slotBusy && casIdx === i, seed: i * 3.1 })); // v144: neue Automaten
    // Bar an der Ostwand
    ctx.fillStyle = '#2B1A10'; rr(5138, 880, 22, 150, 4); ctx.fill(); ctx.fillStyle = '#5A3A22'; ctx.fillRect(5138, 880, 4, 150);
    for (let k = 0; k < 9; k++) { ctx.fillStyle = ['#E8B44A', '#4FD1C5', '#E05A9A', '#9BD05A'][k % 4]; ctx.fillRect(5150, 888 + k * 16, 5, 10); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(5151, 889 + k * 16, 1, 6); }
    // Blackjack-Tische mit Dealer
    if (!casLooks) casLooks = [0, 1, 2].map(i => LK({ r: 24, g: 24, b: 30, top: 'suit', bot: 'suitpants', hair: [0, 2, 1][i], hs: [3, 6, 8][i], skin: [1, 3, 0][i], sex: i === 1 ? 'f' : 'm', shoe: 'dress' }));
    CAS_BJ.forEach((t, i) => { drawFigure(t.x, t.y - 28, Math.PI / 2, 0, casLooks[i]); drawBJTable(t.x, t.y, i, t.min); }); // v144: neuer Tisch
    // Kronleuchter-Licht
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const [lx, ly] of [[4960, 960], [5080, 960], [5020, 1180]]) { const g = ctx.createRadialGradient(lx, ly, 2, lx, ly, 70); g.addColorStop(0, 'rgba(255,220,150,.18)'); g.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, 70, 0, TAU); ctx.fill(); } ctx.restore();
    }
    if (!inside) drawCasinoRoof();
  }
  function drawCasinoRoof() { // v157: Dach und Schild als fertiges Bild (zwei Zustände fürs Flackern), Lauflicht live
    const C = CAS, fl = Math.sin(gt * 9) > -0.92;
    bcDraw('casroof' + (fl ? 1 : 0), C.x - 4, C.y - 4, C.w + 14, C.h + 16, () => drawCasinoRoof0(fl));
    // Lauflicht rundherum
    const n = 46, per = 2 * (C.w + C.h); for (let k = 0; k < n; k++) { let d = k * per / n, x, y; if (d < C.w) { x = C.x + d; y = C.y + 4; } else if ((d -= C.w) < C.h) { x = C.x + C.w - 4; y = C.y + d; } else if ((d -= C.h) < C.w) { x = C.x + C.w - d; y = C.y + C.h - 4; } else { d -= C.w; x = C.x + 4; y = C.y + C.h - d; } const on = (Math.floor(gt * 8) + k) % 3 === 0; ctx.fillStyle = on ? '#FFF3B0' : '#8A6A2A'; ctx.beginPath(); ctx.arc(x, y, on ? 2.6 : 1.8, 0, TAU); ctx.fill(); }
  }
  function drawCasinoRoof0(fl) {
    const C = CAS;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(C.x + 6, C.y + 8, C.w, C.h);
    const g = ctx.createLinearGradient(0, C.y, 0, C.y + C.h); g.addColorStop(0, '#2A1630'); g.addColorStop(1, '#170C1C'); ctx.fillStyle = g; ctx.fillRect(C.x, C.y, C.w, C.h);
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1; for (let x = C.x + 20; x < C.x + C.w; x += 40) { ctx.beginPath(); ctx.moveTo(x, C.y); ctx.lineTo(x, C.y + C.h); ctx.stroke(); }
    // grosses Leuchtschild
    const cx = C.x + C.w / 2, cy = C.y + C.h / 2 - 20;
    ctx.fillStyle = '#10151C'; rr(cx - 112, cy - 46, 224, 92, 14); ctx.fill(); ctx.strokeStyle = '#FFD24A'; ctx.lineWidth = 3; rr(cx - 112, cy - 46, 224, 92, 14); ctx.stroke();
    ctx.save(); if (fl) { ctx.shadowColor = '#FF3A8C'; ctx.shadowBlur = 16; } ctx.fillStyle = fl ? '#FF5CA8' : '#6A2448'; ctx.font = '900 40px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('CASINO', cx, cy - 6); ctx.restore();
    ctx.save(); ctx.shadowColor = '#FFD24A'; ctx.shadowBlur = 8; ctx.fillStyle = '#FFE27A'; ctx.font = '900 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★ LUCKY KELLER ★', cx, cy + 26); ctx.restore();
    for (const [dx, sym] of [[-140, '♠'], [140, '♦'], [-140, '♥'], [140, '♣']].slice(0, 2)) { ctx.fillStyle = 'rgba(255,92,168,.75)'; ctx.font = '900 28px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sym, cx + dx * 0.8, cy + 90); }
    ctx.fillStyle = '#FFD24A'; ctx.font = '900 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('▼ EINGANG ▼', (CAS_DOOR.x0 + CAS_DOOR.x1) / 2, C.y + C.h - 26); ctx.textBaseline = 'alphabetic';
  }
  function casPalm(x, y) {
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 14, 14, 5, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7A5A3A'; ctx.fillRect(x - 2.5, y - 4, 5, 18); ctx.fillStyle = '#5A3A22'; for (let k = 0; k < 4; k++) ctx.fillRect(x - 2.5, y - 2 + k * 4, 5, 1);
    for (let k = 0; k < 7; k++) { const a = k * TAU / 7 + Math.sin(gt * 1.2 + x) * 0.06; ctx.fillStyle = k % 2 ? '#2F8A4A' : '#3FAE5E'; ctx.save(); ctx.translate(x, y - 6); ctx.rotate(a); ctx.beginPath(); ctx.ellipse(10, 0, 11, 3.6, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  }
  function drawApotheke() { // v109: Eingang oben zur Nordallee
    const A = APO; if (!inView(A.x + A.w / 2, A.y + A.h / 2, 260)) return; const dk = lightK() > 0.25;
    if (!prReady()) { drawApoBau(A); return; } // v115: im Umbau, bis es einen Premium-Anbau gibt
    ctx.fillStyle = '#C9C2B4'; ctx.fillRect(A.x - 8, 0, A.w + 16, A.y); ctx.fillStyle = 'rgba(0,0,0,.06)'; for (let x = A.x - 8; x < A.x + A.w + 8; x += 20) ctx.fillRect(x, 0, 1, A.y);
    const g = bldBase(A, -1, 64, '#F2F4F7', '#DDE2E8', 'flat');
    ctx.fillStyle = '#2E9E5B'; ctx.fillRect(A.x, A.y + 58, A.w, 6);
    for (let k = 0; k < 12; k++) { ctx.fillStyle = k % 2 ? '#2E9E5B' : '#F4F4F8'; ctx.fillRect(A.x + 10 + k * 18.3, A.y, 18.3, 10); } ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(A.x + 10, A.y + 10, A.w - 20, 2);
    for (const wx of [A.x + 14, A.x + A.w - 94]) { ctx.fillStyle = dk ? '#FFF2C8' : '#9FD2E8'; ctx.fillRect(wx, A.y + 14, 80, 40); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.moveTo(wx + 8, A.y + 14); ctx.lineTo(wx + 24, A.y + 14); ctx.lineTo(wx + 8, A.y + 34); ctx.closePath(); ctx.fill();
      for (let r = 0; r < 2; r++) { ctx.fillStyle = '#E8ECF2'; ctx.fillRect(wx + 4, A.y + 26 + r * 14, 72, 2); for (let k = 0; k < 7; k++) { ctx.fillStyle = ['#F4F4F8', '#5FE584', '#4B8DFF', '#FFB547', '#E05A9A'][(k + r) % 5]; ctx.fillRect(wx + 7 + k * 10, A.y + 19 + r * 14, 6, 7); } }
      ctx.strokeStyle = '#B5BDC7'; ctx.lineWidth = 2; ctx.strokeRect(wx, A.y + 14, 80, 40); }
    ctx.fillStyle = '#9FD2E8'; ctx.fillRect(APO_AT.x - 18, A.y, 36, 44); ctx.strokeStyle = '#2E9E5B'; ctx.lineWidth = 3; ctx.strokeRect(APO_AT.x - 18, A.y, 36, 44); ctx.beginPath(); ctx.moveTo(APO_AT.x, A.y); ctx.lineTo(APO_AT.x, A.y + 44); ctx.stroke();
    ctx.fillStyle = '#2E9E5B'; rr(A.x + A.w / 2 - 66, g.ry0 + 16, 132, 24, 6); ctx.fill(); signTxt('APOTHEKE', A.x + A.w / 2, g.ry0 + 28.5, '900 14px sans-serif', '#F4F4F8');
    signTxt('Dr. Weber', A.x + 40, g.ry0 + 58, '700 8px sans-serif', '#10151C');
    const gx = A.x + A.w - 26, gy = g.ry0 + 30, p = 0.75 + 0.25 * Math.sin(gt * 2.5); ctx.save(); ctx.shadowColor = '#5FE584'; ctx.shadowBlur = 12 * p; ctx.fillStyle = 'rgba(46,200,100,' + p.toFixed(2) + ')'; ctx.fillRect(gx - 5, gy - 14, 10, 28); ctx.fillRect(gx - 14, gy - 5, 28, 10); ctx.restore();
    for (const px of [APO_AT.x - 36, APO_AT.x + 36]) { ctx.fillStyle = '#F4F4F8'; rr(px - 7, A.y - 12, 14, 12, 3); ctx.fill(); ctx.fillStyle = '#3F8A4A'; ctx.beginPath(); ctx.arc(px, A.y - 13, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#5FA855'; ctx.beginPath(); ctx.arc(px - 3, A.y - 16, 5, 0, TAU); ctx.fill(); }
    if (dk) glow(APO_AT.x, A.y - 4, 44, '200,255,220', 0.16);
  }
  function drawApoBau(A) { bcDraw('apobau' + (seaSnow() ? 'w' : ''), A.x - 12, -4, A.w + 34, A.y + A.h + 24, () => drawApoBau0(A)); } // v157
  function drawApoBau0(A) { // v115: geschlossene Apotheke mit Geruest, Brettern und Bauzaun
    ctx.fillStyle = '#C9C2B4'; ctx.fillRect(A.x - 8, 0, A.w + 16, A.y);
    const g = bldBase(A, -1, 64, '#D9D6CF', '#BDB8AE', 'flat');
    ctx.fillStyle = 'rgba(90,80,60,.25)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(A.x + 30 + k * 36, A.y + 50 - (k % 2) * 8, 16, 7, 0, 0, TAU); ctx.fill(); } // Wasserflecken
    ctx.fillStyle = '#7A7268'; ctx.fillRect(A.x, A.y + 58, A.w, 6);
    for (const wx of [A.x + 14, A.x + A.w - 94]) { ctx.fillStyle = '#3A3530'; ctx.fillRect(wx, A.y + 14, 80, 40); ctx.fillStyle = '#B08A5A'; for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(wx + 40, A.y + 22 + k * 12); ctx.rotate(k % 2 ? 0.08 : -0.06); ctx.fillRect(-44, -4, 88, 8); ctx.fillStyle = '#8A6A42'; ctx.fillRect(-40, -1, 2, 2); ctx.fillRect(38, -1, 2, 2); ctx.fillStyle = '#B08A5A'; ctx.restore(); } }
    ctx.fillStyle = '#3A3530'; ctx.fillRect(APO_AT.x - 18, A.y, 36, 44); ctx.fillStyle = '#B08A5A'; ctx.save(); ctx.translate(APO_AT.x, A.y + 22); ctx.rotate(0.6); ctx.fillRect(-26, -4, 52, 8); ctx.rotate(-1.2); ctx.fillRect(-26, -4, 52, 8); ctx.restore();
    ctx.strokeStyle = '#8A8F96'; ctx.lineWidth = 2; for (let x = A.x - 4; x <= A.x + A.w + 4; x += 40) { ctx.beginPath(); ctx.moveTo(x, g.ry0 + 4); ctx.lineTo(x, A.y + 64); ctx.stroke(); } // Geruest
    for (const y of [g.ry0 + 10, A.y + 4, A.y + 34]) { ctx.beginPath(); ctx.moveTo(A.x - 4, y); ctx.lineTo(A.x + A.w + 4, y); ctx.stroke(); }
    ctx.fillStyle = '#8A6A42'; ctx.fillRect(A.x - 4, A.y + 2, A.w + 8, 4);
    ctx.fillStyle = '#7A7268'; rr(A.x + A.w / 2 - 66, g.ry0 + 16, 132, 24, 6); ctx.fill(); signTxt('APOTHEKE', A.x + A.w / 2, g.ry0 + 28.5, '900 14px sans-serif', '#B5AFA4');
    ctx.save(); ctx.translate(A.x + A.w / 2, g.ry0 + 28); ctx.rotate(-0.12); ctx.fillStyle = '#F2C14E'; ctx.fillRect(-58, -8, 116, 16); ctx.fillStyle = '#20232C'; ctx.font = '900 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('WEGEN UMBAU GESCHLOSSEN', 0, 0.5); ctx.restore();
    const gx = A.x + A.w - 26, gy = g.ry0 + 30; ctx.fillStyle = '#5A6068'; ctx.fillRect(gx - 5, gy - 14, 10, 28); ctx.fillRect(gx - 14, gy - 5, 28, 10); // Kreuz aus
    for (let x = A.x - 2; x < A.x + A.w; x += 26) { ctx.fillStyle = '#E8E2D0'; ctx.fillRect(x, A.y - 16, 24, 12); ctx.fillStyle = '#E05555'; for (let k = 0; k < 3; k++) ctx.fillRect(x + 2 + k * 8, A.y - 16, 4, 12); ctx.fillStyle = '#5A6068'; ctx.fillRect(x, A.y - 4, 2, 4); } // Bauzaun
    ctx.textBaseline = 'alphabetic';
  }
  function drawPrPad() { // unauffaelliges Besucher-Feld neben dem Lager-Tor
    const P = PR_PAD; if (!inView(P.x, P.y, 60)) return;
    ctx.fillStyle = 'rgba(200,210,225,.08)'; rr(P.x - 18, P.y - 14, 36, 28, 5); ctx.fill();
    ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(200,210,225,.32)'; ctx.lineWidth = 1; rr(P.x - 18, P.y - 14, 36, 28, 5); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(200,210,225,.4)'; ctx.font = '700 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('BESUCH', P.x, P.y + 1); ctx.textBaseline = 'alphabetic';
  }
  function drawPremLamp(x, y, p, i) { // weisses Profi-Licht ueber den Hydro-Stationen
    const on = p && p.s >= 1, a = on ? 0.9 + 0.1 * Math.sin(gt * 2 + i) : 0.35;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 2, x, y, 36); g.addColorStop(0, 'rgba(235,245,255,' + (0.28 * a).toFixed(3) + ')'); g.addColorStop(0.6, 'rgba(170,200,255,' + (0.10 * a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(160,190,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 36, 0, TAU); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#C9D2DC'; rr(x - 22, y - 34, 44, 7, 3); ctx.fill(); ctx.fillStyle = '#F4F7FA'; for (let k = 0; k < 6; k++) ctx.fillRect(x - 19 + k * 7, y - 32, 5, 3);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(220,235,255,' + (0.35 * a).toFixed(3) + ')'; ctx.fillRect(x - 22, y - 28, 44, 3); ctx.restore();
  }
  function drawBizRoom() { // v100: Hinterzimmer je nach Laden
    const k = bizIn || 'pizza', I = IN, th = { pizza: ['#5A3424', '#B5523A', '#F2E2C4'], gym: ['#2B3039', '#4A5260', '#E05555'], club: ['#160F22', '#2A1E3A', '#FF5CA8'] }[k] || ['#333', '#555', '#fff'];
    ctx.fillStyle = th[1]; ctx.fillRect(I.x0 - 12, I.y0 - 12, I.x1 - I.x0 + 24, I.y1 - I.y0 + 24); ctx.fillStyle = th[0]; ctx.fillRect(I.x0, I.y0, I.x1 - I.x0, I.y1 - I.y0);
    ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = I.x0; x <= I.x1; x += 32) { ctx.moveTo(x, I.y0); ctx.lineTo(x, I.y1); } for (let y = I.y0; y <= I.y1; y += 32) { ctx.moveTo(I.x0, y); ctx.lineTo(I.x1, y); } ctx.stroke();
    roomDepth(I.x0, I.y0, I.x1, I.y1); ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(I.x0 - 12, I.y0 - 12, I.x1 - I.x0 + 24, 1.5); // v148
    if (k === 'pizza') { ctx.fillStyle = '#7A4A32'; rr(70, 70, 150, 60, 10); ctx.fill(); ctx.fillStyle = '#2A1A12'; ctx.beginPath(); ctx.arc(145, 104, 22, Math.PI, 0); ctx.fill(); glow(145, 100, 40, '255,130,50', 0.4 + 0.15 * Math.sin(gt * 6)); for (let i = 0; i < 4; i++) { const x = 190 + (i % 2) * 150, y = 250 + Math.floor(i / 2) * 120; ctx.fillStyle = '#E8DCC0'; ctx.beginPath(); ctx.arc(x, y, 26, 0, TAU); ctx.fill(); ctx.strokeStyle = '#D33F3F'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 22, 0, TAU); ctx.stroke(); ctx.fillStyle = '#E8B84A'; ctx.beginPath(); ctx.arc(x, y, 9, 0, TAU); ctx.fill(); }
      for (let i = 0; i < 6; i++) { ctx.fillStyle = '#C49A6C'; ctx.fillRect(330 + (i % 3) * 30, 70 + Math.floor(i / 3) * 26, 24, 20); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fillRect(330 + (i % 3) * 30, 70 + Math.floor(i / 3) * 26 + 8, 24, 2); } }
    else if (k === 'gym') { for (let i = 0; i < 3; i++) { const x = 160 + i * 100; ctx.fillStyle = '#1A1D22'; rr(x, 230, 60, 120, 8); ctx.fill(); ctx.fillStyle = '#3A3F47'; ctx.fillRect(x + 8, 240, 44, 100); ctx.fillStyle = '#E05555'; ctx.fillRect(x + 10, 330, 40, 6); } for (let i = 0; i < 5; i++) { ctx.fillStyle = '#5E6670'; ctx.fillRect(80 + i * 40, 80, 8, 30); ctx.fillStyle = '#20262E'; ctx.fillRect(76 + i * 40, 76, 16, 6); ctx.fillRect(76 + i * 40, 108, 16, 6); } ctx.fillStyle = '#B5BDC7'; ctx.fillRect(420, 380, 120, 8); for (const x of [420, 532]) { ctx.fillStyle = '#20262E'; ctx.fillRect(x - 4, 370, 12, 28); } }
    else { for (let i = 0; i < 25; i++) { const x = 170 + (i % 5) * 50, y = 230 + Math.floor(i / 5) * 40, c = ['255,92,168', '91,232,255', '255,210,74'][(i + Math.floor(gt * 3)) % 3]; ctx.fillStyle = 'rgba(' + c + ',.45)'; ctx.fillRect(x, y, 46, 36); } ctx.fillStyle = '#2B1A3A'; rr(330, 70, 160, 50, 8); ctx.fill(); ctx.fillStyle = '#FF5CA8'; ctx.fillRect(330, 70, 160, 3); for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#5FE584', '#4BC8FF', '#FFD24A'][i % 3]; ctx.fillRect(340 + i * 24, 84, 10, 22); } }
    { const R0 = BIZ_SHELF, a = (G.biz[k] && bizInv(k)) || [], n = stashSum(a); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(R0.x + 5, R0.y + 6, R0.w, R0.h); ctx.fillStyle = '#4A3A2C'; ctx.fillRect(R0.x, R0.y, R0.w, R0.h); ctx.fillStyle = '#6A5440'; for (let s = 0; s < 5; s++) ctx.fillRect(R0.x, R0.y + 4 + s * 30, R0.w, 4);
      for (let i = 0; i < Math.min(20, Math.ceil(n / Math.max(1, BIZ[k].shelf / 20))); i++) { ctx.fillStyle = ['#C9A064', '#A07A4A', '#8A6A3A', '#5FE584'][i % 4]; ctx.fillRect(R0.x + 4 + (i % 4) * 10, R0.y + 12 + Math.floor(i / 4) * 30, 8, 14); }
      ctx.save(); ctx.translate(R0.x + R0.w + 12, R0.y + R0.h / 2); ctx.rotate(-Math.PI / 2); signTxt('REGAL · ' + n + '/' + BIZ[k].shelf, 0, 0, '800 9px sans-serif', 'rgba(255,255,255,.65)'); ctx.restore(); }
    // Tresor
    const S0 = BIZ_SAFE; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(S0.x - 22, S0.y - 26, 50, 44); ctx.fillStyle = '#5E6670'; rr(S0.x - 24, S0.y - 30, 48, 40, 5); ctx.fill(); ctx.fillStyle = '#8C96A3'; rr(S0.x - 20, S0.y - 26, 40, 32, 4); ctx.fill(); ctx.strokeStyle = '#20262E'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(S0.x, S0.y - 10, 8, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(S0.x, S0.y - 10); ctx.lineTo(S0.x + Math.cos(gt) * 7, S0.y - 10 + Math.sin(gt) * 7); ctx.stroke();
    const st = G.biz[k]; if (st && st.dirty > 0) { ctx.fillStyle = '#5FE584'; for (let i = 0; i < Math.min(6, Math.ceil(st.dirty / (BIZ[k].cap / 6))); i++) ctx.fillRect(S0.x - 18 + i * 6, S0.y + 14, 5, 3); }
    signTxt('TRESOR', S0.x, S0.y + 26, '900 9px sans-serif', 'rgba(255,255,255,.7)');
    signTxt((BIZ[k] || {}).name ? BIZ[k].name.toUpperCase() + ' · HINTERZIMMER' : '', 300, 470, '800 11px sans-serif', th[2]);
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(BIZ_EXIT.x - 30, I.y1 - 6, 60, 8); signTxt('AUSGANG', BIZ_EXIT.x, I.y1 - 16, '900 9px sans-serif', th[2]);
  }
  function emptyRoomProps(I) { // v148: leerer Mietraum mit Umzugskartons, Palette, Baulampe, Kabel und Leiter
    const F = c => { ctx.fillStyle = c; }, box = (x, y, w, h, tape) => { F('rgba(0,0,0,.3)'); ctx.fillRect(x + 3, y + 4, w, h); F('#B8864E'); ctx.fillRect(x, y, w, h); F('#D2A06A'); ctx.fillRect(x, y, w, h * 0.3); F('rgba(0,0,0,.12)'); ctx.fillRect(x + w / 2 - 0.5, y, 1, h); if (tape) { F('rgba(230,220,190,.7)'); ctx.fillRect(x + w / 2 - 2, y, 4, h * 0.3); } };
    const px = I.x0 + 30, py = I.y1 - 90; F('rgba(0,0,0,.3)'); ctx.fillRect(px + 3, py + 4, 70, 48); F('#9A7A50'); for (let k = 0; k < 5; k++) ctx.fillRect(px, py + k * 10, 70, 7); F('#7A5A38'); for (const xx of [px + 4, px + 31, px + 58]) ctx.fillRect(xx, py, 8, 47);
    box(px + 6, py + 4, 28, 22, 1); box(px + 36, py + 8, 26, 20, 1); box(px + 18, py - 14, 26, 20, 0);
    box(I.x1 - 120, I.y0 + 30, 30, 24, 1); box(I.x1 - 86, I.y0 + 34, 24, 20, 0);
    { const lx = I.x0 + 60, ly = I.y0 + 70; F('rgba(0,0,0,.3)'); ctx.beginPath(); ctx.ellipse(lx + 2, ly + 16, 12, 4, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = '#2A2F38'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lx - 10, ly + 16); ctx.lineTo(lx, ly - 6); ctx.lineTo(lx + 10, ly + 16); ctx.moveTo(lx, ly - 6); ctx.lineTo(lx, ly + 16); ctx.stroke(); F('#F2C14E'); rr(lx - 9, ly - 16, 18, 12, 2); ctx.fill(); F('#FFF6D0'); ctx.fillRect(lx - 6, ly - 13, 12, 6); glow(lx, ly - 4, 60, '255,240,200', 0.22);
      ctx.strokeStyle = '#14161C'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(lx, ly + 16); ctx.bezierCurveTo(lx + 60, ly + 40, lx + 20, ly + 120, lx + 110, ly + 150); ctx.bezierCurveTo(lx + 180, ly + 170, lx + 240, ly + 130, lx + 300, ly + 170); ctx.stroke(); F('#E05555'); rr(lx + 296, ly + 166, 10, 7, 2); ctx.fill(); }
    { const lx = I.x1 - 70, ly = I.y1 - 150; ctx.save(); ctx.translate(lx, ly); ctx.rotate(0.25); F('rgba(0,0,0,.25)'); ctx.fillRect(3, 4, 20, 90); F('#9AA3AD'); ctx.fillRect(0, 0, 3, 90); ctx.fillRect(17, 0, 3, 90); for (let y = 6; y < 90; y += 12) ctx.fillRect(0, y, 20, 2.4); ctx.restore(); }
    { const rx = I.x0 + 190, ry = I.y1 - 60; F('rgba(0,0,0,.25)'); ctx.beginPath(); ctx.ellipse(rx + 2, ry + 6, 30, 7, 0, 0, TAU); ctx.fill(); F('rgba(200,220,235,.55)'); rr(rx - 30, ry - 6, 60, 12, 6); ctx.fill(); F('rgba(255,255,255,.4)'); ctx.fillRect(rx - 26, ry - 4, 52, 2); }
  }
  function drawPremiumRoom() {
    const visit = prVisit && mp.friends[prVisit] && mp.friends[prVisit].gs ? mp.friends[prVisit] : null;
    if (prVisit && !visit) { roomLeave(); return; }
    const P = visit ? visit.gs.pr : G.pr, setUp = visit ? true : (P.own && G.lager.own), I = IN;
    prOver = visit ? P : null;
    try {
      // Reinraum: helle Waende, glatter Boden mit Fliesen
      ctx.fillStyle = '#E4E8EE'; ctx.fillRect(I.x0 - 12, I.y0 - 12, I.x1 - I.x0 + 24, 12); ctx.fillRect(I.x0 - 12, I.y1, I.x1 - I.x0 + 24, 12); ctx.fillRect(I.x0 - 12, I.y0 - 12, 12, I.y1 - I.y0 + 24); ctx.fillRect(I.x1, I.y0 - 12, 12, I.y1 - I.y0 + 24);
      ctx.fillStyle = '#2F3A44'; ctx.fillRect(I.x0, I.y0, I.x1 - I.x0, I.y1 - I.y0);
      ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 1; ctx.beginPath(); for (let x = I.x0; x <= I.x1; x += 30) { ctx.moveTo(x, I.y0); ctx.lineTo(x, I.y1); } for (let y = I.y0; y <= I.y1; y += 30) { ctx.moveTo(I.x0, y); ctx.lineTo(I.x1, y); } ctx.stroke();
      roomDepth(I.x0, I.y0, I.x1, I.y1); if (!setUp) emptyRoomProps(I); // v148
      ctx.fillStyle = 'rgba(95,229,132,.5)'; ctx.fillRect(I.x0, I.y0, I.x1 - I.x0, 2); // LED-Leiste
      ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '800 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(visit ? 'MIETRAUM VON ' + visit.name.toUpperCase() : 'MIETRAUM · PREMIUM-ANBAU', 326, 24);
      // Klimaanlage und Anzeige
      ctx.fillStyle = '#C9D2DC'; rr(250, 54, 70, 22, 4); ctx.fill(); ctx.fillStyle = '#8C96A3'; for (let k = 0; k < 5; k++) ctx.fillRect(256 + k * 12, 60, 8, 2); ctx.fillRect(256, 68, 58, 2);
      ctx.fillStyle = '#10151C'; rr(340, 54, 64, 22, 4); ctx.fill(); ctx.fillStyle = '#5FE584'; ctx.font = '800 8px sans-serif'; ctx.fillText('24°C · 55%', 372, 65.5);
      // Ausgang
      ctx.fillStyle = '#5A6270'; ctx.fillRect(PR_EXIT.x - 26, I.y1 - 4, 52, 8); ctx.fillStyle = '#5FE584'; ctx.fillRect(PR_EXIT.x - 26, I.y1 - 4, 52, 2);
      ctx.fillStyle = '#5FE584'; ctx.font = '900 9px sans-serif'; ctx.fillText('AUSGANG', PR_EXIT.x, I.y1 - 14);
      // Regal (Lager)
      { const S0 = PR_SHELF; ctx.fillStyle = '#3A414B'; ctx.fillRect(S0.x, S0.y, S0.w, S0.h); ctx.fillStyle = '#5A6270'; for (let k = 0; k < 6; k++) ctx.fillRect(S0.x, S0.y + 6 + k * 38, S0.w, 3);
        const st = visit ? 0 : stashSum(G.lager.inv); for (let k = 0; k < Math.min(18, Math.ceil(st / 10)); k++) { ctx.fillStyle = ['#C9A064', '#A07A4A', '#8A6A3A'][k % 3]; ctx.fillRect(S0.x + 4 + (k % 3) * 11, S0.y + 12 + Math.floor(k / 3) * 38, 9, 16); }
        ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = '700 9px sans-serif'; ctx.save(); ctx.translate(S0.x - 6, S0.y + S0.h / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('LAGER-REGAL', 0, 0); ctx.restore(); }
      if (!setUp) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.font = '700 12px sans-serif'; ctx.fillText('Hier passt ein Premium-Anbau hin', 300, 200); ctx.font = '600 10px sans-serif'; ctx.fillText('Am Regal rechts einrichten (A)', 300, 218); ctx.textBaseline = 'alphabetic'; mpDraw(f => f.rg === (prVisit || mp.id) + ':r'); return; }
      ctx.textBaseline = 'alphabetic';
      // Hydro-Stationen
      const n = Math.min(PR_MAX, P.n);
      for (let i = 0; i < PR_MAX; i++) {
        const q = PR_POTS[i], p = P.pots[i];
        if (i >= n) { slotSq(q.x, q.y, !visit && i === n, 'rgba(60,70,84,.5)', !visit && i === n ? fmt(prPotCost(n)) : ''); continue; } // v147
        ctx.fillStyle = '#F2F4F7'; rr(q.x - 20, q.y - 20, 40, 40, 7); ctx.fill(); ctx.fillStyle = '#5BA8D8'; rr(q.x - 16, q.y - 16, 32, 32, 5); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x - 6 + Math.sin(gt + i) * 2, q.y + 8, 4, 0, Math.PI); ctx.stroke();
        if (p.s) drawPlantAt(q.x, q.y, p, 0);
        drawPremLamp(q.x, q.y, p, i);
        if (p.s === 1 && p.w < 0.3) drawDrop(q.x, q.y, p);
        ctx.fillStyle = '#2E9E5B'; rr(q.x + 9, q.y + 12, 13, 8, 2); ctx.fill(); ctx.fillStyle = '#F4F4F8'; ctx.font = '900 6px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A+', q.x + 15.5, q.y + 16.3); ctx.textBaseline = 'alphabetic';
      }
      drawFields(AREAS.pr);
      drawRackFor(AREAS.pr); drawTableFor(AREAS.pr);
    } finally { prOver = null; }
    mpDraw(f => f.rg === (prVisit || mp.id) + ':r');
  }
  function drawLager() { const L0 = LAGER; if (!inView(L0.x + L0.w / 2, L0.y + L0.h / 2, 220)) return; const own = G && G.lager && G.lager.own, n = own && G.lager ? Math.min(6, Math.ceil(stashSum(G.lager.inv) / 40)) : 0, x0 = Math.min(L0.x, LAGER_AT.x - 70) - 6, x1 = Math.max(L0.x + L0.w + 8, LAGER_AT.x + 70) + 6;
    bcDraw('lager' + (own ? 1 : 0) + (own ? G.lager.lv : 0) + n + (lightK() > 0.25 ? 'd' : 'l'), x0, L0.y - 46, x1 - x0, L0.h + 60, drawLager0); } // v157
  function drawLager0() { // v72: im Gewerbegebiet an der Hauptstrasse, Rolltor oben zur Strasse
    const L0 = LAGER; if (!inView(L0.x + L0.w / 2, L0.y + L0.h / 2, 220)) return;
    const own = G && G.lager && G.lager.own, lv = own ? G.lager.lv : 0, dk = lightK() > 0.25, top = L0.y - 40;
    ctx.fillStyle = '#2C3038'; ctx.fillRect(LAGER_AT.x - 70, top, 140, L0.y - top + 4); // Zufahrt (v97: von der Nordallee)
    ctx.fillStyle = 'rgba(242,193,78,.5)'; ctx.fillRect(LAGER_AT.x - 70, top + 4, 4, L0.y - top - 4); ctx.fillRect(LAGER_AT.x + 66, top + 4, 4, L0.y - top - 4);
    ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.fillRect(L0.x + 7, L0.y + 9, L0.w, L0.h);
    ctx.fillStyle = '#5E6A78'; ctx.fillRect(L0.x, L0.y, L0.w, L0.h);
    ctx.fillStyle = '#6E7B8A'; for (let x = L0.x + 4; x < L0.x + L0.w - 2; x += 8) ctx.fillRect(x, L0.y + 4, 4, L0.h - 8);
    ctx.fillStyle = '#46505C'; ctx.fillRect(L0.x, L0.y + L0.h - 10 - lv * 6, L0.w, 10 + lv * 6); // Traufe, hoeher mit jedem Stockwerk
    for (let s2 = 0; s2 <= lv; s2++) { const wy = L0.y + L0.h - 34 - s2 * 28; for (let k = 0; k < 8; k++) { if (k === 3 || k === 4) continue; ctx.fillStyle = dk ? ((k + s2) % 3 ? '#FFE08A' : '#2B3442') : '#A9CDE0'; ctx.fillRect(L0.x + 16 + k * 35, wy, 22, 10); } }
    const dx = LAGER_AT.x - 40, dy = L0.y; ctx.fillStyle = '#2B3039'; ctx.fillRect(dx, dy, 80, 58); // Rolltor
    ctx.fillStyle = own ? '#8C96A3' : '#59626E'; for (let y = dy + 3; y < dy + 56; y += 6) ctx.fillRect(dx + 3, y, 74, 3);
    ctx.fillStyle = '#F2C14E'; ctx.fillRect(dx - 2, dy + 56, 84, 3);
    ctx.fillStyle = '#20262E'; ctx.fillRect(L0.x + L0.w / 2 - 40, L0.y + 66, 80, 18); ctx.fillStyle = '#F2C14E'; ctx.font = '900 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(own ? 'MIETRAUM' : 'ZU MIETEN', L0.x + L0.w / 2, L0.y + 75.5); ctx.textBaseline = 'alphabetic';
    if (own && G.lager && stashSum(G.lager.inv)) { ctx.fillStyle = '#8A5A32'; for (let k = 0; k < Math.min(6, Math.ceil(stashSum(G.lager.inv) / 40)); k++) ctx.fillRect(L0.x + 12 + k * 14, L0.y + 92, 12, 12); }
  }
  // v72: Autohof aufgewertet: Showroom mit Glasfront, Drehteller mit dem Topmodell, Wimpelketten, Fahnen und Leuchtpylon
  const AH_SHOW = [['mini', 0, 2], ['van', 1, 5], ['muscle', 2, 0], ['sport', 3, 1]];
  function drawAutohof() {
    const A0 = AH_LOT, H0 = AUTOHOF, dk = lightK() > 0.25;
    if (inView(A0.x + A0.w / 2, A0.y + A0.h / 2, 420)) {
      bcDraw('ahfloor', A0.x - 2, A0.y - 2, A0.w + 4, A0.h + 4, () => { // v157: Boden als fertiges Bild
        ctx.fillStyle = '#383E47'; ctx.fillRect(A0.x, A0.y, A0.w, A0.h);
        ctx.fillStyle = 'rgba(255,255,255,.035)'; for (let x = A0.x; x < A0.x + A0.w; x += 40) for (let y = A0.y + ((x / 40) % 2) * 20; y < A0.y + A0.h; y += 40) ctx.fillRect(x, y, 20, 20);
        ctx.fillStyle = '#5A636F'; ctx.fillRect(A0.x, A0.y, A0.w, 4); ctx.fillRect(A0.x, A0.y, 4, A0.h); ctx.fillRect(A0.x + A0.w - 4, A0.y, 4, A0.h);
      });
      // Wimpelketten quer ueber den Platz
      for (const [y0, y1] of [[A0.y + 14, A0.y + 30], [A0.y + 150, A0.y + 136]]) {
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(H0.x + H0.w + 10, y0); ctx.quadraticCurveTo(A0.x + A0.w * 0.7, y1 + 10, A0.x + A0.w - 10, y0); ctx.stroke();
        for (let k = 0; k < 14; k++) { const t = k / 13, bx = (1 - t) * (1 - t) * (H0.x + H0.w + 10) + 2 * (1 - t) * t * (A0.x + A0.w * 0.7) + t * t * (A0.x + A0.w - 10), by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y1 + 10) + t * t * y0, fl = Math.sin(gt * 4 + k) * 1.5; ctx.fillStyle = ['#D33F3F', '#F2C14E', '#2F6FD6', '#3FAE6A', '#F4F4F8'][k % 5]; ctx.beginPath(); ctx.moveTo(bx - 5, by); ctx.lineTo(bx + 5, by); ctx.lineTo(bx + fl, by + 9); ctx.fill(); }
      }
      // Showroom
      bcDraw('ahshow' + (dk ? 1 : 0), H0.x - 4, H0.y - 4, H0.w + 16, H0.h + 20, () => { // v157: Showroom als fertiges Bild
        ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.fillRect(H0.x + 7, H0.y + 9, H0.w, H0.h);
        ctx.fillStyle = '#E4E8EE'; ctx.fillRect(H0.x, H0.y, H0.w, H0.h); ctx.fillStyle = '#C3CAD3'; ctx.fillRect(H0.x, H0.y, H0.w, 14); ctx.fillStyle = 'rgba(0,0,0,.06)'; for (let x = H0.x + 20; x < H0.x + H0.w; x += 40) ctx.fillRect(x, H0.y + 14, 1, H0.h - 60);
        const gy = H0.y + H0.h - 46, gl = ctx.createLinearGradient(0, gy, 0, gy + 42); gl.addColorStop(0, dk ? '#FFE9B0' : '#9CC9E6'); gl.addColorStop(1, dk ? '#E0B870' : '#5E94BC');
        ctx.fillStyle = gl; ctx.fillRect(H0.x + 6, gy, H0.w - 12, 42); // Glasfront
        [['super', 7], ['sport', 1]].forEach(([id, c], k) => { ctx.save(); ctx.globalAlpha = 0.55; drawCar(H0.x + 70 + k * 150, gy + 22, 0, id, c, null, true); ctx.restore(); });
        ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let x = H0.x + 6; x < H0.x + H0.w - 6; x += 36) ctx.fillRect(x, gy, 2, 42); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(H0.x + 30, gy); ctx.lineTo(H0.x + 60, gy); ctx.lineTo(H0.x + 30, gy + 42); ctx.lineTo(H0.x + 6, gy + 42); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#20262E'; ctx.fillRect(AH_AT.x - 16, gy + 2, 32, 40); ctx.fillStyle = dk ? 'rgba(255,233,168,.6)' : 'rgba(156,201,230,.6)'; ctx.fillRect(AH_AT.x - 14, gy + 4, 13, 36); ctx.fillRect(AH_AT.x + 1, gy + 4, 13, 36); // Eingang
        ctx.fillStyle = '#20262E'; rr(H0.x + H0.w / 2 - 74, H0.y + 22, 148, 26, 6); ctx.fill(); const sg = ctx.createLinearGradient(H0.x, 0, H0.x + H0.w, 0); sg.addColorStop(0, '#FFB547'); sg.addColorStop(1, '#FF6A3D');
        ctx.fillStyle = sg; ctx.font = '900 15px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('AUTOHOF', H0.x + H0.w / 2, H0.y + 35.5);
        ctx.fillStyle = '#9AA6B3'; ctx.font = '700 7px sans-serif'; ctx.fillText('NEU- UND SPORTWAGEN', H0.x + H0.w / 2, H0.y + 56); ctx.textBaseline = 'alphabetic';
        for (const px of [AH_AT.x - 30, AH_AT.x + 30]) { ctx.fillStyle = '#5A3B26'; ctx.fillRect(px - 6, gy + 44, 12, 9); ctx.fillStyle = '#2C6844'; ctx.beginPath(); ctx.arc(px, gy + 42, 8, 0, TAU); ctx.fill(); } // Kuebelpflanzen
      });
      const gy = H0.y + H0.h - 46;
      // Drehteller mit dem Supersportwagen
      const tx = A0.x + 470, ty = A0.y + 90; ctx.fillStyle = 'rgba(0,0,0,.3)'; ell(tx + 3, ty + 4, 50, 34); ctx.fill(); ctx.fillStyle = '#C9CED6'; ell(tx, ty, 50, 34); ctx.fill(); ctx.fillStyle = '#E8ECF2'; ell(tx, ty, 44, 29); ctx.fill();
      ctx.strokeStyle = 'rgba(255,181,71,' + (0.5 + 0.3 * Math.sin(gt * 3)).toFixed(2) + ')'; ctx.lineWidth = 2; ell(tx, ty, 47, 31.5); ctx.stroke();
      drawCar(tx, ty, gt * 0.5, 'super', VEH_BY.super.col, null, true);
      const lock = (id, x, y) => { const v = VEH_BY[id]; if (G && G.rep < v.rep && !G.veh.owned[id]) { ctx.fillStyle = 'rgba(16,21,28,.75)'; ctx.beginPath(); ctx.arc(x + 16, y - 16, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#FFB547'; ctx.font = '800 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(v.rep), x + 16, y - 16); ctx.textBaseline = 'alphabetic'; } };
      lock('super', tx, ty);
      // Ausstellungsreihe zur Strasse mit Preisschildern
      AH_SHOW.forEach(([id, k, c]) => {
        const x = A0.x + 380 + k * 74, y = A0.y + A0.h - 52, v = VEH_BY[id];
        ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(x - 32, y - 34, 2, 64);
        drawCar(x, y, Math.PI / 2, id, c, null, true); lock(id, x, y);
        ctx.fillStyle = '#F4F6F8'; rr(x - 17, y + 24, 34, 11, 3); ctx.fill(); ctx.fillStyle = '#D33F3F'; ctx.font = '800 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(Math.round(v.cost / 1000) + 'k €', x, y + 30); ctx.textBaseline = 'alphabetic';
      });
      // Fahnen und Leuchtpylon an der Ecke
      for (let k = 0; k < 3; k++) { const fx = A0.x + 340 + k * 44, fy = A0.y + 20; ctx.fillStyle = '#C9D2DC'; ctx.fillRect(fx - 1, fy, 2, 46); ctx.fillStyle = ['#FFB547', '#2F6FD6', '#F4F4F8'][k]; ctx.beginPath(); ctx.moveTo(fx + 1, fy + 2); for (let q = 0; q <= 18; q += 3) ctx.lineTo(fx + 1 + q, fy + 2 + Math.sin(gt * 3.4 + q * 0.5 + k) * 1.4); for (let q = 18; q >= 0; q -= 3) ctx.lineTo(fx + 1 + q, fy + 14 + Math.sin(gt * 3.4 + q * 0.5 + k) * 1.4); ctx.closePath(); ctx.fill(); }
      const py = A0.x + A0.w - 40, pyy = A0.y + A0.h - 20; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(py - 8, pyy - 4, 22, 10); ctx.fillStyle = '#20262E'; ctx.fillRect(py - 3, pyy - 70, 6, 72); rr(py - 22, pyy - 118, 44, 54, 6); ctx.fill();
      ctx.fillStyle = dk ? '#FFB547' : '#E8963A'; rr(py - 18, pyy - 114, 36, 46, 4); ctx.fill(); ctx.fillStyle = '#20262E'; ctx.font = '900 22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A', py, pyy - 96); ctx.font = '800 6px sans-serif'; ctx.fillText('AUTOHOF', py, pyy - 76); ctx.textBaseline = 'alphabetic';
    }
    const P0 = PARK_LOT;
    if (inView(P0.x + P0.w / 2, P0.y + P0.h / 2, 300)) { // Parkplatz mit ein paar abgestellten Autos
      bcDraw('ahpark' + (lightK() > 0.25 ? 1 : 0) + (lightK() > 0.3 ? 1 : 0), P0.x - 8, P0.y - 8, P0.w + 16, P0.h + 16, () => { // v157: Parkplatz als fertiges Bild
        ctx.fillStyle = '#2C3038'; ctx.fillRect(P0.x, P0.y, P0.w, P0.h); ctx.fillStyle = 'rgba(255,255,255,.4)'; for (let k = 0; k <= 5; k++) { ctx.fillRect(P0.x + 20 + k * 56, P0.y + 20, 2, 60); ctx.fillRect(P0.x + 20 + k * 56, P0.y + 180, 2, 60); }
        ctx.fillStyle = '#20262E'; ctx.fillRect(P0.x + P0.w / 2 - 22, P0.y + 119, 44, 22); ctx.fillStyle = '#4B8DFF'; ctx.font = '900 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('P', P0.x + P0.w / 2, P0.y + 131); ctx.textBaseline = 'alphabetic';
        [[0, 'mini', 0], [2, 'van', 5], [3, 'muscle', 4], [1, 'sport', 9], [4, 'mini', 3], [0, 'van', 2]].forEach(([k, id, c], i) => drawCar(P0.x + 48 + k * 56, P0.y + (i < 3 ? 50 : 210), Math.PI / 2, id, c, null, true));
      });
    }
  }
  function drawWerk() { const L0 = WS_LOT, W0 = WERK; if (!inView(L0.x + L0.w / 2, L0.y + L0.h / 2, 260)) return; const x0 = Math.min(L0.x, W0.x) - 6, y0 = Math.min(L0.y, W0.y) - 6, x1 = Math.max(L0.x + L0.w, W0.x + W0.w + 8) + 6, y1 = Math.max(L0.y + L0.h, W0.y + W0.h + 10) + 6;
    bcDraw('werk' + (lightK() > 0.25 ? 1 : 0), x0, y0, x1 - x0, y1 - y0, drawWerk0); } // v157
  function drawWerk0() { // v69: Autowerkstatt im Sueden an der Suedstrasse
    const L0 = WS_LOT, W0 = WERK; if (!inView(L0.x + L0.w / 2, L0.y + L0.h / 2, 260)) return;
    const dk = lightK() > 0.25;
    ctx.fillStyle = '#2C3038'; ctx.fillRect(L0.x, L0.y, L0.w, L0.h); ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 0; k < 6; k++) { ell(L0.x + 30 + k * 70, L0.y + 40 + (k % 2) * 10, 10, 4); ctx.fill(); } // Oelflecken
    ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.fillRect(W0.x + 7, W0.y + 9, W0.w, W0.h);
    ctx.fillStyle = '#C9CED6'; ctx.fillRect(W0.x, W0.y, W0.w, W0.h); ctx.fillStyle = '#E8833A'; ctx.fillRect(W0.x, W0.y, W0.w, 14);
    for (let k = 0; k < 3; k++) { const bx = W0.x + 18 + k * 104; ctx.fillStyle = dk ? '#FFE9A8' : '#3A3F47'; ctx.fillRect(bx, W0.y + 20, 86, 60); ctx.fillStyle = 'rgba(0,0,0,.35)'; for (let y = W0.y + 22; y < W0.y + 78; y += 7) ctx.fillRect(bx + 2, y, 82, 2); if (k === 1) { ctx.fillStyle = '#F2C14E'; ctx.fillRect(bx + 10, W0.y + 72, 66, 4); } }
    ctx.fillStyle = '#20262E'; ctx.fillRect(W0.x + W0.w / 2 - 70, W0.y + 88, 140, 20); ctx.fillStyle = '#E8833A'; ctx.font = '900 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('AUTOWERKSTATT', W0.x + W0.w / 2, W0.y + 98.5); ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#1D2129'; ctx.fillRect(WS_AT.x - 18, W0.y - 3, 36, 5);
    // Reifenstapel und Werkzeugwagen
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#16181C'; ctx.beginPath(); ctx.arc(L0.x + 22, L0.y + 70 + k * 3 - k * 6, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#3A3F47'; ctx.beginPath(); ctx.arc(L0.x + 22, L0.y + 70 + k * 3 - k * 6, 4, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#D33F3F'; ctx.fillRect(L0.x + L0.w - 40, L0.y + 60, 22, 14); ctx.fillStyle = '#9AA6B3'; ctx.fillRect(L0.x + L0.w - 38, L0.y + 62, 18, 3);
  }
  function drawContainers() {
    for (const c of CONTAINERS) { if (!inView(c[0] + c[2] / 2, c[1] + c[3] / 2, 120)) continue; const [x, y, w, h, col] = c, hor = w > h;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x + 5, y + 6, w, h); ctx.fillStyle = col; ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(0,0,0,.18)';
      if (hor) for (let k = x + 4; k < x + w - 2; k += 6) ctx.fillRect(k, y + 2, 2, h - 4); else for (let k = y + 4; k < y + h - 2; k += 6) ctx.fillRect(x + 2, k, w - 4, 2);
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x, y, w, 2); }
  }


  // ---------- Autofahren (v70) ----------
  // Joystick lenkt, A gibt Gas (schneller), B bremst. Scharf lenken bei hoher Fahrt laesst das Heck ausbrechen (Drift),
  // B in der Kurve wirkt als Handbremse und macht den Drift staerker. Autos auf der Karte sind feste Hindernisse.
  const drift = { on: false, score: 0, mult: 1, t: 0, idle: 0 };
  function carBump() {
    const r = 12; let hit = false;
    const test = (cx, cy, hw, hh) => {
      const nx = clamp(player.x, cx - hw, cx + hw), ny = clamp(player.y, cy - hh, cy + hh), dx = player.x - nx, dy = player.y - ny, d2 = dx * dx + dy * dy; if (d2 >= r * r) return;
      hit = true; if (d2 > 1e-6) { const d = Math.sqrt(d2), k = (r - d) / d; player.x += dx * k; player.y += dy * k; return; }
      const l = player.x - (cx - hw), rt = cx + hw - player.x, t = player.y - (cy - hh), b = cy + hh - player.y, m = Math.min(l, rt, t, b);
      if (m === l) player.x = cx - hw - r; else if (m === rt) player.x = cx + hw + r; else if (m === t) player.y = cy - hh - r; else player.y = cy + hh + r;
    };
    for (const c of traffic) { if (c.h === 0) test(c.x, c.y, c.truck ? 11 : 10, c.truck ? 31 : 22); else test(c.x, c.y, c.truck ? 31 : 22, c.truck ? 11 : 10); } // v72: auch Autos auf den Querstrassen
    for (const c of cars) test(c.x, c.y, 23, 11);
    return hit;
  }
  // v79: neue Fahrphysik. Geschwindigkeit wird in Laengs- und Querrichtung zerlegt: laengs folgt sie Gas und Bremse,
  // quer haften die Reifen (Haftung sinkt beim scharfen Einlenken und mit der Handbremse, dann driftest du).
  // Lenkung wird weich eingeblendet, ist im Stand eng und bei Hoechsttempo etwas traeger. Beim Schrammen an Waenden bleibt
  // je nach Winkel mehr Tempo erhalten, Frontalaufprall bremst stark.
  function carDrive(dt, mx, my) {
    const v = VEH_BY[G.veh.eq], maxS = v.spd, ml = Math.min(1, Math.hypot(mx, my)), stun = player.stun > 0;
    if (!player.carOn) { player.carOn = true; player.cs = 0; player.cvx = 0; player.cvy = 0; player.steer = 0; }
    let h = player.ang; const want = ml > 0.12 ? Math.atan2(my, mx) : h, dh = Math.atan2(Math.sin(want - h), Math.cos(want - h));
    const spd = Math.abs(player.cs), sk = clamp(spd / maxS, 0, 1);
    const sharp = Math.abs(dh) > 0.45 && player.cs > maxS * 0.45, hand = bHeld && sharp;
    const rate = 3.6 * (0.42 + 0.58 * Math.min(1, spd / 70)) * (1 - 0.3 * sk * sk) * (hand ? 1.35 : 1); // max. Drehrate
    const wantSteer = clamp(dh * 7, -rate, rate); player.steer = (player.steer || 0) + (wantSteer - (player.steer || 0)) * Math.min(1, dt * 12);
    h += player.steer * dt;
    let target = stun ? 0 : aHeld ? maxS : ml > 0.12 ? maxS * 0.72 * ml : 0; if (bHeld && !hand) target = 0;
    const acc = (90 + maxS * 0.55) * (aHeld ? 1.25 : 1) * (1 - 0.5 * sk * sk), dec = bHeld && !hand ? 400 + maxS * 0.45 : hand ? 75 : ml > 0.12 ? 150 : 120;
    player.cs += clamp(target - player.cs, -dec * dt, acc * dt);
    const c = Math.cos(h), sn = Math.sin(h); let vl = player.cvx * c + player.cvy * sn, vt = -player.cvx * sn + player.cvy * c;
    const gLat = hand ? 1.25 : sharp && aHeld ? 2.6 : sharp ? 3.8 : 11; // Querhaftung
    vt *= Math.exp(-gLat * dt);
    player.cs = Math.max(0, player.cs - Math.abs(vt) * 0.22 * dt - Math.abs(player.steer) * spd * 0.035 * dt); // Reifen radieren in Kurven etwas Tempo weg
    vl += (player.cs - vl) * Math.min(1, dt * 10);
    player.cvx = vl * c - vt * sn; player.cvy = vl * sn + vt * c;
    const ddx = player.cvx * dt, ddy = player.cvy * dt, n = Math.max(1, Math.ceil(Math.hypot(ddx, ddy) / 7)), x0 = player.x, y0 = player.y;
    let bump = false; for (let q = 0; q < n; q++) { move(player, ddx / n, ddy / n, player.r); if (carBump()) bump = true; }
    const mvx = player.x - x0, mvy = player.y - y0, w2 = Math.hypot(ddx, ddy), got = Math.hypot(mvx, mvy);
    if (bump || (w2 > 2 && got < w2 * 0.92)) {
      const keep = bump ? 0.65 : clamp(got / Math.max(w2, 1e-6), 0.25, 0.95); // streifen = wenig Verlust, frontal = viel
      player.cvx = mvx / dt; player.cvy = mvy / dt; player.cs *= keep; player.wallT = gt; // an der Wand entlangschrammen ist kein Drift
      if ((bump || keep < 0.6) && w2 > 5 && gt - (player.crashT || 0) > 0.7) { player.crashT = gt; sfx.bad(); vibrate([40]); }
    }
    player.ang = h; if (got > 0.2) player.step += dt * 9;
    const sp = Math.hypot(player.cvx, player.cvy), slip = sp > 1 ? Math.abs(Math.atan2(Math.sin(Math.atan2(player.cvy, player.cvx) - h), Math.cos(Math.atan2(player.cvy, player.cvx) - h))) : 0;
    driftTick(dt, sp > 70 && slip > 0.2 && slip < 2.2 && gt - (player.wallT === undefined ? -9 : player.wallT) > 0.35, sp, slip);
  }
  function driftTick(dt, on, sp, slip) {
    const D = drift;
    if (on) { D.idle = 0; if (!D.on) { D.on = true; D.score = 0; D.mult = 1; D.t = 0; } D.t += dt; D.score += sp * Math.min(slip, 1.2) * dt * 0.5; D.mult = 1 + Math.min(4, Math.floor(D.t / 1.5)); return; }
    if (!D.on) return; D.idle += dt; if (D.idle < 0.7) return;
    D.on = false; const tot = Math.round(D.score * D.mult); if (tot < 25) return;
    floater(player.x, player.y - 36, 'Drift ' + tot.toLocaleString('de-DE') + (D.mult > 1 ? ' ×' + D.mult : ''), '#FFB547');
    if (tot > (G.stat.drift || 0)) { G.stat.drift = tot; if (tot >= 300) msg('Neuer Drift-Rekord: ' + tot.toLocaleString('de-DE')); }
  }
  function drawDriftCombo() {
    const D = drift; if (!D.on || !inCar()) return; const tot = Math.round(D.score * D.mult); if (tot < 10) return;
    const x = player.x, y = player.y - 34 - Math.sin(gt * 10) * 1.2, txt = 'DRIFT ' + tot.toLocaleString('de-DE') + (D.mult > 1 ? '  ×' + D.mult : '');
    ctx.font = '900 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(16,21,28,.9)'; ctx.strokeText(txt, x, y);
    ctx.fillStyle = ['#FFB547', '#FFD84B', '#FF8FD0', '#63FF9A', '#5CB8FF'][Math.min(4, D.mult - 1)]; ctx.fillText(txt, x, y); ctx.lineJoin = 'miter'; ctx.textBaseline = 'alphabetic';
    const k = Math.min(1, (D.t % 1.5) / 1.5); ctx.fillStyle = 'rgba(16,21,28,.8)'; ctx.fillRect(x - 26, y + 9, 52, 3); ctx.fillStyle = '#FFB547'; ctx.fillRect(x - 26, y + 9, 52 * (D.mult >= 5 ? 1 : k), 3);
  }
  // ---------- Autowerkstatt (v69): Tuning je Auto. Einmal kaufen, dann Farbe/Stufe frei waehlen ----------
  const TUNE = {
    neon: { name: 'Unterbodenbeleuchtung', cost: 1500, desc: 'Leuchtet unter dem Auto, nachts besonders schön.', cols: ['#39FF88', '#3FA9FF', '#B36BFF', '#FF5CC8', '#FF4B4B', '#FFD84B', '#FFFFFF', '#4BFFF0'] },
    smoke: { name: 'Driftrauch', cost: 1200, desc: 'Rauch aus den Hinterreifen, wenn du schnell um die Kurve fährst.', cols: ['#E8ECF2', '#8A929C', '#2A2E35', '#63FF9A', '#B36BFF', '#FF8FD0', '#5CB8FF', '#FFD84B', 'rainbow'] },
    spoiler: { name: 'Heckspoiler', cost: 900, desc: 'Klein oder groß, in Karosseriefarbe mit schwarzem Flügel.', opts: ['Klein', 'Groß'] },
    stripe: { name: 'Rennstreifen', cost: 500, desc: 'Zwei Streifen über die ganze Länge.', cols: CAR_COLS },
    rims: { name: 'Felgen', cost: 600, desc: 'Farbige Felgen.', cols: ['#C9CED6', '#E8B84A', '#1D2129', '#39FF88', '#FF4B4B', '#3FA9FF'] },
    // v80: mehr Moeglichkeiten fuer den persoenlichen Look (neue Teile immer hinten anhaengen, Mitspieler bekommen sie als Zahlenliste)
    wrap: { name: 'Folierung', cost: 2500, desc: 'Ein Muster über dem Lack.', opts: ['Flammen', 'Karo', 'Tarnmuster', 'Blitz', 'Hanfblatt', 'Tribal', 'Sterne'] },
    finish: { name: 'Lackeffekt', cost: 2000, desc: 'Metallic glitzert, Matt schluckt das Licht, Perlmutt schimmert in allen Farben, Chrom spiegelt.', opts: ['Metallic', 'Matt', 'Perlmutt', 'Chrom'] },
    tint: { name: 'Scheibentönung', cost: 700, desc: 'Getönte Scheiben in deiner Farbe.', cols: ['#07090C', '#2A1640', '#0E3324', '#4A3810', '#13325E', '#5A1A2A'] },
    lights: { name: 'Lichtfarbe', cost: 800, desc: 'Farbige Scheinwerfer, nachts mit farbigem Lichtkegel.', cols: ['#CFEFFF', '#FFD84B', '#B36BFF', '#FF5CC8', '#39FF88', '#FF4B4B'] },
    exhaust: { name: 'Auspuff-Flammen', cost: 1800, desc: 'Flammen aus dem Auspuff, wenn du mit A Vollgas gibst.', cols: ['#FF8A3A', '#3FA9FF', '#B36BFF', '#39FF88', '#FFFFFF'] },
    roof: { name: 'Dachaufbau', cost: 1100, desc: 'Etwas fürs Dach. Nachts leuchtet die Lichtleiste die Straße aus.', opts: ['Dachbox', 'Lichtleiste', 'Gepäckträger', 'Taxischild', 'Hanf-Fahne'] }
  };
  const PLATE_COST = 300, CARGO_COST = [2500, 6000, 12000];
  const cleanPlate = t => String(t || '').toUpperCase().replace(/[^A-Z0-9ÄÖÜ \-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 9);
  const tuneDef = () => { const t = { own: {}, cargo: 0, plate: '' }; for (const k of Object.keys(TUNE)) t[k] = k === 'spoiler' ? 0 : -1; return t; };
  const tuneFits = (id, k) => !((k === 'roof' && !CAR_ROOF[id]) || (k === 'spoiler' && id === 'truck')); // Lowrider ist offen, der Lkw hat keinen Heckspoiler
  const cargoLv = id => clamp(Math.floor(+(tuneOf(id).cargo) || 0), 0, 3);
  const cargoBonus = id => { const v = VEH_BY[id]; return v && v.util ? Math.round(v.cap / 3) * cargoLv(id) : 0; };
  const cargoCost = (id, lv) => { const v = VEH_BY[id]; return Math.round(CARGO_COST[lv] * Math.max(0.5, (v ? v.cap : 35) / 35) / 100) * 100; };
  function buyCargo(id) {
    const v = VEH_BY[id]; if (!v || !v.util || !G.veh.owned[id] || !atWerk()) return false; const lv = cargoLv(id); if (lv >= 3) return false; const c = cargoCost(id, lv); if (G.money < c) return false;
    G.veh.tune = G.veh.tune || {}; const t = G.veh.tune[id] = G.veh.tune[id] || tuneDef(); G.money -= c; t.cargo = lv + 1; sfx.buy(); msg('Laderaum Stufe ' + (lv + 1) + ': +' + cargoBonus(id) + ' Platz im ' + v.name); save(); return true;
  }
  function buyPlate(id) { const v = VEH_BY[id]; if (!v || !v.car || !G.veh.owned[id] || !atWerk() || G.money < PLATE_COST) return false; G.veh.tune = G.veh.tune || {}; const t = G.veh.tune[id] = G.veh.tune[id] || tuneDef(); if (t.own.plate) return false; G.money -= PLATE_COST; t.own.plate = true; t.plate = cleanPlate((G.name || mp.name || 'KG') .slice(0, 5)) || 'KG 420'; sfx.buy(); save(); return true; }
  function setPlate(id, txt) { const t = G.veh.tune && G.veh.tune[id]; if (!t || !t.own.plate) return false; const c = cleanPlate(txt); if (!c) return false; t.plate = c; sfx.put(); save(); return true; }
  const TUNE_KEYS = Object.keys(TUNE);
  const tuneMax = k => k === 'spoiler' ? 2 : (TUNE[k].cols || TUNE[k].opts).length - 1;
  function tuneOf(id) { const t = G && G.veh && G.veh.tune && G.veh.tune[id]; return t || tuneDef(); }
  const tuneArr = id => { const t = tuneOf(id); return TUNE_KEYS.map(k => t.own[k] ? t[k] : (k === 'spoiler' ? 0 : -1)); }; // [neon, smoke, spoiler, stripe, rims]
  function cleanTune(o) {
    const out = {}; if (!o || typeof o !== 'object') return out;
    for (const v of VEHS) { if (!v.car) continue; const q = o[v.id]; if (!q || typeof q !== 'object') continue; const t = tuneDef();
      if (v.util) t.cargo = clamp(Math.floor(+q.cargo) || 0, 0, 3); if (q.own && q.own.plate === true) { t.own.plate = true; t.plate = cleanPlate(q.plate) || 'KG 420'; }
      for (const k of TUNE_KEYS) { if (q.own && q.own[k] === true) t.own[k] = true; const n = Math.floor(+q[k]); if (Number.isFinite(n) && t.own[k]) t[k] = clamp(n, k === 'spoiler' ? 0 : -1, tuneMax(k)); }
      out[v.id] = t; }
    return out;
  }
  function parseTune(a) { if (!Array.isArray(a)) return null; return TUNE_KEYS.map((k, i) => { const n = Math.floor(+a[i]); return Number.isFinite(n) ? clamp(n, k === 'spoiler' ? 0 : -1, tuneMax(k)) : (k === 'spoiler' ? 0 : -1); }); }
  const openWerk = () => { if (!atWerk()) return false; if (riding()) toggleRide(false); tab = 'werk'; openPhone(); sfx.ping(); return true; };
  function buyTune(id, k) {
    const v = VEH_BY[id], d = TUNE[k]; if (!v || !v.car || !d || !G.veh.owned[id] || !atWerk()) return false;
    if (!tuneFits(id, k)) return false; G.veh.tune = G.veh.tune || {}; const t = G.veh.tune[id] = G.veh.tune[id] || tuneDef();
    if (t.own[k] || G.money < d.cost) return false; G.money -= d.cost; t.own[k] = true; t[k] = k === 'spoiler' ? 1 : 0; sfx.buy(); save(); return true;
  }
  function setTune(id, k, val) { const t = G.veh.tune && G.veh.tune[id]; if (!t || !t.own[k] || !TUNE[k]) return false; t[k] = clamp(Math.floor(+val), k === 'spoiler' ? 0 : -1, tuneMax(k)); sfx.put(); save(); return true; }
  function pvLive(p, dt) { // v80: grosse Live-Vorschau in der Werkstatt, dreht sich langsam, Tag/Nacht umschaltbar
    const c = p.el.getContext && p.el.getContext('2d'); if (!c) return; const id = p.id, v = VEH_BY[id]; if (!v) return; pvLiveT += dt;
    const W2 = p.el.width, H2 = p.el.height, s0 = ctx; try {
      ctx = c; c.setTransform(1, 0, 0, 1, 0, 0);
      const g = c.createLinearGradient(0, 0, 0, H2); g.addColorStop(0, pvNight ? '#0B1018' : '#2B323C'); g.addColorStop(1, pvNight ? '#05080C' : '#1C2128'); c.fillStyle = g; c.fillRect(0, 0, W2, H2);
      c.strokeStyle = pvNight ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.08)'; c.lineWidth = 2; for (let x = 0; x < W2; x += 40) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 30, H2); c.stroke(); }
      const sc = Math.min(W2 / (v.len + 30), H2 / (v.len * 0.7 + 18)) * 0.95; c.save(); c.translate(W2 / 2, H2 / 2 - 6); c.scale(sc, sc);
      pvMode = true; drawCar(0, 0, pvLiveT * 0.45, id, carColI(id), Object.assign({}, G.look, { outline: false }), false, tuneArr(id), { own: true, pv: true, night: pvNight, plate: tuneOf(id).plate }); pvMode = false;
      c.restore();
      const pl = tuneOf(id).plate; if (tuneOf(id).own.plate && pl) { c.font = '800 22px sans-serif'; const w = c.measureText(pl).width + 40; const x = W2 - w - 14, y = H2 - 44; c.fillStyle = '#F4F6FA'; rr(x, y, w, 32, 5); c.fill(); c.strokeStyle = '#1D2129'; c.lineWidth = 2.5; rr(x + 2, y + 2, w - 4, 28, 4); c.stroke(); c.fillStyle = '#2F6FD6'; c.fillRect(x + 3, y + 3, 16, 26); c.fillStyle = '#FFD84B'; c.font = '700 8px sans-serif'; c.textAlign = 'center'; c.fillText('D', x + 11, y + 24); c.fillStyle = '#1D2129'; c.font = '800 22px sans-serif'; c.textBaseline = 'middle'; c.fillText(pl, x + 10 + w / 2, y + 17); c.textBaseline = 'alphabetic'; }
      c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '700 14px sans-serif'; c.textAlign = 'left'; c.fillText(v.name + (pvNight ? ' · Nacht' : ' · Tag'), 14, 24);
    } finally { ctx = s0; pvMode = false; }
  }
  function renderWerk(b) {
    const here = atWerk(), id = selCar(), v = VEH_BY[id], info = document.createElement('div'); info.className = 'empty'; info.style.cssText = 'padding:6px 4px;font-size:13px;text-align:left';
    const car = !!id;
    info.textContent = !here ? 'Die Autowerkstatt steht im Süden an der Südstraße, jenseits des Flusses. Hinfahren und dort A drücken.' : !car ? 'Wähle zuerst ein Auto (Autohof oder Handy unter Fahrzeuge), dann kannst du es hier tunen.' : 'Tuning für deinen ' + v.name + '. Jedes Teil kaufst du einmal pro Auto, danach wechselst du Farbe oder Muster jederzeit hier. Oben siehst du dein Auto live.';
    b.appendChild(info); if (!here || !car) return;
    const live = document.createElement('div'); live.className = 'card'; live.style.cssText = 'position:sticky;top:-2px;z-index:3;padding:8px;display:block;background:#161C24';
    live.innerHTML = '<canvas class="pv" data-veh="' + id + '" data-live="1" width="640" height="300" style="width:100%;height:auto;max-height:34vh;display:block;border-radius:12px;object-fit:contain;background:#1C2128"></canvas>';
    const tg = document.createElement('div'); tg.style.cssText = 'display:flex;gap:6px;margin-top:6px;flex-wrap:wrap';
    [['Tag', false], ['Nacht', true]].forEach(([l, n]) => { const x = document.createElement('button'); x.className = 'chip' + (pvNight === n ? ' on' : ''); x.textContent = l; x.addEventListener('click', () => { pvNight = n; renderPhone(); }); tg.appendChild(x); });
    const capInfo = document.createElement('span'); capInfo.className = 'ds'; capInfo.style.cssText = 'align-self:center;margin-left:6px'; capInfo.textContent = 'Live-Vorschau · Laderaum +' + (v.cap + cargoBonus(id)); tg.appendChild(capInfo);
    live.appendChild(tg); b.appendChild(live);
    const t = tuneOf(id);
    if (v.util) { // Laderaum in drei Stufen
      const lv = cargoLv(id), c = document.createElement('div'); c.className = 'card';
      c.innerHTML = '<div class="nm">Laderaum-Ausbau · Stufe ' + lv + ' von 3</div><div class="pr">' + (lv >= 3 ? 'voll ausgebaut' : fmt(cargoCost(id, lv))) + '</div><div class="ds">Mehr Platz für Ware im ' + v.name + ': jede Stufe +' + Math.round(v.cap / 3) + ' (jetzt +' + cargoBonus(id) + ' extra).</div>';
      const bar = document.createElement('div'); bar.className = 'bar'; bar.innerHTML = '<i style="width:' + Math.round(lv / 3 * 100) + '%"></i>'; c.appendChild(bar);
      if (lv < 3) { const bt = document.createElement('button'); bt.className = 'buy'; bt.textContent = 'Stufe ' + (lv + 1) + ' kaufen'; bt.disabled = G.money < cargoCost(id, lv); bt.addEventListener('click', () => { if (buyCargo(id)) renderPhone(); }); c.appendChild(bt); }
      b.appendChild(c);
    }
    { // Kennzeichen
      const c = document.createElement('div'); c.className = 'card'; c.innerHTML = '<div class="nm">Kennzeichen</div><div class="pr">' + (t.own.plate ? 'gekauft' : fmt(PLATE_COST)) + '</div><div class="ds">Dein eigenes Nummernschild, bis zu 9 Zeichen (Buchstaben, Zahlen, Leerzeichen, Bindestrich).</div>';
      if (!t.own.plate) { const bt = document.createElement('button'); bt.className = 'buy'; bt.textContent = 'Kaufen'; bt.disabled = G.money < PLATE_COST; bt.addEventListener('click', () => { if (buyPlate(id)) renderPhone(); }); c.appendChild(bt); }
      else { const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:6px;margin:6px 0 2px;grid-column:1/-1'; const inp = document.createElement('input'); inp.type = 'text'; inp.maxLength = 9; inp.value = t.plate || ''; inp.setAttribute('aria-label', 'Kennzeichen'); inp.style.cssText = 'flex:1;min-width:0;font:inherit;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border:0;border-radius:10px;padding:8px 12px;background:#F4F6FA;color:#1D2129;-webkit-user-select:text;user-select:text';
        const ok = document.createElement('button'); ok.className = 'chip on'; ok.textContent = 'Übernehmen'; ok.addEventListener('click', () => { if (setPlate(id, inp.value)) renderPhone(); else msg('Bitte mindestens ein Zeichen (A–Z, 0–9)', true); }); row.appendChild(inp); row.appendChild(ok); c.appendChild(row); }
      b.appendChild(c);
    }
    TUNE_KEYS.forEach(k => {
      if (!tuneFits(id, k)) return;
      const d = TUNE[k], own = !!t.own[k], c = document.createElement('div'); c.className = 'card';
      c.innerHTML = '<div class="nm"></div><div class="pr"></div><div class="ds"></div>'; c.querySelector('.nm').textContent = d.name; c.querySelector('.pr').textContent = own ? 'gekauft' : fmt(d.cost); c.querySelector('.ds').textContent = d.desc;
      if (!own) { const bt = document.createElement('button'); bt.className = 'buy'; bt.textContent = 'Kaufen'; bt.disabled = G.money < d.cost; bt.addEventListener('click', () => { if (buyTune(id, k)) renderPhone(); }); c.appendChild(bt); }
      else {
        const row = document.createElement('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin:6px 0 2px;align-items:center;grid-column:1/-1';
        const mk = (label, val, bg) => { const bt = document.createElement('button'); if (bg) { bt.className = 'sw'; bt.style.background = bg === 'rainbow' ? 'conic-gradient(#FF4B4B,#FFD84B,#39FF88,#3FA9FF,#B36BFF,#FF4B4B)' : bg; bt.setAttribute('aria-label', label); } else { bt.className = 'chip'; bt.textContent = label; } if (t[k] === val) { if (bg) bt.style.borderColor = '#FFFFFF'; else bt.classList.add('on'); } bt.addEventListener('click', () => { setTune(id, k, val); renderPhone(); }); row.appendChild(bt); };
        if (k === 'spoiler') { mk('Aus', 0); d.opts.forEach((o, i) => mk(o, i + 1)); }
        else if (d.opts) { mk('Aus', -1); d.opts.forEach((o, i) => mk(o, i)); }
        else { mk('Aus', -1); d.cols.forEach((col, i) => mk(d.name + ' ' + (i + 1), i, col)); }
        c.appendChild(row);
      }
      b.appendChild(c);
    });
    startPreviews(b);
  }
  // Driftrauch: Partikel hinter den Hinterreifen
  const smokes = [];
  function smokeCol(i, k) { const c = TUNE.smoke.cols[i]; return c === 'rainbow' ? 'hsl(' + Math.round((gt * 120 + k * 40) % 360) + ',90%,65%)' : c; }
  function spawnSmoke(x, y, ang, id, si) {
    const v = VEH_BY[id]; if (!v || si < 0) return; const cx = Math.cos(ang), sy = Math.sin(ang);
    for (const side of [-1, 1]) { if (smokes.length > 160) break; const rx = x - cx * v.len * 0.38 - sy * side * v.wid * 0.42, ry = y + 2 - sy * v.len * 0.38 + cx * side * v.wid * 0.42; smokes.push({ x: rx, y: ry, vx: -cx * 20 + (Math.random() - 0.5) * 24, vy: -sy * 20 + (Math.random() - 0.5) * 24, t: 0, max: 0.9 + Math.random() * 0.5, col: smokeCol(si, smokes.length) }); }
  }
  function smokeUpdate(dt) {
    if (G && inCar() && drift.on) { const si = tuneArr(G.veh.eq)[1]; if (si >= 0) spawnSmoke(player.x, player.y, player.ang, G.veh.eq, si); } // v70: Rauch beim Driften
    if (G) { player.pAng = player.ang; player.pX = player.x; player.pY = player.y; }
    for (const f of Object.values(mp.friends)) { if (!f.vis || !f.vh || !VEH_BY[f.vh] || !VEH_BY[f.vh].car || !f.vt) { f.pAng = f.ang; continue; } const da = Math.abs(Math.atan2(Math.sin(f.ang - (f.pAng ?? f.ang)), Math.cos(f.ang - (f.pAng ?? f.ang)))); if (f.vt[1] >= 0 && f.moving && da / Math.max(dt, 1e-3) > 2.6) spawnSmoke(f.x, f.y, f.ang, f.vh, f.vt[1]); f.pAng = f.ang; }
    for (let i = smokes.length - 1; i >= 0; i--) { const p = smokes[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.95; p.vy *= 0.95; if (p.t >= p.max) smokes.splice(i, 1); }
  }
  function drawSmoke() { if (LOFX) return; for (const p of smokes) { if (!inView(p.x, p.y, 30)) continue; const k = p.t / p.max; ctx.globalAlpha = 0.45 * (1 - k); ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, 3 + k * 9, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
  const inCar = () => riding() && !!VEH_BY[G.veh.eq].car;
  // ---------- Muelleimer-Verstecke (v61) ----------
  // G.stash[i] = [Frische, Trockene, Beutel] fuer Keller, Tabak und Brauerei (9 Zahlen). Polizei und Gangs sehen das nicht.
  const STASH_INV = () => [G.inv, G.t.inv, G.b.inv], STASH_F = ['fresh', 'dried', 'bags'];
  const stashSum = a => Array.isArray(a) ? a.reduce((q, v) => q + v, 0) : 0;
  function cleanStash(o) {
    const out = {}; if (!o || typeof o !== 'object') return out;
    for (const k of Object.keys(o).slice(0, BINS.length)) { const i = +k, a = o[k]; if (!Number.isInteger(i) || i < 0 || i >= BINS.length || !Array.isArray(a)) continue; const v = STASH_F.concat(STASH_F, STASH_F).map((_, j) => clamp(Math.floor(+a[j]) || 0, 0, BIN_MAX)); if (stashSum(v) > 0) out[i] = v; }
    return out;
  }
  function binNear(x, y) { let b = -1, bd = 30; BINS.forEach((p, i) => { const d = Math.hypot(x - p.x, y - p.y); if (d < bd) { bd = d; b = i; } }); return b; }
  const binFriends = i => mp.on ? Object.values(mp.friends).filter(f => f.bins && f.bins[i] > 0) : [];
  function stashText(a) { const parts = []; [AREAS.keller, AREAS.tabak, AREAS.brau].forEach((ar, k) => { const bg = a[k * 3 + 2], w = a[k * 3] + a[k * 3 + 1]; if (bg) parts.push(bg + ' ' + ar.lbl.unit); if (w) parts.push(w + ' ' + ar.lbl.fresh); }); return parts.join(', ') || 'nichts'; }
  function binHide(i) {
    const a = (G.stash[i] || [0, 0, 0, 0, 0, 0, 0, 0, 0]).slice(), inv = STASH_INV(); let room = BIN_MAX - stashSum(a), n = 0;
    for (const j of [2, 1, 0]) for (let k = 0; k < 3; k++) { const f = STASH_F[j], v = Math.min(Math.floor(inv[k][f]), room); if (v > 0) { inv[k][f] -= v; a[k * 3 + j] += v; room -= v; n += v; } }
    if (!n) { msg('Der Mülleimer ist voll (' + BIN_MAX + ' Stück)', true); sfx.bad(); return false; }
    G.stash[i] = a; sfx.put(); floater(BINS[i].x, BINS[i].y - 22, 'versteckt', '#FFB547');
    msg(carryTotal() >= 1 ? 'Versteckt: ' + n + ' Stück, der Rest passt nicht mehr rein' : 'Ware im Mülleimer versteckt. Polizei und Gangs finden sie hier nicht.'); save(); return true;
  }
  function binTake(i) {
    const a = G.stash[i]; if (!a) return false; const inv = STASH_INV(); let n = 0, left = 0;
    for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) { const q = k * 3 + j; let v = a[q]; if (!v) continue; if (j === 2) v = Math.min(v, Math.max(0, bagCap() - totalBags())); inv[k][STASH_F[j]] += v; a[q] -= v; n += v; left += a[q]; }
    if (!left) delete G.stash[i];
    if (!n) { msg('Rucksack voll', true); sfx.bad(); return false; }
    sfx.put(); floater(BINS[i].x, BINS[i].y - 22, '+' + n, '#FFB547'); msg(left ? 'Rausgeholt, ' + left + ' Stück bleiben drin (Rucksack voll)' : 'Versteck geleert, alles wieder dabei'); save(); return true;
  }
  // Durchwuehlen: fragt die Besitzer im Raum; deren Geraet raeumt den Muelleimer aus und schickt die Beute zurueck
  function binRummage(i) {
    if (mp.rum) { msg('Du wühlst noch …'); return false; }
    const own = binFriends(i); mp.rum = { t: gt, ks: {}, got: 0 };
    for (const f of own) { const k = Math.random().toString(36).slice(2, 10); mp.rum.ks[k] = f.id; mp.rumK[k] = { o: f.id, t: gt, b: i }; mp.bw.push({ k, to: f.id, b: i, t: gt }); }
    sfx.put(); msg('Du wühlst im Mülleimer …'); mp.sendT = 9; return true;
  }
  function binUse(i, hide) { // v123: B holt das eigene Versteck immer raus, A versteckt
    if (i < 0 || i >= BINS.length || player.fl || inBuilding(player.x, player.y)) return false;
    const mine = stashSum(G.stash[i]) > 0, carry = carryTotal() >= 1;
    if (hide) return carry ? binHide(i) : (msg('Du hast nichts zum Verstecken dabei'), false);
    if (mine) return binTake(i);
    if (carry) return binHide(i);
    if (mp.on && Object.keys(mp.friends).length) return binRummage(i);
    msg('Nur Müll drin'); return false;
  }
  function binHint(i) {
    const n = stashSum(G.stash[i]), carry = carryTotal() >= 1;
    if (n && carry) return 'B  Rausholen (' + n + ') · A  Mehr verstecken';
    if (n && !carry) return 'B  Versteck aus dem Mülleimer holen (' + n + ')';
    if (carry) return 'B  Ware im Mülleimer verstecken' + (n ? ' (schon ' + n + ' drin)' : '');
    if (mp.on && Object.keys(mp.friends).length) return 'B  Mülleimer durchwühlen';
    return 'Mülleimer: hier kannst du Ware verstecken';
  }
  // Mehrspieler: wer wo etwas versteckt hat (nur Mengen), Anfragen und Beute
  const binList = () => Object.keys(G.stash).map(k => [+k, stashSum(G.stash[k])]).filter(q => q[1] > 0).slice(0, BINS.length);
  function binsParse(a) { const out = {}; if (!Array.isArray(a)) return out; for (const q of a.slice(0, BINS.length)) { if (!Array.isArray(q)) continue; const i = +q[0], n = +q[1]; if (Number.isInteger(i) && i >= 0 && i < BINS.length && n > 0 && n <= BIN_MAX * 2) out[i] = Math.floor(n); } return out; }
  function mpBinWants(from, f, list) {
    if (!G) return;
    for (const w of list) {
      if (!w || typeof w !== 'object' || w.to !== mp.id || typeof w.k !== 'string' || w.k.length > 16 || !Number.isInteger(w.b) || w.b < 0 || w.b >= BINS.length) continue;
      if (mp.seenB[w.k]) continue; mp.seenB[w.k] = gt;
      const B = BINS[w.b], near = f.vis && Math.hypot(f.tx - B.x, f.ty - B.y) < 90; // nur wer wirklich davor steht
      const a = G.stash[w.b];
      if (!near || !a || !stashSum(a)) { mp.bl.push({ k: w.k, to: from, s: [], t: gt }); continue; }
      delete G.stash[w.b]; G.binP = (G.binP || []).filter(q => q.k !== w.k); G.binP.push({ k: w.k, b: w.b, a, to: from, n: f.name, t: Date.now() }); save(); // v123: erst weg, wenn der Dieb den Empfang bestaetigt
      mp.bl.push({ k: w.k, to: from, s: a, t: gt });
    }
    for (const k of Object.keys(mp.seenB)) if (gt - mp.seenB[k] > 30) delete mp.seenB[k];
    mp.sendT = 9;
  }
  function mpBinLoot(from, f, list) {
    if (!G) return;
    for (const l of list) {
      if (!l || typeof l !== 'object' || l.to !== mp.id || typeof l.k !== 'string') continue;
      if (mp.rumDone[l.k]) { if (Array.isArray(l.s) && l.s.length) mp.ba.push({ k: l.k, to: from, t: gt }); continue; } // schon bekommen: nur nochmal bestaetigen
      if (!mp.rumK[l.k] || mp.rumK[l.k].o !== from) continue;
      delete mp.rumK[l.k]; mp.rumDone[l.k] = gt; if (mp.rum) delete mp.rum.ks[l.k];
      if (Array.isArray(l.s) && l.s.length) { mp.ba.push({ k: l.k, to: from, t: gt }); mp.sendT = 9; }
      const a = Array.isArray(l.s) ? cleanStash({ 0: l.s })[0] : null; if (!a) continue;
      const inv = STASH_INV(); let n = 0; for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) { const v = Math.min(a[k * 3 + j], BIN_MAX - n); if (v > 0) { inv[k][STASH_F[j]] += v; n += v; } }
      if (n) { if (mp.rum) mp.rum.got += n; mp.rumGot = (mp.rumGot || 0) + n; sfx.cash(); floater(player.x, player.y - 24, '+' + n, '#FFB547'); msg('Mülleimer von ' + f.name + ' ausgeräumt: ' + stashText(a)); G.stat.bin = (G.stat.bin || 0) + 1; save(); }
    }
  }
  function binTick() {
    if (mp.rum && (gt - mp.rum.t > 10 || !Object.keys(mp.rum.ks).length)) { if (!mp.rum.got && !Object.keys(mp.rum.ks).length) msg('Nur Müll drin. Hier hat niemand etwas versteckt.'); else if (!mp.rum.got) msg('Niemand hat geantwortet. Vielleicht später nochmal.'); mp.rum = null; }
    for (const k of Object.keys(mp.rumK)) { const q = mp.rumK[k]; if (gt - q.t > 4 && gt - q.t < 40 && !mp.bw.some(z => z.k === k) && Math.floor(gt - q.t) % 3 === 0) mp.bw.push({ k, to: q.o, b: q.b, t: gt }); if (gt - q.t > 40) delete mp.rumK[k]; } // Anfrage wiederholen, falls sie verloren ging
    for (const k of Object.keys(mp.rumDone)) if (gt - mp.rumDone[k] > 120) delete mp.rumDone[k];
    if (G && G.binP && G.binP.length) { const now = Date.now(); // v123: Beute so lange schicken, bis der Dieb sie bestaetigt; ohne Bestaetigung kommt alles zurueck
      for (const q of G.binP.slice()) {
        if (now - q.t > 45000) { binRestore(q); msg((q.n || 'Jemand') + ' wollte deinen Mülleimer ausräumen, hat aber nichts bekommen. Deine Ware ist wieder drin.'); continue; }
        if (mp.on && !mp.bl.some(z => z.k === q.k)) mp.bl.push({ k: q.k, to: q.to, s: q.a, t: gt });
      } }
  }
  function binRestore(q) { const a = G.stash[q.b] || [0, 0, 0, 0, 0, 0, 0, 0, 0]; for (let j = 0; j < 9; j++) a[j] += q.a[j] || 0; G.stash[q.b] = a; G.binP = G.binP.filter(x => x.k !== q.k); save(); }
  function mpBinAcks(from, list) { // Dieb hat die Beute bekommen: jetzt ist sie wirklich weg
    if (!G || !G.binP || !G.binP.length) return;
    for (const z of list) { if (!z || z.to !== mp.id || typeof z.k !== 'string') continue; const q = G.binP.find(x => x.k === z.k && x.to === from); if (!q) continue;
      G.binP = G.binP.filter(x => x !== q); save(); sfx.bad(); vibrate([60, 40, 90]); msg((q.n || 'Jemand') + ' hat deinen Mülleimer ausgeräumt: ' + stashText(q.a) + ' weg!', true); }
  }
  function busted() {
    const fine = Math.min(G.money, Math.round(clamp(Math.round(G.money * 0.08), 40, 1500 + G.rep * 80) * (petPerk().fine || 1)));
    copBust = gt; // v127
    G.stat.bust++; G.heat = Math.min(100, (G.heat || 0) + 12); G.money -= fine; G.inv.fresh = 0; G.inv.dried = 0; G.inv.bags = 0; G.t.inv.fresh = 0; G.t.inv.dried = 0; G.t.inv.bags = 0; G.b.inv.fresh = 0; G.b.inv.dried = 0; G.b.inv.bags = 0; sus = 0;
    player.x = DOOR.x; player.y = DOOR.y; player.fl = 0; bizIn = null; joy.id = null; joy.dx = joy.dy = 0; petSnap();
    cops.forEach(c => { c.stun = 5; copHitSend(c, 5, false); });
    vibrate([140, 70, 200]); sfx.siren(); msg('Erwischt! Ware weg und ' + fmt(fine) + ' Strafe', true);
  }

