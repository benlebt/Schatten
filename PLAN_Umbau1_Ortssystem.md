# Architektur-Plan: Umbau 1 — "Die Engine besitzt den Ort"

**Status:** Konzept, NICHT gebaut. Zu bauen NACH dem Margarete-Run (v504–510 bestätigen).
**Ziel:** Der aktuelle Ort wird von der Engine bestimmt und gehalten, nicht aus KI-Prosa
(`scene.ort`) gelesen. Plus: ein globaler "Reise zu"-Button aus den schon vorhandenen
`locations` jedes Falls. Erster Schritt der größeren Vision "Engine bestimmt Struktur,
KI nur Beschreibung".

---

## 1. Verifizierter Ist-Zustand (gegen echten Code geprüft)

- **Jeder Fall hat bereits `locations: [{name, sektor, detail}]`** (z.B. Brandt-Fall Z4677,
  Margarete-Fall in seinem Setup). Die Datenbasis EXISTIERT schon — sie wird nur nicht
  als Reise-UI genutzt.
- **Der aktuelle Ort kommt aus der KI:** `currentOrt = normForMatch(scene.ort)` (Z13336).
  `scene.ort` ist ein Feld im KI-JSON. Wenn die KI driftet ("Karls Büro" statt "Revier"),
  übernimmt die Engine das blind. DAS ist die Wurzel des Orts-Drifts.
- **`currentOrt` / `currentOrtType` werden an ~24 Stellen GELESEN** (Wagner-Heilen-Button
  Z16987, Haftort Z17028, Charité Z17045, Fahrt-Erkennung Z16865, Ruf-Hints Z20604, Cast-
  Clean-Ortsbindung, u.v.m.). Ein falscher Ort vergiftet ein Dutzend Folge-Systeme.
  -> Deshalb ist das der heikelste Umbau. Deshalb der Plan.

---

## 2. Zielarchitektur (das Prinzip)

**Heute (fragil):**
```
KI schreibt scene.ort  ->  Engine liest ihn  ->  currentOrt  ->  24 Folge-Systeme
                            (KI driftet = alles driftet)
```

**Ziel (stabil):**
```
Spieler drückt "Reise zu X"  ->  Engine SETZT engineCurrentLocation = X
                              ->  KI bekommt X als VORGABE ("Du bist in X, wechsle NICHT")
                              ->  scene.ort wird nur noch zur Gegenkontrolle/Anzeige genutzt
```

Die Engine ist die Quelle der Wahrheit. Die KI beschreibt den vorgegebenen Ort, sie
WÄHLT ihn nicht mehr.

---

## 3. Bauplan in KLEINEN Schritten (nicht ein großer Wurf)

Jeder Schritt ist einzeln auslieferbar + testbar. Reihenfolge ist bewusst: erst der
Zustand, dann die UI, dann der KI-Zwang, dann die Altlast-Bereinigung.

### Schritt 1A — Engine-Ort-Zustand einführen (unsichtbar, kein UI)
- Neue globale Variable `engineCurrentLocation` (Objekt: `{name, sektor}` oder Index in
  die `locations` des Falls).
- Bei Spielstart: auf den Startort des Falls setzen (aus dem Setup ableitbar).
- NOCH NICHT als Wahrheit nutzen — nur PARALLEL mitführen und in `diag()` loggen:
  "engineLocation=X vs scene.ort=Y". 
- **Zweck:** Eine Messung VOR dem Eingriff. Wir sehen im Run, wie oft Engine-Ort und
  KI-Ort auseinanderlaufen — die Drift-Häufigkeit, bevor wir etwas umstellen. (Dieselbe
  Disziplin wie bei den Beat-Diagnosen: erst messen, dann bauen.)
- **Risiko:** Null (nur eine Variable + Log, ändert kein Verhalten).

### Schritt 1B — "Reise zu"-Button (globale Leiste, getrennt von A/B/C/D)
- Neue UI-Zeile UNTER/ÜBER A/B/C/D: ein "Reisen"-Button.
- Tippen öffnet die `locations` des aktuellen Falls (nur die freigeschalteten — siehe 4.).
- Auswahl löst einen Reise-Befehl aus: setzt `engineCurrentLocation`, generiert die nächste
  Szene mit diesem Ort.
