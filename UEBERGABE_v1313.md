# SCHATTEN – Übergabe an einen neuen Codex-Chat

- Stand: 22.07.2026
- Spielversion: `v7.12.1315 +Abschluss-Sperrstunde`
- Branch: `main`
- Aktueller Commit: nach dem Klonen mit `git rev-parse --short HEAD` ermitteln
- Remote: mit `git remote get-url origin` ermitteln
- Tests: 42/42 grün

Dieses Dokument ist trotz des versionsbezogenen Dateinamens bis v1315 aktualisiert und der aktuelle Einstieg für einen neuen Codex-Chat ohne Kenntnis des bisherigen Verlaufs. Ältere Übergaben sind nur historische Referenz. Bei Widersprüchen gelten der ausgecheckte Code, die aktuellen Tests und ein aktueller echter Run.

## 1. Startprompt für den neuen Chat

> Lies `README.md`, `SECURITY.md` und `UEBERGABE_v1313.md` vollständig und arbeite danach direkt im Stamm des ausgecheckten Repositories weiter. Prüfe zuerst Git-Stand, Version und die komplette Testsuite. Antworte auf Deutsch. Behandle Screenshots, Run-Exporte und Lektorate als konkrete Entwicklungsaufträge: verifiziere jeden Befund am aktuellen Code und am echten Run, repariere die Ursache und ergänze einen Regressionstest. Fertige Entwicklungsänderungen committen und nach `main` pushen. Keinen Vercel-/Deployment-Check ausführen, solange ich ihn nicht ausdrücklich verlange. Lokale Recovery-, Env-, Agenten- und Run-Dateien niemals committen.

Danach kann Projektleitung direkt den nächsten Run, Screenshot oder Entwicklungswunsch schicken.

## 2. Sofortprüfung

```powershell
# Im Stamm des bereits ausgecheckten Repositories ausführen.
git status --short
git branch -vv
git log -5 --oneline
rg -n "window\.SCHATTEN_VERSION" index.html

$tests = Get-ChildItem -LiteralPath tests -Filter *.test.js | Sort-Object Name
foreach ($test in $tests) {
  & node $test.FullName
  if ($LASTEXITCODE -ne 0) { throw "Test fehlgeschlagen: $($test.Name)" }
}
Write-Output ('TEST_COUNT=' + $tests.Count)
```

Erwartet:

- `main` entspricht `origin/main`.
- `window.SCHATTEN_VERSION = 'v7.12.1315 +Abschluss-Sperrstunde';`
- 42 Testskripte laufen grün.
- Der normale Arbeitsbaum ist sauber; sichtbar bleiben nur:
  - `.git-broken-20260708-2049/`
  - `.git-broken-20260708-2050/`

Diese beiden alten, unversionierten Sicherungsverzeichnisse niemals öffnen, löschen, verschieben, stagen oder committen. Falls Git oder Version weiter sind als hier dokumentiert, niemals zurücksetzen, sondern zuerst den neuen Stand verstehen.

## 3. Arbeitsregeln von Projektleitung

1. Durchgehend Deutsch antworten.
2. Echte Ursachen beheben, keine rein kosmetischen Überdeckungen.
3. Run-Exporte und Screenshots am konkreten Szenen- und Enginezustand prüfen.
4. Fremde Lektorate zuerst gegen den aktuellen Stand verifizieren; sie können bereits behobene Altbefunde enthalten.
5. Für jeden Codefix einen gezielten Regressionstest ergänzen und danach alle Tests ausführen.
6. Fertige Entwicklungsänderungen committen und nach `main` pushen.
7. Danach keinen Browser-, curl-, Vercel- oder Produktionscheck machen, sofern Projektleitung ihn nicht ausdrücklich anfordert.
8. Nur beabsichtigte Dateien stagen. Vorher `git diff --check`, `git diff --stat` und `git status --short` prüfen.
9. Unzusammenhängende Benutzeränderungen erhalten.
10. Wirkungslose klickbare Buttons, Deadlocks und widersprüchliche Weltzustände sind echte Bugs, keine Bedienfehler.
11. Gameplay-Grundentscheidungen nicht ungefragt umbauen; technische Sackgassen und Inkonsistenzen direkt reparieren.

