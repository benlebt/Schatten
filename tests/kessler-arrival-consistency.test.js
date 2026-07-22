const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(html.includes('Robert hat den Hof noch NICHT betreten.'), 'Kessler opening must leave Robert outside until the courtyard observation clue introduces his arrival');
assert(html.includes("Robert hat den Hof zu Spielbeginn noch NICHT betreten"), 'Kessler target setup must agree with the later courtyard arrival');
assert(html.includes('ein anderer Ort als der Hinterhof Sybelstrasse'), 'Edith apartment and Robert courtyard must remain distinct locations');
assert(html.includes('function _schlafHeimfahrtOrtSetzen(reason)'), 'home sleep must set the engine location before scene generation');
assert(html.includes("option._heimfahrtVon = (engineCurrentLocation && engineCurrentLocation.name) || '';"), 'home sleep must remember where Karl was asked to leave');
assert(html.includes("_schlafHeimfahrtOrtSetzen('option');"), 'home sleep must synchronize location immediately when selected');
assert(html.includes("engineCurrentLocation = { name: heimLoc.name, sektor: heimLoc.sektor || '' };"), 'home sleep must update the canonical engine location');
assert(html.includes("currentOrtType = 'HOME';"), 'home sleep must mark the current location as home');
assert(html.includes('ABSCHIED VOR DER HEIMFAHRT (PFLICHT)'), 'home sleep from a closing venue must narrate why Karl had to leave');

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
const rothRevierImage = images.find((entry) => entry.place === 'Volkspolizei-Revier Hackescher Markt');
assert(rothRevierImage, 'Roth police station image must be registered for Kessler/shared locations');
assert.strictEqual(rothRevierImage.root, 'assets/scenes/wegener/', 'Roth police station must reuse the Volkspolizei scene asset root');
const chariteImage = images.find((entry) => entry.place === 'Charite Notaufnahme');
assert(chariteImage, 'Charite image must be registered for Kessler/shared healing locations');
assert.strictEqual(chariteImage.root, 'assets/scenes/wessel/', 'Charite healing location must reuse the Wessel Charite asset root');
const trudeImage = images.find((entry) => entry.place === 'Imbiss Bei Trude');
assert(trudeImage, 'Trude image must be registered for Kessler/shared anchor locations');
assert.strictEqual(trudeImage.root, 'assets/scenes/wegener/', 'Trude global location must reuse the Wegener Imbiss asset root');
assert(images.every((entry) => entry.dayFile), 'every Kessler scene image must expose a daylight variant');
for (const entry of images) {
  const nightFile = entry.nightFile || entry.file.replace(/(\.[a-z0-9]+)$/i, '-night$1');
  const root = entry.root || 'assets/scenes/kessler/';
  assert(fs.existsSync(path.join(__dirname, '..', root, entry.file)), 'dark scene asset missing: ' + root + entry.file);
  assert(fs.existsSync(path.join(__dirname, '..', root, entry.dayFile)), 'daylight scene asset missing: ' + root + entry.dayFile);
  assert(fs.existsSync(path.join(__dirname, '..', root, nightFile)), 'night scene asset missing: ' + root + nightFile);
}

