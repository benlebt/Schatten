# Schatten

KI-gestütztes Film-Noir-Detektivspiel im Berlin des Jahres 1953.

## Einstieg für Entwicklung und neue Codex-Chats

1. Repository klonen und im Repository-Stamm arbeiten.
2. `UEBERGABE_v1313.md` vollständig lesen; sie dokumentiert Architektur, Arbeitsregeln, aktuelle Regressionen und die offenen manuellen Demo-Tests.
3. Den tatsächlich ausgecheckten Stand prüfen, da Code und Version nach der Übergabe weiterlaufen können:

```powershell
git status --short
git branch -vv
git log -5 --oneline
rg -n "window\.SCHATTEN_VERSION" index.html
```

4. Alle eigenständigen Node-Tests ausführen:

```powershell
$tests = Get-ChildItem -LiteralPath tests -Filter *.test.js | Sort-Object Name
foreach ($test in $tests) {
  & node $test.FullName
  if ($LASTEXITCODE -ne 0) { throw "Test fehlgeschlagen: $($test.Name)" }
}
```

Es gibt kein `package.json`. Die Anwendung liegt hauptsächlich in `index.html`; Serverfunktionen stehen unter `api/`, Szenenbilder unter `assets/scenes/` und Musikdateien im Repository-Stamm.

## Konfiguration und Geheimnisse

Echte Schlüssel und Passwörter gehören niemals ins Repository. Die benötigten Variablennamen stehen ohne Werte in `.env.example`. Weitere Regeln enthält `SECURITY.md`.

Ein lokaler Klon enthält damit alle Projektdateien und Tests, aber bewusst keine produktiven Zugänge.
