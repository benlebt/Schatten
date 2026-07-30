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
assert.strictEqual(setup.requiredProofConfirmsSafety, true,
  'the Marienfelde proof must change the finale from uncertain to confirmed safety');
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
const station = locations.get('Bahnhof Friedrichstraße');
assert(apartment && railway && laundry && marienfelde,
  'the Brauer investigation route is incomplete');
assert.strictEqual(setup.abschlussOrt, 'Karl Mauers Büro',
  'the family proof case needs one explicit personal report appointment');
assert(setup.reportFallbackText && setup.reportFallbackText.split(/\s+/).length >= 65
    && /Marienfelder Registratur/.test(setup.reportFallbackText)
    && /im Westen in Sicherheit/.test(setup.reportFallbackText)
    && /Hilde/.test(setup.reportFallbackText),
  'the family proof case needs a complete narrated final-report fallback');
assert(setup.locations[0].openingFallbackText.split(/\s+/).length >= 55
    && /Hilde Brauer/.test(setup.locations[0].openingFallbackText)
    && /Reichsbahn-Schaffner/.test(setup.locations[0].openingFallbackText)
    && /Familienfall/.test(setup.locations[0].openingFallbackText),
  'the opening fallback must be a complete narrated family-case handoff');
for (const location of [apartment, railway, laundry, station]) {
  assert(location && location.arrivalFallbackText
      && location.arrivalFallbackText.split(/\s+/).length >= 40,
    'Brauer arrival fallback is too dry at ' + (location && location.name));
  assert(!/nächsten belegbaren Ermittlungsschritt|nimmst den Raum aufmerksam/i.test(location.arrivalFallbackText),
    'Brauer arrival fallback contains mechanical AI-instruction prose at ' + location.name);
}

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
const purposefulBrauerLabels = {
  erwin_sachen_weg: 'Prüfe Erwins Schrank',
  hilde_westgeld: 'Befrage Hilde zu Erwins Plänen',
  schliessfach_leer: 'Prüfe Erwins Dienstschließfach',
  mahlke_weststrecke: 'Befrage Mahlke zur Weststrecke',
  greta_affaere: 'Befrage Greta zu Erwin',
  greta_ruebergehen: 'Frage Greta nach Erwins Abschied',
  schicht_grenze: 'Prüfe Erwins Dienstplan',
  marienfelde_registratur: 'Prüfe das Marienfelder Register',
};
for (const [clueId, expectedLabel] of Object.entries(purposefulBrauerLabels)) {
  const clue = clueById.get(clueId);
  assert.strictEqual(clue.hauptuiActionLabel, expectedLabel,
    'Brauer clue needs a visible purposeful action: ' + clueId);
  assert(clue.hauptuiActionPrompt && clue.hauptuiActionPrompt.length >= 90,
    'Brauer clue needs a sufficiently precise generation contract: ' + clueId);
}
assert.strictEqual(clueById.get('marienfelde_registratur').stage, 4,
  'Marienfelde registration must remain the decisive stage-four proof');
assert(clueById.get('schicht_grenze').fundText
    && clueById.get('schicht_grenze').fundText.split(/\s+/).length >= 45
    && /Bahnhof Friedrichstraße/.test(clueById.get('schicht_grenze').fundText)
    && !/Lokschuppen|Dienststelle des Lokschuppens/i.test(clueById.get('schicht_grenze').fundText),
  'the station clue needs full station prose without drifting back to the locomotive shed');
assert(clueById.get('schicht_grenze').prosaPflicht
    && clueById.get('schicht_grenze').prosaPflicht.replaceOnFallback === true,
  'the station clue must enforce its authored location truth when generated prose drifts');
assert(clueById.get('marienfelde_registratur').fundText
    && clueById.get('marienfelde_registratur').fundText.split(/\s+/).length >= 50
    && /vor vier Tagen/.test(clueById.get('marienfelde_registratur').fundText)
    && /im Westen in Sicherheit/.test(clueById.get('marienfelde_registratur').fundText),
  'the decisive proof needs complete positive prose, not an uncertain ledger fragment');
assert(clueById.get('marienfelde_registratur').prosaPflicht
    && clueById.get('marienfelde_registratur').prosaPflicht.replaceOnFallback === true,
  'the decisive safety proof must replace contradictory generated prose');
assert(/unverschlossen/i.test(clueById.get('schliessfach_leer').text)
    && /keinen Schlüssel/i.test(clueById.get('schliessfach_leer').text),
  'the locker clue must define access without inventing a key handoff from Hilde');
