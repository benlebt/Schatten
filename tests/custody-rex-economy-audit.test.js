const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1382 +Offener-Klient-Ortshinweis'"), 'version constant is stale');
assert(html.includes("text: 'Fall abschließen und Auftraggeber informieren.'"), 'resolve button copy must stay player-facing');
assert(html.includes('_enginePrompt: [_resolveText, _resolveTransitionPrompt]'), 'resolve direction must remain private');
assert(!html.includes('resolveOpt.text += narr'), 'director narration must not leak into resolve button text');
assert(html.includes('Roth kuendigt an, Marquardts Rolle getrennt zu pruefen'), 'Achterberg ending must preserve Marquardt consequence');
assert(html.includes('Dr. Marquardts Praxis in der Linienstrasse (Mitte)'), 'long Marquardt location name must be replaced');
assert(!html.includes("name: 'Dr. Marquardts Praxis (Linienstrasse, Mitte)'"), 'clipped Marquardt location name must not return');
assert(html.includes('if (_stasiEncounterPflicht) timeContext += _stasiEncounterPflicht;'),
  'Stasi encounter prompt must be appended to the live scene context');
assert(html.includes('Falls dies der erste sichtbare Auftritt dieser Figur ist'),
  'dynamically injected Stasi officers need a mandatory visible introduction');
assert(html.includes('encounter.introduced !== false'),
  'a dynamic Stasi officer must remain hidden until the prose introduces the figure');
assert(html.includes('_stasiEncounterConfirmIntroFromScene(scene);'),
  'returned scenes must confirm the visible Stasi introduction before the UI can expose it');
assert(!html.includes('if (_stasiEncounterPflicht) recap += _stasiEncounterPflicht;'),
  'Stasi encounter prompt must not access the history-local recap variable');
assert(/const _haftIntel = caseProgress\.pendingCustodyIntelNarration;\s*timeContext \+=/.test(html),
  'custody intel narration must be appended to the live scene context');

const encounterStart = html.indexOf('function _stasiRelevanz()');
const encounterEnd = html.indexOf('function _custodyVerhoerState()', encounterStart);
assert(encounterStart >= 0 && encounterEnd > encounterStart, 'cannot isolate Stasi encounter state machine');

const makeEncounterContext = (political) => {
  const diagMessages = [];
  const context = {
    caseSetup: political ? {
      id: 'politischer_testfall',
      stasiRelevance: 5,
      setupCast: [{
        id: 'mertens',
        name: 'Oberleutnant Mertens',
        tag: 'STASI',
        rolle: 'MfS-Oberleutnant'
      }]
    } : {
      id: 'privater_testfall',
      stasiRelevance: 1,
      setupCast: []
    },
    caseIsPolitical: political,
    caseProgress: {
      stage: 2,
      indizien: [{}, {}, {}, {}],
      stasiEncounterEligibleScenes: 0,
      stasiEncounterCooldownUntil: 0,
      stasiEncounterHistory: []
    },
    normForMatch: (value) => String(value || '').toLowerCase(),
    getStasiCap: () => 5,
    engineCurrentLocation: { name: 'Reichsbahndirektion', sektor: 'Ost' },
    _konfrontationTaktikProfil: () => ({ ziel: 'Kontrolle' }),
    _konfrontationAktiv: () => false,
    sceneCounter: 8,
    custodyLocked: false,
    diag: (...args) => diagMessages.push(args.join(' ')),
    diagMessages
  };
  vm.createContext(context);
  vm.runInContext(html.slice(encounterStart, encounterEnd), context);
  return context;
};

