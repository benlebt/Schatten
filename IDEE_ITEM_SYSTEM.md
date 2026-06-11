# Ideenskizze: Item- & Inventar-System (Finden, Geben, Anwenden)

Status: NUR IDEE / noch kein Konzept. Sehr zeitnahe Erweiterung gewünscht (Benjamin). Kommt NACH UI-Umbau.
Verwandt mit IDEE_SCHLUESSEL_SCHLOSS.md (beides: Engine besitzt Gegenstände/Wissen, Spieler wendet sie an).
ChatGPT hat Items früher schon angeregt; passt zu "GTA in Schwarzweiß".

## Die Vision (Benjamin)
Echte Items, die man findet, einsammelt, weitergibt und ANWENDET. Items werden zu sozialen/komischen/taktischen
Werkzeugen - kein reines Deko-Inventar.

### Beispiel-Items (erweiterbar)
- Whiskyflasche (bestechen, betrunken machen)
- Bananenschale (werfen, ausrutschen lassen, ablenken)
- Kuchen / Torte (anbieten=bestechen/ablenken, oder ins Gesicht werfen=angreifen)
- Feuerwerkskörper (werfen, ablenken, Panik)
- Hundehaufen (werfen, angreifen/erniedrigen)
- Waffe (mitnehmen, einem Party-Mitglied GEBEN -> es kann schießen)
- (weitere: Zigaretten zum Bestechen, Geldscheine, Schlüssel, Akten, Fotos ...)

## Wie man Items bekommt
1. AN ORTEN: bestimmte Orte haben Items (z.B. Bananenschale am Bahnhof). Aufsammeln = "Bleibt in der Szene"
   (kostet keine Szene), wenn es nur Aufheben ist.
2. BEI NPCs durch DURCHSUCHEN: neue NPC-Aktion "Durchsuchen". Bei Gegnern oft erst nach K.O. ("erst k.o.
   schlagen, dann Taschen durchsuchen" -> Whiskyflasche, Waffe, Codewort/Schlüssel). Bei Freundlichen evtl.
   irritierend/nur mit Erlaubnis. Durchsuchen ist je nach Kontext szene-auslösend (Kampf) oder nicht (Leiche/
   Bewusstloser ruhig durchsuchen).

## Neue NPC-Aktion: DURCHSUCHEN
Erweitert das NPC-Verb-Menü (vgl. UI-B3). Vor allem bei Gegnern wichtig: bedrohen/angreifen/fesseln/DURCHSUCHEN.
Fesseln/K.O. evtl. Voraussetzung fürs gefahrlose Durchsuchen. Ergebnis: Item(s) ins Inventar.

## Items GEBEN (Party)
- Item an Party-Mitglied geben (z.B. Waffe an Margarete/Doc Wagner). "Bleibt in der Szene" (Verwalten-Aktion).
- Folge: das Mitglied KANN das Item anwenden (Waffe -> schießen, wenn es brenzlig wird; nicht mehr schutzlos).
- (Optional, evtl. zu tief: NPC-Fähigkeiten - manche schießen besser/schlechter. Erstmal NICHT, zu komplex.)

## Items ANWENDEN (über NPC-Auswahl-Dialog)
Im NPC-Dialog (vgl. UI-B3, Übergang-Modus) eine Aktion, bei der ein Party-Mitglied ein Item auf einen Ziel-NPC
anwendet. Beispiel Margarete hat Kuchen -> auf Bösewicht anwenden -> Optionen:
- Anbieten (bestechen) - freundlich, lenkt ab
- Ablenken
- Ins Gesicht werfen (angreifen)
Idee: ein allgemeiner "Benutzen/Anwenden"-Pfad, der das Item + die Absicht (bestechen/ablenken/werfen/angreifen)
kombiniert. Karl selbst kann Items genauso anwenden.

## Technische Herausforderung (warum eigenes System)
- Inventar-Datenstruktur (welche Items hat Karl / hat ein Party-Mitglied).
- Items mit Eigenschaften: typ, anwendbar-als (bestechen/werfen/ablenken/angriff), gibt-an-Party-Mitglied (Waffe).
- Item-Quellen: ort.items[], npc.items[] (nach Durchsuchen/K.O.).
- ENGINE muss besitzen, wer was hat - die KI darf Items nicht erfinden/verschwinden lassen (vgl. Engine-Wahrheit).
- KI bekommt Item-Anwendung als klaren Kontext ("Margarete wirft Wahler die Torte ins Gesicht") + Mechanik-Folge.
- Inventar-Anzeige: gehört in "Bleibt in der Szene" (Ansehen kostet keine Szene); Anwenden in "Übergang".

## Designfragen für später
- Wie viele Items pro Fall/Ort? (Sparsam halten, sonst Item-Sammelspiel statt Noir.)
- Durchsuchen: immer K.O. nötig, oder bei Bewusstlosen/Toten auch ruhig? Bei Freundlichen erlaubt?
- Party-Mitglied mit Waffe: eigene Schieß-Aktion, oder erzählt die Engine das situativ?
- Item-Anwendung: feste Verben (bestechen/ablenken/werfen/angreifen) oder Freitext ("wirf die Torte")?
- Nur für einen Testfall (Margarete) erproben, dann ausrollen?
- Verhältnis zum Schlüssel-Schloss-System: gemeinsames "Engine-Objekt-System" (Items + Schlüssel) oder getrennt?

## Reihenfolge
ERST UI-Umbau (B2/B3 + ▶ raus) fertig + getestet. DANN entscheiden, ob Item-System ODER Schlüssel-Schloss-System
zuerst (evtl. zusammen als "Engine-Objekt-System" konzipieren, da verwandt). Konzeptpapier VOR Code (wie immer bei
großen Systemen). Nicht in den laufenden UI-Umbau quetschen.