assert(clueById.get('schliessfach_leer').fundText
    && clueById.get('schliessfach_leer').fundText.split(/\s+/).length >= 45
    && /Blechspinde|Dienst-Schließfach/.test(clueById.get('schliessfach_leer').fundText)
    && !/^Erwins unverschlossenes Dienst-Schliessfach/.test(clueById.get('schliessfach_leer').fundText),
  'the locker inspection needs narrated prose instead of the raw clue ledger');
assert(Number(clueById.get('marienfelde_registratur').abStage) >= 3,
  'Erwin must not be declared safe before the investigation reaches Marienfelde');
assert(setup.requiredProof.test(clueById.get('marienfelde_registratur').text),
  'the configured final proof gate must accept the registration clue');
assert(html.includes("indizId: 'required_proof_confirms_safety'"),
  'a confirmed Marienfelde registration must reject later uncertainty prose');
assert(html.includes('ABSCHLUSS-NACHWEIS BESTÄTIGT SICHERHEIT'),
  'the finale prompt must state the positive truth after the safety proof');
assert(html.includes("_istFamilienauftrag = !!(caseSetup && caseSetup.familieMatter)"),
  'family cases must be classified as non-paying assignments');
assert(html.includes('Für diesen Familienfall gibt es kein Honorar.'),
  'the family-case ending must not announce a fee');

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
assert(!/allein|reichsbahn|schaffner/i.test(laundrySpec.alt),
  'the laundry alt contract must exclude the phantom railway worker without denying dynamic actors');
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
const railwaySpec = imageSet.images.find((entry) => {
  entry.test.lastIndex = 0;
  return entry.test.test('reichsbahn lokschuppen friedrichstrasse');
});
assert(railwaySpec && Array.isArray(railwaySpec.presenceVariants),
  'the locomotive shed needs a presence-aware Vollmer confrontation visual');
const shedVollmerVariant = railwaySpec.presenceVariants.find((entry) => entry.id === 'stamm_mfs');
assert(shedVollmerVariant
    && shedVollmerVariant.depictsNpcs.includes('helmut_mahlke')
    && shedVollmerVariant.depictsNpcs.includes('im_schaffner')
    && shedVollmerVariant.depictsNpcs.includes('stamm_mfs'),
  'the Vollmer shed image must contractually depict every persistent scene NPC');
const shedVollmerImage = path.join(repoRoot, shedVollmerVariant.root, shedVollmerVariant.file);
assert(fs.existsSync(shedVollmerImage) && fs.statSync(shedVollmerImage).size > 1000000,
  'the dedicated four-person shed image is missing or implausibly small');
const shedPng = fs.readFileSync(shedVollmerImage);
assert.strictEqual(shedPng.toString('ascii', 1, 4), 'PNG',
  'the dedicated four-person shed image must be a real PNG');
assert(shedPng.readUInt32BE(16) >= 1500 && shedPng.readUInt32BE(20) >= 840,
  'the dedicated four-person shed image must retain scene-scale resolution');
const vollmerImage = path.join(repoRoot, 'assets', 'scenes', 'brauer',
  'bahnhof-friedrichstrasse-vollmer-day.png');
assert(fs.existsSync(vollmerImage) && fs.statSync(vollmerImage).size > 500000,
  'the dedicated Vollmer station confrontation image is missing or implausibly small');
assert(html.includes('function _brauerVollmerKonfrontationVisual(scene)'),
  'Brauer needs a dynamic station visual for the Vollmer confrontation');
assert(html.includes("depictsNpcs: ['stamm_mfs']"),
  'the Vollmer confrontation image must contractually depict its active antagonist');

assert(html.includes("problem.code === 'family_fee_motive_drift'"),
  'family cases need a world-truth repair for invented fee motivation');
assert(html.includes("String(entry.tag || '').toUpperCase() !== 'CLIENT'"),
  'opening clients must participate in the scene-image cast contract');
assert(html.includes('SZENENBILD bleibt als Ortsmotiv sichtbar: Bildbesetzung unvollständig'),
  'a mismatched cast contract must stay diagnosable without collapsing the entire scene image');
assert(html.includes("window.HAUPTUI_AKTIV && typeof cast !== 'undefined' && Array.isArray(cast)"),
  'the current physical scene cast must feed the Haupt-UI target resolver');
assert(html.includes("typeof _abschlussTerminAmOrt === 'function' && _abschlussTerminAmOrt(_uiLoc)"),
  'the Haupt-UI location filter must preserve the client at a ready report appointment');
assert(html.includes("if (terminLoc && _abschlussTerminAmOrt(terminLoc)) return true;"),
  'the canonical NPC location guard must accept a client at a ready report appointment');
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

