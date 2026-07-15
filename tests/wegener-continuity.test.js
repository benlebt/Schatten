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
vm.runInContext(
  html.slice(introStart, introEnd + 3).replace('const INTRO_VARIANTS =', 'INTRO_VARIANTS ='),
  introContext
);
const wegener = Array.from(introContext.INTRO_VARIANTS).find((entry) =>
  entry && entry.setup && /Konstantin Wegener/.test(entry.setup.tat || '')
);
assert(wegener, 'Wegener setup missing');
const setupText = JSON.stringify(wegener.setup);
assert(/6\. Februar 1953/.test(setupText), 'Wegener disappearance must use a fixed calendar date');
assert(!/vor 6 Tagen/.test(setupText), 'Wegener setup must not freeze a relative six-day phrase');
const greyHat = Array.from(wegener.setup.setupCast).find((npc) => npc && npc.id === 'mann_grauer_hut');
assert(greyHat, 'grey-hat observer missing');
assert(!/Tresen/i.test((greyHat.beziehung || '') + ' ' + (greyHat.detail || '')), 'grey-hat profile must not carry bar furniture to other locations');

const normForMatch = (value) => String(value || '').toLowerCase().trim();
const continuityContext = {
  caseProgress: {
    npcMemory: {
      Schiele: [{ hinweis: 'Konstantin stritt am 6. Februar mit Lothar.' }]
    }
  },
  caseSetup: wegener.setup,
  normForMatch,
  sameNamedPerson: (a, b) => normForMatch(a) === normForMatch(b),
  _npcHatOffenenHinweis: () => true,
  _npcZustandGet: (name) => name === 'Lothar Schaefer'
    ? { status: 'ko', ort: 'Hinterhof Spreestrasse' }
    : null
};
vm.createContext(continuityContext);
vm.runInContext(sourceOf('buildNpcContinuityHint'), continuityContext);
const continuity = continuityContext.buildNpcContinuityHint([
  { id: 'schiele', name: 'Schiele', tag: 'INFORMANT' },
  { id: 'lothar_schaefer', name: 'Lothar Schaefer', tag: 'GANGSTER' }
]);
assert(continuity.includes('BEREITS ERZAEHLT'), 'remembered Schiele clue must enter the continuity prompt');
assert(continuity.includes('NIEMALS erneut als neue Enthuellung'), 'remembered clue must be barred from fresh disclosure');
assert(continuity.includes('OFFENER INFORMANTEN-HINWEIS'), 'paid clue must remain locked before the engine action');
assert(continuity.includes('Lothar Schaefer ist ko bei Hinterhof Spreestrasse'), 'Lothar physical state and location must persist');

const clientContext = {
  caseProgress: { clientGeduldErzaehltLevel: 0 },
  clientProfile: {
    name: 'Helga Wegener',
    geduldsstufe1: 3,
    geduldsstufe2: 4,
    geduldsstufe3: 5
  },
  gameDay: 3
};
vm.createContext(clientContext);
vm.runInContext(sourceOf('buildClientGeduldHint'), clientContext);
const reminder = clientContext.buildClientGeduldHint();
assert(reminder.includes('DIESER Szene'), 'due client reminder must be immediate');
assert(reminder.includes('"klient_kontakt":"mahnung"'), 'reminder must demand structured acknowledgement');
clientContext.caseProgress.clientGeduldErzaehltLevel = 1;
assert.strictEqual(clientContext.buildClientGeduldHint(), '', 'acknowledged reminder must not repeat');
clientContext.gameDay = 4;
assert(clientContext.buildClientGeduldHint().includes('"klient_kontakt":"warnung"'), 'next patience level must still fire');

assert(
  html.includes("['gefesselt', 'ko', 'fixiert', 'benommen'].indexOf(z.status) !== -1 && !_gleicherOrt"),
  'all incapacitated states must be filtered away from foreign locations'
);
assert(html.includes('"klient_kontakt": ""'), 'scene schema must expose client-contact acknowledgement');
assert(html.includes('NPC-Hinweis-Wiederholung verworfen'), 'duplicate NPC-memory entries must be rejected');

console.log('WEGENER_CONTINUITY_OK');
