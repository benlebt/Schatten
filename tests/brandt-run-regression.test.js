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

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1426 +KrauseSecureActionAlwaysVisible-Staging'"),
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
const brandtStart = html.indexOf("klient: 'Anton Brandt (Vater)'");
const brandtEnd = html.indexOf('// 4. Nachtanruf', brandtStart);
const brandtBlock = html.slice(brandtStart, brandtEnd > brandtStart ? brandtEnd : brandtStart + 45000);
assert(brandtBlock.includes("oeffnungszeit: ['nachmittag','abend','nacht']"),
  'Rote Laterne must close after the night instead of keeping its cast through the morning');
assert(brandtBlock.includes("sperrstundenAussen: 'Vor der Roten Laterne am Nollendorfplatz'"),
  'club closing needs a deterministic exterior destination');
assert(html.includes("{ test: /^vor der roten laterne/, hidden: true, place: 'Vor der Roten Laterne am Nollendorfplatz', innen: false }"),
  'the club exterior must not reuse the unchanged nightclub interior still');
assert(brandtBlock.includes("{ id: 'lola_brandt', zeit: ['nachmittag','abend','nacht'] }"),
  'Lola must have a work shift instead of permanent presence');
assert(brandtBlock.includes("requiresEvidenceAll: ['schuldschein','fremde_walther','zeuge_walther']"),
  'Kurt confession must follow motive, swapped weapon and the concrete witness statement');
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
  _npcOrtsbindungEintragAktiv: (entry) => !entry.wegWennKlientGesprochen,
};
vm.createContext(context);
vm.runInContext(sourceOf('_abschlussZielOrtErmitteln') + '\n' + sourceOf('_abschlussOrtVorbereiten') + '\n' + sourceOf('_kritischeVerletzungsDauer') + '\n' + sourceOf('_professionelleBehandlungFaellig') + '\n' + sourceOf('_kritischeVerletzungBlockiert'), context);
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
assert.strictEqual(context._professionelleBehandlungFaellig(), true,
  'third ignored scene at critical health must require professional treatment');
assert.strictEqual(context._kritischeVerletzungBlockiert({ _kategorie: 'ERKUNDEN' }), true,
  'long critical injuries must block continued investigation');
assert.strictEqual(context._kritischeVerletzungBlockiert({ _kategorie: 'NOTHEILEN' }), false,
  'self first aid must remain available even though it does not count as professional treatment');
assert.strictEqual(context._kritischeVerletzungBlockiert({ _kategorie: 'HEILEN' }), false,
  'professional treatment must remain available');

context.caseSetup = { caseType: 'diebstahl' };
context.clientProfile = { name: 'Theodor Krause', id: 'theodor_krause' };
context.getCaseLocations = () => [
  { name: 'Karl Mauers Büro', npcs: [{ id: 'theodor_krause', wegWennKlientGesprochen: true }] },
  { name: 'Krauses Antiquitäten', sektor: 'Ost (Prenzlauer Berg)' },
];
context.caseProgress.klientGesprochen = true;
assert.strictEqual(context._abschlussZielOrtErmitteln(false, true), 'Krauses Antiquitäten',
  'physical Krause return must infer the client shop without a case-specific abschlussOrt');
context.engineCurrentLocation = { name: 'Krauses Antiquitäten', sektor: 'Ost (Prenzlauer Berg)' };
const localReturn = { _abschlussLocation: 'Krauses Antiquitäten', _abschlussClientExpected: true, _enginePrompt: 'Gib das Etui zurück.' };
assert.strictEqual(context._abschlussOrtVorbereiten(localReturn), false,
  'being at the client shop already must not create a fake second journey');
assert.strictEqual(context.caseProgress._abschlussClientOrt, 'Krauses Antiquitäten',
  'same-location physical handover must still anchor the client in the final cast');
