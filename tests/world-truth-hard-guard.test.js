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
  for (let i = brace; i < html.length; i += 1) {
    if (html[i] === '{') depth += 1;
    if (html[i] === '}') {
      depth -= 1;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('unterminated function ' + name);
}

const normForMatch = (value) => String(value || '')
  .toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

const context = {
  normForMatch,
  sceneCounter: 15,
  caseProgress: {
    npcZustand: {
      mertens: {
        name: 'Oberleutnant Mertens',
        status: 'uebergeben',
        ort: 'Lagerhaus an der Spree',
        seitSzene: 14
      }
    }
  },
  engineCurrentLocation: { name: 'Lagerhaus an der Spree' },
  getCaseLocations: () => [],
  diag: () => {}
};
vm.createContext(context);
[
  '_worldTruthAliases',
  '_worldTruthHasAlias',
  '_worldTruthOrtGleich',
  '_findArrivalEvidenceLeak',
  '_findTargetEvidenceScopeDrift',
  'sanitizeSceneTerminalNpcState',
  'validateSceneWorldTruth',
  'buildWorldTruthRepairHint',
  '_worldTruthNaturalFallbackText',
  'enforceSceneWorldTruthFallback',
  '_schlafHeilZiel'
].forEach((name) => vm.runInContext(sourceOf(name), context));

context.caseProgress = { gefundeneIndizIds: [], klientGesprochen: true, npcZustand: {} };
context.caseSetup = { caseType: 'diebstahl' };
context.engineCurrentLocation = { name: 'Krauses Antiquitäten' };
context._resolveNpcIdentity = () => ({ id: 'hannelore_wirth', name: 'Hannelore Wirth' });
context.getCaseLocations = () => [{
  name: 'Krauses Antiquitäten',
  indizien: [{
    id: 'nachbarin_aussage', npc: 'hannelore_wirth', quelle: 'person',
    text: 'Nachbarin Hannelore Wirth: In der Nacht vom Dienstag auf Mittwoch, 29./30. September 1953, sah sie zwei Männer mit einer schweren Tasche aus dem Hinterhof kommen',
    schluessel: ['nachbarin', 'wirth', 'hannelore', 'zwei maenner', 'tasche', 'tatnacht', 'hinterhof', 'gesehen']
  }, {
    id: 'einbruch_fenster', quelle: 'umgebung',
    schluessel: ['fenster', 'aufgebrochen', 'aufgehebelt', 'stemmeisen', 'hinterhof', 'splittrig', 'kein profi']
  }, {
    id: 'etui_letzter_ort', quelle: 'umgebung',
    vorabWahrheit: 'Die Vitrine ist offen und leer, ihr Glas ist aber intakt.',
    vorabObjektwoerter: ['vitrine', 'glasvitrine', 'vitrinenglas'],
    vorabVerboten: ['zerbrochen', 'eingeschlagen', 'scherbe', 'glasscherbe', 'splitter', 'glassplitter'],
    schluessel: ['vitrine', 'etui', 'zigarettenetui', 'silber', 'gravur', 'hugo', 'liesl', 'staub', 'samt', 'schmuck']
  }]
}];

let problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'Hannelore Wirth wartet zwischen den Regalen und sieht dich reserviert an. Mehr sagt sie noch nicht.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert.strictEqual(problem, null, 'an arrival may introduce a witness without revealing the witness clue');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'Hannelore Wirth sagt: Die beiden Maenner, die ich sah, kamen mit einer schweren Tasche aus dem Hinterhof; einer hinkte leicht.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert(problem && problem.code === 'arrival_evidence_leak',
  'a travel scene must not narrate Hannelores still-unawarded core clue');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'Das Fenster ist splittrig aufgehebelt; die Kerben stammen eindeutig von einem Stemmeisen.',
  personenImRaum: [], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert(problem && problem.code === 'arrival_evidence_leak',
  'a travel scene must not perform the still-unawarded hotspot investigation');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'Eine leere Vitrine steht im Laden. Daneben wartet Hannelore schweigend.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert.strictEqual(problem, null, 'an arrival may show a hotspot prop without interpreting its evidence');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses AntiquitÃ¤ten',
  szene: 'Hannelore haelt ein Stueck der zerbrochenen Glasvitrine in der Hand.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert(problem && problem.code === 'arrival_object_truth_contradiction',
  'an arrival must not contradict the physical truth of a still-open hotspot');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses AntiquitÃ¤ten',
  szene: 'Die Vitrine steht offen und leer; das Glas ist intakt. Hannelore wartet daneben.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert.strictEqual(problem, null,
  'the canonical visible object state must remain legal without awarding its evidence');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'Hannelore starrt auf den leeren Platz in der Vitrine, wo das Etui einst gelegen haben muss.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert(problem && problem.code === 'arrival_evidence_leak',
  'an arrival must not disclose the evidence relation reserved for the vitrinen hotspot click');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'Krause ist gerade erst weg. Hannelore wartet schweigend im Laden.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REDEN' });