## 4. Produkt und technische Form

`Schatten` ist ein KI-gestütztes Film-Noir-Detektivspiel über Karl Mauer im Berlin des Jahres 1953.

- Autoritative Hauptanwendung: `index.html`, eine große Vanilla-HTML/CSS/JavaScript-Datei.
- Serverfunktionen: `api/gemini.js`, `api/mistral.js`, `api/groq.js`, `api/deploy.js`.
- Standardmodell: `gemini-3.1-flash-lite`.
- Szenenbilder: `assets/scenes/<fall>/...`.
- Musik: `music1.mp3` bis `music12.mp3`.
- Spielstand: Browser-`localStorage`, Schlüssel `schatten-savegame-v1`.
- Fallübergreifende Karriere: `schatten-karl-akte`.
- Es gibt kein `package.json`; Tests sind eigenständige Node-Skripte unter `tests/`.

Die KI schreibt Szene und Ton. Die Engine besitzt die Wahrheit über Ort, Zeit, Anwesende, NPC-Zustände, Items, Indizien, Fallfortschritt, Gefangenschaft, Verletzung, Party und Abschlussfreigabe.

## 5. Unverhandelbare Architektur

### Engine-Wahrheit vor Prosa

- Ein NPC ist nur dort, wo Enginezustand und Ortslogik ihn führen.
- Erwähnungen in Bericht, Erinnerung, Akte, Bild oder Telefonat machen eine Person nicht physisch anwesend.
- Ein Gegenstand ist nur durch eine Engineaktion aufgenommen, verbraucht, übergeben oder gesichert.
- Abschlussprosa darf keinen mechanisch unvollständigen Fall lösen.
- `validateSceneWorldTruth()` und die zugehörigen Repair-Pfade schützen diese Grenzen.

### Nur definierte Indizien

- Kernfortschritt kommt aus den im Setup definierten Indizien.
- `quelle`, `actions`, `abStage`, `requiresEvidenceAll`, `requiresEvidenceAny`, Orts- und NPC-Bindung sind echte Gates.
- Reise, ein friedliches Angebot oder bloße Prosa dürfen kein Kernindiz nebenbei vergeben.
- Wichtige Funktionen: `classifyEvidenceAction()`, `getEvidenceActionKey()`, `_markiereIndizGefunden()` und `_indizBelegBedarf()`.

### Wahrheitsbeats und Fallabschluss

- Ein Pflichtbeat darf nicht aus Motiv-, Bewertungs- oder Rückblicksprache entstehen.
- Brandts Pflichtbeat `lange_verantwortlich` verlangt ein ausdrückliches Geständnis. Sein kombinatorischer Fallback verlangt alle drei Gruppen: Lange-Bezug, Geständnisakt und Tatbezug.
- Das Abschlussindiz `lange_gestaendnis` ist erst nach `schuldschein`, `fremde_walther` und `zeuge_walther` erreichbar.
- Ein Abschluss bei kritischer Verfassung ist gesperrt: `_abschlussVerfassungReicht()` verlangt Vf ≥ 3; `_resolveBestaetigt()` prüft das vor dem Modellaufruf.

### Physische Ziele, NPC-Zustand und Party

- Physisch konfigurierte Vermisstenfälle verlangen Fund, gegebenenfalls Befreiung, Transport und Übergabe; ein Gerücht reicht nicht.
- Terminale Zustände wie `ko`, `gefesselt`, `geflohen`, `beruhigt` und `bestochen` müssen Ort, UI und Abschluss konsistent beeinflussen.
- Friedliche Showdown-Lösungen sind gültig, wenn sie den Gegner deterministisch neutralisieren.
- Der Spieler entscheidet über Aufnahme und Entlassung von Begleitern. Keinen globalen Auto-Entfernungsfix einführen, nur einen belegten Driftpfad reparieren.

### Historischer Rahmen

Berlin 1953 ist hart gesetzt. Insbesondere vermeiden: Berliner Mauer vor 1961, Karl-Marx-Allee statt Stalinallee, KGB vor 1954, Trabant und andere spätere Produkte sowie Wortspiele zwischen Karls Nachnamen und der noch nicht existierenden Mauer.

