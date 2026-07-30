const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
const casesStart = html.indexOf('const INTRO_VARIANTS');
const casesEnd = html.indexOf('const DIFFICULTY_ORDER', casesStart);
assert(casesStart >= 0 && casesEnd > casesStart, 'case setup block is missing');

const context = { INTRO_REQUIREMENTS: '' };
vm.createContext(context);
vm.runInContext(
  html.slice(casesStart, casesEnd) + ';globalThis.CASES=INTRO_VARIANTS;',
  context,
);

const variant = context.CASES.find((entry) =>
  /auguste lindenbaum/i.test(String(entry && entry.setup && entry.setup.klient)));
assert(variant, 'Lindenbaum setup is missing');
const setup = variant.setup;
assert.strictEqual(setup.caseType, 'wahrheit', 'Lindenbaum must remain a truth case');
assert(Number(setup.stasiRelevance) >= 4,
  'the political killing of an HO official needs strong MfS pressure');
assert.strictEqual(setup.reportFallbackAlways, true,
  'the final Auguste report must use authored evidence instead of generic arrival prose');
assert(/Albert starb nicht an einem Herzinfarkt/.test(setup.reportFallbackText || '')
    && /Hermes sah Major Brakke und zwei Männer/.test(setup.reportFallbackText || '')
    && /MfS den Raum versiegelte/.test(setup.reportFallbackText || '')
    && /Auguste/.test(setup.reportFallbackText || ''),
  'the final report must name the medical proof, eyewitness, cover-up, and Auguste reaction');

const languageContext = { caseSetup: setup };
vm.createContext(languageContext);
vm.runInContext(
  html.slice(html.indexOf('function stripAccidentalNarrativeQuotes('), html.indexOf('function trimDescription('))
    + ';globalThis.cleanLanguage=fixSprache;',
  languageContext,
);
const quotedDialogueLead = '"\'Er war kein Mann für leere Drohungen.\' Auguste Lindenbaum legt die Hände auf den Tisch. '
  + 'Sie berichtet von Alberts Angst, dem Brief an Ulbricht und dem Besuch in der HO-Verwaltung, ohne den Blick von dir zu nehmen."';
const cleanedDialogueLead = languageContext.cleanLanguage(quotedDialogueLead);
assert(!cleanedDialogueLead.startsWith('"') && !cleanedDialogueLead.endsWith('"'),
  'a narrative paragraph beginning with quoted dialogue must lose accidental outer quotes');
assert(cleanedDialogueLead.startsWith('„Er war kein Mann für leere Drohungen.“'),
  'ASCII dialogue quotes must be normalized to German typography');

