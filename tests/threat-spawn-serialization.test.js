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

function runWith(threats) {
  const loc = { name: 'Testort', bedrohungen: threats };
  const math = Object.create(Math);
  math.random = () => 0.1;
  const context = {
    Math: math,
    engineCurrentLocation: { name: 'Testort' },
    getCaseLocations: () => [loc],
    normForMatch: value => String(value || '').toLowerCase(),
    sceneCounter: 2,
    gameTimeIdx: 5,
    TIMES_OF_DAY: ['morgen', 'vormittag', 'mittag', 'nachmittag', 'abend', 'nacht'],
    caseProgress: { stage: 3 },
    _threatAktiveSpawns: [],
    _threatOrtLastRoll: {},
    _threatGlobalCooldown: {},
    _THREAT_GLOBAL_COOLDOWN_DEFAULT: 6,
    _npcZustandIstEntfernt: () => false,
    _inventarHatItemKey: () => false,
    diag: () => {},
    _konfrontationPruefen: (targetLoc, spawns) => {
      context.checkedSpawns = Array.from(spawns);
    }
  };
  vm.createContext(context);
  vm.runInContext(sourceOf('resolveThreatSpawn'), context);
  context.resolveThreatSpawn();
  return context;
}

let context = runWith([
  { id: 'mantel', chance: 70, globalCooldown: 4 },
  { id: 'mertens', chance: 50, globalCooldown: 6 }
]);
assert.deepStrictEqual(Array.from(context._threatAktiveSpawns), ['mantel'],
  'only one successful optional threat may be physically activated per arrival');
assert.deepStrictEqual(context.checkedSpawns, ['mantel'],
  'the confrontation system must receive the same single active threat');
assert.strictEqual(context._threatGlobalCooldown.mantel, 6,
  'the selected threat receives its configured cooldown');
assert.strictEqual(context._threatGlobalCooldown.mertens, undefined,
  'a serialized-away threat was not present and must not receive a cooldown');

context = runWith([
  { id: 'optional', chance: 70, globalCooldown: 4 },
  { id: 'story_guard', chance: 100, unausweichlich: true, storyBeat: true }
]);
assert.deepStrictEqual(Array.from(context._threatAktiveSpawns), ['story_guard'],
  'a guaranteed story threat takes priority over an optional successful roll');
assert.deepStrictEqual(context.checkedSpawns, ['story_guard'],
  'guaranteed threat priority must also reach confrontation startup');

const visibleContext = {
  caseProgress: {
    activeConfrontation: {
      npcId: 'mann_im_mantel',
      enemyName: 'Mann im langen Mantel',
      enemyTag: 'MYSTERY',
      enemyRole: 'Schatten',
      ort: 'Margarete Steins Wohnung',
      startedScene: 1
    }
  },
  sceneCounter: 2,
  engineCurrentLocation: { name: 'Margarete Steins Wohnung' },
  normForMatch: value => String(value || '').toLowerCase(),
  _npcZustandGet: () => null,
  _npcZustandIstEntfernt: () => false,
  _konfrontationGruppenLebende: () => [],
  _konfrontationOrtName: () => 'Margarete Steins Wohnung',
  _konfrontationClear: () => {},
  diag: () => {}
};
vm.createContext(visibleContext);
vm.runInContext(sourceOf('_konfrontationAktiv'), visibleContext);
vm.runInContext(sourceOf('_konfrontationEnemy'), visibleContext);
vm.runInContext(sourceOf('_konfrontationInAktuellerSzeneSichtbar'), visibleContext);
vm.runInContext(sourceOf('_konfrontationSceneTruthSichern'), visibleContext);
const arrival = {
  szene: 'Margarete kauert neben ihrer beschaedigten Aktentasche und sieht zu dir auf.',
  ort: 'Margarete Steins Wohnung',
  personenImRaum: ['Margarete Stein']
};
const arrivalCast = [{ id: 'margarete_stein', name: 'Margarete Stein' }];
assert.strictEqual(visibleContext._konfrontationInAktuellerSzeneSichtbar(arrival), false,
  'a later scene number alone must not expose confrontation UI ahead of prose');
assert.strictEqual(visibleContext._konfrontationSceneTruthSichern(arrival, arrivalCast), true,
  'an engine-backed threat omitted by the model needs deterministic prose repair');
assert(/Der Mann im langen Mantel tritt/.test(arrival.szene) && /Tür/.test(arrival.szene),
  'the repaired indoor arrival must introduce the exact enemy through the room entrance');
assert(arrival.personenImRaum.includes('Mann im langen Mantel'),
  'the repaired threat must be present in the scene roster');
assert.strictEqual(visibleContext._konfrontationInAktuellerSzeneSichtbar(arrival), true,
  'confrontation UI becomes visible only after the prose repair');
visibleContext.sceneCounter = 3;
const departure = {
  szene: 'Er nickt knapp, dreht sich um und eilt durch den Flur zur Treppe hinunter. Die Wohnungstuer faellt hinter ihm ins Schloss.',
  personenImRaum: ['Margarete Stein']
};
assert.strictEqual(visibleContext._konfrontationSceneTruthSichern(departure, []), false,
  'an established confrontation may continue with pronouns without a repeated entrance');
assert(!/stellt sich dir in den Weg/.test(departure.szene),
  'a departing established enemy must not be reintroduced in the same scene');
assert.strictEqual(visibleContext._konfrontationInAktuellerSzeneSichtbar(departure), true,
  'the established encounter remains visible through its final continuity scene');
const awkwardArrival = {
  szene: 'Margarete fluestert: "Der Herr Mantel im Mantel ist im Haus."',
  personenImRaum: ['Margarete Stein']
};
visibleContext._konfrontationSceneTruthSichern(awkwardArrival, []);
assert(!/Herr Mantel im Mantel/.test(awkwardArrival.szene)
    && /Mann im langen Mantel/.test(awkwardArrival.szene),
  'the recurring model tautology for the anonymous coat man needs prose cleanup');

const visualContext = {
  caseProgress: {
    activeConfrontation: {
      npcId: 'mann_im_mantel',
      enemyName: 'Mann im langen Mantel'
    }
  },
  normForMatch: value => String(value || '').toLowerCase(),
  getNpcsAtCurrentLocation: () => [{ id: 'mann_im_mantel', name: 'Mann im langen Mantel' }],
  _konfrontationInAktuellerSzeneSichtbar: () => false,
  _npcZustandGet: () => null,
  _npcZustandIstEntfernt: () => false
};
vm.createContext(visualContext);
vm.runInContext(sourceOf('_szenenbildAnwesenheitsVariante'), visualContext);
const baseImage = {
  file: 'wohnung.webp',
  presenceVariants: [{
    id: 'mann_im_mantel',
    file: 'wohnung-mantel.webp'
  }]
};
const oldSavedScene = {
  szene: 'Margarete sitzt allein mit der Aktentasche auf dem Boden.',
  personenImRaum: ['Margarete Stein']
};
assert.strictEqual(
  visualContext._szenenbildAnwesenheitsVariante(baseImage, oldSavedScene).file,
  'wohnung.webp',
  'a not-yet-narrated active enemy must not select the NPC image variant'
);

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1737 +GoerkeRestore'"),
  'release version missing');

console.log('THREAT_SPAWN_SERIALIZATION_OK');
