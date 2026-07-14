const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const introStart = html.indexOf('const INTRO_VARIANTS = [');
const introEnd = html.indexOf('\n];', introStart);
assert(introStart >= 0 && introEnd > introStart, 'INTRO_VARIANTS block missing');
const introContext = { INTRO_REQUIREMENTS: '' };
vm.createContext(introContext);
vm.runInContext(html.slice(introStart, introEnd + 3).replace('const INTRO_VARIANTS =', 'INTRO_VARIANTS ='), introContext);

const wegener = Array.from(introContext.INTRO_VARIANTS).find((entry) => entry && entry.setup && /Konstantin Wegener/.test(entry.setup.tat || ''));
assert(wegener, 'Wegener setup missing');
const hof = Array.from(wegener.setup.locations).find((location) => location && /Hinterhof Spreestrasse/.test(location.name || ''));
assert(hof, 'Hinterhof Spreestrasse missing');
const clue = Array.from(hof.indizien || []).find((entry) => entry && entry.id === 'lothar_schluessel');
assert(clue, 'Lothar progression clue missing');
assert(Array.from(clue.actions).includes('BEFRAGEN'), 'direct questioning must be accepted by Lothar clue gate');
assert(Array.from(clue.requiresEvidenceAny || []).includes('lagerhalle_hinweis'), 'Lothar must react to the already secured courtyard lead');

const personStart = html.indexOf('function _hauptuiPersonVerben(');
const personEnd = html.indexOf('function _hauptuiItemVerben(', personStart);
assert(personStart >= 0 && personEnd > personStart, '_hauptuiPersonVerben block missing');
const personContext = {
  _hauptuiPersonIstFeind: () => true,
  _hauptuiNpcBezwungen: () => false,
  _hauptuiRomanceAktion: () => null,
  _hauptuiHeilerAktion: () => null,
  _hauptuiVerhoerNpc: () => null,
  _hauptuiInformantMitOffenemHinweis: () => false,
  _resolveNpcIdentity: () => ({ id: 'lothar_schaefer', name: 'Lothar Schaefer', tag: 'GANGSTER' }),
  _npcHatOffenenHinweis: () => true
};
vm.createContext(personContext);
vm.runInContext(html.slice(personStart, personEnd), personContext);
const verbs = Array.from(personContext._hauptuiPersonVerben({ id: 'lothar_schaefer', name: 'Lothar Schaefer', tag: 'GANGSTER', typ: 'person' }));
assert.deepStrictEqual(verbs.map((verb) => verb.key), ['reden', 'bedrohen', 'angreifen'], 'Lothar must expose one direct talk route plus pressure and attack');
assert.strictEqual(verbs[0].label, 'Stelle zur Rede', 'hostile questioning must be explicit instead of opening a second talk menu');

const executeStart = html.indexOf('function _hauptuiExecute(');
const executeEnd = html.indexOf('\nfunction _hauptui', executeStart + 30);
const executeBody = html.slice(executeStart, executeEnd);
assert(executeBody.includes("key: 'befragen'"), 'hostile Haupt-UI talk must execute a real BEFRAGEN action');
assert(executeBody.includes("_hauptuiKonfrontationAktion('angreifen', enemy, null, [])"), 'hostile attack must enter the current tactical confrontation path');

const fxStart = html.indexOf('function fxConflict(');
const fxEnd = html.indexOf('\nfunction _anhaengerLadung', fxStart);
const fxBody = html.slice(fxStart, fxEnd);
assert(fxBody.includes('window.HAUPTUI_AKTIV) return;'), 'old emoji collision card must be suppressed in the Haupt-UI');
assert(html.includes("aktion: t.push || t.aktion || ('Stelle ' + npc.name + ' gezielt zur Rede.')"), 'legacy fallback must never build a visible empty opponent action');

console.log('LOTHAR_INTERROGATION_OK');
