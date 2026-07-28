const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sourceOf(name) {
  const start = html.indexOf(`function ${name}(`);
  assert(start >= 0, `${name} missing`);
  let brace = html.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let i = brace; i < html.length; i++) {
    const ch = html[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      continue;
    }
    if (ch === '{') depth++;
    if (ch === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`${name} end missing`);
}

for (const file of [
  'assets/scenes/hollenbeck/datscha-mueggelsee-faber-day.png',
  'assets/scenes/hollenbeck/datscha-mueggelsee-faber-night.png',
  'assets/scenes/hollenbeck/datscha-mueggelsee-faber-gone-day-v1633.png',
  'assets/scenes/hollenbeck/datscha-mueggelsee-faber-gone-night-v1633.png',
  'assets/scenes/hollenbeck/disconto-bank-wegner-day.png',
  'assets/scenes/hollenbeck/disconto-bank-brehme-confrontation-day.png',
  'assets/scenes/hollenbeck/polizeirevier-hardenbergstrasse-hollenbeck-handoff-day.png',
  'assets/scenes/hollenbeck/polizeirevier-hardenbergstrasse-hollenbeck-handoff-night.png'
]) {
  assert(fs.existsSync(path.join(__dirname, '..', file)), `Lindner visual missing: ${file}`);
}

assert(html.includes("file: 'datscha-mueggelsee-faber-night.png'"),
  'Datscha must use the visual that depicts Leutnant Ingrid Faber instead of a male guard');
assert(html.includes("guardRemovedAtTarget: {")
    && html.includes("file: 'datscha-mueggelsee-faber-gone-night-v1633.png'")
    && html.includes("depictsNpcs: ['friedrich_hollenbeck']"),
  'the Datscha must switch to a guard-free image while Hollenbeck is still bound');
assert(html.includes("alt: 'Szenenbild: Friedrich Hollenbeck sitzt gefesselt in der Datscha"),
  'Datscha image alternative text must name both Hollenbeck and Faber');
assert(html.includes("{ id: 'friedrich_hollenbeck', immer: true, abStage: 3 }")
    && html.includes("{ id: 'leutnant_faber', immer: true, abStage: 3 }"),
  'Hollenbeck and Faber must become physically present at the same stage that unlocks the Datscha');
assert(html.includes("file: 'disconto-bank-brehme-confrontation-day.png'"),
  'Brehme confrontation visual binding missing');
assert(html.includes("dayFile: 'disconto-bank-wegner-day.png'"),
  'daytime bank visual must visibly depict Otto Wegner in his office');
assert(html.includes("/berliner disconto-bank.*westsektor/.test"),
  'Brehme visual location match must accept the canonical parenthesized bank name');
assert(html.includes("file: 'polizeirevier-hardenbergstrasse-hollenbeck-handoff-night.png'"),
  'Hollenbeck handoff visual binding missing');
assert(html.includes("depictsNpcs: ['heinrich_lindner']")
    && html.includes('Karl Mauer steht im Dienstzimmer des Polizeireviers vor Kommissar Heinrich Lindner'),
  'the ordinary Lindner office image must explicitly contract the visible main NPC');
assert(html.includes("fundText: 'In Friedrich Hollenbecks Schreibtisch findest du ein schwarzes Notizbuch."),
  'notebook clue needs deterministic complete prose');
assert(html.includes("fundText: 'Margit Hollenbeck senkt die Stimme. Am Tag vor Friedrichs Verschwinden"),
  'Margit clue needs a deterministic statement that explicitly names Wegner');
assert(html.includes("Der Bankpförtner erkennt dich als privaten Ermittler"),
  'bank porter clue must use Karl’s real professional role instead of an invented press pass');
assert(html.includes("openingFallbackText: 'Du sitzt Kommissar Heinrich Lindner"),
  'Lindner opening needs a deterministic identity-safe fallback');
assert(!html.includes('2000 D-Mark')
    && html.includes('270 Ostmark, Spesen eingeschlossen'),
  'the promised Lindner fee must match the engine payout');
assert(html.includes("arrivalFallbackText: 'Du stellst den Opel am Strandweg vor der Hollenbeck-Villa ab."),
  'the Villa needs an authored arrival with a physically correct sequence');
