# Konzept: Nur noch definierte Indizien (keine KI-Fantasie-Indizien)

Status: KONZEPT zur Freigabe. Benjamin-Entscheidung: "Nur noch DEFINIERTE Indizien. Die KI darf keine eigenen mehr
erfinden. Jedes Indiz ist eins der definierten, Counter zählt immer runter." Großer Eingriff (Prompt gemini.js +
Frontend). Schrittweise + getestet. NACH den laufenden kleinen Fixes.

## Das Problem (im Run _1631 bewiesen)
Es gibt ZWEI parallele, unsynchronisierte Indizien-Systeme:
1. DEFINIERTE Kern-Indizien: 11 Stück im Margarete-Setup, mit id + schluessel-Wörtern + Gates (zeit/npc) + stage.
   Werden über pruefeKernIndizFund() per Schlüsselwort-Match erkannt -> caseProgress.gefundeneIndizIds -> zählen den
   Reise-Counter runter + heben Stage-Floor.
2. KI-ERFUNDENE Indizien: Die KI liefert pro Szene ein frei formuliertes "indiz_neu" (Prompt verlangt das aktiv).
   Landen in caseProgress.indizien (Text) -> zählen für "Aktueller Stand" + Gesamtzahl, ABER NICHT für den Counter.

Folge im Run: 2 KI-Indizien gefunden ("Zahlenkombination 04-22-12 auf Wahler-Dienstplan", "Güterlisten mit Stempel"),
aber 0 (!) definierte Kern-Indizien getriggert (kein "🔑 KERN-INDIZ gefunden"). Der Reise-Counter blieb bei "2 jetzt",
obwohl "Aktueller Stand" Indizien zeigte. Benjamin: "wirkt als würde nicht runtergezählt" - korrekt, weil die KI-
Indizien die definierten gar nicht treffen.

## Benjamin-Entscheidung & Ziel
- Es gibt NUR die definierten Indizien (Margarete: 11). Keine Fantasie-Indizien der KI mehr.
- Jedes gefundene Indiz ist eins der definierten -> Toast + Counter runter + klar zugeordnet.
- Wenn alle definierten gefunden: Ort = erledigt. Gesamt-Indizienzahl ist fix bekannt (z.B. /11).

## Architektur-Umstellung (Kern)
Statt "KI erfindet indiz_neu, Frontend rät per Schlüsselwort parallel" ->
"Engine sagt der KI, WELCHES definierte Indiz hier/jetzt findbar ist; die KI baut die Szene DARUM; der Fund wird
deterministisch gesetzt."

### Variante A (bevorzugt): Engine steuert, KI erzählt
- Beim Szenenaufbau ermittelt die Engine die am aktuellen Ort + zur Tageszeit + mit anwesendem NPC findbaren, noch
  offenen Kern-Indizien (offeneIndizienAmOrtNachErreichbarkeit liefert das "jetzt"-Set schon).
- Wenn der Spieler ERKUNDEN/Durchsuchen wählt (oder ein passender Trigger), gibt die Engine der KI EIN konkretes
  Ziel-Indiz vor: "In dieser Szene findet Karl: <ind.text>. Beschreibe den Fund atmosphärisch." (Prompt-Feld z.B.
  ziel_indiz_id + ziel_indiz_text).
- Nach der Szene: die Engine markiert ind.id deterministisch als gefunden (_markiereIndizGefunden) - KEIN Schlüsselwort-
  Raten mehr. Counter zählt garantiert runter.
- Das KI-Feld "indiz_neu" entfällt als eigenständige Indizienquelle. (Optional: die KI darf weiter atmosphärische
  Detail-Funde erzählen, aber sie zählen NICHT als Indiz - reine Prosa.)

### Was mit "indiz_neu" passiert
- Prompt (gemini.js + Frontend-Prompts): nicht mehr "trag ein neues Indiz in indiz_neu ein", sondern "der Fund ist
  bereits vorgegeben (ziel_indiz), erfinde KEINE eigenen Beweisstücke".
- Frontend: die indiz_neu-Übernahme in caseProgress.indizien wird abgeschaltet ODER nur noch als Spiegel des
  definierten Fundes genutzt (ind.text). So bleibt "Aktueller Stand" konsistent mit dem Counter.

