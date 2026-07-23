const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function sourceOf(name) {
  const start = html.indexOf('function ' + name + '(');
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
    else if (ch === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error('unterminated function ' + name);
}

// A closed iOS AudioContext must be replaced together with its dead stream route.
let oldRoutePaused = 0;
let oldRouteRemoved = 0;
let newContextCount = 0;
class FakeAudioContext {
  constructor() {
    newContextCount += 1;
    this.state = 'suspended';
    this.resumeCalls = 0;
  }
  resume() {
    this.resumeCalls += 1;
    this.state = 'running';
    return Promise.resolve();
  }
}
const oldRoute = {
  pause() { oldRoutePaused += 1; },
  remove() { oldRouteRemoved += 1; },
  srcObject: { old: true },
};
const sfxContext = {
  console,
  window: { AudioContext: FakeAudioContext, _schattenAudioGesteNoetig: false },
  document: { getElementById: id => (id === 'sfx-route' ? oldRoute : null) },
  sfxOn: () => true,
  closedContext: { state: 'closed' },
};
vm.createContext(sfxContext);
vm.runInContext(
  'var _sfxCtx = closedContext; var _sfxDest = { old: true };\n'
    + sourceOf('_sfxRouteZuruecksetzen') + '\n'
    + sourceOf('_sfx'),
  sfxContext,
);
const replacement = sfxContext._sfx();
assert(replacement instanceof FakeAudioContext, 'closed iOS AudioContext must be replaced');
assert.strictEqual(newContextCount, 1, 'exactly one replacement AudioContext must be created');
assert.strictEqual(replacement.state, 'running', 'replacement context must be resumed immediately');
assert.strictEqual(oldRoutePaused, 1, 'dead iOS stream route must be paused before replacement');
assert.strictEqual(oldRouteRemoved, 1, 'dead iOS stream route must be removed before replacement');
assert.strictEqual(oldRoute.srcObject, null, 'dead route must release its old MediaStream');

const interrupted = {
  state: 'interrupted',
  resumeCalls: 0,
  resume() { this.resumeCalls += 1; this.state = 'running'; return Promise.resolve(); },
};
sfxContext.interrupted = interrupted;
vm.runInContext('_sfxCtx = interrupted;', sfxContext);
assert.strictEqual(sfxContext._sfx(), interrupted, 'interrupted context must be reused');
assert.strictEqual(interrupted.resumeCalls, 1, 'interrupted WebKit context must be resumed, not ignored');

// Foreground recovery must resume the same music source, then unlock SFX on a gesture.
let musicPlayCalls = 0;
let freshTrackCalls = 0;
let routeUnlockCalls = 0;
const audio = {
  currentSrc: 'https://example.test/music7.mp3',
  getAttribute: () => 'music7.mp3',
  play() { musicPlayCalls += 1; return Promise.resolve(); },
};
const foregroundContext = {
  console,
  window: { _schattenAudioGesteNoetig: true },
  document: { hidden: false, getElementById: id => (id === 'bg-music' ? audio : null) },
  localStorage: { getItem: key => (key === 'schatten-music-on' ? '1' : null) },
  playModeWantsMusic: () => true,
  playMusicTrack: () => { freshTrackCalls += 1; return Promise.resolve(); },
  syncMusicButtonText: () => {},
  sfxOn: () => true,
  existingCtx: { state: 'running' },
  _sfx: () => foregroundContext.existingCtx,
  _sfxOut: () => { routeUnlockCalls += 1; },
};
vm.createContext(foregroundContext);
vm.runInContext('var _sfxCtx = existingCtx;\n' + sourceOf('schattenAudioFortsetzen'), foregroundContext);
foregroundContext.schattenAudioFortsetzen(false);
assert.strictEqual(musicPlayCalls, 1, 'foreground event must try to resume background music immediately');
assert.strictEqual(freshTrackCalls, 0, 'foreground resume must preserve track and playback position');
assert.strictEqual(routeUnlockCalls, 0, 'MediaStream route must wait for a real user gesture');
foregroundContext.schattenAudioFortsetzen(true);
assert.strictEqual(musicPlayCalls, 2, 'first foreground gesture must retry music inside the gesture');
assert.strictEqual(routeUnlockCalls, 1, 'first foreground gesture must unlock the SFX media route');
assert.strictEqual(foregroundContext.window._schattenAudioGesteNoetig, false,
  'successful gesture recovery must clear the pending-unlock marker');

audio.currentSrc = '';
audio.getAttribute = () => null;
foregroundContext.schattenAudioFortsetzen(true);
assert.strictEqual(freshTrackCalls, 1, 'a true reload without an audio source must start a playlist track');

const lifecycleStart = html.indexOf('(function _audioNachReloadUndVordergrundFortsetzen()');
const lifecycleEnd = html.indexOf('// --- UI ---', lifecycleStart);
const lifecycle = html.slice(lifecycleStart, lifecycleEnd);
assert(lifecycle.includes("document.addEventListener('visibilitychange'"),
  'audio lifecycle must observe every background/foreground transition');
assert(lifecycle.includes("window.addEventListener('pageshow'"),
  'audio lifecycle must handle iOS page-cache returns');
assert(lifecycle.includes("window.addEventListener('focus'"),
  'audio lifecycle must retry after browser focus returns');
assert(lifecycle.includes("document.addEventListener('touchstart'"),
  'audio lifecycle must unlock inside an iPhone touch gesture');
assert(!lifecycle.includes('removeEventListener'),
  'foreground gesture recovery must remain registered for repeated app switches');
assert(html.includes("window.SCHATTEN_VERSION = 'v7.12.1366 +Innenraum-Erstbesuch'"),
  'release version missing');

console.log('IOS_AUDIO_FOREGROUND_RECOVERY_OK');
