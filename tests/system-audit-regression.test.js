const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
  .map((match) => match[1]);
inlineScripts.forEach((script, index) => {
  assert.doesNotThrow(() => new vm.Script(script, { filename: `inline-script-${index + 1}.js` }),
    `inline browser script ${index + 1} must parse`);
});

const declaredIds = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
const duplicateIds = [...new Set(declaredIds.filter((id, index) => declaredIds.indexOf(id) !== index))];
assert.deepStrictEqual(duplicateIds, [], 'static HTML ids must be unique');

const runtimeIds = new Set([
  ...declaredIds,
  ...[...html.matchAll(/\.id\s*=\s*["']([^"']+)["']/g)].map((match) => match[1]),
  ...[...html.matchAll(/setAttribute\(\s*["']id["']\s*,\s*["']([^"']+)["']/g)].map((match) => match[1]),
]);
const literalIdLookups = [...new Set(
  [...html.matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)/g)].map((match) => match[1]),
)];
const intentionallyRemovedIds = new Set(['encounter-banner', 'baukastenToggle']);
assert.deepStrictEqual(
  literalIdLookups.filter((id) => !runtimeIds.has(id) && !intentionallyRemovedIds.has(id)),
  [],
  'literal DOM lookups must resolve to static or dynamically created elements',
);

const declaredFunctions = new Set(
  [...html.matchAll(/function\s+([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1]),
);
const inlineHandlers = [...new Set(
  [...html.matchAll(/\bonclick=["']\s*([A-Za-z_$][\w$]*)\s*\(/g)].map((match) => match[1]),
)];
assert.deepStrictEqual(inlineHandlers.filter((name) => !declaredFunctions.has(name)), [],
  'inline click handlers must reference declared functions');

function collectFiles(dir, output = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(fullPath, output);
    else output.push(fullPath);
  }
  return output;
}
const repoRoot = path.join(__dirname, '..');
const repoRootMedia = fs.readdirSync(repoRoot, { withFileTypes: true })
  .filter((entry) => entry.isFile()).map((entry) => path.join(repoRoot, entry.name));
const repoFilesByName = new Set(repoRootMedia
  .concat(collectFiles(path.join(repoRoot, 'assets')))
  .map((file) => path.basename(file)));
const literalMediaNames = [...new Set(
  [...html.matchAll(/["']([^"']+\.(?:png|jpg|jpeg|webp|mp3|wav|ogg))["']/gi)]
    .map((match) => path.basename(match[1])),
)];
assert.deepStrictEqual(literalMediaNames.filter((name) => !repoFilesByName.has(name)), [],
  'every literal media reference must exist in the repository');

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
assert(html.includes('id="popup-scene"'),
  'the scene status popup must contain the scene field updated by history navigation');
assert(html.includes("scene: (typeof sceneCounter === 'number' && sceneCounter > 0) ? sceneCounter : null"),
  'the live status popup must receive the current scene number');
for (const visibleAsciiLeak of [
  'Ruhig bleiben und Luecke suchen',
  'Koeder auslegen',
  'Friedhof Ploetzensee (Setup 8 Strauss)',
  " + ' zurueckgeben - ' + ",
  "label: 'Leere Haende'",
]) {
  assert(!html.includes(visibleAsciiLeak),
    'second audit found a visible replacement umlaut: ' + visibleAsciiLeak);
}

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
