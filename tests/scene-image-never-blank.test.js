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

const context = {
  _kesslerSceneFindSpec: (set, candidates) => set.images.find((entry) =>
    candidates.some((candidate) => entry.test.test(String(candidate).toLowerCase()))),
};
vm.createContext(context);
vm.runInContext(sourceOf('_szenenbildOrtsgrundmotivFallbackSpec'), context);

const ortsgrundmotiv = {
  test: /testort/,
  file: 'testort-karl-night.webp',
  dayFile: 'testort-karl-day.webp',
  place: 'Testort',
  presenceVariants: [{
    id: 'rex',
    requiresParty: ['Rex'],
    file: 'testort-karl-rex-night.webp',
    dayFile: 'testort-karl-rex-day.webp',
  }],
};
const fallback = context._szenenbildOrtsgrundmotivFallbackSpec(
  { images: [ortsgrundmotiv] },
  ['Testort'],
);
assert(fallback, 'a mapped location must expose a neutral base-image fallback');
assert.strictEqual(fallback.file, 'testort-karl-night.webp',
  'a missing Rex special image must fall back to the same location without Rex');
assert.deepStrictEqual(Array.from(fallback.presenceVariants), [],
  'the fallback must not recursively select the missing Rex variant again');
assert.strictEqual(fallback._ortsgrundmotivFallback, true,
  'the neutral location fallback must remain diagnosable');

const renderer = sourceOf('_renderKesslerSceneVisual');
const specialIndex = renderer.indexOf("bildQuelleHinzufuegen(src, spec, 'Spezialmotiv')");
const baseIndex = renderer.indexOf("'Karl-allein-Ortsgrundmotiv'");
const emergencyIndex = renderer.lastIndexOf('_szenenbildNotfallAnzeigen(');
assert(specialIndex >= 0 && baseIndex > specialIndex && emergencyIndex > baseIndex,
  'fallback order must be special image, neutral Karl-at-location image, then embedded emergency art');
assert(renderer.includes('bildQuellen.findIndex')
    && renderer.includes('image.setAttribute(\'src\', naechsteQuelle.src)'),
  'image load errors must walk the complete fallback chain instead of hiding the image');

const emergencyContext = {};
vm.createContext(emergencyContext);
vm.runInContext(sourceOf('_szenenbildNotfallDataUrl'), emergencyContext);
const emergency = decodeURIComponent(
  emergencyContext._szenenbildNotfallDataUrl('Margarete Steins Wohnung')
    .replace(/^data:image\/svg\+xml;charset=utf-8,/, ''),
);
assert(emergency.includes('KARL MAUER · Margarete Steins Wohnung')
    && emergency.includes('NEUTRALES ERSATZMOTIV'),
  'even total asset failure must render Karl alone with the current location instead of a blank region');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1774 +HandoffVisualTruth'"),
  'release version is stale');

console.log('SCENE_IMAGE_NEVER_BLANK_OK');
