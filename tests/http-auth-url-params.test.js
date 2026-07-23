const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const apiRoot = path.join(__dirname, '..', 'api');
const geminiPhp = fs.readFileSync(path.join(apiRoot, 'gemini.php'), 'utf8');

function sourceOf(name) {
  const marker = 'function ' + name + '(';
  const start = html.indexOf(marker);
  assert(start >= 0, 'missing function ' + name);
  const brace = html.indexOf('{', start);
  let depth = 0;
  let quote = '';
  let escaped = false;
  for (let i = brace; i < html.length; i += 1) {
    const ch = html[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === quote) quote = '';
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') { quote = ch; continue; }
    if (ch === '{') depth += 1;
    if (ch === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error('unterminated function ' + name);
}

const ensureAuth = sourceOf('ensureSpielAuth');
assert(ensureAuth.includes('return true;'), 'Apache Basic Auth must pass case selection');
assert(!ensureAuth.includes('requestSpielAuthInput'), 'retired in-game password prompt is still reachable');
assert(!html.includes('Zugang zu den Fallakten'), 'retired in-game password overlay still ships in the frontend');
assert(!html.includes('spiel-auth-overlay'), 'retired in-game password overlay markup still ships in the frontend');
assert(!html.includes("...(getSpielAuth() ? { 'X-Spiel-Auth': getSpielAuth() } : {})"),
  'browser must not send a second game password');
assert(geminiPhp.includes("getenv('GEMINI_API_KEY')"),
  'Gemini key must be read only from the Hetzner server environment');
assert(geminiPhp.includes('generativelanguage.googleapis.com'),
  'Gemini PHP endpoint must call Google directly');
assert(!geminiPhp.includes('vercel.app'),
  'active Gemini runtime must not depend on Vercel');
assert(!fs.existsSync(path.join(apiRoot, '_proxy.php')),
  'retired Vercel PHP bridge must be removed');

const query = '?debug=hardenberg17&hauptui=0&autoplay=1&turns=12&strategy=varied&seed=77&qa=keepme';
const storage = new Map();
const context = {
  URLSearchParams,
  console,
  window: { location: { search: query } },
  localStorage: {
    getItem(key) { return storage.get(key) || null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); },
  },
  showAdminToast() {},
  applyAdminVisibility() {},
};
vm.createContext(context);
vm.runInContext(
  "const DEBUG_STORAGE_KEY = 'schatten-dbg';\n" +
  sourceOf('setAdminUnlocked') + '\n' +
  sourceOf('processAdminUrlParam'),
  context
);

(async function run() {
  await context.processAdminUrlParam();
  assert.strictEqual(storage.get('schatten-dbg'), 'on', 'documented debug token must unlock admin mode');
  assert.strictEqual(context.window.location.search, query, 'auth/debug processing must preserve every URL parameter');
  for (const parameter of ['hauptui', 'abc', 'autoplay', 'turns', 'strategy', 'seed']) {
    assert(html.includes(parameter), 'known URL parameter disappeared: ' + parameter);
  }
  console.log('HTTP_AUTH_URL_PARAMS_OK');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