const identityContext = {
  caseSetup: setup,
  normForMatch: (value) => String(value || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/["„“]/g, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim(),
};
vm.createContext(identityContext);
vm.runInContext(
  html.slice(html.indexOf('function sameNamedPerson('), html.indexOf('function isPlausibleResponsibleName('))
    + ';globalThis.samePerson=sameNamedPerson;',
  identityContext,
);
assert(identityContext.samePerson('Verwaltungsbeamter', 'IM "Hermes"'),
  'the configured Hermes role alias must resolve to one canonical person');

const byLocation = new Map(setup.locations.map((location) => [location.name, location]));
const office = byLocation.get('Karl Mauers Büro');
const apartment = byLocation.get('Lindenbaum-Wohnung');
const hoOffice = byLocation.get('HO-Verwaltung Stalinallee');
const policeArchive = byLocation.get('Volkspolizei-Praesidium Keibelstrasse');
const pathology = byLocation.get('Pathologie Charite');
assert(office && apartment && hoOffice && policeArchive && pathology,
  'the core Lindenbaum investigation route is incomplete');
const seifert = setup.setupCast.find((entry) => entry.id === 'dr_otto_seifert');
assert(seifert && /Pathologe/.test(seifert.rolle || '') && (seifert.detail || '').length >= 180,
  'the pathology image needs its depicted doctor as a dimensional canonical witness');
assert.deepStrictEqual(Array.from(pathology.npcs || [], (entry) => entry.id), ['dr_otto_seifert'],
  'the pathology UI and prose must expose the doctor who is already present in its fixed image');

assert(/Auguste Lindenbaum/.test(office.openingFallbackText || ''),
  'the opening needs a deterministic, case-clean Auguste scene');
assert.strictEqual(office.openingFallbackRequired, true,
  'the edited Lindenbaum opening must override incomplete or abrupt model prose');
assert.deepStrictEqual(
  Array.from(office.npcs, (entry) => [entry.id, entry.bisStage]),
  [['auguste_lindenbaum', 1]],
  'Auguste must be physically present in the office opening, but not remain there forever',
);

assert.deepStrictEqual(
  Array.from(apartment.npcs, (entry) => entry.id),
  ['auguste_lindenbaum', 'eva_werder'],
  'the apartment must keep both women physically present',
);
assert(!/\ballein\b/i.test(apartment.detail),
  'the apartment prose must not contradict Eva Werder being present');
assert.deepStrictEqual(
  Array.from(hoOffice.npcs, (entry) => [entry.id, entry.abStage || 0]),
  [['im_hermes', 2], ['genosse_brakke', 3]],
  'Hermes and Brakke must enter the HO office at different investigation stages',
);
const hermesBinding = hoOffice.npcs.find((entry) => entry.id === 'im_hermes');
const brakkeBinding = hoOffice.npcs.find((entry) => entry.id === 'genosse_brakke');
assert.strictEqual(hermesBinding.wegWennIndiz, 'lindenbaum_schaedeltrauma',
  'Hermes must leave the office before the identified MfS major arrives for the final confrontation');
assert.deepStrictEqual(Array.from(brakkeBinding.nachIndiz || []),
  ['hermes_meldung', 'lindenbaum_schaedeltrauma'],
  'Brakke must not materialize before eyewitness and pathology identify a real political target');
const hermes = setup.setupCast.find((entry) => entry.id === 'im_hermes');
const brakke = setup.setupCast.find((entry) => entry.id === 'genosse_brakke');
assert(hermes && Array.from(hermes.aliases || []).includes('Verwaltungsbeamter'),
  'Hermes needs a canonical role alias so the UI cannot split him into two people');
assert(brakke && brakke.knownAfterEvidence === 'hermes_meldung',
  'Karl must not know Brakke by name before Hermes identifies him');
assert(!hoOffice.bedrohungen.some((entry) => entry.id === 'im_hermes'),
  'Hermes must remain an interviewable witness instead of being consumed by an early threat');
assert(hoOffice.bedrohungen.some((entry) => entry.id === 'genosse_brakke'
    && entry.abStage >= 3
    && Array.from(entry.requiresEvidenceAll || []).includes('hermes_meldung')
    && Array.from(entry.requiresEvidenceAll || []).includes('lindenbaum_schaedeltrauma')),
  'Brakke must provide the later political confrontation');
assert(!/Hermes|Verwaltungsbeamter/i.test(hoOffice.arrivalFallbackText || ''),
  'the first HO arrival must not narrate Hermes before his stage gate activates');

for (const location of [apartment, hoOffice, policeArchive, pathology]) {
  assert((location.arrivalFallbackText || '').length >= 180,
    `${location.name} needs atmospheric arrival prose instead of a dry engine fallback`);
}

const clues = setup.locations.flatMap((location) => location.indizien || []);
const clueById = new Map(clues.map((clue) => [clue.id, clue]));
const purposefulLindenbaumLabels = {
  ulbricht_brief: 'Prüfe Alberts Ulbricht-Brief',
  eva_besucher: 'Befrage Eva zum späten Besucher',
  buero_spuren: 'Sichere die Spuren in Alberts Büro',
  hermes_meldung: 'Befrage „Hermes“ zu Brakkes Besuch',
  brakke_deckung: 'Konfrontiere Brakke mit den Widersprüchen',
  totenschein_widerspruch: 'Prüfe Lindenbaums Totenschein-Akte',
  lindenbaum_schaedeltrauma: 'Prüfe Alberts pathologischen Befund',
};
for (const [clueId, expectedLabel] of Object.entries(purposefulLindenbaumLabels)) {
  const clue = clueById.get(clueId);
  assert(clue && clue.hauptuiActionLabel === expectedLabel,
    'Lindenbaum clue needs a visible purposeful action: ' + clueId);
  assert(clue.hauptuiActionPrompt && clue.hauptuiActionPrompt.length >= 100,
    'Lindenbaum clue needs a precise generation contract: ' + clueId);
}
for (const clueId of [
  'ulbricht_brief',
  'buero_spuren',
  'eva_besucher',
  'hermes_meldung',
  'totenschein_widerspruch',
  'lindenbaum_schaedeltrauma',
  'brakke_deckung',
]) {
  assert(clueById.has(clueId), 'missing Lindenbaum truth clue: ' + clueId);
  assert((clueById.get(clueId).fundText || '').length >= 160,
    `Lindenbaum clue ${clueId} needs bounded deterministic discovery prose`);
}
assert(clueById.get('hermes_meldung').prosaPflicht,
  'Hermes must narrate the actual Brakke eyewitness statement when awarding the clue');
assert(clueById.get('brakke_deckung').prosaPflicht,
  'Brakke must narrate the actual cover-up admission when awarding the clue');
for (const clueId of ['ulbricht_brief', 'eva_besucher']) {
  const contract = clueById.get(clueId).prosaPflicht;
  assert(contract && contract.replaceOnFallback === true,
    `${clueId} must replace hallucinated or location-drifting prose with its authored evidence scene`);
}
assert.strictEqual(clueById.get('brakke_deckung').stage, 4,
  'Brakke must remain the final responsibility proof');
assert(Number(clueById.get('brakke_deckung').abStage) >= 3,
  'Brakke must not confess or become provable before the investigation matures');
assert(clueById.get('lindenbaum_schaedeltrauma').stage >= 3,
  'the pathology must provide decisive medical contradiction');
assert(clueById.get('lindenbaum_schaedeltrauma').prosaPflicht
    && clueById.get('lindenbaum_schaedeltrauma').prosaPflicht.replaceOnFallback === true,
  'the pathology proof needs bounded non-gory authored prose');
assert(/tastbare Kontur/.test(clueById.get('lindenbaum_schaedeltrauma').fundText)
    && !/Haut.{0,50}beiseite|Bruch.{0,40}zum Vorschein|blutverschmiert/i.test(
      clueById.get('lindenbaum_schaedeltrauma').fundText),
  'the pathology proof must stay clinically clear without graphic body detail');

assert(/GESTERN gestorben/i.test(setup.historicalContext.weltlage),
  'the setup must preserve 6 March as the day after Stalin died');
assert(!/vorgeschrieben fuer alle Witwen/i.test(html),
  'the game must not invent a blanket mourning-band mandate for widows');

const lindenbaumImagesStart = html.indexOf('caseTest: /auguste lindenbaum|albert lindenbaum/i');
const lindenbaumImagesEnd = html.indexOf('caseTest: /reinhold achterberg|wilhelmine achterberg/i', lindenbaumImagesStart);
assert(lindenbaumImagesStart >= 0 && lindenbaumImagesEnd > lindenbaumImagesStart,
  'the Lindenbaum scene-image set must remain directly testable');
const lindenbaumImages = html.slice(lindenbaumImagesStart, lindenbaumImagesEnd);

for (const file of [
  'karl-buero-auguste-day.png',
  'karl-buero-auguste-eva-day.png',
  'ho-verwaltung-hermes-day.png',
  'ho-verwaltung-brakke-day.png',
  'ho-verwaltung-hermes-eva-day.png',
  'ho-verwaltung-akteure-eva-day.png',
  'ho-verwaltung-brakke-eva-day.png',
  'stalinallee-eva-day.png',
  'cafe-kranzler-eva-day.png',
  'cafe-kranzler-eva-night.png',
]) {
  assert(fs.existsSync(path.join(repoRoot, 'assets', 'scenes', 'lindenbaum', file)),
    `missing Lindenbaum scene asset: ${file}`);
  assert(html.includes(file), `Lindenbaum image catalog does not reference ${file}`);
}
assert(html.includes("requiresAllNpcs: ['im_hermes', 'genosse_brakke']"),
  'the HO image contract must support the combined Hermes/Brakke state');
assert(html.includes("requiresAllNpcs: ['im_hermes', 'eva_werder']")
    && html.includes("depictsNpcs: ['im_hermes', 'eva_werder']")
    && html.includes("requiresAllNpcs: ['genosse_brakke', 'eva_werder']")
    && html.includes("depictsNpcs: ['genosse_brakke', 'eva_werder']")
    && html.includes("requiresAllNpcs: ['im_hermes', 'genosse_brakke', 'eva_werder']"),
  'the HO image contract must cover Eva with Hermes, Brakke, and both men');
assert(html.includes('LINDENBAUM-BRAKKE-IDENTITAET')
    && html.includes("MfS-Major Genosse Brakke in grauer Dienstuniform tritt ein")
    && html.includes("requiresAnySceneNpcs: ['unbekannter_mann', 'mann_im_mantel', 'mann_mit_aktentasche']")
    && html.includes('mindestensEine.some(istAktiv)'),
  'a generated anonymous HO political actor must resolve to Brakke and remain visible during legacy scene restoration');
assert(html.includes('variant.requiresAllSceneNpcs && alle.length'),
  'multi-person HO variants must require the visible scene roster, not a broad location roster');
assert(html.includes("replace(/[^a-z0-9 ]/g, ' ')"),
  'strict scene-roster matching must canonicalize quoted names such as IM \"Hermes\"');
assert(html.includes("keine.some(variant.requiresAllSceneNpcs && istSichtbar ? istSichtbar : istAktiv)"),
  'strict HO variants must also evaluate excluded NPCs against the visible scene roster');
assert(html.includes("excludesNpcs: ['genosse_brakke']"),
  'the HO image contract must distinguish the Hermes-only state');
assert(html.includes("excludesNpcs: ['im_hermes']"),
  'the HO image contract must distinguish the Brakke-only state');
assert(html.includes("depictsNpcs: ['dr_otto_seifert']"),
  'the pathology image contract must declare its visible doctor');
assert(html.includes("file: 'pathologie-charite-eva-day.png'")
    && html.includes("requiresAllNpcs: ['dr_otto_seifert', 'eva_werder']")
    && fs.existsSync(path.join(repoRoot, 'assets', 'scenes', 'lindenbaum', 'pathologie-charite-eva-day.png')),
  'Eva must remain visibly present when she accompanies Karl into the pathology');
assert(lindenbaumImages.includes("file: 'volkspolizei-keibelstrasse-eva-day.png'")
    && lindenbaumImages.includes("nightFile: 'volkspolizei-keibelstrasse-eva-night.png'")
    && fs.existsSync(path.join(repoRoot, 'assets', 'scenes', 'lindenbaum', 'volkspolizei-keibelstrasse-eva-day.png'))
    && fs.existsSync(path.join(repoRoot, 'assets', 'scenes', 'lindenbaum', 'volkspolizei-keibelstrasse-eva-night.png')),
  'Eva must remain visibly present at the Keibelstrasse in both day and night scenes');
assert(html.includes("requiresAllNpcs: ['eva_werder']")
    && html.includes("depictsNpcs: ['eva_werder']"),
  'Eva needs a party-aware Café Kranzler image instead of the Karl-alone base scene');
assert(html.includes("requiresAllNpcs: ['auguste_lindenbaum', 'eva_werder']")
    && html.includes("depictsNpcs: ['auguste_lindenbaum', 'eva_werder']"),
  'Eva needs a party-aware Karl office image when Auguste is present there');
assert(html.includes("file: 'karl-buero-eva-day.png'")
    && html.includes("nightFile: 'karl-buero-eva-night.png'")
    && fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'lindenbaum', 'karl-buero-eva-day.png'))
    && fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'lindenbaum', 'karl-buero-eva-night.png')),
  'Eva alone in Karl office needs coherent day and night party visuals');
