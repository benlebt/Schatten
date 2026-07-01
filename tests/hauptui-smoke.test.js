const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.parentNode = null;
    this.className = '';
    this.textContent = '';
    this.disabled = false;
    this.dataset = {};
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  insertBefore(child, reference) {
    child.parentNode = this;
    const index = this.children.indexOf(reference);
    if (index < 0) return this.appendChild(child);
    this.children.splice(index, 0, child);
    return child;
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
  }

  setAttribute(name, value) {
    this[name] = value;
  }

  addEventListener(name, handler) {
    if (name === 'click') this.onTap = handler;
  }

  querySelector(selector) {
    const className = selector.replace(':scope > ', '').replace('.', '');
    return this.children.find((child) => child.className.split(' ').includes(className)) || null;
  }
}

function all(root) {
  return [root].concat(root.children.flatMap(all));
}

function visibleText(root) {
  return root.textContent + root.children.map(visibleText).join('');
}

function byText(root, text) {
  return all(root).find((element) => element.tagName === 'button' && visibleText(element).startsWith(text));
}

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(html.includes("hauptuiQuickActions.className = 'hauptui-quick-actions'"), 'compact quick-action container missing');
assert(html.includes("? hauptuiQuickActions\n      : (typeof topActions"), 'travel action must use compact Haupt-UI container');
assert(html.includes("? hauptuiQuickActions : uebergangBody).appendChild(_sleepBtn)"), 'sleep action must use compact Haupt-UI container');
assert(html.includes('showSleepButton && !_imKampfNow && !window.HAUPTUI_AKTIV'), 'redundant special-action separator must stay hidden in Haupt-UI');
assert(!html.includes("commandText.textContent = selectedVerb ?"), 'permanent command prompt must be removed');
assert(html.includes("groups.filter(function (group) { return group.targets.length > 0; })"), 'empty target groups must be omitted');
assert(html.includes("if (ready) {\n      const execute"), 'execute button must only render for a complete command');
assert(html.includes('.hauptui-kategorien .werkzeug-row .werkzeug-btn {'), 'compact Haupt-UI tool button override missing');
assert(html.includes('grid-template-columns: repeat(3, minmax(0, 1fr));'), 'desktop controls must use a stable LucasArts-style grid');
assert(html.includes('.hauptui-quick-actions .option-btn-reise .option-id {'), 'travel icon must reserve enough width for the Opel SVG');
assert(html.includes("var ww = Math.round(hh * 64 / 30);"), 'Opel SVG must declare a real width instead of overlapping its label');
assert(html.includes('.hauptui-quick-actions .option-marker {\n    flex: 0 0 auto;\n    align-self: center;\n    margin-top: 0;\n    letter-spacing: 0;'), 'travel marker must be vertically centered with normal letter spacing');
assert(html.includes('.hauptui-kategorien .werkzeug-row .option-marker {\n    align-self: center;\n    margin-top: 0;\n    padding: 2px 6px;\n    letter-spacing: 0;'), 'tool marker typography must match the travel marker');
assert(html.includes("oeffneNpcMenue(npc, 'szene', true)"), 'Rede mit must request direct unambiguous conversation');
const npcMenuSource = html.slice(html.indexOf('function oeffneNpcMenue'), html.indexOf('// ===== Ende NPC-Interaktion ====='));
assert(npcMenuSource.includes("_direktVerb.key === 'befragen' || _direktVerb._verhoerOeffnen"), 'single conversation actions must bypass the redundant NPC popup inside the NPC menu');
const sceneVisualSource = html.slice(html.indexOf('function _renderKesslerSceneVisual'), html.indexOf('function _clearKesslerSceneVisual'));
assert(!sceneVisualSource.includes('direktWennEindeutig'), 'NPC direct-action code must never leak into scene-image rendering');
const start = html.indexOf('window.__hauptuiActionState');
const end = html.indexOf('</script>', start);
assert(start > -1 && end > start, 'Haupt-UI source block not found');

