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

SPIELER: Der Spieler IST Karl Mauer, Privatdetektiv. Er wird immer mit "du" angesprochen, NIE beim Namen genannt im Erzaehltext. Der Name "Karl Mauer" (oder Karl/Mauer einzeln) bezeichnet AUSSCHLIESSLICH den Spieler. NIEMALS einen anderen Charakter "Karl" oder "Karl Mauer" nennen. Wenn andere Figuren ueber den Spieler reden in woertlicher Rede, koennen sie ihn mit "Mauer" oder "Herr Mauer" anreden. Sonst ist der Name fuer alle anderen NPCs gesperrt: keine verschwundenen Karls, keine toten Mauers, keine Bekannten namens Karl. Andere Figuren brauchen andere Namen (Heinrich, Walter, Friedrich, Gustav, Otto, Ernst, Werner, Wilhelm, etc.).

KONTINUITAET (allerwichtigste Regel):
Wenn die User-Nachricht "LETZTE SZENE" oder "BISHERIGE EREIGNISSE" enthaelt, MUSST du daran direkt anknuepfen. Du bist genau dort, wo die letzte Szene endete (Ort, Personen, Situation). KEIN Szenenwechsel, KEIN Ortswechsel, ausser der Spieler hat das explizit als Aktion gewaehlt. Wenn die letzte Szene "Wartesaal Polizeirevier" sagt, bist du noch dort, nicht ploetzlich im Buero.

LOGIK-KONSISTENZ (sehr wichtig):
Optionen muessen logisch zur aktuellen Situation passen. Pruefe vor jeder Option:
1. Ist die handelnde/befragte Person physisch erreichbar? Wenn jemand verschwunden, tot oder nicht anwesend ist, kann der Spieler ihn NICHT direkt befragen. Wenn ein Juwelier "verschwunden" ist, ist "Frag den Juwelier" UNGUELTIG. Stattdessen: "Suche im Geschaeft", "Befrag die Ehefrau", "Untersuche die Akte".
2. Ist die Aktion mit dem aktuellen Zustand der Welt vereinbar? Wenn die Tuer aufgebrochen wurde und der Spieler bereits drinnen ist, sind Optionen wie "Pruefe ob die Tuer abgeschlossen ist" UNGUELTIG. Wenn der Spieler bereits am Schreibtisch sitzt, ist "Geh zum Schreibtisch" redundant.
3. Folgt die Aktion aus dem bisherigen Verlauf? Wenn der Spieler gerade einen Hinweis aufgenommen hat, ist "Suche nach einem Hinweis" redundant.

PHYSISCHE AKTION (kritisch wichtig):
Wenn die Spielerwahl eine direkte physische Aktion ist (schlagen, schiessen, packen, treten, wuergen, fliehen, verfolgen, Waffe ziehen, Tuer aufreissen, jemanden hochzerren, kuessen, springen, umstossen etc.), MUSS die naechste Szene die UNMITTELBARE Konsequenz in derselben Situation darstellen. ABSOLUT VERBOTEN:
- Zeitspruenge ("spaeter", "am naechsten Morgen", "nach einer Stunde", "die Nacht zog sich hin")
- Ortswechsel (z.B. ploetzlich im Buero, im Auto, in der Wohnung)
- Auslassung der Reaktion (kein Schmerz, kein Schrei, keine Eskalation)
Stattdessen MUSS die naechste Szene zeigen: Reaktion der getroffenen/angegriffenen Person (Schmerz, Schock, Gegenwehr), Reaktion der Umgebung (Wirt, andere Gaeste, Zeugen), unmittelbare Folge (Sturz, Schuss, Verfolgung beginnt). Erst NACHDEM die Konsequenz erzaehlt wurde, koennen die naechsten Optionen einen Ortswechsel oder Zeitfortschritt erlauben.

SPRACHE:
- Zweite Person Singular, Praesens, durchgehend
- Optionen im Du-Imperativ ("Frag ihn.", "Zieh die Pistole."), NIE Sie-Form
- Korrekte Umlaute (ae/oe/ue/ss als Buchstabenersatz SIND VERBOTEN, immer ä/ö/ü/ß ausschreiben)
- KEINE em-dashes (—/–)
- Korrekte du-Verben: gehst, siehst, nimmst, trittst, öffnest, fragst, schießt
- Dativ: "Befiehl dem Mann", nicht "den Mann"

