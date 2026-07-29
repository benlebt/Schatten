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

const goerkeStart = html.indexOf("klient: 'Albrecht Goerke");
const goerkeEnd = html.indexOf('// 13. Schwester Hilde', goerkeStart);
assert(goerkeStart >= 0 && goerkeEnd > goerkeStart, 'Goerke setup slice missing');
const goerke = html.slice(goerkeStart, goerkeEnd);

assert(goerke.includes("{ id: 'reinhard_baumgarten', zeit: ['morgen','vormittag','mittag','nachmittag'] }"),
  'Baumgarten must be present in the morning opening');
assert(/name: 'Albrecht Goerke U-Haft'[\s\S]*?npcs: \[\{ id: 'albrecht_goerke', immer: true \}\]/.test(goerke),
  'Albrecht must remain selectable in his own U-Haft scene');
assert(/name: 'Anwaltsbuero Baumgarten'[\s\S]*?npcs: \[\{ id: 'reinhard_baumgarten'/.test(goerke),
  'Baumgarten must remain selectable while his office image depicts him');
assert(goerke.includes("{ id: 'hauptmann_krollwitz', immer: true, abStage: 3 }"),
  'Krollwitz must not appear before the political pressure phase');
assert(!/name: 'Kreisgericht Mitte'[\s\S]{0,500}id: 'staatsanwalt_mertens'/.test(goerke)
  && !/name: 'Kreisgericht Mitte'[\s\S]{0,500}id: 'richterin_schoening'/.test(goerke),
  'the adjourned opening must not expose prosecutor or judge as selectable people');
assert(/id: 'hauptmann_krollwitz'[\s\S]{0,700}knownAfterEvidence: 'krollwitz_steuerung'/.test(goerke),
  'Krollwitz identity must remain evidence-gated away from his configured encounter');
assert(goerke.includes('Sechs Monate später war Mathilde tot'),
  'the opening chronology must place Mathilde’s death four months before the September case');
assert(goerke.includes('Albrechts Verteidiger und dein langjähriger juristischer Kontakt'),
  'opening prompt must state Baumgarten case role unambiguously');
assert(!goerke.includes('dein langjähriger Anwalt-Partner'),
  'opening prompt must not frame Baumgarten primarily as Karl\'s lawyer');
assert(goerke.includes("requiresEvidenceAny: ['alibi_schichtbuch']"),
  'Albrecht exoneration must require the configured alibi evidence');
assert(/id: 'krollwitz_mertens'[\s\S]*?requiresEvidenceAny: \['krollwitz_steuerung'\]/.test(goerke),
  'political manipulation beat must require the configured file evidence');
assert(/name: 'Gerichtsarchiv Kreisgericht Mitte'[\s\S]*?lokalVon: \['Kreisgericht Mitte'\]/.test(goerke),
  'court archive must be a local walk instead of an Opel trip');
assert(goerke.includes('Vor Stage 3 und vor dem Fund "krollwitz_steuerung" darf niemand Krollwitz nennen'),
  'Goerke setup must keep Krollwitz secret until the evidence chain reaches him');
assert(html.slice(html.lastIndexOf("caseType: 'wahrheit'", goerkeStart), goerkeEnd).includes('stasiRelevance: 3')
  && html.slice(html.lastIndexOf("caseType: 'wahrheit'", goerkeStart), goerkeEnd).includes('politisch: true'),
  'Goerke must be treated as a genuinely political case, not as incidental Stasi atmosphere');
assert(/Staatsanwalt Eberhard Mertens[\s\S]{0,500}persistent: false, anwesend: false/.test(goerke)
  && /Richterin Anna Schoening[\s\S]{0,500}persistent: false, anwesend: false/.test(goerke),
  'the adjourned opening must not keep prosecutor and judge selectable beside the Baumgarten-only image');
assert(/volkspolizei\.\*keibelstrasse\|keibelstrasse[\s\S]{0,600}depictsNpcs: \['wilhelm_roth'\]/.test(html),
  'the Keibelstrasse image must explicitly identify the visible desk officer as Wilhelm Roth');
assert(/id: 'totenschein_manip'[\s\S]{0,900}truthBeatIds: \['sturz_angezweifelt','akte_manipuliert'\]/.test(goerke),
  'the manipulated death certificate must deterministically book both documentary truth beats');
assert(/id: 'mathilde_fremdeinwirkung'[\s\S]{0,900}truthBeatIds: \['fremdeinwirkung'\]/.test(goerke),
  'the original autopsy finding must deterministically book external force');
assert(/id: 'alibi_schichtbuch'[\s\S]{0,1100}truthBeatIds: \['alibi_unterschlagen','albrecht_entlastet'\]/.test(goerke),
  'the signed shift book must deterministically book both alibi beats');
assert(/id: 'krollwitz_steuerung'[\s\S]{0,1800}abschlussEffekt:[\s\S]{0,220}wahrheitErkannt: true/.test(goerke),
  'the final Krollwitz evidence must make the already complete truth chain immediately resolvable');
assert(goerke.includes('Draußen rollen Güterwagen vorbei')
  && !goerke.includes('Draußen rollen Güterwagen durch die Nacht'),
  'the fixed Stellwerk arrival must not contradict an afternoon header and daylight image');
assert(/test: \/gerichtsarchiv\/[\s\S]{0,500}depictsNpcs: \[\][\s\S]{0,500}kein Archivar ist anwesend/.test(html),
  'the empty archive image must explicitly bind prose and UI to Karl being alone');
assert(sourceOf('repairEvidenceGatedNpcProse').includes('knownAfterEvidence')
  && sourceOf('repairEvidenceGatedNpcProse').includes('BELEG-GATE repariert'),
  'evidence-gated identities must be removed enginewide from premature foreign-location prose');
assert(goerke.includes('wird die Sitzung wegen fehlender Unterlagen kurzfristig vertagt'),
  'Goerke opening must release Karl before the investigation travel flow starts');
assert(goerke.includes('du bist fuer heute entlassen und kannst sofort ermitteln'),
  'Goerke prompt must make immediate post-opening travel narratively valid');
assert(!html.includes("' ist am Schauplatz sichtbar anwesend.'"),
  'generic opening roster fallback must dramatize presence instead of emitting metadata prose');
assert(html.includes("' tritt sichtbar an dich heran und wartet auf deine Reaktion.'"),
  'single-person opening fallback needs a natural visible action');
assert(html.includes('!_ungespraechtePersonOffen && !_ortHatOffeneFundstuecke'),
  'an unspoken local person must suppress the exhausted-location banner');
assert(html.includes("sameNamedPerson(c.name, entry.name)"),
  'cast additions must use the central person identity matcher');
assert(html.includes("sameNamedPerson(c.name || c, pName)"),
  'personenImRaum additions must use the central person identity matcher');

const nameContext = {
  caseSetup: {
    setupCast: [
      { name: 'Dr. Reinhard Baumgarten' },
      { name: 'Albrecht Goerke' },
      { name: 'Mathilde Goerke' },
    ],
  },
};
vm.createContext(nameContext);
vm.runInContext(sourceOf('normForMatch') + '\n' + sourceOf('sameNamedPerson'), nameContext);
assert.strictEqual(nameContext.sameNamedPerson('Dr. Baumgarten', 'Dr. Reinhard Baumgarten'), true,
  'a titled surname alias must match the canonical full name');
assert.strictEqual(nameContext.sameNamedPerson('Albrecht Goerke', 'Mathilde Goerke'), false,
  'shared surnames must not merge two distinct setup people');

const openingPresenceDiagnostics = [];
const openingPresenceContext = {
  caseSetup: nameContext.caseSetup,
  getNpcsAtCurrentLocation: () => [{ name: 'Dr. Reinhard Baumgarten' }],
  diag: (type, message) => openingPresenceDiagnostics.push(type + ':' + message),
};
vm.createContext(openingPresenceContext);
vm.runInContext(
  sourceOf('normForMatch') + '\n' + sourceOf('sameNamedPerson') + '\n' + sourceOf('_enforceOpeningRosterPresence'),
  openingPresenceContext
);
const contradictoryOpening = {
  szene: 'Du wartest im Gerichtsflur. Der Flur ist leer und Baumgarten ist nicht zu sehen. Die Sitzung ist vertagt.',
};
openingPresenceContext._enforceOpeningRosterPresence(contradictoryOpening);
assert(!/nicht zu sehen/.test(contradictoryOpening.szene),
  'opening repair must remove explicit absence of an engine-present NPC');
assert(/Dr\. Reinhard Baumgarten tritt sichtbar an dich heran/.test(contradictoryOpening.szene),
  'opening repair must visibly restore the engine-present NPC');
assert(openingPresenceDiagnostics.some(line => line.includes('OPENING-ANWESENHEIT repariert')),
  'opening presence repair needs a diagnostic');

const romanceLocationContext = {
  caseSetup: {
    locations: [
      { name: 'Martha Brommers Wohnung', npcs: [{ id: 'martha_brommer' }] },
      { name: 'Gerichtsarchiv Kreisgericht Mitte', npcs: [] },
      { name: 'Mathilde Goerkes Salon', npcs: [] },
    ],
  },
};
vm.createContext(romanceLocationContext);
vm.runInContext(sourceOf('normForMatch') + '\n' + sourceOf('_romancePushOrtPlausibel'), romanceLocationContext);
const martha = {
  name: 'Martha Brommer',
  id: 'martha_brommer',
  triggerWhen: 'Karl besucht den geschlossenen Salon oder Martha Brommers Wohnung alleine, Abend, niedrige Spannung',
};
assert.strictEqual(romanceLocationContext._romancePushOrtPlausibel(martha, 'Gerichtsarchiv Kreisgericht Mitte'), false,
  'a location-bound romance NPC must not teleport into the court archive');
assert.strictEqual(romanceLocationContext._romancePushOrtPlausibel(martha, 'Martha Brommers Wohnung'), true,
  'a location-bound romance NPC must remain available at her configured location');
assert.strictEqual(romanceLocationContext._romancePushOrtPlausibel(martha, 'Mathilde Goerkes Salon'), true,
  'an explicitly named trigger location must remain available');
assert(html.includes('_romOrtPlausibel && !_romInCast'),
  'the proactive romance prompt must obey location plausibility');
assert(html.includes('_romancePushOrtPlausibel(romanceNpc, romanceOrt)'),
  'the engine-side forced romance introduction must obey location plausibility');

const showdownPresenceContext = {
  engineCurrentLocation: { name: 'Stellwerk Schoeneweide' },
  caseProgress: {
    showdownAktiv: true,
    showdownBestanden: false,
    showdownGegner: 'Hauptmann Dietmar Krollwitz',
  },
};
vm.createContext(showdownPresenceContext);
vm.runInContext(sourceOf('normForMatch') + '\n' + sourceOf('_npcGehoertHierher'), showdownPresenceContext);
assert.strictEqual(showdownPresenceContext._npcGehoertHierher(
  'hauptmann_krollwitz',
  'Hauptmann Dietmar Krollwitz'
), true, 'an active showdown opponent must survive the final location filter');
assert(html.includes('erledigt: !!(!_showdownTarget && _schonGesprochen && !_hatNochHinweis)'),
  'an earlier interview must not disable the opponent when the real showdown starts');

assert(html.includes("file: 'kreisgericht-mitte-baumgarten-day.png'"),
  'the court opening needs its Baumgarten image');
assert(html.includes("file: 'kreisgericht-mitte-krollwitz-civil-day.png'"),
  'the court confrontation needs the civilian Krollwitz image');
assert(html.includes("file: 'stellwerk-schoeneweide-krollwitz-night.png'"),
  'the Stellwerk showdown needs Krollwitz visibly in the image');
for (const file of [
  'kreisgericht-mitte-baumgarten-day.png',
  'kreisgericht-mitte-krollwitz-civil-day.png',
  'stellwerk-schoeneweide-krollwitz-night.png',
]) {
  assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'goerke', file)),
    'missing Goerke image asset: ' + file);
}
assert(sourceOf('_renderKesslerSceneVisual').includes('SZENENBILD bleibt als Ortsmotiv sichtbar'),
  'a cast-contract warning must not collapse the entire scene image');
