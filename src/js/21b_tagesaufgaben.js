  // =====================================================================================================
  // v165: Tagesaufgaben. Jeder Spieltag bringt 3 Aufgaben: eine aus Verkauf, eine aus der Arbeit, eine aus der Stadt.
  // Jede bringt Geld und etwas Ruf, alle drei einen Bonus und einen Serien-Tag. Jeder 5. Serien-Tag bringt eine Marke.
  // Gespeichert in G.lg.td (bleibt mit dem Rest von G.lg erhalten). Anzeige im Handy unter Karriere → Heute.
  // =====================================================================================================
  const TD_GOAL = {
    del: { grp: 0, ic: '📦', t: n => n + ' Kunden beliefern', v: () => G.stat.del, n: r => Math.min(8, 3 + Math.floor(r / 20)) },
    earn: { grp: 0, ic: '💶', t: n => fmt(n) + ' Umsatz machen', v: () => G.earned, n: r => niceN(basePrice('keller') * (8 + r / 4)) },
    vip: { grp: 0, ic: '★', t: n => n + ' Spezialkunde' + (n === 1 ? '' : 'n') + ' beliefern', v: () => G.stat.vip, n: () => 1, ok: () => G.rep >= VIP_REP },
    hv: { grp: 1, ic: '🌱', t: n => n + ' Mal ernten', v: () => (G.kr ? G.kr.cnt.hv : 0), n: r => 2 + Math.floor(r / 40) },
    pk: { grp: 1, ic: '🛍️', t: n => n + ' ' + (AREAS.keller.lbl.unit || 'Beutel') + ' selbst packen', v: () => G.stat.pk || 0, n: r => 3 + Math.floor(r / 30) },
    wt: { grp: 1, ic: '💧', t: n => n + ' Pflanzen selbst gießen', v: () => G.stat.wt || 0, n: () => 3 },
    gym: { grp: 2, ic: '🏋️', t: () => 'Einmal im Gym trainieren', v: () => G.stat.gym || 0, n: () => 1 },
    pizza: { grp: 2, ic: '🍕', t: () => 'Eine Pizza fürs Team holen', v: () => G.stat.pizza || 0, n: () => 1, ok: () => G.rep >= 5 },
    gb: { grp: 2, ic: '🧢', t: () => 'Eine Gang verjagen', v: () => G.stat.gb || 0, n: () => 1, ok: () => G.rep >= 10 },
    gv: { grp: 2, ic: '🤝', t: n => n + ' Einheiten an den Hehler', v: () => G.stat.gv || 0, n: () => 5, ok: () => gvOpen() },
    club: { grp: 2, ic: '🪩', t: () => 'Eine Club-Lieferung (nachts)', v: () => G.stat.club || 0, n: () => 1, ok: () => G.rep >= CLUB_REP },
    apo: { grp: 2, ic: '💊', t: n => n + ' Dosen an die Apotheke', v: () => G.stat.apo || 0, n: () => 3, ok: () => isOpen(AREAS.pr) },
    kur: { grp: 2, ic: '📦', t: () => 'Eine Kurierfahrt schaffen', v: () => G.stat.kur || 0, n: () => 1, ok: () => !!kurCarId() },
    bus: { grp: 2, ic: '🚌', t: () => 'Einmal Bus fahren', v: () => G.stat.bus || 0, n: () => 1 }
  };
  const tdDef = () => ({ d: -1, g: [], st: 0, sd: -1 });
  function cleanTd(o) {
    const D = tdDef(); if (!o || typeof o !== 'object') return D; const n = (v, a, b) => clamp(Number.isFinite(+v) ? Math.floor(+v) : 0, a, b);
    D.d = n(o.d, -1, 1e7); D.st = n(o.st, 0, 1e6); D.sd = n(o.sd, -1, 1e7);
    if (Array.isArray(o.g)) D.g = o.g.slice(0, 3).filter(g => g && TD_GOAL[g.k]).map(g => ({ k: g.k, n: n(g.n, 1, 1e12) || 1, b: Number.isFinite(+g.b) ? +g.b : 0, d: g.d ? 1 : 0 }));
    return D;
  }
  const TD = () => { const L = LG(); if (!L.td || typeof L.td !== 'object') L.td = tdDef(); return L.td; };
  const tdCash = () => Math.max(50, Math.round(basePrice('keller') * 6 / 10) * 10);
  const tdBonus = () => Math.max(100, Math.round(basePrice('keller') * 12 / 10) * 10);
  const tdStreak = () => { const D = TD(); return D.sd >= G.day - 1 ? D.st : 0; };
  function tdRoll() {
    const D = TD(), pick = [];
    for (let grp = 0; grp < 3; grp++) { const ks = Object.keys(TD_GOAL).filter(k => TD_GOAL[k].grp === grp && (!TD_GOAL[k].ok || TD_GOAL[k].ok()) && !(D.g.some(g => g.k === k) && Math.random() < 0.6)); if (ks.length) pick.push(ks[Math.floor(Math.random() * ks.length)]); }
    D.d = G.day; D.g = pick.map(k => ({ k, n: TD_GOAL[k].n(G.rep), b: TD_GOAL[k].v(), d: 0 }));
  }
  // Fortschritt seit Tagesbeginn. Sinkt ein Zähler (Prestige), wird neu angesetzt.
  const tdProg = g => { const cur = TD_GOAL[g.k].v(); if (cur < g.b) g.b = cur; return Math.min(g.n, Math.max(0, cur - g.b)); };
  let tdT = 0;
  function tdTick(dt) {
    if (!G || KR_NEUTRAL) return; tdT -= dt; if (tdT > 0) return; tdT = 1;
    const D = TD(); if (D.d !== G.day) { const first = D.d < 0; tdRoll(); if (!first) msg('📋 Neue Tagesaufgaben: Handy → Karriere → Heute', false, 'ok'); return; }
    for (const g of D.g) { if (g.d || tdProg(g) < g.n) continue; g.d = 1; const c = tdCash(); G.money += c; addRep(0.4); sfx.cash(); msg('✓ Tagesaufgabe: ' + TD_GOAL[g.k].t(g.n) + ' (+' + fmt(c) + ')', false, 'ok');
      if (D.g.every(x => x.d)) { const bo = tdBonus(); G.money += bo; D.st = D.sd === G.day - 1 ? D.st + 1 : 1; D.sd = G.day; const sn = D.st; if (sn % 5 === 0) { LG().mk += 1; LG().mkT += 1; } setTimeout(() => { msg('🔥 Alle Tagesaufgaben geschafft! +' + fmt(bo) + ' · Serie ' + sn + ' Tag' + (sn === 1 ? '' : 'e') + (sn % 5 === 0 ? ' · 🎟️ +1 Marke' : ''), false, 'ok'); }, 1600); }
      save(); }
  }
  function renderHeute(b) {
    if (!G) return; const D = TD(); if (D.d !== G.day) tdRoll(); const st = tdStreak(), done = D.g.filter(g => g.d).length;
    krGrp(b, 'Heute · Tag ' + G.day);
    uiInfo(b, 'Jeden Spieltag gibt es drei neue Aufgaben. Jede bringt ' + fmt(tdCash()) + ' und etwas Ruf. Schaffst du alle drei, gibt es ' + fmt(tdBonus()) + ' extra und deine Serie wächst. Jeder 5. Tag in Folge bringt eine 🎟️ Marke.');
    for (const g of D.g) { const T = TD_GOAL[g.k], p = tdProg(g), c = krCard(b, T.ic + ' ' + T.t(g.n), g.d ? '✓ geschafft' : (g.k === 'earn' ? fmt(p) + ' / ' + fmt(g.n) : p + ' / ' + g.n), ''); if (!g.d) krBar(c, p / g.n); else c.classList.add('done'); }
    const sc = krCard(b, '🔥 Serie: ' + st + ' Tag' + (st === 1 ? '' : 'e'), done + ' / ' + D.g.length + ' heute', st ? 'Noch ' + (5 - st % 5) + ' Tag' + (5 - st % 5 === 1 ? '' : 'e') + ' bis zur nächsten Marke. Verpasst du einen Tag, fängt die Serie von vorn an.' : 'Schaff heute alle drei, dann startet deine Serie.');
    krBar(sc, (st % 5) / 5);
  }
