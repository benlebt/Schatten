const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

const variant = context.CASES.find((entry) =>
  /bruno wessel/i.test(String(entry && entry.setup && entry.setup.klient)));
assert(variant, 'Wessel setup is missing');
const setup = variant.setup;
const locations = new Map(setup.locations.map((location) => [location.name, location]));

const office = locations.get('Karl Mauers Büro');
assert(office && office.openingFallbackText.split(/\s+/).length >= 55,
  'Wessel opening needs the complete client, target, date and assignment');
assert(/Bruno Wessel/.test(office.openingFallbackText)
    && /Werner/.test(office.openingFallbackText)
    && /17\. Juni/.test(office.openingFallbackText)
    && /achthundert Ostmark/i.test(office.openingFallbackText),
  'Wessel opening fallback is missing essential assignment facts');
assert(office.arrivalFallbackText && /unbeschädigt/.test(office.arrivalFallbackText),
  'later office arrivals need a canonical no-break-in fallback');

for (const name of [
  'Wessel-Wohnung',
  'Stalinallee Baustelle',
  'Haus der Ministerien',
  'Volkspolizei-Praesidium Keibelstrasse',
  'Hohenschoenhausen / Genslerstrasse',
  'Bahnhof Friedrichstraße',
]) {
  const location = locations.get(name);
  assert(location && location.arrivalFallbackText
      && location.arrivalFallbackText.split(/\s+/).length >= 30,
    'Wessel arrival fallback is missing or too dry at ' + name);
  assert(!/betrittst den schauplatz|entscheidest, wen du ansprichst/i.test(location.arrivalFallbackText),
    'Wessel arrival fallback contains mechanical prose at ' + name);
}

const clues = setup.locations.flatMap((location) => location.indizien || []);
const clueById = new Map(clues.map((clue) => [clue.id, clue]));
for (const id of [
  'bruno_auftrag',
  'hertha_aussage',
  'werner_zimmer_fund',
  'kollegen_aussage',
  'augenzeuge_festnahme',
  'keibel_einlieferung',
  'festnahmeliste_werner',
  'mfs_lkw_richtung',
]) {
  const clue = clueById.get(id);
  assert(clue && clue.fundText && clue.fundText.split(/\s+/).length >= 25,
    id + ' needs a complete narrated clue payoff');
}
assert(/Werner Wessel/.test(clueById.get('festnahmeliste_werner').fundText)
    && /Untersuchungshaft/.test(clueById.get('festnahmeliste_werner').fundText)
    && /faschistische Provokation/.test(clueById.get('festnahmeliste_werner').fundText),
  'the decisive Wessel proof must be fully stated in visible prose');

const imageStart = html.indexOf('const SHARED_SCENE_IMAGES');
const imageEnd = html.indexOf('function _kesslerSceneNorm', imageStart);
assert(imageStart >= 0 && imageEnd > imageStart, 'scene image configuration is missing');
vm.runInContext(
  html.slice(imageStart, imageEnd) + ';globalThis.IMAGE_SETS=CASE_SCENE_IMAGE_SETS;',
  context,
);
const imageSet = context.IMAGE_SETS.find((entry) => {
  entry.caseTest.lastIndex = 0;
  return entry.caseTest.test(setup.klient);
});
assert(imageSet, 'Wessel scene image set is missing');

function specFor(location) {
  return imageSet.images.find((entry) => {
    entry.test.lastIndex = 0;
    return entry.test.test(location);
  });
}

for (const [location, id, file] of [
  ['karl mauers buero', 'bruno_wessel', 'karl-mauers-buero-bruno-day.png'],
  ['hohenschoenhausen', 'hauptmann_berner', 'hohenschoenhausen-berner-night.png'],
]) {
  const spec = specFor(location);
  assert(spec && Array.isArray(spec.presenceVariants),
    location + ' needs an NPC-bound visual variant');
  const npcVariant = spec.presenceVariants.find((entry) => entry.id === id);
  assert(npcVariant && npcVariant.depictsNpcs.includes(id),
    location + ' visual must depict ' + id);
  assert.strictEqual(npcVariant.file, file, location + ' uses the wrong visual asset');
  const imagePath = path.join(repoRoot, npcVariant.root || imageSet.root, npcVariant.file);
  assert(fs.existsSync(imagePath) && fs.statSync(imagePath).size > 500000,
    location + ' visual asset is missing or implausibly small');
  const png = fs.readFileSync(imagePath);
  assert.deepStrictEqual(
    { width: png.readUInt32BE(16), height: png.readUInt32BE(20) },
    { width: 1536, height: 1024 },
    location + ' visual must use the generated 3:2 resolution',
  );
}

const sanitizerStart = html.indexOf('function sanitizeProsaMetadaten');
const sanitizerEnd = html.indexOf('// v7.12.1275', sanitizerStart);
const sanitizerSource = html.slice(sanitizerStart, sanitizerEnd);
const sanitizerContext = {};
vm.createContext(sanitizerContext);
vm.runInContext(sanitizerSource, sanitizerContext);
assert.strictEqual(
  sanitizerContext.sanitizeProsaMetadaten('Im Büro ist die Stasi-Tension greifbar.'),
  'Im Büro ist der Druck der Staatssicherheit greifbar.',
  'internal Stasi-Tension wording must never reach visible prose',
);

const underwrittenStart = html.indexOf('function _findUnderwrittenSceneProse');
const underwrittenEnd = html.indexOf('function _naturalMinimumSceneText', underwrittenStart);
const underwrittenSource = html.slice(underwrittenStart, underwrittenEnd);
assert(/pendingEvidence\.fundText \|\| pendingEvidence\.text/.test(underwrittenSource),
  'clue completeness must also validate clues that only have configured text');
assert(/openingBriefMissing/.test(underwrittenSource),
  'opening scenes must be checked for complete client and target briefing');
assert(/unsupportedOfficeIntrusion/.test(underwrittenSource),
  'unconfigured office break-ins need an engine-wide prose guard');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1636 +KesslerOpeningDedup'"),
  'release version is stale');

console.log('WESSEL_FLOW_OK');
