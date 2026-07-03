const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const repoRoot = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');

function runSlice(startNeedle, endNeedle, suffix, context) {
  const start = html.indexOf(startNeedle);
  const end = html.indexOf(endNeedle, start);
  assert(start > -1, startNeedle + ' not found');
  assert(end > start, endNeedle + ' not found after ' + startNeedle);
  vm.runInContext(html.slice(start, end) + suffix, context);
}

const context = { INTRO_REQUIREMENTS: '' };
vm.createContext(context);
runSlice('const INTRO_VARIANTS', 'const DIFFICULTY_ORDER', ';globalThis.INTRO_VARIANTS_TEST=INTRO_VARIANTS;', context);
runSlice('const SHARED_SCENE_IMAGES', 'function _kesslerSceneNorm', ';globalThis.CASE_SCENE_IMAGE_SETS_TEST=CASE_SCENE_IMAGE_SETS;', context);

const cases = context.INTRO_VARIANTS_TEST;
const imageSets = context.CASE_SCENE_IMAGE_SETS_TEST;
assert.strictEqual(cases.length, 14, 'the fixed case pool should still contain all 14 cases');
assert.strictEqual(imageSets.length, 14, 'every fixed case needs a scene image set');

function norm(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ß/g, 'ss').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

function imageSetFor(setup) {
  const fallText = String(setup.klient || '') + ' ' + String(setup.opfer || '') + ' ' + String(setup.tat || '');
  return imageSets.find((set) => set.caseTest.test(fallText));
}

function hostileIdSet(setup) {
  const hostileTags = new Set(['ANTAGONIST', 'SUSPECT', 'GANGSTER', 'STASI']);
  const ids = new Set();
  for (const npc of setup.setupCast || []) {
    if (!npc || !npc.id) continue;
    const tag = String(npc.tag || '').toUpperCase();
    const tagExtra = String(npc.tagExtra || '').toUpperCase();
    if (hostileTags.has(tag) || hostileTags.has(tagExtra)) ids.add(npc.id);
  }
  return ids;
}

for (const imageSet of imageSets) {
  assert(imageSet.root && imageSet.root.startsWith('assets/scenes/'), 'image set root missing');
  assert(Array.isArray(imageSet.images) && imageSet.images.length > 0, 'image set without images');
  for (const spec of imageSet.images) {
    const root = spec.root || imageSet.root;
    assert(spec.file, 'scene image spec without dark file');
    assert(spec.dayFile, 'scene image spec without day file for ' + spec.file);
    assert(fs.existsSync(path.join(repoRoot, root, spec.file)), 'dark scene asset missing: ' + root + spec.file);
    assert(fs.existsSync(path.join(repoRoot, root, spec.dayFile)), 'day scene asset missing: ' + root + spec.dayFile);
  }
}

for (const [caseIndex, variant] of cases.entries()) {
  const setup = variant.setup;
  assert(setup && setup.klient, 'case ' + (caseIndex + 1) + ' has no setup');
  const imageSet = imageSetFor(setup);
  assert(imageSet, 'case has no matching image set: ' + setup.klient);

  const castIds = new Set((setup.setupCast || []).map((npc) => npc && npc.id).filter(Boolean));
  const hostileIds = hostileIdSet(setup);
  const hostilePresentIds = new Set();
  const clueIds = new Set();
  for (const loc of setup.locations || []) {
    const locName = loc && loc.name;
    assert(locName, 'case ' + setup.klient + ' contains a location without name');
    const normalizedLocation = norm(locName);
    const imageSpec = imageSet.images.find((spec) => spec.test.test(normalizedLocation));
    assert(imageSpec, 'location has no scene image mapping: ' + setup.klient + ' -> ' + locName);

    const locNpcIds = new Set((loc.npcs || []).map((npc) => npc && npc.id).filter(Boolean));
    for (const threat of loc.bedrohungen || []) {
      assert(threat.id, 'threat without id: ' + setup.klient + ' -> ' + locName);
      assert(castIds.has(threat.id), 'threat references NPC missing from setupCast: ' + setup.klient + ' -> ' + locName + ' -> ' + threat.id);
      if (hostileIds.has(threat.id)) hostilePresentIds.add(threat.id);
    }
    for (const npc of loc.npcs || []) {
      if (npc && hostileIds.has(npc.id)) hostilePresentIds.add(npc.id);
    }
    for (const clue of loc.indizien || []) {
      assert(clue.id, 'clue without id at ' + setup.klient + ' -> ' + locName);
      assert(!clueIds.has(clue.id), 'duplicate clue id in case ' + setup.klient + ': ' + clue.id);
      clueIds.add(clue.id);
      assert(Array.isArray(clue.actions) && clue.actions.length > 0, 'clue without actions: ' + setup.klient + ' -> ' + clue.id);
      if (clue.npc) {
        assert(castIds.has(clue.npc), 'clue references NPC missing from setupCast: ' + setup.klient + ' -> ' + clue.id + ' -> ' + clue.npc);
        assert(locNpcIds.has(clue.npc), 'clue references NPC not present at its location: ' + setup.klient + ' -> ' + locName + ' -> ' + clue.id + ' -> ' + clue.npc);
      }
    }
  }
  if (hostileIds.size > 0) {
    assert(hostilePresentIds.size > 0, 'case has hostile setupCast but no reachable hostile encounter: ' + setup.klient);
  }
}

assert(html.includes('_preloadSzenenbildSatz(set)'), 'scene image renderer must preload the active case image set');
assert(html.includes('fetchpriority="high"'), 'scene image tag should request high fetch priority');

console.log('CASE_STRUCTURE_AUDIT_OK');
