const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const schifferStart = html.indexOf("klient: 'Renate Schiffer");
const schifferEnd = html.indexOf('// 12. Gerichtsvorladung', schifferStart);
const schiffer = html.slice(schifferStart, schifferEnd);
const imageStart = html.indexOf('caseTest: /renate schiffer|detlef schiffer/i');
const imageEnd = html.indexOf('caseTest: /albrecht goerke|mathilde goerke/i', imageStart);
const images = html.slice(imageStart, imageEnd);

assert(schifferStart > 0 && schifferEnd > schifferStart, 'Schiffer setup must be present');
assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1658 +ThreatVisualTruth'"),
  'release version must identify the Schiffer counter-run fixes');

assert(schiffer.includes("stasiRelevance: 2"),
  'the private rescue case must not start the global MfS confrontation machinery');
assert(!schiffer.includes("name: 'Hauptmann Holger Reuss'"),
  'Reuss must not displace Kalle as the canonical cellar guard');
assert(!schiffer.includes("id: 'hauptmann_reuss'"),
  'the Spielklub threat table must not inject Reuss into the rescue chain');

assert(schiffer.includes("startBekannt: true"),
  'the named opening destinations must be travelable without a dead-end detour');
assert(schiffer.includes("wegWennKlientGesprochen: true"),
  'Renate must answer in the office and then leave through the narrated client transition');
assert(html.includes('const pronomenAbgang = (String(scene.szene || \'\').match'),
  'a one-shot client departure must also be recognized when the model continues with a pronoun');
assert(!html.includes('streifschuss|arm|bein|gesicht|kopf|brust|schulter|rippe|finger|hand'),
  'a harmless mention such as "the weapon in your hand" must not count as an injury trigger');
assert(html.includes('(arm|bein|gesicht|kopf|brust|schulter|rippe|finger|hand)\\b.{0,20}\\b(blutet|schmerzt|brennt|pocht'),
  'body-part mentions must require an actual wound state before reducing health');
assert(schiffer.includes("npcs: [{ id: 'renate_schiffer', immer: true }]"),
  'Renate must be present and selectable in her own apartment');
assert(schiffer.includes("erstbegegnung: true"),
  'Renate must be marked as a first meeting so the opening cannot invent shared history');
const schifferOfficeStart = schiffer.indexOf("{ name: 'Karl Mauers Büro'");
assert(schifferOfficeStart >= 0
  && schiffer.slice(schifferOfficeStart, schifferOfficeStart + 1800).includes('openingFallbackText:')
  && schiffer.slice(schifferOfficeStart, schifferOfficeStart + 1800).includes('1500 D-Mark Spielschulden'),
  'the Schiffer opening needs a complete authored brief instead of a thin honorarium fragment');
const schifferLaterneStart = schiffer.indexOf("{ name: 'Rote Laterne'");
assert(schifferLaterneStart >= 0
  && schiffer.slice(schifferLaterneStart, schifferLaterneStart + 1800).includes('arrivalFallbackText:')
  && schiffer.slice(schifferLaterneStart, schifferLaterneStart + 1800).includes('Morgens probt sie'),
  'the morning visit to Sonja needs a plausible authored rehearsal arrival');
assert(html.includes("code: 'opening_unsupported_client_history'"),
  'the opening truth guard must reject invented prior client history');
assert(html.includes('const caseCast = Array.isArray(setup.setupCast)'),
  'first-meeting truth must cover the client family and target, not only the client name');
assert(html.includes('gerettet|befreit|ermittelt'),
  'the opening truth guard must catch invented prior rescues such as Detlef being freed before');

assert(schiffer.includes("fundText: 'Du untersuchst die verwuestete Wohnung systematisch."),
  'the apartment clue must use deterministic evidence prose');
assert(schiffer.includes("vorabVerboten: ['zerbrochen','zerschlagen','scherben','ausgelaufen','ausgegossen']"),
  'arrival prose must not turn the intact half-filled bottle into broken glass');
assert(schiffer.includes("Mehr weiss Sonja nicht; von einem Papierversteck oder einem unbekannten Mittelsmann hat sie nie gesprochen."),
  'Sonja must not invent papers or placeholder intermediaries');
assert(schiffer.includes('du bleibst im Klubraum und musst den Keller als eigenen Schauplatz betreten.'),
  'the cellar clue must not narrate the location change before the player travels');
assert(schiffer.includes("{ id: 'kalle_schiefe', immer: true, abStage: 3 }"),
  'Kalle must already guard the cellar when its stage-three route opens');