assert(!html.includes(' ist sichtbar am Ort')
    && !html.includes(' sind sichtbar am Ort')
    && !html.includes(' bleiben sichtbar am Ort'),
  'natural fallback prose must not expose roster-verification language');
assert(html.includes('deniedProse: deniedProse.map'),
  'arrival roster validation must reject prose that names a required NPC only to deny their presence');
assert(html.includes('const distinctiveName = nameTokens.length ? nameTokens[nameTokens.length - 1]'),
  'arrival prose must name the distinctive person, not merely a generic job title');
assert(html.includes("if (vehicleRe.test(prose) && !vehicleAllowedRe.test(erlaubt)) extra.push('Fluchtfahrzeug');"),
  'every clue source must reject invented vehicles outside its canonical evidence scope');

const leakContext = {
  caseSetup: {
    klient: 'Kommissar Heinrich Lindner',
    opfer: 'Friedrich Hollenbeck'
  },
  caseProgress: { gefundeneIndizIds: [] },
  normForMatch: value => String(value || '').toLowerCase()
};
vm.createContext(leakContext);
vm.runInContext(sourceOf('_findHollenbeckPrematureClientKnowledge'), leakContext);
const leak = leakContext._findHollenbeckPrematureClientKnowledge({
  szene: 'Lindner sagt: Du hast das Notizbuch, die Tresor-Liste und Wegner ist der Schlüssel.',
  personenImRaum: ['Kommissar Heinrich Lindner']
}, { _npcName: 'Kommissar Heinrich Lindner' });
assert(leak && leak.code === 'hollenbeck_client_evidence_leak',
  'Lindner must not reveal undiscovered case evidence');
leakContext.caseProgress.gefundeneIndizIds = ['notizbuch_wegner', 'tresor_liste'];
assert.strictEqual(leakContext._findHollenbeckPrematureClientKnowledge({
  szene: 'Lindner ordnet das Notizbuch und die Tresor-Liste Wegner zu.',
  personenImRaum: ['Kommissar Heinrich Lindner']
}, { _npcName: 'Kommissar Heinrich Lindner' }), null,
'already found evidence must remain discussable with Lindner');

const escortContext = {
  normForMatch: value => String(value || '').toLowerCase()
};
vm.createContext(escortContext);
vm.runInContext(sourceOf('_findRescueEscortViolenceDrift'), escortContext);
const escortProblem = escortContext._findRescueEscortViolenceDrift({
  szene: 'Der Schaft seiner Pistole fährt dir in die Nieren.',
  verfassung_delta: -1
}, {
  id: 'HAUPTUI_ZIELPERSON_ZUM_OPEL',
  _npcName: 'Friedrich Hollenbeck'
});
assert(escortProblem && escortProblem.code === 'rescue_escort_false_violence',
  'protected rescue transport must reject invented attacks and injuries');
assert(!html.includes('geschwächte Zielperson Schritt für Schritt aus dem Rettungsort')
    && !html.includes('das Fahrziel bleibt deine nächste Entscheidung'),
  'visible rescue prose must not contain system-role or routing language');

const visibilityContext = {
  caseProgress: {
    activeConfrontation: {
      enemyName: 'Hauptmann Konrad Brehme',
      startedScene: 7
    }
  },
  sceneCounter: 7,
  currentScene: { szene: 'Du prüfst Wegners Tresor-Liste.' },
  _konfrontationAktiv: () => true,
  normForMatch: value => String(value || '').toLowerCase()
};
vm.createContext(visibilityContext);
vm.runInContext(sourceOf('_konfrontationInAktuellerSzeneSichtbar'), visibilityContext);
assert.strictEqual(visibilityContext._konfrontationInAktuellerSzeneSichtbar(visibilityContext.currentScene), false,
  'a post-scene threat roll must not put the confrontation UI ahead of prose');
visibilityContext.currentScene.szene = 'Hauptmann Brehme tritt aus dem Seitenbüro und stellt dich.';
assert.strictEqual(visibilityContext._konfrontationInAktuellerSzeneSichtbar(visibilityContext.currentScene), true,
  'the confrontation becomes visible as soon as prose introduces the opponent');

