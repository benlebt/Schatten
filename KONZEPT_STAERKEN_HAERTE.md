# KONZEPT: Party-Stärken & Gegner-Härte (Ghostbusters-Taktik)

Status: KONZEPT, Benjamin-Freigabe erteilt. Bau ab v637 geplant, schrittweise.
Grundlage: Baukasten (v617+), Items (v630+), Manöver/NPCZ (v610+), Begleiter (v614+).

## Leitidee (Benjamin)
"Es muss schwieriger sein als jeden Gegner wie einen billigen Slimer abzufertigen. Taktik: die richtigen
Party-Member + Items + Hund mitnehmen. Den Hauptmann kriegt man nur mit Übermacht."
- Jeder AKTEUR kann bestimmte Aktionen GUT / SCHLECHT / GAR NICHT (Stärke pro Aktionsart).
- Jeder GEGNER hat einen HÄRTEGRAD (wie viel "Stärke" nötig ist, um ihn auszuschalten).
- KEINE 100%-Erfolgsquote durch bloßes Klicken - die Summe der eingesetzten Stärke muss die Härte ERREICHEN oder übersteigen (>=).
- Erst DETERMINISTISCH (Summe >= Härte = Erfolg), kein RNG (sonst debuggen wir zu viel gleichzeitig).

## Akteur-Fähigkeiten (Stärke pro Aktionsart, 0-3)
0 = kann nicht / wirkungslos, 1 = schwach, 2 = solide, 3 = stark.
Abgeleitet aus ROLLE (nicht hartcodiert pro Name - skaliert auf alle Fälle).

```js
const ROLLEN_STAERKE = {
  // rolle-keyword: { angriff, ablenkung, einschuechtern, durchsuchen }
  detektiv:   { angriff: 2, ablenkung: 2, einschuechtern: 2, durchsuchen: 3 }, // Karl - Allrounder
  kommissar:  { angriff: 3, ablenkung: 1, einschuechtern: 3, durchsuchen: 2 }, // Roth - Kampf/Autorität
  polizist:   { angriff: 3, ablenkung: 1, einschuechtern: 2, durchsuchen: 2 },
  klient:     { angriff: 0, ablenkung: 2, einschuechtern: 0, durchsuchen: 1 }, // Margarete - schwach, lenkt ab
  sekretaerin:{ angriff: 0, ablenkung: 2, einschuechtern: 0, durchsuchen: 1 },
  informant:  { angriff: 1, ablenkung: 2, einschuechtern: 1, durchsuchen: 1 },
  zeuge:      { angriff: 1, ablenkung: 1, einschuechtern: 0, durchsuchen: 1 },
  arzt:       { angriff: 1, ablenkung: 1, einschuechtern: 1, durchsuchen: 2 },
  schlaeger:  { angriff: 3, ablenkung: 0, einschuechtern: 2, durchsuchen: 1 }
};
// HUND (Rex): Sonderfall - sehr stark im Einschüchtern/Fixieren, kein Durchsuchen.
const HUND_STAERKE = { angriff: 2, ablenkung: 1, einschuechtern: 3, durchsuchen: 0, fixieren: 3 };
```
Werfen (Item): Stärke = Item-Wirkung + halbe Akteur-Angriff-Stärke. Nicht kampferprobte NPCs werfen
schwächer, trainierte stärker. Margarete: angriff 0 -> Wurf wirkt nur über das Item selbst.

## Gegner-Härte (0-5)
Wie viel kumulierte Stärke nötig ist, um den Gegner per Manöver (fesseln/ausschalten) sicher zu bezwingen.
Abgeleitet aus tag/rolle:

```js
const GEGNER_HAERTE = {
  schatten:        2, // anonymer Verfolger, Mann im Mantel - mittel
  mann_im_mantel:  2,
  agent:           3, // einfacher Stasi-Agent
  stasi:           3,
  oberleutnant:    4, // Mertens - hart, braucht Übermacht
  hauptmann:       5, // höchste Stufe - nur mit Party + Hund + Items
  gangster:        3,
  posten:          2,
  wachmann:        2
};
```

