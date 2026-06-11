# SCHATTEN — Übergabe an neuen Chat (Stand v7.12.670)

Du bist Claude, Engineering-Partner für Benjamins KI-Film-Noir-Detektiv-Textadventure
**"Schatten"** (Berlin 1953, Detektiv Karl Mauer). Dieses Dokument ist deine vollständige
Arbeitsgrundlage. Lies es zuerst, dann kannst du sofort weiterarbeiten.

---

## ⚡ SOFORT-ORIENTIERUNG

- **Aktueller Stand: v7.12.670** ausgeliefert + gepusht (Commit `4290ff2`)
- **Echte Quelle**: `/mnt/user-data/outputs/index.html` (NICHT /mnt/project/ — das ist veraltet!)
- **Repo**: github.com/benlebt/Schatten · Deploy: schatten-dusky.vercel.app · Admin: `?debug=hardenberg17`
- **Benjamin**: schreibt deutsch (Voice-Messages/Screenshots), einziger Tester, erwartet klare
  Einzelempfehlungen ("was empfiehlst du?"), ehrliches Eingestehen von Claude-Fehlern, schickt
  ChatGPT/Gemini-Lektorate als Arbeitsaufträge.
- **Antwortsprache: durchgehend DEUTSCH.**

---

## 🔧 DATEI-WORKFLOW (exakt so, jeden Turn)

```bash
# 1. Kopien holen (NUR aus outputs, NIE aus /mnt/project/)
cp /mnt/user-data/outputs/index.html /tmp/index.html
cp /mnt/user-data/outputs/SCHATTEN_PROJEKT.md /tmp/SCHATTEN_PROJEKT.md
cp /mnt/user-data/outputs/KONZEPT_BAUKASTEN_FIRST.md /tmp/   # falls gebraucht
```

- Editieren in `/tmp/index.html` (str_replace, oder Python `io.open(...encoding='utf-8')` für Umlaute)
- **/tmp wird zwischen Turns RESETTET** — immer neu kopieren.
- `/mnt/project/index.html` = read-only + VERALTET (Session-Start-Snapshot). NIE als Quelle nutzen.
- Run-Logs: `/mnt/project/Mauer_*.txt` (neuester via `ls -t /mnt/project/Mauer_*.txt | head -1`).
  Regex/Logik IMMER gegen echtes Run-Log testen, nie gegen konstruierte Beispiele.

### Pipeline vor jeder Auslieferung (PFLICHT)
```bash
# Script extrahieren (größter <script>-Block) + node --check
cd /tmp && python3 -c "
import re, io
html = io.open('index.html','r',encoding='utf-8').read()
big = max(re.findall(r'<script[^>]*>(.*?)</script>', html, re.DOTALL), key=len)
io.open('/tmp/extract.js','w',encoding='utf-8').write(big)
" && node --check /tmp/extract.js && echo "SYNTAX OK"
```
- `node --check` fängt Syntax-/Klammerfehler (NICHT ReferenceErrors/Scope). Hat schon mehrfach
  fehlende Klammern gefangen — immer laufen lassen.
- Logik-Tests: kleine `node -e "..."`-Test-Suiten, alle grün vor Auslieferung.
- **Version-Bump an 2 Stellen** (sed): `Schatten v7.12.XXX` UND `SCHATTEN_VERSION = 'v7.12.XXX'`
- SCHATTEN_PROJEKT.md per `cat >> ... << 'EOF'` ergänzen (deutscher Changelog-Block)
- nach outputs kopieren + `present_files`

---

## 🐙 GITHUB AUTO-PUSH (fester Workflow, Turn-Ende)

**Token** (fine-grained, Contents:write auf benlebt/Schatten):
```
<TOKEN — steht im outputs-Dokument des Chats, NICHT im Repo aus Sicherheitsgründen>
```

Das Repo ist im aktuellen Container unter `/tmp/schatten-repo` schon geklont MIT Token im Remote.
**ABER: /tmp wird zwischen Sessions/Containern geleert.** Im neuen Chat ggf. neu klonen:

