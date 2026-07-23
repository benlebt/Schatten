const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const introStart = html.indexOf('const INTRO_VARIANTS = [');
const introEnd = html.indexOf('\n];', introStart);
assert(introStart >= 0 && introEnd > introStart, 'INTRO_VARIANTS block missing');
const introSource = html.slice(introStart, introEnd + 3)
  .replace('const INTRO_VARIANTS =', 'INTRO_VARIANTS =');
const introContext = { INTRO_REQUIREMENTS: '' };
vm.createContext(introContext);
vm.runInContext(introSource, introContext);

const wegener = Array.from(introContext.INTRO_VARIANTS).find((entry) =>
  entry && entry.setup && /Konstantin Wegener/.test(entry.setup.tat || '')
);
assert(wegener, 'Wegener setup missing');
const anker = Array.from(wegener.setup.locations).find((location) =>
  location && /Goldenen Anker/.test(location.name || '')
);
assert(anker, 'Goldener Anker location missing');
assert.deepStrictEqual(Array.from(anker.oeffnungszeit || []), ['abend', 'nacht'], 'Wegener Anker must close after the night');
assert((anker.npcs || []).every((entry) => !entry.immer && Array.from(entry.zeit || []).join(',') === 'abend,nacht'), 'Schiele and Rita must leave when the Anker closes');
const schieleClue = Array.from(anker.indizien || []).find((clue) => clue && clue.id === 'schiele_streit');
assert(schieleClue, 'Schiele clue missing');
assert.deepStrictEqual(Array.from(schieleClue.actions), ['BESTECHEN', 'BEDROHEN'], 'Schiele clue must use the two accepted informant actions');
assert(/15 Ostmark/.test(wegener.prompt), 'Wegener prompt must state the real Schiele price');
assert(!/50 D-Mark/.test(JSON.stringify(wegener)), 'stale Schiele price remains in Wegener setup');

const kesslerIntro = Array.from(introContext.INTRO_VARIANTS).find((entry) =>
  entry && entry.setup && Array.isArray(entry.setup.setupCast)
    && entry.setup.setupCast.some((npc) => npc && npc.id === 'norbert_tetzlaff')
);
assert(kesslerIntro, 'Kessler setup with Tetzlaff missing');
const tetzlaffSetup = Array.from(kesslerIntro.setup.setupCast).find((npc) => npc && npc.id === 'norbert_tetzlaff');
assert(tetzlaffSetup && tetzlaffSetup.sozial, 'Tetzlaff direct social profile missing');
const krauseIntro = Array.from(introContext.INTRO_VARIANTS).find((entry) =>
  entry && entry.setup && Array.isArray(entry.setup.setupCast)
    && entry.setup.setupCast.some((npc) => npc && npc.id === 'bornstein')
);
assert(krauseIntro, 'Krause setup with Bornstein missing');
const bornsteinSetup = Array.from(krauseIntro.setup.setupCast).find((npc) => npc && npc.id === 'bornstein');
assert(bornsteinSetup && bornsteinSetup.sozial, 'Bornstein social profile missing');
assert(/15 Mark oder eine Flasche Korn/.test(bornsteinSetup.detail),
  'Bornstein setup prose must state the same cash-or-Korn terms as the engine');
assert(!/30 Westmark plus/.test(JSON.stringify(bornsteinSetup)),
  'stale compound Bornstein price must not contradict the visible payment button');

