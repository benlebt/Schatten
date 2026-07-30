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
Repository-HEAD vor diesem Dokumentationscommit: 5552d31
Produktiver Release: v7.12.1785 +PartialEndingTruth
Produktiver Code-Commit: 5552d31 fix: keep Brauer partial ending honest
Vorherige Code-Commits:
6833a01 fix: preserve selected social tone in fallbacks
0568659 fix: let reputation unlock informant evidence
Produktion: https://schatten.sfp.de/
Debug: https://schatten.sfp.de/?debug=on&v=1785&deploy=5552d31
Tests: 70/70 grün
Produktiver index.html-SHA-256:
24684FCA331087F6E1AA16C99FA7CC0F3DA8029691193363CE0D599EF3B543FD
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

### Krause — aggressive/no-Rex-Matrix mit friedlichem Ausgang

Der vollständige Produktionslauf kombinierte die riskantesten Achsen:

| Achse | Produktionsvariante |
|---|---|
| Konflikt | Frieda, Kalle und Jochen zunächst aggressiv angegriffen, danach alle drei bewusst beruhigt |
| Rex | ohne Rex |
| Ruf | Extremprofil Renommee -5 / Härte +5 |
| Indizreihenfolge | Hannelore → Rückwandschrank → Save/Reload → Fenster → Bornstein |
| Besitz | Etui erst sichtbar entdeckt, danach durch eigene Aktion gesichert |
| Save/Reload | einmal mitten in der Indizkette, einmal nach dem Etui-Pickup |
| Erschöpfung | Übermüdungsumleitung und Schlafzeit mitgetestet |
| Ende | persönliche Rückgabe an Theodor Krause |

Sichtbar korrekt:

- alle fünf Kernspuren blieben in umgekehrter Reihenfolge erreichbar;
- der extreme Ruf beeinflusste Drohungen und Reaktionen, ohne den Fall zu
  blockieren;
- Frieda, Kalle und Jochen blieben nach der Mehrgegner-Deeskalation als
  beruhigte, physisch anwesende Figuren konsistent;
- Lagerzugang, Etui-Fund und Etui-Pickup waren getrennte, bewusste Schritte;
- Save/Reload erhielt Ort, Szene, Inventar, Zielobjektstatus und Abschlussreife;
- das Etui verschwand nach dem Pickup auch aus dem Szenenbild;
- die persönliche Rückgabe entfernte das Etui aus Karls Besitz, zahlte
  200 Ostmark und endete mit 2884 Ostmark;
- die Abschlusskarte nannte sechs Indizien, Rückgabe und informierten Klienten.

Der Lauf deckte zusätzlich einen letzten, rein engineerzeugten Abschlussfehler
auf: Ein alter Erika-Einführungspush wurde nach der Etui-Übergabe wortgleich an
die Finalprosa gehängt. v1782 verwirft Romance-Pushes bei `AUFLOESEN` und
verbietet neue Nebenfiguren im Abschluss. Die alte sichtbare Szene bleibt
historisch, aber der genaue Root Cause ist regressionsgesichert.

### Brauer — Ruf-/Reihenfolge-/Teilabschlussmatrix

Der neue Produktionslauf kombinierte gezielt die noch ungetesteten Achsen:

| Achse | Produktionsvariante |
|---|---|
| Konflikt | Hauptmann Vollmer friedlich beruhigt |
| Rex | ohne Rex |
| Ruf | Renommee +5 / Härte -5, danach sichtbare Rufwirkung |
| Indizreihenfolge | Dienstschließfach → privater Schrank → Hilde → Mahlke |
| Save/Reload | nach dem ersten physischen Indiz, nach Mahlkes Auskunft und beim abgeschlossenen Teilende |
| Ende | bewusster früher Teilbericht ohne Marienfelde-Nachweis |

Sichtbar korrekt:

- physische Beweise vor Personenbefragungen bleiben vollständig erreichbar;
- der frühe höfliche Mahlke-Kontakt verbraucht den später freigeschalteten
  Kernhinweis nicht;
