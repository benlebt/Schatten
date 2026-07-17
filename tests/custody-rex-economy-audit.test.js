const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1245 +Leerlauf-Ort-Reisehinweis'"), 'version constant is stale');

const custodyStart = html.indexOf('function _custodyVerhoerState()');
const custodyEnd = html.indexOf('// v7.11.44: Custody-Switch-Counter', custodyStart);
assert(custodyStart >= 0 && custodyEnd > custodyStart, 'cannot isolate custody interrogation state machine');

let paid = 0;
const custodyContext = {
  caseProgress: {},
  karlInStasiCustody: true,
  diag: () => {},
  _geldZahle: (amount) => { paid += amount; return true; },
};
vm.createContext(custodyContext);
vm.runInContext(html.slice(custodyStart, custodyEnd), custodyContext);

let state = custodyContext._custodyVerhoerWahlAnwenden({ _custodyAction: 'SCHWEIGEN' });
assert.deepStrictEqual([state.runden, state.druck, state.verweigerung], [1, 1, 1], 'silence must build pressure and refusal');
state = custodyContext._custodyVerhoerWahlAnwenden({ _custodyAction: 'PROTOKOLL' });
assert.deepStrictEqual([state.runden, state.druck, state.verweigerung], [2, 3, 2], 'challenging the interrogator must escalate pressure');
state = custodyContext._custodyVerhoerWahlAnwenden({ _custodyAction: 'HALBWAHRHEIT' });
assert.deepStrictEqual([state.runden, state.druck, state.kooperation], [3, 2, 1], 'half-truths must lower pressure without ending custody');
state = custodyContext._custodyVerhoerWahlAnwenden({ _custodyAction: 'ROTH' });
assert.deepStrictEqual([state.runden, state.druck, state.rothHebel], [4, 1, 1], 'Roth leverage must be tracked');
state = custodyContext._custodyVerhoerWahlAnwenden({ _custodyAction: 'BESTECHEN' });
assert.strictEqual(paid, 10, 'custody bribe must actually spend ten Ostmark');
assert.deepStrictEqual([state.runden, state.druck, state.kooperation, state.bestechungen], [5, 0, 2, 1], 'successful bribe must soften pressure and remain recorded');

for (const action of ['SCHWEIGEN', 'HALBWAHRHEIT', 'ROTH', 'PROTOKOLL', 'BESTECHEN', 'LAUSCHEN']) {
  assert(html.includes("id: '" + action + "'"), 'custody menu misses action ' + action);
}
assert(html.includes('verhoer.runden >= 3 && verhoer.druck >= 3 && verhoer.verweigerung >= 2'), 'custody death must require repeated escalation');
assert(html.includes("verfassung === 'number' && verfassung <= 2"), 'custody death must require critical health');
assert(html.includes('Math.min(0.18, chance)'), 'custody death risk must retain a hard cap');
assert(html.includes("caseProgress.gameOverTodArt = 'stasi-verhoer'"), 'a lethal custody interrogation must persist a true death outcome');
assert(html.includes("caseProgress.gameOverTodArt = 'mfs-liquidation'"), 'MfS liquidation must persist a true death outcome');
assert(html.includes("KARL MAUER IST TOT - FALL OFFEN"), 'true death needs a distinct end screen instead of Charite recovery');
assert(html.includes('Ein normales Vf=0 bleibt der schwere, aber überlebbare Zusammenbruch'), 'ordinary zero health must remain the recoverable collapse path');