assert(localReturn._enginePrompt.includes('bereits am Zielort'),
  'same-location handover must explicitly forbid another location jump');

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
assert(html.includes("return !/^(HEILEN|NOTHEILEN|DEFENSIV|FLUCHT|NOTFLUCHT)$/.test(kat);"),
  'ignored critical injuries must eventually block all non-treatment progress');
assert(html.includes("resolveLockReason = 'erst professionell behandeln lassen'"),
  'the resolve button must expose the professional-treatment lock');
assert(html.includes('ARZTPFLICHT IN DER PROSA (ABSOLUT, DIEGETISCH)'),
  'mandatory professional treatment must be communicated in the narrative prompt');
assert(html.includes('Diese Wunde kann er NICHT mehr selbst, mit einem Verband oder durch Schlaf richtig behandeln'),
  'the prose prompt must explain why self first aid no longer suffices');
assert(html.includes('NUR Doc Wagner in seiner Praxis in der Schäferstraße ODER Marlene Wagner in der Charité'),
  'the prose prompt must name both valid professional treatment routes');

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

assert(html.includes("abschlussEffekt: {"),
  'Brandt terminal evidence needs an explicit configured conclusion effect');
assert(html.includes("verantwortlicher: 'Kurt Lange'"),
  'Brandt terminal evidence must identify Kurt Lange deterministically');
assert(html.includes('ABSCHLUSS-INDIZ (HART)'),
  'the model prompt must require the terminal clue to be visibly narrated');
assert(html.includes('if (a.noEvidence) return null;'),
  'peaceful offers must be excluded from deterministic evidence');
assert(html.includes('_noEvidence: true'),
  'peaceful showdown items must carry the no-evidence marker');
assert(html.includes('ORTS-NPC-KONTINUITÄT (HART)'),
  'the scene prompt must prevent spontaneous exits and invented companions');
assert(html.includes('isLocationBound && mainLocationChanged'),
  'location-bound NPCs must be removed on a hard move even when prose claims they follow');
assert(brandtBlock.includes('requiresExplicitConfession: true'),
  'the mandatory responsibility beat must reject motive-only prose');
assert(brandtBlock.includes('kombiMinHits: 3'),
  'responsibility fallback must require name, confession and criminal act together');

const offerEvidenceContext = {
  window: null,
  normForMatch: (value) => String(value || '').toLowerCase(),
};
offerEvidenceContext.window = offerEvidenceContext;
offerEvidenceContext._letzteAktion = {
  kategorie: 'DEFENSIV',
  text: 'Karl bietet Kurt Lange Kuchen an.',
  npcName: 'Kurt Lange',
  noEvidence: true,
};
vm.createContext(offerEvidenceContext);
vm.runInContext(sourceOf('classifyEvidenceAction') + '\n' + sourceOf('getEvidenceActionKey'), offerEvidenceContext);
assert.strictEqual(offerEvidenceContext.classifyEvidenceAction(), null,
  'cake or cigarettes may calm Kurt but must not count as an interrogation');
assert.strictEqual(offerEvidenceContext.getEvidenceActionKey(), null,
  'peaceful items must not select the terminal confession clue');

const truthbeatContext = {
  caseSetup: {
    truthBeats: [
      {
        id: 'lange_verantwortlich',
        label: 'Lange verantwortlich',
        pflicht: true,
        requiresExplicitConfession: true,
        keywords: /\blange\b[\s\S]{0,120}\b(gesteht|kaltblütig)/i,
      },
      { id: 'zeugen_aussage', label: 'Zeugenaussage', keywords: /nie-treffen/i },
    ],
  },
  caseProgress: { truthBeatsHit: [] },
  sceneCounter: 5,
  diag: () => {},
  console: { log: () => {} },
};
vm.createContext(truthbeatContext);
vm.runInContext(sourceOf('_truthBeatHatExplizitesGestaendnis') + '\n' + sourceOf('updateTruthBeats'), truthbeatContext);
truthbeatContext.updateTruthBeats(
  'Die 800 D-Mark bei Kurt Lange sind das einzige Motiv, das den Selbstmord in ein kaltblütiges Geschäft verwandelt.');