const paymentGateStart = html.indexOf('function _informantKannBezahlen(');
const paymentGateEnd = html.indexOf('function _informantBezahle(', paymentGateStart);
assert(paymentGateStart >= 0 && paymentGateEnd > paymentGateStart, 'read-only informant payment gate missing');
let ostmark = 15;
let carriedItems = {};
const paymentGateContext = {
  _informantPreis: () => 20,
  _geldHat: (amount, currency) => currency === 'ost' && ostmark >= amount,
  _itemsMap: () => carriedItems,
  normForMatch: (value) => String(value || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim(),
  _itemKatalogEintrag: (name) => name === 'Schachtel West-Zigaretten'
    ? { tauschwert: 3, taugt: ['bestechen'] }
    : name === 'Flasche Nordhäuser Doppelkorn'
      ? { tauschwert: 1, taugt: ['trinken', 'anbieten'] }
      : { tauschwert: 0, taugt: [] }
};
vm.createContext(paymentGateContext);
vm.runInContext(html.slice(paymentGateStart, paymentGateEnd), paymentGateContext);
assert.strictEqual(paymentGateContext._informantKannBezahlen('norbert_tetzlaff', 'Norbert Tetzlaff'), false,
  '15 Ostmark plus worthless carried objects must not expose Tetzlaff payment');
ostmark = 20;
assert.strictEqual(paymentGateContext._informantKannBezahlen('norbert_tetzlaff', 'Norbert Tetzlaff'), true,
  'enough cash must expose Tetzlaff payment');
ostmark = 0;
carriedItems = { cigs: { name: 'Schachtel West-Zigaretten', status: 'bei_karl' } };
assert.strictEqual(paymentGateContext._informantKannBezahlen('norbert_tetzlaff', 'Norbert Tetzlaff'), true,
  'suitable carried barter must expose Tetzlaff payment');
carriedItems = { fish: { name: 'Alter Fisch (aus dem Müll)', status: 'bei_karl' } };
assert.strictEqual(paymentGateContext._informantKannBezahlen('norbert_tetzlaff', 'Norbert Tetzlaff'), false,
  'worthless inventory must not expose Tetzlaff payment');
carriedItems = { korn: { name: 'Flasche Nordhäuser Doppelkorn', status: 'bei_karl' } };
assert.strictEqual(paymentGateContext._informantKannBezahlen('bornstein', 'Karl-Heinz Bornstein'), true,
  'Bornstein must accept the explicitly configured Korn alternative');
assert.strictEqual(paymentGateContext._informantKannBezahlen('norbert_tetzlaff', 'Norbert Tetzlaff'), false,
  'Bornstein-specific Korn must not weaken ordinary informant barter gates');

const debitStart = html.indexOf('function _informantBezahle(');
const debitEnd = html.indexOf('function _itemAdd(', debitStart);
assert(debitStart >= 0 && debitEnd > debitStart, 'informant debit function missing');
let movedKorn = null;
const bornsteinDebitContext = {
  _informantPreis: () => 15,
  _geldHat: () => false,
  normForMatch: paymentGateContext.normForMatch,
  _itemsMap: () => ({ korn: { id: 'korn', name: 'Flasche Nordhäuser Doppelkorn', status: 'bei_karl' } }),
  _itemKatalogEintrag: paymentGateContext._itemKatalogEintrag,
  _itemMove: (id, state) => { movedKorn = { id, state }; }
};
vm.createContext(bornsteinDebitContext);
vm.runInContext(html.slice(debitStart, debitEnd), bornsteinDebitContext);
const kornPayment = bornsteinDebitContext._informantBezahle('bornstein', 'Karl-Heinz Bornstein');
assert.strictEqual(kornPayment.ok, true, 'Bornstein Korn alternative must complete payment');
assert.strictEqual(kornPayment.art, 'ware', 'Bornstein Korn alternative must be recorded as barter, not money');
assert.strictEqual(kornPayment.betrag, 'Flasche Nordhäuser Doppelkorn', 'payment truth must name the actual bottle');
assert(movedKorn && movedKorn.id === 'korn' && movedKorn.state.status === 'bei_npc',
  'the accepted Korn bottle must actually leave Karl\'s inventory');

const personStart = html.indexOf('function _hauptuiInformantMitOffenemHinweis(');
const personEnd = html.indexOf('function _hauptuiItemVerben(', personStart);
assert(personStart >= 0 && personEnd > personStart, 'Haupt-UI informant action block missing');
let paymentAvailable = true;
const personContext = {
  _hauptuiPersonIstFeind: () => false,
  _hauptuiNpcBezwungen: () => false,
  _hauptuiRomanceAktion: () => null,
  _hauptuiHeilerAktion: () => null,
  _hauptuiVerhoerNpc: () => null,
  _resolveNpcIdentity: (id) => ({ id, name: id === 'schiele' ? 'Schiele' : 'Zeuge', tag: id === 'schiele' ? 'INFORMANT' : 'WITNESS' }),
  _npcHatOffenenHinweis: () => true,
  _informantPreis: (id) => id === 'norbert_tetzlaff' ? 20 : 15,
  _informantKannBezahlen: () => paymentAvailable,
  normForMatch: (value) => String(value || '').toLowerCase()
    .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, ' ').trim()
};
vm.createContext(personContext);
vm.runInContext(html.slice(personStart, personEnd), personContext);

