const assert = require('assert');
const fs = require('fs');
const path = require('path');

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

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1413 +VisualTruth-Staging'"), 'release version missing');
assert(html.includes('Liesl schenkte oder widmete das Etui 1939 Hugo'), 'Krause setup must bind the silver-case ownership direction');
assert(html.includes('Karl zählt oder nimmt kein Geld, Karls Kasse bleibt unverändert'), 'Krause opening prompt must keep the return-contingent fee unpaid');
assert(html.includes('Dramatisiere diese EINE Spur genau EINMAL'), 'explicit Haupt-UI clues must merge compact target and detailed payoff into one narration');
assert(html.includes('OFFENE OBJEKTWAHRHEIT (HART, KEIN INDIZ-PAYOFF)'), 'every pre-clue scene must preserve visible hotspot truth, including client dialogue');
assert(html.includes("vorabObjektwoerter: ['vitrine','glasvitrine','vitrinenglas']"), 'Krauses intact display case must expose a data-driven arrival truth guard');
assert(html.includes("'aufgebrochen','aufgehebelt'") && html.includes("'gewaltsam geoeffnet'"), 'Krauses intact display case guard must reject natural forced-open synonyms');
assert(html.includes('die intakte Vitrine leer geräumt'), 'the Krause scene map must agree that the empty display case glass is intact');
assert(html.includes('habe|hatte|konnte'), 'arrival witness validation must cover German perfect infinitive phrasing');
assert(html.includes("indiz.id !== 'einbruch_fenster'"), 'the Krause window clue must configure a visible prose anchor');
assert(html.includes('sprechen eindeutig für ein Stemmeisen'), 'the hard fallback must restore the defining tool conclusion before booking');
assert(html.includes('ERSTBESUCH-WAHRHEIT (PFLICHT)'), 'travel prompts must distinguish a first visit from a real return');
assert(html.includes('fixed_interior_image_drift'), 'fixed interior scene images must be enforced as world truth before commit');
assert(!html.includes("scene.szene = 'Du trittst in ' + ort + ' ein. Die eigentliche Szene spielt im dargestellten Innenraum."),
  'the fixed-interior fallback must not leak staging language into visible prose');
assert(html.includes('Du öffnest die Ladentür von Krauses Antiquitäten'),
  'the Krause fixed-interior fallback must use natural location-specific arrival prose');
assert(html.includes('let _pflichtKlientOffen = false') && html.includes('!_pflichtKlientOffen'),
  'an unresolved present client must suppress the exhausted-location hint and travel emphasis');
assert(html.includes('open_object_truth_contradiction'), 'open hotspot physical truth must be validated before every scene commit');
assert(html.includes('mitternacht|mittag|ein|eins'), 'scope validation must treat named day-boundary times like numeric clock facts');
assert(html.includes('hievten|wuchteten|luden|warfen|verstauten|schoben'), 'scope validation must cover natural vehicle-loading verbs');
assert(html.includes('uncaused_interior_reentry'), 'a non-travel action must not invent a second entrance into the same interior');
assert(html.includes('keine erneute Ankunft, kein erneutes Betreten'), 'the persistent interior prompt must prevent re-entry loops at the source');
assert(html.includes("file: 'karl-mauers-buero-theodor-day.webp'"), 'Krause opening must show Theodor in Karl office');
assert(html.includes("root: 'assets/scenes/krause/'"), 'Krause opening image must resolve from the case scene directory');
assert(html.includes('AKTIONS-TREUE (ABSOLUT)'), 'physical and item actions need a strict narration contract');
assert(html.includes('ZUSTANDS-TREUE (ABSOLUT)'), 'NPC battle states need a strict narration contract');
assert(html.includes('function _verfassungNullSichern(reason)'), 'zero health needs a central forced ending');
assert(html.includes('Verwende nie die Formeln "Aktenmensch"'), 'reputation prose must ban the recurring stock phrase');
assert(html.includes('Krause hat deshalb selbst KEINE Anzeige erstattet'), 'Krause must not contradict his no-police premise');
assert(html.includes('Nacht vom Dienstag auf Mittwoch, 29./30. September 1953'), 'Krause break-in night must stay exact across witnesses');
assert(html.includes('Kalle und Jochen sind Friedas Schlaeger und Lagerwachen, keine Verraeter'), 'Krause thugs must keep their actual role');
assert(html.includes('weisses Haar zu einem festen Knoten gesteckt'), 'Hannelore description must not drift into the Weizenknoten typo');
assert(html.includes('WAFFEN-KONTINUITAET (PFLICHT)'), 'nonviolent talk actions must forbid invented drawn weapons');
assert(html.includes('Bornsteins Antiquitätenladen liegt in der Bergmannstraße'), 'Krause locations need an explicit address truth');

