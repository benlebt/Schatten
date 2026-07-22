# Konzept: "Handeln vs. Übersicht" - zwei übergeordnete Einstiege

## Die Idee (Projektleitung)
Statt jeden Button einzeln mit einem Marker (▶) zu kennzeichnen, gibt es ZWEI große Einstiege ganz oben
in der Aktionszone. Der Spieler wählt zuerst die ABSICHT, dann erscheinen die passenden Optionen.

**Vorteil:** Die Szene-vs-Werkzeug-Unterscheidung wird strukturell (eine Ebene höher) statt als Symbol an
jedem Button. Der User lernt es EINMAL: "Handeln = Geschichte geht weiter. Übersicht = nur ordnen."
Das ist ruhiger und eindeutiger als 8 Buttons mit Markern.

## Die zwei Einstiege

### ▶ HANDELN (löst eine Szene aus)
Tippen klappt auf / zeigt:
- Die **A/B/C/D-Optionen** (die Standard-Szenenaktionen)
- **Szene-auslösende Personen-Aktionen**: pro anwesendem NPC die Verben
  befragen, bestechen, bedrohen, angreifen, beobachten, beschützen, in Sicherheit bringen
- **Akut-Aktionen**: Flucht, Notheilen (lösen Szenen aus, aber siehe "Akut bleibt sichtbar")
- **Schlafen**, **Fall lösen** (Resolve)

### ⚙ ÜBERSICHT (löst KEINE Szene aus)
Tippen klappt auf / zeigt:
- **Reisen** (öffnet das Reise-Menü)
- **Notizbuch** (gefundene Indizien)
- **Personen-Verwaltung**: Person in Party aufnehmen / mitnehmen, hier lassen / zurücklassen
- **Inventar ansehen** (falls vorhanden)
- (Aktueller Stand sitzt schon oben in der Statusleiste - bleibt dort)

## Wichtige Designregeln (aus ChatGPT + Erfahrung)

### 1. Akut-Aktionen NIE vergraben
Flucht und Notheilen lösen zwar Szenen aus (gehören also zu "Handeln"), aber sie sind in Gefahr/bei
niedriger Verfassung AKUT. Sie dürfen NICHT hinter einem Extra-Tipp verschwinden, wenn es brennt.
→ Bei Gefahr (Sp>=3) oder niedriger Verfassung (Vf<=2): eine eigene kleine "AKUT"-Gruppe DIREKT sichtbar,
   über den zwei Einstiegen. Sonst (ruhige Lage) liegen sie normal unter "Handeln".

### 2. Personen erscheinen im RICHTIGEN Einstieg
Tippt man eine Person an, muss klar sein, welche Aktion Szene auslöst und welche nicht:
- Unter HANDELN: die Person + ihre szene-auslösenden Verben.
- Unter ÜBERSICHT: dieselbe Person + mitnehmen/hier lassen.
ODER (einfacher, evtl. besser): Person antippen öffnet EIN Verb-Menü, das INTERN zweigeteilt ist
("Ansprechen ▶" oben, "Verwalten" unten). Das behält die bestehende NPC-Popup-Logik bei.
→ ENTSCHEIDUNG NÖTIG (siehe offene Fragen).

### 3. Engine-Wahrheit (Required-Location v570)
Was unter HANDELN erscheint, muss am aktuellen Engine-Ort möglich sein. Eine Raum-Durchsuchung im Opel
darf gar nicht erst als Handeln-Option auftauchen (oder wird beim Tippen mit Hinweis abgefangen, wie v570).

### 4. iPhone-Fokus
Zwei große, gut tappbare Einstiege. Aufklappen minimal animiert. Nicht zu viele Ebenen - max. zwei Tipps
bis zur Aktion (Einstieg -> Aktion). Personen-Verben evtl. dritte Ebene (Einstieg -> Person -> Verb) -
das ist grenzwertig, daher Designfrage unten.

## Standardzustand (was ist offen?) - PROJEKTLEITUNG-ENTSCHEIDUNG
Projektleitung will ZWEI gleichberechtigte große Einstiege oben: [▶ HANDELN] und [⚙ ÜBERSICHT]. Man tippt
einen an, dann klappen dessen Optionen auf. Die A/B/C/D leben ALSO hinter "Handeln" (ein Tipp), nicht
mehr dauerhaft sichtbar.

Damit das auf dem iPhone nicht nervt:
- Beim Erscheinen einer neuen Szene ist "HANDELN" automatisch aufgeklappt (man sieht sofort A/B/C/D +
  Personen-Verben), "ÜBERSICHT" ist zu. So kostet die häufigste Aktion (A/B/C/D wählen) KEINEN Extra-Tipp,
  aber die Struktur der zwei Einstiege bleibt sichtbar.
