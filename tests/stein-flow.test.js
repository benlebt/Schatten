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
  /margarete stein/i.test(String(entry && entry.setup && entry.setup.klient)));
assert(variant, 'Stein setup is missing');
const setup = variant.setup;
const locations = new Map(setup.locations.map((location) => [location.name, location]));

const office = locations.get('Karl Mauers Büro');
assert(office && /Schmuggelroute/.test(office.openingFallbackText)
    && /Margarete Stein/.test(office.openingFallbackText)
    && /Straßenbahn/.test(office.openingFallbackText),
  'Stein opening fallback must contain case, client danger and phone clue');

for (const name of [
  'Margarete Steins Wohnung',
  'Reichsbahndirektion Mitte',
  'West-Berliner Auffangstelle',
  'Stellwerk Schöneweide',
  'Café Kranzler',
]) {
  const location = locations.get(name);
  assert(location && location.arrivalFallbackText
      && location.arrivalFallbackText.split(/\s+/).length >= 28,
    'Stein arrival fallback is missing or too dry at ' + name);
  assert(!/betrittst den schauplatz|entscheidest, wen du ansprichst/i.test(location.arrivalFallbackText),
    'Stein arrival fallback contains mechanical prose at ' + name);
}
assert(/niemals in einer Pistole/.test(
  locations.get('Reichsbahndirektion Mitte').arrivalFallbackText),
  'Wahler must remain a bureaucratic, unarmed antagonist');

const clues = setup.locations.flatMap((location) => location.indizien || []);
const clueById = new Map(clues.map((clue) => [clue.id, clue]));
for (const id of [
  'margarete_aussage',
  'akten_kopie_wohnung',
  'frachtliste_stempel',
  'dienstplan_wahler',
  'hinweis_stellwerk',
  'vera_uebergabekontakt',
  'original_akten',
  'wahler_unterschrift',
  'vera_westperspektive',
]) {
  const clue = clueById.get(id);
  assert(clue && clue.fundText && clue.fundText.split(/\s+/).length >= 20,
    id + ' needs a complete narrated clue payoff');
}
assert(/zerbrach ihre Drahtgestellbrille/.test(clueById.get('margarete_aussage').fundText),
  'Margaretes broken glasses must be explicit world truth');
assert(/Erst mit diesem Hinweis/.test(clueById.get('vera_uebergabekontakt').fundText),
  'Vera must become known through an actual clue');

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
assert(imageSet, 'Stein scene image set is missing');

function specFor(location) {
  return imageSet.images.find((entry) => {
    entry.test.lastIndex = 0;
    return entry.test.test(location);
  });
}

for (const [location, id, file] of [
  ['margarete steins wohnung', 'mann_im_mantel', 'margarete-wohnung-mantel-night.png'],
  ['reichsbahndirektion', 'im_anker', 'reichsbahndirektion-wahler-anker-day.png'],
  ['charite', 'oberleutnant_mertens', 'charite-mertens-day.png'],
  ['karl mauers buero', 'vera_lindqvist', 'karl-mauers-buero-vera-night.png'],
  ['friedrichstrasse', 'margarete_stein', 'friedrichstrasse-margarete-day.png'],
]) {
  const spec = specFor(location);
  assert(spec && Array.isArray(spec.presenceVariants),
    location + ' needs an NPC-bound visual variant');
  const npcVariant = spec.presenceVariants.find((entry) => entry.id === id);
  assert(npcVariant && npcVariant.depictsNpcs.includes(id),
    location + ' visual must depict ' + id);
  assert.strictEqual(npcVariant.file, file, location + ' uses the wrong visual asset');
  const imagePath = path.join(
    repoRoot,
    npcVariant.root || spec.root || imageSet.root,
    npcVariant.file,
  );
  assert(fs.existsSync(imagePath) && fs.statSync(imagePath).size > 500000,
    location + ' visual asset is missing or implausibly small');
  const png = fs.readFileSync(imagePath);
  assert.deepStrictEqual(
    { width: png.readUInt32BE(16), height: png.readUInt32BE(20) },
    { width: 1536, height: 1024 },
    location + ' visual must use the generated 3:2 resolution',
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

const sanitizerContext = {
  caseSetup: { klient: setup.klient, opfer: setup.opfer },
  caseProgress: {
    gefundeneIndizIds: ['margarete_aussage'],
    evidenceSecured: true,
  },
};
vm.createContext(sanitizerContext);
vm.runInContext(sourceOf('sanitizeProsaMetadaten'), sanitizerContext);
const repaired = sanitizerContext.sanitizeProsaMetadaten(
  'Margarete blickt hinter den Gläsern ihrer Drahtgestellbrille auf. '
    + 'Ihre Brille rutscht ihr auf die Nase. Wahler greift nach seiner Dienstwaffe. '
    + 'Du legst ihr die Frachtlisten und die Bestätigung hin. Schätze,, das reicht.',
);
assert(!/Gläsern ihrer Drahtgestellbrille|Brille rutscht|Dienstwaffe|,,/.test(repaired),
  'Stein prop continuity and doubled punctuation must be repaired');
assert(/Abschrift deiner Notizen/.test(repaired),
  'the finale must not hand over originals that Vera already secured');

const securitySource = sourceOf('baueSicherungsButtons');
assert(/_veraBekannt/.test(securitySource)
    && /vera_uebergabekontakt/.test(securitySource)
    && /vera_westperspektive/.test(securitySource),
  'Vera handoff must require actual player knowledge');
assert(/caseSetup\.caseType === 'politisch' && caseProgress\.evidenceSecured/.test(
  sourceOf('getClientGeduldRequirement')),
  'client patience must not demand results after a political evidence handoff');
assert(/if \(keepExisting\)/.test(sourceOf('_naturalMinimumSceneText')),
  'rich prose must not receive generic room filler');
assert(/_npcWirklichInSzene/.test(sourceOf('_szenenbildAnwesenheitsVariante')),
  'image presence variants must also follow unequivocal scene prose');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1657 +ThreatSceneTruth'"),
  'release version is stale');
assert(html.includes('Vom Hackeschen Markt dringen gedämpfte Motorengeräusche')
    && html.includes('Noch passt nicht jedes Stück zusammen'),
  'Stein office arrival fallback must be a complete narrative scene, not two dry instruction-like sentences');

console.log('STEIN_FLOW_OK');
