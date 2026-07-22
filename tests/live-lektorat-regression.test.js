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
  karlAkte: { bekannte: {} }
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
  _aktuelleAktionIstReise: false,
  _aktuelleAktionIstFlucht: false,
  pendingForcedLocationChange: false
};
vm.createContext(worldContext);
vm.runInContext(sourceOf('_worldTruthAliases'), worldContext);
vm.runInContext(sourceOf('_worldTruthHasAlias'), worldContext);
vm.runInContext(sourceOf('_worldTruthOrtGleich'), worldContext);
vm.runInContext(sourceOf('_worldTruthAbschlussRueckblickErlaubt'), worldContext);
vm.runInContext(sourceOf('validateSceneWorldTruth'), worldContext);

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
assert(sourceOf('_hauptuiExecute').includes('Koerperliche Gewalt ist ausschliesslich der getrennten Spieleraktion'),
  'the verbal confrontation prompt must reserve violence for the explicit attack button');
assert(html.includes("indiz.hotspot = 'Klingelschilder am Hofeingang pruefen'"),
  'the Kessler doorbell clue must remain reachable from the engine courtyard');
assert(html.includes('Neben der hofseitigen Eingangstuer haengen die Klingelschilder'),
  'the Kessler clue text must not order prose into a mismatching house interior');
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
assert(sourceOf('buildWorldTruthRepairHint').includes('ENGINE-WAHRHEIT VERLETZUNG'),
  'offscreen injury drift needs a targeted repair prompt');

console.log('LIVE_LEKTORAT_REGRESSION_OK');
