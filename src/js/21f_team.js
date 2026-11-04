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
    G.money += pay; G.earned += pay; if (ok) addRep(0.8); try { sfx.cash(); } catch (e) {}
    msg(ok ? '🤝 Team-Auftrag geschafft! Deine ' + TA.my + ' ' + (AREAS.keller.lbl.unit || 'Beutel') + ' bringen ' + fmt(TA.my * u) + ' + Bonus ' + fmt(bonus) : '⏱️ Team-Auftrag abgelaufen. Für deine ' + TA.my + ' ' + (AREAS.keller.lbl.unit || 'Beutel') + ' gibt es ' + fmt(pay), !ok, 'ok');
    TA.my = 0; TA.myK = ''; save();
  }
  function taTick(dt) {
    if (!G || STU.on) return; const lead = copLead(), peers = mpPeers();
    if (!mp.on || !peers) { if (TA.cur && !TA.cur.d && lead) { TA.cur.d = 2; taPay(TA.cur); TA.cur = null; } return; }
    if (lead) {
      if (!TA.cur) { TA.next -= dt; if (TA.next <= 0) { TA.next = 240 + Math.random() * 180; taNew(); } }
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
    const a = TA.cur; if (!a || a.d) { b.appendChild(uiEl('div', 'empty', 'Gerade kein Team-Auftrag. Der nächste kommt in ein paar Minuten.')); return; }
    const tot = taTot(a), u = taUnit(), c = krCard(b, '🤝 ' + a.nm + (a.rd ? ' · ' + a.rd : ''), tot + ' / ' + a.n, 'Noch ' + Math.floor(a.t / 60) + ':' + String(Math.floor(a.t % 60)).padStart(2, '0') + ' · ' + fmt(u) + ' je ' + (AREAS.keller.lbl.unit || 'Beutel') + ' plus Bonus bis ' + fmt(Math.round(u * a.n * 0.5)) + ' für alle zusammen');
    krBar(c, tot / a.n);
    const names = Object.keys(a.c).map(id => (id === mp.id ? 'Du' : (mp.friends[id] || {}).name || 'Spieler') + ': ' + a.c[id]); if (names.length) c.appendChild(uiEl('div', 'ds', names.join(' · ')));
    const bt = uiEl('button', 'buy', 'Hinführen'); bt.addEventListener('click', () => { wayPt = { x: a.x, y: a.y, cur: 1 }; closePhone(); msg('🤝 Wegpunkt gesetzt: ' + a.nm); }); c.appendChild(bt);
  }
