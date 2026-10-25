  // ---------- Handy ----------
  function areaChips(b) {
    const row = document.createElement('div'); row.className = 'tmseg'; // v106: eine Zeile zum Wischen
    AREA_KEYS.forEach(k => {
      const ar = AREAS[k], c = document.createElement('button'); c.className = 'tmsg' + (G.area === k && tmSel !== 'pr' ? ' on' : '') + (isOpen(ar) ? '' : ' off');
      c.textContent = (AREA_THEME[k] ? AREA_THEME[k].ic + ' ' : '') + ar.name + (isOpen(ar) ? '' : ' 🔒');
      c.addEventListener('click', () => { G.area = k; tmSel = ''; renderPhone(); });
      row.appendChild(c);
    });
    if (G.lager && G.lager.own) { const c = document.createElement('button'); c.className = 'tmsg' + (tmSel === 'pr' ? ' on' : ''); c.textContent = '🏢 Mietraum'; c.addEventListener('click', () => { tmSel = 'pr'; renderPhone(); }); row.appendChild(c); } // v119
    b.appendChild(row);
  }
  function lockedCard(b, ar) {
    const lockedRep = G.rep < ar.needRep;
    const c = document.createElement('div'); c.className = 'card';
    c.innerHTML = '<div class="nm">' + ar.name + ' kaufen</div><div class="pr">' + fmt(ar.cost) + '</div><div class="ds">' + ar.blurb + (lockedRep ? ' Ab Ruf ' + ar.needRep + '.' : '') + '</div>';
    const btn = document.createElement('button'); btn.className = 'buy'; btn.textContent = lockedRep ? 'Gesperrt' : 'Kaufen';
    btn.disabled = lockedRep || G.money < ar.cost;
    btn.addEventListener('click', () => { if (buyArea(ar)) renderPhone(); });
    c.appendChild(btn); b.appendChild(c);
  }
  // ---------- Handy: Startbildschirm mit Apps, jede App mit eigenen Unterseiten und eigener Farbe ----------
  const IC = {orders: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="6" width="18" height="22" rx="3"/><rect x="12" y="3.5" width="8" height="5" rx="1.8" fill="#fff"/><path d="M12 15h8M12 20h8M12 24.5h4.5"/></svg>', shop: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 11h17l-1.4 15.2a2 2 0 0 1-2 1.8h-10.2a2 2 0 0 1-2-1.8L7.5 11z"/><path d="M12 14.5V9.5a4 4 0 0 1 8 0v5"/></svg>', team: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="11" r="4.2"/><path d="M3.5 27c0-5.2 3.7-8.3 8.5-8.3s8.5 3.1 8.5 8.3"/><circle cx="23" cy="12.5" r="3.2"/><path d="M21.5 19.2c4.2-.8 7.5 1.9 7.5 6.3"/></svg>', cosm: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4.5L3.5 9.5l3.2 5.2 3.3-2v15.3h12V12.7l3.3 2 3.2-5.2L21 4.5c-.9 2.3-2.8 3.4-5 3.4s-4.1-1.1-5-3.4z"/></svg>', wpn: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 27.5l1.4-4.8L22.2 6.4a3.9 3.9 0 0 1 5.5 5.5L11.3 28.1z" fill="#fff" stroke-width="1.6"/><path d="M8.2 24.6l2.6 2.6" stroke="rgba(0,0,0,.25)" stroke-width="2"/></svg>', deko: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 15.5L16 5l11.5 10.5"/><path d="M8 13v14.5h16V13"/><rect x="13.5" y="19" width="5" height="8.5" rx="1"/></svg>', karr: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3.5l3.6 7.4 8.1 1.2-5.9 5.7 1.4 8.1L16 22l-7.2 3.9 1.4-8.1-5.9-5.7 8.1-1.2z"/></svg>', goals: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5h12v8a6 6 0 0 1-12 0V5z"/><path d="M10 8H5.5v2.2a4.2 4.2 0 0 0 4.4 4.1M22 8h4.5v2.2a4.2 4.2 0 0 1-4.4 4.1"/><path d="M16 19.5V24M11 28h10"/></svg>', social: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h15a2.5 2.5 0 0 1 2.5 2.5v7A2.5 2.5 0 0 1 20 19h-7l-5 4v-4H5a2.5 2.5 0 0 1-2.5-2.5v-7A2.5 2.5 0 0 1 5 7z"/><path d="M25 12.5h.5a2.5 2.5 0 0 1 2.5 2.5v6a2.5 2.5 0 0 1-2.5 2.5H25v3.2l-4.2-3.2h-4.6"/></svg>', set: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 9h23M4.5 16h23M4.5 23h23"/><circle cx="11" cy="9" r="3" fill="#fff"/><circle cx="21" cy="16" r="3" fill="#fff"/><circle cx="13" cy="23" r="3" fill="#fff"/></svg>'};
  IC.fzg = '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="21" r="5"/><circle cx="23.5" cy="21" r="5"/><path d="M8.5 21l5-9h7l3 9M13.5 12l4.5 9M11.5 8h4M20.5 12l-1.5-4h3"/></svg>';
  IC.dshop = '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7.5 11h17l-1.6 15a2 2 0 0 1-2 1.8H11.1a2 2 0 0 1-2-1.8z"/><path d="M12 11V9a4 4 0 0 1 8 0v2"/><path d="M16 16.5v6M13 19.5h6"/></svg>';
  IC.haus = '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 15L16 5l11.5 10"/><path d="M8 13v14h16V13"/><path d="M13 27v-8h6v8"/></svg>';
  IC.ruf = '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4l3.6 7.4 8.1 1.1-5.9 5.7 1.4 8.1L16 22.4l-7.2 3.9 1.4-8.1-5.9-5.7 8.1-1.1z"/></svg>'; // v86: eigene Ruf-App
  // v95: Apps neu sortiert: 8 statt 14, Verwandtes in einer App mit Kategorien
  const APPS = [
    { id: 'adm', name: 'Admin', sub: 'Nur für dich', ic: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"><path d="M16 3.5l10 4v8c0 6.5-4.3 11-10 13-5.7-2-10-6.5-10-13v-8z"/><path d="M11.5 16l3.2 3.2 6-6.4" stroke-linecap="round"/></svg>', c: '#FF6B6B', c2: '#B32D3A', tabs: [['admin', 'Spieler'], ['admtool', 'Werkzeuge'], ['admtroll', 'Troll'], ['admerr', 'Fehler']] },
    { id: 'orders', name: 'Aufträge', sub: 'Kunden', ic: IC.orders, c: '#FFB547', c2: '#E8861F', tabs: [['orders', 'Offen']] },
    { id: 'biz', name: 'Geschäft', sub: 'Ausbau & Team', ic: IC.shop, c: '#63C174', c2: '#2F8F4A', tabs: [['shop', 'Ausbau'], ['team', 'Anheuern'], ['crew', 'Mitarbeiter']] },
    { id: 'karr', name: 'Karriere', sub: 'Ruf & Quests', ic: IC.karr, c: '#FFD24A', c2: '#C4851A', tabs: [['ruf', 'Ruf'], ['woche', 'Woche'], ['quests', 'Quests'], ['liste', 'Bestenliste'], ['goals', 'Ziele'], ['welt', 'Jahreszeit']] },
    { id: 'cosm', name: 'Style', sub: 'Look & Begleiter', ic: IC.cosm, c: '#FF8FD0', c2: '#C44F96', tabs: [['kopf', 'Kopf'], ['figur', 'Figur'], ['kleid', 'Kleidung'], ['shoes', 'Schuhe'], ['ruecken', 'Rücken'], ['kost', 'Kostüme'], ['pets', 'Begleiter'], ['aura', 'Effekte']] },
    { id: 'gear', name: 'Ausrüstung', sub: 'Rucksack, Rad, Waffen', ic: IC.fzg, c: '#6EE0A0', c2: '#2F9A6A', tabs: [['gearup', 'Für dich'], ['veh', 'Fahrzeuge'], ['wpn', 'Waffen']] },
    { id: 'wohn', name: 'Wohnen', sub: 'Deko & Häuser', ic: IC.deko, c: '#D9A066', c2: '#9A6A3C', tabs: [['deko', 'Einrichten'], ['dshop', 'Deko-Laden'], ['hmine', 'Meine Häuser'], ['hnbr', 'Nachbarn']] },
    { id: 'gang', name: 'Gang', sub: 'Deine Gang', ic: '<span class="gic">🏴</span>', c: '#FF5C7A', c2: '#A8243F', tabs: [['g_info', 'Übersicht'], ['g_chat', 'Chat'], ['g_mem', 'Mitglieder'], ['g_hq', 'HQ'], ['g_rev', 'Revier'], ['g_deko', 'Einrichten'], ['g_set', 'Einstellungen']] },
    { id: 'social', name: 'Freunde', sub: 'Online, Gang & Chat', ic: IC.social, c: '#7FD0C8', c2: '#2F9A92', tabs: [['friends', 'Spieler'], ['gang', 'Gang'], ['group', 'Online']] },
    { id: 'stadt', name: 'Stadt', sub: 'Orte & Projekte', ic: '<svg viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M16 28s-9-8.2-9-15a9 9 0 0 1 18 0c0 6.8-9 15-9 15z"/><circle cx="16" cy="13" r="3.4" fill="#fff"/></svg>', c: '#FF7AB6', c2: '#C2407F', tabs: [['orte', 'Orte'], ['proj', 'Projekte']] },
    { id: 'set', name: 'Einstellungen', sub: 'Anzeige & Ton', ic: IC.set, c: '#AAB6C6', c2: '#6B778A', tabs: [['profil', 'Profil'], ['view', 'Anzeige'], ['hudset', 'Steuerung'], ['sound', 'Ton'], ['system', 'Hilfe']] }
  ];
  const appOf = t => t === 'style' || t === 'wear' ? APPS.find(a => a.id === 'cosm') : APPS.find(a => a.tabs.some(x => x[0] === t));
  const AREA_THEME = { keller: { c: '#63C174', ic: '🌿', tag: 'Dein Keller: hell, grün und gemütlich' }, tabak: { c: '#7FD0C8', ic: '🍂', tag: 'Die Tabakfarm: Päckchen für Kenner' }, brau: { c: '#5BC0EB', ic: '⚗️', tag: 'Das Chemielabor: funkelnde Fantasie-Kristalle' } };
  function areaBanner(b, ar) {
    const th = AREA_THEME[ar.key] || AREA_THEME.keller, st = S(ar), c = document.createElement('div'); c.className = 'card banner';
    c.style.cssText = 'grid-template-columns:auto 1fr;background:linear-gradient(135deg,' + th.c + '33,' + th.c + '0D);border-left:4px solid ' + th.c;
    const open = isOpen(ar);
    c.innerHTML = '<div style="font-size:30px;grid-row:1/span 2">' + th.ic + '</div><div class="nm">' + ar.name + '</div><div class="ds" style="grid-column:2">' + th.tag + (open ? ' · ' + potsOpen(ar) + ' Töpfe' : ' · gesperrt') + '</div>';
    b.appendChild(c);
  }
  function renderSound(b) {
    const mk = (tag, txt) => { const e = document.createElement(tag); if (txt) e.textContent = txt; return e; };
    const hd = mk('div', 'Ton'); hd.className = 'grp'; b.appendChild(hd);
    const card = mk('div'); card.className = 'card look'; card.style.display = 'block';
    const mute = mk('button', muted ? 'Ton ist aus – tippen zum Einschalten' : 'Alles stumm schalten'); mute.className = 'buy' + (muted ? '' : ' alt'); mute.style.cssText = 'width:100%;margin-bottom:10px';
    mute.addEventListener('click', () => { setMuted(!muted); unlock(); if (phoneOpen && tab === 'sound') renderPhone(); });
    card.appendChild(mute);
    const mkSlider = (label, key) => {
      const row = mk('label'); row.className = 'sl'; const nm = mk('span', label), val = mk('b', Math.round(aud[key] * 100) + ' %'), inp = mk('input');
      inp.type = 'range'; inp.min = '0'; inp.max = '100'; inp.step = '1'; inp.value = String(Math.round(aud[key] * 100));
      inp.addEventListener('input', () => { aud[key] = Math.min(1, Math.max(0, (+inp.value || 0) / 100)); val.textContent = Math.round(aud[key] * 100) + ' %'; audApply(); });
      inp.addEventListener('change', () => { audSave(); if (key === 's') sfx.cash(); });
      row.appendChild(nm); row.appendChild(inp); row.appendChild(val); card.appendChild(row);
    };
    mkSlider('Gesamt', 'm'); mkSlider('Effekte', 's'); mkSlider('Musik', 'u');
    const note = mk('div', 'Die Hintergrundmusik ist ruhig und spielt nur im Spiel. Stumm schaltet Effekte und Musik gleichzeitig.'); note.className = 'ds'; note.style.marginTop = '6px'; card.appendChild(note);
    b.appendChild(card);
    const hd2 = mk('div', 'Vibration'); hd2.className = 'grp'; b.appendChild(hd2);
    const c2 = mk('div'); c2.className = 'card look'; c2.style.display = 'block';
    const vb = mk('button', 'Vibration bei Festnahme: ' + (aud.v ? 'an' : 'aus')); vb.className = 'buy' + (aud.v ? '' : ' alt'); vb.style.cssText = 'width:100%';
    vb.addEventListener('click', () => { aud.v = !aud.v; audSave(); if (aud.v) vibrate(60); renderPhone(); });
    const vn = mk('div', 'Das Handy vibriert kurz, wenn dich die Polizei erwischt oder ein Streifenwagen. Das geht nur auf Geräten, die Vibration im Browser erlauben (Android ja, iPhone/Safari leider nicht).'); vn.className = 'ds'; vn.style.marginTop = '6px';
    c2.appendChild(vb); c2.appendChild(vn); b.appendChild(c2);
  }
  // v86: Abzeichen an der Ruf-App, wenn du eine neue Rufstufe erreicht hast und die App noch nicht geoeffnet hast (nur zur Laufzeit, nichts wird gespeichert)
  let rufSeen = -1, rufSeenG = null;
  function rufUnseen() { if (!G) return false; const t = KR().tier; if (rufSeenG !== G) { rufSeenG = G; rufSeen = t; } return t > rufSeen; }
  function renderHome(b) {
    // v95: Startseite mit Statuskarte und 8 Apps
    const k = G.kr ? KR() : null, T0 = k ? TIERS[k.tier - 1] : null, T1 = k ? TIERS[k.tier] : null, s = season ? season() : null;
    const hc = document.createElement('div'); hc.className = 'homecard';
    const hh = String(Math.floor(G.time / 60)).padStart(2, '0') + ':' + String(Math.floor(G.time % 60)).padStart(2, '0');
    const pr = T1 ? Math.max(0, Math.min(1, (G.rep - T0.rep) / Math.max(1, T1.rep - T0.rep))) : 1;
    hc.innerHTML = '<div class="hc-top"><div class="hc-time">' + hh + '</div><div class="hc-day">Tag ' + G.day + (s && !KR_NEUTRAL ? ' · ' + s.ic + ' ' + s.name : '') + (amb.rain > 0.5 ? ' · 🌧' : '') + '</div></div>'
      + '<div class="hc-row"><div><span>Bargeld</span><b class="am">' + fmt(G.money) + '</b></div><div class="hc-go" data-go="bank"><span>Konto ›</span><b>' + fmt(G.bank || 0) + '</b></div><div><span>Umsatz</span><b>' + fmt(G.earned) + '</b></div></div>'
      + (T0 ? '<div class="hc-tier"><span>★ ' + T0.name + ' · Ruf ' + G.rep + '</span><i><u style="width:' + Math.round(pr * 100) + '%"></u></i>' + (T1 ? '<em>nächste Stufe: ' + T1.name + ' ab Ruf ' + T1.rep + '</em>' : '<em>höchste Stufe erreicht</em>') + '</div>' : '');
    b.appendChild(hc); try { hc.querySelector('[data-go=bank]').addEventListener('click', () => { tab = 'bank'; renderPhone(); }); } catch (e) {}
    const g = document.createElement('div'); g.className = 'apps';
    const badge = id => id === 'karr' ? (rufUnseen() ? '!' : ACH.filter(achReady).length) : id === 'orders' ? G.orders.filter(o => !o.remote).length : id === 'social' ? (mp.on ? Object.keys(mp.friends).length : 0) : id === 'gang' ? (pgReqN() ? '🙋' + pgReqN() : pgUnread() || 0) : 0;
    const subOf = a => a.id === 'gang' ? (pgang ? Object.keys(pgang.mem).length + ' Mitglieder' : 'Deine Gang') : a.id === 'orders' ? (G.orders.length ? G.orders.length + ' offen' : 'keine offen') : a.id === 'biz' ? staffN() + ' Helfer' : a.id === 'karr' ? 'Ruf ' + G.rep : a.sub;
    pgAppSync(); for (const a of APPS.filter(a => (a.id !== 'adm' || isAdm()) && (a.id !== 'gang' || pgMember()))) {
      const t = document.createElement('button'); t.className = 'app' + (a.id === 'adm' ? ' adm' : ''); const n = badge(a.id);
      t.innerHTML = '<i style="background:linear-gradient(155deg,' + a.c + ',' + a.c2 + ')">' + a.ic + (n ? '<u>' + n + '</u>' : '') + '</i><span>' + a.name + '</span><small>' + subOf(a) + '</small>';
      t.addEventListener('click', () => { tab = a.tabs[0][0]; renderPhone(); });
      g.appendChild(t);
    }
    b.appendChild(g);
  }
  // v78: Kategorie-Leiste im Handy seitlich scrollbar (Finger, Mausrad, Ziehen mit der Maus)
  let tabDrag = false;
  function tabFade() { const t = $('phTabs'); if (!t) return; const m = t.scrollWidth - t.clientWidth; t.classList.toggle('ml', m > 2 && t.scrollLeft > 2); t.classList.toggle('mr', m > 2 && t.scrollLeft < m - 2); }
  (function initTabScroll() {
    const t = $('phTabs'); if (!t || !t.addEventListener) return;
    t.addEventListener('scroll', tabFade, { passive: true });
    t.addEventListener('wheel', e => { if (t.scrollWidth <= t.clientWidth) return; const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; t.scrollLeft += d; e.preventDefault(); }, { passive: false });
    let sx = 0, sl = 0, down = false;
    t.addEventListener('mousedown', e => { down = true; tabDrag = false; sx = e.clientX; sl = t.scrollLeft; });
    window.addEventListener('mousemove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 6) tabDrag = true; if (tabDrag) { t.style.scrollBehavior = 'auto'; t.scrollLeft = sl - dx; } });
    window.addEventListener('mouseup', () => { if (!down) return; down = false; t.style.scrollBehavior = ''; setTimeout(() => { tabDrag = false; }, 0); });
    window.addEventListener('resize', tabFade);
  })();
  function renderNav() {
    const ph = $('phone'), home = tab === 'home', app = home ? null : appOf(tab), tabs = $('phTabs');
    let col = app ? app.c : '#FFB547';
    if (app && app.id === 'biz') col = (AREA_THEME[G.area] || AREA_THEME.keller).c;
    ph.style.cssText = '--acc:' + col;
    $('phBack').hidden = home; try { $('phBack2').hidden = home; } catch (e) {} $('phTitle').innerHTML = home ? 'Handy' : (app ? '<span class="ti">' + app.ic + '</span>' + app.name : tab === 'kiosk' ? 'Kiosk im Stadtpark' : tab === 'lager' ? 'Mietraum' : tab === 'apo' ? 'Apotheke' : tab === 'prvisit' ? 'Besucher-Feld' : tab === 'autohof' ? 'Autohof' : tab === 'werk' ? 'Autowerkstatt' : tab === 'gym' ? 'Iron Gym' : tab === 'makler' ? 'Immobilien Krämer' : tab === 'bus' ? 'Buslinie K' : tab === 'biz' ? 'Tresor im Hinterzimmer' : tab === 'bshelf' ? 'Regal im Hinterzimmer' : tab === 'raid' ? 'Razzia!' : tab === 'bank' ? 'Stadtsparkasse' : tab === 'pizza' ? 'Pizzeria Bella Notte' : tab === 'club' ? 'Neon Club' : tab === 'gv' ? 'Gangviertel' : tab === 'talk' ? (CHAR_BY[ktalk.id] || { name: 'Gespräch' }).name : tab === 'stairs' ? 'Treppe' : 'Handy');
    const keepX = tabs.dataset.app === (app ? app.id : '') ? tabs.scrollLeft : 0; // v78: Wischposition beim Neuzeichnen behalten
    tabs.innerHTML = ''; tabs.dataset.app = app ? app.id : '';
    if (app && app.tabs.length > 1) {
      tabs.hidden = false; const cur = tab === 'style' ? 'figur' : tab === 'wear' ? 'kleid' : tab; let onT = null;
      for (const [id, nm] of app.tabs) { const t = document.createElement('button'); t.className = 'tab' + (id === cur ? ' on' : ''); if (id === cur) onT = t; t.textContent = nm + (id === 'g_mem' && pgReqN() ? ' (' + pgReqN() + ')' : id === 'g_chat' && pgUnread() ? ' (' + pgUnread() + ')' : ''); t.addEventListener('click', () => { if (tabDrag) return; tab = id; renderPhone(); }); tabs.appendChild(t); }
      tabs.style.scrollBehavior = 'auto'; tabs.scrollLeft = keepX;
      if (onT) { const l = onT.offsetLeft - tabs.offsetLeft, r = l + onT.offsetWidth; if (l < tabs.scrollLeft) tabs.scrollLeft = l - 24; else if (r > tabs.scrollLeft + tabs.clientWidth) tabs.scrollLeft = r - tabs.clientWidth + 24; }
      tabs.style.scrollBehavior = ''; tabFade();
    } else tabs.hidden = true;
  }
  function upCard(b, u) { // v95: auch fuer Ausruestung
        const ref = upRef(u), lv = ref[u.id], maxed = lv >= u.max, cost = u.cost(lv);
        const c = document.createElement('div'); c.className = 'card';
        c.innerHTML = '<div class="nm">' + u.name + ' <span style="color:var(--muted);font-weight:600">Stufe ' + lv + '/' + u.max + '</span></div><div class="pr">' + (maxed ? 'max' : fmt(cost)) + '</div><div class="ds">' + u.desc + '</div>';
        const btn = document.createElement('button'); btn.className = 'buy'; btn.textContent = maxed ? 'Fertig' : 'Kaufen'; btn.disabled = maxed || G.money < cost;
        btn.addEventListener('click', () => { if (ref[u.id] < u.max && G.money >= u.cost(ref[u.id])) { G.money -= u.cost(ref[u.id]); ref[u.id]++; sfx.buy(); save(); renderPhone(); } });
        c.appendChild(btn); b.appendChild(c);
  }
  function renderPhone() {
    if (lfTab !== tab) { lfFlush(); lfTab = tab; lfQ = ''; } // v128: angesehene Neuheiten merken, Suche beim Tab-Wechsel leeren
    $('phMoney').textContent = fmt(G.money);
    renderNav();
    const b = $('phBody'); b.innerHTML = '';
    if (tab === 'home') { renderHome(b); return; }
    if (tab === 'orders') {
      const gcn = gangCards(b);
      if (!G.orders.length) { if (!gcn) b.innerHTML = '<div class="empty">Gerade keine Aufträge. Neue kommen von selbst. Je höher dein Ruf, desto mehr Kunden und bessere Preise.</div>'; return; }
      for (const o of G.orders) {
        const h = HOUSES[o.house], op = orderPos(o), dist = Math.round(Math.hypot(player.x - op.x, player.y - op.y) / 10), unit = AREAS[o.prod || 'keller'].lbl.unit;
        const c = document.createElement('div'); c.className = 'card';
        c.innerHTML = '<div class="nm">' + h.name + ' · ' + o.qty + ' ' + unit + (o.mob ? ' · unterwegs' : '') + (o.remote ? ' · Kunde von ' + ((mp.friends[o.remote] || {}).name || 'Freund') : '') + '</div><div class="pr">' + fmt(o.price) + '</div><div class="ds">' + dist + ' m entfernt · läuft in ' + Math.ceil(o.t) + ' s ab</div><div class="bar"><i style="width:' + Math.round(o.t / o.tmax * 100) + '%"></i></div>';
        b.appendChild(c);
      }
    } else if (tab === 'shop') {
      areaChips(b);
      if (tmSel === 'pr' && G.lager && G.lager.own) { // v119: Mietraum-Ausbau auch hier, nicht nur am Regal
        const L = G.lager, uc = LAGER_UP[L.lv], c = uiEl('div', 'card'); c.appendChild(uiEl('div', 'nm', '🏢 Lager-Regal · Stufe ' + (L.lv + 1))); c.appendChild(uiEl('div', 'pr', uc === undefined ? 'max' : fmt(uc))); c.appendChild(uiEl('div', 'ds', 'Platz im Lager: ' + lagerCap() + '. Ein neues Regal bringt +150 Plätze.'));
        const bt = uiEl('button', 'buy', uc === undefined ? 'Fertig' : 'Ausbauen'); bt.disabled = uc === undefined || G.money < uc; bt.addEventListener('click', () => { if (upLager()) renderPhone(); }); c.appendChild(bt); b.appendChild(c);
        renderPrShop(b); const e = uiEl('div', 'ds', 'Ware ein- und auslagern geht nur direkt am Regal im Mietraum.'); e.style.margin = '6px 2px'; b.appendChild(e); return;
      }
      const ar = AREAS[G.area]; areaBanner(b, ar);
      if (!isOpen(ar)) { lockedCard(b, ar); return; }
      if (ar.key === 'keller') panicCard(b); // v122
      const addUp = u => upCard(b, u);
      const ah = document.createElement('div'); ah.className = 'grp'; ah.textContent = 'Gebiet: ' + ar.name; b.appendChild(ah);
      UPS.filter(u => u.area === G.area && u.id !== 'pots').forEach(addUp); // v54: Toepfe kauft man am schwarzen Platz
      { const e = document.createElement('div'); e.className = 'ds'; e.style.margin = '2px 0 6px'; e.textContent = 'Neue Töpfe kaufst du direkt im Raum: an einen schwarzen Platz stellen und A drücken.'; b.appendChild(e); }
      { const e = document.createElement('div'); e.className = 'ds'; e.style.margin = '6px 2px'; e.textContent = 'Rucksack, Schuhe und andere Sachen für dich findest du jetzt in der App Ausrüstung.'; b.appendChild(e); }
    } else if (tab === 'gearup') { // v95
      const gh = document.createElement('div'); gh.className = 'grp'; gh.textContent = 'Für dich: Rucksack, Schuhe und mehr'; b.appendChild(gh);
      UPS.filter(u => u.area === 'all').forEach(u => upCard(b, u));
    } else if (tab === 'kiosk') {
      renderKiosk(b);
    } else if (tab === 'lager') {
      renderLager(b);
    } else if (tab === 'apo') { renderApo(b);
    } else if (tab === 'prvisit') { renderPrVisit(b);
    } else if (tab === 'autohof') {
      renderAutohof(b);
    } else if (tab === 'werk') {
      renderWerk(b);
    } else if (tab === 'bus') { renderBus(b);
    } else if (tab === 'makler') { renderMakler(b);
    } else if (tab === 'biz') { renderBiz(b);
    } else if (tab === 'bshelf') { renderBizShelf(b);
    } else if (tab === 'raid') { renderRaid(b);
    } else if (tab === 'gym') { renderGym(b);
    } else if (tab === 'bank') { renderBank(b);
    } else if (tab === 'pizza') { renderPizza(b);
    } else if (tab === 'club') { renderClub(b);
    } else if (tab === 'gv') {
      renderGV(b);
    } else if (tab === 'wpn') {
      renderWpn(b);
    } else if (tab === 'goals') {
      renderGoals(b);
    } else if (pgIsApp(tab)) {
      renderPg(b, PG_TABS[tab], true);
    } else if (tab === 'admerr') {
      renderAdmErr(b);
    } else if (tab === 'gang') {
      renderPg(b);
    } else if (tab === 'woche') {
      renderWoche(b);
    } else if (tab === 'liste') {
      renderListe(b);
    } else if (tab === 'proj') {
      renderProj(b);
    } else if (tab === 'group') {
      renderGroup(b);
    } else if (tab === 'sound') {
      renderSound(b);
    } else if (tab === 'hudset') {
      renderHudSet(b);
    } else if (tab === 'profil') {
      renderProfile(b);
    } else if (tab === 'admin') {
      renderAdmin(b);
    } else if (tab === 'orte') {
      renderOrte(b);
    } else if (tab === 'admtool') {
      renderAdmTool(b);
    } else if (tab === 'admtroll') {
      renderAdmTroll(b);
    } else if (tab === 'kopf' || tab === 'figur' || tab === 'pets' || tab === 'aura' || tab === 'view' || tab === 'system') {
      renderStyle(b, tab);
    } else if (tab === 'kleid' || tab === 'kost' || tab === 'shoes' || tab === 'ruecken') {
      renderWear(b, tab);
    } else if (tab === 'wear') {
      renderWear(b);
    } else if (tab === 'veh') {
      renderVeh(b);
    } else if (tab === 'dshop') {
      renderDShop(b);
    } else if (tab === 'hmine') {
      renderHMine(b);
    } else if (tab === 'hnbr') {
      renderHNbr(b);
    } else if (tab === 'friends') {
      renderFriendsTab(b);
    } else if (tab === 'ruf') { renderRuf(b);
    } else if (tab === 'quests') { renderQuests(b);
    } else if (tab === 'welt') { renderWelt(b);
    } else if (tab === 'crew') { renderCrew(b);
    } else if (tab === 'talk') { renderTalk(b);
    } else if (tab === 'team') { renderTeam(b);
    } else if (tab === 'deko') { renderDeko(b); } else { renderStyle(b); }
  }
  function buySide(ar) {
    if (!isOpen(ar) || G.build.door[ar.key] || G.money < ar.sideCost) return false;
    G.money -= ar.sideCost; G.build.door[ar.key] = true; syncGate(); sfx.buy(); save(); return true;
  }
  function setFloor(ak, c, pat) {
    const f = G.build.floor[ak]; if (c !== null && c >= 0 && c < FLOOR_COLORS.length) f.c = c; if (pat !== null && pat >= 0 && pat < FLOOR_PATS.length) f.p = pat;
    sfx.put(); save();
  }
  // Kleidung kaufen und anlegen
  // ---------- Ziele (v43): Fortschritt aus Zählern, Belohnung per Hand abholen ----------
  const upLevels = () => Object.values(G.up).reduce((a, b) => a + b, 0) + Object.values(G.t.up).reduce((a, b) => a + b, 0) + Object.values(G.b.up).reduce((a, b) => a + b, 0);
  const ACH = [
    { id: 'd1', name: 'Erste Lieferung', desc: '1 Kunden beliefern', t: 1, v: () => G.stat.del, cash: 100 },
    { id: 'd50', name: 'Stammlieferant', desc: '50 Lieferungen', t: 50, v: () => G.stat.del, cash: 1000 },
    { id: 'd250', name: 'Quartiersbekannt', desc: '250 Lieferungen', t: 250, v: () => G.stat.del, wear: 'sun' },
    { id: 'd1000', name: 'Lieferkönig', desc: '1.000 Lieferungen', t: 1000, v: () => G.stat.del, wear: 'gold' },
    { id: 'r25', name: 'Guter Ruf', desc: 'Ruf 25 erreichen', t: 25, v: () => G.rep, cash: 3000 },
    { id: 'r60', name: 'Stadtbekannt', desc: 'Ruf 60 erreichen', t: 60, v: () => G.rep, wear: 'aqua' },
    { id: 'r100', name: 'Legende der Straße', desc: 'Ruf 100 erreichen', t: 100, v: () => G.rep, wear: 'neon' },
    { id: 'r150', name: 'Neuanfang', desc: 'Das erste Prestige abschließen', t: 1, v: () => G.prest || 0, wear: 'void' },
    { id: 'p5', name: 'Halbe Ewigkeit', desc: 'Prestige 5 erreichen', t: 5, v: () => G.prest || 0, cash: 50000 },
    { id: 'p10', name: 'Unsterblich', desc: 'Prestige 10 erreichen', t: 10, v: () => G.prest || 0, cash: 250000 },
    { id: 'e500k', name: 'Halbe Million', desc: '500.000 € Umsatz', t: 500000, v: () => G.earned, cash: 25000 },
    { id: 'e2m', name: 'Zwei Millionen', desc: '2.000.000 € Umsatz', t: 2000000, v: () => G.earned, wear: 'royal' },
    { id: 'e10m', name: 'Zehn Millionen', desc: '10.000.000 € Umsatz', t: 10000000, v: () => G.earned, wear: 'plasma' },
    { id: 'day10', name: 'Durchgehalten', desc: 'Tag 10 erleben', t: 10, v: () => G.day, cash: 500 },
    { id: 'day50', name: 'Langzeitplan', desc: 'Tag 50 erleben', t: 50, v: () => G.day, cash: 15000 },
    { id: 'vip50', name: 'Hofstaat', desc: '50 Spezialkunden beliefern', t: 50, v: () => G.stat.vip, wear: 'goldshoe' },
    { id: 'day100', name: 'Hundert Tage', desc: 'Tag 100 erleben', t: 100, v: () => G.day, wear: 'halo' },
    { id: 'vip10', name: 'Feine Kundschaft', desc: '10 Spezialkunden beliefern', t: 10, v: () => G.stat.vip, cash: 5000 },
    { id: 'ko10', name: 'Streifenschreck', desc: 'Die Polizei 10 Mal K.O. schlagen', t: 10, v: () => G.stat.ko, cash: 2500 },
    { id: 'car3', name: 'Zur falschen Zeit', desc: '3 Mal vom Streifenwagen umgefahren werden', t: 3, v: () => G.stat.car, cash: 300 },
    { id: 'upg100', name: 'Tüftler', desc: '100 Verbesserungsstufen kaufen', t: 100, v: () => upLevels(), cash: 8000 },
    { id: 'staff', name: 'Eigenes Team', desc: '10 Helfer anheuern', t: 10, v: () => Object.values(G.staff).reduce((a, b) => a + b, 0), cash: 6000 },
    { id: 'areas', name: 'Imperium', desc: 'Tabakscheune und Chemielabor besitzen', t: 2, v: () => (G.t.unlocked ? 1 : 0) + (G.b.unlocked ? 1 : 0), cash: 20000 },
    { id: 'gv50', name: 'Großabnehmer', desc: '50 Einheiten an Gangs verkaufen', t: 50, v: () => G.stat.gv, cash: 4000 },
    { id: 'gb5', name: 'Gangschreck', desc: '5 Gangs in die Flucht schlagen', t: 5, v: () => G.stat.gb, cash: 3500 },
    { id: 'gb25', name: 'Herr der Gehwege', desc: '25 Gangs in die Flucht schlagen', t: 25, v: () => G.stat.gb, cash: 20000 }
  ];
  const achDone = a => !!G.ach.done[a.id], achReady = a => !achDone(a) && a.v() >= a.t;
  function claimAch(id) {
    const a = ACH.find(x => x.id === id); if (!a || !G || !achReady(a)) return false;
    G.ach.done[id] = true;
    if (a.cash) { G.money += a.cash; msg('Ziel „' + a.name + '“: +' + fmt(a.cash)); }
    if (a.wear && WEAR_BY[a.wear]) { G.wear.owned[a.wear] = true; msg('Ziel „' + a.name + '“: ' + WEAR_BY[a.wear].name + ' freigeschaltet'); }
    sfx.cash(); save(); return true;
  }
  let achSeen = {}, achT = 0;
  function achTick(dt) {
    achT -= dt; if (achT > 0) return; achT = 1;
    for (const a of ACH) if (!achDone(a) && !achSeen[a.id] && a.v() >= a.t) { achSeen[a.id] = 1; msg('🏆 Ziel geschafft: ' + a.name, false, 'gold'); } // v111: kurz, abholen im Handy unter Ziele
  }

  function renderGoals(b) {
    const todo = ACH.filter(a => !achDone(a)).length, rd = ACH.filter(achReady).length;
    const info = document.createElement('div'); info.className = 'ds'; info.style.margin = '0 0 6px';
    info.textContent = rd ? rd + ' Ziel(e) bereit zum Abholen!' : todo ? 'Noch ' + todo + ' Ziele offen. Belohnungen: Geld sowie Auren und Kostüme, die es nirgends zu kaufen gibt.' : 'Alle Ziele erledigt. Stark!'; b.appendChild(info);
    const order = ACH.slice().sort((x, y) => (achDone(x) - achDone(y)) || (achReady(y) - achReady(x)));
    for (const a of order) {
      const done = achDone(a), ready = achReady(a), v = Math.min(a.t, Math.max(0, Math.floor(a.v())));
      const c = document.createElement('div'); c.className = 'card';
      const rw = (a.cash ? fmt(a.cash) : '') + (a.wear && WEAR_BY[a.wear] ? (a.cash ? ' + ' : '') + WEAR_BY[a.wear].name : '');
      c.innerHTML = '<div class="nm">' + a.name + (done ? ' <span style="color:var(--green);font-weight:700">erledigt</span>' : '') + '</div><div class="pr">' + rw + '</div><div class="ds">' + a.desc + ' · ' + (a.t >= 1000 ? v.toLocaleString('de-DE') + ' / ' + a.t.toLocaleString('de-DE') : v + ' / ' + a.t) + '</div><div class="bar"><i style="width:' + Math.round(100 * v / a.t) + '%"></i></div>';
      const btn = document.createElement('button'); btn.className = 'buy'; btn.textContent = done ? 'Erledigt' : ready ? 'Abholen' : 'Offen'; btn.disabled = done || !ready;
      btn.addEventListener('click', () => { if (claimAch(a.id)) renderPhone(); });
      c.appendChild(btn); b.appendChild(c);
    }
  }
  const WEAR_KEY = { top: 'top', bot: 'bot', hat: 'hat', cos: 'cos', aura: 'aura', shoe: 'shoe', band: 'bnd', back: 'back' };
  const wearOwned = id => { const w = WEAR_BY[id]; return !!w && (w.cost === 0 || !!(G.wear && G.wear.owned[id])); };
  function fixWear() { for (const k of Object.keys(WEAR_DEF)) { const id = G.look[k], w = WEAR_BY[id]; if (id !== 'none' && w && !wearOwned(id)) G.look[k] = WEAR_DEF[k]; } }
  function equipWear(id) {
    const w = WEAR_BY[id]; if (!w || !wearOwned(id)) return false;
    const k = WEAR_KEY[w.slot], off = w.slot === 'cos' || w.slot === 'aura' || w.slot === 'hat' || w.slot === 'band' || w.slot === 'back';
    G.look[k] = G.look[k] === id && off ? WEAR_DEF[k] : id; save(); return true;
  }
  function buyWear(id, viaKiosk) {
    const w = WEAR_BY[id]; if (!w || w.ach || w.qx || (w.kiosk && !viaKiosk) || w.cost === 0 || G.wear.owned[id] || G.money < w.cost || G.rep < w.rep) return false;
    G.money -= w.cost; G.wear.owned[id] = true; G.look[WEAR_KEY[w.slot]] = id; sfx.buy(); save(); return true;
  }
  // v128: Kurze Tipps genau dann, wenn etwas Neues freigeschaltet wird (statt langer Einführung). Jeder Tipp kommt nur einmal.
  const way = (at, nm) => () => { wayPt = { x: at.x, y: at.y }; msg('📍 Wegpunkt: ' + nm); };
  const goTab = (t, f) => () => { openPhone(); if (f) f(); tab = t; renderPhone(); };
  const TIPS = [
    { id: 'bank', ok: () => G.rep >= BANK_LV[0].rep, t: '🏦 Die Bank kennt dich jetzt', d: 'Geld auf dem Konto bringt jeden Tag Zinsen und ist bei einer Razzia sicher.', go: way(BANK_AT, 'Bank') },
    { id: 'gang', ok: () => G.rep >= PG_REP && !myGid(), t: '🏴 Eigene Gang', d: 'Ab jetzt kannst du mit Freunden eine Gang gründen: gemeinsames HQ, Kasse und Chat.', go: goTab('gang') },
    { id: 'lager', ok: () => G.rep >= LAGER_REP && !(G.lager && G.lager.own), t: '🏢 Mietraum frei', d: 'Im Gewerbegebiet kannst du einen Lagerraum mieten. Was dort liegt, findet die Polizei nicht.', go: way(LAGER_AT, 'Lager-Tor') },
    { id: 'pizza', ok: () => G.rep >= BIZ.pizza.rep && !(G.biz.pizza && G.biz.pizza.own), t: '🍕 Pizzeria zu verkaufen', d: 'Ein eigenes Geschäft wäscht dein Bargeld und bringt einen Vorteil.', go: way(PIZZA_AT, 'Pizzeria') },
    { id: 'gv', ok: () => G.rep >= GV_REP, t: '🕶️ Hehler im Gangviertel', d: 'Der Hehler kauft dir Ware in großen Mengen ab, der Preis schwankt.', go: way(GV_AT, 'Hehler') },
    { id: 'tabak', ok: () => G.rep >= AREAS.tabak.needRep && !isOpen(AREAS.tabak), t: '🍂 Die Scheune ist frei', d: 'Mit der Tabakfarm bestellen die Kunden auch Päckchen.', go: goTab('hmine') },
    { id: 'gym', ok: () => G.rep >= BIZ.gym.rep && !(G.biz.gym && G.biz.gym.own), t: '🏋️ Iron Gym zu verkaufen', d: 'Das nächste Geschäft für dein Bargeld.', go: way(GYM_AT, 'Iron Gym') },
    { id: 'club', ok: () => G.rep >= BIZ.club.rep && !(G.biz.club && G.biz.club.own), t: '🪩 Neon Club zu verkaufen', d: 'Das größte Geschäft der Stadt, mit Club-Lieferungen in der Nacht.', go: way(CLUB_AT, 'Neon Club') },
    { id: 'brau', ok: () => G.rep >= AREAS.brau.needRep && !isOpen(AREAS.brau), t: '⚗️ Chemielabor frei', d: 'Dein drittes Haus. Rein fiktive Ware, neue Kunden.', go: goTab('hmine') },
    { id: 'heat', ok: () => (G.heat || 0) >= 35, t: '🔴 Die Polizei wird aufmerksam', d: 'Droht eine Razzia, drück den roten Notknopf im Keller: deine Helfer räumen alles raus.', go: way(PANIC_AT, 'Notknopf') },
    { id: 'woche', ok: () => G.rep >= 30, t: '🎟️ Wochenziele', d: 'Jede Woche gibt es neue Ziele mit Geld und Marken. Unter Karriere → Woche.', go: goTab('woche') },
    { id: 'pres', ok: () => presCan(), t: '✦ Neustart mit Bonus möglich', d: 'Du hast Ruf 100. Unter Karriere → Ruf kannst du mit dauerhaftem Bonus neu anfangen.', go: goTab('ruf') },
    { id: () => 'nw' + Math.floor(G.rep / 10), ok: () => lfNewCount(['w', 'c']) >= 3, t: '👕 Neue Kleidung und Effekte', d: 'Mit deinem Ruf ist neues Zeug freigeschaltet.', go: goTab('kleid', () => { lfMode = 'new'; }) },
    { id: () => 'nd' + Math.floor(G.rep / 10), ok: () => lfNewCount(['d']) >= 3, t: '🪴 Neue Deko im Laden', d: 'Schau im Deko-Laden, was neu dazugekommen ist.', go: goTab('dshop', () => { lfMode = 'new'; }) }
  ];
  let tipT = 3, tipCur = null, tipHide = 0;
  const tipId = t => typeof t.id === 'function' ? t.id() : t.id;
  function tipClose(seen) { const el = $('tipCard'); if (el) el.hidden = true; if (tipCur && seen) UI().tp[tipCur] = 1; tipCur = null; tipT = 25; }
  function tipShow(t) {
    const el = $('tipCard'); if (!el) return; const id = tipId(t); tipCur = id; UI().tp[id] = 1; tipHide = 14; // gilt als gesehen, sobald er einmal auftaucht
    el.innerHTML = ''; el.appendChild(uiEl('b', '', t.t)); el.appendChild(uiEl('div', '', t.d));
    const x = uiEl('button', 'tx', '✕'); x.setAttribute('aria-label', 'Tipp schließen'); x.addEventListener('click', e => { e.stopPropagation(); tipClose(true); }); el.appendChild(x);
    if (t.go) { const g = uiEl('button', 'tgo', 'Zeig mir'); g.addEventListener('click', e => { e.stopPropagation(); tipClose(true); try { t.go(); } catch (er) {} }); el.appendChild(g); }
    el.hidden = false; try { sfx.pop && sfx.pop(); } catch (e) {}
  }
  function tipTick(dt) {
    if (!G || KR_NEUTRAL || state !== 'play') return;
    if (tipCur) { if (!phoneOpen) tipHide -= dt; if (tipHide <= 0) tipClose(true); return; }
    tipT -= dt; if (tipT > 0) return; tipT = 4;
    const u = UI();
    if (!u.tp0) { TIPS.forEach(t => { try { if (t.ok()) u.tp[tipId(t)] = 1; } catch (e) {} }); u.tp0 = 1; return; } // alte Spielstände: schon Freigeschaltetes nicht nochmal erklären
    if (phoneOpen || tutOpen || !G.tut || chatOpen || nameGateOpen) return;
    for (const t of TIPS) { let id, ok = false; try { id = tipId(t); ok = !u.tp[id] && t.ok(); } catch (e) {} if (ok) { tipShow(t); return; } }
  }
  // v128: Filter und Suche in langen Listen (Kleidung, Effekte, Deko, Fahrzeuge). 'neu' = frisch freigeschaltet und noch nie angesehen.
  let lfMode = 'all', lfQ = '', lfPend = {}, lfTab = '';
  const UI = () => G.ui || (G.ui = uiDef());
  function uiDef() { return { ls: {}, tp: {}, ls0: 0, tp0: 0 }; }
  function cleanUi(o) { const u = uiDef(); if (!o || typeof o !== 'object') return u; const m = x => { const r = {}; if (x && typeof x === 'object') for (const k of Object.keys(x).slice(0, 3000)) if (typeof k === 'string' && k.length < 40) r[k] = 1; return r; }; u.ls = m(o.ls); u.tp = m(o.tp); u.ls0 = o.ls0 ? 1 : 0; u.tp0 = o.tp0 ? 1 : 0; return u; }
  function lfAll() { const r = []; WEAR.forEach(w => r.push(['w:' + w.id, w.rep || 0, !!(w.ach || w.qx || w.kiosk)])); COS.forEach(c => r.push(['c:' + c.id, c.rep || 0, false])); DECOR.forEach(d => r.push(['d:' + d.id, d.rep || 0, !!d.qx])); VEHS.forEach(v => r.push(['v:' + v.id, v.rep || 0, !!v.car])); return r; }
  function lfSeed() { const u = UI(); if (u.ls0) return; lfAll().forEach(([k, rp]) => { if (G.rep >= rp) u.ls[k] = 1; }); u.ls0 = 1; } // alte Spielstände: alles schon Freigeschaltete gilt als gesehen
  function lfIsNew(k, owned, locked, special) { lfSeed(); if (owned || locked || special) return false; return UI().ls[k] ? false : k; }
  function lfFlush() { const u = UI(); for (const k of Object.keys(lfPend)) u.ls[k] = 1; lfPend = {}; }
  function lfNewCount(prefixes) { lfSeed(); const u = UI(); let n = 0; lfAll().forEach(([k, rp, sp]) => { if (!sp && G.rep >= rp && !u.ls[k] && prefixes.includes(k[0])) { const id = k.slice(2), own = k[0] === 'w' ? wearOwned(id) : k[0] === 'c' ? !!G.cos.owned[id] : k[0] === 'd' ? !!G.dec.owned[id] : !!G.veh.owned[id]; if (!own) n++; } }); return n; }
  // Gibt false zurück, wenn der Eintrag beim aktuellen Filter ausgeblendet wird
  function lfPass(owned, cost, locked, isNew, buyable) { if (lfMode === 'own') return owned; if (lfMode === 'buy') return !owned && !locked && buyable !== false && canPay(cost); if (lfMode === 'new') return !!isNew; return true; }
  function lfBadge(isNew) { if (isNew) lfPend[isNew] = 1; return isNew ? ' <span class="lfnew">NEU</span>' : ''; }
  function lfBar(b, reAll) {
    const w = uiEl('div', 'lfbar'), inp = uiEl('input'); inp.type = 'search'; inp.placeholder = '🔍 Suchen …'; inp.value = lfQ; inp.setAttribute('aria-label', 'Liste durchsuchen'); inp.maxLength = 30;
    inp.addEventListener('input', () => { const was = !!lfQ.trim(); lfQ = inp.value; if (reAll && was !== !!lfQ.trim()) { renderPhone(); const n = document.querySelector('#phBody .lfbar input'); if (n) { try { n.focus(); n.setSelectionRange(n.value.length, n.value.length); } catch (e) {} } } else lfApply(b); }); /* reAll: beim Suchen alle Kategorien zeigen */ inp.addEventListener('keydown', e => e.stopPropagation()); w.appendChild(inp);
    const ch = uiEl('div', 'lfchips'); [['all', 'Alle'], ['own', 'Gekauft'], ['buy', 'Leistbar'], ['new', '✨ Neu']].forEach(([k, t]) => { const c = uiEl('button', 'chip' + (lfMode === k ? ' on' : ''), t); c.addEventListener('click', () => { lfMode = k; renderPhone(); }); ch.appendChild(c); }); w.appendChild(ch);
    b.appendChild(w); return w;
  }
  // Suche blendet nur Karten aus (kein Neuzeichnen, damit die Tastatur offen bleibt); leere Abschnitte zeigen einen Hinweis
  function lfApply(b) { const q = lfQ.trim().toLowerCase(); let shown = 0; b.querySelectorAll('.card.cos').forEach(c => { const nm = (c.querySelector('.nm') || c).textContent.toLowerCase(), ok = !q || nm.includes(q); c.style.display = ok ? '' : 'none'; if (ok) shown++; });
    { let hd = null, n = 0; const fin = () => { if (hd) hd.style.display = n ? '' : 'none'; }; for (const el of Array.from(b.children)) { if (el.classList.contains('grp')) { fin(); hd = el; n = 0; } else if (el.classList.contains('cos') && el.style.display !== 'none') n++; } fin(); } // leere Überschriften ausblenden
    let e = b.querySelector('.lfempty'); if (!shown) { if (!e) { e = uiEl('div', 'empty lfempty'); b.appendChild(e); } e.textContent = lfMode === 'all' && !q ? 'Hier gibt es nichts.' : 'Nichts gefunden. Probier einen anderen Filter.'; } else if (e) e.remove(); }
  function wearSection(b, slot, title) {
      const hd = document.createElement('div'); hd.className = 'grp'; hd.textContent = title; b.appendChild(hd);
      WEAR.filter(w => w.slot === slot).sort((x, y) => x.rep - y.rep || x.cost - y.cost).forEach(w => {
        const owned = wearOwned(w.id), on = G.look[WEAR_KEY[slot]] === w.id, locked = !owned && G.rep < w.rep, sp = !!(w.ach || w.qx || w.kiosk), nw = lfIsNew('w:' + w.id, owned, locked, sp);
        if (!lfPass(owned || w.cost === 0, w.cost, locked, nw, !sp)) return;
        const c = document.createElement('div'); c.className = 'card cos';
        c.innerHTML = '<canvas class="pv" data-wear="' + w.id + '" width="264" height="128"></canvas><div class="nm">' + w.name + lfBadge(nw) + (on ? ' <span style="color:var(--green);font-weight:700">angelegt</span>' : '') + '</div><div class="pr">' + (w.cost === 0 ? 'gratis' : owned ? (w.qx ? 'exklusiv' : 'gekauft') : w.ach || w.qx ? 'Belohnung' : fmt(w.cost)) + '</div><div class="ds">' + w.desc + (w.rep && w.rep < 999 && !owned && G.rep < w.rep ? '<br><b style="color:var(--amber);font-weight:700">Ab Ruf ' + w.rep + '</b>' : '') + '</div>';
        const btn = document.createElement('button'); btn.className = 'buy';
        if (!owned && w.ach) { btn.textContent = 'Ziel: ' + ((ACH.find(a => a.id === w.ach) || {}).name || '?'); btn.disabled = true; }
        else if (!owned && w.qx) { btn.textContent = w.qx; btn.disabled = true; c.classList.add('excl'); }
        else if (!owned && w.kiosk) { btn.textContent = 'Nur am Kiosk (Stadtpark)'; btn.disabled = true; }
        else if (!owned) { btn.textContent = locked ? 'Ab Ruf ' + w.rep : 'Kaufen'; btn.disabled = locked || G.money < w.cost; btn.addEventListener('click', () => { if (buyWear(w.id)) renderPhone(); }); }
        else { const canOff = slot === 'hat' || slot === 'cos' || slot === 'aura' || slot === 'band' || slot === 'back'; btn.textContent = on ? (canOff ? 'Ablegen' : 'Angelegt') : 'Anlegen'; if (on) btn.classList.add('alt'); if (on && !canOff) btn.disabled = true; btn.addEventListener('click', () => { equipWear(w.id); renderPhone(); }); }
        c.appendChild(btn); b.appendChild(c);
      });
  }
  function renderWear(b, which) {
    const info = document.createElement('div'); info.className = 'ds'; info.style.margin = '0 0 6px'; info.textContent = 'Ruf ' + G.rep + '. Mit mehr Ruf schaltest du bessere Kleidung und Kostüme frei. Mützen und Frisuren findest du unter Kopf, Farben unter Figur.'; b.appendChild(info); lfBar(b);
    [['top', 'Oberteile'], ['bot', 'Hosen und Röcke'], ['hat', 'Mützen und Kappen'], ['band', 'Bandanas (am Kiosk)'], ['shoe', 'Schuhe'], ['cos', 'Kostüme (ersetzen Kleidung, Hut und Schuhe)'], ['back', 'Rücken: Flügel, Umhänge und Taschen']].filter(([slot]) => !which || (which === 'kost' ? slot === 'cos' : which === 'shoes' ? slot === 'shoe' : which === 'ruecken' ? slot === 'back' : which === 'kopf' ? slot === 'hat' || slot === 'band' : slot === 'top' || slot === 'bot')).forEach(([slot, title]) => wearSection(b, slot, title));
    lfApply(b); startPreviews(b);
  }
  function renderWpn(b) {
    const info = document.createElement('div'); info.className = 'empty';
    info.textContent = 'Mit einer Waffe in der Hand benutzt du B: Freunde im Raum sind kurz benommen, Streifen gehen K.O. Schläger und Nahkampf treffen alle in der Nähe, Schocker, Netz, Zwille und Wasserpistole nur das nächste Ziel, die Blendgranate alle um dich herum. Alles ist Cartoon-K.O., es gibt kein Blut. Mit eigener Waffe fängst du Schläge ab, am besten mit dem Schild. Wer dich dabei sieht, macht die Polizei misstrauisch.';
    info.style.cssText = 'padding:6px 4px;font-size:13px;text-align:left'; b.appendChild(info); wayBtn(b, 'Spezial- und Fernkampfwaffen gibt es am Kiosk: Hinführen', KIOSK_AT, 'Kiosk');
    const sm = document.createElement('div'); sm.className = 'ds'; sm.style.margin = '0 0 6px'; sm.innerHTML = '<b style="color:var(--amber)">Abwehr ' + defenseScore() + ' · Abschreckung ' + threatScore() + '</b> (Abwehr senkt deine Verluste bei Überfällen, Abschreckung hält Gangs ab)'; b.appendChild(sm);
    WGRP.forEach(gr => {
      const list = BATS.filter(x => x.grp === gr).sort((p, q) => p.rep - q.rep || p.cost - q.cost); if (!list.length) return;
      const hd = document.createElement('div'); hd.className = 'grp'; hd.textContent = gr; b.appendChild(hd);
      list.forEach(bt => {
        const owned = !!G.wpn.owned[bt.id], on = G.wpn.eq === bt.id, locked = !owned && G.rep < bt.rep;
        const c = document.createElement('div'); c.className = 'card cos';
        c.innerHTML = '<canvas class="pv" data-bat="' + bt.id + '" width="264" height="128"></canvas><div class="nm">' + bt.name + (on ? ' <span style="color:var(--green);font-weight:700">in der Hand</span>' : '') + '</div><div class="pr">' + (owned ? 'gekauft' : fmt(bt.cost)) + '</div><div class="ds">' + bt.desc + '<br><b style="color:var(--amber);font-weight:700">Reichweite ' + bt.reach + ' · Wucht ' + Math.round(bt.kb / 26) + ' · Freunde K.O. ' + bt.stun + ' s · Polizei K.O. ' + bt.cop + ' s · Pause ' + (bt.cd || 0.7) + ' s · Abwehr ' + (bt.guard || 0) + '</b></div>';
        const btn = document.createElement('button'); btn.className = 'buy';
        if (!owned && bt.kiosk) { btn.textContent = 'Nur am Kiosk (Stadtpark)'; btn.disabled = true; }
        else if (!owned) { btn.textContent = locked ? 'Ab Ruf ' + bt.rep : 'Kaufen'; btn.disabled = locked || G.money < bt.cost; btn.addEventListener('click', () => { if (buyBat(bt.id)) renderPhone(); }); }
        else { btn.textContent = on ? 'Weglegen' : 'In die Hand'; if (on) btn.classList.add('alt'); btn.addEventListener('click', () => { equipBat(bt.id); renderPhone(); }); }
        c.appendChild(btn); b.appendChild(c);
      });
    });
    startPreviews(b);
  }
  function renderDeko(b) {
    areaChips(b);
    const ar = G.area === 'keller' && player.fl && player.fl !== 2 && player.fl !== 3 && player.fl !== 4 && G.fl[flKey(player.fl)].own ? AREAS[player.fl < 0 ? 'ku' : 'ko'] : AREAS[G.area], k = ar.key;
    if (G.area === 'keller') { const e = document.createElement('div'); e.className = 'ds'; e.style.margin = '0 0 6px'; e.textContent = ar.isFloor ? 'Du bist im ' + ar.name + ': Umbau und Boden gelten für diese Etage. Das Erdgeschoss richtest du im Erdgeschoss ein.' : (G.fl.u.own || G.fl.o.own ? 'Erdgeschoss. Die Etagen richtest du ein, wenn du auf der jeweiligen Etage stehst.' : 'Erdgeschoss.'); b.appendChild(e); }
    if (!isOpen(ar)) { const e = document.createElement('div'); e.className = 'empty'; e.textContent = 'Kaufe zuerst die ' + ar.name + ' im Laden, dann kannst du sie einrichten.'; b.appendChild(e); return; }
    const card = (nm, pr, ds) => { const c = document.createElement('div'); c.className = 'card'; c.innerHTML = '<div class="nm">' + nm + '</div><div class="pr">' + pr + '</div><div class="ds">' + ds + '</div>'; return c; };
    const btnOf = (c, label, fn, off) => { const x = document.createElement('button'); x.className = 'buy'; x.textContent = label; x.disabled = !!off; x.addEventListener('click', fn); c.appendChild(x); b.appendChild(c); };
    btnOf(card('Umbau-Modus', '', ar.isFloor ? 'Stelle Deko frei hin und verschiebe die Töpfe dieser Etage. Die Treppe bleibt frei. Die Zeit steht dabei still.' : 'Stelle Deko frei hin und verschiebe Töpfe, Gestell und Packtisch. Alles bleibt danach ganz normal benutzbar. Die Zeit steht dabei still.'), 'Umbauen', () => startEdit(k), false);
    const own = G.build.door[k];
    if (false) btnOf(card('Seitentür', own ? 'gekauft' : fmt(ar.sideCost), 'Ein zusätzlicher Ausgang ' + (k === 'keller' ? 'rechts' : 'zur Platzseite') + ' mit kürzerem Weg zum Platz.'), own ? 'Fertig' : 'Kaufen', () => { if (buySide(ar)) renderPhone(); }, own || G.money < ar.sideCost);
    const fl = G.build.floor[k], fc = document.createElement('div'); fc.className = 'card look';
    fc.innerHTML = '<div class="nm">Boden</div><div class="ds" style="margin:2px 0 8px">Farbe und Muster des Bodens</div>';
    const row1 = document.createElement('div'); row1.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px';
    FLOOR_COLORS.forEach((col, i) => {
      const x = document.createElement('button'); x.className = 'chip'; x.setAttribute('aria-label', 'Bodenfarbe ' + (i + 1));
      x.style.cssText = 'min-width:44px;background:' + (col || ar.floor) + ';box-shadow:inset 0 0 0 ' + (fl.c === i ? '3px #FFB547' : '1.5px rgba(255,255,255,.25)');
      x.addEventListener('click', () => { setFloor(k, i, null); renderPhone(); }); row1.appendChild(x);
    });
    fc.appendChild(row1);
    const row2 = document.createElement('div'); row2.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px';
    FLOOR_PATS.forEach((nm, i) => { const x = document.createElement('button'); x.className = 'chip' + (fl.p === i ? ' on' : ''); x.textContent = nm; x.addEventListener('click', () => { setFloor(k, null, i); renderPhone(); }); row2.appendChild(x); });
    fc.appendChild(row2); b.appendChild(fc);
    if (ar.stairs) { // Treppen-Look
      const sc = document.createElement('div'); sc.className = 'card look'; sc.innerHTML = '<div class="nm">Treppe</div><div class="ds" style="margin:2px 0 8px">Aussehen der Treppe' + (ar.isFloor ? ' auf dieser Etage' : 'n') + '. Verschieben kannst du sie im Umbau-Modus.</div>';
      const row = document.createElement('div'); row.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px';
      STAIR_STYLES.forEach((q, i) => { const x = document.createElement('button'); x.className = 'chip' + ((G.build.stair[k] | 0) === i ? ' on' : ''); x.textContent = q[0]; x.addEventListener('click', () => { G.build.stair[k] = i; save(); renderPhone(); }); row.appendChild(x); });
      sc.appendChild(row); b.appendChild(sc);
    }
    if (!ar.isFloor && !G.build.door[k]) { const e = document.createElement('div'); e.className = 'ds'; e.style.margin = '0 0 6px'; e.textContent = 'Seitentür: stell dich an die vernagelte Stelle in der ' + (k === 'keller' ? 'rechten' : 'linken') + ' Wand und drück A (' + fmt(ar.sideCost) + ').'; b.appendChild(e); }
    btnOf(card('Deko kaufen', '', 'Neue Möbel, Pflanzen, Teppiche und mehr gibt es in der App Deko-Laden. Hier stellst du sie auf (Umbau-Modus).'), 'Zum Deko-Laden', () => { tab = 'dshop'; renderPhone(); }, false);
  }
  const DCAT = [['Pflanzen', ['cactus', 'plant', 'flowers', 'bonsai', 'palm', 'tree']], ['Möbel', ['beanbag', 'shelf', 'turntable', 'fridge', 'easel', 'couch', 'trophy', 'piano', 'hammock', 'mirror']], ['Teppiche', ['roundrug', 'rug', 'leafrug', 'starrug']], ['Licht und Stimmung', ['candles', 'lamp', 'lavalamp', 'neon', 'discoball', 'fireplace', 'chandelier']], ['Technik und Spaß', ['fan', 'globe', 'speaker', 'tv', 'tank', 'arcade', 'jukebox', 'telescope']], ['Spiele und Sport', ['dartboard', 'kicker', 'pooltable', 'punchbag']], ['Musik und Küche', ['guitar', 'drumset', 'coffee', 'popcorn']], ['Kleinkram', ['gnome', 'terrarium']], ['Anbau', ['watercan', 'hygro', 'leafposter', 'clipfan', 'seedrack', 'hemprug', 'drynet', 'jars', 'mother', 'carbonfilter', 'ledpanel', 'growtent']], ['Betten', ['futon', 'bed', 'bunkbed', 'dbed', 'catbed']], ['Wohnen', ['bookstack', 'fishbowl', 'fairy', 'plantwall', 'clock', 'robot', 'safe', 'statue']], ['Freizeit', ['bbq', 'graffcanvas', 'miniramp', 'vending', 'pingpong', 'gamingpc', 'hottub']], ['Labor', ['hopsack', 'maltsacks', 'crates', 'bartable', 'mugshelf', 'casks', 'prostsign', 'tap', 'kettle', 'fermenter']]];
  { const add = (cat, ids) => DCAT.find(c => c[0] === cat)[1].push(...ids); add('Pflanzen', ['planter']); add('Möbel', ['armchair']); add('Teppiche', ['rugstripe']); add('Licht und Stimmung', ['lantern']); add('Technik und Spaß', ['radio']); add('Musik und Küche', ['vinyl']); add('Kleinkram', ['snowglobe', 'windchime', 'piggy']); add('Pflanzen', ['cactusrow', 'monstera']); add('Möbel', ['homebar', 'massage']); add('Licht und Stimmung', ['arclamp', 'neonleaf']); add('Technik und Spaß', ['aquarium', 'bigtv']); add('Kleinkram', ['gumball', 'hamster', 'goldbars']); add('Freizeit', ['koipond', 'skatewall']); } // v87: neue Deko in die passenden Kategorien
  { const add = (cat, ids) => DCAT.find(c => c[0] === cat)[1].push(...ids); add('Licht und Stimmung', ['firefly', 'plasma', 'jellytank']); add('Möbel', ['rocker']); add('Kleinkram', ['mobile', 'newton', 'cuckoo']); add('Technik und Spaß', ['robovac', 'trainset']); add('Freizeit', ['fountain', 'bubbles', 'carousel']); } // v130
  DCAT.push(['😎 Chill-Zone', ['lounge', 'firepit', 'console', 'djbooth', 'neonsign', 'pokertable', 'tagwall', 'sneakerwall', 'hoops', 'moneycount', 'speakerwall', 'cooler']]); // v132
  DCAT.push(['🏆 Exklusiv', ['masterpiece', 'citykey', 'prtrophy']]);
  let dshopCat = 0; // v106: gewaehlte Kategorie im Deko-Laden
  function renderDShop(b) {
    const info = document.createElement('div'); info.className = 'ds'; info.style.margin = '0 0 6px'; info.textContent = 'Alles, was du kaufst, kannst du in Keller, Scheune und Chemielabor aufstellen (App Wohnen → Einrichten, Umbau-Modus). Mit mehr Ruf kommen neue Stücke dazu.'; b.appendChild(info);
    lfBar(b, true); const seen = {}, cats = [['✨ Neu', DEC_NEW]].concat(DCAT), allC = lfMode === 'new' || !!lfQ.trim(); if (!(dshopCat >= 0 && dshopCat < cats.length)) dshopCat = 0;
    const seg = document.createElement('div'); seg.className = 'tmseg'; if (allC) seg.style.display = 'none'; cats.forEach(([title], i) => { const c = document.createElement('button'); c.className = 'tmsg' + (i === dshopCat ? ' on' : ''); c.textContent = title; c.addEventListener('click', () => { dshopCat = i; renderPhone(); }); seg.appendChild(c); }); b.appendChild(seg);
    (allC ? cats.slice(1) : [cats[dshopCat]]).forEach(([title, ids]) => { // v128: bei Neu und beim Suchen alle Kategorien
      const hd = document.createElement('div'); hd.className = 'grp'; hd.textContent = title; b.appendChild(hd);
      ids.map(id => DECOR.find(d => d.id === id)).filter(Boolean).sort((x, y) => x.rep - y.rep || x.cost - y.cost).forEach(d => {
        if (seen[d.id]) return; seen[d.id] = 1;
        const dOwn = !!G.dec.owned[d.id], dLk = G.rep < (d.rep || 0), nw = lfIsNew('d:' + d.id, dOwn, dLk, !!d.qx);
        if (!lfPass(dOwn, d.cost, dLk, nw, !d.qx)) return;
        const c = document.createElement('div'); c.className = 'card cos';
        c.innerHTML = '<canvas class="pv" data-dec="' + d.id + '" width="264" height="128"></canvas><div class="nm">' + d.name + lfBadge(nw) + '</div><div class="pr">' + (d.qx ? 'exklusiv' : fmt(d.cost)) + '</div><div class="ds">' + d.desc + ' · Besitz ' + (G.dec.owned[d.id] || 0) + ', frei ' + decStock(d.id) + (d.rep && G.rep < d.rep ? '<br><b style="color:var(--amber);font-weight:700">Ab Ruf ' + d.rep + '</b>' : '') + '</div>';
        const lk = G.rep < (d.rep || 0), btn = document.createElement('button'); btn.className = 'buy'; btn.textContent = lk ? 'Ab Ruf ' + d.rep : 'Kaufen'; btn.disabled = lk || G.money < d.cost;
        if (d.qx) { btn.textContent = G.dec.owned[d.id] ? 'Im Besitz (App Deko)' : 'Belohnung: ' + d.qx; btn.disabled = true; c.classList.add('excl'); }
        btn.addEventListener('click', () => { if (buyDecor(d.id)) renderPhone(); });
        c.appendChild(btn); b.appendChild(c);
      });
    });
    lfApply(b); startPreviews(b);
  }
  function wayBtn(b, label, at, nm) { const bt = uiEl('button', 'buy alt', '📍 ' + label); bt.style.cssText = 'margin:2px 0 8px;width:100%'; bt.addEventListener('click', () => { wayPt = { x: at.x, y: at.y }; closePhone(); msg('📍 Wegpunkt: ' + nm); }); b.appendChild(bt); return bt; } // v119
  function renderVeh(b) {
    const info = document.createElement('div'); info.className = 'ds'; info.style.margin = '0 0 6px';
    info.textContent = 'Fahrzeuge machen dich schneller. Mit dem Rad-Knopf (Taste V) steigst du auf dein ausgewähltes Rad oder den Roller, mit dem Auto-Knopf (Taste C) ins ausgewählte Auto. Drinnen steigst du automatisch ab. Autos gibt es nur am Autohof im Gewerbegebiet ganz im Osten, Tuning in der Autowerkstatt im Süden.'; b.appendChild(info); lfBar(b);
    VEHS.filter(v => !v.car || G.veh.owned[v.id]).forEach(v => {
      const owned = !!G.veh.owned[v.id], on = (v.car ? selCar() : selBike()) === v.id, locked = !owned && G.rep < v.rep, nw = lfIsNew('v:' + v.id, owned, locked, !!v.car);
      if (!lfPass(owned, v.cost, locked, nw)) return;
      const c = document.createElement('div'); c.className = 'card cos';
      c.innerHTML = '<canvas class="pv" data-veh="' + v.id + '" width="264" height="128"></canvas><div class="nm">' + v.name + lfBadge(nw) + (on ? ' <span style="color:var(--green);font-weight:700">ausgewählt</span>' : '') + '</div><div class="pr">' + (owned ? 'gekauft' : fmt(v.cost)) + '</div><div class="ds">' + v.desc + (v.rep && !owned && G.rep < v.rep ? '<br><b style="color:var(--amber);font-weight:700">Ab Ruf ' + v.rep + '</b>' : '') + '</div>';
      const btn = document.createElement('button'); btn.className = 'buy';
      if (!owned) { btn.textContent = locked ? 'Ab Ruf ' + v.rep : 'Kaufen'; btn.disabled = locked || !canPay(v.cost); btn.addEventListener('click', () => { if (buyVeh(v.id)) renderPhone(); }); }
      else { btn.textContent = on ? 'Ausgewählt' : 'Auswählen'; if (on) { btn.classList.add('alt'); btn.disabled = true; } btn.addEventListener('click', () => { equipVeh(v.id); renderPhone(); }); }
      c.appendChild(btn); b.appendChild(c);
    });
    lfApply(b); startPreviews(b);
    b.appendChild(uiEl('div', 'grp', 'Autos')); wayBtn(b, 'Autos gibt es nur am Autohof: Hinführen', AH_AT, 'Autohof'); // v119
  }
  function renderHMine(b) {
    const info = document.createElement('div'); info.className = 'ds'; info.style.margin = '0 0 6px'; info.textContent = 'Deine Gebäude. Neue Häuser schaltest du mit Ruf und Geld frei.'; b.appendChild(info);
    AREA_KEYS.forEach(k => {
      const ar = AREAS[k], th = AREA_THEME[k], open = isOpen(ar), c = document.createElement('div'); c.className = 'card';
      const staff = Object.keys(ROLES).filter(r => ROLES[r].area === k).reduce((n, r) => n + G.staff[r], 0);
      c.innerHTML = '<div class="nm">' + th.ic + ' ' + ar.name + '</div><div class="pr">' + (open ? 'gehört dir' : fmt(ar.cost)) + '</div><div class="ds">' + (open ? 'Töpfe ' + potsOpen(ar) + ' · Helfer ' + staff + ' · Deko ' + G.dec.items[k].length + ' · Seitentür ' + (G.build.door[k] ? 'ja' : 'nein') : th.tag + (G.rep < ar.needRep ? '<br><b style="color:var(--amber);font-weight:700">Ab Ruf ' + ar.needRep + '</b>' : '')) + '</div>';
      const btn = document.createElement('button'); btn.className = 'buy';
      if (open) { btn.textContent = 'Einrichten'; btn.addEventListener('click', () => { G.area = k; tab = 'deko'; renderPhone(); }); }
      else { btn.textContent = G.rep < ar.needRep ? 'Ab Ruf ' + ar.needRep : 'Kaufen'; btn.disabled = G.rep < ar.needRep || G.money < ar.cost; btn.addEventListener('click', () => { if (buyArea(ar)) renderPhone(); }); }
      c.appendChild(btn); b.appendChild(c);
    });
    { const c = uiEl('div', 'card'), own = G.lager && G.lager.own; c.appendChild(uiEl('div', 'nm', '🏢 Mietraum')); c.appendChild(uiEl('div', 'pr', own ? 'gemietet' : 'ab Ruf ' + LAGER_REP)); c.appendChild(uiEl('div', 'ds', own ? 'Lager-Regal und Premium-Anbau für die Apotheke. Hinter dem Lager-Tor im Gewerbegebiet.' : 'Mieten kannst du ihn direkt am Lager-Tor im Gewerbegebiet.'));
      const bt = uiEl('button', 'buy', own ? 'Ausbau' : '📍 Hinführen'); bt.addEventListener('click', () => { if (own) { tmSel = 'pr'; tab = 'shop'; renderPhone(); } else { wayPt = { x: LAGER_AT.x, y: LAGER_AT.y }; closePhone(); msg('📍 Wegpunkt: Lager-Tor'); } }); c.appendChild(bt); b.appendChild(c); } // v119
  }
  function renderHNbr(b) {
    const n = houseCount(), info = document.createElement('div'); info.className = 'ds'; info.style.margin = '0 0 6px';
    info.textContent = HOUSES.filter((h, i) => houseOpen(i) && !h.gang).length + ' von ' + HOUSES.filter(h => !h.gang).length + ' Nachbarn bestellen schon bei dir. Mit mehr Ruf melden sich weitere.'; b.appendChild(info);
    HOUSES.forEach((h, i) => {
      if (h.gang || h.office) return; // v79: gehoert den Gangs, v100: Maklerbuero
      const open = houseOpen(i), o = G.orders.find(z => z.house === i && !z.remote), c = document.createElement('div'); c.className = 'card';
      const st = open ? (o ? 'Bestellt: ' + o.qty + ' ' + AREAS[o.prod || 'keller'].lbl.unit + (o.vip ? ' · Spezialkunde' : '') : 'Wartet auf die nächste Bestellung') : 'Ab Ruf ' + houseRep(i) + (h.north ? ' (Nordviertel)' : '');
      c.innerHTML = '<div class="nm"><span class="dot" style="background:' + h.c + '"></span>' + h.name + '</div><div class="pr">' + (open ? 'Kunde' : 'gesperrt') + '</div><div class="ds">' + st + '</div>';
      b.appendChild(c);
    });
  }
  // v132: Begleiter in groß: dreht sich live, darunter der ganze Text mit Vorteil
  let pvwRaf = 0;
  function petView(id) {
    const cs = COS.find(x => x.id === id && x.kind === 'pet'); if (!cs) return; petViewClose();
    const ov = uiEl('div', 'petview'); ov.id = 'petView'; const card = uiEl('div', 'pv-card'); ov.appendChild(card);
    const cvs = document.createElement('canvas'); cvs.className = 'pv-big'; const dp = Math.min(2, window.devicePixelRatio || 1); cvs.width = Math.round(300 * dp); cvs.height = Math.round(220 * dp); card.appendChild(cvs);
    const owned = !!G.cos.owned[id], on = activePets().includes(id), locked = !owned && G.rep < (cs.rep || 0), pk = PERKS[id];
    card.appendChild(uiEl('div', 'pv-nm', cs.name)); card.appendChild(uiEl('div', 'pv-pr', owned ? (on ? 'angelegt' : 'gekauft') : locked ? 'ab Ruf ' + cs.rep : fmt(cs.cost)));
    if (pk) { const p = uiEl('div', 'pv-perk'); p.appendChild(uiEl('b', '', '⭐ Vorteil')); p.appendChild(uiEl('div', '', pk.text)); card.appendChild(p); }
    card.appendChild(uiEl('div', 'pv-ds', cs.desc + '.'));
    card.appendChild(uiEl('div', 'pv-ds pv-mut', 'Bis zu 2 Begleiter gleichzeitig. Ihre Vorteile zählen zusammen.'));
    const row = uiEl('div', 'pv-row'), bt = uiEl('button', 'buy');
    if (!owned) { bt.textContent = locked ? 'Ab Ruf ' + cs.rep : 'Kaufen für ' + fmt(cs.cost); bt.disabled = locked || G.money < cs.cost; bt.addEventListener('click', () => { if (buyCos(id)) { petViewClose(); renderPhone(); petView(id); } }); }
    else { bt.textContent = on ? 'Ablegen' : 'Anlegen'; if (on) bt.classList.add('alt'); bt.addEventListener('click', () => { equipCos(id); petViewClose(); renderPhone(); petView(id); }); }
    const cl = uiEl('button', 'buy alt', 'Schließen'); cl.addEventListener('click', petViewClose); row.appendChild(bt); row.appendChild(cl); card.appendChild(row);
    ov.addEventListener('click', e => { if (e.target === ov) petViewClose(); });
    document.body.appendChild(ov);
    const x = cvs.getContext('2d'), t0 = performance.now();
    const loop = now => { if (!ov.isConnected) return; const tm = (now - t0) / 1000, W2 = cvs.width, H2 = cvs.height; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W2, H2);
      const g = x.createRadialGradient(W2 / 2, H2 * 0.6, 10, W2 / 2, H2 * 0.6, W2 * 0.6); g.addColorStop(0, '#2E3A4C'); g.addColorStop(1, '#151B24'); x.fillStyle = g; x.fillRect(0, 0, W2, H2);
      x.fillStyle = 'rgba(255,255,255,.06)'; x.beginPath(); x.ellipse(W2 / 2, H2 * 0.78, W2 * 0.3, H2 * 0.07, 0, 0, TAU); x.fill();
      const turn = Math.cos(tm * 1.1), sx = Math.sign(turn || 1) * Math.max(0.12, Math.abs(turn)), moving = Math.sin(tm * 0.5) > -0.2, sc = 4.6 * dp;
      const s0 = ctx; try { ctx = x; ctx.save(); ctx.translate(W2 / 2, H2 * 0.78); ctx.scale(sc * sx, sc); drawPet(id, 0, 0, 1, tm, moving, 1); ctx.restore(); } catch (e) {} finally { ctx = s0; }
      pvwRaf = requestAnimationFrame(loop); };
    pvwRaf = requestAnimationFrame(loop);
  }
  function petViewClose() { if (!pvwRaf) return; const o = document.getElementById('petView'); if (o) o.remove(); try { cancelAnimationFrame(pvwRaf); } catch (e) {} pvwRaf = 0; }
  function renderStyle(b, part) {
    const L = G.look;
    if (!part || part === 'view') { const hd0 = document.createElement('div'); hd0.className = 'grp'; hd0.textContent = 'Anzeige'; b.appendChild(hd0);
      const c0 = document.createElement('div'); c0.className = 'card look';
      c0.innerHTML = '<div class="nm">Bildschirm</div><div class="ds" style="margin:2px 0 8px">Querformat ist der Standard. Im Hochformat wird die Steuerung unten angeordnet, die Anzeige kompakter und die Kamera passt sich an. Drehe dein Handy danach.</div><div class="opts"><button class="chip" data-v="0">Querformat</button><button class="chip" data-v="1">Hochformat</button></div>';
      const paintV = () => c0.querySelectorAll('[data-v]').forEach(e => e.classList.toggle('on', (e.dataset.v === '1') === portOk));
      c0.querySelectorAll('[data-v]').forEach(e => e.addEventListener('click', () => { setPortOk(e.dataset.v === '1'); paintV(); }));
      paintV(); b.appendChild(c0);
      const c3 = document.createElement('div'); c3.className = 'card look'; // v90: 3D-Ansicht
      c3.innerHTML = '<div class="nm">Grafik</div><div class="ds" style="margin:2px 0 8px">3D (Beta): echte 3D-Stadt mit Licht und Schatten, feste Kamera und Steuerung wie in 2D. Figuren, Kosmetik, Pflanzen, Labor, Skaterpark, Deko, Kiosk, Bänke und Wetter sind in 3D. Ein paar Kleinigkeiten folgen noch, die 2D-Ansicht bleibt bis dahin als sichere Variante.' + (r3Err ? '<br><b style="color:#FF8A6A">3D konnte nicht geladen werden: ' + r3Err.replace(/[<>&]/g, '') + '</b>' : '') + '</div><div class="opts"><button class="chip" data-g="0">2D</button><button class="chip" data-g="1">3D (Beta)</button></div><div class="ds" style="margin:8px 0 4px">3D-Qualität</div><div class="opts"><button class="chip" data-q="low">Niedrig</button><button class="chip" data-q="mid">Mittel</button><button class="chip" data-q="high">Hoch</button></div>';
      const paint3 = () => { c3.querySelectorAll('[data-g]').forEach(e => e.classList.toggle('on', (e.dataset.g === '1') === r3Want)); c3.querySelectorAll('[data-q]').forEach(e => e.classList.toggle('on', e.dataset.q === r3Q)); };
      c3.querySelectorAll('[data-g]').forEach(e => e.addEventListener('click', () => { r3Set(e.dataset.g === '1'); paint3(); }));
      c3.querySelectorAll('[data-q]').forEach(e => e.addEventListener('click', () => { r3SetQ(e.dataset.q); paint3(); }));
      paint3(); b.appendChild(c3);
      const cQ = document.createElement('div'); cQ.className = 'card look'; // v98
      cQ.innerHTML = '<div class="nm">Bildqualität</div><div class="ds" style="margin:2px 0 8px">Hoch zeichnet doppelt so fein wie Sparsam und ist trotzdem flott, Sparsam schont den Akku am meisten. Der Farbfilter gibt dem Bild wärmere Farben, goldene und blaue Stunde.</div><div class="chips"><button class="chip" data-gq="0">Sparsam</button><button class="chip" data-gq="1">Hoch</button></div><div class="chips" style="margin-top:6px"><button class="chip" data-gf="1">Farbfilter an</button><button class="chip" data-gf="0">aus</button></div>';
      const paintQ = () => { cQ.querySelectorAll('[data-gq]').forEach(e => e.classList.toggle('on', +e.dataset.gq === GFX_Q)); cQ.querySelectorAll('[data-gf]').forEach(e => e.classList.toggle('on', (e.dataset.gf === '1') === GFX_FX)); };
      cQ.querySelectorAll('[data-gq]').forEach(e => e.addEventListener('click', () => { GFX_Q = +e.dataset.gq ? 1 : 0; try { localStorage.setItem('kellergruen.gq', String(GFX_Q)); } catch (x) {} resize(); paintQ(); }));
      cQ.querySelectorAll('[data-gf]').forEach(e => e.addEventListener('click', () => { GFX_FX = e.dataset.gf === '1'; try { localStorage.setItem('kellergruen.gfx', GFX_FX ? '1' : '0'); } catch (x) {} resize(); paintQ(); }));
      paintQ(); b.appendChild(cQ);
      const cL = document.createElement('div'); cL.className = 'card look'; // v128
      cL.innerHTML = '<div class="nm">Weniger Effekte</div><div class="ds" style="margin:2px 0 8px">Ruhigeres Bild und weniger Akku: Polizeilicht ohne Blinken, kein Regen, Schnee und Laub, kein Rauch, Auren anderer Spieler aus, kein Wackeln, weniger Partikel. Gilt nur auf diesem Gerät.</div><div class="chips"><button class="chip" data-lf="1">An</button><button class="chip" data-lf="0">Aus</button></div>';
      const paintL = () => cL.querySelectorAll('[data-lf]').forEach(e => e.classList.toggle('on', (e.dataset.lf === '1') === lofxUser));
      cL.querySelectorAll('[data-lf]').forEach(e => e.addEventListener('click', () => { setLofx(e.dataset.lf === '1'); paintL(); }));
      paintL(); b.appendChild(cL);
      const cB = document.createElement('div'); cB.className = 'card look'; // v135
      cB.innerHTML = '<div class="nm">Bilder zwischenspeichern</div><div class="ds" style="margin:2px 0 8px">Häuser, Boden, Wege, Bäume, Blumen und Bänke werden einmal fertig gezeichnet und dann nur noch als Bild eingesetzt. Das spart sehr viele Zeichenbefehle. Automatisch: das Spiel misst draußen kurz beides und nimmt, was auf deinem Handy schneller ist.' + (bcMode === 'a' ? '<br><b style="color:var(--amber);font-weight:700">' + (bcAuto ? 'Gemessen: ' + (bcAuto === '1' ? 'an ist schneller' : 'aus ist schneller') : 'Misst noch, sobald du draußen unterwegs bist') + '</b>' : '') + '</div><div class="chips"><button class="chip" data-bc="a">Automatisch</button><button class="chip" data-bc="1">An</button><button class="chip" data-bc="0">Aus</button></div>';
      const paintB = () => cB.querySelectorAll('[data-bc]').forEach(e => e.classList.toggle('on', e.dataset.bc === bcMode));
      cB.querySelectorAll('[data-bc]').forEach(e => e.addEventListener('click', () => { setBc(e.dataset.bc); paintB(); }));
      paintB(); b.appendChild(cB);
      const cP = document.createElement('div'); cP.className = 'card look'; // v134
      cP.innerHTML = '<div class="nm">Bildrate anzeigen</div><div class="ds" style="margin:2px 0 8px">Zeigt oben in der Mitte, wie viele Bilder pro Sekunde dein Handy gerade schafft. Grün ab 100, gelb um 60, rot darunter. Die Bildrate gibt der Browser vor: auf 120-Hz-Handys bis zu 120, im Energiesparmodus oft nur 30 bis 60.</div><div class="chips"><button class="chip" data-fp="1">An</button><button class="chip" data-fp="0">Aus</button></div>';
      const paintP = () => cP.querySelectorAll('[data-fp]').forEach(e => e.classList.toggle('on', (e.dataset.fp === '1') === fpsOn));
      cP.querySelectorAll('[data-fp]').forEach(e => e.addEventListener('click', () => { setFps(e.dataset.fp === '1'); paintP(); }));
      paintP(); b.appendChild(cP);
      const cA = document.createElement('div'); cA.className = 'card look'; // v129
      cA.innerHTML = '<div class="nm">Automatisch sparen</div><div class="ds" style="margin:2px 0 8px">Drosselt dein Handy (z. B. im Energiesparmodus), stellt das Spiel von selbst eine geringere Auflösung und weniger Effekte ein, damit es flüssig bleibt. Läuft es wieder schnell, wird zurückgestellt.' + (autoLow ? '<br><b style="color:var(--amber);font-weight:700">Gerade aktiv</b>' : '') + '</div><div class="chips"><button class="chip" data-al="1">An</button><button class="chip" data-al="0">Aus</button></div>';
      const paintA = () => cA.querySelectorAll('[data-al]').forEach(e => e.classList.toggle('on', (e.dataset.al === '1') === autoOn));
      cA.querySelectorAll('[data-al]').forEach(e => e.addEventListener('click', () => { setAutoOn(e.dataset.al === '1'); paintA(); }));
      paintA(); b.appendChild(cA);
    }
    if (part === 'system') { const hdS = document.createElement('div'); hdS.className = 'grp'; hdS.textContent = 'Hilfe bei Problemen'; b.appendChild(hdS);
      const cV = document.createElement('div'); cV.className = 'card look'; cV.innerHTML = '<div class="nm">Kellergrün · Version ' + GAME_VER + '</div><div class="ds" style="margin:2px 0 8px">Dein Spielstand wird automatisch gespeichert. Frei erfundenes Spiel.</div>'; const bCL = document.createElement('button'); bCL.className = 'buy'; bCL.textContent = '✨ Was ist neu?'; bCL.style.gridColumn = '1 / -1'; bCL.addEventListener('click', () => showChangelog(true)); cV.appendChild(bCL); b.appendChild(cV);
      const cF = document.createElement('div'); cF.className = 'card look'; cF.innerHTML = '<div class="nm">Bild neu anpassen</div><div class="ds" style="margin:2px 0 8px">Ist das Spiel verrutscht (zum Beispiel unten ein schwarzer Balken)? Erst „Bildschirm neu anpassen“ tippen. Hilft das nicht, „Spiel neu laden“: dein Spielstand wird vorher gespeichert.</div>';
      const bF = document.createElement('button'); bF.className = 'buy'; bF.textContent = 'Bildschirm neu anpassen'; bF.style.gridColumn = '1 / -1'; bF.addEventListener('click', () => { screenFit(); setTimeout(() => screenFit(true), 300); }); cF.appendChild(bF); const bR = document.createElement('button'); bR.className = 'buy'; bR.textContent = 'Spiel neu laden'; bR.style.cssText = 'grid-column:1 / -1;margin-top:8px'; bR.addEventListener('click', () => { try { if (G && state === 'play') save(); } catch (e) {} location.reload(); }); cF.appendChild(bR); b.appendChild(cF);
      b.appendChild(saveIoCard());
      const cI = document.createElement('div'); cI.className = 'card look'; cI.innerHTML = '<div class="nm">📏 Bildschirm-Info</div><div class="ds" style="margin:2px 0 6px">Siehst du einen Balken? Mach hier einen Screenshot und schick ihn mir.</div>'; const pre = document.createElement('pre'); pre.style.cssText = 'grid-column:1 / -1;margin:0;white-space:pre-wrap;font:600 11px/1.45 ui-monospace,Menlo,monospace;color:var(--muted);background:rgba(0,0,0,.25);border-radius:10px;padding:8px 10px'; const upd = () => { if (!pre.isConnected) return; pre.textContent = screenInfo(); setTimeout(upd, 1000); }; cI.appendChild(pre); b.appendChild(cI); setTimeout(upd, 0); } // v89, v91: neu laden, v105: Info
    const cosList = ([kind, title]) => {
      const hd = document.createElement('div'); hd.className = 'grp'; hd.textContent = title; b.appendChild(hd);
      COS.filter(x => x.kind === kind).forEach(cs => {
        const owned = !!G.cos.owned[cs.id], on = kind === 'pet' ? activePets().includes(cs.id) : kind === 'orbit' ? orbitList().includes(cs.id) : G.cos[kind] === cs.id, locked = !owned && G.rep < (cs.rep || 0), nw = lfIsNew('c:' + cs.id, owned, locked, false);
        if (!lfPass(owned, cs.cost, locked, nw)) return;
        const c = document.createElement('div'); c.className = 'card cos';
        c.innerHTML = '<canvas class="pv" data-cos="' + cs.id + '" width="264" height="128"></canvas><div class="nm">' + cs.name + lfBadge(nw) + (on ? ' <span style="color:var(--green);font-weight:700">angelegt</span>' : '') + '</div><div class="pr">' + (owned ? 'gekauft' : fmt(cs.cost)) + '</div><div class="ds">' + cs.desc + (PERKS[cs.id] ? '<br><b style="color:var(--amber);font-weight:700">Vorteil: ' + PERKS[cs.id].text + '</b>' : '') + '</div>';
        const btn = document.createElement('button'); btn.className = 'buy';
        if (!owned) { btn.textContent = locked ? 'Ab Ruf ' + cs.rep : 'Kaufen'; btn.disabled = locked || G.money < cs.cost; btn.addEventListener('click', () => { if (buyCos(cs.id)) renderPhone(); }); }
        else { btn.textContent = on ? 'Ablegen' : 'Anlegen'; if (on) btn.classList.add('alt'); btn.addEventListener('click', () => { equipCos(cs.id); renderPhone(); }); }
        c.appendChild(btn); b.appendChild(c);
        if (kind === 'pet') { c.classList.add('tapme'); c.addEventListener('click', e => { if (e.target.closest('button')) return; petView(cs.id); }); } // v132: antippen = große Ansicht
      });
    };
    if (part === 'pets' || part === 'aura') lfBar(b);
    if (part === 'pets') b.appendChild(uiEl('div', 'ds', 'Tipp: Tippe einen Begleiter an, dann siehst du ihn groß und alle Vorteile.'));
    if (!part || part === 'pets') [['pet', 'Begleiter (bis zu 2 gleichzeitig)']].forEach(cosList);
    if (!part || part === 'aura') { // v119: alle Effekte an einem Ort, mit Unterteilung
      const seg = document.createElement('div'); seg.className = 'tmseg'; [['aura', '✨ Auren'], ['orbit', '💫 Um dich herum'], ['trail', '👣 Spuren']].forEach(([k, t]) => { const c = document.createElement('button'); c.className = 'tmsg' + (fxSel === k ? ' on' : ''); c.textContent = t; c.addEventListener('click', () => { fxSel = k; renderPhone(); }); seg.appendChild(c); }); b.appendChild(seg);
      if (fxSel === 'aura') wearSection(b, 'aura', 'Auren (leuchten um dich)'); else if (fxSel === 'orbit') cosList(['orbit', 'Fliegt um dich herum (bis zu 2 gleichzeitig)']); else cosList(['trail', 'Spur beim Laufen']);
    }
    if (part === 'pets' || part === 'aura') lfApply(b);
    startPreviews(b);
    if (part && part !== 'figur' && part !== 'kopf') return;
    const hairOn = part !== 'figur', bodyOn = part !== 'kopf';
    const hd = document.createElement('div'); hd.className = 'grp'; hd.textContent = bodyOn ? 'Deine Figur' : 'Frisur'; b.appendChild(hd);
    const card = document.createElement('div'); card.className = 'card look';
    const hats = [['none', 'Ohne Hut'], ['cap', 'Kappe'], ['beanie', 'Mütze']], sizes = [[0.85, 'Klein'], [1, 'Normal'], [1.15, 'Groß']];
    const sw = (attr, list, fmtc) => list.map((c, i) => '<button class="sw" data-' + attr + '="' + i + '" style="background:' + fmtc(c) + '" aria-label="' + attr + ' ' + (i + 1) + '"></button>').join('');
    card.innerHTML = '<div style="display:flex;gap:14px;align-items:center"><canvas id="figPv" width="144" height="144" style="width:96px;height:96px;flex:none;border-radius:14px;background:rgba(255,255,255,.06)"></canvas><div class="ds" style="margin:0">Tippe auf die Figur, um sie zu drehen.</div></div>' +
      (bodyOn ? '<div class="grp2">Typ</div><div class="opts"><button class="chip" data-sex="m">Junge</button><button class="chip" data-sex="f">Mädchen</button></div>' : '') +
      (hairOn ? '<div class="grp2">Frisur (gratis)</div><div class="opts">' + HAIR_STYLES.map((n, i) => '<button class="chip" data-hs="' + i + '">' + n + '</button>').join('') + '</div>' +
      '<div class="grp2">Haarfarbe</div><div class="opts">' + sw('hair', HAIR_COLS, c => c) + '</div>' : '') +
      (bodyOn ? '<div class="grp2">Hautton</div><div class="opts">' + sw('skin', SKIN_COLS, c => c) + '</div>' +
      '<div class="grp2">Kleidung</div><div class="opts">' + sw('fit', OUTFITS, c => 'rgb(' + c.join(',') + ')') + '</div>' +
      '<div class="grp2">Mehr</div><div class="opts"><button class="chip" id="oOutline">Umriss</button>' +
      sizes.map(z => '<button class="chip" data-size="' + z[0] + '">' + z[1] + '</button>').join('') + '</div>' : '');
    b.appendChild(card);
    let pdir = 0; const DIRS = [0, 1, 3, 2]; // unten, links, oben, rechts
    const paint = () => {
      const pv = card.querySelector('#figPv'), c2 = pv && pv.getContext && pv.getContext('2d');
      if (c2) { const sc = ctx; try { ctx = c2; c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, 144, 144); c2.setTransform(4.4, 0, 0, 4.4, 0, 0); const ang = [Math.PI / 2, Math.PI, -Math.PI / 2, 0][pdir % 4]; drawFigure(16.4, 14, ang, 0, L); } finally { ctx = sc; } }
      card.querySelectorAll('[data-sex]').forEach(e => e.classList.toggle('on', e.dataset.sex === L.sex));
      card.querySelectorAll('[data-hs]').forEach(e => e.classList.toggle('on', +e.dataset.hs === L.hs));
      card.querySelectorAll('[data-hair]').forEach(e => e.classList.toggle('on', +e.dataset.hair === L.hair));
      card.querySelectorAll('[data-skin]').forEach(e => e.classList.toggle('on', +e.dataset.skin === L.skin));
      card.querySelectorAll('[data-fit]').forEach(e => { const o = OUTFITS[+e.dataset.fit]; e.classList.toggle('on', o[0] === L.r && o[1] === L.g && o[2] === L.b); });
      { const ol = card.querySelector('#oOutline'); if (ol) ol.classList.toggle('on', !!L.outline); }
      card.querySelectorAll('[data-hat]').forEach(e => e.classList.toggle('on', e.dataset.hat === L.hat));
      card.querySelectorAll('[data-size]').forEach(e => e.classList.toggle('on', +e.dataset.size === L.size));
    };
    const on = (sel, fn) => card.querySelectorAll(sel).forEach(e => e.addEventListener('click', () => { fn(e); save(); paint(); }));
    on('[data-sex]', e => { L.sex = e.dataset.sex; });
    on('[data-hs]', e => { L.hs = +e.dataset.hs; });
    on('[data-hair]', e => { L.hair = +e.dataset.hair; });
    on('[data-skin]', e => { L.skin = +e.dataset.skin; });
    on('[data-fit]', e => { const o = OUTFITS[+e.dataset.fit]; L.r = o[0]; L.g = o[1]; L.b = o[2]; });
    on('[data-size]', e => { L.size = +e.dataset.size; });
    on('#oOutline', () => { L.outline = !L.outline; });
    const pvc = card.querySelector('#figPv'); if (pvc) pvc.addEventListener('click', () => { pdir++; paint(); });
    paint();
    if (part === 'kopf') { wearSection(b, 'hat', 'Mützen und Kappen'); wearSection(b, 'band', 'Bandanas (am Kiosk)'); startPreviews(b); } // v79: Kopf = Frisur, Mützen, Bandanas
  }
  function openPhone() { if (state !== 'play') return; closeChat(); G.area = curKey; tmSel = player.fl === 2 && !prVisit ? 'pr' : ''; phoneOpen = true; $('phone').hidden = false; renderPhone(); }
  function closePhone() { petViewClose(); lfFlush(); lfTab = ''; phoneOpen = false; tab = 'home'; $('phone').hidden = true; save(); }


  // =====================================================================================================
  // v81: KARRIERE – Rufstufen, Charaktere mit Questketten, Mitarbeiter mit Erfahrung, Jahreszeiten und Ereignisse
  // Alles liegt in G.kr (wird mit dem Spielstand gespeichert, cleanKr repariert alte oder kaputte Daten).
  // Zeit: Jahreszeiten und Ereignisse laufen auf der Spieluhr (Tag + Uhrzeit). Ist das Spiel zu, steht die Uhr, also pausiert alles.
  // =====================================================================================================
  let KR_NEUTRAL = false; // nur fuer Tests: neue Effekte aus
  const absMin = () => G ? (G.day - 1) * 1440 + G.time : 0;
  const SEASON_DAYS = 7; // v92: 7 statt 5 Tage je Jahreszeit; G.sOff haelt alte Spielstaende in ihrer Jahreszeit
  const seaD = () => G.day - 1 + (G.sOff || 0);
  const SEASONS = [
    { id: 'fr', name: 'Frühling', ic: '🌸', col: '#FF9CC8', fx: { grow: 1.1, seed: 0.9 }, txt: ['Pflanzen wachsen 10 % schneller', 'Samen 10 % billiger', 'Gärtnerin Flora ist in ihrem Blumengarten', 'Sammle Ostereier'] },
    { id: 'so', name: 'Sommer', ic: '☀️', col: '#FFD24A', fx: { orders: 1.2, water: 1.3, p_brau: 1.15 }, txt: ['20 % mehr Bestellungen', 'Kristallboxen 15 % teurer', 'Töpfe trocknen 30 % schneller aus', 'DJ Jonas legt am Teich auf', 'Sammle Muscheln'] },
    { id: 'he', name: 'Herbst', ic: '🍂', col: '#E8833A', fx: { p_tabak: 1.15, p_keller: 1.05 }, txt: ['Tabak 15 % teurer', 'Kellerware 5 % teurer', 'Bauer Heinz sucht Erntehelfer', 'Sammle Kastanien'] },
    { id: 'wi', name: 'Winter', ic: '❄️', col: '#9FD4FF', fx: { grow: 0.92, upkeep: 1.3, p_vip: 1.2, orders: 0.92 }, txt: ['Heizkosten: Unterhalt +30 %', 'Pflanzen wachsen etwas langsamer', 'Spezialkunden zahlen 20 % mehr', 'Klaus steht am Weihnachtsstand', 'Sammle Schneekugeln'] }
  ];
  const seasonI = () => G ? Math.floor(seaD() / SEASON_DAYS) % 4 : 0;
  const season = () => SEASONS[seasonI()];
  const seasonYear = () => G ? Math.floor(seaD() / (SEASON_DAYS * 4)) + 1 : 1;
  const seasonDay = () => G ? (seaD() % SEASON_DAYS) + 1 : 1;
