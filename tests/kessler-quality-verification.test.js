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
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1638 +StasiCustodyStateMachine'"),
  'release version missing');
assert(html.includes("const _openingPresence = _arrivalKesslerWindows\n          ? (_openingStillMissing.length"),
  'the fixed Kessler opening must not append its window cast a second time');
assert(html.includes("presenceFallbackText: 'Frau Pohl bleibt am linken Erdgeschossfenster"),
  'courtyard fallback must preserve the pictured window positions');
assert(html.includes("{ id: 'frau_pohl', zeit: ['morgen','vormittag','mittag','nachmittag','abend','nacht'] }"),
  'Pohl must remain in the UI whenever the fixed courtyard image shows her');
assert(html.includes("{ id: 'ilse_hauke', zeit: ['morgen','vormittag','mittag','nachmittag','abend','nacht'] }"),
  'Hauke must remain in the UI whenever the fixed courtyard image shows her');
assert(html.includes("arrivalFallbackText: 'Am Kurfürstendamm stellst du den Opel vor dem Cafe Wien ab."),
  'Cafe Wien needs a written arrival instead of a dry room template');
assert(html.includes("arrivalFallbackText: 'Zwischen Lastwagen, Packkisten und dem Geruch von Öl"),
  'the Spedition needs a written arrival instead of a dry room template');
assert(html.includes("arrivalFallbackText: 'Du schließt die Bürotür am Hackeschen Markt hinter dir"),
  'Kessler office returns need authored prose instead of a dry orientation template');

const openingContext = {
  normForMatch: norm,
  engineCurrentLocation: { name: 'Hinterhof Sybelstrasse' },
  caseProgress: {},
  window: {},
};
vm.createContext(openingContext);
vm.runInContext(sourceOf('validateOpeningRoleTruth'), openingContext);
const kesslerSetup = {
  caseType: 'beschatten',
  klient: 'Edith Kessler (Ehefrau)',
  opfer: 'Robert Kessler (Buchhalter)',
  ortHaupt: 'Hinterhof Sybelstrasse',
  stasiRelevance: 0,
  setupCast: [
    { name: 'Edith Kessler', tag: 'CLIENT' },
    { name: 'Robert Kessler', tag: 'TARGET' },
    { name: 'Frau Pohl', tag: 'WITNESS' },
    { name: 'Ilse Hauke', tag: 'WITNESS' },
  ],
};
const orphanPronoun = openingContext.validateOpeningRoleTruth(
  'Edith Kessler hat dich beauftragt. Du folgst Robert Kessler in den Hinterhof. Sie mustert dich misstrauisch. Frau Pohl und Frau Hauke stehen an ihren Fenstern.',
  kesslerSetup,
  { ort: 'Hinterhof Sybelstrasse', personenImRaum: ['Frau Pohl', 'Frau Hauke'] },
);
assert(orphanPronoun && orphanPronoun.code === 'opening_kessler_unanchored_pronoun',
  'an unanchored female pronoun after Robert must be rejected');

const arrivalContext = {
  normForMatch: norm,
  engineCurrentLocation: { name: 'Hinterhof Sybelstrasse' },
  gameTimeIdx: 1,
  TIMES_OF_DAY: ['MORGEN', 'VORMITTAG', 'MITTAG', 'NACHMITTAG', 'ABEND', 'NACHT'],
  caseProgress: { stage: 2 },
  getNpcsAtCurrentLocation: () => [],
  getCaseLocations: () => [{
    name: 'Hinterhof Sybelstrasse',
    npcs: [
      { id: 'frau_pohl', immer: true },
      { id: 'ilse_hauke', immer: true },
    ],
  }],
  _npcOrtsbindungEintragAktiv: () => true,
  _npcAbkoemmlich: () => false,
  _npcZustandIstEntfernt: () => false,
  _resolveNpcIdentity: id => ({
    id,
    name: id === 'frau_pohl' ? 'Frau Pohl' : 'Ilse Hauke',
  }),
  _worldTruthAliases: (id, entry) => [norm(entry.name || id)],
  _worldTruthHasAlias: (text, aliases) => aliases.some(alias => norm(text).includes(norm(alias))),
};
vm.createContext(arrivalContext);
vm.runInContext(sourceOf('_findArrivalNpcRosterDrift'), arrivalContext);
const emptyCourtyard = arrivalContext._findArrivalNpcRosterDrift({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Keine Menschenseele ist zu sehen. Du bist allein.',
  personenImRaum: ['Frau Pohl', 'Ilse Hauke'],
}, { id: 'REISE', _istReise: true });
assert(emptyCourtyard && emptyCourtyard.code === 'arrival_npc_roster_drift' && emptyCourtyard.explicitEmpty,
  'explicitly empty prose must be rejected when the image/UI roster contains people');

