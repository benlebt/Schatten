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

for (const copy of [
  'Offen sagen, dass Karl Privatdetektiv ist',
  'Diskretion zusichern',
  '20 D-Mark anbieten',
  'Ein großzügiges Trinkgeld geben',
  'Ruhig über seine Mittwoche reden',
  'Mit den Belegen konfrontieren',
  'Eine klare Antwort fordern',
]) {
  assert(kessler.includes(copy), 'missing unified Kessler conversation action: ' + copy);
}
assert(/name: 'Robert Kessler'[\s\S]{0,2200}?sozial:\s*\{[\s\S]{0,120}?tonarten:\s*\[/.test(kessler),
  'Robert must use the same direct conversation-action model as other witnesses');
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

assert(/name: 'Hinterhof Sybelstrasse'[\s\S]{0,1000}?bedrohungen:\s*\[[\s\S]{0,500}?id: 'wachtmeister_eugen_hellbach'/.test(kessler),
  'optional Hellbach pressure must remain part of the Kessler case');
assert(html.includes('function zeigeAbschlussWahrheitswahl(resolveOpt)'),
  'Kessler truth ending choices must remain intact');
assert(/function _caseResolveTruthChoices[\s\S]{0,1800}?briefchen_ilse[\s\S]{0,1800}?brief_offenlegen/.test(html),
  'Ilse letter must still unlock its distinct ending');

console.log('KESSLER_UNIFIED_CONVERSATIONS_OK');
