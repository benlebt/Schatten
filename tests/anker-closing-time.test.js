const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sourceOf(name) {
  const functionStart = html.indexOf('function ' + name + '(');
  assert(functionStart >= 0, 'missing function ' + name);
  const brace = html.indexOf('{', functionStart);
  let depth = 0;
  for (let i = brace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}' && --depth === 0) return html.slice(functionStart, i + 1);
  }
  throw new Error('unterminated function ' + name);
}

const start = html.indexOf('function _sperrstundeNachZeitwechsel(');
const end = html.indexOf('\nfunction advanceGameTime(', start);
assert(start >= 0 && end > start, 'closing-time relocation helper missing');

const context = {
  engineCurrentLocation: { name: 'Eckkneipe Zum Goldenen Anker', sektor: 'Ost (Mitte)' },
  caseProgress: {},
  gameDay: 2,
  sceneCounter: 7,
  pendingCategoryMessages: [],
  _istAnkerOrt: (loc) => /anker/.test(String(loc && loc.name || '').toLowerCase()),
  normForMatch: (value) => String(value || '').toLowerCase().trim(),
  getCaseLocations: () => [
    {
      name: 'Eckkneipe Zum Goldenen Anker',
      sektor: 'Ost (Mitte)',
      oeffnungszeit: ['abend', 'nacht']
    },
    {
      name: 'S-Bahnhof Alexanderplatz',
      sektor: 'Ost (Mitte)'
    }
  ],
  istOrtGeoeffnet: () => false,
  _aktTageszeitName: () => 'morgen',
  diag: () => {},
  saveGameState: () => {}
};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

assert.strictEqual(context._sperrstundeNachZeitwechsel(), true, 'closed Anker must trigger closing time');
assert.strictEqual(context.engineCurrentLocation.name, 'S-Bahnhof Alexanderplatz', 'Karl must be moved to a real nearby outdoor location');
assert.strictEqual(context.caseProgress._letzteSperrstunde.von, 'Eckkneipe Zum Goldenen Anker', 'closing-time origin must be recorded');
assert.strictEqual(context.caseProgress._letzteSperrstunde.tageszeit, 'morgen', 'closing-time state must record morning');
assert(context.pendingCategoryMessages.some((message) => /ALLE hinausgeworfen/.test(message)), 'next prose must be told that every guest left');
assert(html.includes('_sperrstundeNachZeitwechsel();'), 'time advance must enforce closing time after a phase change');

const appointment = {
  engineCurrentLocation: { name: 'Kessler-Wohnung Charlottenburg', sektor: 'West (Charlottenburg)' },
  caseProgress: {},
  gameDay: 3,
  sceneCounter: 25,
  pendingCategoryMessages: [],
  _istAnkerOrt: () => false,
  normForMatch: (value) => String(value || '').toLowerCase().trim(),
  getCaseLocations: () => [
    {
      name: 'Kessler-Wohnung Charlottenburg',
      sektor: 'West (Charlottenburg)',
      oeffnungszeit: ['vormittag', 'mittag', 'nachmittag', 'abend']
    },
    { name: 'Karl Mauers BÃ¼ro', sektor: 'West (Charlottenburg)' }
  ],
  _hauptuiAlleOffenenFaeden: () => [{
    id: 'bericht',
    frage: 'Welche Wahrheit soll Edith erfahren?',
    ort: 'Kessler-Wohnung Charlottenburg',
    status: 'bereit'
  }],
  _aktTageszeitName: () => 'morgen',
  diag: () => {},
  saveGameState: () => {}
};
vm.createContext(appointment);
vm.runInContext([
  sourceOf('_abschlussTerminAmOrt'),
  sourceOf('istOrtGeoeffnet'),
  sourceOf('_sperrstundeNachZeitwechsel'),
].join('\n'), appointment);
const kesslerWohnung = appointment.getCaseLocations()[0];
assert.strictEqual(appointment._abschlussTerminAmOrt(kesslerWohnung), true,
  'a ready Kessler report must count as a real appointment at Ediths apartment');
assert.strictEqual(appointment.istOrtGeoeffnet(kesslerWohnung), true,
  'a ready appointment must keep the apartment reachable across night-to-morning');
assert.strictEqual(appointment._sperrstundeNachZeitwechsel(), false,
  'closing-time relocation must not eject Karl from a ready client appointment');
assert.strictEqual(appointment.engineCurrentLocation.name, 'Kessler-Wohnung Charlottenburg',
  'Karl must remain at the apartment selected through the map');
assert.strictEqual(appointment.pendingCategoryMessages.length, 0,
  'a valid appointment must not emit a false closing-time prompt');

assert(html.includes('Der Engine-Ort bleibt EXAKT'),
  'final report prompts must explicitly preserve the canonical engine location');
assert(!html.includes("let aufloesenForm = 'persÃ¶nlich, per Telefon, per Telegramm oder per Bote"),
  'final report prompts must no longer leave location-changing delivery choices to the model');
assert(/let _klientPraesent = false;[\s\S]{0,900}?getNpcsAtCurrentLocation\(\)[\s\S]{0,350}?_istKlient\(npc\.name, npc\.id\)/.test(html),
  'the resolve button must recognize a client waiting at the canonical current location even when the previous scene cast is stale');

console.log('ANKER_CLOSING_TIME_OK');
