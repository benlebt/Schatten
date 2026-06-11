# Konzept: Sicherung als echte Engine-Aktion (Thema A)

Status: KONZEPT zur Freigabe durch Benjamin. NACH Freigabe -> schrittweise Code. Ziel: den politischen Fall
(Margarete) endlich ehrlich ABSCHLIESSBAR machen. Quelle: ChatGPT-Lektorat v585 + Benjamins Spielerlebnis
("Margarete längst bei Doc abgesetzt, Abschluss sagt trotzdem 'nicht in Sicherheit'").

## Das Problem (Ist-Zustand)
Die Sicherungs-Beats (akten_gesichert / margarete_gesichert) werden heute über REGEX-RATEN aus dem Aktionstext +
KI-Prosa-Bestätigung gesetzt (istSicherungsVollzug() + updatePoliticalBeats() + pendingSecurityIntent). Diese Kaskade
ist raffiniert, aber fragil: passt die Formulierung nicht exakt ins Muster, bleibt vollzug=false. Folge: Der Spieler
TUT das Richtige (Margarete zu Doc), aber die Engine erkennt es nicht -> Fall scheitert am Hard-Cap (AUFTRAG ENTZOGEN),
obwohl semantisch gelöst. Das ist die frustrierendste Klasse Fehler: richtig handeln, nicht belohnt werden.

## Die Lösung: feste Buttons statt Raten
Sobald die WAHRHEIT erkannt ist (truthRecognized / Stage 3), erscheinen in der "Übergang"-Sektion klar benannte
SICHERUNGS-AKTIONEN als Engine-Buttons. Klick setzt den Zustand HART - kein Regex, keine Prosa-Bestätigung nötig.
Die KI erzählt danach die Folge (mit Hard-Beat im Prompt), aber der Engine-Zustand steht schon fest.

### Welche Buttons? (abhängig vom Fall-Setup, hier Margarete)
KLIENT/PERSON sichern (setzt margarete_gesichert):
- "Margarete bei Doc Wagner in Sicherheit lassen"  (wenn sie dort ist / dorthin gebracht wird)
- "Margarete zu Schwester Helene bringen"
- "Margarete über die Sektorengrenze bringen"
AKTEN/BEWEISE übergeben (setzt akten_gesichert):
- "Akten an Kommissar Roth übergeben"
- "Akten an Vera Lindqvist übergeben"
- "Beweise an RIAS weitergeben"

(Die konkreten Ziele kommen aus dem Fall-Setup - Roth/Vera/RIAS/Helene/Doc sind die kanonischen Schutz-/Übergabe-
Kontakte des Margarete-Falls. Andere Fälle hätten andere/keine.)

### Was der Button-Klick HART setzt
- Person-Button -> caseProgress.clientSecured = true; clientSecuredAt = "doc_wagner"|"helene"|"grenze";
  politicalBeatsHit += 'margarete_gesichert' (wenn nicht schon drin).
- Akten-Button -> caseProgress.evidenceSecured = true; evidenceSecuredAt = "roth"|"vera"|"rias";
  politicalBeatsHit += 'akten_gesichert'.
- Danach: normaler chooseOption-Pfad mit einem klaren Aktionstext, damit die KI die Folge erzählt. Aber der Beat
  ist schon gesetzt, UNABHÄNGIG davon, was die KI schreibt.

### Voraussetzung / Sichtbarkeit der Buttons
- Erscheinen erst ab Wahrheit erkannt (sonst Spoiler/zu früh).
- Person-Sicherungs-Button nur, wenn die Person erreichbar ist (bei Karl, in Begleitung, ODER am aktuellen Ort -
  hängt mit Thema B physische Anwesenheit zusammen; für Thema A reicht erstmal: Person ist bekannt + Wahrheit erkannt).
- Akten-Übergabe-Button nur, wenn Karl die Akten/Beweise hat (Indiz vorhanden).
- Schon gesicherte Aspekte: Button verschwindet oder zeigt "✓ erledigt".

### Gegenstück: das Gate ehrlich anzeigen (Lektorat-P1)
Heute zeigt das Stand-Popup "3/5 min 3 würde-erfüllen JA", während der Hard-Cap "Gate nicht erfüllt" sagt -
widersprüchlich. NEU: für politische Fälle zwei Blöcke:
- Erkenntnis (weich): Wahrheit erkannt ✓, Wahler belegt ✓, Route belegt ✓ ...
- PFLICHT zum Abschluss: Akten gesichert ✗/✓, Margarete/Beweise gesichert ✗/✓
- Abschluss-Gate: JA/NEIN + Grund ("Akten nicht gesichert").
So sieht der Spieler JEDERZEIT, was noch fehlt - und die zwei festen Buttons sind der direkte Weg, es zu erfüllen.