const worldTruthSource = sourceOf('validateSceneWorldTruth');
assert(worldTruthSource.includes('option._pendingIndizId')
    && worldTruthSource.includes("_gefundenWahr.push(option._pendingIndizId)"),
  'a newly collected proof must already count as world truth during prose validation');
const centralProofGuard = html.slice(
  html.indexOf('const _istAbschlussSzene'),
  html.indexOf('if (_istAbschlussSzene', html.indexOf('const _istAbschlussSzene')),
);
assert(!/stage\s*\|\|\s*0/.test(centralProofGuard),
  'a high investigation stage alone must never trigger finale-proof rewriting');
assert(html.includes('für den verstorbenen Regierenden Bürgermeister West-Berlins, Ernst Reuter')
    && html.includes('wie sie in jeder überfüllten Ambulanz in der Luft liegt'),
  'the prose sanitizer must preserve Reuter and Marienfelde political geography');

const serializedSetup = JSON.parse(JSON.stringify(setup));
delete serializedSetup.abschlussOrt;
delete serializedSetup.requiredProofPartialText;
delete serializedSetup.requiredProofConfirmsSafety;
delete serializedSetup.reportFallbackText;
serializedSetup.requiredProof = {};
delete serializedSetup.locations[0].arrivalFallbackText;
const serializedLaundry = serializedSetup.locations.find((entry) =>
  entry.name === 'Waescherei Koepenick');
delete serializedLaundry.arrivalFallbackText;
const serializedRailway = serializedSetup.locations.find((entry) =>
  entry.name === 'Reichsbahn-Lokschuppen Friedrichstrasse');
delete serializedRailway.indizien.find((entry) => entry.id === 'schliessfach_leer').fundText;
const migrationContext = {
  caseSetup: serializedSetup,
  INTRO_VARIANTS: context.CASES,
  normForMatch: (value) => String(value || '').toLowerCase().replace(/[_-]+/g, ' ').trim(),
};
vm.createContext(migrationContext);
vm.runInContext(sourceOf('_migriereCaseSetupOrte'), migrationContext);
migrationContext._migriereCaseSetupOrte();
assert(Object.prototype.toString.call(migrationContext.caseSetup.requiredProof) === '[object RegExp]'
    && migrationContext.caseSetup.requiredProof.test('im Notaufnahmelager registriert'),
  'restoring a JSON save must recover the canonical requiredProof RegExp');
assert.strictEqual(migrationContext.caseSetup.abschlussOrt, 'Karl Mauers Büro',
  'restoring an older save must migrate the configured report location');
assert.strictEqual(migrationContext.caseSetup.reportFallbackText, setup.reportFallbackText,
  'restoring an older save must migrate the narrated final report');
assert(migrationContext.caseSetup.locations[0].arrivalFallbackText
    && serializedLaundry.arrivalFallbackText
    && serializedRailway.indizien.find((entry) => entry.id === 'schliessfach_leer').fundText,
  'restoring an older save must migrate authored arrival and evidence prose');

const proofContext = {
  caseSetup: setup,
  caseProgress: {
    stage: 3,
    klientGesprochen: true,
    indizien: [clueById.get('marienfelde_registratur').text],
    gefundeneIndizIds: ['marienfelde_registratur'],
  },
};
vm.createContext(proofContext);
vm.runInContext(sourceOf('_requiredProofErfuellt'), proofContext);
assert.strictEqual(proofContext._requiredProofErfuellt(), true,
  'the collected Marienfelde registration must count as the proof-case breakthrough');

proofContext.caseProgress.indizien = [clueById.get('schicht_grenze').text];
assert.strictEqual(proofContext._requiredProofErfuellt(), false,
  'a border-route clue alone must not pretend that Erwin is confirmed safe');
proofContext.caseProgress.indizien = [clueById.get('marienfelde_registratur').text];

const reportFallbackContext = {
  caseSetup: setup,
  caseProgress: proofContext.caseProgress,
  normForMatch: (value) => String(value || '').toLowerCase(),
};
vm.createContext(reportFallbackContext);
vm.runInContext(sourceOf('_worldTruthNaturalSocialFallbackText'), reportFallbackContext);
const narratedReport = reportFallbackContext._worldTruthNaturalSocialFallbackText(
  'Hilde Brauer',
  { id: 'HAUPTUI_KLIENTENBERICHT' },
  'social_target_missing',
);
assert(narratedReport.split(/\s+/).length >= 65
    && /Marienfelder Registratur/.test(narratedReport)
    && !/ohne dass du etwas Neues erfÃ¤hrst/.test(narratedReport),
  'a repaired client report must remain a real finale, never an empty social fallback');