assert.deepStrictEqual(Array.from(truthbeatContext.caseProgress.truthBeatsHit), [],
  'motive language must not identify Lange as responsible or manufacture a witness statement');
truthbeatContext.updateTruthBeats('Kurt Lange gesteht: Ich habe Erich erschossen und den Selbstmord inszeniert.');
assert(truthbeatContext.caseProgress.truthBeatsHit.includes('lange_verantwortlich'),
  'an explicit confession must still satisfy the mandatory responsibility beat');
assert(truthbeatContext.caseProgress.truthBeatsHit.includes('zeugen_aussage'),
  'only an explicit confession may provide the confession-as-witness multi-proof');

const terminalClue = {
  id: 'lange_gestaendnis',
  text: 'Kurt Lange überführt: Erichs Selbstmord war inszeniert.',
  abschlussEffekt: {
    verantwortlicher: 'Kurt Lange',
    minStage: 3,
    suspectConfronted: true,
    ueberfuehrt: true,
    wahrheitErkannt: true,
    truthBeatIds: ['lange_verantwortlich', 'zeugen_aussage'],
    narrativ: /\b(gesteht|inszeniert)\b/i,
    fallbackProse: 'Lange gesteht die Inszenierung.'
  }
};
const terminalContext = {
  caseProgress: {
    stage: 2,
    gefundeneIndizIds: ['lange_gestaendnis'],
    indizien: ['Schuldschein bei Lange', 'Waffenspur am Tatort'],
    truthBeatsHit: []
  },
  sceneCounter: 18,
  _findeIndizById: (id) => id === terminalClue.id ? terminalClue : null,
  updateTruthBeats: () => {},
  syncResolutionFlagsByCaseType: () => {},
  diag: () => {}
};
vm.createContext(terminalContext);
vm.runInContext(sourceOf('_indizAbschlussProsaSichern') + '\n'
  + sourceOf('_indizAbschlussEffektAnwenden') + '\n'
  + sourceOf('_syncDefinierteIndizAbschlussEffekte'), terminalContext);
assert.strictEqual(terminalContext._syncDefinierteIndizAbschlussEffekte('test'), true,
  'an already-found terminal clue must heal an old stuck save');
assert.strictEqual(terminalContext.caseProgress.tatverdaechtiger, 'Kurt Lange',
  'terminal clue must restore the missing suspect');
assert.strictEqual(terminalContext.caseProgress.suspectConfronted, true,
  'terminal clue must restore confrontation state');
assert.strictEqual(terminalContext.caseProgress.ueberfuehrt, true,
  'terminal clue must restore the responsible-person conclusion');
assert.strictEqual(terminalContext.caseProgress.wahrheitErkannt, true,
  'terminal clue must restore the truth conclusion');
assert.strictEqual(terminalContext.caseProgress.resolveEverReady, true,
  'terminal clue must expose the resolve path instead of leaving an empty map');
assert(terminalContext.caseProgress.truthBeatsHit.includes('lange_verantwortlich'),
  'terminal clue must satisfy the mandatory Brandt truth beat');
const evasiveScene = { szene: 'Lange mustert Karl und weicht der Frage aus.' };
assert.strictEqual(terminalContext._indizAbschlussProsaSichern(terminalClue, evasiveScene), true,
  'evasive model prose must receive the configured visible payoff');
assert(evasiveScene.szene.includes('Lange gesteht die Inszenierung.'),
  'fallback prose must visibly narrate the booked confession');
assert.strictEqual(terminalContext._indizAbschlussProsaSichern(terminalClue, evasiveScene), false,
  'terminal fallback prose must remain idempotent');

