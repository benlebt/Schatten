const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sourceOf(name) {
  const start = html.indexOf('function ' + name + '(');
  assert(start >= 0, 'missing function ' + name);
  let depth = 0;
  let opened = false;
  for (let i = start; i < html.length; i += 1) {
    if (html[i] === '{') { depth += 1; opened = true; }
    else if (html[i] === '}') {
      depth -= 1;
      if (opened && depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('unterminated function ' + name);
}

const introStart = html.indexOf('const INTRO_VARIANTS = [');
const introEnd = html.indexOf('\n];', introStart);
assert(introStart >= 0 && introEnd > introStart, 'INTRO_VARIANTS block missing');
const introContext = { INTRO_REQUIREMENTS: '' };
vm.createContext(introContext);
vm.runInContext(
  html.slice(introStart, introEnd + 3).replace('const INTRO_VARIANTS =', 'INTRO_VARIANTS ='),
  introContext
);
const wegener = Array.from(introContext.INTRO_VARIANTS).find((entry) =>
  entry && entry.setup && /Konstantin Wegener/.test(entry.setup.tat || '')
);
assert(wegener, 'Wegener setup missing');
const setupText = JSON.stringify(wegener.setup);
assert(/6\. Februar 1953/.test(setupText), 'Wegener disappearance must use a fixed calendar date');
assert(!/vor 6 Tagen/.test(setupText), 'Wegener setup must not freeze a relative six-day phrase');
assert(/setzt sich zu dir/.test(wegener.prompt),
  'Schiele must visibly arrive before the opening scene exposes him as clickable');
assert(!/Ein anderer Mann am Tresen|wirft dir wiederholt Blicke zu/.test(wegener.prompt)
  && /Erfinde keinen beobachtenden Mann mit grauem Hut/.test(wegener.prompt),
  'Wegener opening must explicitly bar the former unrostered grey-hat observer');
assert(/Rita arbeitet als Kellnerin/.test(wegener.prompt),
  'opening prompt must preserve Rita as the waitress rather than a duplicate landlady');
const wegenerOpening = Array.from(wegener.setup.locations).find((loc) =>
  loc && loc.name === 'Eckkneipe Zum Goldenen Anker'
);
assert(wegenerOpening && wegenerOpening.openingFallbackRequired === true,
  'Wegener must use the authored opening instead of softening dates and Schieles price');
assert(/vor zwei Tagen/.test(wegenerOpening.openingFallbackText)
  && /6\. Februar/.test(wegenerOpening.openingFallbackText)
  && /15 Ostmark/.test(wegenerOpening.openingFallbackText),
  'the required Wegener opening must retain commission timing, disappearance date and informant price');
const greyHat = Array.from(wegener.setup.setupCast).find((npc) => npc && npc.id === 'mann_grauer_hut');
assert.strictEqual(greyHat, undefined, 'Wegener must not contain a wandering anonymous grey-hat observer');
const rudi = Array.from(wegener.setup.setupCast).find((npc) => npc && npc.id === 'rudi_menzel');
assert(rudi && rudi.name === 'Rudi Menzel', 'the warehouse-route witness needs a named setup identity');
assert.strictEqual(wegener.setup.targetResolution.rescueRequired, true, 'Wegener must require an explicit physical rescue');
assert.strictEqual(wegener.setup.targetResolution.deliveryRequired, true, 'Wegener must require a safe handoff after rescue');
assert.deepStrictEqual(
  Array.from(wegener.setup.targetResolution.safeLocations),
  ['Wegener-Wohnung', 'Volkspolizei-Revier Hans-Beimler-Strasse'],
  'Wegener must expose both requested handoff routes'
);
assert.strictEqual(wegener.setup.targetResolution.guard, 'lothars_bewacher', 'Wegener rescue must name its blocking guard');
assert.strictEqual(wegener.setup.targetResolution.visualStates.guardRestrainedAtTarget.file,
  'lagerhalle-spree-kratz-gefesselt.webp',
  'a handcuffed but conscious Kratz needs a distinct warehouse visual');
assert(fs.existsSync(path.join(
  __dirname,
  '..',
  wegener.setup.targetResolution.visualStates.guardRestrainedAtTarget.root,
  wegener.setup.targetResolution.visualStates.guardRestrainedAtTarget.file
)), 'the restrained-Kratz warehouse image must exist');
assert.strictEqual(wegener.setup.targetResolution.visualStates.guardDownAtTarget.dayFile,
  'lagerhalle-spree-kratz-ko-day.webp',
  'Wegener must expose a daytime visual with incapacitated Kratz on the floor');
assert.strictEqual(wegener.setup.targetResolution.visualStates.guardRemovedAtTarget.file,
  'lagerhalle-spree-kratz-abgefuehrt.webp',
  'Wegener must expose a post-custody visual without Kratz');
const guard = Array.from(wegener.setup.setupCast).find((npc) => npc && npc.id === 'lothars_bewacher');
assert(guard && guard.name === 'Erwin Kratz', 'warehouse guard needs one clear, persistent identity');
const warehouse = Array.from(wegener.setup.locations).find((loc) => loc && loc.name === 'Lagerhalle an der Spree');
assert(warehouse, 'Wegener warehouse finale missing');
assert(Array.from(warehouse.npcs || []).some((npc) => npc && npc.id === 'lothars_bewacher'), 'warehouse guard NPC missing');
const warehouseGuardBinding = Array.from(warehouse.npcs || []).find((npc) => npc && npc.id === 'lothars_bewacher');
assert.strictEqual(warehouseGuardBinding.wegWennZielpersonGeborgen, true,
  'the guard location binding must end once Konstantin has been rescued');
const guardThreat = Array.from(warehouse.bedrohungen || []).find((threat) => threat && threat.id === 'lothars_bewacher');
assert(guardThreat && guardThreat.chance === 100 && guardThreat.unausweichlich === true, 'warehouse guard confrontation must be guaranteed');
const hinterhof = Array.from(wegener.setup.locations).find((loc) => loc && loc.name === 'Hinterhof Spreestrasse');
assert(/kein Wagen im Hof/.test(hinterhof.detail)
  && /Im Hof selbst steht kein Wagen/.test(hinterhof.arrivalFallbackText),
  'the Hinterhof setup must preserve the fixed image without an invented EMW');
const rudiClue = hinterhof && Array.from(hinterhof.indizien || []).find((clue) => clue && clue.id === 'lagerhalle_hinweis');
assert(rudiClue && rudiClue.quelle === 'person' && rudiClue.npc === 'rudi_menzel',
  'Rudi must personally disclose the warehouse route instead of turning into an environment notebook');
assert(!Array.from(rudiClue.actions || []).includes('ERKUNDEN'),
  'the named witness clue must not be collectable as an unrelated search');
assert(rudiClue.fundText && /Backsteinhalle direkt an der Spree/.test(rudiClue.fundText),
  'Rudi needs a dramatized deterministic disclosure instead of a dry summary');
const lotharClue = hinterhof && Array.from(hinterhof.indizien || []).find((clue) => clue && clue.id === 'lothar_schluessel');
assert(lotharClue && lotharClue.fundText
  && /Lothar bleibt im Hinterhof/.test(lotharClue.fundText)
  && /Erwin Kratz bewacht ihn/.test(lotharClue.fundText),
  'Lothar disclosure must preserve location, roster and named guard');
assert(lotharClue.prosaPflicht
  && lotharClue.prosaPflicht.replaceOnFallback === true
  && lotharClue.prosaPflicht.narrativ.test(lotharClue.fundText)
  && /Erwin Kratz/.test(lotharClue.prosaPflicht.fallbackProse),
  'Lothar clue prose must be replaced when it contradicts the mechanically awarded disclosure');
assert(Array.from(wegener.setup.keyClues).some((clue) =>
  /keinen physischen Schluessel/.test(clue)
), 'Wegener key clues must explicitly prevent the invented warehouse key');
for (const locationName of [
  'Wegener-Wohnung',
  'Werft VEB Koepenick',
  'Hinterhof Spreestrasse',
  'Lagerhalle an der Spree'
]) {
  const location = Array.from(wegener.setup.locations).find((entry) => entry && entry.name === locationName);
  assert(location && location.arrivalFallbackText,
    `${locationName} needs authored arrival prose instead of a dry engine template`);
}
const wageClue = Array.from(wegener.setup.locations)
  .find((location) => location && location.name === 'Wegener-Wohnung').indizien[0];
assert(wageClue.fundText && /kein erfundener Verfolger/.test(wageClue.fundText),
  'the wage-slip scene must not invent an unrostered door threat that blocks travel');
assert(html.includes("if (!hasNewViolence) {")
  && html.includes('alte Wunden und unsichtbarer Schaden zaehlen nicht'),
  'high tension alone must not reduce health without a new injury event');
const clientHandoffVisual = wegener.setup.targetResolution.visualStates.clientHandoff;
assert(clientHandoffVisual
  && clientHandoffVisual.dayFile === 'wegener-wohnung-wiedervereinigung-day.webp'
  && clientHandoffVisual.nightFile === 'wegener-wohnung-wiedervereinigung-night.webp',
  'Wegener family handoff needs a dedicated day/night visual');
for (const file of [clientHandoffVisual.dayFile, clientHandoffVisual.nightFile]) {
  assert(fs.existsSync(path.join(__dirname, '..', clientHandoffVisual.root, file)),
    `Wegener family handoff image is missing: ${file}`);
}

const visualContext = {
  caseSetup: wegener.setup,
  caseProgress: { zielpersonGeborgen: false },
  engineCurrentLocation: { name: 'Lagerhalle an der Spree' },
  normForMatch: (value) => String(value || '').toLowerCase().trim(),
  _npcZustandGet: () => ({ status: 'benommen' })
};
vm.createContext(visualContext);
vm.runInContext(sourceOf('_physicalTargetSceneVisual'), visualContext);
assert.strictEqual(visualContext._physicalTargetSceneVisual().file, 'lagerhalle-spree-kratz-ko.webp',
  'an incapacitated Kratz must select the on-floor warehouse visual');
visualContext._npcZustandGet = () => ({ status: 'fixiert' });
assert.strictEqual(visualContext._physicalTargetSceneVisual().file, 'lagerhalle-spree-kratz-gefesselt.webp',
  'a conscious handcuffed Kratz must select the restrained warehouse visual');
visualContext._npcZustandGet = () => ({ status: 'uebergeben' });
assert.strictEqual(visualContext._physicalTargetSceneVisual().file, 'lagerhalle-spree-kratz-abgefuehrt.webp',
  'a handed-over Kratz must disappear from the warehouse visual');
visualContext._npcZustandGet = () => ({ status: 'beruhigt' });
assert.strictEqual(visualContext._physicalTargetSceneVisual().file, 'lagerhalle-spree-kratz-abgefuehrt.webp',
  'a peacefully departed Kratz must disappear from the warehouse visual');
visualContext.engineCurrentLocation = { name: 'Wegener-Wohnung' };
visualContext.caseProgress.zielpersonTransportStatus = 'im_opel';
assert.strictEqual(visualContext._physicalTargetSceneVisual().dayFile,
  'wegener-wohnung-wiedervereinigung-day.webp',
  'arrival with rescued Konstantin must show both spouses in the client apartment');
const currentVisualStates = visualContext.caseSetup.targetResolution.visualStates;
visualContext.caseSetup.targetResolution.visualStates = Object.assign({}, currentVisualStates);
delete visualContext.caseSetup.targetResolution.visualStates.clientHandoff;
assert.strictEqual(visualContext._physicalTargetSceneVisual().dayFile,
  'wegener-wohnung-wiedervereinigung-day.webp',
  'legacy Wegener saves without the new state entry must still show the family handoff');
visualContext.caseSetup.targetResolution.visualStates = currentVisualStates;
visualContext.engineCurrentLocation = { name: 'Lagerhalle an der Spree' };
visualContext.caseProgress.zielpersonGeborgen = true;
assert.strictEqual(visualContext._physicalTargetSceneVisual().file, 'lagerhalle-spree-gerettet.webp',
  'the rescued-target visual must take precedence after Konstantin is freed');

const normForMatch = (value) => String(value || '').toLowerCase().trim();
const continuityContext = {
  caseProgress: {
    npcMemory: {
      Schiele: [{ hinweis: 'Konstantin stritt am 6. Februar mit Lothar.' }],
      'Helga Wegener': [{ hinweis: 'Helga wartet in ihrer Wohnung auf Nachricht.' }]
    }
  },
  caseSetup: wegener.setup,
  normForMatch,
  sameNamedPerson: (a, b) => normForMatch(a) === normForMatch(b),
  _npcHatOffenenHinweis: () => true,
  _npcZustandGet: (name) => name === 'Lothar Schaefer'
    ? { status: 'ko', ort: 'Hinterhof Spreestrasse' }
    : null
};
vm.createContext(continuityContext);
vm.runInContext(sourceOf('buildNpcContinuityHint'), continuityContext);
const continuity = continuityContext.buildNpcContinuityHint([
  { id: 'schiele', name: 'Schiele', tag: 'INFORMANT' },
  { id: 'lothar_schaefer', name: 'Lothar Schaefer', tag: 'GANGSTER' }
]);
assert(continuity.includes('BEREITS ERZAEHLT'), 'remembered Schiele clue must enter the continuity prompt');
assert(continuity.includes('NIEMALS erneut als neue Enthuellung'), 'remembered clue must be barred from fresh disclosure');
assert(continuity.includes('OFFENER INFORMANTEN-HINWEIS'), 'paid clue must remain locked before the engine action');
assert(continuity.includes('Lothar Schaefer ist ko bei Hinterhof Spreestrasse'), 'Lothar physical state and location must persist');
assert(continuity.includes('Ein "Mann mit grauem Hut" existiert in diesem Fall NICHT'), 'continuity prompt must bar the removed duplicate observer');
assert(continuity.includes('einzige bewaffnete Bewacher in der Lagerhalle ist Erwin Kratz'), 'continuity prompt must preserve the named guard');
const konstantinContinuity = continuityContext.buildNpcContinuityHint([
  { id: 'konstantin_wegener', name: 'Konstantin Wegener', tag: 'ZIELPERSON' }
]);
assert(!konstantinContinuity.includes('Helga wartet in ihrer Wohnung'), 'Konstantin must never inherit Helga memory by surname');

const npcStateContext = {
  caseProgress: {},
  normForMatch,
  _npcZustandMap: () => ({
    'konstantin wegener': { name: 'Konstantin Wegener', status: 'frei', seitTag: 1, seitSzene: 1 },
    'oberleutnant mertens': { name: 'Oberleutnant Mertens', status: 'gefesselt', seitTag: 1, seitSzene: 1 }
  }),
  gameDay: 1,
  sceneCounter: 1,
  diag: () => {}
};
vm.createContext(npcStateContext);
vm.runInContext(sourceOf('_npcZustandGet'), npcStateContext);
assert.strictEqual(npcStateContext._npcZustandGet('Helga Wegener'), null, 'Helga must never inherit Konstantin state by surname');
assert.strictEqual(npcStateContext._npcZustandGet('Mertens').name, 'Oberleutnant Mertens', 'single-name title aliases must keep working');

const clientContext = {
  caseProgress: { clientGeduldErzaehltLevel: 0 },
  clientProfile: {
    name: 'Helga Wegener',
    geduldsstufe1: 3,
    geduldsstufe2: 4,
    geduldsstufe3: 5
  },
  gameDay: 3,
  getFallFristTage: () => 5,
  FALLFRIST_TAGE_DEFAULT: 5
};
vm.createContext(clientContext);
vm.runInContext(sourceOf('normalizeClientPatienceToDeadline'), clientContext);
vm.runInContext(sourceOf('getClientGeduldRequirement'), clientContext);
vm.runInContext(sourceOf('buildClientGeduldHint'), clientContext);
const reminder = clientContext.buildClientGeduldHint();
assert(reminder.includes('DIESER Szene'), 'due client reminder must be immediate');
assert(reminder.includes('"klient_kontakt":"mahnung"'), 'reminder must demand structured acknowledgement');
clientContext.caseProgress.clientGeduldErzaehltLevel = 1;
assert.strictEqual(clientContext.buildClientGeduldHint(), '', 'acknowledged reminder must not repeat');
clientContext.gameDay = 4;
assert(clientContext.buildClientGeduldHint().includes('"klient_kontakt":"warnung"'), 'next patience level must still fire');
clientContext.gameDay = 5;
clientContext.caseProgress.clientGeduldErzaehltLevel = 2;
clientContext.normForMatch = normForMatch;
clientContext.diag = () => {};
vm.runInContext(sourceOf('enforceClientGeduldScene'), clientContext);
const forcedPatienceScene = { szene: 'Karl prüft die Akte.', klient_kontakt: '' };
const forcedRequirement = clientContext.enforceClientGeduldScene(forcedPatienceScene);
assert(forcedRequirement && forcedRequirement.level === 3, 'last patience warning must be engine-enforced');
assert.strictEqual(forcedPatienceScene.klient_kontakt, 'letzte_warnung', 'engine warning must set the structured marker');
assert(forcedPatienceScene.szene.includes('Helga Wegener'), 'engine warning must visibly name the real client');
assert(!/Auftrag beendet/.test(forcedPatienceScene.szene), 'last-chance warning must not accidentally match the firing detector');
clientContext.engineCurrentLocation = { name: 'Stallschreiberstrasse 12' };
clientContext._abschlussOrtOhneFestesTelefon = () => true;
clientContext.getNpcsAtCurrentLocation = () => [];
clientContext.gameDay = 5;
clientContext.caseProgress.clientGeduldErzaehltLevel = 2;
const deferredHint = clientContext.buildClientGeduldHint();
assert(deferredHint.includes('KEINE Sofortnachricht')
  && !deferredHint.includes('"klient_kontakt":"letzte_warnung"'),
  'a warehouse without a client or telephone must defer patience contact instead of demanding impossible instant communication');
const warehousePatienceScene = { ort: 'Stallschreiberstrasse 12', szene: 'Karl sichert das Etui.', personenImRaum: [], klient_kontakt: '' };
assert.strictEqual(clientContext.enforceClientGeduldScene(warehousePatienceScene), null,
  'the engine must not append an impossible client message inside a remote warehouse');
assert.strictEqual(warehousePatienceScene.klient_kontakt, '',
  'deferred patience must remain pending for the next plausible contact location');
assert(!warehousePatienceScene.szene.includes('kurze Nachricht'),
  'the exact live vague instant-message prose must not be injected at an isolated crime scene');
delete clientContext._abschlussOrtOhneFestesTelefon;
delete clientContext.engineCurrentLocation;
delete clientContext.getNpcsAtCurrentLocation;
clientContext.gameDay = 3;
clientContext.caseProgress.clientGeduldErzaehltLevel = 0;
clientContext.caseProgress.zielpersonTransportStatus = 'bei_klient';
const reunionScene = {
  szene: 'Helga nimmt Konstantin erleichtert in Empfang.',
  personenImRaum: ['Helga Wegener', 'Konstantin Wegener'],
  klient_kontakt: ''
};
clientContext.enforceClientGeduldScene(reunionScene);
assert.strictEqual(reunionScene.klient_kontakt, 'mahnung',
  'physical delivery must satisfy the due client contact structurally');
assert(!/Wo bleiben die versprochenen Ergebnisse|kurze Nachricht/.test(reunionScene.szene),
  'family reunion must not receive a contradictory patience message');

const overnightContext = {
  normForMatch,
  engineCurrentLocation: { name: 'Werft VEB Koepenick' }
};
vm.createContext(overnightContext);
vm.runInContext(sourceOf('_findUnchosenOvernightDrift'), overnightContext);
assert(overnightContext._findUnchosenOvernightDrift({
  szene: 'Du hast die Nacht nicht geschlafen, nur kurz auf deinem Sofa gedöst, während Helga im Schlafzimmer blieb.'
}, { id: 'REISE', text: 'Fahr zur Werft', _istReise: true }),
  'travel must reject an invented shared overnight stay');
assert.strictEqual(overnightContext._findUnchosenOvernightDrift({
  szene: 'Du fährst ohne Pause durch das erste Morgenlicht zur Werft.'
}, { id: 'REISE', text: 'Fahr zur Werft', _istReise: true }), null,
  'ordinary awake travel across a time-slot boundary must remain valid');

const ownershipContext = {
  normForMatch,
  caseSetup: wegener.setup,
  caseProgress: {
    reiseLog: [{ von: 'Wegener-Wohnung', ziel: 'Werft VEB Koepenick' }]
  },
  engineCurrentLocation: { name: 'Werft VEB Koepenick' }
};
vm.createContext(ownershipContext);
vm.runInContext(sourceOf('_findWrongHomeOwnershipDrift'), ownershipContext);
const wrongHome = ownershipContext._findWrongHomeOwnershipDrift({
  szene: 'Du lässt Helga in deiner Wohnung zurück und fährst zur Werft.'
}, { id: 'REISE', text: 'Fahr zur Werft', _istReise: true });
assert(wrongHome && wrongHome.code === 'wrong_home_ownership',
  'travel from a client apartment must reject calling it Karls apartment');
assert.strictEqual(ownershipContext._findWrongHomeOwnershipDrift({
  szene: 'Du lässt Helga in ihrer Wohnung zurück und fährst zur Werft.'
}, { id: 'REISE', text: 'Fahr zur Werft', _istReise: true }), null,
  'correct client-apartment ownership must remain valid');

const worldTruthHasAlias = (text, aliases) => {
  const n = normForMatch(text).replace(/_/g, ' ');
  return Array.from(aliases || []).some((alias) => n.includes(normForMatch(alias).replace(/_/g, ' ')));
};
const worldTruthAliases = (id, entry) => [
  id,
  entry && entry.id,
  entry && entry.name
].filter(Boolean);
const arrivalContext = {
  caseSetup: wegener.setup,
  caseProgress: {
    stage: 3,
    zielpersonTransportStatus: 'im_opel',
    zielpersonInBegleitung: true
  },
  engineCurrentLocation: { name: 'Wegener-Wohnung' },
  gameTimeIdx: 0,
  TIMES_OF_DAY: ['NACHT'],
  normForMatch,
  getNpcsAtCurrentLocation: () => [],
  getCaseLocations: () => wegener.setup.locations,
  _npcOrtsbindungEintragAktiv: () => true,
  _npcAbkoemmlich: () => false,
  _npcZustandIstEntfernt: () => false,
  _resolveNpcIdentity: (id) => Array.from(wegener.setup.setupCast).find((entry) => entry.id === id),
  _worldTruthHasAlias: worldTruthHasAlias,
  _worldTruthAliases: worldTruthAliases
};
vm.createContext(arrivalContext);
vm.runInContext(sourceOf('_findArrivalNpcRosterDrift'), arrivalContext);
const handoffArrivalProblem = arrivalContext._findArrivalNpcRosterDrift({
  szene: 'Helga öffnet die Wohnungstür und starrt dich an.',
  personenImRaum: ['Helga Wegener']
}, { id: 'REISE', text: 'Fahr zur Wegener-Wohnung', _istReise: true });
assert(handoffArrivalProblem
  && Array.from(handoffArrivalProblem.missingProse).includes('Konstantin Wegener')
  && Array.from(handoffArrivalProblem.missingRoster).includes('Konstantin Wegener'),
  'a rescued physical target must be named in prose and roster on handoff arrival');

const phantomCompanionContext = {
  caseSetup: wegener.setup,
  caseProgress: {},
  engineCurrentLocation: { name: 'Hinterhof Spreestrasse' },
  normForMatch,
  getNpcsAtCurrentLocation: () => [{ id: 'lothar_schaefer', name: 'Lothar Schaefer' }],
  _worldTruthHasAlias: worldTruthHasAlias,
  _worldTruthAliases: worldTruthAliases
};
vm.createContext(phantomCompanionContext);
vm.runInContext(sourceOf('_splitWorldTruthSentences'), phantomCompanionContext);
vm.runInContext(sourceOf('_findUnrosteredPresentActor'), phantomCompanionContext);
const phantomCompanion = phantomCompanionContext._findUnrosteredPresentActor({
  szene: 'Lothars Blick huscht zu dem Mann mit der Lederjacke, der sich bedrohlich aufbaut. Sein Begleiter schlägt dir gegen die Schläfe.',
  personenImRaum: ['Lothar Schaefer']
}, { id: 'BEDROHEN' }, wegener.setup);
assert(phantomCompanion && phantomCompanion.code === 'unrostered_present_actor',
  'a rostered suspect must not legitimize an invented anonymous attacker');

const socialFallbackContext = { normForMatch };
vm.createContext(socialFallbackContext);
vm.runInContext(sourceOf('_worldTruthNaturalSocialFallbackText'), socialFallbackContext);
const socialFallback = socialFallbackContext._worldTruthNaturalSocialFallbackText(
  'Lothar Schäfer',
  { id: 'STELLE_ZUR_REDE', text: 'Stelle zur Rede' },
  'social_target_missing'
);
assert(/^Du wendest dich/.test(socialFallback) && !/\bKarl\b/.test(socialFallback),
  'deterministic social fallback prose must preserve the established Du perspective');

assert(
  html.includes("['gefesselt', 'ko', 'fixiert', 'benommen'].indexOf(z.status) !== -1 && !_gleicherOrt"),
  'all incapacitated states must be filtered away from foreign locations'
);
const bindingSource = sourceOf('_npcOrtsbindungEintragAktiv');
assert(bindingSource.includes('entry.wegWennZielpersonGeborgen')
  && bindingSource.includes('caseProgress.zielpersonGeborgen'),
  'location bindings must support departure after a physical target rescue');
const localNpcSource = sourceOf('getNpcsAtCurrentLocation');
assert(localNpcSource.includes('resolution.guard')
  && localNpcSource.includes('caseProgress.zielpersonGeborgen')
  && localNpcSource.includes('Nach einer gelungenen physischen Rettung'),
  'the final NPC roster pass must not re-inject a rescued target guard');
const worldTruthSource = sourceOf('validateSceneWorldTruth');
assert(worldTruthSource.includes("code: 'wegener_hinterhof_vehicle_invented'")
  && worldTruthSource.includes("code: 'healthy_karl_injury_invented'")
  && worldTruthSource.includes('nachgeschmack'),
  'world-truth validation must reject the observed vehicle, healthy-injury and sober-alcohol drifts');
const repairHintSource = sourceOf('buildWorldTruthRepairHint');
assert(repairHintSource.includes("problem.code === 'wegener_hinterhof_vehicle_invented'")
  && repairHintSource.includes("problem.code === 'healthy_karl_injury_invented'"),
  'world-truth retries need explicit Wegener image and full-health repair instructions');
const fallbackSource = sourceOf('enforceSceneWorldTruthFallback');
assert(fallbackSource.includes("problem.code === 'wegener_hinterhof_vehicle_invented'")
  && fallbackSource.includes("problem.code === 'healthy_karl_injury_invented'"),
  'exhausted world-truth retries need deterministic Wegener and health fallbacks');
const languageContext = {};
vm.createContext(languageContext);
vm.runInContext(sourceOf('stripAccidentalNarrativeQuotes'), languageContext);
vm.runInContext(sourceOf('fixSprache'), languageContext);
assert.strictEqual(languageContext.fixSprache('Sie klammert sich an dich wie ein Ertrinkende.'),
  'Sie klammert sich an dich wie eine Ertrinkende.',
  'the observed Wegener gender error must be normalized');
assert(html.includes('"klient_kontakt": ""'), 'scene schema must expose client-contact acknowledgement');
assert(html.includes('NPC-Hinweis-Wiederholung verworfen'), 'duplicate NPC-memory entries must be rejected');

console.log('WEGENER_CONTINUITY_OK');
