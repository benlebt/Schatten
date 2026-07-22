# SCHATTEN – Übergabe an einen neuen Codex-Chat

- **Stand:** 22.07.2026
- **Spielversion:** `v7.12.1304 +Clubschluss`
- **Branch:** `main`
- **Letzter Code-Commit:** `7fcb3b2535c79aafbf62a9ef543284c1dc8c3dc7` (`Fix Brandt club closing continuity`)
- **Remote:** `https://github.com/benlebt/Schatten.git`
- **Tests:** 34/34 grün

Dieses Dokument ist als vollständiger Einstieg für einen neuen Codex-Chat gedacht, der den bisherigen Chatverlauf nicht kennt. Es beschreibt den aktuellen lokalen Windows-Workflow. Die alte `UEBERGABE_v670.md` enthält historische Container-/Claude-Anweisungen und ist **nicht** mehr der gültige Arbeitsablauf.

---

## 1. Prompt für den neuen Chat

Dem neuen Chat diese Datei geben und etwa Folgendes schreiben:

> Lies `UEBERGABE_v1304.md` vollständig und arbeite danach direkt im Projekt `C:\Users\benle\Documents\Schatten` weiter. Prüfe zuerst Git-Stand, Version und Tests. Antworte auf Deutsch. Behandle neue Screenshots, Run-Exporte und Lektorate als konkrete Entwicklungsaufträge, verifiziere jeden Befund am aktuellen Code und am echten Run und behebe die Ursache mit Regressionstest. Jede fertige Entwicklungsänderung committen und nach `main` pushen. Keinen Vercel-/Deployment-Check ausführen, solange ich das nicht ausdrücklich verlange. Die beiden `.git-broken-*`-Ordner weder verändern noch committen.

Danach kann Benjamin direkt den nächsten Run, Screenshot oder Wunsch schicken.

---

## 2. Sofortprüfung zu Beginn

Im Workspace ausführen:

```powershell
Set-Location 'C:\Users\benle\Documents\Schatten'
git status --short
git branch -vv
git log -5 --oneline
rg -n "window\.SCHATTEN_VERSION" index.html
```

Erwarteter Stand:

- `main` enthält `7fcb3b2` als letzten Spielcode-Commit und entspricht `origin/main`; darüber können reine Übergabe-/Dokumentationscommits liegen.
- `window.SCHATTEN_VERSION = 'v7.12.1304 +Clubschluss';`
- Der normale Code-Arbeitsbaum ist sauber.
- Es erscheinen nur diese zwei alten unversionierten Sicherungsverzeichnisse:
  - `.git-broken-20260708-2049/`
  - `.git-broken-20260708-2050/`

Diese Verzeichnisse gehören **nicht** zur Entwicklung: nicht öffnen, nicht löschen, nicht verschieben, nicht stagen und nicht in Commits aufnehmen.

Wenn Git/Version vom erwarteten Stand abweichen, ist der tatsächlich ausgecheckte Code maßgeblich. Erst den neuen Stand mit `git status`, `git log` und `rg` verstehen; niemals blind auf v1304 zurücksetzen.

---

## 3. Benjamins feste Arbeitsregeln

