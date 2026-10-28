  // ---------- v121: Spaetes Spiel: Wochenziele, Meisterstufen, Marken, Sammler-Laden, Stadtprojekte, Bestenliste ----------
  // Alles in G.lg, bleibt beim Prestige erhalten. Woche = echte Kalenderwoche (Montag neu).
  const lgDef = () => ({ wk: -1, g: [], b: {}, mk: 0, mkT: 0, mx: 0, ml: 0, proj: {}, bw: {}, wd0: 0 });
  function cleanLg(o) {
    const L = lgDef(); if (!o || typeof o !== 'object') return L; const n = (v, a, b) => clamp(Number.isFinite(+v) ? +v : 0, a, b);
    L.wk = Math.floor(n(o.wk, -1, 1e6)); L.mk = Math.floor(n(o.mk, 0, 99999)); L.mkT = Math.floor(n(o.mkT, 0, 999999)); L.mx = n(o.mx, 0, 1e4); L.ml = Math.floor(n(o.ml, 0, 9999)); L.wd0 = Math.floor(n(o.wd0, 0, 1e9));
    if (Array.isArray(o.g)) L.g = o.g.slice(0, 3).filter(g => g && LG_GOAL[g.k]).map(g => ({ k: g.k, n: Math.max(1, Math.floor(n(g.n, 1, 1e9))), d: g.d ? 1 : 0 }));
    if (o.b && typeof o.b === 'object') for (const k of Object.keys(LG_GOAL)) if (Number.isFinite(+o.b[k])) L.b[k] = +o.b[k];
    if (o.proj && typeof o.proj === 'object') for (const p of PROJ) if (o.proj[p.id]) L.proj[p.id] = 1;
    if (o.bw && typeof o.bw === 'object') for (const it of MK_SHOP) if (o.bw[it.id]) L.bw[it.id] = 1;
    if (o.td) L.td = cleanTd(o.td);
    return L;
  }
  const LG = () => G.lg || (G.lg = lgDef());
  const weekNo = (t = Date.now()) => { const d = new Date(t); return Math.floor((Math.floor((t - d.getTimezoneOffset() * 60000) / 86400000) + 3) / 7); };
  const niceN = v => { const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.max(1, v))) - 1)); return Math.round(v / p) * p; };
  const LG_GOAL = {
    del: { ic: '📦', t: n => n + ' Kunden beliefern', v: () => G.stat.del, n: r => 30 + Math.round(r * 0.7) },
    earn: { ic: '💶', t: n => fmt(n) + ' Umsatz machen', v: () => G.earned, n: r => niceN(basePrice('keller') * (50 + r) * 3) },
    hv: { ic: '🌱', t: n => n + ' Mal ernten (Helfer zählen mit)', v: () => (G.kr ? G.kr.cnt.hv : 0), n: r => 25 + Math.round(r * 0.6) },
    vip: { ic: '★', t: n => n + ' Spezialkunden beliefern', v: () => G.stat.vip, n: r => 4 + Math.round(r / 12), ok: () => G.rep >= VIP_REP },
    club: { ic: '🪩', t: n => n + ' Club-Lieferungen (nachts)', v: () => G.stat.club || 0, n: () => 5, ok: () => G.rep >= CLUB_REP },
    gb: { ic: '🧢', t: n => n + ' Gangs verjagen', v: () => G.stat.gb || 0, n: () => 3, ok: () => G.rep >= 10 },
    gv: { ic: '🤝', t: n => n + ' Einheiten an den Hehler', v: () => G.stat.gv || 0, n: () => 20, ok: () => gvOpen() },
    apo: { ic: '💊', t: n => n + ' Dosen an die Apotheke', v: () => G.stat.apo || 0, n: () => 10, ok: () => isOpen(AREAS.pr) },
    gym: { ic: '🏋️', t: n => n + ' Mal trainieren', v: () => G.stat.gym || 0, n: () => 3 },
    pizza: { ic: '🍕', t: n => n + ' Pizzas fürs Team', v: () => G.stat.pizza || 0, n: () => 3, ok: () => G.rep >= 5 }
  };
  const lgGoalCash = () => Math.round(basePrice('keller') * 40 / 100) * 100;
  function lgRoll(wk) {
    const L = LG(), keys = Object.keys(LG_GOAL).filter(k => k !== 'del' && (!LG_GOAL[k].ok || LG_GOAL[k].ok())), pick = ['del'];
    while (pick.length < 3 && keys.length) pick.push(keys.splice(Math.floor(Math.random() * keys.length), 1)[0]);
    L.wk = wk; L.g = pick.map(k => ({ k, n: LG_GOAL[k].n(G.rep), d: 0 })); L.b = {}; for (const k of pick) L.b[k] = LG_GOAL[k].v(); L.wd0 = G.stat.del;
  }
  const lgProg = g => { const L = LG(), cur = LG_GOAL[g.k].v(); if (L.b[g.k] === undefined || cur < L.b[g.k]) L.b[g.k] = cur; return Math.min(g.n, Math.max(0, cur - L.b[g.k])); }; // nach Prestige faengt Umsatz bei 0 an: neu ansetzen
  function mkAdd(n, why) { const L = LG(); L.mk += n; L.mkT += n; msg('🎟️ +' + n + ' Marke' + (n === 1 ? '' : 'n') + (why ? ': ' + why : ''), false, 'ok'); }
  let lgT = 0;
  function lgTick(dt) {
    if (!G || KR_NEUTRAL) return; lgT -= dt; if (lgT > 0) return; lgT = 2;
    const L = LG(), wk = weekNo(); if (L.wk !== wk) lgRoll(wk);
    let all = true;
    for (const g of L.g) { if (g.d) continue; if (lgProg(g) >= g.n) { g.d = 1; const c = lgGoalCash(); G.money += c; mkAdd(2, 'Wochenziel geschafft (+' + fmt(c) + ')'); sfx.cash(); if (L.g.every(x => x.d)) mkAdd(3, 'alle Wochenziele geschafft!'); save(); } else all = false; }
  }
  // Meisterstufen: Ruf ueber 100 hinaus wird zu Meister-Erfahrung
  const mlNeed = l => 3 + l * 0.5;
  function mstAdd(x) {
    if (!G || !(x > 0) || KR_NEUTRAL) return; const L = LG(); L.mx += x * projRep(); let up = 0;
    while (L.mx >= mlNeed(L.ml)) { L.mx -= mlNeed(L.ml); L.ml++; up++; }
    if (up) { mkAdd(up, 'Meisterstufe ' + L.ml); sfx.cash(); }
  }
  // Sammler-Laden: nur mit Marken
  const MK_SHOP = [
    { id: 'mkaurora', mk: 6, w: 'mkaurora' }, { id: 'mkdiamond', mk: 10, w: 'mkdiamond' }, { id: 'mkphoenix', mk: 16, w: 'mkphoenix' }, { id: 'mkcrown', mk: 24, w: 'mkcrown' },
    { id: 'tsammler', mk: 4, title: 'Sammler', name: 'Titel „Sammler“', desc: 'Zeig allen, dass du jede Woche dranbleibst' }, { id: 'tmeister', mk: 12, title: 'Großmeister', name: 'Titel „Großmeister“', desc: 'Für echte Kenner der Stadt' }
  ];
  function mkBuy(id) {
    const it = MK_SHOP.find(x => x.id === id), L = LG(); if (!it || L.bw[id] || L.mk < it.mk) return false;
    L.mk -= it.mk; L.bw[id] = 1; if (it.w) { G.wear.owned[it.w] = true; const w = WEAR_BY[it.w]; if (w) G.look[WEAR_KEY[w.slot]] = it.w; }
    if (it.title) { const k = KR(); if (!k.titles.includes(it.title)) k.titles.push(it.title); k.title = it.title; }
    sfx.buy(); save(); return true;
  }
  // Stadtprojekte: grosse Ausgaben mit kleinen dauerhaften Vorteilen (bleiben beim Prestige)
  const PROJ = [
    { id: 'licht', ic: '💡', name: 'Neue Straßenlaternen', cost: 150000, rep: 60, desc: 'Kunden warten 10 % länger auf dich' },
    { id: 'skate', ic: '🛹', name: 'Skatehalle für die Jugend', cost: 300000, rep: 70, desc: 'Ein Auftrag mehr gleichzeitig' },
    { id: 'markt', ic: '🧺', name: 'Wochenmarkt am Rathaus', cost: 600000, rep: 80, desc: 'Kunden zahlen 2 % mehr' },
    { id: 'klinik', ic: '🏥', name: 'Spende an die Stadtklinik', cost: 1000000, rep: 90, desc: 'Ruf und Meister-Erfahrung wachsen 5 % schneller' },
    { id: 'tram', ic: '🚋', name: 'Neue Straßenbahnlinie', cost: 2000000, rep: 100, desc: 'Kunden zahlen 2 % mehr und warten 10 % länger' },
    { id: 'stadion', ic: '🏟️', name: 'Stadion', cost: 4000000, rep: 100, desc: 'Ein Auftrag mehr gleichzeitig und Kunden zahlen 3 % mehr' },
    { id: 'denkmal', ic: '🗽', name: 'Denkmal mit deinem Namen', cost: 8000000, rep: 100, desc: 'Titel „Stadtlegende“ und 10 Marken' }
  ];
  const projOn = id => !!(G && G.lg && G.lg.proj[id]);
  const projPrice = () => 1 + (projOn('markt') ? 0.02 : 0) + (projOn('tram') ? 0.02 : 0) + (projOn('stadion') ? 0.03 : 0);
  const projWait = () => 1 + (projOn('licht') ? 0.1 : 0) + (projOn('tram') ? 0.1 : 0);
  const projOrders = () => (projOn('skate') ? 1 : 0) + (projOn('stadion') ? 1 : 0);
  const projRep = () => projOn('klinik') ? 1.05 : 1;
  function projBuy(id) {
    const p = PROJ.find(x => x.id === id), L = LG(); if (!p || L.proj[id] || G.rep < p.rep || !canPay(p.cost)) return false;
    payCost(p.cost); L.proj[id] = 1;
    if (id === 'denkmal') { const k = KR(); if (!k.titles.includes('Stadtlegende')) k.titles.push('Stadtlegende'); k.title = 'Stadtlegende'; mkAdd(10, 'Denkmal'); }
    sfx.buy(); msg(p.ic + ' ' + p.name + ' finanziert! ' + p.desc + '.', false, 'ok'); save(); return true;
  }
  function renderProj(b) {
    uiInfo(b, 'Steck dein Geld in die Stadt. Jedes Projekt gibt dir einen kleinen Vorteil für immer, auch nach einem Prestige.');
    for (const p of PROJ) {
      const own = projOn(p.id), lock = G.rep < p.rep, c = krCard(b, p.ic + ' ' + p.name + (own ? ' <span style="color:var(--green);font-weight:700">· finanziert</span>' : ''), own ? '' : fmt(p.cost), p.desc + payHint(p.cost) + (lock && !own ? '<br><b style="color:var(--amber)">Ab Ruf ' + p.rep + '</b>' : ''));
      if (!own) { const bt = uiEl('button', 'buy', lock ? 'Ab Ruf ' + p.rep : 'Finanzieren'); bt.disabled = lock || !canPay(p.cost); bt.addEventListener('click', () => { if (projBuy(p.id)) renderPhone(); }); c.appendChild(bt); }
    }
  }
  function renderWoche(b) {
    const L = LG(); if (L.wk !== weekNo()) lgRoll(weekNo());
    const left = (() => { const now = Date.now(), d = new Date(now), dd = (8 - (d.getDay() || 7)) % 7, end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (dd || 7)); const h = Math.max(0, Math.round((end - now) / 3600000)); return h >= 48 ? Math.round(h / 24) + ' Tage' : h + ' Std.'; })();
    krGrp(b, 'Wochenziele');
    uiInfo(b, 'Jede Woche (ab Montag) gibt es drei neue Ziele. Jedes bringt ' + fmt(lgGoalCash()) + ' und 2 Marken, alle drei zusammen noch 3 Marken extra. Neue Ziele in ' + left + '.');
    for (const g of L.g) { const D = LG_GOAL[g.k], p = lgProg(g), c = krCard(b, D.ic + ' ' + D.t(g.n), g.d ? '✓ geschafft' : (g.k === 'earn' ? fmt(p) + ' / ' + fmt(g.n) : p + ' / ' + g.n), ''); if (!g.d) krBar(c, p / g.n); else c.classList.add('done'); }
    krGrp(b, 'Meisterstufe');
    const mc = krCard(b, '🏅 Meister ' + L.ml, G.rep >= REP_MAX ? 'nächste Stufe' : 'ab Ruf ' + REP_MAX, G.rep >= REP_MAX ? 'Dein Ruf ist voll. Ab jetzt wird jeder Ruf zu Meister-Erfahrung. Jede Meisterstufe bringt 1 Marke.' : 'Sobald dein Ruf bei ' + REP_MAX + ' ist, sammelst du Meister-Erfahrung weiter. Jede Meisterstufe bringt 1 Marke.');
    if (G.rep >= REP_MAX) krBar(mc, L.mx / mlNeed(L.ml));
    krGrp(b, 'Sammler-Laden · 🎟️ ' + L.mk + ' Marken');
    for (const it of MK_SHOP) {
      const w = it.w ? WEAR_BY[it.w] : null, own = !!L.bw[it.id], c = krCard(b, (w ? '✨ ' + w.name : '🏷️ ' + it.name) + (own ? ' <span style="color:var(--green);font-weight:700">· deins</span>' : ''), own ? '' : '🎟️ ' + it.mk, w ? w.desc + ' (Aura, unter Style → Effekte anlegen)' : it.desc);
      if (!own) { const bt = uiEl('button', 'buy pres', 'Für ' + it.mk + ' Marken'); bt.disabled = L.mk < it.mk; bt.addEventListener('click', () => { if (mkBuy(it.id)) renderPhone(); }); c.appendChild(bt); }
    }
    uiInfo(b, 'Marken bekommst du nur durch Wochenziele, Meisterstufen und Stadtprojekte. Sie bleiben auch nach einem Prestige.');
  }
  // Bestenliste (Firestore board/<uid>), nur mit Konto. Markierte Spielstaende werden nicht eingetragen.
  let boardT = 0, boardList = null, boardErr = '', boardBusy = false, boardSel = 'woche';
  const boardRow = () => ({ g: gTag(), n: acc.name, r: G.rep, p: presLv(), m: LG().ml, e: Math.round(G.earned), wk: weekNo(), wd: Math.max(0, G.stat.del - (LG().wk === weekNo() ? LG().wd0 : G.stat.del)), t: Date.now() });
  async function boardPut(force) {
    if (STU.on || !fbOk() || !accOn() || !G || (G.flag && G.flag.n) || (!force && Date.now() - boardT < 180000)) return false; boardT = Date.now();
    try { const t = await accToken(), o = boardRow(), f = {}; for (const [k, v] of Object.entries(o)) f[k] = typeof v === 'string' ? { stringValue: v } : { integerValue: String(Math.floor(v)) };
      const r = await fetch(fsBase() + 'board/' + acc.uid, { method: 'PATCH', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: f }) }); return r.ok; } catch (e) { return false; }
  }
  async function boardLoad() {
    boardBusy = true; boardErr = '';
    try { await boardPut(true); const t = await accToken(), r = await fetch(fsBase() + 'board?pageSize=300', { headers: { Authorization: 'Bearer ' + t } }); if (!r.ok) throw new Error('Bestenliste gerade nicht lesbar (' + r.status + ').');
      const j = await r.json(); boardList = (j.documents || []).map(d => { const f = d.fields || {}, g = k => +((f[k] && (f[k].integerValue || f[k].doubleValue)) || 0); return { uid: d.name.split('/').pop(), g: (f.g && f.g.stringValue) || '', n: (f.n && f.n.stringValue) || '?', r: g('r'), p: g('p'), m: g('m'), e: g('e'), wk: g('wk'), wd: g('wd'), t: g('t') }; });
    } catch (e) { boardErr = e.message || 'Fehler'; }
    boardBusy = false; if (phoneOpen && tab === 'liste') renderPhone();
  }
  function boardSorted(sel) { const wk = weekNo(), L = (boardList || []).slice(); if (sel === 'woche') return L.filter(x => x.wk === wk && x.wd > 0).sort((a, b) => b.wd - a.wd); if (sel === 'umsatz') return L.sort((a, b) => b.e - a.e); return L.sort((a, b) => (b.p - a.p) || (b.r - a.r) || (b.m - a.m)); }
  function renderListe(b) {
    if (!fbOk() || !accOn()) { uiInfo(b, 'Die Bestenliste gibt es nur mit Konto. Melde dich unter Einstellungen → Profil an.'); return; }
    if (!boardList && !boardBusy && !boardErr) boardLoad();
    const seg = uiEl('div', 'tmseg'); [['woche', 'Diese Woche'], ['rang', 'Rang'], ['umsatz', 'Umsatz']].forEach(([k, t]) => { const c = uiEl('button', 'tmsg' + (boardSel === k ? ' on' : ''), t); c.addEventListener('click', () => { boardSel = k; renderPhone(); }); seg.appendChild(c); }); b.appendChild(seg);
    uiInfo(b, boardSel === 'woche' ? 'Wer hat diese Woche die meisten Kunden beliefert? Montag geht es von vorn los.' : boardSel === 'umsatz' ? 'Umsatz im aktuellen Durchgang (seit dem letzten Prestige).' : 'Sortiert nach Prestige, dann Ruf, dann Meisterstufe.');
    if (boardBusy) { b.appendChild(uiEl('div', 'empty', 'Lade Bestenliste …')); return; }
    if (boardErr) { b.appendChild(uiEl('div', 'empty', boardErr)); }
    const L = boardSorted(boardSel).slice(0, 50); if (!L.length && !boardErr) b.appendChild(uiEl('div', 'empty', boardSel === 'woche' ? 'Diese Woche hat noch niemand geliefert. Sei der Erste!' : 'Noch niemand eingetragen.'));
    L.forEach((x, i) => { const me = x.uid === acc.uid, c = uiEl('div', 'card lb' + (me ? ' me' : '')); c.style.gridTemplateColumns = '34px 1fr auto';
      c.appendChild(uiEl('div', 'lbn', i < 3 ? ['🥇', '🥈', '🥉'][i] : String(i + 1))); const nm = uiEl('div', 'nm', (x.p ? '✦' + x.p + ' ' : '') + (x.g ? '[' + x.g + '] ' : '') + x.n + (me ? ' (du)' : '')); c.appendChild(nm);
      c.appendChild(uiEl('div', 'pr', boardSel === 'woche' ? x.wd + ' Lief.' : boardSel === 'umsatz' ? fmt(x.e) : 'Ruf ' + x.r + (x.m ? ' · M' + x.m : ''))); b.appendChild(c); });
    const rl = uiEl('button', 'buy alt', '⟳ Aktualisieren'); rl.style.marginTop = '8px'; rl.addEventListener('click', () => { boardList = null; boardLoad(); renderPhone(); }); b.appendChild(rl);
  }
