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
  caseSetup: { caseType: 'diebstahl', klient: 'Theodor Krause' },
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

const transitionOption = {
  id: 'NPC_befragen',
  _npcName: 'Theodor Krause',
  _npcInteraktion: { npcName: 'Theodor Krause', verb: 'befragen' },
  _clientDepartureAfterReply: 'Theodor Krause'
};
problem = truthContext.validateSceneWorldTruth({
  ort: 'Karl Mauers B\u00fcro',
  szene: 'Theodor Krause antwortet knapp auf Karls Frage. Dann setzt er den Hut auf, verabschiedet sich und verl\u00e4sst das B\u00fcro.',
  personenImRaum: [],
  optionen: []
}, transitionOption);
assert.strictEqual(problem, null, 'the selected client must answer before his departure becomes binding');
problem = truthContext.validateSceneWorldTruth({
  ort: 'Karl Mauers B\u00fcro',
  szene: '"Mehr wei\u00df ich nicht", murmelt Theodor Krause. Er setzt den Hut auf, verabschiedet sich und verl\u00e4sst das B\u00fcro.',
  personenImRaum: [],
  optionen: []
}, transitionOption);
assert.strictEqual(problem, null, 'natural direct speech must count as a visible reply without formulaic response wording');
problem = truthContext.validateSceneWorldTruth({
  ort: 'Karl Mauers B\u00fcro',
  szene: 'Theodor Krause ist bereits weg; nur der leere Sessel bleibt zur\u00fcck.',
  personenImRaum: [],
  optionen: []
}, transitionOption);
assert(problem && problem.code === 'client_reply_missing', 'a direct client action may not skip the actual reply');
problem = truthContext.validateSceneWorldTruth({
  ort: 'Karl Mauers B\u00fcro',
  szene: 'Theodor Krause antwortet knapp auf Karls Frage und bleibt im Sessel sitzen.',
  personenImRaum: ['Theodor Krause'],
  optionen: []
}, transitionOption);
assert(problem && problem.code === 'client_departure_missing', 'the first assignment talk must narrate Krause leaving after the reply');
problem = truthContext.validateSceneWorldTruth({
  ort: 'Karl Mauers B\u00fcro',
  szene: 'Theodor Krause antwortet: "Ich habe die zwei M\u00e4nner mit einem Seesack im Hinterhof gesehen." Dann verabschiedet er sich und verl\u00e4sst das B\u00fcro.',
  personenImRaum: [],
  optionen: []
}, transitionOption);
assert(problem && problem.code === 'client_witness_role_drift',
  'Krause must not absorb Hannelore Wirths exclusive eyewitness clue');
assert(html.includes('KRAUSE-KENNTNISGRENZE'),
  'the direct client prompt must bind Krause to his canonical knowledge before generation');
assert(sourceOf('buildNpcContinuityHint').includes('_clientDepartureAfterReply'),
  'the continuity prompt must defer Krause absence during the selected reply scene');

const execute = sourceOf('_hauptuiExecute');
const attackStart = execute.indexOf("if (verb === 'angreifen')");
const attackEnd = execute.indexOf("if (verb === 'fesseln')", attackStart);
const attackBranch = execute.slice(attackStart, attackEnd);
assert(!attackBranch.includes("_hauptuiPlanDirekt('angreifen'"), 'direct attack must not disappear in the old plan path');
assert(attackBranch.includes('_gegnerLoestKampf: true'), 'attack fallback must keep the fight state and produce a scene');

assert(html.includes("engineOrt === 'tante friedas hehlerei' || engineOrt === 'stallschreiberstrasse 12'"),
  'Krause visuals must recognize both places without treating the courtyard as the shop interior');
assert(!html.includes("/tante friedas hehlerei|stallschreiberstrasse 12/.test"),
  'shop and Stallschreiber courtyard must no longer share the old visual alias');
const krauseSet = html.slice(html.indexOf("caseTest: /theodor krause"), html.indexOf("caseTest: /renate schiffer"));
assert(krauseSet.includes('hardenbergstrasse'), 'Krause case must reuse the existing Hardenbergstrasse police image');
assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'krause', 'tante-friedas-hehlerei-erika-day.png')),
  'Erika needs a truthful dedicated Hehlerei image');
assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'krause', 'tante-friedas-hehlerei-after-day.png')),
  'the cleared Hehlerei needs a post-custody image without removed NPCs');
for (const asset of [
  'tante-friedas-hehlerei-frieda-day.png',
  'tante-friedas-hehlerei-kalle-jochen-night.png',
  'stallschreiberstrasse-12-confrontation-day.png',
  'stallschreiberstrasse-12-confrontation-night.png',
  'stallschreiberstrasse-12-aftermath-day.png',
  'stallschreiberstrasse-12-aftermath-night.png'
]) {
  assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'krause', asset)), 'missing Krause state image: ' + asset);
}
for (const asset of [
  'stallschreiberstrasse-12-aftermath-group-day.png',
  'stallschreiberstrasse-12-aftermath-group-night.png',
]) {
  assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'krause', asset)), 'missing Krause group aftermath image: ' + asset);
}
for (const asset of [
  'stallschreiberstrasse-12-frieda-day.png',
  'stallschreiberstrasse-12-frieda-night.png',
  'stallschreiberstrasse-12-kalle-day.png',
  'stallschreiberstrasse-12-kalle-night.png',
  'stallschreiberstrasse-12-jochen-day.png',
  'stallschreiberstrasse-12-jochen-night.png',
  'stallschreiberstrasse-12-frieda-kalle-day.png',
  'stallschreiberstrasse-12-frieda-kalle-night.png',
  'stallschreiberstrasse-12-frieda-jochen-day.png',
  'stallschreiberstrasse-12-frieda-jochen-night.png',
  'stallschreiberstrasse-12-kalle-jochen-day.png',
  'stallschreiberstrasse-12-kalle-jochen-night.png',
]) {
  assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'krause', asset)), 'missing exact courtyard roster image: ' + asset);
}
assert(html.includes("file: 'tante-friedas-hehlerei-erika-day.png'"), 'Erika image must be selected from real scene presence');
assert(html.includes("file: 'tante-friedas-hehlerei-after-day.png'"), 'post-custody image must be selected from terminal NPC state');
assert(html.includes("ROMANCE: 'Romanze'"), 'travel popup must translate the technical ROMANCE tag');
assert(!html.includes('escapeHtml(npc.tag.toLowerCase())'), 'raw English NPC tags must not leak into the travel popup');

const visualContext = {
  normForMatch,
  caseSetup: { caseType: 'diebstahl', klient: 'Theodor Krause' },
  caseProgress: { activeConfrontation: null },
  engineCurrentLocation: { name: 'Tante Friedas Hehlerei' },
  roster: [],
  states: {},
  getNpcsAtCurrentLocation: () => visualContext.roster,
  _npcZustandGet: name => visualContext.states[normForMatch(name)] || null,
  _konfrontationGruppenAktiv: fight => !!(fight && Array.isArray(fight.enemyEntries) && fight.enemyEntries.length > 1)
};
vm.createContext(visualContext);
vm.runInContext(sourceOf('_krauseHehlereiNachherVisual'), visualContext);
visualContext.roster = [{ name: 'Erika Kalewski' }];
let visualSpec = visualContext._krauseHehlereiNachherVisual({});
assert.strictEqual(visualSpec.file, 'tante-friedas-hehlerei-erika-day.png',
  'visible Erika must override stale location art with her dedicated scene');
visualContext.roster = [{ name: 'Erika Kalewski' }, { name: 'Kalle' }, { name: 'Jochen' }];
assert.strictEqual(visualContext._krauseHehlereiNachherVisual({}).file, 'tante-friedas-hehlerei-kalle-jochen-night.png',
  'Erika must not hide the two active henchmen in the scene image');
visualContext.roster = [{ name: 'Erika Kalewski' }, { name: 'Tante Frieda' }];
assert.strictEqual(visualContext._krauseHehlereiNachherVisual({}).file, 'tante-friedas-hehlerei-frieda-day.png',
  'Frieda must retain image priority over a calm companion portrait');
