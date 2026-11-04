  // =====================================================================================================
  // v179: Leistung messen (Admin → Werkzeuge). Misst 10 Sekunden lang die Bildrate und wie lange das Spiel pro Bild
  // rechnet, mit 5 Sekunden Vorlauf (Zeit, um z. B. ein 3D-Fenster zu öffnen). Die letzten 8 Messungen bleiben gespeichert.
  // =====================================================================================================
  const PERF = { on: false, t: [], w: [], t0: 0, last: 0, ctx: '' };
  const perfList = () => { try { const L = JSON.parse(localStorage.getItem('kellergruen.perf') || '[]'); return Array.isArray(L) ? L : []; } catch (e) { return []; } };
  function perfWhere() {
    if (workOpen && WK && WK.mode) return '3D-Fenster: ' + ({ plant: 'Pflanzen', water: 'Gießen', harvest: 'Ernten', rack: 'Gestell', pack: 'Packtisch' }[WK.mode] || WK.mode);
    try { const rk = AREA_KEYS.find(k => { const I = AREAS[k].IN; return player.x > I.x0 && player.x < I.x1 && player.y > I.y0 && player.y < I.y1; }); if (rk) return AREAS[rk].name; } catch (e) {}
    return 'Stadt' + (G && G.time >= 20 * 60 || G && G.time < 6 * 60 ? ' (Nacht)' : '');
  }
  function perfStart(delay) {
    if (PERF.on) return; try { closePhone(); } catch (e) {} msg('⏱️ Messung startet in ' + delay + ' s. Jetzt hingehen oder ein Fenster öffnen.');
    setTimeout(() => { PERF.on = true; PERF.t = []; PERF.w = []; PERF.last = 0; PERF.ctx = perfWhere(); PERF.t0 = performance.now(); msg('⏱️ Messe 10 Sekunden …'); const tick = ts => { if (!PERF.on) return; if (PERF.last) PERF.t.push(ts - PERF.last); PERF.last = ts; if (ts - PERF.t0 > 10000) perfDone(); else requestAnimationFrame(tick); }; requestAnimationFrame(tick); }, delay * 1000);
  }
  function perfDone() {
    PERF.on = false; const t = PERF.t.slice().sort((a, b) => a - b), n = t.length; if (n < 10) { msg('Messung zu kurz', true); return; }
    const avg = t.reduce((a, b) => a + b, 0) / n, p99 = t[Math.min(n - 1, Math.floor(n * 0.99))], w = PERF.w.slice().sort((a, b) => a - b), wa = w.length ? w.reduce((a, b) => a + b, 0) / w.length : 0, w95 = w.length ? w[Math.floor(w.length * 0.95)] : 0;
    const r = { d: Date.now(), v: GAME_VER, wo: PERF.ctx, fps: Math.round(1000 / avg), low: Math.round(1000 / p99), ms: +wa.toFixed(1), ms95: +w95.toFixed(1), ruck: t.filter(x => x > 50).length, set: (SPAR ? 'Spar' : GFX_Q ? 'Hoch' : 'Sparsam') + (LOFX ? ', wenig Effekte' : '') + ', DPR ' + (+DPR).toFixed(2), mp: mpPeers() };
    const L = perfList(); L.unshift(r); try { localStorage.setItem('kellergruen.perf', JSON.stringify(L.slice(0, 8))); } catch (e) {}
    msg('⏱️ ' + r.wo + ': ' + r.fps + ' FPS, schlechteste 1 %: ' + r.low + ' FPS, ' + r.ms + ' ms Rechenzeit', r.fps < 45, 'ok');
  }
  // Rechenzeit pro Bild (wird aus frame() aufgerufen)
  function perfWork(ms) { if (PERF.on) PERF.w.push(ms); }
  function perfCard(b, card, row, btn) {
    const c = card('⏱️ Leistung messen', 'Misst 10 Sekunden lang Bildrate und Rechenzeit pro Bild. Mit Vorlauf hast du 5 Sekunden Zeit, an einen Ort zu gehen oder ein 3D-Fenster zu öffnen. Grün ab 55 FPS, gelb ab 40, darunter rot. Rechenzeit über 8 ms wird auf älteren iPhones knapp.');
    const r = row(c); btn(r, 'Jetzt messen', () => perfStart(1)); btn(r, 'Mit 5 s Vorlauf', () => perfStart(5));
    const L = perfList(); if (!L.length) { const e = document.createElement('div'); e.className = 'ds'; e.style.marginTop = '8px'; e.textContent = 'Noch keine Messung.'; c.appendChild(e); return; }
    for (const x of L) { const e = document.createElement('div'); e.className = 'ds'; e.style.cssText = 'margin-top:8px;padding:6px 8px;border-radius:10px;background:rgba(255,255,255,.05)'; const col = x.fps >= 55 ? '#63C174' : x.fps >= 40 ? '#FFD24A' : '#FF5C7A';
      e.innerHTML = '<b style="color:' + col + '">' + x.fps + ' FPS</b> · schlechteste 1 %: ' + x.low + ' · ' + x.ms + ' ms (95 %: ' + x.ms95 + ' ms) · ' + x.ruck + ' Ruckler<br>' + x.wo + ' · ' + x.set + (x.mp ? ' · ' + x.mp + ' Mitspieler' : '') + ' · v' + x.v + ' · ' + new Date(x.d).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); c.appendChild(e); }
    const r2 = row(c); btn(r2, 'Liste leeren', () => { try { localStorage.removeItem('kellergruen.perf'); } catch (e) {} renderPhone(); }, 'alt');
  }
