const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
const context = { INTRO_REQUIREMENTS: '' };
vm.createContext(context);

const casesStart = html.indexOf('const INTRO_VARIANTS');
const casesEnd = html.indexOf('const DIFFICULTY_ORDER', casesStart);
assert(casesStart >= 0 && casesEnd > casesStart, 'case setup block is missing');
vm.runInContext(
  html.slice(casesStart, casesEnd) + ';globalThis.CASES=INTRO_VARIANTS;',
  context,
);

const variant = context.CASES.find((entry) =>
  /margarete stein/i.test(String(entry && entry.setup && entry.setup.klient)));
assert(variant, 'Stein setup is missing');
const setup = variant.setup;
const locations = new Map(setup.locations.map((location) => [location.name, location]));
const wahler = setup.setupCast.find((npc) => npc && npc.id === 'wahler');

const office = locations.get('Karl Mauers Büro');
assert(office && /Schmuggelroute/.test(office.openingFallbackText)
    && /Margarete Stein/.test(office.openingFallbackText)
    && /Straßenbahn/.test(office.openingFallbackText),
  'Stein opening fallback must contain case, client danger and phone clue');
assert(office && !/Wahler/.test(office.arrivalFallbackText),
  'Stein office fallback must not reveal Wahler before an evidence click');
assert(wahler && Array.isArray(wahler.knownAfterEvidence)
    && wahler.knownAfterEvidence.includes('margarete_aussage')
    && wahler.knownAfterEvidence.includes('akten_kopie_wohnung'),
  'Wahler identity must remain evidence-gated away from his configured encounter');

for (const name of [
  'Margarete Steins Wohnung',
  'Reichsbahndirektion Mitte',
  'West-Berliner Auffangstelle',
  'Stellwerk Schöneweide',
  'Café Kranzler',
]) {
  const location = locations.get(name);
  assert(location && location.arrivalFallbackText
      && location.arrivalFallbackText.split(/\s+/).length >= 28,
    'Stein arrival fallback is missing or too dry at ' + name);
  assert(!/betrittst den schauplatz|entscheidest, wen du ansprichst/i.test(location.arrivalFallbackText),
    'Stein arrival fallback contains mechanical prose at ' + name);
}
assert(/niemals in einer Pistole/.test(
  locations.get('Reichsbahndirektion Mitte').arrivalFallbackText),
  'Wahler must remain a bureaucratic, unarmed antagonist');

const clues = setup.locations.flatMap((location) => location.indizien || []);
const clueById = new Map(clues.map((clue) => [clue.id, clue]));
const purposefulSteinLabels = {
  margarete_aussage: 'Befrage Margarete zur Schmuggelroute',
  akten_kopie_wohnung: 'Suche Margaretes Aktenkopie',
  frachtliste_stempel: 'Prüfe die gestempelte Frachtliste',
  dienstplan_wahler: 'Prüfe Wahlers Dienstplan',
  hinweis_stellwerk: 'Prüfe den Ablagevermerk',
  uebergabe_beobachtet: 'Beobachte Gleis 4',
  notiz_wahler_gleis: 'Sichere die Gleisnotiz',
  vera_uebergabekontakt: 'Ermittle einen sicheren Westkontakt',
  original_akten: 'Sichere die Originalakten',
  wahler_unterschrift: 'Prüfe Wahlers Unterschrift',
  vera_westperspektive: 'Befrage Vera zum Sicherungsweg',
  lemke_belastet_wahler: 'Befrage Lemke zu Wahlers Sonderfrachten',
  anker_kontakt_hinweis: 'Befrage Kummer zum IM „Anker“',
};
for (const [clueId, expectedLabel] of Object.entries(purposefulSteinLabels)) {
  const clue = clueById.get(clueId);
  assert(clue && clue.hauptuiActionLabel === expectedLabel,
    'Stein clue needs a visible purposeful action: ' + clueId);
  assert(clue.hauptuiActionPrompt && clue.hauptuiActionPrompt.length >= 100,
    'Stein clue needs a precise generation contract: ' + clueId);
}
for (const id of [
  'margarete_aussage',
  'akten_kopie_wohnung',
  'frachtliste_stempel',
  'dienstplan_wahler',
  'hinweis_stellwerk',
  'uebergabe_beobachtet',
  'notiz_wahler_gleis',
  'vera_uebergabekontakt',
  'original_akten',
  'wahler_unterschrift',
  'vera_westperspektive',
  'lemke_belastet_wahler',
  'anker_kontakt_hinweis',
]) {
  const clue = clueById.get(id);
  assert(clue && clue.fundText && clue.fundText.split(/\s+/).length >= 20,
    id + ' needs a complete narrated clue payoff');
}
assert(/zerbrach ihre Drahtgestellbrille/.test(clueById.get('margarete_aussage').fundText),
  'Margaretes broken glasses must be explicit world truth');
