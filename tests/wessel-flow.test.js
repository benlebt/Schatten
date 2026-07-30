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
  'Kaffeestube an der Spandauer Schleuse',
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
  'gaehlert_widerlegt_flucht',
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
assert(clueById.get('bruno_auftrag').prosaPflicht
    && clueById.get('bruno_auftrag').prosaPflicht.replaceOnFallback
    && clueById.get('bruno_auftrag').prosaPflicht.narrativ.test(
      clueById.get('bruno_auftrag').fundText),
  'Bruno must visibly narrate the complete assignment before it is booked');
assert(clueById.get('keibel_einlieferung').prosaPflicht
    && clueById.get('keibel_einlieferung').prosaPflicht.replaceOnFallback
    && /Aktenzeichen/.test(clueById.get('keibel_einlieferung').fundText),
  'the Keibel register clue needs a mandatory narrated payoff, not a dry register summary');
const coffeeRoom = locations.get('Kaffeestube an der Spandauer Schleuse');
assert(coffeeRoom.startBekannt === false
    && coffeeRoom.freischaltBei.includes('flugblatt')
    && coffeeRoom.freischaltBei.includes('lehrlingsmarke'),
  'Werners structured room evidence must unlock the playable false West lead');
assert(clueById.get('gaehlert_widerlegt_flucht').prosaPflicht
    && clueById.get('gaehlert_widerlegt_flucht').prosaPflicht.narrativ.test(
      clueById.get('gaehlert_widerlegt_flucht').fundText),
  'Gaehlert must visibly and canonically disprove the West-flight lead');
for (const [id, label] of [
  ['kollegen_aussage', 'Befrage die Kollegen'],
  ['augenzeuge_festnahme', 'Befrage den Augenzeugen'],
  ['gaehlert_widerlegt_flucht', 'Prüfe Gaehlerts Liste'],
  ['keibel_einlieferung', 'Prüfe das Einlieferungsbuch'],
  ['festnahmeliste_werner', 'Prüfe die Festnahmeliste'],
  ['mfs_lkw_richtung', 'Prüfe die Transportliste'],
]) {
  const clue = clueById.get(id);
  assert.strictEqual(clue.hauptuiActionLabel, label,
    id + ' needs a purposeful visible action instead of a generic filler verb');
  assert(clue.hauptuiActionPrompt && clue.hauptuiActionPrompt.length >= 45,
    id + ' needs an action prompt that explains the intended investigation');
}

const recurringStart = html.indexOf('const STAMMFIGUREN');
const recurringEnd = html.indexOf('// v7.12.1014 (Geld-System Stufe 1)', recurringStart);
assert(recurringStart >= 0 && recurringEnd > recurringStart,
  'recurring character selection block is missing');
