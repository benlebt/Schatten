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

assert(html.includes("problem.code === 'family_fee_motive_drift'"),
  'family cases need a world-truth repair for invented fee motivation');
assert(html.includes("String(entry.tag || '').toUpperCase() !== 'CLIENT'"),
  'opening clients must participate in the scene-image cast contract');
assert(html.includes('SZENENBILD ausgeblendet: zentrale anwesende Figur fehlt im Bildvertrag'),
  'a mismatched central cast image must fail closed');
assert(html.includes("window.HAUPTUI_AKTIV && typeof cast !== 'undefined' && Array.isArray(cast)"),
  'the current physical scene cast must feed the Haupt-UI target resolver');

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

console.log('BRAUER_FLOW_OK');
