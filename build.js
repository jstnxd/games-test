// Baut kellergruen.html aus den Teilen in src/ zusammen (Reihenfolge steht in src/teile.txt).
// Aufruf:  node build.js          -> schreibt kellergruen.html
//          node build.js --check  -> prüft nur, ob kellergruen.html zu den Teilen passt
// Die Teile werden 1:1 hintereinandergehängt, es wird nichts umgeschrieben.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'src');
const list = fs.readFileSync(path.join(dir, 'teile.txt'), 'utf8').split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'));
const out = Buffer.concat(list.map(f => fs.readFileSync(path.join(dir, f))));
const target = path.join(__dirname, 'kellergruen.html');
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(target) ? fs.readFileSync(target) : Buffer.alloc(0);
  if (cur.equals(out)) { console.log('OK: kellergruen.html passt zu src/ (' + list.length + ' Teile)'); process.exit(0); }
  console.log('ABWEICHUNG: kellergruen.html passt nicht zu src/. Bitte "node build.js" ausführen.'); process.exit(1);
}
fs.writeFileSync(target, out);
const ver = (out.toString('utf8').match(/GAME_VER = (\d+)/) || [])[1];
console.log('kellergruen.html gebaut: ' + list.length + ' Teile, ' + out.length + ' Bytes' + (ver ? ', Version ' + ver : ''));