1. **Durchgehend Deutsch antworten.** Benjamin liefert häufig kurze Texte, Screenshots und komplette Debug-/Run-Exporte.
2. **Immer die Ursache beheben.** Kein rein kosmetisches Überdecken eines Zustandsfehlers.
3. **Echte Run-Daten sind entscheidend.** Regex, Zustandslogik und Prosa-Guards gegen den tatsächlich angehängten Runtext prüfen, nicht nur gegen erfundene Beispiele.
4. **Lektorate zuerst verifizieren.** Fremde Lektorate können einen Altstand geprüft, bereits behobene Fehler gemeldet oder nicht existierende Funktionen genannt haben.
5. **Jede Änderung absichern.** Mindestens ein gezielter Regressionstest, danach die komplette Suite.
6. **Fertige Entwicklungsänderungen immer committen und pushen.** Das ist Benjamins ausdrückliche Daueranweisung.
7. **Kein Vercel-/Deployment-Check.** Nach dem Push nicht die Produktionsseite öffnen oder prüfen, außer Benjamin verlangt es ausdrücklich.
8. **Nur beabsichtigte Dateien stagen.** Fremde/unzusammenhängende Änderungen erhalten. Vor `git add` immer `git diff --check`, `git diff --stat` und `git status --short` prüfen.
9. **Gameplay-Feel nicht ungefragt grundsätzlich umbauen.** Technische Bugs, Sackgassen, widersprüchliche Weltzustände und wirkungslose Buttons direkt reparieren; bei echten Designentscheidungen Benjamins Richtung einholen.
10. **Fehler offen benennen.** Wenn ein früherer Fix falsch war oder ein Run einen echten Deadlock zeigt, klar sagen – nicht als Bedienfehler des Spielers darstellen.

---

## 4. Produkt und technische Form

`Schatten` ist ein KI-gestütztes Film-Noir-Detektivspiel über Karl Mauer im Berlin des Jahres 1953.

Technische Eckdaten:

- Hauptanwendung: `index.html`
  - etwa 64.000 Zeilen
  - etwa 4,66 MB
  - Vanilla HTML/CSS/JavaScript als große Ein-Datei-Anwendung
- Serverseitige Vercel-Funktionen:
  - `api/gemini.js` – primärer Proxy, interne Version aktuell `v1.6`
  - `api/mistral.js` – alternativer Proxy
  - `api/groq.js` – alternativer Proxy/Fallback
  - `api/deploy.js` – Deploy-Endpunkt, derzeit durch UI-/Server-Kill-Switch gesperrt
- Standardmodell: `gemini-3.1-flash-lite`
- Bilder: `assets/scenes/<fall>/...`
- Musik: `music1.mp3` bis `music12.mp3`
- Persistenz: Browser-`localStorage`
  - Spielstand: `schatten-savegame-v1`
  - fallübergreifende Karriere: `schatten-karl-akte`
- Die UI besitzt Debug-/Exportfunktionen. Run-Exporte enthalten Szenen, Enginezustand, Diagnosen, Assertion Report und eine API-Kostenschätzung.

Die KI schreibt Szene und Ton. Die Engine besitzt die Wahrheit über Ort, Zeit, Anwesende, NPC-Zustände, Items, Indizien, Fallfortschritt, Gefangenschaft, Verletzung, Party und Abschlussfreigabe.

---

## 5. Die 14 definierten Fälle

Die Fälle stehen in `INTRO_VARIANTS` ab ungefähr Zeile 5950 in `index.html`.

| Auftrag/Fall | Typ | Kernziel |
|---|---|---|
| Helga Wegener / Konstantin Wegener | `vermisst` | Konstantin physisch finden, befreien und sicher übergeben |
| Anton Brandt / Tod Erich Brandts | `wahrheit` | Kurt Lange anhand der definierten Beweiskette überführen |
| Margarete Stein | `politisch` | Schmuggelroute belegen, Margarete und Akten sichern |
| Heinrich Lindner / Hollenbeck | `vermisst` | Bankiersverschwinden aufklären |
| Edith Kessler / Robert Kessler | `beschatten` | Roberts Mittwoch beobachten und wahrheitsgemäß berichten |
| Ludwig Strauss | `wahrheit` | alten Selbstmordfall als Eigenauftrag aufklären |
| Sigrid Vogt / Manfred Vogt | `vermisst` | Journalisten finden/Schicksal klären |
| Theodor Krause | `diebstahl` | Diebesgut finden, sichern und korrekt zurückgeben |
| Renate Schiffer / Detlef | `vermisst` | entführten Bruder retten |
| Albrecht Goerke / Mathilde | `wahrheit` | Tod und mögliche Unschuld/Schuld wahrheitsgemäß klären |
| Hilde Brauer / Erwin | `vermisst` | Verbleib des Schwagers zweifelsfrei belegen |
| Bruno Wessel / Werner | `vermisst` | Schicksal nach dem 17. Juni klären, keine Bericht-Phantomfunde |
| Auguste Lindenbaum / Albert | `wahrheit` | Tod des HO-Funktionärs aufklären |
| Wilhelmine Achterberg / Reinhold | `mord` | Digitalis-Mord und Täter Egon Vossberg beweisen |

