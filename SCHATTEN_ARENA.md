# SCHATTEN — Arena / Rundenbasierter Party-Kampf (Spec)

Stand: nach v936. Benjamins Entscheidungen sind FIX (unten). Diese Spec ist gegen den echten
Code verifiziert — Funktionsnamen/Zeilen sind reale Anker, keine Erfindung.

## Benjamins Design-Entscheidungen (FIX)

1. **Ablauf: rundenbasiert wie Final Fantasy.** Karl (+ Party) wählt Aktion → Gegner ziehen →
   Wiederholung bis K.O./Flucht/Sieg.
2. **Arena-Start (Eskalation):** Sobald Karl angreift ODER ein Gegner gewalttätig wird → Arena an.
   (Auch über den Baukasten-„Angreifen"-Pfad, nicht nur das NPC-Menü.)
3. **Indiz-Sicherung bei Sieg (KRITISCH, Benjamins Kernregel):**
   "Viele Gegner haben Indizien für uns, die müssen wir bei Sieg erhalten — egal ob k.o.,
   gefesselt oder flüchtend."
   - **K.o. / gefesselt** → über **Durchsuchen** (Gegner liegt, Karl durchsucht ihn → Indiz).
   - **Geflohen** → **automatisch** (er lässt im Fliehen etwas fallen → Indiz landet im Notizbuch).
   Kernprinzip: Ein Kampf darf NIE ein gegner-gebundenes Indiz unerreichbar machen. Sieg = Zugang
   zum Indiz, unabhängig vom Ausschalt-Modus.
4. **Party-Begleiter im Krause-Fall:** menschlicher Verbündeter einbauen (anwerbbar), damit Karl
   nicht allein gegen Frieda+Kalle+Jochen steht.

## Bestehende Infrastruktur (verifiziert — NICHT neu erfinden)

- `_encounterStartKampf(enemyName)` (Z11257): setzt `caseProgress.encounterState='kampf'`,
  `encounterEnemies=[...]`, `encounterRound=0`, `encounterStartedAtLocation`. Sammelt alle freien
  Feinde am Ort. Mehrfachaufruf nimmt neue Feinde dazu.
- `_encounterEnde(grund)` (Z11278): grund ∈ {bezwungen, geflohen, abgebrochen}. Räumt State + DOM.
- `_encounterKonsistenzCheck()` (Z11299): Ortswechsel/Fall-Ende/alle-bezwungen → sauberes Ende.
- `_encounterBannerRender(container)` (Z11323): zeichnet die Arena (Gegner-Reihe oben mit Zustand,
  „— gegen —", Party-Reihe unten: Karl + Rex + Begleiter, dann Baukasten-Slot als „Dein Zug").
  Wird bei `encounterState==='kampf'` gerendert (Aufruf Z29058).
- `_gegnerBezwungen(name)` (Z11292): true bei ko/gefesselt/fixiert/benommen/geflohen/uebergeben.
- `_npcZustandSet/Get` (Z11092): Status pro NPC (frei/ko/gefesselt/fixiert/benommen/geflohen/uebergeben).
- `_gegnerProfilVon(name)` (Z11188) + `gegnerprofil.kampf` { gefahr, waffe, rundenLimit, fluchtMoeglich }.
- `_freieFeindeAmOrt()` (Z11196).
- Baukasten: `BAUKASTEN_AKTIONEN` (Z13419: angreifen wirkung:'ko', fesseln wirkung:'gefesselt' beute:true,
  durchsuchen_npc nur bei bezwungenem Ziel Z13621, bestechen, ablenken...). `_bkUebernehmen(sofort)`
  (Z13675) baut Plan-Einträge + `_planAusfuehren()`.
- `_planAusfuehren()` (Z11551): MANÖVER-CHECK (Stärke vs Härte je Ziel → Erfolg/Fehlschlag),
  setzt Wirkungen (`_npcZustandSet`), Beute-Logik, dann KI-Szene.

## Das fehlende Stück (Diagnose)

- Baukasten-„Angreifen → Sofort ausführen" ruft `_planAusfuehren()` → setzt Wirkung 'ko' als
  EINMALIGE Prosa-Aktion, ruft aber NIE `_encounterStartKampf`. → kein Arena-State → keine Runden.
- Es gibt KEINEN Gegner-Zug (enemy turn) und KEINE Runden-Schleife. `encounterRound` wird gesetzt,
  aber nie hochgezählt/ausgewertet.
- Gegner-gebundene Indizien (aktuell nur `frieda_ausweichend` an tante_frieda, Z6076) hängen an
  Gesprächs-Actions (BEFRAGEN/BESTECHEN). Schalte ich Frieda im Kampf K.o., ist das Indiz NICHT
  über Kampf erreichbar → Benjamins Kernregel verletzt.

## Bauplan (kleine, einzeln testbare Schritte)

### Schritt 1 — Eskalation startet die Arena (Auslöser verbinden)
- In `_planAusfuehren` (oder direkt bei Baukasten-Angriff): erkennt der Plan eine OFFENSIVE Aktion
  (angreifen/angreifen_mit/werfen gegen einen GEGNER) UND ist `encounterState!=='kampf'` →
  `_encounterStartKampf(ziel)` VOR der Wirkungsanwendung aufrufen.
- Ebenso: wird ein Gegner in der KI-Szene gewalttätig (Threat-Regex greift, vgl. Z28299) und ein
  GEGNER ist präsent → Arena an. (Vorerst optional; Hauptpfad ist Karls Angriff.)
- Akzeptanz: Baukasten „Angreifen → Frieda" → ⚔-Arena erscheint mit Frieda/Kalle/Jochen oben.

### Schritt 2 — Runden-Schleife + Gegner-Zug
- Nach Karls Zug (Plan ausgeführt): `encounterRound++`. Dann GEGNER-ZUG: jeder noch freie Gegner
  handelt (Angriff auf Karl → Vf-Verlust je nach gegnerprofil.kampf.gefahr; ggf. Flucht bei
  fluchtMoeglich und niedriger eigener Lage). Ergebnis als kurze Prosa/Toast.
- Abbruch: alle Gegner bezwungen → `_encounterEnde('bezwungen')`. Karl flieht (Flucht-Option) →
  Arena bleibt offen oder Ende je nach Design. rundenLimit als Sicherheitsnetz.
- Akzeptanz: Mehrere Runden möglich, Gegner schlagen zurück (Vf sinkt), Kampf endet sauber.

### Schritt 3 — Indiz-Sicherung bei Sieg (Benjamins Kernregel)
- Datenmodell: Gegner-gebundenes Kampf-Indiz braucht einen Weg, der NICHT an Gesprächs-Actions
  hängt. Zwei Sub-Fälle:
  - **K.o./gefesselt:** „Person durchsuchen" am bezwungenen Gegner → vergibt sein Indiz
    (durchsuchen_npc ist schon auf bezwungene Ziele beschränkt, Z13621 — hier die Indiz-Vergabe
    andocken).
  - **Geflohen:** beim Setzen von Status 'geflohen' → Indiz automatisch ins Notizbuch (er lässt
    etwas fallen), mit kurzer Prosa.
- Für Krause konkret: Kalle/Jochen brauchen je ein kleines Kampf-Indiz (z.B. Lager-Schlüssel,
  Transport-Detail), Frieda ihr `frieda_ausweichend` auch über Kampf erreichbar machen.
- Akzeptanz: Frieda im Kampf K.o. → durchsuchen → Indiz da. Kalle flieht → Indiz fällt automatisch.

### Schritt 4 — Menschlicher Verbündeter (Krause-Fall)
- Ein anwerbbarer Kontakt (Kandidat: noch zu wählen — z.B. ein Gelegenheits-Schläger aus Bornsteins
  Umfeld, oder ein Volkspolizist, oder ein zweiter Privatdetektiv). Tag ALLY/VERBUENDETER, joinbar
  über eine Aktion, erscheint dann in der Party-Reihe der Arena und zählt bei der Stärke-Summe
  (Synergie +1 ist schon da, Z11583).
- Akzeptanz: Karl + Verbündeter gegen 3 Gegner ist machbar statt aussichtslos.

## Risiken / Vorsicht
- `_planAusfuehren` ist GROSS und vielfach verzweigt (Manöver-Check, Item-Angriffe, KI-Szene).
  Eingriffe minimal-invasiv halten, bestehende Pfade nicht brechen.
- Gegner-Zug darf nicht mit der KI-Szene kollidieren (doppelte Schaden-Anwendung vermeiden).
- Bot-Modi (natürlich/offensiv/random) müssen die Arena auch bedienen können (Testläufe).
- Schritt-für-Schritt liefern, jeweils node --check + ein Akzeptanz-Test, bevor der nächste kommt.
