# Schatten — FF-Kampfmechanik · Konzept v3 (FREIGABEFÄHIG, vor dem Coden)

> Eingearbeitet: alle drei Review-Runden + Ausdauer/Verfassung-Trennung + 6 finale Leitplanken. Unten als **Anhang** meine Code-Verifikation. Noch kein Code.

## FREIGABE-LEITPLANKEN (zwingend, aus Review 3)

1. **Fesseln auf „benommen" ist NICHT automatisch sicher** — sonst wird „benommen" der neue Sofort-K.o.-Bypass. Voll aktiver Gegner = nicht fesselbar; benommen allein = riskant (kann misslingen/kostet Gegnerzug); benommen + Max/Rex = sicher; ko/fixiert = sicher.
2. **Deckung hat Anti-Stall:** +2 Ausdauer nur bis Start-Ausdauer (kein Über-Cap), eingehender Hauptschaden −1 aber **nie unter 1**, solange ein aktiver Angreifer frei ist; keine Offensive in der Deckungsrunde.
3. **Niederlage erzeugt Rückholspur, kein totes Pflichtindiz.** Kampf verloren darf den Fall erschweren, aber nie unabsichtlich unlösbar machen. Für Krause: Frieda flieht, Lager teilweise leer, ABER neues Fallback-Indiz (Fluchtspur/zerrissener Transportzettel/Hinweis nächster Ort). Echter Fail-State nur, wenn bewusst als solcher markiert.
4. **KI-Wahrheitstexte trennen Ausdauer vs. Verfassung.** Bei Ausdauerverlust sagt die Engine der KI: „Karl verliert Kampf-Ausdauer, Verfassung sinkt NICHT — er ist erschöpft, nicht verletzt." Nur bei echtem Vf-Schaden: „persistente Verfassung −1, echte Verletzungsfolge."
5. **Notheilen im Kampf:** nur sichtbar bei Vf ≤ 2 oder Ausdauer ≤ 2, einmal pro Kampf, kostet die Runde, Effekt Vf +1 und Ausdauer +2 (kein voller Reset). Doc Wagner außerhalb bleibt stärker (Vf +2).
6. **M1 hält Gegnerdruck simpel:** NUR der Hauptangreifer senkt Ausdauer, der Rest ist reiner Kampf-Log/KI-Druck (mechanisch harmlos). Mehrere-aktive-Gegner-Druckschaden kommt erst später.

---

## 1. Das Kernmodell: Ausdauer ≠ Verfassung

Drei saubere Ebenen, keine ersetzt die andere:

```
VERFASSUNG   = körperlicher Gesamtzustand über den ganzen Fall (persistent, 1–5)
AUSDAUER     = kurzfristige Kampfreserve in EINEM Kampf (temporär, aus Vf abgeleitet)
DOC/NOTHEILEN = heilt VERFASSUNG (nicht jede Kampf-Ausdauer) → bleibt wertvoll
```

- **Gegner-HP** = `encounterHP` (existiert schon, wird schon angezeigt).
- **Karls Ausdauer** = NEU. Wird zu Kampfbeginn aus Verfassung berechnet.

**Ausdauer 0 = überwältigt, NICHT Game Over.** Noir-Szene statt Bildschirm: Karl geht zu Boden, Jochen tritt ihm die Pistole weg, Frieda verschwindet durch den Hof; als er hochkommt, ist das Lager leer. Dann erst Verfassung −1.

### Ausdauer aus Verfassung (milde Variante)

| Verfassung | Start-Ausdauer |
|---|---|
| 5 (topfit) | 10 |
| 4 | 9 |
| 3 | 8 |
| 2 | 7 |
| 1 (kritisch) | 6 |

### Wann sinkt die persistente Verfassung? (ca. 80% Ausdauer / 20% Verfassung)

