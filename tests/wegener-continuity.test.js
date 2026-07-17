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
assert.strictEqual(greyHat, undefined, 'Wegener must not contain a wandering anonymous grey-hat observer');
assert.strictEqual(wegener.setup.targetResolution.rescueRequired, true, 'Wegener must require an explicit physical rescue');
assert.strictEqual(wegener.setup.targetResolution.deliveryRequired, true, 'Wegener must require a safe handoff after rescue');
assert.deepStrictEqual(
  Array.from(wegener.setup.targetResolution.safeLocations),
  ['Wegener-Wohnung', 'Volkspolizei-Revier Hans-Beimler-Strasse'],
  'Wegener must expose both requested handoff routes'
);
assert.strictEqual(wegener.setup.targetResolution.guard, 'lothars_bewacher', 'Wegener rescue must name its blocking guard');
const guard = Array.from(wegener.setup.setupCast).find((npc) => npc && npc.id === 'lothars_bewacher');
assert(guard && guard.name === 'Erwin Kratz', 'warehouse guard needs one clear, persistent identity');
const warehouse = Array.from(wegener.setup.locations).find((loc) => loc && loc.name === 'Lagerhalle an der Spree');
assert(warehouse, 'Wegener warehouse finale missing');
assert(Array.from(warehouse.npcs || []).some((npc) => npc && npc.id === 'lothars_bewacher'), 'warehouse guard NPC missing');
const guardThreat = Array.from(warehouse.bedrohungen || []).find((threat) => threat && threat.id === 'lothars_bewacher');
assert(guardThreat && guardThreat.chance === 100 && guardThreat.unausweichlich === true, 'warehouse guard confrontation must be guaranteed');

const normForMatch = (value) => String(value || '').toLowerCase().trim();
const continuityContext = {
  caseProgress: {
    npcMemory: {
      Schiele: [{ hinweis: 'Konstantin stritt am 6. Februar mit Lothar.' }],
      'Helga Wegener': [{ hinweis: 'Helga wartet in ihrer Wohnung auf Nachricht.' }]
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
assert(continuity.includes('Ein "Mann mit grauem Hut" existiert in diesem Fall NICHT'), 'continuity prompt must bar the removed duplicate observer');
assert(continuity.includes('einzige bewaffnete Bewacher in der Lagerhalle ist Erwin Kratz'), 'continuity prompt must preserve the named guard');
const konstantinContinuity = continuityContext.buildNpcContinuityHint([
  { id: 'konstantin_wegener', name: 'Konstantin Wegener', tag: 'ZIELPERSON' }
]);
assert(!konstantinContinuity.includes('Helga wartet in ihrer Wohnung'), 'Konstantin must never inherit Helga memory by surname');

const npcStateContext = {
  caseProgress: {},
  normForMatch,
  _npcZustandMap: () => ({
    'konstantin wegener': { name: 'Konstantin Wegener', status: 'frei', seitTag: 1, seitSzene: 1 },
    'oberleutnant mertens': { name: 'Oberleutnant Mertens', status: 'gefesselt', seitTag: 1, seitSzene: 1 }
  }),
  gameDay: 1,
  sceneCounter: 1,
  diag: () => {}
};
vm.createContext(npcStateContext);
vm.runInContext(sourceOf('_npcZustandGet'), npcStateContext);
assert.strictEqual(npcStateContext._npcZustandGet('Helga Wegener'), null, 'Helga must never inherit Konstantin state by surname');
assert.strictEqual(npcStateContext._npcZustandGet('Mertens').name, 'Oberleutnant Mertens', 'single-name title aliases must keep working');

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
