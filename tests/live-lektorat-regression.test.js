const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sourceOf(name) {
  const start = html.indexOf('function ' + name + '(');
  assert(start >= 0, 'missing function ' + name);
  const brace = html.indexOf('{', start);
  let depth = 0;
  for (let i = brace; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error('unterminated function ' + name);
}

const serialLanguageContext = { caseSetup: { setupCast: [] } };
vm.createContext(serialLanguageContext);
vm.runInContext(sourceOf('stripAccidentalNarrativeQuotes') + '\n' + sourceOf('fixSprache') + '\n' + sourceOf('fixCommonGrammarErrors'), serialLanguageContext);
assert.strictEqual(serialLanguageContext.fixSprache('Du must sofort handeln.'), 'Du musst sofort handeln.',
  'the repeated second-person conjugation error must be repaired centrally');
assert.strictEqual(serialLanguageContext.fixSprache('Wenn sie das Etui zu Gold macht, ist es weg.'),
  'Wenn sie das Etui zu Geld macht, ist es weg.',
  'the malformed liquidation idiom must be repaired without changing the target object');
assert.strictEqual(serialLanguageContext.fixSprache('Es ist eine meiner kostbarsten Stücke.'),
  'Es ist eines meiner kostbarsten Stücke.',
  'the Krause client reply must agree with the neuter Etui/Stück');

assert.strictEqual(
  serialLanguageContext.fixCommonGrammarErrors('Sie sieht dich an, als wärest du ein Geist, und nickst Kalle zu.'),
  'Sie sieht dich an, als wärest du ein Geist, und nickt Kalle zu.',
  'a female third-person subject must not switch to second-person conjugation mid-sentence'
);

const menuSource = sourceOf('renderOptions');
assert(menuSource.includes("let _reiseVorauswahl = ''"),
  'the highlighted travel button must retain its displayed destination');
assert(menuSource.includes('_reiseVorauswahl = _zN'),
  'the displayed director destination must become the map preselection');
assert(menuSource.includes('oeffneReiseMenue(_reiseVorauswahl)'),
  'the highlighted travel button must open the map at its named destination');

const npcSource = sourceOf('npcInteraktion');
assert(npcSource.includes('_zeitUnmittelbar: !!verb._sozialTonart'),
  'a selected social interaction must resolve before a time or closing-time relocation');
assert(npcSource.includes('if (verb._sozialVorHinweis) _sozialVorHinweisMarkieren'),
  'an early social scene must not consume the later evidence-bearing tone');

const chooseSource = sourceOf('chooseOption');
assert(chooseSource.includes('const _engineRuhigeAktion = !!(option && option._engine')
  && chooseSource.includes('!_engineRuhigeAktion && isPhysicalConflictAction(option.text)'),
  'a structured investigation click must not become a violent reputation event because its hidden payoff contains a verb such as greifen');
assert(chooseSource.includes('!!(option && option._sozialTonart)'),
  'a structured social-tone click must count as a human interaction even when its generated prompt does not begin with a question verb');
assert(sourceOf('performApiCall').includes('var _ruhigesIndizFuerSpannung = !!(pendingChosenOption && pendingChosenOption._pendingIndizId')
  && sourceOf('performApiCall').includes('_capQuietEvidenceTension(scene, newSpannung, _ruhigesIndizFuerSpannung)')
  && sourceOf('performApiCall').includes('var _chosenOptionForScene = pendingChosenOption')
  && sourceOf('performApiCall').includes('processTheftTargetState(scene, _chosenOptionForScene)'),
  'a quiet structured evidence click must retain its metadata until the later tension pass');

const evidenceTensionContext = {
  normForMatch: value => String(value || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  diag: () => {}
};
vm.createContext(evidenceTensionContext);
vm.runInContext(sourceOf('_capQuietEvidenceTension'), evidenceTensionContext);
const forensicScene = {
  spannung: 4,
  szene: 'Das Holz ist splittrig aufgehebelt. Die Kerben zeigen rohe Gewalt und ein Stemmeisen; Gelegenheitsdiebe, keine Profis.'
};
assert.strictEqual(evidenceTensionContext._capQuietEvidenceTension(forensicScene, 4, true), 3,
  'past violence visible in a static trace must not create acute action tension');
assert.strictEqual(forensicScene.spannung, 3,
  'the quiet evidence cap must update the scene object used by header and travel gates');
assert.strictEqual(evidenceTensionContext._capQuietEvidenceTension({
  spannung: 4, szene: 'Kalle geht auf dich los und packt dich am Kragen.'
}, 4, true), 4, 'a real present attack during an evidence scene must retain high tension');

const evidenceHealthContext = {
  normForMatch: evidenceTensionContext.normForMatch,
  detectNewWound: text => /kugel trifft dich|schlaegt dich/.test(evidenceTensionContext.normForMatch(text)),
  diag: () => {}
};
vm.createContext(evidenceHealthContext);
vm.runInContext(sourceOf('_capQuietEvidenceHealthDelta'), evidenceHealthContext);
const quietEtuiScene = {
  verfassung_delta: -1,
  verletzungsbeschreibung: 'Unsichtbarer Modellschaden.',
  szene: 'Karl hebt das silberne Etui auf und steckt es in seine Innentasche.'
};
assert.strictEqual(evidenceHealthContext._capQuietEvidenceHealthDelta(quietEtuiScene, -1, true), 0,
  'securing a clue without a visible attack must not silently reduce health');
assert.strictEqual(quietEtuiScene.verletzungsbeschreibung, '',
  'a hidden injury note without a visible incident must not survive into the export');
assert.strictEqual(evidenceHealthContext._capQuietEvidenceHealthDelta({
  verfassung_delta: -1, szene: 'Die Kugel trifft dich an der Schulter.'
}, -1, true), -1, 'a visible new attack during an evidence scene may still reduce health');

const theftStateSource = sourceOf('processTheftTargetState');
assert(theftStateSource.includes('const _theftAction = actionContext')
  && theftStateSource.includes("_theftAction._pendingIndizId === 'etui_im_lager'"),
  'the theft possession gate must use the retained scene action after the global pending option is cleared');

const botHashSource = sourceOf('botGetOptionsHash');
assert(botHashSource.includes('.hauptui-execute:not(:disabled)') && botHashSource.includes('.hauptui-target:not(:disabled)'),
  'autoplay freshness detection must include the active Haupt-UI controls');
assert(botHashSource.includes("String((typeof sceneCounter === 'number') ? sceneCounter : 0)"),
  'autoplay must distinguish consecutive scenes even when their Haupt-UI menus are identical');

const botOptionsSource = sourceOf('botGetCurrentOptions');
assert(botOptionsSource.includes("id: execute ? 'HAUPTUI_AUSFUEHREN' : 'HAUPTUI_VORBEREITEN'"),
  'autoplay must expose Haupt-UI setup and execution as strategy candidates');

const botLoopSource = sourceOf('botRunMainLoop');
assert(botLoopSource.includes("if (chosen._hauptuiSetup && window.HAUPTUI_AKTIV)"),
  'autoplay must complete the Haupt-UI two-click interaction before waiting for a new scene');
assert(botLoopSource.includes("throw new Error('Haupt-UI: Ausfuehren-Button nach Ziel-/Verbwahl fehlt')"),
  'autoplay must fail diagnostically instead of silently consuming a turn when Haupt-UI execution is missing');

assert(html.includes("oeffnungszeit: ['morgen','vormittag','mittag','nachmittag','abend'], npcs: [{ id: 'oberkellner_voss'"),
  'Cafe Wien must be reachable when the Kessler trail points there in the morning');
assert(html.includes("detail: 'Schoenhauser Allee, ausgeraubt in der vergangenen Nacht (29./30. September 1953)'"),
  'Krauses map detail must agree with the case date');
assert(html.includes('${INTRO_REQUIREMENTS}Mittwochvormittag, 30. September 1953'),
  'Krauses opening prompt must agree with the engine start slot');
assert(!html.includes('Am Mittwochmittag ist "vergangene Nacht" korrekt'),
  'the stale Krause midday wording must be gone');
assert(!html.includes('Beisetzung 30.9.'),
  'the global historical chronology must not retain the wrong Reuter burial date');
assert(!html.includes('Reuter-Trauerfeier morgen am Schoeneberger Rathaus'),
  'historical enrichment must not offer a timeless future-tense Reuter example');

const reuterTimelineContext = {
  gameCurrentDate: '1953-10-15',
  caseSetup: { startDate: '1953-10-14' },
  normForMatch: value => String(value || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
};
vm.createContext(reuterTimelineContext);
vm.runInContext(sourceOf('_historicalReuterPhaseFact'), reuterTimelineContext);
vm.runInContext(sourceOf('_findHistoricalTimelineDrift'), reuterTimelineContext);
const reuterFutureDrift = reuterTimelineContext._findHistoricalTimelineDrift({
  szene: 'Das Radio meldet die Vorbereitungen zur Trauerfeier fuer Reuter.'
});
assert.strictEqual(reuterFutureDrift && reuterFutureDrift.code, 'historical_timeline_drift',
  'a future-tense Reuter funeral on 15 October must be blocked');
assert.strictEqual(reuterTimelineContext._findHistoricalTimelineDrift({
  szene: 'Eine alte Zeitung blickt auf Reuters Staatsakt und Beisetzung vom 3. Oktober zurueck.'
}), null, 'an explicitly retrospective Reuter reference after 3 October must remain valid');
reuterTimelineContext.gameCurrentDate = '1953-10-01';
assert.strictEqual(reuterTimelineContext._findHistoricalTimelineDrift({
  szene: 'Ein RIAS-Bericht ueber die Beisetzung von Ernst Reuter dringt von draussen herein.'
})?.code, 'historical_timeline_drift',
  'an undated report treating the 3 October burial as completed on 1 October must be blocked');
assert.strictEqual(reuterTimelineContext._findHistoricalTimelineDrift({
  szene: 'RIAS berichtet ueber die Vorbereitungen fuer Reuters Beisetzung am 3. Oktober.'
}), null, 'preparations for the explicitly future 3 October burial must remain valid on 1 October');
reuterTimelineContext.gameCurrentDate = '1953-09-30';
assert.strictEqual(reuterTimelineContext._findHistoricalTimelineDrift({
  szene: 'In der Stadt wird um Ernst Reuter getrauert. Ein RIAS-Bericht nennt die Vorbereitungen fuer die morgige Beisetzung des Buergermeisters.'
})?.code, 'historical_timeline_drift',
  'the Reuter gate must catch a wrong tomorrow claim split across adjacent sentences');
reuterTimelineContext.gameCurrentDate = '1953-10-02';
assert.strictEqual(reuterTimelineContext._findHistoricalTimelineDrift({
  szene: 'In der Stadt wird um Ernst Reuter getrauert. RIAS berichtet ueber die morgige Beisetzung.'
}), null, 'tomorrow is correct only on 2 October');
reuterTimelineContext.gameCurrentDate = '1953-10-15';
assert(reuterTimelineContext._historicalReuterPhaseFact('1953-10-15').includes('vom 3. Oktober zurueck'),
  'the enrichment example must switch to retrospective wording by the Kessler date');
assert(reuterTimelineContext._historicalReuterPhaseFact('1953-10-02').includes('Vorbereitungen'),
  'preparations must remain historically valid before the 3 October ceremony');
assert(sourceOf('validateSceneWorldTruth').includes('_findHistoricalTimelineDrift'),
  'the historical timeline guard must run in the pre-commit world-truth gate');
assert(sourceOf('buildWorldTruthRepairHint').includes("problem.code === 'historical_timeline_drift'"),
  'historical drift must get a precise model repair prompt');
assert(sourceOf('enforceSceneWorldTruthFallback').includes("problem.code === 'historical_timeline_drift'"),
  'repeated historical drift must get a deterministic safe fallback');

const sectorHistoryContext = {
  engineCurrentLocation: { name: 'Cafe Wien', sektor: 'West (Charlottenburg)' },
  normForMatch: value => String(value || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  getCaseLocations: () => []
};
vm.createContext(sectorHistoryContext);
vm.runInContext(sourceOf('_findHistoricalSectorDrift'), sectorHistoryContext);
assert.strictEqual(sectorHistoryContext._findHistoricalSectorDrift({
  szene: 'Draussen zaehlen zwei Frauen vor dem HO-Laden ihre Lebensmittelmarken.'
})?.code, 'historical_sector_drift',
  'local HO shops and ration cards at Cafe Wien must be blocked as West-sector drift');
sectorHistoryContext.engineCurrentLocation = { name: 'Karl Mauers Buero', sektor: 'Ost (Mitte)' };
assert.strictEqual(sectorHistoryContext._findHistoricalSectorDrift({
  szene: 'Draussen zaehlen zwei Frauen vor dem HO-Laden ihre Lebensmittelmarken.'
}), null, 'the same supply texture must remain available at an East-sector location');
sectorHistoryContext.engineCurrentLocation = { name: 'Cafe Wien', sektor: 'West (Charlottenburg)' };
assert.strictEqual(sectorHistoryContext._findHistoricalSectorDrift({
  szene: 'Hier gibt es keinen HO-Laden und keine Lebensmittelmarken mehr.'
}), null, 'an explicit historically correct negation must not trigger the sector guard');
assert(sourceOf('validateSceneWorldTruth').includes('_findHistoricalSectorDrift'),
  'the historical sector guard must run in the pre-commit world-truth gate');
assert(sourceOf('buildWorldTruthRepairHint').includes("problem.code === 'historical_sector_drift'"),
  'sector drift must get a precise model repair prompt');
assert(sourceOf('enforceSceneWorldTruthFallback').includes("problem.code === 'historical_sector_drift'"),
  'repeated sector drift must get a deterministic safe fallback');

const npcDepartureContext = {
  normForMatch: value => String(value || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  caseProgress: {},
  caseSetup: { setupCast: [{ id: 'ilse_hauke', name: 'Ilse Hauke' }] },
  cast: [{ id: 'ilse_hauke', name: 'Ilse Hauke' }],
  engineCurrentLocation: { name: 'Hinterhof Sybelstrasse' },
  sceneCounter: 2,
  currentScene: null
};
vm.createContext(npcDepartureContext);
for (const fn of [
  '_sceneNpcDepartureInfo', '_sceneNpcReturnExplained',
  'sanitizeSceneExplicitNpcDepartures', '_npcNachProsaAbgangAbwesend',
  '_findUnexplainedNpcReentry'
]) vm.runInContext(sourceOf(fn), npcDepartureContext);
const haukeDepartureScene = {
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Frau Hauke ist längst in einem der Hauseingänge verschwunden, ihre Schritte sind verhallt.',
  personenImRaum: ['Frau Hauke'],
  cast_hinzugefuegt: [{ id: 'ilse_hauke', name: 'Ilse Hauke' }],
  cast_entfernt: []
};
assert.deepStrictEqual(Array.from(npcDepartureContext.sanitizeSceneExplicitNpcDepartures(haukeDepartureScene)), ['Frau Hauke'],
  'an explicitly departed Kessler NPC must be recognized in the accepted scene');
assert.strictEqual(haukeDepartureScene.personenImRaum.length, 0,
  'an explicitly departed NPC must be removed from the same-scene UI roster');
npcDepartureContext.currentScene = haukeDepartureScene;
assert.strictEqual(npcDepartureContext._npcNachProsaAbgangAbwesend('ilse_hauke', 'Ilse Hauke', haukeDepartureScene), true,
  'a prose departure must keep the fixed location entry hidden until a narrated return');
const unexplainedHaukeReturn = npcDepartureContext._findUnexplainedNpcReentry({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Frau Hauke betrachtet dich schweigend.',
  personenImRaum: ['Frau Hauke']
});
assert.strictEqual(unexplainedHaukeReturn && unexplainedHaukeReturn.code, 'npc_reentry_unexplained',
  'the next scene must reject a departed NPC who silently reappears');
assert.strictEqual(npcDepartureContext._findUnexplainedNpcReentry({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Frau Hauke kommt aus dem Hauseingang zurück und bleibt vor dir stehen.',
  personenImRaum: ['Frau Hauke']
}), null, 'an explicitly dramatized NPC return must remain legal');
assert(sourceOf('getNpcsAtCurrentLocation').includes('_npcNachProsaAbgangAbwesend(entry.id'),
  'fixed location NPCs must respect a prose departure before rendering buttons');
assert(sourceOf('performApiCall').includes('sanitizeSceneExplicitNpcDepartures(scene)'),
  'explicit departures must be sanitized before the pre-commit world-truth gate');

const npcLocationFactContext = {
  normForMatch: value => String(value || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  caseSetup: { setupCast: [{ id: 'hannelore_wirth', name: 'Hannelore Wirth' }] }
};
vm.createContext(npcLocationFactContext);
vm.runInContext(sourceOf('_findNpcLocationFactDrift'), npcLocationFactContext);
const hanneloreFloorDrift = npcLocationFactContext._findNpcLocationFactDrift({
  szene: 'Hannelore Wirth berichtet, sie habe die Männer aus ihrem Fenster im zweiten Stock gesehen.'
});
assert.strictEqual(hanneloreFloorDrift && hanneloreFloorDrift.code, 'npc_location_fact_drift',
  'the Krause witness must not drift from the canonical first floor to the second floor');
assert.strictEqual(npcLocationFactContext._findNpcLocationFactDrift({
  szene: 'Hannelore Wirth sah die Männer aus ihrem Fenster im ersten Stock.'
}), null, 'the canonical first-floor witness statement must remain legal');
assert(sourceOf('validateSceneWorldTruth').includes('_findNpcLocationFactDrift'),
  'NPC location facts must run through the pre-commit world-truth gate');
assert(sourceOf('buildWorldTruthRepairHint').includes("problem.code === 'npc_location_fact_drift'"),
  'NPC location drift must get a precise repair instruction');
assert(sourceOf('enforceSceneWorldTruthFallback').includes("problem.code === 'npc_location_fact_drift'"),
  'repeated NPC location drift must get a deterministic safe fallback');

assert(html.includes('NEUE VERLETZUNGEN NUR MIT ENGINE-FOLGE'),
  'quiet actions must not invent health-neutral wounds');
assert(html.includes('KEINE ERFUNDENEN VORBEGEGNUNGEN'),
  'the prose prompt must forbid unsupported prior encounters');
assert(html.includes("if (option._intent.type === 'question' && _menuNpc) option._intent.target = _menuNpc"),
  'the exact clicked NPC must override fuzzy text target extraction');

const context = {
  currentScene: { personenImRaum: ['Frau Pohl', 'Ilse Hauke', 'Robert Kessler'] },
  cast: [{ name: 'Frau Pohl' }, { name: 'Ilse Hauke' }, { name: 'Robert Kessler' }],
  normForMatch: value => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
};
vm.createContext(context);
vm.runInContext(sourceOf('validateIntentFollowup'), context);

const openingRoleContext = {
  normForMatch: value => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''),
  STAMMFIGUREN: [
    { id: 'stamm_mfs', name: 'Hauptmann Vollmer' },
    { id: 'stamm_lenz', name: 'Lenz' }
  ],
  karlAkte: { bekannte: {}, mieteOffen: 0 },
  caseProgress: { alkohol: 0 },
  window: { _mfsVisierAktiv: false }
};
vm.createContext(openingRoleContext);
vm.runInContext(sourceOf('validateOpeningRoleTruth'), openingRoleContext);
vm.runInContext(sourceOf('sanitizeOpeningRoleTruth'), openingRoleContext);
const shadowSetup = {
  caseType: 'beschatten',
  opfer: 'Robert Kessler (Buchhalter)',
  setupCast: [{ name: 'Robert Kessler', tag: 'TARGET' }]
};
assert.strictEqual(openingRoleContext.validateOpeningRoleTruth(
  'Robert Kessler ist dir ueber den Kurfuerstendamm bis hierher gefolgt.', shadowSetup
).code, 'shadow_direction_reversed', 'opening validation must reject a reversed surveillance direction');
assert.strictEqual(openingRoleContext.validateOpeningRoleTruth(
  'Seit drei Stunden folgst du Robert Kessler durch Charlottenburg.', shadowSetup
).ok, true, 'opening validation must retain the correct surveillance direction');
const hinterhofShadowSetup = {
  ...shadowSetup,
  ortHaupt: 'Hinterhof Sybelstrasse, Charlottenburg'
};
assert.strictEqual(openingRoleContext.validateOpeningRoleTruth(
  'Edith hat dich beauftragt. Du folgst Robert. Er bleibt am Kiosk, waehrend du dich in den Hauseingang drueckst.',
  hinterhofShadowSetup,
  { personenImRaum: [] }
).code, 'opening_engine_location_missing',
'a Hinterhof engine opening must explicitly place Karl in the Hinterhof rather than at the preceding street location');
assert.strictEqual(openingRoleContext.validateOpeningRoleTruth(
  'Du bist Robert am Kiosk vorausgeeilt und wartest jetzt im Hinterhof Sybelstrasse. Robert steht noch draussen.',
  hinterhofShadowSetup,
  { personenImRaum: [] }
).ok, true,
'a correct split-location surveillance opening must remain valid');

const timedSnapshotContext = {
  normForMatch: value => String(value || '').toLowerCase().replace(/_/g, ' '),
  engineCurrentLocation: { name: 'Hinterhof Sybelstrasse' },
  caseProgress: { stage: 0 },
  gameTimeIdx: 3,
  TIMES_OF_DAY: ['MORGEN', 'VORMITTAG', 'MITTAG', 'NACHMITTAG', 'ABEND', 'NACHT'],
  currentScene: {
    szene: 'Robert Kessler steht noch vorne an der Strasse am Kiosk. Noch ist der Hinterhof leer.'
  },
  getCaseLocations: () => [{
    name: 'Hinterhof Sybelstrasse',
    npcs: [{ id: 'robert_kessler', zeit: ['abend', 'nacht'] }]
  }],
  _npcOrtsbindungEintragAktiv: entry => timedSnapshotContext.gameTimeIdx >= 4 && entry.zeit.includes('abend'),
  _istKlient: () => false
};
vm.createContext(timedSnapshotContext);
vm.runInContext(sourceOf('_npcIstImAktuellenSzenenSnapshot'), timedSnapshotContext);
vm.runInContext(sourceOf('_npcGehoertHierher'), timedSnapshotContext);
assert.strictEqual(timedSnapshotContext._npcGehoertHierher('robert_kessler', 'Robert Kessler'), false,
  'a prose-only name mention must not override an inactive time binding when personenImRaum is missing');
assert.strictEqual(openingRoleContext.validateOpeningRoleTruth(
  'Du bist Robert am Kiosk vorausgeeilt und wartest jetzt im Hinterhof Sybelstrasse. Robert steht noch draussen.',
  hinterhofShadowSetup,
  { personenImRaum: ['Robert Kessler'] }
).code, 'opening_target_presence_early',
'an offscreen target must not be put into the physical scene roster before entering');
assert.strictEqual(openingRoleContext.validateOpeningRoleTruth(
  'Hauptmann Vollmer steht an der Ecke. Er hat dich schon seit Tagen im Visier.', shadowSetup
).code, 'opening_foreign_recurring_npc',
'an unassigned recurring NPC must never be invented in a fresh case opening');
const activeVollmerSetup = {
  caseType: 'politisch',
  setupCast: [{ name: 'Hauptmann Vollmer', id: 'stamm_mfs', tag: 'STASI', _stammfigur: true }]
};
assert.strictEqual(openingRoleContext.validateOpeningRoleTruth(
  'Hauptmann Vollmer beobachtet dich schon seit Tagen.', activeVollmerSetup
).code, 'opening_unsupported_prior_encounter',
'a first recurring-NPC appearance must not invent an earlier relationship');
const krausePrivateSetup = {
  caseType: 'diebstahl',
  stasiRelevance: 0,
  setupCast: [{ name: 'Theodor Krause', tag: 'CLIENT' }]
};
assert.strictEqual(openingRoleContext.validateOpeningRoleTruth(
  'Theodor Krause nennt den Auftrag. Deine Miete ist seit zwei Wochen ueberfaellig.', krausePrivateSetup
).code, 'opening_rent_state_mismatch',
'a paid career rent state must reject invented opening debt');
assert.strictEqual(openingRoleContext.validateOpeningRoleTruth(
  'Theodor Krause nennt den Auftrag. Die Flasche Doppelkorn in der Schublade ist fast leer.', krausePrivateSetup
).code, 'opening_alcohol_prop_mismatch',
'a sober opening must reject an invented almost-empty office bottle');
assert.strictEqual(openingRoleContext.validateOpeningRoleTruth(
  'Theodor Krause nennt den Auftrag. Ein Mann im grauen Trenchcoat zieht seit Minuten beobachtend seine Runden.', krausePrivateSetup
).code, 'opening_private_stasi_intrusion',
'a stasi relevance zero case must reject a personal grey-coat watcher');
assert.strictEqual(openingRoleContext.validateOpeningRoleTruth(
  'Theodor Krause meldet das silberne Etui, das er aus der hohen Rueckwandvitrine gestohlen hat.', krausePrivateSetup
).code, 'opening_client_made_thief',
'a theft opening must not grammatically turn the reporting client into the thief');
assert.strictEqual(openingRoleContext.validateOpeningRoleTruth(
  'Theodor Krause nennt den Diebstahl, das Honorar und die frische Spur zu Tante Frieda.', krausePrivateSetup
).ok, true,
'a clean private-case opening must remain valid');
assert(html.includes('hatExpliziteRelevanz') && html.includes('return Number(cs.stasiRelevance) >= 3'),
  'explicit stasi relevance must override incidental historical-context words');
assert(sourceOf('_buildProfilRecap').includes('KARRIERE-WAHRHEIT')
  && sourceOf('_buildProfilRecap').includes('PRIVATFALL-WAHRHEIT'),
  'opening recap must state negative career and private-case world truth');
const dirtyOpening = {
  szene: 'Edith Kessler hat dich beauftragt. Hauptmann Vollmer verfolgt dich seit Tagen. Robert biegt in den Hof ein.',
  personenImRaum: ['Robert Kessler', 'Hauptmann Vollmer'],
  optionen: [{ text: 'Vollmer zur Rede stellen' }, { text: 'Robert beobachten' }]
};
openingRoleContext.sanitizeOpeningRoleTruth(dirtyOpening, { target: 'Hauptmann Vollmer' });
assert(!dirtyOpening.szene.includes('Vollmer') && !dirtyOpening.personenImRaum.includes('Hauptmann Vollmer')
  && dirtyOpening.optionen.length === 1,
'the hard fallback must remove an unauthorized recurring NPC from prose, cast and options');

const wrongNpcScene = {
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Frau Pohl lehnt sich aus dem Fenster. "Kessler?", fragt sie und antwortet ausweichend.'
};
assert.strictEqual(
  context.validateIntentFollowup(wrongNpcScene, {
    type: 'question',
    target: 'Ilse Hauke',
    previousOrt: 'Hinterhof Sybelstrasse'
  }),
  'question_target_missing',
  'an answer by a different present NPC must be rejected instead of accepted as the clicked target'
);

context.currentScene = { personenImRaum: ['Ilse Hauke'] };
context.cast = [{ name: 'Ilse Hauke' }];
assert.strictEqual(
  context.validateIntentFollowup({
    ort: 'Hinterhof Sybelstrasse',
    szene: 'Sie zögert. "Ich will keinen Ärger", sagt die Frau leise.'
  }, {
    type: 'question',
    target: 'Ilse Hauke',
    previousOrt: 'Hinterhof Sybelstrasse'
  }),
  null,
  'a pronoun answer remains valid when exactly one NPC is present'
);

const worldContext = {
  normForMatch: value => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''),
  engineCurrentLocation: { name: 'Hinterhof Sybelstrasse' },
  caseProgress: { npcZustand: {} },
  caseSetup: { caseType: 'diebstahl' },
  getCaseLocations: () => [],
  _resolveNpcIdentity: id => ({ id, name: id === 'hannelore_wirth' ? 'Hannelore Wirth' : id }),
  _aktuelleAktionIstReise: false,
  _aktuelleAktionIstFlucht: false,
  pendingForcedLocationChange: false
};
vm.createContext(worldContext);
vm.runInContext(sourceOf('_worldTruthAliases'), worldContext);
vm.runInContext(sourceOf('_worldTruthHasAlias'), worldContext);
vm.runInContext(sourceOf('_worldTruthOrtGleich'), worldContext);
vm.runInContext(sourceOf('_worldTruthAbschlussRueckblickErlaubt'), worldContext);
vm.runInContext(sourceOf('_findArrivalEvidenceLeak'), worldContext);
vm.runInContext(sourceOf('_findReputationAttributionDrift'), worldContext);
vm.runInContext(sourceOf('_findFixedInteriorImageDrift'), worldContext);
vm.runInContext(sourceOf('_findUnfoundedPriorVisitDrift'), worldContext);
vm.runInContext(sourceOf('_findUncausedInteriorReentry'), worldContext);
vm.runInContext(sourceOf('validateSceneWorldTruth'), worldContext);

worldContext.engineCurrentLocation = { name: 'Krauses Antiquitaeten' };
worldContext.caseProgress.reiseLog = [{ ziel: 'Krauses Antiquitaeten' }];
worldContext._istKesslerFallFuerBild = () => true;
worldContext._kesslerBildIstInnenraum = () => true;
worldContext._kesslerInnenraumTextPasst = text => /\b(?:im inneren|drinnen|hinter dem tresen|betrittst den laden)\b/i.test(String(text || ''));
worldContext._findeIndizById = id => id === 'etui_letzter_ort' ? ({ id, fundText: 'Die Glasvitrine steht offen und leer. Im Staub zeichnet sich der Rand des Etuis ab.' }) : null;
const krauseUncausedReentry = worldContext.validateSceneWorldTruth({
  ort: 'Krauses Antiquitaeten',
  szene: 'Du trittst erneut ueber die Schwelle des Antiquitaetenladens. Hannelore ist dir gefolgt. Im Inneren gehst du zur Vitrine.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'HAUPTUI_INDRAMATISIERUNG_etui_letzter_ort', _pendingIndizId: 'etui_letzter_ort' });
assert.strictEqual(krauseUncausedReentry && krauseUncausedReentry.code, 'uncaused_interior_reentry',
  'a non-travel clue click must not invent a second entrance into the current interior');
assert(krauseUncausedReentry && krauseUncausedReentry.fundText.includes('Glasvitrine'),
  'the reentry repair must retain the bound clue payoff');
const krauseExteriorArrivalDrift = worldContext.validateSceneWorldTruth({
  ort: 'Krauses Antiquitaeten',
  szene: 'Du steigst vor dem Antiquitaetengeschaeft aus. Hannelore fegt den Gehweg vor dem Eingang und bleibt dort bei dir.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true });
assert.strictEqual(krauseExteriorArrivalDrift && krauseExteriorArrivalDrift.code, 'fixed_interior_image_drift',
  'a fixed Krause interior image must reject an arrival scene that ends on the pavement');
const krauseFalsePriorVisit = worldContext.validateSceneWorldTruth({
  ort: 'Krauses Antiquitaeten',
  szene: 'Du betrittst den Laden. Im Inneren erkennt Hannelore Wirth dich als den Fremden, der vorhin schon einmal hier war.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true });
assert.strictEqual(krauseFalsePriorVisit && krauseFalsePriorVisit.code, 'unfounded_prior_visit',
  'the first arrival in the travel log must reject an invented earlier visit');
worldContext.caseProgress.reiseLog.push({ ziel: 'Krauses Antiquitaeten' });
assert.strictEqual(worldContext.validateSceneWorldTruth({
  ort: 'Krauses Antiquitaeten',
  szene: 'Du betrittst den Laden. Im Inneren erkennt Hannelore Wirth dich von deinem vorigen Besuch wieder.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true }), null,
  'a real return visit must remain legal');
worldContext._istKesslerFallFuerBild = () => false;
worldContext.caseProgress.reiseLog = [];
delete worldContext._findeIndizById;

const curfewContext = {
  caseProgress: { _letzteSperrstunde: { von: 'Spedition Schmidt Moabit', nach: 'Karl Mauers Buero', tageszeit: 'nacht', scene: 4 } },
  sceneCounter: 4,
  engineCurrentLocation: { name: 'Karl Mauers Buero' },
  normForMatch: value => String(value || '').toLowerCase()
};
vm.createContext(curfewContext);
vm.runInContext(sourceOf('_aktiveSperrstundenReiseUmleitung'), curfewContext);
const curfewRedirect = curfewContext._aktiveSperrstundenReiseUmleitung({
  _istReise: true,
  text: 'Fahr mit dem Opel zu: Spedition Schmidt Moabit'
});
assert.deepStrictEqual(JSON.parse(JSON.stringify(curfewRedirect)), {
  von: 'Spedition Schmidt Moabit', nach: 'Karl Mauers Buero', tageszeit: 'nacht'
}, 'a travel action that crosses closing time must expose the exact engine redirect');

worldContext.engineCurrentLocation = { name: 'Karl Mauers Buero' };
const krauseReplyOption = {
  id: 'NPC_befragen', _zeitUnmittelbar: true,
  _npcName: 'Theodor Krause',
  _npcInteraktion: { npcName: 'Theodor Krause' },
  _clientDepartureAfterReply: 'Theodor Krause'
};
const inventedAdvance = worldContext.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause antwortet knapp. Dann drückt er dir einen Umschlag mit den ersten fünfzig Ostmark als Vorschuss in die Hand, verabschiedet sich und verlaesst das Büro.',
  personenImRaum: [], optionen: []
}, krauseReplyOption);
assert.strictEqual(inventedAdvance && inventedAdvance.code, 'client_payment_drift',
  'Krause must not narrate an advance payment while the engine cash remains unchanged');
const inventedSurveillance = worldContext.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause berichtet, er habe seit Wochen beobachtet, wie sich fremde Gestalten in der Schönhauser Allee herumtreiben. Dann verabschiedet er sich und verlaesst das Büro.',
  personenImRaum: [], optionen: []
}, krauseReplyOption);
assert.strictEqual(inventedSurveillance && inventedSurveillance.code, 'client_witness_role_drift',
  'Krause must not gain invented weeks of suspect surveillance during the direct reply');
assert.strictEqual(worldContext.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause antwortet knapp und nennt die Gravur als Erkennungszeichen. Dann verabschiedet er sich und verlaesst das Büro.',
  personenImRaum: [], optionen: []
}, krauseReplyOption), null,
  'a truthful unpaid Krause reply followed by departure must remain valid');
worldContext.engineCurrentLocation = { name: 'Hinterhof Sybelstrasse' };

const interiorDrift = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Du legst deine Lizenz auf den Küchentisch. Frau Pohl schiebt eine Tasse Malzkaffee vor dich.',
  personenImRaum: ['Frau Pohl'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcInteraktion: { npcName: 'Frau Pohl' },
  id: 'HAUPTUI_SOZIAL_OFFEN'
});
assert.strictEqual(interiorDrift && interiorDrift.code, 'social_interior_drift',
  'an outdoor social scene must reject a silent teleport into the NPC kitchen');

const shortHallwayDrift = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Frau Pohl nimmt die Reval und sieht dich pruefend an. Der Rauch der Westware verdraengt den Geruch von Bohnerwachs im Flur.',
  personenImRaum: ['Frau Pohl'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcInteraktion: { npcName: 'Frau Pohl', verb: 'befragen' },
  id: 'NPC_sozial_gegenleistung'
});
assert.strictEqual(shortHallwayDrift && shortHallwayDrift.code, 'social_interior_drift',
  'the short phrase im Flur must be treated like im Hausflur at an outdoor engine location');

const causedHallwayDrift = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Frau Pohl zieht die Kette zurueck und laesst dich in den Treppenflur treten. Dort deutet sie nach oben.',
  personenImRaum: ['Frau Pohl'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcInteraktion: { npcName: 'Frau Pohl' },
  id: 'HAUPTUI_SOZIAL_OFFEN'
});
assert.strictEqual(causedHallwayDrift && causedHallwayDrift.code, 'social_interior_drift',
  'an NPC causing Karl to enter the hallway must count as the same outdoor-to-indoor teleport');

worldContext.engineCurrentLocation = { name: 'Krauses Antiquitaeten' };
const npcSublocationDrift = worldContext.validateSceneWorldTruth({
  ort: 'Krauses Antiquitaeten',
  szene: 'Du pruefst den Staubrand der Vitrine. Hannelore Wirth im Vorderhaus verstummt, ihre Schritte auf der Diele darueber halten inne.',
  personenImRaum: ['Hannelore Wirth'],
  optionen: []
}, { id: 'HAUPTUI_INDRAMATISIERUNG_etui_letzter_ort', kategorie: 'BEOBACHTEN' });
assert.strictEqual(npcSublocationDrift && npcSublocationDrift.code, 'npc_sublocation_drift',
  'a roster NPC must not teleport to a remote sublocation while remaining present and clickable');
assert.strictEqual(worldContext.validateSceneWorldTruth({
  ort: 'Krauses Antiquitaeten',
  szene: 'Hannelore Wirth, die Nachbarin aus dem Vorderhaus, steht neben der leeren Vitrine im Laden.',
  personenImRaum: ['Hannelore Wirth'],
  optionen: []
}, { id: 'HAUPTUI_INDRAMATISIERUNG_etui_letzter_ort', kategorie: 'BEOBACHTEN' }), null,
  'an origin description such as aus dem Vorderhaus must not be mistaken for a present sublocation');

worldContext.getCaseLocations = () => [{
  name: 'Krauses Antiquitaeten',
  indizien: [{
    id: 'nachbarin_aussage', npc: 'hannelore_wirth', quelle: 'person',
    schluessel: ['nachbarin','wirth','hannelore','zwei maenner','tasche','tatnacht','hinterhof','gesehen']
  }]
}];
const prematureWitnessAccount = worldContext.validateSceneWorldTruth({
  ort: 'Krauses Antiquitaeten',
  szene: 'Hannelore Wirth beginnt sofort auf dich einzureden. Sie berichtet ausschweifend von den Schritten, die sie in der Nacht vom 29. auf den 30. September gehört hat.',
  personenImRaum: ['Hannelore Wirth'],
  optionen: []
}, { id: 'REISE', _istReise: true });
assert.strictEqual(prematureWitnessAccount && prematureWitnessAccount.code, 'arrival_evidence_leak',
  'a witness must not narrate invented steps and the crime time before the bound conversation click');
const minimalPrematureWitnessAccount = worldContext.validateSceneWorldTruth({
  ort: 'Krauses Antiquitaeten',
  szene: 'Hannelore Wirth mustert dich. „Wenn Sie nach dem Einbruch fragen: Ich habe in der Nacht etwas gesehen.“',
  personenImRaum: ['Hannelore Wirth'],
  optionen: []
}, { id: 'REISE', _istReise: true });
assert.strictEqual(minimalPrematureWitnessAccount && minimalPrematureWitnessAccount.code, 'arrival_evidence_leak',
  'a first-person past observation plus crime time is already a premature witness beat');
assert.strictEqual(worldContext.validateSceneWorldTruth({
  ort: 'Krauses Antiquitaeten',
  szene: 'Hannelore Wirth steht zwischen den Vitrinen, zuckt bei deinem Eintreten zusammen und mustert dich, als wüsste sie etwas.',
  personenImRaum: ['Hannelore Wirth'],
  optionen: []
}, { id: 'REISE', _istReise: true }), null,
  'a silent visibly knowledgeable witness must remain legal arrival atmosphere');
worldContext.getCaseLocations = () => [];

worldContext.engineCurrentLocation = { name: 'Tante Friedas Hehlerei' };
worldContext.caseProgress._begegnungen = [
  { name: 'Theodor Krause', hart: false, art: 'befragt' },
  { name: 'Hannelore Wirth', hart: false, art: 'befragt' }
];
const falseHardRumour = worldContext.validateSceneWorldTruth({
  ort: 'Tante Friedas Hehlerei',
  szene: 'Frieda sagt: "Man erzählt sich, bei Hannelore Wirth waren Sie nicht gerade zimperlich, Herr Mauer."',
  personenImRaum: ['Tante Frieda', 'Kalle'],
  optionen: []
}, { id: 'REISE', _istReise: true });
assert.strictEqual(falseHardRumour && falseHardRumour.code, 'reputation_attribution_drift',
  'the world must not describe a politely questioned witness as a victim of Karl\'s violence');
worldContext.caseProgress._begegnungen.push({ name: 'Bornstein', hart: true, art: 'gepackt' });
assert.strictEqual(worldContext.validateSceneWorldTruth({
  ort: 'Tante Friedas Hehlerei',
  szene: 'Frieda sagt: "Man erzählt sich, bei Bornstein waren Sie nicht gerade zimperlich, Herr Mauer."',
  personenImRaum: ['Tante Frieda', 'Kalle'],
  optionen: []
}, { id: 'REISE', _istReise: true }), null,
  'a hard rumour tied to the actually hard-treated person must remain valid');
worldContext.caseProgress._begegnungen = [];
worldContext.engineCurrentLocation = { name: 'Hinterhof Sybelstrasse' };

const apartmentDoorDrift = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Du klopfst leise an die Wohnungstuer im dritten Stock. Frau Hauke oeffnet einen Spalt.',
  personenImRaum: ['Frau Hauke'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcInteraktion: { npcName: 'Frau Hauke', verb: 'diskret ansprechen' },
  id: 'NPC_sozial_diskretion'
});
assert.strictEqual(apartmentDoorDrift && apartmentDoorDrift.code, 'social_interior_drift',
  'knocking on a third-floor apartment door must not bypass an outdoor social location gate');

const perceivedInHallDrift = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Frau Hauke tritt durch die Wohnungstuer im dritten Stock und bleibt stehen, als sie dich im Halbdunkel des Flurs bemerkt.',
  personenImRaum: ['Frau Hauke'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcInteraktion: { npcName: 'Frau Hauke', verb: 'diskret ansprechen' },
  id: 'NPC_sozial_diskretion'
});
assert.strictEqual(perceivedInHallDrift && perceivedInHallDrift.code, 'social_interior_drift',
  'an NPC perceiving Karl in a hallway must count as the same silent location teleport');

const voiceFromHallDrift = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Robert Kessler wirbelt herum, als er deine Stimme aus dem Halbdunkel des Flurs hört. An der Wand hängt ein Kalender.',
  personenImRaum: ['Robert Kessler'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcInteraktion: { npcName: 'Robert Kessler', verb: 'befragen' },
  id: 'NPC_befragen'
});
assert.strictEqual(voiceFromHallDrift && voiceFromHallDrift.code, 'social_interior_drift',
  'a voice explicitly coming from a hallway must place Karl there and trigger the outdoor-location gate');

