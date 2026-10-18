// Kellergrün 3D (Beta) – eigenständige 3D-Darstellung mit Three.js (r160, MIT-Lizenz).
// Die Spiellogik bleibt komplett in kellergruen.html. Dieses Modul liest nur den Spielzustand über die
// Schnittstelle "api" und zeichnet ihn räumlich. 2D bleibt als Sicherheitsnetz erhalten.
// Koordinaten: Spiel-x -> three x, Spiel-y -> three z, Höhe -> three y (1 Einheit = 1 Spiel-Pixel).
import * as THREE from './three.module.min.js';
import { figureKit } from './kg3d_fig.js';
import { decoKit } from './kg3d_deco.js';
import { plantsKit } from './kg3d_plants.js';

export const VERSION = 2;

export function create(api, canvas, opts) {
  opts = opts || {};
  const Q = { low: { pr: 1, sh: 1024, aa: false, lamps: 2, out: false }, mid: { pr: 1.75, sh: 2048, aa: true, lamps: 4, out: true }, high: { pr: 2, sh: 2048, aa: true, lamps: 6, out: true } }[opts.quality || 'mid'] || { pr: 1.75, sh: 2048, aa: true, lamps: 4, out: true };
  const TOON = opts.toon !== false; // v93: Cartoon-Look (Toon-Shading, kraeftige Farben, Umrisse)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: Q.aa, powerPreference: 'high-performance', alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Q.pr));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  if (TOON) { renderer.toneMapping = THREE.NoToneMapping; } else { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; }
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-200, 200, 150, -150, 1, 6000); // v91: feste Kamera wie in 2D (leicht schraeg von oben)
  const kit = figureKit(THREE, api), deco = decoKit(THREE, api);
  let plants = null; // nach Batch-Definition gesetzt
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
  // ---------- v93: Cartoon-Look: Toon-Materialien mit 3 Lichtstufen und dunkle Umrisse (Inverted Hull) ----------
  const gradTex = (() => { const d = new Uint8Array([150, 150, 150, 255, 205, 205, 205, 255, 242, 242, 242, 255, 255, 255, 255, 255]); const t = new THREE.DataTexture(d, 4, 1); t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t; })();
  const toonMap = new Map(), toonList = [];
  function toonMat(m) {
    if (!m || !m.isMeshStandardMaterial) return m; let t = toonMap.get(m); if (t) return t;
    t = new THREE.MeshToonMaterial({ color: m.color.clone(), vertexColors: m.vertexColors, map: m.map, gradientMap: gradTex, emissive: m.emissive.clone(), emissiveIntensity: m.emissiveIntensity, transparent: m.transparent, opacity: m.opacity, side: m.side, depthWrite: m.depthWrite, alphaTest: m.alphaTest });
    if (m.metalness > 0.45) t.color.offsetHSL(0, 0, 0.08); // Metall ohne Spiegelung etwas heller
    toonMap.set(m, t); toonList.push([m, t]); return t;
  }
  const outMats = new Map();
  function outMat(th) { const k = th.toFixed(3); if (outMats.has(k)) return outMats.get(k); const m = new THREE.MeshBasicMaterial({ color: 0x1b1f27, side: THREE.BackSide });
    m.onBeforeCompile = sh => { sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed += normalize(normal) * ' + th.toFixed(3) + ';'); }; m.customProgramCacheKey = () => 'kgout' + k; outMats.set(k, m); return m; }
  function addOutline(o, th) {
    if (!TOON || !Q.out || !o.isMesh || o.userData.isOut || o.userData.out) return; const m = outMat(th); let r;
    if (o.isInstancedMesh) { r = new THREE.InstancedMesh(o.geometry, m, o.count); r.instanceMatrix = o.instanceMatrix; } else r = new THREE.Mesh(o.geometry, m);
    r.userData.isOut = true; r.castShadow = r.receiveShadow = false; r.frustumCulled = o.frustumCulled; r.raycast = () => {}; o.add(r); o.userData.out = r;
  }
  // Wandelt alles unter root in Toon-Materialien um; Meshes mit userData.ol bekommen einen Umriss dieser Dicke
  function cartoon(root, olAll) {
    if (!TOON || !root) return; const list = [];
    root.traverse(o => { if (!o.isMesh || o.userData.isOut) return; if (!(o.material && o.material.isShaderMaterial)) o.material = Array.isArray(o.material) ? o.material.map(toonMat) : toonMat(o.material);
      const th = o.userData.ol || olAll; if (th && !(o.material && o.material.transparent) && !o.isPoints) list.push([o, th]); });
    for (const [o, th] of list) addOutline(o, th);
  }
  function syncToon() { for (const [m, t] of toonList) { if (t.emissiveIntensity !== m.emissiveIntensity) t.emissiveIntensity = m.emissiveIntensity; if (t.opacity !== m.opacity) t.opacity = m.opacity; if (!t.color.equals(m.color)) t.color.copy(m.color); if (!t.emissive.equals(m.emissive)) t.emissive.copy(m.emissive); } }
  const olTag = (m, th) => { if (m) m.userData.ol = th; return m; };

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
  const nGrass = noiseCanvas(128, 0, 0, 7, (x, y, v) => (TOON ? 228 : 150) + (v - 0.5) * (TOON ? 55 : 140)), nAsph = noiseCanvas(128, 0, 0, 11, (x, y, v) => (TOON ? 225 : 128) + (v - 0.5) * (TOON ? 40 : 120));
  const nTile = noiseCanvas(128, 0, 0, 5, (x, y, v) => ((x % 32 < 2) || (y % 32 < 2) ? (TOON ? 170 : 60) : (TOON ? 240 : 170)) + (v - 0.5) * (TOON ? 20 : 50));
  const nWall = noiseCanvas(128, 0, 0, 3, (x, y, v) => ((y % 16 < 1.5) || ((x + (Math.floor(y / 16) % 2) * 16) % 32 < 1.5) ? 90 : 165) + (v - 0.5) * 40);
  const nRoof = noiseCanvas(128, 0, 0, 9, (x, y, v) => (y % 12 < 2 ? 70 : 160 + ((x + (Math.floor(y / 12) % 2) * 8) % 16 < 1.5 ? -60 : 0)) + (v - 0.5) * 30);
  const T = {
    grassMap: tex(nGrass.c, 1, true), grassN: tex(normalFrom(nGrass, 3)), asphMap: tex(nAsph.c, 1, true), asphN: tex(normalFrom(nAsph, 2)),
    tileN: tex(normalFrom(nTile, 4)), wallN: tex(normalFrom(nWall, 3)), roofN: tex(normalFrom(nRoof, 5)), tileMap: tex(nTile.c, 1, true)
  };
  // Welt-UVs: Texturen wiederholen sich gleichmaessig, egal wie gross ein Teil ist
  const UVS = 1 / 64;
  // ---------- Geometrie zusammenfassen (wenige Draw Calls) ----------
  const _hsl = { h: 0, s: 0, l: 0 };
  class Batch {
    constructor() { this.p = []; this.n = []; this.c = []; this.u = []; }
    addGeo(g, m4, col) {
      g = g.index ? g.toNonIndexed() : g; if (m4) g.applyMatrix4(m4);
      if (col && TOON) { col = col.clone(); col.getHSL(_hsl); col.setHSL(_hsl.h, Math.min(1, _hsl.s * 1.3 + 0.04), Math.min(0.94, _hsl.l * 1.07 + 0.01)); }
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
  plants = plantsKit(THREE, Batch);
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
  const waterU = { uT: { value: 0 }, uDeep: { value: C('#1d5a86') }, uSky: { value: C('#9fd3f0') }, uSun: { value: new THREE.Vector3(0.4, 0.8, 0.3) }, uNight: { value: 0 }, fogColor: { value: C('#9fb8c8') }, fogNear: { value: 2600 }, fogFar: { value: 6000 } };
  // v92: neues Wasser: Stroemung, weiche Wellen aus Rauschen, flaches Ufer heller, Schaum an den Kanten, Glitzern
  const WATER_VS = `uniform float uT; varying vec3 vW; #include <fog_pars_vertex>
      void main(){ vec3 p = position; vec4 wp0 = modelMatrix*vec4(p,1.0); p.y += sin(wp0.x*0.05+uT*1.4)*0.6 + sin(wp0.z*0.08-uT*1.0)*0.4;
        vec4 wp = modelMatrix*vec4(p,1.0); vW = wp.xyz; vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition; #include <fog_vertex> }`;
  const WATER_FS = `uniform vec3 uDeep; uniform vec3 uShal; uniform vec3 uSky; uniform vec3 uSun; uniform float uNight; uniform float uT; uniform vec4 uRect; uniform vec3 uCirc; uniform vec2 uFlow; uniform float uEdge;
      varying vec3 vW; #include <fog_pars_fragment>
      float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
      float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int k = 0; k < 4; k++) { s += a*vn(p); p = p*2.03 + vec2(17.1, 9.2); a *= 0.5; } return s; }
      float hgt(vec2 p){ vec2 fl = uFlow*uT; return fbm(p*0.035 - fl*0.035) * 0.65 + fbm(p*0.09 + vec2(fl.y, -fl.x)*0.05 - fl*0.08) * 0.35; }
      void main(){
        vec2 P = vW.xz; float e = 0.9; float h0 = hgt(P), hx = hgt(P + vec2(e, 0.0)), hz = hgt(P + vec2(0.0, e));
        vec3 N = normalize(vec3((h0 - hx) * 9.0, 1.0, (h0 - hz) * 9.0));
        float d = uCirc.z > 0.0 ? uCirc.z - length(P - uCirc.xy) : min(min(P.x - uRect.x, uRect.z - P.x), min(P.y - uRect.y, uRect.w - P.y));
        float sh = 1.0 - smoothstep(0.0, uEdge, d);
        vec3 V = normalize(cameraPosition - vW); float fr = pow(1.0 - max(dot(N, V), 0.0), 4.0);
        vec3 col = mix(uDeep, uShal, sh * 0.85);
        col = mix(col, uSky, 0.18 + fr * 0.55);
        float cau = smoothstep(0.55, 0.85, fbm(P*0.12 + uFlow*uT*0.15 + h0*2.0)); col += uShal * cau * 0.18 * (1.0 - uNight);
        vec3 H = normalize(normalize(uSun) + V); float sp = pow(max(dot(N, H), 0.0), 180.0) * (1.0 - uNight);
        float gl = step(0.985, h21(floor(P*0.6 + uFlow*uT*0.3))) * step(0.62, h0) * (1.0 - uNight);
        col += vec3(1.0, 0.96, 0.85) * (sp * 1.8 + gl * 0.9);
        float fo = smoothstep(uEdge * 0.22, 0.0, d) * (0.55 + 0.45 * vn(P*0.25 + uFlow*uT*0.4)); fo += smoothstep(0.78, 0.92, fbm(P*0.07 - uFlow*uT*0.07)) * 0.25 * sh;
        col = mix(col, vec3(0.93, 0.97, 1.0), clamp(fo, 0.0, 0.85));
        col *= mix(1.0, 0.32, uNight); col += vec3(1.0, 0.8, 0.5) * sp * uNight * 0.0;
        gl_FragColor = vec4(col, mix(0.9, 0.62, sh * (1.0 - fo))); #include <tonemapping_fragment> #include <colorspace_fragment> #include <fog_fragment> }`;
  const nl = s => s.replace(/#include <(\w+)>/g, '\n#include <$1>\n');
  function makeWater(o) {
    const u = Object.assign({}, waterU, { uShal: { value: C(o.shal || '#3fa6a0') }, uDeep: { value: C(o.deep || '#1b4f78') }, uRect: { value: new THREE.Vector4(...(o.rect || [0, 0, 0, 0])) }, uCirc: { value: new THREE.Vector3(...(o.circ || [0, 0, 0])) }, uFlow: { value: new THREE.Vector2(...(o.flow || [0, 0])) }, uEdge: { value: o.edge || 30 } });
    return new THREE.ShaderMaterial({ uniforms: u, fog: true, vertexShader: nl(WATER_VS), fragmentShader: nl(WATER_FS), transparent: true, depthWrite: false });
  }
  const water = makeWater({ rect: [-4000, api.RIVER.y0, 99999, api.RIVER.y1], flow: [22, 0], edge: 42 });

  // ---------- Statische Welt ----------
  const world = new THREE.Group(); scene.add(world);
  let wallMesh = null, wallSig = '';
  const G0 = () => api.G;
  const SWC = TOON ? '#c4cad2' : '#9aa0a8', RDC = TOON ? '#4c525c' : '#3a3e45';
  function buildGround() {
    const WW = api.WW, WH = api.WH;
    const Y0 = api.YMIN || 0; const gb = new Batch(); gb.box(-3000, -2, Y0 - 400, WW + 400, 0, WH + 400, C(TOON ? '#4a7f3d' : '#3b6638'));
    const zc = TOON ? { park: '#558f45', garden: '#4c8540', lot: '#7a808a', skate: '#9aa2ac', play: '#c9a866', pitch: '#47964e', dog: '#528c42', allot: '#5a9649' } : { park: '#3f7040', garden: '#355e36', lot: '#4a4f57', skate: '#6a7078', play: '#8a6a4a', pitch: '#3b8146', dog: '#3f6d39', allot: '#467d47' };
    for (const z of api.GROUNDS) { const col = zc[z.t] || '#3b6638'; const tgt = (z.t === 'lot' || z.t === 'skate') ? null : gb; if (tgt) tgt.box(z.x, 0, z.y, z.x + z.w, 0.4, z.y + z.h, C(col)); }
    const g = gb.mesh(M.grass, false, true); world.add(g);
    // befestigte Flaechen (Parkplaetze, Skaterpark): Beton
    const cb = new Batch(); for (const z of api.GROUNDS) if (z.t === 'lot' || z.t === 'skate') cb.box(z.x, 0, z.y, z.x + z.w, 0.6, z.y + z.h, C(z.t === 'lot' ? '#5a5f68' : '#7a8088'));
    // Gehwege an allen Strassen
    const SW = api.SW; for (const r of api.RD) { if (r.h) { cb.box(0, 0, r.c0 - SW, WW, 2.2, r.c0, C(SWC)); cb.box(0, 0, r.c1, WW, 2.2, r.c1 + SW, C(SWC)); } else { cb.box(r.c0 - SW, 0, Y0, r.c0, 2.2, WH, C(SWC)); cb.box(r.c1, 0, Y0, r.c1 + SW, 2.2, WH, C(SWC)); } }
    const RV = api.RIVER; cb.box(0, 0, api.UFER_N - 22, WW, 1.6, RV.y0, C('#b4a88a')); cb.box(0, 0, RV.y1, WW, 1.6, api.UFER_S + 22, C('#b4a88a'));
    world.add(cb.mesh(M.concrete, false, true));
    // Fahrbahnen
    const ab = new Batch(); for (const r of api.RD) { if (r.h) ab.box(0, 0, r.c0, WW, 0.9, r.c1, C(RDC)); else ab.box(r.c0, 0, Y0, r.c1, 0.95, WH, C(RDC)); }
    world.add(ab.mesh(M.asphalt, false, true));
    // Fahrbahnmarkierungen
    const mb = new Batch(); for (const r of api.RD) { const mid = (r.c0 + r.c1) / 2; if (r.h) { for (let x = 20; x < WW; x += 70) mb.box(x, 0.95, mid - 1.5, x + 36, 1.15, mid + 1.5, C('#e8e2c8')); } else { for (let y = Y0 + 20; y < WH; y += 70) mb.box(mid - 1.5, 1.0, y, mid + 1.5, 1.2, y + 36, C('#e8e2c8')); } }
    world.add(mb.mesh(M.plain, false, true));
    // Fluss: Bett und Wasser
    const bed = new Batch(); bed.box(-3000, -14, RV.y0, WW + 400, -10, RV.y1, C('#22313a'));
    for (let k = 0; k < 4; k++) { const st = 6 + k * 7, yy = -6 - k * 1.8, cc = C(['#7d7a62', '#5f6250', '#47504a', '#34413f'][k]); bed.box(-3000, yy - 2, RV.y0, WW + 400, yy, RV.y0 + st, cc); bed.box(-3000, yy - 2, RV.y1 - st, WW + 400, yy, RV.y1, cc); } // flaches Ufer unter Wasser
    riverDeco(RV); bed.box(0, -12, RV.y0 - 4, WW, 1.6, RV.y0, C('#6b6f74')); bed.box(0, -12, RV.y1, WW, 1.6, RV.y1 + 4, C('#6b6f74')); world.add(bed.mesh(M.concrete, false, true));
    const wg = new THREE.PlaneGeometry(WW, RV.y1 - RV.y0, 160, 6); wg.rotateX(-Math.PI / 2); wg.translate(WW / 2, -3, (RV.y0 + RV.y1) / 2); const wm = new THREE.Mesh(wg, water); world.add(wm);
    // Bruecken
    const br = new Batch(); for (const b of api.ALLB) { br.box(b.x0, 0, b.y0, b.x1, 3, b.y1, C(b.road ? '#5a5f66' : '#8a6a4a')); br.box(b.x0, 3, b.y0, b.x0 + 3, 12, b.y1, C('#9aa3ad')); br.box(b.x1 - 3, 3, b.y0, b.x1, 12, b.y1, C('#9aa3ad')); }
    const bm = br.mesh(M.wood, true, true); world.add(bm);
  }
  // v92: Steine, Schilf und Seerosen an Fluss und Teich
  const rockM = new THREE.MeshStandardMaterial({ roughness: 0.9, flatShading: true }), reedM = new THREE.MeshStandardMaterial({ roughness: 0.8 }), cattM = new THREE.MeshStandardMaterial({ color: 0x5a3a22, roughness: 0.9 });
  function scatter(list) { // list: [{t:'rock'|'reed'|'lily', x, z, s, r}]
    const by = { rock: [], reed: [], lily: [], cat: [] }; for (const o of list) by[o.t].push(o);
    const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3(), c = new THREE.Color(), eu = new THREE.Euler();
    const inst = (geo, mat, arr, f, shadow) => { if (!arr.length) return; const im = new THREE.InstancedMesh(geo, mat, arr.length); arr.forEach((o, i) => { f(o); mm.compose(pv, q, sv); im.setMatrixAt(i, mm); if (o.c) im.setColorAt(i, c.set(o.c)); }); im.castShadow = !!shadow; im.receiveShadow = true; world.add(im); };
    inst(new THREE.DodecahedronGeometry(1, 0), rockM, by.rock, o => { pv.set(o.x, o.y || 0, o.z); q.setFromEuler(eu.set(o.r, o.r * 2, o.r * 0.5)); sv.set(o.s, o.s * 0.6, o.s * 0.85); }, true);
    inst(new THREE.ConeGeometry(0.6, 1, 4).translate(0, 0.5, 0), reedM, by.reed, o => { pv.set(o.x, o.y || 0, o.z); q.setFromEuler(eu.set(Math.sin(o.r) * 0.25, o.r, Math.cos(o.r) * 0.25)); sv.set(o.s * 0.12, o.s, o.s * 0.12); }, true);
    inst(new THREE.CylinderGeometry(0.9, 0.9, 1.2, 6).translate(0, 0.6, 0), cattM, by.cat, o => { pv.set(o.x, (o.y || 0) + o.s * 0.8, o.z); q.identity(); sv.set(1.1, o.s * 0.16, 1.1); });
    inst(new THREE.CylinderGeometry(1, 1, 0.4, 10, 1, false, 0.4, Math.PI * 1.8), new THREE.MeshStandardMaterial({ color: 0x3f8a3a, roughness: 0.6 }), by.lily, o => { pv.set(o.x, o.y, o.z); q.setFromEuler(eu.set(0, o.r, 0)); sv.set(o.s, 1, o.s); });
  }
  const rnd = (seed => () => (seed = (seed * 16807) % 2147483647) / 2147483647)(12345);
  function riverDeco(RV) {
    const L = [], onBridge = x => api.ALLB.some(b => x > b.x0 - 20 && x < b.x1 + 20);
    for (let x = 10; x < api.WW; x += 14 + rnd() * 26) { if (onBridge(x)) continue;
      for (const side of [0, 1]) { const z = side ? RV.y1 + 1 + rnd() * 6 : RV.y0 - 1 - rnd() * 6, s = 3 + rnd() * 5; if (rnd() < 0.55) L.push({ t: 'rock', x: x + rnd() * 8, z, y: 0.5, s, r: rnd() * 6, c: ['#8a8c88', '#7a7d78', '#9a968c', '#6e716c'][Math.floor(rnd() * 4)] });
        if (rnd() < 0.18) { const cx = x + rnd() * 10, cz = side ? RV.y1 - 3 - rnd() * 8 : RV.y0 + 3 + rnd() * 8; for (let k = 0; k < 7; k++) { const rx = cx + (rnd() - 0.5) * 12, rz = cz + (rnd() - 0.5) * 8, hh = 12 + rnd() * 12; L.push({ t: 'reed', x: rx, z: rz, y: -6, s: hh, r: rnd() * 6, c: rnd() < 0.5 ? '#6c8a3a' : '#88a04a' }); if (k < 2) L.push({ t: 'cat', x: rx, z: rz, y: -6, s: hh }); } } } }
    const P = api.POND; if (P) { for (let a = 0; a < Math.PI * 2; a += 0.11) { const x = P.x + P.w / 2 + Math.cos(a) * (P.w / 2 + 1), z = P.y + P.h / 2 + Math.sin(a) * (P.h / 2 + 1); const cx = Math.max(P.x - 2, Math.min(P.x + P.w + 2, x)), cz = Math.max(P.y - 2, Math.min(P.y + P.h + 2, z)); L.push({ t: 'rock', x: cx, z: cz, y: 2, s: 4 + rnd() * 4, r: rnd() * 6, c: ['#9a968c', '#86887f', '#a8a294'][Math.floor(rnd() * 3)] }); }
      for (let k = 0; k < 14; k++) L.push({ t: 'lily', x: P.x + 24 + rnd() * (P.w - 48), z: P.y + 20 + rnd() * (P.h - 40), y: 1.9, s: 4 + rnd() * 4, r: rnd() * 6 });
      for (let k = 0; k < 3; k++) { const cx = P.x + 14 + k * (P.w - 28) / 2, cz = P.y + (k === 1 ? P.h - 12 : 12); for (let j = 0; j < 8; j++) { const rx = cx + (rnd() - 0.5) * 16, rz = cz + (rnd() - 0.5) * 8, hh = 14 + rnd() * 10; L.push({ t: 'reed', x: rx, z: rz, y: 0, s: hh, r: rnd() * 6, c: '#6c8a3a' }); if (j < 2) L.push({ t: 'cat', x: rx, z: rz, y: 0, s: hh }); } } }
    scatter(L);
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
    world.add(olTag(wb.mesh(M.wall, true, true), 1.1)); world.add(olTag(rb.mesh(M.roof, true, true), 1.1)); const gm = gl.mesh(M.glass, false, false); if (gm) { gm.material = M.glass; world.add(gm); } world.add(db.mesh(M.wood, true, true)); world.add(tb.mesh(M.wall, true, true));
  }
  // Baeume, Buesche, Laternen als Instanzen
  let treeParts = null;
  const SEA_TREE = [['#1F4A32', '#2C6844', '#3C8A58'], ['#1E5530', '#2F7A44', '#4AA462'], ['#6A3418', '#B0581C', '#E09A2E'], ['#2E3A40', '#45535A', '#E8EEF4']], PINE_COL = [['#1c4030', '#25503a'], ['#1c4a30', '#286040'], ['#22442e', '#2e5a3e'], ['#2a4038', '#dde6ee']];
  function updateTrees() {
    if (!treeParts) return; const si = api.season ? api.season() : -1, k = si < 0 ? 1 : si; if (treeParts.season === k) return; treeParts.season = k;
    const c = new THREE.Color(), pal = SEA_TREE[k], pp = PINE_COL[k];
    for (const [idx, part, r] of treeParts.leafSlots) { c.set(pal[part === 0 ? 1 : part >= 4 ? 2 : 0]).offsetHSL((r - 0.5) * 0.03, TOON ? 0.08 : 0, (r - 0.5) * 0.06 + (TOON ? 0.1 : 0)); treeParts.leaf.setColorAt(idx, c); }
    for (let i = 0; i < treeParts.nPine; i++) { c.set(k === 3 && i % 4 === 3 ? pp[1] : pp[i % 2 && k !== 3 ? 1 : 0]); if (TOON && !(k === 3 && i % 4 === 3)) c.offsetHSL(0, 0.06, 0.08); treeParts.pine.setColorAt(i, c); }
    if (treeParts.leaf.instanceColor) treeParts.leaf.instanceColor.needsUpdate = true; if (treeParts.pine.instanceColor) treeParts.pine.instanceColor.needsUpdate = true;
  }
  let lampHeads = null;
  function buildNature() {
    // v92: detailliertere Baeume: Stamm mit Wurzelansatz und Aesten, Laubbaeume aus 6 weichen Kronenballen, dazu Nadelbaeume; Farben je Jahreszeit
    const trees = api.TREES, n = trees.length, m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color(), eu = new THREE.Euler();
    const hs = t => ((t[0] * 13 + t[1] * 7) % 100) / 100, isPine = t => ((t[0] * 3 + t[1] * 11) % 10) < 3;
    const trunkG = new THREE.CylinderGeometry(2.6, 4.2, 32, 8); trunkG.translate(0, 16, 0); const rootG = new THREE.ConeGeometry(7, 6, 8); rootG.translate(0, 3, 0);
    const branchG = new THREE.CylinderGeometry(0.8, 1.6, 16, 5); branchG.translate(0, 8, 0);
    const barkM = new THREE.MeshStandardMaterial({ color: 0x6b4a32, roughness: 0.95, normalMap: T.wallN, normalScale: new THREE.Vector2(0.8, 0.8) });
    const leafG = new THREE.IcosahedronGeometry(1, 3); { const pa = leafG.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), k = 1 + 0.13 * Math.sin(x * 7.1 + y * 5.3) * Math.cos(z * 6.7 - y * 3.1); pa.setXYZ(i, x * k, y * k, z * k); } leafG.computeVertexNormals(); }
    const pineG = new THREE.ConeGeometry(1, 1, 9); pineG.translate(0, 0.5, 0);
    const deci = trees.filter(t => !isPine(t)), pines = trees.filter(isPine);
    const trunk = new THREE.InstancedMesh(trunkG, barkM, n), root = new THREE.InstancedMesh(rootG, barkM, n), branch = new THREE.InstancedMesh(branchG, barkM, deci.length * 3);
    const leaf = new THREE.InstancedMesh(leafG, new THREE.MeshStandardMaterial({ roughness: 0.82 }), deci.length * 6), pine = new THREE.InstancedMesh(pineG, new THREE.MeshStandardMaterial({ roughness: 0.85, flatShading: true }), pines.length * 4);
    trees.forEach((t, i) => { const r = hs(t), sc = 0.85 + r * 0.35, pn = isPine(t); q.setFromEuler(eu.set(0, r * 6, 0)); p.set(t[0], 0, t[1] + 12); s.set(sc, sc * (pn ? 1.15 : 1), sc); m.compose(p, q, s); trunk.setMatrixAt(i, m); s.set(sc, sc, sc); m.compose(p, q, s); root.setMatrixAt(i, m); });
    const leafSlots = [];
    deci.forEach((t, i) => { const r = hs(t), sc = 0.85 + r * 0.35, bx = t[0], bz = t[1] + 12;
      for (let k = 0; k < 3; k++) { const a = r * 6 + k * 2.1; q.setFromEuler(eu.set(Math.cos(a) * 0.75, 0, Math.sin(a) * 0.75)); p.set(bx, 22 * sc, bz); s.set(sc, sc, sc); m.compose(p, q, s); branch.setMatrixAt(i * 3 + k, m); }
      const P6 = [[0, 44, 0, 21], [-11, 38, 6, 15], [12, 39, -3, 15], [3, 37, 12, 14], [-4, 52, -6, 14], [6, 56, 4, 11]];
      P6.forEach(([dx, dy, dz, rr], k) => { q.setFromEuler(eu.set(r * k, r * 6 + k, 0)); p.set(bx + dx * sc, dy * sc, bz + dz * sc); const w = rr * sc * (0.9 + ((k * 37 + i) % 10) / 50); s.set(w, w * 0.86, w); m.compose(p, q, s); leaf.setMatrixAt(i * 6 + k, m); leafSlots.push([i * 6 + k, k, r]); }); });
    pines.forEach((t, i) => { const r = hs(t), sc = 0.85 + r * 0.35, bx = t[0], bz = t[1] + 12; for (let k = 0; k < 4; k++) { q.setFromEuler(eu.set(0, r * 6 + k, 0)); p.set(bx, (20 + k * 13) * sc, bz); const w = (22 - k * 4.8) * sc; s.set(w, (24 - k * 2) * sc, w); m.compose(p, q, s); pine.setMatrixAt(i * 4 + k, m); } });
    for (const im of [trunk, root, branch, leaf, pine]) { im.castShadow = true; im.receiveShadow = true; world.add(im); } olTag(trunk, 0.8); olTag(leaf, 0.07); olTag(pine, 0.05);
    treeParts = { leaf, pine, leafSlots, nPine: pines.length * 4, season: -9 }; updateTrees(); q.identity();
    const bush = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), new THREE.MeshStandardMaterial({ roughness: 0.85 }), api.bushes.length);
    api.bushes.forEach((b, i) => { p.set(b.x, b.r * 0.5, b.y); s.set(b.r, b.r * 0.75, b.r); m.compose(p, q, s); bush.setMatrixAt(i, m); col.setHSL(0.3, 0.4, 0.2 + (i % 5) * 0.02); bush.setColorAt(i, col); });
    bush.castShadow = true; bush.receiveShadow = true; world.add(bush); olTag(bush, 0.1);
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
    const stationPts = []; for (const ar of api.areasNow()) { for (const P of ar.POTS) stationPts.push([P.x, P.y]); if (ar.RACK) stationPts.push([ar.RACK.x, ar.RACK.y]); if (ar.TABLE) stationPts.push([ar.TABLE.x, ar.TABLE.y]); }
    const furn = new Set([api.KIOSK, api.STALL].filter(Boolean).map(r => r.x + ':' + r.y + ':' + r.w).concat((api.BENCHES || []).map(b => (b.x - b.w / 2) + ':' + (b.y - b.h / 2) + ':' + b.w))); // v92: eigene Modelle

    for (const c of api.colliders) {
      if (c.fl !== undefined || c.river || c.water || c.x < -50) continue;
      if (skip.has(c.x + ':' + c.y) || treeSet.has(c.x + ':' + c.y) || own.has(c)) continue;
      if (furn.has(c.x + ':' + c.y + ':' + c.w)) continue;
      { const cx = c.x + c.w / 2, cy = c.y + c.h / 2; if (stationPts.some(q => Math.abs(q[0] - cx) < 14 && Math.abs(q[1] - cy) < 14)) continue; } // v92: Toepfe, Gestell, Tisch baut buildAreas
      if (api.HALFPIPE && c.x === api.HALFPIPE.x && c.y === api.HALFPIPE.y) continue; if ((api.GRAFF || []).some(g => g.x === c.x && g.y === c.y)) continue; // Skaterpark baut buildSkate
      if (A && c.x === A.x && c.y === A.y && c.w === A.w) continue; // Apotheke baut buildSpecial
      if (api.FOUNTAIN && Math.abs(c.x + c.w / 2 - api.FOUNTAIN.x) < 50 && Math.abs(c.y + c.h / 2 - api.FOUNTAIN.y) < 50) continue;
      if (api.FG && c.x >= api.FG.x && c.x + c.w <= api.FG.x + api.FG.w && c.y + c.h <= api.FG.h) continue; // Garten zeichnet buildGardens
      const isWall = inside.some(r => c.x >= r.x0 - 20 && c.x + c.w <= r.x1 + 20 && c.y >= r.y0 - 20 && c.y + c.h <= r.y1 + 20 && (c.w <= 16 || c.h <= 16));
      const big = c.w * c.h > 30000, ht = isWall ? 46 : big ? 70 : c.w < 20 || c.h < 20 ? 22 : 30;
      const col = isWall ? '#d8d2c4' : big ? '#8d97a3' : '#7a6a5a';
      wb.box(c.x, 0, c.y, c.x + c.w, ht, c.y + c.h, C(col));
      if (isWall) wb.box(c.x - 0.5, ht, c.y - 0.5, c.x + c.w + 0.5, ht + 2, c.y + c.h + 0.5, C('#efe8da'));
    }
    wallMesh = wb.mesh(M.wall, true, true); if (wallMesh) { world.add(wallMesh); olTag(wallMesh, 1); cartoon(wallMesh); } wallSig = colSig();
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
      // Gestell und Tisch (im Labor eigene Einrichtung)
      const R = ar.RACK, Tb = ar.TABLE, lab = ar.key === 'brau';
      if (lab) { const lf = plants.labFurniture(R, Tb); lf.children.forEach(m => { if (!m.material.transparent) olTag(m, 0.5); }); areaGroup.add(lf); } else {
      if (R) { fur.box(R.x - 60, 0, R.y - 22, R.x + 60, 4, R.y + 22, C('#4a505a')); for (const k of [-1, 1]) fur.box(R.x + k * 56 - 3, 0, R.y - 22, R.x + k * 56 + 3, 52, R.y + 22, C('#8c96a3')); for (let s = 0; s < 3; s++) fur.box(R.x - 58, 16 + s * 14, R.y - 20, R.x + 58, 17.5 + s * 14, R.y + 20, C('#b5bdc7')); }
      if (Tb) { fur.box(Tb.x - 60, 0, Tb.y - 20, Tb.x + 60, 26, Tb.y + 20, C(ar.key === 'tabak' ? '#7a6448' : ar.key === 'brau' ? '#4a5562' : '#5e646e')); fur.box(Tb.x - 58, 26, Tb.y - 18, Tb.x + 58, 28, Tb.y + 18, C(ar.key === 'brau' ? '#aeb8c4' : '#7c838e')); }
      }
      // v92: Toepfe als ein Netz je Raum, Pflanzen als echte 3D-Modelle (Instanzen)
      const slots = [], idx = [], pb = new Batch();
      for (let i = 0; i < ar.POTS.length; i++) {
        const P = ar.POTS[i], open = i < ar.nOpen; if (!open) { fb.box(P.x - 16, 1.2, P.y - 16, P.x + 16, 1.8, P.y + 16, C('#262a30')); continue; }
        if (!lab) { pb.addGeo(potGeo.clone(), new THREE.Matrix4().makeTranslation(P.x, 0, P.y), C(ar.key === 'tabak' ? '#a8683e' : '#b4643c')); pb.addGeo(new THREE.TorusGeometry(14.6, 1.3, 6, 18).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(P.x, 17.6, P.y), C('#c27448')); pb.addGeo(soilGeo.clone(), new THREE.Matrix4().makeTranslation(P.x, 17, P.y), C('#3a2a1e')); }
        slots.push({ x: P.x, y: P.y }); idx.push(i);
      }
      const pm = olTag(pb.mesh(M.plain, true, true), 0.6); if (pm) areaGroup.add(pm);
      const pk = plants.build(lab ? 'lab' : ar.key === 'tabak' ? 'tabak' : 'weed', slots); areaGroup.add(pk.grp); potObjs.push({ pk, ar: ar.key, idx });
    }
    const fm = fb.mesh(M.floorIn, false, true); if (fm) areaGroup.add(fm); const um = fur.mesh(M.metal, true, true); if (um) areaGroup.add(um);
    for (const ar of api.areasNow()) if (ar.open) { const d = deco.buildArea(api.decItems(ar.key)); if (d) { cartoon(d.grp || d, 0.45); areaGroup.add(d.grp || d); } } // v91: Deko in 3D
    cartoon(areaGroup);
  }
  const potGeo = new THREE.CylinderGeometry(15, 11, 18, 14); potGeo.translate(0, 9, 0);
  const soilGeo = new THREE.CylinderGeometry(13.5, 13.5, 1.5, 14);
  const leafGeo = new THREE.ConeGeometry(4, 22, 5); const budGeo = new THREE.ConeGeometry(5, 14, 6);
  const potMat = new THREE.MeshStandardMaterial({ color: 0xb4643c, roughness: 0.8 }), potMatLab = new THREE.MeshStandardMaterial({ color: 0xe8ecf2, roughness: 0.25, metalness: 0.3 });
  const soilMat = new THREE.MeshStandardMaterial({ color: 0x3a2a1e, roughness: 1 });
  const leafMats = [new THREE.MeshStandardMaterial({ color: 0x3f9a4a, roughness: 0.7 }), new THREE.MeshStandardMaterial({ color: 0x9ac24a, roughness: 0.7 })];
  const budMat = new THREE.MeshStandardMaterial({ color: 0x7e57b0, roughness: 0.5, emissive: new THREE.Color(0x3a1a60), emissiveIntensity: 0.0 });
  function updatePots() {
    const t = api.gt(); for (const o of potObjs) o.pk.update(o.idx.map(i => api.potState(o.ar, i)), t);
  }

  // v92: detaillierter Brunnen: Stufensockel, achteckiges Becken mit Rand, zwei Schalen, Wasserstrahlen und fallendes Wasser
  const jets = [];
  function buildFountain(B, x, y, r) {
    const m4 = new THREE.Matrix4(), stone = C('#d9d2c2'), stone2 = C('#c4bcaa'), dark = C('#6f6a5e');
    B.addGeo(new THREE.CylinderGeometry(r + 12, r + 13, 2, 8), m4.makeTranslation(x, 1, y), stone2); // Stufe
    B.addGeo(new THREE.CylinderGeometry(r + 6, r + 7, 3, 8), m4.makeTranslation(x, 3.5, y), stone);
    B.addGeo(new THREE.CylinderGeometry(r + 3, r + 4, 12, 8, 1, true), m4.makeTranslation(x, 9, y), stone2); // Beckenwand aussen
    B.addGeo(new THREE.CylinderGeometry(r, r, 12, 8, 1, true), m4.makeTranslation(x, 9, y), dark);
    B.addGeo(new THREE.RingGeometry(r - 0.5, r + 4.5, 8).rotateX(-Math.PI / 2).rotateY(Math.PI / 8), m4.makeTranslation(x, 15.05, y), stone); // Rand
    for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + Math.PI / 8; B.addGeo(new THREE.BoxGeometry(5, 14, 5), m4.makeTranslation(x + Math.cos(a) * (r + 4), 8, y + Math.sin(a) * (r + 4)), stone); }
    B.addGeo(new THREE.CylinderGeometry(r - 1, r - 1, 1, 8), m4.makeTranslation(x, 4, y), C('#4e6a6e')); // Beckenboden
    B.addGeo(new THREE.CylinderGeometry(4.5, 7, 22, 12), m4.makeTranslation(x, 15, y), stone); // Saeule
    B.addGeo(new THREE.CylinderGeometry(r * 0.42, r * 0.18, 5, 20), m4.makeTranslation(x, 27, y), stone); B.addGeo(new THREE.TorusGeometry(r * 0.42, 1.1, 6, 20).rotateX(Math.PI / 2), m4.makeTranslation(x, 29.5, y), stone2);
    B.addGeo(new THREE.CylinderGeometry(2.4, 3.6, 12, 10), m4.makeTranslation(x, 35, y), stone);
    B.addGeo(new THREE.CylinderGeometry(r * 0.22, r * 0.1, 3.5, 16), m4.makeTranslation(x, 42, y), stone); B.addGeo(new THREE.SphereGeometry(2.4, 10, 8), m4.makeTranslation(x, 46, y), stone2);
    const wb = makeWater({ circ: [x, y, r - 1], flow: [2, 2], edge: 10, deep: '#2a6f86', shal: '#7ccbd6' });
    const wg = new THREE.CircleGeometry(r - 1, 32); wg.rotateX(-Math.PI / 2); wg.translate(x, 12, y); world.add(new THREE.Mesh(wg, wb));
    const wg2 = new THREE.CircleGeometry(r * 0.4, 20); wg2.rotateX(-Math.PI / 2); wg2.translate(x, 29.4, y); world.add(new THREE.Mesh(wg2, makeWater({ circ: [x, y, r * 0.4], flow: [1, 1], edge: 5, deep: '#3b88a0', shal: '#9fe0e8' })));
    // fallendes Wasser von der oberen Schale (halbtransparente Vorhaenge)
    const fall = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.43, r * 0.5, 17, 24, 1, true), fallMat); fall.position.set(x, 20.5, y); world.add(fall);
    // Strahl-Teilchen
    const N = 90, pos = new Float32Array(N * 3), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(g, jetMat); pts.frustumCulled = false; world.add(pts); jets.push({ x, y, r, pos, g, N });
  }
  const fallMat = new THREE.MeshStandardMaterial({ color: 0xcfeaf4, transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0, side: THREE.DoubleSide, depthWrite: false });
  const jetMat = new THREE.PointsMaterial({ color: 0xe8f6ff, size: 2.4, sizeAttenuation: false, transparent: true, opacity: 0.85, depthWrite: false });
  function updateJets(t) {
    fallMat.opacity = 0.28 + 0.08 * Math.sin(t * 7);
    for (const J of jets) { if (Math.abs(J.x - camS.tx) > 900 || Math.abs(J.y - camS.tz) > 700) continue;
      for (let i = 0; i < J.N; i++) { const ph = ((t * 0.9 + i / J.N * 7.3) % 1), a = i * 2.399, top = i % 3 === 0;
        const rr = top ? ph * J.r * 0.36 : J.r * 0.42 + ph * J.r * 0.4, h0 = top ? 48 : 30, vy = top ? 26 : 6;
        J.pos[i * 3] = J.x + Math.cos(a) * rr; J.pos[i * 3 + 1] = h0 + vy * ph - 46 * ph * ph * (top ? 0.9 : 0.5); J.pos[i * 3 + 2] = J.y + Math.sin(a) * rr; if (J.pos[i * 3 + 1] < 12) J.pos[i * 3 + 1] = 12; }
      J.g.attributes.position.needsUpdate = true; }
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
    for (const [x, y, r] of fountains) buildFountain(B, x, y, r);
    const P = api.POND; if (P) { B.box(P.x - 4, 0, P.y - 4, P.x + P.w + 4, 3, P.y + 4, C('#8a8f7a')); B.box(P.x - 4, 0, P.y + P.h - 4, P.x + P.w + 4, 3, P.y + P.h + 4, C('#8a8f7a')); B.box(P.x - 4, 0, P.y + 4, P.x + 4, 3, P.y + P.h - 4, C('#8a8f7a')); B.box(P.x + P.w - 4, 0, P.y + 4, P.x + P.w + 4, 3, P.y + P.h - 4, C('#8a8f7a')); B.box(P.x + 4, -6, P.y + 4, P.x + P.w - 4, -4, P.y + P.h - 4, C('#3a4a3c')); const wg = new THREE.PlaneGeometry(P.w - 8, P.h - 8, 20, 10); wg.rotateX(-Math.PI / 2); wg.translate(P.x + P.w / 2, 1.5, P.y + P.h / 2); world.add(new THREE.Mesh(wg, makeWater({ rect: [P.x + 4, P.y + 4, P.x + P.w - 4, P.y + P.h - 4], flow: [3, 1.5], edge: 26, deep: '#1f4f4a', shal: '#4f9a7a' }))); }
    world.add(olTag(B.mesh(M.concrete, true, true), 0.8));
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
  // ---------- v92: Skaterpark in 3D: Halfpipe, Bowl, Funbox mit Rail, Ledges, Graffiti-Waende, Schild ----------
  const HP_R = 40, HP_DECK = 14;
  const hpHeight = d => d < HP_DECK ? HP_R : d < HP_DECK + HP_R ? HP_R - Math.sqrt(Math.max(0, HP_R * HP_R - (HP_DECK + HP_R - d) * (HP_DECK + HP_R - d))) : 0;
  function buildSkate() {
    const S0 = api.SKATE; if (!S0) return; const b = new Batch(), mt = new Batch(), em = new Batch(), conc = C('#c9ced6'), conc2 = C('#9aa3ad'), cope = C('#e8b84a');
    const H0 = api.HALFPIPE; if (H0) { // zwei Quarterpipes mit Deck und Coping
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(0, HP_R); sh.lineTo(HP_DECK, HP_R); for (let k = 1; k <= 16; k++) { const a = k / 16 * Math.PI / 2; sh.lineTo(HP_DECK + HP_R - Math.cos(a) * HP_R, HP_R - Math.sin(a) * HP_R); } sh.lineTo(0, 0);
      for (const side of [0, 1]) { const g = new THREE.ExtrudeGeometry(sh, { depth: H0.h, bevelEnabled: false, curveSegments: 16 }); const m = new THREE.Matrix4(); if (side) m.makeScale(-1, 1, 1).premultiply(new THREE.Matrix4().makeTranslation(H0.x + H0.w, 0, H0.y)); else m.makeTranslation(H0.x, 0, H0.y); b.addGeo(g, m, conc);
        const cx = side ? H0.x + H0.w - HP_DECK : H0.x + HP_DECK; mt.addGeo(new THREE.CylinderGeometry(1.4, 1.4, H0.h, 8).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(cx, HP_R, H0.y + H0.h / 2), cope);
        const rx = side ? H0.x + H0.w - 2 : H0.x; for (let z = 0; z <= H0.h; z += H0.h / 4) mt.box(rx, HP_R, H0.y + z - 0.8, rx + 2, HP_R + 16, H0.y + z + 0.8, C('#5e6670')); mt.box(rx, HP_R + 15, H0.y, rx + 2, HP_R + 17, H0.y + H0.h, C('#5e6670')); }
      b.box(H0.x + HP_DECK + HP_R, 0, H0.y, H0.x + H0.w - HP_DECK - HP_R, 0.8, H0.y + H0.h, conc2);
      for (const z of [H0.y - 1, H0.y + H0.h]) { b.box(H0.x, 0, z, H0.x + HP_DECK + 2, HP_R, z + 1, conc2); b.box(H0.x + H0.w - HP_DECK - 2, 0, z, H0.x + H0.w, HP_R, z + 1, conc2); }
      for (const x of [H0.x + 2, H0.x + H0.w - 10]) for (let k = 0; k < 5; k++) b.box(x, k * 8, H0.y + H0.h + 1, x + 8, k * 8 + 2, H0.y + H0.h + 12 - k * 2, C('#7e8690')); // Treppchen
    }
    const B0 = api.BOWL; if (B0) { const pr = [[1.05, 0], [1.05, 12], [1, 12.5], [0.97, 12], [0.9, 8], [0.8, 4], [0.65, 1.5], [0.4, 1], [0, 1]].map(([r, y]) => new THREE.Vector2(r, y));
      const g = new THREE.LatheGeometry(pr, 48); g.scale(B0.w / 2, 1, B0.h / 2); b.addGeo(g, new THREE.Matrix4().makeTranslation(B0.x + B0.w / 2, 0, B0.y + B0.h / 2), conc);
      const tg = new THREE.TorusGeometry(1, 0.012, 6, 48).rotateX(Math.PI / 2); tg.scale(B0.w / 2, 110, B0.h / 2); mt.addGeo(tg, new THREE.Matrix4().makeTranslation(B0.x + B0.w / 2, 12.6, B0.y + B0.h / 2), cope); }
    const F0 = api.FUNBOX; if (F0) { const w = F0.w, d = F0.h, ht = 16, ramp = 26, sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(ramp, ht); sh.lineTo(w - ramp, ht); sh.lineTo(w, 0); sh.lineTo(0, 0);
      b.addGeo(new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }), new THREE.Matrix4().makeTranslation(F0.x, 0, F0.y), C('#b5bcc5'));
      mt.addGeo(new THREE.CylinderGeometry(1, 1, w - 20, 8).rotateZ(Math.PI / 2), new THREE.Matrix4().makeTranslation(F0.x + w / 2, ht + 8, F0.y + d / 2), C('#e8ecf2')); for (const x of [F0.x + 16, F0.x + w - 18]) mt.box(x - 1, ht, F0.y + d / 2 - 1, x + 1, ht + 8, F0.y + d / 2 + 1, C('#3a3f47')); }
    for (const [x, y, w] of [[S0.x + 470, S0.y + 470, 120], [S0.x + 24, S0.y + 300, 90]]) { b.box(x, 0, y, x + w, 12, y + 22, C('#9aa3ad')); mt.box(x, 12, y - 0.5, x + w, 13.5, y + 1.5, cope); }
    mt.addGeo(new THREE.CylinderGeometry(1, 1, 140, 8).rotateZ(Math.PI / 2), new THREE.Matrix4().makeTranslation(S0.x + 230, 9, S0.y + 471.5), C('#e8ecf2')); for (const x of [S0.x + 170, S0.x + 230, S0.x + 290]) mt.box(x - 1, 0, S0.y + 470.5, x + 1, 9, S0.y + 472.5, C('#3a3f47'));
    const GC = ['#FF5CA8', '#4BC8FF', '#FFD24A', '#5FE584', '#B36BFF', '#FF7A3A'];
    for (const gw of api.GRAFF || []) { b.box(gw.x, 0, gw.y, gw.x + gw.w, 44, gw.y + gw.h, C('#8d8a86')); b.box(gw.x - 1, 44, gw.y - 1, gw.x + gw.w + 1, 47, gw.y + gw.h + 1, C('#6e6b68'));
      for (let k = 0; k < 14; k++) { const x = gw.x + 6 + k * (gw.w - 20) / 14, hh = 8 + ((k * 7 + gw.s * 3) % 5) * 5, y0 = 6 + ((k * 5) % 4) * 4, col = C(GC[(k + gw.s * 2) % GC.length]); for (const z of [gw.y - 0.6, gw.y + gw.h]) b.box(x, y0, z, x + (gw.w - 20) / 14 + 4, y0 + hh, z + 0.6, col); } }
    em.box(3005 - 52, 30, S0.y + 10, 3005 + 52, 50, S0.y + 14, C('#FF5CA8')); mt.box(3005 - 50, 0, S0.y + 11, 3005 - 46, 30, S0.y + 13, C('#3a3f47')); mt.box(3005 + 46, 0, S0.y + 11, 3005 + 50, 30, S0.y + 13, C('#3a3f47'));
    const a = olTag(b.mesh(M.concrete, true, true), 0.9); if (a) world.add(a); const m2 = mt.mesh(M.metal, true, true); if (m2) world.add(m2); const e = em.mesh(signMat, false, false); if (e) world.add(e);
  }
  const boardPool = new Map(), boardG = new THREE.BoxGeometry(22, 1.4, 7), boardM = new THREE.MeshStandardMaterial({ color: 0x3a2a20, roughness: 0.6 }), wheelG = new THREE.CylinderGeometry(1.6, 1.6, 8, 8).rotateX(Math.PI / 2), wheelM = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.4 });
  function skaterHeight(s) { const H0 = api.HALFPIPE, B0 = api.BOWL; if (s.k === 0 && H0) { const d = Math.min(s.x - H0.x, H0.x + H0.w - s.x); return hpHeight(d); } if (s.k === 1 && B0) return 1 + s.up * 14; return 0; }
  function skaters() {
    const list = api.skaters ? api.skaters() : [], seen = new Set();
    figPool('skate', list.map(s => ({ id: s.id, x: s.x, y: s.y, ang: s.ang, step: 0, look: s.look, moving: false, h: skaterHeight(s) + 2.5 })));
    for (const s of list) { let bd = boardPool.get(s.id); if (!bd) { bd = new THREE.Group(); bd.add(new THREE.Mesh(boardG, boardM)); for (const x of [-7, 7]) { const w = new THREE.Mesh(wheelG, wheelM); w.position.set(x, -1.6, 0); bd.add(w); } bd.traverse(o => { o.castShadow = true; }); cartoon(bd, 0.4); scene.add(bd); boardPool.set(s.id, bd); }
      const hgt = skaterHeight(s); bd.position.set(s.x, hgt + 2.4, s.y); bd.rotation.set(0, -s.ang, 0); seen.add(s.id);
      if (s.k === 0 && api.HALFPIPE) { const H0 = api.HALFPIPE, d = s.x - H0.x < H0.w / 2 ? s.x - H0.x : H0.x + H0.w - s.x, sg = s.x - H0.x < H0.w / 2 ? 1 : -1; const sl = d < HP_DECK + HP_R && d > HP_DECK ? Math.asin(Math.min(1, (HP_DECK + HP_R - d) / HP_R)) : 0; bd.rotation.z = -sl * sg; }
      else bd.rotation.z = 0; }
    for (const [id, bd] of boardPool) if (!seen.has(id)) { scene.remove(bd); boardPool.delete(id); }
  }
  // ---------- v92: Kiosk, Marktstand, Baenke ----------
  function buildStreet() {
    const wd = new Batch(), mt = new Batch(), gl = new Batch(), em = new Batch();
    const K = api.KIOSK; if (K) { const x0 = K.x, x1 = K.x + K.w, z0 = K.y, z1 = K.y + K.h;
      wd.box(x0 + 2, 0, z0 + 2, x1 - 2, 6, z1 - 2, C('#5e4530')); wd.box(x0, 6, z0, x1, 40, z1, C('#7A5A3E'));
      for (let i = 0; i < 6; i++) wd.box(x0 - 0.6, 8 + i * 5.4, z0 - 0.6, x1 + 0.6, 9, z1 + 0.6, C('#6a4c34')); // Bretter
      wd.box(x0 + 6, 16, z1, x1 - 6, 19, z1 + 7, C('#9A7650')); // Theke
      gl.box(x0 + 8, 19, z1 - 0.5, x1 - 8, 33, z1 + 0.6); // Fenster (leuchtet nachts)
      wd.box(x0 - 4, 40, z0 - 4, x1 + 4, 44, z1 + 4, C('#9A7650'));
      for (let i = 0; i < 8; i++) { const sx = x0 - 4 + i * (K.w + 8) / 8; wd.box(sx, 36, z1 + 2, sx + (K.w + 8) / 8, 39, z1 + 16, C(i % 2 ? '#F4F1EA' : '#D94A4A')); } // Markise
      em.box(K.x + K.w / 2 - 22, 44, z1 - 2, K.x + K.w / 2 + 22, 54, z1 + 1, C('#FFB547')); // Schild
      for (const zz of [z0 + 6, z0 + 18]) wd.box(x1 + 2, 0, zz, x1 + 12, 12, zz + 10, C('#4a6a8a')); // Getraenkekisten
    }
    const S = api.STALL; if (S) { const x0 = S.x, x1 = S.x + S.w, z0 = S.y, z1 = S.y + S.h;
      wd.box(x0, 0, z0 + 6, x1, 18, z1, C('#8A6A45')); wd.box(x0 - 1, 0, z1 - 4, x1 + 1, 4, z1, C('#6F5139'));
      const cols = ['#D33F3F', '#F2A93B', '#6FBF5E', '#E8C94A'];
      for (let i = 0; i < 4; i++) { const cx = x0 + 4 + i * 18; wd.box(cx, 18, z0 + 8, cx + 15, 24, z1 - 6, C('#B98A52')); for (let q = 0; q < 6; q++) mt.box(cx + 1.5 + (q % 3) * 4.5, 24, z0 + 9 + Math.floor(q / 3) * 6, cx + 5 + (q % 3) * 4.5, 27.5, z0 + 12.5 + Math.floor(q / 3) * 6, C(cols[(i + q) % 4])); }
      for (const px of [x0 + 1, x1 - 3]) for (const pz of [z0 + 6, z1 - 2]) wd.box(px, 0, pz, px + 2, 46, pz + 2, C('#5a4632'));
      for (let i = 0; i < 6; i++) { const sx = x0 - 4 + i * (S.w + 8) / 6; wd.box(sx, 46, z0 + 2, sx + (S.w + 8) / 6, 49, z1 + 4, C(i % 2 ? '#F4F1EA' : '#3f9a5a')); }
    }
    for (const b of api.BENCHES || []) { const hor = b.w > b.h, x0 = b.x - b.w / 2, z0 = b.y - b.h / 2, x1 = x0 + b.w, z1 = z0 + b.h;
      if (hor) { for (const lx of [x0 + 3, x1 - 6]) mt.box(lx, 0, z0, lx + 3, 9, z1, C('#3A3F47')); for (let i = 0; i < 3; i++) wd.box(x0, 9, z0 + 1 + i * (b.h - 2) / 3, x1, 11, z0 + i * (b.h - 2) / 3 + (b.h - 2) / 3, C('#A0703F'));
        for (const lx of [x0 + 3, x1 - 6]) mt.box(lx, 9, z0, lx + 3, 22, z0 + 2, C('#3A3F47')); wd.box(x0, 15, z0 - 0.5, x1, 18, z0 + 1.5, C('#8a5e34')); wd.box(x0, 19.5, z0 - 0.5, x1, 22, z0 + 1.5, C('#8a5e34')); }
      else { for (const lz of [z0 + 3, z1 - 6]) mt.box(x0, 0, lz, x1, 9, lz + 3, C('#3A3F47')); for (let i = 0; i < 3; i++) wd.box(x0 + 1 + i * (b.w - 2) / 3, 9, z0, x0 + i * (b.w - 2) / 3 + (b.w - 2) / 3, 11, z1, C('#A0703F'));
        for (const lz of [z0 + 3, z1 - 6]) mt.box(x0, 9, lz, x0 + 2, 22, lz + 3, C('#3A3F47')); wd.box(x0 - 0.5, 15, z0, x0 + 1.5, 18, z1, C('#8a5e34')); wd.box(x0 - 0.5, 19.5, z0, x0 + 1.5, 22, z1, C('#8a5e34')); }
    }
    const a = olTag(wd.mesh(M.wood, true, true), 0.7); if (a) world.add(a); const b2 = mt.mesh(M.metal, true, true); if (b2) world.add(b2);
    const g = gl.mesh(M.glass, false, false); if (g) { g.material = M.glass; world.add(g); }
    const e = em.mesh(signMat, true, false); if (e) world.add(e);
  }
  const signMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, emissive: new THREE.Color(0xffa040), emissiveIntensity: 0.15 });
  // ---------- v92: Wetter (Regen) und Jahreszeiten-Teilchen (Schnee, Blaetter, Bluetenblaetter) ----------
  const RN = 700, rainGeo = new THREE.BufferGeometry(), rainPos = new Float32Array(RN * 6), rainSeed = new Float32Array(RN * 3);
  for (let i = 0; i < RN; i++) { rainSeed[i * 3] = Math.random(); rainSeed[i * 3 + 1] = Math.random(); rainSeed[i * 3 + 2] = Math.random(); }
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rainMat = new THREE.LineBasicMaterial({ color: 0xc8d8ec, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const rain = new THREE.LineSegments(rainGeo, rainMat); rain.frustumCulled = false; rain.renderOrder = 5; scene.add(rain);
  const PN = 260, partGeo = new THREE.BufferGeometry(), partPos = new Float32Array(PN * 3), partCol = new Float32Array(PN * 3);
  partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3)); partGeo.setAttribute('color', new THREE.BufferAttribute(partCol, 3));
  const partMat = new THREE.PointsMaterial({ size: 3.2, sizeAttenuation: false, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, fog: false });
  const parts = new THREE.Points(partGeo, partMat); parts.frustumCulled = false; parts.renderOrder = 5; scene.add(parts);
  let partSeason = -2, rainK = 0;
  const greyC = C('#6b7684');
  function weather(dt) {
    const t = api.gt(), v = api.view(), out = !(api.player.fl || api.inBuilding(api.player.x, api.player.y));
    rainK = api.rain ? api.rain() : 0; const r = out ? rainK : 0;
    const X0 = v.x - v.vw / 2 - 40, WX = v.vw + 80, Z0 = v.y - v.vh / 2 - 40, WZ = v.vh + 320, HT = 260;
    rain.visible = r > 0.02; rainMat.opacity = 0.5 * r;
    if (rain.visible) { const n = Math.floor(RN * Math.min(1, 0.3 + r)); for (let i = 0; i < RN; i++) { const o = i * 6; if (i >= n) { rainPos.fill(0, o, o + 6); continue; }
      const s1 = rainSeed[i * 3], s2 = rainSeed[i * 3 + 1], s3 = rainSeed[i * 3 + 2], yy = HT - ((s3 * HT + t * (420 + s2 * 120)) % HT), x = X0 + ((s1 * WX + t * 30) % WX), z = Z0 + s2 * WZ;
      rainPos[o] = x; rainPos[o + 1] = yy; rainPos[o + 2] = z; rainPos[o + 3] = x - 2; rainPos[o + 4] = yy - 16; rainPos[o + 5] = z + 1; }
      rainGeo.attributes.position.needsUpdate = true; }
    // nasse Strassen glaenzen bei Regen
    M.asphalt.roughness = 0.9 - 0.45 * rainK; M.concrete.roughness = 0.85 - 0.35 * rainK;
    const si = api.season ? api.season() : -1;
    parts.visible = out && (si === 0 || si === 2 || si === 3);
    if (si !== partSeason) { partSeason = si; const pal = si === 3 ? ['#ffffff'] : si === 0 ? ['#ffbedc', '#ffffff'] : ['#E09A2E', '#B0581C', '#D8C040'];
      for (let i = 0; i < PN; i++) { const c = C(pal[i % pal.length]); partCol[i * 3] = c.r; partCol[i * 3 + 1] = c.g; partCol[i * 3 + 2] = c.b; } partGeo.attributes.color.needsUpdate = true; partMat.size = (si === 3 ? 3.2 : 4) * Math.min(2, renderer.getPixelRatio()); }
    if (parts.visible) { const n = si === 3 ? PN : 90, sp = si === 3 ? 34 : 22;
      for (let i = 0; i < PN; i++) { const o = i * 3; if (i >= n) { partPos[o + 1] = -999; continue; } const s1 = rainSeed[i * 3], s2 = rainSeed[i * 3 + 1], s3 = rainSeed[i * 3 + 2];
        partPos[o] = X0 + ((s1 * WX + Math.sin(t * 0.8 + i) * 18 + t * (si === 3 ? 6 : 16)) % WX + WX) % WX; partPos[o + 1] = HT - ((s3 * HT + t * sp * (0.7 + s2 * 0.6)) % HT); partPos[o + 2] = Z0 + s2 * WZ; }
      partGeo.attributes.position.needsUpdate = true; }
  }
  // ---------- Figuren (v91: echte 3D-Figuren im Stil der 2D-Figuren, siehe kg3d_fig.js) ----------
  const FIG_S = 1.3; // v93: Figuren groesser, naeher an den 2D-Figuren
  const pools = {}; // name -> Map(id -> group)
  const lastPos = new Map();
  function figPool(name, items) { // items: [{id, x, y, ang, step, look}]
    let P = pools[name]; if (!P) P = pools[name] = new Map(); const seen = new Set(), t = api.gt();
    for (const it of items) {
      let g = P.get(it.id); const k = kit.lookKey(it.look);
      if (g && g.userData.key !== k) { scene.remove(g); g = null; }
      if (!g) { g = kit.makeFigure(it.look || {}); g.scale.setScalar(FIG_S); cartoon(g, 0.42); P.set(it.id, g); scene.add(g); }
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
    if (P && E.wpn !== fx.wpnId) { if (fx.wpn && fx.wpn.parent) fx.wpn.parent.remove(fx.wpn); fx.wpn = E.wpn ? kit.weapon(P.userData.body || P, E.wpn) : null; if (fx.wpn) cartoon(fx.wpn, 0.3); fx.wpnId = E.wpn; }
    if (fx.wpn && P) { if (fx.wpn.parent !== (P.userData.body || P)) { (P.userData.body || P).add(fx.wpn); }
      if (E.inHand) { const sw = E.swing >= 0 ? E.swing : 0; fx.wpn.position.set(8, 12, 4); fx.wpn.rotation.set(1.1 - sw * 2.2, 0, -0.3); } else { fx.wpn.position.set(0, 10, -6.5); fx.wpn.rotation.set(0, 0, 0.75); } }
    if (!P) { fx.wpn = null; fx.wpnId = null; }
    // Fahrrad / Roller
    if (E.bike !== fx.bikeId) { if (fx.bike) scene.remove(fx.bike); fx.bike = E.bike ? kit.makeBike(E.bike) : null; if (fx.bike) { fx.bike.scale.setScalar(FIG_S); cartoon(fx.bike, 0.4); } if (fx.bike) scene.add(fx.bike); fx.bikeId = E.bike; }
    if (fx.bike) { fx.bike.position.set(x, 0, y); fx.bike.rotation.y = Math.PI / 2 - api.player.ang; if (P) P.position.y = E.bike === 'scooter' ? 4 : 8; }
    // Orbit-Begleiter (bis zu zwei)
    const want = new Set(E.orbits); for (const id of Object.keys(fx.orb)) if (!want.has(id)) { scene.remove(fx.orb[id]); delete fx.orb[id]; }
    for (const id of want) { if (!fx.orb[id]) { const o = kit.makeOrbit(id); if (o) { cartoon(o); scene.add(o); fx.orb[id] = o; } } if (fx.orb[id]) kit.poseOrbit(fx.orb[id], x, y, t); }
    // Spur
    if (E.trail !== fx.trailId) { if (fx.trail) scene.remove(fx.trail); fx.trail = E.trail ? kit.makeTrail(E.trail) : null; if (fx.trail) scene.add(fx.trail); fx.trailId = E.trail; }
    if (fx.trail) kit.poseTrail(fx.trail, x, y, t, dt, E.moving);
    // Haustiere
    const pw = new Set(E.pets.map(p => p.id + '#' + p.n)); for (const k of Object.keys(fx.pets)) if (!pw.has(k)) { scene.remove(fx.pets[k]); delete fx.pets[k]; }
    for (const p of E.pets) { const k = p.id + '#' + p.n; if (!fx.pets[k]) { fx.pets[k] = kit.makePet(p.id); fx.pets[k].scale.setScalar(FIG_S); cartoon(fx.pets[k], 0.4); scene.add(fx.pets[k]); } kit.posePet(fx.pets[k], p.x, p.y, p.face, t, p.moving, p.n); }
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
    for (const it of items) { let g = P.get(it.id); if (g && g.userData.col !== it.col + (it.truck ? 't' : '')) { scene.remove(g); g = null; } if (!g) { g = makeCar(it.col, it.truck); cartoon(g, 0.8); g.userData.col = it.col + (it.truck ? 't' : ''); P.set(it.id, g); scene.add(g); } g.position.set(it.x, 0, it.y); g.rotation.y = -it.ang; g.userData.hl.material.emissiveIntensity = nightK > 0.3 ? 2 : 0; seen.add(it.id); }
    for (const [id, g] of P) if (!seen.has(id)) { scene.remove(g); P.delete(id); }
  }
  // Auftrags-Markierungen ueber den Kunden
  const pinGeo = new THREE.ConeGeometry(6, 14, 4); pinGeo.rotateX(Math.PI); const pinMats = {};
  function pinPool(items) { let P = pools.pins; if (!P) P = pools.pins = new Map(); const seen = new Set(); const t = api.gt();
    for (const it of items) { let m = P.get(it.id); if (!m) { if (!pinMats[it.col]) pinMats[it.col] = new THREE.MeshStandardMaterial({ color: it.col, emissive: new THREE.Color(it.col), emissiveIntensity: 0.7 }); m = new THREE.Mesh(pinGeo, pinMats[it.col]); P.set(it.id, m); scene.add(m); } m.position.set(it.x, 60 + Math.sin(t * 3 + it.x) * 3, it.y); m.rotation.y = t * 2; seen.add(it.id); }
    for (const [id, m] of P) if (!seen.has(id)) { scene.remove(m); P.delete(id); } }

  // ---------- Kamera: fest wie in 2D (gleicher Ausschnitt und Mittelpunkt), nur raeumlich ----------
  const PITCH = 0.66, camS = { tx: 0, tz: 0 };
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
    if (rainK > 0.01) { scene.background.lerp(greyC, rainK * 0.55); scene.fog.color.copy(scene.background); }
    sun.intensity = ((1 - nightK) * 2.4 + 0.05) * (1 - rainK * 0.55) * (TOON ? 1.05 : 1); sun.color.setRGB(1, 1 - dusk * 0.25, 1 - dusk * 0.45);
    hemi.intensity = (0.45 + (1 - nightK) * 0.6) * (TOON ? 1.8 : 1);
    envK = 1 - nightK * 0.8; if (Math.abs(envK - envLast) > 0.02) { envLast = envK; for (const m of allMats()) m.envMapIntensity = envK; } hemi.color.copy(skyDay).lerp(skyNight, nightK * 0.8);
    amb.intensity = nightK * 0.35 + (indoor ? 0.2 : 0);
    M.glass.emissiveIntensity = nightK * 1.1; signMat.emissiveIntensity = 0.15 + nightK * 1.4; M.lampHead.emissiveIntensity = 0.2 + nightK * 2.5; budMat.emissive.setHex(0x3a1a60);
    waterU.uNight.value = nightK; waterU.uSun.value.set(az, el, 0.45); waterU.uSky.value.copy(tmpC).lerp(C('#ffffff'), 0.2);
    // Laternen nahe am Spieler werden zu echten Lichtern
    const L = api.LAMPS; const near = []; for (const l of L) { const d2 = (l.x - px) * (l.x - px) + (l.y - pz) * (l.y - pz); if (d2 < 420 * 420) near.push([d2, l]); } near.sort((a, b) => a[0] - b[0]);
    lampLights.forEach((ll, i) => { const n = near[i]; if (n && nightK > 0.25) { ll.position.set(n[1].x, 54, n[1].y); ll.intensity = (nightK - 0.2) * 4200; } else ll.intensity = 0; });
    playerLight.position.set(api.player.x, 70, api.player.y); playerLight.intensity = (indoor ? 5000 : nightK * 1500) * (TOON ? 0.35 : 1);
    if (special.userData.casSign) special.userData.casSign.material.emissiveIntensity = 1.2 + Math.sin(api.gt() * 6) * 0.4;
  }

  // ---------- Bilden und Zeichnen ----------
  buildGround(); buildHouses(); buildNature(); buildGardens(); buildWalls(); buildAreas(); buildSpecial(); buildStreet(); buildSkate(); cartoon(world); cartoon(special, 0.8);
  let active = true, sigT = 0, W = 0, H = 0;
  function resize() { const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight; if (w === W && h === H) return; W = w; H = h; renderer.setSize(w, h, false); }
  function render(dt) {
    if (!active) return; resize(); dt = Math.min(0.1, dt || 0.016);
    sigT -= dt; if (sigT <= 0) { sigT = 0.8; if (colSig() !== wallSig) buildWalls(); const as = api.areaSig(); if (as !== areaSig) { areaSig = as; buildAreas(); buildWalls(); } }
    updatePots(); placeCamera(); weather(dt); lighting(dt); waterU.uT.value = api.gt(); deco.animate(areaGroup, api.gt()); updateJets(api.gt()); updateTrees();
    const p = api.player;
    figPool('player', api.inCar() ? [] : [{ id: 'me', x: p.x, y: p.y, ang: p.ang, step: p.step, look: api.G.look, moving: api.extras().moving }]); playerExtras(dt);
    carPool('mycar', api.inCar() ? [{ id: 'me', x: p.x, y: p.y, ang: p.ang, col: api.myCarCol(), truck: false }] : []);
    figPool('cops', api.cops.filter(c => c.on).map((c, i) => ({ id: i, x: c.x, y: c.y, ang: c.ang, step: c.step || 0, look: api.COP_LOOK })));
    figPool('chars', api.chars());
    figPool('workers', api.workers().map(w => ({ id: w.id, x: w.x, y: w.y, ang: w.ang || 0, step: w.step || 0, look: w.look || { r: 80, g: 160, b: 90, skin: 1, hair: 1, hs: 0 } })));
    figPool('friends', api.friends());
    figPool('gangs', api.gangMembers()); skaters();
    figPool('guests', api.customers());
    figPool('dealers', special.userData.dealers || []); if (special.userData.wheel) special.userData.wheel.rotation.z = api.gt() * 0.4;
    carPool('traffic', api.traffic.map((c, i) => ({ id: c.id || (c.id = 't' + Math.random().toString(36).slice(2, 8)), x: c.x, y: c.y, ang: c.h ? (c.dir > 0 ? 0 : Math.PI) : (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2), col: c.col, truck: c.truck })));
    carPool('police', api.cars.map((c, i) => ({ id: c.id || (c.id = 'p' + Math.random().toString(36).slice(2, 8)), x: c.x, y: c.y, ang: c.dir > 0 ? 0 : Math.PI, col: '#e8ecf2', truck: false })));
    pinPool(api.orderPins());
    // Raum-Ansicht: im Keller oder einer Etage den Raum zeigen
    if (TOON) syncToon(); renderer.render(scene, camera);
  }
  const v3 = new THREE.Vector3();
  function project(x, y, h) { v3.set(x, h || 0, y).project(camera); if (v3.z > 1) return null; return { x: (v3.x * 0.5 + 0.5) * W, y: (-v3.y * 0.5 + 0.5) * H }; }
  function setActive(on) { active = !!on; canvas.style.display = on ? 'block' : 'none'; }
  function dispose() { active = false; renderer.dispose(); }
  return { scene, dbg: () => ({ areaSig, pots: potObjs.map(o => o.ar + ':' + o.idx.length) }), render, project, setActive, dispose, yaw: () => 0, renderer, info: () => renderer.info.render };
}