### Gates & Findbarkeit (wichtig, sonst findet man nichts mehr)
- Wenn KEIN Schlüsselwort-Raten mehr: die Findbarkeit hängt an Ort + Tageszeit + NPC + Spieleraktion (ERKUNDEN/
  Durchsuchen/Befragen des richtigen NPC). Das muss großzügig genug sein, sonst Sackgasse.
- Vorschlag: Bei ERKUNDEN/Durchsuchen am Ort mit offenem "jetzt"-Indiz -> dieses Indiz wird gefunden (eins pro Szene,
  Reihenfolge nach stage/Definition). Bei Befragen des gebundenen NPC -> dessen Indiz.
- Reine Beobachten/Offensiv-Szenen finden kein Indiz (wie bisher).

## Risiken / worauf zu achten
- NICHT die Stage-Progression brechen: definierte Indizien haben stage-Floor; wenn sie zuverlässiger gefunden werden,
  könnte der Fall schneller voranschreiten - Tempo prüfen (evtl. max 1 Indiz/Szene wie heute).
- gemini.js-Prompt muss mit: "erfinde keine Indizien". Das ist eine Server-Datei (Deploy separat!).
- Andere Fälle: Haben die auch definierte Indizien-Arrays? Wenn nicht, brauchen sie sie, sonst finden sie GAR nichts
  mehr (heute leben sie evtl. nur von KI-indiz_neu!). >> ZUERST PRÜFEN: hat jeder Fall genug definierte Kern-Indizien?
  Falls nein, ist "nur definierte" für diese Fälle erst nach Nachpflege möglich. Ggf. Margarete zuerst, Rest später.

## Offene Fragen für Benjamin
1. Sollen die anderen 13 Fälle auch sofort umgestellt werden, oder erst Margarete (Pilot), Rest nach Indizien-Nachpflege?
2. Darf die KI noch atmosphärische "Detail-Funde" erzählen (die nicht zählen), oder gar nichts Gegenstandsartiges mehr?
3. Findbarkeit: reicht "ERKUNDEN am Ort mit offenem Indiz -> Fund", oder willst du es an konkretere Aktionen koppeln
   (durchsuchen/befragen)?

## Umsetzungsschritte (nach Freigabe, je getestet)
I1. PRÜFEN: haben alle Fälle definierte Kern-Indizien? (Bestandsaufnahme - entscheidet Pilot-vs-alle.)
I2. Engine gibt ziel_indiz vor (bei ERKUNDEN/Durchsuchen am Ort mit offenem jetzt-Indiz) + markiert deterministisch.
I3. indiz_neu als eigenständige Quelle abschalten (Frontend) + Prompt anpassen (gemini.js: keine erfundenen Indizien).
I4. "Aktueller Stand" + Gesamtzahl auf definierte Indizien umstellen (z.B. "3 / 11 Indizien").
I5. Gegen Run testen: jedes gefundene Indiz zählt Counter runter, keine Fantasie-Indizien mehr.

---
## BENJAMIN-SCHÄRFUNG (zentral): FINDBARKEITS-GARANTIE
Das Label "X Indizien hier" ist ein VERSPRECHEN, das eingelöst werden MUSS. Kernprinzip:
- Wenn "2 Indizien jetzt hier" steht, MUSS der Spieler diese dort zuverlässig + ZÜGIG bekommen können.
- NICHT in den Schoß fallen, aber auch NICHT zäh: jede Szene kostet Geld, Fälle sind nur 50-65 Szenen lang.
- Es darf NIE passieren: hinreisen, erkunden/befragen, und trotzdem nichts finden (= aktueller Bug, genau das Gegenteil).

### Zwei Fundwege (beide gültig)
1. UMGEBUNGS-INDIZIEN: über ERKUNDEN / BEOBACHTEN / "die Gegend absuchen" / "durchsuch den Raum" am Ort.
2. PERSONEN-INDIZIEN: über den gebundenen NPC - ANSPRECHEN, im Gespräch überzeugen, BESTECHEN, oder DURCHSUCHEN
   (nach K.O. des Bösewichts). Der NPC darf sich WEHREN, bevor man an das Indiz kommt - aber der Weg muss offen sein.

### Harte Anforderungen
- Steht "X Indizien hier" mit NPC-Bindung, muss der gebundene NPC dort auch ANWESEND sein (nicht "komm wieder").
  -> Findbarkeits-Check für die "jetzt"-Zählung muss konsistent sein mit tatsächlicher NPC-Präsenz am Zielort.
