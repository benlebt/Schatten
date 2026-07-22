# KONZEPT: Baukasten-First — einheitliches Aktions-Interface (Projektleitung, v649/650)

## Ausgangslage / Strategische Richtung
Nach dem Ausblenden der Freitext-Eingabe (v648) ist der nächste konsequente Schritt: die KI-getriebenen
Standard-Buttons (OFFENSIV / DEFENSIV / ERKUNDEN / BEOBACHTEN, das alte A/B/C/D-System) zurückdrängen oder
ganz ersetzen durch das Baukasten-/Puzzle-System. Projektleitungs Vision: ein EINHEITLICHES Interface für alle
Aktionen nach dem Muster **Akteur — Verb — Ziel**.

## Projektleitungs konkrete Befunde (Screenshots Run v643, Bahnhof Friedrichstraße Sz10)
Diese KI-Buttons schlagen oft Unsinn vor, der den Spieler nicht weiterbringt und JEDER Klick kostet einen
teuren KI-Prompt:
- "Beobachte im Rückspiegel, ob du verfolgt wirst" — nur weil die Prosa (fälschlich) geflüchtet ist.
- "Beobachte Margaretes Reaktion auf die Morgennachrichten" — Blödsinn, bringt nichts.
- Standard-Buttons enthalten ORTE, zu denen man reist ("Rase Richtung Schöneweide zum Stellwerk") — das
  gehört in die Reise-Funktion, nicht in einen Offensiv-Button. Gegen die neue Engine-Logik.
- Die Buttons sind KI-getrieben und daher oft "schwachsinn" (Projektleitung wörtlich).

## Projektleitungs Ziel-Interface
Einheitlich, systematisch, engine-validiert:
```
Karl — befragen — Margarete
Karl — befragen — Mertens
Karl — durchsuchen — Umgebung   (Indizien / Items finden)
Karl — durchsuchen — Mertens    (Indizien / Items finden)
```
Plus: MEHRERE Aktionen pro Szene (wie der koordinierte Zugriff, aber für alle Verben):
```
Karl     — beobachten — NPC1 im Goldenen Anker
Margarete — ablenken  — NPC2 im Goldenen Anker
```
Offene Grundsatzfrage von Projektleitung: "Ob das ganze Spiel mit dem Puzzle-Baukasten funktionieren sollte/könnte
und wir so ein einheitliches Interface hätten für alle Aktionen."

## Redundante Personen-Verben (Projektleitungs Einschätzung, zu prüfen)
Im NPC-Popup sind laut Projektleitung einige Verben redundant geworden, seit jeder anwesende NPC Aktionen hat:
- "In Sicherheit bringen" (bei Margarete): redundant — beim Fall-Abschluss gibt es ohnehin die speziellen
  Sicherungs-Buttons. Im Personen-Popup doppelt.
- "Beschützen": vermutlich redundant.
- "Beobachten" (auf NPC): vermutlich redundant — "was wollen wir sie beobachten? Wir wollen sie befragen und
  ihr Kommandos geben." → Kernverben pro NPC: BEFRAGEN + (Kommandos) + DURCHSUCHEN, Rest in den Baukasten.

## Was das löst (Analyse Claude)
Wenn die KI keine Handlungsoptionen mehr VORSCHLÄGT, sondern nur noch ERZÄHLT, was die Engine entschieden hat,
verschwindet eine ganze Bug-Klasse auf einen Schlag:
- Keine Orte-in-Offensiv-Buttons mehr (Reise ist Reise).
- Keine sinnfreien Vorschläge ("Rückspiegel", "Morgennachrichten").
- Keine KI-Eigenmächtigkeit bei der Aktionswahl (nur noch bei der Prosa-Erzeugung).
- Determinismus: jede Aktion ist vorher engine-geprüft (Stärke/Härte, Anwesenheit, Item-Besitz).

## Risiken / was zu klären ist (NICHT übereilen)
1. Verliert das Spiel an "Atmosphäre", wenn die KI keine situativen Optionen mehr vorschlägt? Die KI-Vorschläge
   geben manchmal Ideen, auf die der Spieler nicht käme. Gegenargument Projektleitung: die meisten sind Unsinn.
2. Multi-Aktion pro Szene (Karl + Margarete gleichzeitig) gibt es schon für KOORDINIERTER ZUGRIFF — muss auf
   ALLE Verben verallgemeinert werden (befragen, durchsuchen, beobachten, ...). Großer Bau.
3. Was passiert mit Spezial-Buttons (Reise, Schlafen, Heilen, Fall lösen, Notflucht, Romance, Übernachtung)?
   Die sind KEINE KI-Vorschläge, sondern feste Engine-Aktionen — die bleiben, unabhängig vom A/B/C/D-Umbau.
4. Übergangsweg: erst A/B/C/D OPTIONAL machen (ausblendbar wie Freitext), Baukasten als Hauptweg testen, dann
   ggf. ganz abschalten. NICHT in einem Schritt hart entfernen.
5. System-Prompt bleibt nötig, solange die KI Prosa schreibt (Ton/Noir/Historik). Baukasten-First betrifft die
   EINGABE, nicht die Prosa-Erzeugung. (Reine deterministische Prosa = nochmal eigene, größere Frage.)

## Empfohlene Reihenfolge (Vorschlag Claude, noch NICHT freigegeben)
- Schritt 1: Redundante NPC-Verben aufräumen (beobachten/beschützen/in-sicherheit-bringen prüfen+entfernen).
  Klein, risikoarm, sofort spürbar. Braucht Projektleitungs Freigabe pro Verb.
- Schritt 2: A/B/C/D-Buttons über einen Master-Schalter ausblendbar machen (wie FREITEXT_AKTIV). Dann mit
  reinem Baukasten testen, ob sich das Spiel vollständig spielen lässt.
- Schritt 3: Baukasten um die fehlenden Verben erweitern (befragen/durchsuchen als Baukasten-Aktionen, nicht
  nur Konflikt). Multi-Akteur pro Szene verallgemeinern.
- Schritt 4: Wenn Schritt 2+3 im Test tragen: A/B/C/D standardmäßig aus.

## Status
NOCH NICHTS GEBAUT. Reine Konzept-Festschreibung auf Projektleitungs Wunsch ("du musst das alles mitloggen").
Nächster konkreter Schritt wartet auf Projektleitungs Entscheidung, wo wir anfangen.
