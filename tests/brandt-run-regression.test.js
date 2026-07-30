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

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1785 +PartialEndingTruth'"),
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
for (const label of [
  'Prüfe die zweite Pistole',
  'Befrage Lola zu Erichs Angst',
  'Befrage den Zeugen zur Walther',
  'Konfrontiere Lange mit den Beweisen',
  'Durchsuche Langes Tasche',
  'Prüfe das lose Rückenbrett',
  'Prüfe das Fensterbrett',
]) {
  assert(brandtBlock.includes("hauptuiActionLabel: '" + label + "'"),
    'Brandt clue needs a visible purposeful action: ' + label);
}
assert(brandtBlock.includes("oeffnungszeit: ['nachmittag','abend','nacht']"),
  'Rote Laterne must close after the night instead of keeping its cast through the morning');
assert(brandtBlock.includes("sperrstundenAussen: 'Vor der Roten Laterne am Nollendorfplatz'"),
  'club closing needs a deterministic exterior destination');
assert(html.includes("{ test: /^vor der roten laterne/, file: 'vor-rote-laterne-day.webp'"),
  'the club exterior needs its own image instead of hiding or reusing the interior still');
assert(brandtBlock.includes("{ id: 'lola_brandt', zeit: ['nachmittag','abend','nacht'] }"),
  'Lola must have a work shift instead of permanent presence');
assert(brandtBlock.includes("{ id: 'emil_pohl', zeit: ['abend','nacht'], bisStage: 3 }"),
  'optional pub witness Emil must leave before the fixed-image final report');
const brandtOpeningStart = brandtBlock.indexOf("{ name: 'Opel Olympia am Tempelhofer Feld'");
const brandtOpeningBlock = brandtBlock.slice(brandtOpeningStart, brandtOpeningStart + 1800);
assert(brandtOpeningBlock.includes('openingFallbackText:')
  && brandtOpeningBlock.includes('für den Blackout gibt es noch keine Erklärung')
  && !brandtOpeningBlock.includes('Eisenstange'),
  'the Brandt opening fallback must preserve the genuinely unknown blackout cause');
assert(brandtOpeningBlock.includes('Karls eigene Walther PPK steckt weiterhin in seinem Holster')
  && brandtOpeningBlock.includes('zweiten, fremden Pistole'),
  'Brandt opening must keep Karl own PPK separate from Erich foreign pistol');
assert(brandtOpeningBlock.includes('Karls eigene Walther PPK bleibt währenddessen in seinem Holster')
  && brandtOpeningBlock.includes('Erichs Tatwaffe als zweite Pistole'),
  'Brandt first clue must preserve both weapons without moving Karl PPK offstage');
assert(brandtBlock.includes('Karl steht bereits in Erichs zur Untersuchung freigegebener Einzimmerwohnung')
  && brandtBlock.includes('klettert nicht außen am vierten Stock')
  && brandtBlock.includes('weder Taschenmesser noch erfundenes Werkzeug'),
  'Brandt debt-note search must not invent a fourth-floor window stunt or absent knife');
assert(brandtBlock.includes('inzwischen zur Untersuchung freigegebene Einzimmerwohnung')
  && brandtBlock.includes('das Polizeisiegel ist bereits amtlich aufgehoben')
  && brandtBlock.includes('mit dem regulären Schluessel der Vermieterin'),
  'Brandt apartment arrival must explain lawful entry instead of opening an intact police seal by magic');
assert(brandtBlock.includes("id: 'zeuge_walther'")
  && brandtBlock.includes("actions: ['BEFRAGEN','ANSPRECHEN','ERKUNDEN']"),
  'the bar witness clue must lead with questioning, not the generic filler label Durchsuche');
assert(brandtBlock.includes("id: 'lange_gestaendnis'")
  && brandtBlock.includes('»Ich habe Erich erschossen.')
  && brandtBlock.includes('Du hältst sein eindeutiges Geständnis fest.'),
  'Lange confession must be a direct first-person admission rather than a third-person evidence quote');
