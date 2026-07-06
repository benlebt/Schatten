const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(html.includes('Schatten v7.12.1202'), 'version badge should be bumped');
assert(html.includes('KONFRONTATION_TAG_TOOLTIPS'), 'missing confrontation tooltip registry');
assert(html.includes('function _konfrontationWuerfleAusgang'), 'missing randomized confrontation outcome helper');
assert(html.includes('KONFRONTATION-NARRATION'), 'confrontation actions must route into narrative scene prose');
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
assert(html.includes('_hauptuiKonfrontationAktion(selectedMove.aktion, enemy, selectedMove.item || null)'), 'execute button must be the only confrontation action handoff');
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
assert(actionBody.includes('_hauptuiKonfrontationAbschliessen'), 'defeated enemies should be closed only after narrative handoff');
assert(html.includes('_konfrontationLootHinweis'), 'defeated enemies should become explicitly searchable');
assert(actionBody.includes("id: 'KONFRONTATION_ITEM_'"), 'item actions must create a narrative engine scene');
assert(html.includes('Leere Haende'), 'bare-handed attacks need an explicit risky fallback plan');

assert(html.includes('Kaffee-Staub'), 'coffee needs distinct mild effect copy');
assert(html.includes('Glas und Korn'), 'Doppelkorn needs distinct stronger effect copy');
assert(html.includes('AEG-Wucht'), 'toaster needs heavy effect copy');
assert(html.includes('Irritation +'), 'item cards should expose irritation strength');
assert(html.includes('Schwächung +'), 'item cards should expose weakening strength');
assert(html.includes('Gegnerstaerke'), 'outcome prompt should include enemy strength');
assert(html.includes('Zufallsausgang'), 'outcome prompt should include randomized result');

console.log('KONFRONTATION_UI_OK');
