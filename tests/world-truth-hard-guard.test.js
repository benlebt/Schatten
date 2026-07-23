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
  '_findOpenObjectTruthContradiction',
  '_findArrivalEvidenceLeak',
  '_findTargetEvidenceScopeDrift',
  '_findUnfoundedPriorVisitDrift',
  '_findKesslerEntryRosterDrift',
  'sanitizeSceneTerminalNpcState',
  'validateSceneWorldTruth',
  'buildWorldTruthRepairHint',
  '_worldTruthNaturalFallbackText',
  'enforceSceneWorldTruthFallback',
  '_schlafHeilZiel'
].forEach((name) => vm.runInContext(sourceOf(name), context));

context.caseProgress = { gefundeneIndizIds: ['robert_eintritt_beobachtet'], npcZustand: {} };
context.caseSetup = { caseType: 'beschattung', setupCast: [{ id: 'robert_kessler', name: 'Robert Kessler' }] };
context.engineCurrentLocation = { name: 'Hinterhof Sybelstrasse' };
context.cast = [{ id: 'robert_kessler', name: 'Robert Kessler' }, { id: 'frau_pohl', name: 'Frau Pohl' }];

let problem = context.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Robert geht ins Hinterhaus. Die Haustuer faellt hinter ihm zu.',
  personenImRaum: ['Robert Kessler', 'Frau Pohl'],
  optionen: [{ text: 'Robert Kessler befragen' }]
}, { id: 'WARTEN', _pendingIndizId: 'robert_eintritt_beobachtet' });
assert(problem && problem.code === 'kessler_entry_roster_drift',
  'Robert must not remain a clickable courtyard target after entering behind the closed door');

const kesslerFallback = {
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Robert geht ins Hinterhaus. Die Haustuer faellt hinter ihm zu.',
  personenImRaum: ['Robert Kessler', 'Frau Pohl'],
  optionen: [{ text: 'Robert Kessler befragen' }, { text: 'Klingelschilder ansehen' }]
};
context.enforceSceneWorldTruthFallback(kesslerFallback, problem);
assert.deepStrictEqual(Array.from(kesslerFallback.personenImRaum), ['Frau Pohl'],
  'Kessler fallback must remove Robert from the physical scene roster');
assert(!Array.from(kesslerFallback.optionen, entry => entry.text).some(text => /robert kessler/i.test(text)),
  'Kessler fallback must remove immediate Robert courtyard actions');
assert.deepStrictEqual(Array.from(context.cast, entry => entry.name), ['Frau Pohl'],
  'Kessler fallback must remove Robert from the live cast until deterministic abpassen');

problem = context.validateSceneWorldTruth({
  ort: 'Hinterhof Sybelstrasse',
  szene: 'Robert geht ins Hinterhaus. Die Haustuer faellt hinter ihm zu.',
  personenImRaum: ['Frau Pohl'],
  optionen: [{ text: 'Klingelschilder ansehen' }]
}, { id: 'WARTEN', _pendingIndizId: 'robert_eintritt_beobachtet' });
assert.strictEqual(problem, null,
  'the canonical entry observation without an immediate Robert target must remain legal');

context.caseProgress = { gefundeneIndizIds: [], klientGesprochen: true, npcZustand: {} };
context.caseSetup = { caseType: 'diebstahl', setupCast: [{ name: 'Hannelore Wirth' }, { name: 'Theodor Krause' }] };
context.karlAkte = { bekannte: {} };
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
    vorabWahrheit: 'Das Hinterhof-Fenster ist am Holzrahmen aufgehebelt; die Fensterscheibe ist nicht eingeschlagen.',
    vorabObjektwoerter: ['fenster', 'hinterhof-fenster', 'fensterscheibe'],
    vorabVerboten: ['eingeschlagen', 'zerschlagen', 'zerbrochen', 'glasscherbe', 'glasscherben'],
    schluessel: ['fenster', 'aufgebrochen', 'aufgehebelt', 'stemmeisen', 'hinterhof', 'splittrig', 'kein profi']
  }, {
    id: 'etui_letzter_ort', quelle: 'umgebung',
    vorabWahrheit: 'Die Vitrine ist offen und leer, ihr Glas ist aber intakt und unbeschÃ¤digt.',
    vorabObjektwoerter: ['stehende glasvitrine', 'stehenden glasvitrine', 'rueckwandvitrine', 'vitrine an der rueckwand'],
    vorabVerboten: ['zerbrochen', 'eingeschlagen', 'scherbe', 'glasscherbe', 'splitter', 'glassplitter', 'aufgebrochen', 'aufgehebelt', 'gewaltsam geÃ¶ffnet', 'gewaltsam geoeffnet'],
    schluessel: ['vitrine', 'etui', 'zigarettenetui', 'silber', 'gravur', 'hugo', 'liesl', 'staub', 'samt', 'schmuck']
  }]
}];

problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'Theodor Krause ist oben in seiner Wohnung und stellt die Verlustliste zusammen. Hannelore Wirth wartet zwischen den Regalen und sieht dich reserviert an. Mehr sagt sie noch nicht.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert.strictEqual(problem, null, 'an arrival may introduce a witness without revealing the witness clue');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses AntiquitÃ¤ten',
  szene: 'Hannelore Wirth schrickt zusammen. Dann erkennt sie dich wieder und sagt: Herr Mauer.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert(problem && problem.code === 'unfounded_prior_visit' && problem.unearnedRecognition,
  'plain recognition wording must not invent a prior meeting on a first arrival');

context.caseProgress._begegnungen = [{ name: 'Hannelore Wirth', art: 'befragt', ort: 'Hackescher Markt' }];
problem = context.validateSceneWorldTruth({
  ort: 'Krauses AntiquitÃ¤ten',
  szene: 'Theodor Krause ist oben in seiner Wohnung und stellt die Verlustliste zusammen. Hannelore Wirth erkennt dich wieder und grÃ¼ÃŸt knapp.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert.strictEqual(problem, null,
  'recognition must remain legal after a documented prior encounter elsewhere');
context.caseProgress._begegnungen = [];

context.engineCurrentLocation = { name: 'Karl Mauers Buero' };
context.caseProgress.klientGesprochen = false;
problem = context.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause verspricht 200 Ostmark bei Rueckgabe. Du zaehlst die Scheine, die er auf den Schreibtisch legt.',
  personenImRaum: ['Theodor Krause'], optionen: []
}, null);
assert(problem && problem.code === 'client_payment_drift' && problem.opening,
  'the opening must not narrate payment before the stolen item is returned');

problem = context.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause verspricht dir 200 Ostmark, sobald du das Etui zurueckbringst.',
  personenImRaum: ['Theodor Krause'], optionen: []
}, null);
assert.strictEqual(problem, null,
  'the unpaid return-contingent fee must remain legal in the opening');

problem = context.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause zeigt auf das Etui. Es gehoerte meiner Liesl, sagt er.',
  personenImRaum: ['Theodor Krause'], optionen: []
}, null);
assert(problem && problem.code === 'target_provenance_drift' && problem.opening,
  'the silver-case dedication must not be inverted into Liesls ownership');

problem = context.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause erklaert: Liesl schenkte das Etui 1939 Hugo.',
  personenImRaum: ['Theodor Krause'], optionen: []
}, null);
assert.strictEqual(problem, null,
  'the canonical Liesl-to-Hugo provenance must remain legal');

problem = context.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause sagt: Liesl schenkte Hugo das Etui 1939 zur Hochzeit. Es war nichts fuer die Auslage.',
  personenImRaum: ['Theodor Krause'], optionen: []
}, { id: 'NPC_sozial_offen', _npcName: 'Theodor Krause', _clientDepartureAfterReply: 'Theodor Krause' });
assert(problem && problem.code === 'target_provenance_drift',
  'the engraving must not invent a wedding or deny the bound display-case location');