const environmentalInteriorDrift = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Du drueckst die schwere Eichentuer des Hausflurs auf. Hier drinnen steigst du bis in den dritten Stock.',
  personenImRaum: ['Frau Hauke'],
  optionen: []
}, {
  id: 'HAUPTUI_INDRAMATISIERUNG_tuerschild_hauke',
  kategorie: 'DURCHSUCHEN'
});
assert.strictEqual(environmentalInteriorDrift && environmentalInteriorDrift.code, 'outdoor_interior_drift',
  'an outdoor evidence action must reject an uncommanded move into a house or stairwell');

const objectBeforeVerbHallwayDrift = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Robert verschwindet im Hinterhaus. Als du den Flur erreichst, hoerst du seine Schritte ueber dir.',
  personenImRaum: ['Robert Kessler'],
  optionen: []
}, {
  id: 'HAUPTUI_INDRAMATISIERUNG_robert_eintritt_beobachtet',
  kategorie: 'ERKUNDEN'
});
assert.strictEqual(objectBeforeVerbHallwayDrift && objectBeforeVerbHallwayDrift.code, 'outdoor_interior_drift',
  'object-before-verb wording such as den Flur erreichen must not bypass the outdoor location gate');
assert(html.includes('WEST-SZENENBEISPIELE: Persil-Paket oder Apfelsinen')
  && html.includes('KEINE Lebensmittelkarten, HO-/Konsum-Waren, Bezugsscheine, Ostmark oder VEB-/FDGB-Requisiten als lokaler Alltag'),
  'first-NPC historical examples must be sector-aware instead of seeding East-supply props in West Berlin');

