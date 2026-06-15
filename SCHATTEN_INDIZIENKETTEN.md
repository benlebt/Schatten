# Schatten — Indizienketten-Analyse & Plan

**Stand:** v7.12.924 · 15. Juni 2026
**Zweck:** Grundlage, um mit ChatGPT pro Fall eine optimale Indizienkette (Stage 1→4) zu bauen.
**Methode:** Alle Angaben unten sind aus dem echten Code verifiziert (nicht aus dem Gedächtnis).

---

## 1. Das akute Problem (Krause-Fall, live aufgetreten)

Im Krause-Fall (Diebstahl, silbernes Zigarettenetui) bleibt der Spieler **am Nachmittag von Tag 1 ohne Ziel hängen**:

- Alle **3 Kern-Indizien gefunden** (3/3), aber Fall hängt auf **Stage 1**.
- Status im Run: `zielGefunden=false`, `überführt=false`, `wahrheitErkannt=false`, **kein Verdächtiger**.
- Nur **4 von 8 Setup-NPCs aktiviert**. Unbespielt: Erika Kalewski (ROMANCE), Bornstein (INFORMANT), Kalle & Jochen (GANGSTER) — und es fehlt der *Weg* zur Hehlerin Tante Frieda (SUSPECT).
- Spannungsverlauf 80 % auf Sp 1-2 → „sehr ruhe-lastig" (Lektorat-Warnung im Run).

**Das ist die bekannte „Outcome-Monokultur durch Stagnation" — hier schon in der Frühphase.**

---

## 2. Ursache (verifiziert im Code)

Die Stage-Verteilung der Indizien pro Fall, direkt aus dem Code ausgelesen:

### Margarete / Stein (politisch) — VOLL DURCHGEBAUT ✓
| Indiz-ID | Stage | abStage |
|---|---|---|
| margarete_aussage | 2 | — |
| akten_kopie_wohnung | 2 | — |
| frachtliste_stempel | 2 | 1 |
| dienstplan_wahler | 2 | 1 |
| hinweis_stellwerk | 3 | 2 |
| uebergabe_beobachtet | 3 | — |
| notiz_wahler_gleis | 3 | — |
| vera_uebergabekontakt | 3 | — |
| original_akten | 3 | — |
| vera_westperspektive | 3 | — |
| lemke_belastet_wahler | 3 | — |
| wahler_unterschrift | 4 | — |

→ Saubere Treppe 1→2→3→4. Der Fall löst sich qualitativ.

### Kessler (beschatten) — GESTAFFELT ✓
| Indiz-ID | Stage | abStage |
|---|---|---|
| tuerschild_hauke | 1 | — |
| edith_verdacht | 1 | — |
| kellner_beobachtung | 1 | — |
| robert_tisch_beobachtet | 1 | — |
| robert_eintritt_beobachtet | 2 | — |
| nachbarin_aussage | 2 | — |
| tetzlaff_aussage | 2 | — |
| ilse_aussage | 3 | 2 |
| fenster_beobachtung | 3 | 2 |
| briefchen_ilse | 3 | 2 |

→ Treppe 1→2→3 vorhanden.

### Krause (diebstahl) — KETTE BRICHT NACH STAGE 1 AB ✗
| Indiz-ID | Stage | abStage |
|---|---|---|
| einbruch_fenster | 1 | — |
| etui_letzter_ort | 1 | — |
| nachbarin_aussage | 1 | — |

→ **NUR Stage 1. Keine Stage-2/3/4-Indizien.** Genau hier hängt das Spiel.

**Fazit:** Der Krause-Fall wurde nur *halb* auf die Kern-Indizien-Architektur migriert. Die Tatort-Indizien (Stage 1) existieren, aber die **Folge-Spuren fehlen komplett**.

---

## 3. Vorhandenes Material im Krause-Fall (ungenutztes Potenzial)

Das Setup hat bereits alles, was eine Kette bis Stage 4 braucht — es ist nur nicht als Indizien verdrahtet:

