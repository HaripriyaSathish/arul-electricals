<?php
/**
 * Bearer token guard for /api/admin/* routes.
 */
class AuthMiddleware
{
    public static ?array $admin = null;

    public static function token(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
        if (!$header && function_exists('getallheaders')) {
            foreach (getallheaders() as $k => $v) {
                if (strtolower($k) === 'authorization') $header = $v;
            }
        }
        return preg_match('/Bearer\s+([a-f0-9]{64})/i', $header, $m) ? $m[1] : null;
    }

    public static function handle(): void
    {
        $token = self::token();
        if (!$token) Response::error('Please log in to continue.', 401);

        $admin = Database::one(
            'SELECT a.id, a.username, a.name, a.last_login, s.id AS session_id, s.expires_at
               FROM admin_sessions s JOIN admins a ON a.id = s.admin_id
              WHERE s.token_hash = ? AND s.expires_at > ' . Database::now(),
            [hash('sha256', $token)]
        );
        if (!$admin) Response::error('Your session has expired. Please log in again.', 401);

        self::$admin = $admin;
    }
}
