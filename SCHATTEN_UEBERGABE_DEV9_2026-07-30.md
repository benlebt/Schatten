# Schatten — Übergabe nach Entwicklungsrunde Dev9

Stand: 30. Juli 2026

Diese Datei ist der aktuelle Einstieg für den nächsten Entwicklungs-Chat. Die
Dev8-Übergabe bleibt als historischer Zwischenstand erhalten, wird aber durch
diese Datei ersetzt.

## 1. Sofortiger Einstieg

Vor Änderungen vollständig lesen:

1. `SCHATTEN_UEBERGABE_DEV9_2026-07-30.md`
2. `LEKTORAT.md`
3. die aktuellen Abschnitte am Ende von `SCHATTEN_PROJEKT.md`
4. danach Code, Tests, Git- und Produktionsstand abgleichen

Verbindlicher Arbeitszyklus:

```text
Produktionslauf
→ konkreter Lektoratsbefund
→ Root Cause
→ eng fallgebundener oder engineweiter Fix
→ Regressionstest
→ vollständige Suite
→ Commit und Push
→ FTPS-Deployment
→ sichtbarer Produktionsgegenlauf
```

Bestehende Benutzeränderungen niemals verwerfen. Die ungetrackte Datei
`SCHATTEN_UEBERGABE_DEV7_2026-07-29.md` gehört nicht zu Dev9 und wurde bewusst
nicht verändert oder committed.

## 2. Technischer Stand

```text
Branch: main
Remote: origin/main
Repository-HEAD nach Dev9: 3177a30 docs: record v1762 case rotation audit
Produktiver Code-Release: v7.12.1762 +SchifferPurpose
Produktiver Code-Commit: b07f82f fix: make Schiffer investigation actions purposeful
Produktion: https://schatten.sfp.de/
Debug: https://schatten.sfp.de/?debug=on&v=1762&deploy=b07f82f
Tests: 70/70 grün
```

Der Unterschied zwischen Repository-HEAD und produktivem Code-Commit ist
beabsichtigt: `3177a30` enthält nur die Wissens- und Rankingdokumentation nach
dem bereits deployten `b07f82f`. Für reine Dokumentationscommits ist kein
erneutes Deployment nötig.

Zugangsdaten werden nicht in Projektdateien, Git, Übergaben oder sichtbaren
Berichten gespeichert. Der aktuelle Produktionsweg ist FTPS; Vercel ist nicht
der maßgebliche Deploymentweg.

## 3. Dev9-Releases

```text
121ebae fix: give custody choices distinct consequences
00a5880 fix: keep visible bound NPC actions executable
4305d00 fix: preserve weapon and rescue time continuity
b0b871b fix: make closed destinations useful on arrival
8d9777e fix: sharpen Brandt actions and continuity
3e18aec fix: complete Hollenbeck purpose audit
4689fe0 fix: complete Achterberg purpose audit
e5e63d1 fix: make Vogt investigation actions purposeful
40ccc48 fix: make Wessel paths purposeful
60bc842 fix: align Wessel fee with economy
2d48ee8 fix: replace Kessler filler actions
b07f82f fix: make Schiffer investigation actions purposeful
3177a30 docs: record v1762 case rotation audit
```

## 4. Verbindliche Zweckaktionsregel

Jeder sichtbare fallgebundene Ermittlungsbutton muss potenziell mindestens
eines bewirken:

- ein Indiz oder eine belastbare Deduktion,
- einen erreichbaren Folgeschritt oder neuen Ort,
- Ressourcengewinn oder realen Ressourcenverbrauch,
- Ruf-, Härte-, Druck- oder Kooperationswirkung,
- Schutz, Zeitgewinn oder eine bewusst eingegangene Risikochance,
- eine notwendige physische Zustandsänderung wie Abpassen, Befreien oder
  Übergeben.

Ein bloßer Szenenwechsel mit austauschbarer Prosa ist kein ausreichender
Zweck. Generische Kernlabels wie `Durchsuche`, `Schau an` oder `Untersuche`
werden durch ein konkretes Verb-Objekt-Label und einen passenden Aktionsprompt
ersetzt. Verbrauchte Einmalwege werden deaktiviert.

### Gewahrsam

Alle sechs Optionen wurden mechanisch geprüft und sind keine Alibi-Pfade:

