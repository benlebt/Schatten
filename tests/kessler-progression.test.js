const assert = require('assert');
const fs = require('fs');
const path = require('path');

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
assert(!html.includes('Margot Kessler'), 'interrogation file must name client Edith Kessler');

assert(/function _hauptuiFundAuswahl[\s\S]{0,1000}?_zeigeFundAuswahl\(selectedItems, selectedClues\)/.test(html), 'scene targets must use the deterministic find dialog');
assert(/function _verhoerFinish[\s\S]{0,900}?_markiereIndizGefunden\(ind, \{ reward: false \}\)/.test(html), 'solved interrogations must book evidence without leaking a delayed global reward popup');
assert(html.includes("if (document.getElementById('indiz-belohnung-overlay')) return;"), 'reward flush must preserve queued clues while another reward popup is open');
assert(html.includes("setTimeout(function () { try { if (typeof _flushIndizRewards === 'function') _flushIndizRewards();"), 'closing a reward popup must continue with queued clue rewards');
assert(/robert_kessler:\s*\{[\s\S]{0,500}?grantIndizId:\s*'robert_aussage'/.test(html), 'Robert Kessler must use the interrogation dossier instead of the legacy AI dialogue');
assert(/id:\s*'robert_aussage'[\s\S]{0,300}?npc:\s*'robert_kessler'/.test(html), 'Robert interrogation must grant a defined Kessler clue');
assert((html.match(/themen:\s*\[/g) || []).length >= 3, 'all three Kessler dossiers need character-specific question trees');
assert(html.includes('function _verhoerThema(id)'), 'dossier topics need their own deterministic interaction path');
assert(html.includes('data-vthema='), 'dossier UI must render topic-driven questions');
assert(!html.includes('<div class="vlabel">DEIN VORGEHEN</div>'), 'generic interrogation tactics must no longer be the primary dossier UI');
assert(html.includes('Ergibt sich aus dem Gespräch'), 'deeper questions must visibly unlock from prior answers');
assert(/frau_pohl:[\s\S]{0,500}?requiredTopics:\s*\['robert', 'mittwoch', 'hauke'\]/.test(html), 'Pohl must require her decisive topic chain instead of any three clicks');
assert(/ilse_hauke:[\s\S]{0,500}?unlockEvidenceAny:\s*\['tuerschild_hauke', 'robert_eintritt_beobachtet'\]/.test(html), 'Ilse dossier must require a concrete lead first');
assert(/robert_kessler:[\s\S]{0,700}?requiredEvidenceAny:/.test(html), 'Robert confession must require an independent external clue');
assert(/definedEvidenceGate:[\s\S]{0,300}?requiredAny:/.test(html), 'Kessler resolution must require evidence from another location');

console.log('KESSLER_PROGRESSION_AND_VERHOER_OK');
