// Vercel Serverless Function: Proxy für Groq API
// Hält den API-Key serverseitig geheim, damit er nie im Browser landet.
//
// Aufruf vom Frontend: POST /api/groq mit { messages: [...] }
// Antwort: Das Groq-Response-JSON, durchgereicht.

export default async function handler(req, res) {
  // CORS für lokale Tests (production läuft eh same-origin)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: { message: 'GROQ_API_KEY nicht konfiguriert. Bitte in Vercel Environment Variables eintragen.' }
    });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: 'messages-Array fehlt im Request-Body.' } });
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages,
        temperature: 0.9,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    });

    const text = await groqRes.text();
    // Pass through Groq's response (including error responses with rate-limit info)
    res.status(groqRes.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(text);
  } catch (err) {
    return res.status(502).json({
      error: { message: 'Verbindung zu Groq fehlgeschlagen: ' + (err.message || String(err)) }
    });
  }
}
