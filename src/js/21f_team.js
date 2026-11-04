  // =====================================================================================================
  // v181: Team-Aufträge im Mehrspieler. Ein Großkunde will viele Beutel auf einmal. Alle im Raum liefern zusammen an
  // denselben Ort (ganz einfach: mit Ware hinstellen, die Beutel werden nach und nach abgegeben). Schafft ihr es in
  // der Zeit, bekommt jeder sein Geld für seine Beutel plus seinen Anteil am Bonus. Läuft die Zeit ab, gibt es nur
  // das Geld für die abgegebenen Beutel. Der Spieler mit der kleinsten ID (wie bei der Polizei) verwaltet den Auftrag.
  // =====================================================================================================
  const TA = { cur: null, my: 0, myK: '', paid: {}, next: 120, hT: 0, c: {} };
  const TA_R = 70;
  const taUnit = () => Math.round(basePrice('keller') * 1.5);
  const taNeed = n => 6 + 4 * Math.min(4, n);
  const taTot = a => Object.values(a.c || {}).reduce((s, v) => s + (+v || 0), 0);
  function taNew() {
    const pts = KUR_PTS.filter(p => { try { return zoneOpenAt(p.x, p.y); } catch (e) { return true; } }); if (!pts.length) return;
    const p = pts[Math.floor(Math.random() * pts.length)], n = mpPeers() + 1, nm = ['Hotel Lindenhof', 'Vereinsheim', 'Festzelt', 'Studentenheim', 'Jugendclub', 'Hochzeitsfeier'][Math.floor(Math.random() * 6)];
    TA.cur = { k: Math.random().toString(36).slice(2, 8), nm, x: Math.round(p.x), y: Math.round(p.y), rd: p.rd || '', n: taNeed(n), t: 420, c: {}, d: 0 }; TA.c = {};
    msg('🤝 Team-Auftrag: ' + nm + ' will ' + TA.cur.n + ' ' + (AREAS.keller.lbl.unit || 'Beutel') + '. Liefert zusammen! (Handy → Aufträge → Team)', false, 'ok'); try { sfx.ping(); } catch (e) {}
  }
  // vom Verwalter an alle
  function taSync() { const a = TA.cur; if (!a) return undefined; return { k: a.k, nm: a.nm, x: a.x, y: a.y, rd: a.rd, n: a.n, t: Math.round(a.t), c: a.c, d: a.d }; }
  function taApply(o) {
    if (o === undefined || copLead()) return; if (!o || typeof o !== 'object') { if (TA.cur && !TA.cur.d) TA.cur = null; return; }
    const k = typeof o.k === 'string' ? o.k.replace(/[^a-z0-9]/g, '').slice(0, 8) : ''; if (!k) return;
    const c = {}; if (o.c && typeof o.c === 'object') for (const id of Object.keys(o.c).slice(0, 12)) { const v = Math.floor(+o.c[id]); if (id.length <= 24 && v > 0 && v < 1000) c[id] = v; }
    const isNew = !TA.cur || TA.cur.k !== k;
    TA.cur = { k, nm: mpClean(o.nm, 24) || 'Großkunde', x: clamp(+o.x || 0, 0, WW), y: clamp(+o.y || 0, YMIN, WH), rd: typeof o.rd === 'string' ? o.rd.slice(0, 24) : '', n: clamp(Math.floor(+o.n) || 10, 1, 60), t: clamp(+o.t || 0, 0, 900), c, d: o.d === 1 ? 1 : o.d === 2 ? 2 : 0 };
    if (isNew && !TA.cur.d) { msg('🤝 Team-Auftrag: ' + TA.cur.nm + ' will ' + TA.cur.n + ' ' + (AREAS.keller.lbl.unit || 'Beutel') + '. Liefert zusammen! (Handy → Aufträge → Team)', false, 'ok'); try { sfx.ping(); } catch (e) {} }
    if (TA.cur.d) taPay(TA.cur);
  }
  // von jedem Spieler: wie viele Beutel er selbst schon abgegeben hat
  function taContrib(id, o) { const a = TA.cur; if (!copLead() || !a || a.d || !o || o.k !== a.k) return; const v = Math.floor(+o.n); if (v > 0 && v < 1000) a.c[id] = Math.max(a.c[id] || 0, v); }
  function taPay(a) {
    if (TA.paid[a.k] || TA.myK !== a.k || TA.my <= 0) { TA.paid[a.k] = 1; return; } TA.paid[a.k] = 1;
    const ok = a.d === 1, u = taUnit(), bonus = ok ? Math.round(u * a.n * 0.5 * TA.my / Math.max(1, Math.max(a.n, taTot(a)))) : 0, pay = TA.my * u + bonus;
    G.money += pay; G.earned += pay; if (ok) { addRep(0.8); G.stat.tm = (G.stat.tm || 0) + 1; } try { sfx.cash(); } catch (e) {}
    msg(ok ? '🤝 Team-Auftrag geschafft! Deine ' + TA.my + ' ' + (AREAS.keller.lbl.unit || 'Beutel') + ' bringen ' + fmt(TA.my * u) + ' + Bonus ' + fmt(bonus) : '⏱️ Team-Auftrag abgelaufen. Für deine ' + TA.my + ' ' + (AREAS.keller.lbl.unit || 'Beutel') + ' gibt es ' + fmt(pay), !ok, 'ok');
    TA.my = 0; TA.myK = ''; save();
  }
  function taTick(dt) {
    if (!G || STU.on) return; const lead = copLead(), peers = mpPeers();
    if (!mp.on || !peers) { if (TA.cur && !TA.cur.d && lead) { TA.cur.d = 2; taPay(TA.cur); TA.cur = null; } return; }
    if (lead) {
      if (!TA.cur) { if (!TE.cur) { TA.next -= dt; if (TA.next <= 0) { TA.next = 240 + Math.random() * 180; taNew(); } } }
      else { const a = TA.cur; if (TA.myK === a.k) a.c[mp.id] = TA.my; if (!a.d) { a.t -= dt; if (taTot(a) >= a.n) { a.d = 1; a.end = gt; taPay(a); } else if (a.t <= 0) { a.d = 2; a.end = gt; taPay(a); } } else if (gt - (a.end || gt) > 12) TA.cur = null; }
    }
    // Beutel abgeben, wenn man mit Ware am Ort steht
    const a = TA.cur; if (!a || a.d) return; if (Math.hypot(player.x - a.x, player.y - a.y) > TA_R) return; TA.hT -= dt; if (TA.hT > 0) return; TA.hT = 0.45;
    const inv = S(AREAS.keller).inv; if (inv.bags <= 0) { if (gt - (TA.warn || -99) > 8) { TA.warn = gt; msg('Für den Team-Auftrag brauchst du ' + (AREAS.keller.lbl.unit || 'Beutel') + ' aus dem Keller', true); } return; }
    if (taTot(a) + (TA.myK === a.k ? 0 : TA.my) >= a.n) return;
    inv.bags -= 1; if (TA.myK !== a.k) { TA.myK = a.k; TA.my = 0; } TA.my += 1; if (lead) a.c[mp.id] = TA.my; else a.c[mp.id] = Math.max(a.c[mp.id] || 0, TA.my);
    try { sfx.put(); } catch (e) {} floater(player.x, player.y - 30, '+1 Team', '#7FD0C8');
  }
  // Markierung in der Stadt
  function taDraw() {
    const a = TA.cur; if (!a || a.d) return; const tot = taTot(a), r = clamp(tot / a.n, 0, 1), pul = 1 + Math.sin(gt * 3) * 0.06;
    ctx.save(); ctx.translate(a.x, a.y);
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#7FD0C8'; ctx.beginPath(); ctx.arc(0, 0, TA_R * pul, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(16,21,28,.6)'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, TAU); ctx.stroke(); ctx.strokeStyle = '#7FD0C8'; ctx.beginPath(); ctx.arc(0, 0, 26, -Math.PI / 2, -Math.PI / 2 + TAU * r); ctx.stroke();
    ctx.font = '900 18px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🤝', 0, 1);
    const s = tot + ' / ' + a.n + ' · ' + Math.floor(a.t / 60) + ':' + String(Math.floor(a.t % 60)).padStart(2, '0'); ctx.font = '900 12px sans-serif'; const w = ctx.measureText(s).width + 14;
    ctx.fillStyle = 'rgba(16,21,28,.82)'; rr(-w / 2, -50, w, 18, 9); ctx.fill(); ctx.fillStyle = '#BFF3EE'; ctx.fillText(s, 0, -41); ctx.restore();
  }
  // Handy → Aufträge → Team
  function renderTeam(b) {
    uiInfo(b, 'Team-Aufträge gibt es, wenn ihr zu zweit oder mehr in einem Raum spielt. Ein Großkunde will viele ' + (AREAS.keller.lbl.unit || 'Beutel') + '. Stell dich mit Ware an den Ort, die Ware wird von selbst abgegeben. Jeder bekommt Geld für seine eigenen ' + (AREAS.keller.lbl.unit || 'Beutel') + ' und, wenn ihr es rechtzeitig schafft, seinen Anteil am Bonus.');
    if (!mp.on || !mpPeers()) { b.appendChild(uiEl('div', 'empty', 'Gerade spielst du allein. Sobald jemand in deinem Raum ist, kommen Team-Aufträge.')); return; }
    try { teCard(b); } catch (e) {}
    const a = TA.cur; if (!a || a.d) { b.appendChild(uiEl('div', 'empty', 'Gerade kein Team-Auftrag. Der nächste kommt in ein paar Minuten.')); return; }
    const tot = taTot(a), u = taUnit(), c = krCard(b, '🤝 ' + a.nm + (a.rd ? ' · ' + a.rd : ''), tot + ' / ' + a.n, 'Noch ' + Math.floor(a.t / 60) + ':' + String(Math.floor(a.t % 60)).padStart(2, '0') + ' · ' + fmt(u) + ' je ' + (AREAS.keller.lbl.unit || 'Beutel') + ' plus Bonus bis ' + fmt(Math.round(u * a.n * 0.5)) + ' für alle zusammen');
    krBar(c, tot / a.n);
    const names = Object.keys(a.c).map(id => (id === mp.id ? 'Du' : (mp.friends[id] || {}).name || 'Spieler') + ': ' + a.c[id]); if (names.length) c.appendChild(uiEl('div', 'ds', names.join(' · ')));
    const bt = uiEl('button', 'buy', 'Hinführen'); bt.addEventListener('click', () => { wayPt = { x: a.x, y: a.y, cur: 1 }; closePhone(); msg('🤝 Wegpunkt gesetzt: ' + a.nm); }); c.appendChild(bt);
  }

  // =====================================================================================================
  // v189: Gemeinsame Stadt-Ereignisse. Ab und zu tauchen in einem Viertel 12 Laternen (nachts) oder Luftballons (tagsüber)
  // auf. Alle im Raum sammeln zusammen: hinlaufen oder -fahren genügt. Jedes Stück bringt dem Finder etwas Geld. Schafft
  // ihr alle in der Zeit, bekommt jeder, der mitgemacht hat, einen Bonus. Der Verwalter ist derselbe wie beim Team-Auftrag.
  // =====================================================================================================
  const TE = { cur: null, next: 420, mine: {}, paid: {}, req: [], reqT: 0 };
  const TE_N = 12, TE_R = 34;
  const teUnit = () => Math.round(basePrice('keller') * 0.8), teBonus = () => Math.round(basePrice('keller') * 6);
  function teNew() {
    const zs = [...new Set(ZONES.map(z => z.name))].map(nm => ({ nm, pts: KUR_PTS.filter(p => vqZone(p.x, p.y) === nm && (() => { try { return zoneOpenAt(p.x, p.y); } catch (e) { return true; } })()) })).filter(z => z.pts.length >= TE_N);
    if (!zs.length) { const open = KUR_PTS.filter(p => { try { return zoneOpenAt(p.x, p.y); } catch (e) { return true; } }); if (open.length < 6) return; const c = open[Math.floor(Math.random() * open.length)], near = open.slice().sort((a2, b2) => Math.hypot(a2.x - c.x, a2.y - c.y) - Math.hypot(b2.x - c.x, b2.y - c.y)); zs.push({ nm: vqZone(c.x, c.y) || 'Stadtzentrum', pts: near.slice(0, TE_N) }); }
    const z = zs[Math.floor(Math.random() * zs.length)], P = z.pts.slice().sort(() => Math.random() - 0.5).slice(0, TE_N), night = G.time < 6 * 60 || G.time >= 19 * 60;
    TE.cur = { k: Math.random().toString(36).slice(2, 8), kd: night ? 'lat' : 'bal', zn: z.nm, it: P.map(p => [Math.round(p.x), Math.round(p.y), '']), t: 240, d: 0 }; TE.mine = {};
    teAnnounce(TE.cur);
  }
  function teAnnounce(e) { msg((e.kd === 'lat' ? '🏮 Laternenjagd' : '🎈 Ballonjagd') + ' (' + e.zn + ')! Sammelt zusammen alle ' + e.it.length + ' ein (Handy → Aufträge → Team)', false, 'ok'); try { sfx.ping(); } catch (e2) {} }
  function teSync() { const e = TE.cur; if (!e) return undefined; return { k: e.k, kd: e.kd, zn: e.zn, it: e.it, t: Math.round(e.t), d: e.d }; }
  function teApply(o) {
    if (o === undefined || copLead()) return; if (!o || typeof o !== 'object') { if (TE.cur && !TE.cur.d) TE.cur = null; return; }
    const k = typeof o.k === 'string' ? o.k.replace(/[^a-z0-9]/g, '').slice(0, 8) : ''; if (!k || !Array.isArray(o.it)) return;
    const it = o.it.slice(0, 20).map(q => Array.isArray(q) ? [clamp(+q[0] || 0, 0, WW), clamp(+q[1] || 0, YMIN, WH), typeof q[2] === 'string' ? q[2].slice(0, 24) : ''] : [0, 0, 'x']);
    const isNew = !TE.cur || TE.cur.k !== k; if (isNew) TE.mine = {};
    TE.cur = { k, kd: o.kd === 'lat' ? 'lat' : 'bal', zn: mpClean(o.zn, 24) || 'Viertel', it, t: clamp(+o.t || 0, 0, 900), d: o.d === 1 ? 1 : o.d === 2 ? 2 : 0 };
    if (isNew && !TE.cur.d) teAnnounce(TE.cur);
    tePayItems(); if (TE.cur.d) teEnd(TE.cur);
  }
  // Mitspieler melden, was sie aufgesammelt haben
  function teReq(id, o) { const e = TE.cur; if (!copLead() || !e || e.d || !o || o.k !== e.k || !Array.isArray(o.i)) return; for (const i of o.i.slice(0, 20)) { const q = e.it[i | 0]; if (q && !q[2]) q[2] = id; } }
  function tePayItems() { const e = TE.cur; if (!e) return; e.it.forEach((q, i) => { if (q[2] === mp.id && !TE.mine[i]) { TE.mine[i] = 1; const u = teUnit(); G.money += u; G.earned += u; } }); }
  function teEnd(e) {
    if (TE.paid[e.k]) return; TE.paid[e.k] = 1; const n = e.it.filter(q => q[2] === mp.id).length, all = e.it.every(q => q[2]);
    if (e.d === 1 && n > 0) { const bo = teBonus(); G.money += bo; G.earned += bo; addRep(0.5); try { sfx.cash(); } catch (x) {} msg('🎉 ' + (e.kd === 'lat' ? 'Laternenjagd' : 'Ballonjagd') + ' geschafft! Du hast ' + n + ' gefunden · Bonus +' + fmt(bo), false, 'ok'); }
    else if (n > 0) msg('⏱️ ' + (e.kd === 'lat' ? 'Laternenjagd' : 'Ballonjagd') + ' vorbei. Du hast ' + n + ' gefunden (' + fmt(n * teUnit()) + ')' + (all ? '' : ', es fehlten noch welche'), false, 'ok');
    save();
  }
  function teTick(dt) {
    if (!G || STU.on) return; const lead = copLead();
    if (!mp.on || !mpPeers()) { if (TE.cur && lead) TE.cur = null; return; }
    if (lead) {
      if (!TE.cur) { if (!TA.cur) { TE.next -= dt; if (TE.next <= 0) { TE.next = 480 + Math.random() * 300; teNew(); } } }
      else { const e = TE.cur; if (!e.d) { e.t -= dt; tePayItems(); if (e.it.every(q => q[2])) { e.d = 1; e.end = gt; teEnd(e); } else if (e.t <= 0) { e.d = 2; e.end = gt; teEnd(e); } } else if (gt - (e.end || gt) > 12) TE.cur = null; }
    }
    const e = TE.cur; if (!e || e.d) return;
    e.it.forEach((q, i) => { if (q[2] || TE.req.includes(i) || Math.hypot(player.x - q[0], player.y - q[1]) > TE_R) return; if (lead) q[2] = mp.id; else { TE.req.push(i); TE.reqT = gt; }
      try { sfx.put(); } catch (x) {} floater(q[0], q[1] - 24, e.kd === 'lat' ? '🏮 +1' : '🎈 +1', '#FFD24A'); });
    if (TE.req.length && gt - TE.reqT > 4) TE.req = [];
  }
  function teMsg() { const e = TE.cur; return e && !e.d && TE.req.length ? { k: e.k, i: TE.req.slice(0, 20) } : undefined; }
  // Laternen und Ballons in der Stadt
  function teDraw() {
    const e = TE.cur; if (!e || e.d) return; const lat = e.kd === 'lat';
    e.it.forEach((q, i) => { if (q[2] || TE.req.includes(i) || q[0] < viewX0 || q[0] > viewX1 || q[1] < viewY0 || q[1] > viewY1) return; const bob = Math.sin(gt * 2.2 + i) * 3, x = q[0], y = q[1] - 18 + bob;
      ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.beginPath(); ctx.ellipse(x, q[1] + 4, 8, 3, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      if (lat) { glow(x, y, 26, '255,190,90', 0.25); ctx.fillStyle = ['#E5484D', '#FF9A3C', '#FFD24A'][i % 3]; ctx.beginPath(); ctx.ellipse(x, y, 7, 9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#3A2A1A'; ctx.fillRect(x - 4, y - 11, 8, 2); ctx.fillRect(x - 4, y + 9, 8, 2); ctx.fillStyle = 'rgba(255,240,200,.55)'; ctx.fillRect(x - 1, y - 7, 2, 14); }
      else { ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y + 9); ctx.quadraticCurveTo(x + 3, y + 15, x, q[1]); ctx.stroke(); ctx.fillStyle = ['#FF5C7A', '#5BC0EB', '#FFD24A', '#63C174', '#C9A2FF'][i % 5]; ctx.beginPath(); ctx.ellipse(x, y, 7, 9, 0, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(x - 2.5, y - 3, 2, 3, -0.4, 0, TAU); ctx.fill(); }
      ctx.restore(); });
  }
  function teCard(b) {
    const e = TE.cur; if (!e || e.d) return; const got = e.it.filter(q => q[2]).length, me = e.it.filter(q => q[2] === mp.id).length, c = krCard(b, (e.kd === 'lat' ? '🏮 Laternenjagd' : '🎈 Ballonjagd') + ' · ' + e.zn, got + ' / ' + e.it.length, 'Noch ' + Math.floor(e.t / 60) + ':' + String(Math.floor(e.t % 60)).padStart(2, '0') + ' · ' + fmt(teUnit()) + ' je Fund, alle zusammen gefunden: Bonus ' + fmt(teBonus()) + ' für jeden, der mitmacht' + (me ? '<br>Du hast ' + me + ' gefunden' : ''));
    krBar(c, got / e.it.length);
    const bt = uiEl('button', 'buy', 'Zum nächsten'); bt.addEventListener('click', () => { let best = null, bd = 1e9; for (const q of e.it) { if (q[2]) continue; const d = Math.hypot(player.x - q[0], player.y - q[1]); if (d < bd) { bd = d; best = q; } } if (best) { wayPt = { x: best[0], y: best[1], cur: 1 }; closePhone(); } }); c.appendChild(bt);
  }
