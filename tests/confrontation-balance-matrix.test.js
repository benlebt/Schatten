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

const context = {
  caseProgress: { activeConfrontation: {} },
  Math: Object.create(Math),
  normForMatch: (value) => String(value || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'),
  _itemKatalogKey: () => '',
  _itemTaktikTags: () => [],
  _konfrontationGegnerStaerke: (enemy) => enemy.staerke,
  _konfrontationIstGruppe: (enemy) => !!enemy.gruppe,
  _alkoholKampfMalus: () => 0,
  _konfrontationStatusIstEndgueltig: (status) => ['ko', 'gefesselt', 'fixiert', 'geflohen', 'uebergeben'].includes(status),
  _konfrontationOutcomePrompt: () => 'matrix',
};
vm.createContext(context);
vm.runInContext([
  sourceOf('_konfrontationClamp'),
  sourceOf('_konfrontationItemWirkung'),
  sourceOf('_konfrontationUnbewaffnetPlan'),
  sourceOf('_konfrontationAssistListe'),
  sourceOf('_konfrontationAssistBonus'),
  sourceOf('_konfrontationWuerfleAusgang'),
].join('\n'), context);

function effect(name, verb) {
  return context._konfrontationItemWirkung({ name }, verb);
}

function matrix({ name, staerke, gruppe = false, item, verb, score = 0, wirkung, kampf = {}, fesselOberhand = false, rexVerjagen = false }) {
  const rows = [];
  for (let face = 1; face <= 6; face++) {
    context.caseProgress.activeConfrontation = Object.assign({}, kampf);
    context.Math.random = () => (face - 0.5) / 6;
    const outcome = context._konfrontationWuerfleAusgang(
      { name, staerke, gruppe },
      { name: item },
      verb,
      { score, wirkung, fesselOberhand },
      null
    );
    if (rexVerjagen && outcome.staerke <= 4 && outcome.art !== 'misslingt') outcome.status = 'geflohen';
    rows.push(outcome);
  }
  return {
    rows,
    success: rows.filter((row) => row.art !== 'misslingt').length,
    terminal: rows.filter((row) => ['ko', 'gefesselt', 'fixiert', 'geflohen', 'uebergeben'].includes(row.status)).length,
  };
}

const unarmed = context._konfrontationUnbewaffnetPlan();
const unarmedNormal = matrix({
  name: 'normaler Schläger', staerke: 3, item: 'leere Hände', verb: 'angreifen',
  score: unarmed.score, wirkung: unarmed.wirkung,
});
const unarmedRex = matrix({
  name: 'normaler Schläger', staerke: 3, item: 'leere Hände', verb: 'angreifen',
  score: unarmed.score + 3, wirkung: unarmed.wirkung,
});
const unarmedRexChase = matrix({
  name: 'normaler Schläger', staerke: 3, item: 'leere Hände', verb: 'angreifen',
  score: unarmed.score + 4, wirkung: unarmed.wirkung, rexVerjagen: true,
});
assert.strictEqual(unarmedNormal.success, 2, 'unarmed Karl should succeed on only 2/6 faces against a normal thug');
assert.strictEqual(unarmedRex.success, 3, 'Rex should improve an unarmed normal fight to 3/6, not guarantee it');
assert.strictEqual(unarmedRexChase.terminal, 3, 'Rex chase should end only the successful 3/6 normal-opponent outcomes');

const unarmedHardRex = matrix({
  name: 'harter Gegner', staerke: 5, item: 'leere Hände', verb: 'angreifen',
  score: unarmed.score + 4, wirkung: unarmed.wirkung, rexVerjagen: true,
});
assert.strictEqual(unarmedHardRex.success, 1, 'Rex must not make an unarmed attack reliable against a hard opponent');
assert.strictEqual(unarmedHardRex.terminal, 0, 'Rex may not auto-chase a strength-5 opponent away');

const ppk = effect('Walther PPK', 'ppk_einsetzen');
const ppkNormal = matrix({
  name: 'normaler Schläger', staerke: 3, item: 'Walther PPK', verb: 'ppk_einsetzen',
  score: 2, wirkung: ppk,
});
const ppkRex = matrix({
  name: 'normaler Schläger', staerke: 3, item: 'Walther PPK', verb: 'ppk_einsetzen',
  score: 5, wirkung: ppk,
});
assert.strictEqual(ppkNormal.success, 3, 'PPK alone should create pressure on 3/6 faces against a normal opponent');
assert.strictEqual(ppkRex.success, 4, 'PPK plus Rex should improve pressure to 4/6, not guarantee it');
assert.strictEqual(ppkNormal.terminal + ppkRex.terminal, 0, 'PPK outcomes must never become automatic knockout, surrender or flight');

const coffeeNormal = matrix({
  name: 'normaler Schläger', staerke: 3, item: 'Bohnenkaffee', verb: 'werfen',
  wirkung: effect('Bohnenkaffee', 'werfen'),
});
assert.strictEqual(coffeeNormal.success, 2, 'coffee must remain a mild 2/6 irritation against a normal opponent');

const kornHard = matrix({
  name: 'harter Gegner', staerke: 5, item: 'Flasche Nordhäuser Doppelkorn', verb: 'werfen',
  wirkung: effect('Flasche Nordhäuser Doppelkorn', 'werfen'),
});
assert.strictEqual(kornHard.success, 3, 'a consumable Korn throw should be useful but only 3/6 against a hard opponent');

const fireworksHardGroup = matrix({
  name: 'Pulk Schläger', staerke: 5, gruppe: true, item: 'Bündel Knallfrösche und Raketen', verb: 'werfen',
  wirkung: effect('Bündel Knallfrösche und Raketen', 'werfen'),
});
assert.strictEqual(fireworksHardGroup.success, 4, 'area fireworks should counter one group-strength step but still fail on 2/6 hard-group faces');
assert(fireworksHardGroup.rows.every((row) => row.staerke === 4),
  'area fireworks must remove exactly one numerical group-strength step');

const cuffsNoOpening = matrix({
  name: 'normaler Schläger', staerke: 3, item: 'Gebrauchte Handschellen', verb: 'fesseln',
  wirkung: effect('Gebrauchte Handschellen', 'fesseln'),
});
const cuffsAfterHit = matrix({
  name: 'normaler Schläger', staerke: 3, item: 'Gebrauchte Handschellen', verb: 'fesseln',
  wirkung: effect('Gebrauchte Handschellen', 'fesseln'), kampf: { treffer: 1 },
});
const cuffsRexFix = matrix({
  name: 'normaler Schläger', staerke: 3, item: 'Gebrauchte Handschellen', verb: 'fesseln',
  score: 3, wirkung: effect('Gebrauchte Handschellen', 'fesseln'), fesselOberhand: true,
});
assert.strictEqual(cuffsNoOpening.success, 3, 'reusable handcuffs without an opening must drop from 5/6 to a fair 3/6');
assert.strictEqual(cuffsAfterHit.success, 5, 'a previous effect hit should restore the intended 5/6 handcuff control chance');
assert.strictEqual(cuffsRexFix.success, 6, 'the explicit Rex-fixieren plus handcuff combo should be a deserved guaranteed payoff');
assert(cuffsNoOpening.rows.every((row) => row.fesselMalus === 2 && !row.fesselOberhand),
  'the matrix must expose the no-opening handcuff penalty on every face');

const batonHard = matrix({
  name: 'harter Gegner', staerke: 5, item: 'Gummiknüppel', verb: 'angreifen_mit',
  wirkung: effect('Gummiknüppel', 'angreifen_mit'),
});
assert.strictEqual(batonHard.success, 4, 'the reusable baton should be strong but still fail on 2/6 against a hard opponent');
assert(batonHard.terminal < 4, 'not every successful baton hit may become an immediate knockout');

assert.strictEqual(context._konfrontationAssistBonus([{ bonus: 4 }, { bonus: 3 }, { bonus: 2 }]), 7,
  'multiple companion assists must retain the explicit +7 cap');
const cappedTeam = matrix({
  name: 'normaler Schläger', staerke: 3, item: 'leere Hände', verb: 'angreifen',
  score: unarmed.score + 7, wirkung: unarmed.wirkung,
});
assert.strictEqual(cappedTeam.success, 5, 'even the maximum team bonus must still leave one failed unarmed face');

const actionSource = sourceOf('_hauptuiKonfrontationAktion');
assert(actionSource.includes("a.art === 'fixieren' || a.art === 'festhalten'"),
  'only explicit physical-control assists may cancel the handcuff opening penalty');

console.log('CONFRONTATION_BALANCE_MATRIX_OK', JSON.stringify({
  unarmedNormal: unarmedNormal.success + '/6',
  unarmedRex: unarmedRex.success + '/6',
  ppkNormal: ppkNormal.success + '/6',
  ppkRex: ppkRex.success + '/6',
  kornHard: kornHard.success + '/6',
  fireworksHardGroup: fireworksHardGroup.success + '/6',
  cuffsNoOpening: cuffsNoOpening.success + '/6',
  cuffsAfterHit: cuffsAfterHit.success + '/6',
  cuffsRexFix: cuffsRexFix.success + '/6',
  batonHard: batonHard.success + '/6',
}));