const exactEvidenceContext = {
  window: null,
  caseHasDefinedEvidence: () => true,
  engineCurrentLocation: { name: 'Hinterhof Sybelstrasse' },
  caseProgress: {
    stage: 0,
    gefundeneIndizIds: [],
    pendingHauptuiIndiz: { id: 'robert_eintritt_beobachtet' }
  },
  classifyEvidenceAction: () => 'umgebung',
  getCaseLocations: () => [{
    name: 'Hinterhof Sybelstrasse',
    indizien: [
      { id: 'tuerschild_hauke', quelle: 'umgebung', actions: ['ERKUNDEN'] },
      { id: 'robert_eintritt_beobachtet', quelle: 'umgebung', actions: ['ERKUNDEN'] }
    ]
  }],
  normForMatch: value => String(value || '').toLowerCase(),
  _aktTageszeitName: () => 'abend',
  getNpcsAtCurrentLocation: () => [],
  _indizIstWeltzustandOffen: () => true,
  _indizDurchVerhoerNichtMehrOffen: () => false,
  _indizNurUeberKampf: () => false,
  _aktionsZielNpcPasst: () => true,
  getEvidenceActionKey: () => 'ERKUNDEN'
};
exactEvidenceContext.window = exactEvidenceContext;
vm.createContext(exactEvidenceContext);
vm.runInContext(sourceOf('pickZielIndiz'), exactEvidenceContext);
assert.strictEqual(exactEvidenceContext.pickZielIndiz().id, 'robert_eintritt_beobachtet',
  'an explicit Haupt-UI hotspot must select its bound clue even when another compatible clue appears first');