const earlyPoliteFallback = reportFallbackContext._worldTruthNaturalSocialFallbackText(
  'Helmut Mahlke',
  {
    id: 'NPC_sozial_normal',
    _sozialTonart: 'normal',
    _sozialVorHinweis: true,
    _sozialErfolg: false,
    _npcInteraktion: { npcName: 'Helmut Mahlke', verb: 'sozial_normal' },
    _anzeigeText: 'Karl: Normal und höflich reden · Renommee +1 · Rufvorteil',
    text: 'Karl spricht Helmut Mahlke ruhig, freundlich und ohne Druck an.',
  },
  'social_target_missing',
);
assert(/ruhig, höflich/.test(earlyPoliteFallback)
    && /ohne Streit/.test(earlyPoliteFallback)
    && !/harte Stimme|trittst dicht|Bedrohung/.test(earlyPoliteFallback),
  'an early polite Brauer conversation must never be repaired as a hard threat merely because its prompt says "ohne Druck"');
assert(sourceOf('npcInteraktion').includes('_sozialVorHinweis: !!verb._sozialVorHinweis'),
  'the selected early-conversation state must reach world-truth fallback repair');

const reputationInformantContext = {
  karlAkte: { ruf: { renommee: 5, haerte: -5 } },
  normForMatch: (value) => String(value || '').toLowerCase().replace(/[_-]+/g, ' ').trim(),
};
vm.createContext(reputationInformantContext);
vm.runInContext(sourceOf('_sozialTonartArt')
  + '\n' + sourceOf('_sozialStandardErfolg')
  + '\n' + sourceOf('_sozialErfolgNachRuf')
  + '\n' + sourceOf('_sozialStandardTonart')
  + '\n' + sourceOf('_sozialTonartMitRuf'), reputationInformantContext);
const politeMahlkeBase = reputationInformantContext._sozialStandardTonart('normal', {
  id: 'helmut_mahlke',
  name: 'Helmut Mahlke',
  tag: 'INFORMANT',
});
const politeMahlkeWithReputation = reputationInformantContext._sozialTonartMitRuf(
  politeMahlkeBase,
  { id: 'helmut_mahlke', name: 'Helmut Mahlke', tag: 'INFORMANT' },
);
assert.strictEqual(politeMahlkeWithReputation.erfolg, true,
  'high renown must visibly rescue Mahlke\'s otherwise closed polite route');
assert.strictEqual(politeMahlkeWithReputation.informantGratis, true,
  'a reputation-rescued informant route must open the evidence gate without payment or violence');

const restoredReportContext = {
  caseSetup: setup,
  caseProgress: { stage: 4, istGelöst: true, abschlussSzeneGerendert: true },
  currentScene: { szene: 'Das Gespräch endet, ohne dass du etwas Neues erfährst.' },
  lastFullScene: { szene: 'Das Gespräch endet, ohne dass du etwas Neues erfährst.' },
  logEntries: [
    { type: 'choice', text: 'Fall berichten · Hilde Brauer' },
    { type: 'scene', text: 'Das Gespräch endet, ohne dass du etwas Neues erfährst.' },
  ],
};
vm.createContext(restoredReportContext);
vm.runInContext(sourceOf('_configuredFinalReportFallbackText'), restoredReportContext);
vm.runInContext(sourceOf('_repairRestoredFinalReportProse'), restoredReportContext);
assert.strictEqual(
  restoredReportContext._repairRestoredFinalReportProse(),
  true,
  'an underwritten saved finale must be repaired while restoring the completed case',
);
assert.strictEqual(restoredReportContext.currentScene.szene, setup.reportFallbackText);
assert.strictEqual(restoredReportContext.lastFullScene.szene, setup.reportFallbackText);
assert.strictEqual(restoredReportContext.logEntries[1].text, setup.reportFallbackText);

const genericThreadContext = {
  caseSetup: setup,
  caseProgress: proofContext.caseProgress,
  getCaseLocations: () => [],
  _physischesFallzielStatus: () => null,
  _requiredProofErfuellt: () => true,
};
vm.createContext(genericThreadContext);
vm.runInContext(sourceOf('_hauptuiGenerischeFaeden'), genericThreadContext);
const reportThread = genericThreadContext._hauptuiGenerischeFaeden()
  .find((thread) => thread.id === 'bericht');
assert(reportThread && reportThread.status === 'bereit'
    && reportThread.ort === 'Karl Mauers Büro'
    && Array.from(reportThread.targetIds).includes('hilde_brauer'),
  'the generic thread model must expose Hilde at the configured report appointment');