- Tippt man "ÜBERSICHT", klappt Handeln zu und Übersicht auf (Akkordeon - immer nur einer offen).
- NPCs erscheinen kontextabhängig: unter HANDELN mit szene-auslösenden Verben, unter ÜBERSICHT mit
  Verwalten-Aktionen (mitnehmen/hier lassen).

So ist Projektleitungs Wunsch (zwei klare Einstiege) erfüllt UND das Spielgefühl bleibt flüssig (A/B/C/D sofort da,
weil Handeln vorausgeklappt ist).

## Bau-Reihenfolge (klein, einzeln getestet)
**Schritt 1** - "ÜBERSICHT"-Sammelbutton bauen: Reisen + Notizbuch (+ später Inventar/Party) unter einen
   zusammenklappbaren Einstieg bündeln. Das ist der kleinste, sofort spürbare Schritt und baut die rechte
   Hälfte der Struktur. A/B/C/D + Akut zunächst unverändert daneben/darunter.
**Schritt 2** - "HANDELN"-Einstieg bauen: A/B/C/D + szene-auslösende Personen-Verben darunter bündeln,
   beim Szenenstart vorausgeklappt. Akkordeon-Logik (immer nur einer offen) mit ÜBERSICHT.
**Schritt 3** - Akut-Gruppe (Flucht/Heilen) als eigene sichtbare Gruppe GANZ OBEN bei Gefahr (Sp>=3/Vf<=2),
   damit sie nie hinter einem Tipp verschwindet.
**Schritt 4** - Personen-Verwaltung (mitnehmen/hier lassen) sauber zwischen Handeln (Verben) und
   Übersicht (Verwalten) aufteilen - bzw. im NPC-Popup intern trennen.
Nach Schritt 1+2 kann das ▶ als Einzel-Marker weg (Trennung ist dann strukturell).

## Offene Fragen an Projektleitung
1. Personen-Aktionen: Ein NPC-Popup mit zwei Bereichen ("Handeln" / "Übersicht")? Oder Person taucht
   getrennt unter Handeln (Verben) UND unter Übersicht (mitnehmen/hier lassen) auf?
   (ENTSCHEIDUNG: EIN Popup, intern geteilt - Projektleitung + ChatGPT einig. NPC-Logik bleibt erhalten.)
2. Begriffe: ENTSCHEIDUNG "Handeln" / "Übersicht" (ChatGPT: "Übersicht" intuitiver als "Organisieren").
3. ▶ als Einzel-Marker: nach dem Umbau weg (Trennung ist dann strukturell). ENTSCHEIDUNG: ja, weg.

## HARTE DESIGNREGEL (ChatGPT, verbindet UI mit Required-Location v570)
> Alles unter HANDELN muss am aktuellen Engine-Ort gültig sein UND darf wirklich eine Szene auslösen.
> Alles unter ÜBERSICHT darf NIEMALS heimlich eine Szene auslösen.
Das ist der Kern: die UI zeigt Engine-Wahrheit. Im Opel keine Wohnungs-Durchsuchung unter Handeln; in Doc
Wagners Praxis keine Wahler-Konfrontation. Required-Location-Check (v570) und diese UI gehören zusammen.

## REISEN-SONDERFALL (ChatGPT - wichtig, sonst verwässert die Regel)
Reisen ist zweistufig:
- Das Reise-MENÜ ÖFFNEN = Übersicht (zeigt nur Orte, löst nichts aus). Liegt also unter ÜBERSICHT.
- Der ZIEL-KLICK im Reisemenü ("Fahr zum Bahnhof Friedrichstraße") löst die nächste Szene aus = Handeln.
→ Im Reisemenü muss der Ziel-Button klar als "startet die nächste Szene" erkennbar sein (▶ oder Hinweistext
  "spielt nächste Szene"). So bleibt die Regel sauber: Menü öffnen ist gefahrlos, das Losfahren ist eine Handlung.
Gleiches gilt fürs Notizbuch: ÖFFNEN = Übersicht (nur lesen, kein Szenen-Trigger).

## EIN MODELL, ZWEI LAYOUTS (ChatGPT - Desktop darf nicht wie aufgeblasene Handy-App wirken)
Gleiche Logik, gleiche Begriffe, gleiches NPC-Popup auf allen Geräten - nur die DARSTELLUNG unterscheidet sich:
- **iPhone (<768px): AKKORDEON.** Nur ein Bereich offen. Handeln beim Szenenstart automatisch offen, Übersicht zu.
  Tap auf einen Tab klappt den anderen zu. Akut-Gruppe immer über den Tabs (wenn aktiv). Verhindert 20 Buttons
  untereinander.
- **Desktop (>=768px): ZWEI SPALTEN nebeneinander.** Handeln links, Übersicht rechts, beide gleichzeitig sichtbar
  (genug Platz, kein Wegklappen nötig). Akut oben quer wenn aktiv. Desktop-Spieler wollen Übersicht, nicht erst
  alles aufklappen.
