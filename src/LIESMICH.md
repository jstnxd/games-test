# Kellergrün – Quelltext in Teilen

Das Spiel selbst ist weiterhin **eine Datei: `kellergruen.html`** im Hauptordner. Nur die wird von GitHub Pages ausgeliefert.

In `src/` liegt derselbe Code, nur in übersichtliche Teile zerlegt (Aussehen, Welt, Handy, Gangs, Zeichnen …).
`build.js` hängt die Teile in der Reihenfolge aus `src/teile.txt` 1:1 hintereinander und schreibt daraus `kellergruen.html`.

```
node build.js          # kellergruen.html aus den Teilen bauen
node build.js --check  # prüfen, ob kellergruen.html und src/ zusammenpassen
```

Wichtig: Wird `kellergruen.html` von Hand (z. B. über „Add files via upload“) ersetzt, passen die Teile nicht mehr dazu.
Dann einfach Bescheid geben, die Teile werden aus der neuen Datei wieder erzeugt.
