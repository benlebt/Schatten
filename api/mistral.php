<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
http_response_code(503);
echo json_encode(array('error' => array(
    'message' => 'Mistral ist auf diesem Hetzner-System derzeit nicht konfiguriert.',
    'type' => 'provider_disabled'
)));
