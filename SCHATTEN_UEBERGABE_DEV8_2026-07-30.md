# Schatten — vollständige Übergabe für den nächsten Entwicklungs-Chat

Stand: 30. Juli 2026

Aktueller Release: `v7.12.1750 +SchifferOpeningTruth`

Aktueller Release-Commit: `b2e7773 fix: require complete Schiffer opening`

Repository-HEAD: aktuelles `origin/main` prüfen; nach dem Release folgen reine
Wissens-/Übergabe-Commits ohne erneutes Produktionsdeployment.

## Startanweisung für den neuen Chat

> Wir entwickeln Schatten anhand dieser Übergabe weiter. Lies
> `SCHATTEN_UEBERGABE_DEV8_2026-07-30.md` und anschließend `LEKTORAT.md`
> vollständig. Prüfe danach Git-, Test- und Produktionsstand. Bewahre
> bestehende Benutzeränderungen. Arbeite weiter im Zyklus echter
> Produktionslauf → Root Cause → engineweiter oder eng fallgebundener Fix →
> Regressionstest → vollständige Suite → Commit/Push → FTPS-Deployment →
> Produktionsgegenlauf.

Die ältere Datei `SCHATTEN_UEBERGABE_DEV7_2026-07-29.md` beschreibt nur einen
historischen Zwischenstand v1683 und ist für neue Arbeit durch diese Übergabe
ersetzt.

## 1. Projekt und Arbeitsweise

Schatten ist ein KI-gestütztes Krimi-Adventure im Berlin des Jahres 1953.
Qualität wird nicht nur statisch bewertet, sondern in echten Debug-Läufen auf
Produktion geprüft.

Verbindlicher Zyklus:

1. Fall und Variante bewusst auswählen.
2. Vollständigen oder klar abgegrenzten Produktionslauf durchführen.
3. Pro Szene Prosa, Haupt-UI, Bild, Ort, Zeit, Roster, Objekte und Mechanik
   gemeinsam prüfen.
4. Fehler bis zur tatsächlichen Root Cause verfolgen.
5. Engineweit reparieren, wenn die Ursache fallübergreifend ist; Fallkanon nur
   eng fallbezogen absichern.
6. Exakten Regressionstest ergänzen.
7. Zieltests und vollständige Suite ausführen.
8. `git diff --check` und Worktree prüfen.
9. Committen, auf `main` pushen und `index.html` per FTPS deployen.
10. Exakt denselben Stand mit Cache-Buster auf Produktion bestätigen.

## 2. Repository und Produktion

```text
Projekt: Repository-Wurzel des lokalen Schatten-Checkouts
Hauptdatei: index.html
Tests: tests\*.test.js
Branch: main
Remote: https://github.com/benlebt/Schatten.git
Produktion: https://schatten.sfp.de/
Debug: https://schatten.sfp.de/?debug=on&v=1750&deploy=b2e7773
FTPS-Host: www126.your-server.de
FTPS-Benutzer: sfpade_1
```

Das Passwort wird absichtlich nicht in Dateien, Git, Übergaben oder sichtbaren
Berichten gespeichert. Deployment erfolgt direkt per FTPS; der alte
Vercel-Ablauf ist nicht der aktuelle Produktionsweg.

## 3. Exakter technischer Stand

```text
Release: v7.12.1750 +SchifferOpeningTruth
Release-Commit der deployten index.html: b2e7773
HEAD/origin-main: beim Einstieg mit git rev-parse prüfen; nach b2e7773 folgt
gegebenenfalls nur der abschließende Wissens-/Ranking-Commit
Tests: 69/69 grün
Deployment: erfolgreich
Produktionsprüfung: Versionsbadge sowie Schiffer-, Wessel- und Kessler-
Gegenläufe auf dem deployten Stand sichtbar bestätigt
```

Letzte relevante Commits:

