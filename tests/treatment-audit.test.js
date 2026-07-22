const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('function _lektoratBehandlungsart(');
const end = html.indexOf('\nfunction buildTranscriptText(', start);
assert(start >= 0 && end > start, 'treatment audit helper missing');

const context = {
  normForMatch(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
};
vm.createContext(context);
vm.runInContext(html.slice(start, end), context);

assert.strictEqual(context._lektoratBehandlungsart({
  type: 'scene', professionalTreatment: true, ort: 'Charité', text: 'Kurze Folgeszene.'
}), 'professional', 'hard HEILEN marker must override sparse prose');

assert.strictEqual(context._lektoratBehandlungsart({
  type: 'scene', ort: 'Charité',
  text: 'Marlene säubert die Wunde mit geübten Handgriffen und legt einen festen Verband an.'
}), 'professional', 'Wegener Marlene prose must count as professional treatment');

assert.strictEqual(context._lektoratBehandlungsart({
  type: 'scene', ort: 'Charité', text: 'Karl wartet im Flur auf eine Auskunft.'
}), '', 'a hospital visit alone must not count as treatment');

assert.strictEqual(context._lektoratBehandlungsart({
  type: 'scene', selfTreatment: true, ort: 'Hinterhof', text: 'Karl zieht weiter.'
}), 'self', 'hard NOTHEILEN marker must count as self-treatment');

assert(html.includes('professionalTreatment: !!(categoryMechanicsResult && categoryMechanicsResult.professionalTreatment)'),
  'scene log must persist the professional treatment marker');
assert(html.includes("selfTreatment: (typeof _catForIndizFilter === 'string' && _catForIndizFilter === 'NOTHEILEN')"),
  'scene log must persist the self-treatment marker');

console.log('TREATMENT_AUDIT_OK');
