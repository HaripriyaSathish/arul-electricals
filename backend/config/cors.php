<?php
/**
 * CORS headers for the React frontend.
 */
$allowed = array_filter(array_map('trim', explode(',', env('CORS_ORIGINS', ''))));
$origin  = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($origin && (in_array($origin, $allowed, true) || preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#', $origin))) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