const rescueUiContext = {
  caseSetup: {
    targetResolution: {
      mode: 'physical',
      npc: 'friedrich_hollenbeck',
      location: 'Datscha am Mueggelsee'
    }
  },
  caseProgress: { zielpersonGefunden: false, zielpersonGeborgen: false },
  engineCurrentLocation: { name: 'Datscha am Mueggelsee' },
  normForMatch: value => String(value || '').toLowerCase(),
  _physischesFallzielIstNpc: target => target.id === 'friedrich_hollenbeck'
};
vm.createContext(rescueUiContext);
vm.runInContext(sourceOf('_hauptuiOffenesRettungsziel'), rescueUiContext);
assert.strictEqual(rescueUiContext._hauptuiOffenesRettungsziel({
  id: 'friedrich_hollenbeck',
  name: 'Friedrich Hollenbeck',
  typ: 'person'
}), true, 'a physical target at its configured rescue location must not become an exhausted dead-end');

const revealContext = {
  caseSetup: {
    targetResolution: {
      mode: 'physical',
      npc: 'friedrich_hollenbeck',
      location: 'Datscha am Mueggelsee',
      abStage: 3,
      revealClueIds: ['sokolow_briefe']
    }
  },
  caseProgress: {
    gefundeneIndizIds: ['pfoertner_aussage'],
    zielpersonGefunden: false,
    zielpersonGeborgen: false
  },
  alleDefiniertenIndizien: () => [
    { id: 'pfoertner_aussage', stage: 3 },
    { id: 'sokolow_briefe', stage: 4 }
  ],
  _resolveNpcIdentity: () => ({ name: 'Friedrich Hollenbeck' })
};
vm.createContext(revealContext);
vm.runInContext(sourceOf('_physischesFallzielStatus'), revealContext);
assert.strictEqual(revealContext._physischesFallzielStatus(), null,
  'a same-stage porter clue must not reveal the Datscha');
revealContext.caseProgress.gefundeneIndizIds.push('sokolow_briefe');
assert.strictEqual(revealContext._physischesFallzielStatus().revealClueId, 'sokolow_briefe',
  'only the configured Sokolow letters may reveal the Datscha');

const rescueToolContext = {
  engineCurrentLocation: { name: 'Datscha am Mueggelsee' },
  normForMatch: value => String(value || '').toLowerCase()
};
vm.createContext(rescueToolContext);
vm.runInContext(sourceOf('_findRescueToolDrift'), rescueToolContext);
const inventedKnife = rescueToolContext._findRescueToolDrift({
  szene: 'Du greifst nach der Klinge deines Klappmessers und ziehst es aus der Tasche.'
}, { id: 'HAUPTUI_ZIELPERSON_BEFREIEN', _npcName: 'Friedrich Hollenbeck' });
assert(inventedKnife && inventedKnife.code === 'rescue_tool_drift',
  'freeing a target must reject an invented knife');

vm.runInContext(sourceOf('_worldTruthNaturalRescueFallbackText'), rescueToolContext);
const rescueFallback = rescueToolContext._worldTruthNaturalRescueFallbackText(
  'Friedrich Hollenbeck',
  { id: 'HAUPTUI_ZIELPERSON_ZUM_OPEL' }
);
assert(/Arm von Friedrich Hollenbeck/.test(rescueFallback)
    && /Beifahrertür/.test(rescueFallback)
    && !/Gespräch endet|sichtbar am Ort/.test(rescueFallback),
  'rescue transport must use authored physical prose instead of a social fallback');

vm.runInContext(sourceOf('_findPhantomImmediateThreat'), rescueToolContext);
rescueToolContext.caseProgress = {};
const danglingWatcher = rescueToolContext._findPhantomImmediateThreat({
  szene: 'Margit schweigt. Jemand nähert sich dem Fenster.',
  personenImRaum: ['Margit Hollenbeck']
}, { id: 'AKTEN_LESEN' });
assert(danglingWatcher && danglingWatcher.code === 'phantom_immediate_threat',
  'an unbacked anonymous-threat cliffhanger must be rejected even with a peaceful NPC present');

