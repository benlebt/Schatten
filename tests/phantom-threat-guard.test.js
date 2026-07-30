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
  for (let i = brace; i < html.length; i += 1) {
    if (html[i] === '{') depth += 1;
    if (html[i] === '}') {
      depth -= 1;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('unterminated function ' + name);
}

const context = {
  normForMatch: (value) => String(value || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/\s+/g, ' ').trim(),
  caseProgress: { encounterState: 'frei' },
  engineCurrentLocation: { name: 'Erich Brandts ehemalige Wohnung' },
  getNpcsAtCurrentLocation: () => [],
  _npcZustandIstEntfernt: () => false,
  _worldTruthAliases: (id, npc) => [String((npc && npc.name) || id || '').toLowerCase()],
  _worldTruthHasAlias: (text, aliases) => aliases.some(alias =>
    String(text || '').toLowerCase().includes(String(alias || '').toLowerCase()))
};
vm.createContext(context);
vm.runInContext(sourceOf('_findPhantomImmediateThreat'), context);
vm.runInContext(sourceOf('_splitWorldTruthSentences'), context);
vm.runInContext(sourceOf('_findUnrosteredPresentActor'), context);
vm.runInContext(sourceOf('_findArrivalNpcRosterDrift'), context);
vm.runInContext(sourceOf('enforceSceneWorldTruthFallback'), context);
vm.runInContext(sourceOf('validateOpeningRoleTruth'), context);

let problem = context._findPhantomImmediateThreat({
  ort: 'Erich Brandts ehemalige Wohnung',
  szene: 'Du trittst ein. Plötzlich spürst du den scharfen, kalten Lauf eines Revolvers im Nacken und eine raue Stimme flüstert: „Beweg dich nicht, Mauer, sonst wird die Spurensuche für dich hier enden.“',
  personenImRaum: [],
  cast_hinzugefuegt: []
}, { id: 'REISE', _istReise: true });
assert(problem && problem.code === 'phantom_immediate_threat',
  'an immediate armed threat without a visible actor must be rejected');

const steinOpening = {
  ort: 'Karl Mauers BÃ¼ro',
  szene: 'Margarete hat dir am Telefon von den Dokumenten berichtet. Es ist kein zÃ¶gerliches Klopfen, sondern das harte Pochen von jemandem, der keine Antwort erwartet, sondern sich den Zutritt erzwingt. DrauÃŸen steht jemand, der nicht fÃ¼r eine Auskunft kommt.',
  personenImRaum: [],
  cast_hinzugefuegt: []
};
problem = context._findPhantomImmediateThreat(steinOpening, { id: 'INTRO', _istOpening: true });
assert(problem && problem.code === 'phantom_immediate_threat',
  'forced entry by an anonymous opening actor must be rejected');

const openingProblem = context.validateOpeningRoleTruth(
  steinOpening.szene,
  { caseType: 'politisch', stasiRelevance: 3, setupCast: [] },
  steinOpening
);
assert(openingProblem && openingProblem.ok === false && openingProblem.code === 'phantom_immediate_threat',
  'the shared actor guard must also protect scene-one openings');

problem = context._findPhantomImmediateThreat({
  szene: 'Im alten Polizeibericht steht, dass ihm damals ein Revolverlauf in den Nacken gedrückt wurde.',
  personenImRaum: []
}, {});
assert.strictEqual(problem, null, 'reported historical violence must remain legal');

problem = context._findPhantomImmediateThreat({
  szene: 'Kurt Lange drückt Karl den Revolverlauf gegen die Rippen.',
  personenImRaum: ['Kurt Lange']
}, {});
assert.strictEqual(problem, null, 'a visible scene actor may pose an immediate threat');

context.caseProgress.activeConfrontation = { enemyName: 'Kurt Lange' };
problem = context._findPhantomImmediateThreat({
  szene: 'Ein Revolverlauf drückt sich gegen Karls Rücken.',
  personenImRaum: []
}, {});
assert.strictEqual(problem, null, 'an engine-backed confrontation remains legal');

context.caseProgress.activeConfrontation = null;
problem = context._findUnrosteredPresentActor({
  szene: 'In der Ecke des Zimmers steht eine Frau, die dich mit geweiteten Augen anstarrt. Es ist die Vermieterin.',
  personenImRaum: [],
  cast_hinzugefuegt: []
}, { id: 'REISE', _istReise: true });
assert(problem && problem.code === 'unrostered_present_actor',
  'a prose-only landlady without roster, UI and image representation must be rejected');

problem = context._findUnrosteredPresentActor({
  szene: 'Unter der TÃ¼r liegt ein Schatten. DrauÃŸen steht jemand und wartet auf deine Reaktion.',
  personenImRaum: []
}, {});
assert(problem && problem.code === 'unrostered_present_actor',
  'an anonymous present actor outside the door must be rejected');

problem = context._findUnrosteredPresentActor({
  szene: 'Ein schwarzer EMW hÃ¤lt an der Ecke. Jemand steigt aus, ein Mann im grauen Trenchcoat.',
  personenImRaum: [],
  cast_hinzugefuegt: ['Mann im grauen Trenchcoat']
}, {});
assert(problem && problem.code === 'unrostered_present_actor',
  'a cast-only actor who is absent from personenImRaum must be rejected');

const perceivedOpening = {
  ort: 'Karl Mauers Buero',
  szene: 'Du wirfst einen Blick zur Tuer. Draussen im Halbschatten des Flurs glaubst du, den langen Mantel von Hauptmann Vollmer zu erkennen, der sich gerade vom Licht der Strassenlaterne abwendet.',
  personenImRaum: ['Margarete Stein'],
  cast_hinzugefuegt: ['Hauptmann Vollmer']
};
const perceivedSetup = {
  caseType: 'politisch',
  stasiRelevance: 3,
  setupCast: [{ id: 'vollmer', name: 'Hauptmann Vollmer' }]
};
problem = context._findUnrosteredPresentActor(perceivedOpening, {}, perceivedSetup);
assert(problem && problem.code === 'unrostered_present_actor' && problem.npc === 'Hauptmann Vollmer',
  'a perceived named actor needs their own physical roster entry even when another actor is rostered');

const perceivedOpeningProblem = context.validateOpeningRoleTruth(
  perceivedOpening.szene,
  perceivedSetup,
  perceivedOpening
);
assert(perceivedOpeningProblem && perceivedOpeningProblem.ok === false
    && perceivedOpeningProblem.code === 'unrostered_present_actor',
  'the opening guard must reject a prose-only named sighting');

problem = context._findUnrosteredPresentActor({
  szene: perceivedOpening.szene,
  personenImRaum: ['Hauptmann Vollmer']
}, {}, perceivedSetup);
assert.strictEqual(problem, null, 'the perceived actor remains legal when physically rostered');

problem = context._findUnrosteredPresentActor({
  szene: 'Du blickst aus dem Fenster, wo ein schwarzer Wagen auf der anderen Strassenseite parkt. Der Mann im grauen Trenchcoat darin ist dir schon am Hackeschen Markt aufgefallen.',
  personenImRaum: ['Kommissar Heinrich Lindner'],
  cast_hinzugefuegt: []
}, {});
assert(problem && problem.code === 'unrostered_present_actor',
  'a rostered client must not authorize a separate anonymous actor outside');

problem = context._findUnrosteredPresentActor({
  szene: 'Draussen auf der Strasse steht in einiger Entfernung ein Mann im grauen Mantel, der unbeweglich Richtung Polizeirevier starrt.',
  personenImRaum: ['Kommissar Heinrich Lindner'],
  cast_hinzugefuegt: []
}, {});
assert(problem && problem.code === 'unrostered_present_actor',
  'a spatially separated anonymous actor must also be caught in verb-first word order');

problem = context._findUnrosteredPresentActor({
  szene: 'Draussen an der Ecke bemerkst du einen Mann in einem grauen Trenchcoat, der dich durch das Fenster mustert.',
  personenImRaum: ['Kommissar Heinrich Lindner']
}, {});
assert(problem && problem.code === 'unrostered_present_actor',
  'a spatially separated perceived actor must be caught before the role noun');

problem = context._findUnrosteredPresentActor({
  szene: 'Lindner schliesst die Tuer. Draussen geht ein Mann in einem grauen Mantel den Flur entlang und spaehte durch den Tuerspalt in das Zimmer.',
  personenImRaum: ['Kommissar Heinrich Lindner']
}, {});
assert(problem && problem.code === 'unrostered_present_actor',
  'a gray-coated corridor observer must be rejected even when the verb is entlanggeht or spaehte');

problem = context._findUnrosteredPresentActor({
  szene: 'Ein Mann in einem grauen Trenchcoat, den du bisher nur vom Sehen und aus vagen Berichten kanntest, nickt dir knapp zu, bevor er sein Buero verlaesst.',
  personenImRaum: ['Kommissar Heinrich Lindner']
}, {});
assert(problem && problem.code === 'unrostered_present_actor',
  'a gray-coated opening extra must not evade the roster guard by merely nodding and leaving');

problem = context._findUnrosteredPresentActor({
  szene: 'Draussen auf der Strasse steht eine Limousine mit verdunkelten Scheiben, deren Insasse dich seit einer Stunde beobachtet.',
  personenImRaum: ['Kommissar Heinrich Lindner']
}, {});
assert(problem && problem.code === 'unrostered_present_actor',
  'an anonymous observer inside a vehicle must not exist only in prose');

problem = context._findUnrosteredPresentActor({
  szene: 'Lindner spricht leise. Durch die geoeffnete Buerotuer siehst du Hauptmann Vollmer im Flur stehen, der unnatuerlich lange an einer Akte liest.',
  personenImRaum: ['Kommissar Heinrich Lindner']
}, {});
assert(problem && problem.code === 'unrostered_present_actor',
  'a named ranked actor outside the physical roster must be rejected');

problem = context._findUnrosteredPresentActor({
  szene: 'Das Klappern von Absaetzen kuendigt an, dass jemand den Korridor betritt.',
  personenImRaum: ['Vize-Direktor Otto Wegner', 'Bankpfoertner']
}, {});
assert(problem && problem.code === 'unrostered_present_actor',
  'someone entering a corridor must be rostered or backed by an active encounter');

context.engineCurrentLocation = { name: 'Hinterhof Sybelstrasse' };
context.getNpcsAtCurrentLocation = () => [
  { id: 'frau_pohl', name: 'Frau Pohl' },
  { id: 'frau_hauke', name: 'Frau Hauke' }
];
const kesslerOpening = {
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Robert ist noch nicht zu sehen. Du stehst allein in der feuchten Stille des Hofes.',
  personenImRaum: ['Frau Pohl', 'Frau Hauke']
};
const kesslerRosterProblem = context.validateOpeningRoleTruth(
  kesslerOpening.szene,
  { caseType: 'beziehung', setupCast: [] },
  kesslerOpening
);
assert(kesslerRosterProblem && kesslerRosterProblem.code === 'arrival_npc_roster_drift',
  'opening prose must visibly dramatize every engine-present roster actor');
context.engineCurrentLocation = { name: 'Hinterhof Sybelstrasse' };
context.caseProgress = { indizien: [] };
const repairedKesslerOpening = {
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Edith Kessler hat dich beauftragt, Robert zu beschatten. Frau Pohl lehnt sich aus ihrem Fenster im zweiten Stock. Frau Hauke steht hinten im Hof bei ihrem Wäscheständer. Du wartest vor Robert allein im Hinterhof.',
  personenImRaum: ['Frau Pohl', 'Frau Hauke'],
  optionen: [{ id: 'A', text: 'Warten' }]
};
context.enforceSceneWorldTruthFallback(repairedKesslerOpening, {
  code: 'arrival_npc_roster_drift',
  opening: true,
  required: ['Frau Pohl', 'Frau Hauke']
});
assert(/Edith Kessler/.test(repairedKesslerOpening.szene)
    && /linken Erdgeschossfenster/.test(repairedKesslerOpening.szene)
    && /oberen rechten Hoffenster/.test(repairedKesslerOpening.szene),
  'the opening roster fallback must preserve the assignment and add both fixed window positions');
assert(!/zweiten Stock/.test(repairedKesslerOpening.szene)
    && !/Wäscheständer/.test(repairedKesslerOpening.szene),
  'the opening roster fallback must replace contradictory witness staging instead of appending to it');
assert.deepStrictEqual(Array.from(repairedKesslerOpening.personenImRaum), ['Frau Pohl', 'Frau Hauke'],
  'the opening roster fallback must retain both physical window witnesses');
problem = context._findUnrosteredPresentActor({
  szene: 'Frau Pohl lehnt sich aus ihrem Erdgeschossfenster und spricht leise mit Karl.',
  personenImRaum: []
}, {}, {
  setupCast: [{ id: 'frau_pohl', name: 'Frau Pohl' }]
});
assert.strictEqual(problem, null,
  'an engine-present NPC must remain legal when the raw AI roster is transiently empty during their direct action');
const preservedRosterScene = {
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Frau Pohl beobachtet den Hof. In der Ecke steht eine fremde Vermieterin und starrt Karl an.',
  personenImRaum: ['Frau Pohl'],
  cast_hinzugefuegt: ['Frau Pohl', 'Fremde Vermieterin'],
  optionen: [{ id: 'A', text: 'Fragen' }]
};
context.enforceSceneWorldTruthFallback(preservedRosterScene, {
  code: 'unrostered_present_actor',
  npc: 'Fremde Vermieterin',
  sentence: 'In der Ecke steht eine fremde Vermieterin und starrt Karl an.'
});
assert(/Frau Pohl beobachtet den Hof/.test(preservedRosterScene.szene)
    && !/Karl ist hier allein/.test(preservedRosterScene.szene),
  'the actor fallback must not declare an occupied engine location empty');
assert.deepStrictEqual(Array.from(preservedRosterScene.personenImRaum).map(entry => entry.name || entry), ['Frau Pohl', 'Frau Hauke'],
  'the actor fallback must preserve the complete physical engine roster');
context.getNpcsAtCurrentLocation = () => [];

const ordinalDatePhantom = {
  ort: 'Karl Mauers Büro',
  szene: 'Hauptmann Vollmer steht im Büro und sagt, dass Werner seit dem 17. Juni verschwunden ist. Bruno Wessel hält den Blick auf Karl gerichtet.',
  personenImRaum: ['Bruno Wessel'],
  cast_hinzugefuegt: ['Hauptmann Vollmer'],
  optionen: [{ id: 'A', text: 'Fragen' }]
};
problem = context._findUnrosteredPresentActor(ordinalDatePhantom, {}, {
  setupCast: [{ id: 'vollmer', name: 'Hauptmann Vollmer' }]
});
assert(problem && /17\. Juni verschwunden ist/.test(problem.sentence),
  'world-truth detection must keep a German ordinal date inside one complete sentence');
context.enforceSceneWorldTruthFallback(ordinalDatePhantom, problem);
assert(!/Vollmer|Juni verschwunden ist/.test(ordinalDatePhantom.szene)
    && /^Bruno Wessel/.test(ordinalDatePhantom.szene),
  'removing a phantom actor must not leave a month-led sentence fragment behind');

// Ein engine-seitig vorgemerkter, ortsgebundener MfS-Zugriff ist kein
// Phantomakteur. Seine erste sichtbare Reise-Einfuehrung muss den
// Weltwahrheits-Guard passieren, damit das rote Zugriffspanel entstehen kann.
context.engineCurrentLocation = { name: 'Wessel-Wohnung' };
context.caseProgress = {
  activeConfrontation: null,
  stasiEncounter: {
    active: true,
    phase: 'zugriff',
    location: 'Wessel-Wohnung',
    name: 'Oberleutnant Mertens'
  }
};
context._stasiEncounterGet = () => context.caseProgress.stasiEncounter;
context._stasiEncounterOrtStimmt = (encounter) =>
  !!encounter && encounter.location === context.engineCurrentLocation.name;
context.getCaseLocations = () => [{ name: 'Wessel-Wohnung', npcs: [] }];
problem = context._findUnrosteredPresentActor({
  ort: 'Wessel-Wohnung',
  szene: 'Vor der Wohnung tritt Oberleutnant Mertens aus dem Treppenhaus und stellt Karl.',
  personenImRaum: ['Oberleutnant Mertens']
}, { id: 'REISE', _istReise: true }, {
  setupCast: [{ id: 'mertens', name: 'Oberleutnant Mertens', tag: 'STASI' }]
});
assert.strictEqual(problem, null,
  'an active named Stasi access must be legal in the travel-arrival roster');

problem = context._findUnrosteredPresentActor({
  szene: 'Auf dem Foto steht eine Frau vor dem Haus.',
  personenImRaum: []
}, {});
assert.strictEqual(problem, null, 'a person shown only in a photograph is not physically present');

problem = context._findUnrosteredPresentActor({
  szene: 'In der Ecke des Zimmers steht eine Frau und wartet ab.',
  personenImRaum: ['Vermieterin']
}, {});
assert.strictEqual(problem, null, 'a properly rostered scene actor remains legal');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1775 +KrauseCombatAccess'"),
  'release version missing');

console.log('phantom threat guard tests passed');