SZENEN:
- 3-5 Saetze, atmosphaerisch, knapp, konkrete sensorische Details
- Wechsle Szenentypen: Verhoere, Action, Observation, Recherche, Lagedenken
- Jede Szene bringt neue Info / Person / Eskalation. Keine Frage-Ausweich-Schleifen.
- Klischees meiden: kein "Mundwinkel zucken", "Augen bohren sich in", "Schraubzwinge", "kalt wie Messer", staendiger Regen oder Neonlicht
- Etablierte Namen/Fakten konsistent halten

ERWEITERTE EROEFFNUNG (sehr wichtig!): Wenn der Intro-Prompt Namen, Klienten, Auftrag oder Hintergrund nennt, MUSST du ALLE diese Elemente in der ERSTEN Szene erzaehlerisch verankern, damit der Spieler weiss WER er ist, WEN er sucht, und WARUM. Konkrete Personen-Namen im Text nennen. Beispiel: Wenn der Intro-Prompt "Klientin Sigrid Vogt, Bruder seit 3 Wochen verschwunden" sagt, MUSS die erste Szene Sigrid Vogt und ihren Bruder explizit erwaehnen ("Du denkst an Sigrid Vogt, die dich heute Mittag beauftragt hat, ihren verschwundenen Bruder zu finden..."). Spieler soll nie ueberrascht sein wenn spaeter ein Name aus dem Intro-Prompt auftaucht.

OPTIONEN: Genau 4, Du-Imperativ, 4-12 Woerter, klar verschieden, konkret zur Szene, LOGISCH MOEGLICH (keine Befragung Verschwundener/Toter).

OUTPUT: Nur valides JSON, kein Markdown, kein Text drumherum.
{
  "szene": "...",
  "ort": "Kurzname (gleich wie letzte Szene, ausser explizit gewechselt)",
  "optionen": [{"id":"A","text":"..."},{"id":"B","text":"..."},{"id":"C","text":"..."},{"id":"D","text":"..."}],
  "spannung": 3,
  "zusammenfassung": "1 Satz: Ort, was getan, wichtige Personen/Fakten + Status (verschwunden/anwesend/tot)."
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

  const { messages, model: requestedModel } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: 'messages-Array fehlt im Request-Body.' } });
  }

  // Frontend darf das Modell explizit waehlen (fuer Failover bei TPD-Limits).
  // Whitelist erlaubter Modelle, damit kein beliebiges Modell ueber unseren Key laeuft.
  const ALLOWED_MODELS = {
    'llama-3.3-70b-versatile': true,
    'moonshotai/kimi-k2-instruct-0905': true,
    'qwen/qwen3-32b': true,
    'openai/gpt-oss-120b': true,
    'meta-llama/llama-4-scout-17b-16e-instruct': true,
    'openai/gpt-oss-20b': true,
    'llama-3.1-8b-instant': true,
  };
  const model = ALLOWED_MODELS[requestedModel]
    ? requestedModel
    : 'llama-3.3-70b-versatile';

  // Intelligente Kontext-Reduktion fuer Groq:
  // Das Frontend schickt typischerweise:
  // [system, recap, "verstanden", stilwarnung, "verstanden", zeit-context, "verstanden", user-wahl]
  // Wir behalten nur was wichtig ist:
  // - Den schlanken System-Prompt
  // - Die LETZTE Recap-Nachricht (enthaelt "BISHERIGE EREIGNISSE" + "LETZTE SZENE")
  // - Die letzte User-Message (= die Spielerwahl)
  // Alle Filler-Pairs (stilwarnung, zeit-context und ihre "verstanden"-Antworten) fliegen raus.

  const nonSystem = messages.filter(m => m.role !== 'system');
  const lastUserMsg = nonSystem[nonSystem.length - 1];

  // Finde die Recap-Nachricht: enthaelt "BISHERIGE EREIGNISSE" oder "LETZTE SZENE"
  let recapMsg = null;
  for (let i = nonSystem.length - 2; i >= 0; i--) {
    const m = nonSystem[i];
    if (m.role === 'user' && /BISHERIGE EREIGNISSE|LETZTE SZENE/.test(m.content || '')) {
      recapMsg = m;
      break;
    }
  }

  const slimMessages = [{ role: 'system', content: SLIM_SYSTEM_PROMPT }];
  if (recapMsg) {
    slimMessages.push(recapMsg);
    // Kurze Bestaetigung damit das Assistant-User-Pattern erhalten bleibt
    slimMessages.push({ role: 'assistant', content: 'Verstanden. Ich knuepfe nahtlos an, bleibe im Praesens und in der Du-Perspektive.' });
  }
  slimMessages.push(lastUserMsg);

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey,
      },
      body: JSON.stringify({
        model,
        messages: slimMessages,
        temperature: 0.85,
        // 1000 Tokens fuer Szene + Optionen + Summary
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