Jeder Fall hat festen Cast, Orte, Indizien und historische Anker. Neue generische „KI-Wahrheiten“ dürfen die definierten Fallwahrheiten nicht ersetzen.

---

## 6. Unverhandelbare Spielarchitektur

### Engine-Wahrheit vor KI-Prosa

- Ein NPC ist nur dort, wo Enginezustand und Ortslogik ihn führen.
- Eine Person darf nicht durch bloße Erwähnung in Telefonat, Foto, Bericht, Akte oder Erinnerung als anwesend/gefunden gelten.
- „Berichtet“ ist nicht „präsent“.
- Ein Gegenstand gilt nur dann als aufgenommen, verbraucht, übergeben oder gesichert, wenn die Engineaktion das vollzieht.
- Die KI darf keinen Ort, Fund, Täter, Abschluss oder Weltzustand erfinden, der dem Enginezustand widerspricht.

### Nur definierte Indizien

- Kernfortschritt kommt aus den im Setup definierten Indizien.
- `quelle`, `actions`, `abStage`, `requiresEvidenceAll`, `requiresEvidenceAny` und Orts-/NPC-Anforderungen sind echte Gates.
- Reise, friedliches Gegenstandsangebot oder bloße Prosa dürfen kein Kernindiz nebenbei vergeben.
- Besonders wichtig: `classifyEvidenceAction()` und `getEvidenceActionKey()`.

### Physische Zielpersonen

- Bei entsprechend konfigurierten Vermisstenfällen reicht ein Gerücht oder ein Name im Text nicht.
- `targetResolution.mode = 'physical'` kann Fund, Befreiung, Transport und Übergabe verlangen.
- Wegener ist das Referenzsystem: physisch finden → Bewacher überwinden → befreien → zu Helga oder Polizei bringen; bei Polizei Helga informieren.
- Zentrale Auswertung: `_physischesFallzielStatus()`.

### NPC-Weltzustand und Showdowns

- Terminale Zustände wie `ko`, `gefesselt`, `geflohen`, `beruhigt` oder `bestochen` müssen Ort, UI, Reise und Abschluss konsistent beeinflussen.
- NPCs dürfen nach Ende einer Konfrontation nicht an jeden neuen Ort „kleben“.
- Friedliche Lösungen zählen als echte Showdown-Ausgänge, wenn sie den Gegner deterministisch neutralisieren.
- Alte Saves werden, wo eindeutig möglich, idempotent selbst geheilt.
- Relevante Funktionen: `_konfrontation*`, `_npcZustand*`, `_showdown*`.

### Party-Regel

- **Der Spieler entscheidet über Aufnahme und Entlassung von Begleitern.**
- Kein pauschales Auto-Entfernen und keine allgemeine Sperre für eine Figur, nur weil ein automatischer Nachziehpfad driftet.
- Roth und Lindner dürfen bewusst mitgenommen werden.
- Bei Party-Drift nur den nachgewiesenen Auto-/Schleichpfad reparieren.

### Bedienbarkeit