| Aktion | Reale Wirkung |
|---|---|
| Schweige | wiederholte Nutzung baut ein Vernehmerprofil auf; Druckkosten |
| Gib Halbwahrheiten | Druck sinkt, Kooperation steigt begrenzt |
| Berufe dich auf Roth | benannter Zeuge wird protokolliert; sicherer Wartepfad verkürzt |
| Verlange ein Protokoll | erzeugt die Haftnotiz als Indiz; Druck steigt |
| Biete 10 Ostmark | Geld wird tatsächlich abgezogen; Druck sinkt |
| Lausche am Gang | kann einen ungelösten Fallhinweis liefern; Risiko/Druck steigt |

## 5. Fallstand und Ranking

Spielqualität und Prüfvertrauen bleiben strikt getrennt. Ein älterer
Komplettlauf senkt nicht ohne belegten Qualitätsrückschritt die
Spielqualitätsnote.

| Rang | Fall | Spielqualität | Prüfvertrauen | Aktueller Stand |
|---:|---|---:|---|---|
| 1 | Strauss | 9,4/10 | sehr hoch | vollständiger Produktionslauf mit Krummbein, Rex, Items, Kampf, Romance und Abschluss |
| 2 | Lindenbaum | 9,3/10 | sehr hoch | vollständiger politischer Lauf mit Eva, Brakke, Items, Begleitung und möglicher Haft |
| 3 | Stein | 9,3/10 | sehr hoch | vollständiges Endgame mit echter Akten- und Personensicherung |
| 4 | Wessel | 9,2/10 | sehr hoch | frischer vollständiger 24-Szenen-Lauf einschließlich MfS-Gewahrsam und Abschluss |
| 5 | Görke | 9,2/10 | sehr hoch | intensive Haft-, Item-, PPK-, Freilassungs- und Restore-Gegenläufe |
| 6 | Brauer | 9,1/10 | hoch | strukturell und regressionsseitig stabil; nächste ältere Gegenkontrolle |
| 7 | Krause | 9,1/10 | hoch | Diebstahl-, Mehrgegner-, Routen- und Weltenfortschritt regressionsgesichert |
| 8 | Wegener | 9,1/10 | hoch | frische Zweckaktions-, Reise-, Zeit- und Rettungskontinuität |
| 9 | Brandt | 9,1/10 | hoch | frischer Blackout-/Waffen-/Tatmittel-Gegenlauf ohne vorgezogene Behauptungen |
| 10 | Hollenbeck | 9,1/10 | hoch | Lindner-Briefing, Villa-Ankunft und begrenzter Wissensstand frisch abgesichert |
| 11 | Achterberg | 9,1/10 | hoch | Auftragswissen und echter Digitalis-Eigenfund sauber getrennt |
| 12 | Vogt | 9,1/10 | hoch | sechs Kernorte, Pieck-Gates, einmalige Haft und Schlaf-Ortswahrheit abgesichert |
| 13 | Kessler | 9,1/10 | hoch | bis Szene 10 frisch live; Finale und Kontinuität vollständig regressionsgesichert |
| 14 | Schiffer | 9,1/10 | hoch | Rettung und beide Übergaben vollständig regressionsgesichert; frischer sichtbarer Komplettlauf noch offen |

Die Plätze 6 bis 14 liegen qualitativ eng beieinander. Die Rangfolge ist keine
verdeckte Abwertung wegen unterschiedlicher Testfrische.

## 6. Konkrete Dev9-Befunde

### Wessel

- 24 Szenen vollständig auf Produktion gespielt.
- Freiwilliger MfS-Gewahrsam, Protokoll, Roth, Schlaf und Freilassung
  funktionierten.
- Ausrüstung wurde am Morgen zurückgegeben; Karl wurde versorgt.
- Neun Indizien; Werner lebt und sitzt belegt in Hohenschönhausen.
- Bruno wurde korrekt informiert; tatsächliche Auszahlung: 270 Ostmark.
- Toter Pfad behoben: Gaehlerts Gegenbeweis zur Westflucht war nicht an die
  strukturierten Fund-IDs angeschlossen.
- Wirtschaftsdrift behoben: kein behaupteter Vorschuss von 800 Ostmark mehr.

### Kessler

Der frische Produktionslauf erreichte Szene 10 und bestätigte:

- fünf echte Indizien,
- 24 Ostmark tatsächlicher Informantenpreis,
- Renommeegewinn,
- geschlossene Spedition bei Nacht,
- sinnvolle Umleitung zum Büro,
- korrekten Schlaf- und Tageswechsel.