- A/B/C/D bleiben unverändert = lokale Szene. Reisen = globale Aktion. (ChatGPTs Trennung:
  "A/B/C/D ist lokale Szene, die globale Handlungsebene fehlt.")
- **Risiko:** Mittel — neue UI, neuer Aktionspfad. Aber additiv (bestehende Wege bleiben).

### Schritt 1C — KI bekommt den Ort als VORGABE (der eigentliche Drift-Fix)
- Im Prompt: aus "die KI nennt den Ort" wird "der Ort ist X, beschreibe NUR X, wechsle NICHT".
- **WICHTIG (ChatGPT-Verfeinerung, ÜBERGANGSMODUS in ZWEI Phasen):** Den scene.ort NICHT
  sofort überall hart entmachten. Sonst halb-umgestellter Zustand (Anzeige sagt Revier,
  Cast-Cleanup denkt Büro).
  - **Phase 1C-soft:** engineCurrentLocation ist PRIMÄR (Prompt-Vorgabe + Anzeige), aber
    scene.ort wird nur GELOGGT und bei Abweichung gewarnt — KEINE automatische Übernahme,
    KEINE der 24 Lesestellen wird angefasst. So sehen wir an echten Runs, WAS bricht und
    wo die KI gegen die Vorgabe driftet, bevor wir umstellen.
  - **Phase 1C-hard:** Erst wenn 1C-soft stabil läuft: die Lesestellen (Checkliste unten)
    EINZELN von scene.ort auf engineCurrentLocation umstellen. Eine nach der anderen,
    mit Test dazwischen.
- **Risiko:** Hoch — betrifft die ~24 Folge-Systeme. Deshalb ZULETZT, zweiphasig, mit dem
  Drift-Log aus 1A als Vorher/Nachher-Beweis.

#### Checkliste: Stellen, wo scene.ort/currentOrt heute Wahrheit ist (1C-hard, einzeln umstellen)
Gefährlichster Fehler wäre, eine zu übersehen -> halb-umgestellter Zustand. Vor 1C-hard
jede einzeln verifizieren (grep), umstellen, testen, nächste:
- [ ] Ortsanzeige (status-loc, Z13328) + currentOrt-Setzung (Z13336)
- [ ] currentOrtType-Ableitung (Z13337) — speist Wagner/Charité/Haftort/Fahrt-Logik
- [ ] Cast-Cleanup / Ortsbindung (ortIsKlientHome, locationBound)
- [ ] Reise-Erkennung (extractTravelTarget, Travel-Heuristik) — NICHT löschen, koexistiert
- [ ] Prompt-Kontext (welcher Ort wird der KI mitgegeben)
- [ ] Save/Restore (engineCurrentLocation MIT speichern — wie companionLock in v509)
- [ ] Debug/History (currentLocation aus logEntries, Z12187)
- [ ] Button-Generierung (Wagner-Heilen-Button Z16987, Charité Z17045 etc.)
- [ ] evtl. Beat-/Finale-Logik (prüfen, ob Ort dort einfließt)

### Schritt 1D — Freitext für Reise entlasten
- Wenn "Reise zu" als Button existiert, ist der Freitext für Grund-Navigation nicht mehr
  nötig. Der Freitext-Cooldown (v498) wird damit weniger spürbar, weil Reisen nicht mehr
  über Freitext läuft. Der Freitext wird wieder das, was er sein soll: Sonderaktion/Joker.
- **Risiko:** Niedrig (eher eine Entlastung als ein Eingriff).

---

## 4. Designentscheidungen, die VOR dem Bau zu klären sind (Benjamin)

Diese bestimmen die Form — bewusst offen gelassen, nicht raten:

**(A) Welche Orte sind von Anfang an sichtbar?**
- Variante 1: Alle Fall-Orte sofort sichtbar (volle Sierra-Freiheit, einfachster Test).
- Variante 2: Nur Startort + nach und nach freigeschaltet durch Hinweise (mehr Entdeckung,
  aber mehr Zustand + Testaufwand: "ist Ort X zum Zeitpunkt Y freigeschaltet?").
