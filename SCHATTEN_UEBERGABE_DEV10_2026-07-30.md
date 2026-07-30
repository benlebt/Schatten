# Schatten — Übergabe nach Entwicklungsrunde Dev10

Stand: 30. Juli 2026

Diese Datei ist der aktuelle Einstieg für den nächsten Entwicklungs-Chat.
Dev9 bleibt als historischer Zwischenstand erhalten.

## 1. Sofortiger Einstieg

Vor Änderungen vollständig lesen:

1. `SCHATTEN_UEBERGABE_DEV10_2026-07-30.md`
2. `LEKTORAT.md`
3. die aktuellen Abschnitte am Ende von `SCHATTEN_PROJEKT.md`
4. danach Code, Tests, Git- und Produktionsstand abgleichen

Verbindlicher Arbeitszyklus:

```text
gezielte Produktionsmatrix
→ konkreter sichtbarer Lektoratsbefund
→ Root Cause
→ enger Fix
→ Regressionstest
→ vollständige Suite
→ Commit und Push
→ FTPS-Deployment bei jeder Codeänderung
→ sichtbarer Produktionsgegenlauf
```

Bestehende Benutzeränderungen niemals verwerfen. Die ungetrackte Datei
`SCHATTEN_UEBERGABE_DEV7_2026-07-29.md` blieb auch in Dev10 bewusst
unangetastet und uncommitted.

## 2. Technischer Stand

```text
Branch: main
Remote: origin/main
Repository-HEAD vor diesem Dokumentationscommit: b2d9413
Produktiver Release: v7.12.1774 +HandoffVisualTruth
Produktiver Code-Commit: b2d9413 fix: distinguish rescue arrival from handoff
Vorheriger Code-Commit: 5379008 fix: keep physical rescue targets actionable
Produktion: https://schatten.sfp.de/
Debug: https://schatten.sfp.de/?debug=on&v=1774&deploy=b2d9413
Tests: 70/70 grün
Produktiver index.html-SHA-256:
2340B7910CA584A32803A83B7CE2C1CFFC22A4A8279BD412AF3E49A0D5137308
```

Jeder Dev10-Codeupload wurde per FTPS zurückgeladen und bytegenau mit dem
lokalen Commitstand verglichen. Zugangsdaten stehen weder in Projektdateien
noch in Git.

## 3. Sichtbar abgeschlossene Produktionsläufe

### Kessler

Der in Dev9 begonnene Produktionsgegenlauf wurde sichtbar abgeschlossen.
Finalbericht und Abschlusskarte waren konsistent; Kernaktionen,
Geld-/Rufwirkung, Öffnungszeiten, Tageswechsel und Finale funktionierten.

### Schiffer — bisherige Gegenmatrix

Zwei vollständige Übergabewege und zwei deutlich verschiedene Konfliktprofile
sind jetzt sichtbar belegt:

| Achse | Lauf A | Lauf B |
|---|---|---|
| Konflikt | aggressiv | friedlich: Rex einschüchtern, danach beruhigen |
| Rex | ohne Rex | mit Rex |
| Ruf | bestehendes härteres Profil | auf neutral gesetzt, danach höflich +1 Renommee |
| Indizreihenfolge | Nachbarin vor Wohnungsrekonstruktion | Wohnungsrekonstruktion vor Nachbarin |
| Save/Reload | Restore des abgeschlossenen Laufs | Reload nach Szene 5 und später Restore am Keller |
| Übergabe | persönlich an Renate | an die Volkspolizei |
| Indizien | 4 | 5 |
| Ergebnis | Detlef lebend bei Renate | Detlef lebend in Polizeischutz, Renate informiert |

Der frische Lauf B führte über:

```text
Detlefs Wohnung
→ Save/Reload
→ geschlossener Goldener Anker mit sauberer Büroumleitung
→ höfliche Sonja-Befragung
→ Riemers Schuldbuch
→ Kellerzugang
→ Trude und Rote Laterne zur Zeitsteuerung
→ Rex gegen Doppelkorn, Handschellen und Bohnenkaffee
→ Keller
→ Rex einschüchtern
→ Kalle friedlich beruhigen
→ Detlef befreien
→ Detlef zum Opel
→ Volkspolizei Keibelstraße
→ bewusste Übergabe
→ Polizeibericht und Abschlusskarte
```

