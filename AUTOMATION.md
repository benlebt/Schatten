# Schatten – Automatisierung des Entwicklungszyklus

Dieses Dokument beschreibt, wie der Test-/Deploy-Zyklus für **Schatten** automatisiert
wird, und welche **Arbeitsprinzipien** dabei einzuhalten sind. Es ist für Claude Code
(oder einen anderen Agenten mit Repo-/Terminal-Zugriff) gedacht.

Benjamin ist **Projektleiter/Reviewer**: Er gibt die strategische Richtung und die
architektonischen Entscheidungen vor. Die mechanische Klick-Arbeit (committen, pushen,
deployen, Runs starten, Exporte einsammeln) soll automatisiert werden – NICHT die
Urteilsarbeit.

---

## Der Zyklus

```
1. Code ändern (index.html)        -> ein chirurgischer Fix pro Version
2. Syntax prüfen                    -> node --check (siehe unten)
3. Version bumpen                   -> zwei Stellen (siehe unten)
4. Commit + Push                    -> deutsche Commit-Message
5. Vercel deployt automatisch       -> kein Eingriff nötig
6. Bot-Runs headless starten        -> node run-tests.mjs
7. Exporte landen in ./test-runs/   -> automatisch
8. Auswertung (Lektorat)            -> Befunde gegen echten Code+Run verifizieren
```

Benjamins Wunsch-Ablauf: Er sagt z.B. *„setz das Lektorat um und teste"*, und Schritte
1–8 laufen, ohne dass er Dateien anfasst. **Aber:** Vor dem Push zeigt der Agent Benjamin
den Diff – die Codebasis darf nicht still driften.

---

## Setup (einmalig)

```bash
# Im Repo-Ordner:
npm install playwright
npx playwright install chromium
```

`run-tests.mjs` liegt im Repo-Root. Die zu testenden Runs stehen oben in der
`RUNS`-Konstante (Default: 3x Margarete natural). Anpassen nach Bedarf.

---

## Befehle

```bash
# Syntax-Check der index.html (größten <script>-Block extrahieren, dann node --check):
node -e "const fs=require('fs');const h=fs.readFileSync('index.html','utf8');const m=[...h.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]);const big=m.sort((a,b)=>b.length-a.length)[0];fs.writeFileSync('/tmp/extract.js',big);" && node --check /tmp/extract.js && echo "SYNTAX OK"

# Bot-Runs (Default: 3x, gegen Vercel):
node run-tests.mjs

# Mit Optionen:
node run-tests.mjs --base https://schatten-dusky.vercel.app --turns 80 --out ./test-runs
```

Die Exporte landen als `Bot_<label>_<strategy>_<version>_seed<n>_<datum>.txt` in `./test-runs/`.

---

## Version bumpen (zwei Stellen, exakt)

Bei JEDER Änderung. Format `v7.12.XXX`:

```bash
sed -i "s/Schatten v7.12.OLD/Schatten v7.12.NEW/g; s/SCHATTEN_VERSION = 'v7.12.OLD'/SCHATTEN_VERSION = 'v7.12.NEW'/g" index.html
```

Die zwei Stellen: `<div class="start-version">Schatten v7.12.XXX</div>` und
`window.SCHATTEN_VERSION = 'v7.12.XXX';`. Nach dem Bump verifizieren:

```bash
grep -n "v7.12.NEW" index.html | grep -iE "start-version|SCHATTEN_VERSION ="
```

---

## Commit-Konvention

Eine deutsche Zeile, knapp, beschreibt den Fix. Beispiele:

```
v7.12.486 feat(automation): Auto-Export-Hook (window.__botExport) für Headless-Runner
v7.12.485 fix(politik): Sicherungs-Beats nur aus Aktion, nie aus Prosa (Architektur-Schnitt)
```

---

## EISERNE PRINZIPIEN (nicht verhandelbar)

Diese Prinzipien haben sich über >480 Versionen bewährt. Sie gelten auch für den
automatisierten Zyklus:

