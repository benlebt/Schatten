const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const introStart = html.indexOf('const INTRO_VARIANTS = [');
const introEnd = html.indexOf('\n];', introStart);
assert(introStart >= 0 && introEnd > introStart, 'INTRO_VARIANTS block missing');
const introSource = html.slice(introStart, introEnd + 3)
  .replace('const INTRO_VARIANTS =', 'INTRO_VARIANTS =');
const introContext = { INTRO_REQUIREMENTS: '' };
vm.createContext(introContext);
vm.runInContext(introSource, introContext);

const wegener = Array.from(introContext.INTRO_VARIANTS).find((entry) =>
  entry && entry.setup && /Konstantin Wegener/.test(entry.setup.tat || '')
);
assert(wegener, 'Wegener setup missing');
const anker = Array.from(wegener.setup.locations).find((location) =>
  location && /Goldenen Anker/.test(location.name || '')
);
assert(anker, 'Goldener Anker location missing');
const schieleClue = Array.from(anker.indizien || []).find((clue) => clue && clue.id === 'schiele_streit');
assert(schieleClue, 'Schiele clue missing');
assert.deepStrictEqual(Array.from(schieleClue.actions), ['BESTECHEN', 'BEDROHEN'], 'Schiele clue must use the two accepted informant actions');
assert(/15 Ostmark/.test(wegener.prompt), 'Wegener prompt must state the real Schiele price');
assert(!/50 D-Mark/.test(JSON.stringify(wegener)), 'stale Schiele price remains in Wegener setup');

const personStart = html.indexOf('function _hauptuiPersonVerben(');
const personEnd = html.indexOf('function _hauptuiItemVerben(', personStart);
assert(personStart >= 0 && personEnd > personStart, '_hauptuiPersonVerben block missing');
const personContext = {
  _hauptuiPersonIstFeind: () => false,
  _hauptuiNpcBezwungen: () => false,
  _hauptuiRomanceAktion: () => null,
  _hauptuiHeilerAktion: () => null,
  _hauptuiVerhoerNpc: () => null,
  _resolveNpcIdentity: (id) => ({ id, name: id === 'schiele' ? 'Schiele' : 'Zeuge', tag: id === 'schiele' ? 'INFORMANT' : 'WITNESS' }),
  _npcHatOffenenHinweis: () => true,
  _informantPreis: () => 15
};
vm.createContext(personContext);
vm.runInContext(html.slice(personStart, personEnd), personContext);

const schieleVerbs = Array.from(personContext._hauptuiPersonVerben({
  id: 'schiele', name: 'Schiele', tag: 'INFORMANT', typ: 'person', hinweis: true
}));
assert.deepStrictEqual(schieleVerbs.map((verb) => verb.key), ['bestechen', 'bedrohen'], 'open informant hint must not expose a dead talk loop');
assert(/15 Ostmark/.test(schieleVerbs[0].label), 'informant payment action must show the price');
assert.strictEqual(schieleVerbs.some((verb) => verb.key === 'reden'), false, 'talk must be hidden while paid informant clue is open');

const witnessVerbs = Array.from(personContext._hauptuiPersonVerben({
  id: 'zeuge', name: 'Zeuge', tag: 'WITNESS', typ: 'person', hinweis: true
}));
assert.strictEqual(witnessVerbs[0].key, 'reden', 'normal witnesses must keep the talk action');

personContext._hauptuiVerhoerNpc = () => ({ id: 'norbert_tetzlaff' });
const dossierInformantVerbs = Array.from(personContext._hauptuiPersonVerben({
  id: 'norbert_tetzlaff', name: 'Norbert Tetzlaff', tag: 'INFORMANT', typ: 'person', hinweis: true
}));
assert.strictEqual(dossierInformantVerbs[0].key, 'reden', 'informants with a real interrogation dossier must keep the talk entry');

assert(html.includes("if (verb === 'bestechen' && typeof npcInteraktion === 'function')"), 'Haupt-UI execute path for informant payment missing');
assert(html.includes("if (tag === 'INFORMANT')"), 'legacy NPC menu informant branch missing');
assert(html.includes("keys = (_informantHatHinweis && !_informantHatVerhoer) ? ['bestechen','bedrohen'] : ['befragen'];"), 'legacy informant actions do not match clue gate');
assert(html.includes("BEDROHEN: 'Unter Druck setzen'"), 'hint action label for pressure missing');

console.log('INFORMANT_PROGRESS_OK');
