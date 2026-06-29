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

const rawImages = html.match(/const KESSLER_SCENE_IMAGES = (\[[\s\S]*?\n\]);/);
assert(rawImages, 'Kessler scene image map missing');
const images = Function('return ' + rawImages[1])();
const image = images.find((entry) => entry.file === 'spedition-schmidt-moabit.png');
assert(image && image.innen === true, 'Spedition image must be declared as interior');

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

console.log('KESSLER_SPEDITION_ARRIVAL_OK');
