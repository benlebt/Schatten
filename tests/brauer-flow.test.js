const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { readWebpDimensions } = require('./image-format-utils');

const repoRoot = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
const context = { INTRO_REQUIREMENTS: '' };
vm.createContext(context);

const casesStart = html.indexOf('const INTRO_VARIANTS');
const casesEnd = html.indexOf('const DIFFICULTY_ORDER', casesStart);
assert(casesStart >= 0 && casesEnd > casesStart, 'case setup block is missing');
vm.runInContext(
  html.slice(casesStart, casesEnd) + ';globalThis.CASES=INTRO_VARIANTS;',
  context,
);

const imageStart = html.indexOf('const SHARED_SCENE_IMAGES');
const imageEnd = html.indexOf('function _kesslerSceneNorm', imageStart);
assert(imageStart >= 0 && imageEnd > imageStart, 'scene image configuration is missing');
vm.runInContext(
  html.slice(imageStart, imageEnd) + ';globalThis.IMAGE_SETS=CASE_SCENE_IMAGE_SETS;',
  context,
);

const variant = context.CASES.find((entry) =>
  /hilde brauer/i.test(String(entry && entry.setup && entry.setup.klient)));
assert(variant, 'Brauer setup is missing');
const setup = variant.setup;
assert.strictEqual(setup.caseType, 'vermisst', 'Brauer must remain a missing-person case');
assert.strictEqual(setup.familieMatter, true, 'Brauer must remain a family case');
const hildeSetup = setup.setupCast.find((entry) => entry.id === 'hilde_brauer');
assert(hildeSetup && /koepenick/i.test(hildeSetup.departureDestination),
  'Hilde must leave for her configured home, not a case-foreign destination');
assert.strictEqual(setup.targetResolution.mode, 'proof',
  'Erwin has moved on after registration and must resolve through proof');
assert(/keinen vorschuss/i.test(variant.prompt),
  'the opening prompt must forbid an invented family advance payment');
assert(/familiärer Bindung/i.test(variant.prompt),
  'Karl must accept the case because of family, not money');

const locations = new Map(setup.locations.map((location) => [location.name, location]));
const apartment = locations.get('Hilde Brauer Wohnung Koepenick');
const railway = locations.get('Reichsbahn-Lokschuppen Friedrichstrasse');
const laundry = locations.get('Waescherei Koepenick');
const marienfelde = locations.get('Marienfelde Notaufnahmelager');
assert(apartment && railway && laundry && marienfelde,
  'the Brauer investigation route is incomplete');

const clues = setup.locations.flatMap((location) => location.indizien || []);
const clueById = new Map(clues.map((clue) => [clue.id, clue]));
for (const clueId of [
  'erwin_sachen_weg',
  'hilde_westgeld',
  'schliessfach_leer',
  'mahlke_weststrecke',
  'greta_affaere',
  'greta_ruebergehen',
  'schicht_grenze',
  'marienfelde_registratur',
]) {
  assert(clueById.has(clueId), 'missing Brauer clue: ' + clueId);
}
assert.strictEqual(clueById.get('marienfelde_registratur').stage, 4,
  'Marienfelde registration must remain the decisive stage-four proof');
assert(/unverschlossen/i.test(clueById.get('schliessfach_leer').text)
    && /keinen Schlüssel/i.test(clueById.get('schliessfach_leer').text),
  'the locker clue must define access without inventing a key handoff from Hilde');
assert(Number(clueById.get('marienfelde_registratur').abStage) >= 3,
  'Erwin must not be declared safe before the investigation reaches Marienfelde');
assert(setup.requiredProof.test(clueById.get('marienfelde_registratur').text),
  'the configured final proof gate must accept the registration clue');

const imageSet = context.IMAGE_SETS.find((entry) => {
  entry.caseTest.lastIndex = 0;
  return entry.caseTest.test(setup.klient);
});
assert(imageSet, 'Brauer scene image set is missing');
const officeSpec = imageSet.images.find((entry) => {
  entry.test.lastIndex = 0;
  return entry.test.test('karl mauers buero');
});
assert(officeSpec && Array.isArray(officeSpec.presenceVariants),
  'Brauer office needs an opening-client visual variant');
const hildeVariant = officeSpec.presenceVariants.find((entry) => entry.id === 'hilde_brauer');
assert(hildeVariant && hildeVariant.depictsNpcs.includes('hilde_brauer'),
  'the opening visual must contractually depict Hilde');
