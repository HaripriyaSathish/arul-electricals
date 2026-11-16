<?php
/**
 * Consistent JSON responses: { success, message, data, errors }
 */
class Response
{
    public static function json($payload, int $code = 200): void
    {
        http_response_code($code);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function ok($data = null, ?string $message = null, int $code = 200): void
    {
        self::json(['success' => true, 'message' => $message, 'data' => $data], $code);
    }

    public static function error(string $message, int $code = 400, $errors = null): void
    {
        self::json(['success' => false, 'message' => $message, 'errors' => $errors], $code);
    }
}