- Wenn ein Button klickbar ist, muss er eine verständliche, sichtbare Wirkung haben.
- Kein stilles Scheitern bei veraltetem DOM, verbrauchtem Ziel oder geänderten NPC-Zuständen.
- Ein festgefahrener Abschluss braucht einen konkreten Sperrgrund oder einen erreichbaren nächsten Faden.
- Interne Engine-/Promptanweisungen dürfen nicht in Spielerbuttons oder die sichtbare Erzählung lecken.

### Historische Genauigkeit

Berlin 1953 ist ein harter Rahmen. Besonders vermeiden:

- Berliner Mauer vor dem 13.08.1961
- „Karl-Marx-Allee“ statt Stalinallee im Jahr 1953
- KGB-Nennung vor 1954, wenn historisch MGB/MWD/MfS gemeint ist
- Trabant und andere spätere Fahrzeuge/Produkte
- Wortspiele zwischen Karls Nachnamen „Mauer“ und der noch nicht existierenden Berliner Mauer

Historische Behauptungen bei Unsicherheit recherchieren; technische Fragen dagegen zuerst lokal am Code beantworten.

---

## 7. Aktuelle Haupt-UI

Die neue Haupt-UI ist Standard. Wichtige Bereiche befinden sich im späten Teil von `index.html`:

- `_hauptui*` – Zielauswahl, Personen, Items, Aktionen, Fäden, Konfrontationen
- `_hauptuiExecute()` – Ausführung der gewählten Handlung
- `_hauptuiOffeneFaeden()` – nur aktuell erreichbare Ermittlungsfäden
- `_hauptuiKonfrontationItems()` – verfügbare, gruppierte Konfrontationsitems
- `_hauptuiKonfrontationAktion()` – deterministische Kampf-/Angebotsausgänge
- `renderOptions()` – Szenen-/Systembuttons und Haupt-UI-Anbindung
- `chooseOption()` – zentraler Szenenaktionspfad

Aktuelles Verhalten:

- Inventar ist standardmäßig eingeklappt, zeigt Itemanzahl und ausgewähltes Item.
- Nach Auswahl klappt es wieder ein, damit „Ausführen“ nicht weit nach unten rutscht.
- Gleichartige Gegenstände werden trotz älterer Typvarianten zu einem Button gruppiert (`×N`).
- Der Verbrauch entfernt nur das tatsächlich eingesetzte Exemplar.
- Waffen nutzen ein eigenes gold-graues Noir-SVG; das Wasserpistolen-Emoji darf nicht zurückkehren.
- Friedliche Angebote an Gegner (z. B. Zigaretten) sind echte Konfrontationsaktionen und keine Indizsuche.

---

## 8. Letzte Entwicklungsrunde v1295–v1304

### Stil und Übergänge

- Runweite Motivzählung bremst wiederholte Formulierungen wie „nagelt“, „Kopfsteinpflaster“, „Zigarillo“, „Bohnerwachs“ und ähnliche Phrasen.
- Szenenübergänge wurden variiert und Ortswechsel/Heimschlaf narrativ expliziter gemacht.
- Rita-Abweisung vor dem Schlafen muss den Heimweg und das Aufwachen am neuen Ort erzählen.
- Lektoratsbefund im Wegener-Run: Stilvarianz hielt deutlich. Weiter beobachten, aber aktuell kein akuter Fehler.

### Wegener

- Der Fall kann nicht mehr allein aufgrund einer erfundenen Abschlussprosa gelöst werden.
- Konstantin muss physisch gefunden, befreit und an einen sicheren Zielort gebracht werden.
- UI, Weltzustand, Bewacher, Übergabe und Klienteninformation besitzen Regressionstests.

### Behandlung

- Professionelle Behandlung wird im Export primär aus der echten Engineaktion ermittelt.
- Prosa ist nur Fallback; „Charité“ mit Umlaut und Marlenes konkrete Behandlung werden erkannt.
- Bloßer Aufenthalt in der Charité zählt nicht als Behandlung.

### Brandt-Endspiel