problem = context.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause sagt: Das Etui war Hugos Stolz. Es gehört zu einer Sammlung, die ich für einen Stammkunden sicher verwahrt habe.',
  personenImRaum: ['Theodor Krause'], optionen: []
}, { id: 'NPC_sozial_offen', _npcName: 'Theodor Krause', _clientDepartureAfterReply: 'Theodor Krause' });
assert(problem && problem.code === 'target_provenance_drift' && !problem.opening,
  'the family heirloom must not drift into customer-owned or consigned property');

problem = context.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause sagt: Das Etui war Hugos Erbstück. Ein Stammkunde hatte es vor dem Diebstahl in der Vitrine bewundert.',
  personenImRaum: ['Theodor Krause'], optionen: []
}, null);
assert.strictEqual(problem, null,
  'a customer may have admired the heirloom without being invented as its owner');

problem = context.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause sagt: Das Etui war Hugos Erbstück. Es war in meiner Familie, seit ich denken kann.',
  personenImRaum: ['Theodor Krause'], optionen: []
}, null);
assert(problem && problem.code === 'target_provenance_drift',
  'a 1939 dedication must not drift into childhood-long or multigenerational family ownership');

problem = context.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause sagt: Liesl schenkte Hugo das Etui 1939. Seit vierzehn Jahren ist es in unserer Familie.',
  personenImRaum: ['Theodor Krause'], optionen: []
}, null);
assert.strictEqual(problem, null,
  'the historically consistent fourteen-year family timespan must remain legal');
context.caseProgress.klientGesprochen = true;

problem = context.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause sagt: Es war kein Profi. Die haben mein Fenster im Hinterhof einfach eingeschlagen.',
  personenImRaum: ['Theodor Krause'], optionen: []
}, { id: 'NPC_sozial_offen', _npcName: 'Theodor Krause' });
assert(problem && problem.code === 'open_object_truth_contradiction',
  'an open hotspot physical truth must also bind client dialogue before the investigation click');

problem = context.validateSceneWorldTruth({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause nennt das gestohlene Etui und bittet dich, den Einbruch diskret zu untersuchen.',
  personenImRaum: ['Theodor Krause'], optionen: []
}, { id: 'NPC_sozial_offen', _npcName: 'Theodor Krause' });
assert.strictEqual(problem, null,
  'the client may state the assignment without revealing or contradicting an open forensic clue');
context.engineCurrentLocation = { name: context.getCaseLocations()[0].name };

problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'Hannelore Wirth sagt: Die beiden Maenner, die ich sah, kamen mit einer schweren Tasche aus dem Hinterhof; einer hinkte leicht.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert(problem && problem.code === 'arrival_evidence_leak',
  'a travel scene must not narrate Hannelores still-unawarded core clue');

