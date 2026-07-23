const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const helperStart = html.indexOf('function _physischesFallzielStatus(');
const helperEnd = html.indexOf('function getNpcsAtCurrentLocation(', helperStart);
assert(helperStart >= 0 && helperEnd > helperStart, 'physical target helper block missing');

const targetContext = {
  caseSetup: {
    targetResolution: {
      mode: 'physical',
      npc: 'konstantin_wegener',
      location: 'Lagerhalle an der Spree',
      abStage: 4,
      rescueRequired: true,
      guard: 'lothars_bewacher',
      deliveryRequired: true,
      safeLocation: 'Karls Opel Olympia',
      safeLocations: ['Wegener-Wohnung', 'Volkspolizei-Revier Hans-Beimler-Strasse'],
      handoffs: {
        client: {
          location: 'Wegener-Wohnung',
          name: 'Helga Wegener',
          label: 'Zu Helga bringen'
        },
        police: {
          location: 'Volkspolizei-Revier Hans-Beimler-Strasse',
          name: 'Volkspolizei',
          label: 'Bei der Polizei schuetzen',
          notifyClient: 'Helga Wegener'
        }
      },
      visualStates: {
        rescuedAtTarget: {
          file: 'lagerhalle-spree-gerettet.webp',
          dayFile: 'lagerhalle-spree-gerettet-day.webp',
          nightFile: 'lagerhalle-spree-gerettet-night.webp',
          root: 'assets/scenes/wegener/',
          place: 'Lagerhalle an der Spree'
        }
      }
    }
  },
  caseProgress: {
    stage: 3,
    zielpersonGefunden: false,
    zielpersonGeborgen: false,
    zielpersonTransportStatus: '',
    zielpersonInBegleitung: false,
    zielpersonAnKlientGemeldet: false,
    gefundeneIndizIds: ['lothar_schluessel']
  },
  alleDefiniertenIndizien: () => [{ id: 'lothar_schluessel', stage: 4 }],
  _resolveNpcIdentity: () => ({ id: 'konstantin_wegener', name: 'Konstantin Wegener' }),
  _gegnerBezwungen: () => false,
  getNpcsAtCurrentLocation: () => [{ id: 'lothars_bewacher', name: 'Erwin Kratz' }],
  normForMatch: (value) => String(value || '').toLowerCase().trim()
};
vm.createContext(targetContext);
vm.runInContext(html.slice(helperStart, helperEnd), targetContext);

const status = targetContext._physischesFallzielStatus();
assert(status, 'Wegener target must unlock from its found stage-4 clue while case stage stays 3');
assert.strictEqual(status.npcName, 'Konstantin Wegener');
assert.strictEqual(status.location, 'Lagerhalle an der Spree');
assert.strictEqual(targetContext.caseProgress.stage, 3, 'target unlock must not solve the case prematurely');
assert.strictEqual(targetContext._physischesFallzielBlockiertAbschluss(), true,
  'a configured physical target must block completion before Karl has even reached it');
assert.strictEqual(targetContext._physischesFallzielNpcFreigeschaltet(
  { id: 'konstantin_wegener', abStage: 4 }, 'Lagerhalle an der Spree'
), true, 'target NPC must become present at the configured target location');
assert.strictEqual(targetContext._physischesFallzielNpcFreigeschaltet(
  { id: 'konstantin_wegener', abStage: 4 }, 'Eckkneipe Zum Goldenen Anker'
), false, 'target NPC must not appear at another location');
targetContext.caseProgress.zielpersonGefunden = true;
assert(targetContext._physischesFallzielStatus(), 'found target must remain active while physical rescue is open');
assert.strictEqual(targetContext._physischesFallzielIstGeborgen(), false, 'finding a bound target must not count as rescue');
assert.strictEqual(targetContext._physischesFallzielBewacherOffen(), true, 'configured guard must block rescue while free');
targetContext._npcZustandIstEntfernt = (npc) => String((npc && (npc.id || npc.name)) || npc || '').includes('lothars_bewacher');
assert.strictEqual(targetContext._physischesFallzielBewacherOffen(), false, 'a guard handed to police must never block target rescue');
delete targetContext._npcZustandIstEntfernt;
targetContext.caseProgress.zielpersonGeborgen = true;
targetContext.caseProgress.zielpersonTransportStatus = 'am_ausgang';
assert(targetContext._physischesFallzielStatus(), 'freed target must remain active until transport starts');
assert.strictEqual(targetContext._physischesFallzielIstGeborgen(), false, 'freeing alone must not complete a delivery rescue');
targetContext.caseProgress.zielpersonInBegleitung = true;
assert.strictEqual(targetContext._physischesFallzielStatus().transportBereit, true,
  'active accompaniment must count as transport-ready even for an old am_ausgang save state');