const grantSource = sourceOf('pruefeKernIndizFund');
assert(grantSource.includes('caseProgress.pendingHauptuiIndiz && caseProgress.pendingHauptuiIndiz.id'),
  'deterministic evidence granting must preserve the explicit Haupt-UI clue binding');
assert(grantSource.includes('_expliziteIndizId ? [_z] : [_z].concat'),
  'an explicit clue may not fall through to a different location clue when a gate blocks it');
assert(grantSource.includes("const sceneObj = sceneInput && typeof sceneInput === 'object' ? sceneInput : null"),
  'deterministic evidence granting must preserve the live scene object for prose repair');
assert(html.includes('pruefeKernIndizFund(scene)'),
  'the scene commit path must pass the live scene object rather than only its text');
assert(html.includes("fallbackProse: 'Tetzlaff gibt schließlich zu: Robert macht mittwochs keine Überstunden, sondern geht früher als sonst.'"),
  'Tetzlaff evidence must have a visible canonical prose fallback');
assert(html.includes("(?:ueberstunden|überstunden)[\\s\\S]{0,30}(?:keine?\\s+spur|nicht|nie)"),
  'Tetzlaff prose detection must accept postposed negation such as von Überstunden keine Spur');

const kesslerEntryScopeContext = {
  window: {},
  caseProgress: {
    gefundeneIndizIds: ['tuerschild_hauke'],
    pendingHauptuiIndiz: { id: 'robert_eintritt_beobachtet' }
  },
  normForMatch: value => String(value || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[-–—]/g, ' '),
  getCaseLocations: () => [{
    name: 'Hinterhof Sybelstrasse',
    indizien: [{
      id: 'robert_eintritt_beobachtet',
      text: 'Robert betritt gegen 19 Uhr den Hinterhof und verschwindet im Hinterhaus.',
      fundText: 'Gegen sieben kommt Robert. Er verschwindet im Hinterhaus.',
      quelle: 'umgebung',
      schluessel: ['robert', '19 uhr', 'hinterhaus']
    }]
  }]
};
vm.createContext(kesslerEntryScopeContext);
vm.runInContext(sourceOf('_findTargetEvidenceScopeDrift'), kesslerEntryScopeContext);
const inventedHaukeDestination = kesslerEntryScopeContext._findTargetEvidenceScopeDrift({
  szene: 'Mit schnellen Schritten verschwindet Robert im dunklen Eingang des Hinterhauses, direkt zu den Hauke-Wohnungen.'
}, {});
assert(inventedHaukeDestination && inventedHaukeDestination.code === 'evidence_scope_drift',
  'Robert entering the Hinterhaus must not be upgraded to a witnessed destination at Haukes apartment');
assert.strictEqual(kesslerEntryScopeContext._findTargetEvidenceScopeDrift({
  szene: 'Gegen sieben betritt Robert den Hof und verschwindet im Hinterhaus. Ob er zu Hauke geht, bleibt offen.'
}, {}), null,
  'an explicit statement that the apartment destination remains unknown must stay valid');

const krauseWitnessScopeContext = {
  normForMatch: value => String(value || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[-–—]/g, ' '),
  caseProgress: { pendingHauptuiIndiz: { id: 'nachbarin_aussage' }, gefundeneIndizIds: [] },
  getCaseLocations: () => [{
    name: 'Krauses Antiquitaeten',
    indizien: [{
      id: 'nachbarin_aussage',
      text: 'Hannelore sah zwei Maenner mit einer schweren Tasche aus dem Hinterhof kommen.',
      quelle: 'person',
      schluessel: ['hannelore', 'zwei maenner', 'tasche', 'hinterhof']
    }]
  }]
};
vm.createContext(krauseWitnessScopeContext);
vm.runInContext(sourceOf('_findTargetEvidenceScopeDrift'), krauseWitnessScopeContext);
const inventedInjuryGait = krauseWitnessScopeContext._findTargetEvidenceScopeDrift({
  szene: 'Hannelore sagt: Einer der beiden hatte einen seltsamen Gang, fast wie bei einer Verletzung.'
}, {});
assert(inventedInjuryGait && inventedInjuryGait.code === 'evidence_scope_drift'
    && inventedInjuryGait.extras.includes('Körpermerkmal/Gangart'),
  'a noun phrase about an offender injury gait must not bypass witness evidence scope');
