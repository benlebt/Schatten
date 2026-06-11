# Konzept: UI-Überarbeitung "Klarheit & Übersicht"

## Die Probleme (aus Benjamins Analyse + Runs)
1. **Statusleiste (Verfassung/Spannung) auf iPhone nicht mehr permanent sichtbar** - scrollt mit dem
   Szenentext weg, man muss hochscrollen. (Technisch: `.scene-status-strip` ist pro Szene eingebettet;
   die globale `.status-bar` klebt auf Mobile nicht zuverlässig.)
2. **Zersplitterte Aktionsfläche**: ABCD-Buttons + Systembuttons (Flucht/Schlafen/Reisen/Notizbuch/
   Heilen/Resolve) + NPC-Namen alle untereinander, lange Liste, überladen.
3. **Unklar, was eine Szene auslöst**: ABCD lösen Szenen aus, Reisen/Notizbuch NICHT. Für den Spieler
   nicht unterscheidbar. (Bei NPC-Popups ist es schon markiert - das ist gut und bleibt.)
4. **NPC-Namen im Raum**: kleine unterstrichene Schrift, nicht klar als gleichberechtigt-klickbar erkennbar.
5. **Notizbuch-Button sitzt unter Flucht** (fühlt sich falsch - ist keine Aktion) + ist sichtbar, obwohl leer.
6. **"Aktueller Stand" schwer auffindbar** (öffnet durch Tippen auf Statusleiste - weiß niemand).
7. **Kein Erfolgserlebnis** bei Tod/Abschluss (nur trockener Text). [SPÄTER, eigenes Thema]

## Leitidee
Drei klar getrennte Zonen statt einer langen Buttonliste:
- **OBEN (immer sichtbar)**: kompakte Status-Bar = Verfassung + Spannung + Tag/Zeit. Permanent, fixed.
  Antippbar -> "Aktueller Stand". Das ist der EINE zentrale Status-Zugang.
- **MITTE**: Szenentext.
- **UNTEN (Aktionszone)**: klar strukturiert, nicht alles flach untereinander.

## Button-Klarheit: was löst eine Szene aus?
**Regel: Szene-auslösende Aktionen bekommen ein eindeutiges Symbol; Nicht-Szene-Buttons sind klar abgesetzt.**
- Szene-auslösend (ABCD, NPC-Verben, Flucht, Schlafen): Filmklappen-/Vorspul-Symbol (z.B. ▶ oder 🎬)
  als konsistenter Marker "hier geht die Geschichte weiter".
- NICHT Szene-auslösend (Reisen=Menü, Notizbuch, Aktueller Stand): optisch abgesetzt (andere Farbe/Stil,
  z.B. dezenter, ohne ▶), klar als "Werkzeug/Übersicht" erkennbar.
- NPC-Popup-Markierung (löst Szene aus / ändert nur Party) BLEIBT - die ist schon gut.

## Menüstruktur (Benjamins Idee: aufklappbare Kategorien statt flache Liste)
Statt alle Buttons untereinander -> wenige klare Einstiege, die aufklappen:
- **[Personen]** - klappt die NPCs im Raum auf (jeder mit Verb-Menü). Macht NPC-Klickbarkeit eindeutig.
- **[Handeln]** - die ABCD-Szenenoptionen (Standard-Aktionen).
- **[Bewegen/System]** - Reisen, Flucht, Schlafen (Ortswechsel/Zeit).
- **[Status]** (oben/separat) - Aktueller Stand + Notizbuch.
Minimal animiertes Auf-/Zuklappen. Auf kleinem Screen entscheidend: nicht 12 Buttons gleichzeitig.

ABER: Aufklappmenüs sind ein großer Eingriff. Daher gestuft (siehe Bau-Reihenfolge) - erst die
schnellen Klarheits-Gewinne, dann optional die Menü-Umstrukturierung.

## Notizbuch & Aktueller Stand zentralisieren
- Beide unter EINEN klaren Status-Zugang (oben, antippbare Status-Bar -> Tab "Stand" / "Notizbuch").
- Notizbuch-Button NICHT mehr unter Flucht.
- Notizbuch erst anzeigen/aktiv, wenn mind. 1 Notiz da ist (oder ausgegraut mit "noch leer").

## Bau-Reihenfolge (klein, einzeln getestet)
**Schritt A** - Permanente Mini-Status-Bar oben (Verfassung+Spannung+Tag/Zeit), fixed, iPhone-sicher.
   Der wichtigste Gewinn. Antippbar -> Aktueller Stand (existiert schon).
   iOS-sticky-Falle umgehen: echte `position:fixed` Mini-Leiste am Viewport-Top, nicht sticky-im-Container.
**Schritt B** - Button-Klarheit: Szene-auslösende Buttons mit ▶-Marker, Nicht-Szene-Buttons (Reisen/
   Notizbuch/Stand) optisch absetzen. Notizbuch raus aus der Aktionszone, rauf zum Status-Zugang.
**Schritt C** - NPC-Namen im Raum als klar klickbare Chips/Buttons (nicht mehr klein-unterstrichen).
**Schritt D** - (optional, groß) Aufklappbare Kategorien-Menüstruktur statt flacher Liste.
**Schritt E** - (später, eigenes Thema) Tod/Abschluss: Sound + kleine Animation als Erfolgs-/Verlusterlebnis.

Jeder Schritt: eigener Versionssprung, node --check, am Gerät getestet, BEVOR der nächste kommt.
Schritt A zuerst, weil größter Gewinn + löst Benjamins akutes "ich seh meine Werte nicht"-Problem.

## Offene Fragen an Benjamin
- Schritt-A-Mini-Leiste: nur Verfassung+Spannung, oder auch Tag/Zeit/Ort + Indizienzahl?
- ▶-Marker für Szene-Buttons ok, oder lieber Filmklappe 🎬 / anderes Symbol?
- Aufklappmenü (Schritt D) wirklich gewünscht, oder reicht die Klarheit aus A-C?
