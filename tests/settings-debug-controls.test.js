const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(html.includes('Nur Ruf auf 0 setzen'), 'the reputation-only reset must be labelled explicitly');
assert(html.includes('Fall mit diesem Ruf neu starten'), 'the same-case reputation comparison restart must be labelled explicitly');
assert(html.includes('Karriere zurücksetzen &amp; Fall neu starten'), 'the destructive test restart must be labelled explicitly');
assert(!html.includes('>Fall frisch testen</button>'), 'the ambiguous old test label must stay removed');

const rufStart = html.indexOf('function resetDebugRufFromSettings(event)');
const rufEnd = html.indexOf('function _currentSetupIndexForRestart()', rufStart);
const rufBody = html.slice(rufStart, rufEnd);
assert(rufBody.includes('r.renommee = 0'), 'reputation reset must clear Renommee');
assert(rufBody.includes('r.haerte = 0'), 'reputation reset must clear Haerte');
assert(!rufBody.includes('_karlAkteNeueKarriere()'), 'reputation reset must not wipe the career');

const compareStart = html.indexOf('function restartCaseWithDebugRufFromSettings(event)');
const compareEnd = html.indexOf('function _currentSetupIndexForRestart()', compareStart);
const compareBody = html.slice(compareStart, compareEnd);
assert(compareStart >= 0, 'same-case reputation comparison restart must exist');
assert(compareBody.includes('clearSavedGame()'), 'reputation comparison must clear the current run');
assert(compareBody.includes('startGame()'), 'reputation comparison must restart the selected case');
assert(compareBody.includes('_debugRufVergleichsNeustart = true'), 'reputation comparison must suppress exactly one duplicate rent booking');
assert(!compareBody.includes('_karlAkteNeueKarriere()'), 'reputation comparison must preserve the career and reputation');

const freshStart = html.indexOf('function freshCaseTestFromSettings(event)');
const freshEnd = html.indexOf('// v7.12.1091', freshStart);
const freshBody = html.slice(freshStart, freshEnd);
assert(freshBody.includes('_karlAkteNeueKarriere()'), 'test restart must reset the complete career');
assert(freshBody.includes('clearSavedGame()'), 'test restart must clear the current run');
assert(freshBody.includes('startGame()'), 'test restart must immediately restart the selected case');

const gameStart = html.indexOf('async function startGame()');
const rentStart = html.indexOf('const _rufVergleichsNeustart = !!window._debugRufVergleichsNeustart;', gameStart);
const rentEnd = html.indexOf('// v7.12.1287', rentStart);
const rentBody = html.slice(rentStart, rentEnd);
assert(rentStart >= 0, 'startGame must consume the reputation comparison restart flag');
assert(rentBody.includes('window._debugRufVergleichsNeustart = false'), 'the rent bypass must be one-shot');
assert(rentBody.includes("&& !_rufVergleichsNeustart"), 'only reputation comparison restarts may skip duplicate rent');

console.log('SETTINGS_DEBUG_CONTROLS_OK');