assert(/Erst mit diesem Hinweis/.test(clueById.get('vera_uebergabekontakt').fundText),
  'Vera must become known through an actual clue');
for (const [id, beat] of [
  ['frachtliste_stempel', 'schmuggelroute_belegt'],
  ['uebergabe_beobachtet', 'schmuggelroute_belegt'],
  ['original_akten', 'schmuggelroute_belegt'],
  ['wahler_unterschrift', 'wahler_verantwortlich'],
  ['lemke_belastet_wahler', 'wahler_verantwortlich'],
  ['anker_kontakt_hinweis', 'im_anker_identifiziert'],
]) {
  assert.deepStrictEqual(Array.from(clueById.get(id).politicalBeatIds || []), [beat],
    id + ' must book its political evidence beat deterministically');
  assert(clueById.get(id).prosaPflicht || id === 'original_akten',
    id + ' needs a narrated evidence safeguard');
}
for (const clue of clues) {
  assert(!(clue.politicalBeatIds || []).includes('akten_gesichert')
      && !(clue.politicalBeatIds || []).includes('margarete_gesichert'),
    'security beats must remain real player actions, never clue side effects');
}

const imageStart = html.indexOf('const SHARED_SCENE_IMAGES');
const imageEnd = html.indexOf('function _kesslerSceneNorm', imageStart);
assert(imageStart >= 0 && imageEnd > imageStart, 'scene image configuration is missing');
vm.runInContext(
  html.slice(imageStart, imageEnd) + ';globalThis.IMAGE_SETS=CASE_SCENE_IMAGE_SETS;',
  context,
);
const imageSet = context.IMAGE_SETS.find((entry) => {
  entry.caseTest.lastIndex = 0;
  return entry.caseTest.test(setup.klient);
});
assert(imageSet, 'Stein scene image set is missing');

function specFor(location) {
  return imageSet.images.find((entry) => {
    entry.test.lastIndex = 0;
    return entry.test.test(location);
  });
}

for (const [location, id, file, width = 1536, height = 1024] of [
  ['margarete steins wohnung', 'mann_im_mantel', 'margarete-wohnung-mantel-night.png'],
  ['reichsbahndirektion', 'im_anker', 'reichsbahndirektion-wahler-anker-day.png'],
  ['charite', 'oberleutnant_mertens', 'charite-mertens-day.png'],
  ['karl mauers buero', 'oberleutnant_mertens', 'karl-mauers-buero-mertens-only-day-v1739.png', 1672, 941],
  ['karl mauers buero', 'vera_lindqvist', 'karl-mauers-buero-vera-night.png'],
  ['cafe kranzler', 'vera_lindqvist', 'cafe-kranzler-vera-day-v1739.png', 1672, 941],
  ['friedrichstrasse', 'margarete_stein', 'friedrichstrasse-margarete-day.png'],
]) {
  const spec = specFor(location);
  assert(spec && Array.isArray(spec.presenceVariants),
    location + ' needs an NPC-bound visual variant');
  const npcVariant = spec.presenceVariants.find((entry) => entry.id === id);
  assert(npcVariant && npcVariant.depictsNpcs.includes(id),
    location + ' visual must depict ' + id);
  assert.strictEqual(npcVariant.file, file, location + ' uses the wrong visual asset');
  const imagePath = path.join(
    repoRoot,
    npcVariant.root || spec.root || imageSet.root,
    npcVariant.file,
  );
  assert(fs.existsSync(imagePath) && fs.statSync(imagePath).size > 500000,
    location + ' visual asset is missing or implausibly small');
  const png = fs.readFileSync(imagePath);
  assert.deepStrictEqual(
    { width: png.readUInt32BE(16), height: png.readUInt32BE(20) },
    { width, height },
    location + ' visual must use its intended generated resolution',
  );
}

