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

const goerkeStart = html.indexOf("klient: 'Albrecht Goerke");
const goerkeEnd = html.indexOf('// 13. Schwester Hilde', goerkeStart);
assert(goerkeStart >= 0 && goerkeEnd > goerkeStart, 'Goerke setup slice missing');
const goerke = html.slice(goerkeStart, goerkeEnd);

assert(goerke.includes("{ id: 'reinhard_baumgarten', zeit: ['morgen','vormittag','mittag','nachmittag'] }"),
  'Baumgarten must be present in the morning opening');
assert(goerke.includes("{ id: 'hauptmann_krollwitz', immer: true, abStage: 3 }"),
  'Krollwitz must not appear before the political pressure phase');
assert(goerke.includes('Albrechts Verteidiger und dein langjähriger juristischer Kontakt'),
  'opening prompt must state Baumgarten case role unambiguously');
assert(!goerke.includes('dein langjähriger Anwalt-Partner'),
  'opening prompt must not frame Baumgarten primarily as Karl\'s lawyer');
assert(goerke.includes("requiresEvidenceAny: ['alibi_schichtbuch']"),
  'Albrecht exoneration must require the configured alibi evidence');

const diagnostics = [];
const context = {
  caseSetup: {
    truthBeats: [{
      id: 'albrecht_entlastet',
      label: 'Albrecht durch die Beweiskette entlastet',
      entlastung: true,
      requiresEvidenceAny: ['alibi_schichtbuch'],
      keywords: /\balbrecht\w*[\s\S]{0,60}(unschuldig|entlastet|alibi)/i,
    }],
  },
  caseProgress: { truthBeatsHit: [], gefundeneIndizIds: [] },
  sceneCounter: 1,
  diag: (type, message) => diagnostics.push(type + ':' + message),
  console: { log: () => {} },
};
vm.createContext(context);
vm.runInContext(sourceOf('_truthBeatHatExplizitesGestaendnis') + '\n' + sourceOf('updateTruthBeats'), context);

context.updateTruthBeats('Albrecht behauptet aus der U-Haft, er sei unschuldig.');
assert.deepStrictEqual(Array.from(context.caseProgress.truthBeatsHit), [],
  'a suspect claim must not become proven exoneration');
assert(diagnostics.some(line => line.includes('braucht mindestens einen gefundenen Sachbeleg')),
  'blocked evidence-gated beat needs a diagnostic');

context.caseProgress.gefundeneIndizIds.push('alibi_schichtbuch');
context.updateTruthBeats('Das Schichtbuch belegt Albrechts Alibi und entlastet ihn.');
assert.deepStrictEqual(Array.from(context.caseProgress.truthBeatsHit), ['albrecht_entlastet'],
  'the found alibi evidence must unlock the exoneration beat');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1525 +GoerkeOpeningTruth-Staging'"),
  'release version missing');

console.log('Goerke opening/truth regression checks passed.');
