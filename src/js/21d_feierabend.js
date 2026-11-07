  // =====================================================================================================
  // v176: Feierabend-Rückblick. Am Ende jedes Spieltags (um Mitternacht) erscheint eine Karte mit dem, was du
  // heute geschafft hast: geerntet, gegossen, verpackt, beliefert, Kurierfahrten, Umsatz und Ruf. Rekorde werden
  // markiert. Die letzten 7 Tage stehen im Handy unter Karriere → Rückblick. Die Karte lässt sich als Bild teilen.
  // Gespeichert in G.lg.fa. Das Spiel läuft weiter, die Karte schließt sich nach 25 Sekunden von selbst.
  // =====================================================================================================
  const FA_KEYS = [
    ['earn', '💶', 'Umsatz', () => G.earned || 0],
    ['del', '📦', 'Kunden beliefert', () => G.stat.del || 0],
    ['hv', '🌱', 'Mal geerntet', () => (G.kr ? G.kr.cnt.hv : 0)],
    ['pk', '🛍️', 'selbst verpackt', () => G.stat.pk || 0],
    ['wt', '💧', 'Pflanzen gegossen', () => G.stat.wt || 0],
    ['kur', '🚚', 'Kurierfahrten', () => G.stat.kur || 0],
    ['vip', '★', 'Spezialkunden', () => G.stat.vip || 0],
    ['rep', '⭐', 'Ruf dazu', () => G.rep || 0]
  ];
  const faDef = () => ({ d: -1, s: {}, h: [], b: {}, cbD: 0 });
  function cleanFa(o) {
    const D = faDef(); if (!o || typeof o !== 'object') return D; const n = v => Math.max(0, Math.min(1e13, Number.isFinite(+v) ? Math.floor(+v) : 0));
    D.d = Number.isFinite(+o.d) ? Math.max(-1, Math.min(1e7, Math.floor(+o.d))) : -1;
    for (const [k] of FA_KEYS) { if (o.s && o.s[k] !== undefined) D.s[k] = n(o.s[k]); if (o.b && o.b[k] !== undefined) D.b[k] = n(o.b[k]); }
    D.cbD = Math.min(999, n(o.cbD)); if (o.b && o.b.cb !== undefined) D.b.cb = Math.min(999, n(o.b.cb));
    if (Array.isArray(o.h)) D.h = o.h.slice(-7).filter(x => x && typeof x === 'object').map(x => { const r = { d: n(x.d) }; for (const [k] of FA_KEYS) r[k] = n(x[k]); r.cb = Math.min(999, n(x.cb)); r.td = Math.max(0, Math.min(3, Math.floor(+x.td) || 0)); return r; });
    return D;
  }
  const FA = () => { const L = LG(); if (!L.fa || typeof L.fa !== 'object') L.fa = faDef(); return L.fa; };
  const faSnap = () => { const s = {}; for (const [k, , , v] of FA_KEYS) s[k] = Math.max(0, Math.floor(v())); return s; };
  let faT = 0, faPend = null;
  function faTick(dt) {
    if (!G || STU.on) return; faT -= dt; if (faT > 0) return; faT = 1;
    const D = FA();
    if (D.d < 0) { D.d = G.day; D.s = faSnap(); return; }
    if (D.d !== G.day) {
      const now = faSnap(), r = { d: D.d }; let any = 0; for (const [k] of FA_KEYS) { r[k] = Math.max(0, (now[k] || 0) - (D.s[k] || 0)); if (k !== 'rep' && r[k] > 0) any++; }
      try { const T = TD(); r.td = T.d === D.d ? T.g.filter(g => g.d).length : 0; } catch (e) { r.td = 0; }
      r.cb = D.cbD || 0; D.cbD = 0; if (r.cb >= 3) any++;
      const rec = {}; for (const k of ['earn', 'del', 'hv', 'pk', 'cb']) if (r[k] > 0 && r[k] > (D.b[k] || 0)) { if ((D.b[k] || 0) > 0) rec[k] = 1; D.b[k] = r[k]; }
      D.h.push(r); if (D.h.length > 7) D.h.splice(0, D.h.length - 7); D.d = G.day; D.s = now;
      if (any) faPend = { r, rec }; save();
    }
    if (faPend && state === 'play' && !phoneOpen && !workOpen && !FOTO.on) { const p = faPend; faPend = null; faShow(p.r, p.rec); }
  }
  // v191: Tageskosten (Löhne, Unterhalt, Steuern) auf der Karte, damit man sieht, wohin das Geld um Mitternacht geht
  function faCostHtml(r) { const c = dayCost; if (!c || c.d !== r.d || !c.total) return ''; const parts = [c.w && 'Löhne ' + fmt(c.w), c.u && 'Unterhalt ' + fmt(c.u), c.t && 'Steuern ' + fmt(c.t)].filter(Boolean).join(' · ');
    return '<div class="fa-f" style="color:' + (c.paid < c.total ? '#FF8FA3' : '#C9D6E3') + '">🧾 Tageskosten −' + fmt(c.paid) + ' (' + parts + ')' + (c.paid < c.total ? ' · Bargeld hat nicht gereicht' : '') + '</div>'; }
  function faRows(r) { const L = FA_KEYS.filter(([k]) => r[k] > 0).map(([k, ic, nm]) => [k, ic, k === 'earn' ? fmt(r[k]) : (k === 'rep' ? '+' : '') + r[k], nm]); if (r.cb >= 3) L.push(['cb', '🔥', 'x' + r.cb, 'beste Combo']); return L; }
  // v176: Combo beim Ernten und Packen (schnell hintereinander). Merkt sich die beste Combo des Tages.
  function faCombo(n) { try { const D = FA(); if (n > (D.cbD || 0)) D.cbD = n; } catch (e) {} }
  function faShow(r, rec) {
    let el = $('faCard'); if (!el) { el = document.createElement('div'); el.id = 'faCard'; document.body.appendChild(el); el.addEventListener('pointerdown', e => e.stopPropagation()); }
    const rows = faRows(r), nr = Object.keys(rec || {}).length;
    el.innerHTML = '<div class="fa-h"><div class="fa-t">🌙 Feierabend</div><div class="fa-d">Tag ' + r.d + (nr ? ' · <b>🏆 ' + nr + ' neue' + (nr === 1 ? 'r Rekord' : ' Rekorde') + '</b>' : '') + '</div></div>'
      + '<div class="fa-g">' + rows.map(([k, ic, v, nm]) => '<div class="fa-r' + (rec && rec[k] ? ' rec' : '') + '"><i>' + ic + '</i><b>' + v + '</b><span>' + nm + (rec && rec[k] ? ' 🏆' : '') + '</span></div>').join('') + '</div>'
      + faCostHtml(r)
      + '<div class="fa-f">' + (r.td ? '📋 Tagesaufgaben ' + r.td + ' / 3' : 'Morgen warten neue Tagesaufgaben') + '</div>'
      + '<div class="fa-b"><button class="fa-share">📸 Als Bild teilen</button><button class="fa-ok">Weiter</button></div>';
    el.hidden = false; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); try { sfx.ping(); } catch (e) {}
    const close = () => { el.classList.remove('on'); clearTimeout(el._t); setTimeout(() => { if (!el.classList.contains('on')) el.hidden = true; }, 260); };
    el.querySelector('.fa-ok').addEventListener('click', close); el.querySelector('.fa-share').addEventListener('click', () => faShare(r, rec));
    clearTimeout(el._t); el._t = setTimeout(close, 25000);
  }
  // Karte als Bild zeichnen (Hochformat, passt für Story und TikTok)
  function faImage(r, rec) {
    const c = document.createElement('canvas'), W = 1080, H = 1350; c.width = W; c.height = H; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1B2A3A'); g.addColorStop(1, '#0E141B'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 60; i++) { x.fillStyle = 'rgba(255,255,255,' + (0.15 + (i % 5) * 0.08) + ')'; x.beginPath(); x.arc((i * 197) % W, (i * 113) % 380, 1.5 + (i % 3), 0, 7); x.fill(); }
    x.fillStyle = '#FFE9A0'; x.beginPath(); x.arc(870, 170, 70, 0, 7); x.fill(); x.fillStyle = '#1B2A3A'; x.beginPath(); x.arc(840, 150, 64, 0, 7); x.fill();
    x.textAlign = 'left'; x.fillStyle = '#FFFFFF'; x.font = '900 92px Inter, system-ui, sans-serif'; x.fillText('Feierabend', 80, 210); x.fillStyle = '#9FB3C8'; x.font = '700 44px Inter, system-ui, sans-serif'; x.fillText('Tag ' + r.d + ' in Kellergrün', 84, 280);
    const rows = faRows(r); let y = 400;
    for (const [k, ic, v, nm] of rows.slice(0, 7)) { x.fillStyle = rec && rec[k] ? 'rgba(255,210,74,.18)' : 'rgba(255,255,255,.07)'; x.beginPath(); x.roundRect ? x.roundRect(70, y - 72, W - 140, 108, 28) : x.rect(70, y - 72, W - 140, 108); x.fill();
      x.font = '64px sans-serif'; x.fillText(ic, 100, y + 4); x.fillStyle = rec && rec[k] ? '#FFD24A' : '#FFFFFF'; x.font = '900 60px Inter, system-ui, sans-serif'; x.fillText(v, 210, y + 4); x.fillStyle = '#C9D6E3'; x.font = '700 38px Inter, system-ui, sans-serif'; x.textAlign = 'right'; x.fillText(nm + (rec && rec[k] ? ' 🏆' : ''), W - 100, y); x.textAlign = 'left'; y += 128; }
    x.fillStyle = '#63C174'; x.font = '900 40px Inter, system-ui, sans-serif'; x.textAlign = 'center'; x.fillText('🌿 Kellergrün · rein fiktiv', W / 2, H - 70); return c;
  }
  function faShare(r, rec) { try { faImage(r, rec).toBlob(b => shareFile(b, 'kellergruen_tag_' + r.d + '.png', 'Mein Tag ' + r.d + ' in Kellergrün'), 'image/png'); } catch (e) { msg('Teilen ging nicht', true); } }
  // Datei teilen (iPhone: Teilen-Menü mit "Bild sichern"), sonst herunterladen
  async function shareFile(blob, name, title) {
    if (!blob) { msg('Konnte die Datei nicht erstellen', true); return; }
    try { const f = new File([blob], name, { type: blob.type }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); msg('💾 Gespeichert: ' + name, false, 'ok'); } catch (e) { msg('Speichern ging nicht', true); }
  }
  // Handy → Karriere → Rückblick
  function renderRueck(b) {
    const D = FA(); krGrp(b, 'Rückblick · letzte 7 Tage');
    uiInfo(b, 'Jeden Abend um Mitternacht zeigt dir eine Karte, was du an dem Tag geschafft hast. Hier stehen die letzten Tage und deine besten Werte.');
    { const nw = faSnap(), r = { d: G.day, cb: D.cbD || 0 }; for (const [k] of FA_KEYS) r[k] = Math.max(0, (nw[k] || 0) - (D.s[k] || 0)); const rows = faRows(r); krCard(b, '☀️ Heute bisher · Tag ' + G.day, fmt(r.earn), rows.length ? rows.filter(x => x[0] !== 'earn').map(x => x[1] + ' ' + x[2]).join(' · ') : 'noch nichts'); }
    if (!D.h.length) b.appendChild(uiEl('div', 'empty', 'Noch kein Feierabend. Spiel bis Mitternacht, dann erscheint dein erster Rückblick.'));
    for (const r of D.h.slice().reverse()) { const rows = faRows(r), c = krCard(b, '🌙 Tag ' + r.d, fmt(r.earn), (rows.filter(x => x[0] !== 'earn').map(x => x[1] + ' ' + x[2]).join(' · ') || '–') + (r.td ? '<br>📋 ' + r.td + ' / 3 Tagesaufgaben' : '')); const bt = uiEl('button', 'buy', 'Ansehen'); bt.addEventListener('click', () => { closePhone(); faShow(r, {}); }); c.appendChild(bt); }
    const best = FA_KEYS.filter(([k]) => D.b[k] > 0); if (D.b.cb >= 3) best.push(['cb', '🔥', 'beste Combo']); if (best.length) krCard(b, '🏆 Deine besten Tage', '', best.map(([k, ic, nm]) => ic + ' ' + (k === 'earn' ? fmt(D.b[k]) : k === 'cb' ? 'x' + D.b[k] : D.b[k]) + ' ' + nm).join('<br>'));
  }
