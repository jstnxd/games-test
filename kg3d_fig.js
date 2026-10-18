// Kellergrün 3D: Figuren im Stil der 2D-Figuren (großer Kopf, kleiner Körper) mit Kleidung, Frisuren, Hüten,
// Kostümen, Halstüchern, Rücken-Kosmetik, Waffen, Auren, Begleitern (Orbit), Spuren und Haustieren.
export function figureKit(THREE, api) {
  const TAU = Math.PI * 2;
  const mc = new Map();
  const M = (hex, o) => { const k = hex + JSON.stringify(o || 0); if (!mc.has(k)) mc.set(k, new THREE.MeshStandardMaterial(Object.assign({ color: hex, roughness: 0.72, metalness: 0 }, o || {}))); return mc.get(k); };
  const glowM = (hex, k) => M(hex, { emissive: new THREE.Color(hex), emissiveIntensity: k || 1.2, roughness: 0.4 });
  const gc = new Map(); const GEO = (k, f) => { if (!gc.has(k)) gc.set(k, f()); return gc.get(k); };
  const sph = (r, ws, hs, ts, tl) => GEO('s' + [r, ws, hs, ts, tl], () => new THREE.SphereGeometry(r, ws || 18, hs || 12, 0, TAU, ts || 0, tl || Math.PI));
  const cyl = (a, b, h, s) => GEO('c' + [a, b, h, s], () => new THREE.CylinderGeometry(a, b, h, s || 12));
  const box = (w, h, d) => GEO('b' + [w, h, d], () => new THREE.BoxGeometry(w, h, d));
  const cone = (r, h, s) => GEO('k' + [r, h, s], () => new THREE.ConeGeometry(r, h, s || 10));
  const tor = (r, t, s) => GEO('t' + [r, t, s], () => new THREE.TorusGeometry(r, t, 8, s || 20));
  const add = (par, geo, mat, x, y, z, rx, ry, rz, sx, sy, sz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0); if (sx) m.scale.set(sx, sy || sx, sz || sx); m.castShadow = true; par.add(m); return m; };
  const rgb = L => '#' + new THREE.Color((L.r | 0) / 255, (L.g | 0) / 255, (L.b | 0) / 255).getHexString();
  const shade = (hex, k) => { const c = new THREE.Color(hex); if (k < 0) c.multiplyScalar(1 + k); else c.lerp(new THREE.Color('#ffffff'), k); return '#' + c.getHexString(); };
  const SKIN = () => api.SKIN_COLS || ['#F1C9A5'], HAIR = () => api.HAIR_COLS || ['#3a2a1e'];
  // Farben wie in der 2D-Figur
  function colors(L) {
    const cs = L.cos && L.cos !== 'none' ? (api.COSTUME || {})[L.cos] : null, base = rgb(L);
    let body = base, long = true, hand = SKIN()[L.skin] || '#F1C9A5';
    const tp = cs ? 'cs' : L.top;
    if (cs && !cs.sheet) { body = cs.body; hand = cs.hand; }
    else if (tp === 'tshirt' || tp === 'jersey' || tp === 'tank' || tp === 'polo') long = false;
    else if (tp === 'xmas') body = '#C23B3B'; else if (tp === 'bomber' || tp === 'tracksuit') body = shade(base, -0.28); else if (tp === 'suit') body = '#222633';
    else if (tp === 'hawaii') { long = false; body = '#2B9FA8'; } else if (tp === 'flannel') body = '#B5473A'; else if (tp === 'vest') { long = false; body = '#3C4A5C'; }
    else if (tp === 'denim') body = '#4C6EA0'; else if (tp === 'leather') body = '#2A2A30'; else if (tp === 'trench') body = '#B59A6A';
    const fem = L.sex === 'f', bt = cs ? 'cs' : (L.bot === 'auto' || !L.bot ? (fem ? 'skirt' : 'jeans') : L.bot);
    const lg = { col: '#35405F', skirt: false, bare: false, shoe: '#1C2030' };
    const BOT = { skirt: [shade(base, -0.28), 1, 1], shorts: ['#3E5A8A', 0, 1], cargo: ['#6B6A45'], baggy: ['#2C3E66'], jogger: ['#7C8394'], camo: ['#566B3C'], jeans: ['#3F5A8C'], bermuda: ['#9A8A5E', 0, 1], sports: ['#2B2F45', 0, 1], leggings: ['#17171E'], plaid: ['#9B2F3A', 1, 1], suitpants: ['#222633'], leatherp: ['#24242A'] };
    if (bt === 'cs') { lg.col = cs.legs || body; lg.shoe = cs.shoe || '#1C2030'; } else if (BOT[bt]) { lg.col = BOT[bt][0]; lg.skirt = !!BOT[bt][1]; lg.bare = !!BOT[bt][2]; }
    const SH = { barefoot: SKIN()[L.skin], slides: '#3B7BD8', sneaker: '#F4F4F8', wellies: '#F2C14E', runner: '#C6F23A', ballet: '#F2A6B8', heels: '#C2253B', dress: '#2A1C14', boots: '#5A3A22', led: '#4DF0C8', goldshoe: '#E8B93A' };
    if (!cs && L.shoe && SH[L.shoe]) lg.shoe = SH[L.shoe];
    return { cs, body, long, hand, lg, skin: SKIN()[L.skin] || '#F1C9A5', hair: HAIR()[L.hair] || '#3a2a1e', sleeve: tp === 'tank' ? SKIN()[L.skin] : body };
  }
  function lookKey(L) { return L ? [L.r, L.g, L.b, L.hair, L.hs, L.skin, L.sex, L.top, L.bot, L.hat, L.cos, L.shoe, L.back, L.bnd, L.band, L.size].join(',') : 'x'; }
  // ---------- Figur ----------
  function makeFigure(L) {
    L = L || {}; const c = colors(L), g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const S = Math.max(0.7, Math.min(1.5, L.size || 1)); body.scale.setScalar(S * 1.05);
    if (c.cs && c.cs.sheet) { // Gespenst: Laken ueber allem
      add(body, cone(11, 30, 16), M('#F2F4F8'), 0, 15, 0); add(body, sph(9.5), M('#F2F4F8'), 0, 28, 0);
      for (const x of [-3, 3]) add(body, sph(1.6, 8, 6), M('#10151C'), x, 29, 8.6);
      g.userData = { key: lookKey(L), legs: [], arms: [], body }; return g;
    }
    // Beine und Schuhe
    const legs = [-3, 3].map(x => { const p = new THREE.Group(); p.position.set(x, 12, 0); body.add(p);
      if (c.lg.bare) { add(p, cyl(2.2, 2, 8, 10), M(c.skin), 0, -6.5, 0); add(p, cyl(2.6, 2.5, 4, 10), M(c.lg.col), 0, -1.5, 0); }
      else add(p, cyl(2.5, 2.3, 10, 10), M(c.lg.col), 0, -5, 0);
      add(p, box(4.8, 3, 7), M(c.lg.shoe, L.shoe === 'led' || L.shoe === 'goldshoe' ? { emissive: new THREE.Color(c.lg.shoe), emissiveIntensity: L.shoe === 'led' ? 0.8 : 0.15, metalness: L.shoe === 'goldshoe' ? 0.7 : 0 } : undefined), 0, -10.5, 1);
      return p; });
    if (c.lg.skirt) add(body, cyl(5.6, 8.2, 6, 14), M(c.lg.col), 0, 10.5, 0);
    // Rumpf
    const torso = add(body, cyl(6.2, 6.8, 11, 14), M(c.body), 0, 17, 0, 0, 0, 0, 1, 1, 0.78);
    if (c.cs && c.cs.belly) add(body, sph(4.6, 12, 8), M(c.cs.belly), 0, 17, 3.2, 0, 0, 0, 1, 1.15, 0.5);
    if (!c.cs) {
      if (L.top === 'suit') { add(body, box(2.6, 9, 0.6), M('#F4F4F8'), 0, 18, 5.4); add(body, box(1.2, 6, 0.8), M('#C23B3B'), 0, 18, 5.6); }
      else if (L.top === 'hoodie' || L.top === 'tracksuit') add(body, tor(5.2, 1.6, 16), M(shade(c.body, -0.15)), 0, 22.4, -0.5, Math.PI / 2);
      else if (L.top === 'stripe' || L.top === 'jersey') for (let k = 0; k < 3; k++) add(body, cyl(6.35 + k * 0.1, 6.45 + k * 0.1, 1.2, 14), M('#F4F4F8'), 0, 13.5 + k * 3.4, 0, 0, 0, 0, 1, 1, 0.8);
      else if (L.top === 'vest') add(body, box(1, 9, 0.6), M('#8FA0B8'), 0, 17, 5.4);
      else if (L.top === 'xmas') add(body, cyl(6.9, 7.1, 1.6, 14), M('#F4F4F8'), 0, 12.2, 0, 0, 0, 0, 1, 1, 0.8);
    }
    // Arme mit Haenden
    const arms = [-1, 1].map(s => { const p = new THREE.Group(); p.position.set(s * 7.6, 21.5, 0); body.add(p);
      if (c.long) add(p, cyl(2, 1.8, 9, 8), M(c.sleeve), 0, -4.5, 0); else { add(p, cyl(2.1, 2, 3.5, 8), M(c.sleeve), 0, -1.6, 0); add(p, cyl(1.7, 1.6, 6, 8), M(c.skin), 0, -6.2, 0); }
      add(p, sph(2, 10, 8), M(c.hand), 0, -9.6, 0); return p; });
    // Kopf
    const head = new THREE.Group(); head.position.y = 31; body.add(head);
    add(head, sph(8.4, 22, 16), M(c.skin), 0, 0, 0, 0, 0, 0, 1, 0.96, 1);
    for (const x of [-3, 3]) { add(head, sph(1.25, 10, 8), M('#10151C', { roughness: 0.3 }), x, 0.6, 7.7); add(head, sph(0.45, 6, 4), M('#ffffff'), x + 0.4, 1.1, 8.7); }
    add(head, box(2.6, 0.6, 0.6), M(shade(c.skin, -0.35)), 0, -3.2, 8.1);
    if (L.sex === 'f') for (const x of [-4.6, 4.6]) add(head, sph(1.1, 8, 6), M('#F28BB0', { transparent: true, opacity: 0.55 }), x, -1.8, 6.9);
    if (c.cs) costumeHood(head, L.cos, c.cs); else hair(head, L.hs | 0, c.hair, L.sex === 'f');
    if (!c.cs && L.hat && L.hat !== 'none') hat(head, L.hat, c);
    band(body, head, L);
    if (L.back && L.back !== 'none') backItem(body, L.back);
    g.userData = { key: lookKey(L), legs, arms, body, head, S };
    return g;
  }
  function hair(h, hs, col, fem) {
    const m = M(col), cap = (tl, s) => add(h, sph(8.9, 20, 12, 0, tl || Math.PI * 0.52), m, 0, 0.3, -0.4, -0.18, 0, 0, s || 1, s || 1, s || 1);
    switch (hs) {
      case 9: return; // Glatze
      case 0: cap(); break;
      case 1: cap(); add(h, box(15.5, 13, 4), m, 0, -5, -6.5); break;
      case 2: cap(); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; add(h, cone(2.2, 6, 6), m, Math.cos(a) * 5, 8, Math.sin(a) * 5 - 1, Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); } break;
      case 3: cap(); add(h, sph(4, 12, 8), m, 0, 8.5, -4); break;
      case 4: cap(Math.PI * 0.62, 1.04); break;
      case 5: cap(); add(h, cyl(2.4, 1.4, 11, 8), m, 0, -1, -9.5, 0.35); break;
      case 6: cap(); for (const x of [-7.5, 7.5]) add(h, cyl(1.8, 1.2, 10, 8), m, x, -6, -2); break;
      case 7: for (let k = 0; k < 11; k++) { const a = k / 11 * TAU; add(h, sph(3.6, 10, 8), m, Math.cos(a) * 6.6, 4 + (k % 3), Math.sin(a) * 6.6 - 1); } add(h, sph(5, 12, 8), m, 0, 7, -1); break;
      case 8: cap(); add(h, box(9, 2.6, 3), m, -2.5, 5.8, 6.4, 0, 0, 0.35); break;
      case 10: add(h, sph(8.6, 18, 10, 0, Math.PI * 0.32), m, 0, 1.8, -0.5); break;
      case 11: cap(); add(h, box(8, 4, 6), m, 0, 8.5, 5, -0.5); break;
      case 12: add(h, box(2.4, 6, 15), m, 0, 9, -0.5); break;
      case 13: add(h, sph(12, 18, 12), m, 0, 4, -2.5); break;
      case 14: add(h, sph(8.7, 18, 10, 0, Math.PI * 0.45), m, 0, 0.2, -0.3); break;
      case 15: cap(); add(h, box(13, 10, 3.6), m, 0, -7, -6.5); break;
      case 16: cap(); for (const x of [-4.5, 4.5]) add(h, box(6, 2.4, 3), m, x, 5.6, 6.4, 0, 0, x > 0 ? -0.35 : 0.35); break;
      case 17: add(h, sph(9.4, 20, 10, 0, Math.PI * 0.6), m, 0, 0.6, 0); break;
      default: cap();
    }
    if (fem && (hs === 0 || hs === 8 || hs === 14)) add(h, box(14, 9, 3.4), m, 0, -4, -6.6);
  }
  function hat(h, id, c) {
    const red = M('#C23B3B'), wht = M('#F4F4F8'), blk = M('#1B1F26');
    const brim = (r, col, y) => add(h, cyl(r, r, 0.8, 22), col, 0, y || 6.4, 0);
    switch (id) {
      case 'cap': case 'sportcap': case 'snapback': { const col = M(id === 'sportcap' ? '#4B8DFF' : id === 'snapback' ? '#1B1F26' : '#C23B3B'); add(h, sph(9.1, 18, 10, 0, Math.PI * 0.5), col, 0, 1.2, 0); add(h, box(9, 0.8, 7), col, 0, 5.4, 9); break; }
      case 'backcap': { const col = M('#2F6FD6'); add(h, sph(9.1, 18, 10, 0, Math.PI * 0.5), col, 0, 1.2, 0); add(h, box(9, 0.8, 7), col, 0, 5.4, -9); break; }
      case 'beanie': case 'pompom': { const col = M(id === 'pompom' ? '#E05A9A' : '#3E5A8A'); add(h, sph(9.3, 18, 10, 0, Math.PI * 0.5), col, 0, 1.4, 0); add(h, cyl(9.4, 9.4, 2.4, 20), M(shade('#3E5A8A', 0.1)), 0, 2.4, 0); if (id === 'pompom') add(h, sph(2.6, 10, 8), wht, 0, 11, 0); break; }
      case 'headband': add(h, tor(8.7, 1, 24), M('#E05555'), 0, 3.5, 0, Math.PI / 2); break;
      case 'santa': add(h, cone(8.6, 13, 18), red, 0, 11, -1, -0.35); add(h, tor(8.4, 1.6, 22), wht, 0, 5, 0, Math.PI / 2); add(h, sph(2.2, 10, 8), wht, 0, 15, -5.5); break;
      case 'cowboy': brim(13, M('#8A5A32'), 5.5); add(h, cyl(6.8, 7.6, 6.5, 18), M('#8A5A32'), 0, 9, 0); add(h, cyl(7.7, 7.7, 1.4, 18), M('#3A2414'), 0, 6.6, 0); break;
      case 'tophat': brim(11.5, blk, 6.3); add(h, cyl(7, 7, 11, 18), blk, 0, 12, 0); add(h, cyl(7.1, 7.1, 1.8, 18), red, 0, 7.6, 0); break;
      case 'crown': { const g = M('#E8B93A', { metalness: 0.8, roughness: 0.3 }); add(h, cyl(7.4, 7.4, 3.6, 18, true), g, 0, 7.6, 0); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; add(h, cone(1.4, 3.2, 4), g, Math.cos(a) * 7.2, 10.6, Math.sin(a) * 7.2); } add(h, sph(1, 8, 6), M('#C23B3B', { emissive: new THREE.Color('#C23B3B'), emissiveIntensity: 0.4 }), 0, 8, 7.4); break; }
      case 'bucket': add(h, cyl(8.4, 11.5, 6, 20), M('#B59A6A'), 0, 6.6, 0); break;
      case 'flowercrown': for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; add(h, sph(1.6, 8, 6), M(['#F28BB0', '#F6E27A', '#F4F4F8'][k % 3]), Math.cos(a) * 8.2, 4.2, Math.sin(a) * 8.2); } break;
      case 'beret': add(h, cyl(9.4, 9.8, 2.6, 20), M('#B5473A'), 0, 6.8, -0.5, 0.1, 0, 0.18); break;
      case 'flatcap': add(h, sph(9.2, 18, 8, 0, Math.PI * 0.4), M('#6B6F78'), 0, 2.4, 0, 0, 0, 0, 1, 0.7, 1); add(h, box(9, 0.8, 5), M('#4A4D55'), 0, 6.4, 8.4); break;
      case 'headphones': add(h, tor(9, 0.9, 20), blk, 0, 1, 0); for (const x of [-9, 9]) add(h, cyl(3, 3, 2.6, 12), M('#E05555'), x, -0.5, 0, 0, 0, Math.PI / 2); break;
      case 'chef': add(h, cyl(7.6, 7, 4, 18), wht, 0, 7, 0); add(h, sph(8.2, 14, 10), wht, 0, 12, 0, 0, 0, 0, 1, 0.75, 1); break;
      case 'pirate': add(h, cyl(9.6, 9.6, 4, 3), blk, 0, 7.4, 0, 0, Math.PI / 2, 0, 1.2, 1, 1); add(h, sph(1.2, 6, 4), wht, 0, 7.4, 8.6); break;
      case 'wizard': add(h, cone(9, 18, 18), M('#4B3A9A'), 0, 14, 0, -0.15); brim(12, M('#4B3A9A'), 5.5); for (let k = 0; k < 3; k++) add(h, sph(0.9, 6, 4), glowM('#F6E27A', 1), Math.sin(k * 2) * 5, 10 + k * 3, 4); break;
      case 'halo': add(h, tor(6.5, 0.9, 24), glowM('#FFD24A', 1.4), 0, 13, 0, Math.PI / 2); break;
      case 'partyhat': add(h, cone(6, 13, 16), M('#E05A9A'), 0, 13, 0); add(h, sph(1.8, 8, 6), M('#F6E27A'), 0, 20, 0); for (let k = 0; k < 3; k++) add(h, tor(4.6 - k * 1.4, 0.5, 14), M(['#4B8DFF', '#F6E27A', '#4B8DFF'][k]), 0, 9 + k * 3.4, 0, Math.PI / 2); break;
      case 'sailor': add(h, cyl(8.8, 9.2, 4.4, 20), wht, 0, 6.8, 0); add(h, cyl(9.3, 9.3, 1.2, 20), M('#2F4F8F'), 0, 5.2, 0); break;
      case 'viking': add(h, sph(9.2, 18, 10, 0, Math.PI * 0.5), M('#9AA3AD', { metalness: 0.7, roughness: 0.35 }), 0, 1.4, 0); for (const s of [-1, 1]) add(h, cone(1.8, 8, 8), M('#F4EFD8'), s * 9.5, 7, 0, 0, 0, -s * 0.9); break;
      default: add(h, sph(9.1, 18, 10, 0, Math.PI * 0.5), M('#5A6270'), 0, 1.2, 0);
    }
  }
  function costumeHood(h, id, cs) {
    const m = M(cs.hood || cs.body);
    add(h, sph(9.6, 20, 12, 0, Math.PI * 0.62), m, 0, 0.4, -1.3, -0.25);
    if (id === 'bunny') for (const x of [-3.2, 3.2]) { add(h, cyl(1.8, 1.4, 11, 8), m, x, 13, -1); add(h, cyl(1, 0.8, 8, 8), M(cs.belly), x, 13, -0.1); }
    else if (id === 'bear' || id === 'panda' || id === 'cat' && false) for (const x of [-6, 6]) add(h, sph(2.8, 10, 8), M(id === 'panda' ? '#14161C' : cs.body), x, 7.5, -0.5);
    if (id === 'cat') for (const x of [-5, 5]) add(h, cone(2.6, 5, 4), m, x, 9, -0.5);
    if (id === 'dino') for (let k = 0; k < 4; k++) add(h, cone(1.6, 4, 4), M(cs.spike), 0, 9 - k * 2.5, -2 - k * 2.6, -0.6 - k * 0.3);
    if (id === 'devil') for (const s of [-1, 1]) add(h, cone(1.5, 5, 6), M('#14161C'), s * 4.5, 9, 0, 0, 0, -s * 0.4);
    if (id === 'shark') add(h, cone(2.6, 7, 3), m, 0, 11, -2, -0.2);
    if (id === 'frog') for (const x of [-4, 4]) { add(h, sph(2.8, 10, 8), m, x, 8, 2.5); add(h, sph(1.3, 8, 6), M('#10151C'), x, 8.5, 4.8); }
    if (id === 'robot') { add(h, cyl(0.5, 0.5, 5, 6), M('#C9D2DC'), 0, 11, 0); add(h, sph(1.4, 8, 6), glowM('#FF5C7A', 1.2), 0, 14, 0); }
    if (id === 'astro') add(h, sph(10.6, 20, 14), M('#AEE4FF', { transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0.2 }), 0, 0, 0);
    if (id === 'knight') add(h, box(14, 3, 2), M('#5C6472', { metalness: 0.7 }), 0, 1, 8.4);
    if (id === 'ninja') add(h, tor(8.9, 1, 22), M(cs.band), 0, 3.6, 0, Math.PI / 2);
    if (id === 'weed') for (let k = 0; k < 5; k++) add(h, cone(1.2, 6, 4), M('#63C174'), Math.cos(k) * 1.6, 12, Math.sin(k) * 1.6, Math.cos(k * 1.3) * 0.5, 0, Math.sin(k * 1.3) * 0.5);
    if (id === 'banana') add(h, cyl(1, 0.7, 4, 6), M('#6B4A2A'), 0, 11.5, 0);
    if (id === 'royal') add(h, cyl(6.4, 6.4, 3, 12), M('#F2D36B', { metalness: 0.7, roughness: 0.3 }), 0, 9.6, 0);
  }
  function band(body, h, L) {
    const col = M(L.bnd && /^#/.test(L.bnd) ? L.bnd : L.band || '#C23B3B'), b = L.band && L.band !== 'none' ? L.band : L.bnd && !/^#/.test(L.bnd) ? L.bnd : null;
    if (L.bs === 'rag' || b === 'bandrag') add(h, sph(9.1, 16, 8, 0, Math.PI * 0.48), col, 0, 1.2, 0);
    else if (b === 'bandneck' || L.bs === 'neck') add(body, tor(4.8, 1.6, 16), col, 0, 23, 0.6, Math.PI / 2);
    else if (b === 'bandmask' || L.bs === 'mask') add(h, box(12, 4.4, 2), col, 0, -2.6, 7.4);
  }
  function backItem(body, id) {
    const g = new THREE.Group(); g.position.set(0, 17, -5.6); body.add(g);
    switch (id) {
      case 'fanny': add(body, box(8, 3.6, 3), M('#E05A9A'), 0, 13.2, 5.4); break;
      case 'backpack': add(g, box(10, 11, 4.6), M('#2F6FD6'), 0, 1, -1.2); add(g, box(8, 4, 1.4), M('#4B8DFF'), 0, -1.6, -3.8); break;
      case 'skateback': add(g, box(5, 22, 1.2), M('#C94B4B'), 0, 0, -1.4, 0, 0, 0.35); break;
      case 'guitarback': add(g, cyl(4.6, 4.6, 2, 14), M('#B5773A'), 0, -4, -1.6, Math.PI / 2); add(g, box(1.6, 16, 1.2), M('#3A2414'), 2, 6, -1.6, 0, 0, -0.3); break;
      case 'capered': case 'capeleaf': add(g, box(13, 18, 0.8), M(id === 'capered' ? '#C23B3B' : '#3F8A4A', { side: THREE.DoubleSide }), 0, -4, -0.6, 0.18); break;
      case 'jetpack': for (const x of [-3, 3]) { add(g, cyl(2.4, 2.4, 11, 10), M('#9AA3AD', { metalness: 0.7, roughness: 0.3 }), x, 0, -1.8); add(g, cone(2, 4, 8), glowM('#FF9A3A', 1.4), x, -7.5, -1.8, Math.PI); } break;
      default: { // Fluegel
        const col = id === 'wbat' ? '#2A2340' : id === 'wangel' ? '#F4F4F8' : id === 'wfairy' ? '#AEE4FF' : '#FF7A3A', mm = id === 'wfairy' ? M(col, { transparent: true, opacity: 0.6, side: THREE.DoubleSide }) : id === 'wphoenix' ? glowM(col, 0.8) : M(col, { side: THREE.DoubleSide });
        for (const s of [-1, 1]) { const w = new THREE.Group(); w.position.set(s * 2, 2, -1.2); g.add(w); add(w, box(15, 10, 0.6), mm, s * 7.5, 3, 0, 0, 0, s * 0.35); add(w, box(10, 6, 0.6), mm, s * 6, -3, 0, 0, 0, -s * 0.2); w.userData.wing = s; }
      }
    }
  }
  function poseFigure(g, x, y, ang, step, t, moving, extraY) {
    g.position.set(x, extraY || 0, y); g.rotation.y = Math.PI / 2 - ang;
    const u = g.userData, s = moving ? Math.sin(step) * 0.65 : 0, bob = moving ? Math.abs(Math.sin(step)) * 0.9 : Math.sin(t * 2) * 0.25;
    if (u.body) u.body.position.y = bob;
    if (u.legs) u.legs.forEach((l, i) => { l.rotation.x = i ? -s : s; });
    if (u.arms) u.arms.forEach((a, i) => { a.rotation.x = i ? s * 0.8 : -s * 0.8; });
    if (u.body) u.body.traverse(o => { if (o.userData.wing) o.rotation.y = o.userData.wing * (0.2 + Math.sin(t * 6) * 0.25); });
  }
  // ---------- Waffe (Ruecken oder Hand) ----------
  function weapon(g, id) {
    const B = (api.BATS || []).find(b => b.id === id); if (!B) return null; const w = new THREE.Group();
    const m1 = B.glow ? glowM(B.c1, 0.9) : M(B.c1, { metalness: /alu|stahl|metal/i.test(B.id) ? 0.7 : 0.1, roughness: 0.4 }), m2 = M(B.c2 || '#3a2a1e');
    if ((B.grp || '').startsWith('Schl')) { add(w, cyl(1.1, 2.2, 22, 8), m1, 0, 11, 0); add(w, cyl(1.2, 1.2, 6, 8), m2, 0, 2, 0); }
    else { add(w, box(3.2, 9, 3.2), m1, 0, 5, 0); add(w, box(2, 3, 2), m2, 0, 0, 0); }
    g.add(w); return w;
  }
  // ---------- Haustiere ----------
  const PET = { dog: ['#B07A4A', '#F4E4D0'], cat: ['#8A8F99', '#F2D0D8'], bunny: ['#F4F1F6', '#FFD0DC'], panda: ['#F4F4F8', '#14161C'], teddy: ['#9A6A3E', '#C99A6A'], monkey: ['#7A4A2A', '#E8C9A0'], elephant: ['#9AA3AD', '#C9D2DC'], leopard: ['#E8B44A', '#3A2414'], bird: ['#4FB37A', '#F6E27A'], dolphin: ['#5E8FC0', '#EEF2F7'], dragon: ['#4FA85A', '#E8833A'] };
  function makePet(id) {
    const g = new THREE.Group(), [a, b] = PET[id] || ['#B07A4A', '#F4E4D0'], ma = M(a), mb = M(b), eye = M('#10151C');
    const fly = id === 'bird' || id === 'dolphin' || id === 'dragon';
    if (id === 'bird') { add(g, sph(3.6, 12, 8), ma, 0, 0, 0, 0, 0, 0, 1, 0.9, 1.2); add(g, sph(2.4, 10, 8), ma, 0, 2.4, 3); add(g, cone(0.9, 2, 6), M('#F2A93B'), 0, 2.2, 5.6, Math.PI / 2); for (const s of [-1, 1]) { const w = add(g, box(5, 0.6, 3.6), mb, s * 4, 0.6, 0); w.userData.wing = s; } }
    else if (id === 'dolphin') { add(g, sph(4, 12, 8), ma, 0, 0, 0, 0, 0, 0, 0.8, 0.8, 1.8); add(g, cone(1.6, 4, 3), ma, 0, 3.4, 0); add(g, sph(9, 16, 12), M('#9FD8FF', { transparent: true, opacity: 0.22, roughness: 0.05 }), 0, 0, 0); }
    else if (id === 'teddy' || id === 'monkey') { add(g, sph(4.2, 12, 8), ma, 0, 5, 0, 0, 0, 0, 1, 1.15, 0.9); add(g, sph(3.8, 12, 8), ma, 0, 11, 0); add(g, sph(2.2, 10, 6), mb, 0, 10.4, 3); for (const x of [-3, 3]) add(g, sph(1.5, 8, 6), ma, x, 14, 0); if (id === 'teddy') add(g, tor(3, 0.9, 12), M('#3F8A4A'), 0, 8, 0, Math.PI / 2); else add(g, tor(3, 0.6, 12, true), ma, 0, 4, -4, 0, Math.PI / 2, 0); }
    else { // Vierbeiner
      const big = id === 'elephant' ? 1.35 : 1; add(g, sph(4.6 * big, 12, 8), ma, 0, 6 * big, 0, 0, 0, 0, 1, 0.8, 1.45); add(g, sph(3.6 * big, 12, 8), ma, 0, 9 * big, 6 * big);
      for (const [x, z] of [[-2.6, -3.6], [2.6, -3.6], [-2.6, 3.4], [2.6, 3.4]]) add(g, cyl(1.2 * big, 1.1 * big, 5 * big, 6), id === 'panda' ? mb : ma, x * big, 2.5 * big, z * big);
      if (id === 'bunny') for (const x of [-1.4, 1.4]) add(g, cyl(0.9, 0.7, 6, 6), ma, x, 14, 5.5);
      else if (id === 'elephant') { for (const s of [-1, 1]) add(g, cyl(3.6, 3.6, 0.8, 12), mb, s * 4, 12, 6, 0, 0, Math.PI / 2); add(g, cyl(1.4, 0.8, 7, 8), ma, 0, 7, 10.5, 0.5); }
      else if (id === 'cat' || id === 'leopard') for (const x of [-2, 2]) add(g, cone(1.2, 2.4, 4), ma, x, 12.6, 6); else if (id === 'panda') for (const x of [-2.4, 2.4]) add(g, sph(1.3, 8, 6), mb, x, 12, 5.4); else for (const x of [-2.6, 2.6]) add(g, sph(1.4, 8, 6), mb, x, 11.6, 5);
      add(g, cyl(0.7, 0.4, 6, 6), ma, 0, 7, -7.5, -0.9);
      if (id === 'leopard') for (let k = 0; k < 6; k++) add(g, sph(0.9, 6, 4), mb, Math.cos(k * 2) * 3.6, 8.6, -3 + k * 1.2);
      for (const x of [-1.4, 1.4]) add(g, sph(0.6, 6, 4), eye, x * big, 9.8 * big, 9.2 * big);
    }
    if (id === 'dragon') { add(g, sph(4, 12, 8), ma, 0, 0, 0, 0, 0, 0, 1, 0.9, 1.4); add(g, sph(3, 10, 8), ma, 0, 2, 4.8); for (const s of [-1, 1]) { const w = add(g, box(7, 0.6, 5), M(b), s * 5, 2, 0, 0, 0, s * 0.3); w.userData.wing = s; } add(g, cone(1.2, 6, 6), ma, 0, -0.5, -6.5, -Math.PI / 2); }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.userData = { fly, id }; return g;
  }
  function posePet(g, x, y, face, t, moving, i) {
    const fl = g.userData.fly; g.position.set(x, fl ? 20 + Math.sin(t * 2 + i) * 3 : (moving ? Math.abs(Math.sin(t * 9)) * 1.5 : 0), y);
    g.rotation.y = face < 0 ? -Math.PI / 2 : Math.PI / 2;
    g.traverse(o => { if (o.userData.wing) o.rotation.z = o.userData.wing * (0.3 + Math.sin(t * 14) * 0.6); });
  }
  // ---------- Orbit-Begleiter ----------
  const ORB = { fireflies: [7, 'dot', ['#FFE27A'], 15, 22, 1.2, 1], leaves: [6, 'leaf', ['#5FA855', '#9AC24A'], 17, 18, 0.8], ring: [1, 'ring', ['#FF5CA8'], 17, 14, 0, 1], stars: [6, 'star', ['#FFD24A', '#FFF3B0'], 17, 22, 1, 1],
    bubbles: [6, 'bubble', ['#AEE4FF'], 15, 16, 0.6], snow: [8, 'dot', ['#FFFFFF'], 17, 26, 0.4, 0.5], hearts: [5, 'heart', ['#FF5C7A', '#FF9CC8'], 16, 22, 0.9, 0.6], planets: [3, 'planet', ['#E8833A', '#4B8DFF', '#5FE584'], 20, 18, 0.7],
    flames: [8, 'flame', ['#FF7A3A', '#FFD24A'], 15, 6, 1.6, 1.2], butterflies: [4, 'fly', ['#FF7EB6', '#7FD0FF', '#FFD24A', '#B983FF'], 18, 22, 0.8], notes: [5, 'note', ['#10151C', '#4B3A9A'], 17, 22, 1.1], orbs: [3, 'orb', ['#B983FF', '#4FD1C5', '#4B8DFF'], 18, 20, 1.4, 1.4],
    halo: [1, 'halo', ['#FFD24A'], 0, 46, 0, 1.5], lanterns: [4, 'lantern', ['#F2A93B', '#E8503A'], 19, 22, 1, 1], moons: [3, 'moon', ['#EEF2FF'], 20, 26, -1.2, 0.5] };
  function makeOrbit(id) {
    const d = ORB[id]; if (!d) return null; const [n, shape, cols, R, Y, sp, glow] = d, g = new THREE.Group(); g.userData = { R, Y, sp, items: [] };
    for (let i = 0; i < n; i++) {
      const col = cols[i % cols.length], m = glow ? glowM(col, glow) : M(col, shape === 'bubble' ? { transparent: true, opacity: 0.35, roughness: 0.05 } : undefined); let o;
      switch (shape) {
        case 'leaf': o = new THREE.Mesh(box(4, 0.6, 2.4), m); break; case 'ring': o = new THREE.Mesh(tor(R, 0.8, 32), m); o.rotation.x = Math.PI / 2; break;
        case 'star': o = new THREE.Mesh(GEO('oct', () => new THREE.OctahedronGeometry(1.8)), m); break; case 'bubble': o = new THREE.Mesh(sph(2.4, 12, 8), m); break;
        case 'heart': o = new THREE.Group(); add(o, sph(1.3, 8, 6), m, -0.9, 0.5, 0); add(o, sph(1.3, 8, 6), m, 0.9, 0.5, 0); add(o, cone(1.9, 2.6, 8), m, 0, -1, 0, Math.PI); break;
        case 'planet': o = new THREE.Mesh(sph(2.6 + i * 0.6, 14, 10), m); break; case 'flame': o = new THREE.Mesh(cone(1.6, 5, 8), m); break;
        case 'fly': o = new THREE.Group(); for (const s of [-1, 1]) { const w = add(o, box(3, 0.4, 2.4), M(col, { side: THREE.DoubleSide }), s * 1.6, 0, 0); w.userData.wing = s; } break;
        case 'note': o = new THREE.Group(); add(o, sph(1.2, 8, 6), m, 0, 0, 0); add(o, box(0.4, 4, 0.4), m, 1, 2, 0); break; case 'orb': o = new THREE.Mesh(sph(2.2, 14, 10), m); break;
        case 'halo': o = new THREE.Mesh(tor(7, 1, 28), m); o.rotation.x = Math.PI / 2; break; case 'lantern': o = new THREE.Mesh(box(3, 4, 3), m); break; case 'moon': o = new THREE.Mesh(sph(2.4 + (i === 0 ? 0.8 : 0), 14, 10), m); break;
        default: o = new THREE.Mesh(sph(1, 8, 6), m);
      }
      g.add(o); g.userData.items.push(o);
    }
    return g;
  }
  function poseOrbit(g, x, y, t) {
    const u = g.userData; g.position.set(x, 0, y);
    u.items.forEach((o, i) => { const n = u.items.length; if (u.R === 0 || n === 1 && u.sp === 0) { o.position.set(0, u.Y + Math.sin(t * 2) * 1, 0); if (o.userData && o.material && u.Y < 20) {} return; }
      const a = t * u.sp + i * Math.PI * 2 / n; o.position.set(Math.cos(a) * u.R, u.Y + Math.sin(t * 2 + i) * 3, Math.sin(a) * u.R * 0.9); o.rotation.y = -a; o.traverse(q => { if (q.userData.wing) q.rotation.z = q.userData.wing * Math.sin(t * 16) * 0.8; }); });
  }
  // ---------- Auren: Leuchten am Boden plus aufsteigende Funken ----------
  const AURA = { warm: '#FFC850', cool: '#78C8FF', rose: '#FF78AA', fire: '#FF6E28', ice: '#AAE6FF', violet: '#AA6EFF', rainbow: 'rb', galaxy: '#7850DC', sun: '#FFDC5A', aqua: '#3CDCC8', plasma: '#FF50DC', void: '#5A2A9A', bubbles: '#B4E6FF', hearts: '#FF5A8C', smoke: '#A0A0AA', leafs: '#6EC85A', money: '#5AC86E', storm: '#8CA0FF', comet: '#FFBE78', shadowfire: '#8C3CDC' };
  let glowTex = null;
  function glowTexture() { if (glowTex) return glowTex; const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), gr = x.createRadialGradient(32, 32, 1, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); glowTex = new THREE.CanvasTexture(c); return glowTex; }
  function makeAura(id) {
    const col = AURA[id]; if (!col) return null; const g = new THREE.Group(), rb = col === 'rb';
    const disc = new THREE.Mesh(GEO('auraDisc', () => new THREE.PlaneGeometry(64, 64).rotateX(-Math.PI / 2)), new THREE.MeshBasicMaterial({ map: glowTexture(), color: rb ? '#ffffff' : col, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); disc.position.y = 1.5; g.add(disc);
    const n = 14, pos = new Float32Array(n * 3), geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: glowTexture(), color: rb ? '#ffffff' : col, size: 7, sizeAttenuation: false, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); g.add(pts);
    g.userData = { disc, pts, n, rb, seeds: Array.from({ length: n }, (_, i) => [Math.random() * TAU, Math.random(), 8 + Math.random() * 14]) }; return g;
  }
  function poseAura(g, x, y, t) {
    const u = g.userData; g.position.set(x, 0, y); u.disc.material.opacity = 0.42 + Math.sin(t * 3) * 0.1; u.disc.scale.setScalar(1 + Math.sin(t * 2.4) * 0.06);
    if (u.rb) { const c = new THREE.Color().setHSL((t * 0.2) % 1, 0.9, 0.6); u.disc.material.color.copy(c); u.pts.material.color.copy(c); }
    const p = u.pts.geometry.attributes.position; for (let i = 0; i < u.n; i++) { const [a, ph, r] = u.seeds[i], k = (t * 0.45 + ph) % 1; p.setXYZ(i, Math.cos(a + t * 0.6) * r, 2 + k * 42, Math.sin(a + t * 0.6) * r * 0.85); } p.needsUpdate = true; u.pts.material.opacity = 0.85;
  }
  // ---------- Spuren am Boden ----------
  const TRAIL = { foot: '#3A3028', sparks: '#FFD24A', smoke: '#9A9AA4', rainbow: 'rb', pixel: 'mix', confetti: 'mix', petals: '#FF9CC8', bolt: '#7FE6FF', gold: '#FFD24A', bubtrail: '#AEE4FF', clover: '#5FB35A', fire: '#FF7A3A', dust: '#C9B08A' };
  function makeTrail(id) {
    const col = TRAIL[id]; if (!col) return null; const n = 48, geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3).fill(-9999), cl = new Float32Array(n * 3).fill(1);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(cl, 3));
    const glow = !(id === 'foot' || id === 'dust' || id === 'smoke');
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: glowTexture(), vertexColors: true, size: id === 'foot' ? 5 : 6, sizeAttenuation: false, transparent: true, opacity: 0.85, blending: glow ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: false }));
    pts.frustumCulled = false; pts.userData = { id, col, n, i: 0, age: new Float32Array(n).fill(99), last: null }; return pts;
  }
  const tc = new THREE.Color();
  function poseTrail(pts, x, y, t, dt, moving) {
    const u = pts.userData, p = pts.geometry.attributes.position, c = pts.geometry.attributes.color;
    if (moving && (!u.last || Math.hypot(x - u.last[0], y - u.last[1]) > 7)) { u.last = [x, y]; const i = u.i = (u.i + 1) % u.n; p.setXYZ(i, x + (Math.random() - 0.5) * 6, 2, y + (Math.random() - 0.5) * 6); u.age[i] = 0;
      if (u.col === 'rb') tc.setHSL((t * 0.3) % 1, 0.9, 0.6); else if (u.col === 'mix') tc.setHSL(Math.random(), 0.85, 0.6); else tc.set(u.col); c.setXYZ(i, tc.r, tc.g, tc.b); }
    for (let i = 0; i < u.n; i++) { u.age[i] += dt; if (u.age[i] > 1.6) p.setY(i, -9999); else if (u.id !== 'foot' && u.id !== 'dust') p.setY(i, 2 + u.age[i] * (u.id === 'smoke' || u.id === 'bubtrail' ? 14 : 4)); }
    p.needsUpdate = true; c.needsUpdate = true;
  }
  // ---------- Fahrraeder und Roller ----------
  function makeBike(id) {
    const g = new THREE.Group(), fr = M(id === 'bmx' ? '#E05555' : id === 'scooter' ? '#3BB3A6' : '#EEF2F7', { metalness: 0.5, roughness: 0.35 }), ty = M('#14161C');
    const wr = id === 'scooter' ? 3.4 : 5.4; for (const z of [-9.5, 9.5]) add(g, tor(wr - 0.8, 1, 18), ty, 0, wr, z, 0, Math.PI / 2, 0);
    if (id === 'scooter') { add(g, box(3, 1.6, 20), fr, 0, wr, 0); add(g, cyl(0.6, 0.6, 13, 6), M('#A4ADBA'), 0, wr + 6, 9); add(g, box(10, 1, 1), ty, 0, wr + 12.5, 9); }
    else { add(g, box(1.6, 1.6, 17), fr, 0, 10, 0, 0.3); add(g, box(1.6, 12, 1.6), fr, 0, 8, -3); add(g, box(10, 1, 1), ty, 0, 16, 7.5); add(g, box(3, 1, 5), ty, 0, 15, -3); if (id === 'ebike') add(g, box(4, 4.5, 6), M('#2A2F3A'), 0, 9, -1); }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
  }
  return { makeFigure, poseFigure, lookKey, weapon, makePet, posePet, makeOrbit, poseOrbit, makeAura, poseAura, makeTrail, poseTrail, makeBike, M };
}
