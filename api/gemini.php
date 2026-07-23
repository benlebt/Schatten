<?php
declare(strict_types=1);

/**
 * Nativer Hetzner-Proxy fuer Google Gemini.
 *
 * Der Browser sendet niemals einen API-Key. GEMINI_API_KEY wird ausschliesslich
 * aus der geschuetzten api/.htaccess gelesen. Der komplette Spielbetrieb ist
 * damit unabhaengig von Vercel.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper((string) $_SERVER['REQUEST_METHOD']) : 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($method !== 'POST') {
    http_response_code(405);
    header('Allow: POST, OPTIONS');
    echo json_encode(array('error' => array('message' => 'Method not allowed')));
    exit;
}
if (!function_exists('curl_init')) {
    http_response_code(500);
    echo json_encode(array('error' => array('message' => 'PHP-cURL ist auf dem Hetzner-Webspace nicht aktiviert.')));
    exit;
}

$apiKey = getenv('GEMINI_API_KEY');
if (!is_string($apiKey) || trim($apiKey) === '') {
    http_response_code(500);
    echo json_encode(array('error' => array(
        'message' => 'GEMINI_API_KEY fehlt in api/.htaccess.',
        'type' => 'server_config'
    )));
    exit;
}
$apiKey = trim($apiKey);

$rawRequest = file_get_contents('php://input');
$request = json_decode($rawRequest === false ? '' : $rawRequest, true);
if (!is_array($request)) {
    http_response_code(400);
    echo json_encode(array('error' => array('message' => 'Ungueltiger JSON-Request.')));
    exit;
}

// Tokenfreier Live-Check fuer Deployment und Monitoring.
if (!empty($request['authCheck']) || !empty($request['configCheck'])) {
    echo json_encode(array(
        'ok' => true,
        'runtime' => 'hetzner-direct',
        'provider' => 'gemini'
    ));
    exit;
}

$messages = isset($request['messages']) && is_array($request['messages'])
    ? $request['messages']
    : array();
if (count($messages) === 0) {
    http_response_code(400);
    echo json_encode(array('error' => array('message' => 'messages-Array fehlt im Request-Body.')));
    exit;
}

$allowedModels = array(
    'gemini-2.5-flash' => true,
    'gemini-2.5-flash-lite' => true,
    'gemini-2.5-pro' => true,
    'gemini-3-flash-preview' => true,
    'gemini-3.1-flash-lite' => true,
    'gemini-3.1-pro-preview' => true,
    'gemini-3.5-flash' => true,
);
$requestedModel = isset($request['model']) ? (string) $request['model'] : '';
$modelAccepted = isset($allowedModels[$requestedModel]);
$model = $modelAccepted ? $requestedModel : 'gemini-3.1-flash-lite';

$systemInstruction = '';
$contents = array();
foreach ($messages as $message) {
    if (!is_array($message)) {
        continue;
    }
    $role = isset($message['role']) ? (string) $message['role'] : '';
    $content = isset($message['content']) ? (string) $message['content'] : '';
    if ($role === 'system') {
        $systemInstruction .= ($systemInstruction === '' ? '' : "\n\n") . $content;
    } elseif ($role === 'user') {
        $contents[] = array('role' => 'user', 'parts' => array(array('text' => $content)));
    } elseif ($role === 'assistant') {
        $contents[] = array('role' => 'model', 'parts' => array(array('text' => $content)));
    }
}
if (count($contents) === 0) {
    http_response_code(400);
    echo json_encode(array('error' => array('message' => 'Keine User-/Assistant-Nachrichten vorhanden.')));
    exit;
}

$stringArray = array('type' => 'array', 'items' => array('type' => 'string'));
$responseSchema = array(
    'type' => 'object',
    'properties' => array(
        'szene' => array('type' => 'string'),
        'ort' => array('type' => 'string'),
        'optionen' => array(
            'type' => 'array',
            'items' => array(
                'type' => 'object',
                'properties' => array(
                    'id' => array('type' => 'string'),
                    'text' => array('type' => 'string'),
                    'kategorie' => array(
                        'type' => 'string',
                        'enum' => array('OFFENSIV', 'DEFENSIV', 'ERKUNDEN', 'BEOBACHTEN')
                    ),
                ),
                'required' => array('id', 'text', 'kategorie'),
            ),
            'minItems' => 4,
            'maxItems' => 4,
        ),
        'spannung' => array('type' => 'integer'),
        'zusammenfassung' => array('type' => 'string'),
        'verfassung_delta' => array('type' => 'integer'),
        'verletzungsbeschreibung' => array('type' => 'string'),
        'inventar_hinzugefuegt' => $stringArray,
        'inventar_entfernt' => $stringArray,
        'cast_hinzugefuegt' => array(
            'type' => 'array',
            'items' => array(
                'type' => 'object',
                'properties' => array(
                    'name' => array('type' => 'string'),
                    'rolle' => array('type' => 'string'),
                    'beziehung' => array('type' => 'string'),
                ),
                'required' => array('name'),
            ),
        ),
        'cast_entfernt' => $stringArray,
        'personenImRaum' => $stringArray,
        'indiz_neu' => $stringArray,
        'tatverdaechtiger_identifiziert' => array('type' => 'string'),
        'tatverdaechtiger_ueberfuehrt' => array('type' => 'boolean'),
        'klient_berichtet' => array('type' => 'boolean'),
        'gewahrsam' => array('type' => 'boolean'),
        'zielperson_gefunden' => array('type' => 'boolean'),
        'wahrheit_erkannt' => array('type' => 'boolean'),
        'indiz_verbindung' => $stringArray,
        'npc_kernhinweis' => array(
            'type' => 'array',
            'items' => array(
                'type' => 'object',
                'properties' => array(
                    'npc' => array('type' => 'string'),
                    'hinweis' => array('type' => 'string'),
                ),
                'required' => array('npc', 'hinweis'),
            ),
        ),
    ),
    'required' => array('szene', 'ort', 'optionen', 'spannung', 'zusammenfassung'),
);

$geminiBody = array(
    'contents' => $contents,
    'generationConfig' => array(
        'temperature' => 0.9,
        'maxOutputTokens' => 3000,
        'responseMimeType' => 'application/json',
        'responseSchema' => $responseSchema,
    ),
);
if ($systemInstruction !== '') {
    $geminiBody['systemInstruction'] = array(
        'parts' => array(array('text' => $systemInstruction))
    );
}

$url = 'https://generativelanguage.googleapis.com/v1beta/models/' .
    rawurlencode($model) . ':generateContent?key=' . rawurlencode($apiKey);
$curl = curl_init($url);
curl_setopt_array($curl, array(
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($geminiBody, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    CURLOPT_HTTPHEADER => array('Content-Type: application/json'),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 15,
    CURLOPT_TIMEOUT => 180,
    CURLOPT_FOLLOWLOCATION => false,
));

$rawResponse = curl_exec($curl);
if ($rawResponse === false) {
    $message = curl_error($curl);
    curl_close($curl);
    http_response_code(502);
    echo json_encode(array('error' => array(
        'message' => 'Verbindung zu Gemini fehlgeschlagen: ' . $message
    )));
    exit;
}
$status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
curl_close($curl);

$data = json_decode((string) $rawResponse, true);
if (!is_array($data)) {
    http_response_code(502);
    echo json_encode(array('error' => array(
        'message' => 'Gemini antwortete nicht mit JSON: ' . substr((string) $rawResponse, 0, 300)
    )));
    exit;
}

if ($status < 200 || $status >= 300) {
    $error = isset($data['error']) && is_array($data['error']) ? $data['error'] : array();
    $message = isset($error['message']) ? (string) $error['message'] : (string) $rawResponse;
    $geminiStatus = isset($error['status']) ? (string) $error['status'] : '';
    if ($status === 429 || $geminiStatus === 'RESOURCE_EXHAUSTED') {
        http_response_code(429);
        echo json_encode(array('error' => array(
            'message' => 'Rate limit reached: ' . $message,
            'type' => 'rate_limit'
        )));
        exit;
    }
    http_response_code($status > 0 ? $status : 502);
    echo json_encode(array(
        'error' => array('message' => $message, 'status' => $geminiStatus),
        '_runtime' => 'hetzner-direct',
        '_modelRequested' => $requestedModel,
        '_modelUsed' => $model,
        '_modelRejected' => !$modelAccepted,
    ));
    exit;
}

$candidate = isset($data['candidates'][0]) && is_array($data['candidates'][0])
    ? $data['candidates'][0]
    : array();
$finishReason = isset($candidate['finishReason']) ? (string) $candidate['finishReason'] : '';
$text = isset($candidate['content']['parts'][0]['text'])
    ? (string) $candidate['content']['parts'][0]['text']
    : '';

if (in_array($finishReason, array('SAFETY', 'RECITATION', 'BLOCKLIST'), true)) {
    http_response_code(502);
    echo json_encode(array('error' => array(
        'message' => 'Gemini hat die Antwort blockiert (' . $finishReason . ').',
        'type' => 'blocked'
    )));
    exit;
}
if ($text === '') {
    http_response_code(502);
    echo json_encode(array('error' => array(
        'message' => 'Gemini lieferte keine Textantwort.',
        'raw' => substr((string) $rawResponse, 0, 500)
    )));
    exit;
}

$truncated = $finishReason === 'MAX_TOKENS';
echo json_encode(array(
    'choices' => array(array(
        'message' => array('role' => 'assistant', 'content' => $text),
        'finish_reason' => $truncated ? 'length' : 'stop',
    )),
    'model' => $model,
    'usageMetadata' => isset($data['usageMetadata']) ? $data['usageMetadata'] : null,
    '_truncated' => $truncated,
    '_runtime' => 'hetzner-direct',
    '_modelRequested' => $requestedModel,
    '_modelUsed' => $model,
    '_modelRejected' => !$modelAccepted,
    '_geminiPhpVersion' => 'v1.0',
), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
