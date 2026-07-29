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
  currentScene: null,
  normForMatch: (value) => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss'),
  sameNamedPerson: (a, b) => {
    const last = (value) => String(value || '').toLowerCase().trim().split(/\s+/).pop();
    return !!last(a) && last(a) === last(b);
  },
  getAnchorNpc: (value) => /(?:gregor[ _]+halbe|hausmeister gregor halbe)/i.test(String(value || ''))
    ? { canonicalName: 'Hausmeister Gregor Halbe' }
    : null,
};
vm.createContext(context);
vm.runInContext(sourceOf('_freierAnchorNpcInSichtbarerSzene'), context);

context.currentScene = {
  szene: 'Du ziehst die alte Strauss-Akte aus dem Schrank. Paul Krummbeins Druck ist darin vermerkt.',
  personenImRaum: ['Gregor Halbe'],
};
assert.strictEqual(context._freierAnchorNpcInSichtbarerSzene('gregor_halbe', 'Hausmeister Gregor Halbe'), false,
  'a raw roster name removed from the final visible prose must not create a phantom main-UI person');

context.currentScene = {
  szene: 'Hausmeister Gregor Halbe humpelt mit seinem Hocker in dein Büro und legt einen Brief auf den Tisch.',
  personenImRaum: ['Gregor Halbe'],
};
assert.strictEqual(context._freierAnchorNpcInSichtbarerSzene('gregor_halbe', 'Hausmeister Gregor Halbe'), true,
  'a network anchor explicitly present in both final prose and scene roster must remain interactable');

context.currentScene = {
  szene: 'Du erinnerst dich daran, dass Halbe gestern einen Brief brachte.',
  personenImRaum: [],
};
assert.strictEqual(context._freierAnchorNpcInSichtbarerSzene('gregor_halbe', 'Hausmeister Gregor Halbe'), false,
  'a prose memory without a physical scene-roster entry must not materialize the remembered anchor');

assert(html.includes('Ein globaler Netzwerk-Anker ist zunächst nur eine bekannte Person')
  && html.includes('return _anchorInParty || _anchorSichtbar;'),
  'the location gate must apply the visible-prose anchor truth while preserving actual party members');

console.log('anchor-phantom-ui: ok');
