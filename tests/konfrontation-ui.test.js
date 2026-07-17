const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(html.includes('Schatten v7.12.1247'), 'version badge should be bumped');
assert(html.includes('KONFRONTATION_TAG_TOOLTIPS'), 'missing confrontation tooltip registry');
assert(html.includes('function _konfrontationWuerfleAusgang'), 'missing randomized confrontation outcome helper');
assert(html.includes("const alkoholMalus = Math.min(3, Math.max(0, Number(caseProgress && caseProgress.alkohol) || 0));"), 'alcohol must reduce confrontation reliability');
assert(html.includes('KONFRONTATION-NARRATION'), 'confrontation actions must route into narrative scene prose');
assert(html.includes('Die naechste Entscheidung gehoert dem Spieler'), 'item confrontation prose must not invent a flight or follow-up action');
assert(html.includes('Karl fesselt, durchsucht, verhört oder übergibt niemanden automatisch'), 'general combat plans must preserve the next tactical decision too');
assert(html.includes("const menge = item.anzahl > 1 ? ' ×' + item.anzahl : ''"), 'confrontation inventory must group duplicate item quantities');
assert(html.includes('_konfrontationNoFx: true'), 'confrontation narrative choices must suppress old combat/dialog FX');
assert(html.includes('_noDialogFx: true'), 'confrontation narrative choices must suppress dialog FX');
assert(html.includes('const _skipNarrativeFx'), 'chooseOption must honor the narrative FX skip flag');

assert(!html.includes("{ key: 'deeskalieren', label: 'Beruhigen', cls: 'primary'"), 'Beruhigen must not be permanently yellow');
assert(html.includes('.hauptui-confrontation .hauptui-column-label'), 'confrontation inventory label needs visual separation');
assert(html.includes('.hauptui-threat-chip[title]'), 'tactical tags need mouseover explanations');
assert(html.includes('function _hauptuiKonfrontationChooseNarration'), 'confrontation narrative handoff helper is missing');
assert(html.includes('window.__hauptuiKonfrontationState'), 'confrontation moves need the same select-then-execute buffer as normal actions');
assert(html.includes('chooseMove(act.key, act.label, null)'), 'base confrontation actions must select first, not execute immediately');
assert(html.includes('chooseMove(act.verb, act.label, act.item)'), 'item confrontation actions must select first, not execute immediately');
assert(html.includes('_hauptuiKonfrontationAktion(selectedMove.aktion, enemy, selectedMove.item || null, selectedAssists)'), 'execute button must be the only confrontation action handoff');
assert(!html.includes('_hauptuiKonfrontationAktion(act.key'), 'base confrontation buttons must not execute directly');
assert(!html.includes('_hauptuiKonfrontationAktion(act.verb'), 'item confrontation buttons must not execute directly');

const actionStart = html.indexOf('function _hauptuiKonfrontationAktion');
const actionEnd = html.indexOf('function _renderKonfrontationMenu', actionStart);
assert(actionStart !== -1 && actionEnd !== -1, 'cannot isolate active confrontation action function');
const actionBody = html.slice(actionStart, actionEnd);

