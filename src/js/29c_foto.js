  // =====================================================================================================
  // v176: Kamera für alle Spieler. Foto- und Videomodus ohne Anzeigen, mit Filtern, Zoom, freier Kamera,
  // Kino-Balken und kleinem Logo. Fotos und Videos (10, 15 oder 30 Sekunden, mit Spielton) lassen sich
  // direkt teilen oder speichern. Nur auf diesem Gerät, nichts wird hochgeladen.
  // Dazu der Sparmodus: ein Schalter für alle Spar-Einstellungen auf einmal.
  // =====================================================================================================
  const FOTO = { on: false, f: 0, zoom: 1, free: false, cam: null, logo: true, bars: false, bar: true, rec: null, dur: 15, ptr: new Map(), pd: 0, pz: 1 };
  try { const o = JSON.parse(localStorage.getItem('kellergruen.foto') || '{}'); if (o && typeof o === 'object') { FOTO.f = Math.max(0, Math.min(6, +o.f || 0)); FOTO.logo = o.logo !== 0; FOTO.bars = !!o.bars; FOTO.dur = [10, 15, 30].includes(+o.dur) ? +o.dur : 15; } } catch (e) {}
  const fotoKeep = () => { try { localStorage.setItem('kellergruen.foto', JSON.stringify({ f: FOTO.f, logo: FOTO.logo ? 1 : 0, bars: FOTO.bars ? 1 : 0, dur: FOTO.dur })); } catch (e) {} };
  const FOTO_F = ['Normal', 'Warm', 'Kühl', 'Neon', 'Schwarz-Weiß', 'Retro', 'Traum'];
  // Kamera-Ziel: Studio vor Foto, beides nur im Spiel
  function camOver() { if (state !== 'play') return null; if (STU.on && STU.cam) return STU.cam; if (FOTO.on && FOTO.free && FOTO.cam) return FOTO.cam; return null; }
  const fotoZoom = () => (FOTO.on ? FOTO.zoom : 1);
  function fotoStart() {
    if (state !== 'play') return; try { closePhone(); } catch (e) {} FOTO.on = true; FOTO.free = false; FOTO.cam = null; FOTO.zoom = 1; FOTO.bar = true; joy.id = null; joy.dx = joy.dy = 0;
    document.body.classList.add('shot', 'foto'); fotoBar(); try { msg('📸 Kamera an. Tippe 👁, um die Leiste auszublenden'); } catch (e) {}
  }
  function fotoEnd() {
    if (!FOTO.on) return; if (FOTO.rec) { try { FOTO.rec.stop(); } catch (e) {} } FOTO.on = false; FOTO.free = false; FOTO.cam = null; FOTO.ptr.clear();
    document.body.classList.remove('foto'); document.body.classList.toggle('shot', !!(STU.cine || shotUntil > 0)); for (const id of ['fotoBar', 'fotoShow']) { const e = $(id); if (e) e.hidden = true; }
  }
  function fotoEl(id, cls) { let e = $(id); if (!e) { e = document.createElement('div'); e.id = id; if (cls) e.className = cls; document.body.appendChild(e); e.addEventListener('pointerdown', x => x.stopPropagation()); } return e; }
  function fotoBar() {
    const b = fotoEl('fotoBar'), sh = fotoEl('fotoShow'); sh.textContent = FOTO.rec ? '⏺' : '📸'; sh.classList.toggle('rec', !!FOTO.rec); sh.hidden = !FOTO.on || FOTO.bar; b.hidden = !FOTO.on || !FOTO.bar; if (!FOTO.on) return;
    if (!sh._b) { sh._b = 1; sh.addEventListener('click', () => { FOTO.bar = true; fotoBar(); }); }
    const left = FOTO.rec ? Math.max(0, Math.ceil(FOTO.dur - (performance.now() - FOTO.recT0) / 1000)) : 0;
    b.innerHTML = '<button data-a="x" title="Beenden">✕</button><button data-a="f">🎨 ' + FOTO_F[FOTO.f] + '</button><button data-a="zo">−</button><button data-a="zi">+</button>'
      + '<button data-a="cam" class="' + (FOTO.free ? 'on' : '') + '">' + (FOTO.free ? '✋ Frei' : '🚶 Folgen') + '</button><button data-a="bars" class="' + (FOTO.bars ? 'on' : '') + '">🎬</button><button data-a="logo" class="' + (FOTO.logo ? 'on' : '') + '">🌿</button>'
      + '<button data-a="shot" class="big">📸</button><button data-a="rec" class="big ' + (FOTO.rec ? 'rec' : '') + '">' + (FOTO.rec ? '⏹ ' + left + ' s' : '⏺ ' + FOTO.dur + ' s') + '</button><button data-a="hide" title="Leiste ausblenden">👁</button>';
    b.querySelectorAll('button').forEach(e => e.addEventListener('click', () => fotoAct(e.dataset.a)));
  }
  function fotoAct(a) {
    if (a === 'x') fotoEnd();
    else if (a === 'f') { FOTO.f = (FOTO.f + 1) % FOTO_F.length; fotoKeep(); }
    else if (a === 'zo') FOTO.zoom = Math.max(0.6, +(FOTO.zoom - 0.2).toFixed(2));
    else if (a === 'zi') FOTO.zoom = Math.min(2.4, +(FOTO.zoom + 0.2).toFixed(2));
    else if (a === 'cam') { FOTO.free = !FOTO.free; FOTO.cam = FOTO.free ? { x: cam.x, y: cam.y } : null; joy.id = null; joy.dx = joy.dy = 0; if (FOTO.free) msg('✋ Ziehen verschiebt die Kamera, mit zwei Fingern zoomen'); }
    else if (a === 'bars') { FOTO.bars = !FOTO.bars; fotoKeep(); }
    else if (a === 'logo') { FOTO.logo = !FOTO.logo; fotoKeep(); }
    else if (a === 'shot') fotoShot();
    else if (a === 'rec') fotoRec();
    else if (a === 'hide') { FOTO.bar = false; }
    if (FOTO.on) fotoBar();
  }
  // Freie Kamera: ein Finger verschiebt, zwei Finger zoomen
  function fotoPtr(e, ph) {
    if (!FOTO.on || !FOTO.free) return false; const P = FOTO.ptr;
    if (ph === 0) { e.preventDefault(); P.set(e.pointerId, { x: e.clientX, y: e.clientY }); try { cv.setPointerCapture(e.pointerId); } catch (x) {} if (P.size === 2) { const [a, b] = [...P.values()]; FOTO.pd = Math.hypot(a.x - b.x, a.y - b.y); FOTO.pz = FOTO.zoom; } return true; }
    if (ph === 1) { const p = P.get(e.pointerId); if (!p) return true; if (P.size >= 2) { p.x = e.clientX; p.y = e.clientY; const [a, b] = [...P.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (FOTO.pd > 10) FOTO.zoom = Math.max(0.6, Math.min(2.4, FOTO.pz * d / FOTO.pd)); return true; }
      const sc = (isPort() ? W / 340 : H / 330) * FOTO.zoom; if (FOTO.cam) { FOTO.cam.x = clamp(FOTO.cam.x - (e.clientX - p.x) / sc, XMIN, WW); FOTO.cam.y = clamp(FOTO.cam.y - (e.clientY - p.y) / sc, YMIN, WH); } p.x = e.clientX; p.y = e.clientY; return true; }
    P.delete(e.pointerId); return true;
  }
  try { cv.addEventListener('wheel', e => { if (!FOTO.on) return; e.preventDefault(); FOTO.zoom = Math.max(0.6, Math.min(2.4, FOTO.zoom * (e.deltaY > 0 ? 0.9 : 1.1))); }, { passive: false }); } catch (e) {}
  window.addEventListener('keydown', e => { if (FOTO.on && e.key === 'Escape') { e.preventDefault(); fotoEnd(); } });
  // Filter, Kino-Balken und Logo werden ins Bild gezeichnet, damit sie auch im Foto und im Video sind
  function fotoVig(a) { const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.62); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,' + a + ')'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  function fotoDraw() {
    if (!FOTO.on) return; ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); const f = FOTO.f, fill = (op, col, a) => { ctx.globalCompositeOperation = op; ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); };
    if (f === 1) { fill('soft-light', '#FF9A3C', 0.45); fill('source-over', '#FFB060', 0.05); ctx.globalAlpha = 1; fotoVig(0.35); }
    else if (f === 2) { fill('soft-light', '#3C8CFF', 0.45); fill('source-over', '#A8D8FF', 0.04); ctx.globalAlpha = 1; fotoVig(0.35); }
    else if (f === 3) { ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.3; const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#FF2BD6'); g.addColorStop(1, '#2BE0FF'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; fotoVig(0.5); }
    else if (f === 4) { fill('saturation', '#808080', 1); fill('soft-light', '#000000', 0.25); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; fotoVig(0.45); }
    else if (f === 5) { fill('saturation', '#808080', 0.55); fill('soft-light', '#C07A30', 0.6); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.06; for (let i = 0; i < 260; i++) { ctx.fillStyle = i % 2 ? '#FFFFFF' : '#000000'; ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5); } ctx.globalAlpha = 1; fotoVig(0.6); }
    else if (f === 6) { fill('screen', '#FFB8E8', 0.14); fill('soft-light', '#FFFFFF', 0.3); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; fotoVig(0.2); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    if (FOTO.bars) { const h = Math.round(H * 0.085); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h); }
    if (FOTO.logo) { const s = Math.max(12, Math.min(20, Math.min(W, H) * 0.035)); ctx.font = '900 ' + s + 'px Inter, system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; const y = H - (FOTO.bars ? H * 0.085 : 0) - s * 0.9;
      ctx.lineWidth = s * 0.28; ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.strokeText('🌿 Kellergrün', W - s * 0.9, y); ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillText('🌿 Kellergrün', W - s * 0.9, y); ctx.textAlign = 'left'; }
    ctx.restore();
  }
  const fotoStamp = () => { const d = new Date(), p = n => String(n).padStart(2, '0'); return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()); };
  function fotoFlash() { const f = fotoEl('fotoFlash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); try { tone(1800, 0.04, 'square', 0.05); tone(900, 0.08, 'triangle', 0.06, 0, 0.05); } catch (e) {} }
  function fotoShot() { fotoFlash(); try { cv.toBlob(b => fotoReady(b, 'kellergruen_' + fotoStamp() + '.png', false), 'image/png'); } catch (e) { msg('Foto ging nicht', true); } }
  function fotoRec() {
    if (FOTO.rec) { try { FOTO.rec.stop(); } catch (e) {} return; }
    if (!cv.captureStream || !window.MediaRecorder) { msg('Videos kann dieser Browser leider nicht aufnehmen. Fotos gehen.', true); return; }
    let st; try { st = cv.captureStream(30); } catch (e) { msg('Video ging nicht', true); return; }
    let aDst = null; try { if (ac && master && ac.createMediaStreamDestination) { aDst = ac.createMediaStreamDestination(); master.connect(aDst); aDst.stream.getAudioTracks().forEach(t => st.addTrack(t)); } } catch (e) { aDst = null; }
    const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'], mt = types.find(t => { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }) || '';
    let r; try { r = new MediaRecorder(st, Object.assign({ videoBitsPerSecond: 8000000 }, mt ? { mimeType: mt } : {})); } catch (e) { try { r = new MediaRecorder(st); } catch (x) { msg('Video ging nicht', true); return; } }
    const ch = []; r.ondataavailable = e => { if (e.data && e.data.size) ch.push(e.data); };
    r.onstop = () => { clearTimeout(FOTO.recTo); clearInterval(FOTO.recIv); FOTO.rec = null; try { if (aDst) master.disconnect(aDst); } catch (e) {} try { st.getTracks().forEach(t => t.stop()); } catch (e) {}
      const type = (r.mimeType || mt || 'video/webm').split(';')[0], blob = new Blob(ch, { type }); fotoBar(); fotoReady(blob, 'kellergruen_' + fotoStamp() + (/mp4/.test(type) ? '.mp4' : '.webm'), true); };
    try { r.start(500); } catch (e) { msg('Video ging nicht', true); return; }
    FOTO.rec = r; FOTO.recT0 = performance.now(); FOTO.recTo = setTimeout(() => { if (FOTO.rec === r) r.stop(); }, FOTO.dur * 1000); FOTO.recIv = setInterval(() => { if (FOTO.on && FOTO.bar) fotoBar(); }, 500);
    try { tone(660, 0.1, 'sine', 0.06); } catch (e) {} fotoBar();
  }
  // Fertig: Vorschau mit Teilen und Verwerfen (Teilen braucht auf dem iPhone ein Antippen)
  function fotoReady(blob, name, vid) {
    if (!blob || !blob.size) { msg('Aufnahme war leer', true); return; } const p = fotoEl('fotoPanel'), u = URL.createObjectURL(blob);
    p.innerHTML = '<div class="fp-in">' + (vid ? '<video src="' + u + '" autoplay loop muted playsinline></video>' : '<img src="' + u + '" alt="">') + '<div class="fp-t">' + (vid ? '🎬 Video fertig' : '📸 Foto fertig') + ' · ' + Math.max(1, Math.round(blob.size / 1024)) + ' KB</div><div class="fp-b"><button class="fp-s">Teilen oder sichern</button><button class="fp-x">Schließen</button></div>'
      + (vid && /webm/.test(name) ? '<div class="fp-h">Hinweis: Dein Browser speichert WebM. TikTok nimmt das meist an, sonst vorher umwandeln.</div>' : '') + '</div>';
    p.hidden = false; const close = () => { p.hidden = true; p.innerHTML = ''; setTimeout(() => URL.revokeObjectURL(u), 2000); };
    p.querySelector('.fp-s').addEventListener('click', () => shareFile(blob, name, 'Kellergrün')); p.querySelector('.fp-x').addEventListener('click', close);
  }
  // Handy → Kamera
  function renderKamera(b) {
    const c = uiEl('div', 'card look'); c.innerHTML = '<div class="nm">📸 Foto- und Videomodus</div><div class="ds" style="margin:2px 0 8px">Blendet alle Anzeigen aus. Oben ist eine kleine Leiste: Filter, Zoom, freie Kamera (mit dem Finger verschieben), Kino-Balken, Logo, Foto und Video. Mit 👁 verschwindet auch die Leiste, das kleine 📸 in der Ecke holt sie zurück. Die Leiste ist nie mit im Bild. Für TikTok das Handy hochkant halten.</div>';
    const bt = uiEl('button', 'buy', 'Kamera starten'); bt.style.gridColumn = '1 / -1'; bt.addEventListener('click', fotoStart); c.appendChild(bt); b.appendChild(c);
    const chips = (title, ds, opts, cur, fn) => { const k = uiEl('div', 'card look'); k.innerHTML = '<div class="nm">' + title + '</div><div class="ds" style="margin:2px 0 8px">' + ds + '</div><div class="chips">' + opts.map((o, i) => '<button class="chip' + (cur(i) ? ' on' : '') + '" data-i="' + i + '">' + o + '</button>').join('') + '</div>'; k.querySelectorAll('[data-i]').forEach(e => e.addEventListener('click', () => { fn(+e.dataset.i); fotoKeep(); renderPhone(); })); b.appendChild(k); };
    chips('🎬 Videolänge', 'So lange läuft eine Aufnahme. Mit ⏹ hörst du früher auf. Der Spielton ist mit drin.', ['10 s', '15 s', '30 s'], i => FOTO.dur === [10, 15, 30][i], i => { FOTO.dur = [10, 15, 30][i]; });
    chips('🎨 Filter', 'Startfilter. In der Leiste wechselst du mit einem Tipp.', FOTO_F, i => FOTO.f === i, i => { FOTO.f = i; });
    chips('🌿 Logo unten rechts', 'Kleiner Schriftzug „Kellergrün" im Bild, damit man weiß, woher der Clip ist.', ['An', 'Aus'], i => FOTO.logo === (i === 0), i => { FOTO.logo = i === 0; });
    chips('🎞️ Kino-Balken', 'Schwarze Balken oben und unten wie im Film.', ['An', 'Aus'], i => FOTO.bars === (i === 0), i => { FOTO.bars = i === 0; });
    uiInfo(b, 'Tipps: Nachts mit dem Neon-Filter durch die Stadt fahren, bei Gewitter Schwarz-Weiß probieren, mit „Frei“ und Zoom über die ganze Stadt schauen. Alles bleibt auf deinem Gerät.');
  }
  // ---------- Sparmodus ----------
  function sparSet(on) {
    on = !!on; if (on === SPAR) return;
    if (on) { try { localStorage.setItem('kellergruen.spar0', JSON.stringify({ gq: GFX_Q, gfx: GFX_FX ? 1 : 0, lofx: lofxUser ? 1 : 0, cap: capOn ? 1 : 0 })); } catch (e) {}
      GFX_Q = 0; GFX_FX = false; try { localStorage.setItem('kellergruen.gq', '0'); localStorage.setItem('kellergruen.gfx', '0'); } catch (e) {} setLofx(true); setCap(true); }
    else { let o = {}; try { o = JSON.parse(localStorage.getItem('kellergruen.spar0') || '{}') || {}; } catch (e) {}
      GFX_Q = o.gq === 0 ? 0 : 1; GFX_FX = o.gfx !== 0; try { localStorage.setItem('kellergruen.gq', String(GFX_Q)); localStorage.setItem('kellergruen.gfx', GFX_FX ? '1' : '0'); } catch (e) {} setLofx(!!o.lofx); setCap(!!o.cap); }
    SPAR = on; try { localStorage.setItem('kellergruen.spar', on ? '1' : '0'); } catch (e) {} resize(); msg(on ? '🔋 Sparmodus an' : '🔋 Sparmodus aus, deine Einstellungen sind zurück', false, 'ok');
  }
  function sparCard(b) {
    const c = uiEl('div', 'card look'); c.innerHTML = '<div class="nm">🔋 Sparmodus</div><div class="ds" style="margin:2px 0 8px">Ein Schalter für alles: geringere Auflösung, kein Farbfilter, weniger Effekte (kein Regen, Nebel und Tierschatten), höchstens 60 Bilder pro Sekunde und weniger Teilchen in den 3D-Fenstern. Gut für ältere Handys und wenn ihr zu mehreren spielt. Aus stellt deine vorherigen Einstellungen wieder her.</div><div class="chips"><button class="chip" data-sp="1">An</button><button class="chip" data-sp="0">Aus</button></div>';
    c.querySelectorAll('[data-sp]').forEach(e => { e.classList.toggle('on', (e.dataset.sp === '1') === SPAR); e.addEventListener('click', () => { sparSet(e.dataset.sp === '1'); renderPhone(); }); }); b.appendChild(c);
  }
  // Ruckelt das Spiel über längere Zeit, während andere Spieler da sind, kommt einmal ein Hinweis auf den Sparmodus
  let sparSlow = 0, sparHint = (() => { try { return localStorage.getItem('kellergruen.sparHint') === '1'; } catch (e) { return false; } })();
  let sparLast = 0;
  function sparTick(dt) {
    const now = performance.now(), rdt = sparLast ? (now - sparLast) / 1000 : 0; sparLast = now; if (document.hidden || rdt > 0.5) return;
    if (SPAR || sparHint || STU.on || state !== 'play' || phoneOpen) return; const slow = rdt > 0.034; sparSlow = Math.max(0, sparSlow + (slow ? dt : -dt * 0.5));
    if (sparSlow > 12) { sparHint = true; try { localStorage.setItem('kellergruen.sparHint', '1'); } catch (e) {} msg('🔋 Ruckelt es? ' + (mpPeers() ? 'Mit Mitspielern hilft' : 'Hilft') + ' der Sparmodus: Handy → Einstellungen → Anzeige', false, 'ok'); }
  }
