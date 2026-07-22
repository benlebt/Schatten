# Konzept: Weltwahrheit (Thema B) - Ort, Anwesenheit, Personen-Zustand als Engine-Besitz

Status: KONZEPT-ENTWURF zur Diskussion mit Projektleitung. NÄCHSTER GROSSER BLOCK (vor Items/NPC-Actions, die darauf
aufbauen). Drei ChatGPT-Lektorate in Folge (Runs 1800/1847/2007) + Projektleitungs Befunde zeigen auf denselben Kern:
Die Engine korrigiert nur den HEADER, aber die Prosa und die abgeleiteten Zustände widersprechen sich.

## Das Grundmuster (dieselbe Erkenntnis wie Indizien/Sicherung/Custody)
ENGINE BESITZT DEN ZUSTAND, KI ERZÄHLT IHN - nicht umgekehrt. Bisher gilt das für Indizien (v592), Sicherung (v587)
und Custody (v598-Wächter). Es fehlt für: ORT, PERSONEN-ANWESENHEIT, KLIENTEN-ZUSTAND.

## Gesammelte P1-Befunde (alle verifiziert)
B1. KLIENTEN-ZUSTAND widerspricht sich (Run 2007): Margarete in der Party (Engine), aber Prosa erzählt "nirgends
    gemeldet / abgefangen / nach Hohenschönhausen verlegt" - und danach sichert Karl sie trotzdem zu Helene.
B2. PROSA-ORT springt (Runs 1847+2007): Engine-Ort Auffangstelle, Prosa spielt am Stellwerk/Hackeschen Markt.
    Header-Korrektur reicht nicht - die Szene selbst ist am falschen Ort, Optionen passen nicht ("Wohnung durchsuchen"
    nach Flucht; "Wahler zur Rede stellen" bei Doc, obwohl Wahler nicht da ist).
B3. FLUCHT setzt keinen Engine-Ort (Run 1847 Sz8): Karl flieht im Opel, Engine korrigiert zurück zur Wohnung.
B4. BERICHTET ≠ PRÄSENT (bekannte Klasse): Wahler wird per Bericht ("bei Wahler gesehen") physisch in den Cast
    reintroduziert; Telefonate erzeugen Präsenz; Szene-1-Optionen "ruf Margarete an", obwohl sie im Personen-Menü steht.
B5. SCHLAF-ORT diffus (Run 1847): Schlafen bei Doc -> Prosa erzählt Aufwachen im Büro am Hackeschen Markt.

## Lösungsbausteine (je einzeln baubar, Reihenfolge = Vorschlag)
W1. CLIENT-STATE (klein, hoher Nutzen): caseProgress.clientState = 'with_karl'|'hidden'|'captured'|'secured' (+ ort).
    - Engine setzt ihn (Party-Add->with_karl, Text-Flucht-Detektor->hidden, Sicherung->secured, Festnahme-Ereignis->captured).
    - recap-PFLICHT-Regel je Zustand: with_karl -> KI darf NICHT "verschwunden/abgefangen/nirgends gemeldet" erzählen.
    - Widerspruchs-Wächter analog META-CUSTODY-Wächter (v598): erzählt die KI Gegenteiliges -> diag + ggf. Zustand folgen
      ODER Erzählung ignorieren (Entscheidung pro Richtung, Projektleitung fragen).
W2. ORT-TREUE-WÄCHTER (mittel): Bei Hauptort-Mismatch in Stage>=2 NICHT nur Header korrigieren:
    - Stufe 1: Retry mit hartem Orts-Prompt ("Die Szene MUSS an <Ort> spielen").
    - Stufe 2 (Retry erschöpft): kurze lokale Fallback-Szene am Engine-Ort statt falscher Prosa.
    - Kosten beachten: Retry = zusätzlicher Request. Nur bei ECHTEM Hauptort-Bruch (nicht bei Erwähnungen).
W3. FLUCHT-ORT (klein): Aktive Flucht (Kategorie FLUCHT/NOTFLUCHT ODER eindeutige Flucht-Prosa nach OFFENSIV) ->
    transienter Ort "Opel, auf der Flucht" (transient:true), erlaubte Optionen begrenzt (Reiseziel wählen/Verfolger
    abschütteln/mit Begleiter sprechen/anhalten); keine ortsgebundenen Optionen vom alten Ort.
