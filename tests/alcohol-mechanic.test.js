const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

[
    'function _alkoholStufe()',
    'function _katerStufe()',
    'function _alkoholKampfMalus()',
    'function _alkoholMutBonus()',
    'function _alkoholNachSchlaf()',
    'function _katerLindern(',
    'function _alkoholNpcProfil(',
    'function _alkoholBluffBereitsGenutzt(',
    'function _alkoholBluffSpeichern(',
    'LEICHTER RAUSCH ALS WELTZUSTAND',
    'STARKER RAUSCH ALS WELTZUSTAND',
    'KATER ALS WELTZUSTAND',
    'Frecher Bluff',
    'Frecher Rausch-Bluff',
    'hauptui-condition-strip',
    "'kaffee_trinken'",
    "'kater_essen'"
].forEach((needle) => assert(html.includes(needle), `Rausch-Baustein fehlt: ${needle}`));

assert(!html.includes('profil.regel'), 'Veralteter NPC-Profilzugriff profil.regel gefunden');
assert(!html.includes('profil.hinweis'), 'Veralteter NPC-Profilzugriff profil.hinweis gefunden');
assert(
    /alkohol:\s*0,\s*alkoholSzenen:\s*0,\s*kater:\s*0,\s*katerSzenen:\s*0,\s*alkoholSozialLog:\s*\{\}/.test(html),
    'Initialer Rausch- und Katerzustand fehlt'
);

function sourceOf(name) {
    const start = html.indexOf(`function ${name}`);
    assert(start >= 0, `Funktion ${name} fehlt`);
    const brace = html.indexOf('{', start);
    let depth = 0;
    for (let i = brace; i < html.length; i += 1) {
        if (html[i] === '{') depth += 1;
        if (html[i] === '}') {
            depth -= 1;
            if (depth === 0) return html.slice(start, i + 1);
        }
    }
    throw new Error(`Funktion ${name} ist unvollständig`);
}

const functionNames = [
    '_alkoholStufe',
    '_katerStufe',
    '_alkoholKampfMalus',
    '_alkoholMutBonus',
    '_alkoholNachSchlaf',
    '_katerLindern',
    '_alkoholBluffKey',
    '_alkoholBluffBereitsGenutzt',
    '_alkoholBluffSpeichern'
];
const context = {
    caseProgress: { alkohol: 0, alkoholSzenen: 0, kater: 0, katerSzenen: 0, alkoholSozialLog: {} },
    sceneCounter: 7,
    normForMatch(value) { return String(value || '').toLowerCase().trim(); },
    saveGameState() {},
    diag() {}
};
vm.createContext(context);
vm.runInContext(functionNames.map(sourceOf).join('\n'), context);

context.caseProgress.alkohol = 1;
assert.strictEqual(context._alkoholMutBonus(), 1, 'Rauschstufe 1 soll Mut +1 geben');
assert.strictEqual(context._alkoholKampfMalus(), 0, 'Rauschstufe 1 soll den Kampf nicht schwächen');

context.caseProgress.alkohol = 2;
assert.strictEqual(context._alkoholMutBonus(), 2, 'Rauschstufe 2 soll Mut +2 geben');
assert.strictEqual(context._alkoholKampfMalus(), 0, 'Rauschstufe 2 soll den Kampf nicht schwächen');

context.caseProgress.alkohol = 3;
assert.strictEqual(context._alkoholMutBonus(), 0, 'Starker Rausch darf keinen Mutbonus geben');
assert.strictEqual(context._alkoholKampfMalus(), 2, 'Rauschstufe 3 soll Kampfmalus 2 geben');
context._alkoholNachSchlaf();
assert.strictEqual(context.caseProgress.alkohol, 0, 'Schlaf muss den Rausch beseitigen');
assert.strictEqual(context.caseProgress.kater, 1, 'Rauschstufe 3 soll leichten Kater erzeugen');

const schiele = { id: 'schiele', name: 'Schiele' };
context.caseProgress.alkohol = 2;
context._alkoholBluffSpeichern(schiele, 'amuesiert', 'vorteil');
assert.strictEqual(context._alkoholBluffBereitsGenutzt(schiele), true, 'Ein Bluff muss pro Gegenueber verbraucht werden');
context.caseProgress.kater = 2;
context._alkoholNachSchlaf();
assert.strictEqual(context.caseProgress.kater, 2, 'Schlaf darf einen bereits schweren Kater nicht loeschen');
assert.strictEqual(Object.keys(context.caseProgress.alkoholSozialLog).length, 0, 'Schlaf muss verbrauchte Rausch-Bluffs zuruecksetzen');

context.caseProgress.alkohol = 4;
context._alkoholNachSchlaf();
assert.strictEqual(context.caseProgress.kater, 2, 'Rauschstufe 4 soll schweren Kater erzeugen');
assert.strictEqual(context._alkoholKampfMalus(), 1, 'Schwerer Kater soll Kampfmalus 1 geben');
context._katerLindern(1);
assert.strictEqual(context.caseProgress.kater, 1, 'Kaffee oder Essen soll den Kater lindern');

console.log('alcohol-mechanic.test.js: OK');
