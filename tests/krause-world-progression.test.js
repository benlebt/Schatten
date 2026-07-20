const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sourceOf(name) {
  const marker = `function ${name}(`;
  const start = html.indexOf(marker);
  assert(start >= 0, `${name} missing`);
  const bodyStart = html.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error(`${name} is incomplete`);
}

assert(html.includes('MARLENE-NACHVERSORGUNG'), 'Marlene follow-up prose guard missing');
assert(/keine zweite ausfuehrliche Behandlung/i.test(html), 'repeat-treatment guard missing');
assert(html.includes('Er ist nicht Karls Schutzpolizist'), 'Vollmer observation motive missing');
assert(html.includes('Erika ist eine diskrete Kundin, Vermittlerin oder Geschaeftsbekannte Friedas'), 'Erika location motive missing');
assert(html.includes('hat Jochen oder das Etui nicht rueckwirkend "vorhin" gesehen'), 'Erika retroactive-witness guard missing');

const healContext = {
  caseProgress: {},
  engineCurrentLocation: { name: 'Charite' },
  gameDay: 2,
  sceneCounter: 14,
  normForMatch: value => String(value || '').toLowerCase()
};
vm.createContext(healContext);
vm.runInContext(sourceOf('_hauptuiHeilungsfolgeMarkieren'), healContext);
assert.strictEqual(healContext._hauptuiHeilungsfolgeMarkieren('Marlene Wagner'), false, 'first treatment must not be a follow-up');
healContext.sceneCounter = 15;
assert.strictEqual(healContext._hauptuiHeilungsfolgeMarkieren('Marlene Wagner'), true, 'repeat treatment in same visit must be a follow-up');
healContext.engineCurrentLocation.name = 'Doc Wagners Praxis';
assert.strictEqual(healContext._hauptuiHeilungsfolgeMarkieren('Marlene Wagner'), false, 'different location must start a new treatment visit');

let jochenState = { status: 'gefesselt' };
let kalleState = { status: 'frei' };
const worldContext = {
  caseProgress: {},
  caseSetup: { klient: 'Theodor Krause' },
  gameDay: 2,
  sceneCounter: 17,
  normForMatch: value => String(value || '').toLowerCase(),
  _npcZustandGet: name => name === 'Jochen' ? jochenState : kalleState,
  _npcZustandSet: (name, patch) => {
    if (name === 'Jochen') jochenState = { ...jochenState, ...patch };
    if (name === 'Kalle') kalleState = { ...kalleState, ...patch };
  },
  diag: () => {}
};
vm.createContext(worldContext);
vm.runInContext(sourceOf('_krauseWeltfortschrittBeiReise'), worldContext);
assert.strictEqual(worldContext._krauseWeltfortschrittBeiReise('Tante Friedas Hehlerei', 'Charite'), '', 'departure should only update world state');
assert.strictEqual(jochenState.status, 'frei', 'free Kalle must release tied Jochen while Karl is away');
assert.strictEqual(worldContext.caseProgress.krauseWorldProgressed, true, 'Krause world progression must be recorded once');
const returnPrompt = worldContext._krauseWeltfortschrittBeiReise('Charite', 'Tante Friedas Hehlerei');
assert(returnPrompt.includes('Kalle hat Jochen waehrend Karls Abwesenheit befreit'), 'return scene must explain the changed world state');
assert.strictEqual(worldContext.caseProgress.krauseRueckkehrFortschritt, null, 'return prompt must be consumed exactly once');

jochenState = { status: 'gefesselt' };
kalleState = { status: 'benommen' };
worldContext.caseProgress = {};
assert.strictEqual(worldContext._krauseWeltfortschrittBeiReise('Tante Friedas Hehlerei', 'Charite'), '', 'incapacitated Kalle should not advance the world');
assert.strictEqual(jochenState.status, 'gefesselt', 'incapacitated Kalle must not free Jochen');

console.log('krause-world-progression: ok');