## 6. Aktueller Stand der zuletzt gemeldeten Bugs

Die folgenden Befunde sind im aktuellen Code bereits repariert und regressionsgetestet:

1. **Brandt: Wahrheit vor Aufklärung** (`69290a0`)
   - Ein bloßer Reflexionssatz über Langes Motiv setzt den Pflichtbeat nicht mehr.
   - `requiresExplicitConfession: true` schützt `lange_verantwortlich`.
   - Der kombinatorische Fallback benötigt 3/3 Signale.
   - Die konkrete Walther-Zeugenaussage ist Pflichtbeleg vor dem Geständnis.
   - Test: `tests/brandt-run-regression.test.js`.

2. **Verletzung und Abschluss** (`94fddc9` plus spätere Reisehärtung)
   - Bei Vf ≤ 2 wird `AUFLOESEN` vor dem Modellaufruf gestoppt.
   - Nach längerem kritischem Zustand blockiert das Gate normale Reisen und Ermittlungen, lässt aber die Fahrt zu Charité oder Doc Wagner zu.
   - Professionelle Behandlung wird aus der echten Engineaktion ermittelt, nicht aus bloßer Ortsprosa.
   - Tests: `tests/romance-injury-resolution.test.js`, `tests/kessler-injury-travel.test.js`, `tests/treatment-audit.test.js`.

3. **Romance-Zähler** (`94fddc9`)
   - Abwesenheit kühlt pro Szene genau einmal ab; `2 → 1 → 0` in einer einzigen Szene ist verhindert.
   - Test: `tests/romance-injury-resolution.test.js`.

4. **Brave auf dem iPhone: Settings und Startscreen** (`536d315`, `2050334`)
   - Debug-Modus und „Neue Ermittlung“ reagieren über robuste iOS-Pointer-/Touch-Bindung.
   - „Fall auswählen“ verwendet denselben Schutz.
   - Tests: `tests/settings-ios-actions.test.js`, `tests/settings-debug-controls.test.js`, `tests/startscreen-ios-actions.test.js`.

5. **Kessler: falsches Konfrontationsbild und kaputte Behandlungsreise** (`f86def5`, `abfe223`)
   - Robert Kesslers Konfrontation besitzt ein eigenes Szenenbild statt des Hauptmanns.
   - Die erforderliche Behandlungsreise führt wirklich zu Doc Wagner/Charité und bleibt vom Verletzungsgate ausgenommen.
   - Tests: `tests/bueroschrank-kessler-visual.test.js`, `tests/kessler-injury-travel.test.js`.

6. **Offener Faden öffnet Karte ohne Vorauswahl** (`f6e0f83`)
   - Ein ortsgebundener Faden öffnet die Karte mit bereits ausgewähltem Ziel und sichtbarer Reisebestätigung.
   - Test: `tests/open-thread-map-preselection.test.js`.

7. **iOS-Audio nach Hintergrund/Vordergrund** (`2e4a036`)
   - Musik und Soundeffekte werden nach `visibilitychange`, `pageshow` und `focus` wiederhergestellt.
   - Test: `tests/ios-audio-foreground-recovery.test.js`.

8. **Kessler-Abschluss: Doppelauflösung und Ort-Prosa-Bruch** (`d693baa`)
   - Ein bereits bezahlter Schatten-Cliffhanger wird nicht erneut als offener Cliffhanger erkannt.
   - Der Abschluss-Prompt verbietet die Wiederholung der vorherigen Szene und die doppelte Schatten-Auflösung.
   - Rückblick auf einen abwesenden Verdächtigen ist erlaubt; physisches Hereinteleportieren bleibt blockiert.
   - `Karl Mauers Wohnung`, Büro und Hinterzimmer werden als derselbe reale Heimatort behandelt.
   - Tetzlaffs Schreibtischfund bleibt korrekt ein Umgebungsfund und wird nicht wegen anwesender Person als Personeninteraktion umklassifiziert.
   - Test: `tests/kessler-finale-continuity.test.js`.