**NPCs (Setup-Cast):**
- Theodor Krause — CLIENT (Auftraggeber, ungeduldig)
- Silbernes Zigarettenetui — TARGET (Diebesgut, Gravur „Für Hugo, 1939, Liesl")
- Hannelore Wirth — WITNESS (Nachbarin, hat 2 Männer mit Tasche gesehen) ✓ bespielt
- **Tante Frieda — SUSPECT + GANGSTER** (Hehlerin, Kreuzberg) ✗ unbespielt
- **Karl-Heinz Bornstein — INFORMANT** (Halbwelt-Kontakt, kennt Hehlerei-Wege Ost/West) ✗ unbespielt
- **Kalle — GANGSTER** (Friedas bulliger Schläger, Schlagring) ✗ unbespielt
- **Jochen — GANGSTER** (Friedas hagerer Messer-Mann) ✗ unbespielt
- **Erika Kalewski — ROMANCE** (Sammlerin, kennt das Etui aus der Nähe) ✗ unbespielt

**Orte (Setup-Locations):**
- Krauses Antiquitäten (Tatort, Ost) — Stage-1-Indizien hier ✓
- Krause-Wohnung
- **Bornsteins Antiquitätenladen** (Kreuzberg/West, Informant)
- **Tante Friedas Hehlerei** (Stallschreiberstr., Kreuzberg/West)
- **Stallschreiberstrasse 12** (Hinterhof/Lager — Arena-Schauplatz Kalle & Jochen)

---

## 3b. VERIFIZIERT: Route-Führung existiert schon (entscheidend!)

ChatGPTs wichtigster Punkt: *„Krause braucht eine Spurentreppe, bei der jedes Indiz ein neues Ziel auf der Karte öffnet."* — und die Mechanik dafür ist im Code **schon da**:

- Die Reise-Karte zeigt **„Spur hier"-Marker (◉)** über `offeneIndizienAmOrt(loc)` — zählt ungefundene Einträge im `loc.indizien`-Array.
- `abStage` steuert, ab welcher Stage ein Indiz als Spur auftaucht (verhindert, dass alles sofort leuchtet).
- Alle Orte sind bereits freigeschaltet (`unlockedLocations`), **es braucht KEINE neue knownLeads-Struktur** (ChatGPTs Sorge ist im Code gelöst).

**Konsequenz:** Sobald Stage-2-Indizien an **Bornsteins Laden** und Stage-3 an **Frieda/Stallschreiberstr. 12** hängen (mit passendem `abStage`), erscheinen die „Spur hier"-Marker dort **automatisch**, sobald der Spieler die jeweilige Stage erreicht. Die Route-Führung baut sich von selbst — ich muss nur die Indizien an die richtigen `loc.indizien`-Arrays binden.

**Das war die exakte technische Ursache der Stagnation:** Krause-Indizien hingen nur am Tatort. Nach deren Fund hatte kein anderer Ort offene Indizien → keine Marker → keine Spur → Stillstand.

---

## 4. Optimierte Indizienkette Krause (mit ChatGPT verfeinert)

Pro Stage: Spielerfrage + Indizien + nächstes Ziel. Floor über **Schlüssel-Indizien**, nicht über Anzahl.

### Stage 1 — Tatort (vorhanden, bleibt) · Ort: Krauses Antiquitäten
*Spielerfrage: Was wurde gestohlen und wie kamen sie rein?*
- `einbruch_fenster` · `etui_letzter_ort` · `nachbarin_aussage`
→ **Nächstes Ziel: Bornstein aufsuchen**

### Stage 2 — Spur in die Halbwelt (NEU) · Ort: Bornsteins Laden (+ optional Erika)
*Spielerfrage: Wo landet so ein auffälliges Stück in der Halbwelt?*
- **`bornstein_hehler_tipp`** (NPC Bornstein, `stage:2`, **`abStage:1`**, Pflicht) → „...geht über Kreuzberg. Frag Tante Frieda." 1 starkes Stage-2-Schlüsselindiz reicht für den Sprung 1→2 (erscheint erst, wenn Stage 1 erreicht).
- **`erika_etui_beschreibung`** (NPC Erika, **`stage:1`** statt 2, OPTIONAL) → Etui eindeutig identifizierbar, ROMANCE-Einstieg. Kennt Frieda NICHT.
  → **VERIFIZIERT-KRITISCH:** `indizStageFloor` wird auf den höchsten `stage`-Wert eines EINZELNEN Fundes gesetzt (Code Z9844). Hätte Erika `stage:2`, könnte sie allein (ab Sz 6) den Fall auf Stage 2 heben und **Bornstein als Pflichtbrücke umgehen** → Frieda leuchtet ohne Bornstein. Deshalb Erika auf `stage:1`: sie bleibt findbares Bonus-Indiz (bessere Identifikation/Finale), hat aber KEINE Progressionsmacht. (ChatGPTs `noStageFloor`-Flag existiert nicht; `stage:1` erreicht dasselbe ohne neue Mechanik.) Fall muss OHNE Erika lösbar bleiben.
→ **Nächstes Ziel: Tante Frieda aufsuchen**

### Stage 3 — Hehlerin & Schläger (NEU) · sequenziell, NICHT gleichzeitig markieren
*Spielerfrage: Wer verkauft oder versteckt es?*
- **`frieda_ausweichend`** (NPC Frieda, Ort Hehlerei, `stage:3`, **`abStage:2`**) → blockt ab, Kalle & Jochen sichtbar. Markiert nach Bornstein.
  → **Trigger schärfen: NICHT bei bloßem Smalltalk** — nur wenn Karl Frieda konkret anspricht. `actions:['ANSPRECHEN','BEFRAGEN','BEDROHEN','BESTECHEN','UEBERZEUGEN']` (**VERIFIZIERT: nur real existierende Actions** — `KONFRONTIEREN` existiert NICHT im Code, würde nie matchen). `schluessel:['bornstein','etui','zigarettenetui','krause','hehler','hehlerei','silber','gravur','kreuzberg','ware','frieda','tante','tante frieda','hugo','liesl','stallschreiber','lager','hinterhof']` (Spieler formulieren frei — breite Keyword-Abdeckung).
- **`lager_hinterhof`** (Ort Stallschreiberstr. 12, umgebung, `stage:3`, **`abStage:3`**) → konkret: schwere dunkle Tasche, Samtfaser aus Krauses Vitrine, frische Spuren am Kistenstapel. Beweist **Transport/Versteck** (nicht das Etui selbst). **abStage:3, damit Frieda nicht übersprungen wird.** (ChatGPT regte `abIndiz:'frieda_ausweichend'` an = präziser, aber im Code VERIFIZIERT NICHT vorhanden: Engine wertet nur `abStage` aus. `abStage:3` ist die saubere Lösung.)
- `kalle_jochen_transport` (`stage:3`, `abStage:3`, optional) → konkret statt Kampfdeko: z. B. „Jochen verrät, dass Kalle die Tasche in den Hinterhof trug" ODER „Kalle hat Samtfasern an der Manteltasche".
→ **Nächstes Ziel: Lager / Stallschreiberstr. 12 (Arena)**

### Stage 4 — Diebesgut sichern (NEU) · Ort: Stallschreiberstr. 12
*Spielerfrage: Kann Karl das Etui sichern / Verbleib beweisen?*
- **`etui_im_lager`** (`stage:4`, **`abStage:3`**) → Etui gefunden/**lokalisiert** (noch nicht automatisch Rückgabe — siehe State-Trennung unten).
- **`frieda_verkaufsbeleg`** / `etui_weiterverkauft_notiz` (`stage:4`, `abStage:3`, OPTIONAL) → harter Beweis für den **Verbleib**, falls das Etui selbst nicht sicherbar ist. **Bewusst SCHWERER zugänglich als das Etui** (über Frieda/Kalle/Jochen unter Druck, NICHT als zweiter leichter Klick neben `etui_im_lager`) — sonst verwischt der Unterschied zwischen Mindest- und gutem Abschluss. Macht den Mindestabschluss engine-fest statt KI-Fantasie.
- **WICHTIG (verifiziert):** Diebstahl-Outcome läuft über das vorhandene **`caseProgress.diebesgutZurueck`**-System (~20 Lesestellen, Win-Sperre, eigene Sync-Logik, früher Krause-Desync-Bug bereits gefixt). **KEINE neuen Felder erfinden.** ChatGPT schlug wiederholt `targetSecured`/`caseObjectFound` vor mit dem Argument, `zielpersonGefunden` sei für ein Etui semantisch schief — das stimmt sprachlich, aber neue Felder würden das funktionierende System samt seiner 20 Lesestellen umgehen. Ein semantisches Umbenennen des Outcome-Felds über ALLE Falltypen wäre ein eigenes, größeres Refactoring (separat zu bewerten, NICHT Teil dieser Kette). Für Krause: Etui muss real ins Inventar/zu Krause → `diebesgutZurueck` wird abgeleitet true.
- `frieda_belastet` / `kalle_jochen_gestaendnis` (optional, stärkerer Abschluss)
→ **Nächstes Ziel: Krause berichten**

### Resolve-Regel (Abschlussbedingung)
```
Guter Abschluss:   etui_im_lager gesichert + Rückgabe an Krause (diebesgutZurueck=true)
Mindestabschluss:  frieda_belastet ODER kalle_jochen_gestaendnis + eindeutiger Verbleib
Sehr gut:          Etui zurück + Frieda belastet + Kalle/Jochen identifiziert
```

### Sequenzielle Marker (Anti-Stagnation, ChatGPT) — mit verifizierten Hard-Floors
Die „Spur hier"-Marker öffnen sich NACHEINANDER. Stage-Übergänge brauchen Floor UND Szenenzahl (Code Z9919-9921):
```
Stage 0→1: floor>=1 & sc>=4  → nach Tatort  → Bornstein markiert  (abStage:1)
Stage 1→2: floor>=2 & sc>=6  → nach Bornstein → Frieda markiert    (abStage:2)
Stage 2→3: floor>=3 & sc>=8  → nach Frieda  → Stallschreiberstr.   (abStage:3)
Stage 3→4: Sicherungs-/Auflösungslogik (NICHT über Floor) → Krause berichten
```
Erika (`stage:1`) hebt den Floor NICHT über 1 → kann Bornstein nicht umgehen.

### Arena-Philosophie (ChatGPT, bestätigt)
- Stallschreiberstr. 12 auf dem **Hauptpfad** (Etui liegt dort).
- **Gewalt optional**: Einschüchtern / Bestechen / Bornsteins Namen / Beobachtung / Hintereingang — oder Kampf (Arena Kalle & Jochen).

### Verifizierte Engine-Befunde (Code geprüft, keine Annahmen)
- **Start-Stage = 0, nicht 1.** Code (Z9919): `if (stage===0 && floor>=1 && sc>=4) stage=1`. Ein Fall springt erst auf Stage 1, wenn genug Stage-1-Indizien gefunden UND ≥4 Szenen vergangen. → **Bornstein (`abStage:1`) leuchtet NICHT beim Spielstart**, sondern erst nach echter Tatort-Auswertung. ChatGPTs befürchteter Frühstart-Bug kann nicht auftreten.
- **`diebesgutZurueck` trennt Finden von Rückgabe bereits korrekt** (Z13819): wird NUR true bei Item-Status `inKarlInventory` ODER `returnedToClient`. `etui_im_lager` (Lokalisieren) setzt es NICHT — erst Aufnehmen/Zurückgeben. ChatGPTs Designregel (Punkt 6) ist im Code schon erfüllt.

### Figuren schärfen (gegen „Boss-Deko", für die KI-Prosa)
- **Tante Frieda** — nicht die Einbrecherin, die **Verwerterin**. Schützt ihre Jungs, mehr noch ihr Geschäft. Lügt nicht plump, verkauft Halbwahrheiten.
- **Kalle** — körperliche Drohung, blockiert Zugang, Schlagring; durch Autorität/Überraschung einschüchterbar.
- **Jochen** — nervöser Messer-Mann, redet schneller, kann unter Druck etwas verraten.

### Prosa-Guards bei Früh-Besuch (alle Orte sind freigeschaltet!)
Da alle Orte ab Start reisbar sind, kann der Spieler Frieda/Stallschreiberstr. VOR der jeweiligen Stage besuchen. `abStage` blockt das Indiz, aber die KI-Prosa darf die Kette nicht unterlaufen:
```
Frieda vor Stage 2 besucht       → bleibt vage. Kein Etui, kein Bornstein-Bezug, keine Kalle/Jochen-Offenbarung.
Stallschreiberstr. vor Stage 3   → kein Etui, keine Samtfaser, keine Tasche, keine konkrete Lager-Spur.
```

### TARGET ist ein Objekt, kein NPC
Das silberne Zigarettenetui ist `TARGET`, aber:
```
NICHT als ansprechbare Person rendern · NICHT in personenImRaum · NICHT als Cast-Figur erzählen.
```
(Verhindert KI-Drift, bei der ein Gegenstand wie eine Figur behandelt wird.)

### Notizbuch-Ziel pro Schlüsselindiz (nicht nur Marker)
Zusätzlich zu den Kartenmarkern nach jedem Schlüsselfund ein klares Journal-Ziel setzen, falls mehrere/optionale Spuren Orientierung kosten:
```
Aktuelle Spur: Bornstein zu Hehlerwegen befragen.
Aktuelle Spur: Tante Frieda in der Stallschreiberstraße aufsuchen.
Aktuelle Spur: Lager im Hinterhof prüfen.
Aktuelle Spur: Etui an Krause zurückgeben.
```

### Spannungsverlauf aktiv anheben (gegen „80 % Sp 1-2"-Warnung)
Die Kette löst die Stagnation, aber nicht automatisch die Ruhe. An diesen Punkten Spannung explizit hochsetzen:
```
Bornstein nennt Frieda    → leicht hoch
Frieda blockt ab          → mittel hoch
Kalle & Jochen sichtbar   → deutlich hoch
Lager betreten            → Arena-Gefahr
```

### Acceptance-Tests (Regressionsschutz, nach dem Bauen prüfen)
```
T1: Neuer Krause-Fall, Reisekarte sofort → Bornstein leuchtet NICHT zu früh (nur Tatort). Stage startet auf 0.
T2: Nach Fenster+Vitrine+Wirth UND ab Szene 4 (Stage 0→1) → Bornstein wird nächster Marker. (Bei sehr schnellem Run vor Sz 4: kurz noch kein Marker — Engine korrekt.)
T3: Nach Bornstein UND ab Szene 6 (Stage 1→2 braucht floor>=2 & sc>=6) → Frieda leuchtet, Stallschreiberstr. NOCH NICHT.
T4: Nach Frieda (Stage 2→3, floor>=3 & sc>=8) → Stallschreiberstr. leuchtet.
T5: Nach Lager/Etui → „Krause berichten" wird logisch angeboten.
T6: Kalle & Jochen erscheinen nur bei Frieda/Lager, nicht am Tatort.
T7: Fall ist OHNE Erika lösbar (Erika hat stage:1, hebt nichts).
T8: Resolve ohne Etui ODER eindeutigen Verbleib bleibt gesperrt.
T9: Erika allein (ohne Bornstein) hebt den Fall NICHT auf Stage 2 / lässt Frieda NICHT leuchten.
```

---

## 4-alt. Ursprünglicher Vorschlag (vor ChatGPT-Verfeinerung, Archiv)

Ziel: Eine Treppe 1→2→3→4, die den Spieler vom Tatort über einen Informanten zur Hehlerin und zur Konfrontation (Arena) und schließlich zum Diebesgut führt. Gleichzeitig erstmals die Arena (Kalle & Jochen) im Spiel aktivierbar.

### Stage 1 — Tatort (vorhanden, bleibt)
- `einbruch_fenster` — aufgehebeltes Fenster, Stemmeisen, keine Profis
- `etui_letzter_ort` — Staubrand in der Vitrine, wo das Etui lag
- `nachbarin_aussage` — Wirth sah 2 Männer mit schwerer Tasche

### Stage 2 — Erste Spur in die Halbwelt (NEU)
*Floor: eines davon hebt auf Stage 2.*
- **`bornstein_hehler_tipp`** (NPC: Bornstein, Ort: Bornsteins Laden, quelle: person)
  → „Sowas Auffälliges wird in Kreuzberg verkauft — frag bei Tante Frieda."
- **`etui_beschreibung_kalewski`** (NPC: Erika Kalewski, quelle: person; ROMANCE-Einstieg)
  → kennt das Etui genau (Gravur, Macken) → macht es später eindeutig identifizierbar.

### Stage 3 — Hehlerin / Konfrontation (NEU)
*Führt zur Arena.*
- **`frieda_ausweichend`** (NPC: Tante Frieda, Ort: Hehlerei, quelle: person)
  → Frieda blockt ab, ihre Schläger (Kalle & Jochen) werden sichtbar → Arena-Trigger möglich.
- **`lager_hinterhof`** (Ort: Stallschreiberstr. 12, quelle: umgebung)
  → im Lager Spuren des Diebesguts / der Tasche.

### Stage 4 — Diebesgut & Auflösung (NEU)
- **`etui_im_lager`** / Übergabe-Beweis → das Etui (oder sein Verbleib) wird gesichert.
  → ermöglicht `zielperson_gefunden` / Diebesgut-Rückgabe an Krause.

**Offene Designfragen für ChatGPT:**
1. Soll die Arena (Kalle & Jochen) **zwingend** auf dem Lösungspfad liegen oder optional (Gewalt vermeidbar via Bornstein/Bestechung)?
2. Wie viel ROMANCE (Erika) — nur Indiz-Quelle oder eigener kleiner Tension-Strang?
3. Diebesgut zurück = Auflösung, oder auch „Dieb überführt" als alternativer Abschluss?
4. Floor-Werte: reicht 1 Stage-2-Indiz für den Sprung, oder 2 (wie Margarete)?

---

## 5. Vorgehen (mit ChatGPT pro Fall)

Reihenfolge nach DIFFICULTY_ORDER (Einstiegspfad zuerst):
1. **Kessler** (beschatten) — Kette prüfen, ggf. Stage 4 ergänzen
2. **Krause** (diebstahl) — Kette neu bauen (dieses Dokument, Abschnitt 4)
3. Wegener (vermisst)
4. Achterberg (Mord)
5. Brandt (wahrheit)
… restliche Fälle danach.

**Pro Fall mit ChatGPT klären:**
- Welche Stages sind belegt? (Lücken wie bei Krause finden)
- Ergibt die Kette einen klaren „nächsten Schritt" in jeder Stage?
- Sind alle Setup-NPCs als Indiz-Quelle oder Konsequenz eingebunden?
- Gibt es Dramatik-Varianz (nicht nur Befragung → auch Konfrontation/Arena/Romance/Custody)?
- Floor-Logik: hebt mind. 1 Indiz pro Stage sauber auf die nächste?

---

## 6. Technische Notizen (für die Umsetzung)

- Indizien-Felder: `id`, `text`, `npc` ODER `quelle:'umgebung'`, `actions`, `schluessel` (Keyword-Trigger), `stage`, optional `abStage`, optional `hotspot`+`fundText` (für Wimmelbild-Orte), optional `itemType:'beweis_dokument'`.
- `stage`: Stage-Floor — Fund dieses Indizes hebt den Fall mindestens auf diese Stufe.
- `abStage`: Indiz erst ab dieser Stage auffindbar (verhindert zu frühes Finden).
- Wimmelbild-Orte binden Indizien über `hotspots: ['indiz_id']` an Klickzonen (siehe Krause-Laden Zellen V/F).
- Migration anderer Fälle bisher: nur Margarete + Kessler + Krause(halb) auf Kern-Indizien. Rest läuft über alte Zähllogik.
