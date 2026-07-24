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

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1523 +LocalArrivalFallback-Staging'"),
  'release version missing');

console.log('THREAT_SPAWN_SERIALIZATION_OK');