const politicalEncounter = makeEncounterContext(true);
let encounter = politicalEncounter._stasiEncounterForceZugriff('Audit');
assert(encounter && encounter.name === 'Oberleutnant Mertens', 'political Stasi encounter must use the configured named officer');
assert.strictEqual(encounter.phase, 'zugriff', 'forced political pressure must become a visible access phase');
assert.strictEqual(politicalEncounter.engineCurrentLocation.name, 'Reichsbahndirektion', 'Stasi encounter must not teleport Karl before arrest');
assert.strictEqual(encounter.introduced, false, 'a newly injected Stasi officer must start outside the visible scene');
assert.strictEqual(politicalEncounter.caseProgress.activeConfrontation, undefined, 'Stasi access must not become clickable before its prose introduction');
assert.strictEqual(
  politicalEncounter._stasiEncounterConfirmIntroFromScene({
    szene: 'Oberleutnant Mertens tritt sichtbar aus dem Schatten und stellt Karl.',
    ort: 'Reichsbahndirektion'
  }),
  true,
  'the named prose appearance must confirm the Stasi introduction'
);
assert.strictEqual(encounter.introduced, true, 'the encounter must remember its visible introduction');
assert.strictEqual(politicalEncounter.caseProgress.activeConfrontation.trigger, 'stasi-encounter', 'introduced Stasi access must create a playable confrontation');
assert.strictEqual(vm.runInContext('karlInStasiCustody', politicalEncounter), false, 'access phase must not silently set custody');
assert(politicalEncounter._stasiEncounterPrompt().includes('Oberleutnant Mertens'), 'encounter prompt must preserve the same named officer');
politicalEncounter._stasiEncounterClear('Audit beendet', 3);
assert.strictEqual(politicalEncounter.caseProgress.stasiEncounter.active, false, 'resolved Stasi encounter must be persisted as inactive');
assert.strictEqual(politicalEncounter.caseProgress.stasiEncounterCooldownUntil, 11, 'resolved encounter needs a scene cooldown');

// Vollstaendiger Stein-aehnlicher Pfad: Relevanz 5 startet eine benannte
// Beobachtung, diese darf verdeckt einen Ortswechsel mitmachen, wird sichtbar
// eingefuehrt und eskaliert erst danach zur spielbaren Kontrolle/zum Zugriff.
const steinFlow = makeEncounterContext(true);
steinFlow.sceneCounter = 3;
steinFlow._stasiEncounterRoll = () => 0;
let steinEncounter = null;
for (let i = 0; i < 6 && !steinEncounter; i += 1) {
  steinFlow.sceneCounter += 1;
  steinFlow._stasiEncounterAdvance('ERMITTLUNG');
  if (steinFlow.caseProgress.stasiEncounter && steinFlow.caseProgress.stasiEncounter.active) {
    steinEncounter = steinFlow.caseProgress.stasiEncounter;
  }
}
assert(steinEncounter && steinEncounter.phase === 'beobachtung', 'Stein relevance 5 must deterministically reach a named observation');
assert.strictEqual(steinEncounter.name, 'Oberleutnant Mertens', 'Stein flow must preserve the configured officer identity');
steinFlow.engineCurrentLocation.name = 'S-Bahnhof Friedrichstrasse';
const followingPrompt = steinFlow._stasiEncounterPrompt();
assert(followingPrompt.includes('Oberleutnant Mertens'), 'hidden observation must remain narratable after Karl changes location');
assert.strictEqual(steinEncounter.location, 'S-Bahnhof Friedrichstrasse', 'hidden observation must rebind to the new location before introduction');
assert.strictEqual(steinFlow._stasiEncounterConfirmIntroFromScene({ szene: 'Oberleutnant Mertens steht sichtbar am Bahnsteig.', ort: 'S-Bahnhof Friedrichstrasse' }), true,
  'Stein observer must become visible before becoming clickable');
steinFlow.sceneCounter += 1;
steinFlow._stasiEncounterAdvance('OFFENSIV');
assert.strictEqual(steinEncounter.phase, 'zugriff', 'an open provocation must escalate the introduced observation to access: ' + steinFlow.diagMessages.join(' | '));
assert.strictEqual(steinFlow.caseProgress.activeConfrontation.trigger, 'stasi-encounter', 'the escalated Stein access must be playable');

const privateEncounter = makeEncounterContext(false);
encounter = privateEncounter._stasiEncounterForceZugriff('Darf nicht passieren');
assert.strictEqual(encounter, null, 'private cases without MfS cast must not receive spontaneous Stasi access');
assert.strictEqual(privateEncounter.caseProgress.activeConfrontation, undefined, 'private cases must not create a hidden Stasi confrontation');

const privateStaleCast = makeEncounterContext(false);
privateStaleCast.caseSetup.setupCast = [{
  id: 'stamm_mfs',
  name: 'Hauptmann Vollmer',
  tag: 'STASI',
  rolle: 'Hauptmann der Staatssicherheit',
  _stammfigur: true
}];
assert.strictEqual(privateStaleCast._stasiMechanikAktiv(), false, 'an injected recurring officer must not politicize a private case');
assert.strictEqual(privateStaleCast._stasiEncounterForceZugriff('Darf ebenfalls nicht passieren'), null,
  'a stale recurring officer must not appear at a private crime scene');