const recurringContext = {
  normForMatch(value) {
    return String(value || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  },
};
vm.createContext(recurringContext);
vm.runInContext(
  html.slice(recurringStart, recurringEnd) + ';globalThis.pickRecurring=_waehleStammfigur;',
  recurringContext,
);
assert.strictEqual(recurringContext.pickRecurring(setup), null,
  'global Vollmer must not duplicate the case-specific operational MfS officer Berner');

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
  ['karl mauers buero', 'hauptmann_berner', 'karl-mauers-buero-berner-day.png'],
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

for (const [location, file, dimensions] of [
  ['haus der ministerien', 'haus-der-ministerien-berner-day.png', { width: 1672, height: 941 }],
  ['keibelstrasse', 'keibelstrasse-berner-day.png', { width: 1672, height: 940 }],
]) {
  const spec = specFor(location);
  assert(spec && Array.isArray(spec.presenceVariants),
    location + ' needs a Berner-bound visual variant');
  const npcVariant = spec.presenceVariants.find((entry) => entry.id === 'hauptmann_berner');
  assert(npcVariant && npcVariant.depictsNpcs.includes('hauptmann_berner'),
    location + ' visual must depict Hauptmann Berner');
  assert.strictEqual(npcVariant.file, file, location + ' uses the wrong Berner asset');
  const imagePath = path.join(repoRoot, npcVariant.root || imageSet.root, npcVariant.file);
  assert(fs.existsSync(imagePath) && fs.statSync(imagePath).size > 1500000,
    location + ' Berner asset is missing or implausibly small');
  const png = fs.readFileSync(imagePath);
  assert.deepStrictEqual(
    { width: png.readUInt32BE(16), height: png.readUInt32BE(20) },
    dimensions,
    location + ' Berner asset has the wrong resolution',
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

const accessGuardStart = html.indexOf('function _enforcePendingStasiAccessInScene');
const accessGuardEnd = html.indexOf('// Ein MfS-Zugriff endet nur dann in Haft', accessGuardStart);
assert(accessGuardStart >= 0 && accessGuardEnd > accessGuardStart,
  'pending Stasi access visibility guard is missing');
const accessGuardSource = html.slice(accessGuardStart, accessGuardEnd);
const accessGuardContext = {
  caseProgress: {
    forceCustodyNextScene: true,
    pendingCustodyConfirm: true,
  },
  karlInStasiCustody: false,
  engineCurrentLocation: { name: 'Karl Mauers BÃ¼ro' },
  _stasiEncounterGet() {
    return {
      active: true,
      phase: 'zugriff',
      name: 'Hauptmann Klaus Berner',
      location: 'Karl Mauers BÃ¼ro',
    };
  },
  _stasiEncounterOrtStimmt() { return true; },
  normForMatch(value) {
    return String(value || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  },
  diag() {},
};
vm.createContext(accessGuardContext);
vm.runInContext(accessGuardSource, accessGuardContext);
const forcedArrival = {
  ort: 'Karl Mauers BÃ¼ro',
  szene: 'Du trittst in dein BÃ¼ro und legst die Akten auf den Schreibtisch.',
  personenImRaum: [],
  optionen: [{ text: 'Akten lesen' }],
};
assert.strictEqual(
  accessGuardContext._enforcePendingStasiAccessInScene(forcedArrival),
  true,
  'pending Stasi access should be enforced after an arrival fallback',
);
assert(forcedArrival.personenImRaum.includes('Hauptmann Klaus Berner'),
  'forced Stasi officer must be present in the physical scene roster');
assert(/Hauptmann Klaus Berner/.test(forcedArrival.szene)
    && /roten Dienstausweis/.test(forcedArrival.szene)
    && /kommen jetzt mit/i.test(forcedArrival.szene),
  'forced Stasi officer must be physically and narratively introduced');
assert(Array.isArray(forcedArrival.optionen) && forcedArrival.optionen.length === 0,
  'model options must not compete with the red Stasi confrontation UI');
accessGuardContext.engineCurrentLocation.name = 'Hohenschoenhausen / Genslerstrasse';
const outdoorArrival = {
  ort: 'Hohenschoenhausen / Genslerstrasse',
  szene: 'Du stellst den Opel an der Genslerstrasse ab. Ein MfS-Mann in zivilem grauen Mantel tritt an dein Fenster und tippt gegen das Glas.',
  personenImRaum: [],
  optionen: [{ text: 'Weiterfahren' }],
};
assert.strictEqual(accessGuardContext._enforcePendingStasiAccessInScene(outdoorArrival), true,
  'an outdoor Stasi access must still be normalized to the configured encounter');
assert(/Hauptmann Klaus Berner in zivilem grauen Mantel/.test(outdoorArrival.szene),
  'an already narrated anonymous officer must become the configured named officer');
assert(!/Türrahmen|Flur/.test(outdoorArrival.szene),
  'an outdoor or vehicle access must never inject indoor doorway/corridor prose');
assert.strictEqual((outdoorArrival.szene.match(/Hauptmann Klaus Berner/g) || []).length, 1,
  'the outdoor access must not duplicate the physical Stasi officer');
accessGuardContext.engineCurrentLocation.name = 'Bahnhof Friedrichstrasse';
const stationArrival = {
  ort: 'Bahnhof Friedrichstrasse',
  szene: 'Du sicherst auf dem zugigen Bahnsteig den Durchschlag der Transportkontrolle.',
  personenImRaum: [],
  optionen: [{ text: 'Liste lesen' }],
};
assert.strictEqual(accessGuardContext._enforcePendingStasiAccessInScene(stationArrival), true,
  'a station access must be enforced after an otherwise quiet clue scene');
assert(/Ende des Bahnsteigs/.test(stationArrival.szene)
    && /Treppenabgang/.test(stationArrival.szene),
  'a station access needs platform-specific physical blocking prose');
assert(!/Türrahmen|Flur/.test(stationArrival.szene),
  'a station platform must never receive indoor office access prose');
assert(html.indexOf('_enforcePendingStasiAccessInScene(scene);', accessGuardEnd) > accessGuardEnd,
  'pending Stasi access guard must run after final scene repair');

const finalAccessContext = {
  caseProgress: {
    stage: 4,
    wahrheitErkannt: true,
    forceCustodyNextScene: true,
    pendingCustodyConfirm: true,
  },
  karlInStasiCustody: false,
  engineCurrentLocation: { name: 'Hohenschoenhausen / Genslerstrasse' },
  encounter: {
    active: true,
    introduced: false,
    phase: 'zugriff',
    name: 'Hauptmann Klaus Berner',
    location: 'Hohenschoenhausen / Genslerstrasse',
  },
  clearReason: '',
  _stasiEncounterGet() { return finalAccessContext.encounter; },
  _stasiEncounterClear(reason) {
    finalAccessContext.clearReason = reason;
    finalAccessContext.encounter.active = false;
  },
  _stasiEncounterOrtStimmt() { return true; },
  normForMatch(value) { return String(value || '').toLowerCase(); },
  diag() {},
};
vm.createContext(finalAccessContext);
vm.runInContext(accessGuardSource, finalAccessContext);
assert.strictEqual(finalAccessContext._enforcePendingStasiAccessInScene({
  ort: 'Hohenschoenhausen / Genslerstrasse',
  szene: 'Du sicherst Werners entscheidende Haftakte.',
  personenImRaum: [],
  optionen: [],
}), false, 'fresh MfS access must not overwrite the decisive proof scene');
assert(/entscheidender Fallbeleg/.test(finalAccessContext.clearReason)
    && finalAccessContext.encounter.active === false,
  'the unintroduced final-proof encounter must be cleanly cleared');

const threatStart = html.indexOf('function resolveThreatSpawn');
const threatEnd = html.indexOf('// v7.12.532 (Baustein B2): Gibt aktive', threatStart);
const threatSource = html.slice(threatStart, threatEnd);
assert(/metaCustodyGracePeriod > 0/.test(threatSource)
    && /stasi\|mfs\|staatssicherheit/.test(threatSource)
    && /continue;/.test(threatSource),
  'case-specific MfS threats must respect the post-release grace period');

const rosterStart = html.indexOf('function _findRosterPresenceContradiction');
const rosterEnd = html.indexOf('function _findSceneImageContradiction', rosterStart);
const rosterSource = html.slice(rosterStart, rosterEnd);
assert(/_namedAloneContradiction/.test(rosterSource)
    && /present_roster_denied/.test(rosterSource)
    && /aloneSentence/.test(rosterSource),
  'named alone-prose must be rejected when another required NPC is present');

const falseCustodyStart = html.indexOf('function _findFalsePriorCustodyHistory');
const falseCustodyEnd = html.indexOf('function _findRescueToolDrift', falseCustodyStart);
assert(falseCustodyStart >= 0 && falseCustodyEnd > falseCustodyStart,
  'false prior-custody history guard is missing');
const falseCustodySource = html.slice(falseCustodyStart, falseCustodyEnd);
assert(/SCHLAFEN/.test(falseCustodySource)
    && /_rufCustodyEreignisse/.test(falseCustodySource)
    && /false_prior_custody_history/.test(falseCustodySource),
  'false custody guard must be limited to sleep before the first real custody event');
const falseCustodyContext = {
  karlInStasiCustody: false,
  _rufCustodyEreignisse: 0,
  engineCurrentLocation: { name: 'Karl Mauers BÃ¼ro' },
  _splitWorldTruthSentences(text) { return String(text).match(/[^.!?]+[.!?]?/g) || []; },
  normForMatch(value) {
    return String(value || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/Ã¼/g, 'ue').replace(/Ã¶/g, 'oe').replace(/Ã¤/g, 'ae');
  },
};
vm.createContext(falseCustodyContext);
vm.runInContext(falseCustodySource, falseCustodyContext);
const falseHistory = falseCustodyContext._findFalsePriorCustodyHistory({
  ort: 'Karl Mauers BÃ¼ro',
  szene: 'Du lÃ¤sst das Klopfen vor der Zelle in HohenschÃ¶nhausen hinter dir. Ein Wachhabender lÃ¤sst dich nach stundenlangem VerhÃ¶r ins Freie.',
}, { kategorie: 'SCHLAFEN' });
assert(falseHistory && falseHistory.code === 'false_prior_custody_history',
  'the real Wessel false-release prose must be rejected before first custody');
falseCustodyContext._rufCustodyEreignisse = 1;
assert.strictEqual(falseCustodyContext._findFalsePriorCustodyHistory({
  szene: 'Du lÃ¤sst nach deiner echten Entlassung die Zelle hinter dir.',
}, { kategorie: 'SCHLAFEN' }), null,
  'real later custody history must remain narratively available');
assert(html.includes("problem.code === 'false_prior_custody_history'"),
  'false prior-custody history needs a deterministic prose fallback');
assert(/Du schiebst Werners Akten auf dem Schreibtisch zusammen/.test(html),
  'Wessel office sleep needs a canonical custody-free fallback');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1759 +WesselPurpose'"),
  'release version is stale');

console.log('WESSEL_FLOW_OK');
