# Schatten – additiver verbindlicher Run-Lektoratsstandard

Stand: 23.07.2026. Diese Datei ergänzt die bereits in `SCHATTEN_PROJEKT.md`, `UEBERGABE_v1313.md`, den Konzeptdokumenten, Tests und bisherigen Lektoratsentscheidungen festgehaltenen Regeln. Die sechs Standing-Checkpoints sind ein zusätzlicher Pflichtfilter und ausdrücklich **nicht exklusiv**: Alle bisherigen Lektoratsvorgaben gelten weiter, sofern sie nicht durch eine spätere ausdrückliche Projektentscheidung, den aktuellen Code oder einen Regressionstest ersetzt wurden. Überschneidungen werden nicht doppelt gezählt, aber vollständig geprüft.

## Geltungsbereich und Hierarchie

- Diese sechs Checkpoints definieren das Mindestprogramm jedes Runs, nicht den gesamten Umfang eines Lektorats.
- Zusätzlich gelten sämtliche bestehenden fall-, system-, UI-, Prosa-, Historien-, Weltwahrheits-, Sicherheits- und Kontinuitätsregeln aus der Projektdokumentation.
- Frühere dokumentierte Fehlermuster, bewusste Nicht-Fixes und „settled decisions“ bleiben verbindlicher Prüfhintergrund.
- Ein neuer Checkpoint bündelt vorhandene Regeln nur dort, wo sie sich überschneiden; er löscht oder verdrängt keine speziellere Vorgabe.
- Bei echtem Widerspruch gilt: jüngste ausdrückliche Projektentscheidung, dann aktueller Regressionstest und Codezustand, dann die speziellere Dokumentationsregel. Ein frischer Run-Export dient als Beleg, hebt aber keine Regel von selbst auf.

## Arbeitszyklus

1. Frischen Deploy und Exportversion prüfen.
2. Fall abwechslungsreich spielen: `natural`, `aggressive` und `random`, unterschiedliche Seeds, Gesprächs-, Such-, Bestechungs-, Droh-, Kampf- und friedliche Pfade.
3. Sichtbare Szene, Bild, Enginezustand und Exportdiagnose getrennt auswerten.
4. Jeden Befund am realen Szenensatz und aktuellen Code verifizieren. Diagnosemarker sind Hinweise, keine automatische Wahrheit.
5. Die Root Cause beheben, den echten Auslöser regressionssichern und die komplette Suite ausführen.
6. Version erhöhen, committen und nach `main` pushen.
7. Dem Deploy etwa zwei Minuten geben, danach denselben Fall mit neuem Seed und anderer Spielweise von vorn prüfen.
8. Nach zehn stabilen Runs pro Fall darf die Staffel enden. Bleibt ein Fall instabil, folgen zehn weitere Runs pro Fall.

## Sechs zusätzliche Standing-Checkpoints

### 1. NPC-Reintroduction, Indizien und Story-Drift

- Tauchen Personen nach Abgang, Flucht, Festnahme, Übergabe, Fesselung oder K. o. unpassend wieder auf?
- Stimmen Cast, `personenImRaum`, NPC-Zustand, Ort und Tageszeit überein?
- Sind Indizien korrekt an NPC/Hotspot, Ort, Stage, Aktion und benötigte Vorbelege gebunden?
- Widersprechen sich Szenen über Rolle, Wissen, Beziehung oder Schicksal einer Figur?
- Stimmen Handlungsrichtung und Rollen überein? Bei Beschattung folgt Karl der Zielperson; Formulierungen wie „die Zielperson ist dir gefolgt“ sind fundamentaler Story-Drift, auch wenn alle Pflichtnamen vorkommen. Kritische Rollenchecks dürfen nicht wegen eines langsamen API-Calls übersprungen werden.
- Wird jedes mechanisch vergebene Kern-Indiz in derselben Prosa sichtbar dramatisiert?
- Bleibt die Dramatisierung innerhalb des definierten Informationsumfangs? Exakte Uhrzeiten, Fluchtfahrzeuge/Kennzeichen, Waffen, Gangarten und auffällige Körpermerkmale sind neue Ermittlungsfakten und keine freie Atmosphäre, wenn sie nicht im gebundenen Ziel-Indiz stehen.
- Gilt auch die Gegenrichtung: Eine reine Reise-/Ankunftsszene darf ein noch nicht mechanisch vergebenes Kern-Indiz weder durch eine vollständige Zeugen-Aussage noch durch eine vorweggenommene Hotspot-Untersuchung ausspielen. Sichtbare Requisiten und ein erkennbar wissender NPC sind erlaubt; auch eine Objekt–Beweis-Relation wie „die Stelle in der Vitrine, wo das Etui lag“ ist aber bereits ein Fund und bleibt bis zum gebundenen Klick gesperrt. Konkrete Täterzahl, Tatzeit, Fluchtrichtung, Werkzeugschluss, Gravur oder andere Beweisdetails ebenfalls erst danach. Exportzählung, Popup und Prosa müssen denselben Fundzeitpunkt zeigen.
- Erzeugt ein nachträglich per Fallback eingefügtes Geständnis eine redundante zweite Geständnisszene?
- Bleibt eine Figur, die den Ort ausdrücklich verlässt, in der Folgeszene ohne erklärte Rückkehr verschwunden?
- `W6-BLOCK`, NPC-Terminalzustände und `ORT-PROSA-BRUCH` immer gegen den echten Szenentext verifizieren.

