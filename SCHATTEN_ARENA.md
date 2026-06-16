# SCHATTEN — Arena / Rundenbasierter Party-Kampf (Spec)

Aktueller Stand: **nach v951** (Code-Stand v951; historische Basis v946 + v948/v950/v951). Diese Spec ist gegen den echten Code verifiziert — Funktionsnamen
sind reale Anker, keine Erfindung. Struktur nach ChatGPT-Lektorat (Doku-Aufräumung).

---

## 1. Design-Entscheidungen (FIX, von Benjamin)

1. **Rundenbasiert wie Final Fantasy.** Karl (+ Party) wählt Aktion → Gegner ziehen → bis K.O./Flucht/Sieg.
2. **Arena-Start bei Eskalation:** Karl greift an ODER ein Gegner wird gewalttätig → Arena an. Beide
   Pfade (Baukasten + NPC-Menü-Angriff).
3. **Indiz-Sicherung bei Sieg (KERNREGEL):** Ein gegner-gebundenes Indiz darf durch einen Kampf NIE
   unerreichbar werden. K.o./gefesselt → über **Durchsuchen** (Gegner bleibt im Raum, lootbar). Geflohen
   → **Auto-Drop** (er lässt etwas fallen). Grant-once (nie doppelt).
4. **Menschlicher Party-Begleiter** im Krause-Fall (anwerbbar), damit Karl nicht allein gegen 3 steht.

---

## 2. Bereits erledigt (Implementierungsstand nach v946)

- **Arena-Start** ✓ (v937 Baukasten-Pfad, v938 NPC-Menü-Angriff für Gegner ohne Profil). Auslöser:
  `_planAusfuehren` (Eskalations-Check) + `verb._gegnerLoestKampf` → `_encounterStartKampf`.
- **HP statt Sofort-K.O.** ✓ (v941). `_gegnerKampfHP` (Kampfrollen: Kalle 4, Jochen 2, Frieda 2).
  HP-Register `caseProgress.encounterHP`. Angriff in der Arena = Schaden, erst bei 0 HP echtes ko.
  Außerhalb der Arena unverändert (Sofort-Wirkung).
- **benommen-Trennung** ✓ (v941). `_gegnerBezwungen` zählt benommen mit Rest-HP NICHT als bezwungen
  (sonst beendet ein Treffer den Kampf). Wirklich aus: ko/gefesselt/fixiert/geflohen/uebergeben oder HP≤0.
- **Engine-lokaler Gegnerzug** ✓ (v941). Nach Karls Zug: aktive Gegner senken Karls Vf (Engine berechnet,
  KI erzählt nur). `encounterRound++`. Eskalationsdruck Runde 3/5. HP-Leiste im Arena-Banner.
- **Combat-Loot / Indiz-Sicherung** ✓ (v945/v946/v950). `_gegnerCombatLootIds`, `_gegnerCombatLootVergeben`,
  `_findeIndizById`, Grant-once via `_markiereIndizGefunden`.
  - **ko/gefesselt/fixiert:** macht NUR lootbar (Gegner bleibt am Ort sichtbar, W6 Z10313). Vergabe erst beim
    aktiven DURCHSUCHEN (`_durchsuchBeute`-Handler). KEINE Auto-Vergabe.
  - **geflohen:** Auto-Drop in `_npcZustandSet`, nur bei `reason:'enemy_flee'` (v950, Lektorat P2).
  - **Gegner-Fluchtpfad ANGESCHLOSSEN** ✓ (v951, Lektorat P1): Ab Kampf-Runde 5 flieht eine aktive Fluchtfigur
    (Frieda) per Engine-State (`geflohen`+`enemy_flee`) - schaltet den Auto-Drop scharf, ihre Spur wird beim
    Fliehen gesichert. Nur Fluchtfiguren, nur eine pro Runde, nur wenn nicht schon bezwungen.
  - `_indizNurUeberKampf` sperrt searchAfterDefeat-Indizien im normalen Fund-Pfad. Frieda = Dual-Path, Kalle/Jochen
    = Combat-only.
- **benommen-Cleanup bei Kampfende** ✓ (v951, Lektorat P1): Ein nur 'benommen'-Gegner mit Rest-HP wird bei
  `_encounterEnde` auf 'frei' zurückgesetzt (sonst gälte er außerhalb der Arena fälschlich als bezwungen/lootbar).
- **Fesseln-Regel in der Arena** ✓ (v951, Lektorat P1): Gegner mit voller HP nicht direkt fesselbar (HP-Bypass
  verhindert) - erst benommen/ko/fixiert oder mit Helfer/Party. Außerhalb der Arena unverändert.
- **Durchsuchen im laufenden Kampf** ✓ (v951, Lektorat P1): In der Arena erscheint "Durchsuchen" NICHT bei einem
  nur benommenen Gegner mit Rest-HP - erst bei ko/gefesselt/fixiert. Kein Durchsuchen, während daneben gekämpft wird.
- **Zentrale Arena-Schadensfunktion** ✓ (v950, Lektorat P1). `_arenaSchadenAnGegner(ziel, schaden, akteur)` - EINE
  Stelle für Arena-HP-Schaden. Karls Angriff UND Begleiter-Angriff laufen hierdurch. Kein direkter status:'ko'-Bypass
  mehr (vorher umging der Begleiter-Befehl die HP-Arena - hätte Max Riedel zur K.O.-Maschine gemacht).
