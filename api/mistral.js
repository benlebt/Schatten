// Vercel Serverless Function: Proxy fuer Mistral AI API
// Haelt den API-Key serverseitig geheim, damit er nie im Browser landet.
//
// Aufruf vom Frontend: POST /api/mistral mit { messages: [...], model: 'mistral-medium-latest' }
// Antwort: Im OpenAI-Format durchgereicht (kompatibel zu /api/gemini und /api/groq).
//
// VORTEIL Mistral Free Tier:
// - 1 Request pro Sekunde
// - 500.000 Tokens pro Minute
// - 1 Milliarde Tokens pro Monat
// Das ist viel groesszuegiger als Groq (8K TPM bei Llama 70B), daher koennen wir hier
// den vollen Frontend-System-Prompt verwenden (wie Gemini), ohne Slim-Version.
//
// MISTRAL-SPEZIFITAET:
// - OpenAI-kompatibles API-Format (Drop-in)
// - response_format: { type: 'json_object' } wird unterstuetzt
// - Endpunkt: https://api.mistral.ai/v1/chat/completions

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Spiel-Auth');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // --- ZUGANGSSCHUTZ (serverseitig, schuetzt die Tokens) ---
  // Passwort nur als Vercel-Env SPIEL_PASSWORT, nie im Frontend. Ohne gueltiges Passwort
  // (Header X-Spiel-Auth) kein Modell-Aufruf -> keine Tokens. Nicht gesetzt = offen.
  const erwartetesPw = process.env.SPIEL_PASSWORT;
  if (erwartetesPw) {
    const gesendetesPw = req.headers['x-spiel-auth'] || '';
    if (gesendetesPw !== erwartetesPw) {
      return res.status(403).json({ error: { message: 'Zugang verweigert. Bitte das korrekte Passwort eingeben.' } });
    }
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: { message: 'MISTRAL_API_KEY nicht konfiguriert. Bitte in Vercel Environment Variables eintragen.' }
    });
  }

  const { messages, model: requestedModel } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: 'messages-Array fehlt im Request-Body.' } });
  }

  // Whitelist erlaubter Modelle, damit kein beliebiges Modell ueber unseren Key laeuft.
  // Mistral verwendet "-latest" Suffixe fuer automatisches Update auf neueste Version.
  const ALLOWED_MODELS = {
    'mistral-medium-latest': true,  // Ausbalanciert, gut fuer Story-Generierung
    'mistral-small-latest': true,   // Schnell, Backup
    'mistral-large-latest': true,   // Groesster, fuer komplexere Szenen
  };
  const model = ALLOWED_MODELS[requestedModel]
    ? requestedModel
    : 'mistral-medium-latest';

  try {
    const mistralRes = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.85,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    });

    const text = await mistralRes.text();
    // Validiere dass Mistral mit JSON geantwortet hat - sonst (z.B. nginx-HTML-Fehler
    // bei Routing-Problemen) wird der Fehler ans Frontend transparent durchgereicht,
    // was zu unleserlichen "Antwort nicht lesbar"-Meldungen fuehrt.
    try {
      JSON.parse(text);
    } catch {
      return res.status(502).json({
        error: {
          message: 'Mistral antwortete nicht mit JSON (Status ' + mistralRes.status + '): ' + text.slice(0, 300),
          upstream_status: mistralRes.status,
          model: model,
        }
      });
    }
    res.status(mistralRes.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(text);
  } catch (err) {
    return res.status(502).json({
      error: { message: 'Verbindung zu Mistral fehlgeschlagen: ' + (err.message || String(err)) }
    });
  }
}