- Das definierte Geständnisindiz `lange_gestaendnis` setzt Kurt deterministisch als Verantwortlichen.
- Alte festgefahrene Saves mit bereits vorhandenem Geständnis werden repariert.
- Für die Konfrontation in der Roten Laterne existiert ein eigenes Bild:
  `assets/scenes/brandt/rote-laterne-kurt-konfrontation.png`.
- Ein friedliches Angebot kann Kurt auf `beruhigt` setzen und beendet den Showdown.
- Ein alter Save mit `Kurt Lange: beruhigt` wird beim Rendern synchronisiert; Kurt folgt nicht ins Büro oder in die Charité und blockiert den Abschluss nicht mehr.
- Veraltete Angriffsklicks geben sichtbares Feedback statt wirkungslos zu bleiben.
- v1304 macht die Rote Laterne zeitlich konsistent:
  - geöffnet nur nachmittags, abends und nachts
  - außerhalb der Öffnungszeit wird der Außenort benutzt
  - Lola und Kurt sind nicht pauschal immer anwesend
  - Kurt-Geständnis verlangt Schuldschein **und** fremde Walther sowie einen unabhängigen Tatbeleg
  - ein friedliches Angebot trägt `noEvidence` und darf deshalb kein Geständnis auslösen

### Konfrontationsinventar

- Gleichnamige Items aus alten Typdaten werden zusammengeführt.
- Ein Button pro Gegenstand, z. B. `West-Zigaretten ×2`.
- Nur der gewählte Button ist markiert.
- Nur ein Exemplar wird eingesetzt.

---

## 9. Aktuell offene Beobachtungen – keine bestätigten Akutbugs

Zum Übergabezeitpunkt gibt es keinen bekannten reproduzierten P0/P1-Deadlock. Diese Punkte bleiben als Beobachtung:

1. **Krause manueller Regressionslauf:** Ein echter kompletter Run nach den zahlreichen Gruppen-/Finale-/Ort-Fixes ist weiterhin wertvoll. Die automatischen Krause-Tests sind grün.
2. **Stilvarianz:** Der erste Wegener-Run nach v1295 war deutlich besser; bei neuen Runs weiter auf wiederkehrende Sinnesmotive und Standardsätze achten.
3. **API-Kosten:** Der Debug-Export wertet Requests, Input, Cachequote, Output und geschätzte Kosten aus. Der Zähler lebt im Arbeitsspeicher und beginnt nach einem Seiten-Reload neu; deshalb nicht als vollständige Runhistorie missverstehen.
4. **Produktionsstatus:** Wegen Benjamins Anweisung wurde nach den letzten Pushes kein Vercel-Check durchgeführt. Das ist kein gemeldeter Fehler, sondern bewusst unüberprüfter Deploymentstatus.

Neue Benutzerbefunde haben Vorrang. Nicht prophylaktisch an diesen Punkten umbauen, wenn kein echter Run einen Fehler zeigt.

---

## 10. Tests

Es gibt kein `package.json`; die Tests sind eigenständige Node-Skripte in `tests/`.

Komplette Suite unter PowerShell:

```powershell
$tests = Get-ChildItem -LiteralPath tests -Filter *.test.js | Sort-Object Name
$failed = @()
foreach ($test in $tests) {
  & node $test.FullName
  if ($LASTEXITCODE -ne 0) { $failed += $test.Name }
}
Write-Output ('TEST_COUNT=' + $tests.Count)
if ($failed.Count) {
  Write-Output ('FAILED=' + ($failed -join ','))
  exit 1
}
Write-Output 'ALL_TESTS_PASSED'
```

Aktueller Sollwert: `TEST_COUNT=34` und `ALL_TESTS_PASSED`.

Wichtige Testgruppen:

