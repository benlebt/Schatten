const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const straussStart = html.indexOf("klient: 'Karl Mauer (Eigen-Auftrag - Schuld am abgebrochenen Strauss-Fall)'");
const straussEnd = html.indexOf('anchorNpcs:', straussStart);
assert(straussStart >= 0 && straussEnd > straussStart, 'Strauss setup slice missing');
const strauss = html.slice(straussStart, straussEnd);

assert(/name: 'Friedhof Ploetzensee'[\s\S]*?npcs: \[\{ id: 'frau_schleier', immer: true, bisStage: 1, wegWennIndiz: 'schleier_kranzler_spur' \}, \{ id: 'pastor_vogel', immer: true, bisStage: 1, wegWennIndiz: 'schleier_kranzler_spur' \}\]/.test(strauss),
  'the funeral opening must keep the veiled woman and Pastor Vogel physically actionable');
assert(/name: 'Friedhof Ploetzensee'[\s\S]*?openingFallbackText: '[^']*Pastor Vogel[^']*unbekannte Frau mit Schleier[^']*moralischer Pflicht/.test(strauss),
  'the funeral roster fallback must preserve the assignment without invented physical evidence or an empty cemetery');
assert(/id: 'schleier_kranzler_spur'[\s\S]*?npc: 'frau_schleier', quelle: 'person', actions: \['ANSPRECHEN','BEFRAGEN','UEBERZEUGEN'\][\s\S]*?stage: 2/.test(strauss),
  'the veiled woman must provide a conversational lead away from the funeral');
assert(strauss.includes('Cafe Kranzler'),
  'the opening lead must point to a configured follow-up location');
assert(/id: 'schleier_aussage'[\s\S]*?nachIndiz: 'schleier_kranzler_spur'/.test(strauss),
  'the full testimony at Cafe Kranzler must unlock directly from the opening lead');
assert(/id: 'krummbein_kordel'[\s\S]*?actions: \['ERKUNDEN','DURCHSUCHEN'\]/.test(strauss),
  'the physical cord must be searched instead of mislabeled as reading files');
assert(/id: 'krummbein_kordel'[\s\S]*?fundText: '[^']*Durchmesser und Drehung[^']*kein Blick durch ein Mikroskop/.test(strauss),
  'the cord comparison must be physically plausible instead of claiming naked-eye microscopic proof');