function sourceOf(name) {
  const start = html.indexOf('function ' + name + '(');
  assert(start >= 0, name + ' is missing');
  const bodyStart = html.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < html.length; index++) {
    if (html[index] === '{') depth++;
    if (html[index] === '}') depth--;
    if (depth === 0) return html.slice(start, index + 1);
  }
  assert.fail(name + ' has no closing brace');
}

const sanitizerContext = {
  caseSetup: { klient: setup.klient, opfer: setup.opfer },
  caseProgress: {
    gefundeneIndizIds: ['margarete_aussage'],
    evidenceSecured: true,
  },
};
vm.createContext(sanitizerContext);
vm.runInContext(sourceOf('sanitizeProsaMetadaten'), sanitizerContext);
const repaired = sanitizerContext.sanitizeProsaMetadaten(
  'Margarete blickt hinter den Gläsern ihrer Drahtgestellbrille auf. '
    + 'Ihre Brille rutscht ihr auf die Nase. Wahler greift nach seiner Dienstwaffe. '
    + 'Du legst ihr die Frachtlisten und die Bestätigung hin. Schätze,, das reicht.',
);
assert(!/Gläsern ihrer Drahtgestellbrille|Brille rutscht|Dienstwaffe|,,/.test(repaired),
  'Stein prop continuity and doubled punctuation must be repaired');
assert(/Abschrift deiner Notizen/.test(repaired),
  'the finale must not hand over originals that Vera already secured');

sanitizerContext.caseProgress = {
  gefundeneIndizIds: [],
  evidenceSecured: false,
};
const repairedBeforeEvidence = sanitizerContext.sanitizeProsaMetadaten(
  'Margarete sinkt auf einen Stuhl. Ihre Brille rutscht ihr fast von der Nase.',
);
assert(!/Brille rutscht|von der Nase/.test(repairedBeforeEvidence)
    && /Nasenwurzel/.test(repairedBeforeEvidence),
  'the broken-glasses truth must apply from the fixed apartment arrival, before her formal clue');
const repairedLiveVariant = sanitizerContext.sanitizeProsaMetadaten(
  'Ihre Brille rutscht ihr dabei von der Nase, baumelt an einem Bügel. Ihre Augen hinter den Gläsern wirken verweint.',
);
assert(!/Brille rutscht|baumelt an einem Bügel|hinter den Gläsern/.test(repairedLiveVariant)
    && /Nasenwurzel/.test(repairedLiveVariant)
    && /ungeschützter Blick/.test(repairedLiveVariant),
  'the live Stein wording must not evade the broken-glasses continuity guard');
sanitizerContext.caseProgress = {
  gefundeneIndizIds: ['original_akten', 'wahler_unterschrift'],
  evidenceSecured: true,
};
const repairedLateStein = sanitizerContext.sanitizeProsaMetadaten(
  'Eine Drahtgestellbrille sitzt schief auf ihrer Nase, und vor ihr liegt ein Stapel Dokumente mit dem roten Stempel der Reichsbahn. '
    + 'Du packst Margarete am Arm, die Akten unter deinem anderen, und während du die belastenden Frachtlisten vor ihm ausbreitest, blickst du auf. '
    + 'Du blickst auf die Unterlagen in deinen Händen. Die Frachtlisten mit dem Reichsbahn-Stempel und die belastenden Aussagen sind eindeutig.',
);
assert(!/Brille sitzt schief|Stapel Dokumente|Akten unter deinem|Frachtlisten vor ihm ausbreitest|Unterlagen in deinen Händen/.test(repairedLateStein),
  'late Stein scenes must preserve the broken-glasses and completed evidence-handoff truths');
assert(/Roth bereits gesichert|bei Roth gesicherten Frachtlisten/.test(repairedLateStein),
  'late Stein showdown prose must explicitly respect Roths completed evidence handoff');

