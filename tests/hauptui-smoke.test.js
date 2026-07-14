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

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\r\n/g, '\n');

const itemEmojiStart = html.indexOf('function pickItemEmoji(name)');
const itemEmojiEnd = html.indexOf('function pickNpcEmoji(name)', itemEmojiStart);
const itemEmojiContext = {
  normForMatch: (value) => String(value || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'),
};
vm.createContext(itemEmojiContext);
vm.runInContext(html.slice(itemEmojiStart, itemEmojiEnd), itemEmojiContext);
assert.strictEqual(itemEmojiContext.pickItemEmoji('Schweres Nudelholz'), '🪵', 'rolling pin pickup must not use the generic backpack icon');
assert.strictEqual(itemEmojiContext.pickItemEmoji('Gebrauchte Handschellen'), '⛓️', 'handcuffs pickup should have a distinct tactical-item icon');
assert.strictEqual(itemEmojiContext.pickItemEmoji('Kleine Sahnetorte im Pappkarton'), '🍰', 'cake pickup should have a distinct household-item icon');
assert.strictEqual(itemEmojiContext.pickItemEmoji('Bananenschale'), '🍌', 'banana peel pickup should have a distinct slapstick-item icon');
assert.strictEqual(itemEmojiContext.pickItemEmoji('Kurzes Brecheisen'), '🔧', 'crowbar pickup should have a distinct tool icon');
assert.strictEqual(itemEmojiContext.pickItemEmoji('Brechstange'), '🔧', 'crowbar synonym must not fall back to the backpack icon');
assert.strictEqual(itemEmojiContext.pickItemEmoji('Kuhfuß'), '🔧', 'colloquial crowbar synonym must not fall back to the backpack icon');
assert.strictEqual(itemEmojiContext.pickItemEmoji('Walther PPK (eigene Pistole)'), '🔫', 'Karl\'s pistol should have a distinct weapon icon');
assert.strictEqual(itemEmojiContext.pickItemEmoji('Brieftasche mit Detektiv-Lizenz'), '👛', 'Karl\'s wallet should have a distinct wallet icon');
assert.strictEqual(itemEmojiContext.pickItemEmoji('Notizbuch und Bleistift'), '📓', 'Karl\'s notebook should have a distinct notebook icon');

const itemCatalogStart = html.indexOf('const ITEM_KATALOG = {');
const itemCatalogEnd = html.indexOf('// v7.12.631 (Benjamin: "eintauschen', itemCatalogStart);
const catalogNames = Array.from(html.slice(itemCatalogStart, itemCatalogEnd).matchAll(/name:\s*'([^']+)'/g), (match) => match[1]);
assert(catalogNames.length >= 17, 'item-icon audit must cover the complete tactical item catalog');
catalogNames.forEach((name) => {
  assert.notStrictEqual(itemEmojiContext.pickItemEmoji(name), '🎒', 'catalog item must not use generic backpack icon: ' + name);
});

const physicalEvidenceNames = Array.from(html.matchAll(/itemType:\s*'[^']+'\s*,\s*text:\s*'([^']+)'/g), (match) => match[1]);
assert(physicalEvidenceNames.length >= 5, 'item-icon audit must cover physical case evidence');
physicalEvidenceNames.forEach((name) => {
  assert.notStrictEqual(itemEmojiContext.pickItemEmoji(name), '🎒', 'physical evidence must not use generic backpack icon: ' + name);
});

assert(html.includes('function _fahrtStrandungsOrt(startName, zielLoc)'), 'roadside stops should resolve to a mapped location');
assert(html.includes('function _fahrtAmKartenortStranden(startName, zielLoc, grund)'), 'roadside stop state helper should exist');
assert(html.includes('caseProgress.strandungsOrt = {'), 'roadside stop should persist its mapped location');
assert(!html.includes("engineCurrentLocation = { name: 'Karls Opel Olympia', sektor: 'Mobil', transient: true, vorherOrt: _vorherAlk };"), 'alcohol stop must not create a phantom Opel location');
assert(!html.includes("engineCurrentLocation = { name: 'Karls Opel Olympia', sektor: 'Mobil', transient: true, vorherOrt: _vorherFahrt };"), 'fatigue stop must not create a phantom Opel location');
assert(html.includes('_schlafenVorOrt: _schlaeftAlkEin'), 'severe intoxication should sleep at the mapped roadside location');
assert(html.includes('NOTFLUCHT-PROSA korrigiert'), 'contradictory emergency escape prose should be corrected');
assert(html.includes('const _festnahmeVarianten = ['), 'custody entry should use multiple arrest variants');
assert(html.includes('const _festnahmeZeit ='), 'custody entry should respect time of day');
assert(html.includes("if (romance.canApproach) return { key: 'naeher', label: 'Näher kommen' }"), 'Haupt-UI should expose romance directly beside person actions');
assert(html.includes("if (verb === 'naeher' || verb === 'nacht')"), 'Haupt-UI should execute romance without opening the NPC submenu');
assert(!html.includes('function _hauptuiExecuteLegacyVor1155'), 'obsolete Haupt-UI executor must be removed instead of shadowing live actions');
assert(html.includes('if (showRomanceButton && !window.HAUPTUI_AKTIV)'), 'legacy romance button must not duplicate the Haupt-UI action');

assert(html.includes('function _nachtHatErreichbareErmittlung()'), 'night guidance should inspect whether evidence is currently reachable');
assert(html.includes('NACHT OHNE ERREICHBARE SPUR'), 'AI recap should narratively guide Karl toward sleep when the city offers no reachable clue');
assert(html.includes("return localStorage.getItem('hauptui') !== '0'; // Default: neue Haupt-UI"), 'Haupt-UI must be the default without ?hauptui=1');
assert(html.includes("abc=(1|on|true)") && html.includes("localStorage.setItem('hauptui', '0')"), 'old A/B/C/D UI must remain available only as an explicit backup switch');
assert(html.includes("window.HAUPTUI_AKTIV && window.__hauptuiExplicitParam"), 'Haupt-UI activation toast must not appear on normal default starts');
assert(html.includes("if (typeof window !== 'undefined' && window.HAUPTUI_AKTIV) includeOptions = false;"), 'scene speaker in Haupt-UI must not read legacy A/B/C/D option lists');
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
assert(html.includes('function _hauptuiVerhoerNpc(target)'), 'Haupt-UI needs a direct dossier profile resolver');
assert(html.includes("if (verhoerNpc && (!z || ['gefesselt', 'fixiert', 'benommen'].indexOf(z.status) !== -1)) add('reden', 'Rede mit');"), 'bound/fixed profile NPCs must remain interrogatable');
assert(html.includes('oeffneVerhoerAkte(verhoerNpc);'), 'Rede mit must open the dossier directly for profile NPCs');
assert(html.includes('grid-template-columns: 40px minmax(0, 1fr) minmax(72px, max-content);'), 'travel quick action needs stable icon, title and destination columns');
assert(html.includes('height: 42px;\n    min-height: 42px;'), 'quick actions need fixed height so Opel and sleep align consistently');
assert(html.includes('.hauptui-quick-actions .option-text-wrap {\n    display: contents;'), 'desktop quick actions must place title and marker in separate grid columns');
assert(html.includes('.hauptui-quick-actions .option-marker {\n    display: flex;\n    align-items: center;\n    justify-content: flex-end;\n    align-self: stretch;'), 'quick-action markers must be vertically centered text, not top-aligned badges');
assert(html.includes('padding: 0;\n    border: 0;\n    background: transparent;\n    border-radius: 0;'), 'quick-action markers must not render as nested mini-buttons');
assert(html.includes("reise.style.cssText = 'display:flex;width:100%;min-height:44px;padding:8px 14px;"), 'map detail travel button must be compact flex-aligned');
assert(html.includes("opelMiniSvg(16)") && html.includes('Dorthin reisen</span>'), 'map detail travel button must wrap Opel icon and text in aligned spans');
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
assert(html.includes('function _renderCustodyMenu(container)'), 'custody must retain deterministic Haupt-UI actions');
assert(html.includes("if (mode === 'custody')"), 'custody must render its menu instead of hiding every main action');
assert(html.includes('caseProgress.getrennteBegleiter = getrennt;'), 'custody must separate companions from Karl instead of teleporting them into his cell');
assert(html.includes('GEWAHRSAM trennt Begleiter'), 'custody companion separation needs diagnostics');
assert(html.includes("if (/lilo brenner/i.test(npcName || '')) return 1;"), 'Lilo must require a small exchange before joining a dangerous trip');
assert(!html.includes("showProgressToast('Lange Nacht'"), 'fatigue guidance must stay in scene prose instead of a separate sleep toast');
assert(html.includes('ZUSAMMENGEBROCHEN - FALL OFFEN'), 'zero-health ending must state clearly that the case remains unsolved');
assert(html.includes('const CUSTODY_SCENE_IMAGE = {'), 'custody needs a dedicated interior scene image');
assert(html.includes("file: 'hohenschoenhausen-zelle.png'"), 'custody scene must use the cell asset instead of the exterior gate');
assert(html.includes('let spec = istGewahrsam ? CUSTODY_SCENE_IMAGE'), 'custody state must override ordinary location image matching');
assert(html.includes("showProgressToast('Gleich bereit'"), 'execute must explain transient API locks instead of silently doing nothing');
assert(html.includes("showProgressToast('Nicht erreichbar'"), 'execute must explain stale person targets instead of silently doing nothing');
assert(html.includes('function _hauptuiNarrativerFadenPrompt(ortName, scenesHere)'), 'open threads must feed the narrative prompt compass');
assert(html.includes('NARRATIVER FADEN-KOMPASS'), 'prompt compass must be explicit enough to steer prose');
assert(html.includes('function _hauptuiKesslerRobertAbpassenNoetig()'), 'Kessler Robert thread needs a deterministic abpassen bridge when Robert is absent');
assert(html.includes("id: 'robert_abpassen'"), 'Kessler courtyard must expose a concrete Robert abpassen target instead of a dead thread');
assert(html.includes("targetIds: ['robert_kessler', 'robert_abpassen']"), 'Robert contradiction thread must target either Robert or the abpassen bridge');
assert(html.includes("_np.push(Object.assign({}, ident, { id: 'robert_kessler'"), 'Robert abpassen must force Robert back into the Haupt-UI person list');
assert(html.includes('GEFAHR-AUSZAHLUNG (KRITISCH)'), 'engine-spawned danger must be forced to pay off in prose instead of disappearing offscreen');
assert(html.includes('function _konfrontationAusProsa(scene, cast)'), 'clear prose-only attacks must create a playable confrontation');
assert(html.includes("trigger: bewaffneteGruppe ? 'prosa-drohung' : 'prosa-angriff'"), 'armed blockers must become playable before they strike');
assert(html.includes('window._healerMenuState = { doc: !!showWagnerHealButton, marlene: !!showMarleneHealButton }'), 'healer availability must be shared with the Haupt-UI');
assert(html.includes('if (showWagnerHealButton && !window.HAUPTUI_AKTIV)'), 'Doc healing must not remain as a duplicate quick action in Haupt-UI');
assert(html.includes('if (showMarleneHealButton && !window.HAUPTUI_AKTIV)'), 'Marlene healing must not remain as a duplicate quick action in Haupt-UI');
assert(html.includes('=== AKTIVE KONFRONTATION (PFLICHT, v7.12.1171) ==='), 'active confrontation state must be explicit in the scene prompt');
assert(html.includes('const ITEM_TAKTIK_DEFAULTS = {'), 'items need tactical tags for confrontation choices');
assert(html.includes('function _konfrontationTaktikProfil(npc, threat)'), 'confrontations need tactical enemy profiles');
assert(html.includes('function _hauptuiKonfrontationItemPlan(item, verb, takt)'), 'confrontation inventory must be scored against enemy weaknesses');
assert(/bohnenkaffee:\s*\['ware','bestechung','sozial','ablenkung','blendend','kleiner vorteil'\]/.test(html), 'Bohnenkaffee must be tagged as tactical distraction/blinding item');
assert(/bohnenkaffee:\s*\{ name: 'Päckchen Bohnenkaffee', taugt: \[[^\]]*'werfen'[^\]]*'werfen_fuesse'/.test(html), 'Bohnenkaffee must be offered as a throwable confrontation item');
assert(html.includes("tags.indexOf('blendend') !== -1"), 'confrontation scoring must recognize blinding item tags');
assert(html.includes('window.__hauptuiKonfrontationState'), 'confrontations must use the same select-then-execute rhythm as the main UI');
assert(html.includes('AUSFUEHREN-KONFRONTATION'), 'confrontation choices must be confirmed through an execute button');
assert(!html.includes('_hauptuiBind(btn, function () { _hauptuiKonfrontationAktion(act.key, enemy, null);'), 'confrontation base actions must not fire directly on first click');
assert(!html.includes('_hauptuiBind(btn, function () { _hauptuiKonfrontationAktion(act.verb, enemy, act.item);'), 'confrontation item actions must not fire directly on first click');
assert(html.includes('requiresItemAny') && html.includes('requiresItemAll'), 'threat spawns must support item-gated ambushes');
assert(html.includes('TAKTISCHE LAGE'), 'active confrontation prompt must expose tactical constraints');
assert(html.includes('Diese Konfrontation ist runden-/entscheidungsbasiert, NICHT Tempo/Reflex'), 'combat prompt must frame tactical decisions instead of speed');
assert(html.includes('massiver_schlaeger') && html.includes('nervoeser_messer_mann'), 'Krause thugs need distinct tactical profiles');
assert(html.includes('OFFSCREEN-VERLETZUNGEN VERBOTEN'), 'injury prose must not invent unseen causes retroactively');
assert(html.includes('ORTSWECHSEL-SCHABLONEN'), 'repeated travel openings need an explicit anti-template rule');
assert(html.includes('Historische Ortsdetails müssen ZEITLICH UND RÄUMLICH stimmen'), 'historical texture must also be spatially plausible, not just dated correctly');
assert(html.includes('Marx-Engels-Platz/S-Bahnhof Marx-Engels-Platz ist NUR'), 'Marx-Engels-Platz must be limited to plausible east/base or transit contexts');
assert(html.includes('function _abschlussOffeneGebundenePersonenText()'), 'resolved cases need a fallback for still-bound or knocked-out NPCs');
assert(html.includes('OFFENE GEBUNDENE PERSONEN VOR ABSCHLUSS'), 'the resolve prompt must force dangling bound NPCs to be paid off in the finale');
assert(html.includes('${_offeneLageZeile}'), 'the solved screen must surface unresolved bound-person cleanup if the AI skips it');
assert(html.includes('let _reiseFreiDurchOrtsausgang = false;'), 'public investigation locations need an exit override so high tension cannot hide travel completely');
assert(html.includes('const _reiseGesperrtRoh = (!window.HAUPTUI_AKTIV) && (currentSpannung >= 4)'), 'Haupt-UI travel must not disappear because of tension alone');
assert(html.includes('const _reiseDurchBildErsetzt = _ausgangImBild && !window.HAUPTUI_AKTIV;'), 'scene image exits must not replace the visible Haupt-UI travel button');
assert(html.includes("const _reiseGesperrt = (_reiseGesperrtRoh || _klientGateAktiv) && !_reiseFreiDurchFlucht && !_reiseFreiDurchOrtsausgang;"), 'travel gating must keep usable exits available unless combat/custody/client gate blocks them');
assert(html.includes('function _verhoerAutoScroll()'), 'Verhoerakte must keep the protocol scrolled to the latest exchange');
assert(html.includes("const prot = ov.querySelector('.protokoll');"), 'Verhoerakte auto-scroll must target only the protocol area');
assert(html.includes('prot.scrollTop = prot.scrollHeight;'), 'Verhoerakte protocol must jump to the newest text after render');
assert(html.includes('requestAnimationFrame(function ()'), 'Verhoerakte auto-scroll must repeat after layout settles');
assert(html.includes('panel.innerHTML = h;\n  _verhoerAutoScroll();'), 'Verhoerakte render must trigger protocol auto-scroll immediately');
assert(html.includes('function _verhoerDisplayText(s)'), 'Verhoerakte must normalize display text through one central helper');
assert(html.includes("return (typeof asciiToUmlaut === 'function') ? asciiToUmlaut(raw) : raw;"), 'Verhoerakte display helper must reuse the curated umlaut normalizer');
assert(html.includes('function _verhoerAussageStatusKey(status)'), 'Verhoerakte must normalize stored assertion status values');
assert(html.includes("_verhoerAussageStatusText(a && a.status)"), 'Verhoerakte assertion badges must display canonical umlaut status text');
assert(html.includes("_verhoerThemenSortiert(npcId, s).map"), 'Verhoerakte topic order must not keep risky options predictably last');
assert(html.includes("_verhoerRichEsc(failText)"), 'Verhoerakte fail text must normalize umlauts while preserving allowed dossier markup');
assert(html.includes("[/\\bKurfuerstendamm\\b/g, 'Kurfürstendamm']"), 'Verhoerakte cafe dossier needs Kurfuerstendamm displayed with umlaut');
assert(html.includes("[/\\bGedaechtnis\\b/g, 'Gedächtnis']"), 'Verhoerakte cafe dossier needs Gedaechtnis displayed with umlaut');
assert(!html.includes("Karl denkt nach (' + activeLabel"), 'gameplay loading text must not expose the active model label');
assert(html.includes('function renderHowToAktuell()'), 'how-to page must be rendered from the current Haupt-UI concept');
assert(html.includes('<h2>WIE DU SPIELST</h2>'), 'how-to page must use player-facing language');
assert(!html.includes('So funktioniert\'s (bitte einmal lesen)'), 'start screen must not present the optional help as required reading');
assert(!html.includes('<h3>Haupt-UI</h3>'), 'how-to page must not expose internal UI terminology');
assert(!html.includes('Erst der goldene <strong>Ausführen</strong>-Knopf'), 'how-to page must not explain actions through a changeable button color');
assert(!html.includes('Beleg-Gates:'), 'how-to page must not expose engine terminology');
assert(html.includes('<h3>Offene Fäden</h3>'), 'how-to page must explain open investigation threads');
assert(html.includes('<h3>Verhörakte</h3>'), 'how-to page must explain dossier interrogations');
assert(html.includes('<h3>Unterwegs</h3>'), 'how-to page must explain travel, sleep, and healing in player-facing language');
assert(html.includes('<h3>Gefahr</h3>'), 'how-to page must explain tactical confrontations');
assert(html.includes('NARRATIVE NACHT-FUEHRUNG:'), 'night scenes must narratively suggest sleep when no urgent night lead remains');
assert(html.includes('KEINE brechend volle Halle'), 'night stations must not default to daytime crowd density');
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

const calls = { npc: 0, fund: 0, options: [], marks: 0, flushes: 0, saves: 0, toasts: [] };
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
  _verhoerProfilFuer: (npc) => npc && npc.id === 'norbert_tetzlaff' ? 'norbert_tetzlaff' : null,
  _zeigeFundAuswahl: (items, clues) => { calls.fund += 1; calls.fundItems = items; calls.fundClues = clues; },
  chooseOption: (option) => calls.options.push(option),
  saveGameState: () => { calls.saves += 1; },
  _findeIndizById: (id) => id === clue.id ? clue : null,
  _markiereIndizGefunden: (indiz) => { calls.marks += 1; context.caseProgress.gefundeneIndizIds.push(indiz.id); return true; },
  _flushIndizRewards: () => { calls.flushes += 1; },
  showProgressToast: (...args) => calls.toasts.push(args),
  zeigeMiniAuswahl: () => {},
  npcInteraktion: () => {},
  _itemKatalogEintrag: () => null,
  diag: () => {},
};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

const finishedWitness = { id: 'hertha_wessel', name: 'Hertha Wessel', typ: 'person', tag: 'FAMILY', erledigt: true };
assert.deepStrictEqual(Array.from(context._hauptuiPersonVerben(finishedWitness, {})), [], 'a fully exhausted witness must expose no repeat conversation action');
assert.strictEqual(context._hauptuiZielHinweis(finishedWitness, 'Person'), 'Ausgesprochen', 'a fully exhausted witness must remain visibly marked as completed');
const finishedRomance = { id: 'liesel_test', name: 'Liesel Test', typ: 'person', tag: 'ROMANCE', erledigt: true };
context.window._romanceMenuState = { npc: 'Liesel Test', canApproach: true, canOvernight: false };
assert.deepStrictEqual(Array.from(context._hauptuiPersonVerben(finishedRomance, {})).map((verb) => verb.key), ['naeher'], 'an exhausted romance NPC must remain selectable for direct approach');
assert.strictEqual(context._hauptuiEmpfohleneAktion(finishedRomance), 'naeher', 'selecting an exhausted romance NPC should preselect approach');
assert.strictEqual(context._hauptuiZielHinweis(finishedRomance, 'Person'), 'Nähe möglich', 'an exhausted romance NPC must not look disabled');
context.window._romanceMenuState = null;
const finishedMarlene = { id: 'marlene_wagner', name: 'Marlene Wagner', typ: 'person', erledigt: true };
context.window._healerMenuState = { doc: false, marlene: true };
assert.deepStrictEqual(Array.from(context._hauptuiPersonVerben(finishedMarlene, {})).map((verb) => verb.key), ['heilen_marlene'], 'an exhausted Marlene must remain selectable for treatment');
assert.strictEqual(context._hauptuiEmpfohleneAktion(finishedMarlene), 'heilen_marlene', 'selecting exhausted Marlene should preselect treatment');
assert.strictEqual(context._hauptuiZielHinweis(finishedMarlene, 'Person'), 'Behandlung möglich', 'available healing must replace the exhausted badge');
context.window._healerMenuState = { doc: true, marlene: false };
assert.deepStrictEqual(Array.from(context._hauptuiPersonVerben({ id: 'doc_wagner', name: 'Doc Wagner', typ: 'person' }, {})).map((verb) => verb.key), ['reden', 'heilen_doc'], 'Doc Wagner must expose conversation and treatment together');
context.window._healerMenuState = null;

const directRomance = { id: 'lilo_brenner', name: 'Lilo Brenner', typ: 'person' };
context.getNpcsAtCurrentLocation = () => [directRomance];
context._hauptuiExecute('naeher', directRomance);
assert.strictEqual(calls.options[calls.options.length - 1].id, 'HAUPTUI_ROMANTIK', 'direct romance must execute through the live Haupt-UI path');
assert.strictEqual(calls.options[calls.options.length - 1]._romanceNpc, directRomance.name, 'direct romance must preserve the selected NPC');
const directMarlene = { id: 'marlene_wagner', name: 'Marlene Wagner', typ: 'person' };
context.getNpcsAtCurrentLocation = () => [directMarlene];
context._hauptuiExecute('heilen_marlene', directMarlene);
assert.strictEqual(calls.options[calls.options.length - 1].id, 'MARLENE_HEILEN', 'direct treatment must execute through the live Haupt-UI path');
assert.strictEqual(calls.options[calls.options.length - 1]._marleneHeal, true, 'Marlene treatment must retain its healing marker');
context.getNpcsAtCurrentLocation = () => [voss];

let acquiredFundItem = null;
context._fundItemAufnehmenDirekt = (item) => { acquiredFundItem = item; return true; };
context._ortsFundItems = () => [{ key: 'west_zigaretten', name: 'Schachtel West-Zigaretten', preis: 2 }];
context._hauptuiFundAuswahl({ fundTyp: 'item', id: 'west_zigaretten', name: 'Schachtel West-Zigaretten' }, 'Schachtel West-Zigaretten');
assert(acquiredFundItem && acquiredFundItem.key === 'west_zigaretten', 'Haupt-UI direct pickup must resolve by stable item key');
assert.strictEqual(acquiredFundItem.preis, 2, 'Haupt-UI direct pickup must keep the cafe price for West cigarettes');
context._ortsFundItems = () => [];

context.caseSetup = { klient: 'Edith Kessler', opfer: 'Robert Kessler', tat: 'Beschattung' };
context._istKesslerFallFuerBild = () => true;
context._istKesslerFall = () => /edith kessler|robert kessler/i.test(String(context.caseSetup.klient || '') + ' ' + String(context.caseSetup.opfer || ''));
let faeden = context._hauptuiKesslerFaeden();
assert.deepStrictEqual(Array.from(faeden, (f) => f.id), ['robert_weg', 'wohnung'], 'Kessler must begin with two concrete courtyard questions');
context.caseSetup = { klient: 'Bruno Wessel', opfer: 'Werner Wessel', tat: 'Vermisstenfall' };
assert.deepStrictEqual(Array.from(context._hauptuiKesslerFaeden()), [], 'Wessel must never inherit Kessler investigation threads merely because it has a scene image set');
context.caseSetup = { klient: 'Edith Kessler', opfer: 'Robert Kessler', tat: 'Beschattung' };
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
context.caseProgress.gefundeneIndizIds = ['robert_eintritt_beobachtet', 'tuerschild_hauke', 'ilse_aussage', 'kellner_beobachtung'];
context.engineCurrentLocation = { name: 'Hinterhof Sybelstrasse' };
context.getNpcsAtCurrentLocation = () => [];
context.getCaseLocations = () => [{
  name: 'Hinterhof Sybelstrasse',
  indizien: [{ id: 'robert_aussage', npc: 'robert_kessler', quelle: 'person', actions: ['ANSPRECHEN', 'BEFRAGEN'], abStage: 2 }],
}];
context._aktTageszeitName = () => 'morgen';
context._ortsFundIndizienErreichbar = () => [];
context._ortsFundItems = () => [];
faeden = context._hauptuiKesslerFaeden();
assert.strictEqual(faeden[0].id, 'robert', 'external contradiction proof must keep the Robert thread open');
assert(faeden[0].targetIds.includes('robert_abpassen'), 'Robert thread must expose the abpassen fallback target');
assert.strictEqual(context._hauptuiKesslerRobertAbpassenNoetig(), true, 'morning courtyard without Robert must require the abpassen bridge');
const optionsBeforeAbpassen = calls.options.length;
context._hauptuiUmsehen();
assert.strictEqual(calls.options.length, optionsBeforeAbpassen + 1, 'empty Durchsuche must start Robert abpassen instead of doing nothing');
assert.strictEqual(calls.options[calls.options.length - 1].id, 'HAUPTUI_ROBERT_ABPASSEN', 'Robert abpassen must use the deterministic scene bridge');
assert.strictEqual(context.caseProgress.kesslerRobertAbpassenAktiv, true, 'Robert abpassen must persist a forced availability flag');
assert.strictEqual(context._hauptuiNpc({ id: 'robert_kessler', name: 'Robert Kessler', typ: 'person' }).name, 'Robert Kessler', 'forced Robert target must execute even if the normal time schedule omits him');
context._ortsFundIndizienErreichbar = () => [clue];
context._ortsFundItems = () => [];
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
  assert(!byText(container, 'Schau an'), location.place + ' person mode must not offer a generic observation with no defined progress');
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
  'Goldener Anker',
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
assert(html.includes("_hauptuiHeilerAktion(target) ? 'Behandlung möglich' : 'Ausgesprochen'"), 'finished romance and healer targets must visibly remain actionable');
assert(html.includes('if (target && target.erledigt && !bezwungen) {'), 'finished peaceful conversations need a dedicated action gate');
assert(html.includes('if (romanceAktion) add(romanceAktion.key, romanceAktion.label);'), 'finished romance NPCs must retain romance without another conversation action');
assert(html.includes('const _erledigtOhneSonderaktion = target.erledigt && !_hauptuiRomanceAktion(target) && !_hauptuiHeilerAktion(target);'), 'only finished targets without romance or treatment may be disabled');
assert(html.includes('const ROMANCE_OVERNIGHT_LOCATIONS = {'), 'romance NPCs need deterministic overnight locations');
assert(html.includes("'lilo brenner': { name: 'Lilo Brenners Wohnung in West-Berlin'"), 'Lilo needs a fixed morning location and image');
assert(html.includes('caseProgress.romanceOvernight = {'), 'overnight location must persist as engine state');
assert(html.includes("root: 'assets/scenes/romance/'"), 'romance mornings must use dedicated scene images');
assert(html.includes('if (caseProgress) caseProgress.romanceOvernight = null;'), 'travel must end the romance morning location state');
assert(html.includes('.choice-overlay {'), 'trade and companion dialogs need a shared visual surface');
assert(html.includes("panel.className = 'choice-panel';"), 'trade and companion dialogs must use the shared panel style');
assert(html.includes("actions.className = 'choice-actions';"), 'trade dialog actions need a stable responsive layout');
assert(!html.includes("try { if (typeof fxPartyJoin === 'function') fxPartyJoin(npc.name); } catch (e) {}\n          }\n          // v7.12.756"), 'paid travel companion must not trigger a second party animation');
assert(html.includes("label: 'Näher kommen'"), 'romance action must use the correct umlaut in visible UI');
['rita', 'margot reinig', 'margit hollenbeck', 'annegret vogt-bauer', 'carla winter', 'erika kalewski', 'sonja krell', 'martha brommer', 'greta schliemann', 'dr. ruth kellner', 'lilo brenner', 'eva werder', 'liesel forsthuber'].forEach((name) => {
  assert(html.includes("'" + name + "': { name:"), 'missing deterministic overnight location for ' + name);
});
['morgen-wohnung-ost.png', 'morgen-wohnung-boheme.png', 'morgen-wohnung-west.png'].forEach((file) => {
  assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'romance', file)), 'missing romance morning image ' + file);
});
assert(html.includes("if (angebotPersonen.length && _hauptuiItemTaugt(item, 'anbieten')) add('anbieten', 'Biete an');"), 'offering an item must require a present peaceful NPC');
assert(html.includes('function _hauptuiAngebotPersonen()'), 'item offers need an explicit eligible-recipient list');
assert(html.includes("zeigeMiniAuswahl('Biete an: ' + item.name, 'Wem?'"), 'multiple possible recipients must be chosen by the player');
assert(html.includes("id: 'HAUPTUI_ITEM_ANBIETEN'"), 'a failed plan handoff must still produce a concrete narrated offer');
assert(html.includes('function _hauptuiKarlTrinkt(item)'), 'drinking must create a persistent player state instead of requiring an NPC');
assert(html.includes("caseProgress.alkohol = danach;"), 'drinking must persist Karl alcohol level');
assert(html.includes('=== ALKOHOL ALS WELTZUSTAND (PFLICHT) ==='), 'scene prose must react to Karl alcohol state');
assert(html.includes('ALKOHOL-FAHRTPATZER:'), 'drunk driving must be able to prevent reaching the destination');
assert(!html.includes("add('benutzen', 'Benutze');\n  add('anschauen', 'Schau an');\n  return verbs;"), 'inventory must not expose generic use and inspection for every item');
assert(html.includes('function _hauptuiPlanDirekt(aktionKey, zielName, item)'), 'inventory escalation must reuse the existing plan/combat path');
assert(html.includes("const pickupObjects = objects.filter(function (target) { return target.fundTyp === 'item'; });"), 'loose pickups must be split from investigation clues');
assert(html.includes("if (target && target.fundTyp === 'item') {\n    add('nehmen', 'Nimm');\n    return verbs;\n  }"), 'loose pickup items must offer only direct pickup');
assert(html.includes("{ key: 'fundstuecke', label: 'Fundstücke am Ort', tag: 'Nimm', targets: pickupObjects }"), 'pickups need their own visible target group');
assert(html.includes('.hauptui-target-list > :only-child { grid-column: auto; }'), 'single targets must not stretch into full-width bars');
assert(html.includes("const visibleGroups = groups.filter(function (group) { return group.targets.length > 0; });"), 'target groups need a shared visible group list for stable headings');
assert(html.includes("rightHeading.className = 'hauptui-target-heading';"), 'target section needs one compact inline heading');
assert(html.includes("if (groupIndex > 0)"), 'first target group label must be folded into the main heading instead of wasting a line');
assert(html.includes("executeRow.className = 'hauptui-execute-row';"), 'execute must sit in its own visually separated confirmation row');
assert(html.includes('--hauptui-target-grid: repeat(auto-fit, minmax(min(100%, 220px), 1fr));'), 'target grids must not force fixed-width columns on phones');
assert(html.includes('--hauptui-slot-grid: repeat(auto-fit, minmax(min(100%, 240px), 1fr));'), 'pickup/inventory grids must not overflow narrow screens');
assert(html.includes('.hauptui-target-group-fundstuecke .hauptui-target-list,\n    .hauptui-target-group-items .hauptui-target-list {\n      grid-template-columns: minmax(0, 1fr);'), 'pickup and inventory grids must collapse to one phone-safe column');
assert(html.includes('.options-block.hauptui-options,\n    .ui-kategorien.hauptui-kategorien {\n      margin-left: -8px;\n      margin-right: -8px;'), 'phone Haupt-UI surface should reclaim a little side width');
assert(html.includes("{ key: 'items', label: 'Inventar', tag: 'Inventar', targets: data.items || [] }"), 'inventory needs a distinct visible target group');
assert(html.includes("button.dataset.targetKind = kind;"), 'target buttons must expose semantic kind for styling and audits');
assert(html.includes('.hauptui-target.type-person') && html.includes('.hauptui-target.type-loot') && html.includes('.hauptui-target.type-item'), 'target roles must render with distinct visual classes');
assert(!html.includes("if (mode === 'combat' || mode === 'escape'"), 'combat mode must not hide the Haupt-UI while the old arena is disabled');
assert(html.includes("if (showRomanceButton && !window.HAUPTUI_AKTIV)"), 'romance must not render as a duplicate quick action below the Haupt-UI');
assert(html.includes("if (showOvernightButton && !window.HAUPTUI_AKTIV)"), 'overnight romance must not render as a duplicate quick action below the Haupt-UI');
assert(html.includes("try { _renderEngineMenu(uebergangBody, scene); }"), 'Haupt-UI must refresh as soon as romance availability is known');
assert(html.includes('function _fundItemAufnehmenDirekt(it, opts)'), 'loose pickups need a direct one-click acquire path');
assert(html.includes('function _hauptuiFundTargetMatch(entry, target)'), 'loose pickup matching must compare stable item keys');
assert(html.includes("key: item.key || item.id || item.name"), 'Haupt-UI pickup targets must preserve the item key');
assert(html.includes("preis: (typeof item.preis === 'number') ? item.preis : 0"), 'Haupt-UI pickup targets must preserve the item price');
assert(html.includes('Object.assign(existing, pickupData);'), 'existing scene object duplicates must be upgraded with pickup price data');
assert(html.includes("if (target.fundTyp === 'item' && verb === 'nehmen') { _hauptuiFundAuswahl(target, target.name); return; }"), 'Nimm on a concrete loose pickup must not open a second choice popup');
assert(html.includes('function _fundGuthabenAktualisieren(root)'), 'fund popup needs a live cash refresh helper');
const korn = { id: 'korn-buero', name: 'Flasche Nordhäuser Doppelkorn', typ: 'item' };
context.deriveInteractionMode = () => 'locked';
context.window.__hauptuiActionState = { verb: null, targetKey: null };
context._baukastenZiele = () => ({ personen: [], objekte: [], items: [korn] });
context.getNpcsAtCurrentLocation = () => [];
context._itemsBeiKarl = () => [korn];
context._itemKatalogEintrag = () => ({ name: korn.name, taugt: ['trinken', 'anbieten', 'angreifen_mit', 'werfen', 'werfen_fuesse'] });
context._renderEngineMenu(container, {});
byText(container, korn.name).onTap();
assert(byText(container, 'Trinke'), 'Korn in an empty office must remain drinkable');
assert(!byText(container, 'Biete an'), 'Korn in an empty office must not be offered to nobody');
assert(!byText(container, 'Benutze'), 'Korn must not expose a context-free generic use');
assert(!byText(container, 'Schau an'), 'ordinary inventory must not expose redundant inspection');
context._itemKatalogEintrag = () => null;
context.window.__hauptuiActionState = { verb: null, targetKey: null };
context._renderEngineMenu(container, {});
byText(container, korn.name).onTap();
assert(!byText(container, 'Benutze') && !byText(container, 'Schau an'), 'unknown inventory must not fall back to effectless universal actions');
context._itemKatalogEintrag = () => ({ name: korn.name, taugt: ['trinken', 'anbieten', 'angreifen_mit', 'werfen', 'werfen_fuesse'] });
let consumedKorn = null;
context._itemMove = (id, change) => { consumedKorn = { id, change }; return true; };
context.caseProgress.alkohol = 0;
calls.options.length = 0;
calls.toasts.length = 0;
context._hauptuiExecute('trinken', korn);
assert.strictEqual(context.caseProgress.alkohol, 2, 'executing Trinke must raise Karl alcohol state');
assert(consumedKorn && consumedKorn.id === korn.id && consumedKorn.change.status === 'verbraucht', 'executing Trinke must consume the selected bottle');
assert.strictEqual(calls.options[calls.options.length - 1].id, 'HAUPTUI_ITEM_TRINKEN', 'executing Trinke must request the drinking scene');
assert(!calls.toasts.some((toast) => toast[0] === 'Kein Gegenueber'), 'executing Trinke must never require or offer to another person');
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

