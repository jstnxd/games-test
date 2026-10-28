  // ---------- Zustand ----------
  // Kosten wachsen bis zur alten Maximalstufe wie bisher, danach gemaechlicher (x1,3 je Stufe)
  const COSTX = 1.9; // Preisfaktor fuer alle Erweiterungen (laengere Spielzeit)
  const ext = (b, f, knee, l) => Math.round(COSTX * b * Math.pow(f, Math.min(l, knee)) * Math.pow(1.3, Math.max(0, l - knee)));
  const UPS = [
    { id: 'pots', name: 'Mehr Töpfe', desc: 'Schaltet einen weiteren Topf frei (bis zu 12)', max: 10, cost: l => ext(120, 1.7, 5, l) },
    { id: 'grow', name: 'Wachstumslampe', desc: 'Pflanzen wachsen 12 % schneller (später 5 %)', max: 13, cost: l => ext(180, 1.65, 4, l) },
    { id: 'yield', name: 'Dünger', desc: '+1 Einheit pro Ernte (später +1 alle 2 Stufen)', max: 14, cost: l => ext(150, 1.6, 5, l) },
    { id: 'rack', name: 'Größeres Trockengestell', desc: 'Mehr Platz im Gestell, trocknet etwas schneller', max: 12, cost: l => ext(200, 1.8, 3, l) },
    { id: 'dry', name: 'Trockengebläse', desc: 'Die Ware trocknet 12 % schneller', max: 8, cost: l => ext(170, 1.7, 3, l) },
    { id: 'shoes', name: 'Turnschuhe', desc: 'Du läufst schneller (8 % je Stufe, später 3 %, nie mehr als +50 %)', max: 12, cost: l => ext(140, 1.9, 3, l) },
    { id: 'bag', name: 'Rucksack', desc: '+4 Platz (später +2, ab Stufe 13 +1) · Lager am Packtisch wächst mit', max: 100, cost: l => l < 12 ? ext(160, 1.8, 3, l) : Math.round(ext(160, 1.8, 3, 12) * Math.pow(1.035, l - 12)) },
    { id: 'sack', name: 'Tragetasche', desc: '+3 Platz im Rucksack (gilt für Keller und Scheune)', max: 8, cost: l => ext(380, 1.75, 3, l) },
    { id: 'cart', name: 'Handkarren', desc: '+4 Platz im Rucksack (gilt für Keller und Scheune)', max: 5, cost: l => ext(900, 1.9, 2, l) },
    { id: 'seed', name: 'Bessere Samen', desc: 'Beutel bringen 8 % mehr (später 4 %), Samen kosten etwas mehr', max: 14, cost: l => ext(220, 1.7, 5, l) }
  ];
  const COS = [
    { id: 'fireflies', kind: 'orbit', name: 'Glühwürmchen', desc: 'Leuchtende Punkte schwirren um dich herum', cost: 250 },
    { id: 'leaves', kind: 'orbit', name: 'Blätterkranz', desc: 'Ein Kranz aus Blättern kreist um dich', cost: 400 },
    { id: 'ring', kind: 'orbit', name: 'Neonring', desc: 'Ein pulsierender Ring in wechselnden Farben', cost: 650 },
    { id: 'stars', kind: 'orbit', name: 'Sternenschwarm', desc: 'Funkelnde Sterne umkreisen dich', cost: 900 },
    { id: 'foot', kind: 'trail', name: 'Leuchtende Fußspuren', desc: 'Jeder Schritt glimmt auf und verblasst', cost: 300 },
    { id: 'sparks', kind: 'trail', name: 'Funkenspur', desc: 'Funken sprühen hinter dir her', cost: 500 },
    { id: 'smoke', kind: 'trail', name: 'Rauchspur', desc: 'Weiche Wolken bleiben hinter dir zurück', cost: 600 },
    { id: 'rainbow', kind: 'trail', name: 'Regenbogenband', desc: 'Ein buntes Band wellt sich hinter dir', cost: 1100 }
  ];
  UPS.push({ id: 'water', name: 'Wasserspeicher-Töpfe', desc: 'Pflanzen brauchen seltener Wasser', max: 12, cost: l => ext(180, 1.7, 3, l) });
  UPS.push({ id: 'compass', name: 'Lieferkompass', desc: 'Ein Pfeil an deiner Figur zeigt zum Kunden, der genau so viele Stück will, wie du dabeihast. Bleibt ein Rest, zeigt er zum passenden Kunden dafür.', max: 1, cost: () => 400 });
  UPS.forEach(u => { u.area = (u.id === 'shoes' || u.id === 'bag' || u.id === 'sack' || u.id === 'cart' || u.id === 'compass') ? 'all' : 'keller'; });
  const TUP = {
    pots: ['Mehr Tabakbeete', 'Schaltet ein weiteres Beet frei'],
    grow: ['Gewächshauslicht', 'Pflanzen wachsen 12 % schneller'],
    yield: ['Kalkdünger', '+1 Blatt pro Ernte'],
    rack: ['Größeres Hängegestell', 'Mehr Platz im Gestell, trocknet etwas schneller'],
    dry: ['Trockenofen', 'Die Blätter trocknen 12 % schneller'],
    water: ['Tropfbewässerung', 'Pflanzen brauchen seltener Wasser'],
    seed: ['Edle Sorten', 'Päckchen bringen 8 % mehr, Samen kosten etwas mehr']
  };
  UPS.filter(u => u.area === 'keller' && TUP[u.id]).forEach(u => {
    UPS.push({ id: u.id, name: TUP[u.id][0], desc: TUP[u.id][1], max: u.max, area: 'tabak', cost: l => Math.round(u.cost(l) * 1.1) });
  });
  const BUP = {
    pots: ['Mehr Reaktoren', 'Schaltet einen weiteren Reaktor frei'],
    grow: ['Heizplatten', 'Ansätze sind 12 % schneller fertig'],
    yield: ['Glitzerformel', '+1 Lösung pro Abfüllung'],
    rack: ['Größerer Kristallisierer', 'Mehr Platz für Schalen, kristallisiert etwas schneller'],
    dry: ['Kühlaggregat', 'Kristalle bilden sich 12 % schneller'],
    water: ['Kühlschlangen', 'Reaktoren müssen seltener gekühlt werden'],
    seed: ['Premium-Ansatz', 'Kristallboxen bringen 8 % mehr, Ansätze kosten etwas mehr']
  };
  UPS.filter(u => u.area === 'keller' && BUP[u.id]).forEach(u => {
    UPS.push({ id: u.id, name: BUP[u.id][0], desc: BUP[u.id][1], max: u.max, area: 'brau', cost: l => Math.round(u.cost(l) * 1.3) });
  });
  const upRef = u => (u.area === 'tabak' ? G.t.up : u.area === 'brau' ? G.b.up : G.up);
  COS.push(
    { id: 'bubbles', kind: 'orbit', name: 'Seifenblasen', desc: 'Glänzende Blasen steigen um dich auf', cost: 450 },
    { id: 'snow', kind: 'orbit', name: 'Schneeflocken', desc: 'Flocken wirbeln langsam um deine Figur', cost: 350 },
    { id: 'pixel', kind: 'trail', name: 'Pixelspur', desc: 'Bunte Pixel bleiben kurz am Boden', cost: 350 },
    { id: 'confetti', kind: 'trail', name: 'Konfetti', desc: 'Bunte Schnipsel wirbeln hinter dir auf', cost: 750 },
    { id: 'hearts', kind: 'orbit', name: 'Herzchen', desc: 'Kleine Herzen schweben um dich herum', cost: 800 },
    { id: 'planets', kind: 'orbit', name: 'Planetenbahn', desc: 'Drei Planeten kreisen um dich', cost: 1500 },
    { id: 'flames', kind: 'orbit', name: 'Flammenkranz', desc: 'Ein Ring aus flackernden Flammen', cost: 2400 },
    { id: 'petals', kind: 'trail', name: 'Blütenblätter', desc: 'Rosa Blütenblätter taumeln hinter dir her', cost: 700 },
    { id: 'bolt', kind: 'trail', name: 'Blitzspur', desc: 'Zuckende Blitze bleiben hinter dir zurück', cost: 1700 },
    { id: 'gold', kind: 'trail', name: 'Goldregen', desc: 'Goldene Münzen glitzern hinter dir', cost: 3200 },
    { id: 'butterflies', kind: 'orbit', name: 'Schmetterlinge', desc: 'Bunte Schmetterlinge flattern um dich herum', cost: 650 },
    { id: 'notes', kind: 'orbit', name: 'Notenwirbel', desc: 'Musiknoten tanzen um deine Figur', cost: 1100 },
    { id: 'orbs', kind: 'orbit', name: 'Magieorbs', desc: 'Drei leuchtende Kugeln mit Schweif kreisen um dich', cost: 2800 },
    { id: 'halo', kind: 'orbit', name: 'Heiligenschein', desc: 'Ein goldener Ring schwebt über dir, kleine Funken glitzern', cost: 5000 },
    { id: 'bubtrail', kind: 'trail', name: 'Blasenspur', desc: 'Schimmernde Blasen steigen hinter dir auf', cost: 450 },
    { id: 'clover', kind: 'trail', name: 'Glücksklee', desc: 'Vierblättrige Kleeblätter bleiben hinter dir liegen', cost: 1300 },
    { id: 'fire', kind: 'trail', name: 'Feuerspur', desc: 'Flammen lodern hinter dir und verglühen', cost: 3000 },
    { id: 'dust', kind: 'trail', name: 'Sternenstaub', desc: 'Funkelnder Sternenstaub rieselt hinter dir', cost: 4500 }
  );
  // Vorteile der Begleiter
  const PERKS = {
    bird: { sus: 0.7, speed: 1.06, text: 'Warnt dich: Die Polizei braucht 30 % länger, bis sie dich erwischt. Du läufst 6 % schneller' },
    dog: { bag: 4, text: '+4 Plätze im Rucksack' },
    cat: { sight: 0.75, text: 'Schleicht mit dir: Streifen sehen dich nur aus 25 % kürzerer Entfernung' },
    bunny: { speed: 1.12, text: 'Du läufst 12 % schneller' },
    panda: { bag: 3, sus: 0.8, fine: 0.5, text: '+3 Plätze im Rucksack, 20 % langsamer erwischt, halbe Strafe' },
    teddy: { bag: 2, tip: 1.1, text: '+10 % mehr Geld bei jeder Lieferung, +2 Plätze im Rucksack' },
    monkey: { speed: 1.08, bag: 2, text: 'Flink und geschickt: Du läufst 8 % schneller und trägst 2 Beutel mehr' },
    dolphin: { tip: 1.12, sight: 0.9, text: 'Bringt gute Laune: +12 % mehr Geld bei Lieferungen, Streifen sehen dich aus 10 % kürzerer Entfernung' },
    elephant: { bag: 5, text: 'Trägt mit: +5 Plätze im Rucksack' },
    dragon: { sus: 0.85, tip: 1.08, text: 'Feuriger Beschützer: Polizei braucht 15 % länger, +8 % mehr Geld bei Lieferungen' },
    leopard: { sus: 0.75, sight: 0.8, text: 'Lautloser Jäger: Polizei braucht 25 % länger, Streifen sehen dich aus 20 % kürzerer Entfernung' },
    turtle: { fine: 0.6, sus: 0.9, text: 'Die Ruhe selbst: 40 % weniger Strafe, die Polizei braucht 10 % länger' }, // v130: neue Begleiter
    fox: { sight: 0.85, tip: 1.05, text: 'Schlau: Streifen sehen dich aus 15 % kürzerer Entfernung, +5 % mehr Geld bei Lieferungen' },
    penguin: { bag: 3, speed: 1.04, text: 'Packt mit an: +3 Plätze im Rucksack, du läufst 4 % schneller' },
    owl: { sight: 0.8, sus: 0.9, text: 'Hat alles im Blick: Streifen sehen dich aus 20 % kürzerer Entfernung, die Polizei braucht 10 % länger' },
    axolotl: { tip: 1.1, bag: 2, text: 'Glücksbringer: +10 % mehr Geld bei Lieferungen, +2 Plätze im Rucksack' },
    ghost: { sight: 0.7, text: 'Spukt herum: Streifen sehen dich aus 30 % kürzerer Entfernung' },
    unicorn: { tip: 1.12, speed: 1.08, text: 'Magisch: +12 % mehr Geld bei Lieferungen, du läufst 8 % schneller' }
  };
  const DECOR = [
    { id: 'cactus', name: 'Kaktus', desc: 'Klein, stachelig und pflegeleicht', cost: 40 },
    { id: 'plant', name: 'Zimmerpflanze', desc: 'Frisches Grün für die Ecke', cost: 70 },
    { id: 'palm', name: 'Zimmerpalme', desc: 'Große Wedel machen den Raum wohnlich', cost: 130 },
    { id: 'rug', name: 'Teppich', desc: 'Weich und gemütlich unter den Füßen', cost: 90 },
    { id: 'lamp', name: 'Stehlampe', desc: 'Warmes Licht für den Abend', cost: 100 },
    { id: 'shelf', name: 'Bücherregal', desc: 'Bücher und kleine Erinnerungsstücke', cost: 150 },
    { id: 'couch', name: 'Sofa', desc: 'Zum Durchatmen zwischen den Aufgaben', cost: 260 },
    { id: 'tv', name: 'Fernseher', desc: 'Flimmert leise vor sich hin', cost: 240 },
    { id: 'tank', name: 'Aquarium', desc: 'Fische ziehen ihre Kreise', cost: 320 },
    { id: 'turntable', name: 'Tisch mit Drehtablett', desc: 'Auf dem Tablett drehen sich Tassen und Schalen', cost: 210 },
    { id: 'leafrug', name: 'Blatt-Teppich', desc: 'Grüner Teppich mit großem Blattmuster', cost: 140 },
    { id: 'roundrug', name: 'Runder Teppich', desc: 'Bunte Ringe für die Raummitte', cost: 80 },
    { id: 'flowers', name: 'Blumentopf', desc: 'Bunte Blumen im Terrakottatopf', cost: 55 },
    { id: 'beanbag', name: 'Sitzsack', desc: 'Weich wie eine Wolke', cost: 120 },
    { id: 'discoball', name: 'Discokugel', desc: 'Spiegelkugel, die sich dreht, blitzt und bunte Lichtpunkte über den Boden wandern lässt. Nachts mit Lichtstrahlen', cost: 280 },
    { id: 'candles', name: 'Kerzen', desc: 'Drei flackernde Kerzen auf einem Teller', cost: 45 },
    { id: 'bonsai', name: 'Bonsai', desc: 'Ein kleiner, ruhiger Baum', cost: 90 },
    { id: 'globe', name: 'Globus', desc: 'Dreht sich langsam auf dem Ständer', cost: 110 },
    { id: 'fan', name: 'Standventilator', desc: 'Die Flügel drehen sich leise', cost: 85 },
    { id: 'lavalamp', name: 'Lavalampe', desc: 'Bunte Blasen steigen auf', cost: 130 },
    { id: 'starrug', name: 'Sternen-Teppich', desc: 'Dunkelblau mit goldenen Sternen', cost: 130 },
    { id: 'easel', name: 'Staffelei', desc: 'Mit einem Bild von Hügeln und Sonne', cost: 160 },
    { id: 'speaker', name: 'Lautsprecher', desc: 'Die Membranen pumpen im Takt', cost: 180 },
    { id: 'fridge', name: 'Mini-Kühlschrank', desc: 'Mit Magneten an der Tür', cost: 200 },
    { id: 'neon', name: 'Neonschild', desc: 'Leuchtet und flackert ab und zu', cost: 220 },
    { id: 'trophy', name: 'Pokalvitrine', desc: 'Ein goldener Pokal unter Glas', cost: 300 },
    { id: 'fireplace', name: 'Kamin', desc: 'Knisterndes Feuer in der Ecke', cost: 420 },
    { id: 'piano', name: 'Klavier', desc: 'Schwarzer Flügel mit Hocker', cost: 520 },
    { id: 'arcade', name: 'Spielautomat', desc: 'Der Bildschirm blinkt in vielen Farben', cost: 640 },
    // v49: sechzehn weitere Stücke
    { id: 'gnome', name: 'Gartenzwerg', desc: 'Grinst frech unter seiner roten Mütze', cost: 60 },
    { id: 'dartboard', name: 'Dartscheibe', desc: 'Drei Pfeile stecken schon drin', cost: 140 },
    { id: 'tree', name: 'Tannenbaum', desc: 'Mit blinkenden Lichtern und goldenem Stern', cost: 170 },
    { id: 'mirror', name: 'Standspiegel', desc: 'Golden gerahmt, mit wanderndem Glanz', cost: 160 },
    { id: 'guitar', name: 'Gitarre', desc: 'Auf dem Ständer und immer griffbereit', cost: 190 },
    { id: 'punchbag', name: 'Boxsack', desc: 'Schaukelt leicht an seiner Kette', cost: 210 },
    { id: 'coffee', name: 'Kaffeebar', desc: 'Espressomaschine mit aufsteigendem Dampf', cost: 260 },
    { id: 'hammock', name: 'Hängematte', desc: 'Schaukelt sanft zwischen zwei Pfosten', cost: 280 },
    { id: 'terrarium', name: 'Terrarium', desc: 'Eine kleine Echse sonnt sich unter der Wärmelampe', cost: 300 },
    { id: 'popcorn', name: 'Popcornmaschine', desc: 'Die Körner springen in der Vitrine', cost: 340 },
    { id: 'telescope', name: 'Teleskop', desc: 'Für die Sterne über dem Keller', cost: 380 },
    { id: 'chandelier', name: 'Kronleuchter', desc: 'Funkelnde Kristalle und warmes Licht', cost: 450 },
    { id: 'drumset', name: 'Schlagzeug', desc: 'Die Sticks tanzen im Takt', cost: 520 },
    { id: 'kicker', name: 'Kicker', desc: 'Die Stangen schieben, der Ball rollt', cost: 560 },
    { id: 'jukebox', name: 'Jukebox', desc: 'Bunte Lichter und eine drehende Schallplatte', cost: 600 },
    { id: 'pooltable', name: 'Billardtisch', desc: 'Grüner Filz, bunte Kugeln und ein Queue', cost: 760 },
    // v54: Anbau-Deko
    { id: 'watercan', name: 'Gießkanne', desc: 'Grün, mit langem Ausguss', cost: 30 },
    { id: 'hygro', name: 'Thermometer', desc: 'Zeigt abwechselnd Temperatur und Luftfeuchte', cost: 40 },
    { id: 'leafposter', name: 'Blatt-Poster', desc: 'Ein großes grünes Blatt auf dunklem Grund', cost: 50 },
    { id: 'clipfan', name: 'Klemmventilator', desc: 'Kleiner Lüfter, der unermüdlich dreht', cost: 55 },
    { id: 'seedrack', name: 'Samenregal', desc: 'Bunte Samentütchen in drei Reihen', cost: 80 },
    { id: 'hemprug', name: 'Blatt-Fußmatte', desc: 'Dunkelgrün mit goldenem Rand und großem Blatt', cost: 90 },
    { id: 'drynet', name: 'Trockennetz', desc: 'Vier hängende Netze, die leicht schaukeln', cost: 100 },
    { id: 'jars', name: 'Gläserregal', desc: 'Vier Einmachgläser voller grüner Ernte', cost: 110 },
    { id: 'mother', name: 'Mutterpflanze', desc: 'Eine große, buschige Pflanze im Kübel', cost: 130 },
    { id: 'carbonfilter', name: 'Aktivkohlefilter', desc: 'Schwarzer Zylinder mit Abluftrohr', cost: 140 },
    { id: 'ledpanel', name: 'LED-Pflanzenlicht', desc: 'Leuchtet violett und pink auf einem Ständer', cost: 160 },
    { id: 'growtent', name: 'Growzelt', desc: 'Silbernes Zelt mit violettem Licht und einer Pflanze darin', cost: 240 },
    // v59: Brauerei-Deko, seit v88 Labor-Deko (gleiche IDs)
    { id: 'hopsack', name: 'Laborfass', desc: 'Blaues Fass mit LAB-Etikett (nur Deko)', cost: 50 },
    { id: 'maltsacks', name: 'Kanister', desc: 'Drei weiße Kanister mit bunten Deckeln', cost: 70 },
    { id: 'crates', name: 'Glaswaren-Kisten', desc: 'Zwei Kisten voller bunter Reagenzgläser', cost: 80 },
    { id: 'bartable', name: 'Mikroskop-Tisch', desc: 'Runder Stahltisch mit Mikroskop', cost: 90 },
    { id: 'mugshelf', name: 'Kolbenregal', desc: 'Acht Kolben und Gläser in allen Farben', cost: 110 },
    { id: 'casks', name: 'Gasflaschen', desc: 'Drei bunte Flaschen in einer Halterung', cost: 130 },
    { id: 'prostsign', name: 'LABOR-Schild', desc: 'Türkise Leuchtschrift, die ab und zu flackert', cost: 150 },
    { id: 'tap', name: 'Laborspüle', desc: 'Stahlbecken mit tropfendem Wasserhahn', cost: 170 },
    { id: 'kettle', name: 'Glaskolben-Aufbau', desc: 'Bunte Flüssigkeit blubbert durch eine Glasspirale', cost: 230 },
    { id: 'fermenter', name: 'Großreaktor', desc: 'Edelstahltank mit leuchtendem Sichtfenster', cost: 260 },
    // v75: Betten und mehr Deko
    { id: 'futon', name: 'Futon', desc: 'Matratze am Boden mit Kissen und lila Decke', cost: 140 },
    { id: 'bed', name: 'Einzelbett', desc: 'Holzbett mit blauer Steppdecke', cost: 220 },
    { id: 'bunkbed', name: 'Etagenbett', desc: 'Zwei Betten übereinander, mit Leiter', cost: 320 },
    { id: 'dbed', name: 'Doppelbett', desc: 'Großes Bett mit zwei Kissen und Nachttischlampen', cost: 480, rep: 8 },
    { id: 'catbed', name: 'Katzenkörbchen', desc: 'Eine Katze schläft darin und schnurrt', cost: 120 },
    { id: 'bookstack', name: 'Bücherstapel', desc: 'Vier bunte Bücher übereinander', cost: 35 },
    { id: 'fishbowl', name: 'Goldfischglas', desc: 'Ein Goldfisch zieht seine Runden', cost: 60 },
    { id: 'fairy', name: 'Lichterkette', desc: 'Bunte Lämpchen, die abwechselnd blinken', cost: 70 },
    { id: 'bbq', name: 'Grill', desc: 'Glühende Kohle, Würstchen und etwas Rauch', cost: 160 },
    { id: 'plantwall', name: 'Pflanzenwand', desc: 'Ein senkrechter Garten mit Blüten', cost: 190 },
    { id: 'graffcanvas', name: 'Graffiti-Leinwand', desc: 'Ein Tag in Neonfarben auf Leinwand', cost: 200 },
    { id: 'clock', name: 'Standuhr', desc: 'Das Pendel schwingt, die Zeiger laufen', cost: 240 },
    { id: 'robot', name: 'Saugroboter', desc: 'Fährt brav seine Kreise', cost: 260 },
    { id: 'miniramp', name: 'Mini-Rampe', desc: 'Kleine Halfpipe, ein Board rollt hin und her', cost: 300, rep: 6 },
    { id: 'vending', name: 'Getränkeautomat', desc: 'Leuchtet und ist gut gefüllt', cost: 350 },
    { id: 'safe', name: 'Tresor', desc: 'Schwer, mit drehendem Zahlenschloss', cost: 380 },
    { id: 'pingpong', name: 'Tischtennisplatte', desc: 'Der Ball fliegt hin und her', cost: 420 },
    { id: 'gamingpc', name: 'Gaming-Tisch', desc: 'Zwei Bildschirme und ein PC in Regenbogenfarben', cost: 480, rep: 10 },
    { id: 'gamingchair', name: 'Gaming-Stuhl', desc: 'Renn-Sitz in Schwarz und Neon-Grün mit Kopfkissen, dreht sich leicht hin und her. Passt vor den Gaming-Tisch', cost: 360, rep: 10 },
    { id: 'statue', name: 'Goldene Statue', desc: 'Glänzt und funkelt auf ihrem Sockel', cost: 650, rep: 20 },
    { id: 'hottub', name: 'Whirlpool', desc: 'Sprudelt warm, mit aufsteigendem Dampf', cost: 900, rep: 25 }
  ];
  const FLOOR_COLORS = [null, '#3A424D', '#43604B', '#7D705A', '#7A4F43', '#5A3F57', '#345A6B', '#A39D8A', '#6B4E34'];
  const FLOOR_PATS = ['Standard', 'Dielen', 'Schachbrett', 'Glatt'];
  const RUGS = ['rug', 'leafrug', 'roundrug', 'starrug', 'hemprug'];
  const DHALF = { rug: [28, 20], leafrug: [34, 28], roundrug: [32, 32], couch: [30, 16], tv: [22, 16], tank: [22, 16], shelf: [20, 17], lamp: [10, 22], palm: [14, 22], cactus: [10, 16], plant: [12, 16], turntable: [26, 18], flowers: [14, 20], beanbag: [19, 17], discoball: [14, 30], candles: [14, 12], bonsai: [14, 18], globe: [12, 20], fan: [12, 24], lavalamp: [8, 20], starrug: [34, 24], easel: [18, 22], speaker: [10, 22], fridge: [13, 22], neon: [22, 16], trophy: [14, 22], fireplace: [26, 20], piano: [28, 16], arcade: [14, 24], gnome: [8, 14], dartboard: [14, 16], mirror: [14, 26], guitar: [10, 22], punchbag: [10, 26], tree: [16, 28], coffee: [14, 18], hammock: [32, 14], terrarium: [18, 12], popcorn: [12, 22], telescope: [16, 24], drumset: [24, 20], chandelier: [20, 20], jukebox: [16, 24], kicker: [30, 16], pooltable: [34, 20], growtent: [22, 28], ledpanel: [18, 24], carbonfilter: [12, 22], clipfan: [10, 14], watercan: [12, 10], seedrack: [16, 20], leafposter: [16, 20], jars: [17, 16], hygro: [8, 11], mother: [16, 22], drynet: [17, 22], hemprug: [32, 24], kettle: [20, 26], casks: [22, 18], tap: [19, 18], hopsack: [13, 16], mugshelf: [18, 15], fermenter: [13, 26], maltsacks: [18, 14], crates: [15, 18], prostsign: [22, 12], bartable: [14, 14], futon: [22, 15], bed: [16, 26], bunkbed: [18, 27], dbed: [32, 28], catbed: [14, 13], bookstack: [10, 10], fishbowl: [9, 9], fairy: [30, 8], bbq: [14, 16], plantwall: [20, 18], graffcanvas: [22, 12], clock: [10, 25], robot: [16, 13], miniramp: [30, 15], vending: [14, 23], safe: [14, 16], pingpong: [32, 18], gamingpc: [26, 16], statue: [12, 20], hottub: [30, 23] };
  const dHalf = id => DHALF[id] || [24, 20];
  const MAXDEC = 44;
  COS.push(
    { id: 'lanterns', kind: 'orbit', name: 'Laternenkranz', desc: 'Leuchtende Papierlaternen schweben um dich', cost: 800 },
    { id: 'moons', kind: 'orbit', name: 'Mondphasen', desc: 'Drei Monde in verschiedenen Phasen kreisen um dich', cost: 1000 }
  );
  DECOR.push(
    { id: 'rugstripe', name: 'Streifen-Teppich', desc: 'Bunte Streifen für Wohnlichkeit', cost: 110 },
    { id: 'lantern', name: 'Windlicht', desc: 'Eine kleine Flamme flackert im Glas', cost: 60 },
    { id: 'radio', name: 'Retro-Radio', desc: 'Holzgehäuse, Skala und leise Musik', cost: 130, rep: 2 },
    { id: 'vinyl', name: 'Plattenspieler', desc: 'Die Platte dreht sich, der Tonarm wippt', cost: 260, rep: 8 },
    { id: 'armchair', name: 'Sessel', desc: 'Weich gepolstert, mit hoher Lehne', cost: 220, rep: 4 },
    { id: 'snowglobe', name: 'Schneekugel', desc: 'Drinnen schneit es ganz leise', cost: 75 },
    { id: 'windchime', name: 'Windspiel', desc: 'Klingende Röhrchen, die sanft pendeln', cost: 95 },
    { id: 'planter', name: 'Hochbeet', desc: 'Salat und Tomaten im Holzrahmen', cost: 150 },
    { id: 'piggy', name: 'Sparschwein', desc: 'Ein Münzchen fällt hinein, immer wieder', cost: 85, rep: 3 }
  );
  RUGS.push('rugstripe');
  DECOR.push( // v106: neue Deko
    { id: 'cactusrow', name: 'Kaktus-Trio', desc: 'Drei kleine Kakteen in bunten Töpfen', cost: 90 },
    { id: 'gumball', name: 'Kaugummiautomat', desc: 'Rote Kugel voller bunter Kaugummis', cost: 80 },
    { id: 'monstera', name: 'Monstera', desc: 'Große Blätter mit den typischen Löchern', cost: 140 },
    { id: 'hamster', name: 'Hamsterkäfig', desc: 'Der Hamster rennt im Laufrad', cost: 160, rep: 3 },
    { id: 'arclamp', name: 'Bogenlampe', desc: 'Großer Bogen, warmes Licht über dem Sofa', cost: 190, rep: 4 },
    { id: 'skatewall', name: 'Skateboard-Wand', desc: 'Drei Boards in Neonfarben an der Wand', cost: 260, rep: 6 },
    { id: 'neonleaf', name: 'Neon-Blatt', desc: 'Grünes Neonzeichen, das langsam pulsiert', cost: 320, rep: 8 },
    { id: 'aquarium', name: 'Aquarium', desc: 'Bunte Fische, Pflanzen und Blubberblasen', cost: 420, rep: 9 },
    { id: 'homebar', name: 'Hausbar', desc: 'Theke mit Flaschen, Gläsern und zwei Hockern', cost: 480, rep: 12 },
    { id: 'massage', name: 'Massagesessel', desc: 'Rot gepolstert, brummt und vibriert', cost: 560, rep: 14 },
    { id: 'koipond', name: 'Koi-Teich', desc: 'Kleiner Teich mit zwei Kois und Seerose', cost: 640, rep: 16 },
    { id: 'bigtv', name: 'Heimkino', desc: 'Große Leinwand mit Boxen, es läuft ein Film', cost: 780, rep: 19 },
    { id: 'goldbars', name: 'Goldbarren', desc: 'Ein glänzender Stapel für echte Bosse', cost: 1500, rep: 35 }
  );
  DECOR.push( // v112: exklusiv, gibt es nur als Belohnung
    { id: 'masterpiece', name: 'Meisterwerk', desc: 'Ein Ölgemälde im schweren Goldrahmen, Geschenk von Herrn von Hagen', cost: 1, qx: 'Questkette von Hagen' },
    { id: 'citykey', name: 'Goldener Stadtschlüssel', desc: 'Auf einem Samtkissen unter Glas, vom Bürgermeister persönlich', cost: 1, qx: 'Questkette Bürgermeister' },
    { id: 'prtrophy', name: 'Prestige-Pokal', desc: 'Ein Pokal mit violettem Stern, für jeden Neuanfang einer', cost: 1, qx: 'Prestige' }
  );
  Object.assign(DHALF, { masterpiece: [20, 18], citykey: [14, 14], prtrophy: [10, 14] });
  const DEC_NEW = ['lounge', 'firepit', 'console', 'djbooth', 'neonsign', 'pokertable', 'tagwall', 'sneakerwall', 'hoops', 'moneycount', 'speakerwall', 'cooler', 'firefly', 'mobile', 'rocker', 'newton', 'cuckoo', 'plasma', 'fountain', 'robovac', 'bubbles', 'trainset', 'carousel', 'jellytank']; // v130: die neue bewegte Deko
  Object.assign(DHALF, { cactusrow: [18, 12], gumball: [8, 16], monstera: [16, 20], hamster: [14, 12], arclamp: [20, 24], skatewall: [22, 16], neonleaf: [18, 18], aquarium: [26, 16], homebar: [30, 16], massage: [16, 18], koipond: [26, 20], bigtv: [32, 18], goldbars: [14, 10] });
  Object.assign(DHALF, { rugstripe: [30, 22], lantern: [8, 14], radio: [14, 12], vinyl: [17, 13], armchair: [18, 16], snowglobe: [9, 12], windchime: [13, 20], planter: [20, 13], piggy: [12, 11] });
  COS.push(
    { id: 'bird', kind: 'pet', name: 'Welli', desc: 'Ein bunter Wellensittich flattert gemütlich neben dir her', cost: 500 },
    { id: 'dog', kind: 'pet', name: 'Welpe', desc: 'Ein verschmuster Hund trottet hinter dir her', cost: 650 },
    { id: 'cat', kind: 'pet', name: 'Kätzchen', desc: 'Eine kleine Katze schleicht dir hinterher', cost: 650 },
    { id: 'bunny', kind: 'pet', name: 'Häschen', desc: 'Ein flauschiger Hase hoppelt mit dir mit', cost: 700 },
    { id: 'panda', kind: 'pet', name: 'Baby-Panda', desc: 'Ein kleiner Panda watschelt dir nach', cost: 900 },
    { id: 'teddy', kind: 'pet', name: 'Teddy', desc: 'Ein weicher Bär mit grünem Schal watschelt auf zwei Beinen neben dir', cost: 800 },
    { id: 'monkey', kind: 'pet', name: 'Affe', desc: 'Ein flinker kleiner Affe hüpft mit eingerolltem Schwanz neben dir her', cost: 1100 },
    { id: 'dolphin', kind: 'pet', name: 'Delfin', desc: 'Ein Delfin schwebt in einer Wasserblase fröhlich um dich herum', cost: 1400 },
    { id: 'elephant', kind: 'pet', name: 'Baby-Elefant', desc: 'Ein kleiner Elefant mit großen Ohren trottet dir hinterher', cost: 1600 },
    { id: 'leopard', kind: 'pet', name: 'Baby-Leopard', desc: 'Ein geflecktes Leoparden-Junges schleicht lautlos neben dir', cost: 2000 },
    { id: 'dragon', kind: 'pet', name: 'Mini-Drache', desc: 'Ein winziger Drache flattert mit kleinen Flügeln neben dir und pustet manchmal Funken', cost: 2500 }
  );
  // Freischaltung ueber Ruf
  const PET_REP = { bubtrail: 4, butterflies: 8, notes: 14, clover: 18, orbs: 26, fire: 28, dust: 48, halo: 50, petals: 6, hearts: 10, bolt: 18, planets: 22, flames: 32, gold: 42, bird: 2, dog: 6, cat: 11, bunny: 16, teddy: 24, panda: 34, dragon: 55, monkey: 30, dolphin: 36, elephant: 40, leopard: 46 };
  COS.forEach(c => { c.rep = PET_REP[c.id] || 0; c.cost = Math.round(c.cost * 1.6 / 10) * 10; });
  Object.values(ROLES).forEach(r => { r.cost = r.cost.map(c => Math.round(c * 1.6 / 10) * 10); });
  const DEC_REP = { cactus: 0, flowers: 0, plant: 0, roundrug: 4, rug: 7, lamp: 9, beanbag: 12, shelf: 15, leafrug: 19, palm: 23, turntable: 28, couch: 33, tv: 38, tank: 44, discoball: 52, candles: 0, bonsai: 5, fan: 8, globe: 10, starrug: 12, lavalamp: 14, easel: 17, speaker: 20, fridge: 24, neon: 27, trophy: 31, fireplace: 36, piano: 42, arcade: 48, gnome: 0, dartboard: 6, tree: 8, mirror: 9, guitar: 13, punchbag: 16, coffee: 18, hammock: 22, terrarium: 15, popcorn: 25, telescope: 26, chandelier: 30, drumset: 36, kicker: 34, jukebox: 40, pooltable: 46, watercan: 0, hygro: 1, leafposter: 2, clipfan: 2, seedrack: 3, hemprug: 5, drynet: 6, jars: 8, mother: 10, carbonfilter: 11, ledpanel: 13, growtent: 16, hopsack: 2, maltsacks: 4, crates: 5, bartable: 7, mugshelf: 9, casks: 11, prostsign: 14, tap: 17, kettle: 21, fermenter: 26 };
  DECOR.forEach(d => { d.rep = DEC_REP[d.id] || 0; d.cost = Math.round(d.cost * 1.6 / 10) * 10; });
  COS.push( // v130: neue Begleiter (Preise und Ruf schon endgültig)
    { id: 'turtle', kind: 'pet', name: 'Schildkröte', desc: 'Eine kleine Schildkröte paddelt gemütlich hinter dir her und streckt neugierig den Kopf raus', cost: 1440, rep: 12 },
    { id: 'fox', kind: 'pet', name: 'Füchschen', desc: 'Ein roter Fuchs mit buschigem Schwanz, der beim Laufen hin und her wedelt', cost: 2080, rep: 20 },
    { id: 'penguin', kind: 'pet', name: 'Pinguin', desc: 'Ein kleiner Pinguin watschelt wackelnd neben dir und schlägt mit den Flossen', cost: 2400, rep: 28 },
    { id: 'owl', kind: 'pet', name: 'Eule', desc: 'Eine runde Eule flattert neben dir, blinzelt mit großen Augen und dreht den Kopf', cost: 2880, rep: 38 },
    { id: 'axolotl', kind: 'pet', name: 'Axolotl', desc: 'Ein rosa Axolotl schwebt in einer Wasserkugel und wedelt mit seinen Kiemen', cost: 3520, rep: 44 },
    { id: 'ghost', kind: 'pet', name: 'Gespenst', desc: 'Ein freundliches kleines Gespenst schwebt um dich, wird mal durchsichtig und streckt die Zunge raus', cost: 4160, rep: 50 },
    { id: 'unicorn', kind: 'pet', name: 'Mini-Einhorn', desc: 'Ein weißes Einhorn mit Regenbogenmähne und goldenem Horn, das Funkeln hinterlässt', cost: 5120, rep: 62 }
  );
  DECOR.push( // v130: Deko, die sich bewegt
    { id: 'firefly', name: 'Glühwürmchen-Glas', desc: 'Kleine Lichter schwirren im Glas, nachts leuchtet es richtig', cost: 290, rep: 2 },
    { id: 'mobile', name: 'Sternen-Mobile', desc: 'Sterne und ein Mond drehen sich langsam im Kreis', cost: 350, rep: 3 },
    { id: 'rocker', name: 'Schaukelstuhl', desc: 'Schaukelt ganz gemütlich vor und zurück', cost: 480, rep: 4 },
    { id: 'newton', name: 'Kugelpendel', desc: 'Die äußeren Kugeln klacken immer hin und her', cost: 420, rep: 5 },
    { id: 'cuckoo', name: 'Kuckucksuhr', desc: 'Das Pendel schwingt, ab und zu schaut der Kuckuck heraus', cost: 540, rep: 6 },
    { id: 'plasma', name: 'Plasmakugel', desc: 'Lila Blitze zucken in der Glaskugel', cost: 620, rep: 8 },
    { id: 'fountain', name: 'Zimmerbrunnen', desc: 'Wasser plätschert in kleinen Bögen über die Steine', cost: 770, rep: 10 },
    { id: 'robovac', name: 'Saugroboter', desc: 'Fährt brav seine Runden und blinkt dabei', cost: 830, rep: 12 },
    { id: 'bubbles', name: 'Seifenblasen-Maschine', desc: 'Pustet schillernde Seifenblasen in die Luft', cost: 670, rep: 14 },
    { id: 'trainset', name: 'Modelleisenbahn', desc: 'Eine kleine Lok mit zwei Wagen fährt im Kreis', cost: 1220, rep: 18 },
    { id: 'carousel', name: 'Mini-Karussell', desc: 'Drei Pferdchen drehen sich auf und ab, mit Lichtern am Dach', cost: 1440, rep: 24 },
    { id: 'jellytank', name: 'Quallen-Aquarium', desc: 'Leuchtende Quallen pulsieren und wechseln langsam die Farbe', cost: 1920, rep: 30 }
  );
  DECOR.push( // v132: Chill-Zone, passt besonders ins Gang-HQ
    { id: 'lounge', name: 'Lounge-Ecke', desc: 'Große Eck-Couch mit bunten Kissen und Tischchen, dampfender Kaffee inklusive', cost: 1400, rep: 15 },
    { id: 'firepit', name: 'Feuerschale', desc: 'Knisternde Flammen und fliegende Funken, nachts leuchtet der ganze Raum warm', cost: 900, rep: 10 },
    { id: 'console', name: 'Gaming-Ecke', desc: 'Großer Bildschirm mit laufendem Rennspiel, Konsole und zwei Sitzsäcken', cost: 1800, rep: 20 },
    { id: 'djbooth', name: 'DJ-Pult', desc: 'Zwei drehende Plattenteller, tanzender Equalizer und bunte Lichtstrahlen im Takt', cost: 2600, rep: 28 },
    { id: 'neonsign', name: 'Neon „CHILL ZONE“', desc: 'Pinkes Neonschild, das ruhig pulsiert und manchmal flackert', cost: 700, rep: 8 },
    { id: 'pokertable', name: 'Pokertisch', desc: 'Grüner Filz, Chip-Stapel und Karten, die nach und nach aufgedeckt werden', cost: 1600, rep: 22 },
    { id: 'tagwall', name: 'Graffiti-Wand', desc: 'Eine Spraydose sprüht immer wieder ein neues buntes Tag an die Wand', cost: 1100, rep: 12 },
    { id: 'sneakerwall', name: 'Sneaker-Wand', desc: 'Neun Paar Sneaker auf beleuchteten Regalen, eins schwebt immer kurz hoch', cost: 1300, rep: 16 },
    { id: 'hoops', name: 'Basketball-Automat', desc: 'Der Ball fliegt immer wieder in den Korb, die Anzeige zählt mit', cost: 1000, rep: 14 },
    { id: 'moneycount', name: 'Geldzählmaschine', desc: 'Scheine flattern durch, die Anzeige zählt und zählt', cost: 2200, rep: 32 },
    { id: 'speakerwall', name: 'Boxenturm', desc: 'Die Membranen wummern im Takt, bei jedem Bass leuchtet die Kante', cost: 1500, rep: 18 },
    { id: 'cooler', name: 'Kühlbox', desc: 'Deckel klappt auf, kalte Limo-Dosen und Kältedampf', cost: 500, rep: 6 }
  );
  DECOR.push( // v144: Casino-Automaten
    { id: 'slotmachine', name: 'Spielautomat', desc: 'Einarmiger Bandit: Lauflichter, drehende Walzen, und ab und zu ein Gewinn mit Münzregen', cost: 1900, rep: 24 },
    { id: 'slotneon', name: 'Neon-Automat', desc: 'Lila Automat mit leuchtender Jackpot-Schrift, drehenden Walzen und Münzregen bei Gewinn', cost: 2800, rep: 30 }
  );
  Object.assign(DHALF, { slotmachine: [15, 24], slotneon: [15, 24], gamingchair: [12, 15] }); DEC_NEW.unshift('gamingchair', 'slotmachine', 'slotneon');
  const GHQ_CHILL = ['slotmachine', 'slotneon', 'lounge', 'firepit', 'console', 'djbooth', 'neonsign', 'pokertable', 'tagwall', 'sneakerwall', 'hoops', 'moneycount', 'speakerwall', 'cooler'];
  Object.assign(DHALF, { lounge: [34, 22], firepit: [18, 14], console: [32, 20], djbooth: [26, 18], neonsign: [24, 14], pokertable: [30, 20], tagwall: [30, 16], sneakerwall: [26, 20], hoops: [14, 22], moneycount: [20, 12], speakerwall: [18, 22], cooler: [13, 12] });
  Object.assign(DHALF, { firefly: [8, 14], mobile: [14, 18], rocker: [16, 18], newton: [14, 10], cuckoo: [12, 20], plasma: [10, 14], fountain: [16, 16], robovac: [18, 16], bubbles: [10, 14], trainset: [28, 18], carousel: [18, 20], jellytank: [14, 22] });
  const placedCount = id => DEC_KEYS.reduce((n, k) => n + G.dec.items[k].filter(d => d.id === id).length, 0);
  const decStock = id => (G.dec.owned[id] || 0) - placedCount(id);
  function buyDecor(id) {
    const d = DECOR.find(x => x.id === id);
    if (!d || d.qx || G.money < d.cost || G.rep < (d.rep || 0)) return false;
    G.money -= d.cost; G.dec.owned[id] = (G.dec.owned[id] || 0) + 1; sfx.buy(); save(); return true;
  }
  // Deko steht frei im Raum: { id, x, y }
  function clampDecor(ak, it, x, y) {
    const h = dHalfIt(it), I = AREAS[ak].IN;
    it.x = clamp(Math.round(x / 2) * 2, I.x0 + h[0], I.x1 - h[0]); it.y = clamp(Math.round(y / 2) * 2, I.y0 + h[1], I.y1 - h[1]);
  }
  function addDecor(ak, id, x, y) {
    const arr = G.dec.items[ak];
    if (!arr || !DECOR.some(d => d.id === id) || decStock(id) <= 0 || arr.length >= MAXDEC) return null;
    const it = { id, x: 0, y: 0 }; clampDecor(ak, it, x, y); arr.push(it); sfx.put(); save(); return it;
  }
  function moveDecor(ak, i, x, y) { const it = G.dec.items[ak] && G.dec.items[ak][i]; if (!it) return false; clampDecor(ak, it, x, y); save(); return true; }
  function removeDecor(ak, i) { const arr = G.dec.items[ak]; if (!arr || !arr[i]) return false; arr.splice(i, 1); sfx.put(); save(); return true; }
  const pets = [{ x: 0, y: 0, face: 1, moving: false, clock: 0 }, { x: 0, y: 0, face: 1, moving: false, clock: 0 }], pet = pets[0];
  let phist = [], pclock = 0;
  const activePets = () => [G.cos.pet, G.cos.pet2].filter(x => x && x !== 'none');
  function petSnap() { phist.length = 0; pets.forEach((p, n) => { p.x = player.x - 14 - n * 12; p.y = player.y + 8 + n * 4; }); }
  const FLY = ['bird', 'dolphin', 'dragon', 'owl', 'axolotl', 'ghost']; // v130: Eule, Axolotl und Gespenst schweben
  function petUpdate(dt, moved) {
    const act = activePets(); if (!act.length) return;
    pclock += dt; pet.clock = pclock;
    phist.push({ x: player.x, y: player.y, t: pclock }); while (phist.length > 2 && pclock - phist[0].t > 2.2) phist.shift();
    act.forEach((id, n) => {
      const p = pets[n]; let tx, ty;
      if (FLY.includes(id)) { tx = player.x + (n ? 22 : -20) + Math.sin(gt * 1.3 + n) * 5; ty = player.y + 2 + Math.cos(gt * 1.7 + n) * 3; }
      else if (moved > 0.15 || Math.hypot(player.x - p.x, player.y - p.y) > 34 + n * 12) {
        const delay = (0.28 + 0.17 * n) * (riding() ? 0.4 : 1); let pt = phist[0]; for (const h of phist) { if (pclock - h.t >= delay) pt = h; }
        tx = pt.x; ty = pt.y;
      } else { tx = player.x - Math.cos(player.ang) * (16 + n * 14) + 6 - n * 8; ty = player.y + 11 + n * 3; }
      const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
      const vmax = riding() ? VEH_BY[G.veh.eq].spd * 1.2 + 40 : 230; // v70: Begleiter halten mit jedem Fahrzeug mit
      if (d > Math.max(240, vmax * 0.9)) { p.x = tx; p.y = ty; p.moving = false; }
      else if (d > 1.5) {
        const sp = Math.min(d * 9, vmax), st = Math.min(d, sp * dt);
        p.x += dx / d * st; p.y += dy / d * st;
        if (Math.abs(dx) > 1) p.face = dx > 0 ? 1 : -1;
        p.moving = sp > 14 && d > 3;
      } else p.moving = false;
      if (FLY.includes(id) && moved > 0.15) p.face = Math.cos(player.ang) >= 0 ? 1 : -1;
    });
  }
  let G = null, state = 'menu', phoneOpen = false, tab = 'home', gt = 0, curKey = 'keller';
  let fx = [], hist = [], stepDist = 0, stepSide = 1, fxAcc = 0;
  const player = { x: DOOR.x, y: DOOR.y, r: 9, ang: Math.PI / 2, step: 0, stun: 0, batCd: 0, sw: null };
  const cam = { x: DOOR.x, y: DOOR.y };
  const cops = [];
  const COP_LOOK = Object.assign({}, DEF_LOOK, { r: 36, g: 60, b: 120, hat: 'cap', top: 'bomber' });
  // Waffen (v50 ausgebaut, alles Cartoon-K.O., kein Blut): reach = Reichweite in px, kb = Rueckstoss, stun = Sekunden K.O. fuer Mitspieler, cop = Sekunden K.O. fuer die Polizei.
  // Optional: shape = Aussehen, cd = Abklingzeit, arc = halber Trefferwinkel, n = max. Treffer (1 = nur das naechste Ziel), kp = Rueckstoss fuer Streifen in px.
  // guard = Abwehr und thr = Abschreckung: Grundlage fuer die spaeteren Gangs (Ueberfaelle, grosse Lieferungen); heute zaehlt nur guard beim Abblocken im Mehrspieler.
  const WGRP = ['Schläger', 'Nahkampf', 'Spezial', 'Fernkampf'];
  const GADGETS = ['shield', 'zap', 'water', 'sling', 'net', 'flash'];
  const BATS = [
    { id: 'holz', grp: 'Schläger', name: 'Holzschläger', cost: 350, rep: 0, reach: 44, kb: 260, stun: 0.9, cop: 5, guard: 3, thr: 8, c1: '#C98A4B', c2: '#7A4B22', glow: '', desc: 'Der Klassiker. Reicht, um Freunde wegzuhauen und eine Streife kurz auszuknipsen.' },
    { id: 'alu', grp: 'Schläger', name: 'Alu-Schläger', cost: 1800, rep: 12, reach: 50, kb: 320, stun: 1.2, cop: 7, guard: 5, thr: 14, c1: '#CBD5E1', c2: '#4B5563', glow: '', desc: 'Leicht, lang und laut. Mehr Wucht, Polizei länger weg.' },
    { id: 'neon', grp: 'Schläger', name: 'Neon-Schläger', cost: 7500, rep: 30, reach: 56, kb: 380, stun: 1.5, cop: 9, guard: 7, thr: 22, c1: '#4DF0C8', c2: '#1B3F3A', glow: '#4DF0C8', desc: 'Leuchtet im Dunkeln. Große Reichweite, harter Schlag.' },
    { id: 'gold', grp: 'Schläger', name: 'Gold-Schläger', cost: 24000, rep: 50, reach: 62, kb: 440, stun: 1.8, cop: 12, guard: 10, thr: 34, c1: '#FFD24A', c2: '#8A6A12', glow: '#FFD24A', desc: 'Das Beste vom Besten. Größte Reichweite, stärkster Schlag.' },
    { id: 'pfanne', grp: 'Nahkampf', shape: 'pan', name: 'Bratpfanne', cost: 600, rep: 4, reach: 38, kb: 300, stun: 1.3, cop: 6, cd: 0.8, arc: 1.7, guard: 5, thr: 6, c1: '#3A3F4A', c2: '#8A5A32', glow: '', desc: 'Kurz, aber der Bogen ist breit. Wer neben dir steht, bekommt auch etwas ab. Bonk!' },
    { id: 'teleskop', grp: 'Nahkampf', shape: 'stick', name: 'Teleskopstab', cost: 2400, rep: 14, reach: 66, kb: 250, stun: 1.0, cop: 7, cd: 0.42, arc: 0.9, guard: 6, thr: 12, c1: '#C9D2DC', c2: '#3B3F4D', glow: '', desc: 'Fährt aus und reicht weit. Dafür schnell wieder einsatzbereit, aber mit wenig Wucht.' },
    { id: 'quietsch', grp: 'Nahkampf', shape: 'hammer', name: 'Quietsch-Hammer', cost: 3200, rep: 18, reach: 42, kb: 560, stun: 0.7, cop: 5, cd: 0.95, guard: 3, thr: 10, c1: '#FFD24A', c2: '#E05555', glow: '', desc: 'Quietscht lustig, schleudert aber jeden meterweit weg. Kaum benommen, dafür weit weg.' },
    { id: 'schild', grp: 'Nahkampf', shape: 'shield', name: 'Schlagschild', cost: 5500, rep: 24, reach: 30, kb: 380, stun: 1.0, cop: 4, cd: 0.9, arc: 1.0, guard: 20, thr: 14, c1: '#5E7EA8', c2: '#2A3A55', glow: '', desc: 'Hält Schläge fast ganz ab und rammt Gegner weg. Die beste Abwehr, später wichtig gegen Überfälle.' },
    { id: 'schocker', kiosk: true, grp: 'Spezial', shape: 'zap', name: 'Elektroschocker', cost: 4200, rep: 22, reach: 34, kb: 90, stun: 2.6, cop: 12, cd: 1.6, arc: 0.8, n: 1, kp: 6, guard: 6, thr: 20, c1: '#4DA3E0', c2: '#2A2D38', glow: '#7FD0FF', desc: 'Sehr kurze Reichweite, aber lange benommen. Nur ein Ziel, dann eine Pause.' },
    { id: 'blend', kiosk: true, grp: 'Spezial', shape: 'flash', name: 'Blendgranate', cost: 12000, rep: 40, reach: 95, kb: 200, stun: 1.8, cop: 8, cd: 6, arc: 3.2, kp: 14, guard: 8, thr: 30, c1: '#FFFFFF', c2: '#6B7280', glow: '#FFFFFF', desc: 'Ein heller Blitz um dich herum: alle in der Nähe sind benommen. Lädt lange nach.' },
    { id: 'wasser', kiosk: true, grp: 'Fernkampf', shape: 'water', name: 'Wasserpistole', cost: 700, rep: 3, reach: 105, kb: 60, stun: 0.4, cop: 2.5, cd: 0.4, arc: 0.45, n: 1, kp: 6, guard: 1, thr: 3, c1: '#4FA8DE', c2: '#2B5E8A', glow: '', desc: 'Spritzt auf Abstand. Kaum Wirkung, aber schnell und billig. Für Streiche.' },
    { id: 'zwille', kiosk: true, grp: 'Fernkampf', shape: 'sling', name: 'Zwille', cost: 1500, rep: 8, reach: 150, kb: 140, stun: 0.8, cop: 4, cd: 1.1, arc: 0.3, n: 1, kp: 10, guard: 2, thr: 8, c1: '#8A5A32', c2: '#E05555', glow: '', desc: 'Schießt Kiesel auf das nächste Ziel in Reichweite. Gute Distanz, kleiner Effekt.' },
    { id: 'netz', kiosk: true, grp: 'Fernkampf', shape: 'net', name: 'Netzwerfer', cost: 9000, rep: 34, reach: 140, kb: 30, stun: 2.2, cop: 10, cd: 3, arc: 0.4, n: 1, kp: 2, guard: 4, thr: 24, c1: '#E8E2D0', c2: '#6F5139', glow: '', desc: 'Wirft ein Netz über das nächste Ziel. Es bleibt lange hängen, danach brauchst du etwas Zeit.' }
  ];
  const batDef = id => BATS.find(b => b.id === id) || null;
  const guardOf = id => { const b = batDef(id); return b ? (b.guard || 0) : 0; };
  // Abwehr: Schutz der gehaltenen Waffe plus ein Viertel der uebrigen. Abschreckung: staerkste Waffe plus ein Zehntel der uebrigen. (Grundlage fuer die Gangs.)
  const defenseScore = () => { if (!G) return 0; let t = 0; for (const b of BATS) if (G.wpn.owned[b.id]) t += (b.guard || 0) * (G.wpn.eq === b.id ? 1 : 0.25); return Math.round(t); };
  const threatScore = () => { if (!G) return 0; let m = 0, t = 0; for (const b of BATS) if (G.wpn.owned[b.id]) { m = Math.max(m, b.thr || 0); t += b.thr || 0; } return Math.round(m + (t - m) * 0.1); };
  // v48: Fortbewegungsmittel
  // v70: feste Hoechstgeschwindigkeiten (spd, Pixel pro Sekunde), Schritt fuer Schritt schneller. Zu Fuss: 135, mit allen Schuhen 202.
  // Schuhe und Begleiter machen nur zu Fuss schneller, Fahrzeuge haben ihr eigenes Tempo.
  const VEHS = [
    { id: 'scooter', name: 'Roller', cost: 900, rep: 4, spd: 215, desc: 'Ein flinker Tretroller. Schneller als zu Fuß, auch mit den besten Schuhen.' },
    { id: 'bmx', name: 'BMX-Rad', cost: 2400, rep: 10, spd: 245, desc: 'Robust und wendig.' },
    { id: 'ebike', name: 'E-Bike', cost: 5500, rep: 18, spd: 275, desc: 'Mit Motor und Licht für die Nacht.' },
    // v66: Autos gibt es nur am Autohof. Ausgewaehlt geben sie Laderaum fuer Ware dazu.
    { id: 'van', car: 1, util: 1, name: 'Sprinter', cost: 6500, rep: 0, spd: 285, cap: 35, len: 46, wid: 20, col: 5, desc: 'Der Transporter: +35 Platz für Ware, ideal für Fahrten zum Mietlager. Nicht ganz so flott.' },
    { id: 'mini', car: 1, name: 'Kleinwagen', cost: 7000, rep: 0, spd: 300, cap: 8, len: 30, wid: 17, col: 2, desc: 'Klein, wendig und günstig. +8 Platz für Ware.' },
    { id: 'muscle', car: 1, name: 'Musclecar', cost: 16000, rep: 0, spd: 335, cap: 6, len: 42, wid: 19, col: 0, desc: 'Lange Haube, Rennstreifen, lauter Motor. +6 Platz.' },
    { id: 'sport', car: 1, name: 'Sportwagen', cost: 32000, rep: 25, spd: 365, cap: 4, len: 38, wid: 18, col: 1, desc: 'Flach und schnell. +4 Platz.' },
    { id: 'super', car: 1, name: 'Supersportwagen', cost: 75000, rep: 50, spd: 400, cap: 2, len: 40, wid: 21, col: 7, desc: 'Das Schnellste auf der Straße. +2 Platz.' },
    // v80: weitere Autos und ein Lastwagen. util = Nutzfahrzeug: Laderaum in der Werkstatt in drei Stufen ausbaubar
    { id: 'pickup', car: 1, util: 1, name: 'Pickup', cost: 12000, rep: 6, spd: 300, cap: 18, len: 44, wid: 20, col: 3, desc: 'Offene Pritsche, auf der du deine Ware siehst. +18 Platz, Laderaum ausbaubar.' },
    { id: 'suv', car: 1, name: 'Geländewagen', cost: 22000, rep: 14, spd: 320, cap: 12, len: 42, wid: 21, col: 4, desc: 'Kantig, mit Dachreling, Reserverad und Rammschutz. +12 Platz.' },
    { id: 'lowrider', car: 1, name: 'Lowrider', cost: 28000, rep: 20, spd: 315, cap: 6, len: 46, wid: 20, col: 6, desc: 'Lang, offen, Chrom und Weißwandreifen. Zum Cruisen. +6 Platz.' },
    { id: 'truck', car: 1, util: 1, name: 'Lastwagen', cost: 45000, rep: 30, spd: 255, cap: 60, len: 62, wid: 24, col: 1, desc: 'Der große Koffer-Lkw: +60 Platz, Laderaum in der Werkstatt in drei Stufen bis +120 ausbaubar. Langsam, aber er schleppt alles.' }
  ];
  VEHS.forEach(v => { v.mult = v.spd / 135; v.desc += ' Tempo ' + Math.round(v.mult * 100) + ' % (zu Fuß 100 %).'; });
  const CAR_COLS = ['#D33F3F', '#2F6FD6', '#F2C14E', '#3FAE6A', '#1D2129', '#EEF2F7', '#8A5FC9', '#E8833A', '#7FD0C8', '#9AA6B3', '#F28BB0', '#6B4A2A'];
  const CAR_COL_NAMES = ['Rot', 'Blau', 'Gelb', 'Grün', 'Schwarz', 'Weiß', 'Lila', 'Orange', 'Türkis', 'Silber', 'Rosa', 'Braun'];
  const VEH_BY = Object.fromEntries(VEHS.map(v => [v.id, v]));
  // ---------- v72: Wegenetz fuer Streife, Kunden und Gangs ----------
  // Knoten an allen Kreuzungen der Linien, Kanten dazwischen. Die Streife meidet Trampelpfade ('p').
  // Wer laeuft, fragt nur nach dem naechsten Wegpunkt (navNext); kuerzeste Wege per Dijkstra, je Ziel-Knoten zwischengespeichert.
  const NAV = { nodes: [], edges: [], adj: [], exits: [], esc: [], cache: [new Map(), new Map()] };
  {
    const idx = {}, node = (x, y) => { x = Math.round(x); y = Math.round(y); const k = x + ',' + y; if (idx[k] === undefined) { idx[k] = NAV.nodes.length; NAV.nodes.push({ x, y }); NAV.adj.push([]); } return idx[k]; };
    const edge = (a, b, k) => { if (a === b || NAV.adj[a].some(q => q[0] === b)) return; const A = NAV.nodes[a], B = NAV.nodes[b], len = Math.hypot(B.x - A.x, B.y - A.y), i = NAV.edges.length; NAV.edges.push({ a, b, k, len }); NAV.adj[a].push([b, len, i]); NAV.adj[b].push([a, len, i]); };
    const ins = (v, a, b) => v >= a - 0.5 && v <= b + 0.5, uniq = a => [...new Set(a.map(Math.round))].sort((p, q) => p - q);
    for (const h of NAV_HL) { const xs = [h.x0, h.x1]; for (const v of NAV_VL) if (ins(v.x, h.x0, h.x1) && ins(h.y, v.y0, v.y1)) xs.push(v.x); const u = uniq(xs); for (let t = 1; t < u.length; t++) edge(node(u[t - 1], h.y), node(u[t], h.y), h.k); }
    for (const v of NAV_VL) { const ys = [v.y0, v.y1]; for (const h of NAV_HL) if (ins(v.x, h.x0, h.x1) && ins(h.y, v.y0, v.y1)) ys.push(h.y); const u = uniq(ys); for (let t = 1; t < u.length; t++) edge(node(v.x, u[t - 1]), node(v.x, u[t]), v.k); }
    for (const [x0, y0, x1, y1] of NAV_X) edge(node(x0, y0), node(x1, y1), 'k');
    NAV.nodes.forEach((n, i) => { if (n.x <= 16 || n.x >= WW - 16 || n.y <= YMIN + 16 || n.y >= WH - 16) NAV.exits.push(i); });
    // Fluchtwege der Gangs: Eingang eines Trampelpfads am Gehweg und ein Punkt tief im Pfad
    const onW = (x, y) => NAV_HL.some(l => l.k === 'w' && Math.abs(l.y - y) < 1 && ins(x, l.x0, l.x1)) || NAV_VL.some(l => l.k === 'w' && Math.abs(l.x - x) < 1 && ins(y, l.y0, l.y1));
    for (const v of NAV_VL) if (v.k === 'p') { if (onW(v.x, v.y1)) NAV.esc.push({ x: v.x, y: v.y1, dx: v.x, dy: v.y0 }); else if (onW(v.x, v.y0)) NAV.esc.push({ x: v.x, y: v.y0, dx: v.x, dy: v.y1 }); }
    for (const h of NAV_HL) if (h.k === 'p') for (const [ex, other] of [[h.x0, h.x1], [h.x1, h.x0]]) if (onW(ex, h.y)) NAV.esc.push({ x: ex, y: h.y, dx: Math.round((ex * 2 + other) / 3), dy: h.y });
  }
  // Kollisionspruefung fuer Sichtlinien: Raster ueber die festen Hindernisse draussen
  const CG = { n: -1, m: new Map() };
  function cgCell(cx, cy) { return cx * 4096 + cy; }
  function cgBuild() {
    CG.m.clear(); CG.n = colliders.length;
    for (const c of colliders) {
      if ((c.fl !== undefined && c.fl !== 0) || c.x < -5000) continue;
      for (let cx = Math.floor((c.x - 12) / 80); cx <= Math.floor((c.x + c.w + 12) / 80); cx++) for (let cy = Math.floor((c.y - 12) / 80); cy <= Math.floor((c.y + c.h + 12) / 80); cy++) { const k = cgCell(cx, cy); let L = CG.m.get(k); if (!L) CG.m.set(k, L = []); L.push(c); }
    }
  }
  function blockedPt(x, y, r = 0) { // v148: ohne Radius galt nie etwas als blockiert (Katzen liefen durch Haeuser)
    if (CG.n !== colliders.length) cgBuild();
    const L = CG.m.get(cgCell(Math.floor(x / 80), Math.floor(y / 80))); if (!L) return false;
    for (const c of L) if (x > c.x - r && x < c.x + c.w + r && y > c.y - r && y < c.y + c.h + r) return true;
    return false;
  }
  function segClear(ax, ay, bx, by, pol) {
    const d = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(d / 7));
    for (let i = 1; i <= n; i++) { const t = i / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t; if (i * 7 > 10 && blockedPt(x, y, 7)) return false; if (pol && onPath(x, y)) return false; }
    return true;
  }
  function navDist(src, pol) {
    const C = NAV.cache[pol ? 1 : 0]; let d = C.get(src); if (d) return d;
    const n = NAV.nodes.length, done = new Uint8Array(n); d = new Float64Array(n).fill(Infinity); d[src] = 0;
    for (;;) {
      let u = -1, bu = Infinity; for (let i = 0; i < n; i++) if (!done[i] && d[i] < bu) { bu = d[i]; u = i; }
      if (u < 0) break; done[u] = 1;
      for (const [v, len, ei] of NAV.adj[u]) { if (pol && NAV.edges[ei].k === 'p') continue; if (bu + len < d[v]) d[v] = bu + len; }
    }
    C.set(src, d); return d;
  }
  // Naechste Kante (mit freier Sicht) zu einem Punkt
  function navNear(x, y, pol) {
    const top = [];
    for (let i = 0; i < NAV.edges.length; i++) {
      const E = NAV.edges[i]; if (pol && E.k === 'p') continue;
      const A = NAV.nodes[E.a], B = NAV.nodes[E.b], dx = B.x - A.x, dy = B.y - A.y, t = clamp(((x - A.x) * dx + (y - A.y) * dy) / (E.len * E.len || 1), 0, 1), px = A.x + dx * t, py = A.y + dy * t, d = Math.hypot(x - px, y - py);
      if (top.length < 6 || d < top[top.length - 1].d) { top.push({ i, t, px, py, d }); top.sort((p, q) => p.d - q.d); if (top.length > 6) top.pop(); }
    }
    for (const c of top) if (c.d < 5 || segClear(x, y, c.px, c.py, pol)) return c;
    return top[0] || null;
  }
  const segRoad = (ax, ay, bx, by) => { const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 10)); for (let i = 0; i <= n; i++) if (onRoadway(ax + (bx - ax) * i / n, ay + (by - ay) * i / n)) return true; return false; };
  function navNext0(x, y, tx, ty, pol, strict) { // strict: Strassen nur auf dem Wegenetz queren (Streife und bummelnde Kunden)
    const dd = Math.hypot(tx - x, ty - y);
    if (dd < 12 || (dd < (strict ? 300 : 760) && segClear(x, y, tx, ty, pol) && !(strict && dd > 40 && segRoad(x, y, tx, ty)))) return { x: tx, y: ty };
    const S = navNear(x, y, pol), E = navNear(tx, ty, pol); if (!S || !E) return { x: tx, y: ty };
    if (S.d > 9) return { x: S.px, y: S.py }; // erst zurueck aufs Wegenetz
    const se = NAV.edges[S.i], ee = NAV.edges[E.i];
    if (S.i === E.i) return { x: E.px, y: E.py };
    const dA = navDist(ee.a, pol), dB = navDist(ee.b, pol), nA = NAV.nodes[ee.a], nB = NAV.nodes[ee.b], oA = Math.hypot(E.px - nA.x, E.py - nA.y), oB = Math.hypot(E.px - nB.x, E.py - nB.y);
    const D = n => Math.min(dA[n] + oA, dB[n] + oB);
    const A = NAV.nodes[se.a], B = NAV.nodes[se.b], cA = Math.hypot(A.x - x, A.y - y) + D(se.a), cB = Math.hypot(B.x - x, B.y - y) + D(se.b);
    if (!Number.isFinite(cA) && !Number.isFinite(cB)) return { x: tx, y: ty };
    const n = cA <= cB ? se.a : se.b, N = NAV.nodes[n];
    if (Math.hypot(N.x - x, N.y - y) < 9) { // am Knoten: weiter zum besten Nachbarn
      if (ee.a === n || ee.b === n) return { x: E.px, y: E.py };
      let bn = -1, bc = Infinity; for (const [v, len, ei] of NAV.adj[n]) { if (pol && NAV.edges[ei].k === 'p') continue; if (len + D(v) < bc) { bc = len + D(v); bn = v; } }
      if (bn >= 0) return { x: NAV.nodes[bn].x, y: NAV.nodes[bn].y };
    }
    return { x: N.x, y: N.y };
  }
  function navNext(m, tx, ty, pol) {
    const c = m._nav;
    if (c && c.pol === !!pol && Math.abs(c.mx - m.x) < 3 && Math.abs(c.my - m.y) < 3 && Math.abs(c.tx - tx) < 6 && Math.abs(c.ty - ty) < 6 && gt - c.t < 0.6) return c.w;
    const w = navNext0(m.x, m.y, tx, ty, !!pol); m._nav = { mx: m.x, my: m.y, tx, ty, pol: !!pol, w, t: gt }; return w;
  }
  function navRoute(x, y, tx, ty, pol) {
    const pts = []; let px = x, py = y;
    for (let k = 0; k < 48; k++) { const w = navNext0(px, py, tx, ty, pol, true); if (Math.hypot(w.x - px, w.y - py) < 0.5) break; pts.push(w); if (Math.hypot(w.x - tx, w.y - ty) < 1) break; px = w.x; py = w.y; }
    return pts;
  }
  // Zufaelliger Punkt auf dem Wegenetz (lange Kanten oefter), optional in der Naehe eines Punktes
  function navRandPt(pol, nx, ny, rad) {
    for (let k = 0; k < 60; k++) {
      const E = NAV.edges[Math.floor(Math.random() * NAV.edges.length)]; if (pol && E.k === 'p') continue;
      if (Math.random() * 260 > E.len + 30) continue;
      const A = NAV.nodes[E.a], B = NAV.nodes[E.b], t = Math.random(), x = A.x + (B.x - A.x) * t, y = A.y + (B.y - A.y) * t;
      if (rad && Math.hypot(x - nx, y - ny) > rad) continue;
      if (onRoadway(x, y)) continue; // nicht mitten auf der Fahrbahn stehen bleiben
      return { x, y };
    }
    return null;
  }
  const viaPaths = (m, tx, ty) => navNext(m, tx, ty, false); // Gangs und Kunden
  const isCop = e => !!e.hunt || e.spMin !== undefined; // Streife: hat Tempo-Spanne, Kunden nicht
  const roamPath = (e, tx, ty) => navRoute(e.x, e.y, tx, ty, isCop(e)); // Streife ohne Trampelpfade
  const onPath = (x, y) => PATHS.some(p => x > p.x0 && x < p.x1 && y > p.y0 && y < p.y1) || onMapPath(x, y);
  const decorHit = (x, y) => !!obstAt(x, y);
  function roamPick(e) {
    const pol = isCop(e), h = !pol && e.house !== undefined ? HOUSES[e.house] : null;
    const p = (h && navRandPt(pol, h.dx, h.dy, 650)) || navRandPt(pol) || { x: e.x, y: e.y };
    e.tx = p.x; e.ty = p.y; e.ds = 0; e.dsT = 0; e.wx = undefined;
    if (e.hunt && G && G.rep >= 10 && state === 'play' && Math.random() < 0.08 && !inBuilding(player.x, player.y) && player.x >= 0) { // Streife schaut gezielt dort nach, wo der Spieler ist
      const q = navRandPt(true, player.x, player.y, 260); if (q) { e.tx = q.x; e.ty = q.y; }
    }
    e.vs = roamPath(e, e.tx, e.ty);
    if (e.spMin !== undefined) e.sp = e.spMin + Math.random() * (e.spMax - e.spMin);
  }
  // v49: Blickrichtung dreht weich (rate = Bogenmass pro Sekunde); gibt den Restwinkel zurueck
  function turnTo(e, a, dt, rate) {
    if (typeof e.ang !== 'number' || !Number.isFinite(e.ang)) { e.ang = a; return 0; }
    let d = a - e.ang; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
    const m = rate * dt; if (Math.abs(d) <= m) { e.ang += d; return 0; }
    e.ang += Math.sign(d) * m; return d - Math.sign(d) * m;
  }
  // v49: Kurs um Hindernisse. Der Ausweichkurs bleibt auf einer festen Seite (e.ds) und wird kurz gehalten (e.dsT),
  // statt jedes Bild die Richtung zu wechseln (das war das Ruckeln am Brunnen). Gibt den Kurs zurueck, null = eingekeilt.
  function avoid(e, a0, dt, tx, ty, L) {
    const to = obstAt(tx, ty), here = obstAt(e.x, e.y);
    const blk = h => { const c = Math.cos(h), sn = Math.sin(h); for (const f of [0.17, 0.33, 0.5, 0.75, 1]) { const o = obstAt(e.x + c * L * f, e.y + sn * L * f); if (o && o !== to) return o; } return null; };
    if (here && here !== to) { // steckt im Rand eines Hindernisses: auf dem kuerzesten Weg hinaus
      e.dsT = 0; const dl = e.x - here.x0, dr = here.x1 - e.x, du = e.y - here.y0, dd = here.y1 - e.y, m = Math.min(dl, dr, du, dd);
      return m === dl ? Math.PI : m === dr ? 0 : m === du ? -Math.PI / 2 : Math.PI / 2;
    }
    if (e.dsT > 0) { e.dsT -= dt; const a = a0 + e.ds * e.da; if (!blk(a)) return a; e.dsT = 0; }
    const o = blk(a0);
    if (!o) { e.da = 0; return a0; }
    if (!e.ds) { const cx = (o.x0 + o.x1) / 2 - e.x, cy = (o.y0 + o.y1) / 2 - e.y, cr = Math.cos(a0) * cy - Math.sin(a0) * cx; e.ds = Math.abs(cr) < 4 ? (Math.random() < 0.5 ? 1 : -1) : (cr > 0 ? -1 : 1); }
    for (let pass = 0; pass < 2; pass++) {
      for (const off of [0.5, 0.9, 1.4, 1.9, 2.5]) if (!blk(a0 + e.ds * off)) { e.da = off; e.dsT = 0.7; return a0 + e.ds * off; }
      e.ds = -e.ds;
    }
    return null;
  }
  function roamStep(e, dt, sp, pauseMax) {
    if (!(e.tx >= 0)) roamPick(e);
    if (e.pause > 0) { e.pause -= dt; e.wx = undefined; return false; }
    const tg = e.vs && e.vs.length ? e.vs[0] : { x: e.tx, y: e.ty }, dx = tg.x - e.x, dy = tg.y - e.y, d = Math.hypot(dx, dy);
    if (d < 8) { if (e.vs && e.vs.length) e.vs.shift(); else { e.pause = Math.random() * pauseMax; roamPick(e); } return false; }
    if (Math.random() < dt * 0.04 && !onRoadway(e.x, e.y)) { roamPick(e); return false; }
    if (e.wx === undefined) { e.wx = e.x; e.wy = e.y; e.wt = 0; }
    e.wt += dt; // Wachhund: kommt er in 2 s kaum voran, sucht er sich ein neues Ziel
    if (e.wt >= 2) { const mv = Math.hypot(e.x - e.wx, e.y - e.wy); e.wx = e.x; e.wy = e.y; e.wt = 0; if (mv < sp * 0.4) { e.pause = 0.3; roamPick(e); return false; } }
    const a0 = Math.atan2(dy, dx), a = avoid(e, a0, dt, tg.x, tg.y, Math.min(Math.max(24, sp * 0.4), d));
    if (a === null) { e.pause = 0.5; roamPick(e); return false; }
    const rem = turnTo(e, a, dt, 5.5), sl = Math.min(sp * dt * Math.max(Math.abs(rem) > 0.9 ? 0.04 : 0.2, Math.cos(rem)), d); // v61: beim Umdrehen fast auf der Stelle (kein Bogen in die Hauswand)
    const nx = e.x + Math.cos(e.ang) * sl, ny = e.y + Math.sin(e.ang) * sl;
    if (obstAt(nx, ny) && !obstAt(e.x, e.y)) { e.dsT = 0; return false; }
    if (e.house !== undefined && !zoneOpenAt(nx, ny)) { e.pause = 0.4; roamPick(e); return false; } // v86
    e.x = nx; e.y = ny; return true;
  }
  [[300, 535], [1100, 713], [777, 1315], [2475, 900]].forEach((p, i) => { const c = { x: p[0], y: p[1], ang: 0, stun: 0, on: i === 0, seen: false, spMin: 28, spMax: 48, sp: 38, pause: 0, st: 'patrol', hunt: true, step: 0, tx: -1 }; cops.push(c); }); // Ziel suchen sie sich beim ersten Schritt
  // v97: in Stadtteilen ab Ruf 35 (Gangviertel, Nordviertel) laeuft jede Streife zu zweit. Der Partner folgt, sieht selbst und verfolgt laenger.
  const COP_PAIR_REP = 35, copMates = cops.map(() => ({ x: 0, y: 0, ang: 0, step: 0, on: false, st: 'patrol', al: 0, stun: 0, run: 0, mate: 1 }));
  const ZP = { x0: 1150, x1: 1382, y0: 912, y1: 1116 }; // Brunnenplatz (Tauben)
  let floaters = [], sus = 0, msgT = 0;
  const joy = { id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
  const keys = {};
  let aHeld = false, aEdge = false, bEdge = false, bHeld = false, packPr = 0;

  function newGame() {
    G = {
      money: 60, rep: 0, earned: 0, eod: 0, day: 1, sOff: 0, time: 9 * 60, won: false, bank: 0, buf: {}, club: { n: -1, s: 0 }, biz: {}, heat: 0, raid: null, heatE: 0,
      up: { pots: 0, grow: 0, yield: 0, rack: 0, dry: 0, shoes: 0, bag: 0, sack: 0, cart: 0, seed: 0, water: 0, compass: 0 }, repP: 0, prest: 0, prN: 0, lg: lgDef(), gang: null, pn: pnDef(), ui: uiDef(),
      pots: POTS.map(() => ({ s: 0, p: 0, w: 1 })),
      rack: { wet: 0, dry: 0 }, inv: { fresh: 0, dried: 0, bags: 0 },
      orders: [], nextOrder: 5, oid: 1, kr: krDef(), tut: '',
      cos: { owned: {}, orbit: 'none', orbit2: 'none', trail: 'none', pet: 'none', pet2: 'none' }, wpn: { owned: {}, eq: 'none' }, dec: { owned: {}, items: { keller: [], tabak: [], brau: [], ku: [], ko: [] } },
      lay: { keller: null, tabak: null, brau: null, ku: null, ko: null }, build: { door: { keller: false, tabak: false, brau: false }, floor: { keller: { c: 0, p: 0 }, tabak: { c: 0, p: 0 }, brau: { c: 0, p: 0 }, ku: { c: 0, p: 0 }, ko: { c: 0, p: 0 } }, stair: { keller: 0, ku: 0, ko: 0 } },
      staff: Object.fromEntries(Object.keys(ROLES).map(k => [k, 0])), tab: { dry: 0, bags: 0 },
      staffUp: Object.fromEntries(Object.keys(ROLES).map(k => [k, { speed: 0, skill: 0 }])), look: Object.assign({}, DEF_LOOK), wear: { owned: {} }, veh: { owned: {}, eq: 'none', bike: 'none', car: 'none', on: false, col: {}, tune: {} }, lager: { own: false, lv: 0, inv: [0, 0, 0, 0, 0, 0, 0, 0, 0] }, pr: prDef(), cas: { wd: '', sp: 0 }, stat: { del: 0, vip: 0, ko: 0, car: 0, bust: 0, gv: 0, gb: 0, pk: 0, wt: 0, bus: 0 }, fl: { u: mkFloor(), o: mkFloor() }, crate: 0, stash: {}, ach: { done: {} }, area: 'keller',
      t: { unlocked: false, pots: POTS2.map(() => ({ s: 0, p: 0, w: 1 })), rack: { wet: 0, dry: 0 }, tab: { dry: 0, bags: 0 }, inv: { fresh: 0, dried: 0, bags: 0 }, up: { pots: 0, grow: 0, yield: 0, rack: 0, dry: 0, water: 0, seed: 0 } },
      b: { unlocked: false, pots: POTS3.map(() => ({ s: 0, p: 0, w: 1 })), rack: { wet: 0, dry: 0 }, tab: { dry: 0, bags: 0 }, inv: { fresh: 0, dried: 0, bags: 0 }, up: { pots: 0, grow: 0, yield: 0, rack: 0, dry: 0, water: 0, seed: 0 } }
    };
    for (const k of DEC_KEYS) { applyLayout(AREAS[k], BASE[k]); rebuildNav(AREAS[k]); }
    syncGate();
  }
  const potsOpen = (ar = AREAS.keller) => ar.key === 'pr' ? (isOpen(ar) ? Math.min(PR_MAX, S(ar).n) : 0) : ar.isFloor ? (G.fl[ar.fk].own ? Math.min(ar.POTS.length, G.fl[ar.fk].n) : 0) : Math.min(ar.POTS.length, 2 + S(ar).up.pots);
  const seedCost = (ar = AREAS.keller) => { const l = S(ar).up.seed; return Math.round((ar.seedBase + ar.seedUp * Math.min(l, 6) + ar.seedUp * 0.5 * Math.max(0, l - 6)) * (1 + Math.min(G.rep, 100) / 60) * krSeed()); };
  // v40: Ruf wirkt oberhalb 40 nur halb auf die Preise, Saatgut wird mit dem Ruf teurer, Ziele wachsen mit
  const repEff = r => r <= 40 ? r : 40 + (r - 40) * 0.5;
  const GOALS = [500000, 2000000, 10000000, 50000000];
  const seedMult = l => 1 + 0.08 * Math.min(l, 6) + 0.04 * Math.max(0, l - 6);
  const growTime = (ar = AREAS.keller) => { const l = S(ar).up.grow; return ar.growBase * Math.pow(0.88, Math.min(l, 5)) * Math.pow(0.95, Math.max(0, l - 5)) / krGrow(); };
  const harvestYield = (ar = AREAS.keller) => { const l = S(ar).up.yield; return ar.yieldBase + Math.min(l, 6) + Math.floor(Math.max(0, l - 6) / 2); };
  const rackCap = (ar = AREAS.keller) => ar.rackBase + ar.rackUp * S(ar).up.rack;
  const dryRate = (ar = AREAS.keller) => { const u = S(ar).up; return ar.dryBase * (1 + 0.25 * Math.min(u.rack, 4) + 0.05 * Math.max(0, u.rack - 4)) * (1 + 0.12 * (u.dry || 0)); };
  const totalBags = () => G.inv.bags + G.t.inv.bags + G.b.inv.bags + (G.pr ? G.pr.inv.bags : 0); // v91: Apotheken-Dosen zaehlen mit
  const unitRoom = ar => Math.max(0, bagCap() - totalBags()); // v89: Premium-Dosen haben eigenen Platz
  const carryTotal = () => G.inv.fresh + G.inv.dried + G.inv.bags + G.t.inv.fresh + G.t.inv.dried + G.t.inv.bags + G.b.inv.fresh + G.b.inv.dried + G.b.inv.bags;
  // Vorteile aller angelegten Begleiter (max. 2) zusammen
  function petPerk() {
    const r = {};
    for (const id of activePets()) {
      const p = PERKS[id]; if (!p) continue;
      if (p.bag) r.bag = (r.bag || 0) + p.bag;
      for (const k of ['sus', 'fine', 'sight', 'speed', 'tip']) if (p[k]) r[k] = (r[k] || 1) * p[k];
    }
    return r;
  }
  const bagCap = () => (gymOn('kraft') ? 10 : 0) + 8 + 4 * Math.min(G.up.bag, 4) + 2 * clamp(G.up.bag - 4, 0, 8) + Math.max(0, G.up.bag - 12) + 3 * G.up.sack + 4 * G.up.cart + (G.t.unlocked ? 10 : 0) + (G.b.unlocked ? 8 : 0) + (petPerk().bag || 0) + carCap();
  const SPEED_CAP = 1.5; // Schuhe + Begleiter zusammen nie schneller als +50 %
  const walkSpeed = () => 135 * Math.min(SPEED_CAP, (1 + 0.08 * Math.min(G.up.shoes, 4) + 0.03 * Math.max(0, G.up.shoes - 4)) * (petPerk().speed || 1)) * (gymOn('run') ? 1.12 : 1); // v94: Ausdauertraining
  const copRange = () => 145 * (1 + Math.min(G.rep, 40) * 0.002) * (petPerk().sight || 1) * evSightK(); // v53: sieht weniger weit
  const COP_CONE = 0.52;
  const unitCap = () => 24;

  const SAVE_VER = 33, SAVE_KEY = 'kellergruen.save';
  // Sicherungskopie: vor jedem Ueberschreiben einer aelteren Version bleibt der alte Stand erhalten
  function backupSave() {
    const raw = store.get(SAVE_KEY, null);
    if (raw) store.set(SAVE_KEY + '.bak', raw);
  }
  let saveBlocked = false;
  function saveObj() { return { ver: SAVE_VER, sts: Date.now(), flag: G.flag || undefined, cmdU: G.cmdU || cmdOk ? 1 : undefined, money: G.money, rep: G.rep, earned: G.earned, eod: G.eod, day: G.day, sOff: G.sOff || 0, time: G.time, won: G.won, up: G.up, pots: G.pots, rack: G.rack, inv: G.inv, cos: G.cos, wpn: G.wpn, staff: G.staff, tab: G.tab, staffUp: G.staffUp, look: G.look, wear: G.wear, stat: G.stat, ach: G.ach, tut: G.tut || '', kr: G.kr, cal: G.cal || undefined, gv: G.gv, gvOk: G.gvOk ? 1 : 0, veh: { owned: G.veh.owned, eq: G.veh.eq, bike: G.veh.bike || 'none', car: G.veh.car || 'none', col: G.veh.col || {}, tune: G.veh.tune || {} }, bw: 1, lager: G.lager, pr: G.pr, cas: G.cas, bank: G.bank || 0, bk: G.bk || 0, busCd: G.busCd || 0, biz: G.biz || {}, heat: G.heat || 0, raid: G.raid || null, heatE: G.heatE || 0, buf: G.buf || {}, club: G.club || { n: -1, s: 0 }, t: G.t, b: G.b, dec: G.dec, lay: G.lay, build: G.build, repP: G.repP, prest: G.prest || 0, prN: G.prN || 0, lg: G.lg, gang: G.gang || undefined, pn: G.pn, ui: G.ui, binP: G.binP && G.binP.length ? G.binP : undefined, fl: G.fl, crate: G.crate, stash: G.stash }; }

