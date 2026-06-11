# Ideenskizze: Schlüssel-Schloss-System (Notizbuch + Freitext mit echtem Gewicht)

Status: NUR IDEE / noch kein Konzept. Kommt NACH dem UI-Umbau (B2/B3). Quelle: Testerin + Benjamin.

## Das Problem heute
- Notizbuch ist passiv: zeigt gefundene Indizien an, "tut" aber nichts ("Zombie-Buch").
- Freitext ist ein offener Kanal: der Spieler kann alles eingeben, niemand prüft, ob er eine Information
  WIRKLICH besitzt. Dadurch fühlt sich Freitext teils wie ein Cheat an, ohne echte Daseinsberechtigung.

## Die Idee
Ein Indiz wird zu einem SCHLÜSSEL (Safe-Kombination, Codewort, Name, Passwort). Später im Fall gibt es ein
SCHLOSS (ein Safe, ein Türsteher, ein Stasi-Lager, ein Club, eine verschlossene Halle). Um durchzukommen,
muss der Spieler den Schlüssel AUS DEM NOTIZBUCH ABLESEN und per FREITEXT ANWENDEN:
- "stell den Safe auf 12-08-53"
- "nenn dem Wärter das Codewort Nordstern"
- "zeig ihm den Namen aus den Akten"

## Warum das stark ist
- Notizbuch wird SPIELENTSCHEIDEND (ohne Nachlesen kommt man nicht weiter).
- Freitext bekommt echte Daseinsberechtigung: das Werkzeug, um Wissen ANZUWENDEN (kein Cheat).
- Taktischer Reiz: man hebt sich den Freitext für genau diese Momente auf.
- Passt zu "GTA in Schwarzweiß": Wissen wird zur Ressource, nicht nur zur Anzeige.
- Passt zum Bildungsanspruch: echte historische Codes/Namen/Orte bekommen Funktion.

## Die technische Herausforderung (WARUM es ein eigenes System braucht)
Das Spiel ist KI-erzählt (Gemini Flash-Lite entscheidet, was passiert). Wenn ein Schloss zuverlässig
funktionieren soll, muss die ENGINE prüfen - nicht die KI -, ob der richtige Wert eingegeben wurde. Sonst
halluziniert die KI mal "die Tür geht auf", mal nicht, und der Code wäre wieder Deko. Das ist dieselbe Klasse
Problem wie "Engine besitzt die Wahrheit, nicht die Prosa" (vgl. Indizien-Projekt, Required-Location v570).

Nötige Bausteine (für späteres Konzept):
1. Indizien mit maschinenlesbarem WERT-Feld (z.B. wert: "12-08-53", typ: "safe_code" / "codewort" / "name").
2. SCHLOSS-Punkte im Fall: Ort/NPC X verlangt Wert Y (z.B. {schlossId, ort/npc, erwarteterWert, typ, erfolgBeat}).
3. Engine-Prüfung: Freitext-Eingabe gegen erwarteten Wert abgleichen (normalisiert), Schloss öffnen/verweigern.
   - Erfolg: Engine setzt Beat/schaltet Ort frei/gibt Zugang. KI erzählt die Folge (mit Hard-Beat).
   - Misserfolg: Engine verweigert ("falscher Code", "der Wärter winkt ab") - KEIN Fortschritt.
4. Optional: Hinweis im Schloss-Moment ("Du brauchst etwas - vielleicht steht es in deinen Notizen").
5. Optional: Notizbuch hebt anwendbare Schlüssel hervor (z.B. "Code", "Passwort").

## Designfragen für später
- Muss der Spieler den Wert EXAKT tippen, oder reicht "nenne das Codewort" + Engine zieht es aus dem Notizbuch?
  (Exakt = mehr Immersion/Risiko; automatisch = bequemer, weniger Cheat-Gefühl-Gewinn.)
- Wie viele Schlösser pro Fall? (Sparsam, sonst wird es ein Schlüsselsuchspiel statt Noir-Krimi.)
- Was, wenn der Spieler den Schlüssel nie gefunden hat? (Alternativweg? Sackgasse? Hinweis?)
- Nur für Margarete (politischer Fall) erproben, dann ausrollen?

## Reihenfolge
ERST UI-Umbau (B2/B3) fertig + getestet. DANN eigenes Konzeptpapier für dieses System (wie beim Indizien-Projekt),
Benjamin liest/korrigiert, DANN Code. Nicht in den laufenden UI-Umbau quetschen (keine zwei Großbaustellen).

## Konkretes Live-Beispiel (Benjamin, Run 29.März-Szene): Spind-Code
In Szene 38 hat der Spieler einen NPC nach einem Code für einen Spind gefragt. GENAU der Anwendungsfall:
Spind-Code als Indiz/Schlüssel finden -> später per FREITEXT am Spind eingeben -> Engine prüft -> Spind öffnet.
Bestätigt: das Schlüssel-Schloss-System hat echten Spielbedarf, kommt im echten Spiel natürlich vor.