const inventedVehicleInReportedSpeech = krauseWitnessScopeContext._findTargetEvidenceScopeDrift({
  szene: 'Hannelore sagt, die Männer hätten die schwere Tasche hastig in einen Wagen gewuchtet, bevor sie davongefahren seien.'
}, {});
assert(inventedVehicleInReportedSpeech && inventedVehicleInReportedSpeech.code === 'evidence_scope_drift'
    && inventedVehicleInReportedSpeech.extras.includes('Fluchtfahrzeug'),
  'reported-speech participles such as "gewuchtet hätten" and "davongefahren seien" must not invent a getaway car');
assert.strictEqual(krauseWitnessScopeContext._findTargetEvidenceScopeDrift({
  szene: 'Hannelore sagt, die zwei Männer seien mit einer schweren Tasche aus dem Hinterhof gekommen.'
}, {}), null,
  'the canonical two men, bag and courtyard statement must remain valid without a vehicle');

const uncommandedDeparture = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Du wartest, bis Robert im Hinterhaus verschwindet. Dann verlaesst du den Hof fluchtartig.',
  personenImRaum: [],
  optionen: []
}, {
  id: 'HAUPTUI_INDRAMATISIERUNG_robert_eintritt_beobachtet',
  kategorie: 'BEOBACHTEN'
});
assert.strictEqual(uncommandedDeparture && uncommandedDeparture.code, 'unauthorized_departure',
  'a wait/observe action must reject prose that says Karl leaves the engine location');

const uncommandedCarDeparture = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Robert Kessler sackt zusammen. Du drehst dich um und rennst durch den Torbogen zurueck zur Sybelstrasse. Du springst in den Fahrersitz und laesst den Wagen Richtung Kurfuerstendamm davonrollen.',
  personenImRaum: ['Robert Kessler'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcName: 'Robert Kessler',
  id: 'NPC_bedrohen'
});
assert.strictEqual(uncommandedCarDeparture && uncommandedCarDeparture.code, 'unauthorized_departure',
  'running back to the street and entering the driver seat must not bypass the location gate');

worldContext.engineCurrentLocation = { name: 'Tante Friedas Hehlerei' };
const uncommandedKrauseSprint = worldContext.validateSceneWorldTruth({
  ort: 'Tante Friedas Hehlerei',
  szene: 'Du bedrohst Jochen mit ruhiger Stimme. Dann reisst du die Hintertuer auf und wirbelst in den dunklen Hinterhof. Du sprintest ueber das Kopfsteinpflaster Richtung Stallschreiberstrasse.',
  personenImRaum: ['Tante Frieda', 'Kalle', 'Jochen'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcName: 'Jochen',
  _npcInteraktion: { npcName: 'Jochen', verb: 'bedrohen' },
  id: 'NPC_bedrohen'
});
assert.strictEqual(uncommandedKrauseSprint && uncommandedKrauseSprint.code, 'unauthorized_departure',
  'sprinting toward a named street after a threat must not silently move Karl out of the fixed interior');
worldContext.engineCurrentLocation = { name: 'Hinterhof Sybelstrasse' };

const uncommandedWalkToCar = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Dann drehst du dich um, gehst mit schnellen Schritten zur Strasse und steuerst deinen Opel an, um den Beobachtungsposten zu verlassen.',
  personenImRaum: ['Robert Kessler'],
  optionen: []
}, {
  id: 'HAUPTUI_INDRAMATISIERUNG_robert_eintritt_beobachtet',
  kategorie: 'BEOBACHTEN'
});
assert.strictEqual(uncommandedWalkToCar && uncommandedWalkToCar.code, 'unauthorized_departure',
  'walking to the street and deliberately approaching the Opel must count as an unauthorized departure');

const uncommandedQuietWithdrawal = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Du wartest, bis die Haustuer ins Schloss faellt, dann drehst du dich um und entfernst dich leise, um nicht entdeckt zu werden.',
  personenImRaum: ['Robert Kessler'],
  optionen: []
}, {
  id: 'HAUPTUI_INDRAMATISIERUNG_robert_eintritt_beobachtet',
  kategorie: 'BEOBACHTEN'
});
assert.strictEqual(uncommandedQuietWithdrawal && uncommandedQuietWithdrawal.code, 'unauthorized_departure',
  'quietly withdrawing to avoid discovery must count as a completed departure even without a named destination');

const uncommandedPurposeRetreat = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Du wartest noch einen Moment, dann ziehst du dich zuegig zurueck, bevor dich ein Anwohner bemerken kann.',
  personenImRaum: ['Robert Kessler'],
  optionen: []
}, {
  id: 'HAUPTUI_INDRAMATISIERUNG_robert_eintritt_beobachtet',
  kategorie: 'BEOBACHTEN'
});
assert.strictEqual(uncommandedPurposeRetreat && uncommandedPurposeRetreat.code, 'unauthorized_departure',
  'purpose-bound sich zurueckziehen wording must not bypass the departure gate');

const kesslerWaitContext = {
  caseProgress: {},
  chooseOptionInFlight: false,
  engineCurrentLocation: { name: 'Hinterhof Sybelstrasse' },
  sceneCounter: 1,
  TIMES_OF_DAY: ['MORGEN', 'VORMITTAG', 'MITTAG', 'NACHMITTAG', 'ABEND', 'NACHT'],
  gameTimeIdx: 3,
  timeAdvanceTokens: 0.4,
  scenesInCurrentTime: 1,
  _aktTageszeitName: () => 'nachmittag',
  saveGameState: () => {},
  _hauptuiChoose: option => { kesslerWaitContext.chosen = option; }
};
vm.createContext(kesslerWaitContext);
vm.runInContext(sourceOf('_hauptuiStarteIndizSzene'), kesslerWaitContext);
kesslerWaitContext._hauptuiStarteIndizSzene({
  id: 'robert_eintritt_beobachtet',
  hotspot: 'Im Schatten des Hinterhofs warten',
  fundText: 'Gegen sieben kommt Robert.'
});
assert.strictEqual(kesslerWaitContext.gameTimeIdx, 4,
  'the canonical 19:00 Kessler wait hotspot must set the engine to evening before scene generation');
assert.strictEqual(kesslerWaitContext.timeAdvanceTokens, 0,
  'the deterministic wait must reset residual random time tokens');
assert.strictEqual(kesslerWaitContext.chosen._zeitUnmittelbar, true,
  'a concrete evidence hotspot must finish at its current location before time advancement can trigger closing-hour relocation');

const coreEvidenceProseContext = { diag: () => {}, caseProgress: { pendingHauptuiIndiz: null } };
vm.createContext(coreEvidenceProseContext);
vm.runInContext(sourceOf('_indizAbschlussProsaSichern'), coreEvidenceProseContext);
const timedCoreClue = {
  id: 'robert_eintritt_beobachtet',
  prosaPflicht: {
    narrativ: /\b(?:19\s*uhr|(?:um\s+)?(?:kurz\s+(?:nach|vor)|gegen|punkt|um)\s+sieben)\b/i,
    fallbackProse: 'Es ist gegen 19 Uhr, als du Roberts Eintritt notierst.'
  }
};
const untimedCoreScene = { szene: 'Robert tritt in den Hinterhof und verschwindet im Haus.' };
assert.strictEqual(coreEvidenceProseContext._indizAbschlussProsaSichern(timedCoreClue, untimedCoreScene), true,
  'a booked core clue must receive its configured missing narrative anchor before commit');
assert(untimedCoreScene.szene.includes('gegen 19 Uhr'),
  'the visible core-clue prose must contain the defining time anchor, not only the popup');
assert.strictEqual(coreEvidenceProseContext._indizAbschlussProsaSichern(timedCoreClue, untimedCoreScene), false,
  'a configured core-clue prose fallback must remain idempotent');
const naturalTimedScene = { szene: 'Um kurz nach sieben betritt Robert den Hinterhof.' };
assert.strictEqual(coreEvidenceProseContext._indizAbschlussProsaSichern(timedCoreClue, naturalTimedScene), false,
  'a natural kurz-nach-sieben variant must satisfy the time anchor without a redundant fallback sentence');

const doorplateCoreClue = {
  id: 'tuerschild_hauke',
  prosaPflicht: {
    narrativ: /^(?=[\s\S]*\b(?:dritter|3\.)\s*stock\b)(?=[\s\S]*\blinks\b)(?=[\s\S]*\bhauke\b)(?=[\s\S]*kein herr)(?=[\s\S]*(?:keine familie|alleinsteh))/i,
    fallbackProse: 'Dritter Stock links: Das Schild trägt nur den Namen Hauke - kein Herr, keine Familie.'
  },
  fundText: 'Neben der hofseitigen Eingangstür hängen die Klingelschilder schief untereinander. Dritter Stock links: ein einzelner Name, mit Schreibmaschine getippt. Hauke. Kein Herr Hauke, keine Familie - nur der Name. Mehr beweist das Schild allein noch nicht.'
};
const incompleteDoorplateScene = { szene: 'Das dritte Schild von oben trägt den Namen Hauke. Kein Vorname ist zu sehen.' };
assert.strictEqual(coreEvidenceProseContext._indizAbschlussProsaSichern(doorplateCoreClue, incompleteDoorplateScene), true,
  'a doorplate scene must not confuse the third sign from above with the third floor left');
assert(incompleteDoorplateScene.szene.includes('Dritter Stock links')
    && incompleteDoorplateScene.szene.includes('kein Herr, keine Familie'),
  'the visible doorplate prose must carry the complete popup claim before booking');
assert.strictEqual(coreEvidenceProseContext._indizAbschlussProsaSichern(doorplateCoreClue, incompleteDoorplateScene), false,
  'the complete doorplate fallback must remain idempotent');
const partialHouseholdDoorplateScene = { szene: 'Dritter Stock links steht Hauke. Kein Herr ist auf dem Schild vermerkt.' };
assert.strictEqual(coreEvidenceProseContext._indizAbschlussProsaSichern(doorplateCoreClue, partialHouseholdDoorplateScene), true,
  'mentioning only the missing Herr must not satisfy the complete no-family household anchor');
assert(partialHouseholdDoorplateScene.szene.includes(doorplateCoreClue.prosaPflicht.fallbackProse),
  'the fallback must add the missing family-status fact even when all other doorplate anchors are present');
coreEvidenceProseContext.caseProgress.pendingHauptuiIndiz = { id: 'tuerschild_hauke' };
const livePartialHouseholdDoorplateScene = {
  szene: 'Du fokussierst die dritte Reihe. Ein einzelner Name ist mit Schreibmaschine getippt: Hauke. Kein Vorname, keine Spur eines zweiten Bewohners.'
};
assert.strictEqual(coreEvidenceProseContext._indizAbschlussProsaSichern(doorplateCoreClue, livePartialHouseholdDoorplateScene), true,
  'the exact v1409 live wording must be repaired because row three is not floor three left');
assert.strictEqual(livePartialHouseholdDoorplateScene.szene, doorplateCoreClue.fundText,
  'a structured clue with missing anchors must be replaced by one complete canonical narration, not receive a duplicate summary');
coreEvidenceProseContext.caseProgress.pendingHauptuiIndiz = null;

const toolCoreClue = {
  id: 'einbruch_fenster',
  prosaPflicht: {
    narrativ: /\b(?:stemmeisen|brecheisen|brechstange)\b/i,
    fallbackProse: 'Die Kerben sprechen eindeutig für ein Stemmeisen.'
  }
};
const toolLessCoreScene = { szene: 'Das Holz ist splittrig aufgehebelt. Kein Glasschneider, sondern rohe Gewalt.' };
assert.strictEqual(coreEvidenceProseContext._indizAbschlussProsaSichern(toolCoreClue, toolLessCoreScene), true,
  'the booked Krause window clue must visibly name its defining tool conclusion');
assert(toolLessCoreScene.szene.includes('Stemmeisen'),
  'the window clue popup and visible prose must agree on the Stemmeisen conclusion');
const naturalToolScene = { szene: 'Die breiten Kerben stammen von einer Brechstange.' };
assert.strictEqual(coreEvidenceProseContext._indizAbschlussProsaSichern(toolCoreClue, naturalToolScene), false,
  'a natural synonym must satisfy the tool anchor without a duplicate fallback sentence');