- Die richtige Aktion am richtigen Ort -> Indiz VERLÄSSLICH (nicht zufalls-/schlüsselwortabhängig). Das ist genau
  der Grund für die deterministische Vergabe (Engine gibt ziel_indiz vor + markiert hart).
- Spürbarer Fortschritt: pro passender Aktion in der Regel ein Indiz (Tempo: max 1/Szene bleibt ok, aber es MUSS
  kommen, wenn die Aktion passt).
- Umgebungs-Indiz: ERKUNDEN/Durchsuchen am Ort mit offenem "jetzt"-Umgebungs-Indiz -> Fund.
- Personen-Indiz: Ansprechen/Bestechen/Überzeugen/Durchsuchen des gebundenen, anwesenden NPC -> Fund (NPC darf erst
  Widerstand leisten, aber nicht endlos blocken).

### Konsequenz fürs Datenmodell
- Jedes definierte Indiz braucht eine klare QUELLE: 'umgebung' (Ort+Aktion erkunden/durchsuchen) ODER 'person'
  (npc-gebunden, Aktion ansprechen/bestechen/durchsuchen). ind.npc gibt es schon; ggf. ind.quelle ergänzen.
- "jetzt"-Zählung: ein Indiz ist nur "jetzt", wenn seine Quelle gerade bedienbar ist (Ort erreichbar + bei person-
  Indiz der NPC anwesend + Tageszeit passt). Sonst "später". Das hält das Versprechen ehrlich.

## SEPARATER PUNKT: Bösewicht-/Mystery-Eindimensionalität (Charaktertiefe)
Benjamin + ChatGPT-Lektorat: Bösewichte und Mystery-Figuren ("Mann im langen Mantel") wirken zu eindimensional /
wie dieselbe gesichtslose Schablone, die mehrfach auftaucht. Schon besser als früher, aber noch zu flach.
-> EIGENES Thema (nicht Teil des Indizien-Umbaus): festere NPC-Profile (Eigenheiten, Sprechweise, Motiv, Macke) +
Prompt-Führung, damit wiederkehrende Antagonisten Persönlichkeit + Wiedererkennbarkeit haben statt generisch.
Für später als IDEE/Konzept. Hier nur notiert, damit es nicht verloren geht.

## BENJAMIN-ENTSCHEIDUNGEN (Findbarkeit)
- BEIDE Fundwege (Umgebung via erkunden/absuchen + Person via ansprechen/durchsuchen/bestechen/überzeugen).
- Findbarkeits-GARANTIE ist Pflicht: richtige Aktion am richtigen Ort -> Indiz zügig + verlässlich.
- Gebundener NPC muss bei "X Indizien hier" anwesend sein.

---
## I1 BESTANDSAUFNAHME (erledigt) - ERGEBNIS: NUR MARGARETE HAT DEFINIERTE INDIZIEN
Geprüft: Im ganzen Code gibt es nur ~7-8 indizien-Arrays, ALLE im Margarete-Block (caseType politisch, Z5002-5062).
Die anderen 13 Fälle (vermisst/diebstahl/mord) haben KEINE definierten Kern-Indizien - sie leben komplett von
KI-erfundenen indiz_neu.
=> KONSEQUENZ (zwingend): "Nur definierte Indizien" wird PILOT für Margarete. Global anschalten würde 13 Fälle
kaputtmachen (gar keine Indizien mehr). Andere Fälle laufen weiter mit KI-indiz_neu, bis sie nachgepflegt sind
(eigenes großes Projekt). Margarete ist ohnehin Hauptfokus (einziger politischer, meistgetesteter Fall).
=> Der Umbau muss FALL-SPEZIFISCH greifen: nur wenn der aktuelle Fall definierte Indizien hat (Margarete), wird
indiz_neu abgeschaltet + ziel_indiz-Steuerung aktiv. Sonst altes Verhalten.

## STATUS: Konzept fertig + Bestandsaufnahme erledigt. BEREIT für Bau (nach Benjamin-OK).
Bau-Schritte verbleibend: I2 (ziel_indiz-Steuerung + deterministische Vergabe, NUR für Fälle mit def. Indizien),
I3 (indiz_neu für solche Fälle abschalten + gemini.js-Prompt), I4 (Aktueller Stand "X / 11"), I5 (Run-Test).
Findbarkeits-Garantie (Benjamin): richtige Aktion am richtigen Ort -> Indiz zügig+verlässlich; NPC anwesend bei "X hier".