assert(problem && problem.code === 'client_absence_unexplained',
  'Krauses absence after his explicit departure needs a canonical time-continuity explanation');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'Krause ist oben in seiner Wohnung und stellt die Verlustliste zusammen. Hannelore wartet schweigend im Laden.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REDEN' });
assert.strictEqual(problem, null, 'the explained Krause transition must remain legal');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'Hannelore Wirth sagt, dass sie in der Nacht vom Dienstag auf Mittwoch zwei Männer mit einer schweren Tasche aus dem Hinterhof kommen sah.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'NPC_sozial_ehrlich', _pendingIndizId: 'nachbarin_aussage' });
assert.strictEqual(problem, null, 'the awarded witness clue must be dramatized at exactly its defined scope');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'Hannelore Wirth sagt, dass sie kurz nach drei zwei Männer mit einer schweren Tasche sah, die einen dunklen Wagen ohne Licht nahmen; einer hinkte.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'NPC_sozial_ehrlich', _pendingIndizId: 'nachbarin_aussage' });
assert(problem && problem.code === 'evidence_scope_drift'
    && problem.extras.includes('exakte Uhrzeit')
    && problem.extras.includes('Fluchtfahrzeug')
    && problem.extras.includes('Körpermerkmal/Gangart'),
  'an awarded clue must reject invented clock, vehicle, and gait facts outside its definition');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'In der Vitrine zeichnet sich der Abdruck des Etuis ab. Das Schloss wurde mit einem einfachen Werkzeug aufgehebelt.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'HOTSPOT', _pendingIndizId: 'etui_letzter_ort' });
assert(problem && problem.code === 'evidence_scope_drift'
    && problem.extras.some((entry) => entry.includes('einbruch_fenster')),
  'a vitrinen find must not consume the distinctive aufgehebelt keyword from the still-open window clue');

context.caseProgress = {
  npcZustand: {
    mertens: {
      name: 'Oberleutnant Mertens',
      status: 'uebergeben',
      ort: 'Lagerhaus an der Spree',
      seitSzene: 14
    }
  }
};
context.caseSetup = {};
context.engineCurrentLocation = { name: 'Lagerhaus an der Spree' };
context.getCaseLocations = () => [];

problem = context.validateSceneWorldTruth({
  ort: 'Lagerhaus an der Spree',
  szene: 'Mertens schlägt Karl erneut mit der Faust.',
  personenImRaum: [],
  optionen: []
}, { id: 'REDEN' });
assert(problem && problem.code === 'npc_prose',
  'a handed-over NPC must never return as an acting prose character');

const fallbackScene = {
  ort: 'Lagerhaus an der Spree',
  szene: 'Mertens ist bereits abgef\u00fchrt. Diese Tatsache bleibt bindend. Karl ordnet die Lage mit den tats\u00e4chlich anwesenden Personen neu.',
  personenImRaum: ['Oberleutnant Mertens'],
  optionen: [{ text: 'Greife Mertens an' }]
};
context.enforceSceneWorldTruthFallback(fallbackScene, {
  code: 'npc_prose', npc: 'Oberleutnant Mertens', status: 'uebergeben', aliases: ['mertens', 'oberleutnant mertens']
});
assert(!/bindend|tats\u00e4chlich anwesenden Personen|Engine-Wahrheit/i.test(fallbackScene.szene),
  'hard fallback must never leak repair instructions into player prose');