assert(html.includes('Bewusst inaktiv (Privatfall, kein MfS-Einsatz erwartet)'),
  'private-run audits must not misreport dormant recurring MfS figures as failed activations');

const custodyStart = html.indexOf('function _custodyVerhoerState()');
const custodyEnd = html.indexOf('// v7.11.44: Custody-Switch-Counter', custodyStart);
assert(custodyStart >= 0 && custodyEnd > custodyStart, 'cannot isolate custody interrogation state machine');

let paid = 0;
const custodyClue = { id: 'mfs_transportliste', text: 'MfS-Transportliste nennt den Zielort', stage: 0 };
const custodyContext = {
  caseProgress: {},
  karlInStasiCustody: true,
  diag: () => {},
  _geldZahle: (amount) => { paid += amount; return true; },
  alleDefiniertenIndizien: () => [custodyClue],
  normForMatch: (value) => String(value || '').toLowerCase(),
  asciiToUmlaut: (value) => String(value || ''),
  _markiereIndizGefunden: (ind) => ind && ind.id === custodyClue.id,
};
vm.createContext(custodyContext);
vm.runInContext(html.slice(custodyStart, custodyEnd), custodyContext);

let state = custodyContext._custodyVerhoerWahlAnwenden({ _custodyAction: 'SCHWEIGEN' });
assert.deepStrictEqual([state.runden, state.druck, state.verweigerung], [1, 1, 1], 'silence must build pressure and refusal');
state = custodyContext._custodyVerhoerWahlAnwenden({ _custodyAction: 'PROTOKOLL' });
assert.deepStrictEqual([state.runden, state.druck, state.verweigerung], [2, 3, 2], 'challenging the interrogator must escalate pressure');
state = custodyContext._custodyVerhoerWahlAnwenden({ _custodyAction: 'HALBWAHRHEIT' });
assert.deepStrictEqual([state.runden, state.druck, state.kooperation], [3, 2, 1], 'half-truths must lower pressure without ending custody');
state = custodyContext._custodyVerhoerWahlAnwenden({ _custodyAction: 'ROTH' });
assert.deepStrictEqual([state.runden, state.druck, state.rothHebel], [4, 1, 1], 'Roth leverage must be tracked');
state = custodyContext._custodyVerhoerWahlAnwenden({ _custodyAction: 'BESTECHEN' });
assert.strictEqual(paid, 10, 'custody bribe must actually spend ten Ostmark');
assert.deepStrictEqual([state.runden, state.druck, state.kooperation, state.bestechungen], [5, 0, 2, 1], 'successful bribe must soften pressure and remain recorded');
custodyContext._custodyVerhoerWahlAnwenden({ _custodyAction: 'LAUSCHEN' });
state = custodyContext._custodyVerhoerWahlAnwenden({ _custodyAction: 'LAUSCHEN' });
assert.strictEqual(state.intelGefunden, true, 'repeated listening in custody must be able to reveal a case clue');
assert.strictEqual(Array.from(custodyContext.caseProgress.custodyIntelIds).join(','), custodyClue.id, 'custody clue must be recorded only once');
assert.strictEqual(custodyContext.caseProgress.pendingCustodyIntelNarration.id, custodyClue.id, 'custody clue needs mandatory narration');

const custodySetterStart = html.indexOf('function setCustodyState(newState, source, opts)');
const custodySetterEnd = html.indexOf('// v7.11.13: META-CUSTODY-RISIKO-COUNTER', custodySetterStart);
assert(custodySetterStart >= 0 && custodySetterEnd > custodySetterStart, 'cannot isolate central custody setter');
let encounterClears = 0;
const custodySetterContext = {
  karlInStasiCustody: false,
  engineCurrentLocation: { name: 'Reichsbahndirektion', sektor: 'Ost' },
  caseProgress: {},
  sceneNumber: 12,
  stasiCustodyScenesSince: 0,
  folterSceneCount: 0,
  stasiHighTensionStreak: 0,
  _party: [],
  cast: [],
  pendingCategoryMessages: [],
  normForMatch: (value) => String(value || '').toLowerCase(),
  _custodyVerhoerState: () => ({
    runden: 0,
    druck: 0,
    kooperation: 0,
    verweigerung: 0,
    rothHebel: 0,
    bestechungen: 0,
    lauschen: 0,
    intelGefunden: false,
    letzteAktion: ''
  }),
  _stasiEncounterClear: () => { encounterClears++; },
  trackCustodyChange: () => {},
  diag: () => {}
};
vm.createContext(custodySetterContext);
vm.runInContext(html.slice(custodySetterStart, custodySetterEnd), custodySetterContext);
custodySetterContext.setCustodyState(true, 'Audit-Festnahme');
assert(custodySetterContext.engineCurrentLocation.name.includes('Zelle 14'), 'confirmed arrest must move Karl into the real cell location');
assert.strictEqual(custodySetterContext.caseProgress.custodyEntryFrom.name, 'Reichsbahndirektion', 'custody must remember the arrest location');
custodySetterContext.setCustodyState(false, 'Audit-Freilassung');
assert.strictEqual(custodySetterContext.engineCurrentLocation.name, 'Vor der MfS-Untersuchungshaftanstalt Hohenschoenhausen', 'release must use a real exterior location');
assert.strictEqual(custodySetterContext.caseProgress.custodyReleaseSource, 'Audit-Freilassung', 'release source must remain traceable');
assert.strictEqual(encounterClears, 1, 'release must close the active Stasi encounter');

