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

const normForMatch = value => String(value || '').toLowerCase()
  .replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

const presenceContext = {
  caseProgress: { stage: 0, klientGesprochen: false },
  engineCurrentLocation: { name: 'Karl Mauers B\u00fcro' },
  gameTimeIdx: 1,
  TIMES_OF_DAY: ['MORGEN', 'VORMITTAG', 'MITTAG', 'NACHMITTAG', 'ABEND', 'NACHT'],
  normForMatch,
  getCaseLocations: () => [{
    name: 'Karl Mauers B\u00fcro',
    npcs: [{ id: 'theodor_krause', zeit: ['vormittag', 'mittag', 'nachmittag'], bisStage: 0, wegWennKlientGesprochen: true }]
  }],
  _istKlient: () => true,
  _party: []
};
vm.createContext(presenceContext);
vm.runInContext(sourceOf('_npcOrtsbindungEintragAktiv'), presenceContext);
vm.runInContext(sourceOf('_npcGehoertHierher'), presenceContext);
assert.strictEqual(presenceContext._npcGehoertHierher('theodor_krause', 'Theodor Krause'), true,
  'Krause must be present for the opening assignment');
presenceContext.caseProgress.stage = 1;
presenceContext.caseProgress.klientGesprochen = true;
assert.strictEqual(presenceContext._npcGehoertHierher('theodor_krause', 'Theodor Krause'), false,
  'Krause must not be reintroduced into the office after handing over the case');

const truthContext = {
  caseProgress: { stage: 1, klientGesprochen: true, npcZustand: {} },
  engineCurrentLocation: { name: 'Karl Mauers B\u00fcro' },
  gameTimeIdx: 1,
  sceneCounter: 11,
  TIMES_OF_DAY: presenceContext.TIMES_OF_DAY,
  normForMatch,
  getCaseLocations: presenceContext.getCaseLocations,
  _resolveNpcIdentity: () => ({ id: 'theodor_krause', name: 'Theodor Krause' })
};
vm.createContext(truthContext);
['_npcOrtsbindungEintragAktiv', '_worldTruthAliases', '_worldTruthHasAlias', '_worldTruthOrtGleich', 'validateSceneWorldTruth']
  .forEach(name => vm.runInContext(sourceOf(name), truthContext));
let problem = truthContext.validateSceneWorldTruth({
  ort: 'Karl Mauers B\u00fcro',
  szene: 'Theodor Krause sitzt noch immer da und wartet auf dich.',
  personenImRaum: ['Theodor Krause'],
  optionen: []
}, { id: 'REDEN' });
assert(problem && problem.code === 'npc_departed', 'Krause phantom prose and roster must be rejected');
problem = truthContext.validateSceneWorldTruth({
  ort: 'Karl Mauers B\u00fcro',
  szene: 'Krause hat das B\u00fcro nach der Auftrags\u00fcbergabe verlassen.',
  personenImRaum: [],
  optionen: []
}, { id: 'AKTEN' });
assert.strictEqual(problem, null, 'a retrospective mention of Krause leaving must remain valid');

const execute = sourceOf('_hauptuiExecute');
const attackStart = execute.indexOf("if (verb === 'angreifen')");
const attackEnd = execute.indexOf("if (verb === 'fesseln')", attackStart);
const attackBranch = execute.slice(attackStart, attackEnd);
assert(!attackBranch.includes("_hauptuiPlanDirekt('angreifen'"), 'direct attack must not disappear in the old plan path');
assert(attackBranch.includes('_gegnerLoestKampf: true'), 'attack fallback must keep the fight state and produce a scene');

assert(html.includes("/tante friedas hehlerei|stallschreiberstrasse 12/.test"),
  'Stallschreiberstrasse alias must select the visible Frieda/Kalle/Jochen confrontation image');
const krauseSet = html.slice(html.indexOf("caseTest: /theodor krause"), html.indexOf("caseTest: /renate schiffer"));
assert(krauseSet.includes('hardenbergstrasse'), 'Krause case must reuse the existing Hardenbergstrasse police image');

assert(sourceOf('_hauptuiSozialVerben').includes('schonGesprochen || istInformant'),
  'an exhausted informant must not sell the same social bribe again');
assert(execute.includes("verb === 'nachhaken_informant'"), 'paid informants need a free follow-up instead of a duplicate purchase');
assert(execute.includes('Wiederhole den alten Hinweis nicht wortgleich'), 'informant follow-up must explicitly block repeated exposition');

const romanceContext = {
  pendingRomancePushScene: 10,
  lastRomanceNpcScene: -99,
  sceneCounter: 10,
  lastSpannung: 2,
  karlInStasiCustody: false,
  caseProgress: { stage: 2 },
  caseSetup: { setupCast: [{ name: 'Erika Kalewski', tag: 'ROMANCE', rolle: 'Krauses Sammlerin-Bekannte', beziehung: 'kennt das Etui' }] },
  normForMatch,
  diag: () => {}
};
vm.createContext(romanceContext);
vm.runInContext(sourceOf('enforceRomanceIntroductionScene'), romanceContext);
const romanceScene = { szene: 'Du ordnest die Spuren.', spannung: 2, personenImRaum: [], cast_hinzugefuegt: [] };
const introduced = romanceContext.enforceRomanceIntroductionScene(romanceScene);
assert(introduced && introduced.name === 'Erika Kalewski', 'ignored Erika prompt must receive an engine-backed introduction');
assert(romanceScene.personenImRaum.includes('Erika Kalewski'), 'Erika must become visibly present and clickable');
assert(/Erika Kalewski/.test(romanceScene.szene), 'Erika introduction must be visible in prose');
assert.strictEqual(romanceContext.pendingRomancePushScene, -99, 'successful introduction must consume the pending prompt');

assert(html.includes('Laufziel sind mindestens 4 verschiedene Achsen'), 'historical education breadth target must be four axes');
assert(html.includes('(lastSpannung <= 3 || needMoreEduAxes)'), 'education breadth must still work in action-heavy runs');
assert(html.includes('pacingAtempausePending'), 'long confrontations must schedule a real detective breather');

console.log('KRAUSE_FEEDBACK_REGRESSION_OK');
