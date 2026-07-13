const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');

function extract(startNeedle, endNeedle, exportCode, seed = {}) {
  const start = html.indexOf(startNeedle);
  const end = html.indexOf(endNeedle, start);
  assert(start >= 0, startNeedle + ' not found');
  assert(end > start, endNeedle + ' not found after ' + startNeedle);
  const context = { ...seed };
  vm.createContext(context);
  vm.runInContext(html.slice(start, end) + exportCode, context);
  return context;
}

const { CASES } = extract(
  'const INTRO_VARIANTS',
  'const DIFFICULTY_ORDER',
  ';globalThis.CASES=INTRO_VARIANTS;',
  { INTRO_REQUIREMENTS: '' },
);

assert.strictEqual(CASES.length, 14, 'expected all 14 case setups');
assert(html.includes("if (typeof e.abStage === 'number' && _stgJetzt < e.abStage) continue;"),
  'NPC availability count must respect abStage');
assert(html.includes("if (typeof entry.abStage === 'number' && _stgJetzt < entry.abStage) continue;"),
  'NPC rendering must respect abStage');

function label(setup, index) {
  return `case ${index + 1} (${setup.klient || setup.opfer || 'unknown'})`;
}

function text(value) {
  return String(value == null ? '' : value);
}

function regexMatches(regex, value) {
  if (Object.prototype.toString.call(regex) !== '[object RegExp]') return true;
  regex.lastIndex = 0;
  return regex.test(value);
}

