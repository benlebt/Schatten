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
  for (let i = start; i < html.length; i++) {
    if (html[i] === '{') { depth += 1; opened = true; }
    else if (html[i] === '}') {
      depth -= 1;
      if (opened && depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('unterminated function ' + name);
}

const context = {
  caseProgress: {},
  sceneCounter: 4,
  engineCurrentLocation: { name: 'Wessel-Wohnung' },
  normForMatch(value) {
    return String(value || '').toLowerCase()
      .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
  },
  _konfrontationAktiv: () => false,
  _konfrontationOrtName: () => 'Haus der Ministerien',
  _konfrontationTaktikProfil: (npc) => ({ tag: npc.tag }),
  diag: () => {},
};
vm.createContext(context);
vm.runInContext([
  sourceOf('_bedrohungsCliffhangerErkennen'),
  sourceOf('_bedrohungsCliffhangerAktualisieren'),
  sourceOf('_bedrohungsCliffhangerPrompt'),
  sourceOf('_konfrontationAusProsa'),
].join('\n'), context);

const door = { szene: 'Schwere Schritte hallen auf dem Flur. Jemand bleibt direkt vor der Tür stehen. Du hältst den Atem an.' };
context._bedrohungsCliffhangerAktualisieren(door);
assert(context.caseProgress.pendingThreatCliffhanger, 'door threat must persist');
assert(context._bedrohungsCliffhangerPrompt().includes('Bei einer Reiseaktion'), 'travel must pay off the hook instead of erasing it');

context.sceneCounter = 5;
context._bedrohungsCliffhangerAktualisieren({ szene: 'Du fährst zur Baustelle. Dort liegt Staub in der Luft.' });
assert(context.caseProgress.pendingThreatCliffhanger, 'an ignored hook must remain pending');
assert.strictEqual(context.caseProgress.pendingThreatCliffhanger.retries, 1, 'ignored hook must be diagnosed');

context.caseProgress.pendingThreatCliffhanger.prompted = true;
context.sceneCounter = 6;
context._bedrohungsCliffhangerAktualisieren({ szene: 'Du stößt die Tür auf. Der Mann weicht zurück und bleibt im Haus zurück, als du entkommst.' });
assert.strictEqual(context.caseProgress.pendingThreatCliffhanger, null, 'visible escape must resolve the hook');

assert.strictEqual(context._bedrohungsCliffhangerErkennen({ szene: 'Auf dem Bahnhof hörst du Schritte im Gedränge.' }), null, 'ordinary atmosphere must not become a cliffhanger');
assert(context._bedrohungsCliffhangerErkennen({ szene: 'Ein metallisches Klicken hallt durch den Gang, der Riegel einer Waffe.' }), 'weapon cocking must persist as a threat hook');

context.caseProgress = {};
context.sceneCounter = 7;
context.engineCurrentLocation = { name: 'Haus der Ministerien' };
const cast = [];
const blockers = {
  szene: 'Zwei Männer stehen im Schatten des Portals und mustern dich. Der Schlanke tritt vor, eine Hand wandert in seinen Trenchcoat.',
  personenImRaum: [],
};
assert(context._konfrontationAusProsa(blockers, cast), 'armed blockers must become a confrontation before they strike');
assert.strictEqual(context.caseProgress.activeConfrontation.enemyName, 'Zwei Männer im Trenchcoat');
assert.strictEqual(context.caseProgress.activeConfrontation.trigger, 'prosa-drohung');
assert.strictEqual(cast.length, 1, 'armed blockers must enter the playable cast');

console.log('CLIFFHANGER_GUARD_OK');
