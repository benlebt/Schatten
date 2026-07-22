const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

for (const visibleAsciiLeak of [
  "label: 'Bei der Polizei schuetzen'",
  "label: 'Mobilitaet (S-Bahn/Pappkarte/Sektor)'",
  "label: 'Getraenke (Molle+Korn/Muckefuck/Berliner Weisse)'",
  "? 'Verfuehrerisch'",
  "'Sympathie', 'Naehe', 'Anziehung'",
  'weitere Ansaetze fuer heute',
  'alle Ansaetze verbrannt',
  'ein spaeterer Zeitpunkt kann das aendern',
]) {
  assert(!html.includes(visibleAsciiLeak),
    'visible UI text still contains an avoidable replacement umlaut: ' + visibleAsciiLeak);
}

assert(!html.includes('vorgeschrieben fuer alle Witwen heute'),
  'the Lindenbaum setup must not invent a blanket mourning-band mandate for widows');
assert(html.includes('der "Neue Kurs" wird erst am 9. Juni verkuendet'),
  'April/May enrichment must preserve the actual New Course chronology');

const locationsStart = html.indexOf('function normForMatch');
const locationsEnd = html.indexOf('function istReisbarerOrt', locationsStart);
assert(locationsStart >= 0 && locationsEnd > locationsStart,
  'global location runtime slice is missing');
const context = {
  caseSetup: {
    caseType: 'wahrheit',
    klient: 'Auguste Lindenbaum',
    locations: [{ name: 'Pathologie Charite', startBekannt: true }],
  },
};
vm.createContext(context);
vm.runInContext(
  html.slice(locationsStart, locationsEnd)
    + ';globalThis.getCaseLocationsTest=getCaseLocations;',
  context,
);
const injected = context.getCaseLocationsTest();
const pathology = injected.find((location) => /pathologie/i.test(location.name));
const hospital = injected.find((location) => /charit/i.test(location.name) && !/pathologie/i.test(location.name));
assert(pathology && !pathology.heilort,
  'the pathology must remain a non-healing story location');
assert(hospital && hospital.heilort && hospital.startBekannt,
  'a pathology case must also receive the normal hospital as a healing location');

console.log('SYSTEM_AUDIT_REGRESSION_OK');