const etchedEtuiClue = {
  id: 'etui_letzter_ort',
  fundText: 'Die Glasvitrine steht offen und leer. Im Staub liegt der Rand des Etuis. Auf seinem Deckel stand die Gravur "Für Hugo, 1939, Liesl".',
  prosaPflicht: {
    narrativ: /^(?=[\s\S]*\b(?:gravur|auf (?:dem|seinem) deckel|eingraviert)\b)(?=[\s\S]*\bhugo\b)(?=[\s\S]*\b1939\b)(?=[\s\S]*\bliesl\b)/i,
    fallbackProse: 'Auf dem Deckel des Etuis stand die Gravur "Für Hugo, 1939, Liesl".'
  }
};
coreEvidenceProseContext.caseProgress.pendingHauptuiIndiz = { id: 'etui_letzter_ort' };
const liveEtuiWithoutEngraving = {
  szene: 'Im Staub zeichnet sich der helle Rand eines flachen Gegenstands ab. Genau hier lag das silberne Zigarettenetui, das Krause beschrieben hat.'
};
assert.strictEqual(coreEvidenceProseContext._indizAbschlussProsaSichern(etchedEtuiClue, liveEtuiWithoutEngraving), true,
  'the booked Vitrine clue must not leave its identifying engraving only in the popup');
assert.strictEqual(liveEtuiWithoutEngraving.szene, etchedEtuiClue.fundText,
  'the missing engraving must produce one complete canonical Vitrine narration without an appended duplicate');
coreEvidenceProseContext.caseProgress.pendingHauptuiIndiz = null;

const pendingCommitContext = {
  caseProgress: {
    pendingHauptuiIndiz: { id: 'etui_letzter_ort' },
    gefundeneIndizIds: ['etui_letzter_ort']
  },
  _findeIndizById: id => id === 'etui_letzter_ort' ? etchedEtuiClue : null,
  _markiereIndizGefunden: () => { throw new Error('already booked clue must not be booked twice'); },
  _flushIndizRewards: () => {},
  diag: () => {}
};
vm.createContext(pendingCommitContext);
vm.runInContext(sourceOf('_indizAbschlussProsaSichern'), pendingCommitContext);
vm.runInContext(sourceOf('_hauptuiPendingIndizEinloesen'), pendingCommitContext);
const alreadyScannedEtuiScene = {
  szene: 'Im Staub zeichnet sich der helle Rand eines flachen Gegenstands ab. Genau hier lag das silberne Zigarettenetui, das Krause beschrieben hat.'
};
assert.strictEqual(pendingCommitContext._hauptuiPendingIndizEinloesen(alreadyScannedEtuiScene), true,
  'a pending Haupt-UI clue already booked by the scene scan must still complete its final prose gate');
assert.strictEqual(alreadyScannedEtuiScene.szene, etchedEtuiClue.fundText,
  'the accepted live Vitrine scene must receive the complete engraving narration before the pending context clears');
assert.strictEqual(pendingCommitContext.caseProgress.pendingHauptuiIndiz, null,
  'the persistent pending context must clear only after final prose validation');
const pendingRedemptionCall = html.indexOf("try { if (typeof _hauptuiPendingIndizEinloesen === 'function') _hauptuiPendingIndizEinloesen(scene); } catch (e) {}");
const immutableSceneLogSnapshot = html.indexOf("logEntries.push({", pendingRedemptionCall);
assert(pendingRedemptionCall !== -1 && immutableSceneLogSnapshot !== -1
  && pendingRedemptionCall < immutableSceneLogSnapshot,
  'pending evidence prose must be finalized before the immutable scene log snapshot used by renderLog');
assert.strictEqual(html.indexOf("try { if (typeof _hauptuiPendingIndizEinloesen === 'function') _hauptuiPendingIndizEinloesen(scene); } catch (e) {}", pendingRedemptionCall + 1), -1,
  'pending evidence redemption must run exactly once, before logging, not again after the stale snapshot');

const friedasEvasiveClue = {
  id: 'frieda_ausweichend',
  fundText: 'Du konfrontierst Tante Frieda mit Hannelore Wirths Beobachtung und Bornsteins Hinweis auf das Etui. Frieda schnaubt und behauptet, sie kenne kein silbernes Etui und kaufe nur "ehrliche Ware". Doch ihre Augen zucken zur T\u00fcr des Hinterhofs. Kalle und Jochen stellen sich breitbeinig in den Weg; die Spur f\u00fchrt in das Lager dahinter.',
  prosaPflicht: {
    narrativ: /^(?=[\s\S]*(?:(?:kenne|wisse|wei(?:ss|\u00df)e)[\s\S]{0,35}kein(?:es)?[\s\S]{0,20}(?:etui|zigarettenetui)|kein(?:es)?[\s\S]{0,20}(?:etui|zigarettenetui)[\s\S]{0,35}(?:kenne|wisse|wei(?:ss|\u00df)e)))(?=[\s\S]*ehrlich\w*\s+ware)(?=[\s\S]*(?:hinterhof|lager))(?=[\s\S]*kalle)(?=[\s\S]*jochen)/i,
    fallbackProse: 'Frieda behauptet, sie kenne kein silbernes Etui und kaufe nur "ehrliche Ware"; ihr Blick zum Hinterhof und Kalle und Jochen im Weg verraten das Lager dahinter.'
  }
};
coreEvidenceProseContext.caseProgress.pendingHauptuiIndiz = { id: 'frieda_ausweichend' };
const liveContradictoryFriedaScene = {
  szene: 'Frieda verschr\u00e4nkt die Arme. "Hier gibt es keine ehrliche Ware. Das Etui geh\u00f6rt dazu." Kalle und Jochen r\u00fccken n\u00e4her.'
};
assert.strictEqual(coreEvidenceProseContext._indizAbschlussProsaSichern(friedasEvasiveClue, liveContradictoryFriedaScene), true,
  'Frieda must not visibly confess while the booked core clue says she denies knowing the Etui');
assert.strictEqual(liveContradictoryFriedaScene.szene, friedasEvasiveClue.fundText,
  'the contradictory Frieda dialogue must be replaced by one coherent canonical evidence scene');
const coherentFriedaScene = {
  szene: 'Frieda sagt, sie kenne kein silbernes Etui und handle nur mit ehrlicher Ware. Ihr Blick springt zum Hinterhof, w\u00e4hrend Kalle und Jochen den Zugang zum Lager blockieren.'
};
assert.strictEqual(coreEvidenceProseContext._indizAbschlussProsaSichern(friedasEvasiveClue, coherentFriedaScene), false,
  'a naturally coherent Frieda denial must pass without duplicated fallback prose');
const coherentFriedaInvertedSyntaxScene = {
  szene: 'Dass sie kein Etui kenne und nur ehrliche Ware kaufe, behauptet Frieda. Ihre Augen zucken zum Lager im Hinterhof, während Kalle und Jochen den Weg blockieren.'
};
assert.strictEqual(coreEvidenceProseContext._indizAbschlussProsaSichern(friedasEvasiveClue, coherentFriedaInvertedSyntaxScene), false,
  'German subordinate-clause word order must not trigger duplicated core-evidence fallback prose');
coreEvidenceProseContext.caseProgress.pendingHauptuiIndiz = null;

const coreNarrationContext = {
  normForMatch: value => String(value || '').toLowerCase().replace(/[„“"'.,:;!?()\-]/g, ' ').replace(/\s+/g, ' ').trim(),
  _findeIndizById: id => id === 'etui_letzter_ort' ? ({
    id: 'etui_letzter_ort',
    text: 'In der leeren Vitrine hier lag das silberne Etui mit der Gravur Für Hugo 1939 Liesl der Staubrand zeigt die genaue Stelle',
    fundText: 'Die Glasvitrine steht leer. Im Staub auf dem Samt liegt der helle Rand des silbernen Etuis.',
    schluessel: ['vitrine', 'etui', 'zigarettenetui', 'silber', 'gravur', 'hugo', 'liesl', 'staub', 'samt', 'schmuck']
  }) : id === 'tuerschild_hauke' ? ({
    id: 'tuerschild_hauke',
    text: 'Wohnung 3. Stock links Türschild zeigt nur Hauke eine alleinstehende Frau kein Herr keine Familie',
    fundText: 'Im Hausflur hängen die Klingelschilder schief. Dritter Stock links steht nur Hauke. Kein Herr Hauke, keine Familie.',
    schluessel: ['tuerschild', 'hauke', '3. stock', 'dritter stock', 'namensschild', 'klingelschild', 'kein herr', 'keine familie', 'alleinstehend']
  }) : null,
  window: {},
  caseProgress: { pendingHauptuiIndiz: null }
};
vm.createContext(coreNarrationContext);
vm.runInContext(sourceOf('_findCoreEvidenceNarrationRedundancy'), coreNarrationContext);
const doubledCoreNarration = coreNarrationContext._findCoreEvidenceNarrationRedundancy({
  szene: 'In der leeren Vitrine hier lag das silberne Etui mit der Gravur Für Hugo 1939 Liesl der Staubrand zeigt die genaue Stelle. Die Glasvitrine steht offen. Im Staub auf dem Samt erkennst du erneut den Rand des Zigarettenetuis.'
}, { _pendingIndizId: 'etui_letzter_ort' });
assert(doubledCoreNarration && doubledCoreNarration.code === 'core_evidence_narration_redundancy',
  'a copied compact clue followed by the same full evidence narration must be rejected');
assert.strictEqual(coreNarrationContext._findCoreEvidenceNarrationRedundancy({
  szene: 'Die Glasvitrine steht offen. Im Staub auf dem Samt erkennst du den hellen Rand des silbernen Zigarettenetuis und liest die Gravur.'
}, { _pendingIndizId: 'etui_letzter_ort' }), null,
  'one coherent full evidence narration must remain valid');
const paraphrasedKesslerSummary = coreNarrationContext._findCoreEvidenceNarrationRedundancy({
  szene: 'Auf Höhe der dritten Etage klebt ein Schild. Nur ein Name steht dort: Hauke. Kein Herr Hauke, keine Familie. Dritter Stock links: Das Schild trägt nur den Namen Hauke - kein Herr, keine Familie.'
}, { _pendingIndizId: 'tuerschild_hauke' });
assert(paraphrasedKesslerSummary && paraphrasedKesslerSummary.code === 'core_evidence_narration_redundancy',
  'an appended paraphrase of the fully dramatized Kessler doorplate clue must be rejected');
const synonymKesslerSummary = coreNarrationContext._findCoreEvidenceNarrationRedundancy({
  szene: 'Die Klingelschilder hängen schief. Der dritte Streifen von oben trägt den Namen Hauke, aber keinen Vornamen und keinen Titel. Dritter Stock links: Das Schild trägt nur den Namen Hauke - kein Herr, keine Familie.'
}, { _pendingIndizId: 'tuerschild_hauke' });
assert(synonymKesslerSummary && synonymKesslerSummary.code === 'core_evidence_narration_redundancy',
  'a compact Kessler summary must be rejected even when the full narration uses title and position synonyms');
const exactLiveKesslerSummary = coreNarrationContext._findCoreEvidenceNarrationRedundancy({
  szene: 'Die Namen hängen unter vergilbten Zelluloidplättchen. Ein Name sticht ins Auge: Dritter Stock, links. Dort steht nur Hauke, kein Vorname, kein Titel. Frau Pohl tritt heraus. Dritter Stock links: Das Schild trägt nur den Namen Hauke - kein Herr, keine Familie.'
}, { _pendingIndizId: 'tuerschild_hauke' });
assert(exactLiveKesslerSummary && exactLiveKesslerSummary.code === 'core_evidence_narration_redundancy',
  'the exact v1408 live-summary shape must be rejected');
coreNarrationContext.caseProgress.pendingHauptuiIndiz = { id: 'tuerschild_hauke' };
const persistentPendingKesslerSummary = coreNarrationContext._findCoreEvidenceNarrationRedundancy({
  szene: 'Die Namen hängen unter vergilbten Zelluloidplättchen. Ein Name sticht ins Auge: Dritter Stock, links. Dort steht nur Hauke, kein Vorname, kein Titel. Frau Pohl tritt heraus. Dritter Stock links: Das Schild trägt nur den Namen Hauke - kein Herr, keine Familie.'
}, {});
assert(persistentPendingKesslerSummary && persistentPendingKesslerSummary.code === 'core_evidence_narration_redundancy',
  'the active Haupt-UI clue must remain identifiable when transient option metadata is missing');
coreNarrationContext.caseProgress.pendingHauptuiIndiz = null;
assert.strictEqual(coreNarrationContext._findCoreEvidenceNarrationRedundancy({
  szene: 'Im Hausflur hängen die Klingelschilder schief. Dritter Stock links steht nur Hauke. Kein Herr Hauke, keine Familie.'
}, { _pendingIndizId: 'tuerschild_hauke' }), null,
  'the coherent canonical Kessler doorplate payoff must remain valid');

const objectBeforeVerbDeparture = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Robert Kessler weicht zurueck. Du stoesst ihn beiseite und hechtest in die dunkle Tordurchfahrt. Deine Schritte hallen, als du den Hinterhof ueber die Seitenstrasse verlaesst. Ausser Atem erreichst du die Strassenecke.',
  personenImRaum: ['Robert Kessler'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcName: 'Robert Kessler',
  id: 'NPC_bedrohen'
});
assert.strictEqual(objectBeforeVerbDeparture && objectBeforeVerbDeparture.code, 'unauthorized_departure',
  'object-before-verb departure and coordinated hechtest wording must be rejected');

const reflexiveObjectDeparture = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Du spuerst den Blick von Frau Pohl, als du dich umdrehst und den Hinterhof durch das Tor in Richtung Strasse verlaesst. Als du deinen Opel erreichst, steigst du ein und laesst den Hinterhof hinter dir.',
  personenImRaum: ['Frau Pohl'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcName: 'Frau Pohl',
  _npcInteraktion: { npcName: 'Frau Pohl' },
  _sozialTonart: 'druck',
  id: 'NPC_sozial_druck'
});
assert.strictEqual(reflexiveObjectDeparture && reflexiveObjectDeparture.code, 'unauthorized_departure',
  'reflexive object-before-verb departure and reaching the Opel must not bypass the location gate');