const schieleVerbs = Array.from(personContext._hauptuiPersonVerben({
  id: 'schiele', name: 'Schiele', tag: 'INFORMANT', typ: 'person', hinweis: true
}));
assert.deepStrictEqual(schieleVerbs.map((verb) => verb.key),
  ['sozial_normal', 'sozial_bestechen', 'sozial_bedrohen', 'sozial_bluffen', 'sozial_kragen'],
  'an unfamiliar informant must expose all conversation approaches');
assert(/15 Mark/.test(schieleVerbs[1].label), 'informant payment action must show the price');
assert.strictEqual(schieleVerbs.some((verb) => verb.key === 'reden'), false, 'talk must be hidden while paid informant clue is open');

const staleSchiele = { id: 'schiele', name: 'Schiele', tag: 'INFORMANT', typ: 'person', hinweis: true, erledigt: true };
const staleSchieleVerbs = Array.from(personContext._hauptuiPersonVerben(staleSchiele));
assert.deepStrictEqual(staleSchieleVerbs.map((verb) => verb.key),
  ['sozial_normal', 'sozial_bestechen', 'sozial_bedrohen', 'sozial_bluffen', 'sozial_kragen'],
  'old saves must recover Schiele with the full approach choice');
assert.strictEqual(personContext._hauptuiEmpfohleneAktion(staleSchiele), null, 'the game must not preselect a tone for the player');
assert.strictEqual(personContext._hauptuiZielHinweis(staleSchiele, 'Person'), 'Gesprächsweg wählen', 'stale completed label must advertise the conversation choice');

const witnessVerbs = Array.from(personContext._hauptuiPersonVerben({
  id: 'zeuge', name: 'Zeuge', tag: 'WITNESS', typ: 'person', hinweis: true
}));
assert.deepStrictEqual(witnessVerbs.map((verb) => verb.key),
  ['sozial_normal', 'sozial_bestechen', 'sozial_bedrohen', 'sozial_bluffen', 'sozial_kragen'],
  'unfamiliar witnesses must expose the four tones and deliberate physical escalation');

const clientVerbs = Array.from(personContext._hauptuiPersonVerben({
  id: 'theodor_krause', name: 'Theodor Krause', tag: 'CLIENT', typ: 'person', hinweis: true
}));
assert.deepStrictEqual(clientVerbs.map((verb) => verb.key), ['reden'], 'clients and trusted office visitors must keep the simple talk action');

personContext._hauptuiVerhoerNpc = () => null;
const formerDossierInformantVerbs = Array.from(personContext._hauptuiPersonVerben({
  id: 'norbert_tetzlaff', name: 'Norbert Tetzlaff', tag: 'INFORMANT', typ: 'person', hinweis: true, sozial: tetzlaffSetup.sozial
}));
assert.deepStrictEqual(formerDossierInformantVerbs.map((verb) => verb.key),
  ['sozial_hoeflich', 'sozial_kollegial', 'sozial_bestechen', 'sozial_druck', 'sozial_bluffen', 'sozial_kragen'],
  'Tetzlaff must expose his complete direct conversation and escalation choice');
