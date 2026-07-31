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
assert.deepStrictEqual(
  Array.from(setup.stasiEncounterLocations),
  ['Hohenschoenhausen / Genslerstrasse', 'S-Bahnhof Friedrichstrasse'],
  'Pieck may only drive the central Stasi encounter at the two configured Vogt endgame locations',
);

const locations = new Map(setup.locations.map((location) => [location.name, location]));
const office = locations.get('Karl Mauers Büro');
assert(office && office.openingFallbackRequired === true,
  'the Vogt opening must use the canonical one-week commission and office break-in setup');
for (const anchor of ['vor einer Woche', 'seit drei Wochen', 'Journalisten', 'Schloss', 'Vogt-Akten']) {
  assert(office.openingFallbackText.includes(anchor),
    'the Vogt opening fallback is missing its required anchor: ' + anchor);
}
for (const name of [
  'Sigrid Vogt Wohnung',
  'Staatsbibliothek Unter den Linden',
  'Manfred Vogts Wohnung West',
  'Tagesspiegel-Redaktion',
  'Hohenschoenhausen / Genslerstrasse',
  'S-Bahnhof Friedrichstrasse',
]) {
  const location = locations.get(name);
  assert(location && location.arrivalFallbackText
      && location.arrivalFallbackText.split(/\s+/).length >= 27,
    'Vogt arrival fallback is missing or too dry at ' + name);
  assert(!/betrittst den schauplatz|entscheidest, wen du ansprichst/i.test(location.arrivalFallbackText),
    'Vogt arrival fallback contains mechanical AI-instruction prose at ' + name);
  assert.strictEqual(location.arrivalFallbackRequired, true,
    'Vogt location must reject cross-case or relationship-reset arrival drift at ' + name);
}
assert.strictEqual(locations.get('S-Bahnhof Friedrichstrasse').arrivalFallbackRequired, true,
  'the station arrival must use its canonical setup instead of inventing loose clue objects');

const clues = setup.locations.flatMap((location) => location.indizien || []);
const clueById = new Map(clues.map((clue) => [clue.id, clue]));
const purposefulVogtLabels = {
  bueroeinbruch_spur: 'Sichere die Einbruchsspuren',
  sigrid_aussage: 'Befrage Sigrid zu Manfreds Recherche',
  im_linde_protokoll: 'Prüfe Sigrids Ausleihkarten',
  manfred_recherche: 'Prüfe Manfreds Recherchematerial',
  artikel_entwurf: 'Prüfe Manfreds Artikelentwurf',
  manfred_haftort: 'Prüfe die Haftliste',
  pieck_wagen: 'Befrage den Zeugen',
};
for (const [clueId, expectedLabel] of Object.entries(purposefulVogtLabels)) {
  const clue = clueById.get(clueId);
  assert(clue && clue.hauptuiActionLabel === expectedLabel,
    'Vogt clue needs a visible purposeful action: ' + clueId);
  assert(clue.hauptuiActionPrompt && clue.hauptuiActionPrompt.length >= 85,
    'Vogt clue needs a precise generation contract: ' + clueId);
}
assert(clueById.get('sigrid_aussage').fundText.split(/\s+/).length >= 45,
  'Sigrid needs a complete narrated clue payoff');
assert(/abgeschlossen|darf der Einbruch weder erneut stattfinden/i.test(
  clueById.get('bueroeinbruch_spur').fortsetzungsWahrheit),
  'the resolved office break-in must not replay at later locations');
assert(clueById.get('artikel_entwurf').fundText.split(/\s+/).length >= 55,
  'the article clue needs a complete narrated payoff');
assert(clueById.get('artikel_entwurf').prosaPflicht
    && clueById.get('artikel_entwurf').prosaPflicht.replaceOnFallback,
  'the article clue must replace dry one-line AI prose');
assert.strictEqual(clueById.get('manfred_haftort').stage, 4,
  'the Hohenschönhausen detention record remains the decisive proof');
assert.strictEqual(clueById.get('manfred_haftort').hauptuiActionLabel, 'Prüfe die Haftliste',
  'the detention proof must describe the concrete document action instead of generic searching');
assert.strictEqual(clueById.get('pieck_wagen').hauptuiActionLabel, 'Befrage den Zeugen',
  'the station witness must be questioned instead of exposed as a generic look action');
for (const id of [
  'bueroeinbruch_spur',
  'manfred_recherche',
  'im_linde_protokoll',
  'manfred_haftort',
  'pieck_wagen',
]) {
  const clue = clueById.get(id);
  assert(clue && clue.fundText && clue.fundText.split(/\s+/).length >= 55,
    'Vogt clue needs a complete narrated payoff: ' + id);
  assert(clue.prosaPflicht && clue.prosaPflicht.replaceOnFallback,
    'Vogt clue must replace dry or contradictory generated prose: ' + id);
}
assert(/kein geheimes Notizbuch übergeben/i.test(clueById.get('im_linde_protokoll').fundText),
  'the library payoff must explicitly prevent the invented Sigrid notebook handoff');
assert(/Der Wärter/.test(clueById.get('manfred_haftort').fundText),
  'the decisive detention proof must include the visible guard instead of appending a dry roster sentence');
