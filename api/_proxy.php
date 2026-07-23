<?php
declare(strict_types=1);

/**
 * Hetzner-Webhosting-Adapter für die bestehenden Vercel-Modellproxys.
 *
 * Geheimnisse bleiben weiterhin ausschließlich in den Vercel-Umgebungsvariablen.
 * Der Adapter reicht nur JSON-Body und das vom Browser gelieferte X-Spiel-Auth
 * weiter. Direkter HTTP-Zugriff auf diese Hilfsdatei wird in api/.htaccess
 * gesperrt; aufgerufen wird sie ausschließlich durch die drei Provider-Wrapper.
 */
function schatten_proxy(string $provider): void
{
    $allowedProviders = array('gemini', 'groq', 'mistral');
    if (!in_array($provider, $allowedProviders, true)) {
        http_response_code(404);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array('error' => array('message' => 'Unbekannter Provider.')));
        return;
    }

    $method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper((string) $_SERVER['REQUEST_METHOD']) : 'GET';
    if ($method === 'OPTIONS') {
        http_response_code(204);
        header('Allow: POST, OPTIONS');
        return;
    }
    if ($method !== 'POST') {
        http_response_code(405);
        header('Allow: POST, OPTIONS');
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array('error' => array('message' => 'Method not allowed')));
        return;
    }

    if (!function_exists('curl_init')) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array('error' => array(
            'message' => 'Die PHP-cURL-Erweiterung ist auf dem Webspace nicht aktiviert.'
        )));
        return;
    }

    $apiOrigin = getenv('SCHATTEN_API_ORIGIN');
    if (!is_string($apiOrigin) || trim($apiOrigin) === '') {
        $apiOrigin = 'https://schatten-dusky.vercel.app';
    }
    $targetUrl = rtrim($apiOrigin, '/') . '/api/' . $provider;
    $requestBody = file_get_contents('php://input');
    if ($requestBody === false) {
        $requestBody = '';
    }

    $forwardHeaders = array('Content-Type: application/json');
    if (isset($_SERVER['HTTP_X_SPIEL_AUTH']) && $_SERVER['HTTP_X_SPIEL_AUTH'] !== '') {
        $forwardHeaders[] = 'X-Spiel-Auth: ' . (string) $_SERVER['HTTP_X_SPIEL_AUTH'];
    }

    $curl = curl_init($targetUrl);
    curl_setopt_array($curl, array(
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $requestBody,
        CURLOPT_HTTPHEADER => $forwardHeaders,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_TIMEOUT => 180,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_HEADER => false,
    ));

    $responseBody = curl_exec($curl);
    if ($responseBody === false) {
        $message = curl_error($curl);
        curl_close($curl);
        http_response_code(502);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(array('error' => array(
            'message' => 'Modell-Proxy nicht erreichbar: ' . $message
        )));
        return;
    }

    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $contentType = curl_getinfo($curl, CURLINFO_CONTENT_TYPE);
    curl_close($curl);

    http_response_code($status > 0 ? $status : 502);
    header('Content-Type: ' . (is_string($contentType) && $contentType !== ''
        ? $contentType
        : 'application/json; charset=utf-8'));
    header('Cache-Control: no-store');
    echo $responseBody;
}
