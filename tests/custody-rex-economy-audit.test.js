const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { readWebpDimensions } = require('./image-format-utils');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1740 +ReputationCompareTruth'"), 'version constant is stale');
const dogPickupStart = html.indexOf('function _hundMitnehmenMitTausch(quelle)');
const dogPickupEnd = html.indexOf('// ============ Ende WACHHUND-Helper', dogPickupStart);
assert(dogPickupStart >= 0 && dogPickupEnd > dogPickupStart, 'cannot isolate the Rex pickup flow');
let rexExchangeCalls = 0;
let rexToast = null;
const rexReunionContext = {
  HUND_NAME: 'Rex',
  HUND_PREIS: 7,
  caseProgress: {
    hundInParty: false,
    hundEntschieden: 'aufgenommen',
    rexBeiFestnahmeGetrennt: true,
  },
  _hundInParty: () => rexReunionContext.caseProgress.hundInParty,
  _zeigeTauschZahlung: () => { rexExchangeCalls += 1; },
  saveGameState: () => {},
  showProgressToast: (...args) => { rexToast = args; },
  fxPartyJoin: () => {},
  renderImRaumAnzeige: () => {},
  renderOptions: () => {},
  currentScene: null,
  diag: () => {},
};
vm.createContext(rexReunionContext);
vm.runInContext(html.slice(dogPickupStart, dogPickupEnd), rexReunionContext);
assert.strictEqual(rexReunionContext._hundMitnehmenMitTausch('Haft-Wiederaufnahme'), true,
  'Rex must be recoverable after a custody separation');
assert.strictEqual(rexExchangeCalls, 0,
  'the original value-7 package pays for Rex for the whole case; custody may not charge it again');
assert.strictEqual(rexReunionContext.caseProgress.hundInParty, true,
  'the reunion must restore Rex to the real party state');
assert.strictEqual(rexReunionContext.caseProgress.rexBeiFestnahmeGetrennt, false,
  'the separation marker must clear after the visible reunion');
assert(rexToast && /wieder da/.test(rexToast[0]),
  'the reunion must be visible to the player instead of silently changing a flag');
assert(html.includes("const _getrennteNamen = _getrennt.concat(_rexGetrennt ? ['Rex'] : []);"),
  'custody entry prose must include Rex in the visible separation');
assert(html.includes('ohne einen zweiten Tausch auf dich wartet'),
  'custody release prose must explain exactly where Rex went and how to recover him');
assert(html.includes("text: _resolveIstEigenauftrag ? 'Eigen-Auftrag abschließen und Wahrheit festhalten.' : 'Fall abschließen und Auftraggeber informieren.'"),
  'resolve button copy must stay player-facing for external and self-assigned cases');
assert(html.includes('_enginePrompt: [_resolveText, _resolveTransitionPrompt, _resolvePhysicalTruth]'), 'resolve direction must preserve physical target truth');
assert(!html.includes('resolveOpt.text += narr'), 'director narration must not leak into resolve button text');
assert(html.includes('Roth kuendigt an, Marquardts Rolle getrennt zu pruefen'), 'Achterberg ending must preserve Marquardt consequence');
assert(html.includes('Er schiebt Achterbergs Digitalis-Überdosis auf einen Unfall, doch Otto Jahnke sah ihn unmittelbar vor dem Auftritt allein an der Tropfflasche hantieren'),
  'Achterberg core evidence must use the actual Tatzeit witness Otto Jahnke and not invent a murder confession');
assert(!html.includes('Egon Vossberg überführt: er hat Achterbergs Digitalis-Tropfen überdosiert, damit es wie Herzversagen aussieht'),
  'the rigid false-confession evidence copy must not return');
const moralStart = html.indexOf('function zeigeMoralWahl(resolveOpt)');
const moralEnd = html.indexOf('function zeigeAbschlussWahrheitswahl', moralStart);
const moralSource = html.slice(moralStart, moralEnd);
assert(moralSource.includes('_markPopupOpened()') && moralSource.includes('attachSafeTap(b, _moralWahlAusfuehren)'),
  'the moral overlay must block touch-through and require a fresh deliberate choice');
