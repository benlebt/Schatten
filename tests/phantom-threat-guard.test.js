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
  normForMatch: (value) => String(value || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/\s+/g, ' ').trim(),
  caseProgress: { encounterState: 'frei' },
  engineCurrentLocation: { name: 'Erich Brandts ehemalige Wohnung' }
};
vm.createContext(context);
vm.runInContext(sourceOf('_findPhantomImmediateThreat'), context);
vm.runInContext(sourceOf('_findUnrosteredPresentActor'), context);

let problem = context._findPhantomImmediateThreat({
  ort: 'Erich Brandts ehemalige Wohnung',
  szene: 'Du trittst ein. Plötzlich spürst du den scharfen, kalten Lauf eines Revolvers im Nacken und eine raue Stimme flüstert: „Beweg dich nicht, Mauer, sonst wird die Spurensuche für dich hier enden.“',
  personenImRaum: [],
  cast_hinzugefuegt: []
}, { id: 'REISE', _istReise: true });
assert(problem && problem.code === 'phantom_immediate_threat',
  'an immediate armed threat without a visible actor must be rejected');

problem = context._findPhantomImmediateThreat({
  szene: 'Im alten Polizeibericht steht, dass ihm damals ein Revolverlauf in den Nacken gedrückt wurde.',
  personenImRaum: []
}, {});
assert.strictEqual(problem, null, 'reported historical violence must remain legal');

problem = context._findPhantomImmediateThreat({
  szene: 'Kurt Lange drückt Karl den Revolverlauf gegen die Rippen.',
  personenImRaum: ['Kurt Lange']
}, {});
assert.strictEqual(problem, null, 'a visible scene actor may pose an immediate threat');

context.caseProgress.activeConfrontation = { enemyName: 'Kurt Lange' };
problem = context._findPhantomImmediateThreat({
  szene: 'Ein Revolverlauf drückt sich gegen Karls Rücken.',
  personenImRaum: []
}, {});
assert.strictEqual(problem, null, 'an engine-backed confrontation remains legal');

context.caseProgress.activeConfrontation = null;
problem = context._findUnrosteredPresentActor({
  szene: 'In der Ecke des Zimmers steht eine Frau, die dich mit geweiteten Augen anstarrt. Es ist die Vermieterin.',
  personenImRaum: [],
  cast_hinzugefuegt: []
}, { id: 'REISE', _istReise: true });
assert(problem && problem.code === 'unrostered_present_actor',
  'a prose-only landlady without roster, UI and image representation must be rejected');

problem = context._findUnrosteredPresentActor({
  szene: 'Auf dem Foto steht eine Frau vor dem Haus.',
  personenImRaum: []
}, {});
assert.strictEqual(problem, null, 'a person shown only in a photograph is not physically present');

problem = context._findUnrosteredPresentActor({
  szene: 'In der Ecke des Zimmers steht eine Frau und wartet ab.',
  personenImRaum: ['Vermieterin']
}, {});
assert.strictEqual(problem, null, 'a properly rostered scene actor remains legal');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1501 +SceneActorRoster-Staging'"),
  'release version missing');

console.log('phantom threat guard tests passed');
