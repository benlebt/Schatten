const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert(html.includes("const textStart = lastScene.querySelector('.scene-text') || lastScene;"),
  'new-scene auto-scroll must anchor to the readable scene text');
assert(html.includes("window.scrollTo({ top: absoluteTop, behavior: 'auto' });"),
  'new-scene auto-scroll must settle deterministically after layout');
assert(!html.includes("window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });\n    }\n  }\n  // v7.3: Vorlesen-Button"),
  'manual scene rendering must never fall back to the page bottom');

console.log('SCENE_READING_SCROLL_OK');
