# Schatten – additiver verbindlicher Run-Lektoratsstandard

Stand: 29.07.2026. Diese Datei ergänzt die bereits in `SCHATTEN_PROJEKT.md`, `UEBERGABE_v1313.md`, den Konzeptdokumenten, Tests und bisherigen Lektoratsentscheidungen festgehaltenen Regeln. Die sechs Standing-Checkpoints sind ein zusätzlicher Pflichtfilter und ausdrücklich **nicht exklusiv**: Alle bisherigen Lektoratsvorgaben gelten weiter, sofern sie nicht durch eine spätere ausdrückliche Projektentscheidung, den aktuellen Code oder einen Regressionstest ersetzt wurden. Überschneidungen werden nicht doppelt gezählt, aber vollständig geprüft.

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

### Schlaf-Ortswahrheit aus dem Produktionsgegenlauf v1745

- Der einzige sichtbare Button `Schlafen` bedeutet verbindlich
  **Schlafen am aktuellen Engine-Ort**. Er ist keine automatische Heimfahrt.
- Eine Heimfahrt darf nur durch eine ausdrückliche Reiseentscheidung entstehen.
  Schlaf allein darf Karl weder in sein Büro noch in eine Pension, ein Hotel,
  ein Gästezimmer oder zu einem benannten NPC versetzen.
- Nach dem Aufwachen müssen Prosa, `scene.ort`, Engine-Ort, Header, Bild und
  tatsächliche Tageszeit denselben Ort und dieselbe Phase zeigen.
- Der beim Klick eingefrorene Ursprungsort ist bindend. Ein Modell-Ort oder
  eine Schlafprosa am Hackeschen Markt darf ihn nicht überschreiben.

## Sechs zusätzliche Standing-Checkpoints

### 1. NPC-Reintroduction, Indizien und Story-Drift

- Tauchen Personen nach Abgang, Flucht, Festnahme, Übergabe, Fesselung oder K. o. unpassend wieder auf?
- Stimmen Cast, `personenImRaum`, NPC-Zustand, Ort und Tageszeit überein?
- Sind Indizien korrekt an NPC/Hotspot, Ort, Stage, Aktion und benötigte Vorbelege gebunden?
- Bleibt jeder gebundene Fund in jeder zulässigen Reihenfolge auf seinem eigenen Wissensstand? Ein Fundtext darf keine Schlussfolgerung aus einem anderen Indiz als bereits bewiesen formulieren, wenn dieses im aktuellen Pfad noch offen sein kann. Beispiel Kessler: Das Schild „Hauke, 3. Stock links“ beweist für sich noch nicht, dass Robert genau diese Wohnung aufsucht.
- Gravuren, Daten und Widmungen dürfen nicht mit einem unbelegten Anlass ausgeschmückt werden. „Für Hugo, 1939, Liesl“ belegt Richtung, Namen und Jahr, aber weder Hochzeit noch Geburtstag, Jubiläum oder Weihnachten. Ebenso bleibt der gebundene letzte Objektort erhalten: Krauses Etui lag sichtbar in der hohen Rückwandvitrine; „nichts für die Auslage“ oder „nie ausgestellt“ ist Story-/Indiz-Drift.
- Bleibt eine mechanisch definierte Zeugenaussage exakt in ihrem Umfang? Ungedeckte Uhrzeiten, Fahrzeuge, Waffen, Körper-/Gangmerkmale sowie vermeintliche Herkunft, Akzente oder Ortsfremdheit („nicht wie Einheimische“) sind neue Täterprofile und damit Story-Drift, auch wenn der kanonische Satz davor vollständig stimmt.
- Widersprechen sich Szenen über Rolle, Wissen, Beziehung oder Schicksal einer Figur?
- Kehrt ein mehrdeutiges Relativpronomen Täter und Auftraggeber um? Besonders in Diebstahl-Openings prüfen: „das Etui, das er aus der Vitrine gestohlen hat“ darf sich grammatisch nicht auf den direkt zuvor genannten Eigentümer/Klienten beziehen. Auftraggeber, Eigentümer, Täter und Finder müssen auch auf Satzebene eindeutig bleiben.
- Stimmen Handlungsrichtung und Rollen überein? Bei Beschattung folgt Karl der Zielperson; Formulierungen wie „die Zielperson ist dir gefolgt“ sind fundamentaler Story-Drift, auch wenn alle Pflichtnamen vorkommen. Kritische Rollenchecks dürfen nicht wegen eines langsamen API-Calls übersprungen werden.
- Wird jedes mechanisch vergebene Kern-Indiz in derselben Prosa sichtbar dramatisiert?
- Deckt der Pflichtanker den vollständigen mechanischen Aussagekern statt nur ein Stichwort ab? Beim Türschild reicht „Hauke“ nicht, wenn Popup und Indiz zugleich „3. Stock links“ und „kein Herr/keine Familie“ buchen. Zahlen, Richtung und ausschließende Beziehungstatsachen müssen gemeinsam im sichtbaren Szenentext vorkommen.
- Teiltreffer innerhalb eines zusammengesetzten Ausschlussankers zählen nicht: „kein Herr“ allein erfüllt „kein Herr, keine Familie/alleinstehend“ nicht. Jeder unabhängig im Popup behauptete Ausschluss braucht einen eigenen positiven Prosa-Check.
- „Sichtbar dramatisiert“ umfasst alle definierenden Pflichtanker, nicht nur den groben Vorgang: Vergibt die Mechanik „mittwochs gegen 19 Uhr“, genügt eine zeitlose Eintrittsszene nicht. Datengetriebene `prosaPflicht`-Anker müssen vor der Buchung im Szenentext erfüllt oder idempotent ergänzt werden.
- Dasselbe gilt für forensische Schlüsse: Wenn Popup und Indiztext das Tatwerkzeug „Stemmeisen“ als definierenden Schluss buchen, genügen „rohe Gewalt“ oder „kein Glasschneider“ allein nicht. Zulässige enge Synonyme wie Brecheisen/Brechstange erfüllen den Anker; andernfalls ergänzt ein kurzer, nicht den ganzen Fund wiederholender Satz den Werkzeugschluss vor der Buchung.
- Pflichtanker semantisch breit, aber sachlich eng erkennen: „um kurz nach sieben“, „gegen sieben“, „punkt sieben“ und „19 Uhr“ erfüllen denselben Zeitanker. Eine legitime Variante darf keinen redundanten zweiten Fallbacksatz erzeugen.
- Bereits gefundene Kern-Indizien bleiben in jeder späteren Reise-, Schlaf-, Reflexions- und Abschlussprosa harte Fortsetzungs-Wahrheit. Die bloße Auflistung im Recap genügt bei besonders driftanfälligen Fakten nicht: Solche Indizien erhalten einen datengetriebenen `fortsetzungsWahrheit`-Anker. Beispiel: Wurde Robert beim Betreten des Hinterhauses beobachtet, darf eine spätere Szene daraus weder ein spurloses Verschwinden noch ein „in Luft aufgelöst“ im Hinterhof machen.
- Bleibt die Dramatisierung innerhalb des definierten Informationsumfangs? Exakte Uhrzeiten, Fluchtfahrzeuge/Kennzeichen, Waffen, Gangarten und auffällige Körpermerkmale sind neue Ermittlungsfakten und keine freie Atmosphäre, wenn sie nicht im gebundenen Ziel-Indiz stehen.
- Semantische Scope-Varianten vollständig prüfen: „kurz vor Mitternacht“ ist ebenso eine exakte Zeitbehauptung wie „kurz nach drei“; „in einen Wagen wuchten/laden/werfen/verstauen/schieben“ ist ebenso Fluchtfahrzeugwissen wie „hineinhieven“. Erweiterungen brauchen immer einen engen Negativtest, damit erlaubte Zielwörter nicht pauschal gesperrt werden.
- Zeit-/Fahrzeug-Scope auch über wechselnde Präpositionen, Artikel und Gradadverbien prüfen: „weit/lange/knapp nach Mitternacht“ bleibt eine unzulässige exakte Zeitbehauptung; „in einen/den Wagen steigen“, „die Tasche zum Wagen tragen“ und „der Wagen wartete/stand/parkte in der Gasse“ bleiben unzulässiges Fluchtfahrzeugwissen, obwohl die Formulierung variiert oder nichts *in* den Wagen verladen wird. Jeder Scope-Guard braucht Regressionen für natürliche Kasus-/Artikelvarianten, nicht nur für einen einzelnen Modellwortlaut.
- Vermischt die Szene das gerade vergebene Indiz mit markanten Schlüsselmerkmalen eines anderen, noch offenen Indizes am selben Ort? Beispiel: Beim Vitrinenfund darf nicht bereits das „aufgehebelte“ Schloss/Werkzeug des Fenster-Indizes erklärt werden. Jede offene Spur behält ihren eigenen Klick und Ausspielmoment.
- Erzählt die Szene dasselbe Kern-Indiz erst ausführlich und hängt danach dessen Kurz-/Popuptext noch einmal als scheinbare Schlussfolgerung an? Nicht nur wortgleiche Kopien prüfen, sondern auch nahe Paraphrasen: Zwei getrennte Textteile mit denselben definierenden Merkmalen sind eine Doppelerzählung. Ein zusammenhängender Fund mit natürlich verteilten Details bleibt erlaubt.
- Widersprechen sich bereits gesicherte Indizien in ihrer Schlussfolgerung? Im Krause-Fall bleibt die grobe Stemmeisenarbeit „Gelegenheitsdiebe, keine Profis“, auch wenn die gezielte Beuteauswahl Planung oder Ortskenntnis zeigt. Planung, Zielwissen und handwerkliche Einbruchskompetenz getrennt bewerten; „wussten, was sie nahmen“ darf nicht zu „keine Amateure/Profis“ driften.
- Bleibt auch die Quellenart des Indizes erhalten? Ein Hotspot-/Objektfund wird durch Karls Untersuchung sichtbar; Reparatur- und Fallbacktexte dürfen daraus keine „befragte Person“, „Beobachtung“ oder „Aussage“ machen. Umgekehrt braucht ein Personen-Indiz eine tatsächlich gebundene sprechende Figur.
- Bleibt ein Repair-/Hard-Fallback auf den aktiven Fall, die konkrete Quelle und den konkreten NPC begrenzt? Indiz-IDs dürfen fallübergreifend gleich heißen; deshalb darf kein Fallback allein anhand einer nicht global eindeutigen ID kanonische Prosa auswählen. Kessler-Gegenprobe: `nachbarin_aussage` bei Frau Pohl muss Robert/Hauke/Mittwoch erzählen und darf niemals Hannelore Wirth, den 29./30. September oder Krauses schwere Tasche einblenden. Jede solche Kollision wird paarweise mit beiden Fällen regressionsgesichert.
- Bleibt die Provenienz eines Kernobjekts richtungsstabil? Bei einer Widmung oder Gravur ist Geber→Empfänger keine freie Familienatmosphäre. Für Krauses Etui gilt verbindlich: Liesl schenkte/widmete es Hugo 1939; „es gehörte meiner Liesl“, „Liesls Etui“ oder Hugo→Liesl kehren den Kanon um und sind fundamentaler Story-Drift.
- Gilt auch die Gegenrichtung: Eine reine Reise-/Ankunftsszene darf ein noch nicht mechanisch vergebenes Kern-Indiz weder durch eine vollständige Zeugen-Aussage noch durch eine vorweggenommene Hotspot-Untersuchung ausspielen. Das gilt ebenso für erfundene Teil-Aussagen außerhalb des definierten Indizes: Eine Zeugin darf sichtbar etwas wissen, aber vor ihrem Gesprächsklick weder „sofort/ausschweifend berichten“ noch Schritte, Beobachtungen oder Tatzeit schildern. Sichtbare Requisiten und ein schweigend erkennbar wissender NPC sind erlaubt; auch eine Objekt–Beweis-Relation wie „die Stelle in der Vitrine, wo das Etui lag“ ist aber bereits ein Fund und bleibt bis zum gebundenen Klick gesperrt. Konkrete Täterzahl, Tatzeit, Fluchtrichtung, Werkzeugschluss, Gravur oder andere Beweisdetails ebenfalls erst danach. Exportzählung, Popup und Prosa müssen denselben Fundzeitpunkt zeigen.
- Stimmen strukturierter Sozialweg und allgemeines Rollen-Gate überein? Erklärt ein NPC-Profil eine Tonart ausdrücklich als erfolgreich, darf ein pauschales Informanten-/Zahlungsgate nicht trotzdem die mechanische Vergabe verweigern, während der Profil-Push den Hinweis bereits in der Prosa ausspielt. Kostenlose Ausnahmen müssen ausdrücklich datengetrieben markiert, auf denselben Ziel-NPC gebunden und durch Prompt, Ziel-Indiz-Auswahl, Buchung und Kasse getragen werden; gewöhnliche Informanten bleiben ohne diese Freigabe zahlungs- oder druckpflichtig.
- Wird eine Figur schon vor ihrem Stage-/Beleg-Gate angesprochen, darf die atmosphärische Kennenlern-Szene weder das gesperrte Indiz vorwegnehmen noch die später nötigen erfolgreichen Tonarten verbrauchen. Vor der Freigabe höchstens eine sichtbare Kennenlern-Aktion pro NPC/Tag; danach ein erklärender, kostenloser Sperrhinweis. Sobald ein belastbarer Anhaltspunkt vorliegt, müssen die erfolgreichen Profilwege wieder vollständig verfügbar sein. Eine Reihe positiv beschrifteter Buttons, die alle ohne Hinweis verschwinden und nur negative/teure/aggressive Wege übrig lässt, ist eine fundamentale Dialog-Sackgasse.
- Deckt das Ankunfts-Leak-Gate deutsche Tempus- und Satzstellungsvarianten ab? „Ich sah …“, „ich habe … kommen sehen“ und schon das minimale Selbstzeugnis „ich habe in der Nacht etwas gesehen“ sind vorgezogene Wahrnehmungsbeats; ebenso dürfen „Männer“, „Gestalten“ oder „Personen“ den Täterzahl-Check nicht umgehen. Die Erweiterung muss eng an Ich-Form, Vergangenheitswahrnehmung und Ermittlungsinhalt gebunden bleiben, damit ein gegenwärtiges „sie sieht Karl an“ oder schweigendes Wissen erlaubt bleibt.
- Verrät eine Ankunft den Objektfund indirekt über seine Spurfläche? Auch eine unbenannte „leere Stelle im Samt“, ein Abdruck, Umriss oder heller Rand auf einem clue-spezifischen Träger ist bereits die Hotspot-Untersuchung. Die bloß sichtbare leere Vitrine und ihr Samtbezug bleiben erlaubt, solange keine Leerstelle oder Beweiskontur beschrieben wird.
- Widerspricht eine erlaubte Ankunfts-Requisite schon vor dem Klick der physischen Ausgangslage ihres späteren Indizes? „Vitrine sichtbar“ ist zulässig; eine kanonisch intakte, geöffnete Vitrine als „zerbrochen“, „aufgebrochen“, „aufgehebelt“, „gewaltsam geöffnet“ oder samt Glasscherbe zu schildern, ist fundamentaler Story-Drift. Objektzustände immer samt natürlichen Zustands-Synonymen prüfen; nicht nur Glasbruch, sondern auch eine erfundene gewaltsame Öffnung verändert den Kanon. Solche vorab sichtbaren Objektwahrheiten werden datengetrieben am Indiz gebunden, im Reise-Prompt mitgegeben und vor Szenenfreigabe validiert, ohne den eigentlichen Beweis-Payoff vorwegzunehmen.
- Die physische Vorab-Objektwahrheit gilt nicht nur bei Ankunft, sondern bis zur Buchung in jeder Szene: Auch Klient, Zeuge oder Reflexion dürfen ein kanonisch aufgehebeltes Fenster nicht „eingeschlagen“ nennen und den noch unverdienten Profi-/Nichtprofi- oder Werkzeugschluss nicht aussprechen. Der Auftrag und der bloße Einbruch dürfen erwähnt werden; Forensik bleibt am gebundenen Untersuchungsklick.
- Erzeugt ein nachträglich per Fallback eingefügtes Geständnis eine redundante zweite Geständnisszene?
- Sind alternative Enden im Win-Screen strikt exklusiv? Schweigegeld/Vertuschung darf niemals zugleich mit „Auftraggeber informiert“ oder einem normalen Bericht erscheinen. Auf Touch-Geräten zusätzlich prüfen, dass der öffnende Resolve-Tap nicht in ein neu gerendertes Moralwahl-Overlay durchschlägt; jede Moralwahl braucht einen zweiten bewussten Tap und einen eindeutigen Export-Logeintrag.
- Abschluss- und Scheitern-Screens gehören vollständig zur sichtbaren Prosa-Prüfung: Titel, Ausgangssatz, Bericht-Fallback, Noir-Schlusssatz sowie Honorar-/Kassenzeile müssen durch die zentrale Umlaut-Normalisierung laufen. Sichtbare Ersatzschreibungen wie `erfaehrt`, `uebermittelt` oder `gekuerzt` sind ein UI-Textfehler, auch wenn Prompt- und interne Engine-Texte bewusst ASCII bleiben.
- Benennt ein als „Geständnis“ historisch gewachsenes Kern-Indiz wirklich ein Geständnis? Bestreitet der Verdächtige die Absicht und wird erst durch eine Zeugin widerlegt, muss der definierte Indiztext genau diese Leugnung plus Widerspruch abbilden und darf kein vorsätzliches Mordgeständnis behaupten.
- Dasselbe Einmal-Prinzip gilt innerhalb einer Kern-Indiz-Szene: Der kurze Ziel-/Popup-Text und ein ausführlicher `fundText` sind zwei Darstellungen derselben Spur, keine zwei Funde. Wird der Kurztext bereits nahezu wörtlich ausgespielt und der restliche Absatz wiederholt mindestens drei definierende Schlüssel derselben Spur, ist das ein fundamentaler Kern-Indiz-Prosa-Doppelbeat. Prompt, Repair und Hard-Fallback müssen genau eine zusammenhängende Dramatisierung behalten.
- Bleibt eine Figur, die den Ort ausdrücklich verlässt, in der Folgeszene ohne erklärte Rückkehr verschwunden?
- Behauptet eine Erstbegegnung unbelegt Wiedererkennung? Schon „dann erkennt sie dich wieder“ oder „sie wiedererkennt dich“ setzt einen früheren Kontakt voraus, auch ohne die Wörter „vorhin“, „schon einmal“ oder „hier“. Zulässig ist das nur mit passendem Karriere- oder Begegnungslog; ein bloßer erster Besuch am Ort genügt nicht.
- Wird die Abwesenheit eines zuvor abgegangenen Klienten zeitlich erklärt? Neben „nicht hier/gerade weg“ auch „nirgends/nicht zu sehen“, „fehlt“, „abwesend“ und „keine Spur von …“ prüfen. Auch eine Prosa, die die Figur nach einem ausdrücklich angekündigten Zielweg einfach gar nicht mehr erwähnt, ist zu prüfen. Bei Karls erster Ankunft in Krauses Laden muss deshalb ausdrücklich stehen, dass Krause oben in seiner Wohnung die Verlustliste erstellt; ein bloßes Verschwinden ist NPC-Zeitdrift.
- Bleibt auch der Subort einer weiterhin anwesenden Figur stabil? Wer im Laden neben Karl steht und in `personenImRaum` anklickbar bleibt, darf nicht ohne sichtbaren Abgang plötzlich „im Vorderhaus“, „in ihrer Wohnung“ oder „auf der Diele darüber“ handeln. Eine Herkunftsangabe wie „die Nachbarin aus dem Vorderhaus“ ist dagegen kein Ortswechsel.
- Stimmen Reiseprosa, Header und festes Szenenbild auf derselben Raumseite überein? Ein als Innenraum markierter Schauplatz darf Straße/Gehweg nur als kurzen Anfahrtsauftakt nutzen; die Szene muss den Eintritt vollziehen, im dargestellten Raum spielen und dort enden. Die Bild-Matrix ist fallübergreifende Weltwahrheit, nicht bloß Kessler-Sonderlogik.
- Die positive Pflicht, den festen Innenraum ausdrücklich in der Prosa zu etablieren, gilt für Reise-/Ankunftsszenen. Ein laufender Dialog im bereits etablierten Raum darf den Ort sprachlich implizit lassen; sonst kann der Guard einen korrekten NPC-Klick in einen inhaltslosen Ankunfts-Fallback verwandeln. Explizite Neueintritte, Abgänge oder Außenszenen bleiben über die Bewegungs-Gates verboten.
- Erfindet eine Nicht-Reise-Aktion im bereits betretenen Innenraum eine zweite Ankunft? „Du trittst erneut über die Schwelle“, „du betrittst den Laden“ oder ein bereits anwesender NPC „ist dir gefolgt“ sind ohne sichtbaren Abgang Reentry-Drift. Repair und Fallback müssen dabei einen gebundenen Kern-Indiz-Payoff erhalten, statt den Fund zugunsten der Ortskorrektur zu verlieren.
- Behauptet eine Erstankunft eine unbelegte Vorbegegnung am selben Ort? Das strukturierte Reise-Log unterscheidet ersten Zieleintrag und echte Rückkehr. Beim Erstbesuch sind „vorhin schon einmal hier“, Wiedererkennen als Besucher oder ähnliche erfundene Zeitkontinuität verboten; Bekanntschaft von einem anderen Ort bleibt erlaubt.
- Stimmen Ruf-Anspielungen mit dem strukturierten Begegnungslog überein? „Nicht gerade zimperlich“, „ruppig“, „hart angefasst“ und ähnliche Milieu-Gerüchte dürfen nur eine tatsächlich hart angegangene Person nennen. Eine höflich befragte Zeugin bleibt auch dann höflich befragt, wenn ein unsichtbarer Indiz-Payoff ein mehrdeutiges Verb wie „greifen“ enthält; Objekt-/Hotspot-Prosa darf niemals als Gewalt gegen die einzige anwesende Figur gezählt werden.
- `W6-BLOCK`, NPC-Terminalzustände und `ORT-PROSA-BRUCH` immer gegen den echten Szenentext verifizieren.

