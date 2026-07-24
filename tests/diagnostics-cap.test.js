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

const context = { window: {} };
vm.createContext(context);
vm.runInContext(
  'const DIAG_EVENT_CAP = 400; let currentSceneDiagnostics = null; let botDecisionLog = [];\n'
    + sourceOf('diagBegin') + '\n'
    + sourceOf('diag') + '\n'
    + 'globalThis.readFrame = () => currentSceneDiagnostics;',
  context,
);

context.diagBegin('scene');
for (let i = 0; i < 1000; i += 1) context.diag('detect', 'render-loop');
let frame = context.readFrame();
assert.strictEqual(frame.events.length, 1, 'identical hot-loop diagnostics must collapse into one event');
assert.strictEqual(frame.events[0].repeats, 1000, 'collapsed diagnostics must retain their repeat count');

context.diagBegin('scene');
for (let i = 0; i < 1000; i += 1) context.diag('detect', 'unique-' + i);
frame = context.readFrame();
assert.strictEqual(frame.events.length, 400, 'unique diagnostics must respect the per-scene hard cap');
assert.strictEqual(frame._droppedEvents, 600, 'the cap must still account for omitted diagnostics');

assert(html.includes('dg.events.slice(0, DIAG_EVENT_CAP)'), 'historical oversized frames must be capped before DOM rendering');
console.log('Diagnostic cap regression checks passed.');
