const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(html.includes("'options','kessler-scene-visual','freitext-block'"), 'hideAll must hide the standalone scene visual');
assert(html.includes('function _clearKesslerSceneVisual()'), 'scene visual reset helper missing');
assert(html.includes("image.removeAttribute('src')"), 'scene visual reset must clear the stale image source');
assert(html.includes("function showStart() {\n  try { if (typeof _clearKesslerSceneVisual"), 'start screen must clear the previous scene visual');
const start = html.indexOf('(function scheduleBootRestoreOrStart()');
const end = html.indexOf('// v7.11.92: Zusaetzliche Save-Trigger', start);
assert(start > -1 && end > start, 'deferred boot restore block missing');

const queue = [];
let restoreCalls = 0;
const context = {
  console,
  Date,
  hasSavedGame: () => true,
  restoreGameState: () => { restoreCalls += 1; return true; },
  showStart: () => { throw new Error('saved game must not open start screen'); },
  showProgressToast: () => {},
  setTimeout: (fn) => { queue.push(fn); return queue.length; },
};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

assert.strictEqual(restoreCalls, 0, 'restore must not run before late Haupt-UI constants initialize');
assert.strictEqual(queue.length, 1, 'boot restore must schedule exactly one initial task');
queue.shift()();
assert.strictEqual(restoreCalls, 1, 'scheduled boot task must restore the saved game');

console.log('RESTORE_UI_DEFERRED_OK');
