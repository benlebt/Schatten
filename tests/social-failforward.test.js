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

const attempts = {
  window: {},
  gameDay: 2,
  npcTonartVerbraucht: {},
};
vm.createContext(attempts);
vm.runInContext([
  sourceOf('_sozialTonartTagKey'),
  sourceOf('_sozialTonartIstVerbraucht'),
  sourceOf('_sozialTonartVerbrauchen'),
].join('\n'), attempts);

assert.strictEqual(attempts._sozialTonartVerbrauchen('Ilse Hauke', 'druck'), true,
  'a failed approach must be recordable');
assert.strictEqual(attempts._sozialTonartIstVerbraucht('Ilse Hauke', 'druck'), true,
  'the same approach must stay unavailable for the current day');
attempts.gameDay = 3;
assert.strictEqual(attempts._sozialTonartIstVerbraucht('Ilse Hauke', 'druck'), false,
  'a necessary conversation route must reopen on the next day');
attempts.npcTonartVerbraucht['Frau Pohl'] = ['normal'];
assert.strictEqual(attempts._sozialTonartIstVerbraucht('Frau Pohl', 'normal'), false,
  'legacy undated saves must not permanently burn a witness');

const reputation = {
  karlAkte: { ruf: { renommee: 3, haerte: 0 } },
  normForMatch: (value) => String(value || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim(),
};
vm.createContext(reputation);
vm.runInContext([
  sourceOf('_sozialTonartArt'),
  sourceOf('_sozialErfolgNachRuf'),
].join('\n'), reputation);

let result = reputation._sozialErfolgNachRuf(
  { key: 'hoeflich', art: 'normal', erfolg: false, schwere: 'leicht' },
  { sozial: {} }
);
assert.strictEqual(result.erfolg, true, 'strong renown must be able to rescue a light polite attempt');
assert.strictEqual(result.einfluss, 'vorteil', 'the UI must be able to disclose a reputation advantage');

result = reputation._sozialErfolgNachRuf(
  { key: 'kragen', art: 'kragen', erfolg: false, schwere: 'schwer', verprelltDanach: true },
  { sozial: {} }
);
assert.strictEqual(result.erfolg, false, 'reputation must never turn physical escalation into the correct clue route');

reputation.karlAkte.ruf = { renommee: 0, haerte: 3 };
result = reputation._sozialErfolgNachRuf(
  { key: 'druck', art: 'bedrohen', erfolg: false, schwere: 'leicht' },
  { sozial: {} }
);
assert.strictEqual(result.erfolg, true, 'a hard reputation must be able to rescue a light pressure attempt');

reputation.karlAkte.ruf = { renommee: -4, haerte: 0 };
result = reputation._sozialErfolgNachRuf(
  { key: 'normal', art: 'normal', erfolg: true },
  { sozial: {} }
);
assert.strictEqual(result.erfolg, false, 'a ruined reputation must be able to spoil an otherwise fitting friendly approach');

assert(/key: 'sozial_erschoepft'[\s\S]{0,260}?morgen/i.test(html),
  'exhausted approaches must explain the next-day retry instead of falling back to automatic talk');
assert(/verb && verb\._sozialErledigt/.test(html),
  'the exhausted conversation entry must be handled without an AI request');
assert(/const einmalKey = npcKey \+ '\|' \+ _sozialTonartTagKey\(verb\._sozialTonart\);/.test(html),
  'reputation and social consequences must apply again to a repeated action on another day');

const names = {
  window: { _letzteAktion: { npcName: 'Trude', npcId: 'trude' } },
  caseSetup: {
    klient: 'Edith Kessler (Ehefrau)',
    opfer: 'Robert Kessler (Ehemann)',
    setupCast: [
      { id: 'trude', name: 'Trude', tag: 'KONTAKT', beziehung: 'Imbisswirtin in Mitte' },
      { id: 'ilse_hauke', name: 'Ilse Hauke', tag: 'ROMANCE', beziehung: 'Verbindung zu Robert Kessler' },
      { id: 'oberkellner_voss', name: 'Oberkellner Voss', tag: 'WITNESS', detail: 'Voss kennt Ilse Hauke als Roberts Begleitung.' },
    ],
  },
  caseProgress: { indizien: ['Das Klingelschild traegt den Namen Hauke.'] },
  clientProfile: { name: 'Edith Kessler' },
  normForMatch: (value) => String(value || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, ' ').trim(),
  _npcWurdeSchonAngesprochen: () => false,
  diag: () => {},
};
vm.createContext(names);
vm.runInContext([
  sourceOf('_npcNamenswissenSperren'),
  sourceOf('buildNpcNamenswissenHint'),
  sourceOf('guardSceneNpcNamenswissen'),
].join('\n'), names);

const trudeScene = {
  szene: 'Trude sagt, dass Ilse Hauke gestern hier war. Ilse wirkte nervoes.',
  optionen: [{ text: 'Frag Trude nach Ilse.' }],
};
const replaced = Array.from(names.guardSceneNpcNamenswissen(trudeScene));
assert.deepStrictEqual(replaced, ['Ilse Hauke'], 'Trude must be caught using Ilse before that knowledge is established');
assert(!/\bIlse\b/.test(trudeScene.szene + ' ' + trudeScene.optionen[0].text),
  'the unsupported first name must be removed from prose and options');
assert(/Frau Hauke/.test(trudeScene.szene), 'the already known surname must remain usable');
assert(/UI-Faeden und Setup-Cast/.test(names.buildNpcNamenswissenHint()),
  'the model prompt must state the boundary between UI knowledge and character knowledge');

names.window._letzteAktion = { npcName: 'Oberkellner Voss', npcId: 'oberkellner_voss' };
const vossScene = { szene: 'Voss nennt Roberts Begleitung Ilse Hauke.', optionen: [] };
assert.deepStrictEqual(Array.from(names.guardSceneNpcNamenswissen(vossScene)), [],
  'a witness whose canonical setup establishes the acquaintance may introduce the full name');
assert(/Ilse Hauke/.test(vossScene.szene), 'legitimate name knowledge must survive the guard');

names.window._letzteAktion = { npcName: 'Theodor Krause', npcId: 'theodor_krause' };
names.caseSetup = {
  klient: 'Theodor Krause (Antiquitaetenhaendler)',
  tat: 'Krause vermutet das Diebesgut bei Tante Frieda.',
  anlass: 'Karl soll das Etui bei Tante Frieda wiederbeschaffen.',
  nebenfiguren: 'Tante Frieda betreibt die Hehlerei.',
  setupCast: [
    { id: 'theodor_krause', name: 'Theodor Krause', tag: 'CLIENT' },
    { id: 'tante_frieda', name: 'Tante Frieda', tag: 'SUSPECT' },
    { id: 'hannelore_wirth', name: 'Hannelore Wirth', tag: 'WITNESS' },
  ],
};
names.caseProgress = { indizien: [] };
names.clientProfile = { name: 'Theodor Krause' };
names.currentScene = {
  personenImRaum: ['Theodor Krause'],
  szene: 'Theodor Krause nennt Tante Frieda als vermutete Hehlerin.'
};
const krauseNameScene = {
  szene: 'Theodor Krause warnt vor Tante Frieda. Hannelore Wirth habe alles gesehen.',
  optionen: []
};
assert.deepStrictEqual(Array.from(names.guardSceneNpcNamenswissen(krauseNameScene)), ['Hannelore Wirth'],
  'Krause must retain the canonically established Tante Frieda while an unintroduced witness stays blocked');
assert(/Tante Frieda/.test(krauseNameScene.szene) && !/Hannelore/.test(krauseNameScene.szene),
  'the name guard must not corrupt an established titled singleton into an unknown man');

console.log('social fail-forward regression checks passed');
