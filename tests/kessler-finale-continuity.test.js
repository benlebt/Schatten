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
  let quote = '';
  let escaped = false;
  for (let i = brace; i < html.length; i += 1) {
    const ch = html[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth += 1;
    else if (ch === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error('unterminated function ' + name);
}

function norm(value) {
  return String(value || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

// Scene 21 visibly identified the shadow. It must pay the old hook and must not
// be detected again as a fresh hook merely because the words remain in prose.
const cliffEvents = [];
const cliffContext = {
  normForMatch: norm,
  caseProgress: {
    encounterState: null,
    pendingThreatCliffhanger: {
      art: 'ein Schatten vor der Tuer',
      ort: 'Spedition Schmidt Moabit',
      scene: 20,
      prompted: true,
    },
  },
  sceneCounter: 21,
  engineCurrentLocation: { name: 'Cafe Wien' },
  _konfrontationAktiv: () => false,
  diag: (...args) => cliffEvents.push(args),
};
vm.createContext(cliffContext);
vm.runInContext(
  sourceOf('_bedrohungsCliffhangerSichtbarBezahlt') + '\n'
    + sourceOf('_bedrohungsCliffhangerErkennen') + '\n'
    + sourceOf('_bedrohungsCliffhangerAktualisieren'),
  cliffContext,
);
const paidScene = {
  szene: 'Der Schatten vor der Tür der Spedition erweist sich als ein hagerer Speditionsarbeiter, der im Nieselregen raucht. Danach erreichst du das Café Wien.',
};
cliffContext._bedrohungsCliffhangerAktualisieren(paidScene);
assert.strictEqual(cliffContext.caseProgress.pendingThreatCliffhanger, null,
  'an identified shadow must clear the old cliffhanger without creating a duplicate');
assert.strictEqual(cliffContext._bedrohungsCliffhangerErkennen(paidScene), null,
  'resolved shadow wording must not be re-detected as a fresh threat');
const openHook = cliffContext._bedrohungsCliffhangerErkennen({
  szene: 'Ein regloser Schatten liegt plötzlich vor der Tuer. Draußen knarrt eine Diele.',
});
assert(openHook && openHook.art === 'ein Schatten vor der Tuer',
  'a genuinely unresolved shadow must remain detectable');

// A dedicated Haupt-UI clue carries an exact evidence id. The source must not
// be guessed as "person" just because Tetzlaff is present nearby.
const evidenceContext = {
  window: {
    _letzteAktion: {
      kategorie: 'ERKUNDEN',
      text: 'Karl untersucht jetzt gezielt: "Roberts Schreibtisch durchsuchen" in Spedition Schmidt Moabit.',
      pendingIndizId: 'briefchen_ilse',
    },
  },
  _findeIndizById: id => (id === 'briefchen_ilse' ? { id, quelle: 'umgebung' } : null),
  normForMatch: norm,
  getNpcsAtCurrentLocation: () => [{ id: 'norbert_tetzlaff', name: 'Norbert Tetzlaff' }],
};
vm.createContext(evidenceContext);
vm.runInContext(sourceOf('classifyEvidenceAction'), evidenceContext);
assert.strictEqual(evidenceContext.classifyEvidenceAction(), 'umgebung',
  'the exact desk hotspot must use its defined environment source');
assert(html.includes('pendingIndizId: (option && option._pendingIndizId) || null'),
  'chooseOption must preserve the structured evidence id for classification');

// HOME aliases are one place: office, apartment and rear bedroom at Hackescher Markt.
const locationContext = { normForMatch: norm, getCaseLocations: () => [] };
vm.createContext(locationContext);
vm.runInContext(sourceOf('_worldTruthOrtGleich'), locationContext);
assert.strictEqual(locationContext._worldTruthOrtGleich('Karl Mauers Wohnung', 'Karl Mauers Büro'), true,
  'Karl apartment/office wording must not produce a false location-prose break');

// A finale may report what an absent suspect did, but may not teleport him into the room.
const truthCaseProgress = {
  npcZustand: {
    robert_kessler: { name: 'Robert Kessler', status: 'benommen', ort: 'Hinterhof Sybelstrasse' },
  },
};
const truthContext = {
  normForMatch: norm,
  caseProgress: truthCaseProgress,
  engineCurrentLocation: { name: 'Karl Mauers Büro' },
  getCaseLocations: () => [],
  _npcZustandMap: () => truthCaseProgress.npcZustand,
  _aktuelleAktionIstReise: false,
  _aktuelleAktionIstFlucht: false,
  pendingForcedLocationChange: false,
};
vm.createContext(truthContext);
vm.runInContext(
  sourceOf('_worldTruthAliases') + '\n'
    + sourceOf('_worldTruthHasAlias') + '\n'
    + sourceOf('_worldTruthOrtGleich') + '\n'
    + sourceOf('_worldTruthAbschlussRueckblickErlaubt') + '\n'
    + sourceOf('validateSceneWorldTruth'),
  truthContext,
);
const finalOption = { id: 'AUFLOESEN', kategorie: 'AUFLOESEN' };
const reportScene = {
  ort: 'Karl Mauers Büro',
  personenImRaum: [],
  optionen: [],
  szene: 'Du legst Edith die Fakten auf den Tisch: Robert Kessler ging mittwochs früher und log über seine Überstunden.',
};
assert.strictEqual(truthContext.validateSceneWorldTruth(reportScene, finalOption), null,
  'a factual finale recap about an absent suspect must not trigger npc_prose retries');
const teleportScene = {
  ort: 'Karl Mauers Büro',
  personenImRaum: [],
  optionen: [],
  szene: 'Robert Kessler tritt herein und steht jetzt neben Edith.',
};
assert.strictEqual(truthContext._worldTruthAbschlussRueckblickErlaubt(finalOption, [teleportScene.szene]), false,
  'physical present-tense wording must not qualify as a finale recap');
assert(truthContext._worldTruthAliases('robert_kessler', truthContext.caseProgress.npcZustand.robert_kessler).length,
  'the suspect state must expose aliases for prose validation');
assert(truthContext._npcZustandMap().robert_kessler,
  'the validator must receive the suspect state map');
assert.strictEqual(truthContext._worldTruthHasAlias(teleportScene.szene,
  truthContext._worldTruthAliases('robert_kessler', truthContext.caseProgress.npcZustand.robert_kessler)), true,
  'the physical scene must mention the suspect alias');
assert.strictEqual(truthContext._worldTruthOrtGleich('Hinterhof Sybelstrasse', 'Karl Mauers Büro'), false,
  'the suspect location and finale office must remain distinct');
assert.strictEqual(truthContext.validateSceneWorldTruth(teleportScene, finalOption).code, 'npc_prose',
  'a physical suspect teleport in the finale must remain blocked');

assert(html.includes('ABSCHLUSS-KONTINUITÄT (PFLICHT)'),
  'the finale prompt must prohibit replaying the previous accepted scene');
assert(html.includes('Keine doppelte Schatten-Auflösung'),
  'the finale prompt must explicitly block the observed duplicate shadow payoff');
assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1337 +Saubere Privatfall-Eröffnung'"),
  'release version missing');

console.log('KESSLER_FINALE_CONTINUITY_OK');
