const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const straussStart = html.indexOf("klient: 'Karl Mauer (Eigen-Auftrag - Schuld am abgebrochenen Strauss-Fall)'");
const straussEnd = html.indexOf('anchorNpcs:', straussStart);
assert(straussStart >= 0 && straussEnd > straussStart, 'Strauss setup slice missing');
const strauss = html.slice(straussStart, straussEnd);

assert(/name: 'Friedhof Ploetzensee'[\s\S]*?npcs: \[\{ id: 'frau_schleier', immer: true, bisStage: 1 \}, \{ id: 'pastor_vogel', immer: true, bisStage: 1 \}\]/.test(strauss),
  'the funeral opening must keep the veiled woman and Pastor Vogel physically actionable');
assert(/id: 'schleier_kranzler_spur'[\s\S]*?npc: 'frau_schleier', quelle: 'person', actions: \['ANSPRECHEN','BEFRAGEN','UEBERZEUGEN'\][\s\S]*?stage: 2/.test(strauss),
  'the veiled woman must provide a conversational lead away from the funeral');
assert(strauss.includes('Cafe Kranzler'),
  'the opening lead must point to a configured follow-up location');
assert(/id: 'schleier_aussage'[\s\S]*?abStage: 2/.test(strauss),
  'the full testimony at Cafe Kranzler must remain gated behind the opening lead');

console.log('strauss-opening-flow: ok');