visualContext.roster = [];
visualSpec = visualContext._krauseHehlereiNachherVisual({});
assert.strictEqual(visualSpec.file, 'tante-friedas-hehlerei-after-day.png',
  'an actually empty shop must select the cleared scene');
visualContext.roster = [{ name: 'Tante Frieda' }];
assert.strictEqual(visualContext._krauseHehlereiNachherVisual({}).file, 'tante-friedas-hehlerei-frieda-day.png',
  'Frieda alone must not display her two absent henchmen');
visualContext.roster = [{ name: 'Kalle' }, { name: 'Jochen' }];
assert.strictEqual(visualContext._krauseHehlereiNachherVisual({}).file, 'tante-friedas-hehlerei-kalle-jochen-night.png',
  'night guards must not display absent Frieda');
visualContext.engineCurrentLocation.name = 'Stallschreiberstrasse 12';
visualContext.roster = [{ name: 'Tante Frieda' }, { name: 'Kalle' }, { name: 'Jochen' }];
assert.strictEqual(visualContext._krauseHehlereiNachherVisual({}).dayFile, 'stallschreiberstrasse-12-confrontation-day.png',
  'the three-person showdown must remain in the courtyard');
for (const [names, expected] of [
  [['Tante Frieda', 'Kalle'], 'stallschreiberstrasse-12-frieda-kalle-day.png'],
  [['Tante Frieda', 'Jochen'], 'stallschreiberstrasse-12-frieda-jochen-day.png'],
  [['Kalle', 'Jochen'], 'stallschreiberstrasse-12-kalle-jochen-day.png'],
  [['Tante Frieda'], 'stallschreiberstrasse-12-frieda-day.png'],
  [['Kalle'], 'stallschreiberstrasse-12-kalle-day.png'],
  [['Jochen'], 'stallschreiberstrasse-12-jochen-day.png'],
]) {
  visualContext.roster = names.map(name => ({ name }));
  visualContext.states = {};
  assert.strictEqual(visualContext._krauseHehlereiNachherVisual({}).dayFile, expected,
    'courtyard image must exactly match active roster: ' + names.join(', '));
}
visualContext.roster = [{ name: 'Tante Frieda' }, { name: 'Kalle' }, { name: 'Jochen' }];
visualContext.caseProgress.activeConfrontation = { enemyEntries: [{ name: 'Tante Frieda' }, { name: 'Kalle' }, { name: 'Jochen' }] };
visualContext.states.kalle = { status: 'ko', ort: 'Stallschreiberstrasse 12' };
assert.strictEqual(visualContext._krauseHehlereiNachherVisual({}).dayFile, 'stallschreiberstrasse-12-frieda-jochen-day.png',
  'an ongoing group confrontation must show exactly the two opponents still standing');
visualContext.caseProgress.activeConfrontation = null;
visualContext.roster = [{ name: 'Kalle' }, { name: 'Jochen' }];
visualContext.states['tante frieda'] = { status: 'geflohen', ort: 'Tante Friedas Hehlerei' };
visualContext.states.kalle = null;
assert.strictEqual(visualContext._krauseHehlereiNachherVisual({}).nightFile, 'stallschreiberstrasse-12-kalle-jochen-night.png',
  'a previously fled Frieda must not remain in the courtyard picture with Kalle and Jochen');
visualContext.roster = [{ name: 'Jochen' }];
visualContext.states.kalle = { status: 'geflohen', ort: 'Stallschreiberstrasse 12' };
assert.strictEqual(visualContext._krauseHehlereiNachherVisual({}).nightFile, 'stallschreiberstrasse-12-jochen-night.png',
  'Jochen alone in Haupt-UI must also be the only opponent visible in the scene image');