const reportPresenceContext = {
  engineCurrentLocation: { name: 'Karl Mauers Büro' },
  currentScene: { szene: 'Du ordnest die gesicherten Hinweise.', personenImRaum: [] },
  caseSetup: setup,
  caseProgress: proofContext.caseProgress,
  gameTimeIdx: 4,
  gameDay: 2,
  TIMES_OF_DAY: ['morgen', 'vormittag', 'mittag', 'nachmittag', 'abend', 'nacht'],
  getCaseLocations: () => [{ name: 'Karl Mauers Büro', npcs: [] }],
  normForMatch: (value) => String(value || '').toLowerCase().replace(/[_-]+/g, ' ').trim(),
  _hauptuiAlleOffenenFaeden: () => [{
    id: 'bericht',
    ort: 'Karl Mauers Büro',
    status: 'bereit',
    targetIds: ['hilde_brauer'],
  }],
  _istKlient: (name, id) => id === 'hilde_brauer' || name === 'Hilde Brauer',
  _resolveNpcIdentity: () => ({ id: 'hilde_brauer', name: 'Hilde Brauer', tag: 'CLIENT' }),
  _npcZustandIstEntfernt: () => false,
  _npcNachProsaAbgangAbwesend: () => false,
  _threatAktiveSpawns: [],
};
vm.createContext(reportPresenceContext);
vm.runInContext(sourceOf('_abschlussTerminAmOrt'), reportPresenceContext);
vm.runInContext(sourceOf('getNpcsAtCurrentLocation'), reportPresenceContext);
const appointmentRoster = reportPresenceContext.getNpcsAtCurrentLocation();
assert.deepStrictEqual(Array.from(appointmentRoster, (entry) => entry.id), ['hilde_brauer'],
  'the report appointment must restore the client to prose, UI, and image truth');

const apartmentRosterContext = {
  engineCurrentLocation: { name: 'Hilde Brauer Wohnung Koepenick' },
  normForMatch: (value) => String(value || '').toLowerCase(),
  getNpcsAtCurrentLocation: () => [
    { id: 'hilde_brauer', name: 'Hilde Brauer' },
  ],
  _npcZustandIstEntfernt: () => false,
  _worldTruthAliases: (id, entry) => [String(id || '').replace(/_/g, ' '), entry.name],
  _worldTruthHasAlias: (text, aliases) => aliases.some((alias) =>
    String(text || '').toLowerCase().includes(String(alias || '').toLowerCase())),
};
vm.createContext(apartmentRosterContext);
vm.runInContext(sourceOf('_findRosterPresenceContradiction'), apartmentRosterContext);
const falseAloneApartment = apartmentRosterContext._findRosterPresenceContradiction({
  szene: 'Du stehst allein in der kleinen Wohnung und öffnest Erwins Kleiderschrank.',
  personenImRaum: [],
});
assert(falseAloneApartment && falseAloneApartment.code === 'present_roster_denied',
  'Brauer clue prose must not call the apartment empty while Hilde remains in UI and scene image');

const uiContext = {
  window: { HAUPTUI_AKTIV: true },
  cast: [{ id: 'hilde_brauer', name: 'Hilde Brauer', tag: 'CLIENT', rolle: 'Klientin' }],
  caseSetup: {
    caseType: 'vermisst',
    locations: [{ name: 'Karl Mauers Buero' }],
    setupCast: [{ id: 'hilde_brauer', name: 'Hilde Brauer', tag: 'CLIENT', anwesend: true }],
  },
  caseProgress: { gefundeneIndizIds: [] },
  sceneCounter: 2,
  currentScene: { personenImRaum: ['Hilde Brauer'], szene: 'Hilde Brauer bittet dich im Büro um Hilfe.' },
  engineCurrentLocation: { name: 'Karl Mauers Buero' },
  getNpcsAtCurrentLocation: () => [],
  getCaseLocations: () => [],
  normForMatch: (value) => String(value || '').toLowerCase().replace(/[_-]+/g, ' ').trim(),
  sameNamedPerson: (left, right) =>
    String(left || '').toLowerCase() === String(right || '').toLowerCase(),
  _npcZustandIstEntfernt: () => false,
  _npcGehoertHierher: () => false,
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
  'a visiting client must remain actionable after scene one while still physically present at the opening location');
assert(html.includes("if (isStart && typeof _enforceOpeningRosterPresence === 'function')"),
  'the opening roster must be applied before role-truth validation can mistake a one-scene client for a phantom');

