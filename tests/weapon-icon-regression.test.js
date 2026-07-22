const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert(!html.includes('🔫'), 'water-pistol emoji must be absent from the application source');
assert(html.includes('.noir-weapon-icon'), 'Noir weapon SVG styling is missing');

const itemStart = html.indexOf('function noirWeaponIconMarkup(');
const itemEnd = html.indexOf('function pickNpcEmoji(name)', itemStart);
assert(itemStart >= 0 && itemEnd > itemStart, 'weapon item helper block missing');
const itemContext = {
  normForMatch(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
};
vm.createContext(itemContext);
vm.runInContext(html.slice(itemStart, itemEnd), itemContext);
const itemIcon = itemContext.pickItemIconMarkup('Walther PPK (eigene Pistole)');
assert(itemIcon.includes('<svg') && itemIcon.includes('noir-weapon-icon'), 'weapon item must render as Noir SVG');

const clueStart = html.indexOf('function pickIndizEmoji(');
const clueEnd = html.indexOf('// v7.9.9: Liefert einen sprachlich sauberen Status-String', clueStart);
assert(clueStart >= 0 && clueEnd > clueStart, 'clue icon helper missing');
const clueContext = {
  noirWeaponIconMarkup: itemContext.noirWeaponIconMarkup,
  normForMatch: itemContext.normForMatch
};
vm.createContext(clueContext);
vm.runInContext(html.slice(clueStart, clueEnd), clueContext);
const clueIcon = clueContext.pickIndizEmoji('Die Pistole im Handschuhfach ist nicht Karls Walther.');
assert(clueIcon.includes('<svg') && clueIcon.includes('noir-weapon-icon'), 'weapon clue must render as Noir SVG');
assert.strictEqual(clueContext.pickIndizEmoji('Ein Brief mit unbekannter Unterschrift'), '✉️', 'ordinary clue icon changed');

console.log('WEAPON_ICON_REGRESSION_OK');