const minimumContext = {
  normForMatch: norm,
  engineCurrentLocation: { name: 'Hinterhof Sybelstrasse' },
  getCaseLocations: () => [{
    name: 'Hinterhof Sybelstrasse',
    presenceFallbackText: 'Frau Pohl bleibt am linken Erdgeschossfenster, Frau Hauke am oberen rechten Hoffenster; beide behalten den Hof im Blick.',
  }],
  _worldTruthAliases: (id, entry) => [norm(entry.name || id)],
  _worldTruthHasAlias: (text, aliases) => aliases.some(alias => norm(text).includes(norm(alias))),
};
vm.createContext(minimumContext);
vm.runInContext(sourceOf('_naturalMinimumSceneText'), minimumContext);
const cluePayoff = minimumContext._naturalMinimumSceneText({
  ort: 'Hinterhof Sybelstrasse',
  personenImRaum: ['Frau Pohl', 'Frau Hauke'],
}, {
  engineOrt: 'Hinterhof Sybelstrasse',
  fundText: 'Robert verschwindet im Hinterhaus; die Haustür fällt hinter ihm zu.',
});
assert(cluePayoff.includes('Frau Pohl bleibt am linken Erdgeschossfenster')
  && cluePayoff.includes('Frau Hauke am oberen rechten Hoffenster')
  && !cluePayoff.includes('verfolgen die Untersuchung schweigend'),
  'clue fallback must use the configured physical positions instead of a generic roster sentence');

const curfewContext = {
  normForMatch: norm,
  caseProgress: {
    _letzteSperrstunde: {
      von: 'Spedition Schmidt Moabit',
      nach: 'Karl Mauers Büro',
      tageszeit: 'Nacht',
      scene: 5,
    },
  },
  sceneCounter: 6,
  engineCurrentLocation: { name: 'Karl Mauers Büro' },
};
vm.createContext(curfewContext);
vm.runInContext(sourceOf('_aktiveSperrstundenReiseUmleitung'), curfewContext);
const redirect = curfewContext._aktiveSperrstundenReiseUmleitung({
  id: 'REISE',
  _istReise: true,
  text: 'Fahr mit dem Opel zu: Spedition Schmidt Moabit',
});
assert(redirect && redirect.nach === 'Karl Mauers Büro',
  'the closing-time redirect must survive the travel scene counter increment');

const proseContext = {
  normForMatch: value => String(value || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').trim(),
  engineCurrentLocation: { name: 'Karl Mauers Büro' },
  getCaseLocations: () => [],
  caseProgress: {},
};
vm.createContext(proseContext);
vm.runInContext(html.slice(
  html.indexOf('function _findUnderwrittenSceneProse('),
  html.indexOf('function _naturalMinimumSceneText('),
), proseContext);
const dryOfficeTemplate = proseContext._findUnderwrittenSceneProse({
  ort: 'Karl Mauers Büro',
  szene: 'Du öffnest die Tür von Karl Mauers Büro und trittst ein. Hinter dir fällt die Tür ins Schloss; die Geräusche des übrigen Gebäudes werden gedämpft. Du lässt den Blick durch den Raum wandern und entscheidest, wo du mit der Untersuchung beginnst.',
}, { id: 'REISE', _istReise: true });
assert(dryOfficeTemplate && dryOfficeTemplate.code === 'scene_prose_underwritten'
    && dryOfficeTemplate.dryOrientationTemplate,
  'the live dry office orientation template must be rejected before display');
assert(proseContext._findUnderwrittenSceneProse({
  ort: 'Karl Mauers Büro',
  szene: 'Du schließt die Bürotür am Hackeschen Markt hinter dir und hängst den Mantel über den Stuhl. Auf dem Schreibtisch liegen Notizbuch und Fallakte im Licht der Lampe; aus dem Hinterzimmer rauscht das Sachsenwerk-Radio. Du ordnest Namen, Zeiten und Widersprüche, bevor du den nächsten Ermittlungsweg festlegst.',
}, { id: 'REISE', _istReise: true }) === null,
  'a concrete three-sentence office return must pass the prose floor');

console.log('KESSLER_QUALITY_VERIFICATION_OK');