assert(moralSource.includes('MORAL-AUSGANG GEWAEHLT'),
  'the selected moral ending must be explicit in the manual-run export');
assert(html.includes("if (!earlyAbort && !(caseProgress && caseProgress.moralWahl === 'schweigegeld'))"),
  'a hush-money ending must never append the normal client-report fallback');
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

const caseSpecificOfficer = makeEncounterContext(true);
caseSpecificOfficer.caseProgress.activeConfrontation = {
  trigger: 'spawn',
  enemyName: 'Hauptmann Dietmar Krollwitz',
  enemyTag: 'STASI',
  enemyRole: 'MfS-Hauptmann',
  ort: 'Reichsbahndirektion'
};
assert.strictEqual(caseSpecificOfficer._stasiCustodyEntryVormerken('verlorener Widerstand gegen Krollwitz'), true,
  'losing resistance against a case-specific MfS officer must arm custody just like the central access encounter');
assert.strictEqual(caseSpecificOfficer.caseProgress.custodyForcedEntry, true,
  'case-specific MfS defeat must persist deterministic custody before narration');

// Wessel-live v1644: Nach sechs Hochrisiko-Szenen war der Zugriff intern
// forciert, ein normaler Reisebutton loeschte ihn aber vor der sichtbaren
// Einfuehrung. Der Beamte muss die Reise jetzt am Zielort abfangen.
const forcedTravel = makeEncounterContext(true);
const travellingEncounter = forcedTravel._stasiEncounterForceZugriff('sechs ignorierte MfS-Warnungen');
forcedTravel.engineCurrentLocation.name = 'Wessel-Wohnung';
const interceptedTravelPrompt = forcedTravel._stasiEncounterPrompt();
assert(interceptedTravelPrompt.includes('Oberleutnant Mertens'),
  'a forced access must remain in the next travel scene');
assert.strictEqual(travellingEncounter.location, 'Wessel-Wohnung',
  'a pending forced access must rebind to the travel destination instead of vanishing');
assert.strictEqual(forcedTravel._stasiEncounterConfirmIntroFromScene({
  szene: 'Vor der Wessel-Wohnung tritt Oberleutnant Mertens aus dem Treppenhaus und stellt Karl.',
  ort: 'Wessel-Wohnung'
}), true, 'the travel interception must become a visible playable confrontation');
assert.strictEqual(forcedTravel.caseProgress.activeConfrontation.trigger, 'stasi-encounter',
  'the intercepted travel scene must expose the red Stasi confrontation');

const releasedGrace = makeEncounterContext(true);
vm.runInContext('metaCustodyGracePeriod = 5', releasedGrace);
vm.runInContext('stasiTension = 5; stasiHighTensionStreak = 3; stasiMaxTensionStreak = 2;', releasedGrace);
assert.strictEqual(releasedGrace._stasiEncounterForceZugriff('unmittelbar nach Freilassung'), null,
  'no force path may recreate a Stasi access during the release grace period');
releasedGrace._stasiEncounterAdvance('ERMITTLUNG');
assert.strictEqual(releasedGrace.caseProgress.stasiEncounter, undefined,
  'ordinary investigation must not spawn an observation during the release grace period');
assert.strictEqual(releasedGrace.caseProgress.stasiEncounterEligibleScenes, 0,
  'release grace must not silently accumulate an immediate follow-up access');
assert.strictEqual(vm.runInContext('stasiTension', releasedGrace), 2,
  'release grace must heal maximum residual tension in an already advanced old save');
assert.strictEqual(vm.runInContext('stasiHighTensionStreak', releasedGrace), 0,
  'release grace must clear residual high-tension streaks');

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
steinFlow.engineCurrentLocation.name = 'Lehrter Gueterbahnhof';
const visibleFollowingPrompt = steinFlow._stasiEncounterPrompt();
assert(visibleFollowingPrompt.includes('Oberleutnant Mertens'),
  'an already recognized MfS observation must remain the same named tail after ordinary travel');
