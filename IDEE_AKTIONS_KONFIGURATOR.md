# Ideenskizze: Aktions-Konfigurator (NPC- & Item-Aktionen kombinieren, ohne Tippen)

Status: NUR IDEE / noch kein Konzept. Benjamin sehr begeistert ("dann wäre es richtig geil"). Kommt nach UI + den
dringenden Bugs. Verbindet IDEE_ITEM_SYSTEM.md + das bestehende NPC-Verb-Menü zu EINEM System: ein
"Prompt-Konfigurator" mit standardisierten Aktionen, ohne dass der Spieler tippen muss.

## Kernidee
Der Spieler baut seinen Zug aus Bausteinen zusammen (Akteur + Aktion + Ziel), per Buttons - das erzeugt einen
strukturierten Prompt an die KI. Statt Freitext "Doc Wagner lenkt die Gegner ab und ich fessle sie" klickt man das
zusammen. Freitext (Szene 25 im Run) war der manuelle Vorläufer - das soll systematisch per Buttons gehen.

## Baustein 1: Party-NPCs aktiv einsetzen
Aktuell kann man einen NPC anklicken -> befragen/beobachten/bedrohen/angreifen. ERWEITERN um:
- Party-NPC als HANDELNDEN einsetzen: "Doc Wagner soll die Gegner ablenken / angreifen / bestechen".
- Gilt für Männer wie Frauen.
- FEHLT noch: "bestechen" als Verb (Benjamin: "wir brauchen noch bestechen").
- Aktion richtet sich auf ein Ziel: alle Gegner ODER ein bestimmter NPC.

## Baustein 2: Kombinierter Zug (Akteur1 + Akteur2 in EINEM Prompt)
DAS Highlight. Der Zug wird aus zwei Handlungen kombiniert, die zusammen an die KI gehen:
- Erst: was macht ein Party-NPC? (z.B. "Doc Wagner lenkt die Gegner ab")
- Dann: was macht Karl? (z.B. "Karl fesselt die Gegner" / angreift / bedroht / besticht / lenkt ab)
- Engine schickt EINEN Prompt: "Doc Wagner lenkt die Gegner ab, und Karl Mauer fesselt sie."
- Löst dann EINE Szene aus (der NPC-Teil allein löst noch keine aus - erst Karls Teil schließt den Zug ab).

## Baustein 3: Item-Aktionen nach demselben Muster
Wie NPC-Aktion, aber mit Item (vgl. IDEE_ITEM_SYSTEM.md):
- Auswahl: WER (Karl oder Party-NPC) -> WELCHES Item (Whisky/Banane/Kuchen/...) -> WELCHE Aktion -> WELCHES Ziel.
- Aktionen je Item: werfen, anbieten (bestechen), damit schlagen/angreifen, ablenken.
- Beispiele: Whiskyflasche über den Kopf ziehen ODER werfen ODER als Bestechung; Bananenschale ins Gesicht ODER
  hinwerfen (ausrutschen); Kuchen anbieten ODER ins Gesicht.

## Baustein 4: NPC-Cooldown (Einsatz-Erschöpfung)
Setzt man einen Party-NPC aktiv ein, ist er danach einige Züge "erschöpft" / nicht erneut einsetzbar. Cooldown je
NPC unterschiedlich (Charakter-Tiefe + taktische Planung):
- Kommissar Roth: ~2 Züge (fit, profi)
- Doc Wagner: ~3-4 Züge (älter)
- Margarete: ~5-6 Züge
(Werte aus Benjamins Beispiel; final tunebar. Karl selbst hat keinen / eigenen Rhythmus.)

## UI-Anbindung (passt zur Zwei-Kategorien-Struktur)
- Der NPC-Aktions-Teil ("Doc soll ablenken") allein löst KEINE Szene aus -> Konfiguration läuft, bis Karls Aktion
  den Zug abschließt. Frage fürs Konzept: Wo lebt der Konfigurator? Eigenes Overlay? Oder Erweiterung des NPC-Menüs
  unter "Übergang"?
- Ziel-Auswahl (alle Gegner / bestimmter NPC) als Button-Liste der anwesenden Gegner.

## Technische Herausforderung (eigenes System)
- Zug-Zustand: {akteur1, aktion1, ziel1, akteur2=Karl, aktion2, ziel2} sammeln, dann EIN Prompt bauen.
- Engine besitzt Anwesenheit/Party/Items (vgl. berichtet≠präsent + Item-System) - nur real anwesende NPCs/Items
  einsetzbar.
- Cooldown-Tracking je NPC (Map npcId -> einsatzbarAbSzene).
- Prompt-Bau: klare, standardisierte Sätze für die KI ("X tut A gegen Z, dann tut Karl B gegen Z").
- Kombi darf Spannungs-/Verfassungs-/Erfolgsmechanik korrekt auslösen (zwei Handlungen = eine Szene).

## Reihenfolge / Verhältnis zu anderen Ideen
Hängt eng mit IDEE_ITEM_SYSTEM.md zusammen (Item-Aktion = Spezialfall des Konfigurators) und mit der physischen
Anwesenheit (nur anwesende NPCs/Items). Sinnvoll als EIN großes "Aktions-/Engine-Objekt-System" konzipieren:
1. physische Anwesenheit (Fundament, kommt zuerst - löst auch akute Bugs),
2. dann Items + NPC-Aktions-Konfigurator + Cooldowns gemeinsam.
Konzeptpapier VOR Code. Nicht in laufende UI-/Bug-Fixes quetschen.
