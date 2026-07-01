const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const functionStart = html.indexOf('function offeneIndizienAmOrtNachErreichbarkeit');
const functionEnd = html.indexOf('// Markiert ein Indiz als gefunden', functionStart);
assert(functionStart > -1 && functionEnd > functionStart, 'reachability function not found');

const context = {
  caseProgress: { stage: 1, gefundeneIndizIds: [] },
  engineCurrentLocation: null,
  _aktTageszeitName: () => 'abend',
  normForMatch: (value) => String(value || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').trim(),
  _indizNurUeberKampf: () => false,
};
vm.createContext(context);
vm.runInContext(html.slice(functionStart, functionEnd), context);

const spedition = {
  name: 'Spedition Schmidt Moabit',
  oeffnungszeit: ['vormittag', 'mittag', 'nachmittag', 'abend'],
  npcs: [{ id: 'norbert_tetzlaff', zeit: ['vormittag', 'mittag', 'nachmittag', 'abend'] }],
  indizien: [
    { id: 'tetzlaff_aussage', npc: 'norbert_tetzlaff', quelle: 'person', zeit: ['vormittag', 'mittag', 'nachmittag', 'abend'] },
    { id: 'briefchen_ilse', quelle: 'umgebung', zeit: ['vormittag', 'mittag', 'nachmittag', 'abend'], abStage: 2 },
  ],
};

let status = context.offeneIndizienAmOrtNachErreichbarkeit(spedition);
assert.strictEqual(status.jetzt, 1, 'at stage 1 Tetzlaff clue must remain reachable in the evening');
assert.strictEqual(status.spaeter, 1, 'stage-three letter must remain gated until stage 2');
context.caseProgress.stage = 2;
status = context.offeneIndizienAmOrtNachErreichbarkeit(spedition);
assert.strictEqual(status.jetzt, 2, 'at stage 2 both Spedition clues must be reachable in the evening');
assert.strictEqual(status.spaeter, 0);

const imageTableStart = html.indexOf('const SHARED_SCENE_IMAGES');
const imageTableEnd = html.indexOf('function _kesslerSceneNorm', imageTableStart);
assert(imageTableStart > -1 && imageTableEnd > imageTableStart, 'scene image registry missing');
const imageContext = {};
vm.createContext(imageContext);
vm.runInContext(html.slice(imageTableStart, imageTableEnd) + ';globalThis.images=SHARED_SCENE_IMAGES;', imageContext);
const images = imageContext.images;
const image = images.find((entry) => entry.file === 'spedition-schmidt-moabit.png');
assert(image && image.innen === true, 'Spedition image must be declared as interior');
assert.strictEqual(image.dayFile, 'spedition-schmidt-moabit-day.png', 'Spedition must expose a daylight variant');
assert(images.every((entry) => entry.dayFile), 'every Kessler scene image must expose a daylight variant');
for (const entry of images) {
  assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'kessler', entry.file)), 'dark scene asset missing: ' + entry.file);
  assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'kessler', entry.dayFile)), 'daylight scene asset missing: ' + entry.dayFile);
}

const visualClasses = new Set(['hidden']);
const visualElements = {
  'kessler-scene-visual': { classList: { add: (name) => visualClasses.add(name), remove: (name) => visualClasses.delete(name) } },
  'kessler-scene-image': {
    attrs: {}, alt: '', onload: null, onerror: null,
    getAttribute(name) { return this.attrs[name] || null; },
    setAttribute(name, value) { this.attrs[name] = value; },
  },
  'kessler-scene-place': { textContent: '' },
  'kessler-scene-time': { textContent: '' },
};
Object.assign(imageContext, {
  window: { HAUPTUI_AKTIV: true },
  document: { getElementById: (id) => visualElements[id] || null },
  caseSetup: { klient: 'Edith Kessler', opfer: 'Robert Kessler', tat: 'Beschattung' },
  engineCurrentLocation: { name: 'Hinterhof Sybelstrasse' },
  currentOrt: '',
  lastLocation: '',
  gameDay: 1,
  _aktTageszeitName: () => 'nachmittag',
  diag: () => {},
});
const visualFnStart = html.indexOf('function _kesslerSceneNorm');
const visualFnEnd = html.indexOf('function _clearKesslerSceneVisual', visualFnStart);
vm.runInContext(html.slice(visualFnStart, visualFnEnd), imageContext);
imageContext._renderKesslerSceneVisual({ szene: 'Robert verschwindet im Hinterhof.' });
assert.strictEqual(visualClasses.has('hidden'), false, 'initial Kessler scene must reveal its scene image');
assert.strictEqual(visualElements['kessler-scene-image'].attrs.src, 'assets/scenes/kessler/hinterhof-sybelstrasse-day.png', 'initial Kessler scene must select the daylight courtyard asset');

const textHelperStart = html.indexOf('function _kesslerInnenraumTextPasst');
const textHelperEnd = html.indexOf('function _renderKesslerSceneVisual', textHelperStart);
const textContext = {
  _kesslerSceneNorm: (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim(),
};
vm.createContext(textContext);
vm.runInContext(html.slice(textHelperStart, textHelperEnd), textContext);
assert.strictEqual(textContext._kesslerInnenraumTextPasst('Karl steht auf dem Hof vor dem Tor. In einem Büro brennt Licht.'), false, 'outside arrival must not show the interior image');
assert.strictEqual(textContext._kesslerInnenraumTextPasst('Karl tritt in das Büro. Tetzlaff sitzt am Schreibtisch.'), true, 'interior scene must show the interior image');

assert(html.includes('=== FESTES INNENRAUMBILD (PFLICHT) ==='), 'travel prompt must align prose with interior images');
assert(html.includes('=== BILD-RAUMWAHRHEIT (PFLICHT) ==='), 'restored scenes must return to the canonical interior');
assert(html.includes('_ortHatJetztErreichbareSpur'), 'empty-location banner must check live evidence reachability');
assert(html.includes('vorhandenNpc.zeit = qn.zeit.slice()'), 'save migration must update NPC schedules');
assert(html.includes('vorhanden.zeit = qi.zeit.slice()'), 'save migration must update evidence schedules');
assert(html.includes('setTimeout(function bootRestoreOrStart()'), 'boot restore must wait until Haupt-UI and image tables are initialized');
assert(html.indexOf('setTimeout(function bootRestoreOrStart()') < html.indexOf('const SHARED_SCENE_IMAGES'), 'deferred restore regression guard must cover the late image table');
assert(html.includes("return /abend|nacht/.test(_kesslerSceneNorm(tz));"), 'scene image selection must distinguish daylight from darkness');

console.log('KESSLER_SPEDITION_ARRIVAL_OK');