Sichtbar korrekt:

- Save/Reload erhielt Szene, Ort, Indizien und Zustände;
- geschlossene Orte leiteten plausibel um;
- umgedrehte Indizreihenfolge blieb lösbar;
- das Schuldbuch zeigte den kanonischen Text und teleportierte Karl nicht;
- Rex kam nach echtem Warenwerttausch mit;
- Kalle ging friedlich und ohne erfundene Verletzung oder Fahrzeug ab;
- Detlef wurde nach dem Fix neben Rex wieder anklickbar;
- Befreiung, Opeltransport und Polizeiübergabe waren getrennte Handlungen;
- der Bericht nannte Riemer, 1500 D-Mark, Beweiskette, friedlichen Ausgang,
  Detlefs Befreiung und den tatsächlichen Polizeischutz;
- Endkarte und Fallbackzeile nannten denselben Ausgang;
- der finale Reload auf v1774 stellte den abgeschlossenen Lauf korrekt wieder her.

## 4. Dev10-Releases ab v1772

### v7.12.1772 +SchifferMatrixTruth — `d797a77`

- deterministischer Schuldbuchtext;
- fallrichtiger Flagless-Finalbericht;
- engineweiter Schutz gegen erfundene Abfahrten im Rückspiegel;
- konkrete Renate-Übergabe in Abschlusskarte und Zusammenfassung.

### v7.12.1773 +SchifferRexRescue — `5379008`

- ein unbefreites physisches Rettungsziel wird am konfigurierten Rettungsort
  als letzte Engine-Wahrheit wieder in die Personenliste eingesetzt;
- mehrdeutige Abgangspronomen können Detlef nicht mehr zusammen mit Kalle
  entfernen;
- ein bereits verabschiedeter Klient kann durch einen späteren
  Phantomakteur-Repair nicht wieder in Roster und Prosa geraten;
- der zuvor blockierte Produktionsspielstand wurde ohne Neustart fortgesetzt.

### v7.12.1774 +HandoffVisualTruth — `b2d9413`

- Ankunft am sicheren Ziel und vollzogene Übergabe besitzen getrennte
  Bildbeschreibungszustände;
- bei `im_opel` sagt das Bild ausdrücklich, dass die Übergabe noch aussteht;
- erst `bei_klient` beziehungsweise `bei_polizei` darf die vollzogene Übergabe
  behaupten.

## 5. Tests

```text
Gezielte Schiffer-Regressionen: grün
Physisches Rettungsendspiel: grün
Klientenabgang/Phantomakteur: grün
Vollständige Suite: 70/70 grün
git diff --check: grün
```

Die Regressionen prüfen jetzt zusätzlich:

- unbefreites Ziel bleibt neben Rex am Rettungsort vorhanden;
- Zielinjektion erzeugt keine Doppelperson;
- spätere Phantomreparatur reaktiviert keinen verabschiedeten Klienten;
- Polizeiankunft sagt „Übergabe steht noch aus“;
- erst der vollzogene Status verwendet die Übergabebeschreibung.

## 6. Nächste gezielte Matrizen

Keine 14 identischen Standardläufe. Der höchste Erkenntnisgewinn liegt jetzt
in orthogonalen Gegenproben:

1. **Krause:** friedliche Mehrgegnerlösung gegen aggressiven Sicherungsweg,
   jeweils mit anderer Indizreihenfolge; Fokus auf Besitz, Gewahrsam und
   Mehrgegner-Roster.
2. **Brauer:** hoher gegen niedrigen Ruf sowie Beweis vor Personenbefragung
   gegen umgekehrte Reihenfolge; Fokus auf Grenz-/Datumswahrheit und
   alternatives Ende.
3. **Wegener:** mit Rex gegen ohne Rex, Polizei- gegen Klientenübergabe und
   Save/Reload zwischen Befreiung, Opel und Handoff.
4. Danach politische Fälle nur gezielt auf Gewahrsam, alternatives Ende oder
   Rufwirkung rotieren, nicht erneut als identische Standardläufe.

Bei jeder Codeänderung gilt weiter: Version erhöhen, 70/70 Tests, Commit,
Push, FTPS-Redeployment, SHA-256-Verifikation und sichtbarer Produktionscheck.