### 2. Historische Fakten: Korrektheit und Interessantheit

- Jeden behaupteten Wochentag gegen das Datum prüfen, bevorzugt reproduzierbar per Datumsfunktion/Skript.
- Namen von Straßen, Plätzen, Bahnhöfen, Behörden, Marken, Fahrzeugen, Gesetzen, Medien und Personen auf den Stand des konkreten Run-Datums prüfen.
- Bei Unsicherheit recherchieren; technische oder historische Behauptungen nur mit belastbarer Quelle korrigieren.
- Sektorlogik beachten: Ost/West, Währung, Polizei, Versorgung, Öffnungszeiten und Verkehrswege.
- Exportblock `Historische Anker (Lektorat)` auswerten. Ein stabiler Run enthält mindestens einen spezifischen, überraschenden und handlungsrelevanten Fakt; bloßes Namedropping genügt nicht.
- Vor Freigabe einen gezielten Anachronismus-Schlusscheck ausführen.

### 3. Prosa-Redundanz und Stil-Tics

- Wiederholungen wie `nagelt müde`, `Kopfsteinpflaster`, `Zigarillo`, `Bohnerwachs`, `Dämmerung wirft Schatten` und verwandte Motive runweit zählen.
- Wiederkehrende Anfahrts-, Motor-, Tür-, Rauch-, Wetter- und Schmerzschablonen markieren.
- Stil-Tics klar von Logikfehlern trennen.
- Bewusst wiederholte Indiz-Motive nicht als Pumphrase entfernen, wenn ihre Wiederkehr Beweisfunktion oder Payoff hat.
- Diagnose-Hardcaps gegen den tatsächlichen Text prüfen: Hat der Filter den richtigen Satz entfernt, oder Bedeutung beschädigt?

### 4. Verletzungs-Konsistenz

- Exportblock zu Verletzung und Behandlung vollständig prüfen.
- Neue Wunden brauchen eine ausgespielte Ursache und passende mechanische Folge; keine folgenlosen Splitter, Schnitte oder Blutungen.
- `Fall abschließen` muss auch bei kritischer Verfassung `Vf≤2` anstandslos erreichbar bleiben, sofern kein ausdrückliches finales Todesereignis vorliegt.
- Behandlungs-Statusfeld, Behandlungs-Logs, tatsächliche Prosa, Verfassungsdelta und offene Arztpflicht müssen übereinstimmen.
- Schlaf, Notversorgung und professionelle Behandlung nicht verwechseln; keine Wunderheilung und kein endloses Dauerjammern.

### 5. Klassische Mechanik-Diagnostik

