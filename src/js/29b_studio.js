  // =====================================================================================================
  // v173: Admin-Studio für Aufnahmen (TikTok). Nur für Admins.
  // Stufe 1: Knöpfe für Uhrzeit, Wetter, Jahreszeit, Ereignisse, Teleport, Kino-Modus (keine Anzeige), Ruhe (keine Polizei
  // und Gangs), Zeit anhalten, Demo-Szenen, Zoom. Stufe 2: Showreel-Autopilot mit Countdown und 10 Szenen.
  // Sicherheit: Beim Start wird der echte Spielstand gespeichert, danach ist Speichern, Cloud, Bestenliste und
  // Mehrspieler-Senden gesperrt. Beim Beenden wird der echte Spielstand wieder geladen.
  // =====================================================================================================
  const STU = { on: false, cine: false, calm: false, freeze: false, rain: null, ev: [], cam: null, zoom: 1, show: null, pos: null };
  function stuStart() {
    if (STU.on || !G || !isAdm()) return STU.on; save(); STU.pos = { x: player.x, y: player.y, fl: player.fl }; STU.on = true; saveBlocked = true;
    G.rep = REP_MAX; G.repP = G.rep; G.money = Math.max(G.money, 250000);
    for (const k of AREA_KEYS) { const a = AREAS[k]; try { const s = S(a); if (s && 'unl' in s) s.unl = true; } catch (e) {} }
    try { G.lager.own = true; if (G.pr) G.pr.own = true; } catch (e) {}
    try { G.veh.owned.van = true; if (!G.veh.car || G.veh.car === 'none') G.veh.car = 'van'; } catch (e) {}
    stuBar(); msg('🎬 Studio an: Fortschritt wird nicht gespeichert', false, 'ok'); return true;
  }
  function stuEnd() {
    if (!STU.on) return; stuShowStop(); stuCine(false); const p = STU.pos; STU.on = false; STU.calm = STU.freeze = false; STU.rain = null; STU.ev = []; STU.cam = null; STU.zoom = 1; calOv = 0; try { calC.t = -1; } catch (e) {}
    saveBlocked = false; try { if (typeof workOpen !== 'undefined' && workOpen) workClose(); } catch (e) {}
    if (load()) { if (p) { player.x = p.x; player.y = p.y; player.fl = p.fl; cam.x = p.x; cam.y = p.y; } try { rebuildWorkers(true); petSnap(); } catch (e) {} }
    stuBar(); msg('🎬 Studio aus: dein echter Spielstand ist zurück', false, 'ok');
  }
  // Kleine Leiste oben, solange das Studio läuft (im Kino-Modus fast unsichtbar)
  function stuBar() {
    let b = document.getElementById('stuBar'); if (!STU.on) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'stuBar'; b.innerHTML = '<button data-a="cine">🎬</button><button data-a="end">Studio beenden</button>'; document.body.appendChild(b);
      b.querySelector('[data-a=cine]').addEventListener('click', () => stuCine(!STU.cine)); b.querySelector('[data-a=end]').addEventListener('click', () => { if (STU.show) stuShowStop(); else stuEnd(); }); }
    b.classList.toggle('cine', STU.cine);
  }
  function stuCine(on) { STU.cine = !!on; document.body.classList.toggle('shot', STU.cine || shotOn()); document.body.classList.toggle('cine', STU.cine); stuBar(); }
  // ---------- Stimmung ----------
  function stuTime(h) { if (!G) return; G.time = Math.round(h * 60) % 1440; }
  function stuSeason(i) { if (!G) return; const cur = seasonI(); G.sOff = (G.sOff || 0) + ((i - cur + 4) % 4) * SEASON_DAYS; calOv = 0; try { calC.t = -1; } catch (e) {} }
  function stuCal(iso) { calOv = iso ? new Date(iso).getTime() : 0; try { calC.t = -1; } catch (e) {} }
  function stuNearSeg(x, y) { let b = EV_SEGS[0], bd = 1e9; for (const s of EV_SEGS) { const d = Math.hypot(s.cx - x, s.cy - y); if (d < bd) { bd = d; b = s; } } return b; }
  function stuEvent(k, x, y) {
    if (!G) return; x = x === undefined ? player.x : x; y = y === undefined ? player.y : y; const now = absMin(), o = { k, t0: now - 30, t1: now + 24 * 60, stu: 1 };
    STU.ev = STU.ev.filter(e => e.k !== k || (k !== 'fog' && k !== 'storm' && k !== 'strom'));
    if (k === 'fog' || k === 'storm') STU.ev = STU.ev.filter(e => e.k !== 'fog' && e.k !== 'storm');
    if (k === 'bau' || k === 'fest') { const used = STU.ev.filter(e => e.s).map(e => e.s), s = EV_SEGS.filter(q => !used.includes(q)).sort((a, b) => Math.hypot(a.cx - x, a.cy - y) - Math.hypot(b.cx - x, b.cy - y))[0]; if (!s) return; o.s = s; }
    else if (k === 'kontrolle') { const s = stuNearSeg(x, y); o.s = s; o.side = -1; o.x = clamp(x, s.x0 + 90, s.x1 - 90); o.y = s.y0 + 15; }
    else if (k === 'strom') { o.x0 = x - 600; o.x1 = x + 600; o.y0 = y - 450; o.y1 = y + 450; o.nm = 'hier'; }
    if (k === 'storm') { STU.rain = 1; amb.rain = 1; }
    STU.ev.push(o); evT = 0;
  }
  // ---------- Demo-Szenen ----------
  function stuDemo(k) {
    if (!G) return; const ar = AREAS[k] || AREAS.keller, st = S(ar);
    if (st.pots) st.pots.forEach(p => { if (p) { p.s = 2; p.p = 1; p.w = 1; } });
    st.rack.wet = 0; st.rack.dry = Math.max(0, rackCap(ar) - 2); st.inv.fresh = 8; st.inv.dried = Math.max(st.inv.dried, ar.packN * 6); st.inv.bags = 0;
    msg('🎬 ' + (ar.name || 'Keller') + ': alles bereit zum Filmen', false, 'ok');
  }
  function stuGo(x, y, fl) { closePhone(); if (riding() && !(fl === undefined || fl === 0)) toggleRide(false); player.fl = fl || 0; player.x = x; player.y = y; cam.x = x; cam.y = y; STU.cam = null; try { petSnap(); } catch (e) {} }
  const STU_PLACES = () => [['Keller', DOOR.x, DOOR.y + 40], ['Scheune', DOOR2.x, DOOR2.y + 40], ['Stadtpark', FOUNTAIN.x, FOUNTAIN.y + 70], ['Teich', POND.x + POND.w / 2, POND.y + POND.h + 40], ['Hundepark', DOGS.x + DOGS.w / 2, DOGS.y + DOGS.h / 2], ['Fluss', 1500, UFER_N - 20],
    ['Casino', CAS_DOOR.x, CAS_DOOR.y + 30], ['Neonmeile', 4700, 1010], ['Kran', VQ && VQ.cranes[0] ? VQ.cranes[0].x + 60 : 4600, VQ && VQ.cranes[0] ? VQ.cranes[0].y + 80 : 300], ['Autohof', AH_AT.x, AH_AT.y + 30], ['Gangviertel', GV_AT.x, GV_AT.y + 40], ['Nordviertel', 1500, -480]];
  // ---------- Showreel ----------
  const lerp = (a, b, k) => a + (b - a) * k, ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
  const camPath = (pts, k) => { const n = pts.length - 1, f = Math.min(n - 1e-6, Math.max(0, k * n)), i = Math.floor(f), t = ease(f - i); return { x: lerp(pts[i][0], pts[i + 1][0], t), y: lerp(pts[i][1], pts[i + 1][1], t) }; };
  function potTg(k, i) { const ar = AREAS[k]; return { type: 'pot', idx: i || 0, ar }; }
  const SCENES = [
    { id: 'drohne', nm: '🌇 Drohnenflug bei Sonnenuntergang', d: 12, setup() { stuTime(18.4); STU.freeze = true; STU.rain = 0; amb.rain = 0; STU.zoom = 0.72; stuSeason(1); },
      tick(t) { STU.cam = camPath([[FOUNTAIN.x - 300, FOUNTAIN.y + 100], [FOUNTAIN.x + 500, FOUNTAIN.y - 200], [2300, 1700], [3300, 1200], [4700, 1000]], t / this.d); } },
    { id: 'neon', nm: '🌃 Nacht und Neon', d: 8, setup() { stuTime(22.6); STU.freeze = true; STU.zoom = 1.05; }, tick(t) { STU.cam = camPath([[4480, 1000], [5100, 1000]], t / this.d); } },
    { id: 'gewitter', nm: '⛈️ Gewitter mit Blitz', d: 8, setup() { stuTime(19.2); STU.freeze = true; STU.zoom = 0.9; stuEvent('storm'); amb.rain = 1; }, tick(t, dt) { STU.cam = camPath([[FOUNTAIN.x - 250, FOUNTAIN.y], [FOUNTAIN.x + 250, FOUNTAIN.y + 60]], t / this.d); if (evNext > 1.6) evNext = 0.4 + Math.random() * 1.0; }, end() { STU.ev = STU.ev.filter(e => e.k !== 'storm'); STU.rain = 0; } },
    { id: 'arbeit', nm: '🌱 Arbeit im Keller (alle Fenster)', d: 34, setup() { stuTime(11); STU.freeze = true; STU.zoom = 1; stuGo(DOOR.x, DOOR.y + 40); const ar = AREAS.keller, st = S(ar); st.pots[0].s = 0; G.money = Math.max(G.money, 50000); st.rack.wet = 3; st.rack.dry = Math.min(8, rackCap(ar) - 3); st.inv.fresh = 0; st.inv.dried = 10; st.inv.bags = 0; this.q = null; },
      tick(t, dt) { const st = S(AREAS.keller), p = st.pots[0], step = (at, fn) => { if (t >= at && !this['s' + at]) { this['s' + at] = 1; try { fn(); } catch (e) {} } }, cut = at => step(at - 0.15, () => stuFade());
        step(0.2, () => workStart('plant', potTg('keller'))); step(1.2, () => plantStep()); step(2.2, () => plantStep()); step(3.6, () => plantStep());
        cut(6.0); cut(9.6); cut(16.0); cut(21.4);
        step(6.0, () => { if (workOpen) workClose(); p.s = 1; p.p = 0.75; p.w = 0.05; workStart('water', potTg('keller')); }); step(6.6, () => { WK.holding = true; WK.can.position.set(-0.28, 0.98, 0); });
        step(9.6, () => { if (workOpen) workClose(); p.s = 2; st.inv.fresh = 0; workStart('harvest', potTg('keller')); });
        for (let i = 0; i < 9; i++) step(10.4 + i * 0.4, () => { const q = WK.plant && WK.plant.userData.picks.find(q => !q.userData.taken); if (q) workPick(q); });
        step(16.0, () => { if (workOpen) workClose(); st.inv.fresh = 6; workStart('rack', { type: 'rack', idx: 0, ar: AREAS.keller }); });
        for (let i = 0; i < 4; i++) step(16.8 + i * 0.45, () => rackHangOne());
        for (let i = 0; i < 4; i++) step(18.8 + i * 0.45, () => { const s = WK.slots && WK.slots.find(s => s.item && s.dry); if (s) rackTake(s); });
        step(21.4, () => { if (workOpen) workClose(); st.inv.dried = 12; workStart('pack', { type: 'table', idx: 0, ar: AREAS.keller }); });
        for (let b = 0; b < 2; b++) { const o = 22.2 + b * 5.6; for (let i = 0; i < 3; i++) step(o + i * 0.5, () => { const q = WK.pile && WK.pile.find(q => !q.userData.taken); if (q) packPut(q); }); step(o + 1.9, () => packSeal()); step(o + 2.6, () => { this.drag = { t: 0 }; }); step(o + 3.6, () => { this.drag = null; packDeposit(); }); }
        if (this.drag && WK.bag) { this.drag.t += dt; const c = WK.crate.position, g = WK.bag, h = g.userData.home, k = Math.min(1, this.drag.t / 0.9); g.position.set(lerp(h.x, c.x, ease(k)), 0.52 + Math.sin(k * Math.PI) * 0.08, lerp(h.z, c.z, ease(k))); } },
      end() { if (workOpen) workClose(); } },
    { id: 'kurier', nm: '📦 Kurierfahrt mit Countdown', d: 9, setup() { stuTime(13); STU.freeze = true; STU.zoom = 1; const r = RDH.find(q => q.id === 'H2'); this.y = r.c1 - (r.c1 - r.c0) * 0.3; this.x0 = 900; stuGo(this.x0, this.y); try { if (!riding()) toggleRide(true, 'car'); } catch (e) {} player.ang = 0; const b = { x: this.x0 + 2600, y: this.y, nm: 'Kunde', rd: r.name };
        KUR.job = { st: 'run', t: 21, lim: 30, k: 'mittel', nm: 'Mittel', a: { x: this.x0, y: this.y, nm: 'Lager' }, b, d: 2600, pay: 400 }; wayPt = { x: b.x, y: b.y, cur: 1 }; traffic.length = 0; },
      tick(t) { player.x = this.x0 + t * 280; player.y = this.y; player.ang = 0; if (KUR.job) KUR.job.t = Math.max(0, 21 - t * 1.6); STU.cam = { x: player.x + 120, y: player.y }; },
      end() { KUR.job = null; if (wayPt && wayPt.cur) wayPt = null; try { if (riding()) toggleRide(false); } catch (e) {} } },
    { id: 'baustelle', nm: '🚧 Baustelle und Straßenfest', d: 9, setup() { stuTime(13.5); STU.freeze = true; STU.zoom = 0.85; this.ev0 = STU.ev.length; stuEvent('bau', 1400, 1400); stuEvent('fest', 1400, 1400); const a = STU.ev.find(e => e.k === 'bau'), b = STU.ev.find(e => e.k === 'fest'); this.p = [[a.s.cx - 200, a.s.cy], [a.s.cx + 200, a.s.cy], [b.s.cx - 200, b.s.cy], [b.s.cx + 200, b.s.cy]]; },
      tick(t) { STU.cam = camPath(this.p, t / this.d); }, end() { STU.ev = STU.ev.filter(e => e.k !== 'bau' && e.k !== 'fest'); } },
    { id: 'kontrolle', nm: '🚓 Polizeikontrolle und Stromausfall', d: 8, setup() { stuTime(22); STU.freeze = true; STU.zoom = 1; const s = EV_SEGS.find(q => q.r.id === 'H1') || EV_SEGS[0]; this.x = s.cx; this.y = s.cy; stuEvent('kontrolle', s.cx, s.cy); stuEvent('strom', s.cx + 700, s.cy); },
      tick(t) { STU.cam = camPath([[this.x - 150, this.y - 40], [this.x + 350, this.y - 40], [this.x + 800, this.y + 120]], t / this.d); }, end() { STU.ev = STU.ev.filter(e => e.k !== 'kontrolle' && e.k !== 'strom'); } },
    { id: 'morgen', nm: '🌫️ Morgennebel, Hunde und Enten', d: 10, setup() { stuTime(7.1); STU.freeze = true; STU.zoom = 1; STU.rain = 0; amb.rain = 0; },
      tick(t) { STU.cam = camPath([[DOGS.x + DOGS.w * 0.3, DOGS.y + DOGS.h * 0.5], [DOGS.x + DOGS.w * 0.7, DOGS.y + DOGS.h * 0.45], [1500, RIVER.y0 - 60], [POND.x + POND.w / 2, POND.y + POND.h / 2]], t / this.d); } },
    { id: 'jahreszeiten', nm: '🍂 Jahreszeiten im Zeitraffer', d: 11, setup() { stuTime(12.5); STU.freeze = true; STU.zoom = 0.9; this.i = -1; },
      tick(t) { const i = Math.min(5, Math.floor(t / 1.9)); if (i !== this.i) { this.i = i; if (i < 4) stuSeason(i); else if (i === 4) stuCal('2026-10-31T19:00:00'); else stuCal('2026-12-12T17:00:00'); if (i >= 4) stuTime(i === 4 ? 19.5 : 17.2); } STU.cam = { x: FOUNTAIN.x + Math.sin(t * 0.3) * 60, y: FOUNTAIN.y + 40 }; },
      end() { stuCal(0); } },
    { id: 'gang', nm: '🔥 Gangviertel bei Nacht', d: 8, setup() { stuTime(23.2); STU.freeze = true; STU.zoom = 1; this.p = [[GV_AT.x - 300, GV_AT.y - 80], [GV_AT.x + 200, GV_AT.y - 20], [4900, 2450]]; if (VQ && VQ.fire[0]) this.p.push([VQ.fire[0].x, VQ.fire[0].y - 40]); },
      tick(t) { STU.cam = camPath(this.p, t / this.d); } }
  ];
  let stuCd = null;
  function stuShow(ids) {
    if (!stuStart()) return; closePhone(); stuShowStop(); stuCine(true); STU.calm = true; const list = SCENES.filter(s => !ids || ids.includes(s.id));
    STU.show = { list, i: -1, t: 0, cd: 3.4 }; stuCdShow(3);
  }
  function stuShowStop() { const S0 = STU.show; if (!S0) return; const sc = S0.list[S0.i]; if (sc && sc.end) try { sc.end(); } catch (e) {} STU.show = null; STU.cam = null; STU.zoom = 1; STU.freeze = false; stuCdShow(0); }
  function stuCdShow(n) { let e = document.getElementById('stuCd'); if (!n) { if (e) e.remove(); return; } if (!e) { e = document.createElement('div'); e.id = 'stuCd'; document.body.appendChild(e); } e.textContent = n; e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); }
  function stuFade() { let e = document.getElementById('stuFade'); if (!e) { e = document.createElement('div'); e.id = 'stuFade'; document.body.appendChild(e); } e.classList.remove('on'); void e.offsetWidth; e.classList.add('on'); }
  // Läuft in jedem Bild (auch wenn ein Arbeitsfenster offen ist)
  function stuTick(dt) {
    if (!STU.on || !G) return; if (STU.calm) { sus = 0; cops.forEach(c => { c.st = 'patrol'; c.al = 0; }); }
    const S0 = STU.show; if (!S0) return;
    if (S0.cd > 0) { const before = Math.ceil(S0.cd - 0.4); S0.cd -= dt; const n = Math.ceil(S0.cd - 0.4); if (n !== before && n > 0) stuCdShow(n); if (S0.cd <= 0) stuCdShow(0); else return; }
    let sc = S0.list[S0.i];
    if (!sc || S0.t >= sc.d) { if (sc && sc.end) try { sc.end(); } catch (e) {} S0.i++; S0.t = 0; sc = S0.list[S0.i]; if (!sc) { stuShowStop(); stuCine(false); msg('🎬 Showreel fertig. Kino-Modus aus', false, 'ok'); return; }
      Object.keys(sc).forEach(k => { if (/^s[0-9.]+$/.test(k)) delete sc[k]; }); sc.drag = null; stuFade(); try { sc.setup(); } catch (e) { console.warn('Szene', sc.id, e); } }
    S0.t += dt; try { sc.tick(S0.t, dt); } catch (e) { console.warn('Szene', sc.id, e); }
  }
  // ---------- Handy: Admin → Studio ----------
  function renderStudio(b) {
    const mk = (tag, txt, cls) => { const e = document.createElement(tag); if (txt) e.textContent = txt; if (cls) e.className = cls; return e; };
    if (!isAdm()) { b.appendChild(mk('div', 'Nur für Admins.', 'empty')); return; }
    const card = (title, desc) => { const c = mk('div', '', 'card'); c.style.gridTemplateColumns = '1fr'; c.appendChild(mk('div', title, 'nm')); if (desc) { const d = mk('div', desc, 'ds'); d.style.margin = '2px 0 4px'; c.appendChild(d); } b.appendChild(c); return c; };
    const row = c => { const r = mk('div'); r.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:6px'; c.appendChild(r); return r; };
    const btn = (r, t, fn, cls) => { const x = mk('button', t, 'buy' + (cls ? ' ' + cls : '')); x.style.flex = '1 1 96px'; x.addEventListener('click', () => { if (!STU.on && !stuStart()) return; fn(); renderPhone(); }); r.appendChild(x); return x; };
    { const c = card('🎬 Studio ' + (STU.on ? '<läuft>' : '(aus)'), 'Für Aufnahmen: alles freigeschaltet, Fortschritt wird NICHT gespeichert, keine Cloud, keine Bestenliste, nichts geht an andere Spieler. Beim Beenden ist dein echter Spielstand wieder da. Aufnehmen mit der iPhone-Bildschirmaufnahme.');
      c.querySelector('.nm').textContent = '🎬 Studio ' + (STU.on ? '· läuft' : '· aus'); const r = row(c);
      if (!STU.on) { const x = mk('button', 'Studio starten', 'buy'); x.style.flex = '1 1 100%'; x.addEventListener('click', () => { stuStart(); renderPhone(); }); r.appendChild(x); }
      else { const x = mk('button', 'Studio beenden', 'buy alt'); x.style.flex = '1 1 100%'; x.addEventListener('click', () => { stuEnd(); renderPhone(); }); r.appendChild(x); } }
    { const c = card('▶ Showreel (Autopilot)', 'Bildschirmaufnahme starten, dann Knopf drücken. Nach 3-2-1 läuft alles von selbst im Kino-Modus. Abbrechen: oben „Studio beenden“.'); const r = row(c);
      const all = mk('button', '▶ Komplett (ca. 2 Min)', 'buy'); all.style.flex = '1 1 100%'; all.addEventListener('click', () => stuShow(null)); r.appendChild(all);
      const r2 = row(c); for (const s of SCENES) { const x = mk('button', s.nm + ' · ' + s.d + ' s', 'buy alt'); x.style.flex = '1 1 100%'; x.style.textAlign = 'left'; x.addEventListener('click', () => stuShow([s.id])); r2.appendChild(x); } }
    { const c = card('🎥 Ansicht'), r = row(c); btn(r, STU.cine ? 'Kino-Modus aus' : 'Kino-Modus an', () => { closePhone(); stuCine(!STU.cine); }); btn(r, STU.calm ? 'Polizei/Gangs an' : 'Ruhe (keine Polizei/Gangs)', () => { STU.calm = !STU.calm; });
      btn(r, STU.freeze ? 'Zeit läuft' : 'Zeit anhalten', () => { STU.freeze = !STU.freeze; }); const r2 = row(c); btn(r2, 'Zoom weit', () => { STU.zoom = 0.7; }); btn(r2, 'Normal', () => { STU.zoom = 1; }); btn(r2, 'Nah', () => { STU.zoom = 1.4; }); }
    { const c = card('🕐 Uhrzeit'), r = row(c); [['Morgen', 7.1], ['Mittag', 12.5], ['Sonnenuntergang', 18.5], ['Blaue Stunde', 20.3], ['Nacht', 23]].forEach(([t, h]) => btn(r, t, () => stuTime(h))); }
    { const c = card('🌦️ Wetter'), r = row(c); btn(r, 'Regen an', () => { STU.rain = 1; }); btn(r, 'Regen aus', () => { STU.rain = 0; STU.ev = STU.ev.filter(e => e.k !== 'storm' && e.k !== 'fog'); }); btn(r, 'Nebel', () => stuEvent('fog')); btn(r, 'Gewitter', () => stuEvent('storm')); }
    { const c = card('🍂 Jahreszeit und Feiertage'), r = row(c); ['Frühling', 'Sommer', 'Herbst', 'Winter'].forEach((n, i) => btn(r, n, () => stuSeason(i))); const r2 = row(c); btn(r2, 'Halloween', () => stuCal('2026-10-31T19:00:00')); btn(r2, 'Advent', () => stuCal('2026-12-12T17:00:00')); btn(r2, 'Silvester', () => stuCal('2026-12-31T23:58:00')); btn(r2, 'Ostern', () => stuCal('2027-03-28T12:00:00')); btn(r2, 'Kein Feiertag', () => stuCal(0)); }
    { const c = card('🚧 Ereignisse (hier bei dir)'), r = row(c); [['Baustelle', 'bau'], ['Straßenfest', 'fest'], ['Polizeikontrolle', 'kontrolle'], ['Stromausfall', 'strom']].forEach(([n, k]) => btn(r, n, () => stuEvent(k))); btn(r, 'Alle weg', () => { STU.ev = []; STU.rain = null; }, 'alt'); }
    { const c = card('📍 Teleport'), r = row(c); for (const [n, x, y] of STU_PLACES()) btn(r, n, () => stuGo(x, y)); }
    { const c = card('🌿 Demo-Szenen', 'Töpfe erntereif, Gestell voll trocken, viel Trockenes für den Packtisch.'), r = row(c); btn(r, 'Keller bereit', () => stuDemo('keller')); btn(r, 'Scheune bereit', () => stuDemo('tabak')); }
  }
