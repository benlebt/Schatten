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
assert(sourceOf('fixSprache').includes(".replace(/\\b([Dd])u rappelt\\b/g, '$1u rappelst')"),
  'the observed du rappelt conjugation error must be corrected conservatively');
assert(html.includes('ALKOHOLZUSTAND (HARTE ENGINE-WAHRHEIT)'),
  'a sober sleep action must explicitly forbid invented drinking and hangover prose');
const languageContext = {};
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
const wrappedWithDialogue = '"Du gehst auf Robert zu. ' + 'Der Hof bleibt still, waehrend du jeden seiner Schritte beobachtest. '.repeat(3) + '"Was wollen Sie?", fragt Robert."';
assert(!languageContext.fixSprache(wrappedWithDialogue).startsWith('"') && languageContext.fixSprache(wrappedWithDialogue).includes('"Was wollen Sie?"'),
  'outer narrative quotes must be removed even when genuine dialogue quotes remain inside');
assert.strictEqual(languageContext.fixSprache('"Was wollen Sie hier?", fragt Robert.'), '"Was wollen Sie hier?", fragt Robert.',
  'real direct speech must keep its quotation marks');
assert(sourceOf('buildWorldTruthRepairHint').includes('ENGINE-WAHRHEIT VERLETZUNG'),
  'offscreen injury drift needs a targeted repair prompt');
const evidenceFallbackContext = {
  engineCurrentLocation: { name: 'Hinterhof Sybelstrasse' },
  normForMatch: value => String(value || '').toLowerCase()
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

console.log('LIVE_LEKTORAT_REGRESSION_OK');
