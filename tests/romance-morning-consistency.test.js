const fs = require('fs');
const path = require('path');
const vm = require('vm');

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
assert(ritaLocation.presentImage === 'morgen-wohnung-ost.png', 'Rita present image drifted');
assert(ritaLocation.goneImage === 'morgen-wohnung-ost-allein.png', 'Rita gone image drifted');

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

const imageFiles = [
  'morgen-wohnung-ost.png', 'morgen-wohnung-ost-allein.png',
  'morgen-wohnung-west.png', 'morgen-wohnung-west-allein.png',
  'morgen-wohnung-boheme.png', 'morgen-wohnung-boheme-allein.png',
];
const dimensions = {};
for (const file of imageFiles) {
  const imagePath = path.join(root, 'assets', 'scenes', 'romance', file);
  assert(fs.existsSync(imagePath), 'missing romance morning image ' + file);
  const png = fs.readFileSync(imagePath);
  assert(png.toString('ascii', 1, 4) === 'PNG', file + ' is not a PNG');
  dimensions[file] = [png.readUInt32BE(16), png.readUInt32BE(20)];
}
for (const type of ['ost', 'west', 'boheme']) {
  const present = dimensions['morgen-wohnung-' + type + '.png'];
  const goneSize = dimensions['morgen-wohnung-' + type + '-allein.png'];
  assert(present[0] === goneSize[0] && present[1] === goneSize[1], type + ' present/gone images must have identical dimensions');
}

console.log('romance morning consistency tests passed');