- Karl verliert den Kampf (Ausdauer 0) → Vf −1
- Kritischer Messer-/Schusstreffer → Vf −1
- Flucht bei sehr niedriger Ausdauer (0–2) → Vf −1 möglich
- Normaler Druck/Schlag → **nur Ausdauer**, Vf bleibt

Doc Wagner hebt Verfassung → nächster Kampf startet mit mehr Ausdauer. Elegant: Doc verbessert indirekt die Kampfreserve, ohne Mana-Trank im Kampf zu sein.

---

## 2. Rundenablauf

```
1. DEIN ZUG    → Aktion + Ziel (Faust / Harter Schlag / Deckung / Item / Rex / Max / Pistole / Bestechen / Fliehen)
2. AUFLÖSUNG   → Gegner verliert HP  ·  Karl zahlt Ausdauer
3. GEGNERZUG   → max. 1 Hauptangreifer trifft (−Ausdauer), Rest macht Druck
4. PRÜFUNG     → Gegner-HP 0 → besiegt.  Karl-Ausdauer 0 → überwältigt (Szene, Vf−1).  Sonst nächste Runde.
```

---

## 3. Aktionen (finale Startwerte)

| Aktion | Wirkung | Karls Kosten | Bedingung |
|---|---|---|---|
| **Faustschlag** | 1 Schaden | 1 Ausdauer | immer |
| **Harter Schlag** | 2 Schaden | 3 Ausdauer | immer (riskant) |
| **Deckung / Durchatmen** | eingehender Schaden −1 diese Runde | **+2 Ausdauer** | sichtbarer Button |
| **Fesseln** | Gegner gebunden | 1 Ausdauer | nur bei ko/benommen/fixiert |
| **Doppelkorn werfen** | 2 Schaden; steht das Ziel danach noch → zusätzlich benommen 1 Runde | 0 (Item weg) | Item im Inventar |
| **Rex stören** | Ziel macht diese Runde keinen Hauptangriff / Frieda-Flucht +1 Runde | 0 | Rex dabei |
| **Max blockt** | bindet Kalle → Kalle Schaden 0 | 0 | Max dabei |
| **Max schlägt** | 1 Schaden (2 bei Synergie) | 0 | Max dabei |
| **Pistole ziehen** | Einschüchterung, Gegnerzug schwächer, Jochen knickt evtl. ein | 1 Ausdauer | Walther; **Spannung +1** |
| **Schießen** | 3 Schaden / schwache Gegner sofort aus | 2 Ausdauer | Walther; **massiver Preis: Lärm, Stasi, Folgen** |
| **Fliehen** | Kampf endet, kein Loot | — | immer |

**Walther ist kein DPS, sondern Eskalation mit Preis.** Synergie-Bonus (+1 bei 2 Akteuren auf dasselbe Ziel) wie heute schon.

---

## 4. Die Gegner (Krause-Fall)

| Gegner | HP | Verhalten |
|---|---|---|
| **Kalle** (Brecher) | 4 | Hauptangriff 2. Dominiert, bis gebunden. |
| **Jochen** (Messer) | 2 | Hauptangriff 2, schnell down. Bestechbar wenn Kalle weg / low HP. |
| **Frieda** | 2 „Nerven" | Angriff 0. Flieht ab Runde 3–5. UI zeigt „Nerven", nicht „HP". |

**Gegnerzug-Regel (existiert schon!):** Nur der gefährlichste aktive Gegner macht echten Schaden, Rest droht. Max bindet Kalle → Jochen wird Hauptangreifer. Rex stört Jochen → kein Messerangriff.

### Bestechung (sozialer Kampfzug, kein Sofort-K.O.)

- **Jochen:** bestechbar, wenn Kalle nicht mehr dominant oder Jochen ängstlich/low HP
- **Kalle:** nein (loyaler Brecher) oder extrem teuer
- **Frieda:** eher Deal vor der Eskalation oder bei verlorener Lage

---

## 5. Party