const blackoutGuardContext = {
  caseSetup: { klient: 'Anton Brandt (Vater)' },
  engineCurrentLocation: { name: 'Opel Olympia am Tempelhofer Feld' },
  normForMatch: value => String(value || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss'),
};
vm.createContext(blackoutGuardContext);
vm.runInContext(sourceOf('_findBrandtBlackoutCauseDrift'), blackoutGuardContext);
const hammerOpening = blackoutGuardContext._findBrandtBlackoutCauseDrift({
  szene: 'Dein Kopf dröhnt, als hätte jemand mit einem Vorschlaghammer gegen deinen Schädel geschlagen.'
});
assert(hammerOpening && hammerOpening.code === 'brandt_blackout_cause_invented',
  'the unknown Brandt blackout must reject a hammer cause even when phrased as a comparison');
assert(sourceOf('validateOpeningRoleTruth').includes('_findBrandtBlackoutCauseDrift'),
  'Brandt blackout truth must run during the opening, not only from scene two onward');
assert(sourceOf('enforceSceneWorldTruthFallback').includes("problem.code === 'brandt_blackout_cause_invented'"),
  'Brandt blackout cause drift needs a deterministic final fallback');
const waltherClueStart = brandtBlock.indexOf("{ id: 'zeuge_walther'");
const waltherClueBlock = brandtBlock.slice(waltherClueStart, waltherClueStart + 2500);
assert(waltherClueBlock.includes('fundText:')
  && waltherClueBlock.includes('Lola am Bühnenmikrofon')
  && waltherClueBlock.includes('Kurt Lange seinen Ecktisch')
  && waltherClueBlock.includes('Walther')
  && waltherClueBlock.includes('Opel')
  && waltherClueBlock.includes('replaceOnFallback: true')
  && !waltherClueBlock.includes('leeren Gastraum'),
  'the Walther witness payoff must be full prose and preserve Lola/Kurt scene staging');
assert(brandtBlock.includes("requiresEvidenceAll: ['schuldschein','fremde_walther','zeuge_walther']"),
  'Kurt confession must follow motive, swapped weapon and the concrete witness statement');
assert(brandtBlock.includes('Er erschoss Erich und inszenierte danach dessen \\"Selbstmord\\"'),
  'terminal Brandt evidence must state the killing, not only a vague staging');
assert(brandtBlock.includes('KEINE Vitrine, KEINE Glasscherben und KEINEN Spielzeugsoldaten'),
  'Erich apartment prose truth must match the sparse intact scene image');
assert(brandtBlock.includes('Die Regale sind NICHT leer'),
  'Erich apartment prose must preserve the visible shelf contents');
assert(brandtBlock.includes('Hinter dem losen Rueckenbrett eines intakten Wandregals'),
  'the debt note needs a concrete image-compatible hiding place');
assert(brandtBlock.includes('beweist allein aber noch nicht den Mord'),
  'zigarillo ash must connect Lange to the room without overclaiming guilt');
assert(!brandtBlock.includes('zwei Schlaeger immer dabei'),
  'unrostered henchmen must not be injected into every Rote-Laterne scene');
assert(brandtBlock.includes('erfinde fuer Kurt keine Begleiter oder Schlaeger'),
  'the canonical club roster must forbid invented hostile companions');
assert(brandtBlock.includes('Lola Brandt steht im festen Szenenbild bei der kleinen Buehne und dem Mikrofon')
  && brandtBlock.includes('Kurt sitzt an einem Ecktisch'),
  'Rote Laterne prose staging must match the fixed Lola/Kurt scene image');
for (const location of [
  'Rote Laterne',
  'Anton Brandts Eckkneipe und Wohnung',
  'Erich Brandts ehemalige Wohnung'
]) {
  const locationStart = brandtBlock.indexOf("{ name: '" + location + "'");
  assert(locationStart >= 0 && brandtBlock.slice(locationStart, locationStart + 1800).includes('arrivalFallbackText:'),
    location + ' needs an authored arrival instead of a dry routing template');
}
const underwrittenSource = sourceOf('_findUnderwrittenSceneProse');
assert(underwrittenSource.includes('escapedQuote') && underwrittenSource.includes('repeatedConjunctionFragment'),
  'literal escaped quotes and broken repeated conjunction fragments must trigger prose repair');
assert(underwrittenSource.includes('ueberfuehrt'),
  'a dry evidence summary beginning with "ueberfuehrt:" must trigger prose repair');
const rosterPresenceSource = sourceOf('_findRosterPresenceContradiction');
assert(rosterPresenceSource.includes('schankraum|club|kneipe')
  && rosterPresenceSource.includes('leeren|menschenleeren|verwaisten'),
  'an occupied pub or club must not be narrated as empty or deserted');
const brandtProseGuardContext = {
  engineCurrentLocation: { name: 'Rote Laterne' },
  getCaseLocations: () => [],
  normForMatch: value => String(value || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  caseProgress: {}
};
vm.createContext(brandtProseGuardContext);
vm.runInContext(underwrittenSource, brandtProseGuardContext);
assert(brandtProseGuardContext._findUnderwrittenSceneProse({
  szene: '\\"Er war hier. Kurz bevor er. bevor er ging.\\"'
}, {}), 'escaped quotes and a repeated broken fragment must be rejected');
assert(brandtProseGuardContext._findUnderwrittenSceneProse({
  szene: 'Kurt Lange ueberfuehrt: Er erschoss Erich und inszenierte den Selbstmord.'
}, {}), 'a dry terminal evidence summary must be rejected');
const brandtRosterGuardContext = {
  engineCurrentLocation: { name: 'Rote Laterne' },
  normForMatch: brandtProseGuardContext.normForMatch,
  getNpcsAtCurrentLocation: () => [{ id: 'lola_brandt', name: 'Lola Brandt' }],
  _npcZustandIstEntfernt: () => false,
  _worldTruthAliases: (id, entry) => [id, entry.name],
  _worldTruthHasAlias: (text, aliases) => aliases.some(alias =>
    brandtProseGuardContext.normForMatch(text).includes(brandtProseGuardContext.normForMatch(alias)))
};
vm.createContext(brandtRosterGuardContext);
vm.runInContext(rosterPresenceSource, brandtRosterGuardContext);
assert(brandtRosterGuardContext._findRosterPresenceContradiction({
  szene: 'Lola sieht sich im leeren Club um.'
}), 'the prose must not call a club empty while Lola is present');
assert(brandtRosterGuardContext._findRosterPresenceContradiction({
  szene: 'Du durchquerst den leeren Gastraum, während Lola am Mikrofon wartet.'
}), 'the prose must not call an occupied Gastraum empty');
const quoteGuardContext = {};
vm.createContext(quoteGuardContext);
vm.runInContext(sourceOf('stripAccidentalNarrativeQuotes') + '\n' + sourceOf('fixSprache'), quoteGuardContext);
const escapedDialogue = 'Du gehst zur Tür. Dort fragt Kurt: \\"Was wollen Sie?\\" '
  + 'Du antwortest ihm ruhig und bleibst dabei aufmerksam, bis er schließlich zur Seite tritt.';
assert(!quoteGuardContext.fixSprache(escapedDialogue).includes('\\"'),
  'visible escaped dialogue quotes must be cleaned centrally');
const quotedNarrative = '"Du gehst zur Tür und bleibst aufmerksam. Der Regen läuft über die Scheibe, '
  + 'während Kurt seinen Platz am Ecktisch nicht verlässt. Du wartest, bis er schließlich zu sprechen beginnt."';
assert(!/^["“„]/.test(quoteGuardContext.fixSprache(quotedNarrative)),
  'an accidental whole-paragraph narrative quote must be removed centrally');
const quotedArrival = '"Der Opel Olympia rasselt, während du die Stallschreiberstraße entlangrollst. Du stellst den Motor ab. '
  + 'Hinter dem Tresen sitzt Frieda. „Mauer“, sagt sie trocken. Kalle und Jochen beobachten dich schweigend."';
assert(!/^["“„]/.test(quoteGuardContext.fixSprache(quotedArrival))
  && !/["”]$/.test(quoteGuardContext.fixSprache(quotedArrival)),
  'the exact live Frieda arrival shape must lose only its accidental outer quote pair');
assert(brandtBlock.includes('Formuliere NICHT "erster Mai"'),
  'the 21 May opening must not sound like May Day');
assert(brandtBlock.includes('Die Ursache des Blackouts ist noch vollkommen unbekannt')
  && brandtBlock.includes('Behaupte NICHT, Karl sei mit Metall'),
  'Brandt prose must not turn the unknown blackout cause into an invented head strike');
const worldTruthSource = sourceOf('validateSceneWorldTruth');
assert(worldTruthSource.includes('_findBrandtBlackoutCauseDrift')
  && sourceOf('_findBrandtBlackoutCauseDrift').includes("code: 'brandt_blackout_cause_invented'")
  && worldTruthSource.includes("code: 'healthy_karl_injury_invented'"),
  'world-truth validation must reject invented blackout causes and injuries');
const npcInteractionSource = sourceOf('npcInteraktion');
assert(npcInteractionSource.includes("reden|rede|fragen"),
  'the generic Rede mit action must count as a client conversation');
assert(npcInteractionSource.includes("caseProgress && !caseProgress.klientGesprochen) {"),
  'a client conversation must unlock travel even when the client remains at a fixed home location');
assert(npcInteractionSource.includes("if (_clientSollNachErstgespraechGehen(npc)) _clientDepartureAfterReply = npc.name;"),
  'client departure must remain a separate optional location rule');
const normalizeSource = sourceOf('normalizeCaseProgress');
assert(normalizeSource.includes('const _clientSchonBefragt = _clientEntry && merged._begegnungen.some'),
  'restore must infer an already completed client conversation from the encounter log');
assert(normalizeSource.includes('if (_clientSchonBefragt) merged.klientGesprochen = true;'),
  'a pre-fix save with a disabled client must recover its travel gate');
assert(normalizeSource.includes("merged._npcGesprochen[key] === true"),
  'restore must also recognize the direct Haupt-UI spoken-person key');
assert(html.includes('const _bereitsGespraechenerKlient = _npHier.find(function(n)'),
  'the live travel gate must reconcile a pre-fix spoken client after setup and roster are available');
assert(html.includes('if (caseProgress.klientGesprochen) _klientGateAktiv = false;'),
  'a reconciled client conversation must release the current scene immediately');
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
assert(html.includes("String(_castSetupEntry.tag || '').toUpperCase() === 'CLIENT'"),
  'client cleanup must use canonical setup identity instead of a display-title string');
assert(html.includes('Letzte physische Ortsschranke fuer Klienten')
  && html.includes('if (!_clientOrtGebunden && !_clientAbschlussHier && !_clientInParty && !_openingClientEtabliert)'),
  'the Haupt-UI must remove stale clients from foreign locations after all cast injectors');
assert(html.includes("['text', 'fundText', 'requiresEvidenceLabel'"),
  'corrected clue truth must migrate into already-running saves');
assert(html.includes("if (typeof qLoc.detail === 'string' && loc.detail !== qLoc.detail)"),
  'corrected visual/location truth must migrate into already-running saves');
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

assert(fs.existsSync(path.join(root, 'assets', 'scenes', 'brandt', 'rote-laterne-kurt-ko.webp')),
  'Kurt KO image asset is missing');
visualContext._konfrontationAktiv = () => false;
visualContext._npcZustandGet = () => ({ status: 'ko', ort: 'Rote Laterne' });
const kurtKoVisual = visualContext._brandtKurtKonfrontationVisual();
assert(kurtKoVisual && kurtKoVisual.file === 'rote-laterne-kurt-ko.webp',
  'a local KO Kurt must override every relaxed/standing Rote Laterne still');
assert(fs.existsSync(path.join(root, 'assets', 'scenes', 'brandt', 'vor-rote-laterne-day.webp')),
  'Brandt exterior day image is missing');
assert(html.includes("test: /^vor der roten laterne/, file: 'vor-rote-laterne-day.webp'"),
  'the day-two exterior must not remain silently hidden');
assert(html.includes("place: 'Rote Laterne', innen: true, depictsNpcs: ['lola_brandt', 'kurt_lange']"),
  'the Rote Laterne visual contract must name both consistently depicted main NPCs');
assert(html.includes("truthBeatIds: ['schulden_motiv']"),
  'the structured Schuldschein must map deterministically to its truth beat');
assert(html.includes("id: 'lange_wohnungsschluessel'") && html.includes('searchAfterDefeat: true'),
  'a defeated Lange needs a searchable fail-forward clue');
assert(sourceOf('_markiereIndizGefunden').includes('via Kern-Indiz-ID'),
  'structured evidence must satisfy mapped truth beats without another regex guess');
const floorContext = {
  caseProgress: { stage: 1, indizStageFloor: 0, gefundeneIndizIds: ['schuldschein'] },
  sceneCounter: 6,
  _findeIndizById: () => ({ id: 'schuldschein', stage: 2 }),
  diag: () => {}
};
vm.createContext(floorContext);
vm.runInContext(sourceOf('_stageFloorAnwenden'), floorContext);
floorContext._stageFloorAnwenden();
assert.strictEqual(floorContext.caseProgress.stage, 2,
  'a found stage-two clue must reopen progression once the scene hard-floor is reached');

console.log('brandt run regression tests passed');