9. **Repository-Vollständigkeit und Sicherheit** (v1314)
   - `README.md` ist der öffentliche Einstieg für neue Chats.
   - `.gitignore` hält Recovery-, Env-, Hosting-, Agenten-, Run- und Logdateien aus Git heraus.
   - `.env.example` nennt ausschließlich erforderliche Variablennamen, ohne Werte.
   - `SECURITY.md` dokumentiert Sicherheitsgrenzen und den Umgang mit Zugangsdaten.
   - Der frühere Frontend-Debug-Passwortmechanismus wurde entfernt; `?debug=on` ist nur ein transparenter lokaler UI-Schalter und keine Authentifizierung.
   - Das Deploy-Ziel muss aus `GITHUB_REPO` in der Hosting-Umgebung kommen und ist nicht mehr im Code fest verdrahtet.
   - Persönliche Rechnerpfade und Projektleitungsnamen wurden aus dem aktuellen Quellstand neutralisiert.
   - `tests/repository-hygiene.test.js` verhindert die Rückkehr starker Secret-Muster und persönlicher Pfade.

10. **Abschlussbericht gegen Sperrstunden-Race gehärtet** (v1315)
   - Der echte Kessler-Run 23:08 auf v1314 zeigte einen neuen Engine-Konflikt: `AUFLOESEN` bei der anwesenden Edith wechselte gleichzeitig von Abend zu Nacht; die allgemeine Sperrstunde versetzte Karl vor der finalen Anfrage aus ihrer Wohnung ins Büro.
   - Eine bereits laufende Abschlussübergabe bleibt nun für genau diesen Spielzug am bewusst gewählten Ort. Normale Sperrstunden bleiben unverändert aktiv.
   - Derselbe Run bestätigt zugleich, dass die alte Café-Wien-Doppelerzählung nicht wieder auftrat und `briefchen_ilse` korrekt als Umgebungs-Kernindiz gebucht wurde.
   - Test: `tests/anker-closing-time.test.js`.

Diese Punkte nicht erneut umbauen, nur weil ein Lektorat einen älteren Stand beschreibt. Erst prüfen, ob ein neuer Run auf dem aktuellen Versionsstand den Fehler weiterhin reproduziert.

## 7. Tatsächlich offene Arbeit vor der Alexander-Demo

### Priorität A: manuelle Referenzläufe

1. **Krause komplett neu spielen.** Die automatischen Krause-Tests sind grün, aber seit den neuesten Gruppen-, Finale- und Ortsfixes fehlt ein echter vollständiger Gegenlauf.
2. **Kessler-Abschluss auf v1315 kurz gegenprüfen.** Der Run 23:08 war mit 0 % Gewalt und Ruf „behutsam/ermittelnd“ bereits der geeignete sanfte Referenzlauf. Nur der nun reparierte Abend→Nacht-Sperrstundenkonflikt braucht noch einen echten Abschluss-Retest.
3. **Brave/iPhone real nachtesten.** Settings, Fallauswahl, Behandlungsreise sowie Musik und Soundeffekte nach Hintergrund/Vordergrund prüfen. Die Tests simulieren die Browserereignisse, ersetzen aber keinen echten iOS-Lauf.

### Priorität B: echter Blind-Test

Vor Alexander sollte mindestens eine Person ohne Projekt- und Lösungswissen spielen. Beobachten, ohne früh zu erklären:

- Findet sie einen Fall und startet ihn zuverlässig?
- Versteht sie Fäden, Karte, Vorauswahl und Reisebestätigung?
- Erkennt sie, warum ein Indiz oder Abschluss noch gesperrt ist?
- Bleibt sie bei Verletzung handlungsfähig und findet den Heilweg?
- Wirkt der Showdown kausal oder dramaturgisch rückwärts?
- Versteht sie, wie Beweise gesichert und Fälle abgeschlossen werden?

Reibung mit Szene, sichtbarem UI-Zustand und Spielerzitat notieren. Nicht jede Unsicherheit sofort als Codebug behandeln; wiederkehrende Sackgassen dagegen priorisieren.

### Beobachtung, kein bestätigter aktueller Bug