const bornsteinStart = html.indexOf("name: 'Bornsteins Antiquitätenladen'");
assert(bornsteinStart >= 0, 'Bornstein location missing');
const bornsteinBlock = html.slice(bornsteinStart, bornsteinStart + 1200);
assert(bornsteinBlock.includes("oeffnungszeit: ['morgen','vormittag','mittag','nachmittag','abend']"), 'Bornstein must close at night');
assert(!bornsteinBlock.includes("'nacht'"), 'Bornstein opening hours must not include night');

const targetItemStart = html.indexOf("id: 'silbernes_zigarettenetui'", html.indexOf('function _baukastenZiele()'));
assert(targetItemStart >= 0, 'silver cigarette case target missing');
assert(html.slice(targetItemStart, targetItemStart + 500).includes("sonderAktion: 'diebesgut_sichern'"), 'stolen case needs a deterministic secure action');

const itemVerbs = sourceOf('_hauptuiItemVerben');
assert(itemVerbs.includes("encodeURIComponent(String(feind.id || feind.name || ''))"), 'item actions must encode a stable selected enemy key');
assert(itemVerbs.includes("'werfen::' + ziel"), 'throw actions must encode the selected enemy');
assert(itemVerbs.includes("'werfen_fuesse::' + ziel"), 'distraction actions must encode the selected enemy');
assert(itemVerbs.includes("'angreifen_mit::' + ziel"), 'melee item actions must encode the selected enemy');
assert(itemVerbs.includes("'anbieten::' + ziel"), 'drinks, cigarettes and cake must encode the selected enemy for a peaceful offer');

const execute = sourceOf('_hauptuiExecute');
assert(execute.includes('_hauptuiKonfrontationAufZiel(feind)'), 'execution must switch the confrontation to the explicitly selected enemy');
assert(execute.includes("verb === 'diebesgut_zurueckgeben'"), 'Theodor needs a direct stolen-goods return action');
assert(execute.includes("verb === 'diebesgut_sichern'"), 'Frieda finale needs a direct stolen-goods secure action');

const hostile = sourceOf('_npcIstFeindlich');
assert(hostile.includes('npc.tagExtra'), 'hostility must include secondary tags such as Frieda gangster metadata');
const attackable = sourceOf('_hauptuiAngreifbarePersonen');
assert(attackable.includes('npc.tagExtra'), 'multi-enemy target list must include secondary hostile tags');
assert(attackable.includes('_konfrontationKrauseGruppenEintraege'), 'Frieda, Kalle and Jochen must remain explicit confrontation targets');

const groupStart = sourceOf('_konfrontationStart');
assert(groupStart.includes('_konfrontationKrauseGruppenEintraege().filter'), 'Krause confrontation must collect every living group opponent');
assert(groupStart.includes('_konfrontationGruppenZielSetzen(caseProgress.activeConfrontation, aktuellesZiel)'), 'Krause confrontation must activate its selected living target');

const livingGroup = sourceOf('_konfrontationGruppenLebende');
assert(livingGroup.includes("'ko', 'gefesselt', 'fixiert', 'geflohen', 'uebergeben'"), 'terminal Krause opponents must not return to the fight');

const groupFinish = sourceOf('_hauptuiKonfrontationAbschliessen');
assert(groupFinish.includes('_konfrontationGruppenFortschrittSichern(k)'), 'defeated Krause opponents must be saved before the next target');
assert(groupFinish.includes('_konfrontationGruppenZielSetzen(k, naechstesZiel)'), 'the next living Krause opponent must take over immediately');

