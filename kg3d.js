// Kellergrün 3D (Beta) – eigenständige 3D-Darstellung mit Three.js (r160, MIT-Lizenz).
// Die Spiellogik bleibt komplett in kellergruen.html. Dieses Modul liest nur den Spielzustand über die
// Schnittstelle "api" und zeichnet ihn räumlich. 2D bleibt als Sicherheitsnetz erhalten.
// Koordinaten: Spiel-x -> three x, Spiel-y -> three z, Höhe -> three y (1 Einheit = 1 Spiel-Pixel).
import * as THREE from './three.module.min.js';
import { figureKit } from './kg3d_fig.js';
import { decoKit } from './kg3d_deco.js';

export const VERSION = 2;

export function create(api, canvas, opts) {
  opts = opts || {};
  const Q = { low: { pr: 1, sh: 1024, aa: false, lamps: 2 }, mid: { pr: 1.75, sh: 2048, aa: true, lamps: 4 }, high: { pr: 2, sh: 2048, aa: true, lamps: 6 } }[opts.quality || 'mid'] || { pr: 1.75, sh: 2048, aa: true, lamps: 4 };
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: Q.aa, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.pr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-200, 200, 150, -150, 1, 6000); // v91: feste Kamera wie in 2D (leicht schraeg von oben)
  const kit = figureKit(THREE, api), deco = decoKit(THREE, api);
  scene.fog = new THREE.Fog(0x9fb8c8, 2600, 6000);

  // ---------- Umgebung (fuer PBR-Spiegelungen): weicher Himmel-Boden-Verlauf ----------
  { const es = new THREE.Scene(), sg = new THREE.SphereGeometry(100, 32, 16), cols = []; const top = new THREE.Color('#bcd8f0'), hor = new THREE.Color('#e8eef2'), bot = new THREE.Color('#4a5a40');
    const pa = sg.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i) / 100, c = y > 0 ? hor.clone().lerp(top, y) : hor.clone().lerp(bot, Math.min(1, -y * 3)); cols.push(c.r, c.g, c.b); }
    sg.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3)); es.add(new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const sunB = new THREE.Mesh(new THREE.SphereGeometry(8, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(6, 5.6, 5) })); sunB.position.set(50, 70, 30); es.add(sunB);
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(es, 0.04).texture; pm.dispose(); }
  // ---------- Licht ----------
  const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x3a4a30, 0.85); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.castShadow = true;
  sun.shadow.mapSize.set(Q.sh, Q.sh); const SC = 460; Object.assign(sun.shadow.camera, { left: -SC, right: SC, top: SC, bottom: -SC, near: 50, far: 2200 });
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 1.2; scene.add(sun); scene.add(sun.target);
  const amb = new THREE.AmbientLight(0x8090c0, 0.0); scene.add(amb);
  const lampLights = []; for (let i = 0; i < Q.lamps; i++) { const l = new THREE.PointLight(0xffc77a, 0, 230, 1.6); l.position.set(0, -999, 0); scene.add(l); lampLights.push(l); }
  const playerLight = new THREE.PointLight(0xffe2b0, 0, 160, 1.5); scene.add(playerLight);

  // ---------- Hilfen: prozedurale Texturen ----------
  function noiseCanvas(n, base, amp, seed, fn) {
    const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'); const img = x.createImageData(n, n); let s = seed || 1;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const h = new Float32Array(n * n); for (let i = 0; i < n * n; i++) h[i] = rnd();
    for (let k = 0; k < 2; k++) { const t = new Float32Array(n * n); for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) { let a = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) a += h[((y + dy + n) % n) * n + ((xx + dx + n) % n)]; t[y * n + xx] = a / 9; } h.set(t); }
    for (let i = 0; i < n * n; i++) { const v = fn ? fn(i % n, (i / n) | 0, h[i]) : base + (h[i] - 0.5) * amp; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = Math.max(0, Math.min(255, v)); img.data[i * 4 + 3] = 255; }
    x.putImageData(img, 0, 0); return { c, h, n };
  }
  function normalFrom(nc, strength) { // Normal Map aus einer Hoehenkarte
    const { h, n } = nc, c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'), img = x.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) { const hx = h[y * n + (xx + 1) % n] - h[y * n + (xx - 1 + n) % n], hy = h[((y + 1) % n) * n + xx] - h[((y - 1 + n) % n) * n + xx]; let nx = -hx * strength, ny = -hy * strength, nz = 1; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l; const i = (y * n + xx) * 4; img.data[i] = (nx * 0.5 + 0.5) * 255; img.data[i + 1] = (ny * 0.5 + 0.5) * 255; img.data[i + 2] = (nz * 0.5 + 0.5) * 255; img.data[i + 3] = 255; }
    x.putImageData(img, 0, 0); return c;
  }
  function tex(c, rep, srgb) { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; if (rep) t.repeat.set(rep, rep); t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; }
  const nGrass = noiseCanvas(128, 0, 0, 7, (x, y, v) => 150 + (v - 0.5) * 140), nAsph = noiseCanvas(128, 0, 0, 11, (x, y, v) => 128 + (v - 0.5) * 120);
  const nTile = noiseCanvas(128, 0, 0, 5, (x, y, v) => ((x % 32 < 2) || (y % 32 < 2) ? 60 : 170) + (v - 0.5) * 50);
  const nWall = noiseCanvas(128, 0, 0, 3, (x, y, v) => ((y % 16 < 1.5) || ((x + (Math.floor(y / 16) % 2) * 16) % 32 < 1.5) ? 90 : 165) + (v - 0.5) * 40);
  const nRoof = noiseCanvas(128, 0, 0, 9, (x, y, v) => (y % 12 < 2 ? 70 : 160 + ((x + (Math.floor(y / 12) % 2) * 8) % 16 < 1.5 ? -60 : 0)) + (v - 0.5) * 30);
  const T = {
    grassMap: tex(nGrass.c, 1, true), grassN: tex(normalFrom(nGrass, 3)), asphMap: tex(nAsph.c, 1, true), asphN: tex(normalFrom(nAsph, 2)),
    tileN: tex(normalFrom(nTile, 4)), wallN: tex(normalFrom(nWall, 3)), roofN: tex(normalFrom(nRoof, 5)), tileMap: tex(nTile.c, 1, true)
  };
  // Welt-UVs: Texturen wiederholen sich gleichmaessig, egal wie gross ein Teil ist
  const UVS = 1 / 64;
  // ---------- Geometrie zusammenfassen (wenige Draw Calls) ----------
  class Batch {
    constructor() { this.p = []; this.n = []; this.c = []; this.u = []; }
    addGeo(g, m4, col) {
      g = g.index ? g.toNonIndexed() : g; if (m4) g.applyMatrix4(m4);
      const P = g.attributes.position.array, N = g.attributes.normal.array, cr = col ? col.r : 1, cg = col ? col.g : 1, cb = col ? col.b : 1;
      for (let i = 0; i < P.length; i += 3) {
        const x = P[i], y = P[i + 1], z = P[i + 2], nx = N[i], ny = N[i + 1], nz = N[i + 2];
        this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(cr, cg, cb);
        if (Math.abs(ny) > 0.6) this.u.push(x * UVS, z * UVS); else if (Math.abs(nx) > Math.abs(nz)) this.u.push(z * UVS, y * UVS); else this.u.push(x * UVS, y * UVS);
      }
      g.dispose();
    }
    box(x0, y0, z0, x1, y1, z1, col) { const g = new THREE.BoxGeometry(Math.max(0.1, x1 - x0), Math.max(0.1, y1 - y0), Math.max(0.1, z1 - z0)); const m = new THREE.Matrix4().makeTranslation((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); this.addGeo(g, m, col); }
    mesh(mat, cast, recv) {
      const g = new THREE.BufferGeometry(); if (!this.p.length) return null;
      g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, mat); m.castShadow = !!cast; m.receiveShadow = !!recv; return m;
    }
  }
  const C = h => new THREE.Color(h);
  // ---------- Materialien (PBR) ----------
  const M = {
    grass: new THREE.MeshStandardMaterial({ vertexColors: true, map: T.grassMap, normalMap: T.grassN, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.96, metalness: 0 }),
    asphalt: new THREE.MeshStandardMaterial({ vertexColors: true, map: T.asphMap, normalMap: T.asphN, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.9, metalness: 0 }),
    concrete: new THREE.MeshStandardMaterial({ vertexColors: true, map: T.tileMap, normalMap: T.tileN, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.85, metalness: 0 }),
    wall: new THREE.MeshStandardMaterial({ vertexColors: true, normalMap: T.wallN, normalScale: new THREE.Vector2(0.45, 0.45), roughness: 0.82, metalness: 0 }),
    roof: new THREE.MeshStandardMaterial({ vertexColors: true, normalMap: T.roofN, normalScale: new THREE.Vector2(0.8, 0.8), roughness: 0.68, metalness: 0.02 }),
    wood: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: 0 }),
    metal: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.6 }),
    plain: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.05 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x24384c, roughness: 0.12, metalness: 0.2, emissive: new THREE.Color(0xffc070), emissiveIntensity: 0 }),
    lampHead: new THREE.MeshStandardMaterial({ color: 0xfff1cf, emissive: new THREE.Color(0xffd28a), emissiveIntensity: 0.2, roughness: 0.4 }),
    leaf: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0, flatShading: true }),
    floorIn: new THREE.MeshStandardMaterial({ vertexColors: true, normalMap: T.tileN, normalScale: new THREE.Vector2(0.3, 0.3), roughness: 0.7, metalness: 0 })
  };
  // Wasser: eigener Shader mit Wellen, Himmelsspiegelung (Fresnel) und Sonnenglanz
  const waterU = { uT: { value: 0 }, uDeep: { value: C('#1d5a86') }, uSky: { value: C('#9fd3f0') }, uSun: { value: new THREE.Vector3(0.4, 0.8, 0.3) }, uNight: { value: 0 }, fogColor: { value: C('#9fb8c8') }, fogNear: { value: 900 }, fogFar: { value: 2600 } };
  const water = new THREE.ShaderMaterial({ uniforms: waterU, fog: true,
    vertexShader: `uniform float uT; varying vec3 vW; varying vec3 vN; #include <fog_pars_vertex>
      void main(){ vec3 p = position; float w = sin(p.x*0.045+uT*1.6)*1.2 + sin(p.z*0.09-uT*1.1)*0.8; p.y += w;
        vN = normalize(vec3(-cos(p.x*0.045+uT*1.6)*0.054, 1.0, -cos(p.z*0.09-uT*1.1)*0.072));
        vec4 wp = modelMatrix*vec4(p,1.0); vW = wp.xyz; vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition; #include <fog_vertex> }`.replace(/#include <fog_pars_vertex>/, '\n#include <fog_pars_vertex>\n').replace(/#include <fog_vertex>/, '\n#include <fog_vertex>\n'),
    fragmentShader: `uniform vec3 uDeep; uniform vec3 uSky; uniform vec3 uSun; uniform float uNight; uniform float uT; varying vec3 vW; varying vec3 vN; #include <fog_pars_fragment>
      void main(){ vec3 V = normalize(cameraPosition - vW); vec3 N = normalize(vN + vec3(sin(vW.x*0.3+uT*3.0)*0.04, 0.0, cos(vW.z*0.27-uT*2.4)*0.04));
        float fr = pow(1.0 - max(dot(N,V),0.0), 3.0); vec3 col = mix(uDeep, uSky, 0.25 + fr*0.65);
        vec3 H = normalize(normalize(uSun) + V); float sp = pow(max(dot(N,H),0.0), 120.0) * (1.0-uNight);
        col += vec3(1.0,0.95,0.8)*sp*1.6; col *= mix(1.0, 0.35, uNight);
        gl_FragColor = vec4(col, 0.92); #include <tonemapping_fragment> #include <colorspace_fragment> #include <fog_fragment> }`.replace(/#include <(\w+)>/g, '\n#include <$1>\n'),
    transparent: true });

  // ---------- Statische Welt ----------
  const world = new THREE.Group(); scene.add(world);
  let wallMesh = null, wallSig = '';
  const G0 = () => api.G;
  function buildGround() {
    const WW = api.WW, WH = api.WH;
    const gb = new Batch(); gb.box(-3000, -2, -400, WW + 400, 0, WH + 400, C('#3b6638'));
    const zc = { park: '#3f7040', garden: '#355e36', lot: '#4a4f57', skate: '#6a7078', play: '#8a6a4a', pitch: '#3b8146', dog: '#3f6d39', allot: '#467d47' };
    for (const z of api.GROUNDS) { const col = zc[z.t] || '#3b6638'; const tgt = (z.t === 'lot' || z.t === 'skate') ? null : gb; if (tgt) tgt.box(z.x, 0, z.y, z.x + z.w, 0.4, z.y + z.h, C(col)); }
    const g = gb.mesh(M.grass, false, true); world.add(g);
    // befestigte Flaechen (Parkplaetze, Skaterpark): Beton
    const cb = new Batch(); for (const z of api.GROUNDS) if (z.t === 'lot' || z.t === 'skate') cb.box(z.x, 0, z.y, z.x + z.w, 0.6, z.y + z.h, C(z.t === 'lot' ? '#5a5f68' : '#7a8088'));
    // Gehwege an allen Strassen
    const SW = api.SW; for (const r of api.RD) { if (r.h) { cb.box(0, 0, r.c0 - SW, WW, 2.2, r.c0, C('#9aa0a8')); cb.box(0, 0, r.c1, WW, 2.2, r.c1 + SW, C('#9aa0a8')); } else { cb.box(r.c0 - SW, 0, 0, r.c0, 2.2, WH, C('#9aa0a8')); cb.box(r.c1, 0, 0, r.c1 + SW, 2.2, WH, C('#9aa0a8')); } }
    const RV = api.RIVER; cb.box(0, 0, api.UFER_N - 22, WW, 1.6, RV.y0, C('#b4a88a')); cb.box(0, 0, RV.y1, WW, 1.6, api.UFER_S + 22, C('#b4a88a'));
    world.add(cb.mesh(M.concrete, false, true));
    // Fahrbahnen
    const ab = new Batch(); for (const r of api.RD) { if (r.h) ab.box(0, 0, r.c0, WW, 0.9, r.c1, C('#3a3e45')); else ab.box(r.c0, 0, 0, r.c1, 0.95, WH, C('#3a3e45')); }
    world.add(ab.mesh(M.asphalt, false, true));
    // Fahrbahnmarkierungen
    const mb = new Batch(); for (const r of api.RD) { const mid = (r.c0 + r.c1) / 2; if (r.h) { for (let x = 20; x < WW; x += 70) mb.box(x, 0.95, mid - 1.5, x + 36, 1.15, mid + 1.5, C('#e8e2c8')); } else { for (let y = 20; y < WH; y += 70) mb.box(mid - 1.5, 1.0, y, mid + 1.5, 1.2, y + 36, C('#e8e2c8')); } }
    world.add(mb.mesh(M.plain, false, true));
    // Fluss: Bett und Wasser
    const bed = new Batch(); bed.box(0, -14, RV.y0, WW, -10, RV.y1, C('#22313a')); bed.box(0, -12, RV.y0 - 4, WW, 1.6, RV.y0, C('#6b6f74')); bed.box(0, -12, RV.y1, WW, 1.6, RV.y1 + 4, C('#6b6f74')); world.add(bed.mesh(M.concrete, false, true));
    const wg = new THREE.PlaneGeometry(WW, RV.y1 - RV.y0, 160, 6); wg.rotateX(-Math.PI / 2); wg.translate(WW / 2, -3, (RV.y0 + RV.y1) / 2); const wm = new THREE.Mesh(wg, water); world.add(wm);
    // Bruecken
    const br = new Batch(); for (const b of api.ALLB) { br.box(b.x0, 0, b.y0, b.x1, 3, b.y1, C(b.road ? '#5a5f66' : '#8a6a4a')); br.box(b.x0, 3, b.y0, b.x0 + 3, 12, b.y1, C('#9aa3ad')); br.box(b.x1 - 3, 3, b.y0, b.x1, 12, b.y1, C('#9aa3ad')); }
    const bm = br.mesh(M.wood, true, true); world.add(bm);
  }
  // Haeuser mit Satteldach, Fenstern, Tuer und Schornstein
  function buildHouses() {
    const wb = new Batch(), rb = new Batch(), gl = new Batch(), db = new Batch(), tb = new Batch();
    for (const h of api.HOUSES) {
      if (h.gang) continue;
      const H = 64 + ((h.x * 7 + h.y * 3) % 3) * 12, x0 = h.x, x1 = h.x + h.w, z0 = h.y, z1 = h.y + h.h;
      wb.box(x0, 0, z0, x1, H, z1, C(h.c || '#b9a48a'));
      tb.box(x0 - 2, 0, z0 - 2, x1 + 2, 7, z1 + 2, C('#6e6862')); // Sockel
      tb.box(x0 - 3, H - 3, z0 - 3, x1 + 3, H + 1, z1 + 3, C('#e9e3d8')); // Traufkante
      // Satteldach entlang der laengeren Seite
      const along = h.w >= h.h, ov = 6, rh = 34, rc = C(h.roof || '#7a4a3a');
      const shape = new THREE.Shape(); const span = (along ? h.h : h.w) + ov * 2; shape.moveTo(-span / 2, 0); shape.lineTo(span / 2, 0); shape.lineTo(0, rh); shape.lineTo(-span / 2, 0);
      const len = (along ? h.w : h.h) + ov * 2, eg = new THREE.ExtrudeGeometry(shape, { depth: len, bevelEnabled: false });
      const m = new THREE.Matrix4(); if (along) m.makeRotationY(Math.PI / 2).premultiply(new THREE.Matrix4().makeTranslation(x0 - ov, H, (z0 + z1) / 2)); else m.makeTranslation((x0 + x1) / 2, H, z0 - ov);
      rb.addGeo(eg, m, rc);
      // Schornstein
      wb.box(x0 + h.w * 0.7, H + 8, z0 + h.h * 0.3, x0 + h.w * 0.7 + 12, H + rh + 6, z0 + h.h * 0.3 + 12, C('#6b5a52'));
      // Fenster rundherum (zwei Reihen) und Tuer auf der Strassenseite
      const front = h.face === 1 ? z1 : z0, fd = h.face === 1 ? 1 : -1, fc = C('#f2efe8');
      const win = (fx, fy, z, d) => { const zo = z + (d > 0 ? 0 : -2.2), zi = z + (d > 0 ? 2.2 : 0);
        tb.box(fx - 11, fy + 8, zo, fx + 11, fy + 10, zi, fc); tb.box(fx - 11, fy - 10, zo, fx + 11, fy - 8, zi, fc); tb.box(fx - 11, fy - 8, zo, fx - 9, fy + 8, zi, fc); tb.box(fx + 9, fy - 8, zo, fx + 11, fy + 8, zi, fc);
        tb.box(fx - 0.8, fy - 8, zo, fx + 0.8, fy + 8, zi, fc); tb.box(fx - 12, fy - 12, z + (d > 0 ? 0 : -4.5), fx + 12, fy - 10, z + (d > 0 ? 4.5 : 0), C('#cfc8bc')); };
      for (const fy of [H * 0.32, H * 0.72]) {
        for (let k = 0; k < 3; k++) { const fx = x0 + h.w * (0.2 + k * 0.3); if (fy < H * 0.5 && Math.abs(fx - h.dx) < 26) continue; gl.box(fx - 9, fy - 8, front - (fd > 0 ? 0 : 1.5), fx + 9, fy + 8, front + (fd > 0 ? 1.5 : 0)); win(fx, fy, front, fd); }
        const back = h.face === 1 ? z0 : z1; for (let k = 0; k < 2; k++) { const fx = x0 + h.w * (0.3 + k * 0.4); gl.box(fx - 9, fy - 8, back - (fd > 0 ? 1.5 : 0), fx + 9, fy + 8, back + (fd > 0 ? 0 : 1.5)); win(fx, fy, back, -fd); }
      }
      db.box(h.dx - 11, 0, front - (fd > 0 ? 0 : 2), h.dx + 11, 30, front + (fd > 0 ? 2 : 0), C('#5a3a28'));
      db.box(h.dx - 16, 0, front + (fd > 0 ? 0 : -14), h.dx + 16, 3, front + (fd > 0 ? 14 : 0), C('#8a8f96')); // Stufe
    }
    world.add(wb.mesh(M.wall, true, true)); world.add(rb.mesh(M.roof, true, true)); const gm = gl.mesh(M.glass, false, false); if (gm) { gm.material = M.glass; world.add(gm); } world.add(db.mesh(M.wood, true, true)); world.add(tb.mesh(M.wall, true, true));
  }
  // Baeume, Buesche, Laternen als Instanzen
  let lampHeads = null;
  function buildNature() {
    const trees = api.TREES, n = trees.length;
    const trunkG = new THREE.CylinderGeometry(3, 4.5, 30, 6), leafG = new THREE.IcosahedronGeometry(20, 3);
    const trunk = new THREE.InstancedMesh(trunkG, new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.9 }), n), leaf = new THREE.InstancedMesh(leafG, new THREE.MeshStandardMaterial({ roughness: 0.8 }), n * 3);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
    trees.forEach((t, i) => { const r = ((t[0] * 13 + t[1] * 7) % 100) / 100; p.set(t[0], 15, t[1] + 12); s.set(1, 1, 1); m.compose(p, q, s); trunk.setMatrixAt(i, m);
      for (let k = 0; k < 3; k++) { p.set(t[0] + [-4, 8, 0][k], 38 + [0, 6, 16][k], t[1] + 12 + [4, -2, -5][k]); const sc = [1, 0.8, 0.7][k] * (0.85 + r * 0.35); s.set(sc, sc * 0.9, sc); q.setFromEuler(new THREE.Euler(0, r * 6 + k, 0)); m.compose(p, q, s); leaf.setMatrixAt(i * 3 + k, m); col.setHSL(0.27 + r * 0.06, 0.45, 0.28 + k * 0.06); leaf.setColorAt(i * 3 + k, col); } q.identity(); });
    trunk.castShadow = leaf.castShadow = true; trunk.receiveShadow = leaf.receiveShadow = true; world.add(trunk, leaf);
    const bush = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshStandardMaterial({ roughness: 0.85 }), api.bushes.length);
    api.bushes.forEach((b, i) => { p.set(b.x, b.r * 0.5, b.y); s.set(b.r, b.r * 0.75, b.r); m.compose(p, q, s); bush.setMatrixAt(i, m); col.setHSL(0.3, 0.4, 0.2 + (i % 5) * 0.02); bush.setColorAt(i, col); });
    bush.castShadow = true; bush.receiveShadow = true; world.add(bush);
    const L = api.LAMPS, post = new THREE.InstancedMesh(new THREE.CylinderGeometry(1.4, 2, 56, 6), new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.4, metalness: 0.8 }), L.length);
    lampHeads = new THREE.InstancedMesh(new THREE.BoxGeometry(10, 4, 10), M.lampHead, L.length);
    L.forEach((l, i) => { p.set(l.x, 28, l.y); s.set(1, 1, 1); m.compose(p, q, s); post.setMatrixAt(i, m); p.set(l.x, 57, l.y); m.compose(p, q, s); lampHeads.setMatrixAt(i, m); });
    post.castShadow = true; world.add(post, lampHeads);
  }
  // Waende und feste Hindernisse (aendern sich, z. B. bei offenen Toren oder Seitentueren)
  function colSig() { const c = api.colliders; let s = c.length + ':'; for (let i = 0; i < c.length; i += 1) { const o = c[i]; if (o.fl === undefined) s += ((o.x | 0) + (o.y | 0) * 3 + (o.w | 0) * 7) + ','; } return s; }
  function buildWalls() {
    if (wallMesh) { world.remove(wallMesh); wallMesh.geometry.dispose(); }
    const wb = new Batch(), skip = new Set();
    for (const h of api.HOUSES) skip.add(h.x + ':' + h.y);
    const treeSet = new Set(api.TREES.map(t => (t[0] - 7) + ':' + (t[1] + 6)));
    const inside = api.interiorRects(), own = api.ownColliders(), A = api.APO;
    for (const c of api.colliders) {
      if (c.fl !== undefined || c.river || c.water || c.x < -50) continue;
      if (skip.has(c.x + ':' + c.y) || treeSet.has(c.x + ':' + c.y) || own.has(c)) continue;
      if (A && c.x === A.x && c.y === A.y && c.w === A.w) continue; // Apotheke baut buildSpecial
      if (api.FOUNTAIN && Math.abs(c.x + c.w / 2 - api.FOUNTAIN.x) < 50 && Math.abs(c.y + c.h / 2 - api.FOUNTAIN.y) < 50) continue;
      if (api.FG && c.x >= api.FG.x && c.x + c.w <= api.FG.x + api.FG.w && c.y + c.h <= api.FG.h) continue; // Garten zeichnet buildGardens
      const isWall = inside.some(r => c.x >= r.x0 - 20 && c.x + c.w <= r.x1 + 20 && c.y >= r.y0 - 20 && c.y + c.h <= r.y1 + 20 && (c.w <= 16 || c.h <= 16));
      const big = c.w * c.h > 30000, ht = isWall ? 46 : big ? 70 : c.w < 20 || c.h < 20 ? 22 : 30;
      const col = isWall ? '#d8d2c4' : big ? '#8d97a3' : '#7a6a5a';
      wb.box(c.x, 0, c.y, c.x + c.w, ht, c.y + c.h, C(col));
      if (isWall) wb.box(c.x - 0.5, ht, c.y - 0.5, c.x + c.w + 0.5, ht + 2, c.y + c.h + 0.5, C('#efe8da'));
    }
    wallMesh = wb.mesh(M.wall, true, true); if (wallMesh) world.add(wallMesh); wallSig = colSig();
  }
  // Innenraeume: Boden, Toepfe mit Pflanzen, Gestelle, Tische
  const areaGroup = new THREE.Group(); scene.add(areaGroup); let areaSig = '';
  const potObjs = [];
  function buildAreas() {
    while (areaGroup.children.length) { const o = areaGroup.children.pop(); o.traverse(q => { if (q.geometry) q.geometry.dispose(); }); }
    potObjs.length = 0;
    const fb = new Batch(), fur = new Batch();
    for (const ar of api.areasNow()) {
      const I = ar.IN; fb.box(I.x0, 0.5, I.y0, I.x1, 1.2, I.y1, C(ar.floor || '#3a4048'));
      if (!ar.open) continue;
      // Gestell und Tisch
      const R = ar.RACK, Tb = ar.TABLE;
      if (R) { fur.box(R.x - 60, 0, R.y - 22, R.x + 60, 4, R.y + 22, C('#4a505a')); for (const k of [-1, 1]) fur.box(R.x + k * 56 - 3, 0, R.y - 22, R.x + k * 56 + 3, 52, R.y + 22, C('#8c96a3')); for (let s = 0; s < 3; s++) fur.box(R.x - 58, 16 + s * 14, R.y - 20, R.x + 58, 17.5 + s * 14, R.y + 20, C('#b5bdc7')); }
      if (Tb) { fur.box(Tb.x - 60, 0, Tb.y - 20, Tb.x + 60, 26, Tb.y + 20, C(ar.key === 'tabak' ? '#7a6448' : ar.key === 'brau' ? '#4a5562' : '#5e646e')); fur.box(Tb.x - 58, 26, Tb.y - 18, Tb.x + 58, 28, Tb.y + 18, C(ar.key === 'brau' ? '#aeb8c4' : '#7c838e')); }
      for (let i = 0; i < ar.POTS.length; i++) {
        const P = ar.POTS[i], open = i < ar.nOpen; if (!open) { fb.box(P.x - 16, 1.2, P.y - 16, P.x + 16, 1.8, P.y + 16, C('#262a30')); continue; }
        const g = new THREE.Group(); g.position.set(P.x, 0, P.y);
        const pot = new THREE.Mesh(potGeo, ar.key === 'brau' ? potMatLab : potMat); pot.castShadow = true; pot.receiveShadow = true; g.add(pot);
        const soil = new THREE.Mesh(soilGeo, soilMat); soil.position.y = 17; g.add(soil);
        const plant = new THREE.Group(); plant.position.y = 17; g.add(plant);
        for (let k = 0; k < 5; k++) { const lf = new THREE.Mesh(leafGeo, leafMats[0]); const a = k / 5 * Math.PI * 2; lf.position.set(Math.cos(a) * 5, 8, Math.sin(a) * 5); lf.rotation.set(Math.sin(a) * 0.6, 0, -Math.cos(a) * 0.6); lf.castShadow = true; plant.add(lf); }
        const top = new THREE.Mesh(budGeo, budMat); top.position.y = 22; top.castShadow = true; plant.add(top);
        areaGroup.add(g); potObjs.push({ g, plant, top, ar: ar.key, i });
      }
    }
    const fm = fb.mesh(M.floorIn, false, true); if (fm) areaGroup.add(fm); const um = fur.mesh(M.metal, true, true); if (um) areaGroup.add(um);
    for (const ar of api.areasNow()) if (ar.open) { const d = deco.buildArea(api.decItems(ar.key)); if (d) areaGroup.add(d.grp || d); } // v91: Deko in 3D
  }
  const potGeo = new THREE.CylinderGeometry(15, 11, 18, 14); potGeo.translate(0, 9, 0);
  const soilGeo = new THREE.CylinderGeometry(13.5, 13.5, 1.5, 14);
  const leafGeo = new THREE.ConeGeometry(4, 22, 5); const budGeo = new THREE.ConeGeometry(5, 14, 6);
  const potMat = new THREE.MeshStandardMaterial({ color: 0xb4643c, roughness: 0.8 }), potMatLab = new THREE.MeshStandardMaterial({ color: 0xe8ecf2, roughness: 0.25, metalness: 0.3 });
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 1 });
  const leafMats = [new THREE.MeshStandardMaterial({ color: 0x3f9a4a, roughness: 0.7 }), new THREE.MeshStandardMaterial({ color: 0x9ac24a, roughness: 0.7 })];
  const budMat = new THREE.MeshStandardMaterial({ color: 0x7e57b0, roughness: 0.5, emissive: new THREE.Color(0x3a1a60), emissiveIntensity: 0.0 });
  function updatePots() {
    for (const o of potObjs) {
      const p = api.potState(o.ar, o.i); if (!p) { o.plant.visible = false; continue; }
      o.plant.visible = p.s > 0; if (!p.s) continue;
      const k = p.s === 2 ? 1 : 0.25 + p.p * 0.75; o.plant.scale.set(k, k, k);
      const ripe = p.s === 2; o.plant.children.forEach((c, j) => { if (c !== o.top) c.material = leafMats[ripe ? 1 : 0]; });
      o.top.visible = p.s === 2 || p.p > 0.6;
    }
    budMat.emissiveIntensity = 0.3 + 0.2 * Math.sin(api.gt() * 3);
  }
  // Floras Blumengarten, Brunnenplatz und Teich
  function buildGardens() {
    const B = new Batch(), m4 = new THREE.Matrix4(); const fl = [];
    for (const bd of api.FG_BEDS || []) {
      if (bd.r) { const g = new THREE.CylinderGeometry(bd.r + 3, bd.r + 3, 6, 24); B.addGeo(g, m4.makeTranslation(bd.x, 3, bd.y), C('#8c7a5e')); const s = new THREE.CylinderGeometry(bd.r, bd.r, 1, 24); B.addGeo(s, m4.makeTranslation(bd.x, 6.2, bd.y), C('#4a3424'));
        for (let ring = 0; ring < 3; ring++) { const n = ring ? ring * 8 : 1; for (let k = 0; k < n; k++) { const an = k * Math.PI * 2 / n + ring * 0.4; fl.push([bd.x + Math.cos(an) * ring * 10, bd.y + Math.sin(an) * ring * 10, bd.c[(ring + k) % 2], ring ? 3.6 : 5]); } } }
      else { B.box(bd.x - 3, 0, bd.y - 3, bd.x + bd.w + 3, 6, bd.y + bd.h + 3, C('#8c7a5e')); B.box(bd.x, 6, bd.y, bd.x + bd.w, 7, bd.y + bd.h, C('#4a3424'));
        for (let row = 0; row < 4; row++) for (let k = 0; k < 11; k++) { const fx = bd.x + 10 + k * 15 + (row % 2) * 7, fy = bd.y + 11 + row * 16; if (fx > bd.x + bd.w - 6) continue; fl.push([fx, fy, bd.c[row % 3], 3.4]); } }
    }
    const fountains = []; if (api.FG) fountains.push([api.FG.cx, api.FG.cy, 30]); if (api.FOUNTAIN) fountains.push([api.FOUNTAIN.x, api.FOUNTAIN.y, api.FOUNTAIN.r]);
    for (const [x, y, r] of fountains) { B.addGeo(new THREE.CylinderGeometry(r + 2, r + 4, 12, 32, 1, true), m4.makeTranslation(x, 6, y), C('#c9c2b4')); B.addGeo(new THREE.TorusGeometry(r + 1, 2.2, 6, 32).rotateX(Math.PI / 2), m4.makeTranslation(x, 12, y), C('#ddd6c8')); B.addGeo(new THREE.CylinderGeometry(r, r, 2, 32), m4.makeTranslation(x, 2, y), C('#3a5560')); B.addGeo(new THREE.CylinderGeometry(5, 7, 30, 12), m4.makeTranslation(x, 15, y), C('#e2dccf')); B.addGeo(new THREE.CylinderGeometry(14, 10, 4, 20), m4.makeTranslation(x, 30, y), C('#d6cfc0'));
      const wg = new THREE.CircleGeometry(r - 1, 32); wg.rotateX(-Math.PI / 2); wg.translate(x, 9, y); world.add(new THREE.Mesh(wg, water)); }
    const P = api.POND; if (P) { B.box(P.x - 4, 0, P.y - 4, P.x + P.w + 4, 3, P.y + P.h + 4, C('#8a8f7a')); const wg = new THREE.PlaneGeometry(P.w - 8, P.h - 8, 20, 10); wg.rotateX(-Math.PI / 2); wg.translate(P.x + P.w / 2, 1.5, P.y + P.h / 2); world.add(new THREE.Mesh(wg, water)); }
    world.add(B.mesh(M.concrete, true, true));
    if (fl.length) { // Blueten als Instanzen: Stiel + Bluetenkopf
      const head = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: 0.6, flatShading: true }), fl.length), stem = new THREE.InstancedMesh(new THREE.ConeGeometry(1, 1, 5), new THREE.MeshStandardMaterial({ color: 0x3f8a4a, roughness: 0.8 }), fl.length);
      const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), c = new THREE.Color();
      fl.forEach(([x, y, col, sz], i) => { p.set(x, 7 + sz * 1.6, y); s.set(sz * 0.9, sz * 0.6, sz * 0.9); mm.compose(p, q, s); head.setMatrixAt(i, mm); head.setColorAt(i, c.set(col)); p.set(x, 7 + sz * 0.7, y); s.set(sz * 0.7, sz * 1.6, sz * 0.7); mm.compose(p, q, s); stem.setMatrixAt(i, mm); });
      head.castShadow = stem.castShadow = true; world.add(head, stem); }
  }
  // Besondere Gebaeude: Apotheke-Schild, Casino-Leuchtschrift
  const special = new THREE.Group(); scene.add(special);
  function buildSpecial() {
    const A = api.APO; if (A) { const b = new Batch(); b.box(A.x, 0, A.y, A.x + A.w, 62, A.y + A.h, C('#f2f4f7')); b.box(A.x - 2, 62, A.y - 2, A.x + A.w + 2, 66, A.y + A.h + 2, C('#dde2e8')); b.box(A.x - 1, 44, A.y + A.h - 1, A.x + A.w + 1, 52, A.y + A.h + 1, C('#2e9e5b'));
      b.box(A.x + A.w / 2 - 18, 0, A.y + A.h, A.x + A.w / 2 + 18, 40, A.y + A.h + 2, C('#2e9e5b')); for (let k = 0; k < 12; k++) b.box(A.x + 10 + k * 18.3, 36, A.y + A.h, A.x + 28 + k * 18.3, 42, A.y + A.h + 14, C(k % 2 ? '#2e9e5b' : '#f4f4f8')); special.add(b.mesh(M.wall, true, true));
      const gw = new Batch(); for (const wx of [A.x + 14, A.x + A.w - 94]) gw.box(wx, 6, A.y + A.h, wx + 80, 34, A.y + A.h + 1.5); gw.box(A.x + A.w / 2 - 15, 2, A.y + A.h + 1.5, A.x + A.w / 2 + 15, 36, A.y + A.h + 2.5); const gm = gw.mesh(M.glass); if (gm) special.add(gm); }
    if (A) { const cross = new THREE.Group(); const cm = new THREE.MeshStandardMaterial({ color: 0x2ec864, emissive: new THREE.Color(0x2ec864), emissiveIntensity: 1.2 }); cross.add(new THREE.Mesh(new THREE.BoxGeometry(8, 28, 4), cm)); cross.add(new THREE.Mesh(new THREE.BoxGeometry(28, 8, 4), cm)); cross.position.set(A.x + A.w - 26, 96, A.y + A.h + 3); special.add(cross); }
    const Cs = api.CAS, CI = api.CAS_IN; if (Cs && CI) {
      const cb = new Batch(); cb.box(CI.x0, 0.5, CI.y0, CI.x1, 1.4, CI.y1, C('#6a0e22'));
      for (const t of api.CAS_BJ || []) { cb.box(t.x - 31, 0, t.y - 15, t.x + 31, 22, t.y + 15, C('#5a3418')); cb.box(t.x - 28, 22, t.y - 12, t.x + 28, 23.4, t.y + 12, C('#16703c')); cb.box(t.x - 31, 22, t.y + 12, t.x + 31, 24.5, t.y + 15, C('#7a4a28')); for (let k = 0; k < 3; k++) cb.box(t.x - 14 + k * 9, 23.4, t.y - 4, t.x - 9 + k * 9, 24.2, t.y + 3, C('#f4f4f8')); }
      for (const s of api.CAS_SLOTS || []) { cb.box(s.x - 14, 0, s.y - 18, s.x + 14, 46, s.y + 18, C('#c41a32')); cb.box(s.x + 10, 26, s.y - 11, s.x + 14.5, 40, s.y + 11, C('#f4f4f8')); cb.box(s.x - 14, 46, s.y - 18, s.x + 14, 50, s.y + 18, C('#ffd24a')); }
      const W0 = api.CAS_WHEEL; if (W0) { cb.box(W0.x - 6, 0, W0.y - 30, W0.x + 6, 36, W0.y - 24, C('#2b1a10')); }
      cb.box(5138, 0, 880, 5160, 34, 1030, C('#2b1a10'));
      special.add(cb.mesh(M.wood, true, true));
      if (W0) { const wd = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 4, 24), new THREE.MeshStandardMaterial({ color: 0xffd24a, roughness: 0.4, metalness: 0.3, emissive: new THREE.Color(0xff8a3a), emissiveIntensity: 0.25 })); wd.rotation.x = Math.PI / 2; wd.position.set(W0.x, 46, W0.y - 24); special.add(wd); special.userData.wheel = wd; }
      const dealers = (api.CAS_BJ || []).map((t, i) => ({ id: 'd' + i, x: t.x, y: t.y - 38, ang: Math.PI / 2, step: 0, look: { r: 24, g: 24, b: 30, skin: [1, 3, 0][i], hair: [0, 2, 1][i], hs: [3, 6, 8][i], sex: i === 1 ? 'f' : 'm' } })); special.userData.dealers = dealers;
    }
    if (Cs) { const sign = new THREE.Mesh(new THREE.BoxGeometry(160, 26, 6), new THREE.MeshStandardMaterial({ color: 0xff5ca8, emissive: new THREE.Color(0xff3a8c), emissiveIntensity: 1.6 })); sign.position.set(Cs.x + Cs.w / 2, 64, Cs.y + Cs.h + 4); special.add(sign); special.userData.casSign = sign; }
  }
  // ---------- Figuren (v91: echte 3D-Figuren im Stil der 2D-Figuren, siehe kg3d_fig.js) ----------
  const pools = {}; // name -> Map(id -> group)
  const lastPos = new Map();
  function figPool(name, items) { // items: [{id, x, y, ang, step, look}]
    let P = pools[name]; if (!P) P = pools[name] = new Map(); const seen = new Set(), t = api.gt();
    for (const it of items) {
      let g = P.get(it.id); const k = kit.lookKey(it.look);
      if (g && g.userData.key !== k) { scene.remove(g); g = null; }
      if (!g) { g = kit.makeFigure(it.look || {}); P.set(it.id, g); scene.add(g); }
      const key = name + it.id, lp = lastPos.get(key), moving = it.moving !== undefined ? it.moving : !!(lp && Math.hypot(lp[0] - it.x, lp[1] - it.y) > 0.3); lastPos.set(key, [it.x, it.y]);
      g.visible = true; kit.poseFigure(g, it.x, it.y, it.ang || 0, it.step || 0, t, moving, it.h); seen.add(it.id);
      // Aura aus dem Look (auch bei Freunden und Figuren)
      const au = it.look && it.look.aura && it.look.aura !== 'none' ? it.look.aura : null;
      if (au !== (g.userData.auraId || null)) { if (g.userData.aura) { scene.remove(g.userData.aura); g.userData.aura = null; } g.userData.auraId = au; if (au) { g.userData.aura = kit.makeAura(au); if (g.userData.aura) scene.add(g.userData.aura); } }
      if (g.userData.aura) kit.poseAura(g.userData.aura, it.x, it.y, t);
    }
    for (const [id, g] of P) if (!seen.has(id)) { if (g.userData.aura) scene.remove(g.userData.aura); scene.remove(g); P.delete(id); }
  }
  // Spieler-Extras: Waffe, Fahrrad, Orbit-Begleiter, Spur, Haustiere
  const fx = { wpnId: null, wpn: null, bikeId: null, bike: null, orb: {}, trailId: null, trail: null, pets: {} };
  function playerExtras(dt) {
    const P = pools.player && pools.player.get('me'), x = api.player.x, y = api.player.y, t = api.gt(), E = api.extras();
    // Waffe auf dem Ruecken oder in der Hand
    if (P && E.wpn !== fx.wpnId) { if (fx.wpn && fx.wpn.parent) fx.wpn.parent.remove(fx.wpn); fx.wpn = E.wpn ? kit.weapon(P.userData.body || P, E.wpn) : null; fx.wpnId = E.wpn; }
    if (fx.wpn && P) { if (fx.wpn.parent !== (P.userData.body || P)) { (P.userData.body || P).add(fx.wpn); }
      if (E.inHand) { const sw = E.swing >= 0 ? E.swing : 0; fx.wpn.position.set(8, 12, 4); fx.wpn.rotation.set(1.1 - sw * 2.2, 0, -0.3); } else { fx.wpn.position.set(0, 10, -6.5); fx.wpn.rotation.set(0, 0, 0.75); } }
    if (!P) { fx.wpn = null; fx.wpnId = null; }
    // Fahrrad / Roller
    if (E.bike !== fx.bikeId) { if (fx.bike) scene.remove(fx.bike); fx.bike = E.bike ? kit.makeBike(E.bike) : null; if (fx.bike) scene.add(fx.bike); fx.bikeId = E.bike; }
    if (fx.bike) { fx.bike.position.set(x, 0, y); fx.bike.rotation.y = Math.PI / 2 - api.player.ang; if (P) P.position.y = E.bike === 'scooter' ? 4 : 8; }
    // Orbit-Begleiter (bis zu zwei)
    const want = new Set(E.orbits); for (const id of Object.keys(fx.orb)) if (!want.has(id)) { scene.remove(fx.orb[id]); delete fx.orb[id]; }
    for (const id of want) { if (!fx.orb[id]) { const o = kit.makeOrbit(id); if (o) { scene.add(o); fx.orb[id] = o; } } if (fx.orb[id]) kit.poseOrbit(fx.orb[id], x, y, t); }
    // Spur
    if (E.trail !== fx.trailId) { if (fx.trail) scene.remove(fx.trail); fx.trail = E.trail ? kit.makeTrail(E.trail) : null; if (fx.trail) scene.add(fx.trail); fx.trailId = E.trail; }
    if (fx.trail) kit.poseTrail(fx.trail, x, y, t, dt, E.moving);
    // Haustiere
    const pw = new Set(E.pets.map(p => p.id + '#' + p.n)); for (const k of Object.keys(fx.pets)) if (!pw.has(k)) { scene.remove(fx.pets[k]); delete fx.pets[k]; }
    for (const p of E.pets) { const k = p.id + '#' + p.n; if (!fx.pets[k]) { fx.pets[k] = kit.makePet(p.id); scene.add(fx.pets[k]); } kit.posePet(fx.pets[k], p.x, p.y, p.face, t, p.moving, p.n); }
  }
  // ---------- Fahrzeuge ----------
  const carGeo = { body: new THREE.BoxGeometry(44, 12, 20), cab: new THREE.BoxGeometry(24, 10, 18), wheel: new THREE.CylinderGeometry(4.5, 4.5, 3, 10) }; carGeo.body.translate(0, 9, 0); carGeo.cab.translate(-2, 20, 0); carGeo.wheel.rotateX(Math.PI / 2);
  const glassCar = new THREE.MeshStandardMaterial({ color: 0x1b2a3a, roughness: 0.1, metalness: 0.4 }), tyre = new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.9 });
  function makeCar(col, truck) {
    const g = new THREE.Group(), pm = new THREE.MeshStandardMaterial({ color: col, roughness: 0.35, metalness: 0.55 });
    const b = new THREE.Mesh(carGeo.body, pm); if (truck) b.scale.set(1.4, 1.4, 1.1); g.add(b);
    const c = new THREE.Mesh(carGeo.cab, glassCar); if (truck) { c.position.x = 18; c.scale.set(0.7, 1.4, 1.1); } g.add(c);
    for (const [wx, wz] of [[-14, -10], [14, -10], [-14, 10], [14, 10]]) { const w = new THREE.Mesh(carGeo.wheel, tyre); w.position.set(wx * (truck ? 1.4 : 1), 4.5, wz * (truck ? 1.1 : 1)); g.add(w); }
    const hl = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: new THREE.Color(0xfff2c0), emissiveIntensity: 0 })); hl.position.set(22.5 * (truck ? 1.4 : 1), 10, 0); g.add(hl); g.userData.hl = hl;
    g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g;
  }
  function carPool(name, items) {
    let P = pools[name]; if (!P) P = pools[name] = new Map(); const seen = new Set();
    for (const it of items) { let g = P.get(it.id); if (g && g.userData.col !== it.col + (it.truck ? 't' : '')) { scene.remove(g); g = null; } if (!g) { g = makeCar(it.col, it.truck); g.userData.col = it.col + (it.truck ? 't' : ''); P.set(it.id, g); scene.add(g); } g.position.set(it.x, 0, it.y); g.rotation.y = -it.ang; g.userData.hl.material.emissiveIntensity = nightK > 0.3 ? 2 : 0; seen.add(it.id); }
    for (const [id, g] of P) if (!seen.has(id)) { scene.remove(g); P.delete(id); }
  }
  // Auftrags-Markierungen ueber den Kunden
  const pinGeo = new THREE.ConeGeometry(6, 14, 4); pinGeo.rotateX(Math.PI); const pinMats = {};
  function pinPool(items) { let P = pools.pins; if (!P) P = pools.pins = new Map(); const seen = new Set(); const t = api.gt();
    for (const it of items) { let m = P.get(it.id); if (!m) { if (!pinMats[it.col]) pinMats[it.col] = new THREE.MeshStandardMaterial({ color: it.col, emissive: new THREE.Color(it.col), emissiveIntensity: 0.7 }); m = new THREE.Mesh(pinGeo, pinMats[it.col]); P.set(it.id, m); scene.add(m); } m.position.set(it.x, 60 + Math.sin(t * 3 + it.x) * 3, it.y); m.rotation.y = t * 2; seen.add(it.id); }
    for (const [id, m] of P) if (!seen.has(id)) { scene.remove(m); P.delete(id); } }

  // ---------- Kamera: fest wie in 2D (gleicher Ausschnitt und Mittelpunkt), nur raeumlich ----------
  const PITCH = 0.9, camS = { tx: 0, tz: 0 };
  function placeCamera() {
    const v = api.view(), sp = Math.sin(PITCH), cp = Math.cos(PITCH), D = 2400;
    camS.tx = v.x; camS.tz = v.y;
    camera.left = -v.vw / 2; camera.right = v.vw / 2; camera.top = v.vh / 2 * sp; camera.bottom = -v.vh / 2 * sp; camera.updateProjectionMatrix();
    camera.position.set(v.x, sp * D, v.y + cp * D); camera.lookAt(v.x, 0, v.y);
  }
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  // ---------- Tag und Nacht ----------
  let nightK = 0, envK = 1, envLast = -1; const allMats = () => { const s = new Set(); scene.traverse(o => { if (o.material && !Array.isArray(o.material) && 'envMapIntensity' in o.material) s.add(o.material); }); return s; }; const skyDay = C('#9fc7e6'), skyNight = C('#0b1226'), skyDusk = C('#e0905a'), tmpC = new THREE.Color();
  function lighting(dt) {
    const sk = api.sky(), a = sk.a; nightK = clampN(a / 0.64, 0, 1); const indoor = api.inBuilding(api.player.x, api.player.y);
    const h = api.G ? api.G.time / 60 : 12, sunA = (h - 6) / 12 * Math.PI; // 6 Uhr Aufgang, 18 Uhr Untergang
    const el = Math.max(0.42, Math.sin(sunA)), az = Math.cos(sunA) * 0.8;
    const px = camS.tx, pz = camS.tz, D = 900;
    // Schatten-Kamera folgt dem Spieler, auf Texel gerastert gegen Flimmern
    const step = (SC * 2) / Q.sh, sx = Math.round(px / step) * step, sz = Math.round(pz / step) * step;
    sun.position.set(sx + az * D * 0.7, el * D, sz + D * 0.45); sun.target.position.set(sx, 0, sz); sun.target.updateMatrixWorld();
    const dusk = clampN(1 - Math.abs(Math.sin(sunA)) * 2.2, 0, 1) * (1 - nightK);
    tmpC.copy(skyDay).lerp(skyDusk, dusk * 0.7).lerp(skyNight, nightK); scene.background = tmpC.clone(); scene.fog.color.copy(tmpC); waterU.fogColor.value.copy(tmpC);
    sun.intensity = (1 - nightK) * 2.4 + 0.05; sun.color.setRGB(1, 1 - dusk * 0.25, 1 - dusk * 0.45);
    hemi.intensity = 0.45 + (1 - nightK) * 0.6;
    envK = 1 - nightK * 0.8; if (Math.abs(envK - envLast) > 0.02) { envLast = envK; for (const m of allMats()) m.envMapIntensity = envK; } hemi.color.copy(skyDay).lerp(skyNight, nightK * 0.8);
    amb.intensity = nightK * 0.35 + (indoor ? 0.2 : 0);
    M.glass.emissiveIntensity = nightK * 1.1; M.lampHead.emissiveIntensity = 0.2 + nightK * 2.5; budMat.emissive.setHex(0x3a1a60);
    waterU.uNight.value = nightK; waterU.uSun.value.set(az, el, 0.45); waterU.uSky.value.copy(tmpC).lerp(C('#ffffff'), 0.2);
    // Laternen nahe am Spieler werden zu echten Lichtern
    const L = api.LAMPS; const near = []; for (const l of L) { const d2 = (l.x - px) * (l.x - px) + (l.y - pz) * (l.y - pz); if (d2 < 420 * 420) near.push([d2, l]); } near.sort((a, b) => a[0] - b[0]);
    lampLights.forEach((ll, i) => { const n = near[i]; if (n && nightK > 0.25) { ll.position.set(n[1].x, 54, n[1].y); ll.intensity = (nightK - 0.2) * 4200; } else ll.intensity = 0; });
    playerLight.position.set(api.player.x, 70, api.player.y); playerLight.intensity = indoor ? 5000 : nightK * 1500;
    if (special.userData.casSign) special.userData.casSign.material.emissiveIntensity = 1.2 + Math.sin(api.gt() * 6) * 0.4;
  }

  // ---------- Bilden und Zeichnen ----------
  buildGround(); buildHouses(); buildNature(); buildGardens(); buildWalls(); buildAreas(); buildSpecial();
  let active = true, sigT = 0, W = 0, H = 0;
  function resize() { const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight; if (w === W && h === H) return; W = w; H = h; renderer.setSize(w, h, false); }
  function render(dt) {
    if (!active) return; resize(); dt = Math.min(0.1, dt || 0.016);
    sigT -= dt; if (sigT <= 0) { sigT = 0.8; if (colSig() !== wallSig) buildWalls(); const as = api.areaSig(); if (as !== areaSig) { areaSig = as; buildAreas(); } }
    updatePots(); placeCamera(); lighting(dt); waterU.uT.value = api.gt(); deco.animate(areaGroup, api.gt());
    const p = api.player;
    figPool('player', api.inCar() ? [] : [{ id: 'me', x: p.x, y: p.y, ang: p.ang, step: p.step, look: api.G.look, moving: api.extras().moving }]); playerExtras(dt);
    carPool('mycar', api.inCar() ? [{ id: 'me', x: p.x, y: p.y, ang: p.ang, col: api.myCarCol(), truck: false }] : []);
    figPool('cops', api.cops.filter(c => c.on).map((c, i) => ({ id: i, x: c.x, y: c.y, ang: c.ang, step: c.step || 0, look: api.COP_LOOK })));
    figPool('chars', api.chars());
    figPool('workers', api.workers().map(w => ({ id: w.id, x: w.x, y: w.y, ang: w.ang || 0, step: w.step || 0, look: w.look || { r: 80, g: 160, b: 90, skin: 1, hair: 1, hs: 0 } })));
    figPool('friends', api.friends());
    figPool('gangs', api.gangMembers());
    figPool('guests', api.customers());
    figPool('dealers', special.userData.dealers || []); if (special.userData.wheel) special.userData.wheel.rotation.z = api.gt() * 0.4;
    carPool('traffic', api.traffic.map((c, i) => ({ id: c.id || (c.id = 't' + Math.random().toString(36).slice(2, 8)), x: c.x, y: c.y, ang: c.h ? (c.dir > 0 ? 0 : Math.PI) : (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2), col: c.col, truck: c.truck })));
    carPool('police', api.cars.map((c, i) => ({ id: c.id || (c.id = 'p' + Math.random().toString(36).slice(2, 8)), x: c.x, y: c.y, ang: c.dir > 0 ? 0 : Math.PI, col: '#e8ecf2', truck: false })));
    pinPool(api.orderPins());
    // Raum-Ansicht: im Keller oder einer Etage den Raum zeigen
    renderer.render(scene, camera);
  }
  const v3 = new THREE.Vector3();
  function project(x, y, h) { v3.set(x, h || 0, y).project(camera); if (v3.z > 1) return null; return { x: (v3.x * 0.5 + 0.5) * W, y: (-v3.y * 0.5 + 0.5) * H }; }
  function setActive(on) { active = !!on; canvas.style.display = on ? 'block' : 'none'; }
  function dispose() { active = false; renderer.dispose(); }
  return { render, project, setActive, dispose, yaw: () => 0, renderer, info: () => renderer.info.render };
}