assert(goerke.includes('arrivalFallbackText:'),
  'the Stellwerk needs a concrete deterministic fallback instead of AI-instruction prose');
assert(html.includes('function repairGoerkeArchiveContinuity(sceneOrEntry)')
    && html.includes("normForMatch('Gerichtsarchiv Kreisgericht Mitte')")
    && html.includes('GÖRKE-ARCHIV repariert')
    && html.includes('repairGoerkeArchiveContinuity(scene);')
    && html.includes('logEntries.forEach(function(entry) { repairGoerkeArchiveContinuity(entry); });'),
  'the empty Goerke archive must stay consistent across prose, UI, image and restored saves');
assert(goerke.includes("name: 'Martha Brommers Wohnung'") && goerke.includes("außer euch ist niemand in der Wohnung")
    && goerke.includes("name: 'Albrecht Goerke U-Haft'") && goerke.includes("Baumgartens Vollmacht"),
  'Martha and Albrecht need deterministic arrivals without stale Trude action');
assert(html.includes('function repairGoerkeArrivalContinuity(sceneOrEntry)')
    && html.includes('GÖRKE-ANKUNFT repariert')
    && html.includes('repairGoerkeArrivalContinuity(scene);')
    && html.includes('logEntries.forEach(function(entry) { repairGoerkeArrivalContinuity(entry); });')
    && html.includes('knallfroesche|knallfrosche|dunkle limousine|fdgb|salem'),
  'Goerke arrivals must reject imaginary item use and pre-gate Krollwitz signatures');
