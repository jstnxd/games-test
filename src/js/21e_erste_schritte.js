  // =====================================================================================================
  // v180: Erste Schritte für neue Spieler. Sechs kurze Ziele in der richtigen Reihenfolge, jedes mit einer kleinen
  // Belohnung, am Ende ein Bonus. Steht oben auf der Handy-Startseite, die Anzeige im Spiel bleibt wie sie ist.
  // Gespeichert in G.ui.tp (fs_*). Wer schon länger spielt, bekommt die Liste nicht mehr zu sehen.
  // =====================================================================================================
  const FS = [
    { id: 'plant', ic: '🌱', t: 'Einen Samen pflanzen', d: 'Im Keller an einen Topf gehen und A drücken', c: 20, ok: () => { try { return S(AREAS.keller).pots.some(p => p.s >= 1) || (G.kr && G.kr.cnt.hv > 0); } catch (e) { return false; } } },
    { id: 'water', ic: '💧', t: 'Die Pflanze gießen', d: 'Am Topf A drücken, wenn der Tropfen erscheint', c: 20, ok: () => (G.stat.wt || 0) > 0 || (G.kr && G.kr.cnt.hv > 0) || (() => { try { return S(AREAS.keller).pots.some(p => p.s >= 1 && p.w > 0.95 && p.p > 0.05); } catch (e) { return false; } })() },
    { id: 'harvest', ic: '✂️', t: 'Ernten', d: 'Ist die Pflanze reif, am Topf A drücken', c: 30, ok: () => !!(G.kr && G.kr.cnt.hv > 0) },
    { id: 'pack', ic: '🛍️', t: 'Trocknen und einpacken', d: 'Ans Trockengestell hängen, dann am Packtisch in Beutel packen', c: 30, ok: () => (G.stat.pk || 0) > 0 || totalBags() > 0 || (G.stat.del || 0) > 0 },
    { id: 'deliver', ic: '📦', t: 'Den ersten Kunden beliefern', d: 'Die Blase über einem Haus zeigt, wer etwas will', c: 50, ok: () => (G.stat.del || 0) > 0 },
    { id: 'up', ic: '🛒', t: 'Den ersten Ausbau kaufen', d: 'Handy → Geschäft → Ausbau', c: 80, ok: () => { try { return Object.keys(G.up).some(k => k !== 'compass' && G.up[k] > 0); } catch (e) { return false; } } }
  ];
  const FS_BONUS = 150;
  const fsDone = id => !!UI().tp['fs_' + id];
  const fsAll = () => !!UI().tp.fs_end;
  let fsT = 2;
  function fsTick(dt) {
    if (!G || state !== 'play' || STU.on) return; fsT -= dt; if (fsT > 0) return; fsT = 1.5; const u = UI();
    if (!u.tp.fs0) { u.tp.fs0 = 1; if ((G.stat.del || 0) > 2 || G.rep >= 3 || G.day > 3) { u.tp.fs_end = 1; for (const s of FS) u.tp['fs_' + s.id] = 1; return; } }
    if (u.tp.fs_end) return;
    const s = FS.find(x => !fsDone(x.id)); if (!s) return; let ok = false; try { ok = s.ok(); } catch (e) {} if (!ok) return;
    u.tp['fs_' + s.id] = 1; G.money += s.c; try { sfx.cash(); } catch (e) {} const nx = FS.find(x => !fsDone(x.id));
    msg('✓ Erste Schritte: ' + s.t + ' (+' + fmt(s.c) + ')' + (nx ? ' · Als Nächstes: ' + nx.t : ''), false, 'ok');
    if (!nx) { u.tp.fs_end = 1; G.money += FS_BONUS; addRep(1); setTimeout(() => { try { msg('🎉 Erste Schritte geschafft! Bonus +' + fmt(FS_BONUS) + ' und Ruf. Ab jetzt gibt es jeden Tag Tagesaufgaben unter Karriere → Heute', false, 'ok'); sfx.harvest(); } catch (e) {} }, 1800); }
    save();
  }
  // Karte auf der Handy-Startseite
  function fsCard(b) {
    if (!G || fsAll() || !UI().tp.fs0) return; const n = FS.filter(s => fsDone(s.id)).length, cur = FS.find(s => !fsDone(s.id));
    const c = document.createElement('div'); c.className = 'card fscard';
    c.innerHTML = '<div class="nm">🚀 Erste Schritte · ' + n + ' / ' + FS.length + '</div><div class="pr">+' + fmt(FS.reduce((a, s) => a + s.c, 0) + FS_BONUS) + '</div>'
      + '<div class="ds">' + FS.map(s => '<div class="fs-r' + (fsDone(s.id) ? ' ok' : s === cur ? ' cur' : '') + '"><i>' + (fsDone(s.id) ? '✓' : s.ic) + '</i><span><b>' + s.t + '</b>' + (s === cur ? '<br>' + s.d : '') + '</span><em>+' + fmt(s.c) + '</em></div>').join('') + '</div>';
    const bar = document.createElement('div'); bar.className = 'bar'; bar.innerHTML = '<i style="width:' + Math.round(n / FS.length * 100) + '%"></i>'; c.appendChild(bar); b.appendChild(c);
  }
