  // ---------- Gangs (v51, v52 im Mehrspieler synchron) ----------
  // Dreier-Kolonnen ziehen ueber die Gehwege. Jede Kolonne hat eine Absicht, die man erst merkt, wenn sie jemanden entdeckt:
  //   buy    = Grosskunde: nimmt grosse Mengen (Teillieferungen gehen) und zahlt 22 % ueber dem Grundpreis (normale Kunden schwanken um den Grundpreis), nachts noch 10 % mehr.
  //   steal  = Diebe: schnappen sich einen Teil deiner Ware (sonst Bargeld) und rennen weg. Wer den Dieb K.O. schlaegt, holt die Beute zurueck.
  //   attack = Schlaeger: hauen dich um und nehmen etwas Bargeld mit.
  // Wirtschaft: Abwehr (defenseScore) senkt jeden Verlust, Abschreckung (threatScore) laesst Gangs oft wieder abziehen und macht Ueberfaelle seltener.
  // Mehrspieler (v52): wie bei der Polizei steuert der Anfuehrer (kleinste ID) alle Gangs und die Beute am Boden und schickt sie an alle.
  // Die anderen glaetten nur. Treffer, Lieferungen und aufgesammelte Beute melden sie dem Anfuehrer; Ueberfaelle auf einen Mitspieler
  // rechnet dessen eigenes Geraet ab (eigene Ware, eigenes Geld, eigene Abwehr). Jeder bekommt Preise und Kopfgeld nach seinem eigenen Ruf.
  // Alles Cartoon: kein Blut, Opfer sind nur benommen.
  // v52: Strassengang-Look. Jede Gang hat eine feste Farbe (Kleidung, Kappe, Bandana) und drei unterschiedliche Outfits.
  // bs = wie das Bandana getragen wird: rag = als Kopftuch, mask = vor dem Gesicht, neck = um den Hals. Namen frei erfunden.
  const GANGS = [
    { id: 'gruen', name: 'Grünhof-Familie', col: [40, 150, 64], band: '#2FA44A', kit: [{ top: 'tank', bot: 'jeans', hat: 'none', bs: 'rag' }, { top: 'tshirt', bot: 'cargo', hat: 'cap', bs: 'neck' }, { top: 'tank', bot: 'jogger', hat: 'none', bs: 'neck' }] },
    { id: 'lila', name: 'Lila Krone', col: [112, 44, 156], band: '#8E3CC8', kit: [{ top: 'tracksuit', bot: 'cargo', hat: 'cap', bs: 'mask' }, { top: 'jersey', bot: 'jeans', hat: 'none', bs: 'rag' }, { top: 'tank', bot: 'cargo', hat: 'none', bs: 'mask' }] },
    { id: 'gelb', name: 'Gelbe Vipern', col: [226, 182, 28], band: '#F2C81E', kit: [{ top: 'tank', bot: 'bermuda', hat: 'none', bs: 'rag' }, { top: 'tshirt', bot: 'cargo', hat: 'cap', bs: 'neck' }, { top: 'jersey', bot: 'bermuda', hat: 'none', bs: 'mask' }] },
    { id: 'blau', name: 'Blaue Front', col: [36, 84, 196], band: '#2F6FE0', kit: [{ top: 'hoodie', bot: 'jeans', hat: 'none', bs: 'rag' }, { top: 'tank', bot: 'cargo', hat: 'cap', bs: 'mask' }, { top: 'denim', bot: 'jeans', hat: 'none', bs: 'neck' }] },
    { id: 'rot', name: 'Rote Faust', col: [196, 28, 40], band: '#E0243A', kit: [{ top: 'tank', bot: 'cargo', hat: 'none', bs: 'rag' }, { top: 'hoodie', bot: 'jogger', hat: 'none', bs: 'mask' }, { top: 'tshirt', bot: 'jeans', hat: 'cap', bs: 'neck' }] },
    { id: 'aqua', name: 'Türkis-Kartell', col: [24, 160, 160], band: '#22C2C0', kit: [{ top: 'leather', bot: 'cargo', hat: 'none', bs: 'rag' }, { top: 'tank', bot: 'jeans', hat: 'none', bs: 'mask' }, { top: 'jersey', bot: 'cargo', hat: 'cap', bs: 'neck' }] }
  ];
  const G_INT = ['buy', 'steal', 'attack'], G_ST = ['walk', 'tell', 'come', 'wait', 'flee', 'leave'];
  // ---------- v79: Gangviertel (Suedosten, hinter den Haeusern an der Suedstrasse) ----------
  // Die Gangs chillen hier: Sofa, Feuertonne, Musik, Basketball, Lowrider. Beim Hehler verkaufst du jederzeit alles, was du dabeihast.
  // Die Gangs verkaufen weiter und nehmen ihren Schnitt: meist gibt es etwas weniger als bei Kunden, bei einem Engpass auch mehr.
  // Der Kurs schwankt mit der Zeit und sinkt, wenn du den Markt flutest; danach erholt er sich langsam. Ruf gibt es dafuer keinen.
  const GV_MEAN = 0.8, GV_MIN = 0.45, GV_MAX = 1.2, GV_REP = 35; // v97: Gangviertel erst ab Ruf 35 // v79: erst ab Ruf 20, die Gangs muessen dich kennen
  const gvOpen = () => !!G && G.rep >= GV_REP;
  let gvTick = 30, gvSay = { i: -1, t: 0, txt: '', next: 3 };
  function gvState() {
    if (!G.gv || typeof G.gv !== 'object' || !Number.isFinite(+G.gv.k)) G.gv = { k: GV_MEAN, p: GV_MEAN, n: 0 };
    G.gv.k = clamp(+G.gv.k, GV_MIN, GV_MAX); if (!Number.isFinite(+G.gv.p)) G.gv.p = G.gv.k; return G.gv;
  }
  const atGV = () => !!G && !player.fl && player.x >= 0 && Math.hypot(player.x - GV_AT.x, player.y - GV_AT.y) < 52;
  const gvBase = prod => { const ar = AREAS[prod] || AREAS.keller; return (ar.price + repEff(G.rep) * 2.2) * seedMult(S(ar).up.seed); }; // wie der Grundpreis der Kunden
  const gvUnit = prod => prod === 'pr' ? Math.max(1, Math.round(apoUnit() * 0.8 * gvState().k * (1 + krPerk('hehler')))) : Math.max(1, Math.round(gvBase(prod) * gvState().k * (1 + krPerk('hehler')))); // v103: Dosen beim Hehler etwa 80 % vom Apothekenpreis
  const gvPct = () => Math.round(gvState().k * 100);
  function gvMood() {
    const k = gvState().k;
    if (k >= 1.0) return ['Engpass: Die Gangs reißen sich um Ware', '#7FE38F'];
    if (k >= 0.86) return ['Gute Stimmung: kaum Schnitt für die Gangs', '#B6E36A'];
    if (k >= 0.7) return ['Normal: Die Gangs nehmen ihren Schnitt', '#FFD24A'];
    return ['Markt voll: Die Gangs drücken den Preis', '#FF8A6A'];
  }
  function gvUpdate(dt) {
    if (!G) return; const s = gvState();
    if (gvOpen() && !G.gvOk) { G.gvOk = 1; sfx.ping(); msg('Freigeschaltet: Der Hehler im Gangviertel (Südosten) kauft dir jetzt Ware ab'); }
    if (s.k < GV_MEAN - 0.02) s.k = Math.min(GV_MEAN, s.k + (GV_MEAN - s.k) * dt * 0.008); // erholt sich nach dem Fluten
    gvTick -= dt; if (gvTick > 0) return; gvTick = 35 + Math.random() * 25; s.p = s.k;
    const r = Math.random();
    if (r < 0.07) { s.k = 1.02 + Math.random() * 0.16; s.n = 1; if (gvOpen() && totalBags() > 0) msg('Gangviertel: Engpass! Der Hehler zahlt gerade ' + gvPct() + ' %'); }
    else if (r < 0.13) { s.k = 0.48 + Math.random() * 0.1; s.n = -1; }
    else { s.k = clamp(s.k + (GV_MEAN - s.k) * 0.3 + (Math.random() - 0.5) * 0.16, GV_MIN, GV_MAX); s.n = 0; }
  }
  function gvSell(prod, qty) {
    if (!atGV() || !gvOpen()) return 0; const ar = AREAS[prod]; if (!ar || (!isOpen(ar) && prod !== 'pr')) return 0; const inv = (prod === 'pr' ? G.pr : S(ar)).inv; if (!inv) return 0;
    qty = Math.min(Math.floor(+qty || 0), inv.bags); if (qty <= 0) return 0;
    const s = gvState(), u = gvUnit(prod), pay = u * qty;
    inv.bags -= qty; G.money += pay; G.earned += pay; if (G.kr) G.kr.cnt.hs += qty; G.stat.gv = (G.stat.gv || 0) + qty; // v170: zählt für Tages- und Wochenziel
    s.k = Math.max(GV_MIN, s.k - 0.0035 * qty); // die Gangs werden satt
    sfx.cash(); floater(GV_AT.x, GV_AT.y - 34, '+' + fmt(pay), '#FFB547');
    msg('Hehler nimmt ' + qty + ' ' + ar.lbl.unit + ' für ' + fmt(pay) + ' (' + fmt(u) + ' pro Stück)');
    [2000000, 10000000, 50000000].forEach(g => { if (G.earned - pay < g && G.earned >= g) msg('Meilenstein: ' + fmt(g) + ' Umsatz!'); });
    if (!G.won && G.earned >= 500000) { G.won = true; msg('Ziel erreicht: 500.000 € Umsatz! Spiele weiter, so lange du willst.'); }
    save(); return pay;
  }
  const gvAreas = () => openAreas().concat(isOpen(AREAS.pr) || (G.pr && G.pr.inv && G.pr.inv.bags > 0) ? [AREAS.pr] : []); // v103: Hehler nimmt auch Apotheken-Dosen
  function gvSellAll() { let t = 0; for (const ar of gvAreas()) t += gvSell(ar.key, S(ar).inv.bags); return t; }
  function openGV() { if (!atGV()) return false; if (riding()) toggleRide(false); tab = 'gv'; openPhone(); sfx.ping(); return true; }
  function renderGV(b) {
    const s = gvState(), [mood, mc] = gvMood(), tr = s.k > s.p + 0.01 ? ' ▲' : s.k < s.p - 0.01 ? ' ▼' : '';
    const info = document.createElement('div'); info.className = 'empty'; info.style.cssText = 'padding:6px 4px;font-size:13px;text-align:left';
    info.innerHTML = 'Der Hehler kauft dir jederzeit alles ab, was du dabeihast. Die Gangs verkaufen es weiter und nehmen ihren Schnitt. Meist gibt es weniger als bei Kunden, bei einem Engpass auch mehr. Wer zu viel auf einmal bringt, drückt den Preis. Ruf gibt es hier keinen.<br><b style="color:' + mc + '">' + mood + ' · ' + gvPct() + ' % vom Straßenpreis' + tr + '</b>';
    b.appendChild(info);
    if (!gvOpen()) { const e = document.createElement('div'); e.className = 'empty'; e.innerHTML = '<b style="color:#FF8A6A">Gesperrt: Der Hehler handelt erst ab Ruf ' + GV_REP + ' mit dir</b> (du hast ' + G.rep + '). Die Gangs müssen erst wissen, wer du bist. Beliefere weiter Kunden, dann kommst du ins Geschäft.'; e.style.cssText = 'padding:6px 4px;font-size:13px;text-align:left'; b.appendChild(e); }
    const here = atGV() && gvOpen(), list = gvAreas(); let tot = 0, n = 0;
    for (const ar of list) {
      const have = S(ar).inv.bags, u = gvUnit(ar.key); tot += have * u; n += have;
      const c = document.createElement('div'); c.className = 'card';
      c.innerHTML = '<div class="nm">' + ar.name + '</div><div class="pr">' + fmt(u) + ' / Stück</div><div class="ds">Du hast ' + have + ' ' + ar.lbl.unit + (have ? ' · zusammen ' + fmt(have * u) : '') + '</div>';
      const btn = document.createElement('button'); btn.className = 'buy'; let qn = have; btn.textContent = have ? have + ' verkaufen' : 'Nichts dabei'; btn.disabled = !here || !have;
      if (have > 1) { const qr = qtyRow(have, have, v => { qn = v; btn.textContent = v + ' verkaufen'; }); qr.style.gridColumn = '1 / -1'; c.appendChild(qr); } // v89: Menge waehlen
      btn.addEventListener('click', () => { gvSell(ar.key, Math.min(qn, S(ar).inv.bags)); renderPhone(); }); c.appendChild(btn); b.appendChild(c);
    }
    if (list.length > 1) {
      const c = document.createElement('div'); c.className = 'card';
      c.innerHTML = '<div class="nm">Alles auf einmal</div><div class="pr">' + fmt(tot) + '</div><div class="ds">' + n + ' Stück aus allen Sorten (der Preis sinkt beim Verkaufen etwas, die Summe kann daher leicht abweichen)</div>';
      const btn = document.createElement('button'); btn.className = 'buy'; btn.textContent = 'Alles verkaufen'; btn.disabled = !here || !n;
      btn.addEventListener('click', () => { gvSellAll(); renderPhone(); }); c.appendChild(btn); b.appendChild(c);
    }
    if (!atGV() && gvOpen()) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = 'Geh zum Hehler im Gangviertel (ganz im Südosten), um zu verkaufen.'; b.appendChild(e); }
  }
  // Wer hier abhaengt: Look aus den echten Gangs
  const GV_SAYS = ['Was geht?', 'Läuft bei uns', 'Hast du Ware?', 'Chill mal', 'Yo!', 'Unser Block', 'Der Hehler zahlt fair. Meistens.', 'Mach mal lauter', 'Bulle in Sicht?', 'Korb!'];
  const gvLooks = () => { if (!GV_NPC[0].look) GV_NPC.forEach((n, i) => { n.look = gangLook(GANGS[n.g], i, i + 3); n.a0 = n.a; n.ph = i * 1.7; }); };
  function gvNpcUpdate(dt) {
    if (!G) return; gvLooks(); const near = Math.hypot(player.x - 4830, player.y - 2515) < 520;
    for (const n of GV_NPC) {
      if (n.p === 'sit' || n.p === 'dance' || n.p === 'ball') continue;
      const d = Math.hypot(player.x - n.x, player.y - n.y), want = d < 120 && player.x >= 0 ? Math.atan2(player.y - n.y, player.x - n.x) : n.a0;
      let df = want - n.a; while (df > Math.PI) df -= TAU; while (df < -Math.PI) df += TAU; n.a += df * Math.min(1, dt * 4);
    }
    if (!near) { gvSay.i = -1; return; }
    gvSay.t -= dt; gvSay.next -= dt;
    if (gvSay.t <= 0) gvSay.i = -1;
    if (gvSay.next <= 0) { gvSay.next = 4 + Math.random() * 4; gvSay.i = Math.floor(Math.random() * GV_NPC.length); gvSay.t = 2.6; gvSay.txt = GV_NPC[gvSay.i].p === 'boss' ? (!gvOpen() ? 'Kenn ich dich?' : atGV() ? 'Zeig her, was du hast' : 'Ich kauf alles') : GV_SAYS[Math.floor(Math.random() * GV_SAYS.length)]; }
  }
  function gvBubble(x, y, txt) {
    ctx.font = '700 8px sans-serif'; const w = ctx.measureText(txt).width + 10;
    ctx.fillStyle = 'rgba(245,247,250,.95)'; rr(x - w / 2, y - 9, w, 13, 5); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 3, y + 4); ctx.lineTo(x, y + 8); ctx.lineTo(x + 3, y + 4); ctx.fill();
    ctx.fillStyle = '#1D2129'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, x, y - 2.5); ctx.textBaseline = 'alphabetic';
  }
  function drawGangHouse(h, hi) { // v157: Haus als fertiges Bild, nur die Fahne weht live
    const x = h.x, y = h.y, w = h.w, hh = h.h, fh = hh * 0.36, ry0 = y + fh, rh = hh - fh, dk = lightK() > 0.25, gd = GANGS[hi % GANGS.length];
    bcDraw('gh' + hi + (dk ? 'd' : 'l'), x - 12, y - 28, w + 32, hh + 58, () => drawGangHouse0(h, hi));
    // Fahne auf dem Dach
    const fx = x + w - 16, fy = ry0 + rh - 12, wv = Math.sin(gt * 4 + hi);
    ctx.fillStyle = '#C9D2DC'; ctx.fillRect(fx, fy - 30, 1.6, 30); ctx.fillStyle = gd.band; ctx.beginPath(); ctx.moveTo(fx + 1.6, fy - 30); ctx.quadraticCurveTo(fx + 9, fy - 30 + wv * 2, fx + 18, fy - 27); ctx.lineTo(fx + 18, fy - 19); ctx.quadraticCurveTo(fx + 9, fy - 22 + wv * 2, fx + 1.6, fy - 21); ctx.closePath(); ctx.fill();
  }
  function drawGangHouse0(h, hi) {
    const x = h.x, y = h.y, w = h.w, hh = h.h, fh = hh * 0.36, ry0 = y + fh, rh = hh - fh, dk = lightK() > 0.25, gd = GANGS[hi % GANGS.length];
    ctx.fillStyle = '#55585E'; ctx.fillRect(h.dx - 9, y - 18, 18, 18); ctx.fillStyle = 'rgba(0,0,0,.2)'; for (let k = 0; k < 3; k++) ctx.fillRect(h.dx - 9, y - 13 + k * 6, 18, 1);
    ctx.fillStyle = '#1D2129'; for (const ox of [12, 24, w - 26]) { ctx.beginPath(); ctx.arc(x + ox, y - 8, 5, 0, TAU); ctx.fill(); } // Muellsaecke statt Hecke
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x + 7, y + 9, w, hh);
    ctx.fillStyle = '#4A3A3C'; ctx.fillRect(x, y, w, fh); // Klinker, dunkel
    ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let r = 0, k = y + 4; k < y + fh; k += 5, r++) { ctx.fillRect(x, k, w, 1); for (let q = x + (r % 2) * 5; q < x + w; q += 10) ctx.fillRect(q, k - 4, 1, 4); }
    // Graffiti an der Fassade
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let k = 0; k < 4; k++) { const gx = x + 10 + k * 36, gy = y + fh * 0.72, c = GANGS[(hi + k) % GANGS.length].band; ctx.strokeStyle = c; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.bezierCurveTo(gx + 6, gy - 9, gx + 10, gy + 7, gx + 16, gy - 4); ctx.bezierCurveTo(gx + 20, gy - 10, gx + 24, gy + 4, gx + 28, gy - 2); ctx.stroke(); }
    ctx.restore();
    houseWins(h).forEach(([wx, wy], j) => { // vergitterte Fenster
      ctx.fillStyle = '#2B2F36'; ctx.fillRect(wx - 13, wy - 8, 26, 16);
      ctx.fillStyle = dk ? (winLit(hi, j) ? '#FFB86A' : '#1B2028') : '#4E6070'; ctx.fillRect(wx - 11, wy - 6, 22, 12);
      ctx.fillStyle = '#8C96A3'; for (let q = -8; q <= 8; q += 4) ctx.fillRect(wx + q, wy - 6, 1, 12);
    });
    const dx0 = h.dx - 13; ctx.fillStyle = '#15181D'; ctx.fillRect(dx0 - 2, y, 30, 22); ctx.fillStyle = '#3A4048'; ctx.fillRect(dx0, y, 26, 20); ctx.fillStyle = 'rgba(255,255,255,.12)'; for (let k = 0; k < 3; k++) ctx.fillRect(dx0 + 2, y + 4 + k * 5, 22, 1.5);
    ctx.fillStyle = gd.band; ctx.fillRect(dx0 + 4, y + 2, 18, 2);
    // Flachdach mit Teerpappe, Lueftung, Schuessel und grossem Gang-Tag
    ctx.fillStyle = '#30353B'; ctx.fillRect(x, ry0, w, rh); ctx.fillStyle = '#3A4047'; ctx.fillRect(x + 4, ry0 + 4, w - 8, rh - 8);
    ctx.fillStyle = 'rgba(255,255,255,.05)'; for (let k = 0; k < 36; k++) ctx.fillRect(x + 6 + ((k * 37) % (w - 12)), ry0 + 6 + ((k * 23) % (rh - 12)), 2, 2);
    const tx = x + w * 0.42, ty = ry0 + rh * 0.48;
    ctx.fillStyle = gd.band; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(tx, ty, 22, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = '#15181D'; ctx.beginPath(); ctx.moveTo(tx - 12, ty + 6); ctx.lineTo(tx - 12, ty - 6); ctx.lineTo(tx - 6, ty); ctx.lineTo(tx, ty - 9); ctx.lineTo(tx + 6, ty); ctx.lineTo(tx + 12, ty - 6); ctx.lineTo(tx + 12, ty + 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8C96A3'; ctx.fillRect(x + w - 38, ry0 + 12, 24, 18); ctx.fillStyle = '#6B7480'; for (let k = 0; k < 4; k++) ctx.fillRect(x + w - 36, ry0 + 15 + k * 4, 20, 1.5);
    ctx.fillStyle = '#D6DCE6'; ctx.beginPath(); ctx.ellipse(x + 20, ry0 + rh - 22, 8, 6, -0.6, 0, TAU); ctx.fill(); ctx.fillStyle = '#9AA6B3'; ctx.fillRect(x + 19, ry0 + rh - 22, 2, 8);
    ctx.fillStyle = 'rgba(255,255,255,.1)'; ctx.fillRect(x, y, w, 3);
    chimney(h); // v157
  }
  function drawGangHof() {
    if (!inView(GV.x + GV.w / 2, GV.y + GV.h / 2, 460)) return; gvLooks();
    const x0 = GV.x, y0 = GV.y - 3, x1 = GV.x + GV.w, y1 = WH, L = lightK();
    bcDraw('gvhof', x0 - 4, 2425, x1 - x0 + 8, WH - 2425 + 6, () => { // v157: Boden, Mauer und Graffiti als fertiges Bild
      ctx.fillStyle = '#383C42'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.fillRect(4630, 2429, 30, 80); // rissiger Beton, auch der Durchgang
      ctx.fillStyle = 'rgba(0,0,0,.14)'; for (let x = x0; x < x1; x += 40) ctx.fillRect(x, y0, 1, y1 - y0); for (let y = y0 + 20; y < y1; y += 40) ctx.fillRect(x0, y, x1 - x0, 1);
      ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 14; k++) { const cx = x0 + 30 + ((k * 211) % (x1 - x0 - 60)), cy = y0 + 10 + ((k * 97) % (y1 - y0 - 20)); ctx.moveTo(cx, cy); ctx.lineTo(cx + 9, cy + 5); ctx.lineTo(cx + 14, cy + 2); ctx.lineTo(cx + 22, cy + 8); } ctx.stroke();
      ctx.fillStyle = '#41464D'; ctx.fillRect(x0, 2490, x1 - x0, 20); ctx.fillRect(4635, 2429, 20, 62); // Weg
      for (let k = 0; k < 9; k++) { const c = GANGS[k % GANGS.length].band; ctx.fillStyle = c; ctx.globalAlpha = 0.28; ctx.beginPath(); ctx.arc(x0 + 60 + k * 82, 2520 + ((k * 37) % 50), 5 + (k % 3) * 3, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; // Farbkleckse
      // Basketball-Feld vor der Hauswand
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(GV_HOOP.x, GV_HOOP.y, 46, 0, Math.PI); ctx.stroke(); ctx.strokeRect(GV_HOOP.x - 14, GV_HOOP.y, 28, 30);
      // Graffiti-Mauer am Kartenrand
      ctx.fillStyle = '#5A4A48'; ctx.fillRect(x0, 2590, x1 - x0, 10); ctx.fillStyle = 'rgba(0,0,0,.2)'; for (let x = x0; x < x1; x += 12) ctx.fillRect(x, 2590, 1, 10);
      ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 2.5; ctx.strokeStyle = '#15181D';
      [['GANGVIERTEL', 4830, '#FF5C7A'], ['KRONE', 4560, '#B36BFF'], ['VIPERN', 5100, '#F2C81E'], ['FRONT', 4690, '#3FA9FF'], ['FAUST', 4975, '#E0243A']].forEach(([t, x, c]) => { ctx.strokeText(t, x, 2595.5); ctx.fillStyle = c; ctx.fillText(t, x, 2595.5); });
      ctx.textBaseline = 'alphabetic';
    });
    // Lowrider (huepft leicht auf der Hydraulik)
    { const c = GV_CAR, bo = Math.max(0, Math.sin(gt * 2.4)) * 1.6;
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(c.x + 3, c.y + 5, c.w, c.h); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(c.x + 40, c.y + 34, 14, 4, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#E8C84A'; for (const [wx, wy] of [[c.x + 12, c.y - 2], [c.x + c.w - 16, c.y - 2], [c.x + 12, c.y + c.h - 2], [c.x + c.w - 16, c.y + c.h - 2]]) ctx.fillRect(wx, wy, 10, 4);
      ctx.fillStyle = '#6B2FA0'; rr(c.x, c.y - bo, c.w, c.h, 7); ctx.fill(); ctx.fillStyle = '#8A4ACC'; rr(c.x + 3, c.y + 3 - bo, c.w - 6, 6, 3); ctx.fill();
      ctx.fillStyle = '#1D2433'; ctx.fillRect(c.x + 20, c.y + 4 - bo, 28, c.h - 8); ctx.fillStyle = '#4B3A70'; ctx.fillRect(c.x + 24, c.y + 7 - bo, 20, c.h - 14);
      ctx.fillStyle = '#D6DCE6'; ctx.fillRect(c.x + 2, c.y + c.h / 2 - 0.6 - bo, c.w - 4, 1.2); ctx.fillStyle = '#FFE9A0'; ctx.fillRect(c.x + c.w - 3, c.y + 4 - bo, 3, 5); ctx.fillRect(c.x + c.w - 3, c.y + c.h - 9 - bo, 3, 5); }
    // Sofa an der Hauswand
    { const c = GV_COUCH; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(c.x + 3, c.y + 4, c.w, c.h); ctx.fillStyle = '#6E2E26'; rr(c.x, c.y, c.w, c.h, 5); ctx.fill(); ctx.fillStyle = '#8E3B2E'; rr(c.x + 5, c.y + 8, c.w - 10, c.h - 10, 3); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,.2)'; for (let k = 1; k < 3; k++) ctx.fillRect(c.x + 5 + k * (c.w - 10) / 3, c.y + 8, 1.2, c.h - 10); }
    // Boombox auf einer Kiste
    { const b = GV_BOX, pu = 1 + 0.12 * Math.max(0, Math.sin(gt * 9)); ctx.fillStyle = '#7A5A3E'; ctx.fillRect(b.x - 10, b.y - 6, 20, 16); ctx.fillStyle = '#1D2129'; rr(b.x - 9, b.y - 10, 18, 9, 2); ctx.fill(); ctx.fillStyle = '#9AA6B3'; for (const sx of [-4.5, 4.5]) { ctx.beginPath(); ctx.arc(b.x + sx, b.y - 5.5, 3 * pu, 0, TAU); ctx.fill(); }
      const ph = (gt * 0.6) % 1; ctx.globalAlpha = 1 - ph; ctx.fillStyle = '#FFD24A'; ctx.font = '700 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('♪', b.x + 6 + ph * 6, b.y - 14 - ph * 18); ctx.fillStyle = '#7FD0C8'; ctx.fillText('♫', b.x - 8 - ph * 5, b.y - 20 - ((ph + 0.5) % 1) * 14); ctx.globalAlpha = 1; }
    // Feuertonne
    { const f = GV_BARREL; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(f.x + 2, f.y + 4, 10, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#4A4E55'; ctx.beginPath(); ctx.arc(f.x, f.y, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#2B2F36'; ctx.beginPath(); ctx.arc(f.x, f.y, 7, 0, TAU); ctx.fill();
      for (let k = 0; k < 6; k++) { const a = k * 1.05 + gt * 3, h = 5 + 3 * Math.sin(gt * 11 + k * 2); ctx.fillStyle = k % 2 ? '#FFB547' : '#FF6A3A'; ctx.beginPath(); ctx.ellipse(f.x + Math.cos(a) * 2.5, f.y - h * 0.4, 2.4, h * 0.6, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = '#FFF0B0'; ctx.beginPath(); ctx.arc(f.x, f.y - 1, 2, 0, TAU); ctx.fill();
      const sp = (gt * 0.9) % 1; ctx.globalAlpha = 1 - sp; ctx.fillStyle = '#FFD24A'; ctx.fillRect(f.x - 3 + Math.sin(gt * 5) * 4, f.y - 8 - sp * 20, 1.4, 1.4); ctx.globalAlpha = 1; }
    // Hehler-Tisch
    { const t = GV_TABLE; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(t.x + 3, t.y + 4, t.w, t.h); ctx.fillStyle = '#8A6A48'; ctx.fillRect(t.x, t.y, t.w, t.h); ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.fillRect(t.x, t.y + 7, t.w, 1); ctx.fillRect(t.x, t.y + 14, t.w, 1);
      ctx.fillStyle = '#3F8A58'; ctx.fillRect(t.x + 5, t.y + 5, 12, 7); ctx.fillStyle = '#7FD08A'; ctx.fillRect(t.x + 6, t.y + 4, 12, 6); ctx.fillStyle = '#EEF2F7'; ctx.fillRect(t.x + 26, t.y + 6, 6, 8); ctx.fillRect(t.x + 34, t.y + 8, 6, 8); ctx.fillStyle = '#C9A064'; ctx.fillRect(t.x + 42, t.y + 5, 6, 10); }
    // Basketballkorb an der Wand
    { const h = GV_HOOP; ctx.fillStyle = '#9AA6B3'; ctx.fillRect(h.x - 1, h.y - 3, 2, 6); ctx.fillStyle = '#F4F6FA'; ctx.fillRect(h.x - 12, h.y + 2, 24, 4); ctx.strokeStyle = '#E8833A'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(h.x, h.y + 10, 6, 3.5, 0, 0, TAU); ctx.stroke(); }
    // Leute, nach y sortiert
    const order = GV_NPC.slice().sort((p, q) => p.y - q.y);
    for (const n of order) {
      const sit = n.p === 'sit', dance = n.p === 'dance', ph = gt + n.ph;
      let x = n.x, y = n.y, a = n.a, st = 0;
      if (dance) { a = Math.PI / 2 + Math.sin(ph * 2.2) * 0.6; st = ph * 7; y += -Math.abs(Math.sin(ph * 5)) * 1.6; }
      if (n.p === 'ball') { a = Math.PI / 2 + Math.sin(ph * 0.7) * 0.3; }
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(n.x + 1, n.y + 8, 7, 3, 0, 0, TAU); ctx.fill();
      drawFigure(x, y + (sit ? 1 : 0), a, st, n.look);
      if (sit) { ctx.fillStyle = '#8E3B2E'; ctx.fillRect(n.x - 9, n.y + 5, 18, 5); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(n.x - 9, n.y + 9, 18, 1); } // Sitzkante ueber den Beinen
      if (n.p === 'ball') { const bb = Math.abs(Math.sin(ph * 4.5)); ctx.fillStyle = '#E8833A'; ctx.beginPath(); ctx.arc(n.x + 7, n.y + 8 - bb * 7, 2.8, 0, TAU); ctx.fill(); ctx.strokeStyle = '#7A3A1A'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(n.x + 4.2, n.y + 8 - bb * 7); ctx.lineTo(n.x + 9.8, n.y + 8 - bb * 7); ctx.stroke(); }
      if (n.p === 'smoke' || n.sm) { const sp = (ph * 0.5) % 1; ctx.globalAlpha = 0.45 * (1 - sp); ctx.fillStyle = '#C9D2DC'; ctx.beginPath(); ctx.arc(n.x + 5 + sp * 4, n.y - 14 - sp * 14, 2 + sp * 4, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    }
    // Wimpelkette ueber dem Hof
    ctx.strokeStyle = 'rgba(30,30,30,.8)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(x0 + 10, 2482); ctx.quadraticCurveTo((x0 + x1) / 2, 2496, x1 - 10, 2482); ctx.stroke();
    for (let k = 0; k < 30; k++) { const t = (k + 0.5) / 30, x = x0 + 10 + t * (x1 - x0 - 20), y = 2482 + 14 * 4 * t * (1 - t) * 0.5 + Math.sin(gt * 3 + k) * 0.6; ctx.fillStyle = GANGS[k % GANGS.length].band; ctx.beginPath(); ctx.moveTo(x - 4, y); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 7); ctx.closePath(); ctx.fill(); }
    // Hehler-Schild und Sprechblasen
    const on = atGV(), pu = 0.6 + 0.4 * Math.sin(gt * 3); pill(gvOpen() ? 'HEHLER · ' + gvPct() + ' %' : 'HEHLER · AB RUF ' + GV_REP, GV_AT.x, GV_TABLE.y - 8, on ? 'rgba(255,181,71,' + (0.7 + 0.3 * pu).toFixed(2) + ')' : '#FF8A6A');
    if (gvSay.i >= 0 && gvSay.t > 0) { const n = GV_NPC[gvSay.i]; gvBubble(n.x, n.y - 26, gvSay.txt); }
  }
  function drawGangHof2() { // v109: Westhof
    const G2 = GV2, P = GV2_P; if (!inView(G2.x + G2.w / 2, G2.y + G2.h / 2, 460)) return;
    if (!GV2_NPC[0].look) GV2_NPC.forEach((n, i) => { n.look = gangLook(GANGS[n.g], i + 20, i + 7); n.ph = i * 2.1; });
    const x0 = G2.x, y0 = G2.y - 3, x1 = G2.x + G2.w, y1 = WH;
    ctx.fillStyle = '#3A3E44'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0); ctx.fillStyle = 'rgba(0,0,0,.14)'; for (let x = x0; x < x1; x += 40) ctx.fillRect(x, y0, 1, y1 - y0); for (let y = y0 + 20; y < y1; y += 40) ctx.fillRect(x0, y, x1 - x0, 1);
    ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.lineWidth = 1; ctx.beginPath(); for (let k = 0; k < 16; k++) { const cx = x0 + 30 + ((k * 173) % (x1 - x0 - 60)), cy = y0 + 10 + ((k * 89) % (y1 - y0 - 20)); ctx.moveTo(cx, cy); ctx.lineTo(cx + 8, cy + 5); ctx.lineTo(cx + 14, cy + 3); } ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.25)'; for (const [ox, oy, r] of [[3640, 2470, 10], [3890, 2520, 14], [4060, 2470, 8]]) { ell(ox, oy, r, r * .55); ctx.fill(); }
    ctx.fillStyle = 'rgba(90,140,190,.25)'; ell(3820, 2560, 22, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.12)'; ell(3815, 2558, 10, 2); ctx.fill();
    ctx.fillStyle = '#44494F'; ctx.fillRect(x0, 2490, x1 - x0, 20); ctx.fillRect(3715, y0, 20, 2490 - y0); // Wege
    // Basketball-Halbfeld an der Suedmauer
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(P.hoop.x, P.hoop.y, 46, Math.PI, 0); ctx.stroke(); ctx.strokeRect(P.hoop.x - 14, P.hoop.y - 30, 28, 30);
    { const H = P.hoop; ctx.fillStyle = '#9AA6B3'; ctx.fillRect(H.x - 1, H.y - 3, 2, 6); ctx.fillStyle = '#F4F6FA'; ctx.fillRect(H.x - 12, H.y - 6, 24, 4); ctx.strokeStyle = '#E8833A'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(H.x, H.y - 9, 5, 2.4, 0, 0, TAU); ctx.stroke(); }
    // Mauer mit grossem Wandbild
    ctx.fillStyle = '#5A4A48'; ctx.fillRect(x0, 2590, x1 - x0, 10); ctx.fillStyle = 'rgba(0,0,0,.2)'; for (let x = x0; x < x1; x += 12) ctx.fillRect(x, 2590, 1, 10);
    const MC = ['#FF5C7A', '#3FA9FF', '#F2C81E', '#B36BFF', '#5FE584']; for (let k = 0; k < 16; k++) { ctx.fillStyle = MC[k % 5]; ctx.globalAlpha = .55; ctx.beginPath(); ctx.ellipse(x0 + 24 + k * 46, 2595, 18 + (k % 3) * 6, 4, 0, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
    ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 2.5; ctx.strokeStyle = '#15181D'; [['WESTHOF', 3910, '#F4F4F8'], ['KRONE', 3620, '#B36BFF'], ['VIPERN', 4220, '#F2C81E'], ['FRONT', 3770, '#3FA9FF'], ['FAUST', 4060, '#E0243A']].forEach(([t, x, c]) => { ctx.strokeText(t, x, 2595.5); ctx.fillStyle = c; ctx.fillText(t, x, 2595.5); });
    // Container mit Graffiti
    { const c = P.cont; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(c.x + 4, c.y + 5, c.w, c.h); ctx.fillStyle = '#2F6F8F'; ctx.fillRect(c.x, c.y, c.w, c.h); ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let x = c.x + 4; x < c.x + c.w; x += 6) ctx.fillRect(x, c.y, 2, c.h); ctx.fillStyle = '#3F8AAE'; ctx.fillRect(c.x, c.y, c.w, 4);
      ctx.save(); ctx.translate(c.x + c.w / 2, c.y + c.h / 2 + 2); ctx.rotate(-.08); ctx.font = '900 14px sans-serif'; ctx.lineWidth = 3; ctx.strokeStyle = '#15181D'; ctx.strokeText('TAG', 0, 0); ctx.fillStyle = '#FF5CA8'; ctx.fillText('TAG', 0, 0); ctx.restore(); ctx.fillStyle = '#F2C81E'; ctx.beginPath(); ctx.arc(c.x + 12, c.y + 28, 5, 0, TAU); ctx.fill(); }
    // Autowrack auf Steinen
    { const c = P.wreck; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(c.x + 3, c.y + 5, c.w, c.h); ctx.fillStyle = '#6A6E74'; for (const [wx, wy] of [[c.x + 10, c.y - 3], [c.x + c.w - 18, c.y - 3], [c.x + 10, c.y + c.h - 1], [c.x + c.w - 18, c.y + c.h - 1]]) ctx.fillRect(wx, wy, 9, 4);
      ctx.fillStyle = '#7A4A32'; rr(c.x, c.y, c.w, c.h, 6); ctx.fill(); ctx.fillStyle = '#5A3424'; for (let k = 0; k < 8; k++) ctx.fillRect(c.x + 4 + ((k * 23) % (c.w - 10)), c.y + 3 + ((k * 11) % (c.h - 6)), 5, 3); ctx.fillStyle = '#1D2129'; ctx.fillRect(c.x + 20, c.y + 4, 28, c.h - 8); ctx.fillStyle = 'rgba(160,200,230,.25)'; ctx.fillRect(c.x + 24, c.y + 7, 6, c.h - 14); }
    // Muellcontainer
    for (const d of P.dump) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(d.x + 3, d.y + 4, d.w, d.h); ctx.fillStyle = '#2E6B3E'; ctx.fillRect(d.x, d.y, d.w, d.h); ctx.fillStyle = '#245432'; ctx.fillRect(d.x, d.y, d.w, 6); ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.fillRect(d.x + 2, d.y + 8, d.w - 4, 1); ctx.fillStyle = '#C9D2DC'; ctx.fillRect(d.x + d.w - 12, d.y + 12, 6, 6); }
    // Reifenstapel
    { const t = P.tires; for (const [ox, oy] of [[-6, 2], [6, 2], [0, -5]]) { ctx.fillStyle = '#1A1C20'; ctx.beginPath(); ctx.arc(t.x + ox, t.y + oy, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#3A3F47'; ctx.beginPath(); ctx.arc(t.x + ox, t.y + oy, 3, 0, TAU); ctx.fill(); } }
    // Sofa
    { const c = P.couch; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(c.x + 3, c.y + 4, c.w, c.h); ctx.fillStyle = '#2F4A6E'; rr(c.x, c.y, c.w, c.h, 5); ctx.fill(); ctx.fillStyle = '#3E5E8A'; rr(c.x + 5, c.y + 8, c.w - 10, c.h - 10, 3); ctx.fill(); }
    // Feuertonne
    { const f = P.barrel; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(f.x + 2, f.y + 4, 10, 6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#4A4E55'; ctx.beginPath(); ctx.arc(f.x, f.y, 9, 0, TAU); ctx.fill(); ctx.fillStyle = '#2A2D32'; ctx.beginPath(); ctx.arc(f.x, f.y, 6.5, 0, TAU); ctx.fill();
      for (let k = 0; k < 6; k++) { const a = k * 1.05 + gt * 3, hh = 5 + 3 * Math.sin(gt * 11 + k * 2); ctx.fillStyle = k % 2 ? '#FFB547' : '#FF6A3A'; ctx.beginPath(); ctx.ellipse(f.x + Math.cos(a) * 2.5, f.y - hh * .4, 2.4, hh * .6, 0, 0, TAU); ctx.fill(); } }
    // Schild am Durchgang
    { const s = P.sign; ctx.fillStyle = '#2B2F36'; ctx.fillRect(s.x - 17, s.y - 6, 3, 18); ctx.fillRect(s.x + 14, s.y - 6, 3, 18); ctx.fillStyle = '#20262E'; rr(s.x - 40, s.y - 14, 80, 14, 4); ctx.fill(); ctx.strokeStyle = '#FF5C7A'; ctx.lineWidth = 1.2; rr(s.x - 40, s.y - 14, 80, 14, 4); ctx.stroke(); ctx.fillStyle = '#FF5C7A'; ctx.font = '900 8px sans-serif'; ctx.fillText('WESTHOF', s.x, s.y - 6.5); }
    ctx.textBaseline = 'alphabetic';
    // Leute
    for (const n of GV2_NPC.slice().sort((p, q) => p.y - q.y)) { const sit = n.p === 'sit', ph = gt + n.ph; let a = n.a, st = 0, y = n.y;
      if (n.p === 'dance') { a = Math.PI / 2 + Math.sin(ph * 2.2) * .6; st = ph * 7; y += -Math.abs(Math.sin(ph * 5)) * 1.6; } if (n.p === 'ball') a = Math.PI / 2 + Math.sin(ph * .7) * .3;
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(n.x + 1, n.y + 8, 7, 3, 0, 0, TAU); ctx.fill(); drawFigure(n.x, y + (sit ? 1 : 0), a, st, n.look);
      if (sit) { ctx.fillStyle = '#3E5E8A'; ctx.fillRect(n.x - 9, n.y + 5, 18, 5); }
      if (n.p === 'ball') { const bb = Math.abs(Math.sin(ph * 4.5)); ctx.fillStyle = '#E8833A'; ctx.beginPath(); ctx.arc(n.x + 7, n.y + 8 - bb * 7, 2.8, 0, TAU); ctx.fill(); }
      if (n.p === 'smoke' || n.sm) { const sp = (ph * .5) % 1; ctx.globalAlpha = .45 * (1 - sp); ctx.fillStyle = '#C9D2DC'; ctx.beginPath(); ctx.arc(n.x + 5 + sp * 4, n.y - 14 - sp * 14, 2 + sp * 4, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; } }
    // Lichterkette
    ctx.strokeStyle = 'rgba(30,30,30,.8)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x0 + 10, 2482); ctx.quadraticCurveTo((x0 + x1) / 2, 2496, x1 - 10, 2482); ctx.stroke();
    for (let k = 0; k < 24; k++) { const t = (k + .5) / 24, x = x0 + 10 + t * (x1 - x0 - 20), y = 2482 + 14 * 4 * t * (1 - t) * .5; ctx.fillStyle = MC[k % 5]; ctx.beginPath(); ctx.arc(x, y + 2, 1.8, 0, TAU); ctx.fill(); }
  }
  function drawGangSign() { // Torbogen am Durchgang von der Suedstrasse
    if (!inView(4645, 2262, 160)) return;
    const x = 4645, y = 2266;
    ctx.fillStyle = '#2B2F36'; ctx.fillRect(x - 17, y - 6, 3, 22); ctx.fillRect(x + 14, y - 6, 3, 22);
    ctx.fillStyle = '#20262E'; rr(x - 46, y - 14, 92, 16, 4); ctx.fill(); ctx.strokeStyle = '#FF5C7A'; ctx.lineWidth = 1.2; rr(x - 46, y - 14, 92, 16, 4); ctx.stroke();
    ctx.fillStyle = '#FF5C7A'; ctx.font = '900 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('GANGVIERTEL', x, y - 5.5); ctx.textBaseline = 'alphabetic';
  }
  function gvLights(L, oK) {
    if (inView(GV_BARREL.x, GV_BARREL.y, 200)) glow(GV_BARREL.x, GV_BARREL.y - 4, 90 + 8 * Math.sin(gt * 9), '255,140,60', (0.42 + 0.08 * Math.sin(gt * 13)) * L * oK);
    if (inView(4830, 2490, 460)) for (let k = 0; k < 10; k++) { const t = (k + 0.5) / 10; glow(GV.x + 10 + t * (GV.w - 20), 2486 + 7 * 4 * t * (1 - t) * 0.5, 26, ['255,92,122', '255,210,74', '120,200,255', '180,120,255'][k % 4], (0.22 + 0.06 * Math.sin(gt * 2 + k)) * L * oK); }
    if (inView(GV_CAR.x, GV_CAR.y, 160)) glow(GV_CAR.x + GV_CAR.w / 2, GV_CAR.y + GV_CAR.h / 2, 46, '170,90,255', 0.25 * L * oK); // Unterbodenbeleuchtung
  }
  const gangs = [], drops = []; let gangT = 60, gangN = 0, gangShield = 0, dropN = 0, gClock = 0, gangWasLead = true;
  const gShield = {}, dropHold = {}; // Schutzzeit je Mitspieler (beim Anfuehrer); eben aufgesammelte Beute (bei Mitspielern)
  const GANG_PREMIUM = 1.22, GANG_REP = 6;
  const rgbOf = c => 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
  const GANG_HS = [0, 9, 14, 13, 10, 6, 2]; // kurz, Glatze, Millimeter, Afro, Undercut, Zoepfe, stachelig
  function gangLook(def, i, n) {
    const k = def.kit[i % def.kit.length];
    return Object.assign({}, DEF_LOOK, { r: def.col[0], g: def.col[1], b: def.col[2], top: k.top, bot: k.bot, hat: k.bs === 'rag' ? 'none' : k.hat, band: def.band, bs: k.bs, shoe: 'sneaker', hair: [0, 1, 0, 1, 2][(i + n) % 5], hs: GANG_HS[(i * 3 + n) % GANG_HS.length], skin: (i * 2 + n) % SKIN_COLS.length, sex: (i + n) % 4 === 3 ? 'f' : 'm', outline: false });
  }
  // Wer kommt als Ziel in Frage: du selbst und Mitspieler, die auf der Strasse zu sehen sind
  function gangWho(id) {
    if (!id || id === mp.id) return { id: mp.id, me: true, x: player.x, y: player.y, inside: inBuilding(player.x, player.y) || player.x < 0 };
    const f = mp.friends[id]; if (!mp.on || !f || !f.vis || f.rg !== '') return null;
    return { id, me: false, f, x: f.x, y: f.y, inside: inBuilding(f.x, f.y) || f.x < 0 };
  }
  function gangCands() { const r = [gangWho(mp.id)]; if (mp.on) for (const id of Object.keys(mp.friends)) { const w = gangWho(id); if (w) r.push(w); } return r; }
  const whoName = id => !id || id === mp.id ? 'dich' : ((mp.friends[id] || {}).name || 'einen Freund');
  const threatOf = w => w.me ? threatScore() : ((batDef(w.f.bat) || {}).thr || 0);
  const gangNearD = (x, y) => { let d = 1e9; for (const w of gangCands()) d = Math.min(d, Math.hypot(w.x - x, w.y - y)); return d; };
  const gangUnit = prod => { const ar = AREAS[prod] || AREAS.keller; return (ar.price + repEff(G.rep) * 2.2) * seedMult(S(ar).up.seed) * GANG_PREMIUM * (night() > 0.3 ? 1.1 : 1); };
  const gangUnitOf = g => g.rem || !(g.want.unit > 0) ? gangUnit(g.want.prod) : g.want.unit; // Mitspieler rechnen mit ihrem eigenen Ruf
  const gKey = () => Math.random().toString(36).slice(2, 8);
  function gangEv(z) { if (!mp.on) return; z.k = gKey(); z.t = gClock; mp.gEv.push(z); mp.sendT = 9; } // Anfuehrer -> Mitspieler
  function gangUp(z) { if (!mp.on) return; z.k = gKey(); z.t = gClock; mp.gHit.push(z); mp.sendT = 9; } // Mitspieler -> Anfuehrer
  // Absicht auswuerfeln: nachts mehr Aerger, mit Abschreckung weniger; Diebe kommen eher, wenn du Ware traegst
  function gangRoll() {
    const thr = threatScore(), hostK = (night() > 0.3 ? 1.35 : 0.85) * (1 - 0.6 * thr / (thr + 45)) * (1 - krPerk('calm'));
    const wb = 1, ws = 0.8 * hostK * (carryTotal() > 0 ? 1.6 : 0.3), wa = 0.6 * hostK * (G.money > 300 ? 1 : 0.3);
    let r = Math.random() * (wb + ws + wa);
    return (r -= wb) < 0 ? 'buy' : (r -= ws) < 0 ? 'steal' : 'attack';
  }
  function gangWant() {
    const list = openAreas(); let tot = 0; for (const a of list) tot += 1 + S(a).inv.bags;
    let r = Math.random() * tot, ar = list[0]; for (const a of list) { r -= 1 + S(a).inv.bags; if (r < 0) { ar = a; break; } }
    const qty = clamp(Math.round(bagCap() * (0.7 + Math.random() * 1.3)), 5, 60);
    return { prod: ar.key, qty, left: qty, unit: gangUnit(ar.key), paid: 0 };
  }
  function gangMembers(g, x0, lane, dir, gap) {
    g.ms = []; g.trail = []; gap = gap === undefined ? 26 : gap;
    for (let i = 0; i < 3; i++) g.ms.push({ x: x0 - dir * gap * i, y: lane, ang: dir > 0 ? 0 : Math.PI, step: Math.random() * 6, hp: 2.5, stun: 0, down: 0, gone: false, loot: null, sp: 0, run: 0, cd: 0, look: gangLook(g.def, i, g.num), ds: 0, da: 0, dsT: 0 });
    for (let i = 2; i >= 0; i--) g.trail.push({ x: x0 - dir * gap * i, y: lane });
  }
  // v72: Gangs starten auf dem Wegenetz 450 bis 800 px von einem Spieler entfernt und laufen dann an ihm vorbei
  function gangSpawnPt(an) {
    if (Math.random() < 0.3 && Math.hypot(GV_DOOR.x - an.x, GV_DOOR.y - an.y) > 520) return { x: GV_DOOR.x, y: 2500 }; // v79: manchmal ziehen sie aus dem Gangviertel los
    for (let k = 0; k < 40; k++) { const p = navRandPt(Math.random() < 0.75, an.x, an.y, 820); if (p && Math.hypot(p.x - an.x, p.y - an.y) > 450) return p; }
    return navRandPt(false) || { x: 300, y: 535 };
  }
  function gangWalkPt(g, L) {
    if (g.wpN <= 1) { const c = gangCands().filter(w => w.x >= 0), an = c[Math.floor(Math.random() * c.length)]; const p = an && navRandPt(Math.random() < 0.7, an.x, an.y, 220); if (p) return p; }
    for (let k = 0; k < 12; k++) { const p = navRandPt(false, L.x, L.y, 900); if (p && Math.hypot(p.x - L.x, p.y - L.y) > 300) return p; }
    return navRandPt(false) || { x: L.x, y: L.y };
  }
  function gangExit(g) { // Ausgang am Kartenrand: nah an der Gang, weg vom Spieler
    const L = gangLead(g) || g.ms[0], T = gangWho(g.tgt) || gangWho(mp.id); let best = null, bs = Infinity;
    for (const i of NAV.exits) { const n = NAV.nodes[i], s = Math.hypot(n.x - L.x, n.y - L.y) - 0.5 * Math.hypot(n.x - T.x, n.y - T.y); if (s < bs) { bs = s; best = n; } }
    { const s = Math.hypot(GV_DOOR.x - L.x, GV_DOOR.y - L.y) - 0.5 * Math.hypot(GV_DOOR.x - T.x, GV_DOOR.y - T.y) - 150; if (s < bs) { bs = s; best = GV_DOOR; } } // v79: heim ins Gangviertel
    return best ? { x: best.x, y: best.y } : { x: L.x, y: L.y };
  }
  function spawnGang(o) {
    o = o || {};
    const busy = new Set(gangs.filter(g => !g.dead).map(g => g.def.id)), freeG = GANGS.filter(d => !busy.has(d.id)); // v60: nie zweimal dieselbe Gang gleichzeitig
    if (!o.def && !freeG.length) return null;
    const def = (o.def && GANGS.find(d => d.id === o.def)) || freeG[Math.floor(Math.random() * freeG.length)];
    const intent = o.intent || gangRoll(), cands = gangCands().filter(w => w.x >= 0), an = cands[Math.floor(Math.random() * cands.length)] || { x: player.x, y: player.y }; // rund um einen zufaelligen Spieler
    let x0 = o.x, y0 = o.y !== undefined ? o.y : o.lane;
    if (x0 === undefined || y0 === undefined) { const p = gangSpawnPt(an); x0 = p.x; y0 = p.y; }
    const dir = o.dir || (an.x >= x0 ? 1 : -1), lane = 0;
    const n = ++gangN;
    const g = { id: mp.id + '.' + n, num: n, def, dir, lane, st: 'walk', age: 0, tmr: 0, cT: 0, lost: 0, waitT: 55, sp: 56 + Math.random() * 10, intent, force: !!o.force, want: null, trail: [], ms: [], routed: false, dead: false, nextHit: 0, hits: 0, ko: 0, cash: 0, noteT: 0.5, ex: null, wp: null, wpN: 0, lostLoot: false, tgt: '' };
    gangMembers(g, x0, y0, dir, o.x !== undefined ? 26 : 6);
    if (o.x !== undefined) { g.wp = { x: clamp(x0 + dir * 700, 30, WW - 30), y: y0 }; g.wpN = 1; } // fester Start: erst geradeaus weiter
    if (intent === 'buy') g.want = gangWant();
    gangs.push(g);
    if (!o.quiet) msg('Eine Gang zieht durchs Viertel: ' + def.name);
    return g;
  }
  const gangLive = m => !m.gone && m.down <= 0;
  const gangLead = g => g.ms.find(gangLive) || null;
  // Punkt auf der Spur des Anfuehrers, dist Pixel hinter ihm
  function trailPoint(g, dist) {
    const L = gangLead(g), t = g.trail; if (!L) return { x: 0, y: 0 };
    let rest = dist, px = L.x, py = L.y;
    for (let i = t.length - 1; i >= 0; i--) {
      const d = Math.hypot(t[i].x - px, t[i].y - py);
      if (d >= rest) { const k = d > 0 ? rest / d : 0; return { x: px + (t[i].x - px) * k, y: py + (t[i].y - py) * k }; }
      rest -= d; px = t[i].x; py = t[i].y;
    }
    return { x: px, y: py };
  }
  function gangTrail(g) {
    const L = gangLead(g); if (!L) return;
    const t = g.trail, e = t[t.length - 1];
    if (!e || Math.hypot(L.x - e.x, L.y - e.y) >= 5) { t.push({ x: L.x, y: L.y }); if (t.length > 40) t.shift(); }
  }
  function gangGo(m, tx, ty, sp, dt) {
    { const w = viaPaths(m, tx, ty); tx = w.x; ty = w.y; }
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy); if (d < 1.5) return d;
    const a0 = Math.atan2(dy, dx), a = avoid(m, a0, dt, tx, ty, Math.min(26, d));
    const rem = turnTo(m, a === null ? a0 : a, dt, 9), f = Math.max(0.3, Math.cos(rem)), s = Math.min(sp * f * dt, d);
    move(m, Math.cos(m.ang) * s, Math.sin(m.ang) * s, 9); m.step += dt * 9 * Math.min(1.5, sp / 70);
    return d;
  }
  function gangFollow(g, dt, sp) {
    const L = gangLead(g); let k = 0;
    for (const m of g.ms) {
      if (!gangLive(m) || m === L) continue;
      k++; if (m.stun > 0) continue;
      const p = trailPoint(g, 26 * k), d = Math.hypot(p.x - m.x, p.y - m.y);
      if (d > 2.5) gangGo(m, p.x, p.y, Math.min(sp * 1.8, sp * (0.5 + d / 16)), dt);
    }
  }
  // Wen bemerkt die Kolonne? Den naechsten passenden Spieler in Reichweite
  function gangSees(g, L) {
    if (!G) return null; let best = null, bd = g.intent === 'buy' ? 290 : 250;
    for (const w of gangCands()) {
      if (w.inside) continue;
      const d = Math.hypot(w.x - L.x, w.y - L.y); if (d > bd) continue;
      if (!g.force && g.intent !== 'buy') {
        if (w.me) { if (g.intent === 'steal' && totalBags() <= 0 && G.money < 150) continue; if (g.intent === 'attack' && G.money < 120) continue; }
        else if (g.intent === 'steal' && !w.f.cy) continue;
      }
      bd = d; best = w;
    }
    return best;
  }
  function gangTellMsg(g) {
    if (g.intent === 'buy') { if (!g.want) return; const ar = AREAS[g.want.prod]; sfx.ping(); msg(g.def.name + ' will ' + g.want.qty + ' ' + ar.lbl.unit + ' kaufen (' + fmt(gangUnitOf(g)) + ' pro Stück)'); }
    else if (!g.tgt || g.tgt === mp.id) { sfx.bad(); vibrate(40); msg(g.def.name + (g.intent === 'steal' ? ' hat es auf deine Ware abgesehen!' : ' sucht Ärger mit dir!'), true); }
    else msg(g.def.name + ' hat es auf ' + whoName(g.tgt) + ' abgesehen!');
  }
  function gangTell(g, w) { g.st = 'tell'; g.tgt = w.id; g.tmr = g.intent === 'buy' ? 1.0 : 1.3; gangTellMsg(g); }
  function gangLeave(g) { g.esc = null; g.st = 'leave'; g.ex = gangExit(g); for (const m of g.ms) m.sp = g.sp + 8; }
  function gangFlee(g) {
    const L = gangLead(g) || g.ms[0]; g.st = 'flee'; g.ex = gangExit(g);
    { // v56: liegt ein Trampelpfad in der Naehe, verschwindet die Gang dort in den Hinterhoefen
      let best = null, bd = 450; for (const e of NAV.esc) { const d = Math.hypot(e.x - L.x, e.y - L.y); if (d < bd) { bd = d; best = e; } }
      g.esc = best; for (const m of g.ms) m.escI = 0;
    }
    for (const m of g.ms) m.sp = 108 + Math.random() * 12;
  }
  function gangVanish(g, m) {
    const e = g.ex || (g.ex = gangExit(g)); if (Math.hypot(m.x - e.x, m.y - e.y) < 30 || gangNearD(m.x, m.y) > 820) { m.gone = true; if (m.loot && !m.loot.pend) g.lostLoot = true; }
  }
  function gangRun(g, m, dt) {
    if (g.esc && g.st === 'flee') { const e = g.esc, t = m.escI ? { x: e.dx, y: e.dy } : { x: e.x, y: e.y }; if (gangGo(m, t.x, t.y, m.sp || 100, dt) < 10) { if (m.escI) { m.gone = true; if (m.loot && !m.loot.pend) g.lostLoot = true; } else m.escI = 1; } return; }
    const e = g.ex || (g.ex = gangExit(g)); gangGo(m, e.x, e.y, m.sp || 100, dt); gangVanish(g, m);
  }
  // Ueberfall auf dich selbst: gilt auf deinem eigenen Geraet (eigene Ware, eigenes Geld, eigene Abwehr)
  const myDef = () => { const D = defenseScore(); return D / (D + 25); };
  function robMe(def, ux, uy) {
    const df = myDef(), best = openAreas().map(a => ({ a, n: S(a).inv.bags })).sort((p, q) => q.n - p.n)[0];
    let loot, txt;
    if (best && best.n > 0) {
      const n = Math.max(1, Math.min(best.n, Math.ceil(best.n * 0.45 * (1 - df)))); S(best.a).inv.bags -= n; loot = { prod: best.a.key, n, cash: 0 };
      txt = '−' + n + ' ' + best.a.lbl.unit;
    } else {
      const c = Math.min(G.money, Math.round(clamp(G.money * 0.05, 15, 400 + G.rep * 25) * (1 - df)));
      if (c <= 0) { msg(def.name + ' findet nichts bei dir und zieht ab'); return null; }
      G.money -= c; loot = { prod: null, n: 0, cash: c }; txt = '−' + fmt(c);
    }
    player.stun = Math.max(player.stun, 0.55); mp.kb = { x: ux * 190, y: uy * 190, t: 0.25 }; gangShield = 2.5;
    floater(player.x, player.y - 22, txt, '#FF5C7A'); sfx.bad(); vibrate([60, 40, 90]);
    msg('Dieb von ' + def.name + ': ' + txt + '! Schnapp ihn dir, bevor er abhaut', true);
    return loot;
  }
  function punchMe(def, ux, uy) {
    const df = myDef(), loss = Math.min(G.money, Math.round(clamp(G.money * 0.04, 20, 300 + G.rep * 30) * (1 - df)));
    if (loss > 0) G.money -= loss;
    player.stun = Math.max(player.stun, 0.5 + 0.9 * (1 - df)); mp.kb = { x: ux * 260, y: uy * 260, t: 0.3 }; gangShield = 2.6;
    floater(player.x, player.y - 24, 'K.O.', '#FFD24A'); if (loss > 0) floater(player.x, player.y - 12, '−' + fmt(loss), '#FF5C7A');
    sfx.bad(); vibrate([90, 50, 120]); msg(def.name + ' verprügelt dich' + (loss > 0 ? ': −' + fmt(loss) : ''), true);
    return loss;
  }
  function gangCarry(g, m, c) { if (!(c > 0)) return; g.cash += c; for (const q of g.ms) if (q.loot && q.loot.cash) q.loot = null; m.loot = { prod: null, n: 0, cash: g.cash }; }
  function gangStrike(g, m, T) {
    T = T || gangWho(mp.id);
    if (g.nextHit > 0 || m.cd > 0 || m.stun > 0 || T.inside) return;
    const dx = T.x - m.x, dy = T.y - m.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d;
    if (T.me) {
      if (gangShield > 0 || player.stun > 0) return;
      g.nextHit = 0.7; m.cd = 2.2;
      if (g.intent === 'steal') { const loot = robMe(g.def, ux, uy); if (!loot) { gangLeave(g); return; } m.loot = loot; gangFlee(g); }
      else { gangCarry(g, m, punchMe(g.def, ux, uy)); g.hits++; if (g.hits >= 2) gangFlee(g); }
      return;
    }
    if ((gShield[T.id] || 0) > gClock) return; // Mitspieler: dessen Geraet rechnet ab und meldet die Beute zurueck
    gShield[T.id] = gClock + 2.6; g.nextHit = 0.7; m.cd = 2.2;
    gangEv({ e: g.intent === 'steal' ? 'rob' : 'punch', to: T.id, g: g.id, m: g.ms.indexOf(m), ux: +ux.toFixed(2), uy: +uy.toFixed(2) });
    floater(T.x, T.y - 24, g.intent === 'steal' ? 'Geklaut!' : 'K.O.', '#FFD24A'); sfx.bad();
    if (g.intent === 'steal') { m.loot = m.loot || { prod: null, n: 0, cash: 0, pend: 1 }; gangFlee(g); } else { g.hits++; if (g.hits >= 2) gangFlee(g); }
  }
  function gangTargets() {
    const r = [];
    for (const g of gangs) { if (g.intent === 'buy' || g.dead) continue; for (const m of g.ms) if (gangLive(m)) r.push({ gm: m, g, o: m }); }
    return r;
  }
  function gangHit(g, m, dmg, stunT, ux, uy, kp, by) {
    if (m.gone || m.down > 0) return;
    if (g.rem) { // Mitspieler: nur anzeigen und dem Anfuehrer melden, der rechnet Leben und K.O.
      m.stun = Math.max(m.stun, stunT); m.hold = gClock + 1.2; m.x += ux * kp; m.y += uy * kp; floater(m.x, m.y - 24, 'Treffer!', '#FFD24A');
      gangUp({ e: 'hit', g: g.id, m: g.ms.indexOf(m), d: +dmg.toFixed(2), s: +stunT.toFixed(2), ux: +ux.toFixed(2), uy: +uy.toFixed(2), kp: Math.round(kp) }); return;
    }
    m.lastBy = by || mp.id;
    m.hp -= dmg; m.stun = Math.max(m.stun, stunT); move(m, ux * kp, uy * kp, 9); m.cd = Math.max(m.cd, stunT * 0.6 + 0.5);
    if (g.st === 'walk' || g.st === 'tell') { g.st = 'come'; g.tgt = m.lastBy; g.cT = 0; g.lost = 0; for (const q of g.ms) q.sp = 88 + Math.random() * 14; }
    if (m.hp <= 0) gangDown(g, m); else floater(m.x, m.y - 24, 'Autsch!', '#FFD24A');
  }
  function gangDown(g, m) {
    m.down = 5.5; m.stun = 0; g.ko++;
    floater(m.x, m.y - 24, 'K.O.', '#FFD24A'); sfx.bad();
    if (m.loot && !m.loot.pend && (m.loot.n > 0 || m.loot.cash > 0)) { drops.push({ id: mp.id + '.d' + (++dropN), x: m.x, y: m.y, prod: m.loot.prod, n: m.loot.n || 0, cash: m.loot.cash || 0, t: 45, mc: 0 }); if (m.loot.cash && g.intent === 'attack') g.cash = 0; }
    m.loot = null;
    if (g.ko >= 2 && !g.routed) gangRouted(g, m.lastBy || mp.id);
  }
  const gangBounty = ko => Math.round((60 + G.rep * 12) * (1 + 0.25 * Math.max(0, ko - 2)));
  function gangRoutedMe(name, ko) { const b = gangBounty(ko); G.stat.gb++; G.money += b; addRep(0.5); sfx.cash(); msg(name + ' ist verjagt! Die Anwohner legen ' + fmt(b) + ' zusammen'); }
  function gangRouted(g, by) {
    g.routed = true;
    if (!by || by === mp.id || !mp.friends[by]) gangRoutedMe(g.def.name, g.ko);
    else { gangEv({ e: 'rout', to: by, n: g.def.name, ko: g.ko }); msg(g.def.name + ' wurde von ' + whoName(by) + ' verjagt'); }
    gangFlee(g);
  }
  // B ohne Waffe: kurzer Schubser gegen feindliche Gangs
  function gangShove() {
    if (!G || G.wpn.eq !== 'none' || player.stun > 0 || player.batCd > 0) return false;
    let best = null, bd = 36;
    for (const z of gangTargets()) { const d = Math.hypot(z.o.x - player.x, z.o.y - player.y); if (d < bd) { bd = d; best = z; } }
    if (!best) return false;
    const dx = best.o.x - player.x, dy = best.o.y - player.y, d = Math.hypot(dx, dy) || 1;
    player.ang = Math.atan2(dy, dx); player.batCd = 0.6; sfx.put();
    gangHit(best.g, best.gm, 0.6, 0.7, dx / d, dy / d, 34); return true;
  }
  // Wartende Kolonne in Reichweite (jeder Mitspieler darf liefern)
  function gangAt() {
    let best = null, bd = 56;
    for (const g of gangs) {
      if (g.st !== 'wait' || !g.want || g.want.left <= 0) continue;
      for (const m of g.ms) { if (!gangLive(m)) continue; const d = Math.hypot(player.x - m.x, player.y - m.y); if (d < bd) { bd = d; best = g; } }
    }
    return best;
  }
  function gangEarned(add) {
    [2000000, 10000000, 50000000].forEach(gl => { if (G.earned - add < gl && G.earned >= gl) msg('Meilenstein: ' + fmt(gl) + ' Umsatz!'); });
    if (!G.won && G.earned >= 500000) { G.won = true; msg('Ziel erreicht: 500.000 € Umsatz! Spiele weiter, so lange du willst.'); }
  }
  function gangDeliver(tg) {
    const g = gangs.find(x => x.id === tg.idx); if (!g || !g.want || g.st !== 'wait') return false;
    const ar = AREAS[g.want.prod], st = S(ar), n = Math.min(st.inv.bags, g.want.left);
    if (n <= 0) { sfx.bad(); msg(g.def.name + ' will noch ' + g.want.left + ' ' + ar.lbl.unit + ' – du hast keine', true); return false; }
    const tip = petPerk().tip || 1, unit = gangUnitOf(g), pay = Math.round(n * unit * tip);
    st.inv.bags -= n; g.want.left -= n; g.want.paid += pay; G.money += pay; G.earned += pay; G.stat.gv += n;
    sfx.cash(); floater(player.x, player.y - 22, '+' + fmt(pay), '#FFB547'); let add = pay;
    if (g.rem) { g.holdW = gClock + 2.5; gangUp({ e: 'del', g: g.id, n }); }
    if (g.want.left <= 0) {
      const bonus = Math.round(g.want.qty * unit * 0.12 * tip); G.money += bonus; G.earned += bonus; g.want.paid += bonus; add += bonus;
      addRep(REP_FAST * 1.5); msg(g.def.name + ' ist zufrieden: ' + fmt(g.want.paid) + ' inklusive ' + fmt(bonus) + ' Mengenbonus'); if (!g.rem) gangLeave(g);
    } else { if (!g.rem) g.waitT = Math.max(g.waitT, 20); msg('Teillieferung: ' + g.def.name + ' will noch ' + g.want.left + ' ' + ar.lbl.unit); }
    gangEarned(add); return true;
  }
  function gangObjective() {
    for (const g of gangs) if (g.intent !== 'buy' && (g.st === 'tell' || g.st === 'come') && (!g.tgt || g.tgt === mp.id)) return 'Gang im Anmarsch: wehr dich oder lauf weg';
    if (drops.length) return 'Hol deine Beute vom Boden';
    for (const g of gangs) if (g.st === 'flee' && g.ms.some(m => gangLive(m) && m.loot && !m.loot.pend)) return 'Schnapp dir den Dieb mit der Beute';
    for (const g of gangs) if (g.want && g.want.left > 0 && (g.st === 'wait' || g.st === 'come' || g.st === 'tell')) {
      const ar = AREAS[g.want.prod], have = S(ar).inv.bags;
      return have > 0 ? 'Gang wartet: liefere ' + Math.min(have, g.want.left) + ' ' + ar.lbl.unit + ' an ' + g.def.name : g.def.name + ' will ' + g.want.left + ' ' + ar.lbl.unit + ': hol Ware';
    }
    return null;
  }
  function gangCards(b) {
    let n = 0;
    for (const g of gangs) {
      if (!g.want || g.want.left <= 0 || !(g.st === 'tell' || g.st === 'come' || g.st === 'wait')) continue;
      const ar = AREAS[g.want.prod], u = gangUnitOf(g), c = document.createElement('div'); c.className = 'card'; n++;
      c.innerHTML = '<div class="nm">' + g.def.name + ' · ' + g.want.left + ' ' + ar.lbl.unit + ' · Großkunde</div><div class="pr">' + fmt(g.want.left * u) + '</div><div class="ds">' + (g.st === 'wait' ? 'wartet' + (g.tgt && g.tgt !== mp.id ? ' bei ' + whoName(g.tgt) : ' auf dich') + ', noch ' + Math.ceil(Math.max(0, g.waitT)) + ' s' : 'kommt zu ' + whoName(g.tgt)) + ' · ' + fmt(u) + ' pro Stück</div>';
      b.appendChild(c);
    }
    return n;
  }
  // Beute einsammeln (Anfuehrer direkt, Mitspieler sofort bei sich und Meldung an den Anfuehrer)
  function gangPickups(dt) {
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]; if (!d.rem) d.t -= dt; d.mc = (d.mc || 0) - dt;
      if (d.t <= 0) { drops.splice(i, 1); continue; }
      if (inBuilding(player.x, player.y) || Math.hypot(player.x - d.x, player.y - d.y) > 24) continue;
      if (d.cash) {
        G.money += d.cash; floater(d.x, d.y - 14, '+' + fmt(d.cash), '#FFB547'); msg('Beute zurück: ' + fmt(d.cash)); sfx.cash();
        if (d.rem) { dropHold[d.id] = gClock + 4; gangUp({ e: 'pick', d: d.id, n: 0, c: d.cash }); }
        drops.splice(i, 1); continue;
      }
      const ar = AREAS[d.prod]; if (!ar || !isOpen(ar)) { if (!d.rem) drops.splice(i, 1); continue; }
      const room = bagCap() - totalBags();
      if (room <= 0) { if (d.mc <= 0) { d.mc = 2.5; msg('Rucksack voll, die Beute bleibt liegen', true); } continue; }
      const n = Math.min(room, d.n); S(ar).inv.bags += n; d.n -= n; floater(d.x, d.y - 14, '+' + n + ' ' + ar.lbl.unit, '#FFB547'); sfx.put(); msg('Beute zurück: ' + n + ' ' + ar.lbl.unit);
      if (d.rem) { dropHold[d.id] = gClock + 4; gangUp({ e: 'pick', d: d.id, n, c: 0 }); }
      if (d.n <= 0) drops.splice(i, 1);
    }
  }
  // Anfuehrerwechsel: uebernimmt die gesehenen Gangs und spielt sie selbst weiter
  function gangAdopt() {
    for (const g of gangs) {
      if (!g.rem) continue;
      g.rem = false; g.tmr = 0.5; g.cT = 0; g.lost = 0; g.noteT = 0.5; g.sp = 60; g.age = 0; g.ex = null; g.wp = null; g.wpN = 1; g.nextHit = 0; g.hits = 0; g.force = false; g.routed = false; g.lostLoot = false;
      g.ko = g.ms.filter(m => m.down > 0).length; g.cash = 0;
      for (const m of g.ms) { m.hp = m.down > 0 ? 0.1 : 2.5; m.cd = 0; m.run = m.down > 0 ? 1 : 0; m.sp = g.st === 'flee' ? 110 : g.st === 'leave' ? 68 : 92; m.ds = 0; m.da = 0; m.dsT = 0; if (m.loot && m.loot.cash) g.cash += m.loot.cash; delete m.sx; delete m.sy; delete m.syn; }
      const L = gangLead(g) || g.ms[0]; g.trail = [{ x: L.x - g.dir * 52, y: L.y }, { x: L.x - g.dir * 26, y: L.y }, { x: L.x, y: L.y }];
      if (g.want) { g.want.unit = gangUnit(g.want.prod); g.want.paid = 0; }
      if ((g.st === 'tell' || g.st === 'come' || g.st === 'wait') && !gangWho(g.tgt)) gangLeave(g);
    }
    for (const d of drops) if (d.rem) d.rem = false;
  }
  function updateGangs(dt) {
    if (!G) return;
    gClock += dt;
    if (gangShield > 0) gangShield -= dt;
    const lead = copLead();
    if (lead && !gangWasLead) gangAdopt();
    else if (!lead && gangWasLead) { for (let i = gangs.length - 1; i >= 0; i--) if (!gangs[i].rem) gangs.splice(i, 1); for (let i = drops.length - 1; i >= 0; i--) if (!drops[i].rem) drops.splice(i, 1); }
    gangWasLead = lead;
    gangPickups(dt);
    if (!lead) { // Mitspieler: nur glaetten, was der Anfuehrer meldet
      for (const g of gangs) for (const m of g.ms) {
        if (m.stun > 0) m.stun -= dt;
        if (m.sx === undefined) continue;
        const dx = m.sx - m.x, dy = m.sy - m.y, d = Math.hypot(dx, dy);
        if (d > 300) { m.x = m.sx; m.y = m.sy; } else { const k = Math.min(1, dt * 9); m.x += dx * k; m.y += dy * k; }
        if (d > 1.5 && m.down <= 0) m.step += dt * 9;
        let da = m.sa - m.ang; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; m.ang += da * Math.min(1, dt * 10);
      }
      return;
    }
    if (G.rep >= GANG_REP) { // neue Kolonne
      gangT -= dt;
      if (gangT <= 0) {
        gangT = (65 + Math.random() * 70) * (1 - Math.min(0.4, G.rep / 150)); // v60: oefter
        if (gangs.length < (G.rep >= 15 ? 2 : 1) && !(STU.on && STU.calm)) spawnGang();
      }
    }
    for (let i = gangs.length - 1; i >= 0; i--) {
      const g = gangs[i]; g.age += dt; gangStep(g, dt);
      if (g.age > 300 && g.st !== 'flee' && g.st !== 'leave') gangLeave(g);
      if (g.dead) { if (g.lostLoot && !g.routed) msg('Die Diebe sind mit der Beute entkommen', true); gangs.splice(i, 1); }
    }
  }
  function gangStep(g, dt) {
    const hostile = g.intent !== 'buy';
    for (const m of g.ms) {
      if (m.gone) continue;
      if (m.cd > 0) m.cd -= dt;
      if (m.stun > 0) m.stun -= dt;
      if (m.down > 0) { m.down -= dt; if (m.down <= 0) { m.down = 0; m.hp = 0.1; m.run = 1; m.sp = 108 + Math.random() * 12; } }
    }
    if (g.nextHit > 0) g.nextHit -= dt;
    if (g.ms.every(m => m.gone)) { g.dead = true; return; }
    const L = gangLead(g); if (!L) return; // alle liegen gerade am Boden
    let T = null;
    if (g.st === 'tell' || g.st === 'come' || g.st === 'wait') { T = gangWho(g.tgt); if (!T) { gangLeave(g); return; } }
    if (g.st === 'walk') {
      if (!g.wp || Math.hypot(L.x - g.wp.x, L.y - g.wp.y) < 22) { g.wpN = (g.wpN || 0) + 1; if (g.wpN > 3) { gangLeave(g); return; } g.wp = gangWalkPt(g, L); } // v72: Wegpunkte auf dem Wegenetz
      if (L.stun <= 0) gangGo(L, g.wp.x, g.wp.y, g.sp, dt);
      g.dir = g.wp.x >= L.x ? 1 : -1;
      gangTrail(g); gangFollow(g, dt, g.sp);
      g.noteT -= dt;
      if (g.noteT <= 0) { g.noteT = 0.3; const w = gangSees(g, L); if (w) gangTell(g, w); }
      if (g.age > 8 && gangNearD(L.x, L.y) > 1100) g.dead = true;
    } else if (g.st === 'tell') {
      g.tmr -= dt;
      for (const m of g.ms) if (gangLive(m)) turnTo(m, Math.atan2(T.y - m.y, T.x - m.x), dt, 8);
      if (g.tmr <= 0) {
        const thr = threatOf(T);
        if (hostile && !g.force && Math.random() < thr / (thr + 70)) { msg(g.def.name + (T.me ? ' sieht deine Ausrüstung und zieht ab' : ' sieht die Ausrüstung von ' + whoName(T.id) + ' und zieht ab')); gangLeave(g); }
        else { g.st = 'come'; g.cT = 0; g.lost = 0; if (hostile) for (const m of g.ms) m.sp = 88 + Math.random() * 14; }
      }
    } else if (g.st === 'come') {
      g.cT += dt;
      const dP = Math.hypot(T.x - L.x, T.y - L.y);
      if (!hostile) { // Grosskunde kommt zu dir und wartet
        if (T.inside) { g.waitT -= dt; }
        else if (dP > 42) { if (L.stun <= 0) gangGo(L, T.x, T.y, 76, dt); gangTrail(g); gangFollow(g, dt, 76); }
        else { g.st = 'wait'; }
        if (g.waitT <= 0 || g.cT > 60) { msg(g.def.name + ' hat ' + (T.me ? 'dich' : whoName(T.id)) + ' nicht gefunden und zieht ab'); gangLeave(g); }
      } else {
        if (T.inside || dP > 400) g.lost += dt; else g.lost = Math.max(0, g.lost - dt * 0.5);
        let idx = 0;
        for (const m of g.ms) {
          idx++; if (!gangLive(m)) continue;
          if (m.run) { gangRun(g, m, dt); continue; }
          if (m.stun > 0) continue;
          const a = idx * 2.1 + g.num;
          gangGo(m, T.x + Math.cos(a) * 12, T.y + Math.sin(a) * 12, m.sp || 92, dt);
          if (g.st === 'come' && Math.hypot(T.x - m.x, T.y - m.y) < 21) gangStrike(g, m, T);
        }
        if (g.st === 'come' && (g.lost > 4 || g.cT > 26)) { msg(g.def.name + ' gibt auf'); gangLeave(g); }
      }
    } else if (g.st === 'wait') {
      g.waitT -= dt;
      const dP = Math.hypot(T.x - L.x, T.y - L.y);
      if (L.stun <= 0) turnTo(L, Math.atan2(T.y - L.y, T.x - L.x), dt, 6);
      gangFollow(g, dt, 76);
      if (dP > 80 && !T.inside) { g.st = 'come'; g.cT = 0; }
      if (g.waitT <= 0) { msg(g.def.name + ' hat keine Zeit mehr' + (g.want.paid > 0 || g.want.left < g.want.qty ? ' und nimmt, was da war' : ''), g.want.left >= g.want.qty); gangLeave(g); }
    } else { // flee / leave
      for (const m of g.ms) if (gangLive(m) && m.stun <= 0) gangRun(g, m, dt);
      g.outT = (g.outT || 0) + dt; // haengt jemand fest, verschwindet die Kolonne nach 45 s
      if (g.outT > 45) for (const m of g.ms) if (!m.gone && m.down <= 0) { m.gone = true; if (m.loot) g.lostLoot = true; }
    }
  }
  // ---------- Gangs im Mehrspieler (v52) ----------
  function gangSync() {
    return gangs.slice(0, 3).map(g => [g.id, GANGS.indexOf(g.def), G_INT.indexOf(g.intent), G_ST.indexOf(g.st), g.tgt || '', g.num % 1000,
      g.want ? [AREA_KEYS.indexOf(g.want.prod), g.want.qty, g.want.left, Math.round(Math.max(0, g.waitT))] : 0,
      g.ms.map(m => [Math.round(m.x), Math.round(m.y), Math.round(m.ang * 100), m.gone ? 1 : 0, Math.round(Math.max(0, m.down) * 10), Math.round(Math.max(0, m.stun) * 10), m.loot && !m.loot.pend ? (m.loot.cash ? -Math.round(m.loot.cash) : m.loot.n) : 0, m.loot && m.loot.prod ? AREA_KEYS.indexOf(m.loot.prod) : -1]),
      g.dir, g.lane]);
  }
  function dropSync() { return drops.slice(0, 8).map(d => [d.id || (d.id = mp.id + '.d' + (++dropN)), Math.round(d.x), Math.round(d.y), d.prod ? AREA_KEYS.indexOf(d.prod) : -1, d.n | 0, Math.round(d.cash || 0), Math.round(d.t)]); }
  function mpApplyGangs(gg, gd) {
    if (copLead() || !G) return;
    if (Array.isArray(gg)) {
      const seen = {};
      for (const q of gg.slice(0, 3)) {
        if (!Array.isArray(q) || typeof q[0] !== 'string' || q[0].length > 30 || !Array.isArray(q[7])) continue;
        const def = GANGS[q[1] | 0] || GANGS[0], intent = G_INT[q[2] | 0] || 'buy', st = G_ST[q[3] | 0] || 'walk', tgt = typeof q[4] === 'string' && q[4].length <= 24 ? q[4] : '';
        seen[q[0]] = 1;
        let g = gangs.find(z => z.id === q[0]);
        if (!g) {
          g = { id: q[0], num: clamp(q[5] | 0, 0, 999), def, dir: 1, lane: 543, st, age: 0, intent, want: null, ms: [], trail: [], rem: true, tgt, waitT: 0 };
          gangMembers(g, 0, 543, 1); gangs.push(g); if (state === 'play') msg('Eine Gang zieht durchs Viertel: ' + def.name);
        }
        const prev = g.st; g.st = st; g.tgt = tgt; g.intent = intent; g.dir = +q[8] < 0 ? -1 : 1; g.lane = 0;
        const w = q[6];
        if (Array.isArray(w) && AREA_KEYS[w[0] | 0]) {
          const left = clamp(w[2] | 0, 0, 60), qty = clamp(w[1] | 0, 1, 60);
          let wp = AREA_KEYS[w[0] | 0]; if (!isOpen(AREAS[wp])) wp = 'keller'; // v119: Gangs fragen dich nur nach Ware, die du herstellen kannst
          if (!g.want) g.want = { prod: wp, qty, left, unit: 0, paid: 0 };
          g.want.prod = wp; g.want.qty = qty; if (!(gClock < (g.holdW || 0)) || left < g.want.left) g.want.left = left;
          g.waitT = clamp(+w[3] || 0, 0, 120);
        } else g.want = null;
        q[7].slice(0, 3).forEach((r, i) => {
          if (!Array.isArray(r)) return; const m = g.ms[i], x = +r[0], y = +r[1]; if (!m || !Number.isFinite(x) || !Number.isFinite(y)) return;
          m.sx = clamp(x, XMIN - 200, WW + 200); m.sy = clamp(y, YMIN, WH); m.sa = Number.isFinite(+r[2]) ? +r[2] / 100 : m.ang;
          if (!m.syn) { m.x = m.sx; m.y = m.sy; m.ang = m.sa; m.syn = true; }
          m.gone = +r[3] === 1; m.down = clamp((+r[4] || 0) / 10, 0, 10); if (!(gClock < (m.hold || 0))) m.stun = clamp((+r[5] || 0) / 10, 0, 10);
          const lv = +r[6] || 0, lp = AREA_KEYS[r[7] | 0];
          m.loot = lv > 0 ? { prod: lp || 'keller', n: Math.min(lv, 99), cash: 0 } : lv < 0 ? { prod: null, n: 0, cash: Math.min(-lv, 1e7) } : null;
        });
        if (prev !== 'tell' && st === 'tell' && state === 'play') gangTellMsg(g);
      }
      for (let i = gangs.length - 1; i >= 0; i--) if (gangs[i].rem && !seen[gangs[i].id]) gangs.splice(i, 1);
    }
    if (Array.isArray(gd)) {
      const seen = {};
      for (const q of gd.slice(0, 8)) {
        if (!Array.isArray(q) || typeof q[0] !== 'string' || q[0].length > 30 || !Number.isFinite(+q[1]) || !Number.isFinite(+q[2])) continue;
        if (gClock < (dropHold[q[0]] || 0)) continue; // eben selbst aufgesammelt
        const prod = AREA_KEYS[q[3] | 0] || null, n = clamp(q[4] | 0, 0, 99), cash = clamp(Math.round(+q[5] || 0), 0, 1e7); if (!n && !cash) continue;
        seen[q[0]] = 1; let d = drops.find(z => z.id === q[0]);
        if (!d) { d = { id: q[0], rem: true, mc: 0 }; drops.push(d); }
        d.x = clamp(+q[1], XMIN, WW); d.y = clamp(+q[2], YMIN, WH); d.prod = prod; d.n = n; d.cash = cash; d.t = clamp(+q[6] || 1, 0.1, 60);
      }
      for (let i = drops.length - 1; i >= 0; i--) if (drops[i].rem && !seen[drops[i].id]) drops.splice(i, 1);
    }
  }
  const gSeen = (peer, k) => { const key = peer + ':' + k; if (mp.gSeen[key] !== undefined) return true; mp.gSeen[key] = gClock; for (const x of Object.keys(mp.gSeen)) if (gClock - mp.gSeen[x] > 10) delete mp.gSeen[x]; return false; };
  const unitV = (x, y) => { let ux = +x, uy = +y; if (!Number.isFinite(ux) || !Number.isFinite(uy)) return null; const l = Math.hypot(ux, uy); return l < 0.01 ? null : [ux / l, uy / l]; };
  // Beim Mitspieler: Anfuehrer meldet einen Ueberfall auf ihn oder ein Kopfgeld
  function mpGangEvents(peer, list) {
    if (!G || peer !== copLeaderId() || copLead()) return;
    for (const z of list) {
      if (!z || typeof z.k !== 'string' || z.k.length > 8 || z.to !== mp.id || gSeen(peer, z.k)) continue;
      if (z.e === 'rout') { const nm = GANGS.find(d => d.name === z.n) ? z.n : 'Die Gang'; gangRoutedMe(nm, clamp(z.ko | 0, 2, 3)); continue; }
      if (z.e !== 'rob' && z.e !== 'punch') continue;
      const g = gangs.find(x => x.id === z.g), mi = clamp(z.m | 0, 0, 2), u = unitV(z.ux, z.uy) || [1, 0], def = g ? g.def : GANGS[0];
      if (inBuilding(player.x, player.y)) continue;
      if (z.e === 'rob') { const loot = robMe(def, u[0], u[1]); gangUp({ e: 'loot', g: z.g, m: mi, p: loot && loot.prod ? loot.prod : '', n: loot ? loot.n : 0, c: loot ? loot.cash : 0 }); }
      else { const c = punchMe(def, u[0], u[1]); gangUp({ e: 'loot', g: z.g, m: mi, p: '', n: 0, c, pu: 1 }); }
    }
  }
  // Beim Anfuehrer: Treffer, Lieferungen, Beute und Aufsammeln der Mitspieler
  function mpGangHits(peer, list) {
    if (!G || !copLead() || !mp.friends[peer]) return;
    const f = mp.friends[peer];
    for (const z of list) {
      if (!z || typeof z.k !== 'string' || z.k.length > 8 || gSeen(peer, z.k)) continue;
      if (z.e === 'pick') { const d = drops.find(q => q.id === z.d); if (!d) continue; if (d.cash) drops.splice(drops.indexOf(d), 1); else { d.n -= clamp(z.n | 0, 0, 99); if (d.n <= 0) drops.splice(drops.indexOf(d), 1); } continue; }
      const g = gangs.find(x => x.id === z.g); if (!g) continue;
      const m = g.ms[clamp(z.m | 0, 0, 2)];
      if (z.e === 'hit') {
        const u = unitV(z.ux, z.uy); if (!u || !m || g.intent === 'buy' || Math.hypot(f.x - m.x, f.y - m.y) > 260) continue;
        gangHit(g, m, clamp(+z.d || 0, 0, 3), clamp(+z.s || 0, 0, 6), u[0], u[1], clamp(+z.kp || 0, 0, 40), peer);
      } else if (z.e === 'del') {
        if (!g.want || g.want.left <= 0) continue;
        g.want.left = Math.max(0, g.want.left - clamp(z.n | 0, 1, 60));
        if (g.want.left <= 0) { msg(g.def.name + ' hat bei ' + whoName(peer) + ' alles bekommen und zieht ab'); gangLeave(g); } else g.waitT = Math.max(g.waitT, 20);
      } else if (z.e === 'loot' && m) {
        const c = clamp(Math.round(+z.c || 0), 0, 1e7), n = clamp(z.n | 0, 0, 99), p = AREAS[z.p] ? z.p : null;
        if (z.pu) gangCarry(g, m, c);
        else { m.loot = n > 0 && p ? { prod: p, n, cash: 0 } : c > 0 ? { prod: null, n: 0, cash: c } : null; if (m.loot && m.down > 0) gangDown2(g, m); }
      }
    }
  }
  function gangDown2(g, m) { // Beute kam erst an, als der Dieb schon lag
    drops.push({ id: mp.id + '.d' + (++dropN), x: m.x, y: m.y, prod: m.loot.prod, n: m.loot.n || 0, cash: m.loot.cash || 0, t: 45, mc: 0 }); m.loot = null;
  }
  function drawGangs() {
    for (const d of drops) { // Beute am Boden
      if (!inView(d.x, d.y, 30) || (d.t < 8 && Math.floor(gt * 6) % 2)) continue;
      const bob = Math.sin(gt * 5 + d.x) * 1.5;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(d.x, d.y + 7, 8, 3, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,210,74,.65)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(d.x, d.y - 2 + bob, 10 + Math.sin(gt * 6) * 1.2, 0, TAU); ctx.stroke();
      ctx.fillStyle = d.cash ? '#7FD08A' : '#C9A064'; ctx.beginPath(); ctx.arc(d.x, d.y - 2 + bob, 7, 0, TAU); ctx.fill();
      ctx.fillStyle = '#10151C'; ctx.font = '800 9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(d.cash ? '€' : String(d.n), d.x, d.y - 1.5 + bob);
    }
    for (const g of gangs) {
      const col = rgbOf(g.def.col);
      for (const m of g.ms) {
        if (m.gone || !inView(m.x, m.y, 40)) continue;
        if (m.down > 0) { // liegt benommen am Boden
          ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(m.x + 1, m.y + 5, 12, 4, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(m.x, m.y + 1, 12, 6.5, 0, 0, TAU); ctx.fill();
          ctx.fillStyle = SKIN_COLS[m.look.skin % SKIN_COLS.length]; ctx.beginPath(); ctx.arc(m.x + 8, m.y, 4.2, 0, TAU); ctx.fill();
          ctx.strokeStyle = '#10151C'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(m.x + 6.5, m.y - 1.5); ctx.lineTo(m.x + 8, m.y); ctx.moveTo(m.x + 8, m.y - 1.5); ctx.lineTo(m.x + 6.5, m.y); ctx.stroke();
          drawStars(m.x + 4, m.y - 6, gt + m.x); continue;
        }
        drawFigure(m.x, m.y, m.ang, m.step, m.look);
        if (m.loot && !m.loot.pend) { ctx.fillStyle = m.loot.cash ? '#7FD08A' : '#C9A064'; ctx.beginPath(); ctx.arc(m.x - 8, m.y - 7, 5, 0, TAU); ctx.fill(); ctx.fillStyle = '#10151C'; ctx.font = '800 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(m.loot.cash ? '€' : String(m.loot.n), m.x - 8, m.y - 6.5); }
        if (m.stun > 0) drawStars(m.x, m.y - 14, gt + m.x);
      }
      const L = gangLead(g); if (!L || !inView(L.x, L.y, 60)) continue;
      const hostile = g.intent !== 'buy';
      if (g.st === 'tell') {
        const k = 1 + 0.12 * Math.sin(gt * 9), c = hostile ? '#FF5C7A' : '#7FD08A';
        ctx.save(); ctx.translate(L.x, L.y - 42); ctx.scale(k, k);
        ctx.fillStyle = 'rgba(16,21,28,.9)'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill(); ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = c; ctx.font = '800 14px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(hostile ? '!' : '€', 0, 1); ctx.restore();
      } else if (g.st === 'wait' && g.want) {
        pill('€ ' + g.want.left + ' ' + AREAS[g.want.prod].lbl.unit, L.x, L.y - 42, '#7FD08A');
      } else if ((g.st === 'come' && hostile) || (g.st === 'flee' && g.ms.some(m => gangLive(m) && m.loot && !m.loot.pend))) {
        ctx.fillStyle = '#FF5C7A'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText('!', L.x, L.y - 24);
      }
      if (g.st === 'walk' || g.st === 'tell' || g.st === 'wait') pill(g.def.name, L.x, L.y - 22, col);
    }
  }