### 2. Historische Fakten: Korrektheit und Interessantheit

- Neben Kalenderdaten auch relative Fallzeiten prüfen: Eine Beute kann nicht „seit zwei Tagen“ beim Hehler liegen, wenn der Diebstahl erst in der vergangenen Nacht geschah. Tatzeit, Transportdauer, Besitzdauer und aktuelle Engine-Zeit müssen gemeinsam stimmen.
- Ausgeschriebene Datums-/Wochentagspaare werden zusätzlich vor dem Szenen-Commit maschinell geprüft. Nachtbereiche müssen beide Tage eindeutig zuordnen (z. B. „Dienstag auf Mittwoch, 29./30. September“); „Mittwoch, 29. September 1953“ ist falsch.
- Ereignisphasen immer mit Synonymen prüfen: `Beerdigung` ist beim Reuter-Anker ebenso datumsgebunden wie `Trauerfeier`, `Staatsakt` und `Beisetzung`. Vor dem 3. Oktober 1953 sind nur Tod, Trauer und Vorbereitungen zulässig; am 3. Oktober das heutige Ereignis; danach ausschließlich klarer Rückblick.

- Jeden behaupteten Wochentag gegen das Datum prüfen, bevorzugt reproduzierbar per Datumsfunktion/Skript.
- Uhrzeit, Engine-Tageszeit, Licht und Wartehandlung gemeinsam prüfen. Ein kanonisches Ereignis „gegen 19 Uhr“ darf am 14. Oktober weder im Engine-Nachmittag verbleiben noch als „letztes Tageslicht“ beschrieben werden; ein ausdrücklicher Warten-Hotspot muss die Engine vor der Szene passend fortschalten.
- Namen von Straßen, Plätzen, Bahnhöfen, Behörden, Marken, Fahrzeugen, Gesetzen, Medien und Personen auf den Stand des konkreten Run-Datums prüfen.
- Historische Ereignisse nicht nur auf ihr Hauptdatum, sondern auf ihre gesamte Phasenfolge prüfen: Ankündigung/Vorbereitung, Ereignis, Nachwirkung und Rückblick. Nach einem bereits vergangenen Staatsakt, Begräbnis, Prozess oder Sendetermin darf keine spätere Szene mehr von „Vorbereitungen“, „morgen“ oder einem bevorstehenden Ereignis sprechen. Widersprüchliche Zeitformen innerhalb desselben Spieltags sind ein P1-Befund.
- Dasselbe Gate gilt vor dem Ereignis in Gegenrichtung: Eine Szene am 1. Oktober darf Reuters Beisetzung vom 3. Oktober nicht schon als geschehenen „Bericht über die Beisetzung“, Fotografie oder Rückblick behandeln. Vor dem Termin braucht der Satz eine eindeutige Zukunfts-/Vorbereitungsmarkierung oder das konkrete kommende Datum; am Ereignistag eine Gegenwartsmarkierung; danach einen ausdrücklichen Rückblick.
- Tod, Trauerfeier/Staatsakt und Beisetzung getrennt verifizieren; diese Daten nicht aus einem bloßen Todesdatum ableiten. Für Ernst Reuter gilt: Tod 29.09.1953, Staatsakt und Beisetzung 03.10.1953. Ab 04.10. sind nur ausdrücklicher Rückblick, fortdauernde Trauer und die Nachfolgefrage zulässig.
- Bei Unsicherheit recherchieren; technische oder historische Behauptungen nur mit belastbarer Quelle korrigieren.
- Sektorlogik beachten: Ost/West, Währung, Polizei, Versorgung, Öffnungszeiten und Verkehrswege.
- Auch die vom Prompt angebotenen historischen Beispielrequisiten gegen den aktuellen Sektor prüfen. Eine West-Berliner Erstbeschreibung darf nicht unkommentiert aus Ost-Versorgung (`HO`, `Konsum`, Lebensmittelkarte, Bezugsschein, Ostmark, `VEB`/`FDGB`) schöpfen; sektorübergreifende Herkunft muss ausdrücklich motiviert sein.
- Exportblock `Historische Anker (Lektorat)` auswerten. Ein stabiler Run enthält mindestens einen spezifischen, überraschenden und handlungsrelevanten Fakt; bloßes Namedropping genügt nicht.
- Vor Freigabe einen gezielten Anachronismus-Schlusscheck ausführen.

### 3. Prosa-Redundanz und Stil-Tics

