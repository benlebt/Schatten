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
const hermes = setup.setupCast.find((entry) => entry.id === 'im_hermes');
assert(hermes && Array.from(hermes.aliases || []).includes('Verwaltungsbeamter'),
  'Hermes needs a canonical role alias so the UI cannot split him into two people');
assert(!hoOffice.bedrohungen.some((entry) => entry.id === 'im_hermes'),
  'Hermes must remain an interviewable witness instead of being consumed by an early threat');
assert(hoOffice.bedrohungen.some((entry) => entry.id === 'genosse_brakke' && entry.abStage >= 3),
  'Brakke must provide the later political confrontation');

for (const location of [apartment, hoOffice, policeArchive, pathology]) {
  assert((location.arrivalFallbackText || '').length >= 180,
    `${location.name} needs atmospheric arrival prose instead of a dry engine fallback`);
}

const clues = setup.locations.flatMap((location) => location.indizien || []);
const clueById = new Map(clues.map((clue) => [clue.id, clue]));
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
assert.strictEqual(clueById.get('brakke_deckung').stage, 4,
  'Brakke must remain the final responsibility proof');
assert(Number(clueById.get('brakke_deckung').abStage) >= 3,
  'Brakke must not confess or become provable before the investigation matures');
assert(clueById.get('lindenbaum_schaedeltrauma').stage >= 3,
  'the pathology must provide decisive medical contradiction');

assert(/GESTERN gestorben/i.test(setup.historicalContext.weltlage),
  'the setup must preserve 6 March as the day after Stalin died');
assert(!/vorgeschrieben fuer alle Witwen/i.test(html),
  'the game must not invent a blanket mourning-band mandate for widows');

for (const file of [
  'karl-buero-auguste-day.png',
  'ho-verwaltung-hermes-day.png',
  'ho-verwaltung-brakke-day.png',
]) {
  assert(fs.existsSync(path.join(repoRoot, 'assets', 'scenes', 'lindenbaum', file)),
    `missing Lindenbaum scene asset: ${file}`);
  assert(html.includes(file), `Lindenbaum image catalog does not reference ${file}`);
}
assert(html.includes("requiresAllNpcs: ['im_hermes', 'genosse_brakke']"),
  'the HO image contract must support the combined Hermes/Brakke state');
assert(html.includes("excludesNpcs: ['genosse_brakke']"),
  'the HO image contract must distinguish the Hermes-only state');
assert(html.includes("excludesNpcs: ['im_hermes']"),
  'the HO image contract must distinguish the Brakke-only state');
assert(!/Schwarze Vorhänge nehmen dem Vormittag/.test(apartment.arrivalFallbackText || ''),
  'the apartment fallback must not hard-code morning prose during an evening return');
assert(html.includes("_fallbackStillMissing"),
  'configured arrival fallbacks must append any newly active canonical NPC');
assert(html.includes("fallspezifische MfS-Konfrontation beendet', 8"),
  'a resolved MfS confrontation needs a real cooldown before a new generic arrest attempt');
assert(html.includes("narrativeAfterDialogue"),
  'outer quote repair must also handle prose beginning with an ASCII-quoted dialogue');
assert(/prellung\|beule\|bluterguss/.test(html),
  'full-health continuity must reject invented neck bruises and related injuries');
assert(/zug\|schluck\|nippen/.test(html),
  'sober-scene continuity must reject invented sips of Korn');
assert(/Dein letzter Fall/.test(html) && /sceneCounter <= 1/.test(html),
  'opening prose needs the engine-wide previous-case memory filter');
assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1685 +DepartedNpcVisualGuard'"),
  'release version missing');

console.log('LINDENBAUM_FLOW_OK');
