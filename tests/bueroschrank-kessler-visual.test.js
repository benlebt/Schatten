const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sourceOf(name) {
  const start = html.indexOf('function ' + name + '(');
  assert(start >= 0, 'missing function ' + name);
  let depth = 0;
  let opened = false;
  for (let i = start; i < html.length; i += 1) {
    if (html[i] === '{') { depth += 1; opened = true; }
    else if (html[i] === '}') {
      depth -= 1;
      if (opened && depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('unterminated function ' + name);
}

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1292 +Friedliche-Gegnerangebote'"), 'release version missing');
assert(html.includes('BÜROSCHRANK · STARTAUSRÜSTUNG'), 'case start dialog must expose the office wardrobe');
assert(html.includes('Immer dabei: Walther PPK, Detektiv-Lizenz, Notizbuch und Bleistift.'), 'fixed detective gear must be explained');

const itemBlockStart = html.indexOf('const ITEM_KATALOG =');
const itemBlockEnd = html.indexOf('// v7.12.631 (Benjamin: "eintauschen für Information', itemBlockStart);
assert(itemBlockStart >= 0 && itemBlockEnd > itemBlockStart, 'wardrobe item block missing');

const inventoryContext = {
  window: {},
  sceneCounter: 0,
  caseProgress: {
    bueroschrankEingelagert: false,
    items: {
      brick: { id: 'brick', name: 'Ziegelstein', typ: 'gegenstand', status: 'bei_karl' },
      banana: { id: 'banana', name: 'Bananenschale', typ: 'gegenstand', status: 'bei_karl' },
      fish: { id: 'fish', name: 'Alter Fisch (aus dem Müll)', typ: 'gegenstand', status: 'bei_karl' },
      evidence: { id: 'evidence', name: 'Flasche Nordhäuser Doppelkorn', typ: 'beweis_dokument', status: 'bei_karl' },
      lost: { id: 'lost', name: 'Stinkbombe im Blechmantel', typ: 'gegenstand', status: 'verloren' },
    },
  },
  karlAkte: { bueroschrank: { handschellen: 1 } },
  normForMatch: value => String(value || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'),
  _karlAkteSave() {},
  diag() {},
};
inventoryContext._itemsBeiKarl = () => Object.values(inventoryContext.caseProgress.items).filter(item => item.status === 'bei_karl');
inventoryContext._itemAdd = function (item) {
  inventoryContext.caseProgress.items[item.id] = Object.assign({}, item);
  return true;
};
vm.createContext(inventoryContext);
vm.runInContext(
  html.slice(itemBlockStart, itemBlockEnd)
    + '\n' + sourceOf('_itemKatalogKey')
    + '\nglobalThis.wardrobe = {'
    + 'store:_bueroschrankAktuellenFallEinlagern,'
    + 'limit:_bueroschrankAuswahlBegrenzen,'
    + 'apply:_bueroschrankStartauswahlAnwenden};',
  inventoryContext,
);

inventoryContext.wardrobe.store();
assert.strictEqual(inventoryContext.karlAkte.bueroschrank.handschellen, 1, 'existing wardrobe stock must remain');
assert.strictEqual(inventoryContext.karlAkte.bueroschrank.ziegelstein, 1, 'durable carried item must enter the wardrobe');
assert.strictEqual(inventoryContext.karlAkte.bueroschrank.bananenschale, undefined, 'banana peel must perish between cases');
assert.strictEqual(inventoryContext.karlAkte.bueroschrank.alter_fisch, undefined, 'old fish must perish between cases');
assert.strictEqual(inventoryContext.karlAkte.bueroschrank.korn, undefined, 'case evidence must never transfer even if its name matches a tactical item');
assert.strictEqual(inventoryContext.karlAkte.bueroschrank.stinkbombe, undefined, 'lost item must stay lost');
assert.strictEqual(inventoryContext.caseProgress.bueroschrankEingelagert, true, 'same case must not be stored twice');
inventoryContext.wardrobe.store();
assert.strictEqual(inventoryContext.karlAkte.bueroschrank.ziegelstein, 1, 'repeated end-screen render must not duplicate stock');

inventoryContext.karlAkte.bueroschrank.korn = 2;
inventoryContext.karlAkte.bueroschrank.west_zigaretten = 1;
const limited = inventoryContext.wardrobe.limit(
  ['handschellen', 'ziegelstein', 'korn', 'korn', 'west_zigaretten'],
  inventoryContext.karlAkte.bueroschrank,
);
assert.deepStrictEqual(Array.from(limited), ['handschellen', 'ziegelstein', 'korn', 'korn'], 'start loadout must stop at four individual items');
inventoryContext.caseProgress = { items: {}, bueroschrankEingelagert: false };
inventoryContext.window._bueroschrankStartauswahl = limited;
const loaded = inventoryContext.wardrobe.apply();
assert.strictEqual(loaded.length, 4, 'four chosen items must be booked into the fresh case');
assert.strictEqual(Object.keys(inventoryContext.caseProgress.items).length, 4, 'fresh case item state must contain the chosen loadout');
assert.strictEqual(inventoryContext.karlAkte.bueroschrank.west_zigaretten, 1, 'unselected stock must remain in the office');
assert.strictEqual(inventoryContext.karlAkte.bueroschrank.korn, undefined, 'selected quantities must leave the office while carried');

const bindingContext = {
  currentScene: { personenImRaum: ['Edith Kessler', 'Norbert Tetzlaff'] },
  engineCurrentLocation: { name: 'Kessler-Wohnung Charlottenburg' },
  caseProgress: { stage: 3, klientGesprochen: true },
  gameTimeIdx: 4,
  TIMES_OF_DAY: ['morgen', 'vormittag', 'mittag', 'nachmittag', 'abend', 'nacht'],
  normForMatch: value => String(value || '').toLowerCase().replace(/_/g, ' '),
  _npcZustandIstEntfernt: () => false,
  _istKlient: () => false,
  getCaseLocations: () => [
    { name: 'Kessler-Wohnung Charlottenburg', npcs: [{ id: 'edith_kessler', immer: true }] },
    { name: 'Spedition Schmidt Moabit', npcs: [{ id: 'norbert_tetzlaff', zeit: ['vormittag', 'mittag', 'nachmittag', 'abend'] }] },
  ],
};
vm.createContext(bindingContext);
vm.runInContext(
  sourceOf('_npcOrtsbindungEintragAktiv') + '\n'
  + sourceOf('_npcIstImAktuellenSzenenSnapshot') + '\n'
  + sourceOf('_npcGehoertHierher'),
  bindingContext,
);
assert.strictEqual(bindingContext._npcGehoertHierher('norbert_tetzlaff', 'Norbert Tetzlaff'), false,
  'AI scene snapshot must not teleport Tetzlaff from the Spedition into Edith apartment');
assert.strictEqual(bindingContext._npcGehoertHierher('edith_kessler', 'Edith Kessler'), true,
  'the actually configured apartment resident must remain present');

let hellbachState = { status: 'frei', ort: 'Hinterhof Sybelstrasse' };
const visualContext = {
  caseProgress: { activeConfrontation: { enemyName: 'Wachtmeister Eugen Hellbach', enemyEntries: [] } },
  engineCurrentLocation: { name: 'Hinterhof Sybelstrasse' },
  normForMatch: value => String(value || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'),
  _istKesslerFall: () => true,
  _npcZustandGet: () => hellbachState,
  _konfrontationAktiv: () => true,
  _encounterAktiv: () => false,
  getNpcsAtCurrentLocation: () => [{ name: 'Wachtmeister Eugen Hellbach' }],
};
vm.createContext(visualContext);
vm.runInContext(sourceOf('_kesslerHellbachVisual'), visualContext);
let spec = visualContext._kesslerHellbachVisual({ personenImRaum: [] });
assert.strictEqual(spec.dayFile, 'hinterhof-sybelstrasse-hellbach-confrontation-day.png', 'active Hellbach must use confrontation art');
hellbachState = { status: 'ko', ort: 'Hinterhof Sybelstrasse' };
spec = visualContext._kesslerHellbachVisual({ personenImRaum: [] });
assert.strictEqual(spec.nightFile, 'hinterhof-sybelstrasse-hellbach-ko-night.png', 'local K.O. Hellbach must use aftermath art');
hellbachState = { status: 'geflohen', ort: 'Hinterhof Sybelstrasse' };
assert.strictEqual(visualContext._kesslerHellbachVisual({ personenImRaum: [] }), null, 'fled Hellbach must leave the base courtyard empty');

for (const asset of [
  'hinterhof-sybelstrasse-hellbach-confrontation-day.png',
  'hinterhof-sybelstrasse-hellbach-confrontation-night.png',
  'hinterhof-sybelstrasse-hellbach-ko-day.png',
  'hinterhof-sybelstrasse-hellbach-ko-night.png',
]) {
  assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'kessler', asset)), 'missing Hellbach visual asset: ' + asset);
}

console.log('Bueroschrank/Kessler visual regression checks passed.');
