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
Produktionslauf
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
Repository-HEAD vor diesem Dokumentationscommit: 282ca35
Produktiver Release: v7.12.1771 +SchifferRestoreTruth
Produktiver Code-Commit: 282ca35 fix: keep restored Schiffer finale case-bound
Vorheriger Dev10-Code-Commit: 871f0f7 fix: complete Schiffer live truth paths
Produktion: https://schatten.sfp.de/
Debug: https://schatten.sfp.de/?debug=on&v=1771&deploy=282ca35
Tests: 70/70 grün
Produktiver index.html-SHA-256:
2E8386BE039ED52D235FB7093832AF8B504DFD366B1C047CEF94C61B74C17FE5
```

Alle vier beim ersten Dev10-Deployment übertragenen Dateien wurden per
FTPS zurückgeladen und bytegenau gegen den Commitstand geprüft. Der
anschließende v1771-Upload von `index.html` wurde ebenfalls per SHA-256
verifiziert. Zugangsdaten stehen weder in Projektdateien noch in Git.

## 3. Vollständig sichtbare Produktionsläufe

### Kessler

Der in Dev9 begonnene Produktionsgegenlauf wurde sichtbar abgeschlossen.
Finalbericht und Abschlusskarte waren konsistent; die fallgebundenen
Kernaktionen, Geld-/Rufwirkung, Öffnungszeiten, Tageswechsel und das Finale
funktionierten.

### Schiffer — Übergabe an Renate

Ein vollständiger Produktionslauf führte über:

```text
Renates Auftrag
→ Detlefs Wohnung
→ Roter Stern
→ Rote Laterne
→ Kellerzugang
→ Kalle beruhigen
→ Detlef befreien
→ Detlef in den Opel bringen
→ persönliche Übergabe an Renate
→ Abschlussbericht und Endkarte
```

Die persönliche Übergabe funktionierte. Der Lauf deckte anschließend jedoch
noch zu allgemeine Abschlusszeilen und fehlende Zwischenbilder auf.

### Schiffer — Übergabe an die Volkspolizei

Der zweite vollständige Produktionslauf nahm denselben Ermittlungs- und
Rettungsweg, brachte Detlef danach aber zum Präsidium Keibelstraße. Die
Polizeiübergabe war mechanisch erreichbar und beendete den Fall. Dabei wurden
folgende echte Liveabweichungen sichtbar:

- Detlefs Wohnung erfand einmal eine zerschlagene Vitrine, einen fehlenden
  Flaschendeckel und Waffen.
- Die Rote Laterne erfand unnötige Requisiten.
- Nach Kalles friedlichem Abgang zeigte das Kellerbild Kalle weiter.
- Nach dem Transport zum Opel zeigte das Bild weiter den Fußweg aus dem Keller.
- Die Ankunft im Präsidium behauptete, Detlef halte sich bereits dort auf.
- Das Präsidiumbild zeigte Detlef bei der Übergabe nicht.
- Der Polizeibericht teleportierte Detlef auf Renates Sofa.
- Die Abschlusskarte sagte nur, die Spur sei geklärt.
- Beim ersten v1770-Restore hing Görkes ortsbasierte Reparatur fallfremd
  Krollwitz und zwei MfS-Beamte an Schiffers Bericht.
- Alte Setup-Snapshots erhielten die neuen Bildzustände nicht.

## 4. Dev10-Fixes

Release v1770:

- sechs driftanfällige Schiffer-Ankünfte erzwingen den vollständigen
  autorisierten Ankunftstext;
- der Wohnungsfund besitzt eine strenge Prosa-Pflicht gegen erfundene Waffen
  und den fehlenden Flaschendeckel;
- Klienten- und Polizeibericht sind getrennte, statusgebundene Wahrheiten;
- Berichtsfallback und Abschlusskarte nennen Befreiung und tatsächlichen
  Übergabeweg;
- drei neue sichtbare Zustandsmotive:
  - `keller-roter-stern-kalle-fort-v1770.webp`
  - `detlef-im-opel-v1770.webp`
  - `volkspolizei-detlef-handoff-v1770.webp`
- `transportedAtTarget` gewinnt vor dem allgemeinen Rettungsbild;
- `policeHandoff` gilt bei Ankunft mit Detlef im Opel und nach der Übergabe.

Release v1771:

- `repairGoerkeArrivalContinuity` ist nun ausdrücklich an den Fall Görke
  gebunden und kann keinen anderen Keibelstraßen-Fall mehr verändern;
- die Restore-Migration übernimmt die aktuelle statische
  `targetResolution` einschließlich Übergaben und Bildzuständen in alte
  Spielstände, ohne den separaten Rettungsfortschritt anzutasten.

Der sichtbare v1771-Gegenlauf auf dem zuvor problematischen gespeicherten
Polizeiende bestätigte:

- vollständiger statusrichtiger Polizeibericht;
- kein Krollwitz-/MfS-Fremdeinschub;
- Detlef sichtbar bei Karl und dem diensthabenden Volkspolizisten;
- Abschlusskarte: „Detlef Schiffer lebend befreit und der Polizei sicher
  übergeben“;
- Fallbackzeile an Renate nennt denselben tatsächlichen Ausgang;
- sichtbare Version v7.12.1771.

## 5. Tests

```text
Gezielter Schiffer-Lauf: grün
Görke-Gegenprobe: grün
Brauer-Restore-Gegenprobe: grün
Vollständige Suite: 70/70 grün
git diff --check: grün
```

Die Schiffer-Regression prüft nun zusätzlich:

- alle sechs verpflichtenden Ankunftsfallbacks;
- die strenge Wohnungsprosa;
- getrennte Klienten-/Polizeiberichte;
- alle drei neuen Bilddateien;
- Priorität des Opel-Bilds;
- Polizeibild vor und nach Übergabe;
- tatsächlichen Übergabetext der Abschlusskarte;
- Görke-Reparatur bleibt aus Schiffer heraus;
- aktuelle `targetResolution` wird in Altspielstände migriert.

## 6. Nächste Reihenfolge

1. Schiffer auf v1771 noch einmal vollständig über den Renate-Zweig spielen,
   um die neue konkrete Abschlusskarte und die neuen Keller-/Opel-Bilder auch
   in einem frischen, nicht restaurierten Lauf sichtbar zu bestätigen.
2. Danach die noch nicht frisch vollständig live geprüften Alternativmatrizen
   der hoch bewerteten Fälle rotieren: Rufprofil, Rex, Items, Romance,
   Gewahrsam und alternatives Ende jeweils nur dort, wo der Fall sie
   tatsächlich unterstützt.
3. Jeden neuen sichtbaren Befund erst gegen Enginezustand und aktuelle
   Falldefinition verifizieren; keine Bewertung allein wegen Testalter senken.

Bei jeder weiteren Codeänderung gilt der ausdrückliche Benutzerwunsch:
Version erhöhen, 70/70 Tests, Commit, Push, FTPS-Redeployment und sichtbarer
Produktionsgegenlauf.

