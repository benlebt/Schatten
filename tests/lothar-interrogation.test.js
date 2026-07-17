const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sourceOf(name) {
  const start = html.indexOf('function ' + name + '(');
  assert(start >= 0, 'missing function ' + name);
  let depth = 0;
  let opened = false;
  for (let i = start; i < html.length; i += 1) {
    if (html[i] === '{') { depth += 1; opened = true; }
    else if (html[i] === '}') {
      depth -= 1;
      if (opened && depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('unterminated function ' + name);
}

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
assert(!Array.from(clue.actions).includes('BEFRAGEN'), 'ordinary questioning must not make the kidnapper reveal his hideout');
assert.deepStrictEqual(Array.from(clue.actions), ['BEDROHEN'], 'Lothar clue must require visible pressure');
assert.strictEqual(clue.requiresPressure, true, 'pressure-only clues must opt out of generic talk equivalence');
assert(Array.from(clue.requiresEvidenceAny || []).includes('lagerhalle_hinweis'), 'Lothar must react to the already secured courtyard lead');

const personStart = html.indexOf('function _hauptuiPersonVerben(');
const personEnd = html.indexOf('function _hauptuiItemVerben(', personStart);
assert(personStart >= 0 && personEnd > personStart, '_hauptuiPersonVerben block missing');
const personContext = {
  _hauptuiPersonIstFeind: () => true,
  _hauptuiNpcBezwungen: () => false,
  _hauptuiRomanceAktion: () => null,
  _hauptuiHeilerAktion: () => null,
  _hauptuiZielpersonTransportAktion: () => null,
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
assert(executeBody.includes('TAETER-WIDERSTAND (PFLICHT)'), 'ordinary hostile talk must protect self-incriminating knowledge');
assert(executeBody.includes('_hauptuiHinweisBrauchtDruck(target)'), 'hostile talk must inspect the live clue gate');
assert(executeBody.includes("_hauptuiKonfrontationAktion('angreifen', enemy, null, [])"), 'hostile attack must enter the current tactical confrontation path');

assert(html.includes('if (!ind.requiresPressure && ind.actions.some'), 'pressure-only clues must not be widened to generic conversation actions');
assert(html.includes('scene.szene = fixSprache(expandAbbreviations(scene.szene));'), 'generated prose must remove lexical parenthetical abbreviations after expansion');
assert(!html.includes("a.full + ' (' + a.abbr + ')'"), 'post-processing must never create glossary parentheses in noir prose');

const fxStart = html.indexOf('function fxConflict(');
const fxEnd = html.indexOf('\nfunction _anhaengerLadung', fxStart);
const fxBody = html.slice(fxStart, fxEnd);
assert(!fxBody.includes("box.className = 'fx-conflict'"), 'old emoji collision card must be removed for every UI path');
assert(!fxBody.includes('_npcVisual('), 'conflict feedback must not render emoji character tokens');
const arenaFxBody = sourceOf('_arenaFxAngriff');
assert(arenaFxBody.includes('Noir statt Arcade'), 'legacy arena effects need an explicit permanent suppression');
assert(arenaFxBody.indexOf('return;') < arenaFxBody.indexOf('document.getElementById'), 'arena emoji flight must be unreachable');
const planBody = sourceOf('_planAusfuehren');
assert(!planBody.includes('fxBattle(plan'), 'fetter and coordinated actions must not open the legacy emoji battle card');
assert(planBody.includes('KARLS RUF'), 'conflict prose must receive Karl reputation as narrative context');
assert(html.includes("aktion: t.push || t.aktion || ('Stelle ' + npc.name + ' gezielt zur Rede.')"), 'legacy fallback must never build a visible empty opponent action');

console.log('LOTHAR_INTERROGATION_OK');