- Wiederholungen wie `nagelt müde`, `Kopfsteinpflaster`, `Zigarillo`, `Bohnerwachs`, `Dämmerung wirft Schatten` und verwandte Motive runweit zählen.
- Wiederkehrende Anfahrts-, Motor-, Tür-, Rauch-, Wetter- und Schmerzschablonen markieren.
- Wiederholt bestätigte eindeutige Sprachfehler eng im zentralen Sanitizer korrigieren: beobachtet sind insbesondere „Du must“→„Du musst“ und im Verwertungskontext „das Etui zu Gold macht“→„zu Geld macht“. Nur sichere 1:1-Korrekturen; echte Gold-, Material- oder Alchemieaussagen nicht breit umschreiben.
- Lange Erzählabsätze dürfen nicht als vollständige direkte Rede in einem äußeren ASCII-Anführungszeichenpaar stehen. Der Sanitizer muss neben Pronomen-/Artikelanfängen auch einen aktuellen Cast-Namen als narrativen Absatzanfang erkennen; echte kurze Repliken und innere Dialog-Anführungszeichen bleiben erhalten.
- Anführungszeichen im semantischen Browser-DOM-Snapshot können reine Serialisierungszeichen für Text mit Doppelpunkt oder Dialog sein. Sie zählen erst nach visueller Kontrolle des gerenderten Absatzes als echter Quote-Wrapper-Befund.
- Reparatur-/Fallback-Prosa muss vollständig in der Spielwelt bleiben. Wendungen wie „die eigentliche Szene“, „im dargestellten Innenraum“, „laut Engine“ oder „sichtbare Ansatzpunkte“ sind Regie-/Metasprache und auch bei mechanisch korrektem Ergebnis ein Abbruchgrund.
- Jede sichtbare Szene braucht eine ausformulierte, konkrete Prosa. Ein oder zwei trockene Routing-/Regiesätze wie „Du betrittst Ort X“, „Du lässt den Blick wandern und entscheidest, wo du beginnst“ oder „Wähle nun …“ gelten auch ohne wörtliche Engine-Begriffe als `scene_prose_underwritten` und werden vor der Anzeige neu geschrieben.
- Die Mindestprosa etabliert mindestens drei konkrete Beats: gegenwärtiger Ort/Atmosphäre, sichtbare Figuren oder relevante Requisiten und Karls tatsächlich gewählte Handlung beziehungsweise unmittelbare Beobachtung. Eine bloße Menübeschreibung, Aktionszusammenfassung oder technische Entscheidungshilfe ist keine Szene.
- Enthält eine verworfene Modellantwort mehrere harte Brüche gleichzeitig, darf der deterministische Fallback nicht nach der ersten Korrektur aufhören. Nach jedem Eingriff wird die vollständige Weltwahrheit erneut validiert, bis alle verbleibenden Brüche bereinigt sind oder ein begrenzter Sicherheitsabbruch diagnostiziert wird. Bei physischem Zielgut müssen dabei Prosa **und** JSON-Felder (`inventar_hinzugefuegt`, Abschluss-/Klientenflags) zurückgesetzt werden; sonst kann eine sichtbar korrigierte Fundszene den Fall mechanisch trotzdem beenden.
- Die Eröffnung darf den dem Klienten bekannten letzten Aufbewahrungsort eines Diebstahlobjekts nennen, aber keinen erst durch eine spätere Untersuchungsaktion sichtbaren Kern-Indiz-Payoff vorwegnehmen. Staubrand, Abdrücke, Vertiefungen und daraus gezogene forensische Schlüsse erscheinen erst, wenn der Spieler den betreffenden Ort oder Gegenstand tatsächlich untersucht.
- Stil-Tics klar von Logikfehlern trennen.
- Bewusst wiederholte Indiz-Motive nicht als Pumphrase entfernen, wenn ihre Wiederkehr Beweisfunktion oder Payoff hat.
- Eine Prompt-Warnung allein gilt nicht als Schutz, wenn ein Stil-Tic im sichtbaren Run trotzdem erneut erscheint. Enge deterministische Hardcaps dürfen reine Dekorationswiederholungen entfernen, müssen aber den tragenden Hauptsatz erhalten und Beweisverwendungen ausdrücklich ausnehmen. Beispiel: Friedas erneutes Zigarillo-Tableau wird nach der Einführung gestrichen; Zigarillo-Asche als gebundenes Brandt-Indiz bleibt vollständig erhalten.
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
- Desktop-Scrolltest nach jeder neuen Szene: Die automatische Leseposition zeigt den Anfang des neuen Szenentexts mit etwas Luft unter dem Statuskopf. Sie darf nicht ungefragt bis zum Szenenbild oder Aktionsmenü springen; Bild und Aktionen erreicht der Spieler anschließend durch eigenes Herunterscrollen.
- Bei konkret begonnenen Hotspot-/Indizhandlungen muss der Fund noch am Ausgangsort vollständig ausgespielt werden. Ein Tageszeitwechsel darf nicht vor dem Payoff eine Sperrstunden-Umleitung auslösen und dadurch Header/Bild/Engine-Ort etwa von der Spedition in Karls Büro versetzen.
- Vor jeder mechanischen Kern-Indiz-Buchung ist der aktuell zu rendernde Szenenentwurf zu prüfen und gegebenenfalls dort zu reparieren – niemals nur die bereits abgeschlossene Vorgängerszene. Popup/Log und sichtbare Prosa müssen denselben definierenden Befund tragen (z. B. Tetzlaff: mittwochs keine Überstunden, Robert geht früher).
- Bei strukturierten Indiz-Mikroszenen Forensik und akute Gefahr trennen: Wörter wie „rohe Gewalt“, „Stemmeisen“, „Schlagspuren“ oder „greifen“ beschreiben häufig eine vergangene Tat am Objekt. Ohne tatsächlich gegenwärtigen Angreifer dürfen sie weder Karls Gewaltruf erhöhen noch allein `Spannung=4/5`, Action-Streak oder Fluchtmodus auslösen. Szene-Objekt, Header und Reise-/Schlafgates müssen denselben gedeckelten Spannungswert sehen.
- Klienten-Geduld, Mahnung, Frist, Auftragsentzug und Abschlussbereitschaft.
- Klientenhonorar und Kasse müssen ebenfalls synchron bleiben: Eine bloße Antwortszene darf keinen Vorschuss, keine Anzahlung, keinen Geldumschlag und keine Ausgabe erfinden, wenn die Engine kein entsprechendes Kassen-Delta verbucht. Bei Krause werden die vereinbarten 200 Ostmark erst bei Rückgabe des Etuis fällig; bis dahin bleibt die Kasse unverändert.
- Bei Diebstahlsfällen sind **Fund, Sicherung und Rückgabe drei getrennte Zustände**. `inKarlInventory` bedeutet nur: Karl trägt das Zielobjekt. Weder ein KI-Feld `klient_berichtet`, eine Nachricht/Mahnung des Klienten noch die bloße Sicherungsprosa darf daraus Fallende, Honorar oder „zurückgebracht“ machen. Erst `returnedToClient` nach einer sichtbaren persönlichen Übergabe löst den Fall.
- Der Win-Screen selbst ist die letzte Schranke: Bei Objekt-Diebstählen darf er ohne `returnedToClient` weder erscheinen noch Honorar verbuchen. Ein Kern-Indiz-Fund in Tasche/Lager muss zuerst den separaten Sicherungsbutton und danach die persönliche Klientenübergabe freischalten.
- Dieselbe Zahlungswahrheit gilt für Informanten und Zeugen: Rollenbeschreibung, Sozialprofil, sichtbares Button-Label, Leistbarkeitsgate, tatsächliche Abbuchung/Inventarübergabe, Toast und Prosa müssen exakt denselben Preis und dieselbe `UND`-/`ODER`-Bedingung nennen. Eine Figur darf nicht im Setup „30 Westmark plus Korn“ fordern, während der Button „15 Mark / Ware“ abbucht. Sind Geld und Ware gleichzeitig vorhanden, muss das Label genau die von der Engine ausgewählte Zahlungsart nennen; Prosa darf keine bloß verfügbare Alternative ausspielen. Nach Warenzahlung muss der Gegenstand aus „Dabei“ verschwinden und einen zum Empfänger passenden Owner besitzen, nach Geldzahlung muss die Kasse exakt sinken und die Ware bleiben. Regressionen prüfen den echten Zustandsübergang, nicht nur die Argumente eines `_itemMove`-Stubs. Figurenbezogene Tausch-Ausnahmen bleiben zielgebunden; Bornsteins einzelne Flasche Korn darf nicht automatisch jeden Informanten öffnen.
- Diese Klientenökonomie gilt bereits im Opening: Ein Honorar „bei Rückgabe“ darf dort weder als Scheine/Umschlag auf dem Tisch liegen noch von Karl gezählt, genommen oder kassiert werden. Ein Opening-Fallback muss Auftrag und Kasse korrigieren, den Klienten aber anwesend und anklickbar lassen; der spätere Antwort-/Abgangs-Fallback wäre hier selbst ein Kontinuitätsfehler.
- Romantik-Klick-Zähler, Abkühlschritte, Personenwechsel/Reset und tatsächlicher `Rm`-Wert.
- `personenImRaum`-Teleport, stille Begleitung und unerklärter Ortswechsel.
- Bei einer mechanisch bereits gestarteten Gruppen-Konfrontation gilt auch die Gegenrichtung: Jede noch physisch anwesende und in der Konfrontations-UI auswählbare Person muss beim Eintritt namentlich in der Prosa dramatisiert und in `personenImRaum` geführt werden. Ein Gegner darf weder als unsichtbares UI-Ziel existieren noch nur im strukturierten Roster stehen, während die Erzählung eine kleinere Gruppe behauptet. Entfernte/geflüchtete Figuren bleiben ausgenommen; spätere Kampfszenen müssen bereits ausgeschaltete Körper nicht in jedem Absatz erneut aufzählen.
- Dieselbe Gruppen-Roster-Wahrheit gilt nach einer friedlichen Auflösung: `beruhigt` bedeutet nicht `verschwunden`. Solange kein sichtbarer Abgang und kein echter Ortswechsel erfolgt, müssen beruhigte Figuren in Prosa, Szenenbild, `personenImRaum` und Personen-UI am selben Ort bleiben, dürfen aber nicht erneut als feindlich oder bewaffnet inszeniert werden. Krause-Pflichtprobe: Nach einer Dreifach-Deeskalation bleiben Frieda, Kalle und Jochen während der anschließenden Lagerfunde als passive Anwesende konsistent.
- `beruhigt` bedeutet ebenso wenig `k.o.`: Eine nur mit Worten deeskalierte Figur bleibt ohne ausgespielten Treffer auf den Beinen. Formulierungen wie „vom Boden aus“, Liegen, Knien, Kauern, Zusammenbrechen oder ein bildlicher KO-Zustand sind bei einem reinen Friedenspfad ein Körperzustandsbruch.
- Schon die Eröffnung muss Engine-Ort, Header, Bild und Prosa synchronisieren. Bei geteilten Orten gilt der physische Szenen-Roster streng: Eine Zielperson, die laut Prosa noch draußen am Kiosk wartet, darf im bereits aktiven Hinterhof weder in `personenImRaum` stehen noch direkt ansprechbar sein.
- Dieselbe Roster-Wahrheit gilt nach einem sichtbaren Abgang: Wer laut Prosa durch eine geschlossene Tür in ein anderes Gebäude geht oder den aktuellen Subort verlässt, darf dort unmittelbar danach weder in `personenImRaum` noch als anklickbares Personenziel fortbestehen. Eine spätere Befragung braucht eine erzählte oder deterministische Rückkehr (zum Beispiel „Robert im Hinterhof abpassen“). Ein aktiver, technisch reagierender Button für eine physisch unerreichbare Figur ist kein klassisch „toter“ Button, aber ein ebenso fundamentaler UI-/Kontinuitätsfehler.
- Fehlt `personenImRaum`, darf ein bloßer Name im Opening-Text keine inaktive Orts-/Zeitbindung überstimmen. Snapshot-Ausnahmen überbrücken nur einen im selben Render verbuchten Stage-Wechsel; eine Figur mit Bindung „Abend/Nacht“ wird durch eine Erwähnung am Nachmittag nicht physisch anwesend oder anklickbar.
- Auch semantische Abgangsvarianten prüfen: „verlässt den Hof/Ort/das Haus“, „macht sich davon“ oder „verschwindet“ widersprechen einem unveränderten Engine-Ort ebenso wie „flieht/rennt hinaus“. Ein Beobachten-/Warten-Klick darf Karl nicht eigenmächtig wegschreiben.
- Gerichtete schnelle Bewegung ist ebenfalls ein vollzogener Abgang: „sprintet/eilt/hetzt über den Hof Richtung Stallschreiberstraße/Gasse/Ausgang“ darf nach einem Bedrohen-, Befragen- oder Kampfzug nicht still den festen Innenraum verlassen. Bleiben Engine-Ort, Bild und anklickbare Personen im Laden, muss die Prosa ebenfalls dort enden; erst ein ausdrücklich gewählter Reise-/Fluchtweg darf Karl hinausführen.
- Ein Abgang braucht weder Flucht noch Abfahrt: „geht zur Straße“ und „steuert seinen Opel an, um den Beobachtungsposten zu verlassen“ vollziehen den Ortswechsel bereits und sind ohne Reisebefehl ebenfalls zu blockieren.
- Auch zweckgebundene Euphemismen prüfen: „entfernt sich leise, um nicht entdeckt/gesehen/bemerkt zu werden“ schreibt Karl aus dem Beobachtungsposten und ist ohne Reise-/Fluchtbefehl ein vollzogener Abgang.
- Gleiches gilt für Inversionen und bevor-Sätze: „zieht sich zügig zurück, bevor ihn ein Anwohner bemerkt“ ist semantisch derselbe Abgang.
- Funktionieren Buttons, Zielbindung, Karten-Vorauswahl, Öffnungszeiten, Reise-, Schlaf-, Heil- und Abschlusswege ohne Sackgasse?
- Sichtbare Buttons und Aktionen dürfen nie „tot“ sein: Jeder Klick muss genau eine erkennbare, zum Label passende Wirkung auslösen – etwa Menüöffnung, Auswahlzustand, Toast, Reise, Szenenwechsel oder belastbare Zustandsänderung. Kein stilles Nichts, kein bloßes Schließen ohne Rückmeldung, kein leeres Untermenü und kein teurer KI-Request ohne Prosa-/Statusfolge.
- Wiederkehrende Händler-/Fundort-Sortimente auf echte Variation prüfen: Trude darf nicht in jedem Fall dieselbe vollständige Itemliste anbieten. Eine pro Ermittlung persistente, historisch plausible Teilmenge soll taktische Alternativen und genügend vorbereitbaren Tauschwert bieten, ohne beim erneuten Öffnen desselben Laufs neu zu würfeln.
- Mehrdeutige offene Fäden sind ebenfalls als UI-Fehler zu behandeln: Nennt ein Rettungs-/Übergabeschritt mehrere zulässige Zielorte, muss jeder Ort als eigene, exakt beschriftete Auswahl erscheinen. Ein kombinierter String wie „Wohnung oder Polizeirevier“ darf weder per Teilstring still den ersten Ort vorauswählen noch eine Schutzfahrt an einen unbeteiligten Zwischenort umleiten.
- Bei physischen Zielpersonen die Zustandswörter streng trennen und nur einmal auslösen: `gefunden` beim ersten belegten physischen Auffinden, `befreit` nach gelösten Fesseln/überwundenem Bewacher, `in Begleitung` bzw. `im Opel` während des Transports und `sicher übergeben` erst beim Klienten oder bei der Polizei. Eine spätere Übergabe darf keinen zweiten „gefunden“- oder generischen „überführt“-Toast erzeugen.
- Stale UI nach Zustandswechsel mitprüfen: Bereits verbuchte, ausgeschöpfte, entfernte, nicht mehr anwesende oder aktuell gesperrte Ziele dürfen nicht weiter aktiv anklickbar bleiben. Der Klick-Handler muss denselben Live-Zustand erneut validieren wie der Renderer; ist eine Aktion nicht ausführbar, wird sie entfernt/deaktiviert oder erklärt den konkreten Grund sichtbar.
- Mehrstufige Haupt-UI-Klicks einzeln und mit sichtbarer Renderpause prüfen: Zielwahl, Verbwahl und „Ausführen“ müssen jeweils einen erkennbaren Auswahlzustand erzeugen. Ein bewusst deaktivierter „Ausgesprochen“-Chip ist kein toter Button; ein aktiver Chip ohne Reaktion schon. Automatisches Durchklicken vor dem nächsten Render darf nicht fälschlich als UI-Defekt gewertet werden.
- Bei jedem manuellen Run nicht nur den bevorzugten Pfad klicken: mindestens eine alternative Sozialtonart, Inventar-/Gegenstandsaktion, Karten-/Zurück-Navigation und – sobald angeboten – Heil-/Schlaf-/Abschlussaktion auf echte Wirkung prüfen. Doppelklicks dürfen weder doppelt abbuchen noch denselben Hinweis oder dieselbe Szene zweimal verbuchen.
- Ortserschöpfungs-Hinweis, Reise-Hervorhebung und tatsächliche offene Interaktionen müssen dieselbe Wahrheit zeigen. Ein physisch anwesender, noch nicht befragter Klient ist ein offener Pflichtschritt, auch ohne klassisches Hinweis-Badge; „hier gibt es nichts mehr“ ist dann falsch.
- Stimmt die Intensität der sichtbaren Aktion mit der Prosa überein? „Stelle zur Rede“/Befragen bleibt verbal; Packen, Gegen-die-Wand-Drücken, Schlagen und daraus erfundene NPC-Verletzungen sind ausschließlich nach einer ausdrücklich gewählten Angriffs-/Kampfhandlung zulässig.
- Taktische Konfrontationszüge sind keine Ermittlungsaktionen: Angriff, Ausweichen, Beruhigen, Bluff, PPK- und Gegenstandseinsatz dürfen nicht allein wegen ihrer Verben ein offenes Personen-/Umgebungsindiz buchen oder die Kampfprosa durch einen kanonischen Indiz-Fallback ersetzen. Kampfgebundene Funde kommen ausschließlich aus dem definierten Combat-Loot-Pfad; eine anschließende echte Befragung bleibt separat fundfähig. Aktionslabel, sichtbare Prosa, mechanischer Kampfstatus und eventuell vergebenes Indiz müssen deshalb nach jedem Konfrontationsklick gemeinsam geprüft werden.
- Wenn der letzte erreichbare Faden eines Orts einen neuen Schauplatz freischaltet, muss die gleiche Szene den Wechsel erzählerisch verdienen: Die Prosa nennt einen konkreten, bereits etablierten Grund, weshalb Karl gerade diesen Kontakt oder Ort aufsucht. Ein Reisebanner oder hervorgehobener Button ohne dramatisierten Anker ist ein Kern-Indiz-/Mechanik-Prosa-Bruch; die Reise selbst bleibt eine Spielerentscheidung.
- Bei strukturierten Haupt-UI-Indizszenen muss das Redundanz-Gate die Zielspur auch dann eindeutig bestimmen, wenn kurzlebige Optionsmetadaten beim API-/Repair-Pfad fehlen. Das persistente `pendingHauptuiIndiz` ist bis zur abgeschlossenen Validierung die maßgebliche Rückfallebene; sonst können live angehängte Doppelzusammenfassungen trotz lokal korrekt arbeitendem Textvergleich durchrutschen.
- Nachgelagerte Pflichtanker dürfen eine unvollständig dramatisierte strukturierte Spur nicht durch einen kanonischen Zusatzsatz verdoppeln. Fehlen definierende Fakten – beim Kessler-Türschild etwa „dritter Stock links“, wenn das Modell nur „dritte Reihe“ schreibt –, ersetzt der vollständige kanonische `fundText` die Modellfassung als eine kohärente Fundszene; bloßes Anhängen erzeugt eine sachlich reparierte, aber stilistisch doppelte Erzählung.
- Relationen zwischen zwei bereits bekannten Einzelfakten bleiben unbelegt, bis ein eigenes Indiz sie herstellt. Das Klingelschild belegt Haukes Wohnung, und die Beobachtung belegt Roberts Eintritt ins Hinterhaus; zusammen beweisen sie noch nicht, dass Robert „direkt zu den Hauke-Wohnungen“ geht. Solche unbeobachteten Ziel-, Täter- und Besitzrelationen sind als Scope-Drift zu behandeln, auch wenn alle beteiligten Namen bereits gefunden wurden.
- Tätermerkmale im Zeugenbericht auch als Substantivkonstruktion prüfen: „seltsamer/auffälliger Gang“, „Gang wie bei einer Verletzung“ und ähnliche Umschreibungen individualisieren einen Täter genauso wie „hinkt/stolpert“. Fehlt dieses Merkmal im gebundenen Indiz, ist es Evidence-Scope-Drift und darf keine neue Verdächtigenfährte erzeugen.
- Jeder identifizierende Teil eines mechanisch vergebenen Kern-Indizes muss im sichtbaren Fundablauf vorkommen, nicht nur im Popup. Beim Krause-Vitrinenfund gehören deshalb Staubrand, silbernes Etui und die Gravur „Für Hugo, 1939, Liesl“ gemeinsam in die Prosa; „das von Krause beschriebene Etui“ ersetzt die konkrete Identifikation nicht.
- **Pflichtprüfung bei jedem einzelnen Szenenbild:** Das Bild wird in jeder Szene aktiv angesehen und mit der aktuellen Prosa verglichen; eine bloße Stichprobe pro Ort oder Run genügt nicht. Geprüft werden Ort und Subort, Innen-/Außenraum, Tageszeit und Wetter, zentrale sichtbare Personen einschließlich Karl, Ein- und Abgänge, Konfliktzustand, Lichtstimmung sowie handlungsrelevante Requisiten. Die Prüfung verlangt keine eigene Bildvariante für jede theoretische NPC-Kombination.
- **Feste Hauptfigur schlägt Variantenangst:** Steht ein zentraler NPC im Orts-Setup mit `immer:true`, gilt er während seiner tatsächlichen Roster-Anwesenheit als Bestandteil des festen Bildvertrags. Das Grundmotiv oder eine vorhandene `presenceVariants`-Fassung muss ihn sichtbar führen; ein leerer Raum, eine anonyme Ersatzfigur oder eine falsche Hauptperson ist ein `BILD-PROSA-BRUCH`. Dafür wird ausdrücklich keine Variante für jede mögliche Nebenfiguren-Kombination verlangt. Die Bildmetadaten `depictsNpcs` dokumentieren die manuell verifizierte Besetzung; echte Gruppen-/Zustandsresolver verwenden `dynamicNpcVisual`. `tests/case-structure-audit.test.js` blockiert neue oder geänderte feste Orts-NPCs ohne Bildabdeckung, und der Renderer meldet Abweichungen im aktuellen physischen Roster zusätzlich zur Laufzeit.
- Für jedes sichtbare Objekt werden Existenz, Anzahl, Position und physischer Zustand abgeglichen: intakt, geöffnet, geschlossen, zerbrochen, leer, gefüllt, bewegt, entfernt, brennend oder erloschen. Die Prosa darf weder einen im Bild offensichtlichen Zustand leugnen noch einen dort nicht dargestellten Zustand als sichtbar behaupten.
- Objektzustände sind außerdem strikt ortsgebunden. Ein etablierter Schaden darf nicht als atmosphärisches Erinnerungsmotiv an einen anderen Schauplatz driften: Krauses zerschlagene flache Schauvitrinen gehören ausschließlich in seinen Antiquitätenladen und niemals in Friedas intakte Hehlerei. Solche Cross-Location-Requisiten sind gleichzeitig `ORT-PROSA-BRUCH` und `BILD-PROSA-BRUCH`.
- Bild, Prosa, `personenImRaum`, Engine-Ort, Header, Tageszeit und der durch die gewählte Aktion entstandene Zustand bilden gemeinsam eine Szenenwahrheit. Als `BILD-PROSA-BRUCH` gilt eine **materielle** Abweichung: falsche zentrale Gesprächs-/Konfliktfigur, fehlende handlungstragende anwesende Person, eine ausdrücklich entfernte Figur weiterhin im Motiv, deutlich falscher Ort oder Tageszustand sowie ein widersprüchlicher handlungsrelevanter Objektzustand. Unwichtige Hintergrundpersonen, geringe Stellungs-/Kleidungsabweichungen und nicht gezeigte Nebenfiguren ohne Szenenhandlung lösen allein keine neue Bildproduktion aus. Ein fundamentaler Bruch stoppt den Demo-Run; danach folgen Fix, Regressionstest, Deployment und Neustart.
- Ein Bild darf nicht nur zur Ankunftsprosa passen, sondern muss nach jedem Zustandswechsel weiterhin stimmen. Verlässt eine Figur den Raum, wird eine Vitrine geöffnet oder zerbrochen, wird ein Gegenstand genommen oder eine Lichtquelle verändert, muss entweder das Folgebild diesen Zustand zeigen oder die Prosa so kadriert sein, dass kein Widerspruch zum festen Motiv entsteht.
- Vor einer Neugenerierung das vorhandene Motiv immer im Detail lesen: Eine Figur kann bereits glaubhaft am Fenster, Balkon, Tresen oder Bildrand vorhanden sein. Dann wird bevorzugt die Prosa an diesen sichtbaren Subort gebunden. Beispiel Kessler: Frau Pohl spricht aus dem linken Erdgeschossfenster und Frau Hauke aus dem oberen Hoffenster; „Pohl tritt einen Schritt näher in den Hof“ ist Prosa-/Subortdrift, aber kein Anlass für eine neue Personen-Kombination.
- Bei mehreren gleichartigen Objekten muss die Prosa das im Bild gemeinte Objekt räumlich eindeutig identifizieren. „Die Vitrine ist unversehrt“ ist unzulässig, wenn das Bild im Vordergrund zertrümmerte Tischvitrinen und hinten eine intakte Standvitrine zeigt. Kern-Indiz, Hotspot, Fundtext und Bild müssen dasselbe konkrete Objekt und denselben physischen Zustand meinen.
- Die kanonische Bildwahrheit muss außerdem in sämtlichen globalen Prompt- und Recap-Blöcken identisch stehen. Krause-Beispiel: zwei zerschlagene flache Auslagen samt Scherben **im Laden**, intakte Straßen-Schaufensterfront, intakte hohe Rückwandvitrine mit offener Tür. Eine alte Promptzeile mit „intakten waagerechten Auslagen“ kann sonst trotz korrektem Bild und korrektem `fundText` neue Ankunftsdrift erzeugen.
- Exakte Lichtmengen sind Bildwahrheit: „nur eine Glühbirne/Lichtquelle“ darf nur stehen, wenn das Szenenbild tatsächlich genau eine zeigt. Deckenlampe, Öl-/Tischlampe, Fensterlicht und sichtbare Leuchten werden gemeinsam gegengeprüft; bei Unsicherheit neutral „gelbes Licht“ beschreiben.
- Dynamische Szenenbilder müssen mindestens alle handlungstragenden Personen des finalen physischen Szenen-Rosters abbilden, besonders Gesprächspartner und Gegner. Nicht jede passive Nebenfigur braucht eine eigene Kombinationsvariante. Eine anwesende, gerade handelnde Figur darf aber weder wegen eines Stage-Wechsels noch wegen einer fehlenden Einzelbild-Variante aus dem Motiv verschwinden; das leere Nachher-Motiv ist nur bei tatsächlich leerem oder dramaturgisch neutral kadriertem Raum zulässig.
- Bei laufenden Konfrontationen gilt der gespeicherte Kampfort bis zum sichtbaren Ende als bindend, auch wenn ein Stage-Wechsel die reguläre Ortsmatrix schon auf den nächsten Schauplatz schaltet. Alle noch physisch dort befindlichen Beteiligten müssen in `personenImRaum`, UI und Szenenbild erhalten bleiben; „beruhigt“ oder „benommen“ bedeutet nicht verschwunden. Zufallsabwesenheit ist an festen Bildorten nur zulässig, wenn die entstehende Kombination mit einem wahrheitsgemäßen Motiv dargestellt werden kann.
- Ebenso ist der Übergang **in** eine Konfrontation zu prüfen: Jede Figur, die beim ersten Angriff sofort eingreift oder als Kampfziel erscheint, muss bereits in der vorigen Ankunftsszene sichtbar/anwesend gewesen sein oder jetzt mit einem plausiblen Eintritt eingeführt werden. Ein zeit- oder stagebedingt abwesender Wachmann darf nicht beim Angriff kommentarlos „aus der Ecke springen“; bei festen Gruppenorten ist der gemeinsame Ortsroster vorzuziehen.
- Zustandswechsel eines handlungstragenden Gegners werden auch innerhalb desselben Ortes bildlich geprüft: `ko`/`benommen` bedeutet sichtbar am Boden oder neutral außerhalb des Bildkaders, niemals weiter stehend; `übergeben`/`abgeholt`/`verhaftet` bedeutet vollständig aus dem Folgebild entfernt. Bei Rettungsszenen bleibt die Zielperson bis zum mechanischen Befreiungsklick sichtbar gefesselt.
- Bei Objektbildern wird nicht nur „intakt oder zerstört“, sondern auch der sichtbare Inhalt geprüft. Eine bestückte Vitrine darf in der Prosa nicht als vollständig leer oder ausgeräumt gelten, wenn lediglich ein konkretes Stück fehlt; umgekehrt darf ein sichtbar leerer Behälter keine weiterhin vorhandene Ware behaupten.
- Pflichtbehandlung ist als Bedienpfad vollständig durchzuklicken. Ein kritischer Verletzungs-Guard darf die direkte Fahrt zum Heilort nie durch Alkohol-, Müdigkeits-, Karten- oder Fortschrittsgates wieder abfangen; sonst entsteht ein fundamentaler `TOTE-AKTION`-/Softlock-Befund. Alle anderen Reiseziele dürfen während der Pflicht weiter gesperrt bleiben.
- Bei einem Engine-Außenort auch stille Subort-Wechsel prüfen: Haus-/Wohnungstür öffnen, Hausflur, Treppenhaus oder Wohnung in der Prosa sind ein `ORT-PROSA-BRUCH`, solange keine Reise bzw. kein strukturierter Ortswechsel stattfand. Hotspot-Name und Fundtext dürfen einen solchen Wechsel nicht selbst anordnen.
- Dasselbe gilt für ortsgebundene Innenmöbel: Eine Figur kann in einer Straßen-, Torweg- oder Hinterhofszene nicht ohne sichtbaren Ortswechsel plötzlich wieder „hinter dem Tresen“, am Schreibtisch oder auf dem Sofa stehen bzw. sitzen. Gerade nach einzelnen Schritten einer Gruppen-Konfrontation muss der etablierte Subort erhalten bleiben.
- Innenraumbegriffe semantisch und in Kurzformen prüfen: „im Flur“, „im Hausflur“, „im Eingangsflur“ und „im Treppenhaus“ sind am Engine-Außenort gleichwertige Driftmarker; ein einzelnes weggelassenes Präfix darf den Guard nicht umgehen.
- Auch Etagen-/Türhandlungen sind Ortsmarker: „an die Wohnungstür im dritten Stock klopfen/klingeln“ setzt Karl physisch auf einen Treppenabsatz und ist am unveränderten Engine-Außenort ebenso ein `ORT-PROSA-BRUCH` wie das ausdrückliche Betreten von Flur oder Treppenhaus.
- Karls Ort kann auch indirekt durch Figurenwahrnehmung festgeschrieben werden: „sie sieht/bemerkt dich im Flur“ ist derselbe Innenraum-Teleport wie „du gehst in den Flur“, selbst wenn Karl im Satz kein eigenes Bewegungsverb erhält.
- Dasselbe gilt für die Quelle von Karls Stimme: „er hört deine Stimme/deinen Ruf aus dem Halbdunkel des Flurs“ setzt Karl physisch in den Flur und ist am unveränderten Engine-Außenort ein `ORT-PROSA-BRUCH`.
- Gleiches gilt für kausative Fremdhandlungen: „sie lässt/bittet/führt dich in den Treppenflur“ vollzieht den Innenraumwechsel, obwohl die andere Figur grammatisches Subjekt ist. Am unveränderten Engine-Außenort muss auch diese Form als `ORT-PROSA-BRUCH` blockiert werden.

