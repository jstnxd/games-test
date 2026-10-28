  // =====================================================================================================
  // v172: Glow-up der Arbeitsfenster. Ausstattung je Raum (Keller, Scheune, Premium), Blätter mit Adern,
  // glitzernde Knospen, Staub im Lichtkegel, Spritzer, Blattschnipsel, Korb, Waage, Konfetti beim Abschluss.
  // Alles rein dekorativ: die Spiellogik bleibt in 19b_arbeit.js.
  // =====================================================================================================
  const dotTex = () => WK.gc.dotT || (WK.gc.dotT = cvTex(32, 32, x => { const g = x.createRadialGradient(16, 16, 0, 16, 16, 15); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); }));
  // Blatt mit Mittelrippe und Seitenadern (Textur über die UV des Blattgitters)
  function leafTex(col, tob) { const k = 'lt' + col + (tob ? 't' : ''); if (WK.gc[k]) return WK.gc[k];
    return (WK.gc[k] = cvTex(64, 128, (x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, shadeHex(col, -0.25)); g.addColorStop(0.5, shadeHex(col, 0.12)); g.addColorStop(1, shadeHex(col, -0.25)); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.strokeStyle = shadeHex(col, 0.45); x.lineWidth = tob ? 3 : 2; x.beginPath(); x.moveTo(w / 2, 0); x.lineTo(w / 2, h); x.stroke(); x.lineWidth = 1; x.strokeStyle = shadeHex(col, 0.3);
      for (let i = 1; i < (tob ? 9 : 7); i++) { const y = i * h / (tob ? 9 : 7); x.beginPath(); x.moveTo(w / 2, y); x.quadraticCurveTo(w * 0.3, y + 6, 2, y + 14); x.moveTo(w / 2, y); x.quadraticCurveTo(w * 0.7, y + 6, w - 2, y + 14); x.stroke(); }
      x.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 30; i++) x.fillRect((i * 37) % w, (i * 71) % h, 2, 2); })); }
  const MLeaf = (col, tob) => WK.gc['ml' + col + (tob ? 't' : '')] || (WK.gc['ml' + col + (tob ? 't' : '')] = new THREE3.MeshToonMaterial({ map: leafTex(col, tob), side: THREE3.DoubleSide, gradientMap: toonGrad() }));
  // Harzkristalle: kleine glitzernde Punkte an der Knospe
  function budSparkle(T, g, len, dry) {
    const n = 14, p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = i * 2.4, t = 0.08 + (i / n) * 0.9, r = len * 0.3 * (1 - t * 0.5) + 0.004; p[i * 3] = Math.cos(a) * r; p[i * 3 + 1] = t * len; p[i * 3 + 2] = Math.sin(a) * r; }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(p, 3));
    const mat = WK.gc.sparkM || (WK.gc.sparkM = new T.PointsMaterial({ map: dotTex(), color: '#FFFFFF', size: 0.016, transparent: true, opacity: 0.9, depthWrite: false, blending: T.AdditiveBlending })); const pts = new T.Points(geo, mat); pts.raycast = () => {}; g.add(pts);
  }
  // v172: unbewegliche Teile zu einem Objekt je Material zusammenfassen (viel weniger Zeichenaufrufe).
  // Übersprungen wird alles mit userData.pick (antippbar), userData.keep (bewegt sich) sowie Punkte und Sprites.
  function bake(root) {
    const T = THREE3; root.updateMatrixWorld(true); const inv = new T.Matrix4().copy(root.matrixWorld).invert(), buckets = new Map(), rm = [];
    const walk = (o, top) => { for (const c of o.children.slice()) { if (c.userData && (c.userData.keep || (c.userData.pick && !top) || c.userData.soilT)) continue; if (c.isMesh && !c.isPoints && c.geometry && c.material && !Array.isArray(c.material)) { let L = buckets.get(c.material); if (!L) buckets.set(c.material, L = []); L.push(c); rm.push(c); } if (c.children && c.children.length) walk(c, false); } };
    walk(root, true);
    for (const [mat, L] of buckets) { if (L.length < 2) { const i = rm.indexOf(L[0]); if (i >= 0) rm.splice(i, 1); continue; } const P = [], N = [], U = [];
      for (const m of L) { let g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone(); g.applyMatrix4(new T.Matrix4().multiplyMatrices(inv, m.matrixWorld)); const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv; for (let i = 0; i < pa.count; i++) { P.push(pa.getX(i), pa.getY(i), pa.getZ(i)); if (na) N.push(na.getX(i), na.getY(i), na.getZ(i)); else N.push(0, 1, 0); if (ua) U.push(ua.getX(i), ua.getY(i)); else U.push(0, 0); } g.dispose(); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(N, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(U, 2)); const mm = new T.Mesh(geo, mat); mm.userData.baked = true; root.add(mm); }
    for (const m of rm) if (m.parent) m.parent.remove(m);
    return root;
  }
  // ---------- Teilchen ----------
  // burst: einmaliger Ausstoß (Schnipsel, Spritzer, Funken, Konfetti)
  function burst(pos, cols, n, sp, life, size, grav, add) {
    const T = THREE3, P = new Float32Array(n * 3), C = new Float32Array(n * 3), V = [], c = new T.Color();
    for (let i = 0; i < n; i++) { P[i * 3] = pos.x; P[i * 3 + 1] = pos.y; P[i * 3 + 2] = pos.z; c.set(cols[i % cols.length]); C[i * 3] = c.r; C[i * 3 + 1] = c.g; C[i * 3 + 2] = c.b; const a = Math.random() * Math.PI * 2, u = Math.random() * 0.9 + 0.1; V.push([Math.cos(a) * sp * u, sp * (0.6 + Math.random()), Math.sin(a) * sp * u]); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(P, 3)); geo.setAttribute('color', new T.BufferAttribute(C, 3));
    const mat = new T.PointsMaterial({ map: dotTex(), size: size || 0.03, vertexColors: true, transparent: true, depthWrite: false, blending: add ? T.AdditiveBlending : T.NormalBlending }); const pts = new T.Points(geo, mat); pts.raycast = () => {}; WK.scene.add(pts);
    (WK.fx || (WK.fx = [])).push({ pts, V, t: 0, life: life || 0.8, grav: grav === undefined ? 3 : grav });
  }
  // Staub im Licht: langsam schwebende Punkte in einem Kasten
  function motes(c, sx, sy, sz, n, col) {
    const T = THREE3, P = new Float32Array(n * 3); for (let i = 0; i < n; i++) { P[i * 3] = c.x + (Math.random() - 0.5) * sx; P[i * 3 + 1] = c.y + (Math.random() - 0.5) * sy; P[i * 3 + 2] = c.z + (Math.random() - 0.5) * sz; }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(P, 3)); const pts = new T.Points(geo, new T.PointsMaterial({ map: dotTex(), color: col || '#FFE9C0', size: 0.014, transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending })); pts.raycast = () => {};
    WK.scene.add(pts); (WK.motes || (WK.motes = [])).push({ pts, c, sx, sy, sz });
  }
  // Großes Häkchen und Konfetti beim Abschluss
  function celebrate(txt, at) {
    try { burst(at || new THREE3.Vector3(0, 0.9, 0.2), ['#FF5C7A', '#FFD24A', '#5BC0EB', '#63C174', '#C9A2FF', '#FFFFFF'], 70, 1.3, 1.4, 0.035, 2.2, false); } catch (e) {}
    const st = WK.el && WK.el.querySelector('.wstage'); if (!st) return; let p = st.querySelector('.wpop'); if (!p) { p = document.createElement('div'); p.className = 'wpop'; st.appendChild(p); }
    p.textContent = txt; p.classList.remove('on'); void p.offsetWidth; p.classList.add('on');
  }
  // ---------- Ausstattung je Raum ----------
  function box(T, w, h, d, col, x, y, z, ol, par) { const m = new T.Mesh(new T.BoxGeometry(w, h, d), typeof col === 'string' ? M(col) : col); m.position.set(x, y, z); if (ol) OL(m, ol); (par || WK.scene).add(m); return m; }
  function cyl(T, rt, rb, h, col, x, y, z, ol, par, seg) { const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 16), typeof col === 'string' ? M(col) : col); m.position.set(x, y, z); if (ol) OL(m, ol); (par || WK.scene).add(m); return m; }
  function decoRoom(T, sc) {
    const k = WK.ar.key, kind = k === 'tabak' ? 'barn' : k === 'pr' ? 'clean' : 'cellar', Z = -1.18, mode = WK.mode, D = new T.Group(); sc.add(D); WK.scene = D; try { decoRoom0(T, sc, k, kind, Z, mode); } finally { WK.scene = sc; } bake(D);
  }
  function decoRoom0(T, sc, k, kind, Z, mode) {
    sc.fog = new T.Fog('#10151C', 4.2, 9);
    WK.fans = [];
    if (kind === 'cellar') {
      // Rohre unter der Decke und an der Wand
      for (const [y, c] of [[2.15, '#7A7F86'], [2.02, '#A0643A']]) { const p = cyl(T, 0.035, 0.035, 9, c, 0, y, Z + 0.07, 0.15); p.rotation.z = Math.PI / 2; }
      for (const x of [-2.6, 1.9]) { const p = cyl(T, 0.03, 0.03, 2.1, '#7A7F86', x, 1.05, Z + 0.07, 0.15); }
      // Wandregal mit Gläsern und Flaschen
      const sx = -1.55; for (const y of [1.05, 1.45]) { box(T, 0.9, 0.035, 0.22, MTX(woodTex('#8A5E3A', 'rgba(0,0,0,.25)', 2, false)), sx, y, Z + 0.12, 0.03);
        for (let i = 0; i < 5; i++) { const x = sx - 0.36 + i * 0.18, jar = i % 2 === 0; if (jar) { cyl(T, 0.045, 0.045, 0.12, new T.MeshToonMaterial({ color: '#CFE8F2', transparent: true, opacity: 0.55, gradientMap: toonGrad() }), x, y + 0.08, Z + 0.12, 0, null, 12); cyl(T, 0.048, 0.048, 0.02, ['#D33F3F', '#E8B23A', '#3FAE6A'][(i + (y > 1.2 ? 1 : 0)) % 3], x, y + 0.15, Z + 0.12, 0.08, null, 12); cyl(T, 0.035, 0.035, 0.05, '#6FAE48', x, y + 0.05, Z + 0.12, 0, null, 10); }
          else { cyl(T, 0.032, 0.04, 0.16, ['#2E6A4A', '#6A3A2A', '#2A4A7A'][i % 3], x, y + 0.1, Z + 0.12, 0.08, null, 10); cyl(T, 0.012, 0.012, 0.05, '#2A2A2A', x, y + 0.2, Z + 0.12, 0, null, 6); } } }
      // Lüfter an der Wand (dreht sich)
      { const g = new T.Group(); g.position.set(1.35, 1.55, Z + 0.06); sc.add(g); const fr = box(T, 0.42, 0.42, 0.05, '#3A3F46', 0, 0, 0, 0.04, g); const ring = new T.Mesh(new T.TorusGeometry(0.17, 0.015, 8, 24), M('#2A2E34')); ring.position.z = 0.03; g.add(ring);
        const bl = new T.Group(); bl.userData.keep = true; bl.position.z = 0.035; g.add(bl); for (let i = 0; i < 4; i++) { const b = new T.Mesh(new T.BoxGeometry(0.06, 0.15, 0.008), M('#9AA4AE')); b.position.y = 0.08; const h = new T.Group(); h.rotation.z = i * Math.PI / 2; b.rotation.y = 0.4; h.add(b); bl.add(h); } cyl(T, 0.03, 0.03, 0.02, '#C9D2DC', 0, 0, 0.045, 0, g).rotation.x = Math.PI / 2;
        for (let i = -3; i <= 3; i++) { const gr = new T.Mesh(new T.BoxGeometry(0.36, 0.006, 0.006), M('#2A2E34')); gr.position.set(0, i * 0.05, 0.05); g.add(gr); } WK.fans.push(bl); }
      // Poster, Thermometer, Erdsack, Schlauch, zwei Jungpflanzen hinten
      { const tex = cvTex(128, 160, (x, w, h) => { x.fillStyle = '#1E3A2C'; x.fillRect(0, 0, w, h); x.fillStyle = '#63C174'; x.font = '900 18px sans-serif'; x.textAlign = 'center'; x.fillText('KELLER', w / 2, 34); x.fillText('GRÜN', w / 2, 54); x.strokeStyle = '#63C174'; x.lineWidth = 4; x.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.45; x.moveTo(w / 2, 130); x.lineTo(w / 2 + Math.cos(a) * 40 * (1 - Math.abs(i - 2) * 0.2), 130 + Math.sin(a) * 50 * (1 - Math.abs(i - 2) * 0.2)); } x.stroke(); x.fillStyle = 'rgba(255,255,255,.5)'; x.font = '700 9px sans-serif'; x.fillText('rein fiktiv', w / 2, 152); });
        const p = new T.Mesh(new T.PlaneGeometry(0.42, 0.52), MTX(tex)); p.position.set(0.55, 1.62, Z + 0.02); p.rotation.z = 0.04; sc.add(p); }
      { const th = box(T, 0.16, 0.24, 0.04, '#E8E2D6', -0.62, 1.35, Z + 0.04, 0.06); const d = new T.Mesh(new T.PlaneGeometry(0.11, 0.06), new T.MeshBasicMaterial({ color: '#7BE07B' })); d.position.set(0, 0.04, 0.021); th.add(d); const tx = new T.Mesh(new T.PlaneGeometry(0.1, 0.05), MTX(cvTex(64, 32, (x, w, h) => { x.fillStyle = '#123A1C'; x.fillRect(0, 0, w, h); x.fillStyle = '#9BFF9B'; x.font = '900 18px monospace'; x.textAlign = 'center'; x.fillText('24°', w / 2, 23); }))); tx.position.set(0, 0.04, 0.022); th.add(tx); }
      { const s = box(T, 0.42, 0.22, 0.26, '#B08A5A', -1.6, 0.11, -0.75, 0.04); s.rotation.y = 0.3; const lab = new T.Mesh(new T.PlaneGeometry(0.26, 0.12), MTX(cvTex(64, 32, (x, w, h) => { x.fillStyle = '#F2E8C8'; x.fillRect(0, 0, w, h); x.fillStyle = '#5A3A1A'; x.font = '900 14px sans-serif'; x.textAlign = 'center'; x.fillText('ERDE', w / 2, 21); }))); lab.position.set(0, 0.01, 0.131); s.add(lab); blob(T, 0.7, 0.5, 0.003, 0.4, sc).position.set(-1.6, 0, -0.75); }
      { const hose = new T.Mesh(new T.TorusGeometry(0.16, 0.022, 8, 28), M('#3F9E6A')); hose.rotation.x = Math.PI / 2; hose.position.set(1.45, 0.025, -0.6); OL(hose, 0.1); sc.add(hose); const h2 = hose.clone(); h2.scale.setScalar(0.8); h2.position.y = 0.065; sc.add(h2); }
      if (mode === 'water' || mode === 'harvest') for (const x of [-1.05, 1.1]) { const g = new T.Group(), pot = mkPot(T); pot.scale.setScalar(0.75); g.add(pot); const pl = mkBudPlant(T, 0.45, 0); pl.scale.setScalar(0.75); g.add(pl); g.position.set(x, 0, -0.85); sc.add(g); }
    } else if (kind === 'barn') {
      const bm = box(T, 9, 0.12, 0.14, MTX(woodTex('#5A3A22', 'rgba(0,0,0,.35)', 2, false)), 0, 2.05, Z + 0.1, 0.03);
      for (let i = 0; i < 6; i++) { const g = new T.Group(), x = -2.1 + i * 0.85; g.position.set(x, 2.0, Z + 0.15); sc.add(g); const str = cyl(T, 0.004, 0.004, 0.12, '#C9A06A', 0, -0.06, 0, 0, g, 4);
        for (let j = 0; j < 5; j++) { const lf = mkTobLeaf(T, true, 0.26, ['#A8703A', '#8E5A2A', '#B98040'][j % 3]); lf.rotation.set(0, 0, Math.PI + (j - 2) * 0.18); lf.position.set((j - 2) * 0.03, -0.1, 0.01 * j); g.add(lf); } }
      for (const [x, z, r] of [[-1.7, -0.7, 0.2], [-1.25, -0.85, -0.1], [1.6, -0.7, 0.15]]) { const hb = box(T, 0.55, 0.32, 0.36, MTX(cvTex(64, 64, (x2, w, h) => { x2.fillStyle = '#D9B45A'; x2.fillRect(0, 0, w, h); x2.strokeStyle = 'rgba(140,100,30,.6)'; for (let i = 0; i < 40; i++) { x2.beginPath(); const a = (i * 13) % w, b = (i * 29) % h; x2.moveTo(a, b); x2.lineTo(a + 8, b + 3); x2.stroke(); } x2.fillStyle = '#8A5A2A'; x2.fillRect(w * 0.3, 0, 3, h); x2.fillRect(w * 0.7, 0, 3, h); })), x, 0.16, z, 0.03); hb.rotation.y = r; blob(T, 0.8, 0.6, 0.003, 0.4, sc).position.set(x, 0, z); }
      { const win = new T.Mesh(new T.PlaneGeometry(0.7, 0.55), new T.MeshBasicMaterial({ color: '#FFE9B0' })); win.position.set(1.2, 1.55, Z + 0.02); sc.add(win); box(T, 0.78, 0.04, 0.05, '#4A3020', 1.2, 1.84, Z + 0.04); box(T, 0.78, 0.04, 0.05, '#4A3020', 1.2, 1.26, Z + 0.04); box(T, 0.04, 0.6, 0.05, '#4A3020', 1.2, 1.55, Z + 0.04); box(T, 0.04, 0.6, 0.05, '#4A3020', 0.83, 1.55, Z + 0.04); box(T, 0.04, 0.6, 0.05, '#4A3020', 1.57, 1.55, Z + 0.04);
        const sh = new T.Mesh(new T.PlaneGeometry(1.0, 2.2), new T.MeshBasicMaterial({ color: '#FFE3A0', transparent: true, opacity: 0.08, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide })); sh.position.set(0.95, 0.75, -0.6); sh.rotation.set(-0.5, 0.3, 0.2); sc.add(sh); motes(new T.Vector3(0.95, 0.9, -0.6), 0.7, 1.4, 0.6, 30, '#FFF0C8'); }
      { const f = new T.Group(); f.position.set(-0.85, 0, Z + 0.15); f.rotation.z = 0.12; sc.add(f); cyl(T, 0.015, 0.015, 1.3, '#8A5E3A', 0, 0.65, 0, 0.1, f, 6); for (let i = -1; i <= 1; i++) cyl(T, 0.008, 0.004, 0.25, '#9AA4AE', i * 0.05, 1.42, 0, 0, f, 5); }
    } else {
      for (const y of [0.55, 1.05, 1.55]) box(T, 1.0, 0.03, 0.3, '#C9D2DC', -1.5, y, Z + 0.17, 0.03);
      for (const x of [-1.98, -1.02]) box(T, 0.03, 1.6, 0.3, '#9AA4AE', x, 0.8, Z + 0.17, 0.03);
      for (let i = 0; i < 6; i++) { const y = [0.55, 1.05, 1.55][i % 3]; box(T, 0.18, 0.14, 0.18, ['#FFFFFF', '#E8F2EA', '#F2F4F7'][i % 3], -1.75 + Math.floor(i / 3) * 0.4 + (i % 2) * 0.12, y + 0.085, Z + 0.17, 0.05); }
      { const h = cyl(T, 0.12, 0.14, 0.32, '#F2F4F7', 1.5, 0.16, -0.75, 0.05); cyl(T, 0.05, 0.05, 0.04, '#63C174', 0, 0.18, 0, 0, h); blob(T, 0.45, 0.4, 0.003, 0.35, sc).position.set(1.5, 0, -0.75); motes(new T.Vector3(1.5, 0.6, -0.75), 0.25, 0.5, 0.25, 16, '#E8F6FF'); }
      { const cb = box(T, 0.3, 0.4, 0.02, '#8A5E3A', 0.7, 1.4, Z + 0.03, 0.06); const pp = new T.Mesh(new T.PlaneGeometry(0.26, 0.32), MTX(cvTex(64, 80, (x, w, h) => { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); x.fillStyle = '#9AA4AE'; for (let i = 0; i < 8; i++) x.fillRect(6, 12 + i * 8, i % 3 ? 44 : 30, 3); x.fillStyle = '#63C174'; x.fillRect(48, 12, 8, 8); }))); pp.position.z = 0.011; cb.add(pp); }
    }
  }
  // ---------- Szenen-Details je Arbeit ----------
  function decoMode(T) {
    const m = WK.mode;
    if (m === 'water' || m === 'harvest') { motes(new THREE3.Vector3(0, 0.95, -0.05), 0.9, 1.1, 0.5, 40); }
    if (m === 'harvest') { const bk = new T.Group(), b = OL(new T.Mesh(new T.CylinderGeometry(0.17, 0.13, 0.13, 20, 1, true), MTX(woodTex('#C49A5E', 'rgba(90,50,20,.45)', 10, true))), 0.04); b.material.side = T.DoubleSide; b.position.y = 0.065; bk.add(b); const bt = new T.Mesh(new T.CircleGeometry(0.13, 20), M('#8A5E36')); bt.rotation.x = -Math.PI / 2; bt.position.y = 0.01; bk.add(bt); const hd = new T.Mesh(new T.TorusGeometry(0.15, 0.012, 6, 20, Math.PI), M('#A07A4A')); hd.position.y = 0.13; bk.add(hd); bk.position.set(0.62, 0, 0.38); WK.scene.add(bk); blob(T, 0.5, 0.4, 0.003, 0.45, WK.scene).position.set(0.62, 0, 0.38); WK.hbasket = bk; WK.hbN = 0; }
    if (m === 'rack') { const g = new T.Group(); g.position.set(0, 2.05, 0.15); WK.scene.add(g); cyl(T, 0.004, 0.004, 0.35, '#1D2129', 0, 0.17, 0, 0, g, 4); cyl(T, 0.03, 0.03, 0.05, '#3A3F46', 0, -0.02, 0, 0.1, g); const bulb = new T.Mesh(new T.SphereGeometry(0.05, 16, 12), new T.MeshBasicMaterial({ color: '#FFE6B0' })); bulb.position.y = -0.08; g.add(bulb);
      const gl = new T.Sprite(new T.SpriteMaterial({ map: dotTex(), color: '#FFD9A0', transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending })); gl.scale.setScalar(0.7); gl.position.y = -0.08; g.add(gl); WK.bulb = g; motes(new THREE3.Vector3(0, 1.3, 0.2), 1.6, 1.0, 0.6, 40); }
    if (m === 'pack') { // Waage, Klebeband, Schere, Lampe über dem Tisch
      const sc = new T.Group(); sc.position.set(-0.05, 0.45, -0.3); WK.root.add(sc); box(T, 0.2, 0.04, 0.16, '#2E3238', 0, 0.02, 0, 0.05, sc); box(T, 0.16, 0.008, 0.13, '#C9D2DC', 0, 0.045, 0, 0, sc); const dsp = new T.Mesh(new T.PlaneGeometry(0.1, 0.03), new T.MeshBasicMaterial({ map: cvTex(64, 20, (x, w, h) => { x.fillStyle = '#0E2A12'; x.fillRect(0, 0, w, h); x.fillStyle = '#7BE07B'; x.font = '900 15px monospace'; x.textAlign = 'center'; x.fillText('0.00', w / 2, 15); }) })); dsp.rotation.x = -0.9; dsp.position.set(0, 0.03, 0.081); sc.add(dsp); WK.scaleD = dsp;
      const tp = new T.Mesh(new T.TorusGeometry(0.045, 0.02, 8, 20), M('#C9A06A')); tp.rotation.x = Math.PI / 2; tp.position.set(-0.32, 0.47, -0.32); OL(tp, 0.08); WK.root.add(tp);
      const sci = new T.Group(); sci.position.set(0.2, 0.455, 0.36); sci.rotation.y = 0.6; WK.root.add(sci); for (const s of [-1, 1]) { const bl = box(T, 0.12, 0.006, 0.014, '#C9D2DC', 0.05, 0, s * 0.006, 0, sci); bl.rotation.y = s * 0.15; const rg = new T.Mesh(new T.TorusGeometry(0.018, 0.006, 6, 12), M('#FF5C7A')); rg.rotation.x = Math.PI / 2; rg.position.set(-0.03, 0, s * 0.02); sci.add(rg); }
      const lamp = new T.Group(); lamp.position.set(0, 1.45, -0.05); WK.scene.add(lamp); cyl(T, 0.004, 0.004, 0.8, '#1D2129', 0, 0.4, 0, 0, lamp, 4); const sh = new T.Mesh(new T.CylinderGeometry(0.08, 0.22, 0.14, 24, 1, true), M('#2E7A4A', { side: T.DoubleSide })); OL(sh, 0.04); lamp.add(sh); const in2 = new T.Mesh(new T.CircleGeometry(0.2, 24), new T.MeshBasicMaterial({ color: '#FFE6B0' })); in2.rotation.x = Math.PI / 2; in2.position.y = -0.06; lamp.add(in2);
      const cone = new T.Mesh(new T.CylinderGeometry(0.2, 0.9, 1.0, 24, 1, true), new T.MeshBasicMaterial({ color: '#FFE3B0', transparent: true, opacity: 0.06, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending })); cone.position.y = -0.56; lamp.add(cone); motes(new THREE3.Vector3(0, 0.9, 0), 1.2, 0.7, 0.6, 36); }
  }
  // Waagen-Anzeige zeigt, wie viel im Beutel liegt
  function scaleShow(n) { if (!WK.scaleD) return; const t = cvTex(64, 20, (x, w, h) => { x.fillStyle = '#0E2A12'; x.fillRect(0, 0, w, h); x.fillStyle = '#7BE07B'; x.font = '900 15px monospace'; x.textAlign = 'center'; x.fillText(n ? n + ' St.' : '0.00', w / 2, 15); }); if (WK.scaleD.material.map) WK.scaleD.material.map.dispose(); WK.scaleD.material.map = t; WK.scaleD.material.needsUpdate = true; }
  // Etikett auf dem verschlossenen Beutel
  function packLabel(g) { const T = THREE3, u = g.userData, t = cvTex(96, 48, (x, w, h) => { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); x.fillStyle = '#63C174'; x.fillRect(0, 0, w, 10); x.fillStyle = '#1D2129'; x.font = '900 13px sans-serif'; x.textAlign = 'center'; x.fillText(WK.L.unit === 'Beutel' ? 'KELLERGRÜN' : (WK.L.unit || '').toUpperCase().slice(0, 10), w / 2, 28); x.font = '700 9px sans-serif'; x.fillText(WK.ar.packN + ' Stück', w / 2, 42); });
    const lab = new T.Mesh(new T.PlaneGeometry(u.w * 0.6, u.w * 0.3), new T.MeshBasicMaterial({ map: t })); lab.position.set(0, (u.h || 0.12) * 0.5, (u.d || 0.1) / 2 + 0.004); g.add(lab); }
  // ---------- jedes Bild ----------
  function decoFrame(dt) {
    const T = THREE3;
    if (WK.fx) for (let i = WK.fx.length - 1; i >= 0; i--) { const f = WK.fx[i]; f.t += dt; const P = f.pts.geometry.attributes.position; for (let j = 0; j < f.V.length; j++) { const v = f.V[j]; v[1] -= f.grav * dt; P.array[j * 3] += v[0] * dt; P.array[j * 3 + 1] += v[1] * dt; P.array[j * 3 + 2] += v[2] * dt; v[0] *= 0.985; v[2] *= 0.985; } P.needsUpdate = true; f.pts.material.opacity = Math.max(0, 1 - f.t / f.life);
      if (f.t >= f.life) { WK.scene.remove(f.pts); f.pts.geometry.dispose(); f.pts.material.dispose(); WK.fx.splice(i, 1); } }
    if (WK.motes) for (const m of WK.motes) { const P = m.pts.geometry.attributes.position, a = P.array; for (let j = 0; j < a.length; j += 3) { a[j] += Math.sin(WK.t * 0.7 + j) * 0.012 * dt; a[j + 1] += (0.02 + Math.sin(WK.t * 0.5 + j * 0.3) * 0.02) * dt; a[j + 2] += Math.cos(WK.t * 0.6 + j) * 0.01 * dt; if (a[j + 1] > m.c.y + m.sy / 2) a[j + 1] = m.c.y - m.sy / 2; } P.needsUpdate = true; m.pts.material.opacity = 0.35 + 0.2 * Math.sin(WK.t * 1.3); }
    if (WK.fans) for (const f of WK.fans) f.rotation.z -= dt * 7;
    if (WK.gc.sparkM) WK.gc.sparkM.opacity = 0.55 + 0.4 * Math.sin(WK.t * 5);
    if (WK.mode === 'rack' && WK.slots) for (const s of WK.slots) { if (!s.item) continue; s.item.rotation.z = Math.sin(WK.t * 1.4 + s.x * 5) * 0.08; if (s.dry && s.piece) { const k = 0.5 + 0.5 * Math.sin(WK.t * 4 + s.x * 3); s.piece.traverse(o => { if (o.isMesh && o.material && o.material.emissive && !o.userData.ol) { if (!o.userData.own) { o.material = o.material.clone(); o.userData.own = true; } o.material.emissive.setRGB(0.25 * k, 0.2 * k, 0.05 * k); } }); } }
    if (WK.bulb) WK.bulb.rotation.z = Math.sin(WK.t * 0.9) * 0.05;
    if (WK.mode === 'water' && WK.p) { const s = WK.pot.userData.soil; s.material.color.lerpColors(new T.Color('#4A3220'), new T.Color('#1E120A'), Math.min(1, WK.p.w || 0)); }
  }
