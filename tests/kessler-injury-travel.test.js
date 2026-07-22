const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function sourceOf(name) {
  const start = html.indexOf('function ' + name + '(');
  assert(start >= 0, 'missing function ' + name);
  const brace = html.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error('unterminated function ' + name);
}

const events = { choices: [], fx: [], toasts: [], diag: [] };
const context = {
  console,
  window: {},
  caseProgress: { encounterState: null, alkohol: 0, muedigkeit: 0, reiseLog: [] },
  karlInStasiCustody: false,
  chooseOptionInFlight: false,
  engineCurrentLocation: { name: 'Opel Olympia', sektor: 'West' },
  sceneCounter: 16,
  _professionelleBehandlungFaellig: () => true,
  _konfrontationAktiv: () => false,
  istOrtGeoeffnet: () => true,
  schliesseReiseMenue: () => {},
  _mitnehmbareNpcsAmOrt: () => [],
  _krauseWeltfortschrittBeiReise: () => '',
  _aktTageszeitName: () => 'abend',
  _reiseOrtswechselAufraeumen: () => {},
  maybeResolveThreatSpawn: () => {},
  fxTravel: name => events.fx.push(name),
  saveGameState: () => {},
  renderImRaumAnzeige: () => {},
  chooseOption: option => events.choices.push(option),
  showProgressToast: (...args) => events.toasts.push(args),
  diag: (...args) => events.diag.push(args),
};
vm.createContext(context);
vm.runInContext(sourceOf('reiseZuOrt'), context);

context.reiseZuOrt({ name: 'Cafe Wien', sektor: 'West', heilort: false });
assert.strictEqual(context.engineCurrentLocation.name, 'Opel Olympia',
  'mandatory treatment must reject non-healing travel before mutating the engine location');
assert.strictEqual(events.fx.length, 0, 'a rejected destination must not start the travel animation');
assert.strictEqual(events.choices.length, 0, 'a rejected destination must not start a scene request');

context.reiseZuOrt({ name: 'Doc Wagners Praxis', sektor: 'West', heilort: true });
assert.strictEqual(context.engineCurrentLocation.name, 'Doc Wagners Praxis',
  'the required Doc Wagner trip must update the engine location');
assert.deepStrictEqual(events.fx, ['Doc Wagners Praxis'],
  'the accepted treatment trip must retain its travel animation');
assert.strictEqual(events.choices.length, 1, 'the accepted treatment trip must start exactly one scene request');
assert.strictEqual(events.choices[0]._istHeilortReise, true,
  'the travel option must carry an explicit healing-destination bypass marker');

context.reiseZuOrt({ name: 'Charité', sektor: 'Ost', heilort: true });
assert.strictEqual(context.engineCurrentLocation.name, 'Charité',
  'the alternative required trip to Charité must also reach its destination');
assert.deepStrictEqual(events.fx, ['Doc Wagners Praxis', 'Charité'],
  'both global healing destinations must retain their travel animation');
assert.strictEqual(events.choices.length, 2,
  'Doc Wagner and Charité must each start a scene request when selected');
assert.strictEqual(events.choices[1]._istHeilortReise, true,
  'the Charité travel option must carry the same healing-destination bypass marker');

const gateContext = {
  verfassung: 2,
  caseProgress: { encounterState: null },
  karlInStasiCustody: false,
  _kritischeVerletzungsDauer: () => 3,
  _konfrontationAktiv: () => false,
};
vm.createContext(gateContext);
vm.runInContext(sourceOf('_kritischeVerletzungBlockiert'), gateContext);
assert.strictEqual(gateContext._kritischeVerletzungBlockiert(events.choices[0]), false,
  'a marked healing trip must pass the critical-injury gate and reach the API scene pipeline');
assert.strictEqual(gateContext._kritischeVerletzungBlockiert(events.choices[1]), false,
  'the marked Charité trip must pass the same critical-injury gate');
assert.strictEqual(gateContext._kritischeVerletzungBlockiert({ kategorie: 'ERKUNDEN', _istReise: true }), true,
  'ordinary exploration travel must remain blocked while professional treatment is mandatory');

console.log('KESSLER_INJURY_TRAVEL_OK');
