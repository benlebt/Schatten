const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sourceOf(name) {
  const marker = `function ${name}(`;
  const start = html.indexOf(marker);
  assert(start >= 0, `${name} missing`);
  const bodyStart = html.indexOf('{', start);
  let depth = 0;
  for (let i = bodyStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    if (html[i] === '}') {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error(`${name} is incomplete`);
}

const opera = { name: 'Deutsche Staatsoper (Admiralspalast)' };
const garderobe = {
  name: 'Achterbergs Garderobe',
  lokalVon: ['Deutsche Staatsoper (Admiralspalast)'],
};
const apotheke = { name: 'Apotheke am Bahnhof Friedrichstrasse' };
const travelContext = {
  normForMatch: value => String(value || '').toLowerCase().trim(),
  getCaseLocations: () => [opera, garderobe, apotheke],
};
vm.createContext(travelContext);
vm.runInContext(sourceOf('_reiseIstLokalerWeg'), travelContext);

assert.strictEqual(travelContext._reiseIstLokalerWeg(opera.name, garderobe), true,
  'configured room-to-room movement must be local');
assert.strictEqual(travelContext._reiseIstLokalerWeg(garderobe.name, opera), true,
  'local connection must work in both directions');
assert.strictEqual(travelContext._reiseIstLokalerWeg(opera.name, apotheke), false,
  'unrelated locations must remain real Opel journeys');

const travelSource = sourceOf('reiseZuOrt');
assert(travelSource.includes("if (!_lokalerWeg && typeof fxTravel === 'function')"),
  'local movement must skip the Opel animation');
assert(travelSource.includes('_zeitUnmittelbar: _lokalerWeg'),
  'local movement must not consume a full time block');
assert(travelSource.includes('Geh im Gebaeude weiter zu:'),
  'local movement needs truthful player-facing action text');
assert(travelSource.includes('Kein Opel, keine Fahrt, kein Parken'),
  'local movement needs a hard narrative constraint');
assert(travelSource.includes('!_lokalerWeg && !_notfallBehandlungsfahrt'),
  'local movement must not trigger drunk- or fatigue-driving failures');

const achterbergStart = html.indexOf("klient: 'Wilhelmine Achterberg (Witwe des Dirigenten)'");
const achterbergEnd = html.indexOf('anchorNpcs:', achterbergStart);
assert(achterbergStart >= 0 && achterbergEnd > achterbergStart, 'Achterberg setup slice missing');
const achterberg = html.slice(achterbergStart, achterbergEnd);
assert(achterberg.includes("lokalVon: ['Deutsche Staatsoper (Admiralspalast)']"),
  'Achterberg Garderobe must be linked locally to the opera');
assert(achterberg.includes("npcs: [{ id: 'theo_marquardt', immer: true, abStage: 1 }]"),
  'Marquardt must become actionable where his canonical arrival is narrated');
assert(/id: 'vossberg_gelegenheit'[\s\S]*?stage: 3, abStage: 1/.test(achterberg),
  'third opening clue must be reachable in stage 1 to avoid a progression deadlock');

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1521 +AchterbergOpeningFlow-Staging'"),
  'release version missing');

console.log('achterberg-opening-flow: ok');
