// Baut kellergruen.html aus den Teilen in src/ zusammen (Reihenfolge steht in src/teile.txt).
// Aufruf:  node build.js          -> schreibt kellergruen.html (Hauptskript und CSS verkleinert, wenn esbuild da ist)
//          node build.js --plain  -> schreibt kellergruen.html unverkleinert (zum Fehlersuchen)
//          node build.js --check  -> prüft nur, ob kellergruen.html zu den Teilen passt
// v179: Die Teile werden hintereinandergehängt. Danach werden das große Hauptskript (das letzte <script>) und das CSS
// verkleinert: Leerzeichen, Zeilenumbrüche und Kommentare fallen weg, Namen bleiben lesbar (gut fürs Fehlerprotokoll).
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'src');
const list = fs.readFileSync(path.join(dir, 'teile.txt'), 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
const raw = Buffer.concat(list.map(f => fs.readFileSync(path.join(dir, f)))).toString('utf8');
const plain = process.argv.includes('--plain');
function findEsbuild() { for (const p of ['esbuild', '/opt/npm-tools/node_modules/esbuild']) { try { return require(p); } catch (e) {} } return null; }
function shrink(html) {
  const es = findEsbuild(); if (!es) { console.log('Hinweis: esbuild fehlt, baue unverkleinert'); return html; }
  const a = html.lastIndexOf('<script>'), b = html.indexOf('</script>', a); if (a < 0 || b < 0) return html;
  const js = es.transformSync(html.slice(a + 8, b), { minifyWhitespace: true, minifySyntax: true, target: 'es2020', charset: 'utf8', legalComments: 'none' }).code.replace(/<\/script/gi, '<\\/script');
  let out = html.slice(0, a + 8) + js + html.slice(b);
  const c = out.indexOf('<style>'), d = out.indexOf('</style>', c);
  if (c >= 0 && d > c) { try { const css = es.transformSync(out.slice(c + 7, d), { loader: 'css', minify: true, charset: 'utf8', legalComments: 'none' }).code; out = out.slice(0, c + 7) + css + out.slice(d); } catch (e) { console.log('Hinweis: CSS nicht verkleinert (' + e.message.split('\n')[0] + ')'); } }
  return out;
}
const out = Buffer.from(plain ? raw : shrink(raw), 'utf8');
const target = path.join(__dirname, 'kellergruen.html');
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(target) ? fs.readFileSync(target) : Buffer.alloc(0);
  if (cur.equals(out) || cur.equals(Buffer.from(raw, 'utf8'))) { console.log('OK: kellergruen.html passt zu src/ (' + list.length + ' Teile)'); process.exit(0); }
  console.log('ABWEICHUNG: kellergruen.html passt nicht zu src/. Bitte "node build.js" ausführen.'); process.exit(1);
}
fs.writeFileSync(target, out);
const ver = (raw.match(/GAME_VER = (\d+)/) || [])[1];
console.log('kellergruen.html gebaut: ' + list.length + ' Teile, ' + out.length + ' Bytes' + (plain ? ' (unverkleinert)' : ' (verkleinert, vorher ' + Buffer.byteLength(raw) + ')') + (ver ? ', Version ' + ver : ''));