const tetzlaffPayment = formerDossierInformantVerbs.find((verb) => verb.key === 'sozial_bestechen');
const tetzlaffKragen = formerDossierInformantVerbs.find((verb) => verb.key === 'sozial_kragen');
assert(/20 Ostmark/.test(tetzlaffPayment.label), 'Tetzlaff payment choice must show the real engine price');
assert.strictEqual(tetzlaffPayment.option._sozialInformantZahlung, true, 'Tetzlaff payment tone must debit the real informant price');
assert.strictEqual(tetzlaffKragen.option.kategorie, 'OFFENSIV', 'collar escalation must be a real offensive action');
assert.strictEqual(tetzlaffKragen.option._sozialRufHaerte, 2, 'collar escalation must increase hardness');
assert.strictEqual(tetzlaffKragen.option._sozialRufRenommee, -2, 'collar escalation must damage reputation');

const bornsteinVerbs = Array.from(personContext._hauptuiPersonVerben({
  id: 'bornstein', name: 'Karl-Heinz Bornstein', tag: 'INFORMANT', typ: 'person', hinweis: true,
  sozial: bornsteinSetup.sozial
}));
const bornsteinKollegial = bornsteinVerbs.find((verb) => verb.key === 'sozial_kollegial');
assert(bornsteinKollegial, 'Bornstein collegial route missing');
assert.strictEqual(bornsteinKollegial.option._sozialErfolg, true,
  'Bornstein collegial route must remain an explicit social success');
assert.strictEqual(bornsteinKollegial.option._sozialInformantGratis, true,
  'Bornstein collegial route must carry the structured free-informant permission');
assert.strictEqual(bornsteinKollegial.option._sozialInformantZahlung, false,
  'Bornstein collegial route must not silently debit an informant payment');

paymentAvailable = false;
const brokeTetzlaffVerbs = Array.from(personContext._hauptuiPersonVerben({
  id: 'norbert_tetzlaff', name: 'Norbert Tetzlaff', tag: 'INFORMANT', typ: 'person', hinweis: true, sozial: tetzlaffSetup.sozial
}));
assert.strictEqual(brokeTetzlaffVerbs.some((verb) => verb.key === 'sozial_bestechen'), false,
  'Tetzlaff payment must be absent when neither money nor suitable barter is available');
assert(brokeTetzlaffVerbs.some((verb) => verb.key === 'sozial_hoeflich')
  && brokeTetzlaffVerbs.some((verb) => verb.key === 'sozial_druck'),
  'unaffordable payment must not hide the remaining conversation routes');
paymentAvailable = true;

const pohlSetup = Array.from(kesslerIntro.setup.setupCast).find((npc) => npc && npc.id === 'frau_pohl');
assert(pohlSetup && pohlSetup.sozial, 'Frau Pohl social profile missing');
const pohlVerbs = Array.from(personContext._hauptuiPersonVerben({
  id: 'frau_pohl', name: 'Frau Pohl', tag: 'WITNESS', typ: 'person', hinweis: true, sozial: pohlSetup.sozial
}));
const pohlKragen = pohlVerbs.find((verb) => verb.key === 'sozial_kragen');
assert(pohlKragen, 'every developed social NPC must allow deliberate collar escalation');
assert.strictEqual(pohlKragen.option._sozialErfolg, false, 'absurd escalation against a normal witness must not grant the clue');
assert.strictEqual(pohlKragen.option._sozialVerprelltDanach, true, 'collar escalation must burn the witness contact for the day');
const pohlGegenleistung = pohlVerbs.find((verb) => verb.key === 'sozial_gegenleistung');
assert.strictEqual(pohlGegenleistung.option._sozialZahlung, true, 'a promised witness counter-service must be a real engine payment');

