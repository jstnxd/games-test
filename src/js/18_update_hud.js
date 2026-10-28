  // ---------- Update ----------
  function objectiveFor(ar) {
    const st = S(ar), inv = st.inv, L = ar.lbl, lab = ar.key === 'brau', T = L.table || 'Packtisch', D = L.dried || 'Trockene'; // v88: Labor-Woerter
    if (st.tab.bags > 0 && totalBags() < bagCap()) return 'Hole fertige ' + L.unit + ' am ' + T + ' (B)';
    if (inv.dried >= ar.packN) return 'Packe ' + L.unit + ' am ' + T;
    if (st.tab.dry >= ar.packN - 1e-6 && !(G.staff[ar.roleKey.packer] > 0)) return 'Packe die ' + D + ' auf dem ' + T + ' ab (A halten)';
    if (st.rack.dry >= 1) return 'Nimm ' + D + ' mit B aus dem ' + (lab ? L.rack : 'Gestell');
    if (inv.fresh > 0) return rackCap(ar) - Math.floor(st.rack.wet + st.rack.dry) <= 0 ? L.rack + ' voll, warte' + (lab ? ' auf die Kristalle' : ' aufs Trocknen') : L.fresh + (lab ? ' in den Kristallisierer füllen' : ' ins Trockengestell hängen');
    if (st.pots.some((p, i) => i < potsOpen(ar) && p.s === 2)) return lab ? 'Fülle die fertige Lösung ab' : 'Ernte die reifen Pflanzen';
    if (st.pots.some((p, i) => i < potsOpen(ar) && p.s === 1 && p.w < 0.5)) return lab ? 'Kühle die Reaktoren' : 'Gieße die Pflanzen';
    if (st.pots.some((p, i) => i < potsOpen(ar) && p.s === 0) && G.money >= seedCost(ar)) return lab ? 'Starte einen Ansatz im Reaktor' : 'Pflanze Samen in einen Topf';
    return null;
  }
  function objective() {
    { const go = gangObjective(); if (go) return go; }
    if (totalBags() > 0 && G.orders.length) {
      let best = null, bd = 1e9;
      for (const o of G.orders) { const p = orderPos(o), d = Math.hypot(player.x - p.x, player.y - p.y); if (d < bd && S(AREAS[o.prod || 'keller']).inv.bags >= o.qty) { bd = d; best = o; } }
      if (best) return 'Liefere an ' + HOUSES[best.house].name + (best.mob ? ' (läuft herum)' : '');
    }
    const list = openAreas().sort((a, b) => (b.key === curKey) - (a.key === curKey)), multi = list.length > 1;
    for (const ar of list) { const r = objectiveFor(ar); if (r) return (multi ? ar.name + ': ' : '') + r; }
    { const fo = floorObjective(); if (fo) return fo; }
    if (G.crate > 0 && totalBags() < bagCap()) return 'Hol ' + G.crate + ' Beutel aus der Sammelkiste';
    if (G.orders.length && totalBags() === 0) return 'Es warten Aufträge, brauche Ware';
    return 'Warte, bis die Ware fertig ist';
  }
  function update(dt) {

    // Zeit
    G.time += dt * timeRate(G.time); if (G.time >= 1440) { G.time -= 1440; G.day++; payDaily(); }
    // Aufträge
    lgTick(dt); tdTick(dt); tipTick(dt); // v121, v128
    if (!sleepS) G.nextOrder -= dt; // v98: im Schlaf kommen keine neuen Kunden
    if (G.nextOrder <= 0) { addOrder(); G.nextOrder = clamp(20 - G.rep * 0.8, 7, 20) * (0.7 + Math.random() * 0.6) / (1 + 0.5 * Math.min(4, Object.keys(mp.friends).length)) / krOrd(); }
    for (let i = G.orders.length - 1; i >= 0; i--) { if (G.orders[i].remote || sleepS) continue; G.orders[i].t -= dt; if (G.orders[i].t <= 0) { msg('Auftrag von ' + HOUSES[G.orders[i].house].name + ' ist abgelaufen' + (KR_NEUTRAL ? '' : ' (Ruf −0,1)'), true); if (!KR_NEUTRAL) { G.repP = Math.max(0, (G.repP || G.rep) - 0.1); G.rep = Math.floor(G.repP + 1e-9); } G.orders.splice(i, 1); } }
    for (const o of G.orders) if (o.mob && !o.remote) roamStep(o, dt, 16, 4);
    for (const ar of openAreas()) {
      const st = S(ar);
      // Pflanzen
      for (let i = 0; i < st.pots.length; i++) {
        const p = st.pots[i]; if (p.s !== 1) continue;
        p.w = Math.max(0, p.w - dt * krWater() / (24 * (1 + 0.3 * (st.up.water || 0))));
        if (p.w > 0.12) { p.p += dt / growTime(ar); if (p.p >= 1) { p.p = 1; p.s = 2; sfx.ping(); floater(ar.POTS[i].x, ar.POTS[i].y - 22, 'Reif', '#FFB547'); } }
      }
      // Trockengestell
      if (st.rack.wet > 0) { const m = Math.min(st.rack.wet, dryRate(ar) * dt); st.rack.wet -= m; st.rack.dry += m; if (st.rack.wet < 0.001) { st.rack.dry += st.rack.wet; st.rack.wet = 0; } }
    }
    prGrow(dt); // v89
    for (const w of workers) workerUpdate(w, dt);
    catUpdate(dt); // v94
    bizTick(dt); raidTick(dt); // v100
    // Bewegung
    let mx = 0, my = 0;
    if (joy.id !== null) { mx = joy.dx; my = joy.dy; }
    if (keys.ArrowLeft || keys.KeyA) mx -= 1; if (keys.ArrowRight || keys.KeyD) mx += 1;
    if (keys.ArrowUp || keys.KeyW) my -= 1; if (keys.ArrowDown || keys.KeyS) my += 1;
    if (player.batCd > 0) player.batCd -= dt;
    if (player.sw) { player.sw.t += dt; if (player.sw.t >= 0.3) player.sw = null; }
    if (troll.flip > gt) { mx = -mx; my = -my; } if (troll.freeze > gt) { mx = my = 0; } // v115: Troll-Effekte vom Admin
    if (player.stun > 0) { player.stun -= dt; mx = my = 0; aEdge = false; bEdge = false; }
    if (G.veh.on && (player.stun > 0 || inBuilding(player.x, player.y))) G.veh.on = false;
    const ml = Math.hypot(mx, my), ox = player.x, oy = player.y;
    if (inCar()) carDrive(dt, mx, my); // v70: A Gas, B Bremse, Driften
    else if ((player.carOn = false) || ml > 0.12) {
      const k = Math.min(1, ml) / ml, sp = (riding() ? VEH_BY[G.veh.eq].spd : walkSpeed()) * (troll.slow > gt ? 0.4 : troll.fast > gt ? 1.9 : 1); // v70: Fahrzeuge mit festem Tempo
      { const ddx = mx * k * sp * dt, ddy = my * k * sp * dt, n = Math.max(1, Math.ceil(Math.hypot(ddx, ddy) / 7)); for (let q = 0; q < n; q++) move(player, ddx / n, ddy / n, player.r); } // v66: Autos sind schnell
      player.ang = Math.atan2(my, mx); player.step += dt * 9;
    }
    if (player.fl && !(player.x > IN.x0 && player.x < IN.x1 && player.y > IN.y0 && player.y < IN.y1)) player.fl = 0;
    if (mp.kb.t > 0) { const kt = Math.min(dt, mp.kb.t); move(player, mp.kb.x * kt, mp.kb.y * kt, player.r); mp.kb.t -= dt; }
    fxUpdate(dt, inCar() ? 0 : Math.hypot(player.x - ox, player.y - oy));
    petUpdate(dt, Math.hypot(player.x - ox, player.y - oy));
    if (zoneLocked(player.x, player.y)) { player.x = 410; player.y = 535; player.fl = 0; cam.x = player.x; cam.y = player.y; G.veh.on = false; msg('Dieser Stadtteil ist noch gesperrt, du bist zurück am Keller', true); } // v86
    const here = areaAt(player.x, player.y); if (here) curKey = here;
    // Aktion
    const tg = findTarget();
    const hold = tg && ((tg.type === 'pot' && potOf(tg).s === 1) || tg.type === 'table');
    if (!(hold && aHeld && tg.type === 'table')) packPr = Math.max(0, packPr - dt * 2);
    binTgI = tg && tg.type === 'bin' ? tg.idx : -1;
    if (bEdge && hqCarry) { hqCarry = null; bEdge = false; msg('Abgebrochen, die Deko bleibt, wo sie war.'); } // v125
    if (bEdge && tg && tg.type === 'bin') { const n = stashSum(G.stash[tg.idx]); if (n || carryTotal() >= 1 || (mp.on && Object.keys(mp.friends).length)) { binUse(tg.idx); bEdge = false; } }
    if (inCar() && Math.abs(player.cs || 0) > 40) bEdge = false; // im fahrenden Auto ist B die Bremse
    if (bEdge && !inCar() && !(tg && (tg.type === 'table' || tg.type === 'crate')) && (batSwing() || gangShove() || mpTryPush())) bEdge = false;
    act(tg, dt);
    aEdge = false; bEdge = false;
    updateCops(dt); updateGangs(dt); gvUpdate(dt); gvNpcUpdate(dt); krUpdate(dt); updateCars(dt); achTick(dt); ambUpdate(dt); binTick(); smokeUpdate(dt);
    for (let i = floaters.length - 1; i >= 0; i--) { floaters[i].t += dt; if (floaters[i].t > 1.3) floaters.splice(i, 1); }
    zoneTick(); potIndTick(dt);
    updateHud(tg);
  }

  // ---------- HUD ----------
  const cache = {};
  // v64: Meldungen rutschen unter die Ware-Anzeige, wenn diese laenger wird
  // v67: kleine Live-Minikarte: Strassen, Fluss, Gebaeude, du (orange) und deine Freunde in ihrer Outfit-Farbe
  const MINI = { w: 132, h: 68, t: -1, base: null, d: 2 }; // Groesse kommt aus den Einstellungen (v71)
  function miniBase(d, mw, mh) { // v96: schoenere Minikarte: Gruen mit Verlauf, Baeume, Gehwege, Mittellinien, Daecher in ihrer Farbe
    const c = document.createElement('canvas'); c.width = (mw || MINI.w) * d; c.height = (mh || MINI.h) * d; const x = c.getContext && c.getContext('2d'); if (!x) return null;
    const px = WW / c.width; // Weltpixel pro Kartenpixel
    x.scale(c.width / WW, c.height / (WH - YMIN)); x.translate(0, -YMIN);
    const gg = x.createLinearGradient(0, YMIN, WW, WH); gg.addColorStop(0, '#2A4A34'); gg.addColorStop(1, '#203A2A'); x.fillStyle = gg; x.fillRect(0, YMIN, WW, WH - YMIN);
    for (const z of GROUNDS) { x.fillStyle = { park: '#33623F', garden: '#2E5839', allot: '#2E5839', dog: '#3A6A40', pitch: '#3C8048', lot: '#566070', skate: '#6A7380', play: '#B89A62' }[z.t] || '#2E5839'; x.fillRect(z.x, z.y, z.w, z.h); if (z.t === 'pitch') { x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = px * 0.8; x.strokeRect(z.x + 20, z.y + 20, z.w - 40, z.h - 40); x.beginPath(); x.moveTo(z.x + z.w / 2, z.y + 20); x.lineTo(z.x + z.w / 2, z.y + z.h - 20); x.stroke(); } }
    x.fillStyle = '#4E8A55'; for (const t of TREES) { x.beginPath(); x.arc(t[0], t[1] - 6, 24, 0, TAU); x.fill(); } x.fillStyle = 'rgba(120,190,110,.35)'; for (const t of TREES) { x.beginPath(); x.arc(t[0] - 7, t[1] - 13, 10, 0, TAU); x.fill(); }
    x.fillStyle = '#2F7FB8'; x.fillRect(0, RIVER.y0, WW, RIVER.y1 - RIVER.y0); x.fillStyle = 'rgba(140,210,255,.55)'; x.fillRect(0, RIVER.y0, WW, px); x.fillRect(0, RIVER.y1 - px, WW, px);
    x.fillStyle = '#2F7FB8'; for (const b of BROOKS) x.fillRect(b.x - 14, b.y0, 28, b.y1 - b.y0);
    x.fillStyle = '#8E98A4'; for (const r of RD) { if (r.h) x.fillRect(0, r.c0 - SW, WW, r.c1 - r.c0 + 2 * SW); else x.fillRect(r.c0 - SW, YMIN, r.c1 - r.c0 + 2 * SW, WH - YMIN); }
    x.fillStyle = '#3B424D'; for (const r of RD) { if (r.h) x.fillRect(0, r.c0, WW, r.c1 - r.c0); else x.fillRect(r.c0, YMIN, r.c1 - r.c0, WH - YMIN); }
    x.fillStyle = 'rgba(232,200,90,.75)'; for (const r of RD) { const m = (r.c0 + r.c1) / 2, lw = Math.max(8, px * 0.7); if (r.h) { for (let k = 0; k < WW; k += px * 5) x.fillRect(k, m - lw / 2, px * 2.6, lw); } else { for (let k = YMIN; k < WH; k += px * 5) x.fillRect(m - lw / 2, k, lw, px * 2.6); } }
    x.fillStyle = '#9A7650'; for (const b of ALLB.concat(HBR)) x.fillRect(b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0); x.fillRect(PIER.x0, PIER.y0, PIER.x1 - PIER.x0, PIER.y1 - PIER.y0); x.fillStyle = '#F4F4F8'; x.fillRect(PIER.boat.x - 36, PIER.boat.y - 10, 72, 20); // v109: Steg und Boot
    for (const hs of HOUSES) { x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(hs.x + px * 0.6, hs.y + px * 0.6, hs.w, hs.h); x.fillStyle = hs.gang ? '#7A2F3A' : hs.roof; x.fillRect(hs.x, hs.y, hs.w, hs.h); x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(hs.x, hs.y, hs.w, hs.h * 0.45); }
    const bld = (r, col) => { x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(r.x + px * 0.6, r.y + px * 0.6, r.w, r.h); x.fillStyle = col; x.fillRect(r.x, r.y, r.w, r.h); x.fillStyle = 'rgba(255,255,255,.2)'; x.fillRect(r.x, r.y, r.w, Math.max(px, r.h * 0.3)); };
    bld({ x: 40, y: 40, w: 572, h: 480 }, '#4FCB76'); bld({ x: 1920, y: 40, w: 540, h: 480 }, '#B09050'); bld({ x: 1920, y: 728, w: 540, h: 480 }, '#4A8FB0');
    bld(GYM, '#5A6474'); bld(GYM2, '#5A6474'); bld(BANK, '#E8DFC8'); bld(PIZZA, '#C0603E'); bld(CLUB, '#D04A98'); bld(APO, '#F2F4F7'); bld(LAGER, '#9AA6B3'); bld(AUTOHOF, '#B4BEC8'); bld(WERK, '#E8833A'); bld(CAS, '#8A1E3A');
    x.fillStyle = '#7A8494'; for (const c2 of CONTAINERS) x.fillRect(c2[0], c2[1], c2[2], c2[3]);
    bld({ x: KIOSK.x - 10, y: KIOSK.y - 10, w: KIOSK.w + 20, h: KIOSK.h + 20 }, '#E8ECF2');
    x.fillStyle = '#5FB0E0'; x.beginPath(); x.arc(FOUNTAIN.x, FOUNTAIN.y, 50, 0, TAU); x.fill(); x.fillStyle = '#3F8FC4'; x.fillRect(POND.x, POND.y, POND.w, POND.h);
    x.fillStyle = '#7A2F3A'; x.fillRect(GV.x, GV.y, GV.w, GV.h); x.fillRect(GV2.x, GV2.y, GV2.w, GV2.h);
    return c;
  }
  // v109: wo bin ich? Klein unter der Minikarte
  let locLast = '', locT = -9;
  const LOC_PLACES = () => [[MARKT, 'Marktplatz'], [PLAY, 'Spielplatz'], [SKATE, 'Skaterpark'], [PITCH, 'Bolzplatz'], [DOGS, 'Hundewiese'], [GV, 'Gang-Hof'], [GV2, 'Westhof'], [{ x: PIER.x0 - 30, y: PIER.y0 - 30, w: PIER.x1 - PIER.x0 + 140, h: PIER.y1 - PIER.y0 + 40 }, 'Hafen'], [{ x: 792, y: 728, w: 948, h: 572 }, 'Stadtpark'], [CAS, 'Casino'], [{ x: 0, y: UFER_N - 16, w: WW, h: UFER_S + 16 - UFER_N + 16 }, 'am Fluss']];
  function locName() {
    if (!G) return '';
    if (player.fl === 4) return 'Gang-Hauptquartier';
    if (player.fl === 3) return (BIZ[bizIn] ? BIZ[bizIn].name : 'Laden') + ' · Hinterzimmer';
    if (player.fl === 2) return 'Mietraum';
    if (player.x < 0) return 'Bei Freunden';
    const ak = AREA_KEYS.find(k => { const I = AREAS[k].IN; return player.x > I.x0 && player.x < I.x1 && player.y > I.y0 && player.y < I.y1; }); if (ak) return AREAS[ak].name;
    const px = player.x, py = player.y, z = ZONE_DEF.find(d => d.r.some(([x0, y0, x1, y1]) => px >= x0 && px < x1 && py >= y0 && py < y1)), zn = z ? z.name : 'Startviertel';
    const pl = LOC_PLACES().find(([R0]) => px >= R0.x && px < R0.x + R0.w && py >= R0.y && py < R0.y + R0.h);
    if (pl) return zn + ' · ' + pl[1];
    const rd = RD.filter(r => r.h ? py > r.c0 - SW && py < r.c1 + SW : px > r.c0 - SW && px < r.c1 + SW);
    if (rd.length) return zn + ' · ' + (rd.length > 1 ? rd.map(r => r.name).join(' / ') : rd[0].name);
    return zn;
  }
  let hudFitK = '', bankCompact = false;
  const bankTxt = v => bankCompact && v >= 1e4 ? '€ ' + (v >= 1e6 ? (v / 1e6).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' Mio.' : (v / 1e3).toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' Tsd.') : fmt(v);
  function hudFitRep() { // v110: Ruf und Kontostand bleiben in einer Zeile; wenn es eng wird, etwas kleiner und zur Not kurz geschrieben
    const row = $('repRow'), col = row && row.parentElement, bv = $('bankV'); if (!row || !col || !bv || !G) return;
    const k = W + '|' + H + '|' + String(Math.round(G.bank || 0)).length + '|' + G.rep; if (k === hudFitK) return; hudFitK = k;
    bankCompact = false; bv.textContent = fmt(G.bank || 0); cache.bankV = null; row.classList.remove('t1', 't2');
    const lim = col.getBoundingClientRect().width || 0; if (!lim || row.scrollWidth <= lim + 1) return;
    row.classList.add('t1'); if (row.scrollWidth <= lim + 1) return; row.classList.remove('t1'); row.classList.add('t2'); if (row.scrollWidth <= lim + 1) return;
    bankCompact = true;
  }
  function locTick() { if (gt - locT < 0.3) return; locT = gt; const t = locName(), s = t ? '📍 ' + rkTagHere() + t : '', el = $('locHud'), mi = $('mini'); if (el && mi) { const w = Math.round(mi.getBoundingClientRect().width); if (w && el._w !== w) { el._w = w; el.style.width = w + 'px'; el.style.maxWidth = w + 'px'; } } if (s !== locLast) { locLast = s; if (el) { el.textContent = s; el.style.fontSize = ''; for (const fs of [9.5, 9, 8.5]) { if (el.scrollWidth <= el.clientWidth + 1) break; el.style.fontSize = fs + 'px'; } } } }
  // ---------- v119: App Stadt: alle Orte, die man sonst nur durch Hinlaufen findet, mit Wegpunkt ----------
  function renderOrte(b) {
    const P = [
      ['🌿', 'Dein Keller', DOOR, 'Anbauen, trocknen, packen'], ['🍂', 'Tabakscheune', DOOR2, 'Zweite Produktion', () => G.t.unlocked], ['⚗️', 'Chemielabor', DOOR3, 'Dritte Produktion (rein fiktiv)', () => G.b.unlocked],
      ['🏢', 'Mietraum (Lager-Tor)', LAGER_AT, 'Ware einlagern, Premium-Anbau für die Apotheke', () => G.lager.own],
      ['🏪', 'Kiosk', KIOSK_AT, 'Bandanas, Baggy-Jeans und Spezialwaffen gibt es nur hier'], ['🏋️', 'Iron Gym Express', GYM2_AT, 'Training für einen Spieltag (ab Ruf 0)'], ['🏋️', 'Iron Gym', GYM_AT, 'Training, kann man später als Laden kaufen'],
      ['🍕', 'Pizzeria Bella Notte', PIZZA_AT, 'Pizza fürs Team: Helfer arbeiten schneller'], ['💊', 'Apotheke', APO_AT, 'Apotheken-Dosen an Dr. Weber verkaufen'], ['🏦', 'Stadtsparkasse', BANK_AT, 'Sparkonto mit Zinsen, sicher vor Razzien'],
      ['🏠', 'Makler-Büro', MAKLER_AT, 'Läden kaufen (Hinterzimmer)'], ['🚗', 'Autohof', AH_AT, 'Autos kaufen, mehr Laderaum'], ['🔧', 'Autowerkstatt', WS_AT, 'Tuning und Farbe fürs Auto'],
      ['🎰', 'Casino', { x: (CAS_DOOR.x0 + CAS_DOOR.x1) / 2, y: CAS.y + CAS.h + 24 }, 'Slots, Glücksrad und Blackjack'], ['🪩', 'Neon Club', CLUB_AT, 'Nachts Club-Lieferungen'], ['🤝', 'Hehler', GV_AT, 'Ware schnell loswerden, im Gangviertel']
    ].filter(q => q[2] && q[2].x > 0);
    uiInfo(b, 'Alle wichtigen Orte der Stadt. Tippe auf „Hinführen“: Ein Wegpunkt erscheint, ein pinker Pfeil zeigt dir den Weg. Bushaltestellen bringen dich schnell in freigeschaltete Viertel.');
    for (const [ic, nm, at, ds, own] of P) {
      const zr = zoneRepAt(at.x, at.y), lock = G.rep < zr, d = Math.round(Math.hypot(player.x - at.x, player.y - at.y) / 10), c = uiEl('div', 'card');
      const nmEl = uiEl('div', 'nm', ''); nmEl.innerHTML = ic + ' ' + nm + (own && own() ? ' <span style="color:var(--green);font-weight:700">· deins</span>' : ''); c.appendChild(nmEl); c.appendChild(uiEl('div', 'pr', lock ? '🔒 ab Ruf ' + zr : player.x >= 0 ? d + ' m' : ''));
      c.appendChild(uiEl('div', 'ds', ds + (lock ? '. Liegt in einem Viertel, das noch gesperrt ist.' : '')));
      const bt = uiEl('button', 'buy' + (lock ? ' alt' : ''), wayPt && Math.hypot(wayPt.x - at.x, wayPt.y - at.y) < 5 ? '📍 Ziel gesetzt' : '📍 Hinführen'); bt.addEventListener('click', () => { wayPt = { x: at.x, y: at.y }; closePhone(); msg('📍 Wegpunkt: ' + nm); }); c.appendChild(bt); b.appendChild(c);
    }
    const my = Object.keys(G.stash || {}).map(Number).filter(i => stashSum(G.stash[i]) > 0 && BINS[i]); // v123: eigene Tonnen-Verstecke
    const hd = uiEl('div', 'grp', '🗑️ Deine Verstecke in Mülleimern'); b.appendChild(hd);
    if (!my.length) uiInfo(b, 'Du hast gerade nichts versteckt. Mit Ware dabei an einem Mülleimer B drücken: versteckt. Ohne Ware B: wieder rausholen.');
    for (const i of my) { const B = BINS[i], d = Math.round(Math.hypot(player.x - B.x, player.y - B.y) / 10), c = uiEl('div', 'card');
      c.appendChild(uiEl('div', 'nm', '🗑️ Mülleimer · ' + ((ZONES.find(z => B.x >= z.x0 && B.x < z.x1 && B.y >= z.y0 && B.y < z.y1) || {}).name || 'Stadt'))); c.appendChild(uiEl('div', 'pr', d + ' m')); c.appendChild(uiEl('div', 'ds', stashText(G.stash[i]) + '. Andere Spieler können es klauen, wenn sie davor stehen und wühlen.'));
      const bt = uiEl('button', 'buy', '📍 Hinführen'); bt.addEventListener('click', () => { wayPt = { x: B.x, y: B.y }; closePhone(); msg('📍 Wegpunkt: dein Versteck'); }); c.appendChild(bt); b.appendChild(c); }
  }
  // ---------- v117: grosse Karte (Minikarte antippen) mit Wegpunkt ----------
  let wayPt = null, bigOpen = false; const BIGM = { w: 300, h: 210, base: null, d: 2, t: -1 };
  const BZ = { z: 1, zr: 1, ox: 0, oy: 0, vw: 300, vh: 210, max: 4, pts: new Map(), drag: false, pinch: null, last: null, endT: 0 }; // v121: Zoom und Verschieben
  function bigZClamp() { BZ.z = clamp(BZ.z, 1, BZ.max); BZ.ox = clamp(BZ.ox, BZ.vw - BZ.vw * BZ.z, 0); BZ.oy = clamp(BZ.oy, BZ.vh - BZ.vh * BZ.z, 0); }
  function bigZApply() { const cv2 = $('bigCv'); if (!cv2 || !cv2.style) return; bigZClamp(); cv2.style.width = BZ.vw * BZ.zr + 'px'; cv2.style.height = BZ.vh * BZ.zr + 'px'; cv2.style.transform = 'translate(' + BZ.ox.toFixed(1) + 'px,' + BZ.oy.toFixed(1) + 'px) scale(' + (BZ.z / BZ.zr).toFixed(4) + ')'; try { $('bigZin').disabled = BZ.z >= BZ.max - 0.01; $('bigZout').disabled = BZ.z <= 1.01; } catch (e) {} }
  function bigZoomAt(cx, cy, nz) { const u = (cx - BZ.ox) / BZ.z, v = (cy - BZ.oy) / BZ.z; BZ.z = clamp(nz, 1, BZ.max); BZ.ox = cx - u * BZ.z; BZ.oy = cy - v * BZ.z; bigZApply(); }
  function bigZSettle() { if (Math.abs(BZ.zr - BZ.z) > 0.01) { BZ.zr = BZ.z; bigZApply(); bigMapDraw(); } }
  function bigZoomBtn(f) { bigZoomAt(BZ.vw / 2, BZ.vh / 2, BZ.z * f); bigZSettle(); }
  function bigViewXY(e) { const r = $('bigView').getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
  function bigPDown(e) { if (e.target && e.target.closest && e.target.closest('.bm-zoom')) return; BZ.pts.set(e.pointerId, bigViewXY(e)); if (BZ.pts.size === 1) { BZ.drag = false; BZ.last = bigViewXY(e); BZ.start = BZ.last; } if (BZ.pts.size === 2) { const [a, b] = [...BZ.pts.values()]; BZ.pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, z: BZ.z }; BZ.drag = true; } try { e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId); } catch (er) {} }
  function bigPMove(e) {
    if (!BZ.pts.has(e.pointerId)) return; const p = bigViewXY(e); BZ.pts.set(e.pointerId, p);
    if (BZ.pts.size >= 2 && BZ.pinch) { const [a, b] = [...BZ.pts.values()], dd = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; if (BZ.pinch.mx !== undefined) { BZ.ox += mx - BZ.pinch.mx; BZ.oy += my - BZ.pinch.my; } BZ.pinch.mx = mx; BZ.pinch.my = my; bigZoomAt(mx, my, BZ.pinch.z * dd / BZ.pinch.d); return; }
    if (BZ.pts.size === 1 && BZ.last) { if (!BZ.drag && Math.hypot(p[0] - BZ.start[0], p[1] - BZ.start[1]) > 8) BZ.drag = true; if (BZ.drag) { BZ.ox += p[0] - BZ.last[0]; BZ.oy += p[1] - BZ.last[1]; bigZApply(); } BZ.last = p; }
  }
  function bigPUp(e) { if (!BZ.pts.has(e.pointerId)) return; BZ.pts.delete(e.pointerId); if (BZ.pts.size < 2) BZ.pinch = null; if (BZ.pts.size === 1) { BZ.last = [...BZ.pts.values()][0]; BZ.start = BZ.last; } if (!BZ.pts.size) { if (BZ.drag) BZ.endT = performance.now(); bigZSettle(); } }
  function bigWheel(e) { e.preventDefault(); const [cx, cy] = bigViewXY(e); bigZoomAt(cx, cy, BZ.z * Math.exp(-e.deltaY * 0.0022)); clearTimeout(bigWheel.t); bigWheel.t = setTimeout(bigZSettle, 220); }
  function bigMapOpen() {
    revLegend(); if (pgMember()) rkLoad().then(revLegend, () => {}); // v129: Reviere frisch laden (höchstens einmal pro Minute)
    if (state !== 'play' || phoneOpen || chatOpen) return; const el = $('bigMap'); if (!el) return; bigOpen = true; el.hidden = false; joy.id = null; joy.dx = joy.dy = 0; aHeld = false; bigMapLayout(); if (BZ.z > 1 && player.x >= 0) { BZ.ox = BZ.vw / 2 - player.x / WW * BZ.vw * BZ.z; BZ.oy = BZ.vh / 2 - (player.y - YMIN) / (WH - YMIN) * BZ.vh * BZ.z; bigZApply(); } bigMapDraw(); sfx.put();
  }
  function bigMapClose() { bigOpen = false; const el = $('bigMap'); if (el) el.hidden = true; }
  function bigMapLayout() {
    const cv2 = $('bigCv'), box = $('bigBox'); if (!cv2 || !box) return; const r = box.getBoundingClientRect(), ar = WW / (WH - YMIN);
    let w = r.width, h = w / ar; if (h > r.height) { h = r.height; w = h * ar; } w = Math.max(100, Math.floor(w)); h = Math.max(70, Math.floor(h));
    if (BIGM.w !== w / 2 || BIGM.h !== h / 2) { BIGM.w = w / 2; BIGM.h = h / 2; BIGM.base = null; } const vw = $('bigView'); if (vw && vw.style) { vw.style.width = w + 'px'; vw.style.height = h + 'px'; }
    if (BZ.vw !== w || BZ.vh !== h) { const k = w / BZ.vw; BZ.ox *= k; BZ.oy *= k; BZ.vw = w; BZ.vh = h; } bigZApply();
  }
  function bigMapDraw() { const cv2 = $('bigCv'); if (!bigOpen || !cv2 || !cv2.getContext) return; BIGM.t = gt; const dB = 2 * Math.max(1, Math.min(3, window.devicePixelRatio || 1)); mapDraw(cv2, BIGM, dB * Math.min(1, 3072 / (BIGM.w * dB * BZ.zr)), true, BZ.zr); const n = Object.values(mp.friends).filter(f => f.vis && f.x >= 0).length; setText('bigInfo', (mp.on ? '🟢 ' + n + ' andere online · ' : '') + (wayPt ? '📍 Wegpunkt gesetzt · ' + Math.round(Math.hypot(player.x - wayPt.x, player.y - wayPt.y) / 10) + ' m' : (BZ.z > 1.05 ? 'Zoom ' + BZ.z.toFixed(1) + '× · ziehen zum Verschieben · tippen für Wegpunkt' : 'Tippen für Wegpunkt · mit zwei Fingern zoomen'))); const db = $('bigDel'); if (db) db.hidden = !wayPt; }
  function bigMapTap(e) {
    if (BZ.drag || performance.now() - BZ.endT < 250) { BZ.drag = false; return; } // nach Verschieben oder Zoomen kein Wegpunkt
    const cv2 = $('bigCv'), r = cv2.getBoundingClientRect(); if (!r.width) return;
    const wx = (e.clientX - r.left) / r.width * WW, wy = YMIN + (e.clientY - r.top) / r.height * (WH - YMIN);
    if (wayPt && Math.hypot(wx - wayPt.x, wy - wayPt.y) < 120) { wayPt = null; msg('Wegpunkt entfernt'); } else { wayPt = { x: clamp(wx, 20, WW - 20), y: clamp(wy, YMIN + 20, WH - 20) }; sfx.ping(); msg('📍 Wegpunkt gesetzt'); }
    bigMapDraw();
  }
  function wayTick() { if (wayPt && G && player.x >= 0 && Math.hypot(player.x - wayPt.x, player.y - wayPt.y) < 50) { wayPt = null; sfx.cash(); msg('📍 Ziel erreicht', false, 'ok'); } if (bigOpen && gt - BIGM.t > 0.15) bigMapDraw(); }
  function drawWayPt() { if (shotOn()) return; // Fahne am Ziel und ein Pfeil am Bildrand, wenn es nicht zu sehen ist
    if (!wayPt || player.x < 0) return; const p = wayPt, bob = Math.sin(gt * 3) * 2;
    if (inView(p.x, p.y, 30)) { ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 9, 3.5, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,92,168,.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(p.x, p.y + 2, 14 + 4 * Math.sin(gt * 4), 6, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = '#E8E2D0'; ctx.fillRect(p.x - 1, p.y - 30 + bob, 2, 32); ctx.fillStyle = '#FF5CA8'; ctx.beginPath(); ctx.moveTo(p.x + 1, p.y - 30 + bob); ctx.lineTo(p.x + 16, p.y - 25 + bob + Math.sin(gt * 6) * 1.5); ctx.lineTo(p.x + 1, p.y - 19 + bob); ctx.closePath(); ctx.fill(); return; }
    const a = Math.atan2(p.y - player.y, p.x - player.x), ex = player.x + Math.cos(a) * 52, ey = player.y - 4 + Math.sin(a) * 40, dist = Math.round(Math.hypot(p.x - player.x, p.y - player.y) / 10);
    ctx.save(); ctx.globalAlpha = 0.9; ctx.translate(ex, ey); ctx.rotate(a); ctx.fillStyle = 'rgba(16,21,28,.7)'; ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-7, 9); ctx.lineTo(-3, 0); ctx.lineTo(-7, -9); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#FF5CA8'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-5, 6.5); ctx.lineTo(-2, 0); ctx.lineTo(-5, -6.5); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.font = '800 8px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(16,21,28,.8)'; ctx.strokeText(dist + ' m', ex, ey + 14); ctx.fillStyle = '#FFD0E6'; ctx.fillText(dist + ' m', ex, ey + 14); ctx.textBaseline = 'alphabetic';
  }
  function drawMini() { locTick();
    const el = $('mini'); if (!el || !el.getContext || gt - MINI.t < 0.1) return; MINI.t = gt;
    mapDraw(el, MINI, Math.max(1, Math.min(3, Math.round(window.devicePixelRatio || 1))), false);
  }
  // v139: Minikarte: was sich selten ändert (Grundbild, gesperrte Viertel, Reviere, Gebäude-Buchstaben, Haltestellen) liegt fertig als Bild bereit
  function mapStatic(x, el, M, d, big) {
    if (M.base) x.drawImage(M.base, 0, 0);
    if (G) { x.fillStyle = 'rgba(30,36,46,.72)'; const zsx = el.width / WW, zsy = el.height / (WH - YMIN); for (const z of ZONES) if (G.rep < z.rep) x.fillRect(z.x0 * zsx, (z.y0 - YMIN) * zsy, (z.x1 - z.x0) * zsx, (z.y1 - z.y0) * zsy); } // v86
    if (G) mapRevier(x, el, d, big); // v129: Gang-Reviere, nur für Gang-Mitglieder (Kürzel stehen in der Legende der großen Karte)
    const kx = el.width / WW, ky = el.height / (WH - YMIN), k = clamp(M.w / 132, 0.75, 1.3) * d, pk = 0;
      const badge = (wx, wy, t, col, big) => { const r = (big ? 5.4 : 4.2) * k, px = clamp(wx * kx, r + 2 * k, el.width - r - 2 * k), py = clamp((wy - YMIN) * ky, r + 2 * k, el.height - r - 2 * k);
        if (big) { x.strokeStyle = 'rgba(95,229,132,' + (0.35 + 0.5 * pk).toFixed(2) + ')'; x.lineWidth = 1.4 * k; x.beginPath(); x.arc(px, py, r + (1.5 + 2 * pk) * k, 0, TAU); x.stroke(); }
        x.fillStyle = 'rgba(16,21,28,.92)'; x.beginPath(); x.arc(px, py, r + 1.1 * k, 0, TAU); x.fill(); x.fillStyle = col; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
        x.fillStyle = '#10151C'; x.font = '900 ' + ((big ? 7 : 5.6) * k).toFixed(1) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, px, py + 0.4 * k); };
      badge(2190, 270, 'S', '#E8C84A'); badge(2190, 968, 'C', '#5BC0EB'); badge(WERK.x + WERK.w / 2, WERK.y + WERK.h / 2, 'W', '#E8833A'); badge(4645, 310, 'A', '#C9D2DC'); badge(LAGER.x + LAGER.w / 2, LAGER.y + LAGER.h / 2, 'M', '#C9D2DC'); badge(GYM.x + GYM.w / 2, GYM.y + GYM.h / 2, 'F', '#E05555'); badge(PIZZA.x + PIZZA.w / 2, PIZZA.y + PIZZA.h / 2, 'P', '#F2A93B'); badge(BANK.x + BANK.w / 2, BANK.y + BANK.h / 2, 'B', '#E8DFC8'); badge(CLUB.x + CLUB.w / 2, CLUB.y + CLUB.h / 2, 'N', '#FF5CA8'); badge(MAKLER_AT.x, MAKLER_AT.y - 80, 'I', '#4B8DFF'); badge(5020, 1020, '$', '#FFD24A'); badge(3000, 145, '+', '#5FE584'); badge(4830, 2512, 'G', gvOpen() ? '#FF5C7A' : '#8A93A3');
      if (G && BUS_ST) for (const s of BUS_ST) { if (!busOpen(s)) continue; const r = 2.9 * k, px = s.x * kx, py = (s.y - YMIN) * ky; x.fillStyle = '#1E9E55'; x.beginPath(); x.arc(px, py, r + 0.9 * k, 0, TAU); x.fill(); x.fillStyle = '#F2C14E'; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); x.fillStyle = '#1E7A52'; x.font = '900 ' + (4.4 * k).toFixed(1) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('H', px, py + 0.3 * k); } // v104: Haltestellen
    x.textBaseline = 'alphabetic';
  }
  function mapDraw(el, M, d, big, zr) { // v117: Minikarte und grosse Karte zeichnen gleich; v121: zr = Zoomstufe der grossen Karte (Marker bleiben gleich gross)
    zr = zr || 1; const dz = d * zr;
    if (el.width !== Math.round(M.w * dz) || el.height !== Math.round(M.h * dz)) { el.width = Math.round(M.w * dz); el.height = Math.round(M.h * dz); M.base = null; }
    const x = el.getContext('2d'); if (!x) return;
    if (!M.base || M.d !== dz) { M.base = miniBase(dz, M.w, M.h); M.d = dz; }
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, el.width, el.height);
    { const sig = [el.width, el.height, d, big ? 1 : 0, G ? G.rep : -1, (G && pgMember()) ? myGid() + ':' + rkT : '', G && BUS_ST ? BUS_ST.filter(busOpen).length : 0, M.d].join('|'); // v139
      if (!M.sc || M.sc.width !== el.width || M.sc.height !== el.height) { try { M.sc = document.createElement('canvas'); M.sc.width = el.width; M.sc.height = el.height; } catch (e) { M.sc = null; } M.sig = ''; }
      const sx = M.sc && M.sc.getContext && M.sc.getContext('2d');
      if (sx && M.sig !== sig) { sx.setTransform(1, 0, 0, 1, 0, 0); sx.clearRect(0, 0, el.width, el.height); mapStatic(sx, el, M, d, big); M.sig = sig; }
      if (sx) x.drawImage(M.sc, 0, 0); else mapStatic(x, el, M, d, big); }
    const kx = el.width / WW, ky = el.height / (WH - YMIN), dot = (wx, wy, col, r) => { const px = clamp(wx, 0, WW) * kx, py = (clamp(wy, YMIN, WH) - YMIN) * ky; x.fillStyle = 'rgba(16,21,28,.9)'; x.beginPath(); x.arc(px, py, r + 1.2 * d, 0, TAU); x.fill(); x.fillStyle = col; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); };
    friendsAway().forEach((f, i) => { const L = f.look || DEF_LOOK, a = i * 1.3; dot(30 + Math.abs(Math.cos(a)) * 60, 560 + Math.sin(a) * 60, 'rgb(' + (L.r | 0) + ',' + (L.g | 0) + ',' + (L.b | 0) + ')', 2 * d); }); // v74: Freunde in ihrem Keller
    for (const f of Object.values(mp.friends)) { if (!f.vis || f.x < 0) continue; const L = f.look || DEF_LOOK; dot(f.x, f.y, 'rgb(' + (L.r | 0) + ',' + (L.g | 0) + ',' + (L.b | 0) + ')', 2.6 * d); }
    { // v79: wichtige Gebaeude mit Buchstaben, der Keller gross und pulsierend
      const k = clamp(M.w / 132, 0.75, 1.3) * d, pk = 0.5 + 0.5 * Math.sin(gt * 3);
      const badge = (wx, wy, t, col, big) => { const r = (big ? 5.4 : 4.2) * k, px = clamp(wx * kx, r + 2 * k, el.width - r - 2 * k), py = clamp((wy - YMIN) * ky, r + 2 * k, el.height - r - 2 * k);
        if (big) { x.strokeStyle = 'rgba(95,229,132,' + (0.35 + 0.5 * pk).toFixed(2) + ')'; x.lineWidth = 1.4 * k; x.beginPath(); x.arc(px, py, r + (1.5 + 2 * pk) * k, 0, TAU); x.stroke(); }
        x.fillStyle = 'rgba(16,21,28,.92)'; x.beginPath(); x.arc(px, py, r + 1.1 * k, 0, TAU); x.fill(); x.fillStyle = col; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
        x.fillStyle = '#10151C'; x.font = '900 ' + ((big ? 7 : 5.6) * k).toFixed(1) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, px, py + 0.4 * k); };
      badge(326, 280, 'K', '#5FE584', true); x.textBaseline = 'alphabetic';
      if (!KR_NEUTRAL) for (const c of CHARS) { // v83: Quests auf der Minikarte: ! = neu/bereit, ? = läuft, € = Stammkunde wartet
        if (!charHere(c)) continue; const q = qOf(c.id), done = q.s >= c.steps.length, rd = charReady(c), trk = KR().trk === c.id;
        if (done && !rd && !trk) continue;
        const t = done ? '€' : rd ? '!' : '?', col = trk ? '#B36BFF' : done ? '#7FD08A' : rd ? '#FFD24A' : '#E8ECF2';
        const r = 3.1 * k * (rd || trk ? 1 + 0.15 * pk : 1), px = clamp(c.x * kx, r + 2, el.width - r - 2), py = clamp((c.y - YMIN) * ky, r + 2, el.height - r - 2);
        x.fillStyle = 'rgba(16,21,28,.92)'; x.beginPath(); x.arc(px, py, r + 1.1 * k, 0, TAU); x.fill(); x.fillStyle = col; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill();
        x.fillStyle = '#10151C'; x.font = '900 ' + (4.8 * k).toFixed(1) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, px, py + 0.4 * k); x.textBaseline = 'alphabetic';
      }
    }
    // v96: offene Auftraege als kleine Punkte in Produktfarbe
    if (G) for (const o of G.orders) { const op = orderPos(o), ao = AREAS[o.prod || 'keller'] || AREAS.keller, col = ao.cust || ao.bub || '#5FE584'; /* v127: Tabak tuerkis */ const qx = op.x * kx, qy = (op.y - YMIN) * ky; x.fillStyle = 'rgba(16,21,28,.85)'; x.beginPath(); x.arc(qx, qy, 2.3 * d, 0, TAU); x.fill(); x.fillStyle = o.vip ? '#FFD24A' : col; x.beginPath(); x.arc(qx, qy, 1.5 * d, 0, TAU); x.fill(); }
    if (wayPt) { const wx = wayPt.x * kx, wy = (wayPt.y - YMIN) * ky, pk2 = 0.5 + 0.5 * Math.sin(gt * 4), r = 4 * d; // v117: Wegpunkt
      x.strokeStyle = 'rgba(255,92,168,' + (0.3 + 0.5 * pk2).toFixed(2) + ')'; x.lineWidth = 1.4 * d; x.beginPath(); x.arc(wx, wy - r, r + (2 + 3 * pk2) * d, 0, TAU); x.stroke();
      x.fillStyle = 'rgba(16,21,28,.9)'; x.beginPath(); x.arc(wx, wy - r, r + 1.2 * d, 0, TAU); x.fill(); x.fillStyle = '#FF5CA8'; x.beginPath(); x.arc(wx, wy - r, r, 0, TAU); x.moveTo(wx - r * 0.7, wy - r * 0.4); x.lineTo(wx, wy + r * 0.6); x.lineTo(wx + r * 0.7, wy - r * 0.4); x.fill(); x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(wx, wy - r, r * 0.4, 0, TAU); x.fill(); }
    if (big) { x.font = '800 ' + (5.5 * d) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'bottom'; for (const f of Object.values(mp.friends)) { if (!f.vis || f.x < 0) continue; const fx = clamp(f.x, 0, WW) * kx, fy = (clamp(f.y, YMIN, WH) - YMIN) * ky - 4 * d; x.lineWidth = 2.5 * d; x.strokeStyle = 'rgba(16,21,28,.9)'; x.strokeText(f.name, fx, fy); x.fillStyle = '#EAF2FF'; x.fillText(f.name, fx, fy); } x.textBaseline = 'alphabetic'; }
    const pl = 0.5 + 0.5 * Math.sin(gt * 6);
    if (player.x < 0) { // zu Besuch: links am Kartenrand markieren (v87)
      dot(0, player.y, '#FFB547', (2.2 + pl * 0.8) * d); x.fillStyle = 'rgba(16,21,28,.78)'; x.fillRect(0, el.height - 12 * d, el.width, 12 * d); x.fillStyle = '#FFB547'; x.font = '800 ' + (8 * d) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('zu Besuch', el.width / 2, el.height - 6 * d);
    } else { // Sichtfeld und Pfeil in Blickrichtung
      const port = isPort(), sc0 = port ? W / 340 : H / 330, vw = W / sc0, vh = H / sc0; x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1 * d; x.strokeRect((cam.x - vw / 2) * kx, (cam.y - vh / 2 - YMIN) * ky, vw * kx, vh * ky);
      const ppx = clamp(player.x, 0, WW) * kx, ppy = (clamp(player.y, YMIN, WH) - YMIN) * ky, a = inCar() ? player.ang : player.ang;
      x.strokeStyle = 'rgba(255,181,71,' + (0.55 * (1 - pl)).toFixed(2) + ')'; x.lineWidth = 1.2 * d; x.beginPath(); x.arc(ppx, ppy, (3.5 + pl * 4) * d, 0, TAU); x.stroke();
      x.save(); x.translate(ppx, ppy); x.rotate(a); x.fillStyle = 'rgba(16,21,28,.95)'; x.beginPath(); x.moveTo(5.2 * d, 0); x.lineTo(-3.6 * d, 3.6 * d); x.lineTo(-2 * d, 0); x.lineTo(-3.6 * d, -3.6 * d); x.closePath(); x.fill();
      x.fillStyle = '#FFB547'; x.beginPath(); x.moveTo(4 * d, 0); x.lineTo(-2.6 * d, 2.6 * d); x.lineTo(-1.3 * d, 0); x.lineTo(-2.6 * d, -2.6 * d); x.closePath(); x.fill(); x.restore(); }
    // Rand-Vignette, Nachtschimmer und Norden
    { const vg = x.createRadialGradient(el.width / 2, el.height / 2, Math.min(el.width, el.height) * 0.35, el.width / 2, el.height / 2, Math.max(el.width, el.height) * 0.72); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.35)'); x.fillStyle = vg; x.fillRect(0, 0, el.width, el.height);
      if (G && lightK() > 0.2) { x.fillStyle = 'rgba(10,16,40,' + (0.28 * lightK()).toFixed(2) + ')'; x.fillRect(0, 0, el.width, el.height); }
      const nx = el.width - 8 * d, ny = 8 * d; x.fillStyle = 'rgba(16,21,28,.75)'; x.beginPath(); x.arc(nx, ny, 5.5 * d, 0, TAU); x.fill(); x.fillStyle = '#EEF2F7'; x.font = '900 ' + (6.5 * d) + 'px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('N', nx, ny + 0.5 * d); x.textBaseline = 'alphabetic'; }
  }

  // ---------- v71: Steuerung anpassen (pro Geraet gespeichert) ----------
  // Knoepfe frei in der unteren Haelfte platzieren (bis hoch zum unsichtbaren Chat-Knopf), Knopfgroesse, Groesse der Minikarte.
  const HUD_KEY = 'kellergruen.hud', HUD_PADS = ['bAct', 'bTake', 'bPhone', 'bEmote', 'bVeh', 'bCar'], HUD_SIZES = [0.8, 0.9, 1, 1.15, 1.3], MINI_SIZES = [[100, 70], [132, 92], [176, 123]]; // v95: hoeher wegen Nordviertel
  const hudEdit = { on: false, drag: null };
  function hudCfg() { try { const o = JSON.parse(store.get(HUD_KEY, 'null')); if (o && typeof o === 'object') return { pos: o.pos && typeof o.pos === 'object' ? o.pos : {}, k: HUD_SIZES.includes(+o.k) ? +o.k : 1, mini: [0, 1, 2].includes(+o.mini) ? +o.mini : 1 }; } catch (e) {} return { pos: {}, k: 1, mini: 1 }; }
  function hudSave(c) { try { store.set(HUD_KEY, JSON.stringify(c)); } catch (e) {} }
  function hudTopLimit() { try { const r = $('chatBtn').getBoundingClientRect(); if (r && r.bottom > 0) return r.bottom + 4; } catch (e) {} return (window.innerHeight || 400) * 0.5; }
  function hudApply() {
    const c = hudCfg(), W = window.innerWidth || 800, H = window.innerHeight || 400, top = hudTopLimit();
    try { document.documentElement.style.setProperty('--padk', String(c.k)); } catch (e) {}
    MINI.w = MINI_SIZES[c.mini][0]; MINI.h = MINI_SIZES[c.mini][1]; try { const m = $('mini'); m.style.width = MINI.w + 'px'; m.style.height = MINI.h + 'px'; MINI.t = -1; } catch (e) {}
    for (const id of HUD_PADS) {
      const el = $(id), p = c.pos[id]; if (!el || !el.style) continue;
      if (!Array.isArray(p)) { el.classList.remove('free'); el.style.left = ''; el.style.top = ''; continue; }
      el.classList.add('free'); const r = el.getBoundingClientRect ? el.getBoundingClientRect() : { width: 60, height: 60 }, w = r.width || 60, h = r.height || 60;
      el.style.left = Math.round(clamp(p[0] * W, w / 2, W - w / 2) - w / 2) + 'px'; el.style.top = Math.round(clamp(p[1] * H, top + h / 2, H - h / 2) - h / 2) + 'px';
    }
    try { $('heZone').style.top = Math.round(top) + 'px'; } catch (e) {}
  }
  function hudEditStart() { closePhone(); hudEdit.on = true; $('hudEdit').hidden = false; document.body.classList.add('hud-editing'); $('pads').classList.add('on'); for (const id of HUD_PADS) $(id).hidden = false; hudApply(); }
  function hudEditEnd() { hudEdit.on = false; hudEdit.drag = null; $('hudEdit').hidden = true; document.body.classList.remove('hud-editing'); cache.veh = -1; hudApply(); msg('Knöpfe gespeichert'); }
  // v88: Jahreszeit oben ist nur noch eine Anzeige (nicht antippbar)
  function hudReset() { const c = hudCfg(); c.pos = {}; hudSave(c); hudApply(); }
  function hudDragStart(e, el) {
    const r = el.getBoundingClientRect(); hudEdit.drag = { el, id: el.id, dx: e.clientX - (r.left + r.width / 2), dy: e.clientY - (r.top + r.height / 2), pid: e.pointerId };
    try { el.setPointerCapture(e.pointerId); } catch (x) {}
  }
  function hudDragMove(e) {
    const d = hudEdit.drag; if (!d || e.pointerId !== d.pid) return;
    const W = window.innerWidth || 800, H = window.innerHeight || 400, c = hudCfg(); c.pos[d.id] = [clamp((e.clientX - d.dx) / W, 0, 1), clamp((e.clientY - d.dy) / H, 0, 1)]; hudSave(c); hudApply();
  }
  function renderHudSet(b) {
    const c = hudCfg(), hd = t => { const e = document.createElement('div'); e.className = 'grp'; e.textContent = t; b.appendChild(e); };
    const info = document.createElement('div'); info.className = 'ds'; info.style.margin = '0 0 6px'; info.textContent = 'Diese Einstellungen gelten nur auf diesem Gerät.'; b.appendChild(info);
    const row = (items) => { const r = document.createElement('div'); r.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 10px'; items.forEach(([label, on, fn]) => { const bt = document.createElement('button'); bt.className = 'chip' + (on ? ' on' : ''); bt.textContent = label; bt.addEventListener('click', () => { fn(); renderPhone(); }); r.appendChild(bt); }); b.appendChild(r); };
    hd('Knöpfe');
    row([['Knöpfe verschieben', false, hudEditStart], ['Standardplätze', false, hudReset]]);
    hd('Knopfgröße');
    row(HUD_SIZES.map(k => [Math.round(k * 100) + ' %', c.k === k, () => { const q = hudCfg(); q.k = k; hudSave(q); hudApply(); }]));
    hd('Minikarte');
    row([['Klein', 0], ['Mittel', 1], ['Groß', 2]].map(([l, i]) => [l, c.mini === i, () => { const q = hudCfg(); q.mini = i; hudSave(q); hudApply(); }]));
  }
  function placeNotes() { try { const n = document.querySelector('.notes'), w = $('ware'); if (!n || !w) return; if (n.dataset.t0 === undefined) n.dataset.t0 = String(parseFloat(getComputedStyle(n).top) || 0); const b = w.getBoundingClientRect().bottom, t0 = +n.dataset.t0; n.style.top = b > 0 && b + 10 > t0 ? Math.round(b + 10) + 'px' : ''; } catch (e) {} }
  function setText(id, v) { if (cache[id] !== v) { cache[id] = v; $(id).textContent = v; } }
  // ---------- v86: Pflanzen-Anzeige am Bildschirmrand ----------
  // Zeigt draussen (oder in einem anderen Raum), wo gegossen, geerntet oder abgeholt werden kann. Nicht, wenn ein Helfer das schon macht.
  const PI_COL = { water: '#4FB3FF', harvest: '#5FE584', collect: '#FFB547' };
  const PI_TXT = { water: 'Gießen oder Kühlen nötig', harvest: 'Fertig zum Ernten oder Abfüllen', collect: 'Fertig zum Abholen' }; // v88: auch fuers Labor
  const PI_ICO = {
    water: '<svg viewBox="0 0 24 24"><path d="M5 10h9v8a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M5 12H3.5A1.5 1.5 0 0 0 2 13.5v2A1.5 1.5 0 0 0 3.5 17H5"/><path d="M14 14l5.5-5"/><path d="M18 6.8l3 3.2"/></svg>',
    harvest: '<svg viewBox="0 0 24 24"><path d="M5 19c0-8 5-13 14-14 0 9-5 14-13 14z"/><path d="M5 19l7-7"/></svg>',
    collect: '<svg viewBox="0 0 24 24"><path d="M4 9l8-4 8 4v9l-8 4-8-4z"/><path d="M4 9l8 4 8-4"/><path d="M12 13v9"/></svg>'
  };
  let potIndT = 0, potIndSig = '', potIndInfo = {};
  function potIndCalc() {
    const out = { water: {}, harvest: {}, collect: {} }, here = inBuilding(player.x, player.y) ? areaAt(player.x, player.y) : null;
    for (const ar of openAreas().concat(floorAreas())) {
      const home = ar.isFloor ? 'keller' : ar.key; if (here && home === here) continue;
      const arKey = ar.isFloor ? 'keller' : ar.key; // v86: sobald in diesem Bereich ein Helfer arbeitet, gibt es keine Anzeige mehr
      if (Object.keys(ROLES).some(r => ROLES[r].area === arKey && G.staff[r] > 0)) continue;
      const st = S(ar), nm = ar.name || ar.key, n = potsOpen(ar);
      let w = 0, h = 0; for (let i = 0; i < n; i++) { const p = st.pots[i]; if (!p) continue; if (p.s === 1 && p.w < 0.5) w++; else if (p.s === 2) h++; }
      if (w) out.water[nm] = w; if (h) out.harvest[nm] = h;
      let c = 0; if (st.rack && st.rack.dry >= 1) c += Math.floor(st.rack.dry); if (st.tab && st.tab.bags >= 1) c += Math.floor(st.tab.bags);
      if (c) out.collect[nm] = c;
    }
    return out;
  }
  function potIndTick(dt) {
    const el = $('potInd'); if (!el) return;
    potIndT -= dt; if (potIndT > 0) return; potIndT = 0.4;
    let info = {};
    if (G && state === 'play' && !GH_ON && player.x >= 0) info = potIndCalc();
    const kinds = ['water', 'harvest', 'collect'].filter(k => info[k] && Object.keys(info[k]).length), sig = kinds.map(k => k + Object.entries(info[k]).join(',')).join('|');
    if (sig === potIndSig) return; potIndSig = sig; potIndInfo = info;
    el.innerHTML = ''; el.hidden = !kinds.length;
    for (const k of kinds) {
      const total = Object.values(info[k]).reduce((a, b) => a + b, 0), b = document.createElement('button'); b.className = 'pi'; b.style.setProperty('--c', PI_COL[k]); b.setAttribute('aria-label', PI_TXT[k]);
      b.innerHTML = PI_ICO[k] + '<b>' + total + '</b>';
      b.addEventListener('click', () => { const i = potIndInfo[k] || {}; msg(PI_TXT[k] + ': ' + Object.entries(i).map(([a, n]) => a + ' ' + n).join(' · ')); });
      el.appendChild(b);
    }
  }
  function updateHud(tg) {
    const h = Math.floor(G.time / 60), m = Math.floor(G.time % 60), ca = inRoom() && !prVisit && isOpen(AREAS.pr) ? AREAS.pr : AREAS[curKey], cs = S(ca); // v89: im Mietraum die Premium-Ware
    setText('money', fmt(G.money));
    setText('rep', String(G.rep));
    { const bh = $('bankHud'); if (bh) { const on = (G.bank || 0) > 0; if (bh.hidden === on) bh.hidden = !on; if (on) { hudFitRep(); setText('bankV', bankTxt(G.bank)); } } } // v95: Kontostand neben Ruf, v110: passt sich an
    { const gk = $('gkHud'), on = player.fl === 4 && !!pgang && pgMember(); if (gk) { if (gk.hidden === on) gk.hidden = !on; if (on) setText('gkV', fmt(pgang.kasse || 0)); } } // v131: im HQ die Gang-Kasse anzeigen
    krHud();
    drawMini(); wayTick();
    setText('bags', totalBags() + '/' + bagCap()); // v64: Sorten stehen untereinander
    { const oa = openAreas().concat(isOpen(AREAS.pr) ? [AREAS.pr] : []), sig = oa.length > 1 ? oa.map(ar => ar.key + ':' + S(ar).inv.bags).join() : '';
      if (cache.wl !== sig) { cache.wl = sig; const wl = $('wareList'); wl.innerHTML = '';
        if (sig) for (const ar of oa) { const n = S(ar).inv.bags, r = document.createElement('div'), i = document.createElement('i'), b = document.createElement('b'), sp = document.createElement('span'); if (!n) r.className = 'z'; i.style.background = ar.cust || ar.bub; i.className = 'k-' + ar.key; /* v65: Farbe und Form wie die Kunden-Blase */ b.textContent = n; sp.textContent = ar.lbl.unit; r.appendChild(i); r.appendChild(b); r.appendChild(sp); wl.appendChild(r); }
        placeNotes(); } }
    setText('clock', 'Tag ' + G.day + ' · ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'));
    setText('goal', objective());
    setText('earned', Math.round(G.earned).toLocaleString('de-DE')); setText('goalTarget', (GOALS.find(g => G.earned < g) || GOALS[GOALS.length - 1]).toLocaleString('de-DE'));
    setText('lblFresh', ca.lbl.hud); setText('lblDried', ca.lbl.dried || 'Trocken');
    setText('fresh', String(cs.inv.fresh));
    setText('dried', String(cs.inv.dried));
    { const ic = inCar(), vs = (selBike() ? 1 : 0) + (selCar() ? 2 : 0) + (riding() && !ic ? 4 : 0) + (ic ? 8 : 0) + (hudEdit.on ? 16 : 0); if (cache.veh !== vs) { cache.veh = vs; $('bVeh').hidden = !(vs & 1) && !hudEdit.on; $('bCar').hidden = !(vs & 2) && !hudEdit.on; $('bVeh').classList.toggle('on', !!(vs & 4)); $('bCar').classList.toggle('on', !!(vs & 8)); } }
    $('sus').style.width = Math.round(sus * 100) + '%';
    $('susBox').classList.toggle('hot', sus > 0.6);
    const ht = hintFor(tg), he = $('hint');
    if (cache.hint !== ht) { cache.hint = ht; he.textContent = ht; he.classList.toggle('on', !!ht); }
  }