const offscreenInjury = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Robert Kessler schweigt. Ein stechender Schmerz erinnert dich an den Rempler gegen den Torpfeiler, den du beim Uebersteigen der Mauer kassiert hast.',
  personenImRaum: ['Robert Kessler'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcName: 'Robert Kessler',
  id: 'NPC_bedrohen'
});
assert.strictEqual(offscreenInjury && offscreenInjury.code, 'offscreen_injury',
  'a retrospective injury cause that was never played must be blocked');

const wrongSocialTarget = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Frau Pohl lockert ihren Griff am Tuerrahmen und antwortet Karl ausweichend.',
  personenImRaum: ['Frau Pohl', 'Robert Kessler'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcInteraktion: { npcName: 'Robert Kessler' },
  id: 'NPC_sozial_ruhig'
});
assert.strictEqual(wrongSocialTarget && wrongSocialTarget.code, 'social_target_missing',
  'a direct social scene must reject prose in which another present NPC replaces the clicked target');

const verbalBecamePhysical = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Du packst den Mann am Aermel und schiebst Robert Kessler gegen die Ziegelwand. Sein Kopf schlaegt gegen den Putz; eine Prellung bleibt zurueck.',
  personenImRaum: ['Robert Kessler'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcName: 'Robert Kessler',
  _npcInteraktion: { npcName: 'Robert Kessler', verb: 'befragen' },
  id: 'NPC_befragen'
});
assert.strictEqual(verbalBecamePhysical && verbalBecamePhysical.code, 'verbal_action_became_physical',
  'Stelle zur Rede must never become an unchosen assault or invented injury');

const socialToneBecamePhysical = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Du packst Robert Kessler am Kragen und schiebst ihn gegen die Ziegelwand.',
  personenImRaum: ['Robert Kessler'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcName: 'Robert Kessler',
  _npcInteraktion: { npcName: 'Robert Kessler' },
  _sozialTonart: 'blossstellen',
  id: 'NPC_sozial_blossstellen'
});
assert.strictEqual(socialToneBecamePhysical && socialToneBecamePhysical.code, 'social_tone_became_physical',
  'a verbal public-exposure tone must never become an unchosen physical assault');

const verbalPressureGrabbedRevers = worldContext.validateSceneWorldTruth({
  ort: 'Spedition Schmidt Moabit',
  szene: 'Du packst Norbert Tetzlaff am Revers. Die billige Stoffqualität knirscht unter deinem Griff.',
  personenImRaum: ['Norbert Tetzlaff'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcName: 'Norbert Tetzlaff',
  _npcInteraktion: { npcName: 'Norbert Tetzlaff' },
  _sozialTonart: 'druck',
  id: 'NPC_sozial_druck'
});
assert.strictEqual(verbalPressureGrabbedRevers && verbalPressureGrabbedRevers.code, 'social_tone_became_physical',
  'the verbal Tetzlaff pressure route must reject grabbing his Revers, jacket, coat or lapel');

const curfewLocationDrift = worldContext.validateSceneWorldTruth({
  ort: 'Spedition Schmidt Moabit',
  szene: 'Du lenkst den Opel auf den Hof der Spedition und trittst in das noch beleuchtete Hauptgebaeude.',
  personenImRaum: ['Norbert Tetzlaff'],
  optionen: []
}, {
  id: 'REISE', _istReise: true,
  _sperrstundenUmleitung: { von: 'Spedition Schmidt Moabit', nach: 'Karl Mauers Buero', tageszeit: 'nacht' }
});
assert.strictEqual(curfewLocationDrift && curfewLocationDrift.code, 'curfew_redirect_drift',
  'closing-time redirect must reject prose that continues inside the closed travel destination');

const inventedAlcohol = worldContext.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Nachdem der Nordhaeuser deine Sinne getruebt hat, wachst du mit droehnendem Kopf und Korn-Geschmack auf.',
  personenImRaum: [],
  optionen: []
}, {
  id: 'SCHLAFEN', _kategorie: 'SCHLAFEN', _alkoholVorSchlaf: 0, _katerVorSchlaf: 0
});
assert.strictEqual(inventedAlcohol && inventedAlcohol.code, 'invented_alcohol_state',
  'sleep prose must not invent drinking, intoxication, or a hangover at alcohol state zero');

worldContext.caseProgress.gefundeneIndizIds = ['robert_eintritt_beobachtet'];
const contradictedKnownEntry = worldContext.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Robert Kessler hat sich gestern im Hinterhof der Sybelstrasse in Luft aufgeloest. Seine Spur bleibt unklar.',
  personenImRaum: [],
  optionen: []
}, { id: 'SCHLAFEN', _kategorie: 'SCHLAFEN' });
assert.strictEqual(contradictedKnownEntry && contradictedKnownEntry.code, 'known_evidence_contradiction',
  'a later scene must not rewrite the observed Hinterhaus entry as a disappearance in the courtyard');
assert.strictEqual(worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Robert verschwand im Hinterhaus; seine Spur fuehrt zu der Wohnung mit dem Schild Hauke.',
  personenImRaum: [],
  optionen: []
}, { id: 'SCHLAFEN', _kategorie: 'SCHLAFEN' }), null,
  'a truthful recap of Robert entering the rear building must remain valid');
worldContext.caseProgress.gefundeneIndizIds = [];

worldContext.engineCurrentLocation = { name: 'Krauses Antiquitaeten' };
worldContext.caseProgress.gefundeneIndizIds = ['einbruch_fenster'];
const contradictedKrauseSkill = worldContext.validateSceneWorldTruth({
  ort: 'Krauses Antiquitaeten',
  szene: 'Die Diebe wussten genau, was sie nahmen. Sie waren keine Amateure.',
  personenImRaum: ['Hannelore Wirth'],
  optionen: []
}, { id: 'HAUPTUI_INDRAMATISIERUNG_etui_letzter_ort', _pendingIndizId: 'etui_letzter_ort' });
assert.strictEqual(contradictedKrauseSkill && contradictedKrauseSkill.code, 'known_evidence_contradiction',
  'the vitrinen payoff must not rewrite the found crude break-in as professional work');
assert.strictEqual(worldContext.validateSceneWorldTruth({
  ort: 'Krauses Antiquitaeten',
  szene: 'Die Täter griffen gezielt nach der Ware, brachen aber wie Gelegenheitsdiebe mit einem Stemmeisen ein, nicht wie Profis.',
  personenImRaum: ['Hannelore Wirth'],
  optionen: []
}, { id: 'HAUPTUI_INDRAMATISIERUNG_etui_letzter_ort', _pendingIndizId: 'etui_letzter_ort' }), null,
  'target knowledge and crude break-in technique must remain compatible');
worldContext.caseProgress.gefundeneIndizIds = [];
worldContext.engineCurrentLocation = { name: 'Hinterhof Sybelstrasse' };

assert(html.includes('FORTSETZUNGS-WAHRHEIT AUS GESICHERTEN INDIZIEN'),
  'found core evidence must inject a data-driven continuity anchor into later scene prompts');
assert(html.includes("fortsetzungsWahrheit: 'Robert wurde beim Betreten des Hinterhauses beobachtet"),
  'the Kessler entry clue must carry its exact persistent story truth');
assert(html.includes("fortsetzungsWahrheit: 'Die Einbruchsspuren am Hinterhof-Fenster zeigen grobe Arbeit"),
  'the Krause break-in clue must carry its exact persistent competence truth');

assert.strictEqual(worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Nach mehreren Glaesern Korn wachst du verkatert mit trockenem Mund im Hinterhof auf.',
  personenImRaum: [],
  optionen: []
}, {
  id: 'SCHLAFEN', _kategorie: 'SCHLAFEN', _alkoholVorSchlaf: 3, _katerVorSchlaf: 0
}), null, 'a real pre-sleep alcohol state must continue to permit a narrated hangover');

assert.strictEqual(worldContext.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Die Spedition Schmidt ist bei deiner Ankunft bereits geschlossen. Du wendest den Opel, faehrst zurueck und legst im Buero am Hackeschen Markt deine Notizen auf den Schreibtisch.',
  personenImRaum: [],
  optionen: []
}, {
  id: 'REISE', _istReise: true,
  _sperrstundenUmleitung: { von: 'Spedition Schmidt Moabit', nach: 'Karl Mauers Buero', tageszeit: 'nacht' }
}), null, 'an honestly narrated closing-time return to the engine destination must pass');

const missingPublicThreat = worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Du setzt Robert Kessler mit scharfer Stimme unter Druck. Er weist dich zurueck.',
  personenImRaum: ['Robert Kessler'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcName: 'Robert Kessler',
  _npcInteraktion: { npcName: 'Robert Kessler' },
  _sozialTonart: 'blossstellen',
  id: 'NPC_sozial_blossstellen'
});
assert.strictEqual(missingPublicThreat && missingPublicThreat.code, 'social_tone_missing',
  'public exposure must be dramatized specifically instead of collapsing into generic pressure');

assert.strictEqual(worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Du drohst Robert Kessler rein verbal, seine Heimlichkeit vor Edith und allen Nachbarn oeffentlich zu machen. Robert weist die Drohung zurueck.',
  personenImRaum: ['Robert Kessler'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcName: 'Robert Kessler',
  _npcInteraktion: { npcName: 'Robert Kessler' },
  _sozialTonart: 'blossstellen',
  id: 'NPC_sozial_blossstellen'
}), null, 'an explicit verbal public-exposure threat must pass the world-truth gate');

assert.strictEqual(worldContext.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Frau Pohl bleibt neben den Mülltonnen stehen und antwortet Karl leise im Hinterhof.',
  personenImRaum: ['Frau Pohl'],
  optionen: []
}, {
  _zeitUnmittelbar: true,
  _npcInteraktion: { npcName: 'Frau Pohl' },
  id: 'HAUPTUI_SOZIAL_OFFEN'
}), null, 'a social response that stays in the courtyard must remain valid');

assert(html.includes('Die Befragung findet JETZT vollständig am Engine-Ort'),
  'the question prompt must name the exact engine location');
assert(html.includes('Dies ist ein AUSSENORT: Verlege das Gespraech NICHT'),
  'outdoor social prompts must forbid silent residential interior moves');
assert(sourceOf('_sozialVorHinweisAktion').includes('AUSGEWAEHLTES GESPRAECHSZIEL IST'),
  'early social prompts must name the clicked NPC explicitly');
const earlySocialContext = { _sozialTonartArt: () => 'bedrohen' };
vm.createContext(earlySocialContext);
vm.runInContext(sourceOf('_sozialVorHinweisAktion'), earlySocialContext);
const earlyExposure = earlySocialContext._sozialVorHinweisAktion({ key: 'blossstellen', label: 'Mit oeffentlicher Blossstellung drohen' }, 'Robert Kessler');
assert(earlyExposure.includes('Mit oeffentlicher Blossstellung drohen') && earlyExposure.includes('Karl beruehrt, packt, schiebt oder schlaegt die Person NICHT'),
  'the pre-clue prompt must preserve the exact visible social tone and forbid physical substitution');