**Max** (neuer Begleiter, Box-Kumpel): **Blocker, nicht Schadensmaschine.** Bindet Kalle (macht den Kampf kontrollierbar), schlägt nur moderat selbst zu. Ohne Max dominiert Kalle; mit Max kann Karl Jochen/Frieda taktisch bearbeiten. Muss erst gefunden/überzeugt werden (über bestehendes `_partyAdd`).

**Rex** (Hund): **Störer, nicht Schaden.** Springt Jochen an → kein Messerangriff. Stellt Frieda → Flucht verzögert. Lenkt Kalle ab → Schaden −1.

---

## 6. Krause-Kampf durchgerechnet (finale Werte)

**Allein, nur Faust:** Karl schafft Jochen, aber Kalle ist zu viel — Ausdauer 0 in ~3 Runden. Verloren, aber nicht sinnlos. ✗ *(gewollt)*

**+ Doppelkorn:** Flasche auf Jochen → down. Nur noch Kalle. Knapp machbar. ⚠

**+ Max:** Max bindet Kalle, Karl nimmt sich Jochen, dann gemeinsam Kalle. Sauberer Sieg. ✓

**+ Max + Doppelkorn:** „Gute Vorbereitung zahlt sich aus." Souverän. ✓✓

---

## 7. Architektur (wichtig — ChatGPTs Leitplanke)

`_arenaSchadenAnGegner` NICHT vollstopfen. Es tut nur: HP abziehen, Status bei 0, FX erzeugen. Die neue Logik liegt DARÜBER:

```
_arenaAktionAusfuehren(aktion, actor, ziel):
  Kosten berechnen → Ausdauer abziehen → Item verbrauchen → Schaden anwenden
  → Status setzen → Kampf-Log → FX-Queue füllen → Gegnerzug → Sieg/Niederlage prüfen
```

v988-Effekte (Popup, Flash, Shake) künftig über eine kleine `arenaFxQueue` erweitern, statt Sonderlogik anzukleben.

---

## 8. Bau-Reihenfolge (ChatGPTs M0-First)

| Stufe | Inhalt | Risiko |
|---|---|---|
| **M0** | `encounterStamina.karl` (aus Vf abgeleitet) + Kampf-Log + FX-Queue-Gerüst. **INTERN/Debug — kein sichtbarer Balken, KEINE Regeländerung.** | klein |
| **M1** | Ausdauerbalken sichtbar; Faust kostet Ausdauer; Gegnerzug senkt Ausdauer statt Vf (nur Hauptangreifer); Ausdauer 0 → überwältigt (Noir-Szene, Vf−1); KI-Wahrheitstext umstellen | mittel |
| **M2** | Deckung/Durchatmen-Button (+2 Ausdauer bis Cap, Schaden −1 nie unter 1) inkl. Anti-Stall | klein |
| **M3** | Doppelkorn werfen (2 Schaden + benommen wenn überlebt) | klein |
| **M4** | Rex stört / Max blockt / Party-Synergie (begrenzt) | mittel |
| **M5** | Pistole (ziehen/schießen) + Bestechung (selektiv) — Fall-Folgen → spät | mittel |
| **M6** | Animationen (Wurf, Rex-Sprung, Max-Block, Frieda-Flucht) | klein (Render) |

Jede Stufe einzeln Bot-Run-testen. Nie zwei Engine-Stufen gleichzeitig.

---

# ANHANG — Claudes Code-Verifikation

> Gegen den echten `index.html`-Code geprüft, bevor wir bauen. Wichtig, weil mehrere „Vorschläge" schon existieren.

### Existiert bereits (NICHT neu bauen):

