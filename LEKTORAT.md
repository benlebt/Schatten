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
- „Sichtbar dramatisiert“ umfasst alle definierenden Pflichtanker, nicht nur den groben Vorgang: Vergibt die Mechanik „mittwochs gegen 19 Uhr“, genügt eine zeitlose Eintrittsszene nicht. Datengetriebene `prosaPflicht`-Anker müssen vor der Buchung im Szenentext erfüllt oder idempotent ergänzt werden.
- Pflichtanker semantisch breit, aber sachlich eng erkennen: „um kurz nach sieben“, „gegen sieben“, „punkt sieben“ und „19 Uhr“ erfüllen denselben Zeitanker. Eine legitime Variante darf keinen redundanten zweiten Fallbacksatz erzeugen.
- Bereits gefundene Kern-Indizien bleiben in jeder späteren Reise-, Schlaf-, Reflexions- und Abschlussprosa harte Fortsetzungs-Wahrheit. Die bloße Auflistung im Recap genügt bei besonders driftanfälligen Fakten nicht: Solche Indizien erhalten einen datengetriebenen `fortsetzungsWahrheit`-Anker. Beispiel: Wurde Robert beim Betreten des Hinterhauses beobachtet, darf eine spätere Szene daraus weder ein spurloses Verschwinden noch ein „in Luft aufgelöst“ im Hinterhof machen.
- Bleibt die Dramatisierung innerhalb des definierten Informationsumfangs? Exakte Uhrzeiten, Fluchtfahrzeuge/Kennzeichen, Waffen, Gangarten und auffällige Körpermerkmale sind neue Ermittlungsfakten und keine freie Atmosphäre, wenn sie nicht im gebundenen Ziel-Indiz stehen.
- Vermischt die Szene das gerade vergebene Indiz mit markanten Schlüsselmerkmalen eines anderen, noch offenen Indizes am selben Ort? Beispiel: Beim Vitrinenfund darf nicht bereits das „aufgehebelte“ Schloss/Werkzeug des Fenster-Indizes erklärt werden. Jede offene Spur behält ihren eigenen Klick und Ausspielmoment.
- Bleibt auch die Quellenart des Indizes erhalten? Ein Hotspot-/Objektfund wird durch Karls Untersuchung sichtbar; Reparatur- und Fallbacktexte dürfen daraus keine „befragte Person“, „Beobachtung“ oder „Aussage“ machen. Umgekehrt braucht ein Personen-Indiz eine tatsächlich gebundene sprechende Figur.
- Gilt auch die Gegenrichtung: Eine reine Reise-/Ankunftsszene darf ein noch nicht mechanisch vergebenes Kern-Indiz weder durch eine vollständige Zeugen-Aussage noch durch eine vorweggenommene Hotspot-Untersuchung ausspielen. Das gilt ebenso für erfundene Teil-Aussagen außerhalb des definierten Indizes: Eine Zeugin darf sichtbar etwas wissen, aber vor ihrem Gesprächsklick weder „sofort/ausschweifend berichten“ noch Schritte, Beobachtungen oder Tatzeit schildern. Sichtbare Requisiten und ein schweigend erkennbar wissender NPC sind erlaubt; auch eine Objekt–Beweis-Relation wie „die Stelle in der Vitrine, wo das Etui lag“ ist aber bereits ein Fund und bleibt bis zum gebundenen Klick gesperrt. Konkrete Täterzahl, Tatzeit, Fluchtrichtung, Werkzeugschluss, Gravur oder andere Beweisdetails ebenfalls erst danach. Exportzählung, Popup und Prosa müssen denselben Fundzeitpunkt zeigen.
- Widerspricht eine erlaubte Ankunfts-Requisite schon vor dem Klick der physischen Ausgangslage ihres späteren Indizes? „Vitrine sichtbar“ ist zulässig; eine kanonisch intakte, geöffnete Vitrine als „zerbrochen“ oder samt Glasscherbe zu schildern, ist fundamentaler Story-Drift. Solche vorab sichtbaren Objektwahrheiten werden datengetrieben am Indiz gebunden, im Reise-Prompt mitgegeben und vor Szenenfreigabe validiert, ohne den eigentlichen Beweis-Payoff vorwegzunehmen.
- Erzeugt ein nachträglich per Fallback eingefügtes Geständnis eine redundante zweite Geständnisszene?
- Dasselbe Einmal-Prinzip gilt innerhalb einer Kern-Indiz-Szene: Der kurze Ziel-/Popup-Text und ein ausführlicher `fundText` sind zwei Darstellungen derselben Spur, keine zwei Funde. Wird der Kurztext bereits nahezu wörtlich ausgespielt und der restliche Absatz wiederholt mindestens drei definierende Schlüssel derselben Spur, ist das ein fundamentaler Kern-Indiz-Prosa-Doppelbeat. Prompt, Repair und Hard-Fallback müssen genau eine zusammenhängende Dramatisierung behalten.
- Bleibt eine Figur, die den Ort ausdrücklich verlässt, in der Folgeszene ohne erklärte Rückkehr verschwunden?
- Bleibt auch der Subort einer weiterhin anwesenden Figur stabil? Wer im Laden neben Karl steht und in `personenImRaum` anklickbar bleibt, darf nicht ohne sichtbaren Abgang plötzlich „im Vorderhaus“, „in ihrer Wohnung“ oder „auf der Diele darüber“ handeln. Eine Herkunftsangabe wie „die Nachbarin aus dem Vorderhaus“ ist dagegen kein Ortswechsel.
- Stimmen Ruf-Anspielungen mit dem strukturierten Begegnungslog überein? „Nicht gerade zimperlich“, „ruppig“, „hart angefasst“ und ähnliche Milieu-Gerüchte dürfen nur eine tatsächlich hart angegangene Person nennen. Eine höflich befragte Zeugin bleibt auch dann höflich befragt, wenn ein unsichtbarer Indiz-Payoff ein mehrdeutiges Verb wie „greifen“ enthält; Objekt-/Hotspot-Prosa darf niemals als Gewalt gegen die einzige anwesende Figur gezählt werden.
- `W6-BLOCK`, NPC-Terminalzustände und `ORT-PROSA-BRUCH` immer gegen den echten Szenentext verifizieren.