## Erfolgs-Berechnung (deterministisch)
Bei einem Manöver/Plan gegen einen Gegner zählt die Engine die EINGESETZTE Stärke zusammen:
```
eingesetzteStaerke =
    Summe der Akteur-Stärken (je nach gewählter Aktionsart: Angriff/Ablenkung/Einschüchtern)
  + Hund-Bonus (falls Rex beteiligt)
  + Item-Bonus (Ziegelstein/Korn als Schlagwaffe, Knallkörper als Ablenkung)
  + Synergie-Bonus (Ablenkung + gleichzeitiger Angriff = +1, "koordiniert")

erfolg = eingesetzteStaerke >= _gegnerHaerte(gegner)  // Helper (Basis+Zustand), NICHT die Tabelle direkt
```
- erfolg=true: Gegner wird fixiert/gefesselt/ausgeschaltet wie bisher (NPCZ).
- erfolg=false: TEILERFOLG/FEHLSCHLAG - Gegner wehrt sich, Karl/Begleiter nimmt Schaden (Verfassung -1),
  Spannung steigt, Gegner bleibt frei. Prompt erzählt den misslungenen Zugriff (nicht tödlich).

### Beispiele
- Mann im Mantel (Härte 2): Karl allein (Angriff 2) = 2 >= 2 -> Erfolg. Ein Begleiter reicht.
- Mertens/Oberleutnant (Härte 4): Karl (2) + Margarete-Ablenkung (2) = 4 >= 4 -> Erfolg (genau dein v633-Run!).
- Hauptmann (Härte 5): Karl (2) + Roth-Angriff (3) = 5 -> Erfolg. ODER Karl (2) + Rex-Fixieren (3) = 5.
  Margarete (Ablenkung 2) + Karl (2) = 4 < 5 -> Fehlschlag, Hauptmann wehrt sich. Du brauchst Übermacht.

## Fessel-Material kontextuell (Benjamin)
Nicht jeder hat Handschellen. Bei erfolgreichem Fesseln wählt die Engine das Material nach Gegner-Typ:
```js
function _fesselMaterial(gegner) {
  if (/stasi|mfs|polizist|oberleutnant|hauptmann|agent/.test(gegner)) return 'mit dessen eigenen Handschellen';
  // sonst: KI erfindet etwas Plausibles am Ort
  return 'mit etwas, das gerade greifbar ist (Kabel, Strick, Wäscheleine, Gürtel, Vorhangkordel, Paketschnur)';
}
```
Prompt bekommt das Material als Vorgabe - die KI baut es ein, erfindet aber nichts Anachronistisches.

## Prompt-Führung bei Fehlschlag
```
MANÖVER-FEHLSCHLAG: Der Zugriff auf {gegner} MISSLINGT - er ist zu stark/zu wachsam für die eingesetzten
Kräfte. Erzähle, wie er sich losreißt, zurückschlägt oder ausweicht. Karl/die Begleiter kommen NICHT
unbeschadet davon (ein Treffer, ein Sturz), aber NICHT tödlich. {gegner} bleibt frei und gefährlich.
KEINE Fesselung, KEIN K.O. des Gegners. Die Spannung steigt.
```

## Bau-Reihenfolge (schrittweise, klein)
- v637 A: ROLLEN_STAERKE + GEGNER_HAERTE Tabellen + _akteurStaerke(npc, art) + _gegnerHaerte(gegner) Helper.
- v637 B: Erfolgs-Berechnung in _planAusfuehren - Summe der Plan-Einträge gegen dasselbe Ziel vs Härte.
  Debug-Spur: MANÖVER-CHECK: ziel=X haerte=4 eingesetzt=4 (Karl:2 + Margarete-ablenkung:2) -> erfolg.
- v637 C: Fehlschlag-Pfad (kein NPCZ, Verfassung -1, Spannung +1, Fehlschlag-Prompt).
- v637 D: Fessel-Material kontextuell in den Erfolgs-Prompt.
- DANACH: Item-Bonus verfeinern, Synergie-Bonus, evtl. später RNG-Streuung (±1) für Varianz.

## Wichtig
- Erst DETERMINISTISCH - der Spieler muss verstehen, WARUM etwas klappt/nicht klappt (Debug-Spur sichtbar).
- Gute NPCs (Willi etc.) sind nie Ziel (v628 deckt das schon).
- Beweis-Items nie als Waffe (v631 deckt das schon).
- Das System macht den Baukasten zur Taktik: die richtige Kombi mitnehmen, nicht stumpf klicken.

---

## NACHTRAG (Lektorat-Freigabe, eingearbeitet vor v637-Bau)
1. ROLLEN_STAERKE + NPC_STAERKE_OVERRIDE (additiv): Rollen-Basis + figurenspezifischer Override
   (margarete: ablenkung+1; lemke: angriff-1/einschuechtern-1; roth: einschuechtern+1; doc: durchsuchen+1).
   Skalierbar UND Persönlichkeit.
