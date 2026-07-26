# Schatten – Übergabe aus „Schatten Dev 7“

Kopiere diesen gesamten Text in den neuen Chat und sage dort:

> Wir entwickeln Schatten anhand dieser Übergabe weiter. Bitte zuerst den Ist-Zustand prüfen und danach den offenen Brauer-Abschluss in Chrome fertig testen. Vorhandene Änderungen nicht verwerfen.

## Auftrag und Arbeitsweise

Schatten wird iterativ im echten Debug-Spiel getestet. Nicht nur fallspezifisch flicken: Fehler möglichst engineweit beheben, außer die Ursache liegt nachweislich im Setup eines einzelnen Falls.

Bei jedem Run besonders prüfen:

- Logik, Chronologie, Beweiskette und Fallabschluss
- Prosa gegen tatsächlichen Weltzustand
- Personen im Szenentext gegen Personenmenü und Szenenbild
- Ein Haupt-NPC, der am Ort physisch anwesend und zentral ist, muss auch im Bild erscheinen. Bei dynamisch auftauchenden zentralen Gegnern ohne passendes Bild wird das Bild ausgeblendet.
- Keine erfundenen Schlüssel, Zahlungen, Gegenstände, Telefonanschlüsse, Ortswechsel oder NPCs
- Keine fallspezifischen Fixes, wenn ein allgemeiner Engine-Guard möglich ist
- Nach Änderungen vollständige Regressionstests, Git-Commit/Push und Live-Deployment

## Projekt und Live-System

- Lokales Projekt: `<WORKSPACE>\Schatten`
- Hauptdatei: `index.html`
- Tests: `tests\*.test.js`
- Git-Branch: `main`
- Git-Remote: `https://github.com/benlebt/Schatten.git`
- Live-Spiel: `https://schatten.sfp.de/`
- Debug-URL-Schema: `https://schatten.sfp.de/?debug=on&v=VERSION`
- FTP-Host: `www126.your-server.de`
- FTP-Benutzer: `sfpade_1`
- Das FTP-Passwort ist absichtlich nicht in dieser Datei gespeichert. Der Benutzer muss es im neuen Chat erneut bereitstellen oder bei der interaktiven Abfrage eingeben.

## Deployment-Ablauf

1. Vollständige Tests ausführen.
2. `git diff --check` und `git status --short` prüfen.
3. Änderungen committen und auf `main` pushen.
4. `index.html` per FTPS hochladen.
5. Live-URL mit neuer Versionsnummer und Cache-Buster öffnen.
6. Den betroffenen Spielstand im Browser real verifizieren.

FTPS-Befehl:

```powershell
curl.exe --ssl-reqd --user sfpade_1 --ftp-create-dirs -T index.html ftp://www126.your-server.de/index.html
```

Der Befehl fragt das Passwort interaktiv ab.

Tests mit dem in Codex gebündelten Node:

```powershell
$node='<CODEX_RUNTIME>\dependencies\node\bin\node.exe'
$tests=Get-ChildItem -LiteralPath tests -Filter '*.test.js' | Sort-Object Name
$passed=0
foreach($test in $tests){
  & $node $test.FullName
  if($LASTEXITCODE -ne 0){ exit $LASTEXITCODE }
  $passed++
}
Write-Output "TESTS_OK $passed/$($tests.Count)"
```

Letzter Teststand: `54/54` grün.

## Exakter Git-/Deployment-Stand bei Übergabe

Letzter erfolgreich gepushter Commit:

```text
1f22600 Resolve report clients through canonical identity
```

Weitere unmittelbar vorherige Commits:

```text
693a9aa Align client reporting with required proof
7574c0a Allow final report after client intake
df33437 Reopen solved clients for final report
e2e51d9 Correct Brauer main NPC scene visuals
d2635b6 Guard scene images against dynamic threats
2316f1b Correct Brauer laundry scene cast
b2b4107 Merge quoted NPC name variants
```

Live deployed ist derzeit:

```text
v7.12.1561 +ClientReportIdentity
```

Lokal vorhanden, getestet, aber noch NICHT committed, gepusht oder deployed:

```text
v7.12.1562 +StageThreeClientReport
```

Grund: Beim letzten Commit-Versuch brach Windows PowerShell wegen zu kleiner Auslagerungsdatei ab. Die Dateien blieben erhalten. Danach wurde die Übergabe angefordert.

Aktuell modifiziert:

- `index.html`
- mehrere Tests mit der neuen Versionskonstante
- `tests/brauer-flow.test.js`

Diese Änderungen keinesfalls verwerfen. Zuerst `git diff` prüfen.

## Offener v1562-Fix