- **Gegner-HP-System:** `caseProgress.encounterHP {hp,hpMax}`, `_arenaSchadenAnGegner()`, `_gegnerKampfHP()` — voll funktional, Balken rendern (v988/989).
- **„1 Hauptangriff pro Runde":** Der Gegnerzug ist **schon balanciert** (v989, Z~12890). Nur der gefährlichste aktive Gegner macht Schaden, Fluchtfiguren (Frieda) schlagen nicht zu, der Rest macht narrativen Druck. → ChatGPTs P1-Vorschlag ist im Kern schon umgesetzt; wir müssen ihn nur von **Verfassung → Ausdauer** umlenken.
- **Synergie +1** bei 2 Akteuren auf ein Ziel: existiert (`_akteurStaerke`-Umfeld).
- **Frieda als Fluchtfigur:** wird im Gegnerzug schon als nicht-angreifend behandelt.
- **Heilorte:** Doc Wagner + Charité (Marlene) sind `heilort:true`, beide +2 Verfassung. `_istWagnerOrt()`.
- **`schlaeger`-Rolle** für Max: existiert in `ROLLEN_STAERKE` (angriff 3) — aber laut ChatGPT bauen wir Max bewusst als Blocker, nicht über rohe Angriff-3.

### Wirklich NEU (das ist die Arbeit):

- **`caseProgress.encounterStamina` (Karls Ausdauer)** — Feld + Ableitung aus Verfassung bei Kampfstart.
- **Ausdauer-Balken** bei Karl in der Arena (analog Gegner-HP).
- **Gegnerzug umlenken:** Z~12909-12912 zieht heute `verfassung -= 1`. Das wird zu `encounterStamina -= schaden`; Verfassung nur noch bei Niederlage/Krit/Risiko-Flucht.
- **`_arenaAktionAusfuehren()`** als Orchestrator-Schicht über `_arenaSchadenAnGegner`.
- **`arenaFxQueue`** für gestaffelte Effekte.
- **Deckung/Durchatmen, Item-Wurf-Mechanik, Rex-Stören, Max-Block, Pistole, Bestechung** als Aktionen.
- **Niederlage-als-Szene** statt Game Over.

### Offene Detailfrage für M1:

Der heutige Gegnerzug-Block schreibt auch eine `pendingCategoryMessages`-„Engine-Wahrheit" an die KI („X trifft Karl mit hartem Schlag"). Wenn der Treffer künftig nur Ausdauer (nicht Verfassung) kostet, muss die Formulierung an die KI angepasst werden — sonst erzählt sie „schwer verletzt", obwohl es nur Erschöpfung ist. → In M1 mitdenken (= Leitplanke 4).

### Verifiziert: Kampfrunden zählen heute gegen die Frist

`encounterRound` (eigener Zähler) und `sceneCounter` (Szenen-/Frist-Zähler) sind getrennt — ABER jeder Kampf-Zug, der einen API-Call auslöst, läuft durch `sceneCounter++` (Z40303). Heißt: Ein 5-Runden-Kampf frisst real 5 Szenen der Fallfrist. ChatGPTs P2-Sorge ist berechtigt.
→ **Nicht in M0–M4 lösen** (zu viel Verflechtung mit dem Zeitsystem). Später: Kampfstart+ende = 1 Handlung, Arena-Runden intern. Für jetzt als bekannte Arcade-Vereinfachung notiert.

### Frieda „Nerven" — internes Mapping (Leitplanke-konform)

Kein zweites System: intern bleibt es `encounterHP`. Nur das **UI-Label** heißt „Nerven" statt „HP". HP 0 bei Frieda = Kontrolle gebrochen/gestellt/flieht nicht mehr frei. Code bleibt einfach.

### M0 ist INTERN, kein Spielerfeature (Review 3, P2)

M0 baut `encounterStamina` + Log + FX-Queue, aber zeigt dem Spieler noch KEINEN Ausdauerbalken — der bewegt sich ja noch nicht. Sichtbar nur im Debug (`?debug=hardenberg17`). Der öffentliche Ausdauerbalken kommt in M1, wenn er wirklich etwas tut. Sonst verwirrt ein toter Balken die Tester.