## Was NICHT angefasst wird (Sicherheit)
- Die Erkenntnis-Beats (Route/Wahler/IM-Anker) bleiben wie sie sind (Prosa-Erkennung ist dort korrekt - das sind
  Entdeckungen, keine Handlungen).
- Das Regex-Raten (istSicherungsVollzug) bleibt vorerst als FALLBACK bestehen (falls der Spieler per Freitext
  sichert statt per Button) - es wird nur ENTLASTET durch die festen Buttons. Kein Abriss, nur Ergänzung.
- Andere Fälle (nicht-politisch) sind nicht betroffen (keine politicalBeats).

## Offene Designfragen für Benjamin
1. Sollen die Sicherungs-Buttons IMMER ab Wahrheit-erkannt sichtbar sein, oder nur am passenden Ort/wenn Kontakt
   erreichbar? (Einfacher: immer ab Wahrheit; sauberer: nur wenn sinnvoll - braucht etwas Thema B.)
2. "Margarete bei Doc lassen": Reicht das als VOLLE Sicherung (Abschluss möglich), oder nur als Zwischenstatus
   (clientSecuredTemporary), und die volle Sicherung ist erst Grenze/Helene? (Lektorat schlägt Zwischenstatus vor.)
   -> Vorschlag: bei Doc = volle Sicherung für den Abschluss (Doc ist sicherer Hafen). Einfacher + belohnt den Spieler.
3. Soll es zwei Enden geben (GOOD = Person UND Akten gesichert; PARTIAL = nur Wahrheit) oder ein Gate (beide Pflicht)?
   -> Vorschlag fürs erste: Pflicht = Wahrheit + Wahler + (Akten ODER Person gesichert). Ein klares "geschafft".
4. Reihenfolge der Umsetzung: erst die festen Buttons (Kern), dann die ehrliche Gate-Anzeige, dann der Assertion-
   Report-Fix (stage===4 ≠ gelöst). Drei kleine getestete Schritte.

## Umsetzungsschritte (nach Freigabe, je einzeln getestet)
A1. Sicherungs-Buttons in renderOptions (ab Wahrheit erkannt), die clientSecured/evidenceSecured + Beat HART setzen.
A2. Stand-Popup + Hard-Cap-Gate: ehrliche Pflicht-vs-weich-Anzeige.
A3. Assertion-Report-Fix: solved = istGelöst && !istGescheitert; stage===4 nur "beendet".
A4. (optional) Hard-Cap-Gnadenfrist: wenn Wahrheit spät + Spieler sichert aktiv, +3-5 Szenen.

---
## BENJAMIN-ENTSCHEIDUNGEN (Freigabe erteilt)
1. PERSON SICHERN: "zu Helene/Roth bringen" ist ok, ABER es muss KLAR kommuniziert werden, dass Margarete explizit
   dorthin gebracht werden muss, UND der Zielort muss über das Reise-Popup bereisbar sein. (Doc Wagners Praxis,
   Volkspolizei-Revier=Roth, S-Bhf Friedrichstr=Grenze sind bereisbar. Helene/Charité + Vera: nur anbieten, wenn als
   Ort im Fall-Reisemenü vorhanden - sonst weglassen.) Margarete bei Doc = sicherer Hafen, zählt.
2. ZWEI ENDEN (Claude-Empfehlung, Benjamin folgt "was macht am meisten Sinn"):
   - GOOD ENDING: Wahrheit + Wahler + Margarete UND Akten gesichert -> "alles richtig gemacht".
   - PARTIAL ENDING: Wahrheit + Wahler belegt, aber Person/Akten NICHT gesichert -> bittersüßes Noir-Ende, KEIN
     "AUFTRAG ENTZOGEN". Kein Lauf scheitert mehr unfair; der Spieler spürt den Unterschied solide vs. makellos.
   - Echtes Scheitern (AUFTRAG ENTZOGEN) nur noch, wenn nicht mal Wahrheit+Wahler erreicht sind.
3. SICHERUNGS-BUTTONS nur wenn Kontakt/Person erreichbar (sauberer Weg) - braucht etwas Anwesenheits-Logik (Thema B
   light): Person-Sicherung nur, wenn Margarete bei Karl/in Begleitung/am Ort; Akten-Übergabe nur, wenn Zielkontakt
   am aktuellen Ort ODER Zielort bereisbar + Akten im Besitz.

## UMSETZUNG (3 getestete Schritte, jetzt freigegeben)
A1. Sicherungs-Buttons (ab Wahrheit erkannt, nur wenn erreichbar) -> setzen clientSecured/evidenceSecured + Beat HART.
A2. Zwei-Enden-Logik + ehrliche Gate-Anzeige (Pflicht vs. weich) im Stand-Popup & Hard-Cap.
A3. Assertion-Report-Fix (stage===4 != gelöst; solved = istGelöst && !istGescheitert).
