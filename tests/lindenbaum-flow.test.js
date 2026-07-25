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

const byLocation = new Map(setup.locations.map((location) => [location.name, location]));
const apartment = byLocation.get('Lindenbaum-Wohnung');
const hoOffice = byLocation.get('HO-Verwaltung Stalinallee');
const pathology = byLocation.get('Pathologie Charite');
assert(apartment && hoOffice && pathology, 'the core Lindenbaum investigation route is incomplete');

assert.deepStrictEqual(
  Array.from(apartment.npcs, (entry) => entry.id),
  ['auguste_lindenbaum', 'eva_werder'],
  'the apartment must keep both women physically present',
);
assert(!/\ballein\b/i.test(apartment.detail),
  'the apartment prose must not contradict Eva Werder being present');
assert.deepStrictEqual(
  Array.from(hoOffice.npcs, (entry) => entry.id),
  ['im_hermes', 'genosse_brakke'],
  'the HO office must keep both fixed political actors present',
);

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
}
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

console.log('LINDENBAUM_FLOW_OK');