const departureContext = {
  caseSetup: {},
  caseProgress: {
    activeConfrontation: {
      enemyName: 'Hauptmann Konrad Brehme',
      npcId: 'hauptmann_brehme'
    }
  },
  engineCurrentLocation: { name: 'Berliner Disconto-Bank (Westsektor)' },
  normForMatch: value => String(value || '').toLowerCase(),
  _worldTruthAliases: (id, entry) => [String(id || '').replace(/_/g, ' '), entry.name],
  _worldTruthHasAlias: (text, aliases) => aliases.some(alias => String(text).toLowerCase().includes(String(alias).toLowerCase()))
};
vm.createContext(departureContext);
vm.runInContext(sourceOf('_findActiveConfrontationDepartureDrift'), departureContext);
const departureProblem = departureContext._findActiveConfrontationDepartureDrift({
  szene: 'Hauptmann Konrad Brehme tritt in die Halle. Du verlässt die Bank durch den Seitenausgang.'
}, { id: 'AKTEN_LESEN' });
assert(departureProblem && departureProblem.code === 'active_confrontation_departure',
  'a new confrontation must not auto-resolve through an unchosen departure');
assert.strictEqual(departureContext._findActiveConfrontationDepartureDrift({
  szene: 'Hauptmann Konrad Brehme tritt in die Halle. Du verlässt die Bank durch den Seitenausgang.'
}, { id: 'FLUCHT', text: 'Fliehen' }), null,
'an explicitly chosen escape may still leave a confrontation');

vm.runInContext(sourceOf('_findUnchosenSceneDepartureDrift'), departureContext);
const unchosenDeparture = departureContext._findUnchosenSceneDepartureDrift({
  szene: 'Der Pförtner senkt die Stimme. Du verlässt die Bank durch den Seitenausgang.'
}, { id: 'BEFRAGEN', text: 'Den Pförtner befragen' });
assert(unchosenDeparture && unchosenDeparture.code === 'unchosen_scene_departure',
  'ordinary investigation must not invent a departure even without an active confrontation');
assert.strictEqual(departureContext._findUnchosenSceneDepartureDrift({
  szene: 'Du verlässt die Bank durch den Seitenausgang und läufst zum Opel.'
}, { id: 'ORT_VERLASSEN', text: 'Ort verlassen' }), null,
'an explicitly selected departure must remain legal');

const locationContext = {
  caseSetup: {
    klient: 'Kommissar Heinrich Lindner',
    opfer: 'Friedrich Hollenbeck'
  },
  engineCurrentLocation: { name: 'Polizeirevier Hardenbergstrasse' },
  normForMatch: value => String(value || '').toLowerCase()
};
vm.createContext(locationContext);
vm.runInContext(sourceOf('_findHollenbeckCanonicalLocationDrift'), locationContext);
const wrongRescuePlace = locationContext._findHollenbeckCanonicalLocationDrift({
  szene: 'Lindner sagt, Karl habe Hollenbeck aus einer Mühle am Müggelsee befreit.'
});
assert(wrongRescuePlace && wrongRescuePlace.code === 'hollenbeck_rescue_location_drift',
  'the finale must preserve the canonical Datscha rescue location');
assert.strictEqual(locationContext._findHollenbeckCanonicalLocationDrift({
  szene: 'Lindner sagt, Karl habe Hollenbeck aus der Datscha am Müggelsee befreit.'
}), null, 'the canonical Datscha may be recalled in the finale');

const proseContext = {
  engineCurrentLocation: { name: 'Berliner Disconto-Bank (Westsektor)' },
  normForMatch: value => String(value || '').toLowerCase()
};
vm.createContext(proseContext);
vm.runInContext(html.slice(
  html.indexOf('function _findUnderwrittenSceneProse('),
  html.indexOf('function _naturalMinimumSceneText(')
), proseContext);
const thinBank = proseContext._findUnderwrittenSceneProse({
  szene: 'Du betrittst die Berliner Disconto-Bank nahe dem Kurfuerstendamm.'
}, { id: 'REISE', _istReise: true });
assert(thinBank && thinBank.code === 'scene_prose_underwritten',
  'a dry one-sentence arrival must be rejected before it reaches the player');
assert.strictEqual(proseContext._findUnderwrittenSceneProse({
  szene: 'Das Messing der Schalter glimmt im gedaempften Licht. Hinter dem Tresen ordnet Wegner schweigend seine Formulare. Du bleibst in der Halle stehen und pruefst, welche Spur du zuerst verfolgst.'
}, { id: 'REISE', _istReise: true }), null,
'a concrete multi-sentence scene must pass the prose floor');
assert(html.includes('Als die schwere Glastür der Berliner Disconto-Bank hinter dir zufällt')
    && html.includes('Messinggitter teilen die kühle Schalterhalle'),
  'the deterministic bank arrival must be a dramatized scene, not a dry routing instruction');
