// Vercel Serverless Function: /api/deploy
// Schreibt Datei-Inhalte direkt in das Schatten-GitHub-Repo.
// Wird vom Admin-Deploy-Modal in index.html aufgerufen.
//
// SICHERHEIT:
// 1. Push-Passwort wird per SHA256-Hash im Server verglichen.
//    Der Klartext ist NIE im HTML oder JS, nur in Vercel-Env-Vars.
// 2. GITHUB_TOKEN (Fine-grained PAT, scope nur dieses Repo, Contents:RW)
//    liegt in Vercel-Env-Vars, NIE im Client-Code.
// 3. Erlaubte Pfade sind whitelisted - keine beliebigen Dateien.
//
// Aufruf vom Frontend:
//   POST /api/deploy
//   { password: "...", path: "index.html", content: "<!DOCTYPE...", commitMessage: "v6.62: ..." }

import crypto from 'crypto';

// Whitelist: nur diese Dateien duerfen ueberschrieben werden
const ALLOWED_PATHS = new Set([
  'index.html',
  'api/groq.js',
  'api/gemini.js',
  'api/mistral.js',
  'api/deploy.js',  // ja, der Endpoint kann sich selbst aktualisieren - vorsichtig damit
]);

// Hartes Maximum, falls jemand versucht das Repo mit Riesen-Files zu fluten.
// index.html ist aktuell ca. 520KB, also 2MB Headroom.
const MAX_CONTENT_BYTES = 2 * 1024 * 1024;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // KILL-SWITCH (Sicherheit): Dieser Endpoint kann als EINZIGER ins GitHub-Repo schreiben
  // und ist damit die sensibelste Funktion. Standardmaessig DEAKTIVIERT. Er laeuft NUR,
  // wenn die Vercel-Env DEPLOY_ENABLED exakt 'true' ist. Solange sie fehlt/anders ist,
  // antwortet er sofort mit 403 - kein GitHub-Token wird geladen, kein Schreibzugriff
  // moeglich, selbst mit korrektem Passwort. Deploy laeuft ohnehin manuell ueber Vercel
  // Settings -> Deploy; dieser Weg bleibt tot bis er bewusst per Env-Var reaktiviert wird.
  if (process.env.DEPLOY_ENABLED !== 'true') {
    return res.status(403).json({ error: 'Deploy-Endpoint ist deaktiviert. (Aktivierung nur ueber Vercel-Env DEPLOY_ENABLED=true.)' });
  }

  // Env-Vars laden
  const githubToken = process.env.GITHUB_TOKEN;
  const deployPasswordHash = process.env.DEPLOY_PASSWORD_HASH;
  const githubRepo = process.env.GITHUB_REPO || 'benlebt/Schatten';
  const githubBranch = process.env.GITHUB_BRANCH || 'main';

  if (!githubToken) {
    return res.status(500).json({ error: 'GITHUB_TOKEN nicht konfiguriert in Vercel-Env-Vars.' });
  }
  if (!deployPasswordHash) {
    return res.status(500).json({ error: 'DEPLOY_PASSWORD_HASH nicht konfiguriert in Vercel-Env-Vars.' });
  }

  const { password, path, content, commitMessage } = req.body || {};

  // ---- 1. Validierung ----
  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Password fehlt.' });
  }
  if (typeof path !== 'string' || !ALLOWED_PATHS.has(path)) {
    return res.status(400).json({ error: 'Pfad nicht erlaubt: ' + path + '. Erlaubt sind: ' + [...ALLOWED_PATHS].join(', ') });
  }
  if (typeof content !== 'string' || content.length === 0) {
    return res.status(400).json({ error: 'Content fehlt oder leer.' });
  }
  if (content.length > MAX_CONTENT_BYTES) {
    return res.status(413).json({ error: 'Content zu gross: ' + content.length + ' Bytes (max ' + MAX_CONTENT_BYTES + ')' });
  }
  if (typeof commitMessage !== 'string' || commitMessage.length === 0) {
    return res.status(400).json({ error: 'Commit-Message fehlt.' });
  }
  if (commitMessage.length > 500) {
    return res.status(400).json({ error: 'Commit-Message zu lang.' });
  }

  // ---- 2. Passwort-Pruefung (Timing-safe) ----
  const inputHash = crypto.createHash('sha256').update(password).digest('hex');
  // Timing-safe Vergleich gegen Side-Channel
  let passwordOk = false;
  try {
    const a = Buffer.from(inputHash, 'hex');
    const b = Buffer.from(deployPasswordHash, 'hex');
    if (a.length === b.length) {
      passwordOk = crypto.timingSafeEqual(a, b);
    }
  } catch {
    passwordOk = false;
  }
  if (!passwordOk) {
    // Mit kurzem Delay um Brute-Force zu erschweren
    await new Promise(r => setTimeout(r, 1500));
    return res.status(401).json({ error: 'Falsches Passwort.' });
  }

  // ---- 3. GitHub: aktuelle SHA der Datei holen ----
  // Wir brauchen die SHA des aktuellen Files, sonst lehnt GitHub den Update-Call ab.
  const githubApiBase = 'https://api.github.com/repos/' + githubRepo + '/contents/' + path;
  const headers = {
    'Authorization': 'Bearer ' + githubToken,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Schatten-Deploy-Endpoint',
  };

  let currentSha = null;
  try {
    const getRes = await fetch(githubApiBase + '?ref=' + githubBranch, { headers });
    if (getRes.status === 200) {
      const getData = await getRes.json();
      currentSha = getData.sha;
    } else if (getRes.status === 404) {
      // Datei existiert noch nicht - das ist erlaubt fuer neue Files
      currentSha = null;
    } else {
      const errText = await getRes.text();
      return res.status(502).json({ error: 'GitHub GET fehlgeschlagen (' + getRes.status + '): ' + errText.slice(0, 300) });
    }
  } catch (e) {
    return res.status(502).json({ error: 'GitHub GET-Call-Fehler: ' + e.message });
  }

  // ---- 4. GitHub: Datei updaten (oder erstellen) ----
  // GitHub Contents-API erwartet Base64-encoded Content
  const contentBase64 = Buffer.from(content, 'utf-8').toString('base64');
  const putBody = {
    message: commitMessage,
    content: contentBase64,
    branch: githubBranch,
  };
  if (currentSha) {
    putBody.sha = currentSha; // pflicht beim Update, weglassen beim Create
  }

  try {
    const putRes = await fetch(githubApiBase, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(putBody),
    });

    if (putRes.status === 200 || putRes.status === 201) {
      const putData = await putRes.json();
      // Vercel wird durch den Commit automatisch ausgeloest
      return res.status(200).json({
        ok: true,
        path: path,
        commitSha: putData.commit ? putData.commit.sha : null,
        commitUrl: putData.commit ? putData.commit.html_url : null,
        bytesWritten: content.length,
        message: 'Commit erstellt. Vercel-Deploy laeuft jetzt automatisch.',
      });
    } else {
      const errText = await putRes.text();
      return res.status(502).json({
        error: 'GitHub PUT fehlgeschlagen (' + putRes.status + '): ' + errText.slice(0, 500),
      });
    }
  } catch (e) {
    return res.status(502).json({ error: 'GitHub PUT-Call-Fehler: ' + e.message });
  }
}
