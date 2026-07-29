const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { readWebpDimensions } = require('./image-format-utils');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const start = html.indexOf('const ROMANCE_OVERNIGHT_LOCATIONS = {');
const end = html.indexOf('let npcMisstrauisch', start);
assert(start >= 0 && end > start, 'romance morning helper block not found');

const context = {
  console,
  caseProgress: null,
  engineCurrentLocation: null,
  botWasEverActive: false,
  botRng: () => 0.5,
  normForMatch(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  },
};
context.Math = Object.create(Math);
context.Math.random = () => 0.1;
vm.createContext(context);
vm.runInContext(html.slice(start, end) + '\nthis.romanceApi = { choose: _romanceMorningChoose, ensure: _romanceMorningEnsure, status: _romanceMorningPartnerStatus, directive: _romanceMorningDirective, location: _romanceOvernightLocation };', context);

const api = context.romanceApi;
const ritaLocation = api.location('Rita');
assert(ritaLocation.name === 'Ritas Wohnung nahe dem Goldenen Anker', 'Rita location drifted');
assert(ritaLocation.presentImage === 'morgen-wohnung-ost.webp', 'Rita present image drifted');
assert(ritaLocation.goneImage === 'morgen-wohnung-ost-allein.webp', 'Rita gone image drifted');

context.Math.random = () => 0.1;
const stayed = api.choose('Rita', ritaLocation);
assert(stayed.partnerPresent === true && stayed.morningMode === 'dominant', 'Rita must have a stable present morning branch');
context.Math.random = () => 0.99;
const gone = api.choose('Rita', ritaLocation);
assert(gone.partnerPresent === false && gone.morningMode === 'weg', 'Rita must have a stable gone morning branch');

const legacy = { npc: 'Rita', location: ritaLocation.name, image: ritaLocation.presentImage };
api.ensure(legacy, 'Rita ist bereits fort. Karl wacht allein im Zimmer auf.');
assert(legacy.partnerPresent === false && legacy.imageGone === ritaLocation.goneImage, 'legacy prose must migrate to the gone image');
assert(api.directive(legacy).includes('koerperlich NICHT ANWESEND'), 'gone prompt must forbid Rita from appearing');
const unrelatedDeparture = { npc: 'Rita', location: ritaLocation.name, image: ritaLocation.presentImage };
api.ensure(unrelatedDeparture, 'Rita steht am Fenster. Der Mann mit dem grauen Hut ist bereits fort.');
assert(unrelatedDeparture.partnerPresent === true, 'another departing person must not remove Rita');

context.caseProgress = { romanceOvernight: Object.assign({}, legacy) };
context.engineCurrentLocation = { name: ritaLocation.name };
assert(api.status('rita', 'Rita') === false, 'gone Rita must be rejected by location binding');
context.caseProgress.romanceOvernight.partnerPresent = true;
context.caseProgress.romanceOvernight.morningMode = 'kuehl';
assert(api.status('rita', 'Rita') === true, 'present Rita must be admitted at the temporary apartment');
assert(api.directive(context.caseProgress.romanceOvernight).includes('bleibt die ganze Szene da'), 'present prompt must forbid an image-breaking departure');

assert(!html.includes('Waehle die Variante anhand IHRES Charakters'), 'the model must no longer choose its own morning reality');
assert(html.includes("const romanceImage = ro.partnerPresent === false"), 'scene renderer must select by stored presence');
assert(html.includes("if (_romanceMorningStatus !== null) return _romanceMorningStatus;"), 'NPC location binding must use romance morning truth');
assert(html.includes('option._romanceRejectedAtOrt ='), 'romance rejection must remember its pre-transition location');
assert(html.includes('ORTS- UND TAGESWECHSEL (PFLICHT)'), 'a moved rejection scene must require a narrated overnight bridge');
assert(html.includes('nach Hause fährt, schläft und am nächsten Morgen'), 'the rejection bridge must include home and sleep');
assert(html.includes('dürfen in personenImRaum am Zielort NICHT erscheinen'), 'rejected NPCs must remain at the departed location');
assert(html.includes('&& romCurrentTension >= 3'),
  'three successful deliberate approaches must unlock the overnight climax instead of deadlocking at the click cap');
assert(!html.includes('&& romCurrentTension >= 4'),
  'the overnight threshold must not remain above the maximum three-click path from Rm 0');
assert(html.includes('const romanceRecoveryReady = _romanceRecoveryReadyNow(romCurrentTension)')
    && html.includes('(romanticClicksSinceProgress < 3 || romanceRecoveryReady)')
    && html.includes('romanticClicksSinceProgress >= 3 && !romanceRecoveryReady'),
  'danger must not permanently deadlock a three-click romance below the overnight threshold');
const recoveryStart = html.indexOf('function _romanceRecoveryReadyNow');
const recoveryEnd = html.indexOf('\n}', recoveryStart) + 2;
assert(recoveryStart >= 0 && recoveryEnd > recoveryStart, 'romance recovery helper missing');
const recoveryContext = {
  romanticClicksSinceProgress: 3,
  sceneCounter: 20,
  lastRomanceTensionUpScene: 16,
};
vm.createContext(recoveryContext);
vm.runInContext(html.slice(recoveryStart, recoveryEnd) + '\nthis.recoveryReady = _romanceRecoveryReadyNow;', recoveryContext);
assert(recoveryContext.recoveryReady(1) === true,
  'a cooled three-click romance must recover after two factual scenes');
recoveryContext.sceneCounter = 17;
assert(recoveryContext.recoveryReady(1) === false,
  'romance recovery must still respect its two-scene breathing room');
assert(html.includes('romanticTension = Math.max(2, romanticTension);')
    && html.includes('romanticClicksSinceProgress = 2;'),
  'a recovery approach must reopen the cap and restore enough tension for the normal +1 to reach the overnight threshold');

const imageFiles = [
  'morgen-wohnung-ost.webp', 'morgen-wohnung-ost-allein.webp',
  'morgen-wohnung-west.webp', 'morgen-wohnung-west-allein.webp',
  'morgen-wohnung-boheme.webp', 'morgen-wohnung-boheme-allein.webp',
];
const dimensions = {};
for (const file of imageFiles) {
  const imagePath = path.join(root, 'assets', 'scenes', 'romance', file);
  assert(fs.existsSync(imagePath), 'missing romance morning image ' + file);
  const size = readWebpDimensions(imagePath);
  dimensions[file] = [size.width, size.height];
}
for (const type of ['ost', 'west', 'boheme']) {
  const present = dimensions['morgen-wohnung-' + type + '.webp'];
  const goneSize = dimensions['morgen-wohnung-' + type + '-allein.webp'];
  assert(present[0] === goneSize[0] && present[1] === goneSize[1], type + ' present/gone images must have identical dimensions');
}

console.log('romance morning consistency tests passed');