- Verletzungs- und Behandlungsstatus in neuen Runs weiter vergleichen: Engineaktion, Summary und Assertion Report müssen übereinstimmen.
- Romance-Abkühlung bei längeren Runs beobachten.
- Finale auf wiederholte Auflösungen und ignorierte Ortsstopps prüfen.
- Produktionsstatus ist bewusst ungeprüft, weil nach Pushes kein Vercel-Check gewünscht ist.

## 8. Die 14 Fälle

| Fall/Auftraggeber | Typ | Kernziel |
|---|---|---|
| Wegener | `vermisst` | Konstantin physisch finden, befreien und sicher übergeben |
| Brandt | `wahrheit` | Kurt Lange mit definierter Beweiskette überführen |
| Stein | `politisch` | Schmuggelroute belegen, Margarete und Akten sichern |
| Hollenbeck | `vermisst` | Bankiersverschwinden aufklären |
| Kessler | `beschatten` | Roberts Mittwoch beobachten und wahrheitsgemäß berichten |
| Strauss | `wahrheit` | alten Selbstmordfall aufklären |
| Vogt | `vermisst` | Journalisten finden und Schicksal klären |
| Krause | `diebstahl` | Etui finden, sichern und zurückgeben |
| Schiffer | `vermisst` | Detlef retten |
| Goerke | `wahrheit` | Mathildes Tod wahrheitsgemäß klären |
| Brauer | `vermisst` | Erwins Verbleib zweifelsfrei belegen |
| Wessel | `vermisst` | Werners Schicksal nach dem 17. Juni klären |
| Lindenbaum | `wahrheit` | Alberts Tod aufklären |
| Achterberg | `mord` | Digitalis-Mord und Egon Vossberg beweisen |

Die Setups stehen in `INTRO_VARIANTS` in `index.html`.

## 9. Relevante aktuelle Tests

- `brandt-run-regression.test.js`: Brandt-Beweiskette, Geständnisgate, Abschlusszustand.
- `romance-injury-resolution.test.js`: einmalige Romance-Abkühlung, kritisches Abschlussgate.
- `kessler-injury-travel.test.js`: erforderliche Heilreise.
- `kessler-finale-continuity.test.js`: Schattenauflösung, Ortsalias, Finale-Rückblick, Tetzlaff-Indizquelle.
- `ios-audio-foreground-recovery.test.js`: Audio-Wiederaufnahme auf iOS.
- `settings-ios-actions.test.js`, `startscreen-ios-actions.test.js`: Brave/iPhone-Klickpfade.
- `open-thread-map-preselection.test.js`: Faden → Karte → vorgewählter Ort.
- `krause-feedback-regression.test.js`, `krause-multienemy-flow.test.js`, `krause-world-progression.test.js`: Krause-Systempfade.
- `case-structure-audit.test.js`, `case-playability-audit.test.js`: Fallstruktur und Erreichbarkeit.
- `system-audit-regression.test.js`: Inline-JavaScript-Syntax und Systeminvarianten.
- `world-truth-hard-guard.test.js`: Engine-Wahrheit gegen Prosa-Drift.

Bei einem neuen Befund zuerst den Originaltext und Originalzustand als kleinen Regressionstest übernehmen, dann die komplette 42er-Suite ausführen.

## 10. Versions-, Commit- und Pushablauf

1. Vorher `git status --short`, `git log -3 --oneline` und aktuelle Version prüfen.
2. Mit `rg` die konkrete Logik und bestehende Tests finden.
3. Mit `apply_patch` gezielt ändern.
4. Version in `window.SCHATTEN_VERSION` nur für eine auslieferbare Änderung erhöhen.
5. Alle Tests mit exakter Versionsassertion gemeinsam aktualisieren; mit `rg` nach der alten Versionszeichenfolge suchen.
6. Falls `api/gemini.js` geändert wird, dessen unabhängige `GEMINI_JS_VERSION` ebenfalls erhöhen.
7. Prüfen:

```powershell
git diff --check
git diff --stat
git status --short
```