- v1783 erhält die ausgewählte Sozialtonart auch im deterministischen
  Weltwahrheits-Fallback;
- v1784 lässt einen echten Renommee-Vorteil den Informantenhinweis ohne Geld
  und Gewalt öffnen; Indiz und Fallstufe werden synchron gebucht;
- Vollmer erscheint als beabsichtigter politischer Gegenspieler, nicht als
  Phantom, und lässt sich mit hohem Renommee friedlich deeskalieren;
- der bewusste Bericht auf Stufe 3 beendet den Fall als offenen Teilerfolg;
- v1785 ersetzt erfundene Marienfelde-Bestätigungen durch einen vollständigen
  autorisierten Teilbericht und repariert auch den bereits gespeicherten
  falschen Endtext beim Reload.

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

### v7.12.1775 bis v7.12.1782 — Krause-Matrix

- `e110940` / v1775: Lagerzugang nach der Gruppenauseinandersetzung
  freigeschaltet.
- `dbec667` / v1776: Krauses Mehrgegnerroute rückt nach dem Kampf zuverlässig
  zum Lager vor.
- `0fe8f14` / v1777: alte Saves erhalten den tatsächlich erspielten
  Lagerzugang zurück.
- `f6e24d6` / v1778: das Etui bleibt im Bild verborgen, bis Karl es ausdrücklich
  entdeckt hat; neue Tag-/Nacht-Abdeckmotive.
- `0e3e9c8` / v1779: Entdeckung und physischer Pickup sind zwei getrennte
  Handlungen; die generische Gut-Hol-Logik überspringt die Sicherungsaktion
  nicht mehr.
- `6ca1d71` / v1780: nach dem Pickup zeigt die Lagerkulisse die leere Fundstelle;
  neue Tag-/Nacht-Zustandsmotive.
- `8081260` / v1781: ein ausdrücklicher Tagesschlaf verschiebt die Enginezeit
  konsistent um ungefähr acht Stunden.
- `197bd0c` / v1782: ausstehende Romance-Einführungen werden aus
  Fallabschlüssen entfernt; Abschlussprosa bleibt bei Karl und Auftraggeber.

### v7.12.1783 bis v7.12.1785 — Brauer-Matrix

- `6833a01` / v1783: strukturierte Sozialtonart hat Vorrang vor
  Textheuristiken; „ohne Druck“ kann nicht mehr als Drohung fehlklassifiziert
  werden.
- `0568659` / v1784: ein durch hohen Ruf geretteter Informantenweg öffnet
  Prosa und Indiz-Gate gemeinsam, ohne Zahlung oder Gewalt.
- `5552d31` / v1785: ein Abschluss ohne Pflichtnachweis verwendet einen
  vollständigen offenen Teilbericht; neue und gespeicherte falsche
  Marienfelde-Enden werden deterministisch ersetzt.

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

1. **Wegener:** mit Rex gegen ohne Rex, Polizei- gegen Klientenübergabe und
   Save/Reload zwischen Befreiung, Opel und Handoff.
2. **Brauer-Ergänzung:** niedriger Renommee-/hoher Härte-Gegenlauf mit
   aggressiver Vollmer-Lösung und vollständigem Marienfelde-Ende. Der
   risikoreiche Ruf-/Teilabschlusskern ist jetzt belegt; die Ergänzung ist
   weniger wichtig als Wegener.
3. **Krause-Ergänzung:** rein friedlich mit Rex und anderem Rufprofil. Der
   aggressive/no-Rex-Kernpfad ist bereits vollständig live belegt; diese
   Ergänzung hat weniger Priorität als Brauer und Wegener.
4. Danach politische Fälle nur gezielt auf Gewahrsam, alternatives Ende oder
   Rufwirkung rotieren, nicht erneut als identische Standardläufe.

Bei jeder Codeänderung gilt weiter: Version erhöhen, 70/70 Tests, Commit,
Push, FTPS-Redeployment, SHA-256-Verifikation und sichtbarer Produktionscheck.