```bash
# Falls /tmp/schatten-repo fehlt — neu klonen:
cd /tmp && git clone https://x-access-token:<TOKEN — steht im outputs-Dokument des Chats, NICHT im Repo aus Sicherheitsgründen>@github.com/benlebt/Schatten.git schatten-repo
cd /tmp/schatten-repo
git config user.email "claude@schatten.local"
git config user.name "Claude (Engineering)"
```

**Push am Turn-Ende:**
```bash
cd /tmp/schatten-repo
cp /mnt/user-data/outputs/index.html .
cp /mnt/user-data/outputs/*.md .
git add -A
git commit -m "deutsche zeile, max 50 zeichen (vXXX)"
git push
```
Vercel deployt automatisch nach dem Push. Commit-Style: EINE deutsche Zeile, max 50 Zeichen.

---

## 🎮 PROJEKT-GRUNDLAGEN

- Vanilla `index.html` (~40.000+ Zeilen), serverloser `gemini.js`-Proxy (Systemprompt ~144.000 Zeichen).
- AI-Chain: Gemini 3.1 Flash-Lite (primär) → Mistral → Groq (Fallbacks).
- 14 Fälle. **NUR Margarete Stein ist `caseType:'politisch'`** (Pilot für alle neuen Systeme).
- Modell-Versions-Konstanten (`SCHATTEN_JS_VERSION`/`GEMINI_JS_VERSION`) in API-Antworten für Run-Log-Traceability.

### Margarete-Fall: Lösungs-Architektur (WICHTIG)
- **Hartes Lösen-Gate** = `politicalBeatsGateErfuellt()`:
  `schmuggelroute_belegt` (Beat) + `wahler_verantwortlich` (Beat ODER Engine-Wahler) + Sicherung
  + Beweis-Fundament (3 definierte Indizien, 1 belastend) — ABER seit v669 schlägt Doppel-Sicherung das Fundament (s.u.).
- **`politicalBeats` (5 Stück) sind WEICHE Führungsachse, KEIN Abschluss-Gate** (Z~4947). Der
  IM-"Anker"-Beat ist NICHT lösungs-pflichtig — nur Wahler + Route + Sicherung zählen hart.
- Sicherung: `akten_gesichert` (Karl trägt typ='beweis_dokument' und gibt es ab) UND
  (`margarete_gesichert` ODER `clientSecured`). clientSecuredAt = 'helene'/'doc_wagner'/'grenze'.
- Sicherungs-Wege: "Geben"-Verb, Reise zu Charité/Helene/Vera/Auffangstelle, "an Volkspolizei übergeben",
  Beweise-an-Roth/Vera-Buttons. STASI-DECKEL nach Sicherung (Spannung→2, kein Jagd-Loop).

---

## 📜 EISERNE BENJAMIN-REGELN (settled, gelten immer)

1. **SPIELER ENTSCHEIDET DIE PARTY — Eintritt UND Austritt. NIE Auto-Entfernung, NIE pauschale NPC-Sperre.**
   Das ist die wichtigste Regel. Bei Party-Drift NIE den NPC pauschal sperren — immer NUR den
   automatischen Aufnahme-/Nachzieh-Pfad treffen, bewusstes Mitnehmen bleibt heilig.
   - **3x vom Lektorat fälschlich "harter Auto-Remove/partyLockedOut" gefordert — NICHT bauen.**
   - Claude hat 2x dagegen verstoßen (August v662→zurück v664; Roth/Lindner v665→zurück v668).
   - **Roth UND Lindner DÜRFEN mitgenommen werden** — stärkste Begleiter (Polizisten, hoher Kampfwert).
   - August (Zeuge) DARF mitgenommen werden, wird nur nach Abschlussreife nicht automatisch nachgezogen.
2. **"Berichtet ≠ präsent"**: Telefon/Prosa-Berichte über einen NPC dürfen NIE Präsenz/Custody/
   zielpersonGefunden auslösen. Guards an allen Detektionspfaden.
3. Engine besitzt Ort/Anwesenheit/Klientenstatus/Custody/Items/NPC-Zustand/Stärke/Party
   ("Engine entscheidet, KI erzählt"). KI-Prosa nur für Ton/Noir/Historik.