assert(html.includes("test: /^stalinallee$/")
    && html.includes("file: 'stalinallee-eva-day.png'")
    && html.includes("alt: 'Szenenbild: Eva Werder ist mit Karl Mauer aus der HO-Verwaltung auf die Stalinallee entkommen.'"),
  'the post-HO flight scene needs a real Eva party visual instead of only the technical fallback');
assert(html.includes('PARTY-FLUCHT-PROSA repariert')
    && html.includes('Eva bleibt dicht an deiner Seite. Gemeinsam stürzt ihr aus dem Gebäude'),
  'flight prose must keep the party visible and remove ungrounded blockers');
assert(html.includes("if (typeof _istInParty === 'function' && _istInParty(scId, scName)) return true;"),
  'an explicit party member must remain a clickable person away from the canonical home location');
assert(html.includes("add('party_mitnehmen', mitnahmePreis > 0")
    && html.includes("add('party_hierlassen', 'Hier lassen')")
    && html.includes("if (verb === 'party_mitnehmen')")
    && html.includes("if (verb === 'party_hierlassen')"),
  'the main UI must expose both taking Eva along and leaving her at the current location');
assert(/Party-Mitglieder sind bei einer bewusst ausgelösten Reise[\s\S]{0,1200}required\.push\(member\)/.test(html),
  'travel-arrival validation must require every explicit party member in prose and personenImRaum');