assert(!actionBody.includes('_hauptuiPlanDirekt('), 'active confrontation actions must not use the old plan/combat popup path');
assert(!actionBody.includes('_encounterStartKampf'), 'active confrontation actions must not start the old emoji combat arena');
assert(!actionBody.includes('_hauptuiChoose('), 'confrontation action function must hand off through the guarded narrative helper');
assert(!actionBody.includes('_konfrontationClear('), 'confrontation must not be cleared before narrative handoff succeeds');
assert(actionBody.includes('_hauptuiKonfrontationChooseNarration'), 'confrontation action function must start a narrative scene');
assert(actionBody.includes('_konfrontationItemVerbrauchen'), 'thrown/used items should be consumed by the confrontation outcome');
const itemBranchStart = actionBody.indexOf("if (aktion === 'werfen' || aktion === 'werfen_fuesse'");
const itemBranchEnd = actionBody.indexOf("if (aktion === 'fliehen')", itemBranchStart);
assert(itemBranchStart >= 0 && itemBranchEnd > itemBranchStart, 'cannot isolate confrontation item branch');
const itemBranch = actionBody.slice(itemBranchStart, itemBranchEnd);
assert(itemBranch.indexOf('_konfrontationItemVerbrauchen') < itemBranch.indexOf('_hauptuiKonfrontationChooseNarration'), 'item must leave inventory before the new narrative scene renders');
assert(itemBranch.includes('_konfrontationItemVerbrauchRueckgaengig(reservierung)'), 'failed narrative handoff must restore the reserved item');
assert(itemBranch.includes('_hauptuiKonfrontationAnsichtAktualisieren();'), 'item reservation must refresh confrontation buttons immediately');
assert(actionBody.includes('_hauptuiKonfrontationAbschliessen'), 'defeated enemies should be closed only after narrative handoff');
assert(html.includes('function _konfrontationStatusIstEndgueltig(status)'), 'transient and terminal confrontation states need one shared classifier');
assert(html.includes("['ko', 'gefesselt', 'fixiert', 'geflohen', 'uebergeben']"), 'only truly secured opponents may end the confrontation');
assert(html.includes('const bleibtOffen = !!(finalStatus && !_konfrontationStatusIstEndgueltig(finalStatus) && outcome);'), 'a merely staggered opponent must keep the confrontation active');
assert(html.includes('k.treffer >= 2 && k.kontrollverlust >= 7'), 'successive tactical hits need a real cumulative resolution path');
assert(html.includes('function _hauptuiKonfrontationAnsichtAktualisieren()'), 'post-narration state changes must refresh the scene visual and action UI immediately');
assert(html.includes("_renderKesslerSceneVisual(currentScene);"), 'danger styling must update without waiting for another player click');
assert(html.includes("return !!(z && ['ko', 'gefesselt', 'fixiert'].indexOf(z.status) !== -1);"), 'benommen or blinded opponents must not become searchable aftermath targets');
assert(html.includes('&& !_taktischeKonfrontationLaeuft'), 'meta custody must not interrupt an unresolved tactical confrontation');
assert(!html.includes("showProgressToast('Dem Zugriff entgangen'"), 'an invisible rolled-back arrest must not produce a success toast');
assert(html.includes('_konfrontationLootHinweis'), 'defeated enemies should become explicitly searchable');
assert(actionBody.includes("id: 'KONFRONTATION_ITEM_'"), 'item actions must create a narrative engine scene');
assert(html.includes('Leere Haende'), 'bare-handed attacks need an explicit risky fallback plan');
assert(html.includes('function _konfrontationBegleiterAktionen()'), 'active companions need actions in the current confrontation UI');
assert(html.includes("assistLabel.textContent = 'Begleiteraktion';"), 'companion moves need a distinct confrontation section');
assert(html.includes("kState.assistKeys[act.name] = act.key;"), 'each companion must have an independently selectable move');
assert(html.includes('const selectedAssists = companionActions.filter'), 'multiple companion moves must be collected for one tactical command');
assert(html.includes('_hauptuiKonfrontationAktion(selectedMove.aktion, enemy, selectedMove.item || null, selectedAssists)'), 'Karl and all selected companion moves must execute as one tactical command');
assert(html.includes('TEAMAKTIONEN (PFLICHT)'), 'combined moves must force every selected actor into narrative prose');
assert(html.includes("label: 'Rex: Fixieren'"), 'Rex must be transferable into the current confrontation UI');
assert(html.includes("label: 'Rex: Verjagen'"), 'Rex needs a fast non-lethal resolution against weak opposition');
assert(html.includes("label: 'Rex: Tief ansetzen'"), 'Rex needs the requested dark slapstick maneuver');
assert(html.includes('function _konfrontationIstGruppe'), 'multi-enemy encounters need explicit group handling');
assert(html.includes('neutralisiert ihren Überzahlvorteil'), 'area items must counter the numerical advantage of groups');

assert(html.includes('Kaffee-Staub'), 'coffee needs distinct mild effect copy');
assert(html.includes('Glas und Korn'), 'Doppelkorn needs distinct stronger effect copy');
assert(html.includes('AEG-Wucht'), 'toaster needs heavy effect copy');
assert(html.includes('Sahne und Klebrigkeit'), 'cake needs a distinct blinding distraction effect');
assert(html.includes('Schwere Haushaltswucht'), 'household weapons need a distinct heavy effect');
assert(html.includes('Feuerwerks-Salve'), 'fireworks need a distinct area effect');
assert(html.includes('Beißender Gestank'), 'stink bombs need a distinct area effect');
assert(html.includes('Mechanische Kontrolle'), 'handcuffs need an explicit control effect');
assert(html.includes('Kontrollierte Knüppelwucht'), 'baton needs a distinct controlled impact effect');
assert(html.includes('Irritation +'), 'item cards should expose irritation strength');
assert(html.includes('Schwächung +'), 'item cards should expose weakening strength');
assert(html.includes('Gegnerstaerke'), 'outcome prompt should include enemy strength');
assert(html.includes('Zufallsausgang'), 'outcome prompt should include randomized result');
assert(html.includes('schwarzer, trockener Slapstick'), 'comic confrontation items need an intentionally extreme slapstick register');
assert(html.includes('harter Grossstadt-Noir'), 'serious confrontations need a distinct rough noir register');
assert(html.includes('Der Gag bleibt Teil der Welt'), 'slapstick must leave persistent, believable scene consequences');

