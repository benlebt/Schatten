const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('function _sperrstundeNachZeitwechsel(');
const end = html.indexOf('\nfunction advanceGameTime(', start);
assert(start >= 0 && end > start, 'closing-time relocation helper missing');

const context = {
  engineCurrentLocation: { name: 'Eckkneipe Zum Goldenen Anker', sektor: 'Ost (Mitte)' },
  caseProgress: {},
  gameDay: 2,
  sceneCounter: 7,
  pendingCategoryMessages: [],
  _istAnkerOrt: (loc) => /anker/.test(String(loc && loc.name || '').toLowerCase()),
  normForMatch: (value) => String(value || '').toLowerCase().trim(),
  getCaseLocations: () => [
    {
      name: 'Eckkneipe Zum Goldenen Anker',
      sektor: 'Ost (Mitte)',
      oeffnungszeit: ['abend', 'nacht']
    },
    {
      name: 'S-Bahnhof Alexanderplatz',
      sektor: 'Ost (Mitte)'
    }
  ],
  istOrtGeoeffnet: () => false,
  _aktTageszeitName: () => 'morgen',
  diag: () => {},
  saveGameState: () => {}
};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

assert.strictEqual(context._sperrstundeNachZeitwechsel(), true, 'closed Anker must trigger closing time');
assert.strictEqual(context.engineCurrentLocation.name, 'S-Bahnhof Alexanderplatz', 'Karl must be moved to a real nearby outdoor location');
assert.strictEqual(context.caseProgress._letzteSperrstunde.von, 'Eckkneipe Zum Goldenen Anker', 'closing-time origin must be recorded');
assert.strictEqual(context.caseProgress._letzteSperrstunde.tageszeit, 'morgen', 'closing-time state must record morning');
assert(context.pendingCategoryMessages.some((message) => /ALLE hinausgeworfen/.test(message)), 'next prose must be told that every guest left');
assert(html.includes('_sperrstundeNachZeitwechsel();'), 'time advance must enforce closing time after a phase change');

console.log('ANKER_CLOSING_TIME_OK');
