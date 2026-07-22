# Konzept: Indizien- & Orientierungs-System ("weniger Dark Souls")

## Das Problem (aus Runs + ChatGPT-Lektorat)
Nach 51 Szenen: Stage 1, nur 2 Indizien. Indizien existieren nur als KI-Prosa-Texte
(`caseProgress.indizien` = Array von Strings), ohne Bindung an Orte. Der Spieler weiß nie,
**wo** noch etwas zu holen ist → frustrierendes Im-Dunkeln-Tappen.

## Die Lösung (Projektleitungs Vision)
1. **Vordefinierte Kern-Indizien**, fest an Orten/NPCs hinterlegt, mit Tageszeit-Bindung.
2. **Alle Orte von Anfang an freigeschaltet** (kein Raten, keine verpassten Orte).
3. **Reisemenü zeigt pro Ort**: Anzahl offener Indizien + Tageszeit-Hinweis ("Wahler nur vormittags").
4. **Service-Orte halten KEINE Indizien**: Doc Wagners Praxis, Charité, Imbiss Bei Trude (Heil/Ruhe/Kontakt).
5. **Hybrid**: Kern-Indizien zählen für Stages; KI darf weiter Atmo-Bonus liefern (zählt nicht).

---

## Datenstruktur

### Indiz-Objekt (neu, pro Ort im Fall-Setup)
```js
indizien: [
  { id: 'frachtliste_rotstempel',         // eindeutige ID
    text: 'Frachtliste mit rotem Reichsbahn-Stempel',  // Anzeigetext beim Fund
    npc: 'wahler',          // optional: nur bei diesem NPC zu holen (sonst am Ort allgemein)
    zeit: ['vormittag','mittag','nachmittag'], // optional: nur zu diesen Tageszeiten
    schluessel: ['frachtliste','stempel','rote tinte'], // KI-Prosa-Trigger ODER Spieleraktion
    stage: 2 },             // optional: hebt bei Fund auf mind. diese Stage (qualitatives Gate)
]
```

### Wo das hängt
Jeder Ort im `locations`-Array bekommt optional ein `indizien`-Feld.
Service-Orte (Doc Wagner, Charité, Imbiss) bekommen KEINS → halten nichts bereit.

### Fund-Tracking (neu)
```js
caseProgress.gefundeneIndizIds = []   // Set von gefundenen Indiz-IDs (für "offen"-Zählung)
```
Bestehendes `caseProgress.indizien` (Text-Array) bleibt für Anzeige/Prompt erhalten;
bei Fund eines Kern-Indizes wird sein `text` dort eingetragen UND seine ID in `gefundeneIndizIds`.

---

## Margarete-Fall: vorgeschlagene Kern-Indizien (Entwurf, du korrigierst)

**Ermittlungs-Orte (halten Indizien):**
- **Margarete Steins Wohnung**: (1) Margaretes Schilderung der Bedrohung [Sz1, da], (2) versteckte Akten-Kopie in der Wohnung.
- **Reichsbahndirektion Mitte**: (3) Frachtliste mit rotem Stempel [Wahler, vormittag-nachmittag], (4) Dienstplan zeigt Wahlers Nachtschichten, (5) Hinweis auf Stellwerk Schöneweide.
- **Bahnhof Friedrichstraße**: (6) Beobachtung der Schmuggel-Übergabe [abend/nacht], (7) Notiz "Wahler, 22 Uhr, Gleis 4".
- **Stellwerk Schöneweide**: (8) Die verlegten Original-Akten [abend/nacht, bewacht], (9) Wahlers Unterschrift auf Frachtbrief.
- **Goldener Anker** (Kneipe): (10) August Lemke als Zeuge belastet Wahler [nur abend/nacht!], (11) IM "Anker" Kontakt-Hinweis.
- **West-Berliner Auffangstelle**: (12) Vera Lindqvist als Beweis-Übergabe-Kontakt.
- **Café Kranzler**: (13) Treffen mit Vera / West-Perspektive (optional).

**Service-Orte (KEINE Indizien):** Doc Wagners Praxis, Charité, Imbiss Bei Trude, Opel (Fahrzeug).

→ ~13 Kern-Indizien. Stage-Schwellen dann qualitativ statt "Ind>=8".

---

## Tageszeit-Spürbarkeit — ZWEISTUFIG (Projektleitungs Präzisierung)
Wichtig: Es gibt ZWEI getrennte Zeit-Ebenen, die nicht immer zusammenfallen.