targetContext.caseProgress.zielpersonInBegleitung = false;
targetContext.caseProgress.zielpersonTransportStatus = 'im_opel';
targetContext.caseProgress.zielpersonInBegleitung = true;
const transportStatus = targetContext._physischesFallzielStatus();
assert(transportStatus && transportStatus.lieferungOffen, 'target in the Opel must expose the open delivery state');
assert.deepStrictEqual(Array.from(transportStatus.safeLocations), ['Wegener-Wohnung', 'Volkspolizei-Revier Hans-Beimler-Strasse']);
assert.strictEqual(transportStatus.handoffs.client.location, 'Wegener-Wohnung');
assert.strictEqual(transportStatus.handoffs.police.location, 'Volkspolizei-Revier Hans-Beimler-Strasse');
assert.strictEqual(targetContext._physischesFallzielIstGeborgen(), false, 'target in the Opel is not safely handed over yet');
targetContext.caseProgress.zielpersonTransportStatus = 'bei_polizei';
targetContext.caseProgress.zielpersonInBegleitung = false;
assert.strictEqual(targetContext._physischesFallzielIstGeborgen(), false, 'police handoff needs client notification');
targetContext.caseProgress.zielpersonAnKlientGemeldet = true;
assert.strictEqual(targetContext._physischesFallzielStatus(), null, 'completed police handoff must close the target state');
assert.strictEqual(targetContext._physischesFallzielIstGeborgen(), true, 'safe police handoff plus notification must unlock completion');
assert.strictEqual(targetContext._physischesFallzielBlockiertAbschluss(), false,
  'completed rescue and handoff must release the case-completion gate');

targetContext.caseProgress.zielpersonGefunden = false;
targetContext.caseProgress.zielpersonGeborgen = false;
targetContext.caseProgress.zielpersonTransportStatus = '';
targetContext.caseProgress.zielpersonAnKlientGemeldet = false;
targetContext.caseProgress.gefundeneIndizIds = [];
assert.strictEqual(targetContext._physischesFallzielStatus(), null, 'target must remain hidden before its reveal clue');

assert(html.includes("art: 'fallziel_reise'"), 'director must route toward a revealed physical target');
assert(html.includes("status: 'fallziel'"), 'main UI must expose a physical target thread');
assert(html.includes("◆ Fallziel:"), 'map popup must label the physical target');
assert(html.includes("var fallzielStatus = (typeof _physischesFallzielStatus === 'function')"), 'map data must derive the target marker from engine truth');
assert(html.includes("add('befreien', 'Befreie')"), 'main UI must expose an explicit rescue action');
assert(html.includes("id: 'HAUPTUI_ZIELPERSON_BEFREIEN'"), 'rescue action must have a dedicated engine scene');
assert(html.includes("key: 'ziel_zum_opel', label: 'Zum Opel bringen'"), 'freed target needs an explicit Opel transport action');
assert(html.includes("key: 'ziel_zum_klienten'"), 'target needs a configured client handoff');
assert(html.includes("key: 'ziel_zur_polizei'"), 'target needs a configured police protection route');
assert(html.includes("'Zielperson noch aufsuchen und befreien'"), 'case completion must explain an unreached physical target');
assert(html.includes("resolveLockReason = 'Zielperson noch befreien'"), 'case completion must explain an open physical rescue');
assert(html.includes("resolveLockReason = 'Zielperson noch zum Opel bringen'"), 'completion lock must explain the transport step');
assert(html.includes("resolveLockReason = 'Zielperson noch sicher übergeben'"), 'completion lock must explain the handoff step');
assert(html.includes('◆ Rettungsziel:'), 'map must label both safe handoff destinations');
assert(html.includes('resolution.visualStates'), 'rescued scene visuals must come from the active case setup');
assert(html.includes('rescuedAtTarget'), 'rescued scene visuals need an explicit state key');

