const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.parentNode = null;
    this.className = '';
    this.textContent = '';
    this.disabled = false;
    this.dataset = {};
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  insertBefore(child, reference) {
    child.parentNode = this;
    const index = this.children.indexOf(reference);
    if (index < 0) return this.appendChild(child);
    this.children.splice(index, 0, child);
    return child;
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.children = this.parentNode.children.filter((child) => child !== this);
  }

  setAttribute(name, value) {
    this[name] = value;
  }

  addEventListener(name, handler) {
    if (name === 'click') this.onTap = handler;
  }

  querySelector(selector) {
    const className = selector.replace(':scope > ', '').replace('.', '');
    return this.children.find((child) => child.className.split(' ').includes(className)) || null;
  }
}

function all(root) {
  return [root].concat(root.children.flatMap(all));
}

function visibleText(root) {
  return root.textContent + root.children.map(visibleText).join('');
}

function byText(root, text) {
  return all(root).find((element) => element.tagName === 'button' && visibleText(element).startsWith(text));
}

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(html.includes("hauptuiQuickActions.className = 'hauptui-quick-actions'"), 'compact quick-action container missing');
assert(html.includes("? hauptuiQuickActions\n      : (typeof topActions"), 'travel action must use compact Haupt-UI container');
assert(html.includes("_kampfAktiv || _showdownAktiv || _feindAmOrt"), 'flight must require a mechanically confirmed danger instead of tension alone');
assert(html.includes("typeof hauptuiQuickActions !== 'undefined' ? hauptuiQuickActions"), 'flight must use the compact Haupt-UI quick-action row');
assert(html.includes('<span>Fliehen</span><span class="option-marker option-marker-system">Sicherer Ort</span>'), 'flight typography must match the normal action language');
assert(html.includes("? hauptuiQuickActions : uebergangBody).appendChild(_sleepBtn)"), 'sleep action must use compact Haupt-UI container');
assert(html.includes('showSleepButton && !_imKampfNow && !window.HAUPTUI_AKTIV'), 'redundant special-action separator must stay hidden in Haupt-UI');
assert(!html.includes("commandText.textContent = selectedVerb ?"), 'permanent command prompt must be removed');
assert(html.includes("groups.filter(function (group) { return group.targets.length > 0; })"), 'empty target groups must be omitted');
assert(html.includes("if (ready) {\n      const execute"), 'execute button must only render for a complete command');
assert(html.includes('.hauptui-kategorien .werkzeug-row .werkzeug-btn {'), 'compact Haupt-UI tool button override missing');
assert(html.includes('grid-template-columns: repeat(2, minmax(220px, 340px));'), 'quick actions must use two compact LucasArts-style columns');
assert(html.includes('justify-content: start;'), 'quick actions must not stretch across the whole menu width');
assert(html.includes('.hauptui-quick-actions .option-btn-reise .option-id {'), 'travel icon must reserve enough width for the Opel SVG');
assert(html.includes("var ww = Math.round(hh * 64 / 30);"), 'Opel SVG must declare a real width instead of overlapping its label');
assert(html.includes('.hauptui-quick-actions .option-marker {') && html.includes('min-width: 0;\n    margin-top: 0;') && html.includes('letter-spacing: 0;'), 'quick-action markers need a shrinkable grid column with normal letter spacing');
assert(html.includes('text-overflow: ellipsis;\n    text-align: right;'), 'long travel destinations must truncate cleanly instead of colliding with the title');
assert(html.includes(".hauptui-quick-actions .option-btn-sleep .option-text-wrap > span:first-child"), 'sleep title needs a stable no-wrap layout');
assert(html.includes("const _schlafLabel = 'Schlafen';"), 'sleep quick action must use a compact title');
assert(html.includes('const _schlafMarkerKurz ='), 'sleep quick action must use a compact marker');
assert(!html.includes("_schlafZielM.tagPlus ? ' · Tag +1'"), 'sleep quick action marker must not carry the verbose day-plus suffix');
assert(html.includes("marker = 'Gesperrt · Spannung';"), 'sleep tension lock marker must stay compact');
assert(html.includes("<span>Wirklich schlafen?</span>"), 'sleep confirmation must use a compact title');
assert(html.includes('grid-template-columns: 40px minmax(0, 1fr) minmax(72px, max-content);'), 'travel quick action needs stable icon, title and destination columns');
assert(html.includes('height: 42px;\n    min-height: 42px;'), 'quick actions need fixed height so Opel and sleep align consistently');
assert(html.includes('.hauptui-quick-actions .option-text-wrap {\n    display: contents;'), 'desktop quick actions must place title and marker in separate grid columns');
assert(html.includes('.hauptui-quick-actions .option-marker {\n    display: flex;\n    align-items: center;\n    justify-content: flex-end;\n    align-self: stretch;'), 'quick-action markers must be vertically centered text, not top-aligned badges');
assert(html.includes('padding: 0;\n    border: 0;\n    background: transparent;\n    border-radius: 0;'), 'quick-action markers must not render as nested mini-buttons');
assert(html.includes('@media (max-width: 520px)') && html.includes('grid-template-columns: 1fr;'), 'narrow quick actions must stack into stable full-width rows');
assert(html.includes('.hauptui-quick-actions .option-text-wrap > span:first-child,\n    .hauptui-quick-actions .option-btn-sleep .option-text-wrap > span:first-child {\n      min-width: 0;\n      max-width: 100%;\n      overflow: hidden;\n      text-overflow: ellipsis;\n      white-space: nowrap;'), 'narrow quick-action titles must not wrap over travel markers');
assert(html.includes('.hauptui-lead-question { font-size: calc(11px * var(--reading-scale));'), 'open investigation threads must stay readable');
assert(html.includes('.hauptui-lead-place { color: #91a9b4; font-size: calc(9.5px * var(--reading-scale));'), 'open thread destination labels must stay readable');
assert(html.includes('max-width: 22ch;\n    color: #8fa8b5;\n    font-size: calc(9px * var(--reading-scale));'), 'hint tags must not collapse into tiny unreadable labels');
assert(html.includes('const FX_DIALOG_OVERLAYS_AKTIV = false;'), 'legacy emoji dialogue cards must stay globally disabled in the scene-image style');
assert(/function fxDialog[\s\S]{0,220}?window\._fxLastT = Date\.now\(\);[\s\S]{0,80}?if \(!FX_DIALOG_OVERLAYS_AKTIV\) return;/.test(html), 'fxDialog must mark handled and return before rendering emoji dialogue cards');
assert(html.includes('.hauptui-kategorien .werkzeug-row .option-marker {\n    align-self: center;\n    margin-top: 0;\n    padding: 2px 6px;\n    letter-spacing: 0;'), 'tool marker typography must match the travel marker');
assert(html.includes("oeffneNpcMenue(npc, 'szene', true)"), 'Rede mit must request direct unambiguous conversation');
assert(html.includes('UI-KLICKVERLAUF (chronologisch)'), 'debug export must include the chronological UI click audit');
assert(html.includes('Sichtbare UI-Zustaende ('), 'debug export must include offered Haupt-UI and dossier states');
assert(html.includes("_uiAudit('FADEN', faden.frage, faden.ort)"), 'open investigation threads must be logged when clicked');
assert(html.includes('&& !_ortHatJetztErreichbareSpur && !_offenerFadenHier;'), 'an open thread at the current location must suppress the exhausted-location banner');
assert(html.includes('function _hauptuiHatOffenenFadenAmOrt(ortName)'), 'Haupt-UI needs a shared current-location thread check');
assert(html.includes("showProgressToast('Gleich bereit'"), 'execute must explain transient API locks instead of silently doing nothing');
assert(html.includes("showProgressToast('Nicht erreichbar'"), 'execute must explain stale person targets instead of silently doing nothing');
assert(html.includes('function _hauptuiNarrativerFadenPrompt(ortName, scenesHere)'), 'open threads must feed the narrative prompt compass');
assert(html.includes('NARRATIVER FADEN-KOMPASS'), 'prompt compass must be explicit enough to steer prose');
assert(html.includes('GEFAHR-AUSZAHLUNG (KRITISCH)'), 'engine-spawned danger must be forced to pay off in prose instead of disappearing offscreen');
assert(html.includes('=== AKTIVE KONFRONTATION (PFLICHT, v7.12.1171) ==='), 'active confrontation state must be explicit in the scene prompt');
assert(html.includes('OFFSCREEN-VERLETZUNGEN VERBOTEN'), 'injury prose must not invent unseen causes retroactively');
assert(html.includes('ORTSWECHSEL-SCHABLONEN'), 'repeated travel openings need an explicit anti-template rule');
assert(html.includes('let _reiseFreiDurchOrtsausgang = false;'), 'public investigation locations need an exit override so high tension cannot hide travel completely');
assert(html.includes('const _reiseGesperrtRoh = (!window.HAUPTUI_AKTIV) && (currentSpannung >= 4)'), 'Haupt-UI travel must not disappear because of tension alone');
assert(html.includes('const _reiseDurchBildErsetzt = _ausgangImBild && !window.HAUPTUI_AKTIV;'), 'scene image exits must not replace the visible Haupt-UI travel button');
assert(html.includes("const _reiseGesperrt = (_reiseGesperrtRoh || _klientGateAktiv) && !_reiseFreiDurchFlucht && !_reiseFreiDurchOrtsausgang;"), 'travel gating must keep usable exits available unless combat/custody/client gate blocks them');
assert(html.includes('function _verhoerAutoScroll()'), 'Verhoerakte must keep the protocol scrolled to the latest exchange');
assert(html.includes("const prot = ov.querySelector('.protokoll');"), 'Verhoerakte auto-scroll must target only the protocol area');
assert(html.includes('prot.scrollTop = prot.scrollHeight;'), 'Verhoerakte protocol must jump to the newest text after render');
assert(html.includes('requestAnimationFrame(function ()'), 'Verhoerakte auto-scroll must repeat after layout settles');
assert(html.includes('panel.innerHTML = h;\n  _verhoerAutoScroll();'), 'Verhoerakte render must trigger protocol auto-scroll immediately');
const npcMenuSource = html.slice(html.indexOf('function oeffneNpcMenue'), html.indexOf('// ===== Ende NPC-Interaktion ====='));
assert(npcMenuSource.includes("_direktVerb.key === 'befragen' || _direktVerb._verhoerOeffnen"), 'single conversation actions must bypass the redundant NPC popup inside the NPC menu');
assert(npcMenuSource.includes('_direktVerb._sozialErledigt'), 'finished conversations must bypass the redundant one-button popup');
assert(npcMenuSource.includes('_direktVerb._sozialNochNicht'), 'temporarily locked conversations must bypass the redundant one-button popup');
assert(npcMenuSource.includes('!_hatUeberhauptNoch && !_klientHier && _schonGesprochen'), 'NPCs without bound clues must not appear exhausted before their first conversation');
assert(npcMenuSource.includes('!_hatNochWas && _schonGesprochen'), 'simple NPC conversations must remain available until the NPC was actually spoken to');
assert(npcMenuSource.includes('_hatUeberhauptNoch && !_hatJetztErreichbar'), 'NPCs without any bound clue must not be mistaken for stage-locked conversations');
assert(npcMenuSource.includes('_hatNochWas && !_hatJetzt'), 'simple NPCs without any bound clue must still allow their first conversation');
assert(npcMenuSource.includes('_klientHatOffenenHinweis'), 'client lockout must explicitly exempt currently open client-bound clues');
assert(npcMenuSource.includes('&& !_klientHatOffenenHinweis'), 'client lockout must not hide a reachable clue at the client location');
assert(html.includes('_npcAlsAngesprochenMarkieren(npc.name, npc.id)'), 'real conversations must persist their per-NPC spoken state');
const zielHinweisStart = html.indexOf('function _hauptuiZielHinweis');
const zielHinweisEnd = html.indexOf('function _hauptuiBind', zielHinweisStart);
const zielHinweisSource = html.slice(zielHinweisStart, zielHinweisEnd);
assert(zielHinweisSource.includes("return 'Hinweis';"), 'person clue badges must stay short and not expose clipped raw action labels');
assert(zielHinweisSource.includes('target.belegBedarf'), 'proof-gated clues must show Beleg fehlt instead of a misleading direct hint');
const sceneVisualSource = html.slice(html.indexOf('function _renderKesslerSceneVisual'), html.indexOf('function _clearKesslerSceneVisual'));
assert(!sceneVisualSource.includes('direktWennEindeutig'), 'NPC direct-action code must never leak into scene-image rendering');
const start = html.indexOf('window.__hauptuiActionState');
const end = html.indexOf('</script>', start);
assert(start > -1 && end > start, 'Haupt-UI source block not found');

