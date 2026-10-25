  // ---------- Chat und Befehle ----------
  let chatOpen = false; const chatLog = [];
  function chatSay(txt, bad) { chatLog.push({ t: txt, bad: !!bad }); while (chatLog.length > 4) chatLog.shift(); renderChat(); lastMsg = txt; }
  function renderChat() {
    const el = $('chatLog'); el.innerHTML = '';
    chatLog.forEach(l => { const d = document.createElement('div'); d.textContent = l.t; if (l.bad) d.className = 'bad'; el.appendChild(d); });
  }
  function openChat() { if (state !== 'play') return; chatOpen = true; $('chat').hidden = false; renderChat(); try { $('chatIn').focus(); } catch (e) {} }
  function closeChat() { chatOpen = false; $('chat').hidden = true; try { $('chatIn').blur(); } catch (e) {} }
  // "1.000" oder "1000" oder "2,5" -> Zahl; "=500" setzt, sonst wird addiert
  function parseAmount(arg) {
    let s = String(arg || '').replace(/\s/g, ''), set = false;
    if (s[0] === '=') { set = true; s = s.slice(1); }
    if (s[0] === '+') s = s.slice(1);
    if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
    s = s.replace(',', '.');
    const v = Number(s);
    if (s === '' || !Number.isFinite(v) || Math.abs(v) > 1e9) return null;
    return { v: Math.round(v), set };
  }
  // Befehle sind passwortgeschuetzt: einmal pro Sitzung mit "-pw Passwort" freischalten (oder das Passwort allein tippen)
  const pwHash = t => { let h = 5381; for (const c of String(t)) h = ((h * 33) ^ c.charCodeAt(0)) >>> 0; return h; };
  const PW_HASH = 3739783462;
  let cmdOk = false, pwFails = 0, pwLock = 0;
  const MASTER_KEY = 'kellergruen.master'; let masterOn = store.get(MASTER_KEY, '0') === '1';
  function drawMaster(x, y) { // klein, golden, gut lesbar
    ctx.save(); ctx.font = '900 7px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const w = ctx.measureText('MASTER').width + 8 || 34;
    ctx.fillStyle = 'rgba(16,21,28,.88)'; rr(x - w / 2, y - 5.5, w, 11, 5.5); ctx.fill(); ctx.strokeStyle = '#FFD24A'; ctx.lineWidth = 1; rr(x - w / 2, y - 5.5, w, 11, 5.5); ctx.stroke();
    const sh = 0.75 + 0.25 * Math.sin(gt * 3); ctx.fillStyle = 'rgba(255,210,74,' + sh.toFixed(2) + ')'; ctx.fillText('MASTER', x, y + 0.5); ctx.restore();
  }
  function runCmd(raw) {
    const txt = String(raw || '').trim(); if (!txt) return '';
    const m = txt.match(/^[-\/!]\s*([a-zäöüß]+)\s*(.*)$/i);
    let out = '', bad = false;
    const pwTry = m && (m[1].toLowerCase() === 'pw' || m[1].toLowerCase() === 'login') ? m[2].trim() : (!m && /^\S{1,40}$/.test(txt) ? txt : null);
    if (pwTry !== null && !cmdOk && !(m && m[1].toLowerCase() !== 'pw' && m[1].toLowerCase() !== 'login')) {
      if (gt < pwLock) { out = 'Zu viele Versuche. Warte kurz.'; bad = true; }
      else if (pwHash(pwTry) === PW_HASH) { cmdOk = true; if (G) G.cmdU = 1; pwFails = 0; out = 'Befehle freigeschaltet. Tippe -hilfe.'; sfx.ping(); }
      else if (m || /^\d+$/.test(txt)) { pwFails++; if (pwFails >= 5) { pwFails = 0; pwLock = gt + 30; } out = 'Falsches Passwort'; bad = true; sfx.bad(); }
      else { out = 'Befehle sind gesperrt. Passwort: -pw [passwort]'; bad = true; }
      chatSay(out, bad); return out;
    }
    if (m && !cmdOk && m[1].toLowerCase() !== 'undo') { out = 'Befehle sind gesperrt. Passwort: -pw [passwort]'; chatSay(out, true); return out; }
    if (!m && !cmdOk) { out = 'Befehle sind gesperrt. Passwort: -pw [passwort]'; chatSay(out, true); return out; }
    if (!m) { out = 'Befehle beginnen mit -  Tippe -hilfe.'; bad = true; }
    else {
      const cmd = m[1].toLowerCase(), a = parseAmount(m[2]);
      if (cmd === 'update' || cmd === 'info') { // v68: Nachricht an alle Spieler
        const t = m[2].trim();
        if (cmd === 'info' && /^(aus|off|weg|loeschen|löschen)$/i.test(t)) { publishNews(null); out = 'Nachricht an alle gelöscht'; }
        else if (cmd === 'info' && !t) { out = 'Beispiel: -info Heute Abend Gang-Abend im Raum keller42!  (-update schickt die fertige Update-Meldung)'; bad = true; }
        else { const o = cleanNews({ ts: Date.now(), tx: cmd === 'update' ? (t || NEWS_UPDATE) : t, up: cmd === 'update' ? 1 : 0 }); if (o) { publishNews(o); try { store.set(NEWS_KEY, String(o.ts)); } catch (e) {} out = 'An alle gesendet: ' + o.tx; } else { out = 'Text fehlt'; bad = true; } }
      }
      else if (cmd === 'master') { // v76: MASTER-Schild ueber dir, fuer alle sichtbar, bleibt bis -master aus
        if (/^(aus|off|weg|nein)$/i.test(m[2].trim())) { masterOn = false; store.set(MASTER_KEY, '0'); out = 'MASTER-Schild entfernt'; }
        else { masterOn = true; store.set(MASTER_KEY, '1'); out = 'MASTER steht jetzt über dir, für alle sichtbar. Entfernen mit -master aus'; }
        if (mp.on) mp.sendT = 9;
      }
      else if (cmd === 'admin' || cmd === 'karte') { if (startAdmin()) out = 'Karten-Editor offen. Änderungen sehen alle Spieler.'; else { out = 'Erst ins Spiel gehen, dann -admin'; bad = true; } }
      else if (cmd === 'hilfe' || cmd === 'help') out = '-update schickt allen Spielern die Update-Meldung (speichern und neu starten), -info [text] eine eigene Nachricht an alle, -info aus löscht sie. -admin öffnet den Karten-Editor. -master zeigt MASTER über dir (-master aus entfernt es).  -geld [betrag]  -ruf [wert]  (minus zieht ab, =500 setzt genau). -raum [code]  -raum aus  -name [name] für Freunde.  -emote [name] zeigt ein Emote. -kill [name] setzt den Spielstand eines Freundes im Raum zurück (nur Cosmetics bleiben), -kill allein deinen eigenen. -undo macht es rückgängig. -pw sperrt/entsperrt: -pw aus sperrt die Befehle wieder.';
      else if (cmd === 'pw' || cmd === 'login') { if (/^(aus|off|lock|sperren)$/i.test(m[2].trim())) { cmdOk = false; out = 'Befehle wieder gesperrt'; } else out = 'Schon freigeschaltet. Sperren mit -pw aus'; }
      else if (cmd === 'kill') {
        const nm = mpClean(m[2], 12).toLowerCase(), own = (mp.name || '').toLowerCase();
        if (!nm || nm === own) { mp.killReq = { self: true, t: gt }; out = 'Wirklich alles zurücksetzen, nur Cosmetics bleiben? Tippe -ja zum Bestätigen oder -nein.'; bad = true; }
        else {
          const fl = Object.values(mp.friends), f = fl.find(q => q.name.toLowerCase() === nm) || (fl.filter(q => q.name.toLowerCase().startsWith(nm)).length === 1 ? fl.find(q => q.name.toLowerCase().startsWith(nm)) : null);
          if (!f) { out = mp.on ? 'Niemand mit dem Namen "' + m[2].trim() + '" im Raum' : 'Nicht verbunden. Erst -raum [code]'; bad = true; }
          else if (!isAdm() || !f.u) { out = 'Andere zurücksetzen geht nur über die Admin-App (angemeldet als Admin, Spieler mit Konto).'; bad = true; }
          else { admSend({ uid: f.u, mpId: f.id, name: f.name }, 'kill'); out = f.name + ' gekillt. Selber schuld!'; }
        }
      } else if (cmd === 'ja' || cmd === 'yes') {
        if (mp.killReq && gt - mp.killReq.t < 60) { doKill(); out = 'Zurückgesetzt'; } else { out = 'Keine offene Anfrage'; bad = true; }
      } else if (cmd === 'nein' || cmd === 'no') {
        if (mp.killReq) { mp.killReq = null; out = 'Abgelehnt'; } else { out = 'Keine offene Anfrage'; bad = true; }
      } else if (cmd === 'undo') {
        if (undoKill()) out = 'Alter Stand zurück'; else { out = 'Nichts zum Rückgängigmachen'; bad = true; }
      } else if (cmd === 'emote' || cmd === 'e') {
        const nm = m[2].trim().toLowerCase(); out = doEmote(nm) ? 'Emote: ' + nm : 'Emotes: ' + EMOTES.map(q => q.n).join(', ') + '. Beispiel: -emote herz'; bad = out.startsWith('Emotes');
      } else if (cmd === 'raum') {
        const arg = m[2].trim().toLowerCase();
        if (arg === 'aus' || arg === 'off') { mpDisconnect(false); out = 'Offline'; } else { out = 'Gruppen gibt es nicht mehr, alle spielen zusammen. Offline: -raum aus'; mpGoOnline(); }
      } else if (cmd === 'name') {
        const nn = mpClean(m[2], 12); if (fbOk() && accOn()) { out = 'Mit Konto ist dein Name fest: ' + acc.name; bad = true; } else if (!nn) { out = 'Beispiel: -name Max'; bad = true; } else { const c = mpLoadCfg(); mp.name = nn; mpSaveCfg(mp.on); out = 'Name: ' + nn; }
      } else if (cmd === 'geld' || cmd === 'ruf') {
        if (!a) { out = 'Zahl fehlt. Beispiel: -' + cmd + ' 500'; bad = true; }
        else if (cmd === 'geld') { const before = G.money; G.money = Math.max(0, a.set ? a.v : G.money + a.v); out = 'Geld ' + fmt(before) + ' → ' + fmt(G.money); sfx.cash(); }
        else { const before = G.rep; G.rep = Math.max(0, a.set ? a.v : G.rep + a.v); G.repP = G.rep; out = 'Ruf ' + before + ' → ' + G.rep; sfx.ping(); }
        save();
      } else { out = 'Unbekannter Befehl "' + cmd + '". Tippe -hilfe.'; bad = true; }
    }
    chatSay(out, bad);
    return out;
  }
  function sendChat() { const el = $('chatIn'), v = el.value; el.value = ''; runCmd(v); try { el.focus(); } catch (e) {} }

  // ---------- Umbau-Modus ----------
  const EDW = 210;
  const ev = { sc: 1, cx: 0, cy: 0, ox: 0, oy: 0 };
  const ed = { ak: 'keller', sel: null, drag: null, bad: false, zoom: 1, px: 0, py: 0, pan: null, ptrs: {}, pinch: null };
  const dHalfIt = it => { const h = dHalf(it.id); return ((it.r || 0) % 2 && RUGS.includes(it.id)) || ((it.q || 0) % 2 && !RUGS.includes(it.id)) ? [h[1], h[0]] : h; }; // v85: stehende Deko dreht in 90-Grad-Schritten (q) // v59/v60: nur Teppiche liegen quer
  function edClampPan() { const I = edAr().IN, mx = (I.x1 - I.x0) / 2 * (1 - 1 / ed.zoom) + 10, my = (I.y1 - I.y0) / 2 * (1 - 1 / ed.zoom) + 10; ed.px = clamp(ed.px, -mx, mx); ed.py = clamp(ed.py, -my, my); }
  function edZoom(f) { ed.zoom = clamp(ed.zoom * f, 1, 4); if (ed.zoom === 1) { ed.px = 0; ed.py = 0; } edClampPan(); }
  const toWorldE = e => ({ x: (e.clientX - ev.ox) / ev.sc + ev.cx, y: (e.clientY - ev.oy) / ev.sc + ev.cy });
  function edMsg(txt, bad) { const h = $('edHint'); h.textContent = txt; h.classList.toggle('bad', !!bad); lastMsg = txt; }
  // v132: das Gang-HQ wird genauso eingerichtet wie der Keller (ed.ak = 'ghq', Deko liegt in der Gang, nicht im Spielstand)
  const GHQ_EDA = { name: 'Gang-Hauptquartier', IN: { x0: 52, y0: 52, x1: 600, y1: 508 } };
  const edAr = () => ed.ak === 'ghq' ? GHQ_EDA : AREAS[ed.ak];
  let ghqQ = '';
  function startGhqEdit() {
    if (state !== 'play') return false; if (player.fl !== 4 || !pgang || !pgMember()) { msg('Einrichten geht im Hauptquartier deiner Gang.', true); return false; }
    if (!pgCanDeco()) { msg('Gerade dürfen nur Boss und Vize einrichten.', true); return false; }
    closePhone(); closeChat(); $('emoteBar').hidden = true; hqCarry = null;
    state = 'edit'; ed.ak = 'ghq'; ed.sel = null; ed.drag = null; ed.bad = false; ed.zoom = 1; ed.px = 0; ed.py = 0; ed.pan = null; ed.ptrs = {}; ed.pinch = null; ed.hq = hqItems(); ed.busy = false;
    $('hud').classList.remove('on'); $('pads').classList.remove('on'); $('edit').hidden = false; $('edit').classList.add('ghq');
    joy.id = null; joy.dx = joy.dy = 0; aHeld = false;
    renderEditPanel(); edMsg('Tippe ein Teil an und ziehe es. Unten kaufst du neue Deko aus der Gang-Kasse.', false); return true;
  }
  const ghqRefresh = () => { if (ed.ak === 'ghq' && state === 'edit') { const k = ed.sel && ed.hq[ed.sel.i] && ed.hq[ed.sel.i].k; ed.hq = hqItems(); const i = k ? ed.hq.findIndex(x => x.k === k) : -1; ed.sel = i >= 0 ? { kind: 'hq', i } : null; renderEditPanel(); } };
  async function ghqDo(fn, ok) { if (ed.busy) return; ed.busy = true; edMsg('Einen Moment …', false); try { const r = await fn(); edMsg(typeof r === 'string' && r ? r : ok, false); sfx.put(); } catch (e) { edMsg(e.message || 'Ging nicht', true); sfx.bad(); } finally { ed.busy = false; ghqRefresh(); } }
  function startEdit(ak) {
    const ar0 = AREAS[ak]; if (state !== 'play' || !ar0 || !isOpen(ar0)) return false;
    if (ar0.isFloor ? player.fl !== ar0.f : (ak === 'keller' && player.fl)) { msg(ar0.isFloor ? 'Geh zuerst ins ' + ar0.name + ', dann kannst du es umbauen' : 'Das Erdgeschoss baust du im Erdgeschoss um', true); return false; } // v54: nur auf der eigenen Etage
    closePhone(); closeChat(); $('emoteBar').hidden = true;
    state = 'edit'; ed.ak = ak; ed.sel = null; ed.drag = null; ed.bad = false; ed.zoom = 1; ed.px = 0; ed.py = 0; ed.pan = null; ed.ptrs = {}; ed.pinch = null;
    $('hud').classList.remove('on'); $('pads').classList.remove('on'); $('edit').hidden = false;
    joy.id = null; joy.dx = joy.dy = 0; aHeld = false;
    renderEditPanel(); edMsg('Tippe ein Teil an und ziehe es. Rot heißt: kein Platz.', false);
    return true;
  }
  function finishEdit() {
    if (state !== 'edit') return;
    if (ed.ak === 'ghq') { state = 'play'; ed.sel = null; ed.drag = null; ed.ak = 'keller'; $('edit').hidden = true; $('edit').classList.remove('ghq'); $('hud').classList.add('on'); $('pads').classList.add('on'); move(player, 0, 0, player.r); petSnap(); msg('🏴 HQ eingerichtet'); return; } // v132
    state = 'play'; ed.sel = null; ed.drag = null;
    $('edit').hidden = true; $('hud').classList.add('on'); $('pads').classList.add('on');
    // Arbeiter neu einteilen und aus neuen Möbeln herausholen, Spieler ebenfalls
    for (const w of workers) {
      w.job = null; w.path = []; w.pi = 0; w.st = 'idle'; w.cool = 0.3;
      if (colliders.some(c => !isGate(c) && (w.ar.isFloor ? (c.fl === undefined || c.fl === w.ar.f) : !c.fl) && w.x > c.x - 2 && w.x < c.x + c.w + 2 && w.y > c.y - 2 && w.y < c.y + c.h + 2)) { w.x = w.ar.DOOR.x; w.y = w.ar.spawn.y; }
    }
    for (const k of DEC_KEYS) AREAS[k].claim.fill(0);
    move(player, 0, 0, player.r); petSnap(); Object.keys(cache).forEach(k => delete cache[k]);
    save(); msg('Umbau gespeichert');
  }
  function editHit(ak, wx, wy) {
    if (ak === 'ghq') { for (let i = ed.hq.length - 1; i >= 0; i--) { const it = ed.hq[i], h = dHalf(it.id); if (Math.abs(wx - it.x) <= h[0] + 4 && Math.abs(wy - it.y) <= h[1] + 4) return { kind: 'hq', i }; } return null; } // v132
    const ar = AREAS[ak], arr = G.dec.items[ak];
    for (let i = arr.length - 1; i >= 0; i--) { const it = arr[i]; if (RUGS.includes(it.id)) continue; const h = dHalfIt(it); if (Math.abs(wx - it.x) <= h[0] + 4 && Math.abs(wy - it.y) <= h[1] + 4) return { kind: 'decor', i }; }
    for (let i = 0; i < ar.POTS.length; i++) if (Math.hypot(wx - ar.POTS[i].x, wy - ar.POTS[i].y) <= 24) return { kind: 'pot', i };
    const inR = c => wx >= c.x - 4 && wx <= c.x + c.w + 4 && wy >= c.y - 4 && wy <= c.y + c.h + 4;
    if (ar.cols.stairs) for (let i = 0; i < ar.cols.stairs.length; i++) if (inR(ar.cols.stairs[i])) return { kind: 'stair', i };
    if (ar.cols.crate && !GH_ON && inR(ar.cols.crate)) return { kind: 'crate', i: 0 };
    if (ar.cols.rack && inR(ar.cols.rack)) return { kind: 'rack', i: 0 };
    if (ar.cols.table && inR(ar.cols.table)) return { kind: 'table', i: 0 };
    for (let i = arr.length - 1; i >= 0; i--) { const it = arr[i]; if (!RUGS.includes(it.id)) continue; const h = dHalfIt(it); if (Math.abs(wx - it.x) <= h[0] && Math.abs(wy - it.y) <= h[1]) return { kind: 'decor', i }; }
    return null;
  }
  const selPos = s => s.kind === 'hq' ? [ed.hq[s.i].x, ed.hq[s.i].y] : (s.kind === 'decor' ? [G.dec.items[ed.ak][s.i].x, G.dec.items[ed.ak][s.i].y] : stationPos(AREAS[ed.ak], s.kind, s.i));
  function editDown(e) {
    ed.ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    { const ids = Object.keys(ed.ptrs); if (ids.length === 2) { const a = ed.ptrs[ids[0]], b = ed.ptrs[ids[1]]; if (ed.drag && ed.drag.moved && ed.sel) { const ar = AREAS[ed.ak]; if (ed.sel.kind === 'decor') { const it = G.dec.items[ed.ak][ed.sel.i]; if (it) clampDecor(ed.ak, it, ed.drag.orig[0], ed.drag.orig[1]); } else { applyStation(ar, ed.sel.kind, ed.sel.i, ed.drag.orig[0], ed.drag.orig[1]); rebuildNav(ar); ed.bad = false; } } ed.drag = null; ed.pan = null; ed.pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: ed.zoom }; return; } } // zwei Finger: zoomen
    const p = toWorldE(e), hit = editHit(ed.ak, p.x, p.y);
    ed.sel = hit; ed.bad = false; ed.drag = null; ed.pan = null;
    if (!hit && ed.zoom > 1) { ed.pan = { id: e.pointerId, sx: e.clientX, sy: e.clientY, px: ed.px, py: ed.py }; try { cv.setPointerCapture(e.pointerId); } catch (x) {} } // leere Stelle: Ansicht verschieben
    if (hit) {
      const pos = selPos(hit); ed.drag = { id: e.pointerId, ox: pos[0] - p.x, oy: pos[1] - p.y, orig: pos.slice(), moved: false };
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      if (hit.kind === 'hq') edMsg(((DECOR.find(d => d.id === ed.hq[hit.i].id) || {}).name || 'Deko') + ': ziehen zum Verschieben', false); else
      edMsg(hit.kind === 'decor' ? DECOR.find(d => d.id === G.dec.items[ed.ak][hit.i].id).name + ': ziehen zum Verschieben' : (hit.kind === 'pot' ? 'Topf' : hit.kind === 'stair' ? 'Treppe' : hit.kind === 'crate' ? 'Sammelkiste' : hit.kind === 'rack' ? AREAS[ed.ak].lbl.rack : 'Packtisch') + ': ziehen zum Verschieben, ⟳ dreht', false);
    }
    if (hit) { const ep = $('edit'); if (ep && ep.scrollTop > 0) ep.scrollTop = 0; } // v60: Drehen/Einlagern sofort sichtbar
    renderEditPanel();
  }
  function editMove(e) {
    if (ed.ptrs[e.pointerId]) ed.ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (ed.pinch) { const ids = Object.keys(ed.ptrs); if (ids.length >= 2) { const a = ed.ptrs[ids[0]], b = ed.ptrs[ids[1]]; ed.zoom = clamp(ed.pinch.z0 * Math.hypot(a.x - b.x, a.y - b.y) / ed.pinch.d0, 1, 4); edClampPan(); } return; }
    if (ed.pan && e.pointerId === ed.pan.id) { ed.px = ed.pan.px - (e.clientX - ed.pan.sx) / ev.sc; ed.py = ed.pan.py - (e.clientY - ed.pan.sy) / ev.sc; edClampPan(); return; }
    const d = ed.drag; if (!d || e.pointerId !== d.id || !ed.sel) return;
    const p = toWorldE(e), nx = p.x + d.ox, ny = p.y + d.oy;
    if (!d.moved && Math.hypot(nx - d.orig[0], ny - d.orig[1]) < 4) return;
    d.moved = true;
    if (ed.sel.kind === 'hq') { const it = ed.hq[ed.sel.i]; if (it) [it.x, it.y] = hqClampPos(nx, ny); } // v132
    else if (ed.sel.kind === 'decor') clampDecor(ed.ak, G.dec.items[ed.ak][ed.sel.i], nx, ny);
    else { const ar = AREAS[ed.ak]; applyStation(ar, ed.sel.kind, ed.sel.i, Math.round(nx / 2) * 2, Math.round(ny / 2) * 2); ed.bad = !layoutValid(ar); }
  }
  function editUp(e) {
    delete ed.ptrs[e.pointerId]; if (ed.pinch) { if (Object.keys(ed.ptrs).length < 2) ed.pinch = null; return; }
    if (ed.pan && e.pointerId === ed.pan.id) { ed.pan = null; return; }
    const d = ed.drag; if (!d || e.pointerId !== d.id) return; ed.drag = null;
    if (!d.moved || !ed.sel) return;
    if (ed.sel.kind === 'hq') { const it = ed.hq[ed.sel.i]; if (it) ghqDo(() => pgMoveDeco(it, it.x, it.y), 'Gesetzt'); return; } // v132: sofort für die ganze Gang speichern
    const ar = AREAS[ed.ak];
    if (ed.sel.kind === 'decor') { save(); sfx.put(); return; }
    if (ed.bad) { applyStation(ar, ed.sel.kind, ed.sel.i, d.orig[0], d.orig[1]); rebuildNav(ar); ed.bad = false; edMsg('Hier ist kein Platz. Der Weg muss frei bleiben.', true); sfx.bad(); }
    else { commitLayout(ar); sfx.put(); save(); edMsg('Gesetzt', false); }
  }
  function renderEditPanel() {
    if (ed.ak === 'ghq') return renderGhqPanel(); // v132
    $('edReset').hidden = false;
    const ar = AREAS[ed.ak];
    $('edTitle').textContent = 'Umbau · ' + ar.name;
    $('edDel').disabled = !(ed.sel && ed.sel.kind === 'decor'); $('edRot').disabled = !ed.sel;
    const list = $('edList'); list.innerHTML = '';
    const hd = document.createElement('div'); hd.className = 'grp'; hd.textContent = 'Aus dem Bestand'; list.appendChild(hd);
    let any = false;
    DECOR.forEach(d => {
      const n = decStock(d.id); if (n <= 0) return; any = true;
      const c = document.createElement('button'); c.className = 'chip'; c.textContent = '+ ' + d.name + ' ×' + n;
      c.addEventListener('click', () => {
        const I = ar.IN, it = addDecor(ed.ak, d.id, (I.x0 + I.x1) / 2 + (G.dec.items[ed.ak].length % 5) * 8, (I.y0 + I.y1) / 2);
        if (it) { ed.sel = { kind: 'decor', i: G.dec.items[ed.ak].length - 1 }; edMsg(d.name + ' steht in der Mitte. Zieh es an den richtigen Platz.', false); renderEditPanel(); }
        else edMsg('Hier passt nichts mehr hin (max. ' + MAXDEC + ' Teile)', true);
      });
      list.appendChild(c);
    });
    if (!any) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = 'Kein freies Stück. Kaufe Deko im Handy unter Deko.'; list.appendChild(e); }
  }
  // v60: Drehen. Teppiche drehen flach in 90-Grad-Schritten, stehende Deko dreht sich zur anderen Seite, Stationen drehen samt Standplatz
  function edRotate() {
    if (state !== 'edit' || !ed.sel) return false;
    if (ed.sel.kind === 'decor') {
      const it = G.dec.items[ed.ak][ed.sel.i]; if (!it) return false; const rug = RUGS.includes(it.id);
      if (rug) { it.r = ((it.r || 0) + 1) % 4; if (!it.r) delete it.r; }
      else { const q0 = it.q || 0; it.q = (q0 + 1) % 4; if (!it.q) { delete it.q; if (it.r) delete it.r; } } // v85: vier Richtungen
      clampDecor(ed.ak, it, it.x, it.y); save(); sfx.put();
      edMsg(rug ? 'Gedreht' : 'Gedreht: ' + ['steht normal', 'zeigt nach links', 'steht kopfüber', 'zeigt nach rechts'][it.q || 0], false); return true;
    }
    if (rotateStation(ed.ak, ed.sel.kind, ed.sel.i)) { sfx.put(); edMsg(ed.sel.kind === 'pot' ? 'Topf gedreht' : 'Gedreht. Der grüne Punkt zeigt, wo man davor steht.', false); return true; }
    sfx.bad(); edMsg('Zum Drehen ist hier kein Platz. Schieb es erst etwas weg von Wand und Möbeln.', true); return false;
  }
  function renderGhqPanel() {
    const g = pgang; if (!g) return; const n = ghqSlots(g.lv), full = ed.hq.length >= n, it = ed.sel && ed.hq[ed.sel.i], d0 = it && DECOR.find(x => x.id === it.id);
    $('edTitle').textContent = 'Einrichten · Gang-HQ'; $('edReset').hidden = true; $('edRot').disabled = true;
    $('edDel').disabled = !it; $('edDel').textContent = it ? 'Wegräumen (+' + fmt(Math.round(ghqPrice(d0) / 2)) + ')' : 'Wegräumen';
    const list = $('edList'); list.innerHTML = '';
    const hd = uiEl('div', 'grp', 'Kaufen aus der Kasse · ' + fmt(g.kasse) + ' · Plätze ' + ed.hq.length + '/' + n); list.appendChild(hd);
    const inp = uiEl('input', 'ed-q'); inp.type = 'search'; inp.placeholder = '🔍 Deko suchen …'; inp.value = ghqQ; inp.addEventListener('keydown', e => e.stopPropagation());
    const chips = []; inp.addEventListener('input', () => { ghqQ = inp.value; const q = ghqQ.trim().toLowerCase(); chips.forEach(([c, nm]) => { c.style.display = !q || nm.includes(q) ? '' : 'none'; }); }); list.appendChild(inp);
    if (full) list.appendChild(uiEl('div', 'empty', 'Alle Plätze belegt. Baut das HQ aus oder räumt etwas weg.'));
    const all = ghqDeco().slice().sort((a, b) => (GHQ_CHILL.includes(b.id) - GHQ_CHILL.includes(a.id)) || ghqPrice(a) - ghqPrice(b)), q = ghqQ.trim().toLowerCase();
    for (const x of all) { const p = ghqPrice(x), c = uiEl('button', 'chip' + (GHQ_CHILL.includes(x.id) ? ' chill' : ''), '+ ' + x.name + ' · ' + fmt(p)); c.disabled = full || g.kasse < p || ed.busy;
      c.addEventListener('click', () => { const before = new Set(ed.hq.map(z => z.k)); ghqDo(async () => { const r = await pgBuyDeco(x.id, [(HQ_BOX.x0 + HQ_BOX.x1) / 2 + (ed.hq.length % 5) * 10, (HQ_BOX.y0 + HQ_BOX.y1) / 2]); ed.hq = hqItems(); const i = ed.hq.findIndex(z => !before.has(z.k)); ed.sel = i >= 0 ? { kind: 'hq', i } : null; return x.name + ' steht in der Mitte. Zieh es an den richtigen Platz.'; }, ''); });
      if (q && !x.name.toLowerCase().includes(q)) c.style.display = 'none'; chips.push([c, x.name.toLowerCase()]); list.appendChild(c); }
  }
  async function ghqDelSel() { const it = ed.sel && ed.hq[ed.sel.i]; if (!it) return; ed.sel = null; await ghqDo(() => pgRemoveDeco(it), 'Weggeräumt'); }
  function drawEditOverlay() {
    if (ed.ak === 'ghq') { const I = GHQ_EDA.IN; ctx.fillStyle = 'rgba(255,255,255,.1)'; for (let x = I.x0 + 20; x < I.x1; x += 20) for (let y = I.y0 + 20; y < I.y1; y += 20) ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4); // v132
      ctx.setLineDash([5, 4]); ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,181,71,.4)'; ctx.strokeRect(HQ_BOX.x0 - 12, HQ_BOX.y0 - 12, HQ_BOX.x1 - HQ_BOX.x0 + 24, HQ_BOX.y1 - HQ_BOX.y0 + 24); ctx.setLineDash([]);
      const it = ed.sel && ed.hq[ed.sel.i]; if (it) { const h = dHalf(it.id); ctx.lineWidth = 3; ctx.strokeStyle = '#FFB547'; ctx.fillStyle = 'rgba(255,181,71,.14)'; rr(it.x - h[0] - 3, it.y - h[1] - 3, h[0] * 2 + 6, h[1] * 2 + 6, 7); ctx.fill(); ctx.stroke(); }
      if (ed.busy) { ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '700 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('speichert …', (I.x0 + I.x1) / 2, I.y0 + 16); } return; }
    const ar = AREAS[ed.ak], I = ar.IN;
    ctx.fillStyle = 'rgba(255,255,255,.1)';
    for (let x = I.x0 + 20; x < I.x1; x += 20) for (let y = I.y0 + 20; y < I.y1; y += 20) ctx.fillRect(x - 0.7, y - 0.7, 1.4, 1.4);
    ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,181,71,.55)';
    for (const c of ar.cols.pots.concat([ar.cols.rack, ar.cols.table], ar.cols.stairs || [], ar.cols.crate ? [ar.cols.crate] : []).filter(Boolean)) ctx.strokeRect(c.x, c.y, c.w, c.h);
    ctx.setLineDash([]);
    if (ed.sel) {
      let r;
      if (ed.sel.kind === 'decor') { const it = G.dec.items[ed.ak][ed.sel.i]; if (it) { const h = dHalfIt(it); r = { x: it.x - h[0], y: it.y - h[1], w: h[0] * 2, h: h[1] * 2 }; } }
      else if (ed.sel.kind === 'pot') r = ar.cols.pots[ed.sel.i]; else if (ed.sel.kind === 'stair') r = ar.cols.stairs[ed.sel.i]; else r = ar.cols[ed.sel.kind];
      if (r) {
        ctx.lineWidth = 3; ctx.strokeStyle = ed.bad ? '#FF5C7A' : '#FFB547'; ctx.fillStyle = ed.bad ? 'rgba(255,92,122,.28)' : 'rgba(255,181,71,.14)';
        rr(r.x - 3, r.y - 3, r.w + 6, r.h + 6, 7); ctx.fill(); ctx.stroke();
      }
      if (ed.sel.kind !== 'decor' && ed.sel.kind !== 'pot') { // v60: wo man vor der Station steht (dreht mit)
        const o = stationObj(ar, ed.sel.kind, ed.sel.i), sp = ed.sel.kind === 'rack' ? ar.RACK_STAND : ed.sel.kind === 'table' ? ar.TABLE_STAND : ed.sel.kind === 'crate' ? crateStand() : stairStand(o);
        ctx.strokeStyle = 'rgba(107,203,126,.85)'; ctx.lineWidth = 2; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(sp.x, sp.y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(107,203,126,.9)'; ctx.beginPath(); ctx.arc(sp.x, sp.y, 5, 0, TAU); ctx.fill();
      }
      if (ed.bad && ar.fields) for (const f of [ar.fields.rack, ar.fields.table]) { ctx.strokeStyle = 'rgba(255,92,122,.5)'; ctx.lineWidth = 1.5; ctx.strokeRect(f.x0, f.y0, f.x1 - f.x0, f.y1 - f.y0); }
    }
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.font = '700 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ar.isFloor ? 'Treppe' : 'Tür', ar.isFloor ? ar.DOOR.x : ar.DOOR.x, ar.isFloor ? ar.DOOR.y - 4 : I.y1 - 14);
  }