const introStart = html.indexOf('const INTRO_VARIANTS = [');
const introEnd = html.indexOf('\n];', introStart);
assert(introStart >= 0 && introEnd > introStart, 'case setup block missing');
const setupContext = { INTRO_REQUIREMENTS: '' };
vm.createContext(setupContext);
vm.runInContext(html.slice(introStart, introEnd + 3).replace('const INTRO_VARIANTS =', 'INTRO_VARIANTS ='), setupContext);
for (const variant of Array.from(setupContext.INTRO_VARIANTS)) {
  const setup = variant && variant.setup;
  const resolution = setup && setup.targetResolution;
  if (!resolution || resolution.mode !== 'physical') continue;
  const clues = Array.from(setup.locations || []).flatMap((location) => Array.from(location.indizien || []));
  assert(clues.some((clue) => clue && typeof clue.stage === 'number' && clue.stage >= resolution.abStage),
    `${setup.opfer || setup.klient}: physical target has no obtainable reveal clue`);
  const targetLocation = Array.from(setup.locations || []).find((location) => location.name === resolution.location);
  assert(targetLocation, `${setup.opfer || setup.klient}: physical target location is missing`);
  if (resolution.rescueRequired) {
    const castIds = new Set(Array.from(setup.setupCast || []).map((npc) => npc && npc.id).filter(Boolean));
    assert(resolution.guard && castIds.has(resolution.guard),
      `${setup.opfer || setup.klient}: rescue guard is missing from setupCast`);
    assert(Array.from(targetLocation.npcs || []).some((npc) => npc && npc.id === resolution.guard),
      `${setup.opfer || setup.klient}: rescue guard is not guaranteed at the target location`);
    const visual = resolution.visualStates && resolution.visualStates.rescuedAtTarget;
    assert(visual && visual.file && visual.dayFile && visual.nightFile && visual.root,
      `${setup.opfer || setup.klient}: rescued scene visual is incomplete`);
    for (const file of [visual.file, visual.dayFile, visual.nightFile]) {
      assert(fs.existsSync(path.join(__dirname, '..', visual.root, file)),
        `${setup.opfer || setup.klient}: rescued scene asset is missing: ${visual.root}${file}`);
    }
  }
  if (resolution.deliveryRequired) {
    const destinations = Object.values(resolution.handoffs || {});
    assert(destinations.length >= 1, `${setup.opfer || setup.klient}: delivery target has no handoff`);
    for (const destination of destinations) {
      assert(destination && destination.location,
        `${setup.opfer || setup.klient}: handoff destination has no location`);
      assert(Array.from(setup.locations || []).some((location) => location.name === destination.location),
        `${setup.opfer || setup.klient}: handoff location is missing: ${destination.location}`);
      assert(Array.from(resolution.safeLocations || []).includes(destination.location),
        `${setup.opfer || setup.klient}: handoff location is absent from safeLocations`);
    }
  }
}

const threadStart = html.indexOf('function _hauptuiGenerischeFaeden()');
const threadEnd = html.indexOf('\nfunction ', threadStart + 20);
assert(threadStart >= 0 && threadEnd > threadStart, 'generic thread renderer is missing');
const threadSource = html.slice(threadStart, threadEnd);
assert(threadSource.includes('fallziel.handoffs'),
  'physical-target thread must use case-specific handoff destinations');
assert(!threadSource.includes('Wegener-Wohnung'),
  'generic physical-target thread must not hardcode Wegener locations');

const resetButtons = Array.from(html.matchAll(/<button[^>]+>[^<]*(?:Neue Ermittlung|Ermittlung neu beginnen|Neuer Fall, neues Gl)/g));
assert(resetButtons.length >= 6, 'expected all restart buttons in source');
for (const match of resetButtons) {
  assert(match[0].includes('ontouchend="return startNewInvestigation(event,'), 'restart button lacks touch-safe handler');
  assert(match[0].includes('onclick="return startNewInvestigation(event,'), 'restart button lacks click-safe handler');
}
assert(html.includes('if (now - _newInvestigationTapAt < 800) return false;'), 'restart handler must suppress synthetic mobile double clicks');
assert(html.includes("function _abschlussTextMitUmlauten(value)"), 'end screens need a shared display normalization helper');
assert(html.includes("const _goAnzeige = _abschlussTextMitUmlauten(_go);"), 'recoverable game-over copy must normalize umlauts');
assert(html.includes("const _ueberlebenAnzeige = _abschlussTextMitUmlauten(_ueberlebenInfo);"), 'game-over account copy must normalize umlauts');
assert(html.includes("[/\\bSpaeter\\b/g, 'Später']"), 'display normalizer must handle capitalized Spaeter');
const umlautStart = html.indexOf('function asciiToUmlaut(s)');
const umlautEnd = html.indexOf('\n}', umlautStart) + 2;
const endingStart = html.indexOf('function _abschlussTextMitUmlauten(value)');
const endingEnd = html.indexOf('\n}', endingStart) + 2;
const endingContext = {};
vm.createContext(endingContext);
vm.runInContext(html.slice(umlautStart, umlautEnd) + '\n' + html.slice(endingStart, endingEnd), endingContext);
assert.strictEqual(
  endingContext._abschlussTextMitUmlauten('Karl hoert spaeter: Spaeter ein brummender Schaedel. Das Buero bleibt zu.'),
  'Karl hört später: Später ein brummender Schädel. Das Büro bleibt zu.',
  'game-over display normalization must repair every reported ASCII umlaut'
);

console.log('PHYSICAL_TARGET_ENDGAME_OK');