const calls = { npc: 0, fund: 0, options: [], marks: 0, flushes: 0, saves: 0 };
const clue = { id: 'kessler_brief', text: 'Roberts gefaltetes Briefchen' };
const voss = { id: 'voss', name: 'Oberkellner Voss', tag: 'WITNESS' };
let expectedNpcId = voss.id;
const context = {
  console,
  window: {},
  document: { createElement: (tagName) => new FakeElement(tagName) },
  Object,
  String,
  Array,
  Date,
  normForMatch: (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(),
  sceneCounter: 3,
  logEntries: [{ type: 'scene', sceneNr: 3 }],
  caseProgress: { gefundeneIndizIds: [], verhoere: {}, verhoerFehlschlaege: [] },
  engineCurrentLocation: { name: 'Cafe Wien' },
  deriveInteractionMode: () => 'normal',
  attachSafeTap: (button, handler) => { button.onTap = handler; },
  _baukastenZiele: () => ({
    personen: [{ id: voss.id, name: voss.name, typ: 'person', hinweis: true, hinweisAktionen: ['Befragen', 'Bestechen'] }],
    objekte: [{ id: clue.id, name: 'Roberts Ecktisch', typ: 'objekt', actions: ['BEOBACHTEN', 'ERKUNDEN'], spur: true }],
    items: [{ id: 'notizbuch', name: 'Notizbuch', typ: 'item' }],
  }),
  _ortsFundItems: () => [],
  _ortsFundIndizienErreichbar: () => [clue],
  _itemsBeiKarl: () => [{ id: 'notizbuch', name: 'Notizbuch' }],
  getNpcsAtCurrentLocation: () => [voss],
  oeffneNpcMenue: (npc, modus, direkt) => {
    assert.strictEqual(npc.id, expectedNpcId);
    calls.npc += 1;
    calls.npcModus = modus;
    calls.npcDirekt = direkt;
  },
  _markPopupOpened: () => {},
  _zeigeFundAuswahl: (items, clues) => { calls.fund += 1; calls.fundItems = items; calls.fundClues = clues; },
  chooseOption: (option) => calls.options.push(option),
  saveGameState: () => { calls.saves += 1; },
  _findeIndizById: (id) => id === clue.id ? clue : null,
  _markiereIndizGefunden: (indiz) => { calls.marks += 1; context.caseProgress.gefundeneIndizIds.push(indiz.id); return true; },
  _flushIndizRewards: () => { calls.flushes += 1; },
  showProgressToast: () => {},
  zeigeMiniAuswahl: () => {},
  npcInteraktion: () => {},
  _itemKatalogEintrag: () => null,
  diag: () => {},
};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

context._istKesslerFallFuerBild = () => true;
let faeden = context._hauptuiKesslerFaeden();
assert.deepStrictEqual(Array.from(faeden, (f) => f.id), ['robert_weg', 'wohnung'], 'Kessler must begin with two concrete courtyard questions');
context.caseProgress.gefundeneIndizIds = ['robert_eintritt_beobachtet', 'tuerschild_hauke', 'ilse_aussage'];
context.caseProgress.verhoere = {};
context.caseProgress.verhoerFehlschlaege = [];
faeden = context._hauptuiKesslerFaeden();
assert.deepStrictEqual(Array.from(faeden, (f) => f.id), ['spedition', 'cafe', 'edith'], 'Ilse statement must open independent investigation locations');
assert.strictEqual(context._hauptuiHatOffenenFadenAmOrt('Spedition Schmidt, Moabit'), true, 'Spedition thread must count as local despite punctuation differences');
assert.strictEqual(context._hauptuiHatOffenenFadenAmOrt('Hinterhof Sybelstrasse'), false, 'a thread at another location must not suppress a genuinely exhausted place');
let fadenPrompt = context._hauptuiNarrativerFadenPrompt('Spedition Schmidt, Moabit', 3);
assert(fadenPrompt.includes('aktueller Ort') && fadenPrompt.includes('Stimmen Roberts angebliche'), 'local thread prompt must steer the current scene toward the visible open thread');
fadenPrompt = context._hauptuiNarrativerFadenPrompt('Hinterhof Sybelstrasse', 3);
assert(fadenPrompt.includes('naechste Spur') && fadenPrompt.includes('Spedition Schmidt Moabit') && fadenPrompt.includes('Reise-Button'), 'remote thread prompt must nudge toward travel without teleporting Karl');
context.caseProgress.gefundeneIndizIds = ['robert_eintritt_beobachtet', 'tuerschild_hauke'];
context.caseProgress.verhoere = { ilse_hauke: { status: 'verbrannt' } };
context.caseProgress.verhoerFehlschlaege = ['ilse_hauke'];
faeden = context._hauptuiKesslerFaeden();
assert.deepStrictEqual(Array.from(faeden, (f) => f.id), ['spedition', 'cafe', 'edith'], 'burned Ilse interrogation must not keep the player stuck in the courtyard');
assert.strictEqual(context._hauptuiHatOffenenFadenAmOrt('Hinterhof Sybelstrasse'), false, 'burned local interrogation must not keep the courtyard marked as the next active thread');
context.caseProgress.verhoere = { ilse_hauke: { status: 'gelöst', _grantText: 'Ilse hat alles gesagt.' } };
context.caseProgress.verhoerFehlschlaege = [];
context.caseProgress.gefundeneIndizIds = ['robert_eintritt_beobachtet', 'tuerschild_hauke'];
context.engineCurrentLocation = { name: 'Hinterhof Sybelstrasse' };
context.getCaseLocations = () => [{
  name: 'Hinterhof Sybelstrasse',
  indizien: [{ id: 'ilse_aussage', npc: 'ilse_hauke', quelle: 'person', actions: ['BEFRAGEN'] }],
}];
context._aktTageszeitName = () => 'nachmittag';
faeden = context._hauptuiKesslerFaeden();
assert(!faeden.some((f) => f.id === 'ilse'), 'solved but legacy-unbooked Ilse dossier must not remain an open thread');
assert.strictEqual(context._indizDurchVerhoerNichtMehrOffen({ id: 'ilse_aussage', npc: 'ilse_hauke', quelle: 'person' }), true, 'solved but legacy-unbooked Ilse dossier must be treated as no longer open');
context.caseProgress.verhoere = {};
context.caseProgress.verhoerFehlschlaege = [];
context.caseProgress.gefundeneIndizIds = ['robert_eintritt_beobachtet', 'tuerschild_hauke', 'ilse_aussage'];
context.caseProgress.gefundeneIndizIds.push('tetzlaff_aussage');
faeden = context._hauptuiKesslerFaeden();
assert.strictEqual(faeden[0].id, 'robert', 'independent evidence must open Robert confrontation');
assert.strictEqual(context._hauptuiHatOffenenFadenAmOrt('Spedition Schmidt Moabit'), false, 'resolved Spedition thread must stop keeping the location open');
context.caseProgress.gefundeneIndizIds.push('robert_aussage');
faeden = context._hauptuiKesslerFaeden();
assert.strictEqual(faeden[0].id, 'edith_beleg', 'Robert statement without the letter must point to the missing independent proof');
assert.strictEqual(faeden[0].ort, 'Spedition Schmidt Moabit', 'missing proof thread must send Karl to the Spedition');
assert.strictEqual(faeden[0].status, 'braucht_beleg', 'missing proof thread must be marked as proof-gated');
context.caseProgress.gefundeneIndizIds.push('briefchen_ilse');
faeden = context._hauptuiKesslerFaeden();
assert.strictEqual(faeden[0].id, 'bericht', 'Robert statement must lead back to Edith');

const tetzlaff = { id: 'norbert_tetzlaff', name: 'Norbert Tetzlaff', tag: 'INFORMANT', typ: 'person', hinweis: true, hinweisAktionen: ['Befragen', 'Bestechen'] };
context.caseProgress.gefundeneIndizIds = ['robert_eintritt_beobachtet', 'tuerschild_hauke', 'ilse_aussage'];
context.engineCurrentLocation = { name: 'Spedition Schmidt, Moabit' };
context.window.__hauptuiActionState = { verb: null, targetKey: null };
context._baukastenZiele = () => ({ personen: [tetzlaff], objekte: [], items: [] });
context.getNpcsAtCurrentLocation = () => [tetzlaff];
expectedNpcId = tetzlaff.id;
const threadContainer = new FakeElement('div');
context._renderEngineMenu(threadContainer, {});
const speditionThread = byText(threadContainer, 'Stimmen Roberts angebliche Überstunden?');
assert(speditionThread, 'Spedition thread must be visible at the Spedition');
speditionThread.onTap();
const threadExecute = all(threadContainer).find((element) => element.className === 'hauptui-execute');
assert(threadExecute && visibleText(threadExecute).includes('Rede mit · Norbert Tetzlaff'), 'Spedition thread must prepare an executable Tetzlaff conversation');
const npcCallsBeforeThread = calls.npc;
threadExecute.onTap();
assert.strictEqual(calls.npc, npcCallsBeforeThread + 1, 'executing the Spedition thread must open Tetzlaff conversation');

context._istKesslerFallFuerBild = () => false;
context.caseProgress.gefundeneIndizIds = [];
context.engineCurrentLocation = { name: 'Cafe Wien' };
context.window.__hauptuiActionState = { verb: null, targetKey: null };
context._baukastenZiele = () => ({
  personen: [{ id: voss.id, name: voss.name, typ: 'person', hinweis: true, hinweisAktionen: ['Befragen', 'Bestechen'] }],
  objekte: [{ id: clue.id, name: 'Roberts Ecktisch', typ: 'objekt', actions: ['BEOBACHTEN', 'ERKUNDEN'], spur: true }],
  items: [{ id: 'notizbuch', name: 'Notizbuch', typ: 'item' }],
});
context.getNpcsAtCurrentLocation = () => [voss];
expectedNpcId = voss.id;
calls.npc = 0;

const container = new FakeElement('div');
context._renderEngineMenu(container, {});
assert(container.querySelector('.hauptui-action-menu'), 'menu must render');
const quickActions = new FakeElement('div');
quickActions.className = 'hauptui-quick-actions';
container.appendChild(quickActions);

const vossButton = byText(container, voss.name);
assert(vossButton, 'Voss target missing; buttons=' + all(container).filter((element) => element.tagName === 'button').map(visibleText).join(' | '));
assert(visibleText(vossButton).includes('Hinweis'), 'person target must mark reachable clue');
assert(!visibleText(vossButton).includes('Befragen/Bestechen'), 'person target must not expose clipped raw clue actions');
vossButton.onTap();
assert(context.caseProgress.uiAuditLog.some((event) => event.kind === 'ZIEL AUSGEWAEHLT' && event.label === voss.name), 'target clicks must enter the UI audit');
assert(context.logEntries[0].uiSnapshots.some((snapshot) => snapshot.kontext === 'Haupt-UI'), 'visible Haupt-UI state must attach to the current scene');
assert(container.children.indexOf(container.querySelector('.hauptui-action-menu')) < container.children.indexOf(quickActions), 're-rendered menu must remain above travel and sleep actions');
let execute = all(container).find((element) => element.className === 'hauptui-execute');
assert(execute && !execute.disabled, 'person command must be executable');
execute.onTap();
assert(context.caseProgress.uiAuditLog.some((event) => event.kind === 'AUSFUEHREN-BUTTON' && event.label === 'Rede mit'), 'execute clicks must enter the UI audit');
assert.strictEqual(calls.npc, 1, 'person command must open the real NPC menu');
assert.strictEqual(calls.npcModus, 'szene', 'Rede mit must exclude party-management actions');
assert.strictEqual(calls.npcDirekt, true, 'Rede mit must directly execute an unambiguous conversation');
assert(!all(container).some((element) => element.className.split(' ').includes('is-selected')), 'executed commands must clear their yellow selection state');

byText(container, 'Roberts Ecktisch').onTap();
execute = all(container).find((element) => element.className === 'hauptui-execute');
assert(execute && !execute.disabled, 'clue command must be executable');
assert(visibleText(execute).includes('Schau an'), 'clue command must recommend the configured BEOBACHTEN action');
execute.onTap();
assert.strictEqual(calls.fund, 0, 'specific clue command must not open a click-collect dialog');
assert.strictEqual(calls.options[calls.options.length - 1]._pendingIndizId, clue.id, 'clue command must start an AI investigation scene');
assert.strictEqual(context.caseProgress.pendingHauptuiIndiz.id, clue.id, 'clue must remain pending until the AI scene commits');
assert.strictEqual(calls.marks, 0, 'clue must not be booked on the initial click');
context._hauptuiPendingIndizEinloesen({ szene: 'Mikroszene' });
assert.strictEqual(calls.marks, 1, 'accepted AI scene must deterministically book the clue');
assert.strictEqual(calls.flushes, 1, 'accepted AI scene must show the clue reward');
assert.strictEqual(context.caseProgress.pendingHauptuiIndiz, null, 'pending clue must clear after commit');
context._renderEngineMenu(container, {});
assert(!byText(container.querySelector('.hauptui-action-menu'), 'Beobachte'), 'new evidence alone must not reopen generic observation loops at the same stage');

const clueLocations = [
  {
    place: 'Hinterhof Sybelstrasse',
    people: [{ id: 'frau_pohl', name: 'Frau Pohl', typ: 'person', hinweis: true, hinweisAktionen: ['Befragen'] }],
    objects: [{ id: 'tuerschild_hauke', name: 'Klingelschilder prüfen', typ: 'objekt', actions: ['ERKUNDEN', 'DURCHSUCHEN'] }],
    expected: ['Frau Pohl', 'Klingelschilder prüfen'],
  },
  {
    place: 'Kessler-Wohnung Charlottenburg',
    people: [{ id: 'edith_kessler', name: 'Edith Kessler', typ: 'person', hinweis: true, hinweisAktionen: ['Ansprechen', 'Befragen'] }],
    objects: [],
    expected: ['Edith Kessler'],
  },
  {
    place: 'Spedition Schmidt Moabit',
    people: [{ id: 'norbert_tetzlaff', name: 'Norbert Tetzlaff', typ: 'person', hinweis: true, hinweisAktionen: ['Befragen', 'Bestechen'] }],
    objects: [{ id: 'briefchen_ilse', name: 'Roberts Schreibtisch durchsuchen', typ: 'objekt', actions: ['ERKUNDEN', 'DURCHSUCHEN'] }],
    expected: ['Norbert Tetzlaff', 'Roberts Schreibtisch durchsuchen'],
  },
  {
    place: 'Cafe Wien',
    people: [{ id: 'oberkellner_voss', name: 'Oberkellner Voss', typ: 'person', hinweis: true, hinweisAktionen: ['Ansprechen', 'Befragen'] }],
    objects: [{ id: 'robert_tisch_beobachtet', name: 'Vom Ecktisch aus beobachten', typ: 'objekt', actions: ['BEOBACHTEN', 'ERKUNDEN'] }],
    expected: ['Oberkellner Voss', 'Vom Ecktisch aus beobachten'],
  },
];
context.deriveInteractionMode = () => 'locked';
for (const location of clueLocations) {
  context.engineCurrentLocation = { name: location.place };
  context.window.__hauptuiActionState = { verb: null, targetKey: null };
  context._baukastenZiele = () => ({ personen: location.people, objekte: location.objects, items: [] });
  context._ortsFundIndizienErreichbar = () => location.objects.map((object) => ({ id: object.id, text: object.name }));
  context._renderEngineMenu(container, {});
  assert(container.querySelector('.hauptui-action-menu'), location.place + ' must render its menu during the final locked render');
  for (const target of location.expected) assert(byText(container, target), location.place + ' is missing target ' + target);
  assert(!byText(container, location.place), location.place + ' must be implicit instead of a repeated target button');
  const personButton = byText(container, location.people[0].name);
  personButton.onTap();
  assert(byText(container, 'Rede mit'), location.place + ' person mode must offer conversation');
  assert(byText(container, 'Schau an'), location.place + ' person mode must offer observation');
  assert(!byText(container, 'Warte'), location.place + ' person mode must not offer targetless waiting');
  assert(!byText(container, 'Versteck dich'), location.place + ' person mode must not offer targetless hiding');
  assert(!byText(container, 'Gib'), location.place + ' person mode must not offer giving without an item');
}

context._baukastenZiele = () => ({ personen: [], objekte: [], items: [] });
context._ortsFundIndizienErreichbar = () => [];
context._renderEngineMenu(container, {});
const searchButton = byText(container, 'Durchsuche');
assert(searchButton, 'empty locations must still offer Durchsuche');
assert(!byText(container, 'Beobachte'), 'empty locations must not offer random generic observation scenes');
assert(!byText(container, 'Lausche'), 'empty locations must not offer random generic listening scenes');
assert(!byText(container, 'Umsehen'), 'redundant Umsehen action must stay removed');
assert(!byText(container, 'Versteck dich'), 'generic hiding must stay out of normal location mode');
assert(!byText(container, 'Warte'), 'generic waiting must stay out of normal location mode');
searchButton.onTap();
execute = all(container).find((element) => element.className === 'hauptui-execute');
assert(execute && !execute.disabled, 'Durchsuche must stay executable without targets');

const kesslerPlaces = [
  'Hinterhof Sybelstrasse',
  'Kessler-Wohnung Charlottenburg',
  'Spedition Schmidt Moabit',
  'Karl Mauers Büro',
  'Doc Wagners Praxis',
  'Cafe Wien',
  'Polizei Hardenbergstrasse',
  'Bahnhof Charlottenburg',
  'Karls Opel Olympia',
  'S-Bahnhof Friedrichstrasse',
];
for (const place of kesslerPlaces) {
  context.engineCurrentLocation = { name: place };
  context.window.__hauptuiActionState = { verb: null, targetKey: null };
  context._renderEngineMenu(container, {});
  assert(!byText(container, place), place + ' must not repeat as a visible target');
  assert(byText(container, 'Durchsuche'), place + ' must expose searching through the implicit location');
  assert(!byText(container, 'Beobachte'), place + ' must not expose random generic observation');
  assert(!byText(container, 'Lausche'), place + ' must not expose random generic listening');
  assert(!byText(container, 'Umsehen'), place + ' must not expose redundant Umsehen');
  assert(!byText(container, 'Versteck dich'), place + ' must not expose generic hiding');
  assert(!byText(container, 'Warte'), place + ' must not expose generic waiting');
  byText(container, 'Durchsuche').onTap();
  execute = all(container).find((element) => element.className === 'hauptui-execute');
  assert(execute && !execute.disabled, place + ' must offer an executable implicit location action');
  assert(!visibleText(execute).includes(place), place + ' must not repeat in the execute label');
}

assert(html.includes('function _hauptuiItemVerben(target)'), 'inventory must expose contextual Haupt-UI verbs');
assert(html.includes('function _hauptuiPlanDirekt(aktionKey, zielName, item)'), 'inventory escalation must reuse the existing plan/combat path');
assert(html.includes("const pickupObjects = objects.filter(function (target) { return target.fundTyp === 'item'; });"), 'loose pickups must be split from investigation clues');
assert(html.includes("{ key: 'fundstuecke', label: 'Fundstücke am Ort', tag: 'Nimm', targets: pickupObjects }"), 'pickups need their own visible target group');
assert(html.includes('.hauptui-target-list > :only-child { grid-column: auto; }'), 'single targets must not stretch into full-width bars');
assert(html.includes("{ key: 'items', label: 'Inventar', tag: 'Inventar', targets: data.items || [] }"), 'inventory needs a distinct visible target group');
assert(html.includes("button.dataset.targetKind = kind;"), 'target buttons must expose semantic kind for styling and audits');
assert(html.includes('.hauptui-target.type-person') && html.includes('.hauptui-target.type-loot') && html.includes('.hauptui-target.type-item'), 'target roles must render with distinct visual classes');
assert(!html.includes("if (mode === 'combat' || mode === 'escape'"), 'combat mode must not hide the Haupt-UI while the old arena is disabled');
assert(/if \(showRomanceButton\)[\s\S]{0,2600}?window\.HAUPTUI_AKTIV && typeof hauptuiQuickActions !== 'undefined'[\s\S]{0,160}?appendChild\(romBtn\)/.test(html), 'romance must render as a compact Haupt-UI quick action');
assert(/if \(showOvernightButton\)[\s\S]{0,2600}?window\.HAUPTUI_AKTIV && typeof hauptuiQuickActions !== 'undefined'[\s\S]{0,160}?appendChild\(overnightBtn\)/.test(html), 'overnight romance must render as a compact Haupt-UI quick action');
calls.plan = [];
calls.planExecuted = 0;
const hostile = { id: 'mantelmann', name: 'Mann im grauen Mantel', tag: 'STASI', rolle: 'Agent', typ: 'person' };
const toaster = { id: 'toaster1', name: 'Toaster (AEG, Vorkriegsmodell)', typ: 'item' };
context.deriveInteractionMode = () => 'combat';
context.engineCurrentLocation = { name: 'Hinterhof Sybelstrasse' };
context.window.__hauptuiActionState = { verb: null, targetKey: null };
context._baukastenZiele = () => ({ personen: [hostile], objekte: [], items: [toaster] });
context.getNpcsAtCurrentLocation = () => [hostile];
context._itemsBeiKarl = () => [toaster];
context._npcIstFeindlich = (npc) => npc && npc.name === hostile.name;
context._freieFeindeAmOrt = () => [hostile];
context._npcZustandGet = () => null;
context._itemKatalogEintrag = () => ({ name: toaster.name, taugt: ['angreifen_mit', 'werfen', 'werfen_fuesse'], schaden: 'benommen', fragil: true });
context.BAUKASTEN_AKTIONEN = {
  werfen: { label: 'Ins Gesicht werfen', zielNoetig: true, itemNoetig: true, itemVerlust: true, txt: (a, i, z) => a + ' wirft ' + i.name + ' auf ' + z + '.' },
  angreifen_mit: { label: 'Angreifen mit', zielNoetig: true, itemNoetig: true, _itemAngriff: true, txt: (a, i, z) => a + ' schlaegt mit ' + i.name + ' auf ' + z + '.' },
  werfen_fuesse: { label: 'Vor die Fuesse werfen', zielNoetig: true, itemNoetig: true, itemVerlust: true, txt: (a, i, z) => a + ' wirft ' + i.name + ' vor ' + z + '.' },
  angreifen: { label: 'Angreifen', zielNoetig: true, wirkung: 'ko', txt: (a, i, z) => a + ' greift ' + z + ' an.' },
};
context._planAdd = (entry) => { calls.plan.push(entry); return true; };
context._planAusfuehren = () => { calls.planExecuted += 1; };
context._renderEngineMenu(container, {});
assert(container.querySelector('.hauptui-action-menu'), 'combat mode must still render the Haupt-UI menu');
const hostileButton = byText(container, hostile.name);
assert(hostileButton, 'hostile target must be visible in combat');
hostileButton.onTap();
assert(byText(container, 'Drohe'), 'hostile person mode must expose pressure/escalation');
assert(byText(container, 'Greife an'), 'hostile person mode must expose direct attack');
const toasterButton = byText(container, toaster.name);
assert(toasterButton, 'inventory item must be visible in combat');
assert.strictEqual(toasterButton.dataset.targetKind, 'item', 'inventory target must be marked as inventory, not a generic button');
toasterButton.onTap();
assert(byText(container, 'Wirf'), 'throwable inventory must expose Wirf when a hostile target is present');
assert(byText(container, 'Lenk ab'), 'throwable inventory must expose an actual distraction verb');
assert(byText(container, 'Schlag zu'), 'weapon-like inventory must expose item attack');
byText(container, 'Wirf').onTap();
execute = all(container).find((element) => element.className === 'hauptui-execute');
assert(execute && !execute.disabled && visibleText(execute).includes('Wirf'), 'inventory throw command must be executable');
execute.onTap();
assert.strictEqual(calls.planExecuted, 1, 'inventory throw must execute through the plan/combat path');
assert.strictEqual(calls.plan[0].art, 'werfen', 'inventory throw must use the existing werfen action');
assert.strictEqual(calls.plan[0].ziel, hostile.name, 'inventory throw must auto-target the present hostile NPC');
assert.strictEqual(calls.plan[0].itemId, toaster.id, 'inventory throw must carry the selected item id for item loss/effects');

const targetsStart = html.indexOf('function _baukastenZiele()');
const targetsEnd = html.indexOf('try { window._baukastenZiele', targetsStart);
const targetContext = {
  window: { HAUPTUI_AKTIV: true },
  engineCurrentLocation: { name: 'Kessler-Wohnung Charlottenburg' },
  normForMatch: (value) => String(value || '').toLowerCase(),
  getNpcsAtCurrentLocation: () => [],
  getCaseLocations: () => [{ name: 'Kessler-Wohnung Charlottenburg', npcs: [{ id: 'edith_kessler', immer: true }] }],
  _aktTageszeitName: () => 'abend',
  _resolveNpcIdentity: () => ({ id: 'edith_kessler', name: 'Edith Kessler', tag: 'CLIENT' }),
  _npcHatOffenenHinweis: () => true,
  _npcOffeneHinweisAktionen: () => ['Ansprechen', 'Befragen'],
  _ortsFundIndizienErreichbar: () => [],
  _itemsBeiKarl: () => [],
  diag: () => {},
};
vm.createContext(targetContext);
vm.runInContext(html.slice(targetsStart, targetsEnd), targetContext);
const restoredTargets = targetContext._baukastenZiele();
assert.strictEqual(restoredTargets.personen.map((person) => person.name).join(','), 'Edith Kessler', 'location-wide map clue must restore Edith even when the exploration subnode returns no NPC');

console.log('HAUPTUI_KESSLER_10_ORTE_OK');