const groupPrompt = sourceOf('_konfrontationGruppenPrompt');
assert(groupPrompt.includes('Frieda fuehrt Kalle und Jochen'), 'group narration must force all active Krause opponents to react');
assert(groupPrompt.includes('Hauptmann Vollmer'), 'group narration must forbid an unrelated Vollmer intervention');

const rosterGateContext = {
  caseProgress: {
    activeConfrontation: {
      enemyEntries: [
        { id: 'tante_frieda', name: 'Tante Frieda' },
        { id: 'kalle', name: 'Kalle' },
        { id: 'jochen', name: 'Jochen' },
      ]
    }
  },
  engineCurrentLocation: { name: 'Stallschreiberstrasse 12' },
  normForMatch: value => String(value || '').toLowerCase().replace(/_/g, ' '),
  _npcZustandGet: () => null,
  _npcZustandIstEntfernt: () => false,
};
require('vm').createContext(rosterGateContext);
require('vm').runInContext(sourceOf('_worldTruthAliases') + '\n' + sourceOf('_worldTruthHasAlias')
  + '\n' + sourceOf('_findRequiredEncounterRosterDrift'), rosterGateContext);
const missingFrieda = rosterGateContext._findRequiredEncounterRosterDrift({
  szene: 'Kalle dreht den Schlagring. Jochen tastet nach seinem Messer.',
  personenImRaum: ['Kalle', 'Jochen']
}, { id: 'REISE', _istReise: true });
assert(missingFrieda && missingFrieda.code === 'encounter_roster_undramatized',
  'a mechanically selectable Frieda must not remain invisible in the courtyard arrival prose');
assert.deepStrictEqual(Array.from(missingFrieda.missingProse), ['Tante Frieda'],
  'the roster gate must identify the exact undramatized opponent');
assert.strictEqual(rosterGateContext._findRequiredEncounterRosterDrift({
  szene: 'Tante Frieda hebt die Hand. Kalle dreht den Schlagring, waehrend Jochen den Rueckweg blockiert.',
  personenImRaum: ['Tante Frieda', 'Kalle', 'Jochen']
}, { id: 'REISE', _istReise: true }), null,
  'a fully dramatized and structured confrontation roster must pass');

const snapshotContext = {
  currentScene: {
    szene: 'Frieda hebt die Hand. Kalle macht einen Schritt vor.',
    optionen: [{ text: 'Beobachte Kalle und Jochen genau, ob sie zur Waffe greifen.' }]
  },
  engineCurrentLocation: { name: 'Tante Friedas Hehlerei' },
  caseProgress: { stage: 3, klientGesprochen: true },
  gameTimeIdx: 3,
  TIMES_OF_DAY: ['morgen', 'vormittag', 'mittag', 'nachmittag', 'abend', 'nacht'],
  normForMatch: value => String(value || '').toLowerCase().replace(/_/g, ' '),
  _npcZustandIstEntfernt: () => false,
  getCaseLocations: () => [
    { name: 'Tante Friedas Hehlerei', npcs: [{ id: 'tante_frieda', bisStage: 2 }] },
    { name: 'Stallschreiberstrasse 12', npcs: [{ id: 'tante_frieda', abStage: 3, immer: true }] },
  ],
};
require('vm').createContext(snapshotContext);
require('vm').runInContext(sourceOf('_npcOrtsbindungEintragAktiv') + '\n' + sourceOf('_npcIstImAktuellenSzenenSnapshot') + '\n' + sourceOf('_npcGehoertHierher'), snapshotContext);
assert.strictEqual(snapshotContext._npcGehoertHierher('tante_frieda', 'Tante Frieda'), true,
  'missing personenImRaum must not hide Frieda from the scene that visibly contains her');
assert.strictEqual(snapshotContext._npcIstImAktuellenSzenenSnapshot('kalle', 'Kalle'), true,
  'missing personenImRaum must fall back to visible scene prose');
assert.strictEqual(snapshotContext._npcIstImAktuellenSzenenSnapshot('jochen', 'Jochen'), true,
  'missing personenImRaum must fall back to visible scene options');