---
## CHATGPT-LEKTORAT: 5 FREIGABE-BEDINGUNGEN (übernommen) + Schärfungen
Freigabe erteilt als Margarete-Pilot. Die 5 Bedingungen sind verbindlich:
1. NUR Margarete-Pilot. Andere Fälle bleiben Legacy (KI-indiz_neu). Schalter: caseHasDefinedEvidence(currentCase).
2. Indizien sind ENGINE-Zustand. KI-Indizien zählen nicht mehr (für Fälle mit def. Indizien).
3. KI darf DETAILS erzählen, aber keine neuen ZÄHLENDEN Beweise. (Wichtig: Prosa NICHT austrocknen!)
4. "X Indizien hier" zählt nur wirklich JETZT findbare (findableNow).
5. Richtige Aktion am richtigen Ort garantiert GENAU EIN Indiz, solange eines offen ist.

### Schärfung A: INDIZ vs DETAIL (zentrale Sprachregel)
- INDIZ = zählend, definiert, enginekontrolliert (Counter/Stage/Falllogik/Aktueller Stand/Finale/Reise-Hinweise).
- DETAIL = erzählerisch, NICHT zählend (Atmosphäre, Geruch, Stimmung). Darf die KI weiter frei erzählen.
- Prompt-Regel (gemini.js): "Du darfst atmosphärische Details beschreiben. Du darfst KEINE neuen zählenden Indizien,
  Beweise, Akten, Namen, Codes oder Täterhinweise erfinden. Wird ein Indiz gefunden, ist es exakt das vorgegebene
  ziel_indiz." -> Prosa bleibt lebendig, nur die Beweiskette ist hart.

### Schärfung B: DREI Zahlen statt einer
- findableNow = jetzt wirklich findbar (Ort erreichbar + Aktion bedienbar + NPC anwesend + Tageszeit + stage).
- lockedHere = an diesem Ort, aber gerade nicht bedienbar (=> "später").
- remainingInCase = insgesamt noch offen (für "X / 11"-Gesamtanzeige).
- UI-VERSPRECHEN nur findableNow: "2 Indizien hier findbar" (nicht "2 an diesem Ort", wenn eins gesperrt ist).
  (Unsere v588-Anzeige "X jetzt · Y später" entspricht findableNow/lockedHere - passt schon.)

### Schärfung C: AKTIONS-KLASSIFIKATION (nicht nur ERKUNDEN!)
- classifyEvidenceAction(action) -> fundModus: "umgebung" (raum_absuchen/schreibtisch_pruefen/akten_lesen/ERKUNDEN/
  DURCHSUCHEN am Ort) ODER "person" (npc_befragen/ANSPRECHEN/npc_bestechen/npc_durchsuchen/UEBERZEUGEN).
- pickFindableEvidence({location, actionMode, npc, time, stage}) wählt das passende offene Indiz.
- Wichtig: "durchsuch den Schreibtisch" / "frag Margarete nach den Akten" MÜSSEN das Indiz liefern (nicht nur
  wörtlich "erkunden"). Sonst Frust trotz richtiger Aktion.

### Schärfung D: Datenmodell mit quelle + actions + requiresNpcState
{ id, text, quelle:'umgebung'|'person', ort, npc?, actions:['ERKUNDEN','DURCHSUCHEN'|'ANSPRECHEN','BESTECHEN',...],
  zeit?, stageMin?, stageFloorOnFind?, requiresNpcState?:['ko','gefesselt','eingeschuechtert'] }
- Gefährliche NPCs (Mertens): Indiz erst nach DURCHSUCHEN_NACH_KO/BEDROHEN/ENTWAFFNEN - NPC darf Widerstand leisten,
  aber nicht endlos blocken. "ansprechen" gibt bei einem Schläger nicht sofort ein Indiz.
- Die bestehenden Margarete-Indizien (schluessel-basiert) müssen auf dieses Modell migriert werden (quelle/actions
  ergänzen). schluessel kann als Fallback/Detail-Hinweis bleiben.

### Schärfung E: STAGE beat-basiert statt nur numerisch
- Statt indizien.length>=8: hasEvidence("dienstplan_wahler") && hasEvidence("route_schoeneweide") -> stage>=2 etc.
- Logische statt numerische Progression. Verhindert "politisch passiert viel, Engine klebt bei Stage 1".
- (Vorsicht: bestehende stage-Floor-Logik der Indizien nicht doppelt/widersprüchlich machen. Migrieren, nicht parallel.)