visualContext.roster = [{ name: 'Tante Frieda' }, { name: 'Kalle' }, { name: 'Jochen' }];
visualContext.caseProgress.activeConfrontation = null;
visualContext.states.kalle = null;
visualContext.states['tante frieda'] = { status: 'ko', ort: 'Stallschreiberstrasse 12' };
visualContext.states.kalle = { status: 'geflohen', ort: 'Stallschreiberstrasse 12' };
visualContext.states.jochen = { status: 'geflohen', ort: 'Stallschreiberstrasse 12' };
assert.strictEqual(visualContext._krauseHehlereiNachherVisual({}).dayFile, 'stallschreiberstrasse-12-aftermath-day.png',
  'defeated Frieda and escaped henchmen need the truthful courtyard aftermath');
visualContext.states.kalle = { status: 'ko', ort: 'Stallschreiberstrasse 12' };
visualContext.states.jochen = { status: 'ko', ort: 'Stallschreiberstrasse 12' };
assert.strictEqual(visualContext._krauseHehlereiNachherVisual({}).dayFile, 'stallschreiberstrasse-12-aftermath-group-day.png',
  'defeated but still-present Kalle and Jochen must remain visible beside Frieda');
visualContext.states['tante frieda'] = { status: 'ko', ort: 'Tante Friedas Hehlerei' };
assert.strictEqual(visualContext._krauseHehlereiNachherVisual({}).file, 'stallschreiberstrasse-12-night.png',
  'a Frieda body left in the shop must not teleport into the courtyard image');

const bodyContext = {
  normForMatch,
  engineCurrentLocation: { name: 'Tante Friedas Hehlerei' },
  _npcZustandMap: () => ({ 'tante frieda': { name: 'Tante Frieda', status: 'ko', ort: 'Tante Friedas Hehlerei' } }),
  _resolveNpcIdentity: name => ({ id: 'tante_frieda', name })
};
vm.createContext(bodyContext);
vm.runInContext(sourceOf('_npcZustandLokaleKoerperErgaenzen'), bodyContext);
let bodies = bodyContext._npcZustandLokaleKoerperErgaenzen([], {});
assert.strictEqual(bodies.length, 1, 'a defeated Frieda must remain executable at her exact location');
bodyContext.engineCurrentLocation.name = 'Stallschreiberstrasse 12';
bodies = bodyContext._npcZustandLokaleKoerperErgaenzen([], {});
assert.strictEqual(bodies.length, 0, 'the defeated Frieda must not leak into a different travel destination');
assert(!html.includes('_W6_SCHWESTERORTE'), 'shop and courtyard must not share terminal NPC bodies');

const partyContext = {
  normForMatch,
  _party: [{ id: 'erika_kalewski', name: 'Erika Kalewski' }],
  _resolveNpcIdentity: () => ({ id: 'erika_kalewski', name: 'Erika Kalewski', tag: 'ROMANCE', rolle: 'Krauses Sammlerin-Bekannte' }),
  _hundInParty: () => false
};
vm.createContext(partyContext);
vm.runInContext(sourceOf('_konfrontationBegleiterAktionen'), partyContext);
const erikaMoves = partyContext._konfrontationBegleiterAktionen();
assert(erikaMoves.some(move => move.art === 'warnen'), 'civilian Erika needs a believable warning action');
assert(!erikaMoves.some(move => move.art === 'festhalten' || move.art === 'deckung'),
  'civilian Erika must not become a grappler or tactical bodyguard');

const assistContext = {};
vm.createContext(assistContext);
['_konfrontationAssistListe', '_konfrontationAssistBonus', '_konfrontationAssistText']
  .forEach(name => vm.runInContext(sourceOf(name), assistContext));
const boundAssist = assistContext._konfrontationAssistText({ name: 'Erika', bonus: 1, prompt: 'Erika warnt Karl.' }, 'Kalle');
assert(boundAssist.includes('BINDENDES ZIEL') && boundAssist.includes('Kalle'),
  'companion narration must stay bound to the selected opponent');
assert(html.includes('_spOk && !_romanceGefahrAmOrt'), 'romance introduction must be blocked by active local danger');
assert(html.includes("caseIsPolitical) ? lastSpannung < 5 : lastSpannung < 4"),
  'normal cases must not introduce romance figures at tension four');

