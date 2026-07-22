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
  for (let i = brace; i < html.length; i += 1) {
    if (html[i] === '{') depth += 1;
    else if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error('unterminated function ' + name);
}

const norm = (value) => String(value || '').toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ').trim();

let time = 'morgen';
const locations = [
  {
    name: 'Cafe Wien',
    oeffnungszeit: ['nachmittag', 'abend'],
    indizien: [{ id: 'cafe_spur', npc: 'oberkellner_voss', zeit: ['nachmittag'] }],
    npcs: [{ id: 'oberkellner_voss', zeit: ['nachmittag'] }],
  },
  {
    name: 'Spedition Schmidt Moabit',
    oeffnungszeit: ['morgen', 'vormittag'],
    indizien: [{ id: 'tetzlaff_aussage', npc: 'norbert_tetzlaff' }],
    npcs: [{ id: 'norbert_tetzlaff', immer: true }],
  },
  {
    name: 'Hinterhof Sybelstrasse',
    indizien: [{ id: 'ilse_aussage', npc: 'ilse_hauke', abStage: 2 }],
    npcs: [{ id: 'ilse_hauke', immer: true }],
  },
  { name: 'Kessler-Wohnung Charlottenburg', indizien: [] },
  { name: 'Mobiler Opel', reisbar: false, indizien: [{ id: 'opel_spur' }] },
];

const context = {
  caseProgress: { stage: 1, gefundeneIndizIds: [] },
  normForMatch: norm,
  _aktTageszeitName: () => time,
  getCaseLocations: () => locations,
  istReisbarerOrt: (loc) => !!loc && loc.reisbar !== false,
  istOrtGeoeffnet: (loc) => !Array.isArray(loc.oeffnungszeit)
    || loc.oeffnungszeit.map(norm).includes(time),
};
vm.createContext(context);
vm.runInContext([
  sourceOf('_indizNpcIdsAmOrtJetzt'),
  sourceOf('_indizAmOrtJetztErreichbar'),
  sourceOf('_hauptuiFadenOrte'),
  sourceOf('_hauptuiFadenIstJetztErreichbar'),
  sourceOf('_hauptuiOffeneFaeden'),
].join('\n'), context);

const closedCafe = { id: 'cafe', ort: 'Cafe Wien', targetIds: ['oberkellner_voss'] };
const openSpedition = { id: 'spedition', ort: 'Spedition Schmidt Moabit', targetIds: ['norbert_tetzlaff'] };
const stageLocked = { id: 'ilse', ort: 'Hinterhof Sybelstrasse', targetIds: ['ilse_hauke'] };
const noMapLocation = { id: 'phantom', ort: 'Nicht auf der Karte', targetIds: ['x'] };

assert.strictEqual(context._hauptuiFadenIstJetztErreichbar(closedCafe), false,
  'a thread at a currently closed location must be hidden');
assert.strictEqual(context._hauptuiFadenIstJetztErreichbar(stageLocked), false,
  'a thread whose concrete clue is stage-locked must be hidden');
assert.strictEqual(context._hauptuiFadenIstJetztErreichbar(openSpedition), true,
  'an open mapped location with its matching NPC clue must be visible');
assert.strictEqual(context._hauptuiFadenIstJetztErreichbar(noMapLocation), false,
  'a thread without a travel destination must not promise map access');
assert.strictEqual(context._hauptuiFadenIstJetztErreichbar({
  id: 'bericht', ort: 'Kessler-Wohnung Charlottenburg', targetIds: ['edith_kessler'], status: 'bereit'
}), true, 'a ready report is directly actionable even without a remaining clue');
assert.strictEqual(context._hauptuiFadenIstJetztErreichbar({
  id: 'wrong_target', ort: 'Spedition Schmidt Moabit', targetIds: ['briefchen_ilse']
}), false, 'an unrelated reachable clue at the same location must not expose the wrong thread');

context._hauptuiAlleOffenenFaeden = () => [closedCafe, stageLocked, noMapLocation, openSpedition];
let visible = Array.from(context._hauptuiOffeneFaeden());
assert.deepStrictEqual(visible.map((faden) => faden.id), ['spedition'],
  'filtering must happen before the three-thread limit so a reachable fourth thread survives');

time = 'nachmittag';
context.caseProgress.stage = 2;
visible = Array.from(context._hauptuiOffeneFaeden());
assert(visible.some((faden) => faden.id === 'cafe'),
  'a temporarily hidden thread must reappear when its time gate opens');
assert(visible.some((faden) => faden.id === 'ilse'),
  'a temporarily hidden thread must reappear when its stage gate opens');

assert(!/return faeden\.slice\(0, 3\)/.test(sourceOf('_hauptuiKesslerFaeden')),
  'Kessler threads must not be truncated before reachability filtering');
assert(!/return faeden\.slice\(0, 3\)/.test(sourceOf('_hauptuiGenerischeFaeden')),
  'generic threads must not be truncated before reachability filtering');
assert(html.includes("showProgressToast('Rufwirkung', erklaerung"),
  'reputation toast title must not repeat the numeric result from its body');
assert(!html.includes("showProgressToast('Rufwirkung: ' + teile.join(' · ')"),
  'duplicate reputation result in the toast title must stay removed');

console.log('OPEN_THREAD_REACHABILITY_OK');