const restoredSteinContext = {
  caseSetup: { klient: setup.klient, opfer: setup.opfer },
  normForMatch: (value) => String(value || '').toLowerCase(),
  engineCurrentLocation: { name: 'Margarete Steins Wohnung' },
  _aktTageszeitName: () => 'Nacht',
  diag: () => {},
};
vm.createContext(restoredSteinContext);
vm.runInContext(
  sourceOf('sanitizeProsaMetadaten') + '\n' + sourceOf('repairBasicGermanProse'),
  restoredSteinContext,
);
const restoredWrongBrille = {
  type: 'scene',
  ort: 'Margarete Steins Wohnung',
  time: 'Nacht',
  text: 'Ihre Brille rutscht ihr dabei von der Nase, baumelt an einem Bügel. Ihre Augen hinter den Gläsern wirken verweint.',
};
assert.strictEqual(restoredSteinContext.repairBasicGermanProse(restoredWrongBrille), true,
  'an already saved Stein scene must be migrated on restore');
assert(!/Brille rutscht|hinter den Gläsern/.test(restoredWrongBrille.text),
  'saved prose must share the broken-glasses truth after reload');
const restoredWahlerArrival = {
  type: 'scene',
  ort: 'Reichsbahndirektion Mitte',
  time: 'Vormittag',
  text: 'Wahler ist nicht in seinem Büro, doch in dem kargen Vorraum mit dem schweren Schreibtisch aus dunklem Holz fällt dein Blick auf die Ablage für die ausgehenden Dienstposten. IM "Anker" tritt durch die Tür.',
};
assert.strictEqual(restoredSteinContext.repairBasicGermanProse(restoredWahlerArrival), true,
  'the restored Reichsbahn arrival must align Wahler with the engine roster and group image');
assert(/Direktor Wahler steht hinter dem schweren Schreibtisch/.test(restoredWahlerArrival.text)
    && !/Wahler ist nicht/.test(restoredWahlerArrival.text),
  'Reichsbahn prose, UI roster and Wahler/Anker image must share one cast truth');
restoredSteinContext.caseProgress = { evidenceSecured: true };
const restoredLateFinale = {
  type: 'scene',
  ort: 'Bahnhof Friedrichstraße',
  time: 'Vormittag',
  text: 'Du blickst auf die Unterlagen in deinen Händen. Die Frachtlisten mit dem Reichsbahn-Stempel und die belastenden Aussagen sind eindeutig.',
};
assert.strictEqual(restoredSteinContext.repairBasicGermanProse(restoredLateFinale), true,
  'a saved pre-fix Stein finale must be migrated on restore');
assert(/Roth bereits gesichert|bei Roth gesicherten Frachtlisten/.test(restoredLateFinale.text)
    && !/Unterlagen in deinen Händen/.test(restoredLateFinale.text),
  'restored finale prose must preserve the completed Roth handoff');

restoredSteinContext.caseProgress = {
  gefundeneIndizIds: ['original_akten', 'wahler_unterschrift'],
  evidenceSecured: true,
  evidenceSecuredAt: 'vera',
  clientSecured: true,
  clientSecuredAt: 'grenze',
  clientState: { status: 'secured', securedAt: 'grenze' },
};
restoredSteinContext.engineCurrentLocation = { name: 'Bahnhof Friedrichstraße' };
const restoredBorderHandoff = {
  type: 'scene',
  ort: 'Bahnhof Friedrichstraße',
  time: 'Abend',
  text: 'Du packst Margarete am Arm. Sie murmelt von den Frachtlisten in ihrem Koffer. Du musst sie jetzt durchbringen, bevor der nächste Streifengang den Weg versperrt.',
};
assert.strictEqual(restoredSteinContext.repairBasicGermanProse(restoredBorderHandoff), true,
  'a completed border security action must replace a model scene that still describes only the attempt');
assert(/Ihr geht gemeinsam hinüber/.test(restoredBorderHandoff.text)
    && /bestätigter Westkontakt/.test(restoredBorderHandoff.text)
    && /Originalakten sind bereits bei Vera Lindqvist/.test(restoredBorderHandoff.text)
    && /tatsächlich außer Reichweite/.test(restoredBorderHandoff.text)
    && !/Du musst sie jetzt durchbringen|Frachtlisten in ihrem Koffer/.test(restoredBorderHandoff.text),
  'border prose must confirm the physical crossing and preserve the earlier Vera handoff');