- Akute Bedrohungen brauchen immer einen sichtbaren, benannten und spielbaren Ursprung: Revolverlauf oder Messer am Körper, greifende Hand, unmittelbare Drohstimme und tätlicher Angriff sind nur mit passender Person in `personenImRaum`/Cast oder einer bereits mechanisch gestarteten Konfrontation zulässig. Eine unsichtbare Stimme oder Waffe ohne Ziel-/Reaktionsmöglichkeit ist eine fundamentale `PHANTOM-BEDROHUNG`; historische Rückblicke, Akten und berichtete Gewalt sind davon getrennt.
- Dasselbe Roster-Gate gilt für friedliche Szenenakteure: Eine Vermieterin, ein Zeuge, Wachmann oder anderer Einzelakteur darf nicht sichtbar im Raum stehen, Karl beobachten oder handeln, wenn `personenImRaum`, Cast, UI und Bild diese Person nicht führen. Atmosphärische Hintergrundmengen ohne Szenenhandlung sind davon getrennt; eine handlungstragende Person muss vollständig in die gemeinsame Szenenwahrheit aufgenommen oder aus der Prosa entfernt werden.

### 6. Wahrheitsbeat-/Truthbeat-Gate

- Bei `wahrheit`-Fällen sowie jeder `TRUTHBEAT-DIAG`-/`BEAT-DIAG`-Zeile den konkreten Auslösersatz prüfen.
- Strukturierte Kern-Indizien mit expliziter Beat-Zuordnung müssen den zugehörigen Wahrheitsbeat per ID setzen; ein bereits gebuchter Schuldschein, Schlüssel oder ein Geständnis darf nicht wegen eines Regex-/Reihenfolgefehlers als Beat fehlen.
- Nach jedem Fund prüfen, ob der qualitative Stage-Floor nach Erreichen seiner Szenen-Hardgrenze tatsächlich nachzieht. Ein Fall darf nicht auf Stage 1 stranden, während gefundene Stage-2/3-Indizien vorliegen.
- Pro Ermittlungsstufe muss mindestens ein sichtbarer, erreichbarer Fortschrittsweg existieren (Person, Spur, offener Faden oder klar markierter Zielort). Reine Loot-Orte ohne Fallfunktion gelten als tote Orte und dürfen nicht die einzige Lenkung sein.
- Bewusstlose, benommene, gefesselte oder abgeführte Figuren dürfen im Szenenbild weder entspannt sitzen noch frei stehen. Dafür nur grob notwendige Zustandsmotive verwenden; keine kombinatorische Bildflut.
- Begleittiere wie Rex sind keine normalen Gesprächspersonen. Vor der Aufnahme zeigt die UI ausschließlich die Mitnahme-/Tauschaktion, danach nur Begleiter- und Konfrontationskommandos.
- Für jeden tatsächlich besuchten Engine-Ort muss ein passendes Szenenbild oder ein bewusst dokumentierter neutraler Ersatz vorliegen. Ein still auf `hidden` gesetzter Standardort ist im manuellen Bildlektorat ein Fehler.
- Mechanisch gebundene Zeugenaussagen dürfen auch keine über natürliche Verben eingeschmuggelten Tätermerkmale erhalten: Stolpern, Taumeln oder Schwanken ist ebenso eine erfundene Gangart wie Hinken. Die Prüfung muss täterbezogen bleiben; ein Zeuge, der über die eigenen Worte stolpert, ist kein Tätermerkmal.
- Festhalten, ob der Beat durch Spieleraktion, mechanisches Indiz, Geständnis, Zeugenaussage, Gegenstand oder nur durch Regex-Prosa erkannt wurde.
- Reflexions-, Motiv-, Negations-, Rückblick- und bloße Namensnähe dürfen keinen Pflicht-Beat erfüllen.
- Provenienzprüfungen umfassen nicht nur die Richtung einer Schenkung, sondern auch die Eigentumsart: Ein Familienerbstück darf nicht still zu Kommissionsware, Kundenbesitz oder sonstigem Fremdeigentum werden. Harmlose Kundenkontakte ohne Eigentumsbehauptung bleiben erlaubt.
- Datierte Provenienz bindet auch die Dauer: 1939 bis 1953 sind 14 Jahre. Formeln wie „seit ich denken kann“, „seit der Kindheit“, „seit Generationen“ oder „schon immer“ sind bei einem 1939 erworbenen Stück falsch, auch wenn Schenkungsrichtung und Eigentümer stimmen.
- Ein Beat gilt nur dann als erreicht, wenn die erforderliche Wahrheit mechanisch und narrativ ausgespielt wurde.
- Frühe Mehrfachtreffer, Fallbacks und nachträglich eingefügte Prosa besonders auf Doppelzählung prüfen.

## Aktuelle offene Themen – Priorität

1. Truthbeat-Regex-Fehltreffer.
2. Kern-Indiz-Prosa-Mismatch samt Root Cause: Die Ankunfts-Vorwegnahme ist seit v7.12.1339 abgedeckt, einschließlich Objekt–Beweis-Relationen seit v7.12.1341 und vorgezogener Teil-Aussagen zu Schritten/Beobachtung/Tatzeit seit v7.12.1358; v7.12.1340 begrenzt ausgespielte Zeugen-Indizien auf ihren definierten Informationsumfang, v7.12.1342 sperrt markante Cross-Clue-Kontamination, v7.12.1344 erhält auch bei Repair/Fallback die Quellenart Person versus Hotspot/Objekt, v7.12.1350 führt datengetriebene Pflichtanker für mechanisch gebuchte Kern-Indizien ein und v7.12.1352 hält driftanfällige Kernfakten per `fortsetzungsWahrheit` auch in späteren Szenen bindend. v7.12.1362 vereinigt kurzen Zieltext und ausführlichen Pflicht-Payoff; v7.12.1363 bindet physische Objektwahrheit; v7.12.1364 schließt Perfekt-Infinitiv-Leaks; v7.12.1365 sichert den Stemmeisen-Pflichtanker; v7.12.1367 erweitert offene Objektwahrheit auf jede Vor-Fund-Szene. v7.12.1368 deckt benannte Tagesgrenzen und natürliche Fahrzeug-Ladeverben im Ziel-Scope ab; v7.12.1370 ergänzt semantische Zustandsvarianten wie „aufgebrochen/aufgehebelt“ für die kanonisch intakte Vitrine. Der vollständige Wegener-Gegenlauf v7.12.1471 bestätigt `lothar_schluessel`: Lothars sichtbare Aussage nennt Lagerhalle, Werftgelände, Festhalten und geplanten Gang zur Volkspolizei deckungsgleich mit der mechanischen Indizbuchung. Damit ist dieser Repro-Fall geschlossen; weitere Indizien bleiben zu annotieren und manuell stabilitätszubestätigen.
3. Lola-Präsenz-Widerspruch als generalisierbarer NPC-Kontinuitätsfall. Die verwandte Ruf-/Begegnungszuordnung ist seit v7.12.1357 strukturell abgesichert: ruhige Engine-Indizklicks können durch Wörter ihres Pflicht-Payoffs nicht mehr als Gewalt zählen, und sichtbare harte Gerüchte werden gegen die tatsächlich hart bzw. fair geloggten Namen validiert. Seit v7.12.1361 blockt ein zusätzliches Konfrontations-Roster-Gate Ankunftsszenen, in denen ein mechanisch auswählbares Gruppenmitglied weder in Prosa noch `personenImRaum` sichtbar ist; weitere Nicht-Konfrontationsvarianten bleiben zu generalisieren.
4. Ort-/Zeit-Prosa-Bruch-Fix weiter generalisieren: v7.12.1321 deckt nach Kessler K2 auch nichtsoziale Außenort→Innenraum-Teleports ab; v7.12.1343 sichert zusätzlich Kesslers geteilte Startposition Hinterhof/Straße und den physischen Szenen-Roster, v7.12.1345 ergänzt Klopfen/Klingeln an Etagen-/Wohnungstüren, v7.12.1346 indirekte Flur-Präsenz über Figurenwahrnehmung, v7.12.1347 ruhige Abgänge zu Straße/Opel, v7.12.1348 den kanonischen 19-Uhr-Wartewechsel auf Abend und v7.12.1349 zweckgebundene Entfernen-Euphemismen. v7.12.1366 erhebt die fallübergreifende Bild-Matrix zur Hard-Guard-Wahrheit und deckt Krauses Laden-Innenraum sowie unbelegte Erstbesuchs-Rückblenden ab; v7.12.1369 blockt zusätzlich erfundene Neueintritte bei Nicht-Reise-Aktionen im bestehenden Innenraum. v7.12.1371 begrenzt die positive Innenraum-Etablierpflicht auf echte Ankünfte, damit ein knapper laufender Dialog nicht als Ortsbruch verworfen wird; v7.12.1372 blockt zusätzlich unbelegte schlichte Wiedererkennung beim Erstkontakt, lässt sie nach belegter früherer Begegnung aber zu. v7.12.1388 erkennt nun auch Karls aus dem Flur kommende Stimme als vollzogene Innenraumposition und bietet historische NPC-Requisiten sektorabhängig an. Weitere manuelle Gegenläufe stehen aus.
5. Fall-Abschluss-Doppelerzählung aus dem Kessler-Run.
6. `INDIZ-GATE`-`fundModus`-Rigidität.
7. Verletzungs-Konsistenz-Gate weiter hart prüfen. Symptom A des Behandlungs-Status-Widerspruchs ist im Wegener-Gegenlauf v7.12.1471 bestätigt geschlossen: Charité/Marlene wird trotz fünf Phasen bei `Vf≤2` korrekt als professionelle Behandlung exportiert. Offen bleiben Gegenläufe für andere Heilorte, alte Spielstände sowie das Abschluss-/Softlock-Gate.
8. Romance-Zähler-Reset.
9. NPC-Zeitkontinuität und Clubschluss-Beobachtung.
10. Stil-Tic-Besserung durch einen vollständigen Krause-Gegenlauf bestätigen.
11. Echter Blind-Test vor Alexanders erster Session.
12. Gezielter Anachronismus-Schlusscheck.
13. Optional: Stasi-Fall bis zur Vollmer-Konfrontation.

## Bestätigter Wegener-Gegenlauf v7.12.1471

- 32 Szenen, Fall gelöst, Stage 4, alle 5 Kern-Indizien.
- Bestätigt: `lothar_schluessel` wird mechanisch und sichtbar deckungsgleich dramatisiert.
- Bestätigt: professionelle Charité-/Marlene-Behandlung wird im Export korrekt erkannt.
- Unauffällig: 0 `ORT-PROSA-BRUCH`, funktionierende W6-/Threat-Sperren, eine plausible Klientenmahnung, konsistentes Romance-Cooling und 9 historische Anker in 5/8 Bildungsachsen.
- Kalendercheck: Freitag, 13. Februar 1953, und Samstag, 14. Februar 1953, stimmen. Der Reuter-Kontextfix wird durch diesen Februar-Run ausdrücklich **nicht** getestet.
- Der allgemeine Übermüdungs-Fahrstopp bleibt als sinnvolle Konsequenz erhalten. Seit v7.12.1473 sind nur direkte Schutzfahrten mit einer bereits geretteten Zielperson davon ausgenommen, damit der Übergabeweg nicht an einen unbeteiligten Ort driftet.
- Beobachtung: `müde` 4× und `Kopfsteinpflaster` 3× bleiben unter dem alten Referenzwert, werden aber in weiteren Gegenläufen weitergezählt.
- Szene 28 benötigte nach zwei Modell-Retries den begrenzten `fixed_interior_image_drift`-Hard-Fallback. Das sichtbare Ergebnis war korrekt; ähnliche Innenraumszenen bleiben als Robustheitsbeobachtung im Lektorat.

## Bestätigter Cross-Case-Fallback-Fix v7.12.1474

- Kessler und Krause verwenden beide die interne Indiz-ID `nachbarin_aussage`. Ein alter ID-only-Hard-Fallback konnte deshalb Frau Pohls Kessler-Aussage mechanisch korrekt buchen, aber sichtbar durch Hannelore Wirths Krause-Aussage ersetzen.
- Personen-Fallbacks werden nun aus dem konkret gebundenen NPC und dem aktuellen Indiztext erzeugt; eine globale, fallfremde Spezialprosa wird nicht mehr über die ID ausgewählt.
- Der Regressionstest führt beide gleichnamigen Indizien direkt nacheinander aus und verlangt jeweils den eigenen Cast, Fallinhalt und Zeitraum sowie die Abwesenheit der fremden Merkmale.

## Krause-Eröffnungs-/Tatort-Gegenlauf v7.12.1475

- Ein frischer manueller Run zeigte den Bild-/Objektbruch bereits in Szene 1: Krause behauptete im Büro, die hohe Rückwandvitrine sei aufgebrochen worden. Kanonisch zerschlagen sind ausschließlich die zwei flachen Schauvitrinen; die hohe Rückwandvitrine bleibt unversehrt und nur ihre Tür steht offen.
- Tatort-Bildwahrheit gilt deshalb nicht erst beim Betreten des Tatorts, sondern schon in Auftragsbericht, Rückblick, Gespräch und Reiseprosa. Der Guard bindet Schaden und konkretes Objekt innerhalb desselben Teilsatzes, damit die korrekte Gegenüberstellung „flache Vitrinen zerschlagen; hohe Vitrine intakt“ erlaubt bleibt.
- Der Eröffnungs-Hard-Fallback erhält Auftrag, Etui-Provenienz, Tante-Frieda-Spur, ausstehendes 200-Ostmark-Honorar, Klientenpräsenz und den korrekten Objektzustand gemeinsam. Ein fundamentaler Eröffnungsbruch führt nach Fix und Deployment zum Neustart des Runs.

## Krause-Zeugenaussage-Gegenlauf v7.12.1476

- Ein alternativer Täuschungs-/Gesprächspfad bei Hannelore Wirth ergänzte das mechanische Indiz „zwei Männer mit schwerer Tasche aus dem Hinterhof“ um ein unbelegtes Fluchtfahrzeug: Die Männer hätten die Tasche „in einen Wagen gewuchtet“ und seien „davongefahren“.
- Der Evidence-Scope-Guard erfasst nun auch berichtete Rede im Konjunktiv und Partizipkonstruktionen wie `gewuchtet hätten`, `geladen hätten`, `geworfen hätten` sowie `davongefahren seien`. Das Fahrzeug bleibt gesperrt, solange es nicht ausdrücklich im Ziel-Indiz definiert ist.
- Positive Gegenprobe: Zwei Männer, schwere Tasche und Hinterhof bleiben ohne Fahrzeugbehauptung zulässig. Der Fix gilt datengetrieben für Personen-Indizien aller Fälle.

## Kessler-Abpassen-/Bild-Gegenlauf v7.12.1477

- Eine reine Verfügbarkeitsbrücke darf kein Personen-Indiz auslösen. „Robert im Hinterhof abpassen“ stellt Robert nur physisch für die nächste bewusste Befragung bereit; es ist weder Geständnis noch Kern-Indiz-Fund.
- Personen-Indiz, Popup und Prosa werden nach jeder Brücken-, Warte- und Ankunftsaktion gegengeprüft. Nennt die Szene nur eine Ausflucht oder Karls Frage, darf die Mechanik daraus nicht bereits ein Eingeständnis samt bisher unbekanntem Vornamen machen.
- Eine handlungstragende Zielperson muss schon im Bild der Abpass-/Begegnungsszene sichtbar sein, auch wenn noch keine formale Kampf-Konfrontation läuft. Kesslers ziviles Robert-Gegenüberbild gilt daher bereits für die deterministische Abpassen-Brücke.