proseContext.caseProgress = { pendingHauptuiIndiz: { id: 'notizbuch_wegner' } };
proseContext._findeIndizById = () => ({
  id: 'notizbuch_wegner',
  fundText: 'Im Notizbuch steht: Wegner - Devisenbetrug?',
  schluessel: ['notizbuch', 'wegner', 'devisenbetrug']
});
const brokenEvidence = proseContext._findUnderwrittenSceneProse({
  szene: 'Du oeffnest das schwarze Notizbuch und blaetterst durch mehrere Seiten. Der Raum riecht nach Leder. Dann bleibt dein Blick am unteren Rand haengen. “'
}, { id: 'AKTEN_LESEN', _pendingIndizId: 'notizbuch_wegner' });
assert(brokenEvidence && brokenEvidence.code === 'scene_prose_underwritten'
    && brokenEvidence.brokenQuote && brokenEvidence.evidenceMissing
    && /Wegner/.test(brokenEvidence.fundText),
  'a broken quote or mechanically booked clue without its payoff must be replaced by canonical prose');
assert(html.includes('const _fallbackThin = (typeof _findUnderwrittenSceneProse'),
  'every deterministic world-truth fallback needs a final prose-quality gate');
assert(html.includes("problem.code === 'scene_prose_underwritten'"),
  'underwritten prose needs an explicit natural fallback repair');

const cluePayoffContext = {
  caseProgress: { pendingHauptuiIndiz: { id: 'margit_aussage' } },
  currentScene: null,
  _findUnderwrittenSceneProse: () => ({ code: 'scene_prose_underwritten' })
};
vm.createContext(cluePayoffContext);
vm.runInContext(sourceOf('_indizAbschlussProsaSichern'), cluePayoffContext);
const thinMargitScene = {
  szene: 'Margit bleibt vor dir und mustert dich aufmerksam.'
};
const margitPayoff = 'Margit Hollenbeck berichtet von Friedrichs Streit mit Otto Wegner am Vortag.';
assert.strictEqual(cluePayoffContext._indizAbschlussProsaSichern({
  id: 'margit_aussage',
  fundText: margitPayoff
}, thinMargitScene), true,
'a mechanically booked clue with underwritten prose must be replaced by its canonical payoff');
assert.strictEqual(thinMargitScene.szene, margitPayoff,
  'the canonical Margit statement must reach the visible scene');

const rescuedArrivalContext = {
  caseSetup: {
    targetResolution: {
      mode: 'physical',
      npc: 'friedrich_hollenbeck',
      guard: 'leutnant_faber',
      location: 'Datscha am Mueggelsee',
      rescuedArrivalFallbackText: 'Friedrich ist bereits befreit und wartet am Opel.',
      guardRemovedArrivalFallbackText: 'Faber ist fort; Friedrich wartet noch im Raum.'
    }
  },
  caseProgress: { zielpersonGeborgen: true },
  engineCurrentLocation: { name: 'Datscha am Mueggelsee' },
  getCaseLocations: () => [{
    name: 'Datscha am Mueggelsee',
    arrivalFallbackText: 'Friedrich ist gefesselt; Faber bewacht ihn.'
  }],
  normForMatch: value => String(value || '').toLowerCase(),
  _resolveNpcIdentity: () => ({ name: 'Leutnant Ingrid Faber' }),
  _npcZustandGet: () => null
};
vm.createContext(rescuedArrivalContext);
vm.runInContext(sourceOf('_naturalMinimumSceneText'), rescuedArrivalContext);
const rescuedReturnText = rescuedArrivalContext._naturalMinimumSceneText({
  szene: 'Du kehrst zurück.',
  personenImRaum: ['Friedrich Hollenbeck']
}, {
  engineOrt: 'Datscha am Mueggelsee',
  arrival: true
});
assert(rescuedReturnText.startsWith('Friedrich ist bereits befreit und wartet am Opel.')
    && !/gefesselt|Faber bewacht/.test(rescuedReturnText),
'returning after custody must not reset Hollenbeck to bound or resurrect Faber');