function words(value) {
  const stop = new Set(['aber', 'dass', 'eine', 'einer', 'eines', 'einem', 'einen', 'fuer', 'gegen', 'hat', 'hier', 'ihre', 'ihren', 'ist', 'karl', 'keine', 'mit', 'nicht', 'oder', 'seine', 'seinen', 'sich', 'und', 'von', 'vor', 'wurde', 'zum', 'zur']);
  return new Set(text(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').split(/\s+/).filter((word) => word.length >= 4 && !stop.has(word)));
}

function keyClueCoverage(keyClue, configuredClues) {
  const keyWords = words(keyClue);
  let best = 0;
  for (const configured of configuredClues) {
    const configuredWords = words(`${configured.id} ${configured.text} ${configured.fundText}`);
    let overlap = 0;
    for (const word of keyWords) if (configuredWords.has(word)) overlap++;
    best = Math.max(best, overlap);
  }
  return best;
}

const HOSTILE_TAGS = new Set(['ANTAGONIST', 'SUSPECT', 'GANGSTER', 'STASI']);
const GLOBAL_NPC_IDS = new Set([
  'trude',
  'willi_kummer',
  'doc_wagner',
  'marlene_wagner',
  'wilhelm_roth',
  'heinrich_lindner',
]);
const unreachableHostiles = [];
const auditRows = [];

for (const [caseIndex, variant] of CASES.entries()) {
  const setup = variant.setup;
  const caseLabel = label(setup, caseIndex);
  const cast = setup.setupCast || [];
  const castIds = new Set();
  const hostileIds = new Set();

  for (const npc of cast) {
    if (!npc.id) {
      assert(
        (npc.tag === 'CLIENT' && /karl mauer/i.test(text(npc.name)))
          || (npc.tag === 'TARGET' && /diebesgut|zielobjekt/i.test(text(npc.rolle))),
        `${caseLabel}: cast NPC without id: ${npc.name || npc.tag}`,
      );
      continue;
    }
    assert(!castIds.has(npc.id), `${caseLabel}: duplicate cast id ${npc.id}`);
    castIds.add(npc.id);
    const tags = [npc.tag, npc.tagExtra].map((tag) => text(tag).toUpperCase());
    if (tags.some((tag) => HOSTILE_TAGS.has(tag))) hostileIds.add(npc.id);
  }

  const locations = setup.locations || [];
  assert(locations.length >= 4, `${caseLabel}: fewer than four playable locations`);
  const locationNames = new Set();
  const clueIds = new Set();
  const clueById = new Map();
  const references = [];
  const reachableHostiles = new Set();
  const referencedCast = new Set();
  const locationByName = new Map();

  for (const location of locations) {
    assert(location.name, `${caseLabel}: location without name`);
    assert(!locationNames.has(location.name), `${caseLabel}: duplicate location ${location.name}`);
    locationNames.add(location.name);
    locationByName.set(location.name, location);

    const localNpcIds = new Set();
    for (const npcRef of location.npcs || []) {
      assert(npcRef && npcRef.id, `${caseLabel} -> ${location.name}: invalid NPC reference`);
      assert(castIds.has(npcRef.id) || GLOBAL_NPC_IDS.has(npcRef.id),
        `${caseLabel} -> ${location.name}: unknown NPC ${npcRef.id}`);
      assert(!localNpcIds.has(npcRef.id), `${caseLabel} -> ${location.name}: duplicate NPC ${npcRef.id}`);
      localNpcIds.add(npcRef.id);
      referencedCast.add(npcRef.id);
      if (hostileIds.has(npcRef.id)) reachableHostiles.add(npcRef.id);
    }

    for (const threat of location.bedrohungen || []) {
      assert(threat && threat.id, `${caseLabel} -> ${location.name}: threat without id`);
      assert(castIds.has(threat.id), `${caseLabel} -> ${location.name}: unknown threat NPC ${threat.id}`);
      assert(Number(threat.chance) > 0 && Number(threat.chance) <= 100,
        `${caseLabel} -> ${location.name}: invalid threat chance for ${threat.id}`);
      if (threat.abStage != null && threat.bisStage != null) {
        assert(threat.abStage <= threat.bisStage,
          `${caseLabel} -> ${location.name}: impossible stage window for ${threat.id}`);
      }
      if (hostileIds.has(threat.id)) reachableHostiles.add(threat.id);
      referencedCast.add(threat.id);
    }

    for (const clue of location.indizien || []) {
      assert(clue && clue.id, `${caseLabel} -> ${location.name}: clue without id`);
      assert(!clueIds.has(clue.id), `${caseLabel}: duplicate clue id ${clue.id}`);
      clueIds.add(clue.id);
      clueById.set(clue.id, { clue, location });
      assert(Array.isArray(clue.actions) && clue.actions.length,
        `${caseLabel} -> ${clue.id}: no playable actions`);
      if (clue.npc) {
        referencedCast.add(clue.npc);
        assert(castIds.has(clue.npc), `${caseLabel} -> ${clue.id}: unknown clue NPC ${clue.npc}`);
        assert(localNpcIds.has(clue.npc),
          `${caseLabel} -> ${location.name} -> ${clue.id}: clue NPC ${clue.npc} is not present`);
      }
      for (const gate of ['requiresEvidenceAll', 'requiresEvidenceAny']) {
        for (const requiredId of clue[gate] || []) {
          references.push({ clue, requiredId, gate, location });
        }
      }
    }

    const grid = location.explorationGrid;
    if (grid) {
      assert(Array.isArray(grid.grid) && grid.grid.length,
        `${caseLabel} -> ${location.name}: exploration grid has no rows`);
      const width = grid.grid[0].length;
      assert(grid.grid.every((row) => row.length === width),
        `${caseLabel} -> ${location.name}: exploration grid rows differ in width`);
      const cells = grid.zellen || {};
      for (const [symbol, cell] of Object.entries(cells)) {
        assert(grid.grid.some((row) => row.includes(symbol)),
          `${caseLabel} -> ${location.name}: cell ${symbol} is never used`);
        for (const npcId of cell.npcs || []) {
          assert(castIds.has(npcId), `${caseLabel} -> ${location.name}: grid references unknown NPC ${npcId}`);
          assert(localNpcIds.has(npcId),
            `${caseLabel} -> ${location.name}: grid NPC ${npcId} missing from location.npcs`);
        }
        for (const hotspotId of cell.hotspots || []) {
          assert((location.indizien || []).some((clue) => clue.id === hotspotId),
            `${caseLabel} -> ${location.name}: grid hotspot ${hotspotId} has no local clue`);
        }
      }
      const start = grid.start || {};
      assert(start.y >= 0 && start.y < grid.grid.length && start.x >= 0 && start.x < width,
        `${caseLabel} -> ${location.name}: exploration start is outside the grid`);
      assert(grid.grid[start.y][start.x] !== '#',
        `${caseLabel} -> ${location.name}: exploration starts inside a wall`);
      for (const clue of location.indizien || []) {
        if (!clue.hotspot) continue;
        assert(Object.values(cells).some((cell) => (cell.hotspots || []).includes(clue.id)),
          `${caseLabel} -> ${location.name}: hotspot clue ${clue.id} is absent from the grid`);
      }
    }
  }

  for (const ref of references) {
    assert(clueIds.has(ref.requiredId),
      `${caseLabel} -> ${ref.clue.id}: ${ref.gate} references missing clue ${ref.requiredId}`);
    assert(ref.requiredId !== ref.clue.id,
      `${caseLabel} -> ${ref.clue.id}: clue depends on itself`);
    const prerequisite = clueById.get(ref.requiredId).clue;
    const gateStage = ref.clue.abStage == null ? 1 : ref.clue.abStage;
    const resultStage = prerequisite.stage == null ? gateStage : prerequisite.stage;
    assert(resultStage >= gateStage - 1,
      `${caseLabel} -> ${ref.clue.id}: prerequisite ${ref.requiredId} cannot reach its stage gate`);
  }

  for (const hostileId of hostileIds) {
    if (!reachableHostiles.has(hostileId)) {
      unreachableHostiles.push(`${caseLabel}: hostile cast NPC ${hostileId} has no location or threat route`);
    }
  }

  assert(clueIds.size >= 3, `${caseLabel}: fewer than three configured clues`);
  for (const keyClue of setup.keyClues || []) {
    assert(!/NAMENS-HINWEIS|NICHT relevant/i.test(keyClue),
      `${caseLabel}: keyClues contains a prompt instruction instead of an obtainable clue`);
  }

  if (setup.caseType === 'vermisst') {
    const resolution = setup.targetResolution;
    assert(resolution && ['physical', 'proof'].includes(resolution.mode),
      `${caseLabel}: missing explicit targetResolution`);
    if (resolution.mode === 'proof') {
      assert(text(resolution.reason).length >= 12,
        `${caseLabel}: proof-only targetResolution needs a reason`);
    } else {
      assert(castIds.has(resolution.npc),
        `${caseLabel}: targetResolution references unknown NPC ${resolution.npc}`);
      const targetLocation = locationByName.get(resolution.location);
      assert(targetLocation,
        `${caseLabel}: targetResolution references unknown location ${resolution.location}`);
      const targetRef = (targetLocation.npcs || []).find((entry) => entry.id === resolution.npc);
      assert(targetRef,
        `${caseLabel}: physical target ${resolution.npc} is not present at ${resolution.location}`);
      assert(targetRef.abStage === resolution.abStage,
        `${caseLabel}: target stage does not match targetResolution at ${resolution.location}`);
      assert(targetLocation.startBekannt === false && Array.isArray(targetLocation.freischaltBei)
        && targetLocation.freischaltBei.length,
      `${caseLabel}: physical target location must be clue-gated`);
    }
  }

  if (Object.prototype.toString.call(setup.requiredProof) === '[object RegExp]') {
    const obtainableTruth = locations.flatMap((location) => [
      location.name,
      ...(location.indizien || []).flatMap((clue) => [clue.id, clue.text, clue.fundText]),
    ]).map(text).join('\n');
    assert(regexMatches(setup.requiredProof, obtainableTruth),
      `${caseLabel}: requiredProof cannot be earned from any configured clue or location`);
  }
  auditRows.push({
    case: caseLabel,
    type: setup.caseType,
    locations: locations.length,
    clues: clueIds.size,
    keyClues: (setup.keyClues || []).length,
    cast: cast.length,
    unplacedCast: cast.filter((npc) => npc.id && !referencedCast.has(npc.id) && !npc.anwesend)
      .map((npc) => `${npc.id}:${npc.tag}${npc.tagExtra ? '+' + npc.tagExtra : ''}`),
    weakKeyClues: (setup.keyClues || []).filter((keyClue) =>
      keyClueCoverage(keyClue, [...clueById.values()].map((entry) => entry.clue)) < 2),
  });
}

if (process.env.CASE_AUDIT_REPORT === '1') console.log(JSON.stringify(auditRows, null, 2));
assert.deepStrictEqual(unreachableHostiles, [], unreachableHostiles.join('\n'));

console.log('CASE_PLAYABILITY_AUDIT_OK');
