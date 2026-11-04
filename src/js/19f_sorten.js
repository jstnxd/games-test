  // =====================================================================================================
  // v186: Pflanzen-Sorten im Keller (und auf den Etagen). Rein fiktive Namen. Die Sorte wählt man im Pflanzen-Fenster
  // an der Samentüte (Knopf „Sorte“), neue Sorten werden mit Ruf frei. Sie unterscheiden sich in Wuchsdauer, Ertrag,
  // Startqualität und Aussehen (Blattfarbe, Knospenfarbe, Größe). Der Topf merkt sich seine Sorte (p.v).
  // =====================================================================================================
  const SORTS = [
    { i: 0, id: 'gruen', nm: 'Kellergrün', rep: 0, g: 1, y: 1, q: 0, ds: 'Die Standardsorte, ausgewogen', st: '#4E8A36', l1: '#3F8C3A', l2: '#4A9A42', b: ['#78B04A', '#8CC25A', '#6BA43F'], p: '#E5832E', pk: '#63C174', sz: 1 },
    { i: 1, id: 'zitrus', nm: 'Zitronenzauber', rep: 8, g: 0.8, y: 0.9, q: 0, ds: 'Wächst 20 % schneller, 10 % weniger Ertrag', st: '#6E9A3A', l1: '#7DB83E', l2: '#8CC63F', b: ['#C9D85A', '#D9E25A', '#B8CC4A'], p: '#F2C94C', pk: '#C9D85A', sz: 0.92 },
    { i: 2, id: 'riese', nm: 'Waldriese', rep: 20, g: 1.15, y: 1.3, q: 0, ds: 'Wächst 15 % langsamer, 30 % mehr Ertrag', st: '#3E6E2E', l1: '#2F6E34', l2: '#367A3A', b: ['#4E8A3A', '#5A9A3A', '#467E32'], p: '#D9905A', pk: '#2F7A3A', sz: 1.18 },
    { i: 3, id: 'lila', nm: 'Lila Nebel', rep: 35, g: 1.25, y: 1, q: 0.25, ds: 'Wächst 25 % langsamer, startet mit +25 % Qualität', st: '#4A6A3A', l1: '#3E5E3A', l2: '#4A6E42', b: ['#8E6BC8', '#A27ED8', '#7A5AB4'], p: '#E8A8F0', pk: '#8E6BC8', sz: 1 }
  ];
  const sortsFor = ar => !!ar && (ar.key === 'keller' || (ar.isFloor && ar.key !== 'pr'));
  const sortOpen = s => (G.rep || 0) >= s.rep || (G.prest || 0) > 0;
  function sortCur() { try { const u = UI().tp; const s = SORTS.find(x => u['sv_' + x.id]); if (s && sortOpen(s)) return s; } catch (e) {} return SORTS[0]; }
  function sortSet(s) { const u = UI().tp; for (const x of SORTS) delete u['sv_' + x.id]; u['sv_' + s.id] = 1; }
  const sortOf = (ar, p) => (sortsFor(ar) && p ? SORTS[p.v | 0] || SORTS[0] : SORTS[0]);
  const sortG = (ar, p) => sortOf(ar, p).g;
  const sortY = (ar, p) => Math.max(1, Math.round(harvestYield(ar) * sortOf(ar, p).y));
  // Samentüte in der Farbe der Sorte
  function seedTex(s) { return MTX(cvTex(64, 96, (x, w, h) => { x.fillStyle = s.pk; x.fillRect(0, 0, w, h); x.fillStyle = '#FFFFFF'; x.fillRect(6, 30, w - 12, 46); x.fillStyle = '#1D2129'; x.textAlign = 'center'; x.font = '900 9px sans-serif'; const w1 = s.nm.split(' '); x.fillText(w1[0].slice(0, 11), w / 2, 44); if (w1[1]) x.fillText(w1[1].slice(0, 11), w / 2, 55); x.font = '900 16px sans-serif'; x.fillText('🌱', w / 2, 72); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(0, 0, w, 8); })); }
  // Knopf im Pflanzen-Fenster: wechselt durch die freien Sorten, solange noch nicht gegraben wurde
  function sortBtn(T) {
    if (!sortsFor(WK.ar)) return; const b = workBtn('', () => { if (WK.pl !== 'dig' || WK.digN) return; const open = SORTS.filter(sortOpen); const cur = sortCur(), nx = open[(open.indexOf(cur) + 1) % open.length]; sortSet(nx); paint(); try { spring(WK.seedPk, 'sq', 0.2, 20, 6); sfx.put(); } catch (e) {} }, 'wall');
    const paint = () => { const s = sortCur(), next = SORTS.find(x => !sortOpen(x)); WK.sc = s; b.textContent = '🌱 ' + s.nm + (SORTS.filter(sortOpen).length > 1 ? ' ▸' : ''); if (WK.pl === 'dig' && !WK.digN) WK.hintEl.textContent = s.nm + ': ' + s.ds + '. Tippe auf die Erde, um ein Loch zu graben' + (next ? ' (neue Sorte ab Ruf ' + next.rep + ')' : '');
      if (WK.seedBag) { const old = WK.seedBag.material; WK.seedBag.material = seedTex(s); try { if (old.map) old.map.dispose(); old.dispose(); } catch (e) {} } };
    paint(); WK.sortB = b;
  }