## Historische Sektor-Kulisse v7.12.1478

- Historische Korrektheit wird nicht nur gegen Datum und Wochentag, sondern auch gegen den aktuellen Sektor geprüft. Ein für Ost-Berlin plausibles Detail ist in einer West-Berliner Szene weiterhin ein harter Historien-/Ortfehler.
- `HO`, `Konsum`, Lebensmittelkarten und Marken-Schlangen gehören 1953 in den Ostsektor. In West-Berlin war die Lebensmittelrationierung seit 1950 aufgehoben; am Kurfürstendamm, in Charlottenburg, Moabit, Tempelhof und Schöneberg sind freie Schaufenster, Markenwerbung und Westmark die passende lokale Textur.
- Der Check gilt für beiläufige Straßenkulisse ebenso wie für handlungstragende Prosa. Eine ausdrücklich historische Rückblende oder eine korrekte Verneinung („kein HO-Laden“) darf nicht als Drift fehlklassifiziert werden.
- Bei jedem Szenenbild-/Prosa-Abgleich zusätzlich fragen: Gehören sichtbare Warenwelt, Uniformen, Verkehrsmittel, Behörden und Zahlungsmittel wirklich zum aktuellen Sektor? Nur grobe, konkret sichtbare Widersprüche benötigen eine andere Bildvariante; reine Prosafehler werden in der Prosa korrigiert.

## Handlungstragende Ankunftsbilder v7.12.1479

- Die Bildprüfung beginnt bereits in der Ankunftsszene, nicht erst nach dem Klick auf eine Konfrontations-/Abpassen-Aktion. Ist eine Zielperson laut Prosa physisch am Ort und im aktuellen `personenImRaum`-Roster anklickbar, muss eine vorhandene passende Begegnungsvariante sofort verwendet werden.
- Der Szenen-Roster ist enger als eine feste Ortsbindung und verhindert Variantenexplosion: Nur tatsächlich gegenwärtige, handlungstragende Figuren schalten das Gegenüberbild frei. Verlässt die Figur die Szene, fällt das Bild ohne neue Spezialkombination auf das normale Ortsmotiv zurück.
- Kessler-Repro: Bei der Rückkehr in den Hinterhof steht Robert bereits am Eingang von Hausnummer 24 und ist anklickbar. Schon diese Szene nutzt das zivile Robert-Gegenüberbild; das leere Pohl-/Hauke-Hofmotiv wäre ein grober Personen-/Bildbruch.

## Konfrontationsabschluss-/Abgangswahrheit v7.12.1483

- Nach jeder mechanisch beendeten Konfrontation werden Endsatz, `personenImRaum`, Aktionsmenü, NPC-Status und Szenenbild gemeinsam geprüft. Ein Gegner darf nicht im Text weiter „lauern“, „verharren“ oder stehen bleiben, wenn Engine und Bild ihn bereits entfernt haben.
- Eine friedliche Deeskalation eines **Einzelgegners** endet sichtbar mit einem eindeutigen Abgang. Die Engine entfernt widersprechende Verharrenssätze deterministisch und ergänzt bei Bedarf den Abgang; das gilt fallübergreifend.
- In einer **Gruppen-Konfrontation** bedeutet `beruhigt` dagegen immer: Der Teilgegner steckt sein Kampfmittel weg, tritt aus der Front zurück und bleibt passiv im gemeinsamen Szenenbild – auch wenn er der letzte aktive Gegner war. Er verlässt den Ort nicht. Vor allem darf die Prosa keinen weiterhin aktiven Gegner „ihm folgen“ lassen. Beim letzten Gegner gibt die beruhigte Gruppe den Zugang frei, bleibt aber als passiver physischer Roster am Ort. Prosa, Bild und Personenbuttons müssen identisch bleiben.
- Dieser Friedensstatus gilt auch in jeder anschließenden Fund-/Durchsuchungsszene: Erneut „angespannte Körper“, kampfbereite Haltung, zuckende Hände am Griff oder ein scheinbar wieder endender Spielraum sind ebenso Re-Eskalation wie ein gezogenes Messer. Finsteres Beobachten aus passiver Distanz bleibt dagegen erlaubt.
- K.-o.-, benommene, fixierte oder gefesselte Gegner sind davon getrennt: Sie dürfen und müssen je nach Status weiterhin körperlich am Ort bzw. im passenden Nachher-Bild erscheinen. Der Abgangswächter darf keine echten Zustands-/Beute-Szenen löschen.

## Stein-Frühwahrheits-Gegenlauf v7.12.1684

- Produktions-Repro auf v7.12.1683, frischer Stein-Run, Sonntag, 29. März 1953, Abbruch nach Szene 4 wegen eines fundamentalen Objekt-/Kenntnisbruchs; mechanischer Stand zu diesem Zeitpunkt: Stage 1, `0/3` Spuren.
- Szene 2 etablierte die beim Einbruch zerbrochene Drahtgestellbrille auf dem Tisch und ausdrücklich nicht an Margaretes Gesicht. Szene 4 ließ dieselbe Brille wieder „fast von der Nase“ rutschen. Die kanonische Requisitenwahrheit gilt deshalb ab der festen Wohnungsankunft und nicht erst nach dem späteren Klick auf `margarete_aussage`.
- Derselbe Konfrontationszug ließ Karl vor jedem Indizfund beiläufig „Wahler“ nennen. Setup-Cast und interne Fallziele sind kein Namenswissen des Spielers. `knownAfterEvidence` bindet Wahler nun datengetrieben an Margaretes Aussage, die Aktenkopie oder andere echte Wahler-Belege; der persönliche Auftritt in der Reichsbahndirektion sowie eine bereits ausgespielte Begegnung bleiben zulässige direkte Enthüllungen.
- Das bestehende späte Beleg-Gate bleibt als letzte Auslieferungssicherung erhalten. Zusätzlich verwirft die Weltwahrheitsprüfung eine solche Antwort jetzt bereits vor dem Modell-Retry, damit kein herausgeschnittener Satzrest sichtbar bleibt.
- Positiv bestätigt: v1683-Badge und Debug-Modus, vollständige Büroeröffnung, korrektes Nachtbild, Margarete und der Mantelmann in Ankunftsprosa und Konfliktbild sowie Margarete nach dem Abgang in Prosa, Bild und Personen-UI.
- Regression: exakte Produktionsformulierungen, Vor-Beleg-Sperre, erlaubter Begegnungsort und Entsperrung nach `margarete_aussage`; vollständige lokale Suite auf v7.12.1684 mit `61/61` grün. Produktions-Gegenlauf folgt nach Deployment.

## Stein-Abgangsbild-Gegenlauf v7.12.1685

- Produktions-Repro auf v7.12.1683, Szene 4 in Margarete Steins Wohnung: Der Mantelmann wendet sich laut sichtbarer Prosa ab, seine Schritte verhallen im Treppenhaus und die Haustür fällt hinter ihm ins Schloss. `personenImRaum` und Haupt-UI führen danach nur noch Margarete Stein.
- Das Szenenbild zeigte trotzdem weiter den Mantelmann groß im Vordergrund. Ursache war der Prosa-Fallback der generischen `presenceVariants`-Auswahl: Schon die bloße Namensnennung im Abschiedssatz reaktivierte das Anwesenheitsmotiv, obwohl die gemeinsame Abgangswahrheit die Figur bereits entfernt hatte.
- Die Bildauswahl respektiert jetzt vor jedem Roster-/Prosa-Fallback `_npcNachProsaAbgangAbwesend`. Ein gespeicherter sichtbarer Abgang schlägt die Namensnennung im Rückblick oder Abschiedssatz; eine später ausdrücklich erzählte Rückkehr bleibt über die vorhandene Rückkehrlogik möglich.
- Regression: exakter Folgeszenen-Typ mit Margarete als einzigem `personenImRaum`, weiterhin genanntem Mantelmann und aktivem Prosa-Fallback muss auf das Wohnungs-Grundmotiv ohne Gegner zurückfallen.

## Strauss-Sommerbild-Gegenlauf v7.12.1686

- Produktions-Repro auf v7.12.1683, frischer Strauss-Run, Szene 1 am Mittwoch, 22. Juli 1953, mittags: Die Prosa etabliert ausdrücklich schwüle Sommerhitze. Das feste Friedhofsmotiv zeigte dagegen kahle Bäume, abgestorbenen Winterboden und sichtbare Schnee-/Frostreste.
- Der Fehler betraf nicht nur die Eröffnung mit Frau Schleier und Pastor Vogel, sondern auch das leere Friedhofs-Grundmotiv und jeweils die Nachtfassung. Ein bloßer Austausch der gerade sichtbaren Datei hätte deshalb spätere Szenen erneut in den Winter versetzt.
- Vier neue, historisch und saisonal stimmige Sommermotive decken Grundmotiv und Trauerndenvariante jeweils bei Tag und Nacht ab. Karl, Grab, Friedhofsmauer und Bildkomposition bleiben stabil; Frau Schleier trägt nun tatsächlich einen sichtbaren schwarzen Trauerschleier.
- Die Strauss-Bildmatrix referenziert keine der alten Winterfassungen mehr. Regressionen prüfen alle vier Dateien, Mindestgröße, konkrete Tag-/Nachtzuordnung und das vollständige Entfernen der Winterreferenzen aus dem Strauss-Satz.

## Strauss-Zeugenaussage-Gegenlauf v7.12.1687

- Produktions-Repro auf v7.12.1683, Szene 4 im Café Kranzler: Nach einer bewussten Täuschungs-/Gesprächsaktion erschien nur der gebuchte Hinweis „Ludwig hatte ... Angst und fühlte sich bedroht“ plus der generische Satz, die Frau bleibe sichtbar in Karls Nähe. Das waren weder eine ausgespielte Aussage noch eine vollständige Szene; Bild und Personen-UI zeigten die Zeugin dagegen korrekt am Tisch.
- Ursache war ein kanonischer Personenhinweis ohne `fundText` und ohne verpflichtenden Narrativ-Guard. Die allgemeine Anwesenheitsergänzung machte den kurzen Hinweis formal lang genug, konnte aber keine Handlung, Haltung oder Persönlichkeit der Zeugin erzeugen.
- `schleier_aussage` besitzt nun eine vollständige Café-Szene mit Dialog, körperlichen Reaktionen, Beziehungstiefe, zeitlich begrenztem Wissen und ausdrücklich offener Täterfrage. Ein `replaceOnFallback`-Guard verlangt Ludwig, Nähe/Vertrautheit, Angst/Drohung und einen konkreten Szenenanker; bei Modell- oder Prüfversagen ersetzt er den Text vollständig.
- Die erste Friedhofsaussage verwendet in allen sichtbaren kanonischen Texten außerdem `Während`, `hörst`, `persönlich` und `Café` statt ASCII-Ersatzschreibungen. Suchschlüssel bleiben absichtlich normalisiert.

## Trude-Außenstand-/Romanz-Climax-Gegenlauf v7.12.1688

- Produktions-Repro auf v7.12.1683, Strauss-Szene 5: Das Szenenbild zeigte Trudes offenen hölzernen Straßenstand am Hackeschen Markt. Die Prosa ließ Karl dagegen den Kopf durch eine Eingangstür stecken und verwies auf einen leeren Hocker am Tresen – einen erfundenen Gastraum, den es im Bild nicht gibt.
- Trudes fallübergreifender Ort trägt nun dieselbe Außenstand-Wahrheit in Detail, Ankunft und Anwesenheitsfallback. Die Bildmatrix markiert das Motiv nicht mehr widersprüchlich als Innenraum. Ein eigener Weltwahrheits-Guard verwirft Gastraum, Eingangstür und Sitzhocker und besitzt einen deterministischen Außenstand-Fallback.
- Im selben Live-Run stieg die bewusst gespielte Strauss-Romanze mit drei erfolgreichen Annäherungen von `Rm 0` auf `Rm 3`. Danach sperrte das Drei-Klick-Limit weitere Annäherungen, während die Übernachtung erst ab `Rm 4` erschien. Schlafen führte Karl allein ins Büro: Die Romanze war mechanisch exakt eine Stufe vor ihrem einzigen Abschluss festgesetzt.
- Der Übernachtungs-Climax erscheint nun ab `Rm 3` am Abend oder in der Nacht. Damit können drei erfolgreiche bewusste Annäherungen aus einem neutralen Start tatsächlich in die vorhandene Romanznacht mit eigenem Morgenbild führen; Ablehnung, Verletzungs-, Gewahrsams- und Gefahrensperren bleiben unverändert.

## Szenenbild-Ladegarantie v7.12.1689

- Die Fallstruktur prüfte bislang, ob jede konfigurierte Tag-, Abend-/Nacht- und Anwesenheitsdatei existiert. Sie prüfte aber nicht jede Datei auf ein lesbares Bildformat; außerdem versteckte der Renderer die gesamte Bildfläche, wenn sowohl Primär- als auch Ersatzdatei im Browser scheiterten oder ein Laufzeit-Ort trotz starkem Ortsanker keinen Treffer erhielt.
- Der Strukturlauf liest nun Breite und Höhe jeder referenzierten WebP- und PNG-Datei und verwirft ungültige Header oder Nullmaße. Zusätzlich wurde der gesamte Szenenbild-Bestand einmal mit einem echten Decoder geöffnet.
- Im Browser bleibt nach einem erschöpften Dateifallback oder fehlenden Ortstreffer eine klar beschriftete, eingebettete Noir-Notfalltafel mit echtem Orts- und Zeitlabel sichtbar. Sie erfindet weder Personen noch Innen-/Außenraum und meldet `SZENENBILD-NOTFALLTAFEL` in der Diagnose. Ein technischer Ladefehler kann damit nicht mehr zu einer völlig leeren Bildregion werden und bleibt zugleich offen erkennbar.

## Freie-Anker-Phantomperson-Gegenlauf v7.12.1690

- Produktions-Repro auf v7.12.1683, Strauss-Szene 11 in Karls Büro: Die kanonisch ersetzte Aktenprosa und das feste Bürobild zeigen Karl allein. Die Haupt-UI bot trotzdem `Hausmeister Gregor Halbe` als anwesende Person an.
- Das Diagnoseprotokoll belegt die Ursache exakt: Das Modell lieferte Halbe im rohen `personenImRaum` und als Informanten, die `replaceOnFallback`-Sicherung ersetzte danach aber die gesamte fehlerhafte Prosa durch den kanonischen Aktenfund. Halbe blieb im technischen Cast zurück und galt als nicht ortsgebundener Netzwerk-Anker fälschlich überall als zulässig.
- Ein freier Netzwerk-Anker ist nun nur dann physisch anklickbar, wenn sowohl das finale Szenen-Roster als auch die tatsächlich sichtbare Endprosa seinen Namen tragen. Bloße Erinnerungen, alte Cast-Reste und durch Fundtext-Ersatz verschwundene Auftritte reichen nicht; echte Party-Mitglieder und explizit ortsgebundene Kontakte bleiben unverändert.
- Regression: exakt der Strauss-Aktenfund mit `Gregor Halbe` nur im Roh-Roster wird geblockt; ein sichtbar eintretender Halbe bleibt erlaubt, eine bloße Erinnerung ohne Roster materialisiert ihn nicht.

## Rex-/PPK-/Item-Balancematrix v7.12.1691

- Alle sechs W6-Seiten wurden deterministisch gegen normale Stärke 3, harte Stärke 5 und eine harte Gruppe geprüft. Rex hebt Karls unbewaffnete Chance gegen einen normalen Schläger von `2/6` auf `3/6`, gegen Stärke 5 bleibt nur `1/6`; `Verjagen` wirkt weiterhin nur bis Stärke 4. Rex ist damit deutlich nützlich, aber allein keine Siegautomatik.
- Die Walther PPK erzeugt gegen Stärke 3 allein auf `3/6`, zusammen mit Rex auf `4/6` Druck. Selbst der beste Wurf bleibt nichtterminal: kein automatischer K.o., keine Flucht und keine Kapitulation. Sie ist ein einmaliger Distanzhebel, keine beste Universalwaffe.
- Kaffee bleibt schwach (`2/6` gegen Stärke 3), geworfener Korn ist gegen Stärke 5 brauchbar, aber unsicher (`3/6`), und das verbrauchbare Feuerwerksbündel neutralisiert bei einer harten Gruppe exakt eine Überzahlstufe (`4/6`). Der wiederverwendbare Schlagstock ist stark, scheitert gegen Stärke 5 aber weiterhin auf `2/6` und schlägt nicht bei jedem Erfolg sofort k.o.
- Als Ausreißer erwiesen sich die wiederverwendbaren Handschellen: Ohne vorbereitete Oberhand fesselten sie einen normalen Gegner bisher auf `5/6` sofort. Ein neuer Nahkampf-Malus senkt das auf `3/6`. Nach einem vorherigen Wirkungstreffer kehren `5/6` zurück; die ausdrücklich kombinierte Aktion `Rex: Fixieren` plus Handschellen gelingt als verdienter Team-Payoff sicher. Nur `Fixieren` oder `Festhalten`, nicht irgendein Begleiterbonus, hebt den Malus auf.

## Strauss-Orts- und Rex-Bildwahrheit v7.12.1692

- Der vollständige Produktionslauf auf v7.12.1683 reproduzierte zwei neue Ortsbrüche: Ludwigs Wohnung wurde trotz kanonischem Ankunftstext aus dem vierten in den zweiten Stock verlegt; bei der Rückkehr ins Büro parkte Karl am Marx-Engels-Platz und ging angeblich nur wenige Schritte zum Hackeschen Markt. Enge Weltwahrheits-Guards verwerfen nun exakt diese Stockwerks- und Opel/Fußdistanz-Drifts und besitzen natürliche deterministische Ankunftsfallbacks.
- Rex wurde am Goldenen Anker regulär gegen Tauschwert 7 aufgenommen. Die PPK schuf in der Krummbein-Konfrontation nur Distanz und beendete sie nicht. `Rex: Fixieren` plus Handschellen erzeugte dagegen einen verdienten, klar erzählten Teamabschluss mit spürbarer, aber nicht goriger Gewalt.
- Bildbefund: Vor der Kombi zeigte das feste Ladenmotiv Krummbein und Karl, obwohl Haupt-UI und Begleiterleiste Rex führten. Nach der Fesselung fiel das Bild sogar auf den leeren Laden zurück, weil `gefesselt` fälschlich wie ein Ortsabgang behandelt wurde. Nach der Abführung blieb Rex in Prosa und UI, aber weiterhin nicht im Bild.
- Vier neue Tag-/Nachtmotive bilden deshalb `Krummbein + Rex` und `Rex nach Krummbeins Abführung` ab. Die Anwesenheitsmatrix priorisiert die gemeinsame Variante, behält gefesselte, fixierte, benommene und k. o. gegangene Körper sichtbar und wechselt erst bei echter Übergabe/Flucht auf das Rex-Nachherbild. Damit folgen Bild, Prosa und Haupt-UI demselben Gegner- und Begleiterzustand.

