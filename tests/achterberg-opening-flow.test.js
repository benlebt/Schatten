const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sourceOf(name) {
  const marker = `function ${name}(`;
  const start = html.indexOf(marker);
  assert(start >= 0, `${name} missing`);
  const bodyStart = html.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error(`${name} is incomplete`);
}

const opera = { name: 'Deutsche Staatsoper (Admiralspalast)' };
const garderobe = {
  name: 'Achterbergs Garderobe',
  lokalVon: ['Deutsche Staatsoper (Admiralspalast)'],
};
const apotheke = { name: 'Apotheke am Bahnhof Friedrichstrasse' };
const travelContext = {
  normForMatch: value => String(value || '').toLowerCase().trim(),
  getCaseLocations: () => [opera, garderobe, apotheke],
};
vm.createContext(travelContext);
vm.runInContext(sourceOf('_reiseIstLokalerWeg'), travelContext);

assert.strictEqual(travelContext._reiseIstLokalerWeg(opera.name, garderobe), true,
  'configured room-to-room movement must be local');
assert.strictEqual(travelContext._reiseIstLokalerWeg(garderobe.name, opera), true,
  'local connection must work in both directions');
assert.strictEqual(travelContext._reiseIstLokalerWeg(opera.name, apotheke), false,
  'unrelated locations must remain real Opel journeys');

const travelSource = sourceOf('reiseZuOrt');
assert(travelSource.includes("if (!_lokalerWeg && typeof fxTravel === 'function')"),
  'local movement must skip the Opel animation');
assert(travelSource.includes('_zeitUnmittelbar: _lokalerWeg'),
  'local movement must not consume a full time block');
assert(travelSource.includes('Geh im Gebaeude weiter zu:'),
  'local movement needs truthful player-facing action text');
assert(travelSource.includes('Kein Opel, keine Fahrt, kein Parken'),
  'local movement needs a hard narrative constraint');
assert(travelSource.includes('!_lokalerWeg && !_notfallBehandlungsfahrt'),
  'local movement must not trigger drunk- or fatigue-driving failures');
assert(travelSource.includes("if (typeof _stageFloorAnwenden === 'function') _stageFloorAnwenden();"),
  'travel must reconcile an already earned evidence stage before target clues render');

const achterbergStart = html.indexOf("klient: 'Wilhelmine Achterberg (Witwe des Dirigenten)'");
const achterbergEnd = html.indexOf('anchorNpcs:', achterbergStart);
assert(achterbergStart >= 0 && achterbergEnd > achterbergStart, 'Achterberg setup slice missing');
const achterberg = html.slice(achterbergStart, achterbergEnd);
assert(achterberg.includes("abschlussOrt: 'Achterberg-Villa'"),
  'Achterberg must route the final report to Wilhelmine at the villa');
assert(achterberg.includes("npcs: [{ id: 'wilhelmine_achterberg', immer: true }]"),
  'Wilhelmine must be visibly and interactively present at the Achterberg villa');
assert(achterberg.includes("npcs: [{ id: 'gerda_wolff', immer: true }]"),
  'the named female pharmacist must be present in prose, UI, and image');
assert(achterberg.includes('Wilhelmine empfängt Karl und erhält seinen Abschlussbericht hier im Foyer.'),
  'the villa narrative setting must match the canonical foyer image during the final report');
assert(achterberg.includes("abschlussEffekt: { verantwortlicher: 'Egon Vossberg', suspectConfronted: true, ueberfuehrt: true"),
  'Vossbergs deterministic confrontation clue must unlock the resolve path');
assert(html.includes("function _szenenbildVersionierteUrl(src)"),
  'scene images must use a release-bound cache key so deployed corrections appear immediately');
assert(achterberg.includes("lokalVon: ['Deutsche Staatsoper (Admiralspalast)']"),
  'Achterberg Garderobe must be linked locally to the opera');
assert(achterberg.includes("npcs: [{ id: 'theo_marquardt', immer: true }, { id: 'otto_jahnke', immer: true }]"),
  'the Garderobe UI roster must immediately match its fixed Theo-and-Otto scene image');
assert(/id: 'vossberg_gelegenheit'[\s\S]*?stage: 3, abStage: 1/.test(achterberg),
  'third opening clue must be reachable in stage 1 to avoid a progression deadlock');
assert(achterberg.includes("name: 'Otto Jahnke', id: 'otto_jahnke', tag: 'WITNESS'"),
  'the opportunity clue needs a canonical witness');