- EMPFEHLUNG fürs Erste: Variante 1 (alle sichtbar). Freischaltung ist Umbau-2-Material.

**(B) Was passiert mit "Karls Opel" und "mobil"-Orten?**
- In den `locations` stehen auch Wagen/Fahrt-Einträge. Sind das Reiseziele oder Zustände?
- Vermutlich: der Wagen ist KEIN Reiseziel, sondern das Transportmittel. Aus der Reise-Liste
  rausfiltern (nur echte Orte als Ziele).

**(C) Kostet Reisen eine Szene / Zeit?**
- Reisen = eigene Szene (Fahrt) oder sofortiger Ortswechsel ohne Szene?
- Das berührt die Szenenzahl/Hard-Cap-Logik. WICHTIG für die Würze-Regel: Reisen darf den
  Lösungsweg nicht verändern. Wenn jede Reise eine Szene kostet, kann häufiges Reisen den
  Cap erreichen — gewollt oder nicht?
- EMPFEHLUNG: erst mal Reisen = eine Szene (ehrlich, Zeit vergeht), im Run beobachten.

**(D) Tageszeit beim Reisen?**
- Schreitet die Zeit beim Reisen voran (morgens losfahren -> mittags ankommen)? Das ist die
  Brücke zu Umbau 2 (NPC-Anwesenheit nach Tageszeit). Fürs Erste: Zeit läuft normal weiter,
  keine Sonderlogik.

---

## 5. Was Umbau 1 ausdrücklich NICHT enthält (Abgrenzung)

Um nicht zu stapeln — das kommt SPÄTER:
- **NPC-Anwesenheit nach Ort/Tageszeit** (= Umbau 2). Jetzt noch nicht.
- **Eskalation/Gegnerverhalten aus der Engine** (= Umbau 3). Fernziel.
- **Ortsfreischaltung durch Hinweise** (Variante 2 oben). Erst wenn Basis steht.
- **Noir-Herausforderungen/Challenges.** Kommen NACH dem Ortssystem (Challenges auf
  wackligem Ort-State wären wieder riskant — ChatGPT-Punkt, stimmt).

---

## 6. Testbarkeit (warum dieser Umbau testbar BLEIBT)

- Schritt 1A liefert ein Drift-Maß VOR dem Eingriff (engineLocation vs scene.ort im Log).
- Nach 1C: Bot reist zu Ort X -> prüfen: ist currentOrt == X? Bleibt er X über die Szene?
  Driftet scene.ort weg (Warnung), aber currentOrt hält? -> reproduzierbar, kein KI-Raten.
- Der geschlossene Fall bleibt der testbare Container. Orte sind eine ENDLICHE Menge pro
  Fall (5-8) — kein kombinatorisches Wachstum.

---

## 7. Reihenfolge & Abhängigkeit zum restlichen Backlog

1. **Margarete-Run** (v504–510 bestätigen) — MUSS zuerst. Sonst debuggen wir Ort-Umbau und
   companionLock gleichzeitig und wissen nicht, was schuld ist.
2. **Run auswerten:** Wie viel Ort-/Personen-Drift bleibt überhaupt? (Vielleicht zeigt der
   Run, dass nach v504–510 weniger driftet als gedacht — dann andere Priorität.)
3. **Umbau 1, Schritt 1A** (Drift-Messung) — risikolos, schafft Datenbasis.
4. **1B (Reise-Button), 1C (KI-Vorgabe), 1D (Freitext-Entlastung)** — einzeln, mit Tests.
5. DANN erst Umbau 2 (NPCs) oder Challenges.

---

## 8. Der eine Satz, der alles zusammenfasst

> Die KI erzeugt Spannung und Atmosphäre. Die Engine besitzt Ort, Anwesenheit und Struktur.
> Umbau 1 holt das ERSTE dieser Dinge — den Ort — von der KI in die Engine.