restoredSteinContext.engineCurrentLocation = { name: 'West-Berliner Auffangstelle' };
const restoredNightArrival = {
  type: 'scene',
  ort: 'West-Berliner Auffangstelle',
  time: 'Nacht',
  text: 'Das Lager liegt in der aufgehenden Sonne. Erst mit diesem Hinweis gilt Vera für Karl als bekannter und belastbarer Sicherungsweg. Verwaltungsangestellter bleibt sichtbar in deiner Nähe und verfolgt die Untersuchung schweigend.',
};
restoredSteinContext.repairBasicGermanProse(restoredNightArrival);
assert(/Lagerlaternen/.test(restoredNightArrival.text)
    && /kennst du Vera/.test(restoredNightArrival.text)
    && /Der Verwaltungsangestellte/.test(restoredNightArrival.text)
    && !/aufgehenden Sonne|für Karl|^Verwaltungsangestellter/m.test(restoredNightArrival.text),
  'Stein restore repair must align night light, second-person prose and natural NPC narration');

restoredSteinContext.engineCurrentLocation = { name: 'Café Kranzler' };
const restoredVeraKnowledge = {
  type: 'scene',
  ort: 'Café Kranzler',
  time: 'Mittag',
  text: 'Doch sie zögert: Sie braucht die Original-Akten physisch, um die Echtheit zu belegen. Sie weiß, dass sie in Schöneweide versteckt sind.',
};
restoredSteinContext.repairBasicGermanProse(restoredVeraKnowledge);
assert(/im Stellwerk geborgene Mappe/.test(restoredVeraKnowledge.text)
    && /bis zu einer ausdrücklichen Übergabe/.test(restoredVeraKnowledge.text)
    && !/in Schöneweide versteckt/.test(restoredVeraKnowledge.text),
  'Vera must acknowledge originals already recovered but not yet handed over');

restoredSteinContext.engineCurrentLocation = { name: 'Margarete Steins Wohnung' };
const restoredBrokenGlasses = {
  type: 'scene',
  ort: 'Margarete Steins Wohnung',
  time: 'Nacht',
  text: 'Margarete Stein lässt den Türrahmen los und sackt leicht zusammen, ihre Brille rutscht auf die Nasenspitze.',
};
restoredSteinContext.repairBasicGermanProse(restoredBrokenGlasses);
assert(/zerbrochene Drahtgestellbrille auf dem Tisch/.test(restoredBrokenGlasses.text)
    && !/Brille rutscht auf die Nasenspitze/.test(restoredBrokenGlasses.text),
  'Margarete must not put the already broken glasses back on after the opening confrontation');

const custodyItemContext = {};
vm.createContext(custodyItemContext);
vm.runInContext(sourceOf('repairCustodyChosenItemContinuity'), custodyItemContext);
const missingStinkbombCustody = {
  type: 'scene',
  ort: 'MfS-Untersuchungshaftanstalt Hohenschoenhausen',
  gewahrsam: true,
  text: 'Zwei Männer in unscheinbaren Mänteln schneiden dir den Weg ab. Man bringt dich in Zelle 14.',
};
assert.strictEqual(custodyItemContext.repairCustodyChosenItemContinuity(
  missingStinkbombCustody,
  'Stinkbombe im Blechmantel - IM "Anker"'
), true, 'saved custody prose must recover the chosen Stinkbombe action');
assert(/Stinkbombe/.test(missingStinkbombCustody.text)
    && /Beißender Qualm/.test(missingStinkbombCustody.text)
    && /absurd kurzen Vorteil/.test(missingStinkbombCustody.text),
  'the recovered Stinkbombe beat must be concrete, slapstick-capable and consequence-preserving');
assert(sourceOf('performApiCall').includes('stinkbombe|stink bombe|blechmantel'),
  'future deterministic custody entries must narrate the selected Stinkbombe before the arrest');