const hehlereiBlock = html.slice(html.indexOf("name: 'Tante Friedas Hehlerei'"), html.indexOf("name: 'Stallschreiberstrasse 12'"));
assert(hehlereiBlock.includes("bisStage: 2"), 'the shop cast must leave once the showdown moves outside');
const stallschreiberBlock = html.slice(html.indexOf("name: 'Stallschreiberstrasse 12'"), html.indexOf("name: 'Bornsteins Antiquit"));
assert(stallschreiberBlock.includes("id: 'tante_frieda', immer: true, abStage: 3"), 'Frieda must be physically present and clickable in the courtyard finale');
assert(html.includes('NACHT-GEFAHR-GUARD'), 'active enemies must block the misleading night-to-morning rollover');
assert(html.includes('Gold: sehr passend') && html.includes('Blau: brauchbarer Hebel') && html.includes('Rot: riskant, hohe Gegenwehr'),
  'combat item colors need a visible legend');
assert(html.includes('FAIL-FORWARD (organisch in die Prosa'), 'failed under-equipped Krause combat must point organically toward Trude');

assert(sourceOf('_hauptuiSozialVerben').includes('schonGesprochen || istInformant'),
  'an exhausted informant must not sell the same social bribe again');
assert(execute.includes("verb === 'nachhaken_informant'"), 'paid informants need a free follow-up instead of a duplicate purchase');
assert(execute.includes('Wiederhole den alten Hinweis nicht wortgleich'), 'informant follow-up must explicitly block repeated exposition');

const repeatContext = { normForMatch };
vm.createContext(repeatContext);
vm.runInContext(sourceOf('computeSceneSentenceOverlap'), repeatContext);
vm.runInContext(sourceOf('sceneHasBlockingRepetition'), repeatContext);
const erikaPrevious = 'Erika lässt ihre Hand nicht sinken. Ihr Blick wird weicher, ein Schatten von Erleichterung huscht über ihr Gesicht, als sie sich ein Stück näher zu dir lehnt. Ihre Fingerspitzen zeichnen beinahe unbewusst den Stoff deines Mantels nach.';
const erikaRepeated = 'Erika lässt ihre Hand nicht sinken. Ihr Blick wird weicher, ein Schatten von Erleichterung huscht über ihr Gesicht, als sie sich ein Stück näher zu dir lehnt. Ihre Fingerspitzen zeichnen beinahe unbewusst den Stoff deines Mantels nach, dort wo die Wunde pocht.';
assert.strictEqual(repeatContext.sceneHasBlockingRepetition(erikaRepeated, erikaPrevious).blocking, true,
  'the exact romance repetition from scenes 28/29 must be rejected before commit');
assert.strictEqual(repeatContext.sceneHasBlockingRepetition('Erika zieht die Hand zurück und deutet auf die offene Lagertür. Von drinnen schabt eine Kiste über Stein.', erikaPrevious).blocking, false,
  'a genuinely advancing follow-up scene must remain valid');

assert(html.includes('bietet 200 Ostmark bei Rueckgabe'), 'Krause setup cast must match the engine payout');
assert(html.includes('Er bietet 200 Ostmark, wenn du das Etui zurückbringst.'), 'Krause opening must promise the actual 200 Ostmark payout');
assert(!html.includes('Er bietet 500 D-Mark plus Bonus, wenn du das Etui zurückbringst.'), 'stale 500 D-Mark promise must be gone');

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

assert(html.includes('Laufziel sind mindestens 5 verschiedene Achsen'), 'historical education breadth target must be five axes');
assert(html.includes('(lastSpannung <= 3 || needMoreEduAxes || (sceneCounter >= 14 && needMoreVariety))'), 'historical breadth must still work in action-heavy runs');
assert(html.includes('(Ziel: >= 4)'), 'historical anchor category target must be four of five');
assert(html.includes('KATEGORIE-VIELFALT (PFLICHT)'), 'missing historical categories must be requested explicitly');
assert(html.includes('pacingAtempausePending'), 'long confrontations must schedule a real detective breather');

console.log('KRAUSE_FEEDBACK_REGRESSION_OK');