assert(/nennt ruhig seinen Namen und Dienstgrad/.test(
  locations.get('S-Bahnhof Friedrichstrasse').presenceFallbackText),
  'Pieck needs a real first introduction at the station instead of a generic remains-visible suffix');
assert.strictEqual(setup.reportFallbackAlways, true,
  'Vogt needs a deterministic final report because Manfred remains in custody');
for (const anchor of ['Telefonzelle', 'Sigrid in ihrer Wohnung', 'sitzt weiterhin', 'nicht aus dem Hafttrakt holen', '270 Ostmark']) {
  const haystack = anchor === '270 Ostmark'
    ? setup.setupCast.find((entry) => entry.id === 'sigrid_vogt').detail
    : setup.reportFallbackText;
  assert(haystack.includes(anchor), 'Vogt final/payment truth is missing: ' + anchor);
}

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

for (const [location, id, file, dimensions] of [
  ['staatsbibliothek', 'im_linde', 'staatsbibliothek-linde-day.png', { width: 1536, height: 1024 }],
  ['tagesspiegel', 'hauptmann_pieck', 'tagesspiegel-pieck-day.png', { width: 1672, height: 941 }],
  ['hohenschoenhausen', 'hauptmann_pieck', 'hohenschoenhausen-pieck-day.png', { width: 1536, height: 1024 }],
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
    dimensions,
    location + ' visual must use its generated scene resolution',
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

const actionLabelContext = {};
vm.createContext(actionLabelContext);
vm.runInContext(sourceOf('_hauptuiIndizActionLabel') + '\n' + sourceOf('_hauptuiObjektVerben'), actionLabelContext);
assert.strictEqual(
  actionLabelContext._hauptuiObjektVerben(clueById.get('pieck_wagen'))[0].label,
  'Befrage den Zeugen',
  'configured witness action must reach the visible Haupt-UI button',
);
assert.strictEqual(
  actionLabelContext._hauptuiObjektVerben(clueById.get('manfred_haftort'))[0].label,
  'Prüfe die Haftliste',
  'configured detention-record action must reach the visible Haupt-UI button',
);

const abbreviationContext = { expandedAbbreviations: new Set() };
vm.createContext(abbreviationContext);
vm.runInContext(sourceOf('expandAbbreviations'), abbreviationContext);
assert.strictEqual(
  abbreviationContext.expandAbbreviations('Der Entwurf nennt einen Informanten des MfS.'),
  'Der Entwurf nennt einen Informanten der Staatssicherheit.',
  'MfS expansion must preserve German case grammar',
);

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

const proseContext = {
  normForMatch: (value) => String(value || '').toLowerCase(),
  engineCurrentLocation: { name: 'S-Bahnhof Friedrichstrasse' },
  getCaseLocations: () => [locations.get('S-Bahnhof Friedrichstrasse')],
  caseProgress: { pendingHauptuiIndiz: null },
  caseSetup: {},
};
vm.createContext(proseContext);
vm.runInContext(sourceOf('_findUnderwrittenSceneProse'), proseContext);
const stationArrivalProblem = proseContext._findUnderwrittenSceneProse(
  {
    ort: 'S-Bahnhof Friedrichstrasse',
    szene: 'Du steigst am Bahnhof aus. Unter einer Bank findest du einen Schluesselbund, der im Licht metallisch glaenzt. Die Reisenden draengen an dir vorbei, waehrend ein Volkspolizist den Bahnsteig beobachtet.',
  },
  { id: 'REISE', _istReise: true },
);
assert(stationArrivalProblem && stationArrivalProblem.requiredArrivalFallback,
  'a setup-mandated arrival must reject plausible but unsupported generated clue objects');

const closureContext = {
  caseProgress: { istGeloest: true },
  cleared: false,
  _stasiEncounterClear() { closureContext.cleared = true; },
};
vm.createContext(closureContext);
vm.runInContext(sourceOf('_enforcePendingStasiAccessInScene'), closureContext);
assert.strictEqual(
  closureContext._enforcePendingStasiAccessInScene({ szene: 'Karl informiert Sigrid.' }),
  false,
  'a solved case must not append a new unplayable Stasi access',
);
assert.strictEqual(closureContext.cleared, true,
  'the dangling Stasi encounter must be cleared at case closure');

const stasiLocationContext = {
  caseSetup: setup,
  engineCurrentLocation: { name: 'Tagesspiegel-Redaktion' },
  normForMatch: (value) => String(value || '').toLowerCase(),
};
vm.createContext(stasiLocationContext);
vm.runInContext(sourceOf('_stasiEncounterOrtZulaessig'), stasiLocationContext);
assert.strictEqual(stasiLocationContext._stasiEncounterOrtZulaessig(), false,
  'Pieck must not materialize early in the West-Berliner newsroom');
stasiLocationContext.engineCurrentLocation = { name: 'S-Bahnhof Friedrichstrasse' };
assert.strictEqual(stasiLocationContext._stasiEncounterOrtZulaessig(), true,
  'Pieck remains allowed at the configured Vogt endgame station');
stasiLocationContext.engineCurrentLocation = { name: 'Hohenschoenhausen / Genslerstrasse' };
assert.strictEqual(stasiLocationContext._stasiEncounterOrtZulaessig(), true,
  'Pieck remains allowed at the configured detention-site endgame');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1786 +WegenerMatrixTruth'"),
  'release version is stale');

console.log('VOGT_FLOW_OK');
