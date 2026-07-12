const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const caseStart = html.indexOf("klient: 'Edith Kessler (Ehefrau)'");
const caseEnd = html.indexOf('anchorNpcs:', caseStart);
assert(caseStart > -1 && caseEnd > caseStart, 'Kessler setup not found');
const kessler = html.slice(caseStart, caseEnd);

assert(/definedEvidenceGate:\s*\{[\s\S]{0,180}?minFound:\s*4,[\s\S]{0,80}?minBurdening:\s*1,[\s\S]{0,180}?requiredAny:/.test(kessler), 'Kessler evidence gate must require four clues including an independent location');

const earlyEvidence = [
  'tuerschild_hauke',
  'robert_eintritt_beobachtet',
  'nachbarin_aussage',
  'edith_verdacht',
  'tetzlaff_aussage',
  'kellner_beobachtung',
  'robert_tisch_beobachtet',
];
const stageThreeEvidence = ['ilse_aussage', 'fenster_beobachtung', 'briefchen_ilse'];

for (const id of earlyEvidence) {
  assert(kessler.includes("id: '" + id + "'"), 'missing early evidence: ' + id);
}
for (const id of stageThreeEvidence) {
  const pattern = new RegExp("id: '" + id + "'[\\s\\S]{0,900}?stage: 3, abStage: 2");
  assert(pattern.test(kessler), 'stage-three evidence must unlock at stage 2: ' + id);
}

assert(/window\.VERHOER_PILOT_AKTIV\s*=\s*true/.test(html), 'interrogation pilot must be enabled');
assert(/frau_pohl:\s*\{[\s\S]{0,400}?grantIndizId:\s*'nachbarin_aussage'/.test(html), 'Frau Pohl interrogation grant missing');
assert(/ilse_hauke:\s*\{[\s\S]{0,400}?grantIndizId:\s*'ilse_aussage'/.test(html), 'Ilse interrogation grant missing');
assert(/norbert_tetzlaff:\s*\{[\s\S]{0,500}?grantIndizId:\s*'tetzlaff_aussage'/.test(html), 'Norbert Tetzlaff must use the Kessler interrogation dossier');
assert(/oberkellner_voss:\s*\{[\s\S]{0,500}?grantIndizId:\s*'kellner_beobachtung'/.test(html), 'Oberkellner Voss must use the Kessler interrogation dossier');
assert(!html.includes('Margot Kessler'), 'interrogation file must name client Edith Kessler');

assert(/function _hauptuiFundAuswahl[\s\S]{0,1200}?_fundItemAufnehmenDirekt\(selectedItems\[0\]/.test(html), 'concrete scene item targets must use the deterministic direct acquire path');
assert(/function _verhoerFinish[\s\S]{0,900}?_markiereIndizGefunden\(ind, \{ reward: false \}\)/.test(html), 'solved interrogations must book evidence without leaking a delayed global reward popup');
assert(html.includes("if (document.getElementById('indiz-belohnung-overlay')) return;"), 'reward flush must preserve queued clues while another reward popup is open');
assert(html.includes("setTimeout(function () { try { if (typeof _flushIndizRewards === 'function') _flushIndizRewards();"), 'closing a reward popup must continue with queued clue rewards');
assert(html.includes("last.suppressed = 'modal-active'"), 'normal toasts must be suppressed behind blocking modals');
assert(html.includes("document.querySelectorAll('.schatten-toast').forEach"), 'reward popups must clear stale background toasts');
assert(/robert_kessler:\s*\{[\s\S]{0,500}?grantIndizId:\s*'robert_aussage'/.test(html), 'Robert Kessler must use the interrogation dossier instead of the legacy AI dialogue');
assert(/id:\s*'robert_aussage'[\s\S]{0,300}?npc:\s*'robert_kessler'/.test(html), 'Robert interrogation must grant a defined Kessler clue');
assert(/name:\s*'Wachtmeister Eugen Hellbach', id:\s*'wachtmeister_eugen_hellbach'/.test(kessler), 'Hellbach must have a stable id so optional threat spawns can resolve him');
assert(/name:\s*'Hinterhof Sybelstrasse'[\s\S]{0,900}?bedrohungen:\s*\[[\s\S]{0,400}?id:\s*'wachtmeister_eugen_hellbach'[\s\S]{0,220}?abStage:\s*2/.test(kessler), 'Kessler needs an optional gated Hellbach confrontation after the first observations');
assert(/id:\s*'wachtmeister_eugen_hellbach'[\s\S]{0,180}?chance:\s*100,[\s\S]{0,80}?einmalig:\s*true/.test(kessler), 'Kessler tutorial threat should reliably fire once instead of feeling absent');
assert(html.includes('Niemand bleibt unerklaert gefesselt oder K.O. am Tatort liegen.'), 'Kessler-style physical confrontations must resolve bound NPCs before the finale cuts away');
assert(/function resolveThreatSpawn[\s\S]{0,900}?const stage =[\s\S]{0,700}?abStage[\s\S]{0,180}?bisStage/.test(html), 'threat spawns must support stage gates for optional confrontations');
assert(/function resolveThreatSpawn[\s\S]{0,1200}?_threatEinmalig[\s\S]{0,1600}?einmalige Konfrontation bereits verbraucht/.test(html), 'one-shot threats must be remembered after they fire');
assert((html.match(/themen:\s*\[/g) || []).length >= 5, 'all Kessler witness dossiers need character-specific question trees');
assert(html.includes('function _verhoerThema(id)'), 'dossier topics need their own deterministic interaction path');
assert(html.includes('data-vthema='), 'dossier UI must render topic-driven questions');
assert(!html.includes('<div class="vlabel">DEIN VORGEHEN</div>'), 'generic interrogation tactics must no longer be the primary dossier UI');
assert(html.includes('Ergibt sich aus dem Gespräch'), 'deeper questions must visibly unlock from prior answers');
assert(/frau_pohl:[\s\S]{0,500}?requiredTopics:\s*\['robert', 'mittwoch', 'hauke'\]/.test(html), 'Pohl must require her decisive topic chain instead of any three clicks');
assert(/ilse_hauke:[\s\S]{0,500}?unlockEvidenceAny:\s*\['tuerschild_hauke', 'robert_eintritt_beobachtet'\]/.test(html), 'Ilse dossier must require a concrete lead first');
assert(/robert_kessler:[\s\S]{0,700}?requiredEvidenceAny:/.test(html), 'Robert confession must require an independent external clue');
assert(/definedEvidenceGate:[\s\S]{0,300}?requiredAny:/.test(html), 'Kessler resolution must require evidence from another location');
assert(html.includes("leadTitle.textContent = 'Offene Fäden'"), 'Kessler UI must expose the active investigation questions');
assert(html.includes("oeffneReiseMenue();"), 'external investigation threads must open the travel map');
assert((html.match(/frageLimit:\s*4/g) || []).length >= 3, 'each Kessler interrogation needs a finite question window');
assert(html.includes('Gesprächsspielraum:'), 'the dossier must warn the player about the remaining question window');
assert(/function _verhoerScheitern[\s\S]{0,900}?karlAkte\.ruf\.renommee\s*=\s*Math\.max\(-5,[\s\S]{0,120}?-\s*1\)/.test(html), 'failed interrogations must have a real reputation consequence');
assert(html.includes('function _verhoerRufMod(npcId)'), 'interrogations must translate Karl reputation into concrete NPC behavior');
assert(html.includes('function _verhoerFrageLimit(npcId, state)'), 'interrogation question windows must be reputation-adjusted');
assert(html.includes('<b>Rufwirkung:</b>'), 'the dossier must visibly explain reputation effects to the player');
assert(html.includes('function _exportVerhoerVerlaeufe()'), 'transcript export must include interrogation histories');
assert(/function buildTranscriptText[\s\S]{0,5000}?_exportVerhoerVerlaeufe\(\)/.test(html), 'buildTranscriptText must append interrogation histories to exported runs');
assert(html.includes('Genutzte Themen:') && html.includes('Noch offen:'), 'interrogation export must show used and missing required topics');
assert(html.includes('Genutzte Vorhalte:') && html.includes('Gescheiterte Verhöre:'), 'interrogation export must show evidence confrontations and failed dossiers');
assert(html.includes('function _verhoerVorhaltBereit(npcId, belegId)'), 'interrogation evidence prompts need an explicit readiness guard');
assert(html.includes("s.themenUsed.dienstplan = true;"), 'Tetzlaff letter prompt must also satisfy the Dienstplan contradiction');
assert(html.includes('const vhAlle = _verhoerVerfuegbareVorhalte();'), 'interrogation UI must distinguish all evidence from currently clickable evidence');
assert(html.includes('function zeigeFallLoesenBestaetigung(resolveOpt)'), 'case resolve must show an explicit confirmation overlay');
assert(html.includes('function _caseResolveTruthChoices()'), 'truth/observation cases need a dedicated resolution choice builder');
assert(html.includes('function zeigeAbschlussWahrheitswahl(resolveOpt)'), 'Kessler-style truth cases need a final truth-choice overlay');
assert(html.includes('caseProgress.abschlussWahl = o.wahl'), 'the chosen truth ending must persist in case progress');
assert(/function _caseResolveTruthChoices[\s\S]{0,1600}?briefchen_ilse[\s\S]{0,1800}?brief_offenlegen/.test(html), 'Ilse letter must unlock a distinct Kessler ending');
assert(/function _resolveBestaetigt[\s\S]{0,650}?botActive[\s\S]{0,900}?_caseHasTruthFork[\s\S]{0,240}?zeigeAbschlussWahrheitswahl\(resolveOpt\)/.test(html), 'manual resolve must route truth forks to the final choice without trapping the bot');
assert(/function _resolveOderMoral[\s\S]{0,900}?botActive[\s\S]{0,220}?_resolveBestaetigt\(resolveOpt\)[\s\S]{0,650}?zeigeFallLoesenBestaetigung\(resolveOpt\)/.test(html), 'plain human resolve clicks must ask for confirmation while bot runs bypass it');
assert(html.includes('function _indizDurchVerbranntesVerhoerGesperrt(ind)'), 'burned interrogations need a shared clue reachability guard');
assert(html.includes('function _indizDurchVerhoerNichtMehrOffen(ind)'), 'closed interrogations need a shared clue reachability guard');
assert(/function offeneIndizienAmOrtNachErreichbarkeit[\s\S]{0,2600}?_indizDurchVerhoerNichtMehrOffen\(ind\)/.test(html), 'travel map must not advertise clues locked behind burned or closed interrogations');
assert(/function _npcHatOffenenHinweis[\s\S]{0,1200}?_indizDurchVerhoerNichtMehrOffen\(ind\)/.test(html), 'NPC hint badges must hide burned or closed interrogation clues');
assert(/function pickZielIndiz[\s\S]{0,1200}?_indizDurchVerhoerNichtMehrOffen\(ind\)/.test(html), 'AI target clue picker must skip burned or closed interrogation clues');

const interrogationStart = html.indexOf('const VERHOER_BELEG_LABEL');
const interrogationEnd = html.indexOf('function _verhoerInjectStyle', interrogationStart);
assert(interrogationStart > -1 && interrogationEnd > interrogationStart, 'interrogation state machine block not found');

let failedNpc = null;
const context = {
  console,
  window: {},
  caseProgress: { verhoere: {}, aussagen: [], gefundeneIndizIds: [], verhoerFehlschlaege: [] },
  saveGameState: function () {},
  _verhoerScheitern: function (npcId) { failedNpc = npcId; },
  _findeIndizById: function (id) { return { id, text: 'Testindiz ' + id }; },
  _markiereIndizGefunden: function () {},
  diag: function () {},
  _uiAudit: function () {},
  _verhoerRender: function () {},
  escapeHtml: function (value) { return String(value || ''); },
  karlAkte: { ruf: { haerte: 0, renommee: 0 } },
};
vm.createContext(context);
vm.runInContext(
  html.slice(interrogationStart, interrogationEnd)
    + '\nthis.__verhoerTest = { profile: VERHOER_PROFILE, fresh: _verhoerFreshState, topicTurn: _verhoerTopicTurn, thema: _verhoerThema, vorhalt: _verhoerVorhalt, vorhaltBereit: _verhoerVorhaltBereit, rufMod: _verhoerRufMod, frageLimit: _verhoerFrageLimit };',
  context
);

context.karlAkte = { ruf: { haerte: 0, renommee: 3 } };
let goodRep = context.__verhoerTest.fresh('frau_pohl');
assert(goodRep.oeff >= 1, 'good reputation must make normal witnesses start more open');
assert.strictEqual(context.__verhoerTest.frageLimit('frau_pohl', goodRep), 5, 'good reputation must add interrogation room');

context.karlAkte = { ruf: { haerte: 0, renommee: -3 } };
let badFirst = context.__verhoerTest.fresh('frau_pohl');
assert.strictEqual(context.__verhoerTest.frageLimit('frau_pohl', badFirst), 4, 'bad reputation must not shorten the first interrogation of a fresh case');
context.caseProgress.verhoere = { bereits_begonnen: { status: 'vertagt' } };
let badRep = context.__verhoerTest.fresh('frau_pohl');
assert(badRep.gem >= 1, 'bad reputation must make witnesses start more tense');
assert.strictEqual(context.__verhoerTest.frageLimit('frau_pohl', badRep), 3, 'bad reputation must reduce interrogation room without hard-blocking');

context.karlAkte = { ruf: { haerte: 3, renommee: 0 } };
let hardRobert = context.__verhoerTest.fresh('robert_kessler');
assert(hardRobert.oeff >= 1 && hardRobert.gem >= 1, 'a hard reputation must make hard targets take Karl seriously but guarded');
let hardPohl = context.__verhoerTest.fresh('frau_pohl');
assert(hardPohl.gem >= 1, 'a hard reputation must make civilian witnesses nervous');
assert.strictEqual(context.__verhoerTest.frageLimit('frau_pohl', hardPohl), 3, 'a hard reputation must reduce civilian witness patience');
context.karlAkte = { ruf: { haerte: 0, renommee: 0 } };

const variants = new Set();
const pohlTopic = context.__verhoerTest.profile.frau_pohl.themen.find((topic) => topic.id === 'robert');
for (let seed = 1; seed <= 50; seed++) {
  variants.add(context.__verhoerTest.topicTurn('frau_pohl', pohlTopic, { variationSeed: seed }).q);
}
assert(variants.size >= 2, 'interrogation prose must vary between new runs');

const tetzlaffTopic = context.__verhoerTest.profile.norbert_tetzlaff.themen.find((topic) => topic.id === 'dienstplan');
assert(tetzlaffTopic, 'Tetzlaff needs a Dienstplan topic in the dossier');

function startPohl() {
  failedNpc = null;
  context.karlAkte = { ruf: { haerte: 0, renommee: 0 } };
  context.caseProgress.verhoere = {};
  context.caseProgress.aussagen = [];
  context.caseProgress.gefundeneIndizIds = [];
  context.window._verhoerAktNpc = { id: 'frau_pohl', name: 'Frau Pohl' };
  context.caseProgress.verhoere.frau_pohl = context.__verhoerTest.fresh('frau_pohl');
  context.caseProgress.verhoere.frau_pohl.variationSeed = 7;
  return context.caseProgress.verhoere.frau_pohl;
}

function startTetzlaffWithLetter() {
  failedNpc = null;
  context.karlAkte = { ruf: { haerte: 0, renommee: 0 } };
  context.caseProgress.verhoere = {};
  context.caseProgress.aussagen = [];
  context.caseProgress.gefundeneIndizIds = ['briefchen_ilse'];
  context.window._verhoerAktNpc = { id: 'norbert_tetzlaff', name: 'Norbert Tetzlaff' };
  context.caseProgress.verhoere.norbert_tetzlaff = context.__verhoerTest.fresh('norbert_tetzlaff');
  context.caseProgress.verhoere.norbert_tetzlaff.variationSeed = 11;
  return context.caseProgress.verhoere.norbert_tetzlaff;
}

let state = startPohl();
context.__verhoerTest.thema('robert');
context.__verhoerTest.thema('mittwoch');
context.__verhoerTest.thema('hauke');
assert.strictEqual(state.status, 'gelöst', 'the concise, relevant question chain must succeed');
assert.strictEqual(failedNpc, null, 'the correct question chain must not trigger failure');

state = startPohl();
context.__verhoerTest.thema('haus');
context.__verhoerTest.thema('klatsch');
context.__verhoerTest.thema('robert');
context.__verhoerTest.thema('mittwoch');
assert.strictEqual(state.status, 'verbrannt', 'too many detours must end the interrogation without success');
assert.strictEqual(failedNpc, 'frau_pohl', 'question-window failure must use the real failure path');

state = startTetzlaffWithLetter();
assert.strictEqual(context.__verhoerTest.vorhaltBereit('norbert_tetzlaff', 'briefchen_ilse'), false, 'Tetzlaff letter must not be clickable before his contradiction is on the table');
context.__verhoerTest.vorhalt('briefchen_ilse');
assert.strictEqual(state.genutzteHebelIds.length, 0, 'locked Tetzlaff letter prompt must not be consumed by a premature click');
state.oeff = 1;
assert.strictEqual(context.__verhoerTest.vorhaltBereit('norbert_tetzlaff', 'briefchen_ilse'), true, 'Tetzlaff letter must become ready after the interrogation opens up');
context.__verhoerTest.vorhalt('briefchen_ilse');
assert(state.genutzteHebelIds.includes('briefchen_ilse'), 'ready Tetzlaff letter prompt must be consumed exactly when used');
assert(state.themenUsed.dienstplan && state.themenUsed.mittwoch, 'ready Tetzlaff letter prompt must satisfy the real contradiction topics');
assert.strictEqual(state.status, 'gelöst', 'ready Tetzlaff letter prompt must resolve the dossier');
assert.strictEqual(failedNpc, null, 'ready Tetzlaff letter prompt must not trigger failure');

console.log('KESSLER_PROGRESSION_AND_VERHOER_OK');
