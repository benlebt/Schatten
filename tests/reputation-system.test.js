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

// Same NPC, same case situation, different reputation: outcomes must differ
// deterministically and in both directions without turning reputation into an
// automatic solution for severe escalation.
const mechanics = {
  karlAkte: { ruf: { renommee: 0, haerte: 0 }, mieteOffen: 0 },
  normForMatch: (value) => String(value || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim(),
};
vm.createContext(mechanics);
vm.runInContext([
  sourceOf('_informantPreis'),
  sourceOf('_sozialTonartArt'),
  sourceOf('_sozialErfolgNachRuf'),
  sourceOf('_sozialTonartMitRuf'),
  sourceOf('_sozialTonartLabel'),
  sourceOf('_verhoerRufWert'),
  sourceOf('_verhoerRufKategorie'),
  sourceOf('_verhoerRufMod'),
  sourceOf('_konfrontationRufAuswirkung'),
].join('\n'), mechanics);

const profiles = {
  neutral: { renommee: 0, haerte: 0 },
  sehrGut: { renommee: 5, haerte: 0 },
  schlecht: { renommee: -5, haerte: 0 },
  hart: { renommee: 0, haerte: 5 },
};
function withProfile(name, callback) {
  mechanics.karlAkte.ruf = Object.assign({}, profiles[name]);
  return callback();
}

// Verbindliche A/B/C/D-Matrix über dieselbe plausible Lage. Die Namen halten
// die vier priorisierten Fälle im Protokoll sichtbar; die Mechanik bleibt
// bewusst generisch und damit für alle vier Fälle identisch reproduzierbar.
const caseMatrix = {
  stein_ruhige_ansprache: {},
  strauss_krummbein_druck: {},
  lindenbaum_zeuge: {},
  goerke_schwere_eskalation: {},
};
for (const profileName of Object.keys(profiles)) {
  caseMatrix.stein_ruhige_ansprache[profileName] = withProfile(profileName, () =>
    mechanics._sozialErfolgNachRuf(
      { key: 'hoeflich', art: 'normal', erfolg: true, schwere: 'leicht' },
      { sozial: {} }
    ).erfolg
  );
  caseMatrix.strauss_krummbein_druck[profileName] = withProfile(profileName, () =>
    mechanics._sozialErfolgNachRuf(
      { key: 'druck', art: 'bedrohen', erfolg: false, schwere: 'leicht' },
      { sozial: {} }
    ).erfolg
  );
  caseMatrix.lindenbaum_zeuge[profileName] = withProfile(profileName, () =>
    mechanics._verhoerRufMod('oberkellner_voss')
  );
  caseMatrix.goerke_schwere_eskalation[profileName] = withProfile(profileName, () =>
    mechanics._sozialErfolgNachRuf(
      { key: 'kragen', art: 'kragen', erfolg: false, schwere: 'schwer', verprelltDanach: true },
      { sozial: {} }
    ).erfolg
  );
}
assert.deepStrictEqual(caseMatrix.stein_ruhige_ansprache,
  { neutral: true, sehrGut: true, schlecht: false, hart: true },
  'same Stein-style friendly approach must be blocked only by a ruined reputation');
assert.deepStrictEqual(caseMatrix.strauss_krummbein_druck,
  { neutral: false, sehrGut: false, schlecht: false, hart: true },
  'same light Krummbein-style pressure must work only for a hard reputation');
assert.deepStrictEqual(
  Object.fromEntries(Object.entries(caseMatrix.lindenbaum_zeuge).map(([key, value]) => [
    key, [value.oeffStart, value.gemStart, value.frageBonus]
  ])),
  {
    neutral: [0, 0, 0],
    sehrGut: [1, 0, 1],
    schlecht: [0, 1, -1],
    hart: [0, 1, -1],
  },
  'same witness interrogation must visibly distinguish neutral, trusted, disliked and feared profiles');
assert.deepStrictEqual(caseMatrix.goerke_schwere_eskalation,
  { neutral: false, sehrGut: false, schlecht: false, hart: false },
  'no reputation profile may redeem a severe Görke-style physical escalation');

const visibleLabels = {};
for (const profileName of Object.keys(profiles)) {
  visibleLabels[profileName] = withProfile(profileName, () => {
    const tonart = mechanics._sozialTonartMitRuf(
      { key: 'hoeflich', art: 'normal', label: 'Ruhig ansprechen', erfolg: profileName === 'sehrGut' ? false : true, schwere: 'leicht' },
      { sozial: {} }
    );
    return mechanics._sozialTonartLabel(tonart, { id: 'zeuge', name: 'Zeuge' });
  });
}
assert(/Rufvorteil/.test(visibleLabels.sehrGut),
  'a reputation rescue must be disclosed directly in the action label');
assert(/schlechter Ruf wirkt/.test(visibleLabels.schlecht),
  'a ruined reputation penalty must be disclosed directly in the action label');

const confrontationMatrix = {};
for (const profileName of Object.keys(profiles)) {
  confrontationMatrix[profileName] = withProfile(profileName, () =>
    mechanics._konfrontationRufAuswirkung({ name: 'Mann im langen Mantel' })
  );
}
assert.strictEqual(confrontationMatrix.neutral.note, '',
  'neutral reputation must not add a fake confrontation effect');
assert(/Sehr guter Ruf/.test(confrontationMatrix.sehrGut.note)
    && confrontationMatrix.sehrGut.deeskalationErschwert === false,
  'excellent reputation must be visibly credible without becoming an automatic win');
assert(/Schlechter Ruf/.test(confrontationMatrix.schlecht.note)
    && confrontationMatrix.schlecht.deeskalationErschwert === true,
  'ruined reputation must make the same de-escalation require two real steps');
assert(/Harter Ruf/.test(confrontationMatrix.hart.note)
    && /Kein automatischer Sieg/.test(confrontationMatrix.hart.note),
  'hard reputation must visibly affect reactions while staying balanced');

mechanics.karlAkte.ruf = Object.assign({}, profiles.neutral);
const neutralPrice = mechanics._informantPreis('norbert_tetzlaff', 'Norbert Tetzlaff');
assert.strictEqual(neutralPrice, 20, 'neutral reputation must keep Tetzlaff at his base price');
mechanics.karlAkte.ruf = { renommee: 0, haerte: 5 };
assert.strictEqual(mechanics._informantPreis('norbert_tetzlaff', 'Norbert Tetzlaff'), 32,
  'feared reputation must impose the documented +12 Ostmark informant cost');

mechanics.karlAkte.ruf = { renommee: 5, haerte: 0 };
let social = mechanics._sozialErfolgNachRuf(
  { key: 'hoeflich', art: 'normal', erfolg: false, schwere: 'leicht' },
  { sozial: {} }
);
assert.strictEqual(social.erfolg, true, 'excellent renown must rescue a light polite route');

mechanics.karlAkte.ruf = { renommee: -5, haerte: 0 };
social = mechanics._sozialErfolgNachRuf(
  { key: 'normal', art: 'normal', erfolg: true },
  { sozial: {} }
);
assert.strictEqual(social.erfolg, false, 'ruined renown must close an otherwise fitting friendly route');

mechanics.karlAkte.ruf = { renommee: 0, haerte: 5 };
social = mechanics._sozialErfolgNachRuf(
  { key: 'druck', art: 'bedrohen', erfolg: false, schwere: 'leicht' },
  { sozial: {} }
);
assert.strictEqual(social.erfolg, true, 'feared reputation must rescue light pressure');
social = mechanics._sozialErfolgNachRuf(
  { key: 'kragen', art: 'kragen', erfolg: false, schwere: 'schwer', verprelltDanach: true },
  { sozial: {} }
);
assert.strictEqual(social.erfolg, false, 'even maximum hardness must not redeem severe physical escalation');

mechanics.karlAkte.ruf = { renommee: 5, haerte: 0 };
let interrogation = mechanics._verhoerRufMod('oberkellner_voss');
assert.strictEqual(interrogation.oeffStart, 1, 'excellent renown must open a witness interrogation');
assert.strictEqual(interrogation.frageBonus, 1, 'excellent renown must grant a real question bonus');
mechanics.karlAkte.ruf = { renommee: -5, haerte: 0 };
interrogation = mechanics._verhoerRufMod('oberkellner_voss');
assert.strictEqual(interrogation.gemStart, 1, 'ruined renown must make the same witness guarded');
assert.strictEqual(interrogation.frageBonus, -1, 'ruined renown must reduce the same interrogation margin');

// Settings behavior: changing or neutralizing reputation must preserve every
// other career field. The same-case restart must keep that reputation and set
// only the one-shot rent bypass before startGame is called.
const settings = {
  karlAkte: {
    ruf: { renommee: -5, haerte: 5 },
    kasse: { ost: 77, west: 4 },
    mieteOffen: 20,
    bekannte: { trude: true },
    historie: [{ fall: 'Stein' }],
  },
  _settingsDebugRufAllowed: () => true,
  _karlAkteDefault: () => ({ ruf: { renommee: 0, haerte: 0 } }),
  _karlAkteSave: () => { settings.saved++; },
  updateSettingsCareerPanel: () => { settings.updated++; },
  showProgressToast: () => { settings.toasts++; },
  saved: 0,
  updated: 0,
  toasts: 0,
  window: {},
  _currentSetupIndexForRestart: () => 7,
  _karriereRufLabel: () => 'Renommee +5 · Härte 0',
  showSettingsActionConfirmation: (config) => { settings.confirmation = config; },
  clearSavedGame: () => { settings.cleared++; },
  closeSettings: () => { settings.closed++; },
  startGame: () => {
    settings.started++;
    settings.flagSeenByStart = settings.window._debugRufVergleichsNeustart;
  },
  resetGame: () => { settings.resetGameCalls++; },
  console,
  selectedSetupIdx: 0,
  cleared: 0,
  closed: 0,
  started: 0,
  resetGameCalls: 0,
};
vm.createContext(settings);
vm.runInContext([
  sourceOf('_ensureSettingsRuf'),
  sourceOf('_clampSettingsRufValue'),
  sourceOf('setDebugRufFromSettings'),
  sourceOf('resetDebugRufFromSettings'),
  sourceOf('restartCaseWithDebugRufFromSettings'),
].join('\n'), settings);

settings.setDebugRufFromSettings('renommee', '99');
assert.strictEqual(settings.karlAkte.ruf.renommee, 5, 'debug reputation input must clamp to +5');
assert.deepStrictEqual(settings.karlAkte.kasse, { ost: 77, west: 4 }, 'changing reputation must preserve cash');
settings.resetDebugRufFromSettings();
assert.deepStrictEqual(settings.karlAkte.ruf, { renommee: 0, haerte: 0 }, 'reputation-only reset must neutralize both axes');
assert.strictEqual(settings.karlAkte.mieteOffen, 20, 'reputation-only reset must preserve rent');
assert.deepStrictEqual(settings.karlAkte.bekannte, { trude: true }, 'reputation-only reset must preserve known contacts');
assert.strictEqual(settings.karlAkte.historie.length, 1, 'reputation-only reset must preserve career history');

settings.karlAkte.ruf = { renommee: 5, haerte: 0 };
settings.restartCaseWithDebugRufFromSettings();
assert(settings.confirmation, 'same-case comparison must require confirmation');
settings.confirmation.onConfirm();
assert.strictEqual(settings.selectedSetupIdx, 7, 'same-case comparison must retain the current case');
assert.strictEqual(settings.cleared, 1, 'same-case comparison must clear only the current run save');
assert.strictEqual(settings.started, 1, 'same-case comparison must restart immediately');
assert.strictEqual(settings.flagSeenByStart, true, 'startGame must receive the one-shot rent bypass');
assert.deepStrictEqual(settings.karlAkte.ruf, { renommee: 5, haerte: 0 }, 'same-case comparison must preserve the selected reputation');
assert.strictEqual(settings.resetGameCalls, 0, 'known-case comparison must not fall back to the generic reset');

console.log('REPUTATION_SYSTEM_OK');