assert(fallbackScene.szene.length > 50, 'hard fallback must produce natural playable prose');
assert(!fallbackScene.personenImRaum.includes('Oberleutnant Mertens'), 'fallback must remove terminal NPCs from the roster');

problem = context.validateSceneWorldTruth({
  ort: 'Lagerhaus an der Spree',
  szene: 'Die Polizei hat Mertens bereits abgeführt.',
  personenImRaum: [],
  optionen: [{ text: 'Spuren sichern' }]
}, { id: 'UNTERSUCHEN' });
assert.strictEqual(problem, null, 'retrospective mention of a police handoff must remain legal');

context.caseProgress.npcZustand = {
  kalle: { name: 'Kalle', status: 'geflohen', seitSzene: 29 }
};
problem = context.validateSceneWorldTruth({
  ort: 'Lagerhaus an der Spree',
  szene: 'Kalle und Frieda sind fort, abgeführt von der Schutzpolizei.',
  personenImRaum: [],
  optionen: []
}, { id: 'UNTERSUCHEN' });
assert(problem && problem.code === 'npc_fate_mismatch',
  'a fled NPC must never be rewritten retrospectively as arrested');
assert(/NICHT festgenommen/.test(context.buildWorldTruthRepairHint(problem)),
  'fate repair must tell the model the exact stored outcome');

problem = context.validateSceneWorldTruth({
  ort: 'Lagerhaus an der Spree',
  szene: 'Kalle hat in den Wirren das Weite gesucht und ist geflohen.',
  personenImRaum: [],
  optionen: []
}, { id: 'UNTERSUCHEN' });
assert.strictEqual(problem, null, 'the correct retrospective flight must remain legal');

problem = context.validateSceneWorldTruth({
  ort: 'Lagerhaus an der Spree',
  szene: 'Die Schutzpolizei führt Frieda ab, während Kalle in den Wirren das Weite gesucht hat.',
  personenImRaum: [],
  optionen: []
}, { id: 'UNTERSUCHEN' });
assert.strictEqual(problem, null,
  'a mixed retrospective sentence may correctly distinguish arrest and flight');

context.caseProgress.npcZustand = {
  frieda: { name: 'Tante Frieda', status: 'uebergeben', seitSzene: 25 }
};
problem = context.validateSceneWorldTruth({
  ort: 'Lagerhaus an der Spree',
  szene: 'Tante Frieda ist der Polizei entkommen und hat das Weite gesucht.',
  personenImRaum: [],
  optionen: []
}, { id: 'UNTERSUCHEN' });
assert(problem && problem.code === 'npc_fate_mismatch',
  'a handed-over NPC must never be rewritten retrospectively as escaped');

context.caseProgress.npcZustand = {
  mertens: {
    name: 'Oberleutnant Mertens',
    status: 'uebergeben',
    ort: 'Lagerhaus an der Spree',
    seitSzene: 14
  }
};

problem = context.validateSceneWorldTruth({
  ort: 'Lagerhaus an der Spree',
  szene: 'Karl prüft die gesicherten Spuren.',
  personenImRaum: [],
  optionen: [{ text: 'Greife Oberleutnant Mertens an' }]
}, { id: 'UNTERSUCHEN' });
assert(problem && problem.code === 'npc_option',
  'stale buttons must not target a handed-over NPC');

context.caseProgress.npcZustand = {};
problem = context.validateSceneWorldTruth({
  ort: 'Lagerhaus an der Spree',
  szene: 'Diese Tatsache bleibt bindend. Karl ordnet die tats\u00e4chlich anwesenden Personen neu.',
  personenImRaum: [], optionen: []
}, { id: 'REDEN' });
assert(problem && problem.code === 'meta_instruction_leak',
  'technical repair language must be rejected even if no NPC name remains');