const hildeImage = path.join(repoRoot, hildeVariant.root, hildeVariant.file);
assert(fs.existsSync(hildeImage), 'Hilde opening image is missing');
assert.deepStrictEqual(readWebpDimensions(hildeImage), { width: 1536, height: 864 },
  'Hilde opening image must use the standard 16:9 scene resolution');
const laundrySpec = imageSet.images.find((entry) => {
  entry.test.lastIndex = 0;
  return entry.test.test('waescherei koepenick');
});
assert(laundrySpec && laundrySpec.depictsNpcs.includes('greta_schliemann'),
  'the laundry image must contractually depict Greta');
assert(/allein/i.test(laundrySpec.alt),
  'the laundry alt contract must exclude the removed phantom railway worker');
assert.deepStrictEqual(
  readWebpDimensions(path.join(repoRoot, imageSet.root, laundrySpec.file)),
  { width: 1536, height: 864 },
  'the corrected laundry image must use the standard 16:9 scene resolution',
);
const marienfeldeSpec = imageSet.images.find((entry) => {
  entry.test.lastIndex = 0;
  return entry.test.test('marienfelde notaufnahmelager');
});
assert(marienfeldeSpec && /Ruth Kellner/.test(marienfeldeSpec.alt) && /Rolf Meissner/.test(marienfeldeSpec.alt),
  'the Marienfelde visual contract must name both central staff NPCs');
assert.deepStrictEqual(
  readWebpDimensions(path.join(repoRoot, imageSet.root, marienfeldeSpec.file)),
  { width: 1536, height: 864 },
  'the corrected Marienfelde image must use the standard 16:9 scene resolution',
);

assert(html.includes("problem.code === 'family_fee_motive_drift'"),
  'family cases need a world-truth repair for invented fee motivation');
assert(html.includes("String(entry.tag || '').toUpperCase() !== 'CLIENT'"),
  'opening clients must participate in the scene-image cast contract');
assert(html.includes('SZENENBILD ausgeblendet: zentrale anwesende Figur fehlt im Bildvertrag'),
  'a mismatched central cast image must fail closed');
assert(html.includes("window.HAUPTUI_AKTIV && typeof cast !== 'undefined' && Array.isArray(cast)"),
  'the current physical scene cast must feed the Haupt-UI target resolver');
assert(html.includes("const _clientDepartureDestination = String((npc && npc.departureDestination) || '').trim();"),
  'client departures must use the setup contract instead of a shared hard-coded destination');
assert(html.includes("_clientDepartureDestination: _clientDepartureDestination || null"),
  'the selected action must retain its configured client departure destination through repair');
assert(html.includes("pendingChosenOption._clientDepartureAfterReply"),
  'the speaking client must remain in the scene roster until the visible reply and departure');
assert(!html.includes("verlaesst das Buero in Richtung Antiquitaetenladen"),
  "the generic client transition must never send every client to Krause's shop");
assert(html.includes("add('fall_berichten', 'Fall berichten')"),
  'a solved case must reopen an exhausted client as the report target');
assert(html.includes('Setze "klient_berichtet": true im JSON.'),
  'the direct client-report action must explicitly request the terminal report flag');

function sourceOf(name) {
  const start = html.indexOf('function ' + name + '(');
  assert(start >= 0, name + ' is missing');
  const bodyStart = html.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < html.length; index++) {
    if (html[index] === '{') depth++;
    if (html[index] === '}') depth--;
    if (depth === 0) return html.slice(start, index + 1);
  }
  assert.fail(name + ' has no closing brace');
}

const uiContext = {
  window: { HAUPTUI_AKTIV: true },
  cast: [{ id: 'hilde_brauer', name: 'Hilde Brauer', tag: 'CLIENT', rolle: 'Klientin' }],
  caseSetup: { caseType: 'vermisst' },
  caseProgress: { gefundeneIndizIds: [] },
  engineCurrentLocation: { name: 'Karl Mauers Buero' },
  getNpcsAtCurrentLocation: () => [],
  getCaseLocations: () => [],
  normForMatch: (value) => String(value || '').toLowerCase().replace(/[_-]+/g, ' ').trim(),
  _npcZustandIstEntfernt: () => false,
  _npcWurdeSchonAngesprochen: () => false,
  _npcHatUngefundeneIndizien: () => true,
  _npcHatOffenenHinweis: () => false,
  _npcOffeneHinweisAktionen: () => [],
  _npcAnzeigename: (npc) => npc.name,
  _ortsFundIndizienErreichbar: () => [],
  _itemsBeiKarl: () => [],
};
vm.createContext(uiContext);
vm.runInContext(sourceOf('_baukastenZiele'), uiContext);
const openingTargets = uiContext._baukastenZiele();
assert.deepStrictEqual(Array.from(openingTargets.personen, (entry) => entry.id), ['hilde_brauer'],
  'a client in the physical scene cast must remain an actionable Haupt-UI target without a location binding');

