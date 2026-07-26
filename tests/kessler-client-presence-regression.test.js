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

const normForMatch = value => String(value || '')
  .toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

const context = {
  normForMatch,
  engineCurrentLocation: { name: 'Karl Mauers Büro' },
  getCaseLocations: () => [{
    name: 'Karl Mauers Büro',
    npcs: [{ id: 'theodor_krause', wegWennKlientGesprochen: true }]
  }],
  _resolveNpcIdentity: id => id === 'theodor_krause'
    ? { id, name: 'Theodor Krause' }
    : { id, name: id },
  _worldTruthAliases: (id, entry) => [normForMatch(id), normForMatch(entry && entry.name)].filter(Boolean),
  _worldTruthHasAlias: (value, aliases) => aliases.includes(normForMatch(value))
};
vm.createContext(context);
vm.runInContext(sourceOf('_clientSollNachErstgespraechGehen'), context);

assert.strictEqual(context._clientSollNachErstgespraechGehen({
  id: 'theodor_krause',
  name: 'Theodor Krause'
}), true, 'Krause must leave after his explicitly bound office handoff');

context.engineCurrentLocation = { name: 'Kessler-Wohnung Charlottenburg' };
context.getCaseLocations = () => [{
  name: 'Kessler-Wohnung Charlottenburg',
  npcs: [{ id: 'edith_kessler', immer: true }]
}];
assert.strictEqual(context._clientSollNachErstgespraechGehen({
  id: 'edith_kessler',
  name: 'Edith Kessler'
}), false, 'Edith must not leave her own apartment after an ordinary clue conversation');

const proseContext = {
  caseProgress: { pendingHauptuiIndiz: { id: 'robert_eintritt_beobachtet' } },
  diag: () => {}
};
vm.createContext(proseContext);
vm.runInContext(sourceOf('_indizAbschlussProsaSichern'), proseContext);

const entryEvidence = {
  id: 'robert_eintritt_beobachtet',
  fundText: 'Du wartest. Robert Kessler verschwindet im Hinterhaus; die Haustür fällt hinter ihm zu.',
  prosaPflicht: {
    narrativ: /verschwindet[^.!?]{0,40}hinterhaus/i,
    fallbackProse: 'Du wartest. Robert Kessler verschwindet im Hinterhaus; die Haustür fällt hinter ihm zu.'
  }
};
const incompleteScene = {
  szene: 'Robert Kessler biegt in den Hinterhof ein und bleibt vor dir stehen.'
};
assert.strictEqual(proseContext._indizAbschlussProsaSichern(entryEvidence, incompleteScene), true,
  'the structured observation must repair prose that leaves Robert physically in the courtyard');
assert.strictEqual(incompleteScene.szene, entryEvidence.fundText,
  'the repaired observation must end with Roberts visible departure into the building');

assert(html.includes("id: 'robert_eintritt_beobachtet'")
  && html.includes('prosaPflicht: { narrativ:')
  && html.includes('die Haustür fällt hinter ihm zu.'),
  'the Kessler entry clue must carry a hard visible-departure prose contract');

const openingContext = {
  normForMatch,
  engineCurrentLocation: { name: 'Hinterhof Sybelstrasse' }
};
vm.createContext(openingContext);
vm.runInContext(sourceOf('validateOpeningRoleTruth'), openingContext);
const kesslerSetup = {
  caseType: 'beschatten',
  klient: 'Edith Kessler',
  opfer: 'Robert Kessler',
  ortHaupt: 'Hinterhof Sybelstrasse',
  setupCast: [{ id: 'robert_kessler', name: 'Robert Kessler', tag: 'TARGET' }]
};
const badWindowOpening = [
  'Du wartest im Hinterhof auf Robert Kessler.',
  'Frau Pohl lehnt im zweiten Stock am Fenster.',
  'Frau Hauke öffnet im Erdgeschoss die Tür zu ihrem Atelier.'
].join(' ');
const openingDrift = openingContext.validateOpeningRoleTruth(badWindowOpening, kesslerSetup, {
  ort: 'Hinterhof Sybelstrasse',
  personenImRaum: ['Frau Pohl', 'Frau Hauke']
});
assert.strictEqual(openingDrift.code, 'opening_kessler_window_drift',
  'the opening guard must reject prose that swaps Pohl and Hauke against the fixed courtyard image');

const correctWindowOpening = [
  'Du wartest im Hinterhof auf Robert Kessler.',
  'Frau Pohl beobachtet den Hof aus dem linken Erdgeschossfenster.',
  'Frau Hauke steht am oberen rechten Hoffenster.'
].join(' ');
assert.strictEqual(openingContext.validateOpeningRoleTruth(correctWindowOpening, kesslerSetup, {
  ort: 'Hinterhof Sybelstrasse',
  personenImRaum: ['Frau Pohl', 'Frau Hauke']
}).ok, true, 'the canonical Pohl/Hauke window positions must remain legal');

console.log('KESSLER_CLIENT_PRESENCE_REGRESSION_OK');