```text
b2e7773 fix: require complete Schiffer opening
8461d18 fix: preserve Schiffer client reply fallback
ce9fd24 fix: harden medium-high case truth
f8893d1 fix: preserve medium-case opening truth
794750c fix: guard briefing facts from premature discovery
f78c495 fix: keep sleep at the current engine location
746418c fix: harden Vogt truth and custody lifecycle
209de89 docs: hand off current Schatten quality state
```

## 4. Aktuelle Bewertung aller 14 Fälle

Spielqualität und Prüfvertrauen sind getrennte Werte. Ein weniger frischer
Komplettlauf darf die Qualität nicht ohne konkreten Regressionbefund von etwa
9 auf 7 oder 8 abwerten.

| Rang | Fall | Spielqualität | Prüfvertrauen |
|---:|---|---:|---|
| 1 | Strauss | 9,4/10 | sehr hoch |
| 2 | Lindenbaum | 9,3/10 | sehr hoch |
| 3 | Stein | 9,3/10 | sehr hoch |
| 4 | Görke | 9,2/10 | sehr hoch |
| 5 | Brauer | 9,1/10 | hoch |
| 6 | Krause | 9,1/10 | hoch |
| 7 | Wessel | 9,1/10 | hoch |
| 8 | Kessler | 9,1/10 | hoch |
| 9 | Schiffer | 9,1/10 | hoch |
| 10 | Vogt | 9,1/10 | hoch |
| 11 | Wegener | 9,0/10 | hoch |
| 12 | Brandt | 9,0/10 | hoch |
| 13 | Hollenbeck (Lindner-Auftrag) | 9,0/10 | hoch |
| 14 | Achterberg | 9,0/10 | hoch |

Kein Fall ist derzeit technisch unspielbar. Alle Fälle liegen im 9er-Bereich.
Die Plätze 11–14 sind nicht wesentlich schlechter; die Unterschiede beruhen
auf erzählerischer Dichte und Komplexität, nicht auf ausstehenden
Gegenläufen. `hoch` bleibt bewusst unter `sehr hoch`, solange nicht jede
Sondermatrix frisch vollständig durchgespielt wurde.

## 5. Zuletzt intensiv bestätigte Fälle

### Strauss

- Vollständiger Produktionslauf.
- Krummbein, Rex, variable Items, Konfrontationen und Abschluss geprüft.
- Trudes Außenstand, Sommerbilder, Roster und Rex-Zustandsbilder korrigiert.
- Romance wurde bewusst angespielt und ihre Fortschritts-/Abschlussgrenzen
  repariert.

### Lindenbaum

- Vollständiger politischer Lauf.
- Eva-Romance, Begleitung, Hermes, Major Brakke, Slapstick-/Itemaktionen und
  möglicher MfS-Gewahrsam geprüft.
- Brakke besitzt Zustandsbilder vor Wirkung, im Stinkbombennebel und nach
  Fixierung.
- Normale Romance und Übernachtung sind strikt getrennt.

### Görke

- Krollwitz-/Stasi-Haft gezielt wiederholt.
- Kaffee-/Itemübergabe, PPK, Beschlagnahme, Verhör, Schlaf, Freilassung und
  Rückgabe der persönlichen Ausrüstung geprüft.
- Restore-Migrationen sind idempotent und heilen ältere doppelte Zugriffs- und
  Türsätze.

### Stein

- Politisches Endgame mit realer Beweissicherung abgeschlossen.
- Originalakten werden tatsächlich an Vera übergeben; Margarete passiert die
  Sektorengrenze und wird übernommen.
- Akten- und Personensicherung bleiben getrennt.
- Vera, Mertens, Mantelmann und Margarete stimmen in Prosa, UI und Bild.
- Margaretes Drahtgestellbrille bleibt bis zu einer erzählten Reparatur
  zerbrochen.

### Frischer Rotationsblock v1744 bis v1750