const evidenceGateDiagnostics = [];
const evidenceGateContext = {
  caseSetup: {
    setupCast: [wahler],
  },
  caseProgress: {
    gefundeneIndizIds: [],
  },
  engineCurrentLocation: {
    name: 'Margarete Steins Wohnung',
  },
  getCaseLocations: () => setup.locations,
  _npcOrtsbindungEintragAktiv: () => true,
  _npcWurdeSchonAngesprochen: () => false,
  diag: (type, message) => evidenceGateDiagnostics.push(type + ':' + message),
};
vm.createContext(evidenceGateContext);
vm.runInContext(
  sourceOf('normForMatch') + '\n'
    + sourceOf('_findEvidenceGatedNpcKnowledgeLeak') + '\n'
    + sourceOf('repairEvidenceGatedNpcProse'),
  evidenceGateContext,
);
const prematureWahler = {
  szene: 'Du nennst keine Namen und erwähnst beiläufig Wahler. Der Mann im Mantel tritt zurück.',
  personenImRaum: ['Margarete Stein', 'Mann im langen Mantel'],
};
const prematureLeak = evidenceGateContext._findEvidenceGatedNpcKnowledgeLeak(prematureWahler);
assert(prematureLeak && prematureLeak.code === 'evidence_gated_npc_knowledge_leak',
  'world-truth validation must reject Wahler before his evidence or encounter');
evidenceGateContext.repairEvidenceGatedNpcProse(prematureWahler);
assert(!/Wahler/.test(prematureWahler.szene) && /Mann im Mantel/.test(prematureWahler.szene),
  'the final repair boundary must remove only the unearned Wahler sentence');
assert(evidenceGateDiagnostics.some((line) => line.includes('BELEG-GATE repariert')),
  'premature identity repair needs an exported diagnostic');

evidenceGateContext.engineCurrentLocation = { name: 'Reichsbahndirektion Mitte' };
assert.strictEqual(
  evidenceGateContext._findEvidenceGatedNpcKnowledgeLeak({
    szene: 'Direktor Bernhard Wahler erwartet dich hinter seinem Schreibtisch.',
  }),
  null,
  'the configured personal encounter must reveal Wahler without prior evidence',
);
evidenceGateContext.engineCurrentLocation = { name: 'Margarete Steins Wohnung' };
evidenceGateContext.caseProgress.gefundeneIndizIds.push('margarete_aussage');
assert.strictEqual(
  evidenceGateContext._findEvidenceGatedNpcKnowledgeLeak({
    szene: 'Margarete nennt Direktor Bernhard Wahler als ihren Vorgesetzten.',
  }),
  null,
  'Margaretes found statement must unlock Wahler for later prose',
);

const securitySource = sourceOf('baueSicherungsButtons');
assert(/_veraBekannt/.test(securitySource)
    && /vera_uebergabekontakt/.test(securitySource)
    && /vera_westperspektive/.test(securitySource),
  'Vera handoff must require actual player knowledge');
assert(/const _sichernGefahr = !!karlInStasiCustody/.test(securitySource)
    && /GESPERRT · im MfS-Gewahrsam/.test(securitySource),
  'political security actions must be physically locked while Karl is in MfS custody');
assert(/caseSetup\.caseType === 'politisch' && caseProgress\.evidenceSecured/.test(
  sourceOf('getClientGeduldRequirement')),
  'client patience must not demand results after a political evidence handoff');
assert(/if \(keepExisting\)/.test(sourceOf('_naturalMinimumSceneText')),
  'rich prose must not receive generic room filler');
assert(/_npcWirklichInSzene/.test(sourceOf('_szenenbildAnwesenheitsVariante')),
  'image presence variants must also follow unequivocal scene prose');
