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
  for (let i = start; i < html.length; i += 1) {
    if (html[i] === '{') { depth += 1; opened = true; }
    else if (html[i] === '}') {
      depth -= 1;
      if (opened && depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('unterminated function ' + name);
}

assert(!/Schatten v7\.12\.\d+/.test(html), 'visible version badges must not be hard-coded');
assert.strictEqual((html.match(/data-schatten-version/g) || []).length, 3, 'both badges and their central updater must exist');
assert(html.includes("el.textContent = 'Schatten ' + window.SCHATTEN_VERSION"), 'visible badges must use the central version constant');
assert(html.includes('KONFRONTATION_TAG_TOOLTIPS'), 'missing confrontation tooltip registry');
assert(html.includes('function _konfrontationWuerfleAusgang'), 'missing randomized confrontation outcome helper');
assert(html.includes("const alkoholMalus = (typeof _alkoholKampfMalus === 'function')"), 'tiered alcohol penalty must reduce confrontation reliability');
assert(html.includes('function _alkoholKampfMalus()'), 'alcohol combat penalty helper is missing');
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
assert(actionBody.includes('_hauptuiKonfrontationAktionVerletzungGesperrt(aktion)'), 'stale confrontation handlers need an injury safety guard');
assert(actionBody.includes("if (aktion === 'anbieten')"), 'active confrontations must accept social item offers as a nonviolent move');
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
assert(html.includes("injuryNote.className = 'hauptui-threat-note is-injury-warning'"), 'critical injury must be explained directly in the confrontation menu');
assert(html.includes('btn.disabled = true;'), 'injury-blocked confrontation controls must render disabled');
assert(html.includes("['ko', 'gefesselt', 'fixiert', 'geflohen', 'uebergeben']"), 'only truly secured opponents may end the confrontation');
assert(html.includes('const bleibtOffen = !!(finalStatus && !_konfrontationStatusIstEndgueltig(finalStatus) && outcome);'), 'a merely staggered opponent must keep the confrontation active');
assert(html.includes('k.treffer >= 2 && k.kontrollverlust >= 7'), 'successive tactical hits need a real cumulative resolution path');
assert(html.includes('function _hauptuiKonfrontationAnsichtAktualisieren()'), 'post-narration state changes must refresh the scene visual and action UI immediately');
assert(html.includes('function _hauptuiKonfrontationBeruhigtenAbgangSichern(name)'), 'peaceful confrontation endings need a prose/UI departure guard');
assert(sourceOf('_hauptuiKonfrontationAbschliessen').includes('_hauptuiKonfrontationBeruhigtenAbgangSichern(name)'),
  'a mechanically removed pacified opponent must get the same-scene prose departure before the UI refresh');
assert(html.includes('function _hauptuiKonfrontationBeruhigtenTeilRueckzugSichern(name, k)'),
  'group de-escalation needs a separate prose/image continuity guard');
assert(sourceOf('_hauptuiKonfrontationAbschliessen').includes('_hauptuiKonfrontationBeruhigtenTeilRueckzugSichern(name, k)'),
  'a pacified partial opponent must remain passively visible while the group fight continues');
assert(sourceOf('_hauptuiKonfrontationAbschliessen').includes("finalStatus === 'beruhigt' && !istGruppenKonfrontation"),
  'only solo de-escalation may force a visible departure');
assert(sourceOf('_hauptuiKonfrontationDeeskalationsAbschlussPrompt').includes('Niemand verlaesst den Ort'),
  'the group de-escalation prompt must forbid one opponent from taking active opponents out of the scene');
assert(html.includes("_renderKesslerSceneVisual(currentScene);"), 'danger styling must update without waiting for another player click');
assert(html.includes("return !!(z && ['ko', 'gefesselt', 'fixiert', 'uebergeben', 'geflohen'].indexOf(z.status) !== -1);"), 'benommen or blinded opponents must not become searchable aftermath targets');
assert(html.includes('&& !_taktischeKonfrontationLaeuft'), 'meta custody must not interrupt an unresolved tactical confrontation');
assert(!html.includes("showProgressToast('Dem Zugriff entgangen'"), 'an invisible rolled-back arrest must not produce a success toast');
assert(html.includes('_konfrontationLootHinweis'), 'defeated enemies should become explicitly searchable');
assert(actionBody.includes("id: 'KONFRONTATION_ITEM_'"), 'item actions must create a narrative engine scene');
assert(html.includes('Leere Hände'), 'bare-handed attacks need an explicit risky fallback plan');
assert(html.includes('function _konfrontationBegleiterAktionen()'), 'active companions need actions in the current confrontation UI');
assert(html.includes("assistLabel.textContent = 'Begleiteraktion';"), 'companion moves need a distinct confrontation section');
assert(html.includes("kState.assistKeys[act.name] = act.key;"), 'each companion must have an independently selectable move');
assert(html.includes('const selectedAssists = companionActions.filter'), 'multiple companion moves must be collected for one tactical command');
assert(html.includes('_hauptuiKonfrontationAktion(selectedMove.aktion, enemy, selectedMove.item || null, selectedAssists)'), 'Karl and all selected companion moves must execute as one tactical command');
assert(html.includes('TEAMAKTIONEN (PFLICHT)'), 'combined moves must force every selected actor into narrative prose');
assert(html.includes('ZUERST werden alle gewählten Begleiteraktionen sichtbar ausgeführt'), 'companion actions must narrate before Karl acts');
assert(html.includes('ERST DANACH nutzt Karl das dadurch entstandene Zeitfenster'), 'Karl must exploit the opening after companions act');
assert(html.includes("label: 'Rex: Fixieren'"), 'Rex must be transferable into the current confrontation UI');
assert(html.includes("label: 'Rex: Verjagen'"), 'Rex needs a fast non-lethal resolution against weak opposition');
assert(html.includes("label: 'Rex: Tief ansetzen'"), 'Rex needs the requested dark slapstick maneuver');
assert(html.includes('function _konfrontationIstGruppe'), 'multi-enemy encounters need explicit group handling');
assert(html.includes('neutralisiert ihren Überzahlvorteil'), 'area items must counter the numerical advantage of groups');

const injuryContext = {
  verfassung: 1,
  sceneCounter: 21,
  caseProgress: { _kritischSeitSzene: 19 },
};
vm.createContext(injuryContext);
vm.runInContext(sourceOf('_kritischeVerletzungsDauer') + '\n' + sourceOf('_kritischeVerletzungBlockiert') + '\n' + sourceOf('_hauptuiKonfrontationAktionVerletzungGesperrt'), injuryContext);
for (const action of ['angreifen', 'werfen', 'werfen_fuesse', 'angreifen_mit', 'fesseln', 'ppk_einsetzen']) {
  assert.strictEqual(injuryContext._hauptuiKonfrontationAktionVerletzungGesperrt(action), true,
    action + ' must be visibly blocked by the same critical-injury rule as chooseOption');
}
for (const action of ['deeskalieren', 'bluffen', 'fliehen', 'rausch_bluff', 'anbieten']) {
  assert.strictEqual(injuryContext._hauptuiKonfrontationAktionVerletzungGesperrt(action), false,
    action + ' must remain available as a non-offensive exit from the confrontation');
}

assert(html.includes('Kaffee-Staub'), 'coffee needs distinct mild effect copy');
assert(sourceOf('_hauptuiKonfrontationItems').includes("add(item, 'anbieten', 'Biete friedlich an: ')"), 'the tactical inventory must surface peaceful offers beside attacks');
const groupedItemContext = {
  inventory: [],
  caseProgress: {},
  normForMatch: value => String(value || '').toLowerCase().trim(),
  _baukastenZiele: () => ({ items: [
    { id: 'west_1', name: 'Schachtel West-Zigaretten', itemTyp: 'ware', anzahl: 1, itemIds: ['west_1'] },
    { id: 'west_2', name: 'Schachtel West-Zigaretten', itemTyp: '', anzahl: 1, itemIds: ['west_2'] },
    { id: 'toaster_1', name: 'Toaster (AEG, Vorkriegsmodell)', itemTyp: 'schwer', anzahl: 1, itemIds: ['toaster_1'] },
    { id: 'toaster_2', name: 'Toaster (AEG, Vorkriegsmodell)', itemTyp: '', anzahl: 1, itemIds: ['toaster_2'] }
  ] }),
  _hauptuiItem: target => ({ id: target.id, name: target.name, status: 'bei_karl', owner: 'karl' }),
  _hauptuiItemTaugt: (item, verb) => /zigaretten/i.test(item.name) ? verb === 'anbieten' : verb === 'werfen_fuesse',
  _hauptuiGegnerAngebotArt: item => /zigaretten/i.test(item.name) ? { key: 'zigarette' } : null,
  _hauptuiKonfrontationItemPlan: () => ({ score: 3, marker: 'Test', hint: 'Test' })
};
vm.createContext(groupedItemContext);
vm.runInContext(sourceOf('_hauptuiKonfrontationItemGruppen') + '\n' + sourceOf('_hauptuiKonfrontationItems') + '\n' + sourceOf('_hauptuiKonfrontationMoveKey'), groupedItemContext);
const groupedActions = groupedItemContext._hauptuiKonfrontationItems();
const cigaretteActions = groupedActions.filter(action => action.verb === 'anbieten');
const toasterActions = groupedActions.filter(action => action.verb === 'werfen_fuesse');
assert.strictEqual(cigaretteActions.length, 1, 'duplicate cigarette instances must render as one confrontation action');
assert.strictEqual(toasterActions.length, 1, 'duplicate toaster instances must render as one confrontation action');
assert(cigaretteActions[0].label.includes('×2'), 'the grouped cigarette action must expose its quantity');
assert(toasterActions[0].label.includes('×2'), 'the grouped toaster action must expose its quantity');
assert.deepStrictEqual(Array.from(cigaretteActions[0].item.itemIds), ['west_1', 'west_2'], 'the grouped action must retain both real item IDs');
assert.strictEqual(
  groupedItemContext._hauptuiKonfrontationMoveKey('anbieten', cigaretteActions[0].item),
  'anbieten|item:schachtel west-zigaretten',
  'selection state must address the grouped action instead of every same-named raw item'
);
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

const departureContext = {
  currentScene: {
    szene: 'Hellbach steckt den Knueppel ein. Er dreht sich halb um, verharrt jedoch in lauernder Haltung.'
  },
  normForMatch: value => String(value || '').toLowerCase()
};
vm.createContext(departureContext);
vm.runInContext(sourceOf('_hauptuiKonfrontationBeruhigtenAbgangSichern'), departureContext);
const departureFixed = departureContext._hauptuiKonfrontationBeruhigtenAbgangSichern('Eugen Hellbach');
assert.strictEqual(departureFixed, true, 'the peaceful departure sanitizer must complete');
assert(!/verharrt|lauernder Haltung/i.test(departureContext.currentScene.szene),
  'a contradicted lingering sentence must be removed after peaceful mechanical departure');
assert(/Eugen Hellbach wendet sich endgueltig ab und verlaesst den Ort\./.test(departureContext.currentScene.szene),
  'the visible scene must end with the pacified opponent actually leaving');

const partialContext = {
  currentScene: {
    szene: 'Kalle steckt den Schlagring ein und stapft zur Strasse. Jochen folgt ihm zoegerlich.'
  },
  normForMatch: value => String(value || '').toLowerCase(),
  _konfrontationGruppenLebende: () => [
    { name: 'Tante Frieda' },
    { name: 'Jochen' }
  ]
};
vm.createContext(partialContext);
vm.runInContext(sourceOf('_hauptuiKonfrontationBeruhigtenTeilRueckzugSichern'), partialContext);
const partialFixed = partialContext._hauptuiKonfrontationBeruhigtenTeilRueckzugSichern('Kalle', {});
assert.strictEqual(partialFixed, true, 'the peaceful partial-group sanitizer must complete');
assert(!/stapft|folgt ihm/i.test(partialContext.currentScene.szene),
  'a partial de-escalation must remove invented departures by the target and active allies');
assert(/Kalle tritt aus der Front zurueck und bleibt, nun passiv, am Rand des Ortes\./.test(partialContext.currentScene.szene),
  'the pacified partial opponent must remain visible but inactive');
assert(/Tante Frieda und Jochen bleiben aktiv und versperren Karl weiterhin den Weg\./.test(partialContext.currentScene.szene),
  'remaining group opponents must stay explicitly active');

const finalGroupContext = {
  currentScene: {
    szene: 'Jochen dreht sich um und verschwindet im dunklen Gang. Kalle nickt ihm nach.'
  },
  normForMatch: value => String(value || '').toLowerCase(),
  _konfrontationGruppenLebende: () => []
};
vm.createContext(finalGroupContext);
vm.runInContext(sourceOf('_hauptuiKonfrontationBeruhigtenTeilRueckzugSichern'), finalGroupContext);
const finalGroupFixed = finalGroupContext._hauptuiKonfrontationBeruhigtenTeilRueckzugSichern('Jochen', {});
assert.strictEqual(finalGroupFixed, true, 'the final peaceful group step must also be sanitized');
assert(!/verschwindet|dunklen Gang/i.test(finalGroupContext.currentScene.szene),
  'the last pacified group opponent must not leave the shared group image');
assert(/Jochen tritt aus der Front zurueck und bleibt, nun passiv, am Rand des Ortes\./.test(finalGroupContext.currentScene.szene),
  'the last pacified group opponent must remain passively visible');
assert(/Die beruhigte Gruppe gibt den Zugang frei; alle bleiben passiv am Ort\./.test(finalGroupContext.currentScene.szene),
  'the final group resolution must open the route without deleting the group from the scene');

console.log('KONFRONTATION_UI_OK');