const visualClasses = new Set(['hidden']);
const visualElements = {
  'kessler-scene-visual': {
    classList: {
      add: (name) => visualClasses.add(name),
      remove: (...names) => names.forEach((name) => visualClasses.delete(name)),
      toggle: (name, force) => {
        if (force) visualClasses.add(name);
        else visualClasses.delete(name);
      },
    },
    querySelector: () => null,
    appendChild: () => {},
  },
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
assert.strictEqual(imageContext._kesslerSceneIstStarkerOrtsanker('Imbiss Bei Trude'), true, 'Trude/Imbiss must be treated as a strong explicit location anchor');
imageContext._renderKesslerSceneVisual({ szene: 'Robert verschwindet im Hinterhof.' });
assert.strictEqual(visualClasses.has('hidden'), false, 'initial Kessler scene must reveal its scene image');
assert.strictEqual(visualElements['kessler-scene-image'].attrs.src, 'assets/scenes/kessler/hinterhof-sybelstrasse-day.png', 'initial Kessler scene must select the daylight courtyard asset');
imageContext.engineCurrentLocation = { name: 'Kessler-Wohnung Charlottenburg' };
imageContext._aktTageszeitName = () => 'nacht';
imageContext._renderKesslerSceneVisual({ szene: 'Du stellst den Motor ab, steigst aus und gehst schnellen Schrittes in die Wohnung. Edith Kessler öffnet dir.' });
assert.strictEqual(visualClasses.has('hidden'), false, 'Kessler apartment night scene must reveal its scene image');
assert.strictEqual(visualElements['kessler-scene-image'].attrs.src, 'assets/scenes/kessler/kessler-wohnung-charlottenburg-night.png', 'Kessler apartment at night must select the true night apartment asset');
assert.strictEqual(visualElements['kessler-scene-place'].textContent, 'Kessler-Wohnung, Charlottenburg', 'Kessler apartment caption must be set');
imageContext.engineCurrentLocation = { name: 'Cafe Wien' };
imageContext._aktTageszeitName = () => 'nacht';
imageContext._renderKesslerSceneVisual({ szene: 'Du laesst das Cafe Wien hinter dir. Draussen auf dem Kurfuerstendamm beisst der Wind.' });
assert.strictEqual(visualClasses.has('hidden'), false, 'transitional cafe prose must keep the best matching scene image visible');
assert.strictEqual(visualElements['kessler-scene-image'].attrs.src, 'assets/scenes/kessler/cafe-wien-night.png', 'Cafe Wien at night must keep the true night cafe asset even during transitional prose');
visualClasses.add('hidden');
visualElements['kessler-scene-image'].attrs = {};
visualElements['kessler-scene-place'].textContent = '';
imageContext.engineCurrentLocation = null;
imageContext.currentOrt = '';
imageContext.lastLocation = '';
imageContext._renderKesslerSceneVisual({ szene: 'Im Cafe Wien verstummt der Oberkellner, bevor Karl wieder auf den Kurfuerstendamm tritt.' });
assert.strictEqual(visualClasses.has('hidden'), false, 'scene prose must be enough to recover the Cafe Wien scene image when the engine location is briefly empty');
assert.strictEqual(visualElements['kessler-scene-image'].attrs.src, 'assets/scenes/kessler/cafe-wien-night.png', 'Cafe Wien text fallback must select the true night cafe asset');
imageContext.engineCurrentLocation = { name: 'Volkspolizei-Revier Hackescher Markt' };
imageContext.currentOrt = '';
imageContext.lastLocation = '';
imageContext.gameDay = 2;
imageContext._aktTageszeitName = () => 'vormittag';
imageContext._renderKesslerSceneVisual({ szene: 'Roth nennt die Spedition Schmidt in Moabit und Tetzlaffs Frachtpapiere.' });
assert.strictEqual(visualClasses.has('hidden'), false, 'Roth police station scene must reveal a police station image');
assert.strictEqual(visualElements['kessler-scene-image'].attrs.src, 'assets/scenes/wegener/volkspolizei-hans-beimler-day.png', 'explicit Roth police station location must beat Spedition prose mentions');
assert.strictEqual(visualElements['kessler-scene-place'].textContent, 'Volkspolizei-Revier Hackescher Markt', 'Roth police station caption must be set');
imageContext.engineCurrentLocation = { name: 'Charité' };
imageContext.currentOrt = 'Karls Opel Olympia';
imageContext.lastLocation = 'Volkspolizei-Revier Hackescher Markt';
imageContext.gameDay = 2;
imageContext._aktTageszeitName = () => 'nachmittag';
imageContext._renderKesslerSceneVisual({ szene: 'Vor dem Revier denkt Karl an den Opel, aber Marlene Wagner erwartet ihn in der Charité.' });
assert.strictEqual(visualClasses.has('hidden'), false, 'Charite healing scene must reveal a Charite image');
assert.strictEqual(visualElements['kessler-scene-image'].attrs.src, 'assets/scenes/wessel/charite-notaufnahme-day.png', 'explicit Charite location must beat stale Opel/Revier anchors and prose references');
assert.strictEqual(visualElements['kessler-scene-place'].textContent, 'Charite Notaufnahme', 'Charite healing scene caption must be set');
imageContext.engineCurrentLocation = { name: 'Imbiss Bei Trude' };
imageContext.currentOrt = 'Karls Opel Olympia';
imageContext.lastLocation = 'Charite';
imageContext.gameDay = 2;
imageContext._aktTageszeitName = () => 'abend';
imageContext._renderKesslerSceneVisual({ szene: 'Der Opel Olympia nagelt muede, als du am Hackeschen Markt abstellst. Trude steht hinter dem Tresen.' });
assert.strictEqual(visualClasses.has('hidden'), false, 'Trude scene must reveal a Trude image');
assert.strictEqual(visualElements['kessler-scene-image'].attrs.src, 'assets/scenes/wegener/imbiss-bei-trude.png', 'explicit Trude location must beat stale Opel/Charite anchors and Opel prose');
assert.strictEqual(visualElements['kessler-scene-place'].textContent, 'Imbiss Bei Trude', 'Trude scene caption must be set');
imageContext.currentOrt = 'Hinterhof Sybelstrasse';
imageContext.lastLocation = 'Hinterhof Sybelstrasse';
imageContext._renderKesslerSceneVisual({ szene: 'Trude sagt: Die Frau in der Sybelstrasse, die Hauke, war letzte Woche hier.' });
assert.strictEqual(visualElements['kessler-scene-image'].attrs.src, 'assets/scenes/wegener/imbiss-bei-trude.png', 'explicit Trude location must beat Sybelstrasse clue prose and stale courtyard anchors');
assert.strictEqual(visualElements['kessler-scene-place'].textContent, 'Imbiss Bei Trude', 'Trude caption must survive Sybelstrasse clue prose');
imageContext.engineCurrentLocation = { name: 'Hinterhof Sybelstrasse' };
imageContext.currentOrt = '';
imageContext.lastLocation = '';
imageContext.gameDay = 2;
imageContext._aktTageszeitName = () => 'nacht';
imageContext._renderKesslerSceneVisual({ szene: 'Karl bleibt im Hinterhof der Sybelstrasse.' });
assert.strictEqual(visualElements['kessler-scene-image'].attrs.src, 'assets/scenes/kessler/hinterhof-sybelstrasse-night.png', 'courtyard night scene must select the true night asset');
assert.strictEqual(visualElements['kessler-scene-time'].textContent, 'Tag 2 · Nacht', 'courtyard night caption must reflect the live day and time');
imageContext.gameDay = 3;
imageContext._aktTageszeitName = () => 'morgen';
imageContext._renderKesslerSceneVisual({ szene: 'Du findest im Flur des Mietshauses einen Muenzfernsprecher.' });
assert.strictEqual(visualElements['kessler-scene-image'].attrs.src, 'assets/scenes/kessler/hinterhof-sybelstrasse-day.png', 'same-location morning scene must replace the stale night asset');
assert.strictEqual(visualElements['kessler-scene-time'].textContent, 'Tag 3 · Morgen', 'same-location morning scene must refresh the stale caption');

const textHelperStart = html.indexOf('function _kesslerInnenraumTextPasst');
const textHelperEnd = html.indexOf('function _renderKesslerSceneVisual', textHelperStart);
const textContext = {
  _kesslerSceneNorm: (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim(),
};
vm.createContext(textContext);
vm.runInContext(html.slice(textHelperStart, textHelperEnd), textContext);
assert.strictEqual(textContext._kesslerInnenraumTextPasst('Karl steht auf dem Hof vor dem Tor. In einem Büro brennt Licht.'), false, 'outside/interior mismatch may be diagnosed but must no longer blank the scene image');
assert.strictEqual(textContext._kesslerInnenraumTextPasst('Karl tritt in das Büro. Tetzlaff sitzt am Schreibtisch.'), true, 'interior scene must show the interior image');
assert.strictEqual(textContext._kesslerInnenraumTextPasst('Du stellst den Motor ab und gehst in die Wohnung. Edith wartet.'), true, 'apartment arrival from the Opel must still show the apartment image');

assert(html.includes('=== FESTES INNENRAUMBILD (PFLICHT) ==='), 'travel prompt must align prose with interior images');
assert(html.includes('=== BILD-RAUMWAHRHEIT (PFLICHT) ==='), 'restored scenes must return to the canonical interior');
assert(html.includes('_ortHatJetztErreichbareSpur'), 'empty-location banner must check live evidence reachability');
assert(html.includes('vorhandenNpc.zeit = qn.zeit.slice()'), 'save migration must update NPC schedules');
assert(html.includes('vorhanden.zeit = qi.zeit.slice()'), 'save migration must update evidence schedules');
assert(html.includes('setTimeout(function bootRestoreOrStart()'), 'boot restore must wait until Haupt-UI and image tables are initialized');
assert(html.indexOf('setTimeout(function bootRestoreOrStart()') < html.indexOf('const SHARED_SCENE_IMAGES'), 'deferred restore regression guard must cover the late image table');
assert(html.includes("if (/nacht/.test(norm)) return 'nacht';"), 'scene image selection must distinguish night from evening');
assert(html.includes("zeitBucket === 'abend' ? spec.file"), 'scene image selection must keep evening on the original dark asset');
assert(/showHeader\(scene\);\s*renderLog\(\);\s*try \{ if \(typeof _renderKesslerSceneVisual === 'function'\) _renderKesslerSceneVisual\(scene\); \} catch \(e\) \{\}/.test(html), 'scene visual must sync before solved/failed branches skip renderOptions');

console.log('KESSLER_SPEDITION_ARRIVAL_OK');