assert(/id: 'vossberg_gelegenheit'[\s\S]*?npc: 'otto_jahnke', quelle: 'person', actions: \['BEFRAGEN','ANSPRECHEN','UEBERZEUGEN'\]/.test(achterberg),
  'the witness statement must be obtained through conversation, not room search');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1592 +SchifferFirstMeetingTruth'"),
  'release version missing');
assert(html.includes('const _abschlussAkutGefaehrlich = currentSp > 3 && !!_aktiveFluchtGefahr;'),
  'high tension may block resolution only while an acute threat is still active');
assert(html.includes('resolveCanClick = resolveCoreReady && karlVfOk && !_abschlussAkutGefaehrlich'),
  'a cleared confrontation must not force a pointless travel scene before resolution');

assert(html.includes("const _engineOrtswechsel = !!("),
  'prompt cast cleanup must use engine travel state, not only text heuristics');
assert(html.includes("const _istReise = _engineOrtswechsel || (_reiseRe.test(_umsg) && !isLocalMovementAction(_umsg));"),
  'local system travel must be recognized as a real prompt-cast transition');

const oldSetup = {
  caseType: 'mord',
  opfer: 'Reinhold Achterberg',
  tat: 'Digitalis',
  locations: [{
    name: 'Achterbergs Garderobe',
    indizien: [{
      id: 'vossberg_gelegenheit',
      quelle: 'umgebung',
      actions: ['ERKUNDEN', 'BEFRAGEN'],
      stage: 3,
      abStage: 2,
    }],
  }],
  setupCast: [],
};
const currentSetup = {
  caseType: 'mord',
  opfer: 'Reinhold Achterberg',
  tat: 'Digitalis',
  locations: [{
    name: 'Achterbergs Garderobe',
    lokalVon: ['Deutsche Staatsoper (Admiralspalast)'],
    npcs: [{ id: 'theo_marquardt', immer: true, abStage: 1 }, { id: 'otto_jahnke', immer: true, abStage: 1 }],
    indizien: [{
      id: 'vossberg_gelegenheit',
      npc: 'otto_jahnke',
      quelle: 'person',
      actions: ['BEFRAGEN', 'ANSPRECHEN', 'UEBERZEUGEN'],
      stage: 3,
      abStage: 1,
    }],
  }],
  setupCast: [{ name: 'Otto Jahnke', id: 'otto_jahnke', tag: 'WITNESS' }],
};
const migrationContext = {
  caseSetup: oldSetup,
  INTRO_VARIANTS: [{ setup: currentSetup }],
  normForMatch: value => String(value || '').toLowerCase().trim(),
  diag: () => {},
};
vm.createContext(migrationContext);
vm.runInContext(sourceOf('_migriereCaseSetupOrte'), migrationContext);
migrationContext._migriereCaseSetupOrte();
const migratedRoom = migrationContext.caseSetup.locations[0];
assert.deepStrictEqual(Array.from(migratedRoom.lokalVon), currentSetup.locations[0].lokalVon,
  'restore migration must add local room connections to running cases');
assert.strictEqual(migratedRoom.indizien[0].abStage, 1,
  'restore migration must update corrected evidence stage gates');
assert.strictEqual(migratedRoom.indizien[0].quelle, 'person',
  'restore migration must update a corrected evidence source');
assert.deepStrictEqual(Array.from(migratedRoom.indizien[0].actions), currentSetup.locations[0].indizien[0].actions,
  'restore migration must update corrected evidence actions');
assert.strictEqual(migratedRoom.npcs[0].id, 'theo_marquardt',
  'restore migration must add newly configured room NPCs');
assert.strictEqual(migrationContext.caseSetup.setupCast[0].id, 'otto_jahnke',
  'restore migration must add newly configured cast witnesses');

const fallbackContext = {
  engineCurrentLocation: { name: 'Achterbergs Garderobe' },
  caseProgress: { indizien: ['Streit', 'Digitalis'] },
  normForMatch: value => String(value || '').toLowerCase().trim(),
  diag: () => {},
};
vm.createContext(fallbackContext);
vm.runInContext(sourceOf('enforceSceneWorldTruthFallback'), fallbackContext);
const localScene = { szene: 'Unbrauchbar', personenImRaum: [], optionen: [] };
fallbackContext.enforceSceneWorldTruthFallback(localScene, {
  code: 'arrival_npc_roster_drift',
  required: ['Dr. Theo Marquardt'],
}, { _istLokalweg: true });
assert(/innerhalb des Gebaeudes weiter/.test(localScene.szene),
  'arrival hard fallback must narrate local movement on foot');
assert(!/Opel/.test(localScene.szene),
  'arrival hard fallback must never reintroduce the Opel on a local path');

console.log('achterberg-opening-flow: ok');