const partyLocationContext = {
  engineCurrentLocation: { name: 'Café Kranzler' },
  caseProgress: {},
  caseSetup: { locations: setup.locations },
  currentScene: null,
  gameTimeIdx: 5,
  TIMES_OF_DAY: ['Morgen', 'Vormittag', 'Mittag', 'Nachmittag', 'Abend', 'Nacht'],
  _party: [{ id: 'eva_werder', name: 'Eva Werder', tag: 'ROMANCE' }],
  _istInParty: (id, name) => id === 'eva_werder' || name === 'Eva Werder',
  normForMatch: identityContext.normForMatch,
};
vm.createContext(partyLocationContext);
vm.runInContext(
  html.slice(html.indexOf('function _npcGehoertHierher('), html.indexOf('function _strHash('))
    + ';globalThis.belongsHere=_npcGehoertHierher;',
  partyLocationContext,
);
assert.strictEqual(partyLocationContext.belongsHere('eva_werder', 'Eva Werder'), true,
  'Eva must remain physically reachable after travelling away from her apartment');

const arrivalPartyContext = {
  engineCurrentLocation: { name: 'Café Kranzler' },
  caseProgress: { indizien: [] },
  caseSetup: {},
  _party: [{ id: 'eva_werder', name: 'Eva Werder', tag: 'ROMANCE' }],
  normForMatch: identityContext.normForMatch,
  sameNamedPerson: (a, b) => identityContext.normForMatch(a) === identityContext.normForMatch(b),
  getCaseLocations: () => [],
  getNpcsAtCurrentLocation: () => [],
  _worldTruthAliases: (id, entry) => [id, entry && entry.name].filter(Boolean),
  _worldTruthHasAlias: (text, aliases) => aliases.some((alias) =>
    identityContext.normForMatch(text).includes(identityContext.normForMatch(alias))),
};
vm.createContext(arrivalPartyContext);
const arrivalRosterStart = html.indexOf('function _findArrivalNpcRosterDrift(');
const arrivalRosterEnd = html.indexOf('function _findRosterPresenceContradiction(', arrivalRosterStart);
vm.runInContext(
  html.slice(arrivalRosterStart, arrivalRosterEnd)
    + ';globalThis.findArrivalPartyDrift=_findArrivalNpcRosterDrift;',
  arrivalPartyContext,
);
const missingEvaArrival = arrivalPartyContext.findArrivalPartyDrift({
  ort: 'Café Kranzler',
  szene: 'Du betrittst allein das Café und siehst dich um.',
  personenImRaum: [],
}, { id: 'REISE', _istReise: true });
assert(missingEvaArrival && missingEvaArrival.code === 'arrival_npc_roster_drift'
    && Array.from(missingEvaArrival.required).includes('Eva Werder')
    && Array.from(missingEvaArrival.missingProse).includes('Eva Werder')
    && Array.from(missingEvaArrival.missingRoster).includes('Eva Werder'),
  'a Karl-alone travel scene must be rejected while Eva is explicitly in the party');