const calls = { npc: 0, fund: 0, options: [], marks: 0, flushes: 0, saves: 0 };
const clue = { id: 'kessler_brief', text: 'Roberts gefaltetes Briefchen' };
const voss = { id: 'voss', name: 'Oberkellner Voss', tag: 'WITNESS' };
const context = {
  console,
  window: {},
  document: { createElement: (tagName) => new FakeElement(tagName) },
  Object,
  String,
  Array,
  Date,
  sceneCounter: 3,
  caseProgress: { gefundeneIndizIds: [] },
  engineCurrentLocation: { name: 'Cafe Wien' },
  deriveInteractionMode: () => 'normal',
  attachSafeTap: (button, handler) => { button.onTap = handler; },
  _baukastenZiele: () => ({
    personen: [{ id: voss.id, name: voss.name, typ: 'person', hinweis: true, hinweisAktionen: ['Befragen', 'Bestechen'] }],
    objekte: [{ id: clue.id, name: 'Roberts Ecktisch', typ: 'objekt', actions: ['BEOBACHTEN', 'ERKUNDEN'], spur: true }],
    items: [{ id: 'notizbuch', name: 'Notizbuch', typ: 'item' }],
  }),
  _ortsFundItems: () => [],
  _ortsFundIndizienErreichbar: () => [clue],
  _itemsBeiKarl: () => [{ id: 'notizbuch', name: 'Notizbuch' }],
  getNpcsAtCurrentLocation: () => [voss],
  oeffneNpcMenue: (npc, modus, direkt) => {
    assert.strictEqual(npc.id, voss.id);
    calls.npc += 1;
    calls.npcModus = modus;
    calls.npcDirekt = direkt;
  },
  _markPopupOpened: () => {},
  _zeigeFundAuswahl: (items, clues) => { calls.fund += 1; calls.fundItems = items; calls.fundClues = clues; },
  chooseOption: (option) => calls.options.push(option),
  saveGameState: () => { calls.saves += 1; },
  _findeIndizById: (id) => id === clue.id ? clue : null,
  _markiereIndizGefunden: (indiz) => { calls.marks += 1; context.caseProgress.gefundeneIndizIds.push(indiz.id); return true; },
  _flushIndizRewards: () => { calls.flushes += 1; },
  showProgressToast: () => {},
  zeigeMiniAuswahl: () => {},
  npcInteraktion: () => {},
  _itemKatalogEintrag: () => null,
  diag: () => {},
};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

const container = new FakeElement('div');
context._renderEngineMenu(container, {});
assert(container.querySelector('.hauptui-action-menu'), 'menu must render');
const quickActions = new FakeElement('div');
quickActions.className = 'hauptui-quick-actions';
container.appendChild(quickActions);

const vossButton = byText(container, voss.name);
assert(vossButton, 'Voss target missing; buttons=' + all(container).filter((element) => element.tagName === 'button').map(visibleText).join(' | '));
assert(visibleText(vossButton).includes('Hinweis: Befragen/Bestechen'), 'person target must name the clue actions');
vossButton.onTap();
assert(container.children.indexOf(container.querySelector('.hauptui-action-menu')) < container.children.indexOf(quickActions), 're-rendered menu must remain above travel and sleep actions');
let execute = all(container).find((element) => element.className === 'hauptui-execute');
assert(execute && !execute.disabled, 'person command must be executable');
execute.onTap();
assert.strictEqual(calls.npc, 1, 'person command must open the real NPC menu');
assert.strictEqual(calls.npcModus, 'szene', 'Rede mit must exclude party-management actions');
assert.strictEqual(calls.npcDirekt, true, 'Rede mit must directly execute an unambiguous conversation');
assert(!all(container).some((element) => element.className.split(' ').includes('is-selected')), 'executed commands must clear their yellow selection state');