1. **Jeden Lektorats-Claim gegen ECHTEN Code + ECHTEN Run-Text verifizieren, BEVOR
   gefixt wird.** Lektorate (auch von ChatGPT) prüfen oft Altstände oder Quelltext statt
   echter Runs. Per grep/Code-Lesung gegenchecken.
2. **Gegen echte Run-Sätze testen**, nicht gegen konstruierte Beispiele. Regex-Fixes
   immer mit einem kleinen node-Test gegen die realen Auslösersätze aus den `Bot_*.txt`
   verifizieren, bevor ausgeliefert wird.
3. **Spielgefühl/Romance/Narrativ/Gameplay-Gates brauchen Benjamins Freigabe.** Reine
   technische Stabilitätsfixes darf der Agent selbst entscheiden.
4. **Nicht stapeln**: max. 1–2 ungetestete Eingriffsbereiche pro Version. Bei einem
   Einzelbefund erst fragen, ob Ausreißer oder Muster. Weiche Lösung (Prompt-Hinweis)
   vor mechanischem Zwang (Hard-Cap).
5. **Diagnose immer einbauen**: Für jedes Backlog-Thema einen Log-Marker (`diag(...)`).
6. **Reiner Prompt-Hinweis reicht oft NICHT** – die KI ignoriert ihn. Bei Wahrheits-/
   Sicherheits-Themen braucht es einen harten Postprocess-Guard (Gürtel + Hosenträger).
7. **Ein Fix an nur EINER Tür ist unvollständig.** Abschluss-Pfade existieren mehrfach
   (klient_berichtet, AUFLOESEN-Direktpfad, zentrale istGelöst-Stelle, Resolve-Button).
   Gates müssen an ALLE.
8. **Umlaut-`\b`-Falle**: `\b` matcht NICHT vor/nach Umlauten (ä/ö/ü/ß sind keine
   ASCII-Wortzeichen). Bei Regex mit Umlaut-Initial-Wörtern (übergeb, über) das `\b`
   weglassen. Diese Falle ist mehrfach aufgetreten.
9. **Vor dem Push: Diff zeigen.** Benjamin reviewt. Keine stille Drift.

---

## Workflow für ein Lektorat (Beispiel)

```
1. Lektorat lesen, Befunde sammeln (P1/P2/P3).
2. Für JEDEN Befund: gegen echten Code (grep) + echten Run-Text (Bot_*.txt) verifizieren.
   Schon gefixt? Altstand? Wirklich reproduzierbar? -> nur echte, offene Befunde fixen.
3. Den WICHTIGSTEN Fix wählen (meist genau einen P1). Nicht alles auf einmal.
4. Fix bauen, mit Diagnose-Marker.
5. node-Test gegen die realen Auslösersätze (TRUE/FALSE wie erwartet?).
6. Syntax-Check.
7. Version bumpen.
8. Diff Benjamin zeigen -> Freigabe.
9. Commit + Push.
10. node run-tests.mjs -> 3 Runs.
11. Exporte in ./test-runs/ auswerten -> nächstes Lektorat.
```

---

## Bot-Modi (nur diese drei!)

`natural`, `aggressive`, `random`. Keine anderen (kein defensiv/erkunden/cautious/etc.).
Für Regressionstests ist `natural` der Standard (Bot wie ein neuer Spieler mit früher
Abschluss-Tendenz).

---

## Grenzen / Realismus

- Ein 80-Zuege-Run dauert je nach KI-Latenz mehrere Minuten. `run-tests.mjs` hat
  15 Min Timeout pro Run (anpassbar via `--timeout`).
- Die index.html ist ~35.000 Zeilen. Bei Claude Code zählt das Einlesen gegen das
  Nutzungs-Kontingent – gezielt arbeiten (nicht jedes Mal die ganze Datei neu laden,
  `view` mit Zeilenbereichen / grep nutzen).
- Der Fall wird vom Spiel gewählt; ein expliziter `&case=`-Parameter existiert (noch)
  nicht. Wenn gewünscht, kann er in index.html ergänzt werden, dann in `run-tests.mjs`
  die URL erweitern.
