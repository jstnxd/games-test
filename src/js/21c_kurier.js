  // =====================================================================================================
  // v167: Kurierfahrten mit dem Auto als Zeitrennen. Handy → Aufträge → Kurier: drei Angebote (kurz, mittel, lang).
  // Mit dem Auto zur Abholung fahren, ab da läuft die Zeit bis zum Ziel. Restzeit steht über dem Auto, nicht in der Anzeige.
  // Gold, Silber oder Bronze je nach Restzeit. Abgesperrte Straßen (Baustelle, Straßenfest) zwingen zu Umwegen.
  // =====================================================================================================
  let KUR = { offers: [], job: null, oT: -1 };
  const kurCarId = () => (G && G.veh && G.veh.car && G.veh.car !== 'none' && VEH_BY[G.veh.car]) ? G.veh.car : '';
  // Halteplatz am Fahrbahnrand vor einem Haus
  function kurCurb(h) {
    let best = null, bd = 1e9;
    for (const r of RD) { const p = r.h ? { x: clamp(h.dx, 40, WW - 40), y: Math.abs(h.dy - r.c0) < Math.abs(h.dy - r.c1) ? r.c0 + 20 : r.c1 - 20 } : { x: Math.abs(h.dx - r.c0) < Math.abs(h.dx - r.c1) ? r.c0 + 20 : r.c1 - 20, y: clamp(h.dy, YMIN + 40, WH - 40) };
      const d = Math.hypot(p.x - h.dx, p.y - h.dy); if (d < bd) { bd = d; best = p; } }
    return bd < 240 ? { x: best.x, y: best.y, nm: h.name, rd: (RD.find(r => r.h ? best.y > r.c0 - 1 && best.y < r.c1 + 1 : best.x > r.c0 - 1 && best.x < r.c1 + 1) || {}).name || '' } : null;
  }
  const KUR_PTS = (() => { const L = []; HOUSES.forEach(h => { if (h.gang || h.office) return; const p = kurCurb(h); if (p && !RIVER_HIT(p)) L.push(p); }); return L; })();
  function RIVER_HIT(p) { return p.y > RIVER.y0 - 30 && p.y < RIVER.y1 + 30; }
  const KUR_KIND = [{ k: 'kurz', nm: 'Kurz', d0: 700, d1: 1500, f: 1 }, { k: 'mittel', nm: 'Mittel', d0: 1600, d1: 2800, f: 1.15 }, { k: 'lang', nm: 'Lang', d0: 2900, d1: 5200, f: 1.3 }];
  const kurDist = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  function kurOffers() {
    const car = kurCarId(), spd = car ? VEH_BY[car].spd : 300, L = [];
    for (const K of KUR_KIND) { for (let n = 0; n < 200; n++) { const a = KUR_PTS[Math.floor(Math.random() * KUR_PTS.length)], b = KUR_PTS[Math.floor(Math.random() * KUR_PTS.length)], d = kurDist(a, b); if (d < K.d0 || d > K.d1 || a.nm === b.nm || !zoneOpenAt(a.x, a.y) || !zoneOpenAt(b.x, b.y)) continue;
        const lim = Math.round(d / (spd * 0.55) + 10), pay = Math.round((60 + d * 0.11) * K.f * (1 + Math.min(G.rep, 100) / 120) / 10) * 10; L.push({ k: K.k, nm: K.nm, a, b, d, lim, pay }); break; } }
    KUR.offers = L; KUR.oT = absMin();
  }
  function kurTake(i) {
    const o = KUR.offers[i]; if (!o || KUR.job) return false; if (!kurCarId()) { msg('Für Kurierfahrten brauchst du ein Auto', true); return false; }
    KUR.job = Object.assign({ st: 'pick', t: 0 }, o); KUR.offers.splice(i, 1); wayPt = { x: o.a.x, y: o.a.y, cur: 1 }; msg('📦 Fahr zur Abholung: ' + o.a.nm + (o.a.rd ? ', ' + o.a.rd : ''), false, 'ok'); sfx.ping(); return true;
  }
  function kurCancel(why, bad) { if (!KUR.job) return; KUR.job = null; if (wayPt && wayPt.cur) wayPt = null; if (why) msg(why, !!bad); }
  const kurFmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  function kurTick(dt) {
    const j = KUR.job; if (!G) return; if (!j) return;
    if (!kurCarId()) { kurCancel('Kurierfahrt abgebrochen: kein Auto mehr', true); return; }
    if (j.st === 'pick') { if (Math.hypot(player.x - j.a.x, player.y - j.a.y) < 75) { if (!inCar()) { if (!j.warn) { j.warn = 1; msg('Steig ins Auto, dann geht es los', true); } return; } j.st = 'run'; j.t = j.lim; wayPt = { x: j.b.x, y: j.b.y, cur: 1 }; sfx.buy(); msg('📦 Paket geladen! ' + kurFmt(j.lim) + ' bis ' + j.b.nm + (j.b.rd ? ', ' + j.b.rd : ''), false, 'ok'); } return; }
    j.t -= dt; if (j.t <= 10 && j.t + dt > 10) sfx.bad();
    if (j.t <= 0) { kurCancel('⏱️ Zu spät! Der Kunde hat abgesagt', true); return; }
    if (Math.hypot(player.x - j.b.x, player.y - j.b.y) < 75 && inCar()) {
      const r = j.t / j.lim, md = r >= 0.4 ? ['🥇', 'Gold', 1.5] : r >= 0.2 ? ['🥈', 'Silber', 1.25] : ['🥉', 'Bronze', 1], pay = Math.round(j.pay * md[2] / 10) * 10;
      G.money += pay; G.earned += pay; G.stat.kur = (G.stat.kur || 0) + 1; addRep(md[2] > 1.3 ? 0.6 : 0.3); sfx.cash(); floater(player.x, player.y - 30, '+' + fmt(pay), '#FFB547');
      const B = G.kurB || (G.kurB = {}); const best = B[j.k] || 0, used = j.lim - j.t; msg(md[0] + ' ' + md[1] + '! Geliefert mit ' + kurFmt(j.t) + ' Rest · +' + fmt(pay), false, 'ok');
      if (!best || used < best) B[j.k] = Math.round(used * 10) / 10;
      KUR.job = null; if (wayPt && wayPt.cur) wayPt = null; save();
    }
  }
  // Restzeit über dem Auto
  function kurDraw() {
    const j = KUR.job; if (!j || j.st !== 'run' || player.x < 0) return; const low = j.t <= 10, s = kurFmt(j.t), x = player.x, y = player.y - 46 + (low ? Math.sin(gt * 12) * 1.5 : 0);
    ctx.save(); ctx.font = '900 13px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText('📦 ' + s).width + 14;
    ctx.fillStyle = low ? 'rgba(170,30,40,.88)' : 'rgba(16,21,28,.8)'; rr(x - w / 2, y - 10, w, 20, 10); ctx.fill(); ctx.fillStyle = low ? '#FFFFFF' : '#FFD27A'; ctx.fillText('📦 ' + s, x, y + 0.5);
    const r = clamp(j.t / j.lim, 0, 1); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(x - w / 2 + 6, y + 7, w - 12, 2); ctx.fillStyle = r >= 0.4 ? '#FFD24A' : r >= 0.2 ? '#C9D2DC' : '#D9905A'; ctx.fillRect(x - w / 2 + 6, y + 7, (w - 12) * r, 2); ctx.restore();
  }
  function renderKurier(b) {
    if (!G) return; const car = kurCarId();
    uiInfo(b, 'Eilpakete quer durch die Stadt. Fahr mit dem Auto zur Abholung, dann läuft die Zeit. Viel Restzeit bringt 🥇 Gold (+50 %), etwas weniger 🥈 Silber (+25 %), knapp 🥉 Bronze. Zu spät gibt es nichts.');
    if (!car) { uiInfo(b, '<b>Du brauchst ein Auto.</b> Kaufen kannst du eins unter Ausrüstung → Fahrzeuge.'); return; }
    const j = KUR.job;
    if (j) { const c = krCard(b, '📦 ' + j.nm + ': ' + j.a.nm + ' → ' + j.b.nm, j.st === 'pick' ? 'zur Abholung' : '⏱️ ' + kurFmt(j.t), (j.st === 'pick' ? 'Fahr zu ' + j.a.nm + (j.a.rd ? ' (' + j.a.rd + ')' : '') + '. Ab dort hast du ' + kurFmt(j.lim) + '.' : 'Bring das Paket zu ' + j.b.nm + (j.b.rd ? ' (' + j.b.rd + ')' : '') + '.') + ' Lohn ab ' + fmt(j.pay) + '.');
      const bt = uiEl('button', 'buy alt', 'Abbrechen'); bt.addEventListener('click', () => { kurCancel('Kurierfahrt abgebrochen'); renderPhone(); }); c.appendChild(bt); return; }
    if (!KUR.offers.length || absMin() - KUR.oT > 120) kurOffers();
    const B = G.kurB || {};
    KUR.offers.forEach((o, i) => { const c = krCard(b, '📦 ' + o.nm + ' · ' + Math.round(o.d / 100) * 10 + ' m', fmt(o.pay) + '+', o.a.nm + (o.a.rd ? ' (' + o.a.rd + ')' : '') + ' → ' + o.b.nm + (o.b.rd ? ' (' + o.b.rd + ')' : '') + '<br>Zeit: ' + kurFmt(o.lim) + (B[o.k] ? ' · deine beste ' + o.nm + '-Fahrt: ' + kurFmt(B[o.k]) : ''));
      const bt = uiEl('button', 'buy', 'Annehmen'); bt.addEventListener('click', () => { if (kurTake(i)) closePhone(); }); c.appendChild(bt); });
    if (G.stat.kur) uiInfo(b, 'Kurierfahrten bisher: ' + G.stat.kur);
  }