byText(container, 'Roberts Ecktisch').onTap();
execute = all(container).find((element) => element.className === 'hauptui-execute');
assert(execute && !execute.disabled, 'clue command must be executable');
assert(visibleText(execute).includes('Schau an'), 'clue command must recommend the configured BEOBACHTEN action');
execute.onTap();
assert.strictEqual(calls.fund, 0, 'specific clue command must not open a click-collect dialog');
assert.strictEqual(calls.options[calls.options.length - 1]._pendingIndizId, clue.id, 'clue command must start an AI investigation scene');
assert.strictEqual(context.caseProgress.pendingHauptuiIndiz.id, clue.id, 'clue must remain pending until the AI scene commits');
assert.strictEqual(calls.marks, 0, 'clue must not be booked on the initial click');
context._hauptuiPendingIndizEinloesen({ szene: 'Mikroszene' });
assert.strictEqual(calls.marks, 1, 'accepted AI scene must deterministically book the clue');
assert.strictEqual(calls.flushes, 1, 'accepted AI scene must show the clue reward');
assert.strictEqual(context.caseProgress.pendingHauptuiIndiz, null, 'pending clue must clear after commit');

const clueLocations = [
  {
    place: 'Hinterhof Sybelstrasse',
    people: [{ id: 'frau_pohl', name: 'Frau Pohl', typ: 'person', hinweis: true, hinweisAktionen: ['Befragen'] }],
    objects: [{ id: 'tuerschild_hauke', name: 'Klingelschilder prüfen', typ: 'objekt', actions: ['ERKUNDEN', 'DURCHSUCHEN'] }],
    expected: ['Frau Pohl', 'Klingelschilder prüfen'],
  },
  {
    place: 'Kessler-Wohnung Charlottenburg',
    people: [{ id: 'edith_kessler', name: 'Edith Kessler', typ: 'person', hinweis: true, hinweisAktionen: ['Ansprechen', 'Befragen'] }],
    objects: [],
    expected: ['Edith Kessler'],
  },
  {
    place: 'Spedition Schmidt Moabit',
    people: [{ id: 'norbert_tetzlaff', name: 'Norbert Tetzlaff', typ: 'person', hinweis: true, hinweisAktionen: ['Befragen', 'Bestechen'] }],
    objects: [{ id: 'briefchen_ilse', name: 'Roberts Schreibtisch durchsuchen', typ: 'objekt', actions: ['ERKUNDEN', 'DURCHSUCHEN'] }],
    expected: ['Norbert Tetzlaff', 'Roberts Schreibtisch durchsuchen'],
  },
  {
    place: 'Cafe Wien',
    people: [{ id: 'oberkellner_voss', name: 'Oberkellner Voss', typ: 'person', hinweis: true, hinweisAktionen: ['Ansprechen', 'Befragen'] }],
    objects: [{ id: 'robert_tisch_beobachtet', name: 'Vom Ecktisch aus beobachten', typ: 'objekt', actions: ['BEOBACHTEN', 'ERKUNDEN'] }],
    expected: ['Oberkellner Voss', 'Vom Ecktisch aus beobachten'],
  },
];
context.deriveInteractionMode = () => 'locked';
for (const location of clueLocations) {
  context.engineCurrentLocation = { name: location.place };
  context.window.__hauptuiActionState = { verb: null, targetKey: null };
  context._baukastenZiele = () => ({ personen: location.people, objekte: location.objects, items: [] });
  context._ortsFundIndizienErreichbar = () => location.objects.map((object) => ({ id: object.id, text: object.name }));
  context._renderEngineMenu(container, {});
  assert(container.querySelector('.hauptui-action-menu'), location.place + ' must render its menu during the final locked render');
  for (const target of location.expected) assert(byText(container, target), location.place + ' is missing target ' + target);
  assert(!byText(container, location.place), location.place + ' must be implicit instead of a repeated target button');
  const personButton = byText(container, location.people[0].name);
  personButton.onTap();
  assert(byText(container, 'Rede mit'), location.place + ' person mode must offer conversation');
  assert(byText(container, 'Schau an'), location.place + ' person mode must offer observation');
  assert(!byText(container, 'Warte'), location.place + ' person mode must not offer targetless waiting');
  assert(!byText(container, 'Versteck dich'), location.place + ' person mode must not offer targetless hiding');
  assert(!byText(container, 'Gib'), location.place + ' person mode must not offer giving without an item');
}