Technisch: @media-Breakpoint 768px schaltet zwischen Akkordeon (mobil) und Zwei-Spalten-Panel (Desktop).
NPC-Popup: iPhone = Bottom Sheet, Desktop = kleines Popover/Side-Panel. Inhalt identisch.

## Zielbild (ChatGPT-finalisiert)
iPhone-Aktionszone:
```
[Akut]            <- nur bei Gefahr (Sp>=3 / Vf<=2)
Flucht
Notheilen

[Handeln] [Übersicht]   <- Tabs, Handeln offen
  Handeln offen zeigt: A/B/C/D, Personen-Aktionen, Fall lösen, Schlafen
  Übersicht zeigt: Reisen, Notizbuch, Inventar, Indizien, Personen verwalten
```
NPC-Popup (beide Geräte):
```
Margarete Stein
Handeln:   Befragen · Beruhigen · Beschützen · In Sicherheit bringen
Übersicht: Info ansehen · Mitnehmen · Hierlassen
```

## PRÄZISIERUNG (Projektleitung): Personen leben INNERHALB der Einstiege, nicht mehr separat
WICHTIG - das ersetzt die "ein geteiltes NPC-Popup"-Idee. Die anwesenden Personen schweben NICHT mehr als
anklickbare Namen außerhalb/zwischen den Buttons. Sie erscheinen INNERHALB beider Einstiege:
- Unter HANDELN: anwesende Personen als Einträge -> Tippen zeigt die szene-auslösenden Verben (befragen,
  bedrohen, beobachten, beschützen, in Sicherheit bringen, bestechen, angreifen).
- Unter ÜBERSICHT: dieselben Personen als Einträge -> Tippen zeigt nicht-szene-Aktionen (Info ansehen,
  mitnehmen, hier lassen).
Der Spieler klickt NIE mehr eine Person "irgendwo daneben". Er ist immer schon in einer Kategorie - und
allein dadurch weiß er: das hier löst eine Szene aus (Handeln) oder eben nicht (Übersicht). Die Kategorie
ist die durchgängige Trennlinie, auch bei Personen.

Konsequenz für den Bau: die heutige "anwesende NPCs als anklickbare Buttons außerhalb"-Zeile (v7.12.517,
getNpcsAtCurrentLocation -> Chips) entfällt als eigenständiges Element. Die NPC-Liste wird zweimal gerendert:
einmal im Handeln-Block (mit Szenen-Verben), einmal im Übersicht-Block (mit Verwalten-Aktionen). Quelle bleibt
getNpcsAtCurrentLocation (Engine-Wahrheit: nur wirklich anwesende Personen).

Aktualisiertes iPhone-Zielbild:
```
[Akut]  (nur bei Gefahr)  Flucht · Notheilen

[Handeln]  (offen)
  A/B/C/D
  -- Personen hier --
  Margarete Stein      (tippen -> Befragen/Beruhigen/Beschützen/In Sicherheit bringen)
  Mann im Mantel       (tippen -> Beobachten/Bedrohen/Angreifen)
  Fall lösen · Schlafen
[Übersicht]  (zu, tippen öffnet)
  Reisen · Notizbuch · Inventar · Indizien
  -- Personen hier --
  Margarete Stein      (tippen -> Info/Mitnehmen/Hierlassen)
```

## FINALE BESCHRIFTUNG + ACHSE (Projektleitung-Entscheidung - ersetzt "Handeln/Übersicht")
Die wahre Trennlinie ist die ZEIT/SZENEN-Währung, nicht "Handlung vs. Übersicht":
- **"Übergang in nächste Szene"** = löst eine Szene aus, Zeit vergeht, Tageszeit kann wechseln.
- **"Bleibt in der Szene"** = kostet keine Szene, keine Zeit, man bleibt im aktuellen Moment.
Bewusst NICHT "kostet eine Szene" formuliert (klingt negativ/bestrafend). Neutral beschreiben was passiert.

EINSORTIERUNG (final):
- ÜBERGANG IN NÄCHSTE SZENE: A/B/C/D, Personen mit Szenen-Verben (befragen/bedrohen/beobachten/beschützen/
  in Sicherheit bringen/bestechen/angreifen), REISEN (kostet eine Szene!), Flucht, Schlafen, Fall lösen.
- BLEIBT IN DER SZENE: Notizbuch, Indizien, Inventar, Person mitnehmen, Person dalassen, Info ansehen.

REISEN ist damit eindeutig "Übergang in nächste Szene" (es kostet immer eine Szene + dreht die Zeit weiter).
Der frühere "Reisen-Sonderfall" entfällt komplett - Reisen ist einfach eine szene-kostende Aktion.

Kürzel/Anzeige offen: evtl. lange Labels auf iPhone kürzen ("Nächste Szene" / "In der Szene") - am Gerät prüfen.
Akut-Gruppe (Flucht/Notheilen bei Gefahr) bleibt darüber - auch wenn Flucht "Übergang" ist, ist sie akut sichtbar.
