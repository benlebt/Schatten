const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const blockStart = html.indexOf('function _npcZustandMap()');
const blockEnd = html.indexOf('function _npcZustandGet(', blockStart);
assert(blockStart >= 0 && blockEnd > blockStart, 'NPC world-state block missing');

const kratz = { id: 'lothars_bewacher', name: 'Erwin Kratz', tag: 'GANGSTER' };
const konstantin = { id: 'konstantin_wegener', name: 'Konstantin Wegener', tag: 'TARGET' };
const context = {
  caseSetup: { setupCast: [kratz, konstantin] },
  caseProgress: {
    npcZustand: {
      'erwin kratz': {
        name: 'Erwin Kratz',
        status: 'uebergeben',
        ort: 'Lagerhalle an der Spree',
        seitSzene: 37,
        seitTag: 2
      }
    },
    activeConfrontation: {
      npcId: 'lothars_bewacher',
      enemyName: 'Erwin Kratz'
    },
    encounterState: 'kampf',
    encounterEnemies: ['lothars_bewacher'],
    encounterHP: { 'Erwin Kratz': 2 },
    encounterRound: 4,
    encounterStartedAtLocation: 'Lagerhalle an der Spree',
    showdownAktiv: false
  },
  engineCurrentLocation: { name: 'Lagerhalle an der Spree' },
  sceneCounter: 49,
  gameDay: 2,
  pendingCategoryMessages: [],
  _threatAktiveSpawns: ['lothars_bewacher'],
  cast: [kratz, konstantin],
  currentScene: { personenImRaum: [kratz, konstantin] },
  window: {
    _aktionsPlan: [{ verb: 'greife_an', target: 'Erwin Kratz' }],
    __hauptuiActionState: { verb: 'greife_an', targetKey: 'Erwin Kratz' },
    __hauptuiKonfrontationState: { moveKey: 'angriff', assistKeys: {} }
  },
  normForMatch: (value) => String(value || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim(),
  _resolveNpcIdentity: (probe) => {
    const key = String(probe || '').toLowerCase().replace(/_/g, ' ').trim();
    if (key === 'lothars bewacher' || key === 'erwin kratz') return kratz;
    if (key === 'konstantin wegener') return konstantin;
    return null;
  },
  diag: () => {}
};
vm.createContext(context);
vm.runInContext(html.slice(blockStart, blockEnd), context);

assert.strictEqual(context._npcZustandIstEntfernt('lothars_bewacher'), true,
  'setup ID must resolve to the handed-over display-name state');
assert.strictEqual(context._npcZustandSet('lothars_bewacher', { status: 'benommen' }), false,
  'a stale fight action must not revive a handed-over NPC');
assert.strictEqual(context.caseProgress.npcZustand['erwin kratz'].status, 'uebergeben',
  'terminal NPC state must remain unchanged');
assert.deepStrictEqual(Array.from(context._threatAktiveSpawns), [],
  'handed-over NPC must be removed from active threat spawns');
assert.deepStrictEqual(Array.from(context.cast).map((npc) => npc.name), ['Konstantin Wegener'],
  'handed-over NPC must be removed from the AI cast while the rescue target remains');
assert.deepStrictEqual(Array.from(context.currentScene.personenImRaum).map((npc) => npc.name), ['Konstantin Wegener'],
  'handed-over NPC must be removed from the scene roster');
assert.strictEqual(context.caseProgress.activeConfrontation, null,
  'handed-over NPC must close a stale confrontation');
assert.strictEqual(context.caseProgress.encounterState, null,
  'handed-over last enemy must close the encounter');
assert.deepStrictEqual(Array.from(context.caseProgress.encounterEnemies), [],
  'handed-over NPC must be removed from encounter enemies');
assert.strictEqual(context.window._aktionsPlan.length, 0,
  'stale action plans must be cleared after police handoff');
assert.strictEqual(context.window.__hauptuiActionState.verb, null,
  'main UI selection must reset after police handoff');

context.caseProgress.npcZustand = {};
context._threatAktiveSpawns = ['lothars_bewacher'];
context.cast = [kratz, konstantin];
context.currentScene.personenImRaum = [kratz, konstantin];
assert.strictEqual(context._npcZustandSet('Erwin Kratz', { status: 'uebergeben' }), true,
  'first police handoff must be stored');
assert.strictEqual(context._npcZustandIstEntfernt('lothars_bewacher'), true,
  'new terminal state must cover the setup-ID alias immediately');
assert.deepStrictEqual(Array.from(context.cast).map((npc) => npc.name), ['Konstantin Wegener'],
  'first police handoff must purge every alias from the scene');

assert(html.includes('FINALER NPC-BLOCK:'),
  'NPC renderer needs a final post-injector terminal-state barrier');
assert(html.includes("KONFRONTATION BLOCKIERT:"),
  'confrontation start needs a terminal-state barrier');
assert(html.includes("add('befreien', 'Befreie')"),
  'physical rescue action must remain present after guard cleanup');

console.log('NPC_TERMINAL_STATE_OK');
