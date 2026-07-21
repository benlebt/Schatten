const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sourceOf(name) {
  const start = html.indexOf('function ' + name + '(');
  assert(start >= 0, 'missing function ' + name);
  const brace = html.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < html.length; i += 1) {
    if (html[i] === '{') depth += 1;
    if (html[i] === '}') {
      depth -= 1;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('unterminated function ' + name);
}

const normForMatch = (value) => String(value || '')
  .toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

const context = {
  normForMatch,
  sceneCounter: 15,
  caseProgress: {
    npcZustand: {
      mertens: {
        name: 'Oberleutnant Mertens',
        status: 'uebergeben',
        ort: 'Lagerhaus an der Spree',
        seitSzene: 14
      }
    }
  },
  engineCurrentLocation: { name: 'Lagerhaus an der Spree' },
  getCaseLocations: () => [],
  diag: () => {}
};
vm.createContext(context);
[
  '_worldTruthAliases',
  '_worldTruthHasAlias',
  '_worldTruthOrtGleich',
  'validateSceneWorldTruth',
  'buildWorldTruthRepairHint',
  'enforceSceneWorldTruthFallback',
  '_schlafHeilZiel'
].forEach((name) => vm.runInContext(sourceOf(name), context));

let problem = context.validateSceneWorldTruth({
  ort: 'Lagerhaus an der Spree',
  szene: 'Mertens schlägt Karl erneut mit der Faust.',
  personenImRaum: [],
  optionen: []
}, { id: 'REDEN' });
assert(problem && problem.code === 'npc_prose',
  'a handed-over NPC must never return as an acting prose character');

problem = context.validateSceneWorldTruth({
  ort: 'Lagerhaus an der Spree',
  szene: 'Die Polizei hat Mertens bereits abgeführt.',
  personenImRaum: [],
  optionen: [{ text: 'Spuren sichern' }]
}, { id: 'UNTERSUCHEN' });
assert.strictEqual(problem, null, 'retrospective mention of a police handoff must remain legal');

problem = context.validateSceneWorldTruth({
  ort: 'Lagerhaus an der Spree',
  szene: 'Karl prüft die gesicherten Spuren.',
  personenImRaum: [],
  optionen: [{ text: 'Greife Oberleutnant Mertens an' }]
}, { id: 'UNTERSUCHEN' });
assert(problem && problem.code === 'npc_option',
  'stale buttons must not target a handed-over NPC');

context.caseProgress.npcZustand = {};
problem = context.validateSceneWorldTruth({
  ort: 'Opel Olympia',
  szene: 'Karl sitzt schon im Opel.',
  personenImRaum: [],
  optionen: []
}, { id: 'REDEN' });
assert(problem && problem.code === 'engine_location',
  'model prose must not silently move Karl away from the engine location');

problem = context.validateSceneWorldTruth({
  ort: 'Lagerhaus an der Spree',
  szene: 'Du rennst hinaus und fährst davon.',
  personenImRaum: [],
  optionen: []
}, { id: 'REDEN' });
assert(problem && problem.code === 'unauthorized_departure',
  'prose must not invent a departure the player did not choose');

context.caseProgress.npcZustand = {
  mertens: {
    name: 'Oberleutnant Mertens',
    status: 'gefesselt',
    ort: 'Lagerhaus an der Spree',
    seitSzene: 14
  }
};
problem = context.validateSceneWorldTruth({
  ort: 'Lagerhaus an der Spree',
  szene: 'Oberleutnant Mertens springt auf und greift Karl an.',
  personenImRaum: [{ name: 'Oberleutnant Mertens' }],
  optionen: []
}, { id: 'REDEN' });
assert(problem && problem.code === 'npc_state_action',
  'a restrained NPC must not act against the stored physical state');

assert.strictEqual(context._schlafHeilZiel(2, false), 3,
  'sleep may stabilize a severe injury but not fully heal it');
assert.strictEqual(context._schlafHeilZiel(3, true), 3,
  'provisional first aid must retain the sleep healing cap');
assert.strictEqual(context._schlafHeilZiel(4, false), 5,
  'ordinary light fatigue may still heal through sleep');

const confrontationContext = {
  caseProgress: {
    activeConfrontation: { npcId: 'mertens', enemyName: 'Oberleutnant Mertens', ort: 'Lagerhaus an der Spree' },
    encounterState: null
  },
  _npcZustandIstEntfernt: () => true,
  _konfrontationOrtName: () => 'Lagerhaus an der Spree',
  normForMatch,
  diag: () => {}
};
confrontationContext._konfrontationClear = (reason) => {
  confrontationContext.clearReason = reason;
  confrontationContext.caseProgress.activeConfrontation = null;
};
vm.createContext(confrontationContext);
vm.runInContext(sourceOf('_konfrontationAktiv'), confrontationContext);
assert.strictEqual(confrontationContext._konfrontationAktiv(), false,
  'render-time confrontation guard must reject a terminal NPC');
assert.strictEqual(confrontationContext.clearReason, 'npc-terminalzustand',
  'stale confrontation state must be actively cleared');

console.log('WORLD_TRUTH_HARD_GUARD_OK');