## Lindenbaum-Zeugen- und Wissenswahrheit v7.12.1693

- Der Produktionslauf auf v7.12.1683 zeigte Hermes schon in der ersten Ankunftsprosa der HO-Verwaltung, obwohl sein Stage-Gate ihn noch aus Haupt-UI und Szenenbild ausschloss. Der Basistext beschreibt deshalb nur den Ort; die bestehende aktive-NPC-Ergänzung fügt Hermes erst ab Stage 2 sichtbar und erzählerisch hinzu.
- Evas Befragung trug einen offenen HO-Tür-Cliffhanger rückwirkend in die Lindenbaum-Wohnung, erfand für den unbekannten Besucher eine Staatssicherheitsuniform und nannte ihn in der folgenden Romantikszene bereits Brakke. Für den Briefdurchschlag und Evas Zeugenaussage gelten nun vollständige, autorisierte Fundprosa-Verträge. Eva bestätigt nur Zeitpunkt, Weg und dass sie das Gesicht nicht erkannte.
- Brakkes Name ist außerhalb seiner echten HO-Begegnung erst nach `hermes_meldung` bekannt. Damit darf weder Romanze noch Atmosphärenprosa die spätere Täteridentität vorwegnehmen; Hermes bleibt die dafür notwendige, politisch gefährdete Quelle.

## Gewahrsams-Aktionskontinuität v7.12.1694

- Im Lindenbaum-Produktionslauf führte ein bewusst slapstickhafter Sahnetortenwurf gegen den bewaffneten MfS-Major plausibel zur Festnahme. Die feste, notwendige Gewahrsams-Einstiegsprosa löschte jedoch den gerade gewählten Wurf vollständig. Torte, Kornflasche und gezogene PPK erhalten nun jeweils einen kurzen, wirkungsgemäßen Auftakt, bevor der gescheiterte Zugriff in die deterministische Festnahme übergeht.
- Die erste Verhörrunde erfand bei unveränderter voller Verfassung schmerzende Rippen und einen harten Stoß beim Transport. Der Körperwahrheits-Guard erkennt jetzt auch die Pluralform `schmerzen`; der Reparaturpfad entfernt den gesamten erfundenen Verletzungssatz statt nur einzelne Verletzungswörter.

## Lindenbaum-Roster-, Pathologie- und Begleitwahrheit v7.12.1695

- Der Lindenbaum-Gegenlauf zeigte Hermes und Brakke nach der Freilassung gleichzeitig in der Haupt-UI, obwohl Hermes nach seiner belastenden Aussage vor dem finalen MfS-Zugriff nicht mehr dort bleiben darf. Hermes ist nun nur von Stage 2 bis 3 gebunden und geht nach dem Schädeltrauma-Befund; Brakke erscheint erst mit Hermes-Meldung **und** Pathologiebeleg. Dadurch zeigt die finale HO-Konfrontation genau einen Gegner statt einen unbeteiligten Zeugen als scheinbaren Mitläufer.
- Das feste Pathologiebild zeigte bereits einen älteren Arzt am Schreibtisch, während die Modellprosa einen namenlosen alten Pförtner/Ordner erfand und die Haupt-UI niemanden führte. Dr. Otto Seifert ist nun als eigenständiger, ambivalenter Charité-Pathologe im Setup, in Ankunftsprosa, Roster und Bildvertrag kanonisiert. Der medizinische Fund bleibt sachlich deutlich, aber nicht gorig.
- Beim bewussten Mitnehmen Evas zum Café Kranzler führte das Party-Banner `Eva Werder`, während Prosa, Personen-UI und Karl-allein-Bild sie vollständig verloren. Explizite Party-Mitglieder überstimmen nun ihre normale Heimatortbindung, zählen bei jeder Reise zur verpflichtenden Ankunftsbesetzung und bleiben am Ziel anklickbar; dadurch ist auch die Romance-Interaktion unterwegs erreichbar.
- Zwei eigene Café-Kranzler-Motive zeigen Karl und Eva bei Tag beziehungsweise Nacht. Die Anwesenheitsvariante wird nur durch Evas tatsächlichen physischen Party-/Szenenroster aktiviert; ohne Eva bleibt das neutrale Cafébild erhalten.
- Regressionen prüfen den echten Party-Ortsfilter, den Ankunftsdrift mit fehlender Eva in Prosa/`personenImRaum`, beide Bilddateien und den vollständigen Lindenbaum-Roster.

## Ruf-Vergleich und Debug-Neustart v7.12.1696

- Das bestehende Rufsystem besitzt bereits konkrete, deterministische Folgen: Renommee verändert leichte soziale Erfolgswege und den Spielraum in Verhören; Härte kann leichten Druck glaubwürdiger machen, verteuert ab Stufe 3 aber Informanten um bis zu zwölf Ostmark. Schwere körperliche Fehlwege bleiben auch bei maximaler Härte falsch.
- Für kontrollierte Gegenläufe gibt es in den Admin-Settings zusätzlich `Fall mit diesem Ruf neu starten`. Der aktuelle Fallzustand wird gelöscht und derselbe Fall neu gestartet, während Ruf, Kasse, bekannte Personen und übrige Karrierewerte erhalten bleiben.
- Dieser Debug-Neustart unterdrückt genau die sonst beim neuen Fall fällige zusätzliche Mietbuchung. Das verhindert, dass der Vergleich `neutral / angesehen / verbrannt / gefürchtet` allein durch unterschiedliche Kasse oder Schulden verfälscht wird.
- Ein eigener Regressionstest vergleicht identische Informanten-, Sozial- und Verhörsituationen bei extremen Rufprofilen und prüft zusätzlich Ruf-Reset, Wertebegrenzung, Karriereerhalt, Fallidentität und den einmaligen Miet-Bypass.

## Verbindlicher Kanten-, Figuren- und Varianten-Prüfkatalog 29.07.2026

Dieser Katalog ist ab sofort Teil jedes manuellen Falllaufs und jeder Fallbewertung. Er ergänzt die sechs Standing-Checkpoints. Ein Fall kann trotz gelöstem Hauptpfad nicht höher als `8,9/10` bewertet werden, solange einer der folgenden Bereiche ungetestet oder nur durch Quelltextsichtung statt durch einen echten variierenden Lauf belegt ist.

### Bildverfügbarkeit und gemeinsame Szenenwahrheit

- Jede einzelne Szene wird aktiv auf ein sichtbares Bild geprüft. Ein fehlgeschlagener Primär- und Dateifallback darf nie zu einer leeren Bildfläche führen; mindestens die klar beschriftete Noir-Notfalltafel mit echtem Ort und Tageszeit muss sichtbar bleiben.
- Ein vorhandenes Bild ist noch kein bestandener Bildtest. Prosa, Haupt-UI, `personenImRaum`, Party-Banner, Engine-Ort, Tageszeit, NPC-Zustand und Bild bilden gemeinsam genau eine Szenenwahrheit.
- Zentrale anwesende Gesprächspartner, Gegner, Romance-Partner und bewusst mitgenommene Begleiter müssen im passenden Szenenbild sichtbar sein. Steht eine Figur nur in der Haupt-UI oder nur im Party-Banner, während Prosa und Bild Karl allein zeigen, ist das ein fundamentaler `BILD-PROSA-UI-BRUCH`.
- Abgang, Flucht, Abführung, Festnahme und Übergabe entfernen eine Figur auch aus dem Folgebild. K. o., benommen, fixiert und gefesselt sind dagegen sichtbare Körperzustände und kein Ortsabgang.
- Jede feste Bildvariante wird bei Tag und Nacht sowie vor und nach dem relevanten Zustandswechsel geprüft. Eine Nachtdatei als stiller Tagesersatz ist nur zulässig, wenn das Bild keine materiell falsche Licht-/Tageswahrheit zeigt; andernfalls braucht es eine eigene Tagesfassung.
- Jahreszeit, Wetter, Sektor, Innen-/Außenraum, Etage, sichtbare Requisiten und deren Zustand werden mitgeprüft. Ein visuell attraktives, aber sachlich falsches Bild ist schlechter als ein neutral wahrer Ersatz.

### Prosa muss Erzähltext sein

- Sichtbare Prosa darf niemals nur KI-, Prompt-, Engine-, JSON-, UI-, Regie- oder Reparaturanweisungen enthalten. Begriffe wie „schreibe die Szene“, „laut Engine“, „führe in personenImRaum“, „der Nutzer hat gewählt“, „JSON-Ort“ oder „zeige nun“ sind in der Spielerprosa ein sofortiger Abbruchgrund.
- Ebenso unzulässig sind technisch saubere, aber inhaltsleere Platzhalter: reine Ortszeile, Routinghinweis, Aktionszusammenfassung oder Menüanweisung ohne konkrete Szene.
- Jede Szene braucht mindestens drei natürliche Beats: einen gegenwärtigen sinnlichen Orts-/Atmosphärenanker, eine konkrete Figur oder handlungsrelevante Requisite und die tatsächlich gewählte Handlung beziehungsweise ihre unmittelbare Folge.
- Die gewählte Aktion muss im Text vorkommen. Torte, Korn, PPK, Rex-Befehl, Kombiaktion, Kuss, Rückzug oder Deeskalation dürfen nicht durch einen Gewahrsams-, Indiz- oder Abschlussfallback aus der Erzählung gelöscht werden.
- Reparaturtexte werden nach jedem Eingriff erneut auf Metasprache, Unterlänge, Weltwahrheit und Aktionskontinuität geprüft. Mechanisch korrekt, aber literarisch tot, gilt nicht als bestanden.

### Romanzen als eigener Pflicht-Testpfad

- In jedem Fall mit erreichbarer Romance-Figur wird die Romanze bewusst getestet: erste Annäherung, weitere Steigerung, Cooling/Reset, Abend-/Nacht-Gate, Übernachtungs-Climax, Morgen danach, Ablehnung und mindestens eine Unterbrechung durch Gefahr, Verletzung oder Gewahrsam.
- Romance-Tests sind keine reine Zählerprüfung. Die Frau muss einen eigenen Willen, Interessen, Widersprüche, Grenzen, Humor und fallunabhängige Lebensrealität zeigen. Sie darf nicht nur Belohnung, Informationsspenderin oder austauschbare „geheimnisvolle Schönheit“ sein.
- Der aktuelle Beziehungsstand muss in Ton, Nähe und Handlung sichtbar werden. `Rm 1` darf nicht wie eine vollendete Liebesnacht klingen; `Rm 3` darf nicht ohne Grund wieder bei einer formellen Erstbegegnung beginnen.
- Nimmt Karl die Romance-Figur mit, bleibt sie an jedem Zielort physisch wahr: Party-Banner, anklickbares Personenziel, `personenImRaum`, Prosa und Anwesenheitsbild führen dieselbe Figur.
- Jede mechanisch mitnehmbare Figur braucht in der aktiven Haupt-UI am Heimatort einen sichtbaren `Mitnehmen`- und unterwegs einen zustandswahren `Hier lassen`-Weg; ein nur im alten Nebenmenü erreichbarer Begleiter gilt als UI-Defekt.
- Bei Gruppenbildern werden Anwesenheitsvarianten von der spezifischsten Besetzung zur allgemeinsten priorisiert. Reisen Eva und Karl zu einer bereits dort wartenden Auguste, muss das Bild alle drei Personen zeigen; das Auguste-Alleinmotiv ist trotz formal vorhandener Datei ein `BILD-PROSA-UI-BRUCH`.
- Besonders geprüft werden Abgänge und Ortswechsel: Ist die Frau laut Prosa gegangen, darf sie weder im Bild noch in der UI bleiben. Ist sie mit Karl gereist, darf die Prosa ihn nicht allein eintreten lassen und das Bild sie nicht noch zu Hause zeigen.
- Übernachtungs- und Morgenbilder werden immer separat geprüft. Kleidungswechsel oder intime Stimmung dürfen nie explizit sexualisiert, voyeuristisch oder nicht jugendfrei werden; Nähe, Verletzlichkeit und Konsequenz dürfen dennoch deutlich und erwachsen sein.

### Rex, Trude, Items, PPK und Teamaktionen

- Rex wird in geeigneten Läufen regelmäßig regulär aufgenommen und nicht nur per Debugstatus simuliert. Geprüft werden Reise-/Party-Anzeige, Bildpräsenz, Ansprechbarkeit/Kommandos, normale Gegner, harte Gegner und Gruppen.
- Pflichtmatrix Rex: allein unbewaffnet, Karl plus Rex, Rex `Fixieren`, `Anbellen`, `Anknurren`, `Fass!`, mindestens ein Fehlschlag und mindestens eine verdiente Kombi mit einem zweiten Akteur oder Item.
- Trude wird in geeigneten Läufen regelmäßig besucht. Ihr Sortiment muss pro Ermittlung variieren, im selben Lauf stabil bleiben und genug taktischen Tauschwert bieten, ohne immer dieselbe optimale Ausrüstung auszuspucken.
- Pflichtmatrix Items: mindestens ein schwaches Alltagsitem, ein Verbrauchsitem, ein wiederverwendbares Item, ein Ablenkungs-/Slapstickitem, ein Wurfitem und ein Fessel-/Kontrollitem. Neben Einzeleinsatz werden Team- und Kombiaktionen mit Party-Mitglied oder Rex getestet.
- Die Walther PPK ist Druck- und Distanzmittel, keine automatische Lösung. Sie darf weder jeden Gegner sofort neutralisieren noch gegenüber allen anderen Wegen dominant sein; Munition, Risiko, Ruf-/Bedrohungsfolge und gegnerische Härte müssen spürbar bleiben.
- Balance wird deterministisch über alle sechs W6-Seiten gegen normale Stärke, harte Stärke und Gruppe geprüft. Kein wiederverwendbares Item darf ohne vorbereitete Oberhand zuverlässiger sein als ein verdienter Team-Payoff.
- Nach jedem Einsatz stimmen Aktionslabel, Verbrauch/Eigentum, Inventar, Kampfstatus, Prosa, Verletzungsfolge und Bild überein. Ein geworfener oder übergebener Gegenstand darf nicht weiter unverändert in „Dabei“ liegen.
- Eine Festnahme trennt Rex und menschliche Begleiter sichtbar von Karl; sie dürfen nicht in die Zelle teleportieren. Die Festnahmeprosa muss die Trennung benennen. Nach der Freilassung muss der Verbleib eindeutig sein: Rex wartet wieder bei Willi und kann ohne erneute Bezahlung abgeholt werden; ein menschlicher Begleiter braucht einen ebenso konkreten Wiederaufnahme- oder Abschiedsweg.
- Bildvarianten mit Rex werden nicht allein über den Orts-Roster gewählt. `hundInParty`, Prosa, Party-Banner und Motiv müssen gemeinsam Rex zeigen; nach einer Hafttrennung darf das Rex-Motiv erst nach der tatsächlichen Wiederaufnahme erneut erscheinen.

### Konfrontationen, Slapstick und knackige Gewalt

- Die Welt braucht zufällige Schläger, Opportunisten, Wachleute und andere Gegner neben dem Fallantagonisten. Sie müssen historisch und örtlich plausibel gespawnt, sichtbar eingeführt und spielbar sein; keine unsichtbare Phantomwaffe und kein Gegner nur im UI.
- Konfrontationen werden mindestens friedlich, bluffend, fliehend, unbewaffnet, mit Item, mit PPK, mit Party-Mitglied und mit Rex/Kombi gespielt. Ein Falltest ohne alternative Konfrontationswege ist unvollständig.
- Slapstick ist erwünscht, wenn Ursache und Folge stimmen: Sahnetorte, rutschiger Korn, klemmende Tür, missglückte Drohpose oder überraschender Hundemoment dürfen komisch sein, aber keine Mechanik löschen und nicht jede ernste Szene entwerten.
- Gewalt darf kurz, hart und folgenreich sein: ein trockener Schlag, ein Sturz über einen Stuhl, ein verdrehter Arm, ein gegen die Wand gedrückter Angreifer oder ein zerrissener Mantel sind zulässig. Unzulässig bleiben Gore, detaillierte offene Wunden, Folterlust, Sexualgewalt, Verstümmelung und genüssliche Leidensbeschreibung.
- Die Härte folgt ausschließlich der gewählten Aktion und dem mechanischen Ergebnis. Befragen oder „zur Rede stellen“ darf nicht ungefragt in Schläge kippen; ein klarer Angriff darf umgekehrt nicht als folgenloser höflicher Wortwechsel verschwinden.
- Slapstick, Gewalt und Spannung brauchen Rhythmus. Nicht jede Szene erhält einen Gag, nicht jede Konfrontation maximalen Ernst. Der Lauf soll Ecken und Kanten besitzen, ohne zur Farce oder Gewaltspirale zu werden.

### Figuren-, Frauen- und Welt-Tiefe

- Jede handlungstragende Figur braucht mindestens zwei unterscheidbare Eigenschaften sowie einen eigenen unmittelbaren Wunsch, eine Grenze oder ein Risiko. „Ängstlicher Zeuge“, „brutaler Schläger“, „kalter Stasi-Mann“ oder „schöne Witwe“ allein genügt nicht.
- Zeugen dürfen einander nicht nur durch Name und Beruf unterscheiden. Geprüft werden Sprachrhythmus, soziale Lage, politischer Druck, Eigeninteresse, Erinnerungslücken, Humor, Feigheit, Mut und mögliche Widersprüche.
- Frauen erhalten dieselbe Bandbreite an Beruf, Alter, Macht, Fehlern, Begehren, Ambivalenz und Handlungsmacht wie Männer. Romance-Figuren sind besonders streng auf Austauschbarkeit und reine Belohnungsfunktion zu prüfen.
- Wiederkehrende Kontakte erinnern sich nur an belegte Begegnungen und reagieren auf Karls tatsächlichen Ruf. Sie dürfen helfen, ablehnen, handeln oder eigene Bedingungen stellen.
- Zufallsfiguren und Gegner werden variiert: Motiv, Alter, Auftreten, Gruppengröße, soziale Herkunft und Konfliktziel dürfen nicht in jedem Run gleich sein. Variation darf aber nie Indiz-, Rollen- oder Historienwahrheit überschreiben.