- **Vogt:** vollständige Auftragseröffnung, Sigrid-Kontinuität, sechs Kernorte,
  Pieck-Ortsgates, einmalige Haft-Episode und Schlafzeit repariert. Der
  Produktionsgegenlauf bestätigte außerdem, dass Schlaf vor Ort den
  Engine-Ort, Header, Prosa und das Morgenbild beibehält.
- **Achterberg:** Auftragswissen wird nicht mehr als bereits erspielter
  Eigenfund in der Garderobe ausgegeben. Der Egon-Gegenlauf unterscheidet
  Briefing und echten Digitalis-Fund korrekt.
- **Hollenbeck/Lindner:** kanonische Reviereröffnung, Lindners begrenzter
  Wissensstand und die Ankunft in der Villa mit Margit wurden live bestätigt;
  keine vorgezogenen Notizbuch-, Wegner-, Sokolow- oder Datscha-Fakten.
- **Brandt:** die unbekannte Blackout-Ursache bleibt auch in Vergleichen
  unbekannt; Hammer-, Stangen- und Waffenbehauptungen werden vor Freigabe
  repariert. Der Produktionsgegenlauf behielt Benommenheit und Fremdpistole,
  erfand aber kein Tatmittel.
- **Wegener:** Pflichtopening bestätigt Auftrag seit zwei Tagen,
  Verschwinden seit 6. Februar und Schieles 15 Ostmark oder Tauschware.
- **Wessel:** Eröffnung und Brunos erste Aussage nennen Werner, 17. Juni,
  Friedrichstraße, achthundert Ostmark und politische Gefahr vollständig.
- **Kessler:** Hinterhof-Eröffnung, Fensterpositionen, Robert außerhalb,
  Szenenbild und Pohls Mittwochsbeobachtung sind deckungsgleich. Haukes
  Vorname bleibt bis zur sichtbaren Vorstellung verborgen.
- **Schiffer:** Pflichtopening und direkter Renate-Dialog sind vollständig.
  Renate kennt keine Boxernase, Herkunft oder sonstige Tätermerkmale und
  übergibt kein erfundenes Foto; Antwort und Abgang bleiben auch im letzten
  Sozialfallback falltreu.

## 6. Rufsystem — bestätigte A/B/C/D-Matrix

Vergleichsprofile:

```text
neutral:   Renommee 0 / Härte 0
sehr gut:  Renommee +5 / Härte 0
schlecht:  Renommee -5 / Härte 0
hart:      Renommee 0 / Härte +5
```

Alle Profile erhalten im kontrollierten Debug-Vergleich dieselbe
Stein-Eröffnung mit dem Mann im langen Mantel.

- Neutral, sehr gut und hart: ein glaubhaftes `Beruhigen` beendet die Lage.
- Schlecht: erster Schritt senkt Spannung, zweiter beendet die Lage.
- Sehr guter Ruf macht Ruhe glaubwürdiger.
- Harter Ruf erzeugt Respekt, macht Zeugen aber vorsichtiger.
- Kein Profil erhält automatische Beweise, Flucht, Deeskalation oder Kampfsieg.
- Schwere körperliche Eskalation bleibt in allen Profilen falsch.

## 7. Rex, PPK, Items und Kombiaktionen

Rex muss regelmäßig regulär über Willi/Trude aufgenommen und nicht nur per
Debugstatus simuliert werden. Getestet werden Bildpräsenz, Partytransport,
Kommandos, Gruppen, harte Gegner, Hafttrennung und Wiederaufnahme.

Aktuelle Balancematrix:

```text
unbewaffnet normal         2/6
unbewaffnet mit Rex        3/6
PPK normal                 3/6
PPK mit Rex                4/6
Korn gegen hart            3/6
Feuerwerk gegen Gruppe     4/6
Handschellen ohne Öffnung  3/6
Handschellen nach Treffer  5/6
Handschellen + Rex-Fixieren 6/6
Schlagstock gegen hart     4/6
```