assert.strictEqual(steinEncounter.location, 'Lehrter Gueterbahnhof',
  'an observation may follow Karl, while later control/access phases remain location-bound');
steinFlow.sceneCounter += 1;
steinFlow._stasiEncounterAdvance('OFFENSIV');
assert.strictEqual(steinEncounter.phase, 'zugriff', 'an open provocation must escalate the introduced observation to access: ' + steinFlow.diagMessages.join(' | '));
assert.strictEqual(steinFlow.caseProgress.activeConfrontation.trigger, 'stasi-encounter', 'the escalated Stein access must be playable');
assert.strictEqual(steinFlow._stasiCustodyEntryVormerken('Audit: Karl geht mit'), true,
  'a visible access must be able to arm deterministic custody');
assert.strictEqual(steinFlow.caseProgress.custodyForcedEntry, true,
  'custody entry must be persisted before the narration request');

const blockedSteinFlow = makeEncounterContext(true);
blockedSteinFlow.sceneCounter = 3;
blockedSteinFlow._konfrontationAktiv = () => true;
blockedSteinFlow._stasiEncounterAdvance('OFFENSIV');
blockedSteinFlow.sceneCounter += 1;
blockedSteinFlow._stasiEncounterAdvance('OFFENSIV');
assert.strictEqual(blockedSteinFlow.caseProgress.stasiEncounter, undefined,
  'a case confrontation must never be overlaid with a second Stasi opponent');
assert.strictEqual(blockedSteinFlow.caseProgress.stasiEncounterEligibleScenes, 2,
  'political pressure must keep accumulating behind a case confrontation');
blockedSteinFlow._konfrontationAktiv = () => false;
blockedSteinFlow._stasiEncounterRoll = () => 0;
blockedSteinFlow.sceneCounter += 1;
blockedSteinFlow._stasiEncounterAdvance('ERMITTLUNG');
assert(blockedSteinFlow.caseProgress.stasiEncounter &&
  blockedSteinFlow.caseProgress.stasiEncounter.phase === 'beobachtung',
  'the next calm scene after a long confrontation must be able to start observation immediately');

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
assert(html.indexOf('_custodyVerhoerWahlAnwenden(pendingChosenOption);') <
  html.indexOf('_custodySceneTruthSichern(scene);'),
  'the selected interrogation action must be recorded before custody prose drift is repaired');
assert(/HAFTINDIZ in derselben Szene sichtbar erzählt/.test(html)
    && /Beim zweiten Lauschen verstehst du endlich einen vollständigen Satz/.test(html)
    && /caseProgress\.pendingCustodyIntelNarration = null/.test(html),
  'a newly earned custody clue must be narrated deterministically in the same playable custody scene');
assert(html.includes("caseProgress._custodyVerhoerAppliedScene === sceneKey"),
  'the early interrogation update needs a per-scene guard against double application');

