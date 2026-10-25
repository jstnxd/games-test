  // ---------- Streife ----------
  // v60: tagsueber (6:30 bis 19:30) laeuft die Uhr langsamer, nachts schneller: der Tag dauert gut doppelt so lange wie die Nacht
  const timeRate = t => (t >= 390 && t < 1170) ? 1.5 : 2.7; // v92: noch langsamer (vorher 2 / 3,6), ein Tag dauert jetzt etwa 12,7 Minuten // v88: langsamer (vorher 3 / 5,5), ein Tag dauert jetzt etwa 9,5 statt 6,3 Minuten
  function copsActive() { const night = G.time < 5 * 60 || G.time >= 21 * 60; return 1 + (night ? 1 : 0) + (G.rep >= 18 ? 1 : 0) + (G.rep >= 60 ? 1 : 0); } // v53: entspannter
  // v41: Im Mehrspieler steuert der Spieler mit der kleinsten ID (Anführer) Streifen und Wagen, alle anderen sehen dasselbe.
  function copLeaderId() { let id = mp.id; if (mp.on) for (const k of Object.keys(mp.friends)) if (k < id) id = k; return id; }
  const copLead = () => !mp.on || copLeaderId() === mp.id;
  let wasLead = true;
  function updateCops(dt) {
    const n = copsActive(), carrying = carryTotal() > 0, outside = !inBuilding(player.x, player.y), lead = copLead();
    if (lead && !wasLead) cops.forEach(c => { c.tx = -1; c.pause = 0; c.st = 'patrol'; });
    wasLead = lead;
    const tg = []; // Ziele für den Anführer: alle, die draußen Ware tragen
    if (lead) {
      if (carrying && outside && player.x >= 0) tg.push({ x: player.x, y: player.y });
      if (mp.on) for (const f of Object.values(mp.friends)) if (f.vis && f.cy && f.rg === '') tg.push({ x: f.x, y: f.y });
    }
    const sight = petPerk().sight || 1;
    cops.forEach((c, i) => {
      if (lead) c.on = i < n;
      if (!c.on) return;
      if (c.stun > 0) c.stun -= dt;
      if (c.stun <= 0) c.ko = 0;
      if (!lead) { // Mitspieler: nur glätten, was der Anführer meldet
        if (c.sx !== undefined) {
          const dx = c.sx - c.x, dy = c.sy - c.y, d = Math.hypot(dx, dy);
          if (d > 300) { c.x = c.sx; c.y = c.sy; } else { const k = Math.min(1, dt * 9); c.x += dx * k; c.y += dy * k; }
          if (d > 1.5 && c.stun <= 0) c.step += dt * 9;
          let da = c.sa - c.ang; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; c.ang += da * Math.min(1, dt * 10);
        }
        return;
      }
      if (c.stun > 0) { c.st = 'patrol'; return; }
      let moving = false;
      if (c.st === 'alert') {      // verfolgt die letzte bekannte Position; verliert er dich 1,5 s aus den Augen, sucht er nur noch
        c.al -= dt; c.sawT = (c.sawT || 0) + dt; if (c.sawT > 1.35) c.al = Math.min(c.al, 0);
        const tx = c.lx - c.x, ty = c.ly - c.y, dd = Math.hypot(tx, ty);
        if (dd > 6) { // v49: Jagd deutlich langsamer (vorher 80-88) und mit Anlauf; Blickrichtung dreht weich, Hindernisse werden umlaufen
          c.run = Math.min(1, (c.run || 0) + dt * 0.7);
          const sp = (46 + Math.min(G.rep, 40) * 0.22) * (0.55 + 0.45 * c.run) /* v60: etwas schneller als v53 */, a0 = Math.atan2(ty, tx), a = avoid(c, a0, dt, c.lx, c.ly, Math.min(30, dd));
          const rem = turnTo(c, a === null ? a0 : a, dt, 7), f = Math.max(0.35, Math.cos(rem));
          { const ox = c.x, oy = c.y; move(c, Math.cos(c.ang) * sp * f * dt, Math.sin(c.ang) * sp * f * dt, 9); if (onPath(c.x, c.y)) { c.x = ox; c.y = oy; } else moving = true; } // v56: Trampelpfade sind tabu
        }
        if (c.al <= 0) { c.st = 'search'; c.sr = 3; }
      } else if (c.st === 'search') { // sucht die Umgebung ab
        c.sr -= dt; c.ang += Math.cos((4.5 - c.sr) * 1.6 + i * 1.3) * dt * 1.5; // v49: schwenkt den Blick hin und her statt sich zu drehen
        if (c.sr <= 0) { c.st = 'patrol'; c.tx = -1; }
      } else {
        moving = roamStep(c, dt, c.sp, 2.8);
        if (!moving) c.ang += Math.sin(gt * 0.8 + i * 2.3) * dt * 0.6; // beim Stehen ruhig umschauen
      }
      if (moving) c.step += dt * 9;
      let best = null, bd = 1e9;
      for (const t of tg) {
        const dx = t.x - c.x, dy = t.y - c.y, d = Math.hypot(dx, dy);
        let da = Math.atan2(dy, dx) - c.ang; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
        if (((d < copRange() && Math.abs(da) < COP_CONE) || d < 34 * sight) && d < bd) { bd = d; best = t; }
      }
      if (best) { if (c.st !== 'alert') { c.run = 0; c.ds = 0; c.dsT = 0; } c.st = 'alert'; c.al = 3; c.sawT = 0; c.lx = best.x; c.ly = best.y; }
    });
    // v97: Partner der Streife
    cops.forEach((c, i) => { const m = copMates[i], want = !!(G && c.on && G.rep >= COP_PAIR_REP && zoneRepAt(c.x, c.y) >= COP_PAIR_REP && !player.fl);
      if (want && !m.on) { m.on = true; m.x = c.x - 20; m.y = c.y + 12; m.ang = c.ang; m.st = 'patrol'; m.stun = 0; }
      if (!want && m.on && m.st !== 'alert') m.on = false;
      if (!m.on) return;
      if (m.stun > 0) { m.stun -= dt; if (m.stun <= 0) m.ko = 0; m.st = 'patrol'; return; }
      if (c.st === 'alert' && m.st !== 'alert') { m.st = 'alert'; m.al = 4.5; m.sawT = 0; m.lx = c.lx; m.ly = c.ly; m.run = 0; }
      let mv = false;
      if (m.st === 'alert') { m.al -= dt; m.sawT = (m.sawT || 0) + dt; if (m.sawT > 2.4) m.al = Math.min(m.al, 0);
        const tx = m.lx - m.x, ty = m.ly - m.y, dd = Math.hypot(tx, ty);
        if (dd > 6) { m.run = Math.min(1, m.run + dt * 0.9); const sp = (52 + Math.min(G.rep, 60) * 0.22) * (0.55 + 0.45 * m.run), a0 = Math.atan2(ty, tx), a = avoid(m, a0, dt, m.lx, m.ly, Math.min(30, dd)); const rem = turnTo(m, a === null ? a0 : a, dt, 8), f = Math.max(0.35, Math.cos(rem)); move(m, Math.cos(m.ang) * sp * f * dt, Math.sin(m.ang) * sp * f * dt, 9); mv = true; }
        if (m.al <= 0) { m.st = 'patrol'; } }
      else { const ox = c.x - Math.cos(c.ang) * 16 + Math.cos(c.ang + Math.PI / 2) * 18, oy = c.y - Math.sin(c.ang) * 16 + Math.sin(c.ang + Math.PI / 2) * 18, dx = ox - m.x, dy = oy - m.y, d = Math.hypot(dx, dy);
        if (d > 260) { m.x = ox; m.y = oy; } else if (d > 3) { const sp = Math.min(d * 3, 70) * dt, a0 = Math.atan2(dy, dx); turnTo(m, a0, dt, 8); move(m, dx / d * sp, dy / d * sp, 9); mv = true; } else { let da = c.ang - m.ang; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; m.ang += da * Math.min(1, dt * 4); } }
      if (mv) m.step += dt * 9;
      if (lead) for (const t of tg) { const dx = t.x - m.x, dy = t.y - m.y, d = Math.hypot(dx, dy); let da = Math.atan2(dy, dx) - m.ang; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
        if ((d < copRange() && Math.abs(da) < COP_CONE) || d < 34 * sight) { if (m.st !== 'alert') m.run = 0; m.st = 'alert'; m.al = 4.5; m.sawT = 0; m.lx = t.x; m.ly = t.y; if (c.st !== 'alert' && c.stun <= 0) { c.st = 'alert'; c.al = 3; c.sawT = 0; c.lx = t.x; c.ly = t.y; c.run = 0; } } } });
    // Eigener Verdacht: gilt für jeden Spieler auf seinem eigenen Gerät
    let seen = false, near = false;
    cops.concat(copMates.filter(m => m.on)).forEach(c => {
      c.seen = false;
      if (!c.on || c.stun > 0) return;
      if (c.st !== 'alert') c.sir = false;
      const dx = player.x - c.x, dy = player.y - c.y, d = Math.hypot(dx, dy);
      let da = Math.atan2(dy, dx) - c.ang; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU;
      const vis = (d < copRange() && Math.abs(da) < COP_CONE) || d < 34 * sight;
      if (vis && outside) {
        c.seen = true; seen = true; if (d < 120) near = true;
        if (carrying) {
          if (c.st === 'alert' && !c.sir) { c.sir = true; sfx.siren(); }
          if (c.st === 'alert' && d < 10) sus = Math.min(1, sus + dt * 2.5);
        }
      }
    });
    if (seen && carrying) sus = Math.min(1, sus + dt * 0.3 * (near ? 1.15 : 1) * (petPerk().sus || 1)); // v53: langsamer misstrauisch
    else sus = Math.max(0, sus - dt * 0.5 * (gymOn('yoga') ? 1.6 : 1)); // v94: Yoga beruhigt
    if (sus >= 1) busted();
  }
  function copSync() { return cops.map(c => [Math.round(c.x), Math.round(c.y), Math.round(c.ang * 100), c.st === 'alert' ? 1 : c.st === 'search' ? 2 : 0, Math.round(Math.max(0, c.stun) * 10), c.ko ? 1 : 0, c.on ? 1 : 0]); }
  function carSync() { return cars.slice(0, 4).map(c => [c.id, Math.round(c.x), c.dir, Math.round(c.v)]); }
  function mpApplyCops(cp, cr) {
    if (Array.isArray(cp)) cp.slice(0, cops.length).forEach((q, i) => {
      if (!Array.isArray(q)) return;
      const c = cops[i], x = +q[0], y = +q[1]; if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      c.sx = clamp(x, XMIN, WW); c.sy = clamp(y, YMIN, WH); c.sa = Number.isFinite(+q[2]) ? +q[2] / 100 : c.ang;
      c.st = +q[3] === 1 ? 'alert' : +q[3] === 2 ? 'search' : 'patrol'; c.on = +q[6] === 1;
      if (!(gt < (c.hold || 0))) { c.stun = clamp((+q[4] || 0) / 10, 0, 20); c.ko = +q[5] === 1 ? 1 : 0; }
      if (!c.syn) { c.x = c.sx; c.y = c.sy; c.ang = c.sa; c.syn = true; }
    });
    mpApplyCars(cr);
  }
  function mpApplyCopHits(peer, list) {
    if (!copLead()) return;
    for (const z of list) {
      if (!z || typeof z.k !== 'string' || z.k.length > 12) continue;
      const key = peer + ':' + z.k; if (mp.seenHit[key]) continue; mp.seenHit[key] = gt;
      for (const k of Object.keys(mp.seenHit)) if (gt - mp.seenHit[k] > 8) delete mp.seenHit[k];
      const c = cops[Math.floor(+z.i)], st = clamp(+z.s || 0, 0, 15); if (!c || !(st > 0)) continue;
      c.stun = Math.max(c.stun, st); if (z.o) c.ko = 1; c.seen = false; c.st = 'patrol';
    }
  }
  function copHitSend(c, st, ko) { if (copLead() || !mp.on || c.mate) return; c.hold = gt + 1.5; mp.copHits.push({ k: Math.random().toString(36).slice(2, 8), i: cops.indexOf(c), s: st, o: ko ? 1 : 0, t: gt }); mp.sendT = 9; }
  // ---------- Streifenwagen (v40) ----------
  const cars = []; let carT = 90, carQ = null, carN = 0, carLead = true;
  function spawnCar(dir) {
    dir = dir < 0 ? -1 : 1;
    const a = 300 + Math.random() * Math.max(100, WW - 1300), len = 350 + Math.random() * 500;
    cars.push({ id: mp.id + '.' + (++carN), x: dir > 0 ? -160 : WW + 160, y: dir > 0 ? LANES[1].c : LANES[0].c, dir, v: 150, hi: 150 + Math.random() * 30, lo: 62 + Math.random() * 14, za: a, zb: a + len });
  }
  function updateCars(dt) {
    if (player.carCd > 0) player.carCd -= dt;
    const lead = copLead();
    if (lead !== carLead) { if (!lead) for (let i = cars.length - 1; i >= 0; i--) if (!cars[i].rem) cars.splice(i, 1); carQ = null; carLead = lead; }
    if (lead) cars.forEach(c => { if (c.rem) { c.rem = false; c.za = c.zb = c.x; c.hi = 160; } });
    if (lead && state === 'play' && G.rep >= 5) {
      carT -= dt;
      if (carT <= 0) {
        const d = Math.random() < 0.5 ? 1 : -1; spawnCar(d); sfx.siren(); msg('Streifenwagen unterwegs');
        if (Math.random() < 0.4) carQ = { t: 4 + Math.random() * 4, d: -d };
        carT = 200 + Math.random() * 160; // v60: etwas haeufiger als v53
      }
    }
    if (carQ) { carQ.t -= dt; if (carQ.t <= 0) { spawnCar(carQ.d); carQ = null; } }
    for (let i = cars.length - 1; i >= 0; i--) {
      const c = cars[i];
      if (c.rem) { c.v = c.sv; c.x += (c.sx + c.dir * c.sv * (gt - c.sT) - c.x) * Math.min(1, dt * 10); }
      else {
        const slow = c.x > c.za && c.x < c.zb, tv = slow ? c.lo : c.hi;
        c.v += clamp(tv - c.v, -110 * dt, 110 * dt);
        c.x += c.dir * c.v * dt;
      }
      if ((c.dir > 0 && c.x > WW + 200) || (c.dir < 0 && c.x < -200)) { cars.splice(i, 1); continue; }
      if (!(player.carCd > 0) && Math.abs(player.x - c.x) < 30 && Math.abs(player.y - c.y) < 17 && !inBuilding(player.x, player.y)) {
        player.carCd = 14; player.stun = Math.max(player.stun, 5);
        mp.kb = { x: c.dir * 200, y: (player.y < (RDH[0].c0 + RDH[0].c1) / 2 ? -1 : 1) * 300, t: 0.5 };
        floater(player.x, player.y - 24, 'K.O.', '#FFD24A'); sfx.bad(); G.stat.car++; vibrate([90, 50, 120]); msg('Vom Streifenwagen erwischt!', true);
        if (carryTotal() > 0) sus = Math.min(1, sus + 0.4);
      }
    }
  }
  function drawCars() {
    cars.forEach(c => {
      if (c.x < cam.x - 700 || c.x > cam.x + 700) return;
      ctx.save(); ctx.translate(c.x, c.y); if (c.dir < 0) ctx.scale(-1, 1);
      ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(-21, -8, 46, 22);
      ctx.fillStyle = '#F2F5FA'; ctx.beginPath(); ctx.roundRect(-23, -11, 46, 22, 5); ctx.fill();
      ctx.fillStyle = '#2F63C9'; ctx.fillRect(-23, -2.5, 46, 5);
      ctx.fillStyle = '#26324A'; ctx.fillRect(2, -9, 8, 18); ctx.fillRect(-14, -9, 5, 18);
      const f = Math.floor(gt * 6) % 2;
      ctx.fillStyle = f ? '#FF3B5C' : '#7A1B2C'; ctx.fillRect(-4, -9, 5, 8);
      ctx.fillStyle = f ? '#2D4A8A' : '#4B8DFF'; ctx.fillRect(-4, 1, 5, 8);
      ctx.fillStyle = '#FFE9A0'; ctx.fillRect(21, -9, 3, 4); ctx.fillRect(21, 5, 3, 4);
      ctx.restore();
      const g = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, 70); g.addColorStop(0, f2(c)); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, 70, 0, TAU); ctx.fill();
    });
  }
  const f2 = () => Math.floor(gt * 6) % 2 ? 'rgba(255,59,92,.22)' : 'rgba(75,141,255,.22)';
  function mpApplyCars(cr) {
    if (!Array.isArray(cr)) return;
    const seen = {};
    for (const q of cr.slice(0, 4)) {
      if (!Array.isArray(q) || typeof q[0] !== 'string' || q[0].length > 24 || !Number.isFinite(+q[1])) continue;
      const dir = +q[2] < 0 ? -1 : 1, v = clamp(+q[3] || 0, 0, 300), x = clamp(+q[1], XMIN - 400, WW + 400); seen[q[0]] = 1;
      let c = cars.find(z => z.id === q[0]);
      if (!c) { c = { id: q[0], x, y: dir > 0 ? LANES[1].c : LANES[0].c, dir, v, hi: 160, lo: 70, za: 0, zb: 0, rem: true }; cars.push(c); if (G && state === 'play') { sfx.siren(); msg('Streifenwagen unterwegs'); } }
      c.sx = x; c.sv = v; c.sT = gt;
    }
    for (let i = cars.length - 1; i >= 0; i--) if (cars[i].rem && !seen[cars[i].id]) cars.splice(i, 1);
  }
  // ---------- Fahrzeuge (v48) ----------
  const riding = () => !!(G && G.veh && G.veh.on && VEH_BY[G.veh.eq]);
  const rideMult = () => riding() ? VEH_BY[G.veh.eq].mult : 1; // Verhaeltnis zum Grundtempo zu Fuss
  const ownedVehs = () => VEHS.filter(v => G.veh.owned[v.id]);
  // v71: ein ausgewaehltes Rad/Roller UND ein ausgewaehltes Auto; eigene Knoepfe fuer beide
  const selBike = () => { const id = G.veh.bike; return VEH_BY[id] && !VEH_BY[id].car && G.veh.owned[id] ? id : (VEHS.find(v => !v.car && G.veh.owned[v.id]) || {}).id; };
  const selCar = () => { const id = G.veh.car; return VEH_BY[id] && VEH_BY[id].car && G.veh.owned[id] ? id : (VEHS.find(v => v.car && G.veh.owned[v.id]) || {}).id; };
  const carCap = () => { const id = G && G.veh ? selCar() : null, v = id && VEH_BY[id]; return v ? v.cap + cargoBonus(id) : 0; }; // v80: plus Laderaum-Ausbau
  const carColI = id => { const v = VEH_BY[id], c = G && G.veh && G.veh.col ? G.veh.col[id] : undefined; return Number.isInteger(c) && c >= 0 && c < CAR_COLS.length ? c : (v && v.col) || 0; };
  function buyCar(id) { const v = VEH_BY[id]; if (!v || !v.car || !atAutohof()) return false; return buyVeh(id); }
  function paintCar(id, ci) { if (!VEH_BY[id] || !G.veh.owned[id] || !(ci >= 0 && ci < CAR_COLS.length)) return false; G.veh.col = G.veh.col || {}; G.veh.col[id] = ci; sfx.put(); save(); return true; }
  function buyVeh(id) {
    const v = VEH_BY[id]; if (!v || G.veh.owned[id] || !canPay(v.cost) || G.rep < v.rep) return false;
    payCost(v.cost); G.veh.owned[id] = true; if (!G.veh.on) G.veh.eq = id; if (v.car) G.veh.car = id; else G.veh.bike = id; sfx.buy(); save(); msg(v.name + (v.car ? ' gekauft. Mit dem Auto-Knopf (Taste C) einsteigen.' : ' gekauft. Mit dem Rad-Knopf (Taste V) aufsteigen.')); return true;
  }
  function equipVeh(id) { const v = VEH_BY[id]; if (!v || !G.veh.owned[id]) return false; if (v.car) G.veh.car = id; else G.veh.bike = id; if (!G.veh.on || !VEH_BY[G.veh.eq] || !!VEH_BY[G.veh.eq].car === !!v.car) G.veh.eq = id; player.carOn = false; save(); return true; }
  function toggleRide(force, kind) { // kind: 'car' oder 'bike'; ohne Angabe das zuletzt benutzte
    if (!G || state !== 'play') return false;
    if (!ownedVehs().length) { msg('Kaufe zuerst ein Fahrzeug: Räder im Handy unter Fahrzeuge, Autos am Autohof', true); return false; }
    kind = kind || (VEH_BY[G.veh.eq] && VEH_BY[G.veh.eq].car ? 'car' : 'bike');
    let id = kind === 'car' ? selCar() : selBike();
    if (!id) { if (force === false) { G.veh.on = false; return true; } id = kind === 'car' ? selBike() : selCar(); if (!id || force === undefined) { msg(kind === 'car' ? 'Kaufe zuerst ein Auto am Autohof' : 'Kaufe zuerst ein Rad oder einen Roller im Handy unter Fahrzeuge', true); return false; } }
    const switching = G.veh.on && G.veh.eq !== id;
    const on = force === undefined ? (switching ? true : !G.veh.on) : !!force;
    if (on && (inBuilding(player.x, player.y) || player.stun > 0)) { msg('Hier kannst du nicht fahren', true); return false; }
    if (on) { G.veh.eq = id; if (switching) player.carOn = false; }
    G.veh.on = on; sfx.put(); return true;
  }

  // ---------- Lager im Ostpark (v66) ----------
  // Hier liegt Ware sicher: keine Polizei, keine Gangs, keine Mitspieler. Mehr Platz gibt es mit jedem Stockwerk.
  const LAGER_COST = 2500, LAGER_REP = 25, LAGER_UP = [4000, 9000, 18000], lagerCap = () => 150 + 150 * G.lager.lv;
  function cleanLager(o) {
    const L = { own: false, lv: 0, inv: [0, 0, 0, 0, 0, 0, 0, 0, 0] }; if (!o || typeof o !== 'object') return L;
    L.own = o.own === true; L.lv = clamp(Math.floor(+o.lv) || 0, 0, LAGER_UP.length);
    if (Array.isArray(o.inv)) L.inv = L.inv.map((_, j) => clamp(Math.floor(+o.inv[j]) || 0, 0, 150 * (LAGER_UP.length + 1)));
    return L;
  }
  const atLager = () => !!G && !player.fl && Math.hypot(player.x - LAGER_AT.x, player.y - LAGER_AT.y) < 46;
  const atAutohof = () => !!G && !player.fl && Math.hypot(player.x - AH_AT.x, player.y - AH_AT.y) < 52;
  const atWerk = () => !!G && !player.fl && Math.hypot(player.x - WS_AT.x, player.y - WS_AT.y) < 56;
  // ---------- v98: In Betten schlafen ----------
  const BED_IDS = ['bed', 'bunkbed', 'dbed'];
  const decKeyHere = () => player.fl === -1 ? 'ku' : player.fl === 1 ? 'ko' : player.fl ? null : areaAt(player.x, player.y);
  function bedNear() { if (!G || !G.dec) return null; const k = decKeyHere(); if (!k || !G.dec.items[k]) return null; let best = null, bd = 46; for (const it of G.dec.items[k]) { if (!BED_IDS.includes(it.id)) continue; const d = Math.hypot(player.x - it.x, player.y - it.y); if (d < bd) { bd = d; best = it; } } return best; }
  let sleepS = null, sleepEl = null;
  const nextAt = hr => { const now = absMin(), dayStart = now - G.time; let t = dayStart + hr * 60; if (t <= now + 30) t += 1440; return t; };
  function sleepAsk() {
    if (!bedNear() || sleepS) return false; if (riding()) toggleRide(false);
    if (!sleepEl) { sleepEl = document.createElement('div'); sleepEl.className = 'sleepbox'; document.body.appendChild(sleepEl); }
    const hh = String(Math.floor(G.time / 60)).padStart(2, '0') + ':' + String(Math.floor(G.time % 60)).padStart(2, '0');
    sleepEl.innerHTML = '<div class="sl-card"><div class="sl-t">🛏️ Schlafen</div><div class="sl-d">Es ist ' + hh + ' Uhr. Während du schläfst, wachsen und trocknen deine Pflanzen weiter und deine Helfer arbeiten. Kunden warten so lange.</div><div class="sl-b"><button data-h="7">🌅 Bis morgens (7 Uhr)</button><button data-h="19">🌆 Bis abends (19 Uhr)</button><button data-h="0" class="alt">Wach bleiben</button></div></div>';
    sleepEl.hidden = false; joy.id = null; joy.dx = joy.dy = 0; aHeld = false; bHeld = false;
    sleepEl.querySelectorAll('[data-h]').forEach(b => b.addEventListener('click', () => { const hr = +b.dataset.h; if (!hr) { sleepEl.hidden = true; return; } sleepStart(hr); }));
    return true;
  }
  function sleepStart(hr) {
    if (!G) return false; const to = nextAt(hr); sleepS = { to, from: absMin(), hr, day0: G.day };
    if (!sleepEl) { sleepEl = document.createElement('div'); sleepEl.className = 'sleepbox'; document.body.appendChild(sleepEl); }
    sleepEl.hidden = false; sleepEl.innerHTML = '<div class="sl-night"><div class="sl-z">Z<span>z</span><span>z</span></div><div class="sl-clock"></div><div class="sl-bar"><i></i></div></div>'; sfx.put(); return true;
  }
  function sleepTick() { // simuliert die Spielzeit in kleinen Schritten, ohne dass Kunden ablaufen
    const s = sleepS; if (!s) return; const t0 = performance.now(); let n = 0;
    joy.dx = joy.dy = 0; for (const k in keys) keys[k] = false;
    while (absMin() < s.to && n < 400 && performance.now() - t0 < 14) { update(0.25); n++; }
    const p = Math.min(1, (absMin() - s.from) / Math.max(1, s.to - s.from)), hh = String(Math.floor(G.time / 60)).padStart(2, '0') + ':' + String(Math.floor(G.time % 60)).padStart(2, '0');
    if (sleepEl) { const c = sleepEl.querySelector('.sl-clock'), bi = sleepEl.querySelector('.sl-bar i'); if (c) c.textContent = hh + ' Uhr'; if (bi) bi.style.width = Math.round(p * 100) + '%'; }
    if (absMin() >= s.to) { sleepS = null; if (sleepEl) sleepEl.hidden = true; save(); msg(s.hr === 7 ? '🌅 Guten Morgen! Ausgeschlafen bis ' + hh + ' Uhr' : '🌆 Ausgeschlafen bis ' + hh + ' Uhr'); sfx.ping(); }
  }

  // ---------- v94: Fitnessstudio, Pizzeria, Bank, Nachtclub ----------
  const atB = q => !!G && !player.fl && Math.hypot(player.x - q.x, player.y - q.y) < 44;
  const atGym2 = () => atB(GYM2_AT), atGym = () => atB(GYM_AT) || atGym2(), atBank = () => atB(BANK_AT), atPizza = () => atB(PIZZA_AT), atClub = () => atB(CLUB_AT);
  const GYM_TR = { run: { n: 'Ausdauer', ic: '🏃', ds: '12 % schneller unterwegs' }, kraft: { n: 'Kraft', ic: '🏋️', ds: '+10 Platz im Rucksack' }, yoga: { n: 'Yoga', ic: '🧘', ds: 'Verdacht sinkt 60 % schneller' } };
  const gymCost = () => 300 + 25 * Math.min(40, G.rep);
  const gymOn = k => !!(G && G.buf && G.buf.gym && G.buf.gym.k === k && absMin() < G.buf.gym.u);
  const gymCostNow = () => G && G.biz && G.biz.gym && G.biz.gym.own ? 0 : gymCost();
  function gymTrain(k) { if (!GYM_TR[k] || !atGym()) return false; const c = gymCostNow(); if (G.money < c) return false; G.money -= c; G.buf.gym = { k, u: absMin() + 1440 }; G.stat.gym = (G.stat.gym || 0) + 1; sfx.cash(); msg(GYM_TR[k].ic + ' ' + GYM_TR[k].n + '-Training: ' + GYM_TR[k].ds + ' für einen Spieltag'); save(); return true; }
  const staffN = () => Object.values(G.staff || {}).reduce((a, b) => a + (b | 0), 0);
  const pizzaCost = () => 40 * Math.max(2, staffN());
  const pizzaOn = () => !!(G && G.buf && G.buf.pizza && absMin() < G.buf.pizza);
  function pizzaOrder() { const pc = G.biz && G.biz.pizza && G.biz.pizza.own ? 0 : pizzaCost(); if (!atPizza() || G.money < pc) return false; G.money -= pc; G.buf.pizza = absMin() + 720; G.stat.pizza = (G.stat.pizza || 0) + 1; sfx.cash(); msg('🍕 Pizza fürs Team! Deine Helfer arbeiten einen halben Tag 25 % schneller'); save(); return true; }
  const BANK_REP = 20, CLUB_REP = 30;
  // v126: Konto-Stufen (Online-Banking, Gold, Platin) und grosse Kaeufe per Ueberweisung
  const BANK_LV = [{ n: 'Sparkonto', c: 0, rep: 20, z: 0.006, k: 1 }, { n: 'Online-Banking', c: 20000, rep: 20, z: 0.006, k: 1, ds: 'Einzahlen und abheben überall per Handy, nicht nur am Schalter.' }, { n: 'Gold-Konto', c: 150000, rep: 60, z: 0.010, k: 2, ds: '1,0 % Zinsen pro Spieltag und doppelter Höchstbetrag.' }, { n: 'Platin-Konto', c: 600000, rep: 85, z: 0.014, k: 4, ds: '1,4 % Zinsen pro Spieltag und vierfacher Höchstbetrag.' }];
  const bankLv = () => clamp(Math.floor(+(G && G.bk) || 0), 0, 3);
  const bankCap = () => (200000 + 5000 * Math.min(300, G.rep)) * BANK_LV[bankLv()].k;
  const bankRate = () => BANK_LV[bankLv()].z + ((G.kr && KR().perk.zins) || 0);
  const bankHere = () => atBank() || bankLv() >= 1;
  const BIG_PAY = 50000, CASH_FEE = 0.1; // ab 50.000 € wird ueberwiesen; wer bar zahlt, zahlt 10 % Aufschlag und faellt auf
  const bigCost = c => { const fb = Math.min(Math.max(0, G.bank || 0), c); return { bank: fb, cash: c - fb > 0 ? Math.ceil((c - fb) * (1 + CASH_FEE)) : 0 }; };
  function canPay(c) { if (c < BIG_PAY) return G.money >= c; return G.money >= bigCost(c).cash; }
  function payCost(c) { if (!canPay(c)) return false; if (c < BIG_PAY) { G.money -= c; return true; } const q = bigCost(c); G.bank -= q.bank; G.money -= q.cash; if (q.cash) { G.heat = Math.min(100, (G.heat || 0) + Math.min(15, q.cash / 25000)); msg('💸 ' + fmt(q.cash) + ' bar bezahlt (10 % Aufschlag, die Polizei wird aufmerksam). Per Konto wäre es günstiger.', true); } else msg('🏦 Per Überweisung vom Konto bezahlt.'); return true; }
  const payHint = c => c < BIG_PAY ? '' : (G.bank || 0) >= c ? ' · zahlt dein Konto' : ' · bar ' + fmt(bigCost(c).cash) + ' (10 % Aufschlag ohne Konto)';
  function bankUp() { const n = bankLv() + 1, L = BANK_LV[n]; if (!L || G.rep < L.rep) return false; const fb = Math.min(G.bank || 0, L.c); if (fb + G.money < L.c) return false; G.bank -= fb; G.money -= L.c - fb; G.bk = n; sfx.buy(); save(); msg('🏦 ' + L.n + ' freigeschaltet: ' + L.ds); return true; }
  function bankMove(v) { if (!bankHere() || G.rep < BANK_REP) return false; v = Math.floor(v); if (v > 0) { v = Math.min(v, G.money, bankCap() - G.bank); if (v <= 0) return false; G.money -= v; G.bank += v; } else if (v < 0) { v = Math.min(-v, G.bank); if (v <= 0) return false; G.bank -= v; G.money += v; } else return false; sfx.cash(); save(); return true; }
  function bankInterest() { if (!G || !(G.bank > 0)) return; const z = Math.min(Math.round(G.bank * bankRate()), Math.max(0, bankCap() - G.bank)); if (z > 0) { G.bank += z; G.stat.bankZ = (G.stat.bankZ || 0) + z; setTimeout(() => { try { msg('🏦 Sparzinsen: +' + fmt(z) + ' auf dein Konto'); } catch (e) {} }, 2600); } }
  const clubNight = () => Math.floor((absMin() + 360) / 1440); // eine Clubnacht geht von 18 bis 6 Uhr
  const clubOpen = () => !!G && (G.time >= 21 * 60 || G.time < 5 * 60);
  const clubMax = () => 4 + Math.floor(Math.min(200, G.rep) / 40) + (G.biz && G.biz.club && G.biz.club.own ? 3 : 0);
  const clubLeft = () => { if (G.club.n !== clubNight()) return clubMax(); return Math.max(0, clubMax() - G.club.s); };
  const clubProds = () => AREA_KEYS.filter(k => isOpen(AREAS[k]));
  function clubSell(prod) { const ar = AREAS[prod]; if (!atClub() || !clubOpen() || G.rep < CLUB_REP || !ar || !isOpen(ar) || clubLeft() <= 0) return false; const st = S(ar); if (st.inv.bags < 3) return false;
    if (G.club.n !== clubNight()) { G.club.n = clubNight(); G.club.s = 0; } const pay = Math.round(basePrice(prod) * 3 * 1.6 * krTip()); st.inv.bags -= 3; G.money += pay; G.earned += pay; G.club.s++; G.stat.club = (G.stat.club || 0) + 1; G.stat.del++;
    sfx.cash(); floater(player.x, player.y - 20, '+' + fmt(pay), '#FF5CA8'); save(); return true; }
  const openB = t => () => { if (riding()) toggleRide(false); tab = t; openPhone(); sfx.ping(); return true; };
  const openGym = openB('gym'), openBank = openB('bank'), openPizza = openB('pizza'), openClub = openB('club');
  // ---------- v100: Laeden kaufen (Makler) und Geld waschen ----------
  const BIZ = {
    pizza: { name: 'Pizzeria Bella Notte', ic: '🍕', shelf: 150, cost: 80000, rep: 30, cap: 50000, rate: 1500, fee: 0.15, perk: 'Team-Pizza gratis', at: () => PIZZA_AT },
    gym: { name: 'Iron Gym', ic: '🏋️', shelf: 300, cost: 200000, rep: 40, cap: 150000, rate: 4000, fee: 0.12, perk: 'Training gratis', at: () => GYM_AT },
    club: { name: 'Neon Club', ic: '🪩', shelf: 500, cost: 600000, rep: 55, cap: 500000, rate: 12000, fee: 0.10, perk: '+3 Club-Lieferungen pro Nacht', at: () => CLUB_AT }
  };
  const bizOwn = k => !!(G && G.biz && G.biz[k] && G.biz[k].own);
  const atMakler = () => atB(MAKLER_AT);
  let bizIn = null;
  function bizBuy(k) { const d = BIZ[k]; if (!d || bizOwn(k) || !atMakler() || G.rep < d.rep || !canPay(d.cost)) return false; payCost(d.cost); G.biz[k] = { own: true, dirty: 0, done: 0, acc: 0, inv: [0, 0, 0, 0, 0, 0, 0, 0, 0] }; sfx.buy(); save(); msg(d.ic + ' ' + d.name + ' gehört jetzt dir! Im Hinterzimmer kannst du Geld waschen.'); return true; }
  function bizEnter(k) { if (!bizOwn(k)) return false; const q = BIZ[k].at(); if (Math.hypot(player.x - q.x, player.y - q.y) > 60) return false; if (riding()) toggleRide(false); bizIn = k; player.fl = 3; player.x = BIZ_EXIT.x; player.y = BIZ_EXIT.y - 40; cam.x = player.x; cam.y = player.y; petSnap(); sfx.put(); closePhone(); msg(BIZ[k].ic + ' Hinterzimmer · Am Tresor wäschst du Bargeld'); return true; }
  function bizLeave() { const k = bizIn || 'pizza', q = BIZ[k].at(); player.fl = 0; bizIn = null; player.x = q.x; player.y = q.y; cam.x = player.x; cam.y = player.y; petSnap(); sfx.put(); return true; }
  function bizDeposit(k, v) { const d = BIZ[k], b = G.biz[k]; if (!d || !b || player.fl !== 3 || bizIn !== k) return false; v = Math.floor(Math.min(v, G.money, d.cap - b.dirty)); if (v <= 0) return false; G.money -= v; b.dirty += v; sfx.cash(); save(); return true; }
  function bizTick(dt) { // wäscht pro Spielstunde einen festen Betrag, abzüglich Gebühr, direkt aufs Konto
    if (!G || !G.biz) return; const gm = dt * timeRate(G.time);
    for (const k of Object.keys(G.biz)) { const b = G.biz[k], d = BIZ[k]; if (!b.own || !(b.dirty > 0)) continue; const w = Math.min(b.dirty, d.rate / 60 * gm); b.dirty -= w; b.done += w; b.acc = (b.acc || 0) + w * (1 - d.fee); if (b.acc >= 1) { const n = Math.floor(b.acc); b.acc -= n; G.bank = (G.bank || 0) + n; } if (b.dirty < 0.5) { b.dirty = 0; } }
  }
  // v102: Regal im Hinterzimmer: Ware sicher vor Razzien lagern und wieder rausnehmen
  const bizInv = k => { const b = G.biz[k]; if (!b) return null; if (!Array.isArray(b.inv) || b.inv.length !== 9) b.inv = [0, 0, 0, 0, 0, 0, 0, 0, 0]; return b.inv; };
  const bizShelfHere = () => player.fl === 3 && !!bizIn && Math.hypot(player.x - BIZ_SHELF_AT.x, player.y - BIZ_SHELF_AT.y) < 60;
  function bizPut(k) { if (!bizShelfHere() || bizIn !== k) return 0; const a = bizInv(k), inv = STASH_INV(); let room = BIZ[k].shelf - stashSum(a), n = 0;
    for (const j of [2, 1, 0]) for (let q = 0; q < 3; q++) { const f = STASH_F[j], v = Math.min(Math.floor(inv[q][f]), room); if (v > 0) { inv[q][f] -= v; a[q * 3 + j] += v; room -= v; n += v; } }
    if (n) { sfx.put(); save(); msg(n + ' Stück ins Regal gelegt'); } else msg(carryTotal() >= 1 ? 'Das Regal ist voll' : 'Du hast nichts dabei', true); return n; }
  function bizTake(k, q0, lim) { if (!bizShelfHere() || bizIn !== k) return 0; const a = bizInv(k), inv = STASH_INV(); let n = 0, left = lim === undefined ? 1e9 : Math.max(0, Math.floor(lim));
    for (let q = 0; q < 3; q++) { if (q0 !== undefined && q !== q0) continue; for (const j of [2, 1, 0]) { let v = a[q * 3 + j]; if (!v || left <= 0) continue; if (j === 2) v = Math.min(v, Math.max(0, bagCap() - totalBags())); v = Math.min(v, left); left -= v; inv[q][STASH_F[j]] += v; a[q * 3 + j] -= v; n += v; } }
    if (n) { sfx.put(); save(); msg(n + ' Stück mitgenommen'); } else msg('Nichts mitzunehmen (Rucksack voll?)', true); return n; }
  function renderBizShelf(b) {
    const k = bizIn, d = BIZ[k]; if (!d || !bizShelfHere()) { uiInfo(b, 'Das Regal steht im Hinterzimmer deiner Läden.'); return; }
    const a = bizInv(k); uiInfo(b, '📦 Regal im Hinterzimmer · ' + stashSum(a) + ' / ' + d.shelf + ' Plätze belegt<br>Was hier liegt, findet die Polizei bei einer Razzia im Keller nicht.');
    const card = (nm, pr, ds, lab, dis, fn, alt) => { const c = uiEl('div', 'card'); c.innerHTML = '<div class="nm">' + nm + '</div><div class="pr">' + pr + '</div><div class="ds">' + ds + '</div>'; const bt = uiEl('button', 'buy' + (alt ? ' alt' : ''), lab); bt.disabled = dis; bt.addEventListener('click', () => { fn(); renderPhone(); }); c.appendChild(bt); b.appendChild(c); return c; };
    card('Alles einlagern', carryTotal() + ' dabei', 'Legt deine ganze Ware ins Regal, Beutel zuerst.', 'Einlagern', carryTotal() < 1 || stashSum(a) >= d.shelf, () => bizPut(k));
    card('Alles mitnehmen', stashSum(a) + ' im Regal', 'Nimmt alles mit, so viele Beutel wie in den Rucksack passen.', 'Mitnehmen', !stashSum(a), () => bizTake(k), true);
    [AREAS.keller, AREAS.tabak, AREAS.brau].forEach((ar, q) => { const n = a[q * 3] + a[q * 3 + 1] + a[q * 3 + 2]; if (!n) return; let qn = n;
      const c = card(ar.name, n + ' Stück', a[q * 3 + 2] + ' ' + ar.lbl.unit + ' · ' + a[q * 3 + 1] + ' trocken · ' + a[q * 3] + ' frisch', 'Mitnehmen', false, () => bizTake(k, q, qn), true);
      if (n > 1) { const qr = qtyRow(n, n, v => { qn = v; }); qr.style.gridColumn = '1 / -1'; c.insertBefore(qr, c.lastChild); } });
  }
  const bizTarget = (px, py) => { if (Math.hypot(px - BIZ_SHELF_AT.x, py - BIZ_SHELF_AT.y) < 52) return { type: 'bshelf', idx: 0, ar: AREAS.keller }; if (Math.hypot(px - BIZ_EXIT.x, py - BIZ_EXIT.y) < 44) return { type: 'bexit', idx: 0, ar: AREAS.keller }; if (Math.hypot(px - BIZ_SAFE.x, py - (BIZ_SAFE.y + 26)) < 48) return { type: 'safe', idx: 0, ar: AREAS.keller }; return null; };
  // ---------- v100: Razzien im Keller (ab Ruf 45) ----------
  const RAID_REP = 45;
  try { document.getElementById('raidPill').addEventListener('click', e => { e.stopPropagation(); if (G) openB('raid')(); }); } catch (e) {}
  const raidPending = () => !!(G && G.raid && G.raid.at > absMin());
  function heatDaily() { if (!G || KR_NEUTRAL) return; const e = Math.max(0, G.earned - (G.heatE || G.earned)); G.heatE = G.earned; G.heat = clamp((G.heat || 0) * 0.85 + e / 6000, 0, 100);
    if (G.rep >= RAID_REP && !G.raid && Math.random() < Math.min(0.45, G.heat / 160)) { G.raid = { at: absMin() + (8 + Math.floor(Math.random() * 7)) * 60 }; setTimeout(() => { try { msg('🚨 Ein Tipp aus der Szene: Heute kommt eine Razzia in deinen Keller! Räum die Ware weg oder besteche jemanden.', true); vibrate([90, 60, 90]); } catch (e) {} }, 3200); } }
  const raidBribe = () => Math.round(15000 + G.rep * 400 + (G.heat || 0) * 300);
  function raidPay() { if (!raidPending() || G.money < raidBribe()) return false; G.money -= raidBribe(); G.raid = null; G.heat = Math.max(0, G.heat - 25); sfx.cash(); save(); msg('Bezahlt. Die Razzia wurde „verschoben“.'); return true; }
  const raidSeizable = () => { const st = S(AREAS.keller); let n = (st.rack.wet || 0) + (st.rack.dry || 0) + (st.tab.dry || 0) + (st.tab.bags || 0) * 3 + (G.crate || 0) * 3; for (const f of ['u', 'o']) { const q = G.fl && G.fl[f]; if (q && q.own) n += (q.rack.wet || 0) + (q.rack.dry || 0) + (q.tab.dry || 0) + (q.tab.bags || 0) * 3; } return Math.round(n); };
  let raidVis = null;
  // ---------- v122: Notknopf im Keller (Razzia) ----------
  // Stufe 1: Helfer lassen alles stehen und liegen und verlassen den Keller, bis du Entwarnung gibst oder die Razzia vorbei ist.
  // Stufe 2: Sie bringen vorher alle Ware aus dem Keller ins Mietlager-Regal und nach der Razzia zurueck.
  // Stufe 3: Was nicht ins Regal passt, kommt in ein Geheimversteck; der Knopf wird bei angekuendigter Razzia von selbst gedrueckt.
  const PANIC_AT = { x: 318, y: 494 }; R(PANIC_AT.x - 14, PANIC_AT.y - 8, 28, 16).fl = 0;
  const PANIC_UP = [0, 25000, 90000], PANIC_TR = 12; // Kosten je Stufe (Stufe 1 gratis), Dauer des Transports in Sekunden
  const pnDef = () => ({ lv: 1, on: 0, mv: [0, 0, 0], hid: [0, 0, 0], tr: null });
  function cleanPn(o) { const P = pnDef(); if (!o || typeof o !== 'object') return P; const n = (v, a, b) => clamp(Number.isFinite(+v) ? +v : 0, a, b);
    P.lv = Math.round(n(o.lv, 1, 3)) || 1; P.on = o.on ? 1 : 0; for (const k of ['mv', 'hid']) if (Array.isArray(o[k])) P[k] = [0, 1, 2].map(i => Math.floor(n(o[k][i], 0, 99999)));
    if (o.tr && (o.tr.d === 'out' || o.tr.d === 'back')) P.tr = { d: o.tr.d, t: n(o.tr.t, 0, PANIC_TR) }; return P; }
  const PN = () => G.pn || (G.pn = pnDef());
  const panicOn = () => !!(G && G.pn && G.pn.on);
  function panicPress(auto) {
    const P = PN();
    if (P.tr) { msg('Deine Helfer sind noch unterwegs …'); return false; }
    if (!P.on) {
      P.on = 1; sfx.siren && sfx.siren(); vibrate([120, 60, 120]);
      for (const w of workers) if (w.ar === AREAS.keller) panicDrop(w);
      if (P.lv >= 2 && (G.lager.own || P.lv >= 3)) { P.tr = { d: 'out', t: 0 }; msg((auto ? '🚨 Razzia angekündigt: Der Notknopf wurde automatisch gedrückt. ' : '🚨 Notknopf! ') + 'Deine Helfer räumen den Keller leer und bringen alles weg.', true); }
      else msg('🚨 Notknopf! Deine Helfer lassen alles stehen und liegen und verschwinden. ' + (P.lv >= 2 ? 'Ohne Mietlager können sie nichts mitnehmen.' : 'Bring die Ware selbst in Sicherheit, z. B. ins Mietlager.'), true);
    } else panicBack(false);
    save(); return true;
  }
  function panicBack(afterRaid) { // Entwarnung: Ware zurueck (ab Stufe 2), dann arbeiten alle weiter
    const P = PN(); if (!P.on || P.tr) return;
    if (P.lv >= 2 && (P.mv.some(v => v > 0) || P.hid.some(v => v > 0))) { P.tr = { d: 'back', t: 0 }; msg(afterRaid ? 'Die Polizei ist weg. Deine Helfer bringen die Ware zurück in den Keller.' : 'Entwarnung: Deine Helfer bringen die Ware zurück.'); }
    else { P.on = 0; panicResume(); msg(afterRaid ? 'Die Polizei ist weg. Deine Helfer arbeiten weiter.' : 'Entwarnung: Deine Helfer arbeiten weiter.'); }
  }
  function panicDrop(w) { // alles fallen lassen, was sie gerade tragen (bleibt im Keller)
    const st = S(AREAS.keller); if (w.carry > 0) { if (w.kind === 'gardener') st.rack.wet += w.carry; else if (w.kind === 'rack') st.tab.dry += w.carry; else G.crate = Math.min(CRATE_MAX, (G.crate || 0) + Math.floor(w.carry)); w.carry = 0; }
    w.job = null; w.path = []; w.st = 'flee';
  }
  function panicResume() { for (const w of workers) if (w.ar === AREAS.keller && (w.gone || w.st === 'flee')) { w.gone = 0; w.x = DOOR.x - 20 + Math.random() * 40; w.y = DOOR.y - 10; w.st = 'idle'; w.job = null; w.path = []; w.cool = 0.5 + Math.random(); } }
  function panicWorker(w, dt) { if (w.gone) return; if (w.st !== 'flee') panicDrop(w); const dx = DOOR.x - w.x, dy = DOOR.y + 20 - w.y, d = Math.hypot(dx, dy), sp = 170 * dt; if (d < 8) { w.gone = 1; return; } w.x += dx / d * Math.min(d, sp); w.y += dy / d * Math.min(d, sp); w.ang = Math.atan2(dy, dx); w.step += dt * 14; }
  function panicMoveOut() {
    const P = PN(), st = S(AREAS.keller), a = G.lager.inv; let room = G.lager.own ? Math.max(0, lagerCap() - stashSum(a)) : 0;
    const take = [st.rack.wet || 0, (st.rack.dry || 0) + (st.tab.dry || 0), (st.tab.bags || 0) + (G.crate || 0)].map(v => Math.floor(v));
    st.rack.wet -= take[0]; let dr = take[1]; const fromT = Math.min(st.tab.dry || 0, dr); st.tab.dry -= fromT; st.rack.dry = Math.max(0, (st.rack.dry || 0) - (dr - fromT));
    const fromB = Math.min(st.tab.bags || 0, take[2]); st.tab.bags -= fromB; G.crate = Math.max(0, (G.crate || 0) - (take[2] - fromB));
    let toL = 0, toH = 0;
    for (const j of [2, 1, 0]) { const v = Math.min(take[j], room); a[j] += v; P.mv[j] += v; room -= v; toL += v; const rest = take[j] - v; if (rest > 0) { if (P.lv >= 3) { P.hid[j] += rest; toH += rest; } else { if (j === 0) st.rack.wet += rest; else if (j === 1) st.tab.dry += rest; else G.crate = Math.min(CRATE_MAX, (G.crate || 0) + rest); } } }
    const left = Math.round((st.rack.wet || 0) + (st.rack.dry || 0) + (st.tab.dry || 0) + (st.tab.bags || 0) + (G.crate || 0));
    msg('📦 Keller geräumt: ' + toL + ' Stück ins Mietlager' + (toH ? ', ' + toH + ' ins Geheimversteck' : '') + (left ? '. ' + left + ' Stück passten nicht mehr rein und liegen noch im Keller!' : '. Der Keller ist leer.'), !!left);
  }
  function panicMoveBack() {
    const P = PN(), st = S(AREAS.keller), a = G.lager.inv; let back = 0;
    for (const j of [0, 1, 2]) { const v = Math.min(P.mv[j], a[j]) + P.hid[j]; a[j] -= Math.min(P.mv[j], a[j]); P.mv[j] = 0; P.hid[j] = 0; back += v; if (!v) continue;
      if (j === 0) st.rack.wet += v; else if (j === 1) st.tab.dry += v; else { const t = Math.min(v, Math.max(0, bagsMax() - (st.tab.bags || 0))); st.tab.bags += t; G.crate = Math.min(CRATE_MAX, (G.crate || 0) + v - t); } }
    msg('📦 Deine Helfer haben ' + back + ' Stück zurück in den Keller gebracht und arbeiten weiter.');
  }
  function panicTick(dt) {
    if (!G) return; const P = PN();
    if (P.lv >= 3 && !P.on && raidPending() && G.raid.at - absMin() <= 180) panicPress(true);
    if (!P.tr) return; P.tr.t += dt;
    if (P.tr.t >= PANIC_TR) { const d = P.tr.d; P.tr = null; if (d === 'out') panicMoveOut(); else { panicMoveBack(); P.on = 0; panicResume(); } sfx.put(); save(); }
  }
  function drawPanicBtn() {
    const x = PANIC_AT.x, y = PANIC_AT.y, on = panicOn(), bl = on && Math.floor(gt * 4) % 2;
    if (on) { const g = ctx.createRadialGradient(x, y, 2, x, y, 46); g.addColorStop(0, 'rgba(255,60,60,' + (bl ? .45 : .2) + ')'); g.addColorStop(1, 'rgba(255,60,60,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 46, 0, TAU); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,.35)'; rr(x - 13, y - 6, 28, 18, 4); ctx.fill(); ctx.fillStyle = '#F2C14E'; rr(x - 14, y - 8, 28, 18, 4); ctx.fill();
    ctx.fillStyle = '#10151C'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - 14 + k * 8, y + 10); ctx.lineTo(x - 10 + k * 8, y - 8); ctx.lineTo(x - 7 + k * 8, y - 8); ctx.lineTo(x - 11 + k * 8, y + 10); ctx.fill(); }
    ctx.fillStyle = '#2A2F38'; ctx.beginPath(); ctx.arc(x, y + 1, 8, 0, TAU); ctx.fill(); ctx.fillStyle = on ? (bl ? '#FF8A8A' : '#FF3B3B') : '#E5383B'; ctx.beginPath(); ctx.arc(x, y, 6.2, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(x - 2, y - 2, 1.8, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(16,21,28,.82)'; rr(x - 16, y - 24, 32, 12, 3); ctx.fill(); signTxt('NOT', x, y - 18, '900 7.5px sans-serif', on ? '#FF8A8A' : '#FFD0D0');
    const P = G.pn; if (P && P.tr) { const p = P.tr.t / PANIC_TR; ctx.fillStyle = 'rgba(16,21,28,.85)'; rr(x - 30, y - 40, 60, 10, 4); ctx.fill(); ctx.fillStyle = P.tr.d === 'out' ? '#FFB547' : '#5FE584'; rr(x - 28, y - 38, 56 * p, 6, 3); ctx.fill(); }
  }
  function panicCard(b) { // im Handy: Geschaeft -> Ausbau (Keller)
    const P = PN(), nx = P.lv < 3 ? PANIC_UP[P.lv] : 0, c = uiEl('div', 'card');
    const txt = ['', 'Stufe 1: Deine Helfer lassen alles stehen und liegen und verlassen den Keller. So füllt er sich vor einer Razzia nicht wieder.', 'Stufe 2: Sie bringen vorher alle Ware aus dem Keller ins Mietlager-Regal und nach der Razzia wieder zurück.', 'Stufe 3: Was nicht ins Regal passt, kommt ins Geheimversteck. Bei einer angekündigten Razzia drücken sie den Knopf von selbst.'];
    c.appendChild(uiEl('div', 'nm', '🚨 Notknopf · Stufe ' + P.lv + ' / 3' + (P.on ? ' · gedrückt' : ''))); c.appendChild(uiEl('div', 'pr', nx ? fmt(nx) : 'max.'));
    const ds = uiEl('div', 'ds'); ds.innerHTML = 'Roter Knopf unten an der Wand neben der Kellertür.<br>' + txt[P.lv] + (nx ? '<br><b>Nächste Stufe:</b> ' + txt[P.lv + 1].replace(/^Stufe \d: /, '') : '') + (P.lv >= 2 && !G.lager.own ? '<br><b style="color:var(--amber)">Dafür brauchst du das Mietlager im Gewerbegebiet.</b>' : ''); c.appendChild(ds);
    const bt = uiEl('button', 'buy', nx ? 'Ausbauen' : 'Fertig'); bt.disabled = !nx || G.money < nx; bt.addEventListener('click', () => { if (!nx || G.money < nx) return; G.money -= nx; P.lv++; sfx.buy(); save(); msg('🚨 Notknopf Stufe ' + P.lv); renderPhone(); }); c.appendChild(bt); b.appendChild(c);
  }
  function raidRun() {
    try { store.set(SAVE_KEY + '.vorRazzia', signSave(saveObj())); } catch (e) {} // v122: Sicherung vor jeder Razzia
    const st = S(AREAS.keller), inK = (player.fl === -1 || player.fl === 1) || (!player.fl && areaAt(player.x, player.y) === 'keller'); let bags = (st.tab.bags || 0) + (G.crate || 0), raw = (st.rack.wet || 0) + (st.rack.dry || 0) + (st.tab.dry || 0);
    st.rack.wet = 0; st.rack.dry = 0; st.tab.dry = 0; st.tab.bags = 0; G.crate = 0;
    for (const f of ['u', 'o']) { const q = G.fl && G.fl[f]; if (!q || !q.own) continue; bags += q.tab.bags || 0; raw += (q.rack.wet || 0) + (q.rack.dry || 0) + (q.tab.dry || 0); q.rack.wet = 0; q.rack.dry = 0; q.tab.dry = 0; q.tab.bags = 0; }
    let plants = 0; for (let i = 0; i < potsOpen(AREAS.keller); i++) { const p = G.pots[i]; if (p && p.s > 0) { plants++; p.s = 0; p.p = 0; } } // v122: Pflanzen weg, Toepfe bleiben
    let fine = Math.round(G.money * (inK ? 0.2 : 0.1)); if (inK) { bags += G.inv.bags; G.inv.bags = 0; G.inv.fresh = 0; G.inv.dried = 0; } G.money -= fine; // v122: immer Geldstrafe, im Keller hoeher
    G.raid = null; G.heat = Math.max(0, (G.heat || 0) - 45); G.stat.raid = (G.stat.raid || 0) + 1; raidVis = { t: 0 };
    sfx.siren(); vibrate([200, 80, 200]); msg('🚨 Razzia im Keller! Beschlagnahmt: ' + bags + ' Beutel, ' + Math.round(raw) + ' Stück Ernte' + (plants ? ', ' + plants + ' Pflanzen' : '') + (fine ? ' · ' + fmt(fine) + ' Strafe' : '') + '. Ruf, Töpfe, Ausbauten, Konto und Mietlager bleiben dir.', true);
    if (panicOn()) setTimeout(() => { try { panicBack(true); } catch (e) {} }, 2500); save();
  }
  function raidTick(dt) { panicTick(dt); if (raidVis) { raidVis.t += dt; if (raidVis.t > 30) raidVis = null; } if (G && G.raid && absMin() >= G.raid.at) raidRun();
    const el = $('raidPill'); if (el) { const on = raidPending(); if (el.hidden === on) el.hidden = !on; if (on) { const m = G.raid.at - absMin(), d = new Date(0); const t = (G.time + m) % 1440; el.textContent = '🚨 Razzia um ' + String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0') + ' · tippen'; } } }
  function drawRaid() { if (!raidVis || player.fl) return; const t = raidVis.t, a = Math.min(1, t / 1.5) * Math.min(1, (30 - t) / 3);
    for (let k = 0; k < 3; k++) { const x = DOOR.x - 40 + k * 40, y = 532 + (k % 2) * 6; ctx.globalAlpha = a; drawFigure(x, y, -Math.PI / 2, gt * 3, COP_LOOK); ctx.fillStyle = Math.floor(gt * 5 + k) % 2 ? '#FF5C7A' : '#4B8DFF'; ctx.beginPath(); ctx.arc(x, y - 17, 2.6, 0, TAU); ctx.fill(); }
    ctx.globalAlpha = a; ctx.fillStyle = '#F2C14E'; for (let x = DOOR.x - 70; x < DOOR.x + 70; x += 14) { ctx.fillRect(x, 512, 8, 4); } ctx.fillStyle = '#10151C'; for (let x = DOOR.x - 63; x < DOOR.x + 70; x += 14) ctx.fillRect(x, 512, 6, 4); ctx.globalAlpha = 1; }


  function openLager() { if (!atLager()) return false; tab = 'lager'; openPhone(); sfx.ping(); return true; }
  function openAutohof() { if (!atAutohof()) return false; if (riding()) toggleRide(false); tab = 'autohof'; openPhone(); sfx.ping(); return true; }
  function buyLager() { if (G.lager.own || G.money < LAGER_COST || G.rep < LAGER_REP || !atLager()) return false; G.money -= LAGER_COST; G.lager.own = true; sfx.buy(); save(); msg('Der Mietraum gehört dir. Bring deine Ware her, hier ist sie sicher.'); return true; }
  function upLager() { const c = LAGER_UP[G.lager.lv]; if (!G.lager.own || c === undefined || G.money < c) return false; G.money -= c; G.lager.lv++; sfx.buy(); save(); msg('Neues Stockwerk: jetzt ' + lagerCap() + ' Plätze'); return true; }
  function lagerPut() {
    if (!G.lager.own || !lagerHere()) return 0; const a = G.lager.inv, inv = STASH_INV(); let room = lagerCap() - stashSum(a), n = 0;
    for (const j of [2, 1, 0]) for (let k = 0; k < 3; k++) { const f = STASH_F[j], v = Math.min(Math.floor(inv[k][f]), room); if (v > 0) { inv[k][f] -= v; a[k * 3 + j] += v; room -= v; n += v; } }
    if (n) { sfx.put(); save(); msg(n + ' Stück eingelagert' + (carryTotal() >= 1 ? ', das Lager ist voll' : '')); } else msg(carryTotal() >= 1 ? 'Das Lager ist voll' : 'Du hast nichts dabei', true);
    return n;
  }
  function lagerTake(k, lim) { // k: nur diese Sorte (0 Keller, 1 Tabak, 2 Labor), sonst alles; lim: hoechstens so viele (v89, Fertiges zuerst)
    if (!G.lager.own || !lagerHere()) return 0; const a = G.lager.inv, inv = STASH_INV(); let n = 0, left = lim === undefined ? 1e9 : Math.max(0, Math.floor(lim));
    for (let q = 0; q < 3; q++) { if (k !== undefined && q !== k) continue; for (const j of [2, 1, 0]) { let v = a[q * 3 + j]; if (!v || left <= 0) continue; if (j === 2) v = Math.min(v, Math.max(0, bagCap() - totalBags())); v = Math.min(v, left); left -= v; inv[q][STASH_F[j]] += v; a[q * 3 + j] -= v; n += v; } }
    if (n) { sfx.put(); save(); msg(n + ' Stück mitgenommen' + (stashSum(a) ? ' (Rucksack voll, der Rest bleibt hier)' : '')); } else msg('Nichts mitzunehmen (Rucksack voll?)', true);
    return n;
  }
  function renderLager(b) {
    const here = lagerHere() || (atLager() && !G.lager.own), L = G.lager, info = document.createElement('div'); info.className = 'empty'; info.style.cssText = 'padding:6px 4px;font-size:13px;text-align:left';
    info.textContent = !here ? (L.own ? 'Dein Mietraum liegt hinter dem Tor im Gewerbegebiet (ganz im Osten an der Hauptstraße). Drinnen am Regal: Lager und Ausstattung.' : 'Der Mietraum liegt im Gewerbegebiet ganz im Osten an der Hauptstraße. Geh zum Tor und drück dort A.') : !L.own ? 'Ein eigener Raum zum Mieten: Hinter dem Tor wirst du hineingebracht. Drinnen lagert deine Ware sicher (keine Polizei, keine Gangs, keine Mitspieler) und später ist Platz für einen Premium-Anbau für die Apotheke. Freunde kommen über das Besucher-Feld neben dem Tor zu Besuch.' : 'Dein Lager: ' + stashSum(L.inv) + ' von ' + lagerCap() + ' Plätzen belegt · ' + (L.lv + 1) + (L.lv ? ' Stockwerke' : ' Stockwerk');
    b.appendChild(info); if (!here) return;
    const card = (nm, pr, ds, label, dis, fn, alt) => { const c = document.createElement('div'); c.className = 'card'; c.innerHTML = '<div class="nm"></div><div class="pr"></div><div class="ds"></div>'; c.querySelector('.nm').textContent = nm; c.querySelector('.pr').textContent = pr; c.querySelector('.ds').textContent = ds; if (label) { const bt = document.createElement('button'); bt.className = 'buy' + (alt ? ' alt' : ''); bt.textContent = label; bt.disabled = !!dis; bt.addEventListener('click', () => { fn(); renderPhone(); }); c.appendChild(bt); } b.appendChild(c); return c; };
    if (!L.own) { card('Mietraum mieten', fmt(LAGER_COST), 'Lager-Regal für ' + 150 + ' Stück Ware, später mehr Regale. Platz für einen Premium-Anbau.', G.rep < LAGER_REP ? 'Ab Ruf ' + LAGER_REP : 'Mieten', G.rep < LAGER_REP || G.money < LAGER_COST, buyLager); return; }
    card('Alles einlagern', carryTotal() + ' dabei', 'Legt deine ganze Ware ins Lager, Beutel zuerst.', 'Einlagern', carryTotal() < 1, lagerPut);
    card('Alles mitnehmen', stashSum(L.inv) + ' im Lager', 'Nimmt alles mit, so viele Beutel wie in den Rucksack passen.', 'Mitnehmen', !stashSum(L.inv), () => lagerTake(), true);
    [AREAS.keller, AREAS.tabak, AREAS.brau].forEach((ar, k) => { const a = L.inv, n = a[k * 3] + a[k * 3 + 1] + a[k * 3 + 2]; if (!n) return; let qn = n; const c = card(ar.name, n + ' Stück', a[k * 3 + 2] + ' ' + ar.lbl.unit + ' · ' + a[k * 3 + 1] + ' ' + (ar.lbl.dried || 'Trockene') + ' · ' + a[k * 3] + ' ' + ar.lbl.fresh + (n > 1 ? ' · Menge wählen (Fertiges zuerst)' : ''), 'Holen', false, () => lagerTake(k, qn), true); if (c && n > 1) { const qr = qtyRow(n, n, v => { qn = v; }); qr.style.gridColumn = '1 / -1'; c.insertBefore(qr, c.querySelector('button')); } }); // v89: Menge waehlen
    const uc = LAGER_UP[L.lv]; if (uc !== undefined) card('Neues Regal', fmt(uc), '+150 Plätze im Lager-Regal.', 'Ausbauen', G.money < uc, upLager);
    renderPrShop(b);
  }
  // ---------- v89: Mietraum betreten/verlassen, Premium-Anbau, Besuch bei Freunden ----------
  const lagerHere = () => atLager() || (inRoom() && !prVisit && Math.hypot(player.x - PR_SHELF_AT.x, player.y - PR_SHELF_AT.y) < 64);
  const atPad = () => !!G && !player.fl && Math.hypot(player.x - PR_PAD.x, player.y - PR_PAD.y) < 26;
  const prFriends = () => Object.values(mp.friends).filter(f => f.gs && f.gs.pr);
  function roomEnter(fid) {
    if (!G) return false;
    if (fid) { const f = mp.friends[fid]; if (!f || !f.gs || !f.gs.pr) { msg('Dieser Mietraum ist gerade nicht erreichbar', true); return false; } }
    else if (!G.lager.own) return false;
    prVisit = fid || null; if (G.veh) G.veh.on = false;
    player.fl = 2; player.x = PR_EXIT.x - 64; player.y = PR_EXIT.y - 44; cam.x = player.x; cam.y = player.y; petSnap(); sfx.put(); closePhone();
    msg(fid ? 'Du besuchst den Mietraum von ' + mp.friends[fid].name : G.pr.own ? 'Dein Mietraum mit Premium-Anbau' : 'Dein Mietraum. Am Regal rechts: Lager und Ausstattung'); return true;
  }
  function roomLeave() { player.fl = 0; prVisit = null; player.x = LAGER_AT.x; player.y = LAGER_AT.y - 14; cam.x = player.x; cam.y = player.y; petSnap(); sfx.put(); msg('Zurück am Lager-Tor'); return true; }
  const prKellerOk = () => potsOpen(AREAS.keller) >= AREAS.keller.POTS.length && (G.up.seed || 0) >= 3 && (G.up.grow || 0) >= 5; // v97: Keller muss weit ausgebaut sein
  function prSetup() { if (!G.lager.own || G.pr.own || !canPay(PR_SETUP) || G.rep < PR_SETUP_REP || !prKellerOk()) return false; payCost(PR_SETUP); G.pr.own = true; sfx.buy(); save(); msg('Premium-Anbau eingerichtet! Setz die ersten Stecklinge.'); return true; }
  function prBuyUp(id) { const u = G.pr.up, l = u[id] || 0, c = prUpCost(id, l); if (!G.pr.own || l >= 5 || G.money < c) return false; G.money -= c; u[id] = l + 1; sfx.buy(); save(); return true; }
  function buyPrPotAt(i) { const P = G.pr; if (!P.own || i !== P.n || P.n >= PR_MAX) return false; const c = prPotCost(P.n); if (G.money < c) return false; G.money -= c; P.n++; sfx.buy(); save(); return true; }
  function prGrow(dt) {
    if (!G || !G.pr || !G.pr.own || !G.lager.own) return; const ar = AREAS.pr, st = G.pr, here = inRoom() && !prVisit;
    for (let i = 0; i < potsOpen(ar); i++) {
      const p = st.pots[i]; if (p.s !== 1) continue;
      p.w = Math.max(0, p.w - dt * krWater() / (20 * (1 + 0.3 * (st.up.water || 0))));
      if (p.w > 0.12) { p.p += dt / growTime(ar); if (p.p >= 1) { p.p = 1; p.s = 2; if (here) { sfx.ping(); floater(ar.POTS[i].x, ar.POTS[i].y - 22, 'Reif', '#FFB547'); } } }
    }
    if (st.rack.wet > 0) { const m = Math.min(st.rack.wet, dryRate(ar) * dt); st.rack.wet -= m; st.rack.dry += m; if (st.rack.wet < 0.001) { st.rack.dry += st.rack.wet; st.rack.wet = 0; } }
  }
  function roomTarget(px, py) {
    let best = null, bd = 1e9; const cons = (type, idx, d, lim, ar) => { if (d <= lim && d < bd) { bd = d; best = { type, idx, ar }; } };
    const ar = AREAS.pr;
    cons('exit', 0, Math.hypot(px - PR_EXIT.x, py - PR_EXIT.y), 44, ar);
    if (prVisit) return best;
    cons('shelf', 0, Math.hypot(px - PR_SHELF_AT.x, py - PR_SHELF_AT.y), 60, ar);
    if (isOpen(ar)) {
      for (let i = 0; i < potsOpen(ar); i++) cons('pot', i, Math.hypot(px - ar.POTS[i].x, py - ar.POTS[i].y), 40, ar);
      if (G.pr.n < PR_MAX) cons('potbuy', G.pr.n, Math.hypot(px - ar.POTS[G.pr.n].x, py - ar.POTS[G.pr.n].y), 30, ar);
      const fr = ar.fields.rack, ft = ar.fields.table;
      if (inField(fr, px, py)) cons('rack', 0, 0, 999, ar);
      if (inField(ft, px, py)) cons('table', 0, 0, 999, ar);
    }
    return best;
  }
  // ---------- v89: Apotheke von Dr. Weber ----------
  const atApo = () => !!G && !player.fl && Math.hypot(player.x - APO_AT.x, player.y - APO_AT.y) < 44;
  const apoOpen = () => !!G && !!G.kr && (KR().q.weber ? KR().q.weber.s : 0) >= 7; // nach der Qualitaetspruefung kauft Dr. Weber jederzeit
  const apoUnit = () => Math.round(basePrice('pr') * 1.1 * (1 + krPerk('vip') * 0.5));
  function apoSell(n) {
    if (!atApo() || !apoOpen()) return 0; n = Math.min(Math.floor(+n || 0), G.pr.inv.bags); if (n <= 0) return 0;
    const pay = apoUnit() * n; G.pr.inv.bags -= n; G.money += pay; G.earned += pay; G.stat.apo = (G.stat.apo || 0) + n;
    sfx.cash(); floater(APO_AT.x, APO_AT.y - 30, '+' + fmt(pay), '#5FE584'); msg('Dr. Weber kauft ' + n + ' Apotheken-Dosen für ' + fmt(pay)); save(); return pay;
  }
  // ---------- v89: Casino ----------
  const casDay = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const wheelReady = () => !!G && (G.cas || {}).wd !== casDay();
  const WHEEL = [
    { l: '250 €', c: '#4B8DFF', w: 16, f: () => casCash(250) }, { l: '1.000 €', c: '#E05A9A', w: 18, f: () => casCash(1000) },
    { l: 'Kosmetik', c: '#B983FF', w: 16, f: () => casCos() }, { l: '500 €', c: '#4FB37A', w: 22, f: () => casCash(500) },
    { l: 'Ruf +1', c: '#FFB547', w: 10, f: () => { krRepBonus(1); return 'Ruf +1'; } }, { l: '2.500 €', c: '#3FB8C9', w: 10, f: () => casCash(2500) },
    { l: '5.000 €', c: '#E8833A', w: 6, f: () => casCash(5000) }, { l: 'JACKPOT', c: '#FFD24A', w: 2, f: () => casCash(25000) }
  ];
  function casCash(v) { G.money += v; return '+' + fmt(v); }
  function casCos() { // etwas, das man noch nicht hat: Kleidung oder Aura/Begleiter
    const pool = WEAR.filter(w => !G.wear.owned[w.id] && w.cost > 1 && !w.ach && !w.qx && (w.rep || 0) < 999).map(w => ['w', w]).concat(COS.filter(c => !G.cos.owned[c.id] && c.cost > 1 && !c.ach).map(c => ['c', c]));
    if (!pool.length) return casCash(3000) + ' (du hast schon alles)';
    const [k, it] = pool[Math.floor(Math.random() * pool.length)]; if (k === 'w') G.wear.owned[it.id] = true; else G.cos.owned[it.id] = true; return it.name + ' freigeschaltet';
  }
  let casSpin = null; // laufende Animation des Rads
  function wheelSpin(onDone) {
    if (!wheelReady() || casSpin) return false; G.cas.wd = casDay(); G.cas.sp = (G.cas.sp || 0) + 1;
    let tot = 0; for (const s of WHEEL) tot += s.w; let r = Math.random() * tot, idx = 0; for (let i = 0; i < WHEEL.length; i++) { r -= WHEEL[i].w; if (r <= 0) { idx = i; break; } }
    const seg = TAU / WHEEL.length, target = TAU * 5 + (TAU - (idx + 0.5) * seg) + (Math.random() - 0.5) * seg * 0.6;
    casSpin = { t: 0, dur: 4.2, a0: 0, a1: target, idx, done: false };
    const res = WHEEL[idx].f(); save(); casSpin.res = WHEEL[idx].l + ': ' + res; sfx.ping();
    const t0 = performance.now(); const tick = () => { if (!casSpin) return; casSpin.t = (performance.now() - t0) / 1000; if (casSpin.t >= casSpin.dur) { casSpin.done = true; const r2 = casSpin.res; if (onDone) onDone(r2); sfx.cash(); msg('Glücksrad: ' + r2); casSpin = null; return; } if (onDone) onDone(null); requestAnimationFrame(tick); };
    requestAnimationFrame(tick); return true;
  }
  const SLOT_SYM = [['🍒', 30, 5], ['🍋', 25, 8], ['🔔', 18, 12], ['⭐', 12, 20], ['💎', 9, 40], ['7️⃣', 6, 100]];
  const slotPick = () => { let r = Math.random() * 100; for (let i = 0; i < SLOT_SYM.length; i++) { r -= SLOT_SYM[i][1]; if (r <= 0) return i; } return 0; };
  function slotResult(a) { // [Gewinnfaktor, Text]
    if (a[0] === a[1] && a[1] === a[2]) return [SLOT_SYM[a[0]][2], 'Drei gleiche! ×' + SLOT_SYM[a[0]][2]];
    if (a[0] === a[1] || a[1] === a[2] || a[0] === a[2]) return [1, 'Zwei gleiche: Einsatz zurück'];
    return [0, 'Leider nichts'];
  }
  // Blackjack: 6 Kartenspiele, Dealer zieht bis 17
  const BJ_R = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'B', 'D', 'K'], BJ_S = ['♠', '♥', '♦', '♣'];
  const bjCard = () => ({ r: Math.floor(Math.random() * 13), s: Math.floor(Math.random() * 4) });
  function bjVal(h) { let v = 0, a = 0; for (const c of h) { const r = c.r + 1; if (r === 1) { a++; v += 11; } else v += Math.min(10, r); } while (v > 21 && a) { v -= 10; a--; } return v; }
  let bj = null; // { t, bet, p: [], d: [], ph: 'bet'|'play'|'done', res, dbl }
  function bjDeal(t, bet) {
    const T0 = CAS_BJ[t]; bet = Math.floor(bet); if (!T0 || bet < T0.min || bet > T0.min * 50 || G.money < bet) return false;
    G.money -= bet; bj = { t, bet, p: [bjCard(), bjCard()], d: [bjCard(), bjCard()], ph: 'play', res: '' }; sfx.put();
    if (bjVal(bj.p) === 21 || bjVal(bj.d) === 21) bjEnd(); return true;
  }
  function bjHit() { if (!bj || bj.ph !== 'play') return false; bj.p.push(bjCard()); sfx.put(); if (bjVal(bj.p) > 21) bjEnd(); else if (bjVal(bj.p) === 21) bjStand(); return true; }
  function bjDouble() { if (!bj || bj.ph !== 'play' || bj.p.length !== 2 || G.money < bj.bet) return false; G.money -= bj.bet; bj.bet *= 2; bj.dbl = true; bj.p.push(bjCard()); sfx.put(); if (bjVal(bj.p) > 21) bjEnd(); else bjStand(); return true; }
  function bjStand() { if (!bj || bj.ph !== 'play') return false; while (bjVal(bj.d) < 17) bj.d.push(bjCard()); bjEnd(); return true; }
  function bjEnd() {
    const pv = bjVal(bj.p), dv = bjVal(bj.d), pbj = pv === 21 && bj.p.length === 2, dbj = dv === 21 && bj.d.length === 2; let pay = 0, r;
    if (pv > 21) r = 'Überkauft (' + pv + '). Der Dealer gewinnt.';
    else if (pbj && !dbj) { pay = Math.round(bj.bet * 2.5); r = 'Blackjack! 3 zu 2'; }
    else if (dbj && !pbj) r = 'Der Dealer hat Blackjack.';
    else if (dv > 21) { pay = bj.bet * 2; r = 'Der Dealer ist überkauft (' + dv + '). Gewonnen!'; }
    else if (pv > dv) { pay = bj.bet * 2; r = pv + ' gegen ' + dv + ': Gewonnen!'; }
    else if (pv === dv) { pay = bj.bet; r = 'Unentschieden (' + pv + '). Einsatz zurück.'; }
    else r = pv + ' gegen ' + dv + ': Der Dealer gewinnt.';
    G.money += pay; bj.ph = 'done'; bj.res = r; bj.pay = pay; if (pay > bj.bet) sfx.cash(); else if (!pay) sfx.bad(); save();
  }
  // ---------- v89: Handy-Seiten fuer Casino, Apotheke, Mietraum-Besuch ----------
  const uiEl = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
  const uiInfo = (b, html) => { const e = uiEl('div', 'empty'); e.style.cssText = 'padding:6px 4px;font-size:13px;text-align:left'; e.innerHTML = html; b.appendChild(e); return e; };
  let casIdx = 0, slotBet = 50, slotBusy = false, slotLast = null, bjBet = 0;
  function renderSlot(b) {
    if (!inCasino()) { uiInfo(b, 'Die Slotmaschinen stehen im Casino im Gewerbegebiet.'); return; }
    uiInfo(b, 'Drei gleiche Symbole gewinnen, zwei gleiche geben den Einsatz zurück. Spiel nur mit Geld, das du übrig hast.');
    const m = uiEl('div', 'slotm'), reels = uiEl('div', 'reels'); const rs = [0, 1, 2].map(i => { const r = uiEl('div', 'reel', SLOT_SYM[slotLast ? slotLast[i] : i][0]); reels.appendChild(r); return r; });
    m.appendChild(uiEl('div', 'slottop', '★ LUCKY ' + (casIdx + 1) + ' ★')); m.appendChild(reels); const out = uiEl('div', 'slotout', slotLast ? slotResult(slotLast)[1] : 'Viel Glück!'); m.appendChild(out); b.appendChild(m);
    const pay = uiEl('div', 'ds'); pay.style.cssText = 'margin:6px 2px;font-size:12px;color:var(--muted)'; pay.textContent = 'Gewinne: ' + SLOT_SYM.map(s => s[0] + s[0] + s[0] + ' ×' + s[2]).join(' · '); b.appendChild(pay);
    const bets = uiEl('div', 'betrow'); [10, 50, 100, 500, 1000].forEach(v => { const bt = uiEl('button', 'bet' + (slotBet === v ? ' on' : ''), fmt(v)); bt.disabled = G.money < v; bt.addEventListener('click', () => { slotBet = v; casRender(); }); bets.appendChild(bt); }); b.appendChild(bets);
    const go = uiEl('button', 'bigbtn', slotBusy ? 'Dreht …' : 'Drehen (' + fmt(slotBet) + ')'); go.disabled = slotBusy || G.money < slotBet;
    go.addEventListener('click', () => {
      if (slotBusy || G.money < slotBet || !inCasino()) return; G.money -= slotBet; slotBusy = true; go.disabled = true; go.textContent = 'Dreht …'; casMoney(); sfx.put();
      const res = [slotPick(), slotPick(), slotPick()], bet = slotBet; let k = 0;
      const iv = setInterval(() => { k++; rs.forEach((r, i) => { if (k < 8 + i * 5) r.textContent = SLOT_SYM[Math.floor(Math.random() * SLOT_SYM.length)][0]; else r.textContent = SLOT_SYM[res[i]][0]; }); if (k >= 19) { clearInterval(iv); slotBusy = false; slotLast = res; const [f, tx] = slotResult(res), win = bet * f; G.money += win; if (f > 1) sfx.cash(); else if (!f) sfx.bad(); out.textContent = tx + (win > bet ? ' +' + fmt(win) : ''); save(); if (casKind === 'slot') casRender(); } }, 70);
    }); b.appendChild(go);
  }
  function renderWheel(b) {
    if (!inCasino()) { uiInfo(b, 'Das Glücksrad steht im Casino im Gewerbegebiet.'); return; }
    const ready = wheelReady();
    uiInfo(b, 'Einmal am Tag (echte Zeit) gratis drehen: Geld, Ruf oder eine Kosmetik, die du noch nicht hast. ' + (ready ? '<b style="color:var(--amber)">Heute noch frei!</b>' : 'Heute schon gedreht, morgen wieder.'));
    const cv = uiEl('canvas', 'wheelcv'); cv.width = 520; cv.height = 520; b.appendChild(cv);
    const res = uiEl('div', 'slotout', ''); b.appendChild(res);
    const paint = a => { const x = cv.getContext && cv.getContext('2d'); if (!x) return; x.clearRect(0, 0, 520, 520); const cx = 260, cy = 260, R0 = 230, seg = TAU / WHEEL.length;
      x.fillStyle = '#2B1A10'; x.beginPath(); x.arc(cx, cy, R0 + 18, 0, TAU); x.fill();
      for (let i = 0; i < 24; i++) { const an = i * TAU / 24; x.fillStyle = (Math.floor(performance.now() / 200) + i) % 2 ? '#FFE27A' : '#8A6A2A'; x.beginPath(); x.arc(cx + Math.cos(an) * (R0 + 9), cy + Math.sin(an) * (R0 + 9), 5, 0, TAU); x.fill(); }
      WHEEL.forEach((s, i) => { const a0 = a + i * seg - Math.PI / 2; x.fillStyle = s.c; x.beginPath(); x.moveTo(cx, cy); x.arc(cx, cy, R0, a0, a0 + seg); x.closePath(); x.fill(); x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = 3; x.stroke();
        x.save(); x.translate(cx, cy); x.rotate(a0 + seg / 2); x.fillStyle = '#10151C'; x.font = '900 26px sans-serif'; x.textAlign = 'right'; x.textBaseline = 'middle'; x.fillText(s.l, R0 - 16, 0); x.restore(); });
      x.fillStyle = '#FFD24A'; x.beginPath(); x.arc(cx, cy, 30, 0, TAU); x.fill(); x.fillStyle = '#8A6A2A'; x.beginPath(); x.arc(cx, cy, 14, 0, TAU); x.fill();
      x.fillStyle = '#FF5C7A'; x.beginPath(); x.moveTo(cx - 18, 8); x.lineTo(cx + 18, 8); x.lineTo(cx, 50); x.closePath(); x.fill(); x.strokeStyle = '#FFFFFF'; x.lineWidth = 3; x.stroke(); };
    paint(0);
    const go = uiEl('button', 'bigbtn', ready ? 'Rad drehen!' : 'Morgen wieder'); go.disabled = !ready;
    go.addEventListener('click', () => { go.disabled = true; wheelSpin(r => { if (r === null) { const s = casSpin; if (s) { const e = 1 - Math.pow(1 - Math.min(1, s.t / s.dur), 3); paint(s.a0 + (s.a1 - s.a0) * e); } return; } res.textContent = r; go.textContent = 'Morgen wieder'; casMoney(); }); });
    b.appendChild(go);
  }
  // v89: Casino-Spiele laufen im Gebaeude in einem eigenen Fenster (nicht im Handy)
  let casKind = '', casEl = null;
  function casShow(kind, idx) {
    if (!inCasino()) return false; casIdx = idx | 0; casKind = kind;
    if (!casEl) { casEl = document.createElement('div'); casEl.className = 'cas'; casEl.hidden = true; casEl.innerHTML = '<div class="cas-card"><div class="cas-head"><div class="cas-t"></div><div class="cas-m"></div><button class="cas-x">Aufstehen</button></div><div class="cas-b"></div></div>'; if (document.body && document.body.appendChild) document.body.appendChild(casEl); const x = casEl.querySelector('.cas-x'); if (x) x.addEventListener('click', casHide); }
    casEl.hidden = false; joy.id = null; joy.dx = joy.dy = 0; aHeld = false; bHeld = false; casRender(); return true;
  }
  function casHide() { if (bjV) { clearTimeout(bjV.tm); bjV.q = []; bjV.busy = false; if (bj) { bjV.p = bj.p.length; bjV.d = bj.d.length; bjV.rev = bjV.res = bj.ph === 'done'; } } casKind = ''; if (casEl) casEl.hidden = true; save(); }
  function casMoney() { const m = casEl && casEl.querySelector('.cas-m'); if (m) m.textContent = fmt(G.money - (casKind === 'bj' && bj && bj.ph === 'done' && bjV && !bjV.res ? (bj.pay || 0) : 0)); }
  function casRender() {
    if (!casEl || !casKind) return; const b = casEl.querySelector('.cas-b'), t = casEl.querySelector('.cas-t'); if (!b) return; b.innerHTML = '';
    if (t) t.textContent = casKind === 'slot' ? '🎰 Slotmaschine ' + (casIdx + 1) : casKind === 'wheel' ? '🎡 Glücksrad' : '🃏 Blackjack · Tisch ' + (casIdx + 1);
    casMoney(); if (casKind === 'slot') renderSlot(b); else if (casKind === 'wheel') renderWheel(b); else renderBJ(b);
  }
  // v94: Blackjack mit Animation: Karten fliegen vom Schlitten, drehen sich um, Chips wandern, Ergebnis mit Effekt
  let bjV = null; // Anzeige: { p, d, rev, res, q: [Schritte], fresh: Set, busy }
  const BJ_STEP = 380;
  function bjViewReset() { bjV = { p: 0, d: 0, rev: false, res: false, q: [], fresh: new Set(), busy: false, tm: 0 }; }
  function bjQueue(steps) { if (!bjV) bjViewReset(); bjV.q.push(...steps); if (!bjV.busy) bjRun(); }
  function bjRun() {
    if (!bjV || !bjV.q.length) { if (bjV) bjV.busy = false; casRender(); return; }
    bjV.busy = true; const s = bjV.q.shift(); bjV.fresh = new Set();
    if (s === 'p') { bjV.fresh.add('p' + bjV.p); bjV.p++; sfx.put(); }
    else if (s === 'd') { bjV.fresh.add('d' + bjV.d); bjV.d++; sfx.put(); }
    else if (s === 'rev') { bjV.rev = true; bjV.fresh.add('d1'); sfx.put(); }
    else if (s === 'res') { bjV.res = true; if (bj && bj.pay > 0) { try { sfx.cash(); } catch (e) {} } }
    casRender(); clearTimeout(bjV.tm); bjV.tm = setTimeout(bjRun, s === 'res' ? 60 : s === 'rev' ? BJ_STEP + 120 : BJ_STEP);
  }
  // nach jeder Aktion: was muss noch gezeigt werden?
  function bjPlan() {
    if (!bj) return; if (!bjV) bjViewReset(); const st = [];
    let p = bjV.p + bjV.q.filter(x => x === 'p').length, d = bjV.d + bjV.q.filter(x => x === 'd').length, rev = bjV.rev || bjV.q.includes('rev');
    if (p === 0 && d === 0) { st.push('p', 'd', 'p', 'd'); p = 2; d = 2; }
    while (p < bj.p.length) { st.push('p'); p++; }
    if (bj.ph === 'done') { if (!rev && bj.d.length > 1) st.push('rev'); while (d < bj.d.length) { st.push('d'); d++; } if (!bjV.res && !bjV.q.includes('res')) st.push('res'); }
    if (st.length) bjQueue(st);
  }
  const bjBusy = () => !!(bjV && (bjV.busy || bjV.q.length));
  function bjCardEl(c, hide, fresh, flip, k) {
    const e = uiEl('div', 'pcard pc' + (c.s === 1 || c.s === 2 ? ' red' : '') + (fresh ? ' deal' : ''));
    if (k !== undefined) e.style.setProperty('--k', k);
    const inn = uiEl('div', 'pc-in' + (hide || flip ? ' hid' : '')), fr = uiEl('div', 'pc-f'), bk = uiEl('div', 'pc-b');
    fr.innerHTML = '<span class="pc-r">' + BJ_R[c.r] + '</span><span class="pc-s">' + BJ_S[c.s] + '</span><span class="pc-c">' + BJ_S[c.s] + '</span>';
    inn.appendChild(fr); inn.appendChild(bk); e.appendChild(inn);
    if (flip && !hide) requestAnimationFrame(() => requestAnimationFrame(() => inn.classList.remove('hid')));
    return e;
  }
  function renderBJ(b) {
    const T0 = CAS_BJ[casIdx]; if (!inCasino() || !T0) { uiInfo(b, 'Die Blackjack-Tische stehen im Casino im Gewerbegebiet.'); return; }
    if (bj && bj.t !== casIdx) bj = null;
    uiInfo(b, 'Tisch ' + (casIdx + 1) + ' · Einsatz ' + fmt(T0.min) + ' bis ' + fmt(T0.min * 50) + '. Komm näher an 21 als der Dealer, ohne drüber zu gehen. Blackjack zahlt 3 zu 2, der Dealer zieht bis 17.');
    const felt = uiEl('div', 'felt');
    if (!bj) bjViewReset(); else if (!bjV) { bjViewReset(); bjV.p = bj.p.length; bjV.d = bj.d.length; bjV.rev = bj.ph === 'done'; bjV.res = bj.ph === 'done'; }
    const V = bjV, shoe = uiEl('div', 'bjshoe'); shoe.innerHTML = '<i></i><i></i><i></i>'; felt.appendChild(shoe);
    const dv = bj ? bj.d.slice(0, V.d) : [], pv = bj ? bj.p.slice(0, V.p) : [];
    const dl = uiEl('div', 'bjrow'); dl.appendChild(uiEl('div', 'bjlab', 'Dealer' + (dv.length ? ' · ' + (V.rev ? bjVal(dv) : bjVal([dv[0]])) : '')));
    const dc = uiEl('div', 'cards'); dv.forEach((c, i) => { const hide = i === 1 && !V.rev; dc.appendChild(bjCardEl(c, hide, V.fresh.has('d' + i), V.fresh.has('d' + i) || (i === 1 && V.fresh.has('d1')), i)); }); dl.appendChild(dc); felt.appendChild(dl);
    // Einsatz als Chip-Stapel in der Mitte
    if (bj) { const chips = uiEl('div', 'bjchips' + (V.res ? (bj.pay > bj.bet ? ' win' : bj.pay === bj.bet ? ' push' : ' lose') : '')); const n = Math.max(1, Math.min(8, Math.round(bj.bet / CAS_BJ[casIdx].min)));
      for (let k = 0; k < n; k++) { const ch = uiEl('i', 'bjc c' + (k % 4)); ch.style.setProperty('--k', k); chips.appendChild(ch); } chips.appendChild(uiEl('span', 'bjbet', fmt(bj.bet))); felt.appendChild(chips); }
    const pl = uiEl('div', 'bjrow'); pl.appendChild(uiEl('div', 'bjlab', 'Du' + (pv.length ? ' · ' + bjVal(pv) : '')));
    const pc = uiEl('div', 'cards'); pv.forEach((c, i) => pc.appendChild(bjCardEl(c, false, V.fresh.has('p' + i), V.fresh.has('p' + i), i))); pl.appendChild(pc); felt.appendChild(pl);
    if (bj && V.res) { const win = bj.pay > bj.bet, push = bj.pay === bj.bet, bjk = /Blackjack!/.test(bj.res);
      const out = uiEl('div', 'bjres ' + (bjk ? 'bjk' : win ? 'win' : push ? 'push' : 'lose'), bj.res + (bj.pay ? ' (+' + fmt(bj.pay) + ')' : '')); felt.appendChild(out);
      if (win && V.fresh.size === 0 && !V.conf) { V.conf = true; const cf = uiEl('div', 'bjconf'); for (let k = 0; k < 22; k++) { const s = uiEl('i'); s.style.cssText = '--x:' + (Math.random() * 100).toFixed(1) + '%;--d:' + (Math.random() * 0.5).toFixed(2) + 's;--r:' + Math.floor(Math.random() * 360) + 'deg;--c:' + ['#FFD24A', '#5FE584', '#FF5CA8', '#4BC8FF', '#FFFFFF'][k % 5]; cf.appendChild(s); } felt.appendChild(cf); } }
    b.appendChild(felt);
    if (bjBusy()) { const w = uiEl('div', 'betrow'); w.appendChild(uiEl('div', 'bjwait', 'Der Dealer gibt …')); b.appendChild(w); return; }
    if (bj && bj.ph === 'play') {
      const row = uiEl('div', 'betrow');
      const h1 = uiEl('button', 'bet on', 'Karte'); h1.addEventListener('click', () => { if (bjHit()) bjPlan(); casRender(); });
      const s1 = uiEl('button', 'bet', 'Halten'); s1.addEventListener('click', () => { if (bjStand()) bjPlan(); casRender(); });
      const d1 = uiEl('button', 'bet', 'Verdoppeln'); d1.disabled = bj.p.length !== 2 || G.money < bj.bet; d1.addEventListener('click', () => { if (bjDouble()) bjPlan(); casRender(); });
      row.appendChild(h1); row.appendChild(s1); row.appendChild(d1); b.appendChild(row); return;
    }
    if (!bjBet || bjBet < T0.min || bjBet > T0.min * 50) bjBet = T0.min;
    const mx = Math.max(T0.min, Math.min(T0.min * 50, Math.floor(G.money / T0.min) * T0.min)), steps = Math.max(1, Math.round(mx / T0.min));
    const lab = uiEl('div', 'ds'); lab.style.cssText = 'margin:8px 2px 0;font-weight:800;color:var(--amber)'; lab.textContent = 'Einsatz: ' + fmt(bjBet); b.appendChild(lab);
    if (steps > 1) { const qr = qtyRow(steps, Math.min(steps, Math.round(bjBet / T0.min)), v => { bjBet = v * T0.min; lab.textContent = 'Einsatz: ' + fmt(bjBet); }); b.appendChild(qr); }
    const go = uiEl('button', 'bigbtn', bj ? 'Neue Runde' : 'Karten geben'); go.disabled = G.money < T0.min;
    go.addEventListener('click', () => { if (bjDeal(casIdx, Math.min(bjBet, G.money))) { bjViewReset(); bjPlan(); casRender(); } else msg('Zu wenig Geld für diesen Tisch', true); }); b.appendChild(go);
  }
  // v94: Seiten der neuen Gebaeude
  const leftTxt = u => { const m = Math.max(0, Math.round(u - absMin())); return m >= 60 ? Math.floor(m / 60) + ' Std ' + (m % 60) + ' Min' : m + ' Min'; };
  // v100: Makler, Tresor, Razzia
  function renderMakler(b) {
    const here = atMakler();
    uiInfo(b, 'Herr Krämer verkauft dir Läden in der Stadt. Ein eigener Laden bringt einen Vorteil und vor allem ein Hinterzimmer mit Tresor: Dort zahlst du Bargeld ein, das mit der Zeit gewaschen auf dein Konto geht. Auf dem Konto ist es bei Razzien und Festnahmen sicher.' + (here ? '' : '<br>Kaufen geht nur im Büro (Marktviertel, Hauptstraße).'));
    for (const [k, d] of Object.entries(BIZ)) { const own = bizOwn(k), c = uiEl('div', 'card');
      c.innerHTML = '<div class="nm">' + d.ic + ' ' + d.name + (own ? ' <span style="color:var(--green)">gehört dir</span>' : '') + '</div><div class="pr">' + (own ? '✓' : fmt(d.cost)) + '</div><div class="ds">Wäscht ' + fmt(d.rate) + ' pro Spielstunde (Gebühr ' + Math.round(d.fee * 100) + ' %), Tresor bis ' + fmt(d.cap) + ' · Vorteil: ' + d.perk + (own ? '' : ' · ab Ruf ' + d.rep) + '</div>';
      if (!own) { const bt = uiEl('button', 'buy', G.rep < d.rep ? 'Ab Ruf ' + d.rep : 'Kaufen'); bt.disabled = !here || G.rep < d.rep || !canPay(d.cost); bt.addEventListener('click', () => { if (bizBuy(k)) renderPhone(); }); c.appendChild(bt); }
      b.appendChild(c); }
  }
  function renderBiz(b) {
    const k = bizIn, d = BIZ[k], st = k && G.biz[k]; if (!d || !st || player.fl !== 3) { uiInfo(b, 'Der Tresor steht im Hinterzimmer deiner Läden.'); return; }
    const hrs = st.dirty > 0 ? st.dirty / d.rate : 0;
    uiInfo(b, d.ic + ' <b>' + d.name + '</b><br>Im Tresor: <b style="color:var(--amber)">' + fmt(st.dirty) + '</b> von ' + fmt(d.cap) + (hrs ? '<br>Fertig gewaschen in etwa ' + (hrs >= 1 ? Math.ceil(hrs) + ' Spielstunden' : Math.ceil(hrs * 60) + ' Spielminuten') : '') + '<br>Es wäscht ' + fmt(d.rate) + ' pro Spielstunde, ' + Math.round(d.fee * 100) + ' % bleiben als Gebühr hängen. Der Rest geht aufs Konto (jetzt ' + fmt(G.bank || 0) + ').<br>Bisher gewaschen: ' + fmt(st.done));
    const c = uiEl('div', 'card'); c.appendChild(uiEl('div', 'nm', '💵 Bargeld einzahlen')); const mx = Math.max(0, Math.min(G.money, d.cap - st.dirty)), row = uiEl('div', 'betrow'); row.style.gridColumn = '1 / -1';
    for (const f of [0.1, 0.25, 0.5, 1]) { const v = Math.floor(mx * f); const bt = uiEl('button', 'bet', f === 1 ? 'Alles' : Math.round(f * 100) + ' %'); bt.disabled = v <= 0; bt.title = fmt(v); bt.addEventListener('click', () => { if (bizDeposit(k, v)) renderPhone(); }); row.appendChild(bt); }
    c.appendChild(row); c.appendChild(uiEl('div', 'ds', 'Möglich: ' + fmt(mx))); b.appendChild(c);
  }
  function renderRaid(b) {
    if (!raidPending()) { uiInfo(b, 'Gerade ist keine Razzia angekündigt. Ab Ruf ' + RAID_REP + ' kann die Polizei deinen Keller durchsuchen, wenn du zu viel Aufsehen erregst (Gefahr: ' + Math.round(G.heat || 0) + ' %).'); return; }
    const m = G.raid.at - absMin(), t = (G.time + m) % 1440, hh = String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0');
    uiInfo(b, '🚨 <b>Razzia heute um ' + hh + ' Uhr in deinem Keller</b> (noch etwa ' + Math.ceil(m / 60) + ' Spielstunden).<br>Die Polizei nimmt alles aus Gestellen, Packtischen mit (gerade ' + raidSeizable() + ' Stück). Bist du dann im Keller, ist auch deine Ware weg. Auch die Pflanzen in den Töpfen nimmt sie mit, und es gibt immer eine Geldstrafe (10 %, bist du im Keller 20 % deines Bargelds). Ruf, Töpfe, Ausbauten, Mietlager, Regale in deinen Läden, Tonnen-Verstecke und dein Konto sind sicher.<br><br>Tipp: Drück den roten Notknopf im Keller, dann füllt sich der Keller nicht wieder.<br>Weitere Tipps: Ware abholen und ins Mietlager, ins Regal deiner Läden oder in Tonnen bringen, Bargeld waschen oder zur Bank bringen.');
    const c = uiEl('div', 'card'); c.innerHTML = '<div class="nm">🤝 Jemanden bestechen</div><div class="pr">' + fmt(raidBribe()) + '</div><div class="ds">Die Razzia fällt aus und die Gefahr sinkt.</div>';
    const bt = uiEl('button', 'buy', 'Bezahlen'); bt.disabled = G.money < raidBribe(); bt.addEventListener('click', () => { if (raidPay()) renderPhone(); }); c.appendChild(bt); b.appendChild(c);
  }
  function renderGym(b) {
    if (bizOwn('gym')) { const c0 = uiEl('div', 'card'); c0.innerHTML = '<div class="nm">🔑 Dein Laden</div><div class="ds">Im Hinterzimmer steht dein Tresor zum Geldwaschen.</div>'; const bt0 = uiEl('button', 'buy', 'Ins Hinterzimmer'); bt0.addEventListener('click', () => bizEnter('gym')); c0.appendChild(bt0); b.appendChild(c0); }
    const here = atGym(), c0 = gymCostNow(), cur = G.buf.gym && absMin() < G.buf.gym.u ? G.buf.gym : null;
    const c0g = gymCostNow(); uiInfo(b, 'Tarik\'s Iron Gym. Ein Training wirkt einen ganzen Spieltag, es gilt immer nur eins.' + (cur ? '<br><b style="color:var(--green)">Aktiv: ' + GYM_TR[cur.k].ic + ' ' + GYM_TR[cur.k].n + ' · noch ' + leftTxt(cur.u) + ' (Spielzeit)</b>' : '') + (here ? '' : '<br>Trainieren kannst du im kleinen Iron Gym Express im Stadtpark (Hauptstraße) oder im großen Iron Gym in Südost an der Parkstraße.'));
    for (const [k, d] of Object.entries(GYM_TR)) { const c = uiEl('div', 'card'); c.innerHTML = '<div class="nm">' + d.ic + ' ' + d.n + '</div><div class="pr">' + fmt(c0) + '</div><div class="ds">' + d.ds + ' für einen Spieltag</div>';
      const bt = uiEl('button', 'buy', cur && cur.k === k ? 'Verlängern' : 'Trainieren'); bt.disabled = !here || G.money < c0; bt.addEventListener('click', () => { if (gymTrain(k)) { gymAnim = { t: 0 }; renderPhone(); } }); c.appendChild(bt); b.appendChild(c); }
    if (G.stat.gym) uiInfo(b, 'Trainings bisher: ' + G.stat.gym);
  }
  function renderPizza(b) {
    if (bizOwn('pizza')) { const c0 = uiEl('div', 'card'); c0.innerHTML = '<div class="nm">🔑 Dein Laden</div><div class="ds">Im Hinterzimmer steht dein Tresor zum Geldwaschen.</div>'; const bt0 = uiEl('button', 'buy', 'Ins Hinterzimmer'); bt0.addEventListener('click', () => bizEnter('pizza')); c0.appendChild(bt0); b.appendChild(c0); }
    const here = atPizza(), c0 = pizzaCost(), n = staffN();
    uiInfo(b, 'Giulias Pizzeria. Eine Pizza fürs ganze Team macht deine Helfer einen halben Spieltag 25 % schneller.' + (pizzaOn() ? '<br><b style="color:var(--green)">🍕 Pizza-Power aktiv · noch ' + leftTxt(G.buf.pizza) + '</b>' : '') + (here ? '' : '<br>Die Pizzeria steht am Stadtpark an der Hauptstraße.'));
    const c = uiEl('div', 'card'); c.innerHTML = '<div class="nm">🍕 Pizza fürs Team</div><div class="pr">' + fmt(c0) + '</div><div class="ds">' + (n ? n + ' Helfer im Team · 40 € pro Kopf' : 'Noch keine Helfer, die Pizza schmeckt trotzdem') + '</div>';
    const bt = uiEl('button', 'buy', pizzaOn() ? 'Nachbestellen' : 'Bestellen'); bt.disabled = !here || G.money < c0; bt.addEventListener('click', () => { if (pizzaOrder()) renderPhone(); }); c.appendChild(bt); b.appendChild(c);
    if (G.stat.pizza) uiInfo(b, 'Team-Pizzen bisher: ' + G.stat.pizza);
  }
  function renderBank(b) {
    const here = bankHere();
    if (G.rep < BANK_REP) { uiInfo(b, 'Die Stadtsparkasse eröffnet Sparkonten erst ab Ruf ' + BANK_REP + '. Du hast Ruf ' + G.rep + '.'); return; }
    const z = Math.min(Math.round(G.bank * bankRate()), Math.max(0, bankCap() - G.bank));
    uiInfo(b, 'Dein ' + BANK_LV[bankLv()].n + ': <b style="color:var(--amber)">' + fmt(G.bank) + '</b><br>Zinsen: ' + (bankRate() * 100).toFixed(1).replace('.', ',') + ' % pro Spieltag (heute Nacht etwa +' + fmt(z) + ')<br>Höchstbetrag: ' + fmt(bankCap()) + ' (steigt mit deinem Ruf)' + (here ? '' : '<br>Einzahlen und abheben geht nur am Schalter (Nordallee) oder überall mit Online-Banking.'));
    uiInfo(b, '<b>Darum lohnt sich das Konto:</b><br>• Geld auf dem Konto ist sicher: Razzia, Polizei und Diebe nehmen nur Bargeld.<br>• Große Käufe ab ' + fmt(BIG_PAY) + ' (Läden, Autos, Premium-Anbau, Stadtprojekte) zahlst du per Überweisung. Bar kostet es 10 % mehr und macht die Polizei aufmerksam.<br>• Jede Nacht gibt es Zinsen.');
    for (const [lab, sgn] of [['Einzahlen', 1], ['Abheben', -1]]) {
      const c = uiEl('div', 'card'); c.appendChild(uiEl('div', 'nm', (sgn > 0 ? '⬇ ' : '⬆ ') + lab));
      const mx = sgn > 0 ? Math.max(0, Math.min(G.money, bankCap() - G.bank)) : G.bank, row = uiEl('div', 'betrow'); row.style.gridColumn = '1 / -1';
      for (const f of [0.1, 0.25, 0.5, 1]) { const v = Math.floor(mx * f); const bt = uiEl('button', 'bet', f === 1 ? 'Alles' : Math.round(f * 100) + ' %'); bt.disabled = !here || v <= 0; bt.title = fmt(v); bt.addEventListener('click', () => { if (bankMove(sgn * v)) renderPhone(); }); row.appendChild(bt); }
      c.appendChild(row); c.appendChild(uiEl('div', 'ds', 'Möglich: ' + fmt(mx))); b.appendChild(c); }
    { const n = bankLv() + 1, L = BANK_LV[n]; if (L) { const c = uiEl('div', 'card'); c.appendChild(uiEl('div', 'nm', '⭐ ' + L.n)); c.appendChild(uiEl('div', 'pr', fmt(L.c))); c.appendChild(uiEl('div', 'ds', L.ds + (G.rep < L.rep ? ' <b style="color:var(--amber)">Ab Ruf ' + L.rep + '.</b>' : ' Wird zuerst vom Konto bezahlt.')));
      const bt = uiEl('button', 'buy', G.rep < L.rep ? 'Ab Ruf ' + L.rep : 'Freischalten'); bt.disabled = G.rep < L.rep || (G.bank || 0) + G.money < L.c; bt.addEventListener('click', () => { if (bankUp()) renderPhone(); }); c.appendChild(bt); b.appendChild(c); } }
    if (G.stat.bankZ) uiInfo(b, 'Zinsen bisher: ' + fmt(G.stat.bankZ));
  }
  function renderClub(b) {
    if (bizOwn('club')) { const c0 = uiEl('div', 'card'); c0.innerHTML = '<div class="nm">🔑 Dein Laden</div><div class="ds">Im Hinterzimmer steht dein Tresor zum Geldwaschen.</div>'; const bt0 = uiEl('button', 'buy', 'Ins Hinterzimmer'); bt0.addEventListener('click', () => bizEnter('club')); c0.appendChild(bt0); b.appendChild(c0); }
    const here = atClub();
    if (G.rep < CLUB_REP) { uiInfo(b, 'Der Neon Club lässt Lieferanten erst ab Ruf ' + CLUB_REP + ' auf die Gästeliste.'); return; }
    if (!clubOpen()) { uiInfo(b, 'Der Neon Club öffnet um 21 Uhr und schließt um 5 Uhr. Komm nachts wieder.'); return; }
    const left = clubLeft();
    uiInfo(b, 'Vicky kauft für die Gästeliste immer 3 Stück auf einmal und zahlt 60 % mehr als normal. Heute Nacht noch ' + left + ' von ' + clubMax() + ' Lieferungen.' + (here ? '' : '<br>Der Neon Club steht auf der Vergnügungsmeile neben dem Casino.'));
    for (const k of clubProds()) { const ar = AREAS[k], have = S(ar).inv.bags, pay = Math.round(basePrice(k) * 3 * 1.6 * krTip());
      const c = uiEl('div', 'card'); c.innerHTML = '<div class="nm">3 ' + ar.lbl.unit + '</div><div class="pr">' + fmt(pay) + '</div><div class="ds">Du hast ' + have + ' dabei</div>';
      const bt = uiEl('button', 'buy', 'Liefern'); bt.disabled = !here || have < 3 || left <= 0; bt.addEventListener('click', () => { if (clubSell(k)) renderPhone(); }); c.appendChild(bt); b.appendChild(c); }
    if (G.stat.club) uiInfo(b, 'Club-Lieferungen bisher: ' + G.stat.club);
  }
  let gymAnim = null;
  function renderApo(b) {
    const q = (G.kr && KR().q.weber) ? KR().q.weber.s : 0;
    if (!apoOpen()) { uiInfo(b, 'Die Apotheke von Dr. Weber. Sie kauft nur Ware in Apothekenqualität aus einem Premium-Anbau. ' + (q < 5 ? 'Sprich zuerst mit Dr. Weber (Questkette).' : 'Folge ihrer Questkette: Premium-Anbau im Mietraum einrichten und die erste Qualitätsprüfung bestehen.')); return; }
    const have = G.pr.inv.bags, u = apoUnit();
    uiInfo(b, 'Dr. Weber kauft Apotheken-Dosen aus deinem Premium-Anbau, jederzeit zum festen Preis. Normale Beutel nimmt sie hier nicht.' + (atApo() ? '' : '<br>Geh zur Apotheke (hinter der Hauptstraße im Norden), um zu verkaufen.'));
    const c = uiEl('div', 'card'); c.innerHTML = '<div class="nm">Apotheken-Dosen</div><div class="pr">' + fmt(u) + ' / Dose</div><div class="ds">Du hast ' + have + ' Dosen dabei (zählen im Rucksack mit: ' + totalBags() + '/' + bagCap() + ')</div>';
    let qn = have; const btn = uiEl('button', 'buy', have ? have + ' verkaufen' : 'Keine Dosen dabei'); btn.disabled = !have || !atApo();
    if (have > 1) { const qr = qtyRow(have, have, v => { qn = v; btn.textContent = v + ' verkaufen'; }); qr.style.gridColumn = '1 / -1'; c.appendChild(qr); }
    btn.addEventListener('click', () => { apoSell(qn); renderPhone(); }); c.appendChild(btn); b.appendChild(c);
    if (G.stat.apo) uiInfo(b, 'Bisher an die Apotheke geliefert: ' + G.stat.apo + ' Dosen');
  }
  function renderPrVisit(b) {
    uiInfo(b, 'Besucher-Feld am Mietraum: Hier kommst du in die Mieträume deiner Freunde (nur ansehen). Raus geht es über die Tür unten rechts.');
    if (!mp.on) { uiInfo(b, 'Geh zuerst online (App Freunde).'); return; }
    const fl = prFriends(); if (!fl.length) { uiInfo(b, 'Gerade hat niemand, der online ist, einen Mietraum mit Premium-Anbau.'); return; }
    for (const f of fl) { const c = uiEl('div', 'card'); c.appendChild(uiEl('div', 'nm', f.name)); c.appendChild(uiEl('div', 'ds', f.gs.pr.n + ' Plätze im Premium-Anbau')); const bt = uiEl('button', 'buy', 'Besuchen'); bt.disabled = !atPad(); bt.addEventListener('click', () => roomEnter(f.id)); c.appendChild(bt); b.appendChild(c); }
  }
  function renderPrShop(b) { // im Mietraum am Regal: Premium-Anbau einrichten und ausbauen
    const hd = uiEl('div', 'grp', 'Premium-Anbau'); b.appendChild(hd);
    const card = (nm, pr, ds, label, dis, fn) => { const c = uiEl('div', 'card'); c.appendChild(uiEl('div', 'nm', nm)); c.appendChild(uiEl('div', 'pr', pr)); c.appendChild(uiEl('div', 'ds', ds)); if (label) { const bt = uiEl('button', 'buy', label); bt.disabled = !!dis; bt.addEventListener('click', () => { fn(); renderPhone(); }); c.appendChild(bt); } b.appendChild(c); return c; };
    if (!G.pr.own) { card('Premium-Anbau einrichten', fmt(PR_SETUP), 'Reinraum-Standard: Hydro-Stationen mit Profi-Licht, Klima-Trockenschrank und Abfülltisch für Apotheken-Dosen. Die Ware bleibt getrennt von deinen Beuteln und geht an die Apotheke von Dr. Weber.<br><b>Voraussetzungen (Endgame):</b> Ruf ' + PR_SETUP_REP + (G.rep >= PR_SETUP_REP ? ' ✓' : '') + ' · alle ' + AREAS.keller.POTS.length + ' Kellertöpfe' + (potsOpen(AREAS.keller) >= AREAS.keller.POTS.length ? ' ✓' : ' (' + potsOpen(AREAS.keller) + ')') + ' · Saatgut Stufe 3' + ((G.up.seed || 0) >= 3 ? ' ✓' : '') + ' · Wachstumslampe Stufe 5' + ((G.up.grow || 0) >= 5 ? ' ✓' : ''), G.rep < PR_SETUP_REP ? 'Ab Ruf ' + PR_SETUP_REP : !prKellerOk() ? 'Keller weiter ausbauen' : 'Einrichten', G.rep < PR_SETUP_REP || !prKellerOk() || G.money < PR_SETUP || !lagerHere(), prSetup); return; }
    for (const u of PR_UPS) { const l = G.pr.up[u.id] || 0, c = prUpCost(u.id, l); card(u.name + ' · Stufe ' + l + '/5', l >= 5 ? 'max' : fmt(c), u.desc, l >= 5 ? 'Fertig' : 'Kaufen', l >= 5 || G.money < c, () => prBuyUp(u.id)); }
    const e = uiEl('div', 'ds', 'Weitere Stationen kaufst du direkt im Raum am schwarzen Platz (A).'); e.style.margin = '2px 0 6px'; b.appendChild(e);
  }
