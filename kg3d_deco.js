// Kellergrün 3D: Deko-Teile in den Räumen als 3D-Modelle (nach Art des Teils gebaut, Größe aus der 2D-Grundfläche).
export function decoKit(THREE, api) {
  const TAU = Math.PI * 2, mc = new Map();
  const M = (hex, o) => { const k = hex + JSON.stringify(o || 0); if (!mc.has(k)) mc.set(k, new THREE.MeshStandardMaterial(Object.assign({ color: hex, roughness: 0.7 }, o || {}))); return mc.get(k); };
  const G = (hex, k) => M(hex, { emissive: new THREE.Color(hex), emissiveIntensity: k || 1 });
  const add = (p, geo, mat, x, y, z, rx, ry, rz) => { const m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (rx || ry || rz) m.rotation.set(rx || 0, ry || 0, rz || 0); m.castShadow = true; m.receiveShadow = true; p.add(m); return m; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), Cy = (a, b, h, s) => new THREE.CylinderGeometry(a, b, h, s || 14), Sp = (r, s) => new THREE.SphereGeometry(r, s || 14, Math.max(6, (s || 14) * 0.7)), Co = (r, h, s) => new THREE.ConeGeometry(r, h, s || 10);
  // Art und Farben je Teil: [Art, Farbe1, Farbe2, Hoehe]
  const D = {
    cactus: ['cactus', '#4F9A48', '#B4643C'], plant: ['plant', '#3F8A4A', '#B4643C'], flowers: ['flowers', '#F28BB0', '#B4643C'], bonsai: ['bonsai', '#4E9A5E', '#7A5232'], palm: ['palm', '#3FAE5E', '#8A5A36'], tree: ['palm', '#2F7A48', '#6B4A2A'], planter: ['planter', '#5FA855', '#7A5230'], plantwall: ['plantwall', '#3F8A4A', '#5A3A22'],
    beanbag: ['blob', '#E05A9A'], shelf: ['shelf', '#8A5A36', '#C9A064', 30], turntable: ['table', '#2B2F38', '#14161C', 14], fridge: ['tall', '#E8ECF2', '#B5BDC7', 40], easel: ['easel', '#A8865F', '#F4F4F8'], couch: ['sofa', '#4B8DFF'], armchair: ['sofa', '#A8505E'], trophy: ['trophy', '#E8B93A'], piano: ['piano', '#14161C'], hammock: ['hammock', '#E8C27A'], mirror: ['tall', '#C9D2DC', '#AEE4FF', 44],
    roundrug: ['rug', '#7FD0C8'], rug: ['rug', '#C0583A'], leafrug: ['rug', '#4F9A48'], starrug: ['rug', '#4B3A9A'], hemprug: ['rug', '#3F8A4A'], rugstripe: ['rug', '#2E5E9A'],
    candles: ['candles', '#F4EFD8'], lamp: ['lamp', '#FFD28A'], lavalamp: ['lava', '#FF5CA8'], neon: ['sign', '#FF5CA8'], discoball: ['disco', '#C9D2DC'], fireplace: ['fire', '#8A5A42'], chandelier: ['chand', '#E8B93A'], lantern: ['lamp', '#FFB45A'],
    fan: ['fan', '#AEB8C4'], globe: ['globe', '#4B8DFF'], speaker: ['tall', '#2B2F38', '#14161C', 30], tv: ['tv', '#14161C', '#4B8DFF'], tank: ['tank', '#7FD0FF'], arcade: ['arcade', '#4B3A9A', '#FF5CA8'], jukebox: ['arcade', '#C23B3B', '#FFD24A'], telescope: ['scope', '#E8ECF2'], radio: ['box', '#B5773A', '#2B2F38', 12], vinyl: ['table', '#2B2F38', '#14161C', 10],
    dartboard: ['dart', '#C23B3B'], kicker: ['table', '#3F8A4A', '#8A5A36', 18], pooltable: ['table', '#1E7A44', '#5A3418', 18], punchbag: ['bag', '#C23B3B'],
    guitar: ['guitar', '#B5773A'], drumset: ['drums', '#C23B3B'], coffee: ['box', '#2B2F38', '#C9D2DC', 18], popcorn: ['tall', '#C23B3B', '#F4F4F8', 30],
    gnome: ['gnome', '#C23B3B'], terrarium: ['tank', '#9BD05A'], snowglobe: ['globe', '#AEE4FF'], windchime: ['chime', '#9AA3AD'], piggy: ['blob', '#F2A0B5'],
    watercan: ['box', '#4FA85A', '#2F6A3A', 10], hygro: ['tall', '#E8ECF2', '#5FE584', 16], leafposter: ['poster', '#3F8A4A'], clipfan: ['fan', '#2B2F38'], seedrack: ['shelf', '#5A6270', '#5FA855', 28], drynet: ['net', '#5A6270'], jars: ['jars', '#AEE4FF'], mother: ['plant', '#2F7A48', '#3A3F47'], carbonfilter: ['tall', '#2B2F38', '#5A6270', 32], ledpanel: ['led', '#B983FF'], growtent: ['tent', '#C9D2DC'],
    futon: ['bed', '#7A4FA0', 8], bed: ['bed', '#4B8DFF', 14], bunkbed: ['bunk', '#8A5A36'], dbed: ['bed', '#E05A9A', 16], catbed: ['blob', '#C9A064'],
    bookstack: ['books', '#C23B3B'], fishbowl: ['tank', '#7FD0FF'], fairy: ['fairy', '#FFE27A'], clock: ['tall', '#8A5A36', '#F4EFD8', 46], robot: ['robot', '#9AA6B3'], safe: ['box', '#3A414B', '#C9D2DC', 26], statue: ['statue', '#D6CFC0'],
    bbq: ['bbq', '#2B2F38'], graffcanvas: ['poster', '#FF5CA8'], miniramp: ['ramp', '#8A939F'], vending: ['arcade', '#2F6FD6', '#E8ECF2'], pingpong: ['table', '#2F6FD6', '#F4F4F8', 16], gamingpc: ['tv', '#14161C', '#B983FF'], hottub: ['tub', '#C9A064'],
    hopsack: ['barrel', '#2F6FC4'], maltsacks: ['box', '#E8ECF2', '#E05555', 14], crates: ['box', '#4A5866', '#F4F4F8', 22], bartable: ['round', '#AEB8C4'], mugshelf: ['shelf', '#3A4350', '#4FD1C5', 28], casks: ['gas', '#3E7CC9'], prostsign: ['sign', '#4FD1C5'], tap: ['box', '#4A5562', '#C9D2DC', 14], kettle: ['flask', '#4FD1C5'], fermenter: ['reactor', '#C9D2DC']
  };
  function build(id) {
    const d = D[id] || ['box', '#8A6A4A', '#5A3A22', 18], [kind, c1, c2] = d, H = d[3] || 0, half = (api.dHalf && api.dHalf(id)) || [16, 16], w = half[0] * 1.8, dp = Math.max(10, half[1] * 1.1), g = new THREE.Group(), m1 = M(c1), m2 = M(c2 || '#5A3A22');
    switch (kind) {
      case 'rug': { const round = id === 'roundrug'; add(g, round ? Cy(half[0], half[0], 0.8, 28) : B(half[0] * 2, 0.8, half[1] * 2), m1, 0, 0.6, 0); add(g, round ? Cy(half[0] * 0.7, half[0] * 0.7, 0.9, 28) : B(half[0] * 1.5, 0.9, half[1] * 1.4), M(id === 'rugstripe' ? '#E9D5A8' : '#F4EFD8', { roughness: 0.95 }), 0, 0.7, 0); g.userData.flat = true; break; }
      case 'plant': case 'flowers': case 'cactus': case 'bonsai': add(g, Cy(6, 4.6, 9), m2, 0, 4.5, 0); if (kind === 'cactus') { add(g, Cy(3, 3, 16, 10), m1, 0, 16, 0); add(g, Cy(1.6, 1.6, 7, 8), m1, 4, 16, 0, 0, 0, 0.6); } else if (kind === 'flowers') { for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; add(g, Sp(2.2, 8), M(['#F28BB0', '#F6E27A', '#F4F4F8', '#B983FF'][k % 4]), Math.cos(a) * 3.6, 15 + (k % 2) * 2, Math.sin(a) * 3.6); } add(g, Sp(4.6, 10), M('#3F8A4A'), 0, 11, 0); } else if (kind === 'bonsai') { add(g, Cy(1, 1.4, 8, 6), m2, 0, 12, 0, 0, 0, 0.3); add(g, Sp(6, 10), m1, 2, 18, 0); } else for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; add(g, Co(2.6, 14, 6), m1, Math.cos(a) * 3, 15, Math.sin(a) * 3, Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); } break;
      case 'palm': add(g, Cy(6, 4.6, 9), M('#B4643C'), 0, 4.5, 0); add(g, Cy(1.6, 2.2, 26, 8), m2, 0, 20, 0); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; add(g, B(14, 0.8, 4), m1, Math.cos(a) * 6, 33, Math.sin(a) * 6, 0, -a, -0.4); } break;
      case 'planter': add(g, B(w, 12, dp), m2, 0, 6, 0); for (let k = 0; k < 6; k++) add(g, Sp(3.2, 8), k % 2 ? M('#C23B3B') : m1, -w / 2 + 5 + k * (w - 10) / 5, 14, (k % 2 - 0.5) * 4); break;
      case 'plantwall': add(g, B(w, 30, 4), m2, 0, 15, -dp / 2); for (let k = 0; k < 12; k++) add(g, Sp(3.4, 8), m1, -w / 2 + 4 + (k % 4) * (w - 8) / 3, 8 + Math.floor(k / 4) * 9, -dp / 2 + 3); break;
      case 'blob': add(g, Sp(Math.min(w, dp) * 0.55, 16), m1, 0, Math.min(w, dp) * 0.35, 0).scale.set(1, 0.7, 1); if (id === 'piggy') { add(g, Cy(2, 2, 2, 10), M('#E38AA2'), 0, 6, 7, Math.PI / 2); } break;
      case 'shelf': add(g, B(w, H, 10), m1, 0, H / 2, -dp / 2 + 5); for (let k = 0; k < 3; k++) { add(g, B(w - 2, 1, 10), m2, 0, 6 + k * (H - 6) / 3, -dp / 2 + 6); for (let q = 0; q < 4; q++) add(g, B(3, 6, 5), M(['#C23B3B', '#4B8DFF', '#F2C14E', '#5FA855'][(q + k) % 4]), -w / 2 + 5 + q * (w - 10) / 3, 9.5 + k * (H - 6) / 3, -dp / 2 + 6); } break;
      case 'table': add(g, B(w, 3, dp), m1, 0, H, 0); for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(g, B(2.4, H, 2.4), m2, x * (w / 2 - 3), H / 2, z * (dp / 2 - 3)); if (id === 'pooltable') for (let k = 0; k < 5; k++) add(g, Sp(1.3, 8), M(['#F4F4F8', '#C23B3B', '#F2C14E', '#2F6FD6', '#14161C'][k]), -8 + k * 4, H + 2.6, (k % 2) * 4 - 2); if (id === 'turntable' || id === 'vinyl') add(g, Cy(6, 6, 1, 20), M('#14161C'), -3, H + 2, 0); break;
      case 'tall': add(g, B(w * 0.7, H, Math.min(dp, 14)), m1, 0, H / 2, 0); add(g, B(w * 0.5, H * 0.3, 1), m2, 0, H * 0.6, Math.min(dp, 14) / 2 + 0.3); break;
      case 'box': add(g, B(w * 0.8, H, dp * 0.8), m1, 0, H / 2, 0); add(g, B(w * 0.5, H * 0.35, 1), m2, 0, H * 0.55, dp * 0.4 + 0.4); break;
      case 'sofa': add(g, B(w, 8, dp), m1, 0, 4, 0); add(g, B(w, 12, 5), m1, 0, 10, -dp / 2 + 2.5); for (const s of [-1, 1]) add(g, B(4, 10, dp), M(new THREE.Color(c1).multiplyScalar(0.8).getStyle()), s * (w / 2 - 2), 5, 0); add(g, B(w - 10, 3, dp - 6), M(new THREE.Color(c1).lerp(new THREE.Color('#fff'), 0.2).getStyle()), 0, 9, 1); break;
      case 'bed': case 'bunk': { const h = d[2] && typeof d[2] === 'number' ? d[2] : 12; add(g, B(w, h * 0.5, dp * 1.6), M('#8A5A36'), 0, h * 0.25, 0); add(g, B(w - 2, 4, dp * 1.5), M('#F4F4F8'), 0, h * 0.5 + 2, 0); add(g, B(w - 2, 3, dp), m1, 0, h * 0.5 + 4, dp * 0.25); add(g, B(w * 0.5, 3, 7), M('#F4F4F8'), 0, h * 0.5 + 5, -dp * 0.6); if (kind === 'bunk') { add(g, B(w, 3, dp * 1.6), M('#8A5A36'), 0, 26, 0); add(g, B(w - 2, 3, dp * 1.5), M('#4B8DFF'), 0, 29, 0); for (const x of [-1, 1]) for (const z of [-1, 1]) add(g, B(2, 30, 2), M('#8A5A36'), x * w / 2, 15, z * dp * 0.8); } break; }
      case 'lamp': add(g, Cy(4, 5, 2, 12), M('#2B2F38'), 0, 1, 0); add(g, Cy(0.8, 0.8, 24, 6), M('#2B2F38'), 0, 13, 0); add(g, Co(6, 7, 14), G(c1, 0.9), 0, 26, 0); g.userData.light = c1; break;
      case 'lava': add(g, Cy(3, 4, 4, 10), M('#C9D2DC', { metalness: 0.6 }), 0, 2, 0); add(g, Cy(2.6, 3.4, 14, 12), G(c1, 0.8), 0, 11, 0); g.userData.light = c1; break;
      case 'candles': for (let k = 0; k < 3; k++) { add(g, Cy(1.6, 1.6, 6 + k * 2, 8), m1, -4 + k * 4, 3 + k, 0); add(g, Sp(0.9, 6), G('#FFB45A', 2), -4 + k * 4, 7 + k * 2, 0); } g.userData.light = '#FFB45A'; break;
      case 'sign': add(g, B(w, 14, 2), M('#14161C'), 0, 18, -dp / 2); add(g, B(w - 6, 6, 1), G(c1, 1.6), 0, 18, -dp / 2 + 1.5); g.userData.light = c1; break;
      case 'disco': add(g, Cy(0.4, 0.4, 14, 4), M('#9AA3AD'), 0, 38, 0); add(g, Sp(7, 12), M('#E8ECF2', { metalness: 1, roughness: 0.15, flatShading: true }), 0, 30, 0); g.userData.spin = g.children[1]; break;
      case 'fire': add(g, B(w, 18, 8), m1, 0, 9, -dp / 2 + 4); add(g, B(w * 0.6, 9, 2), M('#14161C'), 0, 7, -dp / 2 + 8.2); add(g, Co(3.6, 8, 8), G('#FF7A3A', 2), 0, 6, -dp / 2 + 8.5); g.userData.light = '#FF7A3A'; break;
      case 'chand': add(g, Cy(0.4, 0.4, 10, 4), M('#9AA3AD'), 0, 44, 0); add(g, new THREE.TorusGeometry(8, 0.8, 6, 20), M(c1, { metalness: 0.8, roughness: 0.3 }), 0, 38, 0, Math.PI / 2); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; add(g, Sp(1.1, 6), G('#FFE2A0', 2), Math.cos(a) * 8, 40, Math.sin(a) * 8); } g.userData.light = '#FFE2A0'; break;
      case 'fan': add(g, Cy(4, 5, 2, 12), M('#2B2F38'), 0, 1, 0); add(g, Cy(0.8, 0.8, 20, 6), M('#5A6270'), 0, 11, 0); const fb = new THREE.Group(); fb.position.set(0, 22, 2); g.add(fb); for (let k = 0; k < 3; k++) add(fb, B(2.4, 8, 0.6), m1, Math.cos(k * TAU / 3) * 4, Math.sin(k * TAU / 3) * 4, 0, 0, 0, k * TAU / 3); g.userData.spinZ = fb; break;
      case 'globe': add(g, Cy(4, 5, 3, 12), m2, 0, 1.5, 0); add(g, Sp(id === 'snowglobe' ? 7 : 8, 16), id === 'snowglobe' ? M(c1, { transparent: true, opacity: 0.4, roughness: 0.05 }) : m1, 0, 11, 0); g.userData.spin = g.children[1]; break;
      case 'tv': add(g, B(w, 4, dp * 0.6), M('#5A3A22'), 0, 2, 0); add(g, B(w * 0.95, 18, 2), m1, 0, 14, -2); add(g, B(w * 0.85, 14, 0.5), G(c2, 0.6), 0, 14, -0.8); g.userData.light = c2; break;
      case 'tank': add(g, B(w, Math.max(10, dp * 0.9), dp), M(c1, { transparent: true, opacity: 0.35, roughness: 0.05 }), 0, Math.max(10, dp * 0.9) / 2, 0); add(g, B(w - 2, 2, dp - 2), M(id === 'terrarium' ? '#7A5A3A' : '#E8D9A8'), 0, 1, 0); if (id !== 'terrarium') for (let k = 0; k < 3; k++) add(g, Sp(1.2, 6), M('#FF9A3A'), -4 + k * 4, 5, 0); else add(g, Co(3, 8, 6), M('#4F9A48'), 0, 6, 0); break;
      case 'arcade': add(g, B(w * 0.8, 36, dp * 0.8), m1, 0, 18, 0); add(g, B(w * 0.6, 12, 1), G(c2, 0.8), 0, 26, dp * 0.4 + 0.3); add(g, B(w * 0.7, 3, 6), M('#14161C'), 0, 16, dp * 0.4); g.userData.light = c2; break;
      case 'scope': add(g, Cy(0.6, 0.6, 16, 6), M('#5A6270'), 0, 8, 0); add(g, Cy(2.4, 3, 18, 12), m1, 0, 20, 0, 0, 0, 1); break;
      case 'dart': add(g, Cy(9, 9, 2, 24), M('#14161C'), 0, 24, -dp / 2, Math.PI / 2); add(g, Cy(6, 6, 2.2, 24), m1, 0, 24, -dp / 2 + 0.2, Math.PI / 2); break;
      case 'bag': add(g, Cy(0.5, 0.5, 10, 4), M('#9AA3AD'), 0, 40, 0); add(g, Cy(5, 5, 22, 14), m1, 0, 24, 0); break;
      case 'guitar': add(g, Cy(5, 5, 2.5, 16), m1, 0, 6, 0, Math.PI / 2 - 0.2); add(g, B(2, 18, 1.4), M('#3A2414'), 0, 18, -2, -0.2); break;
      case 'drums': add(g, Cy(7, 7, 10, 16), m1, 0, 5, 0, Math.PI / 2); for (const x of [-10, 10]) add(g, Cy(5, 5, 4, 14), M('#F4F4F8'), x, 10, -3); add(g, Cy(6, 6, 0.4, 16), M('#E8B93A', { metalness: 0.8 }), 12, 18, -6); break;
      case 'gnome': add(g, Co(4, 9, 10), M('#4B8DFF'), 0, 4.5, 0); add(g, Sp(2.8, 10), M('#F1C9A5'), 0, 10, 0); add(g, Co(3, 7, 10), m1, 0, 15, 0); add(g, Co(2.6, 4, 8), M('#F4F4F8'), 0, 8, 2); break;
      case 'chime': add(g, B(16, 1.5, 1.5), M('#6B4A2E'), 0, 40, 0); for (let k = 0; k < 5; k++) add(g, Cy(0.7, 0.7, 8 + k * 2, 6), M(c1, { metalness: 0.8, roughness: 0.3 }), -6 + k * 3, 34 - k, 0); break;
      case 'poster': add(g, B(w, 22, 1), m1, 0, 24, -dp / 2); add(g, B(w * 0.6, 12, 1.2), M('#F4F4F8'), 0, 24, -dp / 2 + 0.2); break;
      case 'net': for (let k = 0; k < 4; k++) add(g, Cy(9, 9, 1, 16), M(c1, { wireframe: true }), 0, 10 + k * 7, 0); add(g, Cy(0.4, 0.4, 32, 4), M('#5A6270'), 0, 16, 0); break;
      case 'jars': for (let k = 0; k < 4; k++) { add(g, Cy(3, 3, 8, 12), M(c1, { transparent: true, opacity: 0.45, roughness: 0.05 }), -8 + k * 5.3, 4, 0); add(g, Sp(2, 8), M('#5FA855'), -8 + k * 5.3, 3, 0); add(g, Cy(3.2, 3.2, 1.6, 12), M('#C9A064'), -8 + k * 5.3, 8.6, 0); } break;
      case 'led': add(g, Cy(0.6, 0.6, 30, 6), M('#5A6270'), 0, 15, 0); add(g, B(w, 2, 12), M('#2B2F38'), 0, 30, 0); add(g, B(w - 2, 0.6, 10), G(c1, 1.4), 0, 28.8, 0); g.userData.light = c1; break;
      case 'tent': add(g, B(w, 40, dp), M(c1, { metalness: 0.5, roughness: 0.4 }), 0, 20, 0); add(g, B(w * 0.6, 30, 0.5), G('#B983FF', 0.6), 0, 18, dp / 2 + 0.3); g.userData.light = '#B983FF'; break;
      case 'books': for (let k = 0; k < 5; k++) add(g, B(10 - k, 2.4, 8), M(['#C23B3B', '#4B8DFF', '#F2C14E', '#5FA855', '#7A4FA0'][k]), 0, 1.2 + k * 2.4, 0, 0, k * 0.3, 0); break;
      case 'fairy': for (let k = 0; k < 10; k++) add(g, Sp(1, 6), G(['#FFE27A', '#FF7EB6', '#7FD0FF'][k % 3], 2), -w / 2 + k * w / 9, 34 + Math.sin(k) * 2, -dp / 2); g.userData.light = '#FFE27A'; break;
      case 'robot': add(g, B(12, 12, 9), m1, 0, 10, 0); add(g, B(9, 8, 8), m1, 0, 21, 0); for (const x of [-2.4, 2.4]) add(g, Sp(1.2, 6), G('#4DF0C8', 1.5), x, 22, 4.2); for (const x of [-3, 3]) add(g, B(3, 5, 3), M('#5A6270'), x, 2.5, 0); break;
      case 'statue': add(g, B(12, 8, 12), M('#9E978A'), 0, 4, 0); add(g, Cy(3.6, 4.6, 18, 12), m1, 0, 17, 0); add(g, Sp(4, 12), m1, 0, 29, 0); break;
      case 'bbq': add(g, Sp(8, 14), m1, 0, 16, 0).scale.set(1, 0.6, 1); for (let k = 0; k < 3; k++) add(g, Cy(0.6, 0.6, 14, 4), m1, Math.cos(k * 2.1) * 5, 7, Math.sin(k * 2.1) * 5); g.userData.light = '#FF7A3A'; break;
      case 'ramp': { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, 12); s.quadraticCurveTo(-w / 4, 0, 0, 0); s.quadraticCurveTo(w / 4, 0, w / 2, 12); s.lineTo(w / 2, 0); s.lineTo(-w / 2, 0); add(g, new THREE.ExtrudeGeometry(s, { depth: dp, bevelEnabled: false }), m1, 0, 0, -dp / 2); break; }
      case 'tub': add(g, B(w, 10, dp * 1.4), m1, 0, 5, 0); add(g, B(w - 6, 1, dp * 1.4 - 6), M('#4FB3FF', { transparent: true, opacity: 0.75, roughness: 0.05 }), 0, 9, 0); break;
      case 'round': add(g, Cy(9, 9, 1.6, 20), m1, 0, 18, 0); add(g, Cy(1.2, 1.2, 18, 8), M('#3B3F48'), 0, 9, 0); break;
      case 'barrel': add(g, Cy(7, 7, 18, 16), m1, 0, 9, 0); add(g, Cy(7.2, 7.2, 1.4, 16), M('#1F4F94'), 0, 12, 0); break;
      case 'gas': for (let k = 0; k < 3; k++) add(g, Cy(3.6, 3.6, 24, 12), M(['#3E7CC9', '#5FA86A', '#C9C2B4'][k]), -9 + k * 9, 12, 0); break;
      case 'flask': add(g, Sp(7, 14), M('#AEE4FF', { transparent: true, opacity: 0.4, roughness: 0.05 }), 0, 9, 0); add(g, Sp(5.6, 12), G(c1, 0.5), 0, 8, 0); add(g, Cy(1.6, 1.6, 10, 8), M('#AEE4FF', { transparent: true, opacity: 0.4 }), 0, 19, 0); g.userData.light = c1; break;
      case 'reactor': add(g, Cy(9, 9, 34, 16), M(c1, { metalness: 0.8, roughness: 0.25 }), 0, 19, 0); add(g, B(8, 10, 1), G('#4FD1C5', 1), 0, 22, 9); g.userData.light = '#4FD1C5'; break;
      case 'piano': add(g, B(w, 22, dp * 0.6), m1, 0, 11, 0); add(g, B(w - 4, 2, 6), M('#F4F4F8'), 0, 14, dp * 0.3 + 2); break;
      case 'hammock': for (const s of [-1, 1]) add(g, Cy(1, 1, 24, 6), M('#8A5A36'), s * w / 2, 12, 0); add(g, Sp(w / 2, 16), m1, 0, 12, 0).scale.set(1, 0.18, 0.4); break;
      case 'trophy': add(g, B(8, 4, 8), M('#5A3A22'), 0, 2, 0); add(g, Cy(1, 1, 6, 6), m1, 0, 7, 0); add(g, Cy(5, 2, 8, 14), M(c1, { metalness: 0.9, roughness: 0.25 }), 0, 14, 0); break;
      case 'easel': add(g, B(1.4, 30, 1.4), m1, -5, 15, 0, 0, 0, 0.15); add(g, B(1.4, 30, 1.4), m1, 5, 15, 0, 0, 0, -0.15); add(g, B(16, 14, 1), m2, 0, 20, 1.5); break;
      default: add(g, B(w * 0.8, H || 14, dp * 0.8), m1, 0, (H || 14) / 2, 0);
    }
    g.userData.id = id; return g;
  }
  function buildArea(items, pass) {
    const grp = new THREE.Group(), lights = [];
    for (const it of items || []) {
      const o = build(it.id); o.position.set(it.x, 1.2, it.y);
      const q = o.userData.flat ? (it.r || 0) : (it.q || 0); o.rotation.y = -q * Math.PI / 2;
      if (!o.userData.flat && (it.r || 0) % 2) o.scale.x = -1;
      grp.add(o); if (o.userData.light) lights.push(o);
    }
    grp.userData.lights = lights; return grp;
  }
  function animate(grp, t) { grp.traverse(o => { if (o.userData.spin) o.userData.spin.rotation.y = t * 0.8; if (o.userData.spinZ) o.userData.spinZ.rotation.z = t * 9; }); }
  return { build, buildArea, animate };
}