4. Nur DEFINIERTE Indizien + Strict Mode. Beweis-Items nie tauschbar/werfbar.
5. "Wenn ein Button klickbar ist, muss er sauber wirken" — nie still fehlschlagen.
6. Stärke nicht geschlechtsbasiert. Deterministisch (kein RNG außer dokumentiertem Vf=2-Verletzungs-Malus).
7. **Gameplay-Feel-Änderungen brauchen Benjamins EXPLIZITE Freigabe** (per ask_user_input_v0 fragen).
   Reine Technik-/Stabilitäts-Fixes sind Claudes Entscheidung.
8. **Lektorate gegen echten Code/Run verifizieren** — sie laufen oft auf VERALTETER Version und
   erfinden teils Funktionsnamen (`_hatIndiz`, `_setNpcLocation`, `partyLockedOut` existieren NICHT).
   Claude-Code-Verifikation ist autoritativ.
9. Claude-Fehler ehrlich + direkt eingestehen. Kleine getestete Schritte.
10. **Historische Anachronismen disqualifizierend**: Berlin-Mauer (erst 1961), Stalinallee→Karl-Marx-Allee
    (1961), KGB-Naming (1954), Trabant (1957).

---

## 🆕 WAS IN DIESER SESSION PASSIERT IST (v664–v670)

- **v664** (`0bb987d`): August-Auto-Remove ZURÜCKGENOMMEN (Regelverstoß). Umsehen-Toast-Cooldown
  gefixt (variant 'success'→'clue', umgeht 3-Szenen-Cooldown — DAS war "kein Toast"-Wurzel: Items
  WURDEN gesammelt, nur Toast verschluckt).
- **v665** (`be2ee8c`): [TEILS ZURÜCK in v668] Behördenkontakte-Ablehnung. War zu hart.
- **v666** (`e09d1b6`): Umsehen-Indizien ziehen Stage SOFORT hoch. Neue Funktion `_stageFloorAnwenden()`
  (Stage0→1 ab Floor≥1&Sz≥4; 1→2 ab Floor≥2&Sz≥6; 2→3 ab Floor≥3&Sz≥6; Stage4 NIE über Floor).
  Wurzel: Floor wurde gesetzt, aber Stage-Aufstieg läuft nur im Szenen-Pfad; Umsehen löst keine Szene.
- **v667** (`d85adeb`): (2) Vera/KONTAKT bekommt eigenes Symbol 📇 (war 🤝 wie Verbündete, aber KONTAKT
  nicht mitnehmbar). (3) NPC-Indiz-Vorschau: `_npcHatOffenenHinweis()` → Personen-Button zeigt gold
  "● hat einen Hinweis". (4) eintauschen-Toast: doppeltes Icon 📋📋 raus (iconOverride), Plan-Label ohne
  toLowerCase ("Eintauschen für Info").
- **v668** (`0f12b6f`): Roth/Lindner-Sperre KOMPLETT ZURÜCKGENOMMEN (Benjamin: dürfen mit, stärkste
  Begleiter). + Party-Origin-Logging: `_partyAdd` loggt Aufruf-Ursprung (`✦ PARTY +: X · via <codepfad>`).
- **v669** (`d635bfc`): **GATE-FIX (Benjamin-Freigabe)**: Doppel-Sicherung schlägt Indizien-Minimum.
  Wenn beim Margarete-Fall BEIDE echten Engine-Sicherungen vollzogen + Route belegt → `_fundamentOk`
  gilt erfüllt (Sicherung IST der Beleg, härter als 3 Indizien). Bypass NUR bei echten Sicherungen
  (nicht KI-fälschbar) → Verschenk-Schutz bleibt. + "siehe Notizbuch" aus Item-Toast raus (Notizbuch
  zeigt Indizien, nicht Items). + Flucht-nach-Fesseln: Anti-Flucht-Hinweis zusätzlich an ANFANG des
  Konflikt-Prompts (Bookending wirkt bei LLMs stärker).
