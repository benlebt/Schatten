const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(html.includes('Nur Ruf auf 0 setzen'), 'the reputation-only reset must be labelled explicitly');
assert(html.includes('Karriere zurücksetzen &amp; Fall neu starten'), 'the destructive test restart must be labelled explicitly');
assert(!html.includes('>Fall frisch testen</button>'), 'the ambiguous old test label must stay removed');

const rufStart = html.indexOf('function resetDebugRufFromSettings(event)');
const rufEnd = html.indexOf('function _currentSetupIndexForRestart()', rufStart);
const rufBody = html.slice(rufStart, rufEnd);
assert(rufBody.includes('r.renommee = 0'), 'reputation reset must clear Renommee');
assert(rufBody.includes('r.haerte = 0'), 'reputation reset must clear Haerte');
assert(!rufBody.includes('_karlAkteNeueKarriere()'), 'reputation reset must not wipe the career');

const freshStart = html.indexOf('function freshCaseTestFromSettings(event)');
const freshEnd = html.indexOf('// v7.12.1091', freshStart);
const freshBody = html.slice(freshStart, freshEnd);
assert(freshBody.includes('_karlAkteNeueKarriere()'), 'test restart must reset the complete career');
assert(freshBody.includes('clearSavedGame()'), 'test restart must clear the current run');
assert(freshBody.includes('startGame()'), 'test restart must immediately restart the selected case');

console.log('SETTINGS_DEBUG_CONTROLS_OK');