vm.runInContext(sourceOf('_hauptuiNpc'), uiContext);
const resolvedOpeningClient = uiContext._hauptuiNpc(openingTargets.personen[0]);
assert(resolvedOpeningClient && resolvedOpeningClient.id === 'hilde_brauer',
  'executing a Haupt-UI action must resolve a client from the physical scene cast');

const openingRosterContext = {
  caseSetup: {
    setupCast: [
      { id: 'hilde_brauer', name: 'Hilde Brauer', tag: 'CLIENT', anwesend: true },
      { id: 'erwin_brauer', name: 'Erwin Brauer', tag: 'TARGET', anwesend: false },
    ],
  },
  getNpcsAtCurrentLocation: () => [],
  normForMatch: uiContext.normForMatch,
  sameNamedPerson: (left, right) =>
    String(left || '').toLowerCase() === String(right || '').toLowerCase(),
};
vm.createContext(openingRosterContext);
vm.runInContext(sourceOf('_enforceOpeningRosterPresence'), openingRosterContext);
const repairedOpening = openingRosterContext._enforceOpeningRosterPresence({
  szene: 'Hilde Brauer sitzt mit ihrem Pappkoffer im Büro und bittet dich um Hilfe.',
  personenImRaum: [],
});
assert.deepStrictEqual(Array.from(repairedOpening.personenImRaum), ['Hilde Brauer'],
  'a one-scene client visit marked anwesend must enter the opening roster even without a permanent location binding');

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
  indizien: [],
};
uiContext._physischesFallzielBlockiertAbschluss = () => false;
uiContext._physischesFallzielIstGeborgen = () => true;
uiContext._istKlient = (name, id) => id === 'hilde_brauer' || name === 'Hilde Brauer';
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
  'an exhausted family client must reopen at stage three even when the finale must remain an honest partial report',
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
uiContext._npcGehoertHierher = () => true;
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
assert(/Sachbearbeiter Rolf Meissner/.test(marienfelde.arrivalFallbackText)
    && /Dr\. Ruth Kellner/.test(marienfelde.arrivalFallbackText)
    && /Registratur/.test(marienfelde.arrivalFallbackText),
  'Marienfelde needs authored arrival prose that names both visible staff NPCs');
assert(!/Kleiderschrank offen|dort lässt sich prüfen/.test(apartment.arrivalFallbackText),
  'repeat visits to Hilde must not replay the already investigated wardrobe clue');
assert(!html.includes('Greta Schliemann allein in ihrer Köpenicker Wäscherei'),
  'the fixed laundry image contract must not deny additional dynamic actors');

const reportResolverContext = {
  cast: [],
  currentScene: { personenImRaum: ['Hilde Brauer'] },
  getNpcsAtCurrentLocation: () => [],
  normForMatch: value => String(value || '').toLowerCase(),
  _npcZustandIstEntfernt: () => false,
  _findSetupCastFuzzy: (name, id) =>
    (id === 'hilde_brauer' || name === 'Hilde Brauer')
      ? { id: 'hilde_brauer', name: 'Hilde Brauer', tag: 'CLIENT' }
      : null
};
vm.createContext(reportResolverContext);
vm.runInContext(sourceOf('_hauptuiNpc'), reportResolverContext);
const visibleReportClient = reportResolverContext._hauptuiNpc({
  id: 'hilde_brauer',
  name: 'Hilde Brauer',
  typ: 'person',
  erledigt: true
});
assert(visibleReportClient && visibleReportClient.id === 'hilde_brauer',
  'a visible one-time client must remain executable for the final report even after leaving the global cast');

const apartmentRexVariant = apartment && imageSet.images
  .find((entry) => {
    entry.test.lastIndex = 0;
    return entry.test.test('hilde brauer wohnung');
  }).presenceVariants.find((entry) => Array.isArray(entry.requiresParty)
    && entry.requiresParty.includes('Rex'));
assert(apartmentRexVariant
    && fs.existsSync(path.join(repoRoot, imageSet.root, apartmentRexVariant.dayFile))
    && fs.existsSync(path.join(repoRoot, imageSet.root, apartmentRexVariant.nightFile)),
  'Hilde apartment needs real day/night image variants when Rex is physically present');
const laundryRexVariant = laundrySpec.presenceVariants
  && laundrySpec.presenceVariants.find((entry) => entry.id === 'stamm_mfs');
assert(laundryRexVariant
    && laundryRexVariant.requiresParty.includes('Rex')
    && laundryRexVariant.depictsNpcs.includes('greta_schliemann')
    && laundryRexVariant.depictsNpcs.includes('stamm_mfs'),
  'the laundry confrontation variant must depict Greta and Vollmer while Rex is present');
