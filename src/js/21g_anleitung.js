  // =====================================================================================================
  // v190: Spielanleitung im Handy (Einstellungen → Anleitung). Kurze Abschnitte zum Aufklappen, Zahlen kommen
  // direkt aus dem Spiel (Ruf-Stufen), damit die Anleitung nicht veraltet. Alles rein fiktiv.
  // =====================================================================================================
  let anlOpen = 'start';
  function anlTexts() {
    const U = (AREAS.keller.lbl && AREAS.keller.lbl.unit) || 'Beutel';
    return [
      ['start', '🌿 So geht es los', 'Finger auf dem Bildschirm ziehen lässt dich laufen. A ist die Aktion an dem Ort, an dem du stehst, unten im Bild steht immer, was A gerade tut. B nimmt Ware heraus. Gespeichert wird automatisch.<br>Oben auf der Handy-Startseite stehen deine ersten Schritte mit Belohnung.'],
      ['pflanzen', '🌱 Pflanzen, gießen, ernten', 'Am Topf öffnet A ein Fenster. <b>Pflanzen:</b> dreimal auf die Erde tippen gräbt ein Loch, dann die Samentüte antippen, dann die fünf Erdhäufchen antippen, bis das Loch zu ist. <b>Gießen:</b> Kanne über den Topf ziehen und gedrückt halten. <b>Ernten:</b> die Knospen antippen. Das 3D-Fenster lässt sich unter Einstellungen → Anzeige ausschalten, dann geht alles per A-Knopf.'],
      ['qual', '⭐ Qualität und Sorten', 'Selbst im Fenster gepflanzt startet die Pflanze mit 45 % Qualität, einmal rechtzeitig selbst gegossen gibt 30 % dazu. Steht sie trocken, sinkt die Qualität. Beim Ernten im Fenster leuchten entsprechend viele Knospen golden und bringen bis zu 40 % mehr Ertrag.<br><b>Sorten</b> wählst du an der Samentüte: ' + SORTS.map(s => s.nm + (s.rep ? ' (ab Ruf ' + s.rep + ')' : '') + ': ' + s.ds).join('; ') + '.'],
      ['packen', '📦 Trocknen und packen', 'Frische Ernte am Trockengestell aufhängen (Korb antippen), trockene wieder abnehmen. Am Packtisch die Knospen in den offenen ' + U + ' legen, ihn antippen zum Verschließen und in die Kiste ziehen. Schnell hintereinander gibt eine Combo.'],
      ['kunden', '🏠 Kunden und Kurier', 'Kunden zeigen über ihrem Haus, wie viel sie wollen, der Ring zeigt die Zeit. Mit genug Ware hingehen und A drücken. Spezialkunden (★) gibt es ab Ruf ' + VIP_REP + ', sie zahlen besonders gut. Mit einem Auto findest du unter Aufträge → Kurier Eilpakete: viel Restzeit bringt Gold.'],
      ['ausbau', '🛒 Ausbau, Helfer, Häuser', 'Unter Geschäft → Ausbau kaufst du mehr Töpfe, Lampen, Dünger, Wasserspeicher, Gestelle und Samen. Was du kaufst, siehst du auch in den 3D-Fenstern. Helfer arbeiten für dich. Die Tabakscheune gibt es ab Ruf ' + AREAS.tabak.needRep + ', das Chemielabor ab Ruf ' + AREAS.brau.needRep + ', den Mietraum ab Ruf ' + LAGER_REP + '.'],
      ['ruf', '🎖️ Ruf, Ziele, Abzeichen', 'Lieferungen und Aufgaben bringen Ruf. Mehr Ruf heißt mehr Kunden und mehr Freischaltungen. Jeden Tag gibt es drei Tagesaufgaben, jede Woche Wochenziele (Karriere). Jedes erledigte Ziel ist ein Abzeichen, eins davon steht vor deinem Namen (Karriere → Ziele). Um Mitternacht zeigt der Feierabend deinen Tag.'],
      ['polizei', '🚓 Polizei und Gefahr', 'Leuchtet der Bildschirmrand blau und rot, hat dich die Polizei im Blick. Je schneller das Licht blinkt, desto knapper wird es, dann ist die Ware weg. Droht eine Razzia, drück den roten Notknopf im Keller. Das Konto bei der Bank (ab Ruf ' + BANK_REP + ') und der Mietraum sind sicher. Der Hehler im Gangviertel kauft ab Ruf ' + GV_REP + ' große Mengen.'],
      ['mp', '🤝 Zusammen spielen', 'Alle im selben Raum sehen sich in der Stadt und teilen sich die Kunden. Ab zwei Spielern gibt es Team-Aufträge (gemeinsam an einen Ort liefern) und Laternen- oder Ballonjagden. Den Stand findest du unter Aufträge → Team. Eine eigene Gang gründest du ab Ruf ' + PG_REP + '.'],
      ['kamera', '📸 Kamera und Fotos', 'Die Kamera-App blendet alle Anzeigen aus. Oben gibt es Filter, Zoom, freie Kamera, Kino-Balken, Logo, Foto und Video (10, 15 oder 30 Sekunden mit Ton). Danach kannst du direkt teilen oder speichern. Für TikTok das Handy hochkant halten.'],
      ['technik', '🔋 Einstellungen und Sicherungen', 'Ruckelt es, hilft der Sparmodus unter Einstellungen → Anzeige. Musik und Effekte stellst du unter Ton ein, auch ob jedes Viertel eigene Musik hat. Sicherungen (auch vor jedem Update) findest du unter Profil → Sicherungen. Hängt etwas, erscheint unten ein Knopf zum Neuladen.']
    ];
  }
  function renderAnleitung(b) {
    krGrp(b, 'Anleitung'); uiInfo(b, 'Tippe einen Abschnitt an, um ihn aufzuklappen.');
    for (const [id, t, x] of anlTexts()) { const c = document.createElement('div'); c.className = 'card look anl'; const open = anlOpen === id;
      c.innerHTML = '<div class="nm">' + t + ' <span style="float:right;opacity:.6">' + (open ? '▾' : '▸') + '</span></div>' + (open ? '<div class="ds" style="margin-top:6px;line-height:1.45">' + x + '</div>' : '');
      c.style.cursor = 'pointer'; c.addEventListener('click', () => { anlOpen = open ? '' : id; renderPhone(); }); b.appendChild(c); }
    const bt = uiEl('button', 'buy alt', 'Einführung noch einmal ansehen'); bt.style.marginTop = '8px'; bt.addEventListener('click', () => { try { closePhone(); tutStart(0); } catch (e) {} }); b.appendChild(bt);
  }
