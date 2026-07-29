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

function normForMatch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

const locationTruthContext = {
  engineCurrentLocation: { name: 'Strauss-Wohnung Wedding' },
  normForMatch,
  _aktuelleAktionIstReise: false,
};
vm.createContext(locationTruthContext);
vm.runInContext(sourceOf('_findStraussWohnungsStockDrift'), locationTruthContext);
vm.runInContext(sourceOf('_findOfficeArrivalGeographyDrift'), locationTruthContext);

const exactApartmentFailure = locationTruthContext._findStraussWohnungsStockDrift({
  ort: 'Strauss-Wohnung Wedding',
  szene: 'In der Wohnung im zweiten Stock ist es still. Die Tür steht einen Spalt weit offen.',
});
assert(exactApartmentFailure && exactApartmentFailure.code === 'strauss_apartment_floor_drift',
  'the exact live second-floor contradiction must be rejected');
assert.strictEqual(locationTruthContext._findStraussWohnungsStockDrift({
  ort: 'Strauss-Wohnung Wedding',
  szene: 'Im vierten Stock öffnest du die versiegelte Wohnungstür.',
}), null, 'the canonical fourth floor must remain valid');

locationTruthContext.engineCurrentLocation = { name: 'Karl Mauers Büro' };
const exactOfficeFailure = locationTruthContext._findOfficeArrivalGeographyDrift({
  ort: 'Karl Mauers Büro',
  szene: 'Du stellst den Wagen am Marx-Engels-Platz ab und gehst die wenigen Schritte zum Hauseingang.',
}, { id: 'REISE', _istReise: true });
assert(exactOfficeFailure && exactOfficeFailure.code === 'office_arrival_geography_drift',
  'the exact live false Marx-Engels-Platz walking distance must be rejected');
assert.strictEqual(locationTruthContext._findOfficeArrivalGeographyDrift({
  ort: 'Karl Mauers Büro',
  szene: 'Du parkst am Hackeschen Markt nahe dem Hinterhaus und steigst in den zweiten Stock.',
}, { id: 'REISE', _istReise: true }), null,
  'the canonical office arrival must remain valid');

assert(sourceOf('validateSceneWorldTruth').includes('_findStraussWohnungsStockDrift')
  && sourceOf('validateSceneWorldTruth').includes('_findOfficeArrivalGeographyDrift'),
  'both live location contradictions must run through world-truth validation');
assert(html.includes("problem.code === 'strauss_apartment_floor_drift'")
  && html.includes("problem.code === 'office_arrival_geography_drift'"),
  'both location guards need retry and deterministic fallback handling');

const visualStates = {};
const visualContext = {
  caseProgress: { activeConfrontation: null },
  engineCurrentLocation: { name: 'Strauss-Geschaeft' },
  sceneCounter: 23,
  normForMatch,
  getNpcsAtCurrentLocation() {
    return [
      { id: 'paul_krummbein', name: 'Paul Krummbein' },
      { id: 'hund_rex', name: 'Rex' },
    ];
  },
  _npcZustandGet(name) {
    return visualStates[normForMatch(name).replace(/_/g, ' ')] || null;
  },
  _npcZustandIstEntfernt(name) {
    const state = this._npcZustandGet ? this._npcZustandGet(name) : null;
    return !!(state && /^(uebergeben|geflohen)$/.test(state.status));
  },
};
vm.createContext(visualContext);
vm.runInContext(sourceOf('_szenenbildAnwesenheitsVariante'), visualContext);

const shopSpec = {
  file: 'strauss-geschaeft.webp',
  depictsNpcs: [],
  presenceVariants: [
    {
      requiresAllNpcs: ['Paul Krummbein', 'Rex'],
      file: 'strauss-geschaeft-krummbein-rex-night-v1692.png',
      depictsNpcs: ['paul_krummbein', 'hund_rex'],
    },
    {
      npc: 'Paul Krummbein',
      id: 'paul_krummbein',
      file: 'strauss-geschaeft-krummbein-night.webp',
      depictsNpcs: ['paul_krummbein'],
    },
    {
      npc: 'Rex',
      id: 'hund_rex',
      excludesNpcs: ['Paul Krummbein'],
      file: 'strauss-geschaeft-rex-night-v1692.png',
      depictsNpcs: ['hund_rex'],
    },
  ],
};

visualStates['paul krummbein'] = { status: 'gefesselt' };
let selected = visualContext._szenenbildAnwesenheitsVariante(shopSpec, {
  personenImRaum: [
    { id: 'paul_krummbein', name: 'Paul Krummbein' },
    { id: 'hund_rex', name: 'Rex' },
  ],
  szene: 'Rex hält Krummbein in Schach, während die Handschellen einrasten.',
});
assert.strictEqual(selected.file, 'strauss-geschaeft-krummbein-rex-night-v1692.png',
  'a restrained opponent must remain visible together with Rex');

visualStates['paul krummbein'] = { status: 'uebergeben' };
visualContext.getNpcsAtCurrentLocation = () => [{ id: 'hund_rex', name: 'Rex' }];
selected = visualContext._szenenbildAnwesenheitsVariante(shopSpec, {
  personenImRaum: [{ id: 'hund_rex', name: 'Rex' }],
  szene: 'Krummbein ist abgeführt. Rex liegt neben Karl im Laden.',
});
assert.strictEqual(selected.file, 'strauss-geschaeft-rex-night-v1692.png',
  'after the handoff the image must show Rex without rematerializing Krummbein');

for (const file of [
  'strauss-geschaeft-krummbein-rex-day-v1692.png',
  'strauss-geschaeft-krummbein-rex-night-v1692.png',
  'strauss-geschaeft-rex-day-v1692.png',
  'strauss-geschaeft-rex-night-v1692.png',
]) {
  const asset = path.join(__dirname, '..', 'assets', 'scenes', 'strauss', file);
  assert(fs.existsSync(asset) && fs.statSync(asset).size > 1000000,
    'Strauss Rex scene asset is missing or suspiciously small: ' + file);
  assert(html.includes(file), 'Strauss Rex scene asset is not wired into the image matrix: ' + file);
}

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1702 +LindenbaumHoRosterIdentity'"),
  'release version missing');

console.log('strauss-live-visual-truth: ok');