- **v670** (`4290ff2`): Lösen-Sperrgrund nennt KONKRETE Punkte ("GESPERRT · noch offen: Wahler als
  Verantwortlichen belegen") statt pauschal "politische Wahrheit noch nicht belegt". + Roth-Drift-
  Diagnose geschärft (Party-Garantie loggt sinceScene+tag).

---

## 🔴 OFFENER HAUPT-BUG: ROTH-PARTY-DRIFT (höchste Priorität)

**Symptom**: Roth landet in `_party` und reist mit, obwohl Benjamin ihn nicht per Klick hinzugefügt hat.

**Was verifiziert ist** (Run 2336):
- NULL `PARTY +:`-Events für Roth → er kam NIE über `_partyAdd` (mit Ablehn-Check) rein.
- Cast zeigt Roth DOPPELT: "Wilhelm Roth" | "Kommissar Wilhelm Roth" — zwei Namensformen.
- `_istInParty` matcht diese nicht (erste Tokens "wilhelm" vs "kommissar" verschieden).
- Garantie behandelt ihn trotzdem als Party-Mitglied (`party-garantie-AUFGENOMMEN`).
- → Roth ist über einen SCHLEICHPFAD in `_party` (nicht `_partyAdd`).
- Snapshot-Restore (Z~38186, `_party = snap.party`) konserviert nur, ist NICHT Ursprung.

**Nächster Schritt** (SOBALD ein frisches Run-Log da ist):
1. Im neuen Run nach `PARTY +:.*via` suchen → zeigt den Codepfad, der `_partyAdd` für Roth aufruft.
2. ODER nach `party-garantie.*sinceScene=?` → wenn sinceScene fehlt/0, kam Roth außerhalb _partyAdd rein.
3. DANN gezielt NUR diesen Auto-/Schleichpfad fixen. **KEINE pauschale Roth-Sperre** (verletzt Regel!).
- Verdacht: Doppelname-Problem könnte Teil der Wurzel sein (Garantie sieht "fehlt" wegen Namens-Mismatch,
  zieht nach — aber WIE kam er initial in _party? Das ist die offene Frage).

---

## 📋 WEITERE OFFENE PUNKTE (Lektorat-Reste, vor Bau verifizieren!)

**Aus v668/v669-Lektoraten (P1/P2):**
- Ort-Prosa-Bruch ab Stage 3 HART retryen/fallbacken (KI erzählt am falschen Ort; Header korrigiert,
  Prosa nicht). Lektorat will `retryWithHardLocationPrompt()` / `localFallbackSceneAt()`.
- Nach `caseReadyToResolve`: keine neuen PLAN_ZUGRIFF-Bot-Vorschläge, Abschluss priorisieren.
- Gezielte Restziel-Anzeige wenn Lösen gesperrt ("Noch offen: Wahler / IM Anker") — v670 hat Sperrgrund-
  Text, aber evtl. noch prominentere UI gewünscht.
- Setup-Cast-Audit Alias-Mapping: Mertens/Roth/Mann-im-Mantel zählen als "nicht bespielt" obwohl zentral
  (Audit-Bug, nicht Spiel-Bug). Zählen soll: Name/Alias in Szene, personenImRaum, Cast, NPCZ, Systemaktions-Ziel.
- Toast "Schwer verletzt" nach URSACHE differenzieren: Müdigkeit/Blutverlust → "kritisch angeschlagen";
  Schuss/Messer/Bruch → "schwer verletzt".
- "Genosse Mauer" durch Mertens = zu dick aufgetragener DDR-Sprech (KI-Ton). Eher "Herr Mauer"/"Mauer".
- "Roth verstaubt"→"verstummt" (KI-Sprachfehler).

**Flucht-nach-Fesseln** (v669 Bookending-Fix): beim nächsten Run prüfen, ob es hält. Ist KI-Verhalten,
keine harte Garantie — falls weiter Flucht, härter nachsteuern.

**Architektur-Test ausstehend**: Reiner Run mit `KI_OPTIONEN_AKTIV=false` (Konstante steht seit v656).
Lektorat fordert das wiederholt, um "Baukasten-First trägt wirklich" zu beweisen.

**Später/größer**: Actionlastigkeit nach Sicherung dämpfen (maxSpannung≤4); Bildungsachsen stärken
(Papierstaat/Versorgung: Dienstsiegel/Frachtstempel/Hausbuch/Meldezettel — nur wenn Engine Indiz/Item
kennt); Item-Stack für gleiche Flavor-Items; STASI-NPC-Befragen als Konfrontieren/Hinhalten labeln.

---

## 🧩 SCHLÜSSEL-FUNKTIONEN & ORTE (zum schnellen Finden mit grep)

- **Party**: `_party` (global), `_partyAdd` (nur Spieler-Klick: Popup + Begleiter-Befehl; loggt Origin),
  `_partyRemove`, `_istInParty`, `_npcLehntMitnahmeAb` (Wirt/Arzt/Kontakt/... abgelehnt — OHNE Polizei!),
  Party-Garantie (~Z33340ff, zieht _party in Cast; Zeugen-Skip nach Abschlussreife).
- **Indizien/Stage**: `_markiereIndizGefunden`, `_stageFloorAnwenden` (v666), `_npcHatOffenenHinweis` (v667),
  `offeneIndizienAmOrtNachErreichbarkeit`, `caseHasDefinedEvidence`. Felder: id, text, npc, quelle
  ('person'/'umgebung'/'start'), zeit[], schluessel[], stage, itemType, actions[].
- **Umsehen-Button** (🔎, renderOptions): findet Items + erreichbare quelle≠'person'-Indizien in 1 Klick.
  quelle:'person'-Indizien (lemke_belastet_wahler, anker_kontakt_hinweis) NUR per Befragung.
- **Lösen-Gate**: `politicalBeatsGateErfuellt()` (~Z13206, gibt {aktiv,erfuellt,basisOk,sicherungOk,fehlend}).
  Sperrgrund-Render ~Z21466ff (nutzt fehlend-Liste seit v670).
- **Baukasten**: `BAUKASTEN_AKTIONEN` (~Z7765ff), `_renderBaukasten` (WER→WEN→ITEM→AKTION dynamisch),
  `_planAusfuehren` (~Z7690ff, `_istKonfliktPlan` entscheidet Rahmen; Konflikt-Prompt mit Anti-Flucht-Bookending).
- **Stärke/Härte**: `ROLLEN_STAERKE`, `_akteurStaerke`, `GEGNER_HAERTE`/`_gegnerHaerte`. NPC-Zustände:
  frei|ko|gefesselt|fixiert|benommen|abgelenkt|geblendet|angewidert|uebergeben|geflohen.
- **Toast**: `showProgressToast(title, subtitle, variant, triggerKey, iconOverride)`, `canShowToast`
  (variant 'clue' umgeht Cooldown IMMER). Cooldown: success max 1x/3 Szenen.
- **Bot-Modi: NUR `natürlich`, `offensiv`, `random`** — keine anderen (nicht defensiv/erkunden/cautious/etc.).

---

## ⚠️ INFRASTRUKTUR-HINWEISE

- **API-503-Fehler** ("service unavailable", Gemini) = Google-seitiger Ausfall, KEIN Code-Bug.
- **Credits**: Benjamins Gemini-Prepay-Credits gehen zeitweise aus → Runs brechen ab. Er testet, wenn
  Credits da sind. Billing im Google AI Studio.
- Umlaut-Handling bei str_replace-Problemen: Python `io.open(..., encoding='utf-8')`.
- `node --check` fängt KEINE ReferenceErrors/Scope-Fehler — nur Syntax.

---

## 📂 DATEIEN (alle in /mnt/user-data/outputs/ + Repo)

- `index.html` (das Spiel)
- `SCHATTEN_PROJEKT.md` (Haupt-Doku, chronologischer Changelog — IMMER fortschreiben)
- `KONZEPT_BAUKASTEN_FIRST.md`
- Ältere Konzepte: KONZEPT_STAERKEN_HAERTE / ITEM_KATALOG / WELTWAHRHEIT / CUSTODY_ENGINE /
  SICHERUNG_ENGINE, PLAN_Umbau1_Ortssystem (Kontext, selten gebraucht)

---

## ▶️ ERSTER SCHRITT IM NEUEN CHAT

1. Kopien holen (Datei-Workflow oben), Version mit grep verifizieren (sollte v7.12.670 sein).
2. `/tmp/schatten-repo` prüfen/neu klonen (GitHub-Block oben).
3. Benjamins neue Nachricht abwarten. Wenn ein neues Run-Log dabei ist → ZUERST nach Roth-Drift-Origin
   suchen (`grep "PARTY +:.*via"` und `grep "party-garantie.*sinceScene"`), das ist der wichtigste offene Bug.
4. Lektorate immer gegen echten Code verifizieren, bevor du etwas baust.