- `system-audit-regression.test.js` – Syntax aller Inline-Skripte und Systeminvarianten
- `case-structure-audit.test.js` / `case-playability-audit.test.js` – 14 Fallsetups und Erreichbarkeit
- `hauptui-smoke.test.js` – Haupt-UI/Endzustände
- `konfrontation-ui.test.js` – Konfrontationsdarstellung und Interaktion
- `brandt-run-regression.test.js` – Brandt-Endspiel, Kurt, Save-Heilung
- `anker-closing-time.test.js` – Öffnungszeit-/Außenortlogik
- `wegener-continuity.test.js`, `wegener-world-state-ui.test.js`, `physical-target-endgame.test.js` – Rettungsziel und Übergabe
- `krause-*` – Gruppenfinale, Weltfortschritt und Feedback
- `treatment-audit.test.js` – professionelle Behandlung
- `style-variation-regression.test.js` – Stilbremse
- `world-truth-hard-guard.test.js` – Engine-Wahrheit gegen Prosa-Drift
- `weapon-icon-regression.test.js` – kein Wasserpistolen-Emoji

Bei einem Bug zuerst einen kleinen Test mit dem **Originaltext und Originalzustand des Runs** ergänzen. Danach die gesamte Suite laufen lassen.

---

## 11. Versions- und Releaseablauf

### Vor der Änderung

```powershell
git status --short
git log -3 --oneline
rg -n "window\.SCHATTEN_VERSION" index.html
```

### Während der Änderung

- Mit `rg` die konkreten Funktionen und Tests finden.
- Bestehende Architektur erweitern, nicht parallele Wahrheitslogik erfinden.
- `apply_patch` für gezielte Änderungen benutzen.
- Bei angehängten Run-Exporten die exakten Szenen, Marker und Zustände zitierbar lokalisieren.
- Version nur erhöhen, wenn eine auslieferbare Änderung fertig ist.

Die sichtbare Version kommt zentral aus:

```js
window.SCHATTEN_VERSION = 'v7.12.1304 +Clubschluss';
```

Beim Bump mit `rg` nach der alten Versionszeichenfolge suchen: Mehrere Regressionstests prüfen die exakte aktuelle Version und müssen gemeinsam aktualisiert werden. Keine veraltete zweite UI-Version einführen.

Wenn `api/gemini.js` geändert wird, zusätzlich dessen unabhängige `GEMINI_JS_VERSION` erhöhen. Diese Version wird im Debug-Export zur Rückverfolgung des live verwendeten Proxycodes ausgegeben.

### Prüfung

```powershell
git diff --check
git diff --stat
git status --short
# gezielte Tests
# danach komplette 34er-Suite
```

### Commit und Push

Nur beabsichtigte Dateien stagen:

```powershell
git add index.html tests\PASSENDER-TEST.test.js
# gegebenenfalls bewusst weitere geänderte Assets/API-Dateien hinzufügen
git status --short
git diff --cached --stat
git commit -m "Kurze konkrete Beschreibung"
git push origin main
```

Danach **keinen** Browser-/curl-/Vercel-Check ausführen. Im Abschluss nennen:

- Ursache
- konkrete Änderung
- Testzahl
- neue Version
- Commit-ID
- Push erfolgreich
- ausdrücklich: kein Vercel-Check

---

## 12. Run- und Lektoratsanalyse

Bei einem neuen Run-Export:

1. Version im Export mit `window.SCHATTEN_VERSION` vergleichen.
2. Benutzerbeobachtung an konkreten Szenen nachvollziehen.
3. Enginezustand und sichtbare Prosa getrennt lesen.
4. Relevante Marker prüfen:
   - Fallfortschritt/Stage
   - definierte Indizien
   - NPC-Zustand und Ort
   - Party-Aufnahme/-Entfernung
   - Konfrontationsstart/-ende
   - physisches Ziel/Fund/Befreiung/Übergabe
   - professionelle Behandlung
   - Assertion Report
   - API-Kosten