for (const file of [
  'waescherei-vollmer-rex-day-v1734.png',
  'waescherei-vollmer-rex-night-v1734.png',
  'waescherei-vollmer-rex-aftermath-day-v1734.png',
  'waescherei-vollmer-rex-aftermath-night-v1734.png',
  'reichsbahn-lokschuppen-mahlke-only-day-v1734.png',
  'reichsbahn-lokschuppen-mahlke-only-night-v1734.png',
]) {
  const asset = path.join(repoRoot, imageSet.root, file);
  assert(fs.existsSync(asset) && fs.statSync(asset).size > 1000000,
    'Brauer roster/state image variant is missing or implausibly small: ' + file);
}
assert(html.includes("excludesNpcs: ['im_schaffner']"),
  'the locomotive-shed image must switch to the Mahlke-only variant after the IM leaves');
assert(html.includes("_npcZustandIstEntfernt(entry.id)"),
  'an immer:true location binding must not resurrect a fled or arrested NPC');

const combatContext = {
  caseSetup: { setupCast: [] },
  normForMatch: (value) => String(value || '').toLowerCase().replace(/_/g, ' ').trim(),
  _resolveNpcIdentity: () => ({
    id: 'stamm_mfs',
    name: 'Hauptmann Vollmer',
    tag: 'STASI',
    rolle: 'Hauptmann der Staatssicherheit',
  }),
  _npcZustandGet: () => null,
};
vm.createContext(combatContext);
vm.runInContext(sourceOf('_kampfNpcProfil') + '\n'
  + sourceOf('_gegnerKampfHP') + '\n'
  + sourceOf('_gegnerHaerte'), combatContext);
assert.strictEqual(combatContext._gegnerKampfHP('Hauptmann Vollmer'), 4,
  'Vollmer must retain hard MfS/Hauptmann HP even when callers pass only his name');
assert.strictEqual(combatContext._gegnerHaerte('Hauptmann Vollmer'), 5,
  'Vollmer must retain Hauptmann maneuver hardness when callers pass only his name');

const outcomeMath = Object.create(Math);
outcomeMath.random = () => 0.99;
const hardOutcomeContext = {
  Math: outcomeMath,
  caseProgress: {
    alkohol: 0,
    activeConfrontation: { treffer: 0, kontrollverlust: 0 },
  },
  normForMatch: combatContext.normForMatch,
  _konfrontationItemWirkung: () => ({
    label: 'AEG-Wucht',
    kraft: 4,
    irritation: 0,
    schwaechung: 3,
    status: 'ko',
  }),
  _konfrontationGegnerStaerke: () => 5,
  _konfrontationIstGruppe: () => false,
  _konfrontationStatusIstEndgueltig: (status) => ['ko', 'geflohen', 'gefesselt'].includes(status),
  _konfrontationOutcomePrompt: () => 'prompt',
  _alkoholStufe: () => 0,
  _alkoholKampfMalus: () => 0,
};
vm.createContext(hardOutcomeContext);
vm.runInContext(sourceOf('_konfrontationClamp') + '\n'
  + sourceOf('_konfrontationWuerfleAusgang'), hardOutcomeContext);
const firstToasterHit = hardOutcomeContext._konfrontationWuerfleAusgang(
  { name: 'Hauptmann Vollmer', tag: 'STASI', rolle: 'Hauptmann' },
  { name: 'Toaster (AEG, Vorkriegsmodell)' },
  'angreifen_mit',
  { score: 10, wirkung: hardOutcomeContext._konfrontationItemWirkung() },
  {},
);
assert.strictEqual(firstToasterHit.status, 'benommen',
  'even a best-roll Rex/item combo must not one-shot a fresh strength-five authority opponent');
hardOutcomeContext.caseProgress.activeConfrontation.treffer = 1;
const secondToasterHit = hardOutcomeContext._konfrontationWuerfleAusgang(
  { name: 'Hauptmann Vollmer', tag: 'STASI', rolle: 'Hauptmann' },
  { name: 'Toaster (AEG, Vorkriegsmodell)' },
  'angreifen_mit',
  { score: 10, wirkung: hardOutcomeContext._konfrontationItemWirkung() },
  {},
);
assert.strictEqual(secondToasterHit.status, 'ko',
  'a hard opponent may be defeated after a prior real hit, preserving useful item and Rex impact');