assert(sourceOf('repairBasicGermanProse').includes('und dreht'),
  'Trude narration must repair the observed subject-verb drift');
assert(goerke.includes("abschlussVermittler: 'Dr. Reinhard Baumgarten'"),
  'the detained client needs Baumgarten as a credible finale intermediary');
assert(sourceOf('_abschlussOrtOhneFestesTelefon').includes('|opel|wagen|fahrzeug|auto|stellwerk|'),
  'cars and the Stellwerk must not receive invented fixed telephones');
assert(html.includes('ÜBER DEN BEAUFTRAGTEN VERMITTLER'),
  'resolution prompting must support a configured intermediary');
assert(sourceOf('_hauptuiKlientenberichtOffen').includes('istVermittler'),
  'a configured intermediary must become a usable report target at stage 3');
assert(html.includes('dem beauftragten Vermittler'),
  'the report action must describe a handoff through the intermediary');
assert(sourceOf('buildFallbackAbschlussProsa').includes('zur Weitergabe an'),
  'the solved summary must not claim a direct report to a detained client');
assert(sourceOf('enforceSceneWorldTruthFallback').includes('_innenConfiguredFallback'),
  'fixed-interior repair must preserve a configured concrete arrival fallback');
assert(sourceOf('_bedrohungsCliffhangerSichtbarBezahlt').includes('nirgends mehr zu sehen'),
  'a visibly vanished old threat must not leak into every later travel scene');