targetContext._itemsBeiKarl = () => [
  { id: 'korn_1', name: 'Flasche Nordhäuser Doppelkorn', typ: 'korn' },
  { id: 'korn_2', name: 'Flasche Nordhäuser Doppelkorn', typ: 'korn' },
  { id: 'ziegel_1', name: 'Ziegelstein', typ: 'wurfobjekt' },
];
const groupedInventory = targetContext._baukastenZiele().items;
assert.strictEqual(groupedInventory.length, 2, 'identical inventory items must render as one target');
assert.strictEqual(groupedInventory[0].anzahl, 2, 'grouped inventory target must expose its quantity');
assert.deepStrictEqual(Array.from(groupedInventory[0].itemIds), ['korn_1', 'korn_2'], 'grouped inventory target must retain all real item ids');
assert(html.includes("target.name + (target.anzahl > 1 ? ' ×' + target.anzahl : '')"), 'inventory target label must show the grouped quantity');
assert(html.includes('function _hauptuiAngreifbarePersonen()'), 'items must be usable against an engine-marked suspect or target, not only generic enemies');
assert(!html.includes("wohnung:      ['korn', 'ziegelstein'"), 'apartments must not repeat the old fixed Korn-and-brick loot');
assert(html.includes("const pool = ['sahnetorte', 'nudelholz', 'teekanne', 'toaster', 'korn'];"), 'apartments need a varied household-item pool');
assert(html.includes('caseProgress.ortsFundPoolVerwendet'), 'apartment loot choices must avoid repetition within a case');
assert(html.includes("sahnetorte:      { name: 'Kleine Sahnetorte im Pappkarton'"), 'cake must be a real usable inventory item');
assert(html.includes("hinterhof:    [{ key: 'alter_fisch'"), 'rotten fish must be discoverable in plausible outdoor rubbish locations');
assert(html.includes('klientIstAmWohnort = klientEntry.homePresence !== false;'), 'clients explicitly absent from their family home must leave the cast after travel');
assert(html.includes("add('uebergeben_vp', 'Der Polizei übergeben')"), 'secured hostile or corrupt actors need a police handover action');
assert(html.includes("if (!z || z.status !== 'gefesselt') add('fesseln', 'Fessle');\n    if (feind && z"), 'secured opponents must move from restraint directly to useful follow-up actions');
assert(html.includes('UEBERMUEDUNGS-FAHRTABBRUCH'), 'hard fatigue must stop unsafe driving in engine state');
assert(html.includes('Vor dem KI-Request wuerfeln'), 'travel threats must exist before arrival prose is requested');
assert(html.includes('=== GEBUNDENE PERSONEN AM ORT (WELTWAHRHEIT, PFLICHT) ==='), 'restrained people must remain present in narrative context');
assert(html.includes('WELTREAKTION JETZT:'), 'a restrained police officer left before witnesses must trigger a world reaction');
assert(html.includes('=== KEIN SCHLAF, KEIN AUFWACHEN (PFLICHT) ==='), 'morning prose must not invent sleep without a sleep action');
assert(html.includes('◆ Aktenkern'), 'required interrogation topics must be visibly marked');
assert(/polizist\|polizei\|wachtmeister\|dienstknueppel/.test(html), 'trained police opponents must use the stronger hardness tier');

console.log('HAUPTUI_KESSLER_10_ORTE_OK');