### 2. Historische Fakten: Korrektheit und Interessantheit

- Jeden behaupteten Wochentag gegen das Datum prüfen, bevorzugt reproduzierbar per Datumsfunktion/Skript.
- Uhrzeit, Engine-Tageszeit, Licht und Wartehandlung gemeinsam prüfen. Ein kanonisches Ereignis „gegen 19 Uhr“ darf am 14. Oktober weder im Engine-Nachmittag verbleiben noch als „letztes Tageslicht“ beschrieben werden; ein ausdrücklicher Warten-Hotspot muss die Engine vor der Szene passend fortschalten.
- Namen von Straßen, Plätzen, Bahnhöfen, Behörden, Marken, Fahrzeugen, Gesetzen, Medien und Personen auf den Stand des konkreten Run-Datums prüfen.
- Bei Unsicherheit recherchieren; technische oder historische Behauptungen nur mit belastbarer Quelle korrigieren.
- Sektorlogik beachten: Ost/West, Währung, Polizei, Versorgung, Öffnungszeiten und Verkehrswege.
- Exportblock `Historische Anker (Lektorat)` auswerten. Ein stabiler Run enthält mindestens einen spezifischen, überraschenden und handlungsrelevanten Fakt; bloßes Namedropping genügt nicht.
- Vor Freigabe einen gezielten Anachronismus-Schlusscheck ausführen.

### 3. Prosa-Redundanz und Stil-Tics

