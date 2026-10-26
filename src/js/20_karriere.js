  // ---------- Rufstufen ----------
  // v88: 12 Rufstufen bis Ruf 100. Neue Quests: einfach in CHARS eintragen und mit tier: N einer Stufe zuordnen,
  // die Stufe zeigt die Figur dann automatisch unter "Schaltet frei" an (tierUn). In un stehen nur Extras (Ereignisse, Titel).
  // v112: zehn Kategorien, alle 10 Ruf eine neue (Ruf geht bis 100)
  const TIERS = [
    { id: 'neu', name: 'Neuling', rep: 0, ms: [], rw: {}, un: [] },
    { id: 'nachbar', name: 'Nachbarschaft', rep: 10, ms: [['del', 15, '15 Lieferungen']], rw: { cash: 1000, perk: { tips: 0.02 } }, un: ['Ereignis: Werbeaktion'] },
    { id: 'tipp', name: 'Geheimtipp', rep: 20, ms: [['del', 40, '40 Lieferungen'], ['quests', 1, '1 Questkette abgeschlossen']], rw: { cash: 2500, wear: 'flatcap' }, un: [] },
    { id: 'lokal', name: 'Lokale Größe', rep: 30, ms: [['staff', 2, '2 Helfer im Team'], ['earned', 50000, '50.000 € Umsatz']], rw: { cash: 5000, perk: { price: 0.02 } }, un: ['Ereignis: Großbestellung'] },
    { id: 'auf', name: 'Aufsteiger', rep: 40, ms: [['staff', 4, '4 Helfer im Team'], ['crewlv', 4, 'Ein Helfer auf Level 4'], ['earned', 120000, '120.000 € Umsatz']], rw: { cash: 9000, perk: { tips: 0.02 } }, un: [] },
    { id: 'unternehmer', name: 'Unternehmer', rep: 50, ms: [['quests', 3, '3 Questketten abgeschlossen'], ['vip', 10, '10 Spezialkunden beliefert'], ['earned', 250000, '250.000 € Umsatz']], rw: { cash: 15000, perk: { upkeep: -0.05 }, wear: 'capegold' }, un: ['Stammkunden zahlen mehr'] },
    { id: 'stadt', name: 'Stadtbekannt', rep: 60, ms: [['quests', 5, '5 Questketten abgeschlossen'], ['vip', 20, '20 Spezialkunden beliefert'], ['earned', 450000, '450.000 € Umsatz']], rw: { cash: 25000, perk: { price: 0.03, vip: 0.02 } }, un: [] },
    { id: 'netz', name: 'Netzwerker', rep: 70, ms: [['staff', 6, '6 Helfer im Team'], ['crewlv', 6, 'Ein Helfer auf Level 6'], ['earned', 700000, '700.000 € Umsatz']], rw: { cash: 40000, perk: { vip: 0.02, upkeep: -0.05 }, cos: 'halo' }, un: [] },
    { id: 'gross', name: 'Großunternehmer', rep: 80, ms: [['quests', 7, '7 Questketten abgeschlossen'], ['staff', 8, '8 Helfer im Team'], ['earned', 1000000, '1.000.000 € Umsatz']], rw: { cash: 60000, perk: { price: 0.03 } }, un: [] },
    { id: 'szene', name: 'Szenegröße', rep: 90, ms: [['quests', 9, '9 Questketten abgeschlossen'], ['crewlv', 7, 'Ein Helfer auf Level 7'], ['earned', 1400000, '1.400.000 € Umsatz']], rw: { cash: 90000, perk: { tips: 0.02, price: 0.02 } }, un: [] },
    { id: 'legende', name: 'Branchenlegende', rep: 100, ms: [['quests', 11, '11 Questketten abgeschlossen'], ['crewlv', 8, 'Ein Helfer auf Level 8'], ['earned', 2000000, '2.000.000 € Umsatz']], rw: { cash: 150000, perk: { price: 0.02, tips: 0.02 }, wear: ['crown', 'legend'] }, un: ['Titel „Branchenlegende“', 'Prestige: von vorn beginnen mit dauerhaften Boni'] }
  ];
  const REP_MAX = 100;
  // v112: Prestige (ab Ruf 100): von vorn, mit dauerhaften Boni je Stufe
  const PRES_MAX = 10;
  const presLv = () => (G && G.prest) || 0;
  const presRep = () => 1 + 0.08 * presLv();
  const presPrice = () => 1 + 0.04 * presLv();
  const presGrow = () => 1 + 0.04 * presLv();
  const TIER_V2 = [0, 5, 10, 18, 25, 35, 45, 55, 65, 75, 88, 100]; // v112: Ruf-Schwellen der alten 12 Stufen (v88 bis v111)
  const TIER_OLD = [0, 1, 3, 5, 7, 9, 12]; // v88: alte Stufe (1..6, Spielstaende vor v88) -> neue Stufe
  const tierNo = id => TIERS.findIndex(t => t.id === id) + 1;
  const tierUn = i => CHARS.filter(c => c.tier === i + 1).map(c => c.name + ' ' + c.where).concat(TIERS[i].un);
  const krLv = () => 1 + 5 * TIERS[KR().tier - 1].rep / 100; // 1..6 wie die alten Stufen, fuer Betraege und Grenzen
  const PERK_CAP = { zins: 0.008, tips: 0.15, price: 0.15, vip: 0.08, upkeep: -0.25, hehler: 0.08, calm: 0.3, grow: 0.06, ord: 0.08, brau: 0.1 };
  const PERK_NAME = { zins: 'Sparzins', tips: 'Trinkgeld', price: 'Verkaufspreis', vip: 'Spezialkunden zahlen', upkeep: 'Unterhalt', hehler: 'Hehler-Kurs', calm: 'weniger Gang-Ärger', grow: 'Wachstum', ord: 'Bestellungen', brau: 'Laborpreis' };
  function krDef() { return { v: 3, tier: 1, rd: { d: 0, n: 0 }, q: {}, crew: [], cid: 0, perk: {}, titles: [], title: '', ev: null, evNext: -1, evLog: [], evN: 0, col: {}, troph: {}, cnt: { hv: 0, hs: 0, ev: 0 }, trk: '', sk: -1, freeT: 0 }; }
  function cleanKr(o) {
    const k = krDef(); if (!o || typeof o !== 'object') return k;
    const num = (v, d, a, b) => { const n = +v; return Number.isFinite(n) ? clamp(n, a, b) : d; };
    let ot = Math.floor(num(o.tier, 1, 1, 12)); if (!(+o.v >= 2)) ot = TIER_OLD[Math.floor(num(o.tier, 1, 1, 6))]; // v88: alte Stufen umrechnen
    k.tier = +o.v >= 3 ? Math.min(ot, TIERS.length) : Math.min(TIERS.length, Math.floor(TIER_V2[ot - 1] / 10) + 1); // v112: 12 alte Stufen -> 11 Kategorien
    if (o.rd && typeof o.rd === 'object') k.rd = { d: Math.floor(num(o.rd.d, 0, 0, 1e7)), n: num(o.rd.n, 0, 0, 1e4) };
    if (o.q && typeof o.q === 'object') for (const c of CHARS) { const q = o.q[c.id]; if (!q || typeof q !== 'object') continue; k.q[c.id] = { s: Math.floor(num(q.s, 0, 0, c.steps.length)), b: num(q.b, 0, -1e12, 1e12), seen: Math.floor(num(q.seen, -1, -1, 99)), aff: num(q.aff, 0, 0, 100), next: num(q.next, 0, 0, 1e9), n: Math.floor(num(q.n, 0, 0, 1e6)), ch: q.ch && typeof q.ch === 'object' ? Object.fromEntries(Object.entries(q.ch).filter(([a, b]) => /^[a-z0-9]{1,12}$/.test(a) && /^[a-z0-9]{1,12}$/.test(String(b))).slice(0, 12)) : {} }; }
    if (Array.isArray(o.crew)) for (const m of o.crew.slice(0, 80)) { if (!m || !ROLES[m.r]) continue; k.crew.push({ id: Math.floor(num(m.id, 0, 0, 1e9)), n: String(m.n || 'Helfer').slice(0, 16), r: m.r, lv: Math.floor(num(m.lv, 1, 1, CREW_MAX)), xp: num(m.xp, 0, 0, 1e7), sp: Math.floor(num(m.sp, 0, 0, 50)), te: Math.floor(num(m.te, 0, 0, 5)), ge: Math.floor(num(m.ge, 0, 0, 5)), sx: SPECS[m.sx] ? m.sx : '', ta: TALENTS[m.ta] ? m.ta : 'flink', tr: Math.floor(num(m.tr, 0, 0, 1e7)), off: num(m.off, 0, 0, 1e9) }); }
    k.cid = Math.max(Math.floor(num(o.cid, 0, 0, 1e9)), ...k.crew.map(m => m.id), 0);
    if (o.perk && typeof o.perk === 'object') for (const p of Object.keys(PERK_CAP)) { const c = PERK_CAP[p]; const v = num(o.perk[p], 0, Math.min(0, c), Math.max(0, c)); if (v) k.perk[p] = v; }
    if (Array.isArray(o.titles)) k.titles = o.titles.filter(t => typeof t === 'string' && t.length < 40).slice(0, 40);
    k.title = typeof o.title === 'string' && k.titles.includes(o.title) ? o.title : '';
    if (o.ev && typeof o.ev === 'object' && EVENTS[o.ev.id]) k.ev = { id: o.ev.id, end: num(o.ev.end, 0, 0, 1e9), st: num(o.ev.st, 0, 0, 1e9), ch: typeof o.ev.ch === 'string' ? o.ev.ch.slice(0, 12) : '', n: Math.floor(num(o.ev.n, 0, 0, 1e6)), b: num(o.ev.b, 0, -1e12, 1e12), oid: Math.floor(num(o.ev.oid, -1, -1, 1e9)), cid: Math.floor(num(o.ev.cid, -1, -1, 1e9)), done: o.ev.done === 1 ? 1 : 0 };
    k.evNext = num(o.evNext, -1, -1, 1e9); k.evN = Math.floor(num(o.evN, 0, 0, 1e7));
    if (Array.isArray(o.evLog)) k.evLog = o.evLog.filter(x => typeof x === 'string' && EVENTS[x]).slice(-6);
    if (o.col && typeof o.col === 'object') for (const [a, b] of Object.entries(o.col)) if (/^\d{1,4}-[0-3]$/.test(a)) k.col[a] = Math.floor(num(b, 0, 0, 255));
    if (o.troph && typeof o.troph === 'object') for (const s of SEASONS) k.troph[s.id] = Math.floor(num(o.troph[s.id], 0, 0, 999));
    if (o.cnt && typeof o.cnt === 'object') for (const c of Object.keys(k.cnt)) k.cnt[c] = Math.floor(num(o.cnt[c], 0, 0, 1e9));
    k.trk = typeof o.trk === 'string' && CHAR_BY[o.trk] ? o.trk : ''; k.freeT = num(o.freeT, 0, 0, 1e9); k.sk = Math.floor(num(o.sk, -1, -1, 1e7));
    return k;
  }
  const KR = () => { if (!G.kr) G.kr = krDef(); return G.kr; };
  const krPerk = p => KR_NEUTRAL || !G ? 0 : (KR().perk[p] || 0);
  function addPerk(p, v) { const k = KR(), c = PERK_CAP[p]; if (c === undefined) return; k.perk[p] = c < 0 ? Math.max(c, (k.perk[p] || 0) + v) : Math.min(c, (k.perk[p] || 0) + v); }
  // ---------- Modifikatoren (Jahreszeit, Ereignis, Boni) ----------
  const evMod = key => { if (KR_NEUTRAL || !G) return 1; const cm = calMod(key); if (!G.kr || !G.kr.ev) return cm; const e = EVENTS[G.kr.ev.id]; const m = e && e.mod && e.mod(G.kr.ev); return cm * (m && m[key] !== undefined ? m[key] : 1); }; // v155: echte Kalender-Events wirken mit
  const seaMod = key => KR_NEUTRAL || !G ? 1 : (season().fx[key] || 1);
  const krGrow = () => seaMod('grow') * evMod('grow') * (1 + krPerk('grow')) * (KR_NEUTRAL ? 1 : presGrow());
  const krWater = () => seaMod('water') * evMod('water');
  const krSeed = () => KR_NEUTRAL || !G ? 1 : (G.kr && G.kr.freeT > absMin() ? 0 : seaMod('seed') * evMod('seed'));
  const krOrd = () => seaMod('orders') * evMod('orders') * (1 + krPerk('ord'));
  const krUpkeep = () => KR_NEUTRAL ? 1 : seaMod('upkeep') * evMod('upkeep') * (1 + krPerk('upkeep')) * (1 - Math.min(0.15, 0.03 * specSum('orga')));
  const krPrice = (prod, vip) => KR_NEUTRAL ? 1 : seaMod('p_' + prod) * (vip ? seaMod('p_vip') * (1 + krPerk('vip')) : 1) * evMod('price') * (prod === 'brau' ? 1 + krPerk('brau') : 1) * (1 + krPerk('price')) * presPrice() * projPrice() * pgPrice();
  const krTip = () => KR_NEUTRAL ? 1 : (1 + krPerk('tips') + Math.min(0.12, 0.02 * specSum('kunde'))) * ((KR().ev && KR().ev.id === 'stamm' && KR().ev.n > 0) ? 1.3 : 1);
  // Ruf: wiederholte Lieferungen bringen pro Spieltag nur bis zu einer Grenze vollen Ruf, danach deutlich weniger
  function krRepCap(x) {
    if (KR_NEUTRAL || !G || x <= 0) return x; const k = KR();
    if (k.rd.d !== G.day) { k.rd.d = G.day; k.rd.n = 0; }
    const cap = 4 + krLv() * 1.5, f = k.rd.n >= cap ? 0.35 : 1; k.rd.n += x; return x * f;
  }
  function krRepBonus(x) { { const c0 = Math.max(G.repP || 0, G.rep) + x * presRep(); if (x > 0 && c0 > REP_MAX) mstAdd((c0 - REP_MAX) * 0.25); } G.repP = Math.min(REP_MAX, Math.max(G.repP || 0, G.rep) + x * presRep()); G.rep = Math.floor(G.repP + 1e-9); } // Questbelohnung, ohne Tagesgrenze
  // ---------- Mitarbeiter: Erfahrung, Level, Fertigkeiten, Spezialisierungen ----------
  const CREW_MAX = 10;
  const SPECS = {
    prod: { name: 'Produktion', ic: '🌱', desc: 'Gärtner ernten öfter eine Einheit mehr, Packer packen schneller.' },
    log: { name: 'Logistik', ic: '📦', desc: 'Läuft schneller und trägt mehr. Mildert Lieferprobleme bei Ereignissen.' },
    kunde: { name: 'Kundenbetreuung', ic: '🤝', desc: 'Mehr Trinkgeld und längere Pünktlichkeitsbonus-Zeit, bessere Questbelohnungen.' },
    orga: { name: 'Organisation', ic: '📋', desc: 'Eigener Lohn −15 %, senkt den Unterhalt. Seltener Personalengpässe.' }
  };
  const SPEC_FOR = { gardener: ['prod', 'orga'], rack: ['log', 'prod'], packer: ['prod', 'kunde'], runner: ['log', 'orga'] };
  const TALENTS = { flink: { name: 'flink', te: 1 }, sorgfaeltig: { name: 'sorgfältig', ge: 1 }, gesellig: { name: 'gesellig', sp: 'kunde' }, ordentlich: { name: 'ordentlich', sp: 'orga' }, kraeftig: { name: 'kräftig', sp: 'log' }, gruen: { name: 'grüner Daumen', sp: 'prod' } };
  const CREW_NAMES = ['Lisa', 'Tom', 'Aylin', 'Ben', 'Mia', 'Can', 'Sophie', 'Luca', 'Nele', 'Jonas', 'Elif', 'Finn', 'Mara', 'Deniz', 'Paul', 'Lea', 'Emre', 'Jule', 'Noah', 'Ida', 'Malik', 'Greta', 'Timo', 'Zoe', 'Ole', 'Selin', 'Jan', 'Ronja', 'Kai', 'Pia'];
  const xpNeed = lv => Math.round(30 * Math.pow(lv, 1.6));
  const specLv = m => m.sx ? Math.floor(m.lv / 3) + (TALENTS[m.ta] && TALENTS[m.ta].sp === m.sx ? 1 : 0) : 0;
  const crewKind = m => ROLES[m.r] ? ROLES[m.r].kind : 'gardener';
  function specSum(sx) { if (!G || !G.kr) return 0; let n = 0; for (const m of G.kr.crew) if (m.sx === sx && G.staff[m.r] > 0) n += specLv(m); return n; }
  const crewMaxLv = () => G && G.kr ? G.kr.crew.reduce((a, m) => Math.max(a, m.lv), 0) : 0;
  const crewWage = m => ROLES[m.r].wage * wageK() * (1 + 0.08 * (m.lv - 1)) * (m.sx === 'orga' ? 0.85 : 1);
  function crewSync() {
    if (!G) return; const k = KR();
    for (const r of Object.keys(ROLES)) {
      const list = k.crew.filter(m => m.r === r), want = G.staff[r] || 0;
      for (let i = list.length; i < want; i++) {
        const used = new Set(k.crew.map(m => m.n)); let n = CREW_NAMES[(k.cid * 7 + i * 3 + r.length) % CREW_NAMES.length]; for (let j = 0; used.has(n) && j < CREW_NAMES.length; j++) n = CREW_NAMES[(k.cid * 7 + i * 3 + r.length + j + 1) % CREW_NAMES.length];
        const tk = Object.keys(TALENTS)[(k.cid * 5 + i + r.length) % 6], ta = TALENTS[tk];
        k.crew.push({ id: ++k.cid, n, r, lv: 1, xp: 0, sp: 0, te: ta.te || 0, ge: ta.ge || 0, sx: '', ta: tk, tr: 0, off: 0 });
      }
      if (list.length > want) { const drop = list.sort((a, b) => a.lv - b.lv || a.xp - b.xp).slice(0, list.length - want).map(m => m.id); k.crew = k.crew.filter(m => !drop.includes(m.id)); }
    }
  }
  function crewAssign() { if (!G) return; crewSync(); const used = new Set(); for (const w of workers) { const m = G.kr.crew.find(x => x.r === w.role && !used.has(x.id)); w.cid = m ? m.id : -1; if (m) used.add(m.id); } }
  const crewOf = w => G && G.kr && w.cid > 0 ? G.kr.crew.find(m => m.id === w.cid) : null;
  const crewSpd = w => { const pz = pizzaOn() ? 1.25 : 1; const m = crewOf(w); if (!m || KR_NEUTRAL) return pz; return pz * ( 1 + 0.05 * m.te + (m.sx === 'log' ? 0.05 * specLv(m) : 0)); };
  const crewDur = w => { const m = crewOf(w); if (!m || KR_NEUTRAL) return 1; return (1 - 0.05 * m.ge) * (m.sx === 'prod' && crewKind(m) === 'packer' ? 1 - 0.06 * specLv(m) : 1); };
  const crewOff = w => { const m = crewOf(w); return !!m && m.off > absMin(); };
  const XP_JOB = { harvest: 3, water: 1, plant: 1, deposit: 2, takedry: 1, dropdry: 1, pack: 2, grab: 1, crate: 2, up: 1, down: 1 };
  function crewXp(w, type) {
    const m = crewOf(w); if (!m || m.lv >= CREW_MAX) return; m.xp += XP_JOB[type] || 0;
    while (m.lv < CREW_MAX && m.xp >= xpNeed(m.lv)) { m.xp -= xpNeed(m.lv); m.lv++; m.sp++; msg('⬆ ' + m.n + ' (' + ROLES[m.r].name + ') ist jetzt Level ' + m.lv + (m.lv === 3 && !m.sx ? ' – Spezialisierung möglich!' : ' – Fertigkeitspunkt verteilen')); sfx.ping(); }
  }
  function crewHarvestBonus(w) { const m = crewOf(w); if (!m || KR_NEUTRAL || m.sx !== 'prod') return 0; return Math.random() < 0.18 * specLv(m) ? 1 : 0; }
  function crewCarryBonus(w) { const m = crewOf(w); return m && m.sx === 'log' && !KR_NEUTRAL ? 5 * specLv(m) : 0; }
  function crewSkill(id, key) { const m = KR().crew.find(x => x.id === id); if (!m || m.sp <= 0 || !['te', 'ge'].includes(key) || m[key] >= 5) return false; m[key]++; m.sp--; sfx.put(); save(); return true; }
  function crewSpec(id, sx) { const m = KR().crew.find(x => x.id === id); if (!m || m.sx || m.lv < 3 || !(SPEC_FOR[crewKind(m)] || []).includes(sx)) return false; m.sx = sx; sfx.buy(); msg(m.n + ' ist jetzt Spezialist(in) für ' + SPECS[sx].name); save(); return true; }
  const trainCost = m => 150 * m.lv + 100;
  function crewTrain(id) { const m = KR().crew.find(x => x.id === id); if (!m || m.lv >= CREW_MAX || m.tr === G.day) return false; const c = trainCost(m); if (G.money < c) return false; G.money -= c; m.tr = G.day; m.xp += Math.ceil(xpNeed(m.lv) * 0.45); const w = workers.find(x => x.cid === id) || { cid: id }; crewXp(w, 'none'); sfx.buy(); save(); return true; }
  const moveTargets = m => Object.keys(ROLES).filter(r => r !== m.r && ROLES[r].kind === crewKind(m) && isOpen(AREAS[ROLES[r].area]) && G.rep >= ROLES[r].rep && G.staff[r] < ROLES[r].max);
  function crewMove(id, to) { const m = KR().crew.find(x => x.id === id); if (!m || !moveTargets(m).includes(to)) return false; G.staff[m.r]--; G.staff[to]++; m.r = to; rebuildWorkers(true); crewAssign(); sfx.put(); msg(m.n + ' arbeitet jetzt als ' + ROLES[to].name); save(); return true; }
  // ---------- Charaktere und Questketten ----------
  // Aufgaben: meet (nur reden), bring (Ware abgeben), del/vip/earn/hv/hs/gb (Zaehler seit Beginn des Abschnitts), drift (Bestwert),
  // crew (Helfer mit Spezialisierung oder Level), up (Ausbaustufe), pay (bezahlen), quests (abgeschlossene Ketten), choice (Entscheidung)
  const LK = (o) => Object.assign({}, DEF_LOOK, o);
  const CHARS = [
    { id: 'hilde', name: 'Oma Hilde', who: 'Rentnerin vom Brunnenplatz', where: 'am Brunnenplatz', x: 1196, y: 1088, tier: 1, look: LK({ r: 160, g: 110, b: 170, top: 'sweater', bot: 'skirt', hair: 5, hs: 3, skin: 0, sex: 'f', shoe: 'stdshoe' }),
      bio: 'Lebt seit 50 Jahren im Viertel, kennt jeden und hat Rücken. Backt für den Bridgeclub.', style: 'herzlich, sagt „Kindchen“',
      steps: [
        { ask: 'Ach, Kindchen, du bist doch der Neue aus dem Keller? Mein Rücken zwickt seit Wochen, und mein Enkel schwört auf dein Kraut. Bringst du mir 2 Beutel?', t: { k: 'bring', prod: 'keller', n: 2 }, done: 'Das tut gut! Du bist ein Schatz.', rw: { rep: 0.5 } },
        { ask: 'Die Damen vom Bridgeclub fragen schon nach dir. Zeig ihnen, dass du zuverlässig bist: Beliefere 10 Kunden.', t: { k: 'del', n: 10 }, done: 'Alle reden nur noch von dir. Hier, für deine Mühe.', rw: { cash: 600, rep: 1 } },
        { ask: 'Mein Garten verwildert. Ich bräuchte einen Gärtner, der schon etwas kann. Hast du einen Gärtner auf Level 3?', t: { k: 'crew', kind: 'gardener', lv: 3 }, done: 'So ein fleißiger junger Mensch! Mein Garten blüht wieder.', rw: { cash: 900, perk: { tips: 0.01 } } },
        { ask: 'Ich backe für den Bridgeclub. Soll ich deine Ernte in Plätzchen verbacken oder lieber Tee draus kochen?', choice: [{ id: 'kekse', l: 'Plätzchen backen', say: 'Die Damen zahlen gut für Plätzchen!', rw: { cash: 1500 } }, { id: 'tee', l: 'Tee kochen', say: 'Tee ist gesund. Ich empfehle dich überall weiter.', rw: { perk: { tips: 0.02 }, rep: 1 } }] },
        { ask: 'Zum 80. Geburtstag kommt die ganze Familie. 6 Beutel, Kindchen, dann bist du für immer mein Lieblingsnachbar.', t: { k: 'bring', prod: 'keller', n: 6 }, done: 'Das schönste Geschenk! Ab jetzt bestelle ich regelmäßig bei dir.', rw: { rep: 2, cash: 1500, title: 'Omas Liebling', cos: 'butterflies' } }
      ] },
    { id: 'lena', name: 'Lena', who: 'Studentin im Uferpark', where: 'im Uferpark am Fluss', x: 1520, y: 1700, tier: 2, look: LK({ r: 90, g: 170, b: 160, top: 'hoodie', bot: 'jeans', hair: 3, hs: 6, skin: 1, sex: 'f', hat: 'beanie' }),
      bio: 'Studiert Biologie im 9. Semester, organisiert Uferpartys und kennt die halbe Uni.', style: 'locker, sagt „voll“ und „safe“',
      steps: [
        { ask: 'Heyy, du bist der mit dem Keller, oder? Prüfungsphase, ich brauch voll was zum Runterkommen. 3 Beutel?', t: { k: 'bring', prod: 'keller', n: 3 }, done: 'Safe, danke! Ich sag es weiter.', rw: { rep: 0.5 } },
        { ask: 'Wir machen heute Nacht eine Uferparty. Bring mir nachts (ab 21 Uhr) 4 Beutel vorbei!', t: { k: 'bring', prod: 'keller', n: 4, night: 1 }, done: 'Die Party war legendär. Alle wollen deine Nummer.', rw: { rep: 1, cash: 400 } },
        { ask: 'Mein Mitbewohner will mit dir in eine Lern-App investieren. 500 € Einsatz, vielleicht kommt was zurück?', choice: [{ id: 'inv', l: 'Investieren (500 €)', cost: 500, say: 'Voll gut! Ich melde mich, wenn es läuft.' }, { id: 'nein', l: 'Lieber nicht', say: 'Verstehe ich, ist eh riskant.' }] },
        { ask: 'Die halbe Uni kennt dich jetzt. Mach 15.000 € Umsatz, dann schmeiß ich eine Party für dich.', t: { k: 'earn', n: 15000 }, done: 'Party für dich! Und die App läuft übrigens …', rw: { cash: 800, rep: 2, title: 'Campus-Held', cos: 'notes', chx: { inv: { cash: 1800 } } } }
      ] },
    { id: 'kalle', name: 'Kalle', who: 'Skater aus dem Skaterpark', where: 'am Südufer an der Südstraße', x: 900, y: 2245, tier: 2, look: LK({ r: 220, g: 80, b: 60, top: 'tshirt', bot: 'cargo', hair: 1, hs: 2, skin: 2, hat: 'snapback', shoe: 'sneaker' }),
      bio: 'Fährt seit er zehn ist, sprüht nachts Graffiti und will einen eigenen Contest aufziehen.', style: 'Slang, sagt „Digga“ und „krass“',
      steps: [
        { ask: 'Yo Digga! Der Park hier ist meins. Ich brauch 2 Beutel für die Session.', t: { k: 'bring', prod: 'keller', n: 2 }, done: 'Krass, gutes Zeug!', rw: { rep: 0.5 } },
        { ask: 'Du fährst Auto? Zeig mir einen Drift mit über 600 Punkten, dann reden wir weiter.', t: { k: 'drift', n: 600 }, done: 'Alter, das war sauber. Respekt.', rw: { cash: 700, rep: 1 } },
        { ask: 'Meine Crew hat Sponsoren mit Kohle. Beliefere 2 Spezialkunden (★), dann stell ich dich vor.', t: { k: 'vip', n: 2 }, done: 'Die Sponsoren feiern dich. Contest ist gebucht!', rw: { cash: 1500, rep: 1 } },
        { ask: 'Contest heute Nacht! Bring 8 Beutel für die Afterparty, aber nachts.', t: { k: 'bring', prod: 'keller', n: 8, night: 1 }, done: 'Beste Afterparty ever. Hier, mein altes Board, das gehört jetzt dir.', rw: { rep: 2, wear: 'skateback', title: 'Skatepark-Legende' } }
      ] },
    { id: 'mehmet', name: 'Mehmet', who: 'Kioskbesitzer', where: 'am Kiosk im Stadtpark', x: 1692, y: 832, tier: 1, look: LK({ r: 70, g: 90, b: 120, top: 'polo', bot: 'jeans', hair: 0, hs: 10, skin: 3, shoe: 'sneaker' }),
      bio: 'Hat den Kiosk vom Onkel übernommen und denkt immer an das nächste Geschäft.', style: 'freundlich, geschäftstüchtig, sagt „Bruder“',
      steps: [
        { ask: 'Salam, Bruder! Mir gehört der Kiosk. Leute fragen nach dir. Wollen wir zusammenarbeiten? Bring mir 3 Beutel als Probe.', t: { k: 'bring', prod: 'keller', n: 3 }, done: 'Qualität stimmt. Wir sind im Geschäft.', rw: { rep: 0.5 } },
        { ask: 'Zeig mir, dass du liefern kannst: 25 Lieferungen an Kunden.', t: { k: 'del', n: 25 }, done: 'Respekt, Bruder. Du bist zuverlässig.', rw: { cash: 1200, rep: 1 } },
        { ask: 'Ich kann ein Schild im Kiosk aufhängen. 1.500 €, dann weiß die ganze Straße Bescheid. Oder wir teilen später den Gewinn.', choice: [{ id: 'schild', l: 'Schild kaufen (1.500 €)', cost: 1500, say: 'Ab morgen hängt es. Mehr Kunden für dich!', rw: { perk: { ord: 0.05 } } }, { id: 'teilen', l: 'Gewinn teilen', say: 'Gut, dann gibt es am Ende eine Beteiligung.' }] },
        { ask: 'Meine Lieferungen kommen ständig zu spät. Hast du jemanden mit Spezialisierung Logistik?', t: { k: 'crew', sx: 'log' }, done: 'Jetzt kommt alles pünktlich. Und bei Lieferproblemen helfe ich dir ab jetzt aus.', rw: { cash: 1500, rep: 1 } },
        { ask: 'Großer Einkauf für den Kiosk: 10 Beutel, Bruder.', t: { k: 'bring', prod: 'keller', n: 10 }, done: 'Partner fürs Leben!', rw: { rep: 2, perk: { price: 0.02 }, title: 'Kiosk-Partner', chx: { teilen: { cash: 4000 } } } }
      ] },
    { id: 'weber', name: 'Dr. Weber', who: 'Ärztin und Apothekerin', where: 'vor ihrer Apotheke an der Nordallee', x: 3088, y: -15, tier: 1, look: LK({ r: 235, g: 238, b: 242, top: 'suit', bot: 'suitpants', hair: 2, hs: 4, skin: 1, sex: 'f', shoe: 'dress' }),
      bio: 'Allgemeinmedizinerin. Seit dem Wasserschaden ist ihre Apotheke an der Nordallee geschlossen. Bis sie wieder öffnen kann, sitzt sie im Stadtpark und raucht billiges Straßengras.', style: 'förmlich, „aus medizinischer Sicht“, gerade etwas verzweifelt',
      steps: [
        { ask: 'Ach … Sie sind der aus dem Keller? Dr. Weber, Apothekerin. Meine Apotheke ist seit dem Wasserschaden zu, und dieses Straßengras hier kratzt fürchterlich. Aus medizinischer Sicht: Bringen Sie mir 4 Beutel. Bitte.', t: { k: 'bring', prod: 'keller', n: 4 }, done: 'Danke. Endlich etwas Anständiges. Meine Patienten werden das auch merken.', rw: { rep: 1 } },
        { ask: 'Meine Patienten brauchen einfühlsame Betreuung. Ich arbeite nur mit Teams, die jemanden mit Spezialisierung Kundenbetreuung haben.', t: { k: 'crew', sx: 'kunde' }, done: 'Ausgezeichnet. So stelle ich mir das vor.', rw: { cash: 2500, rep: 1 } },
        { ask: 'Aus medizinischer Sicht zählt die Qualität. Bitte verbessern Sie Ihr Saatgut im Keller auf Stufe 3.', t: { k: 'up', area: 'keller', key: 'seed', n: 3 }, done: 'Deutlich bessere Qualität. Messbar!', rw: { cash: 3000 } },
        { ask: 'Fünf meiner Privatpatienten möchten beliefert werden (Spezialkunden ★).', t: { k: 'vip', n: 5 }, done: 'Alle Patienten sind zufrieden.', rw: { cash: 4000, rep: 1 } },
        { ask: 'Ich könnte offiziell eine Studie anmelden. Das bringt Ansehen, aber auch Aufmerksamkeit. Oder wir bleiben diskret.', choice: [{ id: 'studie', l: 'Studie anmelden', say: 'Die Fachwelt wird staunen.', rw: { rep: 4, title: 'Medizinischer Lieferant', perk: { vip: 0.03 } } }, { id: 'diskret', l: 'Diskret bleiben', say: 'Vernünftig. Hier ist Ihr Honorar.', rw: { cash: 9000, title: 'Medizinischer Lieferant', perk: { vip: 0.02 } } }] },
        // v89: Apotheke und Premium-Anbau
        { ask: 'Ich will meine Apotheke an der Nordallee wieder aufmachen. Dafür brauche ich Ware in Apothekenqualität. Mieten Sie den Raum hinter dem Lager-Tor im Gewerbegebiet und richten Sie dort einen Premium-Anbau ein.', t: { k: 'own', what: 'pr', txt: 'Premium-Anbau im Mietraum einrichten' }, done: 'Hervorragend! Die Handwerker sind schon da, meine Apotheke öffnet wieder. Sie finden mich ab jetzt dort, Beutel brauche ich keine mehr.', rw: { cash: 5000 } },
        { ask: 'Für die Qualitätsprüfung brauche ich 3 Apotheken-Dosen aus Ihrem Premium-Anbau.', t: { k: 'bring', prod: 'pr', n: 3 }, done: 'Laborwerte einwandfrei! Ab sofort kaufe ich Ihre Dosen jederzeit an der Apotheke.', rw: { rep: 2 } },
        { ask: 'Konstante Qualität ist alles. Bringen Sie Ihren Klima-Trockenschrank auf Stufe 2.', t: { k: 'up', area: 'pr', key: 'rack', n: 2, txt: 'Klima-Trockenschrank Stufe 2' }, done: 'Messbar gleichmäßig. Sehr gut.', rw: { cash: 8000 } },
        { ask: 'Zur großen Eröffnungswoche brauche ich 10 Dosen auf einmal.', t: { k: 'bring', prod: 'pr', n: 10 }, done: 'Die Eröffnung war ein voller Erfolg!', rw: { cash: 20000, rep: 3, title: 'Apothekenlieferant' } }
      ] },
    { id: 'rico', name: 'Rico', who: 'Boss im Gangviertel', where: 'im Gangviertel (Südosten)', x: 4600, y: 2462, tier: 5, req: () => gvOpen(), reqTxt: 'Hehler freigeschaltet (Ruf 20)', look: LK({ r: 30, g: 30, b: 36, top: 'leather', bot: 'jeans', hair: 0, hs: 9, skin: 4, bnd: '#E0243A', shoe: 'sneaker' }),
      bio: 'Kontrolliert das Gangviertel. Spricht wenig, merkt sich alles.', style: 'knapp und hart',
      steps: [
        { ask: 'Du bist also der Keller-Typ. Ich bin Rico. Hier läuft nichts ohne mich. Verkauf dem Hehler 10 Stück. Dann sehen wir weiter.', t: { k: 'hs', n: 10 }, done: 'Gut. Du hältst dich an Regeln.', rw: { rep: 0.5, cash: 500 } },
        { ask: 'Eine Gang macht Stress in meiner Stadt. Verjag eine, die dich angreift.', t: { k: 'gb', n: 1 }, done: 'Nicht schlecht. Die reden jetzt über dich.', rw: { cash: 2000, rep: 1 } },
        { ask: 'Großer Deal. 15 Beutel. Heute noch.', t: { k: 'bring', prod: 'keller', n: 15 }, done: 'Sauber. So läuft Geschäft.', rw: { rep: 1 } },
        { ask: 'Entscheide dich. Du arbeitest für uns, dann zahlt dir der Hehler mehr. Oder du bleibst unabhängig, und wir lassen dich in Ruhe.', choice: [{ id: 'gang', l: 'Für die Gangs', say: 'Willkommen in der Familie.', rw: { perk: { hehler: 0.06 }, title: 'Ehrenmitglied', wear: 'capeleaf' } }, { id: 'frei', l: 'Unabhängig bleiben', say: 'Respekt. Keiner fasst dich an.', rw: { perk: { calm: 0.3 }, title: 'Einzelgänger', wear: 'capeleaf' } }] }
      ] },
    { id: 'bruno', name: 'Dr. Brandt', who: 'Laborleiter im Ruhestand', where: 'vor dem Chemielabor', x: 2232, y: 692, tier: 5, req: () => G.b.unlocked, reqTxt: 'Chemielabor gekauft', look: LK({ r: 232, g: 236, b: 240, top: 'trench', bot: 'suitpants', hair: 4, hs: 9, skin: 0 }),
      bio: 'Hat 40 Jahre ein Forschungslabor geleitet und vermisst das Blubbern der Kolben. Sammelt funkelnde Kristalle für seine Vitrine.', style: 'freundlich, „Faszinierend!“',
      steps: [
        { ask: 'Guten Tag! Dr. Brandt, früher Laborleiter. Dein Labor sieht ordentlich aus. Bring mir 5 Kristallboxen für meine Sammlung.', t: { k: 'bring', prod: 'brau', n: 5 }, done: 'Faszinierend, wie das funkelt!', rw: { rep: 1, cash: 1500 } },
        { ask: 'Ein gutes Labor braucht einen Produktionsprofi. Hast du jemanden mit Spezialisierung Produktion?', t: { k: 'crew', sx: 'prod' }, done: 'Sehr gut, jetzt läuft die Sache.', rw: { cash: 3000 } },
        { ask: 'Das Stadtmuseum plant eine Kristall-Ausstellung und braucht 12 Boxen. Schaffst du das?', t: { k: 'bring', prod: 'brau', n: 12 }, done: 'Die Vitrinen glitzern. Ganz Kellergrün staunt!', rw: { rep: 2, cash: 4000 } },
        { ask: 'Ich verrate dir eine meiner Fantasie-Formeln. Welche möchtest du?', choice: [{ id: 'hell', l: 'Formel Himmelblau', say: 'Himmelblau mögen die Kunden am liebsten.', rw: { perk: { brau: 0.08 }, title: 'Laborleiter' } }, { id: 'dunkel', l: 'Formel Goldglanz', say: 'Für Sammler. Die zahlen sofort.', rw: { cash: 12000, title: 'Laborleiter' } }] }
      ] },
    { id: 'kaiser', name: 'Frau Kaiser', who: 'Stadträtin', where: 'am Nordring im Nordviertel', x: 3900, y: -765, tier: 7, look: LK({ r: 40, g: 50, b: 90, top: 'trench', bot: 'suitpants', hair: 1, hs: 5, skin: 1, sex: 'f', shoe: 'heels' }),
      bio: 'Sitzt im Stadtrat und denkt laut über eine Legalisierung nach. Vorsichtig, aber ehrgeizig.', style: 'diplomatisch, siezt',
      steps: [
        { ask: 'Frau Kaiser, Stadtrat. Inoffiziell: Die Stadt denkt über eine Legalisierung nach. Ich brauche Zahlen. Machen Sie 100.000 € Umsatz.', t: { k: 'earn', n: 100000 }, done: 'Beeindruckend. Das überzeugt den Ausschuss.', rw: { rep: 2 } },
        { ask: 'Die Bürger müssen Ihnen vertrauen. Schließen Sie Questketten mit 4 Menschen der Stadt ab.', t: { k: 'quests', n: 4 }, done: 'Man spricht gut über Sie, überall.', rw: { cash: 10000, rep: 2 } },
        { ask: 'Für den Antrag brauche ich Unterstützung. Eine Spende für die Jugendarbeit, oder Sie helfen persönlich.', choice: [{ id: 'spende', l: 'Spenden (20.000 €)', cost: 20000, say: 'Großzügig. Das vergisst niemand.', rw: { rep: 4 } }, { id: 'helfen', l: 'Persönlich helfen', say: 'Dann zeigen Sie es bei der nächsten Aufgabe.', rw: { rep: 1 } }] },
        { ask: 'Letzter Schritt: Eine Vorführung für den Ausschuss. 20 Beutel, beste Qualität.', t: { k: 'bring', prod: 'keller', n: 20 }, done: 'Der Antrag ist durch! Sie haben Geschichte geschrieben.', rw: { cash: 25000, rep: 3, perk: { price: 0.03 }, title: 'Stadtbekannte Größe' } }
      ] },
    // Saisonale Charaktere: nur in ihrer Jahreszeit da. Unterbrochene Ketten laufen in der naechsten passenden Jahreszeit weiter.
    { id: 'flora', name: 'Gärtnerin Flora', who: 'Gärtnerin', where: 'in ihrem Blumengarten im Norden', x: 1300, y: 215, tier: 1, sea: 0, look: LK({ r: 120, g: 190, b: 90, top: 'tshirt', bot: 'cargo', hair: 3, hs: 7, skin: 1, sex: 'f', hat: 'flowercrown', shoe: 'wellies' }),
      bio: 'Gärtnert im Frühling von früh bis spät und redet mit ihren Pflanzen.', style: 'fröhlich, voller Ausrufezeichen',
      steps: [
        { ask: 'Frühling! Alles blüht! Ich bin Flora. Lass uns gemeinsam ernten: 12 Ernten, egal ob du oder dein Team!', t: { k: 'hv', n: 12 }, done: 'Wunderbar! Die Erde liebt dich!', rw: { cash: 800, rep: 0.5 } },
        { ask: 'Für das Frühlingsfest im Blumengarten brauche ich 4 Beutel!', t: { k: 'bring', prod: 'keller', n: 4 }, done: 'Das Fest ist gerettet!', rw: { cash: 600 } },
        { ask: 'Ein guter Gärtner im Team ist Gold wert! Bring einen Gärtner auf Level 2 mit.', t: { k: 'crew', kind: 'gardener', lv: 2 }, done: 'Hier, mein Blumenkranz für dich! Und dein Keller wächst jetzt ein bisschen schneller.', rw: { wear: 'flowercrown', cos: 'petals', perk: { grow: 0.03 }, title: 'Frühlingskind' } }
      ] },
    { id: 'jonas', name: 'DJ Jonas', who: 'Festival-DJ', where: 'an der Hauptstraße westlich vom Keller', x: 200, y: 713, tier: 1, sea: 1, look: LK({ r: 255, g: 200, b: 60, top: 'hawaii', bot: 'shorts', hair: 1, hs: 2, skin: 3, hat: 'headphones', shoe: 'slides' }),
      bio: 'Legt jeden Sommer beim Uferfestival auf und kennt jede Bühne der Stadt.', style: 'laut und gut gelaunt',
      steps: [
        { ask: 'Sommer, Sonne, Bässe! Ich brauch Vorrat fürs Festival: 5 Beutel!', t: { k: 'bring', prod: 'keller', n: 5 }, done: 'Der Sound wird fett!', rw: { cash: 900 } },
        { ask: 'Die Nachtbühne startet! 8 Beutel, nachts vorbeibringen!', t: { k: 'bring', prod: 'keller', n: 8, night: 1 }, done: 'Die Menge tobt!', rw: { rep: 1, cash: 1200 } },
        { ask: 'VIP-Bereich! Beliefere 2 Spezialkunden (★) für die Backstage-Gäste.', t: { k: 'vip', n: 2 }, done: 'Du bist offiziell Teil der Crew! Nimm das Hemd, das passt zu dir.', rw: { wear: 'hawaii', cos: 'fireflies', rep: 1, title: 'Festival-Lieferant' } }
      ] },
    { id: 'heinz', name: 'Bauer Heinz', who: 'Bauer aus dem Umland', where: 'auf dem Feldweg hinter der Lindenstraße', x: 330, y: 1015, tier: 1, sea: 2, look: LK({ r: 150, g: 90, b: 50, top: 'flannel', bot: 'jeans', hair: 4, hs: 9, skin: 2, hat: 'cowboy', shoe: 'wellies' }),
      bio: 'Fährt jeden Herbst mit dem Trecker in die Stadt zum Erntefest.', style: 'wortkarg, „Moin“',
      steps: [
        { ask: 'Moin. Erntezeit. 20 Ernten, dann reden wir.', t: { k: 'hv', n: 20 }, done: 'Ordentlich. Gefällt mir.', rw: { cash: 1200 } },
        { ask: 'Fürs Erntefest: 6 Beutel.', t: { k: 'bring', prod: 'keller', n: 6 }, done: 'Passt.', rw: { cash: 900, rep: 1 } },
        { ask: 'Das Erntefest braucht Unterstützung. Spendest du oder packst du mit an?', choice: [{ id: 'spende', l: 'Spenden (2.000 €)', cost: 2000, say: 'Moin. Das merk ich mir.', rw: { rep: 3, wear: 'flannel', cos: 'leaves', title: 'Erntehelfer' } }, { id: 'hand', l: 'Mit anpacken', say: 'Kräftig bist du. Hier, für dich.', rw: { cash: 3000, wear: 'flannel', cos: 'leaves', title: 'Erntehelfer' } }] }
      ] },
    { id: 'klaus', name: 'Klaus', who: 'Weihnachtsmarkt-Händler', where: 'am Marktstand am Brunnen', x: 1458, y: 1208, tier: 1, sea: 3, look: LK({ r: 200, g: 40, b: 40, top: 'xmas', bot: 'jeans', hair: 5, hs: 0, skin: 0, hat: 'santa', shoe: 'stdshoe' }),
      bio: 'Verkauft im Winter Glühwein und kleine Geschenke. Nennt alle „mein Wichtel“.', style: '„Ho ho ho“',
      steps: [
        { ask: 'Ho ho ho! Mein Wichtel, ich brauche 3 Beutel für meinen Glühwein-Geheimvorrat!', t: { k: 'bring', prod: 'keller', n: 3 }, done: 'Ho ho! Das wärmt!', rw: { cash: 700 } },
        { ask: 'Die Geschenke müssen raus! 15 Lieferungen an Kunden, mein Wichtel!', t: { k: 'del', n: 15 }, done: 'Alle Geschenke angekommen!', rw: { cash: 1500, rep: 1 } },
        { ask: 'Heiligabend! 10 Beutel für die große Feier!', t: { k: 'bring', prod: 'keller', n: 10 }, done: 'Frohe Weihnachten, mein Wichtel! Hier, dein Geschenk.', rw: { wear: 'santa', cos: 'snow', rep: 2, title: 'Wichtel des Jahres' } }
      ] },
    // v94: vier neue Auftraggeber an den neuen Gebaeuden
    { id: 'tarik', name: 'Tarik', who: 'Trainer im Iron Gym', where: 'vor dem Iron Gym in Südost (Parkstraße)', x: 2448, y: 1466, tier: 6, look: LK({ r: 230, g: 70, b: 60, top: 'tank', bot: 'sports', hair: 0, hs: 2, skin: 2, shoe: 'sneaker', hat: 'headband' }),
      bio: 'Ex-Kickboxer, hat sich mit dem Iron Gym einen Traum erfüllt. Trainiert jeden, der Biss hat.', style: 'motivierend, sagt „Bro“ und „Let’s go“',
      steps: [
        { ask: 'Yo, ich bin Tarik, mir gehört das Iron Gym. Meine Jungs brauchen nach dem Training was zum Runterkommen. 5 Beutel, Bro?', t: { k: 'bring', prod: 'keller', n: 5 }, done: 'Let’s go! Die Jungs feiern dich.', rw: { cash: 1500, rep: 1 } },
        { ask: 'Wer bei mir mitreden will, muss selber schwitzen. Mach 3 Trainings im Gym.', t: { k: 'gym', n: 3 }, done: 'Respekt, du ziehst durch!', rw: { cash: 2500 } },
        { ask: 'Ich bring einen Protein-Shake raus. Steigst du mit 5.000 € ein, oder machst du lieber Werbung im Viertel?', choice: [{ id: 'shake', l: 'Einsteigen (5.000 €)', cost: 5000, say: 'Der Kellergrün-Shake ist ausverkauft, Bro!', rw: { perk: { tips: 0.02 } } }, { id: 'werbung', l: 'Werbung machen', say: 'Alle reden vom Gym und von dir.', rw: { rep: 2 } }] },
        { ask: 'Am Wochenende ist Turnier. Damit die Halle voll wird: beliefere 30 Kunden.', t: { k: 'del', n: 30 }, done: 'Ausverkauft! Beste Stimmung ever.', rw: { cash: 4000, rep: 1 } },
        { ask: 'Die Siegerfeier steigt heute Nacht. 12 Beutel, nachts, let’s go!', t: { k: 'bring', prod: 'keller', n: 12, night: 1 }, done: 'Champion! Du trainierst ab jetzt umsonst mit uns … naja, fast.', rw: { cash: 6000, rep: 2, perk: { price: 0.02 }, title: 'Muskelpaket' } }
      ] },
    { id: 'giulia', name: 'Giulia', who: 'Chefin der Pizzeria Bella Notte', where: 'an der Hauptstraße bei der Pizzeria', x: 1110, y: 713, tier: 8, look: LK({ r: 200, g: 40, b: 50, top: 'stripe', bot: 'skirt', hair: 6, hs: 7, skin: 1, sex: 'f', shoe: 'stdshoe', hat: 'chef' }),
      bio: 'Kam aus Neapel, backt nachts die beste Pizza der Stadt und hat ein Herz für hungrige Nachtschwärmer.', style: 'herzlich, sagt „Mamma mia“ und „per favore“',
      steps: [
        { ask: 'Buonasera! Ich bin Giulia. Meine Gäste nachts haben immer großen Hunger … und fragen nach dir. 8 Beutel, per favore.', t: { k: 'bring', prod: 'keller', n: 8 }, done: 'Mamma mia, die Gäste sind glücklich!', rw: { cash: 3000, rep: 1 } },
        { ask: 'Dein Team arbeitet so hart. Bestell 3 Pizzen fürs Team bei mir, dann reden wir weiter.', t: { k: 'pizza', n: 3 }, done: 'Satte Helfer sind fleißige Helfer!', rw: { cash: 3500 } },
        { ask: 'Ein Lieferdienst will mit mir arbeiten. Hast du jemanden mit Spezialisierung Logistik?', t: { k: 'crew', sx: 'log' }, done: 'Perfetto! Jetzt kommt alles pünktlich.', rw: { cash: 6000, rep: 1 } },
        { ask: 'Neue Spezialpizza: mit frischen Kräutern oder ganz klassisch?', choice: [{ id: 'kraut', l: 'Mit Kräutern', say: 'Die Leute stehen bis zur Straße Schlange!', rw: { cash: 8000 } }, { id: 'klassik', l: 'Klassisch', say: 'Elegante Wahl. Die Stammgäste bestellen jetzt öfter.', rw: { perk: { ord: 0.02 } } }] },
        { ask: 'Mach noch 100.000 € Umsatz, dann feiern wir eine Notte bianca für dich!', t: { k: 'earn', n: 100000 }, done: 'Was für eine Nacht! Du gehörst zur Familie.', rw: { cash: 12000, rep: 2, title: 'Pizza-Partner' } }
      ] },
    { id: 'albrecht', name: 'Herr Albrecht', who: 'Direktor der Stadtsparkasse', where: 'vor der Stadtsparkasse an der Nordallee', x: 3330, y: -15, tier: 9, look: LK({ r: 46, g: 52, b: 66, top: 'suit', bot: 'suitpants', hair: 0, hs: 4, skin: 0, shoe: 'stdshoe' }),
      bio: 'Leitet die Filiale seit 30 Jahren, liebt Zahlen und Diskretion und fragt nie zu genau nach.', style: 'förmlich, sagt „Sehr verehrte Kundschaft“',
      steps: [
        { ask: 'Albrecht, Stadtsparkasse. Man hört, Sie seien … liquide. Legen Sie mindestens 20.000 € auf Ihr Sparkonto.', t: { k: 'bank', n: 20000 }, done: 'Eine vorzügliche Entscheidung.', rw: { cash: 5000, rep: 1 } },
        { ask: 'Unsere besten Kunden schätzen Qualität. Beliefern Sie 10 Spezialkunden (★).', t: { k: 'vip', n: 10 }, done: 'Die Herrschaften sind entzückt.', rw: { cash: 8000, rep: 1 } },
        { ask: 'Ich biete Ihnen Startkapital für Ihr Wachstum an oder einen persönlichen Anlageberater.', choice: [{ id: 'kapital', l: 'Startkapital nehmen', say: 'Unterschrieben. Zinsfrei, ganz unter uns.', rw: { cash: 25000 } }, { id: 'berater', l: 'Anlageberater', say: 'Klug. Ihr Konto wird es Ihnen danken.', rw: { perk: { zins: 0.004 } } }] },
        { ask: 'Halten Sie 150.000 € auf dem Sparkonto. Das beeindruckt den Vorstand.', t: { k: 'bank', n: 150000 }, done: 'Der Vorstand ist hingerissen.', rw: { cash: 15000, rep: 2 } },
        { ask: 'Zum Jahresempfang kommen wichtige Gäste. Bringen Sie 15 Beutel, sehr diskret.', t: { k: 'bring', prod: 'keller', n: 15 }, done: 'Ein gelungener Abend. Willkommen im Kreis der Goldkunden.', rw: { cash: 20000, rep: 2, perk: { zins: 0.002 }, title: 'Goldkunde' } }
      ] },
    { id: 'vicky', name: 'Vicky', who: 'Besitzerin des Neon Club', where: 'auf dem Neon-Boulevard vor ihrem Club', x: 4560, y: 1276, tier: 10, look: LK({ r: 255, g: 92, b: 168, top: 'leather', bot: 'leatherp', hair: 4, hs: 8, skin: 1, sex: 'f', shoe: 'sneaker' }),
      bio: 'Hat den Neon Club aus einer alten Lagerhalle gemacht. Die Nacht ist ihr Revier.', style: 'cool, sagt „Darling“',
      steps: [
        { ask: 'Hey Darling, ich bin Vicky. Wer für mich liefert, muss die Nacht können. Mach 3 Lieferungen für die Gästeliste.', t: { k: 'club', n: 3 }, done: 'Nicht schlecht für den Anfang, Darling.', rw: { cash: 8000, rep: 1 } },
        { ask: 'VIP-Nacht! Bring mir nachts 20 Beutel.', t: { k: 'bring', prod: 'keller', n: 20, night: 1 }, done: 'Die VIPs tanzen bis zum Morgen.', rw: { cash: 15000, rep: 1 } },
        { ask: 'Der Club soll größer werden. Zahlst du die neue Lichtanlage, oder legst du als Special Guest auf?', choice: [{ id: 'licht', l: 'Lichtanlage zahlen (40.000 €)', cost: 40000, say: 'Der Club leuchtet bis zum Fluss!', rw: { perk: { vip: 0.02 } } }, { id: 'dj', l: 'Als Special Guest auflegen', say: 'Die Crowd tobt! Du bist ein Star, Darling.', rw: { rep: 3 } }] },
        { ask: 'Zeig mir, dass dein Imperium läuft: 500.000 € Umsatz.', t: { k: 'earn', n: 500000 }, done: 'Beeindruckend. Du spielst in meiner Liga.', rw: { cash: 30000, rep: 2 } },
        { ask: 'Letzte große Nacht des Jahres: 10 Lieferungen für die Gästeliste, dann gehört die VIP-Lounge dir.', t: { k: 'club', n: 10 }, done: 'Die Lounge trägt jetzt deinen Namen, Darling.', rw: { cash: 50000, rep: 3, title: 'Legende der Nacht' } }
      ] },
    // v97: vier neue Auftraggeber in den neuen Stadtteilen
    { id: 'jule', name: 'Jule', who: 'Marktfrau', where: 'am Wochenmarkt an der Parkstraße (Südost)', x: 3700, y: 1463, tier: 3, look: LK({ r: 230, g: 160, b: 60, top: 'flannel', bot: 'jeans', hair: 5, hs: 5, skin: 1, sex: 'f', hat: 'bucket' }),
      bio: 'Verkauft seit Jahren Obst und Gemüse auf dem Markt und kennt jeden Trick, um Kunden anzulocken.', style: 'resolut, sagt „Na, junger Mensch?“',
      steps: [
        { ask: 'Na, junger Mensch? Du bist doch der mit den grünen Daumen. Meine Stammkunden wollen mal was anderes probieren. 5 Beutel?', t: { k: 'bring', prod: 'keller', n: 5 }, done: 'Weg wie warme Semmeln!', rw: { cash: 1500, rep: 1 } },
        { ask: 'Wer auf dem Markt mitreden will, muss liefern können. Fahr 15 Ernten ein.', t: { k: 'hv', n: 15 }, done: 'Fleißig, fleißig. So mag ich das.', rw: { cash: 2500 } },
        { ask: 'Ich könnte dir einen festen Stand freihalten oder deine Ware unter meinem Gemüse verstecken. Was ist dir lieber?', choice: [{ id: 'stand', l: 'Fester Stand (3.000 €)', cost: 3000, say: 'Abgemacht. Die Leute bleiben jetzt öfter stehen.', rw: { perk: { ord: 0.02 } } }, { id: 'kiste', l: 'Unter dem Gemüse', say: 'Gewitzt! Das bleibt unter uns.', rw: { perk: { calm: 0.05 } } }] },
        { ask: 'Markttag! Beliefere 40 Kunden, dann ist die ganze Straße voll.', t: { k: 'del', n: 40 }, done: 'So einen Markttag hatten wir lange nicht.', rw: { cash: 5000, rep: 1 } },
        { ask: 'Zum Erntedankfest kommt die ganze Stadt. 10 Beutel, dann bist du Ehrenmarktfrau … äh, Ehrenmarkthändler.', t: { k: 'bring', prod: 'keller', n: 10 }, done: 'Der Markt gehört jetzt auch ein bisschen dir.', rw: { cash: 7000, rep: 2, title: 'Marktliebling' } }
      ] },
    { id: 'ralf', name: 'Meister Ralf', who: 'Chef der Autowerkstatt', where: 'vor der Autowerkstatt im Gewerbegebiet', x: 4796, y: -14, tier: 4, look: LK({ r: 70, g: 90, b: 130, top: 'denim', bot: 'cargo', hair: 0, hs: 9, skin: 2, hat: 'sportcap', shoe: 'sneaker' }),
      bio: 'Schraubt seit 30 Jahren an allem, was Räder hat, und hat ein Auge für gute Fahrer.', style: 'brummig, sagt „Junge, Junge“',
      steps: [
        { ask: 'Junge, Junge. Du fährst hier ständig vorbei. Zeig mal, was du kannst: ein Drift mit 800 Punkten.', t: { k: 'drift', n: 800 }, done: 'Nicht schlecht. Die Reifen haben geraucht.', rw: { cash: 3000, rep: 1 } },
        { ask: 'Meine Kunden sind reiche Leute mit dicken Autos. Beliefere 6 Spezialkunden (★).', t: { k: 'vip', n: 6 }, done: 'Die schicken mir jetzt ihre Freunde.', rw: { cash: 4500 } },
        { ask: 'Ein Tuning-Sponsor will dich. Nimmst du das Geld oder lieber Rabatt bei mir in der Werkstatt?', choice: [{ id: 'geld', l: 'Das Geld nehmen', say: 'Kluger Junge. Bar ist bar.', rw: { cash: 8000 } }, { id: 'rabatt', l: 'Werkstatt-Rabatt', say: 'Gute Wahl. Bei mir wirst du immer gut behandelt.', rw: { perk: { upkeep: -0.05 } } }] },
        { ask: 'Mach 50.000 € Umsatz, dann bau ich dir was Besonderes.', t: { k: 'earn', n: 50000 }, done: 'Respekt. Du bist ein echter Geschäftsmann.', rw: { cash: 9000, rep: 1 } },
        { ask: 'Nachtrennen am Wochenende! Bring 8 Beutel für die Fahrer, aber nachts.', t: { k: 'bring', prod: 'keller', n: 8, night: 1 }, done: 'Legendäre Nacht. Du gehörst jetzt zur Werkstatt-Familie.', rw: { cash: 12000, rep: 2, title: 'Schrauberkumpel' } }
      ] },
    { id: 'marco', name: 'Marco', who: 'Croupier im Casino', where: 'auf dem Neon-Boulevard vor dem Casino', x: 5000, y: 1282, tier: 5, look: LK({ r: 20, g: 20, b: 28, top: 'vest', bot: 'suitpants', hair: 1, hs: 3, skin: 1, shoe: 'stdshoe' }),
      bio: 'Steht seit Jahren am Blackjack-Tisch und weiß über jeden Spieler der Stadt Bescheid.', style: 'glatt und charmant, sagt „Mesdames et Messieurs“',
      steps: [
        { ask: 'Mesdames et Messieurs … ah, nur du. Meine Stammspieler brauchen etwas Entspannung zwischen den Runden. 6 Beutel?', t: { k: 'bring', prod: 'keller', n: 6 }, done: 'Die Tische laufen wie geschmiert.', rw: { cash: 4000, rep: 1 } },
        { ask: 'Vicky und ich arbeiten zusammen. Mach 2 Lieferungen für ihre Gästeliste.', t: { k: 'club', n: 2 }, done: 'Sie ist begeistert. Und das heißt was.', rw: { cash: 5000 } },
        { ask: 'Ein Highroller will heimlich bei dir einkaufen. Diskret abwickeln oder groß auftreten?', choice: [{ id: 'diskret', l: 'Diskret', say: 'Elegant. So wird man hier respektiert.', rw: { perk: { vip: 0.02 } } }, { id: 'show', l: 'Groß auftreten', say: 'Die ganze Meile redet von dir!', rw: { rep: 2, cash: 5000 } }] },
        { ask: 'Die VIP-Lounge will nur die besten Kunden. Beliefere 10 Spezialkunden.', t: { k: 'vip', n: 10 }, done: 'Die Lounge ist voll. Merci.', rw: { cash: 9000, rep: 1 } },
        { ask: 'Große Gala heute Nacht. 12 Beutel, nachts, s’il vous plaît.', t: { k: 'bring', prod: 'keller', n: 12, night: 1 }, done: 'Rien ne va plus … außer dir. Willkommen in der Familie der Meile.', rw: { cash: 15000, rep: 2, title: 'König der Meile' } }
      ] },
    { id: 'frieda', name: 'Frau Hoffmann', who: 'Vorsitzende des Nachbarschaftsvereins', where: 'im Nordpark', x: 2190, y: -560, tier: 6, look: LK({ r: 120, g: 150, b: 200, top: 'sweater', bot: 'skirt', hair: 5, hs: 4, skin: 0, sex: 'f', shoe: 'stdshoe' }),
      bio: 'Organisiert Straßenfeste, Flohmärkte und weiß, was hinter jeder Gardine im Nordviertel passiert.', style: 'neugierig und gesprächig, sagt „Unter uns gesagt …“',
      steps: [
        { ask: 'Unter uns gesagt … im Nordviertel fragen viele nach dir. Bring mir 8 Beutel für den Vereinsabend.', t: { k: 'bring', prod: 'keller', n: 8 }, done: 'Der Vereinsabend war so entspannt wie nie.', rw: { cash: 5000, rep: 1 } },
        { ask: 'Unsere Mitglieder wollen alle beliefert werden. Mach 50 Lieferungen an normale Kunden.', t: { k: 'del', n: 50 }, done: 'Alle sind zufrieden. Na ja, fast alle.', rw: { cash: 8000, rep: 1 } },
        { ask: 'Fürs Straßenfest brauchen wir Geld oder Hilfe beim Aufbau.', choice: [{ id: 'spende', l: 'Spenden (15.000 €)', cost: 15000, say: 'Wie großzügig! Das vergisst hier keiner.', rw: { rep: 3 } }, { id: 'helfen', l: 'Beim Aufbau helfen', say: 'Fleißige Hände sind auch Gold wert.', rw: { perk: { tips: 0.02 } } }] },
        { ask: 'Zeig dem Verein, dass du in der ganzen Stadt beliebt bist: 4 Questketten abschließen.', t: { k: 'quests', n: 4 }, done: 'Beeindruckend. Du bist ja überall bekannt!', rw: { cash: 12000 } },
        { ask: 'Das große Straßenfest! Mach 150.000 € Umsatz, dann wirst du Ehrenmitglied.', t: { k: 'earn', n: 150000 }, done: 'Ehrenmitglied auf Lebenszeit. Unter uns gesagt: Du warst schon immer mein Liebling.', rw: { cash: 20000, rep: 2, title: 'Ehrenmitglied' } }
      ] },
    // v108: neue Charaktere fuer leere Stadtteile
    { id: 'piet', name: 'Bootsmann Piet', who: 'Fährt das Ausflugsboot auf dem Fluss', where: 'an seinem Bootssteg am Fluss in Südost', x: 3724, y: 1912, tier: 3, look: LK({ r: 40, g: 70, b: 130, top: 'stripe', bot: 'bermuda', hair: 4, hs: 9, skin: 2, hat: 'sailor', shoe: 'wellies' }),
      bio: 'Schippert seit Jahrzehnten Touristen über den Fluss und hat an Bord so manches Versteck.', style: 'rau und herzlich, sagt „Ahoi“',
      steps: [
        { ask: 'Ahoi! Meine Fahrgäste haben auf dem Boot gern was Gutes dabei. 4 Beutel für die Abendrundfahrt?', t: { k: 'bring', prod: 'keller', n: 4 }, done: 'Die Leute wollten gar nicht mehr aussteigen!', rw: { cash: 1800, rep: 1 } },
        { ask: 'Am Ufer wohnen viele Stammgäste von mir. Mach 30 Lieferungen, dann empfehl ich dich weiter.', t: { k: 'del', n: 30 }, done: 'Ganz Südost spricht von dir.', rw: { cash: 3000 } },
        { ask: 'Ich könnte unter Deck ein Fach für dich einbauen, oder du hilfst mir, das Boot neu zu streichen.', choice: [{ id: 'fach', l: 'Geheimfach bezahlen (4.000 €)', cost: 4000, say: 'Wird gemacht. Da sucht keiner.', rw: { perk: { ord: 0.02 } } }, { id: 'streichen', l: 'Beim Streichen helfen', say: 'Sieht aus wie neu! Danke, Landratte.', rw: { rep: 2 } }] },
        { ask: 'Große Sommerfahrt! Bring nachts 10 Beutel an Bord.', t: { k: 'bring', prod: 'keller', n: 10, night: 1 }, done: 'Beste Fahrt der Saison. Du gehörst jetzt zur Crew!', rw: { cash: 7000, rep: 2, wear: 'sailor', title: 'Ehrenmatrose' } }
      ] },
    { id: 'sanne', name: 'Sanne', who: 'Hundetrainerin', where: 'auf der Hundewiese in Südost', x: 2190, y: 2400, tier: 4, look: LK({ r: 90, g: 170, b: 110, top: 'hoodie', bot: 'jogger', hair: 2, hs: 6, skin: 1, sex: 'f', hat: 'headband', shoe: 'runner' }),
      bio: 'Trainiert jeden Morgen die Hunde aus dem Viertel und kennt jedes Herrchen beim Namen.', style: 'sportlich und direkt, sagt „Fein gemacht!“',
      steps: [
        { ask: 'Fein gemacht, dass du vorbeischaust! Die Hundebesitzer hier sind nervös. 6 Beutel für die Morgenrunde?', t: { k: 'bring', prod: 'keller', n: 6 }, done: 'Fein gemacht! Alle ganz entspannt.', rw: { cash: 3500, rep: 1 } },
        { ask: 'Training ist alles. Fahr 25 Ernten ein, dann sehen wir, ob du Ausdauer hast.', t: { k: 'hv', n: 25 }, done: 'Ausdauer hast du, das muss man dir lassen.', rw: { cash: 4500 } },
        { ask: 'Ein paar Herrchen sind echte Spezialkunden. Beliefere 8 Spezialkunden (★).', t: { k: 'vip', n: 8 }, done: 'Die sind begeistert und haben kräftig Trinkgeld gegeben.', rw: { cash: 6500, rep: 1 } },
        { ask: 'Hundefest auf der Wiese! Mach 120.000 € Umsatz, dann bekommst du die goldene Hundemarke.', t: { k: 'earn', n: 120000 }, done: 'Fein gemacht! Die goldene Marke gehört dir.', rw: { cash: 12000, rep: 2, title: 'Freund der Hunde' } }
      ] },
    // v115: drei Einsteiger-Ketten fuer die ersten Kategorien (erklaeren nebenbei Ernten, Liefern, Ausbau, Helfer)
    { id: 'guenther', name: 'Hausmeister Günther', who: 'Hausmeister', where: 'an der Parkstraße beim Keller', x: 560, y: 1314, tier: 1, look: LK({ r: 70, g: 110, b: 160, top: 'polo', bot: 'cargo', hair: 4, hs: 9, skin: 0, hat: 'flatcap', shoe: 'stdshoe' }),
      bio: 'Kümmert sich seit 30 Jahren um das Haus über deinem Keller. Sieht alles, sagt wenig, hat immer einen Schraubenzieher dabei.', style: 'brummig, aber gutmütig, sagt „Jo“',
      steps: [
        { ask: 'Jo. Du bist der Neue unten im Keller? Günther, Hausmeister. Zeig mal, ob da unten was wächst: 3 Ernten.', t: { k: 'hv', n: 3 }, done: 'Jo, sieht ordentlich aus.', rw: { cash: 150, rep: 0.3 } },
        { ask: 'Kunden warten nicht gern. Mach 5 Lieferungen, dann reden wir weiter.', t: { k: 'del', n: 5 }, done: 'Zuverlässig. Gefällt mir.', rw: { cash: 300, rep: 0.5 } },
        { ask: 'Der Keller ist zu klein für dich. Kauf im Handy unter Geschäft → Ausbau einen weiteren Topf.', t: { k: 'up', area: 'keller', key: 'pots', n: 1, txt: 'Einen weiteren Topf kaufen' }, done: 'Jo, so wird das was.', rw: { cash: 400 } },
        { ask: 'Mein Knie zwickt. 2 Beutel für die Salbe, und ich sag keinem, was da unten los ist.', t: { k: 'bring', prod: 'keller', n: 2 }, done: 'Jo. Du bist in Ordnung. Wenn was ist, ich bin im Treppenhaus.', rw: { cash: 600, rep: 1, perk: { tips: 0.01 }, title: 'Hausmeisters Liebling' } }
      ] },
    { id: 'sabine', name: 'Sabine', who: 'Postbotin', where: 'an der Parkstraße beim Uferpark', x: 1000, y: 1314, tier: 1, look: LK({ r: 240, g: 200, b: 40, top: 'polo', bot: 'jeans', hair: 3, hs: 5, skin: 1, sex: 'f', hat: 'snapback', shoe: 'sneaker' }),
      bio: 'Trägt seit zehn Jahren im Viertel die Post aus und kennt jede Klingel. Wenn sie etwas weitererzählt, weiß es die ganze Straße.', style: 'flott und gut gelaunt, sagt „Moin!“',
      steps: [
        { ask: 'Moin! Sabine, Post. Ich komm überall rum. Mach 1.000 € Umsatz, dann erzähl ich allen von dir.', t: { k: 'earn', n: 1000 }, done: 'Hab schon fünf Leuten von dir erzählt!', rw: { cash: 250, rep: 0.5 } },
        { ask: '12 Lieferungen, und ich verteile deine Visitenkarten in jeden Briefkasten.', t: { k: 'del', n: 12 }, done: 'Alle Briefkästen voll. Jetzt klingelt bei dir öfter das Handy!', rw: { cash: 500, perk: { ord: 0.02 } } },
        { ask: 'Ein Paket für dich! Soll ich es per Express bringen oder ganz normal?', choice: [{ id: 'express', l: 'Express (300 €)', cost: 300, say: 'Zack, da ist es! Die Nachbarn haben es gesehen, gut für deinen Ruf.', rw: { rep: 1 } }, { id: 'normal', l: 'Ganz normal', say: 'Kommt morgen. Hier, ein Gutschein vom Absender.', rw: { cash: 400 } }] },
        { ask: 'Ein Spezialkunde (★) fragt nach dir. Beliefere einen, das bringt richtig was.', t: { k: 'vip', n: 1 }, done: 'Der war begeistert! Du bist jetzt Stammkunde bei mir.', rw: { cash: 800, rep: 1, title: 'Liebling der Post' } }
      ] },
    { id: 'fritz', name: 'Angler Fritz', who: 'Angler', where: 'am Flussufer im Uferpark', x: 420, y: 1852, tier: 2, look: LK({ r: 70, g: 120, b: 70, top: 'sweater', bot: 'cargo', hair: 4, hs: 9, skin: 2, hat: 'bucketcamo', shoe: 'wellies' }),
      bio: 'Sitzt jeden Tag mit seiner Angel am Fluss. Gefangen hat er seit Jahren nichts, aber das ist ihm egal.', style: 'ruhig und flüsternd, sagt „Petri Heil“',
      steps: [
        { ask: 'Psst, nicht so laut, die Fische! Ich bin Fritz. Nachts beißen sie am besten. Bring mir 3 Beutel, aber erst ab 21 Uhr.', t: { k: 'bring', prod: 'keller', n: 3, night: 1 }, done: 'Petri Heil. Jetzt ist der Abend perfekt.', rw: { cash: 300, rep: 0.5 } },
        { ask: 'Angeln braucht Geduld. Mach 20 Ernten, dann weißt du, was ich meine.', t: { k: 'hv', n: 20 }, done: 'Siehst du? Geduld zahlt sich aus.', rw: { cash: 900 } },
        { ask: 'Allein schaffst du das bald nicht mehr. Stell einen Gärtner ein und bring ihn auf Level 2.', t: { k: 'crew', kind: 'gardener', lv: 2 }, done: 'Ein gutes Team ist wie ein guter Köder.', rw: { cash: 1000, rep: 1 } },
        { ask: 'Mach 8.000 € Umsatz, dann bekommst du meinen alten Glückshut.', t: { k: 'earn', n: 8000 }, done: 'Hier, mein Glückshut. Gefangen hab ich damit nie was, aber Glück hatte ich immer.', rw: { cash: 1200, rep: 1.5, wear: 'bucketcamo', title: 'Petri Heil' } }
      ] },
    // v112: vier neue Questketten fuer die oberen Kategorien, mit Belohnungen, die es nirgends zu kaufen gibt
    { id: 'toni', name: 'Toni', who: 'Rennfahrerin', where: 'vor dem Autohof im Gewerbegebiet', x: 5000, y: 534, tier: 7, look: LK({ r: 220, g: 60, b: 60, top: 'leather', bot: 'jeans', hair: 3, hs: 1, skin: 2, sex: 'f', hat: 'snapback', shoe: 'sneaker' }),
      bio: 'Ist früher Rallyes gefahren und baut jetzt ihr eigenes Team auf. Riecht immer ein bisschen nach Benzin.', style: 'schnell und direkt, sagt „Vollgas!“',
      steps: [
        { ask: 'Vollgas! Ich bin Toni. Du fährst, hab ich gehört? Zeig mir einen Drift mit über 1.500 Punkten.', t: { k: 'drift', n: 1500 }, done: 'Nicht schlecht für einen Kellergärtner!', rw: { cash: 4000, rep: 1 } },
        { ask: 'Mein Rennteam braucht Sponsoren. Mach 150.000 € Umsatz, dann kommt dein Name auf meinen Wagen.', t: { k: 'earn', n: 150000 }, done: 'Dein Logo klebt schon auf der Motorhaube.', rw: { cash: 9000, rep: 1 } },
        { ask: 'In der Box zählt jede Sekunde. Hast du jemanden mit Spezialisierung Logistik auf Level 6?', t: { k: 'crew', sx: 'log', lv: 6 }, done: 'Der Boxenstopp sitzt. Vollgas!', rw: { cash: 12000 } },
        { ask: 'Letztes Rennen der Saison. Fährst du selbst mit, oder sponserst du das ganze Team?', choice: [{ id: 'fahren', l: 'Selbst mitfahren', say: 'Dann gib alles! Die Leute werden über dich reden.', rw: { rep: 2 } }, { id: 'sponsor', l: 'Team sponsern (25.000 €)', cost: 25000, say: 'Großzügig! Das Team fährt ab jetzt für dich.', rw: { perk: { price: 0.02 } } }] },
        { ask: 'Siegerehrung heute Nacht! Bring 20 Beutel für die Feier, aber erst ab 21 Uhr.', t: { k: 'bring', prod: 'keller', n: 20, night: 1 }, done: 'Wir haben gewonnen! Hier, unser Zielflaggen-Umhang. Den gibt es nur einmal.', rw: { cash: 20000, rep: 2, wear: 'capecheck', title: 'Rennlegende' } }
      ] },
    { id: 'mira', name: 'Mira', who: 'Influencerin', where: 'vor dem Fußballplatz an der Hauptstraße', x: 3850, y: 534, tier: 8, look: LK({ r: 250, g: 150, b: 200, top: 'tshirt', bot: 'skirt', hair: 5, hs: 8, skin: 1, sex: 'f', shoe: 'heels' }),
      bio: 'Hat zwei Millionen Follower und filmt alles. Wirklich alles.', style: 'aufgedreht, sagt „OMG“ und „Leute!“',
      steps: [
        { ask: 'OMG, du bist der aus dem Keller! Ich bin Mira, zwei Millionen Follower. Für mein Unboxing-Video brauche ich 12 Beutel!', t: { k: 'bring', prod: 'keller', n: 12 }, done: 'Leute, das Video geht durch die Decke!', rw: { cash: 6000, rep: 1 } },
        { ask: 'Meine Community will mehr! Beliefere 15 Spezialkunden (★), ich filme mit.', t: { k: 'vip', n: 15 }, done: 'Die Kommentare sind voll mit Herzen!', rw: { cash: 12000, rep: 1 } },
        { ask: 'Ich drehe eine Doku über dein Team. Hast du jemanden mit Spezialisierung Kundenbetreuung auf Level 6?', t: { k: 'crew', sx: 'kunde', lv: 6 }, done: 'So sympathisch! Die Leute lieben dein Team.', rw: { cash: 14000 } },
        { ask: 'Kooperation! Ich mache Werbung für dich, oder du bekommst einen Anteil an meinen Einnahmen. Was willst du?', choice: [{ id: 'werbung', l: 'Werbung (mehr Bestellungen)', say: 'Ab morgen klingelt dein Handy ohne Ende!', rw: { perk: { ord: 0.04 } } }, { id: 'anteil', l: 'Anteil (30.000 €)', say: 'Deal! Hier ist dein Anteil.', rw: { cash: 30000 } }] },
        { ask: 'Live-Stream heute Nacht! Bring 25 Beutel für die Watch-Party, ab 21 Uhr.', t: { k: 'bring', prod: 'keller', n: 25, night: 1 }, done: 'Rekord! Du bist jetzt offiziell viral. Das Rampenlicht gehört ab jetzt dir.', rw: { cash: 15000, rep: 2, wear: 'spotlight', title: 'Viral' } }
      ] },
    { id: 'hagen', name: 'Herr von Hagen', who: 'Kunstsammler', where: 'am Nordring im Nordviertel', x: 2700, y: -765, tier: 9, look: LK({ r: 70, g: 40, b: 90, top: 'suit', bot: 'suitpants', hair: 4, hs: 9, skin: 0, shoe: 'dress' }),
      bio: 'Sammelt Gemälde, Skulpturen und Kuriositäten. Seine Villa ist ein Museum, in das nie jemand darf.', style: 'vornehm, sagt „Exquisit!“',
      steps: [
        { ask: 'Gestatten, Konstantin von Hagen. Ich gebe eine Vernissage und brauche 15 Beutel für meine Gäste. Exquisit, hoffe ich?', t: { k: 'bring', prod: 'keller', n: 15 }, done: 'Exquisit! Meine Gäste sind entzückt.', rw: { cash: 7000, rep: 1 } },
        { ask: 'Ein Sammler erkennt einen Sammler. Besitzen Sie mindestens 20 Deko-Stücke?', t: { k: 'decn', n: 20 }, done: 'Sie haben Geschmack. Das sieht man selten.', rw: { cash: 10000 } },
        { ask: 'Kunst braucht Kapital. Zeigen Sie mir 500.000 € auf Ihrem Sparkonto.', t: { k: 'bank', n: 500000 }, done: 'Solide. Mit Ihnen kann man Geschäfte machen.', rw: { cash: 15000, rep: 1 } },
        { ask: 'Auf der Auktion gibt es eine Skulptur, die alle wollen. Bieten Sie selbst mit, oder überlassen Sie sie mir gegen Provision?', choice: [{ id: 'bieten', l: 'Mitbieten (40.000 €)', cost: 40000, say: 'Mutig! Ganz Kellergrün spricht von Ihrem Gebot.', rw: { rep: 2 } }, { id: 'provision', l: 'Provision (25.000 €)', say: 'Klug. Hier ist Ihre Provision.', rw: { cash: 25000 } }] },
        { ask: 'Zum Abschluss meiner Ausstellung: 30 Beutel, für den großen Empfang.', t: { k: 'bring', prod: 'keller', n: 30 }, done: 'Ein Triumph! Dieses Meisterwerk soll ab jetzt bei Ihnen hängen. Es gibt nur eines davon.', rw: { cash: 30000, rep: 2, dec: 'masterpiece', title: 'Kunstkenner' } }
      ] },
    { id: 'lindner', name: 'Bürgermeister Lindner', who: 'Bürgermeister', where: 'vor dem Marktplatz an der Nordallee', x: 2780, y: -15, tier: 11, look: LK({ r: 40, g: 40, b: 50, top: 'suit', bot: 'suitpants', hair: 0, hs: 4, skin: 1, shoe: 'dress', hat: 'none' }),
      bio: 'Regiert Kellergrün seit zwölf Jahren. Plant das große Stadtjubiläum und braucht dafür die wichtigsten Leute der Stadt.', style: 'feierlich, sagt „Liebe Mitbürger“',
      steps: [
        { ask: 'Lindner, Bürgermeister. Frau Kaiser schwärmt von Ihnen. Kellergrün feiert bald 750 Jahre. Dafür brauche ich jemanden, den die ganze Stadt kennt: Schließen Sie 14 Questketten ab.', t: { k: 'quests', n: 14 }, done: 'Liebe Mitbürger, wir haben unseren Ehrengast!', rw: { cash: 20000, rep: 1 } },
        { ask: 'Das Jubiläum kostet. Machen Sie 1.000.000 € Umsatz, dann reden wir über die Bühne.', t: { k: 'earn', n: 1000000 }, done: 'Großartig. Die Bühne steht.', rw: { cash: 40000 } },
        { ask: 'Für die Organisation brauche ich die Besten. Haben Sie einen Helfer auf Level 10?', t: { k: 'crew', lv: 10 }, done: 'Was für ein Team! Alles läuft wie am Schnürchen.', rw: { cash: 30000, rep: 1 } },
        { ask: 'Die Stadt möchte Ihnen etwas zurückgeben. Lieber ein großes Fest auf Ihre Kosten, oder eine dauerhafte Steuererleichterung?', choice: [{ id: 'fest', l: 'Stadtfest sponsern (100.000 €)', cost: 100000, say: 'Liebe Mitbürger, das wird ein Fest!', rw: { rep: 3 } }, { id: 'steuer', l: 'Steuererleichterung', say: 'Gewährt. Ihr Unterhalt sinkt dauerhaft.', rw: { perk: { upkeep: -0.05 } } }] },
        { ask: 'Die Jubiläumsnacht! Bring 30 Beutel für das große Feuerwerksfest, ab 21 Uhr.', t: { k: 'bring', prod: 'keller', n: 30, night: 1 }, done: 'Liebe Mitbürger: Ehrenbürger von Kellergrün! Hier sind der goldene Stadtschlüssel und die goldenen Flügel der Stadt.', rw: { cash: 100000, rep: 3, wear: 'wgold', dec: 'citykey', title: 'Ehrenbürger' } }
      ] }
  ];
  const CHAR_BY = Object.fromEntries(CHARS.map(c => [c.id, c]));
  // v115: Solange es keinen Premium-Anbau gibt, ist die Apotheke im Umbau und Dr. Weber sitzt im Stadtpark
  const prReady = () => !!(G && G.pr && G.pr.own && G.lager.own);
  { const W0 = { x: CHAR_BY.weber.x, y: CHAR_BY.weber.y, where: CHAR_BY.weber.where }, WP = { x: 1530, y: 1004, where: 'auf einer Bank im Stadtpark (ihre Apotheke ist im Umbau)' };
    for (const k of ['x', 'y', 'where']) Object.defineProperty(CHAR_BY.weber, k, { get: () => (prReady() ? W0 : WP)[k], configurable: true, enumerable: true }); }
  function weberFix() { if (!G || !G.kr || !prReady()) return; const q = G.kr.q.weber; if (q && q.s === 0) { q.s = 1; q.seen = -1; stepBase(CHAR_BY.weber); } } // mit Premium-Anbau nimmt sie keine Beutel mehr
  const qOf = id => { const k = KR(); return k.q[id] || (k.q[id] = { s: 0, b: 0, seen: -1, aff: 0, next: 0, n: 0, ch: {} }); };
  const qDone = c => !!G.kr && !!G.kr.q[c.id] && G.kr.q[c.id].s >= c.steps.length;
  const questsDone = () => G && G.kr ? CHARS.filter(c => qDone(c)).length : 0;
  const charUnlocked = c => !KR_NEUTRAL && !!G && KR().tier >= c.tier && (!c.req || c.req());
  const charHere = c => charUnlocked(c) && (c.sea === undefined || c.sea === seasonI());
  const CNT = { del: () => G.stat.del, vip: () => G.stat.vip, earn: () => G.earned, hv: () => KR().cnt.hv, hs: () => KR().cnt.hs, gb: () => G.stat.gb || 0, gym: () => G.stat.gym || 0, pizza: () => G.stat.pizza || 0, club: () => G.stat.club || 0 };
  function stepBase(c) { const q = qOf(c.id), st = c.steps[q.s]; q.b = st && st.t && CNT[st.t.k] ? CNT[st.t.k]() : 0; }
  function taskProg(c) { // [aktuell, ziel, erfuellt?]
    const q = qOf(c.id), st = c.steps[q.s]; if (!st || !st.t) return [0, 0, true]; const t = st.t;
    if (CNT[t.k]) { const v = CNT[t.k]() - q.b; return [Math.max(0, Math.floor(v)), t.n, v >= t.n]; }
    if (t.k === 'bring') { const ar = AREAS[t.prod]; const have = ar && isOpen(ar) ? S(ar).inv.bags : 0; return [Math.min(have, t.n), t.n, have >= t.n && (!t.night || night() > 0.3)]; }
    if (t.k === 'drift') { const v = G.stat.drift || 0; return [Math.min(v, t.n), t.n, v >= t.n]; }
    if (t.k === 'crew') { crewSync(); const ok = KR().crew.some(m => G.staff[m.r] > 0 && (!t.sx || m.sx === t.sx) && (!t.kind || crewKind(m) === t.kind) && m.lv >= (t.lv || 1)); return [ok ? 1 : 0, 1, ok]; }
    if (t.k === 'up') { const v = (t.area === 'pr' && !G.pr.own ? 0 : S(AREAS[t.area]).up[t.key]) || 0; return [Math.min(v, t.n), t.n, v >= t.n]; }
    if (t.k === 'own') { const ok = !!(G.lager.own && G.pr.own); return [ok ? 1 : 0, 1, ok]; } // v89
    if (t.k === 'quests') { const v = questsDone(); return [Math.min(v, t.n), t.n, v >= t.n]; }
    if (t.k === 'bank') { const v = G.bank || 0; return [Math.min(v, t.n), t.n, v >= t.n]; } // v94
    if (t.k === 'decn') { const v = Object.values(G.dec.owned).reduce((a, b) => a + (+b || 0), 0); return [Math.min(v, t.n), t.n, v >= t.n]; } // v112
    return [0, 1, true];
  }
  function taskText(c) {
    const q = qOf(c.id), st = c.steps[q.s]; if (!st) return 'Abgeschlossen'; if (st.choice) return 'Entscheidung treffen'; const t = st.t, [v, n] = taskProg(c);
    const unit = t.prod ? AREAS[t.prod].lbl.unit : '';
    const tx = { bring: 'Bring ' + t.n + ' ' + unit + (t.night ? ' (nachts)' : ''), del: t.n + ' Lieferungen an normale Kunden (Aufträge)', vip: t.n + ' Spezialkunden (★)', earn: fmt(t.n) + ' Umsatz', hv: t.n + ' Ernten', hs: t.n + ' Stück an den Hehler', gb: 'Eine angreifende Gang verjagen', drift: 'Drift mit ' + t.n + ' Punkten', decn: t.n + ' Deko-Stücke besitzen', crew: 'Helfer: ' + (t.sx ? 'Spezialisierung ' + SPECS[t.sx].name + (t.lv > 1 ? ' auf Level ' + t.lv : '') : (t.kind === 'gardener' ? 'Gärtner' : 'Helfer') + ' Level ' + t.lv), up: t.txt || 'Saatgut Stufe ' + t.n, own: t.txt || 'Einrichten', quests: t.n + ' Questketten abgeschlossen', meet: 'Reden', gym: t.n + ' Trainings im Iron Gym', pizza: t.n + ' Team-Pizzen bestellen', club: t.n + ' Club-Lieferungen (nachts)', bank: fmt(t.n) + ' auf dem Sparkonto' }[t.k] || '';
    return tx + (t.k === 'crew' || t.k === 'own' ? '' : ' · ' + (t.k === 'earn' || t.k === 'bank' ? fmt(v) + ' / ' + fmt(n) : v + ' / ' + n));
  }
  const charReady = c => { if (!charHere(c)) return false; const q = qOf(c.id); if (q.s >= c.steps.length) return krRegular(c) > 0; const st = c.steps[q.s]; return q.seen !== q.s || !!st.choice || taskProg(c)[2]; };
  function krReward(rw, c) {
    if (!rw) return []; const out = [], kb = c ? Math.min(0.25, 0.05 * specSum('kunde')) : 0;
    if (rw.cash) { const v = Math.round(rw.cash * (1 + kb)); G.money += v; out.push('+' + fmt(v)); }
    if (rw.rep) { krRepBonus(rw.rep); out.push('Ruf +' + String(rw.rep).replace('.', ',')); }
    if (rw.perk) for (const [p, v] of Object.entries(rw.perk)) { addPerk(p, v); out.push(PERK_NAME[p] + ' ' + (v > 0 ? '+' : '') + Math.round(v * 100) + ' % (dauerhaft)'); }
    if (rw.wear) for (const wid of [].concat(rw.wear)) if (WEAR_BY[wid]) { if (G.wear.owned[wid]) { G.money += 1000; out.push(WEAR_BY[wid].name + ' (schon da: +' + fmt(1000) + ')'); } else { G.wear.owned[wid] = true; out.push(WEAR_BY[wid].name + ' freigeschaltet'); } }
    if (rw.dec && DECOR.find(d => d.id === rw.dec)) { G.dec.owned[rw.dec] = (G.dec.owned[rw.dec] || 0) + 1; out.push(DECOR.find(d => d.id === rw.dec).name + ' (Deko, nur als Belohnung)'); }
    if (rw.cos) { const cs = COS.find(x => x.id === rw.cos); if (cs) { if (G.cos.owned[rw.cos]) { G.money += 1000; out.push(cs.name + ' (schon da: +' + fmt(1000) + ')'); } else { G.cos.owned[rw.cos] = true; out.push(cs.name + ' freigeschaltet'); } } }
    if (rw.title) { const k = KR(); if (!k.titles.includes(rw.title)) { k.titles.push(rw.title); if (!k.title) k.title = rw.title; } out.push('Titel „' + rw.title + '“'); }
    if (rw.chx && c) { const q = qOf(c.id); for (const [cid, r2] of Object.entries(rw.chx)) if (Object.values(q.ch).includes(cid)) out.push(...krReward(r2, c)); }
    return out;
  }
  const basePrice = prod => { const ar = AREAS[prod] || AREAS.keller; return (ar.price + repEff(G.rep) * 2.2) * seedMult(S(ar).up.seed); };
  // Stammkunden: abgeschlossene Charaktere bestellen alle zwei Spieltage wieder, mit Aufschlag je nach Beziehung
  function krRegular(c) { if (!qDone(c) || !charHere(c) || c.id === 'weber') return 0; const q = qOf(c.id); return absMin() >= q.next ? Math.max(3, Math.min(12, 3 + Math.floor(q.n / 2))) : 0; }
  let ktalk = { id: '', lines: [], btns: [], rw: [] };
  function krTalk(id) {
    const c = CHAR_BY[id]; if (!c || !charHere(c)) return false; if (id === 'weber') weberFix(); const q = qOf(id);
    ktalk = { id, lines: [], btns: [], rw: [] };
    if (q.s >= c.steps.length) {
      const n = krRegular(c);
      if (n > 0) {
        const ar = AREAS.keller, have = S(ar).inv.bags;
        ktalk.lines.push((c.sea !== undefined ? 'Schön, dass du wieder da bist! ' : 'Na, da bist du ja wieder! ') + 'Ich nehme ' + n + ' ' + ar.lbl.unit + ', wie immer mit Aufschlag für Stammkunden.');
        if (have >= n) ktalk.btns.push({ l: n + ' ' + ar.lbl.unit + ' geben', fn: () => { const bonus = 1.25 + q.aff / 200 + (KR().tier >= tierNo('stadt') ? 0.15 : 0), pay = Math.round(basePrice('keller') * n * bonus * krTip()); S(ar).inv.bags -= n; G.money += pay; G.earned += pay; G.stat.del++; q.n++; q.aff = Math.min(100, q.aff + 4); q.next = absMin() + 2 * 1440; addRep(0.3); sfx.cash(); ktalk.lines = ['Danke! Wie immer ein Vergnügen.']; ktalk.rw = ['+' + fmt(pay), 'Beziehung ' + Math.round(q.aff) + ' / 100']; ktalk.btns = []; save(); } });
        else ktalk.lines.push('Du hast gerade nur ' + have + ' dabei. Komm wieder, wenn du genug hast.');
      } else if (c.id === 'weber') ktalk.lines.push('Schön, Sie zu sehen! Ihre Dosen nehme ich jederzeit in der Apotheke. Beutel brauche ich keine mehr.');
      else ktalk.lines.push(c.sea !== undefined ? 'Danke nochmal für alles! Bis zur nächsten ' + season().name + '-Zeit.' : 'Schön dich zu sehen! Ich melde mich, wenn ich wieder was brauche.');
      openTalk(); return true;
    }
    const st = c.steps[q.s];
    if (q.seen !== q.s) { q.seen = q.s; ktalk.lines.push(st.ask); }
    if (st.choice) {
      if (!ktalk.lines.length) ktalk.lines.push(st.ask);
      for (const o of st.choice) ktalk.btns.push({ l: o.l, dis: o.cost && G.money < o.cost, fn: () => {
        if (o.cost) { if (G.money < o.cost) return; G.money -= o.cost; }
        q.ch['s' + q.s] = o.id; const rw = krReward(o.rw, c); q.aff = Math.min(100, q.aff + 10); ktalk.lines = [o.say]; ktalk.rw = rw; ktalk.btns = []; advance(c); } });
    } else {
      const [v, n, ok] = taskProg(c);
      if (ok) {
        if (st.t.k === 'bring') { const ar = AREAS[st.t.prod]; S(ar).inv.bags -= st.t.n; const pay = Math.round(basePrice(st.t.prod) * st.t.n * 1.2 * (1 + q.aff / 300)); G.money += pay; G.earned += pay; ktalk.rw.push('+' + fmt(pay) + ' für die Ware'); }
        if (st.t.k === 'pay') G.money -= st.t.n;
        if (ktalk.lines.length) ktalk.lines.push('…');
        ktalk.lines.push(st.done); ktalk.rw.push(...krReward(st.rw, c)); q.aff = Math.min(100, q.aff + 10); advance(c);
      } else if (!ktalk.lines.length) ktalk.lines.push('Noch nicht ganz: ' + taskText(c) + (st.t.night && night() <= 0.3 ? ' Komm nachts wieder.' : ''));
    }
    openTalk(); return true;
  }
  function advance(c) {
    const q = qOf(c.id); q.s++; sfx.cash();
    if (q.s >= c.steps.length) { q.next = absMin() + 1440; ktalk.rw.push('Questkette abgeschlossen!'); msg('Questkette mit ' + c.name + ' abgeschlossen!'); if (KR().trk === c.id) KR().trk = ''; }
    else { stepBase(c); const nx = c.steps[q.s]; ktalk.btns.push({ l: 'Weiter', fn: () => { q.seen = q.s; ktalk.lines = [nx.ask]; ktalk.rw = []; ktalk.btns = []; if (nx.choice) { krTalk(c.id); return; } const p = taskProg(c); if (p[2] && nx.t.k !== 'bring') ktalk.btns.push({ l: 'Erledigt zeigen', fn: () => krTalk(c.id) }); } }); }
    save();
  }
  function openTalk() { if (!phoneOpen) { tab = 'talk'; openPhone(); } else { tab = 'talk'; renderPhone(); } }
  function renderTalk(b) {
    const c = CHAR_BY[ktalk.id]; if (!c) return; const q = qOf(c.id);
    const card = document.createElement('div'); card.className = 'card'; card.style.cssText = 'display:block';
    card.innerHTML = '<div style="display:flex;gap:12px;align-items:flex-start"><canvas class="krpv" width="144" height="144" style="width:84px;height:84px;flex:none;border-radius:14px;background:rgba(255,255,255,.06)"></canvas><div style="flex:1;min-width:0"><div class="nm"></div><div class="ds who"></div><div class="say" style="margin-top:6px;font-size:15px;line-height:1.4"></div></div></div>';
    card.querySelector('.nm').textContent = c.name; card.querySelector('.who').textContent = c.who + ' · Beziehung ' + Math.round(q.aff) + '/100';
    const sy = card.querySelector('.say'); ktalk.lines.forEach(t => { const p = document.createElement('div'); p.textContent = '„' + t + '“'; p.style.marginBottom = '6px'; sy.appendChild(p); });
    if (ktalk.rw.length) { const r = document.createElement('div'); r.style.cssText = 'margin-top:6px;display:flex;flex-wrap:wrap;gap:6px'; ktalk.rw.forEach(t => { const x = document.createElement('span'); x.className = 'chip on'; x.style.cssText = 'min-height:28px;display:inline-flex;align-items:center;font-size:12px'; x.textContent = t; r.appendChild(x); }); card.appendChild(r); }
    const row = document.createElement('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:10px';
    ktalk.btns.forEach(bt => { const x = document.createElement('button'); x.className = 'buy'; x.textContent = bt.l; x.disabled = !!bt.dis; x.addEventListener('click', () => { bt.fn(); renderPhone(); }); row.appendChild(x); });
    const tr = document.createElement('button'); tr.className = 'chip'; tr.textContent = 'Fertig'; tr.addEventListener('click', () => closePhone()); row.appendChild(tr); card.appendChild(row);
    b.appendChild(card);
    const pv = card.querySelector('.krpv'), c2 = pv && pv.getContext && pv.getContext('2d'); if (c2) { const sc = ctx; try { ctx = c2; c2.setTransform(4.4, 0, 0, 4.4, 0, 0); c2.clearRect(0, 0, 40, 40); drawFigure(16.4, 14, Math.PI / 2, 0, c.look); } finally { ctx = sc; } }
    const st = c.steps[q.s]; if (st && !st.choice) { const t = document.createElement('div'); t.className = 'ds'; t.style.margin = '8px 2px'; t.textContent = 'Aktuelle Aufgabe: ' + taskText(c); b.appendChild(t); }
    const bio = document.createElement('div'); bio.className = 'ds'; bio.style.margin = '4px 2px'; bio.textContent = c.bio; b.appendChild(bio);
  }
  // ---------- Sammelobjekte je Jahreszeit ----------
  const COLL = [{ n: 'Marienkäfer', one: 'Marienkäfer', col: ['#E8403A', '#F2562E', '#D93A3A', '#F06A2A'] }, { n: 'Muscheln', one: 'Muschel', col: ['#FFE9C8', '#F2C1A0'] }, { n: 'Kastanien', one: 'Kastanie', col: ['#7A4A28', '#9A5A30'] }, { n: 'Schneekugeln', one: 'Schneekugel', col: ['#CFEFFF', '#FFFFFF'] }];
  const COLL_N = 6;
  let collPts = { key: '', pts: [] };
  function collPoints() {
    const key = seasonYear() + '-' + seasonI(); if (collPts.key === key) return collPts.pts;
    let seed = seasonYear() * 97 + seasonI() * 13 + 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, pts = [];
    for (let k = 0; k < 600 && pts.length < COLL_N; k++) { const E = NAV.edges[Math.floor(rnd() * NAV.edges.length)], t = rnd(); if (!E) continue; const A = NAV.nodes[E.a], B = NAV.nodes[E.b], x = Math.round(A.x + (B.x - A.x) * t), y = Math.round(A.y + (B.y - A.y) * t); if (onRoadway(x, y) || blockedPt(x, y) || x < 60 || y < 60 || x > WW - 60 || y > WH - 60 || pts.some(o => Math.hypot(o.x - x, o.y - y) < 600)) continue; pts.push({ x, y }); } // fest je Jahr und Jahreszeit
    collPts = { key, pts }; return pts;
  }
  function collTick() {
    if (KR_NEUTRAL || player.x < 0 || player.fl) return; const pts = collPoints(), k = KR(), key = seasonYear() + '-' + seasonI(); let m = k.col[key] || 0;
    pts.forEach((p, i) => { if (m & (1 << i)) return; if (Math.hypot(player.x - p.x, player.y - p.y) < 22) { m |= 1 << i; k.col[key] = m; const got = pts.filter((_, j) => m & (1 << j)).length, C = COLL[seasonI()]; sfx.ping(); floater(p.x, p.y - 20, C.one + ' ' + got + '/' + pts.length, '#FFD24A'); if (got === pts.length) { const c = Math.round(1000 * krLv()); G.money += c; k.troph[season().id] = (k.troph[season().id] || 0) + 1; msg('Alle ' + C.n + ' gefunden! +' + fmt(c) + ' und eine Trophäe'); sfx.cash(); } save(); } });
  }
  // ---------- Ereignisse ----------
  const HR = 60;
  const EVENTS = {
    gross: { cat: 'pos', name: 'Großbestellung', ic: '📦', w: 3, dur: 8 * HR, cond: () => KR().tier >= tierNo('auf'), desc: 'Ein Kunde will auf einen Schlag eine große Menge, zahlt aber 60 % mehr.', start: e => { e.oid = krBigOrder(); } },
    stamm: { cat: 'pos', name: 'Treuer Kunde', ic: '💛', w: 3, dur: 24 * HR, desc: 'Die nächsten 5 Lieferungen bringen 30 % mehr Trinkgeld.', start: e => { e.n = 5; } },
    boom: { cat: 'pos', name: 'Bonusnachfrage', ic: '📈', w: 3, dur: 10 * HR, desc: 'Viel mehr Bestellungen als sonst.', mod: () => ({ orders: 1.6 }) },
    werbung: { cat: 'pos', name: 'Werbeaktion', ic: '📣', w: 2, dur: 24 * HR, cond: () => KR().tier >= tierNo('tipp'), desc: 'Eine Werbefläche ist frei. Mit Werbung kommen mehr Bestellungen und etwas Ruf.', choice: [{ id: 'ja', l: e => 'Buchen (' + fmt(300 + KR().tier * 250) + ')', cost: () => 300 + KR().tier * 250, fx: () => { krRepBonus(0.5); return 'Werbung läuft: mehr Bestellungen, Ruf +0,5'; } }, { id: 'nein', l: () => 'Nicht buchen', fx: () => 'Keine Werbung.' }], mod: e => e.ch === 'ja' ? { orders: 1.5, price: 1.05 } : {} },
    rabatt: { cat: 'pos', name: 'Samen im Angebot', ic: '🏷️', w: 2, dur: 8 * HR, desc: 'Samen kosten 40 % weniger.', mod: () => ({ seed: 0.6 }) },
    kontakt: { cat: 'neu', name: 'Neuer Kontakt', ic: '📇', w: 2, dur: 2 * HR, desc: 'Jemand hat von dir gehört.', start: e => { const c = CHARS.find(x => charHere(x) && qOf(x.id).s === 0 && qOf(x.id).seen < 0); if (c) { KR().trk = c.id; msg(c.name + ' möchte dich kennenlernen (' + c.where + ')'); } else { G.money += 300; msg('Ein alter Bekannter steckt dir 300 € zu.'); } } },
    besucher: { cat: 'neu', name: 'Besonderer Besucher', ic: '⭐', w: 2, dur: 6 * HR, desc: 'Ein Spezialkunde ist in der Stadt.', start: e => { e.oid = krVipOrder(); } },
    aufgabe: { cat: 'neu', name: 'Zusatzaufgabe', ic: '📝', w: 2, dur: 6 * HR, desc: 'Schaffe 6 Lieferungen, solange das Ereignis läuft. Belohnung: Geld und Ruf.', start: e => { e.b = G.stat.del; } },
    fund: { cat: 'neu', name: 'Seltene Entdeckung', ic: '🔍', w: 2, dur: 6 * HR, desc: 'Du findest eine alte Kiste mit Samen.', choice: [{ id: 'samen', l: () => 'Samen behalten (4 Std. gratis pflanzen)', fx: () => { KR().freeT = absMin() + 4 * HR; return '4 Spielstunden gratis pflanzen'; } }, { id: 'geld', l: () => 'An den Hehler (Geld)', fx: () => { const v = 400 + 200 * KR().tier; G.money += v; return '+' + fmt(v); } }] },
    verzug: { cat: 'neg', name: 'Lieferverzug', ic: '🚚', w: 2, dur: 20 * HR, desc: 'Der Samenhändler hängt fest: Samen kosten mehr. Logistiker im Team und Mehmet helfen.', choice: [{ id: 'express', l: () => 'Expresslieferung (' + fmt(250 + KR().tier * 100) + ')', cost: () => 250 + KR().tier * 100, fx: () => 'Express gebucht, alles normal.' }, { id: 'warten', l: () => 'Abwarten', fx: () => 'Du wartest ab.' }], mod: e => e.ch === 'express' ? {} : { seed: 1 + Math.max(0.1, 0.45 - 0.08 * specSum('log') - (qDone(CHAR_BY.mehmet) ? 0.15 : 0)) } },
    kosten: { cat: 'neg', name: 'Höhere Betriebskosten', ic: '💸', w: 2, dur: 24 * HR, desc: 'Strom und Wasser werden teurer: Unterhalt heute höher. Organisatoren im Team senken das.', mod: () => ({ upkeep: 1 + Math.max(0.15, 0.5 - 0.08 * specSum('orga')) }) },
    wartung: { cat: 'neg', name: 'Wartungsbedarf', ic: '🔧', w: 2, dur: 18 * HR, desc: 'Die Lampen flackern: Pflanzen wachsen langsamer, bis repariert ist. Produktionsprofis machen es billiger.', choice: [{ id: 'rep', l: () => 'Reparieren (' + fmt(krRepairCost()) + ')', cost: () => krRepairCost(), fx: () => 'Repariert, alles läuft.' }, { id: 'warten', l: () => 'Abwarten', fx: () => 'Die Lampen flackern weiter.' }], mod: e => e.ch === 'rep' ? {} : { grow: 0.75 } },
    personal: { cat: 'neg', name: 'Personalengpass', ic: '🤒', w: 2, cond: () => workers.length > 0, wf: () => Math.max(0.3, 1 - 0.25 * specSum('orga')), dur: 8 * HR, desc: 'Ein Helfer ist krank und fällt aus. Mit Überstunden der anderen läuft alles weiter.', start: e => { const ws = workers.filter(w => w.cid > 0); const w = ws[Math.floor(Math.random() * ws.length)]; e.cid = w ? w.cid : -1; const m = w && crewOf(w); if (m) { m.off = e.end; msg(m.n + ' (' + ROLES[m.r].name + ') ist krank'); } }, choice: [{ id: 'ueber', l: e => 'Überstunden zahlen (' + fmt(krOvertime(e)) + ')', cost: e => krOvertime(e), fx: e => { const m = KR().crew.find(x => x.id === e.cid); if (m) m.off = 0; return 'Die anderen übernehmen.'; } }, { id: 'warten', l: () => 'Ohne ihn auskommen', fx: () => 'Ihr kommt so klar.' }] },
    markt: { cat: 'pos', sea: 0, name: 'Frühlingsmarkt', ic: '🌷', w: 3, dur: 12 * HR, desc: 'Auf dem Frühlingsmarkt zahlen alle 10 % mehr.', mod: () => ({ price: 1.1 }) },
    hitze: { cat: 'neg', sea: 1, name: 'Hitzewelle', ic: '🔥', w: 3, dur: 16 * HR, desc: 'Die Töpfe trocknen schnell aus, aber alle wollen was Kühles: mehr Bestellungen.', mod: () => ({ water: 1.6, orders: 1.2 }) },
    frost: { cat: 'neg', sea: 3, name: 'Frost', ic: '🥶', w: 3, dur: 20 * HR, desc: 'Glatte Straßen: Samen kommen teurer, Pflanzen frieren etwas. Dafür zahlen Spezialkunden noch mehr.', mod: () => ({ seed: 1.25, grow: 0.92, price: 1.04 }) }
  };
  const krRepairCost = () => Math.round((300 + krLv() * 150) * (1 - Math.min(0.5, 0.15 * specSum('prod'))));
  const krOvertime = e => { const m = KR().crew.find(x => x.id === (e && e.cid)); return Math.round((m ? crewWage(m) : 15) * 3); };
  function krNewOrder(qty, mult, vip) {
    const free = []; for (let i = 0; i < HOUSES.length; i++) if (houseOpen(i) && !HOUSES[i].gang && !HOUSES[i].office && zoneOpenAt(HOUSES[i].dx, HOUSES[i].dy) && !G.orders.some(o => o.house === i)) free.push(i); if (!free.length) return -1;
    const house = free[Math.floor(Math.random() * free.length)], hs = HOUSES[house], prod = 'keller', ar = AREAS[prod];
    const per = basePrice(prod) * mult * krPrice(prod, vip), o = { id: G.oid++, house, prod, qty, price: Math.round(per * qty), mob: false, vip: !!vip, t: 420, tmax: 420, x: hs.dx, y: hs.face === 1 ? hs.dy + 16 : hs.dy - 16, pause: 0, ang: 0 };
    G.orders.push(o); sfx.ping(); msg((vip ? '★ ' : '') + HOUSES[house].name + ' will ' + qty + ' ' + ar.lbl.unit + ' für ' + fmt(o.price)); return o.id;
  }
  const krBigOrder = () => krNewOrder(Math.max(8, Math.min(24, Math.round(bagCap() * 0.8))), 1.6, true);
  const krVipOrder = () => krNewOrder(3 + Math.floor(Math.random() * 4), 2.2, true);
  function krStartEvent(id) {
    const d = EVENTS[id], k = KR(); if (!d) return false; const now = absMin();
    k.ev = { id, st: now, end: now + d.dur, ch: '', n: 0, b: 0, oid: -1, cid: -1, done: 0 }; k.evN++; k.cnt.ev++;
    k.evLog = k.evLog.concat(id).slice(-6);
    if (d.start) d.start(k.ev);
    msg(d.ic + ' Ereignis: ' + d.name + (d.choice ? ' – entscheide im Handy (Karriere → Events)' : ''), d.cat === 'neg'); sfx.ping(); save(); return true;
  }
  function krEndEvent() {
    const k = KR(), e = k.ev; if (!e) return; const d = EVENTS[e.id];
    if (e.id === 'aufgabe' && !e.done) { if (G.stat.del - e.b >= 6) { const v = Math.round(800 + 300 * krLv()); G.money += v; krRepBonus(1); msg('Zusatzaufgabe geschafft: +' + fmt(v) + ', Ruf +1'); } else msg('Zusatzaufgabe nicht geschafft. Kein Problem, beim nächsten Mal.'); }
    if (e.cid > 0) { const m = k.crew.find(x => x.id === e.cid); if (m && m.off) m.off = 0; }
    if (d && d.choice && !e.ch) e.ch = d.choice[d.choice.length - 1].id;
    k.ev = null; k.evNext = absMin() + (10 + Math.random() * 12) * HR; save();
  }
  function krChoose(ci) {
    const k = KR(), e = k.ev; if (!e || e.ch) return false; const d = EVENTS[e.id]; const o = d && d.choice && d.choice[ci]; if (!o) return false;
    const c = o.cost ? o.cost(e) : 0; if (c > G.money) { msg('Zu wenig Geld', true); return false; } G.money -= c; e.ch = o.id; const r = o.fx(e); msg(d.ic + ' ' + r); sfx.buy(); save(); return true;
  }
  function krEvTick() {
    if (KR_NEUTRAL) return; const k = KR(), now = absMin();
    if (k.evNext < 0) k.evNext = now + 8 * HR;
    if (k.ev) {
      const e = k.ev;
      if (e.id === 'aufgabe' && !e.done && G.stat.del - e.b >= 6) { e.done = 1; krEndEvent(); return; }
      if ((e.id === 'gross' || e.id === 'besucher') && e.oid >= 0 && !G.orders.some(o => o.id === e.oid)) { krEndEvent(); return; }
      if (now >= e.end) krEndEvent();
      return;
    }
    if (now < k.evNext) return;
    const si = seasonI(), pool = Object.entries(EVENTS).filter(([id, d]) => (d.sea === undefined || d.sea === si) && (!d.cond || d.cond()) && !k.evLog.slice(-2).includes(id));
    let tot = 0; const ws = pool.map(([id, d]) => { const w = d.w * (d.wf ? d.wf() : 1) * (d.cat === 'neg' ? (k.tier <= 2 ? 0.4 : 1) : 1); tot += w; return w; });
    let r = Math.random() * tot; for (let i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) { krStartEvent(pool[i][0]); return; } }
    k.evNext = now + 4 * HR;
  }
  // ---------- Rufstufen-Aufstieg ----------
  function msVal(m) { const [t, n] = m; return t === 'del' ? G.stat.del : t === 'vip' ? G.stat.vip : t === 'quests' ? questsDone() : t === 'staff' ? Object.values(G.staff).reduce((a, b) => a + b, 0) : t === 'crewlv' ? crewMaxLv() : t === 'earned' ? G.earned : 0; }
  const msOk = m => msVal(m) >= m[1];
  const tierReady = () => { const k = KR(), nx = TIERS[k.tier]; return !!nx && G.rep >= nx.rep && nx.ms.every(msOk); };
  let tierShow = null;
  function krTierTick() {
    if (KR_NEUTRAL || tutOpen) return; if (tierShow && gt - tierShow.t > 25) tierClose(); if (tierShow) return; const k = KR(); if (!tierReady()) return;
    const T = TIERS[k.tier]; k.tier++; const rw = krReward(T.rw, null); if (k.tier === TIERS.length) { if (!k.titles.includes('Branchenlegende')) k.titles.push('Branchenlegende'); k.title = 'Branchenlegende'; }
    tierShow = { n: k.tier, name: T.name, rw, un: tierUn(k.tier - 1), t: gt }; save(); showTierUp();
  }
  function showTierUp() {
    const t = tierShow; if (!t) return; sfx.cash(); vibrate([30, 40, 60]);
    let el = document.getElementById('tierUp'); if (!el || !el.style) { el = document.createElement('div'); el.id = 'tierUp'; el.className = 'tierup'; if (document.body && document.body.appendChild) document.body.appendChild(el); }
    el.innerHTML = '<div class="tu-card' + (t.pres ? ' pres' : '') + '"><div class="tu-k">' + (t.pres ? 'PRESTIGE ✦' + t.pres : 'NEUE KATEGORIE · ' + t.n + ' / ' + TIERS.length) + '</div><div class="tu-n"></div><div class="tu-l">Belohnung</div><ul class="tu-rw"></ul><div class="tu-l">Neu freigeschaltet</div><ul class="tu-un"></ul><button class="tu-ok">Weiter</button></div>' + Array.from({ length: 24 }, (_, i) => '<i class="tu-c" style="left:' + ((i * 37) % 100) + '%;animation-delay:' + ((i % 8) * 0.12).toFixed(2) + 's;background:' + ['#FFD24A', '#63FF9A', '#FF8FD0', '#5CB8FF'][i % 4] + '"></i>').join('');
    el.querySelector('.tu-n').textContent = t.name;
    const ul = el.querySelector('.tu-rw'); (t.rw.length ? t.rw : ['Ruhm und Ehre']).forEach(x => { const li = document.createElement('li'); li.textContent = x; ul.appendChild(li); });
    const u2 = el.querySelector('.tu-un'); t.un.forEach(x => { const li = document.createElement('li'); li.textContent = x; u2.appendChild(li); });
    el.hidden = false; el.style.display = 'flex';
    el.querySelector('.tu-ok').addEventListener('click', tierClose);
  }
  function tierClose() { const el = document.getElementById('tierUp'); if (el && el.style) { el.hidden = true; el.style.display = 'none'; } tierShow = null; }
  // ---------- Ticks ----------
  let krT = 0;
  function krUpdate(dt) {
    if (!G || state !== 'play') return;
    if (KR_NEUTRAL) return;
    krT -= dt; if (krT > 0) return; krT = 0.5;
    const k = KR();
    if (k.sk !== seasonYear() * 4 + seasonI()) { const first = k.sk < 0; k.sk = seasonYear() * 4 + seasonI(); if (!first) { const s = season(); msg(s.ic + ' ' + s.name + ' beginnt: ' + s.txt.slice(0, 2).join(', ')); sfx.ping(); } }
    krEvTick(); krTierTick(); collTick(); calTick(); // v155
  }
  // ---------- Welt: Charaktere, Sammelobjekte, Jahreszeit ----------
  function krNear() { if (KR_NEUTRAL || !G || player.fl || player.x < 0) return null; let best = null, bd = 40; for (const c of CHARS) { if (!charHere(c)) continue; const d = Math.hypot(player.x - c.x, player.y - c.y); if (d < bd) { bd = d; best = c; } } return best; }
  function weberSmoke(x, y) { // Straßengras: duenne Rauchfahne aus der Hand
    const hx = x + 5, hy = y - 2; ctx.fillStyle = '#F4F0E6'; ctx.fillRect(hx - 1, hy - .6, 4, 1.2); ctx.fillStyle = 'rgba(255,140,60,' + (.6 + .4 * Math.sin(gt * 6)).toFixed(2) + ')'; ctx.fillRect(hx + 3, hy - .6, 1, 1.2);
    for (let i = 0; i < 5; i++) { const ph = (gt * .45 + i / 5) % 1; ctx.globalAlpha = .4 * (1 - ph); ctx.fillStyle = '#C9CED6'; ctx.beginPath(); ctx.arc(hx + 4 + Math.sin(gt * 1.5 + i * 2) * 3 * ph, hy - 3 - ph * 20, 1.5 + ph * 3, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1;
  }
  function drawKrChars() {
    if (KR_NEUTRAL || !G) return;
    for (const c of CHARS) {
      if (!charHere(c) || !inView(c.x, c.y, 60)) continue; const q = qOf(c.id), rd = charReady(c), near = Math.hypot(player.x - c.x, player.y - c.y) < 120;
      const a = near ? Math.atan2(player.y - c.y, player.x - c.x) : Math.PI / 2;
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(c.x + 1, c.y + 8, 7, 3, 0, 0, TAU); ctx.fill();
      drawFigure(c.x, c.y, a, 0, c.look);
      if (c.id === 'weber' && !prReady()) weberSmoke(c.x, c.y);
      pill(c.name, c.x, c.y - 24, qDone(c) ? '#7FD08A' : '#FFD24A');
      if (rd) { const by = c.y - 40 + Math.sin(gt * 4) * 1.5; ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.arc(c.x, by, 6.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#1D2129'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(q.s >= c.steps.length ? '€' : '!', c.x, by + 0.5); ctx.textBaseline = 'alphabetic'; }
    }
    // Sammelobjekte
    const pts = collPoints(), m = KR().col[seasonYear() + '-' + seasonI()] || 0, C = COLL[seasonI()];
    pts.forEach((p, i) => { if (m & (1 << i) || !inView(p.x, p.y, 20)) return; const bo = Math.sin(gt * 3 + i) * 1.5; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(p.x, p.y + 5, 5, 2, 0, 0, TAU); ctx.fill(); ctx.save(); ctx.translate(p.x, p.y - 3 + bo);
      const si = seasonI(); if (si === 0) { ctx.fillStyle = '#1D1F24'; ctx.beginPath(); ctx.arc(0, -3.4, 2, 0, TAU); ctx.fill(); ctx.fillStyle = C.col[i % 4]; ctx.beginPath(); ctx.ellipse(0, 0.4, 3.8, 4.2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#1D1F24'; ctx.fillRect(-0.4, -3.6, 0.8, 8); for (const [dx, dy] of [[-2, -0.8], [2, -0.8], [-1.8, 2], [1.8, 2]]) { ctx.beginPath(); ctx.arc(dx, dy, 0.9, 0, TAU); ctx.fill(); } ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-2.6, -2.2, 1, 1); } // v155: Marienkäfer
      else if (si === 1) { ctx.fillStyle = C.col[i % 2]; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(-5, -1); ctx.quadraticCurveTo(0, -6, 5, -1); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(160,100,70,.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); for (let k = -2; k <= 2; k++) { ctx.moveTo(0, 4); ctx.lineTo(k * 1.8, -3); } ctx.stroke(); }
      else if (si === 2) { ctx.fillStyle = C.col[i % 2]; ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fill(); ctx.fillStyle = '#E8D2B0'; ctx.beginPath(); ctx.ellipse(0, -2.6, 2.4, 1.2, 0, 0, TAU); ctx.fill(); }
      else { ctx.fillStyle = 'rgba(207,239,255,.9)'; ctx.beginPath(); ctx.arc(0, -1, 4.2, 0, TAU); ctx.fill(); ctx.fillStyle = '#7A5A3E'; ctx.fillRect(-3.4, 2.4, 6.8, 2.2); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-1, -3, 1, 1); ctx.fillRect(1.2, -1, 1, 1); }
      ctx.restore(); if (Math.sin(gt * 5 + i * 2) > 0.85) { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.fillRect(p.x + 3, p.y - 9, 1.5, 1.5); } });
    // Wegweiser zum verfolgten Charakter
    const tc = CHAR_BY[KR().trk]; if (tc && charHere(tc)) { const d = Math.hypot(tc.x - player.x, tc.y - player.y); if (d > 60) { const a = Math.atan2(tc.y - player.y, tc.x - player.x), r0 = 34; ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(a); ctx.fillStyle = '#B36BFF'; ctx.strokeStyle = 'rgba(16,21,28,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(r0 + 18, 0); ctx.lineTo(r0 + 4, -7); ctx.lineTo(r0 + 8, 0); ctx.lineTo(r0 + 4, 7); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore(); const lx = player.x + Math.cos(a) * (r0 - 2), ly = player.y + Math.sin(a) * (r0 - 2); ctx.font = '800 7px sans-serif'; const t = tc.name.split(' ').pop() + ' · ' + Math.round(d / 10) + ' m', w = ctx.measureText(t).width + 8 || 40; ctx.fillStyle = 'rgba(16,21,28,.85)'; rr(lx - w / 2, ly - 5, w, 10, 5); ctx.fill(); ctx.fillStyle = '#E2CCFF'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(t, lx, ly + 0.3); ctx.textBaseline = 'alphabetic'; } }
  }
  const SEA_TREE = [['#1F4A32', '#2C6844', '#3C8A58'], ['#1E5530', '#2F7A44', '#4AA462'], ['#6A3418', '#B0581C', '#E09A2E'], ['#2E3A40', '#45535A', '#E8EEF4']];
  const treeCols = () => KR_NEUTRAL || !G ? SEA_TREE[0] : SEA_TREE[seasonI()];
  function drawSeasonFx() {
    if (KR_NEUTRAL || !G || state === 'edit') return; const si = seasonI(), out = 1 - (indoorK || 0); if (out < 0.05) return;
    const vw = viewX1 - viewX0, vh = viewY1 - viewY0;
    ctx.save(); ctx.globalAlpha = out;
    const tint = ['rgba(255,170,210,.04)', 'rgba(255,220,120,.05)', 'rgba(230,140,60,.06)', 'rgba(220,235,255,.10)'][si]; ctx.fillStyle = tint; ctx.fillRect(viewX0, viewY0, vw, vh);
    if (LOFX) { ctx.restore(); return; } // v128: nur die Farbstimmung, keine fallenden Blätter oder Flocken
    const n = si === 3 ? 70 : si === 1 ? 0 : 26;
    for (let i = 0; i < n; i++) {
      const s1 = (i * 97.13) % 1, s2 = (i * 57.71) % 1, sp = si === 3 ? 26 + s2 * 20 : 18 + s2 * 14, t = gt * sp;
      const x = viewX0 + ((s1 * vw + Math.sin(gt * 0.8 + i) * 18 + t * (si === 3 ? 0.2 : 0.6)) % vw + vw) % vw, y = viewY0 + ((s2 * vh + t) % vh);
      if (si === 3) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.arc(x, y, 1 + s1 * 1.4, 0, TAU); ctx.fill(); }
      else if (si === 0) { ctx.fillStyle = i % 2 ? 'rgba(255,190,220,.85)' : 'rgba(255,255,255,.8)'; ctx.save(); ctx.translate(x, y); ctx.rotate(gt * 2 + i); ctx.beginPath(); ctx.ellipse(0, 0, 2.2, 1.2, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      else { ctx.fillStyle = ['#E09A2E', '#B0581C', '#D8C040'][i % 3]; ctx.save(); ctx.translate(x, y); ctx.rotate(gt * 1.5 + i); ctx.beginPath(); ctx.ellipse(0, 0, 2.8, 1.4, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    }
    if (si === 1) for (let i = 0; i < 14; i++) { const s1 = (i * 97.13) % 1, s2 = (i * 57.71) % 1, x = viewX0 + s1 * vw + Math.sin(gt * 0.7 + i) * 10, y = viewY0 + s2 * vh + Math.cos(gt * 0.6 + i) * 8, a = 0.25 + 0.25 * Math.sin(gt * 2 + i); ctx.fillStyle = 'rgba(255,240,170,' + a.toFixed(2) + ')'; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill(); } // Sonnenstaub
    ctx.restore();
  }
  // ---------- HUD ----------
  let krHudT = 0;
  function krHud() {
    if (!G) return; krHudT -= 1; if (krHudT > 0) return; krHudT = 6;
    if (!(KR().tier >= 1 && KR().tier <= TIERS.length)) KR().tier = clamp(Math.floor(+KR().tier) || 1, 1, TIERS.length);
    weberFix();
    const k = KR(), T = TIERS[k.tier - 1], nx = TIERS[k.tier];
    const p = !nx ? 1 : clamp((G.rep - T.rep) / Math.max(1, nx.rep - T.rep), 0, 1) * 0.7 + (nx.ms.length ? nx.ms.filter(msOk).length / nx.ms.length : 1) * 0.3;
    setText('tierName', KR_NEUTRAL ? '' : (presLv() ? '✦' + presLv() + ' · ' : '') + T.name + (nx ? '' : ' ★'));
    try { const f = $('tierFill'); if (f && f.style) f.style.width = Math.round(p * 100) + '%'; } catch (e) {}
    const s = season(), e = k.ev && EVENTS[k.ev.id];
    setText('seaPill', KR_NEUTRAL ? '' : s.ic + calIcons() + ' ' + s.name + ' · Tag ' + seasonDay() + '/' + SEASON_DAYS + (e ? '  ' + e.ic + ' ' + e.name + (e.choice && !k.ev.ch ? ' ❗' : '') : ''));
  }
  // ---------- Handy: Karriere-App ----------
  function krCard(b, nm, pr, ds) { const c = document.createElement('div'); c.className = 'card'; c.innerHTML = '<div class="nm"></div><div class="pr"></div><div class="ds"></div>'; c.querySelector('.nm').innerHTML = nm; c.querySelector('.pr').textContent = pr || ''; if (!pr) c.querySelector('.pr').remove(); c.querySelector('.ds').innerHTML = ds || ''; b.appendChild(c); return c; }
  const krGrp = (b, t) => { const e = document.createElement('div'); e.className = 'grp'; e.textContent = t; b.appendChild(e); };
  const krBar = (c, p) => { const x = document.createElement('div'); x.className = 'bar'; x.innerHTML = '<i style="width:' + Math.round(clamp(p, 0, 1) * 100) + '%"></i>'; c.appendChild(x); };
  function renderRuf(b) {
    const k = KR(), T = TIERS[k.tier - 1], nx = TIERS[k.tier]; rufSeenG = G; rufSeen = k.tier;
    const c = krCard(b, presStars() + 'Kategorie ' + k.tier + ': ' + T.name, 'Ruf ' + G.rep + ' / ' + REP_MAX, nx ? 'Nächste Kategorie: <b>' + nx.name + '</b> ab Ruf ' + nx.rep + (k.title ? '<br>Dein Titel: <b style="color:var(--amber)">' + k.title + '</b>' : '') : 'Höchste Kategorie erreicht. Legende!' + (k.title ? '<br>Dein Titel: <b style="color:var(--amber)">' + k.title + '</b>' : ''));
    if (nx) {
      krBar(c, (G.rep - T.rep) / Math.max(1, nx.rep - T.rep));
      const ul = document.createElement('div'); ul.className = 'ds'; ul.style.cssText = 'grid-column:1/-1;margin-top:6px';
      ul.innerHTML = ['Ruf ' + G.rep + ' (nötig: ' + nx.rep + ')'].concat(nx.ms.map(m => m[2] + ' · ' + (m[0] === 'earned' ? fmt(Math.min(msVal(m), m[1])) + ' / ' + fmt(m[1]) : Math.min(msVal(m), m[1]) + ' / ' + m[1]))).map((t, i) => (i === 0 ? (G.rep >= nx.rep ? '✅ ' : '⬜ ') : (msOk(nx.ms[i - 1]) ? '✅ ' : '⬜ ')) + t).join('<br>');
      c.appendChild(ul);
      // v86: zeigt, was zum Aufstieg noch fehlt (Ruf allein reicht nicht, alle Meilensteine muessen erfuellt sein)
      const miss = (G.rep >= nx.rep ? [] : ['Ruf ' + G.rep + ' / ' + nx.rep]).concat(nx.ms.filter(m => !msOk(m)).map(m => m[2]));
      const fx = document.createElement('div'); fx.className = 'ds'; fx.style.cssText = 'grid-column:1/-1;margin-top:6px;color:var(--amber)';
      fx.innerHTML = miss.length ? '<b>Für den Aufstieg fehlt noch:</b><br>' + miss.map(t => '• ' + t).join('<br>') : 'Alle Bedingungen erfüllt, der Aufstieg kommt gleich.';
      c.appendChild(fx);
      if (nx.ms.some(m => m[0] === 'quests' && !msOk(m))) {
        const o = document.createElement('div'); o.className = 'ds'; o.style.cssText = 'grid-column:1/-1;margin-top:6px';
        o.innerHTML = '<b>Offene Questketten:</b><br>' + CHARS.filter(x => !qDone(x)).map(x => { const q = KR().q[x.id], n = q ? q.s : 0; return '• ' + x.name + ': ' + (!charUnlocked(x) ? 'noch gesperrt (ab Kategorie ' + x.tier + (x.reqTxt ? ', ' + x.reqTxt : '') + ')' : n + ' / ' + x.steps.length + ' Schritte') + (x.sea !== undefined ? ' · nur im ' + SEASONS[x.sea].name : ''); }).join('<br>');
        c.appendChild(o);
      }
    }
    renderPrestige(b);
    const pk = Object.entries(k.perk).filter(([, v]) => v); if (pk.length) krCard(b, 'Dauerhafte Boni', '', pk.map(([p, v]) => PERK_NAME[p] + ' ' + (v > 0 ? '+' : '') + Math.round(v * 100) + ' %').join(' · '));
    if (k.titles.length) { const t = krCard(b, 'Titel', k.titles.length + '', 'Wähle deinen Titel:'); const row = document.createElement('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;grid-column:1/-1'; k.titles.forEach(x => { const bt = document.createElement('button'); bt.className = 'chip' + (k.title === x ? ' on' : ''); bt.textContent = x; bt.addEventListener('click', () => { k.title = x; save(); renderPhone(); }); row.appendChild(bt); }); t.appendChild(row); }
    krGrp(b, 'Alle Kategorien');
    TIERS.forEach((t, i) => { const got = k.tier > i; const rw = []; if (t.rw.cash) rw.push(fmt(t.rw.cash)); if (t.rw.perk) for (const [p, v] of Object.entries(t.rw.perk)) rw.push(PERK_NAME[p] + ' ' + (v > 0 ? '+' : '') + Math.round(v * 100) + ' %'); for (const wid of [].concat(t.rw.wear || [])) if (WEAR_BY[wid]) rw.push(WEAR_BY[wid].name + (WEAR_BY[wid].qx ? ' (exklusiv)' : '')); if (t.rw.cos) { const cs = COS.find(x => x.id === t.rw.cos); if (cs) rw.push(cs.name); }
      krCard(b, (got ? '✅ ' : '🔒 ') + (i + 1) + '. ' + t.name, 'Ruf ' + t.rep, (t.ms.length ? 'Meilensteine: ' + t.ms.map(m => m[2]).join(', ') + '<br>' : '') + (rw.length ? 'Belohnung: ' + rw.join(', ') + '<br>' : '') + 'Schaltet frei: ' + (tierUn(i).join(', ') || 'Platz für neue Quests')); });
    const info = document.createElement('div'); info.className = 'ds'; info.style.margin = '8px 2px'; info.textContent = 'Ruf bekommst du für Lieferungen, pünktliche Kunden, Questketten und Ereignisse. Alle 10 Ruf wartet eine neue Kategorie, bei Ruf 100 ist Schluss. Pro Spieltag zählen viele gleiche Lieferungen irgendwann weniger. Ab Ruf 100 kannst du mit Prestige neu beginnen.'; b.appendChild(info);
  }
  // ---------- v112: Spielstand sichern und laden (Code oder Datei) ----------
  const SAVE_PFX = 'KG1:';
  function saveCode() { save(); const raw = store.get(SAVE_KEY, null) || JSON.stringify(saveObj()); return SAVE_PFX + btoa(unescape(encodeURIComponent(raw))); }
  function readCode(txt) {
    let t = String(txt || '').trim().replace(/\s+/g, ''); if (t.startsWith(SAVE_PFX)) t = t.slice(SAVE_PFX.length);
    let raw = ''; try { raw = t.startsWith('{') ? t : decodeURIComponent(escape(atob(t))); } catch (e) { return null; }
    try { const o = JSON.parse(raw); return o && typeof o === 'object' && Number.isFinite(+o.money) && o.ver !== undefined ? raw : null; } catch (e) { return null; }
  }
  function importCode(txt) {
    const raw = readCode(txt); if (!raw) return 'Das ist kein gültiger Spielstand-Code.';
    const keep = store.get(SAVE_KEY, null); backupSave(); store.set(SAVE_KEY, raw);
    if (!load()) { if (keep) store.set(SAVE_KEY, keep); load(); return 'Der Spielstand ließ sich nicht laden. Nichts wurde geändert.'; }
    closePhone(); begin(false); msg('Spielstand geladen'); return '';
  }
  function saveIoCard() {
    const c = document.createElement('div'); c.className = 'card look';
    c.innerHTML = '<div class="nm">💾 Spielstand sichern und laden</div><div class="ds" style="margin:2px 0 8px">Sichere deinen Spielstand als Code oder Datei, zum Beispiel vor einem Gerätewechsel. Beim Laden wird dein jetziger Stand ersetzt (eine Sicherung bleibt).</div>';
    const row = document.createElement('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;grid-column:1/-1';
    const ta = document.createElement('textarea'); ta.className = 'iocode'; ta.placeholder = 'Code hier einfügen …'; ta.rows = 3; ta.spellcheck = false;
    const note = document.createElement('div'); note.className = 'ds'; note.style.cssText = 'grid-column:1/-1;margin-top:6px;min-height:1em';
    const mk = (t, fn, alt) => { const bt = document.createElement('button'); bt.className = 'buy' + (alt ? ' alt' : ''); bt.style.flex = '1 1 130px'; bt.textContent = t; bt.addEventListener('click', fn); row.appendChild(bt); };
    mk('Code kopieren', () => { const code = saveCode(); ta.value = code; let done = false; try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(code).then(() => { note.textContent = 'Code kopiert (' + Math.round(code.length / 1024) + ' KB). Bewahre ihn gut auf.'; }, () => { ta.select(); note.textContent = 'Code steht im Feld, bitte selbst kopieren.'; }); done = true; } } catch (e) {} if (!done) { ta.select(); note.textContent = 'Code steht im Feld, bitte selbst kopieren.'; } });
    mk('Als Datei sichern', () => { try { const blob = new Blob([saveCode()], { type: 'text/plain' }), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kellergruen-tag' + G.day + '.txt'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); note.textContent = 'Datei wird gespeichert.'; } catch (e) { note.textContent = 'Datei geht hier nicht, nimm den Code.'; } }, true);
    const fi = document.createElement('input'); fi.type = 'file'; fi.accept = '.txt,.json,text/plain'; fi.hidden = true;
    fi.addEventListener('change', () => { const f = fi.files && fi.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { ta.value = String(r.result || ''); note.textContent = 'Datei gelesen. Tippe auf „Code laden“.'; }; r.readAsText(f); });
    mk('Datei öffnen', () => fi.click(), true);
    let sure = false;
    mk('Code laden', () => { if (!readCode(ta.value)) { note.textContent = 'Bitte zuerst einen gültigen Code einfügen.'; return; } if (!sure) { sure = true; note.innerHTML = '<b style="color:var(--amber)">Nochmal tippen zum Bestätigen.</b> Dein jetziger Stand wird ersetzt.'; return; } const err = importCode(ta.value); if (err) note.textContent = err; });
    ta.addEventListener('keydown', e => e.stopPropagation()); ta.addEventListener('keyup', e => e.stopPropagation());
    c.appendChild(ta); c.appendChild(row); c.appendChild(fi); c.appendChild(note); return c;
  }
  // ---------- v112: Prestige ----------
  const presStars = () => presLv() ? '✦' + presLv() + ' ' : '';
  const presCan = () => !!G && G.rep >= REP_MAX && presLv() < PRES_MAX;
  const presKeepCash = () => Math.floor(((G.money || 0) + (G.bank || 0)) * 0.1);
  const presKeepMax = P => 30000 * P; // v121: Startgeld gedeckelt, sonst ist der Neuanfang keiner
  const presStart = P => 1500 * P + Math.min(presKeepCash(), presKeepMax(P));
  let presAsk = false;
  function renderPrestige(b) {
    const P = presLv(), n = P + 1, pct = v => Math.round(v * 100) + '\u00a0%';
    krGrp(b, 'Prestige');
    const bon = P ? 'Deine Boni: Kundenpreise +' + pct(presPrice() - 1) + ', Wachstum +' + pct(presGrow() - 1) + ', Ruf +' + pct(presRep() - 1) + '.' : 'Noch kein Prestige.';
    if (P >= PRES_MAX) { krCard(b, '✦' + P + ' Höchstes Prestige', 'Stufe ' + P + ' / ' + PRES_MAX, bon + '<br>Mehr geht nicht. Du hast alles gesehen!'); return; }
    const it = WEAR_BY[PRES_ITEM[n]];
    const c = krCard(b, 'Nächstes Prestige: ✦' + n + ' von ' + PRES_MAX, G.rep >= REP_MAX ? 'bereit' : 'ab Ruf ' + REP_MAX, bon + '<br><br><b>Du fängst von vorn an</b>, mit Ruf 0, ohne Gebäude, Läden, Helfer und Ausbauten.<br><b>Du behältst:</b> Kleidung, Kosmetik, Deko, Fahrzeuge, Waffen, Haustiere, Ziele, Titel, Questfortschritt und ' + fmt(1500 * n) + ' plus 10\u00a0% deines Vermögens (höchstens ' + fmt(presKeepMax(n)) + ') als Startgeld (gerade ' + fmt(presStart(n)) + ').<br><b>Dauerhaft dazu:</b> je Stufe Kundenpreise +4\u00a0%, Wachstum +4\u00a0%, Ruf +8\u00a0%, ' + n + ' Töpfe mehr, bessere Tasche' + (n >= 2 ? ', besseres Saatgut und Lampen' : ', bessere Lampen') + ' von Anfang an, der Prestige-Pokal und exklusiv: <b>' + (it ? it.name : '') + '</b>.');
    if (!presCan()) { krBar(c, G.rep / REP_MAX); presAsk = false; return; }
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;margin-top:8px;grid-column:1/-1;flex-wrap:wrap';
    const mk = (t, cls, fn) => { const bt = document.createElement('button'); bt.className = 'buy' + (cls ? ' ' + cls : ''); bt.style.flex = '1 1 140px'; bt.textContent = t; bt.addEventListener('click', fn); row.appendChild(bt); };
    if (!presAsk) mk('✦ Prestige ' + n + ' starten', 'pres', () => { presAsk = true; renderPhone(); });
    else { const w = document.createElement('div'); w.className = 'ds'; w.style.cssText = 'grid-column:1/-1;margin-top:8px;color:var(--amber)'; w.innerHTML = '<b>Wirklich neu beginnen?</b> Das lässt sich nicht rückgängig machen. Dein jetziger Spielstand wird vorher als Sicherung gespeichert.'; c.appendChild(w); mk('Abbrechen', 'alt', () => { presAsk = false; renderPhone(); }); mk('Ja, Prestige ' + n, 'pres', () => { presAsk = false; doPrestige(); }); }
    c.appendChild(row);
  }
  function doPrestige() {
    if (!presCan()) return false;
    const cur = JSON.parse(signSave(saveObj())), P = presLv() + 1, start = presStart(P), oldG = G;
    backupSave(); store.set(SAVE_KEY + '.prest', JSON.stringify(cur));
    newGame(); const f = saveObj(); G = oldG;
    for (const key of ['look', 'wear', 'cos', 'wpn', 'dec', 'lay', 'ach', 'stat', 'tut', 'lg', 'gang']) if (cur[key] !== undefined) f[key] = JSON.parse(JSON.stringify(cur[key]));
    f.veh = JSON.parse(JSON.stringify(cur.veh)); f.veh.on = false;
    const ok = cur.kr || {}, nk = f.kr; nk.q = JSON.parse(JSON.stringify(ok.q || {})); nk.titles = (ok.titles || []).slice(); nk.title = ok.title || ''; nk.perk = Object.assign({}, ok.perk || {}); nk.troph = Object.assign({}, ok.troph || {}); nk.col = Object.assign({}, ok.col || {}); nk.cnt = Object.assign({}, nk.cnt, ok.cnt || {});
    for (const q of Object.values(nk.q)) if (q && typeof q === 'object') q.b = 0;
    f.flag = cur.flag; f.cmdU = cur.cmdU; f.money = start; f.bank = 0; f.prest = P; f.prN = (G.prN || 0) + 1; f.rep = 0; f.repP = 0;
    f.up.pots += P; f.up.grow += Math.ceil(P / 2); f.up.seed += Math.floor(P / 2); f.up.bag += P;
    const it = PRES_ITEM[P]; if (it) f.wear.owned[it] = true;
    f.dec.owned.prtrophy = (f.dec.owned.prtrophy || 0) + 1;
    if (!nk.titles.includes('Prestige ' + P)) nk.titles.push('Prestige ' + P);
    store.set(SAVE_KEY, signSave(f));
    if (!load()) { store.set(SAVE_KEY, JSON.stringify(cur)); load(); return false; }
    closePhone(); retireNote = '✦ Prestige ' + P + ': alles von vorn, aber stärker'; begin(false);
    const pc = v => Math.round((v - 1) * 100) + '\u00a0%';
    tierShow = { n: 0, pres: P, name: 'Neuer Anfang', rw: ['Startgeld ' + fmt(start), 'Kundenpreise +' + pc(presPrice()) + ', Wachstum +' + pc(presGrow()), 'Ruf +' + pc(presRep()) + ' schneller', P + ' Töpfe mehr und bessere Ausrüstung', (WEAR_BY[it] ? WEAR_BY[it].name : '') + ' (exklusiv)', 'Prestige-Pokal (Deko)'], un: ['Alle Kategorien und Läden neu erspielen', 'Deine Questketten laufen weiter'], t: gt }; showTierUp();
    return true;
  }
