const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sourceOf(name) {
  const start = html.indexOf('function ' + name + '(');
  assert(start >= 0, 'missing function ' + name);
  let depth = 0;
  let opened = false;
  for (let i = start; i < html.length; i += 1) {
    if (html[i] === '{') { depth += 1; opened = true; }
    else if (html[i] === '}') {
      depth -= 1;
      if (opened && depth === 0) return html.slice(start, i + 1);
    }
  }
  throw new Error('unterminated function ' + name);
}

assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1253 +MfS-Beobachtung-Haftdruck'"), 'Krause release version missing');
assert(html.includes("file: 'karl-mauers-buero-theodor-day.png'"), 'Krause opening must show Theodor in Karl office');
assert(html.includes("root: 'assets/scenes/krause/'"), 'Krause opening image must resolve from the case scene directory');
assert(html.includes('AKTIONS-TREUE (ABSOLUT)'), 'physical and item actions need a strict narration contract');
assert(html.includes('ZUSTANDS-TREUE (ABSOLUT)'), 'NPC battle states need a strict narration contract');
assert(html.includes('function _verfassungNullSichern(reason)'), 'zero health needs a central forced ending');
assert(html.includes('Verwende nie die Formeln "Aktenmensch"'), 'reputation prose must ban the recurring stock phrase');
assert(html.includes('Krause hat deshalb selbst KEINE Anzeige erstattet'), 'Krause must not contradict his no-police premise');
assert(html.includes('Bornsteins Antiquitätenladen liegt in der Bergmannstraße'), 'Krause locations need an explicit address truth');

const bornsteinStart = html.indexOf("name: 'Bornsteins Antiquitätenladen'");
assert(bornsteinStart >= 0, 'Bornstein location missing');
const bornsteinBlock = html.slice(bornsteinStart, bornsteinStart + 1200);
assert(bornsteinBlock.includes("oeffnungszeit: ['morgen','vormittag','mittag','nachmittag','abend']"), 'Bornstein must close at night');
assert(!bornsteinBlock.includes("'nacht'"), 'Bornstein opening hours must not include night');

const targetItemStart = html.indexOf("id: 'silbernes_zigarettenetui'", html.indexOf('function _baukastenZiele()'));
assert(targetItemStart >= 0, 'silver cigarette case target missing');
assert(html.slice(targetItemStart, targetItemStart + 500).includes("sonderAktion: 'diebesgut_sichern'"), 'stolen case needs a deterministic secure action');

const itemVerbs = sourceOf('_hauptuiItemVerben');
assert(itemVerbs.includes("encodeURIComponent(String(feind.id || feind.name || ''))"), 'item actions must encode a stable selected enemy key');
assert(itemVerbs.includes("'werfen::' + ziel"), 'throw actions must encode the selected enemy');
assert(itemVerbs.includes("'werfen_fuesse::' + ziel"), 'distraction actions must encode the selected enemy');
assert(itemVerbs.includes("'angreifen_mit::' + ziel"), 'melee item actions must encode the selected enemy');

const execute = sourceOf('_hauptuiExecute');
assert(execute.includes('_hauptuiKonfrontationAufZiel(feind)'), 'execution must switch the confrontation to the explicitly selected enemy');
assert(execute.includes("verb === 'diebesgut_zurueckgeben'"), 'Theodor needs a direct stolen-goods return action');
assert(execute.includes("verb === 'diebesgut_sichern'"), 'Frieda finale needs a direct stolen-goods secure action');

const hostile = sourceOf('_npcIstFeindlich');
assert(hostile.includes('npc.tagExtra'), 'hostility must include secondary tags such as Frieda gangster metadata');
const attackable = sourceOf('_hauptuiAngreifbarePersonen');
assert(attackable.includes('npc.tagExtra'), 'multi-enemy target list must include secondary hostile tags');

const takeItem = sourceOf('_fundItemAufnehmenDirekt');
assert(takeItem.includes('_geldZahle(preis'), 'Trude merchandise must actually charge its visible price');
assert(html.includes("'Kaufe · ' + preis + ' Ostmark'"), 'Trude merchandise price must be visible before purchase');

const battleFx = sourceOf('fxBattle');
assert(battleFx.indexOf('return;') < battleFx.indexOf('document.createElement'), 'legacy emoji battle cards must be unreachable');
const planFx = sourceOf('fxPlan');
assert(/function fxPlan\(plan, gabFehlschlag\) \{\s*return;/.test(planFx), 'legacy emoji plan cards must be unreachable');

assert(html.includes('function _hauptuiFokussierePerson(npc)'), 'legacy NPC hotspots must redirect into Haupt-UI selection');
assert(/function oeffneNpcMenue[\s\S]{0,400}?_hauptuiFokussierePerson\(npc\)/.test(html), 'NPC menu entry must avoid the second-click popup');
assert(!sourceOf('_hauptuiEmpfohleneAktion').includes("return 'umsehen'"), 'empty places must not offer a no-op search button');

console.log('KRAUSE_MULTIENEMY_FLOW_OK');
