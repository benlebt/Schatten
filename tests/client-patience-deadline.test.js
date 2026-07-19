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
  for (let i = brace; i < html.length; i += 1) {
    if (html[i] === '{') depth += 1;
    if (html[i] === '}') {
      depth -= 1;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('unterminated function ' + name);
}

let deadline = 4;
const context = {
  getFallFristTage: () => deadline,
  FALLFRIST_TAGE_DEFAULT: 5
};
vm.createContext(context);
vm.runInContext(sourceOf('normalizeClientPatienceToDeadline'), context);

const krausePatience = {
  geduldsstufe1: 5,
  geduldsstufe2: 8,
  geduldsstufe3: 11
};
context.normalizeClientPatienceToDeadline(krausePatience);
assert.strictEqual(krausePatience.geduldsstufe1, 2, 'Krause reminder must occur before warning');
assert.strictEqual(krausePatience.geduldsstufe2, 3, 'Krause warning must occur before cancellation');
assert.strictEqual(krausePatience.geduldsstufe3, 4, 'cancellation must not exceed the four-day deadline');

deadline = 6;
const longerCase = {
  geduldsstufe1: 4,
  geduldsstufe2: 6,
  geduldsstufe3: 8
};
context.normalizeClientPatienceToDeadline(longerCase);
assert.strictEqual(longerCase.geduldsstufe1, 4, 'valid reminder timing should be retained');
assert.strictEqual(longerCase.geduldsstufe2, 5, 'warning must leave room for cancellation');
assert.strictEqual(longerCase.geduldsstufe3, 6, 'cancellation must be clamped to the deadline');

const hookCount = (html.match(/normalizeClientPatienceToDeadline\(clientProfile\)/g) || []).length;
assert(hookCount >= 4, 'new cases and restored saves must both normalize patience timing');

console.log('client-patience-deadline.test.js: OK');