Im laufenden Brauer-Run ist die zentrale Beweiskette gelöst und der Status zeigt:

```text
Stufe: Spur aufgeklärt
▓▓▓▓▓ (Klient berichten)
```

Trotzdem blieb Hilde im Personenmenü deaktiviert:

```text
Hilde Brauer – Ausgesprochen
```

Die ersten drei Fixstufen v1558–v1561 deckten nacheinander diese Altlasten auf:

1. Ein erledigter Gesprächspartner wurde generell deaktiviert.
2. `klientGesprochen` bedeutet historisch schon „Erstgespräch geführt“ und darf den späteren Abschlussbericht nicht sperren.
3. Ein Brauer-Proof-Pfad setzt nicht zwingend `wahrheitErkannt`.
4. Die Klientenidentität muss über den kanonischen Resolver `_istKlient` erkannt werden.

Der lokale v1562-Fix vereinfacht das Gate nun entsprechend dem zentralen Fortschrittsmodell:

- Stage 3 bedeutet bereits „Klient berichten“.
- Ein echter Klient wird ab Stage 3 wieder als Ziel freigeschaltet.
- Physisch noch offene Rettungen bleiben gesperrt.
- Beim Diebstahl bleibt die reale Sicherung/Rückgabe des Zielobjekts Pflicht.
- `requiredProof` und Truth-Beats entscheiden weiterhin, ob das Finale voller Erfolg oder ehrlicher Teilerfolg ist. Das UI dupliziert diese Reifeformel nicht mehr.
- Stage 4 oder eine wirklich gerenderte Abschlussszene sperren den Bericht weiterhin.

Die lokalen v1562-Änderungen liefen bereits mit `54/54` Tests grün.

## Unmittelbar nächste Schritte

1. `git diff --check` und `git status --short`
2. Optional nochmals `54/54` Tests laufen lassen
3. v1562 committen, zum Beispiel:

```text
Make stage three clients reportable
```

4. Auf `main` pushen
5. `index.html` per FTPS deployen
6. `https://schatten.sfp.de/?debug=on&v=1562` laden
7. Prüfen, ob Hilde jetzt „Fall berichten“ statt „Ausgesprochen“ zeigt
8. Hilde anklicken, „Fall berichten“ wählen und den Abschluss ausspielen
9. Finale prüfen:
   - Erwin hat sich vor vier Tagen unter richtigem Namen in Marienfelde registriert.
   - Er ist im Westen/in Sicherheit; Karl hat die Aufnahmebestätigung.
   - Karl darf nicht behaupten, Erwin persönlich gefunden oder zurückgebracht zu haben.
   - Hilde muss sichtbar und menschlich reagieren.
   - Keine neue Gefahr, kein Telefonat, kein Ortswechsel, kein neues Indiz.
   - Das Bild muss Karl und Hilde konsistent zeigen.
10. Nach erfolgreichem Finale Git-Status sauber halten.

Falls Hilde unter v1562 wider Erwarten immer noch deaktiviert ist, nicht blind weitere Flags hinzufügen. Im Debug-Modus den Grund direkt in den DOM ausgeben oder im Button-Title instrumentieren: Stage, `target.id`, `target.tag`, `_istKlient`, Rettungsblocker, Diebstahlstatus und Abschlussflags.

## Laufender Brauer-Debug-Run

Aktueller gespeicherter Run, zuletzt Szene 19:

- Tag 2, Nacht
- Ort: Hilde Brauer Wohnung Köpenick
- Indizien: 7/8
- Fallstatus: Stage 3, „Spur aufgeklärt – Klient berichten“
- Entscheidender Beweis vorhanden:
  - Dr. Ruth Kellner bestätigt, dass Erwin Brauer vor vier Tagen unter seinem richtigen Namen im Notaufnahmelager Marienfelde registriert wurde.
  - Eine Aufnahmebestätigung wurde übergeben.
- Karl ist zu Hilde zurückgekehrt.
- Szenenbild zeigt Karl und Hilde korrekt.
- Einziger Blocker: Hildes Abschlussaktion ist in der live deployten v1561 noch deaktiviert.

Wichtige Beobachtungen aus diesem Run:

- Szene 1: familiärer Auftrag ohne erfundenen Vorschuss, korrektes Hilde-Bild
- Szene 2: Hilde antwortet sichtbar und fährt korrekt nach Hause, nicht zu Krauses Antiquitätenladen
- Lokschuppen: Mahlke und IM „Schaffner“ funktionieren; Doppelbutton für unterschiedliche Anführungszeichen behoben
- Wäscherei: Greta-Bild korrigiert; kein zusätzlicher Phantom-Schaffner mehr
- Dynamischer Hauptmann Vollmer: Statisches Bild wird ausgeblendet, wenn er darin fehlt
- Hilde-Wohnung: Karl und Hilde konsistent im Bild
- Bahnhof Friedrichstraße: Vollmer erschien dynamisch; Bild wurde korrekt ausgeblendet
- Marienfelde: Ruth Kellner und Rolf Meissner sind im Bild und in der Prosa konsistent
- Ruths Aussage liefert den entscheidenden Registrierungsbeweis

