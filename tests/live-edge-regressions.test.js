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

// A party newspaper may mention the SED without turning an otherwise private
// criminal case into a Stasi case. A real coercive party context must still hit.
const politicalContext = {
  normForMatch: value => String(value || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim()
};
vm.createContext(politicalContext);
vm.runInContext(sourceOf('detectPolitical'), politicalContext);
assert.strictEqual(
  politicalContext.detectPolitical('Auf dem Tisch liegt eine Zeitung: „Neuer Kurs der SED“.'),
  false,
  'an ambient SED headline must not reclassify Strauss as political'
);
assert.strictEqual(
  politicalContext.detectPolitical('Ein SED-Funktionär setzt den Zeugen wegen seiner Akte unter Druck.'),
  true,
  'an explicit SED power/coercion context must remain political'
);
assert.strictEqual(
  politicalContext.detectPolitical('Ein Mann vom MfS legt Karl eine Vorladung vor.'),
  true,
  'an explicit MfS scene must remain political'
);

// Persisted and newly earned reputation stay inside the documented range.
const careerContext = {
  KARL_AKTE_KEY: 'schatten-karl-akte',
  localStorage: {
    getItem: () => JSON.stringify({
      ruf: { renommee: 17, haerte: -12 },
      kasse: { ost: 30, west: 0 }
    })
  }
};
vm.createContext(careerContext);
vm.runInContext([
  sourceOf('_clampSettingsRufValue'),
  sourceOf('_karlAkteDefault'),
  sourceOf('_karlAkteLoad')
].join('\n'), careerContext);
const loadedCareer = careerContext._karlAkteLoad();
assert.strictEqual(loadedCareer.ruf.renommee, 5, 'persisted renown must clamp at +5');
assert.strictEqual(loadedCareer.ruf.haerte, -5, 'persisted hardness must clamp at -5');
assert(
  html.includes("karlAkte.ruf.renommee = _clampSettingsRufValue((karlAkte.ruf.renommee | 0) + _renommeeBonus);"),
  'case-end reputation booking must use the two-sided clamp'
);
assert(
  html.includes("karlAkte.ruf.renommee = _clampSettingsRufValue((karlAkte.ruf.renommee | 0) + 1);"),
  'debug end simulation must use the same two-sided clamp'
);

// Same-case reputation restarts must not expose the old terminal scene/prose
// while the fresh introduction is loading.
const hideAllSource = sourceOf('hideAll');
assert(hideAllSource.includes("'case-solved'") && hideAllSource.includes("'case-failed'"),
  'hideAll must hide both terminal overlays during same-case restart');
const startGameSource = sourceOf('startGame');
assert(startGameSource.includes("document.getElementById('log')") && startGameSource.includes("_oldLog.innerHTML = ''"),
  'startGame must clear the stale prose log before loading a fresh run');
const restartSource = sourceOf('restartCaseWithDebugRufFromSettings');
assert(restartSource.includes("if (typeof chooseOptionInFlight !== 'undefined' && chooseOptionInFlight)"),
  'reputation restart must refuse to cross an in-flight scene request');

// The prose prompt must use the same current-location cast truth as Haupt-UI.
assert(
  html.includes("let _promptCast = cast.filter(c => {")
    && html.includes("return _npcGehoertHierher(_cId, _cNameRaw);"),
  'prompt cast must filter stale people through the current-location predicate'
);
assert(
  html.includes("(noch nicht belastbar – Pflichtbeat fehlt)")
    && html.includes("(Wahrheitskette vervollständigen)"),
  'stage popup must not claim a finished truth while a mandatory truth beat is open'
);

console.log('live edge regressions: ok');
