const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(
  html.includes("buildSleepButton(_schlafLabel, _schlafMarkerKurz, false, sleepBlockedBySpannung)"),
  'the single visible sleep button must never request the retired automatic ride home'
);
assert(
  html.includes('if (!pendingHeimfahrt) _schlafVorOrtUrsprungSichern(option);'),
  'sleep at the current place must freeze the engine origin on the clicked option'
);
assert(
  html.includes('_schlafVorOrtWahrheitSichern(scene, optionForRollback);'),
  'the frozen sleep origin must be enforced before the response location is classified'
);
assert(
  html.includes("option.id === 'UEBERMUEDUNG_FAHRSTopp'") &&
    html.includes('pendingSleepChoice = true;') &&
    !html.includes('Nickerchen tagsueber) - KEIN Tagwechsel'),
  'daytime exhaustion sleep must use the same roughly eight-hour engine time path'
);
assert(
  html.includes('rund acht Stunden spaeter wieder auf; Tageszeit und Datum muessen dem Engine-Zeitstand folgen.') &&
    !html.includes("bei ' + _strandMuedName + ' am naechsten Morgen auf."),
  'the exhaustion travel prompt must not promise a next morning when the wake phase can be evening'
);

const start = html.indexOf('function _schlafVorOrtUrsprungSichern');
const end = html.indexOf('function _schlafHeimfahrtOrtSetzen', start);
assert(start > -1 && end > start, 'sleep-location truth helpers missing');

const norm = (value) => String(value || '').toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[^\w]+/g, ' ').trim();

const context = {
  karlInStasiCustody: false,
  engineCurrentLocation: {
    name: 'Manfred Vogts Wohnung Prenzlauer Berg',
    sektor: 'Ost (Prenzlauer Berg)'
  },
  currentOrt: '',
  currentOrtType: 'NEUTRAL',
  gameTimeIdx: 0,
  TIMES_OF_DAY: ['MORGEN', 'VORMITTAG', 'MITTAG', 'NACHMITTAG', 'ABEND', 'NACHT'],
  normForMatch: norm,
  _worldTruthOrtGleich(a, b) {
    return norm(a) === norm(b);
  },
  classifyOrtDetailed() {
    return { type: 'NEUTRAL' };
  },
  diag() {}
};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

const option = { id: 'SCHLAFEN', _kategorie: 'SCHLAFEN', _heimfahrt: false };
assert.strictEqual(context._schlafVorOrtUrsprungSichern(option), true);
assert.strictEqual(option._sleepOrigin.name, 'Manfred Vogts Wohnung Prenzlauer Berg');

const drifted = {
  ort: 'Karl Mauers Büro',
  szene: 'Du wachst in deinem eigenen Bett am Hackeschen Markt auf.',
  personenImRaum: []
};
assert.strictEqual(context._schlafVorOrtWahrheitSichern(drifted, option), true);
assert.strictEqual(drifted.ort, 'Manfred Vogts Wohnung Prenzlauer Berg');
assert.strictEqual(context.engineCurrentLocation.name, 'Manfred Vogts Wohnung Prenzlauer Berg');
assert(!/hackescher markt|eigenen bett/i.test(drifted.szene), 'repaired prose must not retain the invented home teleport');
assert(/noch immer am selben ort/i.test(drifted.szene), 'repaired prose must state current-place continuity naturally');
assert(/morgen/i.test(drifted.szene), 'repair must use the actual wake phase');
assert(/Müdigkeit/.test(drifted.szene) && /schläfst für/.test(drifted.szene),
  'sleep repair prose must use correct German umlauts');

const coherent = {
  ort: 'Manfred Vogts Wohnung Prenzlauer Berg',
  szene: 'Du schläfst auf dem Sofa ein und wachst dort am Morgen wieder auf.'
};
assert.strictEqual(context._schlafVorOrtWahrheitSichern(coherent, option), false);
assert(/Sofa/.test(coherent.szene), 'coherent model prose should remain untouched');

console.log('sleep-location-truth.test.js: all checks passed');
