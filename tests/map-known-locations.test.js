const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sourceOf(name) {
  const start = html.indexOf(`function ${name}(`);
  assert(start >= 0, `function ${name} missing`);
  const body = html.indexOf('{', start);
  let depth = 0;
  for (let i = body; i < html.length; i += 1) {
    if (html[i] === '{') depth += 1;
    else if (html[i] === '}') {
      depth -= 1;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error(`unterminated function ${name}`);
}

const norm = (value) => String(value || '').toLowerCase().trim();
const context = {
  unlockedLocations: ['hinterhof sybelstrasse'],
  engineCurrentLocation: { name: 'Imbiss Bei Trude' },
  normForMatch: norm,
  istReisbarerOrt: (loc) => loc && loc.reisbar !== false,
  _hauptuiOffeneFaeden: () => [
    { frage: 'Wer kennt Roberts Wege?', ort: 'Cafe Wien' },
    { frage: 'Stimmen die Überstunden?', ort: 'Spedition Schmidt Moabit' }
  ],
  diag: () => {}
};
vm.createContext(context);
vm.runInContext(sourceOf('_kartenBekannteOrteSynchronisieren'), context);

const locations = [
  { name: 'Cafe Wien', startBekannt: true, oeffnungszeit: ['vormittag', 'mittag'] },
  { name: 'Spedition Schmidt Moabit', startBekannt: false },
  { name: 'Geheimes Lager', startBekannt: false },
  { name: 'Imbiss Bei Trude', startBekannt: true }
];
context._kartenBekannteOrteSynchronisieren(locations);
assert(context.unlockedLocations.includes('cafe wien'), 'a start-known closed location must be restored into old save visibility');
assert(context.unlockedLocations.includes('spedition schmidt moabit'), 'a location named by an open thread must be visible');
assert(context.unlockedLocations.includes('imbiss bei trude'), 'the current location must remain visible');
assert(!context.unlockedLocations.includes('geheimes lager'), 'an undiscovered secret location must stay hidden');

Object.assign(context, {
  mapPosFuer: () => ({ x: 74, y: 134, sek: 'UK' }),
  offeneIndizienAmOrt: () => 1,
  offeneIndizienAmOrtNachErreichbarkeit: () => ({ jetzt: 0, spaeter: 1, hattIndizien: true }),
  istOrtGeoeffnet: () => false,
  _physischesFallzielStatus: () => null
});
vm.runInContext(sourceOf('mapSammleOrte'), context);
const closedEntries = Array.from(context.mapSammleOrte([locations[0]], norm('Imbiss Bei Trude')));
assert.strictEqual(closedEntries.length, 1, 'closed known locations must remain map entries');
assert.strictEqual(closedEntries[0].geoeffnet, false, 'closed location must retain its opening-state truth');
assert.strictEqual(closedEntries[0].gesperrt, true, 'closed location must be visible but not travel-enabled');

const travelSource = sourceOf('oeffneReiseMenue');
assert(travelSource.indexOf('_kartenBekannteOrteSynchronisieren(locs)') < travelSource.indexOf('var ziele = locs.filter'),
  'known-location reconciliation must run before map destinations are filtered');

console.log('MAP_KNOWN_LOCATIONS_OK');
