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
  /sigrid vogt/i.test(String(entry && entry.setup && entry.setup.klient)));
assert(variant, 'Vogt setup is missing');
const setup = variant.setup;
assert.strictEqual(setup.targetResolution.mode, 'proof',
  'Manfred remains physically unreachable and must resolve through proof');

const locations = new Map(setup.locations.map((location) => [location.name, location]));
for (const name of [
  'Sigrid Vogt Wohnung',
  'Staatsbibliothek Unter den Linden',
  'Manfred Vogts Wohnung West',
  'Tagesspiegel-Redaktion',
  'Hohenschoenhausen / Genslerstrasse',
]) {
  const location = locations.get(name);
  assert(location && location.arrivalFallbackText
      && location.arrivalFallbackText.split(/\s+/).length >= 27,
    'Vogt arrival fallback is missing or too dry at ' + name);
  assert(!/betrittst den schauplatz|entscheidest, wen du ansprichst/i.test(location.arrivalFallbackText),
    'Vogt arrival fallback contains mechanical AI-instruction prose at ' + name);
}

const clues = setup.locations.flatMap((location) => location.indizien || []);
const clueById = new Map(clues.map((clue) => [clue.id, clue]));
assert(clueById.get('sigrid_aussage').fundText.split(/\s+/).length >= 45,
  'Sigrid needs a complete narrated clue payoff');
assert(/abgeschlossen|darf der Einbruch weder erneut stattfinden/i.test(
  clueById.get('bueroeinbruch_spur').fortsetzungsWahrheit),
  'the resolved office break-in must not replay at later locations');
assert.strictEqual(clueById.get('manfred_haftort').stage, 4,
  'the Hohenschönhausen detention record remains the decisive proof');

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
assert(imageSet, 'Vogt scene image set is missing');

function specFor(location) {
  return imageSet.images.find((entry) => {
    entry.test.lastIndex = 0;
    return entry.test.test(location);
  });
}

for (const [location, id, file] of [
  ['staatsbibliothek', 'im_linde', 'staatsbibliothek-linde-day.png'],
  ['hohenschoenhausen', 'hauptmann_pieck', 'hohenschoenhausen-pieck-day.png'],
]) {
  const spec = specFor(location);
  assert(spec && Array.isArray(spec.presenceVariants),
    location + ' needs an NPC-bound visual variant');
  const npcVariant = spec.presenceVariants.find((entry) => entry.id === id);
  assert(npcVariant && npcVariant.depictsNpcs.includes(id),
    location + ' visual must contractually depict ' + id);
  assert.strictEqual(npcVariant.file, file, location + ' uses the wrong visual asset');
  const imagePath = path.join(repoRoot, imageSet.root, npcVariant.file);
  assert(fs.existsSync(imagePath) && fs.statSync(imagePath).size > 500000,
    location + ' visual asset is missing or implausibly small');
  const png = fs.readFileSync(imagePath);
  assert.deepStrictEqual(
    { width: png.readUInt32BE(16), height: png.readUInt32BE(20) },
    { width: 1536, height: 1024 },
    location + ' visual must use the generated 3:2 scene resolution',
  );
}

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

const quoteContext = { caseSetup: { setupCast: [] } };
vm.createContext(quoteContext);
vm.runInContext(sourceOf('stripAccidentalNarrativeQuotes'), quoteContext);
const wrapped = '„Du betrittst die Redaktion. '.padEnd(130, 'x') + '“';
const unwrapped = quoteContext.stripAccidentalNarrativeQuotes(wrapped);
assert(!unwrapped.startsWith('„') && !unwrapped.endsWith('“'),
  'whole-paragraph German narrative quotes must be stripped');
assert.strictEqual(
  quoteContext.stripAccidentalNarrativeQuotes('„Hör zu“, sagt Sigrid.'),
  '„Hör zu“, sagt Sigrid.',
  'genuine short dialogue must retain its quotes',
);

const clueContext = {
  caseProgress: { pendingHauptuiIndiz: { id: 'sigrid_aussage' } },
  diag: () => {},
};
vm.createContext(clueContext);
vm.runInContext(sourceOf('_indizAbschlussProsaSichern'), clueContext);
const clueScene = {
  szene: 'Das Gespräch endet, ohne dass du etwas Neues erfährst. Sigrid bleibt am Tisch.',
};
assert.strictEqual(
  clueContext._indizAbschlussProsaSichern(
    { id: 'sigrid_aussage', fundText: 'Sigrid nennt Manfreds Redaktion und seine Recherche-Kontakte.' },
    clueScene,
  ),
  true,
  'a booked clue must repair prose that denies receiving new information',
);
assert(/Redaktion/.test(clueScene.szene) && !/nichts Neues|ohne dass/i.test(clueScene.szene),
  'the canonical clue payoff must replace the contradictory no-result prose');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1661 +MertensOfficeVisual'"),
  'release version is stale');

console.log('VOGT_FLOW_OK');