snapshotContext.currentScene.personenImRaum = [];
assert.strictEqual(snapshotContext._npcGehoertHierher('tante_frieda', 'Tante Frieda'), false,
  'an explicitly empty personenImRaum must obey the new stage binding and move Frieda out of the shop');

const ppkContext = {
  caseProgress: { activeConfrontation: {} },
  inventory: ['Walther PPK (eigene Pistole)', 'Notizbuch und Bleistift'],
  normForMatch: value => String(value || '').toLowerCase(),
  _baukastenZiele: () => ({ items: [] }),
  _konfrontationEnemy: () => ({ name: 'Kalle' }),
  _konfrontationTaktikAktiv: () => null,
  _hauptuiKonfrontationItemPlan: () => ({ score: 3, marker: 'guter Hebel', hint: 'Distanz' }),
};
require('vm').createContext(ppkContext);
require('vm').runInContext(sourceOf('_hauptuiKonfrontationItemGruppen') + '\n' + sourceOf('_hauptuiKonfrontationItems'), ppkContext);
const ppkActions = ppkContext._hauptuiKonfrontationItems();
assert(ppkActions.some(action => action.verb === 'ppk_einsetzen' && /Walther PPK/.test(action.label)),
  'the persistent narrative Walther PPK must become a real confrontation action');
ppkContext.caseProgress.activeConfrontation.ppkGezogen = true;
assert(!ppkContext._hauptuiKonfrontationItems().some(action => action.verb === 'ppk_einsetzen'),
  'the PPK may only be drawn once in the same confrontation');

const ppkRollContext = {
  caseProgress: { activeConfrontation: {} },
  Math: Object.create(Math),
  _konfrontationItemWirkung: () => ({ kraft: 1, irritation: 2, schwaechung: 1, status: 'bedroht' }),
  _konfrontationGegnerStaerke: () => 2,
  _konfrontationIstGruppe: () => false,
  _konfrontationClamp: (value, min, max) => Math.max(min, Math.min(max, value)),
  _alkoholKampfMalus: () => 0,
  _konfrontationStatusIstEndgueltig: status => ['ko', 'gefesselt', 'fixiert', 'geflohen', 'uebergeben'].includes(status),
  _konfrontationOutcomePrompt: () => 'ppk prompt'
};
ppkRollContext.Math.random = () => 0.999;
require('vm').createContext(ppkRollContext);
require('vm').runInContext(sourceOf('_konfrontationWuerfleAusgang'), ppkRollContext);
const ppkOutcome = ppkRollContext._konfrontationWuerfleAusgang({ name: 'Kalle' }, { name: 'Walther PPK' }, 'ppk_einsetzen', {
  score: 2,
  wirkung: { kraft: 1, irritation: 2, schwaechung: 1, status: 'bedroht' }
}, null);
assert.strictEqual(ppkOutcome.status, 'bedroht', 'even the best PPK roll must create pressure, not automatic flight');
assert(!ppkRollContext._konfrontationStatusIstEndgueltig(ppkOutcome.status), 'drawing the PPK must leave the confrontation open');