- Wiederholungen wie `nagelt müde`, `Kopfsteinpflaster`, `Zigarillo`, `Bohnerwachs`, `Dämmerung wirft Schatten` und verwandte Motive runweit zählen.
- Wiederkehrende Anfahrts-, Motor-, Tür-, Rauch-, Wetter- und Schmerzschablonen markieren.
- Lange Erzählabsätze dürfen nicht als vollständige direkte Rede in einem äußeren ASCII-Anführungszeichenpaar stehen. Der Sanitizer muss neben Pronomen-/Artikelanfängen auch einen aktuellen Cast-Namen als narrativen Absatzanfang erkennen; echte kurze Repliken und innere Dialog-Anführungszeichen bleiben erhalten.
- Anführungszeichen im semantischen Browser-DOM-Snapshot können reine Serialisierungszeichen für Text mit Doppelpunkt oder Dialog sein. Sie zählen erst nach visueller Kontrolle des gerenderten Absatzes als echter Quote-Wrapper-Befund.
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
- Bei strukturierten Indiz-Mikroszenen Forensik und akute Gefahr trennen: Wörter wie „rohe Gewalt“, „Stemmeisen“, „Schlagspuren“ oder „greifen“ beschreiben häufig eine vergangene Tat am Objekt. Ohne tatsächlich gegenwärtigen Angreifer dürfen sie weder Karls Gewaltruf erhöhen noch allein `Spannung=4/5`, Action-Streak oder Fluchtmodus auslösen. Szene-Objekt, Header und Reise-/Schlafgates müssen denselben gedeckelten Spannungswert sehen.
- Klienten-Geduld, Mahnung, Frist, Auftragsentzug und Abschlussbereitschaft.
- Klientenhonorar und Kasse müssen ebenfalls synchron bleiben: Eine bloße Antwortszene darf keinen Vorschuss, keine Anzahlung, keinen Geldumschlag und keine Ausgabe erfinden, wenn die Engine kein entsprechendes Kassen-Delta verbucht. Bei Krause werden die vereinbarten 200 Ostmark erst bei Rückgabe des Etuis fällig; bis dahin bleibt die Kasse unverändert.
- Romantik-Klick-Zähler, Abkühlschritte, Personenwechsel/Reset und tatsächlicher `Rm`-Wert.
- `personenImRaum`-Teleport, stille Begleitung und unerklärter Ortswechsel.
- Bei einer mechanisch bereits gestarteten Gruppen-Konfrontation gilt auch die Gegenrichtung: Jede noch physisch anwesende und in der Konfrontations-UI auswählbare Person muss beim Eintritt namentlich in der Prosa dramatisiert und in `personenImRaum` geführt werden. Ein Gegner darf weder als unsichtbares UI-Ziel existieren noch nur im strukturierten Roster stehen, während die Erzählung eine kleinere Gruppe behauptet. Entfernte/geflüchtete Figuren bleiben ausgenommen; spätere Kampfszenen müssen bereits ausgeschaltete Körper nicht in jedem Absatz erneut aufzählen.
- Schon die Eröffnung muss Engine-Ort, Header, Bild und Prosa synchronisieren. Bei geteilten Orten gilt der physische Szenen-Roster streng: Eine Zielperson, die laut Prosa noch draußen am Kiosk wartet, darf im bereits aktiven Hinterhof weder in `personenImRaum` stehen noch direkt ansprechbar sein.
- Fehlt `personenImRaum`, darf ein bloßer Name im Opening-Text keine inaktive Orts-/Zeitbindung überstimmen. Snapshot-Ausnahmen überbrücken nur einen im selben Render verbuchten Stage-Wechsel; eine Figur mit Bindung „Abend/Nacht“ wird durch eine Erwähnung am Nachmittag nicht physisch anwesend oder anklickbar.
- Auch semantische Abgangsvarianten prüfen: „verlässt den Hof/Ort/das Haus“, „macht sich davon“ oder „verschwindet“ widersprechen einem unveränderten Engine-Ort ebenso wie „flieht/rennt hinaus“. Ein Beobachten-/Warten-Klick darf Karl nicht eigenmächtig wegschreiben.
- Ein Abgang braucht weder Flucht noch Abfahrt: „geht zur Straße“ und „steuert seinen Opel an, um den Beobachtungsposten zu verlassen“ vollziehen den Ortswechsel bereits und sind ohne Reisebefehl ebenfalls zu blockieren.
- Auch zweckgebundene Euphemismen prüfen: „entfernt sich leise, um nicht entdeckt/gesehen/bemerkt zu werden“ schreibt Karl aus dem Beobachtungsposten und ist ohne Reise-/Fluchtbefehl ein vollzogener Abgang.
- Gleiches gilt für Inversionen und bevor-Sätze: „zieht sich zügig zurück, bevor ihn ein Anwohner bemerkt“ ist semantisch derselbe Abgang.
- Funktionieren Buttons, Zielbindung, Karten-Vorauswahl, Öffnungszeiten, Reise-, Schlaf-, Heil- und Abschlusswege ohne Sackgasse?
- Stimmt die Intensität der sichtbaren Aktion mit der Prosa überein? „Stelle zur Rede“/Befragen bleibt verbal; Packen, Gegen-die-Wand-Drücken, Schlagen und daraus erfundene NPC-Verletzungen sind ausschließlich nach einer ausdrücklich gewählten Angriffs-/Kampfhandlung zulässig.
- Passen Szenenbild, Tageslicht, Ort, Figurenlage und Prosa zusammen?
- Bei einem Engine-Außenort auch stille Subort-Wechsel prüfen: Haus-/Wohnungstür öffnen, Hausflur, Treppenhaus oder Wohnung in der Prosa sind ein `ORT-PROSA-BRUCH`, solange keine Reise bzw. kein strukturierter Ortswechsel stattfand. Hotspot-Name und Fundtext dürfen einen solchen Wechsel nicht selbst anordnen.
- Innenraumbegriffe semantisch und in Kurzformen prüfen: „im Flur“, „im Hausflur“, „im Eingangsflur“ und „im Treppenhaus“ sind am Engine-Außenort gleichwertige Driftmarker; ein einzelnes weggelassenes Präfix darf den Guard nicht umgehen.
- Auch Etagen-/Türhandlungen sind Ortsmarker: „an die Wohnungstür im dritten Stock klopfen/klingeln“ setzt Karl physisch auf einen Treppenabsatz und ist am unveränderten Engine-Außenort ebenso ein `ORT-PROSA-BRUCH` wie das ausdrückliche Betreten von Flur oder Treppenhaus.
- Karls Ort kann auch indirekt durch Figurenwahrnehmung festgeschrieben werden: „sie sieht/bemerkt dich im Flur“ ist derselbe Innenraum-Teleport wie „du gehst in den Flur“, selbst wenn Karl im Satz kein eigenes Bewegungsverb erhält.
- Gleiches gilt für kausative Fremdhandlungen: „sie lässt/bittet/führt dich in den Treppenflur“ vollzieht den Innenraumwechsel, obwohl die andere Figur grammatisches Subjekt ist. Am unveränderten Engine-Außenort muss auch diese Form als `ORT-PROSA-BRUCH` blockiert werden.