assert(/id: 'krummbein_kordel'[\s\S]*?prosaPflicht: \{ replaceOnFallback: true/.test(strauss)
  && /id: 'strick_befund'[\s\S]*?prosaPflicht: \{ replaceOnFallback: true/.test(strauss)
  && /id: 'alte_strauss_akte'[\s\S]*?prosaPflicht: \{ replaceOnFallback: true/.test(strauss),
  'mechanically booked Strauss evidence must replace vague model prose with its canonical finding');
assert(/id: 'strick_befund'[\s\S]*?fundText: '[^']*Wer die Kordel führte, steht damit noch nicht fest/.test(strauss),
  'the police finding must establish murder without prematurely naming Krummbein');
assert(/id: 'strauss_briefplan'[\s\S]*?Fahrkarte nach Westdeutschland für den 24\. Juli[\s\S]*?beweist für sich allein aber noch keinen Täter/.test(strauss),
  'Strauss future plans must use a stable chronology without overclaiming a culprit');
assert(/name: 'Strauss-Geschaeft'[\s\S]*?detail: 'Innenraum[^']*tritt ein und endet drinnen; die Szene spielt nicht vor dem Laden/.test(strauss),
  'the shop arrival must establish the same interior that its fixed image shows');
assert(strauss.includes("abschlussPolizei: { name: 'Kommissar Heinrich Lindner', behoerde: 'West-Berliner Polizei', verboten: ['Volkspolizei', 'Roth'] }"),
  'the West-sector Strauss handoff must bind Lindner instead of Volkspolizei Mitte');
assert(strauss.includes("rolle: 'Unbekannte Trauernde am Grab'"),
  'the visible role must not expose a future romance');
assert(/name: 'Frau mit Schleier'[\s\S]*?tag: 'MYSTERY'[\s\S]*?feindlich: false/.test(strauss),
  'the unknown mourner must remain socially approachable instead of becoming a combat target');
assert(/name: 'Frau mit Schleier'[\s\S]*?romanceNachIndiz: 'schleier_aussage'/.test(strauss),
  'the romance affordance must stay hidden until her full Cafe testimony');
assert(!/Klara Bergmann|spaeter ROMANCE-Kandidatin|Ludwigs Geliebte/.test(strauss),
  'the setup must not leak the veiled woman identity or relationship in the player-facing dossier');

assert(html.includes('encountered: false,'),
  'setup facts must begin hidden from the player-facing encountered-person list');
assert(html.includes('fact.encountered = true;')
  && html.includes('_encounterFact.encountered = true;'),
  'structured cast additions and personenImRaum must reveal a person only after a real encounter');
assert(html.includes('knownChars[lower].encountered = f.encountered === true'),
  'the current-state dossier must not treat every frozen setup fact as encountered');
assert(html.includes('const _openingMissingNames = Array.isArray(problem.missingProse)'),
  'opening roster repair must append only genuinely missing prose actors');
assert(html.includes('if (_setupNpc && _setupNpc.feindlich === false) return false;')
  && html.includes('if (npc.feindlich === false) return false;'),
  'explicit setup hostility must override ambiguous tags across enemy detection and the main UI');
assert(html.includes('if (ind.nachIndiz) {')
  && html.includes('if (entry.wegWennIndiz && caseProgress')
  && html.includes('if (entry.romanceNachIndiz) {'),
  'clue chains, NPC departures and romance reveals must support explicit evidence gates');
assert(html.includes('function _hauptuiKonfrontationMussFuerHinweisBleiben(name)')
  && html.includes('function _hauptuiKonfrontationBeruhigtenHinweisgeberSichern(name)')
  && html.includes('ABSCHLUSS PFLICHT (HINWEISGEBER)'),
  'peaceful confrontation resolution must keep unresolved evidence carriers interactable');
assert(html.includes("const k = rawKey.replace(/_/g, ' ');")
  && html.includes('let z = m[rawKey] || m[k] || null;'),
  'NPC social/combat state lookup must resolve both setup IDs and display names');
assert(html.includes("presenceVariants: [")
  && html.includes("npc: 'Paul Krummbein', id: 'paul_krummbein'")
  && html.includes('function _szenenbildAnwesenheitsVariante(spec, scene)')
  && html.includes('spec = _szenenbildAnwesenheitsVariante(spec, scene);'),
  'fixed location visuals must switch generically to an available present-NPC variant');
assert(fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'strauss', 'strauss-geschaeft-krummbein-day.webp'))
  && fs.existsSync(path.join(__dirname, '..', 'assets', 'scenes', 'strauss', 'strauss-geschaeft-krummbein-night.webp')),
  'Strauss shop must provide day and night visuals with Krummbein visibly present');
assert(html.includes('const gestandnisIndiz = ind && /gestaendnis|geständnis|ueberfuehrt|überführt/')
  && html.includes('GESTÄNDNIS-Prosa ergänzt'),
  'a mechanically booked confession must be visible in prose instead of ending in denial');
assert(/id: 'krummbein_gestaendnis'[\s\S]*?fundText: '[^']*Ich habe Ludwig[^']*Es sollte wie Selbstmord aussehen[^']*', prosaPflicht:/.test(strauss),
  'Krummbein must confess in first person instead of narrating an unknown third-party killer');