W4. PRÄSENZ-QUELLE HÄRTEN (mittel): isNpcPhysicallyPresent als einzige Wahrheit für: Personen-Buttons, Konfrontations-
    Optionen, NPC-Gates der Indizien, Reintroduce. Berichts-/Telefon-Kontext (bei X gesehen / X am Apparat / X hat
    unterschrieben) erzeugt NIE Präsenz. KI-Optionen, die Abwesende direkt adressieren, werden umformuliert/gefiltert
    ("Stell Wahler zur Rede" -> nur wenn Wahler präsent; sonst "Fahr zu Wahler").
W5. SCHLAF-ORT (klein): Schlaf-Aktion trägt sleepLocation=engineCurrentLocation; Prompt: "Karl schläft und erwacht
    AM SELBEN ORT (<name>)"; Heimschlaf nur als eigene Option, wenn Büro bereisbar ("Nach Hause fahren und schlafen"
    = Reise+Schlaf).

## P2-Beifang (im selben Umbau günstig mitzunehmen)
- Setup-Cast-Audit zählt Präsenz falsch (Report-Bug, Run 2007: Margarete/Mertens als "nie aktiviert" gelistet).
- Tageszeittextur bei langen Nächten ("späte Nacht", "kurz vor Morgengrauen") - KEIN Auto-Schlaf (Arcade bleibt).
- Willi Kummer ortsgebunden (canJoinParty:false-Idee), Lemke nur-bei-Schutz.
- Kernbeweise vs. optionale Spuren in der X/13-Anzeige (Designfrage an Projektleitung, eigenes kleines Konzept).

## Empfohlene Reihenfolge
W1 (Client-State) -> W3 (Flucht-Ort) -> W5 (Schlaf-Ort) -> W4 (Präsenz-Härtung) -> W2 (Ort-Retry, teuerster Baustein).
Jeder Schritt einzeln getestet + Run dazwischen. ERST Projektleitungs Freigabe zum Konzept einholen.

---
## CHATGPT-FREIGABE + SCHÄRFUNGEN (verbindlich)
FREIGEGEBEN mit dieser Fassung: "Engine besitzt Ort, Anwesenheit und Klientenstatus. KI erzählt nur innerhalb
dieser Grenzen. Prosa-Detektoren dürfen Widersprüche erkennen, aber NICHT still Weltzustand ändern. Zustands-
änderungen nur durch Engine-Aktion, definierte Threat-Events oder explizite Spielerentscheidung."
SCHÄRFUNG W1 (wichtigste Korrektur): KEIN "Text-Flucht-Detektor -> hidden" (wäre Regex-Weltwahrheit). Stattdessen:
Widerspruch melden (diag CLIENT-STATE-WIDERSPRUCH) + Korrektur-Push für die nächste Szene. clientState-Modell:
{ npcId, status: unknown|with_karl|left_behind|hidden|captured|secured, locationId, securedAt, lastChangeScene,
lastChangeReason: party_add|player_action|threat_event|security_action }. with_karl ist STÄRKER als Cast (Cast =
sichtbar in Szene; clientState = Weltwahrheit). captured -> keine Party-Garantie-Rückkehr.
SCHÄRFUNG W2 zweistufig: W2a (billig, früh machbar): harter Engine-Ort als Weltzustand in JEDEM Prompt ("Die Szene
MUSS an <Ort> spielen; andere Orte nur als Gesprächsthema"). W2b (teuer, später): Mismatch-Erkennung NUR echte
Hauptort-Brüche ("Beim Verlassen des Stellwerks") nicht Erwähnungen ("die Spur führt zum Stellwerk"); Stage>=2
Retry, danach lokale Fallback-Szene.
W4-Ziel: DREI getrennte Wahrheiten - storyFacts (existiert im Fallwissen) / physicalPresence (am Ort) / party
(reist mit). isNpcPhysicallyPresent als EINZIGE Quelle für NPC-Buttons/Konfrontation/Personen-Indizien/Durchsuchen/
Bedrohen/Party/Kampf.
REIHENFOLGE final: W1 -> W3 -> W5 -> W4 -> W2a -> W2b. P2-Beifang strikt getrennt halten.
BEGRÜNDUNG Items-Reihenfolge: Items bauen auf derselben Wahrheit auf (wo liegt es, wer hat es, wer ist am Ort) ->
erst Weltwahrheit, dann Items/NPC-Actions.
