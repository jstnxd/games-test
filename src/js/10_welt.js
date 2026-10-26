(() => {
  const $ = id => document.getElementById(id);
  const cv = $('c'); let ctx = cv.getContext('2d');
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const TAU = Math.PI * 2;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
    del(k) { try { if (localStorage.removeItem) localStorage.removeItem(k); else localStorage.setItem(k, ''); } catch (e) {} }
  };
  let muted = store.get('kellergruen.muted', '0') === '1';
  const fmt = n => '€ ' + Math.round(n).toLocaleString('de-DE');

  let W = 0, H = 0, DPR = 1;
  // v91: iPhone-Web-App (Home-Bildschirm): iOS meldet nach dem Drehen oder Zurueckkehren manchmal eine zu kleine Hoehe
  // (unten schwarzer Balken, oben fehlt ein Stueck). Dann die echte Bildschirmhoehe fest setzen.
  // v105: robuster. Auf dem iPhone als Web-App (Home-Bildschirm) ist das Fenster immer der ganze Bildschirm. iOS meldet nach dem
  // Drehen aber manchmal eine zu kleine Hoehe oder legt das feste Seitenelement zu kurz an (unten Balken in Hintergrundfarbe).
  // Darum dort Breite und Hoehe immer fest auf die Bildschirmmasse setzen und nach dem Drehen mehrmals nachmessen.
  let fixLast = '';
  const iosDev = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  const iosStandalone = () => navigator.standalone === true || !!(window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  function fullFix() {
    const de = document.documentElement, bd = document.body, clear = () => { de.style.height = ''; bd.style.height = ''; bd.style.bottom = ''; bd.style.width = ''; bd.style.right = ''; fixLast = 'aus'; return null; };
    try {
      if (!iosDev() || !iosStandalone()) return clear();
      const a = Math.min(screen.width, screen.height), b = Math.max(screen.width, screen.height), land = innerWidth > innerHeight;
      const fw = land ? b : a, fh = land ? a : b;
      if (/iPhone|iPod/.test(navigator.userAgent)) { de.style.height = fh + 'px'; bd.style.height = fh + 'px'; bd.style.bottom = 'auto'; bd.style.width = fw + 'px'; bd.style.right = 'auto'; fixLast = 'iPhone fest ' + fw + '×' + fh; return { w: fw, h: fh }; }
      if (Math.abs(innerWidth - fw) <= 2 && innerHeight < fh - 2 && fh - innerHeight <= 90) { de.style.height = fh + 'px'; bd.style.height = fh + 'px'; bd.style.bottom = 'auto'; fixLast = 'iPad Höhe ' + fh; return { w: innerWidth, h: fh }; }
      return clear();
    } catch (e) { fixLast = 'Fehler'; return null; }
  }
  let fixBurstT = 0;
  function fixBurst() { const n = Date.now(); if (n - fixBurstT < 250) return; fixBurstT = n; [80, 300, 700, 1300, 2500].forEach(t => setTimeout(() => { try { screenFit(true); } catch (e) {} }, t)); }
  function screenInfo() { // v105: Bildschirm-Info fuer die Fehlersuche
    const r = el => { try { const q = el.getBoundingClientRect(); return Math.round(q.width) + '×' + Math.round(q.height) + (q.top ? ' (oben ' + Math.round(q.top) + ')' : ''); } catch (e) { return '?'; } };
    let lvh = '?', sa = '?'; try { const p = document.createElement('div'); p.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:100vh;height:100lvh;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px) 0;box-sizing:content-box'; document.body.appendChild(p); const cs = getComputedStyle(p); lvh = p.offsetHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0); sa = 'oben ' + Math.round(parseFloat(cs.paddingTop) || 0) + ' / unten ' + Math.round(parseFloat(cs.paddingBottom) || 0); p.remove(); } catch (e) {}
    const vv = window.visualViewport;
    return ['Version ' + GAME_VER, 'Gerät: ' + (iosDev() ? (/iPhone|iPod/.test(navigator.userAgent) ? 'iPhone' : 'iPad') : 'kein iOS') + ' · Web-App: ' + (iosStandalone() ? 'ja' : 'nein'),
      'Fenster (inner): ' + innerWidth + '×' + innerHeight, 'Bildschirm: ' + screen.width + '×' + screen.height, 'Sichtbar (visualViewport): ' + (vv ? Math.round(vv.width) + '×' + Math.round(vv.height) : '–'),
      'Dokument (client): ' + document.documentElement.clientWidth + '×' + document.documentElement.clientHeight, '100lvh: ' + lvh + ' · Ränder: ' + sa,
      'Seite (body): ' + r(document.body), 'Spielfläche: ' + r(cv) + ' · Puffer ' + cv.width + '×' + cv.height + ' · DPR ' + DPR.toFixed(2), 'Korrektur: ' + fixLast].join('\n');
  }
  // v98: Bildqualitaet (pro Geraet): 0 = sparsam, 1 = hoch (volle Aufloesung), 2 = ultra (Supersampling); Farbfilter an/aus
  let GFX_Q = (() => { try { const v = +localStorage.getItem('kellergruen.gq'); return v === 0 && localStorage.getItem('kellergruen.gq') !== null ? 0 : 1; /* v107: Ultra entfernt, alte Einstellung 2 wird zu Hoch */ } catch (e) { return 1; } })();
  let GFX_FX = (() => { try { return localStorage.getItem('kellergruen.gfx') !== '0'; } catch (e) { return true; } })();
  let lofxUser = (() => { try { return localStorage.getItem('kellergruen.lofx') === '1'; } catch (e) { return false; } })(); // v128: Weniger Effekte (pro Gerät)
  let autoLow = false, autoOn = (() => { try { return localStorage.getItem('kellergruen.autolow') !== '0'; } catch (e) { return true; } })(); // v129: automatisch sparen, wenn das Handy drosselt (Energiesparmodus)
  let LOFX = lofxUser; // wirksam: von Hand an oder automatisch
  function setLofx(v) { lofxUser = !!v; LOFX = lofxUser || autoLow; try { localStorage.setItem('kellergruen.lofx', lofxUser ? '1' : '0'); } catch (e) {} }
  // v129: Glätten unabhängig von der Bildrate (bei 30 Bildern/s im Energiesparmodus sonst ruckelig)
  // v134: Bildraten-Anzeige (pro Gerät, unter Einstellungen → Anzeige)
  let fpsOn = (() => { try { return localStorage.getItem('kellergruen.fps') === '1'; } catch (e) { return false; } })(); const fpsM = { n: 0, t0: 0, v: 0 };
  function setFps(v) { fpsOn = !!v; try { localStorage.setItem('kellergruen.fps', fpsOn ? '1' : '0'); } catch (e) {} const el = $('fpsHud'); if (el) el.hidden = !fpsOn; }
  function fpsTick(ts) { if (!fpsOn) return; fpsM.n++; if (!fpsM.t0) fpsM.t0 = ts; const el = ts - fpsM.t0; if (el < 500) return; fpsM.v = Math.round(fpsM.n * 1000 / el); fpsM.n = 0; fpsM.t0 = ts;
    const e = $('fpsHud'); if (e) { e.hidden = false; e.textContent = fpsM.v + ' fps' + (autoLow ? ' · sparsam' : ''); e.className = 'fpshud ' + (fpsM.v >= 100 ? 'hi' : fpsM.v >= 55 ? 'mid' : 'lo'); } }
  let fdt = 1 / 60; const fk = a => 1 - Math.pow(1 - a, Math.min(4, fdt * 60));
  // Bildraten-Messung: läuft das Spiel länger deutlich unter 40 Bildern/s, wird automatisch gespart (geringere Auflösung, weniger Effekte)
  const perf = { s: 0, n: 0, slow: 0, fast: 0, offAt: -1e9, latch: false };
  function perfTick(int) {
    if (state !== 'play' || int <= 0 || int > 0.25) return; perf.s += int; perf.n++; if (perf.s < 2) return;
    const avg = perf.s / perf.n; perf.s = 0; perf.n = 0;
    if (!autoOn) { if (autoLow) setAutoLow(false); return; }
    if (!autoLow) { perf.slow = avg > 0.026 ? perf.slow + 1 : 0; if (perf.slow >= 2) { perf.slow = 0; if (gt - perf.offAt < 120) perf.latch = true; setAutoLow(true); msg('🔋 Das Handy drosselt (z. B. Energiesparmodus): Grafik läuft jetzt sparsamer, damit nichts ruckelt.'); } }
    else if (!perf.latch) { perf.fast = avg < 0.019 ? perf.fast + 1 : 0; if (perf.fast >= 4) { perf.fast = 0; perf.offAt = gt; setAutoLow(false); } }
  }
  function setAutoLow(v) { autoLow = !!v; LOFX = lofxUser || autoLow; resize(); }
  function setAutoOn(v) { autoOn = !!v; try { localStorage.setItem('kellergruen.autolow', autoOn ? '1' : '0'); } catch (e) {} if (!autoOn && autoLow) setAutoLow(false); perf.latch = false; }
  function resize() {
    { const dp = window.devicePixelRatio || 1; DPR = autoLow ? Math.min(dp, 1.25) : GFX_Q === 0 ? Math.min(dp, 1.5) : Math.min(dp, 2); } // v135: Hoch zeichnet höchstens doppelt so fein (statt dreifach), spart auf iPhones viel Rechenzeit // v129: beim automatischen Sparen noch etwas geringer
    W = window.innerWidth; H = window.innerHeight;
    const fx = fullFix(); if (fx) { W = fx.w; H = fx.h; }
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
    try { ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; } catch (e) {}
    try { cv.style.filter = GFX_FX ? 'saturate(1.12) contrast(1.06) brightness(1.02)' : ''; } catch (e) {}
  }
  window.addEventListener('resize', () => { resize(); setTimeout(() => { try { placeNotes(); hudApply(); } catch (e) {} }, 50); });
  window.addEventListener('orientationchange', () => { setTimeout(resize, 250); fixBurst(); });
  window.addEventListener('resize', fixBurst); window.addEventListener('pageshow', fixBurst);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) fixBurst(); });
  const fixIv = setInterval(() => { try { if (!iosDev() || !iosStandalone()) return; const q = cv.getBoundingClientRect(), a = Math.min(screen.width, screen.height), b = Math.max(screen.width, screen.height), fh = innerWidth > innerHeight ? a : b; if (/iPhone|iPod/.test(navigator.userAgent) && (Math.abs(q.height - fh) > 2 || Math.abs(H - fh) > 2 || q.top)) screenFit(true); } catch (e) {} }, 1500); if (fixIv && fixIv.unref) fixIv.unref(); // v105: Waechter
  resize();
  // Hochformat: Standard ist Querformat; wer will, spielt auch hochkant (Einstellung im Handy unter Style)
  let portOk = store.get('kellergruen.view', '0') === '1';
  function applyView() { try { document.body.classList.toggle('port-ok', portOk); } catch (e) {} resize(); }
  const isPort = () => portOk && H > W;
  function setPortOk(v) { portOk = !!v; store.set('kellergruen.view', portOk ? '1' : '0'); applyView(); }
  applyView();
  // v89: Bild wieder passend an den Bildschirm setzen (z. B. wenn es auf dem iPhone nach der Tastatur oder dem Drehen nach oben verrutscht ist)
  const typing = () => { try { const a = document.activeElement; return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable) && a.type !== 'range' && a.type !== 'button'; } catch (e) { return false; } };
  function screenFit(quiet) {
    if (quiet && typing()) return; // v113: waehrend getippt wird nichts anfassen, sonst schliesst iOS sofort die Tastatur
    try { const a = document.activeElement; if (a && a.blur && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) a.blur(); } catch (e) {}
    try { window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; document.body.style.top = '0px'; } catch (e) {}
    resize(); try { placeNotes(); hudApply(); } catch (e) {} try { if (typeof tutOpen !== 'undefined' && tutOpen) tutLayout(); } catch (e) {}
    if (!quiet) try { msg('Bildschirm neu angepasst'); } catch (e) {}
  }
  try { document.addEventListener('focusout', e => { const t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) setTimeout(() => screenFit(true), 120); }); } catch (e) {}
  try { if (window.visualViewport) window.visualViewport.addEventListener('resize', () => setTimeout(() => { if (window.scrollY || document.documentElement.scrollTop) screenFit(true); }, 150)); } catch (e) {}
  window.addEventListener('orientationchange', () => setTimeout(() => screenFit(true), 400));
  try { document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(() => screenFit(true), 350); }); window.addEventListener('pageshow', () => setTimeout(() => screenFit(true), 350)); } catch (e) {} // v91: nach Rueckkehr in die App

  // ---------- Welt ----------
  const WW = 5200, WH = 2600, T = 12, YMIN = -1040; // v95: YMIN = neues Nordviertel oberhalb von y = 0 // v72: komplett neue Stadt im Raster, breitere Strassen // v69: Gewerbegebiet im Osten (Autohof, Mietlager, Gewerbestrasse) // v60: Karte nach Osten (Ostviertel) und Sueden (Flussufer, Suedstrasse) erweitert
  let XMIN = 0, GH_ON = false, viewX0 = -1e9, viewX1 = 1e9, viewY0 = -1e9, viewY1 = 1e9; const PLOT_W = 1480, MAX_PLOTS = 20; // Freunde-Keller liegen abseits links von x = 0 (v72: Besuch ueber den Kellertreff, nicht mehr an der Karte)
  const colliders = [];
  const R = (x, y, w, h) => { const r = { x, y, w, h }; colliders.push(r); return r; };
  // Keller (Innenraum x 52..600, y 52..508); v54: schmaler, dafuer Etagen ueber Treppen
  R(40, 40, 572, T); R(40, 40, T, 480); R(600, 40, T, 480); R(40, 508, 330, T); R(450, 508, 162, T);
  const IN = { x0: 52, y0: 52, x1: 600, y1: 508 };
  const DOOR = { x: 410, y: 484 };
  // Töpfe
  const POTS = [], POT_COLS = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const p = { x: 100 + c * 90, y: 120 + r * 110 }; POTS.push(p); POT_COLS.push(R(p.x - 17, p.y - 17, 34, 34)); }
  [[100, 340], [190, 340], [280, 340], [370, 340]].forEach(([x, y]) => { const p = { x, y }; POTS.push(p); POT_COLS.push(R(x - 17, y - 17, 34, 34)); });
  const RACK = { x: 515, y: 112, w: 140, h: 64 }, RACK_COL = R(445, 80, 140, 64);
  const TABLE = { x: 515, y: 290, w: 140 }, TABLE_COL = R(445, 262, 140, 56);
  const DESK_COL = { x: -9999, y: -9999, w: 0, h: 0 }; // v75: Schreibtisch entfernt, die Ecke ist frei gestaltbar
  // v54: Etagen. Hindernisse mit fl gelten nur auf ihrer Etage (0 = Erdgeschoss, -1 = Untergeschoss, 1 = 1. Etage)
  POT_COLS.concat([RACK_COL, TABLE_COL, DESK_COL]).forEach(c => { c.fl = 0; });
  // Treppen (34 x 44, ein Hindernis; man steht davor). Im Umbau verschiebbar. Erdgeschoss: runter und hoch, jede Etage: eine ins Erdgeschoss.
  const STAIR_D = { x: 490, y: 456 }, STAIR_U = { x: 550, y: 456 }, FLS = { '-1': { x: 525, y: 456 }, '1': { x: 525, y: 456 } }, FL_STAIR = FLS[-1];
  const stCol = (p, f) => { const c = R(p.x - 17, p.y - 22, 34, 44); c.fl = f; return c; };
  const STC = { d: stCol(STAIR_D, 0), u: stCol(STAIR_U, 0), '-1': stCol(FLS[-1], -1), '1': stCol(FLS[1], 1) };
  // v60: Drehen. 0..3 = 90-Grad-Schritte im Uhrzeigersinn. FDIR: Vorderseite von Gestell/Tisch (0 = unten), BDIR: Standplatz vor Treppe/Kiste (0 = oben)
  const FDIR = [[0, 1], [-1, 0], [0, -1], [1, 0]], BDIR = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const boxStand = (p, k) => { const d = BDIR[p.r || 0]; return { x: p.x + d[0] * k, y: p.y + d[1] * k }; };
  const stairStand = p => boxStand(p, 38);
  const FLPOTS = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) FLPOTS.push({ x: 100 + c * 90, y: 120 + r * 110 }); // Standardplaetze
  const FLP = {}, FLC = {}; // Topfplaetze und Hindernisse je Etage (im Umbau verschiebbar)
  for (const f of [-1, 1]) {
    FLP[f] = FLPOTS.map(p => ({ x: p.x, y: p.y }));
    FLC[f] = FLP[f].map(p => { const c = R(p.x - 17, p.y - 17, 34, 34); c.fl = f; return c; });
    R(370, 508, 80, T).fl = f; R(600, 400, T, 100).fl = f; // Tuer und Seitentuer gibt es nur im Erdgeschoss
  }
  // v54: jede Etage hat ihr eigenes Gestell und ihren Packtisch (im Umbau verschiebbar)
  const FLRK = {}, FLTB = {};
  for (const f of [-1, 1]) {
    FLRK[f] = { o: { x: 150, y: 428, w: 140, h: 64 }, c: R(80, 396, 140, 64) }; FLRK[f].c.fl = f;
    FLTB[f] = { o: { x: 330, y: 432, w: 140 }, c: R(260, 404, 140, 56) }; FLTB[f].c.fl = f;
  }
  // Sammelkiste im Erdgeschoss: hier legt der Laeufer die Beutel der Etagen ab
  const CRATE = { x: 245, y: 478 }, CRATE_COL = R(225, 464, 40, 28); CRATE_COL.fl = 0;
  const crateStand = () => boxStand(CRATE, 34); // v60: die Kiste ist im Umbau verschieb- und drehbar
  // ---------- v72: neue Stadt ----------
  // Raster aus breiten Strassen (Fahrbahn 120 bis 148 px, Gehwege je 30 px). Keller, Tabakscheune und Brauerei stehen am alten Platz,
  // alles andere ist neu: Haeuserreihen an allen Strassen, Stadtpark, Skaterpark, Spielplatz, Bolzplatz, Hundewiese, Uferpark, Gewerbe im Osten.
  const SW = 30;
  const RD = [
    { id: 'H1', h: 1, c0: 550, c1: 698, name: 'Hauptstraße' }, { id: 'H2', h: 1, c0: 1330, c1: 1450, name: 'Parkstraße' }, { id: 'H3', h: 1, c0: 2110, c1: 2230, name: 'Südstraße' },
    { id: 'V1', h: 0, c0: 642, c1: 762, name: 'Lindenstraße' }, { id: 'V2', h: 0, c0: 1770, c1: 1890, name: 'Scheunengasse' }, { id: 'V3', h: 0, c0: 2490, c1: 2610, name: 'Brauweg' },
    { id: 'V4', h: 0, c0: 3390, c1: 3510, name: 'Bergstraße' }, { id: 'V5', h: 0, c0: 4310, c1: 4430, name: 'Gewerbestraße' },
    { id: 'H0', h: 1, c0: -150, c1: -30, name: 'Nordallee' }, { id: 'HN', h: 1, c0: -900, c1: -780, name: 'Nordring' } // v95: Nordviertel
  ];
  const RDH = RD.filter(r => r.h), RDV = RD.filter(r => !r.h);
  const swLine = (r, s) => s < 0 ? r.c0 - SW / 2 : r.c1 + SW / 2; // Mitte des Gehwegs: s = -1 oben bzw. links, 1 unten bzw. rechts
  const onRoadway = (x, y) => RD.some(r => r.h ? y > r.c0 && y < r.c1 : x > r.c0 && x < r.c1);
  const RIVER = { x0: 0, x1: WW, y0: 1880, y1: 1960 }; // Fluss im Sueden, darueber Uferpark, darunter das Suedufer
  const UFER_N = 1858, UFER_S = 1982; // Uferwege
  const FOOT_X = [1266, 2190, 3005, 3905, 4825]; // Fussgaengerbruecken
  const BRIDGES = FOOT_X.map(x => ({ x0: x - 30, x1: x + 30, y0: RIVER.y0 - 8, y1: RIVER.y1 + 8, x }));
  const RBR = RDV.map(r => ({ x0: r.c0 - SW - 8, x1: r.c1 + SW + 8, y0: RIVER.y0 - 10, y1: RIVER.y1 + 10, x: (r.c0 + r.c1) / 2, road: 1 })); // Strassenbruecken
  const ALLB = BRIDGES.concat(RBR).sort((a, b) => a.x - b.x);
  const COLS = [[0, 612], [792, 1740], [1920, 2460], [2640, 3360], [3540, 4280], [4460, 5200]], ROWS = [[0, 520], [728, 1300], [1480, 1880], [1960, 2080], [2260, 2600]];
  // Haeuser: Reihen an den Strassen, Tuer zum Gehweg. Sortiert nach Entfernung vom Keller: die ersten werden zuerst freigeschaltet.
  const HOUSES = [];
  {
    const NM = ['Frau Brandt', 'Kemal', 'Lukas', 'Mia', 'Opa Heinz', 'Svenja', 'Dragan', 'Tilda', 'Ida', 'Jonas', 'Hanna', 'Ömer', 'Greta', 'Paul', 'Nadia', 'Fiete', 'Zoe', 'Bruno', 'Karin', 'Moritz',
      'Lena', 'Finn', 'Emma', 'Ben', 'Elias', 'Lea', 'Noah', 'Sophie', 'Leon', 'Marie', 'Luis', 'Clara', 'Felix', 'Lina', 'Henry', 'Anna', 'Theo', 'Ella', 'Maxi', 'Nele', 'Karl', 'Frieda', 'Anton', 'Mila', 'Oskar', 'Rosa', 'Emil', 'Luise', 'Jakob', 'Paula', 'Vincent', 'Herr Yilmaz', 'Frau Novak', 'Aylin', 'Mats', 'Jule', 'Hugo', 'Yara', 'Malte', 'Edda', 'Can', 'Wanda'];
    const PAL = [['#B9A48A', '#7A4A3A'], ['#8FA3B5', '#3E4E66'], ['#C2B48E', '#5E6B3E'], ['#B79AA8', '#6A3F55'], ['#9DB3A6', '#3F5A4E'], ['#C9A97E', '#8A4B2E'], ['#A39BC0', '#4A4270'], ['#C49A8E', '#7A3B36'], ['#A8B48E', '#4E5A34'], ['#B4A7C4', '#5A4A6E'], ['#D2C2A0', '#5B4A3A'], ['#9FB7C9', '#2F4B5E']];
    const rows = [ // [x-Liste, Breite, y oben, Tuer: 1 unten, -1 oben]
      [[812, 1000, 1188, 1376, 1564], 160, 352, 1], [[2660, 2840, 3020, 3200], 150, 352, 1],                // nordlich der Hauptstrasse
      [[20, 220, 420], 160, 747, -1], [[3560, 3740, 3920, 4100], 150, 747, -1],                             // suedlich der Hauptstrasse
      [[20, 220, 420], 160, 1132, 1], [[3560, 3740, 3920, 4100], 150, 1132, 1],                             // nordlich der Parkstrasse
      [[20, 220, 420], 160, 1499, -1], [[812, 1002, 1370, 1560], 160, 1499, -1], [[2655, 2815, 3055, 3215], 140, 1499, -1], [[3555, 3715, 3945, 4110], 150, 1499, -1], [[4470, 4630, 4870, 5035], 150, 1499, -1], // suedlich der Parkstrasse
      [[20, 220, 420], 160, 2279, -1], [[812, 1000, 1188, 1376, 1564], 160, 2279, -1], [[3560, 3740, 3920, 4100], 150, 2279, -1], [[4480, 4660, 4840, 5020], 150, 2279, -1] // suedlich der Suedstrasse
    ];
    const all = []; for (const [xs, w, y, face] of rows) for (const x of xs) all.push({ x, y, w, h: 150, face });
    all.sort((a, b) => Math.hypot(a.x + a.w / 2 - 410, a.y + 75 - 620) - Math.hypot(b.x + b.w / 2 - 410, b.y + 75 - 620));
    all.forEach((q, i) => { const p = PAL[(i * 5) % PAL.length]; HOUSES.push({ name: NM[i % NM.length], x: q.x, y: q.y, w: q.w, h: q.h, c: p[0], roof: p[1], dx: q.x + q.w / 2, dy: q.face === 1 ? q.y + q.h + 17 : q.y - 18, face: q.face, st: (i * 7 + 3) % 3 }); });
  }
  const HOUSE_N0 = HOUSES.length; // v95: alles danach liegt im Nordviertel
  const NORTH_GROUNDS = [[0, 612], [792, 1740], [2640, 3360], [3540, 4280], [4460, 5200]].map(([a, b]) => ({ t: 'garden', x: a, y: -575, w: b - a, h: 222 })).concat([{ t: 'park', x: 1920, y: -750, w: 540, h: 395 }, { t: 'park', x: 0, y: YMIN, w: WW, h: 100 }]);
  { const NM2 = ['Familie Weiß', 'Jannik', 'Selin', 'Herr Krüger', 'Merle', 'Tobias', 'Frau Schulz', 'Deniz', 'Ronja', 'Malte', 'Jasper', 'Konrad', 'Pia', 'Levin', 'Frau Lange', 'Ole', 'Hanne', 'Cem', 'Smilla', 'Arne', 'Ella-Marie', 'Bodo', 'Wiebke', 'Kai', 'Tamara', 'Lars', 'Frau Öztürk', 'Henrik', 'Lotta', 'Erik', 'Ines', 'Piet', 'Frau Graf', 'Milan', 'Svea', 'Gregor', 'Alma', 'Timo', 'Nora', 'Willi', 'Lia', 'Sami', 'Edda'];
    const PAL2 = [['#C9B79A', '#8A4B2E'], ['#A9BCCB', '#3E4E66'], ['#C7C09A', '#5E6B3E'], ['#C6A8B4', '#6A3F55'], ['#A8C2B4', '#3F5A4E'], ['#D4B88E', '#7A3B36'], ['#B2A8CC', '#4A4270'], ['#D8CCAE', '#5B4A3A']];
    const cols = [[[20, 220, 420], 160], [[812, 1000, 1188, 1376, 1564], 160], [[1940, 2120, 2300], 150], [[2660, 2840, 3020, 3200], 150], [[3560, 3740, 3920, 4100], 150], [[4480, 4660, 4840, 5020], 150]];
    const rows = []; cols.forEach(([xs, w], ci) => { rows.push([xs, w, -348, 1]); if (ci !== 2) rows.push([xs, w, -731, -1]); }); // Nordallee (Tuer unten) und Nordring (Tuer oben); Spalte 3 ist der Nordpark
    let i = 0; for (const [xs, w, y, face] of rows) for (const x of xs) { const p = PAL2[(i * 3) % PAL2.length]; HOUSES.push({ name: NM2[i % NM2.length], x, y, w, h: 150, c: p[0], roof: p[1], dx: x + w / 2, dy: face === 1 ? y + 150 + 17 : y - 18, face, st: (i * 5 + 1) % 3, north: 1 }); i++; } }
  const HOUSE_N1 = HOUSES.length; // v97: danach 4 Haeuser auf dem alten Werkstatt-Platz an der Suedstrasse
  [2660, 2840, 3020, 3200].forEach((x, i) => HOUSES.push({ name: ['Frau Petersen', 'Jaron', 'Leni', 'Herr Albers'][i], x, y: 2279, w: 150, h: 150, c: ['#C9B79A', '#A8C2B4', '#C6A8B4', '#B2A8CC'][i], roof: ['#7A3B36', '#3F5A4E', '#6A3F55', '#4A4270'][i], dx: x + 75, dy: 2279 - 18, face: -1, st: i % 3, ext: 1 }));
  HOUSES.forEach(h => R(h.x, h.y, h.w, h.h));
  const MAKLER_H = HOUSES.find(h => h.x === 2660 && h.y === 352); if (MAKLER_H) { MAKLER_H.office = 1; MAKLER_H.name = 'Immobilien Krämer'; } // v100: Maklerbuero, keine Kundschaft
  const MAKLER_AT = MAKLER_H ? { x: MAKLER_H.dx, y: MAKLER_H.y + MAKLER_H.h + 14 } : { x: -9999, y: -9999 };
  // Hinterzimmer der gekauften Laeden (player.fl = 3, gleiche Grundflaeche wie der Keller)
  R(370, 508, 80, T).fl = 3; R(600, 400, T, 100).fl = 3;
  const BIZ_EXIT = { x: 410, y: 482 }, BIZ_SAFE = { x: 520, y: 118 };
  const BIZ_SHELF = { x: 62, y: 330, w: 44, h: 150 }, BIZ_SHELF_AT = { x: 132, y: 405 }; // v102: Lager-Regal im Hinterzimmer
  [[BIZ_SAFE.x - 24, BIZ_SAFE.y - 30, 48, 40], [BIZ_SHELF.x, BIZ_SHELF.y, BIZ_SHELF.w, BIZ_SHELF.h]].forEach(([x, y, w, hh]) => { R(x, y, w, hh).fl = 3; });
  // Stadtpark mit Brunnen, Teich, Kiosk und Marktstand; Kellertreff (Treppe zu den Kellern der Freunde) an der Ecke zum Keller
  const FOUNTAIN = { x: 1266, y: 1014, r: 40 };
  R(FOUNTAIN.x - 34, FOUNTAIN.y - 34, 68, 68);
  const POND = { x: 860, y: 1120, w: 250, h: 128 }; R(POND.x + 6, POND.y + 6, POND.w - 12, POND.h - 12).water = 1;
  const TREFF = { x: 836, y: 774, w: 48, h: 36 }, TREFF_AT = { x: 860, y: 834 }; // v87: Kellertreff entfernt (Freunde liegen links neben dem Keller), Werte nur noch fuer alte Stellen
  // v61: Muelleimer. Mit B versteckt man dort seine Ware (Polizei und Gangs finden sie nicht), Mitspieler koennen sie ausraeumen.
  // v72: 30 Plaetze an den Gehwegen der neuen Stadt (Index bleibt, versteckte Ware wandert mit)
  const BINS = [[560, 526], [1080, 526], [1700, 526], [2700, 526], [3300, 526], [4000, 526], [4700, 526], [300, 722], [860, 722], [1500, 722], [2700, 722], [3600, 722], [4520, 722],
    [120, 1306], [980, 1306], [2300, 1306], [3250, 1306], [4200, 1306], [560, 1474], [1650, 1474], [2400, 1474], [3600, 1474], [4700, 1474], [900, 2086], [2800, 2086], [4000, 2086], [500, 2254], [2000, 2254], [3300, 2254], [5100, 2254], [400, -165], [1300, -15], [2200, -165], [2884, -15], [3900, -165], [4800, -15], [1100, -765], [2700, -765], [4500, -765]].map(([x, y]) => ({ x, y })); // v95: +9 im Nordviertel
  const BIN_MAX = 60; let binTgI = -1;
  // v75: nichts vor Hauseingaengen: Bereich zwischen Haustuer und Gehweg samt Platz des Kunden bleibt frei
  const doorZone = (x, y, m) => HOUSES.some(h => { const dy = h.face === 1 ? h.y + h.h : h.y, cy = h.face === 1 ? h.dy + 16 : h.dy - 16; return Math.abs(x - h.dx) < 30 + (m || 0) && y > Math.min(dy, cy) - 18 && y < Math.max(dy, cy) + 18; });
  for (const b of BINS) for (const dx of [0, 50, -50, 100, -100, 150, -150]) { const x = b.x + dx; if (!doorZone(x, b.y, 8) && !RDV.some(v => x > v.c0 - SW - 20 && x < v.c1 + SW + 20)) { b.x = x; break; } }
  const BENCHES = [{ x: 1090, y: 984, w: 52 }, { x: 1530, y: 984, w: 52 }, { x: 1090, y: 1044, w: 52 }, { x: 1530, y: 1044, w: 52 }, { x: 1166, y: 900, w: 52 }, { x: 1366, y: 900, w: 52 }, { x: 1166, y: 1128, w: 52 }, { x: 1366, y: 1128, w: 52 },
    { x: 1236, y: 848, w: 14, h: 46 }, { x: 1296, y: 848, w: 14, h: 46 },
    { x: 140, y: 1815, w: 52 }, { x: 540, y: 1815, w: 52 }, { x: 880, y: 1815, w: 52 }, { x: 1130, y: 1815, w: 52 }, { x: 1420, y: 1815, w: 52 }, { x: 1650, y: 1815, w: 52 }, { x: 2830, y: 1815, w: 52 }, { x: 3200, y: 1815, w: 52 }, { x: 3700, y: 1815, w: 52 }, { x: 4100, y: 1815, w: 52 }, { x: 4620, y: 1815, w: 52 }, { x: 5060, y: 1815, w: 52 },
    { x: 400, y: 2028, w: 52 }, { x: 1500, y: 2028, w: 52 }, { x: 2800, y: 2028, w: 52 }, { x: 2300, y: 2028, w: 52 }, { x: 3600, y: 2028, w: 52 }, { x: 4600, y: 2028, w: 52 },
    { x: 1990, y: 1800, w: 52 }, { x: 2400, y: 1806, w: 52 }, { x: 2000, y: 2560, w: 52 }, { x: 2380, y: 2560, w: 52 }, { x: 2720, y: 960, w: 52 }, { x: 3290, y: 960, w: 52 }, { x: 3640, y: 505, w: 52 }, { x: 4180, y: 505, w: 52 }];
  BENCHES.push({ x: 2110, y: -600, w: 52 }, { x: 2270, y: -600, w: 52 }, { x: 2110, y: -500, w: 52 }, { x: 2270, y: -500, w: 52 }); // v95: Nordpark
  BENCHES.forEach(b => { b.h = b.h || 14; R(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h); });
  // Zaeune (Hindernisse) um Skaterpark, Spielplatz, Bolzplatz und Hundewiese, mit Eingaengen an den Wegen
  const FENCES = [], fenceH = (y, x0, x1, gaps) => { let x = x0; for (const g of (gaps || []).concat([[x1, x1]])) { if (g[0] > x) FENCES.push({ x, y: y - 2, w: g[0] - x, h: 4 }); x = g[1]; } }, fenceV = (x, y0, y1, gaps) => { let y = y0; for (const g of (gaps || []).concat([[y1, y1]])) { if (g[0] > y) FENCES.push({ x: x - 2, y, w: 4, h: g[0] - y }); y = g[1]; } };
  const SKATE = { x: 2650, y: 738, w: 700, h: 552 }, PLAY = { x: 1932, y: 1492, w: 218, h: 338 } /* v108: schmaler, rechts steht das Iron Gym */, PITCH = { x: 3570, y: 30, w: 680, h: 450 }, DOGS = { x: 1932, y: 2272, w: 516, h: 316 };
  fenceH(SKATE.y, SKATE.x, SKATE.x + SKATE.w, [[2975, 3035]]); fenceH(SKATE.y + SKATE.h, SKATE.x, SKATE.x + SKATE.w, [[2975, 3035]]); fenceV(SKATE.x, SKATE.y, SKATE.y + SKATE.h, [[984, 1044]]); fenceV(SKATE.x + SKATE.w, SKATE.y, SKATE.y + SKATE.h, [[984, 1044]]);
  fenceH(PLAY.y, PLAY.x, PLAY.x + PLAY.w); fenceH(PLAY.y + PLAY.h, PLAY.x, PLAY.x + PLAY.w); fenceV(PLAY.x, PLAY.y, PLAY.y + PLAY.h); fenceV(PLAY.x + PLAY.w, PLAY.y, PLAY.y + PLAY.h, [[1640, 1700]]); // v108: Eingang vom Weg aus
  fenceH(PITCH.y, PITCH.x, PITCH.x + PITCH.w); fenceH(PITCH.y + PITCH.h, PITCH.x, PITCH.x + PITCH.w, [[3880, 3940]]); fenceV(PITCH.x, PITCH.y, PITCH.y + PITCH.h); fenceV(PITCH.x + PITCH.w, PITCH.y, PITCH.y + PITCH.h);
  fenceH(DOGS.y, DOGS.x, DOGS.x + DOGS.w, [[2160, 2220]]); fenceH(DOGS.y + DOGS.h, DOGS.x, DOGS.x + DOGS.w); fenceV(DOGS.x, DOGS.y, DOGS.y + DOGS.h); fenceV(DOGS.x + DOGS.w, DOGS.y, DOGS.y + DOGS.h);
  FENCES.forEach(f => R(f.x, f.y, f.w, f.h));
  // v73: Baeche (Nord-Sued) mit Holzbruecken von links nach rechts, wo Wege sie kreuzen
  const BROOKS = [{ x: 985, y0: 880, y1: 1124, by: [1014] }].concat([300, 1180, 2900, 4180, 5130].map(x => ({ x, y0: 1662, y1: RIVER.y0, by: [UFER_N] })), [520, 3800].map(x => ({ x, y0: RIVER.y1, y1: 2076, by: [UFER_S] })));
  const HBR = []; // Holzbruecken quer (links nach rechts)
  for (const b of BROOKS) { let y = b.y0; for (const by of b.by.concat([b.y1 + 20])) { const e = Math.min(by - 20, b.y1); if (e > y) R(b.x - 11, y, 22, e - y).water = 1; y = by + 20; } for (const by of b.by) HBR.push({ x0: b.x - 22, x1: b.x + 22, y0: by - 21, y1: by + 21, x: b.x, y: by }); }
  // Skaterpark: Halfpipe und zwei Graffitiwaende sind Hindernisse, Bowl, Funbox und Rails kann man ueberqueren (spaeter kommen hier Skater-Kunden hin)
  const HALFPIPE = { x: 2690, y: 780, w: 250, h: 116 }, GRAFF = [{ x: 3080, y: 786, w: 230, h: 14, s: 0 }, { x: 2700, y: 1212, w: 230, h: 14, s: 1 }], BOWL = { x: 3090, y: 1080, w: 210, h: 170 }, FUNBOX = { x: 2760, y: 1062, w: 130, h: 56 };
  R(HALFPIPE.x, HALFPIPE.y, HALFPIPE.w, HALFPIPE.h); GRAFF.forEach(g => R(g.x, g.y, g.w, g.h));
  // Spielplatz-Geraete und Tore
  const PLAYEQ = [{ t: 'swing', x: 1980, y: 1536, w: 110, h: 24 }, { t: 'slide', x: 2098, y: 1704, w: 40, h: 84 }, { t: 'climb', x: 1948, y: 1740, w: 90, h: 76 }, { t: 'seesaw', x: 1990, y: 1700, w: 84, h: 14 }];
  PLAYEQ.forEach(p => R(p.x, p.y, p.w, p.h));
  const PGOALS = [{ x: PITCH.x + 10, y: 225, w: 18, h: 80 }, { x: PITCH.x + PITCH.w - 28, y: 225, w: 18, h: 80 }]; PGOALS.forEach(g => R(g.x, g.y, g.w, g.h));
  const SHEDS = [[860, 70], [1060, 120], [1290, 60], [1490, 130], [1650, 70], [2700, 90], [3240, 70]].map(([x, y], i) => ({ x, y, w: 46, h: 34, c: ['#7A5A3E', '#5E7A5A', '#8A6A5A', '#5A6E8A'][i % 4] })); SHEDS.forEach(s => R(s.x, s.y, s.w, s.h));
  // Laternen an allen Strassen (ohne Kreuzungen und Bruecken)
  // v73: Laternen werden weiter unten nach den Wegen verteilt (LAMPS)
  // Kiosk (Stadtpark, Ecke Hauptstrasse) und Marktstand am Brunnenplatz; beide sind Hindernisse
  const KIOSK = { x: 1600, y: 760, w: 66, h: 40 }, STALL = { x: 1420, y: 1150, w: 76, h: 30 };
  // v72: Gewerbe im Osten: Autohof (Ecke Haupt-/Gewerbestrasse), Mietlager mit Containerhof, Werkstatt im Sueden an der Suedstrasse
  const AH_LOT = { x: 4480, y: 236, w: 700, h: 268 }, AUTOHOF = { x: 4500, y: 250, w: 290, h: 120 }, AH_AT = { x: 4645, y: 398 };
  const PARK_LOT = { x: 4480, y: 760, w: 340, h: 250 }; // Parkplatz (Deko) v97: oben in der Vergnuegungsmeile
  const LAGER = { x: 4486, y: 40, w: 300, h: 170 }, LAGER_AT = { x: 4636, y: 10 }; // v97: Gewerbegebiet an der Nordallee
  const WS_LOT = { x: 4830, y: 8, w: 362, h: 218 }, WERK = { x: 4846, y: 58, w: 330, h: 116 }, WS_AT = { x: 5011, y: 30 }; // v97: Gewerbegebiet an der Nordallee
  const CONTAINERS = [[4860, 780, 120, 44, '#B5473A'], [4860, 828, 120, 44, '#2F6FD6'], [5040, 780, 120, 44, '#3FAE6A'], [5040, 900, 120, 44, '#E8B44A'], [4870, 990, 44, 120, '#8A5FC9'], [5110, 1040, 44, 120, '#B5473A'], [4930, 1190, 120, 44, '#2F6FD6'], [5060, 1238, 120, 44, '#3FAE6A']];
  R(LAGER.x, LAGER.y, LAGER.w, LAGER.h); R(AUTOHOF.x, AUTOHOF.y, AUTOHOF.w, AUTOHOF.h); R(WERK.x, WERK.y, WERK.w, WERK.h); CONTAINERS.forEach(c => R(c[0], c[1], c[2], c[3]));
  R(KIOSK.x, KIOSK.y, KIOSK.w, KIOSK.h); R(STALL.x, STALL.y, STALL.w, STALL.h);
  // Umlauf-Hindernisse fuer Streifen und Kunden (Rechtecke samt Rand)
  const obRect = (x, y, w, h, m) => ({ x0: x - m, y0: y - m, x1: x + w + m, y1: y + h + m });
  const OBST = [obRect(FOUNTAIN.x - 40, FOUNTAIN.y - 40, 80, 80, 12), obRect(KIOSK.x, KIOSK.y, KIOSK.w, KIOSK.h, 14), obRect(STALL.x, STALL.y, STALL.w, STALL.h, 14), obRect(POND.x, POND.y, POND.w, POND.h, 10), obRect(HALFPIPE.x, HALFPIPE.y, HALFPIPE.w, HALFPIPE.h, 10)].concat(GRAFF.map(g => obRect(g.x, g.y, g.w, g.h, 10)), PLAYEQ.map(p => obRect(p.x, p.y, p.w, p.h, 10)));
  const obstAt = (x, y) => { for (const o of OBST) if (x > o.x0 && x < o.x1 && y > o.y0 && y < o.y1) return o; return null; };
  const PIER = { x0: 3700, x1: 3748, y0: UFER_N + 14, y1: 1946, boat: { x: 3794, y: 1914 } }; // v109: Bootssteg von Bootsmann Piet
  { let x = RIVER.x0; for (const b of ALLB.concat([{ x0: PIER.x0, x1: PIER.x1, pier: 1 }, { x0: RIVER.x1, x1: RIVER.x1 }]).sort((a, b) => a.x0 - b.x0)) { if (b.x0 > x) R(x, RIVER.y0, b.x0 - x, RIVER.y1 - RIVER.y0).river = 1; if (b.pier) R(b.x0, PIER.y1, b.x1 - b.x0, RIVER.y1 - PIER.y1).river = 1; x = b.x1; } } // Fluss mit Luecken an den Bruecken, am Steg nur das Ende im Wasser
  R(PIER.boat.x - 40, PIER.boat.y - 16, 80, 32).river = 1;
  // Tabakscheune (Innenraum x 1932..2448, y 52..508), rechts neben dem Platz
  const BARN_WALLS = [R(1920, 40, 540, T), R(1920, 40, T, 480), R(2448, 40, T, 480), R(1920, 508, 230, T), R(2230, 508, 230, T)];
  const IN2 = { x0: 1932, y0: 52, x1: 2448, y1: 508 };
  const DOOR2 = { x: 2190, y: 484 };
  const BARN_GATE = R(2150, 508, 80, T);
  const POTS2 = [], POT2_COLS = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const p = { x: 1990 + c * 95, y: 130 + r * 110 }; POTS2.push(p); POT2_COLS.push(R(p.x - 17, p.y - 17, 34, 34)); }
  [[1990, 350], [2085, 350], [2180, 350], [2275, 350]].forEach(([x, y]) => { const p = { x, y }; POTS2.push(p); POT2_COLS.push(R(x - 17, y - 17, 34, 34)); });
  const RACK2 = { x: 2375, y: 112, w: 130, h: 64 }, RACK2_COL = R(2310, 80, 130, 64);
  const TABLE2 = { x: 2375, y: 290, w: 130 }, TABLE2_COL = R(2310, 262, 130, 56);
  R(1960, 420, 110, 46); // Kisten (Deko)
  // Zweiter Wandteil der Seitentuer (ausserhalb, solange die Tuer nicht gekauft ist)
  // Brauerei (Innenraum x 1932..2448, y 740..1196), unter der Tabakscheune, Tuer oben zur Strasse
  const BREW_WALLS = [R(1920, 728, 172, T), R(2172, 728, 288, T), R(1920, 728, T, 480), R(2448, 728, T, 480), R(1920, 1196, 540, T)];
  const IN3 = { x0: 1932, y0: 740, x1: 2448, y1: 1196 };
  const DOOR3 = { x: 2132, y: 764 };
  const BREW_GATE = R(2092, 728, 80, T);
  const isGate = c => c === BARN_GATE || c === BREW_GATE;
  const POTS3 = [], POT3_COLS = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) { const p = { x: 1990 + c * 95, y: 818 + r * 110 }; POTS3.push(p); POT3_COLS.push(R(p.x - 17, p.y - 17, 34, 34)); }
  [[1990, 1038], [2085, 1038], [2180, 1038], [2275, 1038]].forEach(([x, y]) => { const p = { x, y }; POTS3.push(p); POT3_COLS.push(R(x - 17, y - 17, 34, 34)); });
  const RACK3 = { x: 2375, y: 800, w: 130, h: 64 }, RACK3_COL = R(2310, 768, 130, 64);
  const TABLE3 = { x: 2375, y: 978, w: 130 }, TABLE3_COL = R(2310, 950, 130, 56);
  R(1960, 1108, 110, 46); // Faesser (Deko)
  const SIDE_B = { keller: R(-9999, 490, T, 30), tabak: R(-9999, 490, T, 30), brau: R(-9999, 490, T, 30) };

  // ---------- v72: Wege der neuen Stadt ----------
  // Linien fuer das Wegenetz. k: 'w' Gehweg und Uferweg, 'k' Park- und Brueckenweg (Polizei erlaubt), 'p' Trampelpfad (die Polizei kommt nicht hinein)
  const NAV_HL = [], NAV_VL = [], NAV_X = [];
  {
    const hl = (y, x0, x1, k) => NAV_HL.push({ y, x0, x1, k }), vl = (x, y0, y1, k) => NAV_VL.push({ x, y0, y1, k });
    for (const r of RD) for (const s of [-1, 1]) { const c = swLine(r, s); if (r.h) hl(c, 15, WW - 15, 'w'); else vl(c, YMIN + 15, WH - 15, 'w'); }
    hl(UFER_N, 15, WW - 15, 'w'); hl(UFER_S, 15, WW - 15, 'w');
    vl(1266, 713, 924, 'k'); vl(1266, 1104, 1315, 'k'); hl(1014, 777, 1176, 'k'); hl(1014, 1356, 1755, 'k'); // Stadtpark: Kreuz und Ring um den Brunnen
    NAV_X.push([1176, 1014, 1266, 924], [1266, 924, 1356, 1014], [1356, 1014, 1266, 1104], [1266, 1104, 1176, 1014]);
    for (const x of FOOT_X) vl(x, 1465, 2095, 'k');                       // von der Parkstrasse ueber die Fussgaengerbruecken zur Suedstrasse
    for (const x of [1266, 2190, 3005]) vl(x, 1315, 1465, 'w');           // Zebrastreifen ueber die Parkstrasse
    vl(2190, 2095, 2245, 'w'); vl(2190, 2245, 2430, 'k');                 // Hundewiese
    vl(3005, 713, 1315, 'k'); hl(1014, 2625, 3375, 'k');                  // Skaterpark
    vl(3910, 265, 535, 'k'); hl(265, 3640, 4180, 'k');                    // Bolzplatz
    for (const [y, x0, x1, xs] of [[320, 777, 1755, [1174, 1550]], [320, 2625, 3375, [2825, 3185]]]) { hl(y, x0, x1, 'p'); for (const x of xs) vl(x, y, 535, 'p'); } // hinter den Haeusern an der Hauptstrasse
    hl(1015, 15, 627, 'p'); vl(200, 713, 1015, 'p'); vl(400, 1015, 1315, 'p');
    hl(1015, 3525, 4295, 'p'); vl(3725, 713, 1015, 'p'); vl(4085, 1015, 1315, 'p');
    vl(400, 1465, 1858, 'p'); vl(987, 1465, 1858, 'p');                    // zwischen den Haeusern zum Uferpark
    for (const [x0, x1, xs] of [[15, 627, [200]], [777, 1755, [1174]], [3525, 4295, [3725]], [4445, 5185, [4645]]]) { hl(2500, x0, x1, 'p'); for (const x of xs) vl(x, 2245, 2500, 'p'); } // hinter der Suedstrasse
  }
  // Trampelpfade als Flaechen (fuer Zeichnen und das Polizeiverbot): 30 px breit, sie enden am Rand des Gehwegs
  const PATHS = [];
  {
    const isW = (ax, v) => ax === 'h' ? NAV_VL.some(l => l.k === 'w' && Math.abs(l.x - v) < 1) : NAV_HL.some(l => l.k === 'w' && Math.abs(l.y - v) < 1);
    for (const h of NAV_HL) if (h.k === 'p') PATHS.push({ x0: h.x0 + (isW('h', h.x0) ? 15 : -15), x1: h.x1 - (isW('h', h.x1) ? 15 : -15), y0: h.y - 15, y1: h.y + 15 });
    for (const v of NAV_VL) if (v.k === 'p') PATHS.push({ x0: v.x - 15, x1: v.x + 15, y0: v.y0 + (isW('v', v.y0) ? 15 : -15), y1: v.y1 - (isW('v', v.y1) ? 15 : -15) });
  }
  // Abstand zum naechsten Weg (Baeume und Deko halten die Wege frei)
  function lineDist(x, y) {
    let d = 1e9;
    for (const h of NAV_HL) if (x >= h.x0 - 16 && x <= h.x1 + 16) d = Math.min(d, Math.abs(y - h.y));
    for (const v of NAV_VL) if (y >= v.y0 - 16 && y <= v.y1 + 16) d = Math.min(d, Math.abs(x - v.x));
    if (Math.hypot(x - FOUNTAIN.x, y - FOUNTAIN.y) < 150) d = 0;
    return d;
  }
  const inR = (r, x, y, m) => x > r.x - (m || 0) && x < r.x + r.w + (m || 0) && y > r.y - (m || 0) && y < r.y + r.h + (m || 0);
  const onStreet = (x, y, m) => RD.some(r => r.h ? y > r.c0 - SW - m && y < r.c1 + SW + m : x > r.c0 - SW - m && x < r.c1 + SW + m) || (y > UFER_N - 24 && y < UFER_S + 24);
  const LOTS = [AH_LOT, PARK_LOT, LAGER, WS_LOT, { x: 4840, y: 770, w: 360, h: 520 }, { x: 40, y: 40, w: 572, h: 480 }, { x: 1920, y: 40, w: 540, h: 1168 }];
  const TREES = [], bushes = [];
  (function () {
    let seed = 72; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const zoneOf = (x, y) => [SKATE, PLAY, PITCH, DOGS].find(z => inR(z, x, y, 8));
    const free = (x, y, m) => { for (const c of colliders) if (x > c.x - m && x < c.x + c.w + m && y > c.y - m && y < c.y + c.h + m) return false; return true; };
    const place = (x0, y0, x1, y1, n, inside) => {
      for (let k = 0, got = 0; k < n * 12 && got < n; k++) {
        const x = Math.round(x0 + rnd() * (x1 - x0)), y = Math.round(y0 + rnd() * (y1 - y0)), cy = y + 12;
        if (onStreet(x, cy, 10) || lineDist(x, cy) < 30 || LOTS.some(l => inR(l, x, cy, 16)) || inR(TREFF, x, cy, 40) || inR(KIOSK, x, cy, 40) || inR(POND, x, cy, 18)) continue;
        if ((zoneOf(x, cy) || null) !== (inside || null)) continue;
        if (!free(x, cy, 22) || TREES.some(t => Math.hypot(t[0] - x, t[1] - y) < 64)) continue;
        TREES.push([x, y]); R(x - 7, y + 6, 14, 12); got++;
      }
    };
    place(800, 735, 1735, 1290, 30);            // Stadtpark
    place(800, 10, 1735, 285, 9); place(2650, 10, 3355, 285, 8); // Kleingaerten und Hinterhoefe im Norden
    place(10, 905, 600, 1120, 6); place(3550, 905, 4270, 1120, 6); // Hinterhoefe an der Hauptstrasse
    place(10, 1660, WW - 10, 1830, 36);        // Uferpark
    place(10, 2004, WW - 10, 2074, 18);        // Suedufer
    place(10, 2518, WW - 10, 2590, 18);        // Gaerten im Sueden
    place(DOGS.x + 20, DOGS.y + 30, DOGS.x + DOGS.w - 20, DOGS.y + DOGS.h - 40, 6, DOGS);
    place(4480, 10, 5190, 220, 5); place(1930, 1215, 2450, 1290, 3);
    for (let i = 0; i < 260; i++) { // Buesche (nur Deko)
      const x = rnd() * WW, y = rnd() * WH;
      if (onStreet(x, y, 4) || lineDist(x, y) < 22 || LOTS.some(l => inR(l, x, y, 10)) || zoneOf(x, y) === SKATE || zoneOf(x, y) === PITCH || inR(TREFF, x, y, 30) || inR(KIOSK, x, y, 30) || inR(POND, x, y, 6)) continue;
      if (!free(x, y, 12)) continue;
      bushes.push({ x, y, r: 7 + rnd() * 7 });
    }
  })();
  // v95: Baeume und Buesche im Nordviertel (eigener Zufall, damit der Rest der Stadt gleich bleibt)
  { let sd = 950; const rn = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    const ok = (x, y, m) => !colliders.some(c => x > c.x - m && x < c.x + c.w + m && y > c.y - m && y < c.y + c.h + m) && !onStreet(x, y, 10) && !TREES.some(t => Math.hypot(t[0] - x, t[1] + 12 - y) < 62);
    for (const z of NORTH_GROUNDS) { const n = z.y === YMIN ? 42 : z.t === 'park' ? 12 : 4; for (let k = 0, got = 0; k < n * 14 && got < n; k++) { const x = Math.round(z.x + 20 + rn() * (z.w - 40)), y = Math.round(z.y + 20 + rn() * (z.h - 40)); if (!ok(x, y, 22)) continue; TREES.push([x, y - 12]); R(x - 7, y - 6, 14, 12); got++; }
      for (let k = 0; k < (z.y === YMIN ? 40 : 10); k++) { const x = z.x + 10 + rn() * (z.w - 20), y = z.y + 10 + rn() * (z.h - 20); if (ok(x, y, 12)) bushes.push({ x, y, r: 7 + rn() * 7 }); } } }
  // v99: keine Baumkronen ueber Gehwegen und Uferwegen
  { const bands = RD.map(r => r.h ? [0, r.c0 - SW, WW, r.c1 + SW] : [r.c0 - SW, YMIN, r.c1 + SW, WH]).concat([[0, UFER_N - 15, WW, UFER_N + 15], [0, UFER_S - 15, WW, UFER_S + 15]]);
    for (let i = TREES.length - 1; i >= 0; i--) { const t = TREES[i], x0 = t[0] - 24, x1 = t[0] + 24, y0 = t[1] - 34, y1 = t[1] + 20; if (!bands.some(b => x0 < b[2] && x1 > b[0] && y0 < b[3] && y1 > b[1])) continue; const ci = colliders.findIndex(c => c.x === t[0] - 7 && c.y === t[1] + 6 && c.w === 14 && c.h === 12); if (ci >= 0) colliders.splice(ci, 1); TREES.splice(i, 1); }
    for (let i = bushes.length - 1; i >= 0; i--) { const b0 = bushes[i]; if (bands.some(b => b0.x + b0.r > b[0] && b0.x - b0.r < b[2] && b0.y + b0.r > b[1] && b0.y - b0.r < b[3])) bushes.splice(i, 1); } }
  // v89: Floras Blumengarten im Norden (statt der Kleingaerten): Wege, Brunnenplatz mit Springbrunnen, bunte Beete, Baenke, Rosenbogen
  const FG = { x: 792, y: 0, w: 948, h: 300, cx: 1266, cy: 150 };
  { const inFG = (x, y) => x > FG.x + 4 && x < FG.x + FG.w - 4 && y > FG.y && y < FG.y + FG.h - 6;
    for (let i = TREES.length - 1; i >= 0; i--) { const t = TREES[i]; if (!inFG(t[0], t[1] + 12)) continue; const ci = colliders.findIndex(c => c.x === t[0] - 7 && c.y === t[1] + 6 && c.w === 14 && c.h === 12); if (ci >= 0) colliders.splice(ci, 1); TREES.splice(i, 1); }
    for (let i = bushes.length - 1; i >= 0; i--) if (inFG(bushes[i].x, bushes[i].y)) bushes.splice(i, 1);
    for (let i = SHEDS.length - 1; i >= 0; i--) { const s = SHEDS[i]; if (!inFG(s.x + s.w / 2, s.y + s.h / 2)) continue; const ci = colliders.findIndex(c => c.x === s.x && c.y === s.y && c.w === s.w && c.h === s.h); if (ci >= 0) colliders.splice(ci, 1); SHEDS.splice(i, 1); } }
  const FG_BEDS = [ // rechteckige Beete (Hindernisse) und runde Beete
    { x: 836, y: 34, w: 170, h: 70, c: ['#FF7EB6', '#FFD24A', '#F4F4F8'] }, { x: 836, y: 196, w: 170, h: 70, c: ['#B983FF', '#FF5C7A', '#FFD24A'] },
    { x: 1526, y: 34, w: 170, h: 70, c: ['#FF5C7A', '#F4F4F8', '#B983FF'] }, { x: 1526, y: 196, w: 170, h: 70, c: ['#FFD24A', '#FF7EB6', '#7FD0FF'] },
    { r: 30, x: 1100, y: 70, c: ['#FF5C7A', '#FFD24A'] }, { r: 30, x: 1100, y: 230, c: ['#B983FF', '#F4F4F8'] }, { r: 30, x: 1432, y: 70, c: ['#FF7EB6', '#FFD24A'] }, { r: 30, x: 1432, y: 230, c: ['#7FD0FF', '#FF5C7A'] }
  ];
  FG_BEDS.forEach(b => { if (b.r) R(b.x - b.r * 0.72, b.y - b.r * 0.72, b.r * 1.44, b.r * 1.44); else R(b.x, b.y, b.w, b.h); });
  R(FG.cx - 26, FG.cy - 26, 52, 52); // Springbrunnen
  const FG_BENCH = [[FG.cx - 70, FG.cy - 50, 0], [FG.cx + 70, FG.cy - 50, 0], [FG.cx - 70, FG.cy + 50, 1], [FG.cx + 70, FG.cy + 50, 1]];
  function drawFloraGarden(z, a, b, c, d) {
    const cx = FG.cx, cy = FG.cy;
    ctx.fillStyle = '#2C5A35'; ctx.fillRect(a, c, b - a, d - c);
    ctx.fillStyle = 'rgba(255,255,255,.035)'; for (let x = Math.floor(a / 40) * 40; x < b; x += 80) ctx.fillRect(Math.max(a, x), c, 40, d - c);
    // Hecke rundherum (Eingaenge unten in der Mitte und an den Seiten)
    ctx.fillStyle = '#1C3D24';
    const hedge = (x, y, w, h) => { if (x + w < a || x > b || y + h < c || y > d) return; ctx.fillStyle = '#1C3D24'; rr(x, y, w, h, 4); ctx.fill(); ctx.fillStyle = 'rgba(120,200,110,.18)'; for (let k = x + 4; k < x + w - 2; k += 9) ctx.fillRect(k, y + 2, 4, 3); };
    hedge(FG.x, 0, 8, 120); hedge(FG.x, 180, 8, 112); hedge(FG.x + FG.w - 8, 0, 8, 120); hedge(FG.x + FG.w - 8, 180, 8, 112);
    hedge(FG.x, 284, cx - 40 - FG.x, 10); hedge(cx + 40, 284, FG.x + FG.w - cx - 40, 10);
    // Kieswege und Brunnenplatz
    ctx.fillStyle = '#B9A98A'; ctx.fillRect(FG.x + 8, cy - 14, FG.w - 16, 28); ctx.fillRect(cx - 14, 0, 28, 294);
    ctx.beginPath(); ctx.arc(cx, cy, 74, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#9E8F72'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 74, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,.06)'; for (let x = Math.floor(a / 23) * 23; x < b; x += 23) for (let y = Math.floor(c / 19) * 19; y < d; y += 19) { const px = x + ((y * 7) % 13), py = y + ((x * 3) % 7); if ((Math.abs(py - cy) < 13 && px > FG.x + 8 && px < FG.x + FG.w - 8) || Math.abs(px - cx) < 13 || Math.hypot(px - cx, py - cy) < 72) ctx.fillRect(px, py, 2, 2); }
    // Beete
    for (const bd of FG_BEDS) {
      if (bd.r) { if (bd.x + bd.r < a || bd.x - bd.r > b) continue;
        ctx.fillStyle = '#8C7A5E'; ctx.beginPath(); ctx.arc(bd.x, bd.y, bd.r + 3, 0, TAU); ctx.fill(); ctx.fillStyle = '#4A3424'; ctx.beginPath(); ctx.arc(bd.x, bd.y, bd.r, 0, TAU); ctx.fill();
        for (let ring = 0; ring < 3; ring++) { const rr2 = ring * 10, n = ring ? ring * 8 : 1; for (let k = 0; k < n; k++) { const an = k * TAU / n + ring * 0.4, fx = bd.x + Math.cos(an) * rr2, fy = bd.y + Math.sin(an) * rr2; fgFlower(fx, fy, bd.c[(ring + k) % 2], ring === 0 ? 5 : 3.6, k + ring * 9); } }
      } else { if (bd.x + bd.w < a || bd.x > b) continue;
        ctx.fillStyle = '#8C7A5E'; rr(bd.x - 3, bd.y - 3, bd.w + 6, bd.h + 6, 6); ctx.fill(); ctx.fillStyle = '#4A3424'; rr(bd.x, bd.y, bd.w, bd.h, 5); ctx.fill();
        for (let row = 0; row < 4; row++) for (let k = 0; k < 11; k++) { const fx = bd.x + 10 + k * 15 + (row % 2) * 7, fy = bd.y + 11 + row * 16; if (fx > bd.x + bd.w - 6) continue; fgFlower(fx, fy, bd.c[row % 3], 3.4, row * 13 + k); }
      }
    }
    // Baenke am Platz
    for (const [bx, by, f] of FG_BENCH) { if (bx + 20 < a || bx - 20 > b) continue; ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(bx - 17, by - 3, 36, 10); ctx.fillStyle = '#7A5232'; ctx.fillRect(bx - 18, by - 6, 36, 9); ctx.fillStyle = '#9A6A42'; ctx.fillRect(bx - 18, by - 6, 36, 2); ctx.fillRect(bx - 18, by - 2, 36, 2); ctx.fillStyle = '#2B3039'; ctx.fillRect(bx - 16, by + (f ? -8 : 3), 32, 2); }
    // Springbrunnen
    if (cx + 40 > a && cx - 40 < b) {
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + 4, 34, 30, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#C9C2B4'; ctx.beginPath(); ctx.arc(cx, cy, 32, 0, TAU); ctx.fill(); ctx.fillStyle = '#A9A294'; ctx.beginPath(); ctx.arc(cx, cy, 28, 0, TAU); ctx.fill();
      const wg = ctx.createRadialGradient(cx, cy, 4, cx, cy, 27); wg.addColorStop(0, '#7FD6F2'); wg.addColorStop(1, '#3E9BC9'); ctx.fillStyle = wg; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; for (let k = 0; k < 3; k++) { const ph = (gt * 0.5 + k / 3) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(cx, cy, 8 + ph * 17, 0, TAU); ctx.stroke(); } ctx.globalAlpha = 1;
      ctx.fillStyle = '#E2DCCF'; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, TAU); ctx.fill(); ctx.fillStyle = '#C9C2B4'; ctx.beginPath(); ctx.arc(cx, cy, 4, 0, TAU); ctx.fill();
      for (let k = 0; k < 10; k++) { const ph = (gt * 1.1 + k / 10) % 1, an = k * TAU / 10 + 0.3, r2 = 3 + ph * 18; ctx.fillStyle = 'rgba(220,245,255,' + (0.85 * (1 - ph)).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(cx + Math.cos(an) * r2, cy + Math.sin(an) * r2 - Math.sin(ph * Math.PI) * 10, 1.4, 0, TAU); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(cx, cy - 6 - Math.abs(Math.sin(gt * 3)) * 3, 1.8, 0, TAU); ctx.fill();
    }
    // Rosenbogen am Eingang und Schild
    if (cx + 60 > a && cx - 60 < b && d > 260) {
      ctx.strokeStyle = '#3F7D3A'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(cx, 292, 30, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
      for (let k = 0; k < 9; k++) { const an = Math.PI * (1.08 + k * 0.105); fgFlower(cx + Math.cos(an) * 30, 292 + Math.sin(an) * 30, k % 2 ? '#FF5C7A' : '#FF9CC8', 3, k); }
      ctx.fillStyle = 'rgba(16,21,28,.82)'; rr(cx - 74, 300, 148, 18, 6); ctx.fill(); ctx.fillStyle = '#FF9CC8'; ctx.font = '900 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('FLORAS BLUMENGARTEN', cx, 309.5); ctx.textBaseline = 'alphabetic';
    }
    // Schmetterlinge
    for (let k = 0; k < 4; k++) { const bx = cx + Math.sin(gt * 0.35 + k * 1.7) * (180 + k * 70), by = 150 + Math.sin(gt * 0.5 + k * 2.3) * 100, fl = Math.abs(Math.sin(gt * 12 + k)); if (bx < a || bx > b) continue; ctx.fillStyle = ['#FFD24A', '#FF7EB6', '#7FD0FF', '#F4F4F8'][k]; ctx.beginPath(); ctx.ellipse(bx - 2, by, 2.4 * fl + 0.4, 2, 0, 0, TAU); ctx.ellipse(bx + 2, by, 2.4 * fl + 0.4, 2, 0, 0, TAU); ctx.fill(); ctx.fillStyle = '#2B3039'; ctx.fillRect(bx - 0.4, by - 1.6, 0.8, 3.2); }
  }
  function fgFlower(x, y, col, s, k) { // kleine Bluete mit fuenf Blaettern, wiegt sich leicht
    const sw = Math.sin(gt * 1.6 + k * 0.7) * 0.6; x += sw;
    ctx.fillStyle = '#3F8A4A'; ctx.beginPath(); ctx.arc(x, y + 1, s * 0.9, 0, TAU); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); for (let q = 0; q < 5; q++) { const an = q * TAU / 5 + k, px = x + Math.cos(an) * s * 0.55, py = y + Math.sin(an) * s * 0.55; ctx.moveTo(px + s * 0.5, py); ctx.arc(px, py, s * 0.5, 0, TAU); } ctx.fill();
    ctx.fillStyle = col === '#FFD24A' ? '#E8833A' : '#FFE27A'; ctx.beginPath(); ctx.arc(x, y, s * 0.32, 0, TAU); ctx.fill();
  }
  // ---------- v89: Casino (statt Containerplatz), Apotheke (Hinterhof im Norden), Mietraum (Raum hinter dem Lager-Tor) ----------
  const CAS = { x: 4860, y: 790, w: 320, h: 460 }, CAS_W = 14, CAS_DOOR = { x0: 4984, x1: 5056 };
  const CAS_IN = { x0: CAS.x + CAS_W, y0: CAS.y + CAS_W, x1: CAS.x + CAS.w - CAS_W, y1: CAS.y + CAS.h - CAS_W };
  for (let i = CONTAINERS.length - 1; i >= 0; i--) { const c = CONTAINERS[i]; if (c[0] + c[2] < CAS.x - 12 || c[0] > CAS.x + CAS.w + 12 || c[1] + c[3] < CAS.y - 12 || c[1] > CAS.y + CAS.h + 60) continue; const ci = colliders.findIndex(o => o.x === c[0] && o.y === c[1] && o.w === c[2] && o.h === c[3]); if (ci >= 0) colliders.splice(ci, 1); CONTAINERS.splice(i, 1); }
  R(CAS.x, CAS.y, CAS.w, CAS_W); R(CAS.x, CAS.y, CAS_W, CAS.h); R(CAS.x + CAS.w - CAS_W, CAS.y, CAS_W, CAS.h);
  R(CAS.x, CAS.y + CAS.h - CAS_W, CAS_DOOR.x0 - CAS.x, CAS_W); R(CAS_DOOR.x1, CAS.y + CAS.h - CAS_W, CAS.x + CAS.w - CAS_DOOR.x1, CAS_W);
  const CAS_WHEEL = { x: 5020, y: 852, at: { x: 5020, y: 908 } }; R(4982, 818, 76, 52);
  const CAS_SLOTS = [{ x: 4894, y: 930 }, { x: 4894, y: 1000 }].map(s => (R(s.x - 14, s.y - 22, 28, 44), Object.assign(s, { at: { x: s.x + 38, y: s.y } })));
  const CAS_BJ = [{ x: 4935, y: 1110, min: 10 }, { x: 5020, y: 1110, min: 100 }, { x: 5105, y: 1110, min: 1000 }].map(t => (R(t.x - 30, t.y - 14, 60, 28), Object.assign(t, { at: { x: t.x, y: t.y + 40 } })));
  R(5138, 880, 22, 150); // Bar an der Ostwand
  const CAS_AT = { x: (CAS_DOOR.x0 + CAS_DOOR.x1) / 2, y: CAS.y + CAS.h + 18 };
  const inCasino = () => !!G && !player.fl && player.x > CAS_IN.x0 && player.x < CAS_IN.x1 && player.y > CAS_IN.y0 && player.y < CAS_IN.y1;
  const APO = { x: 2890, y: 18, w: 240, h: 150 }, APO_AT = { x: 3010, y: -8 }; // v109: an der Nordallee, Eingang oben
  { const inA = (x, y) => x > APO.x - 40 && x < APO.x + APO.w + 40 && y > APO.y - 30 && y < APO.y + APO.h + 70;
    for (let i = TREES.length - 1; i >= 0; i--) { const t = TREES[i]; if (!inA(t[0], t[1] + 12)) continue; const ci = colliders.findIndex(c => c.x === t[0] - 7 && c.y === t[1] + 6 && c.w === 14 && c.h === 12); if (ci >= 0) colliders.splice(ci, 1); TREES.splice(i, 1); }
    for (let i = bushes.length - 1; i >= 0; i--) if (inA(bushes[i].x, bushes[i].y)) bushes.splice(i, 1);
    for (let i = SHEDS.length - 1; i >= 0; i--) { const s = SHEDS[i]; if (!inA(s.x + s.w / 2, s.y + s.h / 2)) continue; const ci = colliders.findIndex(c => c.x === s.x && c.y === s.y && c.w === s.w && c.h === s.h); if (ci >= 0) colliders.splice(ci, 1); SHEDS.splice(i, 1); } }
  R(APO.x, APO.y, APO.w, APO.h);
  // v94: neue Gebaeude: Fitnessstudio und Bank neben der Apotheke, Pizzeria und Nachtclub neben der Autowerkstatt
  const GYM = { x: 2262, y: 1500, w: 172, h: 124 }, GYM_AT = { x: 2348, y: 1478 }; // v108: Suedost am Spielplatz, Eingang zur Parkstrasse (vorher Startviertel)
  const GYM2 = { x: 1352, y: 740, w: 130, h: 84 }, GYM2_AT = { x: 1417, y: 716 }; // v112: kleines Iron Gym Express im Stadtpark, ab Ruf 0
  const BANK = { x: 3150, y: 18, w: 186, h: 140 }, BANK_AT = { x: 3243, y: -8 }; // v109: an der Nordallee, Eingang oben
  const PIZZA = { x: 812, y: 776, w: 152, h: 114 }, PIZZA_AT = { x: 888, y: 752 }; // v99: Terrasse liegt jetzt vor dem Gehweg // v97: Startviertel
  const CLUB = { x: 4500, y: 1060, w: 250, h: 160 }, CLUB_AT = { x: 4625, y: 1240 }; // v97: Vergnuegungsmeile neben dem Casino
  const MARKT = { x: 2650, y: 4, w: 226, h: 262 }; // v109: groesser, offen zur Nordallee
  for (const B of [GYM, GYM2, BANK, PIZZA, CLUB, MARKT, LAGER, WS_LOT]) { const inB = (x, y) => x > B.x - 26 && x < B.x + B.w + 26 && y > B.y - 26 && y < B.y + B.h + 36;
    for (let i = TREES.length - 1; i >= 0; i--) { const t = TREES[i]; if (!inB(t[0], t[1] + 12)) continue; const ci = colliders.findIndex(c => c.x === t[0] - 7 && c.y === t[1] + 6 && c.w === 14 && c.h === 12); if (ci >= 0) colliders.splice(ci, 1); TREES.splice(i, 1); }
    for (let i = bushes.length - 1; i >= 0; i--) if (inB(bushes[i].x, bushes[i].y)) bushes.splice(i, 1);
    for (let i = SHEDS.length - 1; i >= 0; i--) { const s = SHEDS[i]; if (!inB(s.x + s.w / 2, s.y + s.h / 2)) continue; const ci = colliders.findIndex(c => c.x === s.x && c.y === s.y && c.w === s.w && c.h === s.h); if (ci >= 0) colliders.splice(ci, 1); SHEDS.splice(i, 1); }
    if (B !== MARKT && B !== WS_LOT && B !== LAGER) R(B.x, B.y, B.w, B.h); }
  const MARKT_ST = [[2664, 56], [2664, 128], [2664, 200], [2806, 56], [2806, 128], [2806, 200]]; MARKT_ST.forEach(([x, y]) => R(x, y, 56, 26)); R(2745, 120, 36, 34); // v109: sechs Marktstaende und der Brunnen
  const PR_PAD = { x: LAGER_AT.x + 86, y: LAGER_AT.y - 6 }; // Besucher-Feld neben dem Lager-Tor
  // v79: Gangviertel hinter den Haeusern ganz im Suedosten. Zwei Haeuser gehoeren den Gangs (keine Kunden dort).
  const GV = { x: 4460, y: 2432, w: 740, h: 168 }, GV_AT = { x: 5026, y: 2514 }, GV_DOOR = { x: 4905, y: 2470 };
  HOUSES.forEach(h => { if (h.y > 2240 && (h.x === 4660 || h.x === 4840)) h.gang = 1; });
  const GV_CAR = { x: 4478, y: 2532, w: 72, h: 30 }, GV_COUCH = { x: 4690, y: 2434, w: 74, h: 26 }, GV_BARREL = { x: 4880, y: 2552 }, GV_TABLE = { x: 5000, y: 2534, w: 52, h: 22 }, GV_BOX = { x: 4790, y: 2452 }, GV_HOOP = { x: 5100, y: 2432 };
  const GV_NPC = [
    { x: 4706, y: 2448, a: Math.PI / 2, p: 'sit', g: 0 }, { x: 4727, y: 2448, a: Math.PI / 2, p: 'smoke', g: 1, sitS: 1 }, { x: 4748, y: 2448, a: Math.PI / 2, p: 'sit', g: 3 },
    { x: 4822, y: 2462, a: Math.PI / 2, p: 'dance', g: 2 }, { x: 4858, y: 2538, a: 0.4, p: 'stand', g: 4 }, { x: 4903, y: 2540, a: Math.PI - 0.4, p: 'smoke', g: 4 },
    { x: 4880, y: 2577, a: -Math.PI / 2, p: 'stand', g: 1 }, { x: 5026, y: 2572, a: -Math.PI / 2, p: 'boss', g: 5 }, { x: 5068, y: 2566, a: -2.4, p: 'stand', g: 5 },
    { x: 5132, y: 2462, a: Math.PI / 2, p: 'ball', g: 2 }, { x: 4564, y: 2548, a: Math.PI, p: 'stand', g: 0 }
  ];
  GV_NPC.forEach(n => { if (n.sitS) n.p = 'sit', n.sm = 1; });
  R(GV_CAR.x, GV_CAR.y, GV_CAR.w, GV_CAR.h); R(GV_COUCH.x, GV_COUCH.y, GV_COUCH.w, GV_COUCH.h); R(GV_BARREL.x - 9, GV_BARREL.y - 9, 18, 18); R(GV_TABLE.x, GV_TABLE.y, GV_TABLE.w, GV_TABLE.h); R(GV_BOX.x - 10, GV_BOX.y - 10, 20, 20); R(GV.x, 2590, GV.w, 10);
  GV_NPC.forEach(n => { if (n.p !== 'sit') R(n.x - 6, n.y - 6, 12, 12); });
  for (let i = bushes.length - 1; i >= 0; i--) if (inR(GV, bushes[i].x, bushes[i].y, 6)) bushes.splice(i, 1);
  for (let i = TREES.length - 1; i >= 0; i--) { const [tx, ty] = TREES[i]; if (!inR(GV, tx, ty + 12, 4)) continue; TREES.splice(i, 1); const ci = colliders.findIndex(c => c.x === tx - 7 && c.y === ty + 6 && c.w === 14 && c.h === 12); if (ci >= 5) colliders.splice(ci, 1); } // Hof ist betoniert
  // v109: Gangviertel waechst: Westhof hinter den Haeusern links der Gewerbestrasse
  const GV2 = { x: 3540, y: 2432, w: 740, h: 168 };
  const GV2_P = { cont: { x: 3556, y: 2524, w: 100, h: 40 }, wreck: { x: 3706, y: 2540, w: 72, h: 30 }, dump: [{ x: 3800, y: 2440, w: 40, h: 24 }, { x: 3848, y: 2440, w: 40, h: 24 }], tires: { x: 3934, y: 2558 }, barrel: { x: 3996, y: 2470 }, couch: { x: 4140, y: 2440, w: 70, h: 24 }, hoop: { x: 4120, y: 2588 }, sign: { x: 3725, y: 2444 } };
  const GV2_NPC = [{ x: 4154, y: 2454, a: Math.PI / 2, p: 'sit', g: 2 }, { x: 4176, y: 2454, a: Math.PI / 2, p: 'sit', g: 4, sm: 1 }, { x: 4198, y: 2454, a: Math.PI / 2, p: 'sit', g: 0 }, { x: 4096, y: 2540, a: Math.PI / 2, p: 'ball', g: 1 }, { x: 4150, y: 2530, a: 2.2, p: 'stand', g: 3 }, { x: 3978, y: 2490, a: 0.3, p: 'stand', g: 5 }, { x: 4016, y: 2492, a: Math.PI - 0.3, p: 'smoke', g: 5 }, { x: 3680, y: 2470, a: Math.PI / 2, p: 'dance', g: 2 }];
  { const P = GV2_P; R(P.cont.x, P.cont.y, P.cont.w, P.cont.h); R(P.wreck.x, P.wreck.y, P.wreck.w, P.wreck.h); P.dump.forEach(d => R(d.x, d.y, d.w, d.h)); R(P.tires.x - 12, P.tires.y - 10, 24, 20); R(P.barrel.x - 9, P.barrel.y - 9, 18, 18); R(P.couch.x, P.couch.y, P.couch.w, P.couch.h); R(GV2.x, 2590, GV2.w, 10);
    GV2_NPC.forEach(n => { if (n.p !== 'sit') R(n.x - 6, n.y - 6, 12, 12); });
    for (let i = bushes.length - 1; i >= 0; i--) if (inR(GV2, bushes[i].x, bushes[i].y, 6)) bushes.splice(i, 1);
    for (let i = TREES.length - 1; i >= 0; i--) { const [tx, ty] = TREES[i]; if (!inR(GV2, tx, ty + 12, 4)) continue; TREES.splice(i, 1); const ci = colliders.findIndex(c => c.x === tx - 7 && c.y === ty + 6 && c.w === 14 && c.h === 12); if (ci >= 5) colliders.splice(ci, 1); } }
  // v73: Laternen sinnvoll verteilt: an jeder Kreuzungsecke, entlang aller Gehwege abwechselnd links und rechts, an Uferwegen,
  // Parkwegen und Plaetzen. Trampelpfade bleiben dunkel (Fluchtwege). Bolzplatz und Skaterpark haben Flutlicht.
  const LAMPS = [], FLOODS = [];
  {
    const doorAt = (x, y) => HOUSES.some(h => Math.abs(h.dx - x) < 32 && Math.abs((h.face === 1 ? h.dy + 16 : h.dy - 16) - y) < 42);
    const add = (x, y, gap) => { if (doorAt(x, y) || BINS.some(b => Math.hypot(b.x - x, b.y - y) < 24) || LAMPS.some(l => Math.hypot(l.x - x, l.y - y) < (gap || 80)) || BROOKS.some(b => Math.abs(b.x - x) < 26 && y > b.y0 - 10 && y < b.y1 + 10)) return false; LAMPS.push({ x: Math.round(x), y: Math.round(y) }); return true; };
    const riv = y => y > RIVER.y0 - 40 && y < RIVER.y1 + 40, segsB = (list, lim, lo) => { const q = []; let p = lo || 0; for (const r of list.slice().sort((a, b) => a.c0 - b.c0)) { q.push([p, r.c0 - SW]); p = r.c1 + SW; } q.push([p, lim]); return q; };
    for (const h of RDH) for (const v of RDV) { add(v.c0 - SW + 6, h.c0 - SW + 6); add(v.c1 + SW - 6, h.c0 - SW + 6); add(v.c0 - SW + 6, h.c1 + SW - 4); add(v.c1 + SW - 6, h.c1 + SW - 4); }
    for (const r of RD) {
      let side = 0;
      for (const [a0, a1] of segsB(r.h ? RDV : RDH, r.h ? WW : WH, r.h ? 0 : YMIN)) {
        const len = a1 - a0, n = Math.max(1, Math.round(len / 150));
        for (let k = 0; k < n; k++) {
          const t = a0 + (k + 0.5) * len / n; side = 1 - side;
          for (const o2 of [0, 40, -40, 75, -75, 110, -110]) { const u = t + o2; if (u < a0 + 30 || u > a1 - 30) continue; if (r.h ? add(u, side ? r.c0 - SW + 6 : r.c1 + SW - 4, 110) : (!riv(u) && add(side ? r.c0 - SW + 6 : r.c1 + SW - 6, u, 110))) break; }
        }
      }
    }
    for (const [y, dy] of [[UFER_N, -12], [UFER_S, 14]]) for (let x = 120; x < WW - 60; x += 210) if (!RDV.some(v => x > v.c0 - SW - 30 && x < v.c1 + SW + 30) && !FOOT_X.some(fx => Math.abs(fx - x) < 40)) add(x, y + dy);
    for (const l of NAV_HL.concat(NAV_VL)) {
      if (l.k !== 'k') continue; const hor = l.y !== undefined, a0 = hor ? l.x0 : l.y0, a1 = hor ? l.x1 : l.y1, n = Math.floor((a1 - a0) / 170);
      for (let k = 1; k <= n; k++) { const t = a0 + k * (a1 - a0) / (n + 1), off = k % 2 ? 22 : -22, x = hor ? t : l.x + off, y = hor ? l.y + off : t;
        if (inR(SKATE, x, y) || inR(PITCH, x, y) || onStreet(x, y, 0) || riv(y) || colliders.some(c => !c.fl && x > c.x - 8 && x < c.x + c.w + 8 && y > c.y - 8 && y < c.y + c.h + 8)) continue; add(x, y, 90); }
    }
    for (const [x, y] of [[1150, 880], [1382, 880], [1150, 1150], [1382, 1150]]) add(x, y, 60); // Brunnenplatz
    for (const [x, y] of [[AH_LOT.x + 330, AH_LOT.y + 140], [AH_LOT.x + 620, AH_LOT.y + 40], [4860, 960], [5150, 960], [PARK_LOT.x + PARK_LOT.w / 2, PARK_LOT.y + 160], [WS_LOT.x + 16, WS_LOT.y + 200], [4475, 600], [PLAY.x + 30, PLAY.y + 160], [PLAY.x + PLAY.w - 30, PLAY.y + 316], [DOGS.x + 30, DOGS.y + 140], [DOGS.x + DOGS.w - 30, DOGS.y + 140]]) add(x, y, 60);
    for (let i = LAMPS.length - 1; i >= 0; i--) { const l = LAMPS[i]; if ((l.x > CAS_IN.x0 - 10 && l.x < CAS_IN.x1 + 10 && l.y > CAS_IN.y0 - 10 && l.y < CAS_IN.y1 + 10) || colliders.some(c => !c.fl && !c.water && l.x > c.x && l.x < c.x + c.w && l.y > c.y && l.y < c.y + c.h)) LAMPS.splice(i, 1); } // v95: keine Laternen in Gebaeuden
    for (const Z of [SKATE, PITCH]) for (const [fx, fy] of [[0.05, 0.08], [0.95, 0.08], [0.05, 0.95], [0.95, 0.95]]) FLOODS.push({ x: Math.round(Z.x + Z.w * fx), y: Math.round(Z.y + Z.h * fy), cx: Z.x + Z.w / 2, cy: Z.y + Z.h / 2 });
  }

  // ---------- Gebiete und Arbeiter ----------
  const DEF_LOOK = { r: 63, g: 174, b: 106, outline: false, bnd: 'none', hat: 'none', size: 1, sex: 'm', hair: 1, hs: 0, skin: 1, top: 'tshirt', bot: 'auto', cos: 'none', aura: 'none', shoe: 'stdshoe', back: 'none' };
  // Figur: Auswahlfarben statt RGB. Frisuren sind gratis; Kleidung, Kostueme und Auren kosten Geld und brauchen Ruf.
  const HAIR_COLS = ['#241811', '#5A3A22', '#A8642B', '#E2B857', '#C8472E', '#9AA0AA', '#4B6FD6', '#E26FB0', '#3FAE6A'];
  const HAIR_NAMES = ['Schwarz', 'Braun', 'Kupfer', 'Blond', 'Rot', 'Grau', 'Blau', 'Pink', 'Grün'];
  const SKIN_COLS = ['#F8DEC8', '#F1C9A5', '#D9A47A', '#B07850', '#7A4E32'];
  const OUTFITS = [[63, 174, 106], [75, 141, 255], [224, 84, 84], [240, 194, 78], [160, 100, 220], [232, 131, 58], [80, 200, 194], [240, 130, 170], [235, 238, 245], [60, 64, 76]];
  const HAIR_STYLES = ['Kurz', 'Lang', 'Stachelig', 'Dutt', 'Bob', 'Zopf', 'Zöpfe', 'Locken', 'Scheitel', 'Glatze', 'Undercut', 'Tolle', 'Irokese', 'Afro', 'Millimeter', 'Vokuhila', 'Mittelscheitel', 'Pilzkopf'];
  const WEAR = [
    { id: 'tshirt', slot: 'top', name: 'T-Shirt', cost: 0, rep: 0, desc: 'Kurze Ärmel in deiner Farbe' },
    { id: 'sweater', slot: 'top', name: 'Pullover', cost: 350, rep: 3, desc: 'Warmer Strickpulli mit Bündchen' },
    { id: 'jersey', slot: 'top', name: 'Sporttrikot', cost: 600, rep: 6, desc: 'Weiße Seitenstreifen und eine Nummer' },
    { id: 'hoodie', slot: 'top', name: 'Hoodie', cost: 800, rep: 8, desc: 'Mit Kapuze, Bauchtasche und Kordeln' },
    { id: 'xmas', slot: 'top', name: 'Weihnachtspulli', cost: 900, rep: 10, desc: 'Rot mit weißem Muster, unabhängig von deiner Farbe' },
    { id: 'bomber', slot: 'top', name: 'Bomberjacke', cost: 1600, rep: 15, desc: 'Dunkle Jacke mit Reißverschluss' },
    { id: 'suit', slot: 'top', name: 'Anzug', cost: 3200, rep: 22, desc: 'Schwarzer Anzug mit roter Krawatte' },
    { id: 'auto', slot: 'bot', name: 'Standard', cost: 0, rep: 0, desc: 'Hose oder Rock, je nach Typ' },
    { id: 'shorts', slot: 'bot', name: 'Shorts', cost: 200, rep: 2, desc: 'Kurze Hose, nackte Beine' },
    { id: 'skirt', slot: 'bot', name: 'Rock', cost: 250, rep: 2, desc: 'Ein Rock in deiner Farbe' },
    { id: 'cargo', slot: 'bot', name: 'Cargohose', cost: 500, rep: 5, desc: 'Weit, mit großen Seitentaschen' },
    { id: 'jogger', slot: 'bot', name: 'Jogginghose', cost: 650, rep: 7, desc: 'Bequem, grau mit weißem Streifen' },
    { id: 'camo', slot: 'bot', name: 'Tarnhose', cost: 1500, rep: 13, desc: 'Grün mit Tarnflecken' },
    { id: 'none', slot: 'hat', name: 'Ohne Hut', cost: 0, rep: 0, desc: 'Nur deine Frisur' },
    { id: 'cap', slot: 'hat', name: 'Kappe', cost: 0, rep: 0, desc: 'Eine einfache Kappe' },
    { id: 'beanie', slot: 'hat', name: 'Mütze', cost: 0, rep: 0, desc: 'Eine einfache Mütze' },
    { id: 'headband', slot: 'hat', name: 'Stirnband', cost: 150, rep: 1, desc: 'Rotes Stirnband' },
    { id: 'pompom', slot: 'hat', name: 'Bommelmütze', cost: 300, rep: 3, desc: 'Strickmütze mit dickem weißem Bommel' },
    { id: 'sportcap', slot: 'hat', name: 'Sportkappe', cost: 400, rep: 4, desc: 'Weiße Kappe mit Streifen und Schirm' },
    { id: 'santa', slot: 'hat', name: 'Weihnachtsmütze', cost: 700, rep: 6, desc: 'Rot mit weißem Fell und Bommel' },
    { id: 'cowboy', slot: 'hat', name: 'Cowboyhut', cost: 1200, rep: 11, desc: 'Breite Krempe, brauner Hut' },
    { id: 'tophat', slot: 'hat', name: 'Zylinder', cost: 2400, rep: 18, desc: 'Hoher schwarzer Zylinder' },
    { id: 'crown', slot: 'hat', name: 'Krone', cost: 9000, rep: 40, desc: 'Eine goldene Krone' },
    { id: 'bunny', slot: 'cos', name: 'Hasenkostüm', cost: 2500, rep: 14, desc: 'Weißes Fell und lange Ohren' },
    { id: 'bear', slot: 'cos', name: 'Bärenkostüm', cost: 3500, rep: 20, desc: 'Brauner Bär mit runden Ohren' },
    { id: 'ghost', slot: 'cos', name: 'Geisterlaken', cost: 4200, rep: 24, desc: 'Ein Laken mit Augenlöchern' },
    { id: 'dino', slot: 'cos', name: 'Dino-Kostüm', cost: 5200, rep: 28, desc: 'Grün mit Stacheln und Schwanz' },
    { id: 'ninja', slot: 'cos', name: 'Ninja-Anzug', cost: 6500, rep: 32, desc: 'Schwarz, mit Maske und rotem Band' },
    { id: 'astro', slot: 'cos', name: 'Astronauten-Anzug', cost: 9000, rep: 38, desc: 'Weißer Anzug mit Helm und Rucksack' },
    { id: 'knight', slot: 'cos', name: 'Ritterrüstung', cost: 12000, rep: 46, desc: 'Metallrüstung mit Helm und Federbusch' },
    { id: 'warm', slot: 'aura', name: 'Goldschimmer', cost: 900, rep: 6, desc: 'Warmes goldenes Leuchten mit Funken' },
    { id: 'cool', slot: 'aura', name: 'Blauer Schein', cost: 1200, rep: 9, desc: 'Kühles blaues Leuchten' },
    { id: 'rose', slot: 'aura', name: 'Rosa Nebel', cost: 1500, rep: 12, desc: 'Sanftes rosa Leuchten' },
    { id: 'fire', slot: 'aura', name: 'Feueraura', cost: 3000, rep: 18, desc: 'Flackernde Flammen um dich' },
    { id: 'ice', slot: 'aura', name: 'Eisaura', cost: 4200, rep: 24, desc: 'Eisblaues Leuchten mit Kristallen' },
    { id: 'violet', slot: 'aura', name: 'Dunkle Aura', cost: 6000, rep: 30, desc: 'Violett pulsierend mit kreisenden Schleiern' },
    { id: 'rainbow', slot: 'aura', name: 'Regenbogenaura', cost: 9000, rep: 38, desc: 'Wechselt ständig die Farbe' },
    { id: 'galaxy', slot: 'aura', name: 'Galaxie-Aura', cost: 15000, rep: 50, desc: 'Ein Sternenhimmel um dich herum' },
    // v46: mehr Kleidung, Hüte, Schuhe
    { id: 'tank', slot: 'top', name: 'Tanktop', cost: 150, rep: 1, desc: 'Ärmellos und luftig' },
    { id: 'polo', slot: 'top', name: 'Poloshirt', cost: 450, rep: 4, desc: 'Mit Kragen und Knopfleiste' },
    { id: 'stripe', slot: 'top', name: 'Ringelshirt', cost: 400, rep: 3, desc: 'Langarm mit weißen Streifen' },
    { id: 'hawaii', slot: 'top', name: 'Hawaiihemd', cost: 600, rep: 5, desc: 'Türkis mit bunten Blumen' },
    { id: 'flannel', slot: 'top', name: 'Holzfällerhemd', cost: 700, rep: 7, desc: 'Rot kariert, robust' },
    { id: 'tracksuit', slot: 'top', name: 'Trainingsjacke', cost: 900, rep: 8, desc: 'Reißverschluss und weiße Streifen' },
    { id: 'denim', slot: 'top', name: 'Jeansjacke', cost: 1100, rep: 10, desc: 'Blauer Denim mit Taschen' },
    { id: 'leather', slot: 'top', name: 'Lederjacke', cost: 2200, rep: 17, desc: 'Schwarz, mit Reißverschluss und Revers' },
    { id: 'trench', slot: 'top', name: 'Trenchcoat', cost: 2800, rep: 20, desc: 'Langer Mantel mit Gürtel' },
    { id: 'jeans', slot: 'bot', name: 'Jeans', cost: 150, rep: 1, desc: 'Blaue Jeans, auch für Mädchen' },
    { id: 'bermuda', slot: 'bot', name: 'Bermudas', cost: 350, rep: 3, desc: 'Knielang und sandfarben' },
    { id: 'sports', slot: 'bot', name: 'Sporthose', cost: 400, rep: 4, desc: 'Kurz, dunkel mit weißem Streifen' },
    { id: 'leggings', slot: 'bot', name: 'Leggings', cost: 450, rep: 4, desc: 'Eng und schwarz' },
    { id: 'plaid', slot: 'bot', name: 'Schottenrock', cost: 700, rep: 7, desc: 'Roter Rock mit Karomuster' },
    { id: 'suitpants', slot: 'bot', name: 'Anzughose', cost: 1000, rep: 10, desc: 'Dunkle Bügelfaltenhose' },
    { id: 'leatherp', slot: 'bot', name: 'Lederhose', cost: 2000, rep: 16, desc: 'Schwarz und glänzend' },
    { id: 'bucket', slot: 'hat', name: 'Fischerhut', cost: 250, rep: 2, desc: 'Beiger Hut mit breiter Krempe' },
    { id: 'flowercrown', slot: 'hat', name: 'Blumenkranz', cost: 500, rep: 5, desc: 'Bunte Blüten im Haar' },
    { id: 'beret', slot: 'hat', name: 'Barett', cost: 350, rep: 4, desc: 'Rotes Barett mit Stiel' },
    { id: 'flatcap', slot: 'hat', name: 'Schiebermütze', cost: 500, rep: 6, desc: 'Grau und flach' },
    { id: 'snapback', slot: 'hat', name: 'Snapback', cost: 600, rep: 8, desc: 'Schwarz mit rotem, flachem Schirm' },
    { id: 'headphones', slot: 'hat', name: 'Kopfhörer', cost: 700, rep: 9, desc: 'Große Hörmuscheln mit Türkis-Akzent' },
    { id: 'chef', slot: 'hat', name: 'Kochmütze', cost: 900, rep: 10, desc: 'Hoch und weiß' },
    { id: 'pirate', slot: 'hat', name: 'Piratenhut', cost: 1800, rep: 14, desc: 'Schwarz mit Totenkopf' },
    { id: 'wizard', slot: 'hat', name: 'Zauberhut', cost: 3000, rep: 20, desc: 'Spitz, violett und mit Sternen' },
    { id: 'stdshoe', slot: 'shoe', name: 'Standard', cost: 0, rep: 0, desc: 'Einfache dunkle Schuhe' },
    { id: 'barefoot', slot: 'shoe', name: 'Barfuß', cost: 0, rep: 0, desc: 'Ganz ohne Schuhe' },
    { id: 'slides', slot: 'shoe', name: 'Schlappen', cost: 120, rep: 1, desc: 'Bequeme Badelatschen mit blauem Riemen' },
    { id: 'sneaker', slot: 'shoe', name: 'Sportschuhe', cost: 400, rep: 4, desc: 'Weiße Sneaker mit roten Akzenten' },
    { id: 'wellies', slot: 'shoe', name: 'Gummistiefel', cost: 500, rep: 5, desc: 'Gelb und wasserdicht' },
    { id: 'runner', slot: 'shoe', name: 'Laufschuhe', cost: 700, rep: 7, desc: 'Leicht, neongrün und mit dicker Sohle' },
    { id: 'ballet', slot: 'shoe', name: 'Ballerinas', cost: 600, rep: 6, desc: 'Rosa Slipper mit kleiner Schleife' },
    { id: 'heels', slot: 'shoe', name: 'Hohe Schuhe', cost: 800, rep: 8, desc: 'Rote Schuhe mit hohem Absatz' },
    { id: 'dress', slot: 'shoe', name: 'Lederschuhe', cost: 900, rep: 9, desc: 'Schwarz und glänzend' },
    { id: 'boots', slot: 'shoe', name: 'Stiefel', cost: 1400, rep: 12, desc: 'Braune Schnürstiefel' },
    { id: 'led', slot: 'shoe', name: 'LED-Sohlen-Schuhe', cost: 2500, rep: 18, desc: 'Die Sohle leuchtet in wechselnden Farben' },
    // v43: Belohnungen für Ziele (nicht kaufbar)
    { id: 'goldshoe', slot: 'shoe', name: 'Goldschuhe', cost: 1, rep: 999, ach: 'vip50', desc: 'Glänzende Schuhe für den Hofstaat' },
    { id: 'halo', slot: 'hat', name: 'Heiligenschein', cost: 1, rep: 999, ach: 'day100', desc: 'Ein goldener Ring über dem Kopf' },
    { id: 'sun', slot: 'aura', name: 'Sonnenschein', cost: 1, rep: 999, ach: 'd250', desc: 'Strahlen wie die Sonne' },
    { id: 'aqua', slot: 'aura', name: 'Wasserwirbel', cost: 1, rep: 999, ach: 'r60', desc: 'Türkise Wellen umkreisen dich' },
    { id: 'plasma', slot: 'aura', name: 'Plasma', cost: 1, rep: 999, ach: 'e10m', desc: 'Zuckende Energie in Cyan und Magenta' },
    { id: 'void', slot: 'aura', name: 'Leere', cost: 1, rep: 999, ach: 'r150', desc: 'Dunkle Wirbel, die alles verschlucken' },
    { id: 'gold', slot: 'cos', name: 'Goldanzug', cost: 1, rep: 999, ach: 'd1000', desc: 'Glänzender Anzug für echte Profis' },
    { id: 'neon', slot: 'cos', name: 'Neon-Anzug', cost: 1, rep: 999, ach: 'r100', desc: 'Leuchtend pink mit türkisen Akzenten' },
    // v54: Gang-Look, nur am Kiosk
    { id: 'bandneck', slot: 'band', name: 'Bandana als Halstuch', cost: 300, rep: 3, kiosk: true, desc: 'Gepunktet und locker um den Hals, in deiner Kleidungsfarbe' },
    { id: 'bandrag', slot: 'band', name: 'Bandana als Kopftuch', cost: 450, rep: 6, kiosk: true, desc: 'Fest um den Kopf gebunden, Knoten hinten' },
    { id: 'bandmask', slot: 'band', name: 'Bandana vorm Gesicht', cost: 650, rep: 10, kiosk: true, desc: 'Über Mund und Nase, wie bei den Gangs' },
    { id: 'backcap', slot: 'hat', name: 'Cap verkehrt herum', cost: 350, rep: 4, kiosk: true, desc: 'Schirm nach hinten, in deiner Farbe' },
    { id: 'baggy', slot: 'bot', name: 'Baggy-Jeans', cost: 550, rep: 6, kiosk: true, desc: 'Weit, dunkel und tief sitzend' },
    { id: 'royal', slot: 'cos', name: 'Königsgewand', cost: 1, rep: 999, ach: 'e2m', desc: 'Purpur mit goldener Borte' },
    // v76: neue Auren
    { id: 'bubbles', slot: 'aura', name: 'Seifenblasen', cost: 1800, rep: 11, desc: 'Bunt schillernde Blasen steigen auf' },
    { id: 'hearts', slot: 'aura', name: 'Herzen', cost: 2000, rep: 14, desc: 'Kleine Herzen schweben nach oben' },
    { id: 'smoke', slot: 'aura', name: 'Rauchschwaden', cost: 2500, rep: 16, desc: 'Graue Schwaden ziehen um dich' },
    { id: 'leafs', slot: 'aura', name: 'Hanfblatt-Aura', cost: 5000, rep: 26, desc: 'Grüne Blätter kreisen um dich' },
    { id: 'money', slot: 'aura', name: 'Geldregen', cost: 7000, rep: 33, desc: 'Scheine flattern um dich herum' },
    { id: 'storm', slot: 'aura', name: 'Gewitter', cost: 8000, rep: 36, desc: 'Blitze zucken aus deiner Mitte' },
    { id: 'comet', slot: 'aura', name: 'Kometen', cost: 11000, rep: 42, desc: 'Drei leuchtende Kometen umkreisen dich' },
    { id: 'shadowfire', slot: 'aura', name: 'Schattenfeuer', cost: 13000, rep: 47, desc: 'Dunkle violette Flammen' },
    // v76: Ruecken
    { id: 'fanny', slot: 'back', name: 'Bauchtasche', cost: 350, rep: 2, desc: 'Schräg umgehängt, mit kleinem Hanfblatt' },
    { id: 'backpack', slot: 'back', name: 'Rucksack', cost: 400, rep: 2, desc: 'Blau mit Vortasche' },
    { id: 'skateback', slot: 'back', name: 'Skateboard auf dem Rücken', cost: 900, rep: 6, desc: 'Rotes Board mit grünem Blatt' },
    { id: 'guitarback', slot: 'back', name: 'Gitarre auf dem Rücken', cost: 1200, rep: 8, desc: 'Immer bereit für ein Ständchen' },
    { id: 'capered', slot: 'back', name: 'Heldenumhang', cost: 1800, rep: 9, desc: 'Roter Umhang mit goldenem Abzeichen, weht beim Laufen' },
    { id: 'capeleaf', slot: 'back', name: 'Umhang mit Hanfblatt', cost: 2500, rep: 12, desc: 'Grüner Umhang mit großem Blatt auf dem Rücken' },
    { id: 'wbat', slot: 'back', name: 'Fledermausflügel', cost: 3000, rep: 16, desc: 'Dunkle Flügel, die leicht schlagen' },
    { id: 'wangel', slot: 'back', name: 'Engelsflügel', cost: 3500, rep: 18, desc: 'Weiße Federn, die sanft schlagen' },
    { id: 'wfairy', slot: 'back', name: 'Feenflügel', cost: 4500, rep: 22, desc: 'Durchscheinend und schillernd' },
    { id: 'jetpack', slot: 'back', name: 'Jetpack', cost: 9000, rep: 38, desc: 'Zwei Düsen mit Flammen' },
    { id: 'wphoenix', slot: 'back', name: 'Phönixflügel', cost: 12000, rep: 45, desc: 'Brennende Flügel mit Funken' },
    // v76: neue Kostueme
    { id: 'banana', slot: 'cos', name: 'Bananenkostüm', cost: 2000, rep: 12, desc: 'Gelb mit brauner Spitze' },
    { id: 'cat', slot: 'cos', name: 'Katzenkostüm', cost: 2800, rep: 15, desc: 'Grau mit spitzen Ohren' },
    { id: 'frog', slot: 'cos', name: 'Froschkostüm', cost: 3000, rep: 16, desc: 'Grün mit Glupschaugen' },
    { id: 'panda', slot: 'cos', name: 'Pandakostüm', cost: 4000, rep: 21, desc: 'Schwarz-weiß und kuschelig' },
    { id: 'devil', slot: 'cos', name: 'Teufelskostüm', cost: 4800, rep: 26, desc: 'Rot mit goldenen Hörnern' },
    { id: 'shark', slot: 'cos', name: 'Haikostüm', cost: 5500, rep: 29, desc: 'Mit Rückenflosse und Zähnen' },
    { id: 'robot', slot: 'cos', name: 'Roboteranzug', cost: 7000, rep: 34, desc: 'Metall, Antenne mit Blinklicht' },
    { id: 'weed', slot: 'cos', name: 'Hanfblatt-Kostüm', cost: 8000, rep: 36, desc: 'Grün, mit einem großen Blatt als Haube' }
  ];
  WEAR.push(
    { id: 'partyhat', slot: 'hat', name: 'Partyhut', cost: 300, rep: 2, desc: 'Bunter Spitzhut mit Bommel' },
    { id: 'sailor', slot: 'hat', name: 'Matrosenmütze', cost: 700, rep: 7, desc: 'Weiß mit blauem Band' },
    { id: 'viking', slot: 'hat', name: 'Wikingerhelm', cost: 1400, rep: 12, desc: 'Stahlhelm mit zwei Hörnern' },
    { id: 'vest', slot: 'top', name: 'Weste', cost: 750, rep: 6, desc: 'Dunkle Weste mit Taschen' },
    // v106: neue Kosmetik
    { id: 'tiedye', slot: 'top', name: 'Batikshirt', cost: 550, rep: 4, desc: 'Pink mit bunten Farbklecksen' },
    { id: 'varsity', slot: 'top', name: 'College-Jacke', cost: 1300, rep: 11, desc: 'In deiner Farbe, weiße Ärmel und Abzeichen' },
    { id: 'puffer', slot: 'top', name: 'Daunenjacke', cost: 1900, rep: 15, desc: 'Dick gesteppt, in deiner Farbe' },
    { id: 'catears', slot: 'hat', name: 'Katzenohren', cost: 450, rep: 4, desc: 'Haarreif mit spitzen Ohren' },
    { id: 'durag', slot: 'hat', name: 'Durag', cost: 600, rep: 7, desc: 'Glänzendes Tuch mit langen Bändern' },
    { id: 'bucketcamo', slot: 'hat', name: 'Tarn-Fischerhut', cost: 800, rep: 9, desc: 'Fischerhut im Tarnmuster' },
    { id: 'helmet', slot: 'hat', name: 'Motorradhelm', cost: 2200, rep: 17, desc: 'Schwarz mit blauem Visier und rotem Streifen' },
    { id: 'clogs', slot: 'shoe', name: 'Clogs', cost: 300, rep: 3, desc: 'Grüne Gummiclogs mit Löchern' },
    { id: 'highs', slot: 'shoe', name: 'Basketball-Sneaker', cost: 1600, rep: 13, desc: 'Hoch geschnitten, rot und weiß' },
    { id: 'cashbag', slot: 'back', name: 'Geldsack', cost: 1500, rep: 10, desc: 'Prall gefüllter Sack mit €-Zeichen' },
    { id: 'katana', slot: 'back', name: 'Katana auf dem Rücken', cost: 3800, rep: 20, desc: 'Schwarze Scheide, roter Griff' },
    { id: 'wdragon', slot: 'back', name: 'Drachenflügel', cost: 7500, rep: 34, desc: 'Grüne, schuppige Flügel, die kräftig schlagen' },
    { id: 'sakura', slot: 'aura', name: 'Kirschblüten', cost: 2600, rep: 15, desc: 'Rosa Blüten rieseln um dich herum' },
    { id: 'confetti', slot: 'aura', name: 'Konfetti', cost: 3400, rep: 19, desc: 'Bunte Schnipsel fliegen und fallen' },
    { id: 'disco', slot: 'aura', name: 'Disco-Lichter', cost: 9500, rep: 40, desc: 'Bunte Lichtkegel drehen sich um dich' },
    // v112: exklusiv, nur als Belohnung (Kategorie, Questkette oder Prestige)
    { id: 'pumpkin', slot: 'hat', name: 'Kürbiskopf', cost: 1, rep: 999, qx: 'Halloween: 8 Häuser Süßes oder Saures', desc: 'Ein geschnitzter Kürbis als Hut, mit Gruselgesicht' }, // v155
    { id: 'capegold', slot: 'back', name: 'Unternehmer-Umhang', cost: 1, rep: 999, qx: 'Kategorie Unternehmer (Ruf 50)', desc: 'Goldener Umhang mit €-Abzeichen' },
    { id: 'legend', slot: 'aura', name: 'Legenden-Aura', cost: 1, rep: 999, qx: 'Kategorie Branchenlegende (Ruf 100)', desc: 'Goldene Ringe und Sterne, nur für Legenden' },
    { id: 'capecheck', slot: 'back', name: 'Zielflaggen-Umhang', cost: 1, rep: 999, qx: 'Questkette Toni', desc: 'Schwarz-weiß kariert, wie die Zielflagge' },
    { id: 'spotlight', slot: 'aura', name: 'Rampenlicht', cost: 1, rep: 999, qx: 'Questkette Mira', desc: 'Kamerablitze und ein Scheinwerfer folgen dir' },
    { id: 'wgold', slot: 'back', name: 'Goldene Flügel', cost: 1, rep: 999, qx: 'Questkette Bürgermeister', desc: 'Die Flügel der Stadt, aus purem Gold' },
    { id: 'mkaurora', slot: 'aura', name: 'Nordlicht', cost: 1, rep: 999, qx: 'Sammler-Laden (Karriere → Woche)', desc: 'Grüne und violette Lichtbänder wehen um dich' },
    { id: 'mkdiamond', slot: 'aura', name: 'Diamantstaub', cost: 1, rep: 999, qx: 'Sammler-Laden (Karriere → Woche)', desc: 'Funkelnde Diamanten kreisen und blitzen auf' },
    { id: 'mkphoenix', slot: 'aura', name: 'Phönix', cost: 1, rep: 999, qx: 'Sammler-Laden (Karriere → Woche)', desc: 'Feurige Schwingen schlagen hinter dir' },
    { id: 'mkcrown', slot: 'aura', name: 'Meisterglanz', cost: 1, rep: 999, qx: 'Sammler-Laden (Karriere → Woche)', desc: 'Ein goldener Lorbeerkranz schwebt über dir' },
    { id: 'pr1', slot: 'aura', name: 'Silberfunken', cost: 1, rep: 999, qx: 'Prestige 1', desc: 'Silberne Sterne funkeln um dich' },
    { id: 'capestar', slot: 'back', name: 'Sternenumhang', cost: 1, rep: 999, qx: 'Prestige 2', desc: 'Nachtblau mit funkelnden Sternen' },
    { id: 'crownp', slot: 'hat', name: 'Prestige-Krone', cost: 1, rep: 999, qx: 'Prestige 3', desc: 'Silberne Krone mit violetten Steinen' },
    { id: 'pr4', slot: 'aura', name: 'Sternenring', cost: 1, rep: 999, qx: 'Prestige 4', desc: 'Ein Ring aus Sternen kreist um dich' },
    { id: 'wstar', slot: 'back', name: 'Sternenflügel', cost: 1, rep: 999, qx: 'Prestige 5', desc: 'Leuchtende Flügel aus Sternenlicht' },
    { id: 'pr6', slot: 'aura', name: 'Prisma', cost: 1, rep: 999, qx: 'Prestige 6', desc: 'Lichtsplitter in allen Farben' },
    { id: 'capeprism', slot: 'back', name: 'Regenbogenumhang', cost: 1, rep: 999, qx: 'Prestige 7', desc: 'Schimmert in allen Farben' },
    { id: 'crownstar', slot: 'hat', name: 'Sternenkrone', cost: 1, rep: 999, qx: 'Prestige 8', desc: 'Eine Krone aus leuchtenden Sternen' },
    { id: 'wcosmos', slot: 'back', name: 'Kosmosflügel', cost: 1, rep: 999, qx: 'Prestige 9', desc: 'Flügel aus einer ganzen Galaxie' },
    { id: 'pr10', slot: 'aura', name: 'Unendlichkeit', cost: 1, rep: 999, qx: 'Prestige 10', desc: 'Gold, Sterne und Galaxie – die höchste Aura im Spiel' }
  );
  const PRES_ITEM = [null, 'pr1', 'capestar', 'crownp', 'pr4', 'wstar', 'pr6', 'capeprism', 'crownstar', 'wcosmos', 'pr10'];
  const WEAR_BY = Object.fromEntries(WEAR.map(w => [w.id, w]));
  const WEAR_DEF = { top: 'tshirt', bot: 'auto', hat: 'none', cos: 'none', aura: 'none', shoe: 'stdshoe', bnd: 'none', back: 'none' };
  const WSET = sl => ['none'].concat(WEAR.filter(w => w.slot === sl).map(w => w.id));
  function cleanLook(l) {
    l = l && typeof l === 'object' ? l : {};
    const ni = (v, a, b, d) => Number.isFinite(+v) ? clamp(Math.round(+v), a, b) : d;
    const pk = (v, sl, d) => typeof v === 'string' && WSET(sl).includes(v) ? v : d;
    return { r: clamp(Math.round(+l.r) || 0, 0, 255), g: clamp(Math.round(+l.g) || 0, 0, 255), b: clamp(Math.round(+l.b) || 0, 0, 255), outline: !!l.outline, hat: pk(l.hat, 'hat', 'none'), size: [0.85, 1, 1.15].includes(+l.size) ? +l.size : 1,
      top: pk(l.top, 'top', 'tshirt'), bot: pk(l.bot, 'bot', 'auto'), cos: pk(l.cos, 'cos', 'none'), aura: pk(l.aura, 'aura', 'none'), shoe: pk(l.shoe, 'shoe', 'stdshoe'), bnd: pk(l.bnd, 'band', 'none'), back: pk(l.back, 'back', 'none'),
      sex: l.sex === 'f' ? 'f' : 'm', hair: ni(l.hair, 0, HAIR_COLS.length - 1, 1), hs: ni(l.hs, 0, HAIR_STYLES.length - 1, 0), skin: ni(l.skin, 0, SKIN_COLS.length - 1, 1) };
  }
  const PILE = 10; // PILE = sichtbarer Stapel
  const bagsMax = () => 40 + Math.floor(((G && G.up && G.up.bag) || 0) / 2); // Lager am Packtisch waechst mit dem Rucksack
  const ROLES = {
    gardener: { name: 'Gärtner', desc: 'Pflanzt, gießt und erntet die Töpfe und hängt die Blüten ins Gestell.', rep: 0, max: 3, cost: [300, 550, 900], wage: 10, col: '#63C174', cap: '#2F7A48', area: 'keller', kind: 'gardener' },
    rack: { name: 'Gestell-Helfer', desc: 'Nimmt Trockene aus dem Gestell und bringt sie zum Packtisch.', rep: 8, max: 2, cost: [500, 900], wage: 12, col: '#4B8DFF', cap: '#2E5FB3', area: 'keller', kind: 'rack' },
    packer: { name: 'Packer', desc: 'Packt Beutel am Tisch. Du holst sie dort mit B ab.', rep: 16, max: 2, cost: [700, 1200], wage: 14, col: '#C58BE6', cap: '#8B5AA8', area: 'keller', kind: 'packer' },
    tgardener: { name: 'Pflücker', desc: 'Pflanzt, gießt und erntet die Tabakpflanzen und hängt die Blätter ins Gestell.', rep: 40, max: 3, cost: [350, 650, 1000], wage: 11, col: '#D9A441', cap: '#8A6A22', area: 'tabak', kind: 'gardener' },
    track: { name: 'Trockner', desc: 'Nimmt trockene Blätter vom Gestell und bringt sie zum Packtisch.', rep: 44, max: 2, cost: [550, 950], wage: 13, col: '#E07A5F', cap: '#9C4A36', area: 'tabak', kind: 'rack' },
    bgardener: { name: 'Laborant', desc: 'Setzt Ansätze an, kühlt die Reaktoren und füllt die fertige Lösung in den Kristallisierer.', rep: 62, max: 3, cost: [900, 1600, 2600], wage: 20, col: '#8FC95A', cap: '#4F7A2A', area: 'brau', kind: 'gardener' },
    brack: { name: 'Kristallmeister', desc: 'Nimmt fertige Kristalle aus dem Kristallisierer und bringt sie zum Verpackungstisch.', rep: 66, max: 2, cost: [1300, 2200], wage: 23, col: '#E8833A', cap: '#9A4F1C', area: 'brau', kind: 'rack' },
    bpacker: { name: 'Verpacker', desc: 'Verpackt Kristallboxen am Tisch. Du holst sie dort mit B ab.', rep: 70, max: 2, cost: [1700, 2900], wage: 26, col: '#F2C14E', cap: '#9A7A1C', area: 'brau', kind: 'packer' },
    prgardener: { name: 'Premium-Gärtner', desc: 'Setzt Stecklinge, gibt Nährlösung und erntet im Mietraum, dann ab in den Klima-Trockenschrank.', rep: 30, max: 3, cost: [1800, 3000, 4600], wage: 30, col: '#7FE0A0', cap: '#2E9E5B', area: 'pr', kind: 'gardener' },
    prrack: { name: 'Klima-Techniker', desc: 'Nimmt die getrockneten Premium-Blüten aus dem Schrank und bringt sie zum Abfülltisch.', rep: 32, max: 2, cost: [2400, 3800], wage: 32, col: '#C9A8FF', cap: '#6A4AA8', area: 'pr', kind: 'rack' },
    prpacker: { name: 'Apotheken-Abfüller', desc: 'Füllt Apotheken-Dosen am Tisch ab. Du holst sie dort mit B ab.', rep: 34, max: 2, cost: [2800, 4400], wage: 34, col: '#E6E9FF', cap: '#4A5A8A', area: 'pr', kind: 'packer' },
    tpacker: { name: 'Päckchen-Packer', desc: 'Packt Päckchen am Tisch. Du holst sie dort mit B ab.', rep: 48, max: 2, cost: [750, 1300], wage: 15, col: '#5CC8C2', cap: '#2E8A85', area: 'tabak', kind: 'packer' }
  };
  // Wegfindung auf einem groben Raster je Gebäude, damit Arbeiter nicht an Möbeln hängen bleiben
  const CELL = 10;
  function makeNav(I, f) { // f: Etage; ohne f zaehlen nur Hindernisse des Erdgeschosses
    const nv = { I, GW: Math.ceil((I.x1 - I.x0) / CELL), GH: Math.ceil((I.y1 - I.y0) / CELL) };
    nv.block = new Uint8Array(nv.GW * nv.GH);
    for (let gy = 0; gy < nv.GH; gy++) for (let gx = 0; gx < nv.GW; gx++) {
      const cx = I.x0 + gx * CELL + CELL / 2, cy = I.y0 + gy * CELL + CELL / 2;
      let b = 0;
      for (const c of colliders) {
        if (isGate(c) || (f === undefined ? c.fl : (c.fl !== undefined && c.fl !== f))) continue;
        const dx = cx - clamp(cx, c.x, c.x + c.w), dy = cy - clamp(cy, c.y, c.y + c.h);
        if (dx * dx + dy * dy < 16.5 * 16.5) { b = 1; break; }
      }
      nv.block[gy * nv.GW + gx] = b;
    }
    return nv;
  }
  const nvK = makeNav(IN), nvT = makeNav(IN2), nvB = makeNav(IN3);
  const navBlock = nvK.block, GW = nvK.GW, GH = nvK.GH;
  const cellOf = (nv, x, y) => [clamp(Math.floor((x - nv.I.x0) / CELL), 0, nv.GW - 1), clamp(Math.floor((y - nv.I.y0) / CELL), 0, nv.GH - 1)];
  const blockedAt = (nv, x, y) => { const c = cellOf(nv, x, y); return nv.block[c[1] * nv.GW + c[0]] === 1; };
  function freeCellNear(nv, gx, gy) {
    if (!nv.block[gy * nv.GW + gx]) return [gx, gy];
    for (let r = 1; r < 8; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = gx + dx, y = gy + dy;
      if (x < 0 || y < 0 || x >= nv.GW || y >= nv.GH) continue;
      if (!nv.block[y * nv.GW + x]) return [x, y];
    }
    return null;
  }
  function los(nv, ax, ay, bx, by) {
    const d = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(d / 4));
    for (let i = 1; i < n; i++) { const t = i / n; if (blockedAt(nv, ax + (bx - ax) * t, ay + (by - ay) * t)) return false; }
    return true;
  }
  function findPath(nv, sx, sy, tx, ty) {
    if (los(nv, sx, sy, tx, ty)) return [{ x: tx, y: ty }];
    const GW2 = nv.GW, GH2 = nv.GH, blk = nv.block;
    const s0 = cellOf(nv, sx, sy), g0 = cellOf(nv, tx, ty), sc = freeCellNear(nv, s0[0], s0[1]), gc = freeCellNear(nv, g0[0], g0[1]);
    if (!sc || !gc) return [{ x: tx, y: ty }];
    const prev = new Int32Array(GW2 * GH2).fill(-2), start = sc[1] * GW2 + sc[0], goal = gc[1] * GW2 + gc[0], q = [start];
    prev[start] = -1;
    for (let qi = 0; qi < q.length && prev[goal] === -2; qi++) {
      const cur = q[qi], cx = cur % GW2, cy = (cur / GW2) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= GW2 || ny >= GH2) continue;
        const ni = ny * GW2 + nx;
        if (prev[ni] !== -2 || blk[ni]) continue;
        if (dx && dy && (blk[cy * GW2 + nx] || blk[ny * GW2 + cx])) continue;
        prev[ni] = cur; q.push(ni);
      }
    }
    if (prev[goal] === -2) return [{ x: tx, y: ty }];
    const cells = []; for (let c = goal; c !== -1; c = prev[c]) cells.push(c);
    cells.reverse();
    const pts = cells.map(c => ({ x: nv.I.x0 + (c % GW2) * CELL + CELL / 2, y: nv.I.y0 + ((c / GW2) | 0) * CELL + CELL / 2 }));
    pts.push({ x: tx, y: ty });
    const out = []; let ax = sx, ay = sy, i = 0;
    while (i < pts.length) {
      let j = pts.length - 1;
      while (j > i && !los(nv, ax, ay, pts[j].x, pts[j].y)) j--;
      out.push(pts[j]); ax = pts[j].x; ay = pts[j].y; i = j + 1;
    }
    return out;
  }
  const AREAS = {
    keller: {
      key: 'keller', name: 'Keller', IN, DOOR, POTS, RACK, TABLE, nv: nvK, claim: POTS.map(() => 0),
      RACK_STAND: { x: RACK.x, y: RACK.y + 48 }, TABLE_STAND: { x: TABLE.x, y: TABLE.y + 40 },
      roleKey: { gardener: 'gardener', rack: 'rack', packer: 'packer' },
      lbl: { fresh: 'Blüten', unit: 'Beutel', rack: 'Gestell', hud: 'Frische' },
      seedBase: 12, seedUp: 4, growBase: 50, yieldBase: 5, rackBase: 12, rackUp: 6, dryBase: 0.4, packN: 3, price: 32, leaf: '#63C174', dry: '#FFB547', bub: '#FFB547', cust: '#63C174'
    },
    tabak: {
      key: 'tabak', name: 'Tabakscheune', IN: IN2, DOOR: DOOR2, POTS: POTS2, RACK: RACK2, TABLE: TABLE2, nv: nvT, claim: POTS2.map(() => 0),
      RACK_STAND: { x: RACK2.x, y: RACK2.y + 48 }, TABLE_STAND: { x: TABLE2.x, y: TABLE2.y + 40 },
      roleKey: { gardener: 'tgardener', rack: 'track', packer: 'tpacker' },
      lbl: { fresh: 'Blätter', unit: 'Päckchen', rack: 'Trockengestell', hud: 'Blätter' },
      seedBase: 8, seedUp: 3, growBase: 60, yieldBase: 7, rackBase: 14, rackUp: 6, dryBase: 0.3, packN: 4, price: 29, leaf: '#B8C45A', dry: '#C98A3C', bub: '#7FD0C8',
      cost: 3000, needRep: 40, blurb: 'Eine eigene Scheune mit Tabakfeld, Trockengestell und Packtisch an der Hauptstraße, gleich hinter der Scheunengasse. Die Kunden bestellen dann auch Päckchen.', where: 'Sie steht an der Hauptstraße hinter der Scheunengasse'
    },
    brau: {
      key: 'brau', name: 'Chemielabor', IN: IN3, DOOR: DOOR3, POTS: POTS3, RACK: RACK3, TABLE: TABLE3, nv: nvB, claim: POTS3.map(() => 0),
      RACK_STAND: { x: RACK3.x, y: RACK3.y + 48 }, TABLE_STAND: { x: TABLE3.x, y: TABLE3.y + 40 },
      roleKey: { gardener: 'bgardener', rack: 'brack', packer: 'bpacker' },
      lbl: { fresh: 'Lösung', unit: 'Kristallboxen', rack: 'Kristallisierer', hud: 'Lösung', dried: 'Kristalle', table: 'Verpackungstisch', sow: 'Ansatz starten', water: 'Kühlen', harvest: 'Lösung abfüllen', seed: 'Ansatz' },
      seedBase: 16, seedUp: 5, growBase: 75, yieldBase: 8, rackBase: 16, rackUp: 7, dryBase: 0.25, packN: 5, price: 44, leaf: '#4FD1C5', dry: '#8FD8FF', bub: '#5BC0EB',
      cost: 15000, needRep: 60, // v97: Mid-Game
      blurb: 'Ein eigenes Chemielabor (rein fiktiv) mit Reaktoren, Kristallisierer und Verpackungstisch unten rechts, unter der Tabakscheune. Die Kunden bestellen dann auch Kristallboxen.', where: 'Sie steht unten rechts unter der Tabakscheune'
    }
  };
  AREAS.keller.where = '';
  AREAS.keller.walls = null; AREAS.tabak.walls = BARN_WALLS; AREAS.brau.walls = BREW_WALLS;
  AREAS.tabak.gate = { x: 2150, y: 500, w: 80, h: 20, cx: 2190, tx: 2190, ty: 540, title: 'TABAKSCHEUNE', titleX: 2190, titleY: 24, thr: [2150, 508, 80, T], rect: BARN_GATE };
  AREAS.brau.gate = { x: 2092, y: 722, w: 80, h: 20, cx: 2132, tx: 2132, ty: 692, title: 'CHEMIELABOR', titleX: 2132, titleY: 1220, thr: [2092, 728, 80, T], rect: BREW_GATE };
  AREAS.tabak.spawn = { y: 468, dir: -1, dy: 0 }; AREAS.keller.spawn = { y: 468, dir: -1, dy: 0 }; AREAS.brau.spawn = { y: 782, dir: 1, dy: 688 };
  const AREA_KEYS = ['keller', 'tabak', 'brau'];
  // Standfelder: hier muss man stehen, um am Gestell oder Packtisch etwas zu tun
  AREAS.keller.fields = { rack: { x0: 455, y0: 148, x1: 575, y1: 190, label: 'Trocknen' }, table: { x0: 455, y0: 322, x1: 575, y1: 364, label: 'Packen' } };
  AREAS.brau.fields = { rack: { x0: 2315, y0: 836, x1: 2435, y1: 878, label: 'Kristallisieren' }, table: { x0: 2315, y0: 1010, x1: 2435, y1: 1052, label: 'Verpacken' } };
  AREAS.tabak.fields = { rack: { x0: 2315, y0: 148, x1: 2435, y1: 190, label: 'Trocknen' }, table: { x0: 2315, y0: 322, x1: 2435, y1: 364, label: 'Packen' } };
  const inField = (f, x, y) => x >= f.x0 && x <= f.x1 && y >= f.y0 && y <= f.y1;
  // Deko-Plätze entlang der Wände
  AREAS.keller.slots = [[100, 72], [200, 72], [300, 72], [400, 72], [500, 72], [76, 300], [76, 370], [576, 200], [576, 380], [150, 488], [300, 488], [250, 488]];
  AREAS.brau.slots = [[1990, 760], [2260, 760], [2380, 760], [1954, 988], [1954, 1058], [2405, 1098], [2405, 1158], [1990, 1176], [2090, 1176], [2190, 1176], [2290, 1176], [2360, 1176]];
  AREAS.tabak.slots = [[1980, 72], [2080, 72], [2180, 72], [2280, 72], [1954, 300], [1954, 370], [2405, 410], [2405, 470], [1990, 488], [2090, 488], [2290, 488], [2360, 488]];
  Object.assign(AREAS.keller, { cols: { pots: POT_COLS, rack: RACK_COL, table: TABLE_COL }, floor: '#2E3B33', wallCol: '#0D1117', sideCost: 900, side: { wall: colliders[2], b: SIDE_B.keller, x: 600, y0: 40, y1: 520, g0: 410, g1: 490, dir: 1 } });
  Object.assign(AREAS.tabak, { cols: { pots: POT2_COLS, rack: RACK2_COL, table: TABLE2_COL }, floor: '#3A3022', wallCol: '#24190F', sideCost: 1100, side: { wall: BARN_WALLS[1], b: SIDE_B.tabak, x: 1920, y0: 40, y1: 520, g0: 410, g1: 490, dir: -1 } });
  Object.assign(AREAS.brau, { cols: { pots: POT3_COLS, rack: RACK3_COL, table: TABLE3_COL }, floor: '#33404C', wallCol: '#141A22', sideCost: 1500, side: { wall: BREW_WALLS[2], b: SIDE_B.brau, x: 1920, y0: 728, y1: 1208, g0: 758, g1: 838, dir: -1 } });
  // v54: Etagen als eigene Umbau-Bereiche (Toepfe, Deko, Boden). Sie stehen nicht in AREA_KEYS, haben also keine eigene Ware.
  for (const [k, f, nm] of [['ku', -1, 'Untergeschoss'], ['ko', 1, '1. Etage']]) {
    const K0 = AREAS.keller, RK = FLRK[f].o, TB = FLTB[f].o, p = f < 0 ? 'u' : 'o';
    AREAS[k] = { key: k, name: nm, isFloor: true, f, fk: p, IN, DOOR: stairStand(FLS[f]), POTS: FLP[f], stairs: [FLS[f]], RACK: RK, TABLE: TB,
      RACK_STAND: { x: RK.x, y: RK.y + 48 }, TABLE_STAND: { x: TB.x, y: TB.y + 40 }, fields: { rack: { x0: RK.x - 60, y0: RK.y + 36, x1: RK.x + 60, y1: RK.y + 78, label: 'Trocknen' }, table: { x0: TB.x - 60, y0: TB.y + 32, x1: TB.x + 60, y1: TB.y + 74, label: 'Packen' } },
      cols: { pots: FLC[f], rack: FLRK[f].c, table: FLTB[f].c, stairs: [STC[f]] }, nv: makeNav(IN, f), claim: FLP[f].map(() => 0), spawn: { y: stairStand(FLS[f]).y, dir: -1, dy: 0 },
      roleKey: { gardener: p + 'gardener', rack: p + 'rack', packer: p + 'packer' }, floor: f < 0 ? '#24272D' : '#3B3A42', wallCol: '#0D1117' };
    for (const q of ['lbl', 'seedBase', 'seedUp', 'growBase', 'yieldBase', 'rackBase', 'rackUp', 'dryBase', 'packN', 'price', 'leaf', 'dry', 'bub', 'cust']) AREAS[k][q] = K0[q];
  }
  STC.d.fl = 9; STC.u.fl = 9; // v104: Etagen abgeschafft, die Treppen im Keller gibt es nicht mehr
  // v89: Mietraum (player.fl = 2, gleiche Grundflaeche wie der Keller, man wird vom Lager-Tor hineinteleportiert).
  // Premium-Anbau nach hohen Standards: eigene Ware (Premium-Blueten -> Apotheken-Dosen), getrennt von den Beuteln, nur fuer die Apotheke.
  const PR_POTS = []; for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) PR_POTS.push({ x: 130 + c * 100, y: 140 + r * 122 });
  const PR_COLS = PR_POTS.map(p => { const c = R(p.x - 18, p.y - 18, 36, 36); c.fl = 2; return c; });
  const PR_RACK = { x: 180, y: 400, w: 140, h: 64 }, PR_RACK_COL = R(110, 368, 140, 64); PR_RACK_COL.fl = 2;
  const PR_TABLE = { x: 380, y: 404, w: 140 }, PR_TABLE_COL = R(310, 376, 140, 56); PR_TABLE_COL.fl = 2;
  R(370, 508, 80, T).fl = 2; R(600, 400, T, 100).fl = 2; // Kellertueren gibt es hier nicht
  const PR_SHELF = { x: 556, y: 84, w: 40, h: 236 }; R(PR_SHELF.x, PR_SHELF.y, PR_SHELF.w, PR_SHELF.h).fl = 2;
  const PR_SHELF_AT = { x: 528, y: 202 }, PR_EXIT = { x: 548, y: 482 }, PR_MAX = 8, PR_SETUP = 60000, PR_SETUP_REP = 90; // v97: Premium erst Richtung Endgame
  AREAS.pr = { key: 'pr', name: 'Mietraum', isPr: true, isFloor: true, f: 2, fk: 'r', nv: makeNav(IN, 2), spawn: { y: PR_EXIT.y - 30, dir: -1, dy: 0 }, IN, DOOR: { x: PR_EXIT.x - 40, y: PR_EXIT.y - 30 }, POTS: PR_POTS, RACK: PR_RACK, TABLE: PR_TABLE,
    RACK_STAND: { x: PR_RACK.x, y: PR_RACK.y + 48 }, TABLE_STAND: { x: PR_TABLE.x, y: PR_TABLE.y + 40 },
    fields: { rack: { x0: PR_RACK.x - 60, y0: PR_RACK.y + 36, x1: PR_RACK.x + 60, y1: PR_RACK.y + 78, label: 'Trocknen' }, table: { x0: PR_TABLE.x - 60, y0: PR_TABLE.y + 32, x1: PR_TABLE.x + 60, y1: PR_TABLE.y + 74, label: 'Abfüllen' } },
    cols: { pots: PR_COLS, rack: PR_RACK_COL, table: PR_TABLE_COL }, claim: PR_POTS.map(() => 0), roleKey: { gardener: 'prgardener', rack: 'prrack', packer: 'prpacker' },
    lbl: { fresh: 'Premium-Blüten', unit: 'Apotheken-Dosen', rack: 'Klima-Trockenschrank', hud: 'Premium', dried: 'Premium trocken', table: 'Abfülltisch', sow: 'Steckling setzen', water: 'Nährlösung geben', harvest: 'Premium ernten', seed: 'Stecklinge' },
    seedBase: 60, seedUp: 8, growBase: 120, yieldBase: 5, rackBase: 10, rackUp: 4, dryBase: 0.18, packN: 3, price: 260, leaf: '#7FE0A0', dry: '#C9A8FF', bub: '#E6E9FF', floor: '#2F3A44', wallCol: '#E4E8EE' };
  const prDef = () => ({ own: false, n: 2, pots: PR_POTS.map(() => ({ s: 0, p: 0, w: 1 })), rack: { wet: 0, dry: 0 }, tab: { dry: 0, bags: 0 }, inv: { fresh: 0, dried: 0, bags: 0 }, up: { seed: 0, grow: 0, yield: 0, rack: 0, dry: 0, water: 0 } });
  function cleanPr(o) {
    const P = prDef(); if (!o || typeof o !== 'object') return P;
    const n = (v, a, b, d) => Number.isFinite(+v) ? clamp(+v, a, b) : d;
    P.own = o.own === true; P.n = Math.round(n(o.n, 2, PR_MAX, 2));
    if (Array.isArray(o.pots)) o.pots.slice(0, PR_MAX).forEach((p, i) => { if (!p || typeof p !== 'object') return; const t = P.pots[i]; t.s = Math.round(n(p.s, 0, 2, 0)); t.p = n(p.p, 0, 1, 0); t.w = n(p.w, 0, 1, 1); });
    for (const [k, f] of [['rack', ['wet', 'dry']], ['tab', ['dry', 'bags']], ['inv', ['fresh', 'dried', 'bags']]]) if (o[k] && typeof o[k] === 'object') for (const q of f) P[k][q] = n(o[k][q], 0, 9999, 0);
    for (const q of ['tab', 'inv']) P[q].bags = Math.floor(P[q].bags);
    if (o.up && typeof o.up === 'object') for (const q of Object.keys(P.up)) P.up[q] = Math.floor(n(o.up[q], 0, 5, 0));
    return P;
  }
  let prVisit = null, prOver = null; // Freundes-ID beim Besuch; prOver: fremder Mietraum beim Zeichnen
  const inRoom = () => !!G && player.fl === 2;
  const prCap = () => 12; // so viele Apotheken-Dosen kann man tragen (zaehlen nicht zu den Beuteln)
  const prPotCost = n => Math.round(4000 * Math.pow(1.4, n - 2) / 10) * 10;
  const PR_UPS = [
    { id: 'grow', name: 'Profi-LED-Panels', desc: 'Pflanzen wachsen 12 % schneller' },
    { id: 'yield', name: 'Nährstoffsystem', desc: '+1 Premium-Blüte pro Ernte' },
    { id: 'rack', name: 'Klima-Trockenschrank', desc: 'Mehr Platz, trocknet schneller' },
    { id: 'dry', name: 'Entfeuchter', desc: 'Trocknet 12 % schneller' },
    { id: 'water', name: 'Tropfbewässerung', desc: 'Pflanzen brauchen seltener Nährlösung' },
    { id: 'seed', name: 'Premium-Genetik', desc: 'Dosen bringen 8 % mehr, Stecklinge kosten etwas mehr' }
  ];
  const prUpCost = (id, l) => Math.round((id === 'seed' ? 9000 : id === 'rack' ? 7000 : 6000) * Math.pow(1.65, l) / 100) * 100;
  CRATE_COL.fl = 9; // v104: keine Sammelkiste mehr (sie gehoerte zu den Etagen)
  const DEC_KEYS = AREA_KEYS.concat(['ku', 'ko']);
  // ---------- Umbau: Stationen verschieben ----------
  const rectsOverlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  function setPot(ar, i, x, y, r) { const p = ar.POTS[i]; p.x = x; p.y = y; if (r !== undefined) p.r = r & 3; const c = ar.cols.pots[i]; c.x = x - 17; c.y = y - 17; }
  const RACK_W = 120, RACK_H = 56, TAB_W = 120, TAB_H = 48; // v61: Gestell und Packtisch etwas kleiner
  const fieldAt = (x, y, d, a, b) => d[0] ? { x0: d[0] > 0 ? x + a : x - b, x1: d[0] > 0 ? x + b : x - a, y0: y - 60, y1: y + 60 } : { x0: x - 60, x1: x + 60, y0: d[1] > 0 ? y + a : y - b, y1: d[1] > 0 ? y + b : y - a };
  function setBox(c, x, y, w, h, q) { const o = q % 2; c.w = o ? h : w; c.h = o ? w : h; c.x = x - c.w / 2; c.y = y - c.h / 2; }
  function setRack(ar, x, y, r) {
    const R0 = ar.RACK; R0.x = x; R0.y = y; if (r !== undefined) R0.r = r & 3; const q = R0.r || 0, d = FDIR[q];
    setBox(ar.cols.rack, x, y, RACK_W, RACK_H, q);
    ar.RACK_STAND.x = x + d[0] * 44; ar.RACK_STAND.y = y + d[1] * 44; Object.assign(ar.fields.rack, fieldAt(x, y, d, 32, 74));
  }
  function setTable(ar, x, y, r) {
    const T0 = ar.TABLE; T0.x = x; T0.y = y; if (r !== undefined) T0.r = r & 3; const q = T0.r || 0, d = FDIR[q];
    setBox(ar.cols.table, x, y, TAB_W, TAB_H, q);
    ar.TABLE_STAND.x = x + d[0] * 36; ar.TABLE_STAND.y = y + d[1] * 36; Object.assign(ar.fields.table, fieldAt(x, y, d, 28, 70));
  }
  function setStair(ar, i, x, y, r) { const p = ar.stairs[i]; p.x = x; p.y = y; if (r !== undefined) p.r = r & 3; setBox(ar.cols.stairs[i], x, y, 34, 44, p.r || 0); if (ar.isFloor) ar.DOOR = stairStand(p); }
  function setCrate(ar, x, y, r) { const k = ar.crate; k.x = x; k.y = y; if (r !== undefined) k.r = r & 3; setBox(ar.cols.crate, x, y, 40, 28, k.r || 0); }
  const xyr = o => o.r ? [o.x, o.y, o.r] : [o.x, o.y];
  const stairsOf = ar => Object.assign(ar.stairs ? { st: ar.stairs.map(xyr) } : {}, ar.crate ? { cr: xyr(ar.crate) } : {});
  function captureLayout(ar) { return Object.assign({ pots: ar.POTS.map(xyr), rack: xyr(ar.RACK), table: xyr(ar.TABLE) }, stairsOf(ar)); }
  function applyLayout(ar, L) {
    L.pots.forEach((p, i) => { if (ar.POTS[i]) setPot(ar, i, p[0], p[1], p[2] | 0); });
    if (ar.stairs && Array.isArray(L.st)) L.st.forEach((p, i) => { if (ar.stairs[i]) setStair(ar, i, p[0], p[1], p[2] | 0); });
    if (ar.crate && Array.isArray(L.cr)) setCrate(ar, L.cr[0], L.cr[1], L.cr[2] | 0);
    setRack(ar, L.rack[0], L.rack[1], L.rack[2] | 0); setTable(ar, L.table[0], L.table[1], L.table[2] | 0);
  }
  // Weiche Drehung beim Zeichnen: Zielwinkel aus der Stufe, die Anzeige laeuft hinterher. Schrift bleibt beim Drehen/Spiegeln lesbar.
  const ROTA = new WeakMap();
  function rotAng(o, q) {
    const tgt = (q || 0) * Math.PI / 2; if (GH_ON) return tgt;
    let st = ROTA.get(o); if (!st) { st = { a: tgt, t: gt }; ROTA.set(o, st); }
    const dt = clamp(gt - st.t, 0, 0.1); st.t = gt; let d = tgt - st.a; d -= Math.round(d / TAU) * TAU;
    st.a = Math.abs(d) < 0.003 ? tgt : st.a + d * Math.min(1, dt * 11); return st.a;
  }
  const rotStk = [];
  function rotBegin(x, y, a, m) {
    ctx.save(); rotStk.push(ctx.fillText);
    const mir = m !== undefined && m !== 1, sg = mir && m < 0 ? -1 : 1;
    if (!a && !mir) return;
    ctx.translate(x, y); if (a) ctx.rotate(a); if (mir) ctx.scale(Math.abs(m) < 0.06 ? 0.06 * sg : m, 1); ctx.translate(-x, -y);
    if (a || sg < 0) { const ft = ctx.fillText; ctx.fillText = function (t, tx, ty, mw) { this.save(); this.translate(tx, ty); if (sg < 0) this.scale(-1, 1); if (a) this.rotate(-a); if (mw === undefined) ft.call(this, t, 0, 0); else ft.call(this, t, 0, 0, mw); this.restore(); }; }
  }
  function rotEnd() { const ft = rotStk.pop(); if (ctx.fillText !== ft) ctx.fillText = ft; ctx.restore(); }
  const BASE = {};
  function rebuildNav(ar) { const n = makeNav(ar.IN, ar.isFloor ? ar.f : undefined); ar.nv.block.set(n.block); }
  function reachSet(nv, gx, gy) {
    const W2 = nv.GW, H2 = nv.GH, seen = new Uint8Array(W2 * H2), q = [gy * W2 + gx]; seen[q[0]] = 1;
    for (let qi = 0; qi < q.length; qi++) {
      const cur = q[qi], cx = cur % W2, cy = (cur / W2) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W2 || ny >= H2) continue;
        const ni = ny * W2 + nx; if (seen[ni] || nv.block[ni]) continue;
        if (dx && dy && (nv.block[cy * W2 + nx] || nv.block[ny * W2 + cx])) continue;
        seen[ni] = 1; q.push(ni);
      }
    }
    return seen;
  }
  // Prueft, ob das aktuelle Layout benutzbar ist: alles im Raum, nichts uebereinander, alle Stellen vom Eingang erreichbar
  function floorLayoutValid(ar) { // Etage: Toepfe im Raum, nicht uebereinander, Treppe frei, alles von der Treppe aus erreichbar
    const I = ar.IN, f = ar.f;
    const inside = (r, m) => r.x >= I.x0 + m && r.y >= I.y0 + m && r.x + r.w <= I.x1 - m && r.y + r.h <= I.y1 - m;
    for (const c of ar.cols.pots.concat(ar.cols.stairs)) { if (!inside(c, 2)) return false; for (const o of colliders) if (o !== c && !isGate(o) && (o.fl === undefined || o.fl === f) && rectsOverlap(c, o)) return false; }
    const nv = makeNav(I, f), d0 = cellOf(nv, ar.DOOR.x, ar.DOOR.y), start = freeCellNear(nv, d0[0], d0[1]); if (!start) return false;
    const seen = reachSet(nv, start[0], start[1]);
    for (const p of ar.POTS.map(q => ({ x: q.x, y: q.y + 30 })).concat([ar.DOOR])) { const c = cellOf(nv, p.x, p.y), fc = freeCellNear(nv, c[0], c[1]); if (!fc || !seen[fc[1] * nv.GW + fc[0]]) return false; }
    return true;
  }
  function layoutValid(ar) {
    const onF = o => ar.isFloor ? (o.fl === undefined || o.fl === ar.f) : !o.fl; // Hindernisse dieser Etage
    const I = ar.IN, own = ar.cols.pots.concat([ar.cols.rack, ar.cols.table], ar.cols.stairs || [], ar.cols.crate ? [ar.cols.crate] : []);
    const inside = (r, m) => r.x >= I.x0 + m && r.y >= I.y0 + m && r.x + r.w <= I.x1 - m && r.y + r.h <= I.y1 - m;
    for (const c of own) { if (!inside(c, 2)) return false; for (const o of colliders) if (o !== c && onF(o) && !isGate(o) && rectsOverlap(c, o)) return false; }
    const fr = [ar.fields.rack, ar.fields.table].map(f => ({ x: f.x0, y: f.y0, w: f.x1 - f.x0, h: f.y1 - f.y0 }));
    for (const f of fr) { if (!inside(f, 2)) return false; for (const o of colliders) if (onF(o) && !isGate(o) && rectsOverlap(f, o)) return false; }
    if (rectsOverlap(fr[0], fr[1])) return false;
    rebuildNav(ar);
    const nv = ar.nv, d0 = cellOf(nv, ar.DOOR.x, ar.DOOR.y), start = freeCellNear(nv, d0[0], d0[1]); if (!start) return false;
    const seen = reachSet(nv, start[0], start[1]);
    const need = [ar.RACK_STAND, ar.TABLE_STAND].concat(ar.crate ? [crateStand()] : [], (ar.stairs || []).map(stairStand), ar.POTS.map((_, i) => ({ x: ar.POTS[i].x, y: ar.POTS[i].y + 30 })), fr.map(f => ({ x: f.x + f.w / 2, y: f.y + f.h / 2 })));
    for (const p of need) { const c = cellOf(nv, p.x, p.y), fc = freeCellNear(nv, c[0], c[1]); if (!fc || !seen[fc[1] * nv.GW + fc[0]]) return false; }
    return true;
  }
  const num2 = (a, d) => (Array.isArray(a) && a.length >= 2 && Number.isFinite(+a[0]) && Number.isFinite(+a[1]) ? [clamp(Math.round(+a[0]), 0, WW), clamp(Math.round(+a[1]), 0, WH)] : d.slice());
  // Layout aus einem Spielstand: kaputte oder unmoegliche Layouts fallen auf die Standardplaetze zurueck
  const num3 = (a, d) => { const v = num2(a, d).slice(0, 2), ok = Array.isArray(a) && a.length >= 2 && Number.isFinite(+a[0]) && Number.isFinite(+a[1]), r = ok ? clamp(Math.floor(+a[2]) || 0, 0, 3) : (d[2] || 0); if (r) v.push(r); return v; };
  function applySavedLayout(ar, L) {
    const b = BASE[ar.key];
    if (!L || typeof L !== 'object') { applyLayout(ar, b); rebuildNav(ar); return null; }
    const pots = Array.isArray(L.pots) ? L.pots : [];
    const stl = ar.stairs ? { st: ar.stairs.map((_, i) => num3(Array.isArray(L.st) ? L.st[i] : null, b.st[i])) } : {};
    if (ar.crate) stl.cr = num3(L.cr, b.cr);
    applyLayout(ar, Object.assign({ pots: ar.POTS.map((_, i) => num3(pots[i], b.pots[i])), rack: num3(L.rack, b.rack), table: num3(L.table, b.table) }, stl));
    if (!layoutValid(ar)) { applyLayout(ar, b); rebuildNav(ar); return null; }
    return JSON.stringify(captureLayout(ar)) === JSON.stringify(b) ? null : captureLayout(ar);
  }
  const stationObj = (ar, kind, i) => kind === 'stair' ? (ar.stairs || [])[i] : kind === 'pot' ? ar.POTS[i] : kind === 'rack' ? ar.RACK : kind === 'crate' ? ar.crate : ar.TABLE;
  function stationPos(ar, kind, i) { const o = stationObj(ar, kind, i); return [o.x, o.y]; }
  function applyStation(ar, kind, i, x, y, r) { if (kind === 'stair') setStair(ar, i, x, y, r); else if (kind === 'pot') setPot(ar, i, x, y, r); else if (kind === 'rack') setRack(ar, x, y, r); else if (kind === 'crate') setCrate(ar, x, y, r); else setTable(ar, x, y, r); }
  // v60: Station um 90 Grad weiterdrehen; passt es nicht, wird die naechste Stellung probiert, sonst bleibt alles wie es war
  function rotateStation(ak, kind, i) {
    const ar = AREAS[ak], o = stationObj(ar, kind, i); if (!o) return false; const r0 = o.r || 0, x0 = o.x, y0 = o.y;
    // passt die Drehung an Ort und Stelle nicht, rueckt die Station so wenig wie moeglich zur Seite (erst grob pruefen, dann den Weg)
    const quick = () => { const I = ar.IN, onF = q => ar.isFloor ? (q.fl === undefined || q.fl === ar.f) : !q.fl, c = kind === 'stair' ? ar.cols.stairs[i] : kind === 'pot' ? ar.cols.pots[i] : ar.cols[kind];
      const rs = [c].concat(kind === 'rack' || kind === 'table' ? [ar.fields[kind]].map(f => ({ x: f.x0, y: f.y0, w: f.x1 - f.x0, h: f.y1 - f.y0 })) : []);
      for (const q of rs) { if (q.x < I.x0 + 2 || q.y < I.y0 + 2 || q.x + q.w > I.x1 - 2 || q.y + q.h > I.y1 - 2) return false; for (const z of colliders) if (z !== c && onF(z) && !isGate(z) && rectsOverlap(q, z)) return false; }
      return true; };
    const offs = [[0, 0]]; for (let d = 8; d <= 120; d += 8) for (let a = 0; a < 16; a++) offs.push([Math.round(Math.cos(a * Math.PI / 8) * d / 2) * 2, Math.round(Math.sin(a * Math.PI / 8) * d / 2) * 2]);
    for (let k = 1; k <= 3; k++) for (const [dx, dy] of offs) {
      applyStation(ar, kind, i, x0 + dx, y0 + dy, (r0 + k) & 3);
      if (quick() && layoutValid(ar)) { commitLayout(ar); save(); return true; }
    }
    applyStation(ar, kind, i, x0, y0, r0); rebuildNav(ar); return false;
  }
  function commitLayout(ar) { const c = captureLayout(ar); G.lay[ar.key] = JSON.stringify(c) === JSON.stringify(BASE[ar.key]) ? null : c; }
  function moveStation(ak, kind, i, x, y) {
    const ar = AREAS[ak]; if (!ar || !stationObj(ar, kind, i)) return false; const o = stationPos(ar, kind, i); // v104: Kiste und Treppen gibt es nicht mehr
    applyStation(ar, kind, i, x, y);
    if (!layoutValid(ar)) { applyStation(ar, kind, i, o[0], o[1]); rebuildNav(ar); return false; }
    commitLayout(ar); save(); return true;
  }
  function resetLayout(ak) { const ar = AREAS[ak]; applyLayout(ar, BASE[ak]); rebuildNav(ar); G.lay[ak] = null; save(); }
  DEC_KEYS.forEach(k => { const ar = AREAS[k]; setRack(ar, ar.RACK.x, ar.RACK.y); setTable(ar, ar.TABLE.x, ar.TABLE.y); rebuildNav(ar); }); // v61: neue Groessen
  DEC_KEYS.forEach(k => { BASE[k] = captureLayout(AREAS[k]); });
  // Seitentuer: gekauft = Lueck in der Wand
  function setSideGeom(ar, own) {
    const s = ar.side;
    if (own) { s.wall.h = s.g0 - s.y0; s.b.x = s.x; s.b.y = s.g1; s.b.w = T; s.b.h = s.y1 - s.g1; }
    else { s.wall.h = s.y1 - s.y0; s.b.x = -9999; }
  }
  function syncSide() {
    for (const k of AREA_KEYS) {
      const ar = AREAS[k], own = !!(G && G.build && G.build.door[k]);
      setSideGeom(ar, own);
      if (ar.sideOn !== own) { ar.sideOn = own; rebuildNav(ar); }
    }
  }
  const S = ar => (ar.key === 'pr' ? (prOver || G.pr) : ar.isFloor ? G.fl[ar.fk] : ar.key === 'keller' ? G : ar.key === 'tabak' ? G.t : G.b);
  const isOpen = ar => ar.key === 'pr' ? !!(G && G.pr && G.pr.own && G.lager.own) : ar.isFloor ? !!(G && G.fl && G.fl[ar.fk].own) : ar.key === 'keller' || !!(G && S(ar) && S(ar).unlocked);
  const openAreas = () => AREA_KEYS.map(k => AREAS[k]).filter(isOpen);
  const syncGate = () => { BARN_GATE.x = G && G.t && G.t.unlocked ? -9999 : 2150; BREW_GATE.x = G && G.b && G.b.unlocked ? -9999 : 2092; syncSide(); };
  const potStand = (ar, i) => ({ x: ar.POTS[i].x, y: ar.POTS[i].y + 30 });
  const DUR = { harvest: 0.8, water: 1.0, plant: 0.6, deposit: 0.5, takedry: 0.5, dropdry: 0.4, pack: 1.6, up: 0.5, down: 0.5, grab: 0.6, crate: 0.5 };
  let workers = [], wid = 0;

  function rebuildWorkers(reset) {
    if (reset) { workers = []; for (const k of DEC_KEYS.concat(AREAS.pr ? ['pr'] : [])) AREAS[k].claim = AREAS[k].POTS.map(() => 0); }
    for (const k of Object.keys(ROLES)) {
      const ar = AREAS[ROLES[k].area];
      let have = workers.filter(w => w.role === k).length;
      while (have < G.staff[k]) {
        const n = workers.filter(w => w.ar === ar).length;
        workers.push({ id: ++wid, role: k, kind: ROLES[k].kind, ar, x: ar.DOOR.x - 24 + (n % 4) * 16, y: ar.spawn.y + ar.spawn.dir * Math.floor(n / 4) * 16, st: 'idle', job: null, path: [], pi: 0, t: 0, wmax: 1, carry: 0, cool: 0.4 + Math.random() * 0.8, ang: -Math.PI / 2, step: 0 });
        have++;
      }
    }
    crewAssign(); // v81: jeder Arbeiter ist ein fester Mitarbeiter mit Level
  }
  function nearestPot(w, test) {
    const ar = w.ar, st = S(ar);
    let best = -1, bd = 1e9;
    for (let i = 0; i < potsOpen(ar); i++) {
      if (ar.claim[i] || !test(st.pots[i])) continue;
      const d = Math.hypot(w.x - ar.POTS[i].x, w.y - ar.POTS[i].y);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }
  function go(w, x, y, job) { w.job = job; w.path = findPath(w.ar.nv, w.x, w.y, x, y); w.pi = 0; w.st = 'walk'; }
  function startPot(w, i, type) { w.ar.claim[i] = w.id; const st = potStand(w.ar, i); go(w, st.x, st.y, { type, pot: i }); }
  function pickJob(w) {
    const ar = w.ar, st = S(ar), RS = ar.RACK_STAND, TS = ar.TABLE_STAND;
    if (w.kind === 'gardener') {
      const space = rackCap(ar) - Math.floor(st.rack.wet + st.rack.dry);
      const ripe = w.carry < 24 ? nearestPot(w, p => p.s === 2) : -1;
      if (w.carry > 0 && space > 0 && (ripe < 0 || w.carry >= 12)) return go(w, RS.x, RS.y, { type: 'deposit' });
      if (ripe >= 0) return startPot(w, ripe, 'harvest');
      let i = nearestPot(w, p => p.s === 1 && p.w < 0.5);
      if (i >= 0) return startPot(w, i, 'water');
      i = G.money >= seedCost(ar) ? nearestPot(w, p => p.s === 0) : -1;
      if (i >= 0) return startPot(w, i, 'plant');
      if (w.carry > 0) return go(w, RS.x, RS.y, { type: 'deposit' });
    } else if (w.kind === 'rack') {
      if (w.carry > 0) return go(w, TS.x, TS.y, { type: 'dropdry' });
      if (Math.floor(st.rack.dry) >= 3 && st.tab.dry < 30) return go(w, RS.x, RS.y, { type: 'takedry' });
    } else {
      if (st.tab.dry >= ar.packN && st.tab.bags < bagsMax()) return go(w, TS.x, TS.y, { type: 'pack' });
      if (w.carry > 0) return go(w, TS.x, TS.y, { type: 'dropdry' });
      if (G.staff[ar.roleKey.rack] === 0 && Math.floor(st.rack.dry) >= 3 && st.tab.dry < 30) return go(w, RS.x, RS.y, { type: 'takedry' });
      if (Math.hypot(w.x - TS.x, w.y - TS.y) > 14) return go(w, TS.x, TS.y, { type: 'home' });
    }
    w.cool = 0.6;
  }
  function arrive(w) {
    const j = w.job;
    if (!j || j.type === 'home') { w.st = 'idle'; w.job = null; w.cool = 0.4; return; }
    w.st = 'work'; w.wmax = w.t = (DUR[j.type] || 0.6) * (1 - 0.2 * G.staffUp[w.role].skill) * crewDur(w);
  }
  function finishJob(w) {
    const j = w.job; w.job = null; w.st = 'idle'; w.cool = 0.15;
    if (!j) return;
    const ar = w.ar, st = S(ar), L = ar.lbl;
    if (j.pot !== undefined) ar.claim[j.pot] = 0;
    crewXp(w, j.type); // v81
    if (j.type === 'harvest') { const p = st.pots[j.pot]; if (p.s === 2) { w.carry += harvestYield(ar) + crewHarvestBonus(w); p.s = 0; p.p = 0; if (G.kr) G.kr.cnt.hv++; } }
    else if (j.type === 'water') { const p = st.pots[j.pot]; if (p.s === 1) p.w = 1; }
    else if (j.type === 'plant') {
      const p = st.pots[j.pot], sc = seedCost(ar);
      if (p.s === 0 && G.money >= sc) { G.money -= sc; p.s = 1; p.p = 0; p.w = 1; floater(ar.POTS[j.pot].x, ar.POTS[j.pot].y - 20, '−' + fmt(sc), '#FF8FA3'); }
    } else if (j.type === 'deposit') {
      const space = rackCap(ar) - Math.floor(st.rack.wet + st.rack.dry), n = Math.min(Math.floor(w.carry), Math.max(0, space));
      if (n > 0) { st.rack.wet += n; w.carry -= n; floater(ar.RACK.x, ar.RACK.y + 50, '+' + n + ' ' + L.fresh, ar.leaf); }
      if (w.carry > 0) w.cool = 1.5;
    } else if (j.type === 'takedry') {
      const n = Math.min(Math.floor(st.rack.dry), Math.max(0, Math.floor(30 - st.tab.dry))); if (n > 0) { st.rack.dry -= n; w.carry += n; }
    } else if (j.type === 'dropdry') {
      const n = Math.min(w.carry, 30 - st.tab.dry); if (n > 0) { st.tab.dry += n; w.carry -= n; }
      if (w.carry > 0) w.cool = 1.5;
    } else if (j.type === 'pack') {
      if (st.tab.dry >= ar.packN && st.tab.bags < bagsMax()) { st.tab.dry -= ar.packN; st.tab.bags += 1; if (!ar.isFloor || player.fl === ar.f) sfx.pack(); }
    } else if (j.type === 'up') { // Treppe rauf/runter: Laeufer wechselt die Etage
      const fa = AREAS[j.to]; if (fa && isOpen(fa)) { w.ar = fa; w.x = fa.DOOR.x; w.y = fa.DOOR.y; w.path = []; }
    } else if (j.type === 'down') {
      const sp = stairStand(ar.f < 0 ? STAIR_D : STAIR_U); w.ar = AREAS.keller; w.x = sp.x; w.y = sp.y; w.path = [];
    } else if (j.type === 'grab') {
      const n = Math.min(st.tab.bags, 20 + crewCarryBonus(w) - w.carry); if (n > 0) { st.tab.bags -= n; w.carry += n; }
    } else if (j.type === 'crate') {
      const n = Math.min(w.carry, CRATE_MAX - G.crate); if (n > 0) { G.crate += n; w.carry -= n; floater(CRATE.x, CRATE.y - 24, '+' + n, '#FFB547'); }
      if (w.carry > 0) w.cool = 2;
    }
  }
  function workerUpdate(w, dt) {
    if (G && G.pn && G.pn.on && w.ar === AREAS.keller) { panicWorker(w, dt); return; } // v122: Notknopf
    if (w.st !== 'walk' && w.st !== 'work' && crewOff(w)) return; // v81: krank
    w.cool -= dt;
    if (w.st === 'walk') {
      const p = w.path[w.pi];
      if (!p) { arrive(w); return; }
      const dx = p.x - w.x, dy = p.y - w.y, d = Math.hypot(dx, dy), sp = 88 * (1 + 0.15 * G.staffUp[w.role].speed) * crewSpd(w) * dt;
      if (d <= sp) { w.x = p.x; w.y = p.y; w.pi++; if (w.pi >= w.path.length) arrive(w); }
      else { w.x += dx / d * sp; w.y += dy / d * sp; w.ang = Math.atan2(dy, dx); w.step += dt * 9; }
    } else if (w.st === 'work') {
      w.t -= dt; if (w.t <= 0) finishJob(w);
    } else if (w.cool <= 0) pickJob(w);
  }
  function wageTotal() { if (G && G.kr && !KR_NEUTRAL) { crewSync(); return Math.round(G.kr.crew.reduce((n, m) => n + crewWage(m), 0)); } return Math.round(Object.keys(ROLES).reduce((n, k) => n + G.staff[k] * ROLES[k].wage, 0) * wageK()); }
  const UPKEEP = { keller: 0, tabak: 25, brau: 60 };
  const wageK = () => G ? 1 + repEff(clamp(G.rep, 0, REP_MAX)) / 12 : 1; // v121: Loehne und Unterhalt steigen mit dem Ruf (vorher fast bedeutungslos)
  function dailyCosts() {
    let up = 0;
    floorAreas().forEach(ar => { up += 3 * potsOpen(ar); });
    AREA_KEYS.forEach(k => { if (k === 'tabak' && !G.t.unlocked) return; if (k === 'brau' && !G.b.unlocked) return; up += (UPKEEP[k] || 0) + 3 * potsOpen(AREAS[k]); });
    return { wages: wageTotal(), upkeep: Math.round(up * krUpkeep() * wageK()), tax: Math.round(Math.max(0, G.earned - (G.eod || 0)) * 0.04) };
  }
  function payDaily() {
    bankInterest(); // v94: Sparzinsen der Stadtsparkasse
    heatDaily(); // v100: Razzia-Gefahr
    const c = dailyCosts(), total = c.wages + c.upkeep + c.tax; G.eod = G.earned;
    if (!total) return;
    const paid = Math.min(G.money, total); G.money -= paid;
    const parts = [c.wages && 'Löhne −' + fmt(c.wages), c.upkeep && 'Unterhalt −' + fmt(c.upkeep), c.tax && 'Steuern −' + fmt(c.tax)].filter(Boolean).join(' · ');
    msg('Tag ' + (G.day - 1) + ' vorbei: ' + parts + (paid < total ? ' (Geld reicht nicht ganz)' : ''), paid < total);
  }
  function payWages() {
    const total = wageTotal(); if (!total) return;
    const paid = Math.min(G.money, total); G.money -= paid;
    msg(paid >= total ? 'Tag vorbei, Löhne bezahlt: −' + fmt(paid) : 'Das Geld reicht nicht für alle Löhne: −' + fmt(paid), paid < total);
  }
  const UPG_COST = [250, 500, 900];
  function upgradeStaff(role, key) {
    const lv = G.staffUp[role][key]; if (lv >= 3) return false;
    const c = UPG_COST[lv]; if (G.money < c) { sfx.bad(); msg('Zu wenig Geld', true); return false; }
    G.money -= c; G.staffUp[role][key]++; sfx.buy(); save();
    msg(ROLES[role].name + ': ' + (key === 'speed' ? 'Tempo' : 'Geschick') + ' Stufe ' + G.staffUp[role][key]);
    return true;
  }
  function hire(role) {
    const r = ROLES[role]; if (!r) return false;
    if (!isOpen(AREAS[r.area])) return false;
    const n = G.staff[role];
    if (n >= r.max || G.rep < r.rep || G.money < r.cost[n]) return false;
    G.money -= r.cost[n]; G.staff[role]++; rebuildWorkers(false); sfx.buy(); save(); msg(r.name + ' angeheuert');
    return true;
  }
  function buyArea(ar) {
    if (isOpen(ar) || G.rep < ar.needRep || G.money < ar.cost) return false;
    G.money -= ar.cost; S(ar).unlocked = true; syncGate(); sfx.buy(); save();
    msg(ar.name + ' gekauft. ' + ar.where);
    return true;
  }
  function drawWorkers() {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const w of workers) {
      if (!GH_ON && (w.ar.isFloor ? w.ar.f : 0) !== (player.fl || 0)) continue; // nur Helfer auf deiner Etage
      if (w.gone) continue; // v122: nach dem Notknopf weg
      const r = ROLES[w.role], bob = w.st === 'walk' ? Math.sin(w.step) * 1.2 : 0;
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ell(w.x + 2, w.y + 5, 8, 4.5); ctx.fill();
      ctx.fillStyle = r.col; ctx.beginPath(); ctx.arc(w.x, w.y + bob * 0.3, 8.5, 0, TAU); ctx.fill();
      const hx = w.x + Math.cos(w.ang) * 2.5, hy = w.y + Math.sin(w.ang) * 2.5;
      ctx.fillStyle = '#F1C9A5'; ctx.beginPath(); ctx.arc(hx, hy, 5, 0, TAU); ctx.fill();
      ctx.fillStyle = r.cap; ctx.beginPath(); ctx.arc(hx, hy - 0.5, 5, Math.PI, TAU); ctx.fill();
      if (w.carry > 0) {
        ctx.fillStyle = w.kind === 'gardener' ? w.ar.leaf : w.ar.dry;
        ctx.beginPath(); ctx.arc(w.x, w.y - 17, 6.5, 0, TAU); ctx.fill();
        ctx.fillStyle = '#10151C'; ctx.font = '800 9px sans-serif'; ctx.fillText(String(Math.floor(w.carry)), w.x, w.y - 16.5);
      }
      if (w.st === 'idle' && w.kind !== 'gardener' && w.kind !== 'runner' && S(w.ar).tab.bags >= bagsMax()) { ctx.fillStyle = '#FF8FA3'; ctx.beginPath(); ctx.arc(w.x + 9, w.y - 14, 6, 0, TAU); ctx.fill(); ctx.fillStyle = '#10151C'; ctx.font = '800 10px sans-serif'; ctx.fillText('!', w.x + 9, w.y - 13.5); }
      if (w.st === 'work') {
        ctx.strokeStyle = '#FFB547'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.arc(w.x, w.y, 13, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - w.t / w.wmax)); ctx.stroke();
      }
    }
  }

