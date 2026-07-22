const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

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

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1290 +Toast-Namensreveal'"),
  'Brandt regression release version missing');

for (const bad of [
  'Die Entscheidung bleibt an Karl haengen',
  "label: 'Der Polizei uebergeben'",
  'Karl drueckt ein Auge zu',
  'verlaesslicher Ermittler waechst',
  'Modell-Status pruefen',
  'Druecke "Deployen" noch einmal zum Bestaetigen',
  "'aktülle'",
]) {
  assert(!html.includes(bad), 'player-facing ASCII/typo survived: ' + bad);
}
for (const good of [
  'Die Entscheidung bleibt an Karl hängen',
  "label: 'Der Polizei übergeben'",
  'Karl drückt ein Auge zu',
  'zuverlässiger Ermittler wächst',
  'Fahre zur Charité oder zu Doc Wagner',
]) {
  assert(html.includes(good), 'correct player-facing copy missing: ' + good);
}

assert(html.includes("abschlussOrt: 'Anton Brandts Eckkneipe und Wohnung'"),
  'Brandt case needs a deterministic client-report location');
assert(html.includes('_abschlussLocation: _abschlussLocation'),
  'resolve option must carry the engine-owned final location');
assert(html.includes('function _abschlussOrtVorbereiten(option)'),
  'final report must update engine location before narration');
assert(html.includes("engineCurrentLocation = { name: ziel.name, sektor: ziel.sektor || '' };"),
  'final report must move the engine header, cast and visual together');

const context = {
  engineCurrentLocation: { name: 'Lola Brandts Wohnung', sektor: 'West' },
  getCaseLocations: () => [{ name: 'Anton Brandts Eckkneipe und Wohnung', sektor: 'West (Kreuzberg)' }],
  normForMatch: (value) => String(value || '').toLowerCase(),
  diag: () => {},
  caseProgress: { _kritischSeitSzene: 10 },
  verfassung: 2,
  sceneCounter: 13,
};
vm.createContext(context);
vm.runInContext(sourceOf('_abschlussOrtVorbereiten') + '\n' + sourceOf('_kritischeVerletzungBlockiert'), context);
const resolveOption = { _abschlussLocation: 'Anton Brandts Eckkneipe und Wohnung', _enginePrompt: 'Berichte.' };
assert.strictEqual(context._abschlussOrtVorbereiten(resolveOption), true, 'Brandt final drive must be executed');
assert.strictEqual(context.engineCurrentLocation.name, 'Anton Brandts Eckkneipe und Wohnung',
  'Brandt final header must use the client location');
assert(resolveOption._enginePrompt.includes('Lola Brandts Wohnung'),
  'final prompt must retain the departure location for the prose bridge');
assert.strictEqual(context._kritischeVerletzungBlockiert({ _kategorie: 'ROMANTIK' }), true,
  'romance must be blocked at critical health');
assert.strictEqual(context._kritischeVerletzungBlockiert({ _kategorie: 'OFFENSIV' }), true,
  'continued violence must be blocked after ignored treatment');
assert.strictEqual(context._kritischeVerletzungBlockiert({ _kategorie: 'ERKUNDEN' }), false,
  'critical health must not deadlock safe investigation');

assert(html.includes('romanticClicksSinceProgress: (typeof romanticClicksSinceProgress'),
  'romance click progress must be saved');
assert(html.includes('typeof snap.romanticClicksSinceProgress'),
  'romance click progress must be restored');
assert(!html.includes("} else if (chosenKategorie !== 'normal' && lastRomanceNpcName)"),
  'ordinary investigation actions must not erase romance progress');

assert(html.includes('function _kritischeVerletzungBlockiert(option)'),
  'critical injury needs a click-time safety gate');
assert(html.includes("/^(ROMANTIK|UEBERNACHTUNG)$/.test(kat)"),
  'critical injury must block implausible romance scenes');
assert(html.includes("return kat === 'OFFENSIV' && dauer >= 2;"),
  'ignored critical injuries must eventually block more violence');

assert(html.includes('Laufziel sind mindestens 5 verschiedene Achsen'),
  'historical education breadth target must be five axes');
assert(html.includes('(sceneCounter >= 18 && _eduCount < 5)'),
  'long runs need a fifth-axis checkpoint');

const romanceIntroContext = {
  pendingRomancePushScene: 5,
  caseSetup: { setupCast: [{
    name: 'Lola Brandt',
    tag: 'WITNESS',
    tagExtra: 'ROMANCE',
    rolle: 'Zeugin / Verlobte des Toten + ROMANCE-Kandidatin',
  }] },
  caseProgress: {},
  lastSpannung: 2,
  karlInStasiCustody: false,
  romanceRejected: {},
  romanceClimaxed: {},
  normForMatch: (value) => String(value || '').toLowerCase(),
  lastRomanceNpcScene: -99,
  sceneCounter: 6,
  diag: () => {},
};
vm.createContext(romanceIntroContext);
vm.runInContext(sourceOf('enforceRomanceIntroductionScene') + '\n' + sourceOf('sanitizeProsaMetadaten'), romanceIntroContext);
const introScene = { szene: 'Karl betritt das Café.', spannung: 2, personenImRaum: [] };
assert(romanceIntroContext.enforceRomanceIntroductionScene(introScene),
  'romance fallback must introduce the intended person');
assert(introScene.szene.includes('tritt Lola Brandt an dich heran'),
  'romance fallback needs natural narrative prose');
assert(!/ROMANCE|Zeugin\s*\/|laufenden Sache auf/.test(introScene.szene),
  'romance fallback must not copy role metadata into prose');
const guardedProse = romanceIntroContext.sanitizeProsaMetadaten(
  'Lola Brandt, Zeugin + ROMANCE-Kandidatin, wartet am Fenster.');
assert(!/ROMANCE-Kandidatin/.test(guardedProse),
  'central prose guard must remove leaked technical role markers');
assert.strictEqual(guardedProse, 'Lola Brandt wartet am Fenster.',
  'central prose guard must remove the entire technical role appositive');

console.log('brandt run regression tests passed');
