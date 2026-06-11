# KONZEPT: Item-Katalog & Aktions-Effekt-System

Status: KONZEPT, Bau begonnen v7.12.630. Stand 2026-06-11.
Grundlage: Items-Fundament (v609 ff.), Baukasten (v617 ff.), NPC-Zustand W6 (v610 ff.).

## Leitidee
Jedes Item trägt SELBST, wofür es taugt und was es bewirkt. Der Baukasten zeigt bei gewähltem Item nur die
PASSENDEN Aktionen (kein "Stinkbombe trinken"). Dasselbe Item wirkt je nach Aktion anders. Items sind
Engine-Wahrheit (Besitz/Status), die KI erzählt darum herum.

## Item-Definition
```js
ITEM_KATALOG = {
  west_zigaretten: { name: 'Schachtel West-Zigaretten', taugt: ['anbieten','bestechen','eintauschen'], tauschwert: 3, epoche: 'Lucky Strike/Chesterfield - harte Westwährung' },
  korn:           { name: 'Flasche Nordhäuser Doppelkorn', taugt: ['trinken','anbieten','werfen','schlagen'], tauschwert: 1, schaden: 'benommen' },
  bohnenkaffee:   { name: 'Päckchen Bohnenkaffee', taugt: ['anbieten','bestechen','eintauschen'], tauschwert: 3 },
  westmark:       { name: 'Bündel Westmark', taugt: ['bestechen','eintauschen'], tauschwert: 4, geld: true },
  penicillin:     { name: 'Ampulle Penicillin', taugt: ['anbieten','eintauschen'], tauschwert: 5 },
  nylonstruempfe: { name: 'Paar Nylonstrümpfe', taugt: ['anbieten','bestechen','eintauschen'], tauschwert: 2 },
  ziegelstein:    { name: 'Ziegelstein', taugt: ['werfen','schlagen','ablenken'], schaden: 'benommen' },
  knallkoerper:   { name: 'Knallkörper', taugt: ['werfen','ablenken'], schaden: 'ablenkung' },
  pfeffer:        { name: 'Handvoll Pfeffer', taugt: ['werfen','ablenken'], schaden: 'geblendet' },
  gammelfisch:    { name: 'Gammeliger Hering', taugt: ['werfen','ablenken'], comedy: true },
  brecheisen:     { name: 'Brecheisen', taugt: ['schlagen','werfen','aufbrechen'], schaden: 'ko' }
}
```
tauschwert (1-5) = wie viel die Sache wert ist (für eintauschen/bestechen-Gate). schaden = NPC-Zustand bei
Wurf/Schlag (benommen=Moment, ko=bewusstlos). epoche = Prosa-Hinweis für Historik.

## Aktions-Effekte (Baukasten zeigt nur item.taugt)
- **anbieten**: Geste, Vertrauensaufbau (kein Verlust, narrativ) - Item bleibt.
- **bestechen**: Item -> bei_npc@Ziel, Ziel kooperiert (ab tauschwert >= Schwelle des Ziels).
- **eintauschen** (Benjamins Spielrelevanz): Item gegen INFORMATION -> kann ein definiertes Indiz freischalten,
  WENN das Ziel eines kennt und tauschwert reicht. Item -> verbraucht. (Verbindet Items mit dem Fundament-Gate.)
- **trinken**: Item -> verbraucht, Stimmung/Zunge gelockert (narrativ, evtl. Befragung leichter).
- **werfen**: Item -> verloren, schaden-Effekt am Ziel (benommen/geblendet/ablenkung - Moment, kein Dauer-W6
  außer ko).
- **schlagen**: Item bleibt (oder bricht), schaden am Ziel (ko/benommen).
- **ablenken**: wie Baukasten-Ablenkung, Item evtl. verbraucht (Knallkörper) oder bleibt.

## Fund-Wege (alle Engine, kein KI-Erfinden)
1. **Beim Durchsuchen eines Gefesselten/KO** (v611 "Durchsuchen"): Engine vergibt definierte Beute - z.B.
   Westmark, Dienstausweis, Notizbuch. NEU: Geld/Item wird echtes _itemAdd statt nur Prosa.
2. **Von NPC erhalten**: Befragung/Geste -> NPC gibt Item (Engine-gesteuert über Szene-Ergebnis).
3. **Am Ort finden**: Orte tragen optionale `fundItems` - beim Durchsuchen/Erkunden vergibt die Engine sie.
4. **Manöver-Beute**: bereits vorhanden (jetzt sinnvoll: Geld vom Agenten).

## Pilot (v630): klein anfangen
- ITEM_KATALOG mit ~6 Kern-Items (Zigaretten, Korn, Westmark, Bohnenkaffee, Ziegelstein, Knallkörper).
- Baukasten filtert Aktionsliste nach item.taugt, wenn ein Item gewählt ist (sonst Standard-Aktionen).
- Durchsuchen eines Gefesselten vergibt deterministisch Beute-Items (Westmark beim Agenten) als echtes _itemAdd.
- 'eintauschen'-Aktion als Baukasten-Option (Indiz-Freischaltung erst v631 - erst Mechanik, dann Inhalt).
- DANACH: Orts-Fundlisten, NPC-Gaben, eintauschen->Indiz, Tauschwert-Gates pro NPC.