assert(html.includes("'stallschreiberstrasse-12-confrontation-day.webp'"), 'Krause showdown needs a truthful daytime courtyard image');
assert(html.includes("'stallschreiberstrasse-12-confrontation-night.webp'"), 'Krause showdown needs a truthful nighttime courtyard image');
assert(html.includes("'stallschreiberstrasse-12-confrontation-rex-day.webp'"), 'Krause showdown needs its Rex daytime variant');
assert(html.includes("'stallschreiberstrasse-12-confrontation-rex-night.webp'"), 'Krause showdown needs its Rex nighttime variant');
for (const asset of [
  'tante-friedas-hehlerei-confrontation-rex-day.webp',
  'tante-friedas-hehlerei-confrontation-rex-night.webp',
  'stallschreiberstrasse-12-confrontation-rex-day.webp',
  'stallschreiberstrasse-12-confrontation-rex-night.webp',
]) {
  assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'krause', asset)), 'missing Rex confrontation asset: ' + asset);
}
for (const asset of [
  'stallschreiberstrasse-12-aftermath-group-day.webp',
  'stallschreiberstrasse-12-aftermath-group-night.webp',
]) {
  assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'krause', asset)), 'missing group aftermath asset: ' + asset);
}
for (const asset of [
  'stallschreiberstrasse-12-frieda-day.webp',
  'stallschreiberstrasse-12-frieda-night.webp',
  'stallschreiberstrasse-12-kalle-day.webp',
  'stallschreiberstrasse-12-kalle-night.webp',
  'stallschreiberstrasse-12-jochen-day.webp',
  'stallschreiberstrasse-12-jochen-night.webp',
  'stallschreiberstrasse-12-frieda-kalle-day.webp',
  'stallschreiberstrasse-12-frieda-kalle-night.webp',
  'stallschreiberstrasse-12-frieda-jochen-day.webp',
  'stallschreiberstrasse-12-frieda-jochen-night.webp',
  'stallschreiberstrasse-12-kalle-jochen-day.webp',
  'stallschreiberstrasse-12-kalle-jochen-night.webp',
]) {
  assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'krause', asset)), 'missing exact courtyard roster asset: ' + asset);
}
assert(html.includes("dayFile: 'stallschreiberstrasse-12-aftermath-group-day.webp'"), 'Krause finale needs a courtyard aftermath with every still-present body');
assert(sourceOf('_npcGehoertHierher').includes('_npcIstImAktuellenSzenenSnapshot'), 'the visible scene snapshot must survive a same-scene stage change');
assert(sourceOf('_hauptuiKonfrontationItems').includes("'ppk_einsetzen'"), 'Karls Walther PPK must be selectable in the tactical confrontation');
assert(sourceOf('_hauptuiKonfrontationItems').includes('ppkSchonGezogen'), 'the PPK draw needs an encounter-local one-use guard');
assert(sourceOf('_hauptuiKonfrontationAbschliessen').includes('!istPpk'), 'PPK pressure must not become a cumulative knockout');
assert(sourceOf('_hauptuiKonfrontationAktion').includes('PPK GEZOGEN'), 'successful PPK narration must persist the one-use state');
assert(sourceOf('_konfrontationOutcomePrompt').includes('Niemand flieht, ergibt sich, wird ausgeschaltet oder verschwindet'), 'PPK narration must forbid automatic victory or flight');
assert(html.includes("if (!istGewahrsam && /charite/.test(engineOrt) && !/pathologie/.test(engineOrt))"), 'Charite needs an engine-location image fallback without overwriting pathology');

const stasiPrompt = sourceOf('_stasiEncounterPrompt');
assert(stasiPrompt.includes('_stasiEncounterOrtStimmt(encounter)'), 'Vollmer narration must stay bound to the encounter location');
assert(stasiPrompt.includes('_stasiEncounterVerdeckteBeobachtungFolgt'), 'a hidden Vollmer observation must survive a plausible location change');
assert(stasiPrompt.includes('_stasiEncounterClear'), 'an already visible stale Vollmer encounter must end after Karl changes location');

const takeItem = sourceOf('_fundItemAufnehmenDirekt');
assert(takeItem.includes('_geldZahle(preis'), 'Trude merchandise must actually charge its visible price');
assert(html.includes("'Kaufe · ' + preis + ' Ostmark'"), 'Trude merchandise price must be visible before purchase');

const battleFx = sourceOf('fxBattle');
assert(battleFx.indexOf('return;') < battleFx.indexOf('document.createElement'), 'legacy emoji battle cards must be unreachable');
const planFx = sourceOf('fxPlan');
assert(/function fxPlan\(plan, gabFehlschlag\) \{\s*return;/.test(planFx), 'legacy emoji plan cards must be unreachable');

assert(html.includes('function _hauptuiFokussierePerson(npc)'), 'legacy NPC hotspots must redirect into Haupt-UI selection');
assert(/function oeffneNpcMenue[\s\S]{0,400}?_hauptuiFokussierePerson\(npc\)/.test(html), 'NPC menu entry must avoid the second-click popup');
assert(!sourceOf('_hauptuiEmpfohleneAktion').includes("return 'umsehen'"), 'empty places must not offer a no-op search button');

console.log('KRAUSE_MULTIENEMY_FLOW_OK');
