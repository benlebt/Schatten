const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const groq = fs.readFileSync(path.join(root, 'api', 'groq.js'), 'utf8');

const styleStart = html.indexOf('const STYLE_MOTIF_RULES = [');
const styleEnd = html.indexOf('// Generic content words', styleStart);
assert(styleStart >= 0 && styleEnd > styleStart, 'run-wide style motif block missing');

const context = { styleMotifRunCounts: {} };
vm.createContext(context);
vm.runInContext(
  html.slice(styleStart, styleEnd)
    + '\nthis._trackStyleMotifs = _trackStyleMotifs;'
    + '\nthis.getRunStyleWarnings = getRunStyleWarnings;',
  context
);

context._trackStyleMotifs('Der Opel Olympia nagelt müde über das Kopfsteinpflaster. Frieda hält ein Zigarillo. Die Dämmerung kommt, eine Laterne wirft Schatten.');
let warnings = Array.from(context.getRunStyleWarnings());
assert(warnings.some(entry => entry.includes('Opel/Motor/Wagen')), 'Opel-nagelt motif must be blocked run-wide after one scene');
assert(warnings.some(entry => entry.includes('Kopfsteinpflaster')), 'Kopfsteinpflaster must be blocked run-wide after one scene');
assert(warnings.some(entry => entry.includes('Zigarillo')), 'Zigarillo must be blocked run-wide after one scene');
assert(warnings.some(entry => entry.includes('Dämmerung')), 'Dämmerung must be blocked run-wide after one scene');
assert(warnings.some(entry => entry.includes('wirft/werfen')), 'shadow-casting formula must be blocked run-wide after one scene');
assert(!warnings.some(entry => entry.includes('Standardadjektiv')), 'one legitimate tired mention must remain possible');

context._trackStyleMotifs('Du bist müde und reagierst langsamer.');
warnings = Array.from(context.getRunStyleWarnings());
assert(warnings.some(entry => entry.includes('Standardadjektiv')), 'müde must enter the run-wide warning after two scenes');
assert.strictEqual(context.styleMotifRunCounts.kopfsteinpflaster, 1, 'motifs must be counted by scene, not by unrelated later text');

assert(html.includes('const runStyleWarnings = getRunStyleWarnings();'), 'run-wide warnings must reach the live scene prompt');
assert(html.includes('Ersetze sie NICHT durch ein nahes Synonym'), 'style warning must prevent synonym substitution loops');
assert(html.includes('Anreise und Fahrzeug sind KEIN Pflichtsatz'), 'new-location prompt must allow a direct cut to the target');
assert(html.includes('Du MUSST Licht, Wetter oder Tageszeit NICHT erwaehnen'), 'time context must not force atmosphere into every scene');
assert(!html.includes("'ABEND': 'Daemmerung, lange Schatten"), 'time context must not prime the recurring dusk/shadow formula');
assert(!html.includes('Stattdessen: "Eine Straßenbahn rattert vorbei"'), 'the anti-cliche prompt must not seed a replacement cliche');
assert(html.includes('_trackStyleMotifs(scene.szene);'), 'accepted scenes must update run-wide motif counts');
assert(html.includes('styleMotifRunCounts: (styleMotifRunCounts'), 'style counts must be saved');
assert(html.includes('styleMotifRunCounts = (snap.styleMotifRunCounts'), 'style counts must survive restore');
assert(groq.includes('STILVARIANZ / ORTSWECHSEL'), 'Groq slim prompt must receive the same transition-style rule');
assert(groq.includes('Anreise, Opel, Motor und Aussteigen sind KEIN Pflichtvorspann'), 'Groq must support direct arrival cuts');

console.log('STYLE_VARIATION_REGRESSION_OK');