### Rufsystem: relevante, sichtbare und vergleichbare Folgen

- Karls Ruf ist kein Schmuckwert und keine einfache Gut-/Böse-Leiste. `Renommee` und `Härte` sind zwei getrennte Achsen: gutes Renommee kann Türen öffnen, schlechter Ruf sie schließen; Härte kann Drohungen glaubwürdiger machen, muss aber Informanten und zivile Zeugen vorsichtiger machen.
- Rufwirkung muss spielmechanisch oder erzählerisch relevant und für den Spieler nachvollziehbar sein. Pflichtprüfungen sind: soziale Erfolgswege, Verhör-Spielraum, Informantenpreise, Konfliktreaktionen, wiederkehrende Kontakte, Abschluss-/Folgefall-Recap und sichtbare Statusanzeige. Eine bloß intern geänderte Zahl oder ein austauschbarer Prompt-Satz gilt nicht als bestandene Wirkung.
- Der Ruf darf keinen Fall automatisch lösen, kein Kernindiz ohne seinen Beleg erfinden und keine schwere Eskalation nachträglich zum richtigen Gesprächsweg machen. Er verändert Chancen, Widerstand, Preis, Ton und Konsequenz; Figur, Evidenz und gewählte Handlung bleiben ausschlaggebend.
- Positives Renommee braucht ebenso spürbare Vorteile wie negatives Renommee Nachteile. Hohe Härte braucht einen echten kurzfristigen Nutzen und einen echten sozialen beziehungsweise wirtschaftlichen Preis. Ein Profil, das nur bestraft oder nur belohnt, ist unausgewogen.
- Rufreaktionen brauchen glaubhafte Reichweite. Nur Figuren, die Karl kennen oder von ihm gehört haben können, dürfen konkret reagieren. Zufällige Fremde dürfen den Zahlenwert nicht hellseherisch kennen; vernetzte Unterwelt, Polizei, MfS und wiederkehrende Kontakte dürfen ihn eher weitertragen.
- Prosa, Haupt-UI, Settings-Anzeige, Aktionslabel und Mechanik müssen dieselbe Rufwirkung behaupten. Zeigt das Label einen Rufvorteil, muss der soziale Ausgang ihn tragen; nennt die Prosa einen Aufpreis oder besonderes Misstrauen, müssen Kasse beziehungsweise Gesprächsweg tatsächlich betroffen sein.
- Jede Rufänderung muss aus einer sichtbaren Handlung oder einem Fallausgang folgen, auf `-5..+5` begrenzt und gegen Doppelbuchung geschützt sein. Forensische Wörter, fremde Gewalt oder bloße Erzählatmosphäre dürfen Karls Härte nicht erhöhen.
- Der Debug-Reset `Nur Ruf auf 0 setzen` darf ausschließlich beide Rufachsen neutralisieren und weder Karriere, Kasse, Miete, bekannte Personen noch Fallfortschritt löschen. `Fall mit diesem Ruf neu starten` muss denselben Fall mit beibehaltenem Ruf und Karrierestand frisch beginnen und darf für diesen Vergleich keine zusätzliche Miete buchen.

#### Verbindlicher Ruf-A/B/C/D-Gegenlauf

1. Für den gewählten Fall zuerst `Karriere zurücksetzen & Fall neu starten`, noch keine kosten- oder rufändernde Aktion ausführen.
2. In den Admin-Settings das gewünschte Profil einstellen und `Fall mit diesem Ruf neu starten` wählen. Dadurch bleibt die Vergleichsbasis erhalten, während nur der Fallzustand frisch beginnt.
3. Dieselbe frühe Gesprächs-, Verhör-, Informanten- und Konfliktsequenz mit vier Profilen spielen: neutral `Renommee 0 / Härte 0`, angesehen `+5 / 0`, verbrannt `-5 / 0` und gefürchtet `0 / +5`. Bei Härte-sensiblen Figuren zusätzlich auffällig sanft `0 / -5` prüfen.
4. Pro Profil exakt protokollieren: sichtbare Aktionslabels, verfügbarer/erfolgreicher Sozialweg, Verhör-Startwerte und Fragebonus, Informantenpreis und Kassenabbuchung, Figurenreaktion in der Prosa, Konfliktwirkung, Rufanzeige und Folgerecap.
5. Zwischen Profilen die neutrale Vergleichsbasis wiederherstellen. Dafür erneut die Testkarriere zurücksetzen, unmittelbar danach den neuen Ruf setzen und denselben Fall über den Ruf-Vergleichsneustart beginnen. So dürfen Geldverbrauch, Items, Miete, bekannte Personen oder ein vorheriger Fallausgang den Vergleich nicht verfälschen.
6. Ein Fall besteht den Rufvergleich nur, wenn mindestens zwei Profile bei derselben plausiblen Situation einen erkennbar anderen, regelkonformen Ausgang oder Preis erzeugen und die übrigen Profile glaubwürdig gleich bleiben, wo Ruf keine Rolle spielen darf.
7. Besonders Stein, Strauss, Lindenbaum und Görke werden mit wechselnden Zeugen-, Informanten- und Konfrontationssituationen geprüft; politische Fälle zusätzlich darauf, ob MfS-Reaktionen den etablierten Ruf berücksichtigen, ohne allwissend oder überzogen zu werden.

### Stasi-Bedrohung in politischen Fällen

- In einem Stasi-/MfS-Fall muss die Bedrohung real und systemisch spürbar sein: Beobachtung, beruflicher Druck, Aktenmacht, Denunziationsangst, Reise-/Zugangsrisiko und glaubhafte Festnahmegefahr sind wirksamer als ständig gezogene Waffen.
- Die Bedrohung braucht benannte oder mechanisch eingeführte Träger. Ein plötzliches „die Stasi weiß alles“ ohne Quelle, Roster, Vorzeichen oder Konsequenz ist ebenso falsch wie völlige Harmlosigkeit.
- Gewahrsam, Beschattung und Einschüchterung bleiben selten genug, um Gewicht zu behalten. Nach einer gerade beendeten MfS-Konfrontation verhindert ein echter Cooldown die sofortige identische Wiederholung.
- Stasi-Figuren sind nicht alle eindimensional sadistisch. Loyalität, Karriereangst, ideologische Überzeugung, Opportunismus, Müdigkeit, Zweifel und institutioneller Selbsterhalt dürfen sich unterscheiden. Das macht die Gefahr glaubhafter, nicht schwächer.
- Nichtpolitische Fälle dürfen politische Atmosphäre enthalten, aber nicht durch zufällige Stasi-Eskalation ihren eigenen Ton und Fallkern verlieren.

### Mindestabdeckung pro Fallbewertung

- Ein vollständiger Bewertungsblock nennt getrennt: Hauptpfad/Playability, Indiz- und Prosaqualität, Bild-/UI-Weltwahrheit, Figuren-/Romance-Tiefe, Konfrontations-/Item-/Rex-Abdeckung, historische/Stasi-Wahrheit und technische Stabilität.
- `nicht möglich` wird nur mit belegtem Setup-Gate notiert. `nicht getestet` bleibt ausdrücklich offen und senkt die Bewertung; es wird nicht still als bestanden gewertet.
- Unsichere oder zuletzt fehlerhafte Fälle erhalten vor stabilen Fällen Vorrang. Mindestens Stein, Strauss, Lindenbaum und Görke bleiben bis zu einem frischen Gegenlauf mit abweichendem Pfad als gezielte Regressionen markiert.
- Für die Staffel werden Aktionen bewusst rotiert. Kein zweiter Lauf darf exakt dieselbe Sozial-, Reise-, Konfrontations- und Romance-Sequenz wie der vorige verwenden.

### Produktions- und Rufvergleichs-Regressionen aus Strauss v1696

- Ein Release ist erst bildseitig bestätigt, wenn nicht nur `index.html`, sondern auch sämtliche neu referenzierten Dateien unter `assets/` ausgeliefert sind. Für mindestens eine Tag-, Nacht-, Romance-, Rex- und Abschlussvariante wird die konkrete Produktions-URL auf HTTP-Erfolg und echte Bilddarstellung geprüft. Die technische Notfalltafel verhindert zwar einen leeren Bereich, gilt aber nie als bestandener Bildtest.
- Fehlt eine genaue Rex-, Begleiter-, Gegner- oder Zustandsvariante oder kann ihre Datei nicht geladen werden, bleibt die Bildfläche trotzdem immer sichtbar. Die feste Reihenfolge lautet: passende Spezialvariante, deren vorhandene Lichtalternative, neutrales Grundmotiv desselben Orts mit Karl allein, erst danach das eingebaute Karl-allein-Ersatzmotiv mit aktuellem Ortsnamen. Ein fehlender Spezialcast darf niemals `hidden`, einen leeren Bildrahmen oder ein Bild von einem anderen Ort erzeugen; die Abweichung bleibt diagnostizierbar und wird später durch ein echtes Spezialmotiv ersetzt.
- Der Rufvergleichs-Neustart muss den alten Schlussbildschirm und den alten Prosatext sofort ausblenden, bevor die neue Einleitung erzeugt wird. Solange eine Szene noch berechnet wird, darf kein zweiter Ruf-Neustart beginnen. Erst die sichtbar frische Einleitung desselben Falls ist die Vergleichsbasis.
- Rufwerte werden beim Laden, beim manuellen Setzen, nach Fallabschlüssen und in Debug-Simulationen immer beidseitig auf `-5..+5` begrenzt. Ein älterer Spielstand außerhalb dieses Bereichs wird beim Laden normalisiert.
- `personenImRaum`, Haupt-UI, Prosa-Prompt und Szenenbild benutzen denselben aktuellen Ortsfilter. Eine am vorigen Ort zurückgelassene Figur darf nicht allein durch einen alten Cast-Eintrag wieder in Prosa oder Bild auftauchen; Party, Showdowngegner und geborgene Zielpersonen bleiben dagegen ausdrücklich erhalten.
- Ein Fall mit offenen Pflichtbeats darf weder im Status-Popup noch im Abschluss-Export als „Wahrheit bewiesen“ erscheinen. Sichtbar bleibt „noch nicht belastbar“, und die nächste Aufgabe lautet, die Wahrheitskette zu vervollständigen.
- Eine beiläufige Zeitungsüberschrift oder Alltagserwähnung von `SED` macht einen privaten Fall nicht politisch. Erst expliziter Macht-, Überwachungs-, Droh-, Akten-, Verhaftungs- oder Funktionärskontext darf über den Parteinamen die MfS-Logik aktivieren.
- Rex wird beim Goldenen Anker nur als regulär getestet gewertet, wenn Karl mindestens Tauschwert 7 mitführt. Kaffee, Torte und Teekanne ergeben zusammen nur 5; deshalb muss der Lauf vorher bei Trude oder durch andere Beute ausreichend und variabel ausgerüstet werden. Ein absichtlich zu niedriger Tauschwert bleibt als eigener Negativtest erhalten.

### Politische Sicherungs- und Haftwahrheit aus Stein v1728

- Ein im MfS-Gewahrsam erlauschtes Indiz zählt nur dann als bestanden, wenn der Inhalt in derselben spielbaren Haftszene konkret erzählt wird. Eine lautlose Erhöhung des Indizzählers oder eine erst nach der Freilassung nachgereichte abstrakte Erinnerung ist nicht ausreichend.
- Sicherungsaktionen müssen körperlich ausführbar sein. Aus einer verschlossenen Zelle heraus dürfen weder Beweise an Roth oder Vera übergeben noch Schutzpersonen abgeholt werden; der Button bleibt sichtbar erklärend gesperrt und nennt den Gewahrsam als Grund.
- Eine abgeschlossene Aktenübergabe ist irreversible Weltwahrheit. Spätere Prosa darf dieselben Originale weder wieder in Karls Händen noch bei der Klientin auf dem Tisch oder unter Karls Arm zeigen. Zulässig sind nur Abschriften, Notizen, Erinnerung und der ausdrückliche Verweis auf den sicheren Verwahrort.
- Eine gesicherte Schutzperson bleibt nach ihrer sichtbaren Übergabe oder Grenzpassage offstage. Statische Orts-Roster dürfen sie in einem nachfolgenden Showdown nicht erneut ins Szenenbild holen; die eigentliche Sicherungsszene zeigt sie dagegen weiterhin.
- Dauerhafte Requisitenzustände gelten bis zu einer ausdrücklich erzählten Reparatur oder Ersetzung. Margaretes beim Einbruch zerbrochene Brille darf deshalb auch in späten Wohnungs-, Flucht- und Finaleszenen nicht wieder intakt auf ihrer Nase erscheinen.

### Brauer-Regressionsregeln aus dem Produktionslauf v1733

- Eine Romance-Aktion ist kein Ermittlungs-Klick. `Näher kommen`, romantische Gesten und Übernachtung dürfen kein noch offenes Kernindiz, keine Registerauskunft und keinen Zielstatus vorwegnehmen. Bei Ruth Kellner gilt besonders: „Erwin/Brauer wurde registriert, aufgenommen, ist im Westen oder in Sicherheit“ darf erst nach der echten Marienfelder Registerprüfung erscheinen. Der Romance-Text bleibt trotzdem konkrete, natürliche Prosa und darf nicht in eine technische Sperranweisung kippen.
- Bei mehreren erreichbaren Romance-Figuren bindet jeder Status- und Abwesenheitshinweis an die tatsächlich etablierte Partnerin (`romanceNpc`/letzte Romance), nie pauschal an die erste `ROMANCE`-Figur im Setup. Ein Ruth-Pfad darf außerhalb Marienfeldes nicht plötzlich Greta als aktuelle Romanze nennen.
- `ROMANTIK` und `UEBERNACHTUNG` bleiben zwei verschiedene Handlungen. Eine normale Annäherung darf Zeit fortschreiben, aber weder Schlaf, gemeinsames Bett noch „Morgen danach“ behaupten. Erst der ausdrücklich gewählte Übernachtungsbutton setzt Nacht, Climax, Privatort und Morgenbild.
- `immer:true` bedeutet nur garantierte Anwesenheit, solange die Figur physisch am Ort ist. Flucht, Abholung, Verhaftung, Übergabe oder anderer terminaler Abgang gewinnen dauerhaft gegen die Ortsbindung. Das gilt zugleich für Prosa, Haupt-UI und Bildvariante; ein geflohener IM darf nicht in der nächsten Mahlke-Szene wieder an der Wand stehen.
- Festnahmeauslöser stammen ausschließlich aus der sichtbaren Spieleraktion. Eine im Inventar vorhandene PPK oder eine freie Modellformulierung darf niemals rückwirkend „Die gezogene Walther …“ erzeugen, wenn Karl `Mitgehen` gewählt hat. Das Abnehmen der geholsterten Waffe beim Zugriff bleibt zulässig und muss von einem tatsächlichen Ziehen unterschieden werden.
- Festnahmefahrt, Header und Szenenbild verwenden denselben aktuellen Zeitslot. Vormittag/Nachmittag verbieten eine gegenwärtige „Fahrt durch das nächtliche Berlin“; Abend/Nacht verbieten bleiches Tageslicht. Historische Rückblicke auf eine frühere Tatnacht bleiben davon unberührt.
- Feste Innenraumbilder gewinnen auch bei Rückkehr-, Recovery- und Romance-Szenen gegen eine Prosa, die Karl vor Baracke, Eingang oder auf dem Gehweg stehen lässt. Marienfelde zeigt die Registratur mit Ruth und Meissner; die Szene muss eintreten und dort enden.
- Ein harter MfS-/Hauptmann-Gegner behält seine Rolle auch dann, wenn ein Kampfpfad nur den Anzeigenamen übergibt. Identitätsverlust auf Default-HP ist ein Balancefehler. Stärke-5-Gegner fallen nicht durch den ersten Toaster-/Schlagstocktreffer sofort K. o.; Rex und Party erhöhen Trefferchance und Kontrolle, aber für den endgültigen K. o. braucht es gegen einen frischen harten Einzelgegner mindestens einen weiteren realen Wirkungstreffer.
- Die PPK bleibt auch gegen harte Gegner ein einmaliger Distanz-/Druckvorteil: kein automatischer Schuss, keine Wunde, Flucht oder Ausschaltung. Ein schweres Verbrauchsitem darf deutlich stärker sein, verschwindet aber nach dem Einsatz und trägt Ruf-/Eskalationsrisiko.
- Knackige Konfrontationsgewalt trifft Arm, Schulter oder Rumpf und zeigt Wucht, Atemverlust, Taumeln, Sturz oder beschädigte Kleidung. Unzulässig sind insbesondere Schläfen-/Kopftreffer als K.-o.-Abkürzung, verdrehte Augen, regungslose Körper und Blut-Rinnsale. „K. o.“ bedeutet im Spiel kampfunfähig und benommen, nicht zwingend bewusstlos oder schwer verletzt.
- Ein Bildvariantensatz wird auch nach dem Wirkungstreffer geprüft. Vor dem Treffer darf Vollmer aufrecht stehen; danach muss ein benommener/gefesselter Körper als solcher sichtbar sein oder aus einem belegten terminalen Grund fehlen. Dasselbe Motiv unverändert vor und nach K. o. ist Bild-/Zustandsdrift.
- Dynamische Begleiter brauchen konkrete Besetzungsvarianten an wiederkehrenden Hauptorten. Für Brauer sind mindestens Hilde-Wohnung mit Rex, Wäscherei mit Greta+Vollmer+Rex sowie Lokschuppen mit Mahlke nach Abgang des IM jeweils bei Tag und Nacht Produktionspflicht.
- Beim Abschlussort reicht eine korrekte Personenleiste nicht: Wenn Hilde im Büro für den Bericht sichtbar wartet, muss die Ankunftsprosa sie ebenfalls nennen. Umgekehrt darf ein allgemeiner Büro-Rückkehrtext sie vor dem Abschluss nicht erfinden.

### Lindenbaum-Regressionsregeln aus dem Produktionslauf v1734