const classifyStart = html.indexOf('function classifyEvidenceAction()');
const classifyEnd = html.indexOf('// v7.12.593', classifyStart);
assert(classifyStart >= 0 && classifyEnd > classifyStart, 'evidence action classifier missing');
const classifyContext = {
  window: { _letzteAktion: {
    kategorie: 'ERKUNDEN', text: 'Karl legt ein Trinkgeld auf den Tresen.',
    npcId: 'oberkellner_voss', npcName: 'Oberkellner Voss', sozialTonart: 'trinkgeld'
  } },
  normForMatch: personContext.normForMatch
};
vm.createContext(classifyContext);
vm.runInContext(html.slice(classifyStart, classifyEnd), classifyContext);
assert.strictEqual(classifyContext.classifyEvidenceAction(), 'person', 'structured social choices must always classify as person actions');

assert(html.includes("if (verb === 'bestechen' && typeof npcInteraktion === 'function')"), 'Haupt-UI execute path for informant payment missing');
assert(html.includes("_anzeigeText: 'Für Hinweis zahlen · ' + npc.name"), 'paid hint must have a short player-facing action label');
assert(html.includes("_enginePrompt: 'ENGINE-WAHRHEIT: Karl hat {npc} bereits '"), 'paid hint engine truth must use the private prompt field');
assert(!html.includes("aktion: 'ENGINE-WAHRHEIT: Karl hat {npc} bereits '"), 'internal paid-hint prompt must never be stored as visible action text');
assert(html.includes("if (option && option._enginePrompt) userMsg += '\\n\\n' + option._enginePrompt;"), 'private engine prompt is not forwarded to the AI');
assert(html.includes("aktion: 'Stelle {npc} zur Rede.'"), 'hostile talk action needs a short player-facing line');
assert(html.includes("aktion: 'Sprich mit {npc}.'"), 'normal talk action needs a short player-facing line');
assert(!html.includes("aktion: 'Sprich mit {npc} gezielt über den offenen Fallansatz."), 'internal talk direction still leaks into the visible action');
assert(!html.includes("aktion: brauchtDruck"), 'hostile prompt direction is still stored in the visible action');
assert(html.includes("if (tag === 'INFORMANT')"), 'legacy NPC menu informant branch missing');
assert(html.includes("_informantHatVerhoer = !!(window.VERHOER_PILOT_AKTIV"), 'retired dossier profiles must not suppress legacy informant actions');
assert(html.includes("keys = (_informantHatHinweis && !_informantHatVerhoer) ? ['bestechen','bedrohen'] : ['befragen'];"), 'legacy informant actions do not match clue gate');
assert(html.includes("_sozNpc.sozial.direktStattInformant && ['bestechen', 'bedrohen'].indexOf(verben[i].key)"), 'legacy menu must replace coarse Tetzlaff informant buttons with his direct choices');
assert(html.includes("BEDROHEN: 'Unter Druck setzen'"), 'hint action label for pressure missing');
assert(html.includes("&& !_hauptuiInformantMitOffenemHinweis(target)"), 'completed-target rendering can still disable an open informant clue');