### Ebene 1 — Öffnungszeit des ORTS (neu: `oeffnungszeit`)
Ob die Fahrt sich überhaupt lohnt. Ein geschlossener Ort hält nichts bereit.
```js
{ name: 'Goldener Anker', ..., oeffnungszeit: ['abend','nacht'] }   // Kneipe: abends/nachts offen
{ name: 'Café Kranzler',  ..., oeffnungszeit: ['vormittag','mittag','nachmittag'] } // Café: tagsüber, abends ZU
```
Fehlt das Feld → Ort immer zugänglich (Büro, Wohnung, Bahnhof, Straße).

### Ebene 2 — Anwesenheit des NPCs (existiert: `zeit` am npc/indiz)
Wann die Person da ist, die das Indiz hat. Wahler vormittags, Lemke nur wenn Anker offen.
Meist deckungsgleich mit der Öffnungszeit, aber nicht zwingend (ein NPC kann auch nur
einen Teil der Öffnungszeit da sein).

### Reisemenü zeigt beides klar:
- **Offener Ort**: klickbar, "Goldener Anker · ● 2 offen · Lemke da"
- **Geschlossener Ort** (Öffnungszeit nicht erreicht): AUSGEGRAUT + NICHT KLICKBAR + Grund.
  z.B. morgens/mittags: "Goldener Anker · geschlossen · öffnet abends" (ausgegraut, kein Tap).
  abends am Café: "Café Kranzler · geschlossen · öffnet vormittags" (ausgegraut).
- So sieht der Spieler sofort: wohin kann ich JETZT, was ist später dran. Kein Leerlauf,
  keine vergebliche Fahrt. Das ist der Kern von "weniger Dark Souls".
- Indizien-Zähler ("● X offen") bleibt auch bei geschlossenem Ort sichtbar (du weißt: da
  wartet was, nur noch nicht jetzt) - aber der Ort ist erst zur Öffnungszeit anfahrbar.

### Margarete-Orte: konkrete Zeiten
- **Goldener Anker**: oeffnungszeit abend/nacht; Lemke (Zeuge) nur dann.
- **Café Kranzler**: oeffnungszeit vormittag/mittag/nachmittag; Vera (Zeugin/Kontakt) nur tagsüber.
- **Reichsbahndirektion**: oeffnungszeit vormittag/mittag/nachmittag (Amt); Wahler tagsüber.
- **Stellwerk Schöneweide / Bahnhof**: immer zugänglich, aber Beweise nachts (+ Gefahr nachts).
- **Wohnung / Büro / Imbiss**: immer zugänglich.

---

## Bau-Reihenfolge (kleine, EINZELN getestete Schritte!)

**Schritt 1** — Alle Orte von Anfang an freischalten.
`startBekannt: true` für alle Nicht-Service-Orte des Falls (oder zentral: beim Fallstart alle freischalten).
WICHTIG: "freigeschaltet" heißt SICHTBAR/anfahrbar im Reisemenü - die Öffnungszeit (Schritt 3) bleibt:
ein abends geschlossenes Café ist freigeschaltet, aber tagsüber anfahren lohnt, nachts steht "geschlossen".
→ Sofort spürbar, minimal-invasiv, einzeln testbar.

**Schritt 2** — Datenstruktur: `indizien`-Feld an Margarete-Orte + `gefundeneIndizIds` einführen.
Noch ohne UI — nur Daten + Fund-Logik (Schlüsselwort/Aktion → ID als gefunden markieren).

**Schritt 3** — Reisemenü-Anzeige: pro Ort "● X offen" + Tageszeit-Hinweis.
Liest `indizien` minus `gefundeneIndizIds`.

**Schritt 4** — Stage-Gates qualitativ: Stage hebt sich an Indiz-Typen/IDs, nicht nur Anzahl.

**Schritt 5** — (ChatGPT-P1, separat) Party-Regeln: `canJoinParty` für Doc Wagner=false,
Margot-Sperre bei politisch+Stress. Eigenes Teilprojekt.

Jeder Schritt: eigener Versionssprung, node --check, Logik-Test, dann erst der nächste.

---

## Offene Fragen an Projektleitung
- Indizien-Entwurf oben ok, oder andere Verteilung/Anzahl?
- Schritt 1 (alle Orte offen) zuerst isoliert, oder direkt Schritt 1+2 zusammen?
- Sollen die Bedrohungs-Orte (Stellwerk, Bahnhof) auch Indizien halten (= dort lauert Gefahr UND Beweis)?
