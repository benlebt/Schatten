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
const wahler = setup.setupCast.find((npc) => npc && npc.id === 'wahler');

const office = locations.get('Karl Mauers Büro');
assert(office && /Schmuggelroute/.test(office.openingFallbackText)
    && /Margarete Stein/.test(office.openingFallbackText)
    && /Straßenbahn/.test(office.openingFallbackText),
  'Stein opening fallback must contain case, client danger and phone clue');
assert(office && !/Wahler/.test(office.arrivalFallbackText),
  'Stein office fallback must not reveal Wahler before an evidence click');
assert(wahler && Array.isArray(wahler.knownAfterEvidence)
    && wahler.knownAfterEvidence.includes('margarete_aussage')
    && wahler.knownAfterEvidence.includes('akten_kopie_wohnung'),
  'Wahler identity must remain evidence-gated away from his configured encounter');

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
  'uebergabe_beobachtet',
  'notiz_wahler_gleis',
  'vera_uebergabekontakt',
  'original_akten',
  'wahler_unterschrift',
  'vera_westperspektive',
  'lemke_belastet_wahler',
  'anker_kontakt_hinweis',
]) {
  const clue = clueById.get(id);
  assert(clue && clue.fundText && clue.fundText.split(/\s+/).length >= 20,
    id + ' needs a complete narrated clue payoff');
}
assert(/zerbrach ihre Drahtgestellbrille/.test(clueById.get('margarete_aussage').fundText),
  'Margaretes broken glasses must be explicit world truth');
assert(/Erst mit diesem Hinweis/.test(clueById.get('vera_uebergabekontakt').fundText),
  'Vera must become known through an actual clue');