const showdownContext = {
  caseProgress: {
    showdownAktiv: true,
    showdownBestanden: false,
    showdownGegner: 'Kurt Lange'
  },
  normForMatch: (value) => String(value || '').toLowerCase().trim(),
  pendingCategoryMessages: [],
  diag: () => {}
};
vm.createContext(showdownContext);
vm.runInContext(sourceOf('_showdownPruefeBestanden') + '\n'
  + sourceOf('_showdownZustandAnrechnen') + '\n'
  + sourceOf('_showdownAktivenZustandSynchronisieren'), showdownContext);
assert.strictEqual(showdownContext._showdownZustandAnrechnen('Kurt Lange', {
  status: 'beruhigt',
  reason: 'friedliches_itemangebot',
  item: 'Schachtel West-Zigaretten'
}), true, 'an accepted peaceful offer must satisfy the showdown trade route');
assert.strictEqual(showdownContext.caseProgress.showdownBestanden, true,
  'peacefully resolved Kurt must no longer block case resolution');
assert.strictEqual(showdownContext.caseProgress.showdownArt, 'verhandlung',
  'the peaceful item route must be recorded as negotiation');
assert(showdownContext.pendingCategoryMessages.some(message => message.includes('blockiert Karl NICHT mehr')),
  'the next prose scene must receive the resolved-showdown truth');

showdownContext.caseProgress = {
  showdownAktiv: true,
  showdownBestanden: false,
  showdownGegner: 'Kurt Lange'
};
showdownContext._npcZustandGet = () => ({
  status: 'beruhigt',
  reason: 'friedliches_itemangebot',
  ort: 'Rote Laterne'
});
assert.strictEqual(showdownContext._showdownAktivenZustandSynchronisieren(), true,
  'an old save with calm Kurt must self-heal before rendering the resolve button');
assert.strictEqual(showdownContext.caseProgress.showdownBestanden, true,
  'save healing must prevent Kurt from following Karl to office or Charite');

showdownContext.caseProgress = {
  showdownAktiv: true,
  showdownBestanden: false,
  showdownGegner: 'Kurt Lange'
};
assert.strictEqual(showdownContext._showdownZustandAnrechnen('Kurt Lange', {
  status: 'beruhigt',
  reason: 'unrelated_social_scene'
}), false, 'an unrelated calm scene must not bypass a mandatory showdown');
assert.strictEqual(showdownContext.caseProgress.showdownBestanden, false,
  'only the explicit peaceful trade route may satisfy the showdown');
assert(sourceOf('renderOptions').includes('_showdownAktivenZustandSynchronisieren'),
  'the resolve button must heal an old peaceful showdown before calculating its lock');
assert(sourceOf('getNpcsAtCurrentLocation').includes('_showdownZustandAnrechnen'),
  'the showdown presence injector must not teleport an already-calmed opponent');
assert(html.includes("showProgressToast('Konflikt beendet'"),
  'a stale attack click against a calm opponent must give visible feedback instead of doing nothing');

assert(fs.existsSync(path.join(root, 'assets', 'scenes', 'brandt', 'rote-laterne-kurt-konfrontation.webp')),
  'Kurt confrontation image asset is missing');
const visualContext = {
  caseSetup: { klient: 'Anton Brandt', opfer: 'Erich Brandt', tat: 'Tod aufklären' },
  engineCurrentLocation: { name: 'Rote Laterne' },
  caseProgress: { activeConfrontation: { enemyName: 'Kurt Lange' } },
  normForMatch: (value) => String(value || '').toLowerCase().replace(/[_\s]+/g, ' ').trim(),
  _konfrontationAktiv: () => true,
  _encounterAktiv: () => false,
  _konfrontationEnemy: () => ({ name: 'Kurt Lange' })
};
vm.createContext(visualContext);
vm.runInContext(sourceOf('_brandtKurtKonfrontationVisual'), visualContext);
const kurtVisual = visualContext._brandtKurtKonfrontationVisual();
assert(kurtVisual && kurtVisual.file === 'rote-laterne-kurt-konfrontation.webp',
  'active Kurt confrontation must override the generic Rote Laterne still');

console.log('brandt run regression tests passed');
