  // ---------- v113: Konten (Name + Passwort) und Online-Spielstand ueber Firebase ----------
  // Firebase-Projekt: Authentication (E-Mail/Passwort) und Firestore. Der Spielername wird intern zu einer Kunst-Adresse, es gibt keine echte E-Mail.
  const FB = Object.assign({ apiKey: 'AIzaSyDX_DOa9E62CHRfkosJw3WAAIMX278zjaI', projectId: 'kellergruen-e9313' }, (typeof window !== 'undefined' && window.__KG_FB) || {}); // HIER apiKey und projectId aus der Firebase-Konsole eintragen
  const ACC_KEY = 'kellergruen.acc', OWNER_KEY = 'kellergruen.saveOwner', ACC_MAIL = '@spieler.kellergruen.app';
  const fbOk = () => !!(FB.apiKey && FB.projectId);
  let acc = null; try { const a = JSON.parse(store.get(ACC_KEY, 'null')); if (a && a.uid && a.rt && a.name) acc = a; } catch (e) {}
  const accOn = () => !!(acc && acc.uid);
  let accLast = 0, accUpT = 0, accUpBusy = false, accState = '';
  function nameMail(n) { const b = unescape(encodeURIComponent(String(n).trim().toLowerCase())); let h = ''; for (let i = 0; i < b.length; i++) h += b.charCodeAt(i).toString(16).padStart(2, '0'); return 'n' + h + ACC_MAIL; }
  const ACC_ERR = { EMAIL_EXISTS: 'exists', EMAIL_NOT_FOUND: 'Name oder Passwort stimmt nicht.', INVALID_PASSWORD: 'Name oder Passwort stimmt nicht.', INVALID_LOGIN_CREDENTIALS: 'Name oder Passwort stimmt nicht.', USER_DISABLED: 'Dieses Konto ist gesperrt.', TOO_MANY_ATTEMPTS_TRY_LATER: 'Zu viele Versuche. Bitte warte kurz und versuch es dann nochmal.', WEAK_PASSWORD: 'Das Passwort braucht mindestens 6 Zeichen.', MISSING_PASSWORD: 'Bitte ein Passwort eingeben.' };
  async function fbPost(url, body, form) {
    let r; try { r = await fetch(url, { method: 'POST', headers: { 'Content-Type': form ? 'application/x-www-form-urlencoded' : 'application/json' }, body: form ? body : JSON.stringify(body) }); } catch (e) { throw new Error('Keine Verbindung zum Server. Bist du online?'); }
    let j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) { const code = String((j.error && j.error.message) || '').split(' ')[0].split(':')[0]; const m = ACC_ERR[code]; const e = new Error(m || 'Anmeldung gerade nicht möglich (' + (code || r.status) + ').'); e.code = code; throw e; }
    return j;
  }
  function accSet(name, j) { acc = { name, uid: j.localId || j.user_id, it: j.idToken || j.id_token, rt: j.refreshToken || j.refresh_token, exp: Date.now() + (+(j.expiresIn || j.expires_in) || 3600) * 1000 }; store.set(ACC_KEY, JSON.stringify(acc)); }
  async function accToken() {
    if (!accOn()) throw new Error('Nicht angemeldet');
    if (acc.it && acc.exp - 90000 > Date.now()) return acc.it;
    let j; try { j = await fbPost('https://securetoken.googleapis.com/v1/token?key=' + FB.apiKey, 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(acc.rt), true); }
    catch (e) { if (/TOKEN_EXPIRED|INVALID_REFRESH_TOKEN|USER_NOT_FOUND|USER_DISABLED/.test(e.code || '')) { e.reauth = 1; e.message = 'Bitte neu anmelden, dein Passwort wurde geändert'; } throw e; }
    acc.it = j.id_token; acc.rt = j.refresh_token || acc.rt; acc.exp = Date.now() + (+j.expires_in || 3600) * 1000; store.set(ACC_KEY, JSON.stringify(acc)); return acc.it;
  }
  const docUrl = () => 'https://firestore.googleapis.com/v1/projects/' + FB.projectId + '/databases/(default)/documents/saves/' + acc.uid;
  async function cloudGet() {
    const t = await accToken(); let r; try { r = await fetch(docUrl(), { headers: { Authorization: 'Bearer ' + t } }); } catch (e) { throw new Error('Keine Verbindung zum Server.'); }
    if (r.status === 404) return null; if (!r.ok) throw new Error('Spielstand konnte nicht geladen werden (' + r.status + ').');
    const j = await r.json(), f = j.fields || {}; if (!f.data || typeof f.data.stringValue !== 'string') return null;
    return { data: f.data.stringValue, ts: +((f.ts && (f.ts.integerValue || f.ts.doubleValue)) || 0), rv: +((f.rv && f.rv.integerValue) || 0) };
  }
  let accUpP = null;
  function cloudPut(keep) { // laeuft schon eine Sicherung, kommt diese danach dran
    if (accUpP) return accUpP.then(() => cloudPut1(keep));
    const p = cloudPut1(keep); accUpP = p; p.finally(() => { if (accUpP === p) accUpP = null; }); return p;
  }
  async function cloudPut1(keep) {
    if (!fbOk() || !accOn() || accUpBusy) return false; const raw = store.get(SAVE_KEY, null); if (!raw || store.get(OWNER_KEY, '') !== acc.uid) return false;
    let ts = Date.now(); try { ts = +JSON.parse(raw).sts || ts; } catch (e) { return false; }
    accUpBusy = true;
    try { const t = await accToken(); const r = await fetch(docUrl(), { method: 'PATCH', keepalive: !!keep && raw.length < 60000, headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: saveFields(raw, ts, accRv(), acc.name) }) });
      if (r.ok) { accLast = Date.now(); accState = ''; try { boardPut(false); } catch (e) {} return true; } accState = 'Online-Sicherung fehlgeschlagen (' + r.status + ')'; if (r.status === 403) setTimeout(() => accRemote(), 0); return false;
    } catch (e) { accState = e && e.reauth ? e.message : 'Offline: Spielstand wird gesichert, sobald du wieder online bist'; return false; } finally { accUpBusy = false; }
  }
  function cloudSoon() { if (!fbOk() || !accOn()) return; const now = Date.now(); if (now - accUpT < 25000) return; accUpT = now; cloudPut(false); }
  // Nach dem Anmelden: neuesten Spielstand holen. Ein Spielstand ohne Konto (alte Spieler) wird in das Konto uebernommen.
  async function accSync() {
    if (await accBanned()) { const e = new Error('Dieses Konto wurde gesperrt.'); e.code = 'BANNED'; throw e; }
    acc.adm = await accIsAdmin(); store.set(ACC_KEY, JSON.stringify(acc));
    const uid = acc.uid, cloud = await cloudGet(), local = store.get(SAVE_KEY, null) || null, owner = store.get(OWNER_KEY, '');
    if (cloud && cloud.rv > accRv()) { if (local) store.set(SAVE_KEY + '.vorReset', local); store.set(SAVE_KEY, cloud.data); store.set(OWNER_KEY, uid); accRv(cloud.rv); return true; } // Admin hat zurueckgesetzt
    let lts = 0; try { lts = local ? +JSON.parse(local).sts || 0 : 0; } catch (e) {}
    const mine = !!local && (owner === uid || !owner);
    if (local && !mine) store.set(SAVE_KEY + '.' + owner, local); // Stand eines anderen Kontos auf diesem Geraet sichern
    if (cloud && (!mine || cloud.ts >= lts)) { if (local && mine && !owner) store.set(SAVE_KEY + '.gast', local); store.set(SAVE_KEY, cloud.data); }
    else if (!mine) store.del(SAVE_KEY);
    store.set(OWNER_KEY, uid);
    if (store.get(SAVE_KEY, null) && (!cloud || cloud.ts < lts)) await cloudPut(false);
    return !!store.get(SAVE_KEY, null);
  }
  async function accLogin(name, pw, create) {
    if (!fbOk()) throw new Error('Online-Konten sind noch nicht eingerichtet.');
    const n = mpClean(name, 12); if (n.length < 2) throw new Error('Der Name braucht mindestens 2 Zeichen (Buchstaben, Zahlen, Leerzeichen).');
    if (String(pw || '').length < 6) throw new Error('Das Passwort braucht mindestens 6 Zeichen.');
    const j = await fbPost('https://identitytoolkit.googleapis.com/v1/accounts:' + (create ? 'signUp' : 'signInWithPassword') + '?key=' + FB.apiKey, { email: nameMail(n), password: String(pw), returnSecureToken: true });
    accSet(n, j); try { await accSync(); } catch (e) { if (e.code === 'BANNED') { acc = null; store.del(ACC_KEY); } throw e; } setPlayerName(n); return true;
  }
  async function accLogout(sw) { try { if (G && (state === 'play' || state === 'edit')) save(); await cloudPut(false); } catch (e) {} acc = null; store.del(ACC_KEY); try { if (sw) sessionStorage.setItem('kellergruen.login', '1'); } catch (e) {} try { location.reload(); } catch (e) {} }
  // ---------- v121: Wiederherstellungs-Code (Passwort vergessen) ----------
  // Das Passwort liegt verschluesselt (AES-GCM, Schluessel aus dem Code) unter rec/<sha256(name|code)>. Ohne Code ist es weder auffindbar noch lesbar.
  const REC_AL = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const recNorm = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  function recNew() { const a = new Uint32Array(12); crypto.getRandomValues(a); let s = ''; for (let i = 0; i < 12; i++) { s += REC_AL[a[i] % REC_AL.length]; if (i === 3 || i === 7) s += '-'; } return s; }
  const b64e = u => { const a = new Uint8Array(u); let s = ''; for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]); return btoa(s); };
  const b64d = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function sha256(s) { const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(h)).map(x => x.toString(16).padStart(2, '0')).join(''); }
  const recId = (n, c) => sha256('kgrec|' + mpClean(n, 12).toLowerCase() + '|' + recNorm(c));
  async function recKey(c, salt) { const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(recNorm(c)), 'PBKDF2', false, ['deriveKey']); return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); }
  async function recSeal(c, pw) { const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12)); const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await recKey(c, salt), new TextEncoder().encode(pw)); return { b: b64e(ct), iv: b64e(iv), s: b64e(salt) }; }
  async function recOpen(c, f) { const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64d(f.iv) }, await recKey(c, b64d(f.s)), b64d(f.b)); return new TextDecoder().decode(pt); }
  const recFields = (f, uid) => ({ b: { stringValue: f.b }, iv: { stringValue: f.iv }, s: { stringValue: f.s }, u: { stringValue: uid }, t: { integerValue: String(Date.now()) } });
  let recKnown = null; // null = unbekannt, true/false = Konto hat einen Code
  async function recStore(pw) { // neuer Code fuer das angemeldete Konto, ein alter Code wird ungueltig
    const code = recNew(), id = await recId(acc.name, code), f = await recSeal(code, String(pw)), t = await accToken();
    const H = { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' };
    let old = ''; try { const r = await fetch(fsBase() + 'recp/' + acc.uid, { headers: H }); if (r.ok) { const j = await r.json(); old = (j.fields && j.fields.id && j.fields.id.stringValue) || ''; } } catch (e) {}
    const w = await fetch(fsBase() + 'rec/' + id, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: recFields(f, acc.uid) }) });
    if (!w.ok) throw new Error('Der Code konnte nicht gespeichert werden (' + w.status + '). Sind die neuen Firebase-Regeln veröffentlicht?');
    await fetch(fsBase() + 'recp/' + acc.uid, { method: 'PATCH', headers: H, body: JSON.stringify({ fields: { id: { stringValue: id }, t: { integerValue: String(Date.now()) } } }) });
    if (old && old !== id) { try { await fetch(fsBase() + 'rec/' + old, { method: 'DELETE', headers: H }); } catch (e) {} }
    recKnown = true; return code;
  }
  async function recHas() { try { const r = await fsGet('recp/' + acc.uid); recKnown = r.status === 200 ? true : r.status === 404 ? false : null; } catch (e) { recKnown = null; } return recKnown; }
  async function accVerify(pw) { // prueft das aktuelle Passwort und holt frische Schluessel
    const j = await fbPost('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + FB.apiKey, { email: nameMail(acc.name), password: String(pw), returnSecureToken: true });
    accSet(acc.name, j); return j;
  }
  async function accNewPw(pw, npw) { // Passwort aendern: danach gibt es einen neuen Code
    if (String(npw).length < 6) throw new Error('Das neue Passwort braucht mindestens 6 Zeichen.');
    const j = await accVerify(pw), adm = acc.adm;
    const u = await fbPost('https://identitytoolkit.googleapis.com/v1/accounts:update?key=' + FB.apiKey, { idToken: j.idToken, password: String(npw), returnSecureToken: true });
    accSet(acc.name, Object.assign({}, j, u)); acc.adm = adm; store.set(ACC_KEY, JSON.stringify(acc));
    return recStore(npw);
  }
  async function accRecover(name, code, npw) {
    if (!fbOk()) throw new Error('Online-Konten sind noch nicht eingerichtet.');
    const n = mpClean(name, 12); if (n.length < 2) throw new Error('Bitte deinen Spielernamen eingeben.');
    if (recNorm(code).length !== 12) throw new Error('Der Code hat 12 Zeichen, zum Beispiel ABCD-EFGH-JKMN.');
    if (String(npw || '').length < 6) throw new Error('Das neue Passwort braucht mindestens 6 Zeichen.');
    const id = await recId(n, code); let r; try { r = await fetch(fsBase() + 'rec/' + id); } catch (e) { throw new Error('Keine Verbindung zum Server. Bist du online?'); }
    if (r.status === 404 || r.status === 403) throw new Error('Name oder Code stimmt nicht.'); if (!r.ok) throw new Error('Gerade nicht möglich (' + r.status + ').');
    const jr = await r.json(), f = {}; for (const k of ['b', 'iv', 's']) f[k] = jr.fields && jr.fields[k] && jr.fields[k].stringValue;
    let old; try { old = await recOpen(code, f); } catch (e) { throw new Error('Name oder Code stimmt nicht.'); }
    let j; try { j = await fbPost('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=' + FB.apiKey, { email: nameMail(n), password: old, returnSecureToken: true }); }
    catch (e) { if (e.code === 'USER_DISABLED' || e.code === 'TOO_MANY_ATTEMPTS_TRY_LATER') throw e; throw new Error('Dieser Code ist veraltet. Nimm den neuesten Code, den du bekommen hast.'); }
    const u = await fbPost('https://identitytoolkit.googleapis.com/v1/accounts:update?key=' + FB.apiKey, { idToken: j.idToken, password: String(npw), returnSecureToken: true });
    accSet(n, Object.assign({}, j, u));
    try { const nf = await recSeal(code, String(npw)), t = await accToken(); await fetch(fsBase() + 'rec/' + id, { method: 'PATCH', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: recFields(nf, acc.uid) }) }); recKnown = true; } catch (e) {} // der Code bleibt gueltig
    try { await accSync(); } catch (e) { if (e.code === 'BANNED') { acc = null; store.del(ACC_KEY); } throw e; } setPlayerName(n); return true;
  }
  const agoTxt = t => { const s = Math.round((Date.now() - t) / 1000); return s < 60 ? 'gerade eben' : s < 3600 ? 'vor ' + Math.round(s / 60) + ' Min.' : 'vor ' + Math.round(s / 3600) + ' Std.'; };


  // ---------- v114: Admin, Sperren, Ruecksetzen ----------
  const fsBase = () => 'https://firestore.googleapis.com/v1/projects/' + FB.projectId + '/databases/(default)/documents/';
  function accRv(v) { const k = 'kellergruen.rv.' + (acc ? acc.uid : ''); if (v !== undefined) store.set(k, String(v)); return +store.get(k, '0') || 0; }
  function saveSum(raw) { try { const o = JSON.parse(raw); return JSON.stringify({ d: o.day, m: Math.round(o.money || 0), b: Math.round(o.bank || 0), r: o.rep, p: o.prest || 0, t: o.kr && o.kr.tier, e: Math.round(o.earned || 0), f: flagSum(o.flag), fn: (o.flag && o.flag.n) || 0 }); } catch (e) { return '{}'; } }
  function saveFields(raw, ts, rv, name) { let fl = ''; try { fl = flagSum(JSON.parse(raw).flag); } catch (e) {} return { data: { stringValue: raw }, ts: { integerValue: String(ts) }, name: { stringValue: name }, ver: { integerValue: String(GAME_VER) }, rv: { integerValue: String(rv) }, sum: { stringValue: saveSum(raw) }, flg: { stringValue: fl } }; }
  async function fsGet(path) { const t = await accToken(); const r = await fetch(fsBase() + path, { headers: { Authorization: 'Bearer ' + t } }); return r; }
  async function accBanned() { try { const r = await fsGet('bans/' + acc.uid); return r.status === 200; } catch (e) { return false; } }
  async function accIsAdmin() { try { const r = await fsGet('admins/' + acc.uid); return r.status === 200; } catch (e) { return false; } }
  const isAdm = () => fbOk() && accOn() && !!acc.adm;
  let remoteBusy = false;
  async function accRemote() { // Hochladen wurde abgelehnt: gesperrt oder vom Admin zurueckgesetzt?
    if (remoteBusy || !accOn()) return; remoteBusy = true;
    try {
      if (await accBanned()) { msg('Dein Konto wurde gesperrt. Du wirst abgemeldet.', true); setTimeout(() => { acc = null; store.del(ACC_KEY); try { location.reload(); } catch (e) {} }, 3500); return; }
      const c = await cloudGet(); if (c && c.rv > accRv()) { store.set(SAVE_KEY + '.vorReset', store.get(SAVE_KEY, '')); store.set(SAVE_KEY, c.data); accRv(c.rv); if (state === 'play' && load()) { closePhone(); begin(false); msg('Dein Spielstand wurde vom Admin geändert.', true); } }
    } catch (e) {} finally { remoteBusy = false; }
  }
  // Admin-Ansicht: alle Spieler mit Kurzinfo und Markierungen
  let admList = null, admBans = {}, admErr = '', admFilter = 'all', admBusy = false, admSure = '', admMv = null;
  async function admLoad() {
    admBusy = true; admErr = '';
    try {
      const t = await accToken(), mask = ['name', 'ts', 'sum', 'flg', 'rv', 'ver'].map(f => 'mask.fieldPaths=' + f).join('&'); let list = [], pg = '';
      for (let i = 0; i < 10; i++) { const r = await fetch(fsBase() + 'saves?pageSize=300&' + mask + (pg ? '&pageToken=' + encodeURIComponent(pg) : ''), { headers: { Authorization: 'Bearer ' + t } }); if (!r.ok) throw new Error('Liste nicht lesbar (' + r.status + '). Sind die neuen Regeln veröffentlicht?'); const j = await r.json(); list = list.concat(j.documents || []); pg = j.nextPageToken; if (!pg) break; }
      const rb = await fetch(fsBase() + 'bans?pageSize=300&mask.fieldPaths=t', { headers: { Authorization: 'Bearer ' + t } }); admBans = {}; if (rb.ok) { const jb = await rb.json(); for (const d of jb.documents || []) admBans[d.name.split('/').pop()] = 1; }
      admList = list.map(d => { const f = d.fields || {}; let sm = {}; try { sm = JSON.parse((f.sum && f.sum.stringValue) || '{}'); } catch (e) {} return { uid: d.name.split('/').pop(), name: (f.name && f.name.stringValue) || '?', ts: +((f.ts && f.ts.integerValue) || 0), rv: +((f.rv && f.rv.integerValue) || 0), flg: (f.flg && f.flg.stringValue) || '', sm }; }).sort((a, b) => b.ts - a.ts);
    } catch (e) { admErr = e.message || 'Fehler'; }
    admBusy = false; if (phoneOpen && tab === 'admin') renderPhone();
  }
  async function admBan(uid, on) {
    const t = await accToken(), url = fsBase() + 'bans/' + uid;
    const r = on ? await fetch(url, { method: 'PATCH', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { t: { integerValue: String(Date.now()) }, by: { stringValue: acc.name } } }) }) : await fetch(url, { method: 'DELETE', headers: { Authorization: 'Bearer ' + t } });
    if (!r.ok) throw new Error('Ging nicht (' + r.status + ')'); if (on) admBans[uid] = 1; else delete admBans[uid];
  }
  async function admWrite(p, raw) { // schreibt einen Spielstand fuer einen Spieler und erzwingt ihn (rv + 1)
    const t = await accToken(), r = await fetch(fsBase() + 'saves/' + p.uid, { method: 'PATCH', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: saveFields(raw, Date.now(), p.rv + 1, p.name) }) });
    if (!r.ok) throw new Error('Ging nicht (' + r.status + ')'); p.rv++;
  }
  async function admReset(p) { await admWrite(p, JSON.stringify({ ver: 32, adm: 1, money: 60, rep: 0, earned: 0, day: 1, time: 540, sts: Date.now() })); p.sm = { d: 1, m: 60, b: 0, r: 0, p: 0, t: 1, e: 0, f: '', fn: 0 }; p.flg = ''; }
  async function admCopy(src, dst) { // v121: Spielstand auf ein anderes Konto uebertragen (z. B. Passwort und Code vergessen, neues Konto angelegt)
    const t = await accToken(), r = await fetch(fsBase() + 'saves/' + src.uid + '?mask.fieldPaths=data', { headers: { Authorization: 'Bearer ' + t } }); if (!r.ok) throw new Error('Ging nicht (' + r.status + ')');
    const j = await r.json(); if (!j.fields || !j.fields.data) throw new Error('Kein Spielstand vorhanden'); await admWrite(dst, j.fields.data.stringValue); dst.sm = Object.assign({}, src.sm);
  }
  async function admClearFlags(p) {
    const t = await accToken(), r = await fetch(fsBase() + 'saves/' + p.uid + '?mask.fieldPaths=data', { headers: { Authorization: 'Bearer ' + t } }); if (!r.ok) throw new Error('Ging nicht (' + r.status + ')');
    const j = await r.json(), o = JSON.parse(j.fields.data.stringValue); o.flag = { n: 0, l: [] }; await admWrite(p, signSave(o)); p.flg = ''; p.sm.f = ''; p.sm.fn = 0;
  }
  function renderAdmin(b) {
    const mk = (tag, txt, cls) => { const e = document.createElement(tag); if (txt) e.textContent = txt; if (cls) e.className = cls; return e; };
    if (!isAdm()) { b.appendChild(mk('div', 'Nur für Admins.', 'empty')); return; }
    if (!admList && !admBusy && !admErr) admLoad();
    const top = mk('div', '', 'card'); top.style.gridTemplateColumns = '1fr auto';
    const n = admList ? admList.length : 0, nf = admList ? admList.filter(p => p.flg).length : 0, nb = Object.keys(admBans).length;
    top.appendChild(mk('div', admBusy ? 'Lade Spieler …' : admErr ? admErr : n + ' Spieler · ' + nf + ' markiert · ' + nb + ' gesperrt', 'ds'));
    const rl = mk('button', '⟳ Neu laden', 'buy alt'); rl.addEventListener('click', () => { admList = null; admErr = ''; admLoad(); renderPhone(); }); top.appendChild(rl); b.appendChild(top);
    const seg = mk('div', '', 'tmseg'); [['all', 'Alle'], ['flag', '⚠️ Markiert'], ['ban', '⛔ Gesperrt']].forEach(([k, t]) => { const c = mk('button', t, 'tmsg' + (admFilter === k ? ' on' : '')); c.addEventListener('click', () => { admFilter = k; renderPhone(); }); seg.appendChild(c); }); b.appendChild(seg);
    if (!admList) return;
    if (admMv) { const mv = mk('div', '', 'card'); mv.style.gridTemplateColumns = '1fr auto'; mv.appendChild(mk('div', '📦 Spielstand von ' + admMv.name + ' übertragen: Tippe beim neuen Konto auf „Hierher übertragen“. Dessen bisheriger Stand wird überschrieben.', 'ds')); const x = mk('button', 'Abbrechen', 'buy alt'); x.addEventListener('click', () => { admMv = null; renderPhone(); }); mv.appendChild(x); b.appendChild(mv); }
    const list = admList.filter(p => admFilter === 'all' || (admFilter === 'flag' ? p.flg : admBans[p.uid]));
    if (!list.length) b.appendChild(mk('div', admFilter === 'flag' ? 'Niemand markiert.' : admFilter === 'ban' ? 'Niemand gesperrt.' : 'Noch keine Spieler.', 'empty'));
    for (const p of list) {
      const c = mk('div', '', 'card adm' + (p.flg ? ' flag' : '') + (admBans[p.uid] ? ' ban' : '')); c.style.gridTemplateColumns = '1fr';
      const sm = p.sm || {}, me = p.uid === acc.uid;
      c.appendChild(mk('div', (admBans[p.uid] ? '⛔ ' : p.flg ? '⚠️ ' : '') + p.name + (sm.p ? ' ✦' + sm.p : '') + (me ? ' (du)' : ''), 'nm'));
      c.appendChild(mk('div', 'Tag ' + (sm.d || '?') + ' · Ruf ' + (sm.r ?? '?') + ' · Kategorie ' + (sm.t || '?') + ' · ' + fmt(sm.m || 0) + ' + Konto ' + fmt(sm.b || 0) + ' · Umsatz ' + fmt(sm.e || 0) + ' · gespeichert ' + (p.ts ? agoTxt(p.ts) : '–'), 'ds'));
      if (p.flg) c.appendChild(mk('div', '⚠️ ' + p.flg.split(',').map(x => (FLAG_TXT[x.split(':')[0]] || x) + (x.includes(':') ? ' (' + ((WEAR_BY[x.split(':')[1]] || DECOR.find(d => d.id === x.split(':')[1]) || {}).name || x.split(':')[1]) + ')' : '')).join(' · ') + (sm.fn ? ' · ' + sm.fn + '× erkannt' : ''), 'ds adm-f'));
      const row = mk('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:8px'; const st = mk('div', '', 'ds');
      const bt = (t, cls, key, ask, fn) => { const x = mk('button', t, 'buy' + (cls ? ' ' + cls : '')); x.style.flex = '1 1 110px'; x.addEventListener('click', async () => { if (ask && admSure !== key) { admSure = key; st.innerHTML = '<b style="color:var(--amber)">' + ask + '</b>'; return; } admSure = ''; st.textContent = 'Einen Moment …'; try { await fn(); st.textContent = 'Erledigt.'; setTimeout(() => { if (phoneOpen && tab === 'admin') renderPhone(); }, 600); } catch (e) { st.textContent = e.message; } }); row.appendChild(x); };
      if (!me) bt(admBans[p.uid] ? 'Entsperren' : 'Sperren', admBans[p.uid] ? 'alt' : 'warn', 'ban' + p.uid, admBans[p.uid] ? '' : 'Nochmal tippen: ' + p.name + ' kann dann nicht mehr online speichern oder sich anmelden.', () => admBan(p.uid, !admBans[p.uid]));
      if (p.flg) bt('Markierung löschen', 'alt', 'cl' + p.uid, 'Nochmal tippen: Markierung entfernen (der Spielstand bleibt sonst gleich).', () => admClearFlags(p));
      if (!admMv) bt('Übertragen …', 'alt', '', '', async () => { admMv = p; });
      else if (admMv.uid !== p.uid) bt('Hierher übertragen', '', 'mv' + p.uid, 'Nochmal tippen: Der Spielstand von ' + admMv.name + ' ersetzt den von ' + p.name + '.', async () => { await admCopy(admMv, p); admMv = null; });
      bt('Zurücksetzen', 'alt', 'rs' + p.uid, 'Nochmal tippen: ' + p.name + ' fängt komplett bei Tag 1 an. Das lässt sich nicht rückgängig machen!', () => admReset(p));
      c.appendChild(row); c.appendChild(st); b.appendChild(c);
    }
    const info = mk('div', 'Markierungen setzt das Spiel automatisch, wenn ein Spielstand außerhalb des Spiels verändert wurde oder unmögliche Werte hat. Unmögliche Werte werden dabei schon korrigiert. Markiert heißt nicht sicher geschummelt, schau es dir an, bevor du sperrst. Hat jemand Passwort und Code vergessen: Er legt ein neues Konto an, du überträgst seinen alten Spielstand mit „Übertragen …“ dorthin.', 'ds'); info.style.margin = '8px 2px'; b.appendChild(info);
  }

  // ---------- v123: Fehlerprotokoll (Spieler sehen nichts, der Admin liest alles) ----------
  let errUpT = 0, admErrs = null, admErrBusy = false, admErrMsg = '';
  function errLocal() { try { const L = JSON.parse(store.get('kellergruen.errs', '[]')); return Array.isArray(L) ? L : []; } catch (e) { return []; } }
  async function errUpload() {
    if (!window.__kgErrNew || !fbOk() || !accOn() || Date.now() - errUpT < 60000) return; errUpT = Date.now(); window.__kgErrNew = 0;
    try { const t = await accToken(); await fetch(fsBase() + 'errs/' + acc.uid, { method: 'PATCH', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { n: { stringValue: acc.name }, l: { stringValue: JSON.stringify(errLocal().slice(-20)).slice(0, 18000) }, t: { integerValue: String(Date.now()) }, v: { integerValue: String(GAME_VER) } } }) }); } catch (e) {}
  }
  async function admErrLoad() {
    admErrBusy = true; admErrMsg = '';
    try { const t = await accToken(), r = await fetch(fsBase() + 'errs?pageSize=300', { headers: { Authorization: 'Bearer ' + t } }); if (!r.ok) throw new Error('Nicht lesbar (' + r.status + '). Sind die neuen Firebase-Regeln veröffentlicht?');
      const j = await r.json(), all = {};
      for (const d of j.documents || []) { const f = d.fields || {}, nm = (f.n && f.n.stringValue) || '?'; let L = []; try { L = JSON.parse((f.l && f.l.stringValue) || '[]'); } catch (e) {}
        for (const e of L) { const k = e.m + '|' + e.w; const a = all[k] || (all[k] = { m: e.m, w: e.w, s: e.s, n: 0, p: new Set(), t: 0, v: 0 }); a.n += e.n || 1; a.p.add(nm); a.t = Math.max(a.t, e.t || 0); a.v = Math.max(a.v, e.v || 0); } }
      admErrs = Object.values(all).sort((a, b) => b.t - a.t);
    } catch (e) { admErrMsg = e.message; }
    admErrBusy = false; if (phoneOpen && tab === 'admerr') renderPhone();
  }
  function renderAdmErr(b) {
    if (!isAdm() && !cmdOk) { b.appendChild(uiEl('div', 'empty', 'Nur für Admins.')); return; }
    const show = store.get('kellergruen.showerr', '') === '1', mine = errLocal();
    uiInfo(b, 'Spieler sehen keine Fehlermeldungen mehr. Jedes Gerät merkt sich seine letzten 30 Fehler, mit Konto werden sie online gespeichert. Kopiere die Liste und schick sie mir, dann kann ich sie beheben.');
    const c = uiEl('div', 'card'); c.style.gridTemplateColumns = '1fr'; c.appendChild(uiEl('div', 'nm', '⚙️ Einstellungen')); const r = uiEl('div'); r.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;grid-column:1/-1';
    const bt = (t, cls, fn) => { const x = uiEl('button', 'buy' + (cls ? ' ' + cls : ''), t); x.style.flex = '1 1 130px'; x.addEventListener('click', fn); r.appendChild(x); };
    bt(show ? 'Bei mir ausblenden' : 'Bei mir oben anzeigen', 'alt', () => { store.set('kellergruen.showerr', show ? '' : '1'); renderPhone(); });
    bt('⟳ Fehler aller Spieler laden', '', () => { admErrs = null; admErrLoad(); renderPhone(); });
    bt('📋 Alles kopieren', 'alt', () => { const L = (admErrs || []).map(e => '[' + e.n + '× · v' + e.v + ' · ' + [...e.p].slice(0, 5).join(', ') + '] ' + e.m + ' (' + e.w + ')' + (e.s ? '\n  ' + e.s.split('\n').slice(0, 3).join('\n  ') : '')).concat(mine.map(e => '[dieses Gerät ' + e.n + '× · v' + e.v + '] ' + e.m + ' (' + e.w + ')' + (e.s ? '\n  ' + e.s.split('\n').slice(0, 3).join('\n  ') : ''))).join('\n'); try { navigator.clipboard.writeText(L || 'Keine Fehler').then(() => msg('Fehlerliste kopiert'), () => msg('Kopieren ging nicht', true)); } catch (e) {} });
    bt('Eigene löschen', 'alt', () => { store.set('kellergruen.errs', '[]'); renderPhone(); });
    c.appendChild(r); b.appendChild(c);
    krGrp(b, 'Alle Spieler' + (admErrs ? ' · ' + admErrs.length + ' verschiedene' : ''));
    if (admErrBusy) b.appendChild(uiEl('div', 'empty', 'Lade …')); else if (admErrMsg) b.appendChild(uiEl('div', 'empty', admErrMsg)); else if (!admErrs) b.appendChild(uiEl('div', 'empty', 'Noch nicht geladen.')); else if (!admErrs.length) b.appendChild(uiEl('div', 'empty', 'Keine Fehler gemeldet. 🎉'));
    for (const e of admErrs || []) { const k = krCard(b, e.m.replace(/[<>&]/g, ''), e.n + '×', 'Stelle ' + e.w + ' · Version ' + e.v + ' · zuletzt ' + agoTxt(e.t) + ' · bei ' + [...e.p].slice(0, 6).join(', ').replace(/[<>&]/g, '')); k.querySelector('.nm').style.fontSize = '13px'; }
    krGrp(b, 'Dieses Gerät · ' + mine.length);
    if (!mine.length) b.appendChild(uiEl('div', 'empty', 'Keine Fehler auf diesem Gerät.'));
    for (const e of mine.slice().reverse()) { const k = krCard(b, String(e.m).replace(/[<>&]/g, ''), (e.n || 1) + '×', 'Stelle ' + e.w + ' · Version ' + (e.v || '?') + ' · ' + agoTxt(e.t)); k.querySelector('.nm').style.fontSize = '13px'; }
  }
  // ---------- v115: Admin-Befehle an Spieler (sicher ueber Firestore: nur der Admin darf schreiben, jeder liest nur seine eigenen) ----------
  const troll = { flip: 0, freeze: 0, slow: 0, fast: 0, shake: 0 };
  const admQ = {}; let admPk = [];
  function admPokes() { const n = Date.now(); admPk = admPk.filter(p => n - p.t < 8000); return admPk.length ? admPk.map(p => p.id) : undefined; }
  async function admSend(tg, k, a) {
    if (!isAdm() || !tg || !tg.uid) throw new Error('Nur für Admins');
    const q = admQ[tg.uid] || (admQ[tg.uid] = []); q.push({ id: Math.random().toString(36).slice(2, 10), k, a: a || null, t: Date.now(), by: acc.name }); while (q.length > 6) q.shift();
    const t = await accToken(), r = await fetch(fsBase() + 'cmds/' + tg.uid, { method: 'PATCH', headers: { Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { c: { stringValue: JSON.stringify(q) }, t: { integerValue: String(Date.now()) } } }) });
    if (!r.ok) throw new Error('Ging nicht (' + r.status + '). Sind die neuen Regeln veröffentlicht?');
    if (tg.mpId && mp.on) { admPk.push({ id: tg.mpId, t: Date.now() }); mp.sendT = 9; try { mpSend(); } catch (e) {} }
    return true;
  }
  let cmdPollT = 0, cmdBusy = false;
  async function cmdPoll(now) {
    if (!fbOk() || !accOn() || cmdBusy || state !== 'play') return; const n = Date.now(); if (n - cmdPollT < (now ? 2500 : 45000)) return; cmdPollT = n; cmdBusy = true;
    try {
      const t = await accToken(), r = await fetch(fsBase() + 'cmds/' + acc.uid, { headers: { Authorization: 'Bearer ' + t } }); if (!r.ok) return;
      const j = await r.json(), list = JSON.parse((j.fields && j.fields.c && j.fields.c.stringValue) || '[]'); let seen = []; try { seen = JSON.parse(store.get('kellergruen.cmdseen', '[]')); } catch (e) {}
      for (const c of Array.isArray(list) ? list : []) {
        if (!c || typeof c.id !== 'string' || seen.includes(c.id)) continue; seen.push(c.id);
        const age = Date.now() - (+c.t || 0), long = c.k === 'gift' || c.k === 'msg' || c.k === 'kill'; if (age > (long ? 864e5 : 6e5) || age < -6e5) continue;
        cmdRun(c);
      }
      store.set('kellergruen.cmdseen', JSON.stringify(seen.slice(-40)));
    } catch (e) {} finally { cmdBusy = false; }
  }
  function safeSpot(x, y) { for (let r = 0; r < 260; r += 12) for (let a = 0; a < 8; a++) { const px = x + Math.cos(a * Math.PI / 4) * r, py = y + Math.sin(a * Math.PI / 4) * r; if (!blockedPt(px, py, 10) && !inBuilding(px, py)) return { x: px, y: py }; if (!r) break; } return { x: DOOR.x, y: DOOR.y }; }
  function tpTo(x, y) { if (!G || GH_ON) return false; if (G.veh) G.veh.on = false; busRide = null; const p = safeSpot(x, y); player.fl = 0; player.x = p.x; player.y = p.y; player.stun = 0; petSnap(); sfx.put(); return true; }
  function trollFx(kind) { // kurze Bildschirm-Effekte
    try { const el = document.createElement('div'); el.className = 'trollfx ' + kind; el.innerHTML = kind === 'confetti' ? Array.from({ length: 40 }, (_, i) => '<i class="tu-c" style="left:' + ((i * 23) % 100) + '%;animation-delay:' + ((i % 10) * 0.1).toFixed(1) + 's;background:' + ['#FFD24A', '#63FF9A', '#FF8FD0', '#5CB8FF', '#B58CFF'][i % 5] + '"></i>').join('') : ''; document.body.appendChild(el); setTimeout(() => { try { el.remove(); } catch (e) {} }, kind === 'confetti' ? 4500 : 2500); } catch (e) {}
  }
  function cmdRun(c) {
    const by = String(c.by || 'Admin').slice(0, 16), a = c.a || {}, T = gt;
    switch (c.k) {
      case 'tp': if (Number.isFinite(+a.x) && Number.isFinite(+a.y) && tpTo(+a.x, +a.y)) msg('✨ ' + by + ' hat dich zu sich geholt', false, 'gold'); break;
      case 'home': if (tpTo(DOOR.x, DOOR.y + 30)) msg('🏠 ' + by + ' hat dich nach Hause geschickt', false, 'gold'); break;
      case 'party': doEmote('party'); trollFx('confetti'); sfx.cash(); msg('🎉 Party! (von ' + by + ')', false, 'gold'); break;
      case 'flip': troll.flip = T + 15; msg('🔄 Huch? Deine Steuerung ist 15 Sekunden vertauscht', true); break;
      case 'freeze': troll.freeze = T + 8; trollFx('ice'); msg('🧊 Eingefroren! 8 Sekunden', true); break;
      case 'slow': troll.slow = T + 15; troll.fast = 0; msg('🐌 Du bist 15 Sekunden ganz langsam', true); break;
      case 'fast': troll.fast = T + 15; troll.slow = 0; msg('⚡ Turbo für 15 Sekunden!', false, 'ok'); break;
      case 'shake': troll.shake = T + 6; msg('🌪️ Erdbeben!', true); break;
      case 'siren': sfx.siren(); setTimeout(() => { try { sfx.siren(); } catch (e) {} }, 400); trollFx('siren'); msg('🚨 Die Polizei sucht dich! … Nur Spaß 😄', true); break;
      case 'msg': if (a.t) { msg('📣 ' + by + ': ' + String(a.t).slice(0, 120), false, 'gold'); sfx.ping(); } break;
      case 'gift': { const v = Math.max(0, Math.min(1e7, Math.floor(+a.v) || 0)); if (v && G) { G.money += v; sfx.cash(); msg('🎁 Geschenk von ' + by + ': ' + fmt(v), false, 'ok'); save(); } break; }
      case 'kill': doKill(by); break;
    }
  }
  // Admin-App: Werkzeuge fuer dich selbst
  function admMark() { if (G) G.cmdU = 1; }
  function renderAdmTool(b) {
    const mk = (tag, txt, cls) => { const e = document.createElement(tag); if (txt) e.textContent = txt; if (cls) e.className = cls; return e; };
    if (!isAdm()) { b.appendChild(mk('div', 'Nur für Admins.', 'empty')); return; }
    const card = (title, desc) => { const c = mk('div', '', 'card'); c.style.gridTemplateColumns = '1fr'; c.appendChild(mk('div', title, 'nm')); if (desc) c.appendChild(mk('div', desc, 'ds')); b.appendChild(c); return c; };
    const row = c => { const r = mk('div'); r.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:6px'; c.appendChild(r); return r; };
    const btn = (r, t, fn, cls) => { const x = mk('button', t, 'buy' + (cls ? ' ' + cls : '')); x.style.flex = '1 1 90px'; x.addEventListener('click', () => { fn(); }); r.appendChild(x); return x; };
    const num = (r, ph) => { const i = mk('input'); i.type = 'number'; i.inputMode = 'numeric'; i.placeholder = ph; i.className = 'adm-in'; i.addEventListener('keydown', e => e.stopPropagation()); i.addEventListener('keyup', e => e.stopPropagation()); r.appendChild(i); return i; };
    const st = mk('div', '', 'ds'); const say = t => { st.textContent = t; }; 
    { const c = card('💰 Geld und Ruf', 'Gilt für deinen eigenen Spielstand. Wird nicht als Schummeln markiert.'); const r = row(c); const ig = num(r, 'Betrag');
      btn(r, '+ dazu', () => { const v = Math.floor(+ig.value) || 0; admMark(); G.money = Math.max(0, G.money + v); save(); say('Geld: ' + fmt(G.money)); }); btn(r, 'Setzen', () => { admMark(); G.money = Math.max(0, Math.floor(+ig.value) || 0); save(); say('Geld: ' + fmt(G.money)); }, 'alt');
      const r2 = row(c), ir = num(r2, 'Ruf 0–100'); btn(r2, 'Ruf setzen', () => { admMark(); G.rep = clamp(Math.floor(+ir.value) || 0, 0, REP_MAX); G.repP = G.rep; save(); say('Ruf: ' + G.rep); });
      const r3 = row(c), ik = num(r3, 'Kategorie 1–11'); btn(r3, 'Kategorie setzen', () => { admMark(); KR().tier = clamp(Math.floor(+ik.value) || 1, 1, TIERS.length); save(); say('Kategorie: ' + TIERS[KR().tier - 1].name); });
      const r4 = row(c), ip = num(r4, 'Prestige 0–10'); btn(r4, 'Prestige setzen', () => { admMark(); G.prest = clamp(Math.floor(+ip.value) || 0, 0, PRES_MAX); save(); say('Prestige: ' + G.prest); });
      c.appendChild(st); }
    { const c = card('🎁 Alles freischalten', 'Für Tests: schaltet alles auf einmal frei.'); const r = row(c);
      btn(r, 'Alle Kleidung', () => { admMark(); for (const w of WEAR) G.wear.owned[w.id] = true; save(); say2('Alle Kleidung freigeschaltet'); });
      btn(r, 'Alle Deko (je 1)', () => { admMark(); for (const d of DECOR) G.dec.owned[d.id] = Math.max(G.dec.owned[d.id] || 0, 1); save(); say2('Alle Deko freigeschaltet'); });
      btn(r, 'Alle Kosmetik', () => { admMark(); for (const x of COS) G.cos.owned[x.id] = true; save(); say2('Alle Kosmetik freigeschaltet'); });
      btn(r, 'Alle Fahrzeuge', () => { admMark(); for (const v of VEHS) G.veh.owned[v.id] = true; save(); say2('Alle Fahrzeuge freigeschaltet'); });
      const s2 = mk('div', '', 'ds'); c.appendChild(s2); var say2 = t => { s2.textContent = t; }; }
    { const c = card('🕒 Tageszeit'); const r = row(c); [['Morgen', 7.5], ['Mittag', 12], ['Abend', 19], ['Nacht', 23]].forEach(([t, h]) => btn(r, t, () => { G.time = h * 60; save(); }, 'alt')); }
    { const c = card('🚌 Teleport', 'Spring sofort zu einem Ort (auch in gesperrte Gebiete).'); const r = row(c);
      busStops().forEach(s0 => btn(r, s0.name, () => { closePhone(); tpTo(s0.x, s0.y + (s0.up ? 20 : -20)); }, 'alt'));
      btn(r, 'Keller', () => { closePhone(); tpTo(DOOR.x, DOOR.y + 30); }, 'alt'); }
    { const c = card('📣 Nachricht an alle', 'Erscheint bei allen Spielern als Meldung (wie -info).'); const ti = mk('input'); ti.type = 'text'; ti.maxLength = 140; ti.placeholder = 'Text …'; ti.className = 'adm-in'; ti.style.width = '100%'; ti.addEventListener('keydown', e => e.stopPropagation()); ti.addEventListener('keyup', e => e.stopPropagation()); c.appendChild(ti); const r = row(c);
      btn(r, 'Senden', () => { const tx = ti.value.trim(); if (!tx) return; const o = cleanNews({ ts: Date.now(), tx, up: 0 }); if (o) { publishNews(o); try { store.set(NEWS_KEY, String(o.ts)); } catch (e) {} } ti.value = ''; msg('An alle gesendet'); });
      btn(r, 'Update-Meldung', () => { const o = cleanNews({ ts: Date.now(), tx: NEWS_UPDATE, up: 1 }); if (o) { publishNews(o); try { store.set(NEWS_KEY, String(o.ts)); } catch (e) {} } msg('Update-Meldung gesendet'); }, 'alt');
      btn(r, 'Löschen', () => { publishNews(null); msg('Nachricht an alle gelöscht'); }, 'alt'); }
    { const c = card('🛠️ Sonstiges'); const r = row(c);
      btn(r, masterOn ? 'MASTER-Schild aus' : 'MASTER-Schild an', () => { masterOn = !masterOn; store.set(MASTER_KEY, masterOn ? '1' : '0'); if (mp.on) mp.sendT = 9; renderPhone(); }, 'alt');
      btn(r, 'Karten-Editor', () => { closePhone(); if (!startAdmin()) msg('Erst ins Spiel gehen', true); }, 'alt'); }
  }
  // Admin-App: Troll und Spieler online
  function renderAdmTroll(b) {
    const mk = (tag, txt, cls) => { const e = document.createElement(tag); if (txt) e.textContent = txt; if (cls) e.className = cls; return e; };
    if (!isAdm()) { b.appendChild(mk('div', 'Nur für Admins.', 'empty')); return; }
    const fl = Object.values(mp.friends || {});
    const info = mk('div', mp.on ? fl.length + ' andere Spieler online. Effekte kommen nur bei Spielern mit Konto an (ein paar Sekunden Verzögerung).' : 'Du bist gerade offline. Geh online unter Freunde → Online.', 'ds'); info.style.margin = '0 2px 6px'; b.appendChild(info);
    if (!fl.length) { b.appendChild(mk('div', mp.on ? 'Gerade ist niemand sonst online.' : 'Nicht verbunden.', 'empty')); return; }
    const T = [['📍', 'Zu mir holen', 'tp'], ['🏠', 'Nach Hause', 'home'], ['🎉', 'Party', 'party'], ['🔄', 'Steuerung vertauschen', 'flip'], ['🧊', 'Einfrieren', 'freeze'], ['🐌', 'Langsam', 'slow'], ['⚡', 'Turbo', 'fast'], ['🌪️', 'Erdbeben', 'shake'], ['🚨', 'Fake-Polizei', 'siren']];
    for (const f of fl) {
      const c = mk('div', '', 'card'); c.style.gridTemplateColumns = '1fr';
      c.appendChild(mk('div', f.name + (f.ps ? ' ✦' + f.ps : '') + (f.u ? '' : ' · ohne Konto'), 'nm')); c.appendChild(mk('div', friendWhere(f), 'ds'));
      const st = mk('div', '', 'ds'); const r = mk('div'); r.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:6px';
      const go = mk('button', '🚀 Zu ihm', 'buy alt'); go.style.flex = '1 1 90px'; go.addEventListener('click', () => { if (f.rg) { st.textContent = 'Ist gerade in einem Keller.'; return; } closePhone(); tpTo(f.x, f.y + 24); }); r.appendChild(go);
      for (const [ic, nm, k] of T) { const x = mk('button', ic + ' ' + nm, 'buy alt'); x.style.flex = '1 1 90px'; x.disabled = !f.u; x.addEventListener('click', async () => { st.textContent = 'Sende …'; try { await admSend({ uid: f.u, mpId: f.id, name: f.name }, k, k === 'tp' ? { x: Math.round(player.x), y: Math.round(player.y) } : null); st.textContent = nm + ' an ' + f.name + ' geschickt.'; } catch (e) { st.textContent = e.message; } }); r.appendChild(x); }
      c.appendChild(r);
      const r2 = mk('div'); r2.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:6px'; const ti = mk('input'); ti.type = 'text'; ti.maxLength = 120; ti.placeholder = 'Nachricht nur an ' + f.name; ti.className = 'adm-in'; ti.style.flex = '2 1 160px'; ti.addEventListener('keydown', e => e.stopPropagation()); ti.addEventListener('keyup', e => e.stopPropagation()); r2.appendChild(ti);
      const sb = mk('button', '📣 Senden', 'buy'); sb.style.flex = '1 1 80px'; sb.disabled = !f.u; sb.addEventListener('click', async () => { const tx = ti.value.trim(); if (!tx) return; try { await admSend({ uid: f.u, mpId: f.id }, 'msg', { t: tx }); ti.value = ''; st.textContent = 'Nachricht geschickt.'; } catch (e) { st.textContent = e.message; } }); r2.appendChild(sb);
      const gi = mk('input'); gi.type = 'number'; gi.placeholder = '€'; gi.className = 'adm-in'; gi.style.flex = '1 1 70px'; gi.addEventListener('keydown', e => e.stopPropagation()); r2.appendChild(gi);
      const gb = mk('button', '🎁 Schenken', 'buy alt'); gb.style.flex = '1 1 80px'; gb.disabled = !f.u; gb.addEventListener('click', async () => { const v = Math.floor(+gi.value) || 0; if (v <= 0) return; try { await admSend({ uid: f.u, mpId: f.id }, 'gift', { v }); gi.value = ''; st.textContent = fmt(v) + ' an ' + f.name + ' geschenkt.'; } catch (e) { st.textContent = e.message; } }); r2.appendChild(gb);
      c.appendChild(r2);
      let sure = false; const r3 = mk('div'); r3.style.cssText = 'display:flex;gap:6px;margin-top:6px'; const kb = mk('button', '💀 Kill (alles zurücksetzen)', 'buy warn'); kb.style.flex = '1'; kb.disabled = !f.u;
      kb.addEventListener('click', async () => { if (!sure) { sure = true; st.innerHTML = '<b style="color:var(--amber)">Nochmal tippen: ' + f.name + ' verliert alles außer Kosmetik. Er kann es nur auf seinem Gerät mit -undo zurückholen.</b>'; return; } sure = false; try { await admSend({ uid: f.u, mpId: f.id }, 'kill'); st.textContent = 'Gekillt.'; } catch (e) { st.textContent = e.message; } });
      r3.appendChild(kb); c.appendChild(r3); c.appendChild(st); b.appendChild(c);
    }
  }
  // ---------- v114: Schutz gegen Schummeln (Pruefsumme, Plausibilitaet, Markierungen fuer den Admin) ----------
  function kgHash(str) { let h1 = 0xdeadbeef ^ 0x6b67, h2 = 0x41c6ce57 ^ 0x6b67; for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return (h2 >>> 0).toString(36) + (h1 >>> 0).toString(36); }
  const SIG_K = ['k3l', 'Gr', '9n!', 'x7'].join('·');
  function signSave(o) { delete o.sig; o.sig = kgHash(SIG_K + JSON.stringify(o)); return JSON.stringify(o); }
  function sigOk(s) { // alte Spielstaende (vor v114) und Admin-Ruecksetzungen haben keine Pruefsumme
    if (!s || typeof s !== 'object') return false; if (s.sig === undefined) return (+s.ver || 0) < 33 || s.adm === 1;
    const { sig, ...rest } = s; return kgHash(SIG_K + JSON.stringify(rest)) === sig;
  }
  const FLAG_TXT = { sig: 'Spielstand außerhalb des Spiels verändert', rep: 'Ruf über 100', prest: 'Prestige ungültig', tier: 'Kategorie ungültig', num: 'Ungültige Zahlen (Geld, Konto, Umsatz)', money: 'Unmöglich viel Geld', item: 'Exklusives Item ohne Freischaltung', cmd: 'Befehle benutzt' };
  function cleanFlag(f) { const o = { n: 0, l: [] }; if (!f || typeof f !== 'object') return o; o.n = clamp(Math.floor(+f.n) || 0, 0, 1e6); if (Array.isArray(f.l)) o.l = f.l.filter(x => Array.isArray(x) && FLAG_TXT[String(x[1]).split(':')[0]]).slice(-20).map(x => [+x[0] || 0, String(x[1]).slice(0, 40)]); return o; }
  function flagAdd(code) { if (!G) return; if (!G.flag) G.flag = { n: 0, l: [] }; if ((G.cmdU || cmdOk || isAdm()) && code !== 'sig') return; // v114: wer mit dem Admin-Passwort Befehle nutzt, wird nicht markiert
 G.flag.n++; const last = G.flag.l[G.flag.l.length - 1]; if (last && last[1] === code && Date.now() - last[0] < 6e5) return; G.flag.l.push([Date.now(), code]); if (G.flag.l.length > 20) G.flag.l.shift(); }
  const flagSum = f => f && f.l && f.l.length ? f.l.map(x => x[1]).filter((v, i, a) => a.indexOf(v) === i).join(',') : '';
  // Werte, die im normalen Spiel nicht vorkommen koennen, werden korrigiert und markiert. Bewusst vorsichtig: lieber etwas uebersehen als Ehrliche markieren.
  function cheatScan() {
    if (!G) return; const k = KR();
    const fin = (o, key, max) => { const v = +o[key]; if (!Number.isFinite(v) || v < 0) { o[key] = 0; flagAdd('num'); } else if (v > max) { o[key] = max; flagAdd('money'); } };
    fin(G, 'money', 1e12); fin(G, 'bank', 1e10); fin(G, 'earned', 1e13);
    if (G.rep > REP_MAX || (G.repP || 0) > REP_MAX + 1e-6) { G.rep = Math.min(G.rep, REP_MAX); G.repP = Math.min(G.repP || 0, REP_MAX); flagAdd('rep'); }
    if (!(G.prest >= 0 && G.prest <= PRES_MAX) || G.prest !== Math.floor(G.prest)) { G.prest = clamp(Math.floor(+G.prest) || 0, 0, PRES_MAX); flagAdd('prest'); }
    if (!(k.tier >= 1 && k.tier <= TIERS.length)) { k.tier = clamp(Math.floor(+k.tier) || 1, 1, TIERS.length); flagAdd('tier'); }
    const P = G.prest || 0, done = id => CHAR_BY[id] && qDone(CHAR_BY[id]), ach = id => !!(G.ach && G.ach.done && G.ach.done[id]);
    const need = { capegold: () => P > 0 || k.tier >= 6, legend: () => P > 0 || k.tier >= TIERS.length || ach('r100'), capecheck: () => done('toni'), spotlight: () => done('mira'), wgold: () => done('lindner') };
    PRES_ITEM.forEach((id, i) => { if (id) need[id] = () => P >= i; });
    for (const it of MK_SHOP) if (it.w) need[it.w] = () => !!(G.lg && G.lg.bw[it.id]); // v121: Sammler-Laden
    if (G.cmdU || cmdOk) return; // Admin-Befehle: exklusive Items duerfen bleiben
    for (const [id, ok] of Object.entries(need)) if (G.wear.owned[id] && !ok()) { delete G.wear.owned[id]; for (const sl of Object.keys(WEAR_KEY)) { const lk = WEAR_KEY[sl]; if (G.look[lk] === id) G.look[lk] = WEAR_DEF[lk]; } flagAdd('item:' + id); }
    const dNeed = { masterpiece: done('hagen') ? 1 : 0, citykey: done('lindner') ? 1 : 0, prtrophy: P };
    for (const [id, mx] of Object.entries(dNeed)) if ((G.dec.owned[id] || 0) > mx) { G.dec.owned[id] = mx; for (const key of DEC_KEYS) { let over = placedCount(id) - mx; for (let i = G.dec.items[key].length - 1; i >= 0 && over > 0; i--) if (G.dec.items[key][i].id === id) { G.dec.items[key].splice(i, 1); over--; } } flagAdd('item:' + id); }
  }
  let bakT = Date.now();
  function save() {
    if (!G || saveBlocked || (state !== 'play' && state !== 'edit')) return;
    cheatScan(); if (Date.now() - bakT > 300000) { bakT = Date.now(); try { const cur = store.get(SAVE_KEY, null); if (cur && JSON.parse(cur).money !== undefined) store.set(SAVE_KEY + '.auto', cur); } catch (e) {} } // v122: alle 5 Minuten eine frische Sicherung
    store.set(SAVE_KEY, signSave(saveObj())); cloudSoon(); cmdPoll(false);
  }
  // Uebernimmt nur bekannte Felder mit endlichen Zahlen >= 0; fehlende Felder behalten ihren Standardwert
  function clampUp(up, area) { for (const u of UPS) if ((u.area === area || (area === 'keller' && u.area === 'all')) && typeof up[u.id] === 'number') up[u.id] = Math.min(u.max, Math.floor(up[u.id])); }
  function mergeNum(dst, src) {
    if (!dst || !src || typeof src !== 'object') return;
    for (const k of Object.keys(dst)) if (typeof dst[k] === 'number' && Number.isFinite(+src[k]) && src[k] !== null && +src[k] >= 0) dst[k] = +src[k];
  }
  // Schrittweise Aufwertung alter Spielstaende. Neue Version = neuer Schritt hier, Fortschritt bleibt immer erhalten.
  function migrate(s) {
    const v = +s.ver || 0;
    // v0-v7: Felder wie t, dec, cos.pet, up.compass, staff-Rollen fehlen evtl. -> werden unten mit Standardwerten ergaenzt
    if (v < 9) {
      // Deko stand auf 12 festen Plaetzen -> jetzt frei platzierbar: Teile behalten ihre Position
      if (s.dec && typeof s.dec === 'object' && s.dec.placed && !s.dec.items) {
        s.dec.items = {};
        for (const k of AREA_KEYS) {
          const arr = Array.isArray(s.dec.placed[k]) ? s.dec.placed[k] : [];
          s.dec.items[k] = arr.map((id, i) => (AREAS[k].slots[i] && typeof id === 'string' ? { id, x: AREAS[k].slots[i][0], y: AREAS[k].slots[i][1] } : null)).filter(Boolean);
        }
      }
    }
    if (v < 10) {
      // Ruf hat jetzt Nachkommastellen (repP), Begleiter haben zwei Plaetze (cos.pet2), neue Upgrade-Felder (up.dry) -> Standardwerte genuegen
      if (!Number.isFinite(+s.repP)) s.repP = +s.rep || 0;
    }
    if (v < 12) {
      // Toepfe auf 12 begrenzt (2 + max. 10 Upgrades): ueberzaehlige Stufen werden erstattet
      for (const u of [s.up, s.t && s.t.up]) {
        if (u && +u.pots > 10) { let back = 0; for (let l = 10; l < Math.floor(+u.pots); l++) back += ext(120, 1.7, 5, l); s.money = (+s.money || 0) + back; u.pots = 10; }
      }
    }
    // v13: neue Felder up.sack / up.cart (Standard 0), Scheune bringt +10 Rucksackplaetze automatisch
    // v14: neues Feld wpn (Schlaeger) -> Standardwerte genuegen
    // v15: neue Brauerei (Feld b, area brau) -> Standardwerte genuegen
    // v16: neues Feld wear (gekaufte Kleidung), look hat neue Felder (top, bot, cos, aura, mehr Frisuren/Huete) -> Standardwerte genuegen
    // v17: neues Feld eod (Umsatz am letzten Tagesende fuer die Steuer) -> Standard = aktueller Umsatz
    // v18: neue Felder stat (Zähler) und ach (abgeholte Ziele) -> Standardwerte genügen
    // v19: look.shoe (Schuhe), neue Frisuren/Kleidung/Huete/Deko -> cleanLook ergaenzt fehlende Felder mit Standardwerten
    // v20: neues Feld veh (Fahrzeuge) -> Standardwerte genuegen
    // v21 (Version 54): Etagen (fl) und Bandana (look.bnd) kommen beim Laden als Standard dazu, der schmalere Keller rueckt Deko und Layout von selbst zurecht.
    // v22 (Version 61): neues Feld stash (Muelleimer-Verstecke) -> fehlt es, ist es leer
    // v26 (Version 84): neues Feld tut (Einführung: '' = noch nicht gesehen, 'done', 'skip') -> fehlt es, kommt die Einführung einmal
    // v25 (Version 81): neues Feld kr (Rufstufe, Questketten, Mitarbeiter, Ereignisse) -> fehlt es, startet die Karriere neu; die Rufstufe wird aus dem bisherigen Ruf nachgeholt
    // v23 (Version 66): neue Felder lager (Lager im Ostpark) und veh.col (Autofarben) -> fehlen sie, gelten die Standardwerte
    // v24 (Version 69): neues Feld veh.tune (Tuning je Auto) -> fehlt es, ist nichts getunt
    // if (v < 25) { ...kuenftige Umbauten hier... }
    s.ver = SAVE_VER;
    return s;
  }
  function loadKey(k) { const raw = store.get(k, null), cur = store.get(SAVE_KEY, null); if (!raw) return false; store.set(SAVE_KEY + '.kaputt', cur || ''); store.set(SAVE_KEY, raw); if (load()) return true; if (cur !== null) store.set(SAVE_KEY, cur); return false; }
  function load(fromBak) {
    try {
      let s = JSON.parse(store.get(fromBak ? SAVE_KEY + '.bak' : SAVE_KEY, 'null'));
      if (!s || typeof s !== 'object' || !Number.isFinite(+s.money)) return false;
      const sigBad = !sigOk(s); // v114: Spielstand ausserhalb des Spiels veraendert?
      if ((+s.ver || 0) < SAVE_VER && !fromBak) backupSave();
      s = migrate(s);
      newGame();
      Object.assign(G, { money: Math.max(0, +s.money), rep: Math.max(0, Math.floor(+s.rep) || 0), earned: Math.max(0, +s.earned || 0), day: Math.max(1, Math.floor(+s.day) || 1), time: clamp(+s.time || 540, 0, 24 * 60), won: !!s.won, eod: Math.max(0, Math.min(+s.earned || 0, s.eod === undefined ? (+s.earned || 0) : (+s.eod || 0))) });
      G.biz = {}; if (s.biz && typeof s.biz === 'object') for (const k of Object.keys(BIZ)) { const b = s.biz[k]; if (b && b.own) G.biz[k] = { own: true, dirty: Math.max(0, Math.min(BIZ[k].cap, +b.dirty || 0)), done: Math.max(0, +b.done || 0), acc: 0, inv: Array.isArray(b.inv) && b.inv.length === 9 ? b.inv.map(v => Math.max(0, Math.min(BIZ[k].shelf, Math.floor(+v) || 0))) : [0, 0, 0, 0, 0, 0, 0, 0, 0] }; } // v100
      G.heat = clamp(+s.heat || 0, 0, 100); G.heatE = Math.max(0, +s.heatE || 0); G.raid = s.raid && Number.isFinite(+s.raid.at) ? { at: +s.raid.at } : null;
      G.bank = Math.max(0, Math.min(1e10, Math.floor(+s.bank) || 0)); G.bk = clamp(Math.floor(+s.bk) || 0, 0, 3); G.busCd = Math.max(0, +s.busCd || 0); G.buf = {}; if (s.buf && typeof s.buf === 'object') { if (s.buf.gym && GYM_TR[s.buf.gym.k] && Number.isFinite(+s.buf.gym.u)) G.buf.gym = { k: s.buf.gym.k, u: +s.buf.gym.u }; if (Number.isFinite(+s.buf.pizza)) G.buf.pizza = +s.buf.pizza; } G.club = { n: Math.floor(+(s.club && s.club.n)) || -1, s: Math.max(0, Math.floor(+(s.club && s.club.s)) || 0) }; // v94
      { const so = Math.floor(+s.sOff); if (Number.isFinite(so) && so >= 0 && so < 1e6 && s.sOff !== undefined) G.sOff = so; else { const d = G.day - 1, si = Math.floor(d / 5), sd = d % 5; G.sOff = si * 7 + sd - d; } } // v92: alte Spielstaende (5-Tage-Jahreszeiten) bleiben in ihrer Jahreszeit und am selben Tag
      G.repP = Math.min(REP_MAX, Math.max(G.rep, Number.isFinite(+s.repP) ? +s.repP : 0)); G.rep = Math.floor(G.repP + 1e-9); // v112: Ruf endet bei 100
      G.prest = clamp(Math.floor(+s.prest) || 0, 0, PRES_MAX); G.prN = clamp(Math.floor(+s.prN) || 0, 0, 1e6); G.lg = cleanLg(s.lg); G.gang = cleanGangSave(s.gang); G.pn = cleanPn(s.pn); G.ui = cleanUi(s.ui); // v121, v122, v128
      mergeNum(G.up, s.up); clampUp(G.up, 'keller');
      if (Array.isArray(s.pots)) s.pots.forEach((p, i) => { if (G.pots[i]) mergeNum(G.pots[i], p); });
      mergeNum(G.rack, s.rack); mergeNum(G.inv, s.inv);
      if (s.cos && typeof s.cos === 'object') {
        G.cos.owned = Object.assign({}, s.cos.owned || {});
        const isOrb = id => !!COS.find(x => x.id === id && x.kind === 'orbit');
        G.cos.orbit = G.cos.owned[s.cos.orbit] && isOrb(s.cos.orbit) ? s.cos.orbit : 'none';
        G.cos.orbit2 = G.cos.owned[s.cos.orbit2] && isOrb(s.cos.orbit2) && s.cos.orbit2 !== G.cos.orbit ? s.cos.orbit2 : 'none';
        if (G.cos.orbit === 'none' && G.cos.orbit2 !== 'none') { G.cos.orbit = G.cos.orbit2; G.cos.orbit2 = 'none'; }
        G.cos.trail = G.cos.owned[s.cos.trail] ? s.cos.trail : 'none';
        const isPet = id => !!COS.find(x => x.id === id && x.kind === 'pet');
        G.cos.pet = G.cos.owned[s.cos.pet] && isPet(s.cos.pet) ? s.cos.pet : 'none';
        G.cos.pet2 = G.cos.owned[s.cos.pet2] && isPet(s.cos.pet2) && s.cos.pet2 !== G.cos.pet ? s.cos.pet2 : 'none';
        if (G.cos.pet === 'none' && G.cos.pet2 !== 'none') { G.cos.pet = G.cos.pet2; G.cos.pet2 = 'none'; }
      }
      if (s.wpn && typeof s.wpn === 'object') {
        for (const b of BATS) G.wpn.owned[b.id] = !!(s.wpn.owned && s.wpn.owned[b.id]);
        G.wpn.eq = typeof s.wpn.eq === 'string' && G.wpn.owned[s.wpn.eq] ? s.wpn.eq : 'none';
      }
      if (s.dec && typeof s.dec === 'object') {
        const ids = DECOR.map(d => d.id);
        for (const d of DECOR) G.dec.owned[d.id] = clamp(Math.floor(+(s.dec.owned && s.dec.owned[d.id]) || 0), 0, 99);
        for (const k of DEC_KEYS) {
          const arr = s.dec.items && Array.isArray(s.dec.items[k]) ? s.dec.items[k] : [];
          for (const d of arr) {
            if (!d || typeof d !== 'object' || !ids.includes(d.id) || G.dec.items[k].length >= MAXDEC || !Number.isFinite(+d.x) || !Number.isFinite(+d.y)) continue;
            const it = { id: d.id, x: 0, y: 0 }; if (+d.r >= 1 && +d.r <= 3) it.r = Math.floor(+d.r); if (+d.q >= 1 && +d.q <= 3 && !RUGS.includes(d.id)) it.q = Math.floor(+d.q); clampDecor(k, it, +d.x, +d.y); G.dec.items[k].push(it);
          }
        }
        for (const d of DECOR) { let over = placedCount(d.id) - G.dec.owned[d.id]; for (const k of DEC_KEYS) for (let i = G.dec.items[k].length - 1; i >= 0 && over > 0; i--) if (G.dec.items[k][i].id === d.id) { G.dec.items[k].splice(i, 1); over--; } }
      }
      if (s.build && typeof s.build === 'object') {
        if (s.build.stair && typeof s.build.stair === 'object') for (const k of ['keller', 'ku', 'ko']) G.build.stair[k] = clamp(Math.floor(+s.build.stair[k]) || 0, 0, STAIR_STYLES.length - 1);
        for (const k of DEC_KEYS) {
          G.build.door[k] = !!(s.build.door && s.build.door[k]);
          const f = s.build.floor && s.build.floor[k];
          if (f && typeof f === 'object') G.build.floor[k] = { c: clamp(Math.floor(+f.c) || 0, 0, FLOOR_COLORS.length - 1), p: clamp(Math.floor(+f.p) || 0, 0, FLOOR_PATS.length - 1) };
        }
      }
      if (s.staff && typeof s.staff === 'object') for (const k of Object.keys(ROLES)) G.staff[k] = clamp(Math.floor(+s.staff[k] || 0), 0, ROLES[k].max);
      if (s.tab && typeof s.tab === 'object') { G.tab.dry = clamp(+s.tab.dry || 0, 0, 30); G.tab.bags = clamp(Math.floor(+s.tab.bags || 0), 0, bagsMax()); }
      if (s.staffUp && typeof s.staffUp === 'object') for (const k of Object.keys(ROLES)) for (const key of ['speed', 'skill']) G.staffUp[k][key] = clamp(Math.floor(+(s.staffUp[k] && s.staffUp[k][key]) || 0), 0, 3);
      if (s.look && typeof s.look === 'object') G.look = cleanLook(s.look);
      G.stat = { del: 0, vip: 0, ko: 0, car: 0, bust: 0, gv: 0, gb: 0, apo: 0, gym: 0, pizza: 0, club: 0 }; if (s.stat && typeof s.stat === 'object') for (const k of Object.keys(G.stat)) G.stat[k] = Math.max(0, Math.min(1e9, Math.floor(+s.stat[k]) || 0));
      G.ach = { done: {} }; if (s.ach && typeof s.ach === 'object' && s.ach.done && typeof s.ach.done === 'object') for (const a of ACH) if (s.ach.done[a.id] === true) G.ach.done[a.id] = true;
      G.veh = { owned: {}, eq: 'none', on: false }; if (s.veh && typeof s.veh === 'object') { if (s.veh.owned && typeof s.veh.owned === 'object') for (const v of VEHS) if (s.veh.owned[v.id] === true) G.veh.owned[v.id] = true; if (typeof s.veh.eq === 'string' && VEH_BY[s.veh.eq] && G.veh.owned[s.veh.eq]) G.veh.eq = s.veh.eq; for (const k of ['bike', 'car']) { const id = typeof s.veh[k] === 'string' ? s.veh[k] : G.veh.eq; if (VEH_BY[id] && G.veh.owned[id] && !!VEH_BY[id].car === (k === 'car')) G.veh[k] = id; } if (s.veh.col && typeof s.veh.col === 'object') { G.veh.col = {}; for (const v of VEHS) { const c = s.veh.col[v.id]; if (v.car && Number.isInteger(c) && c >= 0 && c < CAR_COLS.length) G.veh.col[v.id] = c; } } }
      G.lager = cleanLager(s.lager); G.pr = cleanPr(s.pr); G.cas = { wd: s.cas && typeof s.cas.wd === 'string' ? s.cas.wd.slice(0, 12) : '', sp: clamp(Math.floor(+(s.cas && s.cas.sp)) || 0, 0, 1e6) }; G.veh.tune = cleanTune(s.veh && s.veh.tune); // v89: Mietraum und Casino
      retireFloorStaff(s); // v104: Helfer der Etagen ziehen ins Erdgeschoss
      G.kr = cleanKr(s.kr); // v25 (Version 81): Karriere
      G.tut = s.tut === 'done' || s.tut === 'skip' ? s.tut : ''; // v26 (Version 84): fehlt der Status, wird die Einführung einmal gezeigt
      G.gv = s.gv && typeof s.gv === 'object' && Number.isFinite(+s.gv.k) ? { k: clamp(+s.gv.k, 0.45, 1.2), p: clamp(+s.gv.k, 0.45, 1.2), n: 0 } : undefined; G.gvOk = s.gvOk === 1 ? 1 : 0; // v80
      G.wear = { owned: {} }; if (s.wear && typeof s.wear === 'object' && s.wear.owned && typeof s.wear.owned === 'object') for (const w of WEAR) if (w.cost > 0 && s.wear.owned[w.id] === true) G.wear.owned[w.id] = true;
      fixWear();
      if (s.t && typeof s.t === 'object') {
        const t = s.t; G.t.unlocked = !!t.unlocked;
        mergeNum(G.t.up, t.up); clampUp(G.t.up, 'tabak');
        if (Array.isArray(t.pots)) t.pots.forEach((p, i) => { if (G.t.pots[i]) mergeNum(G.t.pots[i], p); });
        mergeNum(G.t.rack, t.rack); mergeNum(G.t.inv, t.inv);
        if (t.tab && typeof t.tab === 'object') { G.t.tab.dry = clamp(+t.tab.dry || 0, 0, 30); G.t.tab.bags = clamp(Math.floor(+t.tab.bags || 0), 0, bagsMax()); }
      }
      if (s.b && typeof s.b === 'object') {
        const t = s.b; G.b.unlocked = !!t.unlocked;
        mergeNum(G.b.up, t.up); clampUp(G.b.up, 'brau');
        if (Array.isArray(t.pots)) t.pots.forEach((p, i) => { if (G.b.pots[i]) mergeNum(G.b.pots[i], p); });
        mergeNum(G.b.rack, t.rack); mergeNum(G.b.inv, t.inv);
        if (t.tab && typeof t.tab === 'object') { G.b.tab.dry = clamp(+t.tab.dry || 0, 0, 30); G.b.tab.bags = clamp(Math.floor(+t.tab.bags || 0), 0, bagsMax()); }
      }
      if (!G.t.unlocked) { G.build.door.tabak = false; for (const k of Object.keys(ROLES)) if (ROLES[k].area === 'tabak') G.staff[k] = 0; }
      if (!G.b.unlocked) { G.build.door.brau = false; for (const k of Object.keys(ROLES)) if (ROLES[k].area === 'brau') G.staff[k] = 0; }
      if (!(G.pr && G.pr.own && G.lager.own)) for (const k of Object.keys(ROLES)) if (ROLES[k].area === 'pr') G.staff[k] = 0; // v91
      syncGate();
      for (const k of DEC_KEYS) G.lay[k] = applySavedLayout(AREAS[k], s.lay && s.lay[k]);
      retireFloors(s); G.crate = 0; G.stash = s.bw ? cleanStash(s.stash) : {}; G.bw = 1; // v95: alle Tonnen-Verstecke einmalig geleert
      if (Array.isArray(s.binP)) for (const q of s.binP.slice(0, 20)) { if (!q || !Number.isInteger(q.b) || q.b < 0 || q.b >= BINS.length || !Array.isArray(q.a)) continue; const a = G.stash[q.b] || [0, 0, 0, 0, 0, 0, 0, 0, 0]; for (let j = 0; j < 9; j++) a[j] = Math.min(BIN_MAX * 3, a[j] + clamp(Math.floor(+q.a[j]) || 0, 0, BIN_MAX)); G.stash[q.b] = a; } G.binP = []; // v123: offene Diebstaehle ohne Bestaetigung zurueck ins Versteck
      G.cmdU = s.cmdU === 1 && !sigBad ? 1 : 0; G.flag = cleanFlag(s.flag); if (sigBad) flagAdd('sig');
      cheatScan();
      saveBlocked = false;
      return true;
    } catch (e) { try { store.set('kellergruen.loaderr', new Date().toISOString() + ' ' + String((e && e.message) || e).slice(0, 200)); } catch (e2) {} return false; }
  }