assert(schiffer.includes("{ id: 'detlef_schiffer', immer: true, abStage: 3 }"),
  'Detlef must be visible in prose and UI as soon as the unlocked cellar image depicts him');
assert(schiffer.includes("location: 'Keller des Spielklubs Roter Stern',\n        abStage: 3"),
  'the physical rescue target must unlock at the same stage as the cellar route');
assert(schiffer.includes("Sonja Krell steht im Saal nahe dem Buehnenmikrofon"),
  'Rote Laterne prose truth must match the fixed stage image');
for (const location of ['Spielklub Roter Stern', 'Keller des Spielklubs Roter Stern', 'Detlef Schiffers Wohnung', 'Renate Schiffer Wohnung Tiergarten']) {
  const locationStart = schiffer.indexOf("{ name: '" + location + "'");
  const locationEnd = schiffer.indexOf("},", locationStart);
  assert(locationStart >= 0 && schiffer.slice(locationStart, locationEnd + 2).includes('arrivalFallbackText:'),
    location + ' needs authored arrival prose instead of a dry engine instruction');
}
assert(html.includes("pendingCategoryChoice === 'RETTUNG'"),
  'rescue, escort and handoff actions must ignore invented AI injury deltas');
assert(!html.includes('Auf dem schmalen Weg zwischen Kiefern und Schilf muss er mehrmals stehen bleiben'),
  'the engine-wide rescue fallback must not force every rescue into the Mueggelsee landscape');
assert(html.includes('scene.szene = _arrivalRosterFallback || (_arrivalKrause'),
  'authored arrival prose must also win when the roster consistency repair fires');

const plausibilityStart = html.indexOf('function _romancePushOrtPlausibel');
const plausibilityEnd = html.indexOf('function enforceRomanceIntroductionScene', plausibilityStart);
const plausibility = html.slice(plausibilityStart, plausibilityEnd);
assert(plausibility.includes('const explicitLocationWords = currentN.split'),
  'romance triggers must distinguish location words from person and clue names');
assert(plausibility.indexOf('if (bound.length) return false;') < plausibility.indexOf('const genericLocationWords'),
  'an explicit romance location binding must win before generic fuzzy trigger words');
const introStart = html.indexOf('function enforceRomanceIntroductionScene');
const introEnd = html.indexOf('function buildFrischeFolgeHint', introStart);
const intro = html.slice(introStart, introEnd);
assert(!intro.includes('Sie ist wegen der laufenden Sache hier und wartet auf deine Reaktion.'),
  'engine instructions must not leak into visible romance introduction prose');

assert(html.includes("Erfinde KEINEN Schuss, Angreifer, Bewacher, Hinterhalt oder neue Verletzung."),
  'physical rescue actions must forbid a surprise attacker after the guard is resolved');
assert(html.includes('Karl hat die Zielperson gerettet, nicht die ganze Organisation beseitigt.'),
  'physical-target conclusions must not erase unresolved criminal structures');
assert(html.includes("const _figImFallErlaubt = !_figIstMfs"),
  'recurring MfS figures must be gated by actual political relevance');

assert(images.includes("karl-mauers-buero-renate-night.png"),
  'the Schiffer opening requires a Renate office presence image');
assert(images.includes("depictsNpcs: ['renate_schiffer']"),
  'Renate apartment images must declare the client they visibly depict');
assert(images.includes('spielklub-roter-stern-cast-v1628.png'),
  'the Spielklub needs the corrected Riemer/Kalle/Rudi cast image');
assert(images.includes('detlef-schiffer-wohnung-consistent-v1628.png'),
  'Detlef apartment needs the corrected forced-door, scuff and intact-bottle image');
assert(schiffer.includes("clientHandoff: {") && schiffer.includes("renate-schiffer-handoff-night.png"),
  'the rescue handoff requires a dedicated Renate-and-Detlef visual state');
assert(fs.existsSync(path.join(root, 'assets', 'scenes', 'schiffer', 'karl-mauers-buero-renate-night.png')),
  'office presence image file must exist');
assert(fs.existsSync(path.join(root, 'assets', 'scenes', 'schiffer', 'renate-schiffer-handoff-night.png')),
  'handoff image file must exist');
assert(fs.existsSync(path.join(root, 'assets', 'scenes', 'schiffer', 'spielklub-roter-stern-cast-v1628.png')),
  'corrected Spielklub image file must exist');
assert(fs.existsSync(path.join(root, 'assets', 'scenes', 'schiffer', 'detlef-schiffer-wohnung-consistent-v1628.png')),
  'corrected apartment image file must exist');

console.log('Schiffer full-run regression checks passed.');
