  // =====================================================================================================
  // v163: Arbeitsfenster in 3D. Statt nur A zu drücken, macht man die Arbeit selbst:
  // gießen (Kanne über den Topf halten), ernten (Knospen antippen), am Gestell aufhängen und abnehmen,
  // am Packtisch Knospen in den Beutel legen und verschließen. Gilt für Keller, Etagen, Scheune und Mietraum
  // (nicht fürs Labor). Helfer arbeiten weiter automatisch. Lädt 3D nicht, läuft alles wie früher per Knopfdruck.
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
  // Entscheidet, ob ein Fenster aufgeht. false = wie früher per Knopfdruck weitermachen.
  function workTry(tg) {
    if (!workOn || !tg || !workAreaOk(tg.ar)) return false; loadThree(); if (!THREE3) return false;
    const ar = tg.ar, st = S(ar), inv = st.inv;
    if (tg.type === 'pot') { const p = potOf(tg); if (p.s === 1) return workStart('water', tg); if (p.s === 2) { if (inv.fresh + harvestYield(ar) > unitCap() + 6) return false; return workStart('harvest', tg); } return false; }
    if (tg.type === 'rack') { if (inv.fresh > 0 || Math.floor(st.rack.dry) >= 1) return workStart('rack', tg); return false; }
    if (tg.type === 'table') { const can = inv.dried >= ar.packN || st.tab.dry >= ar.packN - 1e-6; if (can && (unitRoom(ar) > 0 || st.tab.bags < bagsMax())) return workStart('pack', tg); return false; }
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
      if (!WK.r) { WK.r = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); WK.r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); if (T.SRGBColorSpace) WK.r.outputColorSpace = T.SRGBColorSpace; }
      Object.assign(WK, { mode, tg, ar, L, kind: workKind(ar), anim: [], t: 0, last: 0, done: false, picks: [], drag: null, holding: false });
      el.hidden = false; workOpen = true; joy.id = null; joy.dx = joy.dy = 0; aHeld = false; bHeld = false;
      const title = { water: (L.water || 'Gießen'), harvest: (L.harvest || 'Ernten'), rack: (L.rack || 'Gestell'), pack: (L.table || 'Packtisch') }[mode];
      el.querySelector('.wt').textContent = title; WK.btns = el.querySelector('.wbtns'); WK.btns.innerHTML = ''; WK.hintEl = el.querySelector('.whint'); WK.cntEl = el.querySelector('.wcount');
      workBuild(mode); workResize(); workFit(); workBind(cv); WK.loop = requestAnimationFrame(workFrame); return true;
    } catch (e) { try { workClose(); } catch (x) {} return false; }
  }
  function workClose() {
    workOpen = false; if (!WK) return; if (WK.mode === 'pack' && WK.packFrom > 0 && WK.ar) { S(WK.ar).inv.dried += WK.packFrom; WK.packFrom = 0; } // angefangene Verpackung zurück if (WK.el) WK.el.hidden = true; if (WK.loop) cancelAnimationFrame(WK.loop); WK.loop = 0;
    if (WK.scene) { WK.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); } }); WK.scene = null; }
    try { save(); } catch (e) {}
  }
  function workResize() { const cv = WK.el.querySelector('.wcv'), box = cv.parentElement, w = box.clientWidth || 600, h = box.clientHeight || 320; WK.r.setSize(w, h, false); cv.style.width = w + 'px'; cv.style.height = h + 'px'; if (WK.cam) { WK.cam.aspect = w / h; WK.cam.updateProjectionMatrix(); workFit(); } }
  function workFit() { // Kamera so weit zurück, dass Breite fw und Höhe fh um die Mitte fc ganz zu sehen sind
    const f = WK.fit, c = WK.cam; if (!f || !c) return; const t = Math.tan(c.fov * Math.PI / 360), d = Math.max(f.h / 2 / t, f.w / 2 / (t * c.aspect)) * 1.08; c.position.copy(f.c).addScaledVector(f.dir, d); c.lookAt(f.c); }
  function workBtn(txt, fn, cls) { const b = document.createElement('button'); b.textContent = txt; if (cls) b.className = cls; b.addEventListener('click', fn); WK.btns.appendChild(b); return b; }
  // ---------- 3D-Bausteine ----------
  const M = (c, o) => new THREE3.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.75, metalness: 0 }, o || {}));
  function mkPot(T) {
    const g = new T.Group(), prof = [[0.16, 0], [0.2, 0.26], [0.215, 0.28], [0.215, 0.31], [0.19, 0.31]].map(([x, y]) => new T.Vector2(x, y));
    const pot = new T.Mesh(new T.LatheGeometry(prof, 32), M('#C2643A', { side: T.DoubleSide })); g.add(pot);
    const soil = new T.Mesh(new T.CircleGeometry(0.19, 32), M('#3A2618')); soil.rotation.x = -Math.PI / 2; soil.position.y = 0.285; g.add(soil); g.userData.soil = soil; return g;
  }
  function mkBud(T, dry) { // Knospe aus kleinen Kugeln mit Härchen
    const g = new T.Group(), cA = dry ? '#B8A048' : '#8CC65A', cB = dry ? '#9C8A3A' : '#6FAE48', hair = dry ? '#B5652A' : '#E8833A';
    const s = new T.IcosahedronGeometry(0.03, 1);
    for (let i = 0; i < 7; i++) { const m = new T.Mesh(s, M(i % 2 ? cA : cB, { roughness: 0.6 })), a = i * 2.4, r = i ? 0.022 : 0; m.position.set(Math.cos(a) * r, i * 0.012, Math.sin(a) * r); m.scale.setScalar(1 - i * 0.06); g.add(m); }
    const hs = new T.SphereGeometry(0.006, 6, 4); for (let i = 0; i < 10; i++) { const m = new T.Mesh(hs, M(hair)); const a = i * 1.7; m.position.set(Math.cos(a) * 0.032, 0.01 + (i % 5) * 0.014, Math.sin(a) * 0.032); g.add(m); }
    const fr = new T.Mesh(new T.IcosahedronGeometry(0.036, 1), M('#FFFFFF', { transparent: true, opacity: 0.12, roughness: 0.2 })); fr.position.y = 0.03; g.add(fr);
    g.userData.pick = true; return g;
  }
  function mkLeafPiece(T, dry) { // Tabakblatt
    const sh = new T.Shape(); sh.moveTo(0, 0); for (let i = 1; i <= 12; i++) { const t = i / 12; sh.lineTo(Math.sin(Math.PI * Math.pow(t, 0.7)) * 0.07, t * 0.22); } for (let i = 12; i >= 0; i--) { const t = i / 12; sh.lineTo(-Math.sin(Math.PI * Math.pow(t, 0.7)) * 0.07, t * 0.22); }
    const m = new T.Mesh(new T.ShapeGeometry(sh), M(dry ? '#B8823A' : '#9AB84A', { side: T.DoubleSide })); const g = new T.Group(); g.add(m); g.userData.pick = true; return g;
  }
  const mkPiece = (T, dry) => WK.kind === 'leaf' ? mkLeafPiece(T, dry) : mkBud(T, dry);
  function mkPlant(T, stage, nb) { // Pflanze mit Stängel, Blättern und nb Knospen (bzw. Blättern zum Ernten)
    const g = new T.Group(), hgt = 0.25 + 0.65 * stage, leafG = WK.kind === 'leaf' ? null : new T.SphereGeometry(1, 10, 6), picks = [];
    const stem = new T.Mesh(new T.CylinderGeometry(0.018, 0.03, hgt, 8), M('#4E8A3A')); stem.position.y = 0.3 + hgt / 2; g.add(stem);
    const nodes = Math.max(2, Math.round(2 + stage * 4));
    for (let i = 0; i < nodes; i++) { const y = 0.34 + (i + 0.6) / nodes * hgt * 0.92, a = i * 2.1, len = (0.24 - i * 0.02) * (0.5 + stage * 0.6);
      for (const sd of [0, Math.PI]) { const br = new T.Group(); br.position.y = y; br.rotation.y = a + sd; g.add(br);
        const twig = new T.Mesh(new T.CylinderGeometry(0.008, 0.01, len, 6), M('#4E8A3A')); twig.rotation.z = Math.PI / 2 - 0.5; twig.position.set(len * 0.42, len * 0.22, 0); br.add(twig);
        if (WK.kind === 'leaf') { const lf = mkLeafPiece(T, false); lf.scale.setScalar(0.8 + stage); lf.rotation.set(-0.9, 0, -Math.PI / 2 + 0.3); lf.position.set(len * 0.8, len * 0.4, 0); lf.userData.pick = false; br.add(lf); }
        else for (let k = 0; k < 5; k++) { const lf = new T.Mesh(leafG, M(k % 2 ? '#3E8E41' : '#4FA24E', { side: T.DoubleSide })); lf.scale.set(0.022, 0.004, 0.11 * (1 - Math.abs(k - 2) * 0.18) * (0.6 + stage * 0.5)); lf.position.set(len * 0.85, len * 0.45, 0); lf.rotation.set(0, (k - 2) * 0.5, 0); lf.translateZ(0.09 * (1 - Math.abs(k - 2) * 0.18) * (0.6 + stage * 0.5)); br.add(lf); }
        br.userData.tip = new T.Vector3(len * 0.85, len * 0.5, 0); } }
    if (nb > 0) { // Knospen bzw. Erntblätter an die Zweigspitzen und oben auf die Spitze
      const tips = []; g.children.forEach(c => { if (c.userData && c.userData.tip) tips.push(c); });
      const top = mkPiece(T, false); top.position.set(0, 0.3 + hgt + 0.02, 0); top.scale.setScalar(WK.kind === 'leaf' ? 1.2 : 1.5); g.add(top); picks.push(top);
      for (let i = 0; i < nb - 1 && i < tips.length; i++) { const br = tips[tips.length - 1 - i], p = mkPiece(T, false); p.position.copy(br.userData.tip); p.position.y += 0.02; p.scale.setScalar(WK.kind === 'leaf' ? 1 : 1.15); br.add(p); picks.push(p); } }
    g.userData.picks = picks; return g;
  }
  function mkCan(T) {
    const g = new T.Group(), mat = M('#3F9E6A', { metalness: 0.3, roughness: 0.4 });
    const body = new T.Mesh(new T.CylinderGeometry(0.09, 0.1, 0.18, 20), mat); g.add(body);
    const sp = new T.Mesh(new T.CylinderGeometry(0.012, 0.018, 0.26, 10), mat); sp.rotation.z = -1.0; sp.position.set(0.17, 0.05, 0); g.add(sp);
    const rose = new T.Mesh(new T.CylinderGeometry(0.03, 0.015, 0.03, 12), M('#C9D2DC', { metalness: 0.5 })); rose.rotation.z = -1.0; rose.position.set(0.28, 0.115, 0); g.add(rose);
    const hd = new T.Mesh(new T.TorusGeometry(0.07, 0.012, 8, 20, Math.PI), mat); hd.position.set(-0.02, 0.09, 0); hd.rotation.z = 0.2; g.add(hd);
    g.userData.tip = new T.Vector3(0.3, 0.12, 0); return g;
  }
  function baseScene(T, camPos, look, fw, fh) {
    const sc = new T.Scene(), cam = new T.PerspectiveCamera(36, 1.8, 0.05, 30); cam.position.copy(camPos); cam.lookAt(look); WK.fit = { c: look.clone(), dir: camPos.clone().sub(look).normalize(), w: fw || 1.6, h: fh || 1.2 };
    sc.add(new T.HemisphereLight('#FFF4DC', '#2A3442', 1.15)); const dl = new T.DirectionalLight('#FFFFFF', 1.6); dl.position.set(1.5, 2.5, 1.8); sc.add(dl); const fl = new T.PointLight('#9FE3B0', 0.8, 4); fl.position.set(-1.2, 1.2, 0.8); sc.add(fl);
    const fl0 = new T.Mesh(new T.CircleGeometry(9, 48), M('#222B36')); fl0.rotation.x = -Math.PI / 2; sc.add(fl0);
    WK.scene = sc; WK.cam = cam; WK.root = new T.Group(); sc.add(WK.root); return sc;
  }
  // ---------- Szenen ----------
  function workBuild(mode) {
    const T = THREE3, ar = WK.ar, st = S(ar), L = WK.L, tg = WK.tg;
    if (mode === 'water' || mode === 'harvest') {
      baseScene(T, new T.Vector3(0, 1.15, 1.9), new T.Vector3(0, mode === 'harvest' ? 0.68 : 0.62, 0), 1.5, mode === 'harvest' ? 1.42 : 1.3); const p = potOf(tg), pot = mkPot(T); WK.root.add(pot); WK.pot = pot; WK.p = p;
      const nb = mode === 'harvest' ? Math.max(4, Math.min(9, harvestYield(ar))) : 0, plant = mkPlant(T, mode === 'harvest' ? 1 : Math.min(1, 0.15 + (p.p || 0) * 0.85), nb); WK.root.add(plant); WK.plant = plant;
      if (mode === 'water') { WK.can = mkCan(T); WK.can.position.set(0.5, 0.98, 0); WK.scene.add(WK.can); WK.drops = []; const dg = new T.SphereGeometry(0.012, 6, 4), dm = M('#7FC8F0', { transparent: true, opacity: 0.85 }); for (let i = 0; i < 40; i++) { const d = new T.Mesh(dg, dm); d.visible = false; WK.scene.add(d); WK.drops.push({ m: d, v: new T.Vector3(), t: 0 }); }
        WK.hintEl.textContent = 'Kanne mit dem Finger über den Topf ziehen und gedrückt halten'; workBtn('Fertig', () => workClose(), 'wok'); }
      else { WK.got = 0; WK.need = plant.userData.picks.length; WK.hintEl.textContent = (WK.kind === 'leaf' ? 'Tippe die reifen Blätter an' : 'Tippe die Knospen an'); workBtn('Alle ernten', () => { plant.userData.picks.slice().forEach(q => workPick(q)); }, 'wall'); }
      workCount();
    } else if (mode === 'rack') {
      baseScene(T, new T.Vector3(0, 1.05, 2.3), new T.Vector3(0, 0.68, 0.25), 2.1, 1.75); const cap = rackCap(ar), cols = Math.min(8, cap), rows = Math.ceil(cap / cols), W = 1.6, wood = M('#7A5232');
      for (const x of [-W / 2 - 0.05, W / 2 + 0.05]) { const post = new T.Mesh(new T.BoxGeometry(0.05, 1.5, 0.05), wood); post.position.set(x, 0.75, 0); WK.root.add(post); }
      WK.slots = []; for (let r = 0; r < rows; r++) { const y = 1.38 - r * (1.0 / Math.max(1, rows)); const line = new T.Mesh(new T.CylinderGeometry(0.006, 0.006, W + 0.1, 6), M('#D8D2C4')); line.rotation.z = Math.PI / 2; line.position.y = y; WK.root.add(line);
        for (let c = 0; c < cols && WK.slots.length < cap; c++) WK.slots.push({ x: -W / 2 + (c + 0.5) * W / cols, y, item: null }); }
      const wet = Math.floor(st.rack.wet + 1e-6), dry = Math.floor(st.rack.dry + 1e-6); let si = 0;
      for (let i = 0; i < dry && si < WK.slots.length; i++) rackHang(WK.slots[si++], true, false);
      for (let i = 0; i < wet && si < WK.slots.length; i++) rackHang(WK.slots[si++], false, false);
      const bk = new T.Mesh(new T.CylinderGeometry(0.2, 0.16, 0.14, 20, 1, true), M('#A07A4A', { side: T.DoubleSide })); bk.position.set(-0.55, 0.07, 0.55); WK.root.add(bk); WK.basket = bk; WK.basketItems = [];
      const box = new T.Mesh(new T.BoxGeometry(0.36, 0.12, 0.26), M('#2E3A48')); box.position.set(0.55, 0.06, 0.55); WK.root.add(box); WK.box = box;
      rackBasket(); WK.hintEl.textContent = 'Tippe den Korb an zum Aufhängen, tippe trockene ' + (WK.kind === 'leaf' ? 'Blätter' : 'Knospen') + ' zum Abnehmen';
      workBtn('Alle aufhängen', () => { let n = 0; while (S(ar).inv.fresh > 0 && rackHangOne()) if (++n > 99) break; }, 'wall'); workBtn('Alle Trockenen ab', () => { WK.slots.filter(s => s.item && s.dry).forEach(s => rackTake(s)); }, 'wall'); workBtn('Fertig', () => workClose(), 'wok'); workCount();
    } else if (mode === 'pack') {
      baseScene(T, new T.Vector3(0, 1.4, 1.3), new T.Vector3(0, 0.42, 0.05), 1.9, 0.75); const top = new T.Mesh(new T.BoxGeometry(1.8, 0.06, 0.95), M('#8A5E3A')); top.position.y = 0.42; WK.root.add(top);
      for (const [x, z] of [[-0.82, -0.4], [0.82, -0.4], [-0.82, 0.4], [0.82, 0.4]]) { const lg = new T.Mesh(new T.BoxGeometry(0.06, 0.42, 0.06), M('#6A4428')); lg.position.set(x, 0.21, z); WK.root.add(lg); }
      WK.pile = []; packPile(); WK.inBag = 0; WK.made = 0; packNewBag(); WK.hintEl.textContent = 'Lege ' + ar.packN + ' ' + (WK.kind === 'leaf' ? 'Blätter' : 'Knospen') + ' in ' + (L.unit === 'Beutel' ? 'den Beutel' : 'die Verpackung') + ', dann tippe sie an zum Verschließen';
      workBtn('Fertig', () => workClose(), 'wok'); workCount();
    }
  }
  function workCount() {
    const ar = WK.ar, st = S(ar), L = WK.L; let t = '';
    if (WK.mode === 'water') t = '💧 ' + Math.round((WK.p.w || 0) * 100) + ' %';
    else if (WK.mode === 'harvest') t = '🧺 ' + WK.got + ' / ' + WK.need;
    else if (WK.mode === 'rack') t = '🧺 ' + st.inv.fresh + ' ' + (L.fresh || 'frisch') + ' · ' + Math.floor(st.rack.wet) + ' trocknen · ' + Math.floor(st.rack.dry) + ' trocken · 📦 ' + st.inv.dried;
    else if (WK.mode === 'pack') t = (WK.kind === 'leaf' ? '🍂 ' : '🌿 ') + (st.inv.dried + Math.floor(st.tab.dry)) + ' trocken · ' + WK.inBag + ' / ' + ar.packN + ' drin · fertig: ' + WK.made;
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
    const pc = mkPiece(T, dry); pc.position.y = WK.kind === 'leaf' ? -0.34 : -0.17; if (WK.kind === 'leaf') pc.rotation.z = Math.PI; pc.scale.setScalar(1.4); it.add(pc); pc.userData.slot = slot;
    it.position.set(slot.x, slot.y, 0); WK.root.add(it); slot.item = it; slot.dry = dry; slot.piece = pc;
    if (anim) { const from = WK.basket.position.clone().add(new T.Vector3(0, 0.15, 0)); WK.anim.push({ o: it, t: 0, d: 0.4, a: from, b: it.position.clone() }); it.position.copy(from); }
  }
  function rackHangOne() {
    const ar = WK.ar, st = S(ar); if (st.inv.fresh <= 0) return false; const free = WK.slots.find(s => !s.item); if (!free || rackCap(ar) - Math.floor(st.rack.wet + st.rack.dry) <= 0) { WK.hintEl.textContent = (WK.L.rack || 'Gestell') + ' ist voll'; return false; }
    st.inv.fresh -= 1; st.rack.wet += 1; rackHang(free, false, true); rackBasket(); workCount(); try { sfx.put(); } catch (e) {} return true;
  }
  function rackTake(slot) {
    const ar = WK.ar, st = S(ar); if (!slot.item || !slot.dry || st.rack.dry < 1 - 1e-6) return; st.rack.dry -= 1; st.inv.dried += 1; const it = slot.item; slot.item = null; slot.dry = false;
    WK.anim.push({ o: it, t: 0, d: 0.4, a: it.position.clone(), b: WK.box.position.clone().add(new THREE3.Vector3(0, 0.1, 0)), end: () => WK.root.remove(it) }); workCount(); try { sfx.put(); } catch (e) {}
  }
  function rackBasket() {
    const T = THREE3, n = Math.min(8, S(WK.ar).inv.fresh); while (WK.basketItems.length > n) WK.root.remove(WK.basketItems.pop());
    while (WK.basketItems.length < n) { const i = WK.basketItems.length, pc = mkPiece(T, false); pc.position.set(WK.basket.position.x + Math.cos(i * 2.2) * 0.08, 0.1 + (i % 3) * 0.02, WK.basket.position.z + Math.sin(i * 2.2) * 0.08); pc.userData.basket = true; WK.root.add(pc); WK.basketItems.push(pc); }
  }
  // ---------- Packtisch ----------
  function packAvail() { const st = S(WK.ar); return st.inv.dried + Math.floor(st.tab.dry + 1e-6); }
  function packPile() { const T = THREE3, n = Math.min(12, packAvail() - WK.pile.filter(p => !p.userData.taken).length); for (let i = 0; i < n; i++) { const k = WK.pile.length, pc = mkPiece(T, true); pc.position.set(-0.6 + (k % 4) * 0.09 + (Math.floor(k / 4) % 2) * 0.04, 0.46, -0.15 + Math.floor(k / 4) * 0.1); if (WK.kind === 'leaf') pc.rotation.x = -Math.PI / 2; pc.scale.setScalar(1.3); pc.userData.pile = true; WK.root.add(pc); WK.pile.push(pc); } }
  function packNewBag() {
    const T = THREE3, g = new T.Group(), bag = new T.Mesh(new T.BoxGeometry(0.34, 0.03, 0.42), M('#DDEBF5', { transparent: true, opacity: 0.38, roughness: 0.15 })); bag.position.y = 0.015; g.add(bag);
    const zip = new T.Mesh(new T.BoxGeometry(0.34, 0.012, 0.03), M('#5BB0E8')); zip.position.set(0, 0.03, -0.2); g.add(zip); g.userData.zip = zip; g.userData.bag = true; bag.userData.isBag = true; zip.userData.isBag = true;
    if (WK.L.unit !== 'Beutel') { bag.material.color.set('#E8D9B8'); bag.material.opacity = 0.9; } // Päckchen bzw. Dose
    g.position.set(0.35, 0.45, 0.05); WK.root.add(g); WK.bag = g; WK.inBag = 0; WK.bagItems = [];
  }
  function packPut(pc) {
    const ar = WK.ar, st = S(ar); if (WK.inBag >= ar.packN || pc.userData.taken) return; if (packAvail() <= 0) return;
    if (st.inv.dried >= 1) st.inv.dried -= 1; else st.tab.dry = Math.max(0, st.tab.dry - 1); WK.packFrom = (WK.packFrom || 0) + 1;
    pc.userData.taken = true; const k = WK.inBag, b = WK.bag.position.clone().add(new THREE3.Vector3(-0.1 + (k % 3) * 0.1, 0.04, -0.05 + Math.floor(k / 3) * 0.1));
    WK.anim.push({ o: pc, t: 0, d: 0.35, a: pc.position.clone(), b }); WK.bagItems.push(pc); WK.inBag++; try { sfx.put(); } catch (e) {} packPile(); workCount();
    if (WK.inBag >= ar.packN) { WK.hintEl.textContent = 'Tippe ' + (WK.L.unit === 'Beutel' ? 'den Beutel' : 'die Verpackung') + ' an zum Verschließen'; WK.bag.userData.zip.material.emissive = new THREE3.Color('#2A6A9A'); }
  }
  function packSeal() {
    const ar = WK.ar, st = S(ar); if (WK.inBag < ar.packN) return; const toBag = unitRoom(ar) > 0; if (!toBag && st.tab.bags >= bagsMax()) { WK.hintEl.textContent = 'Rucksack und Tisch sind voll'; return; }
    if (toBag) st.inv.bags += 1; else st.tab.bags += 1; WK.made++; WK.packFrom = 0; try { sfx.pack(); } catch (e) {} floater(ar.TABLE.x, ar.TABLE.y + 10, '+1 ' + (WK.L.unit || ''), ar.dry);
    const old = WK.bag; old.userData.zip.material.emissive = new THREE3.Color('#000000'); WK.anim.push({ o: old, t: 0, d: 0.5, a: old.position.clone(), b: new THREE3.Vector3(0.95, 0.9, 0.3), end: () => WK.root.remove(old) });
    WK.bagItems.forEach(q => WK.anim.push({ o: q, t: 0, d: 0.5, a: q.position.clone(), b: new THREE3.Vector3(0.95, 0.92, 0.3), end: () => WK.root.remove(q) }));
    if (packAvail() >= ar.packN && (unitRoom(ar) > 0 || st.tab.bags < bagsMax())) { packNewBag(); WK.hintEl.textContent = 'Nächste' + (WK.L.unit === 'Beutel' ? 'r Beutel' : ' Verpackung') + ': ' + ar.packN + ' hineinlegen'; }
    else { WK.bag = null; WK.hintEl.textContent = 'Fertig: ' + WK.made + ' ' + (WK.L.unit || ''); setTimeout(() => { if (workOpen && WK.mode === 'pack') workClose(); }, 1100); } workCount();
  }
  // ---------- Eingabe ----------
  function workBind(cv) {
    if (WK.bound) return; WK.bound = true; const ray = new THREE3.Raycaster(), v2 = new THREE3.Vector2();
    const ndc = e => { const r = cv.getBoundingClientRect(); v2.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); return v2; };
    const hit = e => { ray.setFromCamera(ndc(e), WK.cam); return ray.intersectObjects(WK.root.children, true); };
    const up = o => { while (o && !(o.userData && (o.userData.pick || o.userData.isBag || o.userData.bag))) o = o.parent; return o; };
    cv.addEventListener('pointerdown', e => { if (!workOpen || !WK.scene) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      if (WK.mode === 'water') { WK.holding = true; workCanTo(e); return; }
      const hs = hit(e); for (const h of hs) { const o = up(h.object); if (!o) continue;
        if (WK.mode === 'harvest' && o.userData.pick && WK.plant.userData.picks.includes(o)) { workPick(o); return; }
        if (WK.mode === 'rack') { if (o.userData.basket) { rackHangOne(); return; } if (o.userData.slot && o.userData.slot.dry) { rackTake(o.userData.slot); return; } }
        if (WK.mode === 'pack') { if (o.userData.pile) { packPut(o); return; } if ((o.userData.isBag || o.userData.bag) && WK.inBag >= WK.ar.packN) { packSeal(); return; } } }
      if (WK.mode === 'rack') { const b = WK.basket.position; const r = cv.getBoundingClientRect(); const p = b.clone().project(WK.cam), sx = (p.x + 1) / 2 * r.width + r.left, sy = (1 - p.y) / 2 * r.height + r.top; if (Math.hypot(e.clientX - sx, e.clientY - sy) < 60) rackHangOne(); }
      if (WK.mode === 'pack') { const free = WK.pile.find(q => !q.userData.taken); if (free && WK.inBag < WK.ar.packN) { const p = free.position.clone().project(WK.cam), r = cv.getBoundingClientRect(), sx = (p.x + 1) / 2 * r.width + r.left, sy = (1 - p.y) / 2 * r.height + r.top; if (Math.hypot(e.clientX - sx, e.clientY - sy) < 70) packPut(free); } }
    });
    cv.addEventListener('pointermove', e => { if (workOpen && WK.mode === 'water' && WK.scene) workCanTo(e); });
    const stop = () => { WK.holding = false; }; cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop); cv.addEventListener('lostpointercapture', stop);
    window.addEventListener('resize', () => { if (workOpen) workResize(); }); window.addEventListener('keydown', e => { if (workOpen && e.key === 'Escape') { e.preventDefault(); workClose(); } });
  }
  function workCanTo(e) { // Kanne folgt dem Finger in einer Ebene über dem Topf
    const cv = WK.el.querySelector('.wcv'), r = cv.getBoundingClientRect(), T = THREE3, ray = new T.Raycaster(); ray.setFromCamera(new T.Vector2((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), WK.cam);
    const pl = new T.Plane(new T.Vector3(0, 0, 1), -0.1), pt = new T.Vector3(); if (ray.ray.intersectPlane(pl, pt)) { WK.can.position.set(Math.max(-1.1, Math.min(0.8, pt.x - 0.3)), 0.98, 0); }
  }
  // ---------- Ablauf ----------
  function workFrame(ts) {
    if (!workOpen || !WK || !WK.scene) return; const dt = Math.min(0.05, ((ts - (WK.last || ts)) / 1000) || 0.016); WK.last = ts; WK.t += dt; const T = THREE3;
    WK.root.rotation.y = Math.sin(WK.t * 0.35) * 0.25;
    for (let i = WK.anim.length - 1; i >= 0; i--) { const a = WK.anim[i]; a.t += dt; const k = Math.min(1, a.t / a.d), e = 1 - Math.pow(1 - k, 3); a.o.position.lerpVectors(a.a, a.b, e); a.o.position.y += Math.sin(k * Math.PI) * 0.12; if (k >= 1) { WK.anim.splice(i, 1); if (a.end) a.end(); } }
    if (WK.mode === 'water') {
      const can = WK.can, tilt = WK.holding ? -0.75 : 0; can.rotation.z += (tilt - can.rotation.z) * Math.min(1, dt * 10);
      const tip = can.userData.tip.clone().applyMatrix4(can.matrixWorld), pr = WK.root.rotation.y, potX = 0, potZ = 0; const over = Math.hypot(tip.x - potX, tip.z - potZ) < 0.26 && WK.holding;
      if (WK.holding) for (const d of WK.drops) if (!d.m.visible && Math.random() < dt * 30) { d.m.visible = true; d.m.position.copy(tip); d.v.set((Math.random() - 0.5) * 0.15, -0.2, (Math.random() - 0.5) * 0.15); d.t = 0; break; }
      for (const d of WK.drops) if (d.m.visible) { d.v.y -= 3.2 * dt; d.m.position.addScaledVector(d.v, dt); d.t += dt; if (d.m.position.y < 0.3 || d.t > 1.2) d.m.visible = false; }
      if (over && WK.p.s === 1) { const b = WK.p.w; WK.p.w = Math.min(1, WK.p.w + dt * 1.0); if (WK.p.w > b && Math.random() < dt * 10) { try { sfx.water(); } catch (e) {} } workCount(); const s = WK.pot.userData.soil; s.material.color.set(WK.p.w > 0.6 ? '#2A1A10' : '#3A2618');
        if (WK.p.w >= 1 && !WK.done) { WK.done = true; WK.hintEl.textContent = 'Genug Wasser!'; setTimeout(() => { if (workOpen && WK.mode === 'water') workClose(); }, 800); } }
    }
    if (WK.mode === 'harvest' && WK.plant) WK.plant.userData.picks.forEach((q, i) => { if (!q.userData.taken) q.rotation.y = Math.sin(WK.t * 2 + i) * 0.15; });
    WK.r.render(WK.scene, WK.cam); WK.loop = requestAnimationFrame(workFrame);
  }