const guardVisualContext = {
  caseSetup: {
    targetResolution: {
      mode: 'physical',
      npc: 'friedrich_hollenbeck',
      guard: 'leutnant_faber',
      location: 'Datscha am Mueggelsee',
      visualStates: {
        guardRemovedAtTarget: { file: 'guard-gone.png' },
        guardDownAtTarget: { file: 'guard-down.png' }
      }
    }
  },
  caseProgress: { zielpersonGeborgen: false, zielpersonTransportStatus: '' },
  engineCurrentLocation: { name: 'Datscha am Mueggelsee' },
  normForMatch: value => String(value || '').toLowerCase(),
  _resolveNpcIdentity: () => ({ name: 'Leutnant Ingrid Faber' }),
  _npcZustandGet: value => value === 'Leutnant Ingrid Faber'
    ? { status: 'geflohen' } : null
};
vm.createContext(guardVisualContext);
vm.runInContext(sourceOf('_physicalTargetSceneVisual'), guardVisualContext);
assert.strictEqual(guardVisualContext._physicalTargetSceneVisual().file, 'guard-gone.png',
  'visual state lookup must resolve a configured guard id to the stored display name');

assert(html.includes('const caseSpecific = castOptions.filter(function (npc) { return npc && !npc._stammfigur; });'),
  'case-specific MfS officers must take precedence over the global Vollmer fallback');
assert(html.includes("caseProgress.activeConfrontation.trigger !== 'stasi-encounter'")
    && html.includes('SERIALISIERTER MfS-DRUCK'),
  'a central Stasi encounter must wait behind an active case confrontation');
assert(html.includes('const bluffRunde = Math.max(1')
    && html.includes("bluffEntscheidet ? 'beruhigt' : 'angespannt'"),
  'two consecutive credible bluffs must resolve instead of looping forever');

const rosterPresenceContext = {
  engineCurrentLocation: { name: 'Datscha am Mueggelsee' },
  normForMatch: value => String(value || '').toLowerCase(),
  getNpcsAtCurrentLocation: () => [
    { id: 'friedrich_hollenbeck', name: 'Friedrich Hollenbeck' },
    { id: 'leutnant_faber', name: 'Leutnant Ingrid Faber' }
  ],
  _npcZustandIstEntfernt: () => false,
  _worldTruthAliases: (id, entry) => [String(id || '').replace(/_/g, ' '), entry.name],
  _worldTruthHasAlias: (text, aliases) => aliases.some(alias =>
    String(text).toLowerCase().includes(String(alias).toLowerCase()))
};
vm.createContext(rosterPresenceContext);
vm.runInContext(sourceOf('_findRosterPresenceContradiction'), rosterPresenceContext);
const deniedDatschaRoster = rosterPresenceContext._findRosterPresenceContradiction({
  szene: 'Vor dir ragt die feuchte Datscha aus dem Schilf. Niemand ist zu sehen.',
  personenImRaum: ['Friedrich Hollenbeck', 'Leutnant Ingrid Faber']
});
assert(deniedDatschaRoster && deniedDatschaRoster.code === 'present_roster_denied',
  'generic prose such as "Niemand ist zu sehen" must not deny physically rostered main NPCs');
const emptyDatschaRoster = rosterPresenceContext._findRosterPresenceContradiction({
  szene: 'Die Datscha wirkt plötzlich leer.',
  personenImRaum: ['Friedrich Hollenbeck']
});
assert(emptyDatschaRoster && emptyDatschaRoster.code === 'present_roster_denied',
  'a rescued target must not be erased by an "empty Datscha" sentence');