### Schärfung F: "Ort erledigt" ist stand-/stage-relativ
- Nicht ortErledigt=true absolut. Sondern: getFindableNow(ort).length===0 -> "für aktuellen Stand abgearbeitet".
  Ein Ort kann durch neue Stage/NPC/Tageszeit wieder relevant werden. (Unser v588-Haken sollte das respektieren:
  "✓ erledigt" nur wenn weder jetzt noch später was offen ist; bei nur-später -> "N später" statt Haken. Prüfen!)

## BAU-REIHENFOLGE (final, nach diesem Lektorat)
I2a. Datenmodell: Margarete-Indizien um quelle/actions/requiresNpcState erweitern (+ ein paar fehlende ergänzen?).
I2b. classifyEvidenceAction + pickFindableEvidence + deterministische Vergabe (1/Szene), NUR wenn caseHasDefinedEvidence.
I2c. findableNow/lockedHere/remainingInCase sauber trennen (v588-Anzeige darauf umstellen).
I3.  indiz_neu für Margarete als Indizienquelle abschalten; gemini.js-Prompt: Detail-erlaubt/Beweis-verboten + ziel_indiz.
I4.  Aktueller Stand + Gesamtanzeige "X / N" auf definierte Indizien.
I5.  Stage beat-basiert (vorsichtig migrieren). I6. Run-Test.
Jeder Schritt einzeln + node-getestet. gemini.js separat deployen.

---
## STAND NACH v591 (für nahtlose Fortsetzung)
ERLEDIGT: I2a (Datenmodell quelle+actions, v590), I2b (deterministische Vergabe + Findbarkeits-Garantie, v591).
ZU TESTEN VOR I3: v591 im echten Spiel - an Ort mit "Indizien hier" reisen, erkunden/durchsuchen ODER passenden NPC
ansprechen -> kommt das definierte Indiz zuverlässig? Zählt der Reise-Counter runter? (DAS ist die Grundlage für I3.)

NÄCHSTER SCHRITT I3 (HEIKEL, 2 Dateien, frische Runde empfohlen):
- gemini.js (SERVER, separater Deploy, 347 Zeilen): Prompt-Regel "Du darfst atmosphärische DETAILS beschreiben, aber
  KEINE neuen zählenden Indizien/Beweise/Akten/Namen/Codes/Täterhinweise erfinden. Wird ein Indiz gefunden, ist es das
  vorgegebene ziel_indiz." (Indiz-vs-Detail). indiz_neu-Schema bleibt, aber Nutzung für Fälle mit def. Indizien gesperrt.
- index.html Frontend: indiz_neu-Verarbeitung ist TIEF verwoben (Z31420-31740, mehrere Filterstufen: suppress, dedup,
  Mord-Rettung). Für caseHasDefinedEvidence()-Fälle (Margarete) muss scene.indiz_neu NICHT mehr in caseProgress.indizien
  übernommen werden (nur definierte zählen). ABER: viele Prompt-Push-Stellen erzwingen indiz_neu (ERKUNDEN-INDIZ-PFLICHT
  Z16831, ZIELPERSON-SPUR Z21424, ERMITTLUNG-STOCKT Z22933) - die müssen für Margarete die KI Richtung DEFINIERTER
  Indizien lenken (ziel_indiz-Hinweis), statt zu erfundenen. Sorgfältig, sonst bricht die Ermittlung.
- Danach I4 (Aktueller Stand "X/13"), I5 (Stage beat-basiert: hasEvidence(...) statt indizien.length), I6 (Run-Test).
ACHTUNG Re-Entry: window._letzteAktion wird in chooseOption gesetzt - bei Bot-Tests/Direktaufrufen ggf. null (defensiv ok).

## STAND NACH v592: I3+I4 ERLEDIGT
- Alt-Bug gefixt: Kern-Prüfung+Toast liefen nur bei KI-indiz_neu - jetzt IMMER.
- KI-indiz_neu wird für Margarete ignoriert; INDIZ-REGEL + ZIEL-INDIZ-Vorgabe pro Request (recap); Zwangs-Pushes gegated.
- Stand-Popup + Notizbuch: "X / 13 Indizien gefunden".
- KEIN gemini.js-Deploy nötig (Prompt komplett im Frontend).
VERBLEIBEND: I5 (Stage beat-basiert, VORSICHT count-Gates), I6 (Run-Test). Danach: Items + NPC-Actions (Benjamin).
