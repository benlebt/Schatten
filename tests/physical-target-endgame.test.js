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
      abStage: 4
    }
  },
  caseProgress: {
    stage: 3,
    zielpersonGefunden: false,
    gefundeneIndizIds: ['lothar_schluessel']
  },
  alleDefiniertenIndizien: () => [{ id: 'lothar_schluessel', stage: 4 }],
  _resolveNpcIdentity: () => ({ id: 'konstantin_wegener', name: 'Konstantin Wegener' }),
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

targetContext.caseProgress.gefundeneIndizIds = [];
assert.strictEqual(targetContext._physischesFallzielStatus(), null, 'target must remain hidden before its reveal clue');

assert(html.includes("art: 'fallziel_reise'"), 'director must route toward a revealed physical target');
assert(html.includes("status: 'fallziel'"), 'main UI must expose a physical target thread');
assert(html.includes("◆ Fallziel:"), 'map popup must label the physical target');
assert(html.includes("var fallzielStatus = (typeof _physischesFallzielStatus === 'function')"), 'map data must derive the target marker from engine truth');

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