const custodySetterStart = html.indexOf('function setCustodyState(newState, source, opts)');
const custodySetterEnd = html.indexOf('// v7.11.13: META-CUSTODY-RISIKO-COUNTER', custodySetterStart);
assert(custodySetterStart >= 0 && custodySetterEnd > custodySetterStart, 'cannot isolate central custody setter');
let encounterClears = 0;
const custodySetterContext = {
  karlInStasiCustody: false,
  engineCurrentLocation: { name: 'Reichsbahndirektion', sektor: 'Ost' },
  caseProgress: {},
  sceneCounter: 12,
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
assert.strictEqual(custodySetterContext.caseProgress.custodyEnteredAtScene, 12,
  'custody entry tracking must use the global engine scene counter');
custodySetterContext.setCustodyState(false, 'Audit-Freilassung');
assert.strictEqual(custodySetterContext.engineCurrentLocation.name, 'Vor der MfS-Untersuchungshaftanstalt Hohenschoenhausen', 'release must use a real exterior location');
assert.strictEqual(custodySetterContext.caseProgress.custodyReleaseSource, 'Audit-Freilassung', 'release source must remain traceable');
assert.strictEqual(custodySetterContext.caseProgress.custodyReleasedAtScene, 12,
  'custody release tracking must not depend on renderLog local variables');
assert.strictEqual(encounterClears, 1, 'release must close the active Stasi encounter');

const custodyTruthStart = html.indexOf('function _custodySceneTruthSichern(scene)');
const custodyTruthEnd = html.indexOf('// v7.11.13: META-CUSTODY-RISIKO-COUNTER', custodyTruthStart);
assert(custodyTruthStart >= 0 && custodyTruthEnd > custodyTruthStart, 'cannot isolate custody prose truth guard');
const custodyTruthContext = {
  karlInStasiCustody: true,
  engineCurrentLocation: { name: 'Cafe im Westen', sektor: 'West' },
  caseProgress: {
    custodyVerhoer: { runden: 2, druck: 2, kooperation: 0, verweigerung: 1, letzteAktion: 'SCHWEIGEN' },
    forceCustodyNextScene: true,
    pendingCustodyConfirm: true,
    custodyForcedEntry: true,
    custodyEntryReason: 'stale',
    stasiPflichtSeitScene: 12,
    stasiEncounterEligibleScenes: 4
  },
  custodyLocked: true,
  metaCustodyGracePeriod: 0,
  stasiTension: 5,
  stasiHighTensionStreak: 3,
  stasiMaxTensionStreak: 2,
  pendingForcedCustodyArrest: { source: 'stale' },
  _stasiEncounterClear: (reason, cooldown) => {
    custodyTruthContext.lastEncounterClear = { reason, cooldown };
  },
  detectStasiCustody: () => false,
  detectStasiRelease: () => false,
  lastFullScene: '',
  recentTexts: ['Karl steht ploetzlich frei im Cafe.'],
  storySummaries: ['Karl ist frei.'],
  _aktTageszeitName: () => 'NACHT',
  normForMatch: (value) => String(value || '')
    .toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ').trim(),
  diag: () => {}
};
vm.createContext(custodyTruthContext);
vm.runInContext('_custodyVerhoerState = function () { return caseProgress.custodyVerhoer; };', custodyTruthContext);
vm.runInContext(html.slice(custodyTruthStart, custodyTruthEnd), custodyTruthContext);
vm.runInContext('metaCustodyGracePeriod = 0;', custodyTruthContext);
const driftScene = { szene: 'Karl steht ploetzlich frei im Cafe.', ort: 'Cafe im Westen', gewahrsam: false, personenImRaum: ['Zeuge'] };
assert.strictEqual(custodyTruthContext._custodySceneTruthSichern(driftScene), true,
  'a model scene that drifts out of custody must be replaced, not release Karl');
assert(driftScene.szene.length > 500 && driftScene.szene.includes('Zelle 14'),
  'the custody fallback must be a full prose scene rather than a dry engine instruction');
assert.strictEqual(driftScene.gewahrsam, true, 'custody truth guard must preserve the state flag');
assert(driftScene.ort.includes('Hohenschoenhausen'), 'custody truth guard must preserve the physical location');
assert.deepStrictEqual(Array.from(driftScene.personenImRaum), [], 'ordinary case NPCs must not leak into the cell UI');
custodyTruthContext.pendingCategoryChoice = 'SCHLAFEN';
assert.strictEqual(custodyTruthContext._custodySchlafFreilassungLaeuft(), true,
  'confirmed sleep in custody must be recognized before the normal custody guard runs');
const contradictoryReleaseScene = {
  szene: 'Du bleibst weiterhin in Zelle 14. Die Zellentuer bleibt verriegelt.',
  ort: 'MfS-Untersuchungshaftanstalt Hohenschoenhausen, Zelle 14',
  gewahrsam: true,
  personenImRaum: ['Wachmann']
};
assert.strictEqual(custodyTruthContext._custodyReleaseSceneTruthSichern(contradictoryReleaseScene), true,
  'a contradictory sleep-release scene must receive a complete engine-authored release');
assert(contradictoryReleaseScene.szene.length > 500
    && contradictoryReleaseScene.szene.includes('Du bist frei'),
  'release fallback must be full prose and explicitly state Karl is free');
assert(contradictoryReleaseScene.szene.includes('Berliner Nachtluft')
    && !contradictoryReleaseScene.szene.includes('Morgenlicht'),
  'release fallback must match the actual engine time instead of hardcoding morning');
assert.strictEqual(contradictoryReleaseScene.gewahrsam, false,
  'release truth guard must clear the visible custody flag');
assert.strictEqual(contradictoryReleaseScene.ort,
  'Vor der MfS-Untersuchungshaftanstalt Hohenschoenhausen',
  'release truth guard must move the scene outside the prison');
assert.deepStrictEqual(Array.from(contradictoryReleaseScene.personenImRaum), [],
  'custody NPCs must not leak into the released scene UI');
const skeletalReleaseScene = {
  szene: 'Du wirst freigelassen.',
  ort: 'MfS-Untersuchungshaftanstalt Hohenschoenhausen, Zelle 14',
  gewahrsam: true,
  personenImRaum: []
};
assert.strictEqual(custodyTruthContext._custodyReleaseSceneTruthSichern(skeletalReleaseScene), true,
  'a one-line technical release must be expanded into proper scene prose');
assert(skeletalReleaseScene.szene.length > 500 && skeletalReleaseScene.szene.includes('Du bist frei'),
  'release guard must never leave a dry one-line AI instruction as the complete scene');
custodyTruthContext.karlInStasiCustody = true;
custodyTruthContext.engineCurrentLocation = {
  name: 'MfS-Untersuchungshaftanstalt Hohenschoenhausen, Zelle 14',
  sektor: 'Ost'
};
const staleSavedReleaseScene = {
  szene: contradictoryReleaseScene.szene,
  ort: 'Vor der MfS-Untersuchungshaftanstalt Hohenschoenhausen',
  personenImRaum: ['Hauptmann Klaus Berner']
};
assert.strictEqual(custodyTruthContext._custodyReleaseStateTruthSichern(staleSavedReleaseScene, 'audit-restore'), true,
  'an old saved release without gewahrsam:false must still be recognized and repaired');
assert.strictEqual(custodyTruthContext.karlInStasiCustody, false,
  'restoring an explicit release must clear the stale global custody state before rendering');
assert.deepStrictEqual(Array.from(staleSavedReleaseScene.personenImRaum), [],
  'restoring an explicit release must remove stale prison personnel from the visible roster');
assert.strictEqual(custodyTruthContext.engineCurrentLocation.releasedFromCustody, true,
  'restoring an explicit release must align the engine location with the exterior scene');
assert.strictEqual(vm.runInContext('metaCustodyGracePeriod', custodyTruthContext), 5,
  'restoring a release must establish five genuinely free follow-up scenes');
assert.strictEqual(custodyTruthContext.stasiTension, 2,
  'restoring a release must lower stale maximum Stasi tension');
assert.strictEqual(custodyTruthContext.stasiHighTensionStreak, 0,
  'restoring a release must clear the high-tension streak');
assert.strictEqual(custodyTruthContext.pendingForcedCustodyArrest, null,
  'restoring a release must clear a stale forced arrest');
assert.deepStrictEqual(custodyTruthContext.lastEncounterClear,
  { reason: 'Freilassung aus MfS-Gewahrsam', cooldown: 5 },
  'release repair must clear encounters with the full cooldown');
assert.strictEqual(custodyTruthContext.caseProgress.stasiPflichtSeitScene, 0,
  'release repair must clear the prompt-level compulsory-access marker');
assert(html.includes('STASI-NACHWIRKUNG NACH FREILASSUNG')
    && html.includes('KEIN aktiver Beobachter, KEINE Kontrolle, KEIN Zugriff')
    && html.includes('Keine Maenner, die Karl verfolgen, abfangen, an seiner Tuer warten oder ein Schloss aufbrechen'),
  'scene prompting must explicitly keep the grace period atmospheric');

assert(html.includes("key: 'mitgehen'") && html.includes("label: 'Mitgehen'"),
  'a visible MfS access needs an explicit, honest custody choice');
assert(html.includes("_stasiCustodyEntryVormerken('Karl unterliegt beim Widerstand gegen den MfS-Zugriff')"),
  'failed resistance against a visible MfS access must lead into custody');
assert(!html.includes('if (false && _legacyForcedCustodyEntry)'),
  'the deterministic, engine-authored custody entry must not remain disabled');
assert(html.includes("if (/\\bsahnetorte\\b/.test(_custodyAktion))"),
  'a failed cake action must remain visible before the deterministic MfS arrest prose');
assert(html.includes('Für einen absurden Atemzug stehen Sahne und strenge Amtsmiene nebeneinander'),
  'custody entry needs the chosen slapstick beat instead of silently erasing the cake');
assert(html.includes("else if (/\\b(?:walther|ppk|pistole)\\b/.test(_custodyAktion))"),
  'a failed PPK action must retain its non-terminal distance beat before arrest');
assert(!html.includes("setCustodyState(false, 'ki-signal-frei')"),
  'a single model boolean must never silently release Karl from an active custody episode');
assert(!html.includes("setCustodyState(false, 'text-detected-release')"),
  'a free-form model sentence must never silently release Karl from an active custody episode');

const interactionModeStart = html.indexOf('function deriveInteractionMode()');
const interactionModeEnd = html.indexOf('const SHARED_SCENE_IMAGES', interactionModeStart);
const interactionModeSource = html.slice(interactionModeStart, interactionModeEnd);
assert(!/chooseOptionInFlight[^;]*return 'locked'/.test(interactionModeSource),
  'the API in-flight lock must not hide the custody menu during the arrest-entry render');
assert(interactionModeSource.indexOf("return 'custody'") >= 0,
  'active custody must remain a first-class interaction mode');

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
const endingNormalizeEnd = html.indexOf('function showGameOver()', gameOverStart);
const endingNormalizeContext = {};
vm.createContext(endingNormalizeContext);
vm.runInContext(
  html.slice(asciiStart, asciiEnd) + '\n' + html.slice(gameOverStart, endingNormalizeEnd),
  endingNormalizeContext
);
assert.strictEqual(
  endingNormalizeContext._abschlussTextMitUmlauten('Der Klient erfaehrt den uebermittelten Bericht. Honorar gekuerzt.'),
  'Der Klient erfährt den übermittelten Bericht. Honorar gekürzt.',
  'shared ending normalization must repair the reported win-screen umlaut leaks'
);
assert(html.includes('const _abschlussAnzeige = function(value, escape)'),
  'the complete win screen must pass through the shared display normalization before DOM commit');
assert(html.includes('stasiCustodyScenesSince >= 3'), 'routine custody should allow release by the following morning');
assert(html.includes('caseProgress._custodyCountedScene !== custodySceneMark'), 'custody duration must count distinct scenes, not UI rerenders');
assert(html.includes('NOTFLUCHT ist der einzige sofortige Ausbruch'), 'custody prompt must distinguish escape from routine morning release');
assert(html.includes('const resetFolter = (opts.resetFolter !== undefined) ? opts.resetFolter : stateChanged;'), 'repeated custody detection must not reset interrogation progress');
assert(html.includes("(_getrennteNamen.length > 1 ? 'sie' : _getrennteNamen[0])"),
  'a single named companion separated during arrest must not be reduced to an anonymous person');

assert(html.includes("const HUND_PREIS = 7;"), 'Rex must require a substantial exchange-value bundle');
assert(html.includes("const HUND_HEIMAT = 'Goldener Anker';"), 'Rex must remain tied to the Goldener Anker');
assert(html.includes("_istAnkerOrt({ name: engineCurrentLocation.name })"), 'Rex must also appear at legacy setup names such as Eckkneipe Zum Goldenen Anker');
assert(html.includes('caseProgress.hundDaWuerfel = harteLage || (Math.random() < 0.75);'), 'hard cases must guarantee Rex while lighter cases keep variation');
assert(html.includes('const krauseGruppenfall = !!(caseSetup'), 'the Krause multi-enemy case must guarantee access to Rex as a real alternative to Trude equipment');
assert((html.match(/barErlaubt: false/g) || []).length >= 2, 'every Rex acquisition path must reject a trivial cash purchase');
assert(html.includes("_hint: 'Tauschwert ' + HUND_PREIS + ' aus Ware · erst sammeln"), 'Rex action must preview its collection requirement');
assert(html.includes('Bei Trude und an anderen Orten kann Karl passende Ware besorgen.'), 'failed Rex payment must guide Karl toward preparation');
assert(html.includes("add('hund_mitnehmen', 'Rex als Begleitung ausleihen · Tauschwert ' + HUND_PREIS)"),
  'the Haupt-UI must offer Rex as a companion instead of generating social dialogue');
assert(html.includes("verb === 'hund_mitnehmen'") && html.includes("_hundMitnehmenMitTausch('Haupt-UI')"),
  'the Haupt-UI Rex action must execute the exchange-backed companion path');
const trudeStockStart = html.indexOf('function _trudeSortimentKeys()');
const trudeStockEnd = html.indexOf('// v7.12.680:', trudeStockStart);
assert(trudeStockStart >= 0 && trudeStockEnd > trudeStockStart, 'cannot isolate Trude stock rotation');
const makeTrudeStock = (rolls) => {
  let index = 0;
  const context = {
    caseProgress: {},
    TRUDE_SORTIMENT_PREISE: {
      korn: 1, bohnenkaffee: 3, west_zigaretten: 3, stinkbombe: 2,
      feuerwerkspaket: 3, handschellen: 3, schlagstock: 3
    },
    Math: { random: () => rolls[index++ % rolls.length], floor: Math.floor },
  };
  vm.createContext(context);
  vm.runInContext(html.slice(trudeStockStart, trudeStockEnd), context);
  return { first: Array.from(context._trudeSortimentKeys()), second: Array.from(context._trudeSortimentKeys()) };
};
const trudeStockA = makeTrudeStock([0.1, 0.1, 0.1]);
const trudeStockB = makeTrudeStock([0.9, 0.9, 0.9]);
assert.deepStrictEqual(trudeStockA.first, trudeStockA.second, 'Trude stock must stay stable inside one investigation');
assert.notDeepStrictEqual(trudeStockA.first, trudeStockB.first, 'Trude stock must vary between investigations');
assert.strictEqual(trudeStockA.first.length, 4, 'Trude should offer a compact four-item rotation, not the full catalog');
assert(html.includes("if (_istTrudeSortiment && (k === 'trude' || k === 'imbiss')) continue;"),
  'Trude stock must not merge back into both static keyword catalogs');
assert(html.includes("bar.textContent = 'Bar zahlen · ' + bargeldPreis + ' Ostmark';"), 'trade overlay needs a real cash alternative');
assert(html.includes("_geldZahle(bargeldPreis, 'ost', 'Tauschzahlung @ '"), 'cash trade must deduct persistent money');

for (const item of ['Stinkbombe im Blechmantel', 'Bündel Knallfrösche und Raketen', 'Gebrauchte Handschellen', 'Kurzer Gummiknüppel']) {
  assert(html.includes(item), 'Trude/tactical catalog misses ' + item);
}
assert(html.includes("verbrauchbar: false"), 'reusable control gear needs explicit persistence');
assert(html.includes("['werfen', 'werfen_fuesse', 'angreifen_mit', 'fesseln']"), 'confrontation consumption must understand handcuffs');

const cellPath = path.join(root, 'assets', 'scenes', 'vogt', 'hohenschoenhausen-zelle.webp');
assert(fs.existsSync(cellPath), 'dedicated custody cell image is missing');
for (const releaseAsset of [
  'hohenschoenhausen-genslerstrasse.webp',
  'hohenschoenhausen-genslerstrasse-day.webp',
  'hohenschoenhausen-genslerstrasse-night.webp',
]) {
  assert(fs.existsSync(path.join(root, 'assets', 'scenes', 'vogt', releaseAsset)),
    'custody release asset is missing: ' + releaseAsset);
}
const { width, height } = readWebpDimensions(cellPath);
assert(width >= 1200 && height >= 650, 'custody cell image is too small for the scene renderer');
assert(Math.abs((width / height) - (16 / 9)) < 0.08, 'custody cell image must retain the cinematic 16:9 frame');
assert(html.includes("place: 'MfS-Gewahrsam Hohenschoenhausen, Zelle 14'"), 'custody image needs a truthful interior location label');
assert(html.includes('abgewandtem, nicht erkennbarem Gesicht'), 'custody image contract must keep Karl anonymous');
assert(html.includes("name: 'Vor der MfS-Untersuchungshaftanstalt Hohenschoenhausen'"),
  'routine release must leave the cell for the real exterior scene');
assert(html.includes('function _custodySchlafFreilassungLaeuft()'),
  'confirmed custody sleep needs an explicit transition guard before normal custody processing');
assert(html.includes('karlInStasiCustody && !_custodySchlafExitNow && typeof _custodySceneTruthSichern'),
  'custody prose guard must not overwrite the explicit sleep-release scene');
assert(html.includes('if (karlInStasiCustody && !_custodySchlafExitNow)'),
  'custody interrogation/torture processing must skip the explicit release transition');
assert(html.includes('function _custodyReleaseSceneTruthSichern(scene)'),
  'sleep release needs a dedicated prose/location/UI truth guard');
assert(html.indexOf("_custodyReleaseSceneTruthSichern(scene);")
    > html.indexOf("setCustodyState(false, 'schlaf-freilassung');"),
  'release truth guard must run after custody state is cleared');
assert(html.includes("scene.ort = releaseOrt;")
    && html.includes("scene.gewahrsam = false;")
    && html.includes("releasedFromCustody: true"),
  'release truth guard must align scene location, custody flag, and engine location');
assert(html.includes("const explicitReleaseScene = (typeof _custodyReleaseSceneErkennbar === 'function')")
    && html.includes('&& !explicitReleaseScene)'),
  'rendering a release scene must not re-enable custody from retrospective prison prose');
assert(html.includes('const istFreilassungsSzene = !!(scene && scene.gewahrsam === false')
    || html.includes("const istFreilassungsSzene = (typeof _custodyReleaseSceneErkennbar === 'function'"),
  'released exterior scenes must use the empty base image instead of a stale officer presence variant');
assert(html.includes("&& _custodyReleaseSceneErkennbar((typeof currentScene !== 'undefined') ? currentScene : null)) return [];"),
  'the people roster must not rematerialize prison personnel during an explicit release');
assert(html.includes('// v7.12.1651: ABSOLUT LETZTE Freilassungs-Schranke vor dem Personenmodell.')
    && html.includes('Spuren und Inventar')
    && html.includes('_np = [];'),
  'the unified target builder must clear stale cast injectors after all person sources have run');
assert(html.includes("_custodyReleaseStateTruthSichern(currentScene, 'restore');"),
  'saved release truth must be repaired before header, image, and options are restored');
assert(html.includes('const istGewahrsam = !istFreilassungsSzene && ('),
  'the custody cell image must be impossible in an explicit release scene');
assert(html.includes('const CUSTODY_RELEASE_SCENE_IMAGE = {')
    && html.includes("file: 'hohenschoenhausen-genslerstrasse.webp'")
    && html.includes('? CUSTODY_RELEASE_SCENE_IMAGE'),
  'an explicit release scene must render the real Hohenschoenhausen exterior instead of hiding the image');

console.log('CUSTODY_REX_ECONOMY_AUDIT_OK');