assert(/id: 'krummbein_gestaendnis'[\s\S]*?prosaPflicht: \{ replaceOnFallback: true/.test(strauss)
  && html.includes('const erzwungenerFund = !!(prosaPflicht.replaceOnFallback')
  && html.includes('(strukturierterFund || erzwungenerFund)'),
  'a contradictory confession must be replaced rather than followed by an appended opposite account');
assert(html.includes('const deniedVeiledWoman = _arrivalNames.some(function(name)')
  && html.includes('return !deniedNamedActor && !deniedVeiledWoman;'),
  'opening roster repair must remove an explicit departure contradiction before restoring the actor');
assert(html.includes('const _personenNameSeen = {};')
  && html.includes('const _hauptuiPersonenNameKey = function(name)')
  && html.includes('_personenNameSeen[nameKey]'),
  'the main UI must merge titled and untitled variants of the same person');
assert(html.includes('Feste Ortsbindungen gelten auch fuer den Haupt-UI-Cast')
  && html.includes('_npcGehoertHierher(npc.id, npc.name)'),
  'the main UI must not carry a location-bound witness into a foreign scene');
assert(html.includes('function _findResolutionPoliceDrift(scene)')
  && html.includes("code: 'resolution_police_drift'")
  && html.includes("problem.name + ' von der '")
  && html.includes("const _abschlussPolizei = caseSetup && caseSetup.abschlussPolizei;"),
  'a configured police handoff must be validated and deterministically repaired at resolution');
assert(html.includes('letzteAktion.istReise || letzteAktion.istOptionReise')
  && html.includes("typeof _aktuelleAktionIstReise !== 'undefined' && _aktuelleAktionIstReise"),
  'fixed interior validation must retain the travel marker across the full processing cycle');
assert(html.includes("const required = ((option._istOpening || typeof getCaseLocations !== 'function')")
  && html.includes('const istReiseAnkunft = !!(option && (option._istReise')
  && html.includes('allowedRoster: arrivalAllowed.slice()'),
  'travel validation must not authorize stale actors from the departure location');
assert(/id: 'krummbein_gestaendnis'[\s\S]*?abschlussEffekt: \{ verantwortlicher: 'Paul Krummbein', suspectConfronted: true, ueberfuehrt: true, wahrheitErkannt: true/.test(strauss),
  'Krummbein confession must heal and unlock the resolution flags even in an old save');
assert(html.includes("['requiresEvidenceAll', 'requiresEvidenceAny', 'truthBeatIds', 'schluessel'].forEach(function(feld)")
  && html.includes('vorhanden.abschlussEffekt = qi.abschlussEffekt;'),
  'old saves must refresh canonical evidence-chain and resolution metadata on existing clues');
assert(html.includes('gespeichert.feindlich !== false')
  && html.includes("&& (typeof _npcIstFeindlich !== 'function' || _npcIstFeindlich(c))")
  && html.includes("_npcAusAktiverSzeneEntfernen(gespeichert, 'ungueltiger-neutraler-showdown')")
  && html.includes('return !(setupNpc && setupNpc.feindlich === false);')
  && html.includes('function _neutraleNpcOrtsAltlastenBereinigen()')
  && html.includes('engineCurrentLocation.npcs = engineCurrentLocation.npcs.filter')
  && html.includes("if (typeof qc.feindlich === 'boolean' && c.feindlich !== qc.feindlich)")
  && html.includes('FINALER NEUTRAL-NPC-BLOCK:')
  && html.includes('caseProgress.ueberfuehrt && caseProgress.suspectConfronted'),
  'showdown selection must reject explicit neutral actors and not invent a second boss fight after conviction');
assert(html.includes("const _resolveButtonText = _resolveIstEigenauftrag")
  && html.includes("'Fall abschließen, Wahrheit festhalten'")
  && html.includes("if (_resolveIstEigenauftrag) {")
  && html.includes("'Karl schließt seinen Eigen-Auftrag ab.")
  && html.includes('eigenauftrag = /eigen-?auftrag|eigener klient|aus eigenem antrieb/i.test(eigenText)')
  && html.includes('Karl gibt Beweise und Geständnis weiter'),
  'self-assigned cases must resolve without an external client report, phone call or fee');
assert(html.includes("progressLine = _progressIstEigenauftrag")
  && html.includes("'▓▓▓▓▓ (Wahrheit festhalten)'"),
  'self-assigned case progress must not instruct Karl to report to himself');
assert(html.includes("'Karl hält in seiner eigenen Akte fest, was wirklich geschah, und benennt '"),
  'self-assigned case end screen must not report the truth from Karl to Karl');

console.log('strauss-opening-flow: ok');
