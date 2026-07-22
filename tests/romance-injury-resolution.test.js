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

const romanceEvents = [];
const romanceContext = {
  romanticTension: 2,
  pendingRomanceChoice: false,
  lastSpannung: 1,
  lastRomanceTensionUpScene: 10,
  sceneCounter: 18,
  karlInStasiCustody: false,
  caseSetup: {
    setupCast: [{ name: 'Lola Brandt', tag: 'ROMANCE' }],
  },
  caseProgress: { romanceNpc: 'Lola Brandt' },
  cast: [],
  romanceRejected: {},
  lastRomanceNpcName: 'Lola Brandt',
  normForMatch: (value) => String(value || '').toLowerCase().trim(),
  diag: (type, message) => romanceEvents.push(type + ':' + message),
  console: { log: () => {} },
};
vm.createContext(romanceContext);
vm.runInContext(sourceOf('updateRomanticTension'), romanceContext);
romanceContext.updateRomanticTension({
  spannung: 1,
  szene: 'Du legst Anton Brandt den Abschlussbericht auf den Tisch.',
});
assert.strictEqual(romanceContext.romanticTension, 1,
  'an absent romance NPC must cool tension exactly once per scene, never 2 -> 1 -> 0');
assert(romanceEvents.some((entry) => /2 -> 1/.test(entry)),
  'the logged romance transition must equal the actually stored value');

let chosen = 0;
let toast = 0;
const resolveContext = {
  verfassung: 2,
  botActive: false,
  diag: () => {},
  showProgressToast: () => { toast++; },
  chooseOption: () => { chosen++; },
};
vm.createContext(resolveContext);
vm.runInContext(sourceOf('_abschlussVerfassungReicht') + '\n' + sourceOf('_resolveBestaetigt'), resolveContext);
assert.strictEqual(resolveContext._abschlussVerfassungReicht(), false,
  'Vf 2 must be critical and insufficient for resolving the case');
assert.strictEqual(resolveContext._resolveBestaetigt({ kategorie: 'AUFLOESEN' }), false,
  'a stale resolve click must be rejected while Karl is critically injured');
assert.strictEqual(chosen, 0, 'critical injury must stop the resolve action before the model call');
assert.strictEqual(toast, 1, 'the player needs an explicit treatment warning');

resolveContext.verfassung = 3;
assert.strictEqual(resolveContext._abschlussVerfassungReicht(), true,
  'Vf 3 must allow the closing report');
assert.strictEqual(resolveContext._resolveBestaetigt({ kategorie: 'AUFLOESEN' }), true,
  'a stable Karl must still be able to resolve the case');
assert.strictEqual(chosen, 1, 'the valid resolve action must reach the normal option path');

assert(html.includes("pendingCategoryChoice !== 'AUFLOESEN'"),
  'fatigue must not create a new critical injury during the already-running closing report');
assert(html.includes('MÜDIGKEITS-MALUS beim laufenden Abschlussbericht ausgesetzt'),
  'the skipped final-report fatigue penalty must be visible in diagnostics');
assert(html.includes('bei <strong>Vf 2 oder weniger</strong> bleibt der Abschluss gesperrt'),
  'the help page must explain the critical-injury resolve gate');

console.log('ROMANCE_INJURY_RESOLUTION_OK');
