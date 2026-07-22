# Sicherheit und Repository-Hygiene

Dieses öffentliche Repository enthält ausschließlich Spielcode, Tests, Projekttexte und Medien. Zugangsdaten gehören ausschließlich in die Umgebungsvariablen des Hostings.

## Niemals committen

- `.env` oder `.env.*` mit echten Werten
- API-Schlüssel oder Zugriffstokens
- Spiel-, Deploy- oder Kontopasswörter
- private Schlüssel und Zertifikate
- lokale Hosting-Ordner wie `.vercel/`
- lokale Recovery-, Run-, Log- oder Agentendaten
- absolute persönliche Rechnerpfade

`.env.example` dokumentiert nur die benötigten Variablennamen. Es enthält keine Werte.

## Sicherheitsgrenzen

- `GEMINI_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY` und `SPIEL_PASSWORT` werden nur serverseitig aus Umgebungsvariablen gelesen.
- Der schreibende `/api/deploy`-Endpunkt ist standardmäßig durch `DEPLOY_ENABLED=false` deaktiviert. Token, Repository und Passwort-Hash kommen nur aus Umgebungsvariablen.
- Der Browser-Debugschalter ist ausdrücklich keine Authentifizierung und gewährt keine serverseitigen Rechte. Er schaltet nur lokale Testoberflächen frei.
- Ein öffentlicher Repository-Klon darf ohne geheime Werte vollständig testbar sein; Modellaufrufe funktionieren erst nach eigener Hosting-Konfiguration.

## Prüfung vor einem Push

```powershell
git status --short --ignored
node tests/repository-hygiene.test.js
git diff --check
```

Wenn versehentlich ein echter Schlüssel committed wurde, reicht Löschen im nächsten Commit nicht: Schlüssel sofort widerrufen/rotieren und anschließend die Git-Historie separat bereinigen.