vm.runInContext(sourceOf('_hauptuiNpc'), uiContext);
const resolvedOpeningClient = uiContext._hauptuiNpc(openingTargets.personen[0]);
assert(resolvedOpeningClient && resolvedOpeningClient.id === 'hilde_brauer',
  'executing a Haupt-UI action must resolve a client from the physical scene cast');

uiContext.caseSetup = {
  caseType: 'vermisst',
  klient: 'Hilde Brauer',
  requiredProof: /marienfelde|registriert/i,
  setupCast: [{ id: 'hilde_brauer', name: 'Hilde Brauer', tag: 'CLIENT' }],
};
uiContext.caseProgress = {
  stage: 3,
  wahrheitErkannt: false,
  klientGesprochen: true,
  indizien: ['Erwin Brauer ist in Marienfelde unter richtigem Namen registriert.'],
};
uiContext._physischesFallzielBlockiertAbschluss = () => false;
uiContext._physischesFallzielIstGeborgen = () => true;
vm.runInContext(sourceOf('_hauptuiKlientenberichtOffen'), uiContext);
assert.strictEqual(
  uiContext._hauptuiKlientenberichtOffen({
    id: 'hilde_brauer',
    name: 'Hilde Brauer',
    tag: 'CLIENT',
    typ: 'person',
    erledigt: true,
  }),
  true,
  'an exhausted family client must reopen when the configured required proof is ready to report',
);

uiContext.cast = [
  { id: 'im_schaffner', name: 'IM "Schaffner"', tag: 'STASI' },
  { name: "IM 'Schaffner'", tag: 'STASI' },
];
uiContext.caseSetup = {
  caseType: 'vermisst',
  setupCast: [{ id: 'im_schaffner', name: 'IM "Schaffner"', tag: 'STASI' }],
};
uiContext._findSetupCastFuzzy = (name) => /"/.test(name)
  ? { id: 'im_schaffner', name: 'IM "Schaffner"', tag: 'STASI' } : null;
const quoteVariantTargets = uiContext._baukastenZiele();
assert.deepStrictEqual(Array.from(quoteVariantTargets.personen, (entry) => entry.id), ['im_schaffner'],
  'quote variants of one setup NPC must collapse to one Haupt-UI target');

const visualContext = {
  caseSetup: {
    locations: [{
      name: 'Waescherei Koepenick',
      npcs: [{ id: 'greta_schliemann', immer: true }],
    }],
    setupCast: [{ id: 'greta_schliemann', name: 'Greta Schliemann' }],
  },
  engineCurrentLocation: { name: 'Waescherei Koepenick' },
  sceneCounter: 8,
  getNpcsAtCurrentLocation: () => [
    { id: 'greta_schliemann', name: 'Greta Schliemann', tag: 'ROMANCE' },
    { id: 'stamm_mfs', name: 'Hauptmann Vollmer', tag: 'STASI' },
  ],
  normForMatch: uiContext.normForMatch,
  _npcZustandGet: () => null,
  _npcZustandIstEntfernt: () => false,
  diag: () => {},
  Set,
};
vm.createContext(visualContext);
vm.runInContext('const _SZENENBILD_BESETZUNG_DIAG_CACHE = new Set();' + sourceOf('_szenenbildPflichtbesetzungPruefen'), visualContext);
const visualProblems = visualContext._szenenbildPflichtbesetzungPruefen(
  { file: 'waescherei.webp', place: 'Waescherei Koepenick', depictsNpcs: ['greta_schliemann'] },
  { personenImRaum: ['Greta Schliemann', 'Hauptmann Vollmer'] },
);
assert(Array.from(visualProblems).some((problem) => /Hauptmann Vollmer/.test(problem)),
  'a dynamic central STASI actor missing from a fixed image must fail the scene-image cast contract');

console.log('BRAUER_FLOW_OK');
