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
      safeLocations: ['Wegener-Wohnung', 'Volkspolizei-Revier Hans-Beimler-Strasse']
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
targetContext.caseProgress.zielpersonGeborgen = true;
targetContext.caseProgress.zielpersonTransportStatus = 'am_hallenausgang';
assert(targetContext._physischesFallzielStatus(), 'freed target must remain active until transport starts');
assert.strictEqual(targetContext._physischesFallzielIstGeborgen(), false, 'freeing alone must not complete a delivery rescue');
targetContext.caseProgress.zielpersonTransportStatus = 'im_opel';
targetContext.caseProgress.zielpersonInBegleitung = true;
const transportStatus = targetContext._physischesFallzielStatus();
assert(transportStatus && transportStatus.lieferungOffen, 'target in the Opel must expose the open delivery state');
assert.deepStrictEqual(Array.from(transportStatus.safeLocations), ['Wegener-Wohnung', 'Volkspolizei-Revier Hans-Beimler-Strasse']);
assert.strictEqual(targetContext._physischesFallzielIstGeborgen(), false, 'target in the Opel is not safely handed over yet');
targetContext.caseProgress.zielpersonTransportStatus = 'bei_polizei';
targetContext.caseProgress.zielpersonInBegleitung = false;
assert.strictEqual(targetContext._physischesFallzielIstGeborgen(), false, 'police handoff needs client notification');
targetContext.caseProgress.zielpersonAnKlientGemeldet = true;
assert.strictEqual(targetContext._physischesFallzielStatus(), null, 'completed police handoff must close the target state');
assert.strictEqual(targetContext._physischesFallzielIstGeborgen(), true, 'safe police handoff plus notification must unlock completion');

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
assert(html.includes("key: 'ziel_zu_helga', label: 'Zu Helga bringen'"), 'target needs a direct client handoff');
assert(html.includes("key: 'ziel_zur_vp', label: 'Bei der Polizei schuetzen'"), 'target needs a police protection route');
assert(html.includes("resolveLockReason = 'Zielperson noch befreien'"), 'case completion must explain an open physical rescue');
assert(html.includes("resolveLockReason = 'Zielperson noch zum Opel bringen'"), 'completion lock must explain the transport step');
assert(html.includes("resolveLockReason = 'Zielperson noch sicher übergeben'"), 'completion lock must explain the handoff step');
assert(html.includes('◆ Rettungsziel:'), 'map must label both safe handoff destinations');
assert(html.includes('lagerhalle-spree-gerettet.png'), 'rescued warehouse state needs a dedicated visual');

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
}

const resetButtons = Array.from(html.matchAll(/<button[^>]+>[^<]*(?:Neue Ermittlung|Ermittlung neu beginnen|Neuer Fall, neues Gl)/g));
assert(resetButtons.length >= 6, 'expected all restart buttons in source');
for (const match of resetButtons) {
  assert(match[0].includes('ontouchend="return startNewInvestigation(event,'), 'restart button lacks touch-safe handler');
  assert(match[0].includes('onclick="return startNewInvestigation(event,'), 'restart button lacks click-safe handler');
}
assert(html.includes('if (now - _newInvestigationTapAt < 800) return false;'), 'restart handler must suppress synthetic mobile double clicks');

console.log('PHYSICAL_TARGET_ENDGAME_OK');
