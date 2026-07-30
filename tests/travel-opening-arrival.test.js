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

const context = {
  TIMES_OF_DAY: ['MORGEN', 'VORMITTAG', 'MITTAG', 'NACHMITTAG', 'ABEND', 'NACHT'],
  gameTimeIdx: 2,
  engineCurrentLocation: { name: 'Tempelhofer Feld' },
  normForMatch: (value) => String(value || '').toLowerCase().trim(),
  istOrtGeoeffnet: () => false,
  _reiseIstLokalerWeg: () => false
};
vm.createContext(context);
vm.runInContext(sourceOf('_reiseOeffnetBeiAnkunft'), context);

const laterne = { name: 'Rote Laterne', oeffnungszeit: ['NACHMITTAG', 'ABEND', 'NACHT'] };
assert.strictEqual(context._reiseOeffnetBeiAnkunft(laterne, 'Tempelhofer Feld'), true,
  'a real drive may target a place opening in the immediately following time block');

context._reiseIstLokalerWeg = () => true;
assert.strictEqual(context._reiseOeffnetBeiAnkunft(laterne, 'Nachbarraum'), false,
  'a local walk must not bypass opening hours with an invisible time jump');

context._reiseIstLokalerWeg = () => false;
const morgenOrt = { name: 'Fruehbude', oeffnungszeit: ['MORGEN'] };
assert.strictEqual(context._reiseOeffnetBeiAnkunft(morgenOrt, 'Tempelhofer Feld'), false,
  'places opening later than the immediately next block must stay locked');

const travelSource = sourceOf('reiseZuOrt');
assert(travelSource.includes('!istOrtGeoeffnet(loc) && !_oeffnetBeiAnkunft'),
  'the travel gate must admit exactly the arrival-opening exception');
assert(travelSource.includes('timeAdvanceTokens = Math.max(timeAdvanceTokens, 1)'),
  'arrival-opening travel must mechanically guarantee the next time block');
assert(travelSource.includes('_oeffnetBeiAnkunft: _oeffnetBeiAnkunft'),
  'the travel action must preserve the opening-on-arrival reason');

console.log('TRAVEL_OPENING_ARRIVAL_OK');