Eine ältere Szene dieses gespeicherten Runs enthält noch einen erfundenen Schlüssel. Das Setup wurde danach korrigiert: Das Reichsbahn-Schließfach ist ausdrücklich unverschlossen und benötigt keinen von Hilde übergebenen Schlüssel. Neue Runs sollen korrekt sein; der alte Szenentext im Save wird nicht rückwirkend geändert.

## In dieser Runde umgesetzte Engine-Fixes

- Szenen-Cast fließt in das Hauptaktionsmenü ein.
- Aktionsausführung löst NPCs aus dem physischen Szenen-Cast korrekt auf.
- Klienten-Abreiseziele sind setupgesteuert statt hart auf Krauses Antiquitätenladen gesetzt.
- Klienten bleiben bis zur sichtbaren Antwort und Abreise in der Szene.
- Quote-Varianten wie `IM "Schaffner"` und `IM 'Schaffner'` werden kanonisch zusammengeführt.
- Zentrale dynamische STASI-/Gegner-/Verdächtige-Figuren werden in die Bildbesetzungsprüfung einbezogen.
- Fehlt eine zentrale anwesende Figur im Bildvertrag, wird das Szenenbild ausgeblendet.
- Brauer-Schließfach hat nun eine explizite Zugangswahrheit ohne erfundenen Schlüssel.
- Erledigte Klienten können für den Abschlussbericht wieder geöffnet werden; der abschließende Stage-3-Gleichlauf ist lokal in v1562.

## Neue/überarbeitete Brauer-Bilder

Alle sind 1536 × 864 WebP:

```text
assets\scenes\brauer\karl-mauers-buero-hilde-evening.webp
assets\scenes\brauer\waescherei-koepenick.webp
assets\scenes\brauer\marienfelde-notaufnahmelager.webp
```

Erstellt/bearbeitet mit dem eingebauten ImageGen:

- Büro: Hilde mit Koffer zu Karl ergänzt, genau zwei zentrale Personen
- Wäscherei: falsch dargestellten sitzenden Reichsbahn-Mann entfernt; Karl und Greta bleiben
- Marienfelde: zentrale Mitarbeiter als Dr. Ruth Kellner und Rolf Meissner korrigiert; historische 1953-Noir-Optik und Raum erhalten

## Qualitätsstand Brauer

Vor dem noch offenen Abschluss ist Brauer deutlich runder:

- starke familiäre Eröffnung
- klare, logisch gestufte Spur von Köpenick über Reichsbahn/Wäscherei/Friedrichstraße nach Marienfelde
- sauberer Pflichtbeweis statt bloßer Vermutung
- gute politische Spannung durch Vollmer und das offene Berlin 1953
- deutlich bessere Bild-/Prosa-Konsistenz

Vorläufige Bewertung: etwa `8,6/10`.

Wenn der Abschlussbericht unter v1562 sauber funktioniert und das Finale wahrheitstreu bleibt, ist `8,8/10` realistisch.

## Frühere Fall-Fokusse

In den vorherigen Chats/Runden wurden insbesondere diese Fälle wiederholt getestet und optimiert:

- Kessler
- Achterberg
- Görke
- Strauss
- Lindenbaum
- Krause
- Brauer

Der aktuelle Auftrag lautete, nach den schwächer bewerteten Fällen weiterzugehen. Brauer war der zuletzt intensiv getestete Fall. Nach seinem sauberen Abschluss sollte anhand der letzten Qualitätsliste der nächste niedrig bewertete Fall gewählt und mindestens einmal vollständig im Debug-Modus gespielt werden.

## Sicherheits- und Arbeitsregeln für den neuen Chat

- Keine vorhandenen Änderungen mit `git reset --hard` oder Checkout verwerfen.
- Vor Änderungen den schmutzigen Worktree lesen.
- Zugangsdaten nie in Repository-Dateien, Logs oder Übergabetexte schreiben.
- FTP-Passwort nicht im finalen Bericht wiederholen.
- Bilder nur ändern, wenn Sichtprüfung einen echten Besetzungs-/Konsistenzfehler zeigt.
- Engineweite Ursache bevorzugen.
- Nach jedem Fix vollständige Tests und echten Live-Run.
