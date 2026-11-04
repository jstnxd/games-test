  // =====================================================================================================
  // v176: Gekaufter Ausbau ist in den 3D-Fenstern zu sehen. Lampe (Wachstum), Tropfschlauch und Tank (Wasser),
  // Düngerflaschen (Ertrag), Ventilatoren und Entfeuchter (Trocknen), goldene Samentüte und Sterne auf dem
  // Etikett (Samen), größerer Rucksack am Packtisch und eine Ausbau-Plakette an der Wand. Rein optisch.
  // =====================================================================================================
  const wkUp = k => { try { const st = S(WK.ar), u = (st && st.up) || {}; return Math.max(0, Math.floor(+u[k] || 0)); } catch (e) { return 0; } };
  const wkUpAll = k => { try { return Math.max(0, Math.floor(+(G.up || {})[k] || 0)); } catch (e) { return 0; } };
  const wkStars = n => '★'.repeat(Math.max(0, Math.min(5, n)));
  function wkUpSum() { let s = 0; for (const k of ['pots', 'grow', 'yield', 'rack', 'dry', 'water', 'seed']) s += wkUp(k); return s; }
  // Hintergrund-Töpfe im Keller: so viele, wie Töpfe offen sind (höchstens 4)
  const wkBgPots = () => { try { return Math.max(0, Math.min(4, potsOpen(WK.ar) - 1)); } catch (e) { return 2; } };
  function decoUps(T) {
    const m = WK.mode, leaf = WK.kind === 'leaf';
    if (!WK.upd) WK.upd = [];
    // Plakette an der Wand mit der Summe aller Ausbaustufen
    if (m !== 'pack') { const lv = wkUpSum(); if (lv > 0) { const tx = cvTex(160, 110, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#F6D77A'); g.addColorStop(1, '#C9983A'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.strokeStyle = '#7A5418'; x.lineWidth = 6; x.strokeRect(5, 5, w - 10, h - 10);
        x.fillStyle = '#4A3008'; x.textAlign = 'center'; x.font = '900 17px sans-serif'; x.fillText((WK.ar.name || 'Keller').toUpperCase().slice(0, 12), w / 2, 32); x.font = '900 34px sans-serif'; x.fillText('Stufe ' + lv, w / 2, 70); x.font = '900 15px sans-serif'; x.fillText(wkStars(Math.ceil(lv / 12)), w / 2, 94); });
      tx.wrapS = tx.wrapT = T.ClampToEdgeWrapping; const pl = new T.Mesh(new T.PlaneGeometry(0.3, 0.2), new T.MeshBasicMaterial({ map: tx })); pl.position.set(m === 'rack' ? 1.12 : 1.02, 1.08, -1.16); WK.scene.add(pl); box(T, 0.32, 0.22, 0.015, '#5A3A12', pl.position.x, 1.08, -1.172, 0.04); } }
    if (m === 'water' || m === 'harvest' || m === 'plant') {
      // Wachstumslampe: ab Stufe 3 LED in Pink-Lila, ab 7 breiter, ab 10 mit Leuchten
      const gr = wkUp('grow');
      if (WK.lamp && gr >= 3) { const pnl = WK.lampPanel; pnl.material.color.set(leaf ? '#FFF1C8' : '#FFC2F0'); pnl.material.map = cvTex(64, 32, (x, w, h) => { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) for (let j = 0; j < 6; j++) { x.fillStyle = (i + j) % 3 ? '#FFE0FF' : '#FFFFFF'; x.beginPath(); x.arc(2 + i * 4, 3 + j * 5, 1.4, 0, 7); x.fill(); } }); pnl.material.needsUpdate = true;
        if (gr >= 7) WK.lamp.scale.x = 1.35; if (WK.lampCone) WK.lampCone.material.opacity = 0.07 + Math.min(0.06, (gr - 2) * 0.008);
        if (gr >= 10) { const gl = new T.Sprite(new T.SpriteMaterial({ map: dotTex(), color: leaf ? '#FFE6B0' : '#FF9FE6', transparent: true, opacity: 0.5, depthWrite: false, blending: T.AdditiveBlending })); gl.scale.set(1.1, 0.4, 1); gl.position.y = -0.06; WK.lamp.add(gl); WK.upd.push(() => { gl.material.opacity = 0.42 + 0.08 * Math.sin(WK.t * 2); }); } }
      // Tropfbewässerung: Tank hinten rechts, Schlauch bis an den Topf, ein Tropfen fällt in die Erde
      const wa = wkUp('water');
      if (wa >= 1) { const g = new T.Group(); WK.root.add(g); const big = wa >= 6, th = big ? 0.42 : 0.3, tx0 = m === 'plant' ? 0.6 : 0.5, tz0 = m === 'plant' ? -0.55 : -0.32;
        const tank = cyl(T, big ? 0.11 : 0.085, big ? 0.11 : 0.085, th, M1('#CFE8F2', { transparent: true, opacity: 0.55 }), tx0, th / 2, tz0, 0.05, g, 18); const wl = cyl(T, (big ? 0.1 : 0.077), (big ? 0.1 : 0.077), th * 0.62, '#4AA3E0', tx0, th * 0.31 + 0.01, tz0, 0, g, 18); cyl(T, (big ? 0.115 : 0.09), (big ? 0.115 : 0.09), 0.03, '#2E3238', tx0, th + 0.015, tz0, 0.08, g, 18);
        blob(T, 0.3, 0.3, 0.003, 0.4, g).position.set(tx0, 0, tz0);
        const cur = new T.CatmullRomCurve3([new T.Vector3(tx0 - 0.06, 0.04, tz0 + 0.05), new T.Vector3(0.36, 0.02, -0.2), new T.Vector3(0.2, 0.02, -0.12), new T.Vector3(0.17, 0.2, -0.08), new T.Vector3(0.12, 0.33, -0.05), new T.Vector3(0.06, 0.32, -0.02)]);
        const tube = new T.Mesh(new T.TubeGeometry(cur, 40, 0.009, 6, false), M('#1D2129')); g.add(tube); const dr = cyl(T, 0.014, 0.01, 0.03, '#E8B23A', 0.06, 0.315, -0.02, 0.1, g, 8); dr.rotation.z = 0.5;
        const drop = new T.Mesh(new T.SphereGeometry(0.008, 8, 6), M('#7FC8F0')); g.add(drop); let dt0 = 0; WK.upd.push(dt => { dt0 = (dt0 + dt * (big ? 1.4 : 1)) % 1.6; const k = Math.min(1, dt0 / 0.45); drop.visible = dt0 < 0.45; drop.position.set(0.05, 0.3 - k * 0.0, -0.02); drop.position.y = 0.305 - k * k * 0.02; drop.scale.setScalar(0.6 + k * 0.6); wl.scale.y = 1 + 0.02 * Math.sin(WK.t * 1.3); }); }
      // Dünger: Flaschen links neben dem Topf, ab 5 ein Sack dazu, ab 10 eine goldene Flasche
      const yi = wkUp('yield');
      if (yi >= 1) { const g = new T.Group(); g.position.set(m === 'plant' ? -0.62 : -0.5, 0, m === 'plant' ? -0.1 : 0.05); WK.root.add(g); blob(T, 0.4, 0.3, 0.003, 0.4, g);
        const bot = (x, z, col, gold) => { cyl(T, 0.035, 0.04, 0.13, col, x, 0.065, z, 0.08, g, 12); cyl(T, 0.016, 0.02, 0.04, gold ? '#FFE9A0' : '#F2F4F7', x, 0.15, z, 0.1, g, 8); const lb = new T.Mesh(new T.PlaneGeometry(0.05, 0.05), new T.MeshBasicMaterial({ map: cvTex(32, 32, (q, w) => { q.fillStyle = gold ? '#FFF6D0' : '#FFFFFF'; q.fillRect(0, 0, w, w); q.fillStyle = gold ? '#B8861E' : '#2F8F4A'; q.font = '900 20px sans-serif'; q.textAlign = 'center'; q.fillText(gold ? '★' : '+', w / 2, 24); }) })); lb.position.set(x, 0.07, z + 0.042); g.add(lb); };
        bot(0, 0, '#3FAE6A'); if (yi >= 3) bot(0.09, 0.03, '#2E7A4A');
        if (yi >= 5) { const sk = box(T, 0.16, 0.1, 0.1, '#D9C08A', -0.11, 0.05, -0.02, 0.05, g); sk.rotation.y = 0.4; const top = box(T, 0.14, 0.03, 0.08, '#C9AE76', -0.11, 0.115, -0.02, 0, g); top.rotation.y = 0.4; }
        if (yi >= 10) bot(0.04, 0.11, '#E8B23A', true); }
      // Samen: goldene Samentüte mit Sternen
      const sd = wkUp('seed');
      if (m === 'plant' && sd >= 3 && WK.seedPk) { const tx = cvTex(64, 32, (x, w, h) => { x.fillStyle = '#F2C94C'; x.fillRect(0, 0, w, h); x.fillStyle = '#7A5418'; x.font = '900 16px sans-serif'; x.textAlign = 'center'; x.fillText(wkStars(Math.ceil(sd / 3)), w / 2, 22); });
        tx.wrapS = tx.wrapT = T.ClampToEdgeWrapping; const st = new T.Mesh(new T.PlaneGeometry(0.15, 0.06), new T.MeshBasicMaterial({ map: tx })); st.position.set(0, 0.2, 0.018); st.rotation.x = -0.25; WK.seedPk.add(st);
        const sp = new T.Sprite(new T.SpriteMaterial({ map: dotTex(), color: '#FFE9A0', transparent: true, opacity: 0.6, depthWrite: false, blending: T.AdditiveBlending })); sp.scale.setScalar(0.32); sp.position.set(0, 0.14, 0); WK.seedPk.add(sp); WK.upd.push(() => { sp.material.opacity = 0.35 + 0.25 * Math.sin(WK.t * 3); }); }
    }
    if (m === 'rack') {
      // Trockengebläse: Standventilatoren und ab Stufe 7 ein Entfeuchter
      const dr = wkUp('dry'), fan = (x, rot) => { const g = new T.Group(); g.position.set(x, 0, 0.15); g.rotation.y = rot; WK.scene.add(g); blob(T, 0.32, 0.32, 0.003, 0.45, g);
        cyl(T, 0.1, 0.12, 0.03, '#3A3F46', 0, 0.015, 0, 0.06, g, 16); cyl(T, 0.012, 0.012, 0.62, '#9AA4AE', 0, 0.33, 0, 0.12, g, 8);
        const hd = new T.Group(); hd.position.set(0, 0.68, 0); g.add(hd); const ring = new T.Mesh(new T.TorusGeometry(0.15, 0.012, 8, 28), M('#C9D2DC')); OL(ring, 0.1); hd.add(ring); cyl(T, 0.045, 0.045, 0.07, '#3A3F46', 0, 0, -0.04, 0.06, hd, 12).rotation.x = Math.PI / 2;
        const bl = new T.Group(); bl.userData.keep = true; hd.add(bl); for (let i = 0; i < 4; i++) { const b = new T.Mesh(new T.BoxGeometry(0.05, 0.12, 0.006), M('#5BC0EB')); b.position.y = 0.065; b.rotation.y = 0.45; const h = new T.Group(); h.rotation.z = i * Math.PI / 2; h.add(b); bl.add(h); }
        for (let i = -2; i <= 2; i++) { const gr = new T.Mesh(new T.BoxGeometry(0.29, 0.004, 0.004), M('#9AA4AE')); gr.position.set(0, i * 0.055, 0.02); hd.add(gr); } WK.fans.push(bl);
        WK.upd.push(() => { hd.rotation.y = Math.sin(WK.t * 0.6) * 0.35; }); return g; };
      if (dr >= 1) fan(1.12, -1.1); if (dr >= 4) fan(-1.12, 1.1);
      if (dr >= 7) { const g = new T.Group(); g.position.set(1.32, 0, -0.85); g.rotation.y = -0.35; WK.scene.add(g); box(T, 0.3, 0.46, 0.22, '#F2F4F7', 0, 0.23, 0, 0.04, g); box(T, 0.24, 0.08, 0.01, '#C9D2DC', 0, 0.1, 0.112, 0, g);
        const dsp = new T.Mesh(new T.PlaneGeometry(0.14, 0.06), new T.MeshBasicMaterial({ map: cvTex(64, 28, (x, w, h) => { x.fillStyle = '#0E2A12'; x.fillRect(0, 0, w, h); x.fillStyle = '#7BE07B'; x.font = '900 16px monospace'; x.textAlign = 'center'; x.fillText('45 %', w / 2, 20); }) })); dsp.position.set(0, 0.36, 0.111); g.add(dsp);
        const led = new T.Mesh(new T.SphereGeometry(0.012, 8, 6), new T.MeshBasicMaterial({ color: '#63E07B' })); led.position.set(0.1, 0.36, 0.112); g.add(led); WK.upd.push(() => { led.visible = Math.sin(WK.t * 4) > -0.3; }); blob(T, 0.4, 0.3, 0.003, 0.45, g); }
    }
    if (m === 'pack') {
      // Rucksack hinten rechts auf dem Tisch, wächst mit dem Rucksack-Ausbau. Mit Tragetasche oder Handkarren ein zweiter daneben.
      const bg = wkUpAll('bag'), extra = wkUpAll('sack') + wkUpAll('cart');
      if (bg >= 1) { const s = 1 + Math.min(0.45, bg * 0.03), g = new T.Group(); g.position.set(0.8, 0.45, -0.36); g.rotation.y = -0.4; g.scale.setScalar(s * 0.8); WK.root.add(g);
        box(T, 0.16, 0.2, 0.09, '#3A6EA8', 0, 0.1, 0, 0.05, g); box(T, 0.12, 0.08, 0.03, '#2E5A8A', 0, 0.07, 0.055, 0.06, g); box(T, 0.17, 0.05, 0.1, '#2E5A8A', 0, 0.205, 0, 0.05, g); for (const x of [-0.05, 0.05]) box(T, 0.02, 0.16, 0.012, '#1D2129', x, 0.11, -0.05, 0, g);
        if (extra >= 1) { const t = box(T, 0.12, 0.1, 0.06, '#C98A3C', -0.17, 0.05, 0.02, 0.06, g); t.rotation.y = 0.3; } }
    }
  }