for (const action of ['SCHWEIGEN', 'HALBWAHRHEIT', 'ROTH', 'PROTOKOLL', 'BESTECHEN', 'LAUSCHEN']) {
  assert(html.includes("id: '" + action + "'"), 'custody menu misses action ' + action);
}
assert(html.includes('verhoer.runden >= 3 && verhoer.druck >= 3 && verhoer.verweigerung >= 2'), 'custody death must require repeated escalation');
assert(html.includes("verfassung === 'number' && verfassung <= 2"), 'custody death must require critical health');
assert(html.includes('Math.min(0.18, chance)'), 'custody death risk must retain a hard cap');
assert(html.includes("caseProgress.gameOverTodArt = 'stasi-verhoer'"), 'a lethal custody interrogation must persist a true death outcome');
assert(html.includes("caseProgress.gameOverTodArt = 'mfs-liquidation'"), 'MfS liquidation must persist a true death outcome');
assert(html.includes("KARL MAUER IST TOT - FALL OFFEN"), 'true death needs a distinct end screen instead of Charite recovery');
assert(html.includes('Ein normales Vf=0 bleibt der schwere, aber überlebbare Zusammenbruch'), 'ordinary zero health must remain the recoverable collapse path');

const asciiStart = html.indexOf('function asciiToUmlaut(s)');
const asciiEnd = html.indexOf('\n}', asciiStart) + 2;
const gameOverStart = html.indexOf('function _abschlussTextMitUmlauten(value)');
const gameOverEnd = html.indexOf('function buildFallbackAbschlussProsa()', gameOverStart);
assert(asciiStart >= 0 && asciiEnd > asciiStart, 'cannot isolate ascii-to-umlaut helper');
assert(gameOverStart >= 0 && gameOverEnd > gameOverStart, 'cannot isolate game-over renderer');
const makeEndContext = (deathArt) => {
  const elements = {};
  const makeElement = () => ({ innerHTML: '', classList: { add: () => {}, remove: () => {} } });
  const context = {
    caseProgress: deathArt ? { gameOverTodArt: deathArt } : {},
    sceneCounter: 2,
    document: { getElementById: (id) => (elements[id] || (elements[id] = makeElement())) },
    clearSavedGame: () => {},
  };
  vm.createContext(context);
  vm.runInContext(
    html.slice(asciiStart, asciiEnd) + '\n' + html.slice(gameOverStart, gameOverEnd),
    context
  );
  context.showGameOver();
  return elements['game-over'].innerHTML;
};
const lethalEnd = makeEndContext('stasi-verhoer');
assert(lethalEnd.includes('KARL MAUER IST TOT'), 'lethal interrogation must not wake Karl in the Charite');
assert(!lethalEnd.includes('ZUSAMMENGEBROCHEN'), 'lethal interrogation must not use the recoverable collapse title');
const collapseEnd = makeEndContext('');
assert(collapseEnd.includes('ZUSAMMENGEBROCHEN - FALL OFFEN'), 'ordinary zero health must still use recoverable collapse');
assert(/am Leben|Aber er atmet|davongekommen/.test(collapseEnd), 'ordinary collapse must still state that Karl survived');
assert(collapseEnd.includes('hört'), 'recoverable collapse must render "hört" with umlaut');
assert(collapseEnd.includes('Später'), 'recoverable collapse must render "Später" with umlaut');
assert(collapseEnd.includes('Schädel'), 'recoverable collapse must render "Schädel" with umlaut');
assert(!/\b(?:hoert|Spaeter|Schaedel|Buero)\b/.test(collapseEnd), 'visible collapse ending must not leak ASCII umlaut spellings');
assert(html.includes('stasiCustodyScenesSince >= 3'), 'routine custody should allow release by the following morning');
assert(html.includes('caseProgress._custodyCountedScene !== custodySceneMark'), 'custody duration must count distinct scenes, not UI rerenders');
assert(html.includes('NOTFLUCHT ist der einzige sofortige Ausbruch'), 'custody prompt must distinguish escape from routine morning release');
assert(html.includes('const resetFolter = (opts.resetFolter !== undefined) ? opts.resetFolter : stateChanged;'), 'repeated custody detection must not reset interrogation progress');

