const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

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
  normForMatch: value => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim(),
};
vm.createContext(context);
vm.runInContext(sourceOf('mapFindeOrtEintrag'), context);

const spedition = { loc: { name: 'Spedition Schmidt, Moabit' } };
const cafe = { loc: { name: 'Café Wien' } };
const entries = [spedition, cafe];
assert.strictEqual(context.mapFindeOrtEintrag(entries, 'Spedition Schmidt Moabit'), spedition,
  'thread destinations must tolerate punctuation differences when preselecting a map location');
assert.strictEqual(context.mapFindeOrtEintrag(entries, 'Cafe Wien'), cafe,
  'thread destinations must tolerate diacritic differences when preselecting a map location');
assert.strictEqual(context.mapFindeOrtEintrag(entries, 'Unbekannter Ort'), null,
  'an unknown thread destination must leave the ordinary map open without selecting a wrong place');

const travelSource = sourceOf('oeffneReiseMenue');
assert(travelSource.startsWith('function oeffneReiseMenue(vorauswahlOrtName)'),
  'the travel map must accept an optional preselected destination');
assert(travelSource.includes('mapFindeOrtEintrag(orte, vorauswahlOrtName)'),
  'the travel map must resolve the thread destination against its live visible entries');
assert(travelSource.includes('mapZeigeOrtPopup(vorauswahl'),
  'a resolved thread destination must open the same detail popup as a direct map tap');

const menuSource = sourceOf('_renderEngineMenu');
assert(menuSource.includes('oeffneReiseMenue(faden.ort)'),
  'a remote open-thread click must pass its location into the travel map');
assert(menuSource.includes('if (istHier && ziel)'),
  'a local open-thread click must continue focusing the concrete person or clue instead of opening the map');
assert(html.includes('Reisekarte direkt beim passenden Zielort'),
  'the current help text must describe destination preselection');

console.log('OPEN_THREAD_MAP_PRESELECTION_OK');
