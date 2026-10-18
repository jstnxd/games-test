// Kellergrün 3D (v92): Pflanzen und Labor-Stationen als echte 3D-Modelle.
// Rein fiktive Spielgrafik: Hanf- und Tabakpflanze als Zierpflanzen-Modelle, das Chemielabor zeigt nur erfundene, bunte Glasgeraete ohne echte Stoffe oder Ablaeufe.
export function plantsKit(THREE, Batch) {
  const C = h => new THREE.Color(h), m4 = () => new THREE.Matrix4(), TAU = Math.PI * 2;
  const rot = (x, y, z) => new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(x, y, z));
  const tr = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
  const geoOf = b => { const m = b.mesh(null); return m ? m.geometry : new THREE.BufferGeometry(); };
  // gezahntes, schmales Fiederblatt in der XZ-Ebene, zeigt nach +Z
  function leaflet(len, wid, teeth) {
    const s = new THREE.Shape(); s.moveTo(0, 0); const n = teeth;
    for (let i = 1; i <= n; i++) { const t = i / n, w = Math.sin(Math.PI * Math.pow(t, 0.8)) * wid * (1 - t * 0.15); s.lineTo(w * (i % 2 ? 1.12 : 0.9), t * len); }
    for (let i = n; i >= 1; i--) { const t = i / n, w = Math.sin(Math.PI * Math.pow(t, 0.8)) * wid * (1 - t * 0.15); s.lineTo(-w * (i % 2 ? 1.12 : 0.9), t * len); }
    s.lineTo(0, 0); const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); g.rotateY(Math.PI); return g; // zeigt nach +Z
  }
  function broadLeaf(len, wid) { // breites Tabakblatt
    const s = new THREE.Shape(); s.moveTo(0, 0); const n = 14;
    for (let i = 1; i <= n; i++) { const t = i / n; s.lineTo(Math.sin(Math.PI * Math.pow(t, 0.7)) * wid, t * len); }
    for (let i = n; i >= 1; i--) { const t = i / n; s.lineTo(-Math.sin(Math.PI * Math.pow(t, 0.7)) * wid, t * len); }
    const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2); g.rotateY(Math.PI);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const z = p.getZ(i), x = p.getX(i); p.setY(i, -Math.pow(z / len, 2) * len * 0.35 + Math.abs(x) * 0.18); } g.computeVertexNormals(); return g;
  }
  // ---------- Hanfpflanze ----------
  function weedGeos() {
    const b = new Batch(), top = new Batch();
    b.addGeo(new THREE.CylinderGeometry(0.7, 1.4, 40, 6), tr(0, 20, 0), C('#5f8a3a'));
    const fan = (y, ang, size, tilt, col) => { const sp = [-1.25, -0.85, -0.42, 0, 0.42, 0.85, 1.25], ln = [0.42, 0.66, 0.88, 1, 0.88, 0.66, 0.42];
      b.addGeo(new THREE.CylinderGeometry(0.25, 0.4, size * 0.45, 4), rot(Math.PI / 2 - tilt, ang, 0).premultiply(tr(0, y, 0)).multiply(tr(0, size * 0.22, 0)), C('#6a9a40'));
      const base = tr(Math.sin(ang) * size * 0.42 * Math.cos(tilt), y + Math.sin(tilt) * size * 0.3, Math.cos(ang) * size * 0.42 * Math.cos(tilt));
      sp.forEach((a, k) => { const g = leaflet(size * ln[k], size * 0.09 * (0.8 + ln[k] * 0.4), 11); const M = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-tilt * 0.6 - Math.abs(a) * 0.12, ang + a, 0, 'YXZ')).premultiply(base); b.addGeo(g, M, C(col)); }); };
    const lv = [[6, 17, 0.2, '#256a30'], [12, 16.5, 0.26, '#2c7a36'], [18, 15, 0.32, '#33863c'], [24, 13, 0.4, '#3a9042'], [30, 10.5, 0.48, '#44994a'], [35, 8, 0.56, '#4ea250']];
    lv.forEach(([y, s, t, c], i) => { const a0 = i * Math.PI / 2 + 0.3; fan(y, a0, s, t, c); fan(y, a0 + Math.PI, s, t, c); if (i < 3) { fan(y + 2, a0 + Math.PI / 2, s * 0.8, t + 0.1, c); fan(y + 2, a0 - Math.PI / 2, s * 0.8, t + 0.1, c); }
      // kleine Seitentriebe mit Bluetenansatz
      if (i >= 1) for (const a of [a0 + Math.PI / 2, a0 - Math.PI / 2]) { const L = 6 + i; b.addGeo(new THREE.CylinderGeometry(0.35, 0.55, L, 4), rot(0.75, a, 0).premultiply(tr(0, y, 0)).multiply(tr(0, L / 2, 0)), C('#5f8a3a'));
        const tx = Math.sin(a) * Math.sin(0.75) * L, ty = y + Math.cos(0.75) * L, tz = Math.cos(a) * Math.sin(0.75) * L;
        for (let k = 0; k < 4; k++) top.addGeo(new THREE.IcosahedronGeometry(1.3 + (k % 2) * 0.4, 1), tr(tx + (k % 2 - 0.5) * 1.2, ty + k * 1.4, tz + ((k >> 1) - 0.5) * 1.2), C(k % 2 ? '#a8d47a' : '#8cc062')); } });
    // kleine Spitzenblaetter
    for (let k = 0; k < 5; k++) { const g = leaflet(6, 0.6, 9); b.addGeo(g, new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-0.9, k * TAU / 5, 0, 'YXZ')).premultiply(tr(0, 39, 0)), C('#5cb45a')); }
    // Haupt-Bluetenstand (Cola) mit orangen Haerchen
    for (let k = 0; k < 16; k++) { const a = k * 2.4, r = 1.6 + (k % 3) * 0.5, y = 31 + k * 0.85; top.addGeo(new THREE.IcosahedronGeometry(2 + (k % 3) * 0.5, 1), tr(Math.cos(a) * r, y, Math.sin(a) * r), C(k % 2 ? '#a8d47a' : '#93c86a')); }
    for (let k = 0; k < 22; k++) { const a = k * 1.7, y = 32 + (k % 11) * 1.3, r = 3.2; top.addGeo(new THREE.ConeGeometry(0.28, 1.6, 3), rot(Math.cos(a) * 1.1, 0, Math.sin(a) * 1.1).premultiply(tr(Math.cos(a) * r, y, Math.sin(a) * r)), C('#e8873a')); }
    return { body: geoOf(b), top: geoOf(top) };
  }
  // ---------- Tabakpflanze ----------
  function tabakGeos() {
    const b = new Batch(), top = new Batch();
    b.addGeo(new THREE.CylinderGeometry(0.9, 1.6, 42, 7), tr(0, 21, 0), C('#7a9a4a'));
    for (let i = 0; i < 9; i++) { const y = 4 + i * 4.2, a = i * 2.4, len = 22 - i * 1.6, wid = 9.5 - i * 0.6, g = broadLeaf(len, wid);
      b.addGeo(g, new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(-0.35 + i * 0.05, a, 0, 'YXZ')).premultiply(tr(0, y, 0)), C(i < 3 ? '#5e9a44' : i < 6 ? '#68a64a' : '#78b252')); }
    for (let k = 0; k < 11; k++) { const a = k * 2.2, r = k ? 2.5 + (k % 3) : 0, y = 43 + (k % 4) * 1.2;
      top.addGeo(new THREE.CylinderGeometry(0.25, 0.25, 4, 4), rot(Math.cos(a) * 0.4, 0, Math.sin(a) * 0.4).premultiply(tr(Math.cos(a) * r * 0.5, y - 2, Math.sin(a) * r * 0.5)), C('#7a9a4a'));
      top.addGeo(new THREE.ConeGeometry(1.5, 4, 6, 1, true).rotateX(Math.PI), tr(Math.cos(a) * r, y + 1.5, Math.sin(a) * r), C(k % 3 ? '#f2a6c8' : '#ffd6e6')); }
    return { body: geoOf(b), top: geoOf(top) };
  }
  // ---------- Labor-Station (fiktiv): Stativ, Rundkolben mit buntem Fantasie-Inhalt, Brenner ----------
  function labGeos() {
    const b = new Batch(), glass = new Batch(), top = new Batch();
    b.box(-14, 0, -12, 14, 3, 12, C('#e8ecf2')); b.box(-12, 3, -10, 12, 4, 10, C('#cfd6de'));
    b.addGeo(new THREE.CylinderGeometry(0.7, 0.7, 40, 6), tr(-9, 22, -6), C('#a4adba'));
    b.addGeo(new THREE.TorusGeometry(6.5, 0.5, 5, 18).rotateX(Math.PI / 2), tr(0, 20, 0), C('#a4adba')); b.box(-9, 19.5, -6.5, 0, 20.5, -5.5, C('#a4adba'));
    b.addGeo(new THREE.CylinderGeometry(2.4, 3.2, 8, 10), tr(0, 8, 0), C('#5e646e')); // Brenner
    glass.addGeo(new THREE.SphereGeometry(7, 16, 12), tr(0, 26, 0), C('#ffffff')); glass.addGeo(new THREE.CylinderGeometry(1.8, 2, 12, 10, 1, true), tr(0, 37, 0), C('#ffffff'));
    glass.addGeo(new THREE.CylinderGeometry(1.3, 1.3, 9, 8, 1, true), rot(0, 0, -1.1).premultiply(tr(6, 38, 0)), C('#ffffff'));
    // kleine Reagenzglaeser vorne
    for (let k = 0; k < 3; k++) { glass.addGeo(new THREE.CylinderGeometry(1.1, 1.1, 9, 8, 1, true), tr(-6 + k * 4.5, 8.5, 8), C('#ffffff')); top.addGeo(new THREE.CylinderGeometry(1, 1, 4 + k, 8), tr(-6 + k * 4.5, 6 + (4 + k) / 2, 8), C(['#5FE584', '#4BC8FF', '#E05AE8'][k])); }
    b.box(-9, 4, 6, 6, 5, 10, C('#8a6a4a'));
    return { body: geoOf(b), glass: geoOf(glass), tubes: geoOf(top), liquid: new THREE.SphereGeometry(6.4, 16, 12, 0, TAU, Math.PI * 0.35, Math.PI * 0.65).translate(0, 26, 0), flame: new THREE.ConeGeometry(1.6, 5, 8).translate(0, 14.5, 0) };
  }
  const leafM = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.62, metalness: 0 });
  const budM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, emissive: new THREE.Color(0x201030), emissiveIntensity: 0 });
  const flowerM = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.55 });
  const labM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.35 });
  const glassM = new THREE.MeshStandardMaterial({ color: 0xdff2ff, transparent: true, opacity: 0.32, roughness: 0.04, metalness: 0.1, depthWrite: false, side: THREE.DoubleSide });
  const liqM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0.25, transparent: true, opacity: 0.88 });
  const tubeM = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, emissive: new THREE.Color(0x224433), emissiveIntensity: 0.4 });
  const flameM = new THREE.MeshBasicMaterial({ color: 0x5aa8ff, transparent: true, opacity: 0.8 });
  let W = null, Tb = null, L = null;
  const geos = () => { if (!W) { W = weedGeos(); Tb = tabakGeos(); L = labGeos(); } };
  // Baut fuer eine Liste von Topf-Plaetzen Instanzen; gibt ein Objekt mit update(states, t) zurueck
  function build(kind, slots) { // slots: [{x, y}]
    geos(); const n = slots.length, grp = new THREE.Group(); if (!n) return { grp, update() {} };
    const I = (g, m, sh) => { const im = new THREE.InstancedMesh(g, m, n); im.castShadow = !!sh; im.receiveShadow = true; im.frustumCulled = false; grp.add(im); return im; };
    const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color(), eu = new THREE.Euler();
    if (kind === 'lab') {
      const body = I(L.body, labM, true), gl = I(L.glass, glassM, false), tb = I(L.tubes, tubeM, false), lq = I(L.liquid, liqM, false), fl = I(L.flame, flameM, false);
      slots.forEach((sl, i) => { p.set(sl.x, 0, sl.y); q.setFromEuler(eu.set(0, (i % 2) * 0.3, 0)); s.set(1, 1, 1); mm.compose(p, q, s); for (const im of [body, gl, tb]) im.setMatrixAt(i, mm); });
      const LCOL = ['#5FE584', '#4BC8FF', '#E05AE8', '#FFB547'];
      return { grp, update(states, t) {
        states.forEach((st, i) => { const sl = slots[i], on = st && st.s > 0, k = !on ? 0.001 : st.s === 2 ? 1 : 0.15 + st.p * 0.85;
          p.set(sl.x, 26 - 26 * (1 - k) * 0.0, sl.y); q.identity(); s.set(k, k, k); mm.compose(p.set(sl.x, 26 * (1 - k), sl.y), q, s); lq.setMatrixAt(i, mm); c.set(LCOL[i % 4]); if (st && st.s === 2) c.lerp(C('#ffffff'), 0.25 + 0.2 * Math.sin(t * 4 + i)); lq.setColorAt(i, c);
          const fk = on && st.s === 1 ? 0.8 + 0.25 * Math.sin(t * 17 + i * 3) : 0.001; s.set(fk, fk, fk); mm.compose(p.set(sl.x, 14.5 * (1 - fk), sl.y), q, s); fl.setMatrixAt(i, mm); });
        lq.instanceMatrix.needsUpdate = true; fl.instanceMatrix.needsUpdate = true; if (lq.instanceColor) lq.instanceColor.needsUpdate = true; liqM.emissiveIntensity = 0.25 + 0.1 * Math.sin(t * 3); } };
    }
    const G = kind === 'tabak' ? Tb : W, body = I(G.body, leafM, true), top = I(G.top, kind === 'tabak' ? flowerM : budM, true);
    const rotY = slots.map((sl, i) => ((sl.x * 7 + sl.y * 3 + i * 11) % 628) / 100);
    return { grp, update(states, t) {
      states.forEach((st, i) => { const sl = slots[i], on = st && st.s > 0, ripe = on && st.s === 2, k = !on ? 0.001 : ripe ? 1 : 0.22 + st.p * 0.78;
        const sway = Math.sin(t * 1.3 + i) * 0.03 * k; q.setFromEuler(eu.set(sway, rotY[i], sway * 0.6)); p.set(sl.x, 17, sl.y); const kk = k * (kind === 'tabak' ? 1.1 : 1.25); s.set(kk, kk, kk); mm.compose(p, q, s); body.setMatrixAt(i, mm);
        const dry = st && st.w !== undefined && st.w < 0.25; c.set(ripe ? (kind === 'tabak' ? '#d9c76a' : '#ffffff') : dry ? '#b9b07a' : '#ffffff'); body.setColorAt(i, c);
        const tk = on && (ripe || st.p > 0.55) ? k * (ripe ? 1 : (st.p - 0.55) / 0.45) : 0.001; s.set(kk, kk, kk); if (tk <= 0.001) s.set(0.001, 0.001, 0.001); mm.compose(p, q, s); top.setMatrixAt(i, mm);
        c.set(ripe ? (kind === 'tabak' ? '#ffffff' : '#e6d0ff') : '#ffffff'); top.setColorAt(i, c); });
      for (const im of [body, top]) { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; }
      budM.emissiveIntensity = 0.15 + 0.1 * Math.sin(t * 3); } };
  }
  // Labor-Einrichtung an Gestell und Tisch (fiktive Glasgeraete, Abzug, bunte Flaschen)
  function labFurniture(R, T) {
    const g = new THREE.Group(), b = new Batch(), gl = new Batch(), lq = new Batch();
    if (T) { b.box(T.x - 62, 0, T.y - 22, T.x + 62, 26, T.y + 22, C('#e8ecf2')); b.box(T.x - 64, 26, T.y - 24, T.x + 64, 28, T.y + 24, C('#2a2f36'));
      b.box(T.x - 60, 28, T.y - 24, T.x + 60, 70, T.y - 20, C('#cfd6de')); b.box(T.x - 62, 70, T.y - 26, T.x + 62, 76, T.y + 4, C('#e8ecf2')); // Abzug
      gl.box(T.x - 58, 30, T.y + 3, T.x + 58, 69, T.y + 4);
      for (let k = 0; k < 5; k++) { const x = T.x - 44 + k * 22; gl.addGeo(new THREE.CylinderGeometry(4, 4, 11, 12, 1, true), tr(x, 33.5, T.y - 6), C('#fff')); lq.addGeo(new THREE.CylinderGeometry(3.7, 3.7, 5 + k, 12), tr(x, 28 + (5 + k) / 2, T.y - 6), C(['#5FE584', '#4BC8FF', '#E05AE8', '#FFB547', '#7FE6FF'][k])); }
      for (let k = 0; k < 8; k++) { const x = T.x - 30 + k * 7; b.box(x - 3.5, 28, T.y + 10, x + 3.5, 30, T.y + 16, C('#8a6a4a')); gl.addGeo(new THREE.CylinderGeometry(1.1, 1.1, 10, 8, 1, true), tr(x, 34, T.y + 13), C('#fff')); lq.addGeo(new THREE.CylinderGeometry(1, 1, 4, 8), tr(x, 31, T.y + 13), C(['#5FE584', '#4BC8FF', '#E05AE8', '#FFB547'][k % 4])); } }
    if (R) { for (const k of [-1, 1]) b.box(R.x + k * 58 - 3, 0, R.y - 22, R.x + k * 58 + 3, 66, R.y + 22, C('#c4ccd6'));
      for (let lv = 0; lv < 4; lv++) { const y = 6 + lv * 18; b.box(R.x - 60, y, R.y - 22, R.x + 60, y + 2, R.y + 22, C('#e8ecf2'));
        for (let k = 0; k < 9; k++) { const x = R.x - 50 + k * 12.5, h = 8 + ((k + lv) % 3) * 2; gl.addGeo(new THREE.CylinderGeometry(3.2, 3.6, h, 10), tr(x, y + 2 + h / 2, R.y), C('#fff')); lq.addGeo(new THREE.CylinderGeometry(3, 3.3, h * 0.6, 10), tr(x, y + 2 + h * 0.3, R.y), C(['#5FE584', '#4BC8FF', '#E05AE8', '#FFB547', '#E8ECF2'][(k + lv * 2) % 5])); } } }
    const mb = b.mesh(labM, true, true), mg = gl.mesh(glassM, false, false), ml = lq.mesh(tubeM, false, false); for (const m of [mb, ml, mg]) if (m) g.add(m); return g;
  }
  return { build, labFurniture };
}