const departureContext = {
  normForMatch: (value) => String(value || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
};
vm.createContext(departureContext);
vm.runInContext(sourceOf('_sceneNpcDepartureInfo'), departureContext);
assert(departureContext._sceneNpcDepartureInfo({
  szene: 'Mertens steckt die Brille ein, wendet sich ohne ein weiteres Wort ab. Die Bürotür fällt hinter ihm ins Schloss.',
}, 'oberleutnant_mertens', 'Oberleutnant Mertens'),
  'a named turn-away must remove Mertens from the following UI and image');
assert(departureContext._sceneNpcDepartureInfo({
  szene: 'Vera steht auf und verliert sich zwischen den anderen Gästen in Richtung Kurfürstendamm.',
}, 'vera_lindqvist', 'Vera Lindqvist'),
  'Vera leaving the cafe crowd must remove her from the following UI and image');
const departedVisualContext = {
  normForMatch: (value) => String(value || '').toLowerCase().replace(/_/g, ' '),
  getNpcsAtCurrentLocation: () => [{ id: 'margarete_stein', name: 'Margarete Stein' }],
  _konfrontationInAktuellerSzeneSichtbar: () => false,
  _npcWirklichInSzene: () => true,
  _npcNachProsaAbgangAbwesend: (id) => /mann im mantel/.test(String(id || '').replace(/_/g, ' ')),
  _npcZustandGet: () => null,
  _npcZustandIstEntfernt: () => false,
};
vm.createContext(departedVisualContext);
vm.runInContext(sourceOf('_szenenbildAnwesenheitsVariante'), departedVisualContext);
const steinApartmentVisual = {
  file: 'margarete-stein-wohnung.webp',
  presenceVariants: [{
    id: 'mann_im_mantel',
    file: 'margarete-wohnung-mantel-night.png',
  }],
};
assert.strictEqual(
  departedVisualContext._szenenbildAnwesenheitsVariante(steinApartmentVisual, {
    szene: 'Der Mann im Mantel wendet sich ab. Seine Schritte hallen im Treppenhaus, bis die Haustür ins Schloss fällt.',
    personenImRaum: ['Margarete Stein'],
  }).file,
  'margarete-stein-wohnung.webp',
  'a departed opponent mentioned in the farewell prose must not remain in the follow-up image',
);
departedVisualContext.caseProgress = {
  clientSecured: false,
  clientState: { status: 'left_behind' },
  politicalBeatsHit: ['margarete_gesichert'],
};
departedVisualContext._istKlient = (value) => /margarete/.test(String(value || ''));
departedVisualContext._npcWirklichInSzene = () => true;
departedVisualContext.clientProfile = { id: 'margarete_stein', name: 'Margarete Stein' };
const friedrichstrasseVisual = {
  file: 'sbahnhof-friedrichstrasse.webp',
  presenceVariants: [{
    id: 'margarete_stein',
    file: 'friedrichstrasse-margarete-day.png',
  }],
};
assert.strictEqual(
  departedVisualContext._szenenbildAnwesenheitsVariante(friedrichstrasseVisual, {
    szene: 'Oberleutnant Mertens lehnt am Kotflügel und stellt Karl am Bahnsteig.',
    personenImRaum: ['Oberleutnant Mertens'],
  }).file,
  'sbahnhof-friedrichstrasse.webp',
  'the rescued client must not remain in the later Mertens showdown image',
);
const markEvidenceSource = sourceOf('_markiereIndizGefunden');
assert(/ind\.politicalBeatIds/.test(markEvidenceSource)
    && /gueltigePolitBeats/.test(markEvidenceSource)
    && /POLIT-BEAT/.test(markEvidenceSource),
  'core evidence must book political insight beats by ID');
assert(/beat\.id !== 'akten_gesichert'/.test(markEvidenceSource)
    && /beat\.id !== 'margarete_gesichert'/.test(markEvidenceSource),
  'deterministic clue booking must protect action-only security beats');

const enemyContext = {
  normForMatch: (value) => String(value || '').toLowerCase().replace(/_/g, ' '),
};
vm.createContext(enemyContext);
vm.runInContext(sourceOf('_gegnerProfilDefault'), enemyContext);
const ankerProfile = enemyContext._gegnerProfilDefault({
  id: 'im_anker',
  name: 'IM "Anker"',
  tag: 'STASI',
  rolle: 'Inoffizieller Mitarbeiter',
});
assert.strictEqual(ankerProfile.kampf.waffe, 'Amtsdruck / Faustschlag',
  'the timid unarmed IM Anker must not inherit a phantom service pistol');
assert.strictEqual(ankerProfile.kampf.gefahr, 1,
  'IM Anker must remain less dangerous than an armed MfS officer');
assert(html.includes('cafe-kranzler-vera-day-v1739.png')
    && html.includes('karl-mauers-buero-mertens-only-day-v1739.png')
    && html.includes('Karl Mauer trifft Margarete Stein in ihrer von Reichsbahn-Unterlagen durchsuchten Wohnung'),
  'Stein scene images must explicitly match Vera, Mertens and Margarete presence');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1770 +SchifferLiveTruth'"),
  'release version is stale');
assert(html.includes('Vom Hackeschen Markt dringen gedämpfte Motorengeräusche')
    && html.includes('Noch passt nicht jedes Stück zusammen'),
  'Stein office arrival fallback must be a complete narrative scene, not two dry instruction-like sentences');

console.log('STEIN_FLOW_OK');