Rex und Party helfen deutlich, sind aber kein genereller Autowin. Die Walther
PPK ist ein einmaliger Distanz-/Druckhebel, kein automatischer Schuss oder
Sieg. Verbrauchsitems verschwinden nach echter Übergabe oder Verwendung.

## 8. Bildsystem — niemals eine leere Bildfläche

Verbindliche Fallbackfolge ab v1743:

1. exakte Rex-/Begleiter-/Gegner-/Zustandsvariante,
2. vorhandene Lichtalternative,
3. neutrales Grundmotiv desselben Orts mit Karl ohne Spezialcast,
4. eingebautes Karl-allein-Ersatzmotiv mit aktuellem Ortsnamen.

Ein fehlendes Spezialmotiv darf weder einen leeren Bildrahmen noch ein Bild von
einem fremden Ort erzeugen. Die technische Garantie ist in
`tests/scene-image-never-blank.test.js` regressionsgesichert.

Neue Stein-Bilder:

```text
assets/scenes/stein/cafe-kranzler-vera-day-v1739.png
assets/scenes/stein/karl-mauers-buero-mertens-only-day-v1739.png
```

## 9. Prosa-, UI- und Weltwahrheit

Jede sichtbare Szene muss echte, ausformulierte Spielprosa enthalten. Reine
KI-Anweisungen, Regiesätze oder technische Fallbacksprache sind Fehler.

Diese Ebenen müssen dieselbe physische Wahrheit behaupten:

```text
Prosa
Szenenbild
personenImRaum
Haupt-UI
Engine-Ort und Subort
Tageszeit/Jahreszeit
NPC- und Objektzustand
gewählte Aktion
Inventar und Zahlung
```

Ein neu gewürfelter Gegner wird vor dem Prosa-/Cast-Abgleich gebunden. Solange
die Szene ihn nicht eingeführt hat, bleibt er aus UI und Bild verborgen. Ein
sichtbarer Abgang entfernt eine Figur gemeinsam aus Prosa-Folge, Roster, UI
und Anwesenheitsbild.

## 10. Romance, Figuren und Ton

- Romance-Figuren sind eigenständige Menschen mit Haltung, Grenzen, Humor,
  Begehren, Vorsicht und eigenen Interessen.
- Normale Annäherung und Übernachtung sind getrennte Aktionen.
- Romance darf keine offenen Kernindizien, Geständnisse oder fremden
  Cliffhanger erzeugen.
- Morgenprosa und Morgenbild müssen übereinstimmen: Partnerin anwesend oder
  bereits gegangen, niemals beides.
- Figuren und Zeugen sollen konkret und widersprüchlich genug sein, nicht
  austauschbare Informationsautomaten.
- Slapstick und knackige Gewalt sind erwünscht, bleiben aber nicht gory und
  nicht jugendgefährdend. Wirkung wird über Atemverlust, Taumeln, Sturz,
  beschädigte Kleidung und Würdeverlust erzählt, nicht über Blut- oder
  Kopftrefferpornografie.
- Politische Fälle brauchen reale, aber nicht allwissende oder permanent
  überzogene MfS-Bedrohung.

## 11. Kanonische vollständige Lektoratsnorm

`LEKTORAT.md` enthält alle aktuellen Regeln und muss im neuen Chat vollständig
gelesen werden. Dazu gehören insbesondere:

- Bild-/Prosa-/UI-Abgleich jeder Szene,
- definierte Kernindizien und Beweiszeitpunkte,
- Ruf-, Romance-, Rex-, Item-, PPK- und Kombivarianten,
- Haft, Verhör, Freilassung und Inventarrückgabe,
- Figuren- und Romance-Tiefe,
- Slapstick und altersgerechte Gewalt,
- historische/Stasi-Wahrheit,
- Zahlungen, Tausch, Inventar und Objektzustände,
- Stil-Tics, Metasprache und reine KI-Anweisungstexte,
- Mindestprotokoll und Bewertungsregeln.

