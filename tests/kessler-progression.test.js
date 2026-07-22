const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const caseStart = html.indexOf("klient: 'Edith Kessler (Ehefrau)'");
const caseEnd = html.indexOf('anchorNpcs:', caseStart);
assert(caseStart > -1 && caseEnd > caseStart, 'Kessler setup not found');
const kessler = html.slice(caseStart, caseEnd);

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

assert(/definedEvidenceGate:\s*\{[\s\S]{0,180}?minFound:\s*4,[\s\S]{0,80}?minBurdening:\s*1,[\s\S]{0,180}?requiredAny:/.test(kessler),
  'Kessler evidence gate must still require four clues and an independent source');
assert(kessler.includes("abschlussOrt: 'Karl Mauers Büro'"),
  'Kessler resolution must move to a real telephone at the office instead of inventing a booth under the old header');

const nameDisplay = {
  window: {},
  caseSetup: { caseType: 'beschatten', klient: 'Edith Kessler (Ehefrau)' },
  caseProgress: { stage: 2, gefundeneIndizIds: ['tuerschild_hauke'] },
  gameDay: 1,
  npcMisstrauisch: {},
  npcVerprelltAmTag: {},
  showProgressToast: (title, text) => nameDisplay.toasts.push({ title, text }),
  saveGameState: () => {},
  toasts: [],
  normForMatch: (value) => String(value || '').toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').trim(),
};
vm.createContext(nameDisplay);
vm.runInContext([
  sourceOf('_kesslerIstPrivatfall'),
  sourceOf('_kesslerIlseVornameBekannt'),
  sourceOf('_kesslerIlseVertrauensRevealAktion'),
  sourceOf('_kesslerIlseRevealAktion'),
  sourceOf('_kesslerIlseGestandnisSzene'),
  sourceOf('_kesslerMaskIlseText'),
  sourceOf('_kesslerMaskPromptMessages'),
  sourceOf('sanitizeSceneKesslerHiddenName'),
  sourceOf('_npcAnzeigename'),
  sourceOf('_npcRedeName'),
  sourceOf('_sozialTonartTagKey'),
  sourceOf('_sozialKonsequenzAnwenden'),
].join('\n'), nameDisplay);
assert.strictEqual(nameDisplay._npcAnzeigename('Ilse Hauke', 'ilse_hauke'), 'Frau Hauke',
  'the doorplate must not leak Ilse Hauke\'s first name into the target UI');
assert.strictEqual(nameDisplay._npcRedeName('Ilse Hauke'), 'Frau Hauke',
  'social toasts must use Frau Hauke instead of shortening the hidden canonical name to Ilse');
nameDisplay.caseProgress.gefundeneIndizIds.push('ilse_aussage');
nameDisplay.caseProgress.gefundeneIndizIds.push('briefchen_ilse');
assert.strictEqual(nameDisplay._npcAnzeigename('Ilse Hauke', 'ilse_hauke'), 'Frau Hauke',
  'talking to Frau Hauke or finding an I.-signed letter must not reveal her first name');

const promptMessages = [
  { role: 'user', content: 'Setup-Cast: Ilse Hauke. Robert und Ilse am Fenster. Vor Ilses Tür. Frau Ilse Hauke wartet.' },
  { role: 'assistant', content: 'Ilse Hauke ist intern bekannt.' },
];
assert.strictEqual(nameDisplay._kesslerMaskPromptMessages(promptMessages, 'Durchs Fenster spähen'), true,
  'ordinary Kessler prompts must be masked before the API call');
assert(!promptMessages.some((entry) => /\bIlse(?:s|\s+Hauke)?\b/.test(entry.content)),
  'no prompt channel may retain Ilse before Robert confesses');
assert(!promptMessages.some((entry) => /Frau Frau Hauke/.test(entry.content)),
  'masking an already titled model name must not duplicate Frau');

const leakedScene = {
  szene: 'Das Fenster gehört Ilse Hauke. Ilse tritt näher.',
  optionen: [{ text: 'Frag Ilse nach Robert.' }],
  npc_kernhinweis: [{ npc: 'frau_hauke', hinweis: 'Ilse Hauke kennt Robert.' }],
};
nameDisplay.sanitizeSceneKesslerHiddenName(leakedScene, 'Durchs Fenster spähen');
assert(!/\bIlse(?:s|\s+Hauke)?\b/.test(leakedScene.szene + ' ' + leakedScene.optionen[0].text + ' ' + leakedScene.npc_kernhinweis[0].hinweis),
  'post-output guard must neutralize prose, option, and memory leaks deterministically');

const confession = {
  szene: 'Robert räumt ein, dass seine Mittwochs-Überstunden Besuche bei Ilse Hauke waren und er Edith belogen hat.',
  optionen: [],
};
nameDisplay.sanitizeSceneKesslerHiddenName(confession, 'Stell Robert Kessler mit den Beweisen zur Rede');
assert(confession.szene.includes('Ilse Hauke'),
  'Robert\'s mature evidence confrontation must retain the intended first-name reveal');
assert.strictEqual(nameDisplay.caseProgress.kesslerIlseVornameBekannt, true,
  'a visibly spoken first name must persist the explicit reveal state');
nameDisplay.caseProgress.gefundeneIndizIds.push('robert_aussage');
assert.strictEqual(nameDisplay._npcAnzeigename('Ilse Hauke', 'ilse_hauke'), 'Ilse Hauke',
  'the canonical full name must become visible only after a visible reveal');
assert.strictEqual(nameDisplay._npcRedeName('Ilse Hauke'), 'Ilse',
  'social toasts may use Ilse only after the visible reveal has been persisted');

nameDisplay.caseProgress.kesslerIlseVornameBekannt = false;
nameDisplay.window._letzteAktion = {
  npcId: 'ilse_hauke', sozialErfolg: false, sozialTonart: 'drohen'
};
const aggressiveLeak = { szene: 'Ilse zuckt zusammen und verschließt sich.', optionen: [] };
nameDisplay.sanitizeSceneKesslerHiddenName(aggressiveLeak, 'Mit dem Auffliegen drohen');
assert(!/\bIlse\b/.test(aggressiveLeak.szene),
  'the internally booked Robert clue must not leak Ilse on a failed aggressive path');
assert.strictEqual(nameDisplay._npcAnzeigename('Ilse Hauke', 'ilse_hauke'), 'Frau Hauke',
  'a failed aggressive approach must keep the guarded UI name despite robert_aussage');
nameDisplay._sozialKonsequenzAnwenden({ id: 'ilse_hauke', name: 'Ilse Hauke' }, {
  _sozialTonart: 'amtlich', _sozialVerprelltDanach: true,
});
assert.strictEqual(nameDisplay.toasts.length, 1, 'the aggressive social failure must emit its consequence toast');
assert(/Frau Hauke wendet sich ab/.test(nameDisplay.toasts[0].title),
  'the visible consequence toast must retain the reveal-safe surname');
assert(!/\bIlse\b/.test(nameDisplay.toasts[0].title + ' ' + nameDisplay.toasts[0].text),
  'the visible consequence toast must not leak Ilse before her name reveal');

nameDisplay.window._letzteAktion = {
  npcId: 'ilse_hauke', sozialErfolg: true, sozialTonart: 'diskretion'
};
const trustPrompt = [{ role: 'user', content: 'Karl sichert Frau Hauke Diskretion zu.' }];
assert.strictEqual(nameDisplay._kesslerMaskPromptMessages(trustPrompt, 'Diskretion zusichern'), false,
  'the successful trust path must be allowed to earn the first-name reveal');
assert(trustPrompt[0].content.includes('VERTRAUENS-REVEAL'),
  'the model must receive an explicit introduction instruction on the trust path');
const trustScene = { szene: 'Frau Hauke zögert. „Ilse Hauke“, sagt sie schließlich.', optionen: [] };
nameDisplay.sanitizeSceneKesslerHiddenName(trustScene, 'Diskretion zusichern');
assert.strictEqual(nameDisplay.caseProgress.kesslerIlseVornameBekannt, true,
  'Ilse introducing herself on the trust path must persist the reveal');
assert(html.includes("anzeigename: (typeof _npcAnzeigename === 'function'"),
  'Haupt-UI person targets must carry the guarded display name');
assert(kessler.includes('Brief an Robert, mit "I." unterzeichnet'),
  'the inventory clue itself must not label the signer as Ilse before the reveal');

for (const id of [
  'tuerschild_hauke', 'robert_eintritt_beobachtet', 'nachbarin_aussage',
  'edith_verdacht', 'tetzlaff_aussage', 'kellner_beobachtung',
  'ilse_aussage', 'fenster_beobachtung', 'briefchen_ilse', 'robert_aussage',
]) {
  assert(kessler.includes("id: '" + id + "'"), 'missing Kessler evidence: ' + id);
}

assert(/window\.VERHOER_PILOT_AKTIV\s*=\s*false/.test(html),
  'the separate Kessler dossier must remain disabled');
assert(!html.includes('<h3>Verhörakte</h3>'),
  'player help must not advertise the retired dossier UI');
assert(html.includes('<h3>Gespräche</h3>'),
  'player help must explain the unified conversation model');
assert(/function _hauptuiVerhoerNpc[\s\S]{0,180}?if \(!window\.VERHOER_PILOT_AKTIV\) return null;/.test(html),
  'Haupt-UI must not resolve dossier profiles while the pilot is disabled');
assert(/verb && verb\._verhoerOeffnen && window\.VERHOER_PILOT_AKTIV/.test(html),
  'stale dossier commands must not open the overlay');
assert(/function oeffneVerhoerAkte\(npc\)[\s\S]{0,120}?if \(!window\.VERHOER_PILOT_AKTIV/.test(html),
  'the retired dossier entry point itself must reject every new open attempt');

for (const copy of [
  'Offen sagen, dass Karl Privatdetektiv ist',
  'Diskretion zusichern',
  'Für Hinweis zahlen ({preis} Ostmark / Ware) · Renommee +1',
  'Eine klare Antwort fordern · Härte +1, Renommee −1',
  'Am Kragen packen · Härte +2, Renommee −2',
  'Ein großzügiges Trinkgeld geben',
  'Ruhig über seine Mittwoche reden',
  'Mit den Belegen konfrontieren',
  'Eine klare Antwort fordern',
]) {
  assert(kessler.includes(copy), 'missing unified Kessler conversation action: ' + copy);
}
assert(/name: 'Robert Kessler'[\s\S]{0,2200}?sozial:\s*\{[\s\S]{0,120}?tonarten:\s*\[/.test(kessler),
  'Robert must use the same direct conversation-action model as other witnesses');
assert(/name: 'Norbert Tetzlaff'[\s\S]{0,1400}?direktStattInformant: true/.test(kessler),
  'Tetzlaff must bypass the coarse informant shortcut and expose his own conversation choices');
assert(/key: 'kragen'[\s\S]{0,260}?kategorie: 'OFFENSIV'[\s\S]{0,180}?rufHaerte: 2[\s\S]{0,100}?rufRenommee: -2/.test(kessler),
  'Tetzlaff collar escalation must be allowed and carry the promised reputation price');
assert(html.includes('function _sozialTonartenMitEskalation(setup)'),
  'the escalation-freedom rule must also apply to other developed social NPCs');
assert(/id: 'robert_aussage'[\s\S]{0,320}?actions: \['ANSPRECHEN','BEFRAGEN','KONFRONTIEREN'\]/.test(kessler),
  'normal Robert conversation actions must still be able to grant the confession clue');

const compatibility = {
  window: { VERHOER_PILOT_AKTIV: false },
  caseProgress: {
    verhoere: { ilse_hauke: { status: 'verbrannt' } },
    verhoerFehlschlaege: ['ilse_hauke'],
  },
  normForMatch: (value) => String(value || '').toLowerCase(),
};
vm.createContext(compatibility);
vm.runInContext(sourceOf('_indizDurchVerbranntesVerhoerGesperrt'), compatibility);
assert.strictEqual(compatibility._indizDurchVerbranntesVerhoerGesperrt({
  id: 'ilse_aussage', npc: 'ilse_hauke', quelle: 'person',
}), false, 'retired dossier failures must not burn normal person clues in old saves');

const reputation = {
  karlAkte: { ruf: { renommee: 0, haerte: 0 } },
  caseProgress: {},
  gameDay: 2,
  normForMatch: (value) => String(value || '').toLowerCase(),
  _karlAkteSave: () => {},
  saveGameState: () => {},
  showProgressToast: () => {},
};
vm.createContext(reputation);
vm.runInContext(sourceOf('_sozialTonartTagKey') + '\n' + sourceOf('_sozialRufAnwenden'), reputation);
const kragenVerb = {
  _sozialTonart: 'kragen', _sozialRufRenommee: -2, _sozialRufHaerte: 2,
  _sozialRufText: 'Test'
};
assert.strictEqual(reputation._sozialRufAnwenden({ id: 'norbert_tetzlaff' }, kragenVerb), true,
  'collar escalation must apply its engine-owned reputation effect');
assert.deepStrictEqual(reputation.karlAkte.ruf, { renommee: -2, haerte: 2 },
  'collar escalation must book Renommee -2 and Härte +2');
assert.strictEqual(reputation._sozialRufAnwenden({ id: 'norbert_tetzlaff' }, kragenVerb), false,
  'the same social reputation effect must not be applied twice');

assert(/name: 'Hinterhof Sybelstrasse'[\s\S]{0,1000}?bedrohungen:\s*\[[\s\S]{0,500}?id: 'wachtmeister_eugen_hellbach'/.test(kessler),
  'optional Hellbach pressure must remain part of the Kessler case');
assert(html.includes('function zeigeAbschlussWahrheitswahl(resolveOpt)'),
  'Kessler truth ending choices must remain intact');
assert(/function _caseResolveTruthChoices[\s\S]{0,1800}?briefchen_ilse[\s\S]{0,1800}?brief_offenlegen/.test(html),
  'Ilse letter must still unlock its distinct ending');

console.log('KESSLER_UNIFIED_CONVERSATIONS_OK');