const actorContext = {
  caseSetup: {
    setupCast: [
      { id: 'margit_hollenbeck', name: 'Margit Hollenbeck' },
      { id: 'otto_wegner', name: 'Vize-Direktor Otto Wegner' }
    ]
  },
  caseProgress: { stage: 3 },
  engineCurrentLocation: { name: 'Berliner Disconto-Bank (Westsektor)' },
  normForMatch: value => String(value || '').toLowerCase(),
  getCaseLocations: () => [{
    name: 'Berliner Disconto-Bank (Westsektor)',
    npcs: [{ id: 'otto_wegner', immer: true }]
  }],
  _resolveNpcIdentity: id => id === 'otto_wegner'
    ? { id, name: 'Vize-Direktor Otto Wegner' }
    : { id, name: 'Margit Hollenbeck' },
  _npcAbkoemmlich: () => false,
  _worldTruthAliases: (id, entry) => [String(id || '').replace(/_/g, ' '), entry.name],
  _worldTruthHasAlias: (text, aliases) => aliases.some(alias =>
    String(text).toLowerCase().includes(String(alias).toLowerCase()))
};
vm.createContext(actorContext);
vm.runInContext(sourceOf('_splitWorldTruthSentences'), actorContext);
vm.runInContext(sourceOf('_findUnrosteredPresentActor'), actorContext);
const inventedCourier = actorContext._findUnrosteredPresentActor({
  szene: 'Wegner schweigt, als ein Bote im Bankkittel den Raum betritt.',
  personenImRaum: ['Vize-Direktor Otto Wegner']
}, { id: 'BEFRAGEN' });
assert(inventedCourier && inventedCourier.code === 'unrostered_present_actor',
  'an invented bank courier must not exist only in prose');
actorContext.engineCurrentLocation = { name: 'Datscha am Mueggelsee' };
actorContext.getCaseLocations = () => [{ name: 'Datscha am Mueggelsee', npcs: [] }];
const teleportedMargit = actorContext._findUnrosteredPresentActor({
  szene: 'Margit Hollenbeck lässt im Hintergrund ein Schluchzen hören.',
  personenImRaum: ['Friedrich Hollenbeck', 'Leutnant Ingrid Faber']
}, { id: 'BERUHIGEN' });
assert(teleportedMargit && teleportedMargit.code === 'unrostered_present_actor'
    && teleportedMargit.npc === 'Margit Hollenbeck',
  'Margit must not teleport from the Villa to the Datscha through prose');

assert(html.includes("depictsNpcs: ['friedrich_hollenbeck']")
    && html.includes('Karl Mauer stützt den erschöpften Friedrich Hollenbeck'),
  'the rescued-at-target image state must explicitly depict Hollenbeck');

const openingRosterContext = {
  engineCurrentLocation: { name: 'Polizeirevier Hardenbergstrasse' },
  normForMatch: value => String(value || '').toLowerCase()
};
vm.createContext(openingRosterContext);
vm.runInContext(sourceOf('_findOpeningUnexpectedRosterActor'), openingRosterContext);
const inventedOpeningOfficer = openingRosterContext._findOpeningUnexpectedRosterActor({
  ort: 'Polizeirevier Hardenbergstrasse',
  personenImRaum: ['Kommissar Heinrich Lindner', 'Hauptmann Vollmer']
}, {
  setupCast: [
    { id: 'heinrich_lindner', name: 'Kommissar Heinrich Lindner', anwesend: true },
    { id: 'hauptmann_brehme', name: 'Hauptmann Konrad Brehme', anwesend: false }
  ],
  locations: [{ name: 'Polizeirevier Hardenbergstrasse' }]
});
assert(inventedOpeningOfficer && inventedOpeningOfficer.code === 'opening_unexpected_roster_actor'
    && inventedOpeningOfficer.targets.includes('Hauptmann Vollmer'),
  'an invented officer cannot authorize himself merely by appearing in the AI roster');
assert(html.includes('function _applyConfiguredOpeningCompletenessFallback(scene, setup)'),
  'the final opening completeness fallback must be available independently of retries');
assert(html.includes('OPENING-PFLICHTFAKTEN FINAL-FALLBACK'),
  'missing opening core facts need a final pre-commit gate');

const roleDuplicateContext = {
  normForMatch: value => String(value || '').toLowerCase()
};
vm.createContext(roleDuplicateContext);
vm.runInContext(sourceOf('_hauptuiIstNurRollenDoppel'), roleDuplicateContext);
const fullLindner = { id: 'heinrich_lindner', name: 'Kommissar Heinrich Lindner' };
const bareCommissioner = { name: 'Kommissar' };
assert.strictEqual(roleDuplicateContext._hauptuiIstNurRollenDoppel(
  bareCommissioner,
  [fullLindner, bareCommissioner]
), true, 'a generic "Kommissar" cast fragment must not become a second UI person beside Lindner');
assert.strictEqual(roleDuplicateContext._hauptuiIstNurRollenDoppel(
  bareCommissioner,
  [bareCommissioner]
), false, 'a lone role-only NPC may remain when no named person duplicates it');

console.log('LINDNER_RUN_REGRESSION_OK');
