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

const menuSource = sourceOf('renderOptions');
assert(menuSource.includes("let _reiseVorauswahl = ''"),
  'the highlighted travel button must retain its displayed destination');
assert(menuSource.includes('_reiseVorauswahl = _zN'),
  'the displayed director destination must become the map preselection');
assert(menuSource.includes('oeffneReiseMenue(_reiseVorauswahl)'),
  'the highlighted travel button must open the map at its named destination');

const npcSource = sourceOf('npcInteraktion');
assert(npcSource.includes('_zeitUnmittelbar: !!verb._sozialTonart'),
  'a selected social interaction must resolve before a time or closing-time relocation');

const botHashSource = sourceOf('botGetOptionsHash');
assert(botHashSource.includes('.hauptui-execute:not(:disabled)') && botHashSource.includes('.hauptui-target:not(:disabled)'),
  'autoplay freshness detection must include the active Haupt-UI controls');
assert(botHashSource.includes("String((typeof sceneCounter === 'number') ? sceneCounter : 0)"),
  'autoplay must distinguish consecutive scenes even when their Haupt-UI menus are identical');

const botOptionsSource = sourceOf('botGetCurrentOptions');
assert(botOptionsSource.includes("id: execute ? 'HAUPTUI_AUSFUEHREN' : 'HAUPTUI_VORBEREITEN'"),
  'autoplay must expose Haupt-UI setup and execution as strategy candidates');

const botLoopSource = sourceOf('botRunMainLoop');
assert(botLoopSource.includes("if (chosen._hauptuiSetup && window.HAUPTUI_AKTIV)"),
  'autoplay must complete the Haupt-UI two-click interaction before waiting for a new scene');
assert(botLoopSource.includes("throw new Error('Haupt-UI: Ausfuehren-Button nach Ziel-/Verbwahl fehlt')"),
  'autoplay must fail diagnostically instead of silently consuming a turn when Haupt-UI execution is missing');

assert(html.includes("oeffnungszeit: ['morgen','vormittag','mittag','nachmittag','abend'], npcs: [{ id: 'oberkellner_voss'"),
  'Cafe Wien must be reachable when the Kessler trail points there in the morning');
assert(html.includes("detail: 'Schoenhauser Allee, ausgeraubt in der vergangenen Nacht (29./30. September 1953)'"),
  'Krauses map detail must agree with the case date');
assert(html.includes('${INTRO_REQUIREMENTS}Mittwochvormittag, 30. September 1953'),
  'Krauses opening prompt must agree with the engine start slot');
assert(!html.includes('Am Mittwochmittag ist "vergangene Nacht" korrekt'),
  'the stale Krause midday wording must be gone');

assert(html.includes('NEUE VERLETZUNGEN NUR MIT ENGINE-FOLGE'),
  'quiet actions must not invent health-neutral wounds');
assert(html.includes('KEINE ERFUNDENEN VORBEGEGNUNGEN'),
  'the prose prompt must forbid unsupported prior encounters');
assert(html.includes("if (option._intent.type === 'question' && _menuNpc) option._intent.target = _menuNpc"),
  'the exact clicked NPC must override fuzzy text target extraction');

const context = {
  currentScene: { personenImRaum: ['Frau Pohl', 'Ilse Hauke', 'Robert Kessler'] },
  cast: [{ name: 'Frau Pohl' }, { name: 'Ilse Hauke' }, { name: 'Robert Kessler' }],
  normForMatch: value => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
};
vm.createContext(context);
vm.runInContext(sourceOf('validateIntentFollowup'), context);

const wrongNpcScene = {
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Frau Pohl lehnt sich aus dem Fenster. "Kessler?", fragt sie und antwortet ausweichend.'
};
assert.strictEqual(
  context.validateIntentFollowup(wrongNpcScene, {
    type: 'question',
    target: 'Ilse Hauke',
    previousOrt: 'Hinterhof Sybelstrasse'
  }),
  'question_target_missing',
  'an answer by a different present NPC must be rejected instead of accepted as the clicked target'
);

context.currentScene = { personenImRaum: ['Ilse Hauke'] };
context.cast = [{ name: 'Ilse Hauke' }];
assert.strictEqual(
  context.validateIntentFollowup({
    ort: 'Hinterhof Sybelstrasse',
    szene: 'Sie zögert. "Ich will keinen Ärger", sagt die Frau leise.'
  }, {
    type: 'question',
    target: 'Ilse Hauke',
    previousOrt: 'Hinterhof Sybelstrasse'
  }),
  null,
  'a pronoun answer remains valid when exactly one NPC is present'
);

console.log('LIVE_LEKTORAT_REGRESSION_OK');
