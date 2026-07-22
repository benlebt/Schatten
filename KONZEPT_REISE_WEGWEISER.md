# Konzept: Reise-Popup als Wegweiser ("wo ist der nächste sinnvolle Schritt?")

Status: KONZEPT, Projektleitung-Kernentscheidung getroffen. Schrittweise Umsetzung. Leitidee (Projektleitung): dem Spieler IMMER
visuell klar kommunizieren, wo der nächste sinnvolle Schritt ist. Die Orte im Reise-Popup werden wie "Levels" lesbar.

## Ist-Zustand (geprüft)
- offeneIndizienAmOrt(loc) zählt korrekt: gefundene Indizien (gefundeneIndizIds) fallen raus. KEIN Zählfehler.
- Anzeige "● X offen" (Z17625) erscheint nur bei offen>0. Korrekt.
- ABER: Der Zähler unterscheidet NICHT zwischen "jetzt erreichbar" und "zeit-/NPC-gesperrt". Beispiel Margarete-Fall:
  - frachtliste_stempel: braucht npc=wahler + zeit=vormittag/mittag/nachmittag
  - uebergabe_beobachtet / notiz_wahler_gleis: zeit=abend/nacht
  -> Nachts zeigt die Reichsbahndirektion "offen", obwohl man tagsüber + mit Wahler hin muss. Der Spieler sieht
     "da ist was", kommt aber gerade nicht ran. Das ist die Kommunikations-Lücke, die Projektleitung bemängelt.

## Projektleitung-Entscheidung
Zähler zeigt BEIDES GETRENNT: "● 1 jetzt · 1 später"
- "jetzt" = offene Indizien, deren Gates (Tageszeit + NPC) AKTUELL erfüllt sind -> jetzt erreichbar.
- "später" = offene Indizien, die zeit-/personengesperrt sind -> da wartet was, aber nicht jetzt.
- Sind alle offenen gerade erreichbar: nur "● X jetzt". Sind alle gesperrt: nur "● X später".

## Drei Bausteine (schrittweise)
### R1: Zähler aufteilen "jetzt / später"
- Neue Hilfsfunktion: offeneIndizienAmOrtNachErreichbarkeit(loc) -> { jetzt, spaeter }.
  - Für jedes nicht gefundene Indiz prüfen: Tageszeit-Gate (ind.zeit) + NPC-Gate (ind.npc, muss am Ort sein).
  - Gate erfüllt -> jetzt++, sonst spaeter++.
- Anzeige: "● 1 jetzt · 1 später" (gold für jetzt, gedämpft für später). Nur jetzt>0 -> "● 1 jetzt". Nur spaeter>0
  -> "● 1 später" (gedämpfte Farbe). Beides 0 -> kein Marker (Ort erledigt, siehe R2).

### R2: Erledigte Orte als "fertig" markieren (wie abgeschlossene Levels)
- Ein Ort, der MAL Indizien hatte (loc.indizien.length > 0) und an dem jetzt ALLE gefunden sind (offen==0):
  -> Haken ✓ + gedämpfte/grüne Färbung "hier alles gefunden". Klick bleibt möglich (man KANN hin, muss aber nicht).
- Orte ohne definierte Indizien (reine Reise-/Service-Orte): kein Haken, kein Zähler (neutral).
- Projektleitung: "wie Levels - dort haben wir alle Indizien, müssen nicht mehr hin, können aber. Muss visuell klar sein."

### R3: Das ZIEL golden markieren (Abschluss-Wegweiser)
- Wenn die Sicherung ansteht (Wahrheit erkannt + Person/Akten noch nicht gesichert) und ein bestimmter Ort das
  Sicherungsziel ist (z.B. Charité=Helene, Revier=Roth), dann diesen Ort im Reise-Popup GOLDEN umrahmen + strahlen
  lassen - analog zum "Fall lösen"-Button (option-btn-resolve-dominant). Plus Label "→ Margarete hierher bringen" /
  "→ Beweise hierher".
- Klare Text-Kommunikation an den Spieler, WOHIN (Projektleitung: "Margarete muss zu Helene" muss klar kommuniziert werden,
  und im Reise-Popup ist Helenes Ort golden markiert, weil dort der Abschluss wartet).
- Voraussetzung: Sicherungs-Buttons (v587 A1) kennen schon die Ziele - das Reise-Popup spiegelt sie golden.

## Verhältnis zu v587 (Sicherungs-Buttons)
v587 gab die festen Sicherungs-Buttons (bei Doc lassen / zu Helene / Akten an Roth). R3 ist die VISUELLE Entsprechung
im Reise-Popup: derselbe Schutz-Ort wird beim Reisen golden hervorgehoben. So greifen Button (Aktion) und Reise-Popup
(Wegweiser) ineinander.

## Umsetzungsreihenfolge
R1 (Zähler jetzt/später) -> R2 (erledigte Orte Haken) -> R3 (goldenes Ziel). Jeder Schritt einzeln getestet + am Gerät.
