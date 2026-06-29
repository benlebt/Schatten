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
const start = html.indexOf('window.__hauptuiActionState');
const end = html.indexOf('</script>', start);
assert(start > -1 && end > start, 'Haupt-UI source block not found');

const calls = { npc: 0, fund: 0, options: [] };
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
  deriveInteractionMode: () => 'normal',
  attachSafeTap: (button, handler) => { button.onTap = handler; },
  _baukastenZiele: () => ({
    personen: [{ id: voss.id, name: voss.name, typ: 'person', hinweis: true }],
    objekte: [{ id: clue.id, name: 'Roberts Ecktisch', typ: 'objekt', actions: ['DURCHSUCHEN'], spur: true }],
    items: [{ id: 'notizbuch', name: 'Notizbuch', typ: 'item' }],
  }),
  _ortsFundItems: () => [],
  _ortsFundIndizienErreichbar: () => [clue],
  _itemsBeiKarl: () => [{ id: 'notizbuch', name: 'Notizbuch' }],
  getNpcsAtCurrentLocation: () => [voss],
  oeffneNpcMenue: (npc) => { assert.strictEqual(npc.id, voss.id); calls.npc += 1; },
  _markPopupOpened: () => {},
  _zeigeFundAuswahl: (items, clues) => { calls.fund += 1; calls.fundItems = items; calls.fundClues = clues; },
  chooseOption: (option) => calls.options.push(option),
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

const vossButton = byText(container, voss.name);
assert(vossButton, 'Voss target missing; buttons=' + all(container).filter((element) => element.tagName === 'button').map(visibleText).join(' | '));
vossButton.onTap();
let execute = all(container).find((element) => element.className === 'hauptui-execute');
assert(execute && !execute.disabled, 'person command must be executable');
execute.onTap();
assert.strictEqual(calls.npc, 1, 'person command must open the real NPC menu');

byText(container, 'Roberts Ecktisch').onTap();
execute = all(container).find((element) => element.className === 'hauptui-execute');
assert(execute && !execute.disabled, 'clue command must be executable');
execute.onTap();
assert.strictEqual(calls.fund, 1, 'clue command must open the real find dialog');
assert.strictEqual(calls.fundClues.map((entry) => entry.id).join(','), clue.id);

context._baukastenZiele = () => ({ personen: [], objekte: [], items: [] });
context._ortsFundIndizienErreichbar = () => [];
context._renderEngineMenu(container, {});
const lookButton = byText(container, 'Umsehen');
assert(lookButton, 'empty locations must still offer Umsehen');
lookButton.onTap();
execute = all(container).find((element) => element.className === 'hauptui-execute');
assert(execute && !execute.disabled, 'Umsehen must stay executable without targets');

console.log('HAUPTUI_CAFE_WIEN_OK');
