# KONZEPT: Items & klickbare NPC-Aktionen ("Manöver")

Status: KONZEPT zur Freigabe (Projektleitung). Stand: 2026-06-10, nach v7.12.608.
Quellen: IDEE_ITEM_SYSTEM.md, IDEE_AKTIONS_KONFIGURATOR.md, IDEE_SCHLUESSEL_SCHLOSS.md + Weltwahrheit W1-W5.

## Leitprinzip (bewährt aus dem Weltwahrheit-Projekt)
**Engine entscheidet, KI erzählt.** Items und NPC-Zustände sind Engine-Wahrheit (wie Klientenstatus, Ort,
Custody). Die KI bekommt sie als HARTEN WELTZUSTAND in den Prompt und erzählt darum herum - sie kann sie
weder erfinden noch wegerzählen. Jeder Button, der klickbar ist, funktioniert sauber (eiserne Regel).

---

## Baustein 1: Inventar (Engine-Besitz)

### State
```js
caseProgress.inventory = [
  { id: 'akten_kopie', name: 'Kopie der Frachtakten', typ: 'beweis', quelle: 'indiz:akten_kopie_wohnung', seitSzene: 12 },
  { id: 'handschellen_agent', name: 'Handschellen (vom Agenten)', typ: 'werkzeug', quelle: 'manoever', seitSzene: 18 }
]
```
Helper: `_invAdd(item)`, `_invHat(id|typ)`, `_invRemove(id)` - zentral, mit diag, nie still.

### Quellen (Pilot)
1. **Indiz → Item**: Definierte Indizien bekommen optional `itemType` ('beweis_dokument', 'schluessel', ...).
   Beim KERN-INDIZ-Fund mit itemType wird automatisch das Item eingebucht. Bei Margarete: akten_kopie_wohnung,
   original_akten, frachtliste_stempel, wahler_unterschrift → typ 'beweis'.
2. **Manöver-Beute**: z.B. Handschellen vom gefesselten Agenten (Baustein 2).
3. **Start-Ausrüstung** (Fall-Setup, optional später): Karls Dietrich, Taschenlampe.

### Wirkung
- **recap**: `HARTER WELTZUSTAND - BESITZ (PFLICHT): Karl trägt bei sich: Kopie der Frachtakten, Handschellen.
  Nichts davon ist verloren/übergeben, solange die Engine es nicht meldet. Erfinde keinen Besitz dazu.`
- **Buttons**: Akten-Übergabe-Buttons prüfen `_invHat('beweis')` statt der /akten/-ID-Regex (löst ChatGPT-P2
  sauber). Sicherungs-/Übergabe-Klick verschiebt das Item: inventory → 'uebergeben@vera' (Beat akten_gesichert
  wird dann ENGINE-seitig gesetzt - die Ehrlichkeits-Regel und der Beat speisen sich aus demselben Zustand).
- **UI**: kleine Inventar-Zeile im Notizbuch (📓) - gleiche Lined-Paper-Optik, Abschnitt "In Karls Taschen".

---

## Baustein 2: NPC-Zustand + Manöver (klickbar)

### State (Weltwahrheit W6)
```js
caseProgress.npcZustand['mfs-agent'] = { status: 'gefesselt', ort: 'margarete_wohnung', seitSzene: 18 }
// status: frei | ko | gefesselt | geflohen | uebergeben (an VP/Roth)
```
recap-PFLICHT je Zustand: "Der MfS-Agent liegt GEFESSELT in Margaretes Wohnung. Er taucht in keiner anderen
Szene auf, bis die Engine ihn bewegt." (= dieselbe Mechanik wie CLIENT-STATE, die nachweislich funktioniert.)

### Pilot-Manöver (genau 2, im Personen-Menü)
**M1 "Niederschlagen & fesseln"** (Projektleitungs Kernszene aus v594):
- Gate (Engine-validiert): Ziel ist PHYSISCH präsent (W4-Quelle) + feindlich (tag AGENT/STASI/GEGNER oder
  Verfolger-Kontext) + Karl handlungsfähig (Verfassung >= 2, nicht in Custody).
- Ergebnis (deterministisch im Pilot): npcZustand = gefesselt@ort; ist das Ziel ein Agent → Item
  'Handschellen (vom Agenten)' + Prompt-Detail "mit SEINEN EIGENEN Handschellen gefesselt" (die
  Custody-Richtungs-Marker aus v594 erkennen das bereits korrekt - kein Gewahrsam für Karl).
- Konsequenz statt Würfel: Spannung +1, bei stasiTension >= 3 zusätzlich +1 Tension (Lärm, Risiko). Echte
  Fehlschlag-Chance kommt später konfigurierbar pro Fall - erst Verhalten beobachten (Outcome-Vielfalt!).
- Toast: "Zugriff - [Name] gefesselt zurückgelassen" + Notizbuch-Eintrag.

**M2 "Ablenkung & Zugriff"** (Party-Synergie):
- Gate: mind. 1 Begleiter in der Party + Ziel präsent.
- Ergebnis: wie M1, aber OHNE Spannungs-Aufschlag (der Begleiter macht den Lärm woanders) - der taktische
  Lohn fürs Mitnehmen von Begleitern. Prompt: "[Begleiter] lenkt ab (laut, glaubwürdig, ortstypisch),
  Karl greift zu."

Beide Manöver gehen NIE über Freitext-Heuristik - nur der Klick setzt den Zustand (Freitext darf die Szene
erzählen, aber das Furz-Gate-Prinzip gilt: keine Engine-Wirkung ohne Engine-Aktion).

---

## Baustein 3 (Phase 2, NICHT im Pilot): Schlüssel-Schloss
Indiz mit itemType 'schluessel' (Codewort, Safe-Kombination) trifft auf definiertes SCHLOSS am Ort
(Safe, Türsteher, Lager). Button erscheint nur bei Besitz. Macht Notizbuch + Freitext bedeutsam.
Kommt nach dem Manöver-Pilot, wenn die Item-Mechanik im Run bewiesen ist.

---

## Bauplan (kleine, einzeln getestete Schritte)
- **v609 - Inventar-Fundament**: State + Helper + itemType an 4 Margarete-Indizien + recap-BESITZ +
  Akten-Buttons auf _invHat umgestellt + Notizbuch-Abschnitt + Export-Zeile INVENTAR=[...].
- **v610 - NPC-Zustand + M1**: npcZustand-Map + recap-Pflicht + Manöver-Button "Niederschlagen & fesseln"
  mit Gates + Handschellen-Beute + Tests.
- **v611 - M2 Ablenkung**: Party-Synergie-Manöver + Export NPC-ZUSTAND pro Szene.
- **dann**: Projektleitungs Run + Lektorat → Schlüssel-Schloss-Entscheidung.

## Empfehlung
Sofort mit v609 (Inventar-Fundament) starten - es ist der kleinste Schritt, löst nebenbei den offenen
ChatGPT-P2 (Akten-Button-IDs) und liefert das Fundament, auf dem M1/M2 nur noch Zustands-Setzer sind.