assert(html.includes("const HUND_PREIS = 7;"), 'Rex must require a substantial exchange-value bundle');
assert(html.includes("const HUND_HEIMAT = 'Goldener Anker';"), 'Rex must remain tied to the Goldener Anker');
assert(html.includes("_istAnkerOrt({ name: engineCurrentLocation.name })"), 'Rex must also appear at legacy setup names such as Eckkneipe Zum Goldenen Anker');
assert(html.includes('caseProgress.hundDaWuerfel = harteLage || (Math.random() < 0.75);'), 'hard cases must guarantee Rex while lighter cases keep variation');
assert(html.includes('const krauseGruppenfall = !!(caseSetup'), 'the Krause multi-enemy case must guarantee access to Rex as a real alternative to Trude equipment');
assert.strictEqual((html.match(/barErlaubt: false/g) || []).length, 2, 'both Rex acquisition paths must reject a trivial cash purchase');
assert(html.includes("_hint: 'Tauschwert ' + HUND_PREIS + ' aus Ware · erst sammeln"), 'Rex action must preview its collection requirement');
assert(html.includes('Bei Trude und an anderen Orten kann Karl passende Ware besorgen.'), 'failed Rex payment must guide Karl toward preparation');
assert(html.includes("bar.textContent = 'Bar zahlen · ' + bargeldPreis + ' Ostmark';"), 'trade overlay needs a real cash alternative');
assert(html.includes("_geldZahle(bargeldPreis, 'ost', 'Tauschzahlung @ '"), 'cash trade must deduct persistent money');

for (const item of ['Stinkbombe im Blechmantel', 'Bündel Knallfrösche und Raketen', 'Gebrauchte Handschellen', 'Kurzer Gummiknüppel']) {
  assert(html.includes(item), 'Trude/tactical catalog misses ' + item);
}
assert(html.includes("verbrauchbar: false"), 'reusable control gear needs explicit persistence');
assert(html.includes("['werfen', 'werfen_fuesse', 'angreifen_mit', 'fesseln']"), 'confrontation consumption must understand handcuffs');

const cellPath = path.join(root, 'assets', 'scenes', 'vogt', 'hohenschoenhausen-zelle.png');
assert(fs.existsSync(cellPath), 'dedicated custody cell image is missing');
for (const releaseAsset of [
  'hohenschoenhausen-genslerstrasse.png',
  'hohenschoenhausen-genslerstrasse-day.png',
  'hohenschoenhausen-genslerstrasse-night.png',
]) {
  assert(fs.existsSync(path.join(root, 'assets', 'scenes', 'vogt', releaseAsset)),
    'custody release asset is missing: ' + releaseAsset);
}
const png = fs.readFileSync(cellPath);
assert.strictEqual(png.toString('ascii', 1, 4), 'PNG', 'custody cell asset is not a PNG');
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
assert(width >= 1200 && height >= 650, 'custody cell image is too small for the scene renderer');
assert(Math.abs((width / height) - (16 / 9)) < 0.08, 'custody cell image must retain the cinematic 16:9 frame');
assert(html.includes("place: 'MfS-Gewahrsam Hohenschoenhausen, Zelle 14'"), 'custody image needs a truthful interior location label');
assert(html.includes('abgewandtem, nicht erkennbarem Gesicht'), 'custody image contract must keep Karl anonymous');
assert(html.includes("name: 'Vor der MfS-Untersuchungshaftanstalt Hohenschoenhausen'"),
  'routine release must leave the cell for the real exterior scene');

console.log('CUSTODY_REX_ECONOMY_AUDIT_OK');