- **Begleiter-Ablenkung arena-aware** ✓ (v957, Lektorat P1 verifiziert). In der Arena setzt Ablenkung nicht mehr
  direkt 'gefesselt' (wäre derselbe Bypass), sondern 'benommen' - Karl muss im Folgezug zugreifen. Außerhalb der
  Arena (Zugriff auf einen Überraschten) bleibt direktes Fesseln. Damit sind ALLE Begleiter-Pfade arena-dicht.

---

## 3. Noch offen

- **Max Riedel / Party-Begleiter** (Krause): Ex-Boxer aus Bornsteins Umfeld, anwerbbar nach
  `bornstein_hehler_tipp`. Als BLOCKER bauen (Lektorat: nicht nur Stärke +1, sondern GEGNERZUG-MODIFIKATOR -
  bindet Kalle, sodass der Hauptschaden der Runde wegfällt oder stark sinkt; macht selten selbst K.O.). Fall ohne
  ihn lösbar. WICHTIG: Begleiter-Angriff läuft seit v950 über `_arenaSchadenAnGegner` (kein Sofort-K.O.) - Max soll
  primär blocken, nicht angreifen.
- **Normale Optionen im Kampf raus:** ✓ (v948) Reisen/Schlafen/Resolve werden unterdrückt, solange Kampf läuft.
  (A/B/C/D-Optionen + Freitext sind im aktuellen Baukasten-First-Modus ohnehin global deaktiviert:
  `KI_OPTIONEN_AKTIV=false`, `FREITEXT_AKTIV=false` — gehandelt wird über System-Buttons + Personen + Baukasten.
  Daher kein Kampf-Filter dafür nötig.) Personen-Buttons/Exploration im Kampf schon vorher aus.
- **Gegnerzug-Balance:** max. 1 echter Schadensangriff pro Runde, weitere Gegner machen Druck/blocken/Flucht.
  3-gegen-1 darf Karl nicht in 2 Runden zermahlen. (Aktuell senkt der Gegnerzug Vf summiert — verfeinern.)
- **Fesseln-Regel:** benommen allein = fesselbar mit Risiko; benommen+Helfer/Rex = leicht; ko/gefesselt/fixiert
  = durchsuchbar.
- **Victory-Aftermath-UI:** Nach Sieg sichtbar „Kalle durchsuchen / fesseln / weiter zum Lager".
- **Bot-Heuristik** (zuletzt): Vf≤2 → fliehen/defensiv; Gegner low HP → angreifen; gefesselt/ko mit Loot →
  durchsuchen.

---

## 4. Historische Diagnose (vor v937/v941/v945 — als Referenz, NICHT mehr aktuell)

Das fehlende Stück war damals: Baukasten-„Angreifen" rief nie `_encounterStartKampf` → kein Arena-State →
keine Runden. Es gab keinen Gegnerzug und keine Runden-Schleife. Gegner-gebundene Indizien hingen nur an
Gesprächs-Actions → Kampf konnte eine Spur unerreichbar machen. **All das ist seit v937–v946 behoben.**

---

## 5. Acceptance-Tests (Regression)

- T1: Baukasten/Menü-Angriff auf Frieda/Kalle/Jochen startet die Arena.
- T2: Angriff in der Arena macht Schaden (HP-Leiste sinkt), kein Sofort-K.O.
- T3: Gegnerzug senkt Karls Vf nach Karls Zug (Engine, nicht KI-Fantasie).
- T4: benommen (Rest-HP) beendet die Arena NICHT.
- T5: ko-Gegner bleibt im Raum sichtbar und zeigt „Durchsuchen".
- T6: Durchsuchen vergibt Combat-Loot GENAU EINMAL (grant-once).
- T7: ✓ (v951) Geflohener Gegner (Frieda ab Runde 5, enemy_flee) droppt Loot automatisch.
- T8: Karls Flucht vergibt KEINEN Gegner-Loot.
- T9: Frieda bleibt über Gespräch erreichbar (NICHT combat-only).
- T10: Kalle gibt `kalle_transportzettel` NICHT beim normalen Befragen (nur Kampf/Durchsuchen).
- T11: ✓ (v948) Reisen/Schlafen/Resolve im Kampf nicht verfügbar. (ABCD/Freitext im aktuellen Modus ohnehin global aus.)
- T12 (offen): Max Riedel in Party-Reihe, bindet Kalle, schwächt Gegnerzug; Fall ohne ihn lösbar.
- T13: ✓ (v951) Kalle mit voller HP nicht sofort fesselbar; benommen/ko oder mit Helfer schon.
- T14: ✓ (v951) Durchsuchen im Kampf nur bei echt bezwungenem Gegner (ko/gefesselt/fixiert), nicht bei benommen.
- T15 (offen): Ohne Max macht Kalle den Hauptdruck; mit Max wird Kalle gebunden, Gegnerzug schwächer.

---

## 6. Risiken / Vorsicht

- `_planAusfuehren` ist groß und vielfach verzweigt — Eingriffe minimal-invasiv, bestehende Pfade nicht brechen.
- Gegnerzug darf nicht mit der KI-Szene kollidieren (Doppelschaden vermeiden) — daher engine-lokal + KI nur erzählend.
- `_encounterEnde` räumt encounterState/HP, aber NICHT die NPC-Zustände (die leben in caseProgress.npcZustand) —
  besiegte Gegner bleiben dadurch durchsuchbar. Beim Aufräumen darauf achten.
- Schritt-für-Schritt liefern, je node --check + Acceptance-Test.
