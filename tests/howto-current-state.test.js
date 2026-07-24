const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const start = html.indexOf('<div id="howto"');
const end = html.indexOf('<!-- v6.77: Setup-Auswahl-Bildschirm -->', start);

assert(start >= 0 && end > start, 'how-to section must be present');
const howto = html.slice(start, end);

[
  'Hauptoberfläche',
  'Woran / mit wem?',
  'Ausführen: Handlung',
  'Fundstücke am Ort',
  'Offene Fäden und Reisen',
  'Eigene Ideen, Inventar und Begleiter',
  'zunächst eingeklappt',
  'Vf 2 oder weniger',
  '55 Szenen',
  'Speichern und Fortsetzen',
  'Verhörrunde, Druck und begrenzte Kooperation',
  'Fall lösen, Auftraggeber informieren'
].forEach((copy) => assert(howto.includes(copy), `current how-to copy missing: ${copy}`));

[
  'Drei Wege stehen dir offen',
  'Der Aktions-Baukasten',
  'Größenordnung etwa 50 Szenen',
  'keinen endgültigen "Game Over"-Bildschirm',
  'Lenz</strong>',
  'Wirtin Rosa'
].forEach((stale) => assert(!howto.includes(stale), `stale how-to copy returned: ${stale}`));

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1471 +ReuterContextWindow-Staging'"), 'release version missing');

console.log('howto-current-state: ok');
