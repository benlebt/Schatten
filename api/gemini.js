// Vercel Serverless Function: Proxy fuer Google Gemini API
// Haelt den API-Key serverseitig geheim, damit er nie im Browser landet.
//
// Aufruf vom Frontend: POST /api/gemini mit { messages: [...] }
//   messages folgen dem OpenAI-Format (system/user/assistant)
//   Wir wandeln das ins Gemini-Format um und senden es an Google.
//
// Antwort: Im OpenAI-kompatiblen Format zurueck, damit das Frontend
//   den gleichen Parsing-Code wie vorher (fuer Groq) verwenden kann.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: { message: 'GEMINI_API_KEY nicht konfiguriert. Bitte in Vercel Environment Variables eintragen.' }
    });
  }

  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: 'messages-Array fehlt im Request-Body.' } });
  }

  // OpenAI -> Gemini Format konvertieren
  // Gemini erwartet: { systemInstruction: { parts: [{text}] }, contents: [{role, parts:[{text}]}] }
  // Rollen: "user" und "model" (nicht "assistant")
  let systemInstruction = null;
  const contents = [];
  for (const m of messages) {
    if (m.role === 'system') {
      // Mehrere system-Messages aneinanderhaengen
      const txt = (systemInstruction ? systemInstruction + '\n\n' : '') + m.content;
      systemInstruction = txt;
    } else if (m.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: m.content }] });
    } else if (m.role === 'assistant') {
      contents.push({ role: 'model', parts: [{ text: m.content }] });
    }
  }

  const body = {
    contents,
    generationConfig: {
      temperature: 0.9,
      // Gemini zaehlt Tokens anders als OpenAI/Groq. Deutsche Texte mit
      // Umlauten brauchen mehr Tokens pro Zeichen. 2500 reicht fuer eine
      // ausfuehrliche Szene + 4 Optionen + Zusammenfassung in JSON.
      maxOutputTokens: 2500,
      responseMimeType: 'application/json',
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  // Modell: gemini-2.5-flash (kostenlos, sehr gutes Deutsch, schnell)
  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const geminiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const rawText = await geminiRes.text();
    let data;
    try { data = JSON.parse(rawText); } catch {
      return res.status(502).json({ error: { message: 'Gemini antwortete nicht mit JSON: ' + rawText.slice(0, 300) } });
    }

    if (!geminiRes.ok) {
      // Gemini error format: { error: { code, message, status, details? } }
      const errMsg = data?.error?.message || rawText;
      const errStatus = data?.error?.status || '';

      // Rate-Limit-Erkennung (Gemini meldet das als 429 mit "RESOURCE_EXHAUSTED")
      if (geminiRes.status === 429 || errStatus === 'RESOURCE_EXHAUSTED') {
        // Versuche retryDelay aus details zu extrahieren (z.B. "37s")
        let retryAfterSec = 60;
        const details = data?.error?.details || [];
        for (const d of details) {
          if (d['@type']?.includes('RetryInfo') && d.retryDelay) {
            const m = d.retryDelay.match(/(\d+)s/);
            if (m) retryAfterSec = parseInt(m[1]);
          }
        }
        // Detect daily limit by checking message
        const isDaily = /per day|daily|quota.*day/i.test(errMsg);
        // Antwort im OpenAI-Fehlerformat, damit Frontend es korrekt verarbeitet
        return res.status(429).json({
          error: {
            message: `Rate limit reached: ${errMsg} Please try again in ${retryAfterSec}s.${isDaily ? ' (tokens per day)' : ''}`,
            type: 'rate_limit',
          }
        });
      }

      return res.status(geminiRes.status).json({
        error: { message: errMsg, status: errStatus }
      });
    }

    // Erfolg: Gemini-Response in OpenAI-Format wrappen
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '';
    const finishReason = candidate?.finishReason || '';

    // Wenn Gemini wegen Token-Limit abgeschnitten hat, ist die JSON-Antwort
    // unvollstaendig (kein schliessendes "}"). Dem Frontend signalisieren,
    // dass es einen Retry probieren soll (mit kompaktem Kontext, der weniger
    // Output braucht).
    if (finishReason === 'MAX_TOKENS') {
      return res.status(502).json({
        error: {
          message: 'Antwort wurde wegen Token-Limit abgeschnitten. Retry empfohlen.',
          type: 'truncated',
        }
      });
    }

    if (!text) {
      return res.status(502).json({ error: { message: 'Gemini lieferte keine Textantwort.', raw: JSON.stringify(data).slice(0, 500) } });
    }

    // OpenAI-kompatible Response
    return res.status(200).json({
      choices: [{
        message: { role: 'assistant', content: text },
        finish_reason: 'stop',
      }],
      model,
    });
  } catch (err) {
    return res.status(502).json({
      error: { message: 'Verbindung zu Gemini fehlgeschlagen: ' + (err.message || String(err)) }
    });
  }
}
