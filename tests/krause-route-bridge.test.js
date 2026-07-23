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
    if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error('unterminated function ' + name);
}

const normForMatch = value => String(value || '').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/ß/g, 'ss').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

const routeProse = 'Für den Weg der Beute fällt dir dein langjähriger Händlerkontakt Karl-Heinz Bornstein in der Bergmannstraße ein.';
const locations = [{
  name: 'Krauses Antiquitäten',
  indizien: [
    { id: 'etui_letzter_ort' },
    { id: 'nachbarin_aussage' },
    { id: 'einbruch_fenster' }
  ]
}, {
  name: 'Bornsteins Antiquitätenladen',
  indizien: [{
    id: 'bornstein_hehler_tipp',
    npc: 'bornstein',
    routeMentions: ['bornstein', 'bergmannstrasse'],
    routeProse
  }]
}];

const context = {
  caseProgress: {
    gefundeneIndizIds: ['etui_letzter_ort', 'nachbarin_aussage']
  },
  engineCurrentLocation: { name: 'Krauses Antiquitäten' },
  normForMatch,
  getCaseLocations: () => locations,
  _indizNpcIdsAmOrtJetzt: () => [],
  _indizAmOrtJetztErreichbar: (loc, ind) =>
    context.caseProgress.gefundeneIndizIds.indexOf(ind.id) === -1,
  _resolveNpcIdentity: () => ({ id: 'bornstein', name: 'Karl-Heinz Bornstein' })
};
vm.createContext(context);
vm.runInContext(sourceOf('_findUndramatizedEvidenceExit'), context);

let problem = context._findUndramatizedEvidenceExit({
  ort: 'Krauses Antiquitäten',
  szene: 'Die Kerben im Fenster zeigen ein grobes Stemmeisen. Mehr verrät das Holz nicht.'
}, { _pendingIndizId: 'einbruch_fenster' });
assert(problem && problem.code === 'evidence_exit_undramatized',
  'the final local clue must reject an unexplained route highlight');
assert.strictEqual(problem.nextOrt, 'Bornsteins Antiquitätenladen',
  'the repair must name the actual newly reachable destination');
assert.strictEqual(problem.routeProse, routeProse,
  'the route rationale must come from case data, not a generic invention');

problem = context._findUndramatizedEvidenceExit({
  ort: 'Krauses Antiquitäten',
  szene: 'Die Kerben zeigen ein grobes Stemmeisen. Für den Weg der Beute fällt dir Bornstein in der Bergmannstraße ein.'
}, { _pendingIndizId: 'einbruch_fenster' });
assert.strictEqual(problem, null,
  'a naturally dramatized Bornstein bridge must pass');

context.caseProgress.gefundeneIndizIds = ['etui_letzter_ort'];
problem = context._findUndramatizedEvidenceExit({
  ort: 'Krauses Antiquitäten',
  szene: 'Du sicherst die Fensterspur.'
}, { _pendingIndizId: 'einbruch_fenster' });
assert.strictEqual(problem, null,
  'the gate must not force a departure while a local clue remains');

assert(sourceOf('validateSceneWorldTruth').includes('_findUndramatizedEvidenceExit'),
  'the route bridge must be part of the pre-commit world-truth gate');
assert(sourceOf('buildWorldTruthRepairHint').includes('DRAMATISIERTER SPURWECHSEL'),
  'a failed route bridge must get a precise model repair prompt');
assert(sourceOf('enforceSceneWorldTruthFallback').includes("problem.code === 'evidence_exit_undramatized'"),
  'repeated model failure must retain a deterministic route bridge fallback');
assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1434 +PeaceWeaponSilence-Staging'"),
  'release version missing');

console.log('krause-route-bridge.test.js: OK');