assert(!/Schwarze Vorhänge nehmen dem Vormittag/.test(apartment.arrivalFallbackText || ''),
  'the apartment fallback must not hard-code morning prose during an evening return');
assert(html.includes("_fallbackStillMissing"),
  'configured arrival fallbacks must append any newly active canonical NPC');
assert(html.includes("fallspezifische MfS-Konfrontation beendet', 8"),
  'a resolved MfS confrontation needs a real cooldown before a new generic arrest attempt');
assert(html.includes("fallspezifische MfS-Konfrontation friedlich beendet', 8"),
  'a peaceful item resolution must receive the same MfS cooldown as a fight resolution');
assert(html.includes("MfS-Zugriff unterdrueckt: fallspezifischer Offizier befindet sich noch in der Konfrontations-Atempause."),
  'forced custody must respect the case-specific officer cooldown');
assert(html.includes("konfrontationItemName: (option && option._konfrontationItemName) || null")
    && html.includes("const _custodyExplizitesItem = normForMatch(_custodyMeta.konfrontationItemName || '')")
    && html.includes("_konfrontationItemName: (item && item.name) || ''"),
  'custody entry prose must use the exact confrontation item instead of guessing from model prose');
assert(/if \(_hatDoppelkornAmEnde\) \{[\s\S]{0,260}ehrlichen Schluck Doppelkorn/.test(html),
  'the ending may mention Doppelkorn only while Karl still owns it');
assert(html.includes("narrativeAfterDialogue"),
  'outer quote repair must also handle prose beginning with an ASCII-quoted dialogue');
assert(/pocht\|schmerzt\|schmerzen\|blutet/.test(html),
  'full-health continuity must reject invented plural body-part pain such as "Rippen schmerzen"');
assert(/zug\|schluck\|nippen/.test(html),
  'sober-scene continuity must reject invented sips of Korn');
assert(/Dein letzter Fall/.test(html) && /sceneCounter <= 1/.test(html),
  'opening prose needs the engine-wide previous-case memory filter');

const peacefulCooldownCalls = [];
const confrontationCooldownContext = {
  caseProgress: {
    activeConfrontation: {
      npcId: 'genosse_brakke',
      enemyTag: 'STASI',
      enemyRole: 'MfS-Major',
      trigger: 'location-threat',
    },
  },
  sceneCounter: 23,
  actionStreak: 0,
  stasiTension: 4,
  _konfrontationGruppenAktiv: () => false,
  _stasiEncounterClear: (reason, scenes) => peacefulCooldownCalls.push({ reason, scenes }),
  diag: () => {},
};
vm.createContext(confrontationCooldownContext);
const confrontationClearStart = html.indexOf('function _konfrontationClear(');
const confrontationClearEnd = html.indexOf('function _konfrontationCooldownAktiv(', confrontationClearStart);
vm.runInContext(
  html.slice(confrontationClearStart, confrontationClearEnd)
    + ';globalThis.clearConfrontation=_konfrontationClear;',
  confrontationCooldownContext,
);
confrontationCooldownContext.clearConfrontation('friedliches-itemangebot');
assert.strictEqual(peacefulCooldownCalls.length, 1,
  'peacefully calming Brakke must close the generic MfS encounter clock exactly once');
assert.strictEqual(peacefulCooldownCalls[0].scenes, 8,
  'peacefully calming Brakke must grant eight scenes without a phantom repeat');
assert.strictEqual(confrontationCooldownContext.caseProgress.stasiEncounterEligibleScenes, 0,
  'the generic MfS observation counter must reset after the peaceful Brakke resolution');

const blockedStasiContext = {
  caseSetup: setup,
  caseProgress: {
    stasiEncounterEligibleScenes: 9,
    forceCustodyNextScene: true,
    pendingCustodyConfirm: true,
    stasiEncounterCooldownUntil: 0,
    stage: 3,
    indizien: ['hermes_meldung', 'lindenbaum_schaedeltrauma'],
  },
  engineCurrentLocation: { name: 'Lindenbaum-Wohnung' },
  sceneCounter: 26,
  karlInStasiCustody: false,
  metaCustodyGracePeriod: 0,
  stasiTension: 4,
  stasiHighTensionStreak: 0,
  stasiMaxTensionStreak: 0,
  custodyLocked: false,
  normForMatch: identityContext.normForMatch,
  _stasiSetupCast: () => setup.setupCast.filter((npc) => npc.tag === 'STASI'),
  _stasiMechanikAktiv: () => true,
  _stasiRelevanz: () => 4,
  _konfrontationCooldownAktiv: (id) => id === 'genosse_brakke',
  _konfrontationAktiv: () => false,
  canForceStasiCustodyHighTension: () => true,
  raiseStasiTension: () => {},
  _konfrontationTaktikProfil: () => ({}),
  diag: () => {},
};
vm.createContext(blockedStasiContext);
const stasiIdentityStart = html.indexOf('function _stasiEncounterIdentity(');
const stasiIdentityEnd = html.indexOf('function _stasiEncounterConfirmIntroFromScene(', stasiIdentityStart);
vm.runInContext(
  html.slice(stasiIdentityStart, stasiIdentityEnd)
    + ';globalThis.forceStasi=_stasiEncounterForceZugriff;globalThis.advanceStasi=_stasiEncounterAdvance;',
  blockedStasiContext,
);
assert.strictEqual(blockedStasiContext.forceStasi('repeat after Brakke'), null,
  'forced custody must not respawn Brakke during his confrontation cooldown');
assert.strictEqual(blockedStasiContext.caseProgress.forceCustodyNextScene, false,
  'a blocked forced custody attempt must clear its pending force flag');
assert.strictEqual(blockedStasiContext.advanceStasi('ERKUNDEN'), null,
  'normal MfS progression must not respawn Brakke during his confrontation cooldown');
assert.strictEqual(blockedStasiContext.caseProgress.stasiEncounterEligibleScenes, 0,
  'a blocked normal MfS attempt must reset its eligible-scene counter');

assert(html.includes("_zeitUnmittelbar: romanceKategorie === 'ROMANTIK'"),
  'a normal romance click must remain an immediate micro-scene and never roll night into morning');
assert(html.includes('KEIN Schlaf, KEIN Aufwachen, KEINE Übernachtung und KEIN Morgen')
    && html.includes("const _cliffhangerPflicht = chosenKategorie !== 'ROMANTIK'"),
  'regular romance prompts must forbid day jumps, invented threats, and cliffhanger carry-over');
assert(html.includes("const offenerHinweis = typeof _npcHatOffenenHinweis === 'function'")
    && html.includes("add('reden', offenerHinweis ? 'Zum offenen Fallhinweis befragen'"),
  'a restrained Brakke must keep the open evidence interview reachable before police handover');
assert(html.includes("taeterZustand.status === 'uebergeben'")
    && html.includes('MORALWAHL bereits vollzogen')
    && html.includes('Wiederhole keine Festnahme'),
  'the finale must not offer a second moral fork after Brakke was already handed over');
assert(html.includes('Framo V 901, niemals ein Barkas')
    && html.includes('versiegelter Beweismappe'),
  'Brakke handover must be historically plausible and politically documented');
assert(html.includes('Diese Personen sind bereits vorausgewählt. Tippe auf einen Namen, um ihn abzuwählen'),
  'the travel popup must explain that offered companions are already selected');

for (const file of [
  'ho-verwaltung-brakke-fixed-v1735.png',
  'ho-verwaltung-brakke-stink-v1735.png',
]) {
  assert(fs.existsSync(path.join(repoRoot, 'assets', 'scenes', 'lindenbaum', file)),
    `missing Brakke state image: ${file}`);
  assert(html.includes(file), `Brakke visual resolver does not reference ${file}`);
}

const brakkeVisualContext = {
  caseSetup: setup,
  engineCurrentLocation: { name: 'HO-Verwaltung Stalinallee' },
  window: { _letzteAktion: {} },
  normForMatch: identityContext.normForMatch,
  _npcZustandGet: () => ({ status: 'gefesselt' }),
};
vm.createContext(brakkeVisualContext);
const brakkeVisualStart = html.indexOf('function _lindenbaumBrakkeKonfrontationVisual(');
const brakkeVisualEnd = html.indexOf('// Physische Rettungsziele', brakkeVisualStart);
vm.runInContext(
  html.slice(brakkeVisualStart, brakkeVisualEnd)
    + ';globalThis.brakkeVisual=_lindenbaumBrakkeKonfrontationVisual;',
  brakkeVisualContext,
);
assert.strictEqual(brakkeVisualContext.brakkeVisual().file, 'ho-verwaltung-brakke-fixed-v1735.png',
  'restrained Brakke must render on the floor instead of standing behind his desk');
brakkeVisualContext._npcZustandGet = () => ({ status: 'abgelenkt' });
brakkeVisualContext.window._letzteAktion = {
  konfrontationItemName: 'Stinkbombe im Blechmantel',
  npcName: 'Genosse Brakke',
};
assert.strictEqual(brakkeVisualContext.brakkeVisual().file, 'ho-verwaltung-brakke-stink-v1735.png',
  'the stink-bomb consequence must render the visible smoke state');

const custodyRepairContext = {
  caseSetup: setup,
  engineCurrentLocation: { name: 'MfS-Untersuchungshaftanstalt Hohenschoenhausen, Zelle 14' },
  normForMatch: identityContext.normForMatch,
  diag: () => {},
};
vm.createContext(custodyRepairContext);
const custodyRepairStart = html.indexOf('function repairGoerkeCustodyEntryContinuity(');
const custodyRepairEnd = html.indexOf('// Kleine, eindeutig falsche Flexionsreste', custodyRepairStart);
vm.runInContext(
  html.slice(custodyRepairStart, custodyRepairEnd)
    + ';globalThis.repairCustody=repairGoerkeCustodyEntryContinuity;',
  custodyRepairContext,
);
const lindenbaumCustody = {
  ort: 'MfS-Untersuchungshaftanstalt Hohenschoenhausen, Zelle 14',
  szene: 'Brakke lässt dir die Walther abnehmen. Handschellen schließen sich, dann geht es nach Hohenschönhausen.',
  personenImRaum: [],
};
const lindenbaumCustodyBefore = lindenbaumCustody.szene;
assert.strictEqual(custodyRepairContext.repairCustody(lindenbaumCustody), false,
  'the Görke custody repair must not fire merely because a different case contains Brakke');
assert.strictEqual(lindenbaumCustody.szene, lindenbaumCustodyBefore,
  'Lindenbaum custody prose must not be overwritten with Krollwitz and Roth');

const romanceRepairContext = {
  caseProgress: {
    gefundeneIndizIds: [],
    romanceNpc: 'Eva Werder',
    pendingThreatCliffhanger: { art: 'Poltern', ort: 'Lindenbaum-Wohnung' },
    activeConfrontation: null,
    activeEncounter: null,
  },
  window: { _letzteAktion: { kategorie: 'ROMANTIK', npcName: 'Eva Werder' } },
  getCaseLocations: () => setup.locations,
  engineCurrentLocation: { name: 'Lindenbaum-Wohnung' },
  lastRomanceNpcName: 'Eva Werder',
  normForMatch: identityContext.normForMatch,
  diag: () => {},
};
vm.createContext(romanceRepairContext);
const romanceRepairStart = html.indexOf('function repairRomanceEvidenceLeak(');
const romanceRepairEnd = html.indexOf('// Knackige Gewalt bleibt erlaubt', romanceRepairStart);
vm.runInContext(
  html.slice(romanceRepairStart, romanceRepairEnd)
    + ';globalThis.repairRomance=repairRomanceEvidenceLeak;',
  romanceRepairContext,
);
const romanceLeakScene = {
  szene: clueById.get('brakke_deckung').fundText
    + ' Dann poltert jemand vor der Tür und zwei unbekannte Männer warten draußen.',
  ort: 'Lindenbaum-Wohnung',
};
assert.strictEqual(romanceRepairContext.repairRomance(romanceLeakScene), true,
  'romance must repair evidence and threat leaks even when the leaked clue belongs to another location');
assert(!/Brakke|versiegelte|unbekannte Männer|poltert/i.test(romanceLeakScene.szene),
  'repaired romance prose must contain neither free evidence nor a phantom threat');
assert.strictEqual(romanceRepairContext.caseProgress.pendingThreatCliffhanger, null,
  'a phantom threat invented by romance must not poison the following scene');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1785 +PartialEndingTruth'"),
  'release version missing');

console.log('LINDENBAUM_FLOW_OK');
