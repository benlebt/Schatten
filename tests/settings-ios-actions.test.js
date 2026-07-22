const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sourceOf(name) {
  const start = html.indexOf('function ' + name + '(');
  assert(start >= 0, 'missing function ' + name);
  const brace = html.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let i = brace; i < html.length; i += 1) {
    const ch = html[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('unterminated function ' + name);
}

const debugButton = html.match(/<button[^>]+>🔒 Debug-Modus deaktivieren<\/button>/);
assert(debugButton, 'debug deactivate button missing');
assert(debugButton[0].includes('ontouchend="return deactivateDebugMode(event)"'),
  'debug deactivate must have a direct iOS touch handler');
assert(debugButton[0].includes('onclick="return deactivateDebugMode(event)"'),
  'debug deactivate must retain click/keyboard activation');

for (const [label, handler] of [
  ['Neue Karriere / alles zurücksetzen', 'resetCareerFromSettings'],
  ['Karriere zurücksetzen &amp; Fall neu starten', 'freshCaseTestFromSettings'],
  ['🗑 Alle Modell-Sperren löschen', 'resetModelBlocks'],
]) {
  const match = html.match(new RegExp('<button[^>]+>' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '<\\/button>'));
  assert(match, label + ' button missing');
  assert(match[0].includes('ontouchend="return ' + handler + '(event)"'), label + ' lacks direct touchend handling');
  assert(match[0].includes('onclick="return ' + handler + '(event)"'), label + ' lacks click handling');
}

const restart = sourceOf('startNewInvestigation');
assert(restart.includes('resetGame(!!skipConfirm);'), 'restart must stay in the direct user gesture');
assert(!restart.includes('window.setTimeout'), 'restart must not defer the confirmation beyond the iOS user gesture');

const reset = sourceOf('resetGame');
assert(reset.includes('showSettingsActionConfirmation({'), 'active-case reset must use the in-game confirmation');
assert(reset.includes('onConfirm: function() { resetGame(true); }'), 'confirmed reset must bypass a second prompt');
assert(!/\bconfirm\s*\(/.test(reset), 'active-case reset must not use native confirm');

const deactivate = sourceOf('deactivateDebugMode');
assert(deactivate.includes('showSettingsActionConfirmation({'), 'debug disable must use the in-game confirmation');
assert(deactivate.includes('setAdminUnlocked(false)'), 'confirmed debug disable must clear admin state');
assert(deactivate.includes("searchParams.delete('debug')"), 'debug disable must remove the activating URL parameter');
assert(deactivate.includes('event.preventDefault'), 'debug touch handler must suppress the synthetic click');
assert(!/\bconfirm\s*\(/.test(deactivate), 'debug disable must not use native confirm');

for (const name of ['resetCareerFromSettings', 'freshCaseTestFromSettings', 'resetModelBlocks']) {
  const body = sourceOf(name);
  assert(body.includes('showSettingsActionConfirmation({'), name + ' must share the Brave-safe confirmation');
  assert(!/\bconfirm\s*\(/.test(body), name + ' must not use native confirm');
}

class FakeNode {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName;
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.listeners = {};
    this.style = {};
    this.attributes = {};
    this.parentNode = null;
    this.textContent = '';
    this.type = '';
    this._id = '';
  }
  set id(value) {
    if (this._id) delete this.ownerDocument.nodes[this._id];
    this._id = value;
    if (value) this.ownerDocument.nodes[value] = this;
  }
  get id() { return this._id; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  appendChild(child) { child.parentNode = this; this.children.push(child); return child; }
  addEventListener(type, handler, options) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push({ handler, options });
  }
  remove() {
    if (this.parentNode) this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
    if (this._id) delete this.ownerDocument.nodes[this._id];
    this.parentNode = null;
  }
}

const document = {
  nodes: {},
  createElement(tag) { return new FakeNode(tag, this); },
  getElementById(id) { return this.nodes[id] || null; },
};
document.body = new FakeNode('body', document);

const context = { document, console };
vm.createContext(context);
vm.runInContext(sourceOf('showSettingsActionConfirmation'), context);

let confirmations = 0;
context.showSettingsActionConfirmation({
  title: 'Test',
  message: 'Touch-Test',
  onConfirm() { confirmations += 1; },
});
const overlay = document.getElementById('settings-action-confirm');
assert(overlay, 'confirmation overlay was not added');
const actionRow = overlay.children[0].children[2];
const confirmButton = actionRow.children[0];
assert(confirmButton.listeners.touchend[0].options.passive === false,
  'touchend listener must be non-passive so preventDefault works');
let prevented = 0;
let stopped = 0;
const event = {
  preventDefault() { prevented += 1; },
  stopPropagation() { stopped += 1; },
};
confirmButton.listeners.touchend[0].handler(event);
confirmButton.listeners.click[0].handler(event); // synthetic WebKit click after touchend
assert.strictEqual(confirmations, 1, 'touchend plus synthetic click must confirm only once');
assert.strictEqual(prevented, 2, 'both delivered events must be consumed');
assert.strictEqual(stopped, 2, 'both delivered events must not escape to the settings menu');
assert.strictEqual(document.getElementById('settings-action-confirm'), null, 'overlay must close after confirmation');

console.log('SETTINGS_IOS_ACTIONS_OK');
