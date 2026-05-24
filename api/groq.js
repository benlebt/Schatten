// Vercel Serverless Function: Proxy fuer Groq API
// Haelt den API-Key serverseitig geheim, damit er nie im Browser landet.
//
// Aufruf vom Frontend: POST /api/groq mit { messages: [...] }
// Antwort: Im OpenAI-Format durchgereicht (kompatibel zu /api/gemini).
//
// WICHTIG: Wegen Groqs strikten TPM-Limits (8K Tokens/Minute) ersetzen wir
// den ueppigen Frontend-System-Prompt durch eine drastisch geschrumpfte Version.
// Damit braucht jede Anfrage nur noch ~1500 Tokens statt 3000+.

const SLIM_SYSTEM_PROMPT = `Spielleiter, Noir-Krimi-Adventure, Berlin 1953.

SPIELER: Privatdetektiv Karl Mauer. Im Erzaehltext NIE beim Namen nennen, immer "du". Name "Karl/Mauer" nur in woertlicher Rede anderer Figuren erlaubt.

SPRACHE:
- Zweite Person Singular, Praesens, durchgehend
- Optionen im Du-Imperativ ("Frag ihn.", "Zieh die Pistole."), NIE Sie-Form
- Korrekte Umlaute (ae/oe/ue/ss SIND VERBOTEN, immer aeoeueß ausschreiben)
- KEINE em-dashes (—/–)
- Korrekte du-Verben: gehst, siehst, nimmst, trittst, oeffnest, fragst, schiesst
- Dativ: "Befiehl dem Mann", nicht "den Mann"

SZENEN:
- 3-5 Saetze, atmosphaerisch, knapp, konkrete sensorische Details
- Wechsle Szenentypen: Verhoere, Action, Observation, Recherche, Lagedenken
- Jede Szene bringt neue Info / Person / Eskalation. Keine Frage-Ausweich-Schleifen.
- Klischees meiden: kein "Mundwinkel zucken", "Augen bohren sich in", "Schraubzwinge", "kalt wie Messer", staendiger Regen oder Neonlicht
- Etablierte Namen/Fakten konsistent halten

ERWEITERTE EROEFFNUNG: Wenn Intro-Prompt Namen/Auftrag/Hintergrund nennt, MUSST du sie in der ersten Szene erzaehlerisch verankern.

OPTIONEN: Genau 4, Du-Imperativ, 4-12 Woerter, klar verschieden, konkret zur Szene.

OUTPUT: Nur valides JSON, kein Markdown, kein Text drumherum.
{
  "szene": "...",
  "ort": "Kurzname",
  "optionen": [{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}],
  "spannung": 3,
  "zusammenfassung": "1 Satz: Ort, was getan, wichtige Personen/Fakten."
}
spannung: 1 (ruhig) bis 5 (Lebensgefahr).`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
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

  // System-Prompt ersetzen: erstes message ist System-Prompt vom Frontend (lang),
  // wir tauschen ihn gegen unsere schlanke Version aus. So sparen wir ca. 1500 Tokens
  // pro Anfrage gegenueber Gemini, was bei Groqs TPM-Limit entscheidend ist.
  const slimMessages = [
    { role: 'system', content: SLIM_SYSTEM_PROMPT },
    ...messages.filter(m => m.role !== 'system'),
  ];

  // Conversation-History weiter ausduennen: nur die letzten 3 Eintraege (vor dem aktuellen User-Message)
  // behalten. Das genuegt fuer Kontext und spart weitere Tokens.
  const userIndex = slimMessages.length - 1;
  if (userIndex > 4) {
    // [system, ...history..., last_user] -> [system, last 3 of history, last_user]
    const lastUser = slimMessages[userIndex];
    const historyTail = slimMessages.slice(1, userIndex).slice(-3);
    slimMessages.length = 0;
    slimMessages.push({ role: 'system', content: SLIM_SYSTEM_PROMPT });
    slimMessages.push(...historyTail);
    slimMessages.push(lastUser);
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        // Llama 4 Scout: 30K TPM (3.75x mehr als gpt-oss-120b's 8K)
        // Offiziell mit Deutsch trainiert, multilingual benchmarks-stark
        // 1K RPD wie alle Groq-Free-Modelle, aber das ist nicht der Flaschenhals
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: slimMessages,
        temperature: 0.85,
        // 1000 Tokens fuer Szene + Optionen + Summary. Mit 30K TPM heisst das
        // bis zu 30 Anfragen pro Minute moeglich (RPM-Limit bei 30 ist eh die Grenze).
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      }),
    });

    const text = await groqRes.text();
    res.status(groqRes.status);
    res.setHeader('Content-Type', 'application/json');
    return res.send(text);
  } catch (err) {
    return res.status(502).json({
      error: { message: 'Verbindung zu Groq fehlgeschlagen: ' + (err.message || String(err)) }
    });
  }
}
