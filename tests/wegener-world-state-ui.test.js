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

const hinterhof = {
  name: 'Hinterhof Spreestrasse',
  npcs: [
    { id: 'lothar_schaefer', immer: true },
    { id: 'lothars_bewacher', immer: true }
  ],
  indizien: [
    {
      id: 'lagerhalle_hinweis',
      quelle: 'umgebung',
      actions: ['ERKUNDEN'],
      supersededWhenTargetFound: true
    },
    {
      id: 'lothar_schluessel',
      npc: 'lothar_schaefer',
      quelle: 'person',
      actions: ['BEDROHEN'],
      supersededWhenTargetFound: true
    },
    {
      id: 'kratz_papiere',
      npc: 'lothars_bewacher',
      quelle: 'umgebung',
      actions: ['DURCHSUCHEN']
    }
  ]
};

const removed = new Set(['lothar schaefer', 'lothars bewacher']);
const clueContext = {
  caseProgress: {
    stage: 4,
    zielpersonGefunden: false,
    zielpersonGeborgen: false,
    gefundeneIndizIds: []
  },
  engineCurrentLocation: { name: hinterhof.name },
  getCaseLocations: () => [hinterhof],
  getNpcsAtCurrentLocation: () => [],
  _aktTageszeitName: () => 'abend',
  _npcZustandIstEntfernt: (npc) => removed.has(normForMatch((npc && (npc.id || npc.name)) || npc)),
  normForMatch
};
vm.createContext(clueContext);
[
  '_indizIstWeltzustandOffen',
  'offeneIndizienAmOrt',
  '_indizNpcIdsAmOrtJetzt',
  '_indizAmOrtJetztErreichbar',
  'offeneIndizienAmOrtNachErreichbarkeit',
  '_indizGehoertZuNpc',
  '_npcHatOffenenHinweis',
  '_npcHatUngefundeneIndizien',
  '_npcOffeneHinweisAktionen',
  '_ortHatOffenesDurchsuchIndiz'
].forEach((name) => vm.runInContext(sourceOf(name), clueContext));

assert.strictEqual(clueContext.offeneIndizienAmOrt(hinterhof), 1,
  'only the still-relevant location clue may remain after both NPCs were removed');
assert.strictEqual(clueContext._npcHatOffenenHinweis('Lothar Schaefer', 'lothar_schaefer'), false,
  'a handed-over NPC must not retain a HINWEIS badge');
assert.strictEqual(clueContext._npcHatUngefundeneIndizien('Lothar Schaefer', 'lothar_schaefer'), false,
  'a handed-over NPC must not remain artificially unexhausted');
assert.deepStrictEqual(Array.from(clueContext._npcOffeneHinweisAktionen('Lothar Schaefer')), [],
  'a handed-over NPC must expose no clue actions');
assert.strictEqual(clueContext._ortHatOffenesDurchsuchIndiz(), false,
  'an environment clue tied to a removed NPC must not leave a search marker');

clueContext.caseProgress.zielpersonGefunden = true;
assert.strictEqual(clueContext.offeneIndizienAmOrt(hinterhof), 0,
  'finding Konstantin must close superseded Lagerhalle clues');
const closedReachability = clueContext.offeneIndizienAmOrtNachErreichbarkeit(hinterhof);
assert.strictEqual(closedReachability.jetzt, 0);
assert.strictEqual(closedReachability.spaeter, 0,
  'superseded clues must disappear instead of moving to the later bucket');

const transportContext = {
  caseSetup: {
    targetResolution: {
      mode: 'physical',
      npc: 'konstantin_wegener',
      location: 'Lagerhalle an der Spree',
      deliveryRequired: true,
      handoffs: {
        client: { location: 'Wegener-Wohnung', name: 'Helga Wegener', label: 'Zu Helga bringen' },
        police: { location: 'Volkspolizei-Revier Hans-Beimler-Strasse', name: 'Volkspolizei' }
      }
    }
  },
  caseProgress: {
    zielpersonGeborgen: true,
    zielpersonTransportStatus: 'am_ausgang',
    zielpersonInBegleitung: true
  },
  engineCurrentLocation: { name: 'Wegener-Wohnung' },
  _physischesFallzielIstNpc: () => true,
  normForMatch
};
vm.createContext(transportContext);
vm.runInContext(sourceOf('_hauptuiZielpersonTransportAktion'), transportContext);
let transportAction = transportContext._hauptuiZielpersonTransportAktion({ typ: 'person', id: 'konstantin_wegener' });
assert(transportAction && transportAction.key === 'ziel_zum_klienten',
  'accompanying Konstantin must be deliverable even when an old save does not say im_opel');
transportContext.engineCurrentLocation.name = 'Volkspolizei-Revier Hans-Beimler-Strasse';
transportAction = transportContext._hauptuiZielpersonTransportAktion({ typ: 'person', id: 'konstantin_wegener' });
assert(transportAction && transportAction.key === 'ziel_zur_polizei',
  'police handoff must use the same accompaniment truth');

const mapContext = {
  _physischesFallzielStatus: () => ({
    npcId: 'konstantin_wegener',
    location: 'Lagerhalle an der Spree',
    lieferungOffen: true,
    transportBereit: true,
    safeLocations: ['Wegener-Wohnung', 'Volkspolizei-Revier Hans-Beimler-Strasse'],
    handoffs: {}
  }),
  mapPosFuer: () => ({ x: 1, y: 1 }),
  offeneIndizienAmOrt: () => 0,
  offeneIndizienAmOrtNachErreichbarkeit: () => ({ jetzt: 0, spaeter: 0, hattIndizien: false }),
  istOrtGeoeffnet: () => true,
  normForMatch
};
vm.createContext(mapContext);
vm.runInContext(sourceOf('mapSammleOrte'), mapContext);
const mapped = mapContext.mapSammleOrte([
  { name: 'Wegener-Wohnung' },
  { name: 'Volkspolizei-Revier Hans-Beimler-Strasse' }
], 'lagerhalle an der spree');
assert.strictEqual(mapped.length, 2);
assert(mapped.every((entry) => entry.fallziel && entry.fallzielStatus.deliveryTarget),
  'both configured handoff locations must be highlighted while Konstantin accompanies Karl');

const staleUiContext = {
  _npcZustandIstEntfernt: () => true,
  _npcAusAktiverSzeneEntfernen: () => { staleUiContext.purged = true; },
  showProgressToast: () => { staleUiContext.toastShown = true; },
  normForMatch
};
vm.createContext(staleUiContext);
vm.runInContext(sourceOf('_hauptuiPersonVerben'), staleUiContext);
vm.runInContext(sourceOf('_hauptuiExecute'), staleUiContext);
const removedTarget = { typ: 'person', id: 'lothar_schaefer', name: 'Lothar Schaefer' };
assert.deepStrictEqual(Array.from(staleUiContext._hauptuiPersonVerben(removedTarget)), [],
  'removed NPCs must expose no verbs');
staleUiContext._hauptuiExecute('durchsuchen_npc', removedTarget);
assert(staleUiContext.purged && staleUiContext.toastShown,
  'even a stale already-rendered action must be rejected and purge the NPC');

assert(html.includes("_np = _np.filter(function (npc) { return npc && npc.name && !_npcZustandIstEntfernt(npc); });"),
  'main UI target injection needs a final terminal-state barrier');
assert(html.includes('Fahre zur Charité oder zu Doc Wagner.'),
  'injury warning must name both concrete treatment destinations');

console.log('WEGENER_WORLD_STATE_UI_OK');