assert(sourceOf('repairBasicGermanProse').includes('Du ignorierst'),
  'the common second-person agreement error must be repaired');
assert(sourceOf('enforceSceneWorldTruthFallback').includes('_actorFolgesatz'),
  'removing an unrostered named actor must also remove its dangling pronoun sentences');
assert(!html.includes('Ein Trümmergrundstück gleich nebenan'),
  'generic atmosphere must not claim that a rubble lot is next to every East-Berlin interior');

const diagnostics = [];
const context = {
  caseSetup: {
    truthBeats: [
      {
        id: 'albrecht_entlastet',
        label: 'Albrecht durch die Beweiskette entlastet',
        entlastung: true,
        requiresEvidenceAny: ['alibi_schichtbuch'],
        keywords: /\balbrecht\w*[\s\S]{0,60}(unschuldig|entlastet|alibi)/i,
      },
      {
        id: 'krollwitz_mertens',
        label: 'Krollwitz/Mertens-Verbindung zur Manipulation',
        pflicht: true,
        requiresEvidenceAny: ['krollwitz_steuerung'],
        keywords: /\bmertens\w*[\s\S]{0,80}(akte|ueberzeugt|manipul)/i,
      },
    ],
  },
  caseProgress: { truthBeatsHit: [], gefundeneIndizIds: [] },
  sceneCounter: 1,
  diag: (type, message) => diagnostics.push(type + ':' + message),
  console: { log: () => {} },
};
vm.createContext(context);
vm.runInContext(sourceOf('_truthBeatHatExplizitesGestaendnis') + '\n' + sourceOf('updateTruthBeats'), context);

context.updateTruthBeats('Albrecht behauptet aus der U-Haft, er sei unschuldig.');
assert.deepStrictEqual(Array.from(context.caseProgress.truthBeatsHit), [],
  'a suspect claim must not become proven exoneration');
assert(diagnostics.some(line => line.includes('braucht mindestens einen gefundenen Sachbeleg')),
  'blocked evidence-gated beat needs a diagnostic');

context.caseProgress.gefundeneIndizIds.push('alibi_schichtbuch');
context.updateTruthBeats('Das Schichtbuch belegt Albrechts Alibi und entlastet ihn.');
assert.deepStrictEqual(Array.from(context.caseProgress.truthBeatsHit), ['albrecht_entlastet'],
  'the found alibi evidence must unlock the exoneration beat');

context.updateTruthBeats('Die Aktenlage ist dünn, aber Mertens ist überzeugt.');
assert.deepStrictEqual(Array.from(context.caseProgress.truthBeatsHit), ['albrecht_entlastet'],
  'Mertens opinion must not prove political file manipulation');
context.caseProgress.gefundeneIndizIds.push('krollwitz_steuerung');
context.updateTruthBeats('Mertens manipulierte die Akte auf Anordnung von Krollwitz.');
assert(context.caseProgress.truthBeatsHit.includes('krollwitz_mertens'),
  'the found Krollwitz file evidence must unlock the manipulation beat');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1716 +GoerkeArrivalTruth'"),
  'release version missing');

console.log('Goerke opening/truth regression checks passed.');