context.caseProgress.npcZustand = {
  frieda: { name: 'Tante Frieda', status: 'uebergeben' },
  kalle: { name: 'Kalle', status: 'uebergeben' }
};
const multiTerminalScene = {
  personenImRaum: ['Tante Frieda', 'Kalle', 'Erika Kalewski'],
  optionen: [{ text: 'Rede mit Kalle' }, { text: 'Sprich mit Erika Kalewski' }],
  cast_hinzugefuegt: [{ name: 'Tante Frieda' }, { name: 'Erika Kalewski' }]
};
context.sanitizeSceneTerminalNpcState(multiTerminalScene);
assert.deepStrictEqual(Array.from(multiTerminalScene.personenImRaum), ['Erika Kalewski'],
  'all handed-over NPCs must be removed in one pass while present NPCs remain');
assert.strictEqual(multiTerminalScene.optionen.length, 1, 'stale terminal NPC actions must be removed in one pass');
assert.strictEqual(multiTerminalScene.cast_hinzugefuegt.length, 1, 'terminal NPCs must not be re-added through cast metadata');

context.caseProgress.npcZustand = {};
problem = context.validateSceneWorldTruth({
  ort: 'Opel Olympia',
  szene: 'Karl sitzt schon im Opel.',
  personenImRaum: [],
  optionen: []
}, { id: 'REDEN' });
assert(problem && problem.code === 'engine_location',
  'model prose must not silently move Karl away from the engine location');

problem = context.validateSceneWorldTruth({
  ort: 'Lagerhaus an der Spree',
  szene: 'Du rennst hinaus und fährst davon.',
  personenImRaum: [],
  optionen: []
}, { id: 'REDEN' });
assert(problem && problem.code === 'unauthorized_departure',
  'prose must not invent a departure the player did not choose');

context.caseProgress.npcZustand = {
  mertens: {
    name: 'Oberleutnant Mertens',
    status: 'gefesselt',
    ort: 'Lagerhaus an der Spree',
    seitSzene: 14
  }
};
problem = context.validateSceneWorldTruth({
  ort: 'Lagerhaus an der Spree',
  szene: 'Oberleutnant Mertens springt auf und greift Karl an.',
  personenImRaum: [{ name: 'Oberleutnant Mertens' }],
  optionen: []
}, { id: 'REDEN' });
assert(problem && problem.code === 'npc_state_action',
  'a restrained NPC must not act against the stored physical state');

assert.strictEqual(context._schlafHeilZiel(2, false), 3,
  'sleep may stabilize a severe injury but not fully heal it');
assert.strictEqual(context._schlafHeilZiel(3, true), 3,
  'provisional first aid must retain the sleep healing cap');
assert.strictEqual(context._schlafHeilZiel(4, false), 5,
  'ordinary light fatigue may still heal through sleep');

const confrontationContext = {
  caseProgress: {
    activeConfrontation: { npcId: 'mertens', enemyName: 'Oberleutnant Mertens', ort: 'Lagerhaus an der Spree' },
    encounterState: null
  },
  _npcZustandIstEntfernt: () => true,
  _konfrontationOrtName: () => 'Lagerhaus an der Spree',
  normForMatch,
  diag: () => {}
};
confrontationContext._konfrontationClear = (reason) => {
  confrontationContext.clearReason = reason;
  confrontationContext.caseProgress.activeConfrontation = null;
};
vm.createContext(confrontationContext);
vm.runInContext(sourceOf('_konfrontationAktiv'), confrontationContext);
assert.strictEqual(confrontationContext._konfrontationAktiv(), false,
  'render-time confrontation guard must reject a terminal NPC');
assert.strictEqual(confrontationContext.clearReason, 'npc-terminalzustand',
  'stale confrontation state must be actively cleared');

console.log('WORLD_TRUTH_HARD_GUARD_OK');
