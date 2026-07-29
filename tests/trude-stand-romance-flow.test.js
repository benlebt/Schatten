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
  for (let i = brace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error('unterminated function ' + name);
}

const context = {
  engineCurrentLocation: { name: 'Imbiss Bei Trude' },
  normForMatch(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  },
};
vm.createContext(context);
vm.runInContext(sourceOf('_findTrudeStandImageDrift'), context);

const liveMismatch = context._findTrudeStandImageDrift({
  ort: 'Imbiss Bei Trude',
  szene: 'Trude wischt über die Theke ihres Imbisses, als du den Kopf zur Tür hineinsteckst. Sie nickt zum leeren Hocker am Tresen.',
});
assert(liveMismatch && liveMismatch.code === 'trude_stand_image_drift',
  'the exact live indoor prose must be rejected against Trude outdoor image');
assert.strictEqual(context._findTrudeStandImageDrift({
  ort: 'Imbiss Bei Trude',
  szene: 'Du trittst über das feuchte Pflaster an den offenen Holzstand. Trude wartet hinter dem Ausgabebrett.',
}), null, 'truthful outdoor stand prose must remain valid');

assert(html.includes("arrivalFallbackText: 'Du stellst den Opel am Hackeschen Markt ab"),
  'every injected Trude location needs a canonical outdoor arrival fallback');
assert(html.includes("presenceFallbackText: 'Trude bleibt hinter dem Ausgabebrett"),
  'ongoing Trude scenes need a canonical outdoor presence fallback');
assert(html.includes("problem.code === 'trude_stand_image_drift'"),
  'Trude image truth must have retry and deterministic hard-fallback handling');

console.log('TRUDE_STAND_ROMANCE_FLOW_OK');