const ppkContext = {
  normForMatch: combatContext.normForMatch,
  _itemKatalogKey: () => 'eigene_pistole',
  _itemTaktikTags: () => ['dienstmarke', 'frontal'],
};
vm.createContext(ppkContext);
vm.runInContext(sourceOf('_konfrontationItemWirkung'), ppkContext);
const ppkEffect = ppkContext._konfrontationItemWirkung(
  { name: 'Eigene Pistole (Walther PPK)' },
  'ppk_einsetzen',
);
assert.strictEqual(ppkEffect.status, 'bedroht',
  'drawing the Walther PPK must create pressure, not an automatic wound or victory');
assert(ppkEffect.kraft <= 1 && /kein Schuss, kein Sieg/.test(ppkEffect.detail),
  'the PPK must remain a balanced one-use distance tool rather than a combat superweapon');

const romanceLeakContext = {
  window: { _letzteAktion: { kategorie: 'ROMANTIK' } },
  caseProgress: {
    romanceNpc: 'Dr. Ruth Kellner',
    gefundeneIndizIds: [],
  },
  engineCurrentLocation: { name: 'Marienfelde Notaufnahmelager' },
  lastRomanceNpcName: 'Dr. Ruth Kellner',
  normForMatch: combatContext.normForMatch,
  getCaseLocations: () => [{
    name: 'Marienfelde Notaufnahmelager',
    indizien: [{
      id: 'marienfelde_registratur',
      schluessel: ['marienfelde', 'registriert', 'erwin brauer'],
    }],
  }],
  diag: () => {},
};
vm.createContext(romanceLeakContext);
vm.runInContext(sourceOf('repairRomanceEvidenceLeak'), romanceLeakContext);
const leakedRomance = {
  szene: 'Ruth kommt näher und verrät dir leise: Brauer hat sich hier registriert.',
  ort: 'Marienfelde Notaufnahmelager',
};
assert.strictEqual(romanceLeakContext.repairRomanceEvidenceLeak(leakedRomance), true,
  'romance prose must repair a decisive clue disclosed before its real investigation action');
assert(!/registriert|in Sicherheit|im Westen/i.test(leakedRomance.szene)
    && /Nähe gehört euch|Naehe gehoert euch/i.test(leakedRomance.szene),
  'the repaired romance must remain real prose while withholding the unearned clue');

const violenceContext = {
  window: {
    _letzteAktion: {
      kategorie: 'OFFENSIV',
      konfrontationItemName: 'Toaster (AEG, Vorkriegsmodell)',
      npcName: 'Hauptmann Vollmer',
    },
  },
  normForMatch: combatContext.normForMatch,
  _hundInParty: () => true,
  diag: () => {},
};
vm.createContext(violenceContext);
vm.runInContext(sourceOf('repairYouthSafeConfrontationProse'), violenceContext);
const graphicHit = {
  szene: 'Der Toaster trifft Vollmer direkt an der Schläfe. Er liegt regungslos, die Augen verdreht; ein dünnes Rinnsal Blut läuft herab.',
};
assert.strictEqual(violenceContext.repairYouthSafeConfrontationProse(graphicHit), true,
  'a graphic item-combo result must be rewritten at the final delivery boundary');
assert(!/Schläfe|Blut|Augen verdreht|regungslos/i.test(graphicHit.szene)
    && /Schulter|benommen|Rex/.test(graphicHit.szene),
  'the rewritten hit must stay punchy and acknowledge Rex without gore');

const daylightContext = {
  normForMatch: combatContext.normForMatch,
  _aktTageszeitName: () => 'VORMITTAG',
  diag: () => {},
};
vm.createContext(daylightContext);
vm.runInContext(sourceOf('repairDayNightTravelProse'), daylightContext);
const daytimeTravel = { szene: 'Die Fahrt führt durch das nächtliche Berlin.', time: 'VORMITTAG' };
assert.strictEqual(daylightContext.repairDayNightTravelProse(daytimeTravel), true,
  'daytime UI must not keep a present-tense night drive in prose');
assert(/herbstliche Berlin/.test(daytimeTravel.szene) && !/nächtliche/.test(daytimeTravel.szene),
  'day/night repair must preserve the journey while correcting its lighting');

const custodyActionStart = html.indexOf('const _custodyAktion');
const custodyActionEnd = html.indexOf("let _custodyAusloeser", custodyActionStart);
assert(custodyActionStart >= 0 && custodyActionEnd > custodyActionStart
    && !/String\(scene\.szene \|\| ''\)/.test(html.slice(custodyActionStart, custodyActionEnd)),
  'custody entry must not infer a drawn PPK from free generated prose');
assert(html.includes("|| (caseProgress && caseProgress.romanceNpc)"),
  'romance absence hints must prefer the actually bound partner over the first setup romance');

console.log('BRAUER_FLOW_OK');