const grantStart = html.indexOf('function pruefeKernIndizFund(');
const grantEnd = html.indexOf('\n// ===== Ende Engine-Ortssystem =====', grantStart);
assert(grantStart >= 0 && grantEnd > grantStart, 'deterministic evidence grant function missing');
const grantSource = html.slice(grantStart, grantEnd);
let paymentCalls = 0;
const grantContext = {
  window: {},
  engineCurrentLocation: { name: 'Eckkneipe Zum Goldenen Anker' },
  caseProgress: { stage: 3, gefundeneIndizIds: [] },
  getCaseLocations: () => [{
    name: 'Eckkneipe Zum Goldenen Anker',
    indizien: [{
      id: 'schiele_streit',
      text: 'Schiele nennt den Streit.',
      npc: 'schiele',
      quelle: 'person',
      actions: ['BESTECHEN', 'BEDROHEN']
    }]
  }],
  normForMatch: (value) => String(value || '').toLowerCase().trim(),
  getNpcsAtCurrentLocation: () => [{ id: 'schiele', name: 'Schiele', tag: 'INFORMANT' }],
  _aktTageszeitName: () => 'nacht',
  classifyEvidenceAction: () => 'person',
  getEvidenceActionKey: () => 'BESTECHEN',
  _npcWirklichInSzene: () => true,
  _aktionsZielNpcPasst: () => true,
  _indizGehoertZuNpc: () => true,
  _resolveNpcIdentity: () => ({ id: 'schiele', name: 'Schiele', tag: 'INFORMANT' }),
  _informantPreis: () => 15,
  _informantBezahle: () => { paymentCalls += 1; return { ok: true, art: 'geld', betrag: 15 }; },
  _markiereIndizGefunden: (clue) => {
    grantContext.caseProgress.gefundeneIndizIds.push(clue.id);
    return true;
  },
  caseHasDefinedEvidence: () => true,
  diag: () => {}
};
grantContext.window = grantContext;
vm.createContext(grantContext);
vm.runInContext(grantSource, grantContext);
const granted = Array.from(grantContext.pruefeKernIndizFund('Schiele nennt Karl nach der Bezahlung den Streit.'));
assert.strictEqual(paymentCalls, 1, 'Schiele payment must be booked exactly once');
assert.deepStrictEqual(Array.from(grantContext.caseProgress.gefundeneIndizIds), ['schiele_streit'], 'successful payment must book Schiele clue');
assert.deepStrictEqual(granted, ['Schiele nennt den Streit.'], 'successful Schiele interaction must report the granted clue');

let bornsteinPayments = 0;
const bornsteinGrantContext = {
  window: {},
  engineCurrentLocation: { name: 'Bornsteins Antiquitätenladen' },
  currentScene: { personenImRaum: ['Karl-Heinz Bornstein'] },
  caseProgress: { stage: 2, gefundeneIndizIds: [] },
  getCaseLocations: () => [{
    name: 'Bornsteins Antiquitätenladen',
    indizien: [{
      id: 'bornstein_hehler_tipp',
      text: 'Bornstein nennt Frieda, Kalle, Jochen und das Hinterhof-Lager.',
      npc: 'bornstein', quelle: 'person',
      actions: ['BEFRAGEN', 'BESTECHEN', 'ANSPRECHEN', 'UEBERZEUGEN']
    }]
  }],
  normForMatch: grantContext.normForMatch,
  getNpcsAtCurrentLocation: () => [{ id: 'bornstein', name: 'Karl-Heinz Bornstein', tag: 'INFORMANT' }],
  _aktTageszeitName: () => 'nachmittag',
  classifyEvidenceAction: () => 'person',
  getEvidenceActionKey: () => 'ANSPRECHEN',
  _npcWirklichInSzene: () => true,
  _aktionsZielNpcPasst: () => true,
  _indizGehoertZuNpc: () => true,
  _resolveNpcIdentity: () => ({ id: 'bornstein', name: 'Karl-Heinz Bornstein', tag: 'INFORMANT' }),
  _informantPreis: () => 30,
  _informantBezahle: () => { bornsteinPayments += 1; return { ok: true, art: 'geld', betrag: 30 }; },
  _markiereIndizGefunden: (clue) => {
    bornsteinGrantContext.caseProgress.gefundeneIndizIds.push(clue.id);
    return true;
  },
  caseHasDefinedEvidence: () => true,
  diag: () => {}
};
bornsteinGrantContext.window = bornsteinGrantContext;
bornsteinGrantContext._letzteAktion = {
  npcId: 'bornstein', sozialErfolg: true, sozialInformantGratis: true, sozialTonart: 'kollegial'
};
vm.createContext(bornsteinGrantContext);
vm.runInContext(grantSource, bornsteinGrantContext);
const freeBornstein = Array.from(bornsteinGrantContext.pruefeKernIndizFund(
  'Bornstein nennt Tante Frieda, Kalle und Jochen sowie das Lager im Hinterhof.'
));
assert.strictEqual(bornsteinPayments, 0, 'profile-authorized free informant route must not debit money');
assert.deepStrictEqual(Array.from(bornsteinGrantContext.caseProgress.gefundeneIndizIds), ['bornstein_hehler_tipp'],
  'Bornstein collegial success must book the clue narrated in prose');