2. KEINE Geschlechter-Begründung: "nicht kampferprobter NPC wirft schwächer" statt "Frau wirft schwächer".
   Margarete = zivil/verängstigt, Roth = trainiert, Rex = Hund.
3. durchsuchen NICHT in der Bezwingungs-Mathematik (nur angriff/ablenkung/einschuechtern/fixieren zählen
   gegen Gegner). Durchsuchen ist Folgeaktion, erlaubt nur bei gefesselt/ko/abgelenkt/kooperativ.
4. Jeder Akteur nur EINMAL pro Manöver (Plan-Validierung: actorAlreadyUsedInThisPlan -> block).
5. Gegner-Härte = Basis + Zustand: benommen/geblendet -1, gefesselt -> 0, alarmiert +1, enger Raum -1,
   bewaffnet +1. Verbindet Items (Knallkörper/Pfeffer schwächen) mit Manöver-Taktik. clamp(0,6).
6. Erfolg != immer K.O./Fesseln: Zielzustand je nach Aktion (fixieren/entwaffnen/fesseln/benommen/ko/
   vertrieben/eingeschuechtert). Nicht binär.
7. Fesselmaterial nach ORT (1953-fest, kein nacktes "Kabel"): wohnung->Gürtel/Wäscheleine/Vorhangkordel;
   buero->Paketschnur/Telefonkabel; bahn->Draht/Lederriemen/Packband; Stasi/Polizei->eigene Handschellen.
8. UI-Einschätzung für den Spieler (nicht nur Debug): "Das könnte knapp reichen" / "Reicht wahrscheinlich
   nicht - du brauchst Roth, Rex oder eine stärkere Ablenkung."
9. ABSCHLUSS-SCHUTZ: if (caseReadyToResolve) disableNewCombatEscalation - das Taktiksystem darf den Fall
   nach Beweiserfolg NICHT neu aufblasen (deckt sich mit v636 Stasi-Deckel).

## v637-Bauplan (Lektorat-bestätigt)
- A: Tabellen + Helper (_akteurStaerke mit Override, _gegnerHaerte mit Zustand).
- B: MANÖVER-CHECK NUR für koordinierte Plan-Zugriffe (nicht alle Kämpfe), Debug-Spur + UI-Einschätzung.
- C: Fehlschlag-Pfad (kein Tod/Custody/Ortswechsel/K.O.; Verfassung-1, Spannung+1).
- D: Fesselmaterial nach Ort.
- NICHT in v637: RNG, Mehrgegner-Initiative, Skilltrees, volle Item-Schadensmatrix.


## NACHTRAG 2 (Lektorat-Freigabe v637-Konzept): MANOEVER_ARTEN als Anker
Erfolg ist nicht generisch - je nach Manöver-Art zählen andere Stärkearten und entsteht ein anderer Zustand.
Im Code (v637) implizit über _planEintragStaerkeArt + _wirkung gelöst; als expliziter Anker für später:
```js
const MANOEVER_ARTEN = {
  fesseln:    { zaehlt: ['angriff','ablenkung','fixieren'],     erfolgsZustand: 'gefesselt' },
  entwaffnen: { zaehlt: ['angriff','einschuechtern','ablenkung'], erfolgsZustand: 'entwaffnet' },
  vertreiben: { zaehlt: ['einschuechtern','angriff'],           erfolgsZustand: 'vertrieben' },
  ablenken:   { zaehlt: ['ablenkung'],                          erfolgsZustand: 'abgelenkt' }
};
```
Erfolgreicher Rex-Zugriff != automatisch K.O.; erfolgreicher Knallkörper != fesseln. Kann v639 explizit werden.

## STATUS: v637 GEBAUT (Tabellen/Helper/Manöver-Check/Fehlschlag/Fesselmaterial), v638 = v636a-Hotfixes drin
(TDZ-Bug, Item-Effekte Engine-wirksam, anbieten, trinken-itemNoetig, Stasi-Gate, Eintausch-Toasts). Code nutzt
_gegnerHaerte() korrekt (Lektorat-Punkt 3 im Code bereits richtig). Nächster Schritt: Run-Test des Manöver-
Checks im echten Spiel, dann ggf. UI-Einschätzung im Baukasten (Lektorat-P2).
