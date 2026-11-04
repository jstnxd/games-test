  // =====================================================================================================
  // v175: Animationen 2.0 für die Arbeitsfenster. Flugbahnen mit Drall, Federn (Quetschen, Wippen,
  // Pendeln), Schere beim Abschneiden, Reißverschluss, Schraubdeckel, Klebeband, Ringwellen und
  // aufsteigende Zahlen. Rein optisch: die Spiellogik bleibt in 19b_arbeit.js.
  // =====================================================================================================
  const EZ = {
    lin: k => k,
    out: k => 1 - Math.pow(1 - k, 3),
    in: k => k * k * k,
    inOut: k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
    back: k => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); }
  };
  // Tween: Position (a nach b, mit Bogenhöhe h), Drall (spin), Größe (sc), eigene Funktion (fn)
  function tw(o, op) { op.o = o; op.t = -(op.delay || 0); (WK.tw || (WK.tw = [])).push(op); return op; }
  // Feder: sq = quetschen, py = wippen in der Höhe, rz/rx = kippen, tilt = schwanken, swing = Pendel (userData)
  function spring(o, k, amt, f, dm) {
    if (!o || !WK) return; const L = WK.sp || (WK.sp = []); let s = L.find(q => q.o === o && q.k === k);
    if (!s) {
      const base = k === 'sq' ? o.scale.clone() : k === 'py' ? o.position.y : k === 'rz' ? o.rotation.z : k === 'rx' ? o.rotation.x : k === 'tilt' ? { x: o.rotation.x, z: o.rotation.z } : 0;
      s = { o, k, base }; L.push(s);
    }
    s.t = 0; s.amt = amt; s.f = f || 20; s.dm = dm || 6; s.ang = Math.random() * Math.PI * 2;
  }
  function springStop(o) { if (!WK || !WK.sp) return; WK.sp = WK.sp.filter(s => { if (s.o !== o) return true; springSet(s, 0); return false; }); }
  function springSet(s, v) {
    const o = s.o, b = s.base;
    if (s.k === 'sq') o.scale.set(b.x * (1 + v * 0.6), b.y * (1 - v), b.z * (1 + v * 0.6));
    else if (s.k === 'py') o.position.y = b + v;
    else if (s.k === 'rz') o.rotation.z = b + v;
    else if (s.k === 'rx') o.rotation.x = b + v;
    else if (s.k === 'tilt') { o.rotation.x = b.x + v * Math.cos(s.ang); o.rotation.z = b.z + v * Math.sin(s.ang); }
    else if (s.k === 'swing') o.userData.swing = v;
  }
  // kleine Klänge über den vorhandenen Tongenerator
  const asnd = {
    snip() { try { tone(2600, 0.03, 'square', 0.035); tone(1900, 0.045, 'square', 0.035, 0, 0.05); } catch (e) {} },
    pop(n) { try { tone(480 + Math.min(12, n || 0) * 55, 0.08, 'triangle', 0.08, 120); } catch (e) {} },
    land() { try { tone(150, 0.09, 'sine', 0.12, -60); } catch (e) {} },
    zip() { try { tone(260, 0.28, 'sawtooth', 0.03, 900); } catch (e) {} },
    twist() { try { for (let i = 0; i < 3; i++) tone(900 + i * 140, 0.03, 'square', 0.03, 0, i * 0.09); } catch (e) {} },
    tape() { try { tone(700, 0.22, 'sawtooth', 0.025, -400); } catch (e) {} },
    ding(n) { try { const f = 660 + Math.min(10, n || 0) * 40; tone(f, 0.1, 'triangle', 0.12); tone(f * 1.5, 0.18, 'triangle', 0.1, 0, 0.08); } catch (e) {} }
  };
  // Aufsteigende Schrift im Raum (+1, 3/9 ...)
  function pop3d(txt, pos, col, big) {
    const T = THREE3, t = cvTex(256, 96, (x, w, h) => { x.font = '900 ' + (big ? 64 : 54) + 'px Inter, system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'; x.lineWidth = 12; x.strokeStyle = '#10151C'; x.strokeText(txt, w / 2, h / 2); x.fillStyle = col || '#FFFFFF'; x.fillText(txt, w / 2, h / 2); });
    t.wrapS = t.wrapT = T.ClampToEdgeWrapping; t.repeat.set(1, 1);
    const sp = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, depthTest: false, depthWrite: false })); sp.renderOrder = 20; const s0 = big ? 0.62 : 0.46; sp.scale.set(s0 * 0.2, s0 * 0.075, 1); sp.position.copy(pos); WK.scene.add(sp);
    const a = pos.clone(), b = pos.clone().add(new T.Vector3(0, 0.28, 0));
    tw(sp, { d: 1.0, ez: 'out', a, b, fn: (e, k) => { const g = EZ.back(Math.min(1, k * 3.2)); sp.scale.set(s0 * g, s0 * 0.375 * g, 1); sp.material.opacity = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4; },
      end: () => { if (sp.parent) sp.parent.remove(sp); t.dispose(); sp.material.dispose(); } });
  }
  // Ringwelle auf einer Fläche
  function ring(pos, col, r, d) {
    const T = THREE3, m = new T.Mesh(WK.gc.ringG || (WK.gc.ringG = new T.RingGeometry(0.82, 1, 40)), new T.MeshBasicMaterial({ color: col || '#FFFFFF', transparent: true, opacity: 0.8, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide }));
    r = r || 0.25; m.rotation.x = -Math.PI / 2; m.position.copy(pos); m.scale.setScalar(r * 0.15); m.raycast = () => {}; WK.scene.add(m);
    tw(m, { d: d || 0.5, ez: 'out', fn: (e, k) => { m.scale.setScalar(r * (0.15 + e * 0.85)); m.material.opacity = 0.6 * (1 - k) * (1 - k); }, end: () => { if (m.parent) m.parent.remove(m); m.material.dispose(); } });
  }
  // Schere schnappt zu (zeigt zur Kamera)
  function snip(pos) {
    const T = THREE3, g = new T.Group(), bl = M('#DDE3EA'), hd = M('#FF5C7A'), halves = [];
    for (const s of [-1, 1]) { const h = new T.Group(); const b = OL(new T.Mesh(new T.BoxGeometry(0.11, 0.014, 0.006), bl), 0.12); b.position.x = 0.055; h.add(b); const tip = new T.Mesh(new T.ConeGeometry(0.007, 0.02, 4), bl); tip.rotation.z = -Math.PI / 2; tip.position.x = 0.12; h.add(tip);
      const rg = OL(new T.Mesh(new T.TorusGeometry(0.022, 0.007, 6, 14), hd), 0.15); rg.position.set(-0.03, s * 0.012, 0); h.add(rg); h.rotation.z = s * 0.5; g.add(h); halves.push([h, s]); }
    const dir = WK.cam.position.clone().sub(pos).normalize(); g.position.copy(pos).addScaledVector(dir, 0.08).add(new T.Vector3(-0.07, 0, 0)); g.lookAt(WK.cam.position); g.rotateZ(-0.35); g.scale.setScalar(0.01); WK.scene.add(g);
    tw(g, { d: 0.1, ez: 'back', sc: [0.01, 1.7] });
    tw(g, { d: 0.1, delay: 0.08, ez: 'in', fn: e => { for (const [h, s] of halves) h.rotation.z = s * 0.5 * (1 - e); }, end: () => asnd.snip() });
    tw(g, { d: 0.18, delay: 0.26, ez: 'in', sc: [1.7, 0.01], end: () => { if (g.parent) g.parent.remove(g); } });
  }
  // Funkenspur hinter einem fliegenden Teil
  function trail(o, cols, n) {
    let i = 0; const v = new THREE3.Vector3();
    return () => { if (i++ % 2 || !o.parent) return; o.getWorldPosition(v); try { burst(v.clone(), cols, n || 2, 0.06, 0.35, 0.018, 0.4, true); } catch (e) {} };
  }
  // Längste Seite eines Teils in eigener Lage (ohne Drehung und Größe), um es passend in einen Behälter zu legen
  function lenOf(o) {
    const T = THREE3, r = o.rotation.clone(), s = o.scale.clone(), p = o.position.clone(), par = o.parent; if (par) par.remove(o);
    o.rotation.set(0, 0, 0); o.scale.set(1, 1, 1); o.position.set(0, 0, 0); o.updateMatrixWorld(true); const b = new T.Box3(), v = new T.Vector3();
    o.traverse(c => { if (c.isMesh && c.geometry && !c.userData.ol) { if (!c.geometry.boundingBox) c.geometry.computeBoundingBox(); b.union(c.geometry.boundingBox.clone().applyMatrix4(c.matrixWorld)); } }); b.getSize(v);
    lenOf.c = b.isEmpty() ? new T.Vector3() : b.getCenter(new T.Vector3());
    o.rotation.copy(r); o.scale.copy(s); o.position.copy(p); if (par) par.add(o); return Math.max(v.x, v.y, v.z) || 0.1;
  }
  // Ziel so verschieben, dass die Mitte des Teils (nicht sein Drehpunkt) am Ziel liegt
  function centerAt(o, dst, rt, sc) { lenOf(o); const v = lenOf.c.clone().multiplyScalar(sc).applyEuler(new THREE3.Euler(rt.x, rt.y, rt.z, 'YXZ')); return dst.clone().sub(v); }
  // Liegend in einen Behälter: Knospe quer entlang yaw, Blatt flach entlang yaw
  function layRot(lv, yaw) { return lv ? { x: -Math.PI / 2, y: yaw, z: 0 } : { x: 0, y: yaw, z: Math.PI / 2 }; }
  // v176: Combo, wenn man schnell hintereinander antippt (nicht bei den Alle-Knöpfen)
  function combo(pos, auto) {
    if (auto) { WK.cb = 0; return; } const now = WK.t; WK.cb = now - (WK.cbT === undefined ? -9 : WK.cbT) < 1.3 ? (WK.cb || 0) + 1 : 1; WK.cbT = now;
    if (WK.cb >= 3) { pop3d('🔥 Combo x' + WK.cb, pos.clone().add(new THREE3.Vector3(0, 0.42, 0)), WK.cb >= 8 ? '#FF5C7A' : '#FF9A3C', true); asnd.ding(WK.cb); try { faCombo(WK.cb); } catch (e) {} if (WK.cb % 5 === 0) celebrate('🔥 Combo x' + WK.cb + '!', pos.clone()); }
  }
  // Abschluss-Hopser für das Hauptobjekt
  function joy3(o) { spring(o, 'sq', 0.16, 16, 5); }
  // jedes Bild: Tweens, Federn und das sanfte "Atmen" der antippbaren Teile
  function animFrame(dt) {
    dt *= WK.slowmo || 1; // Zeitlupe (Studio und Tests)
    if (WK.tw) for (let i = WK.tw.length - 1; i >= 0; i--) { const a = WK.tw[i]; a.t += dt; if (a.t < 0) continue;
      if (!a.go) { a.go = true; if (a.b && !a.a) a.a = a.o.position.clone(); if (a.spin || a.rt) { if (a.rt) a.o.rotation.reorder('YXZ'); a.r0 = a.o.rotation.clone(); } if (a.s1 !== undefined) a.s0 = a.o.scale.clone(); if (a.start) a.start(); }
      const k = Math.min(1, a.t / a.d), e = (EZ[a.ez] || EZ.out)(k);
      if (a.b && a.drop) { const k1 = 0.7, top = a.top || (a.top = a.b.clone().add(new THREE3.Vector3(0, a.drop, 0)));
        if (k < k1) { const u = k / k1; a.o.position.lerpVectors(a.a, top, EZ.inOut(u)); a.o.position.y += Math.sin(u * Math.PI) * (a.h || 0); } else a.o.position.lerpVectors(top, a.b, EZ.in((k - k1) / (1 - k1))); }
      else if (a.b) { a.o.position.lerpVectors(a.a, a.b, e); if (a.h) a.o.position.y += Math.sin(k * Math.PI) * a.h; }
      if (a.rt) { const r0 = a.r0, R = a.rt, tu = (a.turns || 0) * Math.PI * 2, ee = Math.min(1, k / 0.7 >= 1 ? 1 : EZ.inOut(k / 0.7)); a.o.rotation.set(r0.x + (R.x - r0.x) * ee, r0.y + (R.y + tu - r0.y) * ee, r0.z + (R.z - r0.z) * ee); }
      if (a.s1 !== undefined) { const f = 1 + (a.s1 - 1) * e; a.o.scale.set(a.s0.x * f, a.s0.y * f, a.s0.z * f); }
      if (a.spin) a.o.rotation.set(a.r0.x + (a.spin.x || 0) * e, a.r0.y + (a.spin.y || 0) * e, a.r0.z + (a.spin.z || 0) * e);
      if (a.sc) a.o.scale.setScalar(a.sc[0] + (a.sc[1] - a.sc[0]) * e);
      if (a.fn) a.fn(e, k);
      if (k >= 1) { WK.tw.splice(i, 1); if (a.end) { try { a.end(); } catch (x) { console.warn('Animation:', x && x.message); } } } }
    if (WK.sp) for (let i = WK.sp.length - 1; i >= 0; i--) { const s = WK.sp[i]; s.t += dt; const env = Math.exp(-s.t * s.dm);
      if (env < 0.01 || !s.o.parent) { springSet(s, 0); WK.sp.splice(i, 1); continue; } springSet(s, s.amt * Math.sin(s.t * s.f) * env); }
    if (WK.upd) for (const f of WK.upd) f(dt);
    if (WK.mode === 'harvest' && WK.plant) WK.plant.userData.picks.forEach((q, i) => { if (!q.userData.taken) q.scale.setScalar(1 + 0.06 * Math.max(0, Math.sin(WK.t * 3.2 - i * 0.7))); });
    if (WK.mode === 'pack' && WK.pile) { let first = true; for (const p of WK.pile) { if (p.userData.taken || p.userData.fly) continue; const b = p.userData.bs || (p.userData.bs = p.scale.x); p.scale.setScalar(b * (first && WK.packSt === 'open' ? 1 + 0.08 * Math.max(0, Math.sin(WK.t * 4)) : 1)); first = false; } }
  }