const gameOverStart = html.indexOf('function showGameOver()');
const gameOverEnd = html.indexOf('function buildFallbackAbschlussProsa()', gameOverStart);
assert(gameOverStart >= 0 && gameOverEnd > gameOverStart, 'cannot isolate game-over renderer');
const makeEndContext = (deathArt) => {
  const elements = {};
  const makeElement = () => ({ innerHTML: '', classList: { add: () => {}, remove: () => {} } });
  const context = {
    caseProgress: deathArt ? { gameOverTodArt: deathArt } : {},
    sceneCounter: 2,
    document: { getElementById: (id) => (elements[id] || (elements[id] = makeElement())) },
    clearSavedGame: () => {},
  };
  vm.createContext(context);
  vm.runInContext(html.slice(gameOverStart, gameOverEnd), context);
  context.showGameOver();
  return elements['game-over'].innerHTML;
};
const lethalEnd = makeEndContext('stasi-verhoer');
assert(lethalEnd.includes('KARL MAUER IST TOT'), 'lethal interrogation must not wake Karl in the Charite');
assert(!lethalEnd.includes('ZUSAMMENGEBROCHEN'), 'lethal interrogation must not use the recoverable collapse title');
const collapseEnd = makeEndContext('');
assert(collapseEnd.includes('ZUSAMMENGEBROCHEN - FALL OFFEN'), 'ordinary zero health must still use recoverable collapse');
assert(/am Leben|Aber er atmet|davongekommen/.test(collapseEnd), 'ordinary collapse must still state that Karl survived');
assert(html.includes('stasiCustodyScenesSince >= 3'), 'routine custody should allow release by the following morning');
assert(html.includes('caseProgress._custodyCountedScene !== custodySceneMark'), 'custody duration must count distinct scenes, not UI rerenders');
assert(html.includes('NOTFLUCHT ist der einzige sofortige Ausbruch'), 'custody prompt must distinguish escape from routine morning release');
assert(html.includes('const resetFolter = (opts.resetFolter !== undefined) ? opts.resetFolter : stateChanged;'), 'repeated custody detection must not reset interrogation progress');

assert(html.includes("const HUND_PREIS = 3;"), 'Rex must retain exchange value three');
assert(html.includes("const HUND_HEIMAT = 'Goldener Anker';"), 'Rex must remain tied to the Goldener Anker');
assert(html.includes('caseProgress.hundDaWuerfel = harteLage || (Math.random() < 0.75);'), 'hard cases must guarantee Rex while lighter cases keep variation');
assert(html.includes("bar.textContent = 'Bar zahlen · ' + bargeldPreis + ' Ostmark';"), 'trade overlay needs a real cash alternative');
assert(html.includes("_geldZahle(bargeldPreis, 'ost', 'Tauschzahlung @ '"), 'cash trade must deduct persistent money');

for (const item of ['Stinkbombe im Blechmantel', 'Bündel Knallfrösche und Raketen', 'Gebrauchte Handschellen', 'Kurzer Gummiknüppel']) {
  assert(html.includes(item), 'Trude/tactical catalog misses ' + item);
}
assert(html.includes("verbrauchbar: false"), 'reusable control gear needs explicit persistence');
assert(html.includes("['werfen', 'werfen_fuesse', 'angreifen_mit', 'fesseln']"), 'confrontation consumption must understand handcuffs');

const cellPath = path.join(root, 'assets', 'scenes', 'vogt', 'hohenschoenhausen-zelle.png');
assert(fs.existsSync(cellPath), 'dedicated custody cell image is missing');
const png = fs.readFileSync(cellPath);
assert.strictEqual(png.toString('ascii', 1, 4), 'PNG', 'custody cell asset is not a PNG');
const width = png.readUInt32BE(16);
const height = png.readUInt32BE(20);
assert(width >= 1200 && height >= 650, 'custody cell image is too small for the scene renderer');
assert(Math.abs((width / height) - (16 / 9)) < 0.08, 'custody cell image must retain the cinematic 16:9 frame');
assert(html.includes("place: 'MfS-Gewahrsam Hohenschoenhausen, Zelle 14'"), 'custody image needs a truthful interior location label');
assert(html.includes('abgewandtem, nicht erkennbarem Gesicht'), 'custody image contract must keep Karl anonymous');

console.log('CUSTODY_REX_ECONOMY_AUDIT_OK');