8. Nur beabsichtigte Dateien stagen, Commit erstellen und nach `origin main` pushen.
9. Im Abschluss Ursache, Fix, Testzahl, Version, Commit-ID und erfolgreichen Push nennen. Ausdrücklich erwähnen, dass kein Vercel-Check erfolgt ist.

## 11. Run- und Lektoratsanalyse

Bei einem neuen Export:

1. Exportversion mit dem aktuellen `window.SCHATTEN_VERSION` vergleichen.
2. Benutzerbeobachtung an den konkreten Szenen nachvollziehen.
3. Enginezustand und sichtbare Prosa getrennt lesen.
4. Fallstage, Indizien-IDs, Truthbeats, NPC-Zustand/-Ort, Party, Konfrontation, Behandlung, offene Fäden und Abschlussflags prüfen.
5. Assertion Report und Diagnosemarker nur als Hinweise behandeln; False Positives anhand der realen Szene verifizieren.
6. Bei wirkungslosen Buttons den Ereignispfad vom DOM-Handler bis zur Engineaktion verfolgen.
7. Ursache im aktuellen Code beheben, Originalfall regressionssichern, komplette Suite laufen lassen.
8. Alte Saves nur dann automatisch heilen, wenn die gespeicherte Wahrheit eindeutig ist.

Ein schöner Endtext macht keinen mechanisch unvollständigen Fall korrekt. Umgekehrt ist ein Diagnoseflag kein echter Fehler, wenn Enginezustand und sichtbare Geografie konsistent sind.

## 12. Wichtige Dateien

- `index.html`: autoritative Spielimplementierung.
- `tests/`: autoritative Regressionserwartungen.
- `api/`: Serverfunktionen.
- `assets/scenes/`: Szenenbilder.
- `KESSLER_SCENE_BIBLE.md`: Kessler-Bilder und Szenenrahmen.
- `KONZEPT_WELTWAHRHEIT.md`, `KONZEPT_INDIZIEN.md`, `KONZEPT_REISE_WEGWEISER.md`: Architekturkontext.
- `KONZEPT_CUSTODY_ENGINE.md`, `KONZEPT_SICHERUNG_ENGINE.md`, `KONZEPT_STAERKEN_HAERTE.md`: Spezialmechaniken.
- `SCHATTEN_ARENA.md`, `SCHATTEN_Kampfkonzept_v3.md`: Kampfkontext; immer gegen die Implementierung prüfen.
- `SCHATTEN_PROJEKT.md`: historische Chronik, nicht als alleinige aktuelle Wahrheit verwenden.
- `UEBERGABE_v1304.md`, `UEBERGABE_v670.md`: veraltete Übergaben.

## 13. Schnelle Suchkarte

```powershell
rg -n "SCHATTEN_VERSION" index.html tests
rg -n "truthBeats|requiresExplicitConfession|updateTruthBeats" index.html tests
rg -n "classifyEvidenceAction|getEvidenceActionKey|requiresEvidence" index.html tests
rg -n "_abschlussVerfassungReicht|_kritischeVerletzungBlockiert|professionelleBehandlung" index.html tests
rg -n "updateRomanticTension|romanticTension" index.html tests
rg -n "validateSceneWorldTruth|_worldTruth|ABSCHLUSS-KONTINUITÄT" index.html tests
rg -n "visibilitychange|pageshow|AudioContext|sound" index.html tests
rg -n "function _hauptui|renderOptions|chooseOption|reiseZuOrt" index.html tests
rg -n "SCHATTEN_SAVE_KEY|saveGameState|restoreGameState" index.html tests
```

## 14. Übergabezustand in einem Satz

`main` steht auf v7.12.1315 mit 42/42 grünen Tests; Brandt-Wahrheitsbeat, kritischer Abschluss, Romance-Abkühlung, Brave-iPhone-Aktionen, Kessler-Heilreise/-Bild, Faden-Kartenvorauswahl, iOS-Audio, Kessler-Abschlusskontinuität und das Abschluss-Sperrstunden-Race sind repariert. Vor der Alexander-Demo bleiben ein kompletter Krause-Gegenlauf, ein kurzer Kessler-Abschluss-Retest auf v1315, ein realer iPhone-Brave-Retest und vor allem ein Blind-Test mit einer unbedarften Person.