Bei einem Widerspruch gilt:

1. aktuelle ausdrückliche Benutzerentscheidung,
2. Code und Regressionstests,
3. `LEKTORAT.md`,
4. diese Übergabe,
5. `SCHATTEN_PROJEKT.md`,
6. ältere Dokumente.

## 12. Tests

Gebündeltes Node:

```powershell
$node='node'
```

Vollständige Suite:

```powershell
$failed=@()
$files=Get-ChildItem -LiteralPath tests -Filter '*.test.js' | Sort-Object Name
foreach($file in $files){
  & $node $file.FullName
  if($LASTEXITCODE -ne 0){$failed += $file.Name}
}
if($failed.Count){Write-Output ($failed -join ','); exit 1}
Write-Output ('ALL_TESTS_OK count=' + $files.Count)
```

Aktueller Sollstand:

```text
ALL_TESTS_OK count=69
```

Viele Tests prüfen die exakte Zeichenfolge von `window.SCHATTEN_VERSION`.
Versionsbumps müssen kontrolliert in allen betroffenen Tests aktualisiert
werden.

## 13. Nächste Prioritäten

Die zuvor mittleren und mittelhohen Fälle sind bis v1750 frisch auf Produktion
geprüft und ihre konkreten Befunde geschlossen. Die nächste Rotation beginnt
nicht erneut bei denselben Eröffnungen, sondern erweitert gezielt die
Variantenabdeckung:

1. Wessel: später politischer Beweis-/Haftpfad und alternatives Ende.
2. Kessler: Robert-Eintritt, Frau-Hauke-Reveal und Abschluss in verschiedenen
   Rufprofilen.
3. Schiffer: Spielklub, Kellerrettung und beide Übergabewege.
4. Vogt: alternativer Pieck-/Haftpfad ohne zweite Haft-Episode.
5. Achterberg, Hollenbeck, Brandt und Wegener: mittlere und späte
   Beweisketten statt erneut nur die Eröffnung.
6. Danach Brauer und Krause als rotierende Gegenkontrolle der älteren hohen
   Vertrauensstufe.

Dabei je nach Setup bewusst variieren:

- neutraler, sehr guter, schlechter und harter Ruf,
- Rex regulär aufnehmen,
- Trude-Sortiment und unterschiedliche Items,
- PPK, Team- und Kombiaktionen,
- Romance und Übernachtung,
- Slapstick und knackige, nicht-gory Gewalt,
- politische Haft-/Verhörpfade,
- alternative Enden und echte Beweissicherung,
- jedes Szenenbild gegen Prosa und Haupt-UI.

## 14. Repository-Sicherheit

- Bestehende Benutzeränderungen nicht verwerfen.
- Kein `git reset --hard`.
- Zugangsdaten niemals speichern oder wiederholen.
- Vor Commit `git diff --check` und `git status --short`.
- Erst nach grüner Suite committen, pushen und deployen.
- Ein Fix ist erst abgeschlossen, wenn derselbe Stand auf Produktion sichtbar
  bestätigt wurde.

## 15. Kurzer Statussatz

Schatten läuft produktiv auf v1750, Commit `b2e7773`, mit 69/69 grünen Tests.
Alle 14 Fälle sind strukturell spielbar und liegen in der aktuellen
Qualitätsbewertung zwischen 9,0 und 9,4. Strauss, Lindenbaum, Stein und Görke
haben weiterhin sehr hohes Prüfvertrauen; alle übrigen Fälle liegen nach dem
frischen Rotationsblock bei hoch. Rufsystem, Rex-/Itembalance, politische
Haftpfade, Bildgarantie, Auftrags-/Eigenfundtrennung, Schlaf-Ortswahrheit und
fallgebundene Wissensgrenzen sind regressionsgesichert. Die nächste Rotation
vertieft mittlere und späte Alternativpfade statt dieselben Eröffnungen erneut
zu wiederholen.
