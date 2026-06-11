# Konzept: Gewahrsam als Engine-Ereignis (statt Texterkennung)

Status: IDEE/KONZEPT, von Benjamin angestoßen (Run 1800: "sollte Gewahrsam weniger texterkennungs- und mehr von
unserer Engine getrieben und entschieden werden?"). ChatGPT-Lektorat unabhängig zum selben Schluss (P1: Gewahrsam
und Notflucht semantisch falsch gekoppelt). NOCH NICHT GEBAUT - nach Items/NPC-Actions oder bei nächstem Custody-Bug.

## Das Problem (Run 1800, Sz20-22)
Heute: Engine pusht "Festnahme einbauen" (forceCustodyNextScene bei Tension-Streak) -> KI erzählt IRGENDWAS ->
Regex rät aus der Prosa, ob Karl nun gefangen ist (text-confirmed-custody). Im Run: Karl BESIEGT die MfS-Männer,
fesselt sie mit ihren eigenen Handschellen -> Regex las "handschellen" -> GEWAHRSAM + Notflucht-Button, obwohl Karl
der Sieger war. v594 fixt die Handschellen-Richtung, aber das Grundmuster bleibt fragil: KI-Prosa ist die Quelle
der Wahrheit für einen harten Engine-Zustand.

## Die Lösung (gleiche Architektur wie Indizien v592 + Sicherung v587)
ENGINE ENTSCHEIDET, KI ERZÄHLT - nicht umgekehrt:
1. Die Engine entscheidet das EREIGNIS: "In dieser Szene wird Karl festgenommen" (Trigger: konkrete Bedingungen,
   nicht nur Tension-Streak - z.B. Wahler überführt + Mertens anwesend + Karl flieht nicht + Würfel).
2. Die KI bekommt es als PFLICHT-VORGABE: "ZIEL-EREIGNIS: Karl wird in dieser Szene überwältigt und festgenommen.
   Erzähle WIE (Übermacht, Hinterhalt, Waffe im Rücken). Karl entkommt NICHT."
3. Die Engine setzt karlInStasiCustody=true DETERMINISTISCH (kein Text-Raten). Spieler-Gegenwehr in der Szene davor
   (Flucht-Klick) kann das Ereignis abwenden - das ist die faire Spieler-Chance, wie heute das "Fluchtfenster".
4. Befreiung ebenso: Notflucht-Klick -> Engine würfelt -> Ergebnis steht fest -> KI erzählt Erfolg ODER Scheitern.

## Saubere Begriffs-Trennung (ChatGPT)
- stasiThreatActive = MfS-Männer da, Gefahr, Flucht-Button -> KEIN Gewahrsam.
- karlInStasiCustody = Karl ist GEFANGEN (überwältigt/abgeführt/Zelle) -> Notflucht-Button.
Heute verschwimmt das: Notflucht erschien, während Karl frei kämpfte.

## Bausteine
- C1: Trigger-Bedingungen definieren (ereignisbasiert statt Streak-only). Tension-Streak kann EIN Faktor bleiben.
- C2: ZIEL-EREIGNIS-Vorgabe im recap (analog ZIEL-INDIZ) + deterministisches Setzen.
- C3: Text-Regex (text-confirmed-custody) wird zum reinen KONSISTENZ-CHECK degradiert (diag-Warnung bei Widerspruch,
  setzt aber keinen State mehr).
- C4: Begriffs-Trennung Threat vs Custody in Buttons (Flucht vs Notflucht).
- C5: Party-Frage (Benjamin: "sind wir alle in einer Zelle?"): Begleiter bei Festnahme -> Engine entscheidet
  (zerstreut/ebenfalls festgenommen/entkommen) und sagt es der KI. Dramaturgisch wertvoll.

## Verhältnis zu v594
v594 (Handschellen-Richtung) bleibt als Akut-Fix sinnvoll - C3 macht ihn später zum Konsistenz-Check.