assert.strictEqual(freeBornstein.length, 1, 'Bornstein collegial success must report one granted clue');

bornsteinGrantContext.caseProgress.gefundeneIndizIds = [];
bornsteinGrantContext._letzteAktion.sozialInformantGratis = false;
const blockedFreeTalk = Array.from(bornsteinGrantContext.pruefeKernIndizFund(
  'Der Informant plaudert freundlich, aber ohne vereinbarte Freigabe.'
));
assert.deepStrictEqual(blockedFreeTalk, [], 'ordinary informant talk must remain gated without payment, pressure or profile permission');
assert.strictEqual(bornsteinPayments, 0, 'blocked ordinary talk must not attempt an implicit payment');
assert(bornsteinGrantContext.caseProgress._informantWillBezahlung,
  'blocked ordinary informant talk must retain the visible payment requirement');

const buyStart = html.indexOf('function _hauptuiOffenesInformantenIndiz(');
const buyEnd = html.indexOf('function _hauptuiEmpfohleneAktion(', buyStart);
assert(buyStart >= 0 && buyEnd > buyStart, 'deterministic Haupt-UI informant purchase helpers missing');
let directPayments = 0;
let directBookings = 0;
let rewardFlushes = 0;
const buyContext = {
  engineCurrentLocation: { name: 'Eckkneipe Zum Goldenen Anker' },
  caseProgress: { stage: 0, gefundeneIndizIds: [] },
  sceneCounter: 3,
  getCaseLocations: () => [{
    name: 'Eckkneipe Zum Goldenen Anker',
    indizien: [schieleClue]
  }],
  normForMatch: (value) => String(value || '').toLowerCase().trim(),
  _aktTageszeitName: () => 'nacht',
  _indizGehoertZuNpc: (clueNpc, npcName, npcId) => clueNpc === npcId || clueNpc === String(npcName || '').toLowerCase(),
  _indizBelegBedarf: () => null,
  _indizNurUeberKampf: () => false,
  _informantBezahle: () => { directPayments += 1; return { ok: true, art: 'geld', betrag: 15 }; },
  _markiereIndizGefunden: (clue) => {
    directBookings += 1;
    buyContext.caseProgress.gefundeneIndizIds.push(clue.id);
    return true;
  },
  _flushIndizRewards: () => { rewardFlushes += 1; },
  saveGameState: () => {},
  showProgressToast: () => {}
};
vm.createContext(buyContext);
vm.runInContext(html.slice(buyStart, buyEnd), buyContext);

const directPurchase = buyContext._hauptuiInformantHinweisKaufen({ id: 'schiele', name: 'Schiele', typ: 'person' });
assert(directPurchase && directPurchase.indiz.id === 'schiele_streit', 'direct Schiele payment must return the booked clue');
assert.strictEqual(directPayments, 1, 'direct Schiele payment must debit exactly once');
assert.strictEqual(directBookings, 1, 'direct Schiele payment must book exactly once');
assert.strictEqual(rewardFlushes, 1, 'direct Schiele payment must make the booked clue visible immediately');
assert.strictEqual(buyContext.caseProgress._informantBezahlt.indizId, 'schiele_streit', 'payment truth must be persisted with its clue id');

const duplicatePurchase = buyContext._hauptuiInformantHinweisKaufen({ id: 'schiele', name: 'Schiele', typ: 'person' });
assert.strictEqual(duplicatePurchase, null, 'already booked Schiele clue must not be sold twice');
assert.strictEqual(directPayments, 1, 'duplicate click must not debit again');

console.log('INFORMANT_PROGRESS_OK');