5. Prüfen, ob der Spieler eine klickbare, aber wirkungslose Aktion sah.
6. Ursache im aktuellen Code lokalisieren.
7. Originalszene als Regressionstest übernehmen.
8. Fix so gestalten, dass bestehende eindeutige Saves möglichst idempotent repariert werden, ohne neue Wahrheit zu erfinden.

Wichtig: Ein guter Endtext macht einen mechanisch unvollständigen Fall nicht korrekt. Umgekehrt darf ein korrekter Enginezustand nicht wegen missverständlicher Diagnose als Fehler gelten. Beide Ebenen getrennt prüfen.

---

## 13. Wichtige Dateien und ihre Zuverlässigkeit

- `index.html` – aktuelle, autoritative Spielimplementierung
- `tests/` – aktuelle, autoritative Regressionserwartungen
- `api/` – aktuelle Serverfunktionen
- `assets/scenes/` – aktuelle Szenenbilder
- `SCHATTEN_PROJEKT.md` – sehr große historische Projektchronik; enthält wertvolle Begründungen, aber der Kopf ist veraltet und die jüngsten Einträge reichen nur bis ungefähr v1298. Nie allein als aktuellen Stand behandeln.
- `UEBERGABE_v670.md` – historische Übergabe; Pfade, Containerworkflow, offene Bugs und Version sind veraltet.
- `KESSLER_SCENE_BIBLE.md` – verbindlicher Kontext für Kessler-Bilder und -Szenen
- `KONZEPT_BAUKASTEN_FIRST.md`, `KONZEPT_WELTWAHRHEIT.md`, `KONZEPT_CUSTODY_ENGINE.md`, `KONZEPT_SICHERUNG_ENGINE.md`, `KONZEPT_STAERKEN_HAERTE.md` – Architekturkontext, wenn der jeweilige Bereich betroffen ist
- `SCHATTEN_ARENA.md`, `SCHATTEN_Kampfkonzept_v3.md` – Kampf-/Arena-Kontext; gegen den tatsächlich implementierten Code abgleichen

Bei Widerspruch gilt: aktueller Code + aktuelle Tests + aktueller echter Run vor älterer Dokumentation.

---

## 14. Schnelle Suchkarte

```powershell
# Version
rg -n "SCHATTEN_VERSION" index.html tests

# Fallsetups
rg -n "const INTRO_VARIANTS|caseType:|targetResolution|abschlussEffekt" index.html

# Indizien
rg -n "classifyEvidenceAction|getEvidenceActionKey|markiereIndiz|requiresEvidence" index.html

# Physische Ziele
rg -n "_physischesFallzielStatus|targetResolution|deliveryRequired|rescueRequired" index.html tests

# Konfrontation, NPC-Zustand, Showdown
rg -n "function _konfrontation|function _npcZustand|function _showdown" index.html

# Haupt-UI
rg -n "function _hauptui|renderOptions|chooseOption" index.html

# Abschluss
rg -n "showCaseSolved|Fall abschließen|_abschluss|caseReadyToResolve" index.html tests

# Save/Restore
rg -n "SCHATTEN_SAVE_KEY|saveGameState|restoreGameState|schatten-savegame" index.html tests

# Debug-Export/Kosten
rg -n "buildTranscriptText|exportTranscript|API-KOSTEN DIESER RUN|buildAssertionReport" index.html

# Historische/problematische Begriffe
rg -n "Berliner Mauer|Karl-Marx-Allee|KGB|Trabant" index.html api tests
```

---

## 15. Übergabezustand in einem Satz

`main` steht sauber auf **v7.12.1304**, alle **34 Tests** sind grün, die letzten Brandt-/Kurt-Sackgassen sowie Haupt-UI-Inventarprobleme sind behoben, und der nächste Chat soll auf den nächsten echten Benutzer-Run oder Entwicklungswunsch reagieren, ihn am aktuellen Code verifizieren, regressionsgetestet beheben, committen und nach `main` pushen – ohne Vercel-Check.