Fünf Kernaktionen erhielten konkrete Labels und Prompts. Der sichtbare
Frau-Hauke-/Robert-/Finalabschnitt konnte wegen blockierter Chrome-Eingaben
nicht im selben Lauf zu Ende geklickt werden. Er ist durch
`kessler-finale-continuity.test.js` und die übrigen Kessler-Regressionen
abgesichert, darf aber nicht als frisch vollständig live ausgegeben werden.

### Schiffer

Alle sechs Kernaktionen besitzen konkrete Labels und Prompts:

- Riemers Schuldbuch prüfen,
- Kellerzugang prüfen,
- Riemer unter Druck setzen,
- Sonja zu Detlef befragen,
- den Überfall in Detlefs Wohnung rekonstruieren,
- Frau Hagedorn befragen.

Die vollständige Regression deckt Kellerfreischaltung, Kalle als Wache,
Detlefs physische Befreiung, Übergabe an Renate oder Polizei und den
begrenzten Schlussbericht ab. Ein neuer sichtbarer Produktionskomplettlauf
bleibt die erste offene Schiffer-Priorität.

## 7. Nächste Prioritäten

1. **Kessler sichtbar abschließen:** ab Frau Hauke und Robert bis zum Bericht
   an Edith; danach ein Gegenlauf mit anderem Rufprofil.
2. **Schiffer vollständig live:** Spielklub, Kellerrettung und mindestens ein
   Übergabeweg; anschließend den zweiten Übergabeweg als Gegenvariante.
3. **Brauer und Krause:** ältere hohe Vertrauensstufe rotierend gegenprüfen,
   besonders Items, Rex, Ruf und alternative Enden.
4. **Wessel nur als Variante:** alternatives politisches Ende oder anderer
   Gewahrsamspfad; den bestätigten Hauptweg nicht erneut priorisieren.
5. **Vogt:** alternativer Pieck-/Haftweg ohne zweite Haft-Episode.
6. **Wegener, Brandt, Hollenbeck und Achterberg:** alternative mittlere und
   späte Beweisketten statt erneut nur die Eröffnung.

Bei Rotationsläufen bewusst variieren:

- neutraler, sehr guter, schlechter und harter Ruf,
- Rex regulär aufnehmen,
- Trude-Sortiment und unterschiedliche Items,
- PPK, Team- und Kombiaktionen,
- Romance und Übernachtung,
- Heilung, Schlaf, Haft und Freilassung,
- alternative Enden und reale Beweissicherung,
- Szenenbild gegen Prosa, Ort, Zeit, Roster und Zustand.

## 8. Tests und Sicherheitsregeln

Vollständige Suite:

```powershell
$node='C:\Users\benle\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$failed=@()
$count=0
Get-ChildItem -LiteralPath tests -Filter '*.test.js' | Sort-Object Name | ForEach-Object {
  $count++
  & $node $_.FullName
  if ($LASTEXITCODE -ne 0) { $failed += $_.Name }
}
if ($failed.Count -gt 0) {
  Write-Output ('FAILED: ' + ($failed -join ', '))
  exit 1
}
Write-Output ('ALL_TESTS_OK count=' + $count)
```

Vor jedem Commit:

```text
git diff --check
git status --short
vollständige Suite
```

Kein `git reset --hard`, keine fremden Änderungen verwerfen, keine
Zugangsdaten persistieren. Ein Codefix gilt erst als abgeschlossen, wenn
Commit, Push, FTPS-Deployment und sichtbare Produktionsversion denselben
Codezustand zeigen.

## 9. Kompakter Statussatz

Schatten läuft produktiv auf `v7.12.1762 +SchifferPurpose`, Code-Commit
`b07f82f`, bei Repository-HEAD `3177a30` und 70/70 grünen Tests. Alle 14 Fälle
liegen zwischen 9,1 und 9,4. Strauss, Lindenbaum, Stein, Wessel und Görke
besitzen sehr hohes Prüfvertrauen; alle übrigen Fälle hohes. Die
Gewahrsamsoptionen und die geprüften Wessel-, Kessler- und
Schiffer-Kernaktionen haben reale Wirkung. Als Nächstes werden Kessler
sichtbar beendet und Schiffer vollständig live gegengelaufen.
