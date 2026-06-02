// Vercel Serverless Function: Proxy fuer Google Gemini API
// Haelt den API-Key serverseitig geheim, damit er nie im Browser landet.
//
// Aufruf vom Frontend: POST /api/gemini mit { messages: [...] }
//   messages folgen dem OpenAI-Format (system/user/assistant)
//   Wir wandeln das ins Gemini-Format um und senden es an Google.
//
// Antwort: Im OpenAI-kompatiblen Format zurueck, damit das Frontend
//   den gleichen Parsing-Code wie vorher (fuer Groq) verwenden kann.

// EIGENSTAENDIGE VERSION dieser Proxy-Datei. Wird bei JEDER Aenderung an
// gemini.js manuell hochgezaehlt (unabhaengig von der index.html/SCHATTEN-
// Version). Wird bei jedem Aufruf in der Response (_geminiJsVersion) zurueck-
// gegeben und vom Frontend ins Debug-Log geschrieben. So sehen wir im Run-
// Export-Log eindeutig, welche gemini.js-Version live war - z.B. um zu klaeren,
// ob ein Schema-Fix beim Run schon deployt war.
// v1.0 (2026-05-30): Erste versionierte Fassung. Enthaelt den responseSchema-
//   Kernfix (kategorie als enum+required pro Option; zielperson_gefunden,
//   wahrheit_erkannt, indiz_verbindung, npc_kernhinweis ergaenzt).
const GEMINI_JS_VERSION = 'v1.4';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Spiel-Auth');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  // --- ZUGANGSSCHUTZ (serverseitig, schuetzt die Tokens) ---
  // Das Passwort liegt NUR als Vercel Environment Variable SPIEL_PASSWORT vor, nie im
  // Frontend-Code. Das Frontend schickt das vom Nutzer eingegebene Passwort im Header
  // X-Spiel-Auth mit. Ohne gueltiges Passwort wird KEIN Modell aufgerufen -> keine Tokens.
  // Wenn SPIEL_PASSWORT in Vercel NICHT gesetzt ist, ist die Sperre deaktiviert (offen) -
  // so sperrt man sich nicht versehentlich aus, bevor die Variable gesetzt wurde.
  const erwartetesPw = process.env.SPIEL_PASSWORT;
  if (erwartetesPw) {
    const gesendetesPw = req.headers['x-spiel-auth'] || '';
    if (gesendetesPw !== erwartetesPw) {
      return res.status(403).json({ error: { message: 'Zugang verweigert. Bitte das korrekte Passwort eingeben.' } });
    }
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: { message: 'GEMINI_API_KEY nicht konfiguriert. Bitte in Vercel Environment Variables eintragen.' }
    });
  }

  const { messages, model: requestedModel } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: { message: 'messages-Array fehlt im Request-Body.' } });
  }

  // Whitelist erlaubter Gemini-Modelle (aktuelle Free-Tier-faehige)
  const ALLOWED_MODELS = {
    'gemini-2.5-flash': true,
    'gemini-2.5-flash-lite': true,
    'gemini-2.5-pro': true,
    'gemini-3-flash-preview': true,    // v1.4: Test-Modell (Debug-Schalter) - korrekter Google-String
    'gemini-3.1-flash-lite': true,
    'gemini-3.1-pro-preview': true,    // v1.4: Test-Modell (Debug-Schalter) - korrekter Google-String
    'gemini-3.5-flash': true,          // v1.4: GA-Modell, optional testbar
  };
  // v1.4: Default-Fallback auf den NEUEN Standard 3.1-flash-lite (nicht mehr 2.5).
  const modelRequested = requestedModel || '(keiner)';
  const modelAccepted = !!ALLOWED_MODELS[requestedModel];
  const model = modelAccepted ? requestedModel : 'gemini-3.1-flash-lite';

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
      maxOutputTokens: 3000,
      responseMimeType: 'application/json',
      // Erzwingt gueltige JSON-Struktur. Damit kann das Modell nicht
      // mittendrin abbrechen oder unvollstaendiges JSON liefern.
      responseSchema: {
        type: 'object',
        properties: {
          szene: { type: 'string' },
          ort: { type: 'string' },
          optionen: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                text: { type: 'string' },
                // v7.12.67 KERNFIX: kategorie war NICHT im Schema -> Gemini filterte
                // sie bei responseMimeType:application/json aktiv weg (42/43 Szenen
                // ohne Kategorie -> Heuristik musste raten). Jetzt als enum + required
                // erzwungen. Eigentlicher Hebel gegen das Kategorie-Problem.
                kategorie: {
                  type: 'string',
                  enum: ['OFFENSIV', 'DEFENSIV', 'ERKUNDEN', 'BEOBACHTEN'],
                },
              },
              required: ['id', 'text', 'kategorie'],
            },
            minItems: 4,
            maxItems: 4,
          },
          spannung: { type: 'integer' },
          zusammenfassung: { type: 'string' },
          // Verfassungs-Delta: wieviel Karl in dieser Szene verloren hat.
          // 0 = nichts passiert. -1 = leichte Blessur, Erschoepfung. -2 = Treffer, Sturz, schwerer Schlag.
          // -3 = schwere Verletzung. -4 = lebensgefahrlich. Auch positiv moeglich: +1 wenn er sich
          // ausruht oder verarztet wird. NICHT in jeder Szene aendern, nur bei klarer Veranlassung.
          verfassung_delta: { type: 'integer' },
          verletzungsbeschreibung: { type: 'string' },
          // Inventar-Aenderungen in dieser Szene. Wenn Karl etwas aufnimmt, schreib es in
          // "hinzugefuegt". Wenn er etwas verliert/verbraucht/weggibt, in "entfernt".
          // Bei keinen Aenderungen beide Arrays leer lassen.
          inventar_hinzugefuegt: { type: 'array', items: { type: 'string' } },
          inventar_entfernt: { type: 'array', items: { type: 'string' } },
          // Cast-Tracking: NPCs die in dieser Szene zu Karl kommen oder gehen.
          // Strukturierte Objekte: name (z.B. "Voller Name"), rolle (z.B. "Klientin"),
          // beziehung (z.B. "Mutter des Vermissten", "Kollege des Opfers" oder "unbekannt").
          // Beziehung ist sehr wichtig damit Rollen nicht verwechselt werden
          // (Schwester != Ehefrau).
          cast_hinzugefuegt: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                rolle: { type: 'string' },
                beziehung: { type: 'string' },
              },
              required: ['name'],
            },
          },
          cast_entfernt: { type: 'array', items: { type: 'string' } },
          // Fall-Fortschritt: Indizien die Karl in dieser Szene neu gefunden hat
          // (Beweisstuecke, Zeugenaussagen, Fotos, Dokumente). Kurze Strings, z.B.
          // "Brief von Hans an Onkel Erwin", "Aussage Frau Vogel: Hans war Dienstag abend in Charlottenburg".
          indiz_neu: { type: 'array', items: { type: 'string' } },
          // Wenn Karl in dieser Szene den/die Tatverdaechtigen identifiziert: Name eintragen.
          // Nur setzen wenn klar etabliert ist (mehrere Indizien, Karl ist sich relativ sicher).
          // Sonst leer lassen oder weglassen.
          tatverdaechtiger_identifiziert: { type: 'string' },
          // Wenn der Tatverdaechtige in dieser Szene ueberfuehrt wird (Festnahme,
          // Gestaendnis, Beweis vor Zeugen): true setzen. Andernfalls false oder weglassen.
          tatverdaechtiger_ueberfuehrt: { type: 'boolean' },
          // Wenn Karl in dieser Szene dem Klient/der Klientin das Ergebnis berichtet hat
          // (NACH Ueberfuehrung): true setzen. Damit wird der Fall als geloest markiert.
          klient_berichtet: { type: 'boolean' },
          // v1.1 (v7.12.105): gewahrsam-Feld fuer den Custody-Umbau Schritt 2. index.html
          // liest scene.gewahrsam als PRIMAERE Custody-Wahrheit (KI weiss am besten ob Karl
          // in der Zelle sitzt). Fehlte im Schema -> Gemini filterte es weg -> KI-SIGNAL kam
          // nie an (0x im Run). Genau der Schema-Filter-Effekt wie v7.12.67. Jetzt ergaenzt.
          gewahrsam: { type: 'boolean' },
          // v7.12.67: Diese 4 Felder liest index.html, aber sie fehlten im Schema
          // -> Gemini filterte sie bei responseMimeType:application/json weg.
          // zielperson_gefunden + wahrheit_erkannt sind die zwei Durchbruch-Pfade
          // (v7.63/64) - ohne Schema-Eintrag waren sie wirkungslos (die KI KONNTE
          // sie gar nicht liefern). zielperson_gefunden: Vermisste:r lokalisiert.
          // wahrheit_erkannt: kein Verbrechen (z.B. echter Selbstmord) - Fall ohne
          // Taeter loesbar. indiz_verbindung: zwei Indizien verknuepft.
          // npc_kernhinweis: konkrete neue NPC-Aussage (wird Karl spaeter vorgehalten).
          zielperson_gefunden: { type: 'boolean' },
          wahrheit_erkannt: { type: 'boolean' },
          indiz_verbindung: { type: 'array', items: { type: 'string' } },
          npc_kernhinweis: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                npc: { type: 'string' },
                hinweis: { type: 'string' },
              },
              required: ['npc', 'hinweis'],
            },
          },
        },
        required: ['szene', 'ort', 'optionen', 'spannung', 'zusammenfassung'],
      },
    },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  // Modell wurde aus dem Request gewaehlt (siehe oben) oder Default gesetzt
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

      // v1.4: Bei 404 (Modell-String bei Google unbekannt) den genutzten String mitgeben,
      // damit im Debug-Log klar ist WELCHER String abgelehnt wurde.
      return res.status(geminiRes.status).json({
        error: {
          message: errMsg + (geminiRes.status === 404 ? " [Modell-String '" + model + "' von Google abgelehnt - evtl. anderer Name noetig]" : ''),
          status: errStatus,
        },
        _modelRequested: modelRequested,
        _modelUsed: model,
        _modelRejected: !modelAccepted,
        _geminiJsVersion: GEMINI_JS_VERSION,
      });
    }

    // Erfolg: Gemini-Response in OpenAI-Format wrappen
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text || '';
    const finishReason = candidate?.finishReason || '';

    // SAFETY oder RECITATION: Gemini hat die Antwort blockiert.
    // Das ist nicht durch Retry behebbar (gleicher Prompt -> gleiche Blockierung),
    // wir signalisieren dem Frontend einen anderen Fehler, damit es den Kontext
    // staerker kompaktiert (das nimmt manchmal die problematische Phrase raus).
    if (finishReason === 'SAFETY' || finishReason === 'RECITATION' || finishReason === 'BLOCKLIST') {
      return res.status(502).json({
        error: {
          message: `Gemini hat die Antwort blockiert (${finishReason}). Retry mit kompaktem Kontext.`,
          type: 'blocked',
        }
      });
    }

    // MAX_TOKENS: Antwort wurde mittendrin abgeschnitten. Frueher haben wir hier
    // 502 zurueck gegeben, was einen Retry ausloeste. Aber: das Frontend kann
    // unvollstaendiges JSON mittlerweile reparieren (Klammern auffuellen). Wenn
    // wir den Text haben und er sieht nach JSON aus, lieber durchreichen statt
    // einen extra Roundtrip ausloesen.
    if (finishReason === 'MAX_TOKENS') {
      if (text && text.trim().startsWith('{')) {
        return res.status(200).json({
          choices: [{
            message: { role: 'assistant', content: text },
            finish_reason: 'length',
          }],
          model,
          _truncated: true,
          _modelRequested: modelRequested,
          _modelUsed: model,
          _modelRejected: !modelAccepted,
          _geminiJsVersion: GEMINI_JS_VERSION,
        });
      }
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
    // v7.11.25: usageMetadata mit Cache-Info durchreichen (fuer Implicit-Caching-Diagnostik)
    return res.status(200).json({
      choices: [{
        message: { role: 'assistant', content: text },
        finish_reason: 'stop',
      }],
      model,
      usageMetadata: data?.usageMetadata || null,
      _modelRequested: modelRequested,
      _modelUsed: model,
      _modelRejected: !modelAccepted,
      _geminiJsVersion: GEMINI_JS_VERSION,
    });
  } catch (err) {
    return res.status(502).json({
      error: { message: 'Verbindung zu Gemini fehlgeschlagen: ' + (err.message || String(err)) }
    });
  }
}