for (const [id, beat] of [
  ['frachtliste_stempel', 'schmuggelroute_belegt'],
  ['uebergabe_beobachtet', 'schmuggelroute_belegt'],
  ['original_akten', 'schmuggelroute_belegt'],
  ['wahler_unterschrift', 'wahler_verantwortlich'],
  ['lemke_belastet_wahler', 'wahler_verantwortlich'],
  ['anker_kontakt_hinweis', 'im_anker_identifiziert'],
]) {
  assert.deepStrictEqual(Array.from(clueById.get(id).politicalBeatIds || []), [beat],
    id + ' must book its political evidence beat deterministically');
  assert(clueById.get(id).prosaPflicht || id === 'original_akten',
    id + ' needs a narrated evidence safeguard');
}
for (const clue of clues) {
  assert(!(clue.politicalBeatIds || []).includes('akten_gesichert')
      && !(clue.politicalBeatIds || []).includes('margarete_gesichert'),
    'security beats must remain real player actions, never clue side effects');
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
assert(imageSet, 'Stein scene image set is missing');

function specFor(location) {
  return imageSet.images.find((entry) => {
    entry.test.lastIndex = 0;
    return entry.test.test(location);
  });
}

for (const [location, id, file, width = 1536, height = 1024] of [
  ['margarete steins wohnung', 'mann_im_mantel', 'margarete-wohnung-mantel-night.png'],
  ['reichsbahndirektion', 'im_anker', 'reichsbahndirektion-wahler-anker-day.png'],
  ['charite', 'oberleutnant_mertens', 'charite-mertens-day.png'],
  ['karl mauers buero', 'oberleutnant_mertens', 'karl-mauers-buero-mertens-arrest-day-v1661.png', 1672, 941],
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
    { width, height },
    location + ' visual must use its intended generated resolution',
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

sanitizerContext.caseProgress = {
  gefundeneIndizIds: [],
  evidenceSecured: false,
};
const repairedBeforeEvidence = sanitizerContext.sanitizeProsaMetadaten(
  'Margarete sinkt auf einen Stuhl. Ihre Brille rutscht ihr fast von der Nase.',
);
assert(!/Brille rutscht|von der Nase/.test(repairedBeforeEvidence)
    && /Nasenwurzel/.test(repairedBeforeEvidence),
  'the broken-glasses truth must apply from the fixed apartment arrival, before her formal clue');

const evidenceGateDiagnostics = [];
const evidenceGateContext = {
  caseSetup: {
    setupCast: [wahler],
  },
  caseProgress: {
    gefundeneIndizIds: [],
  },
  engineCurrentLocation: {
    name: 'Margarete Steins Wohnung',
  },
  getCaseLocations: () => setup.locations,
  _npcOrtsbindungEintragAktiv: () => true,
  _npcWurdeSchonAngesprochen: () => false,
  diag: (type, message) => evidenceGateDiagnostics.push(type + ':' + message),
};
vm.createContext(evidenceGateContext);
vm.runInContext(
  sourceOf('normForMatch') + '\n'
    + sourceOf('_findEvidenceGatedNpcKnowledgeLeak') + '\n'
    + sourceOf('repairEvidenceGatedNpcProse'),
  evidenceGateContext,
);
const prematureWahler = {
  szene: 'Du nennst keine Namen und erwähnst beiläufig Wahler. Der Mann im Mantel tritt zurück.',
  personenImRaum: ['Margarete Stein', 'Mann im langen Mantel'],
};
const prematureLeak = evidenceGateContext._findEvidenceGatedNpcKnowledgeLeak(prematureWahler);
assert(prematureLeak && prematureLeak.code === 'evidence_gated_npc_knowledge_leak',
  'world-truth validation must reject Wahler before his evidence or encounter');
evidenceGateContext.repairEvidenceGatedNpcProse(prematureWahler);
assert(!/Wahler/.test(prematureWahler.szene) && /Mann im Mantel/.test(prematureWahler.szene),
  'the final repair boundary must remove only the unearned Wahler sentence');
assert(evidenceGateDiagnostics.some((line) => line.includes('BELEG-GATE repariert')),
  'premature identity repair needs an exported diagnostic');

evidenceGateContext.engineCurrentLocation = { name: 'Reichsbahndirektion Mitte' };
assert.strictEqual(
  evidenceGateContext._findEvidenceGatedNpcKnowledgeLeak({
    szene: 'Direktor Bernhard Wahler erwartet dich hinter seinem Schreibtisch.',
  }),
  null,
  'the configured personal encounter must reveal Wahler without prior evidence',
);
evidenceGateContext.engineCurrentLocation = { name: 'Margarete Steins Wohnung' };
evidenceGateContext.caseProgress.gefundeneIndizIds.push('margarete_aussage');
assert.strictEqual(
  evidenceGateContext._findEvidenceGatedNpcKnowledgeLeak({
    szene: 'Margarete nennt Direktor Bernhard Wahler als ihren Vorgesetzten.',
  }),
  null,
  'Margaretes found statement must unlock Wahler for later prose',
);

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
const departedVisualContext = {
  normForMatch: (value) => String(value || '').toLowerCase().replace(/_/g, ' '),
  getNpcsAtCurrentLocation: () => [{ id: 'margarete_stein', name: 'Margarete Stein' }],
  _konfrontationInAktuellerSzeneSichtbar: () => false,
  _npcWirklichInSzene: () => true,
  _npcNachProsaAbgangAbwesend: (id) => /mann im mantel/.test(String(id || '').replace(/_/g, ' ')),
  _npcZustandGet: () => null,
  _npcZustandIstEntfernt: () => false,
};
vm.createContext(departedVisualContext);
vm.runInContext(sourceOf('_szenenbildAnwesenheitsVariante'), departedVisualContext);
const steinApartmentVisual = {
  file: 'margarete-stein-wohnung.webp',
  presenceVariants: [{
    id: 'mann_im_mantel',
    file: 'margarete-wohnung-mantel-night.png',
  }],
};
assert.strictEqual(
  departedVisualContext._szenenbildAnwesenheitsVariante(steinApartmentVisual, {
    szene: 'Der Mann im Mantel wendet sich ab. Seine Schritte hallen im Treppenhaus, bis die Haustür ins Schloss fällt.',
    personenImRaum: ['Margarete Stein'],
  }).file,
  'margarete-stein-wohnung.webp',
  'a departed opponent mentioned in the farewell prose must not remain in the follow-up image',
);
const markEvidenceSource = sourceOf('_markiereIndizGefunden');
assert(/ind\.politicalBeatIds/.test(markEvidenceSource)
    && /gueltigePolitBeats/.test(markEvidenceSource)
    && /POLIT-BEAT/.test(markEvidenceSource),
  'core evidence must book political insight beats by ID');
assert(/beat\.id !== 'akten_gesichert'/.test(markEvidenceSource)
    && /beat\.id !== 'margarete_gesichert'/.test(markEvidenceSource),
  'deterministic clue booking must protect action-only security beats');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1722 +GoerkeVpStageVisual'"),
  'release version is stale');
assert(html.includes('Vom Hackeschen Markt dringen gedämpfte Motorengeräusche')
    && html.includes('Noch passt nicht jedes Stück zusammen'),
  'Stein office arrival fallback must be a complete narrative scene, not two dry instruction-like sentences');

console.log('STEIN_FLOW_OK');
