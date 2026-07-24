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
assert(goerke.includes("{ id: 'hauptmann_krollwitz', immer: true, abStage: 3 }"),
  'Krollwitz must not appear before the political pressure phase');
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

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1530 +OpeningRosterTruth-Staging'"),
  'release version missing');

console.log('Goerke opening/truth regression checks passed.');