problem = context.validateSceneWorldTruth({
  ort: context.engineCurrentLocation.name,
  szene: 'Hannelore Wirth sagt: In der Nacht von Dienstag auf Mittwoch habe ich zwei Gestalten aus dem Hinterhof kommen sehen.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert(problem && problem.code === 'arrival_evidence_leak',
  'a German perfect infinitive witness account must not bypass the arrival clue gate');

problem = context.validateSceneWorldTruth({
  ort: context.engineCurrentLocation.name,
  szene: 'Krause ist oben in seiner Wohnung und stellt die Verlustliste zusammen. Hannelore steht hinter der Theke und sieht dich beim Eintreten misstrauisch an.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert.strictEqual(problem, null,
  'a present-tense glance at Karl must not be mistaken for a premature witness account');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'Das Fenster ist splittrig aufgehebelt; die Kerben stammen eindeutig von einem Stemmeisen.',
  personenImRaum: [], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert(problem && problem.code === 'arrival_evidence_leak',
  'a travel scene must not perform the still-unawarded hotspot investigation');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'Krause ist oben in seiner Wohnung und stellt die Verlustliste zusammen. Eine leere Vitrine steht im Laden. Daneben wartet Hannelore schweigend.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert.strictEqual(problem, null, 'an arrival may show a hotspot prop without interpreting its evidence');

problem = context.validateSceneWorldTruth({
  ort: context.engineCurrentLocation.name,
  szene: 'Krause ist oben in seiner Wohnung und stellt die Verlustliste zusammen. Hannelore haelt ein Stueck der zerbrochenen flachen Schauvitrine aus der Ladenmitte in der Hand.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert.strictEqual(problem, null,
  'the shattered flat display tables visible in the canonical image must remain legal');

problem = context.validateSceneWorldTruth({
  ort: context.engineCurrentLocation.name,
  szene: 'Hannelore haelt ein Stueck der zerbrochenen stehenden Glasvitrine in der Hand.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert(problem && problem.code === 'open_object_truth_contradiction',
  'an arrival must not contradict the intact rear-cabinet truth of a still-open hotspot');

problem = context.validateSceneWorldTruth({
  ort: context.engineCurrentLocation.name,
  szene: 'Hannelore starrt auf die aufgebrochene Vitrine an der Rueckwand.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert(problem && problem.code === 'open_object_truth_contradiction',
  'a forced-open synonym must not bypass the intact display-case truth');

problem = context.validateSceneWorldTruth({
  ort: context.engineCurrentLocation.name,
  szene: 'Krause ist oben in seiner Wohnung und stellt die Verlustliste zusammen. Die stehende Glasvitrine an der Rueckwand ist intakt; ihre Tuer steht offen. Hannelore wartet daneben.',
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
  szene: 'Hannelore Wirth steht zwischen zwei Vitrinen und starrt auf eine leere Stelle im Samt.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert(problem && problem.code === 'arrival_evidence_leak',
  'an unnamed empty trace on the clue-specific velvet must not bypass the arrival gate');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'Krause ist oben in seiner Wohnung und stellt die Verlustliste zusammen. Die offene, leere Vitrine ist mit rotem Samt ausgeschlagen. Hannelore wartet schweigend daneben.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert.strictEqual(problem, null,
  'visible velvet without an empty trace or evidence relation must remain legal arrival atmosphere');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitäten',
  szene: 'Krause ist gerade erst weg. Hannelore wartet schweigend im Laden.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REDEN' });
assert(problem && problem.code === 'client_absence_unexplained',
  'Krauses absence after his explicit departure needs a canonical time-continuity explanation');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses AntiquitÃƒÂ¤ten',
  szene: 'Du betrittst den Laden. Hannelore Wirth steht hinter dem Tresen und mustert dich.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert(problem && problem.code === 'client_absence_unexplained',
  'the first travel arrival must explain Krauses location even when the prose omits him entirely');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses AntiquitÃ¤ten',
  szene: 'Krause ist nirgends zu sehen. Hannelore wartet hinter dem Tresen.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert(problem && problem.code === 'client_absence_unexplained',
  'natural not-visible wording must not bypass the client time-continuity gate');

problem = context.validateSceneWorldTruth({
  ort: 'Krauses AntiquitÃ¤ten',
  szene: 'Keine Spur von Krause. Hannelore wartet hinter dem Tresen.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert(problem && problem.code === 'client_absence_unexplained',
  'inverted absence wording must also require the canonical explanation');

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
  szene: 'Hannelore Wirth sagt: Zwei Männer kamen mit einer schweren Tasche aus dem Hinterhof. Als sie in den Wagen stiegen, zog ich mich vom Fenster zurück.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'NPC_sozial_ehrlich', _pendingIndizId: 'nachbarin_aussage' });
assert(problem && problem.code === 'evidence_scope_drift'
    && problem.extras.includes('Fluchtfahrzeug'),
  'the definite-article phrase "in den Wagen stiegen" must not bypass the target-clue scope gate');

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
  ort: context.engineCurrentLocation.name,
  szene: 'Hannelore Wirth sagt: Es war kurz vor Mitternacht. Zwei Maenner wuchteten die schwere Tasche in einen Wagen, der ohne Licht am Ende der Gasse stand.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'NPC_sozial_geschichte', _pendingIndizId: 'nachbarin_aussage' });
assert(problem && problem.code === 'evidence_scope_drift'
    && problem.extras.includes('exakte Uhrzeit')
    && problem.extras.includes('Fluchtfahrzeug'),
  'midnight wording and natural loading verbs must not bypass the target-clue scope gate');

problem = context.validateSceneWorldTruth({
  ort: context.engineCurrentLocation.name,
  szene: 'Hannelore Wirth sagt: Es war weit nach Mitternacht. Zwei Maenner trugen die schwere Tasche zum Wagen, der in der Gasse wartete.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'NPC_sozial_offen', _pendingIndizId: 'nachbarin_aussage' });
assert(problem && problem.code === 'evidence_scope_drift'
    && problem.extras.includes('exakte Uhrzeit')
    && problem.extras.includes('Fluchtfahrzeug'),
  'wide-after-midnight and carry-to-a-waiting-car wording must not bypass the clue scope');

problem = context.validateSceneWorldTruth({
  ort: context.engineCurrentLocation.name,
  szene: 'Hannelore Wirth sagt: Zwei Männer trugen eine schwere Tasche aus dem Hinterhof; einer der beiden stolperte fast über seine eigenen Füße.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'NPC_sozial_geschichte', _pendingIndizId: 'nachbarin_aussage' });
assert(problem && problem.code === 'evidence_scope_drift'
    && problem.extras.includes('Körpermerkmal/Gangart'),
  'offender-specific stumbling must not add an invented gait fact to the awarded witness clue');

problem = context.validateSceneWorldTruth({
  ort: context.engineCurrentLocation.name,
  szene: 'Hannelore stolpert kurz über ihre Worte, dann sagt sie: Zwei Männer trugen eine schwere Tasche aus dem Hinterhof.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'NPC_sozial_geschichte', _pendingIndizId: 'nachbarin_aussage' });
assert.strictEqual(problem, null,
  'the witness stumbling over her own words must not be mistaken for an offender gait fact');

problem = context.validateSceneWorldTruth({
  ort: context.engineCurrentLocation.name,
  szene: 'Hannelore sagt: Zwei Männer trugen eine schwere Tasche aus dem Hinterhof. Sie wirkten nicht wie Einheimische.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'NPC_sozial_ehrlich', _pendingIndizId: 'nachbarin_aussage' });
assert(problem && problem.code === 'evidence_scope_drift'
    && problem.extras.includes('Herkunft/Ortsfremdheit'),
  'an awarded witness clue must reject an invented offender origin');

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
problem = context.validateSceneWorldTruth({
  ort: 'Krauses Antiquitaeten',
  szene: 'Niemand hier gibt vor, dir schon früher begegnet zu sein. Du prüfst die sichtbaren Ansatzpunkte.',
  personenImRaum: ['Hannelore Wirth'], optionen: []
}, { id: 'REISE', _istReise: true });
assert(problem && problem.code === 'meta_instruction_leak',
  'visible fallback and first-visit control language must never reach the player');

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

const fixedInteriorContext = {
  caseProgress: { reiseLog: [] },
  engineCurrentLocation: { name: 'Karl Mauers Buero' },
  normForMatch,
  _istKesslerFallFuerBild: () => true,
  _kesslerBildIstInnenraum: () => true,
  _kesslerInnenraumTextPasst: text => /\b(?:buero|innenraum)\b/.test(normForMatch(text))
};
vm.createContext(fixedInteriorContext);
vm.runInContext(sourceOf('_findFixedInteriorImageDrift'), fixedInteriorContext);
assert.strictEqual(fixedInteriorContext._findFixedInteriorImageDrift({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause nennt die Gravur und verabschiedet sich.',
  personenImRaum: []
}, { id: 'NPC_befragen', _npcName: 'Theodor Krause' }), null,
  'an ongoing social scene may leave its already established interior implicit');
const sparseArrival = fixedInteriorContext._findFixedInteriorImageDrift({
  ort: 'Karl Mauers Buero',
  szene: 'Theodor Krause wartet am Gehweg.',
  personenImRaum: ['Theodor Krause']
}, { id: 'REISE', _istReise: true, _intent: { type: 'travel' } });
assert(sparseArrival && sparseArrival.code === 'fixed_interior_image_drift',
  'a travel arrival must still establish and end in the fixed interior image');

console.log('WORLD_TRUTH_HARD_GUARD_OK');