context._baukastenZiele = () => ({ personen: [], objekte: [], items: [] });
context._ortsFundIndizienErreichbar = () => [];
context._renderEngineMenu(container, {});
const searchButton = byText(container, 'Durchsuche');
assert(searchButton, 'empty locations must still offer Durchsuche');
assert(byText(container, 'Beobachte'), 'empty locations must offer active observation');
assert(byText(container, 'Lausche'), 'empty locations must offer listening');
assert(!byText(container, 'Umsehen'), 'redundant Umsehen action must stay removed');
assert(!byText(container, 'Versteck dich'), 'generic hiding must stay out of normal location mode');
assert(!byText(container, 'Warte'), 'generic waiting must stay out of normal location mode');
searchButton.onTap();
execute = all(container).find((element) => element.className === 'hauptui-execute');
assert(execute && !execute.disabled, 'Durchsuche must stay executable without targets');

const kesslerPlaces = [
  'Hinterhof Sybelstrasse',
  'Kessler-Wohnung Charlottenburg',
  'Spedition Schmidt Moabit',
  'Karl Mauers Büro',
  'Doc Wagners Praxis',
  'Cafe Wien',
  'Polizei Hardenbergstrasse',
  'Bahnhof Charlottenburg',
  'Karls Opel Olympia',
  'S-Bahnhof Friedrichstrasse',
];
for (const place of kesslerPlaces) {
  context.engineCurrentLocation = { name: place };
  context.window.__hauptuiActionState = { verb: null, targetKey: null };
  context._renderEngineMenu(container, {});
  assert(!byText(container, place), place + ' must not repeat as a visible target');
  assert(byText(container, 'Durchsuche'), place + ' must expose searching through the implicit location');
  assert(byText(container, 'Beobachte'), place + ' must expose active observation');
  assert(byText(container, 'Lausche'), place + ' must expose listening');
  assert(!byText(container, 'Umsehen'), place + ' must not expose redundant Umsehen');
  assert(!byText(container, 'Versteck dich'), place + ' must not expose generic hiding');
  assert(!byText(container, 'Warte'), place + ' must not expose generic waiting');
  byText(container, 'Durchsuche').onTap();
  execute = all(container).find((element) => element.className === 'hauptui-execute');
  assert(execute && !execute.disabled, place + ' must offer an executable implicit location action');
  assert(!visibleText(execute).includes(place), place + ' must not repeat in the execute label');
}

const targetsStart = html.indexOf('function _baukastenZiele()');
const targetsEnd = html.indexOf('try { window._baukastenZiele', targetsStart);
const targetContext = {
  window: { HAUPTUI_AKTIV: true },
  engineCurrentLocation: { name: 'Kessler-Wohnung Charlottenburg' },
  normForMatch: (value) => String(value || '').toLowerCase(),
  getNpcsAtCurrentLocation: () => [],
  getCaseLocations: () => [{ name: 'Kessler-Wohnung Charlottenburg', npcs: [{ id: 'edith_kessler', immer: true }] }],
  _aktTageszeitName: () => 'abend',
  _resolveNpcIdentity: () => ({ id: 'edith_kessler', name: 'Edith Kessler', tag: 'CLIENT' }),
  _npcHatOffenenHinweis: () => true,
  _npcOffeneHinweisAktionen: () => ['Ansprechen', 'Befragen'],
  _ortsFundIndizienErreichbar: () => [],
  _itemsBeiKarl: () => [],
  diag: () => {},
};
vm.createContext(targetContext);
vm.runInContext(html.slice(targetsStart, targetsEnd), targetContext);
const restoredTargets = targetContext._baukastenZiele();
assert.strictEqual(restoredTargets.personen.map((person) => person.name).join(','), 'Edith Kessler', 'location-wide map clue must restore Edith even when the exploration subnode returns no NPC');

console.log('HAUPTUI_KESSLER_10_ORTE_OK');
