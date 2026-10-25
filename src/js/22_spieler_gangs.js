  // ---------- v121: Eigene Gangs mit Hauptquartier (Firestore gangs/<id>) ----------
  // Eine Gang: Name, Kuerzel, Farbe, Mitglieder (Boss, Vize, Mitglied), gemeinsame Kasse, Chat, Logbuch und ein Hauptquartier,
  // das alle Mitglieder zusammen einrichten. Das HQ liegt im Gangviertel (Haus der Gangs), drinnen sieht jede Gang ihr eigenes.
  const fsV = v => v === null || v === undefined ? { nullValue: null } : typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }) : typeof v === 'string' ? { stringValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(fsV) } } : { mapValue: { fields: fsF(v) } };
  const fsF = o => { const f = {}; for (const [k, v] of Object.entries(o)) if (v !== undefined) f[k] = fsV(v); return f; };
  const fsU = x => !x ? null : 'stringValue' in x ? x.stringValue : 'integerValue' in x ? +x.integerValue : 'doubleValue' in x ? +x.doubleValue : 'booleanValue' in x ? x.booleanValue : 'mapValue' in x ? fsO(x.mapValue.fields) : 'arrayValue' in x ? (x.arrayValue.values || []).map(fsU) : null;
  const fsO = f => { const o = {}; for (const [k, v] of Object.entries(f || {})) o[k] = fsU(v); return o; };
  const fpath = (...p) => p.map(s => /^[A-Za-z_][A-Za-z_0-9]*$/.test(s) ? s : '`' + String(s).replace(/[`\\]/g, m => '\\' + m) + '`').join('.');
  const fsDocName = p => 'projects/' + FB.projectId + '/databases/(default)/documents/' + p;
  async function fsReq(method, path, body, masks, extra) {
    const t = await accToken(), q = (masks || []).map(m => 'updateMask.fieldPaths=' + encodeURIComponent(m)).concat(extra ? [extra] : []).join('&');
    try { return await fetch(fsBase() + path + (q ? '?' + q : ''), { method, headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); } catch (e) { throw new Error('Keine Verbindung zum Server.'); }
  }
  async function fsCommit(writes) {
    const t = await accToken(); let r;
    try { r = await fetch(fsBase().replace(/\/$/, '') + ':commit', { method: 'POST', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ writes }) }); } catch (e) { throw new Error('Keine Verbindung zum Server.'); }
    return r;
  }
  const PG_COST = 10000, PG_REP = 20, PG_CHAT = 140;
  const GCOL = ['#FF5C7A', '#FFB547', '#FFD24A', '#5FE584', '#4BC8FF', '#B58CFF', '#FF8FD0', '#E8ECF2'];
  const GFLOOR = [['#2A2F38', '#3A414C', 'Beton'], ['#4A3326', '#5C4030', 'Holzdielen'], ['#1C2638', '#28344A', 'Nachtblau'], ['#26362A', '#324636', 'Waldgrün'], ['#3A1E2E', '#4A283C', 'Weinrot'], ['#3A3630', '#4A453C', 'Industrie'], ['#141418', '#24242C', 'Schwarz'], ['#3C3A48', '#4C4A5A', 'Marmor']];
  const GHQ_UP = [50000, 120000, 250000, 500000, 1000000];
  const ghqSlots = lv => 8 + 4 * clamp(lv || 0, 0, 5), gMemMax = lv => 6 + 2 * clamp(lv || 0, 0, 5);
  const GSLOT = []; for (const y of [176, 252, 328, 404]) for (const x of [168, 232, 296, 360, 424, 488, 552]) GSLOT.push({ x, y }); // 28 Plaetze im Raster (v123: links Platz fuer die Gang-Beete)
  const GHQ_EXIT = { x: 410, y: 482 }, GHQ_SAFE = { x: 536, y: 104 }, GHQ_BOARD = { x: 120, y: 96 };
  R(370, 508, 80, T).fl = 4; R(600, 400, T, 100).fl = 4; const GHQ_SAFE_R = R(GHQ_SAFE.x - 24, GHQ_SAFE.y - 30, 48, 40); GHQ_SAFE_R.fl = 4; const GHQ_BOARD_R = R(GHQ_BOARD.x - 40, GHQ_BOARD.y - 30, 80, 26); GHQ_BOARD_R.fl = 4;
  const GHQ_HOUSE = HOUSES.find(h => h.gang && h.x === 4840) || HOUSES.find(h => h.gang);
  const GHQ_AT = GHQ_HOUSE ? { x: GHQ_HOUSE.dx, y: GHQ_HOUSE.dy } : { x: -9999, y: -9999 };
  const ghqDeco = () => DECOR.filter(d => !d.qx && d.cost > 1);
  const ghqPrice = d => Math.max(1000, Math.round(d.cost * 20 / 100) * 100);
  let pgang = null, pgErr = '', pgBusy = false, pgPollT = 3, pgSeg = 'info', pgList = null, pgListErr = '', pgSel = -1, pgLastChat = 0;
  const myGid = () => (G && G.gang && G.gang.id) || '';
  const pgMember = () => !!(pgang && acc && pgang.mem && pgang.mem[acc.uid] && !(G.gang && G.gang.req));
  const pgLead = () => pgMember() && (pgang.own === acc.uid || pgang.mem[acc.uid].r === 'vize');
  const pgBoss = () => pgMember() && pgang.own === acc.uid;
  const pgReqN = () => pgLead() ? Object.keys(pgang.req || {}).length : 0; // v123: offene Beitrittsanfragen (nur fuer Boss und Vize)
  const pgPrice = () => pgMember() ? 1 + 0.01 * clamp(pgang.lv || 0, 0, 5) : 1;
  const gTag = () => (G && G.gang && !G.gang.req && G.gang.tag) || '';
  function cleanGangSave(o) { if (!o || typeof o !== 'object' || typeof o.id !== 'string' || !/^[a-z0-9]{6,20}$/.test(o.id)) return null; return { id: o.id, tag: String(o.tag || '').replace(/[^A-Z0-9]/g, '').slice(0, 4), n: mpClean(o.n || '', 20), col: clamp(Math.floor(+o.col) || 0, 0, GCOL.length - 1), req: o.req ? 1 : 0, rd: Math.max(0, +o.rd || 0) }; }
  function pgParse(j) {
    const o = fsO(j.fields); o.id = j.name.split('/').pop(); o.ut = j.updateTime;
    o.mem = o.mem && typeof o.mem === 'object' ? o.mem : {}; o.req = o.req && typeof o.req === 'object' ? o.req : {}; o.deco = o.deco && typeof o.deco === 'object' ? o.deco : {};
    o.chat = Array.isArray(o.chat) ? o.chat.filter(m => m && typeof m.m === 'string') : []; o.log = Array.isArray(o.log) ? o.log.filter(x => typeof x === 'string') : [];
    o.dk = o.dk && typeof o.dk === 'object' ? o.dk : {}; o.don = o.don && typeof o.don === 'object' ? o.don : {}; o.ann = typeof o.ann === 'string' ? o.ann.slice(0, 140) : '';
    o.beet = o.beet && typeof o.beet === 'object' ? o.beet : {}; o.wz = o.wz && typeof o.wz === 'object' ? o.wz : null; o.rk = o.rk && typeof o.rk === 'object' ? o.rk : null; o.rkl = o.rkl && typeof o.rkl === 'object' ? o.rkl : null; o.go = o.go && typeof o.go === 'object' ? o.go : null; o.rkc = Math.floor(+o.rkc || 0);
    o.kasse = Math.max(0, Math.floor(+o.kasse || 0)); o.lv = clamp(Math.floor(+o.lv || 0), 0, 5); o.floor = clamp(Math.floor(+o.floor || 0), 0, GFLOOR.length - 1); o.col = clamp(Math.floor(+o.col || 0), 0, GCOL.length - 1);
    return o;
  }
  async function pgFetch(id) { const r = await fsReq('GET', 'gangs/' + id); if (r.status === 404) return null; if (!r.ok) throw new Error('Gang gerade nicht erreichbar (' + r.status + '). Sind die neuen Firebase-Regeln veröffentlicht?'); return pgParse(await r.json()); }
  async function pgRefresh() {
    if (!fbOk() || !accOn() || !myGid()) { pgang = null; return; }
    const id = myGid(), g = await pgFetch(id); if (myGid() !== id) return;
    if (!g) { const was = G.gang && !G.gang.req; G.gang = null; pgang = null; msg(was ? 'Deine Gang wurde aufgelöst.' : 'Die Gang gibt es nicht mehr.', true); save(); return; }
    const me = g.mem[acc.uid];
    if (G.gang.req) { if (me) { G.gang.req = 0; msg('🎉 Du bist jetzt in der Gang ' + g.n + '!', false, 'ok'); sfx.cash(); } else if (!g.req[acc.uid]) { G.gang = null; pgang = null; msg('Deine Anfrage bei ' + g.n + ' wurde abgelehnt.', true); save(); return; } }
    else if (!me) { G.gang = null; pgang = null; msg('Du bist nicht mehr in der Gang ' + g.n + '.', true); if (player.fl === 4) ghqLeave(); save(); return; }
    // neue Chat-Nachrichten melden
    const last = g.chat.length ? Math.max(...g.chat.map(m => +m.t || 0)) : 0;
    if (pgang && last > pgLastChat && !(phoneOpen && (tab === 'g_chat' || (tab === 'gang' && pgSeg === 'chat')))) { const m = g.chat.filter(x => +x.t === last)[0]; if (m && m.u !== acc.uid) msg('💬 [' + g.tag + '] ' + m.n + ': ' + m.m); }
    if (pgang && g.mem[acc.uid] && (g.own === acc.uid || g.mem[acc.uid].r === 'vize')) for (const [u, q] of Object.entries(g.req)) if (!pgang.req[u]) { msg('🙋 ' + q.n + ' möchte deiner Gang beitreten · Handy → Freunde → Gang'); sfx.ping(); } // v123
    pgLastChat = last; pgang = g; Object.assign(G.gang, { tag: g.tag, n: g.n, col: g.col }); ghqApplyLay(); // v133
    if (pgMember() && (g.chat.length > 60 || g.log.length > 40) && pgLead()) pgTrim().catch(() => {});
  }
  async function pgTrim() { await fsReq('PATCH', 'gangs/' + pgang.id, { fields: fsF({ chat: pgang.chat.slice(-40), log: pgang.log.slice(-25) }) }, ['chat', 'log'], 'currentDocument.updateTime=' + encodeURIComponent(pgang.ut)); }
  let pgFound = '', gbBusy = false;
  async function pgFind() { // Spielstand weiss nichts von einer Gang (z. B. anderes Geraet): in der Gang-Liste nachsehen
    const r = await fsReq('GET', 'gangs', null, null, 'pageSize=300&' + ['n', 'tag', 'col', 'mem', 'req'].map(f => 'mask.fieldPaths=' + f).join('&')); if (!r.ok) return;
    const j = await r.json(); for (const d of j.documents || []) { const g = pgParse(d), m = g.mem[acc.uid], q = g.req[acc.uid]; if (m || q) { G.gang = { id: g.id, tag: g.tag, n: g.n, col: g.col, req: m ? 0 : 1, rd: Date.now() }; pgPollT = 0; save(); return; } }
  }
  function pgTick(dt) {
    if (!G || !fbOk() || !accOn()) return;
    if (!myGid()) { if (pgFound !== acc.uid && !pgBusy) { pgFound = acc.uid; pgBusy = true; pgFind().catch(() => {}).finally(() => { pgBusy = false; }); } return; }
    if (pgMember() && !pgBusy) wzFlush().catch(() => {}); // v123
    if (pgMember() && Date.now() - rkT > 600000) rkLoad().catch(() => {}); // v128: Revier-Stand alle 10 Minuten
    pgPollT -= dt; if (pgPollT > 0 || pgBusy) return;
    pgPollT = pgOpenTab() || player.fl === 4 ? 8 : 60; pgBusy = true;
    pgRefresh().then(() => { pgErr = ''; }, e => { pgErr = e.message || 'Fehler'; }).finally(() => { pgBusy = false; if (pgOpenTab() && !pgTyping()) renderPhone(); pgAppSync(); });
  }
  const pgTyping = () => { try { const a = document.activeElement; return !!(a && a.id && /^gc|^gn/.test(a.id)); } catch (e) { return false; } };
  const gLog = t => Date.now() + '|' + (acc ? acc.name : '?') + '|' + t;
  const gTransform = (fts) => ({ transform: { document: fsDocName('gangs/' + pgang.id), fieldTransforms: fts } });
  async function pgCreate(name, tag, col) {
    if (!fbOk() || !accOn()) throw new Error('Gangs gibt es nur mit Konto.'); if (myGid()) throw new Error('Du bist schon in einer Gang.');
    if (G.rep < PG_REP) throw new Error('Eine Gang gründen kannst du ab Ruf ' + PG_REP + '.'); if (G.money < PG_COST) throw new Error('Du brauchst ' + fmt(PG_COST) + ' Bargeld.');
    const n = mpClean(name, 20), tg = String(tag || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
    if (n.length < 3) throw new Error('Der Name braucht mindestens 3 Zeichen.'); if (tg.length < 2) throw new Error('Das Kürzel braucht 2 bis 4 Buchstaben oder Zahlen.');
    const id = Array.from(crypto.getRandomValues(new Uint8Array(10)), b => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join(''), now = Date.now();
    const doc = { n, tag: tg, col: clamp(col | 0, 0, GCOL.length - 1), own: acc.uid, ts: now, open: true, lock: false, kasse: 0, lv: 0, floor: 0, mem: { [acc.uid]: { n: acc.name, r: 'boss', j: now } }, req: {}, deco: {}, chat: [], log: [now + '|' + acc.name + '|hat die Gang gegründet'] };
    const r = await fsReq('PATCH', 'gangs/' + id, { fields: fsF(doc) }, null, 'currentDocument.exists=false');
    if (!r.ok) throw new Error('Gründen ging nicht (' + r.status + '). Sind die neuen Firebase-Regeln veröffentlicht?');
    G.money -= PG_COST; G.gang = { id, tag: tg, n, col: doc.col, req: 0, rd: now }; pgang = pgParse(await r.json()); sfx.cash(); save(); return true;
  }
  async function pgListLoad() {
    pgListErr = ''; const r = await fsReq('GET', 'gangs', null, null, 'pageSize=100&' + ['n', 'tag', 'col', 'open', 'lv', 'mem', 'own'].map(f => 'mask.fieldPaths=' + f).join('&'));
    if (!r.ok) { pgListErr = 'Gang-Liste gerade nicht lesbar (' + r.status + ').'; pgList = []; return; }
    const j = await r.json(); pgList = (j.documents || []).map(pgParse).sort((a, b) => Object.keys(b.mem).length - Object.keys(a.mem).length);
  }
  async function pgJoin(g) {
    if (myGid()) throw new Error('Du bist schon in einer Gang.'); const now = Date.now();
    if (Object.keys(g.mem).length >= gMemMax(g.lv)) throw new Error('Die Gang ist voll.');
    const r = g.open ? await fsReq('PATCH', 'gangs/' + g.id, { fields: fsF({ mem: { [acc.uid]: { n: acc.name, r: 'mitglied', j: now } } }) }, [fpath('mem', acc.uid)]) : await fsReq('PATCH', 'gangs/' + g.id, { fields: fsF({ req: { [acc.uid]: { n: acc.name, t: now } } }) }, [fpath('req', acc.uid)]);
    if (!r.ok) throw new Error('Ging nicht (' + r.status + ').');
    G.gang = { id: g.id, tag: g.tag, n: g.n, col: g.col, req: g.open ? 0 : 1, rd: now }; pgang = pgParse(await r.json()); save();
    if (g.open) { try { await fsCommit([gTransform([{ fieldPath: 'log', appendMissingElements: { values: [fsV(gLog('ist beigetreten'))] } }])]); } catch (e) {} }
    return g.open;
  }
  async function pgCancelReq() { const id = myGid(); if (!id) return; await fsReq('PATCH', 'gangs/' + id, { fields: {} }, [fpath('req', acc.uid)]); G.gang = null; pgang = null; save(); }
  async function pgSet(fields, masks, log) {
    const r = await fsReq('PATCH', 'gangs/' + pgang.id, { fields: fsF(fields) }, masks); if (!r.ok) throw new Error('Ging nicht (' + r.status + ').'); pgang = pgParse(await r.json());
    if (log) { try { await fsCommit([gTransform([{ fieldPath: 'log', appendMissingElements: { values: [fsV(gLog(log))] } }])]); pgang.log.push(gLog(log)); } catch (e) {} }
  }
  async function pgAccept(uid, ok) {
    if (!pgLead()) throw new Error('Nur Boss und Vize.'); const q = pgang.req[uid]; if (!q) return;
    if (ok && Object.keys(pgang.mem).length >= gMemMax(pgang.lv)) throw new Error('Die Gang ist voll. Baut das Hauptquartier aus.');
    await pgSet(ok ? { mem: { [uid]: { n: q.n, r: 'mitglied', j: Date.now() } } } : {}, ok ? [fpath('mem', uid), fpath('req', uid)] : [fpath('req', uid)], ok ? 'hat ' + q.n + ' aufgenommen' : '');
  }
  async function pgKick(uid) { if (!pgLead() || uid === pgang.own || uid === acc.uid) throw new Error('Geht nicht.'); const n = (pgang.mem[uid] || {}).n; await pgSet({}, [fpath('mem', uid)], 'hat ' + n + ' rausgeworfen'); }
  async function pgRole(uid, r) { if (!pgBoss() || uid === acc.uid || !pgang.mem[uid]) throw new Error('Nur der Boss.'); await pgSet({ mem: { [uid]: { r } } }, [fpath('mem', uid, 'r')], 'hat ' + pgang.mem[uid].n + ' zum ' + (r === 'vize' ? 'Vize' : 'Mitglied') + ' gemacht'); }
  async function pgLeave() {
    if (!pgang || !pgMember()) { await pgCancelReq(); return; }
    const others = Object.entries(pgang.mem).filter(([u]) => u !== acc.uid);
    if (pgBoss()) {
      if (!others.length) { const r = await fsReq('DELETE', 'gangs/' + pgang.id); if (!r.ok && r.status !== 404) throw new Error('Ging nicht (' + r.status + ').'); }
      else { const nx = (others.find(([, m]) => m.r === 'vize') || others.sort((a, b) => (a[1].j || 0) - (b[1].j || 0))[0])[0];
        await pgSet({ own: nx, mem: { [nx]: { r: 'boss' } } }, ['own', fpath('mem', nx, 'r'), fpath('mem', acc.uid)], 'hat die Gang verlassen, neuer Boss: ' + pgang.mem[nx].n); }
    } else await pgSet({}, [fpath('mem', acc.uid)], 'hat die Gang verlassen');
    if (player.fl === 4) ghqLeave(); G.gang = null; pgang = null; save();
  }
  async function pgDeposit(v, fromBank) { // v126: mit Online-Banking auch vom Konto
    const src = fromBank && bankLv() >= 1 ? 'bank' : 'money'; v = Math.floor(Math.min(v, G[src] || 0)); if (!pgMember() || v <= 0) return false;
    G[src] -= v; save();
    try { const r = await fsCommit([gTransform([{ fieldPath: 'kasse', increment: { integerValue: String(v) } }, { fieldPath: fpath('don', acc.uid), increment: { integerValue: String(v) } }, { fieldPath: 'log', appendMissingElements: { values: [fsV(gLog('hat ' + fmt(v) + ' eingezahlt'))] } }])]); if (!r.ok) throw new Error('Einzahlen ging nicht (' + r.status + ').'); }
    catch (e) { G[src] += v; save(); throw e; }
    pgang.kasse += v; pgang.don = pgang.don || {}; pgang.don[acc.uid] = (+pgang.don[acc.uid] || 0) + v; sfx.cash(); return true;
  }
  async function pgSpend(cost, fields, masks, log) { // zieht Geld aus der Kasse, nur wenn sich die Gang seitdem nicht geaendert hat
    for (let i = 0; i < 2; i++) {
      if (pgang.kasse < cost) throw new Error('In der Kasse fehlen ' + fmt(cost - pgang.kasse) + '.');
      const w = { update: { name: fsDocName('gangs/' + pgang.id), fields: fsF(Object.assign({ kasse: pgang.kasse - cost }, fields)) }, updateMask: { fieldPaths: ['kasse'].concat(masks) }, currentDocument: { updateTime: pgang.ut }, updateTransforms: [{ fieldPath: 'log', appendMissingElements: { values: [fsV(gLog(log))] } }] };
      const r = await fsCommit([w]); if (r.ok) { await pgRefresh(); sfx.buy(); return true; }
      if (r.status !== 400 && r.status !== 409 && r.status !== 412) throw new Error('Ging nicht (' + r.status + ').'); await pgRefresh(); if (!pgang) throw new Error('Gang nicht gefunden.');
    }
    throw new Error('Gerade ändert jemand anderes etwas. Versuch es gleich nochmal.');
  }
  async function pgUpgrade() { if (!pgLead()) throw new Error('Nur Boss und Vize.'); const lv = pgang.lv; if (lv >= GHQ_UP.length) return; await pgSpend(GHQ_UP[lv], { lv: lv + 1 }, ['lv'], 'hat das Hauptquartier auf Stufe ' + (lv + 1) + ' ausgebaut'); }
  const pgCanDeco = () => pgMember() && (!pgang.lock || pgLead());
  async function pgPlace(slot, id) { if (!pgCanDeco()) throw new Error('Nur Boss und Vize dürfen gerade einrichten.'); const d = DECOR.find(x => x.id === id); if (!d || slot >= ghqSlots(pgang.lv)) return; await pgSpend(ghqPrice(d), { deco: { ['s' + slot]: id } }, [fpath('deco', 's' + slot)], 'hat ' + d.name + ' ins Hauptquartier gestellt'); }
  async function pgClear(slot) { if (!pgCanDeco()) throw new Error('Nur Boss und Vize dürfen gerade einrichten.'); const d = DECOR.find(x => x.id === pgang.deco['s' + slot]); await pgSet({}, [fpath('deco', 's' + slot)], 'hat ' + (d ? d.name : 'etwas') + ' weggeräumt'); }
  async function pgChat(text) {
    const m = String(text || '').replace(/[\u0000-\u001F\u007F<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, PG_CHAT); if (!m || !pgMember()) return false;
    const e = { u: acc.uid, n: acc.name, t: Date.now(), m };
    const r = await fsCommit([gTransform([{ fieldPath: 'chat', appendMissingElements: { values: [fsV(e)] } }])]); if (!r.ok) throw new Error('Senden ging nicht (' + r.status + ').');
    pgang.chat.push(e); pgLastChat = e.t; G.gang.rd = e.t; return true;
  }
  // --- Welt: Eingang, Raum, Aktionen ---
  function ghqEnter() {
    if (!fbOk() || !accOn()) { msg('Das Gang-Hauptquartier gibt es nur mit Konto.', true); return false; }
    if (!myGid() || (G.gang && G.gang.req)) { msg('Nur für Gang-Mitglieder. Gründe eine Gang oder tritt einer bei: Handy → Freunde → Gang', true); return false; }
    if (riding()) toggleRide(false); ghqApplyLay(); player.fl = 4; player.x = GHQ_EXIT.x; player.y = GHQ_EXIT.y - 40; cam.x = player.x; cam.y = player.y; petSnap(); sfx.put(); pgPollT = 0;
    msg(pgang && pgang.ann ? '📌 ' + pgang.ann : '🏴 Hauptquartier' + (pgang ? ' von ' + pgang.n : '') + ' · Deko mit A verschieben'); return true;
  }
  function ghqLeave() { hqCarry = null; player.fl = 0; player.x = GHQ_AT.x; player.y = GHQ_AT.y + (GHQ_HOUSE && GHQ_HOUSE.face === 1 ? 6 : -6); cam.x = player.x; cam.y = player.y; petSnap(); sfx.put(); return true; }
  const ghqTarget = (px, py) => { // v125
    if (hqCarry) return { type: 'gdrop', idx: 0, ar: AREAS.keller };
    if (Math.hypot(px - GHQ_EXIT.x, py - GHQ_EXIT.y) < 44) return { type: 'gexit', idx: 0, ar: AREAS.keller };
    if (Math.hypot(px - GHQ_SAFE.x, py - (GHQ_SAFE.y + 26)) < 44) return { type: 'gsafe', idx: 0, ar: AREAS.keller };
    if (Math.hypot(px - GHQ_LAGER.x, py - (GHQ_LAGER.y + 26)) < 40) return { type: 'glager', idx: 0, ar: AREAS.keller };
    if (Math.hypot(px - GHQ_BOARD.x, py - (GHQ_BOARD.y + 22)) < 56) return { type: 'gboard', idx: 0, ar: AREAS.keller };
    if (pgang && pgMember() && Math.hypot(px - GHQ_DRY.x, py - (GHQ_DRY.y + 4)) < 38) return { type: 'gdry', idx: 0, ar: AREAS.keller }; // v132
    if (pgang && pgMember() && Math.hypot(px - GHQ_PACK.x, py - (GHQ_PACK.y + 4)) < 38) return { type: 'gpack', idx: 0, ar: AREAS.keller };
    if (pgang && pgMember()) { for (let i = 0; i < GBEET.length; i++) if (Math.hypot(px - GBEET[i].x, py - GBEET[i].y) < 36) return { type: 'gbeet', idx: i, ar: AREAS.keller };
      let best = null, bd = 30; for (const it of hqItems()) { const d = Math.hypot(px - it.x, py - it.y); if (d < bd) { bd = d; best = it; } } if (best) return { type: 'gitem', idx: 0, it: best, ar: AREAS.keller }; }
    return null; };
  const atGhq = () => !player.fl && Math.hypot(player.x - GHQ_AT.x, player.y - GHQ_AT.y) < 46;
  const openPg = seg => { pgSeg = seg; const t = pgMember() ? ({ info: 'g_info', chat: 'g_chat', mem: 'g_mem', hq: 'g_hq', deko: 'g_deko', set: 'g_set' }[seg] || 'g_info') : 'gang'; return openB(t)(); };
  function drawGangHQ() {
    const I = IN, g = pgang && pgMember() ? pgang : null, F = GFLOOR[g ? g.floor : 0], col = GCOL[g ? g.col : 0];
    ctx.fillStyle = '#15181D'; ctx.fillRect(I.x0 - 12, I.y0 - 12, I.x1 - I.x0 + 24, I.y1 - I.y0 + 24);
    ctx.fillStyle = F[0]; ctx.fillRect(I.x0, I.y0, I.x1 - I.x0, I.y1 - I.y0);
    ctx.fillStyle = F[1]; for (let y = I.y0; y < I.y1; y += 32) for (let x = I.x0 + ((y / 32) % 2) * 32; x < I.x1; x += 64) ctx.fillRect(x, y, 32, 32);
    ctx.fillStyle = col; ctx.globalAlpha = 0.85; ctx.fillRect(I.x0, I.y0, I.x1 - I.x0, 4); ctx.globalAlpha = 1;
    // Banner mit Name
    ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(236, 60, 180, 40, 8); ctx.fill(); ctx.fillStyle = col; rr(232, 56, 180, 40, 8); ctx.fill(); ctx.fillStyle = '#10151C'; rr(236, 60, 172, 32, 6); ctx.fill();
    signTxt(g ? '[' + g.tag + ']' : 'GANG-HQ', 322, 70, '900 12px sans-serif', col); signTxt(g ? g.n.toUpperCase().slice(0, 22) : '', 322, 84, '800 8px sans-serif', '#EEF2F7');
    // Deko
    if (g) { for (const it of (state === 'edit' && ed.ak === 'ghq' ? ed.hq : hqItems()).slice().sort((a, c) => a.y - c.y)) { if (hqCarry && hqCarry.k === it.k) continue; try { if (it.q) { rotBegin(it.x, it.y, it.q * Math.PI / 2); drawDecorItem(it.id, it.x, it.y, 1); rotEnd(); } else drawDecorItem(it.id, it.x, it.y, 1); } catch (e) {} } // v133: gedreht // v125: frei platziert
      if (hqCarry) { ctx.save(); ctx.globalAlpha = 0.65 + 0.2 * Math.sin(gt * 6); try { const [cx, cy] = hqClampPos(player.x, player.y - 4); drawDecorItem(hqCarry.id, cx, cy, 1); } catch (e) {} ctx.restore(); }
      // Gang-Lager-Regal
      { const L0 = GHQ_LAGER, n = lagArr().reduce((s, v) => s + v, 0); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(L0.x - 20, L0.y - 24, 44, 34); ctx.fillStyle = '#5A4632'; ctx.fillRect(L0.x - 22, L0.y - 28, 44, 34); ctx.fillStyle = '#3A2C20'; ctx.fillRect(L0.x - 19, L0.y - 25, 38, 12); ctx.fillRect(L0.x - 19, L0.y - 10, 38, 12);
        for (let i = 0; i < Math.min(8, Math.ceil(n / Math.max(1, lagCap() / 8))); i++) { ctx.fillStyle = ['#C9A064', '#5FE584', '#A07A4A', '#8FD8FF'][i % 4]; ctx.fillRect(L0.x - 17 + (i % 4) * 9, L0.y - 23 + Math.floor(i / 4) * 15, 7, 9); }
        signTxt('LAGER · ' + n, L0.x, L0.y + 14, '900 7.5px sans-serif', 'rgba(255,255,255,.7)'); } }
    drawGangBeete(); drawGhqStations(); // v123, v132
    // Tafel
    { const B = GHQ_BOARD; ctx.fillStyle = '#5A4632'; ctx.fillRect(B.x - 42, B.y - 32, 84, 30); ctx.fillStyle = '#26352C'; ctx.fillRect(B.x - 38, B.y - 29, 76, 24); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(B.x - 30, B.y - 22); ctx.lineTo(B.x - 6, B.y - 14); ctx.lineTo(B.x + 14, B.y - 20); ctx.stroke(); ctx.strokeRect(B.x + 18, B.y - 25, 14, 10); signTxt('PLANUNG', B.x, B.y + 6, '900 8px sans-serif', 'rgba(255,255,255,.7)'); }
    // Kasse
    { const S0 = GHQ_SAFE; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(S0.x - 22, S0.y - 26, 50, 44); ctx.fillStyle = '#5E6670'; rr(S0.x - 24, S0.y - 30, 48, 40, 5); ctx.fill(); ctx.fillStyle = '#8C96A3'; rr(S0.x - 20, S0.y - 26, 40, 32, 4); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(S0.x, S0.y - 10, 6, 0, TAU); ctx.fill();
      signTxt('KASSE' + (g ? ' · ' + fmt(g.kasse) : ''), S0.x, S0.y + 22, '900 8px sans-serif', 'rgba(255,255,255,.75)'); }
    // HQ-Stufe als Sterne
    if (g && g.lv) signTxt('★'.repeat(g.lv), 322, 108, '900 10px sans-serif', '#FFD24A');
    ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(GHQ_EXIT.x - 30, I.y1 - 6, 60, 8); signTxt('AUSGANG', GHQ_EXIT.x, I.y1 - 16, '900 9px sans-serif', col);
    if (!g) signTxt(myGid() ? 'Lade …' : '', 322, 280, '700 12px sans-serif', 'rgba(255,255,255,.5)');
    const rg = myGid().slice(0, 20) + ':h'; mpDraw(f => f.rg === rg);
  }
  function drawGhqSign() { // Schild am Gang-Haus
    if (!GHQ_HOUSE || !inView(GHQ_AT.x, GHQ_AT.y, 200)) return; const t = gTag(), col = GCOL[(G && G.gang && G.gang.col) || 0], y = GHQ_HOUSE.face === 1 ? GHQ_HOUSE.y + GHQ_HOUSE.h + 8 : GHQ_HOUSE.y - 8, sx = GHQ_AT.x + 62;
    ctx.fillStyle = 'rgba(16,21,28,.85)'; rr(sx - 36, y - 9, 72, 18, 5); ctx.fill(); ctx.strokeStyle = t ? col : 'rgba(255,255,255,.4)'; ctx.lineWidth = 1.4; rr(sx - 36, y - 9, 72, 18, 5); ctx.stroke();
    signTxt(t ? 'HQ [' + t + ']' : 'GANG-HQ', sx, y, '900 8.5px sans-serif', t ? col : '#E8ECF2');
  }
  // --- Handy: Freunde → Gang ---
  function gInput(id, ph, max, val) { const i = uiEl('input', 'lg-in'); i.id = id; i.type = 'text'; i.placeholder = ph; i.maxLength = max; i.autocomplete = 'off'; i.spellcheck = false; if (val) i.value = val; i.style.marginTop = '6px'; i.addEventListener('keydown', e => e.stopPropagation()); i.addEventListener('keyup', e => e.stopPropagation()); return i; }
  function gBtn(par, t, cls, fn, st) { const b = uiEl('button', 'buy' + (cls ? ' ' + cls : ''), t); b.addEventListener('click', async () => { if (b.disabled) return; b.disabled = true; if (st) st.textContent = 'Einen Moment …'; try { const r = await fn(); if (st) st.textContent = typeof r === 'string' ? r : ''; renderPhone(); } catch (e) { b.disabled = false; if (st) st.textContent = e.message || 'Ging nicht.'; else msg(e.message || 'Ging nicht.', true); } }); par.appendChild(b); return b; }
  const gRow = () => { const r = uiEl('div'); r.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;grid-column:1/-1'; return r; };
  let gNewCol = 0;
  function renderPg(b, seg, app) {
    if (!fbOk() || !accOn()) { uiInfo(b, 'Gangs gibt es nur mit Konto, weil alle Mitglieder dieselbe Gang sehen müssen. Melde dich unter Einstellungen → Profil an.'); return; }
    if (myGid() && !pgang && !pgBusy) { pgPollT = 0; }
    if (myGid() && !pgang) { b.appendChild(uiEl('div', 'empty', pgErr || 'Lade deine Gang …')); return; }
    if (myGid() && G.gang.req) { const c = krCard(b, '⏳ Anfrage an [' + pgang.tag + '] ' + pgang.n, '', 'Du hast gefragt, ob du beitreten darfst. Boss oder Vize müssen dich aufnehmen.'); const st = uiEl('div', 'ds gst'); const r = gRow(); gBtn(r, 'Anfrage zurückziehen', 'alt', pgCancelReq, st); c.appendChild(r); c.appendChild(st); return; }
    if (!myGid()) return renderPgNone(b);
    if (!app) { pgAppSync(); const c = krCard(b, '🏴 [' + pgang.tag + '] ' + pgang.n.replace(/[<>&]/g, ''), '', 'Deine Gang hat jetzt eine eigene App auf dem Startbildschirm des Handys, mit Übersicht, Chat, Mitgliedern, Hauptquartier, Einrichten und Einstellungen.'); const r = gRow(); const ob = uiEl('button', 'buy', 'Gang-App öffnen'); ob.addEventListener('click', () => { tab = 'g_info'; renderPhone(); }); r.appendChild(ob); c.appendChild(r); return; }
    pgSeg = seg || 'info';
    const g = pgang, col = GCOL[g.col], memN = Object.keys(g.mem).length;
    const hd = uiEl('div', 'card gang-hd'); hd.style.gridTemplateColumns = '1fr auto'; hd.style.boxShadow = '0 0 0 1.5px ' + col + ' inset';
    const nm = uiEl('div', 'nm'); nm.innerHTML = '<span style="color:' + col + '">[' + g.tag + ']</span> ' + g.n.replace(/[<>&]/g, ''); hd.appendChild(nm); hd.appendChild(uiEl('div', 'pr', '💰 ' + fmt(g.kasse)));
    hd.appendChild(uiEl('div', 'ds', memN + ' / ' + gMemMax(g.lv) + ' Mitglieder · HQ Stufe ' + g.lv + (g.lv ? ' · Bonus: Kunden zahlen +' + g.lv + ' %' : '') + ' · Du bist ' + (pgBoss() ? 'Boss' : g.mem[acc.uid].r === 'vize' ? 'Vize' : 'Mitglied'))); b.appendChild(hd);
    const nreq = Object.keys(g.req).length;
    if (pgErr) b.appendChild(uiEl('div', 'ds adm-f', pgErr));
    if (pgSeg === 'chat') return renderPgChat(b);
    if (pgSeg === 'mem') return renderPgMem(b);
    if (pgSeg === 'hq') { renderPgProgress(b); renderPgLager(b); return; }
    if (pgSeg === 'deko') return renderPgDeko(b);
    if (pgSeg === 'rev') return renderPgRev(b); // v128
    if (pgSeg === 'set') return renderPgSet(b);
    // Uebersicht: Ankuendigung, Anfragen, Kasse, Spenden, Ausbau, Taxi, Logbuch
    if (g.ann) krCard(b, '📌 Ankündigung', '', g.ann.replace(/[<>&]/g, ''));
    if (pgLead() && nreq) renderPgReqs(b);
    if (pgUnread()) { const c = krCard(b, '💬 ' + pgUnread() + ' neue Nachricht' + (pgUnread() > 1 ? 'en' : '') + ' im Chat', '', ''); const r = gRow(), ob = uiEl('button', 'buy', 'Zum Chat'); ob.addEventListener('click', () => { tab = 'g_chat'; renderPhone(); }); r.appendChild(ob); c.appendChild(r); }
    const kc = krCard(b, '💰 Gang-Kasse: ' + fmt(g.kasse), '', 'Alle zahlen ein, Boss und Vize bauen davon das Hauptquartier aus. Deko fürs HQ kommt auch aus der Kasse.'); const st = uiEl('div', 'ds gst');
    const r = gRow(); for (const v of [1000, 10000, 100000]) { const bt = gBtn(r, '+ ' + fmt(v), 'alt', () => pgDeposit(v).then(() => 'Eingezahlt.'), st); bt.disabled = G.money < v; }
    if (bankLv() >= 1) for (const v of [10000, 100000]) { const bt = gBtn(r, '🏦 + ' + fmt(v) + ' vom Konto', 'alt', () => pgDeposit(v, true).then(() => 'Vom Konto eingezahlt.'), st); bt.disabled = (G.bank || 0) < v; }
    kc.appendChild(r); kc.appendChild(st);
    const lv = g.lv, uc = krCard(b, '🏠 Hauptquartier Stufe ' + lv + ' / ' + GHQ_UP.length, lv < GHQ_UP.length ? fmt(GHQ_UP[lv]) : 'max.', lv < GHQ_UP.length ? 'Nächste Stufe: ' + ghqSlots(lv + 1) + ' Deko-Plätze, bis zu ' + gMemMax(lv + 1) + ' Mitglieder und alle Mitglieder bekommen +' + (lv + 1) + ' % von ihren Kunden.' : 'Voll ausgebaut: ' + ghqSlots(lv) + ' Deko-Plätze, ' + gMemMax(lv) + ' Mitglieder, +' + lv + ' % für alle.');
    if (lv < GHQ_UP.length) { const st2 = uiEl('div', 'ds gst'), r2 = gRow(), bt = gBtn(r2, pgLead() ? 'Aus der Kasse ausbauen' : 'Nur Boss und Vize', '', pgUpgrade, st2); bt.disabled = !pgLead() || g.kasse < GHQ_UP[lv]; uc.appendChild(r2); uc.appendChild(st2); }
    { const dl = donList().slice(0, 5); if (dl.length) krCard(b, '🏅 Größte Einzahler', '', dl.map((x, i) => ['🥇', '🥈', '🥉', '4.', '5.'][i] + ' ' + String(x.n).replace(/[<>&]/g, '') + ': ' + fmt(x.v)).join('<br>')); }
    { const c = krCard(b, '🚕 Taxi ins Hauptquartier', fmt(HQ_TAXI), 'Bringt dich sofort ins HQ, egal wo du bist.'); const st = uiEl('div', 'ds gst'), r = gRow(), tb = uiEl('button', 'buy', 'Losfahren'); tb.disabled = G.money < HQ_TAXI || player.fl === 4; tb.addEventListener('click', () => { const e = hqTaxi(); if (e) st.textContent = e; }); r.appendChild(tb); c.appendChild(r); c.appendChild(st); }
    wayBtn(b, 'Zum Hauptquartier im Gangviertel: Hinführen', GHQ_AT, 'Gang-HQ');
    if (G.rep < zoneRepAt(GHQ_AT.x, GHQ_AT.y)) uiInfo(b, 'Das Gangviertel öffnet ab Ruf ' + zoneRepAt(GHQ_AT.x, GHQ_AT.y) + '. Bis dahin kannst du alles hier im Handy machen.');
    krGrp(b, 'Logbuch');
    const L = g.log.slice(-12).reverse(); if (!L.length) b.appendChild(uiEl('div', 'empty', 'Noch nichts passiert.'));
    for (const x of L) { const [t, n, ...rest] = x.split('|'); const e = uiEl('div', 'ds gang-log'); e.textContent = agoTxt(+t) + ' · ' + n + ' ' + rest.join('|'); b.appendChild(e); }
  }
  function renderPgNone(b) {
    uiInfo(b, 'Mit einer Gang spielt ihr zusammen: gemeinsame Kasse, eigener Chat und ein Hauptquartier im Gangviertel, das ihr gemeinsam einrichtet. Je weiter ihr es ausbaut, desto mehr zahlen eure Kunden.');
    const c = krCard(b, '🏴 Eigene Gang gründen', fmt(PG_COST), G.rep < PG_REP ? 'Ab Ruf ' + PG_REP + ' (du hast ' + G.rep + ').' : 'Du wirst Boss. Name 3 bis 20 Zeichen, Kürzel 2 bis 4 Zeichen (erscheint über den Köpfen).');
    if (G.rep >= PG_REP) {
      const n = gInput('gnName', 'Name der Gang', 20), t = gInput('gnTag', 'Kürzel, z. B. KGR', 4); t.style.textTransform = 'uppercase'; c.appendChild(n); c.appendChild(t);
      const cr = uiEl('div', 'gcols'); GCOL.forEach((cc, i) => { const d = uiEl('button', 'gcol' + (i === gNewCol ? ' on' : '')); d.style.background = cc; d.setAttribute('aria-label', 'Farbe ' + (i + 1)); d.addEventListener('click', () => { gNewCol = i; cr.querySelectorAll('.gcol').forEach((e, k) => e.classList.toggle('on', k === i)); }); cr.appendChild(d); }); c.appendChild(cr);
      const st = uiEl('div', 'ds gst'), r = gRow(); const bt = gBtn(r, 'Gang gründen', '', () => pgCreate(n.value, t.value, gNewCol), st); bt.disabled = G.money < PG_COST; c.appendChild(r); c.appendChild(st);
    }
    krGrp(b, 'Einer Gang beitreten');
    if (!pgList) { b.appendChild(uiEl('div', 'empty', 'Lade Gangs …')); pgListLoad().catch(e => { pgListErr = e.message; pgList = []; }).finally(() => { if (pgOpenTab()) renderPhone(); }); return; }
    if (pgListErr) b.appendChild(uiEl('div', 'ds adm-f', pgListErr));
    if (!pgList.length && !pgListErr) b.appendChild(uiEl('div', 'empty', 'Noch gibt es keine Gang. Gründe die erste!'));
    for (const g of pgList) {
      const n = Object.keys(g.mem).length, full = n >= gMemMax(g.lv), boss = (g.mem[g.own] || {}).n || '?';
      const c2 = uiEl('div', 'card'); c2.style.gridTemplateColumns = '1fr auto'; const nm = uiEl('div', 'nm'); nm.innerHTML = '<span style="color:' + GCOL[g.col] + '">[' + g.tag + ']</span> ' + g.n.replace(/[<>&]/g, ''); c2.appendChild(nm);
      c2.appendChild(uiEl('div', 'pr', n + '/' + gMemMax(g.lv))); c2.appendChild(uiEl('div', 'ds', 'Boss: ' + boss + ' · HQ Stufe ' + g.lv + ' · ' + (g.open ? 'offen für alle' : 'nur auf Anfrage')));
      const st = uiEl('div', 'ds gst'), bt = gBtn(c2, full ? 'Voll' : g.open ? 'Beitreten' : 'Anfragen', '', () => pgJoin(g).then(ok => ok ? 'Willkommen!' : 'Anfrage geschickt.'), st); bt.disabled = full; c2.appendChild(st); b.appendChild(c2);
    }
    const rl = uiEl('button', 'buy alt', '⟳ Liste aktualisieren'); rl.style.marginTop = '8px'; rl.addEventListener('click', () => { pgList = null; renderPhone(); }); b.appendChild(rl);
  }
  function renderPgReqs(b) { // v123: Beitrittsanfragen gut sichtbar
    const rq = Object.entries(pgang.req || {}).sort((a, c) => (+a[1].t || 0) - (+c[1].t || 0)); krGrp(b, '🙋 Beitrittsanfragen (' + rq.length + ')');
    if (!rq.length) { uiInfo(b, 'Gerade keine offenen Anfragen. ' + (pgang.open ? 'Deine Gang ist offen, jeder kann direkt beitreten.' : 'Wer beitreten will, erscheint hier.')); return; }
    const full = Object.keys(pgang.mem).length >= gMemMax(pgang.lv);
    for (const [u, q] of rq) { const c = krCard(b, '🙋 ' + q.n, agoTxt(+q.t || Date.now()), 'möchte deiner Gang beitreten.' + (full ? ' <b style="color:var(--amber)">Die Gang ist voll, baut erst das Hauptquartier aus.</b>' : '')); const st = uiEl('div', 'ds gst'), r = gRow(); const ok = gBtn(r, '✓ Annehmen', '', () => pgAccept(u, true).then(() => q.n + ' ist jetzt dabei.'), st); ok.disabled = full; gBtn(r, '✕ Ablehnen', 'alt', () => pgAccept(u, false).then(() => 'Abgelehnt.'), st); c.appendChild(r); c.appendChild(st); }
  }
  async function pgMakeBoss(uid) { if (!pgBoss() || uid === acc.uid || !pgang.mem[uid]) throw new Error('Nur der Boss.'); const n = pgang.mem[uid].n; await pgSet({ own: uid, mem: { [uid]: { r: 'boss' }, [acc.uid]: { r: 'vize' } } }, ['own', fpath('mem', uid, 'r'), fpath('mem', acc.uid, 'r')], 'hat ' + n + ' zum neuen Boss gemacht'); }
  function renderPgChat(b) {
    const g = pgang, box = uiEl('div', 'gchat'); const L = g.chat.slice(-40);
    if (!L.length) box.appendChild(uiEl('div', 'empty', 'Noch keine Nachrichten. Sag Hallo!'));
    for (const m of L) { const me = m.u === acc.uid, e = uiEl('div', 'gmsg' + (me ? ' me' : '')); const h = uiEl('div', 'gmn', (me ? 'Du' : m.n) + ' · ' + agoTxt(+m.t)); e.appendChild(h); e.appendChild(uiEl('div', 'gmt', m.m)); box.appendChild(e); }
    b.appendChild(box); G.gang.rd = Math.max(G.gang.rd || 0, ...L.map(m => +m.t || 0));
    const cc = uiEl('div', 'card'); cc.style.gridTemplateColumns = '1fr'; b.appendChild(cc);
    const i = gInput('gcMsg', 'Nachricht an die Gang', PG_CHAT), st = uiEl('div', 'ds gst'), r = gRow(); i.style.marginTop = '0'; cc.appendChild(i);
    const send = gBtn(r, 'Senden', '', async () => { const v = i.value; if (!v.trim()) return ''; await pgChat(v); i.value = ''; return ''; }, st);
    i.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); send.click(); } });
    cc.appendChild(r); cc.appendChild(st); setTimeout(() => { try { box.scrollTop = box.scrollHeight; } catch (e) {} }, 0);
    uiInfo(b, 'Der Chat ist nur für eure Gang. Bitte freundlich bleiben, keine echten Namen oder Adressen.');
  }
  function renderPgMem(b) {
    const g = pgang, onl = new Set(Object.values(mp.friends).filter(f => f.u).map(f => f.u));
    if (pgLead()) renderPgReqs(b); else if (Object.keys(g.req).length) uiInfo(b, Object.keys(g.req).length + ' Anfrage(n) offen. Aufnehmen können Boss und Vize.');
    krGrp(b, 'Mitglieder');
    if (pgBoss()) uiInfo(b, 'Als Boss beförderst du Mitglieder zum Vize oder degradierst sie wieder. Vize dürfen Anfragen annehmen, Mitglieder rauswerfen und das HQ ausbauen.');
    const rank = ([u, m]) => u === g.own ? 0 : m.r === 'vize' ? 1 : 2;
    for (const e of Object.entries(g.mem).sort((a, b2) => rank(a) - rank(b2) || (a[1].j || 0) - (b2[1].j || 0))) {
      const [u, m] = e, me = u === acc.uid, on = me || onl.has(u), role = u === g.own ? '👑 Boss' : m.r === 'vize' ? '⭐ Vize' : 'Mitglied';
      const c = krCard(b, (on ? '🟢 ' : '⚪ ') + m.n + (me ? ' (du)' : ''), role, 'dabei seit ' + agoTxt(+m.j || Date.now()).replace('vor ', ''));
      if (!me && (pgBoss() || (pgLead() && u !== g.own && m.r !== 'vize'))) { const st = uiEl('div', 'ds gst'), r = gRow();
        if (pgBoss()) { if (m.r === 'vize') { gBtn(r, '⬇️ Degradieren', 'alt', () => pgRole(u, 'mitglied').then(() => m.n + ' ist jetzt Mitglied.'), st); let sure = false; const bb = uiEl('button', 'buy alt', '👑 Zum Boss machen'); bb.addEventListener('click', async () => { if (!sure) { sure = true; st.innerHTML = '<b style="color:var(--amber)">Nochmal tippen: ' + m.n + ' wird Boss, du wirst Vize.</b>'; return; } bb.disabled = true; try { await pgMakeBoss(u); renderPhone(); } catch (e) { st.textContent = e.message; bb.disabled = false; } }); r.appendChild(bb); }
          else gBtn(r, '⬆️ Befördern zum Vize', '', () => pgRole(u, 'vize').then(() => m.n + ' ist jetzt Vize.'), st); }
        if (u !== g.own) gBtn(r, 'Rauswerfen', 'warn', () => pgKick(u), st); c.appendChild(r); c.appendChild(st); }
    }
    uiInfo(b, 'Regeln, App-Symbol, Ankündigung und Gang verlassen findest du unter Einstellungen.');
  }
  function renderPgHq(b) {
    const g = pgang, n = ghqSlots(g.lv), can = pgCanDeco(), used = Object.keys(g.deco).filter(k => g.deco[k]).length;
    renderPgProgress(b); krGrp(b, '🛋️ Einrichten');
    uiInfo(b, 'Euer Hauptquartier im Gangviertel. ' + used + ' von ' + n + ' Plätzen belegt. Deko wird aus der Gang-Kasse bezahlt (' + fmt(g.kasse) + ').' + (can ? '' : ' Gerade dürfen nur Boss und Vize einrichten.'));
    if (pgLead()) { krGrp(b, 'Boden'); const fr = uiEl('div', 'gcols'); GFLOOR.forEach((f, i) => { const d = uiEl('button', 'gcol gfl' + (i === g.floor ? ' on' : '')); d.style.background = 'linear-gradient(135deg,' + f[0] + ' 50%,' + f[1] + ' 50%)'; d.title = f[2]; d.addEventListener('click', async () => { try { await pgSet({ floor: i }, ['floor'], 'hat den Boden auf ' + f[2] + ' geändert'); } catch (e) { msg(e.message, true); } renderPhone(); }); fr.appendChild(d); }); b.appendChild(fr); }
    krGrp(b, 'Deko-Plätze');
    const grid = uiEl('div', 'ghq-grid');
    for (let i = 0; i < n; i++) { const id = g.deco['s' + i], d = id && DECOR.find(x => x.id === id), cell = uiEl('button', 'ghq-cell' + (pgSel === i ? ' on' : '') + (d ? ' full' : ''));
      cell.innerHTML = d ? '<canvas class="pv" data-dec="' + d.id + '" width="264" height="128"></canvas><span>' + d.name + '</span>' : '<span>＋ Platz ' + (i + 1) + '</span>';
      cell.addEventListener('click', () => { pgSel = pgSel === i ? -1 : i; renderPhone(); }); grid.appendChild(cell); }
    b.appendChild(grid);
    if (pgSel >= 0 && pgSel < n) {
      const i = pgSel, id = g.deco['s' + i], d = id && DECOR.find(x => x.id === id), st = uiEl('div', 'ds gst');
      if (d) { const c = krCard(b, 'Platz ' + (i + 1) + ': ' + d.name, '', d.desc); const r = gRow(); const bt = gBtn(r, 'Wegräumen', 'alt', () => pgClear(i), st); bt.disabled = !can; c.appendChild(r); c.appendChild(st); }
      krGrp(b, (d ? 'Austauschen' : 'Hinstellen') + ' auf Platz ' + (i + 1));
      for (const x of ghqDeco()) { const p = ghqPrice(x), c = uiEl('div', 'card cos'); c.innerHTML = '<canvas class="pv" data-dec="' + x.id + '" width="264" height="128"></canvas><div class="nm">' + x.name + '</div><div class="pr">' + fmt(p) + ' aus der Kasse</div><div class="ds">' + x.desc + '</div>';
        const st2 = uiEl('div', 'ds gst'), bt = gBtn(c, 'Hinstellen', '', () => pgPlace(i, x.id).then(() => { pgSel = -1; return ''; }), st2); bt.disabled = !can || g.kasse < p; c.appendChild(st2); b.appendChild(c); }
    }
    try { startPreviews(b); } catch (e) {}
  }
  // ---------- v123: Fortschritt im Gang-HQ: Gang-Beete und Gang-Wochenziel (alles fuer die Gang-Kasse) ----------
  const GBEET = [{ x: 86, y: 176 }, { x: 86, y: 252 }, { x: 86, y: 328 }, { x: 86, y: 404 }, { x: 146, y: 176 }, { x: 146, y: 252 }, { x: 146, y: 328 }, { x: 146, y: 404 }]; // v133: 8 Beete
  const GB_GROW = 20 * 60000, GB_WATER = 0.25; // 20 Minuten echte Zeit, Giessen spart 25 %
  const gbValue = () => 3000 + 1500 * clamp((pgang && pgang.lv) || 0, 0, 5);
  const GWZ = [[60, 15000], [250, 50000], [800, 150000]]; // Wochenziel-Stufen: Punkte und Belohnung fuer die Kasse
  const gbOf = i => (pgang && pgang.beet && pgang.beet['b' + i]) || null;
  const gbLeft = b => b ? Math.max(0, (+b.t || 0) + GB_GROW * (b.w ? 1 - GB_WATER : 1) - Date.now()) : 0;
  const gbProg = b => b ? clamp(1 - gbLeft(b) / (GB_GROW * (b.w ? 1 - GB_WATER : 1)), 0, 1) : 0;
  async function pgCommitAt(fields, masks, log, trf) { // schreibt nur, wenn sich die Gang seitdem nicht geaendert hat (sonst neu laden und nochmal)
    if (typeof masks === 'string' && !log) log = masks; // v128: Logbuch-Text darf auch an zweiter Stelle stehen (so rufen es die meisten auf)
    for (let i = 0; i < 3; i++) {
      const f = typeof fields === 'function' ? fields() : fields; if (!f) return false;
      const w = { update: { name: fsDocName('gangs/' + pgang.id), fields: fsF(f.fields) }, updateMask: { fieldPaths: f.masks }, currentDocument: { updateTime: pgang.ut } };
      if (log) w.updateTransforms = [{ fieldPath: 'log', appendMissingElements: { values: [fsV(gLog(log))] } }];
      const r = await fsCommit([w]); if (r.ok) { await pgRefresh(); return true; }
      if (r.status !== 400 && r.status !== 409 && r.status !== 412) throw new Error('Ging nicht (' + r.status + ').'); await pgRefresh(); if (!pgang) throw new Error('Gang nicht gefunden.');
    }
    throw new Error('Gerade ändert jemand anderes etwas. Versuch es gleich nochmal.');
  }
  async function gbUse(i) {
    if (!pgMember()) throw new Error('Nur für Mitglieder.'); const b = gbOf(i), key = 'b' + i;
    if (!b) { await pgCommitAt(() => gbOf(i) ? null : { fields: { beet: { [key]: { t: Date.now(), by: acc.name, w: 0 } } }, masks: [fpath('beet', key)] }); sfx.put(); return 'Gepflanzt. In ' + Math.round(GB_GROW / 60000) + ' Minuten reif.'; }
    if (gbLeft(b) > 0) { if (b.w) return 'Wächst noch ' + Math.ceil(gbLeft(b) / 60000) + ' Min.'; await pgCommitAt(() => { const c = gbOf(i); return c && !c.w ? { fields: { beet: { [key]: { w: 1 } } }, masks: [fpath('beet', key, 'w')] } : null; }); sfx.put(); return 'Gegossen: wächst schneller.'; }
    let got = 0, full = false; // v132: die Ernte kommt frisch ins Gang-Lager und wird im HQ getrocknet und verpackt
    await pgCommitAt(() => { const c = gbOf(i); if (!c || gbLeft(c) > 0) return null; const a = lagArr(), room = lagCap() - a.reduce((s, x) => s + x, 0); got = Math.min(gbYield(), room); full = got <= 0; if (full) return null; a[0] += got; return { fields: { lag: a, wz: wzNext(5) }, masks: ['lag', fpath('beet', key), 'wz'] }; }, 'hat ein Gang-Beet geerntet');
    if (full) throw new Error('Das Gang-Lager ist voll. Erst Ware trocknen, verpacken oder verkaufen.');
    if (got) { sfx.cash(); floater(GBEET[i].x, GBEET[i].y - 24, '+' + got + ' frisch', '#5FE584'); return 'Geerntet: ' + got + ' frische Ware liegt im Gang-Lager. Weiter am Trockengestell rechts.'; } return '';
  }
  const wzCur = () => { const z = pgang && pgang.wz; return z && z.wk === weekNo() ? { wk: z.wk, p: +z.p || 0, c: +z.c || 0 } : { wk: weekNo(), p: 0, c: 0 }; };
  const wzNext = add => { const z = wzCur(); return { wk: z.wk, p: z.p + add, c: z.c }; };
  let wzDel0 = -1, wzT = 0, wzU = '';
  // ---------- v132: Anbau-Kette im HQ: Beet -> Gang-Lager (frisch) -> Trockengestell -> Packtisch -> Verkauf ----------
  const GHQ_DRY = { x: 566, y: 206 }, GHQ_PACK = { x: 566, y: 318 }, GHQ_DRY_R = R(GHQ_DRY.x - 20, GHQ_DRY.y - 30, 40, 40), GHQ_PACK_R = R(GHQ_PACK.x - 22, GHQ_PACK.y - 16, 44, 28); GHQ_DRY_R.fl = 4; GHQ_PACK_R.fl = 4;
  const hqLv = () => clamp((pgang && pgang.lv) || 0, 0, 5);
  const gbYield = () => 45 + 12 * hqLv(); // frische Ware pro Beet-Ernte
  const GD_TIME = 8 * 60000, gdCap = () => 60 + 20 * hqLv(); // Trocknen: 8 Minuten echte Zeit pro Ladung
  const GPACK_MAX = 15; // Beutel pro Handgriff am Packtisch
  const GPROD = ['keller', 'tabak', 'brau'], gUnitMul = k => AREAS[GPROD[k]].price / AREAS.keller.price;
  const gSellP = k => Math.round(240 * (1 + 0.05 * hqLv()) * gUnitMul(k)); // Großhändler zahlt fest pro Beutel, in die Kasse
  const gdOf = () => { const d = pgang && pgang.dry; return d && +d.n > 0 ? { n: Math.floor(+d.n), t: +d.t || 0, k: clamp(Math.floor(+d.k) || 0, 0, 2), by: String(d.by || '') } : null; };
  const gdLeft = d => d ? Math.max(0, d.t + GD_TIME - Date.now()) : 0;
  async function gdUse() {
    if (!pgMember()) throw new Error('Nur für Mitglieder.'); const d = gdOf();
    if (d && gdLeft(d) > 0) return 'Trocknet noch ' + Math.ceil(gdLeft(d) / 60000) + ' Min. (' + d.n + ' Stück)';
    if (d) { let n = 0; await pgCommitAt(() => { const c = gdOf(); if (!c || gdLeft(c) > 0) return null; const a = lagArr(); a[c.k * 3 + 1] += c.n; n = c.n; return { fields: { lag: a, dry: { n: 0, t: 0, k: 0, by: '' }, wz: wzNext(2) }, masks: ['lag', 'dry', 'wz'] }; }, 'hat getrocknete Ware abgenommen'); sfx.put(); if (n) floater(GHQ_DRY.x, GHQ_DRY.y - 36, '+' + n + ' trocken', '#FFB547'); return n ? n + ' getrocknete Ware liegt im Gang-Lager. Weiter am Packtisch.' : ''; }
    let n = 0, kk = 0; await pgCommitAt(() => { if (gdOf()) return null; const a = lagArr(); let best = -1; for (let k = 0; k < 3; k++) if (a[k * 3] > 0 && (best < 0 || a[k * 3] > a[best * 3])) best = k; if (best < 0) return null; n = Math.min(a[best * 3], gdCap()); kk = best; a[best * 3] -= n; return { fields: { lag: a, dry: { n, t: Date.now(), k: best, by: acc.name } }, masks: ['lag', 'dry'] }; }, 'hat Ware zum Trocknen aufgehängt');
    if (!n) throw new Error('Keine frische Ware im Gang-Lager. Erst an den Beeten ernten oder eigene frische Ware einlagern.');
    sfx.put(); return n + ' ' + AREAS[GPROD[kk]].lbl.fresh + ' hängt zum Trocknen. Fertig in ' + Math.round(GD_TIME / 60000) + ' Minuten.';
  }
  async function gpUse() {
    if (!pgMember()) throw new Error('Nur für Mitglieder.'); let made = 0;
    await pgCommitAt(() => { const a = lagArr(); made = 0; for (let k = 0; k < 3 && made < GPACK_MAX; k++) { const pn = AREAS[GPROD[k]].packN, b = Math.min(Math.floor(a[k * 3 + 1] / pn), GPACK_MAX - made); if (b > 0) { a[k * 3 + 1] -= b * pn; a[k * 3 + 2] += b; made += b; } } return made ? { fields: { lag: a, wz: wzNext(Math.ceil(made / 5)) }, masks: ['lag', 'wz'] } : null; }, null);
    if (!made) throw new Error('Zu wenig getrocknete Ware im Gang-Lager (für einen Beutel braucht es ' + AREAS.keller.packN + ').');
    sfx.pack ? sfx.pack() : sfx.put(); floater(GHQ_PACK.x, GHQ_PACK.y - 28, '+' + made + ' Beutel', '#5FE584'); return made + ' Beutel verpackt. Verkaufen: Gang-App → HQ, oder für den Großauftrag nutzen.';
  }
  async function gSell() {
    if (!pgMember()) throw new Error('Nur für Mitglieder.'); let got = 0, n = 0;
    await pgCommitAt(() => { const a = lagArr(); got = 0; n = 0; for (let k = 0; k < 3; k++) { const v = a[k * 3 + 2]; if (v > 0) { got += v * gSellP(k); n += v; a[k * 3 + 2] = 0; } } return n ? { fields: { lag: a, kasse: pgang.kasse + got }, masks: ['lag', 'kasse'] } : null; }, 'hat verpackte Ware an den Großhändler verkauft');
    if (!n) throw new Error('Keine verpackte Ware im Gang-Lager.'); sfx.cash(); return n + ' Beutel verkauft: +' + fmt(got) + ' für die Gang-Kasse';
  }
  function drawGhqStations() {
    const g = pgang && pgMember() ? pgang : null; if (!g) return;
    { const P = GHQ_DRY, d = gdOf(), left = gdLeft(d), pr = d ? 1 - left / GD_TIME : 0; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(P.x - 18, P.y + 4, 40, 8); ctx.fillStyle = '#6B4A2E'; ctx.fillRect(P.x - 20, P.y - 30, 4, 40); ctx.fillRect(P.x + 16, P.y - 30, 4, 40); ctx.fillRect(P.x - 20, P.y - 30, 40, 3);
      ctx.strokeStyle = '#B9C2CC'; ctx.lineWidth = 0.8; for (let r = 0; r < 3; r++) { const y = P.y - 22 + r * 10; ctx.beginPath(); ctx.moveTo(P.x - 16, y); ctx.lineTo(P.x + 16, y); ctx.stroke(); if (d) for (let k = 0; k < 5; k++) { const sw = Math.sin(gt * 1.5 + k + r) * 0.6; ctx.fillStyle = pr >= 1 ? '#C9A064' : 'rgb(' + Math.round(95 + 106 * pr) + ',' + Math.round(193 - 33 * pr) + ',' + Math.round(116 - 16 * pr) + ')'; ell(P.x - 13 + k * 6.5 + sw, y + 4, 2.2, 3.6); ctx.fill(); } }
      if (d && left > 0) { ctx.fillStyle = 'rgba(16,21,28,.8)'; rr(P.x - 18, P.y + 12, 36, 5, 2.5); ctx.fill(); ctx.fillStyle = '#FFB547'; rr(P.x - 17, P.y + 13, 34 * pr, 3, 1.5); ctx.fill(); }
      if (d && left <= 0) { const bob = Math.sin(gt * 4) * 2; ctx.fillStyle = '#FFB547'; ctx.beginPath(); ctx.arc(P.x + 18, P.y - 34 + bob, 6, 0, TAU); ctx.fill(); signTxt('!', P.x + 18, P.y - 34 + bob, '900 9px sans-serif', '#10151C'); }
      signTxt('TROCKNEN', P.x, P.y + 24, '900 7.5px sans-serif', 'rgba(255,255,255,.6)'); }
    { const P = GHQ_PACK, a = lagArr(), dr = a[1] + a[4] + a[7], bg = a[2] + a[5] + a[8]; ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(P.x - 20, P.y + 8, 44, 6); ctx.fillStyle = '#8A5E3A'; ctx.fillRect(P.x - 22, P.y - 14, 44, 22); ctx.fillStyle = '#A8764A'; ctx.fillRect(P.x - 22, P.y - 14, 44, 5);
      ctx.fillStyle = '#E9DFC6'; for (let k = 0; k < Math.min(4, Math.ceil(bg / 10)); k++) { rr(P.x - 18 + k * 9, P.y - 22, 7, 9, 2); ctx.fill(); } ctx.fillStyle = '#C9A064'; if (dr) { ell(P.x + 12, P.y - 10, 6, 3); ctx.fill(); }
      ctx.fillStyle = '#3A3F47'; ctx.fillRect(P.x - 4, P.y - 12, 8, 4); if (dr >= AREAS.keller.packN) { const bob = Math.sin(gt * 4) * 2; ctx.fillStyle = '#5FE584'; ctx.beginPath(); ctx.arc(P.x + 20, P.y - 26 + bob, 6, 0, TAU); ctx.fill(); signTxt('!', P.x + 20, P.y - 26 + bob, '900 9px sans-serif', '#10151C'); }
      signTxt('PACKEN', P.x, P.y + 22, '900 7.5px sans-serif', 'rgba(255,255,255,.6)'); }
  }
  async function wzFlush() { // Lieferungen der Mitglieder zaehlen fuers Gang-Wochenziel (gesammelt, hoechstens einmal pro Minute)
    if (!pgMember() || !G) return; if (wzU !== acc.uid) { if (wzU) rkPend = {}; wzU = acc.uid; wzDel0 = -1; } if (wzDel0 < 0) { wzDel0 = G.stat.del; return; } // v128: nach Kontowechsel neu zählen
    const d = G.stat.del - wzDel0; if (d <= 0 || Date.now() - wzT < 60000) return; wzT = Date.now();
    const pend = rkPend; rkPend = {};
    try { await pgCommitAt(() => { const f = { wz: wzNext(Math.min(d, 200)) }, m = ['wz'], rk = rkMerge(pend); if (rk) { Object.assign(f, rk.f); m.push(...rk.m); } return { fields: f, masks: m }; }); wzDel0 += d; } catch (e) { for (const k of Object.keys(pend)) rkPend[k] = (rkPend[k] || 0) + pend[k]; }
  }
  async function wzClaim() {
    if (!pgMember()) throw new Error('Nur für Mitglieder.'); let rw = 0;
    await pgCommitAt(() => { const z = wzCur(), t = GWZ[z.c]; if (!t || z.p < t[0]) return null; rw = t[1]; return { fields: { kasse: pgang.kasse + t[1], wz: { wk: z.wk, p: z.p, c: z.c + 1 } }, masks: ['kasse', 'wz'] }; }, 'hat das Gang-Wochenziel abgeholt');
    if (rw) { sfx.cash(); return 'Belohnung: +' + fmt(rw) + ' für die Gang-Kasse'; } return '';
  }
  // ---------- v128: Revierkampf (Gang gegen Gang um die Stadtviertel, je Woche) und Gang-Großauftrag ----------
  // Jede Lieferung eines Mitglieds an einen Kunden bringt der Gang Punkte im Viertel des Kunden. Wer in der letzten Woche in einem Viertel vorne lag,
  // hält das Revier diese Woche: alle Mitglieder bekommen dort +5 % für jede Lieferung, und die Gang holt einmal pro Woche eine Belohnung für die Kasse ab.
  const RK_MUL = 0.05, RK_PAY = 20000, RK_MIN = 10;
  let rkPend = {}, rkList = null, rkT = -1e9, rkBusy = false, rkErr = '';
  const rkZone = (x, y) => { if (x < 0) return -1; for (let i = 0; i < ZONE_DEF.length; i++) if (ZONE_DEF[i].r.some(([x0, y0, x1, y1]) => x >= x0 && x < x1 && y >= y0 && y < y1)) return i; return -1; };
  const rkZ = o => { const r = {}; if (o && o.z && typeof o.z === 'object') for (const [k, v] of Object.entries(o.z)) { const i = +k; if (i >= 0 && i < ZONE_DEF.length && Number.isFinite(+v) && +v > 0) r[i] = Math.min(1e6, Math.floor(+v)); } return r; };
  const rkNow = g => g && g.rk && +g.rk.wk === weekNo() ? rkZ(g.rk) : {};
  const rkLast = g => { const W = weekNo() - 1; if (g && g.rk && +g.rk.wk === W) return rkZ(g.rk); if (g && g.rkl && +g.rkl.wk === W) return rkZ(g.rkl); return {}; };
  function rkPoint(at, n) { if (!pgMember()) return; const z = rkZone(at.x, at.y); if (z < 0) return; rkPend[z] = (rkPend[z] || 0) + Math.max(1, Math.min(50, Math.floor(n) || 1)); }
  function rkMerge(pend) { // neue Punkte auf den frischen Stand der Gang rechnen; beim Wochenwechsel die alte Woche als rkl aufheben
    if (!Object.keys(pend).length) return null; const W = weekNo(), cur = pgang.rk, z = cur && +cur.wk === W ? rkZ(cur) : {};
    for (const [k, v] of Object.entries(pend)) z[k] = (z[k] || 0) + v;
    const f = { rk: { wk: W, z } }, m = ['rk']; if (cur && +cur.wk === W - 1) { f.rkl = { wk: W - 1, z: rkZ(cur) }; m.push('rkl'); }
    return { f, m };
  }
  async function rkLoad(force) {
    if (!fbOk() || !accOn() || rkBusy) return; if (!force && Date.now() - rkT < 60000) return; rkBusy = true; rkT = Date.now();
    try { const r = await fsReq('GET', 'gangs', null, null, 'pageSize=300&' + ['n', 'tag', 'col', 'rk', 'rkl'].map(f => 'mask.fieldPaths=' + f).join('&')); if (!r.ok) throw new Error('Revier-Stand gerade nicht erreichbar (' + r.status + ').'); const j = await r.json(); rkList = (j.documents || []).map(d => { const g = pgParse(d); return { id: g.id, tag: g.tag, n: g.n, col: g.col, now: rkNow(g), last: rkLast(g) }; }); rkErr = ''; }
    catch (e) { rkErr = e.message || 'Fehler'; } finally { rkBusy = false; }
  }
  function rkBoard(key) { // je Viertel die Gangs nach Punkten
    const out = ZONE_DEF.map(() => []); if (!rkList) return out;
    for (const g of rkList) for (const [k, v] of Object.entries(g[key])) out[k].push({ id: g.id, tag: g.tag, n: g.n, col: g.col, v });
    out.forEach(a => a.sort((x, y) => y.v - x.v || (x.id < y.id ? -1 : 1))); return out;
  }
  function rkOwners() { return rkBoard('last').map(a => a[0] && a[0].v >= RK_MIN ? a[0] : null); } // wer das Viertel diese Woche hält
  function rkMul(at) { if (!pgMember() || !rkList) return 1; const z = rkZone(at.x, at.y), o = z >= 0 ? rkOwners()[z] : null; return o && o.id === myGid() ? 1 + RK_MUL : 1; }
  function rkTagHere() { if (!rkList || player.fl || player.x < 0) return ''; if (AREA_KEYS.some(k => { const I = AREAS[k].IN; return player.x > I.x0 && player.x < I.x1 && player.y > I.y0 && player.y < I.y1; })) return ''; const z = rkZone(player.x, player.y), o = z >= 0 ? rkOwners()[z] : null; return o ? '🏴' + o.tag + ' · ' : ''; }
  // v129: Reviere auf Minikarte und großer Karte. Sehen nur Spieler, die in einer Gang sind; für alle anderen bleibt die Karte wie bisher.
  function mapRevier(x, el, d, big) {
    if (!pgMember() || !rkList) return; const own = rkOwners(), kx = el.width / WW, ky = el.height / (WH - YMIN), me = myGid();
    own.forEach((o, i) => { if (!o) return; const col = GCOL[o.col] || '#FFFFFF', mine = o.id === me, rs = ZONE_DEF[i].r;
      x.save(); x.globalAlpha = mine ? 0.26 : 0.2; x.fillStyle = col; for (const [x0, y0, x1, y1] of rs) x.fillRect(x0 * kx, (Math.max(y0, YMIN) - YMIN) * ky, (x1 - x0) * kx, (y1 - Math.max(y0, YMIN)) * ky);
      x.globalAlpha = mine ? 0.95 : 0.7; x.strokeStyle = col; x.lineWidth = (mine ? 1.6 : 1.1) * d; if (!mine) x.setLineDash([3 * d, 2.5 * d]);
      for (const [x0, y0, x1, y1] of rs) x.strokeRect(x0 * kx + x.lineWidth / 2, (Math.max(y0, YMIN) - YMIN) * ky + x.lineWidth / 2, (x1 - x0) * kx - x.lineWidth, (y1 - Math.max(y0, YMIN)) * ky - x.lineWidth);
      x.setLineDash([]);
      x.restore(); });
  }
  function revLegend() { // Legende der großen Karte: welche Gang hält wie viele Viertel (nur für Gang-Mitglieder)
    const el = $('bmRev'); if (!el) return; if (!pgMember() || !rkList) { el.hidden = true; return; }
    const cnt = {}; rkOwners().forEach(o => { if (o) (cnt[o.id] = cnt[o.id] || { o, n: 0 }).n++; }); const L = Object.values(cnt).sort((a, b) => (b.o.id === myGid()) - (a.o.id === myGid()) || b.n - a.n);
    el.innerHTML = ''; el.hidden = false; if (!L.length) { el.appendChild(uiEl('span', '', '🏴 Diese Woche hält keine Gang ein Viertel')); return; }
    for (const { o, n } of L) { const sp = uiEl('span'), dot = uiEl('i'); dot.style.background = GCOL[o.col] || '#FFF'; sp.appendChild(dot); sp.appendChild(document.createTextNode((o.id === myGid() ? '👑 ' : '') + '[' + o.tag + '] ' + n + ' Viertel')); el.appendChild(sp); }
  }
  const rkMine = () => rkOwners().map((o, i) => o && o.id === myGid() ? i : -1).filter(i => i >= 0);
  async function rkClaim() {
    if (!pgMember()) throw new Error('Nur für Mitglieder.'); await rkLoad(true); const won = rkMine(); if (!won.length) throw new Error('Deine Gang hält diese Woche kein Viertel.');
    let got = 0; await pgCommitAt(() => { if (pgang.rkc === weekNo()) return null; got = won.length * RK_PAY; return { fields: { kasse: pgang.kasse + got, rkc: weekNo() }, masks: ['kasse', 'rkc'] }; }, 'hat die Revier-Belohnung abgeholt (' + won.length + ' Viertel)');
    if (!got) throw new Error('Die Belohnung wurde diese Woche schon abgeholt.'); sfx.cash(); return '+' + fmt(got) + ' für die Gang-Kasse';
  }
  // Großauftrag: einmal pro Woche will ein Großkunde viel verpackte Ware auf einmal. Alle liefern aus dem Gang-Lager zu, die Kasse bekommt am Ende alles mit Aufschlag.
  const GO_MUL = 1.8, GO_BONUS = 25000;
  const goNeed = g => clamp(150 + 75 * Object.keys(g.mem).length, 150, 1200);
  const goCur = () => { const o = pgang && pgang.go, W = weekNo(); if (o && +o.wk === W) return { wk: W, n: Math.max(1, Math.floor(+o.n) || 1), p: Math.max(0, Math.floor(+o.p) || 0), v: Math.max(0, Math.floor(+o.v) || 0), d: o.d ? 1 : 0, by: o.by && typeof o.by === 'object' ? o.by : {} }; return { wk: W, n: goNeed(pgang), p: 0, v: 0, d: 0, by: {} }; };
  async function goDeliver() {
    if (!pgMember()) throw new Error('Nur für Mitglieder.'); let moved = 0, done = 0, pay = 0;
    await pgCommitAt(() => { const o = goCur(), a = lagArr(); moved = 0; done = 0; if (o.d) return null; let left = o.n - o.p, val = 0;
      for (let k = 0; k < 3 && left > 0; k++) { const v = Math.min(a[k * 3 + 2], left); if (v > 0) { a[k * 3 + 2] -= v; left -= v; moved += v; val += v * basePrice(['keller', 'tabak', 'brau'][k]) * GO_MUL; } }
      if (!moved) return null; const by = Object.assign({}, o.by); by[acc.uid] = { n: acc.name, v: (Math.floor(+(by[acc.uid] && by[acc.uid].v)) || 0) + moved };
      const go = { wk: o.wk, n: o.n, p: o.p + moved, v: o.v + Math.round(val), d: 0, by }, f = { lag: a, go }, m = ['lag', 'go'];
      if (go.p >= go.n) { go.d = 1; done = 1; pay = go.v + GO_BONUS; f.kasse = pgang.kasse + pay; m.push('kasse'); }
      return { fields: f, masks: m }; }, null, 'hat Ware für den Großauftrag geliefert');
    if (!moved) throw new Error(goCur().d ? 'Der Großauftrag ist schon erledigt.' : 'Im Gang-Lager liegt keine verpackte Ware. Leg im HQ Ware ins Lager.');
    if (done) { sfx.cash(); return '🎉 Großauftrag erledigt! +' + fmt(pay) + ' für die Gang-Kasse'; }
    sfx.put(); return moved + ' Stück geliefert.';
  }
  function renderPgRev(b) {
    if (Date.now() - rkT > 60000 && !rkBusy) rkLoad().then(() => { if (phoneOpen && tab === 'g_rev') renderPhone(); });
    const g = pgang, me = myGid(), W = weekNo();
    // Großauftrag
    const o = goCur(); krGrp(b, '📦 Großauftrag der Woche');
    { const c = krCard(b, o.d ? '✅ Erledigt' : 'Großkunde will ' + o.n + ' verpackte Ware', o.d ? '' : '+ ' + fmt(GO_BONUS) + ' Bonus', o.d ? 'Diese Woche geschafft. Nächste Woche gibt es einen neuen Auftrag.' : 'Zusammen liefern: jeder kann verpackte Ware aus dem Gang-Lager zuschießen. Bezahlt wird erst, wenn alles da ist, dann aber mit ' + Math.round((GO_MUL - 1) * 100) + ' % Aufschlag und Bonus, alles in die Kasse.');
      const bar = uiEl('div', 'bar'); bar.style.gridColumn = '1/-1'; bar.innerHTML = '<i style="width:' + Math.round(clamp(o.p / o.n, 0, 1) * 100) + '%"></i>'; c.appendChild(bar); c.appendChild(uiEl('div', 'ds gst', o.p + ' / ' + o.n + ' geliefert' + (o.v ? ' · Wert bisher ' + fmt(o.v) : '')));
      const by = Object.values(o.by).filter(x => x && x.v > 0).sort((x, y) => y.v - x.v).slice(0, 5); if (by.length) c.appendChild(uiEl('div', 'ds gst', 'Dabei: ' + by.map(x => String(x.n).slice(0, 16) + ' ' + x.v).join(' · ')));
      if (!o.d) { const st = uiEl('div', 'ds gst'), r = gRow(), sb = lagArr(); const bt = gBtn(r, 'Aus dem Gang-Lager liefern (' + (sb[2] + sb[5] + sb[8]) + ' da)', '', goDeliver, st); bt.disabled = !(sb[2] + sb[5] + sb[8]); c.appendChild(r); c.appendChild(st); } }
    // Revierkampf
    krGrp(b, '🏴 Revierkampf');
    uiInfo(b, 'Jede Lieferung von euch zählt im Viertel des Kunden. Die Gang mit den meisten Punkten (mindestens ' + RK_MIN + ') hält das Viertel die ganze nächste Woche: dort +' + Math.round(RK_MUL * 100) + ' % für jede Lieferung, und einmal pro Woche ' + fmt(RK_PAY) + ' je Viertel für die Kasse.');
    if (rkErr) b.appendChild(uiEl('div', 'ds adm-f', rkErr));
    if (!rkList) { b.appendChild(uiEl('div', 'empty', rkBusy ? 'Lade den Stand …' : 'Noch kein Stand geladen.')); return; }
    const won = rkMine(), own = rkOwners(), now = rkBoard('now');
    { const c = krCard(b, won.length ? '👑 Ihr haltet ' + won.length + ' Viertel' : 'Ihr haltet gerade kein Viertel', won.length ? fmt(won.length * RK_PAY) : '', won.length ? won.map(i => ZONE_DEF[i].name).join(', ') + '. Dort bekommt ihr diese Woche +' + Math.round(RK_MUL * 100) + ' %.' : 'Liefert diese Woche fleißig, dann gehört euch nächste Woche ein Viertel.');
      if (won.length) { const st = uiEl('div', 'ds gst'), r = gRow(), bt = gBtn(r, g.rkc === W ? 'Schon abgeholt' : 'Belohnung abholen', '', rkClaim, st); bt.disabled = g.rkc === W; c.appendChild(r); c.appendChild(st); } }
    ZONE_DEF.forEach((z, i) => {
      const top = now[i].slice(0, 3), mine = now[i].find(x => x.id === me), ho = own[i], esc = t => String(t).replace(/[<>&]/g, '');
      const lines = top.length ? 'Diese Woche: ' + top.map((x, k) => ['🥇', '🥈', '🥉'][k] + ' <span style="color:' + GCOL[x.col] + '">[' + esc(x.tag) + ']</span> ' + x.v).join(' · ') : 'Diese Woche noch keine Punkte.';
      krCard(b, z.name, ho ? '🏴 ' + ho.tag : 'frei', lines + (mine && !top.includes(mine) ? '<br>Ihr: ' + mine.v : '') + (ho ? '<br>Hält gerade: <span style="color:' + GCOL[ho.col] + '">[' + esc(ho.tag) + '] ' + esc(ho.n) + '</span>' : ''));
    });
    { const r = gRow(), st = uiEl('div', 'ds gst'); gBtn(r, '↻ Stand neu laden', 'alt', () => rkLoad(true).then(() => ''), st); const c = uiEl('div', 'card'); c.appendChild(r); c.appendChild(st); b.appendChild(c); }
  }
  function drawGangBeete() {
    if (!pgang || !pgMember()) return;
    for (let i = 0; i < GBEET.length; i++) { const P = GBEET[i], b = gbOf(i), pr = gbProg(b);
      ctx.fillStyle = '#3A2A1E'; rr(P.x - 26, P.y - 26, 52, 52, 8); ctx.fill(); ctx.strokeStyle = 'rgba(95,229,132,.35)'; ctx.lineWidth = 1.5; rr(P.x - 26, P.y - 26, 52, 52, 8); ctx.stroke();
      try { drawPlantAt(P.x, P.y, b ? { s: pr >= 1 ? 2 : 1, p: pr, w: b.w ? 1 : 0.6 } : { s: 0, p: 0, w: 1 }, 0); } catch (e) {}
      if (b && pr >= 1) { const bob = Math.sin(gt * 4) * 2; ctx.fillStyle = '#5FE584'; ctx.beginPath(); ctx.arc(P.x + 18, P.y - 22 + bob, 6, 0, TAU); ctx.fill(); signTxt('€', P.x + 18, P.y - 22 + bob, '900 8px sans-serif', '#10151C'); }
      else if (b) { ctx.fillStyle = 'rgba(16,21,28,.8)'; rr(P.x - 22, P.y + 20, 44, 6, 3); ctx.fill(); ctx.fillStyle = b.w ? '#4BC8FF' : '#FFB547'; rr(P.x - 21, P.y + 21, 42 * pr, 4, 2); ctx.fill(); } }

  }
  function renderPgProgress(b) { // im Handy: Hauptquartier-Reiter
    { const a = lagArr(), d = gdOf(), fr = a[0] + a[3] + a[6], dr = a[1] + a[4] + a[7], bg = a[2] + a[5] + a[8], ripe = GBEET.filter((_, i) => { const x = gbOf(i); return x && gbLeft(x) <= 0; }).length; // v132: die ganze Kette auf einen Blick
      krCard(b, '🔁 So läuft der Anbau im HQ', '', '<b>1. 🌱 Beete</b> pflanzen, gießen, ernten' + (ripe ? ' · <b style="color:var(--green)">' + ripe + ' reif</b>' : '') + '<br><b>2. 🌬️ Trockengestell</b> frische Ware aufhängen · im Lager: ' + fr + (d ? ' · hängt: ' + d.n + (gdLeft(d) > 0 ? '' : ' <b style="color:var(--green)">fertig</b>') : '') + '<br><b>3. 📦 Packtisch</b> verpacken · trocken: ' + dr + '<br><b>4. 🚚 Verkaufen</b> an den Großhändler (unten) oder den Großauftrag im Reiter Revier · Beutel: ' + bg); }
    krGrp(b, '🌱 Gang-Beete');
    uiInfo(b, 'Vier Beete im Hauptquartier (links an der Wand). Jedes Mitglied kann pflanzen, einmal gießen (spart ' + Math.round(GB_WATER * 100) + ' %) und ernten. Jede Ernte bringt ' + gbYield() + ' frische Ware ins Gang-Lager und 5 Punkte fürs Wochenziel. Danach: rechts am Trockengestell trocknen, am Packtisch verpacken, dann verkaufen oder für den Großauftrag nutzen. Alles geht nur im HQ.');
    for (let i = 0; i < GBEET.length; i++) { const bb = gbOf(i), left = gbLeft(bb); krCard(b, 'Beet ' + (i + 1), !bb ? 'frei' : left > 0 ? Math.ceil(left / 60000) + ' Min.' : 'reif', !bb ? 'Leer. Im HQ pflanzen.' : 'Gepflanzt von ' + String(bb.by || '?').replace(/[<>&]/g, '') + (bb.w ? ' · gegossen' : ' · noch nicht gegossen') + (left > 0 ? '' : ' · <b style="color:var(--green)">Jetzt im HQ ernten!</b>')); }
    { const d = gdOf(), left = gdLeft(d), a = lagArr(), fr = a[0] + a[3] + a[6], dr = a[1] + a[4] + a[7], bg = a[2] + a[5] + a[8];
      krGrp(b, '🏭 Verarbeitung im HQ');
      const c1 = krCard(b, '🌬️ Trockengestell', d ? (left > 0 ? Math.ceil(left / 60000) + ' Min.' : 'fertig') : 'frei', d ? d.n + ' ' + AREAS[GPROD[d.k]].lbl.fresh + ' hängen' + (d.by ? ' (von ' + d.by.replace(/[<>&]/g, '') + ')' : '') + (left > 0 ? '' : ' · <b style="color:var(--green)">Im HQ abnehmen!</b>') : 'Im HQ frische Ware aus dem Lager aufhängen (bis ' + gdCap() + ' Stück, ' + Math.round(GD_TIME / 60000) + ' Minuten). Frisch im Lager: ' + fr); if (d) krBar(c1, 1 - left / GD_TIME);
      krCard(b, '📦 Packtisch', dr + ' trocken', 'Im HQ verpacken: aus je ' + AREAS.keller.packN + ' getrockneten wird ein Beutel, bis ' + GPACK_MAX + ' Beutel pro Handgriff. Verpackt im Lager: ' + bg);
      const c3 = krCard(b, '🚚 Großhändler', bg ? '+' + fmt(a[2] * gSellP(0) + a[5] * gSellP(1) + a[8] * gSellP(2)) : '', 'Kauft alle verpackte Ware aus dem Gang-Lager zum festen Preis (' + fmt(gSellP(0)) + ' pro Beutel, mit HQ-Stufe mehr). Das Geld geht in die Gang-Kasse. Mehr gibt es beim Großauftrag im Reiter Revier, wenn ihr genug zusammen habt.');
      const st = uiEl('div', 'ds gst'), r = gRow(), bt = gBtn(r, bg ? bg + ' Beutel verkaufen' : 'Nichts verpackt', '', gSell, st); bt.disabled = !bg; c3.appendChild(r); c3.appendChild(st); }
    const z = wzCur(), t = GWZ[z.c];
    krGrp(b, '🏆 Gang-Wochenziel');
    const c = krCard(b, t ? 'Stufe ' + (z.c + 1) + ' / ' + GWZ.length + ': ' + t[0] + ' Punkte' : 'Alle Stufen geschafft!', z.p + ' Punkte', 'Jede Lieferung eines Mitglieds bringt 1 Punkt, jede Beet-Ernte 5, Abnehmen am Trockengestell 2, Verpacken 1 je 5 Beutel. Neue Woche ab Montag.' + (t ? ' Belohnung: <b>' + fmt(t[1]) + '</b> für die Kasse.' : ''));
    if (t) { krBar(c, z.p / t[0]); if (z.p >= t[0]) { const st = uiEl('div', 'ds gst'), r = gRow(); gBtn(r, '🎁 Belohnung abholen', '', wzClaim, st); c.appendChild(r); c.appendChild(st); } }
  }
  // ---------- v125: Gang-App, frei platzierbare Deko, Gang-Lager, Spenden, Ankündigung, HQ-Taxi ----------
  const GICONS = ['🏴', '💀', '👑', '🐺', '🦅', '🐍', '🔥', '⚡', '💎', '🌿', '🎲', '🦁', '🐉', '⭐', '🃏', '🗡️', '🚀', '🎩'];
  const GICOLS = [['#FF5C7A', '#A8243F'], ['#FFB547', '#C46A12'], ['#FFD24A', '#B08A10'], ['#5FE584', '#1F8A45'], ['#4BC8FF', '#1E6FA8'], ['#B58CFF', '#5B32B5'], ['#FF8FD0', '#B33A82'], ['#8A93A3', '#2B313B'], ['#1C1F26', '#000000']];
  const pgIsApp = t => typeof t === 'string' && t.slice(0, 2) === 'g_';
  const pgOpenTab = () => phoneOpen && (tab === 'gang' || pgIsApp(tab));
  const PG_TABS = { g_info: 'info', g_chat: 'chat', g_mem: 'mem', g_hq: 'hq', g_rev: 'rev', g_deko: 'deko', g_set: 'set' };
  function pgAppSync() { // Name, Symbol und Farben der Gang-App
    const a = APPS.find(x => x.id === 'gang'); if (!a) return;
    if (!pgang || !pgMember()) { a.name = 'Gang'; return; }
    const ic = GICONS[clamp(+pgang.ic || 0, 0, GICONS.length - 1)], cc = GICOLS[clamp(+pgang.icc || 0, 0, GICOLS.length - 1)];
    a.name = pgang.tag ? '[' + pgang.tag + ']' : 'Gang'; a.c = cc[0]; a.c2 = cc[1]; a.ic = '<span class="gic">' + ic + '</span>';
  }
  const pgUnread = () => !pgang || !G.gang ? 0 : pgang.chat.filter(m => m.u !== acc.uid && +m.t > (G.gang.rd || 0)).length;
  // --- frei platzierbare Deko: dk = { key: { id, x, y } }, alte feste Plaetze (deco.sN) werden beim Verschieben umgewandelt ---
  const HQ_BOX = { x0: 76, y0: 112, x1: 580, y1: 462 }; // v133: alles frei im ganzen Raum
  function hqItems() { if (!pgang) return []; const out = [];
    for (const [k, v] of Object.entries(pgang.dk || {})) if (v && DECOR.find(d => d.id === v.id)) out.push({ k, id: v.id, x: clamp(+v.x || 300, HQ_BOX.x0, HQ_BOX.x1), y: clamp(+v.y || 300, HQ_BOX.y0, HQ_BOX.y1), q: clamp(Math.floor(+v.q) || 0, 0, 3) });
    for (const [k, id] of Object.entries(pgang.deco || {})) { const i = +k.slice(1); if (id && GSLOT[i] && DECOR.find(d => d.id === id)) out.push({ k, id, x: GSLOT[i].x, y: GSLOT[i].y, old: 1 }); }
    return out; }
  const hqClampPos = (x, y) => { x = clamp(x, HQ_BOX.x0, HQ_BOX.x1); y = clamp(y, HQ_BOX.y0, HQ_BOX.y1); if (x > 360 && x < 460 && y > 430) y = 430; return [Math.round(x), Math.round(y)]; };
  const newKey = () => 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  let hqCarry = null; // gerade getragene Deko (nur lokal, bis zum Abstellen)
  async function pgBuyDeco(id, at) {
    if (!pgCanDeco()) throw new Error('Nur Boss und Vize dürfen gerade einrichten.'); const d = DECOR.find(x => x.id === id); if (!d) return;
    if (hqItems().length >= ghqSlots(pgang.lv)) throw new Error('Alle ' + ghqSlots(pgang.lv) + ' Plätze sind belegt. Baut das HQ aus oder räumt etwas weg.');
    const [x, y] = at ? hqClampPos(at[0], at[1]) : player.fl === 4 ? hqClampPos(player.x + 30, player.y) : hqClampPos(200 + Math.random() * 320, 180 + Math.random() * 220), k = newKey();
    await pgSpend(ghqPrice(d), { dk: { [k]: { id, x, y } } }, [fpath('dk', k)], 'hat ' + d.name + ' ins Hauptquartier gestellt');
    return player.fl === 4 ? d.name + ' steht neben dir.' : d.name + ' steht im HQ. Verschieben kannst du es dort: hingehen und A drücken.';
  }
  async function pgMoveDeco(it, x, y) {
    [x, y] = hqClampPos(x, y);
    const v = it.q ? { id: it.id, x, y, q: it.q } : { id: it.id, x, y }; // v133: Drehung bleibt erhalten
    if (it.old) { const k = newKey(); await pgCommitAt(() => ({ fields: { dk: { [k]: v } }, masks: [fpath('deco', it.k), fpath('dk', k)] })); }
    else await pgCommitAt(() => pgang.dk && pgang.dk[it.k] ? { fields: { dk: { [it.k]: v } }, masks: [fpath('dk', it.k)] } : null);
  }
  async function pgRemoveDeco(it) {
    if (!pgCanDeco()) throw new Error('Nur Boss und Vize dürfen gerade einrichten.'); const d = DECOR.find(x => x.id === it.id), back = d ? Math.round(ghqPrice(d) / 2) : 0;
    await pgCommitAt(() => ({ fields: { kasse: pgang.kasse + back }, masks: ['kasse', fpath(it.old ? 'deco' : 'dk', it.k)] }), 'hat ' + (d ? d.name : 'etwas') + ' weggeräumt (+' + fmt(back) + ' zurück in die Kasse)');
    return 'Weggeräumt, ' + fmt(back) + ' zurück in die Kasse.';
  }
  function hqPick(it) { if (!pgCanDeco()) { msg('Nur Boss und Vize dürfen gerade einrichten.', true); return; } hqCarry = it; sfx.put(); msg('📦 ' + ((DECOR.find(d => d.id === it.id) || {}).name || 'Deko') + ' aufgehoben. Lauf hin, wo es stehen soll, und drück A. B bricht ab.'); }
  async function hqDrop() { const it = hqCarry; if (!it) return; hqCarry = null; try { await pgMoveDeco(it, player.x, player.y - 4); sfx.put(); msg('Abgestellt.'); } catch (e) { msg(e.message || 'Ging nicht', true); } }
  // --- Gang-Lager im HQ: gemeinsame Ware, sicher vor Razzien ---
  const GHQ_LAGER = { x: 470, y: 98 }, GHQ_LAGER_R = R(GHQ_LAGER.x - 22, GHQ_LAGER.y - 28, 44, 34); GHQ_LAGER_R.fl = 4;
  // v133: alle Stationen im HQ sind verschiebbar (Gang-Feld lay = { key: [x, y] }), Beete ohne Kollision
  const GHQ_ST = () => [['safe', 'Kasse', GHQ_SAFE, GHQ_SAFE_R, -24, -30], ['board', 'Planungstafel', GHQ_BOARD, GHQ_BOARD_R, -40, -30], ['lager', 'Gang-Lager', GHQ_LAGER, GHQ_LAGER_R, -22, -28], ['dry', 'Trockengestell', GHQ_DRY, GHQ_DRY_R, -20, -30], ['pack', 'Packtisch', GHQ_PACK, GHQ_PACK_R, -22, -16]].concat(GBEET.map((p, i) => ['b' + i, 'Beet ' + (i + 1), p, null, -26, -26]));
  const GHQ_DEF = {}; for (const [k, , o] of GHQ_ST()) GHQ_DEF[k] = [o.x, o.y];
  const stBox = k => k[0] === 'b' ? [0, 0, 26, 26] : k === 'board' ? [0, -17, 42, 16] : k === 'safe' ? [0, -10, 25, 21] : k === 'dry' ? [0, -10, 21, 21] : k === 'lager' ? [0, -11, 23, 18] : [0, -3, 23, 13]; // Mitte (dx, dy) und halbe Größe, so wie gezeichnet
  const stClamp = (x, y) => { x = clamp(Math.round(x), 80, 572); y = clamp(Math.round(y), 92, 456); if (x > 350 && x < 470 && y > 420) y = 420; return [x, y]; };
  function stSet(key, x, y) { const s = GHQ_ST().find(z => z[0] === key); if (!s) return; [x, y] = stClamp(x, y); s[2].x = x; s[2].y = y; if (s[3]) { s[3].x = x + s[4]; s[3].y = y + s[5]; } }
  function ghqApplyLay() { const L = (pgang && pgang.lay && typeof pgang.lay === 'object') ? pgang.lay : {}; if (state === 'edit' && ed.ak === 'ghq' && ed.drag) return; for (const [k] of GHQ_ST()) { const v = Array.isArray(L[k]) && L[k].length === 2 && Number.isFinite(+L[k][0]) ? L[k] : GHQ_DEF[k]; stSet(k, +v[0], +v[1]); } }
  async function stSave(key) { const s = GHQ_ST().find(z => z[0] === key); if (!s) return; await pgCommitAt(() => ({ fields: { lay: { [key]: [s[2].x, s[2].y] } }, masks: [fpath('lay', key)] })); }

  const lagCap = () => 200 + 100 * clamp((pgang && pgang.lv) || 0, 0, 5);
  const lagArr = () => { const a = pgang && Array.isArray(pgang.lag) ? pgang.lag : []; return [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => Math.max(0, Math.floor(+a[i] || 0))); };
  async function lagPut() {
    if (!pgMember() || player.fl !== 4) throw new Error('Einlagern geht nur im Hauptquartier.'); let moved = 0;
    const inv = STASH_INV(); const want = [0, 1, 2].map(k => [0, 1, 2].map(j => Math.floor(inv[k][STASH_F[j]] || 0)));
    if (!want.flat().some(v => v > 0)) throw new Error('Du hast keine Ware dabei.');
    await pgCommitAt(() => { const a = lagArr(); let room = lagCap() - a.reduce((s, v) => s + v, 0); moved = 0; const take = [];
      for (const j of [2, 1, 0]) for (let k = 0; k < 3; k++) { const v = Math.min(want[k][j], room); if (v > 0) { a[k * 3 + j] += v; room -= v; moved += v; take.push([k, j, v]); } }
      if (!moved) return null; pgCommitAt.take = take; return { fields: { lag: a }, masks: ['lag'] }; }, null);
    if (!moved) throw new Error('Das Gang-Lager ist voll (' + lagCap() + ').');
    for (const [k, j, v] of pgCommitAt.take || []) inv[k][STASH_F[j]] -= v; save(); sfx.put(); return moved + ' Stück ins Gang-Lager gelegt.';
  }
  async function lagTake(k) {
    if (!pgMember() || player.fl !== 4) throw new Error('Rausnehmen geht nur im Hauptquartier.'); const inv = STASH_INV(); let got = [];
    await pgCommitAt(() => { const a = lagArr(); got = []; let free = Math.max(0, bagCap() - totalBags());
      for (let j = 0; j < 3; j++) { let v = a[k * 3 + j]; if (j === 2) v = Math.min(v, free); if (v > 0) { a[k * 3 + j] -= v; got.push([j, v]); if (j === 2) free -= v; } }
      return got.length ? { fields: { lag: a }, masks: ['lag'] } : null; }, null);
    if (!got.length) throw new Error('Nichts drin oder dein Rucksack ist voll.');
    let n = 0; for (const [j, v] of got) { inv[k][STASH_F[j]] += v; n += v; } save(); sfx.put(); return n + ' Stück mitgenommen.';
  }
  // --- Spenden: wer hat wie viel eingezahlt ---
  const donList = () => Object.entries((pgang && pgang.don) || {}).map(([u, v]) => ({ u, v: +v || 0, n: (pgang.mem[u] || {}).n })).filter(x => x.n && x.v > 0).sort((a, b) => b.v - a.v);
  // --- Taxi ins HQ ---
  const HQ_TAXI = 500;
  function hqTaxi() {
    if (!pgMember()) return 'Nur für Mitglieder.'; if (G.rep < zoneRepAt(GHQ_AT.x, GHQ_AT.y)) return 'Das Gangviertel öffnet erst ab Ruf ' + zoneRepAt(GHQ_AT.x, GHQ_AT.y) + '.';
    if (G.money < HQ_TAXI) return 'Du brauchst ' + fmt(HQ_TAXI) + ' Bargeld fürs Taxi.'; if (typeof busChased === 'function' && busChased()) return 'Die Polizei ist hinter dir her, kein Taxi hält jetzt.';
    if (riding()) toggleRide(false); G.money -= HQ_TAXI; player.fl = 0; player.x = GHQ_AT.x; player.y = GHQ_AT.y; closePhone(); ghqEnter(); return '';
  }
  // --- Handy: Gang-App ---
  function renderPgSet(b) {
    const g = pgang;
    if (pgLead()) {
      krGrp(b, '🎨 App-Symbol');
      uiInfo(b, 'So sieht die Gang-App bei allen Mitgliedern aus. Ändern können Boss und Vize.');
      const ir = uiEl('div', 'gcols'); GICONS.forEach((e, i) => { const d = uiEl('button', 'gcol gico' + (i === (+g.ic || 0) ? ' on' : '')); d.textContent = e; d.addEventListener('click', async () => { try { await pgSet({ ic: i }, ['ic']); } catch (x) { msg(x.message, true); } renderPhone(); }); ir.appendChild(d); }); b.appendChild(ir);
      const cr = uiEl('div', 'gcols'); GICOLS.forEach((c, i) => { const d = uiEl('button', 'gcol gfl' + (i === (+g.icc || 0) ? ' on' : '')); d.style.background = 'linear-gradient(155deg,' + c[0] + ',' + c[1] + ')'; d.addEventListener('click', async () => { try { await pgSet({ icc: i }, ['icc']); } catch (x) { msg(x.message, true); } renderPhone(); }); cr.appendChild(d); }); b.appendChild(cr);
      krGrp(b, '📌 Ankündigung');
      const c = krCard(b, 'Steht oben in der Übersicht und erscheint beim Betreten des HQ', '', ''); const i = gInput('gnAnn', 'z. B. Heute Abend alle ins HQ!', 140, g.ann || ''); c.appendChild(i); const st = uiEl('div', 'ds gst'), r = gRow();
      gBtn(r, 'Speichern', '', () => pgSet({ ann: String(i.value || '').replace(/[\u0000-\u001F<>]/g, '').trim().slice(0, 140) }, ['ann'], 'hat die Ankündigung geändert').then(() => 'Gespeichert.'), st); gBtn(r, 'Löschen', 'alt', () => pgSet({ ann: '' }, ['ann']).then(() => 'Gelöscht.'), st); c.appendChild(r); c.appendChild(st);
    }
    if (pgBoss()) { krGrp(b, '⚙️ Regeln'); const c = krCard(b, 'Beitritt und Einrichten', '', (g.open ? 'Jeder kann direkt beitreten.' : 'Neue Mitglieder müssen anfragen.') + ' ' + (g.lock ? 'Nur Boss und Vize dürfen das HQ einrichten.' : 'Alle Mitglieder dürfen das HQ einrichten.')); const st = uiEl('div', 'ds gst'), r = gRow();
      gBtn(r, g.open ? 'Nur auf Anfrage' : 'Für alle öffnen', 'alt', () => pgSet({ open: !g.open }, ['open']), st); gBtn(r, g.lock ? 'Alle dürfen einrichten' : 'Nur Boss/Vize richten ein', 'alt', () => pgSet({ lock: !g.lock }, ['lock']), st); c.appendChild(r); c.appendChild(st); }
    krGrp(b, 'Gang verlassen');
    let sure = false; const lc = krCard(b, '🚪 Gang verlassen', '', pgBoss() && Object.keys(g.mem).length > 1 ? 'Als Boss gibst du die Gang an deinen Vize (oder das älteste Mitglied) weiter.' : pgBoss() ? 'Du bist allein: Die Gang wird aufgelöst, die Kasse ist dann weg.' : 'Du kannst jederzeit einer anderen Gang beitreten.');
    const st = uiEl('div', 'ds gst'), r = gRow(), lb = uiEl('button', 'buy warn', 'Verlassen'); lb.addEventListener('click', async () => { if (!sure) { sure = true; st.innerHTML = '<b style="color:var(--amber)">Nochmal tippen zum Verlassen.</b>'; return; } lb.disabled = true; st.textContent = 'Einen Moment …'; try { await pgLeave(); tab = 'home'; renderPhone(); } catch (e) { st.textContent = e.message; lb.disabled = false; } }); r.appendChild(lb); lc.appendChild(r); lc.appendChild(st);
  }
  function renderPgLager(b) {
    const a = lagArr(), sum = a.reduce((s, v) => s + v, 0), inHq = player.fl === 4;
    krGrp(b, '📦 Gang-Lager · ' + sum + ' / ' + lagCap());
    uiInfo(b, 'Gemeinsame Ware für alle Mitglieder. Liegt sicher im HQ (keine Razzia, kein Klauen). Einlagern und Rausnehmen geht nur im HQ am Regal neben der Kasse.');
    const c = krCard(b, 'Inhalt', '', stashText(a)); const st = uiEl('div', 'ds gst'), r = gRow();
    const pb = gBtn(r, 'Meine Ware einlagern', '', lagPut, st); pb.disabled = !inHq;
    [AREAS.keller, AREAS.tabak, AREAS.brau].forEach((ar, k) => { if (a[k * 3] + a[k * 3 + 1] + a[k * 3 + 2] > 0) { const tb = gBtn(r, ar.name + ' rausnehmen', 'alt', () => lagTake(k), st); tb.disabled = !inHq; } });
    c.appendChild(r); c.appendChild(st);
  }
  function renderPgDeko(b) {
    const g = pgang, n = ghqSlots(g.lv), can = pgCanDeco(), items = hqItems();
    { const c = krCard(b, '✏️ HQ einrichten', '', player.fl === 4 ? 'Wie im Keller: Teile antippen und mit dem Finger verschieben, neue Deko direkt aus der Gang-Kasse kaufen und aufstellen, Wegräumen gibt die Hälfte zurück.' : 'Geht im Hauptquartier: hingehen oder unter Übersicht das HQ-Taxi nehmen, dann hier tippen. Oder im HQ an der Planungstafel A drücken.'); const r = gRow(), bt = uiEl('button', 'buy', player.fl === 4 ? 'Einrichten starten' : 'Nur im HQ'); bt.disabled = player.fl !== 4 || !can; bt.addEventListener('click', () => startGhqEdit()); r.appendChild(bt); c.appendChild(r); } // v132
    uiInfo(b, 'Deko wird aus der Gang-Kasse bezahlt (' + fmt(g.kasse) + '). Im HQ kannst du Deko auch weiter mit A aufheben und woanders abstellen.' + (can ? '' : ' <b>Gerade dürfen nur Boss und Vize einrichten.</b>'));
    if (pgLead()) { krGrp(b, 'Boden'); const fr = uiEl('div', 'gcols'); GFLOOR.forEach((f, i) => { const d = uiEl('button', 'gcol gfl' + (i === g.floor ? ' on' : '')); d.style.background = 'linear-gradient(135deg,' + f[0] + ' 50%,' + f[1] + ' 50%)'; d.title = f[2]; d.addEventListener('click', async () => { try { await pgSet({ floor: i }, ['floor'], 'hat den Boden auf ' + f[2] + ' geändert'); } catch (e) { msg(e.message, true); } renderPhone(); }); fr.appendChild(d); }); b.appendChild(fr); }
    krGrp(b, 'Im HQ aufgestellt · ' + items.length + ' / ' + n);
    if (!items.length) b.appendChild(uiEl('div', 'empty', 'Noch leer. Kauf unten etwas.'));
    for (const it of items) { const d = DECOR.find(x => x.id === it.id), c = uiEl('div', 'card cos'); c.innerHTML = '<canvas class="pv" data-dec="' + it.id + '" width="264" height="128"></canvas><div class="nm">' + d.name + '</div><div class="pr">+' + fmt(Math.round(ghqPrice(d) / 2)) + '</div><div class="ds">Steht im HQ. Verschieben: im HQ hingehen und A drücken.</div>';
      const st = uiEl('div', 'ds gst'), bt = gBtn(c, 'Wegräumen', 'alt', () => pgRemoveDeco(it), st); bt.disabled = !can; c.appendChild(st); b.appendChild(c); }
    krGrp(b, 'Deko kaufen');
    const full = items.length >= n;
    for (const x of ghqDeco()) { const p = ghqPrice(x), c = uiEl('div', 'card cos'); c.innerHTML = '<canvas class="pv" data-dec="' + x.id + '" width="264" height="128"></canvas><div class="nm">' + x.name + '</div><div class="pr">' + fmt(p) + '</div><div class="ds">' + x.desc + '</div>';
      const st2 = uiEl('div', 'ds gst'), bt = gBtn(c, full ? 'Kein Platz frei' : 'Kaufen & aufstellen', '', () => pgBuyDeco(x.id), st2); bt.disabled = !can || full || g.kasse < p; c.appendChild(st2); b.appendChild(c); }
    try { startPreviews(b); } catch (e) {}
  }
  function renderQuests(b) {
    const act = [], av = [], lock = [], done = [];
    for (const c of CHARS) { const q = KR().q[c.id]; if (qDone(c)) done.push(c); else if (!charUnlocked(c)) lock.push(c); else if (q && (q.s > 0 || q.seen >= 0)) act.push(c); else av.push(c); }
    const row = (c, mode) => {
      const q = qOf(c.id), here = charHere(c), cc = krCard(b, c.name + ' <span style="color:var(--muted);font-weight:600">' + c.who + '</span>', mode === 'done' ? (krRegular(c) ? 'Stammkunde: will wieder' : 'Stammkunde') : mode === 'act' ? 'Abschnitt ' + (q.s + 1) + '/' + c.steps.length : '',
        mode === 'lock' ? 'Ab Kategorie ' + c.tier + ' (' + TIERS[c.tier - 1].name + ', Ruf ' + TIERS[c.tier - 1].rep + ')' + (c.reqTxt ? ' · ' + c.reqTxt : '') + (c.sea !== undefined && SEASONS[c.sea] ? ' · nur im ' + SEASONS[c.sea].name : '')
          : (mode === 'act' ? '<b>' + taskText(c) + '</b><br>' : '') + (here ? 'Zu finden ' + c.where : c.sea !== undefined && SEASONS[c.sea] ? 'Kommt wieder im ' + SEASONS[c.sea].name : 'Gerade nicht da, sonst ' + (c.where || 'in der Stadt')) + (mode === 'done' ? ' · Beziehung ' + Math.round(q.aff) + '/100' : ''));
      if (mode === 'act') krBar(cc, q.s / c.steps.length);
      if (here && mode !== 'lock') { const bt = document.createElement('button'); bt.className = 'buy'; const on = KR().trk === c.id; bt.textContent = on ? 'Wegweiser aus' : 'Hinführen'; if (on) bt.classList.add('alt'); bt.addEventListener('click', () => { KR().trk = on ? '' : c.id; save(); renderPhone(); }); cc.appendChild(bt); }
    };
    krGrp(b, 'Aktiv (' + act.length + ')'); if (!act.length) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = 'Keine aktive Questkette. Sprich jemanden an, der mit ! markiert ist.'; b.appendChild(e); } act.forEach(c => row(c, 'act'));
    krGrp(b, 'Verfügbar (' + av.length + ')'); av.forEach(c => row(c, 'av'));
    krGrp(b, 'Abgeschlossen (' + done.length + ')'); done.forEach(c => row(c, 'done'));
    krGrp(b, 'Noch gesperrt (' + lock.length + ')'); lock.forEach(c => row(c, 'lock'));
  }
  function renderWelt(b) {
    const k = KR(), s = season(), ns = SEASONS[(seasonI() + 1) % 4];
    const c = krCard(b, s.ic + ' ' + s.name + ' · Jahr ' + seasonYear(), 'Tag ' + seasonDay() + '/' + SEASON_DAYS, s.txt.join(' · ') + '<br>Danach: ' + ns.ic + ' ' + ns.name + ' in ' + (SEASON_DAYS - seasonDay() + 1) + ' Tag(en)'); krBar(c, seasonDay() / SEASON_DAYS);
    const pts = collPoints(), m = k.col[seasonYear() + '-' + seasonI()] || 0, got = pts.filter((_, i) => m & (1 << i)).length, C = COLL[seasonI()];
    krCard(b, 'Sammeln: ' + C.n, got + ' / ' + pts.length, 'Überall in der Stadt versteckt. Alle gefunden = ' + fmt(Math.round(1000 * krLv())) + ' und eine Trophäe. Trophäen: ' + SEASONS.map(x => x.ic + ' ' + (k.troph[x.id] || 0)).join('  '));
    krGrp(b, 'Ereignis');
    if (k.ev) {
      const e = k.ev, d = EVENTS[e.id], left = Math.max(0, e.end - absMin()), cc = krCard(b, d.ic + ' ' + d.name, 'noch ' + Math.ceil(left / 60) + ' Std.', d.desc + (e.id === 'aufgabe' ? '<br>Fortschritt: ' + Math.min(6, G.stat.del - e.b) + ' / 6' : '') + (e.id === 'stamm' ? '<br>Noch ' + e.n + ' Lieferungen mit Bonus' : '') + (e.ch ? '<br>Entschieden: ' + (d.choice.find(o => o.id === e.ch) || {}).l?.(e) : ''));
      krBar(cc, left / d.dur);
      if (d.choice && !e.ch) { const row = document.createElement('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;grid-column:1/-1'; d.choice.forEach((o, i) => { const bt = document.createElement('button'); bt.className = 'buy'; bt.textContent = o.l(e); bt.disabled = !!o.cost && o.cost(e) > G.money; bt.addEventListener('click', () => { if (krChoose(i)) renderPhone(); }); row.appendChild(bt); }); cc.appendChild(row); }
    } else { const e = document.createElement('div'); e.className = 'empty'; e.textContent = 'Gerade ist es ruhig. Das nächste Ereignis kommt in etwa ' + Math.max(1, Math.ceil((k.evNext - absMin()) / 60)) + ' Spielstunden.'; b.appendChild(e); }
    const lg = document.createElement('div'); lg.className = 'ds'; lg.style.margin = '6px 2px'; lg.textContent = 'Zuletzt: ' + (k.evLog.length ? k.evLog.slice().reverse().map(x => EVENTS[x].ic + ' ' + EVENTS[x].name).join(', ') : 'noch nichts') + '. Ereignisse und Jahreszeiten laufen nur, solange du spielst (die Spieluhr steht, wenn das Spiel zu ist).'; b.appendChild(lg);
  }
  // ---------- v106: Team-Apps neu (Anheuern und Mitarbeiter), kompakt und uebersichtlich fuers Handy ----------
  const ROLE_SHORT = { gardener: 'Pflanzt, gießt und erntet', rack: 'Bringt Trockenes zum Packtisch', packer: 'Packt die Ware, du holst sie ab' };
  const AREA_SHORT = { keller: 'Keller', tabak: 'Scheune', brau: 'Labor', pr: 'Mietraum' };
  const tmEl = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
  let fxSel = 'aura'; // v119: Unterteilung im Reiter Effekte
  let tmSel = ''; // v119: eigener Knopf fuer die Mietraum-Helfer
  function tmSeg(b) { // Gebiete als eine Zeile zum Wischen
    const row = tmEl('div', 'tmseg');
    AREA_KEYS.forEach(k => { const ar = AREAS[k], op = isOpen(ar), n = Object.keys(ROLES).filter(r => ROLES[r].area === k).reduce((s, r) => s + (G.staff[r] || 0), 0);
      const c = tmEl('button', 'tmsg' + (G.area === k && tmSel !== 'pr' ? ' on' : '') + (op ? '' : ' off'), (AREA_THEME[k] ? AREA_THEME[k].ic + ' ' : '') + (AREA_SHORT[k] || ar.name) + (op ? (n ? ' <b>' + n + '</b>' : '') : ' 🔒'));
      c.addEventListener('click', () => { G.area = k; tmSel = ''; renderPhone(); }); row.appendChild(c); });
    if (G.lager && G.lager.own) { const op = isOpen(AREAS.pr), n = Object.keys(ROLES).filter(r => ROLES[r].area === 'pr').reduce((s, r) => s + (G.staff[r] || 0), 0);
      const c = tmEl('button', 'tmsg' + (tmSel === 'pr' ? ' on' : '') + (op ? '' : ' off'), '🏢 Mietraum' + (op ? (n ? ' <b>' + n + '</b>' : '') : ' 🔒')); c.addEventListener('click', () => { tmSel = 'pr'; renderPhone(); }); row.appendChild(c); }
    b.appendChild(row);
  }
  function tmRole(b, k) {
    const r = ROLES[k], n = G.staff[k] || 0, maxed = n >= r.max, locked = G.rep < r.rep, cost = maxed ? 0 : r.cost[n];
    const c = tmEl('div', 'card tmr' + (locked ? ' lock' : ''));
    const pips = Array.from({ length: r.max }, (_, i) => '<i class="' + (i < n ? 'on' : '') + '" style="--c:' + r.col + '"></i>').join('');
    c.appendChild(tmEl('div', 'tmh', '<span class="tmdot" style="background:' + r.col + '"></span><b>' + r.name + '</b><span class="tmpips">' + pips + '</span>'));
    const bt = tmEl('button', 'buy tmbuy', maxed ? '✓ voll' : locked ? '🔒 Ruf ' + r.rep : '+ ' + fmt(cost)); bt.disabled = maxed || locked || G.money < cost; bt.addEventListener('click', () => { if (hire(k)) renderPhone(); }); c.appendChild(bt);
    c.appendChild(tmEl('div', 'tmd', (ROLE_SHORT[r.kind] || '') + ' · Lohn ' + fmt(Math.round(r.wage * wageK())) + '/Tag'));
    if (n > 0) { const up = tmEl('div', 'tmup');
      [['speed', '⚡ Tempo'], ['skill', '🛠 Geschick']].forEach(([key, nm]) => { const lv = G.staffUp[k][key], mx = lv >= 3, cst = mx ? 0 : UPG_COST[lv];
        const x = tmEl('button', 'tmpill' + (mx ? ' done' : ''), nm + ' <span>' + lv + '/3</span>' + (mx ? '' : ' <em>' + fmt(cst) + '</em>')); x.disabled = mx || G.money < cst; x.addEventListener('click', () => { if (upgradeStaff(k, key)) renderPhone(); }); up.appendChild(x); });
      c.appendChild(up); }
    const more = tmEl('details', 'tmmore'); more.appendChild(tmEl('summary', '', 'Mehr dazu')); more.appendChild(tmEl('div', 'tmd', r.desc)); c.appendChild(more);
    b.appendChild(c);
  }
  function renderTeam(b) {
    tmSeg(b);
    const tk = tmSel === 'pr' && G.lager && G.lager.own ? 'pr' : G.area, ar = AREAS[tk];
    if (tk === 'pr' && !isOpen(ar)) { uiInfo(b, '🏢 <b>Mietraum</b>: Richte zuerst im Mietraum den Premium-Anbau ein (am Regal rechts im Raum). Danach kannst du hier Premium-Gärtner, Klima-Techniker und Apotheken-Abfüller anheuern.'); return; }
    if (!isOpen(ar)) { uiInfo(b, (AREA_THEME[ar.key] ? AREA_THEME[ar.key].ic + ' ' : '') + '<b>' + ar.name + '</b> ist noch gesperrt. Kaufe es zuerst unter „Ausbau“, dann kannst du hier Helfer anheuern.'); return; }
    const all = staffN();
    b.appendChild(tmEl('div', 'tmsum', '<span>👥 <b>' + all + '</b> Helfer</span><span>💶 <b>' + fmt(wageTotal()) + '</b>/Tag</span><span>⭐ Ruf <b>' + G.rep + '</b></span>'));
    const keys = Object.keys(ROLES).filter(k => ROLES[k].area === tk);
    keys.forEach(k => tmRole(b, k));
    if (tk === 'keller' && isOpen(AREAS.pr)) { const h = tmEl('div', 'ds', '🏢 Die Helfer für den Mietraum findest du oben unter „Mietraum“.'); h.style.margin = '8px 2px'; b.appendChild(h); }
  }
  function renderCrew(b) {
    crewSync(); const k = KR();
    const help = tmEl('details', 'tmhelp'); help.appendChild(tmEl('summary', '', 'ⓘ So funktionieren Mitarbeiter'));
    help.appendChild(tmEl('div', 'tmd', 'Helfer sammeln bei der Arbeit Erfahrung. Pro Level gibt es einen Punkt für ⚡ Tempo oder 🛠 Geschick, ab Level 3 eine Spezialisierung (stärker mit Level 6 und 9). Höhere Level verdienen etwas mehr Lohn. Schulung bringt einmal am Tag Extra-Erfahrung.')); b.appendChild(help);
    b.appendChild(tmEl('div', 'tmsum', Object.keys(SPECS).map(s => '<span title="' + SPECS[s].name + '">' + SPECS[s].ic + ' <b>' + specSum(s) + '</b></span>').join('') + '<span>💶 <b>' + fmt(wageTotal()) + '</b>/Tag</span>'));
    if (!k.crew.length) { uiInfo(b, 'Noch keine Helfer. Unter „Anheuern“ stellst du welche ein.'); return; }
    const groups = {}; for (const m of k.crew) { const a = ROLES[m.r] ? ROLES[m.r].area : 'keller'; (groups[a] = groups[a] || []).push(m); }
    for (const a of AREA_KEYS.concat(['pr'])) { const list = groups[a]; if (!list || !list.length) continue;
      const g = tmEl('div', 'grp'); g.textContent = (AREA_THEME[a] ? AREA_THEME[a].ic + ' ' : '🌟 ') + (AREAS[a] ? AREAS[a].name : a) + ' · ' + list.length; b.appendChild(g);
      for (const m of list.sort((x, y) => y.lv - x.lv || x.r.localeCompare(y.r))) tmMember(b, m);
    }
  }
  function tmMember(b, m) {
    const r = ROLES[m.r], ta = TALENTS[m.ta] || { name: '–' }, off = m.off > absMin(), mx = m.lv >= CREW_MAX;
    const c = tmEl('div', 'card tmm');
    c.appendChild(tmEl('div', 'tmav', '<span style="background:' + r.col + '">' + String(m.n || '?')[0] + '</span>'));
    const main = tmEl('div', 'tmmain');
    main.appendChild(tmEl('div', 'tmh', '<b>' + m.n + '</b><span class="tmlv">Lv ' + m.lv + '</span>' + (m.sp > 0 ? '<span class="tmnew">' + m.sp + ' Punkt' + (m.sp > 1 ? 'e' : '') + '</span>' : '') + (off ? ' 🤒' : '')));
    main.appendChild(tmEl('div', 'tmd', r.name + ' · ' + ta.name + (m.sx ? ' · ' + SPECS[m.sx].ic + ' ' + SPECS[m.sx].name + ' ' + specLv(m) : '')));
    if (!mx) { const bar = tmEl('div', 'tmxp', '<i style="width:' + Math.round(clamp(m.xp / xpNeed(m.lv), 0, 1) * 100) + '%"></i>'); main.appendChild(bar); }
    main.appendChild(tmEl('div', 'tmst', '<span>⚡ ' + m.te + '/5</span><span>🛠 ' + m.ge + '/5</span><span>💶 ' + fmt(crewWage(m)) + '</span>' + (mx ? '<span>★ max</span>' : '<span>' + Math.floor(m.xp) + '/' + xpNeed(m.lv) + ' EP</span>')));
    const row = tmEl('div', 'tmup');
    const pill = (l, fn, dis, hot) => { const x = tmEl('button', 'tmpill' + (hot ? ' hot' : ''), l); x.disabled = !!dis; x.addEventListener('click', () => { if (fn()) renderPhone(); }); row.appendChild(x); };
    if (m.sp > 0) { pill('+ ⚡ Tempo', () => crewSkill(m.id, 'te'), m.te >= 5, true); pill('+ 🛠 Geschick', () => crewSkill(m.id, 'ge'), m.ge >= 5, true); }
    if (m.lv >= 3 && !m.sx) (SPEC_FOR[crewKind(m)] || []).forEach(sx => pill(SPECS[sx].ic + ' ' + SPECS[sx].name, () => crewSpec(m.id, sx), false, true));
    if (!mx) pill('📚 Schulung <em>' + (m.tr === G.day ? 'morgen' : fmt(trainCost(m))) + '</em>', () => crewTrain(m.id), m.tr === G.day || G.money < trainCost(m));
    const mt = moveTargets(m);
    if (mt.length) { const sel = tmEl('select', 'tmsel'); sel.appendChild(tmEl('option', '', '↔ Versetzen')); mt.forEach(to => { const o = tmEl('option', '', ROLES[to].name); o.value = to; sel.appendChild(o); }); sel.addEventListener('change', () => { if (sel.value && crewMove(m.id, sel.value)) renderPhone(); }); sel.addEventListener('pointerdown', e => e.stopPropagation()); row.appendChild(sel); }
    if (row.childNodes.length) main.appendChild(row);
    if (m.lv >= 3 && !m.sx) main.appendChild(tmEl('div', 'tmd', (SPEC_FOR[crewKind(m)] || []).map(sx => '<b>' + SPECS[sx].name + '</b>: ' + SPECS[sx].desc).join('<br>')));
    c.appendChild(main); b.appendChild(c);
  }
  function renderCrewOld(b) {
    crewSync(); const k = KR();
    const info = document.createElement('div'); info.className = 'ds'; info.style.margin = '0 0 6px'; info.textContent = 'Jeder Helfer sammelt durch seine Arbeit Erfahrung. Pro Level gibt es einen Punkt für Tempo oder Geschick, ab Level 3 eine Spezialisierung (wird mit Level 6 und 9 stärker). Höhere Level verdienen etwas mehr Lohn. Spezialisierungs-Boni sind gedeckelt.'; b.appendChild(info);
    const sums = Object.keys(SPECS).map(s => SPECS[s].ic + ' ' + SPECS[s].name + ' ' + specSum(s)).join(' · '); krCard(b, 'Team-Stärken', fmt(wageTotal()) + ' / Tag', sums);
    if (!k.crew.length) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = 'Noch keine Helfer. Unter „Anheuern“ stellst du welche ein.'; b.appendChild(e); return; }
    for (const m of k.crew.slice().sort((a, b) => b.lv - a.lv || a.r.localeCompare(b.r))) {
      const r = ROLES[m.r], ta = TALENTS[m.ta], off = m.off > absMin(), mx = m.lv >= CREW_MAX;
      const c = krCard(b, '<span class="dot" style="background:' + r.col + '"></span>' + m.n + ' <span style="color:var(--muted);font-weight:600">' + r.name + ' · Lv ' + m.lv + '</span>' + (off ? ' 🤒' : ''), m.sx ? SPECS[m.sx].ic + ' ' + SPECS[m.sx].name + ' ' + specLv(m) : '',
        'Talent: ' + ta.name + ' · Tempo ' + m.te + '/5 · Geschick ' + m.ge + '/5 · Lohn ' + fmt(crewWage(m)) + '/Tag<br>' + (mx ? 'Höchstes Level' : 'Erfahrung ' + Math.floor(m.xp) + ' / ' + xpNeed(m.lv) + ' · nächstes Level: +1 Punkt' + (m.lv + 1 === 3 ? ', Spezialisierung' : (m.lv + 1) % 3 === 0 ? ', stärkere Spezialisierung' : '')));
      if (!mx) krBar(c, m.xp / xpNeed(m.lv));
      const row = document.createElement('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;grid-column:1/-1';
      const btn = (l, fn, dis, on) => { const x = document.createElement('button'); x.className = 'chip' + (on ? ' on' : ''); x.textContent = l; x.disabled = !!dis; x.addEventListener('click', () => { if (fn()) renderPhone(); }); row.appendChild(x); };
      if (m.sp > 0) { btn('+ Tempo (' + m.sp + ')', () => crewSkill(m.id, 'te'), m.te >= 5, true); btn('+ Geschick (' + m.sp + ')', () => crewSkill(m.id, 'ge'), m.ge >= 5, true); }
      if (m.lv >= 3 && !m.sx) (SPEC_FOR[crewKind(m)] || []).forEach(sx => btn(SPECS[sx].ic + ' ' + SPECS[sx].name, () => crewSpec(m.id, sx), false, true));
      if (!mx) btn('Schulung ' + fmt(trainCost(m)) + (m.tr === G.day ? ' (morgen wieder)' : ''), () => crewTrain(m.id), m.tr === G.day || G.money < trainCost(m));
      moveTargets(m).forEach(to => btn('→ ' + ROLES[to].name, () => crewMove(m.id, to)));
      c.appendChild(row);
      if (m.lv >= 3 && !m.sx) { const d = document.createElement('div'); d.className = 'ds'; d.style.gridColumn = '1/-1'; d.textContent = (SPEC_FOR[crewKind(m)] || []).map(sx => SPECS[sx].name + ': ' + SPECS[sx].desc).join(' · '); c.appendChild(d); }
    }
  }

