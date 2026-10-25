  // ---------- v84: Einführung (Tutorial) ----------
  // Status steht im Spielstand (G.tut): '' = noch nicht gesehen, 'done' = abgeschlossen, 'skip' = übersprungen.
  // Neue Spiele und alte Spielstände ohne Feld zeigen die Einführung einmal. Während sie offen ist, ist das Spiel pausiert.
  // Elemente und Ereignis-Listener werden genau einmal angelegt; beim Drehen oder Ändern der Größe wird nur neu positioniert.
  const TUT = [
    { ic: '🌿', t: 'Willkommen bei Kellergrün!', x: 'Du ziehst in deinem Keller Pflanzen groß, trocknest die Ernte, packst sie in Beutel und lieferst sie an Kunden in der Stadt. Mit dem Geld baust du dein Geschäft Schritt für Schritt aus. Dein großes Ziel: 500.000 € Umsatz – und danach geht es weiter.', tip: 'Steuerung: Finger links auf dem Bildschirm ziehen = laufen. A = Aktion (pflanzen, gießen mit A halten, ernten, liefern). B = Ware herausnehmen.', sel: '#bAct', lab: 'A = Aktion' },
    { ic: '📦', t: 'Aufträge und Einnahmen', x: 'Kunden melden sich mit einer Blase über ihrem Haus: Die Zahl zeigt, wie viele Beutel sie wollen, der Ring die verbleibende Zeit. Geh mit genug Ware hin und drück A.', tip: 'Pünktlich geliefert gibt es Trinkgeld und mehr Ruf. Spezialkunden (★) zahlen besonders gut. Alle offenen Aufträge stehen im Handy unter „Aufträge“.', sel: '#ware', lab: 'Deine Ware' },
    { ic: '🛒', t: 'Upgrades und Ausbau', x: 'Im Handy findest du den „Laden“: mehr Töpfe, schnelleres Wachstum, mehr Ertrag, ein größeres Trockengestell und mehr Platz zum Tragen.', tip: 'Später kaufst du Tabakscheune und Chemielabor, kaufst Läden in der Stadt und heuerst unter „Helfer“ Leute an, die für dich arbeiten. Mehr Töpfe und schnelleres Wachstum zahlen sich am schnellsten aus.', sel: '#bPhone', lab: 'Handy' },
    { ic: '⭐', t: 'Ruf und Freischaltungen', x: 'Jede Lieferung bringt Ruf. Mit mehr Ruf melden sich mehr Kunden, und neue Helfer, Gebiete, Fahrzeuge und Kleidung werden frei.', tip: 'Unter dem Ruf siehst du deine Kategorie, alle 10 Ruf kommt eine neue. Für den Aufstieg brauchst du Ruf und Meilensteine (Handy → „Karriere“). Belohnungen für erreichte Ziele holst du unter „Ziele“ ab.', sel: '.tierbar', alt: '#hud .top > div:first-child > .small', lab: 'Ruf und Rufstufe' },
    { ic: '🗺️', t: 'Leicht zu übersehen', x: 'Die Minikarte zeigt wichtige Orte (K = dein Keller) und Leute mit Aufgaben: Ein gelbes ! heißt, jemand hat eine Quest für dich. Sprich sie mit A an.', tip: 'Questketten bringen Geld, dauerhafte Boni und Titel. Deine Helfer sammeln Erfahrung und lassen sich unter „Helfer → Mitarbeiter“ verbessern und spezialisieren.', sel: '#mini', lab: 'Minikarte' },
    { ic: '💡', t: 'Tipps für später', x: 'Leuchtet der Bildschirmrand blau und rot, hat dich die Polizei im Blick. Je schneller und dichter das Licht blinkt, desto knapper wird es – dann ist die Ware weg und es gibt eine Strafe.', tip: 'Jahreszeiten und Ereignisse (oben neben der Uhr) ändern Preise und Nachfrage; manche wollen eine Entscheidung im Handy. Ab Ruf 20 kauft dir der Hehler im Gangviertel jederzeit Ware ab. Gespeichert wird automatisch.', sel: '', lab: '' },
    { ic: '🚀', t: 'Los geht’s!', x: 'Pflanze jetzt deinen ersten Samen: Geh im Keller zu einem Topf und drück A. Unten im Bild steht immer, was du mit A gerade tun kannst.', tip: 'Die Einführung kannst du jederzeit unter Einstellungen → Profil noch einmal ansehen.', sel: '', lab: '' }
  ];
  let tutOpen = false, tutI = 0, tutBusy = 0, tutEl = null;
  function tutInit() {
    if (tutEl || !document.body || !document.createElement) return;
    const el = document.createElement('div'); el.id = 'tut'; el.className = 'tut'; el.hidden = true;
    el.innerHTML = '<div class="tut-dim"></div><div class="tut-spot"></div><div class="tut-lab"></div><div class="tut-card" role="dialog" aria-modal="true" aria-labelledby="tutT"><div class="tut-top"><span class="tut-step"></span><span class="tut-dots"></span><button class="tut-skip" type="button">Tutorial überspringen</button></div><div class="tut-main"><div class="tut-ic"></div><div class="tut-body"><div class="tut-t" id="tutT"></div><div class="tut-x"></div><div class="tut-tip"></div></div></div><div class="tut-nav"><button class="tut-back" type="button">Zurück</button><button class="tut-next" type="button">Weiter</button></div></div>';
    if (!el.querySelector) return; document.body.appendChild(el); tutEl = el;
    el.querySelector('.tut-skip').addEventListener('click', () => tutEnd('skip'));
    el.querySelector('.tut-back').addEventListener('click', () => tutGo(tutI - 1));
    el.querySelector('.tut-next').addEventListener('click', () => { if (tutI >= TUT.length - 1) tutEnd('done'); else tutGo(tutI + 1); });
    el.addEventListener('pointerdown', e => e.stopPropagation()); el.addEventListener('touchmove', e => { if (!e.target.closest || !e.target.closest('.tut-body')) e.preventDefault(); }, { passive: false });
    window.addEventListener('resize', () => { if (tutOpen) tutLayout(); });
    window.addEventListener('orientationchange', () => { if (tutOpen) setTimeout(tutLayout, 250); });
  }
  function tutStart(at) {
    if (tutOpen || !G) return false; tutInit(); if (!tutEl) return false;
    tutOpen = true; tutI = clamp(at | 0, 0, TUT.length - 1); joy.id = null; joy.dx = joy.dy = 0; aHeld = false; bHeld = false;
    try { MINI.t = -1; drawMini(); krHudT = 0; krHud(); setText('rep', String(G.rep)); } catch (e) {} // HUD einmal auffrischen, damit die Markierungen etwas zeigen
    tutEl.hidden = false; tutEl.style.display = 'block'; tutRender(); return true;
  }
  function tutGo(i) { const now = Date.now(); if (!tutOpen || now - tutBusy < 180) return; tutBusy = now; tutI = clamp(i, 0, TUT.length - 1); tutRender(); }
  function tutEnd(how) {
    if (!tutOpen) return; tutOpen = false; if (G) { G.tut = how === 'skip' ? 'skip' : 'done'; save(); }
    if (tutEl) { tutEl.hidden = true; tutEl.style.display = 'none'; }
    if (how !== 'skip') { sfx.ping(); msg('Viel Erfolg! Pflanze Samen in einen Topf.'); }
  }
  function tutRender() {
    if (!tutEl) return; const s = TUT[tutI], q = c => tutEl.querySelector(c);
    q('.tut-step').textContent = 'Schritt ' + (tutI + 1) + ' von ' + TUT.length;
    q('.tut-dots').innerHTML = TUT.map((_, i) => '<i class="' + (i === tutI ? 'on' : i < tutI ? 'ok' : '') + '"></i>').join('');
    q('.tut-ic').textContent = s.ic; q('.tut-t').textContent = s.t; q('.tut-x').textContent = s.x; q('.tut-tip').textContent = s.tip;
    const bk = q('.tut-back'); bk.disabled = tutI === 0; bk.style.visibility = tutI === 0 ? 'hidden' : 'visible';
    const nx = q('.tut-next'); nx.textContent = tutI === TUT.length - 1 ? 'Los geht’s!' : 'Weiter'; nx.classList.toggle('go', tutI === TUT.length - 1);
    q('.tut-skip').style.visibility = tutI === TUT.length - 1 ? 'hidden' : 'visible';
    const b = q('.tut-body'); if (b) b.scrollTop = 0;
    tutLayout();
  }
  function tutTarget(s) {
    for (const sel of [s.sel, s.alt]) { if (!sel) continue; let e = null; try { e = document.querySelector(sel); } catch (x) {} if (!e || !e.getBoundingClientRect) continue; const r = e.getBoundingClientRect(); if (r.width > 2 && r.height > 2 && r.bottom > 0 && r.right > 0 && r.top < (window.innerHeight || 9999) && r.left < (window.innerWidth || 9999)) return r; }
    return null;
  }
  function tutLayout() {
    if (!tutEl || !tutOpen) return; const s = TUT[tutI], r = tutTarget(s), spot = tutEl.querySelector('.tut-spot'), lab = tutEl.querySelector('.tut-lab'), card = tutEl.querySelector('.tut-card'), dim = tutEl.querySelector('.tut-dim');
    const vw = window.innerWidth || 800, vh = window.innerHeight || 400, land = vw > vh;
    tutEl.classList.toggle('land', land);
    if (r) {
      const p = 6; spot.style.display = 'block'; dim.style.display = 'none';
      Object.assign(spot.style, { left: (r.left - p) + 'px', top: (r.top - p) + 'px', width: (r.width + 2 * p) + 'px', height: (r.height + 2 * p) + 'px' });
      lab.style.display = s.lab ? 'block' : 'none'; lab.textContent = s.lab;
      const below = r.bottom + 12 + 26 < vh, ly = below ? r.bottom + p + 6 : r.top - p - 30; lab.style.top = Math.max(4, ly) + 'px';
      lab.style.left = clamp(r.left + r.width / 2 - 70, 6, vw - 146) + 'px';
    } else { spot.style.display = 'none'; lab.style.display = 'none'; dim.style.display = 'block'; }
    // Karte vom markierten Element weg: im Hochformat oben oder unten, im Querformat links oder rechts
    const cs = card.style; cs.left = cs.right = cs.top = cs.bottom = cs.transform = '';
    if (!r) { cs.left = '50%'; cs.top = '50%'; cs.transform = 'translate(-50%,-50%)'; }
    else if (land) { const cx = r.left + r.width / 2; cs.top = '50%'; cs.transform = 'translateY(-50%)'; if (cx > vw / 2) cs.left = 'max(12px, env(safe-area-inset-left))'; else cs.right = 'max(12px, env(safe-area-inset-right))'; }
    else { const cy = r.top + r.height / 2; cs.left = '50%'; cs.transform = 'translateX(-50%)'; if (cy > vh / 2) cs.top = 'calc(env(safe-area-inset-top, 0px) + 12px)'; else cs.bottom = 'calc(env(safe-area-inset-bottom, 0px) + 12px)'; }
  }
  function begin(fresh) {
    unlock();
    if (fresh || !G) newGame();
    player.x = DOOR.x; player.y = DOOR.y; player.fl = 0; sus = 0; floaters = []; packPr = 0; joy.id = null; joy.dx = joy.dy = 0; fx = []; hist = []; curKey = 'keller'; syncGate(); rebuildWorkers(true); petSnap();
    achSeen = {}; for (const a of ACH) if (a.v() >= a.t) achSeen[a.id] = 1; achT = 1;
    cops.forEach(c => { c.stun = 0; c.st = 'patrol'; c.tx = -1; }); copMates.forEach(m => { m.on = false; m.st = 'patrol'; }); cars.length = 0; carQ = null; carT = 70 + Math.random() * 50; player.carCd = 0;
    gangs.length = 0; drops.length = 0; gangT = 45 + Math.random() * 40; gangShield = 0;
    Object.keys(cache).forEach(k => delete cache[k]);
    $('menu').hidden = true; $('edit').hidden = true; $('hud').classList.add('on'); $('pads').classList.add('on'); closeChat(); $('emoteBar').hidden = true;
    state = 'play'; save(); mpAuto(); cmdPollT = 0; cmdPoll(true);
    msg(fresh ? 'Pflanze Samen in einen Topf, die Zeit läuft' : retireNote || 'Willkommen zurück', false); if (!fresh) retireNote = '';
  }

  // ---------- Eingabe ----------
  cv.addEventListener('pointerdown', e => {
    if (state === 'admin') { e.preventDefault(); admDown(e); return; }
    if (state === 'edit') { e.preventDefault(); editDown(e); return; }
    if (state !== 'play' || phoneOpen || chatOpen) return;
    e.preventDefault(); unlock();
    if (joy.id === null && (e.clientX < W * 0.55 || isPort())) { joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.dx = joy.dy = 0; try { cv.setPointerCapture(e.pointerId); } catch (x) {} }
  });
  cv.addEventListener('pointermove', e => {
    if (state === 'admin') { admMove(e); return; }
    if (state === 'edit') { editMove(e); return; }
    if (e.pointerId !== joy.id) return;
    let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const d = Math.hypot(dx, dy), m = 56;
    if (d > m) { joy.ox += dx / d * (d - m); joy.oy += dy / d * (d - m); dx = dx / d * m; dy = dy / d * m; }
    joy.dx = dx / m; joy.dy = dy / m;
  });
  const endJoy = e => { if (state === 'admin') { admUp(e); return; } if (state === 'edit') { editUp(e); return; } if (e.pointerId === joy.id) { joy.id = null; joy.dx = joy.dy = 0; } };
  cv.addEventListener('pointerup', endJoy); cv.addEventListener('pointercancel', endJoy);

  function bindBtn(id, down, up) {
    const b = $(id);
    b.addEventListener('pointerdown', e => { e.preventDefault(); if (hudEdit.on) { hudDragStart(e, b); return; } unlock(); b.classList.add('down'); down(); try { b.setPointerCapture(e.pointerId); } catch (x) {} });
    b.addEventListener('pointermove', e => { if (hudEdit.on) hudDragMove(e); });
    const off = () => { if (hudEdit.on) { hudEdit.drag = null; return; } b.classList.remove('down'); if (up) up(); };
    b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
    b.addEventListener('contextmenu', e => e.preventDefault());
  }
  bindBtn('bAct', () => { aHeld = true; aEdge = true; }, () => { aHeld = false; });
  bindBtn('bPhone', () => { openPhone(); $('emoteBar').hidden = true; }, null);
  bindBtn('bVeh', () => { toggleRide(undefined, 'bike'); }, null);
  bindBtn('bCar', () => { toggleRide(undefined, 'car'); }, null);
  bindBtn('bEmote', () => { buildEmoteBar(); const b = $('emoteBar'); b.hidden = !b.hidden; }, null);
  bindBtn('bTake', () => { bEdge = true; bHeld = true; }, () => { bHeld = false; });

  window.addEventListener('keydown', e => {
    if (e.target && e.target.id === 'chatIn') return;
    if (e.code === 'KeyE' || e.code === 'Space') { e.preventDefault(); if (!aHeld) aEdge = true; aHeld = true; return; }
    if (e.code === 'KeyQ' || e.code === 'KeyB') { e.preventDefault(); if (!bHeld) bEdge = true; bHeld = true; return; }
    if (e.code === 'KeyV') { e.preventDefault(); toggleRide(undefined, 'bike'); return; }
    if (e.code === 'KeyC') { e.preventDefault(); toggleRide(undefined, 'car'); return; }
    if (e.code === 'KeyP' || e.code === 'Tab') { e.preventDefault(); phoneOpen ? closePhone() : openPhone(); return; }
    keys[e.code] = true;
    if (e.code.startsWith('Arrow')) e.preventDefault();
  });
  window.addEventListener('keyup', e => { if (e.code === 'KeyE' || e.code === 'Space') aHeld = false; if (e.code === 'KeyQ' || e.code === 'KeyB') bHeld = false; keys[e.code] = false; });
  window.addEventListener('blur', () => { aHeld = false; for (const k in keys) keys[k] = false; joy.id = null; });

  $('newGame').addEventListener('click', () => {
    const b = $('newGame');
    if (store.get('kellergruen.save', null) && !b.dataset.arm) {
      b.dataset.arm = '1'; b.textContent = 'Spielstand löschen? Nochmal tippen';
      setTimeout(() => { delete b.dataset.arm; b.textContent = 'Neues Spiel'; }, 4000);
      return;
    }
    backupSave(); saveBlocked = false;
    begin(true);
  });
  $('cont').addEventListener('click', () => {
    if (load()) begin(false);
    else if (loadKey(SAVE_KEY + '.auto') || load(true)) { begin(false); msg('Dein Spielstand war nicht lesbar. Die letzte Sicherung wurde geladen.', true); }
    else { saveBlocked = true; const b = $('cont'); b.textContent = 'Spielstand nicht lesbar – bleibt gesichert'; }
  });
  $('mute').addEventListener('click', () => { unlock(); setMuted(!muted); });
  const closeNow = e => { e.preventDefault(); e.stopPropagation(); if (phoneOpen) closePhone(); };
  $('phClose').addEventListener('pointerdown', closeNow); $('phClose').addEventListener('click', closeNow);
  $('phClose2').addEventListener('pointerdown', closeNow); $('phClose2').addEventListener('click', closeNow); $('phBack2').addEventListener('click', () => { tab = 'home'; renderPhone(); }); // v126: Schliessen auch unten (Einhand)
  $('bPort').addEventListener('click', () => setPortOk(true));
  $('phBack').addEventListener('click', () => { tab = 'home'; renderPhone(); });
  $('phSave').addEventListener('click', () => { save(); if (accOn() && fbOk()) { cloudPut(false).then(ok => msg(ok ? 'Spielstand gespeichert und online gesichert' : 'Spielstand gespeichert (online gerade nicht erreichbar)')); } else msg('Spielstand gespeichert'); });
  $('chatBtn').addEventListener('click', () => { chatOpen ? closeChat() : openChat(); });
  $('chatClose').addEventListener('click', closeChat);
  $('chatSend').addEventListener('click', sendChat);
  $('chatIn').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendChat(); } e.stopPropagation(); });
  document.querySelectorAll && Array.from(document.querySelectorAll('#chat [data-ins]')).forEach(b => b.addEventListener('click', () => {
    const el = $('chatIn'), v = b.dataset.ins;
    if (v === '-hilfe') { el.value = ''; runCmd('-hilfe'); } else { el.value = v; try { el.focus(); } catch (e) {} }
  }));
  $('edDone').addEventListener('click', finishEdit);
  $('heDone').addEventListener('click', hudEditEnd); $('heReset').addEventListener('click', hudReset); setTimeout(hudApply, 60); // v71
  $('newsReload').addEventListener('click', newsReload); $('newsLater').addEventListener('click', hideNews); // v68
  $('admDone').addEventListener('click', finishAdmin); $('admUndo').addEventListener('click', admUndo); $('admZin').addEventListener('click', () => admZoom(1.4)); $('admZout').addEventListener('click', () => admZoom(1 / 1.4));
  $('admRot').addEventListener('click', () => { adm.rot = adm.rot ? 0 : 1; admMsg(adm.rot ? 'Neue Bänke stehen senkrecht, neue Häuser haben die Tür oben' : 'Neue Bänke stehen waagerecht, neue Häuser haben die Tür unten'); });
  $('edRot').addEventListener('click', edRotate);
  $('edZin').addEventListener('click', () => edZoom(1.4)); $('edZout').addEventListener('click', () => edZoom(1 / 1.4)); $('edZ0').addEventListener('click', () => { ed.zoom = 1; ed.px = 0; ed.py = 0; });
  cv.addEventListener('wheel', e => { if (state === 'edit') { e.preventDefault(); edZoom(e.deltaY < 0 ? 1.15 : 1 / 1.15); } else if (state === 'admin') { e.preventDefault(); admZoom(e.deltaY < 0 ? 1.15 : 1 / 1.15); } }, { passive: false });
  $('edDel').addEventListener('click', () => { if (ed.ak === 'ghq') { ghqDelSel(); return; } if (ed.sel && ed.sel.kind === 'decor' && removeDecor(ed.ak, ed.sel.i)) { ed.sel = null; edMsg('Eingelagert. Du findest es links unter Bestand.', false); renderEditPanel(); } });
  $('edReset').addEventListener('click', () => { resetLayout(ed.ak); ed.sel = null; edMsg('Stationen stehen wieder an ihren alten Plätzen', false); renderEditPanel(); });
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('touchmove', e => { if (!e.target.closest('.ph-body') && !e.target.closest('.tabs') && !e.target.closest('.screen') && !e.target.closest('.edit') && !e.target.closest('.inst')) e.preventDefault(); }, { passive: false });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { accUpT = Date.now(); save(); cloudPut(true); } if (ac) { document.hidden ? ac.suspend() : ac.resume(); } });
  window.addEventListener('pagehide', save);

  // ---------- v101: Changelog („Was ist neu?“). Bei jedem Update aktuell halten: nur die letzten drei Versionen stehen hier. ----------
  const CHANGELOG = [
    { v: 132, date: 'Oktober 2026', title: 'HQ-Ausbau', items: [
      ['neu', '🌬️', 'Anbau im HQ jetzt mit allen Schritten: Die Beet-Ernte kommt frisch ins Gang-Lager, rechts am Trockengestell trocknen, am Packtisch verpacken, dann an den Großhändler verkaufen (Geld in die Gang-Kasse) oder für den Großauftrag nutzen'],
      ['neu', '✏️', 'HQ einrichten wie im Keller: an der Planungstafel oder in der Gang-App unter Einrichten. Teile mit dem Finger verschieben, neue Deko direkt aus der Kasse kaufen, wegräumen'],
      ['neu', '😎', 'Chill-Zone: 12 neue bewegte Deko-Stücke zum Abhängen, z. B. Lounge-Ecke, DJ-Pult, Feuerschale, Gaming-Ecke, Pokertisch, Graffiti-Wand und Boxenturm'],
      ['neu', '🦄', 'Begleiter antippen: große Ansicht, die sich dreht, mit ganzer Beschreibung und allen Vorteilen'] ] },
    { v: 131, date: 'Oktober 2026', title: 'Ruhe im HQ', items: [
      ['chg', '🧭', 'Im Gang-Hauptquartier wird der Lieferkompass nicht mehr angezeigt'],
      ['neu', '💰', 'Im Gang-Hauptquartier steht die Gang-Kasse oben links unter deinem Geld'] ] },
  ].slice(0, 3);
  const CL_KEY = 'kellergruen.clseen';
  const CL_TAG = { neu: ['Neu', '#5FE584'], fix: ['Behoben', '#6EB5FF'], chg: ['Geändert', '#FFB547'], info: ['Gut zu wissen', '#C58BE6'] };
  let clEl = null;
  function showChangelog(force) {
    if (!clEl) { clEl = document.createElement('div'); clEl.className = 'clwrap'; document.body.appendChild(clEl); }
    let cur = 0;
    const paint = () => {
      const c = CHANGELOG[cur];
      clEl.innerHTML = '<div class="clcard"><div class="clhead"><div class="clspark">✨</div><div><div class="clt">Was ist neu?</div><div class="cls">Kellergrün · Version ' + GAME_VER + ' · die letzten drei Updates</div></div></div>'
        + '<div class="cltabs">' + CHANGELOG.map((x, i) => '<button data-i="' + i + '" class="' + (i === cur ? 'on' : '') + '">Version ' + x.v + (i === 0 ? ' <i>NEU</i>' : '') + '</button>').join('') + '</div>'
        + '<div class="clbody"><div class="clvt">' + c.title + '</div><div class="cld">' + c.date + '</div><ul>' + c.items.map(([k, ic, tx]) => '<li><span class="clic">' + ic + '</span><span class="cltx"><em style="--c:' + CL_TAG[k][1] + '">' + CL_TAG[k][0] + '</em>' + tx + '</span></li>').join('') + '</ul></div>'
        + '<button class="clok">' + (state === 'play' ? 'Schließen' : 'Los geht’s!') + '</button></div>';
      clEl.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => { cur = +b.dataset.i; paint(); }));
      clEl.querySelector('.clok').addEventListener('click', closeChangelog);
    };
    paint(); clEl.hidden = false; try { joy.id = null; joy.dx = joy.dy = 0; } catch (e) {}
  }
  function closeChangelog() { if (clEl) clEl.hidden = true; store.set(CL_KEY, String(GAME_VER)); }
  try { $('clBtn').addEventListener('click', () => showChangelog(true)); } catch (e) {}
  try { $('mini').addEventListener('pointerdown', e => { e.stopPropagation(); }); $('mini').addEventListener('click', e => { e.stopPropagation(); bigMapOpen(); });
    $('bigClose').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); bigMapClose(); }); $('bigClose').addEventListener('click', bigMapClose); $('bigDel').addEventListener('click', () => { wayPt = null; bigMapDraw(); msg('Wegpunkt entfernt'); });
    $('bigCv').addEventListener('click', bigMapTap);
    { const v = $('bigView'); v.addEventListener('pointerdown', bigPDown); v.addEventListener('pointermove', bigPMove); v.addEventListener('pointerup', bigPUp); v.addEventListener('pointercancel', bigPUp); v.addEventListener('wheel', bigWheel, { passive: false }); $('bigZin').addEventListener('click', e => { e.stopPropagation(); bigZoomBtn(1.6); }); $('bigZout').addEventListener('click', e => { e.stopPropagation(); bigZoomBtn(1 / 1.6); }); } $('bigMap').addEventListener('pointerdown', e => e.stopPropagation()); $('bigMap').addEventListener('click', e => { if (e.target === $('bigMap')) bigMapClose(); });
    window.addEventListener('resize', () => { if (bigOpen) { bigMapLayout(); bigMapDraw(); } }); } catch (e) {}
  window.addEventListener('keydown', e => { if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return; if (e.code === 'KeyM' && state === 'play' && !phoneOpen && !chatOpen) { bigOpen ? bigMapClose() : bigMapOpen(); } else if (e.code === 'Escape' && bigOpen) bigMapClose(); });
  setTimeout(() => { try { if (!window.__KG_NOTUT && (+store.get(CL_KEY, '0') || 0) < GAME_VER) showChangelog(); } catch (e) {} }, 300);
  function menuSave() { // v112: Karte mit dem letzten Spielstand im Startmenue
    const el = $('mmSave'); if (!el) return;
    try {
      const sv = JSON.parse(store.get('kellergruen.save', 'null')); if (!sv || !sv.day) { el.hidden = true; return; }
      let nm = 'Dein Spielstand'; try { const m = JSON.parse(store.get('kellergruen.mp', 'null')); if (m && m.name) nm = String(m.name).slice(0, 16); } catch (e) {}
      const tier = sv.kr && +sv.kr.v >= 3 ? TIERS[clamp(Math.floor(+sv.kr.tier) || 1, 1, TIERS.length) - 1] : null, ps = clamp(Math.floor(+sv.prest) || 0, 0, PRES_MAX), rep = Math.min(REP_MAX, Math.max(0, Math.floor(+sv.rep) || 0));
      const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
      el.innerHTML = '<div class="mm-av' + (ps ? ' pr' : '') + '">' + esc(nm.charAt(0).toUpperCase() || 'K') + '</div><div style="min-width:0"><div class="mm-nm">' + esc(nm) + (ps ? '<em>✦ ' + ps + '</em>' : '') + '</div><div class="mm-meta">Tag ' + Math.floor(+sv.day) + (tier ? ' · ' + tier.name : '') + ' · Ruf ' + rep + '</div></div><div class="mm-cash">' + fmt(Math.max(0, +sv.money || 0)) + '</div>';
      el.hidden = false; $('cont').textContent = 'Weiterspielen';
    } catch (e) { el.hidden = true; }
  }
  try { const ic = document.querySelector('link[rel="apple-touch-icon"]'); if (ic) $('mmIcon').style.backgroundImage = 'url("' + ic.href + '")'; } catch (e) {}
  try { $('helpBtn').addEventListener('click', () => { $('mmHelp').hidden = false; }); $('helpClose').addEventListener('click', () => { $('mmHelp').hidden = true; }); $('mmHelp').addEventListener('click', e => { if (e.target === $('mmHelp')) $('mmHelp').hidden = true; }); } catch (e) {}
  setMuted(muted);
  function menuRefresh() {
    const has = !!store.get('kellergruen.save', null), c = $('cont'), n = $('newGame');
    c.hidden = !has; c.classList.toggle('ghost', !has); n.classList.toggle('ghost', has);
    if (has) c.parentNode.insertBefore(c, n); else c.parentNode.appendChild(c);
    if (has) menuSave(); else { $('mmSave').hidden = true; }
    const ch = $('mmAcc'); if (!ch) return;
    if (!fbOk()) { ch.hidden = true; return; }
    ch.hidden = false; ch.classList.toggle('off', !accOn());
    ch.innerHTML = accOn() ? '<i>👤</i> Angemeldet als ' + String(acc.name).replace(/[<>&]/g, '') + (accState ? ' · offline' : '') : '<i>☁️</i> Nicht angemeldet · Jetzt anmelden';
    ch.style.pointerEvents = accOn() ? 'none' : '';
  }
  function menuBusy(on) { const c = $('cont'), n = $('newGame'); c.disabled = n.disabled = on; if (on) { c.hidden = false; c.textContent = 'Lade Spielstand …'; } else if (c.textContent === 'Lade Spielstand …') c.textContent = 'Weiterspielen'; }
  // ---------- v113: Anmelde-Fenster ----------
  let lgMode = 'set';
  function lgShow(mode, err) {
    lgMode = mode; const set = mode === 'set', rc = mode === 'rec', nm = (acc && acc.name) || mp.name || mpLoadCfg().name || '';
    $('lgCodeRow').hidden = !rc; $('lgForgot').hidden = mode !== 'login'; $('lgCode').value = ''; $('lgPwL').textContent = rc ? 'Neues Passwort' : 'Passwort';
    $('lgTitle').textContent = rc ? 'Passwort vergessen' : set ? 'Passwort festlegen' : 'Anmelden';
    $('lgText').textContent = rc ? 'Gib deinen Spielernamen und deinen Wiederherstellungs-Code ein und wähle ein neues Passwort. Den Code hast du beim Anlegen des Kontos bekommen.' : set ? (nm ? 'Hallo ' + nm + '! Leg einmal ein Passwort für deinen Spielernamen fest. Dann bleibt dein Spielstand sicher und du kannst auf jedem Gerät weiterspielen.' : 'Wähle einen Spielernamen und ein Passwort. Dann bleibt dein Spielstand sicher und du kannst auf jedem Gerät weiterspielen.') : 'Melde dich mit deinem Spielernamen und deinem Kellergrün-Passwort an. Dein Spielstand wird dann geladen.';
    if (!$('lgName').value || mode === 'set') $('lgName').value = nm; $('lgPw').value = ''; $('lgPw2').value = '';
    $('lgPw').autocomplete = set || rc ? 'new-password' : 'current-password';
    $('lgPw2Row').hidden = !(set || rc); $('lgWarn').hidden = !set;
    $('lgGo').textContent = rc ? 'Neues Passwort speichern' : set ? 'Konto anlegen' : 'Anmelden'; $('lgGo').disabled = false;
    $('lgSwap').textContent = set ? 'Ich habe schon ein Passwort · Anmelden' : rc ? 'Zurück zum Anmelden' : 'Neu hier oder noch kein Passwort? Konto anlegen';
    $('lgErr').textContent = err || ''; $('lgErr').className = 'lg-err'; $('mmLogin').hidden = false;
  }
  function cdShow(code) { $('cdBox').textContent = code; $('cdCopy').textContent = 'Code kopieren'; $('mmCode').hidden = false; }
  function menuToast(t) { const ch = $('mmAcc'); if (!ch) return; const o = ch.innerHTML; ch.innerHTML = '<i>✅</i> ' + t; setTimeout(() => menuRefresh(), 4000); }
  function lgHide() { $('mmLogin').hidden = true; try { sessionStorage.setItem('kellergruen.guest', '1'); } catch (e) {} }
  async function lgGo() {
    const set = lgMode === 'set', rc = lgMode === 'rec', nm = $('lgName').value, pw = $('lgPw').value, er = $('lgErr');
    if (mpClean(nm, 12).length < 2) { er.textContent = 'Der Name braucht mindestens 2 Zeichen (Buchstaben, Zahlen, Leerzeichen).'; return; }
    if (pw.length < 6) { er.textContent = 'Das Passwort braucht mindestens 6 Zeichen.'; return; }
    if ((set || rc) && pw !== $('lgPw2').value) { er.textContent = 'Die beiden Passwörter sind nicht gleich.'; return; }
    if (rc && recNorm($('lgCode').value).length !== 12) { er.textContent = 'Der Code hat 12 Zeichen, zum Beispiel ABCD-EFGH-JKMN.'; return; }
    const b = $('lgGo'); b.disabled = true; b.textContent = 'Bitte warten …'; er.textContent = '';
    try {
      if (rc) await accRecover(nm, $('lgCode').value, pw); else await accLogin(nm, pw, set);
      $('mmLogin').hidden = true; menuRefresh(); try { sessionStorage.removeItem('kellergruen.login'); } catch (e) {}
      if (rc) { menuToast('Neues Passwort gespeichert. Dein Code bleibt gültig.'); }
      else if (set) { try { cdShow(await recStore(pw)); } catch (e) {} }
    }
    catch (e) {
      if (e.code === 'EMAIL_EXISTS') { lgShow('login', 'Den Namen „' + mpClean(nm, 12) + '“ gibt es schon mit Passwort. Bist du das? Dann melde dich an. Sonst nimm einen anderen Namen.'); $('lgName').value = mpClean(nm, 12); return; }
      er.textContent = e.message || 'Das hat nicht geklappt.'; b.disabled = false; b.textContent = rc ? 'Neues Passwort speichern' : set ? 'Konto anlegen' : 'Anmelden';
    }
  }
  try {
    $('lgGo').addEventListener('click', lgGo); $('lgSwap').addEventListener('click', () => lgShow(lgMode === 'login' ? 'set' : 'login'));
    $('lgOff').addEventListener('click', lgHide); $('lgClose').addEventListener('click', lgHide);
    $('lgForgot').addEventListener('click', () => { const n = $('lgName').value; lgShow('rec'); $('lgName').value = n; });
    $('cdOk').addEventListener('click', () => { $('mmCode').hidden = true; });
    $('cdCopy').addEventListener('click', () => { const t = $('cdBox').textContent; try { navigator.clipboard.writeText(t).then(() => { $('cdCopy').textContent = 'Kopiert ✓'; }, () => {}); } catch (e) {} });
    $('mmAcc').addEventListener('click', () => { if (!accOn()) lgShow(mp.name || mpLoadCfg().name ? 'set' : 'login'); });
    for (const id of ['lgName', 'lgPw', 'lgPw2', 'lgCode']) { const el = $(id); el.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); lgGo(); } }); el.addEventListener('keyup', e => e.stopPropagation()); }
  } catch (e) {}
  menuRefresh();
  if (fbOk()) {
    let ss = {}; try { ss = { login: sessionStorage.getItem('kellergruen.login'), guest: sessionStorage.getItem('kellergruen.guest') }; } catch (e) {}
    if (accOn()) {
      if (mp.name !== acc.name) setPlayerName(acc.name);
      menuBusy(true);
      Promise.race([accSync(), new Promise((_, rj) => setTimeout(() => rj(new Error('Zeit')), 9000))]).catch(e => { if (e && e.code === 'BANNED') { acc = null; store.del(ACC_KEY); menuBusy(false); menuRefresh(); lgShow('login', 'Dieses Konto wurde gesperrt.'); return; } accState = 'offline'; }).then(() => { menuBusy(false); menuRefresh(); });
    } else if (ss.login || !ss.guest) lgShow(ss.login ? 'login' : 'set');
  }
  newGame(); G.time = 20 * 60 + 40; // v112: Startmenue am Abend, wenn die Lichter angehen
  // ---------- Als App installieren (v55) ----------
  // Im Browser erscheint eine Anleitung (Android: ein Knopf, iPhone: Schritt fuer Schritt). Vom Home-Bildschirm gestartet nie.
  const INST = (() => {
    const ua = (typeof navigator !== 'undefined' && navigator.userAgent) || '', mm = q => { try { return !!(window.matchMedia && window.matchMedia(q).matches); } catch (e) { return false; } };
    const touchMac = /Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1;
    const ios = /iPhone|iPad|iPod/.test(ua) || touchMac, ipad = /iPad/.test(ua) || touchMac, android = /Android/.test(ua);
    const inApp = /FBAN|FBAV|Instagram|Line\/|Snapchat|TikTok|musical_ly|LinkedInApp|Pinterest/i.test(ua);
    const iosOther = ios && /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    let search = ''; try { search = location.search || ''; } catch (e) {}
    const standalone = () => (document.documentElement && / kg-app/.test(' ' + document.documentElement.className)) || mm('(display-mode: standalone)') || mm('(display-mode: fullscreen)') || mm('(display-mode: minimal-ui)') || (typeof navigator !== 'undefined' && navigator.standalone === true) || /[?&]app=1/.test(search);
    return { ios, ipad, android, inApp, iosOther, mobile: ios || android || /Mobi/.test(ua), standalone, mm, prompt: null, done: false };
  })();
  const SV = {
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M7.5 7.5L12 3l4.5 4.5"/><path d="M8 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/></svg>',
    dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
    hdots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2.1"/><circle cx="12" cy="12" r="2.1"/><circle cx="19" cy="12" r="2.1"/></svg>',
    dl: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v11M7 10.5l5 5 5-5"/><path d="M5 19.5h14"/></svg>',
    ok: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    tap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="3" width="12" height="18" rx="3"/><path d="M10.5 17.5h3"/></svg>',
    compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>'
  };
  const step = (html, sym) => '<li><span>' + html + '</span>' + (sym ? '<span class="sym">' + SV[sym] + '</span>' : '<span></span>') + '</li>';
  function renderInstall(kind) {
    const b = $('instBody'); if (!b) return;
    const arrow = $('instArrow'); arrow.hidden = true; arrow.classList.remove('top'); { const cd = document.querySelector('.inst-card'), sk = $('instSkip'); if (cd) { cd.style.paddingBottom = ''; if (sk && sk.parentNode === cd && cd.lastElementChild !== sk) cd.appendChild(sk); } }
    const iosNote = '<div class="inst-note"><span>💾</span><span><b>Wichtig:</b> Auf dem iPhone hat die App ihren eigenen Speicher. Wer vorher im Browser gespielt hat, fängt in der App neu an. Darum am besten <b>jetzt gleich</b> einrichten.</span></div>';
    if (INST.done || kind === 'done') {
      b.innerHTML = '<div class="inst-done"><div class="big">🎉</div><h3>Fertig eingerichtet!</h3><p>Auf deinem Startbildschirm liegt jetzt <b>Kellergrün</b>. Schließ den Browser und starte das Spiel ab jetzt über das neue Symbol.</p></div>';
      $('instSkip').textContent = 'Schließen'; return;
    }
    if (INST.ios && INST.inApp) {
      b.innerHTML = '<ol class="inst-steps">' + step('Du bist gerade in einer anderen App. Tippe auf <b>⋯</b> oder das <b>Kompass-Symbol</b>', 'compass') + step('Wähle <b>In Safari öffnen</b>', 'tap') + step('Dort siehst du diese Anleitung wieder', null) + '</ol>';
    } else if (INST.ios) {
      const portrait0 = INST.mm('(orientation: portrait)');
      b.innerHTML = '<ol class="inst-steps">' +
        (INST.iosOther ? step('Tippe oben in der Adressleiste auf <b>Teilen</b>', 'share')
          : step('Tippe ' + (INST.ipad ? 'oben rechts' : portrait0 ? 'unten in der Leiste' : 'in der Leiste') + ' auf die <b>drei Punkte</b> (⋯)', 'hdots') + step('Tippe auf <b>Teilen</b> <span style="color:var(--muted);font-size:13px">(bei älteren iPhones ist Teilen direkt in der Leiste)</span>', 'share')) +
        step('Scrolle etwas runter und tippe auf <b>Zum Home-Bildschirm</b>', 'plus') +
        step('Tippe oben rechts auf <b>Hinzufügen</b>', 'ok') +
        step('Starte <b>Kellergrün</b> über das neue Symbol', 'tap') + '</ol>' + iosNote;
      const portrait = INST.mm('(orientation: portrait)');
      if (!INST.iosOther && (INST.ipad || portrait)) { arrow.hidden = false; arrow.classList.toggle('top', INST.ipad); $('instArrowTx').textContent = 'Hier auf ⋯ tippen'; { const cd = document.querySelector('.inst-card'), sk = $('instSkip'); if (cd && !INST.ipad) { cd.style.paddingBottom = 'calc(env(safe-area-inset-bottom, 0px) + 84px)'; if (sk) cd.insertBefore(sk, cd.querySelector('.inst-perks')); } } }
    } else if (INST.prompt) {
      b.innerHTML = '<button class="btn inst-go" id="instGo">' + SV.dl + 'Jetzt installieren</button><ol class="inst-steps">' + step('Tippe auf <b>Jetzt installieren</b>', null) + step('Bestätige mit <b>Installieren</b>', 'ok') + step('Starte <b>Kellergrün</b> über das neue Symbol', 'tap') + '</ol>';
      $('instGo').addEventListener('click', async () => {
        const p = INST.prompt; if (!p) return; INST.prompt = null;
        try { p.prompt(); const r = await p.userChoice; if (r && r.outcome === 'accepted') { INST.done = true; } } catch (e) {}
        renderInstall();
      });
    } else if (INST.android) {
      b.innerHTML = '<ol class="inst-steps">' + step('Tippe oben rechts auf die <b>drei Punkte</b>', 'dots') + step('Wähle <b>App installieren</b> oder <b>Zum Startbildschirm hinzufügen</b>', 'plus') + step('Bestätige mit <b>Installieren</b>', 'ok') + step('Starte <b>Kellergrün</b> über das neue Symbol', 'tap') + '</ol>';
    } else {
      b.innerHTML = '<ol class="inst-steps">' + step('Am besten spielst du auf dem <b>Handy</b>: öffne diesen Link dort', 'tap') + step('Am Computer: im Chrome- oder Edge-Menü <b>Kellergrün installieren</b> wählen', 'dots') + '</ol>';
    }
    $('instSkip').textContent = 'Erst mal im Browser spielen';
  }
  function showInstall() {
    const el = $('inst'); if (!el || INST.standalone()) return false;
    try { const ic = document.querySelector('link[rel="apple-touch-icon"]'); if (ic) $('instIc').style.backgroundImage = 'url("' + ic.href + '")'; } catch (e) {}
    renderInstall(); el.hidden = false;
    try { const u = new URL(location.href); if (!u.searchParams.has('app')) { u.searchParams.set('app', '1'); history.replaceState(null, '', u.toString()); } } catch (e) {} // so landet die Adresse mit ?app=1 auf dem Home-Bildschirm
    return true;
  }
  function hideInstall() { const el = $('inst'); if (el) el.hidden = true; const a = $('instArrow'); if (a) a.hidden = true; try { const u = new URL(location.href); if (u.searchParams.get('app') === '1' && !INST.standalone()) { u.searchParams.delete('app'); history.replaceState(null, '', u.toString()); } } catch (e) {} try { sessionStorage.setItem('kellergruen.inst', '1'); } catch (e) {} }
  try {
    window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); INST.prompt = e; const ib = $('instBtn'); if (ib && !INST.standalone()) ib.hidden = false; if ($('inst') && !$('inst').hidden) renderInstall(); });
    window.addEventListener('appinstalled', () => { INST.done = true; INST.prompt = null; if ($('inst') && !$('inst').hidden) renderInstall(); const ib = $('instBtn'); if (ib) ib.hidden = true; });
    $('instSkip').addEventListener('click', hideInstall);
    $('instBtn').addEventListener('click', showInstall);
    if (!INST.standalone()) {
      $('instBtn').hidden = false;
      let seen = false; try { seen = sessionStorage.getItem('kellergruen.inst') === '1'; } catch (e) {}
      if (INST.mobile && !seen) setTimeout(showInstall, 400);
    }
    if (typeof navigator !== 'undefined' && navigator.serviceWorker && typeof location !== 'undefined' && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
  } catch (e) {}
  loadWorldLocal(); setTimeout(worldStart, 1500); // v59: gemeinsame Karte
  if (r3Want) setTimeout(r3Start, 50); // v90: 3D-Ansicht vom letzten Mal
  if (window.__KG_DEBUG) window.__KG_DEBUG({ get G() { return G; }, player, cops, POTS, RACK, TABLE, HOUSES, DOOR, update, begin, save, load, setA(v, e) { aHeld = v; if (e) aEdge = true; }, get sus() { return sus; }, set sus(v) { sus = v; }, bustNow() { copBust = gt; }, findTarget, openPhone, renderPhone, closePhone, UPS, addOrder, getState: () => state, setB() { bEdge = true; }, joy, keys, buyCos, equipCos, COS, get fx() { return fx; }, get hist() { return hist; }, get lastMsg() { return lastMsg; }, rackCap, hintFor, objective, get workers() { return workers; }, get potClaim() { return AREAS.keller.claim; }, AREAS, S, POTS2, RACK2, TABLE2, DOOR2, IN2, BARN_GATE, buyArea, totalBags, areaAt, get curKey() { return curKey; }, set curKey(v) { curKey = v; }, hire, ROLES, PILE, get BAGS_MAX() { return bagsMax(); }, payWages, rebuildWorkers, wageTotal, navBlock, GW, GH, CELL, colliders, upgradeStaff, DEF_LOOK, UPG_COST, setTab: t => { tab = t; }, renderStyle, UPS, COS, PERKS, bagCap, walkSpeed, copRange, aud, audSave, audApply, musicTick, vibrate, renderSound, APPS, appOf, AREA_THEME, renderHome, roamPath, ACH, claimAch, achReady, upLevels, FOUNTAIN, BENCHES, RIVER, copLead, copLeaderId, copSync, carSync, mpApplyCops, cars, spawnCar, updateCars, payDaily, dailyCosts, repEff, seedCost, COP_LOOK, GOALS, DECOR, buyDecor, decStock, pet, petSnap, petUpdate, inField, renderDeko, orderPos, bestOrder, roamPick, roamStep, ZP, pets, activePets, addDecor, moveDecor, removeDecor, startEdit, finishEdit, layoutValid, moveStation, resetLayout, applyLayout, captureLayout, BASE, buySide, setFloor, syncGate, runCmd, parseAmount, mp, mpHandle, mpSend, mpTryPush, get cmdOk() { return cmdOk; }, set cmdOk(v) { cmdOk = v; }, orbitList, toggleOrbit, setPortOk, isPort, get portOk() { return portOk; }, doKill, undoKill, IN3, DOOR3, POTS3, RACK3, TABLE3, BREW_GATE, BATS, buyBat, equipBat, batSwing, drawBat, renderWpn, doEmote, EMOTES, get myEm() { return myEm; }, mpTick, mpDraw, mpConnect, mpDisconnect, renderFriendsTab, openChat, closeChat, get chatOpen() { return chatOpen; }, editHit, editDown, editMove, editUp, ed, ev, FLOOR_COLORS, FLOOR_PATS, RUGS, MAXDEC, rebuildNav, render, SAVE_VER, WEAR, WEAR_BY, wearOwned, equipWear, buyWear, renderWear, fixWear, drawAura, doSay, sayClean, cleanLook, sprite, HAIR_COLS, SKIN_COLS, OUTFITS, HAIR_STYLES, get XMIN() { return XMIN; }, VEHS, VEH_BY, buyVeh, equipVeh, toggleRide, riding, rideMult, drawVehicle, drawRide, skyNow, night, lightK, LAMPS, TREES, amb, traffic, ambUpdate, updateTraffic, renderVeh, renderDShop, renderHMine, renderHNbr, DCAT, drawLights, get rainK() { return amb.rain; }, OBST, obstAt, KIOSK, STALL, avoid, turnTo, roamStep, roamPick, drawDecorItem, WGRP, guardOf, defenseScore, threatScore, drawGadget, PLOT_W, MAX_PLOTS, mpSnap, mpParseSn, mpWhere, mpMapPos, mpSlots, mpVisit, mpHome, setSideGeom, withGhost, drawPlots, drawKeller, get GH_ON() { return GH_ON; }, gangs, drops, GANGS, spawnGang, updateGangs, drawGangs, gangShove, gangStep, gangAt, gangDeliver, gangHit, gangStrike, gangLead, gangTargets, trailPoint, gangRoll, gangCards, gangSync, dropSync, mpApplyGangs, mpGangEvents, mpGangHits, gangAdopt, gangWho, get gClock() { return gClock; }, get WORLD() { return WORLD; }, set WORLD(v) { WORLD = v; }, MTOOLS, cleanMap, applyWorld, startAdmin, finishAdmin, admAdd, admErase, admUndo, adm, ed, edZoom, worldIncoming, publishWorld, onBridge, itemBox, drawBrewDec, dHalfIt, INST, showInstall, hideInstall, renderInstall, FLOORS, FLPOTS, FLP, FLS, PATHS, onPath, viaPaths, CRATE, floorAreas, STC, setStair, buyPotAt, STAIR_STYLES, DEC_KEYS, floorLayoutValid, STAIR_D, STAIR_U, FL_STAIR, flPotCost, loadFloors, drawKellerFloor, KIOSK_AT, atKiosk, openKiosk, renderKiosk, drawGrowDec, potOf, get gangShield() { return gangShield; }, set gangShield(v) { gangShield = v; }, get gangT() { return gangT; }, set gangT(v) { gangT = v; }, selBike, selCar, hudCfg, hudSave, hudApply, hudEditStart, hudEditEnd, hudReset, hudEdit, renderHudSet, HUD_PADS, MINI, drift, carDrive, carBump, driftTick, ducks, duckUpdate, get bHeld() { return bHeld; }, set bHeld(v) { bHeld = v; }, WERK, WS_AT, WS_LOT, atWerk, openWerk, renderWerk, TUNE, buyTune, setTune, tuneOf, tuneArr, parseTune, cleanTune, smokes, smokeUpdate, spawnSmoke, inCar, CONTAINERS, AH_LOT, newsIncoming, showNews, hideNews, cleanNews, publishNews, NEWS_UPDATE, INFO_TOPIC, LAGER, LAGER_AT, AUTOHOF, AH_AT, atLager, atAutohof, openLager, openAutohof, buyLager, upLager, lagerPut, lagerTake, lagerCap, renderLager, renderAutohof, buyCar, paintCar, carCap, carColI, CAR_COLS, drawCar, btraf, updateBridgeTraffic, BINS, BIN_MAX, binUse, binHide, binTake, binRummage, binNear, binHint, binsParse, binList, cleanStash, mpBinWants, mpBinLoot, binTick, stashSum, ALLB, drawDrop, MP_MAX, rotateStation, edRotate, setCrate, crateStand, timeRate, BRIDGES, stationObj, rotAng, rotBegin, rotEnd, houseCount, editHit, BASE, num3, applySavedLayout, captureLayout, RD, RDH, RDV, NAV, NAV_HL, NAV_VL, navNext, navNext0, navRoute, navRandPt, navNear, segClear, blockedPt, onRoadway, TREFF, TREFF_AT, atTreff, openTreff, treffReturn, LANES, spawnTraffic, crossBoxes, SKATE, PLAY, PITCH, DOGS, FENCES, HALFPIPE, GRAFF, POND, houseWins, drawHouse, setPlayerName, nameGateOk, nameGateShow, get nameGateOpen() { return nameGateOpen; }, MP_DEF_ROOM, renderProfile, mpAuto, mpLoadCfg, gangExit, gangWalkPt, gangSpawnPt, UFER_N, UFER_S, FOOT_X, PUDDLES, drawCityGround, SKATERS, ZP, plotAt, mpWhere, GROUNDS, swLine, BROOKS, HBR, FLOODS, mpReload, doorZone, HYDRANTS, drawMoreDec, drawBack, cannaLeaf, drawMaster, get masterOn() { return masterOn; }, COSTUME, drawFigure, drawBatBack, weaponInHand, figUp, GV, GV_AT, GV_NPC, GV_DOOR, atGV, gvSell, gvSellAll, gvState, gvUnit, gvBase, gvUpdate, openGV, renderGV, drawGangHof, drawCompass, GV_REP, gvOpen, buyCargo, buyPlate, setPlate, cargoLv, cargoBonus, carCap, tuneOf, tuneDef, cleanPlate, tuneFits, get KR_NEUTRAL() { return KR_NEUTRAL; }, set KR_NEUTRAL(v) { KR_NEUTRAL = v; }, KR, TIERS, CHARS, CHAR_BY, EVENTS, SEASONS, SPECS, season, seasonI, seasonYear, absMin, krDef, cleanKr, krTalk, get ktalk() { return ktalk; }, qOf, taskProg, charHere, charReady, questsDone, krStartEvent, krEndEvent, krChoose, krEvTick, krTierTick, tierReady, crewSync, crewAssign, crewXp, crewSkill, crewSpec, crewTrain, crewMove, moveTargets, specSum, xpNeed, crewWage, krPrice, krOrd, krGrow, krSeed, krUpkeep, krTip, krRepCap, collPoints, collTick, renderRuf, renderQuests, renderWelt, renderCrew, renderTalk, krUpdate, drawKrChars, drawSeasonFx, krNear, krRegular, msVal, tierClose, TUT, tutStart, tutEnd, tutGo, get tutOpen() { return tutOpen; }, get tutI() { return tutI; }, tutLayout, KW, FW, kOx, fOx, slotAt, farmIds, ghostWalls, isOpen, potsOpen, roomEnter, roomLeave, prSetup, prBuyUp, buyPrPotAt, prGrow, roomTarget, apoSell, apoOpen, apoUnit, wheelSpin, wheelReady, bjDeal, bjHit, bjStand, bjDouble, bjVal, slotResult, slotPick, CAS, CAS_IN, CAS_WHEEL, CAS_SLOTS, CAS_BJ, APO, APO_AT, PR_PAD, PR_EXIT, PR_SHELF_AT, PR_POTS, inCasino, inRoom, lagerHere, qtyAsk, qtyClose, qtyDo, screenFit, r3Set, r3SetQ, get r3() { return r3; }, get r3Err() { return r3Err; }, KG3D_API, casShow, casHide, get casKind() { return casKind; }, get qtyOpen() { return qtyOpen; }, get bj() { return bj; }, set bj(v) { bj = v; }, get prVisit() { return prVisit; }, unitRoom, prCap, FG, lagerTake, lagerPut, mpWhere, mpMapPos, casCos, CONTAINERS, act, gymTrain, gymOn, pizzaOrder, pizzaOn, bankMove, bankInterest, clubSell, clubOpen, clubMax, clubLeft, walkSpeed, payDaily, CHAR_BY, TIERS, charHere, krTalk, bjPlan, get bjV() { return bjV; }, zoneRepAt, LAGER_AT, WS_AT, GYM_AT, PIZZA_AT, BANK_AT, CLUB_AT, copMates, prSetup, CHARS, bedNear, sleepAsk, sleepStart, sleepTick, get sleepS() { return sleepS; }, BIZ, bizBuy, bizEnter, bizLeave, bizDeposit, bizTick, get bizIn() { return bizIn; }, MAKLER_AT, raidRun, raidPay, heatDaily, raidPending, raidSeizable, bizPut, bizTake, bizInv, gvSell, gvSellAll, GV_AT, act, fullFix, screenInfo, fixBurst, CHARS, renderTeam, drawDec106, DEC_NEW, locName, busStops, busNear, busGo, busTick, busOpen, busZone, get busRide() { return busRide; }, renderBus, get busAt() { return busAt; }, set busAt(v) { busAt = v; }, retireFloors, OLD_FLOOR_ROLES, drawZoneLocks, doPrestige, presCan, presLv, presPrice, presRep, saveCode, readCode, importCode, saveObj, atGym, GYM2_AT, GYM2, krReward, buyWear, buyDecor, cleanKr, addRep, krRepBonus, REP_MAX, PRES_ITEM, renderPrestige, TIERS_N: TIERS.length, accLogin, accSync, accLogout, isAdm, admSend, cmdPoll, cmdRun, troll, tpTo, get acc2() { return acc; }, admLoad, admBan, admReset, admClearFlags, get admList() { return admList; }, doPrestige2: null, cloudPut, accOn, nameMail, get acc() { return acc; }, menuRefresh, lgShow, setPlayerName, mp, bigMapOpen, bigMapClose, bigMapTap, get wayPt() { return wayPt; }, set wayPt(v) { wayPt = v; }, wayTick, setTmSel(v) { tmSel = v; }, renderOrte, mpBinAcks, binRestore, wzReset() { wzDel0 = -1; wzT = 0; }, rkZone, rkPoint, rkMerge, rkLoad, rkBoard, rkOwners, rkMul, rkClaim, goCur, goDeliver, goNeed, get rkList() { return rkList; }, set rkList(v) { rkList = v; }, get rkPend() { return rkPend; }, renderPgRev, wzFlush, TIPS, tipTick, tipShow, tipClose, get tipCur() { return tipCur; }, lfBar, lfNewCount, get lfMode() { return lfMode; }, set lfMode(v) { lfMode = v; }, get LOFX() { return LOFX; }, setLofx, perfTick, setAutoOn, petView, petViewClose, startGhqEdit, ed, editHit, renderGhqPanel, ghqDelSel, gdUse, gpUse, gSell, gdOf, gbYield, gSellP, GHQ_DRY, GHQ_PACK, GD_TIME, drawPet, drawPet130, drawDec130, get autoLow() { return autoLow; }, get perf() { return perf; }, get DPR() { return DPR; }, fk, drawCopLights, uiDef, cleanUi, canPay, payCost, bankUp, bankLv, bankHere, busWait, pgBuyDeco, pgMoveDeco, pgRemoveDeco, hqItems, lagPut, lagTake, lagArr, donList, hqTaxi, pgAppSync, hqPick, hqDrop, get hqCarry() { return hqCarry; }, pgSet, gbUse, wzClaim, wzCur, GBEET, renderAdmErr, errLocal, pgMakeBoss, pgReqN, panicPress, panicTick, PN, PANIC_AT, panicOn, raidRun, newsIncoming, get newsCleared() { return newsCleared; }, move, LEFT_GAP, set XMIN(v) { XMIN = v; }, loadKey, lgTick, LG, lgRoll, weekNo, mstAdd, mkBuy, MK_SHOP, projBuy, PROJ, projPrice, krPrice, wageK, presStart, cheatScan, boardPut, boardLoad, get boardList() { return boardList; }, renderWoche, renderListe, renderProj, pgCreate, pgJoin, pgAccept, pgKick, pgRole, pgLeave, pgDeposit, pgUpgrade, pgPlace, pgClear, pgChat, pgRefresh, pgListLoad, get pgList() { return pgList; }, get pgang() { return pgang; }, set pgang(v) { pgang = v; }, myGid, gTag, ghqEnter, ghqLeave, ghqTarget, drawGangHQ, renderPg, setPgSeg(v) { pgSeg = v; }, GHQ_AT, GSLOT, ghqSlots, pgPrice, mpWhere, mpMapPos, pgTick, cleanPgSave: cleanGangSave, GHQ_UP, accRecover, recStore, recHas, accNewPw, accVerify, recId, recNorm, recNew, admCopy, renderPwCard, setViewBox(x0, y0, x1, y1) { viewX0 = x0; viewY0 = y0; viewX1 = x1; viewY1 = y1; }, drawWorld, withCtx(c, fn) { const s0 = ctx; try { ctx = c; fn(); } finally { ctx = s0; } } });
  requestAnimationFrame(frame);
})();