### 6. Wahrheitsbeat-/Truthbeat-Gate

- Bei `wahrheit`-Fällen sowie jeder `TRUTHBEAT-DIAG`-/`BEAT-DIAG`-Zeile den konkreten Auslösersatz prüfen.
- Festhalten, ob der Beat durch Spieleraktion, mechanisches Indiz, Geständnis, Zeugenaussage, Gegenstand oder nur durch Regex-Prosa erkannt wurde.
- Reflexions-, Motiv-, Negations-, Rückblick- und bloße Namensnähe dürfen keinen Pflicht-Beat erfüllen.
- Ein Beat gilt nur dann als erreicht, wenn die erforderliche Wahrheit mechanisch und narrativ ausgespielt wurde.
- Frühe Mehrfachtreffer, Fallbacks und nachträglich eingefügte Prosa besonders auf Doppelzählung prüfen.

## Aktuelle offene Themen – Priorität

1. Truthbeat-Regex-Fehltreffer.
2. Kern-Indiz-Prosa-Mismatch samt Root Cause: Die Ankunfts-Vorwegnahme ist seit v7.12.1339 abgedeckt, einschließlich Objekt–Beweis-Relationen seit v7.12.1341 und vorgezogener Teil-Aussagen zu Schritten/Beobachtung/Tatzeit seit v7.12.1358; v7.12.1340 begrenzt ausgespielte Zeugen-Indizien auf ihren definierten Informationsumfang, v7.12.1342 sperrt markante Cross-Clue-Kontamination, v7.12.1344 erhält auch bei Repair/Fallback die Quellenart Person versus Hotspot/Objekt, v7.12.1350 führt datengetriebene Pflichtanker für mechanisch gebuchte Kern-Indizien ein und v7.12.1352 hält driftanfällige Kernfakten per `fortsetzungsWahrheit` auch in späteren Szenen bindend. v7.12.1362 vereinigt beim expliziten Haupt-UI-Klick kurzen Zieltext und ausführlichen Pflicht-Payoff zu genau einer Dramatisierung; v7.12.1363 bindet zusätzlich die vor dem Klick sichtbare physische Objektwahrheit, damit Ankunftsrequisiten dem späteren Fund nicht widersprechen. Weitere Indizien annotieren und manuell stabilitätsbestätigen.
3. Lola-Präsenz-Widerspruch als generalisierbarer NPC-Kontinuitätsfall. Die verwandte Ruf-/Begegnungszuordnung ist seit v7.12.1357 strukturell abgesichert: ruhige Engine-Indizklicks können durch Wörter ihres Pflicht-Payoffs nicht mehr als Gewalt zählen, und sichtbare harte Gerüchte werden gegen die tatsächlich hart bzw. fair geloggten Namen validiert. Seit v7.12.1361 blockt ein zusätzliches Konfrontations-Roster-Gate Ankunftsszenen, in denen ein mechanisch auswählbares Gruppenmitglied weder in Prosa noch `personenImRaum` sichtbar ist; weitere Nicht-Konfrontationsvarianten bleiben zu generalisieren.
4. Ort-/Zeit-Prosa-Bruch-Fix weiter generalisieren: v7.12.1321 deckt nach Kessler K2 auch nichtsoziale Außenort→Innenraum-Teleports ab; v7.12.1343 sichert zusätzlich Kesslers geteilte Startposition Hinterhof/Straße und den physischen Szenen-Roster, v7.12.1345 ergänzt Klopfen/Klingeln an Etagen-/Wohnungstüren, v7.12.1346 indirekte Flur-Präsenz über Figurenwahrnehmung, v7.12.1347 ruhige Abgänge zu Straße/Opel, v7.12.1348 den kanonischen 19-Uhr-Wartewechsel auf Abend und v7.12.1349 zweckgebundene Entfernen-Euphemismen. Der vollständige manuelle Krause-Gegenlauf und Kessler-Gegenlauf stehen noch aus.
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
