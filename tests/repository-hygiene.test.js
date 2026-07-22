const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const self = path.relative(root, __filename).replace(/\\/g, '/');
const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .split(/\r?\n/).filter(Boolean);
const textFiles = tracked.filter(file => /\.(?:html|js|md|json|txt|ya?ml|toml|ini|cfg|conf)$/i.test(file));

const privateName = ['Ben', 'jamin'].join('');
const localUser = ['ben', 'le'].join('');
const retiredDebugPhrase = ['harden', 'berg', '17'].join('');
const forbidden = [
  ['privater Schlüssel', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['OpenAI-Schlüssel', /\bsk-[A-Za-z0-9_-]{20,}\b/],
  ['Google-Schlüssel', /\bAIza[0-9A-Za-z_-]{30,}\b/],
  ['GitHub-Token', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/],
  ['Slack-Token', /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/],
  ['Zugangsdaten in URL', /https?:\/\/[^\s/:]+:[^\s/@]+@/],
  ['persönlicher Windows-Pfad', /\bC:\\Users\\[^\\\s]+/i],
  ['Vercel-Projekt-ID', /\bprj_[A-Za-z0-9]{20,}\b/],
  ['private Projektleitungsnennung', new RegExp('\\b' + privateName + '\\b', 'i')],
  ['lokaler Benutzername', new RegExp('\\b' + localUser + '\\b', 'i')],
  ['ausgemusterte Debug-Passphrase', new RegExp('\\b' + retiredDebugPhrase + '\\b', 'i')],
];

for (const file of textFiles) {
  if (file === self) continue;
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  for (const [label, pattern] of forbidden) {
    assert(!pattern.test(content), `${label} darf nicht im Repository stehen: ${file}`);
  }
}

assert(!tracked.some(file => /^\.env(?:\.|$)/.test(file) && file !== '.env.example'),
  'echte .env-Dateien dürfen nicht versioniert sein');
assert(!tracked.some(file => /^\.git-broken-/i.test(file)),
  'lokale Git-Recovery-Verzeichnisse dürfen nicht versioniert sein');

const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
for (const required of ['.git-broken-*/', '.env', '.env.*', '.vercel/', 'node_modules/', 'test-runs/']) {
  assert(gitignore.includes(required), `.gitignore muss ${required} ausschließen`);
}

const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
for (const variable of [
  'GEMINI_API_KEY', 'GROQ_API_KEY', 'MISTRAL_API_KEY', 'SPIEL_PASSWORT',
  'DEPLOY_ENABLED', 'GITHUB_TOKEN', 'DEPLOY_PASSWORD_HASH', 'GITHUB_REPO', 'GITHUB_BRANCH',
]) {
  assert(new RegExp('^' + variable + '=', 'm').test(envExample), `.env.example fehlt ${variable}`);
}
assert(!/^(?:GEMINI_API_KEY|GROQ_API_KEY|MISTRAL_API_KEY|SPIEL_PASSWORT|GITHUB_TOKEN|DEPLOY_PASSWORD_HASH|GITHUB_REPO)=.+$/m.test(envExample),
  '.env.example darf keine geheimen oder persönlichen Werte enthalten');

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert(html.includes("dbgParam === 'on' || dbgParam === '1'"),
  'Debug muss ein transparenter lokaler Schalter statt eines Frontend-Passworts sein');
assert(!html.includes('DEBUG_PASSWORD_HASH'), 'ein Frontend-Passworthash ist keine Sicherheitsgrenze');

const deploy = fs.readFileSync(path.join(root, 'api', 'deploy.js'), 'utf8');
assert(deploy.includes('const githubRepo = process.env.GITHUB_REPO;'),
  'das Zielrepository muss aus der Hosting-Umgebung kommen');
assert(deploy.includes("process.env.DEPLOY_ENABLED !== 'true'"),
  'der schreibende Deploy-Endpunkt muss standardmäßig deaktiviert bleiben');

console.log('REPOSITORY_HYGIENE_OK');
