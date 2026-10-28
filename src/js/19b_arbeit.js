  // =====================================================================================================
  // v163/v164: Arbeitsfenster in 3D. Statt nur A zu drücken, macht man die Arbeit selbst:
  // gießen (Kanne über den Topf halten), ernten (Knospen antippen), am Gestell aufhängen und abnehmen,
  // am Packtisch Knospen in den offenen Beutel legen, verschließen und den Beutel in die Kiste ziehen.
  // Gilt für Keller, Etagen, Scheune und Mietraum (nicht fürs Labor). Helfer arbeiten weiter automatisch.
  // Lädt 3D nicht, läuft alles wie früher per Knopfdruck. Alles rein fiktiv und stilisiert.
  // =====================================================================================================
  let workOpen = false, WK = null, THREEp = null, THREE3 = null;
  let workOn = (() => { try { return localStorage.getItem('kellergruen.work') !== '0'; } catch (e) { return true; } })();
  function setWorkOn(v) { workOn = !!v; try { localStorage.setItem('kellergruen.work', workOn ? '1' : '0'); } catch (e) {} if (workOn) loadThree(); }
  function loadThree() {
    if (THREEp || typeof document === 'undefined' || !document.createElement || typeof location === 'undefined' || !/^https?:/.test(location.protocol || '')) return THREEp;
    try { THREEp = import('./three.module.min.js').then(m => { THREE3 = m; return m; }).catch(() => { THREE3 = null; return null; }); } catch (e) { THREEp = Promise.resolve(null); }
    return THREEp;
  }
  try { if (workOn && typeof setTimeout === 'function') { const t = setTimeout(() => loadThree(), 3000); if (t && t.unref) t.unref(); } } catch (e) {}
  const workKind = ar => ar && ar.key === 'tabak' ? 'leaf' : 'bud';
  const workAreaOk = ar => !!ar && ar.key !== 'brau';
  // Entscheidet, ob ein Fenster aufgeht. false heißt: wie früher per Knopfdruck weitermachen.
  function workTry(tg) {
    if (!workOn || !tg || !workAreaOk(tg.ar)) return false; loadThree(); if (!THREE3) return false;
    const ar = tg.ar, st = S(ar), inv = st.inv;
    if (tg.type === 'pot') { const p = potOf(tg); if (p.s === 1) return workStart('water', tg); if (p.s === 2) { if (inv.fresh + harvestYield(ar) > unitCap() + 6) return false; return workStart('harvest', tg); } return false; }
    if (tg.type === 'rack') { if (inv.fresh > 0 || Math.floor(st.rack.dry) >= 1) return workStart('rack', tg); return false; }
    if (tg.type === 'table') { const can = inv.dried >= ar.packN || st.tab.dry >= ar.packN - 1e-6; if (can && packRoom(ar)) return workStart('pack', tg); return false; }
    return false;
  }
  // ---------- Fenster ----------
  function workEl() {
    if (WK && WK.el) return WK.el;
    const el = document.createElement('div'); el.className = 'work'; el.hidden = true;
    el.innerHTML = '<div class="wcard"><div class="whead"><div class="wtt"><div class="wt"></div><div class="whint"></div></div><button class="wx" aria-label="Schließen">✕</button></div><div class="wstage"><canvas class="wcv"></canvas><div class="wcount"></div><div class="wbtns"></div></div></div>';
    document.body.appendChild(el); el.querySelector('.wx').addEventListener('click', () => workClose()); WK = { el }; return el;
  }
  function workStart(mode, tg) {
    try {
      const el = workEl(), T = THREE3; if (!T) return false; const cv = el.querySelector('.wcv'), ar = tg.ar, L = ar.lbl || {};
      if (!WK.r) { WK.r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); WK.r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); if (T.SRGBColorSpace) WK.r.outputColorSpace = T.SRGBColorSpace; if (T.NoToneMapping !== undefined) WK.r.toneMapping = T.NoToneMapping; }
      Object.assign(WK, { mode, tg, ar, L, kind: workKind(ar), anim: [], t: 0, last: 0, done: false, drag: false, holding: false, gc: {}, packSt: '', packFrom: 0 });
      el.hidden = false; workOpen = true; joy.id = null; joy.dx = joy.dy = 0; aHeld = false; bHeld = false;
      const title = { water: (L.water || 'Gießen'), harvest: (L.harvest || 'Ernten'), rack: (L.rack || 'Gestell'), pack: (L.table || 'Packtisch') }[mode];
      el.querySelector('.wt').textContent = ({ water: '💧 ', harvest: '✂️ ', rack: '🧺 ', pack: '📦 ' }[mode] || '') + title; WK.btns = el.querySelector('.wbtns'); WK.btns.innerHTML = ''; WK.hintEl = el.querySelector('.whint'); WK.cntEl = el.querySelector('.wcount');
      workBuild(mode); workResize(); workFit(); workBind(cv); WK.loop = requestAnimationFrame(workFrame); return true;
    } catch (e) { try { workClose(); } catch (x) {} return false; }
  }
  function workClose() {
    workOpen = false; if (!WK) return;
    if (WK.mode === 'pack' && WK.ar) { if (WK.packSt === 'sealed') packCredit(true); else if (WK.packFrom > 0) S(WK.ar).inv.dried += WK.packFrom; WK.packFrom = 0; WK.packSt = ''; }
    if (WK.el) WK.el.hidden = true;
    if (WK.loop) cancelAnimationFrame(WK.loop); WK.loop = 0; WK.drag = false; WK.holding = false;
    if (WK.scene) { WK.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); } }); WK.scene = null; }
    try { save(); } catch (e) {}
  }
  function workResize() { const cv = WK.el.querySelector('.wcv'), box = cv.parentElement, w = box.clientWidth || 600, h = box.clientHeight || 320; WK.r.setSize(w, h, false); cv.style.width = w + 'px'; cv.style.height = h + 'px'; if (WK.cam) { WK.cam.aspect = w / h; WK.cam.updateProjectionMatrix(); workFit(); } }
  // Kamera so weit zurück, dass Breite w und Höhe h um die Mitte c ganz zu sehen sind
  function workFit() { const f = WK.fit, c = WK.cam; if (!f || !c) return; const t = Math.tan(c.fov * Math.PI / 360), d = Math.max(f.h / 2 / t, f.w / 2 / (t * c.aspect)) * 1.08; c.position.copy(f.c).addScaledVector(f.dir, d); c.lookAt(f.c); }
  function workBtn(txt, fn, cls) { const b = document.createElement('button'); b.textContent = txt; if (cls) b.className = cls; b.addEventListener('click', fn); WK.btns.appendChild(b); return b; }
  // ---------- 3D-Bausteine ----------
  // v171: Comic-Look wie im Spiel: drei Helligkeitsstufen, dunkle Umrisse, weiche runde Bodenschatten
  function toonGrad() { if (WK.gc.grad) return WK.gc.grad; const T = THREE3, d = new Uint8Array([120, 120, 120, 255, 190, 190, 190, 255, 255, 255, 255, 255]), t = new T.DataTexture(d, 3, 1, T.RGBAFormat); t.minFilter = t.magFilter = T.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return (WK.gc.grad = t); }
  const mOpt = o => { const r = Object.assign({}, o || {}); delete r.roughness; delete r.metalness; return r; };
  const M = (c, o) => { const k = c + JSON.stringify(o || {}); if (WK.gc[k]) return WK.gc[k]; return (WK.gc[k] = new THREE3.MeshToonMaterial(Object.assign({ color: c, gradientMap: toonGrad() }, mOpt(o)))); };
  const M1 = (c, o) => new THREE3.MeshToonMaterial(Object.assign({ color: c, gradientMap: toonGrad() }, mOpt(o)));
  // Umriss: dieselbe Form etwas größer, nur die Rückseiten in Dunkel
  function OL(m, k) { const T = THREE3, mat = WK.gc.olm || (WK.gc.olm = new T.MeshBasicMaterial({ color: '#10151C', side: T.BackSide })), o = new T.Mesh(m.geometry, mat); o.scale.setScalar(1 + (k || 0.06)); o.userData.ol = true; m.add(o); return m; }
  function cvTex(w, h, fn, rx, ry) { const T = THREE3, c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn(x, w, h); const t = new T.CanvasTexture(c); if (T.SRGBColorSpace) t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx || 1, ry || 1); t.anisotropy = 4; return t; }
  function blob(T, w, d, y, a, par) { const tex = WK.gc.blobT || (WK.gc.blobT = cvTex(64, 64, (x, W) => { const g = x.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); }));
    const m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: a || 0.45, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = y || 0.003; (par || WK.root).add(m); return m; }
  // Holz mit Brettfugen wie der Packtisch im Spiel
  const woodTex = (base, line, n, vert) => cvTex(256, 256, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); for (let i = 0; i < n; i++) { const p = i * (vert ? w : h) / n; x.fillStyle = line; if (vert) x.fillRect(p, 0, 3, h); else x.fillRect(0, p, w, 3); x.fillStyle = 'rgba(255,255,255,.06)'; if (vert) x.fillRect(p + 3, 0, 2, h); else x.fillRect(0, p + 3, w, 2); }
    x.globalAlpha = 0.08; for (let i = 0; i < 40; i++) { x.fillStyle = i % 2 ? '#000' : '#fff'; const a = (i * 53) % w, b = (i * 97) % h; if (vert) x.fillRect(a, b, 1, 30 + (i % 5) * 10); else x.fillRect(b, a, 30 + (i % 5) * 10, 1); } x.globalAlpha = 1; });
  const MTX = (map, c) => new THREE3.MeshToonMaterial({ map, color: c || '#FFFFFF', gradientMap: toonGrad() });
  const GEO = (k, fn) => WK.gc['g|' + k] || (WK.gc['g|' + k] = fn());
  // Blattfläche als Gitter: Länge entlang +Y, Breite wf(t, Reihe), hängt nach hinten (droop) und ist in der Mitte gefaltet (fold)
  function leafGeo(T, len, wf, N, Mw, droop, fold, zf) {
    const pos = [], idx = [], cols = Mw * 2 + 1;
    for (let i = 0; i <= N; i++) { const t = i / N, w = wf(t, i); for (let j = 0; j < cols; j++) { const u = j / Mw - 1, x = u * w, y = t * len; pos.push(x, y, -droop * t * t * len + fold * Math.abs(x) + (zf ? zf(t, u) : 0)); } }
    for (let i = 0; i < N; i++) for (let j = 0; j < cols - 1; j++) { const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  }
  // Gezacktes Fingerblatt (Länge 1, wird skaliert)
  const leafletG = T => GEO('leaflet', () => leafGeo(T, 1, (t, i) => 0.125 * Math.sin(Math.PI * Math.pow(t, 0.72)) * (i % 2 ? 0.78 : 1), 18, 2, 0.28, 0.35));
  // Fächerblatt mit n Fingern, zeigt nach -Z
  function fanLeaf(T, size, n, col, tilt) {
    const w = new T.Group(), f = new T.Group(); w.add(f); f.rotation.x = -Math.PI / 2 + (tilt || 0.25);
    const pl = size * 0.45, pet = new T.Mesh(GEO('pet', () => new T.CylinderGeometry(0.0035, 0.005, 1, 5)), M('#4F8A36')); pet.scale.y = pl; pet.position.y = pl / 2; f.add(pet);
    const lg = leafletG(T), mA = M(col, { side: T.DoubleSide, roughness: 0.62 }), mB = M(col === '#3F8C3A' ? '#4A9A42' : col, { side: T.DoubleSide, roughness: 0.62 });
    for (let i = 0; i < n; i++) { const c = (n - 1) / 2, d = (i - c) / c, m = new T.Mesh(lg, i % 2 ? mA : mB), l = size * (1 - Math.abs(d) * 0.62); m.scale.set(l, l, l); m.position.y = pl; m.rotation.z = -d * (n > 5 ? 1.25 : 1.0); f.add(m); }
    return w;
  }
  // Knospe: Kelche entlang der Länge, orange Härchen, kleine Zuckerblätter. Länge entlang +Y.
  function mkBud(T, dry, len) {
    len = len || 0.09; const g = new T.Group(), ico = GEO('ico', () => new T.IcosahedronGeometry(1, 1)), pg = GEO('pist', () => new T.CylinderGeometry(0.0022, 0.0016, 1, 4));
    const cs = dry ? ['#9E9446', '#B3A856', '#8A8240'] : ['#78B04A', '#8CC25A', '#6BA43F'], frost = dry ? '#CFC48A' : '#CFE6B4', pc = dry ? '#8E5226' : '#E5832E', sc = dry ? '#857838' : '#5C963C';
    const k = 8; let s = 0;
    for (let j = 0; j < k; j++) { const t = j / (k - 1), y = t * len, r = len * 0.3 * (1 - t * 0.5);
      for (let m = 0; m < 3; m++) { const a = j * 2.4 + m * 2.09, e = new T.Mesh(ico, M(cs[(j + m) % 3], { roughness: 0.55 })); e.position.set(Math.cos(a) * r * 0.55, y, Math.sin(a) * r * 0.55); e.scale.set(r * 0.75, r * 0.95, r * 0.75); g.add(e); } }
    const fr = new T.Mesh(ico, M(frost, { transparent: true, opacity: 0.22, roughness: 0.3 })); fr.scale.set(len * 0.3, len * 0.62, len * 0.3); fr.position.y = len * 0.45; g.add(fr);
    for (let i = 0; i < 14; i++) { const a = i * 2.39996, t = 0.1 + (i / 14) * 0.85, r = len * 0.3 * (1 - t * 0.5), p = new T.Mesh(pg, M(pc, { roughness: 0.8 })); s = len * (dry ? 0.06 + (i % 3) * 0.015 : 0.12 + (i % 3) * 0.03);
      p.scale.y = s; p.position.set(Math.cos(a) * (r + s * 0.35), t * len, Math.sin(a) * (r + s * 0.35)); p.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); g.add(p); }
    const lg = leafletG(T); for (let i = 0; i < 4; i++) { const a = i * 1.57 + 0.4, h = new T.Group(), m = new T.Mesh(lg, M(sc, { side: T.DoubleSide })); h.position.y = len * (0.15 + i * 0.12); h.rotation.y = a; m.scale.setScalar(len * 0.55); m.rotation.x = -0.9; h.add(m); g.add(h); }
    g.userData.pick = true; return g;
  }
  // Tabakblatt: breit, gewellter Rand, hängt leicht. Länge entlang +Y.
  function mkTobLeaf(T, dry, size, col) {
    size = size || 0.22; const g = new T.Group(), geo = GEO('tob', () => leafGeo(T, 1, t => 0.46 * Math.sin(Math.PI * Math.pow(t, 0.6)) * (1 - 0.2 * t) * (1 + 0.04 * Math.sin(t * 26)), 16, 4, 0.42, 0.1, (t, u) => 0.012 * Math.sin(t * 30 + u * 3) * Math.abs(u)));
    const m = new T.Mesh(geo, M(col || (dry ? '#A8703A' : '#8DB04A'), { side: T.DoubleSide, roughness: 0.65 })); m.scale.setScalar(size); g.add(m);
    g.userData.pick = true; return g;
  }
  const mkLeafPiece = (T, dry) => mkTobLeaf(T, dry, 0.22);
  const mkPiece = (T, dry) => WK.kind === 'leaf' ? mkLeafPiece(T, dry) : mkBud(T, dry);
  function mkPot(T) {
    const g = new T.Group(), prof = [[0.0, 0.01], [0.15, 0.01], [0.155, 0.02], [0.195, 0.25], [0.218, 0.255], [0.222, 0.3], [0.205, 0.305], [0.2, 0.29]].map(([x, y]) => new T.Vector2(x, y));
    g.add(OL(new T.Mesh(new T.LatheGeometry(prof, 40), M('#C0663C', { side: T.DoubleSide })), 0.035));
    const sau = OL(new T.Mesh(new T.CylinderGeometry(0.21, 0.19, 0.022, 40), M('#9C4C2A')), 0.03); sau.position.y = 0.011; g.add(sau); blob(T, 0.75, 0.6, 0.002, 0.5, g);
    const soil = new T.Mesh(new T.SphereGeometry(0.198, 32, 8, 0, Math.PI * 2, 0, 0.5), M('#3A2618', { roughness: 1 })); soil.scale.y = 0.18; soil.position.y = 0.268; g.add(soil); g.userData.soil = soil;
    const peb = new T.SphereGeometry(0.012, 6, 4); for (let i = 0; i < 9; i++) { const a = i * 2.3, r = 0.06 + (i % 4) * 0.03, m = new T.Mesh(peb, M(i % 2 ? '#7A6A5A' : '#52402F', { roughness: 1 })); m.position.set(Math.cos(a) * r, 0.284, Math.sin(a) * r); m.scale.y = 0.6; g.add(m); }
    return g;
  }
  // Pflanze (stage 0..1) mit nb pflückbaren Knospen bzw. Blättern
  function mkPlant(T, stage, nb) { return WK.kind === 'leaf' ? mkTobPlant(T, stage, nb) : mkBudPlant(T, stage, nb); }
  function mkBudPlant(T, stage, nb) {
    const g = new T.Group(), H = 0.28 + 0.7 * stage, picks = [], base = 0.29, stemM = M('#4E8A36', { roughness: 0.8 });
    const stem = new T.Mesh(new T.CylinderGeometry(0.011, 0.024, H, 8), stemM); stem.position.y = base + H / 2; g.add(stem);
    const nodes = 3 + Math.round(stage * 6), tips = [];
    for (let i = 0; i < nodes; i++) {
      const t = (i + 0.7) / (nodes + 0.4), y = base + H * Math.pow(t, 0.9), a = i * 1.5708 + (i % 2) * 0.5, up = i / Math.max(1, nodes - 1);
      const ls = (0.3 - up * 0.13) * (0.55 + stage * 0.5), nf = up > 0.75 ? 5 : 7;
      for (const sd of [0, Math.PI]) { const fl = fanLeaf(T, ls, nf, sd ? '#3F8C3A' : '#4A9A42', 0.35 - up * 0.2); fl.position.y = y; fl.rotation.y = a + sd; g.add(fl); }
      if (stage > 0.3 && i < nodes - 1) {
        const B = new T.Group(), tl = new T.Group(), th = 0.95 - up * 0.45, lb = (0.3 - up * 0.17) * (0.45 + stage * 0.55); B.position.y = y; B.rotation.y = a + (i % 2 ? 1.5708 : -1.5708); tl.rotation.x = -th; B.add(tl); g.add(B);
        const br = new T.Mesh(new T.CylinderGeometry(0.006, 0.011, lb, 6), stemM); br.position.y = lb / 2; tl.add(br);
        const sf = fanLeaf(T, ls * 0.75, 7, '#4A9A42', 0.3); sf.position.y = lb * 0.55; sf.rotation.y = 1.4; const sh = new T.Group(); sh.rotation.x = th; sh.add(sf); sh.position.y = lb * 0.55; sf.position.y = 0; tl.add(sh);
        const tip = new T.Group(); tip.position.y = lb; tip.rotation.x = th; tl.add(tip); tips.push(tip);
      }
    }
    const topG = new T.Group(); topG.position.y = base + H; g.add(topG);
    if (nb > 0) {
      const top = mkBud(T, false, 0.17); topG.add(top); picks.push(top);
      for (let i = 0; i < nb - 1 && i < tips.length; i++) { const tp = tips[tips.length - 1 - i], b = mkBud(T, false, 0.1 + (i < 3 ? 0.025 : 0)); b.position.y = -0.01; tp.add(b); picks.push(b); }
    } else if (stage > 0.65) {
      const top = mkBud(T, false, 0.06 + (stage - 0.65) * 0.15); top.userData.pick = false; topG.add(top);
      tips.slice(-4).forEach(tp => { const b = mkBud(T, false, 0.035 + (stage - 0.65) * 0.08); b.userData.pick = false; tp.add(b); });
    } else { const fl = fanLeaf(T, 0.06, 5, '#5BAA4E', 0.9); topG.add(fl); }
    g.userData.picks = picks; return g;
  }
  function mkTobPlant(T, stage, nb) {
    const g = new T.Group(), H = 0.3 + 0.75 * stage, picks = [], base = 0.29;
    const stem = new T.Mesh(new T.CylinderGeometry(0.012, 0.03, H, 8), M('#7FA650', { roughness: 0.8 })); stem.position.y = base + H / 2; g.add(stem);
    const nL = nb > 0 ? nb + 3 : 4 + Math.round(stage * 5);
    for (let i = 0; i < nL; i++) {
      const up = i / Math.max(1, nL - 1), y = base + 0.03 + H * 0.88 * Math.pow(up, 1.05), a = i * 2.4, ripe = nb > 0 && i < nb;
      const W = new T.Group(); W.position.y = y; W.rotation.y = a; g.add(W);
      const lf = mkTobLeaf(T, false, (0.62 - up * 0.3) * (0.45 + stage * 0.55), ripe ? '#C2BE62' : (i % 2 ? '#5E9440' : '#6CA24A')); lf.rotation.x = -Math.PI / 2 + 0.75 + up * 0.35; W.add(lf);
      if (ripe) picks.push(lf); else lf.userData.pick = false;
    }
    if (stage > 0.8) { const cg = new T.ConeGeometry(0.014, 0.05, 8, 1, true); for (let i = 0; i < 6; i++) { const m = new T.Mesh(cg, M('#F2A6C8', { side: T.DoubleSide })), a = i * 1.05; m.position.set(Math.cos(a) * 0.03, base + H + 0.03 + (i % 2) * 0.02, Math.sin(a) * 0.03); m.rotation.set(Math.PI + Math.sin(a) * 0.4, 0, Math.cos(a) * 0.4); g.add(m); } }
    g.userData.picks = picks; return g;
  }
  function mkCan(T) {
    const g = new T.Group(), mat = M('#63C174');
    const body = OL(new T.Mesh(new T.CylinderGeometry(0.09, 0.1, 0.18, 20), mat), 0.06); g.add(body);
    const sp = OL(new T.Mesh(new T.CylinderGeometry(0.012, 0.018, 0.26, 10), mat), 0.25); sp.rotation.z = -1.0; sp.position.set(0.17, 0.05, 0); g.add(sp);
    const rose = new T.Mesh(new T.CylinderGeometry(0.03, 0.015, 0.03, 12), M('#C9D2DC', { metalness: 0.5 })); rose.rotation.z = -1.0; rose.position.set(0.28, 0.115, 0); g.add(rose);
    const hd = new T.Mesh(new T.TorusGeometry(0.07, 0.012, 8, 20, Math.PI), mat); hd.position.set(-0.02, 0.09, 0); hd.rotation.z = 0.2; g.add(hd);
    g.userData.tip = new T.Vector3(0.3, 0.12, 0); return g;
  }
  function baseScene(T, camPos, look, fw, fh) {
    const sc = new T.Scene(), cam = new T.PerspectiveCamera(36, 1.8, 0.05, 30); cam.position.copy(camPos); cam.lookAt(look); WK.fit = { c: look.clone(), dir: camPos.clone().sub(look).normalize(), w: fw || 1.6, h: fh || 1.2 };
    sc.background = new T.Color('#10151C');
    sc.add(new T.HemisphereLight('#FFF1D6', '#3A3226', 1.6));
    const key = new T.DirectionalLight('#FFE6BC', 2.2); key.position.set(0.8, 3.2, 1.6); sc.add(key);
    const rim = new T.DirectionalLight('#A8D8FF', 0.7); rim.position.set(-1.6, 1.4, -1.5); sc.add(rim);
    mkRoom(T, sc);
    WK.scene = sc; WK.cam = cam; WK.root = new T.Group(); sc.add(WK.root); return sc;
  }
  // Boden und Wand passend zum Gebäude: Keller (Fliesen in der gewählten Bodenfarbe, Ziegel), Scheune (Bretter), Premium (helle Fliesen)
  function mkRoom(T, sc) {
    const ar = WK.ar, k = ar.key, fl = (G.build && G.build.floor && G.build.floor[k]) || {}, fc = (typeof FLOOR_COLORS !== 'undefined' && FLOOR_COLORS[fl.c]) || null, pat = fl.p || 0;
    const kind = k === 'tabak' ? 'barn' : k === 'pr' ? 'clean' : 'cellar', base = fc || (kind === 'barn' ? '#4A3424' : kind === 'clean' ? '#C9CED6' : '#34503F');
    const floorT = (kind === 'barn' || pat === 1) ? woodTex(base, 'rgba(0,0,0,.35)', 6, false) : cvTex(256, 256, (x, w, h) => { x.fillStyle = base; x.fillRect(0, 0, w, h); const n = 4;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { if (pat === 2 && (i + j) % 2) { x.fillStyle = 'rgba(0,0,0,.18)'; x.fillRect(i * w / n, j * h / n, w / n, h / n); } x.fillStyle = 'rgba(255,255,255,' + (0.02 + ((i * 7 + j * 3) % 4) * 0.012) + ')'; x.fillRect(i * w / n + 3, j * h / n + 3, w / n - 6, h / n - 6); }
      if (pat !== 3) { x.fillStyle = 'rgba(0,0,0,.32)'; for (let i = 0; i <= n; i++) { x.fillRect(i * w / n - 1.5, 0, 3, h); x.fillRect(0, i * h / n - 1.5, w, 3); } } });
    floorT.repeat.set(6, 6); const flm = new T.Mesh(new T.PlaneGeometry(9, 9), MTX(floorT)); flm.rotation.x = -Math.PI / 2; sc.add(flm);
    const wallT = kind === 'barn' ? woodTex('#6A4A30', 'rgba(0,0,0,.4)', 8, true) : kind === 'clean' ? cvTex(256, 256, (x, w, h) => { x.fillStyle = '#E8ECF0'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,.12)'; for (let i = 0; i <= 8; i++) { x.fillRect(i * 32 - 1, 0, 2, h); x.fillRect(0, i * 32 - 1, w, 2); } })
      : cvTex(256, 256, (x, w, h) => { x.fillStyle = '#4A3B34'; x.fillRect(0, 0, w, h); for (let r = 0; r < 8; r++) for (let c = -1; c < 5; c++) { const bx = c * 64 + (r % 2) * 32, by = r * 32; x.fillStyle = ['#6E4A3A', '#7A5240', '#664436', '#73503E'][(r * 3 + c + 8) % 4]; x.fillRect(bx + 3, by + 3, 58, 26); x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(bx + 3, by + 3, 58, 3); } });
    wallT.repeat.set(kind === 'barn' ? 3 : 5, 2); const wall = new T.Mesh(new T.PlaneGeometry(9, 3.4), MTX(wallT, kind === 'clean' ? '#FFFFFF' : '#C8C0B8')); wall.position.set(0, 1.7, -1.25); sc.add(wall);
    const sk = new T.Mesh(new T.BoxGeometry(9, 0.12, 0.06), M(kind === 'clean' ? '#AEB6C0' : '#2A211C')); sk.position.set(0, 0.06, -1.22); sc.add(sk);
    const sh = new T.Mesh(new T.PlaneGeometry(9, 0.5), new T.MeshBasicMaterial({ map: cvTex(4, 64, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false })); sh.rotation.x = -Math.PI / 2; sh.position.set(0, 0.004, -1.0); sc.add(sh);
  }
  // ---------- Szenen ----------
  function workBuild(mode) {
    const T = THREE3, ar = WK.ar, st = S(ar), L = WK.L, tg = WK.tg, pcs = WK.kind === 'leaf' ? 'Blätter' : 'Knospen';
    if (mode === 'water' || mode === 'harvest') {
      baseScene(T, new T.Vector3(0, 1.75, 1.75), new T.Vector3(0, mode === 'harvest' ? (WK.kind === 'leaf' ? 0.84 : 0.82) : 0.72, 0), 1.6, mode === 'harvest' ? (WK.kind === 'leaf' ? 1.9 : 1.85) : 1.55); const p = potOf(tg), pot = mkPot(T); WK.root.add(pot); WK.pot = pot; WK.p = p;
      { const lamp = new T.Group(), hood = OL(new T.Mesh(new T.BoxGeometry(0.62, 0.05, 0.3), M('#2E3238')), 0.04), panel = new T.Mesh(new T.PlaneGeometry(0.56, 0.24), new T.MeshBasicMaterial({ color: WK.kind === 'leaf' ? '#FFE6B0' : '#FFD9F0' })); panel.rotation.x = Math.PI / 2; panel.position.y = -0.027; lamp.add(hood); lamp.add(panel);
        for (const x of [-0.26, 0.26]) { const c = new T.Mesh(new T.CylinderGeometry(0.004, 0.004, 1.2, 4), M('#1D2129')); c.position.set(x, 0.62, 0); lamp.add(c); }
        const cone = new T.Mesh(new T.CylinderGeometry(0.28, 0.75, 1.3, 24, 1, true), new T.MeshBasicMaterial({ color: '#FFE3B0', transparent: true, opacity: 0.07, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending })); cone.position.y = -0.68; lamp.add(cone);
        lamp.position.set(0, mode === 'harvest' ? 1.62 : 1.5, -0.05); WK.scene.add(lamp); }
      const nb = mode === 'harvest' ? Math.max(4, Math.min(9, harvestYield(ar))) : 0, plant = mkPlant(T, mode === 'harvest' ? 1 : Math.min(1, 0.15 + (p.p || 0) * 0.85), nb); WK.root.add(plant); WK.plant = plant;
      if (mode === 'water') { WK.can = mkCan(T); WK.can.position.set(0.5, 0.98, 0); WK.scene.add(WK.can); WK.drops = []; const dg = new T.SphereGeometry(0.012, 6, 4), dm = M('#7FC8F0', { transparent: true, opacity: 0.85 }); for (let i = 0; i < 40; i++) { const d = new T.Mesh(dg, dm); d.visible = false; WK.scene.add(d); WK.drops.push({ m: d, v: new T.Vector3(), t: 0 }); }
        WK.hintEl.textContent = 'Kanne mit dem Finger über den Topf ziehen und gedrückt halten'; workBtn('Fertig', () => workClose(), 'wok'); }
      else { WK.got = 0; WK.need = plant.userData.picks.length; WK.hintEl.textContent = WK.kind === 'leaf' ? 'Tippe die reifen, hellen Blätter an' : 'Tippe die Knospen an'; workBtn('Alle ernten', () => { plant.userData.picks.slice().forEach(q => workPick(q)); }, 'wall'); }
      workCount();
    } else if (mode === 'rack') {
      baseScene(T, new T.Vector3(0, 1.55, 2.3), new T.Vector3(0, 0.7, 0.2), 2.2, 1.8); const cap = rackCap(ar), cols = Math.min(8, cap), rows = Math.ceil(cap / cols), W = 1.6, wood = MTX(woodTex('#8A5E3A', 'rgba(0,0,0,.3)', 3, true));
      for (const x of [-W / 2 - 0.05, W / 2 + 0.05]) { const post = OL(new T.Mesh(new T.BoxGeometry(0.06, 1.5, 0.06), wood), 0.08); post.position.set(x, 0.75, 0); WK.root.add(post); const ft = OL(new T.Mesh(new T.BoxGeometry(0.08, 0.05, 0.4), wood), 0.08); ft.position.set(x, 0.025, 0); WK.root.add(ft); blob(T, 0.3, 0.55, 0.003, 0.45).position.x = x; }
      { const bar = OL(new T.Mesh(new T.BoxGeometry(W + 0.2, 0.06, 0.06), wood), 0.04); bar.position.y = 1.5; WK.root.add(bar); }
      WK.slots = []; for (let r = 0; r < rows; r++) { const y = 1.38 - r * (1.0 / Math.max(1, rows)); const line = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, W + 0.1, 6), M('#D8D2C4')); line.rotation.z = Math.PI / 2; line.position.y = y; WK.root.add(line);
        for (let c = 0; c < cols && WK.slots.length < cap; c++) WK.slots.push({ x: -W / 2 + (c + 0.5) * W / cols, y, item: null }); }
      const wet = Math.floor(st.rack.wet + 1e-6), dry = Math.floor(st.rack.dry + 1e-6); let si = 0;
      for (let i = 0; i < dry && si < WK.slots.length; i++) rackHang(WK.slots[si++], true, false);
      for (let i = 0; i < wet && si < WK.slots.length; i++) rackHang(WK.slots[si++], false, false);
      const bk = OL(new T.Mesh(new T.CylinderGeometry(0.2, 0.16, 0.14, 20, 1, true), MTX(woodTex('#C49A5E', 'rgba(90,50,20,.45)', 10, true))), 0.04); bk.material.side = T.DoubleSide; blob(T, 0.55, 0.45, 0.003, 0.45).position.set(-0.55, 0, 0.55); bk.position.set(-0.55, 0.07, 0.55); WK.root.add(bk); WK.basket = bk; WK.basketItems = [];
      const box = mkCrate(T, 0.36, 0.26, 0.12); box.position.set(0.55, 0, 0.55); WK.root.add(box); WK.box = box; blob(T, 0.55, 0.42, 0.003, 0.45).position.set(0.55, 0, 0.55);
      rackBasket(); WK.hintEl.textContent = 'Tippe den Korb an zum Aufhängen, tippe trockene ' + pcs + ' zum Abnehmen';
      workBtn('Alle aufhängen', () => { let n = 0; while (S(ar).inv.fresh > 0 && rackHangOne()) if (++n > 99) break; }, 'wall'); workBtn('Alle Trockenen ab', () => { WK.slots.filter(s => s.item && s.dry).forEach(s => rackTake(s)); }, 'wall'); workBtn('Fertig', () => workClose(), 'wok'); workCount();
    } else if (mode === 'pack') {
      baseScene(T, new T.Vector3(0, 1.75, 1.05), new T.Vector3(0.02, 0.5, 0.02), 1.9, 0.95); const top = OL(new T.Mesh(new T.BoxGeometry(1.8, 0.06, 0.95), MTX(woodTex('#8A5E3A', 'rgba(0,0,0,.28)', 5, false))), 0.012); top.position.y = 0.42; WK.root.add(top);
      for (const [x, z] of [[-0.82, -0.4], [0.82, -0.4], [-0.82, 0.4], [0.82, 0.4]]) { const lg = OL(new T.Mesh(new T.BoxGeometry(0.06, 0.42, 0.06), M('#6A4428')), 0.1); lg.position.set(x, 0.21, z); WK.root.add(lg); } blob(T, 2.2, 1.35, 0.003, 0.5);
      const tray = OL(new T.Mesh(new T.BoxGeometry(0.5, 0.02, 0.4), M('#C9CED6')), 0.03); tray.position.set(-0.55, 0.46, 0.02); WK.root.add(tray); blob(T, 0.6, 0.5, 0.452, 0.3).position.x = -0.55;
      WK.crate = mkCrate(T, 0.42, 0.36, 0.16); WK.crate.position.set(0.58, 0.45, 0.0); WK.root.add(WK.crate); WK.crateN = 0;
      WK.pkKind = L.unit === 'Beutel' ? 'bag' : /Dose/.test(L.unit || '') ? 'jar' : 'box';
      WK.pile = []; packPile(); WK.made = 0; packNewBag();
      workBtn('Fertig', () => workClose(), 'wok'); workCount();
    }
  }
  // Offene Holzkiste (Boden und vier Seiten)
  function mkCrate(T, w, d, h) {
    const g = new T.Group(), wd = M('#B9874F'), dk = M('#93653A'), th = 0.018;
    const bt = new T.Mesh(new T.BoxGeometry(w, th, d), dk); bt.position.y = th / 2; g.add(bt);
    for (const [x, z, sx, sz] of [[0, -d / 2, w, th], [0, d / 2, w, th], [-w / 2, 0, th, d], [w / 2, 0, th, d]]) for (let k = 0; k < 2; k++) { const b = OL(new T.Mesh(new T.BoxGeometry(sx, h * 0.42, sz), k ? wd : dk), 0.04); b.position.set(x, h * (0.25 + k * 0.5), z); g.add(b); }
    g.userData.crate = true; return g;
  }
  function workCount() {
    const ar = WK.ar, st = S(ar), L = WK.L; let t = '';
    if (WK.mode === 'water') t = '💧 ' + Math.round((WK.p.w || 0) * 100) + ' %';
    else if (WK.mode === 'harvest') t = '🧺 ' + WK.got + ' / ' + WK.need;
    else if (WK.mode === 'rack') t = '🧺 ' + st.inv.fresh + ' ' + (L.fresh || 'frisch') + ' · ' + Math.floor(st.rack.wet) + ' trocknen · ' + Math.floor(st.rack.dry) + ' trocken · 📦 ' + st.inv.dried;
    else if (WK.mode === 'pack') t = (WK.kind === 'leaf' ? '🍂 ' : '🌿 ') + packAvail() + ' trocken · drin ' + (WK.inBag || 0) + ' / ' + ar.packN + ' · in der Kiste: ' + WK.made;
    WK.cntEl.textContent = t;
  }
  // ---------- Ernten ----------
  function workPick(q) {
    if (!q || q.userData.taken) return; q.userData.taken = true; const T = THREE3, wp = new T.Vector3(); q.getWorldPosition(wp); q.parent.remove(q); q.position.copy(wp); WK.scene.add(q);
    WK.anim.push({ o: q, t: 0, d: 0.45, a: wp.clone(), b: new T.Vector3(0.85, 1.25, 0.2), end: () => { WK.scene.remove(q); } });
    WK.got++; try { sfx.put(); } catch (e) {} workCount();
    if (WK.got >= WK.need && !WK.done) { WK.done = true; const ar = WK.ar, inv = S(ar).inv, p = WK.p, hy = harvestYield(ar); inv.fresh += hy; p.s = 0; p.p = 0; if (G.kr) G.kr.cnt.hv++; try { sfx.harvest(); } catch (e) {} const pos = potPos(WK.tg); floater(pos.x, pos.y - 20, '+' + hy + ' ' + (WK.L.fresh || ''), ar.leaf); WK.hintEl.textContent = 'Geerntet: +' + hy + ' ' + (WK.L.fresh || ''); setTimeout(() => { if (workOpen && WK.mode === 'harvest') workClose(); }, 900); }
  }
  // ---------- Gestell ----------
  function rackHang(slot, dry, anim) {
    const T = THREE3, it = new T.Group(), str = new T.Mesh(new T.CylinderGeometry(0.003, 0.003, 0.12, 4), M('#D8D2C4')); str.position.y = -0.06; it.add(str);
    const pc = mkPiece(T, dry); pc.position.y = -0.11; pc.rotation.z = Math.PI; pc.scale.setScalar(WK.kind === 'leaf' ? 1.3 : 1.5); it.add(pc); pc.userData.slot = slot;
    it.position.set(slot.x, slot.y, 0); WK.root.add(it); slot.item = it; slot.dry = dry; slot.piece = pc;
    if (anim) { const from = WK.basket.position.clone().add(new T.Vector3(0, 0.15, 0)); WK.anim.push({ o: it, t: 0, d: 0.4, a: from, b: it.position.clone() }); it.position.copy(from); }
  }
  function rackHangOne() {
    const ar = WK.ar, st = S(ar); if (st.inv.fresh <= 0) return false; const free = WK.slots.find(s => !s.item); if (!free || rackCap(ar) - Math.floor(st.rack.wet + st.rack.dry) <= 0) { WK.hintEl.textContent = (WK.L.rack || 'Gestell') + ' ist voll'; return false; }
    st.inv.fresh -= 1; st.rack.wet += 1; rackHang(free, false, true); rackBasket(); workCount(); try { sfx.put(); } catch (e) {} return true;
  }
  function rackTake(slot) {
    const ar = WK.ar, st = S(ar); if (!slot.item || !slot.dry || st.rack.dry < 1 - 1e-6) return; st.rack.dry -= 1; st.inv.dried += 1; const it = slot.item; slot.item = null; slot.dry = false;
    WK.anim.push({ o: it, t: 0, d: 0.4, a: it.position.clone(), b: WK.box.position.clone().add(new THREE3.Vector3(0, 0.12, 0)), end: () => WK.root.remove(it) }); workCount(); try { sfx.put(); } catch (e) {}
  }
  function rackBasket() {
    const T = THREE3, n = Math.min(8, S(WK.ar).inv.fresh); while (WK.basketItems.length > n) WK.root.remove(WK.basketItems.pop());
    while (WK.basketItems.length < n) { const i = WK.basketItems.length, pc = mkPiece(T, false); pc.position.set(WK.basket.position.x + Math.cos(i * 2.2) * 0.08, 0.1 + (i % 3) * 0.02, WK.basket.position.z + Math.sin(i * 2.2) * 0.08); pc.rotation.set(WK.kind === 'leaf' ? -1.3 : 0, i * 1.3, WK.kind === 'leaf' ? 0 : 1.4); pc.userData.basket = true; WK.root.add(pc); WK.basketItems.push(pc); }
  }
  // ---------- Packtisch ----------
  // Ablauf: Knospen in den offenen Beutel legen, Beutel antippen (verschließen), Beutel in die Kiste ziehen, nächster Beutel
  function packRoom(ar) { const st = S(ar); return unitRoom(ar) > 0 || st.tab.bags < bagsMax(); }
  function packAvail() { const st = S(WK.ar); return st.inv.dried + Math.floor(st.tab.dry + 1e-6); }
  function packPile() {
    const T = THREE3, live = WK.pile.filter(p => !p.userData.taken), used = new Set(live.map(p => p.userData.sl)); let n = Math.min(12 - live.length, packAvail() - live.length);
    for (let sl = 0; sl < 12 && n > 0; sl++) { if (used.has(sl)) continue; n--; const pc = mkPiece(T, true); pc.userData.sl = sl; pc.userData.pile = true;
      pc.position.set(-0.72 + (sl % 4) * 0.11, 0.48, -0.12 + Math.floor(sl / 4) * 0.12); if (WK.kind === 'leaf') { pc.rotation.set(-Math.PI / 2, 0, sl * 0.4); pc.position.y = 0.475; } else pc.rotation.set(0, sl * 1.1, Math.PI / 2);
      pc.scale.setScalar(1.3); WK.root.add(pc); WK.pile.push(pc); }
  }
  function packNewBag() {
    const T = THREE3, g = new T.Group(), kd = WK.pkKind; let lid;
    if (kd === 'bag') {
      const mat = M1('#DDEBF5', { transparent: true, opacity: 0.32, roughness: 0.12, side: T.DoubleSide }), w = 0.22, h = 0.22, d = 0.1;
      const b = new T.Mesh(new T.BoxGeometry(w, 0.01, d), mat); b.position.y = 0.005; g.add(b);
      for (const [x, z, sx, sz] of [[0, -d / 2, w, 0.004], [0, d / 2, w, 0.004], [-w / 2, 0, 0.004, d], [w / 2, 0, 0.004, d]]) { const s = new T.Mesh(new T.BoxGeometry(sx, h, sz), mat); s.position.set(x, h / 2, z); g.add(s); }
      for (const z of [-d / 2, d / 2]) { const zp = new T.Mesh(new T.BoxGeometry(w, 0.012, 0.008), M('#5BB0E8')); zp.position.set(0, h - 0.008, z); g.add(zp); }
      lid = new T.Mesh(new T.BoxGeometry(w + 0.004, 0.02, 0.016), M1('#4AA3E0', { roughness: 0.3 })); lid.position.y = h + 0.004;
      g.userData.h = h; g.userData.w = w; g.userData.d = d;
    } else if (kd === 'jar') {
      const mat = M1('#F2F4F7', { roughness: 0.35, side: T.DoubleSide }), r = 0.085, h = 0.17;
      const c = new T.Mesh(new T.CylinderGeometry(r, r, h, 28, 1, true), mat); c.position.y = h / 2; g.add(c); const bt = new T.Mesh(new T.CircleGeometry(r, 28), mat); bt.rotation.x = -Math.PI / 2; bt.position.y = 0.003; g.add(bt);
      const lab = new T.Mesh(new T.CylinderGeometry(r + 0.002, r + 0.002, 0.07, 28, 1, true), M('#63C174', { roughness: 0.6 })); lab.position.y = h * 0.45; g.add(lab);
      lid = new T.Mesh(new T.CylinderGeometry(r + 0.008, r + 0.008, 0.03, 28), M1('#2E8B57', { roughness: 0.4 })); lid.position.y = h + 0.015;
      g.userData.h = h; g.userData.w = r * 1.3; g.userData.d = r * 1.3;
    } else {
      const mat = M1('#C9A274', { roughness: 0.9, side: T.DoubleSide }), w = 0.24, h = 0.12, d = 0.16;
      const b = new T.Mesh(new T.BoxGeometry(w, 0.008, d), mat); b.position.y = 0.004; g.add(b);
      for (const [x, z, sx, sz] of [[0, -d / 2, w, 0.006], [0, d / 2, w, 0.006], [-w / 2, 0, 0.006, d], [w / 2, 0, 0.006, d]]) { const s = new T.Mesh(new T.BoxGeometry(sx, h, sz), mat); s.position.set(x, h / 2, z); g.add(s); }
      lid = new T.Group(); const lt = new T.Mesh(new T.BoxGeometry(w + 0.006, 0.008, d + 0.006), M1('#B88E5E', { roughness: 0.9 })); lid.add(lt); const tp = new T.Mesh(new T.BoxGeometry(0.05, 0.009, d + 0.01), M1('#E8D9B8', { roughness: 0.7 })); tp.position.y = 0.002; lid.add(tp); lid.position.y = h + 0.004;
      g.userData.h = h; g.userData.w = w; g.userData.d = d;
    }
    g.userData.lid = lid; g.userData.pk = true; g.position.set(0.0, 0.45, 0.06); g.userData.home = g.position.clone(); WK.root.add(g);
    WK.bag = g; WK.inBag = 0; WK.bagItems = []; WK.packSt = 'open'; WK.packFrom = 0;
    WK.anim.push({ o: g, t: 0, d: 0.35, a: new THREE3.Vector3(0, 0.75, 0.3), b: g.position.clone() }); g.position.set(0, 0.75, 0.3);
    WK.hintEl.textContent = 'Lege ' + WK.ar.packN + ' ' + (WK.kind === 'leaf' ? 'Blätter' : 'Knospen') + ' in ' + pkName(1) + ' (antippen)';
  }
  function pkName(art) { const k = WK.pkKind; return k === 'bag' ? (art ? 'den offenen Beutel' : 'den Beutel') : k === 'jar' ? (art ? 'die offene Dose' : 'die Dose') : (art ? 'das offene Päckchen' : 'das Päckchen'); }
  function packPut(pc) {
    const ar = WK.ar, st = S(ar); if (WK.packSt !== 'open' || !WK.bag || WK.inBag >= ar.packN || pc.userData.taken) return; if (packAvail() <= 0) return;
    if (st.inv.dried >= 1) st.inv.dried -= 1; else st.tab.dry = Math.max(0, st.tab.dry - 1); WK.packFrom++;
    pc.userData.taken = true; const T = THREE3, k = WK.inBag, u = WK.bag.userData, wp = pc.position.clone(); WK.root.remove(pc); WK.bag.add(pc); pc.position.copy(WK.bag.worldToLocal(WK.root.localToWorld(wp)));
    const b = new T.Vector3((k - (ar.packN - 1) / 2) * Math.min(0.06, u.w * 0.8 / ar.packN), 0.03 + (WK.kind === 'leaf' ? k * 0.01 : (k % 2) * 0.02), ((k % 2) - 0.5) * u.d * 0.3);
    pc.scale.setScalar(WK.kind === 'leaf' ? 0.75 : 1.1); WK.anim.push({ o: pc, t: 0, d: 0.35, a: pc.position.clone(), b }); WK.bagItems.push(pc); WK.inBag++; try { sfx.put(); } catch (e) {}
    packPile(); workCount();
    if (WK.inBag >= ar.packN) { WK.packSt = 'full'; WK.hintEl.textContent = 'Tippe ' + pkName(0) + ' an zum Verschließen'; }
  }
  function packSeal() {
    if (WK.packSt !== 'full' || !WK.bag) return; const ar = WK.ar; if (!packRoom(ar)) { WK.hintEl.textContent = 'Rucksack und Tisch sind voll'; return; }
    const g = WK.bag, lid = g.userData.lid, T = THREE3; g.add(lid); WK.packSt = 'sealed'; WK.packFrom = 0;
    const to = lid.position.clone(); WK.anim.push({ o: lid, t: 0, d: 0.25, a: to.clone().add(new T.Vector3(0, 0.12, 0)), b: to, flat: true }); lid.position.y += 0.12;
    if (WK.pkKind === 'bag') WK.anim.push({ o: g, t: 0, d: 0.25, sc: [1, 0.55], ax: 'z' });
    try { sfx.pack(); } catch (e) {} WK.hintEl.textContent = 'Zieh ' + pkName(0) + ' in die Kiste'; workCount();
  }
  // Gibt einen fertigen Beutel aus (in den Rucksack, sonst auf den Tisch)
  function packCredit(quiet) {
    const ar = WK.ar, st = S(ar); if (unitRoom(ar) > 0) st.inv.bags += 1; else st.tab.bags += 1; WK.made++; G.stat.pk = (G.stat.pk || 0) + 1; WK.packSt = '';
    if (!quiet) { try { sfx.harvest(); } catch (e) {} } floater(ar.TABLE.x, ar.TABLE.y + 10, '+1 ' + (WK.L.unit || ''), ar.dry);
  }
  function packDeposit() {
    const g = WK.bag, ar = WK.ar, T = THREE3; if (!g || WK.packSt !== 'sealed') return; packCredit(false); WK.bag = null;
    const n = WK.crateN++, cp = WK.crate.position, dst = new T.Vector3(cp.x - 0.1 + (n % 3) * 0.1, cp.y + 0.03 + Math.floor(n / 3) % 3 * 0.035, cp.z - 0.06 + (n % 2) * 0.1);
    WK.anim.push({ o: g, t: 0, d: 0.3, a: g.position.clone(), b: dst, flat: true }); WK.anim.push({ o: g, t: 0, d: 0.3, rot: true });
    workCount();
    if (packAvail() >= ar.packN && packRoom(ar)) setTimeout(() => { if (workOpen && WK.mode === 'pack' && !WK.bag) { packNewBag(); workCount(); } }, 320);
    else { WK.hintEl.textContent = 'Fertig: ' + WK.made + ' ' + (WK.L.unit || '') + ' in der Kiste'; setTimeout(() => { if (workOpen && WK.mode === 'pack' && !WK.bag) workClose(); }, 1300); }
  }
  // ---------- Eingabe ----------
  function workBind(cv) {
    if (WK.bound) return; WK.bound = true; const ray = new THREE3.Raycaster(), v2 = new THREE3.Vector2();
    const ndc = e => { const r = cv.getBoundingClientRect(); v2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); return v2; };
    const hit = e => { ray.setFromCamera(ndc(e), WK.cam); return ray.intersectObjects(WK.root.children, true); };
    const up = o => { while (o && !(o.userData && (o.userData.pick || o.userData.pk || o.userData.crate))) o = o.parent; return o; };
    const scr = o => { const v = new THREE3.Vector3(); o.getWorldPosition(v); v.project(WK.cam); const r = cv.getBoundingClientRect(); return [(v.x + 1) / 2 * r.width + r.left, (1 - v.y) / 2 * r.height + r.top]; };
    const near = (e, o, px) => { const [x, y] = scr(o); return Math.hypot(e.clientX - x, e.clientY - y) < px; };
    cv.addEventListener('pointerdown', e => { if (!workOpen || !WK.scene) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      if (WK.mode === 'water') { WK.holding = true; workCanTo(e); return; }
      if (WK.mode === 'pack' && WK.packSt === 'sealed' && WK.bag) { WK.drag = true; packDragTo(e); return; }
      const hs = hit(e); for (const h of hs) { const o = up(h.object); if (!o) continue;
        if (WK.mode === 'harvest' && o.userData.pick && WK.plant.userData.picks.includes(o)) { workPick(o); return; }
        if (WK.mode === 'rack') { if (o.userData.basket) { rackHangOne(); return; } if (o.userData.slot && o.userData.slot.dry) { rackTake(o.userData.slot); return; } }
        if (WK.mode === 'pack') { if (o.userData.pile && !o.userData.taken) { packPut(o); return; } if (o.userData.pk && WK.packSt === 'full') { packSeal(); return; } } }
      if (WK.mode === 'rack' && near(e, WK.basket, 60)) rackHangOne();
      if (WK.mode === 'pack') { if (WK.packSt === 'full' && WK.bag && near(e, WK.bag, 80)) { packSeal(); return; } const free = WK.pile.find(q => !q.userData.taken); if (free && WK.packSt === 'open' && near(e, free, 80)) packPut(free); }
    });
    cv.addEventListener('pointermove', e => { if (!workOpen || !WK.scene) return; if (WK.mode === 'water') workCanTo(e); else if (WK.drag) packDragTo(e); });
    const stop = () => { WK.holding = false; if (WK.drag) { WK.drag = false; packDrop(); } }; cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop); cv.addEventListener('lostpointercapture', stop);
    window.addEventListener('resize', () => { if (workOpen) workResize(); }); window.addEventListener('keydown', e => { if (workOpen && e.key === 'Escape') { e.preventDefault(); workClose(); } });
  }
  // Beutel folgt dem Finger über die Tischplatte
  function packDragTo(e) {
    const g = WK.bag; if (!g) return; const cv = WK.el.querySelector('.wcv'), r = cv.getBoundingClientRect(), T = THREE3, ray = new T.Raycaster(); ray.setFromCamera(new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), WK.cam);
    const pt = new T.Vector3(); if (ray.ray.intersectPlane(new T.Plane(new T.Vector3(0, 1, 0), -0.55), pt)) { g.position.set(Math.max(-0.8, Math.min(0.8, pt.x)), 0.52, Math.max(-0.4, Math.min(0.4, pt.z))); }
    const c = WK.crate.position, inC = Math.hypot(g.position.x - c.x, g.position.z - c.z) < 0.28; WK.crate.children.forEach(m => { if (m.material && m.material.emissive) m.material.emissive.set(inC ? '#3A2A10' : '#000000'); });
  }
  function packDrop() {
    const g = WK.bag; if (!g) return; const c = WK.crate.position; WK.crate.children.forEach(m => { if (m.material && m.material.emissive) m.material.emissive.set('#000000'); });
    if (Math.hypot(g.position.x - c.x, g.position.z - c.z) < 0.28) packDeposit();
    else { WK.anim.push({ o: g, t: 0, d: 0.25, a: g.position.clone(), b: g.userData.home.clone(), flat: true }); WK.hintEl.textContent = 'Zieh es bis in die Kiste rechts'; }
  }
  // Kanne folgt dem Finger, der Strahl fällt genau unter den Finger
  function workCanTo(e) {
    const cv = WK.el.querySelector('.wcv'), r = cv.getBoundingClientRect(), T = THREE3, ray = new T.Raycaster(); ray.setFromCamera(new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), WK.cam);
    const pl = new T.Plane(new T.Vector3(0, 0, 1), -0.1), pt = new T.Vector3(); if (ray.ray.intersectPlane(pl, pt)) { WK.can.position.set(Math.max(-1.1, Math.min(0.8, pt.x - 0.3)), 0.98, 0); }
  }
  // ---------- Ablauf ----------
  function workFrame(ts) {
    if (!workOpen || !WK || !WK.scene) return; const dt = Math.min(0.05, ((ts - (WK.last || ts)) / 1000) || 0.016); WK.last = ts; WK.t += dt;
    if (WK.mode === 'water' || WK.mode === 'harvest') WK.root.rotation.y = Math.sin(WK.t * 0.35) * 0.3;
    for (let i = WK.anim.length - 1; i >= 0; i--) { const a = WK.anim[i]; a.t += dt; const k = Math.min(1, a.t / a.d), e = 1 - Math.pow(1 - k, 3);
      if (a.sc) a.o.scale[a.ax] = a.sc[0] + (a.sc[1] - a.sc[0]) * e; else if (a.rot) a.o.rotation.y = e * 0.6; else { a.o.position.lerpVectors(a.a, a.b, e); if (!a.flat) a.o.position.y += Math.sin(k * Math.PI) * 0.12; }
      if (k >= 1) { WK.anim.splice(i, 1); if (a.end) a.end(); } }
    if (WK.mode === 'water') {
      const can = WK.can, tilt = WK.holding ? -0.75 : 0; can.rotation.z += (tilt - can.rotation.z) * Math.min(1, dt * 10);
      const tip = can.userData.tip.clone().applyMatrix4(can.matrixWorld), over = Math.hypot(tip.x, tip.z) < 0.26 && WK.holding;
      if (WK.holding) for (const d of WK.drops) if (!d.m.visible && Math.random() < dt * 30) { d.m.visible = true; d.m.position.copy(tip); d.v.set((Math.random() - 0.5) * 0.15, -0.2, (Math.random() - 0.5) * 0.15); d.t = 0; break; }
      for (const d of WK.drops) if (d.m.visible) { d.v.y -= 3.2 * dt; d.m.position.addScaledVector(d.v, dt); d.t += dt; if (d.m.position.y < 0.3 || d.t > 1.2) d.m.visible = false; }
      if (over && WK.p.s === 1) { const b = WK.p.w; WK.p.w = Math.min(1, WK.p.w + dt * 1.0); if (WK.p.w > b && Math.random() < dt * 10) { try { sfx.water(); } catch (e) {} } workCount(); WK.pot.userData.soil.material.color.set(WK.p.w > 0.6 ? '#24160C' : '#3A2618');
        if (WK.p.w >= 1 && !WK.done) { WK.done = true; G.stat.wt = (G.stat.wt || 0) + 1; WK.hintEl.textContent = 'Genug Wasser!'; setTimeout(() => { if (workOpen && WK.mode === 'water') workClose(); }, 800); } }
    }
    if (WK.mode === 'harvest' && WK.plant) WK.plant.userData.picks.forEach((q, i) => { if (!q.userData.taken && WK.kind !== 'leaf') q.rotation.y = Math.sin(WK.t * 2 + i) * 0.2; });
    if (WK.mode === 'pack' && WK.bag && WK.packSt === 'sealed' && !WK.drag) WK.bag.position.y = WK.bag.userData.home.y + Math.abs(Math.sin(WK.t * 4)) * 0.02;
    WK.r.render(WK.scene, WK.cam); WK.loop = requestAnimationFrame(workFrame);
  }