- `W6-BLOCK` und terminale NPC-Zustände.
- `ORT-PROSA-BRUCH`, Engine-Ort, Header, Bild, Cast und tatsächlicher Handlungsort.
- Klienten-Geduld, Mahnung, Frist, Auftragsentzug und Abschlussbereitschaft.
- Romantik-Klick-Zähler, Abkühlschritte, Personenwechsel/Reset und tatsächlicher `Rm`-Wert.
- `personenImRaum`-Teleport, stille Begleitung und unerklärter Ortswechsel.
- Auch semantische Abgangsvarianten prüfen: „verlässt den Hof/Ort/das Haus“, „macht sich davon“ oder „verschwindet“ widersprechen einem unveränderten Engine-Ort ebenso wie „flieht/rennt hinaus“. Ein Beobachten-/Warten-Klick darf Karl nicht eigenmächtig wegschreiben.
- Funktionieren Buttons, Zielbindung, Karten-Vorauswahl, Öffnungszeiten, Reise-, Schlaf-, Heil- und Abschlusswege ohne Sackgasse?
- Stimmt die Intensität der sichtbaren Aktion mit der Prosa überein? „Stelle zur Rede“/Befragen bleibt verbal; Packen, Gegen-die-Wand-Drücken, Schlagen und daraus erfundene NPC-Verletzungen sind ausschließlich nach einer ausdrücklich gewählten Angriffs-/Kampfhandlung zulässig.
- Passen Szenenbild, Tageslicht, Ort, Figurenlage und Prosa zusammen?
- Bei einem Engine-Außenort auch stille Subort-Wechsel prüfen: Haus-/Wohnungstür öffnen, Hausflur, Treppenhaus oder Wohnung in der Prosa sind ein `ORT-PROSA-BRUCH`, solange keine Reise bzw. kein strukturierter Ortswechsel stattfand. Hotspot-Name und Fundtext dürfen einen solchen Wechsel nicht selbst anordnen.
- Innenraumbegriffe semantisch und in Kurzformen prüfen: „im Flur“, „im Hausflur“, „im Eingangsflur“ und „im Treppenhaus“ sind am Engine-Außenort gleichwertige Driftmarker; ein einzelnes weggelassenes Präfix darf den Guard nicht umgehen.

### 6. Wahrheitsbeat-/Truthbeat-Gate

- Bei `wahrheit`-Fällen sowie jeder `TRUTHBEAT-DIAG`-/`BEAT-DIAG`-Zeile den konkreten Auslösersatz prüfen.
- Festhalten, ob der Beat durch Spieleraktion, mechanisches Indiz, Geständnis, Zeugenaussage, Gegenstand oder nur durch Regex-Prosa erkannt wurde.
- Reflexions-, Motiv-, Negations-, Rückblick- und bloße Namensnähe dürfen keinen Pflicht-Beat erfüllen.
- Ein Beat gilt nur dann als erreicht, wenn die erforderliche Wahrheit mechanisch und narrativ ausgespielt wurde.
- Frühe Mehrfachtreffer, Fallbacks und nachträglich eingefügte Prosa besonders auf Doppelzählung prüfen.

## Aktuelle offene Themen – Priorität

1. Truthbeat-Regex-Fehltreffer.
2. Kern-Indiz-Prosa-Mismatch samt Root Cause: Die Ankunfts-Vorwegnahme ist seit v7.12.1339 abgedeckt, einschließlich Objekt–Beweis-Relationen seit v7.12.1341; v7.12.1340 begrenzt ausgespielte Zeugen-Indizien auf ihren definierten Informationsumfang. Manuelle Stabilitätsbestätigung und die Gegenrichtung „mechanisch vergeben, aber nicht dramatisiert“ bleiben offen.
3. Lola-Präsenz-Widerspruch als generalisierbarer NPC-Kontinuitätsfall.
4. Ort-Prosa-Bruch-Fix weiter generalisieren: v7.12.1321 deckt nach Kessler K2 auch nichtsoziale Außenort→Innenraum-Teleports ab; der vollständige manuelle Krause-Gegenlauf steht noch aus.
5. Fall-Abschluss-Doppelerzählung aus dem Kessler-Run.
6. `INDIZ-GATE`-`fundModus`-Rigidität.
7. Verletzungs-Konsistenz-Gate und Behandlungs-Status-Widerspruch hart durchsetzen.
8. Romance-Zähler-Reset.
9. NPC-Zeitkontinuität und Clubschluss-Beobachtung.
10. Stil-Tic-Besserung durch einen vollständigen Krause-Gegenlauf bestätigen.
11. Echter Blind-Test vor Alexanders erster Session.
12. Gezielter Anachronismus-Schlusscheck.
13. Optional: Stasi-Fall bis zur Vollmer-Konfrontation.

## Mindestprotokoll pro Run

- Fall, Version, Strategie, Seed, Start-/Endzeit, Szenenzahl, Ergebnis und Abbruchgrund.
- Wochentags-/Datumscheck.
- Assertion Report und `Historische Anker`.
- Treffer zu `W6-BLOCK`, `ORT-PROSA-BRUCH`, `TRUTHBEAT-DIAG`, `BEAT-DIAG`, `INDIZ-GATE`, Behandlung, Klientenfrist, Romantik und `personenImRaum`.
- Gefundene Stil-Tics mit Anzahl und Szenennummern.
- Befunde nach P0/P1/P2/P3, jeweils mit Originalsatz, Enginezustand und Root Cause.
- Fixversion, Regressionstest, Commit und Ergebnis des Gegenlaufs.
