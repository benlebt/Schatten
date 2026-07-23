import { createHash, timingSafeEqual } from 'node:crypto';

// SHA-256 eines zufälligen, ausschließlich auf dem Hetzner-Webserver
// gespeicherten Verbindungsschlüssels. Der Hash erlaubt keine Anmeldung und
// kann deshalb gefahrlos versioniert werden.
const HETZNER_BRIDGE_SHA256 =
  'b08dcb286290de608c43b1e8d89ded346047c29ffc9720d31f459edfdebb1452';

function matchesHetznerBridgeSecret(value) {
  if (!value) return false;
  const actual = createHash('sha256').update(String(value), 'utf8').digest();
  const expected = Buffer.from(HETZNER_BRIDGE_SHA256, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function authorizeModelProxy(req) {
  const supplied = req.headers['x-spiel-auth'] || '';

  // Übergangspfad Hetzner -> Vercel: kein Nutzerpasswort, sondern ein zufälliges
  // Server-zu-Server-Geheimnis, das niemals den Browser erreicht.
  if (matchesHetznerBridgeSecret(supplied)) return true;

  // Rückwärtskompatibilität für die bisherige Vercel-Oberfläche, solange sie
  // noch existiert. Nach dem vollständigen PHP-Umzug kann dieser Zweig entfallen.
  const legacyPassword = process.env.SPIEL_PASSWORT || '';
  return Boolean(legacyPassword && supplied === legacyPassword);
}