const earlyDiscretionContext = { _sozialTonartArt: () => 'normal' };
vm.createContext(earlyDiscretionContext);
vm.runInContext(sourceOf('_sozialVorHinweisAktion'), earlyDiscretionContext);
const earlyDiscretion = earlyDiscretionContext._sozialVorHinweisAktion({ key: 'diskretion', label: 'Diskretion zusichern' }, 'Frau Hauke');
assert(earlyDiscretion.includes('SICHTBAR GEWAEHLTE GESPRAECHSART IST "Diskretion zusichern"')
  && earlyDiscretion.includes('eine bloss neutrale Ansprache'),
  'a custom visible social button must not collapse into generic neutral prose before clue release');
assert(sourceOf('_hauptuiExecute').includes('Koerperliche Gewalt ist ausschliesslich der getrennten Spieleraktion'),
  'the verbal confrontation prompt must reserve violence for the explicit attack button');
assert(html.includes("indiz.hotspot = 'Klingelschilder am Hofeingang pruefen'"),
  'the Kessler doorbell clue must remain reachable from the engine courtyard');
assert(html.includes('Neben der hofseitigen Eingangstür hängen die Klingelschilder'),
  'the Kessler clue text must stay in the courtyard and retain player-facing German orthography');
assert(!sourceOf('botGetOptionsHash').includes('problem.code'),
  'the world-truth repair hint must not leak into the autoplay hash helper');
const apiSource = sourceOf('performApiCall');
assert(apiSource.indexOf('!_openingRoleTruth.ok') < apiSource.indexOf('if (isStart && _openingSlow'),
  'fundamental opening-role validation must run before the slow-call quality skip');
assert(apiSource.includes('MAX_OPENING_ROLE_REPAIRS'),
  'opening role reversal needs bounded hard retries and a fallback');
assert(apiSource.includes('NPC-KONTINUITAET') && apiSource.includes('sanitizeOpeningRoleTruth'),
  'unauthorized recurring NPCs need a slow-call-proof retry and hard fallback');
assert(sourceOf('fixSprache').includes(".replace(/\\b([Dd])u wischt\\b/g, '$1u wischst')"),
  'the observed du wischt conjugation error must be corrected conservatively');
assert(sourceOf('fixSprache').includes(".replace(/\\b([Dd])u rappelt\\b/g, '$1u rappelst')"),
  'the observed du rappelt conjugation error must be corrected conservatively');
assert(html.includes('ALKOHOLZUSTAND (HARTE ENGINE-WAHRHEIT)'),
  'a sober sleep action must explicitly forbid invented drinking and hangover prose');
const languageContext = { caseSetup: { setupCast: [{ name: 'Edith Kessler' }, { name: 'Robert Kessler' }] } };
vm.createContext(languageContext);
vm.runInContext(sourceOf('stripAccidentalNarrativeQuotes'), languageContext);
vm.runInContext(sourceOf('fixSprache'), languageContext);
assert.strictEqual(languageContext.fixSprache('Die Stifte stecken in das morschen Holz.'), 'Die Stifte stecken in das morsche Holz.',
  'the observed definite-neuter adjective ending must be corrected');
assert.strictEqual(languageContext.fixSprache('Tante Frieda kaucht in Kreuzberg alles auf.'), 'Tante Frieda kauft in Kreuzberg alles auf.',
  'the observed Krause dialogue typo must be corrected narrowly');
assert.strictEqual(languageContext.fixSprache('Der Opel nagelt müde vor dem Laden.'), 'Der Opel rasselt widerwillig vor dem Laden.',
  'the confirmed recurring nagelt-muede style tic must not remain visible');
assert.strictEqual(languageContext.fixSprache('Dein Auftraggeberin wartet.'), 'Deine Auftraggeberin wartet.',
  'the observed Kessler possessive-gender error must be corrected narrowly');
const wrappedNarration = '"Du gehst auf den Eingang zu. ' + 'Die Messingschilder haengen schief und du pruefst jeden Namen sorgfaeltig. '.repeat(3) + 'Robert bleibt im Hof."';
assert(!languageContext.fixSprache(wrappedNarration).startsWith('"') && !languageContext.fixSprache(wrappedNarration).endsWith('"'),
  'a fully quote-wrapped narrative paragraph must lose only its accidental outer quotes');
const namedOpeningNarration = '"Edith Kessler zahlt gut, aber sie will Gewissheit: ' + 'Du folgst Robert durch Charlottenburg und ordnest den Auftrag im kuehlen Hinterhof. '.repeat(3) + 'Du wartest auf seinen naechsten Schritt."';
assert(!languageContext.fixSprache(namedOpeningNarration).startsWith('"') && !languageContext.fixSprache(namedOpeningNarration).endsWith('"'),
  'a quote-wrapped opening that begins with a current cast name must also lose its accidental outer quotes');
const wrappedDoorplateEvidence = '"Neben der hofseitigen Eingangstür hängen die Klingelschilder schief untereinander. ' + 'Dritter Stock links steht nur Hauke, kein Herr Hauke und keine Familie. '.repeat(3) + 'Mehr beweist das Schild allein noch nicht."';
assert(!languageContext.fixSprache(wrappedDoorplateEvidence).startsWith('"') && !languageContext.fixSprache(wrappedDoorplateEvidence).endsWith('"'),
  'quote-wrapped canonical evidence beginning with Neben must lose accidental paragraph quotes');
const wrappedWithDialogue = '"Du gehst auf Robert zu. ' + 'Der Hof bleibt still, waehrend du jeden seiner Schritte beobachtest. '.repeat(3) + '"Was wollen Sie?", fragt Robert."';
assert(!languageContext.fixSprache(wrappedWithDialogue).startsWith('"') && languageContext.fixSprache(wrappedWithDialogue).includes('"Was wollen Sie?"'),
  'outer narrative quotes must be removed even when genuine dialogue quotes remain inside');
assert.strictEqual(languageContext.fixSprache('"Was wollen Sie hier?", fragt Robert.'), '"Was wollen Sie hier?", fragt Robert.',
  'real direct speech must keep its quotation marks');
assert(sourceOf('buildWorldTruthRepairHint').includes('ENGINE-WAHRHEIT VERLETZUNG'),
  'offscreen injury drift needs a targeted repair prompt');
const evidenceFallbackContext = {
  engineCurrentLocation: { name: 'Hinterhof Sybelstrasse' },
  normForMatch: value => String(value || '').toLowerCase(),
  _resolveNpcIdentity: id => ({
    frau_pohl: { name: 'Frau Pohl' },
    hannelore_wirth: { name: 'Hannelore Wirth' }
  }[id] || null)
};
vm.createContext(evidenceFallbackContext);
vm.runInContext(sourceOf('enforceSceneWorldTruthFallback'), evidenceFallbackContext);
const objectEvidenceScene = { szene: 'verworfen', optionen: [] };
evidenceFallbackContext.enforceSceneWorldTruthFallback(objectEvidenceScene, {
  code: 'evidence_scope_drift',
  indizId: 'tuerschild_hauke',
  quelle: 'hotspot',
  fundText: 'Dritter Stock links steht nur der Name Hauke.'
});
assert(objectEvidenceScene.szene.includes('Dritter Stock links')
  && objectEvidenceScene.szene.includes('sichtbaren Fund')
  && !/befragte Person|Aussage|Beobachtung/.test(objectEvidenceScene.szene),
  'an object or hotspot evidence fallback must remain an investigation rather than inventing a speaking witness');
const kesslerNeighborFallbackScene = { szene: 'verworfen', optionen: [] };
evidenceFallbackContext.enforceSceneWorldTruthFallback(kesslerNeighborFallbackScene, {
  code: 'evidence_scope_drift',
  indizId: 'nachbarin_aussage',
  indizText: 'Frau Pohl: Robert kommt seit Monaten jeden Mittwoch zu der Hauke im dritten Stock',
  quelle: 'person',
  npc: 'frau_pohl'
});
assert(kesslerNeighborFallbackScene.szene.includes('Frau Pohl')
  && kesslerNeighborFallbackScene.szene.includes('Robert kommt seit Monaten jeden Mittwoch')
  && !/Hannelore|29\. auf den 30\. September|schwere Tasche/.test(kesslerNeighborFallbackScene.szene),
  'the shared neighbor-clue id must never inject Krause testimony into Kessler');
const krauseNeighborFallbackScene = { szene: 'verworfen', optionen: [] };
evidenceFallbackContext.enforceSceneWorldTruthFallback(krauseNeighborFallbackScene, {
  code: 'evidence_scope_drift',
  indizId: 'nachbarin_aussage',
  indizText: 'Hannelore Wirth: Zwei Männer kamen mit einer schweren Tasche aus dem Hinterhof',
  quelle: 'person',
  npc: 'hannelore_wirth'
});
assert(krauseNeighborFallbackScene.szene.includes('Hannelore Wirth')
  && /zwei Männer/i.test(krauseNeighborFallbackScene.szene)
  && krauseNeighborFallbackScene.szene.includes('schweren Tasche')
  && !/Robert|Hauke|Mittwoch/.test(krauseNeighborFallbackScene.szene),
  'the shared neighbor-clue id must preserve Krause testimony without Kessler leakage');
const krauseArrivalFallbackScene = {
  szene: 'verworfen',
  personenImRaum: ['Hannelore Wirth'],
  optionen: []
};
evidenceFallbackContext.engineCurrentLocation = { name: 'Krauses Antiquitaeten' };
evidenceFallbackContext.enforceSceneWorldTruthFallback(krauseArrivalFallbackScene, {
  code: 'fixed_interior_image_drift',
  firstVisit: true
});
assert(krauseArrivalFallbackScene.szene.includes('zerschlagenen flachen Schauvitrinen')
  && krauseArrivalFallbackScene.szene.includes('unversehrte stehende Glasvitrine an der Rückwand')
  && krauseArrivalFallbackScene.szene.includes('aufgebrochene Hinterhoffenster')
  && !/sichtbare Ansatzpunkte|Niemand hier gibt vor|dargestellten Innenraum|eigentliche Szene/i.test(krauseArrivalFallbackScene.szene),
  'Krause arrival fallback must stay natural and must not expose repair-language');
const roleLabelContext = {
  normForMatch: value => String(value || '').toLowerCase()
};
vm.createContext(roleLabelContext);
vm.runInContext(sourceOf('_standRollenLabel'), roleLabelContext);
assert.strictEqual(roleLabelContext._standRollenLabel({
  tag: 'TARGET', rolle: 'Diebesgut (Zielobjekt der Suche)'
}, { TARGET: 'Zielperson' }), 'Zielobjekt',
  'the current-state UI must not label a physical stolen object as a person');
assert.strictEqual(roleLabelContext._standRollenLabel({
  tag: 'TARGET', rolle: 'Zielobjekt der Beschattung'
}, { TARGET: 'Zielperson' }), 'Zielperson',
  'a living surveillance target must remain a Zielperson despite its setup role wording');
assert.strictEqual(roleLabelContext._standRollenLabel({
  tag: 'TARGET', rolle: 'Vermisster Sohn'
}, { TARGET: 'Zielperson' }), 'Zielperson',
  'a human target must retain the Zielperson label');
assert(html.includes('<span class="status-popup-label">Miete</span>')
  && !html.includes('<span class="status-popup-label">Miete offen</span>'),
  'the rent row label must remain truthful when its value says beglichen');
assert(html.includes('Betr\\u00e4ge wie 15 Mark bestehen aus mehreren Scheinen oder Scheinen und M\\u00fcnzen')
  && html.includes('nie "der Schein"'),
  'the historical money guard must prevent a fictional single 15-Mark banknote');
const paymentRepairContext = {
  window: { _letzteAktion: { text: '15 Ostmark zahlen · Renommee +1' } },
  diag: () => {}
};
vm.createContext(paymentRepairContext);
vm.runInContext(sourceOf('repairHistoricPaymentDenomination'), paymentRepairContext);
const fictionalFifteenMarkNote = {
  szene: 'Du reichst Frau Pohl einen Schein über fünfzehn Mark. Sie steckt das Geld ein.'
};
assert.strictEqual(paymentRepairContext.repairHistoricPaymentDenomination(fictionalFifteenMarkNote), true,
  'a booked 15-Mark payment must deterministically repair a fictional single banknote');
assert(fictionalFifteenMarkNote.szene.includes('fünfzehn Ostmark in mehreren Scheinen')
  && !/einen Schein über fünfzehn Mark/i.test(fictionalFifteenMarkNote.szene),
  'the visible payment prose must use a historically possible bundle of notes');

console.log('LIVE_LEKTORAT_REGRESSION_OK');