- Fallgebundene Haftreparaturen dürfen niemals durch einen bloßen Namen aus einem anderen Fall ausgelöst werden. Krollwitz-/Görke-Haft gilt nur, wenn Krollwitz wirklich zum aktiven Fall-Setup gehört. Brakke, Vollmer oder ein anderer MfS-Offizier dürfen keinen fallfremden Austausch von Aktion, Ort, Tageszeit, Fahrzeug oder Vernehmer verursachen.
- Eine normale Romance ist eine unmittelbare kurze Mikroszene. Sie darf Zeit intern geringfügig verbrauchen, aber niemals Nacht zu Morgen umbrechen, Schlaf oder Aufwachen erzählen oder den getrennten `UEBERNACHTUNG`-Button ersetzen. Nur die ausdrücklich gewählte Übernachtung setzt Privatort, Morgenmodus und Partnerinnen-Anwesenheit.
- Romance-Prosa bleibt strikt persönlich: kein neues Kernindiz aus irgendeinem anderen Fallort, kein spontanes Geständnis, keine unbekannten Männer vor der Tür, kein Poltern und kein anonymer Cliffhanger. Ein echter bereits mechanisch laufender Konflikt muss zuerst gelöst werden; er darf nicht als romantische Dekoration missbraucht werden.
- Eine Romance-Figur reagiert als eigenständiger Mensch mit Haltung, Grenzen, Humor, Begehren, Vorsicht und möglichen Interessen. Sie darf weder austauschbare Belohnung noch kostenlose Hinweisgeberin sein. Das Bild muss ihren tatsächlichen Morgenstatus zeigen: noch anwesend oder bereits fort, niemals beides zugleich.
- Ein terminal übergebener oder geflohener Gegner bleibt aus Prosa, `personenImRaum`, Haupt-UI, Optionen, Bild und späteren Romance-Szenen entfernt. Rückblicke nennen ausschließlich das belegte Schicksal. Der Abschluss darf nach einer bereits sichtbaren Polizeiübergabe keine zweite Entscheidung über Freilassen, Schweigegeld oder erneute Festnahme anbieten.
- Ein bezwungener Gegner mit einem noch offenen personengebundenen Kernhinweis bleibt befragbar. `Durchsuchen` darf keine frei erfundenen Notizbücher, Schlüssel oder Dienstausweise erzeugen, wenn das kanonische Indiz eine Aussage beziehungsweise Konfrontation verlangt. Erst danach folgt wahlweise Durchsuchung, Fesselung oder Übergabe.
- Die Bildfolge einer Item-Konfrontation wird zustandsweise geprüft: Brakke steht vor der Wirkung, taumelt sichtbar im gelben Stinkbombennebel und sitzt nach Handschellen/Fixierung am Boden. Ein unverändertes stehendes Druckmotiv nach diesen Aktionen ist ein klarer Bildfehler.
- Eine MfS-Major-Übergabe an die Volkspolizei ist ein politischer Ausnahmevorgang. Sie braucht Roth beziehungsweise ein benanntes zuständiges Team, versiegelte Beweise, Zeugen und Protokoll. Für 1953 ist ein `Framo V 901` plausibel; `Barkas` ist anachronistisch und verboten. Die Szene darf den Zugriff weder beiläufig noch folgenlos darstellen.
- Reise-Popups mit vorausgewählten Begleitern müssen diesen Zustand ausdrücklich erklären. Der Test klickt zum Mitnehmen nicht nochmals auf die bereits markierte Person, sondern bestätigt direkt; ein zusätzlicher Klick ist der bewusste Abwahltest.
- Grammatikfehler in harten Aktionsfolgen werden an der gemeinsamen Auslieferungsgrenze geprüft. Insbesondere heißt es bei Karl: „du verkeilst … und schnappst die Handschellen“, nicht „und schnappen“.

### Görke-/Haft-Regressionsregeln aus dem Produktionslauf v1735

- Ein sichtbarer Krollwitz-Zugriff braucht einen vollständigen deutschen Einführungssatz. Satzfragmente wie „Dr. Neben ihm“ sind P1-Prosa- und Figurenfehler: Baumgarten wird als anwesender Verteidiger konkret benannt, danach erst wird Krollwitz räumlich zu ihm gesetzt.
- Festnahmefahrt, Header und Bild verwenden dieselbe Tageszeit. Wenn der Zugriff am Nachmittag erfolgt, bleibt die Transportprosa zeitneutral oder zeigt Tageslicht; „dunkle Abendstraßen“ sind erst ab Abend zulässig. Reparaturtexte dürfen keinen künstlichen Zeitsprung behaupten.
- Der Festnahmezugriff benennt die tatsächliche Beschlagnahme vollständig: Walther, Geld, Notizbuch, Schlüssel und der restliche Tascheninhalt werden bei der Aufnahme einbehalten. Die Engine darf diese vorübergehende Haftverwahrung nicht mit dauerhaftem Itemverlust verwechseln.
- Eine reguläre Freilassung gibt Mantel, Brieftasche, Notizbuch, Schlüssel, Walther und alle übrigen nur bei der Aufnahme einbehaltenen persönlichen Sachen sichtbar zurück. Haupt-UI, Inventar und Prosa müssen danach dieselbe wiederhergestellte Ausrüstung behaupten.
- Ein friedlich angebotenes Item ist eine echte Übergabe und keine kostenlose wiederholbare Sozialaktion. Nimmt die Figur Kaffee, Zigaretten, Korn oder eine andere Aufmerksamkeit an, wechselt der Gegenstand engine-seitig den Besitzer und verschwindet aus Karls Inventar. Ablehnung ohne Übergabe bleibt nur bei einem ausdrücklich mechanisch ausgewerteten Ablehnungspfad zulässig.
- Bohnenkaffee darf Vertrauen und Zugang erleichtern, ersetzt aber kein definiertes Kernindiz. Der Lauf protokolliert getrennt: Itemverbrauch, sichtbare Reaktion, Ruf-/Stimmungswirkung und danach tatsächlich gesicherte Aussage oder Akte.
- Die Walther gegen einen vorbereiteten MfS-Hauptmann erzeugt Abstand und politische Eskalation, aber keinen automatischen Sieg. Zwei eingeführte Beamte dürfen Karl glaubhaft entwaffnen und in Haft bringen; das ist ein Balanceerfolg, sofern Aktion, Krollwitz, Transport, Zelle und Freilassung ohne Namens-, Orts- oder Zeitdrift bleiben.
- Der reguläre Haftpfad wird mindestens über zwei verschiedene Verhörhandlungen und den Schlaf-/Morgenausgang geprüft. Jede Runde bleibt in Zelle oder Verhörraum, zeigt eine konkrete Reaktion und darf weder Phantom-Freilassung noch freie Reiseoptionen anbieten.
- Restore-Reparaturen müssen idempotent und heilend sein. Ein schon erzählter Türsatz, Zugriff, Transport oder Rückgabesatz darf nach Reload genau einmal vorkommen; dieselbe Migration zweimal auszuführen darf den Logtext nicht verdoppeln, und bereits von einer älteren Migration gespeicherte Duplikate werden beim nächsten Laden auf eine Instanz reduziert.

### Stein-Regressionsregeln aus dem Produktionslauf v1738

- Politische Sicherung ist erst bestanden, wenn der Vollzug sichtbar erzählt ist. Ein Grenzbutton darf nicht nur den Wartesaal erreichen und mit „Du musst sie jetzt durchbringen“ enden: Margarete passiert die Kontrolle, überschreitet die Sektorengrenze und wird jenseits davon von einem benannten oder bestätigten Westkontakt übernommen.
- Die Akten- und Personen-Sicherung bleiben zwei getrennte physische Wahrheiten. Nach der Übergabe an Vera sind die Originalakten weder bei Karl noch in Margaretes Koffer; die spätere Grenzszene nennt den sicheren Verwahrweg ausdrücklich und erfindet keine zweite Aktenmappe.
- Ein Kontaktgespräch berücksichtigt den bereits erreichten Beweiszustand. Hat Karl die Originalmappe im Stellwerk geborgen, darf Vera nicht behaupten, sie liege noch dort. Vor der Übergabe liegt sie sichtbar bei Karl; nach der Übergabe verlässt Vera das Café mit der Mappe.
- Sichtbarer Abgang entfernt eine Figur sofort gemeinsam aus `personenImRaum`, Haupt-UI und Anwesenheitsbild. Das gilt auch für Formulierungen wie „wendet sich ab“ sowie „steht auf und verliert sich zwischen den Gästen“. Eine Namensnennung im Abschiedssatz darf die Figur nicht wieder aktivieren.
- Anwesenheitsbilder bilden genau den aktuellen Roster ab. Mertens allein im Büro verbietet zwei zusätzliche MfS-Männer; Vera am Marmortisch braucht eine erkennbare Vera-Variante; nach ihrem Abgang fällt das Café auf das neutrale Motiv zurück. Margaretes Wohnungsgrundbild und Alternativtext müssen Margarete tatsächlich nennen.
- Tageszeit und Jahreszeit werden gemeinsam geprüft. Eine Nachtszene an der Auffangstelle hat keine aufgehende Sonne; ein Märztag ist nicht herbstlich; Morgenlicht wird nicht als Straßenlaternenlicht beschrieben.
- Erzählerprosa bleibt in der Du-Perspektive und natürlich. „gilt Vera für Karl“ wird zu „kennst du Vera“, und technische Roster-Sätze wie „Verwaltungsangestellter bleibt sichtbar“ werden als konkrete beobachtbare Handlung formuliert.
- Dauerrequisiten bleiben bindend: Margaretes Drahtgestellbrille liegt weiterhin zerbrochen auf dem Tisch, bis eine Reparatur ausdrücklich stattfindet. Sie darf bei der späteren Abholung weder intakt getragen noch als unbeschädigtes Trostobjekt benutzt werden.
- Gegnerprofil, Bild und UI teilen dieselbe Bewaffnung. Der ängstliche IM „Anker“ arbeitet mit Amtsdruck und notfalls einem Faustschlag, er erbt keine Dienstpistole eines regulären MfS-Offiziers. PPK- und Itemstärke werden gegen dieses reale Profil bewertet.
- Ein friedlich überreichter Verbrauchsgegenstand wird auch im frischen Produktionslauf sofort aus Karls Inventar entfernt. Der Gegenstand muss in der Prosa beim Empfänger landen; ein bloßer Stimmungsbonus bei unverändertem Inventar ist weiterhin ein Fehler.

### Ruf-Gegenlauf-Regressionsregeln aus Stein v1739

- Ein A/B/C/D-Rufvergleich braucht dieselbe physische Ausgangslage. Optionale Bedrohungen werden während eines Debug-Rufvergleichs aus einem fall-, ort-, gegner- und szenengebundenen Seed bestimmt; Renommee und Härte dürfen den Wurf nicht verändern. Außerhalb des kontrollierten Vergleichs bleiben optionale Bedrohungen zufällig.
- Die Stein-Eröffnung in Margaretes Wohnung ist kanonisch: Bis einschließlich Szene 2 steht immer der anonyme Mann im langen Mantel in der Tür. Mertens darf dort erst ab Szene 3 auftreten. Dadurch bleiben Eröffnungsprosa, Konfrontations-UI und Mantelmann-Bild zwischen Rufprofilen identisch.
- Ein neu gewürfelter Gegner wird vor dem Prosa-/Cast-Abgleich derselben Szene gebunden. Solange Prosa und aktive Konfrontation ihn noch nicht eingeführt haben, bleibt er aus Personenleiste und Anwesenheitsbild verborgen. Endet die vorherige Konfrontation, wird eine während ihrer Abschlussszene bloß vorgemerkte nächste Bedrohung verworfen und erst in einer späteren Szene sauber neu geprüft.
- Das Vergleichsprotokoll führt vier Profile: neutral `0/0`, sehr gut `+5/0`, schlecht `-5/0` und hart `0/+5`. Bei derselben freundlichen Ansprache schließt nur der schlechte Ruf den sonst passenden Weg; bei demselben leichten verbalen Druck öffnet nur der harte Ruf einen sonst scheiternden Weg.
- Im Verhör derselben zivilen Auskunftsperson startet sehr guter Ruf offener und mit zusätzlichem Fragespielraum. Schlechter und harter Ruf erzeugen Vorsicht und weniger Spielraum; die sichtbare Rufnotiz, Startwerte und tatsächlichen Grenzen müssen übereinstimmen.
- Schlechter Ruf hat auch in der roten Konfrontations-UI eine echte Folge: Eine bloße erste Beschwichtigung beendet die Lage nicht mehr, sondern senkt nur die Spannung; erst ein zweiter glaubhafter Schritt löst sie. Prosa, Gegnerzustand und UI müssen den Gegner nach dem ersten Schritt weiterhin am Ort halten.
- Sehr guter Ruf macht eine ruhige Haltung glaubwürdiger; harter Ruf lässt Gegner Karl ernst nehmen, macht Zeugen aber nervöser. Beides wird als konkrete Rufwirkung angezeigt und in der Reaktion erzählt, verleiht jedoch keinen automatischen Kampf-, Flucht-, Beweis- oder Deeskalationssieg.
- Schwere körperliche Eskalation bleibt in allen vier Profilen falsch. Maximale Härte darf keinen Kragenangriff, keine Folter und keinen unbelegten schweren Zugriff in einen richtigen Ermittlungsweg verwandeln.

### Vogt- und Haft-Regressionsregeln aus dem Produktionslauf v1744

- Eine verpflichtende Eröffnung muss Auftraggeberin, bisherige Auftragsdauer,
  vermisste Person, Beruf, Dauer des Verschwindens und den konkreten
  Einstiegsvorfall sichtbar dramatisieren. Ein generischer Orientierungsabsatz
  trotz vollständig konfiguriertem Opening-Brief ist ein P1-Fehler.
- Eine etablierte Klientin erkennt ihren seit einer Woche arbeitenden Ermittler
  bei der Rückkehr wieder. Ankunftsprosa darf Beziehungen, Übergaben und
  Wissensstand nicht auf Erstkontakt zurücksetzen.
- Fallorte mit markanten Objekten erhalten bei nachgewiesenem Cross-Case-Drift
  verbindliche Ankunftsprosa. Manfred Vogts Wohnung enthält Schreibtisch,
  Zeitungsstapel, Streckenskizzen, Aschenbecher und Mantel, aber keine
  fallfremde Vitrine, Schmuckauslage oder Samtspur.
- Jeder mechanisch gebuchte Vogt-Kernhinweis braucht eine eigenständige
  Mikroszene. Sigrid übergibt in der Bibliothek kein erfundenes Geheimnotizbuch;
  das Überwachungsprotokoll stammt aus der Ablage. Der Haftbeleg zeigt
  Transportliste, Datum, Haftort und Verhörgrund statt eines Questlog-Satzes.
- Fallgebundene MfS-Offiziere respektieren strukturierte Ortsgates. Pieck darf
  vor dem belegten Schlusszugriff nicht als Begleiter in der Redaktion oder an
  einem beliebigen Reiseort erscheinen. Sein erster sichtbarer Auftritt nennt
  Name, Dienstgrad, räumlichen Eintritt und Sicherungspersonal, bevor die rote
  Konfrontations-UI erscheint.
- Pro Fall ist höchstens eine Haft-Episode zulässig. Nach einer Freilassung
  werden neuer MfS-Encounter, erneute Haftvormerkung und ein direkter zentraler
  Zustandswechsel gemeinsam blockiert; hohe Restspannung darf diese Schranke
  nicht umgehen.
- Schlafmarker, Aufwachphase, Datum, Header, Bild und Freilassungsprosa rechnen
  alle vom Zeitstand vor dem bewusst bestätigten Schlafklick. Rund acht Stunden
  Schlaf ab Mittag dürfen nicht gleichzeitig als Nacht in der UI und neuer
  Morgen in der Prosa erscheinen.

## Mindestprotokoll pro Run

- Fall, Version, Strategie, Seed, Start-/Endzeit, Szenenzahl, Ergebnis und Abbruchgrund.
- Wochentags-/Datumscheck.
- Assertion Report und `Historische Anker`.
- Treffer zu `W6-BLOCK`, `ORT-PROSA-BRUCH`, `TRUTHBEAT-DIAG`, `BEAT-DIAG`, `INDIZ-GATE`, Behandlung, Klientenfrist, Romantik und `personenImRaum`.
- Pro Szene Bildstatus (`Datei`, `Notfalltafel` oder `Fehler`) sowie Abgleich von zentralen Personen, Ort, Zeit und Zustandsrequisiten.
- Getestete Romance-Stufe und -Variante; getestete Rex-Kommandos, Trude-Sortiment, Items, PPK- und Team-/Kombiaktionen.
- Getestetes Rufprofil (`Renommee/Härte`) und Vergleichsprofil; Unterschiede bei Sozialweg, Verhör, Informantenpreis, Konfliktreaktion, Prosa und Folgerecap.
- Figuren-Tiefenbefund für zentrale Zeugen, Gegner und Romance-Figuren; Stasi-Bedrohungsbefund bei politischen Fällen.
- Gefundene Stil-Tics mit Anzahl und Szenennummern.
- Befunde nach P0/P1/P2/P3, jeweils mit Originalsatz, Enginezustand und Root Cause.
- Fixversion, Regressionstest, Commit und Ergebnis des Gegenlaufs.

## Aktuelle Fallbewertung und Prüfvertrauen — Release v1743

Diese Tabelle bewertet die **Spielqualität**. Das **Prüfvertrauen** ist davon
getrennt: Ein länger zurückliegender vollständiger Produktionslauf senkt nicht
automatisch die Qualität eines Falls. Ohne belegten Qualitätsrückschritt wird
eine Bewertung nicht allein wegen geringerer Testfrische herabgesetzt.

| Rang | Fall | Spielqualität | Prüfvertrauen v1743 |
|---:|---|---:|---|
| 1 | Strauss | 9,4/10 | sehr hoch |
| 2 | Lindenbaum | 9,3/10 | sehr hoch |
| 3 | Stein | 9,3/10 | sehr hoch |
| 4 | Görke | 9,2/10 | sehr hoch |
| 5 | Brauer | 9,1/10 | hoch |
| 6 | Krause | 9,1/10 | hoch |
| 7 | Wessel | 9,0/10 | mittel bis hoch |
| 8 | Kessler | 9,0/10 | mittel bis hoch |
| 9 | Schiffer | 9,0/10 | mittel bis hoch |
| 10 | Wegener | 8,9/10 | mittel |
| 11 | Brandt | 8,9/10 | mittel |
| 12 | Hollenbeck (Lindner-Auftrag) | 8,9/10 | mittel |
| 13 | Achterberg | 8,8/10 | mittel |
| 14 | Vogt | 8,8/10 | mittel |

Strauss, Lindenbaum, Stein und Görke bilden die zuletzt vollständig oder
gezielt intensiv auf Produktion geprüfte Spitzengruppe. Die übrigen zehn Fälle
sind strukturell spielbar und regressionsgrün, brauchen aber rotierende frische
Produktionsläufe mit Ruf-, Rex-, Item-, Romance-, Haft- und Alternativpfaden.
`Prüfvertrauen mittel` bedeutet deshalb **nicht**, dass der Fall nur eine
7er- oder niedrige 8er-Spielqualität hätte.