const consumeStart = html.indexOf('function _konfrontationItemVerbrauchen');
const consumeEnd = html.indexOf('function _konfrontationLootHinweis', consumeStart);
assert(consumeStart >= 0 && consumeEnd > consumeStart, 'cannot isolate confrontation item transaction helpers');
const inventory = {
  alter_fisch: { id: 'alter_fisch', name: 'Alter Fisch (aus dem Müll)', status: 'bei_karl', owner: 'karl', locationId: null }
};
const consumeContext = {
  _itemKatalogEintrag: () => ({ verbrauchbar: true }),
  _itemMove: (id, change) => {
    if (!inventory[id]) return false;
    Object.assign(inventory[id], change);
    return true;
  }
};
vm.createContext(consumeContext);
vm.runInContext(html.slice(consumeStart, consumeEnd), consumeContext);
const reservation = consumeContext._konfrontationItemVerbrauchen(inventory.alter_fisch, 'werfen');
assert(reservation, 'throwing a consumable item must create a rollback reservation');
assert.strictEqual(inventory.alter_fisch.status, 'verloren', 'thrown fish must leave Karl inventory immediately');
assert.strictEqual(inventory.alter_fisch.owner, 'konfrontation', 'reserved item must belong to the active confrontation');
assert(consumeContext._konfrontationItemVerbrauchRueckgaengig(reservation), 'failed scene handoff must restore the item transaction');
assert.strictEqual(inventory.alter_fisch.status, 'bei_karl', 'rollback must return the fish to Karl');
assert.strictEqual(inventory.alter_fisch.owner, 'karl', 'rollback must restore the original owner');

const outcomeStart = html.indexOf('function _hauptuiKonfrontationLetztenAusgangSpeichern');
const outcomeEnd = html.indexOf('function _konfrontationUnbewaffnetPlan', outcomeStart);
assert(outcomeStart >= 0 && outcomeEnd > outcomeStart, 'cannot isolate confrontation state transition helpers');
const stateWrites = [];
let visualRefreshes = 0;
let optionRefreshes = 0;
const context = {
  caseProgress: { activeConfrontation: { enemyName: 'Hauptmann Klaus Berner' } },
  currentScene: { szene: 'Berner taumelt.' },
  diag: () => {},
  saveGame: () => {},
  _npcZustandSet: (name, state) => stateWrites.push([name, state.status]),
  _konfrontationClear: () => { context.caseProgress.activeConfrontation = null; },
  _konfrontationLootHinweis: () => {},
  _renderKesslerSceneVisual: () => { visualRefreshes++; },
  renderOptions: () => { optionRefreshes++; },
};
vm.createContext(context);
vm.runInContext(html.slice(outcomeStart, outcomeEnd), context);
context._hauptuiKonfrontationAbschliessen(
  { name: 'Hauptmann Klaus Berner' },
  'Hauptmann Klaus Berner',
  'benommen',
  'item-werfen-treffer',
  { name: 'Schweres Nudelholz' },
  { art: 'treffer', wirkung: { kraft: 3, schwaechung: 2 } }
);
assert(context.caseProgress.activeConfrontation, 'a single stagger hit must keep Berner in the active confrontation');
assert.strictEqual(stateWrites.at(-1)[1], 'benommen', 'the transient hit must remain narratively visible');
assert.strictEqual(visualRefreshes, 1, 'the danger visual must refresh exactly once after the outcome');
assert.strictEqual(optionRefreshes, 1, 'the action UI must refresh exactly once after the outcome');
context._hauptuiKonfrontationAbschliessen(
  { name: 'Hauptmann Klaus Berner' },
  'Hauptmann Klaus Berner',
  'benommen',
  'item-werfen-treffer',
  { name: 'Flasche Nordhäuser Doppelkorn' },
  { art: 'treffer', wirkung: { kraft: 3, schwaechung: 2 } }
);
assert.strictEqual(context.caseProgress.activeConfrontation, null, 'a strong cumulative follow-up must end the confrontation');
assert.strictEqual(stateWrites.at(-1)[1], 'ko', 'the cumulative follow-up must produce a real terminal state');

console.log('KONFRONTATION_UI_OK');
