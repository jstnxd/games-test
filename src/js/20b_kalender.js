  // =====================================================================================================
  // v155: Kalender-Events nach ECHTER Uhrzeit (Uhr des Handys), nicht nach der Spieluhr.
  // Alle Spieler erleben sie gleichzeitig. Neues Event: einen Eintrag in CAL anlegen (on = wann aktiv),
  // optional mod (Wirtschaft), disc (Rabatte im Shop), Zeichnen in calDrawWorld / calLights / calDrawSky.
  // Gespeichert wird nur in G.cal (Flags, Adventstürchen, Eier, Süßes-oder-Saures), siehe cleanCal.
  // =====================================================================================================
  let calOv = 0; // nur für Tests: fester Zeitpunkt (ms seit 1970), 0 = echte Uhr
  const calNow = () => new Date(calOv || Date.now());
  const calMD = d => (d.getMonth() + 1) * 100 + d.getDate();
  const calYMD = d => d.getFullYear() * 10000 + calMD(d);
  function easterDate(y) { // Ostersonntag (gregorianisch, Meeus/Jones/Butcher)
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, mo - 1, da);
  }
  function nthWeekday(y, mo, wd, n) { const d = new Date(y, mo, 1); const off = (wd - d.getDay() + 7) % 7; return new Date(y, mo, 1 + off + (n - 1) * 7); } // mo: 0 = Januar, wd: 0 = Sonntag
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const CAL_BDAY = 1011; // Kellergrün-Geburtstag (Monat * 100 + Tag)
  const CAL = [
    { id: 'halloween', ic: '🎃', name: 'Halloween', col: '#FF8A2A', on: d => { const m = calMD(d); return m >= 1024 && m <= 1101; }, inst: d => 'hw' + d.getFullYear(),
      desc: 'Kürbisse vor den Häusern. Geh an eine Haustür mit Kürbis und drück A: Süßes oder Saures! Nach 8 Häusern gibt es den Kürbiskopf. Geisterlaken und Gespenst 30 % billiger.', disc: { w: { ghost: 0.7 }, c: { ghost: 0.7 } } },
    { id: 'advent', ic: '🎄', name: 'Advent', col: '#FF5C5C', on: d => { const m = calMD(d); return m >= 1201 && m <= 1226; }, inst: d => 'ad' + d.getFullYear(),
      desc: 'Jeden Tag ein Türchen im Adventskalender (Handy → Karriere → Events). Lichterketten an den Häusern und ein Weihnachtsbaum am Brunnen. Am 24. gibt es ein Geschenk.' },
    { id: 'silvester', ic: '🎆', name: 'Silvester', col: '#FFD24A', on: d => { const m = calMD(d), h = d.getHours(); return (m === 1231 && h >= 18) || (m === 101 && h < 3); }, inst: d => 'sv' + (d.getMonth() === 11 ? d.getFullYear() : d.getFullYear() - 1),
      desc: 'Feuerwerk über der Stadt, um Mitternacht am meisten. Nach 0 Uhr gibt es Neujahrsgeld.' },
    { id: 'valentin', ic: '💘', name: 'Valentinstag', col: '#FF6FA8', on: d => calMD(d) === 214, inst: d => 'va' + d.getFullYear(),
      desc: 'Herzen schweben durch die Stadt. Herzen-Aura und Herzchen 50 % billiger.', disc: { w: { hearts: 0.5 }, c: { hearts: 0.5 } } },
    { id: 'ostern', ic: '🐣', name: 'Ostern', col: '#FFD24A', on: d => { const e = easterDate(d.getFullYear()), t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), e0 = e.getTime(); return t >= e0 - 2 * 864e5 && t <= e0 + 1 * 864e5 + 3600e3; }, inst: d => 'os' + d.getFullYear(),
      desc: 'Ostereier-Suche: 10 bunte Eier sind im Startviertel versteckt. Alle gefunden = Geld und Ruf. Hasenkostüm 30 % billiger.', disc: { w: { bunny: 0.7 } } },
    { id: 'wochenende', ic: '🎉', name: 'Wochenende', col: '#5FE584', on: d => { const w = d.getDay(), h = d.getHours(); return (w === 5 && h >= 18) || w === 6 || w === 0; }, inst: d => { const t = new Date(d); t.setDate(t.getDate() - ((t.getDay() + 2) % 7)); return 'we' + calYMD(t); },
      desc: 'Wochenend-Bonus: 25 % mehr Bestellungen.', mod: { orders: 1.25 } },
    { id: 'nachtmarkt', ic: '🏮', name: 'Nachtmarkt', col: '#FF7A4A', on: d => { const h = d.getHours(); return h >= 22 || h < 2; }, inst: d => { const t = new Date(d.getTime() - 2 * 3600e3); return 'nm' + calYMD(t); },
      desc: 'Laternen im Park. Drei wechselnde Sachen zum Anziehen sind heute Nacht 25 % billiger.', discFn: () => nmPicks() },
    { id: 'blackfriday', ic: '🏷️', name: 'Black Friday', col: '#EEF2F7', on: d => { const t = nthWeekday(d.getFullYear(), 10, 4, 4); t.setDate(t.getDate() + 1); return sameDay(d, t); }, inst: d => 'bf' + d.getFullYear(),
      desc: 'Nur heute: alle Kleidung und Effekte 30 % billiger.', discAll: 0.7 },
    { id: 'sommerfest', ic: '🎪', name: 'Sommerfest', col: '#FFD24A', on: d => { if (d.getMonth() !== 6) return false; const s = nthWeekday(d.getFullYear(), 6, 6, 2); return sameDay(d, s) || sameDay(d, new Date(s.getFullYear(), 6, s.getDate() + 1)); }, inst: d => 'sf' + d.getFullYear(),
      desc: 'Lichterketten im Park, 20 % mehr Bestellungen und alle zahlen 10 % mehr.', mod: { orders: 1.2, price: 1.1 } },
    { id: 'geburtstag', ic: '🎂', name: 'Kellergrün-Geburtstag', col: '#FF9CC8', on: d => calMD(d) === CAL_BDAY, inst: d => 'gb' + d.getFullYear(),
      desc: 'Kellergrün hat Geburtstag! Konfetti über der Stadt und ein Geschenk für dich.' }
  ];
  const CAL_BY = Object.fromEntries(CAL.map(e => [e.id, e]));
  const calXmasDeco = d => { const m = calMD(d); return m >= 1201 || m <= 106; }; // Lichter und Baum bleiben bis Heilige Drei Könige
  let calC = { t: -1, ov: 0, list: [], d: null };
  function calList() { // aktive Events, höchstens einmal pro Sekunde neu berechnet
    if (KR_NEUTRAL || !G) return []; const n = Date.now();
    if (n - calC.t > 1000 || calC.ov !== calOv) { const d = calNow(); calC = { t: n, ov: calOv, d, list: CAL.filter(e => { try { return e.on(d); } catch (x) { return false; } }) }; }
    return calC.list;
  }
  const calOn = id => calList().some(e => e.id === id);
  function calMod(key) { let m = 1; for (const e of calList()) if (e.mod && e.mod[key]) m *= e.mod[key]; return m; }
  function calDisc(kind, id) { // Preis-Faktor im Shop (kind: 'w' Kleidung, 'c' Effekte)
    let m = 1; for (const e of calList()) { if (e.discAll) m = Math.min(m, e.discAll); const t = e.disc && e.disc[kind]; if (t && t[id]) m = Math.min(m, t[id]); if (e.discFn) { const p = e.discFn(); if (p[kind] && p[kind][id]) m = Math.min(m, p[kind][id]); } }
    return m;
  }
  function shopCost(kind, x) { if (!x || x.cost <= 1 || x.qx || x.ach) return x ? x.cost : 0; return Math.round(x.cost * calDisc(kind, x.id)); }
  const shopPriceHtml = (kind, x) => { const c = shopCost(kind, x); return c < x.cost ? '<s style="opacity:.55">' + fmt(x.cost) + '</s> <b style="color:var(--green)">' + fmt(c) + '</b>' : fmt(x.cost); };
  let nmC = { k: '', p: null };
  function nmPicks() { // Nachtmarkt: jede Nacht drei andere Kleidungsstücke
    const d = calNow(), k = 'nm' + calYMD(new Date(d.getTime() - 2 * 3600e3)); if (nmC.k === k) return nmC.p;
    const pool = WEAR.filter(w => w.cost > 1 && !w.qx && !w.ach && !w.kiosk && w.rep < 999); let s = Number(k.slice(2)) % 2147483646 + 1; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, w = {};
    for (let i = 0; i < 3 && pool.length; i++) { const j = Math.floor(rnd() * pool.length); w[pool[j].id] = 0.75; pool.splice(j, 1); }
    nmC = { k, p: { w } }; return nmC.p;
  }
  const calIcons = () => calList().filter(e => e.id !== 'nachtmarkt' && e.id !== 'wochenende').map(e => e.ic).join(''); // häufige Events nicht in der Anzeige
  // ---------- Spielstand ----------
  function cleanCal(o) {
    const c = { f: {}, tt: { d: 0, l: [] }, tn: {}, adv: { y: 0, m: 0 }, egg: { y: 0, m: 0 } }; if (!o || typeof o !== 'object') return c;
    if (o.f && typeof o.f === 'object') for (const k of Object.keys(o.f).slice(-120)) if (/^[a-z0-9:_-]{1,32}$/.test(k) && Number.isFinite(+o.f[k])) c.f[k] = +o.f[k];
    if (o.tt && typeof o.tt === 'object') { c.tt.d = Math.floor(+o.tt.d) || 0; if (Array.isArray(o.tt.l)) c.tt.l = o.tt.l.filter(x => Number.isInteger(x) && x >= 0 && x < 999).slice(0, 60); }
    if (o.tn && typeof o.tn === 'object') for (const k of Object.keys(o.tn).slice(-6)) if (/^hw\d{4}$/.test(k)) c.tn[k] = clamp(Math.floor(+o.tn[k]) || 0, 0, 999);
    for (const n of ['adv', 'egg']) if (o[n] && typeof o[n] === 'object') c[n] = { y: Math.floor(+o[n].y) || 0, m: Math.floor(+o[n].m) >>> 0 };
    return c;
  }
  const CS = () => { if (!G.cal || !G.cal.f) G.cal = cleanCal(G.cal); return G.cal; };
  function giveWear(id, why) { const w = WEAR_BY[id]; if (!w) return false; if (G.wear.owned[id]) return false; G.wear.owned[id] = true; msg('🎁 ' + why + ': ' + w.name + ' (im Kleiderschrank)'); sfx.buy(); return true; }
  // ---------- Ablauf (alle 0,5 s aus krUpdate) ----------
  function calTick() {
    if (KR_NEUTRAL || !G || state !== 'play') return; const c = CS(), d = calNow();
    for (const e of calList()) { const k = 'a:' + e.inst(d); if (c.f[k]) continue; c.f[k] = 1; msg(e.ic + ' ' + e.name + ': ' + e.desc.split('. ')[0].replace(/\.$/, '')); sfx.ping(); save(); }
    if (calOn('silvester') && calMD(d) === 101) { const k = 'ny:' + d.getFullYear(); if (!c.f[k]) { c.f[k] = 1; const v = d.getFullYear(); G.money += v; msg('🎆 Frohes neues Jahr! Neujahrsgeld: +' + fmt(v)); sfx.cash(); save(); } }
    if (calOn('geburtstag')) { const k = 'gb:' + d.getFullYear(); if (!c.f[k]) { c.f[k] = 1; if (!giveWear('partyhat', 'Geburtstagsgeschenk')) { G.money += 1000; msg('🎂 Geburtstagsgeschenk: +' + fmt(1000)); } save(); } }
    if (calOn('ostern') && !player.fl && player.x > 0) eggTick(d);
  }
  // ---------- Halloween: Kürbisse und Süßes oder Saures ----------
  const ttHouse = (h) => !h.gang && !h.office;
  const ttDoor = h => ({ x: h.dx + 24, y: h.face === 1 ? h.dy + 10 : h.dy - 10 });
  function calTarget(px, py) {
    if (KR_NEUTRAL || !calOn('halloween') || player.fl || inCar()) return null; let best = null, bd = 34;
    for (let i = 0; i < HOUSES.length; i++) { const h = HOUSES[i]; if (!ttHouse(h)) continue; const p = ttDoor(h), dd = Math.hypot(px - p.x, py - p.y); if (dd < bd) { bd = dd; best = { type: 'cal', what: 'treat', idx: i, ar: AREAS.keller }; } }
    return best;
  }
  const ttToday = () => { const c = CS(), t = calYMD(calNow()); if (c.tt.d !== t) { c.tt.d = t; c.tt.l = []; } return c.tt; };
  function calHint(tg) {
    if (tg.what === 'treat') { const t = ttToday(); return t.l.includes(tg.idx) ? '🎃 Hier warst du heute schon' : t.l.length >= 12 ? '🎃 Genug Süßes für heute, morgen wieder' : 'A  🎃 Süßes oder Saures!'; }
    return '';
  }
  const SAURES = ['Saures! Die Tür bleibt zu, nur ein Gruselkichern ist zu hören.', 'Saures! Jemand wirft dir eine Handvoll Konfetti ins Gesicht.', 'Saures! Hinter der Tür heult ein Werwolf-Wecker.'];
  function calAct(tg) {
    if (tg.what !== 'treat') return; const t = ttToday(); if (t.l.includes(tg.idx) || t.l.length >= 12) { sfx.err && sfx.err(); return; }
    t.l.push(tg.idx); const c = CS(), hk = 'hw' + calNow().getFullYear(); c.tn[hk] = (c.tn[hk] || 0) + 1; const p = ttDoor(HOUSES[tg.idx]);
    if (Math.random() < 0.15) { msg('🎃 ' + SAURES[Math.floor(Math.random() * SAURES.length)]); floater(p.x, p.y - 22, 'Saures!', '#B36BFF'); }
    else { const v = Math.round((40 + Math.random() * 60) * (1 + krLv() * 0.25)); G.money += v; floater(p.x, p.y - 22, '🍬 +' + fmt(v), '#FF8A2A'); sfx.cash(); }
    if (c.tn[hk] === 8) giveWear('pumpkin', 'Halloween-Belohnung');
    save();
  }
  function drawPumpkin(x, y, s, lit, seed) {
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(x + 1, y + 4 * s, 7 * s, 2.4 * s, 0, 0, TAU); ctx.fill();
    for (const [dx, w, c] of [[-3.6, 3.8, '#D9661C'], [3.6, 3.8, '#D9661C'], [0, 4.4, '#F07F24']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(x + dx * s, y, w * s, 4.6 * s, 0, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(255,220,150,.35)'; ctx.beginPath(); ctx.ellipse(x - 1.4 * s, y - 2.4 * s, 1.6 * s, 1 * s, -0.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4A6A2A'; ctx.fillRect(x - 0.8 * s, y - 6.4 * s, 1.6 * s, 2.4 * s);
    ctx.fillStyle = lit ? '#FFD86A' : '#5A2A0E'; // Gesicht
    for (const sx of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + sx * 3.4 * s, y - 0.6 * s); ctx.lineTo(x + sx * 1.2 * s, y - 0.6 * s); ctx.lineTo(x + sx * 2.3 * s, y - 2.6 * s); ctx.closePath(); ctx.fill(); }
    ctx.beginPath(); ctx.moveTo(x - 3.6 * s, y + 1 * s); for (let k = 0; k <= 6; k++) ctx.lineTo(x - 3.6 * s + k * 1.2 * s, y + (k % 2 ? 2.2 : 1.4) * s); for (let k = 6; k >= 0; k--) ctx.lineTo(x - 3.6 * s + k * 1.2 * s, y + (k % 2 ? 2.8 : 3.4) * s); ctx.closePath(); ctx.fill();
  }
  // ---------- Ostern: Eiersuche ----------
  const EGG_N = 10, EGG_COL = ['#FF9CC8', '#FFD24A', '#7FD0C8', '#B36BFF', '#8FE3A0', '#FF8A5A'];
  let eggC = { y: 0, pts: [] };
  function eggPoints(y) {
    if (eggC.y === y) return eggC.pts; let seed = y * 131 + 17; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, pts = [];
    for (let k = 0; k < 4000 && pts.length < EGG_N; k++) { const E = NAV.edges[Math.floor(rnd() * NAV.edges.length)], t = rnd(); if (!E) continue; const A = NAV.nodes[E.a], B = NAV.nodes[E.b], x = Math.round(A.x + (B.x - A.x) * t), y2 = Math.round(A.y + (B.y - A.y) * t); if (zoneRepAt(x, y2) > 0 || onRoadway(x, y2) || blockedPt(x, y2) || inBuilding(x, y2) || AREA_KEYS.some(q => { const I = AREAS[q].IN; return x > I.x0 - 70 && x < I.x1 + 70 && y2 > I.y0 - 90 && y2 < I.y1 + 70; }) || x < 60 || y2 < 60 || x > WW - 60 || y2 > WH - 60 || pts.some(o => Math.hypot(o.x - x, o.y - y2) < 260)) continue; pts.push({ x, y: y2 }); }
    eggC = { y, pts }; return pts;
  }
  function eggState(d) { const c = CS(), y = d.getFullYear(); if (c.egg.y !== y) c.egg = { y, m: 0 }; return c.egg; }
  function eggTick(d) {
    const st = eggState(d), pts = eggPoints(st.y);
    pts.forEach((p, i) => { if (st.m & (1 << i)) return; if (Math.hypot(player.x - p.x, player.y - p.y) < 22) { st.m |= 1 << i; const got = pts.filter((_, j) => st.m & (1 << j)).length; sfx.ping(); floater(p.x, p.y - 20, 'Osterei ' + got + '/' + pts.length, '#FFD24A');
      if (got === pts.length) { const v = Math.round(1500 * krLv()); G.money += v; krRepBonus(1); msg('🐣 Alle Ostereier gefunden! +' + fmt(v) + ', Ruf +1'); sfx.cash(); } save(); } });
  }
  // ---------- Advent: Kalender im Handy ----------
  function advReward(n) {
    if (n === 24) return { t: 'Weihnachtsgeschenk', f: () => { const a = giveWear('santa', 'Frohe Weihnachten'), b = giveWear('xmas', 'Frohe Weihnachten'); if (!a && !b) { const v = Math.round(2400 * krLv()); G.money += v; return '+' + fmt(v); } return 'Weihnachtsmütze und Weihnachtspulli'; } };
    if (n === 6) return { t: 'Nikolaus', f: () => { const v = Math.round(1200 * krLv()); G.money += v; return '+' + fmt(v); } };
    if (n % 6 === 3) return { t: 'Ruf', f: () => { krRepBonus(0.5); return 'Ruf +0,5'; } };
    if (n % 6 === 5) return { t: 'Gratis-Samen', f: () => { KR().freeT = Math.max(KR().freeT, absMin()) + 3 * 60; return '3 Spielstunden gratis pflanzen'; } };
    return { t: 'Geld', f: () => { const v = Math.round((180 + n * 25) * krLv()); G.money += v; return '+' + fmt(v); } };
  }
  function advOpen(n) {
    const d = calNow(), c = CS(); if (!calOn('advent') || n < 1 || n > 24 || n > d.getDate()) return false;
    if (c.adv.y !== d.getFullYear()) c.adv = { y: d.getFullYear(), m: 0 }; if (c.adv.m & (1 << n)) return false;
    c.adv.m = (c.adv.m | (1 << n)) >>> 0; const r = advReward(n), res = r.f(); msg('🎄 Türchen ' + n + ': ' + res); sfx.buy(); save(); return true;
  }
  // ---------- Handy: Karriere → Events ----------
  function calNext(e, from) { // nächster Beginn (zum Anzeigen), sucht bis zu 400 Tage voraus
    for (let i = 0; i < 400; i++) for (const h of [0, 12, 19, 23]) { const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i, h, 0, 0); if (d < from) continue; try { if (e.on(d)) return d; } catch (x) { return null; } }
    return null;
  }
  function calWelt(b) {
    if (KR_NEUTRAL) return; const d = calNow(), act = calList();
    krGrp(b, 'Echte Events (nach deiner Uhr)');
    for (const e of act) {
      const cc = krCard(b, e.ic + ' ' + e.name, 'läuft', e.desc);
      if (e.id === 'halloween') { const c = CS(), n = c.tn['hw' + d.getFullYear()] || 0, t = ttToday(); krBar(cc, Math.min(1, n / 8)); const x = document.createElement('div'); x.className = 'ds'; x.style.cssText = 'margin-top:6px;grid-column:1/-1'; x.textContent = (n >= 8 ? 'Kürbiskopf geholt! ' : 'Kürbiskopf: ' + n + ' / 8 Häuser. ') + 'Heute ' + t.l.length + ' / 12 Türen.'; cc.appendChild(x); }
      if (e.id === 'ostern') { const st = eggState(d), got = eggPoints(st.y).filter((_, i) => st.m & (1 << i)).length; krBar(cc, got / EGG_N); }
      if (e.id === 'advent') {
        const c = CS(); if (c.adv.y !== d.getFullYear()) c.adv = { y: d.getFullYear(), m: 0 };
        const g = document.createElement('div'); g.style.cssText = 'display:grid;grid-template-columns:repeat(6,1fr);gap:5px;margin-top:8px;grid-column:1/-1';
        for (let n = 1; n <= 24; n++) { const bt = document.createElement('button'), open = c.adv.m & (1 << n), can = n <= d.getDate(); bt.className = 'chip' + (open ? ' on' : ''); bt.style.cssText = 'padding:7px 0;min-width:0'; bt.textContent = open ? '✓' : n === 24 ? '🎁' : String(n); bt.disabled = !!open || !can; if (!open && can) bt.addEventListener('click', () => { if (advOpen(n)) renderPhone(); }); g.appendChild(bt); }
        cc.appendChild(g);
      }
    }
    const soon = CAL.filter(e => !act.includes(e) && e.id !== 'nachtmarkt' && e.id !== 'wochenende').map(e => ({ e, t: calNext(e, d) })).filter(x => x.t).sort((a, b) => a.t - b.t).slice(0, 3);
    if (!act.length) { const x = document.createElement('div'); x.className = 'empty'; x.textContent = 'Gerade läuft kein echtes Event.'; b.appendChild(x); }
    if (soon.length) { const x = document.createElement('div'); x.className = 'ds'; x.style.margin = '4px 2px 10px'; x.textContent = 'Demnächst: ' + soon.map(s => s.e.ic + ' ' + s.e.name + ' am ' + s.t.getDate() + '.' + (s.t.getMonth() + 1) + '.').join(' · ') + ' – jeden Abend ab 22 Uhr 🏮 Nachtmarkt, freitags ab 18 Uhr 🎉 Wochenend-Bonus.'; b.appendChild(x); }
  }
  // ---------- Zeichnen in der Welt (Weltkoordinaten) ----------
  const XTREE = { x: FOUNTAIN.x + 150, y: FOUNTAIN.y - 120 };
  function calDrawWorld() {
    if (KR_NEUTRAL || state === 'edit' || !G) return; const act = calList(), d = calC.d || calNow(), dk = lightK() > 0.25;
    if (act.some(e => e.id === 'halloween')) for (let i = 0; i < HOUSES.length; i++) { const h = HOUSES[i]; if (!ttHouse(h)) continue; const p = ttDoor(h); if (!inView(p.x, p.y, 20)) continue; drawPumpkin(p.x, p.y, 1.15, dk, i); if (i % 3 === 0) drawPumpkin(p.x + 13, p.y + 2, 0.8, dk, i + 1); }
    if (calXmasDeco(d)) {
      for (const h of HOUSES) { if (h.gang || h.x > viewX1 + 20 || h.x + h.w < viewX0 - 20 || h.y > viewY1 + 40 || h.y + h.h < viewY0 - 40) continue; const up = h.face === -1, ey = up ? h.y + h.h * 0.36 : h.y + h.h - h.h * 0.36;
        ctx.strokeStyle = 'rgba(30,30,30,.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); for (let x = h.x + 4; x <= h.x + h.w - 4; x += 4) ctx.lineTo(x, ey + Math.sin((x - h.x) / 14 * Math.PI) * 1.6); ctx.stroke();
        for (let x = h.x + 8, k = 0; x < h.x + h.w - 6; x += 14, k++) { const on = ((k + Math.floor(gt * 2)) % 3) !== 0; ctx.fillStyle = on || !dk ? ['#FF5C5C', '#FFD24A', '#5CB8FF', '#63FF9A'][k % 4] : '#3A3A3A'; ctx.beginPath(); ctx.arc(x, ey + Math.sin((x - h.x) / 14 * Math.PI) * 1.6 + 1.6, 1.7, 0, TAU); ctx.fill(); } }
      if (inView(XTREE.x, XTREE.y, 80)) drawXmasTree(XTREE.x, XTREE.y, dk);
    }
    const lan = act.find(e => e.id === 'nachtmarkt' || e.id === 'sommerfest');
    if (lan && inView(FOUNTAIN.x, FOUNTAIN.y, 260)) drawLanterns(lan.id === 'nachtmarkt', dk);
    if (act.some(e => e.id === 'ostern')) { const st = eggState(d), pts = eggPoints(st.y); pts.forEach((p, i) => { if (st.m & (1 << i) || !inView(p.x, p.y, 20)) return; const bo = Math.sin(gt * 3 + i) * 1.2; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 5, 5, 2, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(p.x, p.y - 2 + bo); ctx.fillStyle = EGG_COL[i % EGG_COL.length]; ctx.beginPath(); ctx.ellipse(0, 0, 4, 5.2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fillRect(-3.8, -1, 7.6, 1.4); ctx.fillStyle = EGG_COL[(i + 2) % EGG_COL.length]; for (const dx of [-2, 0, 2]) { ctx.beginPath(); ctx.arc(dx, 2.4, 0.8, 0, TAU); ctx.fill(); } ctx.restore();
      if (Math.sin(gt * 5 + i * 2) > 0.8) { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(p.x + 3, p.y - 9, 1.5, 1.5); } }); }
  }
  function drawXmasTree(x, y, dk) {
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x + 4, y + 30, 26, 8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#6A4428'; ctx.fillRect(x - 4, y + 18, 8, 12); ctx.fillStyle = '#B5473A'; ctx.fillRect(x - 9, y + 24, 18, 8); ctx.fillStyle = '#F2C14E'; ctx.fillRect(x - 1, y + 24, 2, 8);
    for (const [ty, w, c] of [[22, 30, '#1E5A34'], [6, 25, '#236A3C'], [-9, 19, '#2A7A46'], [-22, 12, '#33884F']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - w, y + ty); ctx.lineTo(x + w, y + ty); ctx.lineTo(x, y + ty - 22); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.beginPath(); ctx.moveTo(x - w, y + ty); ctx.lineTo(x - w * 0.3, y + ty); ctx.lineTo(x, y + ty - 22); ctx.closePath(); ctx.fill(); }
    if (seaSnow()) { ctx.fillStyle = 'rgba(240,246,252,.85)'; for (const [ty, w] of [[6, 25], [-9, 19], [-22, 12]]) { ctx.beginPath(); ctx.ellipse(x - w * 0.2, y + ty - 14, w * 0.35, 2, 0, 0, TAU); ctx.fill(); } }
    const BC = ['#FF5C5C', '#FFD24A', '#5CB8FF', '#F4F4F8', '#B36BFF']; let k = 0;
    for (const [ty, w] of [[18, 26], [3, 21], [-11, 15], [-23, 9]]) for (let q = -w + 4; q <= w - 4; q += 8) { const on = !dk || ((k + Math.floor(gt * 2.5)) % 4) !== 0; ctx.fillStyle = on ? BC[k % 5] : '#444'; ctx.beginPath(); ctx.arc(x + q, y + ty - Math.abs(q) * 0.1, 2, 0, TAU); ctx.fill(); k++; }
    ctx.fillStyle = '#FFD24A'; ctx.save(); ctx.translate(x, y - 46); ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 2.6 : 6, a = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.restore();
  }
  const LAN_R = 196, LAN_N = 22;
  function drawLanterns(nm, dk) { // Laternenkette rund um den Brunnenplatz
    const f = FOUNTAIN; ctx.strokeStyle = 'rgba(40,32,28,.75)'; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i <= LAN_N * 3; i++) { const a = i / (LAN_N * 3) * TAU, sag = Math.abs(Math.sin(i / 3 * Math.PI)) * 7; ctx.lineTo(f.x + Math.cos(a) * (LAN_R - sag), f.y + Math.sin(a) * (LAN_R - sag) * 0.96); } ctx.stroke();
    for (let i = 0; i < LAN_N; i++) { const a = (i + 0.5) / LAN_N * TAU, x = f.x + Math.cos(a) * (LAN_R - 7), y = f.y + Math.sin(a) * (LAN_R - 7) * 0.96 + Math.sin(gt * 1.6 + i) * 0.6;
      if (nm) { ctx.fillStyle = ['#E8402E', '#FF8A2A', '#E8402E', '#FFC23A'][i % 4]; ctx.beginPath(); ctx.ellipse(x, y, 3.6, 4.6, 0, 0, TAU); ctx.fill(); ctx.fillStyle = dk ? 'rgba(255,230,160,.85)' : 'rgba(255,255,255,.3)'; ctx.fillRect(x - 1.2, y - 3, 2.4, 6); ctx.fillStyle = '#3A2A1E'; ctx.fillRect(x - 2.2, y - 5.6, 4.4, 1.4); ctx.fillRect(x - 2.2, y + 4.2, 4.4, 1.4); }
      else { ctx.fillStyle = ['#FF5C5C', '#FFD24A', '#5CB8FF', '#63FF9A', '#FF9CC8'][i % 5]; ctx.beginPath(); ctx.arc(x, y + 2, 2.2, 0, TAU); ctx.fill(); } }
  }
  function calLights(L, oK) { // nachts leuchtend (im 'lighter'-Modus aus drawLights)
    if (KR_NEUTRAL || state === 'edit' || !G) return; const act = calList(), d = calC.d || calNow();
    if (act.some(e => e.id === 'halloween')) for (let i = 0; i < HOUSES.length; i++) { const h = HOUSES[i]; if (!ttHouse(h)) continue; const p = ttDoor(h); if (!inView(p.x, p.y, 40)) continue; glow(p.x, p.y, 22 + Math.sin(gt * 7 + i) * 2, '255,150,40', 0.4 * L * oK); }
    if (calXmasDeco(d) && inView(XTREE.x, XTREE.y, 120)) glow(XTREE.x, XTREE.y - 10, 70, '255,210,120', 0.28 * L * oK);
    const lan = act.find(e => e.id === 'nachtmarkt' || e.id === 'sommerfest');
    if (lan && inView(FOUNTAIN.x, FOUNTAIN.y, 260)) for (let i = 0; i < LAN_N; i += 2) { const a = (i + 0.5) / LAN_N * TAU; glow(FOUNTAIN.x + Math.cos(a) * (LAN_R - 7), FOUNTAIN.y + Math.sin(a) * (LAN_R - 7) * 0.96, 26, lan.id === 'nachtmarkt' ? '255,140,60' : '255,220,140', 0.32 * L * oK); }
  }
  // ---------- Zeichnen über dem Bild (Bildschirmkoordinaten): Feuerwerk, Herzen, Konfetti ----------
  const calH = (a, b) => { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); };
  function calDrawSky() {
    if (KR_NEUTRAL || !G || LOFX || state === 'edit') return; const act = calList(); if (!act.length) return; const out = 1 - 0.85 * (indoorK || 0); if (out < 0.1) return;
    ctx.save(); ctx.globalAlpha = out;
    if (act.some(e => e.id === 'silvester')) drawFireworks(calC.d || calNow());
    if (act.some(e => e.id === 'valentin')) for (let i = 0; i < 12; i++) { const ph = (gt * 0.06 + calH(i, 1)) % 1, x = W * calH(i, 2) + Math.sin(gt * 0.8 + i) * 16, y = H * (1.05 - ph * 1.15), s = 5 + calH(i, 3) * 4; ctx.globalAlpha = out * Math.sin(ph * Math.PI) * 0.75; ctx.fillStyle = i % 3 ? '#FF6FA8' : '#FF3D6E'; heartAt(x, y, s); }
    const conf = act.some(e => e.id === 'geburtstag') ? 40 : act.some(e => e.id === 'sommerfest') ? 18 : 0;
    for (let i = 0; i < conf; i++) { const ph = (gt * (0.05 + calH(i, 4) * 0.05) + calH(i, 5)) % 1, x = W * calH(i, 6) + Math.sin(gt * 1.3 + i) * 12, y = ph * (H + 20) - 10; ctx.globalAlpha = out * 0.9; ctx.fillStyle = ['#FF5C5C', '#FFD24A', '#5CB8FF', '#63FF9A', '#FF9CC8', '#B36BFF'][i % 6]; ctx.save(); ctx.translate(x, y); ctx.rotate(gt * 3 + i); ctx.fillRect(-3.4, -1.6, 6.8, 3.2); ctx.restore(); }
    ctx.restore();
  }
  function heartAt(x, y, s) { ctx.beginPath(); ctx.moveTo(x, y + s * 0.9); ctx.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.8, y - s * 1.3, x, y - s * 0.5); ctx.bezierCurveTo(x + s * 0.8, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9); ctx.fill(); }
  function drawFireworks(d) {
    const mins = d.getHours() * 60 + d.getMinutes(), toMid = mins >= 18 * 60 ? 1440 - mins : -mins, peak = Math.max(0, 1 - Math.abs(toMid) / 40); // 40 Minuten um Mitternacht am meisten
    const per = 1.1 - 0.8 * peak, n = 5, t = gt, k0 = Math.floor(t / per), FC = ['255,90,90', '255,210,74', '120,200,255', '120,255,160', '255,140,220', '255,255,255'];
    ctx.globalCompositeOperation = 'lighter';
    for (let k = k0 - n; k <= k0; k++) { const t0 = k * per + calH(k, 7) * per * 0.5, a = t - t0; if (a < 0 || a > 2.6) continue;
      const bx = W * (0.12 + calH(k, 8) * 0.76), by = H * (0.12 + calH(k, 9) * 0.3), col = FC[Math.floor(calH(k, 10) * FC.length)], rise = 0.8;
      if (a < rise) { const q = a / rise, y = H + 10 + (by - H - 10) * (1 - (1 - q) * (1 - q)); ctx.fillStyle = 'rgba(255,230,180,.9)'; ctx.fillRect(bx - 1, y, 2, 6); ctx.fillStyle = 'rgba(255,200,120,.35)'; ctx.fillRect(bx - 0.5, y + 6, 1, 14); continue; }
      const b = a - rise, f = Math.max(0, 1 - b / 1.8), R = (46 + calH(k, 11) * 50) * Math.min(1.4, Math.max(0.8, H / 420)), np = 40;
      if (b < 0.3) { const g = ctx.createRadialGradient(bx, by, 0, bx, by, R * 1.4); g.addColorStop(0, 'rgba(' + col + ',' + (0.45 * (1 - b / 0.3)).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g; ctx.fillRect(bx - R * 1.4, by - R * 1.4, R * 2.8, R * 2.8); }
      ctx.fillStyle = 'rgba(' + col + ',' + Math.min(1, f * 1.2).toFixed(3) + ')'; const ga0 = ctx.globalAlpha;
      for (let i = 0; i < np; i++) { const an = i / np * TAU + calH(k, i) * 0.2, sp = R * (1 - Math.exp(-b * 3)) * (0.75 + calH(i, k) * 0.3), x = bx + Math.cos(an) * sp, y = by + Math.sin(an) * sp + b * b * 16, s = 3.4 * f + 1; ctx.fillRect(x - s / 2, y - s / 2, s, s); const sp2 = sp * 0.82; ctx.globalAlpha = ga0 * 0.45; ctx.fillRect(bx + Math.cos(an) * sp2 - s / 4, by + Math.sin(an) * sp2 + b * b * 12 - s / 4, s / 2, s / 2); ctx.globalAlpha = ga0; }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
