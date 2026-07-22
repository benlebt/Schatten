const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sourceOf(name) {
  const marker = 'function ' + name + '(';
  const start = html.indexOf(marker);
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

const selectButton = html.match(/<button[^>]+id="select-case-btn"[^>]*>Fall auswählen<\/button>/);
assert(selectButton, 'Fall auswählen button missing');
assert(selectButton[0].includes('type="button"'), 'case selector must not submit an outer form');
assert(selectButton[0].includes('ontouchend="return openSetupSelectorFromStart(event)"'),
  'case selector lacks a direct Brave/iOS touchend path');
assert(selectButton[0].includes('onclick="return openSetupSelectorFromStart(event)"'),
  'case selector must retain click and keyboard activation');

const opener = sourceOf('openSetupSelectorFromStart');
assert(opener.includes("button.textContent = 'Zugang wird geprüft …'"),
  'case selector must show immediate feedback while auth is checked');
assert(opener.includes("button.setAttribute('aria-busy', 'true')"), 'case selector must expose its busy state');
assert(opener.includes('task = showSetupSelector();'), 'case selector must invoke auth directly in the user gesture');
assert(!opener.includes('window.setTimeout('), 'case selector must not defer auth beyond the user gesture');
assert(!opener.includes('.then(function() { showSetupSelector'), 'case selector must not promise-defer auth');

const auth = sourceOf('ensureSpielAuth');
assert(auth.includes('await requestSpielAuthInput(authFehler)'), 'auth must use the in-game password overlay');
assert(!auth.includes('window.prompt'), 'auth must not rely on native prompt in Brave/iOS');
assert(!auth.includes('window.alert'), 'wrong-password feedback must stay inside the game UI');

const authOverlay = sourceOf('requestSpielAuthInput');
assert(authOverlay.includes("overlay.id = 'spiel-auth-overlay'"), 'password overlay id missing');
assert(authOverlay.includes("input.type = 'password'"), 'password overlay must mask its input');
assert(authOverlay.includes("button.addEventListener('touchend'"), 'password buttons need touchend handling');
assert(authOverlay.includes("button.addEventListener('click'"), 'password buttons need click handling');
assert(authOverlay.includes('{ passive: false }'), 'password touch handler must be able to prevent the synthetic click');

const selector = sourceOf('showSetupSelector');
assert(selector.includes('attachSafeTap(card,'), 'case cards must use the central tap-vs-scroll guard');
assert(!selector.includes('card.onclick ='), 'case cards must not depend on flaky bare onclick handlers');

class FakeButton {
  constructor() {
    this.disabled = false;
    this.textContent = 'Fall auswählen';
    this.attributes = {};
  }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  removeAttribute(name) { delete this.attributes[name]; }
}

(async function runGestureRegression() {
  const button = new FakeButton();
  let calls = 0;
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const context = {
    console,
    Date,
    Promise,
    document: { getElementById(id) { return id === 'select-case-btn' ? button : null; } },
    showSetupSelector() { calls += 1; return pending; },
    showProgressToast() {},
    showStart() {},
  };
  vm.createContext(context);
  vm.runInContext('let _setupSelectorOpening = false; let _setupSelectorTapAt = 0;\n' + opener, context);

  let prevented = 0;
  let stopped = 0;
  const event = {
    preventDefault() { prevented += 1; },
    stopPropagation() { stopped += 1; },
  };
  assert.strictEqual(context.openSetupSelectorFromStart(event), false, 'inline handler must suppress browser default');
  assert.strictEqual(calls, 1, 'touchend must open the selector immediately');
  assert.strictEqual(button.disabled, true, 'button must disable while auth is pending');
  assert.strictEqual(button.attributes['aria-busy'], 'true', 'button must be marked busy');
  assert.strictEqual(button.textContent, 'Zugang wird geprüft …', 'button needs visible pending feedback');

  context.openSetupSelectorFromStart(event); // synthetic click after touchend
  assert.strictEqual(calls, 1, 'touchend plus synthetic click must not start auth twice');
  assert.strictEqual(prevented, 2, 'both delivered events must be consumed');
  assert.strictEqual(stopped, 2, 'both delivered events must not bubble');

  release();
  await pending;
  await Promise.resolve();
  await Promise.resolve();
  assert.strictEqual(button.disabled, false, 'button must recover after selector/auth completes');
  assert.strictEqual(button.textContent, 'Fall auswählen', 'button label must recover after completion');
  assert.strictEqual(button.attributes['aria-busy'], undefined, 'busy state must be cleared');

  console.log('STARTSCREEN_IOS_ACTIONS_OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
